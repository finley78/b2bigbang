// BusTracking.jsx — 학원 차량 실시간 위치
// • 로그인된 사용자 누구나: 카카오 지도 + 차량 마커 (Supabase Realtime 자동 갱신)
// • 관리자/선생님: '운행 시작' 누르면 본인 휴대폰 GPS가 자동 송신
// 카카오 지도 API 키는 site_content (key='kakao_map_key', value={appkey:'…'})에 저장.

(function(){

  // 카카오 SDK 동적 로드
  function loadKakaoMaps(appkey) {
    return new Promise(function(resolve, reject){
      if (window.kakao && window.kakao.maps) return resolve(window.kakao);
      if (!appkey) return reject(new Error('Kakao API key not set'));
      var existing = document.querySelector('script[data-kakao-sdk="1"]');
      if (existing) {
        existing.addEventListener('load', function(){ window.kakao.maps.load(function(){ resolve(window.kakao); }); });
        return;
      }
      var script = document.createElement('script');
      script.src = '//dapi.kakao.com/v2/maps/sdk.js?appkey=' + appkey + '&autoload=false';
      script.async = true;
      script.setAttribute('data-kakao-sdk', '1');
      script.onload = function(){ window.kakao.maps.load(function(){ resolve(window.kakao); }); };
      script.onerror = function(){ reject(new Error('카카오 지도 SDK 로드 실패')); };
      document.head.appendChild(script);
    });
  }

  function fmtTimeAgo(ts) {
    if (!ts) return '아직 위치 없음';
    var ms = Date.now() - new Date(ts).getTime();
    var s = Math.floor(ms / 1000);
    if (s < 60) return s + '초 전';
    var m = Math.floor(s / 60);
    if (m < 60) return m + '분 전';
    var h = Math.floor(m / 60);
    return h + '시간 전';
  }

  function BusTrackingPage(props) {
    var sb = window.supabase;
    var user = props.user;
    var setPage = props.setPage;
    var isAdmin = !!props.isAdmin;
    // 선생님 여부 — student_id 또는 user.role 로 추정 (기존 패턴)
    var isTeacher = user && (user.role === 'teacher' || user.is_teacher);
    var canDrive = isAdmin || isTeacher;

    var [vehicle, setVehicle] = React.useState(null);
    var [loc, setLoc] = React.useState(null);
    var [appkey, setAppkey] = React.useState('');
    var [keyMissing, setKeyMissing] = React.useState(false);
    var [mapReady, setMapReady] = React.useState(false);
    var [error, setError] = React.useState('');
    var [now, setNow] = React.useState(Date.now()); // 갱신 시각 표시용 1초 틱

    // 차량 운행 모드 상태
    var [driving, setDriving] = React.useState(false);
    var [lastSent, setLastSent] = React.useState(null);

    // 정류장 관련 상태
    var [busStops, setBusStops] = React.useState([]);
    var [myStudentRow, setMyStudentRow] = React.useState(null); // { uses_bus, default_bus_stop_id, id, name }
    var [myEnrolledClasses, setMyEnrolledClasses] = React.useState([]); // [{id, name, day_times}]
    var [myClassesLoaded, setMyClassesLoaded] = React.useState(false);
    var [myTodayBoarding, setMyTodayBoarding] = React.useState(null); // 오늘 변경 행 (null이면 기본 정류장)
    var [stopSaving, setStopSaving] = React.useState(false);
    var [allTodayBoardings, setAllTodayBoardings] = React.useState([]); // 기사 모드: 오늘 전체 변경 행
    var [busStudents, setBusStudents] = React.useState([]); // 기사 모드: 차량 이용 학생 명단

    var CLASS_TIMES = window.B2Utils.CLASS_TIMES;
    var todayKstDateStr = window.B2Utils.todayKstDateStr;
    var todayKstDay = window.B2Utils.todayKstDay;
    function nowKstHHMM() {
      var d = new Date();
      var kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
      return String(kst.getUTCHours()).padStart(2,'0') + ':' + String(kst.getUTCMinutes()).padStart(2,'0');
    }
    // 학생의 오늘 수업 시간 — 등록된 반들의 day_times[오늘 요일] 중 가장 이른 시간 (없으면 fallback)
    function computeTodayClassTime() {
      var day = todayKstDay();
      var times = [];
      myEnrolledClasses.forEach(function(c){
        var dts = (c.day_times && typeof c.day_times === 'object') ? c.day_times : null;
        if (dts && dts[day]) times.push(dts[day]);
      });
      if (times.length) { times.sort(); return times[0]; }
      return (myStudentRow && myStudentRow.bus_class_time) || null;
    }
    // 정류장의 "다음 운행 시간" — 지금(KST) 이후 가장 가까운 시간. 모두 지나갔으면 null
    function nextTimeForStop(stop) {
      var times = (stop && stop.pickup_times && stop.pickup_times.length) ? stop.pickup_times.slice().sort() : [];
      if (!times.length) return null;
      var hhmm = nowKstHHMM();
      for (var i = 0; i < times.length; i++) {
        if (String(times[i]) >= hhmm) return times[i];
      }
      return null;
    }
    // 학생의 수업 시간에 맞는 정류장 픽업 시간 — pickup_times[클래스 인덱스]
    function pickupTimeForClass(stop, classTime) {
      var idx = CLASS_TIMES.indexOf(classTime);
      if (idx < 0) return null;
      var times = (stop && stop.pickup_times) ? stop.pickup_times : [];
      return times[idx] || null;
    }
    var todayStr = todayKstDateStr();

    var mapRef = React.useRef(null);
    var mapObjRef = React.useRef(null);
    var markerRef = React.useRef(null);
    var watchIdRef = React.useRef(null);
    var lastSendRef = React.useRef(0);

    // 1초마다 '몇 초 전' 텍스트 갱신
    React.useEffect(function(){
      var t = setInterval(function(){ setNow(Date.now()); }, 1000);
      return function(){ clearInterval(t); };
    }, []);

    // 초기 로드: 차량 정보 + 카카오 키 + 현재 위치
    // + 운행 중이던 기사가 새로고침했으면 driving 자동 복원 (마지막 송신 2분 이내일 때만)
    React.useEffect(function(){
      (async function(){
        try {
          var vRes = await sb.from('vehicles').select('*').eq('is_active', true).order('created_at').limit(1).maybeSingle();
          if (vRes && vRes.data) setVehicle(vRes.data);
          var kRes = await window.B2Utils.loadSiteContent('kakao_map_key');
          var ak = (kRes && (kRes.appkey || kRes.key)) || '';
          if (!ak) { setKeyMissing(true); return; }
          setAppkey(ak);
          if (vRes && vRes.data) {
            var lRes = await sb.from('vehicle_locations').select('*').eq('vehicle_id', vRes.data.id).maybeSingle();
            if (lRes && lRes.data) {
              setLoc(lRes.data);
              // 자동 운행 복원: is_driving=true & driver=본인 & 2분 이내 송신
              var isMine = user && lRes.data.driver_user_id && String(lRes.data.driver_user_id) === String(user.id);
              var ageMs = Date.now() - new Date(lRes.data.updated_at).getTime();
              if (canDrive && isMine && lRes.data.is_driving && ageMs < 2 * 60 * 1000) {
                setDriving(true);
              }
            }
          }
          // 정류장 목록
          var stopsRes = await sb.from('bus_stops').select('*').eq('is_active', true).order('sort_order').order('created_at');
          setBusStops((stopsRes && stopsRes.data) || []);
          // 본인 학생 행 (uses_bus, default_bus_stop_id, bus_application_status)
          if (user && user.id) {
            var myRes = await sb.from('students').select('id, name, uses_bus, default_bus_stop_id, bus_class_time, bus_application_status, role, is_active').eq('id', user.id).maybeSingle();
            if (myRes && myRes.data) {
              setMyStudentRow(myRes.data);
              // 오늘 변경 행 + 등록된 반들의 day_times
              if (myRes.data.uses_bus) {
                var tdy = todayKstDateStr();
                var bRes = await sb.from('bus_boardings').select('*').eq('student_id', myRes.data.id).eq('boarding_date', tdy).maybeSingle();
                setMyTodayBoarding((bRes && bRes.data) || null);
                var csRes = await sb.from('class_students').select('class_id').eq('student_id', myRes.data.id);
                var clsIds = ((csRes && csRes.data) || []).map(function(r){ return r.class_id; });
                if (clsIds.length) {
                  var clRes = await sb.from('classes').select('id, name, day_times').in('id', clsIds);
                  setMyEnrolledClasses((clRes && clRes.data) || []);
                }
                setMyClassesLoaded(true);
              }
            }
          }
        } catch (e) { setError('초기 로드 실패: ' + (e.message || e)); }
      })();
    }, []);

    // 기사 모드: 오늘 탑승 정보 로드 (운행 중일 때 30초마다 갱신)
    async function loadDriverBoardings() {
      try {
        var tdy = todayKstDateStr();
        var sRes = await sb.from('students').select('id, name, grade, uses_bus, default_bus_stop_id').eq('uses_bus', true).eq('is_active', true);
        setBusStudents((sRes && sRes.data) || []);
        var bRes = await sb.from('bus_boardings').select('*').eq('boarding_date', tdy);
        setAllTodayBoardings((bRes && bRes.data) || []);
      } catch (e) { console.error('탑승 정보 로드 실패:', e); }
    }
    React.useEffect(function(){
      if (!canDrive) return;
      loadDriverBoardings();
      var t = setInterval(loadDriverBoardings, 30 * 1000);
      return function(){ clearInterval(t); };
    }, [canDrive, driving]);

    // 차량 이용 신청 (학생) — status='pending'으로 표시
    async function applyForBus() {
      if (!myStudentRow) return;
      if (!confirm('차량 이용을 신청할까요? 관리자 승인 후 정류장 선택이 가능해집니다.')) return;
      try {
        var u = await sb.from('students').update({ bus_application_status: 'pending', bus_applied_at: new Date().toISOString() }).eq('id', myStudentRow.id).select().single();
        if (u.error) throw u.error;
        setMyStudentRow(Object.assign({}, myStudentRow, { bus_application_status: 'pending' }));
        alert('신청이 접수되었습니다. 관리자 승인을 기다려 주세요.');
      } catch (e) { alert('신청 실패: ' + (e.message || e)); }
    }
    // 신청 취소 (대기 중일 때만)
    async function cancelBusApplication() {
      if (!myStudentRow) return;
      if (!confirm('신청을 취소할까요?')) return;
      try {
        var u = await sb.from('students').update({ bus_application_status: 'none', bus_applied_at: null }).eq('id', myStudentRow.id);
        if (u.error) throw u.error;
        setMyStudentRow(Object.assign({}, myStudentRow, { bus_application_status: 'none' }));
      } catch (e) { alert('취소 실패: ' + (e.message || e)); }
    }

    // 학생이 정류장 선택 — 기본과 같으면 변경 행 삭제, 다르면 upsert
    async function pickStop(stopId, skip) {
      if (!myStudentRow) return;
      setStopSaving(true);
      try {
        var tdy = todayKstDateStr();
        var sameAsDefault = !skip && stopId && stopId === myStudentRow.default_bus_stop_id;
        if (sameAsDefault) {
          // 기본 정류장 복귀 — 오버라이드 행 있으면 삭제
          if (myTodayBoarding) {
            await sb.from('bus_boardings').delete().eq('id', myTodayBoarding.id);
            setMyTodayBoarding(null);
          }
        } else {
          var payload = {
            student_id: myStudentRow.id,
            boarding_date: tdy,
            stop_id: skip ? null : stopId,
            is_skip: !!skip,
            updated_at: new Date().toISOString(),
          };
          var existing = myTodayBoarding;
          if (existing) {
            var u = await sb.from('bus_boardings').update(payload).eq('id', existing.id).select().single();
            if (u.error) throw u.error;
            setMyTodayBoarding(u.data);
          } else {
            var ins = await sb.from('bus_boardings').insert(payload).select().single();
            if (ins.error) throw ins.error;
            setMyTodayBoarding(ins.data);
          }
        }
      } catch (e) { alert('저장 실패: ' + (e.message || e)); }
      finally { setStopSaving(false); }
    }

    // Wake Lock: 운행 중일 때 화면 안 꺼지게 (지원 브라우저만)
    React.useEffect(function(){
      var wakeLockRef = null;
      var released = false;
      async function acquire() {
        if (!driving) return;
        if (!('wakeLock' in navigator)) return; // iOS Safari 16.4+, Android Chrome 등에서 지원
        try {
          wakeLockRef = await navigator.wakeLock.request('screen');
          wakeLockRef.addEventListener('release', function(){ /* 시스템이 풀면 visibilitychange에서 재시도 */ });
        } catch (e) { /* 권한 없음·이미 잠금 등 — 무시 */ }
      }
      function onVisibility() {
        if (document.visibilityState === 'visible' && driving && !released) acquire();
      }
      if (driving) {
        acquire();
        document.addEventListener('visibilitychange', onVisibility);
      }
      return function(){
        released = true;
        document.removeEventListener('visibilitychange', onVisibility);
        if (wakeLockRef) { try { wakeLockRef.release(); } catch(e){} }
      };
    }, [driving]);

    // 카카오 지도 초기화
    React.useEffect(function(){
      if (!appkey || !mapRef.current || mapObjRef.current) return;
      loadKakaoMaps(appkey).then(function(kakao){
        var center = loc ? new kakao.maps.LatLng(loc.lat, loc.lng) : new kakao.maps.LatLng(37.5665, 126.9780); // 기본: 서울시청
        var map = new kakao.maps.Map(mapRef.current, { center: center, level: 4 });
        mapObjRef.current = map;
        setMapReady(true);
      }).catch(function(e){ setError('지도 로드 실패: ' + (e.message || e)); });
    }, [appkey]);

    // 차량 위치 변경 시 마커 갱신
    React.useEffect(function(){
      if (!mapReady || !loc) return;
      var kakao = window.kakao;
      var pos = new kakao.maps.LatLng(loc.lat, loc.lng);
      if (!markerRef.current) {
        markerRef.current = new kakao.maps.Marker({ position: pos, map: mapObjRef.current, title: (vehicle && vehicle.name) || '차량' });
      } else {
        markerRef.current.setPosition(pos);
      }
      mapObjRef.current.setCenter(pos);
    }, [mapReady, loc && loc.lat, loc && loc.lng]);

    // Realtime 구독: 차량 위치 변경
    React.useEffect(function(){
      if (!vehicle) return;
      var channel = sb.channel('vehicle_loc_' + vehicle.id)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicle_locations', filter: 'vehicle_id=eq.' + vehicle.id }, function(payload){
          if (payload.new) setLoc(payload.new);
        })
        .subscribe();
      return function(){ try { sb.removeChannel(channel); } catch(e){} };
    }, [vehicle && vehicle.id]);

    // 차량 운행 모드: GPS watchPosition + 30초마다 업로드
    React.useEffect(function(){
      if (!driving || !vehicle) return;
      if (!navigator.geolocation) { alert('이 브라우저는 위치 기능을 지원하지 않습니다.'); setDriving(false); return; }
      watchIdRef.current = navigator.geolocation.watchPosition(function(pos){
        var t = Date.now();
        // 마지막 송신으로부터 25초 지났을 때만 업로드 (배터리·DB 절약)
        if (t - lastSendRef.current < 25000) return;
        lastSendRef.current = t;
        var row = {
          vehicle_id: vehicle.id,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          heading: pos.coords.heading != null ? pos.coords.heading : null,
          speed: pos.coords.speed != null ? (pos.coords.speed * 3.6) : null, // m/s → km/h
          accuracy: pos.coords.accuracy,
          is_driving: true,
          driver_user_id: (user && user.id) || null,
          updated_at: new Date().toISOString(),
        };
        sb.from('vehicle_locations').upsert(row, { onConflict: 'vehicle_id' }).then(function(r){
          if (r.error) console.warn('위치 업로드 실패:', r.error);
          else setLastSent(t);
        });
      }, function(err){
        alert('위치 권한이 필요합니다: ' + err.message);
        setDriving(false);
      }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 30000 });
      return function(){
        if (watchIdRef.current != null) { navigator.geolocation.clearWatch(watchIdRef.current); watchIdRef.current = null; }
      };
    }, [driving, vehicle && vehicle.id]);

    async function startDriving() {
      if (!vehicle) return;
      lastSendRef.current = 0; // 다음 위치 즉시 전송
      setDriving(true);
    }
    async function stopDriving() {
      setDriving(false);
      if (vehicle) {
        try { await sb.from('vehicle_locations').update({ is_driving: false }).eq('vehicle_id', vehicle.id); } catch (e) {}
      }
    }

    // 헤더
    var header = React.createElement('div', { style:{ background:'#1A1A1A', padding:'18px 20px', color:'#fff', fontFamily:'Manrope, sans-serif' } },
      React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'10px' } },
        React.createElement('button', { onClick:function(){ setPage('home'); }, style:{ background:'transparent', color:'#fff', border:'none', cursor:'pointer', fontSize:'13px', fontWeight:'800' } }, '← 홈'),
        React.createElement('div', null,
          React.createElement('div', { style:{ fontSize:'18px', fontWeight:'800' } }, (vehicle && vehicle.name) || '학원 차량'),
          React.createElement('div', { style:{ fontSize:'12px', color:'rgba(255,255,255,0.6)' } }, vehicle && vehicle.route ? vehicle.route : '실시간 위치')
        )
      )
    );

    if (keyMissing) {
      return React.createElement('div', { style:{ minHeight:'100vh', background:'#f8fafc' } },
        header,
        React.createElement('div', { style:{ padding:'40px 20px', textAlign:'center', maxWidth:'500px', margin:'0 auto', fontFamily:'Manrope, sans-serif' } },
          React.createElement('div', { style:{ fontSize:'15px', fontWeight:'800', color:'#1A1A1A', marginBottom:'8px' } }, '카카오 지도 API 키 설정 필요'),
          React.createElement('div', { style:{ fontSize:'13px', color:'rgba(0,0,0,0.55)', lineHeight:'1.7' } },
            React.createElement('div', null, '1. developers.kakao.com 에서 앱 만들고 JavaScript 키를 받으세요'),
            React.createElement('div', null, '2. 관리자 페이지에서 "차량 위치" → "지도 키 설정"으로 입력'),
            React.createElement('div', { style:{ marginTop:'10px' } }, '(임시: site_content 테이블 key=kakao_map_key, value={"appkey":"…"})')
          )
        )
      );
    }

    var isStale = !loc || (Date.now() - new Date(loc.updated_at).getTime() > 5 * 60 * 1000); // 5분 이상 = 운행 중 아닐 가능성
    return React.createElement('div', { style:{ minHeight:'100vh', background:'#f8fafc' } },
      header,
      // 지도
      React.createElement('div', { ref: mapRef, style:{ width:'100%', height: 'min(60vh, 480px)', background:'#e5e7eb' } }),
      // 정보
      React.createElement('div', { style:{ padding:'14px 16px', maxWidth:'600px', margin:'0 auto', fontFamily:'Manrope, sans-serif' } },
        error && React.createElement('div', { style:{ background:'#fef2f2', color:'#991b1b', padding:'10px 12px', borderRadius:'8px', fontSize:'12px', marginBottom:'10px' } }, error),
        React.createElement('div', { style:{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'12px', padding:'14px 16px', marginBottom:'10px' } },
          React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' } },
            React.createElement('span', { style:{ background: (loc && loc.is_driving && !isStale) ? '#dcfce7' : '#f3f4f6', color: (loc && loc.is_driving && !isStale) ? '#15803d' : '#6b7280', fontSize:'11px', fontWeight:'800', padding:'4px 10px', borderRadius:'999px' } }, (loc && loc.is_driving && !isStale) ? '운행 중' : '운행 중 아님'),
            React.createElement('span', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.55)' } }, '마지막 업데이트: ' + fmtTimeAgo(loc && loc.updated_at))
          ),
          loc && React.createElement('div', { style:{ fontSize:'12px', color:'rgba(0,0,0,0.55)' } },
            loc.speed != null && React.createElement('span', { style:{ marginRight:'10px' } }, '속도: ' + Math.round(loc.speed) + ' km/h'),
            loc.accuracy != null && React.createElement('span', null, '정확도: ' + Math.round(loc.accuracy) + ' m')
          )
        ),
        // 학생: 차량 이용 신청 카드 (학생 본인 + 미승인 상태에만)
        myStudentRow && myStudentRow.role === 'student' && !myStudentRow.uses_bus && (function(){
          var status = myStudentRow.bus_application_status || 'none';
          if (status === 'pending') {
            return React.createElement('div', { style:{ background:'#fffbeb', border:'1px solid #fbbf24', borderRadius:'12px', padding:'14px 16px', marginBottom:'10px' } },
              React.createElement('div', { style:{ fontSize:'13px', fontWeight:'800', color:'#92400e', marginBottom:'4px' } }, '⏳ 차량 이용 신청 대기 중'),
              React.createElement('div', { style:{ fontSize:'11px', color:'#78350f', marginBottom:'10px', lineHeight:'1.6' } }, '관리자가 신청을 확인하고 좌석 여유를 보아 승인해 줍니다. 승인되면 이 자리에서 정류장을 선택할 수 있어요.'),
              React.createElement('button', { onClick: cancelBusApplication, style:{ background:'transparent', color:'rgba(0,0,0,0.55)', border:'1px solid #d6dbde', borderRadius:'8px', padding:'8px 14px', fontSize:'12px', fontWeight:'700', cursor:'pointer' } }, '신청 취소')
            );
          }
          if (status === 'rejected') {
            return React.createElement('div', { style:{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:'12px', padding:'14px 16px', marginBottom:'10px' } },
              React.createElement('div', { style:{ fontSize:'13px', fontWeight:'800', color:'#991b1b', marginBottom:'4px' } }, '차량 이용 신청 거절됨'),
              React.createElement('div', { style:{ fontSize:'11px', color:'#7f1d1d', marginBottom:'10px', lineHeight:'1.6' } }, '좌석이 없거나 다른 사정으로 거절되었어요. 학원에 문의해 주세요. 다시 신청도 가능합니다.'),
              React.createElement('button', { onClick: applyForBus, style:{ background:'#E60012', color:'#fff', border:'none', borderRadius:'8px', padding:'8px 14px', fontSize:'12px', fontWeight:'800', cursor:'pointer' } }, '다시 신청하기')
            );
          }
          // 'none' — 미신청
          return React.createElement('div', { style:{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'12px', padding:'14px 16px', marginBottom:'10px' } },
            React.createElement('div', { style:{ fontSize:'13px', fontWeight:'800', color:'#1A1A1A', marginBottom:'4px' } }, '차량(셔틀) 이용을 신청하시겠어요?'),
            React.createElement('div', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.55)', marginBottom:'10px', lineHeight:'1.6' } }, '신청 후 관리자가 좌석 여유를 확인해 승인합니다. 승인되면 정류장을 선택할 수 있어요.'),
            React.createElement('button', { onClick: applyForBus, style:{ background:'#E60012', color:'#fff', border:'none', borderRadius:'8px', padding:'10px 16px', fontSize:'13px', fontWeight:'800', cursor:'pointer' } }, '+ 차량 이용 신청하기')
          );
        })(),

        // 학생: 오늘 정류장 선택 (uses_bus가 true일 때만)
        myStudentRow && myStudentRow.uses_bus && myClassesLoaded && (function(){
          var classTime = computeTodayClassTime();
          var hasClass = !!classTime;
          var effectiveStopId = null;
          var effectiveSkip = false;
          if (myTodayBoarding) {
            effectiveStopId = myTodayBoarding.stop_id;
            effectiveSkip = !!myTodayBoarding.is_skip;
          } else {
            effectiveStopId = myStudentRow.default_bus_stop_id;
          }
          var defaultStop = busStops.find(function(s){ return s.id === myStudentRow.default_bus_stop_id; });
          // 본인 수업 시간 기준 정렬 — 픽업 시간 빠른 정류장 먼저
          var sortedStops = busStops.slice().sort(function(a,b){
            var ta = hasClass ? pickupTimeForClass(a, classTime) : nextTimeForStop(a);
            var tb = hasClass ? pickupTimeForClass(b, classTime) : nextTimeForStop(b);
            if (ta && tb) return String(ta).localeCompare(String(tb));
            if (ta) return -1; if (tb) return 1;
            return 0;
          });
          var defaultPickup = (defaultStop && hasClass) ? pickupTimeForClass(defaultStop, classTime) : null;
          return React.createElement('div', { style:{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'12px', padding:'14px 16px', marginBottom:'10px' } },
            // 수업 시간 배너
            hasClass
              ? React.createElement('div', { style:{ background:'#FFEBED', color:'#E60012', padding:'8px 12px', borderRadius:'8px', fontSize:'13px', fontWeight:'800', marginBottom:'10px', display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' } },
                  React.createElement('span', null, '🕒'),
                  React.createElement('span', null, '오늘(' + todayKstDay() + ') 수업 ' + classTime),
                  defaultPickup && React.createElement('span', { style:{ marginLeft:'auto', fontSize:'11px', fontWeight:'700', color:'rgba(230,0,18,0.75)' } }, '기본 정류장 도착 ' + defaultPickup)
                )
              : myEnrolledClasses.length > 0
                ? React.createElement('div', { style:{ background:'#f3f4f6', color:'rgba(0,0,0,0.55)', padding:'8px 12px', borderRadius:'8px', fontSize:'12px', fontWeight:'700', marginBottom:'10px', lineHeight:'1.6' } }, '오늘(' + todayKstDay() + ')은 수업이 없는 요일이에요. 차량 운행도 없습니다.')
                : React.createElement('div', { style:{ background:'#fffbeb', color:'#92400e', padding:'8px 12px', borderRadius:'8px', fontSize:'12px', fontWeight:'700', marginBottom:'10px', lineHeight:'1.6' } }, '수업 시간이 아직 설정 안 됐어요. 관리자에게 문의해 주세요.'),
            React.createElement('div', { style:{ fontSize:'13px', fontWeight:'800', color:'#1A1A1A', marginBottom:'4px' } }, '오늘 어디서 탈까요?'),
            React.createElement('div', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.55)', marginBottom:'10px', lineHeight:'1.6' } },
              defaultStop
                ? ('기본은 ' + defaultStop.name + (defaultPickup ? (' (' + defaultPickup + ' 도착)') : '') + '. 다른 곳에서 탈 거면 그 정류장을 누르세요.')
                : '기본 정류장이 아직 설정 안 됐어요. 오늘 탈 정류장을 골라주세요.'
            ),
            sortedStops.length === 0
              ? React.createElement('div', { style:{ color:'#9ca3af', fontSize:'12px' } }, '아직 등록된 정류장이 없어요. 관리자에게 문의해주세요.')
              : React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:'8px' } },
                  sortedStops.map(function(s){
                    var isPicked = !effectiveSkip && s.id === effectiveStopId;
                    var isDefault = s.id === myStudentRow.default_bus_stop_id;
                    var pickT = hasClass ? pickupTimeForClass(s, classTime) : nextTimeForStop(s);
                    var noTime = !pickT;
                    return React.createElement('button', { key:s.id, disabled: stopSaving, onClick: function(){ pickStop(s.id, false); }, style:{
                      background: isPicked ? '#E60012' : '#fff',
                      color: isPicked ? '#fff' : (noTime ? 'rgba(0,0,0,0.4)' : '#1A1A1A'),
                      border: '2px solid ' + (isPicked ? '#E60012' : '#d6dbde'),
                      borderRadius:'10px', padding:'12px 10px',
                      fontSize:'13px', fontWeight:'800', cursor: stopSaving ? 'wait' : 'pointer',
                      fontFamily:'Manrope, sans-serif', textAlign:'center', lineHeight:'1.3',
                      opacity: noTime ? 0.65 : 1
                    } },
                      React.createElement('div', null, s.name),
                      pickT
                        ? React.createElement('div', { style:{ fontSize:'10px', fontWeight:'700', color: isPicked ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.55)', marginTop:'2px' } }, pickT + ' 도착')
                        : React.createElement('div', { style:{ fontSize:'10px', fontWeight:'700', color: isPicked ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.4)', marginTop:'2px' } }, hasClass ? '이 수업 운행 없음' : '시간 없음'),
                      isDefault && React.createElement('div', { style:{ fontSize:'9px', fontWeight:'700', color: isPicked ? 'rgba(255,255,255,0.85)' : '#1d4ed8', marginTop:'2px', letterSpacing:'0.04em' } }, '기본')
                    );
                  })
                ),
            React.createElement('div', { style:{ marginTop:'10px', display:'flex', gap:'8px', flexWrap:'wrap' } },
              React.createElement('button', { onClick: function(){ pickStop(null, true); }, disabled: stopSaving, style:{
                background: effectiveSkip ? '#1A1A1A' : '#f3f4f6',
                color: effectiveSkip ? '#fff' : 'rgba(0,0,0,0.7)',
                border:'1px solid ' + (effectiveSkip ? '#1A1A1A' : '#d6dbde'),
                borderRadius:'8px', padding:'8px 14px', fontSize:'12px', fontWeight:'700', cursor: stopSaving ? 'wait' : 'pointer', fontFamily:'Manrope, sans-serif'
              } }, effectiveSkip ? '✓ 오늘 안 탑니다' : '오늘 안 탑니다'),
              myTodayBoarding && React.createElement('button', { onClick: async function(){
                await sb.from('bus_boardings').delete().eq('id', myTodayBoarding.id);
                setMyTodayBoarding(null);
              }, style:{ background:'transparent', color:'rgba(0,0,0,0.55)', border:'1px solid #d6dbde', borderRadius:'8px', padding:'8px 14px', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:'Manrope, sans-serif' } }, '기본으로 되돌리기')
            )
          );
        })(),

        // 차량 운행 모드 컨트롤 (관리자/선생님만)
        canDrive && React.createElement('div', { style:{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'12px', padding:'14px 16px', marginBottom:'10px' } },
          React.createElement('div', { style:{ fontSize:'13px', fontWeight:'800', color:'#1A1A1A', marginBottom:'8px' } }, '차량 운행 모드'),
          React.createElement('div', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.55)', marginBottom:'10px', lineHeight:'1.6' } }, '본인 휴대폰의 GPS로 위치를 30초마다 자동 송신합니다. 페이지를 열어둔 동안만 동작해요.'),
          !driving
            ? React.createElement('button', { onClick: startDriving, style:{ width:'100%', background:'#E60012', color:'#fff', border:'none', borderRadius:'8px', padding:'12px', fontSize:'14px', fontWeight:'800', cursor:'pointer' } }, '운행 시작')
            : React.createElement('div', null,
                React.createElement('div', { style:{ fontSize:'12px', color:'#15803d', fontWeight:'800', marginBottom:'8px' } }, '송신 중' + (lastSent ? (' · 마지막 송신 ' + fmtTimeAgo(lastSent)) : '')),
                React.createElement('button', { onClick: stopDriving, style:{ width:'100%', background:'#1A1A1A', color:'#fff', border:'none', borderRadius:'8px', padding:'12px', fontSize:'14px', fontWeight:'800', cursor:'pointer' } }, '운행 종료')
              )
        ),

        // 기사 모드: 오늘 탑승 정보 (관리자/선생님만 — 정류장별 명단 + 좌석 잔여)
        canDrive && (function(){
          // 학생별 effective stop 계산
          var stopMap = {}; // stop_id -> [학생들]
          var skipList = [];
          var totalRiding = 0;
          busStudents.forEach(function(st){
            var override = allTodayBoardings.find(function(b){ return b.student_id === st.id; });
            if (override && override.is_skip) { skipList.push(st); return; }
            var effStopId = override ? override.stop_id : st.default_bus_stop_id;
            if (!effStopId) return; // 기본도 없고 변경도 없으면 미설정
            (stopMap[effStopId] = stopMap[effStopId] || []).push(st);
            totalRiding++;
          });
          var sortedStops = busStops.slice().sort(function(a,b){
            var ta = nextTimeForStop(a); var tb = nextTimeForStop(b);
            if (ta && tb) return String(ta).localeCompare(String(tb));
            if (ta) return -1; if (tb) return 1;
            return 0;
          });
          var seats = (vehicle && vehicle.seat_count != null) ? vehicle.seat_count : 12;
          var seatsLeft = seats - totalRiding;
          return React.createElement('div', { style:{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'12px', padding:'14px 16px' } },
            React.createElement('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px', flexWrap:'wrap', gap:'8px' } },
              React.createElement('div', { style:{ fontSize:'13px', fontWeight:'800', color:'#1A1A1A' } }, '오늘 탑승 명단 (' + totalRiding + '명)'),
              React.createElement('div', { style:{ fontSize:'12px', fontWeight:'700', color: seatsLeft < 0 ? '#c82014' : seatsLeft < 5 ? '#c87000' : '#15803d' } }, '좌석 잔여 ' + seatsLeft + '석 / 총 ' + seats + '석')
            ),
            busStudents.length === 0
              ? React.createElement('div', { style:{ color:'#9ca3af', fontSize:'12px', padding:'8px 0' } }, '차량 이용 학생이 아직 없어요.')
              : React.createElement('div', { style:{ display:'flex', flexDirection:'column', gap:'8px' } },
                  sortedStops.map(function(s, i){
                    var picks = stopMap[s.id] || [];
                    return React.createElement('div', { key:s.id, style:{ border:'1px solid #e5e7eb', borderRadius:'8px', padding:'10px 12px', background: picks.length>0 ? '#fff' : '#fafbfc' } },
                      React.createElement('div', { style:{ display:'flex', alignItems:'center', gap:'8px', marginBottom: picks.length>0 ? '6px' : 0 } },
                        React.createElement('span', { style:{ background:'#dbeafe', color:'#1d4ed8', fontSize:'11px', fontWeight:'800', padding:'2px 8px', borderRadius:'999px', minWidth:'26px', textAlign:'center' } }, (i+1)),
                        React.createElement('div', { style:{ flex:1, minWidth:0 } },
                          React.createElement('div', { style:{ fontSize:'13px', fontWeight:'800', color:'#1A1A1A' } }, s.name + ((s.pickup_times && s.pickup_times.length) ? (' · ' + s.pickup_times.join(', ')) : '')),
                          React.createElement('div', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.45)' } }, picks.length + '명 탑승')
                        )
                      ),
                      picks.length > 0 && React.createElement('div', { style:{ display:'flex', flexWrap:'wrap', gap:'4px' } },
                        picks.map(function(p){
                          return React.createElement('span', { key:p.id, style:{ background:'#FFEBED', color:'#E60012', fontSize:'11px', fontWeight:'700', padding:'3px 8px', borderRadius:'5px' } }, p.name + (p.grade ? (' ' + p.grade) : ''));
                        })
                      )
                    );
                  }),
                  // 미설정 (기본도 없고 오늘 변경도 없는 학생)
                  (function(){
                    var unset = busStudents.filter(function(st){
                      var override = allTodayBoardings.find(function(b){ return b.student_id === st.id; });
                      if (override && (override.is_skip || override.stop_id)) return false;
                      if (st.default_bus_stop_id) return false;
                      return true;
                    });
                    if (unset.length === 0) return null;
                    return React.createElement('div', { style:{ border:'1px dashed #fbbf24', borderRadius:'8px', padding:'10px 12px', background:'#fffbeb' } },
                      React.createElement('div', { style:{ fontSize:'12px', fontWeight:'700', color:'#92400e', marginBottom:'4px' } }, '기본 정류장 미설정 (' + unset.length + '명)'),
                      React.createElement('div', { style:{ display:'flex', flexWrap:'wrap', gap:'4px' } },
                        unset.map(function(p){ return React.createElement('span', { key:p.id, style:{ background:'#fef3c7', color:'#92400e', fontSize:'11px', fontWeight:'700', padding:'3px 8px', borderRadius:'5px' } }, p.name + (p.grade ? (' ' + p.grade) : '')); })
                      )
                    );
                  })(),
                  // 오늘 안 타는 학생
                  skipList.length > 0 && React.createElement('div', { style:{ border:'1px solid #e5e7eb', borderRadius:'8px', padding:'10px 12px', background:'#f9fafb' } },
                    React.createElement('div', { style:{ fontSize:'12px', fontWeight:'700', color:'rgba(0,0,0,0.55)', marginBottom:'4px' } }, '오늘 안 탐 (' + skipList.length + '명)'),
                    React.createElement('div', { style:{ display:'flex', flexWrap:'wrap', gap:'4px' } },
                      skipList.map(function(p){ return React.createElement('span', { key:p.id, style:{ background:'#f3f4f6', color:'rgba(0,0,0,0.55)', fontSize:'11px', fontWeight:'700', padding:'3px 8px', borderRadius:'5px', textDecoration:'line-through' } }, p.name); })
                    )
                  )
                )
          );
        })()
      )
    );
  }

  window.BusTrackingPage = BusTrackingPage;

})();

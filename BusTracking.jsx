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

    // 기사 모드 상태
    var [driving, setDriving] = React.useState(false);
    var [lastSent, setLastSent] = React.useState(null);

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
        } catch (e) { setError('초기 로드 실패: ' + (e.message || e)); }
      })();
    }, []);

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

    // 기사 모드: GPS watchPosition + 30초마다 업로드
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
        // 기사 모드 컨트롤 (관리자/선생님만)
        canDrive && React.createElement('div', { style:{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:'12px', padding:'14px 16px' } },
          React.createElement('div', { style:{ fontSize:'13px', fontWeight:'800', color:'#1A1A1A', marginBottom:'8px' } }, '기사 모드'),
          React.createElement('div', { style:{ fontSize:'11px', color:'rgba(0,0,0,0.55)', marginBottom:'10px', lineHeight:'1.6' } }, '본인 휴대폰의 GPS로 위치를 30초마다 자동 송신합니다. 페이지를 열어둔 동안만 동작해요.'),
          !driving
            ? React.createElement('button', { onClick: startDriving, style:{ width:'100%', background:'#E60012', color:'#fff', border:'none', borderRadius:'8px', padding:'12px', fontSize:'14px', fontWeight:'800', cursor:'pointer' } }, '운행 시작')
            : React.createElement('div', null,
                React.createElement('div', { style:{ fontSize:'12px', color:'#15803d', fontWeight:'800', marginBottom:'8px' } }, '송신 중' + (lastSent ? (' · 마지막 송신 ' + fmtTimeAgo(lastSent)) : '')),
                React.createElement('button', { onClick: stopDriving, style:{ width:'100%', background:'#1A1A1A', color:'#fff', border:'none', borderRadius:'8px', padding:'12px', fontSize:'14px', fontWeight:'800', cursor:'pointer' } }, '운행 종료')
              )
        )
      )
    );
  }

  window.BusTrackingPage = BusTrackingPage;

})();

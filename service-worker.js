const CACHE_VERSION = 'b2-bigbang-v30';
const OFFLINE_URLS = [
  './',
  './index.html',
  './manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(OFFLINE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // chrome-extension://, file://, data: 등 cache.put이 거부하는 스킴은 처리하지 않음
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Supabase 스토리지 이미지는 cache-first로 (모바일 새로고침 시 깜빡임 방지)
  if (url.hostname.includes('supabase.co') && url.pathname.startsWith('/storage/')) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
          }
          return res;
        }).catch(() => cached);
      })
    );
    return;
  }

  // Supabase API와 외부 동영상은 캐시하지 않고 항상 네트워크
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('youtube.com') ||
    url.hostname.includes('youtu.be')
  ) {
    return;
  }

  // 우리 앱 코드(.js, .jsx, .html)와 네비게이션 요청(루트 '/' 포함)은 네트워크 우선
  // — 업데이트가 즉시 반영되도록. (네비게이션 = 주소창 입력/링크 클릭/새로고침으로
  //   페이지 이동하는 요청. mode==='navigate'로 식별)
  const sameOrigin = url.origin === self.location.origin;
  const isAppCode = sameOrigin && (
    req.mode === 'navigate' ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.jsx') ||
    url.pathname.endsWith('.html')
  );
  if (isAppCode) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match('./index.html')))
    );
    return;
  }

  // 그 외 (이미지, CSS, 폰트, CDN 라이브러리 등)는 캐시 우선
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res.ok && (res.type === 'basic' || res.type === 'cors')) {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
        }
        return res;
      });
    })
  );
});

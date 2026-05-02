const CACHE_VERSION = 'b2-bigbang-v7';
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

  // Supabase API와 외부 동영상은 캐시하지 않고 항상 네트워크
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('youtube.com') ||
    url.hostname.includes('youtu.be')
  ) {
    return;
  }

  // 우리 앱 코드(.js, .jsx, .html)는 네트워크 우선 - 업데이트가 바로 반영되게
  // (외부 CDN의 .js는 다음 분기에서 캐시 우선으로 처리됨 - hostname이 다르므로)
  const sameOrigin = url.origin === self.location.origin;
  if (sameOrigin && (url.pathname.endsWith('.js') || url.pathname.endsWith('.jsx') || url.pathname.endsWith('.html'))) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req))
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

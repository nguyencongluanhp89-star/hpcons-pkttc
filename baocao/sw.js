// Service worker App Báo Cáo Ngày — chiến lược MẠNG TRƯỚC (network-first):
// khi có mạng luôn lấy bản mới nhất từ server (không kẹt bản cũ);
// bản trong cache chỉ dùng làm dự phòng khi offline.
const CACHE_NAME = 'hpcons-baocao-v1';

const urlsToCache = [
  './',
  './index.html',
  './app-core.js',
  './css/style.css',
  './js/data.js',
  './js/features.js',
  './js/render.js',
  './js/utils.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  // Chỉ can thiệp file cùng nguồn; API/Firebase/CDN để trình duyệt tự xử lý.
  if (url.origin !== location.origin) return;

  event.respondWith(
    fetch(event.request, { cache: 'no-cache' })
      .then(resp => {
        const clone = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone)).catch(() => {});
        return resp;
      })
      .catch(() => caches.match(event.request).then(c => c || caches.match('./index.html')))
  );
});

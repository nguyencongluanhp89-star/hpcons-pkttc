// Từ v58: KHÔNG cần bump tay mỗi lần sửa nữa — fetch dùng no-cache cho file cùng máy (xem handler bên dưới),
// luôn lấy bản mới khi online; cache chỉ dùng làm dự phòng khi offline.
const CACHE_NAME = 'hpcons-cache-v80';

// Danh sách các tệp cơ bản cần thiết để ứng dụng load được khi offline
// Sẽ dùng chiến thuật Network First
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './firebase-init.js',
  './firebase-sync.js',
  './manifest.json',
  './Logo HPC.png',
  './icon-192.png',
  './icon-512.png',
  './favicon.ico',
  './icon-ios.png',
  './TAB BAO CAO NGAY/bao-cao-thi-cong-ngay.html',
  './TAB BAO CAO NGAY/css/style.css',
  './TAB BAO CAO NGAY/js/features.js',
  './TAB BAO CAO NGAY/js/render.js',
  './TAB BAO CAO NGAY/js/utils.js',
  './TAB BAO CAO NGAY/js/data.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Opened cache');
        // Pre-cache core URLs (ignore errors if some files don't exist yet)
        return Promise.allSettled(urlsToCache.map(url => cache.add(url)));
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Network First strategy
self.addEventListener('fetch', event => {
  // Chỉ xử lý các request HTTP(S), bỏ qua chrome-extension:// và các giao thức khác
  if (!event.request.url.startsWith('http')) return;

  // File CÙNG MÁY (html/js/css của app) → buộc kiểm tra server (no-cache) để luôn lấy bản mới khi online,
  // nhờ vậy KHÔNG cần đổi version tay nữa. File ngoài (CDN thư viện) giữ cache mặc định cho nhanh.
  const sameOrigin = new URL(event.request.url).origin === self.location.origin;
  const fetchOpts = sameOrigin ? { cache: 'no-cache' } : undefined;

  event.respondWith(
    fetch(event.request, fetchOpts)
      .then(response => {
        // Cập nhật cache nếu request thành công (Cache API chỉ nhận GET — put request POST sẽ lỗi ngầm)
        if (!response || response.status !== 200 || response.type !== 'basic' || event.request.method !== 'GET') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseToCache);
          });
        return response;
      })
      .catch(() => {
        // Nếu rớt mạng, lôi từ Cache ra. Nếu không có trong cache, trả về Response offline tạm thời để tránh lỗi đơ trình duyệt.
        return caches.match(event.request).then(res => res || new Response('Offline', { status: 503 }));
      })
  );
});

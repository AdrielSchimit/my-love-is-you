const CACHE = 'my-love-is-you-v8-mobile-dock-nana';
const CORE = ['/', '/index.html', '/styles.css', '/config.js', '/src/app.js', '/src/nana.js', '/src/store.js', '/src/animations.js', '/animations.css', '/assets/logo.webp', '/assets/heart-main.webp', '/assets/avatar-adriel.webp', '/assets/avatar-maria.webp', '/assets/pet-cat.webp', '/assets/proposal/banner.webp', '/assets/proposal/sim-heart.webp', '/assets/proposal/nana-ring.webp', '/assets/proposal/ring-box.webp', '/assets/proposal/envelope.webp', '/manifest.webmanifest', '/assets/app-icons/icon-192.png', '/assets/app-icons/icon-512.png'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request).then(response => {
    const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(event.request, copy)); return response;
  }).catch(() => caches.match(event.request).then(hit => hit || caches.match('/index.html'))));
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

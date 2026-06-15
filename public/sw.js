// FashionVerse Delivery Hub — Service Worker
const CACHE = 'fv-driver-v1';

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(['/delivery-dashboard']))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  // Network-first strategy
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});

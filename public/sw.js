const CACHE_NAME = 'aturen-pwa-v1';
const OFFLINE_URL = '/dashboard';

// Install event: cache offline payload
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Just cache the root and dashboard for basic offline viewing
      return cache.addAll(['/', '/dashboard', '/expenses', '/reserved', '/settings', '/manifest.json', '/icon.svg']);
    })
  );
  self.skipWaiting();
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event: Network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Only handle GET requests or page navigations
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request).then((response) => {
          // If cached response exists, return it. Otherwise, return the dashboard as fallback
          if (response) {
            return response;
          } else if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
          return new Response('Network error happened', { status: 408, headers: { 'Content-Type': 'text/plain' } });
        });
      })
  );
});

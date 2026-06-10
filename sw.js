/* =====================================================
   SERVICE WORKER — Taxi OCR Analytics Pro
   Estrategia: Cache First para assets, Network First para datos
   ===================================================== */

const CACHE_NAME = 'taxi-ocr-v1';
const ASSETS = [
  './',
  './index.html',
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap',
  'https://unpkg.com/tesseract.js@4.0.1/dist/tesseract.min.js'
];

/* Instalación: precachear assets */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cachear solo los recursos propios; los externos pueden fallar sin problema
      return cache.addAll(['./index.html']).catch(() => {});
    })
  );
  self.skipWaiting();
});

/* Activación: limpiar caches antiguas */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* Fetch: Cache First con fallback a red */
self.addEventListener('fetch', event => {
  // Solo manejar GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // Solo cachear respuestas válidas de nuestro origen
        if (
          response.ok &&
          (event.request.url.startsWith(self.location.origin) ||
           event.request.url.includes('fonts.googleapis.com') ||
           event.request.url.includes('unpkg.com'))
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Sin red y sin cache: devolver página principal como fallback
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

/**
 * Service Worker para Taxi OCR PWA
 * Permite funcionamiento offline y carga más rápida
 */

const CACHE_NAME = 'taxi-ocr-v1';
const URLS_TO_CACHE = [
  '/Tx/',
  '/Tx/index.html',
  '/Tx/manifest.json',
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap',
  'https://unpkg.com/tesseract.js@4.0.1/dist/tesseract.min.js'
];

// Instalar Service Worker y cachear recursos
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Cacheando recursos');
        return cache.addAll(URLS_TO_CACHE).catch((err) => {
          console.warn('[Service Worker] Algunos recursos no se cachearon:', err);
          // Continuar aunque algunos recursos fallen
          return cache.add('/Tx/index.html');
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activar Service Worker y limpiar cachés antiguos
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activando...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Eliminando caché antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptar peticiones y servir desde caché o red
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // No cachear POST requests
  if (request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((response) => {
        // Si existe en caché, devolverlo
        if (response) {
          // Actualizar caché en background
          if (request.url.startsWith('http')) {
            fetch(request)
              .then(res => {
                if (res && res.status === 200 && res.type === 'basic') {
                  const responseToCache = res.clone();
                  caches.open(CACHE_NAME)
                    .then(cache => cache.put(request, responseToCache));
                }
              })
              .catch(() => {});
          }
          return response;
        }

        // Si no está en caché, intentar obtener de la red
        return fetch(request)
          .then((response) => {
            // Si la respuesta es válida, cacheárla
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Si falla la red, servir página de inicio cacheada
            return caches.match('/Tx/index.html');
          });
      })
  );
});

// Sincronización en background (opcional)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-sheets') {
    event.waitUntil(
      // Aquí iría lógica para sincronizar con Google Sheets
      Promise.resolve()
    );
  }
});

const CACHE_NAME = 'taxi-ocr-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Estrategia: primero de la red, si falla, del caché
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  );
});

// Activar y limpiar cachés antiguas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
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

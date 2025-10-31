// Service Worker para VitalMape UTI
// Estrategia de cache: Network First para APIs, Cache First para assets estáticos
const CACHE_NAME = 'vitalmape-uti-v1';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas

// Archivos estáticos que se cachean
const STATIC_ASSETS = [
  '/',
  '/static/css/',
  '/static/js/',
  '/manifest.json',
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('✅ Service Worker instalado');
  self.skipWaiting(); // Activar inmediatamente
});

// Activar Service Worker
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activado');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Tomar control de todas las páginas inmediatamente
});

// Interceptar requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Si es una llamada a la API, siempre usar Network First (no cachear)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // No cachear respuestas de API, siempre ir a la red
          return response;
        })
        .catch(() => {
          // Si falla la red, intentar desde cache como fallback
          return caches.match(request);
        })
    );
    return;
  }

  // Para assets estáticos, usar Network First con fallback a cache
  if (STATIC_ASSETS.some(asset => url.pathname.startsWith(asset))) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cachear solo respuestas exitosas
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback a cache si falla la red
          return caches.match(request);
        })
    );
    return;
  }

  // Para todo lo demás, ir directamente a la red (sin cachear)
  event.respondWith(fetch(request));
});

// Escuchar mensajes para forzar actualización
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      console.log('🗑️ Cache limpiado');
      event.ports[0].postMessage({ success: true });
    });
  }
});


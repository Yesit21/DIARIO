const CACHE_NAME = 'diario-cache-v14';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/diary.html',
  '/styles.css',
  '/script.js',
  '/diary.js',
  '/cursor-hearts.js',
  '/manifest.json',
  'https://cdn-icons-png.flaticon.com/512/833/833472.png'
];

// Instalar el Service Worker y cachear recursos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Cache abierto, guardando recursos estáticos');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

// Activar y limpiar caches antiguos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🧹 Limpiando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Estrategia mejorada: Cache First para archivos estáticos, Network First para API
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Solo cachear peticiones GET
  if (event.request.method !== 'GET') return;
  
  // Si es una llamada a la API, siempre intentar red primero
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Si falla (offline), no hay respuesta de API
          return new Response(JSON.stringify({ offline: true }), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }
  
  // Para archivos estáticos (HTML, CSS, JS, imágenes): Cache First
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          console.log('📦 Sirviendo desde caché:', event.request.url);
          return cachedResponse;
        }
        
        // Si no está en caché, intentar red y guardar en caché
        return fetch(event.request)
          .then(response => {
            // Solo cachear respuestas exitosas
            if (response && response.status === 200) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseToCache);
              });
            }
            return response;
          })
          .catch(() => {
            // Si falla todo, mostrar página offline básica
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
          });
      })
  );
});
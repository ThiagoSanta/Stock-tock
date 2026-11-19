/**
 * Service Worker — Stock·tock PWA
 * Estrategia: Network-first para rutas de API/Supabase, Cache-first para assets estáticos.
 * Permite instalación como app nativa en Windows/Mac/Android.
 */

const CACHE_NAME = 'stocktock-v1';

// Assets estáticos que se cachean en la instalación
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
];

// Instalar: pre-cachear shell de la app
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

// Activar: limpiar caches antiguos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: Network-first para Supabase/APIs, Cache-first para assets JS/CSS/fonts
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // No interceptar peticiones a Supabase ni APIs externas
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('googleapis.com') ||
    request.method !== 'GET'
  ) {
    return;
  }

  // Assets estáticos: cache-first
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font' ||
    request.destination === 'image'
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Navegación (rutas SPA): network-first, fallback a index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/index.html').then((cached) => cached || new Response('Offline'))
      )
    );
  }
});

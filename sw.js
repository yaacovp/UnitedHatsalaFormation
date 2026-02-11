const CACHE_NAME = 'pse-revision-v4'; // ← Version incrémentée
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',        // ← AJOUTE
  '/script.js', 
  '/manifest.json',
  '/data/content.json',
  '/data/flashcards.json', // ← NOUVEAU
  '/images/icon-192.png',
  '/images/icon-512.png',
  '/images/schemas/lobeCerveau.jpeg',
  '/images/schemas/structure-anatomique-du-cœur.jpg',
  '/images/schemas/Respiratory_system_complete_fr.svg'
];

// Installation du Service Worker
self.addEventListener('install', event => {
  console.log('[SW] Installation v4...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Mise en cache des fichiers');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activation du Service Worker
self.addEventListener('activate', event => {
  console.log('[SW] Activation v4...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Stratégie Cache First (offline-first)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Retourne depuis le cache si disponible
        if (response) {
          console.log('[SW] Depuis cache:', event.request.url);
          return response;
        }
        
        // Sinon, fetch depuis le réseau
        console.log('[SW] Depuis réseau:', event.request.url);
        return fetch(event.request).then(response => {
          // Mise en cache des nouvelles ressources
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        });
      })
      .catch(() => {
        // En cas d'erreur réseau et pas de cache
        return new Response('Offline - Contenu non disponible', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({
            'Content-Type': 'text/plain'
          })
        });
      })
  );
});
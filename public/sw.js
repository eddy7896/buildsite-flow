// Service Worker for BuildFlow PWA
const CACHE_NAME = 'buildflow-v1';
const RUNTIME_CACHE = 'buildflow-runtime-v1';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
          })
          .map((cacheName) => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
    .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  try {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
      return;
    }

    // Skip Vite dev server requests (HMR, dependencies, etc.)
    if (event.request.url.includes('/node_modules/') || 
        event.request.url.includes('/@vite/') ||
        event.request.url.includes('/@id/') ||
        event.request.url.includes('?v=') ||
        event.request.url.includes('?t=') ||
        event.request.url.includes('localhost:8080') && event.request.url.includes('/src/')) {
      return;
    }

    // Skip API requests (always use network)
    if (event.request.url.includes('/api/')) {
      return;
    }

    // Skip CSS and JS files from service worker to avoid caching issues
    let url;
    try {
      url = new URL(event.request.url);
    } catch (e) {
      // Invalid URL, skip caching
      return;
    }

    if (url.pathname.endsWith('.css') || url.pathname.endsWith('.js') || url.pathname.includes('?t=')) {
      // Always fetch CSS/JS from network to avoid stale cache
      event.respondWith(
        fetch(event.request).catch(() => {
          // If fetch fails, return cached version as fallback
          return caches.match(event.request).catch(() => {
            // If cache match also fails, return network error
            return new Response('Network error', { status: 408 });
          });
        })
      );
      return;
    }

    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          // Return cached version if available
          if (cachedResponse) {
            return cachedResponse;
          }

          // Otherwise fetch from network
          return fetch(event.request)
            .then((response) => {
              // Don't cache non-successful responses
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }

              // Only cache HTML and images, not CSS/JS
              if (url.pathname.endsWith('.html') || 
                  url.pathname.endsWith('.png') || 
                  url.pathname.endsWith('.jpg') || 
                  url.pathname.endsWith('.svg') ||
                  url.pathname.endsWith('.ico')) {
                // Clone the response for caching
                const responseToCache = response.clone();

                // Cache the response (don't wait for it)
                caches.open(RUNTIME_CACHE)
                  .then((cache) => {
                    cache.put(event.request, responseToCache).catch(() => {
                      // Silently fail if caching fails
                    });
                  })
                  .catch(() => {
                    // Silently fail if cache open fails
                  });
              }

              return response;
            })
            .catch((error) => {
              console.error('[SW] Fetch failed:', error);
              // If network fails and it's a navigation request, return offline page
              if (event.request.mode === 'navigate') {
                return caches.match('/index.html').catch(() => {
                  return new Response('Offline', { status: 503 });
                });
              }
              // For other requests, return error
              return new Response('Network error', { status: 408 });
            });
        })
        .catch((error) => {
          console.error('[SW] Cache match failed:', error);
          // Fallback to network
          return fetch(event.request).catch(() => {
            return new Response('Network error', { status: 408 });
          });
        })
    );
  } catch (error) {
    console.error('[SW] Unexpected error in fetch handler:', error);
    // Don't respond if there's an error to avoid breaking the page
  }
});

// Background sync for offline actions (if needed)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-leads') {
    event.waitUntil(syncLeads());
  }
});

async function syncLeads() {
  // Implement offline lead sync logic here
  console.log('[SW] Syncing leads...');
}

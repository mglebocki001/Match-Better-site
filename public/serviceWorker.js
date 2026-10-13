// Service Worker for caching assets and enabling offline support

const CACHE_NAME = 'matchbetter-v1';
const RUNTIME_CACHE = 'matchbetter-runtime-v1';

// Files to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((err) => console.error('Install error:', err))
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE)
            .map((cacheName) => {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Don't cache non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Don't cache API calls (they should use network-first)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Cache static assets
  if (shouldCache(request)) {
    event.respondWith(cacheFirst(request));
  } else {
    event.respondWith(networkFirst(request));
  }
});

/**
 * Cache-first strategy: try cache, fallback to network
 * Good for: images, fonts, CSS, JS (versioned)
 */
async function cacheFirst(request) {
  try {
    // Check cache first
    const cached = await caches.match(request);
    if (cached) {
      console.log('Cache hit:', request.url);
      return cached;
    }

    // Not in cache, fetch from network
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.error('Cache-first error:', error);
    return new Response('Offline - resource not available', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

/**
 * Network-first strategy: try network, fallback to cache
 * Good for: HTML, API calls, dynamic content
 */
async function networkFirst(request) {
  try {
    // Try network first
    const response = await fetch(request, {
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log('Network failed, trying cache:', request.url);
    
    // Fallback to cache
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    // Return offline page or error response
    return new Response('Offline - please check your connection', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

/**
 * Determine if request should be cached
 */
function shouldCache(request) {
  const url = new URL(request.url);
  
  // Cache images
  if (/\.(jpg|jpeg|png|webp|svg|gif)$/i.test(url.pathname)) {
    return true;
  }

  // Cache fonts
  if (/\.(woff|woff2|ttf|eot)$/i.test(url.pathname)) {
    return true;
  }

  // Cache CSS and JS bundles
  if (/\.(css|js)$/i.test(url.pathname)) {
    return true;
  }

  return false;
}

// Message handler for cache clearing
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(RUNTIME_CACHE).then(() => {
      console.log('Runtime cache cleared');
    });
  }
});

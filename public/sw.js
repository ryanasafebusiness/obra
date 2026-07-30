// Bump this whenever the caching strategy changes so old service workers
// discard their (potentially stale/auth-mismatched) cache on activate.
const CACHE_NAME = 'obracalc-v2'

// Only static, non-personalized assets are safe to pre-cache. Page routes
// (dashboard, calcular, etc.) render different HTML per authenticated user
// and are excluded — caching them previously meant an offline visit could
// show another session's (or the logged-out) page under the wrong URL.
const STATIC_ASSETS = [
  '/icon-192x192.png',
  '/icon-512x512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icon-') ||
    /\.(?:png|jpg|jpeg|svg|webp|woff2?)$/.test(url.pathname)
  )
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)

  // Page navigations carry auth cookies and render per-user content —
  // always go to the network so a signed-in/out user never sees a stale
  // or mismatched cached page.
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request))
    return
  }

  // Static, non-personalized assets: cache-first with a network fallback
  // that refreshes the cache in the background.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const networkFetch = fetch(event.request)
          .then((response) => {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone))
            return response
          })
          .catch(() => cached)

        return cached || networkFetch
      })
    )
    return
  }

  // Everything else (API calls, data requests): network only, no caching.
})

self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      vibrate: [100, 50, 100],
    }
    event.waitUntil(self.registration.showNotification(data.title, options))
  }
})

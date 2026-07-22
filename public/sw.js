/* PRISM PWA shell — network-first for HTML so deploys show up; cache assets only. */
const CACHE = 'prism-shell-v2'

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return
  // Never cache API
  if (url.pathname.startsWith('/api/')) return

  // HTML / navigations: always try network first so Azure deploys appear
  const isHtml =
    req.mode === 'navigate' ||
    url.pathname === '/' ||
    url.pathname.endsWith('.html') ||
    (req.headers.get('accept') || '').includes('text/html')

  if (isHtml) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const clone = res.clone()
          void caches.open(CACHE).then((cache) => cache.put(req, clone))
          return res
        })
        .catch(() => caches.match(req)),
    )
    return
  }

  // Hashed /assets/* : cache-first is fine (new deploy = new filename)
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            if (res.ok) {
              const clone = res.clone()
              void caches.open(CACHE).then((cache) => cache.put(req, clone))
            }
            return res
          }),
      ),
    )
  }
})

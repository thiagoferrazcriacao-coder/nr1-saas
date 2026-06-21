// Service worker — estratégia "rede primeiro" (network-first).
// Sempre busca a versão mais recente na rede; o cache é só fallback offline.
// Isso evita servir versões antigas/quebradas após um novo deploy.
const CACHE_NAME = 'zelo-v2'

self.addEventListener('install', () => {
  // Ativa imediatamente a nova versão do service worker
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request

  // Não intercepta métodos não-GET nem chamadas de API
  if (req.method !== 'GET' || req.url.includes('/api/')) return

  event.respondWith(
    fetch(req)
      .then((res) => {
        // Guarda uma cópia para uso offline
        const copy = res.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {})
        return res
      })
      .catch(() => caches.match(req)) // offline: usa o que tiver em cache
  )
})

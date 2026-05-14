// Service Worker — Gabinete FC
// v3 — NÃO cacheia rotas dinâmicas (auth/sessão).
// Cacheia só assets estáticos enquanto offline.

const CACHE_NAME = 'gabinete-fc-v3'
const STATIC_ASSETS = ['/offline']

// Rotas que NUNCA podem ser servidas do cache — dependem de cookie/sessão.
const NEVER_CACHE_PATTERNS = [
  /^\/auth\//,
  /^\/minha-conta(\/|$)/,
  /^\/onboarding(\/|$)/,
  /^\/checkout(\/|$)/,
  /^\/carrinho(\/|$)/,
  /^\/admin(\/|$)/,
  /^\/api\//,
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS).catch(() => {}))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch — Network first; só cai no cache se for asset estático e offline
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)
  // Não intercepta rotas dinâmicas — deixa o browser fazer request normal
  if (NEVER_CACHE_PATTERNS.some((re) => re.test(url.pathname))) return

  // Só intercepta navegação pra mostrar /offline quando der erro
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/offline'))
    )
    return
  }
})

// Push notification handler
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  const title = data.title ?? 'Gabinete FC'
  const options = {
    body: data.body ?? 'Nova notificação',
    icon: '/logo/gabinete-fc-icon.png',
    badge: '/logo/gabinete-fc-icon.png',
    data: { url: data.url ?? '/' },
    actions: data.actions ?? [],
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(clients.openWindow(url))
})

// Service Worker — Gabinete FC
// Handles: Push Notifications + Offline cache básico

const CACHE_NAME = 'gabinete-fc-v1'
const STATIC_ASSETS = ['/', '/loja', '/offline']

// Install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS).catch(() => {}))
  )
  self.skipWaiting()
})

// Activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch — Network first, cache fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  if (event.request.url.includes('/api/')) return

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  )
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

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(clients.openWindow(url))
})

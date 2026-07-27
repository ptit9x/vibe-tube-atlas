/// <reference lib="webworker" />
/// <reference types="vite-plugin-pwa/client" />
import { precacheAndRoute } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst, CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

declare const self: ServiceWorkerGlobalScope

// ─── Precache build assets (auto-injected by vite-plugin-pwa) ───────────────
precacheAndRoute(self.__WB_MANIFEST || [])

// Skip waiting on update → new SW activates immediately
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting()
})

clientsClaim()

// ─── Runtime caching strategies ─────────────────────────────────────────────

// 1. Static assets (images, icons, fonts) — cache-first, long TTL
registerRoute(
  ({ request }) => request.destination === 'image' || request.destination === 'font',
  new CacheFirst({
    cacheName: 'vibe-assets',
    plugins: [
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 }),
    ],
  })
)

// 2. App shell navigation (HTML) — network-first, fallback to cached shell
//    (offline reload → still gets the SPA shell)
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'vibe-shell',
    networkTimeoutSeconds: 3,
  })
)

// 3. Supabase REST + Auth + Realtime — network-first with cache fallback.
//    POST/PATCH/DELETE → network-only (let outbox handle offline writes).
//    GET → network-first, cache fallback so offline READ shows last data.
registerRoute(
  ({ url, request }) =>
    url.hostname.endsWith('.supabase.co') && request.method === 'GET',
  new NetworkFirst({
    cacheName: 'vibe-supabase-readonly',
    networkTimeoutSeconds: 4,
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 24 * 60 * 60 }),
    ],
  })
)

// ─── Push notifications (carried over from old sw.js) ───────────────────────
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}
  const title = data.title || 'Vibe Tube Atlas'
  const options = {
    body: data.body || 'Bạn có thông báo mới',
    icon: '/icons/logo.png',
    badge: '/icons/logo.png',
    data: { url: data.url || '/dashboard' },
    vibrate: [100, 50, 100],
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/dashboard'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return self.clients.openWindow(url)
    })
  )
})

// Allow the SW to type-check as a module
export {}

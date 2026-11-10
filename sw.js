const CACHE = 'vokter-mobile-v5';
const ASSETS = ['app.html', 'css/app.css', 'js/theme.js', 'js/app-auth.js', 'js/auth-ui.js', 'js/auth-core.js', 'js/config.js', 'js/colombia.js', 'js/backend-local.js', 'js/app-checkout.js', 'js/payments.js', 'js/payments-ui.js', 'js/gateway-test.js', 'css/payments.css', 'css/auth.css', 'js/commerce.js', 'js/app-icons.js', 'js/app-motion.js', 'js/app-modules.js', 'data/products.json', 'app.webmanifest'];
self.addEventListener('install', event => { self.skipWaiting(); event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS))); });
// Borra las copias viejas para que los visitantes reciban siempre la versión nueva.
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
// Primero la red (siempre lo más nuevo); si no hay internet, la copia guardada.
// Solo archivos propios: las llamadas a Supabase y otros servicios no pasan por la caché.
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(cache => cache.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req)));
});

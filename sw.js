const CACHE = 'agenda-norte-v1';
const ASSETS = ['app.html', 'css/app.css', 'js/theme.js', 'js/auth.js', 'js/commerce.js', 'js/icons.js', 'js/utils.js', 'data/products.json', 'app.webmanifest'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS))));
self.addEventListener('fetch', event => event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request))));

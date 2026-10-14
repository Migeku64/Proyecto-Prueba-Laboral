const CACHE = 'vokter-mobile-v3';
const ASSETS = ['app.html', 'css/app.css', 'js/theme.js', 'js/auth.js', 'js/commerce.js', 'js/app-icons.js', 'js/app-motion.js', 'js/app-modules.js', 'data/products.json', 'app.webmanifest'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS))));
self.addEventListener('fetch', event => event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request))));

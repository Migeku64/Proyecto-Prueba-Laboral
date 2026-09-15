const CACHE = 'agenda-norte-v1';
const ASSETS = ['app.html', 'css/app.css', 'js/app.js', 'app.webmanifest'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS))));
self.addEventListener('fetch', event => event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request))));

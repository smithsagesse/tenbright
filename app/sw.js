/* Tenbright offline support: the page and Pip's audio are cached on the device so lessons work without internet.
   Nothing is sent anywhere; this only stores the app's own files. */
const CACHE = 'tenbright-v4b2ad64e1d';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './art/welcome.webp', './art/welcome-1600.webp', './art/celebrate.webp', './art/celebrate-1600.webp', './art/journal.webp', './art/journal-1600.webp', './art/welcome-depth.webp', './art/celebrate-depth.webp', './art/journal-depth.webp', './art/pip-hero.webp'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.includes('/audio/') || url.pathname.includes('/art/')) {
    // audio and artwork: cache first, keep a copy after the first use
    e.respondWith(caches.open(CACHE).then((c) => c.match(e.request).then((hit) => hit || fetch(e.request).then((res) => { if (res.ok) c.put(e.request, res.clone()); return res; }))));
    return;
  }
  // the page: fresh when online, cached when offline
  e.respondWith(fetch(e.request).then((res) => { if (res.ok) caches.open(CACHE).then((c) => c.put(e.request, res.clone())); return res; }).catch(() => caches.match(e.request).then((hit) => hit || caches.match('./index.html'))));
});

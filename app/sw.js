/* Tenbright offline support: the page and Pip's audio are cached on the device so lessons work without internet.
   Nothing is sent anywhere; this only stores the app's own files. */
const CACHE = 'tenbright-v6ec40b11e4';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './art/welcome.webp', './art/welcome-1600.webp', './art/celebrate.webp', './art/celebrate-1600.webp', './art/journal.webp', './art/journal-1600.webp', './art/welcome-depth.webp', './art/celebrate-depth.webp', './art/journal-depth.webp', './art/pip-hero.webp', './art/who-world.webp', './art/who-hero.webp', './art/zuri-hero.webp', './art/coin-penny.webp', './art/coin-nickel.webp', './art/coin-dime.webp', './art/coin-quarter.webp', './art/obj/acorn.svg', './art/obj/apple.svg', './art/obj/bag.svg', './art/obj/ball.svg', './art/obj/banana.svg', './art/obj/basket.svg', './art/obj/bead.svg', './art/obj/bike-bell.svg', './art/obj/bill.svg', './art/obj/book-set.svg', './art/obj/book.svg', './art/obj/box.svg', './art/obj/bread.svg', './art/obj/calendar.svg', './art/obj/card.svg', './art/obj/chart-down.svg', './art/obj/chart-up.svg', './art/obj/coin.svg', './art/obj/cookie.svg', './art/obj/crayon.svg', './art/obj/eraser.svg', './art/obj/game.svg', './art/obj/jar.svg', './art/obj/juice.svg', './art/obj/kite.svg', './art/obj/leaf.svg', './art/obj/lemon.svg', './art/obj/lemonade.svg', './art/obj/marble.svg', './art/obj/marker.svg', './art/obj/melon.svg', './art/obj/money-bag.svg', './art/obj/notebook.svg', './art/obj/orange.svg', './art/obj/pad.svg', './art/obj/pen.svg', './art/obj/pencil.svg', './art/obj/pie.svg', './art/obj/piggy-bank.svg', './art/obj/pizza.svg', './art/obj/placard.svg', './art/obj/ribbon.svg', './art/obj/ruler.svg', './art/obj/shell.svg', './art/obj/stamp.svg', './art/obj/sticker.svg', './art/obj/toy-car.svg', './art/obj/watermelon.svg'];
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

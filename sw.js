/* Selezione Fenotipi — service worker
 *
 * Mette in cache il guscio dell'app (HTML, icone, manifest) cosi' si apre
 * anche senza rete. Le chiamate al foglio NON si mettono mai in cache:
 * se non c'e' rete devono fallire subito, cosi' l'app le accoda sul telefono
 * invece di mostrare dati vecchi spacciandoli per aggiornati.
 */

var CACHE = 'fenotipi-v1';
var GUSCIO = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(GUSCIO); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (chiavi) {
        return Promise.all(chiavi.map(function (k) {
          return k === CACHE ? null : caches.delete(k);
        }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;                      // i salvataggi passano diretti
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;       // Apps Script: mai dalla cache

  // rete prima, cache come rete di sicurezza
  e.respondWith(
    fetch(req)
      .then(function (res) {
        if (res && res.status === 200 && res.type === 'basic') {
          var copia = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copia); });
        }
        return res;
      })
      .catch(function () {
        return caches.match(req).then(function (hit) {
          return hit || caches.match('./index.html');
        });
      })
  );
});

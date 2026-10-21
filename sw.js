/* Almoxarifado Osório — service worker: abre o app sem internet.
   Os dados ficam no cache offline do próprio Firebase. */
const CACHE = 'almox-v2';
const BASE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
const CDN = ['cdnjs.cloudflare.com', 'www.gstatic.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Página do app: tenta a internet primeiro (pega a versão nova), sem internet usa a cópia guardada
  if (req.mode === 'navigate' || (url.origin === location.origin && url.pathname.endsWith('index.html'))) {
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(ca => ca.put('./index.html', c)); return r; })
      .catch(() => caches.match('./index.html').then(r => r || caches.match('./'))));
    return;
  }
  // Bibliotecas e fontes: usa a cópia guardada, e guarda na primeira vez
  if (CDN.includes(url.hostname) || url.origin === location.origin) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
      if (r.ok || r.type === 'opaque') { const c = r.clone(); caches.open(CACHE).then(ca => ca.put(req, c)); }
      return r;
    })));
  }
});

// খতিয়ান — offline service worker
const V = 'khatian-v2', FONTS = 'khatian-fonts';
const CORE = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-maskable.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== V && k !== FONTS).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// answer from cache at once, refresh the cache in the background
async function swr(e, cacheName, key) {
  const c = await caches.open(cacheName);
  const hit = await c.match(key);
  const net = fetch(e.request)
    .then(res => { if (res && (res.ok || res.type === 'opaque')) c.put(key, res.clone()); return res; })
    .catch(() => null);
  e.waitUntil(net);
  return hit || (await net) || Response.error();
}

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com') {
    e.respondWith(swr(e, FONTS, r));
    return;
  }
  if (u.origin !== location.origin) return;
  if (r.mode === 'navigate') {
    e.respondWith(swr(e, V, './index.html'));
    return;
  }
  e.respondWith(swr(e, V, r));
});

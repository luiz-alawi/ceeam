// Service worker mínimo: cache "app shell" para permitir instalação como PWA
// e um fallback básico offline. Dados (rotas /api, server actions) sempre vão
// à rede para não exibir informação desatualizada.
const CACHE = 'ceeam-v1';
const SHELL = ['/', '/login', '/dashboard', '/manifest.webmanifest', '/logo.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Nunca cacheia dados dinâmicos.
  if (url.pathname.startsWith('/api') || url.search.includes('_rsc')) return;

  // Network-first com fallback ao cache (bom para conteúdo que muda).
  event.respondWith(
    fetch(request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(request).then((c) => c || caches.match('/'))),
  );
});

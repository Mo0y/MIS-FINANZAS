/* =========================================================
   SERVICE WORKER de "Mis Finanzas"
   Guarda una copia de la app en el teléfono para que abra
   aunque no haya internet.
   IMPORTANTE: cada vez que subas una versión nueva de
   index.html, cambia el número de VERSION (v1 → v2 → v3...)
   para que los teléfonos descarguen la actualización.
   ========================================================= */
const VERSION = 'v3';
const CACHE = 'mis-finanzas-' + VERSION;

// Archivos que forman la app
const ARCHIVOS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
  './favicon.png'
];

// 1. Instalación: descarga y guarda todos los archivos
self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ARCHIVOS)).then(() => self.skipWaiting())
  );
});

// 2. Activación: borra las copias de versiones anteriores
self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((nombres) => Promise.all(nombres.filter((n) => n.startsWith('mis-finanzas-') && n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

// 3. Cada vez que la app pide un archivo:
//    responde al instante con la copia guardada y, si hay internet,
//    actualiza la copia en segundo plano.
self.addEventListener('fetch', (evento) => {
  const req = evento.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  const esPagina = req.mode === 'navigate';
  evento.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const guardado = await cache.match(esPagina ? './index.html' : req, { ignoreSearch: true });
      const deRed = fetch(req)
        .then((resp) => {
          if (resp && resp.ok) cache.put(esPagina ? './index.html' : req, resp.clone());
          return resp;
        })
        .catch(() => null);
      if (guardado) { evento.waitUntil(deRed); return guardado; }
      const resp = await deRed;
      return resp || new Response('Sin conexión', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    })
  );
});

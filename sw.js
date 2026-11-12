// ==============================================================================
// GOMEX DISTRIBUIDORA · SERVICE WORKER PWA (PAINEL EXECUTIVO)
// ==============================================================================

const CACHE_NAME = 'gomex-painel-pwa-v1.4';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('[PWA] Cache parcial durante install:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Requisições para APIs do backend: Network First com fallback para cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(req)
        .then(networkRes => {
          return networkRes;
        })
        .catch(() => {
          return caches.match(req);
        })
    );
    return;
  }

  // Navegação de páginas (rotas SPA como /vistoria, /frota, etc.): Network first com atualização de cache, fallback para cache
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(networkRes => {
          if (networkRes && networkRes.status === 200) {
            const resClone = networkRes.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(req, resClone);
              cache.put('/index.html', networkRes.clone());
            });
          }
          return networkRes;
        })
        .catch(() => {
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // Assets estáticos (fontes, scripts, css, imagens): Cache First com revalidação
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(networkRes => {
        if (networkRes && networkRes.status === 200 && req.method === 'GET') {
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, resClone));
        }
        return networkRes;
      }).catch(() => cached);
    })
  );
});

// ==============================================================================
// WEB PUSH: ATENDIMENTO A NOTIFICAÇÕES EM SEGUNDO PLANO NO CELULAR/APARELHO
// ==============================================================================
self.addEventListener('push', event => {
  event.waitUntil((async () => {
    let title = 'Gomex Frota · Alerta da Frota';
    let body = 'Nova vistoria ou alteração de veículo registrada.';
    let targetUrl = '/';

    if (event.data) {
      try {
        const payload = event.data.json();
        if (payload.title) title = payload.title;
        if (payload.body) body = payload.body;
        if (payload.url) targetUrl = payload.url;
      } catch (e) {
        try {
          const txt = event.data.text();
          if (txt) body = txt;
        } catch (err) {}
      }
    } else {
      // Se não veio payload criptografado, consulta o último alerta no servidor
      try {
        const res = await fetch('/api/push-ultimo-alerta', { cache: 'no-store' });
        if (res.ok) {
          const info = await res.json();
          if (info.title) title = info.title;
          if (info.body) body = info.body;
          if (info.url) targetUrl = info.url;
        }
      } catch (err) {}
    }

    const options = {
      body,
      icon: '/icon.svg',
      badge: '/icon.svg',
      vibrate: [200, 100, 200],
      tag: 'gomex-frota-alerta',
      renotify: true,
      data: {
        url: targetUrl,
        timestamp: Date.now()
      },
      actions: [
        { action: 'open', title: 'Abrir Painel' }
      ]
    };

    return self.registration.showNotification(title, options);
  })());
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});



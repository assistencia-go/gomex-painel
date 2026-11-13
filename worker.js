// ==============================================================================
// GOMEX DISTRIBUIDORA · CLOUDFLARE WORKER & API BACKEND (PAINEL EXECUTIVO)
// ==============================================================================

const FALLBACK_KEY_B64 = 'c2Jfc2VjcmV0XzF6ZXd0MUlSU1loMnhYQUYzbUJDT1FfMHZ5SEVtVDU=';

const ALLOWED_PATCH_COLS = new Set([
  'veiculo', 'veiculo_outro', 'placa', 'km', 'motorista', 'rota',
  'data', 'hora', 'tipo', 'combustivel',
  'rev_ult_km', 'rev_ult_data', 'rev_prox_km', 'rev_prox_data',
  'avarias', 'sem_avarias', 'pneus', 'pneu_dano', 'itens',
  'extintor_validade', 'thermo_temp', 'outro_item',
  'obs', 'condicao_motorista', 'liberacao',
  'ass_motorista', 'ass_vistoriador', 'ass_responsavel', 'status'
]);

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'geolocation=(), camera=(), microphone=()',
  'X-XSS-Protection': '1; mode=block'
};

function getSupabaseKey(env) {
  if (env && env.SUPABASE_KEY) return env.SUPABASE_KEY;
  try {
    if (typeof atob === 'function') return atob(FALLBACK_KEY_B64);
    if (typeof Buffer !== 'undefined') return Buffer.from(FALLBACK_KEY_B64, 'base64').toString('utf8');
  } catch (e) {}
  return '';
}

const VAPID_PUB_B64URL = 'BNC0C6aRpTSIkY76KeYB_x7VTA52qvjRrV6nAoeHHpZHgC6chgFIA2SCL-ZklO2bJ4egYC8yydWvV-ypBZW9Qfc';
const PRIV_JWK = {
  key_ops: ['sign'],
  ext: true,
  kty: 'EC',
  x: '0LQLppGlNIiRjvop5gH_HtVMDnaq-NGtXqcCh4celkc',
  y: 'gC6chgFIA2SCL-ZklO2bJ4egYC8yydWvV-ypBZW9Qfc',
  crv: 'P-256',
  d: '-SIssqVleGqKh03BuMunJteSZYOC5XxA1RG4Q_0hbVY'
};

const EMBEDDED_MANIFEST = "{\n  \"name\": \"Gomex Frota - Painel Executivo\",\n  \"short_name\": \"Gomex Frota\",\n  \"description\": \"Painel Executivo de Gestao de Frota e Auditoria de Vistorias da Gomex Distribuidora\",\n  \"start_url\": \"/\",\n  \"scope\": \"/\",\n  \"display\": \"standalone\",\n  \"orientation\": \"any\",\n  \"background_color\": \"#0f0f13\",\n  \"theme_color\": \"#16161b\",\n  \"categories\": [\n    \"business\",\n    \"productivity\",\n    \"utilities\"\n  ],\n  \"icons\": [\n    {\n      \"src\": \"/icon.svg\",\n      \"sizes\": \"512x512 192x192 any\",\n      \"type\": \"image/svg+xml\",\n      \"purpose\": \"any maskable\"\n    }\n  ]\n}\n";
const EMBEDDED_SW = "// ==============================================================================\n// GOMEX DISTRIBUIDORA · SERVICE WORKER PWA (PAINEL EXECUTIVO)\n// ==============================================================================\n\nconst CACHE_NAME = 'gomex-painel-pwa-v1.4';\nconst STATIC_ASSETS = [\n  '/',\n  '/index.html',\n  '/manifest.json',\n  '/icon.svg',\n  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',\n  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'\n];\n\nself.addEventListener('install', event => {\n  event.waitUntil(\n    caches.open(CACHE_NAME).then(cache => {\n      return cache.addAll(STATIC_ASSETS).catch(err => {\n        console.warn('[PWA] Cache parcial durante install:', err);\n      });\n    })\n  );\n  self.skipWaiting();\n});\n\nself.addEventListener('activate', event => {\n  event.waitUntil(\n    caches.keys().then(keys => {\n      return Promise.all(\n        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))\n      );\n    })\n  );\n  self.clients.claim();\n});\n\nself.addEventListener('fetch', event => {\n  const req = event.request;\n  const url = new URL(req.url);\n\n  // Requisições para APIs do backend: Network First com fallback para cache\n  if (url.pathname.startsWith('/api/')) {\n    event.respondWith(\n      fetch(req)\n        .then(networkRes => {\n          return networkRes;\n        })\n        .catch(() => {\n          return caches.match(req);\n        })\n    );\n    return;\n  }\n\n  // Navegação de páginas (rotas SPA como /vistoria, /frota, etc.): Network first com atualização de cache, fallback para cache\n  if (req.mode === 'navigate') {\n    event.respondWith(\n      fetch(req)\n        .then(networkRes => {\n          if (networkRes && networkRes.status === 200) {\n            const resClone = networkRes.clone();\n            caches.open(CACHE_NAME).then(cache => {\n              cache.put(req, resClone);\n              cache.put('/index.html', networkRes.clone());\n            });\n          }\n          return networkRes;\n        })\n        .catch(() => {\n          return caches.match('/index.html') || caches.match('/');\n        })\n    );\n    return;\n  }\n\n  // Assets estáticos (fontes, scripts, css, imagens): Cache First com revalidação\n  event.respondWith(\n    caches.match(req).then(cached => {\n      if (cached) return cached;\n      return fetch(req).then(networkRes => {\n        if (networkRes && networkRes.status === 200 && req.method === 'GET') {\n          const resClone = networkRes.clone();\n          caches.open(CACHE_NAME).then(cache => cache.put(req, resClone));\n        }\n        return networkRes;\n      }).catch(() => cached);\n    })\n  );\n});\n\n// ==============================================================================\n// WEB PUSH: ATENDIMENTO A NOTIFICAÇÕES EM SEGUNDO PLANO NO CELULAR/APARELHO\n// ==============================================================================\nself.addEventListener('push', event => {\n  event.waitUntil((async () => {\n    let title = 'Gomex Frota · Alerta da Frota';\n    let body = 'Nova vistoria ou alteração de veículo registrada.';\n    let targetUrl = '/';\n\n    if (event.data) {\n      try {\n        const payload = event.data.json();\n        if (payload.title) title = payload.title;\n        if (payload.body) body = payload.body;\n        if (payload.url) targetUrl = payload.url;\n      } catch (e) {\n        try {\n          const txt = event.data.text();\n          if (txt) body = txt;\n        } catch (err) {}\n      }\n    } else {\n      // Se não veio payload criptografado, consulta o último alerta no servidor\n      try {\n        const res = await fetch('/api/push-ultimo-alerta', { cache: 'no-store' });\n        if (res.ok) {\n          const info = await res.json();\n          if (info.title) title = info.title;\n          if (info.body) body = info.body;\n          if (info.url) targetUrl = info.url;\n        }\n      } catch (err) {}\n    }\n\n    const options = {\n      body,\n      icon: '/icon.svg',\n      badge: '/icon.svg',\n      vibrate: [200, 100, 200],\n      tag: 'gomex-frota-alerta',\n      renotify: true,\n      data: {\n        url: targetUrl,\n        timestamp: Date.now()\n      },\n      actions: [\n        { action: 'open', title: 'Abrir Painel' }\n      ]\n    };\n\n    return self.registration.showNotification(title, options);\n  })());\n});\n\nself.addEventListener('notificationclick', event => {\n  event.notification.close();\n  const targetUrl = event.notification.data?.url || '/';\n\n  event.waitUntil(\n    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {\n      for (const client of windowClients) {\n        if (client.url.includes(self.location.origin) && 'focus' in client) {\n          client.navigate(targetUrl);\n          return client.focus();\n        }\n      }\n      if (clients.openWindow) {\n        return clients.openWindow(targetUrl);\n      }\n    })\n  );\n});\n\n\n";
const EMBEDDED_ICON = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\" width=\"512\" height=\"512\">\n  <defs>\n    <!-- Gradiente de Fundo Executivo Obsidian Dark -->\n    <radialGradient id=\"bgRadial\" cx=\"50%\" cy=\"38%\" r=\"65%\" fx=\"50%\" fy=\"30%\">\n      <stop offset=\"0%\" stop-color=\"#222330\"/>\n      <stop offset=\"55%\" stop-color=\"#15161c\"/>\n      <stop offset=\"100%\" stop-color=\"#0c0d11\"/>\n    </radialGradient>\n\n    <!-- Gradiente de Borda Metálica Coral / Bronze -->\n    <linearGradient id=\"rimGrad\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\">\n      <stop offset=\"0%\" stop-color=\"#ff9a85\" stop-opacity=\"0.85\"/>\n      <stop offset=\"45%\" stop-color=\"#ed8570\" stop-opacity=\"0.35\"/>\n      <stop offset=\"80%\" stop-color=\"#3b201a\" stop-opacity=\"0.2\"/>\n      <stop offset=\"100%\" stop-color=\"#ff7a5e\" stop-opacity=\"0.7\"/>\n    </linearGradient>\n\n    <!-- Gradiente do Símbolo Principal do Caminhão -->\n    <linearGradient id=\"bodyGrad\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\">\n      <stop offset=\"0%\" stop-color=\"#ffffff\"/>\n      <stop offset=\"40%\" stop-color=\"#fff1ee\"/>\n      <stop offset=\"85%\" stop-color=\"#fed7ce\"/>\n      <stop offset=\"100%\" stop-color=\"#ed8570\"/>\n    </linearGradient>\n\n    <!-- Gradiente Coral Neon para Detalhes e Faróis -->\n    <linearGradient id=\"neonCoral\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"0%\">\n      <stop offset=\"0%\" stop-color=\"#ff9a85\"/>\n      <stop offset=\"100%\" stop-color=\"#ed8570\"/>\n    </linearGradient>\n\n    <!-- Gradiente Escudo de Auditoria -->\n    <linearGradient id=\"shieldGrad\" x1=\"0%\" y1=\"0%\" x2=\"0%\" y2=\"100%\">\n      <stop offset=\"0%\" stop-color=\"#ed8570\" stop-opacity=\"0.25\"/>\n      <stop offset=\"100%\" stop-color=\"#ed8570\" stop-opacity=\"0.05\"/>\n    </linearGradient>\n\n    <!-- Sombra e Brilho de Alta Resolução -->\n    <filter id=\"truckShadow\" x=\"-20%\" y=\"-20%\" width=\"140%\" height=\"140%\">\n      <feDropShadow dx=\"0\" dy=\"16\" stdDeviation=\"18\" flood-color=\"#000000\" flood-opacity=\"0.75\"/>\n      <feDropShadow dx=\"0\" dy=\"4\" stdDeviation=\"8\" flood-color=\"#ed8570\" flood-opacity=\"0.35\"/>\n    </filter>\n\n    <filter id=\"rimGlow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\">\n      <feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-color=\"#ed8570\" flood-opacity=\"0.4\"/>\n    </filter>\n  </defs>\n\n  <!-- Fundo Squircle Suave PWA (Seguro para máscara circular no Android e cantos no iOS/Windows) -->\n  <rect width=\"512\" height=\"512\" rx=\"116\" fill=\"url(#bgRadial)\"/>\n  \n  <!-- Borda de Precisão com Brilho Superior -->\n  <rect x=\"14\" y=\"14\" width=\"484\" height=\"484\" rx=\"104\" fill=\"none\" stroke=\"url(#rimGrad)\" stroke-width=\"4.5\" filter=\"url(#rimGlow)\"/>\n\n  <!-- Malha de Fundo Sutil de Alta Tecnologia (Linhas de Precisão) -->\n  <g opacity=\"0.06\" stroke=\"#ffffff\" stroke-width=\"1.2\">\n    <line x1=\"80\" y1=\"120\" x2=\"432\" y2=\"120\"/>\n    <line x1=\"80\" y1=\"256\" x2=\"432\" y2=\"256\"/>\n    <line x1=\"80\" y1=\"392\" x2=\"432\" y2=\"392\"/>\n    <line x1=\"168\" y1=\"80\" x2=\"168\" y2=\"432\"/>\n    <line x1=\"344\" y1=\"80\" x2=\"344\" y2=\"432\"/>\n  </g>\n\n  <!-- Escudo Central de Segurança & Frota no Fundo do Ícone -->\n  <path d=\"M256 128 L356 168 V266 C356 332 256 376 256 376 C256 376 156 332 156 266 V168 Z\" \n        fill=\"url(#shieldGrad)\" stroke=\"url(#neonCoral)\" stroke-width=\"2\" stroke-opacity=\"0.35\" stroke-dasharray=\"6 4\"/>\n\n  <!-- Grupo Principal do Caminhão e Prontuário Executivo -->\n  <g filter=\"url(#truckShadow)\">\n    \n    <!-- Silhueta da Carroceria / Baú (Gomex Carga Segura) -->\n    <path d=\"M116 196 C116 182 126 172 140 172 H272 C282 172 290 180 290 190 V314 C290 320 286 324 280 324 H126 C120 324 116 320 116 314 Z\" \n          fill=\"#171821\" stroke=\"url(#bodyGrad)\" stroke-width=\"6.5\" stroke-linejoin=\"round\"/>\n\n    <!-- Detalhes do Baú: Frisos Aerodinâmicos Horizontais -->\n    <line x1=\"140\" y1=\"214\" x2=\"266\" y2=\"214\" stroke=\"url(#neonCoral)\" stroke-width=\"3\" stroke-linecap=\"round\" opacity=\"0.85\"/>\n    <line x1=\"140\" y1=\"242\" x2=\"246\" y2=\"242\" stroke=\"#ffffff\" stroke-width=\"2.5\" stroke-linecap=\"round\" opacity=\"0.45\"/>\n    <line x1=\"140\" y1=\"270\" x2=\"266\" y2=\"270\" stroke=\"url(#neonCoral)\" stroke-width=\"3\" stroke-linecap=\"round\" opacity=\"0.85\"/>\n\n    <!-- Cabine Dianteira com Design Aerodinâmico Moderno -->\n    <path d=\"M290 216 H342 C354 216 364 224 370 234 L392 272 C395 277 396 283 396 288 V316 C396 321 392 324 388 324 H290 V216 Z\" \n          fill=\"#171821\" stroke=\"url(#bodyGrad)\" stroke-width=\"6.5\" stroke-linejoin=\"round\"/>\n\n    <!-- Para-brisa / Janela da Cabine com Reflexo Translúcido Coral -->\n    <path d=\"M302 230 H338 C344 230 350 234 354 240 L368 266 C370 270 368 274 364 274 H302 V230 Z\" \n          fill=\"url(#neonCoral)\" fill-opacity=\"0.32\" stroke=\"url(#neonCoral)\" stroke-width=\"2\"/>\n\n    <!-- Farol Dianteiro de LED Gomex -->\n    <path d=\"M386 294 L396 294 L394 306 L384 306 Z\" fill=\"#ffffff\" filter=\"url(#rimGlow)\"/>\n\n    <!-- Linha de Chassi / Base -->\n    <line x1=\"104\" y1=\"324\" x2=\"408\" y2=\"324\" stroke=\"url(#bodyGrad)\" stroke-width=\"6\" stroke-linecap=\"round\"/>\n\n    <!-- Rodas Reforçadas Traseiras e Dianteiras -->\n    <!-- Roda Traseira 1 -->\n    <g transform=\"translate(162, 324)\">\n      <circle cx=\"0\" cy=\"0\" r=\"28\" fill=\"#0d0e12\" stroke=\"url(#bodyGrad)\" stroke-width=\"5\"/>\n      <circle cx=\"0\" cy=\"0\" r=\"16\" fill=\"#1b1c24\" stroke=\"url(#neonCoral)\" stroke-width=\"3\"/>\n      <circle cx=\"0\" cy=\"0\" r=\"7\" fill=\"#ffffff\"/>\n    </g>\n\n    <!-- Roda Traseira 2 -->\n    <g transform=\"translate(226, 324)\">\n      <circle cx=\"0\" cy=\"0\" r=\"28\" fill=\"#0d0e12\" stroke=\"url(#bodyGrad)\" stroke-width=\"5\"/>\n      <circle cx=\"0\" cy=\"0\" r=\"16\" fill=\"#1b1c24\" stroke=\"url(#neonCoral)\" stroke-width=\"3\"/>\n      <circle cx=\"0\" cy=\"0\" r=\"7\" fill=\"#ffffff\"/>\n    </g>\n\n    <!-- Roda Dianteira -->\n    <g transform=\"translate(352, 324)\">\n      <circle cx=\"0\" cy=\"0\" r=\"28\" fill=\"#0d0e12\" stroke=\"url(#bodyGrad)\" stroke-width=\"5\"/>\n      <circle cx=\"0\" cy=\"0\" r=\"16\" fill=\"#1b1c24\" stroke=\"url(#neonCoral)\" stroke-width=\"3\"/>\n      <circle cx=\"0\" cy=\"0\" r=\"7\" fill=\"#ffffff\"/>\n    </g>\n\n    <!-- Selo de Verificação / Checkmark de Vistoria Oficial no Topo da Cabine -->\n    <g transform=\"translate(256, 128) scale(1.15)\">\n      <circle cx=\"0\" cy=\"0\" r=\"18\" fill=\"#ed8570\"/>\n      <path d=\"M-6 0 L-2 4 L7 -5\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"3.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n    </g>\n  </g>\n</svg>\n";

let ultimoAlertaPush = {
  title: 'Gomex Frota · Sistema Conectado',
  body: 'Notificações ativadas com sucesso neste aparelho.',
  url: '/',
  timestamp: Date.now()
};

function strToB64Url(str) {
  let b64;
  if (typeof btoa === 'function') {
    b64 = btoa(unescape(encodeURIComponent(str)));
  } else {
    b64 = Buffer.from(str, 'utf8').toString('base64');
  }
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function bufToB64Url(buf) {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  const b64 = btoa(bin);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function gerarVapidJwt(endpointUrl, subject = 'mailto:contato@gomex.com.br') {
  try {
    const urlObj = new URL(endpointUrl);
    const audience = `${urlObj.protocol}//${urlObj.host}`;
    const now = Math.floor(Date.now() / 1000);
    const header = { typ: 'JWT', alg: 'ES256' };
    const payload = {
      aud: audience,
      exp: now + 43200,
      sub: subject
    };

    const unsigned = strToB64Url(JSON.stringify(header)) + '.' + strToB64Url(JSON.stringify(payload));
    const cryptoSubtle = (typeof crypto !== 'undefined' && crypto.subtle) ? crypto.subtle : require('crypto').webcrypto.subtle;

    const key = await cryptoSubtle.importKey(
      'jwk',
      PRIV_JWK,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['sign']
    );

    const encoder = new TextEncoder();
    const sig = await cryptoSubtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      key,
      encoder.encode(unsigned)
    );

    return unsigned + '.' + bufToB64Url(sig);
  } catch (e) {
    return '';
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Sanitização de Segurança: Redireciona removendo credenciais da URL se alguém acessar com parâmetros no link
    if (url.searchParams.has('username') || url.searchParams.has('password') || url.searchParams.has('user') || url.searchParams.has('pass')) {
      const cleanUrl = new URL(request.url);
      cleanUrl.searchParams.delete('username');
      cleanUrl.searchParams.delete('password');
      cleanUrl.searchParams.delete('user');
      cleanUrl.searchParams.delete('pass');
      return Response.redirect(cleanUrl.toString(), 302);
    }

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
      ...SECURITY_HEADERS
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Atalhos amigáveis e redirecionamentos
    if (url.pathname === '/checklist' || url.pathname === '/check-list') {
      return Response.redirect('https://gomex-checklist.gomexassistencia2026.workers.dev/', 302);
    }

    // 0. ATENDIMENTO DE ASSETS DO PWA (MANIFEST, SERVICE WORKER E ÍCONE)
    if (url.pathname === '/manifest.json') {
      return new Response(EMBEDDED_MANIFEST, {
        status: 200,
        headers: { 'Content-Type': 'application/manifest+json; charset=utf-8', 'Cache-Control': 'public, max-age=3600', ...corsHeaders }
      });
    }

    if (url.pathname === '/sw.js') {
      return new Response(EMBEDDED_SW, {
        status: 200,
        headers: { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-cache', 'Service-Worker-Allowed': '/', ...corsHeaders }
      });
    }

    if (url.pathname === '/icon.svg') {
      return new Response(EMBEDDED_ICON, {
        status: 200,
        headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400', ...corsHeaders }
      });
    }

    // 1. ROTA HEALTH CHECK
    if (url.pathname === '/api/health') {
      return new Response(JSON.stringify({
        status: 'online',
        service: 'gomex-painel',
        runtime: 'cloudflare-worker',
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    // 1.2 ROTAS DE WEB PUSH NOTIFICATIONS
    if (url.pathname === '/api/push-vapid-key') {
      return new Response(JSON.stringify({ ok: true, publicKey: VAPID_PUB_B64URL }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    if (url.pathname === '/api/push-ultimo-alerta') {
      return new Response(JSON.stringify(ultimoAlertaPush), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
      });
    }

    if (url.pathname === '/api/push-subscribe') {
      if (request.method === 'POST') {
        try {
          const payload = await request.json();
          const sub = payload.subscription || (payload.endpoint ? payload : null);
          if (!sub || !sub.endpoint) {
            return new Response(JSON.stringify({ error: 'Inscrição push inválida' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
            });
          }

          const supabaseUrl = ((env && env.SUPABASE_URL) || 'https://lhjeodmnqwsftifdvaru.supabase.co').replace(/\/+$/, '');
          const supabaseKey = getSupabaseKey(env);

          let subs = [];
          try {
            const getRes = await fetch(`${supabaseUrl}/rest/v1/parametros?id=eq.frota_push_subscriptions_v1&select=*`, {
              headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
            });
            if (getRes.ok) {
              const rows = await getRes.json();
              if (rows && rows[0] && rows[0].descricao) {
                subs = JSON.parse(rows[0].descricao) || [];
              }
            }
          } catch (e) {}

          const map = new Map();
          subs.forEach(s => s && s.endpoint && map.set(s.endpoint, s));
          map.set(sub.endpoint, {
            ...sub,
            userAgent: payload.userAgent || '',
            deviceName: payload.deviceName || 'Aparelho',
            updatedAt: new Date().toISOString()
          });
          const atualizados = Array.from(map.values());

          await fetch(`${supabaseUrl}/rest/v1/parametros`, {
            method: 'POST',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify([{
              id: 'frota_push_subscriptions_v1',
              valor: atualizados.length,
              descricao: JSON.stringify(atualizados)
            }])
          });

          return new Response(JSON.stringify({ ok: true, total: atualizados.length }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
          });
        }
      }
    }

    if (url.pathname === '/api/push-send') {
      if (request.method === 'POST') {
        try {
          const payload = await request.json();
          ultimoAlertaPush = {
            title: payload.title || 'Gomex Frota · Alerta da Frota',
            body: payload.body || 'Nova movimentação na frota.',
            url: payload.url || '/',
            timestamp: Date.now()
          };

          const supabaseUrl = ((env && env.SUPABASE_URL) || 'https://lhjeodmnqwsftifdvaru.supabase.co').replace(/\/+$/, '');
          const supabaseKey = getSupabaseKey(env);

          let subs = [];
          try {
            const getRes = await fetch(`${supabaseUrl}/rest/v1/parametros?id=eq.frota_push_subscriptions_v1&select=*`, {
              headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
            });
            if (getRes.ok) {
              const rows = await getRes.json();
              if (rows && rows[0] && rows[0].descricao) {
                subs = JSON.parse(rows[0].descricao) || [];
              }
            }
          } catch (e) {}

          let sentCount = 0;
          const validEndpoints = [];

          for (const sub of subs) {
            if (!sub || !sub.endpoint) continue;
            try {
              const jwt = await gerarVapidJwt(sub.endpoint);
              if (!jwt) continue;

              const pushRes = await fetch(sub.endpoint, {
                method: 'POST',
                headers: {
                  'TTL': '86400',
                  'Urgency': 'high',
                  'Authorization': `vapid t=${jwt}, k=${VAPID_PUB_B64URL}`,
                  'Content-Length': '0'
                }
              });

              if (pushRes.status === 410 || pushRes.status === 404) {
                continue;
              }

              validEndpoints.push(sub);
              if (pushRes.ok || pushRes.status === 201 || pushRes.status === 200 || pushRes.status === 202) {
                sentCount++;
              }
            } catch (e) {
              validEndpoints.push(sub);
            }
          }

          if (validEndpoints.length !== subs.length) {
            try {
              await fetch(`${supabaseUrl}/rest/v1/parametros`, {
                method: 'POST',
                headers: {
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${supabaseKey}`,
                  'Content-Type': 'application/json',
                  'Prefer': 'resolution=merge-duplicates'
                },
                body: JSON.stringify([{
                  id: 'frota_push_subscriptions_v1',
                  valor: validEndpoints.length,
                  descricao: JSON.stringify(validEndpoints)
                }])
              });
            } catch (e) {}
          }

          return new Response(JSON.stringify({ ok: true, sent: sentCount, total: subs.length }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
          });
        }
      }
    }

    // 1.5 ROTA DE CUSTOS, PEÇAS E INSUMOS DA FROTA (/api/frota-gastos)
    if (url.pathname === '/api/frota-gastos') {
      const supabaseUrl = ((env && env.SUPABASE_URL) || 'https://lhjeodmnqwsftifdvaru.supabase.co').replace(/\/+$/, '');
      const supabaseKey = getSupabaseKey(env);

      if (request.method === 'GET') {
        try {
          const res = await fetch(`${supabaseUrl}/rest/v1/parametros?id=in.(frota_catalogo_produtos_v1,frota_lancamentos_gastos_v1,frota_historico_manutencoes_v1,frota_galeria_veiculos_v1,frota_cadastro_veiculos_v1,frota_ocorrencias_v1,frota_agendamentos_servicos_v1,frota_permissoes_usuarios_v1)&select=*`, {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            }
          });
          const rows = await res.json();
          const out = { produtos: null, lancamentos: [], historico_manutencoes: {}, galeria: [], veiculos: [], ocorrencias: [], agendamentos: [], permissoes: null };
          if (Array.isArray(rows)) {
            for (const row of rows) {
              if (row.id === 'frota_catalogo_produtos_v1' && row.descricao) {
                try { out.produtos = JSON.parse(row.descricao); } catch (e) {}
              }
              if (row.id === 'frota_lancamentos_gastos_v1' && row.descricao) {
                try { out.lancamentos = JSON.parse(row.descricao); } catch (e) {}
              }
              if (row.id === 'frota_historico_manutencoes_v1' && row.descricao) {
                try { out.historico_manutencoes = JSON.parse(row.descricao); } catch (e) {}
              }
              if (row.id === 'frota_galeria_veiculos_v1' && row.descricao) {
                try { out.galeria = JSON.parse(row.descricao); } catch (e) {}
              }
              if (row.id === 'frota_cadastro_veiculos_v1' && row.descricao) {
                try { out.veiculos = JSON.parse(row.descricao); } catch (e) {}
              }
              if (row.id === 'frota_ocorrencias_v1' && row.descricao) {
                try { out.ocorrencias = JSON.parse(row.descricao); } catch (e) {}
              }
              if (row.id === 'frota_agendamentos_servicos_v1' && row.descricao) {
                try { out.agendamentos = JSON.parse(row.descricao); } catch (e) {}
              }
              if (row.id === 'frota_permissoes_usuarios_v1' && row.descricao) {
                try { out.permissoes = JSON.parse(row.descricao); } catch (e) {}
              }
            }
          }
          return new Response(JSON.stringify(out), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
          });
        } catch (err) {
          return new Response(JSON.stringify({ produtos: null, lancamentos: [], historico_manutencoes: {}, galeria: [], veiculos: [], ocorrencias: [], agendamentos: [] }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
          });
        }
      }

      if (request.method === 'POST' || request.method === 'PATCH') {
        try {
          const payload = await request.json();
          const rowsToUpsert = [];
          if (Array.isArray(payload.produtos)) {
            rowsToUpsert.push({
              id: 'frota_catalogo_produtos_v1',
              valor: payload.produtos.length,
              descricao: JSON.stringify(payload.produtos)
            });
          }
          if (Array.isArray(payload.lancamentos)) {
            const totalInvestido = payload.lancamentos.reduce((acc, g) => acc + (Number(g.valor_total) || 0), 0);
            rowsToUpsert.push({
              id: 'frota_lancamentos_gastos_v1',
              valor: Number(totalInvestido.toFixed(2)),
              descricao: JSON.stringify(payload.lancamentos)
            });
          }
          if (payload.historico_manutencoes && typeof payload.historico_manutencoes === 'object') {
            rowsToUpsert.push({
              id: 'frota_historico_manutencoes_v1',
              valor: Object.keys(payload.historico_manutencoes).length,
              descricao: JSON.stringify(payload.historico_manutencoes)
            });
          }
          if (Array.isArray(payload.galeria)) {
            rowsToUpsert.push({
              id: 'frota_galeria_veiculos_v1',
              valor: payload.galeria.length,
              descricao: JSON.stringify(payload.galeria)
            });
          }
          if (Array.isArray(payload.veiculos)) {
            rowsToUpsert.push({
              id: 'frota_cadastro_veiculos_v1',
              valor: payload.veiculos.length,
              descricao: JSON.stringify(payload.veiculos)
            });
          }
          if (Array.isArray(payload.ocorrencias)) {
            rowsToUpsert.push({
              id: 'frota_ocorrencias_v1',
              valor: payload.ocorrencias.length,
              descricao: JSON.stringify(payload.ocorrencias)
            });
          }
          if (Array.isArray(payload.agendamentos)) {
            rowsToUpsert.push({
              id: 'frota_agendamentos_servicos_v1',
              valor: payload.agendamentos.length,
              descricao: JSON.stringify(payload.agendamentos)
            });
          }
          if (payload.permissoes && typeof payload.permissoes === 'object') {
            rowsToUpsert.push({
              id: 'frota_permissoes_usuarios_v1',
              valor: Object.keys(payload.permissoes).length,
              descricao: JSON.stringify(payload.permissoes)
            });
          }
          const res = await fetch(`${supabaseUrl}/rest/v1/parametros`, {
            method: 'POST',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'resolution=merge-duplicates,return=representation'
            },
            body: JSON.stringify(rowsToUpsert)
          });
          return new Response(JSON.stringify({ ok: true, synced: res.ok }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
          });
        } catch (err) {
          return new Response(JSON.stringify({ ok: false, error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
          });
        }
      }
    }

    // 2. ROTA DE CHECKLISTS (GET, PATCH & POST)
    if (url.pathname === '/api/checklists') {
      const supabaseUrl = ((env && env.SUPABASE_URL) || 'https://lhjeodmnqwsftifdvaru.supabase.co').replace(/\/+$/, '');
      const supabaseKey = getSupabaseKey(env);

      // GET /api/checklists
      if (request.method === 'GET') {
        const select = url.searchParams.get('select') || '*';
        const idParam = url.searchParams.get('id');
        if (!/^[a-z0-9_,*]+$/i.test(select) || (idParam !== null && !/^\d+$/.test(idParam))) {
          return new Response(JSON.stringify({ error: 'Parâmetros inválidos' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
          });
        }
        const query = idParam !== null
          ? `select=${select}&id=eq.${idParam}`
          : `select=${select}&order=id.desc&limit=500`;

        try {
          const res = await fetch(`${supabaseUrl}/rest/v1/veiculo_checklists?${query}`, {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            }
          });
          const data = await res.text();
          return new Response(data, {
            status: res.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 502,
            headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
          });
        }
      }

      // PATCH ou POST /api/checklists (Atualizar vistoria, rota, manutenção, parecer ou inativação)
      if (request.method === 'PATCH' || request.method === 'POST') {
        try {
          const rawPayload = await request.json();
          const id = rawPayload?.id;
          if (!id || !/^\d+$/.test(String(id))) {
            return new Response(JSON.stringify({ error: 'ID numérico da vistoria é obrigatório' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
            });
          }

          const cleanPayload = {};
          for (const [k, v] of Object.entries(rawPayload)) {
            if (ALLOWED_PATCH_COLS.has(k) && v !== undefined) {
              cleanPayload[k] = v;
            }
          }

          if (Object.keys(cleanPayload).length === 0) {
            return new Response(JSON.stringify({ error: 'Nenhum campo válido para atualização' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
            });
          }

          const res = await fetch(`${supabaseUrl}/rest/v1/veiculo_checklists?id=eq.${id}`, {
            method: 'PATCH',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(cleanPayload)
          });

          const data = await res.text();
          return new Response(data, {
            status: res.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
          });
        }
      }
    }

    // 3. ATENDIMENTO DE ASSETS ESTÁTICOS VIA BINDING (./public)
    if (env && env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      try {
        const assetRes = await env.ASSETS.fetch(request);
        if (assetRes.status < 400) {
          const out = new Response(assetRes.body, assetRes);
          for (const [k, v] of Object.entries(SECURITY_HEADERS)) out.headers.set(k, v);
          return out;
        }
      } catch (e) {}
    }

    // 4. FALLBACK SPA: SERVIR INDEX.HTML VIA ASSETS
    if (env && env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      try {
        const fallbackRes = await env.ASSETS.fetch(new Request(new URL('/index.html', request.url)));
        if (fallbackRes.status < 400) {
          const out = new Response(fallbackRes.body, fallbackRes);
          for (const [k, v] of Object.entries(SECURITY_HEADERS)) out.headers.set(k, v);
          return out;
        }
      } catch (e) {}
    }

    return new Response('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Gomex Frota</title><meta http-equiv="refresh" content="0;url=/"></head><body>Carregando Gomex Frota...</body></html>', {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache',
        ...SECURITY_HEADERS
      }
    });
  }
};

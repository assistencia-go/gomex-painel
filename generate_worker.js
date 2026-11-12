const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

// Sincronizar public/index.html para Cloudflare Assets / Pages
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
fs.writeFileSync(path.join(publicDir, 'index.html'), htmlContent, 'utf8');

const manifestPath = path.join(__dirname, 'manifest.json');
const manifestContent = fs.existsSync(manifestPath) ? fs.readFileSync(manifestPath, 'utf8') : '{}';
fs.writeFileSync(path.join(publicDir, 'manifest.json'), manifestContent, 'utf8');

const swPath = path.join(__dirname, 'sw.js');
const swContent = fs.existsSync(swPath) ? fs.readFileSync(swPath, 'utf8') : '';
fs.writeFileSync(path.join(publicDir, 'sw.js'), swContent, 'utf8');

const iconPath = path.join(__dirname, 'icon.svg');
const iconContent = fs.existsSync(iconPath) ? fs.readFileSync(iconPath, 'utf8') : '';
fs.writeFileSync(path.join(publicDir, 'icon.svg'), iconContent, 'utf8');

const FALLBACK_KEY_B64 = 'c2Jfc2VjcmV0XzF6ZXd0MUlSU1loMnhYQUYzbUJDT1FfMHZ5SEVtVDU=';

const workerCode = `// ==============================================================================
// GOMEX DISTRIBUIDORA · CLOUDFLARE WORKER & API BACKEND (PAINEL EXECUTIVO)
// ==============================================================================

const FALLBACK_KEY_B64 = '${FALLBACK_KEY_B64}';

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
  return b64.replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, '');
}

function bufToB64Url(buf) {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  const b64 = btoa(bin);
  return b64.replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, '');
}

async function gerarVapidJwt(endpointUrl, subject = 'mailto:contato@gomex.com.br') {
  try {
    const urlObj = new URL(endpointUrl);
    const audience = \`\${urlObj.protocol}//\${urlObj.host}\`;
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

          const supabaseUrl = ((env && env.SUPABASE_URL) || 'https://lhjeodmnqwsftifdvaru.supabase.co').replace(/\\/+$/, '');
          const supabaseKey = getSupabaseKey(env);

          let subs = [];
          try {
            const getRes = await fetch(\`\${supabaseUrl}/rest/v1/parametros?id=eq.frota_push_subscriptions_v1&select=*\`, {
              headers: { 'apikey': supabaseKey, 'Authorization': \`Bearer \${supabaseKey}\` }
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

          await fetch(\`\${supabaseUrl}/rest/v1/parametros\`, {
            method: 'POST',
            headers: {
              'apikey': supabaseKey,
              'Authorization': \`Bearer \${supabaseKey}\`,
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

          const supabaseUrl = ((env && env.SUPABASE_URL) || 'https://lhjeodmnqwsftifdvaru.supabase.co').replace(/\\/+$/, '');
          const supabaseKey = getSupabaseKey(env);

          let subs = [];
          try {
            const getRes = await fetch(\`\${supabaseUrl}/rest/v1/parametros?id=eq.frota_push_subscriptions_v1&select=*\`, {
              headers: { 'apikey': supabaseKey, 'Authorization': \`Bearer \${supabaseKey}\` }
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
                  'Authorization': \`vapid t=\${jwt}, k=\${VAPID_PUB_B64URL}\`,
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
              await fetch(\`\${supabaseUrl}/rest/v1/parametros\`, {
                method: 'POST',
                headers: {
                  'apikey': supabaseKey,
                  'Authorization': \`Bearer \${supabaseKey}\`,
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
      const supabaseUrl = ((env && env.SUPABASE_URL) || 'https://lhjeodmnqwsftifdvaru.supabase.co').replace(/\\/+$/, '');
      const supabaseKey = getSupabaseKey(env);

      if (request.method === 'GET') {
        try {
          const res = await fetch(\`\${supabaseUrl}/rest/v1/parametros?id=in.(frota_catalogo_produtos_v1,frota_lancamentos_gastos_v1,frota_historico_manutencoes_v1,frota_galeria_veiculos_v1,frota_cadastro_veiculos_v1,frota_ocorrencias_v1,frota_agendamentos_servicos_v1,frota_permissoes_usuarios_v1)&select=*\`, {
            headers: {
              'apikey': supabaseKey,
              'Authorization': \`Bearer \${supabaseKey}\`,
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
          const res = await fetch(\`\${supabaseUrl}/rest/v1/parametros\`, {
            method: 'POST',
            headers: {
              'apikey': supabaseKey,
              'Authorization': \`Bearer \${supabaseKey}\`,
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
      const supabaseUrl = ((env && env.SUPABASE_URL) || 'https://lhjeodmnqwsftifdvaru.supabase.co').replace(/\\/+$/, '');
      const supabaseKey = getSupabaseKey(env);

      // GET /api/checklists
      if (request.method === 'GET') {
        const select = url.searchParams.get('select') || '*';
        const idParam = url.searchParams.get('id');
        if (!/^[a-z0-9_,*]+$/i.test(select) || (idParam !== null && !/^\\d+$/.test(idParam))) {
          return new Response(JSON.stringify({ error: 'Parâmetros inválidos' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
          });
        }
        const query = idParam !== null
          ? \`select=\${select}&id=eq.\${idParam}\`
          : \`select=\${select}&order=id.desc&limit=500\`;

        try {
          const res = await fetch(\`\${supabaseUrl}/rest/v1/veiculo_checklists?\${query}\`, {
            headers: {
              'apikey': supabaseKey,
              'Authorization': \`Bearer \${supabaseKey}\`,
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
          if (!id || !/^\\d+$/.test(String(id))) {
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

          const res = await fetch(\`\${supabaseUrl}/rest/v1/veiculo_checklists?id=eq.\${id}\`, {
            method: 'PATCH',
            headers: {
              'apikey': supabaseKey,
              'Authorization': \`Bearer \${supabaseKey}\`,
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

    // 4. FALLBACK DIRETO: SERVIR O INDEX.HTML EMBUTIDO
    return new Response(EMBEDDED_HTML, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache',
        ...SECURITY_HEADERS
      }
    });
  }
};

const EMBEDDED_HTML = ${JSON.stringify(htmlContent)};
`;

fs.writeFileSync(path.join(__dirname, 'worker.js'), workerCode, 'utf8');
console.log('[OK] public/index.html e worker.js gerados com sucesso! Tamanho worker.js:', (Buffer.byteLength(workerCode) / 1024).toFixed(1), 'KB');


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
  'Referrer-Policy': 'no-referrer'
};

function getSupabaseKey(env) {
  if (env && env.SUPABASE_KEY) return env.SUPABASE_KEY;
  try {
    if (typeof atob === 'function') return atob(FALLBACK_KEY_B64);
    if (typeof Buffer !== 'undefined') return Buffer.from(FALLBACK_KEY_B64, 'base64').toString('utf8');
  } catch (e) {}
  return '';
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
      ...SECURITY_HEADERS
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
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

    // 1.5 ROTA DE CUSTOS, PEÇAS E INSUMOS DA FROTA (/api/frota-gastos)
    if (url.pathname === '/api/frota-gastos') {
      const supabaseUrl = ((env && env.SUPABASE_URL) || 'https://lhjeodmnqwsftifdvaru.supabase.co').replace(/\\/+$/, '');
      const supabaseKey = getSupabaseKey(env);

      if (request.method === 'GET') {
        try {
          const res = await fetch(\`\${supabaseUrl}/rest/v1/parametros?id=in.(frota_catalogo_produtos_v1,frota_lancamentos_gastos_v1,frota_historico_manutencoes_v1,frota_galeria_veiculos_v1,frota_cadastro_veiculos_v1)&select=*\`, {
            headers: {
              'apikey': supabaseKey,
              'Authorization': \`Bearer \${supabaseKey}\`,
              'Content-Type': 'application/json'
            }
          });
          const rows = await res.json();
          const out = { produtos: null, lancamentos: [], historico_manutencoes: {}, galeria: [], veiculos: [] };
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
            }
          }
          return new Response(JSON.stringify(out), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
          });
        } catch (err) {
          return new Response(JSON.stringify({ produtos: null, lancamentos: [], historico_manutencoes: {}, galeria: [] }), {
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
console.log('✅ public/index.html e worker.js gerados com sucesso! Tamanho worker.js:', (Buffer.byteLength(workerCode) / 1024).toFixed(1), 'KB');


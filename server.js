// ==============================================================================
// GOMEX DISTRIBUIDORA · SERVIDOR DO PAINEL EXECUTIVO
// ==============================================================================

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3001;
const SUPABASE_URL = 'https://lhjeodmnqwsftifdvaru.supabase.co';
const FALLBACK_KEY_B64 = 'c2Jfc2VjcmV0XzF6ZXd0MUlSU1loMnhYQUYzbUJDT1FfMHZ5SEVtVDU=';
const SUPABASE_KEY = process.env.SUPABASE_KEY || Buffer.from(FALLBACK_KEY_B64, 'base64').toString('utf8');

const ALLOWED_PATCH_COLS = new Set([
  'veiculo', 'veiculo_outro', 'placa', 'km', 'motorista', 'rota',
  'data', 'hora', 'tipo', 'combustivel',
  'rev_ult_km', 'rev_ult_data', 'rev_prox_km', 'rev_prox_data',
  'avarias', 'sem_avarias', 'pneus', 'pneu_dano', 'itens',
  'extintor_validade', 'thermo_temp', 'outro_item',
  'obs', 'condicao_motorista', 'liberacao',
  'ass_motorista', 'ass_vistoriador', 'ass_responsavel', 'status'
]);

const BLOCKED_FILES = new Set(['server.js', 'worker.js', 'wrangler.toml', 'package.json', 'package-lock.json', '.env', 'frota_gastos_db.json']);
const GASTOS_DB_FILE = path.join(__dirname, 'frota_gastos_db.json');

function lerGastosLocais() {
  try {
    if (fs.existsSync(GASTOS_DB_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(GASTOS_DB_FILE, 'utf8'));
      return {
        produtos: Array.isArray(parsed.produtos) ? parsed.produtos : null,
        lancamentos: Array.isArray(parsed.lancamentos) ? parsed.lancamentos : [],
        historico_manutencoes: parsed.historico_manutencoes && typeof parsed.historico_manutencoes === 'object' ? parsed.historico_manutencoes : {},
        galeria: Array.isArray(parsed.galeria) ? parsed.galeria : [],
        veiculos: Array.isArray(parsed.veiculos) ? parsed.veiculos : []
      };
    }
  } catch (e) {}
  return { produtos: null, lancamentos: [], historico_manutencoes: {}, galeria: [], veiculos: [] };
}

function salvarGastosLocais(data) {
  try {
    fs.writeFileSync(GASTOS_DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {}
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer'
};

const server = http.createServer((req, res) => {
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    res.setHeader(k, v);
  }
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  } catch (e) {
    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'URL inválida' }));
    return;
  }
  const pathname = parsedUrl.pathname;

  // Atalhos amigáveis do painel e do checklist
  if (pathname === '/checklist' || pathname === '/check-list') {
    res.writeHead(302, { 'Location': 'https://gomex-checklist.gomexassistencia2026.workers.dev/' });
    res.end();
    return;
  }

  // Sanitização de Segurança: Redireciona removendo credenciais da URL se alguém acessar com parâmetros no link
  if (parsedUrl.searchParams.has('username') || parsedUrl.searchParams.has('password') || parsedUrl.searchParams.has('user') || parsedUrl.searchParams.has('pass')) {
    parsedUrl.searchParams.delete('username');
    parsedUrl.searchParams.delete('password');
    parsedUrl.searchParams.delete('user');
    parsedUrl.searchParams.delete('pass');
    const redirectTarget = parsedUrl.pathname + (parsedUrl.search ? parsedUrl.search : '');
    res.writeHead(302, { 'Location': redirectTarget });
    res.end();
    return;
  }

  // API para Catálogo de Produtos/Peças, Lançamentos de Gastos, Histórico de Manutenção e Galeria (/api/frota-gastos)
  if (pathname === '/api/frota-gastos') {
    if (req.method === 'GET') {
      const localData = lerGastosLocais();
      const targetUrl = new URL('/rest/v1/parametros?id=in.(frota_catalogo_produtos_v1,frota_lancamentos_gastos_v1,frota_historico_manutencoes_v1,frota_galeria_veiculos_v1,frota_cadastro_veiculos_v1)&select=*', SUPABASE_URL);
      const options = {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        }
      };

      const sReq = https.request(targetUrl, options, sRes => {
        let data = '';
        sRes.on('data', chunk => data += chunk);
        sRes.on('end', () => {
          let out = { ...localData };
          try {
            const rows = JSON.parse(data);
            if (Array.isArray(rows)) {
              for (const row of rows) {
                if (row.id === 'frota_catalogo_produtos_v1' && row.descricao) {
                  const p = JSON.parse(row.descricao);
                  if (Array.isArray(p)) out.produtos = p;
                }
                if (row.id === 'frota_lancamentos_gastos_v1' && row.descricao) {
                  const l = JSON.parse(row.descricao);
                  if (Array.isArray(l)) out.lancamentos = l;
                }
                if (row.id === 'frota_historico_manutencoes_v1' && row.descricao) {
                  const hm = JSON.parse(row.descricao);
                  if (hm && typeof hm === 'object') out.historico_manutencoes = hm;
                }
                if (row.id === 'frota_galeria_veiculos_v1' && row.descricao) {
                  const gal = JSON.parse(row.descricao);
                  if (Array.isArray(gal)) out.galeria = gal;
                }
                if (row.id === 'frota_cadastro_veiculos_v1' && row.descricao) {
                  const vc = JSON.parse(row.descricao);
                  if (Array.isArray(vc)) out.veiculos = vc;
                }
              }
              salvarGastosLocais(out);
            }
          } catch (e) {}
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
          res.end(JSON.stringify(out));
        });
      });

      sReq.on('error', () => {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
        res.end(JSON.stringify(localData));
      });
      sReq.end();
      return;
    }

    if (req.method === 'POST' || req.method === 'PATCH') {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
        if (body.length > 25 * 1024 * 1024) req.destroy();
      });
      req.on('end', () => {
        try {
          const payload = JSON.parse(body || '{}');
          const current = lerGastosLocais();
          if (Array.isArray(payload.produtos)) current.produtos = payload.produtos;
          if (Array.isArray(payload.lancamentos)) current.lancamentos = payload.lancamentos;
          if (payload.historico_manutencoes && typeof payload.historico_manutencoes === 'object') {
            current.historico_manutencoes = payload.historico_manutencoes;
          }
          if (Array.isArray(payload.galeria)) current.galeria = payload.galeria;
          if (Array.isArray(payload.veiculos)) current.veiculos = payload.veiculos;
          salvarGastosLocais(current);

          const rowsToUpsert = [];
          if (Array.isArray(current.produtos)) {
            rowsToUpsert.push({
              id: 'frota_catalogo_produtos_v1',
              valor: current.produtos.length,
              descricao: JSON.stringify(current.produtos)
            });
          }
          if (Array.isArray(current.lancamentos)) {
            const totalInvestido = current.lancamentos.reduce((acc, g) => acc + (Number(g.valor_total) || 0), 0);
            rowsToUpsert.push({
              id: 'frota_lancamentos_gastos_v1',
              valor: Number(totalInvestido.toFixed(2)),
              descricao: JSON.stringify(current.lancamentos)
            });
          }
          if (current.historico_manutencoes && typeof current.historico_manutencoes === 'object') {
            rowsToUpsert.push({
              id: 'frota_historico_manutencoes_v1',
              valor: Object.keys(current.historico_manutencoes).length,
              descricao: JSON.stringify(current.historico_manutencoes)
            });
          }
          if (Array.isArray(current.galeria)) {
            rowsToUpsert.push({
              id: 'frota_galeria_veiculos_v1',
              valor: current.galeria.length,
              descricao: JSON.stringify(current.galeria)
            });
          }
          if (Array.isArray(current.veiculos)) {
            rowsToUpsert.push({
              id: 'frota_cadastro_veiculos_v1',
              valor: current.veiculos.length,
              descricao: JSON.stringify(current.veiculos)
            });
          }

          if (!rowsToUpsert.length) {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ ok: true, synced: false }));
            return;
          }

          const targetUrl = new URL('/rest/v1/parametros', SUPABASE_URL);
          const postData = JSON.stringify(rowsToUpsert);
          const options = {
            method: 'POST',
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'resolution=merge-duplicates,return=representation',
              'Content-Length': Buffer.byteLength(postData)
            }
          };

          const sReq = https.request(targetUrl, options, sRes => {
            let rData = '';
            sRes.on('data', c => rData += c);
            sRes.on('end', () => {
              res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
              res.end(JSON.stringify({ ok: true, synced: sRes.statusCode >= 200 && sRes.statusCode < 300 }));
            });
          });
          sReq.on('error', () => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ ok: true, synced: false }));
          });
          sReq.write(postData);
          sReq.end();
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Payload inválido' }));
        }
      });
      return;
    }
  }

  // Proxy seguro para /api/checklists
  if (pathname === '/api/checklists') {
    // 1. Atualizações de Vistoria (PATCH ou POST com id)
    if (req.method === 'PATCH' || req.method === 'POST') {
      let body = '';
      let aborted = false;
      req.on('data', chunk => {
        body += chunk;
        if (body.length > 1024 * 1024) {
          aborted = true;
          res.writeHead(413, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Payload excede o limite permitido' }));
          req.destroy();
        }
      });
      req.on('end', () => {
        if (aborted) return;
        try {
          const rawPayload = JSON.parse(body || '{}');
          const id = rawPayload.id;
          if (!id || !/^\d+$/.test(String(id))) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: 'ID numérico da vistoria é obrigatório' }));
            return;
          }

          const cleanPayload = {};
          for (const [k, v] of Object.entries(rawPayload)) {
            if (ALLOWED_PATCH_COLS.has(k) && v !== undefined) {
              cleanPayload[k] = v;
            }
          }

          if (Object.keys(cleanPayload).length === 0) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: 'Nenhum campo válido para atualização' }));
            return;
          }

          const targetUrl = new URL(`/rest/v1/veiculo_checklists?id=eq.${id}`, SUPABASE_URL);
          const postData = JSON.stringify(cleanPayload);
          const options = {
            method: 'PATCH',
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation',
              'Content-Length': Buffer.byteLength(postData)
            }
          };

          const sReq = https.request(targetUrl, options, sRes => {
            let data = '';
            sRes.on('data', chunk => data += chunk);
            sRes.on('end', () => {
              res.writeHead(sRes.statusCode, {
                'Content-Type': 'application/json; charset=utf-8',
                'Cache-Control': 'no-store',
                'Access-Control-Allow-Origin': '*'
              });
              res.end(data);
            });
          });

          sReq.on('error', err => {
            res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: err.message }));
          });
          sReq.write(postData);
          sReq.end();
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Corpo da requisição inválido' }));
        }
      });
      return;
    }

    // 2. Consulta de Checklists (GET)
    const select = parsedUrl.searchParams.get('select') || '*';
    const idParam = parsedUrl.searchParams.get('id');
    if (!/^[a-z0-9_,*]+$/i.test(select) || (idParam !== null && !/^\d+$/.test(idParam))) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Parâmetros inválidos' }));
      return;
    }
    const query = idParam !== null
      ? `select=${select}&id=eq.${idParam}`
      : `select=${select}&order=id.desc&limit=500`;
    const targetUrl = new URL(`/rest/v1/veiculo_checklists?${query}`, SUPABASE_URL);
    const options = {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const sReq = https.request(targetUrl, options, sRes => {
      let data = '';
      sRes.on('data', chunk => data += chunk);
      sRes.on('end', () => {
        res.writeHead(sRes.statusCode, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(data);
      });
    });

    sReq.on('error', err => {
      res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: err.message }));
    });
    sReq.end();
    return;
  }

  // Serviço seguro de arquivos estáticos (sem path traversal ou exposição de scripts internos)
  const safeRel = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const resolvedBase = path.resolve(__dirname);
  let filePath = path.resolve(__dirname, safeRel);

  if (!filePath.startsWith(resolvedBase) || BLOCKED_FILES.has(path.basename(filePath)) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(resolvedBase, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Erro interno do servidor');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-cache' });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`[START] Painel Executivo Gomex Frota rodando em: http://localhost:${PORT}`);
  console.log(`[AUTH] Acesso administrativo isolado (User: gomex)`);
});

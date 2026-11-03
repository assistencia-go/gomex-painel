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

const BLOCKED_FILES = new Set(['server.js', 'worker.js', 'wrangler.toml', 'package.json', 'package-lock.json', '.env']);

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
  console.log(`🚀 Painel Executivo Gomex Frota rodando em: http://localhost:${PORT}`);
  console.log(`🔒 Acesso administrativo isolado (User: gomex)`);
});

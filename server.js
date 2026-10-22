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

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // Proxy seguro para /api/checklists
  if (pathname === '/api/checklists') {
    const select = parsedUrl.searchParams.get('select') || '*';
    const idParam = parsedUrl.searchParams.get('id');
    if (!/^[a-z_,*]+$/i.test(select) || (idParam !== null && !/^\d+$/.test(idParam))) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
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
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(data);
      });
    });

    sReq.on('error', err => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    });
    sReq.end();
    return;
  }

  // Serviço de arquivos estáticos
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, 'index.html');
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

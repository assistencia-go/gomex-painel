// ==============================================================================
// GOMEX ENTERPRISE · PIPELINE DE VALIDAÇÃO E SEGURANÇA CONTRA ERROS
// ==============================================================================
// Este script é a barreira de segurança obrigatória antes de qualquer push ou deploy.
// Se qualquer teste falhar, o deploy é bloqueado imediatamente.

import fs from 'fs';
import path from 'path';
import vm from 'vm';
import os from 'os';
import http from 'http';
import crypto from 'crypto';
import { createRequire } from 'module';
import { execSync, spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function logPass(msg) {
  console.log(`${COLORS.green}✔ [PASS]${COLORS.reset} ${msg}`);
}

function logFail(msg) {
  console.error(`${COLORS.red}✖ [FAIL]${COLORS.reset} ${COLORS.bold}${msg}${COLORS.reset}`);
}

function logInfo(msg) {
  console.log(`${COLORS.cyan}ℹ [INFO]${COLORS.reset} ${msg}`);
}

let hasError = false;

// ------------------------------------------------------------------------------
// TESTE 1: INTEGRIDADE DO INDEX.HTML (Evita truncamento e perda de código)
// ------------------------------------------------------------------------------
console.log(`\n${COLORS.bold}--- 1. Validando Integridade do index.html ---${COLORS.reset}`);
const indexPath = path.join(__dirname, 'index.html');

if (!fs.existsSync(indexPath)) {
  logFail('Arquivo index.html não foi encontrado!');
  hasError = true;
} else {
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  const sizeKb = Buffer.byteLength(indexContent, 'utf8') / 1024;

  // Tamanho mínimo esperado (o app completo tem > 800 KB)
  if (sizeKb < 700) {
    logFail(`Tamanho suspeito do index.html: ${sizeKb.toFixed(1)} KB (Esperado: > 750 KB). Possível corte/truncamento!`);
    hasError = true;
  } else {
    logPass(`Tamanho verificado: ${sizeKb.toFixed(1)} KB (Arquivo íntegro).`);
  }

  // Tags estruturais
  if (!indexContent.toLowerCase().includes('<!doctype html>')) {
    logFail('index.html não contém <!doctype html>');
    hasError = true;
  }
  if (!indexContent.trim().endsWith('</html>')) {
    logFail('index.html não termina com </html> (Arquivo inacabado ou cortado na edição)');
    hasError = true;
  } else {
    logPass('Estrutura HTML completa (doctype até </html>).');
  }

  // Módulos essenciais que NUNCA podem sumir
  const requiredIds = [
    'sectionVistoriasView',
    'sectionManutView',
    'sectionOcorrenciasView',
    'sectionGastosView',
    'sectionGaleriaView',
    'sectionVendedoresView',
    'sectionFrotaCadView',
    'drTabBtnFotos',
    'drPaneFotos',
    'drFotosVistoriaList'
  ];

  const missingIds = requiredIds.filter(id => !indexContent.includes(`id="${id}"`));
  if (missingIds.length > 0) {
    logFail(`Módulos obrigatórios ausentes no HTML: ${missingIds.join(', ')}`);
    hasError = true;
  } else {
    logPass('Todos os 7 módulos principais e Aba Fotos da gaveta estão presentes no HTML.');
  }

  // Verificação de lógica JS no index.html
  const requiredJsTokens = [
    'alternarVisaoPrincipal',
    'ROUTE_MAP',
    'VALID_USERS',
    'renderTable',
    'renderOcorrencias',
    'renderDrawerFotos',
    'salvarFotosDrawer',
    'podeGerenciarFotosVistoria'
  ];
  const missingJs = requiredJsTokens.filter(token => !indexContent.includes(token));
  if (missingJs.length > 0) {
    logFail(`Lógicas vitais ausentes no script do index.html: ${missingJs.join(', ')}`);
    hasError = true;
  } else {
    logPass('Todas as rotas, tabelas e regras de negócio presentes no script.');
  }

  // Validação da Sintaxe do Script interno do index.html (AST Parsing)
  const scriptMatch = indexContent.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i);
  if (scriptMatch) {
    try {
      new vm.Script(scriptMatch[1]);
      logPass('Sintaxe JavaScript interna do index.html 100% válida (AST sem erros).');
    } catch (err) {
      logFail(`ERRO DE SINTAXE no <script> do index.html: ${err.message}`);
      hasError = true;
    }
  }

  // DIRETRIZ VISUAL OBRIGATÓRIA · POLÍTICA ESTRITA ZERO-EMOJI
  // É terminantemente proibido o uso de emojis na interface da aplicação.
  // A identidade corporativa da Gomex adota padrão sóbrio com ícones SVG nativos.
  const emojiRegex = /\p{Extended_Pictographic}/gu;
  const emojiMatches = indexContent.match(emojiRegex);
  if (emojiMatches && emojiMatches.length > 0) {
    logFail(`POLÍTICA ZERO-EMOJI VIOLADA: ${emojiMatches.length} emoji(s) detectado(s) no index.html: [${emojiMatches.slice(0, 10).join(' ')}]. O padrão corporativo da Gomex PROÍBE estritamente emojis em telas, botões, modais, mensagens e badges.`);
    hasError = true;
  } else {
    logPass('Política Zero-Emoji 100% cumprida: Nenhum emoji presente no index.html (Design Corporativo Sóbrio).');
  }

  // DIRETRIZ MOBILE OBRIGATÓRIA · POLÍTICA ESTRITA ZERO-SCROLL HORIZONTAL
  // É terminantemente proibido exigir arraste lateral de blocos/cards/modais no mobile.
  const mobileOverflowGuards = [
    'POLÍTICA ESTRITA MOBILE: PROIBIDO SCROLL HORIZONTAL',
    'overscroll-behavior-x: none !important',
    'grid-template-columns: minmax(0, 1fr) !important',
    'text-overflow: ellipsis !important'
  ];
  const missingMobileGuards = mobileOverflowGuards.filter(g => !indexContent.includes(g));
  if (missingMobileGuards.length > 0) {
    logFail(`POLÍTICA MOBILE ZERO-SCROLL HORIZONTAL VIOLADA: travas obrigatórias ausentes no index.html: ${missingMobileGuards.join(', ')}`);
    hasError = true;
  } else {
    logPass('Política Mobile Zero-Scroll Horizontal 100% ativa no CSS (proibido arraste lateral de blocos).');
  }

  // DIRETRIZ ESTRITA DA GAVETA DE VISTORIA · SCROLL VERTICAL GARANTIDO + SINCRONIZAÇÃO DE FOTOS
  const drawerScrollGuards = [
    'POLÍTICA OBRIGATÓRIA DE SCROLL DA GAVETA',
    'overscroll-behavior: contain',
    'html.lock',
    'min-height: 0'
  ];
  const missingDrawerGuards = drawerScrollGuards.filter(g => !indexContent.includes(g));
  if (missingDrawerGuards.length > 0) {
    logFail(`POLÍTICA DE SCROLL DA GAVETA VIOLADA: diretrizes ausentes no index.html: ${missingDrawerGuards.join(', ')}`);
    hasError = true;
  } else {
    logPass('Política de Scroll Vertical da Gaveta e bloqueio de rolagem dupla 100% ativos no CSS.');
  }

  if (!indexContent.includes("sincronizarGastosComServidor('pull')") || !indexContent.includes('frota_rec:') || !indexContent.includes('_safeLocalSetItem')) {
    logFail('POLÍTICA DE SINCRONIZAÇÃO DE FOTOS VIOLADA: index.html precisa manter pull em atualizações, persistência granular frota_rec e isolamento _safeLocalSetItem.');
    hasError = true;
  } else {
    logPass('Diretriz de sincronização de fotos/frota, persistência granular e cache local seguro confirmada no index.html.');
  }

  // DIRETRIZ ARQUITETURAL · ZERO HANDLERS INLINE EM SRC/HTML
  const walkHtml = (dir) => {
    let out = [];
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) out = out.concat(walkHtml(p));
      else if (p.endsWith('.html')) out.push(p);
    }
    return out;
  };
  const inlineHandlersFound = [];
  for (const hp of walkHtml(path.join(__dirname, 'src', 'html'))) {
    const htxt = fs.readFileSync(hp, 'utf8');
    const matches = htxt.match(/\bon(click|change|input|submit|keydown|keyup|focus|blur|mousedown|mouseup)\s*=/gi);
    if (matches) inlineHandlersFound.push(`${path.relative(__dirname, hp)}: ${matches.length}`);
  }
  if (inlineHandlersFound.length > 0) {
    logFail(`Handlers HTML inline detectados em src/html/: ${inlineHandlersFound.join('; ')}`);
    hasError = true;
  } else {
    logPass('Zero handlers inline em src/html/: toda a UI utiliza delegação de eventos centralizada.');
  }

  // Teste unitário de IDs únicos em src/html/
  const dupIdsMap = new Map();
  for (const hp of walkHtml(path.join(__dirname, 'src', 'html'))) {
    const htxt = fs.readFileSync(hp, 'utf8');
    for (const dm of htxt.matchAll(/\bid="([^"]+)"/g)) {
      if (!dupIdsMap.has(dm[1])) dupIdsMap.set(dm[1], []);
      dupIdsMap.get(dm[1]).push(path.relative(__dirname, hp));
    }
  }
  const dupIdsList = [...dupIdsMap.entries()].filter(([, arr]) => arr.length > 1).map(([id, arr]) => `${id} (${arr.join(', ')})`);
  if (dupIdsList.length > 0) {
    logFail(`IDs HTML duplicados detectados: ${dupIdsList.join(' | ')}`);
    hasError = true;
  } else {
    logPass('Todos os IDs HTML em src/html/ são únicos (sem colisões entre gaveta/modais).');
  }

  // VALIDAÇÃO DOS CHUNKS LAZY (public/chunks/*.json)
  const expectedChunks = ['veiculos-padrao.json', 'admin.json', 'galeria.json', 'catalogo.json'];
  for (const chunkName of expectedChunks) {
    const chunkPath = path.join(__dirname, 'public', 'chunks', chunkName);
    if (!fs.existsSync(chunkPath)) {
      logFail(`Chunk obrigatório ausente: public/chunks/${chunkName}`);
      hasError = true;
      continue;
    }
    try {
      const rawChunk = fs.readFileSync(chunkPath, 'utf8');
      const parsedChunk = JSON.parse(rawChunk);
      const chunkEmoji = rawChunk.match(emojiRegex);
      if (chunkEmoji && chunkEmoji.length > 0) {
        logFail(`POLÍTICA ZERO-EMOJI VIOLADA no chunk ${chunkName}: [${chunkEmoji.slice(0, 5).join(' ')}]`);
        hasError = true;
      }
      if (parsedChunk && typeof parsedChunk.js === 'string' && parsedChunk.js.trim()) {
        new vm.Script(parsedChunk.js);
      }
      logPass(`Chunk sob demanda íntegro (${(Buffer.byteLength(rawChunk) / 1024).toFixed(1)} KB): public/chunks/${chunkName}`);
    } catch (err) {
      logFail(`Erro de sintaxe/JSON no chunk ${chunkName}: ${err.message}`);
      hasError = true;
    }
  }
}

// ------------------------------------------------------------------------------
// TESTE 2: SINTAXE JAVASCRIPT DOS ARQUIVOS DO PROJETO
// ------------------------------------------------------------------------------
console.log(`\n${COLORS.bold}--- 2. Validando Sintaxe dos Arquivos JavaScript ---${COLORS.reset}`);
const jsFilesToCheck = [
  'server.js',
  'build.js',
  'generate_worker.js',
  'sw.js',
  'public/sw.js',
  'worker.js',
  'lib/frota-repo.js',
  'push_to_github.mjs'
];

for (const file of jsFilesToCheck) {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    logFail(`Arquivo obrigatório ausente: ${file}`);
    hasError = true;
    continue;
  }

  try {
    // node --check faz a análise léxica e sintática (AST) sem executar o código
    execSync(`node --check "${filePath}"`, { stdio: 'pipe' });
    logPass(`Sintaxe 100% válida: ${file}`);
  } catch (err) {
    logFail(`ERRO DE SINTAXE encontrado em: ${file}`);
    console.error(err.stderr ? err.stderr.toString() : err.message);
    hasError = true;
  }
}

try {
  const workerContent = fs.readFileSync(path.join(__dirname, 'worker.js'), 'utf8');
  if (!workerContent.includes('{ ok: false, error:') || !workerContent.includes('status: 500')) {
    logFail('POLÍTICA DO WORKER VIOLADA: GET /api/frota-gastos deve retornar HTTP 500 { ok: false, error } no catch em vez de 200 vazio.');
    hasError = true;
  } else {
    logPass('Política do Worker /api/frota-gastos confirmada: erros retornam HTTP 500 sem mascarar galeria vazia.');
  }
} catch (err) {
  logFail(`Erro inspecionando worker.js: ${err.message}`);
  hasError = true;
}

// ------------------------------------------------------------------------------
// TESTE 3: SIMULAÇÃO E TESTE DE EXECUÇÃO EM TEMPO DE EXECUÇÃO (HEADLESS SMOKE TEST)
// ------------------------------------------------------------------------------
console.log(`\n${COLORS.bold}--- 3. Executando Simulação Headless (Smoke Test de Login & Telas) ---${COLORS.reset}`);
try {
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  const scriptMatch = indexContent.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i);
  if (!scriptMatch) {
    throw new Error('Script não encontrado para simulação!');
  }

  const scriptCode = scriptMatch[1];
  const domElements = {
    login: { hidden: false },
    app: { hidden: true },
    userNameLabel: { textContent: '' },
    loginUser: { value: 'gomex', focus: () => {}, select: () => {} },
    loginPass: { value: 'Gomex@2026', focus: () => {}, select: () => {} },
    loginError: { classList: { add: () => {}, remove: () => {} } },
    loginErrorMsg: { textContent: '' },
    chkRemember: { checked: true },
    pageMainTitle: { textContent: '' },
    pageMainSubtitle: { textContent: '' },
    sync: { dataset: {}, textContent: '' },
    tbl: { innerHTML: '', querySelectorAll: () => [] },
    btnViewAdmin: { style: {}, classList: { toggle: () => {}, add: () => {}, remove: () => {} } },
    btnViewVistorias: { style: {}, removeAttribute: () => {}, setAttribute: () => {}, classList: { toggle: () => {}, add: () => {}, remove: () => {} } },
    btnViewManut: { style: {}, removeAttribute: () => {}, setAttribute: () => {}, classList: { toggle: () => {}, add: () => {}, remove: () => {} } },
    btnViewOcorrencias: { style: {}, removeAttribute: () => {}, setAttribute: () => {}, classList: { toggle: () => {}, add: () => {}, remove: () => {} } },
    btnViewGastos: { style: {}, removeAttribute: () => {}, setAttribute: () => {}, classList: { toggle: () => {}, add: () => {}, remove: () => {} } },
    btnViewGaleria: { style: {}, removeAttribute: () => {}, setAttribute: () => {}, classList: { toggle: () => {}, add: () => {}, remove: () => {} } },
    btnViewVendedores: { style: {}, removeAttribute: () => {}, setAttribute: () => {}, classList: { toggle: () => {}, add: () => {}, remove: () => {} } },
    btnViewFrotaCad: { style: {}, removeAttribute: () => {}, setAttribute: () => {}, classList: { toggle: () => {}, add: () => {}, remove: () => {} } },
    sectionVistoriasView: { hidden: false },
    sectionManutView: { hidden: true },
    sectionOcorrenciasView: { hidden: true },
    sectionGastosView: { hidden: true },
    sectionGaleriaView: { hidden: true },
    sectionVendedoresView: { hidden: true },
    sectionFrotaCadView: { hidden: true },
    sectionAdminPermissoesView: { hidden: true },
    adminUsersContainer: { innerHTML: '' },
    totalUsuariosAdminBadge: { textContent: '' },
    totalModulosAdminBadge: { textContent: '' },
    totalPermissoesAtivasBadge: { textContent: '' }
  };

  const storageMap = {};
  const mockStorage = {
    getItem: (k) => storageMap[k] || null,
    setItem: (k, v) => { storageMap[k] = String(v); },
    removeItem: (k) => { delete storageMap[k]; }
  };

  const createDummyEl = () => ({
    style: {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    addEventListener: () => {},
    removeEventListener: () => {},
    querySelector: () => ({ setAttribute: () => {}, textContent: '' }),
    querySelectorAll: () => [],
    setAttribute: () => {},
    removeAttribute: () => {},
    focus: () => {},
    select: () => {},
    dataset: {},
    innerHTML: '',
    textContent: ''
  });

  const sandbox = {
    console: { log: () => {}, error: () => {}, warn: () => {}, info: () => {} },
    setTimeout: (fn) => {},
    setInterval: (fn) => 123,
    clearInterval: () => {},
    clearTimeout: () => {},
    window: {},
    document: {
      title: 'Gomex Frota',
      hidden: false,
      body: { classList: { add: () => {}, remove: () => {} }, appendChild: () => {} },
      getElementById: (id) => domElements[id] || createDummyEl(),
      querySelector: () => createDummyEl(),
      querySelectorAll: () => [],
      addEventListener: () => {},
      createElement: () => createDummyEl()
    },
    navigator: { userAgent: 'Enterprise-Smoke-Test' },
    location: { pathname: '/', search: '' },
    localStorage: mockStorage,
    sessionStorage: mockStorage,
    crypto: {
      subtle: {
        digest: async (algo, data) => crypto.createHash('sha256').update(data).digest()
      }
    },
    fetch: async () => ({ ok: true, json: async () => ({}) }),
    TextEncoder
  };

  sandbox.window = sandbox;
  sandbox.addEventListener = () => {};
  sandbox.removeEventListener = () => {};
  sandbox.window.location = sandbox.location;
  sandbox.window.localStorage = mockStorage;
  sandbox.window.sessionStorage = mockStorage;
  sandbox.window.document = sandbox.document;

  vm.createContext(sandbox);
  vm.runInContext(scriptCode, sandbox);
  logPass('Inicialização do script no runtime concluída com zero exceções.');

  // Testar execução de login
  await sandbox.executarLogin({ preventDefault: () => {}, stopPropagation: () => {} });
  if (domElements.login.hidden !== true || domElements.app.hidden !== false) {
    throw new Error('Falha no fluxo de login: telas não transitaram corretamente!');
  }
  logPass('Fluxo de login validado: autenticação e transição para o app funcionando.');

  // Testar transição de todas as 9 telas do sistema
  const telas = ['vistorias', 'manutencao', 'ocorrencias', 'agendamentos', 'gastos', 'galeria', 'vendedores', 'frotacad', 'admin'];
  for (const t of telas) {
    sandbox.alternarVisaoPrincipal(t, false);
  }
  logPass('Todas as 9 telas foram navegadas e alternadas sem nenhum erro de referência ou tipo.');

  // Testar barreira de segurança para usuário comum
  sandbox.window.state.currentUser = 'hendreo';
  sandbox.alternarVisaoPrincipal('admin', false);
  if (sandbox.window.state.visaoAtual === 'admin') {
    throw new Error('Falha de segurança crítica: usuário comum conseguiu acessar a tela admin!');
  }
  logPass('Barreira de segurança contra acessos não autorizados validada com sucesso.');

  // Teste unitário do repositório granular (concorrência + tombstone)
  const frotaRepo = require('./lib/frota-repo.js');
  const mergedTest = frotaRepo.mergeCollectionsFromRows({
    paramRows: [
      { id: 'frota_ocorrencias_v1', descricao: JSON.stringify([{ id: 'o1', vendedor: 'A' }, { id: 'o2', vendedor: 'B' }]) },
      { id: 'frota_rec:ocorrencias:o2', descricao: JSON.stringify({ id: 'o2', _id: 'o2', vendedor: 'B2' }) },
      { id: 'frota_tombstones_v2', descricao: JSON.stringify({ ocorrencias: { o1: '2026-11-17T15:01:00Z' } }) }
    ]
  });
  if (!Array.isArray(mergedTest.ocorrencias) || mergedTest.ocorrencias.length !== 1 || mergedTest.ocorrencias[0].vendedor !== 'B2') {
    throw new Error('Falha no merge granular do frota-repo: ' + JSON.stringify(mergedTest.ocorrencias));
  }

  // Teste de upload para Supabase Storage ('frota-galeria') + fallback automatico
  const origFetch = global.fetch;
  try {
    const sampleImg = { id: 'f_unit_1', data: '2026-11-18', placa: 'ARS6B73', imagem: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' };
    global.fetch = async (u, opts) => {
      if (String(u).includes('/storage/v1/object/frota-galeria/')) {
        return { ok: true, status: 200, text: async () => '{}' };
      }
      return { ok: true, status: 200, json: async () => [] };
    };
    const upOk = await frotaRepo.uploadGaleriaImageToStorage('https://example.supabase.co', 'k', 'f_unit_1', sampleImg);
    if (!String(upOk.imagem || '').startsWith('https://example.supabase.co/storage/v1/object/public/frota-galeria/2026-11/f_unit_1.png') || upOk.storage_bucket !== 'frota-galeria') {
      throw new Error('Falha no uploadGaleriaImageToStorage (URL esperada nao gerada): ' + JSON.stringify(upOk));
    }
    global.fetch = async () => ({ ok: false, status: 503, text: async () => 'offline' });
    const upFallback = await frotaRepo.uploadGaleriaImageToStorage('https://example.supabase.co', 'k', 'f_unit_1', sampleImg);
    if (upFallback.imagem !== sampleImg.imagem) {
      throw new Error('Fallback sem Storage falhou — dataUrl precisa ser preservado!');
    }
  } finally {
    global.fetch = origFetch;
  }
  logPass('Repositório granular por ID (frota-repo.js) e Storage frota-galeria (+ fallback) validados.');

} catch (err) {
  logFail(`Falha no Smoke Test de tempo de execução: ${err.message}`);
  console.error(err.stack || err);
  hasError = true;
}

// ------------------------------------------------------------------------------
// TESTE 4: COMPILAÇÃO E VALIDAÇÃO OFICIAL CLOUDFLARE (WRANGLER DRY-RUN)
// ------------------------------------------------------------------------------
console.log(`\n${COLORS.bold}--- 4. Validando Compilação Cloudflare Wrangler ---${COLORS.reset}`);
try {
  const wranglerOutput = execSync('npx wrangler deploy --dry-run', {
    cwd: __dirname,
    stdio: 'pipe',
    shell: true
  }).toString();

  if (wranglerOutput.includes('--dry-run: exiting now.')) {
    logPass('Cloudflare Wrangler validou o worker.js e assets com sucesso.');
  } else {
    logFail('Wrangler não concluiu a verificação de forma limpa.');
    console.log(wranglerOutput);
    hasError = true;
  }
} catch (err) {
  logFail('Falha na validação do Wrangler!');
  console.error(err.stderr ? err.stderr.toString() : err.stdout ? err.stdout.toString() : err.message);
  hasError = true;
}

// ------------------------------------------------------------------------------
// TESTE 5: TESTE REAL DE INTERFACE EM NAVEGADOR MOBILE (360x800 · CHROME CDP)
// ------------------------------------------------------------------------------
async function runMobileBrowserValidation() {
  console.log(`\n${COLORS.bold}--- 5. Teste Real em Navegador Mobile (Viewport 360x800) ---${COLORS.reset}`);
  const browserCandidates = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ].filter(Boolean);
  const chromeExe = browserCandidates.find(p => fs.existsSync(p));
  if (!chromeExe) {
    logInfo('Chrome/Edge não encontrado localmente — etapa visual headless ignorada.');
    return;
  }

  const hojeIso = new Date().toISOString().slice(0, 10);
  const fixtureChecklists = [
    {
      id: 1001, numero: 'VST-1001', placa: 'ARS6B73', veiculo: 'KOMBI FURGAO', km: 308100,
      motorista: 'Jackson', rota: '217', data: hojeIso, hora: '08:15', tipo: 'Rotina',
      combustivel: '3/4', liberacao: 'Liberado', status: 'ativo', obs: 'Tudo em ordem'
    }
  ];
  const fixtureFrota = {
    produtos: [{ id: 'p_oleo_5w30', codigo: '01', nome: 'Oleo 5W30', categoria: 'Oleo & Lubrificantes', unidade: 'L', preco_base: 45 }],
    lancamentos: [{ id: 'g_1', placa: 'ARS6B73', veiculo: 'KOMBI', motorista: 'Jackson', data: hojeIso, produto_id: 'p_oleo_5w30', produto_nome: 'Oleo 5W30', categoria: 'Oleo & Lubrificantes', quantidade: 4, valor_unitario: 45, valor_total: 180 }],
    historico_manutencoes: {},
    galeria: [
      { id: 'foto_1', placa: 'ARS6B73', veiculo: 'KOMBI', data: hojeIso, motorista: 'Jackson', categoria: 'Avaria / Carroceria', vistoria_numero: '001001', obs: 'Check-list Nº VST-1001 (Avaria / Carroceria)', registrado_por: 'Check-list App (Jackson)', imagem: '/mock-storage/frota-galeria/test.png' },
      { id: 'foto_2', placa: 'ARS6B73', veiculo: 'KOMBI', data: '2026-10-01', motorista: 'Jackson', categoria: 'Pneus / Calibragem', vistoria_numero: '000999', obs: 'Check-list Nº 000999 (Pneus / Calibragem)', registrado_por: 'Check-list App (Jackson)', imagem: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' }
    ],
    veiculos: [],
    ocorrencias: [
      { id: 'ocr_1', motorista: 'Eduardo Machado da Silva', vendedor: 'Eduardo Machado da Silva', rota: '201', placa: 'IPV0C73', data: hojeIso, hora_inicio: '08:00', hora_fim: '', tempo_medio: 45, motivo: 'Troca de Oleo / Filtro', local: 'Oficina Central', status: 'em_andamento', tipo: 'pausa', responsavel: 'Hendreo', despesa: 120 },
      { id: 'ocr_2', motorista: 'Fernando Oliva', vendedor: 'Fernando Oliva', rota: '213', placa: 'IOU0H28', data: hojeIso, hora_inicio: '09:00', hora_fim: '10:15', tempo_medio: 60, motivo: 'Pneu Furado / Borracharia', local: 'Borracharia Sul', status: 'finalizado', tipo: 'pausa', responsavel: 'Hendreo', despesa: 65 }
    ],
    agendamentos: [],
    vendedores_rotas: []
  };

  const server = http.createServer((req, res) => {
    const cleanUrl = (req.url || '/').split('?')[0];
    if (cleanUrl === '/' || cleanUrl === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(fs.readFileSync(indexPath, 'utf8'));
      return;
    }
    if (cleanUrl.startsWith('/chunks/')) {
      const fName = path.basename(cleanUrl);
      const cp = path.join(__dirname, 'public', 'chunks', fName);
      if (fs.existsSync(cp)) {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(fs.readFileSync(cp, 'utf8'));
        return;
      }
    }
    if (cleanUrl === '/api/checklists') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(fixtureChecklists));
      return;
    }
    if (cleanUrl === '/api/frota-gastos') {
      if (req.method === 'POST') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(fixtureFrota));
      return;
    }
    if (cleanUrl === '/api/supabase-storage-stats') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: true, exactPgSize: false, dbBytesUsed: 204800, dbBreakdown: { checklistsBytes: 102400, checklistsCount: 1, galeriaBytes: 2048, galeriaFotos: 1, gastosBytes: 4096, ocorrenciasBytes: 4096, outrosParametrosBytes: 8192 }, storage: { bytesUsed: 0, bucketsCount: 0, filesCount: 0 } }));
      return;
    }
    if (cleanUrl === '/mock-storage/frota-galeria/test.png') {
      const pngBuf = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
      res.writeHead(200, { 'Content-Type': 'image/png', 'Access-Control-Allow-Origin': '*' });
      res.end(pngBuf);
      return;
    }
    if (cleanUrl.startsWith('/api/')) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: true }));
      return;
    }
    res.writeHead(404);
    res.end();
  });

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gomex-cdp-'));
  let proc = null;
  let ws = null;

  try {
    proc = spawn(chromeExe, [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--remote-debugging-port=0',
      `--user-data-dir=${userDataDir}`,
      'about:blank'
    ], { stdio: ['ignore', 'ignore', 'pipe'] });

    const debugPort = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timeout iniciando Chrome headless')), 15000);
      let buf = '';
      proc.stderr.on('data', chunk => {
        buf += chunk.toString();
        const m = buf.match(/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//);
        if (m) {
          clearTimeout(timer);
          resolve(Number(m[1]));
        }
      });
      proc.on('exit', code => {
        clearTimeout(timer);
        reject(new Error('Chrome encerrou prematuramente com codigo ' + code));
      });
    });

    const targets = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json();
    const pageTarget = targets.find(t => t.type === 'page') || targets[0];
    if (!pageTarget || !pageTarget.webSocketDebuggerUrl) {
      throw new Error('Alvo CDP de pagina nao encontrado.');
    }

    ws = new globalThis.WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true });
      ws.addEventListener('error', reject, { once: true });
    });

    let msgId = 0;
    const pending = new Map();
    const runtimeErrors = [];
    ws.addEventListener('message', ev => {
      const data = JSON.parse(ev.data);
      if (data.id && pending.has(data.id)) {
        const { resolve, reject } = pending.get(data.id);
        pending.delete(data.id);
        if (data.error) reject(new Error(data.error.message));
        else resolve(data.result);
      } else if (data.method === 'Runtime.exceptionThrown') {
        const txt = data.params?.exceptionDetails?.exception?.description || data.params?.exceptionDetails?.text || 'Excecao JS';
        runtimeErrors.push(txt);
      } else if (data.method === 'Runtime.consoleAPICalled' && data.params?.type === 'error') {
        const txt = (data.params.args || []).map(a => a.value || a.description || '').join(' ');
        if (txt && !txt.includes('ERR_NAME_NOT_RESOLVED') && !txt.includes('Failed to load resource')) {
          runtimeErrors.push('console.error: ' + txt);
        }
      }
    });

    const sendCdp = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++msgId;
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error('Timeout CDP: ' + method));
      }, 15000);
      pending.set(id, {
        resolve: (v) => { clearTimeout(timer); resolve(v); },
        reject: (e) => { clearTimeout(timer); reject(e); }
      });
      ws.send(JSON.stringify({ id, method, params }));
    });

    const evalJs = async (expression) => {
      const res = await sendCdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      if (res.exceptionDetails) {
        throw new Error(res.exceptionDetails.exception?.description || res.exceptionDetails.text || 'Eval error');
      }
      return res.result?.value;
    };

    const waitFor = async (condExpr, label, timeoutMs = 8000) => {
      const started = Date.now();
      while (Date.now() - started < timeoutMs) {
        const ok = await evalJs(condExpr);
        if (ok) return true;
        await new Promise(r => setTimeout(r, 80));
      }
      const diag = await evalJs(`(() => ({
        visao: window.state?.visaoAtual,
        adminHidden: document.getElementById('sectionAdminPermissoesView')?.hidden,
        adminLoaded: window.__isLazyLoaded ? window.__isLazyLoaded('admin') : null,
        galLoaded: window.__isLazyLoaded ? window.__isLazyLoaded('galeria') : null,
        hasBtnNovo: !!document.getElementById('btnAdminNovoUsuario'),
        hasMount: !!document.getElementById('lazyModalsMount')
      }))()`).catch(() => ({}));
      throw new Error('Timeout aguardando: ' + label + ' | diag=' + JSON.stringify(diag) + ' | errs=' + JSON.stringify(runtimeErrors));
    };

    await sendCdp('Page.enable');
    await sendCdp('Runtime.enable');
    await sendCdp('Emulation.setDeviceMetricsOverride', {
      width: 360, height: 800, deviceScaleFactor: 2, mobile: true, hasTouch: true
    });

    await sendCdp('Page.navigate', { url: `http://127.0.0.1:${port}/` });
    await waitFor("document.readyState === 'complete' && !!document.getElementById('loginUser')", 'carregamento inicial');

    // Login via UI real (testando data-action="executarLogin")
    await evalJs(`(() => {
      document.getElementById('loginUser').value = 'gomex';
      document.getElementById('loginPass').value = 'Gomex@2026';
      document.getElementById('btnLogin').click();
    })()`);
    await waitFor("document.getElementById('app') && document.getElementById('app').hidden === false", 'transicao de login');

    // Navegar todas as visoes no viewport mobile 360x800 verificando ZERO scroll horizontal
    const views = [
      { id: 'btnViewVistorias', wait: "document.getElementById('sectionVistoriasView').hidden === false" },
      { id: 'btnViewManut', wait: "document.getElementById('sectionManutView').hidden === false" },
      { id: 'btnViewOcorrencias', wait: "document.getElementById('sectionOcorrenciasView').hidden === false" },
      { id: 'btnViewGastos', wait: "document.getElementById('sectionGastosView').hidden === false" },
      { id: 'btnViewGaleria', wait: "document.getElementById('sectionGaleriaView').hidden === false && window.__isLazyLoaded('galeria')" },
      { id: 'btnViewVendedores', wait: "document.getElementById('sectionVendedoresView').hidden === false" },
      { id: 'btnViewFrotaCad', wait: "document.getElementById('sectionFrotaCadView').hidden === false && Array.isArray(window.VEICULOS_PADRAO_FROTA)" },
      { id: 'btnViewAdmin', wait: "document.getElementById('sectionAdminPermissoesView').hidden === false && window.__isLazyLoaded('admin') && !!document.getElementById('btnAdminNovoUsuario')" }
    ];

    for (const v of views) {
      await evalJs(`document.getElementById('${v.id}').click()`);
      await waitFor(v.wait, v.id);
      await new Promise(r => setTimeout(r, 80));
      const metrics = await evalJs(`(() => ({
        sw: document.documentElement.scrollWidth,
        cw: document.documentElement.clientWidth
      }))()`);
      if (metrics.sw > metrics.cw) {
        throw new Error(`Overflow horizontal detectado em ${v.id} a 360px: scrollWidth=${metrics.sw} > clientWidth=${metrics.cw}`);
      }
    }
    logPass('Todas as 8 visoes (incluindo chunks sob demanda) com 0px de overflow horizontal no viewport 360x800.');

    // Teste de Modais no Mobile:
    // 1) Admin Novo Usuario (.open class + display:flex)
    await evalJs(`document.getElementById('btnAdminNovoUsuario').click()`);
    await waitFor("document.getElementById('modalNovoUsuario')?.classList.contains('open')", 'abrir modalNovoUsuario');
    const modalAdmCheck = await evalJs(`(() => {
      const m = document.getElementById('modalNovoUsuario');
      const cs = getComputedStyle(m);
      return {
        disp: cs.display,
        vis: cs.visibility,
        sw: document.documentElement.scrollWidth,
        cw: document.documentElement.clientWidth
      };
    })()`);
    if (modalAdmCheck.disp === 'none' || modalAdmCheck.vis !== 'visible' || modalAdmCheck.sw > modalAdmCheck.cw) {
      throw new Error('Falha no layout mobile do modalNovoUsuario: ' + JSON.stringify(modalAdmCheck));
    }
    await evalJs(`document.querySelector('#modalNovoUsuario .btn-close-modal').click()`);

    // 2) Modal Editar Vendedor
    await evalJs(`document.getElementById('btnViewVendedores').click(); document.getElementById('btnNovoVendedorRota').click()`);
    await waitFor("document.getElementById('modalEditarVendedor').classList.contains('open')", 'abrir modalEditarVendedor');
    const swVendModal = await evalJs(`document.documentElement.scrollWidth <= document.documentElement.clientWidth`);
    if (!swVendModal) throw new Error('Overflow horizontal no modalEditarVendedor a 360px!');
    await evalJs(`document.querySelector('#modalEditarVendedor .m-close').click()`);

    // 3) Modal Catalogo de Produtos (lazy chunk catalogo.json)
    await evalJs(`document.getElementById('btnViewGastos').click(); document.querySelector('[data-action="abrirModalCatalogoProdutos"]').click()`);
    await waitFor("window.__isLazyLoaded('catalogo') && document.getElementById('modalCatalogoProdutos')?.classList.contains('open')", 'abrir modalCatalogoProdutos');
    await evalJs(`document.querySelector('#modalCatalogoProdutos [data-action="fecharModalCatalogoProdutos"]').click()`);
    await waitFor("!document.getElementById('modalCatalogoProdutos').classList.contains('open')", 'fechar modalCatalogoProdutos');

    // 4) Modal Relatorio de Ocorrencias (verificar zero horizontal overflow + scroll vertical destravado!)
    await evalJs(`document.getElementById('btnViewOcorrencias').click(); document.querySelector('[data-action="abrirModalRelatorioOcorrencias"]').click()`);
    await waitFor("document.getElementById('modalRelatorioOcorrencias').classList.contains('open')", 'abrir modalRelatorioOcorrencias');
    await new Promise(r => setTimeout(r, 80));
    const relScrollCheck = await evalJs(`(() => {
      const body = document.querySelector('#modalRelatorioOcorrencias .modal-body');
      const card = document.querySelector('#modalRelatorioOcorrencias .modal-card');
      const swOk = document.documentElement.scrollWidth <= document.documentElement.clientWidth;
      const before = body ? body.scrollTop : -1;
      if (body) body.scrollTop = 180;
      const after = body ? body.scrollTop : -1;
      return {
        swOk,
        scrollHeight: body ? body.scrollHeight : 0,
        clientHeight: body ? body.clientHeight : 0,
        cardW: card ? card.getBoundingClientRect().width : 0,
        before,
        after
      };
    })()`);
    if (!relScrollCheck.swOk || relScrollCheck.cardW > 360 || (relScrollCheck.scrollHeight > relScrollCheck.clientHeight && relScrollCheck.after <= relScrollCheck.before)) {
      throw new Error('Falha de scroll vertical ou largura no modalRelatorioOcorrencias a 360px: ' + JSON.stringify(relScrollCheck));
    }
    await evalJs(`document.querySelector('#modalRelatorioOcorrencias [data-action="fecharModalRelatorioOcorrencias"]').click()`);
    await waitFor("!document.getElementById('modalRelatorioOcorrencias').classList.contains('open')", 'fechar modalRelatorioOcorrencias');

    // 5) Indicador de Fila Offline / Pendente na topbar mobile
    const syncUiCheck = await evalJs(`(() => {
      window.enqueueFrotaRecordOp('ocorrencias', 'upsert', { id: 'ocr_test_pend', vendedor: 'Teste' });
      const s = document.getElementById('sync');
      const snap = {
        state: s.dataset.state,
        hasPend: s.dataset.hasPending,
        text: document.getElementById('syncText').textContent,
        textDisp: getComputedStyle(document.getElementById('syncText')).display
      };
      window.savePendingFrotaQueue([]);
      return snap;
    })()`);
    if (syncUiCheck.hasPend !== '1' || syncUiCheck.textDisp === 'none' || !syncUiCheck.text.includes('pendente')) {
      throw new Error('Indicador mobile de pendencia offline nao ficou visivel: ' + JSON.stringify(syncUiCheck));
    }

    // 6) Gaveta da Vistoria (#drawer): Scroll vertical destravado e Aba Fotos (600x900 e 360x800)
    await evalJs(`document.getElementById('btnViewVistorias').click()`);
    await waitFor("document.getElementById('sectionVistoriasView').hidden === false", 'voltar para vistorias');

    for (const vp of [
      { label: 'tablet-600x900', width: 600, height: 900, mobile: false, hasTouch: false },
      { label: 'mobile-360x800', width: 360, height: 800, mobile: true, hasTouch: true }
    ]) {
      await sendCdp('Emulation.setDeviceMetricsOverride', {
        width: vp.width, height: vp.height, deviceScaleFactor: 2, mobile: vp.mobile, hasTouch: vp.hasTouch
      });
      await evalJs(`window.scrollTo(0, 0); window.openDrawer(1001)`);
      await waitFor("document.getElementById('drawer').classList.contains('open')", 'abrir drawer em ' + vp.label);
      await new Promise(r => setTimeout(r, 120));

      const outerBefore = await evalJs(`document.documentElement.scrollTop || document.body.scrollTop || 0`);
      const wheelX = Math.max(80, vp.width - 140);
      await sendCdp('Input.dispatchMouseEvent', {
        type: 'mouseWheel',
        x: wheelX,
        y: 360,
        deltaX: 0,
        deltaY: 420
      });
      await new Promise(r => setTimeout(r, 180));

      const drCheck = await evalJs(`(() => {
        const body = document.getElementById('drBody');
        const dr = document.getElementById('drawer');
        const htmlLocked = document.documentElement.classList.contains('lock');
        const bodyLocked = document.body.classList.contains('lock');
        const htmlOverflow = getComputedStyle(document.documentElement).overflowY;
        const bodyOverflow = getComputedStyle(document.body).overflowY;
        const drCs = getComputedStyle(dr);
        const drBodyCs = getComputedStyle(body);
        const wheelAfter = body ? body.scrollTop : -1;
        if (body) body.scrollTop = 420;
        const progAfter = body ? body.scrollTop : -1;
        const outerAfter = document.documentElement.scrollTop || document.body.scrollTop || 0;
        return {
          sw: document.documentElement.scrollWidth,
          cw: document.documentElement.clientWidth,
          htmlLocked,
          bodyLocked,
          htmlOverflow,
          bodyOverflow,
          drHeight: dr ? dr.getBoundingClientRect().height : 0,
          drOverflow: drCs.overflowY,
          bodyOverflowY: drBodyCs.overflowY,
          bodyOverscroll: drBodyCs.overscrollBehaviorY,
          bodyFlexShrink: drBodyCs.flexShrink,
          bodyMinH: drBodyCs.minHeight,
          scrollH: body ? body.scrollHeight : 0,
          clientH: body ? body.clientHeight : 0,
          wheelAfter,
          progAfter,
          outerAfter
        };
      })()`);

      if (
        !drCheck.htmlLocked ||
        !drCheck.bodyLocked ||
        drCheck.htmlOverflow !== 'hidden' ||
        drCheck.bodyOverflow !== 'hidden' ||
        drCheck.bodyOverflowY !== 'auto' ||
        drCheck.bodyOverscroll !== 'contain' ||
        drCheck.sw > drCheck.cw ||
        drCheck.clientH <= 0 ||
        (drCheck.scrollH > drCheck.clientH && (drCheck.wheelAfter <= 0 || drCheck.progAfter <= 0)) ||
        drCheck.outerAfter > outerBefore
      ) {
        throw new Error('Falha no scroll vertical da gaveta em ' + vp.label + ' (outerBefore=' + outerBefore + '): ' + JSON.stringify(drCheck));
      }

      // Alternar para Aba Fotos e conferir visibilidade, fotos vinculadas do checklist, area de upload manual e ausencia de overflow
      await evalJs(`document.getElementById('drTabBtnFotos').click()`);
      await waitFor("!document.getElementById('drPaneFotos').hidden", 'abrir aba fotos na gaveta em ' + vp.label);
      await new Promise(r => setTimeout(r, 80));
      const fotosTabCheck = await evalJs(`(() => {
        const pane = document.getElementById('drPaneFotos');
        const vist = document.getElementById('drPaneVistoria');
        const card = document.getElementById('drFotosUploadCard');
        const body = document.getElementById('drBody');
        const badge = document.getElementById('drTabBadgeFotos');
        const cardsVist = document.querySelectorAll('#drFotosVistoriaList .dr-foto-card').length;
        const cardsPlaca = document.querySelectorAll('#drFotosPlacaList .dr-foto-card').length;
        return {
          paneHidden: pane ? pane.hidden : true,
          vistHidden: vist ? vist.hidden : false,
          cardDisp: card ? getComputedStyle(card).display : 'none',
          scrollTopReset: body ? body.scrollTop : -1,
          badgeText: badge ? badge.textContent : '',
          badgeHidden: badge ? badge.hidden : true,
          cardsVist,
          cardsPlaca,
          sw: document.documentElement.scrollWidth,
          cw: document.documentElement.clientWidth
        };
      })()`);

      if (
        fotosTabCheck.paneHidden ||
        !fotosTabCheck.vistHidden ||
        fotosTabCheck.cardDisp === 'none' ||
        fotosTabCheck.cardsVist !== 1 ||
        fotosTabCheck.cardsPlaca !== 1 ||
        fotosTabCheck.badgeHidden ||
        fotosTabCheck.badgeText !== '1' ||
        fotosTabCheck.sw > fotosTabCheck.cw
      ) {
        throw new Error('Falha na Aba Fotos da gaveta em ' + vp.label + ': ' + JSON.stringify(fotosTabCheck));
      }

      // Confirmar carregamento real da imagem URL (naturalWidth > 0) e abertura do lightbox acima do drawer sem ficar inerte
      await waitFor("(() => { const img = document.querySelector('#drFotosVistoriaList img'); return !!(img && img.complete && img.naturalWidth > 0); })()", 'carregar imagem Storage na gaveta em ' + vp.label);
      await evalJs(`document.querySelector('#drFotosVistoriaList [data-action="abrirLightboxFoto"]').click()`);
      await waitFor("document.getElementById('modalVerFotoGaleria')?.classList.contains('open')", 'abrir lightbox de foto pela gaveta em ' + vp.label);
      const lbInert = await evalJs(`!!document.getElementById('modalVerFotoGaleria')?.closest('[inert]')`);
      if (lbInert) throw new Error('Lightbox de foto ficou inerte dentro de #app em ' + vp.label);
      await evalJs(`document.querySelector('#modalVerFotoGaleria [data-action="fecharLightboxFoto"]').click()`);
      await waitFor("!document.getElementById('modalVerFotoGaleria').classList.contains('open')", 'fechar lightbox de foto pela gaveta em ' + vp.label);

      await evalJs(`document.getElementById('drClose').click()`);
      await waitFor("!document.getElementById('drawer').classList.contains('open')", 'fechar drawer em ' + vp.label);
    }

    if (runtimeErrors.length > 0) {
      throw new Error('Erros de runtime no navegador: ' + runtimeErrors.join(' | '));
    }
    logPass('Modais e Gaveta (Scroll Vertical + Aba Fotos em 600x900/360x800) e indicador offline validados com ZERO erros!');
  } finally {
    try { if (ws) ws.close(); } catch (e) { }
    try { if (proc) proc.kill(); } catch (e) { }
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) { }
    try { server.close(); } catch (e) { }
  }
}

try {
  await runMobileBrowserValidation();
} catch (err) {
  logFail(`Falha no Teste Real de Navegador Mobile: ${err.message}`);
  console.error(err.stack || err);
  hasError = true;
}

// ------------------------------------------------------------------------------
// TESTE 6: CRIAR BACKUP LOCAL AUTOMÁTICO ANTES DE QUALQUER MUDANÇA
// ------------------------------------------------------------------------------
console.log(`\n${COLORS.bold}--- 6. Criando Snapshot de Backup Seguro ---${COLORS.reset}`);
try {
  const backupsDir = path.join(__dirname, '.backups');
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-');
  const targetBackupDir = path.join(backupsDir, `backup_${timestamp}`);
  fs.mkdirSync(targetBackupDir, { recursive: true });

  const filesToBackup = ['index.html', 'worker.js', 'generate_worker.js', 'build.js', 'sw.js'];
  for (const f of filesToBackup) {
    const src = path.join(__dirname, f);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(targetBackupDir, f));
    }
  }

  // Manter no máximo os últimos 15 backups para economizar disco
  const allBackups = fs.readdirSync(backupsDir)
    .filter(name => name.startsWith('backup_'))
    .sort();

  if (allBackups.length > 15) {
    const toDelete = allBackups.slice(0, allBackups.length - 15);
    for (const b of toDelete) {
      fs.rmSync(path.join(backupsDir, b), { recursive: true, force: true });
    }
  }

  logPass(`Backup de segurança gerado: .backups/backup_${timestamp}`);
} catch (err) {
  logFail(`Falha ao gerar backup: ${err.message}`);
  // Não trava se for só erro de pasta, mas avisa
}

// ------------------------------------------------------------------------------
// RESULTADO FINAL
// ------------------------------------------------------------------------------
console.log('\n' + '='.repeat(60));
if (hasError) {
  console.error(`${COLORS.red}${COLORS.bold}[BLOQUEIO DE SEGURANÇA] Validação reprovada! O código contém erros e NÃO PODE subir para produção.${COLORS.reset}`);
  console.log('='.repeat(60) + '\n');
  process.exit(1);
} else {
  console.log(`${COLORS.green}${COLORS.bold}[APROVADO] Todos os testes passaram com sucesso! Versão segura e pronta para produção.${COLORS.reset}`);
  console.log('='.repeat(60) + '\n');
  process.exit(0);
}

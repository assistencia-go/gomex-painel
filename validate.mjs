// ==============================================================================
// GOMEX ENTERPRISE · PIPELINE DE VALIDAÇÃO E SEGURANÇA CONTRA ERROS
// ==============================================================================
// Este script é a barreira de segurança obrigatória antes de qualquer push ou deploy.
// Se qualquer teste falhar, o deploy é bloqueado imediatamente.

import fs from 'fs';
import path from 'path';
import vm from 'vm';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    'sectionFrotaCadView'
  ];

  const missingIds = requiredIds.filter(id => !indexContent.includes(`id="${id}"`));
  if (missingIds.length > 0) {
    logFail(`Módulos obrigatórios ausentes no HTML: ${missingIds.join(', ')}`);
    hasError = true;
  } else {
    logPass('Todos os 7 módulos principais estão presentes no HTML.');
  }

  // Verificação de lógica JS no index.html
  const requiredJsTokens = [
    'alternarVisaoPrincipal',
    'ROUTE_MAP',
    'VALID_USERS',
    'renderTable',
    'renderOcorrencias'
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
  'worker.js'
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
// TESTE 4: CRIAR BACKUP LOCAL AUTOMÁTICO ANTES DE QUALQUER MUDANÇA
// ------------------------------------------------------------------------------
console.log(`\n${COLORS.bold}--- 4. Criando Snapshot de Backup Seguro ---${COLORS.reset}`);
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

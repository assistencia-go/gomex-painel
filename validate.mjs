// ==============================================================================
// GOMEX ENTERPRISE · PIPELINE DE VALIDAÇÃO E SEGURANÇA CONTRA ERROS
// ==============================================================================
// Este script é a barreira de segurança obrigatória antes de qualquer push ou deploy.
// Se qualquer teste falhar, o deploy é bloqueado imediatamente.

import fs from 'fs';
import path from 'path';
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
}

// ------------------------------------------------------------------------------
// TESTE 2: SINTAXE JAVASCRIPT DOS ARQUIVOS DO PROJETO
// ------------------------------------------------------------------------------
console.log(`\n${COLORS.bold}--- 2. Validando Sintaxe dos Arquivos JavaScript ---${COLORS.reset}`);
const jsFilesToCheck = [
  'server.js',
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
// TESTE 3: COMPILAÇÃO E VALIDAÇÃO OFICIAL CLOUDFLARE (WRANGLER DRY-RUN)
// ------------------------------------------------------------------------------
console.log(`\n${COLORS.bold}--- 3. Validando Compilação Cloudflare Wrangler ---${COLORS.reset}`);
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

  const filesToBackup = ['index.html', 'worker.js', 'generate_worker.js', 'sw.js'];
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

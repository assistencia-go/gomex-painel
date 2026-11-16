// ==============================================================================
// SCRIPT DE PUSH AUTOMÁTICO PARA O GITHUB (GOMEX-PAINEL)
// ==============================================================================

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// O token do GitHub NUNCA fica escrito no codigo.
// Informe-o pela variavel de ambiente GITHUB_TOKEN ou pelo arquivo local .env
// (linha: GITHUB_TOKEN=seu_token). O .env esta no .gitignore e nunca e enviado.
function carregarTokenGithub() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN.trim();
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const m = fs.readFileSync(envPath, 'utf8').match(/^\s*GITHUB_TOKEN\s*=\s*(.+?)\s*$/m);
    if (m) return m[1].replace(/^["']|["']$/g, '');
  }
  return '';
}
const GITHUB_TOKEN = carregarTokenGithub();
const REPO_OWNER = 'assistencia-go';
const TARGET_REPO = 'gomex-painel';

const headers = {
  'Authorization': `Bearer ${GITHUB_TOKEN}`,
  'Accept': 'application/vnd.github.v3+json',
  'User-Agent': 'Gomex-Admin-Sync',
  'Content-Type': 'application/json'
};

function getAllFiles(dir, prefix = '') {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const relPath = prefix ? `${prefix}/${file}` : file;
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(filePath, relPath));
    } else {
      results.push(relPath);
    }
  }
  return results;
}

const CORE_FILES_START = [
  '.gitignore',
  '.env.example',
  'VERSIONS.md',
  'ENTERPRISE_SAFETY.md',
  'README_MODULOS.md',
  'package.json',
  'wrangler.toml',
  'build.js',
  'validate.mjs',
  'server.js',
  'push_to_github.mjs'
];

const CORE_FILES_END = [
  'index.html',
  'public/index.html',
  'sw.js',
  'public/sw.js',
  'generate_worker.js',
  'worker.js'
];

const srcFiles = getAllFiles(path.join(__dirname, 'src'), 'src');
const FILES_TO_PUSH = [...CORE_FILES_START, ...srcFiles, ...CORE_FILES_END];

async function pushFile(fileName) {
  const baseName = path.basename(fileName);
  if (baseName === '.env' || (baseName.startsWith('.env.') && baseName !== '.env.example')) {
    throw new Error(`[BLOQUEIO DE SEGURANCA] Tentativa de enviar arquivo secreto bloqueada: ${fileName}`);
  }
  const localPath = path.join(__dirname, fileName);
  if (!fs.existsSync(localPath)) {
    console.warn(`Arquivo não encontrado: ${fileName}`);
    return;
  }

  const content = fs.readFileSync(localPath);
  const textSample = content.toString('utf8');
  if (/github_pat_[A-Za-z0-9_]+|ghp_[A-Za-z0-9]+/.test(textSample)) {
    throw new Error(`[BLOQUEIO DE SEGURANCA] Token GitHub detectado no arquivo ${fileName}. Push abortado!`);
  }
  const base64Content = content.toString('base64');
  const gitHubPath = fileName.replace(/\\/g, '/');
  const url = `https://api.github.com/repos/${REPO_OWNER}/${TARGET_REPO}/contents/${gitHubPath}`;

  let success = false;
  for (let attempt = 1; attempt <= 3 && !success; attempt++) {
    try {
      let sha = null;
      const getRes = await fetch(url, { headers });
      if (getRes.ok) {
        const fileInfo = await getRes.json();
        sha = fileInfo.sha;
      }

      const body = {
        message: `feat(painel): RBAC administrador, usuarios salvos no Supabase e monitor real de armazenamento (${fileName})`,
        content: base64Content,
        branch: 'main'
      };
      if (sha) body.sha = sha;

      const putRes = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body)
      });

      if (putRes.ok) {
        const resData = await putRes.json();
        console.log(`[OK] [GitHub] ${fileName} enviado com sucesso! Commit: ${resData.commit?.sha?.substring(0, 7) || 'ok'}`);
        success = true;
      } else {
        const errData = await putRes.json();
        if (attempt === 3) console.error(`[ERRO] Enviando ${fileName}:`, errData.message);
        await new Promise(r => setTimeout(r, 1200));
      }
    } catch (e) {
      if (attempt === 3) console.error(`[FALHA] Rede para ${fileName}:`, e.message);
      await new Promise(r => setTimeout(r, 1200));
    }
  }
}

async function main() {
  if (!GITHUB_TOKEN) {
    console.error('[BLOQUEIO] Token do GitHub nao configurado. Defina GITHUB_TOKEN (variavel de ambiente ou arquivo .env). Nada foi enviado.');
    process.exit(1);
  }
  console.log(`[BUILD] Gerando worker.js e sincronizando public/index.html...`);
  try {
    execSync('node generate_worker.js', { cwd: __dirname, stdio: 'inherit' });
  } catch (err) {
    console.error(`[ERRO] Falha ao compilar worker:`, err.message);
    process.exit(1);
  }

  console.log(`[SEGURANÇA] Executando bateria de testes e validação pré-deploy...`);
  try {
    execSync('node validate.mjs', { cwd: __dirname, stdio: 'inherit' });
  } catch (err) {
    console.error(`\n[BLOQUEIO CRÍTICO] O envio para o GitHub foi CANCELADO porque a validação reprovou.`);
    console.error(`Nenhuma alteração foi enviada. O site em produção continua 100% seguro.\n`);
    process.exit(1);
  }

  console.log(`\n[START] Iniciando envio seguro do Painel Executivo para: https://github.com/${REPO_OWNER}/${TARGET_REPO}`);
  for (const f of FILES_TO_PUSH) {
    await pushFile(f);
  }
  console.log(`\n[CONCLUIDO] Projeto gomex-painel enviado com sucesso para: https://github.com/${REPO_OWNER}/${TARGET_REPO}\n`);
}

main().catch(console.error);

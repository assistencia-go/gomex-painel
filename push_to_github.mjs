// ==============================================================================
// SCRIPT DE PUSH AUTOMÁTICO PARA O GITHUB (GOMEX-PAINEL)
// ==============================================================================

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
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
const TARGET_BRANCH = 'main';

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
      results.push(relPath.replace(/\\/g, '/'));
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
  'manifest.json',
  'public/manifest.json',
  'icon.svg',
  'public/icon.svg',
  'generate_worker.js',
  'worker.js'
];

function computeGitBlobSha(buf) {
  const header = Buffer.from(`blob ${buf.length}\0`, 'utf8');
  return crypto.createHash('sha1').update(header).update(buf).digest('hex');
}

async function ghApi(endpoint, opts = {}) {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${TARGET_REPO}${endpoint}`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers, ...opts });
      const txt = await res.text();
      let data = null;
      try { data = txt ? JSON.parse(txt) : null; } catch (e) { }
      if (res.ok) return data;
      if (attempt === 3) {
        throw new Error(`GitHub API ${opts.method || 'GET'} ${endpoint} -> HTTP ${res.status}: ${data?.message || txt}`);
      }
    } catch (err) {
      if (attempt === 3) throw err;
    }
    await new Promise(r => setTimeout(r, 1200));
  }
}

function getCommitMessage() {
  const idx = process.argv.findIndex(a => a === '--message' || a === '-m');
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1].trim();
  const positional = process.argv.slice(2).find(a => !a.startsWith('-'));
  if (positional) return positional.trim();
  return 'feat(painel): persistencia granular por registro, code-splitting, delegacao de eventos e melhorias UX';
}

async function main() {
  if (!GITHUB_TOKEN) {
    console.error('[BLOQUEIO] Token do GitHub nao configurado. Defina GITHUB_TOKEN (variavel de ambiente ou arquivo .env). Nada foi enviado.');
    process.exit(1);
  }

  console.log('[BUILD] Gerando worker.js, chunks e sincronizando public/index.html...');
  try {
    execSync('node generate_worker.js', { cwd: __dirname, stdio: 'inherit' });
  } catch (err) {
    console.error('[ERRO] Falha ao compilar worker:', err.message);
    process.exit(1);
  }

  console.log('[SEGURANCA] Executando bateria de testes e validacao pre-deploy...');
  try {
    execSync('node validate.mjs', { cwd: __dirname, stdio: 'inherit' });
  } catch (err) {
    console.error('\n[BLOQUEIO CRITICO] O envio para o GitHub foi CANCELADO porque a validacao reprovou.');
    console.error('Nenhuma alteracao foi enviada. O site em producao continua 100% seguro.\n');
    process.exit(1);
  }

  const libFiles = getAllFiles(path.join(__dirname, 'lib'), 'lib');
  const srcFiles = getAllFiles(path.join(__dirname, 'src'), 'src');
  const chunkFiles = getAllFiles(path.join(__dirname, 'public', 'chunks'), 'public/chunks');
  const ALL_CANDIDATES = [...new Set([...CORE_FILES_START, ...libFiles, ...srcFiles, ...chunkFiles, ...CORE_FILES_END])];

  // Validacao de seguranca antes de enviar qualquer blob
  const localFiles = [];
  for (const rel of ALL_CANDIDATES) {
    const baseName = path.basename(rel);
    if (baseName === '.env' || (baseName.startsWith('.env.') && baseName !== '.env.example')) {
      throw new Error(`[BLOQUEIO DE SEGURANCA] Tentativa de enviar arquivo secreto bloqueada: ${rel}`);
    }
    const abs = path.join(__dirname, rel);
    if (!fs.existsSync(abs) || fs.statSync(abs).isDirectory()) continue;
    const buf = fs.readFileSync(abs);
    const sample = buf.toString('utf8');
    if (/github_pat_[A-Za-z0-9_]+|ghp_[A-Za-z0-9]+/.test(sample)) {
      throw new Error(`[BLOQUEIO DE SEGURANCA] Token GitHub detectado no arquivo ${rel}. Push abortado!`);
    }
    localFiles.push({ path: rel, buf, sha: computeGitBlobSha(buf) });
  }

  console.log(`\n[START] Conectando a https://github.com/${REPO_OWNER}/${TARGET_REPO} (${localFiles.length} arquivos monitorados)...`);

  const refData = await ghApi(`/git/ref/heads/${TARGET_BRANCH}`);
  const latestCommitSha = refData.object.sha;
  const commitData = await ghApi(`/git/commits/${latestCommitSha}`);
  const baseTreeSha = commitData.tree.sha;
  const remoteTreeRes = await ghApi(`/git/trees/${baseTreeSha}?recursive=1`);

  const remoteMap = new Map();
  for (const item of (remoteTreeRes.tree || [])) {
    if (item.type === 'blob') remoteMap.set(item.path, item.sha);
  }

  const toUpload = localFiles.filter(f => remoteMap.get(f.path) !== f.sha);
  const localPathSet = new Set(localFiles.map(f => f.path));
  const managedPrefixes = ['src/', 'lib/', 'public/chunks/'];
  const toDelete = [];
  for (const rPath of remoteMap.keys()) {
    if (managedPrefixes.some(p => rPath.startsWith(p)) && !localPathSet.has(rPath)) {
      toDelete.push(rPath);
    }
  }

  if (toUpload.length === 0 && toDelete.length === 0) {
    console.log('[OK] Repositorio GitHub ja esta 100% atualizado (0 arquivos alterados).');
    return;
  }

  console.log(`[SYNC] Enviando ${toUpload.length} arquivo(s) alterado(s) e removendo ${toDelete.length} obsoleto(s) em 1 commit atomico...`);

  const treeEntries = [];
  for (const f of toUpload) {
    const blobRes = await ghApi('/git/blobs', {
      method: 'POST',
      body: JSON.stringify({ content: f.buf.toString('base64'), encoding: 'base64' })
    });
    treeEntries.push({ path: f.path, mode: '100644', type: 'blob', sha: blobRes.sha });
    console.log(`  + [BLOB] ${f.path}`);
  }
  for (const delPath of toDelete) {
    treeEntries.push({ path: delPath, mode: '100644', type: 'blob', sha: null });
    console.log(`  - [DEL]  ${delPath}`);
  }

  const newTree = await ghApi('/git/trees', {
    method: 'POST',
    body: JSON.stringify({ base_tree: baseTreeSha, tree: treeEntries })
  });

  const message = getCommitMessage();
  const newCommit = await ghApi('/git/commits', {
    method: 'POST',
    body: JSON.stringify({
      message,
      tree: newTree.sha,
      parents: [latestCommitSha]
    })
  });

  await ghApi(`/git/refs/heads/${TARGET_BRANCH}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: newCommit.sha, force: false })
  });

  console.log(`\n[CONCLUIDO] Commit atomico ${newCommit.sha.substring(0, 7)} enviado para https://github.com/${REPO_OWNER}/${TARGET_REPO} (${toUpload.length} atualizados, ${toDelete.length} removidos).`);
}

main().catch(err => {
  console.error('[ERRO FATAL NO PUSH]', err);
  process.exit(1);
});

// ==============================================================================
// GOMEX ENTERPRISE · COMPILADOR / BUILDER DO SISTEMA MODULAR
// ==============================================================================
// Este script junta de forma determinística e segura todos os módulos de src/
// gerando o index.html de produção.
// Se qualquer módulo for editado, rodar 'npm run build' ou 'node build.js' recompila instantaneamente.

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');
const OUTPUT_HTML = path.join(__dirname, 'index.html');

// 1. Ordem determinística dos arquivos CSS
const CSS_FILES = [
  '01-tokens-base.css',
  '02-buttons-inputs.css',
  '03-topbar-alerts-kpis.css',
  '04-tables-tabs-badges.css',
  '05-drawer-modals-base.css',
  '06-responsive-mobile.css',
  '07-gastos-pecas.css',
  '08-galeria-fotos.css',
  '09-ocorrencias-pausas.css',
  '10-admin-rbac.css'
];

// 2. Ordem determinística dos blocos HTML
const HTML_FILES = [
  'icons.html',
  'login.html',
  'topbar.html',
  'views/vistorias.html',
  'views/manutencao.html',
  'views/ocorrencias.html',
  'views/vendedores.html',
  'views/gastos.html',
  'views/galeria.html',
  'views/frotacad.html',
  'views/admin.html',
  'drawer/drawer.html',
  'modals/history-veiculo.html',
  'modals/whatsapp.html',
  'modals/ocorrencias.html',
  'modals/confirmacao-global.html',
  'modals/relatorio-ocorrencias.html',
  'modals/cadastrar-veiculo.html',
  'modals/inativar-vistoria.html',
  'modals/editar-vistoria.html',
  'modals/hist-vendedor.html',
  'modals/relatorio-supervisores.html',
  'modals/custodia-veiculo.html',
  'modals/lancar-gasto.html',
  'modals/catalogo-produtos.html',
  'modals/subir-foto.html',
  'modals/ver-foto.html',
  'modals/push-notificacoes.html'
];

// 3. Ordem determinística dos scripts JS
const JS_FILES = [
  'core/state-config.js',
  'core/theme-sound-helpers.js',
  'core/auth-session.js',
  'core/api-storage.js',
  'modules/vistorias-tabela.js',
  'modules/manutencao.js',
  'modules/vistorias-drawer.js',
  'core/routing.js',
  'core/rbac-admin.js',
  'modules/vendedores.js',
  'modules/vistorias-acoes.js',
  'modules/gastos.js',
  'modules/galeria.js',
  'modules/vendedores-cobranca.js',
  'modules/frotacad.js',
  'modules/ocorrencias.js',
  'modules/gastos-export.js',
  'modules/pdf-export.js',
  'modules/export-csv.js',
  'modules/pwa-push.js',
  'boot.js'
];

function buildIndexHtml() {
  const parts = [];

  // A. Cabeçalho do documento HTML (<!doctype>, meta tags, fontes, jsPDF, <style>)
  parts.push(fs.readFileSync(path.join(SRC_DIR, 'html', 'head.html'), 'utf8'));

  // B. Folhas de estilo CSS concatenadas
  for (const cssFile of CSS_FILES) {
    const p = path.join(SRC_DIR, 'css', cssFile);
    if (fs.existsSync(p)) {
      parts.push(fs.readFileSync(p, 'utf8'));
    } else {
      console.warn(`[WARN] Arquivo CSS não encontrado: ${cssFile}`);
    }
  }

  // C. Fechamento de </style></head> e abertura de <body class="theme-light">
  parts.push(fs.readFileSync(path.join(SRC_DIR, 'html', 'head-close.html'), 'utf8'));

  // D. Blocos HTML (ícones, login, topbar, views das telas, gavetas, modais)
  for (const htmlFile of HTML_FILES) {
    const p = path.join(SRC_DIR, 'html', htmlFile);
    if (fs.existsSync(p)) {
      parts.push(fs.readFileSync(p, 'utf8'));
    } else {
      console.warn(`[WARN] Arquivo HTML não encontrado: ${htmlFile}`);
    }
  }

  // E. Abertura do <script> e IIFE isolada ('use strict')
  parts.push(fs.readFileSync(path.join(SRC_DIR, 'js', 'script-open.js'), 'utf8'));

  // F. Módulos JavaScript
  for (const jsFile of JS_FILES) {
    const p = path.join(SRC_DIR, 'js', jsFile);
    if (fs.existsSync(p)) {
      parts.push(fs.readFileSync(p, 'utf8'));
    } else {
      console.warn(`[WARN] Arquivo JS não encontrado: ${jsFile}`);
    }
  }

  // G. Fechamento da IIFE, </script>, </body> e </html>
  parts.push(fs.readFileSync(path.join(SRC_DIR, 'js', 'script-close.js'), 'utf8'));

  const finalHtml = parts.join('\n');
  fs.writeFileSync(OUTPUT_HTML, finalHtml, 'utf8');

  const sizeKb = (Buffer.byteLength(finalHtml, 'utf8') / 1024).toFixed(1);
  console.log(`[BUILD] index.html compilado com sucesso a partir dos módulos de src/! Tamanho: ${sizeKb} KB`);
  return finalHtml;
}

if (require.main === module) {
  buildIndexHtml();
}

module.exports = { buildIndexHtml };

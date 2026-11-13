# Guia de Arquitetura Modular · Gomex Frota

Este projeto foi modularizado com **preservação integral de dados, comportamento e compatibilidade** (100% idêntico bit-a-bit à versão de produção).

---

## 📁 Estrutura de Pastas (`src/`)

```text
src/
├── css/                              # Folhas de estilo categorizadas por contexto
│   ├── 01-tokens-base.css            # Variáveis, cores obsidian/salmão, temas e base
│   ├── 02-buttons-inputs.css         # Botões, campos de entrada, formulários
│   ├── 03-topbar-alerts-kpis.css     # Barra superior, cards de KPI, banners de alerta
│   ├── 04-tables-tabs-badges.css     # Tabela de vistorias, abas, badges corporativos
│   ├── 05-drawer-modals-base.css     # Gaveta lateral e estrutura base dos modais
│   ├── 06-responsive-mobile.css      # Regras de responsividade para smartphone e tablet
│   ├── 07-gastos-pecas.css           # Estilos da tela de custos, peças e insumos
│   ├── 08-galeria-fotos.css          # Estilos da galeria de fotos dos veículos
│   ├── 09-ocorrencias-pausas.css     # Estilos da tela de ocorrências e pausas
│   └── 10-admin-rbac.css             # Estilos do painel de administração de usuários
│
├── html/                             # Marcação HTML dividida por componentes e telas
│   ├── head.html                     # Doctype, metatags, fontes, scripts externos (jsPDF)
│   ├── head-close.html               # Transição entre </style></head> e <body>
│   ├── icons.html                    # Ícones SVG corporativos e símbolos
│   ├── login.html                    # Tela de autenticação corporativa
│   ├── topbar.html                   # Barra superior, navegação entre abas e sync
│   │
│   ├── views/                        # Telas principais da aplicação
│   │   ├── vistorias.html            # Tela de Checklists e Vistorias
│   │   ├── manutencao.html           # Tela de Manutenção da Frota
│   │   ├── ocorrencias.html          # Tela de Ocorrências e Pausas
│   │   ├── vendedores.html           # Tela de Vendedores e Custódia
│   │   ├── gastos.html               # Tela de Custos, Peças e Insumos
│   │   ├── galeria.html              # Tela de Galeria de Fotos dos Veículos
│   │   ├── frotacad.html             # Tela de Cadastro Fixo da Frota
│   │   └── admin.html                # Tela de Permissões e Usuários (RBAC)
│   │
│   ├── drawer/                       # Gaveta lateral de detalhes
│   │   └── drawer.html               # Gaveta de detalhes, histórico, aprovação e oficina
│   │
│   └── modals/                       # Modais e caixas de diálogo
│       ├── relatorio-supervisores.html # Relatório por Supervisor > Vendedores
│       ├── lancar-gasto.html           # Modal de lançamento de gastos e peças
│       ├── catalogo-produtos.html      # Catálogo de produtos e insumos com código
│       ├── ocorrencias.html            # Lançamento de ocorrência da frota
│       ├── relatorio-ocorrencias.html  # Relatório de ocorrências (de X até Y)
│       ├── whatsapp.html               # Cobrança rápida de WhatsApp
│       ├── history-veiculo.html        # Histórico completo da placa
│       ├── cadastrar-veiculo.html      # Cadastro de novo veículo
│       ├── inativar-vistoria.html      # Arquivamento com justificativa
│       ├── editar-vistoria.html        # Edição rápida de rota e dados
│       ├── hist-vendedor.html          # Histórico individual do vendedor
│       ├── custodia-veiculo.html       # Transferência de custódia
│       ├── subir-foto.html             # Upload de foto da galeria
│       ├── ver-foto.html               # Visualizador de imagem em alta resolução
│       ├── confirmacao-global.html     # Diálogo corporativo de confirmação
│       └── push-notificacoes.html      # Ativação de Web Push Notifications
│
└── js/                               # Lógica JavaScript dividida por responsabilidade
    ├── script-open.js                # Abertura do script e isolamento IIFE ('use strict')
    ├── script-close.js               # Fechamento do script e encerramento do app
    │
    ├── core/                         # Núcleo da aplicação e infraestrutura
    │   ├── state-config.js           # Estado reativo global, constantes e configurações
    │   ├── theme-sound-helpers.js    # Temas, áudio corporativo, sanitização (esc/norm)
    │   ├── auth-session.js           # Login, hash SHA-256 e controle de sessão
    │   ├── api-storage.js            # Cliente Supabase REST, cache offline e fila
    │   ├── routing.js                # Roteamento SPA (/vistorias, /custos, etc.)
    │   └── rbac-admin.js             # Controle de acesso e permissões por perfil
    │
    ├── modules/                      # Lógicas de negócio específicas de cada tela
    │   ├── vistorias-tabela.js       # Tabela de vistorias, filtros, paginação e KPIs
    │   ├── vistorias-drawer.js       # Gaveta de detalhes, assinaturas e aprovação
    │   ├── vistorias-acoes.js        # Inativação, download de assinaturas e histórico
    │   ├── manutencao.js             # Controle de oficina e manutenções da frota
    │   ├── vendedores.js             # Equipes, custódia e relatório de supervisores
    │   ├── vendedores-cobranca.js    # Cobrança individual WhatsApp
    │   ├── gastos.js                 # Lançamento de despesas, peças e catálogo
    │   ├── gastos-export.js          # Exportação de custos para CSV e PDF
    │   ├── galeria.js                # Galeria de fotos e compressão de imagens
    │   ├── frotacad.js               # Cadastro fixo de veículos e motoristas
    │   ├── ocorrencias.js            # Ocorrências, pausas e agendamentos
    │   ├── pdf-export.js             # Gerador de PDF oficial A4 e mapa vetorial da Van
    │   ├── export-csv.js             # Exportação geral para planilha Excel
    │   └── pwa-push.js               # Notificações Web Push nativas e Service Worker
    │
    └── boot.js                       # Inicialização automática do sistema ao carregar
```

---

## 🛠️ Como funciona o Build Automático

O arquivo `build.js` une todos os módulos de `src/` gerando o `index.html` completo.
Ele é acionado automaticamente em todos os fluxos:

```bash
# Compilar os módulos para o index.html e gerar o worker.js
node generate_worker.js

# Executar bateria de validação enterprise (AST, Zero-Emoji, Headless Smoke Test)
node validate.mjs

# Enviar para o GitHub com verificação prévia
node push_to_github.mjs
```

---

## 💡 Como pedir alterações para a Inteligência Artificial

Agora que o projeto está dividido em pastas limpas, você pode pedir diretamente por tela ou funcionalidade. Exemplos:

- **"Na tela de custos, adicione um filtro por fornecedor..."**  
  *A IA saberá abrir apenas `src/html/views/gastos.html` e `src/js/modules/gastos.js`.*

- **"No relatório de supervisores, adicione uma coluna de KM..."**  
  *A IA irá direto em `src/html/modals/relatorio-supervisores.html` e `src/js/modules/vendedores.js`.*

- **"Mude a cor do botão de vistoria no tema claro..."**  
  *A IA irá direto em `src/css/02-buttons-inputs.css`.*

- **"No mapa de avarias da Van no PDF, ajuste a espessura da linha..."**  
  *A IA irá direto em `src/js/modules/pdf-export.js`.*

Qualquer alteração feita nos arquivos de `src/` é automaticamente compilada no `index.html` e no `worker.js` de produção sem nenhum risco de quebrar outras partes do sistema.

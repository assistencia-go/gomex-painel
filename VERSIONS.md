# Histórico e Registro Oficial de Versões · Gomex Frota

Este arquivo registra formalmente cada marco de versão da aplicação **Gomex Frota & Painel Executivo**, garantindo rastreabilidade, auditoria e segurança para a empresa.

---

## 📌 Versão Atual: `v1.7.0-stable` (12/11/2026)
* **Tag Oficial no GitHub:** [`v1.7.0-stable`](https://github.com/assistencia-go/gomex-painel/releases/tag/v1.7.0-stable)
* **Status:** Produção Estável (Cloudflare Workers)
* **Principais Entregas:**
  - **Controle Granular de Permissões de Edição & Gravação:** Permite que o administrador `gomex` decida quem pode alterar dados ou apenas consultar:
    1. `editar_vistorias`: Edição de parecer de gestor, alteração de checklists e inativação/reativação de laudos.
    2. `editar_ocorrencias`: Criação de novas pausas/ocorrências, edição e exclusão de registros.
    3. `editar_manutencao`: Alteração de status de oficina e salvamento de observações mecânicas.
    4. `editar_gastos`: Lançamento e exclusão de custos, peças e insumos.
    5. `editar_frotacad`: Cadastro e edição de veículos fixos da frota.
  - **Modo Seguro "Somente Leitura" por Padrão:** Supervisores comuns operam em modo seguro de consulta, com botões de criação, edição e exclusão ocultados e bloqueados por interceptores no código com avisos toast explicativos.
  - **Botões Rápidos no Admin:** Atalhos com 1 clique ("🔒 Somente Leitura" e "✏️ Liberar Edições") dentro do painel `/admin` para configuração imediata por operador.
  - **Resolução de Deploy na Cloudflare:** Remoção do arquivo duplicado `wrangler.json`, unificando a esteira no `wrangler.toml` oficial sem conflitos no `npx wrangler deploy`.

---

## 📌 Versões Anteriores

### `v1.6.0-stable` (12/11/2026)
* **Tag Oficial no GitHub:** [`v1.6.0-stable`](https://github.com/assistencia-go/gomex-painel/releases/tag/v1.6.0-stable)
* **Status:** Versão Arquivada
* **Principais Entregas:**
  - **Painel Administrativo Master de Permissões (`/admin`):** Módulo central de controle de acessos restrito 100% ao login master `gomex`. Usuários comuns (`hendreo`, `ricardo`, `eliase`, `alisson 101`, `alisson 103`, `maycon`, etc.) não têm visualização nem acesso a esta área.
  - **Bloqueio Estrito de Telas por Usuário:** Controle individual por chave liga/desliga sobre as 7 telas da plataforma: Vistorias/Checklist, Manutenções, Ocorrências/Pausas, Custos & Peças, Galeria de Fotos, Vendedores e Cadastro de Frota.
  - **Segurança de Roteamento Duplo:** Acesso bloqueado tanto nos menus de navegação (barra lateral desktop e dock inferior mobile) quanto na digitação direta de rotas na URL do navegador, redirecionando o usuário para sua tela autorizada com aviso seguro.
  - **Sincronização Nuvem e Local (Supabase & LocalStorage):** As permissões definidas pelo Administrador são salvas instantaneamente no banco de dados e sincronizadas em todos os computadores e celulares conectados.
  - **Gestão de Usuários e Senhas Seguras:** Possibilidade de adicionar novos operadores e alterar senhas com criptografia SHA-256 imediata.

---

## 📌 Versões Anteriores

### `v1.5.0-stable` (12/11/2026)
* **Tag Oficial no GitHub:** [`v1.5.0-stable`](https://github.com/assistencia-go/gomex-painel/releases/tag/v1.5.0-stable)
* **Status:** Versão Arquivada
* **Commit:** `480436d` / `1e7fe24`
* **Principais Entregas:**
  - **Validação Automática Pré-Deploy (`validate.mjs`):** Barreira de segurança obrigatória que testa sintaxe JS, integridade estrutural do HTML e compatibilidade Cloudflare Wrangler antes de qualquer envio.
  - **Otimização Mobile dos Cards:** Redesenho completo para telas de celular em grid 2x2 simétrico (Início, Tempo Médio, Previsão, Tempo Utilizado) e fluxo vertical no cabeçalho, eliminando qualquer rolagem/arraste lateral.
  - **Filtros e Badges Sólidos:** Substituição de cores translúcidas/baixa opacidade por cores sólidas de alto contraste (Índigo `#4f46e5`, Vermelho `#dc2626`, Cinza Escuro).
  - **Padronização Visual:** Remoção integral de emojis e fixação do tema corporativo claro.
  - **Cadastro de Novos Usuários:** Acesso liberado para Eliase (`SUP102`), Alisson 101 (`SUP101`), Alisson 103 (`SUP103`) e Maycon (`GERENCIA@2026`).

---

## 📌 Versões Anteriores

### `v1.4.0` (11/11/2026)
* **Entregas:**
  - Módulo de Ocorrências & Controle de Pausas da Frota.
  - Alertas sonoros e visuais para veículos parados e tempo excedido.
  - Service Worker com suporte offline e auto-refresh em atualizações.

### `v1.0.0` (04/11/2026)
* **Entregas:**
  - Lançamento inicial do sistema integrado Gomex Frota.
  - Vistorias diárias de frota, relatórios PDF e sincronização com banco de dados Supabase.

---

## 🔒 Como Restaurar uma Versão Anterior

1. **Pela Cloudflare (Instantâneo - 2 segundos):**
   - Acesse [dash.cloudflare.com](https://dash.cloudflare.com) ➔ **Workers & Pages** ➔ **`gomex-painel`** ➔ **Deployments**.
   - Localize o deploy correspondente e clique em **Rollback**.

2. **Pelo GitHub (Código-Fonte):**
   - Acesse a aba [Tags / Releases](https://github.com/assistencia-go/gomex-painel/tags).
   - Clique em **`v1.5.0-stable`** para baixar o `.zip` ou visualizar o código congelado daquele exato momento.


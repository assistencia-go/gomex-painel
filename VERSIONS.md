# Histórico e Registro Oficial de Versões · Gomex Frota

Este arquivo registra formalmente cada marco de versão da aplicação **Gomex Frota & Painel Executivo**, garantindo rastreabilidade, auditoria e segurança para a empresa.

---

## 📌 Versão Atual: `v1.5.0-stable` (12/11/2026)
* **Tag Oficial no GitHub:** [`v1.5.0-stable`](https://github.com/assistencia-go/gomex-painel/releases/tag/v1.5.0-stable)
* **Status:** Produção Estável (Cloudflare Workers)
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

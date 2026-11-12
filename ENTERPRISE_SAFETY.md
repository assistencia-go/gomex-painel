# Diretrizes Enterprise de Estabilidade e Segurança · Gomex Distribuidora

> **DOCUMENTO DE SEGURANÇA OPERACIONAL (CRÍTICO PARA PRODUÇÃO)**  
> Este repositório atende a operação em tempo real da frota Gomex. Falhas, travamentos ou indisponibilidades afetam diretamente supervisores, gerência e vendedores.

---

## 1. O Pipeline Automático de Validação (`validate.mjs`)

Nenhum arquivo pode ser enviado para o GitHub ou para o Cloudflare Workers sem passar pelo pipeline de validação automática:

```bash
npm test
# ou
node validate.mjs
```

### O que é testado e garantido automaticamente:
1. **Integridade do `index.html`:**
   - Tamanho mínimo garantido (> 750 KB) para evitar cortes ou edições parciais.
   - Verificação de tags estruturais (`<!doctype html>` até `</html>`).
   - Verificação de presença obrigatória de todos os 7 módulos do sistema (`vistorias`, `manutencao`, `ocorrencias`, `gastos`, `galeria`, `vendedores`, `frotacad`).
   - Presença obrigatória de scripts críticos (`alternarVisaoPrincipal`, `ROUTE_MAP`, `VALID_USERS`, `renderTable`, `renderOcorrencias`).
2. **Sintaxe JavaScript de Todos os Arquivos:**
   - Análise léxica e de AST (`node --check`) em `worker.js`, `generate_worker.js`, `server.js`, `sw.js`, `public/sw.js`.
   - Impede erros de digitação, vírgulas faltando, tags não fechadas ou chaves duplicadas.
3. **Compilação Oficial Cloudflare Wrangler:**
   - Execução de `npx wrangler deploy --dry-run` antes do deploy real.
   - Simula o empacotamento completo exatamente como a Cloudflare fará.
4. **Snapshot e Backup Local Pré-Deploy:**
   - Antes de cada push, é criado um snapshot automático em `.backups/backup_YYYY-MM-DD...`.
   - Permite restauração instantânea local de qualquer versão estável anterior.

---

## 2. Política de Deploy Seguro

* **Envio Seguro via Script:**  
  Use sempre:
  ```bash
  npm run push
  ```
  O script executa o teste prévio e, caso ocorra qualquer erro de código ou sintaxe, **o push é abortado imediatamente** antes de tocar no GitHub ou disparar a Cloudflare.

* **Reversão Instantânea (Rollback na Cloudflare):**  
  Se qualquer comportamento indesejado acontecer em produção:
  1. Acesse o Cloudflare Dashboard (`dash.cloudflare.com`).
  2. Vá em **Workers & Pages** -> **`gomex-painel`** -> aba **Deployments**.
  3. Ao lado da versão estável anterior, clique nos três pontinhos `...` e selecione **Rollback**. O site volta para a versão anterior em 2 segundos sem downtime.

* **Versões Fixas e Marcadas (Git Release Tags):**  
  Versões aprovadas são marcadas com tags imutáveis (ex: `v1.5.0-stable`). Em caso de auditoria ou necessidade de restauração, a tag permanece 100% gravada no repositório.


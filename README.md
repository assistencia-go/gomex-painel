# Painel Executivo de Gestao de Frota - Gomex Distribuidora

Sistema administrativo e operacional para acompanhamento em tempo real de vistorias veiculares, liberacao de veiculos, custos, manutencao preventiva e emissao de relatorios oficiais da frota Gomex.

---

## Seguranca & Controle de Acesso
O acesso ao painel e restrito a equipe administrativa e gestores autorizados:
- Autenticacao com validacao criptografica via hash SHA-256.
- Politica estrita de expiracao de sessao por tempo decorrido e por inatividade.
- Sem vazamento de credenciais ou chaves secretas no codigo do cliente.
- Higienizacao automatica de URLs com remocao imediata de parametros confidenciais.

---

## Funcionalidades Principais
- Dashboard de Metricas & KPIs: Total de vistorias, veiculos liberados, ressalvas e bloqueios em tempo real.
- Cadastro e Prontuario Completo da Frota: Gestao de veiculos ativos, motoristas titulares, rotas e controle preventivo de troca de oleo.
- Filtros Inteligentes & SPA Routing: Navegacao rapida com URLs semanticas (/vistoria, /frota, /manutencao, /ocorrencias, /custos, /galeria, /vendedores).
- Modulo de Ocorrencias & Controle de Pausas: Registro de imprevistos do dia a dia (pneu furado, quebras mecânicas, socorro) com cronometragem em tempo real das paradas dos vendedores, obrigatoriedade de vendedor e rota, acoes rapidas de finalizacao com 1 clique e envio formatado para WhatsApp (otimizado para mobile).
- Gestao de Custos, Pecas e Insumos: Lancamento detalhado de gastos com preenchimento preditivo por codigo/nome de produto.
- Modulo de Manutencao: Controle preventivo e corretivo por placa com registro de oficinas e prazos.
- Reemissao de 2a Via do PDF Oficial: Geracao de relatorio de vistoria padronizado.
- Exportacao em CSV: Download compativel com planilhas Excel.

---

## Executando Localmente
```bash
node server.js
```
Acesse em: http://localhost:3001

# Painel Executivo de Gestão de Frota · Gomex Distribuidora

Sistema administrativo e operacional para acompanhamento em tempo real de vistorias veiculares, liberação de veículos e emissão de relatórios oficiais da frota Gomex.

---

## 🔒 Acesso Restrito & Autenticação
O acesso a este painel é 100% isolado dos motoristas e restrito aos gestores:
- **Usuário**: `gomex`
- **Senha**: `Gomex@2026`

---

## 🚀 Funcionalidades Principais
- **Dashboard de Métricas & KPIs**: Total de vistorias, veículos liberados, ressalvas e bloqueios em tempo real.
- **Filtros Inteligentes**: Busca rápida por placa, motorista, número de vistoria, modelo de veículo e período.
- **Visualização Detalhada (Inspector)**:
  - Dados completos da inspeção e condutor.
  - Mapa gráfico da carroceria com os pontos exatos de avaria marcados.
  - Tabela de calibragem e estado dos pneus.
  - Assinaturas digitais coletadas.
- **Módulo & Aba de Manutenção da Frota**:
  - Aba dedicada no detalhe do veículo para registrar se está **Em Manutenção** ou **Já foi para Manutenção**.
  - Registro de oficina, tipo de serviço, data de entrada/retorno, custo e observações detalhadas.
  - Histórico de manutenções por veículo/placa e visualização consolidada em painel geral.
- **Reemissão de 2ª Via do PDF Oficial**: Geração instantânea do PDF oficial em 1 página A4 padronizado.
- **Exportação de Dados**: Download em CSV compatível com Microsoft Excel.
- **Conexão Direta com Supabase**: Sincronização ao vivo com o banco de dados oficial.

---

## 💻 Executando Localmente
```bash
node server.js
```
Acesse em: `http://localhost:3001`

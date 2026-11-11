# TASK-13: Painel Web: Dashboard com Métricas e Módulo Financeiro

## 1. Descrição
Implementação da tela principal do painel web (Dashboard com KPIs operacionais e gráficos) e da tela completa de gestão financeira (faturamento, despesas e pagamentos pendentes).

## 2. Requisitos Atendidos
* [RF01] Painel de Indicadores (Dashboard).
* [RF08] Controle Financeiro.
* [RF12] Central de Notificações.

## 3. Escopo Técnico
* Tela Dashboard (`/dashboard`):
  * Cards de métricas: Serviços hoje (com destaque para em andamento), Serviços na semana, Faturamento do mês (com % vs mês anterior) e Lucro do mês.
  * Tabela de "Próximos serviços do dia" com acesso direto ao atendimento.
  * Gráfico de linhas ou barras (Recharts / Chart.js) exibindo evolução financeira mensal.
  * Box de "Avisos Importantes" (serviços sem diarista, pagamentos pendentes).
* Tela Financeira (`/financeiro`):
  * Resumo mensal consolidado e filtro de competência (mês/ano).
  * Tabela de transações com filtros por tipo (`RECEITA`, `DESPESA`, `REPASSE`) e status (`PENDENTE`, `CONFIRMADO`).
  * Modal para lançamento manual de despesas operacionais ou administrativas.
  * Botão de "Baixar Pagamento" para confirmar quitação de clientes pendentes.
* Componente de Notificações no Header:
  * Badge com contador de pendências em tempo real.
  * Dropdown com atalhos para os atendimentos com alerta.

## 4. Critérios de Aceitação
* Os indicadores refletem com precisão os dados cadastrados no PostgreSQL.
* O cálculo do lucro do mês bate rigorosamente com a diferença entre faturamento e custos.
* O fluxo de confirmação de pagamentos atualiza os indicadores sem recarregar a tela.

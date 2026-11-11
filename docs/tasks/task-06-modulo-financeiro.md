# TASK-06: Módulo Financeiro e Conciliação de Atendimentos

## 1. Descrição
Implementação dos modelos, migrações e serviços para controle de receitas, despesas administrativas, repasses de diaristas, apuração de lucro líquido e gestão de pagamentos pendentes.

## 2. Requisitos Atendidos
* [RF08] Controle Financeiro.
* [RN-FIN-01] Fechamento e Lucro.

## 3. Escopo Técnico
* Migration e Model `FinancialTransaction`:
  * `id`, `appointment_id` (FK opcional), `type` (enum: `RECEITA`, `DESPESA_OPERACIONAL`, `DESPESA_ADMINISTRATIVA`, `REPASSE_DIARISTA`), `category`, `description`, `amount` (decimal), `status` (enum: `PENDENTE`, `CONFIRMADO`), `payment_method`, `due_date`, `paid_at`, `timestamps`.
* `FinancialService`:
  * `getMonthlySummary(year, month)`: consolida faturamento bruto, total de despesas, repasses e lucro líquido, além de variação percentual frente ao mês anterior.
  * `getPendingPayments()`: lista atendimentos finalizados cujo pagamento pelo cliente ainda não foi confirmado.
* Endpoints REST:
  * `GET /api/v1/financial/summary`: resumo mensal e comparativos.
  * `GET /api/v1/financial/transactions`: listagem paginada com filtros por período e status.
  * `POST /api/v1/financial/transactions`: lançamento avulso de despesa/receita.
  * `PATCH /api/v1/financial/transactions/:id/confirm`: baixa de pagamento pendente.

## 4. Critérios de Aceitação
* Fórmulas financeiras refletem corretamente o lucro líquido da empresa.
* Alerta de pagamentos pendentes retorna todos os itens em atraso ou não confirmados.

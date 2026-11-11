# TASK-14: Módulo de Relatórios Consolidados e Exportação PDF/Excel

## 1. Descrição
Implementação da área de inteligência e emissão de relatórios consolidados da operação, permitindo exportar dados em formatos portáteis (PDF e XLSX).

## 2. Requisitos Atendidos
* [RF11] Relatórios Operacionais e Financeiros.

## 3. Escopo Técnico
* Tela de Relatórios no Web SPA (`/relatorios`):
  * Seletores de tipo de relatório:
    1. Relatório de Atendimentos (por período, status e cliente).
    2. Relatório Financeiro (receitas, custos, despesas e margem).
    3. Relatório de Produtividade das Diaristas (total de horas, atendimentos e nota média).
  * Filtro de intervalo de datas (Data Inicial / Data Final).
  * Tabela prévia com paginação.
* Exportação:
  * Exportação para planilha Excel (`.xlsx`) via biblioteca frontend (ex.: `xlsx` / `exceljs`).
  * Geração e download de relatório formatado para impressão em PDF (`jspdf` / `@react-pdf/renderer` ou gerado via backend).

## 4. Critérios de Aceitação
* Relatórios filtram corretamente por período customizado.
* Arquivos PDF e Excel gerados contêm cabeçalho com logo da RO Organização, data de emissão e totais calculados.

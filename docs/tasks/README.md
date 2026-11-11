# Roadmap de Desenvolvimento e Matriz de Paralelismo: Organiza+

> [!IMPORTANT]
> **DIRETRIZ DE ENGENHARIA MANDATÓRIA (TDD):**  
> Todas as tarefas abaixo devem ser executadas obrigatoriamente seguindo o ciclo **TDD (Test-Driven Development: Red-Green-Refactor)**. Nenhuma implementação de regra de negócio, validação, componente ou endpoint deve ser entregue sem os testes correspondentes (unitários ou funcionais). Consulte o documento [`docs/product/product_DIRETRIZES-DE-TESTES-E-TDD.md`](../product/product_DIRETRIZES-DE-TESTES-E-TDD.md).

Este documento apresenta a decomposição técnica do sistema **Organiza+** em tarefas atômicas e rastreáveis para execução pela equipe de engenharia.

---

## 👥 Estratégia de Desenvolvimento e Paralelismo

A arquitetura com backend modular em **AdonisJS v6** e separação de clientes frontend (**Web SPA** e **Mobile App**) permite que três trilhas de desenvolvimento atuem de forma concorrente e desacoplada:

```
                                  ┌────────────────────────┐
                                  │ Task 01: Fundação & BD │
                                  │ AdonisJS + PostgreSQL  │
                                  └───────────┬────────────┘
                                              │
                      ┌───────────────────────┼───────────────────────┐
                      ▼                       ▼                       ▼
            ┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
            │ Trilha A: Backend │   │  Trilha B: Web    │   │ Trilha C: Mobile  │
            │   Regras & APIs   │   │  Painel & Dash    │   │  App Diarista/IA  │
            ├───────────────────┤   ├───────────────────┤   ├───────────────────┤
            │ Task 02: Clientes │   │ Task 08: Base Web │   │ Task 10: Base App │
            │ & Diaristas       │   │ & Layout Admin    │   │ React Native      │
            │                   │   │                   │   │                   │
            │ Task 03: Motor    │   │ Task 09: Gestão & │   │ Task 11: Visão da │
            │ de Agenda         │   │ Calendário Web    │   │ Diarista (Campo)  │
            │                   │   │                   │   │                   │
            │ Task 04: Ciclo    │   │ Task 13: Dash BI  │   │ Task 12: Chat IA  │
            │ de Atendimentos   │   │ & Financeiro      │   │ Administradora    │
            │                   │   │                   │   │                   │
            │ Task 05: Módulo   │   │                   │   │                   │
            │ de IA & LLM       │   │                   │   │                   │
            └─────────┬─────────┘   └─────────┬─────────┘   └─────────┬─────────┘
                      │                       │                       │
                      └───────────────────────┼───────────────────────┘
                                              ▼
                                 ┌─────────────────────────┐
                                 │ Integração & Finalização│
                                 ├─────────────────────────┤
                                 │ Task 06: Financeiro     │
                                 │ Task 07: WhatsApp links │
                                 │ Task 14: Relatórios PDF │
                                 │ Task 15: Seed & Deploy  │
                                 └─────────────────────────┘
```

---

## 📋 Matriz Geral de Tarefas

| ID | Task | Trilha / Escopo | Dependências |
| :--- | :--- | :--- | :--- |
| **TASK-01** | [Fundação do Backend AdonisJS v6, Auth Guard e PostgreSQL](./task-01-fundacao-backend-auth-db.md) | Backend & Infra | Nenhuma |
| **TASK-02** | [Módulo de Clientes e Diaristas (Models, Migrations e CRUD)](./task-02-modulo-clientes-e-diaristas.md) | Trilha A: Backend | TASK-01 |
| **TASK-03** | [Motor de Agenda e Prevenção de Conflitos](./task-03-motor-agenda-e-conflitos.md) | Trilha A: Backend | TASK-02 |
| **TASK-04** | [Ciclo de Atendimento, Máquina de Estados e Avaliações](./task-04-ciclo-atendimento-e-avaliacoes.md) | Trilha A: Backend | TASK-03 |
| **TASK-05** | [Engine de IA: Parsing de Mensagens, LLM e Slot-Filling](./task-05-engine-ia-chat-operacional.md) | Trilha A: Backend | TASK-04 |
| **TASK-06** | [Módulo Financeiro e Conciliação de Atendimentos](./task-06-modulo-financeiro.md) | Trilha A: Backend | TASK-04 |
| **TASK-07** | [Geração de Atalhos e Templates WhatsApp (wa.me)](./task-07-integracao-whatsapp-shortcuts.md) | Trilha A: Backend | TASK-02 |
| **TASK-08** | [Fundação Frontend Web (React + Vite + Tailwind + Auth)](./task-08-frontend-web-base-e-layout.md) | Trilha B: Web | TASK-01 |
| **TASK-09** | [Painel Web: Telas de Clientes, Diaristas e Calendário](./task-09-painel-web-cadastros-e-agenda.md) | Trilha B: Web | TASK-03, TASK-08 |
| **TASK-10** | [Fundação App Mobile React Native (Expo, Auth e RBAC)](./task-10-mobile-app-fundacao-expo.md) | Trilha C: Mobile | TASK-01 |
| **TASK-11** | [Mobile Diarista: Escala, Detalhes e Início/Fim do Serviço](./task-11-mobile-visao-diarista.md) | Trilha C: Mobile | TASK-04, TASK-10 |
| **TASK-12** | [Mobile Admin: Interface de Chat Operacional com Assistente IA](./task-12-mobile-chat-ia-admin.md) | Trilha C: Mobile | TASK-05, TASK-10 |
| **TASK-13** | [Painel Web: Dashboard com Métricas e Módulo Financeiro](./task-13-painel-web-dashboard-financeiro.md) | Trilha B: Web | TASK-06, TASK-08 |
| **TASK-14** | [Módulo de Relatórios Consolidados e Exportação PDF/Excel](./task-14-relatorios-e-exportacao.md) | Trilha A/B: Web | TASK-06, TASK-09 |
| **TASK-15** | [Seeders Iniciais de Teste, Mock de Dados e Deploy Docker](./task-15-seeders-mock-e-docker.md) | Infra / Final | TASK-01 a 14 |

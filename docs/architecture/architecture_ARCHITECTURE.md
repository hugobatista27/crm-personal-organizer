# Arquitetura do Sistema: Organiza+

## 1. Visão Geral e Propósito

O **Organiza+** é uma solução de gestão e automação operacional para empresas de diaristas e organização profissional (*Personal Organizer*). A solução atende a dois perfis principais de usuários:
1. **Administradora:** opera a retaguarda, financeiro, clientes e agenda através de um **Painel Web SPA (React + Vite + Tailwind CSS)** e de um **App Mobile (React Native / Expo)** dotado de um **Assistente Operacional por Chat com IA**.
2. **Diaristas:** utilizam o **App Mobile (React Native / Expo)** para consultar escalas de trabalho, rotas/endereços, aceitar atendimentos e registrar início/fim do serviço em tempo real.

O backend é construído em **AdonisJS v6** com **TypeScript**, utilizando o **Lucid ORM** conectado a uma base relacional **PostgreSQL**.

---

## 2. Diagrama de Arquitetura e Fluxo de Dados

```
                      ┌───────────────────────────────────────────────┐
                      │             Clientes Finais (WhatsApp)        │
                      └──────────────────────▲────────────────────────┘
                                             │ (Links wa.me)
     ┌───────────────────────────────────────┴───────────────────────────────────────┐
     │                                                                               │
     ▼                                                                               ▼
┌───────────────────────────────┐                               ┌────────────────────────────────┐
│      Painel Web (Admin)       │                               │     App Mobile (Admin/Staff)   │
│   React + Vite + Tailwind     │                               │      React Native / Expo       │
│                               │                               │                                │
│ • Dashboard Analítico         │                               │ • Visão Diarista: Escalas &    │
│ • Gestão de Clientes/Diaristas│                               │   Check-in/Check-out           │
│ • Calendário e Grid de Agenda │                               │ • Visão Admin: Gestão Rápida & │
│ • Financeiro & Relatórios     │                               │   Chat Operacional com IA      │
└───────────────┬───────────────┘                               └───────────────┬────────────────┘
                │                                                               │
                │ REST JSON (Bearer JWT / Access Tokens)                        │ REST JSON
                └───────────────────────────────┬───────────────────────────────┘
                                                │
                                                ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    AdonisJS v6 Monolith API                                    │
│                                                                                                │
│   ┌──────────────────────────┐  ┌──────────────────────────┐  ┌───────────────────────────┐    │
│   │        Auth & RBAC       │  │     ClientStaffModule    │  │     SchedulingModule      │    │
│   │                          │  │                          │  │                           │    │
│   │ • JWT Tokens / Guard     │  │ • CRUD Clientes          │  │ • Agenda (Dia, Sem, Mês)  │    │
│   │ • Roles: Admin, Diarista │  │ • CRUD Diaristas/Skills  │  │ • Validação de Conflitos  │    │
│   └─────────────┬────────────┘  └────────────┬─────────────┘  └─────────────┬─────────────┘    │
│                 │                            │                              │                  │
│   ┌─────────────┴────────────┐  ┌────────────┴─────────────┐  ┌─────────────┴─────────────┐    │
│   │     OrderEngineModule    │  │      FinancialModule     │  │        AiChatModule       │    │
│   │                          │  │                          │  │                           │    │
│   │ • Ciclo do Atendimento   │  │ • Faturamento & Despesas │  │ • LLM Parser & Extraction │    │
│   │ • Linha do Tempo/Status  │  │ • Conciliação & Lucro    │  │ • Slot-Filling & Validação│    │
│   │ • Avaliações 1 a 5 ⭐     │  │ • Alertas de Pendências  │  │ • Integração OpenAI/Claude│    │
│   └─────────────┬────────────┘  └────────────┬─────────────┘  └─────────────┬─────────────┘    │
│                 │                            │                              │                  │
│                 └────────────────────────────┼──────────────────────────────┘                  │
│                                              ▼                                                 │
│                                 Lucid ORM / Database Layer                                     │
│                                              │                                                 │
│                                              ▼                                                 │
│                                     PostgreSQL Database                                        │
└────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Módulos do Backend (Deep Modules)

O backend segue a modularização por responsabilidades bem definidas, facilitando testes isolados e manutenibilidade:

1. **Auth & RBAC (`src/modules/auth`)**:
   * Autenticação via AdonisJS Auth Guard (tokens Bearer).
   * Controle de acesso baseado em papéis (`ADMIN`, `DIARISTA`).
2. **ClientStaffModule (`src/modules/client_staff`)**:
   * Gerenciamento de clientes (endereços georreferenciados, histórico).
   * Gerenciamento de diaristas (especialidades, notas médias, status de disponibilidade).
3. **SchedulingModule (`src/modules/scheduling`)**:
   * Motor de agenda (vistas de dia, semana e mês).
   * Algoritmo de checagem e prevenção de sobreposição de horários de diaristas.
4. **OrderEngineModule (`src/modules/order_engine`)**:
   * Máquina de estados dos atendimentos (`SOLICITADO` ➔ `FINALIZADO`).
   * Rastreio de auditoria temporal em cada mudança de etapa.
   * Registro e computação de avaliações de desempenho.
5. **FinancialModule (`src/modules/financial`)**:
   * Registro de receitas, repasses de diaristas e despesas operacionais.
   * Consolidação de métricas financeiras (Faturamento, Custos, Lucro Líquido).
6. **AiChatModule (`src/modules/ai_chat`)**:
   * Pipeline de ingestão de comandos em texto natural.
   * Chamadas de LLM com Prompt Engineering estruturado (JSON Schema / Structured Outputs).
   * Diálogo interativo para preenchimento de lacunas (*slot-filling*).

---

## 4. Estratégia de Clientes e Frontend

* **Web SPA (Admin):** Desenvolvido em **React + Vite + Tailwind CSS**. Utiliza bibliotecas como `@tanstack/react-query` para cache e sincronização de dados e `@tanstack/react-table` para listagens avançadas.
* **Mobile (Admin & Diarista):** Desenvolvido em **React Native com Expo**. Interface limpa, com navegação baseada em papéis:
  * Tela de diarista focada em cards de compromissos claros, botões largos de ação (*Iniciar* e *Finalizar*) e links de navegação para mapas.
  * Tela de administradora com visão rápida do dia e aba de **Chat de IA** com interface conversacional amigável.

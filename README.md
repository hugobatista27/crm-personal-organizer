# Organiza+ — Sistema de Gestão & CRM Operacional

Sistema completo de gestão operacional e financeira para empresas de diaristas e organização profissional (*Personal Organizer*), desenvolvido para a **RO Organização de Casas e Espaços**.

O projeto é composto por três aplicações integradas através de uma API REST central:
1. **`backend/`**: API RESTful monolítica desenvolvida em **AdonisJS v6 (TypeScript)** com **Lucid ORM** e banco de dados **PostgreSQL**.
2. **`frontend-web/`**: Painel administrativo web em **React + Vite + Tailwind CSS + shadcn/ui** para a Administradora (dashboards, calendário com prevenção de conflitos, gestão de clientes/diaristas e relatórios).
3. **`mobile-app/`**: Aplicativo móvel em **React Native com Expo** bifurcado por papel:
   * **Diaristas:** Acompanhamento de escalas, endereço com GPS (Waze/Google Maps) e registro de início e término dos serviços.
   * **Administradora:** Chat com Assistente de IA que processa comandos em linguagem natural livre, extrai entidades e pré-preenche agendamentos via confirmação em 1 clique.

---

## 📚 Documentação Técnica do Projeto

Toda a especificação de engenharia, arquitetura e produto está documentada no diretório [`docs/`](./docs):

* **[Arquitetura do Sistema](./docs/architecture/architecture_ARCHITECTURE.md):** Diagrama macro, módulos do backend (*Deep Modules*) e fluxo de dados.
* **[Modelagem Relacional do PostgreSQL](./docs/database/database_MODELO-RELACIONAL.md):** Diagrama ERD, dicionário de dados (14 tabelas), triggers e índices.
* **[Decisões Arquiteturais (ADRs)](./docs/adr/):**
  * [ADR-001: Backend em AdonisJS v6 + PostgreSQL](./docs/adr/adr_ADR-001-backend-adonisjs-postgresql.md)
  * [ADR-002: Separação em Web SPA e Mobile React Native](./docs/adr/adr_ADR-002-separacao-web-spa-e-mobile-react-native.md)
  * [ADR-003: Assistente Operacional por LLM com Slot-Filling](./docs/adr/adr_ADR-003-assistente-ia-chat-operacional-llm.md)
* **[Regras de Negócio](./docs/product/product_REGRAS-DE-NEGOCIO.md):** Ciclo de vida dos atendimentos, validações de conflito e regras de campo.
* **[Diretrizes de Testes & TDD Obrigatório](./docs/product/product_DIRETRIZES-DE-TESTES-E-TDD.md):** Política mandatória de testes rígidos e ciclo Red-Green-Refactor.
* **[Backlog e Matriz de Paralelismo](./docs/tasks/README.md):** 15 tarefas atômicas para execução paralela.

---

## 🛠️ Pré-requisitos de Instalação

* **Node.js:** Versão 20 LTS ou superior (recomendado Node 22/24).
* **NPM:** Versão 10+.
* **PostgreSQL:** Versão 14 ou superior (local ou via Docker).
* **Git.**

---

## 🚀 Instalação e Configuração Passo a Passo

Clone o repositório e configure cada aplicação:

### 1. Backend (`backend/`)

```bash
cd backend

# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env

# 3. Gerar a chave criptográfica da aplicação
node ace generate:key

# 4. Configurar as credenciais do PostgreSQL no arquivo .env:
# DB_HOST=127.0.0.1
# DB_PORT=5432
# DB_USER=postgres
# DB_PASSWORD=sua_senha
# DB_DATABASE=organiza_plus

# 5. Executar as migrações do banco
node ace migration:run

# 6. Rodar os testes automatizados
npm test

# 7. Iniciar o servidor de desenvolvimento
npm run dev
```

A API estará disponível em `http://localhost:3333`.

### 2. Frontend Web (`frontend-web/`)

```bash
cd frontend-web

# 1. Instalar dependências
npm install

# 2. Executar os testes unitários (Vitest)
npm test

# 3. Iniciar o servidor de desenvolvimento Vite
npm run dev
```

O painel administrativo estará acessível em `http://localhost:5173`.

### 3. Mobile App (`mobile-app/`)

```bash
cd mobile-app

# 1. Instalar dependências
npm install --legacy-peer-deps

# 2. Executar os testes automatizados (Jest)
npm test

# 3. Iniciar o servidor Expo Metro Bundler
npm start
```

Use o app **Expo Go** no smartphone Android/iOS para escanear o QR Code gerado, ou pressione `a` para abrir no emulador Android ou `i` para o simulador iOS.

---

## 🧪 Política de Qualidade e Execução de Testes (TDD Obrigatório)

Neste projeto, **escrever e rodar os testes antes e durante a implementação é estritamente obrigatório**.

Para verificar a integridade de todas as suítes:

```bash
# Backend (Japa / AdonisJS)
cd backend && npm test

# Frontend Web (Vitest + Testing Library)
cd frontend-web && npm test

# Mobile App (Jest + ts-jest)
cd mobile-app && npm test
```

---

## 🤖 Como Desenvolver Cada Task Utilizando LLM / Agentes de IA

Para desenvolver as tarefas do roadmap ([`docs/tasks/`](./docs/tasks/)) utilizando assistentes ou agentes de IA (Antigravity, Cursor, Claude Code, Copilot, ChatGPT, etc.), siga o fluxo padronizado abaixo para garantir alinhamento com as regras de negócio e respeito ao TDD.

### 📋 Passo 1: Selecionar a Task no Backlog
Consulte a matriz de paralelismo em [`docs/tasks/README.md`](./docs/tasks/README.md) e escolha a task desejada (ex.: `TASK-03: Motor de Agenda e Prevenção de Conflitos`).

### 💬 Passo 2: Estrutura do Prompt de Inicialização da Task
Ao instruir o agente de IA, forneça sempre o contexto específico da task, o modelo de banco e a regra de TDD. Use o seguinte template de prompt:

```text
Olá! Vamos desenvolver a TASK-XX: [Nome da Task].

Arquivos de Contexto Obrigatórios:
- Leia a especificação da tarefa em: docs/tasks/task-XX-[nome-da-task].md
- Leia as regras de negócio em: docs/product/product_REGRAS-DE-NEGOCIO.md
- Leia a modelagem do banco em: docs/database/database_MODELO-RELACIONAL.md
- Leia as diretrizes de TDD em: docs/product/product_DIRETRIZES-DE-TESTES-E-TDD.md

Diretrizes Obrigatórias:
1. Metodologia TDD estrita:
   - Primeiro, escreva os testes automatizados (unitários/funcionais) para a funcionalidade.
   - Execute a suíte de testes e mostre que ela falhou (Red).
   - Implemente o código mínimo necessário até que os testes passem (Green).
   - Refatore o código garantindo manutenibilidade e tipagem TypeScript estrita (Refactor).
2. Não altere o escopo ou os nomes de colunas definidos na modelagem do banco.
3. Ao finalizar, rode a suíte completa de testes e confirme que 100% dos testes estão passando.
```

### 🔄 Passo 3: O Ciclo de Desenvolvimento com a LLM
1. **Fase Red:**
   * Peça à IA: *"Crie o arquivo de teste `tests/.../nome.spec.ts` cobrindo os cenários descritos na task e execute o comando de teste."*
   * Valide se o teste falha exatamente porque a classe, método ou endpoint ainda não existe.
2. **Fase Green:**
   * Peça à IA: *"Agora implemente os models, migrations, services ou componentes necessários para fazer o teste passar."*
   * Execute os testes novamente até obter aprovação verde.
3. **Fase Refactor:**
   * Peça à IA: *"Refatore o código criado para remover repetições, adicionar tipagens estritas do TypeScript e garantir tratamento de exceções amigável."*
   * Confirme que os testes continuam passando.

### 📦 Passo 4: Commit Padronizado
Após todos os testes passarem, solicite à IA a geração do commit no padrão Conventional Commits:

```bash
git add .
git commit -m "feat(modulo): implementar [descricao da task] (TASK-XX)"
```

---

## 📄 Licença e Propriedade

Projeto desenvolvido para a **RO Organização de Casas e Espaços**. Todos os direitos reservados.

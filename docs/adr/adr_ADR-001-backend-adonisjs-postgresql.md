# ADR-001: Backend em AdonisJS v6 com PostgreSQL e Arquitetura Modular

* **Status:** Aprovado
* **Data:** 2026-11-11
* **Contexto:** Necessidade de construir um backend TypeScript robusto, fortemente tipado, com ORM maduro e segurança integrada para suportar múltiplos clientes (Web SPA e Mobile App).

---

## 1. Contexto e Problema

O sistema **Organiza+** gerencia o fluxo de trabalho crítico de uma empresa de serviços (clientes, diaristas, agendamentos com validação de concorrência, financeiro e logs de auditoria). Precisamos de um framework backend que proporcione:
1. Produtividade acelerada com convenções claras (migrations, seeders, autenticação pronta).
2. TypeScript nativo de ponta a ponta.
3. ORM relacional confiável com suporte a transações e chaves estrangeiras sólidas.
4. Estrutura capaz de suportar tanto Web SPA quanto App Mobile via endpoints REST padronizados.

## 2. Decisão

Adotamos **AdonisJS v6** utilizando **PostgreSQL** como banco de dados através do **Lucid ORM**.

### Justificativas:
* **AdonisJS v6:** Oferece arquitetura madura inspirada em frameworks modernos (IoC container, injeção de dependências, guards de autenticação oficiais com tokens, validação integrada via VineJS).
* **PostgreSQL:** Suporte impecável a constraints de integridade, índices temporais para detecção de conflitos de horário na agenda e tipos JSONB para histórico de auditoria e payloads do chat de IA.
* **API REST Stateless:** Desacopla o backend tanto do Web SPA quanto do App Mobile React Native, permitindo desenvolvimento e deploy independentes.

## 3. Consequências

### Positivas:
* Base de código padronizada e manutenível.
* Tipagem estrita de modelos e consultas via Lucid ORM.
* Facilidade para criar testes automatizados de integração e de regras de negócio.

### Negativas / Mitigações:
* Requer gerenciamento explícito de migrações em ambiente de produção (mitigado via scripts de CI/CD automatizados).

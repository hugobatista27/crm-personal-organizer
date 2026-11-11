# TASK-15: Seeders Iniciais de Teste, Mock de Dados e Deploy Docker

## 1. Descrição
Criação dos seeders do AdonisJS com conjunto realista de dados para desenvolvimento, testes de carga e containerização completa do ambiente através de Docker e Docker Compose.

## 2. Requisitos Atendidos
* [RNF01, RNF02, RNF04] Infraestrutura, portabilidade e performance.

## 3. Escopo Técnico
* Seeders no AdonisJS (`database/seeders`):
  * Usuários padrão: Administradora (`admin@organizamais.com.br`) e Diaristas (`maria@organizamais.com.br`, etc.).
  * Catálogo de 5 tipos de serviço (Limpeza residencial, Limpeza pós-obra, Passadoria, etc.).
  * Cadastro de 10 clientes com endereços e telefones válidos.
  * Cadastro de 5 diaristas com especialidades, fotos e avaliações históricas.
  * Agendamentos passados, presentes e futuros nos diversos estados do fluxo.
  * Transações financeiras com receitas e despesas para alimentar o dashboard.
* Containerização:
  * `Dockerfile` para o backend AdonisJS v6 (multi-stage build com Node 20 LTS).
  * `Dockerfile` para o Web SPA React/Vite (servido via Nginx).
  * `docker-compose.yml` orquestrando:
    * `postgres`: PostgreSQL 16 com volume persistente.
    * `backend`: AdonisJS API conectado ao Postgres.
    * `web`: Frontend Web Nginx com proxy reverso.

## 4. Critérios de Aceitação
* Comando `docker compose up -d` sobe todo o ecossistema com banco de dados pronto e migrations executadas.
* Comando `node ace db:seed` popula o banco com dados demonstrativos completos e consistentes.

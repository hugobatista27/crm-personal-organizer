# TASK-01: Fundação do Backend AdonisJS v6, Auth Guard e PostgreSQL

## 1. Descrição
Configuração inicial do projeto backend em AdonisJS v6 com TypeScript, conexão com banco relacional PostgreSQL, estrutura de migrações e sistema de autenticação via API tokens para suporte a múltiplos papéis de usuários (Administradora e Diarista).

## 2. Requisitos Atendidos
* [RNF01] Segurança e conformidade LGPD.
* [RNF02] Disponibilidade e integridade estrutural.

## 3. Escopo Técnico
* Inicializar projeto AdonisJS v6 (`@adonisjs/core`, `@adonisjs/lucid`, `@adonisjs/auth`).
* Configurar conexão com PostgreSQL (`pg`) em `config/database.ts`.
* Configurar autenticação baseada em tokens de acesso (Bearer tokens) via `@adonisjs/auth/access_tokens`.
* Criar migration e model `User`:
  * `id` (UUID ou BigInt)
  * `nome` (string)
  * `email` (string, unique)
  * `password` (hash Argon2/Bcrypt)
  * `role` (enum: `ADMIN`, `DIARISTA`)
  * `ativo` (boolean)
  * `timestamps`
* Criar middleware de RBAC (`RoleMiddleware`) para proteger rotas por perfil.
* Seed de um usuário administrador padrão para testes locais.

## 4. Critérios de Aceitação
* Migrations executam com sucesso no PostgreSQL (`node ace migration:run`).
* Endpoint `POST /api/v1/auth/login` valida credenciais e retorna access token.
* Endpoint protegido `GET /api/v1/auth/me` retorna os dados do usuário autenticado e seu perfil.

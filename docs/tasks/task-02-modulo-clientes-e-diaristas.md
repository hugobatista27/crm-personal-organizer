# TASK-02: Módulo de Clientes e Diaristas (Models, Migrations e CRUD)

## 1. Descrição
Implementação dos modelos relacionais, migrações e endpoints da API para gestão de clientes e diaristas no sistema.

## 2. Requisitos Atendidos
* [RF02] Cadastro e Consulta de Clientes.
* [RF03] Cadastro e Listagem de Diaristas.
* [RF04] Perfil da Diarista.

## 3. Escopo Técnico
* Migration e Model `Client`:
  * `id`, `name`, `phone` (com DDD e máscara), `street`, `number`, `complement`, `neighborhood`, `city`, `state`, `zip_code`, `latitude`, `longitude`, `notes`, `timestamps`.
* Migration e Model `Diarista`:
  * `id`, `user_id` (FK opcional para login no app), `name`, `phone`, `photo_url`, `specialties` (array ou tabela pivot), `status` (enum: `ATIVA`, `EM_SERVICO`, `INATIVA`), `average_rating` (decimal), `notes`, `timestamps`.
* Migration e Model `ServiceType`:
  * `id`, `name`, `description`, `reference_price`, `active`, `timestamps`.
* Controladores e Rotas REST:
  * `ClientController`: CRUD completo com busca por nome/telefone e filtros.
  * `DiaristaController`: CRUD completo com listagem por status, busca e especialidades.
  * `ServiceTypeController`: Listagem e manutenção dos tipos de serviço.
* Validações de entrada com VineJS (`createClientValidator`, `createDiaristaValidator`).

## 4. Critérios de Aceitação
* Validação de unicidade de telefone de cliente.
* Listagem de diaristas exibe status, especialidades e média de avaliações.
* Endpoints respondem com paginação e busca textual rápida.

# TASK-04: Ciclo de Atendimento, Máquina de Estados e Avaliações

## 1. Descrição
Implementação da máquina de estados finitos do atendimento (da solicitação inicial até a finalização), trilha de auditoria para cada mudança de status e sistema de avaliação de qualidade pós-serviço.

## 2. Requisitos Atendidos
* [RF06] Abertura e Acompanhamento de Atendimentos.
* [RF10] Avaliação da Diarista por Atendimento.
* [RN-AT-01] Sequenciamento Obrigatório de Estados.
* [RNF05] Auditoria de Ações.

## 3. Escopo Técnico
* Tabela de histórico `AppointmentStatusHistory`:
  * `id`, `appointment_id` (FK), `from_status`, `to_status`, `changed_by_user_id` (FK), `notes`, `created_at`.
* Tabela de avaliação `AppointmentRating`:
  * `id`, `appointment_id` (FK, unique), `diarista_id` (FK), `rating` (smallint, 1 a 5), `comment` (text), `created_at`.
* `AppointmentStateMachine`:
  * Validador de transição legal:
    * `SOLICITADO` ➔ `ORCAMENTO_ENVIADO`
    * `ORCAMENTO_ENVIADO` ➔ `APROVADO`
    * `APROVADO` ➔ `AGENDADO`
    * `AGENDADO` ➔ `EM_ANDAMENTO`
    * `EM_ANDAMENTO` ➔ `FINALIZADO`
    * Qualquer estado (exceto `FINALIZADO`) ➔ `CANCELADO`.
* Atualização automática de status da diarista para `EM_SERVICO` quando o atendimento transicionar para `EM_ANDAMENTO`.
* Recálculo automático da média de avaliação da diarista ao salvar nova nota em `AppointmentRating`.

## 4. Critérios de Aceitação
* Tentativa de pular etapas sem atender aos pré-requisitos retorna erro de validação.
* Cada transição grava linha com timestamp e usuário responsável na tabela de histórico.
* Avaliação de 1 a 5 estrelas atualiza instantaneamente a média da diarista.

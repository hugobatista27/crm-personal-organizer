# TASK-03: Motor de Agenda e Prevenção de Conflitos

## 1. Descrição
Implementação do núcleo de agendamentos e calendário do sistema, com rotas especializadas para visualizações temporais (dia, semana, mês) e validação matemática de concorrência para impedir sobreposição de horários de diaristas.

## 2. Requisitos Atendidos
* [RF07] Visualização da Agenda.
* [RN-AT-02] Prevenção de Conflito de Horário de Diaristas.

## 3. Escopo Técnico
* Migration e Model `Appointment`:
  * `id`, `client_id` (FK), `diarista_id` (FK), `service_type_id` (FK), `date` (Date), `start_time` (Time), `end_time` (Time), `status` (Enum), `price` (Decimal), `diarista_payout` (Decimal), `notes` (Text), `timestamps`.
* `SchedulingService`:
  * Método `checkConflict(diaristaId, date, startTime, endTime, excludeAppointmentId?)`: verifica se já existe atendimento ativo da mesma diarista sobreposto na data/horário informado.
  * Método `getCalendarEvents(viewMode: 'day' | 'week' | 'month', dateReference: Date, filters?: { diaristaId, status })`.
* Endpoints de Agenda:
  * `GET /api/v1/agenda`: retorno agrupado para consumo em componentes de calendário.
  * `POST /api/v1/agenda/check-availability`: endpoint de checagem prévia rápida para a interface.

## 4. Critérios de Aceitação
* Tentativa de agendar a mesma diarista em horários coincidentes no mesmo dia retorna erro HTTP 422 com mensagem explicativa detalhada.
* Endpoint de agenda retorna os blocos formatados com cliente, diarista, endereço e status com cores sugeridas.

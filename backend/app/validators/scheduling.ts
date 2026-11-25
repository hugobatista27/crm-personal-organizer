import { Exception } from '@adonisjs/core/exceptions'
import { DateTime } from 'luxon'
import { SCHEDULE_ZONE, type ViewMode } from '#services/scheduling_service'
import { appointmentStatuses, type AppointmentStatus } from '#models/appointment'

type CalendarQuery = {
  view: ViewMode
  date: string
  diaristaId?: string
  status?: AppointmentStatus
}

type AvailabilityInput = {
  diaristaId: string
  date: string
  start: string
  end: string
  excludeId?: string
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const timePattern = /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/

function invalid(message: string): never {
  throw new Exception(message, { status: 422 })
}

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return invalid('Informe um objeto com os dados da agenda.')
  }
  return value as Record<string, unknown>
}

function date(value: unknown): string {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !DateTime.fromISO(value, { zone: SCHEDULE_ZONE }).isValid
  ) {
    return invalid('Informe uma data válida no formato AAAA-MM-DD.')
  }
  return value
}

function uuid(value: unknown, message: string): string {
  if (typeof value !== 'string' || !uuidPattern.test(value)) return invalid(message)
  return value
}

function optionalUuid(value: unknown, message: string): string | undefined {
  if (value === undefined) return undefined
  return uuid(value, message)
}

function time(value: unknown): string {
  if (typeof value !== 'string' || !timePattern.test(value)) {
    return invalid('Informe horários válidos no formato HH:MM:SS.')
  }
  return value
}

export function parseCalendarQuery(value: unknown): CalendarQuery {
  const input = record(value)
  const view = input.view ?? 'month'
  if (view !== 'day' && view !== 'week' && view !== 'month') {
    return invalid('Visualização deve ser day, week ou month.')
  }
  const dateValue = date(input.date ?? DateTime.now().setZone(SCHEDULE_ZONE).toISODate())
  const status = appointmentStatuses.find((candidate) => candidate === input.status)
  if (input.status !== undefined && !status) {
    return invalid('Status de agendamento inválido.')
  }
  return {
    view,
    date: dateValue,
    diaristaId: optionalUuid(input.diarista_id, 'Diarista inválida.'),
    status,
  }
}

export function parseAvailability(value: unknown): AvailabilityInput {
  const input = record(value)
  const diaristaId = uuid(input.diarista_id, 'Informe uma diarista válida.')
  const serviceDate = date(input.service_date)
  const start = time(input.start_time)
  const end = time(input.end_time)
  if (start >= end) {
    return invalid('Informe um intervalo válido: o horário final deve ser posterior ao inicial.')
  }
  return {
    diaristaId,
    date: serviceDate,
    start,
    end,
    excludeId: optionalUuid(input.exclude_appointment_id, 'Agendamento a excluir inválido.'),
  }
}

import db from '@adonisjs/lucid/services/db'
import { Exception } from '@adonisjs/core/exceptions'
import { DateTime } from 'luxon'
import type { AppointmentStatus } from '#models/appointment'

export type ViewMode = 'day' | 'week' | 'month'
export type CalendarFilters = { diaristaId?: string; status?: AppointmentStatus }
export const SCHEDULE_ZONE = 'America/Sao_Paulo'

export type ScheduleConflict = {
  id: string
  service_date: string
  start_time: string
  end_time: string
}

export type CalendarEvent = {
  id: string
  appointment_code: string
  service_date: string
  start_time: string
  end_time: string
  status: AppointmentStatus
  color: string
  client: { id: string; name: string }
  diarista: { id: string; name: string } | null
  diarista_id: string | null
  address: string
}

type CalendarRow = Omit<CalendarEvent, 'color' | 'client' | 'diarista' | 'address'> & {
  address_snapshot: string
  client_id: string
  client_name: string
  diarista_name: string | null
}

const statusColors: Record<AppointmentStatus, string> = {
  SOLICITADO: '#64748b',
  ORCAMENTO_ENVIADO: '#8b5cf6',
  APROVADO: '#3b82f6',
  AGENDADO: '#2563eb',
  EM_ANDAMENTO: '#f59e0b',
  FINALIZADO: '#16a34a',
  CANCELADO: '#ef4444',
}

export default class SchedulingService {
  async checkConflict(
    diaristaId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeAppointmentId?: string
  ): Promise<ScheduleConflict[]> {
    const query = db
      .query<ScheduleConflict>()
      .from('appointments')
      .where('diarista_id', diaristaId)
      .where('service_date', date)
      .whereNotIn('status', ['CANCELADO', 'SOLICITADO'])
      .where('start_time', '<', endTime)
      .where('end_time', '>', startTime)
      .select('id', 'service_date', 'start_time', 'end_time')
      .orderBy('start_time')

    if (excludeAppointmentId) query.whereNot('id', excludeAppointmentId)
    return query
  }

  async getCalendarEvents(
    viewMode: ViewMode,
    dateReference: Date,
    filters: CalendarFilters = {}
  ): Promise<Record<string, CalendarEvent[]>> {
    const reference = DateTime.fromJSDate(dateReference).setZone(SCHEDULE_ZONE)
    if (!reference.isValid) {
      throw new Exception('Data de referência inválida para a agenda.', { status: 422 })
    }
    const first = reference.startOf(viewMode)
    const last = reference.endOf(viewMode)
    const firstDate = first.toISODate()
    const lastDate = last.toISODate()
    if (!firstDate || !lastDate) {
      throw new Exception('Período de agenda inválido.', { status: 422 })
    }
    const query = db
      .query<CalendarRow>()
      .from('appointments as appointment')
      .join('clients as client', 'client.id', 'appointment.client_id')
      .leftJoin('diaristas as diarista', 'diarista.id', 'appointment.diarista_id')
      .whereBetween('appointment.service_date', [firstDate, lastDate])
      .select(
        'appointment.id',
        'appointment.appointment_code',
        'appointment.service_date',
        'appointment.start_time',
        'appointment.end_time',
        'appointment.status',
        'appointment.diarista_id',
        'appointment.address_snapshot',
        'client.id as client_id',
        'client.name as client_name',
        'diarista.name as diarista_name'
      )
      .orderBy('appointment.service_date')
      .orderBy('appointment.start_time')

    if (filters.diaristaId) query.where('appointment.diarista_id', filters.diaristaId)
    if (filters.status) query.where('appointment.status', filters.status)

    const rows = await query
    const grouped: Record<string, CalendarEvent[]> = {}
    for (const row of rows) {
      const event: CalendarEvent = {
        id: row.id,
        appointment_code: row.appointment_code,
        service_date: row.service_date,
        start_time: row.start_time,
        end_time: row.end_time,
        status: row.status,
        color: statusColors[row.status],
        client: { id: row.client_id, name: row.client_name },
        diarista: row.diarista_id ? { id: row.diarista_id, name: row.diarista_name ?? '' } : null,
        diarista_id: row.diarista_id,
        address: row.address_snapshot,
      }
      const day = (grouped[row.service_date] ??= [])
      day.push(event)
    }
    return grouped
  }
}

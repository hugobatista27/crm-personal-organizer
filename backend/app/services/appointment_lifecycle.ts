import { randomUUID } from 'node:crypto'
import { Exception } from '@adonisjs/core/exceptions'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { DateTime } from 'luxon'
import type { AppointmentStatus } from '#models/appointment'
import AppointmentStateMachine from '#services/appointment_state_machine'
import SchedulingService, { SCHEDULE_ZONE } from '#services/scheduling_service'
import type {
  createAppointmentValidator,
  rateAppointmentValidator,
  transitionAppointmentValidator,
} from '#validators/appointments'
import type { Infer } from '@vinejs/vine/types'

type NewAppointment = Infer<typeof createAppointmentValidator>
type Transition = Infer<typeof transitionAppointmentValidator>
type Rating = Infer<typeof rateAppointmentValidator>
export type Actor = { id: string; role: 'ADMIN' | 'DIARISTA' }
type AppointmentRow = {
  id: string
  status: AppointmentStatus
  diarista_id: string | null
  service_date: string | Date
  start_time: string
  end_time: string
}
type RatingRow = {
  id: string
  appointment_id: string
  diarista_id: string
  rating: number
  comment: string | null
  created_by_user_id: string
}
type AppointmentResult = { data: AppointmentRow }
type RatingResult = { data: RatingRow }

const machine = new AppointmentStateMachine()
const scheduling = new SchedulingService()
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function invalid(message: string): never {
  throw new Exception(message, { status: 422 })
}

function missing(): never {
  throw new Exception('Atendimento não encontrado.', { status: 404 })
}

function validateId(id: string): void {
  if (!uuidPattern.test(id)) invalid('Identificador de atendimento inválido.')
}

function validateSlot(date: string, start: string, end: string): void {
  if (!DateTime.fromISO(date, { zone: SCHEDULE_ZONE }).isValid) invalid('Data do serviço inválida.')
  if (start >= end) invalid('O horário final deve ser posterior ao inicial.')
}

function serviceDate(value: string | Date): string {
  return value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10)
}

function formatCode(id: string): string {
  return `RO-${id.replaceAll('-', '').slice(0, 16).toUpperCase()}`
}

function databaseCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('code' in error)) return undefined
  return typeof error.code === 'string' ? error.code : undefined
}

async function findAppointment(
  trx: TransactionClientContract,
  id: string,
  lock = false
): Promise<AppointmentRow> {
  const query = trx.query<AppointmentRow>().from('appointments').where('id', id)
  if (lock) query.forUpdate()
  return (await query.first()) ?? missing()
}

async function recordStatusChange(
  trx: TransactionClientContract,
  appointmentId: string,
  fromStatus: AppointmentStatus | null,
  toStatus: AppointmentStatus,
  actorId: string,
  reasonNotes?: string
): Promise<void> {
  await trx.table('appointment_status_history').insert({
    id: randomUUID(),
    appointment_id: appointmentId,
    from_status: fromStatus,
    to_status: toStatus,
    changed_by_user_id: actorId,
    reason_notes: reasonNotes ?? null,
  })
}

export async function createAppointment(
  input: NewAppointment,
  actor: Actor
): Promise<AppointmentResult> {
  validateSlot(input.service_date, input.start_time, input.end_time)
  const id = randomUUID()
  try {
    return await db.transaction(async (trx) => {
      const [row] = await trx
        .insertQuery<AppointmentRow>()
        .table('appointments')
        .insert({
          id,
          appointment_code: formatCode(id),
          client_id: input.client_id,
          diarista_id: input.diarista_id ?? null,
          service_type_id: input.service_type_id,
          service_date: input.service_date,
          start_time: input.start_time,
          end_time: input.end_time,
          schedule_range: db.raw("tstzrange(?::timestamptz, ?::timestamptz, '[)')", [
            `${input.service_date}T${input.start_time}-03:00`,
            `${input.service_date}T${input.end_time}-03:00`,
          ]),
          status: 'SOLICITADO',
          client_price: input.client_price,
          diarista_payout: input.diarista_payout,
          additional_costs: input.additional_costs ?? 0,
          address_snapshot: input.address_snapshot,
          observations: input.observations ?? null,
        })
        .returning('*')
      await recordStatusChange(trx, id, null, 'SOLICITADO', actor.id)
      return { data: row }
    })
  } catch (error) {
    const code = databaseCode(error)
    if (code === '23503') invalid('Cliente, diarista ou serviço informado não existe.')
    if (code === '23P01') invalid('Diarista já possui atendimento nesse horário.')
    throw error
  }
}

export async function changeAppointmentStatus(
  id: string,
  input: Transition,
  actor: Actor
): Promise<AppointmentResult> {
  validateId(id)
  try {
    return await db.transaction(async (trx) => {
      const appointment = await findAppointment(trx, id, true)
      if (actor.role === 'DIARISTA') {
        const own = await trx
          .query<{ id: string }>()
          .from('diaristas')
          .where({ id: appointment.diarista_id, user_id: actor.id })
          .first()
        if (!own || !['EM_ANDAMENTO', 'FINALIZADO'].includes(input.status)) {
          throw new Exception('Acesso negado para este perfil.', { status: 403 })
        }
      }
      if (!machine.canTransition(appointment.status, input.status)) {
        invalid(`Transição de ${appointment.status} para ${input.status} não permitida.`)
      }
      if (
        input.status === 'AGENDADO' &&
        (!appointment.diarista_id || !appointment.start_time || !appointment.end_time)
      ) {
        invalid('Informe uma diarista e horário antes de agendar.')
      }
      const scheduledDay = serviceDate(appointment.service_date)
      if (
        input.status === 'EM_ANDAMENTO' &&
        scheduledDay !== DateTime.now().setZone(SCHEDULE_ZONE).toISODate()
      ) {
        invalid('O atendimento só pode começar no dia agendado.')
      }
      const now = new Date()
      const [row] = await trx
        .query<AppointmentRow>()
        .from('appointments')
        .where('id', id)
        .update({
          status: input.status,
          updated_at: now,
          ...(input.status === 'EM_ANDAMENTO' && { started_at: now }),
          ...(input.status === 'FINALIZADO' && { finished_at: now }),
        })
        .returning('*')
      if (input.status === 'EM_ANDAMENTO' && appointment.diarista_id) {
        await trx
          .from('diaristas')
          .where('id', appointment.diarista_id)
          .update({ status: 'EM_SERVICO', updated_at: now })
      }
      await recordStatusChange(
        trx,
        id,
        appointment.status,
        input.status,
        actor.id,
        input.reason_notes
      )
      return { data: row }
    })
  } catch (error) {
    if (databaseCode(error) === '23P01') {
      const appointment = await db
        .query<AppointmentRow>()
        .from('appointments')
        .where('id', id)
        .first()
      if (appointment?.diarista_id) {
        const conflicts = await scheduling.checkConflict(
          appointment.diarista_id,
          serviceDate(appointment.service_date),
          appointment.start_time,
          appointment.end_time,
          id
        )
        const ranges = conflicts.map(({ start_time, end_time }) => `${start_time}–${end_time}`)
        invalid(`Horário em conflito com: ${ranges.join(', ') || 'outro atendimento'}.`)
      }
      invalid('Diarista já possui atendimento nesse horário.')
    }
    throw error
  }
}

export async function rateAppointment(
  id: string,
  input: Rating,
  actor: Actor
): Promise<RatingResult> {
  validateId(id)
  try {
    return await db.transaction(async (trx) => {
      const appointment = await findAppointment(trx, id)
      if (appointment.status !== 'FINALIZADO' || !appointment.diarista_id) {
        invalid('A avaliação só é permitida para atendimento finalizado com diarista.')
      }
      const existing = await trx
        .query<{ id: string }>()
        .from('appointment_ratings')
        .where('appointment_id', id)
        .first()
      if (existing) invalid('Este atendimento já possui avaliação.')
      const [row] = await trx
        .insertQuery<RatingRow>()
        .table('appointment_ratings')
        .insert({
          id: randomUUID(),
          appointment_id: id,
          diarista_id: appointment.diarista_id,
          rating: input.rating,
          comment: input.comment ?? null,
          created_by_user_id: actor.id,
        })
        .returning('*')
      return { data: row }
    })
  } catch (error) {
    if (databaseCode(error) === '23505') invalid('Este atendimento já possui avaliação.')
    throw error
  }
}

import { BaseModel, column } from '@adonisjs/lucid/orm'
import type { DateTime } from 'luxon'

export const appointmentStatuses = [
  'SOLICITADO',
  'ORCAMENTO_ENVIADO',
  'APROVADO',
  'AGENDADO',
  'EM_ANDAMENTO',
  'FINALIZADO',
  'CANCELADO',
] as const

export type AppointmentStatus = (typeof appointmentStatuses)[number]

export default class Appointment extends BaseModel {
  static table = 'appointments'

  @column({ isPrimary: true }) declare id: string
  @column() declare appointmentCode: string
  @column() declare clientId: string
  @column() declare diaristaId: string | null
  @column() declare serviceTypeId: string
  @column.date() declare serviceDate: DateTime
  @column() declare startTime: string
  @column() declare endTime: string
  @column() declare scheduleRange: string
  @column() declare status: AppointmentStatus
  @column() declare clientPrice: number
  @column() declare diaristaPayout: number
  @column() declare additionalCosts: number
  @column() declare addressSnapshot: string
  @column() declare observations: string | null
  @column.dateTime() declare confirmedByDiaristaAt: DateTime | null
  @column.dateTime() declare startedAt: DateTime | null
  @column.dateTime() declare finishedAt: DateTime | null
  @column() declare checkinLatitude: number | null
  @column() declare checkinLongitude: number | null
  @column() declare checkoutLatitude: number | null
  @column() declare checkoutLongitude: number | null
  @column.dateTime({ autoCreate: true }) declare createdAt: DateTime
  @column.dateTime({ autoCreate: true, autoUpdate: true }) declare updatedAt: DateTime
}

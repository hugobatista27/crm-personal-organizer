import { BaseModel, column } from '@adonisjs/lucid/orm'
import type { DateTime } from 'luxon'
import type { AppointmentStatus } from '#models/appointment'

export default class AppointmentStatusHistory extends BaseModel {
  static table = 'appointment_status_history'

  @column({ isPrimary: true }) declare id: string
  @column() declare appointmentId: string
  @column() declare fromStatus: AppointmentStatus | null
  @column() declare toStatus: AppointmentStatus
  @column() declare changedByUserId: string | null
  @column() declare reasonNotes: string | null
  @column.dateTime({ autoCreate: true }) declare createdAt: DateTime
}

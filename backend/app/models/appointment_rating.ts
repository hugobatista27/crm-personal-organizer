import { BaseModel, column } from '@adonisjs/lucid/orm'
import type { DateTime } from 'luxon'

export default class AppointmentRating extends BaseModel {
  static table = 'appointment_ratings'

  @column({ isPrimary: true }) declare id: string
  @column() declare appointmentId: string
  @column() declare diaristaId: string
  @column() declare rating: number
  @column() declare comment: string | null
  @column() declare createdByUserId: string
  @column.dateTime({ autoCreate: true }) declare createdAt: DateTime
}

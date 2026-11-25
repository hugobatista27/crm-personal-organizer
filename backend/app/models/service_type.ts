import { BaseModel, column } from '@adonisjs/lucid/orm'
import type { DateTime } from 'luxon'

export default class ServiceType extends BaseModel {
  static table = 'service_types'
  @column({ isPrimary: true }) declare id: string
  @column() declare name: string
  @column() declare description: string | null
  @column() declare referencePrice: number
  @column() declare defaultDuration: string
  @column() declare active: boolean
  @column.dateTime({ autoCreate: true }) declare createdAt: DateTime
  @column.dateTime({ autoCreate: true, autoUpdate: true }) declare updatedAt: DateTime
}

import { BaseModel, column } from '@adonisjs/lucid/orm'
import type { DateTime } from 'luxon'

export default class Client extends BaseModel {
  static table = 'clients'
  @column({ isPrimary: true }) declare id: string
  @column() declare name: string
  @column() declare phone: string
  @column() declare alternativePhone: string | null
  @column() declare email: string | null
  @column() declare street: string
  @column() declare number: string
  @column() declare complement: string | null
  @column() declare neighborhood: string
  @column() declare city: string
  @column() declare state: string
  @column() declare zipCode: string | null
  @column() declare latitude: number | null
  @column() declare longitude: number | null
  @column() declare notes: string | null
  @column.dateTime({ autoCreate: true }) declare createdAt: DateTime
  @column.dateTime({ autoCreate: true, autoUpdate: true }) declare updatedAt: DateTime
}

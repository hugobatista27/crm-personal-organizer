import { BaseModel, column } from '@adonisjs/lucid/orm'
import type { DateTime } from 'luxon'

export default class Diarista extends BaseModel {
  static table = 'diaristas'
  @column({ isPrimary: true }) declare id: string
  @column() declare userId: string | null
  @column() declare name: string
  @column() declare phone: string
  @column() declare documentCpf: string | null
  @column() declare photoUrl: string | null
  @column() declare status: 'ATIVA' | 'EM_SERVICO' | 'INATIVA'
  @column() declare averageRating: number
  @column() declare totalRatings: number
  @column() declare bioNotes: string | null
  @column.dateTime({ autoCreate: true }) declare createdAt: DateTime
  @column.dateTime({ autoCreate: true, autoUpdate: true }) declare updatedAt: DateTime
}

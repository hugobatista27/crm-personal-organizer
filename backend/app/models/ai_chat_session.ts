import { BaseModel, column } from '@adonisjs/lucid/orm'
import type { DateTime } from 'luxon'
import type { AppointmentSlots } from '#services/ai_service'

export default class AiChatSession extends BaseModel {
  static table = 'ai_chat_sessions'

  @column({ isPrimary: true }) declare id: string
  @column() declare userId: string
  @column() declare title: string | null
  @column() declare status: 'ACTIVE' | 'ARCHIVED'
  @column() declare sessionState: AppointmentSlots
  @column.dateTime({ autoCreate: true }) declare createdAt: DateTime
  @column.dateTime({ autoCreate: true, autoUpdate: true }) declare updatedAt: DateTime
}

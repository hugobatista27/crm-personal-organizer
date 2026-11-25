import { BaseModel, column } from '@adonisjs/lucid/orm'
import type { DateTime } from 'luxon'
import type { Extraction } from '#services/ai_service'

export default class AiChatMessage extends BaseModel {
  static table = 'ai_chat_messages'

  @column({ isPrimary: true }) declare id: string
  @column() declare sessionId: string
  @column() declare sender: 'USER' | 'ASSISTANT' | 'SYSTEM'
  @column() declare messageText: string
  @column() declare extractedEntities: Extraction | null
  @column() declare suggestedAction: Record<string, unknown> | null
  @column() declare resultingAppointmentId: string | null
  @column.dateTime({ autoCreate: true }) declare createdAt: DateTime
}

import { randomUUID } from 'node:crypto'
import app from '@adonisjs/core/services/app'
import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import AiService from '#services/ai_service'
import {
  assertActiveSession,
  assertCardMatches,
  buildSuggestedAction,
  mergeSlots,
  missingSlots,
  questionFor,
  type ChatSessionRow,
} from '#services/ai_chat_service'
import { createAppointment } from '#services/appointment_lifecycle'
import { chatMessageValidator, confirmChatValidator } from '#validators/ai_chat'

function userId(auth: HttpContext['auth']): string {
  if (!auth.user)
    throw new Exception('Autenticação necessária para acessar este recurso.', { status: 401 })
  return auth.user.id
}

async function ownedSession(id: string, ownerId: string): Promise<ChatSessionRow> {
  const session = await db.query<ChatSessionRow>().from('ai_chat_sessions').where('id', id).first()
  return assertActiveSession(session, ownerId)
}

export default class AiChatController {
  async message({ request, auth }: HttpContext) {
    const input = await request.validateUsing(chatMessageValidator)
    const ownerId = userId(auth)
    const previous = input.session_id ? await ownedSession(input.session_id, ownerId) : null
    const sessionId = previous?.id ?? randomUUID()
    const activeRows = await db
      .query<{ name: string }>()
      .from('diaristas')
      .where('status', 'ATIVA')
      .select('name')
    const serviceRows = await db
      .query<{ name: string }>()
      .from('service_types')
      .where('active', true)
      .select('name')
    const activeDiaristas = activeRows.map((row) => row.name)
    const serviceTypes = serviceRows.map((row) => row.name)
    const ai = await app.container.make(AiService)
    const extraction = await ai.parseMessage(
      input.message,
      { activeDiaristas, serviceTypes },
      previous?.session_state ?? {}
    )
    const state = mergeSlots(previous?.session_state ?? {}, extraction)
    const missing = missingSlots(state)
    const complete = missing.length === 0
    const followUp = complete ? '' : questionFor(missing, extraction)
    const suggestedAction = complete ? await buildSuggestedAction(state) : null
    const responseText = complete ? 'Confira os dados do agendamento antes de confirmar.' : followUp

    await db.transaction(async (trx) => {
      if (previous) {
        await trx
          .from('ai_chat_sessions')
          .where('id', sessionId)
          .update({ session_state: JSON.stringify(state), updated_at: new Date() })
      } else {
        await trx.table('ai_chat_sessions').insert({
          id: sessionId,
          user_id: ownerId,
          title: input.message.slice(0, 150),
          status: 'ACTIVE',
          session_state: JSON.stringify(state),
        })
      }
      await trx.table('ai_chat_messages').insert([
        {
          id: randomUUID(),
          session_id: sessionId,
          sender: 'USER',
          message_text: input.message,
          extracted_entities: JSON.stringify(extraction),
        },
        {
          id: randomUUID(),
          session_id: sessionId,
          sender: 'ASSISTANT',
          message_text: responseText,
          suggested_action: suggestedAction ? JSON.stringify(suggestedAction) : null,
        },
      ])
    })
    return {
      data: {
        session_id: sessionId,
        is_complete: complete,
        missing_fields: missing,
        follow_up_question: followUp,
        suggested_action: suggestedAction,
      },
    }
  }

  async confirm({ request, auth, response }: HttpContext) {
    const input = await request.validateUsing(confirmChatValidator)
    const ownerId = userId(auth)
    const { session_id: sessionId, ...appointmentInput } = input
    const appointment = await db.transaction(async (trx) => {
      const row = await trx
        .query<ChatSessionRow>()
        .from('ai_chat_sessions')
        .where('id', sessionId)
        .forUpdate()
        .first()
      const session = assertActiveSession(row, ownerId)
      await assertCardMatches(trx, session.session_state, input)
      const created = await createAppointment(appointmentInput, { id: ownerId, role: 'ADMIN' }, trx)
      const origin = await trx
        .from('ai_chat_messages')
        .where({ session_id: sessionId, sender: 'ASSISTANT' })
        .orderBy('created_at', 'desc')
        .first()
      if (origin)
        await trx
          .from('ai_chat_messages')
          .where('id', origin.id)
          .update({ resulting_appointment_id: created.data.id })
      await trx
        .from('ai_chat_sessions')
        .where('id', sessionId)
        .update({ status: 'ARCHIVED', updated_at: new Date() })
      return created
    })
    response.status(201)
    return appointment
  }
}

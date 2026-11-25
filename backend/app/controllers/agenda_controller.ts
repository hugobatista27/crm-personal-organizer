import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import SchedulingService, { SCHEDULE_ZONE } from '#services/scheduling_service'
import { parseAvailability, parseCalendarQuery } from '#validators/scheduling'

const scheduling = new SchedulingService()

export default class AgendaController {
  async index({ request, auth }: HttpContext) {
    const { view, date, status, diaristaId: requestedDiaristaId } = parseCalendarQuery(request.qs())
    let diaristaId = requestedDiaristaId
    if (auth.user?.role === 'DIARISTA') {
      const own = await db
        .query<{ id: string }>()
        .from('diaristas')
        .where('user_id', auth.user.id)
        .first()
      if (!own) return { data: {} }
      diaristaId = own.id
    }

    const reference = DateTime.fromISO(date, { zone: SCHEDULE_ZONE }).set({ hour: 12 })
    return {
      data: await scheduling.getCalendarEvents(view, reference.toJSDate(), { diaristaId, status }),
    }
  }

  async checkAvailability({ request }: HttpContext) {
    const { diaristaId, date, start, end, excludeId } = parseAvailability(request.body())
    const diarista = await db
      .query<{ id: string }>()
      .from('diaristas')
      .where('id', diaristaId)
      .first()
    if (!diarista) {
      throw new Exception('Diarista não encontrada para a data informada.', { status: 422 })
    }

    const conflicts = await scheduling.checkConflict(diaristaId, date, start, end, excludeId)
    if (conflicts.length) {
      const ranges = conflicts.map(({ start_time, end_time }) => `${start_time}–${end_time}`)
      throw new Exception(`Horário em conflito com: ${ranges.join(', ')}.`, { status: 422 })
    }
    return { data: { available: true, conflicts: [] } }
  }
}

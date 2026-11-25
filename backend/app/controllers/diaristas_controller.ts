import { randomUUID } from 'node:crypto'
import db from '@adonisjs/lucid/services/db'
import type { HttpContext } from '@adonisjs/core/http'
import { createDiaristaValidator } from '#validators/client_staff'
import { cellphone, find, insert, list, remove, unique, update } from '#services/client_staff'
import { updateDiaristaValidator } from '#validators/client_staff'

async function withSpecialties<T extends Record<string, unknown>>(row: T) {
  const specialties = await db
    .from('diarista_specialties as pivot')
    .join('service_types as service', 'service.id', 'pivot.service_type_id')
    .where('pivot.diarista_id', row.id as string)
    .select('service.id', 'service.name')
  return { ...row, specialties }
}

export default class DiaristasController {
  async index({ request }: HttpContext) {
    const result = await list('diaristas', request.qs())
    return { ...result, data: await Promise.all(result.data.map(withSpecialties)) }
  }

  async show({ params }: HttpContext) {
    return { data: await withSpecialties(await find('diaristas', params.id)) }
  }

  async store({ request, response }: HttpContext) {
    const { specialty_ids: specialtyIds, ...values } =
      await request.validateUsing(createDiaristaValidator)
    const phone = cellphone(values.phone)
    await unique('diaristas', phone)
    const result = await insert('diaristas', { ...values, phone })
    if (specialtyIds?.length) {
      await db.table('diarista_specialties').insert(
        [...new Set(specialtyIds)].map((serviceId) => ({
          id: randomUUID(),
          diarista_id: result.data.id,
          service_type_id: serviceId,
        }))
      )
    }
    response.status(201)
    return { data: await withSpecialties(result.data) }
  }

  async update({ request, params }: HttpContext) {
    const values = await request.validateUsing(updateDiaristaValidator)
    const phone = values.phone ? cellphone(values.phone) : undefined
    if (phone) await unique('diaristas', phone, params.id)
    const result = await update('diaristas', params.id, { ...values, ...(phone && { phone }) })
    return { data: await withSpecialties(result.data) }
  }

  async destroy({ params }: HttpContext) {
    return remove('diaristas', params.id)
  }
}

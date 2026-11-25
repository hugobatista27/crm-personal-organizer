import type { HttpContext } from '@adonisjs/core/http'
import { createServiceTypeValidator, updateServiceTypeValidator } from '#validators/client_staff'
import { find, insert, list, remove, update } from '#services/client_staff'

export default class ServiceTypesController {
  async index({ request }: HttpContext) {
    return list('service_types', request.qs())
  }
  async show({ params }: HttpContext) {
    return { data: await find('service_types', params.id) }
  }

  async store({ request, response }: HttpContext) {
    const values = await request.validateUsing(createServiceTypeValidator)
    response.status(201)
    return insert('service_types', { ...values, active: values.active ?? true })
  }

  async update({ request, params }: HttpContext) {
    const values = await request.validateUsing(updateServiceTypeValidator)
    return update('service_types', params.id, values)
  }

  async destroy({ params }: HttpContext) {
    return remove('service_types', params.id)
  }
}

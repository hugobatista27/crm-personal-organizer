import type { HttpContext } from '@adonisjs/core/http'
import { createClientValidator, updateClientValidator } from '#validators/client_staff'
import {
  cellphone,
  digits,
  find,
  insert,
  list,
  remove,
  unique,
  update,
} from '#services/client_staff'

export default class ClientsController {
  async index({ request }: HttpContext) {
    return list('clients', request.qs())
  }
  async show({ params }: HttpContext) {
    return { data: await find('clients', params.id) }
  }

  async store({ request, response }: HttpContext) {
    const values = await request.validateUsing(createClientValidator)
    const phone = cellphone(values.phone)
    await unique('clients', phone)
    response.status(201)
    return insert('clients', {
      ...values,
      phone,
      alternative_phone: values.alternative_phone && digits(values.alternative_phone),
    })
  }

  async update({ request, params }: HttpContext) {
    const values = await request.validateUsing(updateClientValidator)
    const phone = values.phone ? cellphone(values.phone) : undefined
    if (phone) await unique('clients', phone, params.id)
    return update('clients', params.id, {
      ...values,
      ...(phone && { phone }),
      ...(values.alternative_phone && { alternative_phone: digits(values.alternative_phone) }),
    })
  }

  async destroy({ params }: HttpContext) {
    return remove('clients', params.id)
  }
}

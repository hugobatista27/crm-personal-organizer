import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'
import {
  createAppointment,
  changeAppointmentStatus,
  rateAppointment,
} from '#services/appointment_lifecycle'
import {
  createAppointmentValidator,
  transitionAppointmentValidator,
  rateAppointmentValidator,
} from '#validators/appointments'
import type { Actor } from '#services/appointment_lifecycle'

function actor(auth: HttpContext['auth']): Actor {
  const user = auth.user
  if (!user) {
    throw new Exception('Autenticação necessária para acessar este recurso.', { status: 401 })
  }
  return { id: user.id, role: user.role }
}

export default class AppointmentsController {
  async store({ request, response, auth }: HttpContext) {
    const input = await request.validateUsing(createAppointmentValidator)
    response.status(201)
    return createAppointment(input, actor(auth))
  }

  async changeStatus({ request, params, auth }: HttpContext) {
    const input = await request.validateUsing(transitionAppointmentValidator)
    return changeAppointmentStatus(params.id, input, actor(auth))
  }

  async rate({ request, params, response, auth }: HttpContext) {
    const input = await request.validateUsing(rateAppointmentValidator)
    response.status(201)
    return rateAppointment(params.id, input, actor(auth))
  }
}

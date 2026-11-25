import vine from '@vinejs/vine'
import { appointmentStatuses } from '#models/appointment'

const uuid = () => vine.string().uuid()
const time = () => vine.string().regex(/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/)

export const appointmentFields = {
  client_id: uuid(),
  diarista_id: uuid().optional(),
  service_type_id: uuid(),
  service_date: vine.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: time(),
  end_time: time(),
  client_price: vine.number().min(0),
  diarista_payout: vine.number().min(0),
  additional_costs: vine.number().min(0).optional(),
  address_snapshot: vine.string().trim().minLength(1),
  observations: vine.string().optional(),
}

export const createAppointmentValidator = vine.create(appointmentFields)

export const transitionAppointmentValidator = vine.create({
  status: vine.enum(appointmentStatuses),
  reason_notes: vine.string().optional(),
})

export const rateAppointmentValidator = vine.create({
  rating: vine.number().withoutDecimals().min(1).max(5),
  comment: vine.string().optional(),
})

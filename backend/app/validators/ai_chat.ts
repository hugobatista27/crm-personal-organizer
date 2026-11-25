import vine from '@vinejs/vine'
import { appointmentFields } from '#validators/appointments'

export const chatMessageValidator = vine.create({
  session_id: vine.string().uuid().optional(),
  message: vine.string().trim().minLength(1).maxLength(4000),
})

export const confirmChatValidator = vine.create({
  session_id: vine.string().uuid(),
  ...appointmentFields,
})

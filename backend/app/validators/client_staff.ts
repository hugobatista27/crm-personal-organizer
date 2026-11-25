import vine from '@vinejs/vine'

const phone = () => vine.string().regex(/^\+?[\d\s()-]{3,20}$/)

export const createClientValidator = vine.create({
  name: vine.string().trim().minLength(2).maxLength(150),
  phone: phone(),
  street: vine.string().trim().maxLength(150),
  number: vine.string().trim().maxLength(20),
  neighborhood: vine.string().trim().maxLength(100),
  city: vine.string().trim().maxLength(100),
  state: vine.string().trim().fixedLength(2),
  alternative_phone: phone().optional(),
  email: vine.string().email().optional(),
  complement: vine.string().maxLength(80).optional(),
  zip_code: vine.string().maxLength(10).optional(),
  latitude: vine.number().optional(),
  longitude: vine.number().optional(),
  notes: vine.string().optional(),
})

export const createDiaristaValidator = vine.create({
  name: vine.string().trim().minLength(2).maxLength(150),
  phone: phone(),
  status: vine.enum(['ATIVA', 'EM_SERVICO', 'INATIVA']),
  user_id: vine.string().uuid().optional(),
  document_cpf: vine.string().maxLength(14).optional(),
  photo_url: vine.string().url().optional(),
  bio_notes: vine.string().optional(),
  specialty_ids: vine.array(vine.string().uuid()).optional(),
})

export const createServiceTypeValidator = vine.create({
  name: vine.string().trim().maxLength(100),
  description: vine.string().optional(),
  reference_price: vine.number().min(0),
  default_duration: vine.string().regex(/^\d{2}:\d{2}:\d{2}$/),
  active: vine.boolean().optional(),
})

export const updateClientValidator = vine.create({
  name: vine.string().trim().minLength(2).maxLength(150).optional(),
  phone: phone().optional(),
  street: vine.string().trim().maxLength(150).optional(),
  number: vine.string().trim().maxLength(20).optional(),
  neighborhood: vine.string().trim().maxLength(100).optional(),
  city: vine.string().trim().maxLength(100).optional(),
  state: vine.string().trim().fixedLength(2).optional(),
  alternative_phone: phone().optional(),
  email: vine.string().email().optional(),
  complement: vine.string().maxLength(80).optional(),
  zip_code: vine.string().maxLength(10).optional(),
  latitude: vine.number().optional(),
  longitude: vine.number().optional(),
  notes: vine.string().optional(),
})

export const updateDiaristaValidator = vine.create({
  name: vine.string().trim().minLength(2).maxLength(150).optional(),
  phone: phone().optional(),
  status: vine.enum(['ATIVA', 'EM_SERVICO', 'INATIVA']).optional(),
  user_id: vine.string().uuid().optional(),
  document_cpf: vine.string().maxLength(14).optional(),
  photo_url: vine.string().url().optional(),
  bio_notes: vine.string().optional(),
})

export const updateServiceTypeValidator = vine.create({
  name: vine.string().trim().maxLength(100).optional(),
  description: vine.string().optional(),
  reference_price: vine.number().min(0).optional(),
  default_duration: vine
    .string()
    .regex(/^\d{2}:\d{2}:\d{2}$/)
    .optional(),
  active: vine.boolean().optional(),
})

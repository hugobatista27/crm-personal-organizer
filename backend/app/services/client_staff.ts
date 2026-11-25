import db from '@adonisjs/lucid/services/db'
import { Exception } from '@adonisjs/core/exceptions'
import { randomUUID } from 'node:crypto'

export const digits = (value: string): string => value.replace(/\D/g, '')
export const cellphone = (value: string): string => {
  const phone = digits(value)
  if (phone.length !== 11) invalid('Informe um celular com DDD.')
  return phone
}
export const invalid = (message: string): never => {
  throw new Exception(message, { status: 422 })
}
export const missing = (): never => {
  throw new Exception('Registro não encontrado.', { status: 404 })
}

export async function unique(table: 'clients' | 'diaristas', phone: string, except?: string) {
  const query = db.from(table).where('phone', phone)
  if (except) query.whereNot('id', except)
  if (await query.first()) invalid('Telefone já cadastrado.')
}

function friendlyDatabaseError(error: unknown): never {
  const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : null
  if (code === '23505') invalid('Registro duplicado.')
  if (code === '23503') invalid('Referência informada não existe.')
  throw error
}

export function pagination(input: Record<string, string>) {
  const page = Math.max(1, Number(input.page) || 1)
  const perPage = Math.min(100, Math.max(1, Number(input.per_page) || 20))
  return { page, perPage }
}

export async function list(
  table: 'clients' | 'diaristas' | 'service_types',
  input: Record<string, string>
) {
  const { page, perPage } = pagination(input)
  const search = input.search?.trim()
  const query = db.from(table)
  if (search)
    query.where((builder) => {
      builder.whereILike('name', `%${search}%`)
      if (table !== 'service_types' && digits(search)) {
        builder.orWhere('phone', 'like', `%${digits(search)}%`)
      }
    })
  if (table === 'diaristas' && input.status) query.where('status', input.status)
  const count = await query.clone().count('* as total').first()
  const data = await query
    .orderBy('name')
    .limit(perPage)
    .offset((page - 1) * perPage)
  return { data, meta: { total: Number(count?.total ?? 0), page, per_page: perPage } }
}

export async function find(table: 'clients' | 'diaristas' | 'service_types', id: string) {
  const row = await db.from(table).where('id', id).first()
  return row ?? missing()
}

export async function remove(table: 'clients' | 'diaristas' | 'service_types', id: string) {
  await find(table, id)
  await db.from(table).where('id', id).delete()
  return { message: 'Registro excluído.' }
}

export async function insert(
  table: 'clients' | 'diaristas' | 'service_types',
  values: Record<string, unknown>
) {
  try {
    const [row] = await db
      .table(table)
      .insert({ id: randomUUID(), ...values })
      .returning('*')
    return { data: row }
  } catch (error) {
    return friendlyDatabaseError(error)
  }
}

export async function update(
  table: 'clients' | 'diaristas' | 'service_types',
  id: string,
  values: Record<string, unknown>
) {
  await find(table, id)
  try {
    const [row] = await db
      .from(table)
      .where('id', id)
      .update({ ...values, updated_at: new Date() })
      .returning('*')
    return { data: row }
  } catch (error) {
    return friendlyDatabaseError(error)
  }
}

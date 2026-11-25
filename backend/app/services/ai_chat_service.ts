import { Exception } from '@adonisjs/core/exceptions'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import type { Infer } from '@vinejs/vine/types'
import type { AppointmentSlots, Extraction } from '#services/ai_service'
import type { confirmChatValidator } from '#validators/ai_chat'

export type ChatSessionRow = {
  id: string
  user_id: string
  status: 'ACTIVE' | 'ARCHIVED'
  session_state: AppointmentSlots
}

type NamedRow = { id: string; name: string }
type CatalogTable = 'clients' | 'diaristas' | 'service_types'
type NameMatch = { id?: string; name: string; match: 'exact' | 'suggested' | 'create' }
export type SuggestedAction = AppointmentSlots & {
  client: NameMatch | null
  diarista: NameMatch | null
  service_type: NameMatch | null
}

const requiredSlots = ['client_name', 'service_type_name', 'date', 'start_time'] as const
type RequiredSlot = (typeof requiredSlots)[number]
const requiredLabels: Record<RequiredSlot, string> = {
  client_name: 'o nome do cliente',
  service_type_name: 'o tipo de serviço',
  date: 'a data',
  start_time: 'o horário de início',
}

function invalid(message: string): never {
  throw new Exception(message, { status: 422 })
}

export function assertActiveSession(
  session: ChatSessionRow | null | undefined,
  ownerId: string
): ChatSessionRow {
  if (!session) throw new Exception('Sessão de chat não encontrada.', { status: 404 })
  if (session.user_id !== ownerId)
    throw new Exception('Acesso negado a esta sessão.', { status: 403 })
  if (session.status !== 'ACTIVE') invalid('Esta sessão já foi encerrada.')
  return session
}

export function mergeSlots(
  previous: Partial<AppointmentSlots>,
  next: Extraction
): AppointmentSlots {
  return {
    client_name: next.client_name ?? previous.client_name ?? null,
    client_phone: next.client_phone ?? previous.client_phone ?? null,
    diarista_name: next.diarista_name ?? previous.diarista_name ?? null,
    service_type_name: next.service_type_name ?? previous.service_type_name ?? null,
    date: next.date ?? previous.date ?? null,
    start_time: next.start_time ?? previous.start_time ?? null,
    price: next.price ?? previous.price ?? null,
  }
}

export function missingSlots(state: AppointmentSlots): RequiredSlot[] {
  return requiredSlots.filter((key) => !state[key])
}

export function questionFor(missing: RequiredSlot[], extraction: Extraction): string {
  if (
    extraction.follow_up_question &&
    extraction.missing_fields.some((field) => missing.some((slot) => slot === field))
  ) {
    return extraction.follow_up_question
  }
  return `Para continuar, informe ${missing.map((field) => requiredLabels[field]).join(' e ')}.`
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function distance(a: string, b: string): number {
  const left = normalize(a)
  const right = normalize(b)
  const row = Array.from({ length: right.length + 1 }, (_, index) => index)
  for (let i = 1; i <= left.length; i++) {
    let diagonal = row[0]
    row[0] = i
    for (let j = 1; j <= right.length; j++) {
      const previous = row[j]
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + Number(left[i - 1] !== right[j - 1]))
      diagonal = previous
    }
  }
  return row[right.length]
}

function matchesName(expected: string | null, actual: string): boolean {
  return !expected || distance(expected, actual) <= Math.max(2, Math.floor(expected.length / 4))
}

async function matchName(table: CatalogTable, name: string | null): Promise<NameMatch | null> {
  if (!name) return null
  const query = db.query<NamedRow>().from(table).select('id', 'name')
  if (table === 'diaristas') query.where('status', 'ATIVA')
  if (table === 'service_types') query.where('active', true)
  const rows = await query
  const exact = rows.find((row) => normalize(row.name) === normalize(name))
  if (exact) return { id: exact.id, name: exact.name, match: 'exact' }
  const candidate = rows
    .map((row) => ({ ...row, score: distance(name, row.name) }))
    .sort((a, b) => a.score - b.score)[0]
  if (candidate && matchesName(name, candidate.name)) {
    return { id: candidate.id, name: candidate.name, match: 'suggested' }
  }
  return { name, match: 'create' }
}

export async function buildSuggestedAction(state: AppointmentSlots): Promise<SuggestedAction> {
  const client = await matchName('clients', state.client_name)
  const diarista = await matchName('diaristas', state.diarista_name)
  const serviceType = await matchName('service_types', state.service_type_name)
  return { ...state, client, diarista, service_type: serviceType }
}

export async function assertCardMatches(
  trx: TransactionClientContract,
  state: AppointmentSlots,
  input: Infer<typeof confirmChatValidator>
): Promise<void> {
  if (missingSlots(state).length)
    invalid('Complete os dados pendentes antes de confirmar o agendamento.')
  if (
    input.service_date !== state.date ||
    input.start_time.slice(0, 5) !== state.start_time ||
    (state.price !== null && input.client_price !== state.price)
  )
    invalid('Os dados diferem do card. Revise o agendamento antes de confirmar.')

  const client = await trx.query<NamedRow>().from('clients').where('id', input.client_id).first()
  const diarista = input.diarista_id
    ? await trx
        .query<NamedRow & { status: string }>()
        .from('diaristas')
        .where('id', input.diarista_id)
        .first()
    : null
  const serviceType = await trx
    .query<NamedRow & { active: boolean }>()
    .from('service_types')
    .where('id', input.service_type_id)
    .first()
  if (
    !client ||
    !serviceType ||
    !serviceType.active ||
    (state.diarista_name && (!diarista || diarista.status !== 'ATIVA')) ||
    !matchesName(state.client_name, client.name) ||
    (diarista && !matchesName(state.diarista_name, diarista.name)) ||
    !matchesName(state.service_type_name, serviceType.name)
  )
    invalid('Cliente, diarista ou serviço não corresponde ao card. Revise antes de confirmar.')
}

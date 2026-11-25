import { Exception } from '@adonisjs/core/exceptions'
import { DateTime } from 'luxon'

export const slotNames = [
  'client_name',
  'client_phone',
  'diarista_name',
  'service_type_name',
  'date',
  'start_time',
  'price',
] as const
export type AppointmentSlots = {
  client_name: string | null
  client_phone: string | null
  diarista_name: string | null
  service_type_name: string | null
  date: string | null
  start_time: string | null
  price: number | null
}
export type Extraction = AppointmentSlots & {
  is_complete: boolean
  missing_fields: string[]
  follow_up_question: string
}
export type AiContext = { activeDiaristas: string[]; serviceTypes: string[] }
export type LlmRequest = AiContext & {
  message: string
  sessionState: Record<string, unknown>
  schema: {
    type: 'object'
    additionalProperties: false
    properties: Record<string, unknown>
    required: string[]
  }
}
export interface LlmAdapter {
  extract(request: LlmRequest): Promise<Extraction>
}

const nullableString = { type: ['string', 'null'] }
const schema: LlmRequest['schema'] = {
  type: 'object',
  additionalProperties: false,
  properties: {
    client_name: nullableString,
    client_phone: nullableString,
    diarista_name: nullableString,
    service_type_name: nullableString,
    date: nullableString,
    start_time: nullableString,
    price: { type: ['number', 'null'] },
    is_complete: { type: 'boolean' },
    missing_fields: { type: 'array', items: { type: 'string' } },
    follow_up_question: { type: 'string' },
  },
  required: [...slotNames, 'is_complete', 'missing_fields', 'follow_up_question'],
}

function validExtraction(value: unknown): value is Extraction {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const entry = value as Record<string, unknown>
  if (Object.keys(entry).sort().join() !== schema.required.toSorted().join()) return false
  return (
    slotNames.every((key) =>
      key === 'price'
        ? entry[key] === null || typeof entry[key] === 'number'
        : entry[key] === null || typeof entry[key] === 'string'
    ) &&
    typeof entry.is_complete === 'boolean' &&
    Array.isArray(entry.missing_fields) &&
    entry.missing_fields.every((field: unknown) => typeof field === 'string') &&
    typeof entry.follow_up_question === 'string' &&
    (entry.date === null ||
      (typeof entry.date === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(entry.date) &&
        DateTime.fromISO(entry.date).isValid)) &&
    (entry.start_time === null ||
      (typeof entry.start_time === 'string' &&
        /^([01]\d|2[0-3]):[0-5]\d$/.test(entry.start_time))) &&
    (entry.price === null ||
      (typeof entry.price === 'number' && Number.isFinite(entry.price) && entry.price >= 0))
  )
}

function assertExtraction(value: unknown): asserts value is Extraction {
  if (!validExtraction(value)) {
    throw new Exception(
      'A IA retornou dados incompletos ou inválidos. Tente reformular a mensagem.',
      {
        status: 503,
      }
    )
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function outputText(body: unknown): string {
  if (!isRecord(body) || !Array.isArray(body.output)) {
    throw new Exception('A IA retornou uma resposta inválida. Tente novamente.', { status: 503 })
  }
  for (const item of body.output) {
    if (!isRecord(item) || !Array.isArray(item.content)) continue
    for (const content of item.content) {
      if (isRecord(content) && content.type === 'output_text' && typeof content.text === 'string') {
        return content.text
      }
    }
  }
  throw new Exception('A IA não conseguiu extrair os dados. Tente reformular a mensagem.', {
    status: 503,
  })
}

export class OpenAiAdapter implements LlmAdapter {
  async extract(request: LlmRequest): Promise<Extraction> {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Exception('O provedor de IA não está configurado.', { status: 503 })
    let response: Response
    try {
      response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(20_000),
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          instructions:
            'Extraia somente fatos expressos pelo usuário para agendamento. Responda em português. Use null para dados não informados. Converta datas para YYYY-MM-DD e horas para HH:mm. Não invente nomes, valores nem horários. Em caso de ambiguidade, formule uma pergunta de esclarecimento.',
          input: JSON.stringify({
            mensagem: request.message,
            diaristas_ativas: request.activeDiaristas,
            tipos_de_servico: request.serviceTypes,
            contexto_da_sessao: request.sessionState,
          }),
          text: {
            format: {
              type: 'json_schema',
              name: 'appointment_extraction',
              strict: true,
              schema: request.schema,
            },
          },
        }),
      })
    } catch {
      throw new Exception('Não foi possível consultar a IA. Tente novamente.', { status: 503 })
    }
    if (!response.ok)
      throw new Exception('O provedor de IA não respondeu. Tente novamente.', { status: 503 })
    let body: unknown
    try {
      body = await response.json()
    } catch {
      throw new Exception('A IA retornou uma resposta inválida. Tente novamente.', { status: 503 })
    }
    const text = outputText(body)
    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      throw new Exception('A IA retornou um formato inválido. Tente novamente.', { status: 503 })
    }
    assertExtraction(parsed)
    return parsed
  }
}

export default class AiService {
  constructor(private readonly adapter: LlmAdapter = new OpenAiAdapter()) {}

  async parseMessage(
    message: string,
    context: AiContext,
    sessionState: Record<string, unknown> = {}
  ): Promise<Extraction> {
    const result = await this.adapter.extract({ message, ...context, sessionState, schema })
    assertExtraction(result)
    return result
  }
}

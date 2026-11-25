import { randomUUID } from 'node:crypto'
import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import db from '@adonisjs/lucid/services/db'
import hash from '@adonisjs/core/services/hash'
import logger from '@adonisjs/core/services/logger'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'

type Role = 'ADMIN' | 'DIARISTA'
type Extraction = {
  client_name: string | null
  client_phone: string | null
  diarista_name: string | null
  service_type_name: string | null
  date: string | null
  start_time: string | null
  price: number | null
  is_complete: boolean
  missing_fields: string[]
  follow_up_question: string
}
type LlmRequest = {
  message: string
  activeDiaristas: string[]
  serviceTypes: string[]
  sessionState: Record<string, unknown>
  schema: { additionalProperties: boolean; properties: Record<string, unknown> }
}
type AiServiceContract = {
  new (adapter: FakeLlmAdapter): {
    parseMessage: (
      message: string,
      context: { activeDiaristas: string[]; serviceTypes: string[] },
      sessionState?: Record<string, unknown>
    ) => Promise<Extraction>
  }
}

const completeExtraction: Extraction = {
  client_name: 'Ana Souza',
  client_phone: null,
  diarista_name: 'Carla Lima',
  service_type_name: 'Limpeza Residencial',
  date: '2027-10-10',
  start_time: '08:00',
  price: 180,
  is_complete: true,
  missing_fields: [],
  follow_up_question: '',
}
const incompleteExtraction: Extraction = {
  ...completeExtraction,
  date: null,
  start_time: null,
  is_complete: false,
  missing_fields: ['date', 'start_time'],
  follow_up_question: 'Qual é a data e o horário de início?',
}

class FakeLlmAdapter {
  readonly calls: LlmRequest[] = []

  constructor(private readonly responses: Extraction[]) {}

  async extract(request: LlmRequest): Promise<Extraction> {
    this.calls.push(request)
    const response = this.responses.shift()
    if (!response) throw new Error('Resposta de LLM não configurada no teste')
    return response
  }
}

async function aiServiceClass(): Promise<AiServiceContract> {
  // O import em tempo de execução mantém a fase Red compilável.
  const path: string = '#services/ai_service'
  const { default: AiService } = await import(path)
  return AiService as AiServiceContract
}

async function withFakeAi<T>(adapter: FakeLlmAdapter, work: () => Promise<T>): Promise<T> {
  const AiService = await aiServiceClass()
  app.container.swap(AiService, () => new AiService(adapter))
  try {
    return await work()
  } finally {
    app.container.restore(AiService)
  }
}

async function identity(role: Role): Promise<{ id: string; token: string }> {
  const user = await User.create({
    id: randomUUID(),
    name: `Usuário ${role}`,
    email: `${role.toLowerCase()}.${randomUUID()}@organizamais.test`,
    passwordHash: await hash.make('SenhaSegura@123'),
    role,
    active: true,
  })
  const token = await User.accessTokens.create(user, ['*'], { name: 'Teste TASK-05' })
  if (!token.value) throw new Error('Token de teste não emitido')
  return { id: user.id, token: token.value.release() }
}

async function fixtures() {
  const clientId = randomUUID()
  const diaristaId = randomUUID()
  const inactiveDiaristaId = randomUUID()
  const serviceTypeId = randomUUID()
  const phone = (suffix: string) =>
    `11${randomUUID().replace(/\D/g, '').slice(0, 8).padEnd(8, suffix)}${suffix}`
  await db.table('clients').insert({
    id: clientId,
    name: 'Ana Souza',
    phone: phone('1'),
    street: 'Rua das Flores',
    number: '42',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
  })
  await db.table('diaristas').insert([
    { id: diaristaId, name: 'Carla Lima', phone: phone('2'), status: 'ATIVA' },
    { id: inactiveDiaristaId, name: 'Bia Dias', phone: phone('3'), status: 'INATIVA' },
  ])
  await db.table('service_types').insert({
    id: serviceTypeId,
    name: 'Limpeza Residencial',
    reference_price: 180,
    default_duration: '04:00:00',
    active: true,
  })
  return { clientId, diaristaId, serviceTypeId }
}

test.group('TASK-05 | Engine de IA e chat operacional', (group) => {
  group.setup(() => testUtils.db().migrate())
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('migrations mantêm as colunas e tipos JSONB da modelagem de sessões e mensagens', async ({
    assert,
  }) => {
    const expected = {
      ai_chat_sessions: [
        'id',
        'user_id',
        'title',
        'status',
        'session_state',
        'created_at',
        'updated_at',
      ],
      ai_chat_messages: [
        'id',
        'session_id',
        'sender',
        'message_text',
        'extracted_entities',
        'suggested_action',
        'resulting_appointment_id',
        'created_at',
      ],
    } as const
    for (const [table, names] of Object.entries(expected)) {
      const columns = await db
        .from('information_schema.columns')
        .select('column_name', 'data_type')
        .where({ table_schema: 'public', table_name: table })
      assert.deepEqual(columns.map((column) => column.column_name).sort(), [...names].sort())
      assert.equal(columns.find((column) => column.column_name === 'id')?.data_type, 'uuid')
    }
    for (const [table, column] of [
      ['ai_chat_sessions', 'session_state'],
      ['ai_chat_messages', 'extracted_entities'],
      ['ai_chat_messages', 'suggested_action'],
    ]) {
      const field = await db
        .from('information_schema.columns')
        .where({
          table_schema: 'public',
          table_name: table,
          column_name: column,
        })
        .first()
      assert.equal(field?.data_type, 'jsonb')
    }
  })

  test('models AiChatSession e AiChatMessage apontam para as tabelas documentadas', async ({
    assert,
  }) => {
    const sessionPath: string = '#models/ai_chat_session'
    const messagePath: string = '#models/ai_chat_message'
    const { default: AiChatSession } = await import(sessionPath)
    const { default: AiChatMessage } = await import(messagePath)
    assert.equal(AiChatSession.table, 'ai_chat_sessions')
    assert.equal(AiChatMessage.table, 'ai_chat_messages')
  })

  test('AiService usa adapter injetável e JSON Schema estrito para extrair frase real', async ({
    assert,
  }) => {
    const AiService = await aiServiceClass()
    const adapter = new FakeLlmAdapter([completeExtraction])
    const result = await new AiService(adapter).parseMessage(
      'Agendar limpeza residencial para Ana Souza com Carla Lima dia 10/10/2027 às 8 horas por R$ 180',
      { activeDiaristas: ['Carla Lima'], serviceTypes: ['Limpeza Residencial'] }
    )
    assert.deepEqual(result, completeExtraction)
    assert.deepEqual(
      Object.keys(adapter.calls[0].schema.properties).sort(),
      Object.keys(completeExtraction).sort()
    )
    assert.isFalse(adapter.calls[0].schema.additionalProperties)
    assert.include(adapter.calls[0].message, '10/10/2027')
    assert.deepEqual(adapter.calls[0].activeDiaristas, ['Carla Lima'])
  })

  test('mensagem incompleta abre sessão, faz pergunta em português e não persiste agendamento', async ({
    client,
    assert,
  }) => {
    const admin = await identity('ADMIN')
    await fixtures()
    const adapter = new FakeLlmAdapter([incompleteExtraction])
    await withFakeAi(adapter, async () => {
      const response = await client
        .post('/api/v1/ai/chat/message')
        .bearerToken(admin.token)
        .json({
          message: 'Agendar faxina para Ana Souza com Carla Lima',
        } as never)
      response.assertStatus(200)
      const data = response.body().data as {
        session_id: string
        is_complete: boolean
        missing_fields: string[]
        follow_up_question: string
      }
      assert.isFalse(data.is_complete)
      assert.includeMembers(data.missing_fields, ['date', 'start_time'])
      assert.match(data.follow_up_question, /data|dia|horário/i)
      const session = await db.from('ai_chat_sessions').where('id', data.session_id).first()
      assert.equal(session?.user_id, admin.id)
      assert.equal(session?.status, 'ACTIVE')
      assert.equal(session?.session_state.client_name, 'Ana Souza')
      const messages = await db.from('ai_chat_messages').where('session_id', data.session_id)
      assert.sameMembers(
        messages.map((row) => row.sender),
        ['USER', 'ASSISTANT']
      )
      assert.lengthOf(await db.from('appointments'), 0)
    })
    assert.deepEqual(adapter.calls[0].activeDiaristas, ['Carla Lima'])
    assert.deepEqual(adapter.calls[0].serviceTypes, ['Limpeza Residencial'])
  })

  test('slot-filling preserva contexto entre mensagens e gera card sem commit', async ({
    client,
    assert,
  }) => {
    const admin = await identity('ADMIN')
    await fixtures()
    const followUp: Extraction = {
      ...completeExtraction,
      client_name: null,
      diarista_name: null,
      service_type_name: null,
      price: null,
      is_complete: false,
      missing_fields: ['client_name', 'service_type_name'],
      follow_up_question: 'Qual cliente e serviço?',
    }
    const adapter = new FakeLlmAdapter([incompleteExtraction, followUp])
    await withFakeAi(adapter, async () => {
      const first = await client
        .post('/api/v1/ai/chat/message')
        .bearerToken(admin.token)
        .json({
          message: 'Agendar faxina para Ana Souza com Carla Lima',
        } as never)
      first.assertStatus(200)
      const sessionId = first.body().data.session_id as string
      const second = await client
        .post('/api/v1/ai/chat/message')
        .bearerToken(admin.token)
        .json({
          session_id: sessionId,
          message: 'No dia 10/10/2027 às 08:00',
        } as never)
      second.assertStatus(200)
      assert.isTrue(second.body().data.is_complete)
      assert.equal(second.body().data.suggested_action.client_name, 'Ana Souza')
      assert.equal(second.body().data.suggested_action.date, '2027-10-10')
      assert.isNotEmpty(second.body().data.suggested_action)
      assert.lengthOf(await db.from('ai_chat_messages').where('session_id', sessionId), 4)
      assert.lengthOf(await db.from('appointments'), 0)
    })
    assert.equal(adapter.calls[1].sessionState.client_name, 'Ana Souza')
  })

  test('confirmação explícita persiste atendimento e vincula mensagem ao resultado', async ({
    client,
    assert,
  }) => {
    const admin = await identity('ADMIN')
    const fixture = await fixtures()
    const adapter = new FakeLlmAdapter([completeExtraction])
    await withFakeAi(adapter, async () => {
      const parsed = await client
        .post('/api/v1/ai/chat/message')
        .bearerToken(admin.token)
        .json({
          message:
            'Agendar limpeza residencial para Ana Souza com Carla Lima dia 10/10/2027 às 8 horas por R$ 180',
        } as never)
      parsed.assertStatus(200)
      const sessionId = parsed.body().data.session_id as string
      assert.isTrue(parsed.body().data.is_complete)
      assert.equal(parsed.body().data.suggested_action.client_name, 'Ana Souza')
      assert.lengthOf(await db.from('appointments'), 0)
      const confirmed = await client
        .post('/api/v1/ai/chat/confirm')
        .bearerToken(admin.token)
        .json({
          session_id: sessionId,
          client_id: fixture.clientId,
          diarista_id: fixture.diaristaId,
          service_type_id: fixture.serviceTypeId,
          service_date: '2027-10-10',
          start_time: '08:00:00',
          end_time: '12:00:00',
          client_price: 180,
          diarista_payout: 120,
          address_snapshot: 'Rua das Flores, 42, Centro, São Paulo - SP',
        } as never)
      confirmed.assertStatus(201)
      const appointmentId = confirmed.body().data.id as string
      const appointment = await db.from('appointments').where('id', appointmentId).first()
      assert.equal(appointment?.status, 'SOLICITADO')
      assert.equal(appointment?.client_id, fixture.clientId)
      const history = await db
        .from('appointment_status_history')
        .where('appointment_id', appointmentId)
      assert.lengthOf(history, 1)
      assert.equal(history[0].changed_by_user_id, admin.id)
      const origin = await db
        .from('ai_chat_messages')
        .where({ session_id: sessionId, resulting_appointment_id: appointmentId })
        .first()
      assert.equal(origin?.resulting_appointment_id, appointmentId)
    })
  })

  test('confirmação de sessão incompleta retorna 422 e não grava atendimento', async ({
    client,
    assert,
  }) => {
    const admin = await identity('ADMIN')
    const fixture = await fixtures()
    await withFakeAi(new FakeLlmAdapter([incompleteExtraction]), async () => {
      const parsed = await client
        .post('/api/v1/ai/chat/message')
        .bearerToken(admin.token)
        .json({
          message: 'Agendar faxina para Ana Souza com Carla Lima',
        } as never)
      parsed.assertStatus(200)
      const confirmed = await client
        .post('/api/v1/ai/chat/confirm')
        .bearerToken(admin.token)
        .json({
          session_id: parsed.body().data.session_id,
          client_id: fixture.clientId,
          diarista_id: fixture.diaristaId,
          service_type_id: fixture.serviceTypeId,
          service_date: '2027-10-10',
          start_time: '08:00:00',
          end_time: '12:00:00',
          client_price: 180,
          diarista_payout: 120,
          address_snapshot: 'Rua das Flores, 42, Centro, São Paulo - SP',
        } as never)
      confirmed.assertStatus(422)
      assert.lengthOf(await db.from('appointments'), 0)
    })
  })

  test('confirmação recusa payload divergente e não duplica o agendamento', async ({
    client,
    assert,
  }) => {
    const admin = await identity('ADMIN')
    const fixture = await fixtures()
    await withFakeAi(new FakeLlmAdapter([completeExtraction]), async () => {
      const parsed = await client
        .post('/api/v1/ai/chat/message')
        .bearerToken(admin.token)
        .json({
          message: 'Agendar limpeza residencial para Ana Souza com Carla Lima dia 10/10/2027 às 8h',
        } as never)
      parsed.assertStatus(200)
      const payload = {
        session_id: parsed.body().data.session_id as string,
        client_id: fixture.clientId,
        diarista_id: fixture.diaristaId,
        service_type_id: fixture.serviceTypeId,
        service_date: '2027-10-10',
        start_time: '08:00:00',
        end_time: '12:00:00',
        client_price: 180,
        diarista_payout: 120,
        address_snapshot: 'Rua das Flores, 42, Centro, São Paulo - SP',
      }
      const changed = await client
        .post('/api/v1/ai/chat/confirm')
        .bearerToken(admin.token)
        .json({
          ...payload,
          service_date: '2027-10-11',
        } as never)
      changed.assertStatus(422)
      assert.lengthOf(await db.from('appointments'), 0)
      const confirmed = await client
        .post('/api/v1/ai/chat/confirm')
        .bearerToken(admin.token)
        .json(payload as never)
      confirmed.assertStatus(201)
      const repeated = await client
        .post('/api/v1/ai/chat/confirm')
        .bearerToken(admin.token)
        .json(payload as never)
      repeated.assertStatus(422)
      assert.lengthOf(await db.from('appointments'), 1)
    })
  })

  test('nomes ambíguos geram sugestão de correspondência ou criação rápida sem commit', async ({
    client,
    assert,
  }) => {
    const admin = await identity('ADMIN')
    await fixtures()
    const uncertain: Extraction = {
      ...completeExtraction,
      client_name: 'Ana Soza',
      diarista_name: 'Carla Lma',
    }
    await withFakeAi(new FakeLlmAdapter([uncertain]), async () => {
      const response = await client
        .post('/api/v1/ai/chat/message')
        .bearerToken(admin.token)
        .json({
          message: 'Agendar limpeza para Ana Soza com Carla Lma em 10/10/2027 às 8h',
        } as never)
      response.assertStatus(200)
      const body = JSON.stringify(response.body())
      assert.match(body, /Ana Souza|criar|cadastro/i)
      assert.match(body, /Carla Lima|criar|cadastro/i)
      assert.lengthOf(await db.from('appointments'), 0)
    })
  })

  test('chat e confirmação exigem ADMIN, validam texto e isolam sessões por proprietária', async ({
    client,
    assert,
  }) => {
    const admin = await identity('ADMIN')
    const otherAdmin = await identity('ADMIN')
    const diarista = await identity('DIARISTA')
    await fixtures()
    const anonymous = await client
      .post('/api/v1/ai/chat/message')
      .json({ message: 'Agendar' } as never)
    anonymous.assertStatus(401)
    const forbidden = await client
      .post('/api/v1/ai/chat/message')
      .bearerToken(diarista.token)
      .json({ message: 'Agendar' } as never)
    forbidden.assertStatus(403)
    const invalid = await client
      .post('/api/v1/ai/chat/message')
      .bearerToken(admin.token)
      .json({ message: '' } as never)
    invalid.assertStatus(422)
    const wrongRoleConfirm = await client
      .post('/api/v1/ai/chat/confirm')
      .bearerToken(diarista.token)
      .json({ session_id: randomUUID() } as never)
    wrongRoleConfirm.assertStatus(403)
    await withFakeAi(new FakeLlmAdapter([incompleteExtraction]), async () => {
      const first = await client
        .post('/api/v1/ai/chat/message')
        .bearerToken(admin.token)
        .json({
          message: 'Agendar faxina para Ana Souza com Carla Lima',
        } as never)
      first.assertStatus(200)
      const stolen = await client
        .post('/api/v1/ai/chat/message')
        .bearerToken(otherAdmin.token)
        .json({
          session_id: first.body().data.session_id,
          message: 'No dia 10/10/2027 às 08:00',
        } as never)
      stolen.assertStatus(403)
      assert.lengthOf(await db.from('appointments'), 0)
    })
  })

  test('resposta da IA com data inválida retorna erro amigável sem gravar sessão', async ({
    client,
    assert,
  }) => {
    const admin = await identity('ADMIN')
    await fixtures()
    const originalLogLevel = logger.level
    logger.level = 'silent'
    try {
      await withFakeAi(
        new FakeLlmAdapter([{ ...completeExtraction, date: '2027-99-99' }]),
        async () => {
          const response = await client
            .post('/api/v1/ai/chat/message')
            .bearerToken(admin.token)
            .json({
              message: 'Agendar limpeza para Ana Souza com Carla Lima numa data inválida',
            } as never)
          response.assertStatus(503)
          assert.match(JSON.stringify(response.body()), /IA|dados|data|reformular/i)
          assert.lengthOf(await db.from('ai_chat_sessions'), 0)
        }
      )
    } finally {
      logger.level = originalLogLevel
    }
  })
})

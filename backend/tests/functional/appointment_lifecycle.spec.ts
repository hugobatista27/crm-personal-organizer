import { randomUUID } from 'node:crypto'
import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import hash from '@adonisjs/core/services/hash'
import testUtils from '@adonisjs/core/services/test_utils'
import { DateTime } from 'luxon'
import User from '#models/user'
import type { AppointmentStatus } from '#models/appointment'

type Role = 'ADMIN' | 'DIARISTA'
type Fixtures = Awaited<ReturnType<typeof createFixtures>>

const today = () => DateTime.now().setZone('America/Sao_Paulo').toISODate()!
const address = 'Rua das Flores, 42, Centro, São Paulo - SP'

async function createIdentity(role: Role): Promise<{ id: string; token: string }> {
  const user = await User.create({
    id: randomUUID(),
    name: `Usuário ${role}`,
    email: `${role.toLowerCase()}.${randomUUID()}@organizamais.test`,
    passwordHash: await hash.make('SenhaSegura@123'),
    role,
    active: true,
  })
  const token = await User.accessTokens.create(user, ['*'], { name: 'Teste TASK-04' })
  if (!token.value) throw new Error('Token de teste não emitido')
  return { id: user.id, token: token.value.release() }
}

async function createFixtures(diaristaUserId?: string) {
  const clientId = randomUUID()
  const diaristaId = randomUUID()
  const serviceTypeId = randomUUID()
  const suffix = randomUUID().replace(/\D/g, '').slice(0, 9).padEnd(9, '1')
  await db.table('clients').insert({
    id: clientId,
    name: 'Ana Souza',
    phone: `11${suffix}`,
    street: 'Rua das Flores',
    number: '42',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
  })
  await db.table('diaristas').insert({
    id: diaristaId,
    user_id: diaristaUserId ?? null,
    name: 'Carla Lima',
    phone: `11${randomUUID().replace(/\D/g, '').slice(0, 9).padEnd(9, '2')}`,
    status: 'ATIVA',
  })
  await db.table('service_types').insert({
    id: serviceTypeId,
    name: `Limpeza ${randomUUID()}`,
    reference_price: 180,
    default_duration: '03:00:00',
    active: true,
  })
  return { clientId, diaristaId, serviceTypeId }
}

async function seedAppointment(
  fixture: Fixtures,
  options: {
    status?: AppointmentStatus
    date?: string
    start?: string
    end?: string
    diaristaId?: string | null
  } = {}
): Promise<string> {
  const id = randomUUID()
  const date = options.date ?? today()
  const start = options.start ?? '09:00:00'
  const end = options.end ?? '12:00:00'
  await db.table('appointments').insert({
    id,
    appointment_code: `RO-${randomUUID().slice(0, 12)}`,
    client_id: fixture.clientId,
    diarista_id: options.diaristaId === undefined ? fixture.diaristaId : options.diaristaId,
    service_type_id: fixture.serviceTypeId,
    service_date: date,
    start_time: start,
    end_time: end,
    schedule_range: db.raw("tstzrange(?::timestamptz, ?::timestamptz, '[)')", [
      `${date}T${start}-03:00`,
      `${date}T${end}-03:00`,
    ]),
    status: options.status ?? 'SOLICITADO',
    client_price: 180,
    diarista_payout: 120,
    address_snapshot: address,
  })
  return id
}

async function stateMachine() {
  // O import dinâmico mantém o teste compilável antes da implementação (Red).
  const path: string = '#services/appointment_state_machine'
  const { default: AppointmentStateMachine } = await import(path)
  return new AppointmentStateMachine() as {
    canTransition: (from: AppointmentStatus, to: AppointmentStatus) => boolean
  }
}

test.group('TASK-04 | Ciclo de atendimento e avaliações', (group) => {
  group.setup(() => testUtils.db().migrate())
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('migrations preservam histórico e avaliações conforme a modelagem relacional', async ({
    assert,
  }) => {
    const expected = {
      appointment_status_history: [
        'id',
        'appointment_id',
        'from_status',
        'to_status',
        'changed_by_user_id',
        'reason_notes',
        'created_at',
      ],
      appointment_ratings: [
        'id',
        'appointment_id',
        'diarista_id',
        'rating',
        'comment',
        'created_by_user_id',
        'created_at',
      ],
    } as const
    for (const [table, names] of Object.entries(expected)) {
      const columns = await db
        .from('information_schema.columns')
        .select('column_name', 'data_type', 'is_nullable')
        .where({ table_schema: 'public', table_name: table })
      assert.deepEqual(columns.map((column) => column.column_name).sort(), [...names].sort())
      assert.equal(columns.find((column) => column.column_name === 'id')?.data_type, 'uuid')
    }
    const rating = await db
      .from('information_schema.columns')
      .where({ table_schema: 'public', table_name: 'appointment_ratings', column_name: 'rating' })
      .first()
    assert.equal(rating?.data_type, 'smallint')
    assert.equal(rating?.is_nullable, 'NO')
  })

  test('models mapeiam histórico e avaliação às tabelas da modelagem', async ({ assert }) => {
    const historyPath: string = '#models/appointment_status_history'
    const ratingPath: string = '#models/appointment_rating'
    const { default: History } = await import(historyPath)
    const { default: Rating } = await import(ratingPath)
    assert.equal(History.table, 'appointment_status_history')
    assert.equal(Rating.table, 'appointment_ratings')
  })

  test('máquina de estados aceita apenas avanços consecutivos e cancelamento antes da finalização', async ({
    assert,
  }) => {
    const machine = await stateMachine()
    const sequence: AppointmentStatus[] = [
      'SOLICITADO',
      'ORCAMENTO_ENVIADO',
      'APROVADO',
      'AGENDADO',
      'EM_ANDAMENTO',
      'FINALIZADO',
    ]
    for (let index = 0; index < sequence.length - 1; index++) {
      assert.isTrue(machine.canTransition(sequence[index], sequence[index + 1]))
      assert.isTrue(machine.canTransition(sequence[index], 'CANCELADO'))
      assert.isFalse(machine.canTransition(sequence[index + 1], sequence[index]))
      assert.isFalse(machine.canTransition(sequence[index], sequence[index]))
      if (index + 2 < sequence.length) {
        assert.isFalse(machine.canTransition(sequence[index], sequence[index + 2]))
      }
    }
    assert.isFalse(machine.canTransition('FINALIZADO', 'CANCELADO'))
    assert.isFalse(machine.canTransition('CANCELADO', 'AGENDADO'))
  })

  test('ADMIN abre atendimento SOLICITADO e registra auditoria inicial com autor e timestamp', async ({
    client,
    assert,
  }) => {
    const admin = await createIdentity('ADMIN')
    const fixture = await createFixtures()
    const response = await client
      .post('/api/v1/appointments')
      .bearerToken(admin.token)
      .json({
        client_id: fixture.clientId,
        service_type_id: fixture.serviceTypeId,
        service_date: today(),
        start_time: '09:00:00',
        end_time: '12:00:00',
        client_price: 180,
        diarista_payout: 120,
        address_snapshot: address,
      } as never)
    response.assertStatus(201)
    const id = response.body().data.id as string
    const appointment = await db.from('appointments').where('id', id).first()
    assert.equal(appointment?.status, 'SOLICITADO')
    assert.isString(appointment?.appointment_code)
    assert.equal(appointment?.client_id, fixture.clientId)
    const history = await db.from('appointment_status_history').where('appointment_id', id)
    assert.lengthOf(history, 1)
    assert.isNull(history[0].from_status)
    assert.equal(history[0].to_status, 'SOLICITADO')
    assert.equal(history[0].changed_by_user_id, admin.id)
    assert.isNotNull(history[0].created_at)
  })

  test('abertura rejeita referência inexistente sem criar atendimento ou histórico', async ({
    client,
    assert,
  }) => {
    const admin = await createIdentity('ADMIN')
    const fixture = await createFixtures()
    const response = await client
      .post('/api/v1/appointments')
      .bearerToken(admin.token)
      .json({
        client_id: randomUUID(),
        service_type_id: fixture.serviceTypeId,
        service_date: today(),
        start_time: '09:00:00',
        end_time: '12:00:00',
        client_price: 180,
        diarista_payout: 120,
        address_snapshot: address,
      } as never)
    response.assertStatus(422)
    assert.include(JSON.stringify(response.body()), 'não existe')
    assert.lengthOf(
      await db.from('appointments').where('service_type_id', fixture.serviceTypeId),
      0
    )
    assert.lengthOf(await db.from('appointment_status_history'), 0)
  })

  test('rotas rejeitam ID malformado com 422 e retornam 404 para atendimento ausente', async ({
    client,
  }) => {
    const admin = await createIdentity('ADMIN')
    const invalidStatus = await client
      .patch('/api/v1/appointments/identificador-invalido/status')
      .bearerToken(admin.token)
      .json({ status: 'CANCELADO' } as never)
    invalidStatus.assertStatus(422)
    const invalidRating = await client
      .post('/api/v1/appointments/identificador-invalido/rating')
      .bearerToken(admin.token)
      .json({ rating: 5 } as never)
    invalidRating.assertStatus(422)
    const missing = await client
      .patch(`/api/v1/appointments/${randomUUID()}/status`)
      .bearerToken(admin.token)
      .json({ status: 'CANCELADO' } as never)
    missing.assertStatus(404)
  })

  test('transições válidas registram histórico, autor e atualizam a diarista ao iniciar', async ({
    client,
    assert,
  }) => {
    const admin = await createIdentity('ADMIN')
    const fixture = await createFixtures()
    const id = await seedAppointment(fixture)
    const sequence: AppointmentStatus[] = [
      'ORCAMENTO_ENVIADO',
      'APROVADO',
      'AGENDADO',
      'EM_ANDAMENTO',
      'FINALIZADO',
    ]
    for (const status of sequence) {
      const response = await client
        .patch(`/api/v1/appointments/${id}/status`)
        .bearerToken(admin.token)
        .json({ status, reason_notes: `Avanço para ${status}` } as never)
      response.assertStatus(200)
      const appointment = await db.from('appointments').where('id', id).first()
      assert.equal(appointment?.status, status)
      if (status === 'EM_ANDAMENTO') {
        const diarista = await db.from('diaristas').where('id', fixture.diaristaId).first()
        assert.equal(diarista?.status, 'EM_SERVICO')
      }
    }
    const history = await db
      .from('appointment_status_history')
      .where('appointment_id', id)
      .orderBy('created_at')
    assert.lengthOf(history, sequence.length)
    assert.equal(history[0].from_status, 'SOLICITADO')
    assert.equal(history[0].to_status, 'ORCAMENTO_ENVIADO')
    for (const row of history) {
      assert.equal(row.changed_by_user_id, admin.id)
      assert.isNotNull(row.created_at)
      assert.include(row.reason_notes, 'Avanço')
    }
    const finished = await db.from('appointments').where('id', id).first()
    assert.isNotNull(finished?.finished_at)
  })

  test('rejeita salto de etapa, estado repetido e AGENDADO sem diarista', async ({ client }) => {
    const admin = await createIdentity('ADMIN')
    const fixture = await createFixtures()
    const id = await seedAppointment(fixture)
    const skip = await client
      .patch(`/api/v1/appointments/${id}/status`)
      .bearerToken(admin.token)
      .json({ status: 'AGENDADO' } as never)
    skip.assertStatus(422)
    const repeat = await client
      .patch(`/api/v1/appointments/${id}/status`)
      .bearerToken(admin.token)
      .json({ status: 'SOLICITADO' } as never)
    repeat.assertStatus(422)
    const unassigned = await seedAppointment(fixture, {
      status: 'APROVADO',
      diaristaId: null,
      start: '13:00:00',
      end: '16:00:00',
    })
    const missingDiarista = await client
      .patch(`/api/v1/appointments/${unassigned}/status`)
      .bearerToken(admin.token)
      .json({ status: 'AGENDADO' } as never)
    missingDiarista.assertStatus(422)
  })

  test('conflito ao avançar status devolve 422 com horários e não grava histórico', async ({
    client,
    assert,
  }) => {
    const admin = await createIdentity('ADMIN')
    const fixture = await createFixtures()
    const firstId = await seedAppointment(fixture)
    const secondId = await seedAppointment(fixture)
    const first = await client
      .patch(`/api/v1/appointments/${firstId}/status`)
      .bearerToken(admin.token)
      .json({ status: 'ORCAMENTO_ENVIADO' } as never)
    first.assertStatus(200)
    const conflict = await client
      .patch(`/api/v1/appointments/${secondId}/status`)
      .bearerToken(admin.token)
      .json({ status: 'ORCAMENTO_ENVIADO' } as never)
    conflict.assertStatus(422)
    assert.include(JSON.stringify(conflict.body()), '09:00')
    assert.include(JSON.stringify(conflict.body()), '12:00')
    const history = await db.from('appointment_status_history').where('appointment_id', secondId)
    assert.lengthOf(history, 0)
  })

  test('permite cancelar antes do fim e bloqueia qualquer transição após FINALIZADO', async ({
    client,
    assert,
  }) => {
    const admin = await createIdentity('ADMIN')
    const fixture = await createFixtures()
    const cancellable = await seedAppointment(fixture)
    const cancelled = await client
      .patch(`/api/v1/appointments/${cancellable}/status`)
      .bearerToken(admin.token)
      .json({ status: 'CANCELADO', reason_notes: 'Cliente desistiu' } as never)
    cancelled.assertStatus(200)
    const row = await db
      .from('appointment_status_history')
      .where({ appointment_id: cancellable, to_status: 'CANCELADO' })
      .first()
    assert.equal(row?.reason_notes, 'Cliente desistiu')
    const finalized = await seedAppointment(fixture, {
      status: 'FINALIZADO',
      start: '13:00:00',
      end: '16:00:00',
    })
    const forbidden = await client
      .patch(`/api/v1/appointments/${finalized}/status`)
      .bearerToken(admin.token)
      .json({ status: 'CANCELADO' } as never)
    forbidden.assertStatus(422)
  })

  test('avaliação de atendimento finalizado recalcula média e total da diarista', async ({
    client,
    assert,
  }) => {
    const admin = await createIdentity('ADMIN')
    const fixture = await createFixtures()
    const firstId = await seedAppointment(fixture, { status: 'FINALIZADO' })
    const secondId = await seedAppointment(fixture, {
      status: 'FINALIZADO',
      start: '13:00:00',
      end: '16:00:00',
    })
    for (const [id, rating] of [
      [firstId, 5],
      [secondId, 1],
    ] as const) {
      const response = await client
        .post(`/api/v1/appointments/${id}/rating`)
        .bearerToken(admin.token)
        .json({ rating, comment: 'Feedback da cliente' } as never)
      response.assertStatus(201)
    }
    const ratings = await db.from('appointment_ratings').where('diarista_id', fixture.diaristaId)
    assert.lengthOf(ratings, 2)
    assert.equal(ratings[0].created_by_user_id, admin.id)
    const diarista = await db.from('diaristas').where('id', fixture.diaristaId).first()
    assert.equal(Number(diarista?.average_rating), 3)
    assert.equal(diarista?.total_ratings, 2)
  })

  test('avaliação rejeita nota fora de 1 a 5, duplicidade e atendimento não finalizado', async ({
    client,
  }) => {
    const admin = await createIdentity('ADMIN')
    const fixture = await createFixtures()
    const pending = await seedAppointment(fixture)
    const finalized = await seedAppointment(fixture, {
      status: 'FINALIZADO',
      start: '13:00:00',
      end: '16:00:00',
    })
    for (const rating of [0, 6]) {
      const invalid = await client
        .post(`/api/v1/appointments/${finalized}/rating`)
        .bearerToken(admin.token)
        .json({ rating } as never)
      invalid.assertStatus(422)
    }
    const premature = await client
      .post(`/api/v1/appointments/${pending}/rating`)
      .bearerToken(admin.token)
      .json({ rating: 4 } as never)
    premature.assertStatus(422)
    const first = await client
      .post(`/api/v1/appointments/${finalized}/rating`)
      .bearerToken(admin.token)
      .json({ rating: 4 } as never)
    first.assertStatus(201)
    const duplicate = await client
      .post(`/api/v1/appointments/${finalized}/rating`)
      .bearerToken(admin.token)
      .json({ rating: 3 } as never)
    duplicate.assertStatus(422)
  })

  test('trigger do PostgreSQL recalcula média também ao atualizar nota diretamente', async ({
    assert,
  }) => {
    const admin = await createIdentity('ADMIN')
    const fixture = await createFixtures()
    const id = await seedAppointment(fixture, { status: 'FINALIZADO' })
    const ratingId = randomUUID()
    await db.table('appointment_ratings').insert({
      id: ratingId,
      appointment_id: id,
      diarista_id: fixture.diaristaId,
      rating: 2,
      created_by_user_id: admin.id,
    })
    const firstAverage = await db.from('diaristas').where('id', fixture.diaristaId).first()
    assert.equal(Number(firstAverage?.average_rating), 2)
    await db.from('appointment_ratings').where('id', ratingId).update({ rating: 4 })
    const updatedAverage = await db.from('diaristas').where('id', fixture.diaristaId).first()
    assert.equal(Number(updatedAverage?.average_rating), 4)
  })

  test('rotas administrativas exigem autenticação e recusam perfil DIARISTA', async ({
    client,
  }) => {
    const diarista = await createIdentity('DIARISTA')
    const fixture = await createFixtures(diarista.id)
    const id = await seedAppointment(fixture, { status: 'FINALIZADO' })
    const anonymous = await client
      .post(`/api/v1/appointments/${id}/rating`)
      .json({ rating: 5 } as never)
    anonymous.assertStatus(401)
    const forbidden = await client
      .post(`/api/v1/appointments/${id}/rating`)
      .bearerToken(diarista.token)
      .json({ rating: 5 } as never)
    forbidden.assertStatus(403)
    const statusChange = await client
      .patch(`/api/v1/appointments/${id}/status`)
      .bearerToken(diarista.token)
      .json({ status: 'CANCELADO' } as never)
    statusChange.assertStatus(403)
  })

  test('diarista inicia apenas o próprio atendimento na data agendada e pode finalizá-lo', async ({
    client,
    assert,
  }) => {
    const diarista = await createIdentity('DIARISTA')
    const unrelated = await createIdentity('DIARISTA')
    const fixture = await createFixtures(diarista.id)
    const id = await seedAppointment(fixture, { status: 'AGENDADO' })
    const denied = await client
      .patch(`/api/v1/appointments/${id}/status`)
      .bearerToken(unrelated.token)
      .json({ status: 'EM_ANDAMENTO' } as never)
    denied.assertStatus(403)

    const tomorrow = DateTime.now().setZone('America/Sao_Paulo').plus({ days: 1 }).toISODate()!
    const futureId = await seedAppointment(fixture, { status: 'AGENDADO', date: tomorrow })
    const early = await client
      .patch(`/api/v1/appointments/${futureId}/status`)
      .bearerToken(diarista.token)
      .json({ status: 'EM_ANDAMENTO' } as never)
    early.assertStatus(422)

    const started = await client
      .patch(`/api/v1/appointments/${id}/status`)
      .bearerToken(diarista.token)
      .json({ status: 'EM_ANDAMENTO' } as never)
    started.assertStatus(200)
    const startedRow = await db.from('appointments').where('id', id).first()
    assert.isNotNull(startedRow?.started_at)
    const finished = await client
      .patch(`/api/v1/appointments/${id}/status`)
      .bearerToken(diarista.token)
      .json({ status: 'FINALIZADO' } as never)
    finished.assertStatus(200)
  })
})

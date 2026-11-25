import { randomUUID } from 'node:crypto'
import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import hash from '@adonisjs/core/services/hash'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'

type Role = 'ADMIN' | 'DIARISTA'
type AppointmentStatus = 'SOLICITADO' | 'AGENDADO' | 'CANCELADO'

const serviceDate = '2027-02-15'
const address = 'Rua das Flores, 42, Centro, São Paulo - SP'

async function createIdentity(role: Role): Promise<{ token: string; userId: string }> {
  const user = await User.create({
    id: randomUUID(),
    name: `Usuário ${role}`,
    email: `${role.toLowerCase()}.${randomUUID()}@organizamais.test`,
    passwordHash: await hash.make('SenhaSegura@123'),
    role,
    active: true,
  })
  const accessToken = await User.accessTokens.create(user, ['*'], { name: 'Teste de agenda' })
  if (!accessToken.value) throw new Error('Token de teste não emitido')
  return { token: accessToken.value.release(), userId: user.id }
}

async function createFixtures(diaristaUserId?: string) {
  const clientId = randomUUID()
  const diaristaId = randomUUID()
  const serviceTypeId = randomUUID()
  await db.table('clients').insert({
    id: clientId,
    name: 'Ana Souza',
    phone: `11${Math.floor(100000000 + Math.random() * 900000000)}`,
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
    phone: `11${Math.floor(100000000 + Math.random() * 900000000)}`,
    status: 'ATIVA',
  })
  await db.table('service_types').insert({
    id: serviceTypeId,
    name: `Limpeza ${randomUUID()}`,
    reference_price: 180,
    default_duration: '04:00:00',
    active: true,
  })
  return { clientId, diaristaId, serviceTypeId }
}

async function createAppointment(
  fixture: Awaited<ReturnType<typeof createFixtures>>,
  options: {
    date?: string
    start?: string
    end?: string
    status?: AppointmentStatus
    diaristaId?: string
  } = {}
): Promise<string> {
  const id = randomUUID()
  const date = options.date ?? serviceDate
  const start = options.start ?? '09:00:00'
  const end = options.end ?? '12:00:00'
  await db.table('appointments').insert({
    id,
    appointment_code: `RO-${randomUUID().slice(0, 12)}`,
    client_id: fixture.clientId,
    diarista_id: options.diaristaId ?? fixture.diaristaId,
    service_type_id: fixture.serviceTypeId,
    service_date: date,
    start_time: start,
    end_time: end,
    schedule_range: db.raw("tstzrange(?::timestamptz, ?::timestamptz, '[)')", [
      `${date}T${start}-03:00`,
      `${date}T${end}-03:00`,
    ]),
    status: options.status ?? 'AGENDADO',
    client_price: 180,
    diarista_payout: 120,
    address_snapshot: address,
  })
  return id
}

async function schedulingService() {
  // Importação em tempo de execução permite que o teste permaneça tipado na fase Red.
  const path: string = '#services/scheduling_service'
  const { default: SchedulingService } = await import(path)
  return new SchedulingService() as {
    checkConflict: (
      diaristaId: string,
      date: string,
      startTime: string,
      endTime: string,
      excludeAppointmentId?: string
    ) => Promise<unknown[]>
    getCalendarEvents: (
      viewMode: 'day' | 'week' | 'month',
      dateReference: Date,
      filters?: { diaristaId?: string; status?: string }
    ) => Promise<unknown>
  }
}

test.group('TASK-03 | Motor de agenda e prevenção de conflitos', (group) => {
  group.setup(() => testUtils.db().migrate())
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('migration preserva a tabela e as colunas de appointments da modelagem', async ({
    assert,
  }) => {
    const columns = await db
      .from('information_schema.columns')
      .select('column_name', 'data_type', 'is_nullable')
      .where({ table_schema: 'public', table_name: 'appointments' })
    assert.deepEqual(
      columns.map((column) => column.column_name).sort(),
      [
        'id',
        'appointment_code',
        'client_id',
        'diarista_id',
        'service_type_id',
        'service_date',
        'start_time',
        'end_time',
        'schedule_range',
        'status',
        'client_price',
        'diarista_payout',
        'additional_costs',
        'address_snapshot',
        'observations',
        'confirmed_by_diarista_at',
        'started_at',
        'finished_at',
        'checkin_latitude',
        'checkin_longitude',
        'checkout_latitude',
        'checkout_longitude',
        'created_at',
        'updated_at',
      ].sort()
    )
    assert.equal(columns.find((column) => column.column_name === 'id')?.data_type, 'uuid')
    assert.equal(columns.find((column) => column.column_name === 'service_date')?.data_type, 'date')
    assert.equal(
      columns.find((column) => column.column_name === 'schedule_range')?.data_type,
      'tstzrange'
    )
    assert.equal(
      columns.find((column) => column.column_name === 'schedule_range')?.is_nullable,
      'NO'
    )
  })

  test('Model Appointment representa a tabela appointments', async ({ assert }) => {
    const path: string = '#models/appointment'
    const { default: Appointment } = await import(path)
    assert.equal(Appointment.table, 'appointments')
  })

  test('checkConflict encontra sobreposição parcial e total e informa o intervalo', async ({
    assert,
  }) => {
    const fixture = await createFixtures()
    await createAppointment(fixture)
    const service = await schedulingService()
    for (const [start, end] of [
      ['08:00:00', '10:00:00'],
      ['10:00:00', '11:00:00'],
      ['11:00:00', '13:00:00'],
      ['08:00:00', '13:00:00'],
    ]) {
      const conflicts = await service.checkConflict(fixture.diaristaId, serviceDate, start, end)
      assert.isNotEmpty(conflicts)
      assert.include(JSON.stringify(conflicts), '09:00')
      assert.include(JSON.stringify(conflicts), '12:00')
    }
  })

  test('checkConflict aceita horários adjacentes, outra data e outra diarista', async ({
    assert,
  }) => {
    const fixture = await createFixtures()
    await createAppointment(fixture)
    const otherDiarista = await createFixtures()
    const service = await schedulingService()
    assert.isEmpty(
      await service.checkConflict(fixture.diaristaId, serviceDate, '08:00:00', '09:00:00')
    )
    assert.isEmpty(
      await service.checkConflict(fixture.diaristaId, serviceDate, '12:00:00', '13:00:00')
    )
    assert.isEmpty(
      await service.checkConflict(fixture.diaristaId, '2027-02-16', '09:00:00', '12:00:00')
    )
    assert.isEmpty(
      await service.checkConflict(otherDiarista.diaristaId, serviceDate, '09:00:00', '12:00:00')
    )
  })

  test('checkConflict ignora atendimentos cancelados ou solicitados e o próprio agendamento na edição', async ({
    assert,
  }) => {
    const fixture = await createFixtures()
    const ownId = await createAppointment(fixture)
    await createAppointment(fixture, { start: '14:00:00', end: '16:00:00', status: 'CANCELADO' })
    await createAppointment(fixture, { start: '17:00:00', end: '19:00:00', status: 'SOLICITADO' })
    const service = await schedulingService()
    assert.isEmpty(
      await service.checkConflict(fixture.diaristaId, serviceDate, '09:00:00', '12:00:00', ownId)
    )
    assert.isEmpty(
      await service.checkConflict(fixture.diaristaId, serviceDate, '14:00:00', '16:00:00')
    )
    assert.isEmpty(
      await service.checkConflict(fixture.diaristaId, serviceDate, '17:00:00', '19:00:00')
    )
  })

  test('getCalendarEvents delimita dia, semana e mês e filtra diarista e status', async ({
    assert,
  }) => {
    const fixture = await createFixtures()
    const other = await createFixtures()
    const wantedId = await createAppointment(fixture)
    await createAppointment(fixture, { date: '2027-02-16', status: 'CANCELADO' })
    await createAppointment(fixture, { date: '2027-03-01' })
    await createAppointment(other, { date: serviceDate })
    const service = await schedulingService()
    const day = await service.getCalendarEvents('day', new Date('2027-02-15T12:00:00-03:00'), {
      diaristaId: fixture.diaristaId,
      status: 'AGENDADO',
    })
    assert.include(JSON.stringify(day), wantedId)
    assert.notInclude(JSON.stringify(day), other.diaristaId)
    const week = await service.getCalendarEvents('week', new Date('2027-02-15T12:00:00-03:00'))
    assert.include(JSON.stringify(week), '2027-02-16')
    assert.notInclude(JSON.stringify(week), '2027-03-01')
    const month = await service.getCalendarEvents('month', new Date('2027-02-15T12:00:00-03:00'))
    assert.include(JSON.stringify(month), '2027-02-16')
    assert.notInclude(JSON.stringify(month), '2027-03-01')
  })

  test('GET /agenda entrega blocos de calendário com cliente, diarista, endereço, status e cor', async ({
    client,
    assert,
  }) => {
    const { token } = await createIdentity('ADMIN')
    const fixture = await createFixtures()
    await createAppointment(fixture)
    const response = await client
      .get(`/api/v1/agenda?view=day&date=${serviceDate}`)
      .bearerToken(token)
    response.assertStatus(200)
    const body = JSON.stringify(response.body())
    for (const value of ['Ana Souza', 'Carla Lima', address, 'AGENDADO']) {
      assert.include(body, value)
    }
    assert.match(body, /color|cor/i)
  })

  test('POST /agenda/check-availability confirma horário livre e rejeita conflito com 422 detalhado', async ({
    client,
    assert,
  }) => {
    const { token } = await createIdentity('ADMIN')
    const fixture = await createFixtures()
    await createAppointment(fixture)
    const payload = {
      diarista_id: fixture.diaristaId,
      service_date: serviceDate,
      start_time: '10:00:00',
      end_time: '11:00:00',
    }
    const conflict = await client
      .post('/api/v1/agenda/check-availability')
      .bearerToken(token)
      .json(payload as never)
    conflict.assertStatus(422)
    assert.include(JSON.stringify(conflict.body()), '09:00')
    assert.include(JSON.stringify(conflict.body()), '12:00')
    const free = await client
      .post('/api/v1/agenda/check-availability')
      .bearerToken(token)
      .json({ ...payload, start_time: '12:00:00', end_time: '13:00:00' } as never)
    free.assertStatus(200)
  })

  test('API valida data e intervalo, exige autenticação e restringe a própria agenda da diarista', async ({
    client,
    assert,
  }) => {
    const admin = await createIdentity('ADMIN')
    const diarista = await createIdentity('DIARISTA')
    const own = await createFixtures(diarista.userId)
    const other = await createFixtures()
    await createAppointment(own)
    await createAppointment(other)
    const anonymous = await client.get(`/api/v1/agenda?view=day&date=${serviceDate}`)
    anonymous.assertStatus(401)
    const invalid = await client
      .post('/api/v1/agenda/check-availability')
      .bearerToken(admin.token)
      .json({
        diarista_id: own.diaristaId,
        service_date: serviceDate,
        start_time: '12:00:00',
        end_time: '09:00:00',
      } as never)
    invalid.assertStatus(422)
    assert.isNotEmpty(JSON.stringify(invalid.body()))
    const forbidden = await client
      .post('/api/v1/agenda/check-availability')
      .bearerToken(diarista.token)
      .json({
        diarista_id: other.diaristaId,
        service_date: serviceDate,
        start_time: '12:00:00',
        end_time: '13:00:00',
      } as never)
    forbidden.assertStatus(403)
    const ownCalendar = await client
      .get(`/api/v1/agenda?view=day&date=${serviceDate}`)
      .bearerToken(diarista.token)
    ownCalendar.assertStatus(200)
    assert.include(JSON.stringify(ownCalendar.body()), own.diaristaId)
    assert.notInclude(JSON.stringify(ownCalendar.body()), other.diaristaId)
  })

  test('agenda rejeita filtros inválidos com mensagens claras', async ({ client, assert }) => {
    const { token } = await createIdentity('ADMIN')
    for (const [query, message] of [
      ['view=year&date=2027-02-15', 'Visualização'],
      ['view=day&date=2027-02-30', 'data válida'],
      ['view=day&date=2027-02-15&status=DESCONHECIDO', 'Status'],
      ['view=day&date=2027-02-15&diarista_id=incorreto', 'Diarista'],
    ]) {
      const response = await client.get(`/api/v1/agenda?${query}`).bearerToken(token)
      response.assertStatus(422)
      assert.include(JSON.stringify(response.body()), message)
    }
  })

  test('disponibilidade rejeita diarista inexistente e data inválida com 422', async ({
    client,
    assert,
  }) => {
    const { token } = await createIdentity('ADMIN')
    const payload = {
      diarista_id: randomUUID(),
      service_date: serviceDate,
      start_time: '09:00:00',
      end_time: '12:00:00',
    }
    const missing = await client
      .post('/api/v1/agenda/check-availability')
      .bearerToken(token)
      .json(payload as never)
    missing.assertStatus(422)
    assert.include(JSON.stringify(missing.body()), 'Diarista')
    const invalidDate = await client
      .post('/api/v1/agenda/check-availability')
      .bearerToken(token)
      .json({ ...payload, service_date: '2027-02-30' } as never)
    invalidDate.assertStatus(422)
    assert.include(JSON.stringify(invalidDate.body()), 'data válida')
  })
})

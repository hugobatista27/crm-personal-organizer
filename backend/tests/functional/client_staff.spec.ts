import { randomUUID } from 'node:crypto'
import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import hash from '@adonisjs/core/services/hash'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'

type Role = 'ADMIN' | 'DIARISTA'
type Credentials = { email: string; password: string }

const clientPayload = (phone = '(11) 98765-4321') => ({
  name: 'Ana Souza',
  phone,
  street: 'Rua das Flores',
  number: '42',
  neighborhood: 'Centro',
  city: 'São Paulo',
  state: 'SP',
})

const diaristaPayload = (phone = '11987654322') => ({
  name: 'Carla Lima',
  phone,
  status: 'ATIVA',
})

const servicePayload = () => ({
  name: 'Limpeza Residencial',
  reference_price: 180,
  default_duration: '04:00:00',
  active: true,
})

async function tokenFor(role: Role): Promise<string> {
  const credentials: Credentials = {
    email: `${role.toLowerCase()}.${randomUUID()}@organizamais.test`,
    password: 'SenhaSegura@123',
  }
  const user = await User.create({
    id: randomUUID(),
    name: `Usuário ${role}`,
    email: credentials.email,
    passwordHash: await hash.make(credentials.password),
    role,
    active: true,
  })
  const token = await User.accessTokens.create(user, ['*'], { name: 'Teste funcional' })
  if (!token.value) throw new Error('Token de teste não foi emitido')
  return token.value.release()
}

test.group('TASK-02 | Clientes, diaristas e serviços', (group) => {
  group.setup(() => testUtils.db().migrate())
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('migrations preservam os nomes de tabelas e colunas da modelagem', async ({ assert }) => {
    const expected = {
      clients: [
        'id',
        'name',
        'phone',
        'alternative_phone',
        'email',
        'street',
        'number',
        'complement',
        'neighborhood',
        'city',
        'state',
        'zip_code',
        'latitude',
        'longitude',
        'notes',
        'created_at',
        'updated_at',
      ],
      diaristas: [
        'id',
        'user_id',
        'name',
        'phone',
        'document_cpf',
        'photo_url',
        'status',
        'average_rating',
        'total_ratings',
        'bio_notes',
        'created_at',
        'updated_at',
      ],
      service_types: [
        'id',
        'name',
        'description',
        'reference_price',
        'default_duration',
        'active',
        'created_at',
        'updated_at',
      ],
      diarista_specialties: ['id', 'diarista_id', 'service_type_id', 'created_at'],
    } as const

    for (const [table, names] of Object.entries(expected)) {
      const columns = await db
        .from('information_schema.columns')
        .select('column_name', 'data_type')
        .where({ table_schema: 'public', table_name: table })
      assert.deepEqual(columns.map((column) => column.column_name).sort(), [...names].sort())
      assert.equal(columns.find((column) => column.column_name === 'id')?.data_type, 'uuid')
    }
    const duration = await db
      .from('information_schema.columns')
      .where({
        table_schema: 'public',
        table_name: 'service_types',
        column_name: 'default_duration',
      })
      .first()
    assert.equal(duration?.data_type, 'interval')
  })

  test('cliente: ADMIN cria, consulta, atualiza e exclui com telefone normalizado', async ({
    client,
    assert,
  }) => {
    const token = await tokenFor('ADMIN')
    const created = await client
      .post('/api/v1/clients')
      .bearerToken(token)
      .json(clientPayload() as never)
    created.assertStatus(201)
    const id = created.body().data.id as string
    assert.equal(created.body().data.phone, '11987654321')
    const found = await client.get(`/api/v1/clients/${id}`).bearerToken(token)
    found.assertStatus(200)
    found.assertBodyContains({ data: { id, name: 'Ana Souza' } })
    const updated = await client
      .put(`/api/v1/clients/${id}`)
      .bearerToken(token)
      .json({ notes: 'Portaria 24 horas' } as never)
    updated.assertStatus(200)
    updated.assertBodyContains({ data: { notes: 'Portaria 24 horas' } })
    const removed = await client.delete(`/api/v1/clients/${id}`).bearerToken(token)
    removed.assertStatus(200)
    const missing = await client.get(`/api/v1/clients/${id}`).bearerToken(token)
    missing.assertStatus(404)
  })

  test('cliente: rejeita telefone duplicado mesmo com máscara diferente', async ({ client }) => {
    const token = await tokenFor('ADMIN')
    const first = await client
      .post('/api/v1/clients')
      .bearerToken(token)
      .json(clientPayload() as never)
    first.assertStatus(201)
    const duplicate = await client
      .post('/api/v1/clients')
      .bearerToken(token)
      .json(clientPayload('11987654321') as never)
    duplicate.assertStatus(422)
  })

  test('cliente: valida campos obrigatórios e telefone com DDD', async ({ client }) => {
    const token = await tokenFor('ADMIN')
    const response = await client
      .post('/api/v1/clients')
      .bearerToken(token)
      .json({ name: 'Ana', phone: '123' } as never)
    response.assertStatus(422)
  })

  test('cliente: busca por nome ou telefone e pagina resultados', async ({ client, assert }) => {
    const token = await tokenFor('ADMIN')
    await client
      .post('/api/v1/clients')
      .bearerToken(token)
      .json(clientPayload() as never)
    await client
      .post('/api/v1/clients')
      .bearerToken(token)
      .json({ ...clientPayload('11987654323'), name: 'Beatriz' } as never)
    const byName = await client
      .get('/api/v1/clients?search=Ana&page=1&per_page=1')
      .bearerToken(token)
    byName.assertStatus(200)
    assert.equal(byName.body().data.length, 1)
    assert.equal(byName.body().data[0].name, 'Ana Souza')
    assert.equal(byName.body().meta.total, 1)
    const byPhone = await client.get('/api/v1/clients?search=11987654323').bearerToken(token)
    byPhone.assertStatus(200)
    assert.equal(byPhone.body().data[0].name, 'Beatriz')
  })

  test('cliente: requer autenticação e perfil ADMIN para escrita', async ({ client }) => {
    const anonymous = await client.post('/api/v1/clients').json(clientPayload() as never)
    anonymous.assertStatus(401)
    const token = await tokenFor('DIARISTA')
    const forbidden = await client
      .post('/api/v1/clients')
      .bearerToken(token)
      .json(clientPayload() as never)
    forbidden.assertStatus(403)
  })

  test('tipo de serviço: ADMIN cria, lista, atualiza e exclui com duração INTERVAL', async ({
    client,
    assert,
  }) => {
    const token = await tokenFor('ADMIN')
    const created = await client
      .post('/api/v1/service-types')
      .bearerToken(token)
      .json(servicePayload() as never)
    created.assertStatus(201)
    const id = created.body().data.id as string
    const row = await db.from('service_types').where('id', id).first()
    assert.equal(row?.name, 'Limpeza Residencial')
    const listed = await client.get('/api/v1/service-types?page=1&per_page=10').bearerToken(token)
    listed.assertStatus(200)
    assert.equal(listed.body().meta.total, 1)
    const updated = await client
      .put(`/api/v1/service-types/${id}`)
      .bearerToken(token)
      .json({ active: false } as never)
    updated.assertStatus(200)
    const removed = await client.delete(`/api/v1/service-types/${id}`).bearerToken(token)
    removed.assertStatus(200)
  })

  test('tipo de serviço: rejeita preço negativo e acesso de DIARISTA à manutenção', async ({
    client,
  }) => {
    const admin = await tokenFor('ADMIN')
    const invalid = await client
      .post('/api/v1/service-types')
      .bearerToken(admin)
      .json({ ...servicePayload(), reference_price: -1 } as never)
    invalid.assertStatus(422)
    const diarista = await tokenFor('DIARISTA')
    const forbidden = await client
      .post('/api/v1/service-types')
      .bearerToken(diarista)
      .json(servicePayload() as never)
    forbidden.assertStatus(403)
  })

  test('diarista: CRUD mantém status, nota inicial e total de avaliações da modelagem', async ({
    client,
    assert,
  }) => {
    const token = await tokenFor('ADMIN')
    const created = await client
      .post('/api/v1/diaristas')
      .bearerToken(token)
      .json(diaristaPayload() as never)
    created.assertStatus(201)
    const id = created.body().data.id as string
    const row = await db.from('diaristas').where('id', id).first()
    assert.equal(row?.status, 'ATIVA')
    assert.equal(Number(row?.average_rating), 5)
    assert.equal(row?.total_ratings, 0)
    const found = await client.get(`/api/v1/diaristas/${id}`).bearerToken(token)
    found.assertStatus(200)
    const updated = await client
      .put(`/api/v1/diaristas/${id}`)
      .bearerToken(token)
      .json({ status: 'INATIVA', bio_notes: 'Disponível aos sábados' } as never)
    updated.assertStatus(200)
    const removed = await client.delete(`/api/v1/diaristas/${id}`).bearerToken(token)
    removed.assertStatus(200)
  })

  test('diarista: especialidades usam pivot sem duplicação e aparecem na listagem', async ({
    client,
    assert,
  }) => {
    const token = await tokenFor('ADMIN')
    const service = await client
      .post('/api/v1/service-types')
      .bearerToken(token)
      .json(servicePayload() as never)
    service.assertStatus(201)
    const serviceId = service.body().data.id as string
    const created = await client
      .post('/api/v1/diaristas')
      .bearerToken(token)
      .json({ ...diaristaPayload(), specialty_ids: [serviceId] } as never)
    created.assertStatus(201)
    const id = created.body().data.id as string
    const pivot = await db
      .from('diarista_specialties')
      .where({ diarista_id: id, service_type_id: serviceId })
    assert.lengthOf(pivot, 1)
    const listed = await client
      .get('/api/v1/diaristas?status=ATIVA&search=Carla&page=1&per_page=10')
      .bearerToken(token)
    listed.assertStatus(200)
    assert.equal(listed.body().meta.total, 1)
    assert.equal(listed.body().data[0].status, 'ATIVA')
    assert.equal(Number(listed.body().data[0].average_rating), 5)
    assert.lengthOf(listed.body().data[0].specialties, 1)
  })

  test('diarista: rejeita status inválido e duplicidade de telefone', async ({ client }) => {
    const token = await tokenFor('ADMIN')
    const invalid = await client
      .post('/api/v1/diaristas')
      .bearerToken(token)
      .json({ ...diaristaPayload(), status: 'LIVRE' } as never)
    invalid.assertStatus(422)
    const first = await client
      .post('/api/v1/diaristas')
      .bearerToken(token)
      .json(diaristaPayload() as never)
    first.assertStatus(201)
    const duplicate = await client
      .post('/api/v1/diaristas')
      .bearerToken(token)
      .json(diaristaPayload() as never)
    duplicate.assertStatus(422)
  })

  test('diarista: impede acesso anônimo e alteração por DIARISTA', async ({ client }) => {
    const anonymous = await client.get('/api/v1/diaristas')
    anonymous.assertStatus(401)
    const token = await tokenFor('DIARISTA')
    const forbidden = await client
      .post('/api/v1/diaristas')
      .bearerToken(token)
      .json(diaristaPayload() as never)
    forbidden.assertStatus(403)
  })

  test('atualizações rejeitam payload inválido com mensagem amigável', async ({
    client,
    assert,
  }) => {
    const token = await tokenFor('ADMIN')
    const created = await client
      .post('/api/v1/clients')
      .bearerToken(token)
      .json(clientPayload() as never)
    created.assertStatus(201)
    const id = created.body().data.id as string
    const invalidPhone = await client
      .put(`/api/v1/clients/${id}`)
      .bearerToken(token)
      .json({ phone: '123' } as never)
    invalidPhone.assertStatus(422)
    assert.include(JSON.stringify(invalidPhone.body()), 'celular com DDD')
    const invalidState = await client
      .put(`/api/v1/clients/${id}`)
      .bearerToken(token)
      .json({ state: 'SÃO PAULO' } as never)
    invalidState.assertStatus(422)
    const missing = await client
      .put(`/api/v1/clients/${randomUUID()}`)
      .bearerToken(token)
      .json({ notes: 'Teste' } as never)
    missing.assertStatus(404)
    assert.include(JSON.stringify(missing.body()), 'Registro não encontrado')
  })
})

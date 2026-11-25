import { randomUUID } from 'node:crypto'
import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import config from '@adonisjs/core/services/config'
import hash from '@adonisjs/core/services/hash'
import testUtils from '@adonisjs/core/services/test_utils'

type UserRole = 'ADMIN' | 'DIARISTA'

const password = 'SenhaSegura@123'

async function createUser(role: UserRole = 'ADMIN') {
  const id = randomUUID()
  const email = `${role.toLowerCase()}.${id}@organizamais.test`
  const now = new Date()

  await db.table('users').insert({
    id,
    name: role === 'ADMIN' ? 'Administradora Teste' : 'Diarista Teste',
    email,
    password_hash: await hash.make(password),
    role,
    active: true,
    created_at: now,
    updated_at: now,
  })

  return { id, email, role }
}

test.group('TASK-01 | Fundação do backend, autenticação e PostgreSQL', (group) => {
  group.setup(() => testUtils.db().migrate())
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('usa PostgreSQL e mantém o contrato relacional da tabela users', async ({ assert }) => {
    assert.equal(config.get('database.connection'), 'pg')

    const columns = await db
      .from('information_schema.columns')
      .select(['column_name', 'data_type', 'is_nullable'])
      .where('table_schema', 'public')
      .where('table_name', 'users')

    const columnNames = columns.map(({ column_name: columnName }) => columnName).sort()

    assert.deepEqual(columnNames, [
      'active',
      'created_at',
      'email',
      'id',
      'name',
      'password_hash',
      'role',
      'updated_at',
    ])
    const idColumn = columns.find(({ column_name: columnName }) => columnName === 'id')
    assert.equal(idColumn?.data_type, 'uuid')
    assert.equal(idColumn?.is_nullable, 'NO')
  })

  test('autentica credenciais válidas e retorna um Bearer access token', async ({
    client,
    assert,
  }) => {
    const user = await createUser('ADMIN')

    const response = await client.post('/api/v1/auth/login').json({
      email: user.email,
      password,
    })

    response.assertStatus(200)
    const body = response.body() as unknown as { data: { token: string } }
    assert.isString(body.data.token)
    assert.isNotEmpty(body.data.token)
  })

  test('rejeita credenciais inválidas sem emitir token', async ({ client, assert }) => {
    const user = await createUser('ADMIN')

    const response = await client.post('/api/v1/auth/login').json({
      email: user.email,
      password: 'senha-incorreta',
    })

    response.assertStatus(400)
    const body = response.body() as unknown as { data?: { token?: string }; token?: string }
    assert.isUndefined(body.token)
    assert.isUndefined(body.data?.token)
    assert.include(JSON.stringify(response.body()), 'Credenciais inválidas')
  })

  test('retorna 422 quando o payload de login é inválido', async ({ client }) => {
    const response = await client.post('/api/v1/auth/login').json({
      email: 'email-invalido',
    } as never)

    response.assertStatus(422)
  })

  test('protege GET /api/v1/auth/me contra acesso não autenticado', async ({ client }) => {
    const response = await client.get('/api/v1/auth/me')

    response.assertStatus(401)
  })

  test('retorna os dados e o perfil do usuário autenticado em GET /api/v1/auth/me', async ({
    client,
    assert,
  }) => {
    const user = await createUser('DIARISTA')
    const loginResponse = await client.post('/api/v1/auth/login').json({
      email: user.email,
      password,
    })
    const loginBody = loginResponse.body() as unknown as { data: { token: string } }
    const token = loginBody.data.token

    const response = await client.get('/api/v1/auth/me').bearerToken(token)

    response.assertStatus(200)
    response.assertBodyContains({
      data: {
        id: user.id,
        email: user.email,
        role: 'DIARISTA',
        active: true,
      },
    })
    const body = response.body() as unknown as { data: Record<string, unknown> }
    assert.notProperty(body.data, 'password_hash')
  })

  test('RoleMiddleware permite acesso ao perfil autorizado', async ({ assert }) => {
    const roleMiddlewarePath = '../../app/middleware/role_middleware.js'
    const { default: RoleMiddleware } = await import(roleMiddlewarePath)
    const middleware = new RoleMiddleware()
    let requestReachedHandler = false

    await middleware.handle(
      { auth: { user: { role: 'ADMIN' } } },
      async () => {
        requestReachedHandler = true
      },
      ['ADMIN']
    )

    assert.isTrue(requestReachedHandler)
  })

  test('RoleMiddleware retorna 403 ao perfil sem permissão', async ({ assert }) => {
    const roleMiddlewarePath = '../../app/middleware/role_middleware.js'
    const { default: RoleMiddleware } = await import(roleMiddlewarePath)
    const middleware = new RoleMiddleware()

    let status: number | undefined
    try {
      await middleware.handle({ auth: { user: { role: 'DIARISTA' } } }, async () => {}, ['ADMIN'])
      assert.fail('O middleware deveria negar o acesso da DIARISTA')
    } catch (error) {
      status = (error as { status?: number }).status
    }

    assert.equal(status, 403)
  })
})

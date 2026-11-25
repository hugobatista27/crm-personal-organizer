import User from '#models/user'
import { Exception } from '@adonisjs/core/exceptions'

export async function issueApiToken(user: User): Promise<string> {
  const token = await User.accessTokens.create(user, ['*'], { name: 'API' })
  if (!token.value) {
    throw new Exception('Não foi possível emitir o token de acesso.', { status: 500 })
  }

  return token.value.release()
}

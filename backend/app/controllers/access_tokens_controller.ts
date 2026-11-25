import User from '#models/user'
import { loginValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import UserTransformer from '#transformers/user_transformer'
import { issueApiToken } from '#services/auth_tokens'
import { Exception } from '@adonisjs/core/exceptions'

export default class AccessTokensController {
  async store({ request, serialize }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)

    let user: User
    try {
      user = await User.verifyCredentials(email, password)
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'E_INVALID_CREDENTIALS') {
        throw new Exception('Credenciais inválidas.', { status: 400 })
      }
      throw error
    }

    return serialize({ token: await issueApiToken(user), user: UserTransformer.transform(user) })
  }

  async destroy({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    if (user.currentAccessToken) {
      await User.accessTokens.delete(user, user.currentAccessToken.identifier)
    }

    return {
      message: 'Logged out successfully',
    }
  }
}

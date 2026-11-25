import User from '#models/user'
import { signupValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import UserTransformer from '#transformers/user_transformer'
import { issueApiToken } from '#services/auth_tokens'

export default class NewAccountController {
  async store({ request, serialize }: HttpContext) {
    const { name, email, password } = await request.validateUsing(signupValidator)

    const user = await User.create({
      name: name ?? '',
      email,
      passwordHash: await User.makePasswordHash(password),
    })
    return serialize({
      user: UserTransformer.transform(user),
      token: await issueApiToken(user),
    })
  }
}

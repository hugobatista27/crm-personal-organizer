import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type User from '#models/user'

export type UserRole = User['role']

export default class RoleMiddleware {
  async handle(ctx: HttpContext, next: NextFn, allowedRoles: UserRole[]) {
    const user = ctx.auth.user

    if (!user) {
      throw new Exception('Autenticação necessária para acessar este recurso.', { status: 401 })
    }

    if (!allowedRoles.includes(user.role)) {
      throw new Exception('Acesso negado para este perfil.', { status: 403 })
    }

    return next()
  }
}

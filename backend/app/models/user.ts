import { UserSchema } from '#database/schema'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { type AccessToken, DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import type { AccessTokenDbColumns } from '@adonisjs/auth/types/access_tokens'

class JsonbAccessTokensProvider<Model extends typeof User> extends DbAccessTokensProvider<Model> {
  protected override dbRowToAccessToken(dbRow: AccessTokenDbColumns): AccessToken {
    const abilities: unknown = dbRow.abilities
    return super.dbRowToAccessToken({
      ...dbRow,
      abilities: Array.isArray(abilities) ? JSON.stringify(abilities) : dbRow.abilities,
    })
  }
}

export default class User extends compose(
  UserSchema,
  withAuthFinder(hash, { uids: ['email'], passwordColumnName: 'passwordHash' })
) {
  static accessTokens = new JsonbAccessTokensProvider({ tokenableModel: User })
  declare currentAccessToken?: AccessToken

  static async makePasswordHash(password: string) {
    return hash.make(password)
  }

  get initials() {
    const [first, last] = this.name ? this.name.split(' ') : this.email.split('@')
    if (first && last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
    }
    return `${first.slice(0, 2)}`.toUpperCase()
  }
}

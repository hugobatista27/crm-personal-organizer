import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'auth_access_tokens'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.uuid('tokenable_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.string('type', 50).notNullable()
      table.string('name', 100).notNullable()
      table.string('hash', 255).notNullable().unique()
      table.jsonb('abilities').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).nullable()
      table.timestamp('last_used_at', { useTz: true }).nullable()
      table.timestamp('expires_at', { useTz: true }).nullable()
    })

    this.defer(async (db) => {
      await db.rawQuery(
        'ALTER TABLE auth_access_tokens ALTER COLUMN id SET DEFAULT gen_random_uuid()'
      ).exec()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

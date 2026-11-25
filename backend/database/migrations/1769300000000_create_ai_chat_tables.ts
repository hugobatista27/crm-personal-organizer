import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('ai_chat_sessions', (table) => {
      table.uuid('id').primary()
      table.uuid('user_id').notNullable().references('id').inTable('users')
      table.string('title', 150).nullable()
      table.string('status', 20).notNullable().defaultTo('ACTIVE')
      table.jsonb('session_state').notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })
    this.schema.createTable('ai_chat_messages', (table) => {
      table.uuid('id').primary()
      table
        .uuid('session_id')
        .notNullable()
        .references('id')
        .inTable('ai_chat_sessions')
        .onDelete('CASCADE')
      table.string('sender', 20).notNullable()
      table.text('message_text').notNullable()
      table.jsonb('extracted_entities').nullable()
      table.jsonb('suggested_action').nullable()
      table.uuid('resulting_appointment_id').nullable().references('id').inTable('appointments')
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.index(['session_id', 'created_at'], 'idx_ai_messages_session')
    })
  }

  async down() {
    this.schema.dropTable('ai_chat_messages')
    this.schema.dropTable('ai_chat_sessions')
  }
}

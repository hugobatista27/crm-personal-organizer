import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('clients', (table) => {
      table.uuid('id').primary()
      table.string('name', 150).notNullable()
      table.string('phone', 20).notNullable().unique()
      table.string('alternative_phone', 20).nullable()
      table.string('email', 150).nullable()
      table.string('street', 150).notNullable()
      table.string('number', 20).notNullable()
      table.string('complement', 80).nullable()
      table.string('neighborhood', 100).notNullable()
      table.string('city', 100).notNullable()
      table.string('state', 2).notNullable()
      table.string('zip_code', 10).nullable()
      table.decimal('latitude', 10, 8).nullable()
      table.decimal('longitude', 11, 8).nullable()
      table.text('notes').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })
    this.schema.createTable('service_types', (table) => {
      table.uuid('id').primary()
      table.string('name', 100).notNullable().unique()
      table.text('description').nullable()
      table.decimal('reference_price', 10, 2).notNullable()
      table.specificType('default_duration', 'interval').notNullable()
      table.boolean('active').notNullable().defaultTo(true)
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })
    this.schema.createTable('diaristas', (table) => {
      table.uuid('id').primary()
      table.uuid('user_id').nullable().unique().references('id').inTable('users')
      table.string('name', 150).notNullable()
      table.string('phone', 20).notNullable().unique()
      table.string('document_cpf', 14).nullable().unique()
      table.string('photo_url', 255).nullable()
      table.string('status', 20).notNullable()
      table.decimal('average_rating', 3, 2).notNullable().defaultTo(5)
      table.integer('total_ratings').notNullable().defaultTo(0)
      table.text('bio_notes').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })
    this.schema.createTable('diarista_specialties', (table) => {
      table.uuid('id').primary()
      table
        .uuid('diarista_id')
        .notNullable()
        .references('id')
        .inTable('diaristas')
        .onDelete('CASCADE')
      table
        .uuid('service_type_id')
        .notNullable()
        .references('id')
        .inTable('service_types')
        .onDelete('CASCADE')
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.unique(['diarista_id', 'service_type_id'])
    })
  }

  async down() {
    this.schema.dropTable('diarista_specialties')
    this.schema.dropTable('diaristas')
    this.schema.dropTable('service_types')
    this.schema.dropTable('clients')
  }
}

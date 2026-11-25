import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.raw('CREATE EXTENSION IF NOT EXISTS btree_gist')
    this.schema.createTable('appointments', (table) => {
      table.uuid('id').primary()
      table.string('appointment_code', 20).notNullable().unique()
      table.uuid('client_id').notNullable().references('id').inTable('clients').onDelete('RESTRICT')
      table
        .uuid('diarista_id')
        .nullable()
        .references('id')
        .inTable('diaristas')
        .onDelete('SET NULL')
      table
        .uuid('service_type_id')
        .notNullable()
        .references('id')
        .inTable('service_types')
        .onDelete('RESTRICT')
      table.date('service_date').notNullable()
      table.time('start_time').notNullable()
      table.time('end_time').notNullable()
      table.specificType('schedule_range', 'tstzrange').notNullable()
      table.string('status', 25).notNullable()
      table.decimal('client_price', 10, 2).notNullable()
      table.decimal('diarista_payout', 10, 2).notNullable()
      table.decimal('additional_costs', 10, 2).notNullable().defaultTo(0)
      table.text('address_snapshot').notNullable()
      table.text('observations').nullable()
      table.timestamp('confirmed_by_diarista_at', { useTz: true }).nullable()
      table.timestamp('started_at', { useTz: true }).nullable()
      table.timestamp('finished_at', { useTz: true }).nullable()
      table.decimal('checkin_latitude', 10, 8).nullable()
      table.decimal('checkin_longitude', 11, 8).nullable()
      table.decimal('checkout_latitude', 10, 8).nullable()
      table.decimal('checkout_longitude', 11, 8).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.index('service_date', 'idx_appointments_service_date')
      table.index(['diarista_id', 'service_date'], 'idx_appointments_diarista_date')
      table.index('status', 'idx_appointments_status')
    })
    this.schema.raw(`
      ALTER TABLE appointments
      ADD CONSTRAINT no_diarista_schedule_overlap
      EXCLUDE USING gist (diarista_id WITH =, schedule_range WITH &&)
      WHERE (status NOT IN ('CANCELADO', 'SOLICITADO'))
    `)
  }

  async down() {
    this.schema.dropTable('appointments')
  }
}

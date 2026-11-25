import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('appointment_status_history', (table) => {
      table.uuid('id').primary()
      table
        .uuid('appointment_id')
        .notNullable()
        .references('id')
        .inTable('appointments')
        .onDelete('CASCADE')
      table.string('from_status', 25).nullable()
      table.string('to_status', 25).notNullable()
      table
        .uuid('changed_by_user_id')
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.text('reason_notes').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.index(['appointment_id', 'created_at'], 'idx_appointment_status_history')
    })
    this.schema.createTable('appointment_ratings', (table) => {
      table.uuid('id').primary()
      table
        .uuid('appointment_id')
        .notNullable()
        .unique()
        .references('id')
        .inTable('appointments')
        .onDelete('CASCADE')
      table.uuid('diarista_id').notNullable().references('id').inTable('diaristas')
      table.specificType('rating', 'smallint').notNullable()
      table.text('comment').nullable()
      table.uuid('created_by_user_id').notNullable().references('id').inTable('users')
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.index('diarista_id', 'idx_appointment_ratings_diarista')
    })
    this.schema.raw(
      'ALTER TABLE appointment_ratings ADD CONSTRAINT appointment_rating_range CHECK (rating BETWEEN 1 AND 5)'
    )
    this.schema.raw(`
      CREATE FUNCTION update_diarista_average_rating() RETURNS TRIGGER AS $$
      BEGIN
        UPDATE diaristas SET
          average_rating = (SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 5.00)
                            FROM appointment_ratings WHERE diarista_id = NEW.diarista_id),
          total_ratings = (SELECT COUNT(*) FROM appointment_ratings WHERE diarista_id = NEW.diarista_id),
          updated_at = NOW()
        WHERE id = NEW.diarista_id;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `)
    this.schema.raw(`
      CREATE TRIGGER trg_after_appointment_rating_insert
      AFTER INSERT OR UPDATE ON appointment_ratings
      FOR EACH ROW EXECUTE FUNCTION update_diarista_average_rating()
    `)
  }

  async down() {
    this.schema.dropTable('appointment_ratings')
    this.schema.dropTable('appointment_status_history')
    this.schema.raw('DROP FUNCTION IF EXISTS update_diarista_average_rating()')
  }
}

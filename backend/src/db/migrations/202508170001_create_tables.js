/**
 * Knex migration to create initial tables for NexoSwap.
 */

export async function up(knex) {
  // Users table
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary();
    table.string('name').notNullable();
    table.string('email').notNullable().unique();
    table.string('address');
    table.decimal('lifetime_volume_usd', 14, 2).notNullable().defaultTo(0);
    table.string('role').notNullable().defaultTo('user');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at');
  });

  // Auth credentials
  await knex.schema.createTable('auth_credentials', (table) => {
    table.uuid('id').primary();
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('password_hash').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // Refresh tokens
  await knex.schema.createTable('refresh_tokens', (table) => {
    table.uuid('id').primary();
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('token_hash').notNullable();
    table.timestamp('expires_at').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('revoked_at');
  });

  // Verifications table for ID verification and sanctions screening
  await knex.schema.createTable('verifications', (table) => {
    table.uuid('id').primary();
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('type').notNullable();
    table.string('provider').notNullable();
    table.string('status').notNullable();
    table.json('result_json');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // Trades table
  await knex.schema.createTable('trades', (table) => {
    table.uuid('id').primary();
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('from_currency').notNullable();
    table.string('to_currency').notNullable();
    table.decimal('amount_crypto', 18, 8);
    table.decimal('amount_fiat', 14, 2);
    table.string('fiat_method');
    table.decimal('fee_usd', 14, 2);
    table.string('state').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // Audit logs
  await knex.schema.createTable('audit_logs', (table) => {
    table.uuid('id').primary();
    table.uuid('trade_id').notNullable().references('id').inTable('trades').onDelete('CASCADE');
    table.string('actor_type').notNullable();
    table.uuid('actor_id').notNullable();
    table.string('ip');
    table.string('reason');
    table.string('prev_state');
    table.string('next_state');
    table.timestamp('timestamp').defaultTo(knex.fn.now());
  });

  // Files (uploads)
  await knex.schema.createTable('files', (table) => {
    table.uuid('id').primary();
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('trade_id');
    table.string('filename').notNullable();
    table.string('filepath').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // Fee rules: allow dynamic configuration if needed
  await knex.schema.createTable('fee_rules', (table) => {
    table.uuid('id').primary();
    table.decimal('min_amount', 14, 2).notNullable();
    table.decimal('max_amount', 14, 2);
    table.decimal('fee_rate', 5, 4).notNullable();
  });

  // Seed data is inserted via seed scripts. See src/db/seeds for details.
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('fee_rules');
  await knex.schema.dropTableIfExists('files');
  await knex.schema.dropTableIfExists('audit_logs');
  await knex.schema.dropTableIfExists('trades');
  await knex.schema.dropTableIfExists('verifications');
  await knex.schema.dropTableIfExists('refresh_tokens');
  await knex.schema.dropTableIfExists('auth_credentials');
  await knex.schema.dropTableIfExists('users');
}
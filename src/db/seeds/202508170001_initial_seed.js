/*
 * Seed script to bootstrap the database with essential data: an admin user and
 * predefined fee rules. The admin user credentials are read from environment
 * variables (ADMIN_EMAIL, ADMIN_PASSWORD). Fee rules mirror the fee schedule
 * described in the project specification.
 */

import argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';

export async function seed(knex) {
  // Clear existing data to avoid duplicates when re-running seeds
  await knex('fee_rules').del();
  await knex('auth_credentials').del();
  await knex('users').del();
  await knex('refresh_tokens').del();

  // Insert fee rules
  await knex('fee_rules').insert([
    { id: uuidv4(), min_amount: 0, max_amount: 199.99, fee_rate: 0.05 },
    { id: uuidv4(), min_amount: 200, max_amount: null, fee_rate: 0.025 },
  ]);

  // Create admin user if ADMIN_EMAIL is defined
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
  const passwordHash = await argon2.hash(adminPassword);
  const userId = uuidv4();
  await knex('users').insert({ id: userId, name: 'Admin', email: adminEmail, role: 'admin' });
  await knex('auth_credentials').insert({ id: uuidv4(), user_id: userId, password_hash: passwordHash });
}
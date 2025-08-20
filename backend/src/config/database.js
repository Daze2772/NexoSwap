import knex from 'knex';
import dotenv from 'dotenv';

// Load environment variables from .env file in non‑production
dotenv.config();

// Create a Knex instance connected to PostgreSQL
const db = knex({
  client: 'pg',
  connection: process.env.DATABASE_URL,
  pool: { min: 2, max: 10 },
  // Accept SSL if provided in DATABASE_URL (Cloud SQL requires TLS). In local dev this will be ignored.
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
});

export default db;
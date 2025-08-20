import knex from 'knex';
import dotenv from 'dotenv';

// Load environment variables from .env file in non‑production
dotenv.config();

// Use the DATABASE_URL connection string directly to preserve query params
// Supports Cloud SQL Unix socket format:
// postgresql://user:password@/dbname?host=/cloudsql/project:region:instance
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create a Knex instance connected to PostgreSQL
const db = knex({
  client: 'pg',
  connection: connectionString,
  pool: { 
    min: 2, 
    max: 10,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 100
  },
  debug: process.env.NODE_ENV === 'development'
});

// Test the connection
db.raw('SELECT 1')
  .then(() => {
    console.log('Database connection established successfully');
  })
  .catch((error) => {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  });

export default db;
import knex from 'knex';
import dotenv from 'dotenv';

// Load environment variables from .env file in non‑production
dotenv.config();

// Parse DATABASE_URL to extract connection details
const parseDatabaseUrl = (url) => {
  if (!url) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parsed.port || 5432,
      user: parsed.username,
      password: parsed.password,
      database: parsed.pathname.slice(1), // Remove leading slash
      ssl: parsed.searchParams.get('ssl') === 'true' ? { rejectUnauthorized: false } : undefined
    };
  } catch (error) {
    console.error('Failed to parse DATABASE_URL:', error);
    throw new Error('Invalid DATABASE_URL format');
  }
};

// Create connection config
const connectionConfig = parseDatabaseUrl(process.env.DATABASE_URL);

// For Cloud SQL Unix socket connections, we need to handle the special format
// postgresql://user:password@/dbname?host=/cloudsql/instance-connection-name
if (connectionConfig.host === '' && process.env.DATABASE_URL.includes('/cloudsql/')) {
  // Extract the Unix socket path from the URL
  const socketMatch = process.env.DATABASE_URL.match(/host=\/cloudsql\/([^&]+)/);
  if (socketMatch) {
    connectionConfig.host = socketMatch[1];
    connectionConfig.port = '/cloudsql/' + socketMatch[1];
  }
}

console.log('Database connection config:', {
  host: connectionConfig.host,
  port: connectionConfig.port,
  database: connectionConfig.database,
  user: connectionConfig.user,
  ssl: connectionConfig.ssl ? 'enabled' : 'disabled'
});

// Create a Knex instance connected to PostgreSQL
const db = knex({
  client: 'pg',
  connection: connectionConfig,
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
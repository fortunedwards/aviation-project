const { Pool } = require('pg');
require('dotenv').config();

const isProduction =
  process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT === 'production';

if (!process.env.DATABASE_URL && isProduction) {
  throw new Error('DATABASE_URL is required in production');
}

const connectionConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
    }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_DATABASE,
      password: String(process.env.DB_PASSWORD),
      port: process.env.DB_PORT,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    };

const pool = new Pool({
  ...connectionConfig,
});

pool.on('connect', async (client) => {
  await client.query('SET search_path TO public');
});

module.exports = pool;

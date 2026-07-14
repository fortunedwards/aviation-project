const { Pool } = require('pg');
require('dotenv').config();

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

module.exports = pool;

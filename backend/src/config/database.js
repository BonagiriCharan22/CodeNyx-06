const { Pool } = require('pg');

// ============================================================
// DATABASE CONFIGURATION
// Replace these values with your PostgreSQL credentials
// You can use Supabase, Railway, or any PostgreSQL provider
// ============================================================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://USER:PASSWORD@HOST:PORT/DATABASE',
  // OR use individual fields:
  // host: 'your-host.supabase.co',
  // port: 5432,
  // database: 'postgres',
  // user: 'postgres',
  // password: 'your-password',
  ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

module.exports = pool;
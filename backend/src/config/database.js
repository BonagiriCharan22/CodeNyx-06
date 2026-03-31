const { Pool } = require('pg');

// ============================================================
// DATABASE CONFIGURATION
// Replace these values with your PostgreSQL credentials
// You can use Supabase, Railway, or any PostgreSQL provider
// ============================================================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Rishistudybtech%401@db.yvrjlcnmdpdouqwkoxqg.supabase.co:5432/postgres',
  // OR use individual fields:
  // host: 'db.yvrjlcnmdpdouqwkoxqg.supabase.co',
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

// /* FIREBASE (REVERTED - COMMENTED OUT)
// const admin = require('firebase-admin');
// ... */

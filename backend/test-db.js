const { Pool } = require('pg');

const urls = [
  'postgresql://postgres.yvrjlcnmdpdouqwkoxqg:Rishistudybtech%401@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres',
  'postgresql://postgres.yvrjlcnmdpdouqwkoxqg:Rishistudybtech%401@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres',
  'postgresql://postgres.yvrjlcnmdpdouqwkoxqg:Rishistudybtech%401@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres',
  'postgresql://postgres.yvrjlcnmdpdouqwkoxqg:Rishistudybtech%401@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres',
];

async function test(url) {
  const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 5000 });
  try {
    await pool.query('SELECT 1');
    console.log('✅ SUCCESS:', url);
  } catch (e) {
    console.log('❌ FAILED:', url.split('@')[1], '-', e.message);
  } finally {
    await pool.end();
  }
}

(async () => { for (const url of urls) await test(url); })();
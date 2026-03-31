//db-setup.js
// POSTGRESQL TABLES SETUP (ORIGINAL - COMMENTED OUT)
const pool = require('./config/database');
require('dotenv').config();

async function setupDatabase() {
  console.log('Setting up database tables...');

  const queries = [
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'user',
      domain VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS sessions (
      id SERIAL PRIMARY KEY,
      session_id VARCHAR(255) UNIQUE NOT NULL,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS ideas (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      domain VARCHAR(100) NOT NULL,
      title VARCHAR(500) NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS chat_sessions (
      id SERIAL PRIMARY KEY,
      idea_id INTEGER REFERENCES ideas(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      current_phase VARCHAR(100) DEFAULT 'problem_clarity',
      phase_index INTEGER DEFAULT 0,
      is_complete BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS chat_messages (
      id SERIAL PRIMARY KEY,
      session_id INTEGER REFERENCES chat_sessions(id) ON DELETE CASCADE,
      role VARCHAR(50) NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS pitch_sessions (
      id SERIAL PRIMARY KEY,
      idea_id INTEGER REFERENCES ideas(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      stakeholder_type VARCHAR(50) NOT NULL,
      rounds INTEGER DEFAULT 0,
      pitch_text TEXT,
      decision TEXT,
      is_complete BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS pitch_messages (
      id SERIAL PRIMARY KEY,
      session_id INTEGER REFERENCES pitch_sessions(id) ON DELETE CASCADE,
      role VARCHAR(50) NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS simulation_results (
      id SERIAL PRIMARY KEY,
      idea_id INTEGER REFERENCES ideas(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      simulation_type VARCHAR(100) NOT NULL,
      result JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS collaborators (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      idea_id INTEGER REFERENCES ideas(id) ON DELETE SET NULL,
      skills TEXT NOT NULL,
      domain VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, idea_id)
    )`,
  ];

  for (const query of queries) {
    await pool.query(query);
    console.log('✓ Table created/verified');
  }

  console.log('✅ Database setup complete!');
}

setupDatabase().catch(err => {
  console.error('❌ Database setup failed:', err.message);
  console.error('Make sure your DATABASE_URL in .env is correct.');
  process.exit(1);
});

// FIREBASE FIRESTORE (REVERTED - COMMENTED OUT)
 /*
const { db } = require('./config/database');

async function setupDatabase() {
  console.log('🔥 Verifying Firebase Firestore connection...');

  try {
    // Test connection
    await db.collection('test').doc('connection').set({ timestamp: new Date() });
    await db.collection('test').doc('connection').delete();
    console.log('✓ Firestore connection OK');

    console.log(`
✅ Firestore collections auto-created on first write:
- users 
- ideas
- chat_sessions, chat_messages
- pitch_sessions, pitch_messages  
- simulation_results
- collaborators
- sessions

No schema needed!`);
  } catch (err) {
    console.error('❌ Firestore setup failed:', err.message);
    console.error('1. Check firebase-service-account.json exists');
    console.error('2. Verify Firebase project has Firestore enabled');
    process.exit(1);
  }
}

setupDatabase();
 */

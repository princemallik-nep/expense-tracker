const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      name          TEXT NOT NULL,
      email         TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS expenses (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount      NUMERIC(12,2) NOT NULL,
      category    TEXT NOT NULL,
      date        DATE NOT NULL,
      description TEXT DEFAULT '',
      created_at  TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);`);
  console.log('Database schema ready');
}

async function queryAll(sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows;
}

async function queryOne(sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows[0] || null;
}

async function run(sql, params = []) {
  const result = await pool.query(sql, params);
  return {
    changes: result.rowCount,
    lastInsertRowid: result.rows[0]?.id ?? null,
  };
}

module.exports = { initDb, queryAll, queryOne, run };

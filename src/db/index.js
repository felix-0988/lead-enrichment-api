let db;
let query;
let init;

// SQLite fallback for local development
if (process.env.USE_SQLITE === 'true') {
  const sqlite3 = require('sqlite3').verbose();
  
  const dbInstance = new sqlite3.Database(':memory:');
  
  query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      // Convert PostgreSQL $1, $2 to SQLite ?
      const sqliteSql = sql.replace(/\$(\d+)/g, '?');
      
      if (sql.trim().toLowerCase().startsWith('select')) {
        dbInstance.all(sqliteSql, params, (err, rows) => {
          if (err) reject(err);
          else resolve({ rows: rows || [] });
        });
      } else {
        dbInstance.run(sqliteSql, params, function(err) {
          if (err) reject(err);
          else resolve({ rows: [{ id: this.lastID }], rowCount: this.changes });
        });
      }
    });
  };

  init = async () => {
    // API Keys table
    await query(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key_hash TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_used_at DATETIME
      )
    `);

    // Usage logs table
    await query(`
      CREATE TABLE IF NOT EXISTS usage_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        api_key_id INTEGER,
        endpoint TEXT NOT NULL,
        request_data TEXT,
        response_status INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Cache table for enriched data
    await query(`
      CREATE TABLE IF NOT EXISTS enrichment_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        query TEXT NOT NULL,
        data TEXT NOT NULL,
        source TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        UNIQUE(type, query)
      )
    `);

    // Create index for faster lookups
    await query(`CREATE INDEX IF NOT EXISTS idx_usage_logs_api_key_id ON usage_logs(api_key_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_enrichment_cache_lookup ON enrichment_cache(type, query)`);

    console.log('SQLite database initialized');
  };

  module.exports = { init, query };
} else {
  // PostgreSQL
  const { Pool } = require('pg');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  init = async () => {
    const client = await pool.connect();
    try {
      // API Keys table
      await client.query(`
        CREATE TABLE IF NOT EXISTS api_keys (
          id SERIAL PRIMARY KEY,
          key_hash VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_used_at TIMESTAMP
        )
      `);

      // Usage logs table
      await client.query(`
        CREATE TABLE IF NOT EXISTS usage_logs (
          id SERIAL PRIMARY KEY,
          api_key_id INTEGER REFERENCES api_keys(id),
          endpoint VARCHAR(50) NOT NULL,
          request_data JSONB,
          response_status INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Cache table for enriched data
      await client.query(`
        CREATE TABLE IF NOT EXISTS enrichment_cache (
          id SERIAL PRIMARY KEY,
          type VARCHAR(20) NOT NULL,
          query VARCHAR(255) NOT NULL,
          data JSONB NOT NULL,
          source VARCHAR(50) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP,
          UNIQUE(type, query)
        )
      `);

      // Create index for faster lookups
      await client.query(`CREATE INDEX IF NOT EXISTS idx_usage_logs_api_key_id ON usage_logs(api_key_id)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_enrichment_cache_lookup ON enrichment_cache(type, query)`);

      console.log('PostgreSQL database initialized');
    } finally {
      client.release();
    }
  };

  module.exports = {
    pool,
    init,
    query: (text, params) => pool.query(text, params)
  };
}

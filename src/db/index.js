const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const init = async () => {
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
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_usage_logs_api_key_id ON usage_logs(api_key_id);
      CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at);
      CREATE INDEX IF NOT EXISTS idx_enrichment_cache_lookup ON enrichment_cache(type, query);
    `);

    console.log('Database tables initialized');
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  init,
  query: (text, params) => pool.query(text, params)
};

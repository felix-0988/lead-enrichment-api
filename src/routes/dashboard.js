const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateApiKey } = require('../middleware/auth');

// GET /api/dashboard/stats
router.get('/stats', authenticateApiKey, async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const apiKeyId = req.apiKeyId;

    // SQLite compatible date query
    const dateFilter = process.env.USE_SQLITE === 'true' 
      ? `datetime('now', '-${days} days')`
      : `CURRENT_DATE - INTERVAL '${days} days'`;
    const todayFilter = process.env.USE_SQLITE === 'true'
      ? `date('now')`
      : `CURRENT_DATE`;

    // Get usage stats for this API key
    const statsResult = await db.query(`
      SELECT 
        COUNT(*) as total_requests,
        COUNT(CASE WHEN endpoint = 'enrich_email' THEN 1 END) as email_requests,
        COUNT(CASE WHEN endpoint = 'enrich_domain' THEN 1 END) as domain_requests,
        COUNT(CASE WHEN date(created_at) >= ${todayFilter} THEN 1 END) as requests_today,
        MIN(created_at) as first_request,
        MAX(created_at) as last_request
      FROM usage_logs 
      WHERE api_key_id = $1 
      AND created_at >= ${dateFilter}
    `, [apiKeyId]);

    // Get daily breakdown
    const dailyResult = await db.query(`
      SELECT 
        date(created_at) as date,
        COUNT(*) as requests,
        COUNT(CASE WHEN endpoint = 'enrich_email' THEN 1 END) as emails,
        COUNT(CASE WHEN endpoint = 'enrich_domain' THEN 1 END) as domains
      FROM usage_logs 
      WHERE api_key_id = $1 
      AND created_at >= ${dateFilter}
      GROUP BY date(created_at)
      ORDER BY date DESC
    `, [apiKeyId]);

    // Get success rate
    const successResult = await db.query(`
      SELECT 
        COUNT(CASE WHEN response_status >= 200 AND response_status < 300 THEN 1 END) as success,
        COUNT(CASE WHEN response_status >= 400 THEN 1 END) as errors
      FROM usage_logs 
      WHERE api_key_id = $1 
      AND created_at >= ${dateFilter}
    `, [apiKeyId]);

    res.json({
      success: true,
      stats: {
        ...statsResult.rows[0],
        success_rate: successResult.rows[0].success + successResult.rows[0].errors > 0
          ? Math.round((successResult.rows[0].success / (successResult.rows[0].success + successResult.rows[0].errors)) * 100)
          : 100,
        period_days: parseInt(days)
      },
      daily_breakdown: dailyResult.rows
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/global-stats (for all keys)
router.get('/global-stats', async (req, res, next) => {
  try {
    const { days = 30 } = req.query;

    // SQLite compatible date query
    const dateFilter = process.env.USE_SQLITE === 'true' 
      ? `datetime('now', '-${days} days')`
      : `CURRENT_DATE - INTERVAL '${days} days'`;

    // Get global stats
    const statsResult = await db.query(`
      SELECT 
        COUNT(*) as total_requests,
        COUNT(CASE WHEN endpoint = 'enrich_email' THEN 1 END) as email_requests,
        COUNT(CASE WHEN endpoint = 'enrich_domain' THEN 1 END) as domain_requests,
        COUNT(DISTINCT api_key_id) as active_keys
      FROM usage_logs 
      WHERE created_at >= ${dateFilter}
    `);

    // Get top API keys
    const topKeysResult = await db.query(`
      SELECT 
        ak.name,
        COUNT(*) as requests
      FROM usage_logs ul
      JOIN api_keys ak ON ul.api_key_id = ak.id
      WHERE ul.created_at >= ${dateFilter}
      GROUP BY ak.name
      ORDER BY requests DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      global_stats: {
        ...statsResult.rows[0],
        period_days: parseInt(days)
      },
      top_api_keys: topKeysResult.rows
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

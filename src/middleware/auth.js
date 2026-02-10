const rateLimit = require('express-rate-limit');
const db = require('../db');

// Rate limiting middleware
const createRateLimiter = () => {
  return rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req, res) => {
      return req.apiKeyId || req.ip;
    },
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/health';
    }
  });
};

// API Key authentication middleware
const authenticateApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'API key required. Include X-API-Key header.'
    });
  }

  try {
    const result = await db.query(
      'SELECT id, name, is_active FROM api_keys WHERE key_hash = $1',
      [apiKey]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid API key'
      });
    }

    const keyData = result.rows[0];

    if (!keyData.is_active) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'API key is deactivated'
      });
    }

    // Update last used
    await db.query(
      'UPDATE api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE id = $1',
      [keyData.id]
    );

    req.apiKeyId = keyData.id;
    req.apiKeyName = keyData.name;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Authentication failed'
    });
  }
};

// Log usage middleware
const logUsage = (endpoint) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(body) {
      // Log the request
      if (req.apiKeyId) {
        db.query(
          'INSERT INTO usage_logs (api_key_id, endpoint, request_data, response_status) VALUES ($1, $2, $3, $4)',
          [req.apiKeyId, endpoint, JSON.stringify(req.body), res.statusCode]
        ).catch(err => console.error('Failed to log usage:', err));
      }
      
      originalSend.call(this, body);
    };
    
    next();
  };
};

module.exports = {
  createRateLimiter,
  authenticateApiKey,
  logUsage
};

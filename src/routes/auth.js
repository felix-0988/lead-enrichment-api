const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db');

// POST /api/auth/generate-key
router.post('/generate-key', async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Name is required for the API key'
      });
    }

    // Generate a secure API key
    const apiKey = 'le_' + crypto.randomBytes(32).toString('hex');
    const keyHash = apiKey; // In production, you might want to hash this

    const result = await db.query(
      'INSERT INTO api_keys (key_hash, name) VALUES ($1, $2) RETURNING id, name, created_at',
      [keyHash, name]
    );

    res.status(201).json({
      success: true,
      apiKey: apiKey,
      name: result.rows[0].name,
      createdAt: result.rows[0].created_at,
      message: 'Store this API key securely. It will not be shown again.'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/keys - List all API keys (without the actual keys)
router.get('/keys', async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT id, name, is_active, created_at, last_used_at FROM api_keys ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      keys: result.rows
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/auth/keys/:id - Deactivate an API key
router.delete('/keys/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    await db.query(
      'UPDATE api_keys SET is_active = false WHERE id = $1',
      [id]
    );

    res.json({
      success: true,
      message: 'API key deactivated'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

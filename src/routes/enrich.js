const express = require('express');
const router = express.Router();
const enrichmentService = require('../services/enrichment');
const { authenticateApiKey, createRateLimiter, logUsage } = require('../middleware/auth');

const rateLimiter = createRateLimiter();

// POST /api/enrich/email
router.post('/email', 
  authenticateApiKey,
  rateLimiter,
  logUsage('enrich_email'),
  async (req, res, next) => {
    try {
      const { email, source } = req.body;

      if (!email) {
        return res.status(400).json({
          error: 'Bad request',
          message: 'Email is required'
        });
      }

      const result = await enrichmentService.enrichEmail(email, source);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/enrich/domain
router.post('/domain', 
  authenticateApiKey,
  rateLimiter,
  logUsage('enrich_domain'),
  async (req, res, next) => {
    try {
      const { domain, source } = req.body;

      if (!domain) {
        return res.status(400).json({
          error: 'Bad request',
          message: 'Domain is required'
        });
      }

      const result = await enrichmentService.enrichDomain(domain, source);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;

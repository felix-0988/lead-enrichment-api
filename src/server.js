require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const db = require('./db');
const enrichRoutes = require('./routes/enrich');
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "https://cdn.tailwindcss.com", "'unsafe-inline'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
    },
  },
}));

app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for dashboard
app.use(express.static(path.join(__dirname, '../public')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/enrich', enrichRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Serve dashboard at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Serve documentation pages
app.get('/docs', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/api', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// API Documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    name: 'Lead Enrichment API',
    version: '1.0.0',
    endpoints: {
      'POST /api/enrich/email': {
        description: 'Enrich an email address with company data',
        headers: { 'X-API-Key': 'Your API key' },
        body: { email: 'string (required)' },
        response: { email: 'string', company: 'object', source: 'string' }
      },
      'POST /api/enrich/domain': {
        description: 'Enrich a domain with company data',
        headers: { 'X-API-Key': 'Your API key' },
        body: { domain: 'string (required)' },
        response: { domain: 'string', company: 'object', source: 'string' }
      },
      'POST /api/auth/generate-key': {
        description: 'Generate a new API key (requires admin)',
        body: { name: 'string (required)' },
        response: { apiKey: 'string', name: 'string' }
      },
      'GET /api/dashboard/stats': {
        description: 'Get usage statistics',
        headers: { 'X-API-Key': 'Your API key' }
      }
    },
    rateLimit: '100 requests per 15 minutes per API key'
  });
});

// Error handler
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Initialize database and start server
async function startServer() {
  try {
    await db.init();
    console.log('Database initialized');
    
    app.listen(PORT, () => {
      console.log(`🚀 Lead Enrichment API running on port ${PORT}`);
      console.log(`🏠 Landing Page: http://localhost:${PORT}`);
      console.log(`📚 API Docs: http://localhost:${PORT}/docs`);
      console.log(`📊 JSON API Docs: http://localhost:${PORT}/api/docs`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

# Lead Enrichment API - Deployment Guide

## Quick Deploy Options

### Option 1: Deploy to Render (Recommended - Easiest)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

**Steps:**
1. Click the "Deploy to Render" button above
2. Connect your GitHub account
3. Fork this repository when prompted
4. Fill in environment variables:
   - `HUNTER_API_KEY` - Get from [hunter.io](https://hunter.io/api)
   - `CLEARBIT_API_KEY` - Get from [clearbit.com](https://clearbit.com)
5. Click "Deploy"

**Your app will be live in ~3 minutes!**

---

### Option 2: Deploy to Railway

**Prerequisites:**
- Railway CLI installed: `npm i -g @railway/cli`
- Logged in: `railway login`

**Steps:**
```bash
# Clone and enter directory
git clone <your-repo-url>
cd lead-enrichment-api

# Login to Railway
railway login

# Create project
railway init

# Add PostgreSQL database
railway add --database postgres

# Deploy
railway up

# Open in browser
railway open
```

---

### Option 3: Manual Deploy to Any VPS

**Requirements:**
- Node.js 18+
- PostgreSQL 13+
- PM2 (optional, for process management)

**Steps:**
```bash
# 1. Clone repository
git clone <repo-url>
cd lead-enrichment-api

# 2. Install dependencies
npm install --production

# 3. Setup PostgreSQL
createdb lead_enrichment

# 4. Configure environment
cp .env.example .env
# Edit .env with your settings

# 5. Start server
npm start
```

---

## Getting API Keys

### Hunter.io (Free tier: 50 requests/month)
1. Sign up at [hunter.io/signup](https://hunter.io/signup)
2. Go to [API settings](https://hunter.io/api)
3. Copy your API key

### Clearbit (Free tier: 60 requests/month)
1. Sign up at [clearbit.com](https://clearbit.com)
2. Go to [API Keys](https://dashboard.clearbit.com/keys)
3. Copy your API key

**Note:** You need at least one of these APIs configured for the app to work.

---

## Post-Deployment Setup

### 1. Generate Your First API Key

After deployment, visit your app's URL and:
1. Go to the dashboard
2. Enter a name for your API key
3. Click "Generate Key"
4. **Save the key - it won't be shown again!**

### 2. Test the API

```bash
# Test email enrichment
curl -X POST https://your-app.onrender.com/api/enrich/email \
  -H "X-API-Key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"email": "john@stripe.com"}'

# Test domain enrichment
curl -X POST https://your-app.onrender.com/api/enrich/domain \
  -H "X-API-Key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"domain": "stripe.com"}'
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `HUNTER_API_KEY` | No* | Hunter.io API key |
| `CLEARBIT_API_KEY` | No* | Clearbit API key |
| `JWT_SECRET` | Yes | Secret for API key generation |
| `PORT` | No | Server port (default: 3000) |
| `RATE_LIMIT_WINDOW_MS` | No | Rate limit window (default: 900000) |
| `RATE_LIMIT_MAX_REQUESTS` | No | Max requests per window (default: 100) |

*At least one enrichment API key is required

---

## Troubleshooting

### Database Connection Issues
```bash
# Test PostgreSQL connection
psql $DATABASE_URL -c "SELECT 1;"
```

### Rate Limit Errors
- Default: 100 requests per 15 minutes per API key
- Adjust with `RATE_LIMIT_MAX_REQUESTS` env var

### API Key Not Working
- Make sure the key is active in the database
- Check `X-API-Key` header is set correctly

---

## Monitoring

### Health Check Endpoint
```bash
curl https://your-app.onrender.com/health
```

### Dashboard Stats
```bash
curl https://your-app.onrender.com/api/dashboard/stats \
  -H "X-API-Key: your_api_key"
```

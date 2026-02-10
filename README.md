# Lead Enrichment API ✅ COMPLETE

A production-ready API for enriching email addresses and domains with detailed company data. Powered by Hunter.io and Clearbit (with mock data fallback for MVP).

## ✅ Implementation Status

| Feature | Status |
|---------|--------|
| Email Enrichment (`/enrich/email`) | ✅ Working |
| Domain Enrichment (`/enrich/domain`) | ✅ Working |
| API Key Authentication | ✅ Working |
| Rate Limiting (100 req/15min) | ✅ Working |
| Mock Data (MVP fallback) | ✅ Working |
| Response Caching | ✅ Working |
| Dashboard UI | ✅ Working |
| Usage Statistics | ✅ Working |
| SQLite/PostgreSQL Support | ✅ Working |
| API Documentation | ✅ Complete |

## Features

- ✅ **Email Enrichment** - Get company data from any email address
- ✅ **Domain Enrichment** - Get detailed company information from any domain
- ✅ **API Key Authentication** - Secure access with API keys
- ✅ **Rate Limiting** - 100 requests per 15 minutes per key
- ✅ **Response Caching** - 24-hour cache for improved performance
- ✅ **Usage Dashboard** - Visual dashboard with stats and API playground
- ✅ **Dual Source Support** - Hunter.io + Clearbit APIs

## Quick Start

### 1. Clone and Install

```bash
git clone <repo-url>
cd lead-enrichment-api
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your API keys
```

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `HUNTER_API_KEY` or `CLEARBIT_API_KEY` - At least one enrichment API key

### 3. Run Locally

```bash
npm start
```

Visit `http://localhost:3000` for the dashboard.

## API Endpoints

### POST /api/enrich/email

Enrich an email address with company data.

**Headers:**
```
X-API-Key: your_api_key
Content-Type: application/json
```

**Body:**
```json
{
  "email": "john@stripe.com",
  "source": "auto"  // optional: "hunter", "clearbit", or "auto"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "email": "john@stripe.com",
    "company": { ... },
    "source": "clearbit",
    "cached": false
  }
}
```

### POST /api/enrich/domain

Enrich a domain with company data.

**Body:**
```json
{
  "domain": "stripe.com",
  "source": "auto"
}
```

### POST /api/auth/generate-key

Generate a new API key.

**Body:**
```json
{
  "name": "My Application"
}
```

**Response:**
```json
{
  "success": true,
  "apiKey": "le_abc123...",
  "name": "My Application"
}
```

### GET /api/dashboard/stats

Get usage statistics for your API key.

**Headers:**
```
X-API-Key: your_api_key
```

## Deployment

### Railway

1. Push to GitHub
2. Connect Railway to your repo
3. Add environment variables in Railway dashboard
4. Deploy!

### Render

1. Create a new Web Service
2. Connect your GitHub repo
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variables
6. Deploy!

## Tech Stack

- Node.js + Express
- PostgreSQL
- Hunter.io API
- Clearbit API
- Rate limiting with express-rate-limit
- JWT for API keys

## License

MIT

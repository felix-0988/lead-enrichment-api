# Lead Enrichment API Documentation

**Version:** 1.0.0  
**Base URL:** `http://localhost:3000`  
**Dashboard:** `http://localhost:3000` (Interactive UI)

---

## Overview

The Lead Enrichment API provides email and domain enrichment capabilities, delivering detailed company data for any valid email address or domain. The API supports:

- **Email Enrichment** - Get company data from email addresses
- **Domain Enrichment** - Get company information from domain names
- **API Key Authentication** - Secure access control
- **Rate Limiting** - 100 requests per 15 minutes per API key
- **Response Caching** - 24-hour cache for improved performance
- **Mock Data Support** - Works without external API keys for testing/MVP

---

## Authentication

All API requests (except health check and documentation) require an API key passed in the `X-API-Key` header.

```bash
curl -X POST http://localhost:3000/api/enrich/email \
  -H "X-API-Key: your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com"}'
```

### Generating an API Key

```bash
POST /api/auth/generate-key
Content-Type: application/json

{
  "name": "My Application"
}
```

**Response:**
```json
{
  "success": true,
  "apiKey": "le_39b3b76a7cb8dee141b05047f087c8380447d9be2e0d8360a75d6bda6f063a93",
  "name": "My Application",
  "createdAt": "2026-02-10T16:09:19.181Z",
  "message": "Store this API key securely. It will not be shown again."
}
```

**⚠️ Important:** The API key is only returned once. Store it securely.

---

## Endpoints

### 1. Health Check

Check if the API is running.

```
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-10T16:09:19.181Z"
}
```

---

### 2. Enrich Email

Enrich an email address with company data.

```
POST /api/enrich/email
Headers:
  X-API-Key: your_api_key
  Content-Type: application/json

Body:
{
  "email": "john@stripe.com",
  "source": "auto"  // optional: "hunter", "clearbit", "mock", or "auto"
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "email": "john@stripe.com",
    "status": "valid",
    "result": "deliverable",
    "score": 95,
    "disposable": false,
    "webmail": false,
    "mx_records": true,
    "smtp_check": true,
    "domain": {
      "name": "Stripe",
      "domain": "stripe.com"
    },
    "company": {
      "name": "Stripe",
      "domain": "stripe.com",
      "description": "Stripe is a leading company in their industry, providing innovative solutions.",
      "industry": "Technology",
      "employees": 412,
      "founded": 1990,
      "location": {
        "city": "San Francisco",
        "state": "California",
        "country": "United States"
      },
      "website": "https://stripe.com",
      "linkedin": "https://linkedin.com/company/stripe"
    },
    "source": "mock",
    "cached": false
  }
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `email` | string | The email address queried |
| `status` | string | Email verification status (valid, invalid, etc.) |
| `result` | string | Deliverability result |
| `score` | number | Quality score (0-100) |
| `disposable` | boolean | Whether it's a disposable email |
| `webmail` | boolean | Whether it's a webmail provider |
| `company` | object | Company details |
| `source` | string | Data source (hunter, clearbit, mock) |
| `cached` | boolean | Whether result was from cache |

---

### 3. Enrich Domain

Enrich a domain with company information.

```
POST /api/enrich/domain
Headers:
  X-API-Key: your_api_key
  Content-Type: application/json

Body:
{
  "domain": "stripe.com",
  "source": "auto"  // optional: "hunter", "clearbit", "mock", or "auto"
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "domain": "stripe.com",
    "name": "Stripe",
    "description": "Stripe is a leading company in their industry, providing innovative solutions and services to customers worldwide.",
    "industry": "SaaS",
    "employees": 5591,
    "employeesRange": "51-200",
    "foundedYear": 1982,
    "revenue": "$10M - $50M",
    "location": {
      "city": "San Francisco",
      "state": "California",
      "country": "United States"
    },
    "website": "https://stripe.com",
    "linkedin": "https://linkedin.com/company/stripe",
    "twitter": "@stripe",
    "logo": "https://logo.clearbit.com/stripe.com",
    "tags": ["technology", "innovation", "growth", "startup"],
    "tech": ["AWS", "React", "Node.js", "PostgreSQL", "Docker"],
    "source": "mock",
    "cached": false
  }
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `domain` | string | The domain queried |
| `name` | string | Company name |
| `description` | string | Company description |
| `industry` | string | Industry classification |
| `employees` | number | Employee count |
| `employeesRange` | string | Employee range |
| `foundedYear` | number | Year founded |
| `revenue` | string | Estimated revenue |
| `location` | object | Location details |
| `website` | string | Company website |
| `linkedin` | string | LinkedIn URL |
| `twitter` | string | Twitter handle |
| `logo` | string | Logo URL |
| `tags` | array | Company tags |
| `tech` | array | Technologies used |
| `source` | string | Data source |
| `cached` | boolean | Whether result was from cache |

---

### 4. Dashboard Stats

Get usage statistics for your API key.

```
GET /api/dashboard/stats?days=30
Headers:
  X-API-Key: your_api_key
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "total_requests": 2,
    "email_requests": 1,
    "domain_requests": 1,
    "requests_today": 2,
    "first_request": "2026-02-10 16:08:50",
    "last_request": "2026-02-10 16:08:50",
    "success_rate": 100,
    "period_days": 30
  },
  "daily_breakdown": [
    {
      "date": "2026-02-10",
      "requests": 2,
      "emails": 1,
      "domains": 1
    }
  ]
}
```

---

### 5. Global Stats

Get global usage statistics (no authentication required).

```
GET /api/dashboard/global-stats?days=30
```

**Response:**
```json
{
  "success": true,
  "global_stats": {
    "total_requests": 2,
    "email_requests": 1,
    "domain_requests": 1,
    "active_keys": 1,
    "period_days": 30
  },
  "top_api_keys": [
    {
      "name": "Test Key",
      "requests": 2
    }
  ]
}
```

---

### 6. List API Keys

List all API keys (without the actual key values).

```
GET /api/auth/keys
```

**Response:**
```json
{
  "success": true,
  "keys": [
    {
      "id": 1,
      "name": "Test Key",
      "is_active": 1,
      "created_at": "2026-02-10 16:08:50",
      "last_used_at": "2026-02-10 16:08:50"
    }
  ]
}
```

---

### 7. Deactivate API Key

Deactivate an API key.

```
DELETE /api/auth/keys/:id
```

**Response:**
```json
{
  "success": true,
  "message": "API key deactivated"
}
```

---

### 8. API Documentation (JSON)

Get API documentation in JSON format.

```
GET /api/docs
```

---

## Error Responses

### 400 - Bad Request
```json
{
  "error": "Bad request",
  "message": "Email is required"
}
```

### 401 - Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "API key required. Include X-API-Key header."
}
```

Or:
```json
{
  "error": "Unauthorized",
  "message": "Invalid API key"
}
```

### 429 - Rate Limit Exceeded
```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again later."
}
```

### 500 - Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "Something went wrong"
}
```

---

## Rate Limiting

- **Limit:** 100 requests per 15 minutes per API key
- **Headers:**
  - `X-RateLimit-Limit` - Maximum requests allowed
  - `X-RateLimit-Remaining` - Requests remaining in window
  - `X-RateLimit-Reset` - Time when limit resets (Unix timestamp)

---

## Data Sources

The API supports multiple enrichment sources:

| Source | Email Enrichment | Domain Enrichment | Requires API Key |
|--------|------------------|-------------------|------------------|
| Hunter.io | ✅ | ✅ | `HUNTER_API_KEY` |
| Clearbit | ✅ | ✅ | `CLEARBIT_API_KEY` |
| Mock (MVP) | ✅ | ✅ | None |

### Configuration

Set environment variables to enable external APIs:

```bash
HUNTER_API_KEY=your_hunter_api_key
CLEARBIT_API_KEY=your_clearbit_api_key
```

If no external API keys are provided, the API automatically falls back to mock data for testing and development.

---

## Testing with cURL

### Generate an API Key
```bash
curl -X POST http://localhost:3000/api/auth/generate-key \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Key"}'
```

### Enrich Email
```bash
curl -X POST http://localhost:3000/api/enrich/email \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "john@stripe.com"}'
```

### Enrich Domain
```bash
curl -X POST http://localhost:3000/api/enrich/domain \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"domain": "stripe.com"}'
```

### Get Stats
```bash
curl http://localhost:3000/api/dashboard/stats \
  -H "X-API-Key: YOUR_API_KEY"
```

---

## Web Dashboard

Visit `http://localhost:3000` for an interactive dashboard with:

- API key generation
- Usage statistics
- API playground for testing endpoints
- Documentation

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 3000 | Server port |
| `NODE_ENV` | No | development | Environment mode |
| `DATABASE_URL` | No | sqlite::memory: | Database connection string |
| `USE_SQLITE` | No | true | Use SQLite instead of PostgreSQL |
| `HUNTER_API_KEY` | No | - | Hunter.io API key |
| `CLEARBIT_API_KEY` | No | - | Clearbit API key |
| `RATE_LIMIT_WINDOW_MS` | No | 900000 | Rate limit window (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | No | 100 | Max requests per window |

---

## Quick Start

```bash
# 1. Clone and install dependencies
cd lead-enrichment-api
npm install

# 2. Start the server
npm start

# 3. Open dashboard
open http://localhost:3000

# 4. Generate an API key and start using the API!
```

---

## License

MIT

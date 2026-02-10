const axios = require('axios');
const db = require('../db');

// Mock data generator for MVP
const mockData = {
  enrichEmail(email) {
    const domain = email.split('@')[1];
    const companyName = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
    
    return {
      email,
      status: 'valid',
      result: 'deliverable',
      score: 95,
      disposable: false,
      webmail: ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'].includes(domain),
      mx_records: true,
      smtp_check: true,
      domain: {
        name: companyName,
        domain: domain
      },
      company: {
        name: companyName,
        domain: domain,
        description: `${companyName} is a leading company in their industry, providing innovative solutions.`,
        industry: 'Technology',
        employees: Math.floor(Math.random() * 5000) + 50,
        founded: Math.floor(Math.random() * 30) + 1990,
        location: {
          city: 'San Francisco',
          state: 'California',
          country: 'United States'
        },
        website: `https://${domain}`,
        linkedin: `https://linkedin.com/company/${domain.split('.')[0]}`
      }
    };
  },

  enrichDomain(domain) {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const name = cleanDomain.split('.')[0].charAt(0).toUpperCase() + cleanDomain.split('.')[0].slice(1);
    
    return {
      domain: cleanDomain,
      name: name,
      description: `${name} is a leading company in their industry, providing innovative solutions and services to customers worldwide.`,
      industry: ['Technology', 'Financial Services', 'Healthcare', 'E-commerce', 'SaaS'][Math.floor(Math.random() * 5)],
      employees: Math.floor(Math.random() * 10000) + 10,
      employeesRange: '51-200',
      foundedYear: Math.floor(Math.random() * 40) + 1980,
      revenue: '$10M - $50M',
      location: {
        city: ['San Francisco', 'New York', 'London', 'Austin', 'Seattle'][Math.floor(Math.random() * 5)],
        state: 'California',
        country: 'United States'
      },
      website: `https://${cleanDomain}`,
      linkedin: `https://linkedin.com/company/${cleanDomain.split('.')[0]}`,
      twitter: `@${cleanDomain.split('.')[0]}`,
      logo: `https://logo.clearbit.com/${cleanDomain}`,
      tags: ['technology', 'innovation', 'growth', 'startup'],
      tech: ['AWS', 'React', 'Node.js', 'PostgreSQL', 'Docker']
    };
  }
};

// Hunter.io API integration
const hunterApi = {
  baseURL: 'https://api.hunter.io/v2',
  
  async enrichEmail(email) {
    const apiKey = process.env.HUNTER_API_KEY;
    if (!apiKey) {
      throw new Error('Hunter API key not configured');
    }

    try {
      const response = await axios.get(`${this.baseURL}/email-verifier`, {
        params: { email, api_key: apiKey }
      });

      const data = response.data.data;
      return {
        email: data.email,
        status: data.status,
        result: data.result,
        score: data.score,
        regexp: data.regexp,
        gibberish: data.gibberish,
        disposable: data.disposable,
        webmail: data.webmail,
        mx_records: data.mx_records,
        smtp_server: data.smtp_server,
        smtp_check: data.smtp_check,
        accept_all: data.accept_all,
        block: data.block,
        sources: data.sources
      };
    } catch (error) {
      console.error('Hunter API error:', error.response?.data || error.message);
      throw new Error('Failed to enrich email with Hunter');
    }
  },

  async enrichDomain(domain) {
    const apiKey = process.env.HUNTER_API_KEY;
    if (!apiKey) {
      throw new Error('Hunter API key not configured');
    }

    try {
      const response = await axios.get(`${this.baseURL}/domain-search`, {
        params: { domain, api_key: apiKey }
      });

      const data = response.data.data;
      return {
        domain: data.domain,
        disposable: data.disposable,
        webmail: data.webmail,
        accept_all: data.accept_all,
        pattern: data.pattern,
        organization: data.organization,
        description: data.description,
        industry: data.industry,
        company_type: data.company_type,
        headquarters: data.headquarters,
        linkedin_url: data.linkedin_url,
        twitter: data.twitter,
        facebook: data.facebook,
        phone_number: data.phone_number,
        email_count: data.emails?.length || 0,
        emails: data.emails?.slice(0, 10) // Limit to first 10 emails
      };
    } catch (error) {
      console.error('Hunter API error:', error.response?.data || error.message);
      throw new Error('Failed to enrich domain with Hunter');
    }
  }
};

// Clearbit API integration
const clearbitApi = {
  baseURL: 'https://company.clearbit.com/v2',
  
  getHeaders() {
    const apiKey = process.env.CLEARBIT_API_KEY;
    if (!apiKey) {
      throw new Error('Clearbit API key not configured');
    }
    return {
      'Authorization': `Bearer ${apiKey}`
    };
  },

  async enrichEmail(email) {
    try {
      // Clearbit Reveal API - identify company from email domain
      const domain = email.split('@')[1];
      const companyData = await this.enrichDomain(domain);
      
      return {
        email,
        domain,
        company: companyData
      };
    } catch (error) {
      console.error('Clearbit API error:', error.response?.data || error.message);
      throw new Error('Failed to enrich email with Clearbit');
    }
  },

  async enrichDomain(domain) {
    try {
      const response = await axios.get(`${this.baseURL}/companies/find`, {
        headers: this.getHeaders(),
        params: { domain }
      });

      const data = response.data;
      return {
        domain: data.domain,
        name: data.name,
        legalName: data.legalName,
        description: data.description,
        category: {
          industry: data.category?.industry,
          subIndustry: data.category?.subIndustry,
          industryGroup: data.category?.industryGroup,
          sector: data.category?.sector
        },
        tags: data.tags,
        raised: data.raised,
        employees: data.metrics?.employees,
        employeesRange: data.metrics?.employeesRange,
        revenue: data.metrics?.estimatedAnnualRevenue,
        facebook: data.facebook?.handle,
        linkedin: data.linkedin?.handle,
        twitter: data.twitter?.handle,
        logo: data.logo,
        location: {
          city: data.geo?.city,
          state: data.geo?.state,
          country: data.geo?.country,
          postalCode: data.geo?.postalCode
        },
        foundedYear: data.foundedYear,
        tech: data.tech
      };
    } catch (error) {
      if (error.response?.status === 404) {
        return { domain, found: false, message: 'Company not found' };
      }
      console.error('Clearbit API error:', error.response?.data || error.message);
      throw new Error('Failed to enrich domain with Clearbit');
    }
  }
};

// Cache functions
const cache = {
  async get(type, query) {
    try {
      const result = await db.query(
        'SELECT data, source FROM enrichment_cache WHERE type = $1 AND query = $2 AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)',
        [type, query]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  async set(type, query, data, source, ttlHours = 24) {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + ttlHours);
      
      await db.query(
        `INSERT INTO enrichment_cache (type, query, data, source, expires_at) 
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (type, query) 
         DO UPDATE SET data = $3, source = $4, expires_at = $5, created_at = CURRENT_TIMESTAMP`,
        [type, query, JSON.stringify(data), source, expiresAt]
      );
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }
};

// Main enrichment service
const enrichmentService = {
  async enrichEmail(email, preferSource = 'auto') {
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    // Check cache first
    const cached = await cache.get('email', email);
    if (cached) {
      return {
        email,
        ...cached.data,
        source: cached.source,
        cached: true
      };
    }

    // Try enrichment APIs
    let result = null;
    let source = null;

    // Prefer Hunter for email-specific data, Clearbit for company data
    if (preferSource === 'hunter' || (preferSource === 'auto' && process.env.HUNTER_API_KEY)) {
      try {
        result = await hunterApi.enrichEmail(email);
        source = 'hunter';
      } catch (error) {
        console.log('Hunter failed, trying Clearbit...');
      }
    }

    if (!result && (preferSource === 'clearbit' || process.env.CLEARBIT_API_KEY)) {
      try {
        result = await clearbitApi.enrichEmail(email);
        source = 'clearbit';
      } catch (error) {
        console.log('Clearbit failed');
      }
    }

    // Fallback to mock data for MVP
    if (!result) {
      console.log('Using mock data for email enrichment');
      result = mockData.enrichEmail(email);
      source = 'mock';
    }

    // Cache the result
    await cache.set('email', email, result, source);

    return {
      email,
      ...result,
      source,
      cached: false
    };
  },

  async enrichDomain(domain, preferSource = 'auto') {
    // Validate domain
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    
    if (!domainRegex.test(cleanDomain)) {
      throw new Error('Invalid domain format');
    }

    // Check cache first
    const cached = await cache.get('domain', cleanDomain);
    if (cached) {
      return {
        domain: cleanDomain,
        ...cached.data,
        source: cached.source,
        cached: true
      };
    }

    // Try enrichment APIs
    let result = null;
    let source = null;

    if (preferSource === 'clearbit' || (preferSource === 'auto' && process.env.CLEARBIT_API_KEY)) {
      try {
        result = await clearbitApi.enrichDomain(cleanDomain);
        source = 'clearbit';
      } catch (error) {
        console.log('Clearbit failed, trying Hunter...');
      }
    }

    if ((!result || result.found === false) && (preferSource === 'hunter' || process.env.HUNTER_API_KEY)) {
      try {
        result = await hunterApi.enrichDomain(cleanDomain);
        source = 'hunter';
      } catch (error) {
        console.log('Hunter failed');
      }
    }

    // Fallback to mock data for MVP
    if (!result) {
      console.log('Using mock data for domain enrichment');
      result = mockData.enrichDomain(cleanDomain);
      source = 'mock';
    }

    // Cache the result
    await cache.set('domain', cleanDomain, result, source);

    return {
      domain: cleanDomain,
      ...result,
      source,
      cached: false
    };
  }
};

module.exports = enrichmentService;

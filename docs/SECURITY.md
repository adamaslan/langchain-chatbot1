# Lang Chat Gem - Security Guide

**Status**: Public Repository  
**Last Updated**: December 2025

## Overview

This guide covers security best practices for deploying and maintaining Lang Chat Gem in production. Since this is a public repository, follow these guidelines carefully.

---

## Table of Contents

1. [Secrets Management](#secrets-management)
2. [Environment Variables](#environment-variables)
3. [API Security](#api-security)
4. [Firestore Security](#firestore-security)
5. [Service Account Management](#service-account-management)
6. [Authentication & Authorization](#authentication--authorization)
7. [Input Validation](#input-validation)
8. [Network Security](#network-security)
9. [Dependency Management](#dependency-management)
10. [Monitoring & Logging](#monitoring--logging)

---

## Secrets Management

### Never Commit Secrets

**❌ DO NOT:**
- Commit API keys, passwords, or tokens
- Commit service account JSON keys
- Commit private credentials of any kind
- Commit `.env` files with real values

**✅ DO:**
- Use `.gitignore` to exclude sensitive files:
  ```
  .env
  .env.local
  .env.*.local
  config/gcp-key.json
  *.key
  *.pem
  ```

### Secret Rotation

- Rotate service account keys every 90 days
- Revoke old keys immediately after rotation
- Use key versioning in your secret management system

```bash
# List old keys
gcloud iam service-accounts keys list \
  --iam-account=YOUR_SERVICE_ACCOUNT_NAME@YOUR_GCP_PROJECT_ID.iam.gserviceaccount.com

# Delete old key
gcloud iam service-accounts keys delete KEY_ID \
  --iam-account=YOUR_SERVICE_ACCOUNT_NAME@YOUR_GCP_PROJECT_ID.iam.gserviceaccount.com
```

---

## Environment Variables

### Required Secrets (Never Share)

```bash
# .env.local (local development only - NEVER commit)
GCP_PROJECT_ID=YOUR_GCP_PROJECT_ID
GOOGLE_APPLICATION_CREDENTIALS=./config/gcp-key.json

# For Vertex AI
VERTEX_AI_MODEL_ID=gemini-1.5-flash
VERTEX_AI_REGION=us-central1

# For Gemini Chat (if using)
GOOGLE_API_KEY=your_gemini_api_key_here
```

### Production Deployment

Use your hosting platform's secrets management:

- **Vercel**: Environment Variables in Dashboard (encrypted at rest)
- **Google Cloud Run**: Secret Manager
- **AWS**: Secrets Manager or Parameter Store
- **Azure**: Key Vault

**Example with Google Cloud Secret Manager:**

```bash
# Create secrets
gcloud secrets create GCP_PROJECT_ID --data-file=- <<< "YOUR_GCP_PROJECT_ID"
gcloud secrets create GOOGLE_API_KEY --data-file=- <<< "your_key"

# Grant access to Cloud Run service
gcloud secrets add-iam-policy-binding GCP_PROJECT_ID \
  --member=serviceAccount:YOUR_SERVICE_ACCOUNT@PROJECT_ID.iam.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor
```

---

## API Security

### Rate Limiting

Implement rate limiting on all API endpoints:

```typescript
// Example middleware for Next.js API routes
import { NextRequest, NextResponse } from 'next/server';

const rateLimit = new Map<string, number[]>();

export function withRateLimit(maxRequests = 10, windowMs = 60000) {
  return (handler: any) => async (req: NextRequest) => {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    
    if (!rateLimit.has(ip)) {
      rateLimit.set(ip, []);
    }
    
    const timestamps = rateLimit.get(ip)!;
    const recentRequests = timestamps.filter(t => now - t < windowMs);
    
    if (recentRequests.length >= maxRequests) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }
    
    recentRequests.push(now);
    rateLimit.set(ip, recentRequests);
    
    return handler(req);
  };
}
```

### CORS Configuration

Restrict CORS to known domains:

```typescript
// app/api/analyze/route.ts
export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin');
  const allowedOrigins = [
    'https://yourdomain.com',
    'https://app.yourdomain.com'
  ];

  if (!allowedOrigins.includes(origin || '')) {
    return NextResponse.json(
      { error: 'CORS not allowed' },
      { status: 403 }
    );
  }

  // ... rest of handler
}
```

### API Key Validation

- Validate API keys before processing requests
- Use short-lived tokens (JWT with expiration)
- Implement key rotation policies

---

## Firestore Security

### Security Rules

Deploy strict Firestore security rules:

```javascript
// firestore.rules - Production Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Analysis data - read-only for authenticated users
    match /analysis/{document=**} {
      allow read: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow create: if request.auth != null && 
                       validSymbol(request.resource.data.symbol) &&
                       validPeriod(request.resource.data.period);
      allow update: if false;
      allow delete: if request.auth.uid == resource.data.userId;
    }
    
    // Cache - internal only
    match /cache/{document=**} {
      allow read: if false;
      allow write: if false;
    }
    
    // Public indicators (read-only)
    match /indicators/{document=**} {
      allow read: if true;
      allow write: if false;
    }
    
    // Signals - read-only
    match /signals/{document=**} {
      allow read: if true;
      allow write: if false;
    }
    
    // Helper functions
    function validSymbol(symbol) {
      return symbol.matches('[A-Z]{1,5}');
    }
    
    function validPeriod(period) {
      return period in ['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y'];
    }
  }
}
```

### Data Encryption

- Enable Firestore encryption at rest (default in Google Cloud)
- Use encrypted connections (HTTPS/TLS) for all data transfers
- Consider field-level encryption for sensitive data

---

## Service Account Management

### Principle of Least Privilege

Create multiple service accounts with specific roles:

```bash
# Service account for Firestore only
gcloud iam service-accounts create firestore-sa \
  --display-name="Firestore Operations"

gcloud projects add-iam-policy-binding YOUR_GCP_PROJECT_ID \
  --member=serviceAccount:firestore-sa@YOUR_GCP_PROJECT_ID.iam.gserviceaccount.com \
  --role=roles/datastore.user

# Service account for Vertex AI only
gcloud iam service-accounts create vertex-ai-sa \
  --display-name="Vertex AI Operations"

gcloud projects add-iam-policy-binding YOUR_GCP_PROJECT_ID \
  --member=serviceAccount:vertex-ai-sa@YOUR_GCP_PROJECT_ID.iam.gserviceaccount.com \
  --role=roles/aiplatform.user
```

### Key Management

```bash
# List keys
gcloud iam service-accounts keys list \
  --iam-account=YOUR_SERVICE_ACCOUNT@YOUR_GCP_PROJECT_ID.iam.gserviceaccount.com

# Delete unused keys
gcloud iam service-accounts keys delete KEY_ID \
  --iam-account=YOUR_SERVICE_ACCOUNT@YOUR_GCP_PROJECT_ID.iam.gserviceaccount.com

# Rotate keys
gcloud iam service-accounts keys create new-key.json \
  --iam-account=YOUR_SERVICE_ACCOUNT@YOUR_GCP_PROJECT_ID.iam.gserviceaccount.com
```

---

## Authentication & Authorization

### User Authentication

For user-facing features, implement authentication:

```typescript
// Use NextAuth.js or similar for OAuth 2.0/OpenID Connect
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // Process authenticated request
}
```

### Token Security

- Use JWT with short expiration (15-30 minutes)
- Implement refresh token rotation
- Store tokens securely (HTTP-only cookies, not localStorage)
- Sign tokens with strong keys

---

## Input Validation

### Symbol Validation

```typescript
// lib/utils/validation.ts
export function validateSymbol(symbol: string): boolean {
  // Only alphanumeric, 1-5 chars
  return /^[A-Z]{1,5}$/.test(symbol.toUpperCase());
}

export function validatePeriod(period: string): boolean {
  const valid = ['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y'];
  return valid.includes(period);
}

export function sanitizeInput(input: string): string {
  return input.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}
```

### Query Parameter Validation

```typescript
// app/api/analyze/route.ts
import { validateSymbol, validatePeriod } from '@/lib/utils/validation';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { symbol, period } = body;

  // Validate inputs
  if (!validateSymbol(symbol)) {
    return NextResponse.json(
      { error: 'Invalid symbol format' },
      { status: 400 }
    );
  }

  if (!validatePeriod(period)) {
    return NextResponse.json(
      { error: 'Invalid period format' },
      { status: 400 }
    );
  }

  // Process request
}
```

---

## Network Security

### HTTPS Enforcement

- Always use HTTPS in production
- Set Strict-Transport-Security header:

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|favicon.ico).*)'],
};
```

### Content Security Policy

```typescript
// next.config.ts
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
  }
];

export default {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  }
};
```

---

## Dependency Management

### Regular Updates

```bash
# Check for vulnerabilities
npm audit

# Fix security issues
npm audit fix

# Update dependencies
npm update

# Check for outdated packages
npm outdated
```

### Automated Dependency Scanning

Add to CI/CD pipeline (GitHub Actions example):

```yaml
# .github/workflows/security.yml
name: Security Checks

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run audit
        run: npm audit --audit-level=moderate
      
      - name: Check for vulnerabilities
        run: npx snyk test --severity-threshold=high
```

### Dependency Pinning

In `package.json`, use exact versions for critical dependencies:

```json
{
  "dependencies": {
    "@google-cloud/firestore": "7.6.0",
    "@google-cloud/vertexai": "1.4.0",
    "next": "16.0.10"
  }
}
```

---

## Monitoring & Logging

### Structured Logging

```typescript
// lib/logger.ts
export const logger = {
  info: (message: string, data?: any) => {
    console.log(JSON.stringify({ level: 'INFO', message, ...data }));
  },
  error: (message: string, error?: any) => {
    console.error(JSON.stringify({ level: 'ERROR', message, error: error?.message }));
  },
  warn: (message: string, data?: any) => {
    console.warn(JSON.stringify({ level: 'WARN', message, ...data }));
  }
};
```

### Audit Logging

```typescript
// Log sensitive operations
logger.info('User analysis', { 
  userId: session.user.id, 
  symbol, 
  timestamp: new Date().toISOString() 
});

logger.error('Failed analysis', { 
  symbol, 
  reason: error.message 
});
```

### Error Handling

Never expose sensitive information in error messages:

```typescript
// ❌ BAD - exposes details
throw new Error(`DB connection failed: ${process.env.DATABASE_URL}`);

// ✅ GOOD - generic message
logger.error('Database connection failed', { reason: error.message });
throw new Error('Service temporarily unavailable');
```

---

## Deployment Checklist

Before deploying to production:

- [ ] All secrets removed from code and `.gitignore` checked
- [ ] Environment variables configured in production platform
- [ ] Firestore security rules deployed and tested
- [ ] HTTPS enabled with valid certificate
- [ ] Security headers configured
- [ ] Rate limiting implemented
- [ ] CORS properly restricted
- [ ] API authentication enabled
- [ ] Input validation on all endpoints
- [ ] Dependency audit passed
- [ ] Error logging configured
- [ ] Database encryption enabled
- [ ] Backups configured
- [ ] Monitoring alerts set up

---

## Reporting Security Issues

If you discover a security vulnerability, **do not** open a public issue. Instead:

1. Email security concerns to your team
2. Include proof of concept (if possible)
3. Allow reasonable time for response
4. Do not share vulnerability details publicly before patch is released

---

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Google Cloud Security Best Practices](https://cloud.google.com/security/best-practices)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/start)
- [npm Audit Documentation](https://docs.npmjs.com/cli/v9/commands/npm-audit)

---

**Last Reviewed**: December 2025  
**Next Review**: June 2026

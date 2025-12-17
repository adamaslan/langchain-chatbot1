# Lang Chat Gem - Installation Guide

**Project**: Lang Chat Gem  
**Type**: AI-Powered Technical Analysis Platform  
**Framework**: Next.js + TypeScript  
**Cloud**: Google Cloud Platform (Firestore + Vertex AI)  
**AI Engine**: LangChain + Gemini

## Overview

Lang Chat Gem is an AI-powered technical analysis platform built with Next.js, Google Cloud services, and LangChain. This guide covers setup, configuration, and deployment.

⚠️ **IMPORTANT - PUBLIC REPOSITORY**: This is a public repository. See [SECURITY.md](./SECURITY.md) for critical security practices including:
- Never committing secrets or credentials
- Managing API keys and service accounts safely
- Deploying with proper environment variable configuration

## Prerequisites

Before installing, ensure you have:

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher (comes with Node.js)
- **Git**: For version control
- **Google Cloud Account**: For Firestore and Vertex AI access
- **GCP Project**: With billing enabled

## Step 1: Clone the Repository

```bash
git clone <repository-url>
cd lang-chat-gem
```

## Step 2: Install Dependencies

```bash
npm install
```

This installs all required packages:

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 16.0.10 | React framework |
| `react` | 19.2.1 | UI library |
| `typescript` | ^5 | Type safety |
| `@google-cloud/firestore` | ^7.6.0 | Database & cache |
| `@google-cloud/vertexai` | ^1.4.0 | AI model access |
| `langchain` | ^0.3.4 | AI orchestration |
| `tailwindcss` | ^4 | Styling |

## Step 3: Google Cloud Setup

### 3.0 Quick Setup (All at Once)

Replace `YOUR_GCP_PROJECT_ID` and `YOUR_SERVICE_ACCOUNT_NAME` with your own values, then run these commands in sequence:

```bash
# Set project context
gcloud config set project YOUR_GCP_PROJECT_ID

# Enable required APIs
gcloud services enable firestore.googleapis.com
gcloud services enable aiplatform.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com

# Create Firestore database
gcloud firestore databases create \
  --database=default \
  --location=us-central1 \
  --type=datastore-mode

# Create service account
gcloud iam service-accounts create YOUR_SERVICE_ACCOUNT_NAME \
  --display-name="Service Account for Lang Chat Gem"

# Grant roles
gcloud projects add-iam-policy-binding YOUR_GCP_PROJECT_ID \
  --member=serviceAccount:YOUR_SERVICE_ACCOUNT_NAME@YOUR_GCP_PROJECT_ID.iam.gserviceaccount.com \
  --role=roles/datastore.user

gcloud projects add-iam-policy-binding YOUR_GCP_PROJECT_ID \
  --member=serviceAccount:YOUR_SERVICE_ACCOUNT_NAME@YOUR_GCP_PROJECT_ID.iam.gserviceaccount.com \
  --role=roles/aiplatform.user

# Create and download JSON key
mkdir -p ./config
gcloud iam service-accounts keys create ./config/gcp-key.json \
  --iam-account=YOUR_SERVICE_ACCOUNT_NAME@YOUR_GCP_PROJECT_ID.iam.gserviceaccount.com

# Setup Firestore rules with Firebase CLI
npm install -g firebase-tools
firebase login --no-localhost
firebase init firestore --project=YOUR_GCP_PROJECT_ID
firebase deploy --only firestore:rules --project=YOUR_GCP_PROJECT_ID

echo "✅ Setup complete!"
echo "Update .env.local with:"
echo "  GCP_PROJECT_ID=YOUR_GCP_PROJECT_ID"
echo "  GOOGLE_APPLICATION_CREDENTIALS=./config/gcp-key.json"
```

### 3.1 Create a GCP Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable billing

Or via gcloud:
```bash
gcloud projects create YOUR_GCP_PROJECT_ID --name="Your Project Name"
gcloud billing projects link YOUR_GCP_PROJECT_ID --billing-account=YOUR_BILLING_ACCOUNT
```

### 3.2 Enable Required APIs

Enable these APIs in your GCP project:

```bash
gcloud services enable firestore.googleapis.com
gcloud services enable aiplatform.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com
```

Or through the Console:
- Cloud Firestore API
- Vertex AI API
- Cloud Resource Manager API

### 3.3 Create a Firestore Database

**Via Console:**
1. In GCP Console, navigate to **Firestore**
2. Click **Create Database**
3. Select **Datastore mode** (or Native mode for specific use cases)
4. Choose region: **us-central1** (default in config)
5. Click **Create**

**Via gcloud CLI:**

```bash
# Set project context
gcloud config set project ttb-lang1

# Create Firestore database in Datastore mode (us-central1)
gcloud firestore databases create \
  --database=default \
  --location=us-central1 \
  --type=datastore-mode

# Verify creation
gcloud firestore databases list
```

### 3.4 Create a Service Account

**Via Console:**
1. Go to **Service Accounts** in IAM & Admin
2. Click **Create Service Account**
3. Name: `lang-chat-gem`
4. Grant these roles:
   - `Cloud Datastore User` (for Firestore)
   - `Vertex AI User` (for AI models)
5. Click **Create and Continue**
6. Create a JSON key
7. Download the key file

**Via gcloud CLI:**

```bash
# Set project context
gcloud config set project ttb-lang1

# Create service account
gcloud iam service-accounts create lang-chat-gem \
  --display-name="Lang Chat Gem Service Account"

# Grant Firestore role
gcloud projects add-iam-policy-binding ttb-lang1 \
  --member=serviceAccount:lang-chat-gem@ttb-lang1.iam.gserviceaccount.com \
  --role=roles/datastore.user

# Grant Vertex AI role
gcloud projects add-iam-policy-binding ttb-lang1 \
  --member=serviceAccount:lang-chat-gem@ttb-lang1.iam.gserviceaccount.com \
  --role=roles/aiplatform.user

# Create and download JSON key
gcloud iam service-accounts keys create ./config/gcp-key.json \
  --iam-account=lang-chat-gem@ttb-lang1.iam.gserviceaccount.com

# Verify key was created
ls -la ./config/gcp-key.json

# List all keys
gcloud iam service-accounts keys list \
  --iam-account=YOUR_SERVICE_ACCOUNT_NAME@YOUR_GCP_PROJECT_ID.iam.gserviceaccount.com
```

**Additional roles you might need:**
```bash
# For Firestore read/write in development
gcloud projects add-iam-policy-binding YOUR_GCP_PROJECT_ID \
  --member=serviceAccount:YOUR_SERVICE_ACCOUNT_NAME@YOUR_GCP_PROJECT_ID.iam.gserviceaccount.com \
  --role=roles/editor  # Use sparingly in production

# For Cloud Logging (optional, for debugging)
gcloud projects add-iam-policy-binding YOUR_GCP_PROJECT_ID \
  --member=serviceAccount:YOUR_SERVICE_ACCOUNT_NAME@YOUR_GCP_PROJECT_ID.iam.gserviceaccount.com \\
  --role=roles/logging.logWriter
```

### 3.5 Setup Firestore Security Rules

**Via Firebase CLI (Recommended - Modern Approach):**

```bash
# Install Firebase CLI globally (if not already installed)
npm install -g firebase-tools

# Navigate to project
cd lang-chat-gem

# Login to Firebase
firebase login --no-localhost

# Initialize Firebase in your project
firebase init firestore --project=YOUR_GCP_PROJECT_ID

# The firestore.rules file will be created
# Update it with appropriate rules (see examples below)

# Deploy the rules
firebase deploy --only firestore:rules

# Verify deployment (via gcloud)
gcloud firestore databases list --project=YOUR_GCP_PROJECT_ID
```

**Via Console:**
1. In Firestore, go to **Rules** tab
2. Paste the rules below
3. Click **Publish**

**Development Rules** (permissive for testing):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow reads on all collections
    match /{collection=**} {
      allow read: if true;
    }
    
    // Allow writes only to authenticated service account
    match /{collection=**} {
      allow write: if request.auth != null;
    }
    
    // Public cache reads (no auth required)
    match /vertex_cache/{document=**} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

**Production Rules** (more restrictive):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Analysis data - read-only
    match /analysis/{document=**} {
      allow read: if true;
      allow write: if false;
    }
    
    // OHLCV data - read-only
    match /ohlcv/{document=**} {
      allow read: if true;
      allow write: if false;
    }
    
    // Signals - read-only
    match /signals/{document=**} {
      allow read: if true;
      allow write: if false;
    }
    
    // Cache - public reads, service account writes only
    match /vertex_cache/{document=**} {
      allow read: if true;
      allow write: if request.auth.uid != null;
    }
    
    // Indicators - read-only
    match /indicators/{document=**} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

**Deploy to production:**

```bash
# Update firestore.rules with production rules above
# Then deploy
firebase deploy --only firestore:rules --project=ttb-lang1
```

**For gcloud CLI** (if Firebase CLI unavailable):

Note: The old `gcloud firestore rules deploy` command is deprecated. Use Firebase CLI instead.

## Step 4: Environment Configuration

### 4.1 Create `.env.local`

In the project root, create `.env.local`:

```bash
# GCP Configuration
GCP_PROJECT_ID=your-gcp-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json

# Vertex AI Configuration
VERTEX_AI_MODEL_ID=gemini-1.5-flash

# Optional: API Keys (if using direct API calls)
YAHOO_FINANCE_API_KEY=your-api-key-optional
```

### 4.2 Place Service Account Key

```bash
# Copy the downloaded JSON key to your project
cp /path/to/downloaded/key.json ./config/gcp-key.json

# Update GOOGLE_APPLICATION_CREDENTIALS in .env.local
GOOGLE_APPLICATION_CREDENTIALS=./config/gcp-key.json
```

### 4.3 Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `GCP_PROJECT_ID` | ✅ | Your GCP project ID | `my-project-12345` |
| `GOOGLE_APPLICATION_CREDENTIALS` | ✅ | Path to service account JSON | `./config/gcp-key.json` |
| `VERTEX_AI_MODEL_ID` | ✅ | AI model to use | `gemini-1.5-flash` |
| `YAHOO_FINANCE_API_KEY` | ❌ | Yahoo Finance API key (optional) | `abc123def456` |
| `NODE_ENV` | ❌ | Environment | `development` or `production` |

## Step 5: Verify Configuration

### 5.1 Test Google Cloud Access

Create a test file `test-gcp.ts`:

```typescript
import { Firestore } from "@google-cloud/firestore";
import { VertexAI } from "@google-cloud/vertexai";
import { GCP_CONFIG } from "./config/gcp";

async function testGCP() {
  try {
    // Test Firestore
    const db = new Firestore({ projectId: GCP_CONFIG.projectId });
    const test = await db.collection("test").doc("test").get();
    console.log("✅ Firestore connection OK");

    // Test Vertex AI
    const vertexAI = new VertexAI({
      project: GCP_CONFIG.projectId,
      location: GCP_CONFIG.vertexAI.location,
    });
    const model = vertexAI.getGenerativeModel({
      model: GCP_CONFIG.vertexAI.modelId,
    });
    console.log("✅ Vertex AI connection OK");
  } catch (error) {
    console.error("❌ Configuration Error:", error);
  }
}

testGCP();
```

Run it:

```bash
npx ts-node test-gcp.ts
```

## Step 6: Start Development Server

```bash
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3000/api/*

### Development Commands

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Run linting with fixes
npm run lint -- --fix
```

## Step 7: Verify Installation

1. Open http://localhost:3000
2. You should see the landing page with all services listed
3. Try the analyze endpoint:

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"symbol":"AAPL","period":"1y"}'
```

Expected response:

```json
{
  "symbol": "AAPL",
  "price": 185.35,
  "change": 2.5,
  "indicators": {
    "RSI": 65.2,
    "MACD": 0.0234,
    ...
  },
  "signals": [
    {
      "signal": "PRICE ABOVE 20MA",
      "strength": "BULLISH",
      "score": 85,
      ...
    }
  ],
  "timestamp": "2025-12-16T10:30:00Z"
}
```

## Troubleshooting

### "No matching version found"

**Problem**: `npm install` fails with version conflicts

**Solution**:
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### "GOOGLE_APPLICATION_CREDENTIALS not found"

**Problem**: Service account key path is incorrect

**Solution**:
```bash
# Check file exists
ls -la ./config/gcp-key.json

# Update .env.local with absolute path if needed
GOOGLE_APPLICATION_CREDENTIALS=/full/path/to/gcp-key.json
```

### "Firestore permission denied"

**Problem**: Service account lacks permissions

**Solution**:
1. Check service account has these roles:
   - `Cloud Datastore User`
   - `Editor` (for development, more restrictive in production)
2. Wait 5-10 minutes for role propagation
3. Restart the dev server

### "Vertex AI quota exceeded"

**Problem**: Too many API calls

**Solution**:
- Check `GCP_CONFIG.limits` in `config/gcp.ts`
- Implement request batching (already done in ranking service)
- Use caching (TTL values in config)

### Build fails with TypeScript errors

**Problem**: Type checking fails

**Solution**:
```bash
# Check for errors
npm run lint

# Fix automatically
npm run lint -- --fix

# Generate type definitions
npx tsc --noEmit
```

## Production Deployment

### On Vercel

```bash
# Push to GitHub
git push origin main

# Connect to Vercel
# 1. Go to vercel.com
# 2. Import repository
# 3. Add environment variables
# 4. Deploy
```

Set these in Vercel:
- `GCP_PROJECT_ID`
- `GOOGLE_APPLICATION_CREDENTIALS` (contents of JSON key)
- `VERTEX_AI_MODEL_ID`

### On Google Cloud Run

```bash
# Create Dockerfile
cat > Dockerfile << EOF
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
CMD ["npm", "start"]
ENV PORT=8080
EXPOSE 8080
EOF

# Build and deploy
gcloud run deploy lang-chat-gem \
  --source . \
  --platform managed \
  --region us-central1 \
  --set-env-vars GCP_PROJECT_ID=your-project-id
```

## Next Steps

- Read the [Services Guide](./SERVICES.md) to understand each component
- Check the [README](../README.md) for quick start
- Review API examples in the landing page
- Configure custom cache TTLs in `config/gcp.ts`

## Support

For issues:

1. Check the troubleshooting section above
2. Review environment variable configuration
3. Check GCP Console for API errors
4. Review Next.js logs in terminal
5. Check Firestore rules in GCP Console

---

**Last Updated**: December 2025

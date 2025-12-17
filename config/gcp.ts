import path from "path";

// Resolve the credentials path at runtime
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  
  // If it's a relative path, resolve it from project root
  if (!path.isAbsolute(credPath)) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = path.resolve(
      process.cwd(),
      credPath
    );
  }
}


export const GCP_CONFIG = {
  projectId: process.env.GCP_PROJECT_ID || "",
  firestore: {
    database: "(default)",
    region: "us-central1",
  },
  vertexAI: {
    location: "us-east4",
    modelId: "gemini-2.5-flash",
    maxTokens: 512,
  },
  ttl: {
    ohlcv: 86400,
    indicators: 7200,
    signals: 3600,
    analysis: 604800,
    vertexCache: 172800,
  },
  limits: {
    maxRequests: 50,
    maxSymbols: 100,
    batchSize: 20,
    maxSignalsPerRequest: 100,
    dailyAnalysisLimit: 500,
  },
  rateLimit: {
    requestsPerMinute: 10,
    requestsPerDay: 500,
  },
};

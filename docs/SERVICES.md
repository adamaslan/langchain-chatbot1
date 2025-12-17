# Lang Chat Gem - Services and Architecture Guide

**Project**: Lang Chat Gem  
**Version**: 1.0  
**Last Updated**: December 2025  
**Stack**: Next.js 16, TypeScript, Firestore, Vertex AI, LangChain

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Services](#core-services)
3. [API Routes](#api-routes)
4. [Data Types](#data-types)
5. [Configuration](#configuration)
6. [Advanced Usage](#advanced-usage)

---

## Architecture Overview

Lang Chat Gem uses a **three-layer architecture**:

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│  (Next.js Pages, Chat UI, Dashboard)    │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│      API & Orchestration Layer          │
│  (API Routes, Analysis Service)         │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│    Service & Analysis Layer             │
│  ┌─────────┬──────────┬───────────┐    │
│  │  Data   │Indicators│ Signals   │    │
│  ├─────────┼──────────┼───────────┤    │
│  │ Ranking │ Vertex AI│   Chat    │    │
│  └─────────┴──────────┴───────────┘    │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│      External Services Layer            │
│  ┌──────────┬────────────┬────────────┐ │
│  │ Firestore│ Vertex AI  │  Yahoo API │ │
│  └──────────┴────────────┴────────────┘ │
└─────────────────────────────────────────┘
```

### Data Flow

```
User Request → API Route → Analysis Service 
    ↓
Data Service (fetch from Yahoo Finance)
    ↓
Indicators Service (calculate 40+ indicators)
    ↓
Signals Service (detect trading signals)
    ↓
Ranking Service (prioritize by importance)
    ↓
Vertex AI Service (AI-powered scoring)
    ↓
Response to User
```

---

## Core Services

### 1. Data Service (`lib/services/data.ts`)

**Purpose**: Fetches market data and manages caching

**Key Functions**:

```typescript
fetchAndCacheOHLCV(symbol, period)
// Fetches OHLCV data from Yahoo Finance
// Caches in Firestore with TTL
// Returns: OHLCV[]

getCache(collection, key)
// Retrieves data from Firestore cache
// Checks expiry and auto-deletes expired data
// Returns: unknown | null

setCache(collection, key, value, ttlSeconds)
// Stores data in Firestore with TTL
// Returns: void

saveAnalysisResult(analysis)
// Persists complete analysis to Firestore
// Returns: void
```

**Features**:

- 📥 Yahoo Finance integration for historical data
- 💾 Intelligent Firestore caching with TTL
- 🔄 Automatic cache invalidation
- ⚡ Multi-symbol batch support

**Cache Collections**:

| Collection | TTL | Purpose |
|-----------|-----|---------|
| `ohlcv` | 86400s (1 day) | Price data |
| `indicators` | 7200s (2 hours) | Calculated indicators |
| `signals` | 3600s (1 hour) | Generated signals |
| `analysis` | 604800s (7 days) | Complete analysis |
| `vertex_cache` | 172800s (2 days) | AI scoring results |

**Example**:

```typescript
import { fetchAndCacheOHLCV, getCache, setCache } from "@/lib/services/data";

// Fetch data
const ohlcv = await fetchAndCacheOHLCV("AAPL", "1y");

// Get from cache
const cached = await getCache("ohlcv", "AAPL");

// Set cache manually
await setCache("custom", "mykey", { data: "value" }, 3600);
```

---

### 2. Indicators Service (`lib/services/indicators.ts`)

**Purpose**: Calculates 40+ technical indicators

**Key Function**:

```typescript
calculateIndicators(ohlcv): Indicator
// Calculates all indicators from OHLCV data
// Returns: Complete indicator object with 40+ metrics
```

**Indicator Categories**:

#### Moving Averages (10 indicators)
- `SMA_10`, `SMA_20`, `SMA_50`, `SMA_100`, `SMA_200`
- `EMA_10`, `EMA_20`, `EMA_50`, `EMA_200`
- `HMA_20` (Hull Moving Average)

**Use**: Identify trend direction and support/resistance

#### Momentum (12 indicators)
- `RSI` (14, 5, 25 periods) - Overbought/oversold
- `STOCH_K`, `STOCH_D` - Stochastic oscillator
- `Williams_R` - Williams %R
- `CCI` - Commodity Channel Index
- `MFI` - Money Flow Index
- `ROC_5`, `ROC_10`, `ROC_20` - Rate of Change

**Use**: Identify momentum and reversal points

#### Trend (8+ indicators)
- `MACD`, `MACD_Signal`, `MACD_Histogram`
- `ADX` (Average Directional Index)
- `Plus_DI`, `Minus_DI` - Directional indicators
- `TEMA` - Triple EMA
- `KST` - Know Sure Thing

**Use**: Confirm trend strength and changes

#### Volatility (8 indicators)
- `BB_Upper`, `BB_Middle`, `BB_Lower` - Bollinger Bands
- `ATR` (Average True Range)
- `ATR_Percent` - Volatility percentage
- `Keltner_Upper`, `Keltner_Lower` - Keltner Channels
- `Standard_Dev` - Standard Deviation

**Use**: Measure market volatility and breakouts

#### Volume Analysis
- `Volume_SMA_20`, `Volume_SMA_50`
- `OBV` - On-Balance Volume
- `VWAP` - Volume Weighted Average Price

**Use**: Confirm price moves with volume

#### Advanced Indicators
- `Ichimoku_Tenkan` - Ichimoku cloud
- `Pivot` - Pivot points
- `Fib_*` - Fibonacci levels

**Example**:

```typescript
import { calculateIndicators } from "@/lib/services/indicators";

const indicators = calculateIndicators(ohlcv);

console.log(indicators.RSI);        // 65.2
console.log(indicators.MACD);       // 0.0234
console.log(indicators.ADX);        // 28.5
console.log(indicators.BB_Upper);   // 185.45
```

---

### 3. Signals Service (`lib/services/signals.ts`)

**Purpose**: Detects trading signals based on indicators

**Key Function**:

```typescript
detectSignals(ohlcv, indicators): Signal[]
// Analyzes OHLCV and indicators
// Returns: Array of detected signals with strength
```

**Signal Types**:

#### Moving Average Signals (14 signals)
- `PRICE ABOVE/BELOW 20MA`, `50MA`, `200MA`
- `MA ALIGNMENT BULLISH/BEARISH` (10>20>50)
- `50MA ABOVE/BELOW 200MA`
- `EMA UPTREND/DOWNTREND`
- `PRICE ABOVE/BELOW EMA20`

#### Momentum Signals (8 signals)
- `RSI OVERBOUGHT` (>70) → BEARISH
- `RSI OVERSOLD` (<30) → BULLISH
- `RSI EXTREME HIGH` (>80)
- `RSI EXTREME LOW` (<20)
- `STOCH OVERBOUGHT/OVERSOLD`

#### Bollinger Band Signals (3 signals)
- `AT LOWER BB` → BULLISH
- `AT UPPER BB` → BEARISH
- `BB SQUEEZE` (bands narrow)

#### Trend Signals (5+ signals)
- `MACD BULLISH CROSS`
- `MACD BEARISH CROSS`
- `STRONG TREND` (ADX > 25)
- `WEAK TREND` (ADX < 15)

#### Volume Signals (3+ signals)
- `VOLUME SPIKE 2X` (2x average)
- `VOLUME SPIKE 3X`
- `DECLINING VOLUME`

#### Fibonacci Signals (9 signals, multi-timeframe)
- Timeframes: 1W, 1M, 3M, 6M, 1Y
- Levels: 23.6%, 38.2%, 50%, 61.8%, 78.6%

#### Candlestick Patterns (5+ signals)
- `HAMMER` (reversal)
- `DOJI` (indecision)
- `ENGULFING` patterns
- `INSIDE BAR`

**Signal Strength Levels**:

| Strength | Meaning | Color |
|----------|---------|-------|
| `STRONG BULLISH` | Very positive | 🟢🟢 |
| `BULLISH` | Positive | 🟢 |
| `NEUTRAL` | No clear direction | ⚪ |
| `BEARISH` | Negative | 🔴 |
| `STRONG BEARISH` | Very negative | 🔴🔴 |
| `EXTREME` | Rare/extreme condition | ⭐ |

**Example**:

```typescript
import { detectSignals } from "@/lib/services/signals";

const signals = detectSignals(ohlcv, indicators);

signals.forEach(signal => {
  console.log(`${signal.signal} - ${signal.strength}`);
  console.log(`Description: ${signal.desc}`);
  console.log(`Category: ${signal.category}`);
});
```

---

### 4. Ranking Service (`lib/services/ranking.ts`)

**Purpose**: Prioritizes signals by importance and correlation

**Key Functions**:

```typescript
rankSignals(signals, indicators): RankedSignal[]
// Ranks signals by correlation and strength
// Removes redundant signals
// Returns: Sorted signals with scores

identifyKeySignals(signals): Signal[]
// Extracts highest priority signals
// Returns: Top signals per category

scoreCategoryConfluence(signals, category): number
// Measures signal confluence
// Returns: 1-10 confidence score
```

**Ranking Criteria**:

1. **Signal Type** - Reliability based on historical accuracy
2. **Confluence** - Multiple indicators agreeing
3. **Category Grouping** - Remove contradictory signals
4. **Market Regime** - Adjust for trending vs ranging
5. **Strength Level** - Weight STRONG signals higher

**Example**:

```typescript
import { rankSignals } from "@/lib/services/ranking";

const ranked = rankSignals(signals, indicators);

// Ranked by importance
ranked.forEach((signal, index) => {
  console.log(`${index + 1}. ${signal.signal} (Score: ${signal.score})`);
});
```

---

### 5. Vertex AI Service (`lib/services/vertex-ai.ts`)

**Purpose**: AI-powered signal scoring and market analysis

**Key Functions**:

```typescript
rankSignalsWithVertexAI(signals, context): Promise<RankedSignal[]>
// Uses Gemini AI to score signals
// Batch processes (up to 15 signals)
// Returns: Signals with AI scores and reasoning

analyzeMarketRegime(indicators): Promise<MarketRegime>
// Determines market conditions
// Returns: { regime, momentum, volatility, volume }

generateStrategyRecommendation(symbol, signals, context): Promise<string>
// AI-generated actionable recommendation
// Returns: Strategy text

identifyKeyLevels(symbol, indicators, ohlcv): Promise<KeyLevels>
// Finds support/resistance levels
// Returns: { support1, support2, resistance1, resistance2 }

filterHighConfidenceSignals(signals, minScore, minConfidence): Promise<Signal[]>
// Filters signals by quality threshold
// Default: score ≥ 70, confidence ≥ 60
```

**Market Regime Analysis**:

```typescript
// Returns one of:
{
  regime: "TRENDING" | "RANGING" | "NEUTRAL",
  momentum: "BULLISH" | "BEARISH" | "NEUTRAL",
  volatility: "HIGH" | "NORMAL" | "LOW",
  volume: "SPIKE" | "NORMAL" | "LOW"
}
```

**Regime Indicators**:

| Regime | ADX | Characteristics |
|--------|-----|-----------------|
| TRENDING | >25 | Strong directional move |
| RANGING | 15-25 | Consolidating |
| NEUTRAL | <15 | No clear direction |

**Example**:

```typescript
import { rankSignalsWithVertexAI, analyzeMarketRegime } from "@/lib/services/vertex-ai";

const regime = await analyzeMarketRegime(indicators);
console.log(`Market is ${regime.regime}`);

const ranked = await rankSignalsWithVertexAI(signals, {
  symbol: "AAPL",
  price: 185.35,
  change: 2.5,
  indicators,
  ...regime
});

// AI-scored signals
ranked.forEach(signal => {
  console.log(`${signal.signal}: ${signal.score}/100 (${signal.confidence}% confidence)`);
  console.log(`Why: ${signal.reasoning}`);
});
```

---

### 6. Analysis Service (`lib/services/analysis.ts`)

**Purpose**: Orchestrates all services into complete analysis

**Key Function**:

```typescript
performCompleteAnalysis(symbol, period): Promise<CompleteAnalysis>
// Runs full pipeline
// Returns: Complete analysis object
```

**Pipeline Steps**:

1. ✅ Fetch OHLCV data (Data Service)
2. ✅ Calculate indicators (Indicators Service)
3. ✅ Detect signals (Signals Service)
4. ✅ Rank signals (Ranking Service)
5. ✅ Score with AI (Vertex AI Service)
6. ✅ Analyze regime (Market analysis)
7. ✅ Identify key levels (Support/resistance)
8. ✅ Generate recommendation (Strategy)
9. ✅ Save results (Data Service)

**Response Format**:

```typescript
{
  symbol: "AAPL",
  price: 185.35,
  change: 2.5,
  timestamp: "2025-12-16T10:30:00Z",
  
  indicators: { /* 40+ indicators */ },
  signals: {
    total: 28,
    bullish: 15,
    bearish: 8,
    neutral: 5,
    signals: [ /* RankedSignal[] */ ]
  },
  
  market: {
    regime: "TRENDING",
    momentum: "BULLISH",
    volatility: "NORMAL",
    volume: "NORMAL",
    confluence: 8.5
  },
  
  levels: {
    support1: 183.50,
    support2: 180.25,
    resistance1: 188.00,
    resistance2: 190.50
  },
  
  recommendation: "...",
  keyLevel: "618 Fibonacci"
}
```

**Example**:

```typescript
import { performCompleteAnalysis } from "@/lib/services/analysis";

const analysis = await performCompleteAnalysis("AAPL", "1y");

console.log(`${analysis.symbol}: $${analysis.price}`);
console.log(`Signals: ${analysis.signals.bullish} bullish, ${analysis.signals.bearish} bearish`);
console.log(`Recommendation: ${analysis.recommendation}`);
console.log(`Support: $${analysis.levels.support1}`);
console.log(`Resistance: $${analysis.levels.resistance1}`);
```

---

### 7. Chat Service (`lib/services/langchain-chatbot.ts`)

**Purpose**: Conversational interface for market analysis

**Features**:

- 💬 Conversation memory (multi-turn)
- 📊 Context-aware responses
- 🔗 Integrates analysis results
- 🧠 LangChain + Vertex AI

**Example**:

```typescript
import { initializeChatbot, chat } from "@/lib/services/langchain-chatbot";

const chatbot = initializeChatbot("AAPL");

const response = await chat(
  chatbot,
  "What is the outlook for AAPL?"
);

console.log(response);
// "Based on the analysis, AAPL shows a bullish trend with..."
```

---

## API Routes

### `POST /api/analyze`

**Analyzes a single stock symbol**

**Request**:
```json
{
  "symbol": "AAPL",
  "period": "1y"
}
```

**Response**:
```json
{
  "symbol": "AAPL",
  "price": 185.35,
  "change": 2.5,
  "indicators": { /* ... */ },
  "signals": [ /* ... */ ],
  "timestamp": "2025-12-16T10:30:00Z"
}
```

**Parameters**:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `symbol` | string | Required | Stock ticker (e.g., "AAPL") |
| `period` | string | "1y" | Data range: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max |

---

### `POST /api/chat`

**Conversational analysis interface**

**Request**:
```json
{
  "symbol": "AAPL",
  "message": "What is AAPL doing today?",
  "conversationId": "abc123" (optional)
}
```

**Response**:
```json
{
  "conversationId": "abc123",
  "response": "Based on the latest analysis...",
  "context": { /* analysis data */ }
}
```

---

### `GET /api/signals`

**Get real-time signals for multiple symbols**

**Request**:
```
GET /api/signals?symbols=AAPL,MSFT,GOOGL
```

**Response**:
```json
{
  "symbols": ["AAPL", "MSFT", "GOOGL"],
  "signals": {
    "AAPL": [ /* signals */ ],
    "MSFT": [ /* signals */ ],
    "GOOGL": [ /* signals */ ]
  },
  "timestamp": "2025-12-16T10:30:00Z"
}
```

---

### `POST /api/cache`

**Cache management**

**Invalidate cache**:
```json
{
  "action": "invalidate",
  "symbol": "AAPL"
}
```

**Clear collection**:
```json
{
  "action": "clear",
  "collection": "vertex_cache"
}
```

---

## Data Types

### OHLCV

```typescript
interface OHLCV {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
```

### Indicator

```typescript
interface Indicator {
  // Moving Averages
  SMA_10: number;
  SMA_20: number;
  SMA_50: number;
  SMA_200: number;
  EMA_10: number;
  EMA_20: number;
  EMA_50: number;
  EMA_200: number;
  HMA_20: number;

  // Momentum
  RSI: number;
  RSI_5: number;
  RSI_25: number;
  MACD: number;
  MACD_Signal: number;
  MACD_Histogram: number;
  STOCH_K: number;
  STOCH_D: number;
  Williams_R: number;
  CCI: number;
  MFI: number;
  ROC_5: number;
  ROC_10: number;
  ROC_20: number;

  // Trend
  ADX: number;
  Plus_DI: number;
  Minus_DI: number;
  TEMA: number;
  KST: number;

  // Volatility
  BB_Upper: number;
  BB_Lower: number;
  BB_Middle: number;
  BB_Width: number;
  ATR: number;
  ATR_Percent: number;
  Keltner_Upper: number;
  Keltner_Lower: number;

  // Volume
  Volume_SMA_20: number;
  Volume_SMA_50: number;
  OBV: number;
  VWAP: number;

  // Advanced
  Ichimoku_Tenkan: number;
  Pivot: number;
  [key: string]: number;
}
```

### Signal

```typescript
interface Signal {
  signal: string;
  desc: string;
  strength: "BULLISH" | "BEARISH" | "NEUTRAL" | "STRONG BULLISH" | "STRONG BEARISH" | "EXTREME";
  category: string;
  score?: number;
}
```

### RankedSignal

```typescript
interface RankedSignal extends Signal {
  score: number;           // 0-100
  confidence: number;      // 0-100
  reasoning: string;       // AI explanation
}
```

---

## Configuration

### GCP Configuration (`config/gcp.ts`)

```typescript
export const GCP_CONFIG = {
  // GCP Project
  projectId: process.env.GCP_PROJECT_ID || "",
  
  // Firestore
  firestore: {
    database: "(default)",
    region: "us-central1",
  },

  // Vertex AI
  vertexAI: {
    location: "us-central1",
    modelId: "gemini-1.5-flash",  // or gemini-pro, gemini-1.5-pro
    maxTokens: 512,
  },

  // Cache TTL (seconds)
  ttl: {
    ohlcv: 86400,       // 1 day
    indicators: 7200,   // 2 hours
    signals: 3600,      // 1 hour
    analysis: 604800,   // 7 days
    vertexCache: 172800, // 2 days
  },

  // API Limits
  limits: {
    maxRequests: 50,
    maxSymbols: 100,
    batchSize: 20,
    maxSignalsPerRequest: 100,
    dailyAnalysisLimit: 500,
  },

  // Rate Limiting
  rateLimit: {
    requestsPerMinute: 10,
    requestsPerDay: 500,
  },
};
```

### Tuning Configuration

**For High-Frequency Analysis** (many requests):
```typescript
ttl: {
  ohlcv: 3600,        // 1 hour instead of 1 day
  indicators: 1800,   // 30 min
  signals: 900,       // 15 min
  vertexCache: 3600,  // 1 hour
}
```

**For AI Quality** (better scoring):
```typescript
vertexAI: {
  modelId: "gemini-1.5-pro",  // More accurate than flash
  maxTokens: 1024,  // More reasoning
}
```

**For Cost Control**:
```typescript
limits: {
  maxRequests: 20,        // Fewer requests
  dailyAnalysisLimit: 100, // Lower daily limit
}
```

---

## Advanced Usage

### Custom Signal Detection

```typescript
import { Signal } from "@/lib/types";

function detectCustomSignals(indicators): Signal[] {
  const signals: Signal[] = [];

  // Your custom logic
  if (indicators.RSI > 75 && indicators.ADX > 30) {
    signals.push({
      signal: "EXTREME MOMENTUM",
      desc: "Very high RSI with strong trend",
      strength: "STRONG BULLISH",
      category: "CUSTOM"
    });
  }

  return signals;
}
```

### Batch Analysis

```typescript
import { performCompleteAnalysis } from "@/lib/services/analysis";

const symbols = ["AAPL", "MSFT", "GOOGL"];

const results = await Promise.all(
  symbols.map(symbol => performCompleteAnalysis(symbol, "1y"))
);

results.forEach(analysis => {
  console.log(`${analysis.symbol}: ${analysis.signals.length} signals`);
});
```

### Real-time Monitoring

```typescript
// Poll every minute
setInterval(async () => {
  const analysis = await performCompleteAnalysis("AAPL", "5d");
  
  // Trigger alerts
  const strongBullish = analysis.signals.signals.filter(
    s => s.strength === "STRONG BULLISH"
  );
  
  if (strongBullish.length > 5) {
    console.log("🚀 Strong bullish signals detected!");
  }
}, 60000);
```

### Custom Prompting

```typescript
import { VertexAI } from "@google-cloud/vertexai";

const vertexAI = new VertexAI({...});
const model = vertexAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const response = await model.generateContent({
  contents: [{
    role: "user",
    parts: [{
      text: `Analyze these indicators: RSI=${indicators.RSI}, ADX=${indicators.ADX}...`
    }]
  }]
});
```

---

## Performance Tips

1. **Cache aggressively** - Increase TTLs for stable analysis
2. **Batch requests** - Process multiple symbols at once
3. **Use filtering** - Only analyze high-conviction signals
4. **Limit indicators** - Calculate only needed indicators
5. **Optimize prompts** - Shorter prompts = faster AI responses

---

## Troubleshooting

### Signals not appearing

1. Check OHLCV data is valid (min 3 candles)
2. Verify indicators calculated correctly
3. Check signal detection conditions
4. Review Firestore logs for errors

### AI scoring issues

1. Check `GOOGLE_APPLICATION_CREDENTIALS` is set
2. Verify Vertex AI quota not exceeded
3. Review GCP logs for 403/429 errors
4. Check batch size (max 15 signals)

### Cache issues

1. Verify Firestore permissions
2. Check TTL values are reasonable
3. Review cache key collisions
4. Monitor Firestore storage growth

---

For more details, see [INSTALLATION.md](./INSTALLATION.md) and [README.md](../README.md).

**Last Updated**: December 2025

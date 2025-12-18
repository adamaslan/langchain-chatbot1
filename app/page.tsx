"use client";
import { useState } from "react";
import { sendMessage } from "./actions";

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [chat, setChat] = useState<{ role: string; text: string }[]>([]);

  const handleSend = async () => {
    if (!input) return;
    setChat((prev) => [...prev, { role: "user", text: input }]);
    
    const res = await sendMessage(input);
    if (res.success) {
      setChat((prev) => [...prev, { role: "ai", text: res.response as string }]);
    }
    setInput("");
  };

  return (
    <main className="p-8 max-w-2xl mx-auto flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {chat.map((m, i) => (
          <div key={i} className={`p-3 rounded-lg ${m.role === "user" ? "bg-blue-100 ml-auto" : "bg-gray-100"}`}>
            {m.text}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input 
          className="flex-1 border p-2 rounded text-black" 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="Ask something..."
        />
        <button onClick={handleSend} className="bg-black text-white px-4 py-2 rounded">Send</button>
      </div>
    </main>
  );
}




// "use client";

// import { useState } from "react";
// import Link from "next/link";

// interface Service {
//   name: string;
//   description: string;
//   endpoint: string;
//   features: string[];
//   icon: string;
// }

// const services: Service[] = [
//   {
//     name: "Data Service",
//     description: "Fetches and caches OHLCV data from Yahoo Finance with intelligent TTL management",
//     endpoint: "/api/cache",
//     features: [
//       "1-year historical data fetching",
//       "Firestore caching with TTL",
//       "Automatic cache invalidation",
//       "Multi-symbol support",
//     ],
//     icon: "📊",
//   },
//   {
//     name: "Indicators Service",
//     description: "Calculates 40+ technical indicators including moving averages, momentum, trend, and volatility metrics",
//     endpoint: "/lib/services/indicators.ts",
//     features: [
//       "10+ Moving Averages (SMA, EMA, HMA)",
//       "12+ Momentum indicators (RSI, Stochastic, MACD, ROC)",
//       "8+ Trend indicators (ADX, DI, TEMA, KST)",
//       "8+ Volatility indicators (Bollinger Bands, ATR, etc)",
//     ],
//     icon: "📈",
//   },
//   {
//     name: "Signals Service",
//     description: "Detects trading signals based on 40+ technical indicators with multiple confirmation strategies",
//     endpoint: "/lib/services/signals.ts",
//     features: [
//       "Moving Average crossovers",
//       "Momentum extremes detection",
//       "Trend alignment signals",
//       "Fibonacci level confluence",
//     ],
//     icon: "🎯",
//   },
//   {
//     name: "Ranking Service",
//     description: "Ranks signals by importance using correlation analysis and market context",
//     endpoint: "/lib/services/ranking.ts",
//     features: [
//       "Signal correlation analysis",
//       "Strength scoring",
//       "Category grouping",
//       "Market regime adjustment",
//     ],
//     icon: "🏆",
//   },
//   {
//     name: "Vertex AI Service",
//     description: "AI-powered signal scoring and contextual analysis using Google Vertex AI with caching",
//     endpoint: "/lib/services/vertex-ai.ts",
//     features: [
//       "Batch processing (up to 15 signals)",
//       "Confidence scoring",
//       "Market context analysis",
//       "Cached responses",
//     ],
//     icon: "🤖",
//   },
//   {
//     name: "Analysis Service",
//     description: "Orchestrates all services to provide complete technical analysis with AI insights",
//     endpoint: "/lib/services/analysis.ts",
//     features: [
//       "Full pipeline execution",
//       "Result aggregation",
//       "Persistence to Firestore",
//       "Error handling & recovery",
//     ],
//     icon: "🔍",
//   },
//   {
//     name: "Chat Service (LangChain)",
//     description: "Conversational AI interface for market analysis using LangChain and memory management",
//     endpoint: "/lib/services/langchain-chatbot.ts",
//     features: [
//       "Conversation memory",
//       "Market context awareness",
//       "Multi-turn interactions",
//       "Analysis summaries",
//     ],
//     icon: "💬",
//   },
// ];

// const apiEndpoints = [
//   {
//     method: "POST",
//     path: "/api/analyze",
//     description: "Analyze a stock symbol with all indicators and signals",
//     example: '{"symbol": "AAPL", "period": "1y"}',
//     icon: "📝",
//   },
//   {
//     method: "POST",
//     path: "/api/chat",
//     description: "Chat interface for conversational market analysis",
//     example: '{"message": "What is AAPL doing today?"}',
//     icon: "💭",
//   },
//   {
//     method: "GET",
//     path: "/api/signals",
//     description: "Get real-time trading signals for watched symbols",
//     example: "?symbols=AAPL,MSFT,GOOGL",
//     icon: "📡",
//   },
//   {
//     method: "POST",
//     path: "/api/cache",
//     description: "Manage cache operations and invalidation",
//     example: '{"action": "invalidate", "symbol": "AAPL"}',
//     icon: "💾",
//   },
// ];

// export default function Home() {
//   const [expandedService, setExpandedService] = useState<number | null>(null);

//   return (
//     <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
//       {/* Header */}
//       <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
//         <div className="max-w-6xl mx-auto px-6 py-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <h1 className="text-3xl font-bold bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
//                 Lang Chat Gem
//               </h1>
//               <p className="text-slate-400 text-sm mt-1">AI-Powered Technical Analysis Platform</p>
//             </div>
//             <Link
//               href="/dashboard"
//               className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
//             >
//               Go to Dashboard
//             </Link>
//           </div>
//         </div>
//       </header>

//       {/* Hero Section */}
//       <section className="max-w-6xl mx-auto px-6 py-16">
//         <div className="text-center mb-16">
//           <h2 className="text-5xl font-bold mb-4">
//             Complete Technical Analysis Platform
//           </h2>
//           <p className="text-xl text-slate-300 max-w-3xl mx-auto">
//             Integrated suite of AI-powered services for stock analysis, signal detection, and market insights.
//             Built with Next.js, Vertex AI, and Firestore.
//           </p>
//         </div>

//         {/* Architecture Overview */}
//         <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 mb-16">
//           <h3 className="text-2xl font-bold mb-6">System Architecture</h3>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//             <div className="flex flex-col items-center text-center">
//               <div className="text-4xl mb-3">📥</div>
//               <h4 className="font-semibold mb-2">Data Layer</h4>
//               <p className="text-slate-300 text-sm">
//                 Fetches OHLCV data from Yahoo Finance with intelligent Firestore caching
//               </p>
//             </div>
//             <div className="flex flex-col items-center text-center">
//               <div className="text-4xl mb-3">⚙️</div>
//               <h4 className="font-semibold mb-2">Analysis Layer</h4>
//               <p className="text-slate-300 text-sm">
//                 Calculates 40+ indicators, detects signals, and ranks by importance
//               </p>
//             </div>
//             <div className="flex flex-col items-center text-center">
//               <div className="text-4xl mb-3">🧠</div>
//               <h4 className="font-semibold mb-2">AI Layer</h4>
//               <p className="text-slate-300 text-sm">
//                 Vertex AI scoring with caching and conversational chat interface
//               </p>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Services Grid */}
//       <section className="max-w-6xl mx-auto px-6 pb-16">
//         <h2 className="text-3xl font-bold mb-8">Core Services</h2>
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {services.map((service, idx) => (
//             <div
//               key={idx}
//               className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition-all cursor-pointer"
//               onClick={() => setExpandedService(expandedService === idx ? null : idx)}
//             >
//               <div className="text-4xl mb-3">{service.icon}</div>
//               <h3 className="text-lg font-bold mb-2">{service.name}</h3>
//               <p className="text-slate-300 text-sm mb-4">{service.description}</p>

//               {expandedService === idx && (
//                 <div className="mt-4 pt-4 border-t border-slate-700">
//                   <h4 className="font-semibold mb-3 text-sm text-blue-400">Features:</h4>
//                   <ul className="space-y-2">
//                     {service.features.map((feature, i) => (
//                       <li key={i} className="text-sm text-slate-300 flex items-start">
//                         <span className="mr-2 text-green-400">✓</span>
//                         {feature}
//                       </li>
//                     ))}
//                   </ul>
//                 </div>
//               )}
//             </div>
//           ))}
//         </div>
//       </section>

//       {/* API Endpoints */}
//       <section className="max-w-6xl mx-auto px-6 pb-16">
//         <h2 className="text-3xl font-bold mb-8">API Endpoints</h2>
//         <div className="space-y-4">
//           {apiEndpoints.map((endpoint, idx) => (
//             <div
//               key={idx}
//               className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition-all"
//             >
//               <div className="flex items-start justify-between mb-3">
//                 <div>
//                   <div className="flex items-center gap-3">
//                     <span className="text-2xl">{endpoint.icon}</span>
//                     <div>
//                       <div className="flex items-center gap-2">
//                         <span
//                           className={`px-2 py-1 rounded text-xs font-semibold ${
//                             endpoint.method === "POST"
//                               ? "bg-orange-500/20 text-orange-300"
//                               : "bg-blue-500/20 text-blue-300"
//                           }`}
//                         >
//                           {endpoint.method}
//                         </span>
//                         <code className="font-mono text-sm text-cyan-400">{endpoint.path}</code>
//                       </div>
//                       <p className="text-slate-300 text-sm mt-1">{endpoint.description}</p>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//               <div className="bg-slate-900 rounded p-3 font-mono text-sm text-slate-300">
//                 {endpoint.example}
//               </div>
//             </div>
//           ))}
//         </div>
//       </section>

//       {/* Configuration */}
//       <section className="max-w-6xl mx-auto px-6 pb-16">
//         <h2 className="text-3xl font-bold mb-8">Configuration</h2>
//         <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8">
//           <h3 className="text-lg font-semibold mb-4">GCP Configuration</h3>
//           <div className="bg-slate-900 rounded p-4 font-mono text-sm text-slate-300 mb-6 overflow-x-auto">
//             <pre>{`{
//   projectId: process.env.GCP_PROJECT_ID,
//   firestore: { database: "(default)", region: "us-east4" },
//   vertexAI: { location: "us-east4", modelId: "gemini-2.5-flash" },
//   ttl: {
//     ohlcv: 86400,      // 1 day
//     indicators: 7200,  // 2 hours
//     signals: 3600,     // 1 hour
//     analysis: 604800,  // 7 days
//     vertexCache: 172800 // 2 days
//   }
// }`}</pre>
//           </div>

//           <h3 className="text-lg font-semibold mb-4">Environment Variables</h3>
//           <div className="space-y-2 text-sm">
//             <div className="flex justify-between items-center bg-slate-900 p-3 rounded">
//               <code className="text-cyan-400">GCP_PROJECT_ID</code>
//               <span className="text-slate-400">Your Google Cloud project ID</span>
//             </div>
//             <div className="flex justify-between items-center bg-slate-900 p-3 rounded">
//               <code className="text-cyan-400">VERTEX_AI_MODEL_ID</code>
//               <span className="text-slate-400">Model ID (e.g., gemini-2.5-flash)</span>
//             </div>
//             <div className="flex justify-between items-center bg-slate-900 p-3 rounded">
//               <code className="text-cyan-400">GOOGLE_APPLICATION_CREDENTIALS</code>
//               <span className="text-slate-400">Path to GCP service account JSON</span>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Tech Stack */}
//       <section className="max-w-6xl mx-auto px-6 pb-16">
//         <h2 className="text-3xl font-bold mb-8">Technology Stack</h2>
//         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//           {[
//             { name: "Next.js 15", desc: "React framework" },
//             { name: "TypeScript", desc: "Type safety" },
//             { name: "Firestore", desc: "Database & cache" },
//             { name: "Vertex AI", desc: "AI analysis" },
//             { name: "LangChain", desc: "AI orchestration" },
//             { name: "Tailwind CSS", desc: "Styling" },
//             { name: "Yahoo Finance API", desc: "Market data" },
//             { name: "GCP Services", desc: "Cloud platform" },
//           ].map((tech, idx) => (
//             <div
//               key={idx}
//               className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center hover:border-slate-600 transition-all"
//             >
//               <div className="font-semibold text-blue-400">{tech.name}</div>
//               <div className="text-xs text-slate-400 mt-1">{tech.desc}</div>
//             </div>
//           ))}
//         </div>
//       </section>

//       {/* Footer */}
//       <footer className="border-t border-slate-700 bg-slate-900/50 mt-16">
//         <div className="max-w-6xl mx-auto px-6 py-8 text-center text-slate-400">
//           <p>Build with precision. Analyze with confidence.</p>
//           <p className="text-xs mt-2">© 2025 Lang Chat Gem - AI-Powered Technical Analysis</p>
//         </div>
//       </footer>
//     </div>
//   );
// }

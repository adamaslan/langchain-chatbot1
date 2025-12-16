"use client";

import { useState, useRef, useEffect } from "react";

interface AnalysisResult {
  symbol: string;
  price: number;
  change: number;
  indicators: Record<string, number>;
  signals: Array<{
    signal: string;
    desc: string;
    strength: string;
    score?: number;
  }>;
  timestamp: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function DashboardWithChat() {
  const [symbol, setSymbol] = useState("AAPL");
  const [period, setPeriod] = useState("1y");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"analysis" | "chat">("analysis");

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const periods = ["1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "10y"];

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ symbol: symbol.toUpperCase(), period }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAnalyze();
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      role: "user",
      content: chatInput,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setChatLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "dashboard-user",
          message: chatInput,
          context: result
            ? {
                symbol: result.symbol,
                price: result.price,
                indicators: result.indicators,
                topSignals: result.signals.slice(0, 5).map((s) => s.signal),
              }
            : undefined,
        }),
      });

      if (!response.ok) throw new Error("Failed to get chat response");

      const data = await response.json();
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorContent =
        err instanceof Error ? err.message : "Failed to send message";
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${errorContent}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleChatKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !chatLoading) {
      e.preventDefault();
      handleSendChat();
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Lang Chat Gem Dashboard (With Chat)
              </h1>
              <p className="text-slate-400 text-sm mt-1">Test API & Chat with AI</p>
            </div>
            <a
              href="/"
              className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b border-slate-700 pb-4">
          <button
            onClick={() => setActiveTab("analysis")}
            className={`px-6 py-2 font-semibold transition-colors ${
              activeTab === "analysis"
                ? "text-blue-400 border-b-2 border-blue-400"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            📊 Stock Analysis
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`px-6 py-2 font-semibold transition-colors ${
              activeTab === "chat"
                ? "text-blue-400 border-b-2 border-blue-400"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            💬 AI Chat Assistant
          </button>
        </div>

        {/* Analysis Tab */}
        {activeTab === "analysis" && (
          <>
            <h2 className="text-2xl font-bold mb-6">Stock Analysis Tester</h2>

            <div className="space-y-4">
              {/* Symbol Input */}
              <div>
                <label className="block text-sm font-semibold mb-2">Stock Symbol</label>
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  onKeyPress={handleKeyPress}
                  placeholder="e.g., AAPL, MSFT, GOOGL"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-400 mt-1">Enter a valid stock ticker symbol</p>
              </div>

              {/* Period Selection */}
              <div>
                <label className="block text-sm font-semibold mb-2">Data Period</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {periods.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        period === p
                          ? "bg-blue-600 text-white"
                          : "bg-slate-700 hover:bg-slate-600 text-slate-300"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg space-y-2">
                  <p className="text-red-400 text-sm">
                    <span className="font-semibold">Error:</span> {error}
                  </p>
                  <p className="text-red-300 text-xs">
                    💡 Tips:
                    <ul className="list-disc list-inside mt-1">
                      <li>Verify the ticker symbol is correct (e.g., AAPL, MSFT)</li>
                      <li>Try a different stock or ETF symbol</li>
                      <li>Check that the symbol has trading data on Yahoo Finance</li>
                    </ul>
                  </p>
                </div>
              )}

              {/* Analyze Button */}
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors mt-6"
              >
                {loading ? "Analyzing..." : "Analyze Stock"}
              </button>
            </div>

            {/* Results */}
            {result && (
              <div className="space-y-6 mt-12">
                {/* Price Card */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-slate-400 text-sm">Stock Price</p>
                      <h3 className="text-4xl font-bold">${result.price.toFixed(2)}</h3>
                    </div>
                    <div
                      className={`text-right ${result.change >= 0 ? "text-green-400" : "text-red-400"}`}
                    >
                      <p className="text-sm">Change</p>
                      <p className="text-3xl font-bold">
                        {result.change >= 0 ? "+" : ""}
                        {result.change.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                  <p className="text-slate-400 text-xs">
                    Last updated: {new Date(result.timestamp).toLocaleString()}
                  </p>
                </div>

                {/* Key Indicators */}
                <div>
                  <h3 className="text-xl font-bold mb-4">Key Indicators</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "RSI", key: "RSI", format: (v: number) => v.toFixed(1) },
                      { label: "MACD", key: "MACD", format: (v: number) => v.toFixed(4) },
                      { label: "ADX", key: "ADX", format: (v: number) => v.toFixed(1) },
                      { label: "ATR", key: "ATR", format: (v: number) => `$${v.toFixed(2)}` },
                      { label: "SMA 20", key: "SMA_20", format: (v: number) => `$${v.toFixed(2)}` },
                      { label: "SMA 50", key: "SMA_50", format: (v: number) => `$${v.toFixed(2)}` },
                      { label: "SMA 200", key: "SMA_200", format: (v: number) => `$${v.toFixed(2)}` },
                      { label: "BB Upper", key: "BB_Upper", format: (v: number) => `$${v.toFixed(2)}` },
                    ].map((ind) => (
                      <div
                        key={ind.key}
                        className="bg-slate-800/50 border border-slate-700 rounded-lg p-4"
                      >
                        <p className="text-slate-400 text-xs">{ind.label}</p>
                        <p className="text-xl font-bold">
                          {result.indicators[ind.key] !== undefined
                            ? ind.format(result.indicators[ind.key])
                            : "N/A"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Signals */}
                <div>
                  <h3 className="text-xl font-bold mb-4">
                    Trading Signals ({result.signals.length})
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {result.signals.length > 0 ? (
                      result.signals.slice(0, 20).map((signal, idx) => (
                        <div
                          key={idx}
                          className={`p-4 rounded-lg border-l-4 ${
                            signal.strength.includes("BULLISH")
                              ? "bg-green-500/10 border-green-500 text-green-300"
                              : signal.strength.includes("BEARISH")
                                ? "bg-red-500/10 border-red-500 text-red-300"
                                : "bg-blue-500/10 border-blue-500 text-blue-300"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold">{signal.signal}</h4>
                            <span className="text-xs px-2 py-1 bg-slate-700 rounded">
                              {signal.strength}
                            </span>
                          </div>
                          <p className="text-xs opacity-90">{signal.desc}</p>
                          {signal.score && (
                            <p className="text-xs mt-2">Score: {signal.score.toFixed(0)}/100</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-400">No signals detected</p>
                    )}
                  </div>
                </div>

                {/* Raw JSON */}
                <div>
                  <details className="cursor-pointer">
                    <summary className="text-sm font-semibold text-slate-300 hover:text-white">
                      📋 View Raw JSON Response
                    </summary>
                    <div className="mt-4 bg-slate-900 border border-slate-700 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-xs text-slate-300 whitespace-pre-wrap break-words">
                        {JSON.stringify(result, null, 2)}
                      </pre>
                    </div>
                  </details>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!result && !loading && (
              <div className="text-center py-12">
                <p className="text-slate-400 mb-4">Enter a stock symbol and period above to get started</p>
                <div className="bg-slate-800/30 border border-dashed border-slate-700 rounded-lg p-8">
                  <p className="text-slate-500 text-sm">
                    Example: AAPL for 1 year of data will analyze Apple stock with 40+ indicators
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Chat Tab */}
        {activeTab === "chat" && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 flex flex-col h-[600px]">
            <h2 className="text-2xl font-bold mb-4">AI Trading Assistant</h2>
            <p className="text-slate-400 text-sm mb-6">
              Chat with AI about market analysis, trading strategies, and technical indicators.
              {result && ` (Currently analyzing ${result.symbol})`}
            </p>

            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-4 bg-slate-900/50 rounded-lg p-4">
              {chatMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-400">
                  <p>Start a conversation with the AI assistant</p>
                </div>
              ) : (
                <>
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-sm rounded-lg p-3 ${
                          msg.role === "user"
                            ? "bg-blue-600 text-white"
                            : "bg-slate-700 text-slate-100"
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {msg.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </>
              )}
            </div>

            {/* Chat Input Area */}
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={handleChatKeyPress}
                placeholder="Ask about the market, indicators, or trading strategies..."
                disabled={chatLoading}
                className="flex-1 px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleSendChat}
                disabled={chatLoading || !chatInput.trim()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
              >
                {chatLoading ? "..." : "Send"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

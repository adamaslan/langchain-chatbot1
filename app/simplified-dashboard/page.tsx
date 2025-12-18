"use client";

import { useState, useRef, useEffect } from "react";
import ChatWidget from "@/app/components/ChatWidget";

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

export default function SimplifiedDashboard() {
  const [symbol, setSymbol] = useState("AAPL");
  const [period, setPeriod] = useState("1y");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const periods = ["1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "10y"];
  const userId = "simplified-user-01"; // Static user ID for this example

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

  // Custom ChatWidget that points to the new simplified-chat API
  const SimplifiedChatWidget = () => {
    const [messages, setMessages] = useState<any[]>([
      {
        role: "assistant",
        content: "Hi! I'm the new simplified assistant. Ask me anything!",
        timestamp: new Date().toISOString(),
      },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(true); // Default to open
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    async function handleSendMessage() {
      if (!input.trim() || isLoading) return;

      const userMessage = {
        role: "user",
        content: input.trim(),
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);

      try {
        const res = await fetch("/api/simplified-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            message: userMessage.content,
            context: result
              ? {
                  symbol: result.symbol,
                  price: result.price,
                  topSignals: result.signals.slice(0, 3).map((s) => s.signal),
                }
              : undefined,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: data.response,
              timestamp: data.timestamp,
            },
          ]);
        } else {
          throw new Error("Failed to get response from the new API.");
        }
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Error with simplified chat. Please try again.",
            timestamp: new Date().toISOString(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    }

    return (
      <div className="fixed bottom-4 right-4 w-96 max-w-full z-50">
        {isOpen && (
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col h-96">
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 rounded-t-lg flex justify-between items-center">
              <h2 className="font-bold">Simplified Assistant</h2>
              <button onClick={() => setIsOpen(false)} className="text-white hover:opacity-75">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-xs px-4 py-2 rounded-lg ${msg.role === "user" ? "bg-green-600 text-white" : "bg-gray-200 text-black"}`}>
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && <div className="text-sm text-gray-500">...</div>}
              <div ref={messagesEndRef} />
            </div>
            <div className="border-t border-gray-200 p-3 bg-white rounded-b-lg">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Ask the new assistant..."
                  className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                  disabled={isLoading}
                />
                <button onClick={handleSendMessage} disabled={isLoading || !input.trim()} className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-2 rounded font-semibold text-sm">
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
        {!isOpen && (
          <button onClick={() => setIsOpen(true)} className="w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg flex items-center justify-center font-bold text-xl">
            💡
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="border-b border-gray-700 bg-gray-900/50">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-green-400">
            Simplified Dashboard
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Dashboard with the new, simplified LangChain Chatbot
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Stock Symbol</label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              placeholder="e.g., AAPL, MSFT"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg"
            />
          </div>
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg font-semibold"
          >
            {loading ? "Analyzing..." : "Analyze Stock"}
          </button>
        </div>

        {error && <p className="text-red-400 mt-4">Error: {error}</p>}

        {result && (
          <div className="mt-12 space-y-6">
            <h2 className="text-2xl font-bold">Analysis for {result.symbol}</h2>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <h3 className="text-4xl font-bold">
                ${typeof result.price === 'number' ? result.price.toFixed(2) : 'N/A'}
              </h3>
              <p className={`${(result.change ?? 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                {typeof result.change === 'number' ? result.change.toFixed(2) : 'N/A'}%
              </p>
            </div>
          </div>
        )}
      </main>

      <SimplifiedChatWidget />
    </div>
  );
}

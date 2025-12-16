"use client";

import { useState, useRef, useEffect } from "react";
import type { Indicator } from "@/lib/types";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface ChatWidgetProps {
  userId: string;
  symbol?: string;
  price?: number;
  indicators?: Indicator;
  topSignals?: string[];
}

export default function ChatWidget({
  userId,
  symbol,
  price,
  indicators,
  topSignals,
}: ChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! Ask me about signals, indicators, or trading strategy.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    // Load chat history on mount
    loadHistory();
  }, [userId]);

  async function loadHistory() {
    try {
      const res = await fetch(`/api/chat?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.history?.length) {
          setMessages(
            data.history.map((m: Record<string, unknown>) => ({
              role: m.role,
              content: m.content,
              timestamp: new Date(m.timestamp as string).toISOString(),
            }))
          );
        }
      }
    } catch (error) {
      console.error("Load history error:", error);
    }
  }

  async function handleSendMessage() {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userMessage,
        timestamp: new Date().toISOString(),
      },
    ]);

    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          message: userMessage,
          context: {
            symbol,
            price,
            indicators,
            topSignals,
          },
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
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Error processing request. Try again.",
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Connection error. Try again.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleClearHistory() {
    try {
      await fetch(`/api/chat?userId=${userId}`, { method: "DELETE" });
      setMessages([
        {
          role: "assistant",
          content: "Chat history cleared. Ask me anything!",
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error("Clear error:", error);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-w-full z-50">
      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col h-96">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg flex justify-between items-center">
            <h2 className="font-bold">Trading Assistant</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:opacity-75"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-900"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 text-gray-900 rounded-lg px-4 py-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-3 bg-white rounded-b-lg space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Ask about signals..."
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                disabled={loading}
              />
              <button
                onClick={handleSendMessage}
                disabled={loading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-3 py-2 rounded font-semibold transition text-sm"
              >
                Send
              </button>
            </div>
            <button
              onClick={handleClearHistory}
              className="w-full text-xs text-gray-500 hover:text-gray-700 py-1"
            >
              Clear history
            </button>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center font-bold text-xl transition hover:scale-110"
        >
          💬
        </button>
      )}
    </div>
  );
}

import { NextRequest, NextResponse } from "next/server";
import { TradingChatbot } from "@/lib/services/langchain-chatbot";
import { GCP_CONFIG } from "@/config/gcp";
import type { Indicator } from "@/lib/types";

interface ChatRequest {
  userId: string;
  message: string;
  context?: {
    symbol?: string;
    price?: number;
    indicators?: Indicator;
    topSignals?: string[];
  };
}

const chatInstances = new Map<string, TradingChatbot>();
let cleanupInterval: NodeJS.Timeout | null = null;

function getChatbot(userId: string): TradingChatbot {
  if (!chatInstances.has(userId)) {
    chatInstances.set(userId, new TradingChatbot(userId));
  }
  return chatInstances.get(userId)!;
}

// Initialize cleanup only once (prevent multiple intervals in dev)
function initializeCleanup(): void {
  if (cleanupInterval) return;

  cleanupInterval = setInterval(() => {
    if (chatInstances.size > 100) {
      const entries = Array.from(chatInstances.entries());
      const toDelete = entries.slice(0, 50);
      toDelete.forEach(([userId]) => {
        chatInstances.delete(userId);
      });
      console.log(`Cleaned up ${toDelete.length} chatbot instances`);
    }
  }, 300000); // Every 5 minutes

  // Prevent interval from keeping process alive
  cleanupInterval.unref?.();
}

// Call once on module load
initializeCleanup();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ChatRequest;

    // Validate required fields
    if (!body.userId?.trim() || !body.message?.trim()) {
      return NextResponse.json(
        { error: "Missing or empty userId or message" },
        { status: 400 }
      );
    }

    if (!GCP_CONFIG.projectId) {
      return NextResponse.json(
        { error: "GCP not configured" },
        { status: 500 }
      );
    }

    const chatbot = getChatbot(body.userId);
    const response = await chatbot.chat(body.message, body.context);

    return NextResponse.json({
      response,
      timestamp: new Date().toISOString(),
      userId: body.userId,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Chat failed" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId?.trim()) {
      return NextResponse.json(
        { error: "Missing or empty userId" },
        { status: 400 }
      );
    }

    const chatbot = getChatbot(userId);
    const history = await chatbot.getConversation();

    return NextResponse.json({
      history,
      userId,
      count: history.length,
    });
  } catch (error) {
    console.error("Get history error:", error);
    return NextResponse.json(
      { error: "Failed to get history" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId?.trim()) {
      return NextResponse.json(
        { error: "Missing or empty userId" },
        { status: 400 }
      );
    }

    const chatbot = getChatbot(userId);
    await chatbot.clearHistory();
    chatInstances.delete(userId);

    return NextResponse.json({ success: true, userId });
  } catch (error) {
    console.error("Clear history error:", error);
    return NextResponse.json(
      { error: "Failed to clear history" },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";
import {
  VertexAI,
  HarmCategory,
  HarmBlockThreshold,
  Content,
  FunctionDeclaration,
  SchemaType,
} from "@google-cloud/vertexai";
import { GCP_CONFIG } from "@/config/gcp";

// Define the tool in the native Vertex AI format
const getStockPriceTool: FunctionDeclaration = {
  name: "get_stock_price",
  description: "Returns the current price of a given stock symbol.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      symbol: {
        type: SchemaType.STRING,
        description: "The stock ticker symbol, e.g., AAPL, GOOGL",
      },
    },
    required: ["symbol"],
  },
};

const tools = [{ functionDeclarations: [getStockPriceTool] }];

// --- Tool Execution Logic ---
async function executeTool(toolName: string, args: any): Promise<any> {
  if (toolName === "get_stock_price") {
    const symbol = args.symbol;
    console.log(`Executing tool 'get_stock_price' for symbol: ${symbol}`);
    // In a real app, you'd fetch this from an API
    if (symbol.toUpperCase() === "AAPL") return { price: 150.0 };
    if (symbol.toUpperCase() === "GOOGL") return { price: 2800.0 };
    return { price: "not found" };
  }
  // Add more tools here if needed
  return null;
}

// --- Vertex AI Initialization ---
const vertex_ai = new VertexAI({
  project: GCP_CONFIG.projectId,
  location: GCP_CONFIG.vertexAI.location,
});

const model = "gemini-1.0-pro";

const generationConfig = {
  temperature: 0.7,
  topK: 40,
  topP: 0.8,
  maxOutputTokens: 1024,
};

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  // ... other safety settings
];

const generativeModel = vertex_ai.getGenerativeModel({
  model: model,
  generationConfig,
  safetySettings,
});

// Store chat histories in memory (using Vertex AI's Content format)
const chatHistories = new Map<string, Content[]>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, message, context } = body;

    if (!userId?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: "Missing or empty userId or message" },
        { status: 400 }
      );
    }

    // Get or create chat history
    const history = chatHistories.get(userId) ?? [];

    // Start a chat session with the history
    const chat = generativeModel.startChat({ history, tools });

    // Construct the full message with context
    let contextString = "";
    if (context) {
      contextString = `(Context from dashboard: Symbol=${context.symbol || "N/A"}, Price=${context.price || "N/A"})`;
    }
    const fullMessage = `${message} ${contextString}`;

    // Send the message to the model
    const result = await chat.sendMessage(fullMessage);
    const response = result.response;

    let finalResponseText = "";

    if (
      response.candidates &&
      response.candidates[0].content.parts[0].functionCall
    ) {
      const functionCall = response.candidates[0].content.parts[0].functionCall;
      console.log("Model wants to call tool:", functionCall);

      const toolResult = await executeTool(functionCall.name, functionCall.args);

      // Send the tool's result back to the model
      const result2 = await chat.sendMessage([
        {
          functionResponse: {
            name: functionCall.name,
            response: toolResult,
          },
        },
      ]);

      // Get the final text response after the tool call
      finalResponseText =
        result2.response.candidates?.[0].content.parts[0].text ??
        "I was unable to process the tool's response.";
    } else {
      // No tool was called, just a regular text response
      finalResponseText =
        response.candidates?.[0].content.parts[0].text ??
        "I'm sorry, I couldn't generate a response.";
    }

    // Update history
    history.push({ role: "user", parts: [{ text: fullMessage }] });
    history.push({ role: "model", parts: [{ text: finalResponseText }] });
    chatHistories.set(userId, history);

    return NextResponse.json({
      response: finalResponseText,
      timestamp: new Date().toISOString(),
      userId: userId,
    });
  } catch (error) {
    console.error("Simplified Chat API error (Vertex AI Direct):", error);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}

// GET and DELETE handlers remain the same, but adapted for the new history format
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId?.trim()) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }
  const history = (chatHistories.get(userId) ?? []).map((msg) => ({
    role: msg.role,
    content: msg.parts[0].text,
    timestamp: new Date().toISOString(),
  }));
  return NextResponse.json({ history, userId, count: history.length });
}

export async function DELETE(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId?.trim()) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }
  chatHistories.delete(userId);
  return NextResponse.json({ success: true, userId });
}
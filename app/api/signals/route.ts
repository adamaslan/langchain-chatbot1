import { NextRequest, NextResponse } from "next/server";
import { analyzeSymbol } from "@/lib/services/analysis";
import { GCP_CONFIG } from "@/config/gcp";

export async function POST(request: NextRequest) {
  try {
    const { symbol, limit = 5 } = await request.json();

    if (!symbol || typeof symbol !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid symbol" },
        { status: 400 }
      );
    }

    if (limit > GCP_CONFIG.limits.maxSignalsPerRequest) {
      return NextResponse.json(
        { error: `Max ${GCP_CONFIG.limits.maxSignalsPerRequest} signals allowed` },
        { status: 400 }
      );
    }

    const analysis = await analyzeSymbol(symbol);
    const topSignals = analysis.signals.slice(0, limit);

    return NextResponse.json({
      symbol,
      price: analysis.price,
      change: analysis.change,
      signals: topSignals,
      signalCount: analysis.signals.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Signal extraction error:", error);
    return NextResponse.json(
      { error: "Failed to get signals" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const symbol = request.nextUrl.searchParams.get("symbol");
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "5");

    if (!symbol) {
      return NextResponse.json(
        { error: "Missing symbol parameter" },
        { status: 400 }
      );
    }

    if (limit > GCP_CONFIG.limits.maxSignalsPerRequest) {
      return NextResponse.json(
        { error: `Max ${GCP_CONFIG.limits.maxSignalsPerRequest} signals allowed` },
        { status: 400 }
      );
    }

    const analysis = await analyzeSymbol(symbol);
    const topSignals = analysis.signals.slice(0, limit);

    return NextResponse.json({
      symbol,
      price: analysis.price,
      change: analysis.change,
      signals: topSignals,
      signalCount: analysis.signals.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Get signals error:", error);
    return NextResponse.json(
      { error: "Failed to get signals" },
      { status: 500 }
    );
  }
}

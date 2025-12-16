import { NextRequest, NextResponse } from "next/server";
import { analyzeSymbol, analyzeMultipleSymbols } from "@/lib/services/analysis";
import { GCP_CONFIG } from "@/config/gcp";

export async function POST(request: NextRequest) {
  try {
    const { symbol, symbols } = await request.json();

    if (symbols && Array.isArray(symbols)) {
      if (symbols.length > GCP_CONFIG.limits.maxSymbols) {
        return NextResponse.json(
          { error: `Max ${GCP_CONFIG.limits.maxSymbols} symbols allowed` },
          { status: 400 }
        );
      }

      const results = await analyzeMultipleSymbols(symbols);
      return NextResponse.json({
        results,
        count: results.length,
        timestamp: new Date().toISOString(),
      });
    }

    if (!symbol || typeof symbol !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid symbol" },
        { status: 400 }
      );
    }

    const analysis = await analyzeSymbol(symbol);

    return NextResponse.json({
      analysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Analysis failed" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const symbol = request.nextUrl.searchParams.get("symbol");

    if (!symbol) {
      return NextResponse.json(
        { error: "Missing symbol parameter" },
        { status: 400 }
      );
    }

    const analysis = await analyzeSymbol(symbol);

    return NextResponse.json({
      analysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Get analysis error:", error);
    return NextResponse.json(
      { error: "Failed to get analysis" },
      { status: 500 }
    );
  }
}

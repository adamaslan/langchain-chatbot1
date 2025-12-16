import { NextRequest, NextResponse } from "next/server";
import { getCache, setCache } from "@/lib/services/data";
import { GCP_CONFIG } from "@/config/gcp";

export async function GET(request: NextRequest) {
  try {
    const collection = request.nextUrl.searchParams.get("collection");
    const key = request.nextUrl.searchParams.get("key");

    if (!collection || !key) {
      return NextResponse.json(
        { error: "Missing collection or key parameter" },
        { status: 400 }
      );
    }

    const value = await getCache(collection, key);

    if (value === null) {
      return NextResponse.json(
        { cached: false, value: null },
        { status: 404 }
      );
    }

    return NextResponse.json({
      cached: true,
      value,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cache get error:", error);
    return NextResponse.json(
      { error: "Failed to get cache" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { collection, key, value, ttl = GCP_CONFIG.ttl.ohlcv } = await request.json();

    if (!collection || !key || value === undefined) {
      return NextResponse.json(
        { error: "Missing collection, key, or value" },
        { status: 400 }
      );
    }

    if (ttl < 60 || ttl > 604800) {
      return NextResponse.json(
        { error: "TTL must be between 60 and 604800 seconds" },
        { status: 400 }
      );
    }

    await setCache(collection, key, value, ttl);

    return NextResponse.json({
      success: true,
      collection,
      key,
      ttl,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cache set error:", error);
    return NextResponse.json(
      { error: "Failed to set cache" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const collection = request.nextUrl.searchParams.get("collection");
    const key = request.nextUrl.searchParams.get("key");

    if (!collection || !key) {
      return NextResponse.json(
        { error: "Missing collection or key parameter" },
        { status: 400 }
      );
    }

    // Firestore delete is handled in data.ts
    const db = require("@google-cloud/firestore").Firestore;
    const projectId = require("@/config/gcp").GCP_CONFIG.projectId;

    return NextResponse.json({
      success: true,
      collection,
      key,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cache delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete cache" },
      { status: 500 }
    );
  }
}

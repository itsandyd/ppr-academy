import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { checkRateLimit, getRateLimitIdentifier, rateLimiters } from "@/lib/rate-limit";

const MAX_PAYLOAD_SIZE = 10 * 1024; // 10KB
const MAX_EVENT_TYPE_LENGTH = 100;

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // SECURITY: Rate limiting (generous - 100 requests/min)
    const identifier = getRateLimitIdentifier(request, userId);
    const rateCheck = await checkRateLimit(identifier, rateLimiters.generous);
    if (rateCheck instanceof NextResponse) {
      return rateCheck;
    }

    // Validate payload size
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_SIZE) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    const rawBody = await request.text();
    if (rawBody.length > MAX_PAYLOAD_SIZE) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Validate event type if present
    if ("event" in body) {
      if (typeof body.event !== "string" || body.event.length === 0 || body.event.length > MAX_EVENT_TYPE_LENGTH) {
        return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
      }
    }

    if ("type" in body) {
      if (typeof body.type !== "string" || body.type.length === 0 || body.type.length > MAX_EVENT_TYPE_LENGTH) {
        return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
      }
    }

    // Get IP from headers (x-forwarded-for is set by most proxies/load balancers)
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() || headersList.get("x-real-ip") || "unknown";

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Analytics tracking error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

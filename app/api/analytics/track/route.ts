import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Get IP from headers (x-forwarded-for is set by most proxies/load balancers)
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() || headersList.get("x-real-ip") || "unknown";

    // Here you would normally send this to your analytics service
    // For now, we'll just log it (in production, you'd use Convex or another service)
    console.log("Analytics event:", {
      userId,
      ...body,
      timestamp: Date.now(),
      ip,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Analytics tracking error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

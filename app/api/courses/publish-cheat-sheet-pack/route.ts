import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import {
  checkRateLimit,
  getRateLimitIdentifier,
  rateLimiters,
} from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const identifier = getRateLimitIdentifier(request);
    const rateCheck = await checkRateLimit(identifier, rateLimiters.standard);
    if (rateCheck instanceof NextResponse) {
      return rateCheck;
    }

    const body = await request.json();
    const {
      packId,
      pricing = "free",
      price = 0,
      followGateEnabled = false,
      title,
      description,
      thumbnailUrl,
      includeSheetIds,
    } = body;

    if (!packId) {
      return NextResponse.json(
        { error: "packId is required" },
        { status: 400 }
      );
    }

    const { fetchQuery, fetchMutation } = await import("convex/nextjs");
    const { api } = await import("@/convex/_generated/api");

    const userId = (user as any).id || (user as any).userId;

    // Get user's store
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const store = await fetchQuery(api.stores.getUserStore as any, { userId });

    if (!store) {
      return NextResponse.json(
        { error: "You need a store to publish products" },
        { status: 400 }
      );
    }

    // Determine price
    const finalPrice =
      pricing === "paid" ? Math.max(0, price) : 0;

    // Publish the pack as a digital product
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const productId = await fetchMutation(
      api.cheatSheetPacks.publishPackAsProduct as any,
      {
        packId,
        storeId: (store as any)._id,
        userId,
        title,
        description,
        price: finalPrice,
        followGateEnabled:
          pricing === "lead-magnet" ? true : followGateEnabled,
        thumbnailUrl,
        includeSheetIds,
      }
    );

    return NextResponse.json({
      success: true,
      productId,
      message: "Cheat sheet pack published successfully",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Please sign in" }, { status: 401 });
    }
    console.error("Publish cheat sheet pack error:", error);
    return NextResponse.json(
      {
        error: `Failed to publish: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 }
    );
  }
}

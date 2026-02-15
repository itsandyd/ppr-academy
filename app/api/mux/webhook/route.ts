import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Mux from "@mux/mux-node";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import crypto from "crypto";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Mux webhook event types we care about
type MuxWebhookEvent = {
  type: string;
  data: {
    id: string;
    upload_id?: string;
    playback_ids?: Array<{ id: string; policy: string }>;
    status?: string;
    duration?: number;
    aspect_ratio?: string;
    resolution_tier?: string;
    max_stored_resolution?: string;
    max_stored_frame_rate?: number;
  };
};

function verifyMuxSignature(body: string, signature: string, secret: string): boolean {
  try {
    // Mux signature format: "t=<timestamp>,v1=<hash>"
    const parts = signature.split(",");
    const timestampPart = parts.find((p) => p.startsWith("t="));
    const signaturePart = parts.find((p) => p.startsWith("v1="));

    if (!timestampPart || !signaturePart) return false;

    const timestamp = timestampPart.replace("t=", "");
    const expectedSignature = signaturePart.replace("v1=", "");

    const payload = `${timestamp}.${body}`;
    const hmac = crypto.createHmac("sha256", secret);
    const digest = hmac.update(payload).digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(digest),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const signature = headersList.get("mux-signature");
    const muxWebhookSecret = process.env.MUX_WEBHOOK_SECRET;

    // Reject in production if secret is not configured
    if (!muxWebhookSecret && process.env.NODE_ENV === "production") {
      console.error("MUX_WEBHOOK_SECRET not configured in production");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    const body = await request.text();

    // Verify signature when secret is available
    if (muxWebhookSecret) {
      if (!signature) {
        return NextResponse.json(
          { error: "Missing webhook signature" },
          { status: 401 }
        );
      }

      if (!verifyMuxSignature(body, signature, muxWebhookSecret)) {
        return NextResponse.json(
          { error: "Invalid webhook signature" },
          { status: 401 }
        );
      }
    }

    const event: MuxWebhookEvent = JSON.parse(body);

    switch (event.type) {
      case "video.asset.ready": {
        // Video is ready for playback
        const assetId = event.data.id;
        const playbackId = event.data.playback_ids?.[0]?.id;
        const duration = event.data.duration;

        if (playbackId) {
          // Update chapter in Convex with the playback ID
          await convex.mutation(api.courses.updateChapterMuxAsset, {
            muxAssetId: assetId,
            muxPlaybackId: playbackId,
            muxAssetStatus: "ready",
            videoDuration: duration,
          });


        }
        break;
      }

      case "video.asset.errored": {
        // Video processing failed
        const assetId = event.data.id;

        await convex.mutation(api.courses.updateChapterMuxAsset, {
          muxAssetId: assetId,
          muxAssetStatus: "errored",
        });

        console.error(`Asset ${assetId} processing failed`);
        break;
      }

      case "video.upload.asset_created": {
        // Upload completed, asset is being processed
        const uploadId = event.data.upload_id;
        const assetId = event.data.id;


        break;
      }

      default:

    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Mux webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

// Mux sends webhooks as POST requests only
export async function GET() {
  return NextResponse.json({ message: "Mux webhook endpoint" });
}

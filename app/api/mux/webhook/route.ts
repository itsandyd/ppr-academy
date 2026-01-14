import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Mux from "@mux/mux-node";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

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

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const signature = headersList.get("mux-signature");

    // In production, verify the webhook signature
    // For now, we'll process all webhooks
    if (process.env.NODE_ENV === "production" && !signature) {
      console.warn("Missing Mux webhook signature in production");
    }

    const body = await request.text();
    const event: MuxWebhookEvent = JSON.parse(body);

    console.log(`Mux webhook received: ${event.type}`, {
      assetId: event.data.id,
      uploadId: event.data.upload_id,
    });

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

          console.log(`Asset ${assetId} ready with playback ID ${playbackId}`);
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

        console.log(`Upload ${uploadId} created asset ${assetId}`);
        break;
      }

      default:
        console.log(`Unhandled Mux event type: ${event.type}`);
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

import Mux from "@mux/mux-node";

// Initialize Mux client
const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

export const { video: muxVideo } = mux;

// Create a direct upload URL for client-side uploads
export async function createDirectUpload() {
  const upload = await muxVideo.uploads.create({
    cors_origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    new_asset_settings: {
      playback_policy: ["public"],
      encoding_tier: "baseline", // Use "smart" for better quality at higher cost
    },
  });

  return {
    uploadId: upload.id,
    uploadUrl: upload.url,
  };
}

// Get asset details by asset ID
export async function getAsset(assetId: string) {
  const asset = await muxVideo.assets.retrieve(assetId);
  return asset;
}

// Get playback ID for an asset
export async function getPlaybackId(assetId: string): Promise<string | null> {
  const asset = await muxVideo.assets.retrieve(assetId);
  return asset.playback_ids?.[0]?.id || null;
}

// Delete an asset
export async function deleteAsset(assetId: string) {
  await muxVideo.assets.delete(assetId);
}

// Get upload status
export async function getUploadStatus(uploadId: string) {
  const upload = await muxVideo.uploads.retrieve(uploadId);
  return {
    status: upload.status,
    assetId: upload.asset_id,
  };
}

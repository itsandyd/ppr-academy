import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { Id } from "./_generated/dataModel";

const http = httpRouter();

/**
 * Health Check Endpoint
 * 
 * Use this endpoint to verify the Convex backend is running
 * GET /health
 * 
 * Response: { "status": "ok", "timestamp": 1234567890 }
 */
http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(
      JSON.stringify({ 
        status: "ok", 
        timestamp: Date.now(),
        service: "ppr-academy-convex"
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }),
});

/**
 * Public Media Proxy with File Extension
 * 
 * Serves media files from Convex storage for social media platforms
 * GET /social/media/{storageId}.{ext}
 * 
 * Instagram and other platforms prefer URLs with file extensions.
 */
http.route({
  pathPrefix: "/social/media/",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    try {
      // Extract storage ID and extension from path
      const url = new URL(req.url);
      const pathParts = url.pathname.split('/');
      const filenamePart = pathParts[pathParts.length - 1]; // e.g., "abc123.jpg"
      
      // Remove extension and get storage ID
      const storageId = filenamePart.split('.')[0];

      if (!storageId) {
        return new Response("Missing storage ID", { status: 400 });
      }

      // Validate storage ID format
      if (!storageId.match(/^[a-z0-9]+$/)) {
        return new Response("Invalid storage ID format", { status: 400 });
      }

      console.log('📥 Public media request for storage ID:', storageId);

      // Get file from Convex storage
      const blob = await ctx.storage.get(storageId as Id<"_storage">);

      if (!blob) {
        console.error('❌ File not found:', storageId);
        return new Response("File not found", { status: 404 });
      }

      // Detect content type from blob
      let contentType = "application/octet-stream";
      let fileExtension = "bin";
      
      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      
      // Check for JPEG
      if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
        contentType = "image/jpeg";
        fileExtension = "jpg";
      }
      // Check for PNG
      else if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
        contentType = "image/png";
        fileExtension = "png";
      }
      // Check for MP4
      else if (bytes.length >= 8 && bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
        contentType = "video/mp4";
        fileExtension = "mp4";
      }

      console.log('✅ Serving file with content type:', contentType);

      // Return file with Instagram-friendly headers
      return new Response(new Blob([arrayBuffer], { type: contentType }), {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `inline; filename="${storageId}.${fileExtension}"`,
          "Content-Length": String(arrayBuffer.byteLength),
          "Cache-Control": "public, max-age=31536000",
          "Access-Control-Allow-Origin": "*",
          "Accept-Ranges": "bytes",
        },
      });
    } catch (error: any) {
      console.error('❌ Error serving media:', error);
      return new Response(error.message || "Internal server error", { 
        status: 500 
      });
    }
  }),
});

/**
 * Stripe Webhook Handler
 * 
 * Handles webhook events from Stripe for subscription management
 * POST /stripe-webhook
 * 
 * This will be implemented in the next phase
 */
http.route({
  path: "/stripe-webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    // TODO: Implement Stripe webhook handling in Phase 2
    // For now, return a placeholder response
    return new Response(
      JSON.stringify({ 
        received: true,
        message: "Stripe webhook handler - coming in Phase 2" 
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }),
});

export default http;



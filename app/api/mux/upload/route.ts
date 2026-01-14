import { NextRequest, NextResponse } from "next/server";
import { createDirectUpload, getUploadStatus } from "@/lib/mux";
import { requireAuth } from "@/lib/auth-helpers";

// POST - Create a new direct upload URL
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth();

    const { uploadId, uploadUrl } = await createDirectUpload();

    return NextResponse.json({
      success: true,
      uploadId,
      uploadUrl,
    });
  } catch (error) {
    console.error("Failed to create Mux upload:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to create upload URL" },
      { status: 500 }
    );
  }
}

// GET - Check upload status
export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const uploadId = searchParams.get("uploadId");

    if (!uploadId) {
      return NextResponse.json(
        { error: "Missing uploadId parameter" },
        { status: 400 }
      );
    }

    const { status, assetId } = await getUploadStatus(uploadId);

    return NextResponse.json({
      success: true,
      status,
      assetId,
    });
  } catch (error) {
    console.error("Failed to get upload status:", error);
    return NextResponse.json(
      { error: "Failed to get upload status" },
      { status: 500 }
    );
  }
}

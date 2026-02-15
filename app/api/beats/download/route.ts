import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { Id } from "@/convex/_generated/dataModel";

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth();

    // Get beatLicenseId from query params
    const { searchParams } = new URL(request.url);
    const licenseId = searchParams.get("licenseId");
    const fileType = searchParams.get("fileType"); // mp3, wav, stems, trackouts

    if (!licenseId) {
      return NextResponse.json({ error: "License ID required" }, { status: 400 });
    }

    // Get the beat license
    const { fetchQuery } = await import("convex/nextjs");
    const { api } = await import("@/convex/_generated/api");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const license = await fetchQuery(api.beatLeases.getBeatLicenseByPurchase as any, {
      purchaseId: licenseId as Id<"purchases">,
    });

    if (!license) {
      return NextResponse.json({ error: "License not found" }, { status: 404 });
    }

    // Verify user owns this license
    if (license.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get the beat to access file URLs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const beat: any = await fetchQuery(api.digitalProducts.getProductById as any, {
      productId: license.beatId,
    });

    if (!beat) {
      return NextResponse.json({ error: "Beat not found" }, { status: 404 });
    }

    // If no specific file type requested, return all available files info
    if (!fileType) {
      const availableFiles = getAvailableFiles(license, beat);
      return NextResponse.json({
        success: true,
        beatTitle: license.beatTitle,
        tierType: license.tierType,
        tierName: license.tierName,
        deliveredFiles: license.deliveredFiles,
        files: availableFiles,
      });
    }

    // Verify the file type is included in the license
    if (!license.deliveredFiles.includes(fileType)) {
      return NextResponse.json(
        { error: `File type '${fileType}' not included in your ${license.tierName} license` },
        { status: 403 }
      );
    }

    // Get the download URL for the specific file type
    const downloadUrl = getDownloadUrl(fileType, beat);

    if (!downloadUrl) {
      return NextResponse.json(
        { error: `${fileType.toUpperCase()} file not available for this beat` },
        { status: 404 }
      );
    }

    // Return the download URL (or redirect to it)
    return NextResponse.json({
      success: true,
      fileType,
      downloadUrl,
      filename: `${license.beatTitle.replace(/[^a-zA-Z0-9]/g, "_")}_${fileType.toUpperCase()}`,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Please sign in" }, { status: 401 });
    }
    console.error("File download error:", error);
    return NextResponse.json(
      { error: "Failed to get download" },
      { status: 500 }
    );
  }
}

interface BeatLicense {
  deliveredFiles: string[];
  tierType: string;
  tierName: string;
  beatTitle: string;
}

interface Beat {
  downloadUrl?: string;
  audioUrl?: string;
  previewUrl?: string;
  packFiles?: string; // JSON stringified array
  // Additional file URLs that might exist
  wavUrl?: string;
  mp3Url?: string;
  stemsUrl?: string;
  trackoutsUrl?: string;
}

function getAvailableFiles(license: BeatLicense, beat: Beat) {
  const files: Array<{
    type: string;
    label: string;
    available: boolean;
    url?: string;
  }> = [];

  const fileTypes = [
    { type: "mp3", label: "MP3 (320kbps)" },
    { type: "wav", label: "WAV (24-bit)" },
    { type: "stems", label: "Stems" },
    { type: "trackouts", label: "Trackouts" },
  ];

  for (const ft of fileTypes) {
    const included = license.deliveredFiles.includes(ft.type);
    const url = getDownloadUrl(ft.type, beat);

    files.push({
      type: ft.type,
      label: ft.label,
      available: included && !!url,
      url: included && url ? url : undefined,
    });
  }

  return files;
}

function getDownloadUrl(fileType: string, beat: Beat): string | null {
  // Try to get specific URLs first, then fall back to general downloadUrl
  switch (fileType) {
    case "mp3":
      return beat.mp3Url || beat.previewUrl || beat.downloadUrl || null;
    case "wav":
      return beat.wavUrl || beat.downloadUrl || beat.audioUrl || null;
    case "stems":
      return beat.stemsUrl || null;
    case "trackouts":
      return beat.trackoutsUrl || null;
    default:
      return null;
  }
}

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { checkRateLimit, getRateLimitIdentifier, rateLimiters } from "@/lib/rate-limit";
import { generateCheatSheetPDF, type Outline } from "@/lib/pdf-generator";

export const maxDuration = 60; // PDF generation + upload

// =============================================================================
// API ROUTE
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    // SECURITY: Rate limiting (standard - 30 requests/min, CPU-intensive)
    const identifier = getRateLimitIdentifier(request);
    const rateCheck = await checkRateLimit(identifier, rateLimiters.standard);
    if (rateCheck instanceof NextResponse) {
      return rateCheck;
    }

    const { cheatSheetId } = await request.json();

    if (!cheatSheetId) {
      return NextResponse.json({ error: "cheatSheetId is required" }, { status: 400 });
    }

    // Fetch the cheat sheet from Convex
    const { fetchQuery, fetchMutation } = await import("convex/nextjs");
    const { api } = await import("@/convex/_generated/api");

    const cheatSheet = await fetchQuery(api.cheatSheetMutations.getCheatSheet as any, {
      cheatSheetId,
    });

    if (!cheatSheet) {
      return NextResponse.json({ error: "Cheat sheet not found" }, { status: 404 });
    }

    // Generate the PDF
    const pdfBytes = await generateCheatSheetPDF(cheatSheet.outline as Outline);

    // Upload to Convex storage
    const uploadUrl = await fetchMutation(api.files.generateUploadUrl as any, {});

    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": "application/pdf" },
      body: pdfBytes,
    });

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload PDF to storage");
    }

    const { storageId } = await uploadResponse.json();

    // Get the public URL for the stored file
    const pdfUrl = await fetchMutation(api.files.getUrl as any, { storageId });

    if (!pdfUrl) {
      throw new Error("Failed to get PDF URL from storage");
    }

    // Update the cheat sheet record with PDF info
    await fetchMutation(api.cheatSheetMutations.updatePdfInfo as any, {
      cheatSheetId,
      pdfStorageId: storageId,
      pdfUrl,
    });

    return NextResponse.json({
      success: true,
      pdfUrl,
      storageId,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Please sign in" }, { status: 401 });
    }
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: `Failed to generate PDF: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}

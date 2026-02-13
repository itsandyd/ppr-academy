import { NextRequest, NextResponse } from "next/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { sendLeadMagnetEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { submissionId, productId } = await request.json();

    if (!submissionId || !productId) {
      return NextResponse.json(
        { error: "Missing submissionId or productId" },
        { status: 400 }
      );
    }

    // Get the submission
    const submission = await fetchQuery(
      api.followGateSubmissions.getSubmissionById,
      {
        submissionId: submissionId as Id<"followGateSubmissions">,
      }
    );

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Get the product
    const product = await fetchQuery(api.presetPacks.getProductById, {
      productId: productId as Id<"digitalProducts">,
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Get the store/creator info
    let store = null;
    if (product.storeId) {
      try {
        store = await fetchQuery(api.stores.getStoreById, {
          storeId: product.storeId as Id<"stores">,
        });
      } catch {
        // Store not found, continue without it
      }
    }

    // Build download URL - ensure we have a valid URL
    const downloadUrl = product.downloadUrl || "";

    // If no direct download URL, we could build one from storage
    // For now, just use what's available
    if (!downloadUrl) {
      console.warn("No download URL available for product:", productId);
    }

    // Send the email
    const emailResult = await sendLeadMagnetEmail({
      customerName: submission.name || "Valued Customer",
      customerEmail: submission.email,
      leadMagnetTitle: product.title,
      downloadUrl,
      adminName: store?.name || "Creator",
      adminEmail: "no-reply@pauseplayrepeat.com",
      storeName: store?.name,
    });

    return NextResponse.json({
      success: true,
      emailSent: !emailResult.simulation,
      messageId: emailResult.messageId,
    });
  } catch (error) {
    console.error("Error sending follow gate email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}

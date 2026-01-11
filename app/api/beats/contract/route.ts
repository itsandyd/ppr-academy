// @ts-nocheck - Convex type instantiation is too deep
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { Id } from "@/convex/_generated/dataModel";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth();

    // Get beatLicenseId from query params
    const { searchParams } = new URL(request.url);
    const licenseId = searchParams.get("licenseId");

    if (!licenseId) {
      return NextResponse.json({ error: "License ID required" }, { status: 400 });
    }

    // Get the beat license
    const { fetchQuery, fetchMutation } = await import("convex/nextjs");
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

    // Generate PDF
    const pdfBytes = await generateContractPDF(license);

    // Update contract generated timestamp
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await fetchMutation(api.beatLeases.markContractGenerated as any, {
      beatLicenseId: license._id,
    });

    // Return PDF as download
    return new NextResponse(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${license.beatTitle.replace(/[^a-zA-Z0-9]/g, "_")}_License_Agreement.pdf"`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Please sign in" }, { status: 401 });
    }
    console.error("Contract generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate contract" },
      { status: 500 }
    );
  }
}

interface BeatLicense {
  _id: Id<"beatLicenses">;
  beatTitle: string;
  producerName: string;
  tierType: "basic" | "premium" | "exclusive" | "unlimited";
  tierName: string;
  price: number;
  buyerName?: string;
  buyerEmail: string;
  commercialUse: boolean;
  musicVideoUse: boolean;
  radioBroadcasting: boolean;
  stemsIncluded: boolean;
  creditRequired: boolean;
  distributionLimit?: number;
  streamingLimit?: number;
  deliveredFiles: string[];
  createdAt: number;
}

async function generateContractPDF(license: BeatLicense): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // US Letter size
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const fontSize = 10;
  const titleSize = 18;
  const headerSize = 12;
  const margin = 50;
  let y = height - margin;

  const drawText = (text: string, options: { bold?: boolean; size?: number; color?: ReturnType<typeof rgb> } = {}) => {
    const selectedFont = options.bold ? boldFont : font;
    const size = options.size || fontSize;
    page.drawText(text, {
      x: margin,
      y,
      size,
      font: selectedFont,
      color: options.color || rgb(0, 0, 0),
    });
    y -= size + 6;
  };

  const drawLine = () => {
    page.drawLine({
      start: { x: margin, y: y + 4 },
      end: { x: width - margin, y: y + 4 },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });
    y -= 10;
  };

  // Title
  page.drawText("BEAT LEASE AGREEMENT", {
    x: width / 2 - 90,
    y,
    size: titleSize,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  y -= 30;

  drawLine();

  // Contract details
  const purchaseDate = new Date(license.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  drawText(`Date: ${purchaseDate}`);
  drawText(`Beat Title: "${license.beatTitle}"`, { bold: true });
  drawText(`Producer: ${license.producerName}`);
  drawText(`Licensee: ${license.buyerName || license.buyerEmail}`);
  drawText(`Email: ${license.buyerEmail}`);
  drawText(`License Type: ${license.tierName.toUpperCase()}`, { bold: true });
  drawText(`Purchase Price: $${license.price.toFixed(2)}`);

  y -= 10;
  drawLine();

  // Section 1: Grant of Rights
  drawText("1. GRANT OF RIGHTS", { bold: true, size: headerSize });
  drawText(
    license.tierType === "exclusive"
      ? "The Producer grants the Licensee an EXCLUSIVE license to use the Beat."
      : "The Producer grants the Licensee a NON-EXCLUSIVE license to use the Beat."
  );
  drawText("This license is subject to the terms and conditions below.");

  y -= 10;

  // Section 2: Usage Rights
  drawText("2. USAGE RIGHTS", { bold: true, size: headerSize });
  drawText(`${license.commercialUse ? "[X]" : "[ ]"} Commercial Use Allowed`);
  drawText(`${license.radioBroadcasting ? "[X]" : "[ ]"} Radio/TV Broadcasting`);
  drawText(`${license.musicVideoUse ? "[X]" : "[ ]"} Music Videos`);
  drawText("[X] Live Performances");

  y -= 10;

  // Section 3: Distribution Limits
  drawText("3. DISTRIBUTION LIMITS", { bold: true, size: headerSize });
  if (license.distributionLimit) {
    drawText(`Maximum ${license.distributionLimit.toLocaleString()} copies sold/distributed`);
  } else {
    drawText("No distribution limit (Unlimited)");
  }
  if (license.streamingLimit) {
    drawText(`Maximum ${license.streamingLimit.toLocaleString()} streams`);
  } else {
    drawText("No streaming limit (Unlimited)");
  }

  y -= 10;

  // Section 4: Files Included
  drawText("4. FILES INCLUDED", { bold: true, size: headerSize });
  const fileLabels: Record<string, string> = {
    mp3: "MP3 File (320kbps)",
    wav: "WAV File (24-bit/44.1kHz)",
    stems: "Stems (Individual tracks)",
    trackouts: "Trackouts (Full project files)",
  };
  for (const file of license.deliveredFiles) {
    drawText(`[X] ${fileLabels[file] || file.toUpperCase()}`);
  }

  y -= 10;

  // Section 5: Credit Requirements
  drawText("5. CREDIT REQUIREMENTS", { bold: true, size: headerSize });
  if (license.creditRequired) {
    drawText(`Credit REQUIRED in track title: "Prod. by ${license.producerName}"`);
  } else {
    drawText("Credit is OPTIONAL (not required)");
  }

  y -= 10;

  // Section 6: Exclusivity
  drawText("6. EXCLUSIVITY", { bold: true, size: headerSize });
  if (license.tierType === "exclusive") {
    drawText("EXCLUSIVE LICENSE: This beat will NOT be sold to anyone else.");
    drawText("Producer transfers all rights to the Licensee upon purchase.");
  } else {
    drawText("NON-EXCLUSIVE: This beat may be licensed to other artists.");
  }

  // Add second page if needed for remaining sections
  if (y < 200) {
    const page2 = pdfDoc.addPage([612, 792]);
    y = height - margin;
    // Continue on page 2...
  }

  y -= 10;

  // Section 7: Restrictions
  drawText("7. RESTRICTIONS", { bold: true, size: headerSize });
  drawText("The Licensee may NOT:");
  drawText("  - Resell, redistribute, or lease the Beat to third parties");
  drawText("  - Claim ownership of the Beat composition");
  drawText("  - Register the Beat with a Performance Rights Organization");
  if (license.tierType !== "exclusive") {
    drawText("  - Use for sync licensing without additional agreement");
  }

  y -= 10;

  // Section 8: Termination
  drawText("8. TERMINATION", { bold: true, size: headerSize });
  drawText("This license remains in effect indefinitely unless terminated");
  drawText("by breach of terms or mutual written agreement.");

  y -= 20;

  // Signature block
  drawLine();
  drawText("By purchasing this license, both parties agree to the above terms.", { size: 9 });

  y -= 20;
  drawText(`Producer: ${license.producerName}`);
  y -= 15;
  drawText(`Licensee: ${license.buyerName || license.buyerEmail}`);
  y -= 15;
  drawText(`Date: ${purchaseDate}`);

  y -= 30;

  // Footer
  page.drawText("Generated by PPR Academy - Beat Licensing Platform", {
    x: width / 2 - 120,
    y: margin,
    size: 8,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });
  page.drawText(`License ID: ${license._id}`, {
    x: width / 2 - 60,
    y: margin - 12,
    size: 7,
    font,
    color: rgb(0.6, 0.6, 0.6),
  });

  return pdfDoc.save();
}

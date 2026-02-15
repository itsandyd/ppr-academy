import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { checkRateLimit, getRateLimitIdentifier, rateLimiters } from "@/lib/rate-limit";
import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont } from "pdf-lib";

export const maxDuration = 60; // PDF generation + upload

// =============================================================================
// BRAND COLORS (PPR Academy)
// =============================================================================

const COLORS = {
  headerBg: rgb(0.39, 0.4, 0.97),        // #6366F1 indigo
  headerText: rgb(1, 1, 1),               // white
  sectionHeading: rgb(0.39, 0.4, 0.97),   // #6366F1 indigo
  bodyText: rgb(0.13, 0.13, 0.13),        // near black
  mutedText: rgb(0.45, 0.45, 0.45),       // gray
  tipBg: rgb(0.91, 0.93, 0.99),           // light indigo
  tipBorder: rgb(0.51, 0.55, 0.97),       // #818CF8
  warningBg: rgb(0.99, 0.91, 0.95),       // light pink
  warningBorder: rgb(0.93, 0.27, 0.6),    // #EC4899
  divider: rgb(0.85, 0.85, 0.85),         // light gray
  bulletDot: rgb(0.51, 0.55, 0.97),       // indigo
};

const LAYOUT = {
  pageWidth: 612,
  pageHeight: 792,
  margin: 50,
  headerHeight: 90,
  footerHeight: 40,
  sectionGap: 18,
  itemGap: 4,
  subItemIndent: 20,
  boxPadding: 10,
};

// =============================================================================
// PDF GENERATION
// =============================================================================

interface OutlineItem {
  text: string;
  subItems?: string[];
  isTip?: boolean;
  isWarning?: boolean;
}

interface OutlineSection {
  heading: string;
  type: string;
  items: OutlineItem[];
}

interface Outline {
  title: string;
  subtitle?: string;
  sections: OutlineSection[];
  footer?: string;
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);

    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

async function generateCheatSheetPDF(outline: Outline): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const contentWidth = LAYOUT.pageWidth - LAYOUT.margin * 2;

  let page = pdfDoc.addPage([LAYOUT.pageWidth, LAYOUT.pageHeight]);
  let y = LAYOUT.pageHeight;

  // Helper: check if we need a new page
  const ensureSpace = (needed: number) => {
    if (y - needed < LAYOUT.margin + LAYOUT.footerHeight) {
      drawFooter(page, font, outline.footer);
      page = pdfDoc.addPage([LAYOUT.pageWidth, LAYOUT.pageHeight]);
      y = LAYOUT.pageHeight - LAYOUT.margin;
    }
  };

  // ─── HEADER BAR ───
  page.drawRectangle({
    x: 0,
    y: LAYOUT.pageHeight - LAYOUT.headerHeight,
    width: LAYOUT.pageWidth,
    height: LAYOUT.headerHeight,
    color: COLORS.headerBg,
  });

  // Brand name
  page.drawText("PPR ACADEMY", {
    x: LAYOUT.margin,
    y: LAYOUT.pageHeight - 28,
    size: 9,
    font: boldFont,
    color: rgb(0.78, 0.8, 1),
  });

  // Title
  const titleLines = wrapText(outline.title.toUpperCase(), boldFont, 20, contentWidth);
  let titleY = LAYOUT.pageHeight - 52;
  for (const line of titleLines) {
    page.drawText(line, {
      x: LAYOUT.margin,
      y: titleY,
      size: 20,
      font: boldFont,
      color: COLORS.headerText,
    });
    titleY -= 24;
  }

  // Subtitle
  if (outline.subtitle) {
    const subLines = wrapText(outline.subtitle, font, 11, contentWidth);
    for (const line of subLines) {
      page.drawText(line, {
        x: LAYOUT.margin,
        y: titleY,
        size: 11,
        font,
        color: rgb(0.82, 0.84, 1),
      });
      titleY -= 14;
    }
  }

  y = LAYOUT.pageHeight - LAYOUT.headerHeight - 20;

  // ─── SECTIONS ───
  for (const section of outline.sections) {
    ensureSpace(60);

    // Section heading
    const sectionLabel = formatSectionType(section.type);
    page.drawText(sectionLabel, {
      x: LAYOUT.margin,
      y,
      size: 8,
      font,
      color: COLORS.mutedText,
    });
    y -= 14;

    page.drawText(section.heading, {
      x: LAYOUT.margin,
      y,
      size: 13,
      font: boldFont,
      color: COLORS.sectionHeading,
    });
    y -= 6;

    // Divider line
    page.drawLine({
      start: { x: LAYOUT.margin, y },
      end: { x: LAYOUT.pageWidth - LAYOUT.margin, y },
      thickness: 1,
      color: COLORS.divider,
    });
    y -= 12;

    // Items
    for (let i = 0; i < section.items.length; i++) {
      const item = section.items[i];

      if (item.isTip || item.isWarning) {
        // ─── CALLOUT BOX ───
        const boxColor = item.isTip ? COLORS.tipBg : COLORS.warningBg;
        const borderColor = item.isTip ? COLORS.tipBorder : COLORS.warningBorder;
        const prefix = item.isTip ? "[TIP] " : "[WARNING] ";

        const boxLines = wrapText(
          prefix + item.text,
          font,
          9,
          contentWidth - LAYOUT.boxPadding * 2 - 4
        );
        const boxHeight = boxLines.length * 13 + LAYOUT.boxPadding * 2;

        ensureSpace(boxHeight + 8);

        // Box background
        page.drawRectangle({
          x: LAYOUT.margin,
          y: y - boxHeight + LAYOUT.boxPadding,
          width: contentWidth,
          height: boxHeight,
          color: boxColor,
          borderColor: borderColor,
          borderWidth: 1,
        });

        // Box text
        let boxY = y;
        for (const line of boxLines) {
          page.drawText(line, {
            x: LAYOUT.margin + LAYOUT.boxPadding + 2,
            y: boxY,
            size: 9,
            font: line.startsWith(prefix) ? boldFont : font,
            color: COLORS.bodyText,
          });
          boxY -= 13;
        }

        y = y - boxHeight - 4;
      } else {
        // ─── REGULAR ITEM ───
        const bulletPrefix = section.type === "step_by_step" ? `${i + 1}. ` : "";
        const itemText = bulletPrefix + item.text;
        const itemLines = wrapText(itemText, font, 10, contentWidth - 14);

        ensureSpace(itemLines.length * 14 + 4);

        // Bullet dot (for non-numbered)
        if (section.type !== "step_by_step") {
          page.drawCircle({
            x: LAYOUT.margin + 4,
            y: y - 3,
            size: 2.5,
            color: COLORS.bulletDot,
          });
        }

        for (const line of itemLines) {
          page.drawText(line, {
            x: LAYOUT.margin + 14,
            y,
            size: 10,
            font: section.type === "step_by_step" && line.startsWith(bulletPrefix) ? boldFont : font,
            color: COLORS.bodyText,
          });
          y -= 14;
        }

        // Sub-items
        if (item.subItems && item.subItems.length > 0) {
          for (const sub of item.subItems) {
            const subLines = wrapText(`- ${sub}`, font, 9, contentWidth - 14 - LAYOUT.subItemIndent);
            ensureSpace(subLines.length * 12 + 2);

            for (const line of subLines) {
              page.drawText(line, {
                x: LAYOUT.margin + 14 + LAYOUT.subItemIndent,
                y,
                size: 9,
                font,
                color: COLORS.mutedText,
              });
              y -= 12;
            }
          }
        }

        y -= LAYOUT.itemGap;
      }
    }

    y -= LAYOUT.sectionGap;
  }

  // Footer on the last page
  drawFooter(page, font, outline.footer);

  return pdfDoc.save();
}

function drawFooter(page: PDFPage, font: PDFFont, footerText?: string) {
  const text = footerText || "Download more at ppr.academy";
  const textWidth = font.widthOfTextAtSize(text, 8);
  page.drawText(text, {
    x: (LAYOUT.pageWidth - textWidth) / 2,
    y: LAYOUT.margin - 10,
    size: 8,
    font,
    color: COLORS.mutedText,
  });
}

function formatSectionType(type: string): string {
  const labels: Record<string, string> = {
    key_takeaways: "KEY TAKEAWAYS",
    quick_reference: "QUICK REFERENCE",
    step_by_step: "STEP BY STEP",
    tips: "PRO TIPS",
    comparison: "COMPARISON",
    glossary: "GLOSSARY",
    custom: "REFERENCE",
  };
  return labels[type] || type.toUpperCase().replace(/_/g, " ");
}

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

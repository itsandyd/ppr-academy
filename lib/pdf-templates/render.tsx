import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import ReferenceGuidePDF from "./ReferenceGuidePDF";
import type { OutlineSection } from "./components";

// =============================================================================
// Public types (re-export for API route convenience)
// =============================================================================

export interface Outline {
  title: string;
  subtitle?: string;
  sections: OutlineSection[];
  footer?: string;
  showTOC?: boolean;
  badgeText?: string;
}

export type { OutlineSection };

// =============================================================================
// Render function — data in, PDF buffer out
// =============================================================================

export async function renderReferenceGuidePDF(
  outline: Outline
): Promise<Buffer> {
  const buffer = await renderToBuffer(
    <ReferenceGuidePDF
      title={outline.title}
      subtitle={outline.subtitle}
      sections={outline.sections}
      footer={outline.footer || "PPR Academy — ppr.academy"}
      showTOC={outline.showTOC}
      badgeText={outline.badgeText}
    />
  );
  return Buffer.from(buffer);
}

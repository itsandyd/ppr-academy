"use client";

import { StructuredDataHtml } from "./structured-data";

interface StructuredDataProps {
  data: StructuredDataHtml;
}

export function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={data}
      suppressHydrationWarning
    />
  );
}


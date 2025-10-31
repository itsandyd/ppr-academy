"use client";

import { generateCreatorStructuredData } from "@/lib/seo/structured-data";
import { StructuredData } from "@/lib/seo/structured-data-client";

interface StorefrontStructuredDataWrapperProps {
  name: string;
  description?: string;
  url: string;
  imageUrl?: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
}

export function StorefrontStructuredDataWrapper(props: StorefrontStructuredDataWrapperProps) {
  const structuredData = generateCreatorStructuredData(props);
  
  return <StructuredData data={structuredData} />;
}


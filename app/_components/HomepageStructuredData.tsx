"use client";

import { 
  generateWebsiteStructuredData,
  generateOrganizationStructuredData,
} from "@/lib/seo/structured-data";
import { StructuredData } from "@/lib/seo/structured-data-client";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ppracademy.com";

export function HomepageStructuredData() {
  const websiteData = generateWebsiteStructuredData({
    name: "PPR Academy",
    description: "Music Production Education Platform - Learn from industry experts, access premium courses, sample packs, and digital products.",
    url: baseUrl,
    searchUrl: `${baseUrl}/courses`,
  });

  const organizationData = generateOrganizationStructuredData({
    name: "PPR Academy",
    description: "The ultimate marketplace for music producers and creators. Learn music production, access premium courses, sample packs, and digital products.",
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    socialLinks: {
      instagram: "https://instagram.com/ppracademy",
      twitter: "https://twitter.com/ppracademy",
    },
  });

  return (
    <>
      <StructuredData data={websiteData} />
      <StructuredData data={organizationData} />
    </>
  );
}


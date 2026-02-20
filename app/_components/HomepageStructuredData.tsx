"use client";

import { 
  generateWebsiteStructuredData,
  generateOrganizationStructuredData,
} from "@/lib/seo/structured-data";
import { StructuredData } from "@/lib/seo/structured-data-client";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pauseplayrepeat.com";

export function HomepageStructuredData() {
  const websiteData = generateWebsiteStructuredData({
    name: "PausePlayRepeat",
    description: "Music Production Education Platform - Learn from industry experts, access premium courses, sample packs, and digital products.",
    url: baseUrl,
    searchUrl: `${baseUrl}/courses`,
  });

  const organizationData = generateOrganizationStructuredData({
    name: "PausePlayRepeat",
    description: "The ultimate marketplace for music producers and creators. Learn music production, access premium courses, sample packs, and digital products.",
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    socialLinks: {
      instagram: "https://instagram.com/pauseplayrepeat",
      twitter: "https://twitter.com/pauseplayrepeat",
    },
  });

  return (
    <>
      <StructuredData data={websiteData} />
      <StructuredData data={organizationData} />
    </>
  );
}


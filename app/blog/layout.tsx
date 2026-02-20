import { Metadata } from "next";
import { generateBreadcrumbStructuredData, generateWebsiteStructuredData } from "@/lib/seo/structured-data";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pauseplayrepeat.com";

export const metadata: Metadata = {
  title: "Blog | PausePlayRepeat - Music Production Tips & Tutorials",
  description:
    "Discover expert tutorials, tips, and insights on music production. Learn from industry professionals and grow your skills with PausePlayRepeat's blog.",
  keywords: [
    "music production",
    "music tutorials",
    "production tips",
    "music education",
    "audio engineering",
    "beat making",
    "music industry",
    "producer tips",
  ],
  openGraph: {
    title: "Blog | PausePlayRepeat",
    description:
      "Discover expert tutorials, tips, and insights on music production. Learn from industry professionals.",
    url: `${baseUrl}/blog`,
    siteName: "PausePlayRepeat",
    type: "website",
    images: [
      {
        url: `${baseUrl}/og-blog.png`,
        width: 1200,
        height: 630,
        alt: "PausePlayRepeat Blog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog | PausePlayRepeat",
    description:
      "Discover expert tutorials, tips, and insights on music production.",
  },
  alternates: {
    canonical: `${baseUrl}/blog`,
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbData = generateBreadcrumbStructuredData({
    items: [
      { name: "Home", url: baseUrl },
      { name: "Blog", url: `${baseUrl}/blog` },
    ],
  });

  const websiteData = generateWebsiteStructuredData({
    name: "PausePlayRepeat Blog",
    description: "Music production tutorials, tips, and industry insights",
    url: `${baseUrl}/blog`,
    searchUrl: `${baseUrl}/blog`,
  });

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={breadcrumbData} />
      <script type="application/ld+json" dangerouslySetInnerHTML={websiteData} />
      {children}
    </>
  );
}

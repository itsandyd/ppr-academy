import { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pauseplayrepeat.com";

export const metadata: Metadata = {
  title: "Bundles & Deals | PausePlayRepeat Marketplace",
  description:
    "Save with curated bundles of music production courses, sample packs, presets, and tools. Get more for less on PausePlayRepeat.",
  keywords:
    "music production bundles, sample pack bundle, preset bundle, course bundle, production deals, music production deals",
  openGraph: {
    title: "Bundles & Deals | PausePlayRepeat Marketplace",
    description:
      "Save with curated bundles of music production courses, sample packs, presets, and tools.",
    url: `${baseUrl}/marketplace/bundles`,
    siteName: "PausePlayRepeat",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bundles & Deals | PausePlayRepeat",
    description:
      "Save with curated bundles of music production courses, sample packs, presets, and tools.",
  },
  alternates: {
    canonical: `${baseUrl}/marketplace/bundles`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function BundlesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

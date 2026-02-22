import { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pauseplayrepeat.com";

export const metadata: Metadata = {
  title: "Music Producers & Creators | PausePlayRepeat Marketplace",
  description:
    "Discover music producers, sound designers, and educators on PausePlayRepeat. Browse creator storefronts for courses, samples, presets, and more.",
  keywords:
    "music producers, sound designers, music educators, beat makers, creator storefronts, music production creators",
  openGraph: {
    title: "Music Producers & Creators | PausePlayRepeat Marketplace",
    description:
      "Discover music producers, sound designers, and educators on PausePlayRepeat.",
    url: `${baseUrl}/marketplace/creators`,
    siteName: "PausePlayRepeat",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Music Producers & Creators | PausePlayRepeat",
    description:
      "Discover music producers, sound designers, and educators on PausePlayRepeat.",
  },
  alternates: {
    canonical: `${baseUrl}/marketplace/creators`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function CreatorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

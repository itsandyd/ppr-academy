import { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pauseplayrepeat.com";

export const metadata: Metadata = {
  title: "Ableton Live Racks | PausePlayRepeat Marketplace",
  description:
    "Download Ableton Live audio effect racks, instrument racks, and drum racks. Professional sound design tools for Ableton Live producers.",
  keywords:
    "Ableton racks, audio effect rack, instrument rack, drum rack, Ableton Live, Ableton presets, Ableton effects, sound design",
  openGraph: {
    title: "Ableton Live Racks | PausePlayRepeat Marketplace",
    description:
      "Download Ableton Live audio effect racks, instrument racks, and drum racks from professional sound designers.",
    url: `${baseUrl}/marketplace/ableton-racks`,
    siteName: "PausePlayRepeat",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ableton Live Racks | PausePlayRepeat",
    description:
      "Download Ableton Live audio effect racks, instrument racks, and drum racks.",
  },
  alternates: {
    canonical: `${baseUrl}/marketplace/ableton-racks`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function AbletonRacksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

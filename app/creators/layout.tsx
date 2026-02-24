import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pauseplayrepeat.com";

export const metadata: Metadata = {
  title: "Become a Creator",
  description:
    "Sell your beats, presets, sample packs, and courses to 100,000 music producers. Built by producers, for producers.",
  keywords: [
    "sell beats online",
    "sell presets",
    "sell sample packs",
    "music producer marketplace",
    "sell courses music production",
    "music creator platform",
    "beatstars alternative",
    "gumroad alternative music",
  ],
  openGraph: {
    title: "Become a Creator — PausePlayRepeat",
    description:
      "Sell your beats, presets, sample packs, and courses to 100,000 music producers. Built by producers, for producers.",
    url: `${baseUrl}/creators`,
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Become a Creator on PausePlayRepeat",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Become a Creator — PausePlayRepeat",
    description:
      "Sell your beats, presets, sample packs, and courses to 100,000 music producers. Built by producers, for producers.",
    images: ["/og-image.png"],
    creator: "@pauseplayrepeat",
  },
  alternates: {
    canonical: `${baseUrl}/creators`,
  },
};

export default function CreatorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

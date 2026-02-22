import { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pauseplayrepeat.com";

export const metadata: Metadata = {
  title: "Sample Packs | PausePlayRepeat Marketplace",
  description:
    "Browse and download royalty-free sample packs for music production. Drums, loops, one-shots, vocals, and more from independent creators.",
  keywords:
    "sample packs, royalty free samples, drum kits, loop packs, one-shots, vocal samples, music production samples, free sample packs",
  openGraph: {
    title: "Sample Packs | PausePlayRepeat Marketplace",
    description:
      "Browse and download royalty-free sample packs for music production. Drums, loops, one-shots, and more.",
    url: `${baseUrl}/marketplace/samples`,
    siteName: "PausePlayRepeat",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sample Packs | PausePlayRepeat",
    description:
      "Browse and download royalty-free sample packs for music production.",
  },
  alternates: {
    canonical: `${baseUrl}/marketplace/samples`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function SamplesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

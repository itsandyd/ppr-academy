import { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pauseplayrepeat.com";

export const metadata: Metadata = {
  title: "Preset Packs | PausePlayRepeat Marketplace",
  description:
    "Browse synth and effect presets for Serum, Vital, Massive, Sylenth1, and more. Instant download preset packs from professional sound designers.",
  keywords:
    "preset packs, synth presets, Serum presets, Vital presets, Massive presets, effect presets, sound design presets, VST presets",
  openGraph: {
    title: "Preset Packs | PausePlayRepeat Marketplace",
    description:
      "Browse synth and effect presets for Serum, Vital, Massive, and more from professional sound designers.",
    url: `${baseUrl}/marketplace/preset-packs`,
    siteName: "PausePlayRepeat",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Preset Packs | PausePlayRepeat",
    description:
      "Browse synth and effect presets for Serum, Vital, Massive, and more from professional sound designers.",
  },
  alternates: {
    canonical: `${baseUrl}/marketplace/preset-packs`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PresetPacksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

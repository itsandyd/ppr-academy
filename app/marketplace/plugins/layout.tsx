import { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pauseplayrepeat.com";

export const metadata: Metadata = {
  title: "VST Plugins & Audio Tools | PausePlayRepeat Marketplace",
  description:
    "Discover VST, AU, and AAX plugins for music production. Browse free and premium synthesizers, effects, samplers, and audio tools from top developers.",
  keywords:
    "VST plugins, AU plugins, AAX plugins, free VST, music production plugins, synthesizer, audio effects, DAW plugins, virtual instruments",
  openGraph: {
    title: "VST Plugins & Audio Tools | PausePlayRepeat Marketplace",
    description:
      "Discover VST, AU, and AAX plugins for music production. Free and premium synthesizers, effects, and audio tools.",
    url: `${baseUrl}/marketplace/plugins`,
    siteName: "PausePlayRepeat",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VST Plugins & Audio Tools | PausePlayRepeat",
    description:
      "Discover VST, AU, and AAX plugins for music production. Free and premium synthesizers, effects, and audio tools.",
  },
  alternates: {
    canonical: `${baseUrl}/marketplace/plugins`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PluginsListLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

import { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pauseplayrepeat.com";

export const metadata: Metadata = {
  title: "Mixing Templates | PausePlayRepeat Marketplace",
  description:
    "Download professional mixing templates for Ableton, Logic Pro, FL Studio, and more. Pre-built session files with routing, effects chains, and mix bus processing.",
  keywords:
    "mixing templates, DAW templates, Ableton template, Logic Pro template, FL Studio template, mix template, session template",
  openGraph: {
    title: "Mixing Templates | PausePlayRepeat Marketplace",
    description:
      "Download professional mixing templates for Ableton, Logic Pro, FL Studio, and more.",
    url: `${baseUrl}/marketplace/mixing-templates`,
    siteName: "PausePlayRepeat",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mixing Templates | PausePlayRepeat",
    description:
      "Download professional mixing templates for Ableton, Logic Pro, FL Studio, and more.",
  },
  alternates: {
    canonical: `${baseUrl}/marketplace/mixing-templates`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function MixingTemplatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

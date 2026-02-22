import { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pauseplayrepeat.com";

export const metadata: Metadata = {
  title: "Production Guides & PDFs | PausePlayRepeat Marketplace",
  description:
    "Step-by-step music production guides, cheat sheets, and PDF resources covering mixing, sound design, workflow tips, and more.",
  keywords:
    "music production guides, mixing guide, sound design guide, production cheat sheet, music production PDF, production tips",
  openGraph: {
    title: "Production Guides & PDFs | PausePlayRepeat Marketplace",
    description:
      "Step-by-step music production guides, cheat sheets, and PDF resources from experienced producers.",
    url: `${baseUrl}/marketplace/guides`,
    siteName: "PausePlayRepeat",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Production Guides & PDFs | PausePlayRepeat",
    description:
      "Step-by-step music production guides, cheat sheets, and PDF resources from experienced producers.",
  },
  alternates: {
    canonical: `${baseUrl}/marketplace/guides`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function GuidesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

import { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pauseplayrepeat.com";

export const metadata: Metadata = {
  title: "Beats & Instrumentals | PausePlayRepeat Marketplace",
  description:
    "Browse and license beats, instrumentals, and beat leases from independent producers. Find the perfect beat for your next track on PausePlayRepeat.",
  keywords:
    "beats, instrumentals, beat lease, buy beats online, rap beats, hip hop beats, music production, type beats",
  openGraph: {
    title: "Beats & Instrumentals | PausePlayRepeat Marketplace",
    description:
      "Browse and license beats, instrumentals, and beat leases from independent producers.",
    url: `${baseUrl}/marketplace/beats`,
    siteName: "PausePlayRepeat",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Beats & Instrumentals | PausePlayRepeat",
    description:
      "Browse and license beats, instrumentals, and beat leases from independent producers.",
  },
  alternates: {
    canonical: `${baseUrl}/marketplace/beats`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function BeatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

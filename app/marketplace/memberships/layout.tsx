import { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pauseplayrepeat.com";

export const metadata: Metadata = {
  title: "Creator Memberships | PausePlayRepeat Marketplace",
  description:
    "Join creator memberships for exclusive music production content, samples, presets, tutorials, and community access on PausePlayRepeat.",
  keywords:
    "music production membership, creator membership, exclusive content, music production community, subscription",
  openGraph: {
    title: "Creator Memberships | PausePlayRepeat Marketplace",
    description:
      "Join creator memberships for exclusive music production content, samples, presets, and community access.",
    url: `${baseUrl}/marketplace/memberships`,
    siteName: "PausePlayRepeat",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Creator Memberships | PausePlayRepeat",
    description:
      "Join creator memberships for exclusive music production content and community access.",
  },
  alternates: {
    canonical: `${baseUrl}/marketplace/memberships`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function MembershipsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

import { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pauseplayrepeat.com";

export const metadata: Metadata = {
  title: "Music Production Coaching | PausePlayRepeat Marketplace",
  description:
    "Book 1-on-1 music production coaching sessions with experienced producers. Get personalized feedback on mixing, mastering, sound design, and more.",
  keywords:
    "music production coaching, 1 on 1 coaching, mixing feedback, production mentoring, music production lessons, online music coaching",
  openGraph: {
    title: "Music Production Coaching | PausePlayRepeat Marketplace",
    description:
      "Book 1-on-1 music production coaching sessions with experienced producers.",
    url: `${baseUrl}/marketplace/coaching`,
    siteName: "PausePlayRepeat",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Music Production Coaching | PausePlayRepeat",
    description:
      "Book 1-on-1 music production coaching sessions with experienced producers.",
  },
  alternates: {
    canonical: `${baseUrl}/marketplace/coaching`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function CoachingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

import { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pauseplayrepeat.com";

export const metadata: Metadata = {
  title: "Music Production Courses | PausePlayRepeat Marketplace",
  description:
    "Learn music production, mixing, mastering, and sound design with courses from experienced producers and educators on PausePlayRepeat.",
  keywords:
    "music production courses, mixing course, mastering course, sound design, learn music production, online music courses, DAW tutorials",
  openGraph: {
    title: "Music Production Courses | PausePlayRepeat Marketplace",
    description:
      "Learn music production, mixing, mastering, and sound design with courses from experienced producers.",
    url: `${baseUrl}/marketplace/courses`,
    siteName: "PausePlayRepeat",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Music Production Courses | PausePlayRepeat",
    description:
      "Learn music production, mixing, mastering, and sound design with courses from experienced producers.",
  },
  alternates: {
    canonical: `${baseUrl}/marketplace/courses`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function CoursesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

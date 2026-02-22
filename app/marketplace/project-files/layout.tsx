import { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pauseplayrepeat.com";

export const metadata: Metadata = {
  title: "Project Files | PausePlayRepeat Marketplace",
  description:
    "Download DAW project files for Ableton Live, FL Studio, Logic Pro, and more. Learn from real productions with fully editable session files.",
  keywords:
    "project files, DAW project files, Ableton project, FL Studio project, Logic Pro project, production files, session files",
  openGraph: {
    title: "Project Files | PausePlayRepeat Marketplace",
    description:
      "Download DAW project files for Ableton Live, FL Studio, Logic Pro, and more.",
    url: `${baseUrl}/marketplace/project-files`,
    siteName: "PausePlayRepeat",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Project Files | PausePlayRepeat",
    description:
      "Download DAW project files for Ableton Live, FL Studio, Logic Pro, and more.",
  },
  alternates: {
    canonical: `${baseUrl}/marketplace/project-files`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ProjectFilesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

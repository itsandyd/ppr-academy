import { Metadata } from "next";
import { generateBreadcrumbStructuredData } from "@/lib/seo/structured-data";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pauseplayrepeat.com";

export const metadata: Metadata = {
  title: "Courses | PausePlayRepeat - Learn Music Production",
  description:
    "Master music production with expert-led courses. Learn beat making, mixing, mastering, and more from industry professionals at PausePlayRepeat.",
  keywords: [
    "music production courses",
    "online music courses",
    "beat making tutorials",
    "mixing courses",
    "mastering courses",
    "music education",
    "learn music production",
    "producer courses",
  ],
  openGraph: {
    title: "Courses | PausePlayRepeat",
    description:
      "Master music production with expert-led courses. Learn from industry professionals.",
    url: `${baseUrl}/courses`,
    siteName: "PausePlayRepeat",
    type: "website",
    images: [
      {
        url: `${baseUrl}/og-courses.png`,
        width: 1200,
        height: 630,
        alt: "PausePlayRepeat Courses",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Courses | PausePlayRepeat",
    description:
      "Master music production with expert-led courses. Learn from industry professionals.",
  },
  alternates: {
    canonical: `${baseUrl}/courses`,
  },
};

export default function CoursesLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbData = generateBreadcrumbStructuredData({
    items: [
      { name: "Home", url: baseUrl },
      { name: "Courses", url: `${baseUrl}/courses` },
    ],
  });

  return (
    <>
      {/* JSON-LD Structured Data for courses listing */}
      <script type="application/ld+json" dangerouslySetInnerHTML={breadcrumbData} />
      {children}
    </>
  );
}

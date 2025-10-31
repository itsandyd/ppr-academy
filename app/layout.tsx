import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BuildProviders } from "@/lib/build-providers";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({ subsets: ["latin"] });

// Define the base URL for your application
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ppracademy.com";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "PPR Academy - Music Production Courses, Samples & Digital Products",
    template: "%s | PPR Academy",
  },
  description: "Learn music production from industry experts. Access premium courses, sample packs, and digital products. Join the ultimate marketplace for music producers and creators.",
  keywords: [
    "music production",
    "music courses",
    "sample packs",
    "digital products",
    "music education",
    "producer marketplace",
    "audio samples",
    "music lessons",
    "sound design",
    "beat making",
  ],
  authors: [{ name: "PPR Academy" }],
  creator: "PPR Academy",
  publisher: "PPR Academy",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "PPR Academy",
    title: "PPR Academy - Music Production Courses, Samples & Digital Products",
    description: "Learn music production from industry experts. Access premium courses, sample packs, and digital products.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PPR Academy - Music Production Education Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PPR Academy - Music Production Courses, Samples & Digital Products",
    description: "Learn music production from industry experts. Access premium courses, sample packs, and digital products.",
    images: ["/og-image.png"],
    creator: "@ppracademy",
  },
  alternates: {
    canonical: baseUrl,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
  },
  category: "education",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        {/* Skip Links for Accessibility */}
        <a 
          href="#main-content"
          className="skip-link absolute -top-10 left-0 bg-primary text-primary-foreground px-4 py-2 z-[100] focus:top-0 transition-all"
        >
          Skip to main content
        </a>
        <BuildProviders>
          <main id="main-content" className="min-h-screen">
            {children}
          </main>
        </BuildProviders>
        <Analytics />
      </body>
    </html>
  );
}

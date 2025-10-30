import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BuildProviders } from "@/lib/build-providers";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Music Production Academy",
  description: "Learn music production from industry experts",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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

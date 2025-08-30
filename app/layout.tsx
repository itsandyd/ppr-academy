import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BuildProviders } from "@/lib/build-providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Music Production Academy",
  description: "Learn music production from industry experts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <BuildProviders>
          <main className="min-h-screen">
            {children}
          </main>
        </BuildProviders>
      </body>
    </html>
  );
}

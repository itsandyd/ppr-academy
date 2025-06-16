import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import NavbarWrapper from "@/components/navbar-wrapper";
import Footer from "@/components/footer";
import { Toaster } from "@/components/ui/toaster";

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
  // Check if Clerk keys are available (for build-time safety)
  const hasClerkKeys = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
                       process.env.CLERK_SECRET_KEY;

  const content = (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <NavbarWrapper />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
        <Toaster />
      </body>
    </html>
  );

  // Only wrap with ClerkProvider if keys are available
  if (hasClerkKeys) {
    return (
      <ClerkProvider>
        {content}
      </ClerkProvider>
    );
  }

  // Fallback for build time or when Clerk keys are missing
  return content;
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import NavbarWrapper from "@/components/navbar-wrapper";
import { ThemeProvider } from "@/components/theme-provider";
import { StickyNav } from "./_components/sticky-nav";
import ConvexClientProvider from "@/lib/convex-provider";

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
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  
  // If no Clerk key is available, render without Clerk provider during build
  if (!clerkKey) {
    return (
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.className} antialiased`}>
          <ConvexClientProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem
              disableTransitionOnChange
            >
              <main className="min-h-screen">
                {children}
              </main>
              <Toaster />
            </ThemeProvider>
          </ConvexClientProvider>
        </body>
      </html>
    );
  }
  
  return (
    <ClerkProvider 
      publishableKey={clerkKey}
    >
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.className} antialiased`}>
          <ConvexClientProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem
              disableTransitionOnChange
            >
              {/* <StickyNav /> */}
              <main className="min-h-screen">
                {children}
              </main>
              <Toaster />
            </ThemeProvider>
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

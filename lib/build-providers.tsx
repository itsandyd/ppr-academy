"use client";

import { ReactNode } from 'react';
import { ClerkProvider } from "@clerk/nextjs";
import ConvexClientProvider from "@/lib/convex-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";

interface BuildProvidersProps {
  children: ReactNode;
}

export function BuildProviders({ children }: BuildProvidersProps) {
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  
  // During build time, if no Clerk key is available, render without Clerk provider
  if (!clerkKey) {
    return (
      <ConvexClientProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </ConvexClientProvider>
    );
  }
  
  // Runtime with valid Clerk key
  return (
    <ClerkProvider publishableKey={clerkKey}>
      <ConvexClientProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </ConvexClientProvider>
    </ClerkProvider>
  );
}
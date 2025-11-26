"use client";

import { ReactNode } from 'react';
import { ClerkProvider } from "@clerk/nextjs";
import ConvexClientProvider from "@/lib/convex-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { useTheme } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";

// Wrapper to get theme for Sonner
function ThemedSonnerToaster() {
  const { theme } = useTheme();
  return (
    <SonnerToaster 
      position="bottom-right" 
      richColors 
      theme={theme as "light" | "dark" | "system"}
      toastOptions={{
        classNames: {
          toast: "bg-white dark:bg-black border-border",
          title: "text-foreground",
          description: "text-muted-foreground",
          success: "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100",
          error: "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100",
          warning: "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-100",
          info: "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100",
        },
      }}
    />
  );
}

interface BuildProvidersProps {
  children: ReactNode;
}

export function BuildProviders({ children }: BuildProvidersProps) {
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  
  // Log for debugging in production
  if (typeof window !== 'undefined') {
    console.log('🔑 Clerk key available:', !!clerkKey);
  }
  
  // During build time, if no Clerk key is available, render without Clerk provider
  if (!clerkKey) {
    console.warn('⚠️ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY not found - SignUpButton will not work');
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
          <ThemedSonnerToaster />
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
          <ThemedSonnerToaster />
        </ThemeProvider>
      </ConvexClientProvider>
    </ClerkProvider>
  );
}
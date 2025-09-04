"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LibrarySidebar } from "./components/library-sidebar";
import { LibraryHeader } from "./components/library-header";
import { SidebarProvider } from "@/components/ui/sidebar";

// Force dynamic rendering for all library routes
export const dynamic = 'force-dynamic';

interface LibraryLayoutProps {
  children: React.ReactNode;
}

export default function LibraryLayout({ children }: LibraryLayoutProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  return (
    <SidebarProvider>
      <LibrarySidebar />
      <main className="flex-1 flex flex-col w-full">
        {/* Header with mobile sidebar trigger */}
        <LibraryHeader />
        
        {/* Content Area */}
        <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full bg-background">
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
}

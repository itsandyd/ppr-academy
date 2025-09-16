"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { CreatorDashboardEnhanced } from "@/components/dashboard/creator-dashboard-enhanced";
import { StoreRequiredGuard } from "@/components/dashboard/store-required-guard";
import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

// Prevent static generation for this page
export const dynamic = 'force-dynamic';

function StoreContent() {
  return (
    <StoreRequiredGuard redirectTo="/home">
      <CreatorDashboardEnhanced />
    </StoreRequiredGuard>
  );
}

export default function MyStorePage() {
  return (
    <>
      <Authenticated>
        <StoreContent />
      </Authenticated>
      
      <Unauthenticated>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Welcome to PPR Academy Store</h1>
            <p className="text-gray-600 mb-8">Please sign in to access your store dashboard</p>
            <SignInButton mode="modal">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Sign In to Continue
              </Button>
            </SignInButton>
          </div>
        </div>
      </Unauthenticated>
    </>
  );
}
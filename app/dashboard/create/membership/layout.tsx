"use client";

import { MembershipCreationProvider } from "./context";

export default function MembershipCreateLayout({ children }: { children: React.ReactNode }) {
  return (
    <MembershipCreationProvider>
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Create Membership Tier</h1>
            <p className="mt-2 text-muted-foreground">
              Set up recurring subscriptions with access to your content
            </p>
          </div>
          {children}
        </div>
      </div>
    </MembershipCreationProvider>
  );
}

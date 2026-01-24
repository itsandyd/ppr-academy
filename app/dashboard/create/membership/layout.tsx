"use client";

import React from "react";
import { MembershipCreationProvider, useMembershipCreation } from "./context";
import { AutoSaveProvider, SaveStatusIndicator, useAutoSaveOnChange } from "@/app/dashboard/create/shared/AutoSaveProvider";
import { ProductLimitGate } from "@/app/dashboard/create/shared/ProductLimitGate";

function LayoutContentInner({ children }: { children: React.ReactNode }) {
  const { state } = useMembershipCreation();

  // Trigger auto-save when data changes
  useAutoSaveOnChange(state.data);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">Create Membership Tier</h1>
            <SaveStatusIndicator className="ml-2" />
          </div>
          <p className="mt-2 text-muted-foreground">
            Set up recurring subscriptions with access to your content
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { saveTier } = useMembershipCreation();

  return (
    <AutoSaveProvider onSave={saveTier} debounceMs={1500}>
      <LayoutContentInner>{children}</LayoutContentInner>
    </AutoSaveProvider>
  );
}

export default function MembershipCreateLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProductLimitGate featureType="products">
      <MembershipCreationProvider>
        <LayoutContent>{children}</LayoutContent>
      </MembershipCreationProvider>
    </ProductLimitGate>
  );
}

"use client";

import { ReactNode, Suspense } from "react";
import { AdminShell } from "./components/AdminShell";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";

interface AdminLayoutProps {
  children: ReactNode;
}

function AdminLayoutInner({ children }: AdminLayoutProps) {
  return <AdminShell>{children}</AdminShell>;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Skeleton className="h-screen w-full" />
        </div>
      }
    >
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </Suspense>
  );
}

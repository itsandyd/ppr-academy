"use client";

import { useRouter } from "next/navigation";
import { useImpersonation } from "@/lib/impersonation-context";
import { Button } from "@/components/ui/button";
import { Shield, X, Store } from "lucide-react";

export function ImpersonationBanner() {
  const router = useRouter();
  const {
    isImpersonating,
    impersonatedCreatorName,
    impersonatedStoreName,
    stopImpersonation,
  } = useImpersonation();

  if (!isImpersonating) return null;

  const handleExit = () => {
    stopImpersonation();
    router.push("/admin");
  };

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b-2 border-amber-500/50 bg-amber-50 px-4 py-2 dark:bg-amber-950/50">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500">
          <Shield className="h-4 w-4 text-white" />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-amber-800 dark:text-amber-200">
            Admin Mode:
          </span>
          <span className="text-amber-700 dark:text-amber-300">
            Managing{" "}
            <strong>{impersonatedCreatorName || "Creator"}</strong>&apos;s store
          </span>
          {impersonatedStoreName && (
            <span className="flex items-center gap-1 rounded-full bg-amber-200/50 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-800/50 dark:text-amber-300">
              <Store className="h-3 w-3" />
              {impersonatedStoreName}
            </span>
          )}
        </div>
      </div>

      <Button
        onClick={handleExit}
        size="sm"
        variant="outline"
        className="gap-1.5 border-amber-400 bg-white text-amber-800 hover:bg-amber-100 dark:border-amber-600 dark:bg-amber-900 dark:text-amber-200 dark:hover:bg-amber-800"
      >
        <X className="h-3.5 w-3.5" />
        Exit
      </Button>
    </div>
  );
}

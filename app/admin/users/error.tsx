"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, ArrowLeft, Users } from "lucide-react";
import Link from "next/link";

export default function UsersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin users error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <Card className="w-full max-w-lg border-2 border-violet-200 dark:border-violet-800">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30">
            <Users className="h-8 w-8 text-violet-600" />
          </div>
          <CardTitle className="text-2xl">Users Error</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-muted-foreground">
            We couldn&apos;t load the user management data. User accounts are not affected.
          </p>

          {process.env.NODE_ENV === "development" && error.message && (
            <div className="rounded-lg bg-violet-50 dark:bg-violet-900/20 p-4 border border-violet-200 dark:border-violet-800">
              <p className="font-mono text-xs text-violet-700 dark:text-violet-300 break-all">
                {error.message}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={reset} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Reload Users
            </Button>
            <Button variant="outline" asChild className="gap-2">
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4" />
                Back to Admin
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

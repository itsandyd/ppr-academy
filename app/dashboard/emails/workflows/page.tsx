"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Workflow, Plus, Construction } from "lucide-react";

export default function WorkflowsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");

  if (mode !== "create") {
    router.push("/dashboard?mode=create");
    return null;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/dashboard/emails?mode=create")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Workflow className="h-6 w-6 text-purple-600" />
            Visual Workflow Builder
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Build complex automation workflows with drag-and-drop
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20">
          <Construction className="mb-4 h-16 w-16 text-amber-500" />
          <h3 className="mb-2 text-xl font-semibold">Coming Soon</h3>
          <p className="mb-6 max-w-md text-center text-muted-foreground">
            The visual workflow builder is under development. For now, use Email Sequences to create
            automated email campaigns.
          </p>
          <Button onClick={() => router.push("/dashboard/emails?mode=create")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Email Marketing
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

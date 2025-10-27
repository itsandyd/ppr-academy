"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import WorkflowBuilder from "@/components/workflow/WorkflowBuilder";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Workflow, Settings, Save, Play } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface WorkflowBuilderPageProps {
  params: Promise<{ storeId: string; workflowId: string }>;
}

export default function WorkflowBuilderPage({ params }: WorkflowBuilderPageProps) {
  const router = useRouter();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [workflowId, setWorkflowId] = useState<string | null>(null);

  // Extract params
  useEffect(() => {
    params.then((p) => {
      setStoreId(p.storeId);
      setWorkflowId(p.workflowId);
    });
  }, [params]);

  // Check if this is a special route (create, templates, etc.)
  const isSpecialRoute = workflowId === "create" || workflowId === "templates";

  // Get the specific workflow (skip if special route or no workflowId)
  const workflow = useQuery(
    api.emailWorkflows.getWorkflow,
    workflowId && !isSpecialRoute ? { workflowId: workflowId as any } : "skip"
  );

  // Conditional rendering after all hooks
  if (!storeId || !workflowId || isSpecialRoute) {
    return (
      <div className="max-w-7xl mx-auto py-10 md:py-16">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
          </div>
          <Skeleton className="h-[600px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const handleSave = (updatedWorkflow: any) => {
    // Optionally redirect back to automations list or show success message
    console.log("Workflow saved:", updatedWorkflow);
  };

  if (workflow === undefined) {
    return (
      <div className="max-w-7xl mx-auto py-10 md:py-16">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Workflow className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-6 w-16" />
              </div>
              <Skeleton className="h-4 w-80" />
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-8">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-muted animate-pulse mx-auto mb-4"></div>
                <Skeleton className="h-6 w-32 mx-auto mb-2" />
                <Skeleton className="h-4 w-48 mx-auto" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (workflow === null) {
    return (
      <div className="max-w-7xl mx-auto py-10 md:py-16">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-4">
            <Link href={`/store/${storeId}/automations`}>
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Automations
              </Button>
            </Link>
          </div>
          <div className="bg-card rounded-xl border border-border p-16">
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl bg-muted mx-auto mb-6 flex items-center justify-center">
                <Workflow className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Workflow Not Found</h3>
              <p className="text-muted-foreground mb-6">
                The workflow you're looking for doesn't exist or may have been deleted.
              </p>
              <Link href={`/store/${storeId}/automations`}>
                <Button className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Return to Automations
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isActive = workflow.isActive;
  const nodeCount = workflow.nodes?.length || 0;
  const hasEmail = workflow.nodes?.some((node: any) => node.type === 'email') || false;

  return (
    <div className="max-w-7xl mx-auto py-10 md:py-16">
      <div className="flex flex-col gap-8">
        {/* Header Section */}
        <div className="flex items-center justify-between border-b border-border pb-6">
          <div className="flex items-center gap-4">
            <Link href={`/store/${storeId}/automations`}>
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Workflow className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-foreground">
                  {workflow.name || "Untitled Workflow"}
                </h1>
                <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
                  {isActive ? "Active" : "Draft"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {nodeCount} step{nodeCount !== 1 ? 's' : ''} • 
                {hasEmail ? ' Email automation' : ' Logic workflow'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Save className="w-4 h-4" />
              Save
            </Button>
            <Button 
              size="sm" 
              className="gap-2"
              variant={isActive ? "secondary" : "default"}
            >
              <Play className="w-4 h-4" />
              {isActive ? "Pause" : "Activate"}
            </Button>
          </div>
        </div>

        {/* Workflow Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="text-2xl font-bold text-foreground">{nodeCount}</div>
            <div className="text-sm text-muted-foreground">Total Steps</div>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="text-2xl font-bold text-foreground">
              {workflow.nodes?.filter((n: any) => n.type === 'email').length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Email Steps</div>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="text-2xl font-bold text-foreground">
              {workflow.nodes?.filter((n: any) => n.type === 'delay').length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Delays</div>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="text-2xl font-bold text-foreground">
              {workflow.nodes?.filter((n: any) => n.type === 'condition').length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Conditions</div>
          </div>
        </div>

        {/* Main Workflow Builder */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <WorkflowBuilder
            workflow={workflow}
            storeId={storeId}
            userId={workflow.userId}
            onSave={handleSave}
          />
        </div>
      </div>
    </div>
  );
} 
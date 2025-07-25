"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import WorkflowBuilder from "@/components/workflow/WorkflowBuilder";
import { useRouter } from "next/navigation";

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

  // Get the specific workflow (always call hooks)
  const workflow = useQuery(
    api.emailWorkflows.getWorkflow,
    workflowId ? { workflowId: workflowId as any } : "skip"
  );

  // Conditional rendering after all hooks
  if (!storeId || !workflowId) {
    return <div>Loading...</div>;
  }

  const handleSave = (updatedWorkflow: any) => {
    // Optionally redirect back to automations list or show success message
    console.log("Workflow saved:", updatedWorkflow);
  };

  if (workflow === undefined) {
    return <div>Loading workflow...</div>;
  }

  if (workflow === null) {
    return <div>Workflow not found</div>;
  }

  return (
    <WorkflowBuilder
      workflow={workflow}
      storeId={storeId}
      userId={workflow.userId}
      onSave={handleSave}
    />
  );
} 
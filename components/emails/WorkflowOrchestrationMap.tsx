"use client";

import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ArrowDown,
  Play,
  Pause,
  Mail,
  Clock,
  Users,
  Workflow,
  ChevronRight,
  Zap,
  GitBranch,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkflowNode {
  id: string;
  name: string;
  isActive: boolean;
  emailCount: number;
  enrolledCount: number;
  triggerType: string;
  triggerLabel: string;
  nextWorkflows: string[]; // IDs of workflows this one can trigger
}

// Define the workflow flow/connections
const workflowConnections: Record<string, { triggers: string; leadsTo: string[] }> = {
  welcome: {
    triggers: "New User Signup",
    leadsTo: ["new_learner", "learner_to_creator"],
  },
  new_learner: {
    triggers: "First Course Enrollment",
    leadsTo: ["course_progress", "course_complete"],
  },
  course_progress: {
    triggers: "Module Completed",
    leadsTo: ["course_complete"],
  },
  course_complete: {
    triggers: "Course Completed",
    leadsTo: ["learner_to_creator"],
  },
  learner_to_creator: {
    triggers: "Qualified Learner (L5+)",
    leadsTo: ["new_creator"],
  },
  new_creator: {
    triggers: "Store Created",
    leadsTo: ["creator_success"],
  },
  creator_success: {
    triggers: "First Sale",
    leadsTo: [],
  },
  platform_reengagement: {
    triggers: "14 Days Inactive",
    leadsTo: ["platform_winback"],
  },
  platform_winback: {
    triggers: "60 Days Inactive",
    leadsTo: [],
  },
};

const workflowDisplayNames: Record<string, string> = {
  welcome: "Platform Welcome",
  new_learner: "New Learner Journey",
  course_progress: "Course Progress",
  course_complete: "Course Completion",
  learner_to_creator: "Learner → Creator",
  new_creator: "Creator Onboarding",
  creator_success: "Creator Success",
  platform_reengagement: "Re-engagement",
  platform_winback: "Win-back",
};

// Sequence name patterns for matching saved workflows
const sequenceNamePatterns: Record<string, string[]> = {
  welcome: ["platform welcome", "welcome"],
  new_learner: ["new learner", "learner journey"],
  course_progress: ["course progress"],
  course_complete: ["course completion", "course complete"],
  learner_to_creator: ["learner to creator", "learner → creator"],
  new_creator: ["new creator", "creator onboarding"],
  creator_success: ["creator success"],
  platform_reengagement: ["re-engagement", "reengagement"],
  platform_winback: ["win-back", "winback"],
};

export function WorkflowOrchestrationMap() {
  const router = useRouter();
  const adminWorkflows = useQuery(api.emailWorkflows.listAdminWorkflows, {});

  // Match saved workflows to sequence types
  const getWorkflowForSequence = (sequenceId: string) => {
    if (!adminWorkflows) return null;
    const patterns = sequenceNamePatterns[sequenceId] || [];
    return adminWorkflows.find((workflow: any) => {
      const name = workflow.name?.toLowerCase() || "";
      return patterns.some(pattern => name.includes(pattern));
    });
  };

  // Build workflow status map
  const workflowStatus = Object.keys(workflowConnections).map(id => {
    const saved = getWorkflowForSequence(id);
    const emailNodes = saved?.nodes?.filter((n: any) => n.type === "email") || [];
    return {
      id,
      name: workflowDisplayNames[id] || id,
      isActive: saved?.isActive || false,
      isConfigured: !!saved,
      emailCount: emailNodes.length,
      enrolledCount: saved?.enrolledCount || 0,
      triggerLabel: workflowConnections[id].triggers,
      leadsTo: workflowConnections[id].leadsTo,
      workflowId: saved?._id,
    };
  });

  const handleWorkflowClick = (sequenceId: string) => {
    const existing = getWorkflowForSequence(sequenceId);
    if (existing) {
      router.push(`/admin/emails/workflows?id=${existing._id}`);
    } else {
      router.push(`/admin/emails/workflows?sequence=${sequenceId}`);
    }
  };

  // Main journey workflows
  const mainJourney = ["welcome", "new_learner", "course_complete", "learner_to_creator", "new_creator", "creator_success"];
  // Branch workflows
  const branchWorkflows = ["course_progress"];
  // Recovery workflows
  const recoveryWorkflows = ["platform_reengagement", "platform_winback"];

  const configuredCount = workflowStatus.filter(w => w.isConfigured).length;
  const activeCount = workflowStatus.filter(w => w.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-purple-600" />
            Workflow Orchestration Map
          </h2>
          <p className="text-sm text-muted-foreground">
            Visual overview of how all email automations connect and flow into each other
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-600" />
            {configuredCount}/{workflowStatus.length} Configured
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Play className="h-3 w-3 text-blue-600" />
            {activeCount} Active
          </Badge>
        </div>
      </div>

      {/* Legend */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="font-medium">Legend:</span>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span>Active</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-amber-500" />
              <span>Configured (Paused)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-gray-300" />
              <span>Not Configured</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ArrowRight className="h-3 w-3 text-purple-500" />
              <span>Triggers Next</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Journey Flow */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-blue-600" />
            Main User Journey
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            {mainJourney.map((id, index) => {
              const workflow = workflowStatus.find(w => w.id === id)!;
              return (
                <div key={id} className="flex items-center gap-2">
                  <WorkflowCard
                    workflow={workflow}
                    onClick={() => handleWorkflowClick(id)}
                  />
                  {index < mainJourney.length - 1 && (
                    <ArrowRight className="h-5 w-5 text-purple-400 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Flow description */}
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Flow:</strong> User signs up → Enrolls in course → Completes course →
              Gets invited to become creator → Creates store → Makes first sale
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Branch Workflows */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-green-600" />
            Engagement Branches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            {branchWorkflows.map(id => {
              const workflow = workflowStatus.find(w => w.id === id)!;
              return (
                <div key={id} className="flex flex-col items-center gap-2">
                  <div className="text-xs text-muted-foreground">Branches from New Learner</div>
                  <ArrowDown className="h-4 w-4 text-green-400" />
                  <WorkflowCard
                    workflow={workflow}
                    onClick={() => handleWorkflowClick(id)}
                  />
                  <ArrowDown className="h-4 w-4 text-green-400" />
                  <div className="text-xs text-muted-foreground">Rejoins at Course Complete</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recovery Workflows */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-orange-600" />
            Recovery Sequences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {recoveryWorkflows.map((id, index) => {
              const workflow = workflowStatus.find(w => w.id === id)!;
              return (
                <div key={id} className="flex items-center gap-2">
                  <WorkflowCard
                    workflow={workflow}
                    onClick={() => handleWorkflowClick(id)}
                  />
                  {index < recoveryWorkflows.length - 1 && (
                    <ArrowRight className="h-5 w-5 text-orange-400 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Flow description */}
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Flow:</strong> User goes inactive for 14 days → Re-engagement sequence →
              If still inactive after 60 days → Win-back sequence (final attempt)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* All Workflows Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            All Workflows Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium">Workflow</th>
                  <th className="text-left py-2 px-3 font-medium">Trigger</th>
                  <th className="text-center py-2 px-3 font-medium">Emails</th>
                  <th className="text-center py-2 px-3 font-medium">Status</th>
                  <th className="text-left py-2 px-3 font-medium">Leads To</th>
                  <th className="text-right py-2 px-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {workflowStatus.map(workflow => (
                  <tr key={workflow.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-2 px-3 font-medium">{workflow.name}</td>
                    <td className="py-2 px-3 text-muted-foreground">{workflow.triggerLabel}</td>
                    <td className="py-2 px-3 text-center">
                      {workflow.isConfigured ? workflow.emailCount : "–"}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {workflow.isConfigured ? (
                        workflow.isActive ? (
                          <Badge variant="default" className="gap-1">
                            <Play className="h-3 w-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <Pause className="h-3 w-3" />
                            Paused
                          </Badge>
                        )
                      ) : (
                        <Badge variant="outline" className="gap-1 text-muted-foreground">
                          <AlertCircle className="h-3 w-3" />
                          Not Set Up
                        </Badge>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      {workflow.leadsTo.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {workflow.leadsTo.map(nextId => (
                            <Badge key={nextId} variant="outline" className="text-xs">
                              {workflowDisplayNames[nextId]}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">End of sequence</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleWorkflowClick(workflow.id)}
                        className="gap-1"
                      >
                        {workflow.isConfigured ? "Edit" : "Set Up"}
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Individual workflow card component
function WorkflowCard({
  workflow,
  onClick,
}: {
  workflow: {
    id: string;
    name: string;
    isActive: boolean;
    isConfigured: boolean;
    emailCount: number;
    triggerLabel: string;
  };
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative cursor-pointer rounded-lg border-2 p-3 transition-all hover:shadow-md min-w-[140px]",
        workflow.isActive
          ? "border-green-500 bg-green-50 dark:bg-green-950/30"
          : workflow.isConfigured
          ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30"
          : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50"
      )}
    >
      {/* Status indicator */}
      <div
        className={cn(
          "absolute -top-1.5 -right-1.5 h-3 w-3 rounded-full border-2 border-white dark:border-gray-900",
          workflow.isActive
            ? "bg-green-500"
            : workflow.isConfigured
            ? "bg-amber-500"
            : "bg-gray-300"
        )}
      />

      <div className="text-sm font-medium truncate">{workflow.name}</div>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Mail className="h-3 w-3" />
          {workflow.isConfigured ? workflow.emailCount : "–"}
        </span>
        {workflow.isConfigured && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            {workflow.isActive ? (
              <Play className="h-3 w-3 text-green-600" />
            ) : (
              <Pause className="h-3 w-3 text-amber-600" />
            )}
          </span>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Node, Edge } from "reactflow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WysiwygEditor } from "@/components/ui/wysiwyg-editor";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Save,
  Trash2,
  AlertTriangle,
  Power,
  Clock,
  Users,
  UserPlus,
  ShoppingCart,
  GraduationCap,
  UserX,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import NodeSidebar from "@/app/dashboard/emails/workflows/components/NodeSidebar";
import WorkflowCanvas from "@/app/dashboard/emails/workflows/components/WorkflowCanvas";

// Admin-specific trigger types
type AdminTriggerType =
  | "all_users"
  | "all_creators"
  | "all_learners"
  | "new_signup"
  | "user_inactivity"
  | "any_purchase"
  | "any_course_complete"
  | "manual";

const adminTriggerOptions: { value: AdminTriggerType; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: "all_users",
    label: "All Platform Users",
    description: "Target every user on the platform",
    icon: <Users className="h-4 w-4" />
  },
  {
    value: "all_creators",
    label: "All Creators",
    description: "Target users who have created a store",
    icon: <UserPlus className="h-4 w-4" />
  },
  {
    value: "all_learners",
    label: "All Learners",
    description: "Target users without a store (learners only)",
    icon: <GraduationCap className="h-4 w-4" />
  },
  {
    value: "new_signup",
    label: "New User Signup",
    description: "Trigger when any new user signs up",
    icon: <UserPlus className="h-4 w-4" />
  },
  {
    value: "user_inactivity",
    label: "User Inactivity",
    description: "Trigger when user hasn't logged in for X days",
    icon: <UserX className="h-4 w-4" />
  },
  {
    value: "any_purchase",
    label: "Any Purchase",
    description: "Trigger on any product purchase (platform-wide)",
    icon: <ShoppingCart className="h-4 w-4" />
  },
  {
    value: "any_course_complete",
    label: "Any Course Completed",
    description: "Trigger when any user completes any course",
    icon: <GraduationCap className="h-4 w-4" />
  },
  {
    value: "manual",
    label: "Manual Enrollment",
    description: "Manually add users to this workflow",
    icon: <Users className="h-4 w-4" />
  },
];

const conditionOptions = [
  { value: "is_creator", label: "Is Creator" },
  { value: "is_learner", label: "Is Learner" },
  { value: "has_purchased", label: "Has Made Purchase" },
  { value: "course_enrolled", label: "Enrolled in Course" },
  { value: "level_reached", label: "Reached Level" },
  { value: "days_since_signup", label: "Days Since Signup" },
  { value: "days_inactive", label: "Days Inactive" },
];

const actionOptions = [
  { value: "send_notification", label: "Send Admin Notification" },
  { value: "add_to_segment", label: "Add to Segment" },
  { value: "mark_as_creator", label: "Mark as Creator" },
  { value: "award_xp", label: "Award XP" },
];

const delayUnits = [
  { value: "minutes", label: "Minutes" },
  { value: "hours", label: "Hours" },
  { value: "days", label: "Days" },
];

type ValidationError = {
  nodeId?: string;
  edgeId?: string;
  message: string;
};

function validateWorkflow(nodes: Node[], edges: Edge[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const nodeTypeById = new Map(nodes.map((n) => [n.id, n.type || ""]));
  const nodesWithIncomingEdge = new Set(edges.map((e) => e.target));
  const nodesWithOutgoingEdge = new Set(edges.map((e) => e.source));

  for (const edge of edges) {
    const isEmailToEmail =
      nodeTypeById.get(edge.source) === "email" && nodeTypeById.get(edge.target) === "email";
    if (isEmailToEmail) {
      errors.push({
        edgeId: edge.id,
        nodeId: edge.target,
        message: "Cannot send two emails back-to-back. Add a delay node between them.",
      });
    }
  }

  for (const node of nodes) {
    const isTrigger = node.type === "trigger";
    const isOrphan = !nodesWithIncomingEdge.has(node.id) && !nodesWithOutgoingEdge.has(node.id);
    if (!isTrigger && isOrphan) {
      errors.push({
        nodeId: node.id,
        message: `Node "${node.type}" is not connected to the workflow.`,
      });
    }
  }

  for (const node of nodes) {
    if (node.type !== "email") continue;
    const mode = node.data?.mode || "custom";
    const missingTemplate = mode === "template" && !node.data?.templateId;
    const missingSubject = mode === "custom" && !node.data?.subject;
    if (missingTemplate) {
      errors.push({
        nodeId: node.id,
        message: "Email node using template mode must have a template selected.",
      });
    }
    if (missingSubject) {
      errors.push({
        nodeId: node.id,
        message: "Email node using custom mode must have a subject.",
      });
    }
  }

  return errors;
}

export default function AdminWorkflowBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workflowId = searchParams.get("id");
  const { user } = useUser();
  const { toast } = useToast();

  const [workflowName, setWorkflowName] = useState("New Admin Workflow");
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [addNodeFn, setAddNodeFn] = useState<((type: string) => void) | null>(null);
  const [isActive, setIsActive] = useState(false);

  // Get existing workflow if editing
  const existingWorkflow = useQuery(
    api.emailWorkflows.getWorkflow,
    workflowId ? { workflowId: workflowId as Id<"emailWorkflows"> } : "skip"
  );

  // Get admin email templates
  const emailTemplates = useQuery(
    api.emailWorkflows.listEmailTemplates,
    { storeId: "admin" }
  );

  const nodeExecutionCounts = useQuery(
    api.emailWorkflows.getNodeExecutionCounts,
    workflowId ? { workflowId: workflowId as Id<"emailWorkflows"> } : "skip"
  );

  // Mutations
  const createAdminWorkflow = useMutation(api.emailWorkflows.createAdminWorkflow);
  const updateWorkflow = useMutation(api.emailWorkflows.updateWorkflow);
  const deleteWorkflow = useMutation(api.emailWorkflows.deleteWorkflow);
  const toggleActive = useMutation(api.emailWorkflows.toggleWorkflowActive);

  useEffect(() => {
    if (existingWorkflow) {
      setWorkflowName(existingWorkflow.name || "New Admin Workflow");
      setIsActive(existingWorkflow.isActive || false);
      if (existingWorkflow.nodes) {
        setNodes(existingWorkflow.nodes);
      }
      if (existingWorkflow.edges) {
        setEdges(existingWorkflow.edges);
      }
    }
  }, [existingWorkflow]);

  const handleNodesChange = useCallback((newNodes: Node[]) => {
    setNodes(newNodes);
  }, []);

  const handleEdgesChange = useCallback((newEdges: Edge[]) => {
    setEdges(newEdges);
  }, []);

  const handleNodeSelect = useCallback((node: Node | null) => {
    setSelectedNode(node);
  }, []);

  const updateNodeData = useCallback(
    (nodeId: string, data: Record<string, unknown>) => {
      setNodes((nds) =>
        nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n))
      );
      if (selectedNode?.id === nodeId) {
        setSelectedNode((prev) => (prev ? { ...prev, data: { ...prev.data, ...data } } : null));
      }
    },
    [selectedNode]
  );

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setSelectedNode(null);
  }, []);

  const handleSave = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "Please sign in to save workflows",
        variant: "destructive",
      });
      return;
    }

    const triggerNode = nodes.find((n) => n.type === "trigger");
    if (!triggerNode) {
      toast({
        title: "Error",
        description: "Workflow must have a trigger node",
        variant: "destructive",
      });
      return;
    }

    const errors = validateWorkflow(nodes, edges);
    if (errors.length > 0) {
      setValidationErrors(errors);
      toast({
        title: "Validation Error",
        description: `${errors.length} issue(s) found. Please fix them before saving.`,
        variant: "destructive",
      });
      return;
    }

    setValidationErrors([]);
    setIsSaving(true);
    try {
      const nodesData = nodes.map((n) => ({
        id: n.id,
        type: n.type as "trigger" | "email" | "delay" | "condition" | "action" | "stop" | "webhook" | "split" | "notify" | "goal",
        position: n.position,
        data: n.data,
      }));

      const edgesData = edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle || undefined,
        targetHandle: e.targetHandle || undefined,
      }));

      const triggerData = {
        type: (triggerNode.data.triggerType || "all_users") as AdminTriggerType,
        config: triggerNode.data,
      };

      if (workflowId) {
        await updateWorkflow({
          workflowId: workflowId as Id<"emailWorkflows">,
          name: workflowName,
          trigger: triggerData,
          nodes: nodesData,
          edges: edgesData,
        });
        toast({ title: "Saved", description: "Workflow updated successfully" });
      } else {
        const newId = await createAdminWorkflow({
          name: workflowName,
          userId: user.id,
          trigger: triggerData,
          nodes: nodesData,
          edges: edgesData,
        });
        toast({ title: "Saved", description: "Workflow created successfully" });
        router.push(`/admin/emails/workflows?id=${newId}`);
      }
    } catch (error) {
      console.error("Save error:", error);
      toast({ title: "Error", description: "Failed to save workflow", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!workflowId) return;
    try {
      await deleteWorkflow({ workflowId: workflowId as Id<"emailWorkflows"> });
      toast({ title: "Deleted", description: "Workflow deleted" });
      router.push("/admin/emails");
    } catch {
      toast({ title: "Error", description: "Failed to delete workflow", variant: "destructive" });
    }
  };

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/emails")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Input
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="max-w-64 border-none bg-transparent text-lg font-semibold focus-visible:ring-0"
          />
          <span className="rounded-md bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
            Admin Workflow
          </span>
        </div>
        <div className="flex items-center gap-2">
          {validationErrors.length > 0 && (
            <div className="flex items-center gap-1.5 rounded-md bg-amber-100 px-2.5 py-1 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              {validationErrors.length} issue{validationErrors.length > 1 ? "s" : ""}
            </div>
          )}
          {workflowId && (
            <>
              <div className="flex items-center gap-2 rounded-md border px-3 py-1.5">
                <Power
                  className={`h-4 w-4 ${isActive ? "text-green-600" : "text-muted-foreground"}`}
                />
                <span className="text-sm">{isActive ? "Active" : "Inactive"}</span>
                <Switch
                  checked={isActive}
                  onCheckedChange={async (checked) => {
                    setIsActive(checked);
                    await toggleActive({
                      workflowId: workflowId as Id<"emailWorkflows">,
                      isActive: checked,
                    });
                    toast({
                      title: checked ? "Workflow Activated" : "Workflow Deactivated",
                      description: checked
                        ? "Users will now receive emails from this workflow"
                        : "Email sending paused",
                    });
                  }}
                />
              </div>
              <Button
                variant="outline"
                onClick={handleDelete}
                className="gap-2 text-red-600"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </>
          )}
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        <NodeSidebar onAddNode={addNodeFn || undefined} />

        <div className="flex-1">
          <WorkflowCanvas
            initialNodes={nodes}
            initialEdges={edges}
            nodeExecutionCounts={nodeExecutionCounts || {}}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onNodeSelect={handleNodeSelect}
            onAddNodeRef={(fn) => setAddNodeFn(() => fn)}
          />
        </div>

        {/* Node configuration dialog */}
        <Dialog open={!!selectedNode} onOpenChange={(open) => !open && setSelectedNode(null)}>
          <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto bg-white dark:bg-black">
            <DialogHeader>
              <DialogTitle className="capitalize">{selectedNode?.type} Settings</DialogTitle>
              <DialogDescription>Configure this node for your admin workflow</DialogDescription>
            </DialogHeader>

            {selectedNode && (
              <div className="mt-6 space-y-4">
                {/* Trigger Node Configuration */}
                {selectedNode.type === "trigger" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Trigger Type</Label>
                      <Select
                        value={selectedNode.data.triggerType || "all_users"}
                        onValueChange={(v) =>
                          updateNodeData(selectedNode.id, {
                            triggerType: v,
                            inactivityDays: undefined,
                          })
                        }
                      >
                        <SelectTrigger className="bg-white dark:bg-black">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-black">
                          {adminTriggerOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              <div className="flex items-center gap-2">
                                {opt.icon}
                                <div>
                                  <div>{opt.label}</div>
                                  <div className="text-xs text-muted-foreground">{opt.description}</div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Inactivity days configuration */}
                    {selectedNode.data.triggerType === "user_inactivity" && (
                      <div className="space-y-2">
                        <Label>Days of Inactivity</Label>
                        <Input
                          type="number"
                          value={selectedNode.data.inactivityDays || 30}
                          onChange={(e) =>
                            updateNodeData(selectedNode.id, {
                              inactivityDays: parseInt(e.target.value) || 30,
                            })
                          }
                          className="bg-white dark:bg-black"
                          min={1}
                        />
                        <p className="text-xs text-muted-foreground">
                          Trigger when user hasn&apos;t logged in for this many days
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Email Node Configuration */}
                {selectedNode.type === "email" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Subject</Label>
                      <Input
                        value={selectedNode.data.subject || ""}
                        onChange={(e) => updateNodeData(selectedNode.id, { subject: e.target.value })}
                        placeholder="Email subject line..."
                        className="bg-white dark:bg-black"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email Body</Label>
                      <WysiwygEditor
                        content={selectedNode.data.body || ""}
                        onChange={(content) => updateNodeData(selectedNode.id, { body: content })}
                        placeholder="Write your email content..."
                        className="min-h-[200px]"
                      />
                    </div>
                    <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
                      <p className="font-medium">Available Variables:</p>
                      <p className="mt-1 text-xs">
                        {"{{firstName}}, {{name}}, {{email}}, {{level}}, {{xp}}, {{coursesEnrolled}}, {{coursesCompleted}}, {{storeName}}, {{memberSince}}"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Delay Node Configuration */}
                {selectedNode.type === "delay" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Duration</Label>
                        <Input
                          type="number"
                          value={selectedNode.data.delayValue || 1}
                          onChange={(e) =>
                            updateNodeData(selectedNode.id, {
                              delayValue: parseInt(e.target.value) || 1,
                            })
                          }
                          className="bg-white dark:bg-black"
                          min={1}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Unit</Label>
                        <Select
                          value={selectedNode.data.delayUnit || "days"}
                          onValueChange={(v) => updateNodeData(selectedNode.id, { delayUnit: v })}
                        >
                          <SelectTrigger className="bg-white dark:bg-black">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-black">
                            {delayUnits.map((unit) => (
                              <SelectItem key={unit.value} value={unit.value}>
                                {unit.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Condition Node Configuration */}
                {selectedNode.type === "condition" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Condition</Label>
                      <Select
                        value={selectedNode.data.conditionType || "is_creator"}
                        onValueChange={(v) => updateNodeData(selectedNode.id, { conditionType: v })}
                      >
                        <SelectTrigger className="bg-white dark:bg-black">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-black">
                          {conditionOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Level threshold for level_reached condition */}
                    {selectedNode.data.conditionType === "level_reached" && (
                      <div className="space-y-2">
                        <Label>Minimum Level</Label>
                        <Input
                          type="number"
                          value={selectedNode.data.levelThreshold || 5}
                          onChange={(e) =>
                            updateNodeData(selectedNode.id, {
                              levelThreshold: parseInt(e.target.value) || 5,
                            })
                          }
                          className="bg-white dark:bg-black"
                          min={1}
                        />
                      </div>
                    )}

                    {/* Days threshold for time-based conditions */}
                    {(selectedNode.data.conditionType === "days_since_signup" ||
                      selectedNode.data.conditionType === "days_inactive") && (
                      <div className="space-y-2">
                        <Label>Days</Label>
                        <Input
                          type="number"
                          value={selectedNode.data.daysThreshold || 7}
                          onChange={(e) =>
                            updateNodeData(selectedNode.id, {
                              daysThreshold: parseInt(e.target.value) || 7,
                            })
                          }
                          className="bg-white dark:bg-black"
                          min={1}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Action Node Configuration */}
                {selectedNode.type === "action" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Action</Label>
                      <Select
                        value={selectedNode.data.actionType || "send_notification"}
                        onValueChange={(v) => updateNodeData(selectedNode.id, { actionType: v })}
                      >
                        <SelectTrigger className="bg-white dark:bg-black">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-black">
                          {actionOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* XP amount for award_xp action */}
                    {selectedNode.data.actionType === "award_xp" && (
                      <div className="space-y-2">
                        <Label>XP Amount</Label>
                        <Input
                          type="number"
                          value={selectedNode.data.xpAmount || 100}
                          onChange={(e) =>
                            updateNodeData(selectedNode.id, {
                              xpAmount: parseInt(e.target.value) || 100,
                            })
                          }
                          className="bg-white dark:bg-black"
                          min={1}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Delete Node Button */}
                <div className="flex justify-end border-t pt-4">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteNode(selectedNode.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Node
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

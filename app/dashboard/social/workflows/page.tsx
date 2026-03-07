"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffectiveUserId } from "@/lib/impersonation-context";
import { Id } from "@/convex/_generated/dataModel";
import { Node, Edge } from "reactflow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Save,
  Trash2,
  Power,
  Plus,
  MessageCircle,
  Bot,
  Zap,
  Clock,
  Search,
  GitBranch,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import DMNodeSidebar from "./components/DMNodeSidebar";
import DMWorkflowCanvas from "./components/DMWorkflowCanvas";
import { defaultNodeData } from "./components/DMWorkflowCanvas";
import { dmWorkflowTemplates, type DMWorkflowTemplate } from "./templates/dm-workflow-templates";

// ─── Types ────────────────────────────────────────────────────────────────────

type DMTriggerType = "comment_keyword" | "dm_received" | "story_reply";

type ValidationError = {
  nodeId?: string;
  edgeId?: string;
  message: string;
};

// ─── Validation ───────────────────────────────────────────────────────────────

function validateDMWorkflow(nodes: Node[], edges: Edge[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const nodesWithIncomingEdge = new Set(edges.map((e) => e.target));
  const nodesWithOutgoingEdge = new Set(edges.map((e) => e.source));

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

  // sendDM nodes should have a message
  for (const node of nodes) {
    if (node.type === "sendDM" && !node.data?.messageText && !node.data?.message) {
      errors.push({
        nodeId: node.id,
        message: "Send DM node must have a message.",
      });
    }
  }

  return errors;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DMWorkflowPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workflowId = searchParams.get("id");
  const templateId = searchParams.get("template");
  const { user } = useUser();
  const effectiveUserId = useEffectiveUserId(user?.id);
  const { toast } = useToast();

  // ─── State ──────────────────────────────────────────────────────────────────
  const [workflowName, setWorkflowName] = useState("New DM Workflow");
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [addNodeFn, setAddNodeFn] = useState<((type: string) => void) | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);

  // ─── Queries ────────────────────────────────────────────────────────────────

  const store = useQuery(
    // @ts-ignore - Convex type instantiation is excessively deep
    api.stores.getUserStore,
    effectiveUserId ? { userId: effectiveUserId } : "skip"
  ) as { _id: Id<"stores">; plan?: string } | null | undefined;

  const storeId = effectiveUserId || "";

  const dmWorkflows = useQuery(
    api.emailWorkflows.listDMWorkflows,
    storeId ? { storeId } : "skip"
  );

  const existingWorkflow = useQuery(
    api.emailWorkflows.getWorkflow,
    workflowId ? { workflowId: workflowId as Id<"emailWorkflows"> } : "skip"
  );

  // Email workflows for the "Enter Email Workflow" node selector
  const emailWorkflows = useQuery(
    api.emailWorkflows.listWorkflows,
    storeId ? { storeId } : "skip"
  );

  // Courses for product selectors
  const userCourses = useQuery(
    api.courses.getCoursesByUser,
    user?.id ? { userId: user.id } : "skip"
  );

  // ─── Mutations ──────────────────────────────────────────────────────────────

  const createWorkflow = useMutation(api.emailWorkflows.createWorkflow);
  const updateWorkflow = useMutation(api.emailWorkflows.updateWorkflow);
  const deleteWorkflow = useMutation(api.emailWorkflows.deleteWorkflow);
  const toggleActive = useMutation(api.emailWorkflows.toggleWorkflowActive);

  // ─── Initialize from existing or template ───────────────────────────────────

  useEffect(() => {
    if (existingWorkflow) {
      setWorkflowName(existingWorkflow.name || "DM Workflow");
      setIsActive(existingWorkflow.isActive || false);
      if (existingWorkflow.nodes) setNodes(existingWorkflow.nodes);
      if (existingWorkflow.edges) setEdges(existingWorkflow.edges);
    }
  }, [existingWorkflow]);

  const [hasInitialized, setHasInitialized] = useState(false);
  useEffect(() => {
    if (!workflowId && !hasInitialized && templateId) {
      const template = dmWorkflowTemplates.find((t) => t.id === templateId);
      if (template) {
        setWorkflowName(template.name);
        setNodes(template.nodes);
        setEdges(template.edges);
      }
      setHasInitialized(true);
    } else if (!workflowId && !hasInitialized && !templateId) {
      // Default: just a trigger node
      setNodes([
        {
          id: "node_0",
          type: "trigger",
          position: { x: 250, y: 50 },
          data: { triggerType: "comment_keyword", description: "When someone comments a keyword", keywords: [] },
        },
      ]);
      setEdges([]);
      setHasInitialized(true);
    }
  }, [workflowId, hasInitialized, templateId]);

  // ─── Callbacks ──────────────────────────────────────────────────────────────

  const handleNodesChange = useCallback((newNodes: Node[]) => setNodes(newNodes), []);
  const handleEdgesChange = useCallback((newEdges: Edge[]) => setEdges(newEdges), []);
  const handleNodeSelect = useCallback((node: Node | null) => setSelectedNode(node), []);

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

  // ─── Save ───────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!storeId || !user?.id) {
      toast({ title: "Error", description: "Please sign in to save workflows", variant: "destructive" });
      return;
    }

    const triggerNode = nodes.find((n) => n.type === "trigger");
    if (!triggerNode) {
      toast({ title: "Error", description: "Workflow must have a trigger node", variant: "destructive" });
      return;
    }

    const errors = validateDMWorkflow(nodes, edges);
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
        type: n.type as "trigger" | "sendDM" | "aiConversation" | "dmCondition" | "captureEmail" | "checkDMPurchase" | "enterEmailWorkflow" | "delay" | "action" | "stop",
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
        type: (triggerNode.data.triggerType || "comment_keyword") as DMTriggerType,
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
        toast({ title: "Saved", description: "DM workflow updated successfully" });
      } else {
        const newId = await createWorkflow({
          name: workflowName,
          storeId,
          userId: user.id,
          trigger: triggerData,
          nodes: nodesData,
          edges: edgesData,
          workflowType: "dm",
        });
        toast({ title: "Saved", description: "DM workflow created successfully" });
        router.push(`/dashboard/social/workflows?mode=create&id=${newId}`);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to save workflow", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!workflowId) return;
    try {
      await deleteWorkflow({ workflowId: workflowId as Id<"emailWorkflows"> });
      toast({ title: "Deleted", description: "DM workflow deleted" });
      router.push("/dashboard/social/workflows?mode=create");
    } catch {
      toast({ title: "Error", description: "Failed to delete workflow", variant: "destructive" });
    }
  };

  // ─── Decide between List View and Editor View ──────────────────────────────

  const isEditorView = workflowId || templateId || searchParams.has("new");

  // ─── List View ──────────────────────────────────────────────────────────────

  if (!isEditorView) {
    const filteredWorkflows = (dmWorkflows || []).filter((w: { name: string }) =>
      w.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="flex min-h-screen flex-col bg-white dark:bg-black">
        <header className="flex items-center justify-between border-b px-4 py-3 md:px-6 md:py-4">
          <div>
            <h1 className="text-lg font-bold md:text-2xl">DM Workflows</h1>
            <p className="text-xs text-muted-foreground md:text-sm">
              Automate Instagram DM conversations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsTemplateDialogOpen(true)}
              className="gap-2"
            >
              <Zap className="h-4 w-4" />
              <span className="hidden md:inline">From Template</span>
            </Button>
            <Button
              onClick={() => router.push("/dashboard/social/workflows?mode=create&new")}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden md:inline">New Workflow</span>
            </Button>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-6">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search workflows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Workflow List */}
          {!dmWorkflows ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-900" />
              ))}
            </div>
          ) : filteredWorkflows.length === 0 ? (
            <EmptyState
              icon={MessageCircle}
              title="No DM Workflows"
              description="Create your first DM workflow to automate Instagram conversations. Use templates to get started quickly."
              action={{
                label: "New Workflow",
                onClick: () => router.push("/dashboard/social/workflows?mode=create&new"),
              }}
            />
          ) : (
            <div className="space-y-3">
              {filteredWorkflows.map((workflow: {
                _id: Id<"emailWorkflows">;
                name: string;
                isActive?: boolean;
                trigger?: { type: string; config?: Record<string, unknown> };
                nodes?: { type: string }[];
                totalExecutions?: number;
                _creationTime: number;
              }) => (
                <div
                  key={workflow._id}
                  onClick={() =>
                    router.push(`/dashboard/social/workflows?mode=create&id=${workflow._id}`)
                  }
                  className="flex cursor-pointer items-center justify-between rounded-lg border bg-white p-4 transition-colors hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                      <MessageCircle className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <div className="font-medium">{workflow.name}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="capitalize">
                          {workflow.trigger?.type?.replace(/_/g, " ") || "No trigger"}
                        </span>
                        <span>·</span>
                        <span>{workflow.nodes?.length || 0} nodes</span>
                        {(workflow.totalExecutions ?? 0) > 0 && (
                          <>
                            <span>·</span>
                            <span>{workflow.totalExecutions} runs</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        workflow.isActive ? "bg-green-500" : "bg-zinc-300 dark:bg-zinc-600"
                      }`}
                    />
                    <span className="text-xs text-muted-foreground">
                      {workflow.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Template Selection Dialog */}
        <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Choose a Template</DialogTitle>
              <DialogDescription>
                Start with a pre-built DM workflow template and customize it to fit your needs.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-4 md:grid-cols-2">
              {dmWorkflowTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    setIsTemplateDialogOpen(false);
                    router.push(
                      `/dashboard/social/workflows?mode=create&new&template=${template.id}`
                    );
                  }}
                  className="flex flex-col gap-2 rounded-lg border p-4 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  <div className="flex items-center gap-2">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${template.iconBg}`}>
                      <template.icon className={`h-4 w-4 ${template.iconColor}`} />
                    </div>
                    <div className="font-medium">{template.name}</div>
                  </div>
                  <p className="text-xs text-muted-foreground">{template.description}</p>
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ─── Editor View ────────────────────────────────────────────────────────────

  // Filter email workflows (exclude DM workflows from the bridge selector)
  const emailWorkflowOptions = (emailWorkflows || []).filter(
    (w: { workflowType?: string }) => w.workflowType !== "dm"
  );

  return (
    <div className="flex h-screen flex-col bg-white dark:bg-black">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-3 py-2 md:px-4 md:py-3">
        <div className="flex items-center gap-2 md:gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/social/workflows?mode=create")}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Input
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="h-8 w-40 border-0 bg-transparent text-sm font-semibold shadow-none focus-visible:ring-0 md:w-64 md:text-base"
          />
        </div>
        <div className="flex items-center gap-1.5 md:gap-2">
          {workflowId && (
            <>
              <div className="flex items-center gap-2 rounded-md border px-2 py-1 md:px-3 md:py-1.5">
                <Power
                  className={`h-3.5 w-3.5 md:h-4 md:w-4 ${isActive ? "text-green-600" : "text-muted-foreground"}`}
                />
                <span className="hidden text-sm md:inline">{isActive ? "Active" : "Inactive"}</span>
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
                        ? "DM workflow is now live"
                        : "DM workflow paused",
                    });
                  }}
                  className="scale-75 md:scale-90"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleDelete}
                className="h-8 w-8 text-red-600 md:h-9 md:w-auto md:gap-2 md:px-3"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden md:inline">Delete</span>
              </Button>
            </>
          )}
          <Button
            size="icon"
            onClick={handleSave}
            disabled={isSaving}
            className="h-8 w-8 md:h-9 md:w-auto md:gap-2 md:px-3"
          >
            <Save className="h-4 w-4" />
            <span className="hidden md:inline">{isSaving ? "Saving..." : "Save"}</span>
          </Button>
        </div>
      </header>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="border-b bg-red-50 px-4 py-2 dark:bg-red-950/20">
          <div className="text-xs text-red-600 dark:text-red-400">
            {validationErrors.map((err, i) => (
              <div key={i}>{err.message}</div>
            ))}
          </div>
        </div>
      )}

      {/* Canvas + Sidebar + Properties */}
      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        {/* Node Sidebar */}
        <DMNodeSidebar onAddNode={addNodeFn || undefined} />

        {/* Canvas */}
        <div className="flex-1">
          <DMWorkflowCanvas
            initialNodes={nodes}
            initialEdges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onNodeSelect={handleNodeSelect}
            onAddNodeRef={(fn) => setAddNodeFn(() => fn)}
          />
        </div>

        {/* Right Panel: Node Properties */}
        {selectedNode && (
          <div className="w-full border-t bg-white p-4 dark:bg-zinc-950 md:w-80 md:overflow-y-auto md:border-l md:border-t-0">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold capitalize">
                {selectedNode.type?.replace(/([A-Z])/g, " $1").trim()} Settings
              </h3>
              <Button variant="ghost" size="sm" onClick={() => deleteNode(selectedNode.id)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>

            {/* Trigger Config */}
            {selectedNode.type === "trigger" && (
              <div className="space-y-4">
                <div>
                  <Label className="text-xs">Trigger Type</Label>
                  <Select
                    value={selectedNode.data.triggerType}
                    onValueChange={(v) => updateNodeData(selectedNode.id, { triggerType: v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comment_keyword">Comment Keyword</SelectItem>
                      <SelectItem value="dm_received">DM Received</SelectItem>
                      <SelectItem value="story_reply">Story Reply</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {selectedNode.data.triggerType === "comment_keyword" && (
                  <div>
                    <Label className="text-xs">Keywords (comma-separated)</Label>
                    <Input
                      className="mt-1"
                      value={(selectedNode.data.keywords || []).join(", ")}
                      onChange={(e) =>
                        updateNodeData(selectedNode.id, {
                          keywords: e.target.value.split(",").map((k: string) => k.trim()).filter(Boolean),
                        })
                      }
                      placeholder="e.g. LINK, SEND, FREE"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Send DM Config */}
            {selectedNode.type === "sendDM" && (
              <div className="space-y-4">
                <div>
                  <Label className="text-xs">Message Text</Label>
                  <Textarea
                    className="mt-1"
                    rows={4}
                    value={selectedNode.data.messageText || ""}
                    onChange={(e) => updateNodeData(selectedNode.id, { messageText: e.target.value })}
                    placeholder="Hey! Here's the link you requested..."
                  />
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Use {"{{keyword}}"} for the trigger keyword and {"{{senderId}}"} for the sender.
                  </p>
                </div>
                <div>
                  <Label className="text-xs">Include Link (optional)</Label>
                  <Input
                    className="mt-1"
                    value={selectedNode.data.includeLink || ""}
                    onChange={(e) => updateNodeData(selectedNode.id, { includeLink: e.target.value })}
                    placeholder="https://yoursite.com/product"
                  />
                </div>
              </div>
            )}

            {/* AI Conversation Config */}
            {selectedNode.type === "aiConversation" && (
              <div className="space-y-4">
                <div>
                  <Label className="text-xs">Conversation Goal</Label>
                  <Textarea
                    className="mt-1"
                    rows={3}
                    value={selectedNode.data.goalDescription || ""}
                    onChange={(e) =>
                      updateNodeData(selectedNode.id, { goalDescription: e.target.value })
                    }
                    placeholder="Help the user and capture their email address"
                  />
                </div>
                <div>
                  <Label className="text-xs">Custom Prompt (optional)</Label>
                  <Textarea
                    className="mt-1"
                    rows={3}
                    value={selectedNode.data.systemPrompt || ""}
                    onChange={(e) =>
                      updateNodeData(selectedNode.id, { systemPrompt: e.target.value })
                    }
                    placeholder="You are a friendly assistant..."
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Wait for Reply</Label>
                  <Switch
                    checked={selectedNode.data.waitForReply !== false}
                    onCheckedChange={(checked) =>
                      updateNodeData(selectedNode.id, { waitForReply: checked })
                    }
                  />
                </div>
              </div>
            )}

            {/* DM Condition Config */}
            {selectedNode.type === "dmCondition" && (
              <div className="space-y-4">
                <div>
                  <Label className="text-xs">Condition Type</Label>
                  <Select
                    value={selectedNode.data.conditionType || "replied"}
                    onValueChange={(v) =>
                      updateNodeData(selectedNode.id, { conditionType: v })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="replied">User Replied</SelectItem>
                      <SelectItem value="contains_email">Contains Email</SelectItem>
                      <SelectItem value="contains_keyword">Contains Keyword</SelectItem>
                      <SelectItem value="purchased">Has Purchased</SelectItem>
                      <SelectItem value="timeout">Timed Out</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {selectedNode.data.conditionType === "contains_keyword" && (
                  <div>
                    <Label className="text-xs">Keywords (comma-separated)</Label>
                    <Input
                      className="mt-1"
                      value={(selectedNode.data.keywords || []).join(", ")}
                      onChange={(e) =>
                        updateNodeData(selectedNode.id, {
                          keywords: e.target.value.split(",").map((k: string) => k.trim()).filter(Boolean),
                        })
                      }
                      placeholder="e.g. yes, interested, buy"
                    />
                  </div>
                )}
                {selectedNode.data.conditionType === "purchased" && userCourses && (
                  <div>
                    <Label className="text-xs">Course/Product</Label>
                    <Select
                      value={selectedNode.data.courseId || ""}
                      onValueChange={(v) =>
                        updateNodeData(selectedNode.id, { courseId: v })
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {userCourses.map((course: { _id: string; title: string }) => (
                          <SelectItem key={course._id} value={course._id}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {/* Capture Email Config */}
            {selectedNode.type === "captureEmail" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Retry if no email found</Label>
                  <Switch
                    checked={selectedNode.data.retryOnFail === true}
                    onCheckedChange={(checked) =>
                      updateNodeData(selectedNode.id, { retryOnFail: checked })
                    }
                  />
                </div>
                {selectedNode.data.retryOnFail && (
                  <div>
                    <Label className="text-xs">Retry Message</Label>
                    <Textarea
                      className="mt-1"
                      rows={3}
                      value={selectedNode.data.retryMessage || ""}
                      onChange={(e) =>
                        updateNodeData(selectedNode.id, { retryMessage: e.target.value })
                      }
                      placeholder="I didn't catch that — could you drop your email so I can send it over?"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Check DM Purchase Config */}
            {selectedNode.type === "checkDMPurchase" && (
              <div className="space-y-4">
                {userCourses && (
                  <div>
                    <Label className="text-xs">Course/Product</Label>
                    <Select
                      value={selectedNode.data.courseId || ""}
                      onValueChange={(v) => {
                        const course = userCourses.find((c: { _id: string }) => c._id === v);
                        updateNodeData(selectedNode.id, {
                          courseId: v,
                          courseName: course?.title || "",
                        });
                      }}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {userCourses.map((course: { _id: string; title: string }) => (
                          <SelectItem key={course._id} value={course._id}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {/* Enter Email Workflow Config */}
            {selectedNode.type === "enterEmailWorkflow" && (
              <div className="space-y-4">
                <div>
                  <Label className="text-xs">Target Email Workflow</Label>
                  <Select
                    value={selectedNode.data.targetWorkflowId || ""}
                    onValueChange={(v) => {
                      const wf = emailWorkflowOptions.find((w: { _id: string }) => w._id === v);
                      updateNodeData(selectedNode.id, {
                        targetWorkflowId: v,
                        targetWorkflowName: wf?.name || "",
                      });
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select email workflow" />
                    </SelectTrigger>
                    <SelectContent>
                      {emailWorkflowOptions.map((wf: { _id: string; name: string }) => (
                        <SelectItem key={wf._id} value={wf._id}>
                          {wf.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Tags (comma-separated)</Label>
                  <Input
                    className="mt-1"
                    value={(selectedNode.data.tags || []).join(", ")}
                    onChange={(e) =>
                      updateNodeData(selectedNode.id, {
                        tags: e.target.value.split(",").map((t: string) => t.trim()).filter(Boolean),
                      })
                    }
                    placeholder="dm-lead, instagram-lead"
                  />
                </div>
              </div>
            )}

            {/* Delay Config */}
            {selectedNode.type === "delay" && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label className="text-xs">Duration</Label>
                    <Input
                      type="number"
                      className="mt-1"
                      min={1}
                      value={selectedNode.data.delayValue || 1}
                      onChange={(e) =>
                        updateNodeData(selectedNode.id, { delayValue: parseInt(e.target.value) || 1 })
                      }
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs">Unit</Label>
                    <Select
                      value={selectedNode.data.delayUnit || "hours"}
                      onValueChange={(v) => updateNodeData(selectedNode.id, { delayUnit: v })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minutes">Minutes</SelectItem>
                        <SelectItem value="hours">Hours</SelectItem>
                        <SelectItem value="days">Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Action Config */}
            {selectedNode.type === "action" && (
              <div className="space-y-4">
                <div>
                  <Label className="text-xs">Action Type</Label>
                  <Select
                    value={selectedNode.data.actionType || "add_tag"}
                    onValueChange={(v) => updateNodeData(selectedNode.id, { actionType: v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="add_tag">Add Tag</SelectItem>
                      <SelectItem value="remove_tag">Remove Tag</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Tag Value</Label>
                  <Input
                    className="mt-1"
                    value={selectedNode.data.value || ""}
                    onChange={(e) => updateNodeData(selectedNode.id, { value: e.target.value })}
                    placeholder="e.g. dm-engaged"
                  />
                </div>
              </div>
            )}

            {/* Stop - no config needed */}
            {selectedNode.type === "stop" && (
              <p className="text-xs text-muted-foreground">
                This node ends the workflow. No configuration needed.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

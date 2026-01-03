"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Node, Edge } from "reactflow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Trash2, AlertTriangle } from "lucide-react";
import NodeSidebar from "./components/NodeSidebar";
import WorkflowCanvas from "./components/WorkflowCanvas";

type TriggerType =
  | "lead_signup"
  | "product_purchase"
  | "time_delay"
  | "date_time"
  | "customer_action";

const triggerOptions: { value: TriggerType; label: string }[] = [
  { value: "lead_signup", label: "Lead Signs Up" },
  { value: "product_purchase", label: "Product Purchased" },
  { value: "time_delay", label: "Time Delay" },
  { value: "date_time", label: "Specific Date/Time" },
  { value: "customer_action", label: "Customer Action" },
];

const conditionOptions = [
  { value: "opened_email", label: "Opened Email" },
  { value: "clicked_link", label: "Clicked Link" },
  { value: "has_tag", label: "Has Tag" },
  { value: "time_based", label: "Time Based" },
];

const actionOptions = [
  { value: "add_tag", label: "Add Tag" },
  { value: "remove_tag", label: "Remove Tag" },
  { value: "add_to_list", label: "Add to List" },
  { value: "notify", label: "Send Notification" },
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

export default function WorkflowBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workflowId = searchParams.get("id");
  const { user } = useUser();
  const { toast } = useToast();

  const [workflowName, setWorkflowName] = useState("New Workflow");
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const storeId = user?.id ?? "";

  const emailTemplates = useQuery(
    api.emailWorkflows.listEmailTemplates,
    storeId ? { storeId } : "skip"
  );

  const existingWorkflow = useQuery(
    api.emailWorkflows.getWorkflow,
    workflowId ? { workflowId: workflowId as Id<"emailWorkflows"> } : "skip"
  );

  const createWorkflow = useMutation(api.emailWorkflows.createWorkflow);
  const updateWorkflow = useMutation(api.emailWorkflows.updateWorkflow);
  const deleteWorkflow = useMutation(api.emailWorkflows.deleteWorkflow);

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
    if (!storeId || !user?.id) {
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
      const workflowData = {
        name: workflowName,
        storeId,
        userId: user.id,
        trigger: {
          type: (triggerNode.data.triggerType || "lead_signup") as TriggerType,
          config: triggerNode.data,
        },
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.type as "trigger" | "email" | "delay" | "condition" | "action",
          position: n.position,
          data: n.data,
        })),
        edges: edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle || undefined,
          targetHandle: e.targetHandle || undefined,
        })),
      };

      if (workflowId) {
        await updateWorkflow({
          workflowId: workflowId as Id<"emailWorkflows">,
          ...workflowData,
        });
        toast({ title: "Saved", description: "Workflow updated successfully" });
      } else {
        const newId = await createWorkflow(workflowData);
        toast({ title: "Saved", description: "Workflow created successfully" });
        router.push(`/dashboard/emails/workflows?mode=create&id=${newId}`);
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
      toast({ title: "Deleted", description: "Workflow deleted" });
      router.push("/dashboard/emails?mode=create");
    } catch {
      toast({ title: "Error", description: "Failed to delete workflow", variant: "destructive" });
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-2 py-2 dark:border-zinc-800 dark:bg-zinc-950 md:px-4 md:py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => router.push("/dashboard/emails?mode=create")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Input
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="min-w-0 flex-1 border-none bg-transparent text-base font-semibold focus-visible:ring-0 md:max-w-64 md:text-lg"
          />
        </div>
        <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
          {validationErrors.length > 0 && (
            <div className="flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-1 text-xs text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 md:gap-1.5 md:px-2.5 md:text-sm">
              <AlertTriangle className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden sm:inline">
                {validationErrors.length} issue{validationErrors.length > 1 ? "s" : ""}
              </span>
              <span className="sm:hidden">{validationErrors.length}</span>
            </div>
          )}
          {workflowId && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleDelete}
              className="h-8 w-8 text-red-600 md:h-9 md:w-auto md:gap-2 md:px-3"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden md:inline">Delete</span>
            </Button>
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

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
        <NodeSidebar />

        <div className="min-h-0 flex-1">
          <WorkflowCanvas
            initialNodes={existingWorkflow?.nodes || []}
            initialEdges={existingWorkflow?.edges || []}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onNodeSelect={handleNodeSelect}
          />
        </div>

        <Sheet open={!!selectedNode} onOpenChange={(open) => !open && setSelectedNode(null)}>
          <SheetContent className="w-full bg-white dark:bg-black sm:w-80">
            <SheetHeader>
              <SheetTitle className="capitalize">{selectedNode?.type} Settings</SheetTitle>
              <SheetDescription>Configure this node</SheetDescription>
            </SheetHeader>

            {selectedNode && (
              <div className="mt-6 space-y-4">
                {selectedNode.type === "trigger" && (
                  <div className="space-y-2">
                    <Label>Trigger Type</Label>
                    <Select
                      value={selectedNode.data.triggerType || "lead_signup"}
                      onValueChange={(v) => updateNodeData(selectedNode.id, { triggerType: v })}
                    >
                      <SelectTrigger className="bg-white dark:bg-black">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-black">
                        {triggerOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {selectedNode.type === "email" && (
                  <>
                    <div className="space-y-2">
                      <Label>Email Source</Label>
                      <Tabs
                        value={selectedNode.data.mode || "custom"}
                        onValueChange={(v) =>
                          updateNodeData(selectedNode.id, { mode: v as "template" | "custom" })
                        }
                        className="w-full"
                      >
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="template">Use Template</TabsTrigger>
                          <TabsTrigger value="custom">Custom Email</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>

                    {(selectedNode.data.mode || "custom") === "template" ? (
                      <div className="space-y-2">
                        <Label>Select Template</Label>
                        <Select
                          value={selectedNode.data.templateId || ""}
                          onValueChange={(v) => {
                            const template = emailTemplates?.find((t) => t._id === v);
                            updateNodeData(selectedNode.id, {
                              templateId: v,
                              templateName: template?.name,
                              subject: template?.subject,
                            });
                          }}
                        >
                          <SelectTrigger className="bg-white dark:bg-black">
                            <SelectValue placeholder="Choose a template..." />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-black">
                            {emailTemplates && emailTemplates.length > 0 ? (
                              emailTemplates.map((template) => (
                                <SelectItem key={template._id} value={template._id}>
                                  {template.name}
                                  {template.category && (
                                    <span className="ml-2 text-xs text-zinc-500">
                                      ({template.category})
                                    </span>
                                  )}
                                </SelectItem>
                              ))
                            ) : (
                              <div className="px-2 py-1.5 text-sm text-zinc-500">
                                No templates found
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                        {selectedNode.data.templateId && selectedNode.data.subject && (
                          <div className="rounded-md border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-800 dark:bg-zinc-900">
                            <p className="text-xs text-zinc-500">Subject:</p>
                            <p className="text-sm">{selectedNode.data.subject}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label>Subject *</Label>
                          <Input
                            value={selectedNode.data.subject || ""}
                            onChange={(e) =>
                              updateNodeData(selectedNode.id, { subject: e.target.value })
                            }
                            placeholder="Email subject line"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Preview Text</Label>
                          <Input
                            value={selectedNode.data.previewText || ""}
                            onChange={(e) =>
                              updateNodeData(selectedNode.id, { previewText: e.target.value })
                            }
                            placeholder="Shows in inbox preview"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Email Body</Label>
                          <Textarea
                            value={selectedNode.data.body || ""}
                            onChange={(e) =>
                              updateNodeData(selectedNode.id, { body: e.target.value })
                            }
                            placeholder="Write your email content here..."
                            className="min-h-[120px]"
                          />
                        </div>
                      </>
                    )}

                    {validationErrors.some((e) => e.nodeId === selectedNode.id) && (
                      <div className="rounded-md border border-red-200 bg-red-50 p-2 dark:border-red-900 dark:bg-red-900/20">
                        {validationErrors
                          .filter((e) => e.nodeId === selectedNode.id)
                          .map((e, i) => (
                            <p key={i} className="text-sm text-red-600 dark:text-red-400">
                              {e.message}
                            </p>
                          ))}
                      </div>
                    )}
                  </>
                )}

                {selectedNode.type === "delay" && (
                  <div className="flex gap-2">
                    <div className="flex-1 space-y-2">
                      <Label>Duration</Label>
                      <Input
                        type="number"
                        min="1"
                        value={selectedNode.data.delayValue || 1}
                        onChange={(e) =>
                          updateNodeData(selectedNode.id, {
                            delayValue: parseInt(e.target.value) || 1,
                          })
                        }
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label>Unit</Label>
                      <Select
                        value={selectedNode.data.delayUnit || "hours"}
                        onValueChange={(v) => updateNodeData(selectedNode.id, { delayUnit: v })}
                      >
                        <SelectTrigger className="bg-white dark:bg-black">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-black">
                          {delayUnits.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {selectedNode.type === "condition" && (
                  <div className="space-y-2">
                    <Label>Condition Type</Label>
                    <Select
                      value={selectedNode.data.conditionType || "opened_email"}
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
                )}

                {selectedNode.type === "action" && (
                  <>
                    <div className="space-y-2">
                      <Label>Action Type</Label>
                      <Select
                        value={selectedNode.data.actionType || "add_tag"}
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
                    <div className="space-y-2">
                      <Label>Value</Label>
                      <Input
                        value={selectedNode.data.value || ""}
                        onChange={(e) => updateNodeData(selectedNode.id, { value: e.target.value })}
                        placeholder="Tag name, list name, etc."
                      />
                    </div>
                  </>
                )}

                <div className="pt-4">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteNode(selectedNode.id)}
                    className="w-full gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Node
                  </Button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}

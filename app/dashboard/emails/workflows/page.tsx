"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Node, Edge } from "reactflow";
import { useFeatureAccess } from "@/hooks/use-feature-access";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { WysiwygEditor } from "@/components/ui/wysiwyg-editor";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Save,
  Trash2,
  AlertTriangle,
  Check,
  UserPlus,
  Search,
  Power,
  Users,
  Clock,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import NodeSidebar from "./components/NodeSidebar";
import WorkflowCanvas from "./components/WorkflowCanvas";

// Component to show contacts waiting at a node
function ContactsAtNodeList({
  workflowId,
  nodeId,
}: {
  workflowId: Id<"emailWorkflows">;
  nodeId: string;
}) {
  const contacts = useQuery(
    api.emailWorkflows.getContactsAtNode,
    workflowId ? { workflowId, nodeId } : "skip"
  );
  const cancelExecution = useMutation(api.emailWorkflows.cancelExecution);
  const { toast } = useToast();

  const handleRemove = async (executionId: Id<"workflowExecutions">, email: string) => {
    try {
      await cancelExecution({ executionId });
      toast({
        title: "Contact removed",
        description: `${email} has been removed from this automation.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove contact from automation.",
        variant: "destructive",
      });
    }
  };

  if (!contacts || contacts.length === 0) {
    return <p className="text-xs text-muted-foreground">No contacts waiting</p>;
  }

  return (
    <div className="max-h-[150px] space-y-1 overflow-y-auto">
      {contacts.map((contact) => (
        <div
          key={contact.executionId}
          className="flex items-center justify-between rounded bg-white px-2 py-1 text-xs dark:bg-zinc-800"
        >
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium">{contact.name || contact.email}</div>
            {contact.name && (
              <div className="truncate text-muted-foreground">{contact.email}</div>
            )}
          </div>
          <div className="ml-2 flex items-center gap-2">
            {contact.scheduledFor && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>
                  {new Date(contact.scheduledFor).toLocaleDateString()}{" "}
                  {new Date(contact.scheduledFor).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            )}
            <button
              onClick={() => handleRemove(contact.executionId, contact.email)}
              className="rounded p-1 text-red-500 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/30"
              title="Remove from automation"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

type TriggerType =
  | "lead_signup"
  | "product_purchase"
  | "tag_added"
  | "manual"
  | "time_delay"
  | "date_time"
  | "customer_action";

const triggerOptions: { value: TriggerType; label: string }[] = [
  { value: "lead_signup", label: "Lead Signs Up" },
  { value: "product_purchase", label: "Product Purchased" },
  { value: "tag_added", label: "Tag Added to Contact" },
  { value: "manual", label: "Manual Enrollment" },
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
  const [addNodeFn, setAddNodeFn] = useState<((type: string) => void) | null>(null);
  const [isAddContactsOpen, setIsAddContactsOpen] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [contactSearchQuery, setContactSearchQuery] = useState("");
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [isEmailEditorOpen, setIsEmailEditorOpen] = useState(false);

  // Get user's store
  const store = useQuery(
    // @ts-ignore - Convex type instantiation is excessively deep
    api.stores.getUserStore,
    user?.id ? { userId: user.id } : "skip"
  ) as { _id: Id<"stores">; plan?: string } | null | undefined;
  // Use Clerk user ID for storeId since that's what emailContacts uses
  const storeId = user?.id || "";

  // Check if user has access to automations feature
  const { hasAccess, isLoading: featureLoading, UpgradePromptComponent } = useFeatureAccess(
    store?._id,
    "automations"
  );

  const emailTemplates = useQuery(
    api.emailWorkflows.listEmailTemplates,
    storeId ? { storeId } : "skip"
  );

  const existingWorkflow = useQuery(
    api.emailWorkflows.getWorkflow,
    workflowId ? { workflowId: workflowId as Id<"emailWorkflows"> } : "skip"
  );

  const contacts = useQuery(api.emailContacts.listContacts, storeId ? { storeId } : "skip");

  const nodeExecutionCounts = useQuery(
    api.emailWorkflows.getNodeExecutionCounts,
    workflowId ? { workflowId: workflowId as Id<"emailWorkflows"> } : "skip"
  );

  const createWorkflow = useMutation(api.emailWorkflows.createWorkflow);
  const updateWorkflow = useMutation(api.emailWorkflows.updateWorkflow);
  const deleteWorkflow = useMutation(api.emailWorkflows.deleteWorkflow);
  const bulkEnrollContacts = useMutation(api.emailWorkflows.bulkEnrollContactsInWorkflow);
  const toggleActive = useMutation(api.emailWorkflows.toggleWorkflowActive);
  const createEmailTemplate = useMutation(api.emailWorkflows.createEmailTemplate);

  useEffect(() => {
    if (existingWorkflow) {
      setWorkflowName(existingWorkflow.name || "New Workflow");
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
      const nodesData = nodes.map((n) => ({
        id: n.id,
        type: n.type as "trigger" | "email" | "delay" | "condition" | "action",
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
        type: (triggerNode.data.triggerType || "lead_signup") as TriggerType,
        config: triggerNode.data,
      };

      if (workflowId) {
        // Update existing workflow - don't pass storeId/userId
        await updateWorkflow({
          workflowId: workflowId as Id<"emailWorkflows">,
          name: workflowName,
          trigger: triggerData,
          nodes: nodesData,
          edges: edgesData,
        });
        toast({ title: "Saved", description: "Workflow updated successfully" });
      } else {
        // Create new workflow - include storeId/userId
        const newId = await createWorkflow({
          name: workflowName,
          storeId,
          userId: user.id,
          trigger: triggerData,
          nodes: nodesData,
          edges: edgesData,
        });
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

  const handleSaveAsTemplate = async () => {
    if (!selectedNode || !storeId) return;
    if (!templateName.trim()) {
      toast({ title: "Error", description: "Template name is required", variant: "destructive" });
      return;
    }
    if (!selectedNode.data.subject) {
      toast({ title: "Error", description: "Email subject is required", variant: "destructive" });
      return;
    }

    setIsSavingTemplate(true);
    try {
      await createEmailTemplate({
        storeId,
        name: templateName.trim(),
        subject: selectedNode.data.subject,
        content: selectedNode.data.body || "",
        category: "workflow",
      });
      toast({ title: "Template Saved", description: "Email saved as template for reuse" });
      setTemplateName("");
    } catch {
      toast({ title: "Error", description: "Failed to save template", variant: "destructive" });
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const filteredContacts = useMemo(() => {
    if (!contacts) return [];
    if (!contactSearchQuery) return contacts;
    const query = contactSearchQuery.toLowerCase();
    return contacts.filter(
      (c: any) =>
        c.email?.toLowerCase().includes(query) ||
        c.firstName?.toLowerCase().includes(query) ||
        c.lastName?.toLowerCase().includes(query)
    );
  }, [contacts, contactSearchQuery]);

  const toggleContactSelection = useCallback((contactId: string) => {
    setSelectedContacts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(contactId)) {
        newSet.delete(contactId);
      } else {
        newSet.add(contactId);
      }
      return newSet;
    });
  }, []);

  const toggleAllContacts = useCallback(() => {
    if (selectedContacts.size === filteredContacts.length && filteredContacts.length > 0) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(filteredContacts.map((c: any) => c._id)));
    }
  }, [filteredContacts, selectedContacts.size]);

  const handleBulkEnroll = async () => {
    if (!workflowId || selectedContacts.size === 0) return;
    setIsEnrolling(true);
    try {
      const result = await bulkEnrollContacts({
        workflowId: workflowId as Id<"emailWorkflows">,
        contactIds: Array.from(selectedContacts) as any[],
      });
      toast({
        title: "Contacts Enrolled",
        description: `Enrolled ${result.enrolled} contact${result.enrolled !== 1 ? "s" : ""}, skipped ${result.skipped} (already enrolled)`,
      });
      setSelectedContacts(new Set());
      setIsAddContactsOpen(false);
    } catch {
      toast({ title: "Error", description: "Failed to enroll contacts", variant: "destructive" });
    } finally {
      setIsEnrolling(false);
    }
  };

  // Show loading state while checking feature access
  if (featureLoading || store === undefined) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show upgrade prompt if user doesn't have access to automations
  if (!hasAccess) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-8">
        <div className="max-w-md text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold">Email Automations</h1>
          <p className="text-muted-foreground">
            Email automation workflows are a Creator Pro feature. Upgrade your plan to create automated email sequences that nurture your leads and customers.
          </p>
          <div className="space-y-3">
            <Button
              className="w-full"
              onClick={() => router.push("/dashboard/settings?tab=billing")}
            >
              Upgrade to Creator Pro
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/dashboard/emails")}
            >
              Back to Emails
            </Button>
          </div>
        </div>
        <UpgradePromptComponent />
      </div>
    );
  }

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
                        ? "Enrolled contacts will now receive emails"
                        : "Email sending paused",
                    });
                  }}
                  className="scale-75 md:scale-90"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsAddContactsOpen(true)}
                className="h-8 w-8 md:h-9 md:w-auto md:gap-2 md:px-3"
              >
                <UserPlus className="h-4 w-4" />
                <span className="hidden md:inline">Add Contacts</span>
              </Button>
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

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
        <NodeSidebar onAddNode={addNodeFn || undefined} />

        <div className="min-h-0 flex-1">
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

        <Dialog open={!!selectedNode} onOpenChange={(open) => !open && setSelectedNode(null)}>
          <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto bg-white dark:bg-black">
            <DialogHeader>
              <DialogTitle className="capitalize">{selectedNode?.type} Settings</DialogTitle>
              <DialogDescription>Configure this node</DialogDescription>
            </DialogHeader>

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
                    {/* Email Preview */}
                    <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                      {selectedNode.data.subject ? (
                        <>
                          <p className="text-xs text-zinc-500">Subject:</p>
                          <p className="text-sm font-medium">{selectedNode.data.subject}</p>
                          {selectedNode.data.templateName && (
                            <p className="mt-1 text-xs text-zinc-500">
                              Template: {selectedNode.data.templateName}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-zinc-500">No email configured</p>
                      )}
                    </div>

                    <Button
                      className="w-full"
                      onClick={() => setIsEmailEditorOpen(true)}
                    >
                      {selectedNode.data.subject ? "Edit Email" : "Configure Email"}
                    </Button>

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
                  <div className="space-y-4">
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

                    {/* Contacts waiting at this delay */}
                    {selectedNode.data.waitingCount > 0 && (
                      <div className="rounded-md border bg-orange-50 p-3 dark:bg-orange-900/20">
                        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-orange-700 dark:text-orange-300">
                          <Users className="h-4 w-4" />
                          {selectedNode.data.waitingCount} contact{selectedNode.data.waitingCount !== 1 ? "s" : ""} waiting
                        </div>
                        <ContactsAtNodeList
                          workflowId={workflowId as Id<"emailWorkflows">}
                          nodeId={selectedNode.id}
                        />
                      </div>
                    )}
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

                {selectedNode.type === "webhook" && (
                  <div className="space-y-2">
                    <Label>Webhook URL</Label>
                    <Input
                      value={selectedNode.data.webhookUrl || ""}
                      onChange={(e) =>
                        updateNodeData(selectedNode.id, { webhookUrl: e.target.value })
                      }
                      placeholder="https://hooks.zapier.com/..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Sends contact data to this URL via POST request
                    </p>
                  </div>
                )}

                {selectedNode.type === "split" && (
                  <div className="space-y-2">
                    <Label>Split Percentage (Path A)</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        type="number"
                        min="1"
                        max="99"
                        value={selectedNode.data.splitPercentage || 50}
                        onChange={(e) =>
                          updateNodeData(selectedNode.id, {
                            splitPercentage: Math.min(
                              99,
                              Math.max(1, parseInt(e.target.value) || 50)
                            ),
                          })
                        }
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">
                        Path A: {selectedNode.data.splitPercentage || 50}% / Path B:{" "}
                        {100 - (selectedNode.data.splitPercentage || 50)}%
                      </span>
                    </div>
                  </div>
                )}

                {selectedNode.type === "notify" && (
                  <>
                    <div className="space-y-2">
                      <Label>Notification Method</Label>
                      <Select
                        value={selectedNode.data.notifyMethod || "email"}
                        onValueChange={(v) => updateNodeData(selectedNode.id, { notifyMethod: v })}
                      >
                        <SelectTrigger className="bg-white dark:bg-black">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-black">
                          <SelectItem value="email">Email Store Owner</SelectItem>
                          <SelectItem value="slack">Slack (coming soon)</SelectItem>
                          <SelectItem value="discord">Discord (coming soon)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Message</Label>
                      <Input
                        value={selectedNode.data.message || ""}
                        onChange={(e) =>
                          updateNodeData(selectedNode.id, { message: e.target.value })
                        }
                        placeholder="New lead reached this step!"
                      />
                    </div>
                  </>
                )}

                {selectedNode.type === "goal" && (
                  <div className="space-y-2">
                    <Label>Goal Type</Label>
                    <Select
                      value={selectedNode.data.goalType || "purchase"}
                      onValueChange={(v) => updateNodeData(selectedNode.id, { goalType: v })}
                    >
                      <SelectTrigger className="bg-white dark:bg-black">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-black">
                        <SelectItem value="purchase">Made Purchase</SelectItem>
                        <SelectItem value="clicked">Clicked Link</SelectItem>
                        <SelectItem value="opened">Opened Email</SelectItem>
                        <SelectItem value="replied">Replied to Email</SelectItem>
                        <SelectItem value="custom">Custom Goal</SelectItem>
                      </SelectContent>
                    </Select>
                    {selectedNode.data.goalType === "custom" && (
                      <Input
                        value={selectedNode.data.customGoal || ""}
                        onChange={(e) =>
                          updateNodeData(selectedNode.id, { customGoal: e.target.value })
                        }
                        placeholder="Describe your goal..."
                        className="mt-2"
                      />
                    )}
                    <p className="text-xs text-muted-foreground">
                      Goal nodes mark this path complete when reached
                    </p>
                  </div>
                )}

                {selectedNode.type === "stop" && (
                  <p className="text-sm text-muted-foreground">
                    This node ends the workflow. No further actions will be taken for contacts that
                    reach this point.
                  </p>
                )}

                <DialogFooter className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteNode(selectedNode.id)}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Node
                  </Button>
                  <Button size="sm" onClick={() => setSelectedNode(null)} className="gap-2">
                    <Check className="h-4 w-4" />
                    Done
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={isAddContactsOpen} onOpenChange={setIsAddContactsOpen}>
          <DialogContent className="max-h-[80vh] max-w-lg bg-white dark:bg-black">
            <DialogHeader>
              <DialogTitle>Add Contacts to Workflow</DialogTitle>
              <DialogDescription>
                Select contacts to enroll in this automation workflow
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search contacts..."
                  className="pl-10"
                  value={contactSearchQuery}
                  onChange={(e) => setContactSearchQuery(e.target.value)}
                />
              </div>

              {selectedContacts.size > 0 && (
                <div className="flex items-center justify-between rounded-md bg-primary/10 px-3 py-2">
                  <span className="text-sm font-medium">
                    {selectedContacts.size} contact{selectedContacts.size !== 1 ? "s" : ""} selected
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedContacts(new Set())}>
                    Clear
                  </Button>
                </div>
              )}

              <div className="max-h-[300px] overflow-y-auto rounded-md border">
                {filteredContacts.length > 0 && (
                  <div
                    className="flex cursor-pointer items-center gap-3 border-b bg-muted/50 px-3 py-2"
                    onClick={toggleAllContacts}
                  >
                    <Checkbox
                      checked={
                        filteredContacts.length > 0 &&
                        selectedContacts.size === filteredContacts.length
                      }
                      onCheckedChange={toggleAllContacts}
                    />
                    <span className="text-sm font-medium">Select All</span>
                  </div>
                )}
                {filteredContacts.length === 0 ? (
                  <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                    {contacts === undefined ? "Loading contacts..." : "No contacts found"}
                  </div>
                ) : (
                  filteredContacts.slice(0, 100).map((contact: any) => (
                    <div
                      key={contact._id}
                      className="flex cursor-pointer items-center gap-3 border-b px-3 py-2 last:border-b-0 hover:bg-muted/50"
                      onClick={() => toggleContactSelection(contact._id)}
                    >
                      <Checkbox
                        checked={selectedContacts.has(contact._id)}
                        onCheckedChange={() => toggleContactSelection(contact._id)}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {contact.firstName || contact.lastName
                            ? `${contact.firstName || ""} ${contact.lastName || ""}`.trim()
                            : contact.email}
                        </div>
                        {(contact.firstName || contact.lastName) && (
                          <div className="truncate text-xs text-muted-foreground">
                            {contact.email}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {filteredContacts.length > 100 && (
                  <div className="px-3 py-2 text-center text-xs text-muted-foreground">
                    Showing 100 of {filteredContacts.length} contacts
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddContactsOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleBulkEnroll}
                disabled={selectedContacts.size === 0 || isEnrolling}
                className="gap-2"
              >
                <UserPlus className="h-4 w-4" />
                {isEnrolling
                  ? "Enrolling..."
                  : `Enroll ${selectedContacts.size} Contact${selectedContacts.size !== 1 ? "s" : ""}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Email Editor Dialog */}
        <Dialog open={isEmailEditorOpen} onOpenChange={setIsEmailEditorOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-black">
            <DialogHeader>
              <DialogTitle>Configure Email</DialogTitle>
              <DialogDescription>
                Create your email content or select from a saved template
              </DialogDescription>
            </DialogHeader>

            {selectedNode?.type === "email" && (
              <div className="space-y-6 py-4">
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

                  <TabsContent value="template" className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <Label>Select Template</Label>
                      <Select
                        value={selectedNode.data.templateId || ""}
                        onValueChange={(v) => {
                          const template = emailTemplates?.find((t: any) => t._id === v);
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
                            emailTemplates.map((template: any) => (
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
                              No templates found. Create one using Custom Email.
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    {selectedNode.data.templateId && selectedNode.data.subject && (
                      <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                        <p className="text-xs text-zinc-500">Subject:</p>
                        <p className="text-lg font-medium">{selectedNode.data.subject}</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="custom" className="mt-4 space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Subject Line *</Label>
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
                    </div>
                    <div className="space-y-2">
                      <Label>Email Body</Label>
                      <WysiwygEditor
                        content={selectedNode.data.body || ""}
                        onChange={(html) => updateNodeData(selectedNode.id, { body: html })}
                        placeholder="Write your email content here..."
                        className="min-h-[350px]"
                      />
                    </div>

                    {/* Save as Template */}
                    <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                      <Label className="text-sm font-medium">Save for Reuse</Label>
                      <p className="mb-3 text-xs text-zinc-500">
                        Save this email as a template to use in other workflows
                      </p>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Template name..."
                          value={templateName}
                          onChange={(e) => setTemplateName(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          onClick={handleSaveAsTemplate}
                          disabled={isSavingTemplate || !selectedNode.data.subject}
                        >
                          {isSavingTemplate ? "Saving..." : "Save as Template"}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            <DialogFooter>
              <Button onClick={() => setIsEmailEditorOpen(false)}>
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

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
  Mail,
  Grid3X3,
  FileText,
  FlaskConical,
  Plus,
  X,
  Trophy,
  RotateCcw,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import NodeSidebar from "./components/NodeSidebar";
import WorkflowCanvas from "./components/WorkflowCanvas";
import {
  prebuiltEmailTemplates,
  emailTemplateCategories,
  type EmailTemplate,
} from "./templates/email-templates";

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
            {contact.name && <div className="truncate text-muted-foreground">{contact.email}</div>}
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
  { value: "has_purchased_product", label: "Has Purchased Product" },
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
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [isEnrolling, setIsEnrolling] = useState(false);

  // Debounce the search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(contactSearchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [contactSearchQuery]);
  const [isActive, setIsActive] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [isEmailEditorOpen, setIsEmailEditorOpen] = useState(false);
  const [isTemplateBrowserOpen, setIsTemplateBrowserOpen] = useState(false);
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState<string | null>(null);

  // A/B Testing State
  const [abTestEnabled, setAbTestEnabled] = useState(false);
  const [abVariants, setAbVariants] = useState<Array<{
    id: string;
    name: string;
    subject: string;
    body?: string;
    percentage: number;
  }>>([]);
  const [abSampleSize, setAbSampleSize] = useState(100);
  const [abWinnerMetric, setAbWinnerMetric] = useState<"open_rate" | "click_rate">("open_rate");
  const [abAutoSelectWinner, setAbAutoSelectWinner] = useState(true);
  const [abWinnerThreshold, setAbWinnerThreshold] = useState(5);

  // Get user's store
  const store = useQuery(
    // @ts-ignore - Convex type instantiation is excessively deep
    api.stores.getUserStore,
    user?.id ? { userId: user.id } : "skip"
  ) as { _id: Id<"stores">; plan?: string } | null | undefined;
  // Use Clerk user ID for storeId since that's what emailContacts uses
  const storeId = user?.id || "";

  // Check if user has access to automations feature
  const {
    hasAccess,
    isLoading: featureLoading,
    UpgradePromptComponent,
  } = useFeatureAccess(store?._id, "automations");

  const emailTemplates = useQuery(
    api.emailWorkflows.listEmailTemplates,
    storeId ? { storeId } : "skip"
  );

  const existingWorkflow = useQuery(
    api.emailWorkflows.getWorkflow,
    workflowId ? { workflowId: workflowId as Id<"emailWorkflows"> } : "skip"
  );

  // Search contacts with server-side filtering for the "Add Contacts" dialog
  const contacts = useQuery(
    api.emailContacts.searchContacts,
    storeId ? { storeId, search: debouncedSearchQuery || undefined, limit: 100 } : "skip"
  );

  const tags = useQuery(api.emailTags.listTags, storeId ? { storeId } : "skip");

  // Get products and courses for trigger configuration
  const products = useQuery(
    api.digitalProducts.getProductsByStore,
    store?._id ? { storeId: store._id } : "skip"
  );
  const courses = useQuery(
    api.courses.getCoursesByStore,
    store?._id ? { storeId: store._id } : "skip"
  );

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
  const saveABTest = useMutation(api.emailWorkflowABTesting.saveNodeABTest);
  const selectABWinner = useMutation(api.emailWorkflowABTesting.selectWinner);
  const resetABTest = useMutation(api.emailWorkflowABTesting.resetTestStats);

  // Query A/B test for selected email node
  const abTestData = useQuery(
    api.emailWorkflowABTesting.getVariantStats,
    workflowId && selectedNode?.type === "email"
      ? {
          workflowId: workflowId as Id<"emailWorkflows">,
          nodeId: selectedNode.id,
        }
      : "skip"
  );

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

  // Contacts are now filtered server-side via the search query
  const filteredContacts = contacts || [];

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
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show upgrade prompt if user doesn't have access to automations
  if (!hasAccess) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-8">
        <div className="max-w-md space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold">Email Automations</h1>
          <p className="text-muted-foreground">
            Email automation workflows are a Creator Pro feature. Upgrade your plan to create
            automated email sequences that nurture your leads and customers.
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
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Trigger Type</Label>
                      <Select
                        value={selectedNode.data.triggerType || "lead_signup"}
                        onValueChange={(v) =>
                          updateNodeData(selectedNode.id, {
                            triggerType: v,
                            // Reset product/course/tag selection when changing trigger type
                            productId: undefined,
                            courseId: undefined,
                            tagId: undefined,
                          })
                        }
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

                    {/* Product Purchased - show product/course selector */}
                    {selectedNode.data.triggerType === "product_purchase" && (
                      <div className="space-y-2">
                        <Label>Which Product/Course?</Label>
                        <Select
                          value={
                            selectedNode.data.productId
                              ? `product:${selectedNode.data.productId}`
                              : selectedNode.data.courseId
                                ? `course:${selectedNode.data.courseId}`
                                : "any"
                          }
                          onValueChange={(v) => {
                            if (v === "any") {
                              updateNodeData(selectedNode.id, {
                                productId: undefined,
                                productName: undefined,
                                courseId: undefined,
                                courseName: undefined,
                              });
                            } else if (v.startsWith("product:")) {
                              const productId = v.replace("product:", "");
                              const product = products?.find((p: any) => p._id === productId);
                              updateNodeData(selectedNode.id, {
                                productId,
                                productName: product?.title,
                                courseId: undefined,
                                courseName: undefined,
                              });
                            } else if (v.startsWith("course:")) {
                              const courseId = v.replace("course:", "");
                              const course = courses?.find((c: any) => c._id === courseId);
                              updateNodeData(selectedNode.id, {
                                courseId,
                                courseName: course?.title,
                                productId: undefined,
                                productName: undefined,
                              });
                            }
                          }}
                        >
                          <SelectTrigger className="bg-white dark:bg-black">
                            <SelectValue placeholder="Select product or course..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px] bg-white dark:bg-black">
                            <SelectItem value="any">Any product or course</SelectItem>
                            {courses && courses.length > 0 && (
                              <>
                                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                  Courses
                                </div>
                                {courses.map((course: any) => (
                                  <SelectItem key={course._id} value={`course:${course._id}`}>
                                    {course.title}
                                  </SelectItem>
                                ))}
                              </>
                            )}
                            {products && products.length > 0 && (
                              <>
                                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                  Digital Products
                                </div>
                                {products.map((product: any) => (
                                  <SelectItem key={product._id} value={`product:${product._id}`}>
                                    {product.title}
                                  </SelectItem>
                                ))}
                              </>
                            )}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Choose a specific product/course or trigger on any purchase
                        </p>
                      </div>
                    )}

                    {/* Tag Added - show tag selector */}
                    {selectedNode.data.triggerType === "tag_added" && (
                      <div className="space-y-2">
                        <Label>Which Tag?</Label>
                        <Select
                          value={selectedNode.data.tagId || "any"}
                          onValueChange={(v) => {
                            if (v === "any") {
                              updateNodeData(selectedNode.id, {
                                tagId: undefined,
                                tagName: undefined,
                              });
                            } else {
                              const tag = tags?.find((t: any) => t._id === v);
                              updateNodeData(selectedNode.id, {
                                tagId: v,
                                tagName: tag?.name,
                              });
                            }
                          }}
                        >
                          <SelectTrigger className="bg-white dark:bg-black">
                            <SelectValue placeholder="Select a tag..." />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-black">
                            <SelectItem value="any">Any tag</SelectItem>
                            {tags?.map((tag: { _id: string; name: string; color?: string }) => (
                              <SelectItem key={tag._id} value={tag._id}>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: tag.color || "#6b7280" }}
                                  />
                                  {tag.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Trigger when this tag is added to a contact
                        </p>
                      </div>
                    )}
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

                    <Button className="w-full" onClick={() => setIsEmailEditorOpen(true)}>
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
                          {selectedNode.data.waitingCount} contact
                          {selectedNode.data.waitingCount !== 1 ? "s" : ""} waiting
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
                  <div className="space-y-4">
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

                    {/* Has Tag - show tag selector */}
                    {selectedNode.data.conditionType === "has_tag" && (
                      <div className="space-y-2">
                        <Label>Select Tag</Label>
                        <Select
                          value={selectedNode.data.tagId || ""}
                          onValueChange={(v) => updateNodeData(selectedNode.id, { tagId: v })}
                        >
                          <SelectTrigger className="bg-white dark:bg-black">
                            <SelectValue placeholder="Choose a tag..." />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-black">
                            {tags?.map((tag: { _id: string; name: string; color?: string }) => (
                              <SelectItem key={tag._id} value={tag._id}>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: tag.color || "#6b7280" }}
                                  />
                                  {tag.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Has Purchased Product - show product/course selector */}
                    {selectedNode.data.conditionType === "has_purchased_product" && (
                      <div className="space-y-2">
                        <Label>Which Product/Course?</Label>
                        <Select
                          value={
                            selectedNode.data.productId
                              ? `product:${selectedNode.data.productId}`
                              : selectedNode.data.courseId
                                ? `course:${selectedNode.data.courseId}`
                                : "any"
                          }
                          onValueChange={(v) => {
                            if (v === "any") {
                              updateNodeData(selectedNode.id, {
                                productId: undefined,
                                courseId: undefined,
                              });
                            } else if (v.startsWith("product:")) {
                              updateNodeData(selectedNode.id, {
                                productId: v.replace("product:", ""),
                                courseId: undefined,
                              });
                            } else if (v.startsWith("course:")) {
                              updateNodeData(selectedNode.id, {
                                courseId: v.replace("course:", ""),
                                productId: undefined,
                              });
                            }
                          }}
                        >
                          <SelectTrigger className="bg-white dark:bg-black">
                            <SelectValue placeholder="Select product or course..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px] bg-white dark:bg-black">
                            <SelectItem value="any">Any product or course</SelectItem>
                            {courses && courses.length > 0 && (
                              <>
                                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                  Courses
                                </div>
                                {courses.map((course: any) => (
                                  <SelectItem key={course._id} value={`course:${course._id}`}>
                                    {course.title}
                                  </SelectItem>
                                ))}
                              </>
                            )}
                            {products && products.length > 0 && (
                              <>
                                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                  Digital Products
                                </div>
                                {products.map((product: any) => (
                                  <SelectItem key={product._id} value={`product:${product._id}`}>
                                    {product.title}
                                  </SelectItem>
                                ))}
                              </>
                            )}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Check if the contact has purchased a specific product/course
                        </p>
                      </div>
                    )}

                    {/* Opened Email - show email selector */}
                    {selectedNode.data.conditionType === "opened_email" && (
                      <div className="space-y-2">
                        <Label>Which Email</Label>
                        <Select
                          value={selectedNode.data.emailNodeId || "any"}
                          onValueChange={(v) => updateNodeData(selectedNode.id, { emailNodeId: v })}
                        >
                          <SelectTrigger className="bg-white dark:bg-black">
                            <SelectValue placeholder="Select email..." />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-black">
                            <SelectItem value="any">Any previous email</SelectItem>
                            {nodes
                              .filter((n) => n.type === "email")
                              .map((emailNode) => (
                                <SelectItem key={emailNode.id} value={emailNode.id}>
                                  {emailNode.data?.subject || `Email (${emailNode.id})`}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Clicked Link - show link input */}
                    {selectedNode.data.conditionType === "clicked_link" && (
                      <div className="space-y-2">
                        <Label>Link URL (optional)</Label>
                        <Input
                          value={selectedNode.data.linkUrl || ""}
                          onChange={(e) =>
                            updateNodeData(selectedNode.id, { linkUrl: e.target.value })
                          }
                          placeholder="Leave empty for any link"
                        />
                        <p className="text-xs text-muted-foreground">
                          Leave empty to match any clicked link, or enter a specific URL to match.
                        </p>
                      </div>
                    )}

                    {/* Time Based - show time options */}
                    {selectedNode.data.conditionType === "time_based" && (
                      <div className="space-y-2">
                        <Label>Time Condition</Label>
                        <Select
                          value={selectedNode.data.timeCondition || "after_hours"}
                          onValueChange={(v) =>
                            updateNodeData(selectedNode.id, { timeCondition: v })
                          }
                        >
                          <SelectTrigger className="bg-white dark:bg-black">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-black">
                            <SelectItem value="after_hours">
                              After X hours since enrollment
                            </SelectItem>
                            <SelectItem value="after_days">
                              After X days since enrollment
                            </SelectItem>
                            <SelectItem value="day_of_week">On specific day of week</SelectItem>
                          </SelectContent>
                        </Select>
                        {(selectedNode.data.timeCondition === "after_hours" ||
                          selectedNode.data.timeCondition === "after_days") && (
                          <Input
                            type="number"
                            min="1"
                            value={selectedNode.data.timeValue || 24}
                            onChange={(e) =>
                              updateNodeData(selectedNode.id, {
                                timeValue: parseInt(e.target.value) || 1,
                              })
                            }
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}

                {selectedNode.type === "action" && (
                  <div className="space-y-4">
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

                    {/* Tag selector for add_tag and remove_tag */}
                    {(selectedNode.data.actionType === "add_tag" ||
                      selectedNode.data.actionType === "remove_tag") && (
                      <div className="space-y-2">
                        <Label>Select Tag</Label>
                        <Select
                          value={selectedNode.data.tagId || ""}
                          onValueChange={(v) => updateNodeData(selectedNode.id, { tagId: v })}
                        >
                          <SelectTrigger className="bg-white dark:bg-black">
                            <SelectValue placeholder="Choose a tag..." />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-black">
                            {tags?.map((tag: { _id: string; name: string; color?: string }) => (
                              <SelectItem key={tag._id} value={tag._id}>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: tag.color || "#6b7280" }}
                                  />
                                  {tag.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Text input for other action types */}
                    {selectedNode.data.actionType !== "add_tag" &&
                      selectedNode.data.actionType !== "remove_tag" && (
                        <div className="space-y-2">
                          <Label>Value</Label>
                          <Input
                            value={selectedNode.data.value || ""}
                            onChange={(e) =>
                              updateNodeData(selectedNode.id, { value: e.target.value })
                            }
                            placeholder="List name, field value, etc."
                          />
                        </div>
                      )}
                  </div>
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
                {contacts === undefined ? (
                  <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                    {contactSearchQuery !== debouncedSearchQuery
                      ? "Searching..."
                      : "Loading contacts..."}
                  </div>
                ) : filteredContacts.length === 0 ? (
                  <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                    {debouncedSearchQuery
                      ? `No contacts found for "${debouncedSearchQuery}"`
                      : "No contacts found"}
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
          <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto bg-white dark:bg-black">
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
                    updateNodeData(selectedNode.id, { mode: v as "template" | "custom" | "abtest" })
                  }
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="template">Template</TabsTrigger>
                    <TabsTrigger value="custom">Custom</TabsTrigger>
                    <TabsTrigger value="abtest" className="gap-1">
                      <FlaskConical className="h-3 w-3" />
                      A/B Test
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="template" className="mt-4 space-y-4">
                    {/* Quick start - always show browse button prominently */}
                    <div className="space-y-4">
                      <Button
                        onClick={() => setIsTemplateBrowserOpen(true)}
                        className="w-full gap-2"
                        size="lg"
                      >
                        <Search className="h-4 w-4" />
                        Browse Email Templates
                      </Button>

                      {/* Selected Template Preview */}
                      {(selectedNode.data.templateId ||
                        selectedNode.data.prebuiltTemplateId ||
                        selectedNode.data.subject) && (
                        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
                          <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                              <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                Template loaded: {selectedNode.data.templateName || "Custom"}
                              </p>
                              <p className="mt-0.5 truncate text-sm text-green-600 dark:text-green-400">
                                Subject: {selectedNode.data.subject}
                              </p>
                              <p className="mt-2 text-xs text-green-600 dark:text-green-400">
                                Switch to &quot;Custom Email&quot; tab to edit the content
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <p className="text-center text-xs text-zinc-500">
                        Choose from {prebuiltEmailTemplates.length} pre-built templates designed for
                        music producers
                      </p>
                    </div>
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

                  {/* A/B Test Tab */}
                  <TabsContent value="abtest" className="mt-4 space-y-4">
                    <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-900 dark:bg-purple-950/30">
                      <div className="flex items-center gap-2">
                        <FlaskConical className="h-5 w-5 text-purple-600" />
                        <div>
                          <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
                            A/B Test Your Emails
                          </p>
                          <p className="text-xs text-purple-600 dark:text-purple-400">
                            Test different subject lines to see which performs better
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Enable A/B Testing Toggle */}
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <Label className="font-medium">Enable A/B Testing</Label>
                        <p className="text-xs text-muted-foreground">
                          Split test subject lines with your contacts
                        </p>
                      </div>
                      <Switch
                        checked={selectedNode.data.abTestEnabled || false}
                        onCheckedChange={(checked) => {
                          updateNodeData(selectedNode.id, { abTestEnabled: checked });
                          if (checked && (!selectedNode.data.abVariants || selectedNode.data.abVariants.length < 2)) {
                            // Initialize with 2 variants
                            const variants = [
                              { id: "variant_a", name: "Variant A", subject: selectedNode.data.subject || "", percentage: 50 },
                              { id: "variant_b", name: "Variant B", subject: "", percentage: 50 },
                            ];
                            updateNodeData(selectedNode.id, { abVariants: variants });
                          }
                        }}
                      />
                    </div>

                    {selectedNode.data.abTestEnabled && (
                      <div className="space-y-4">
                        {/* Variants */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="font-medium">Subject Line Variants</Label>
                            {(selectedNode.data.abVariants?.length || 0) < 3 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const variants = selectedNode.data.abVariants || [];
                                  const newVariant = {
                                    id: `variant_${String.fromCharCode(97 + variants.length)}`,
                                    name: `Variant ${String.fromCharCode(65 + variants.length)}`,
                                    subject: "",
                                    percentage: Math.floor(100 / (variants.length + 1)),
                                  };
                                  // Redistribute percentages
                                  const newPercentage = Math.floor(100 / (variants.length + 1));
                                  const updatedVariants = variants.map((v: any) => ({
                                    ...v,
                                    percentage: newPercentage,
                                  }));
                                  updatedVariants.push({ ...newVariant, percentage: 100 - (newPercentage * variants.length) });
                                  updateNodeData(selectedNode.id, { abVariants: updatedVariants });
                                }}
                                className="gap-1"
                              >
                                <Plus className="h-3 w-3" />
                                Add Variant
                              </Button>
                            )}
                          </div>

                          {(selectedNode.data.abVariants || []).map((variant: any, idx: number) => (
                            <div
                              key={variant.id}
                              className="rounded-lg border bg-white p-4 dark:bg-zinc-900"
                            >
                              <div className="mb-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-xs font-medium text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                                    {String.fromCharCode(65 + idx)}
                                  </span>
                                  <Input
                                    value={variant.name}
                                    onChange={(e) => {
                                      const variants = [...(selectedNode.data.abVariants || [])];
                                      variants[idx] = { ...variants[idx], name: e.target.value };
                                      updateNodeData(selectedNode.id, { abVariants: variants });
                                    }}
                                    className="h-8 w-32"
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">
                                    {variant.percentage}%
                                  </span>
                                  {(selectedNode.data.abVariants?.length || 0) > 2 && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const variants = selectedNode.data.abVariants.filter(
                                          (_: any, i: number) => i !== idx
                                        );
                                        // Redistribute percentages
                                        const newPercentage = Math.floor(100 / variants.length);
                                        const updatedVariants = variants.map((v: any, i: number) => ({
                                          ...v,
                                          percentage: i === variants.length - 1
                                            ? 100 - (newPercentage * (variants.length - 1))
                                            : newPercentage,
                                        }));
                                        updateNodeData(selectedNode.id, { abVariants: updatedVariants });
                                      }}
                                      className="h-6 w-6 p-0 text-zinc-400 hover:text-red-500"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                              <Input
                                value={variant.subject}
                                onChange={(e) => {
                                  const variants = [...(selectedNode.data.abVariants || [])];
                                  variants[idx] = { ...variants[idx], subject: e.target.value };
                                  updateNodeData(selectedNode.id, { abVariants: variants });
                                  // Also update main subject if this is first variant
                                  if (idx === 0) {
                                    updateNodeData(selectedNode.id, { subject: e.target.value });
                                  }
                                }}
                                placeholder="Enter subject line..."
                              />
                            </div>
                          ))}
                        </div>

                        {/* Test Settings */}
                        <div className="space-y-4 rounded-lg border p-4">
                          <Label className="font-medium">Test Settings</Label>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">
                                Sample Size (contacts)
                              </Label>
                              <Input
                                type="number"
                                value={selectedNode.data.abSampleSize || 100}
                                onChange={(e) =>
                                  updateNodeData(selectedNode.id, {
                                    abSampleSize: parseInt(e.target.value) || 100,
                                  })
                                }
                                min={10}
                                max={10000}
                              />
                              <p className="text-[10px] text-muted-foreground">
                                Test with this many contacts before selecting winner
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">
                                Winner Metric
                              </Label>
                              <Select
                                value={selectedNode.data.abWinnerMetric || "open_rate"}
                                onValueChange={(v) =>
                                  updateNodeData(selectedNode.id, {
                                    abWinnerMetric: v as "open_rate" | "click_rate",
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="open_rate">Open Rate</SelectItem>
                                  <SelectItem value="click_rate">Click Rate</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="text-xs">Auto-select Winner</Label>
                              <p className="text-[10px] text-muted-foreground">
                                Automatically pick the best variant after sample
                              </p>
                            </div>
                            <Switch
                              checked={selectedNode.data.abAutoSelectWinner !== false}
                              onCheckedChange={(checked) =>
                                updateNodeData(selectedNode.id, { abAutoSelectWinner: checked })
                              }
                            />
                          </div>
                        </div>

                        {/* Live Stats (if test is running) */}
                        {abTestData && abTestData.variants.length > 0 && (
                          <div className="space-y-3 rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-900 dark:bg-purple-950/30">
                            <div className="flex items-center justify-between">
                              <Label className="font-medium text-purple-800 dark:text-purple-200">
                                Live Test Results
                              </Label>
                              {abTestData.isComplete && abTestData.winner && (
                                <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                                  <Trophy className="h-3 w-3" />
                                  Test Complete
                                </span>
                              )}
                            </div>

                            <div className="space-y-2">
                              {abTestData.variants.map((v: any) => (
                                <div
                                  key={v.id}
                                  className={`flex items-center justify-between rounded p-2 ${
                                    abTestData.winner === v.id
                                      ? "bg-green-100 dark:bg-green-900/30"
                                      : "bg-white dark:bg-zinc-800"
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    {abTestData.winner === v.id && (
                                      <Trophy className="h-4 w-4 text-green-600" />
                                    )}
                                    <span className="text-sm font-medium">{v.name}</span>
                                  </div>
                                  <div className="flex gap-4 text-xs">
                                    <span>Sent: {v.sent}</span>
                                    <span className="font-medium text-purple-600">
                                      {v.openRate}% opens
                                    </span>
                                    <span>{v.clickRate}% clicks</span>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="flex items-center justify-between pt-2 text-xs text-purple-600 dark:text-purple-400">
                              <span>
                                Progress: {abTestData.totalSent}/{abTestData.sampleSize} contacts
                              </span>
                              {!abTestData.isComplete && workflowId && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={async () => {
                                    await resetABTest({
                                      workflowId: workflowId as Id<"emailWorkflows">,
                                      nodeId: selectedNode.id,
                                    });
                                    toast({ title: "Test stats reset" });
                                  }}
                                  className="h-6 gap-1 text-xs"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                  Reset
                                </Button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Save A/B Test Config */}
                        {workflowId && (
                          <Button
                            onClick={async () => {
                              try {
                                await saveABTest({
                                  workflowId: workflowId as Id<"emailWorkflows">,
                                  nodeId: selectedNode.id,
                                  isEnabled: selectedNode.data.abTestEnabled || false,
                                  variants: (selectedNode.data.abVariants || []).map((v: any) => ({
                                    id: v.id,
                                    name: v.name,
                                    subject: v.subject,
                                    body: v.body,
                                    percentage: v.percentage,
                                  })),
                                  sampleSize: selectedNode.data.abSampleSize || 100,
                                  winnerMetric: selectedNode.data.abWinnerMetric || "open_rate",
                                  autoSelectWinner: selectedNode.data.abAutoSelectWinner !== false,
                                  winnerThreshold: 5,
                                });
                                toast({ title: "A/B test configuration saved" });
                              } catch (error: any) {
                                toast({
                                  title: "Error",
                                  description: error.message,
                                  variant: "destructive",
                                });
                              }
                            }}
                            className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
                          >
                            <FlaskConical className="h-4 w-4" />
                            Save A/B Test Configuration
                          </Button>
                        )}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}

            <DialogFooter>
              <Button onClick={() => setIsEmailEditorOpen(false)}>Done</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Template Browser Dialog - Pre-built Templates */}
        <Dialog open={isTemplateBrowserOpen} onOpenChange={setIsTemplateBrowserOpen}>
          <DialogContent className="max-h-[85vh] max-w-4xl overflow-hidden bg-white dark:bg-black">
            <DialogHeader>
              <DialogTitle>Choose an Email Template</DialogTitle>
              <DialogDescription>
                Select a pre-built template to get started quickly. You can customize the content
                after selecting.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                {emailTemplateCategories.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={
                      (cat.id === "all" && templateCategoryFilter === null) ||
                      templateCategoryFilter === cat.id
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => setTemplateCategoryFilter(cat.id === "all" ? null : cat.id)}
                  >
                    {cat.label}
                  </Button>
                ))}
              </div>

              {/* Templates Grid */}
              <div className="max-h-[55vh] overflow-y-auto pr-2">
                <div className="grid gap-3 sm:grid-cols-2">
                  {prebuiltEmailTemplates
                    .filter((t) => !templateCategoryFilter || t.category === templateCategoryFilter)
                    .map((template) => (
                      <div
                        key={template.id}
                        className={`cursor-pointer rounded-lg border p-4 transition-all hover:border-primary hover:shadow-md ${
                          selectedNode?.data.prebuiltTemplateId === template.id
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-zinc-200 dark:border-zinc-800"
                        }`}
                        onClick={() => {
                          if (selectedNode) {
                            updateNodeData(selectedNode.id, {
                              prebuiltTemplateId: template.id,
                              templateName: template.name,
                              subject: template.subject,
                              body: template.body,
                              mode: "custom", // Switch to custom mode so they can edit
                            });
                          }
                          setIsTemplateBrowserOpen(false);
                          toast({
                            title: "Template loaded",
                            description:
                              "You can now customize the subject and content in the editor.",
                          });
                        }}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-medium leading-tight">{template.name}</span>
                            <span className="shrink-0 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] capitalize text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                              {template.category}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500">{template.description}</p>
                          <p className="truncate rounded bg-zinc-50 px-2 py-1 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                            <span className="text-zinc-400">Subject:</span> {template.subject}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>

                {prebuiltEmailTemplates.filter(
                  (t) => !templateCategoryFilter || t.category === templateCategoryFilter
                ).length === 0 && (
                  <div className="py-8 text-center text-sm text-zinc-500">
                    No templates in this category
                  </div>
                )}
              </div>

              {/* User's saved templates section */}
              {emailTemplates && emailTemplates.length > 0 && (
                <div className="border-t pt-4">
                  <p className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Your Saved Templates
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {emailTemplates.map((template: any) => (
                      <Button
                        key={template._id}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => {
                          if (selectedNode) {
                            updateNodeData(selectedNode.id, {
                              templateId: template._id,
                              templateName: template.name,
                              subject: template.subject,
                              mode: "template",
                            });
                          }
                          setIsTemplateBrowserOpen(false);
                        }}
                      >
                        <FileText className="h-3.5 w-3.5" />
                        {template.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsTemplateBrowserOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

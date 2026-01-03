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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { ArrowLeft, Save, Trash2, AlertTriangle, Check, UserPlus, Search } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
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
  const [addNodeFn, setAddNodeFn] = useState<((type: string) => void) | null>(null);
  const [isAddContactsOpen, setIsAddContactsOpen] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [contactSearchQuery, setContactSearchQuery] = useState("");
  const [isEnrolling, setIsEnrolling] = useState(false);

  const storeId = user?.id ?? "";

  const emailTemplates = useQuery(
    api.emailWorkflows.listEmailTemplates,
    storeId ? { storeId } : "skip"
  );

  const existingWorkflow = useQuery(
    api.emailWorkflows.getWorkflow,
    workflowId ? { workflowId: workflowId as Id<"emailWorkflows"> } : "skip"
  );

  const contacts = useQuery(api.emailContacts.listContacts, storeId ? { storeId } : "skip");

  const createWorkflow = useMutation(api.emailWorkflows.createWorkflow);
  const updateWorkflow = useMutation(api.emailWorkflows.updateWorkflow);
  const deleteWorkflow = useMutation(api.emailWorkflows.deleteWorkflow);
  const bulkEnrollContacts = useMutation(api.emailWorkflows.bulkEnrollContactsInWorkflow);

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
            initialNodes={existingWorkflow?.nodes || []}
            initialEdges={existingWorkflow?.edges || []}
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
                          <WysiwygEditor
                            content={selectedNode.data.body || ""}
                            onChange={(html) => updateNodeData(selectedNode.id, { body: html })}
                            placeholder="Write your email content here..."
                            className="min-h-[200px]"
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
      </div>
    </div>
  );
}

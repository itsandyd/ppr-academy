"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { AdminLoading } from "../../components/admin-loading";
import OutreachWorkflowCanvas, { defaultNodeData } from "./OutreachWorkflowCanvas";
import OutreachNodeSidebar from "./OutreachNodeSidebar";
import {
  ArrowLeft,
  Loader2,
  Save,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from "lucide-react";

// ─── Graph-to-Steps Conversion ──────────────────────────────────────────────

interface StepData {
  subject: string;
  htmlContent: string;
  textContent?: string;
  delayDays: number;
}

function graphToSteps(nodes: Node[], edges: Edge[]): StepData[] {
  const steps: StepData[] = [];
  const triggerNode = nodes.find((n) => n.type === "outreachTrigger");
  if (!triggerNode) return steps;

  // BFS from trigger, following linear path (skip condition branches for steps)
  let currentId: string | null = triggerNode.id;
  let pendingDelay = 0;

  const visited = new Set<string>();
  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const node = nodes.find((n) => n.id === currentId);
    if (!node) break;

    if (node.type === "sendEmail") {
      steps.push({
        subject: node.data.subject || "",
        htmlContent: node.data.htmlContent || "",
        textContent: node.data.textContent,
        delayDays: pendingDelay,
      });
      pendingDelay = 0;
    } else if (node.type === "delay") {
      const unit = node.data.delayUnit || "days";
      const value = node.data.delayValue || 0;
      if (unit === "days") pendingDelay += value;
      else if (unit === "hours") pendingDelay += value / 24;
      else pendingDelay += value / 1440;
    } else if (node.type === "stop") {
      break;
    }

    // Find next node (follow default/first edge)
    const edge = edges.find((e) => e.source === currentId);
    currentId = edge?.target ?? null;
  }

  return steps;
}

function stepsToNodes(
  steps: Array<{
    stepIndex: number;
    subject: string;
    htmlContent: string;
    textContent?: string;
    delayDays: number;
  }>,
  triggerData: Record<string, any>
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let nodeIdx = 0;
  const yStep = 120;

  // Trigger node
  const triggerId = `node_${nodeIdx++}`;
  nodes.push({
    id: triggerId,
    type: "outreachTrigger",
    position: { x: 250, y: 50 },
    data: { ...defaultNodeData.outreachTrigger, ...triggerData },
  });

  let prevId = triggerId;

  for (const step of steps) {
    // Add delay node if delay > 0
    if (step.delayDays > 0) {
      const delayId = `node_${nodeIdx++}`;
      nodes.push({
        id: delayId,
        type: "delay",
        position: { x: 250, y: 50 + nodeIdx * yStep },
        data: { delayValue: step.delayDays, delayUnit: "days" },
      });
      edges.push({
        id: `edge_${prevId}_${delayId}`,
        source: prevId,
        target: delayId,
        type: "smoothstep",
        animated: true,
        style: { stroke: "#6366f1", strokeWidth: 2 },
      });
      prevId = delayId;
    }

    // Add send email node
    const emailId = `node_${nodeIdx++}`;
    nodes.push({
      id: emailId,
      type: "sendEmail",
      position: { x: 250, y: 50 + nodeIdx * yStep },
      data: {
        subject: step.subject,
        htmlContent: step.htmlContent,
        textContent: step.textContent,
      },
    });
    edges.push({
      id: `edge_${prevId}_${emailId}`,
      source: prevId,
      target: emailId,
      type: "smoothstep",
      animated: true,
      style: { stroke: "#6366f1", strokeWidth: 2 },
    });
    prevId = emailId;
  }

  // Add stop node at the end
  const stopId = `node_${nodeIdx++}`;
  nodes.push({
    id: stopId,
    type: "stop",
    position: { x: 250, y: 50 + nodeIdx * yStep },
    data: {},
  });
  edges.push({
    id: `edge_${prevId}_${stopId}`,
    source: prevId,
    target: stopId,
    type: "smoothstep",
    animated: true,
    style: { stroke: "#6366f1", strokeWidth: 2 },
  });

  return { nodes, edges };
}

// ─── Merge tag insertion helper ─────────────────────────────────────────────

const MERGE_TAGS = [
  { label: "First Name", tag: "{{firstName}}" },
  { label: "Name", tag: "{{name}}" },
  { label: "Email", tag: "{{email}}" },
  { label: "Store Name", tag: "{{storeName}}" },
  { label: "Store Slug", tag: "{{storeSlug}}" },
];

// ─── Editor Component ───────────────────────────────────────────────────────

interface OutreachWorkflowEditorProps {
  sequenceId?: string;
  clerkId: string;
}

export default function OutreachWorkflowEditor({
  sequenceId,
  clerkId,
}: OutreachWorkflowEditorProps) {
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [workflowName, setWorkflowName] = useState("New Outreach Sequence");
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [addNodeFn, setAddNodeFn] = useState<((type: string) => void) | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  // AI Generate state
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [aiGoal, setAIGoal] = useState("");
  const [aiSequenceLength, setAISequenceLength] = useState(5);
  const [aiTone, setAITone] = useState<"casual" | "friendly" | "professional">("casual");
  const [isGenerating, setIsGenerating] = useState(false);

  // AI single email generation state
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);

  // Body textarea ref for merge tag insertion
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Queries
  const existingSequence = useQuery(
    api.admin.creatorOutreach.getOutreachSequence,
    sequenceId
      ? { clerkId, sequenceId: sequenceId as Id<"adminOutreachSequences"> }
      : "skip"
  );

  // Mutations & Actions
  const createSequenceMut = useMutation(api.admin.creatorOutreach.createOutreachSequence);
  const updateSequenceMut = useMutation(api.admin.creatorOutreach.updateOutreachSequence);
  const generateOutreachSequence = useAction(api.admin.creatorOutreachActions.generateOutreachSequence);
  const generateOutreachEmail = useAction(api.admin.creatorOutreachActions.generateOutreachEmail);

  // Load existing sequence
  useEffect(() => {
    if (existingSequence && !hasInitialized) {
      setWorkflowName(existingSequence.name);
      if (existingSequence.nodes && existingSequence.edges) {
        setNodes(JSON.parse(existingSequence.nodes));
        setEdges(JSON.parse(existingSequence.edges));
      } else {
        // Convert legacy steps to graph
        const triggerData = {
          fromName: existingSequence.fromName,
          fromEmail: existingSequence.fromEmail,
          replyTo: existingSequence.replyTo,
          stopOnProductUpload: existingSequence.stopOnProductUpload,
          stopOnReply: existingSequence.stopOnReply,
        };
        const result = stepsToNodes(existingSequence.steps, triggerData);
        setNodes(result.nodes);
        setEdges(result.edges);
      }
      setHasInitialized(true);
    }
  }, [existingSequence, hasInitialized]);

  // Initialize new sequence
  useEffect(() => {
    if (!sequenceId && !hasInitialized) {
      setNodes([
        {
          id: "node_0",
          type: "outreachTrigger",
          position: { x: 250, y: 50 },
          data: { ...defaultNodeData.outreachTrigger },
        },
      ]);
      setEdges([]);
      setHasInitialized(true);
    }
  }, [sequenceId, hasInitialized]);

  // Node data update
  const updateNodeData = useCallback(
    (nodeId: string, patch: Record<string, any>) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n
        )
      );
      if (selectedNode?.id === nodeId) {
        setSelectedNode((prev) =>
          prev ? { ...prev, data: { ...prev.data, ...patch } } : null
        );
      }
    },
    [selectedNode]
  );

  // Delete node
  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) =>
        eds.filter((e) => e.source !== nodeId && e.target !== nodeId)
      );
      setSelectedNode(null);
    },
    []
  );

  // Save
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Extract trigger node data
      const triggerNode = nodes.find((n) => n.type === "outreachTrigger");
      const fromName = triggerNode?.data?.fromName || "Andrew";
      const fromEmail = triggerNode?.data?.fromEmail || "andrew@pauseplayrepeat.com";
      const replyTo = triggerNode?.data?.replyTo || fromEmail;
      const stopOnProductUpload = triggerNode?.data?.stopOnProductUpload ?? true;
      const stopOnReply = triggerNode?.data?.stopOnReply ?? true;

      // Serialize graph
      const nodesStr = JSON.stringify(nodes);
      const edgesStr = JSON.stringify(edges);

      // Convert graph to flat steps for backward compat
      const steps = graphToSteps(nodes, edges);

      if (sequenceId) {
        await updateSequenceMut({
          clerkId,
          sequenceId: sequenceId as Id<"adminOutreachSequences">,
          name: workflowName,
          fromName,
          fromEmail,
          replyTo,
          steps,
          nodes: nodesStr,
          edges: edgesStr,
          stopOnProductUpload,
          stopOnReply,
        });
        toast({ title: "Sequence updated" });
      } else {
        const newId = await createSequenceMut({
          clerkId,
          name: workflowName,
          fromName,
          fromEmail,
          replyTo,
          steps: steps.length > 0 ? steps : [{ subject: "", htmlContent: "", delayDays: 0 }],
          nodes: nodesStr,
          edges: edgesStr,
          stopOnProductUpload,
          stopOnReply,
        });
        toast({ title: "Sequence created" });
        router.push(`/admin/creator-outreach?edit=${newId}`);
      }
    } catch (error) {
      toast({
        title: "Failed to save",
        description: String(error),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // AI Generate sequence
  const handleAIGenerate = async () => {
    if (!aiGoal.trim()) {
      toast({ title: "Please describe the outreach goal", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateOutreachSequence({
        clerkId,
        goal: aiGoal,
        sequenceLength: aiSequenceLength,
        tone: aiTone,
      });

      setWorkflowName(result.name);
      setNodes(result.nodes as Node[]);
      setEdges(result.edges as Edge[]);

      toast({
        title: "Sequence Generated!",
        description: `Created ${result.nodes.length} nodes. Review and customize as needed.`,
      });

      setIsAIDialogOpen(false);
      setAIGoal("");
    } catch (error) {
      toast({
        title: "Generation failed",
        description: String(error),
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // AI Generate single email
  const handleAIGenerateEmail = async () => {
    if (!selectedNode) return;

    setIsGeneratingEmail(true);
    try {
      const result = await generateOutreachEmail({
        clerkId,
        existingSubject: selectedNode.data.subject || undefined,
        existingBody: selectedNode.data.htmlContent || undefined,
        goal: "Get inactive creators to engage with the platform",
      });

      updateNodeData(selectedNode.id, {
        subject: result.subject,
        htmlContent: result.body,
        textContent: result.body,
      });

      toast({ title: "Email generated!" });
    } catch (error) {
      toast({
        title: "Generation failed",
        description: String(error),
        variant: "destructive",
      });
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  // Insert merge tag at cursor position
  const insertMergeTag = (tag: string) => {
    if (!bodyTextareaRef.current || !selectedNode) return;

    const textarea = bodyTextareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = selectedNode.data.htmlContent || "";
    const newValue = currentValue.substring(0, start) + tag + currentValue.substring(end);

    updateNodeData(selectedNode.id, { htmlContent: newValue });

    // Restore cursor position after React re-renders
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.selectionStart = start + tag.length;
      textarea.selectionEnd = start + tag.length;
    });
  };

  // Handle node selection from canvas
  const handleNodeSelect = useCallback((node: Node | null) => {
    setSelectedNode(node);
  }, []);

  // Loading state
  if (sequenceId && existingSequence === undefined) {
    return <AdminLoading variant="dashboard" />;
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 border-b bg-white px-4 py-3 dark:bg-zinc-950">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/admin/creator-outreach")}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        <div className="h-6 w-px bg-border" />
        <Input
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          className="max-w-xs border-0 text-lg font-semibold shadow-none focus-visible:ring-0"
          placeholder="Sequence name..."
        />
        <div className="flex-1" />
        <Button
          variant="outline"
          onClick={() => setIsAIDialogOpen(true)}
          className="gap-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20"
        >
          <Wand2 className="h-4 w-4 text-purple-600" />
          <span className="hidden md:inline">AI Generate</span>
        </Button>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>

      {/* Main editor area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Node sidebar */}
        <OutreachNodeSidebar onAddNode={addNodeFn ?? undefined} />

        {/* Canvas */}
        <div className="flex-1">
          <OutreachWorkflowCanvas
            initialNodes={nodes}
            initialEdges={edges}
            onNodesChange={setNodes}
            onEdgesChange={setEdges}
            onNodeSelect={handleNodeSelect}
            onAddNodeRef={(fn) => setAddNodeFn(() => fn)}
          />
        </div>
      </div>

      {/* Mobile bottom bar */}
      <div className="md:hidden">
        <OutreachNodeSidebar onAddNode={addNodeFn ?? undefined} />
      </div>

      {/* ─── Node Configuration Dialog ─────────────────────────────────────── */}
      <Dialog open={!!selectedNode} onOpenChange={(open) => !open && setSelectedNode(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto bg-white dark:bg-black">
          <DialogHeader>
            <DialogTitle className="capitalize">
              {selectedNode?.type === "outreachTrigger"
                ? "Trigger"
                : selectedNode?.type === "sendEmail"
                  ? "Send Email"
                  : selectedNode?.type}{" "}
              Settings
            </DialogTitle>
            <DialogDescription>Configure this node</DialogDescription>
          </DialogHeader>

          {selectedNode && (
            <div className="mt-4 space-y-4">
              {/* Delete button for non-trigger nodes */}
              {selectedNode.type !== "outreachTrigger" && (
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteNode(selectedNode.id)}
                    className="h-8 gap-1.5 text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Node
                  </Button>
                </div>
              )}

              {/* Trigger config */}
              {selectedNode.type === "outreachTrigger" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>From Name</Label>
                    <Input
                      value={selectedNode.data.fromName || ""}
                      onChange={(e) =>
                        updateNodeData(selectedNode.id, { fromName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>From Email</Label>
                    <Input
                      value={selectedNode.data.fromEmail || ""}
                      onChange={(e) =>
                        updateNodeData(selectedNode.id, { fromEmail: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Reply To</Label>
                    <Input
                      value={selectedNode.data.replyTo || ""}
                      onChange={(e) =>
                        updateNodeData(selectedNode.id, { replyTo: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Stop on product upload</Label>
                    <Switch
                      checked={selectedNode.data.stopOnProductUpload ?? true}
                      onCheckedChange={(checked) =>
                        updateNodeData(selectedNode.id, { stopOnProductUpload: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Stop on reply</Label>
                    <Switch
                      checked={selectedNode.data.stopOnReply ?? true}
                      onCheckedChange={(checked) =>
                        updateNodeData(selectedNode.id, { stopOnReply: checked })
                      }
                    />
                  </div>
                </div>
              )}

              {/* Send Email config */}
              {selectedNode.type === "sendEmail" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Input
                      placeholder="Hey {{firstName}}, quick question"
                      value={selectedNode.data.subject || ""}
                      onChange={(e) =>
                        updateNodeData(selectedNode.id, { subject: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Body</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleAIGenerateEmail}
                        disabled={isGeneratingEmail}
                        className="h-7 gap-1.5 text-xs text-purple-600 hover:text-purple-700"
                      >
                        {isGeneratingEmail ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Sparkles className="h-3 w-3" />
                        )}
                        {isGeneratingEmail ? "Generating..." : "Generate with AI"}
                      </Button>
                    </div>
                    <Textarea
                      ref={bodyTextareaRef}
                      placeholder={`Hey {{firstName}},\n\nI noticed you signed up for PPR...\n\n- Andrew`}
                      value={selectedNode.data.htmlContent || ""}
                      onChange={(e) =>
                        updateNodeData(selectedNode.id, { htmlContent: e.target.value })
                      }
                      rows={12}
                    />
                  </div>

                  {/* Merge tag buttons */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Insert merge tag</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {MERGE_TAGS.map(({ label, tag }) => (
                        <Button
                          key={tag}
                          variant="outline"
                          size="sm"
                          onClick={() => insertMergeTag(tag)}
                          className="h-7 text-xs"
                        >
                          {label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Email preview */}
                  {(selectedNode.data.subject || selectedNode.data.htmlContent) && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Preview</Label>
                      <div className="rounded-lg border bg-zinc-50 p-4 dark:bg-zinc-900">
                        <div className="mb-1 text-xs text-muted-foreground">
                          From: Andrew &lt;andrew@pauseplayrepeat.com&gt;
                        </div>
                        <div className="mb-3 text-sm font-medium">
                          {(selectedNode.data.subject || "(no subject)")
                            .replace(/\{\{firstName\}\}/g, "Sarah")
                            .replace(/\{\{name\}\}/g, "Sarah Chen")
                            .replace(/\{\{email\}\}/g, "sarah@example.com")
                            .replace(/\{\{storeName\}\}/g, "Sarah's Studio")
                            .replace(/\{\{storeSlug\}\}/g, "sarahs-studio")}
                        </div>
                        <div className="whitespace-pre-wrap text-sm text-muted-foreground">
                          {(selectedNode.data.htmlContent || "")
                            .replace(/\{\{firstName\}\}/g, "Sarah")
                            .replace(/\{\{name\}\}/g, "Sarah Chen")
                            .replace(/\{\{email\}\}/g, "sarah@example.com")
                            .replace(/\{\{storeName\}\}/g, "Sarah's Studio")
                            .replace(/\{\{storeSlug\}\}/g, "sarahs-studio")}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Condition config */}
              {selectedNode.type === "condition" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Condition Type</Label>
                    <Select
                      value={selectedNode.data.conditionType || "has_products"}
                      onValueChange={(v) =>
                        updateNodeData(selectedNode.id, { conditionType: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="has_products">Has uploaded a product?</SelectItem>
                        <SelectItem value="has_stripe">Has connected Stripe?</SelectItem>
                        <SelectItem value="is_churned">Is churned (60d no sales)?</SelectItem>
                        <SelectItem value="emails_opened">Opened any outreach email?</SelectItem>
                        <SelectItem value="emails_clicked">Clicked any outreach link?</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
                    <p><strong>Yes</strong> branch: condition is true</p>
                    <p><strong>No</strong> branch: condition is false</p>
                  </div>
                </div>
              )}

              {/* Delay config */}
              {selectedNode.type === "delay" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Delay</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min={1}
                        value={selectedNode.data.delayValue || 1}
                        onChange={(e) =>
                          updateNodeData(selectedNode.id, {
                            delayValue: parseInt(e.target.value) || 1,
                          })
                        }
                        className="w-20"
                      />
                      <Select
                        value={selectedNode.data.delayUnit || "days"}
                        onValueChange={(v) =>
                          updateNodeData(selectedNode.id, { delayUnit: v })
                        }
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hours">Hours</SelectItem>
                          <SelectItem value="days">Days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Stop config */}
              {selectedNode.type === "stop" && (
                <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                  This node ends the sequence for the creator. No further emails
                  will be sent.
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── AI Sequence Generator Dialog ──────────────────────────────────── */}
      <Dialog
        open={isAIDialogOpen}
        onOpenChange={(open) => {
          if (!isGenerating) setIsAIDialogOpen(open);
        }}
      >
        <DialogContent className="flex max-h-[90vh] w-[95vw] max-w-2xl flex-col overflow-hidden border-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-0 shadow-2xl sm:w-full">
          <DialogTitle className="sr-only">AI Outreach Sequence Generator</DialogTitle>

          {/* Animated background */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -left-1/4 -top-1/4 h-96 w-96 animate-pulse rounded-full bg-violet-600/20 blur-3xl" />
            <div className="absolute -bottom-1/4 -right-1/4 h-96 w-96 animate-pulse rounded-full bg-fuchsia-600/20 blur-3xl" style={{ animationDelay: "1s" }} />
          </div>

          <div className="relative z-10 flex min-h-0 flex-1 flex-col">
            {/* Header */}
            <div className="border-b border-white/10 px-6 py-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 animate-ping rounded-xl bg-violet-500/50" style={{ animationDuration: "2s" }} />
                    <div className="relative rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 p-2.5 shadow-lg shadow-violet-500/25">
                      <Wand2 className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight text-white">AI Outreach Generator</h2>
                    <p className="text-sm text-slate-400">Generate a complete creator outreach sequence</p>
                  </div>
                </div>
                <button
                  onClick={() => !isGenerating && setIsAIDialogOpen(false)}
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-6">
                {/* Goal */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Describe the outreach goal</label>
                  <Textarea
                    placeholder="e.g., Get inactive creators to upload their first product, Re-engage creators who haven't connected Stripe, Welcome new creators and guide them through setup..."
                    value={aiGoal}
                    onChange={(e) => setAIGoal(e.target.value)}
                    rows={4}
                    className="border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:border-violet-500/50 focus:ring-violet-500/20"
                  />
                </div>

                {/* Sequence Length */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-white">Number of emails</label>
                  <div className="flex gap-2">
                    {[3, 5, 7, 10].map((num) => (
                      <button
                        key={num}
                        onClick={() => setAISequenceLength(num)}
                        className={`flex h-10 w-14 items-center justify-center rounded-lg border text-sm font-medium transition-all ${
                          aiSequenceLength === num
                            ? "border-violet-500/50 bg-violet-500/20 text-white ring-1 ring-violet-500/30"
                            : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tone */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-white">Tone</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "casual" as const, label: "Casual", desc: "lol, tbh, ngl" },
                      { id: "friendly" as const, label: "Friendly", desc: "warm & helpful" },
                      { id: "professional" as const, label: "Professional", desc: "polished" },
                    ].map(({ id, label, desc }) => (
                      <button
                        key={id}
                        onClick={() => setAITone(id)}
                        className={`rounded-xl border p-3 text-left transition-all ${
                          aiTone === id
                            ? "border-violet-500/50 bg-violet-500/10 ring-1 ring-violet-500/30"
                            : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                        }`}
                      >
                        <span className="block text-sm font-medium text-white">{label}</span>
                        <span className="block text-xs text-slate-400">{desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Suggestions */}
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wider text-slate-500">Quick ideas</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Get inactive creators to upload their first product",
                      "Guide new creators through Stripe setup",
                      "Re-engage creators who stopped uploading",
                      "Encourage creators to publish their draft courses",
                    ].map((idea) => (
                      <button
                        key={idea}
                        onClick={() => setAIGoal(idea)}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white"
                      >
                        {idea}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-white/10 px-6 py-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  {nodes.length > 1 && "This will replace the current workflow"}
                </p>
                <Button
                  onClick={handleAIGenerate}
                  disabled={isGenerating || !aiGoal.trim()}
                  className="gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate Sequence
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

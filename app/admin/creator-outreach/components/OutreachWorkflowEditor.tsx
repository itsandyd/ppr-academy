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
import { WysiwygEditor, type WysiwygEditorRef } from "@/components/ui/wysiwyg-editor";
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
import { AdminLoading } from "../../components/admin-loading";
import OutreachWorkflowCanvas, { defaultNodeData } from "./OutreachWorkflowCanvas";
import OutreachNodeSidebar from "./OutreachNodeSidebar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  Check,
  Loader2,
  Save,
  Search,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
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

  // Plain text mode (default true for new sequences)
  const [plainTextMode, setPlainTextMode] = useState(true);

  // AI Generate state
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [aiGoal, setAIGoal] = useState("");
  const [aiSequenceLength, setAISequenceLength] = useState(5);
  const [aiTone, setAITone] = useState<"casual" | "friendly" | "professional">("casual");
  const [isGenerating, setIsGenerating] = useState(false);

  // AI single email generation state
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);

  // Email editor dialog (second-level dialog for configuring email content)
  const [isEmailEditorOpen, setIsEmailEditorOpen] = useState(false);

  // Add Creators dialog state
  const [isAddCreatorsOpen, setIsAddCreatorsOpen] = useState(false);
  const [creatorSearchQuery, setCreatorSearchQuery] = useState("");
  const [selectedCreators, setSelectedCreators] = useState<Set<string>>(new Set());
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isEnrollingAll, setIsEnrollingAll] = useState(false);

  // Editor ref for merge tag insertion
  const wysiwygRef = useRef<WysiwygEditorRef>(null);

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
  const enrollCreatorsMut = useMutation(api.admin.creatorOutreach.enrollCreatorsInSequence);

  // Creator list for Add Creators dialog
  const creatorList = useQuery(
    api.admin.creatorOutreach.getCreatorOutreachList,
    isAddCreatorsOpen ? { clerkId } : "skip"
  );

  // Load existing sequence
  useEffect(() => {
    if (existingSequence && !hasInitialized) {
      setWorkflowName(existingSequence.name);
      setPlainTextMode(existingSequence.plainTextMode ?? true);
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
          plainTextMode,
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
          plainTextMode,
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
        plainTextMode,
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
        plainTextMode,
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
    if (!wysiwygRef.current) return;
    wysiwygRef.current.insertText(tag);
  };

  // ─── Add Creators helpers ──────────────────────────────────────────────
  const filteredCreators = (creatorList ?? []).filter((c) => {
    if (!creatorSearchQuery) return true;
    const q = creatorSearchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.storeName || "").toLowerCase().includes(q)
    );
  });

  const toggleCreatorSelection = (userId: string) => {
    setSelectedCreators((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const toggleAllCreators = () => {
    if (selectedCreators.size === filteredCreators.length) {
      setSelectedCreators(new Set());
    } else {
      setSelectedCreators(new Set(filteredCreators.map((c) => c.userId)));
    }
  };

  const handleEnrollCreators = async () => {
    if (!sequenceId || selectedCreators.size === 0) return;
    setIsEnrolling(true);
    try {
      const creatorsToEnroll = filteredCreators
        .filter((c) => selectedCreators.has(c.userId))
        .map((c) => ({
          userId: c.userId,
          email: c.email,
          name: c.name,
          storeId: c.storeId,
          storeSlug: c.storeSlug,
        }));
      const result = await enrollCreatorsMut({
        clerkId,
        sequenceId: sequenceId as Id<"adminOutreachSequences">,
        creators: creatorsToEnroll,
      });
      toast({
        title: `Enrolled ${result.enrolled} creator${result.enrolled !== 1 ? "s" : ""}`,
        description: result.skipped > 0 ? `${result.skipped} already enrolled` : undefined,
      });
      setSelectedCreators(new Set());
      setIsAddCreatorsOpen(false);
    } catch (error) {
      toast({ title: "Failed to enroll", description: String(error), variant: "destructive" });
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleEnrollAllCreators = async () => {
    if (!sequenceId || !creatorList?.length) return;
    setIsEnrollingAll(true);
    try {
      const allCreators = creatorList.map((c) => ({
        userId: c.userId,
        email: c.email,
        name: c.name,
        storeId: c.storeId,
        storeSlug: c.storeSlug,
      }));
      const result = await enrollCreatorsMut({
        clerkId,
        sequenceId: sequenceId as Id<"adminOutreachSequences">,
        creators: allCreators,
      });
      toast({
        title: `Enrolled ${result.enrolled} creator${result.enrolled !== 1 ? "s" : ""}`,
        description: result.skipped > 0 ? `${result.skipped} already enrolled` : undefined,
      });
      setIsAddCreatorsOpen(false);
    } catch (error) {
      toast({ title: "Failed to enroll", description: String(error), variant: "destructive" });
    } finally {
      setIsEnrollingAll(false);
    }
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
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-2 py-2 dark:border-zinc-800 dark:bg-zinc-950 md:px-4 md:py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => router.push("/admin/creator-outreach")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Input
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="min-w-0 flex-1 border-none bg-transparent text-base font-semibold focus-visible:ring-0 md:max-w-64 md:text-lg"
            placeholder="Sequence name..."
          />
        </div>
        <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
          <div className="flex items-center gap-2 rounded-md border px-2 py-1 md:px-3 md:py-1.5">
            <span className="hidden text-sm md:inline">
              {plainTextMode ? "Plain Text" : "Rich Text"}
            </span>
            <Switch
              id="plainTextMode"
              checked={plainTextMode}
              onCheckedChange={setPlainTextMode}
              className="scale-75 md:scale-90"
            />
          </div>
          {sequenceId && (
            <Button
              variant="outline"
              onClick={() => setIsAddCreatorsOpen(true)}
              className="h-8 w-8 md:h-9 md:w-auto md:gap-2 md:px-3"
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden md:inline">Add Creators</span>
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setIsAIDialogOpen(true)}
            className="h-8 gap-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 md:h-9 md:px-3"
          >
            <Wand2 className="h-4 w-4 text-purple-600" />
            <span className="hidden md:inline">AI Generate</span>
          </Button>
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

      {/* Main editor area */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
        <OutreachNodeSidebar onAddNode={addNodeFn ?? undefined} />

        <div className="min-h-0 flex-1">
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
            <div className="mt-6 space-y-4">
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

              {/* Send Email config — preview + "Configure Email" button (matches email workflows) */}
              {selectedNode.type === "sendEmail" && (
                <>
                  <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                    {selectedNode.data.subject ? (
                      <>
                        <p className="text-xs text-zinc-500">Subject:</p>
                        <p className="text-sm font-medium">{selectedNode.data.subject}</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          From: Andrew &lt;andrew@pauseplayrepeat.com&gt;
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-zinc-500">No email configured</p>
                    )}
                  </div>

                  <Button className="w-full" onClick={() => setIsEmailEditorOpen(true)}>
                    {selectedNode.data.subject ? "Edit Email" : "Configure Email"}
                  </Button>
                </>
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
                      <SelectTrigger className="bg-white dark:bg-black">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-black">
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
                        value={selectedNode.data.delayUnit || "days"}
                        onValueChange={(v) =>
                          updateNodeData(selectedNode.id, { delayUnit: v })
                        }
                      >
                        <SelectTrigger className="bg-white dark:bg-black">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-black">
                          <SelectItem value="minutes">Minutes</SelectItem>
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

      {/* ─── Email Editor Dialog (matches email workflows Configure Email) ── */}
      <Dialog open={isEmailEditorOpen} onOpenChange={setIsEmailEditorOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto bg-white dark:bg-black">
          <DialogHeader>
            <DialogTitle>Configure Email</DialogTitle>
            <DialogDescription>
              Write your outreach email content
            </DialogDescription>
          </DialogHeader>

          {selectedNode?.type === "sendEmail" && (
            <div className="space-y-6 py-4">
              {/* AI Email Generator */}
              <div className="rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 p-4 dark:border-purple-900 dark:from-purple-950/30 dark:to-blue-950/30">
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <span className="font-semibold text-purple-800 dark:text-purple-200">AI Email Generator</span>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Tone</Label>
                    <Select
                      value={aiTone}
                      onValueChange={(v) => setAITone(v as typeof aiTone)}
                    >
                      <SelectTrigger className="bg-white dark:bg-black">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-black">
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button
                      onClick={handleAIGenerateEmail}
                      disabled={isGeneratingEmail}
                      className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
                    >
                      {isGeneratingEmail ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Generate Email
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Subject + Preview Text (2-col grid) */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Subject Line *</Label>
                  <Input
                    value={selectedNode.data.subject || ""}
                    onChange={(e) =>
                      updateNodeData(selectedNode.id, { subject: e.target.value })
                    }
                    placeholder="Hey {{firstName}}, quick question"
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

              {/* Email Body */}
              <div className="space-y-2">
                <Label>Email Body</Label>
                {plainTextMode ? (
                  <Textarea
                    value={selectedNode.data.htmlContent || ""}
                    onChange={(e) =>
                      updateNodeData(selectedNode.id, {
                        htmlContent: e.target.value,
                        textContent: e.target.value,
                      })
                    }
                    placeholder="Write your email content here... (plain text, paste raw URLs)"
                    className="min-h-[350px] font-mono text-sm"
                    rows={15}
                  />
                ) : (
                  <WysiwygEditor
                    ref={wysiwygRef}
                    content={selectedNode.data.htmlContent || ""}
                    onChange={(html) =>
                      updateNodeData(selectedNode.id, { htmlContent: html })
                    }
                    placeholder="Write your email content here..."
                    className="min-h-[350px]"
                  />
                )}
              </div>

              {/* Merge tag buttons */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  {plainTextMode ? "Copy merge tag" : "Insert merge tag"}
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {MERGE_TAGS.map(({ label, tag }) => (
                    <Button
                      key={tag}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (plainTextMode) {
                          navigator.clipboard.writeText(tag);
                          toast({ title: `Copied ${tag}` });
                        } else {
                          insertMergeTag(tag);
                        }
                      }}
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

          <DialogFooter>
            <Button onClick={() => setIsEmailEditorOpen(false)}>Done</Button>
          </DialogFooter>
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

      {/* ─── Add Creators Dialog ─────────────────────────────────────────── */}
      <Dialog open={isAddCreatorsOpen} onOpenChange={setIsAddCreatorsOpen}>
        <DialogContent className="max-h-[80vh] max-w-lg bg-white dark:bg-black">
          <DialogHeader>
            <DialogTitle>Add Creators to Sequence</DialogTitle>
            <DialogDescription>
              Select creators to enroll in this outreach sequence
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Enroll All Option */}
            {creatorList && creatorList.length > 0 && (
              <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-900 dark:bg-purple-950/30">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
                      Enroll All Creators
                    </p>
                    <p className="text-xs text-purple-600 dark:text-purple-400">
                      Add all {creatorList.length.toLocaleString()} creators to this sequence
                    </p>
                  </div>
                  <Button
                    onClick={handleEnrollAllCreators}
                    disabled={isEnrollingAll}
                    className="shrink-0 gap-2 bg-purple-600 hover:bg-purple-700"
                  >
                    <Users className="h-4 w-4" />
                    {isEnrollingAll ? "Enrolling..." : "Enroll All"}
                  </Button>
                </div>
              </div>
            )}

            <div className="relative flex items-center gap-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">or select specific creators</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search creators..."
                className="pl-10"
                value={creatorSearchQuery}
                onChange={(e) => setCreatorSearchQuery(e.target.value)}
              />
            </div>

            {selectedCreators.size > 0 && (
              <div className="flex items-center justify-between rounded-md bg-primary/10 px-3 py-2">
                <span className="text-sm font-medium">
                  {selectedCreators.size} creator{selectedCreators.size !== 1 ? "s" : ""} selected
                </span>
                <Button variant="ghost" size="sm" onClick={() => setSelectedCreators(new Set())}>
                  Clear
                </Button>
              </div>
            )}

            <div className="max-h-[300px] overflow-y-auto rounded-md border">
              {filteredCreators.length > 0 && (
                <div
                  className="flex cursor-pointer items-center gap-3 border-b bg-muted/50 px-3 py-2"
                  onClick={toggleAllCreators}
                >
                  <Checkbox
                    checked={
                      filteredCreators.length > 0 &&
                      selectedCreators.size === filteredCreators.length
                    }
                    onCheckedChange={toggleAllCreators}
                  />
                  <span className="text-sm font-medium">Select All</span>
                </div>
              )}
              {creatorList === undefined ? (
                <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                  Loading creators...
                </div>
              ) : filteredCreators.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-8">
                  <Users className="h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    {creatorSearchQuery ? `No creators match "${creatorSearchQuery}"` : "No creators found"}
                  </p>
                </div>
              ) : (
                filteredCreators.slice(0, 100).map((creator) => (
                  <div
                    key={creator.userId}
                    className="flex cursor-pointer items-center gap-3 border-b px-3 py-2 last:border-b-0 hover:bg-muted/50"
                    onClick={() => toggleCreatorSelection(creator.userId)}
                  >
                    <Checkbox
                      checked={selectedCreators.has(creator.userId)}
                      onCheckedChange={() => toggleCreatorSelection(creator.userId)}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {creator.name || creator.email}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {creator.email}
                        {creator.storeName && ` · ${creator.storeName}`}
                      </div>
                    </div>
                    {creator.outreachStatus && (
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {creator.outreachStatus}
                      </span>
                    )}
                  </div>
                ))
              )}
              {filteredCreators.length > 100 && (
                <div className="px-3 py-2 text-center text-xs text-muted-foreground">
                  Showing 100 of {filteredCreators.length} creators
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCreatorsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEnrollCreators}
              disabled={selectedCreators.size === 0 || isEnrolling}
              className="gap-2"
            >
              <UserPlus className="h-4 w-4" />
              {isEnrolling
                ? "Enrolling..."
                : `Enroll ${selectedCreators.size} Creator${selectedCreators.size !== 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

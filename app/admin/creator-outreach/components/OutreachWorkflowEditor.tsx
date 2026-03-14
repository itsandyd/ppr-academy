"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
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
import { useToast } from "@/hooks/use-toast";
import { AdminLoading } from "../../components/admin-loading";
import OutreachWorkflowCanvas, { defaultNodeData } from "./OutreachWorkflowCanvas";
import OutreachNodeSidebar from "./OutreachNodeSidebar";
import {
  ArrowLeft,
  Save,
  Trash2,
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

  // Queries
  const existingSequence = useQuery(
    api.admin.creatorOutreach.getOutreachSequence,
    sequenceId
      ? { clerkId, sequenceId: sequenceId as Id<"adminOutreachSequences"> }
      : "skip"
  );

  // Mutations
  const createSequenceMut = useMutation(api.admin.creatorOutreach.createOutreachSequence);
  const updateSequenceMut = useMutation(api.admin.creatorOutreach.updateOutreachSequence);

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

        {/* Right panel - Node config */}
        {selectedNode && (
          <div className="w-80 flex-shrink-0 overflow-y-auto border-l bg-white p-4 dark:bg-zinc-950">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Node Settings
              </h3>
              {selectedNode.type !== "outreachTrigger" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteNode(selectedNode.id)}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

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
                  <Label>Body</Label>
                  <Textarea
                    placeholder={`Hey {{firstName}},\n\nI noticed you signed up for PPR...\n\n- Andrew`}
                    value={selectedNode.data.htmlContent || ""}
                    onChange={(e) =>
                      updateNodeData(selectedNode.id, { htmlContent: e.target.value })
                    }
                    rows={12}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Merge tags: {"{{firstName}}"}, {"{{name}}"}, {"{{email}}"},{" "}
                  {"{{storeName}}"}, {"{{storeSlug}}"}
                </p>
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
      </div>

      {/* Mobile bottom bar */}
      <div className="md:hidden">
        <OutreachNodeSidebar onAddNode={addNodeFn ?? undefined} />
      </div>
    </div>
  );
}

"use client";

import { useCallback, useRef, useState, useEffect, DragEvent, useMemo } from "react";
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  ReactFlowProvider,
  ReactFlowInstance,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
} from "reactflow";
import "reactflow/dist/style.css";

import TriggerNode from "./nodes/TriggerNode";
import EmailNode from "./nodes/EmailNode";
import DelayNode from "./nodes/DelayNode";
import ConditionNode from "./nodes/ConditionNode";
import ActionNode from "./nodes/ActionNode";
import StopNode from "./nodes/StopNode";
import WebhookNode from "./nodes/WebhookNode";
import SplitNode from "./nodes/SplitNode";
import NotifyNode from "./nodes/NotifyNode";
import GoalNode from "./nodes/GoalNode";

const nodeTypes = {
  trigger: TriggerNode,
  email: EmailNode,
  delay: DelayNode,
  condition: ConditionNode,
  action: ActionNode,
  stop: StopNode,
  webhook: WebhookNode,
  split: SplitNode,
  notify: NotifyNode,
  goal: GoalNode,
};

const defaultNodeData: Record<string, object> = {
  trigger: { triggerType: "lead_signup", description: "When a lead signs up" },
  email: { subject: "New Email", templateName: "" },
  delay: { delayValue: 1, delayUnit: "days" },
  condition: { conditionType: "opened_email", description: "" },
  action: { actionType: "add_tag", value: "" },
  stop: {},
  webhook: { webhookUrl: "", method: "POST" },
  split: { splitPercentage: 50 },
  notify: { notifyMethod: "email", message: "" },
  goal: { goalType: "purchase" },
};

interface WorkflowCanvasProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  nodeExecutionCounts?: Record<string, number>;
  onNodesChange?: (nodes: Node[]) => void;
  onEdgesChange?: (edges: Edge[]) => void;
  onNodeSelect?: (node: Node | null) => void;
  onAddNodeRef?: (addNode: (type: string) => void) => void;
}

let nodeId = 0;
const getId = () => `node_${nodeId++}`;

function WorkflowCanvasInner({
  initialNodes = [],
  initialEdges = [],
  nodeExecutionCounts = {},
  onNodesChange: onNodesChangeCallback,
  onEdgesChange: onEdgesChangeCallback,
  onNodeSelect,
  onAddNodeRef,
}: WorkflowCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Track pending callbacks to avoid calling during render
  const pendingNodesUpdate = useRef<Node[] | null>(null);
  const pendingEdgesUpdate = useRef<Edge[] | null>(null);

  useEffect(() => {
    if (initialNodes.length > 0 || initialEdges.length > 0) {
      setNodes(initialNodes);
      setEdges(initialEdges);
      setInitialized(true);
      const maxId = initialNodes.reduce((max, n) => {
        const match = n.id.match(/node_(\d+)/);
        return match ? Math.max(max, parseInt(match[1], 10)) : max;
      }, 0);
      nodeId = maxId + 1;
    }
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Sync nodes changes to parent after render is complete
  useEffect(() => {
    if (pendingNodesUpdate.current !== null) {
      onNodesChangeCallback?.(pendingNodesUpdate.current);
      pendingNodesUpdate.current = null;
    }
  });

  // Sync edges changes to parent after render is complete
  useEffect(() => {
    if (pendingEdgesUpdate.current !== null) {
      onEdgesChangeCallback?.(pendingEdgesUpdate.current);
      pendingEdgesUpdate.current = null;
    }
  });

  const nodesWithCounts = useMemo(() => nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      waitingCount: nodeExecutionCounts[node.id] || 0,
    },
  })), [nodes, nodeExecutionCounts]);

  const addNodeToCanvas = useCallback(
    (type: string) => {
      const yOffset = nodes.length * 100;
      const newNode: Node = {
        id: getId(),
        type,
        position: { x: 250, y: 50 + yOffset },
        data: { ...defaultNodeData[type] },
      };
      const newNodes = [...nodes, newNode];
      setNodes(newNodes);
      pendingNodesUpdate.current = newNodes;
    },
    [nodes, setNodes]
  );

  useEffect(() => {
    onAddNodeRef?.(addNodeToCanvas);
  }, [onAddNodeRef, addNodeToCanvas]);

  const onConnect = useCallback(
    (connection: Connection) => {
      const newEdges = addEdge(
        {
          ...connection,
          type: "smoothstep",
          animated: true,
          style: { stroke: "#6366f1", strokeWidth: 2 },
        },
        edges
      );
      setEdges(newEdges);
      pendingEdgesUpdate.current = newEdges;
    },
    [edges, setEdges]
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow");
      if (!type || !reactFlowInstance || !reactFlowWrapper.current) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      const newNode: Node = {
        id: getId(),
        type,
        position,
        data: { ...defaultNodeData[type] },
      };

      const newNodes = [...nodes, newNode];
      setNodes(newNodes);
      pendingNodesUpdate.current = newNodes;
    },
    [reactFlowInstance, nodes, setNodes]
  );

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // Apply changes and get the new nodes
      setNodes((nds) => {
        const updatedNodes = applyNodeChanges(changes, nds);
        // Schedule parent callback for after render
        pendingNodesUpdate.current = updatedNodes;
        return updatedNodes;
      });
    },
    [setNodes]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      // Apply changes and get the new edges
      setEdges((eds) => {
        const updatedEdges = applyEdgeChanges(changes, eds);
        // Schedule parent callback for after render
        pendingEdgesUpdate.current = updatedEdges;
        return updatedEdges;
      });
    },
    [setEdges]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onNodeSelect?.(node);
    },
    [onNodeSelect]
  );

  const onPaneClick = useCallback(() => {
    onNodeSelect?.(null);
  }, [onNodeSelect]);

  return (
    <div ref={reactFlowWrapper} className="h-full w-full">
      <ReactFlow
        nodes={nodesWithCounts}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        deleteKeyCode={["Backspace", "Delete"]}
        defaultEdgeOptions={{
          type: "smoothstep",
          animated: true,
          deletable: true,
          style: { stroke: "#6366f1", strokeWidth: 2 },
        }}
        edgesUpdatable
        edgesFocusable
        className="bg-zinc-100 dark:bg-zinc-900"
      >
        <Controls className="!border-zinc-300 !bg-white !shadow-md dark:!border-zinc-700 dark:!bg-zinc-800 [&>button:hover]:!bg-zinc-100 dark:[&>button:hover]:!bg-zinc-700 [&>button]:!border-zinc-300 [&>button]:!bg-white dark:[&>button]:!border-zinc-700 dark:[&>button]:!bg-zinc-800" />
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#71717a" />
      </ReactFlow>
    </div>
  );
}

export default function WorkflowCanvas(props: WorkflowCanvasProps) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}

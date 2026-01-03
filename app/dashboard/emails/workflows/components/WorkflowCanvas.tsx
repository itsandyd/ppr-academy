"use client";

import { useCallback, useRef, useState, useEffect, DragEvent } from "react";
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
} from "reactflow";
import "reactflow/dist/style.css";

import TriggerNode from "./nodes/TriggerNode";
import EmailNode from "./nodes/EmailNode";
import DelayNode from "./nodes/DelayNode";
import ConditionNode from "./nodes/ConditionNode";
import ActionNode from "./nodes/ActionNode";

const nodeTypes = {
  trigger: TriggerNode,
  email: EmailNode,
  delay: DelayNode,
  condition: ConditionNode,
  action: ActionNode,
};

const defaultNodeData: Record<string, object> = {
  trigger: { triggerType: "lead_signup", description: "When a lead signs up" },
  email: { subject: "New Email", templateName: "" },
  delay: { delayValue: 1, delayUnit: "days" },
  condition: { conditionType: "opened_email", description: "" },
  action: { actionType: "add_tag", value: "" },
};

interface WorkflowCanvasProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
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
  onNodesChange: onNodesChangeCallback,
  onEdgesChange: onEdgesChangeCallback,
  onNodeSelect,
  onAddNodeRef,
}: WorkflowCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [initialized, setInitialized] = useState(false);

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
      onNodesChangeCallback?.(newNodes);
    },
    [nodes, setNodes, onNodesChangeCallback]
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
      onEdgesChangeCallback?.(newEdges);
    },
    [edges, setEdges, onEdgesChangeCallback]
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
      onNodesChangeCallback?.(newNodes);
    },
    [reactFlowInstance, nodes, setNodes, onNodesChangeCallback]
  );

  const handleNodesChange = useCallback(
    (changes: Parameters<typeof onNodesChange>[0]) => {
      onNodesChange(changes);
      setTimeout(() => {
        onNodesChangeCallback?.(nodes);
      }, 0);
    },
    [onNodesChange, onNodesChangeCallback, nodes]
  );

  const handleEdgesChange = useCallback(
    (changes: Parameters<typeof onEdgesChange>[0]) => {
      onEdgesChange(changes);
      setTimeout(() => {
        onEdgesChangeCallback?.(edges);
      }, 0);
    },
    [onEdgesChange, onEdgesChangeCallback, edges]
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
        nodes={nodes}
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
        defaultEdgeOptions={{
          type: "smoothstep",
          animated: true,
          style: { stroke: "#6366f1", strokeWidth: 2 },
        }}
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

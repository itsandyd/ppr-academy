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
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
} from "reactflow";
import "reactflow/dist/style.css";

// Custom outreach nodes
import OutreachTriggerNode from "./nodes/OutreachTriggerNode";
import SendEmailNode from "./nodes/SendEmailNode";
import OutreachConditionNode from "./nodes/OutreachConditionNode";
// Reuse shared nodes from the email editor
import DelayNode from "@/app/dashboard/emails/workflows/components/nodes/DelayNode";
import StopNode from "@/app/dashboard/emails/workflows/components/nodes/StopNode";

const nodeTypes = {
  outreachTrigger: OutreachTriggerNode,
  sendEmail: SendEmailNode,
  condition: OutreachConditionNode,
  delay: DelayNode,
  stop: StopNode,
};

export const defaultNodeData: Record<string, object> = {
  outreachTrigger: {
    fromName: "Andrew",
    fromEmail: "andrew@pauseplayrepeat.com",
    replyTo: "andrew@pauseplayrepeat.com",
    stopOnProductUpload: true,
    stopOnReply: true,
  },
  sendEmail: { subject: "", htmlContent: "", textContent: "" },
  condition: { conditionType: "has_products" },
  delay: { delayValue: 3, delayUnit: "days" },
  stop: {},
};

interface OutreachWorkflowCanvasProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onNodesChange?: (nodes: Node[]) => void;
  onEdgesChange?: (edges: Edge[]) => void;
  onNodeSelect?: (node: Node | null) => void;
  onAddNodeRef?: (addNode: (type: string) => void) => void;
}

let nodeId = 0;
const getId = () => `node_${nodeId++}`;

function OutreachWorkflowCanvasInner({
  initialNodes = [],
  initialEdges = [],
  onNodesChange: onNodesChangeCallback,
  onEdgesChange: onEdgesChangeCallback,
  onNodeSelect,
  onAddNodeRef,
}: OutreachWorkflowCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  const pendingNodesUpdate = useRef<Node[] | null>(null);
  const pendingEdgesUpdate = useRef<Edge[] | null>(null);

  useEffect(() => {
    if (initialNodes.length > 0 || initialEdges.length > 0) {
      setNodes(initialNodes);
      setEdges(initialEdges);
      const maxId = initialNodes.reduce((max, n) => {
        const match = n.id.match(/node_(\d+)/);
        return match ? Math.max(max, parseInt(match[1], 10)) : max;
      }, 0);
      nodeId = maxId + 1;
    }
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  useEffect(() => {
    if (pendingNodesUpdate.current !== null) {
      onNodesChangeCallback?.(pendingNodesUpdate.current);
      pendingNodesUpdate.current = null;
    }
  });

  useEffect(() => {
    if (pendingEdgesUpdate.current !== null) {
      onEdgesChangeCallback?.(pendingEdgesUpdate.current);
      pendingEdgesUpdate.current = null;
    }
  });

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
      setNodes((nds) => {
        const updatedNodes = applyNodeChanges(changes, nds);
        pendingNodesUpdate.current = updatedNodes;
        return updatedNodes;
      });
    },
    [setNodes]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds) => {
        const updatedEdges = applyEdgeChanges(changes, eds);
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

export default function OutreachWorkflowCanvas(props: OutreachWorkflowCanvasProps) {
  return (
    <ReactFlowProvider>
      <OutreachWorkflowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}

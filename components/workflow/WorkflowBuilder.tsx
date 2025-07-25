"use client";

import React, { useCallback, useRef, useState, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

// Import custom node components
import TriggerNode from './nodes/TriggerNode';
import EmailNode from './nodes/EmailNode';
import DelayNode from './nodes/DelayNode';
import ConditionNode from './nodes/ConditionNode';
import ActionNode from './nodes/ActionNode';

// Node types registry
const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  email: EmailNode,
  delay: DelayNode,
  condition: ConditionNode,
  action: ActionNode,
};

interface WorkflowBuilderProps {
  workflow?: any;
  storeId: string;
  userId: string;
  onSave?: (workflow: any) => void;
}

export default function WorkflowBuilder({ 
  workflow, 
  storeId, 
  userId, 
  onSave 
}: WorkflowBuilderProps) {
  const { toast } = useToast();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  // Workflow state
  const [workflowName, setWorkflowName] = useState(workflow?.name || 'New Workflow');
  const [workflowDescription, setWorkflowDescription] = useState(workflow?.description || '');
  const [isActive, setIsActive] = useState(workflow?.isActive || false);
  const [isSaving, setIsSaving] = useState(false);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState(workflow?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(workflow?.edges || []);

  // Convex mutations
  const updateWorkflow = useMutation(api.emailWorkflows.updateWorkflow);
  const createWorkflow = useMutation(api.emailWorkflows.createWorkflow);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Handle node deletion
  const onNodesDelete = useCallback(
    (deletedNodes: Node[]) => {
      // Remove associated edges when nodes are deleted
      const deletedNodeIds = deletedNodes.map(node => node.id);
      setEdges((eds) => eds.filter((edge) => 
        !deletedNodeIds.includes(edge.source) && !deletedNodeIds.includes(edge.target)
      ));
    },
    [setEdges]
  );

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Delete selected nodes when Delete or Backspace is pressed
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const selectedNodes = nodes.filter(node => node.selected);
        if (selectedNodes.length > 0) {
          // Prevent deleting if it's a trigger node (first node)
          const hasTriggersSelected = selectedNodes.some(node => node.type === 'trigger');
          if (hasTriggersSelected) {
            toast({
              title: "Cannot delete trigger node",
              description: "Trigger nodes cannot be deleted as they start the workflow.",
              variant: "destructive",
            });
            return;
          }

          // Remove selected nodes
          setNodes(nds => nds.filter(node => !node.selected));
          
          // Remove associated edges
          const selectedNodeIds = selectedNodes.map(node => node.id);
          setEdges(eds => eds.filter(edge => 
            !selectedNodeIds.includes(edge.source) && !selectedNodeIds.includes(edge.target)
          ));
          
          toast({
            title: "Nodes deleted",
            description: `Deleted ${selectedNodes.length} node(s)`,
          });
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [nodes, setNodes, setEdges, toast]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      
      if (typeof type === 'undefined' || !type) {
        return;
      }

      if (!reactFlowInstance) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: getDefaultNodeData(type),
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const getDefaultNodeData = (type: string) => {
    switch (type) {
      case 'trigger':
        return {
          label: 'Lead Signup',
          triggerType: 'lead_signup',
        };
      case 'email':
        return {
          label: 'Send Email',
          subject: 'Welcome!',
          body: 'Thank you for signing up!',
        };
      case 'delay':
        return {
          label: 'Wait',
          delay: 1,
          unit: 'days',
        };
      case 'condition':
        return {
          label: 'Condition',
          field: 'email',
          operator: 'contains',
          value: '@gmail.com',
        };
      case 'action':
        return {
          label: 'Action',
          actionType: 'add_tag',
          tag: 'customer',
        };
      default:
        return { label: 'Node' };
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let result;
      
      if (workflow?._id) {
        // Update existing workflow
        result = await updateWorkflow({
          workflowId: workflow._id,
          name: workflowName,
          description: workflowDescription,
          isActive,
          nodes: nodes.map(node => ({
            id: node.id,
            type: node.type as "email" | "action" | "trigger" | "delay" | "condition",
            position: node.position,
            data: node.data
          })),
          edges: edges.map(edge => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle || undefined,
            targetHandle: edge.targetHandle || undefined
          })),
        });
      } else {
        // Create new workflow
        const workflowId = await createWorkflow({
          name: workflowName,
          description: workflowDescription,
          storeId,
          userId,
        });
        
        // Then update it with the nodes and edges
        result = await updateWorkflow({
          workflowId,
          name: workflowName,
          description: workflowDescription,
          isActive,
          nodes: nodes.map(node => ({
            id: node.id,
            type: node.type as "email" | "action" | "trigger" | "delay" | "condition",
            position: node.position,
            data: node.data
          })),
          edges: edges.map(edge => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle || undefined,
            targetHandle: edge.targetHandle || undefined
          })),
        });
      }

      if (result.success) {
        toast({
          title: "Workflow saved",
          description: result.message,
        });
        onSave?.({ 
          ...workflow, 
          name: workflowName, 
          description: workflowDescription, 
          isActive, 
          nodes, 
          edges 
        });
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save workflow",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-screen flex w-full">
      {/* Sidebar */}
      <div className="w-120 bg-background border-r border-secondary p-3 space-y-3 overflow-y-auto flex-shrink-0">
        {/* Workflow Settings */}
        <Card className="border-card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="name" className="text-sm">Name</Label>
              <Input
                id="name"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                placeholder="Workflow name..."
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="description" className="text-sm">Description</Label>
              <Input
                id="description"
                value={workflowDescription}
                onChange={(e) => setWorkflowDescription(e.target.value)}
                placeholder="Description..."
                className="h-8 text-sm"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="active" className="text-sm">Active</Label>
              <Switch
                id="active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="w-full h-8 text-sm"
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </CardContent>
        </Card>

        {/* Node Palette */}
        <Card className="border-card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Nodes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <NodePaletteItem 
              type="trigger" 
              label="🎯 Trigger" 
              description="Start the workflow"
            />
            <NodePaletteItem 
              type="email" 
              label="📧 Send Email" 
              description="Send an email to customer"
            />
            <NodePaletteItem 
              type="delay" 
              label="⏱️ Delay" 
              description="Wait before next action"
            />
            <NodePaletteItem 
              type="condition" 
              label="🔍 Condition" 
              description="Branch based on condition"
            />
            <NodePaletteItem 
              type="action" 
              label="⚡ Action" 
              description="Perform an action"
            />
          </CardContent>
        </Card>
      </div>

      {/* Main Flow Canvas */}
      <div className="flex-1 min-w-0" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodesDelete={onNodesDelete}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
          className="bg-background"
          deleteKeyCode={['Delete', 'Backspace']}
        >
          <Background color="#aaa" gap={16} />
          <Controls />
          <MiniMap />
          <Panel position="top-right">
            <Card className="p-2 border-elegant max-w-xs">
              <div className="text-xs text-muted-foreground">
                💡 Drag nodes from sidebar • Hover to edit/delete
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                🔧 Blue = Edit • Red = Delete
              </div>
            </Card>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}

// Node palette item component
interface NodePaletteItemProps {
  type: string;
  label: string;
  description: string;
}

function NodePaletteItem({ type, label, description }: NodePaletteItemProps) {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className="p-2 border-interactive rounded-md cursor-grab hover:bg-accent/50 transition-colors"
      onDragStart={(event) => onDragStart(event, type)}
      draggable
    >
      <div className="font-medium text-xs">{label}</div>
      <div className="text-xs text-muted-foreground leading-tight">{description}</div>
    </div>
  );
} 
import React, { useState } from 'react';
import { Handle, Position, type NodeProps, useReactFlow } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';

interface ActionNodeData {
  label: string;
  actionType: string;
  tag?: string;
}

export default function ActionNode({ data, id }: NodeProps<ActionNodeData>) {
  const { deleteElements, setNodes } = useReactFlow();
  const [isEditing, setIsEditing] = useState(false);
  const [actionType, setActionType] = useState(data.actionType);
  const [tag, setTag] = useState(data.tag || '');

  const handleDelete = () => {
    deleteElements({ nodes: [{ id }] });
  };

  const handleSave = () => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? {
              ...node,
              data: {
                ...node.data,
                actionType,
                tag,
              },
            }
          : node
      )
    );
    setIsEditing(false);
  };

  return (
    <Card className="min-w-[200px] border-orange-200 bg-orange-50 relative group">
      <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-6 h-6 p-0 bg-blue-500 text-white rounded-full hover:bg-blue-600"
            >
              <Settings className="w-3 h-3" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md !bg-white" style={{ backgroundColor: 'white !important' }}>
            <DialogHeader>
              <DialogTitle>Edit Action</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="actionType">Action Type</Label>
                <Select value={actionType} onValueChange={setActionType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add_tag">Add Tag</SelectItem>
                    <SelectItem value="remove_tag">Remove Tag</SelectItem>
                    <SelectItem value="update_field">Update Field</SelectItem>
                    <SelectItem value="webhook">Call Webhook</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(actionType === 'add_tag' || actionType === 'remove_tag') && (
                <div>
                  <Label htmlFor="tag">Tag</Label>
                  <Input
                    id="tag"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    placeholder="Enter tag name"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleSave}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button
          variant="ghost"
          size="sm"
          className="w-6 h-6 p-0 bg-red-500 text-white rounded-full hover:bg-red-600"
          onClick={handleDelete}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-orange-800">⚡ {data.label}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-xs text-orange-600">
          Action: {actionType}
          {tag && ` (${tag})`}
        </div>
      </CardContent>
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-orange-500"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-orange-500"
      />
    </Card>
  );
} 
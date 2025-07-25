import React, { useState } from 'react';
import { Handle, Position, type NodeProps, useReactFlow } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';

interface TriggerNodeData {
  label: string;
  triggerType: string;
}

export default function TriggerNode({ data, id }: NodeProps<TriggerNodeData>) {
  const { setNodes } = useReactFlow();
  const [isEditing, setIsEditing] = useState(false);
  const [triggerType, setTriggerType] = useState(data.triggerType);

  const handleSave = () => {
    setNodes((nodes: any) =>
      nodes.map((node: any) =>
        node.id === id
          ? {
              ...node,
              data: {
                ...node.data,
                triggerType,
              },
            }
          : node
      )
    );
    setIsEditing(false);
  };

  return (
    <Card className="min-w-[200px] border-green-200 bg-green-50 relative group">
      <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
              <DialogTitle>Edit Trigger</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="triggerType">Trigger Type</Label>
                <Select value={triggerType} onValueChange={setTriggerType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select trigger" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead_signup">Lead Signup</SelectItem>
                    <SelectItem value="purchase">Purchase</SelectItem>
                    <SelectItem value="abandoned_cart">Abandoned Cart</SelectItem>
                    <SelectItem value="birthday">Birthday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSave}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-green-800">🎯 {data.label}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-xs text-green-600">
          Trigger: {triggerType}
        </div>
      </CardContent>
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-green-500"
      />
    </Card>
  );
} 
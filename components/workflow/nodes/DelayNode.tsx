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

interface DelayNodeData {
  label: string;
  delay: number;
  unit: 'minutes' | 'hours' | 'days';
}

export default function DelayNode({ data, id }: NodeProps<DelayNodeData>) {
  const { deleteElements, setNodes } = useReactFlow();
  const [isEditing, setIsEditing] = useState(false);
  const [delay, setDelay] = useState(data.delay);
  const [unit, setUnit] = useState(data.unit);

  const handleDelete = () => {
    deleteElements({ nodes: [{ id }] });
  };

  const handleSave = () => {
    // Update the node data
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? {
              ...node,
              data: {
                ...node.data,
                delay,
                unit,
              },
            }
          : node
      )
    );
    setIsEditing(false);
  };

  return (
    <Card className="min-w-[200px] border-yellow-200 bg-yellow-50 relative group">
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
              <DialogTitle>Edit Delay Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="delay">Delay Duration</Label>
                <Input
                  id="delay"
                  type="number"
                  min="1"
                  value={delay}
                  onChange={(e) => setDelay(parseInt(e.target.value) || 1)}
                />
              </div>
              <div>
                <Label htmlFor="unit">Time Unit</Label>
                <Select value={unit} onValueChange={(value: 'minutes' | 'hours' | 'days') => setUnit(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minutes">Minutes</SelectItem>
                    <SelectItem value="hours">Hours</SelectItem>
                    <SelectItem value="days">Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
        <CardTitle className="text-sm text-yellow-800">⏱️ {data.label}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-xs text-yellow-600">
          Wait: {delay} {unit}
        </div>
      </CardContent>
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-yellow-500"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-yellow-500"
      />
    </Card>
  );
} 
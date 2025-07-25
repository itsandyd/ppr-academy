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

interface ConditionNodeData {
  label: string;
  field: string;
  operator: string;
  value: string;
}

export default function ConditionNode({ data, id }: NodeProps<ConditionNodeData>) {
  const { deleteElements, setNodes } = useReactFlow();
  const [isEditing, setIsEditing] = useState(false);
  const [field, setField] = useState(data.field);
  const [operator, setOperator] = useState(data.operator);
  const [value, setValue] = useState(data.value);

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
                field,
                operator,
                value,
              },
            }
          : node
      )
    );
    setIsEditing(false);
  };

  return (
    <Card className="min-w-[200px] border-purple-200 bg-purple-50 relative group">
      <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-6 h-6 p-0 bg-primary text-primary-foreground rounded-full hover:bg-primary/90"
            >
              <Settings className="w-3 h-3" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md !bg-white" style={{ backgroundColor: 'white !important' }}>
            <DialogHeader>
              <DialogTitle>Edit Condition</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="field">Field</Label>
                <Select value={field} onValueChange={setField}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="tag">Tag</SelectItem>
                    <SelectItem value="source">Source</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="operator">Operator</Label>
                <Select value={operator} onValueChange={setOperator}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select operator" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contains">Contains</SelectItem>
                    <SelectItem value="equals">Equals</SelectItem>
                    <SelectItem value="starts_with">Starts with</SelectItem>
                    <SelectItem value="ends_with">Ends with</SelectItem>
                    <SelectItem value="not_contains">Does not contain</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="value">Value</Label>
                <Input
                  id="value"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Enter value to compare"
                />
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
          className="w-6 h-6 p-0 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
          onClick={handleDelete}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-purple-800">🔍 {data.label}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-xs text-purple-600">
          If {field} {operator} "{value}"
        </div>
      </CardContent>
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-purple-500"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        style={{ top: '30%' }}
        className="w-3 h-3 bg-primary"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        style={{ top: '70%' }}
        className="w-3 h-3 bg-secondary"
      />
      <div className="absolute right-0 top-[25%] text-xs text-primary font-medium">
        ✓
      </div>
      <div className="absolute right-0 top-[65%] text-xs text-secondary font-medium">
        ✗
      </div>
    </Card>
  );
} 
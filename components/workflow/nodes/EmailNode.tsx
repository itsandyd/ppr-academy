import React, { useState } from 'react';
import { Handle, Position, type NodeProps, useReactFlow } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { X, Settings } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';

interface EmailNodeData {
  label: string;
  subject: string;
  body: string;
  downloadUrl?: string;
}

export default function EmailNode({ data, id }: NodeProps<EmailNodeData>) {
  const [isEditing, setIsEditing] = useState(false);
  const [localData, setLocalData] = useState(data);
  const { deleteElements, setNodes } = useReactFlow();

  const handleSave = () => {
    // Update the node data
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? {
              ...node,
              data: {
                ...node.data,
                subject: localData.subject,
                body: localData.body,
                downloadUrl: localData.downloadUrl,
              },
            }
          : node
      )
    );
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteElements({ nodes: [{ id }] });
  };

  return (
    <>
      <Card className="min-w-[200px] border-blue-200 bg-blue-50 relative group">
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
            <DialogContent className="max-w-md !bg-white dialog-content-override" style={{ backgroundColor: 'white !important' }}>
              <DialogHeader>
                <DialogTitle>Edit Email Content</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={localData.subject}
                    onChange={(e) => setLocalData({...localData, subject: e.target.value})}
                    placeholder="Email subject"
                  />
                </div>
                <div>
                  <Label htmlFor="body">Body</Label>
                  <Textarea
                    id="body"
                    value={localData.body}
                    onChange={(e) => setLocalData({...localData, body: e.target.value})}
                    placeholder="Email content"
                    rows={4}
                  />
                </div>
                {localData.downloadUrl && (
                  <div>
                    <Label htmlFor="downloadUrl">Download URL</Label>
                    <Input
                      id="downloadUrl"
                      value={localData.downloadUrl}
                      onChange={(e) => setLocalData({...localData, downloadUrl: e.target.value})}
                      placeholder="https://example.com/download"
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
          <CardTitle className="text-sm text-blue-800">📧 {data.label}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-xs text-blue-600 mb-2">
            Subject: {localData.subject}
          </div>
          <div className="text-xs text-gray-500">
            Body: {localData.body.substring(0, 50)}...
          </div>
        </CardContent>
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 bg-blue-500"
        />
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 bg-blue-500"
        />
      </Card>
    </>
  );
} 
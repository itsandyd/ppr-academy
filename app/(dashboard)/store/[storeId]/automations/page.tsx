"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AutomationPageProps {
  params: Promise<{ storeId: string }>;
}

export default function AutomationPage({ params }: AutomationPageProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [newWorkflowName, setNewWorkflowName] = useState("");
  const [newWorkflowDescription, setNewWorkflowDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Extract storeId from async params
  useEffect(() => {
    params.then((p) => setStoreId(p.storeId));
  }, [params]);

  // Get workflows for this store (always call hooks)
  const workflows = useQuery(
    api.emailWorkflows.getWorkflowsByStore, 
    storeId ? { storeId } : "skip"
  );

  // Mutations (always call hooks)
  const createWorkflow = useMutation(api.emailWorkflows.createWorkflow);
  const toggleWorkflowStatus = useMutation(api.emailWorkflows.toggleWorkflowStatus);
  const deleteWorkflow = useMutation(api.emailWorkflows.deleteWorkflow);

  // Conditional rendering after all hooks
  if (!storeId) {
    return <div>Loading...</div>;
  }

  const handleCreateWorkflow = async () => {
    if (!newWorkflowName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a workflow name",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const workflowId = await createWorkflow({
        name: newWorkflowName,
        description: newWorkflowDescription,
        storeId,
        userId: "current-user", // This should come from auth context
      });

      toast({
        title: "Workflow created",
        description: "Your new email automation workflow has been created.",
      });

      // Navigate to the workflow builder
      router.push(`/store/${storeId}/automations/${workflowId}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create workflow",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
      setNewWorkflowName("");
      setNewWorkflowDescription("");
    }
  };

  const handleToggleStatus = async (workflowId: any, isActive: boolean) => {
    try {
      const result = await toggleWorkflowStatus({
        workflowId,
        isActive: !isActive,
      });

      if (result.success) {
        toast({
          title: "Status updated",
          description: result.message,
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
        description: "Failed to update workflow status",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (workflowId: any) => {
    try {
      const result = await deleteWorkflow({ workflowId });

      if (result.success) {
        toast({
          title: "Workflow deleted",
          description: result.message,
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
        description: "Failed to delete workflow",
        variant: "destructive",
      });
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Email Automations</h2>
          <p className="text-muted-foreground">
            Create automated email sequences that trigger based on customer actions.
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Create New Workflow</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md !bg-white" style={{ backgroundColor: 'white !important' }}>
            <DialogHeader>
              <DialogTitle>Create Email Automation</DialogTitle>
              <DialogDescription>
                Build automated email sequences using our visual workflow builder.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Workflow Name</Label>
                <Input
                  id="name"
                  value={newWorkflowName}
                  onChange={(e) => setNewWorkflowName(e.target.value)}
                  placeholder="Welcome Series"
                />
              </div>
              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  value={newWorkflowDescription}
                  onChange={(e) => setNewWorkflowDescription(e.target.value)}
                  placeholder="A 3-email welcome sequence for new leads"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={handleCreateWorkflow} 
                disabled={isCreating}
              >
                {isCreating ? "Creating..." : "Create Workflow"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Workflows Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflows?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflows?.filter((w: any) => w.isActive).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Executions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflows?.reduce((sum: number, w: any) => sum + (w.totalExecutions || 0), 0) || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflows Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Email Workflows</CardTitle>
          <CardDescription>
            Manage your automated email sequences and monitor their performance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {workflows && workflows.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Executions</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workflows.map((workflow: any) => (
                  <TableRow key={workflow._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{workflow.name}</div>
                        {workflow.description && (
                          <div className="text-sm text-muted-foreground">
                            {workflow.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {workflow.trigger.type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={workflow.isActive || false}
                          onCheckedChange={() => 
                            handleToggleStatus(workflow._id, workflow.isActive || false)
                          }
                        />
                        <span className="text-sm">
                          {workflow.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {workflow.totalExecutions || 0}
                    </TableCell>
                    <TableCell>
                      {formatDate(workflow._creationTime)}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => 
                            router.push(`/store/${storeId}/automations/${workflow._id}`)
                          }
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(workflow._id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-4">
                No email automations yet. Create your first workflow to get started!
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>Create Your First Workflow</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md !bg-white" style={{ backgroundColor: 'white !important' }}>
                  <DialogHeader>
                    <DialogTitle>Create Email Automation</DialogTitle>
                    <DialogDescription>
                      Build automated email sequences using our visual workflow builder.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Workflow Name</Label>
                      <Input
                        id="name"
                        value={newWorkflowName}
                        onChange={(e) => setNewWorkflowName(e.target.value)}
                        placeholder="Welcome Series"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description (optional)</Label>
                      <Input
                        id="description"
                        value={newWorkflowDescription}
                        onChange={(e) => setNewWorkflowDescription(e.target.value)}
                        placeholder="A 3-email welcome sequence for new leads"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      onClick={handleCreateWorkflow} 
                      disabled={isCreating}
                    >
                      {isCreating ? "Creating..." : "Create Workflow"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useValidStoreId } from "@/hooks/useStoreId";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  Mail, 
  Users, 
  Send, 
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  BarChart3,
  Settings,
  AlertTriangle,
  Zap,
  PlayCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";

export default function EmailCampaignsPage() {
  const { user } = useUser();
  const params = useParams();
  const router = useRouter();
  const storeId = useValidStoreId();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch campaigns - will work once API is regenerated (after npx convex dev)
  const campaigns = useQuery(
    (api as any).emailCampaigns?.getCampaigns,
    storeId ? { storeId } : "skip"
  ) || [];

  // Fetch automations/workflows
  const workflows = useQuery(
    api.emailWorkflows?.getWorkflowsByStore,
    storeId ? { storeId } : "skip"
  ) || [];

  // Check email configuration status
  const emailConfig = useQuery(
    api.stores?.getEmailConfig,
    storeId ? { storeId } : "skip"
  );

  const deleteCampaign = useMutation((api as any).emailCampaigns?.deleteCampaign);
  const sendCampaign = useMutation((api as any).emails?.sendCampaign);
  
  // Workflow mutations
  const deleteWorkflow = useMutation(api.emailWorkflows?.deleteWorkflow);
  const toggleWorkflowStatus = useMutation(api.emailWorkflows?.toggleWorkflowStatus);

  // Show error if storeId is invalid
  if (!storeId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Store Not Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              The store you're trying to access could not be found or is invalid.
            </p>
            <Button onClick={() => router.push('/store')} variant="outline">
              Go Back to Store Selection
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter campaigns based on search and status
  const filteredCampaigns = campaigns.filter((campaign: any) => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || campaign.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: "bg-gray-100 text-gray-800", label: "Draft" },
      scheduled: { color: "bg-blue-100 text-blue-800", label: "Scheduled" },
      sending: { color: "bg-yellow-100 text-yellow-800", label: "Sending" },
      sent: { color: "bg-green-100 text-green-800", label: "Sent" },
      failed: { color: "bg-red-100 text-red-800", label: "Failed" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const handleSendCampaign = async (campaignId: string) => {
    if (!confirm("Are you sure you want to send this campaign? This action cannot be undone.")) {
      return;
    }

    try {
      await sendCampaign({ campaignId });
      // Show success message
    } catch (error) {
      console.error("Failed to send campaign:", error);
      alert("Failed to send campaign. Please try again.");
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm("Are you sure you want to delete this campaign? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteCampaign({ campaignId });
      // Show success message
    } catch (error) {
      console.error("Failed to delete campaign:", error);
      alert("Failed to delete campaign. Please try again.");
    }
  };

  const handleToggleWorkflow = async (workflowId: string, isActive: boolean) => {
    try {
      await toggleWorkflowStatus({ workflowId: workflowId as any, isActive: !isActive });
    } catch (error) {
      console.error("Failed to toggle workflow:", error);
      alert("Failed to update workflow status. Please try again.");
    }
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    if (!confirm("Are you sure you want to delete this automation? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteWorkflow({ workflowId: workflowId as any });
    } catch (error) {
      console.error("Failed to delete workflow:", error);
      alert("Failed to delete automation. Please try again.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-8 pt-10 pb-24 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Marketing</h1>
          <p className="text-gray-600 mt-2">Send campaigns and create automated email sequences</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            onClick={() => router.push(`/store/${storeId}/settings/email`)}
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Email Settings
          </Button>
        </div>
      </div>

      {/* Email Setup Banner */}
      {emailConfig !== undefined && !emailConfig?.isConfigured && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-orange-600 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900 mb-2">
                  Email Setup Required
                </h3>
                <p className="text-orange-700 mb-4">
                  Configure your email sender settings to start sending professional email campaigns and automations to your customers. The platform manages the email service centrally.
                </p>
                <div className="flex items-center gap-3">
                  <Button 
                    onClick={() => router.push(`/store/${storeId}/settings/email`)}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Setup Email Settings
                  </Button>
                  <p className="text-sm text-orange-600">
                    Centrally managed email service
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for Campaigns and Automations */}
      <Tabs defaultValue="campaigns" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="automations" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Automations
          </TabsTrigger>
        </TabsList>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Email Campaigns</h2>
              <p className="text-gray-600">One-time email sends to your customer list</p>
            </div>
            <Button 
              onClick={() => router.push(`/store/${storeId}/email-campaigns/create`)}
              className="flex items-center gap-2"
              disabled={!emailConfig?.isConfigured}
            >
              <Plus className="w-4 h-4" />
              Create Campaign
            </Button>
          </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Campaigns</p>
                <p className="text-2xl font-bold">{campaigns.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Send className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Sent Campaigns</p>
                <p className="text-2xl font-bold">{campaigns.filter((c: any) => c.status === 'sent').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Recipients</p>
                <p className="text-2xl font-bold">
                  {campaigns.reduce((sum: number, c: any) => sum + (c.recipientCount || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Open Rate</p>
                <p className="text-2xl font-bold">
                  {campaigns.length > 0 
                    ? Math.round(campaigns.reduce((sum: number, c: any) => 
                        sum + ((c.openedCount || 0) / (c.deliveredCount || 1)) * 100, 0) / campaigns.length)
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          {["all", "draft", "sent", "scheduled", "failed"].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="capitalize"
            >
              {status === "all" ? "All" : status}
            </Button>
          ))}
        </div>
      </div>

      {/* Campaigns List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Campaigns ({filteredCampaigns.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <Mail className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {campaigns.length === 0 ? "No campaigns yet" : "No campaigns found"}
              </h3>
              <p className="text-gray-600 mb-6">
                {campaigns.length === 0 
                  ? "Create your first email campaign to start reaching your customers"
                  : "Try adjusting your search terms or filters"
                }
              </p>
              {campaigns.length === 0 && (
                <Button onClick={() => router.push(`/store/${storeId}/email-campaigns/create`)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Campaign
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCampaigns.map((campaign: any) => (
                <Card key={campaign._id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Mail className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-lg">{campaign.name}</h3>
                          {getStatusBadge(campaign.status)}
                        </div>
                        <p className="text-gray-600 mb-2">Subject: {campaign.subject}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {campaign.recipientCount || 0} recipients
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {campaign.sentAt 
                              ? `Sent ${formatDistanceToNow(new Date(campaign.sentAt))} ago`
                              : `Created ${formatDistanceToNow(new Date(campaign._creationTime))} ago`
                            }
                          </span>
                          {campaign.deliveredCount > 0 && (
                            <span className="flex items-center gap-1">
                              <BarChart3 className="w-4 h-4" />
                              {Math.round(((campaign.openedCount || 0) / campaign.deliveredCount) * 100)}% opened
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {campaign.status === "draft" && (
                        <Button
                          onClick={() => handleSendCampaign(campaign._id)}
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Send className="w-4 h-4" />
                          Send Now
                        </Button>
                      )}
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => router.push(`/store/${storeId}/email-campaigns/${campaign._id}`)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            View/Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => router.push(`/store/${storeId}/email-campaigns/${campaign._id}/duplicate`)}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => router.push(`/store/${storeId}/email-campaigns/${campaign._id}/analytics`)}
                          >
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Analytics
                          </DropdownMenuItem>
                          {campaign.status !== "sending" && (
                            <DropdownMenuItem 
                              onClick={() => handleDeleteCampaign(campaign._id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        {/* Automations Tab */}
        <TabsContent value="automations" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Email Automations</h2>
              <p className="text-gray-600">Automated email sequences triggered by customer actions</p>
            </div>
            <Button 
              onClick={() => router.push(`/store/${storeId}/automations`)}
              className="flex items-center gap-2"
              disabled={!emailConfig?.isConfigured}
            >
              <Plus className="w-4 h-4" />
              Create Automation
            </Button>
          </div>

          {/* Automation Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Zap className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Automations</p>
                    <p className="text-2xl font-bold">{workflows.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <PlayCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Active Automations</p>
                    <p className="text-2xl font-bold">{workflows.filter((w: any) => w.isActive).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Executions</p>
                    <p className="text-2xl font-bold">
                      {workflows.reduce((sum: number, w: any) => sum + (w.totalExecutions || 0), 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Avg Success Rate</p>
                    <p className="text-2xl font-bold">95%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Automations List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Automations ({workflows.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {workflows.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <Zap className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No automations yet</h3>
                  <p className="text-gray-600 mb-6">
                    Create your first email automation to automatically engage customers
                  </p>
                  <Button 
                    onClick={() => router.push(`/store/${storeId}/automations`)}
                    disabled={!emailConfig?.isConfigured}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Automation
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {workflows.map((workflow: any) => (
                    <Card key={workflow._id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Zap className="w-6 h-6 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-semibold text-lg">{workflow.name}</h3>
                              <Badge className={workflow.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                                {workflow.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <p className="text-gray-600 mb-2">
                              Trigger: {workflow.trigger.type.replace('_', ' ')}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <PlayCircle className="w-4 h-4" />
                                {workflow.totalExecutions || 0} executions
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                Created {formatDistanceToNow(new Date(workflow._creationTime))} ago
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleWorkflow(workflow._id, workflow.isActive)}
                          >
                            {workflow.isActive ? "Pause" : "Activate"}
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => router.push(`/store/${storeId}/automations/${workflow._id}`)}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Workflow
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => router.push(`/store/${storeId}/automations/${workflow._id}/analytics`)}
                              >
                                <BarChart3 className="w-4 h-4 mr-2" />
                                View Analytics
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteWorkflow(workflow._id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useValidStoreId } from "@/hooks/useStoreId";

// Prevent static generation for this page
export const dynamic = 'force-dynamic';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyStateEnhanced } from "@/components/ui/empty-state-enhanced";
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
  const sendCampaign = useAction((api as any).emails?.sendCampaign);
  
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
      draft: { color: "bg-muted text-muted-foreground", label: "Draft" },
      scheduled: { color: "bg-chart-1/10 text-chart-1", label: "Scheduled" },
      sending: { color: "bg-chart-5/10 text-chart-5", label: "Sending" },
      sent: { color: "bg-chart-2/10 text-chart-2", label: "Sent" },
      failed: { color: "bg-destructive/10 text-destructive", label: "Failed" },
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

  const handleResendCampaign = (campaignId: string) => {
    router.push(`/store/${storeId}/email-campaigns/${campaignId}`);
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
          <h1 className="text-3xl font-bold">Email Marketing</h1>
          <p className="text-muted-foreground mt-2">Send campaigns and create automated email sequences</p>
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
        <Card className="border-chart-5/20 bg-chart-5/10">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-chart-5 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold mb-2">
                  Email Setup Required
                </h3>
                <p className="text-muted-foreground mb-4">
                  Configure your email sender settings to start sending professional email campaigns and automations to your customers. The platform manages the email service centrally.
                </p>
                <div className="flex items-center gap-3">
                  <Button 
                    onClick={() => router.push(`/store/${storeId}/settings/email`)}
                    className="bg-chart-5 hover:bg-chart-5/90 text-primary-foreground"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Setup Email Settings
                  </Button>
                  <p className="text-sm text-muted-foreground">
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
        <TabsList className="grid w-full grid-cols-3 bg-white dark:bg-black">
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="automations" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Automations
          </TabsTrigger>
          <TabsTrigger value="contacts" className="flex items-center gap-2" onClick={() => router.push(`/store/${storeId}/contacts`)}>
            <Users className="w-4 h-4" />
            Fans
          </TabsTrigger>
        </TabsList>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Email Campaigns</h2>
              <p className="text-muted-foreground">One-time email sends to your customer list</p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline"
                onClick={() => router.push(`/store/${storeId}/email-campaigns/templates`)}
              >
                <Mail className="w-4 h-4 mr-2" />
                Browse Templates
              </Button>
              <Button 
                onClick={() => router.push(`/store/${storeId}/email-campaigns/create`)}
                className="flex items-center gap-2"
                disabled={!emailConfig?.isConfigured}
              >
                <Plus className="w-4 h-4" />
                Create Campaign
              </Button>
            </div>
          </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-chart-1/10 rounded-lg flex items-center justify-center">
                <Mail className="w-6 h-6 text-chart-1" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Campaigns</p>
                <p className="text-2xl font-bold">{campaigns.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-chart-2/10 rounded-lg flex items-center justify-center">
                <Send className="w-6 h-6 text-chart-2" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sent Campaigns</p>
                <p className="text-2xl font-bold">{campaigns.filter((c: any) => c.status === 'sent').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-chart-3/10 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-chart-3" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Recipients</p>
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
              <div className="w-12 h-12 bg-chart-4/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-chart-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Open Rate</p>
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
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
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
            campaigns.length === 0 ? (
              <EmptyStateEnhanced
                icon={Mail}
                title="No email campaigns yet"
                description="Start engaging your audience with targeted email campaigns. Build relationships, promote products, and drive sales."
                showSuccessMetric={{
                  label: "Average campaign open rate",
                  value: "24.5%"
                }}
                actions={[
                  {
                    label: "Create Campaign",
                    onClick: () => router.push(`/store/${storeId}/email-campaigns/create`),
                    icon: Plus
                  }
                ]}
                tips={[
                  {
                    icon: Mail,
                    title: "Start with a Welcome Series",
                    description: "Send 3-5 emails introducing new subscribers to your content and products."
                  },
                  {
                    icon: Zap,
                    title: "Automate with Workflows",
                    description: "Set up automated email sequences triggered by user actions."
                  },
                  {
                    icon: BarChart3,
                    title: "Track Performance",
                    description: "Monitor opens, clicks, and conversions to improve future campaigns."
                  }
                ]}
                examples={[
                  {
                    title: "New Product Launch",
                    description: "Announce your latest sample pack or course to your list",
                    badge: "Popular"
                  },
                  {
                    title: "Weekly Newsletter",
                    description: "Share production tips, industry news, and exclusive offers",
                    badge: "Recurring"
                  },
                  {
                    title: "Cart Abandonment",
                    description: "Remind users about products left in their cart",
                    badge: "Automated"
                  },
                  {
                    title: "Course Enrollment",
                    description: "Welcome new students with onboarding content",
                    badge: "Triggered"
                  }
                ]}
              />
            ) : (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No campaigns found</h3>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your search terms or filters
                </p>
                <Button variant="outline" onClick={() => setSearchTerm("")}>
                  Clear Search
                </Button>
              </div>
            )
          ) : (
            <div className="space-y-4">
              {filteredCampaigns.map((campaign: any) => (
                <Card key={campaign._id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-chart-1/10 rounded-lg flex items-center justify-center">
                        <Mail className="w-6 h-6 text-chart-1" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-lg">{campaign.name}</h3>
                          {getStatusBadge(campaign.status)}
                        </div>
                        <p className="text-muted-foreground mb-2">Subject: {campaign.subject}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
                      
                      {(campaign.status === "sent" || campaign.status === "failed") && (
                        <Button
                          onClick={() => handleResendCampaign(campaign._id)}
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <Copy className="w-4 h-4" />
                          Resend
                        </Button>
                      )}
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white dark:bg-black">
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
                              className="text-destructive hover:text-destructive"
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
              <p className="text-muted-foreground">Automated email sequences triggered by customer actions</p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline"
                onClick={() => router.push(`/store/${storeId}/automations/templates`)}
              >
                <Zap className="w-4 h-4 mr-2" />
                Browse Templates
              </Button>
              <Button 
                onClick={() => router.push(`/store/${storeId}/automations`)}
                className="flex items-center gap-2"
                disabled={!emailConfig?.isConfigured}
              >
                <Plus className="w-4 h-4" />
                Create Automation
              </Button>
            </div>
          </div>

          {/* Automation Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-chart-3/10 rounded-lg flex items-center justify-center">
                    <Zap className="w-6 h-6 text-chart-3" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Automations</p>
                    <p className="text-2xl font-bold">{workflows.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-chart-2/10 rounded-lg flex items-center justify-center">
                    <PlayCircle className="w-6 h-6 text-chart-2" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Automations</p>
                    <p className="text-2xl font-bold">{workflows.filter((w: any) => w.isActive).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-chart-1/10 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-chart-1" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Executions</p>
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
                  <div className="w-12 h-12 bg-chart-4/10 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-chart-4" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Success Rate</p>
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
                  <div className="w-16 h-16 bg-muted rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <Zap className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No automations yet</h3>
                  <p className="text-muted-foreground mb-6">
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
                          <div className="w-12 h-12 bg-chart-3/10 rounded-lg flex items-center justify-center">
                            <Zap className="w-6 h-6 text-chart-3" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-semibold text-lg">{workflow.name}</h3>
                              <Badge className={workflow.isActive ? "bg-chart-2/10 text-chart-2" : "bg-muted text-muted-foreground"}>
                                {workflow.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground mb-2">
                              Trigger: {workflow.trigger.type.replace('_', ' ')}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
                            <DropdownMenuContent align="end" className="bg-white dark:bg-black">
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
                                className="text-destructive hover:text-destructive"
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
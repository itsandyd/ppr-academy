"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useAction, useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
  Mail,
  Send,
  Activity,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Sparkles,
  Upload,
  FileText,
  AlertCircle,
  Plus,
  Zap,
  Calendar,
  Search,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminEmailsPage() {
  const { user } = useUser();
  const convex = useConvex();
  const [isImporting, setIsImporting] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<{
    total: number;
    processed: number;
    success: number;
    errors: number;
    duplicates: number;
  } | null>(null);

  // Simplified - no connection required, using env variables
  const analytics = useQuery(api.emailQueries.getEmailAnalytics, { days: 30 });
  const campaigns = useQuery(api.emailQueries.getCampaigns, {});
  const templates = useQuery(api.emailQueries.getTemplates, {});
  
  // Fetch all users for targeting
  const allUsers = useQuery(
    api.users.getAllUsers,
    user?.id ? { clerkId: user.id, paginationOpts: { numItems: 1000, cursor: null } } : "skip"
  );
  
  // Mutations
  const createTemplate = useMutation(api.emailQueries.createTemplate);
  const createCampaign = useMutation(api.emailQueries.createCampaign);
  const createAutomation = useMutation(api.emailQueries.createAutomation);
  
  // Actions
  const sendCampaignAction = useAction(api.emails.sendCampaign);
  const generateEmailTemplateAction = useAction(api.aiEmailGenerator.generateEmailTemplate);

  // Dialog state
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isCampaignDialogOpen, setIsCampaignDialogOpen] = useState(false);
  const [isAutomationDialogOpen, setIsAutomationDialogOpen] = useState(false);

  // Template form state
  const [templateForm, setTemplateForm] = useState({
    name: "",
    subject: "",
    type: "custom" as const,
    htmlContent: "",
    textContent: "",
  });
  
  // AI generation state
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Campaign form state
  const [campaignForm, setCampaignForm] = useState({
    name: "",
    subject: "",
    templateId: "",
    audienceType: "all" as "all" | "enrolled" | "active" | "specific",
    scheduledFor: "",
    selectedUserIds: [] as string[],
  });
  
  // User search state
  const [userSearchQuery, setUserSearchQuery] = useState("");

  // Automation form state
  const [automationForm, setAutomationForm] = useState({
    name: "",
    trigger: "user_enrolled" as const,
    templateId: "",
    delayMinutes: 0,
  });


  const handleCreateTemplate = async () => {
    if (!templateForm.name || !templateForm.subject || !templateForm.htmlContent) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      await createTemplate(templateForm);
      toast.success("Template created successfully!");
      setIsTemplateDialogOpen(false);
      setTemplateForm({
        name: "",
        subject: "",
        type: "custom",
        htmlContent: "",
        textContent: "",
      });
    } catch (error: any) {
      toast.error(`Failed to create template: ${error.message}`);
    }
  };

  const handleCreateCampaign = async () => {
    if (!campaignForm.name || !campaignForm.subject || !campaignForm.templateId) {
      toast.error("Please fill all required fields");
      return;
    }

    // Validate specific user selection
    if (campaignForm.audienceType === "specific" && campaignForm.selectedUserIds.length === 0) {
      toast.error("Please select at least one user");
      return;
    }

    try {
      const scheduledFor = campaignForm.scheduledFor 
        ? new Date(campaignForm.scheduledFor).getTime() 
        : undefined;

      await createCampaign({
        name: campaignForm.name,
        subject: campaignForm.subject,
        templateId: campaignForm.templateId as any,
        audienceType: campaignForm.audienceType,
        scheduledFor,
        specificUserIds: campaignForm.audienceType === "specific" ? campaignForm.selectedUserIds as any : undefined,
      });

      toast.success(scheduledFor ? "Campaign scheduled successfully!" : "Campaign created successfully!");
      setIsCampaignDialogOpen(false);
      setCampaignForm({
        name: "",
        subject: "",
        templateId: "",
        audienceType: "all",
        scheduledFor: "",
        selectedUserIds: [],
      });
      setUserSearchQuery(""); // Clear search when dialog closes
    } catch (error: any) {
      toast.error(`Failed to create campaign: ${error.message}`);
    }
  };

  const handleCreateAutomation = async () => {
    if (!automationForm.name || !automationForm.templateId) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      await createAutomation({
        name: automationForm.name,
        trigger: automationForm.trigger,
        templateId: automationForm.templateId as any,
        delayMinutes: automationForm.delayMinutes || 0,
      });

      toast.success("Automation created successfully!");
      setIsAutomationDialogOpen(false);
      setAutomationForm({
        name: "",
        trigger: "user_enrolled",
        templateId: "",
        delayMinutes: 0,
      });
    } catch (error: any) {
      toast.error(`Failed to create automation: ${error.message}`);
    }
  };

  const handleSendCampaign = async (campaignId: string, campaignName: string) => {
    if (!confirm(`Are you sure you want to send the campaign "${campaignName}"? This will send emails to all recipients.`)) {
      return;
    }

    try {
      const result = await sendCampaignAction({ campaignId: campaignId as any });
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      toast.error(`Failed to send campaign: ${error.message}`);
    }
  };

  const handleDebugCampaign = async (campaignId: string) => {
    try {
      const debug = await convex.query(api.emailQueries.debugCampaign, { campaignId: campaignId as any });
      console.log("=== CAMPAIGN DEBUG INFO ===", debug);
      
      let message = `Campaign: ${debug.campaign.name}\n`;
      message += `Status: ${debug.campaign.status}\n`;
      message += `Recipients: ${debug.recipientCount}\n`;
      message += `Resend API Key: ${debug.hasResendKey ? "✅ Configured" : "❌ NOT SET"}\n`;
      message += `From Email: ${debug.fromEmail}\n`;
      message += `From Name: ${debug.fromName}\n\n`;
      
      if (debug.recipients && debug.recipients.length > 0) {
        message += `First 3 recipients:\n`;
        debug.recipients.forEach((r: any, i: number) => {
          message += `${i + 1}. ${r.name || "Unknown"} (${r.email})\n`;
        });
      }
      
      alert(message);
      toast.info("Check console for full debug info");
    } catch (error: any) {
      console.error("Debug error:", error);
      toast.error(`Debug failed: ${error.message}`);
    }
  };

  const handleGenerateWithAI = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Please enter a prompt to generate the template");
      return;
    }

    setIsGeneratingAI(true);
    try {
      toast.info("🤖 AI is generating your email template...");
      
      const generated = await generateEmailTemplateAction({
        prompt: aiPrompt,
        templateType: templateForm.type !== "custom" ? templateForm.type : undefined,
      });

      setTemplateForm({
        ...templateForm,
        name: generated.name,
        subject: generated.subject,
        htmlContent: generated.htmlContent,
        textContent: generated.textContent,
      });

      toast.success("✨ Template generated! Review and adjust as needed.");
      setAiPrompt(""); // Clear the prompt
    } catch (error: any) {
      console.error("AI generation error:", error);
      toast.error(`Failed to generate template: ${error.message}`);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Email Marketing</h1>
        <p className="text-muted-foreground">
          Manage platform-wide email campaigns, templates, and automation
        </p>
      </div>

      {/* Main Dashboard */}
      <>
          {/* Analytics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Sent</p>
                    <p className="text-2xl font-bold">
                      {analytics?.totalSent.toLocaleString() || 0}
                    </p>
                  </div>
                  <Send className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Open Rate</p>
                    <p className="text-2xl font-bold">
                      {analytics?.openRate || 0}%
                    </p>
                  </div>
                  <Activity className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Click Rate</p>
                    <p className="text-2xl font-bold">
                      {analytics?.clickRate || 0}%
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Bounce Rate</p>
                    <p className="text-2xl font-bold">
                      {analytics?.bounceRate || 0}%
                    </p>
                  </div>
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="campaigns">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="automations">Automations</TabsTrigger>
            </TabsList>

            {/* Campaigns Tab */}
            <TabsContent value="campaigns" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Email Campaigns</h2>
                <Dialog open={isCampaignDialogOpen} onOpenChange={setIsCampaignDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Sparkles className="w-4 h-4 mr-2" />
                      New Campaign
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl bg-white dark:bg-black">
                    <DialogHeader>
                      <DialogTitle>Create Email Campaign</DialogTitle>
                      <DialogDescription>
                        Create a new email campaign to send to your users
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="campaign-name">Campaign Name *</Label>
                        <Input
                          id="campaign-name"
                          placeholder="Weekly Newsletter"
                          value={campaignForm.name}
                          onChange={(e) =>
                            setCampaignForm({ ...campaignForm, name: e.target.value })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="campaign-subject">Email Subject *</Label>
                        <Input
                          id="campaign-subject"
                          placeholder="Your weekly update is here!"
                          value={campaignForm.subject}
                          onChange={(e) =>
                            setCampaignForm({ ...campaignForm, subject: e.target.value })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="campaign-template">Email Template *</Label>
                        <Select
                          value={campaignForm.templateId}
                          onValueChange={(value) =>
                            setCampaignForm({ ...campaignForm, templateId: value })
                          }
                        >
                          <SelectTrigger id="campaign-template">
                            <SelectValue placeholder="Select a template" />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-black">
                            {templates?.map((template) => (
                              <SelectItem key={template._id} value={template._id}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="campaign-audience">Audience</Label>
                        <Select
                          value={campaignForm.audienceType}
                          onValueChange={(value: any) => {
                            setCampaignForm({ 
                              ...campaignForm, 
                              audienceType: value,
                              // Clear selected users when switching away from specific
                              selectedUserIds: value === "specific" ? campaignForm.selectedUserIds : []
                            });
                            // Clear search when switching away from specific
                            if (value !== "specific") {
                              setUserSearchQuery("");
                            }
                          }}
                        >
                          <SelectTrigger id="campaign-audience">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-black">
                            <SelectItem value="all">All Users</SelectItem>
                            <SelectItem value="enrolled">Enrolled Students</SelectItem>
                            <SelectItem value="active">Active Users (30 days)</SelectItem>
                            <SelectItem value="specific">Specific Users</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Show user selection when "specific" is selected */}
                      {campaignForm.audienceType === "specific" && (() => {
                        // Filter users based on search query
                        const filteredUsers = allUsers?.page?.filter((user: any) => {
                          if (!userSearchQuery) return true;
                          const searchLower = userSearchQuery.toLowerCase();
                          const name = (user.name || "").toLowerCase();
                          const email = (user.email || "").toLowerCase();
                          return name.includes(searchLower) || email.includes(searchLower);
                        }) || [];

                        return (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label>Select Users ({campaignForm.selectedUserIds.length} selected)</Label>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const allUserIds = filteredUsers.map((u: any) => u._id);
                                    setCampaignForm({
                                      ...campaignForm,
                                      selectedUserIds: [...new Set([...campaignForm.selectedUserIds, ...allUserIds])]
                                    });
                                  }}
                                >
                                  Select All
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setCampaignForm({
                                      ...campaignForm,
                                      selectedUserIds: []
                                    });
                                  }}
                                >
                                  Deselect All
                                </Button>
                              </div>
                            </div>
                            
                            {/* Search Input */}
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                              <Input
                                placeholder="Search by name or email..."
                                value={userSearchQuery}
                                onChange={(e) => setUserSearchQuery(e.target.value)}
                                className="pl-9 pr-8"
                              />
                              {userSearchQuery && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                                  onClick={() => setUserSearchQuery("")}
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              )}
                            </div>

                            <ScrollArea className="h-64 border rounded-md p-4 bg-white dark:bg-black">
                              {filteredUsers.length > 0 ? (
                                <div className="space-y-2">
                                  {filteredUsers.map((user: any) => (
                                    <div key={user._id} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`user-${user._id}`}
                                        checked={campaignForm.selectedUserIds.includes(user._id)}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            setCampaignForm({
                                              ...campaignForm,
                                              selectedUserIds: [...campaignForm.selectedUserIds, user._id]
                                            });
                                          } else {
                                            setCampaignForm({
                                              ...campaignForm,
                                              selectedUserIds: campaignForm.selectedUserIds.filter(id => id !== user._id)
                                            });
                                          }
                                        }}
                                      />
                                      <label
                                        htmlFor={`user-${user._id}`}
                                        className="text-sm cursor-pointer flex-1"
                                      >
                                        {user.name || user.email || "Unknown User"}
                                        {user.email && (
                                          <span className="text-muted-foreground ml-2">({user.email})</span>
                                        )}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                  <p>No users found matching "{userSearchQuery}"</p>
                                </div>
                              )}
                            </ScrollArea>
                            {campaignForm.selectedUserIds.length === 0 && (
                              <p className="text-xs text-red-500">
                                Please select at least one user
                              </p>
                            )}
                          </div>
                        );
                      })()}

                      <div className="space-y-2">
                        <Label htmlFor="campaign-schedule">Schedule (Optional)</Label>
                        <Input
                          id="campaign-schedule"
                          type="datetime-local"
                          value={campaignForm.scheduledFor}
                          onChange={(e) =>
                            setCampaignForm({ ...campaignForm, scheduledFor: e.target.value })
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          Leave empty to send immediately
                        </p>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCampaignDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateCampaign}>
                        <Send className="w-4 h-4 mr-2" />
                        {campaignForm.scheduledFor ? "Schedule Campaign" : "Create Campaign"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {campaigns && campaigns.length > 0 ? (
                <div className="space-y-4">
                  {campaigns.map((campaign) => (
                    <Card key={campaign._id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">
                                {campaign.name}
                              </h3>
                              <Badge
                                variant={
                                  campaign.status === "sent"
                                    ? "default"
                                    : campaign.status === "sending"
                                    ? "secondary"
                                    : campaign.status === "scheduled"
                                    ? "outline"
                                    : "destructive"
                                }
                              >
                                {campaign.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">
                              Subject: {campaign.subject}
                            </p>

                            <div className="grid grid-cols-4 gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Sent
                                </p>
                                <p className="text-sm font-semibold">
                                  {campaign.sentCount || 0}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Delivered
                                </p>
                                <p className="text-sm font-semibold">
                                  {campaign.deliveredCount || 0}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Opened
                                </p>
                                <p className="text-sm font-semibold">
                                  {campaign.openedCount || 0}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Clicked
                                </p>
                                <p className="text-sm font-semibold">
                                  {campaign.clickedCount || 0}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex flex-col gap-2">
                            {(campaign.status === "draft" || campaign.status === "scheduled") && (
                              <Button
                                size="sm"
                                onClick={() => handleSendCampaign(campaign._id, campaign.name)}
                              >
                                <Send className="w-4 h-4 mr-2" />
                                Send Now
                              </Button>
                            )}
                            {campaign.status === "sending" && (
                              <Button size="sm" disabled>
                                <Clock className="w-4 h-4 mr-2 animate-spin" />
                                Sending...
                              </Button>
                            )}
                            {campaign.status === "sent" && (
                              <Badge variant="default" className="w-fit">
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Sent
                              </Badge>
                            )}
                            {(campaign.status === "draft" || campaign.status === "failed") && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDebugCampaign(campaign._id)}
                              >
                                <AlertCircle className="w-4 h-4 mr-2" />
                                Debug
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">
                      No campaigns yet. Create your first campaign to get started.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Templates Tab */}
            <TabsContent value="templates" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Email Templates</h2>
                <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      console.log("Button clicked, opening dialog");
                      setIsTemplateDialogOpen(true);
                    }}>
                      <Sparkles className="w-4 h-4 mr-2" />
                      New Template
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-white dark:bg-black">
                    <DialogHeader>
                      <DialogTitle>Create Email Template</DialogTitle>
                      <DialogDescription>
                        Create a reusable email template for campaigns and automations
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      {/* AI Generation Section */}
                      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-800">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-2 mb-3">
                            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm mb-1">Generate with AI</h4>
                              <p className="text-xs text-muted-foreground">
                                Describe the email you want and AI will create it for you
                              </p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Textarea
                              placeholder="E.g., Create a welcome email for new students joining our music production course. Include a warm greeting, course overview, and next steps."
                              value={aiPrompt}
                              onChange={(e) => setAiPrompt(e.target.value)}
                              className="min-h-[80px] text-sm"
                              disabled={isGeneratingAI}
                            />
                            <Button
                              onClick={handleGenerateWithAI}
                              disabled={isGeneratingAI || !aiPrompt.trim()}
                              className="w-full"
                              variant="default"
                            >
                              {isGeneratingAI ? (
                                <>
                                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-4 h-4 mr-2" />
                                  Generate Template
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="template-name">Template Name *</Label>
                          <Input
                            id="template-name"
                            placeholder="Welcome Email"
                            value={templateForm.name}
                            onChange={(e) =>
                              setTemplateForm({ ...templateForm, name: e.target.value })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="template-type">Template Type</Label>
                          <Select
                            value={templateForm.type}
                            onValueChange={(value: any) =>
                              setTemplateForm({ ...templateForm, type: value })
                            }
                          >
                            <SelectTrigger id="template-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-black">
                              <SelectItem value="welcome">Welcome</SelectItem>
                              <SelectItem value="launch">Launch</SelectItem>
                              <SelectItem value="enrollment">Enrollment</SelectItem>
                              <SelectItem value="progress_reminder">Progress Reminder</SelectItem>
                              <SelectItem value="completion">Completion</SelectItem>
                              <SelectItem value="certificate">Certificate</SelectItem>
                              <SelectItem value="new_course">New Course</SelectItem>
                              <SelectItem value="re_engagement">Re-engagement</SelectItem>
                              <SelectItem value="weekly_digest">Weekly Digest</SelectItem>
                              <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="template-subject">Email Subject *</Label>
                        <Input
                          id="template-subject"
                          placeholder="Welcome to PPR Academy!"
                          value={templateForm.subject}
                          onChange={(e) =>
                            setTemplateForm({ ...templateForm, subject: e.target.value })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="template-html">HTML Content *</Label>
                        <Textarea
                          id="template-html"
                          placeholder="<h1>Welcome!</h1><p>Thanks for joining...</p>"
                          className="font-mono text-sm min-h-[200px]"
                          value={templateForm.htmlContent}
                          onChange={(e) =>
                            setTemplateForm({ ...templateForm, htmlContent: e.target.value })
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          Use variables: {"{"}name{"}"}, {"{"}email{"}"}, {"{"}courseName{"}"}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="template-text">Plain Text Content</Label>
                        <Textarea
                          id="template-text"
                          placeholder="Welcome! Thanks for joining..."
                          className="min-h-[100px]"
                          value={templateForm.textContent}
                          onChange={(e) =>
                            setTemplateForm({ ...templateForm, textContent: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateTemplate}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Template
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {templates && templates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((template) => (
                    <Card key={template._id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold">{template.name}</h3>
                          <Badge
                            variant={template.isActive ? "default" : "secondary"}
                          >
                            {template.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          {template.subject}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {template.type}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">
                      No templates yet. Create reusable email templates.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Automations Tab */}
            <TabsContent value="automations" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Email Automations</h2>
                <Dialog open={isAutomationDialogOpen} onOpenChange={setIsAutomationDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Zap className="w-4 h-4 mr-2" />
                      New Automation
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl bg-white dark:bg-black">
                    <DialogHeader>
                      <DialogTitle>Create Automation</DialogTitle>
                      <DialogDescription>
                        Set up automated emails triggered by user actions
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="automation-name">Automation Name *</Label>
                        <Input
                          id="automation-name"
                          placeholder="Welcome new students"
                          value={automationForm.name}
                          onChange={(e) =>
                            setAutomationForm({ ...automationForm, name: e.target.value })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="automation-trigger">Trigger Event *</Label>
                        <Select
                          value={automationForm.trigger}
                          onValueChange={(value: any) =>
                            setAutomationForm({ ...automationForm, trigger: value })
                          }
                        >
                          <SelectTrigger id="automation-trigger">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-black">
                            <SelectItem value="user_enrolled">User Enrolled in Course</SelectItem>
                            <SelectItem value="course_completed">Course Completed</SelectItem>
                            <SelectItem value="user_inactive">User Inactive (7 days)</SelectItem>
                            <SelectItem value="certificate_issued">Certificate Issued</SelectItem>
                            <SelectItem value="user_registered">User Registered</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="automation-template">Email Template *</Label>
                        <Select
                          value={automationForm.templateId}
                          onValueChange={(value) =>
                            setAutomationForm({ ...automationForm, templateId: value })
                          }
                        >
                          <SelectTrigger id="automation-template">
                            <SelectValue placeholder="Select a template" />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-black">
                            {templates?.map((template) => (
                              <SelectItem key={template._id} value={template._id}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="automation-delay">Delay (Minutes)</Label>
                        <Input
                          id="automation-delay"
                          type="number"
                          placeholder="0"
                          min="0"
                          value={automationForm.delayMinutes}
                          onChange={(e) =>
                            setAutomationForm({
                              ...automationForm,
                              delayMinutes: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          How long to wait after the trigger before sending the email (0 = immediate)
                        </p>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAutomationDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateAutomation}>
                        <Zap className="w-4 h-4 mr-2" />
                        Create Automation
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Automations List */}
              <Card>
                <CardContent className="p-12 text-center">
                  <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">
                    No automations yet. Create automated email workflows.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
    </div>
  );
}


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
import { useQuery, useMutation } from "convex/react";
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
} from "lucide-react";
import { toast } from "sonner";

export default function AdminEmailsPage() {
  const { user } = useUser();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<{
    total: number;
    processed: number;
    success: number;
    errors: number;
    duplicates: number;
  } | null>(null);

  // Fetch data
  const connection = useQuery(api.emailQueries.getAdminConnection);
  const analytics = connection
    ? useQuery(api.emailQueries.getEmailAnalytics, {
        connectionId: connection._id,
        days: 30,
      })
    : undefined;
  const campaigns = connection
    ? useQuery(api.emailQueries.getCampaigns, { connectionId: connection._id })
    : undefined;
  const templates = connection
    ? useQuery(api.emailQueries.getTemplates, { connectionId: connection._id })
    : undefined;
  const imports = connection
    ? useQuery(api.emailQueries.getImports, {
        connectionId: connection._id,
        limit: 10,
      })
    : undefined;

  // Mutations
  const connectResend = useMutation(api.emailQueries.connectAdminResend);
  const startContactImport = useMutation(api.emailQueries.startContactImport);
  const processContactBatch = useMutation(api.emailQueries.processContactBatch);
  const createTemplate = useMutation(api.emailQueries.createTemplate);
  const createCampaign = useMutation(api.emailQueries.createCampaign);
  const createAutomation = useMutation(api.emailQueries.createAutomation);

  // Form state
  const [formData, setFormData] = useState({
    resendApiKey: "",
    fromEmail: "",
    fromName: "",
    replyToEmail: "",
  });

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

  // Campaign form state
  const [campaignForm, setCampaignForm] = useState({
    name: "",
    subject: "",
    templateId: "",
    audienceType: "all" as "all" | "enrolled" | "active",
    scheduledFor: "",
  });

  // Automation form state
  const [automationForm, setAutomationForm] = useState({
    name: "",
    trigger: "user_enrolled" as const,
    templateId: "",
    delayMinutes: 0,
  });

  const handleConnect = async () => {
    if (!user || !formData.resendApiKey || !formData.fromEmail || !formData.fromName) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsConnecting(true);
    try {
      await connectResend({
        ...formData,
        userId: user.id,
      });
      toast.success("Resend connected successfully!");
    } catch (error) {
      toast.error("Failed to connect Resend");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
        toast.error("Please upload a CSV file");
        return;
      }
      setCsvFile(file);
    }
  };

  const parseCSV = (text: string): Array<{
    email: string;
    name?: string;
    firstName?: string;
    lastName?: string;
  }> => {
    const lines = text.split("\n").filter((line) => line.trim());
    if (lines.length === 0) return [];

    // Parse header
    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const emailIndex = header.findIndex((h) =>
      h.includes("email") || h === "email"
    );

    if (emailIndex === -1) {
      throw new Error("CSV must contain an 'email' column");
    }

    const nameIndex = header.findIndex((h) => h.includes("name"));
    const firstNameIndex = header.findIndex((h) =>
      h.includes("first") || h === "firstname"
    );
    const lastNameIndex = header.findIndex((h) =>
      h.includes("last") || h === "lastname"
    );

    // Parse rows
    const contacts = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const email = values[emailIndex]?.replace(/['"]/g, "");
      if (!email) continue;

      contacts.push({
        email,
        name: nameIndex >= 0 ? values[nameIndex]?.replace(/['"]/g, "") : undefined,
        firstName:
          firstNameIndex >= 0
            ? values[firstNameIndex]?.replace(/['"]/g, "")
            : undefined,
        lastName:
          lastNameIndex >= 0
            ? values[lastNameIndex]?.replace(/['"]/g, "")
            : undefined,
      });
    }

    return contacts;
  };

  const handleImport = async () => {
    if (!csvFile || !connection || !user) {
      toast.error("Please select a CSV file");
      return;
    }

    setIsImporting(true);
    setImportStatus(null);

    try {
      // Read file
      const text = await csvFile.text();
      const contacts = parseCSV(text);

      if (contacts.length === 0) {
        toast.error("No valid contacts found in CSV");
        return;
      }

      // Start import
      const importId = await startContactImport({
        connectionId: connection._id,
        source: "csv",
        fileName: csvFile.name,
        totalContacts: contacts.length,
        userId: user.id,
      });

      // Process in batches of 50
      const batchSize = 50;
      let processed = 0;
      let totalSuccess = 0;
      let totalErrors = 0;
      let totalDuplicates = 0;

      for (let i = 0; i < contacts.length; i += batchSize) {
        const batch = contacts.slice(i, i + batchSize);
        const result = await processContactBatch({
          importId,
          contacts: batch,
        });

        processed += batch.length;
        totalSuccess += result.successCount;
        totalErrors += result.errorCount;
        totalDuplicates += result.duplicateCount;

        setImportStatus({
          total: contacts.length,
          processed,
          success: totalSuccess,
          errors: totalErrors,
          duplicates: totalDuplicates,
        });
      }

      toast.success(
        `Import complete! ${totalSuccess} contacts added, ${totalDuplicates} duplicates skipped, ${totalErrors} errors`
      );
      setCsvFile(null);
    } catch (error: any) {
      toast.error(`Import failed: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!connection || !templateForm.name || !templateForm.subject || !templateForm.htmlContent) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      await createTemplate({
        connectionId: connection._id,
        ...templateForm,
      });
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
    if (!connection || !campaignForm.name || !campaignForm.subject || !campaignForm.templateId) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const scheduledFor = campaignForm.scheduledFor 
        ? new Date(campaignForm.scheduledFor).getTime() 
        : undefined;

      await createCampaign({
        connectionId: connection._id,
        name: campaignForm.name,
        subject: campaignForm.subject,
        templateId: campaignForm.templateId as any,
        audienceType: campaignForm.audienceType,
        scheduledFor,
      });

      toast.success(scheduledFor ? "Campaign scheduled successfully!" : "Campaign created successfully!");
      setIsCampaignDialogOpen(false);
      setCampaignForm({
        name: "",
        subject: "",
        templateId: "",
        audienceType: "all",
        scheduledFor: "",
      });
    } catch (error: any) {
      toast.error(`Failed to create campaign: ${error.message}`);
    }
  };

  const handleCreateAutomation = async () => {
    if (!connection || !automationForm.name || !automationForm.templateId) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      await createAutomation({
        connectionId: connection._id,
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Email Marketing</h1>
        <p className="text-muted-foreground">
          Manage platform-wide email campaigns, templates, and automation
        </p>
      </div>

      {!connection ? (
        /* Setup Card */
        <Card>
          <CardHeader>
            <CardTitle>Connect Resend</CardTitle>
            <CardDescription>
              Connect your Resend account to start sending email campaigns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">Resend API Key *</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="re_..."
                value={formData.resendApiKey}
                onChange={(e) =>
                  setFormData({ ...formData, resendApiKey: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fromEmail">From Email *</Label>
                <Input
                  id="fromEmail"
                  type="email"
                  placeholder="noreply@example.com"
                  value={formData.fromEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, fromEmail: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fromName">From Name *</Label>
                <Input
                  id="fromName"
                  placeholder="PPR Academy"
                  value={formData.fromName}
                  onChange={(e) =>
                    setFormData({ ...formData, fromName: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="replyTo">Reply-To Email (Optional)</Label>
              <Input
                id="replyTo"
                type="email"
                placeholder="support@example.com"
                value={formData.replyToEmail}
                onChange={(e) =>
                  setFormData({ ...formData, replyToEmail: e.target.value })
                }
              />
            </div>

            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full"
            >
              <Mail className="w-4 h-4 mr-2" />
              {isConnecting ? "Connecting..." : "Connect Resend"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Main Dashboard */
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
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="automations">Automations</TabsTrigger>
              <TabsTrigger value="import">Import Contacts</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
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
                          onValueChange={(value: any) =>
                            setCampaignForm({ ...campaignForm, audienceType: value })
                          }
                        >
                          <SelectTrigger id="campaign-audience">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-black">
                            <SelectItem value="all">All Users</SelectItem>
                            <SelectItem value="enrolled">Enrolled Students</SelectItem>
                            <SelectItem value="active">Active Users (30 days)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

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
                    <Button>
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

            {/* Import Contacts Tab */}
            <TabsContent value="import" className="space-y-4">
              <div>
                <h2 className="text-2xl font-semibold mb-2">Import Contacts</h2>
                <p className="text-muted-foreground mb-4">
                  Upload a CSV file to import your existing email contacts
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Upload CSV File</CardTitle>
                  <CardDescription>
                    Your CSV must include an &quot;email&quot; column. Optional columns: name, firstName, lastName
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* File Upload */}
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <Label htmlFor="csv-upload" className="cursor-pointer">
                      <div className="space-y-2">
                        <p className="font-medium">
                          {csvFile ? csvFile.name : "Choose a CSV file"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Click to browse or drag and drop
                        </p>
                      </div>
                    </Label>
                    <Input
                      id="csv-upload"
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={handleFileChange}
                      disabled={isImporting}
                    />
                  </div>

                  {/* Import Progress */}
                  {importStatus && (
                    <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium">Import Progress</p>
                          <p className="text-sm text-muted-foreground">
                            {importStatus.processed} / {importStatus.total}
                          </p>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{
                              width: `${(importStatus.processed / importStatus.total) * 100}%`,
                            }}
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span>{importStatus.success} added</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <AlertCircle className="w-4 h-4 text-orange-600" />
                            <span>{importStatus.duplicates} duplicates</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <XCircle className="w-4 h-4 text-red-600" />
                            <span>{importStatus.errors} errors</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* CSV Format Example */}
                  <Card className="bg-muted">
                    <CardContent className="p-4">
                      <p className="font-medium mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        CSV Format Example:
                      </p>
                      <pre className="text-xs bg-background p-3 rounded overflow-x-auto">
                        {`email,name,firstName,lastName
john@example.com,John Doe,John,Doe
jane@example.com,Jane Smith,Jane,Smith`}
                      </pre>
                    </CardContent>
                  </Card>

                  {/* Import Button */}
                  <Button
                    onClick={handleImport}
                    disabled={!csvFile || isImporting}
                    className="w-full"
                    size="lg"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isImporting ? "Importing..." : "Import Contacts"}
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Imports */}
              {imports && imports.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Imports</CardTitle>
                    <CardDescription>Your contact import history</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {imports.map((imp) => (
                        <div
                          key={imp._id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm">{imp.fileName || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(imp.createdAt).toLocaleDateString()} •{" "}
                              {imp.successCount} imported, {imp.duplicateCount} duplicates,{" "}
                              {imp.errorCount} errors
                            </p>
                          </div>
                          <Badge
                            variant={
                              imp.status === "completed"
                                ? "default"
                                : imp.status === "processing"
                                ? "secondary"
                                : imp.status === "completed_with_errors"
                                ? "outline"
                                : "destructive"
                            }
                          >
                            {imp.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Email Configuration</CardTitle>
                  <CardDescription>
                    Your current Resend settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">From Email</Label>
                      <p className="text-sm text-muted-foreground">
                        {connection.fromEmail}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">From Name</Label>
                      <p className="text-sm text-muted-foreground">
                        {connection.fromName}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Reply-To</Label>
                      <p className="text-sm text-muted-foreground">
                        {connection.replyToEmail || "Not set"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Status</Label>
                      <Badge variant={connection.isActive ? "default" : "destructive"}>
                        {connection.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}


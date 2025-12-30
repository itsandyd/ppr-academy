"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import {
  Mail,
  Send,
  Activity,
  TrendingUp,
  CheckCircle,
  XCircle,
  Sparkles,
  Settings,
  Plus,
  BarChart3,
  Users,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

export default function StoreEmailPage() {
  const { user } = useUser();
  const params = useParams();
  const storeId = params.storeId as Id<"stores">;

  const [isConnecting, setIsConnecting] = useState(false);

  // Fetch data
  const connection = useQuery(api.emailQueries.getStoreConnection, { storeId });
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
  const courses = useQuery(api.courses.getCoursesByStore, { storeId });

  // Mutations
  const connectResend = useMutation(api.emailQueries.connectStoreResend);
  const createTemplate = useMutation(api.emailQueries.createTemplate);
  const createCampaign = useMutation(api.emailQueries.createCampaign);
  const createAutomation = useMutation(api.emailQueries.createAutomation);
  const updateConnection = useMutation(api.emailQueries.updateConnection);

  // Form state
  const [formData, setFormData] = useState({
    resendApiKey: "",
    fromEmail: "",
    fromName: "",
    replyToEmail: "",
  });

  // Settings state
  const [settingsForm, setSettingsForm] = useState({
    fromEmail: connection?.fromEmail || "",
    fromName: connection?.fromName || "",
    replyToEmail: connection?.replyToEmail || "",
    enableAutomations: connection?.enableAutomations ?? true,
    enableCampaigns: connection?.enableCampaigns ?? true,
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
    courseId: "",
    scheduledFor: "",
  });

  // Automation form state
  const [automationForm, setAutomationForm] = useState({
    name: "",
    trigger: "user_enrolled" as const,
    templateId: "",
    courseId: "",
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
        storeId,
        userId: user.id,
        ...formData,
      });
      toast.success("Resend connected successfully!");
      setFormData({
        resendApiKey: "",
        fromEmail: "",
        fromName: "",
        replyToEmail: "",
      });
    } catch (error) {
      toast.error("Failed to connect Resend");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleUpdateSettings = async () => {
    if (!connection) return;

    try {
      await updateConnection({
        connectionId: connection._id,
        fromEmail: settingsForm.fromEmail || undefined,
        fromName: settingsForm.fromName || undefined,
        replyToEmail: settingsForm.replyToEmail || undefined,
        enableAutomations: settingsForm.enableAutomations,
        enableCampaigns: settingsForm.enableCampaigns,
      });
      toast.success("Settings updated successfully!");
    } catch (error: any) {
      toast.error(`Failed to update settings: ${error.message}`);
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
        courseId: campaignForm.courseId ? (campaignForm.courseId as any) : undefined,
        audienceType: "all",
        scheduledFor,
      });

      toast.success(
        scheduledFor ? "Campaign scheduled successfully!" : "Campaign created successfully!"
      );
      setIsCampaignDialogOpen(false);
      setCampaignForm({
        name: "",
        subject: "",
        templateId: "",
        courseId: "",
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
        courseId: automationForm.courseId ? (automationForm.courseId as any) : undefined,
        delayMinutes: automationForm.delayMinutes || 0,
      });

      toast.success("Automation created successfully!");
      setIsAutomationDialogOpen(false);
      setAutomationForm({
        name: "",
        trigger: "user_enrolled",
        templateId: "",
        courseId: "",
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
          Send email campaigns and automate communications with your students
        </p>
      </div>

      {!connection ? (
        /* Setup Card */
        <Card>
          <CardHeader>
            <CardTitle>Connect Your Resend Account</CardTitle>
            <CardDescription>
              Connect your Resend account to start sending email campaigns to your students
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
                onChange={(e) => setFormData({ ...formData, resendApiKey: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Get your API key from{" "}
                <a
                  href="https://resend.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Resend Dashboard
                </a>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fromEmail">From Email *</Label>
                <Input
                  id="fromEmail"
                  type="email"
                  placeholder="noreply@yourdomain.com"
                  value={formData.fromEmail}
                  onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fromName">From Name *</Label>
                <Input
                  id="fromName"
                  placeholder="Your Name"
                  value={formData.fromName}
                  onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="replyTo">Reply-To Email (Optional)</Label>
              <Input
                id="replyTo"
                type="email"
                placeholder="support@yourdomain.com"
                value={formData.replyToEmail}
                onChange={(e) => setFormData({ ...formData, replyToEmail: e.target.value })}
              />
            </div>

            <Button onClick={handleConnect} disabled={isConnecting} className="w-full" size="lg">
              {isConnecting ? "Connecting..." : "Connect Resend"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Analytics Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Sent</p>
                    <p className="text-2xl font-bold">{analytics?.totalSent || 0}</p>
                  </div>
                  <Mail className="h-8 w-8 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Delivered</p>
                    <p className="text-2xl font-bold">{analytics?.delivered || 0}</p>
                    <p className="text-xs text-green-600">
                      {analytics?.deliveryRate.toFixed(1)}% rate
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Opened</p>
                    <p className="text-2xl font-bold">{analytics?.opened || 0}</p>
                    <p className="text-xs text-blue-600">{analytics?.openRate.toFixed(1)}% rate</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-600 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Clicked</p>
                    <p className="text-2xl font-bold">{analytics?.clicked || 0}</p>
                    <p className="text-xs text-purple-600">
                      {analytics?.clickRate.toFixed(1)}% rate
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="campaigns">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="automations">Automations</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Campaigns Tab */}
            <TabsContent value="campaigns" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Email Campaigns</h2>
                <Dialog open={isCampaignDialogOpen} onOpenChange={setIsCampaignDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Sparkles className="mr-2 h-4 w-4" />
                      New Campaign
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl bg-white dark:bg-black">
                    <DialogHeader>
                      <DialogTitle>Create Email Campaign</DialogTitle>
                      <DialogDescription>Send an email campaign to your students</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="campaign-name">Campaign Name *</Label>
                        <Input
                          id="campaign-name"
                          placeholder="Course Launch Announcement"
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
                          placeholder="New course available now!"
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
                            {templates?.map((template: any) => (
                              <SelectItem key={template._id} value={template._id}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="campaign-course">Target Course (Optional)</Label>
                        <Select
                          value={campaignForm.courseId}
                          onValueChange={(value) =>
                            setCampaignForm({ ...campaignForm, courseId: value })
                          }
                        >
                          <SelectTrigger id="campaign-course">
                            <SelectValue placeholder="All courses" />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-black">
                            <SelectItem value="">All Courses</SelectItem>
                            {courses?.map((course: any) => (
                              <SelectItem key={course._id} value={course._id}>
                                {course.title}
                              </SelectItem>
                            ))}
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
                        <Send className="mr-2 h-4 w-4" />
                        {campaignForm.scheduledFor ? "Schedule Campaign" : "Send Campaign"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {campaigns && campaigns.length > 0 ? (
                <div className="space-y-4">
                  {campaigns.map((campaign: any) => (
                    <Card key={campaign._id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="mb-2 flex items-center gap-3">
                              <h3 className="text-lg font-semibold">{campaign.name}</h3>
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
                            <p className="mb-4 text-sm text-muted-foreground">
                              Subject: {campaign.subject}
                            </p>

                            <div className="grid grid-cols-4 gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground">Sent</p>
                                <p className="text-sm font-semibold">{campaign.sentCount || 0}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Delivered</p>
                                <p className="text-sm font-semibold">
                                  {campaign.deliveredCount || 0}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Opened</p>
                                <p className="text-sm font-semibold">{campaign.openedCount || 0}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Clicked</p>
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
                    <Mail className="mx-auto mb-4 h-12 w-12 opacity-50" />
                    <p className="text-muted-foreground">
                      No campaigns yet. Create your first campaign to engage your students.
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
                      <Plus className="mr-2 h-4 w-4" />
                      New Template
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto bg-white dark:bg-black">
                    <DialogHeader>
                      <DialogTitle>Create Email Template</DialogTitle>
                      <DialogDescription>
                        Create a reusable email template for your campaigns
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="template-name">Template Name *</Label>
                          <Input
                            id="template-name"
                            placeholder="Course Welcome Email"
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
                              <SelectItem value="enrollment">Enrollment</SelectItem>
                              <SelectItem value="progress_reminder">Progress Reminder</SelectItem>
                              <SelectItem value="completion">Completion</SelectItem>
                              <SelectItem value="certificate">Certificate</SelectItem>
                              <SelectItem value="new_course">New Course</SelectItem>
                              <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="template-subject">Email Subject *</Label>
                        <Input
                          id="template-subject"
                          placeholder="Welcome to my course!"
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
                          placeholder="<h1>Welcome!</h1><p>Thanks for enrolling in {courseName}...</p>"
                          className="min-h-[200px] font-mono text-sm"
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
                          placeholder="Welcome! Thanks for enrolling..."
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
                        <Plus className="mr-2 h-4 w-4" />
                        Create Template
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {templates && templates.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {templates.map((template: any) => (
                    <Card key={template._id}>
                      <CardContent className="p-6">
                        <div className="mb-2 flex items-start justify-between">
                          <h3 className="font-semibold">{template.name}</h3>
                          <Badge variant={template.isActive ? "default" : "secondary"}>
                            {template.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="mb-4 text-sm text-muted-foreground">{template.subject}</p>
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
                    <Mail className="mx-auto mb-4 h-12 w-12 opacity-50" />
                    <p className="text-muted-foreground">
                      No templates yet. Create reusable email templates for your campaigns.
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
                      <Zap className="mr-2 h-4 w-4" />
                      New Automation
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl bg-white dark:bg-black">
                    <DialogHeader>
                      <DialogTitle>Create Automation</DialogTitle>
                      <DialogDescription>
                        Automatically send emails when students perform specific actions
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="automation-name">Automation Name *</Label>
                        <Input
                          id="automation-name"
                          placeholder="Welcome new enrollments"
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
                            <SelectItem value="user_enrolled">Student Enrolled</SelectItem>
                            <SelectItem value="course_completed">Course Completed</SelectItem>
                            <SelectItem value="certificate_issued">Certificate Earned</SelectItem>
                            <SelectItem value="user_inactive">Student Inactive (7 days)</SelectItem>
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
                            {templates?.map((template: any) => (
                              <SelectItem key={template._id} value={template._id}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="automation-course">Target Course (Optional)</Label>
                        <Select
                          value={automationForm.courseId}
                          onValueChange={(value) =>
                            setAutomationForm({ ...automationForm, courseId: value })
                          }
                        >
                          <SelectTrigger id="automation-course">
                            <SelectValue placeholder="All courses" />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-black">
                            <SelectItem value="">All Courses</SelectItem>
                            {courses?.map((course: any) => (
                              <SelectItem key={course._id} value={course._id}>
                                {course.title}
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
                          Wait time before sending (0 = immediate)
                        </p>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAutomationDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateAutomation}>
                        <Zap className="mr-2 h-4 w-4" />
                        Create Automation
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <Card>
                <CardContent className="p-12 text-center">
                  <Zap className="mx-auto mb-4 h-12 w-12 opacity-50" />
                  <p className="text-muted-foreground">
                    No automations yet. Set up automated emails for your students.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4">
              <div>
                <h2 className="mb-2 text-2xl font-semibold">Email Settings</h2>
                <p className="mb-6 text-muted-foreground">
                  Configure your email preferences and sender information
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Sender Information</CardTitle>
                  <CardDescription>Update the sender details for your emails</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="settings-from-email">From Email</Label>
                      <Input
                        id="settings-from-email"
                        type="email"
                        value={settingsForm.fromEmail}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, fromEmail: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="settings-from-name">From Name</Label>
                      <Input
                        id="settings-from-name"
                        value={settingsForm.fromName}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, fromName: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="settings-reply-to">Reply-To Email</Label>
                    <Input
                      id="settings-reply-to"
                      type="email"
                      value={settingsForm.replyToEmail}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, replyToEmail: e.target.value })
                      }
                    />
                  </div>

                  <Button onClick={handleUpdateSettings}>
                    <Settings className="mr-2 h-4 w-4" />
                    Update Settings
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Email Preferences</CardTitle>
                  <CardDescription>Control what types of emails are enabled</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Enable Campaigns</p>
                      <p className="text-sm text-muted-foreground">
                        Allow sending email campaigns to students
                      </p>
                    </div>
                    <Switch
                      checked={settingsForm.enableCampaigns}
                      onCheckedChange={(checked) =>
                        setSettingsForm({ ...settingsForm, enableCampaigns: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Enable Automations</p>
                      <p className="text-sm text-muted-foreground">
                        Allow automated emails based on student actions
                      </p>
                    </div>
                    <Switch
                      checked={settingsForm.enableAutomations}
                      onCheckedChange={(checked) =>
                        setSettingsForm({ ...settingsForm, enableAutomations: checked })
                      }
                    />
                  </div>

                  <Button onClick={handleUpdateSettings}>
                    <Settings className="mr-2 h-4 w-4" />
                    Save Preferences
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Connection Status</CardTitle>
                  <CardDescription>Your Resend integration is active</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Connected to Resend</p>
                      <p className="text-sm text-muted-foreground">Email: {connection.fromEmail}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}

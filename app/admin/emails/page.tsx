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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { WysiwygEditor, WysiwygEditorRef } from "@/components/ui/wysiwyg-editor";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery, useMutation, useAction, useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useRef } from "react";
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
  Target,
  BarChart3,
  Eye,
  Megaphone,
  Store,
  Loader2,
  Braces,
  User,
  AtSign,
  Link2,
} from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

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
    audienceType: "all" as "all" | "enrolled" | "active" | "specific" | "creators",
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

  // Creator broadcast state
  const [creatorSearchQuery, setCreatorSearchQuery] = useState("");
  const [selectedCreators, setSelectedCreators] = useState<Set<string>>(new Set());
  const [creatorBroadcastSubject, setCreatorBroadcastSubject] = useState("");
  const [creatorBroadcastContent, setCreatorBroadcastContent] = useState("");
  const [isSendingCreatorBroadcast, setIsSendingCreatorBroadcast] = useState(false);
  const editorRef = useRef<WysiwygEditorRef>(null);

  // Available personalization variables
  const personalizationVariables = [
    {
      label: "First Name",
      variable: "{{firstName}}",
      icon: User,
      description: "Creator's first name",
    },
    { label: "Full Name", variable: "{{name}}", icon: User, description: "Creator's full name" },
    { label: "Email", variable: "{{email}}", icon: AtSign, description: "Creator's email address" },
    {
      label: "Store Name",
      variable: "{{storeName}}",
      icon: Store,
      description: "Creator's store display name",
    },
    {
      label: "Store URL Slug",
      variable: "{{storeSlug}}",
      icon: Link2,
      description: "For links: pauseplayrepeat.com/{{storeSlug}}",
    },
  ];

  const insertVariable = (variable: string) => {
    editorRef.current?.insertText(variable);
  };

  // Creator queries
  const creators = useQuery(
    api.adminAnalytics.getCreatorsForEmail,
    user?.id ? { clerkId: user.id, search: creatorSearchQuery || undefined } : "skip"
  );
  const creatorStats = useQuery(
    api.adminAnalytics.getCreatorEmailStats,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Send broadcast email action
  const sendBroadcastEmail = useAction(api.emails.sendBroadcastEmail);

  // Toggle creator selection
  const toggleCreatorSelection = (creatorId: string) => {
    setSelectedCreators((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(creatorId)) {
        newSet.delete(creatorId);
      } else {
        newSet.add(creatorId);
      }
      return newSet;
    });
  };

  // Select/deselect all creators
  const toggleAllCreators = () => {
    if (!creators) return;
    if (selectedCreators.size === creators.length) {
      setSelectedCreators(new Set());
    } else {
      setSelectedCreators(new Set(creators.map((c) => c._id)));
    }
  };

  // Send broadcast to creators
  const handleSendCreatorBroadcast = async () => {
    if (!creatorBroadcastSubject.trim()) {
      toast.error("Subject line required");
      return;
    }
    // Check if content is empty (WysiwygEditor returns <p></p> when empty)
    const contentIsEmpty = !creatorBroadcastContent.trim() || creatorBroadcastContent === "<p></p>";
    if (contentIsEmpty) {
      toast.error("Email content required");
      return;
    }
    if (selectedCreators.size === 0) {
      toast.error("Select at least one creator");
      return;
    }

    setIsSendingCreatorBroadcast(true);
    try {
      // Wrap the WYSIWYG HTML content with email-safe styling
      const htmlContent = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6;">
        ${creatorBroadcastContent}
        <p style="color: #6b7280; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <a href="{{unsubscribeLink}}" style="color: #6b7280;">Unsubscribe</a>
        </p>
      </div>`;

      // Strip HTML tags for plain text version
      const textContent = creatorBroadcastContent
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .trim();

      // Create a campaign with the content and send it
      const campaignId = await createCampaign({
        name: `Creator Broadcast: ${creatorBroadcastSubject.substring(0, 50)}`,
        subject: creatorBroadcastSubject,
        htmlContent,
        textContent,
        audienceType: "creators",
        scheduledFor: undefined,
      });

      await sendCampaignAction({ campaignId });

      toast.success(`Broadcast sent to all creators!`);
      setCreatorBroadcastSubject("");
      setCreatorBroadcastContent("");
      setSelectedCreators(new Set());
    } catch (error: any) {
      toast.error(`Failed to send broadcast: ${error.message}`);
    } finally {
      setIsSendingCreatorBroadcast(false);
    }
  };

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
        specificUserIds:
          campaignForm.audienceType === "specific"
            ? (campaignForm.selectedUserIds as any)
            : undefined,
      });

      toast.success(
        scheduledFor ? "Campaign scheduled successfully!" : "Campaign created successfully!"
      );
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
    if (
      !confirm(
        `Are you sure you want to send the campaign "${campaignName}"? This will send emails to all recipients.`
      )
    ) {
      return;
    }

    try {
      await sendCampaignAction({ campaignId: campaignId as any });
      toast.success("Campaign is being sent! Check the status for progress.");
    } catch (error: any) {
      toast.error(`Failed to send campaign: ${error.message}`);
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Email Marketing</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Manage platform-wide email campaigns, templates, and automation
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-3 py-1.5">
            <Activity className="mr-1.5 h-3.5 w-3.5" />
            Last 30 days
          </Badge>
        </div>
      </div>

      {/* Main Dashboard */}
      <>
        {/* Analytics Overview */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-2 transition-shadow hover:shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Total Sent</p>
                  <p className="text-3xl font-bold tracking-tight">
                    {analytics?.totalSent.toLocaleString() || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">emails delivered</p>
                </div>
                <div className="rounded-full bg-blue-500/10 p-3">
                  <Send className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 transition-shadow hover:shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Open Rate</p>
                  <p className="text-3xl font-bold tracking-tight">{analytics?.openRate || 0}%</p>
                  <p className="text-xs text-muted-foreground">engagement rate</p>
                </div>
                <div className="rounded-full bg-green-500/10 p-3">
                  <Eye className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 transition-shadow hover:shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Click Rate</p>
                  <p className="text-3xl font-bold tracking-tight">{analytics?.clickRate || 0}%</p>
                  <p className="text-xs text-muted-foreground">click-through rate</p>
                </div>
                <div className="rounded-full bg-purple-500/10 p-3">
                  <Target className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 transition-shadow hover:shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Bounce Rate</p>
                  <p className="text-3xl font-bold tracking-tight">{analytics?.bounceRate || 0}%</p>
                  <p className="text-xs text-muted-foreground">delivery issues</p>
                </div>
                <div className="rounded-full bg-red-500/10 p-3">
                  <XCircle className="h-6 w-6 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="creators" className="space-y-6">
          <TabsList className="grid h-12 w-full grid-cols-4 p-1">
            <TabsTrigger value="creators" className="text-base">
              <Store className="mr-2 h-4 w-4" />
              Creators
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="text-base">
              <Send className="mr-2 h-4 w-4" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="templates" className="text-base">
              <FileText className="mr-2 h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="automations" className="text-base">
              <Zap className="mr-2 h-4 w-4" />
              Automations
            </TabsTrigger>
          </TabsList>

          {/* Creators Tab - Broadcast to Creators */}
          <TabsContent value="creators" className="space-y-6">
            {/* Creator Stats */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Creators</p>
                      <p className="text-2xl font-bold">{creatorStats?.totalCreators || 0}</p>
                    </div>
                    <Store className="h-8 w-8 text-blue-500/20" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">With Email</p>
                      <p className="text-2xl font-bold text-green-600">
                        {creatorStats?.creatorsWithEmail || 0}
                      </p>
                    </div>
                    <Mail className="h-8 w-8 text-green-500/20" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Creators</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {creatorStats?.activeCreators || 0}
                      </p>
                    </div>
                    <Activity className="h-8 w-8 text-purple-500/20" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">New This Month</p>
                      <p className="text-2xl font-bold text-amber-600">
                        {creatorStats?.newCreatorsThisMonth || 0}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-amber-500/20" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Compose Email */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Megaphone className="h-5 w-5 text-cyan-600" />
                    Broadcast to Creators
                  </CardTitle>
                  <CardDescription>
                    Send announcements, updates, or newsletters to your creators
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="creator-subject">Subject Line</Label>
                    <Input
                      id="creator-subject"
                      placeholder="Hey {{name}}, exciting platform update!"
                      value={creatorBroadcastSubject}
                      onChange={(e) => setCreatorBroadcastSubject(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Use {"{{name}}"}, {"{{storeName}}"}, {"{{storeSlug}}"}, {"{{email}}"} for
                      personalization
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Email Content</Label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-2">
                            <Braces className="h-4 w-4" />
                            Insert Variable
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64 bg-white dark:bg-black">
                          <DropdownMenuLabel>Personalization Variables</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {personalizationVariables.map((v) => (
                            <DropdownMenuItem
                              key={v.variable}
                              onClick={() => insertVariable(v.variable)}
                              className="flex items-start gap-3 py-2"
                            >
                              <v.icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
                              <div className="flex-1">
                                <div className="font-medium">{v.label}</div>
                                <div className="text-xs text-muted-foreground">{v.description}</div>
                              </div>
                              <code className="text-xs text-cyan-600">{v.variable}</code>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <WysiwygEditor
                      ref={editorRef}
                      content={creatorBroadcastContent}
                      onChange={setCreatorBroadcastContent}
                      placeholder="Write your message to creators here..."
                      className="min-h-[300px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      Unsubscribe link is added automatically to the footer.
                    </p>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
                    <div className="text-sm">
                      <span className="font-medium">{selectedCreators.size}</span> creator
                      {selectedCreators.size !== 1 ? "s" : ""} selected
                    </div>
                    <Button
                      onClick={handleSendCreatorBroadcast}
                      disabled={
                        isSendingCreatorBroadcast ||
                        selectedCreators.size === 0 ||
                        !creatorBroadcastSubject.trim() ||
                        !creatorBroadcastContent.trim()
                      }
                      className="gap-2"
                    >
                      {isSendingCreatorBroadcast ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Send Broadcast
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Select Creators */}
              <Card className="border-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Select Recipients</CardTitle>
                      <CardDescription>{creators?.length || 0} creators available</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={toggleAllCreators}>
                      {selectedCreators.size === creators?.length && creators?.length > 0
                        ? "Deselect All"
                        : "Select All"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search creators by name, email, or store..."
                      className="pl-10"
                      value={creatorSearchQuery}
                      onChange={(e) => setCreatorSearchQuery(e.target.value)}
                    />
                  </div>

                  <ScrollArea className="h-[400px] rounded-md border p-2">
                    {!creators || creators.length === 0 ? (
                      <div className="py-8 text-center text-sm text-muted-foreground">
                        No creators found
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {creators.map((creator) => (
                          <div
                            key={creator._id}
                            className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                              selectedCreators.has(creator._id)
                                ? "border-primary bg-primary/5"
                                : "border-transparent hover:bg-muted/50"
                            }`}
                            onClick={() => toggleCreatorSelection(creator._id)}
                          >
                            <Checkbox
                              checked={selectedCreators.has(creator._id)}
                              onCheckedChange={() => toggleCreatorSelection(creator._id)}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="truncate font-medium">
                                  {creator.name || creator.email}
                                </span>
                                {creator.storeName && (
                                  <Badge variant="outline" className="text-xs">
                                    {creator.storeName}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="truncate">{creator.email}</span>
                                <span>-</span>
                                <span>{creator.courseCount} courses</span>
                                <span>-</span>
                                <span>{creator.productCount} products</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Email Campaigns</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create and manage broadcast email campaigns
                </p>
              </div>
              <Dialog open={isCampaignDialogOpen} onOpenChange={setIsCampaignDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Campaign
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] max-w-3xl bg-white dark:bg-black">
                  <DialogHeader className="space-y-3 border-b pb-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-blue-500/10 p-2.5">
                        <Send className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <DialogTitle className="text-2xl">Create Email Campaign</DialogTitle>
                        <DialogDescription className="mt-1 text-base">
                          Set up a new broadcast email campaign for your audience
                        </DialogDescription>
                      </div>
                    </div>
                  </DialogHeader>

                  <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
                    <div className="space-y-6 py-4">
                      {/* Basic Info Section */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2">
                          <div className="h-1 w-1 rounded-full bg-blue-500" />
                          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                            Campaign Details
                          </h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2 space-y-2">
                            <Label htmlFor="campaign-name" className="text-base font-medium">
                              Campaign Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="campaign-name"
                              placeholder="e.g., Weekly Newsletter, Product Launch"
                              value={campaignForm.name}
                              onChange={(e) =>
                                setCampaignForm({ ...campaignForm, name: e.target.value })
                              }
                              className="h-11 text-base"
                            />
                            <p className="text-xs text-muted-foreground">
                              Internal name for your campaign
                            </p>
                          </div>

                          <div className="col-span-2 space-y-2">
                            <Label htmlFor="campaign-subject" className="text-base font-medium">
                              Email Subject Line <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="campaign-subject"
                              placeholder="e.g., Your weekly update is here!"
                              value={campaignForm.subject}
                              onChange={(e) =>
                                setCampaignForm({ ...campaignForm, subject: e.target.value })
                              }
                              className="h-11 text-base"
                            />
                            <p className="text-xs text-muted-foreground">
                              This will appear in your recipients' inbox
                            </p>
                          </div>

                          <div className="col-span-2 space-y-2">
                            <Label htmlFor="campaign-template" className="text-base font-medium">
                              Email Template <span className="text-red-500">*</span>
                            </Label>
                            <Select
                              value={campaignForm.templateId}
                              onValueChange={(value) =>
                                setCampaignForm({ ...campaignForm, templateId: value })
                              }
                            >
                              <SelectTrigger id="campaign-template" className="h-11 text-base">
                                <SelectValue placeholder="Choose a template" />
                              </SelectTrigger>
                              <SelectContent className="bg-white dark:bg-black">
                                {templates && templates.length > 0 ? (
                                  templates.map((template: any) => (
                                    <SelectItem key={template._id} value={template._id}>
                                      <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        {template.name}
                                      </div>
                                    </SelectItem>
                                  ))
                                ) : (
                                  <div className="p-2 text-sm text-muted-foreground">
                                    No templates available. Create one first.
                                  </div>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* Audience Section */}
                      <div className="space-y-4 border-t pt-4">
                        <div className="flex items-center gap-2 pb-2">
                          <div className="h-1 w-1 rounded-full bg-purple-500" />
                          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                            Target Audience
                          </h3>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="campaign-audience" className="text-base font-medium">
                            Who should receive this campaign?
                          </Label>
                          <Select
                            value={campaignForm.audienceType}
                            onValueChange={(value: any) => {
                              setCampaignForm({
                                ...campaignForm,
                                audienceType: value,
                                selectedUserIds:
                                  value === "specific" ? campaignForm.selectedUserIds : [],
                              });
                              if (value !== "specific") {
                                setUserSearchQuery("");
                              }
                            }}
                          >
                            <SelectTrigger id="campaign-audience" className="h-11 text-base">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-black">
                              <SelectItem value="all">
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  <div>
                                    <div className="font-medium">All Users</div>
                                    <div className="text-xs text-muted-foreground">
                                      Everyone in your database
                                    </div>
                                  </div>
                                </div>
                              </SelectItem>
                              <SelectItem value="enrolled">
                                <div className="flex items-center gap-2">
                                  <Activity className="h-4 w-4" />
                                  <div>
                                    <div className="font-medium">Enrolled Students</div>
                                    <div className="text-xs text-muted-foreground">
                                      Users enrolled in courses
                                    </div>
                                  </div>
                                </div>
                              </SelectItem>
                              <SelectItem value="active">
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="h-4 w-4" />
                                  <div>
                                    <div className="font-medium">Active Users</div>
                                    <div className="text-xs text-muted-foreground">
                                      Active in the last 30 days
                                    </div>
                                  </div>
                                </div>
                              </SelectItem>
                              <SelectItem value="specific">
                                <div className="flex items-center gap-2">
                                  <Target className="h-4 w-4" />
                                  <div>
                                    <div className="font-medium">Specific Users</div>
                                    <div className="text-xs text-muted-foreground">
                                      Hand-pick individual users
                                    </div>
                                  </div>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Show user selection when "specific" is selected */}
                      {campaignForm.audienceType === "specific" &&
                        (() => {
                          const filteredUsers =
                            allUsers?.page?.filter((user: any) => {
                              if (!userSearchQuery) return true;
                              const searchLower = userSearchQuery.toLowerCase();
                              const name = (user.name || "").toLowerCase();
                              const email = (user.email || "").toLowerCase();
                              return name.includes(searchLower) || email.includes(searchLower);
                            }) || [];

                          return (
                            <Card className="border-2 bg-muted/50">
                              <CardContent className="space-y-4 p-4">
                                <div className="flex items-center justify-between">
                                  <Label className="text-base font-medium">
                                    Select Recipients ({campaignForm.selectedUserIds.length}{" "}
                                    selected)
                                  </Label>
                                  <div className="flex gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const allUserIds = filteredUsers.map((u: any) => u._id);
                                        setCampaignForm({
                                          ...campaignForm,
                                          selectedUserIds: [
                                            ...new Set([
                                              ...campaignForm.selectedUserIds,
                                              ...allUserIds,
                                            ]),
                                          ],
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
                                          selectedUserIds: [],
                                        });
                                      }}
                                    >
                                      Clear
                                    </Button>
                                  </div>
                                </div>

                                {/* Search Input */}
                                <div className="relative">
                                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                  <Input
                                    placeholder="Search users by name or email..."
                                    value={userSearchQuery}
                                    onChange={(e) => setUserSearchQuery(e.target.value)}
                                    className="h-11 pl-10 pr-10"
                                  />
                                  {userSearchQuery && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 p-0"
                                      onClick={() => setUserSearchQuery("")}
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>

                                <ScrollArea className="h-72 rounded-lg border-2 bg-white p-3 dark:bg-black">
                                  {filteredUsers.length > 0 ? (
                                    <div className="space-y-1">
                                      {filteredUsers.map((user: any) => (
                                        <div
                                          key={user._id}
                                          className="flex items-center space-x-3 rounded-md p-2 transition-colors hover:bg-muted/50"
                                        >
                                          <Checkbox
                                            id={`user-${user._id}`}
                                            checked={campaignForm.selectedUserIds.includes(
                                              user._id
                                            )}
                                            onCheckedChange={(checked) => {
                                              if (checked) {
                                                setCampaignForm({
                                                  ...campaignForm,
                                                  selectedUserIds: [
                                                    ...campaignForm.selectedUserIds,
                                                    user._id,
                                                  ],
                                                });
                                              } else {
                                                setCampaignForm({
                                                  ...campaignForm,
                                                  selectedUserIds:
                                                    campaignForm.selectedUserIds.filter(
                                                      (id) => id !== user._id
                                                    ),
                                                });
                                              }
                                            }}
                                          />
                                          <label
                                            htmlFor={`user-${user._id}`}
                                            className="flex-1 cursor-pointer text-sm"
                                          >
                                            <div className="font-medium">
                                              {user.name || user.email || "Unknown User"}
                                            </div>
                                            {user.email && user.name && (
                                              <div className="text-xs text-muted-foreground">
                                                {user.email}
                                              </div>
                                            )}
                                          </label>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="py-12 text-center text-muted-foreground">
                                      <Users className="mx-auto mb-3 h-12 w-12 opacity-30" />
                                      <p className="font-medium">No users found</p>
                                      {userSearchQuery && (
                                        <p className="mt-1 text-xs">Try a different search term</p>
                                      )}
                                    </div>
                                  )}
                                </ScrollArea>

                                {campaignForm.selectedUserIds.length === 0 && (
                                  <div className="flex items-center gap-2 rounded-md border border-red-500/20 bg-red-500/10 p-3">
                                    <AlertCircle className="h-4 w-4 text-red-500" />
                                    <p className="text-xs font-medium text-red-600 dark:text-red-400">
                                      Please select at least one recipient
                                    </p>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })()}

                      {/* Scheduling Section */}
                      <div className="space-y-4 border-t pt-4">
                        <div className="flex items-center gap-2 pb-2">
                          <div className="h-1 w-1 rounded-full bg-green-500" />
                          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                            Schedule
                          </h3>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="campaign-schedule" className="text-base font-medium">
                            When should this campaign be sent?
                          </Label>
                          <div className="relative">
                            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              id="campaign-schedule"
                              type="datetime-local"
                              value={campaignForm.scheduledFor}
                              onChange={(e) =>
                                setCampaignForm({ ...campaignForm, scheduledFor: e.target.value })
                              }
                              className="h-11 pl-10 text-base"
                            />
                          </div>
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            Leave empty to create as draft or send immediately
                          </p>
                        </div>
                      </div>
                    </div>
                  </ScrollArea>

                  <DialogFooter className="border-t pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsCampaignDialogOpen(false)}
                      size="lg"
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleCreateCampaign} size="lg" className="gap-2">
                      {campaignForm.scheduledFor ? (
                        <>
                          <Calendar className="h-4 w-4" />
                          Schedule Campaign
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          Create Campaign
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {campaigns && campaigns.length > 0 ? (
              <div className="space-y-4">
                {campaigns.map((campaign: any) => (
                  <Card key={campaign._id} className="border-2 transition-all hover:shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex-1 space-y-4">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <h3 className="text-xl font-bold tracking-tight">
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
                                  className="capitalize"
                                >
                                  {campaign.status}
                                </Badge>
                              </div>
                              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="h-4 w-4" />
                                {campaign.subject}
                              </p>
                            </div>
                          </div>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-4 gap-4 pt-2">
                            <div className="space-y-1">
                              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Sent
                              </p>
                              <p className="text-2xl font-bold">{campaign.sentCount || 0}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Delivered
                              </p>
                              <p className="text-2xl font-bold">{campaign.deliveredCount || 0}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Opened
                              </p>
                              <p className="text-2xl font-bold">{campaign.openedCount || 0}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Clicked
                              </p>
                              <p className="text-2xl font-bold">{campaign.clickedCount || 0}</p>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2">
                          {(campaign.status === "draft" || campaign.status === "scheduled") && (
                            <Button
                              size="default"
                              onClick={() => handleSendCampaign(campaign._id, campaign.name)}
                              className="gap-2"
                            >
                              <Send className="h-4 w-4" />
                              Send Now
                            </Button>
                          )}
                          {campaign.status === "sending" && (
                            <Button size="default" disabled className="gap-2">
                              <Clock className="h-4 w-4 animate-spin" />
                              Sending...
                            </Button>
                          )}
                          {campaign.status === "sent" && (
                            <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium text-green-600">Sent</span>
                            </div>
                          )}
                          {campaign.status === "failed" && (
                            <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2">
                              <XCircle className="h-4 w-4 text-red-600" />
                              <span className="text-sm font-medium text-red-600">Failed</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-2 border-dashed">
                <CardContent className="p-16 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <Send className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">No campaigns yet</h3>
                  <p className="mx-auto mb-6 max-w-sm text-muted-foreground">
                    Create your first email campaign to start reaching your audience
                  </p>
                  <Button onClick={() => setIsCampaignDialogOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Campaign
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Email Templates</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create reusable templates for campaigns and automation
                </p>
              </div>
              <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="lg"
                    onClick={() => {
                      console.log("Button clicked, opening dialog");
                      setIsTemplateDialogOpen(true);
                    }}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    New Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] max-w-4xl bg-white dark:bg-black">
                  <DialogHeader className="space-y-3 border-b pb-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-purple-500/10 p-2.5">
                        <FileText className="h-5 w-5 text-purple-500" />
                      </div>
                      <div>
                        <DialogTitle className="text-2xl">Create Email Template</DialogTitle>
                        <DialogDescription className="mt-1 text-base">
                          Build a reusable email template for campaigns and automation
                        </DialogDescription>
                      </div>
                    </div>
                  </DialogHeader>

                  <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
                    <div className="space-y-6 py-4">
                      {/* AI Generation Section */}
                      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:border-purple-800 dark:from-purple-950/20 dark:via-blue-950/20 dark:to-indigo-950/20">
                        <CardContent className="p-5">
                          <div className="mb-4 flex items-start gap-3">
                            <div className="rounded-lg bg-purple-500/10 p-2">
                              <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="flex-1">
                              <h4 className="mb-1 text-base font-bold">✨ Generate with AI</h4>
                              <p className="text-sm text-muted-foreground">
                                Describe your email and let AI create a professional template
                                instantly
                              </p>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <Textarea
                              placeholder="Example: Create a warm welcome email for new students joining our music production course. Include an inspiring greeting, brief course overview, what they'll learn, and encourage them to start their first lesson."
                              value={aiPrompt}
                              onChange={(e) => setAiPrompt(e.target.value)}
                              className="min-h-[100px] border-2 bg-white text-base dark:bg-black"
                              disabled={isGeneratingAI}
                            />
                            <Button
                              onClick={handleGenerateWithAI}
                              disabled={isGeneratingAI || !aiPrompt.trim()}
                              className="h-11 w-full"
                              size="lg"
                            >
                              {isGeneratingAI ? (
                                <>
                                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                                  AI is generating your template...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="mr-2 h-4 w-4" />
                                  Generate Template with AI
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Template Details Section */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2">
                          <div className="h-1 w-1 rounded-full bg-blue-500" />
                          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                            Template Details
                          </h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="template-name" className="text-base font-medium">
                              Template Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="template-name"
                              placeholder="e.g., Welcome Email, Course Launch"
                              value={templateForm.name}
                              onChange={(e) =>
                                setTemplateForm({ ...templateForm, name: e.target.value })
                              }
                              className="h-11 text-base"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="template-type" className="text-base font-medium">
                              Template Type
                            </Label>
                            <Select
                              value={templateForm.type}
                              onValueChange={(value: any) =>
                                setTemplateForm({ ...templateForm, type: value })
                              }
                            >
                              <SelectTrigger id="template-type" className="h-11 text-base">
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

                          <div className="col-span-2 space-y-2">
                            <Label htmlFor="template-subject" className="text-base font-medium">
                              Email Subject Line <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="template-subject"
                              placeholder="e.g., Welcome to PPR Academy! 🎵"
                              value={templateForm.subject}
                              onChange={(e) =>
                                setTemplateForm({ ...templateForm, subject: e.target.value })
                              }
                              className="h-11 text-base"
                            />
                            <p className="text-xs text-muted-foreground">
                              This will appear in the inbox preview
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="space-y-4 border-t pt-4">
                        <div className="flex items-center gap-2 pb-2">
                          <div className="h-1 w-1 rounded-full bg-green-500" />
                          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                            Email Content
                          </h3>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="template-html" className="text-base font-medium">
                            HTML Content <span className="text-red-500">*</span>
                          </Label>
                          <Textarea
                            id="template-html"
                            placeholder="<div style='font-family: sans-serif;'>&#10;  <h1 style='color: #333;'>Welcome!</h1>&#10;  <p>Thanks for joining us...</p>&#10;</div>"
                            className="min-h-[250px] bg-muted/30 font-mono text-sm"
                            value={templateForm.htmlContent}
                            onChange={(e) =>
                              setTemplateForm({ ...templateForm, htmlContent: e.target.value })
                            }
                          />
                          <div className="flex items-start gap-2 rounded-md border border-blue-500/20 bg-blue-500/10 p-3">
                            <Sparkles className="mt-0.5 h-4 w-4 text-blue-600" />
                            <p className="text-xs text-blue-600 dark:text-blue-400">
                              <strong>Pro tip:</strong> Use variables like{" "}
                              <code className="rounded bg-blue-500/20 px-1.5 py-0.5">
                                {"{"}name{"}"}
                              </code>
                              ,{" "}
                              <code className="rounded bg-blue-500/20 px-1.5 py-0.5">
                                {"{"}email{"}"}
                              </code>
                              ,{" "}
                              <code className="rounded bg-blue-500/20 px-1.5 py-0.5">
                                {"{"}courseName{"}"}
                              </code>{" "}
                              for personalization
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="template-text" className="text-base font-medium">
                            Plain Text Version{" "}
                            <span className="text-sm text-muted-foreground">(Optional)</span>
                          </Label>
                          <Textarea
                            id="template-text"
                            placeholder="Welcome!&#10;&#10;Thanks for joining us. We're excited to have you on board.&#10;&#10;Let's get started..."
                            className="min-h-[120px]"
                            value={templateForm.textContent}
                            onChange={(e) =>
                              setTemplateForm({ ...templateForm, textContent: e.target.value })
                            }
                          />
                          <p className="text-xs text-muted-foreground">
                            Fallback for email clients that don't support HTML
                          </p>
                        </div>
                      </div>
                    </div>
                  </ScrollArea>

                  <DialogFooter className="border-t pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsTemplateDialogOpen(false)}
                      size="lg"
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleCreateTemplate} size="lg" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create Template
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {templates && templates.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {templates.map((template: any) => (
                  <Card
                    key={template._id}
                    className="group border-2 transition-all hover:shadow-lg"
                  >
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="mb-2 line-clamp-1 text-lg font-bold">{template.name}</h3>
                            <Badge
                              variant={template.isActive ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {template.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>

                        {/* Subject */}
                        <div className="space-y-1">
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Subject Line
                          </p>
                          <p className="line-clamp-2 text-sm font-medium">{template.subject}</p>
                        </div>

                        {/* Type */}
                        <div className="flex items-center gap-2 border-t pt-2">
                          <Badge variant="outline" className="text-xs capitalize">
                            {template.type.replace(/_/g, " ")}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-2 border-dashed">
                <CardContent className="p-16 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">No templates yet</h3>
                  <p className="mx-auto mb-6 max-w-sm text-muted-foreground">
                    Create reusable email templates to speed up your campaigns
                  </p>
                  <Button onClick={() => setIsTemplateDialogOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Template
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Automations Tab */}
          <TabsContent value="automations" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Email Automations</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Set up automated email workflows triggered by user actions
                </p>
              </div>
              <Dialog open={isAutomationDialogOpen} onOpenChange={setIsAutomationDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Automation
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl bg-white dark:bg-black">
                  <DialogHeader className="space-y-3 border-b pb-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-amber-500/10 p-2.5">
                        <Zap className="h-5 w-5 text-amber-500" />
                      </div>
                      <div>
                        <DialogTitle className="text-2xl">Create Automation</DialogTitle>
                        <DialogDescription className="mt-1 text-base">
                          Set up automated emails triggered by specific user actions
                        </DialogDescription>
                      </div>
                    </div>
                  </DialogHeader>

                  <div className="space-y-6 py-4">
                    {/* Automation Details */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-2">
                        <div className="h-1 w-1 rounded-full bg-blue-500" />
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                          Automation Details
                        </h3>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="automation-name" className="text-base font-medium">
                          Automation Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="automation-name"
                          placeholder="e.g., Welcome new students, Course completion celebration"
                          value={automationForm.name}
                          onChange={(e) =>
                            setAutomationForm({ ...automationForm, name: e.target.value })
                          }
                          className="h-11 text-base"
                        />
                        <p className="text-xs text-muted-foreground">
                          Internal name to identify this automation
                        </p>
                      </div>
                    </div>

                    {/* Trigger Configuration */}
                    <div className="space-y-4 border-t pt-4">
                      <div className="flex items-center gap-2 pb-2">
                        <div className="h-1 w-1 rounded-full bg-purple-500" />
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                          Trigger Configuration
                        </h3>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="automation-trigger" className="text-base font-medium">
                          Trigger Event <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={automationForm.trigger}
                          onValueChange={(value: any) =>
                            setAutomationForm({ ...automationForm, trigger: value })
                          }
                        >
                          <SelectTrigger id="automation-trigger" className="h-11 text-base">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-black">
                            <SelectItem value="user_enrolled">
                              <div className="flex items-center gap-2">
                                <Activity className="h-4 w-4" />
                                <div>
                                  <div className="font-medium">User Enrolled in Course</div>
                                  <div className="text-xs text-muted-foreground">
                                    When a user enrolls
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value="course_completed">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" />
                                <div>
                                  <div className="font-medium">Course Completed</div>
                                  <div className="text-xs text-muted-foreground">
                                    When user finishes a course
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value="user_inactive">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <div>
                                  <div className="font-medium">User Inactive (7 days)</div>
                                  <div className="text-xs text-muted-foreground">
                                    Re-engagement email
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value="certificate_issued">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                <div>
                                  <div className="font-medium">Certificate Issued</div>
                                  <div className="text-xs text-muted-foreground">
                                    Celebrate achievement
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value="user_registered">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <div>
                                  <div className="font-medium">User Registered</div>
                                  <div className="text-xs text-muted-foreground">
                                    Welcome new users
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Choose when this automation should be triggered
                        </p>
                      </div>
                    </div>

                    {/* Email Template */}
                    <div className="space-y-4 border-t pt-4">
                      <div className="flex items-center gap-2 pb-2">
                        <div className="h-1 w-1 rounded-full bg-green-500" />
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                          Email Template & Timing
                        </h3>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="automation-template" className="text-base font-medium">
                          Email Template <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={automationForm.templateId}
                          onValueChange={(value) =>
                            setAutomationForm({ ...automationForm, templateId: value })
                          }
                        >
                          <SelectTrigger id="automation-template" className="h-11 text-base">
                            <SelectValue placeholder="Choose a template" />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-black">
                            {templates && templates.length > 0 ? (
                              templates.map((template: any) => (
                                <SelectItem key={template._id} value={template._id}>
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    {template.name}
                                  </div>
                                </SelectItem>
                              ))
                            ) : (
                              <div className="p-2 text-sm text-muted-foreground">
                                No templates available. Create one first.
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="automation-delay" className="text-base font-medium">
                          Delay Before Sending
                        </Label>
                        <div className="relative">
                          <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
                            className="h-11 pl-10 text-base"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Minutes to wait after trigger before sending (0 = send immediately)
                        </p>
                      </div>
                    </div>
                  </div>

                  <DialogFooter className="border-t pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsAutomationDialogOpen(false)}
                      size="lg"
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleCreateAutomation} size="lg" className="gap-2">
                      <Zap className="h-4 w-4" />
                      Create Automation
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Automations List */}
            <Card className="border-2 border-dashed">
              <CardContent className="p-16 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Zap className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">No automations yet</h3>
                <p className="mx-auto mb-6 max-w-sm text-muted-foreground">
                  Create automated email workflows triggered by user actions to save time
                </p>
                <Button onClick={() => setIsAutomationDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Automation
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </>
    </div>
  );
}

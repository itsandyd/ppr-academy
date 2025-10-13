"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Bot, 
  Plus, 
  Play, 
  Pause, 
  Settings, 
  Trash2, 
  Edit3, 
  MessageSquare, 
  Users, 
  TrendingUp,
  Zap,
  Target,
  Clock,
  PlayCircle,
  AlertTriangle,
  Eye,
  BarChart3,
  Webhook,
  Link,
  FileText,
  Tag,
  Timer,
  Activity
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AutomationManagerProps {
  storeId: string;
  userId: string;
}

interface FlowNode {
  id: string;
  type: "trigger" | "message" | "delay" | "condition" | "resource" | "tag" | "webhook";
  position: { x: number; y: number };
  data: {
    content?: string;
    mediaUrls?: string[];
    delayMinutes?: number;
    conditionType?: "keyword" | "user_response" | "time_based" | "tag_based";
    conditionValue?: string;
    resourceType?: "link" | "file" | "course" | "product";
    resourceUrl?: string;
    resourceId?: string;
    tagName?: string;
    webhookUrl?: string;
    webhookData?: any;
  };
}

interface FlowConnection {
  from: string;
  to: string;
  label?: string;
}

interface AutomationFlow {
  _id: Id<"automationFlows">;
  name: string;
  description?: string;
  isActive: boolean;
  triggerType: "keyword" | "comment" | "dm" | "mention" | "hashtag" | "manual";
  triggerConditions: {
    keywords?: string[];
    platforms: ("instagram" | "twitter" | "facebook" | "tiktok" | "linkedin")[];
    matchType: "exact" | "contains" | "starts_with" | "regex";
    socialAccountIds?: Id<"socialAccounts">[];
  };
  flowDefinition: {
    nodes: FlowNode[];
    connections: FlowConnection[];
  };
  totalTriggers: number;
  totalCompletions: number;
  lastTriggered?: number;
  settings: {
    stopOnError: boolean;
    allowMultipleRuns: boolean;
    timeoutMinutes?: number;
  };
}

export function AutomationManager({ storeId, userId }: AutomationManagerProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("flows");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedFlow, setSelectedFlow] = useState<AutomationFlow | null>(null);
  const [deletingFlowId, setDeletingFlowId] = useState<string | null>(null);

  // Form states for creating/editing flows
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    triggerType: "keyword" as const,
    keywords: [""],
    platforms: ["instagram"] as ("instagram" | "twitter" | "facebook" | "tiktok" | "linkedin")[],
    matchType: "contains" as const,
  });

  // Mutations
  const createAutomationFlow = useMutation(api.automation.createAutomationFlow);
  const toggleAutomationFlow = useMutation(api.automation.toggleAutomationFlow);
  const deleteAutomationFlow = useMutation(api.automation.deleteAutomationFlow);
  const testAutomationTrigger = useMutation(api.automation.testAutomationTrigger);

  // Queries
  const flows = useQuery(api.automation.getAutomationFlows, { 
    storeId, 
    userId 
  });

  const socialAccounts = useQuery(api.socialMedia.getSocialAccounts, { storeId });

  // Helper functions
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "instagram": return "📷";
      case "twitter": return "🐦";
      case "facebook": return "📘";
      case "linkedin": return "💼";
      case "tiktok": return "🎵";
      default: return "📱";
    }
  };

  const getTriggerIcon = (triggerType: string) => {
    switch (triggerType) {
      case "keyword": return <Target className="h-4 w-4" />;
      case "comment": return <MessageSquare className="h-4 w-4" />;
      case "dm": return <MessageSquare className="h-4 w-4" />;
      case "mention": return <Users className="h-4 w-4" />;
      case "hashtag": return <Tag className="h-4 w-4" />;
      case "manual": return <PlayCircle className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const getNodeIcon = (nodeType: string) => {
    switch (nodeType) {
      case "message": return <MessageSquare className="h-4 w-4" />;
      case "delay": return <Timer className="h-4 w-4" />;
      case "resource": return <FileText className="h-4 w-4" />;
      case "tag": return <Tag className="h-4 w-4" />;
      case "webhook": return <Webhook className="h-4 w-4" />;
      case "condition": return <Settings className="h-4 w-4" />;
      default: return <Bot className="h-4 w-4" />;
    }
  };

  const handleCreateFlow = async () => {
    try {
      if (!formData.name.trim()) {
        toast({
          title: "Name required",
          description: "Please enter a name for your automation flow",
          variant: "destructive",
        });
        return;
      }

      // Create a simple starter flow with trigger -> message nodes
      const starterFlow = {
        nodes: [
          {
            id: "trigger-1",
            type: "trigger" as const,
            position: { x: 100, y: 100 },
            data: {},
          },
          {
            id: "message-1", 
            type: "message" as const,
            position: { x: 300, y: 100 },
            data: {
              content: "Thanks for your comment! I'll send you the resource shortly.",
            },
          },
        ],
        connections: [
          {
            from: "trigger-1",
            to: "message-1",
          },
        ],
      };

      const flowId = await createAutomationFlow({
        storeId,
        userId,
        name: formData.name,
        description: formData.description,
        triggerType: formData.triggerType,
        triggerConditions: {
          keywords: formData.keywords.filter(k => k.trim()),
          platforms: formData.platforms,
          matchType: formData.matchType,
        },
        flowDefinition: starterFlow,
      });

      toast({
        title: "Automation Created",
        description: `${formData.name} has been created successfully.`,
      });

      setShowCreateDialog(false);
      setFormData({
        name: "",
        description: "",
        triggerType: "keyword" as const,
        keywords: [""],
        platforms: ["instagram"] as ("instagram" | "twitter" | "facebook" | "tiktok" | "linkedin")[],
        matchType: "contains" as const,
      });

    } catch (error) {
      console.error("Error creating automation:", error);
      toast({
        title: "Creation Failed",
        description: "Failed to create automation flow. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleFlow = async (flowId: Id<"automationFlows">, isActive: boolean) => {
    try {
      await toggleAutomationFlow({
        flowId,
        userId,
        isActive,
      });

      toast({
        title: isActive ? "Flow Activated" : "Flow Paused",
        description: `The automation flow has been ${isActive ? "activated" : "paused"}.`,
      });
    } catch (error) {
      console.error("Error toggling flow:", error);
      toast({
        title: "Toggle Failed",
        description: "Failed to toggle automation flow. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFlow = async (flowId: Id<"automationFlows">) => {
    try {
      setDeletingFlowId(flowId);
      await deleteAutomationFlow({ flowId, userId });

      toast({
        title: "Flow Deleted",
        description: "The automation flow has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting flow:", error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete automation flow. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingFlowId(null);
    }
  };

  const handleTestFlow = async (flow: AutomationFlow) => {
    try {
      await testAutomationTrigger({
        flowId: flow._id,
        userId,
        testData: {
          platform: flow.triggerConditions.platforms[0],
          platformUserId: "test_user_123",
          platformUsername: "testuser",
          content: flow.triggerConditions.keywords?.[0] || "test message",
        },
      });

      toast({
        title: "Test Triggered",
        description: "The automation flow test has been triggered successfully.",
      });
    } catch (error) {
      console.error("Error testing flow:", error);
      toast({
        title: "Test Failed",
        description: "Failed to test automation flow. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "Never";
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const addKeywordField = () => {
    setFormData(prev => ({
      ...prev,
      keywords: [...prev.keywords, ""],
    }));
  };

  const updateKeyword = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.map((k, i) => i === index ? value : k),
    }));
  };

  const removeKeyword = (index: number) => {
    if (formData.keywords.length > 1) {
      setFormData(prev => ({
        ...prev,
        keywords: prev.keywords.filter((_, i) => i !== index),
      }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="h-8 w-8" />
            Social Automation
          </h2>
          <p className="text-muted-foreground">
            Automate your social media interactions with keyword triggers and smart responses
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Automation
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="flows">
            Automation Flows ({flows?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Automation Flows Tab */}
        <TabsContent value="flows" className="space-y-4">
          {flows && flows.length > 0 ? (
            <div className="grid gap-4">
              {flows.map((flow) => (
                <Card key={flow._id} className="relative">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            {getTriggerIcon(flow.triggerType)}
                            <h3 className="font-semibold">{flow.name}</h3>
                          </div>
                          <Badge variant={flow.isActive ? "default" : "secondary"}>
                            {flow.isActive ? "Active" : "Paused"}
                          </Badge>
                          <Badge variant="outline">
                            {flow.triggerType}
                          </Badge>
                        </div>

                        {flow.description && (
                          <p className="text-sm text-muted-foreground">
                            {flow.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {flow.totalTriggers} triggers
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {flow.totalCompletions} completions
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(flow.lastTriggered)}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Platforms:</span>
                          {flow.triggerConditions.platforms.map((platform) => (
                            <span key={platform} className="text-xs">
                              {getPlatformIcon(platform)}
                            </span>
                          ))}
                        </div>

                        {flow.triggerConditions.keywords && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-muted-foreground">Keywords:</span>
                            {flow.triggerConditions.keywords.slice(0, 3).map((keyword, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                            {flow.triggerConditions.keywords.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{flow.triggerConditions.keywords.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Flow has {flow.flowDefinition.nodes.length} steps</span>
                          {flow.flowDefinition.nodes.slice(1).map((node, i) => (
                            <div key={i} className="flex items-center gap-1">
                              {getNodeIcon(node.type)}
                              <span>{node.type}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedFlow(flow);
                            setShowDetailsDialog(true);
                          }}
                        >
                          <Eye className="mr-1 h-3 w-3" />
                          Details
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestFlow(flow)}
                        >
                          <PlayCircle className="mr-1 h-3 w-3" />
                          Test
                        </Button>

                        <Button
                          variant={flow.isActive ? "destructive" : "default"}
                          size="sm"
                          onClick={() => handleToggleFlow(flow._id, !flow.isActive)}
                        >
                          {flow.isActive ? (
                            <>
                              <Pause className="mr-1 h-3 w-3" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="mr-1 h-3 w-3" />
                              Activate
                            </>
                          )}
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={deletingFlowId === flow._id}
                            >
                              {deletingFlowId === flow._id ? (
                                <>
                                  <div className="mr-1 h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                  Deleting...
                                </>
                              ) : (
                                <>
                                  <Trash2 className="mr-1 h-3 w-3" />
                                  Delete
                                </>
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-white dark:bg-black">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                                Delete Automation Flow
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{flow.name}"? This will stop all active automations and delete all related data. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteFlow(flow._id)}
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                <Trash2 className="mr-1 h-3 w-3" />
                                Delete Flow
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bot className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No automation flows yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first automation flow to start automating your social media interactions
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Automation
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Flows</CardTitle>
                <Bot className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{flows?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {flows?.filter(f => f.isActive).length || 0} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Triggers</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {flows?.reduce((sum, flow) => sum + flow.totalTriggers, 0) || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  All time triggers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completions</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {flows?.reduce((sum, flow) => sum + flow.totalCompletions, 0) || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Successful completions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {flows && flows.length > 0 
                    ? Math.round(
                        (flows.reduce((sum, flow) => sum + flow.totalCompletions, 0) / 
                         Math.max(flows.reduce((sum, flow) => sum + flow.totalTriggers, 0), 1)) * 100
                      )
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Completion rate
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Automation Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-white dark:bg-black max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Automation Flow</DialogTitle>
            <DialogDescription>
              Set up a new automation to respond to social media interactions automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Flow Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Lead Magnet for Free Guide"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this automation does..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Trigger Type</Label>
              <Select
                value={formData.triggerType}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, triggerType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-black">
                  <SelectItem value="keyword">Keyword in Comments</SelectItem>
                  <SelectItem value="comment">Any Comment</SelectItem>
                  <SelectItem value="dm">Direct Message</SelectItem>
                  <SelectItem value="mention">Mention</SelectItem>
                  <SelectItem value="hashtag">Hashtag</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.triggerType === "keyword" && (
              <div className="space-y-2">
                <Label>Keywords</Label>
                {formData.keywords.map((keyword, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      placeholder="Enter keyword..."
                      value={keyword}
                      onChange={(e) => updateKeyword(index, e.target.value)}
                    />
                    {formData.keywords.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeKeyword(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" onClick={addKeywordField}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Keyword
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <Label>Match Type</Label>
              <Select
                value={formData.matchType}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, matchType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-black">
                  <SelectItem value="contains">Contains keyword</SelectItem>
                  <SelectItem value="exact">Exact match</SelectItem>
                  <SelectItem value="starts_with">Starts with keyword</SelectItem>
                  <SelectItem value="regex">Regular expression</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Platforms</Label>
              <div className="grid grid-cols-3 gap-2">
                {["instagram", "twitter", "facebook", "linkedin", "tiktok"].map((platform) => (
                  <div key={platform} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={platform}
                      checked={formData.platforms.includes(platform as any)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            platforms: [...prev.platforms, platform as any]
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            platforms: prev.platforms.filter(p => p !== platform)
                          }));
                        }
                      }}
                    />
                    <Label htmlFor={platform} className="capitalize">
                      {getPlatformIcon(platform)} {platform}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFlow}>
              Create Flow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Flow Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="bg-white dark:bg-black max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              {selectedFlow?.name}
            </DialogTitle>
            <DialogDescription>
              Automation flow details and configuration
            </DialogDescription>
          </DialogHeader>

          {selectedFlow && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Trigger Configuration</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <Badge variant="outline">{selectedFlow.triggerType}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Match:</span>
                      <span>{selectedFlow.triggerConditions.matchType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Platforms:</span>
                      <div className="flex gap-1">
                        {selectedFlow.triggerConditions.platforms.map(p => (
                          <span key={p}>{getPlatformIcon(p)}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Performance</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Triggers:</span>
                      <span>{selectedFlow.totalTriggers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Completions:</span>
                      <span>{selectedFlow.totalCompletions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Success Rate:</span>
                      <span>
                        {selectedFlow.totalTriggers > 0 
                          ? Math.round((selectedFlow.totalCompletions / selectedFlow.totalTriggers) * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Triggered:</span>
                      <span>{formatDate(selectedFlow.lastTriggered)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedFlow.triggerConditions.keywords && (
                <div>
                  <h4 className="font-semibold mb-2">Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedFlow.triggerConditions.keywords.map((keyword, i) => (
                      <Badge key={i} variant="outline">{keyword}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-2">Flow Steps</h4>
                <div className="space-y-2">
                  {selectedFlow.flowDefinition.nodes.slice(1).map((node, i) => (
                    <div key={node.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-full">
                        {getNodeIcon(node.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium capitalize">{node.type}</span>
                          {node.type === "message" && node.data.content && (
                            <Badge variant="outline" className="text-xs">
                              {node.data.content.slice(0, 30)}...
                            </Badge>
                          )}
                          {node.type === "delay" && (
                            <Badge variant="outline" className="text-xs">
                              {node.data.delayMinutes}min delay
                            </Badge>
                          )}
                          {node.type === "resource" && (
                            <Badge variant="outline" className="text-xs">
                              {node.data.resourceType}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setShowDetailsDialog(false);
              // TODO: Open flow builder
            }}>
              <Edit3 className="mr-2 h-4 w-4" />
              Edit Flow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

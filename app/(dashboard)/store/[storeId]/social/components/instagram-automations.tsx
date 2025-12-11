"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Zap,
  MessageSquare,
  Sparkles,
  Play,
  Pause,
  BarChart3,
  Plus,
  Settings,
  Instagram,
  AlertCircle,
  Trash2,
  RefreshCw,
  Unplug,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { InstagramDebug } from "./instagram-debug";
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

interface InstagramAutomationsProps {
  storeId: string;
  userId: string;
}

export function InstagramAutomations({ storeId, userId }: InstagramAutomationsProps) {
  const router = useRouter();
  const [creatingAutomation, setCreatingAutomation] = useState(false);
  const [deletingAutomation, setDeletingAutomation] = useState<string | null>(null);
  const [selectedAccountFilter, setSelectedAccountFilter] = useState<string>("all");
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Get Convex user
  const convexUser = useQuery(
    api.users.getUserFromClerk,
    { clerkId: userId }
  );

  // Fetch user's automations
  const automations = useQuery(
    api.automations.getUserAutomations,
    { clerkId: userId }
  );

  // Check Instagram connection
  const instagramStatus = useQuery(
    api.integrations.queries.isInstagramConnected,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

  // Get all Instagram accounts for this store
  const instagramAccounts = useQuery(
    api.socialMedia.getSocialAccounts,
    { storeId }
  );

  const connectedInstagramAccounts = instagramAccounts?.filter(
    (account: any) => account.platform === "instagram" && account.isConnected
  ) || [];

  const isInstagramConnected = connectedInstagramAccounts.length > 0;

  // Mutations
  const createAutomation = useMutation(api.automations.createAutomation);
  const deleteAutomation = useMutation(api.automations.deleteAutomation);
  const disconnectInstagram = useMutation(api.integrations.internal.disconnectInstagram);

  // Handle reconnect - disconnect then reconnect
  const handleReconnectInstagram = async () => {
    if (!convexUser?._id) return;
    
    setIsReconnecting(true);
    try {
      // First disconnect
      const result = await disconnectInstagram({ userId: convexUser._id });
      
      if (result.success) {
        toast.success("Disconnected. Redirecting to reconnect...");
        // Small delay then connect
        setTimeout(() => {
          handleConnectInstagram();
        }, 500);
      } else {
        toast.error(result.message);
        setIsReconnecting(false);
      }
    } catch (error) {
      console.error("Reconnect error:", error);
      toast.error("Failed to reconnect. Please try again.");
      setIsReconnecting(false);
    }
  };

  const handleCreateAutomation = async () => {
    setCreatingAutomation(true);
    try {
      const result = await createAutomation({
        clerkId: userId,
        name: "Comment Reply Bot",
      });

      if (result.status === 201 && result.data) {
        router.push(`/dashboard/social/automation/${result.data._id}`);
      }
    } catch (error) {
      console.error("Failed to create automation:", error);
      toast.error("Failed to create automation");
    } finally {
      setCreatingAutomation(false);
    }
  };

  const handleDeleteAutomation = async (automationId: string, automationName: string) => {
    setDeletingAutomation(automationId);
    try {
      const result = await deleteAutomation({
        automationId: automationId as any,
        clerkId: userId,
      });

      if (result.status === 200) {
        toast.success(`Automation "${automationName}" deleted successfully`);
      } else {
        toast.error(result.message || "Failed to delete automation");
      }
    } catch (error) {
      console.error("Failed to delete automation:", error);
      toast.error("Failed to delete automation");
    } finally {
      setDeletingAutomation(null);
    }
  };

  const handleConnectInstagram = () => {
    // For Instagram Business API, use Facebook Login (not Instagram OAuth)
    const clientId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/instagram/callback`;
    
    if (!clientId) {
      toast.error("Facebook App ID not configured. Add NEXT_PUBLIC_FACEBOOK_APP_ID to your .env file.");
      console.error("Missing NEXT_PUBLIC_FACEBOOK_APP_ID");
      return;
    }

    // Store storeId for redirect after OAuth
    sessionStorage.setItem("lastStoreId", storeId);

    // Use Facebook Login with Instagram permissions
    // NOTE: instagram_manage_comments requires App Review approval for webhooks to work
    const scopes = [
      'instagram_basic',
      'instagram_content_publish',
      'instagram_manage_comments',
      'instagram_manage_messages',
      'pages_show_list',
      'pages_read_engagement',
      'pages_manage_metadata',     // Required for webhooks!
      'pages_messaging',           // Required for sending DMs
      'pages_manage_engagement',   // Required for comment replies
      'business_management',
    ].join(',');

    // Use Facebook OAuth (not Instagram OAuth)
    const oauthUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&response_type=code&state=instagram`;

    // console.log("🔗 Redirecting to Facebook Login (for Instagram permissions):", oauthUrl);
    window.location.href = oauthUrl;
  };

  // Loading state
  if (automations === undefined || instagramStatus === undefined || convexUser === undefined) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Instagram not connected state
  if (!isInstagramConnected) {
    return (
      <Card className="border-2 border-dashed">
        <CardContent className="pt-12 pb-12">
          <div className="text-center max-w-2xl mx-auto">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 flex items-center justify-center">
              <Instagram className="w-10 h-10 text-purple-600" />
            </div>
            
            <h3 className="text-2xl font-bold mb-3">Connect Instagram to Get Started</h3>
            <p className="text-muted-foreground mb-6">
              Automate your Instagram DMs and comments to capture leads and drive sales. Connect your Instagram Business account to enable automations.
            </p>

            <Button
              size="lg"
              onClick={handleConnectInstagram}
              className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 hover:from-purple-700 hover:via-pink-700 hover:to-orange-700 text-white px-8 gap-2 mb-8"
            >
              <Instagram className="w-5 h-5" />
              Connect Instagram Account
            </Button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-white dark:bg-black border border-border rounded-lg p-6 text-left">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                  🎵
                </div>
                <h4 className="font-semibold mb-2">Sample Pack Delivery</h4>
                <p className="text-sm text-muted-foreground">
                  Comment "STEMS" → Auto-send download link via DM
                </p>
              </div>

              <div className="bg-white dark:bg-black border border-border rounded-lg p-6 text-left">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                  🎓
                </div>
                <h4 className="font-semibold mb-2">Course Enrollment</h4>
                <p className="text-sm text-muted-foreground">
                  DM "LEARN" → Smart AI guides them to checkout
                </p>
              </div>

              <div className="bg-white dark:bg-black border border-border rounded-lg p-6 text-left">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center mb-4">
                  💎
                </div>
                <h4 className="font-semibold mb-2">Coaching Upsell</h4>
                <p className="text-sm text-muted-foreground">
                  Comment "FEEDBACK" → Offer 1-on-1 booking
                </p>
              </div>
            </div>

            <div className="mt-8 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start gap-3 text-left">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                    Requirements
                  </p>
                  <ul className="text-yellow-700 dark:text-yellow-300 space-y-1">
                    <li>• Instagram Business or Creator account</li>
                    <li>• Account linked to a Facebook Page</li>
                    <li>• Public account (not private)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Debug Info (remove after testing) */}
      {/* <InstagramDebug userId={userId} /> */}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">Instagram Automations</h2>
          <p className="text-muted-foreground text-sm">
            Automate your Instagram DMs and comments to capture leads
            {connectedInstagramAccounts.length > 1 && (
              <span className="ml-2 text-blue-600">
                • {connectedInstagramAccounts.length} accounts connected
              </span>
            )}
          </p>
          
          {/* Account Filter for Multiple Accounts */}
          {connectedInstagramAccounts.length > 1 && (
            <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <Instagram className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100 text-sm">
                      Filter by Instagram Account
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      {connectedInstagramAccounts.length} accounts connected
                    </p>
                  </div>
                </div>
                
                <div className="flex-1 sm:max-w-xs">
                  <select 
                    value={selectedAccountFilter}
                    onChange={(e) => setSelectedAccountFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-blue-200 dark:border-blue-800 rounded-lg bg-white dark:bg-blue-950 text-blue-900 dark:text-blue-100 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Automations ({automations?.length || 0})</option>
                    {connectedInstagramAccounts.map((account: any) => {
                      const accountAutomations = automations?.filter((auto: any) => 
                        auto.instagramAccountId === account._id
                      ) || [];
                      return (
                        <option key={account._id} value={account._id}>
                          @{account.platformUsername} ({accountAutomations.length})
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-3">
                {connectedInstagramAccounts.map((account: any) => {
                  const isActive = selectedAccountFilter === account._id;
                  return (
                    <button
                      key={account._id}
                      onClick={() => setSelectedAccountFilter(account._id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        isActive
                          ? "bg-blue-600 text-white"
                          : "bg-white dark:bg-blue-900 text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-800"
                      }`}
                    >
                      @{account.platformUsername}
                    </button>
                  );
                })}
                <button
                  onClick={() => setSelectedAccountFilter("all")}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selectedAccountFilter === "all"
                      ? "bg-purple-600 text-white"
                      : "bg-white dark:bg-purple-900 text-purple-700 dark:text-purple-200 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-800"
                  }`}
                >
                  All
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Reconnect button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleReconnectInstagram}
            disabled={isReconnecting}
            className="gap-2"
            title="Fix token issues by reconnecting"
          >
            {isReconnecting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Reconnecting...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Reconnect Instagram
              </>
            )}
          </Button>

          <Button
            size="lg"
            onClick={handleCreateAutomation}
            disabled={creatingAutomation}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            {creatingAutomation ? "Creating..." : "New Automation"}
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground font-normal">
              Total Automations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{automations?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground font-normal">
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {automations?.filter((a: any) => a.active).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground font-normal">
              Total Triggers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {automations?.reduce((sum: number, a: any) => sum + (a.totalTriggers || 0), 0) || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground font-normal">
              DMs Sent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {automations?.reduce((sum: number, a: any) => sum + (a.totalResponses || 0), 0) || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Automations Grid */}
      {automations && automations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {automations
            .filter((automation: any) => {
              if (selectedAccountFilter === "all") return true;
              return automation.instagramAccountId === selectedAccountFilter;
            })
            .map((automation: any) => {
              const automationAccount = connectedInstagramAccounts.find(
                (account: any) => account._id === automation.instagramAccountId
              );

              return (
            <Card
              key={automation._id}
              className="hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => router.push(`/dashboard/social/automation/${automation._id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {automation.name}
                    </CardTitle>
                    {/* Show which Instagram account this automation uses */}
                    {automationAccount && (
                      <div className="flex items-center gap-2 mt-2">
                        <img 
                          src={automationAccount.profileImageUrl} 
                          alt={automationAccount.platformUsername}
                          className="w-4 h-4 rounded-full"
                        />
                        <span className="text-xs text-muted-foreground">
                          @{automationAccount.platformUsername}
                        </span>
                      </div>
                    )}
                  </div>
                  <Badge
                    variant={automation.active ? "default" : "secondary"}
                    className={automation.active ? "bg-green-600" : ""}
                  >
                    {automation.active ? (
                      <>
                        <Play className="w-3 h-3 mr-1" />
                        Active
                      </>
                    ) : (
                      <>
                        <Pause className="w-3 h-3 mr-1" />
                        Inactive
                      </>
                    )}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Trigger Type */}
                {automation.trigger && (
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm text-muted-foreground">
                      Trigger: {automation.trigger.type}
                    </span>
                  </div>
                )}

                {/* Keywords */}
                {automation.keywords && automation.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {automation.keywords.slice(0, 3).map((kw: any) => (
                      <Badge
                        key={kw._id}
                        variant="outline"
                        className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900"
                      >
                        {kw.word}
                      </Badge>
                    ))}
                    {automation.keywords.length > 3 && (
                      <Badge variant="outline">
                        +{automation.keywords.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}

                {/* Listener Type */}
                {automation.listener && (
                  <div className="flex items-center gap-2">
                    {automation.listener.listener === "SMART_AI" ? (
                      <>
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <Badge className="bg-gradient-to-r from-purple-600 to-blue-600">
                          🤖 Smart AI
                        </Badge>
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                        <Badge variant="secondary">💬 Message</Badge>
                      </>
                    )}
                  </div>
                )}
              </CardContent>

              <CardFooter className="border-t pt-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <div>
                      <BarChart3 className="w-4 h-4 inline mr-1" />
                      {automation.totalTriggers || 0} triggers
                    </div>
                    <div>
                      💬 {automation.totalResponses || 0} sent
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/social/automation/${automation._id}`);
                      }}
                    >
                    <Settings className="w-4 h-4" />
                    Edit
                  </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                          disabled={deletingAutomation === automation._id}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {deletingAutomation === automation._id ? (
                            <>
                              <div className="w-4 h-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </>
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-white dark:bg-black">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-red-500" />
                            Delete Automation
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{automation.name}"? This will permanently delete:
                            <div className="mt-3 space-y-1 text-sm">
                              <div>• All automation rules and keywords</div>
                              <div>• All trigger history ({automation.totalTriggers || 0} triggers)</div>
                              <div>• All response data ({automation.totalResponses || 0} messages)</div>
                            </div>
                            <div className="mt-3 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                                This action cannot be undone.
                              </p>
                            </div>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep Automation</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeleteAutomation(automation._id, automation.name);
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            <Trash2 className="mr-1 h-3 w-3" />
                            Delete Permanently
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        /* Empty State */
        <Card className="border-2 border-dashed">
          <CardContent className="pt-12 pb-12">
            <div className="text-center max-w-2xl mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 flex items-center justify-center">
                <Zap className="w-10 h-10 text-purple-600" />
              </div>
              
              <h3 className="text-2xl font-bold mb-3">No automations yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first automation to start capturing leads and driving sales on Instagram
              </p>
              
              <Button
                size="lg"
                onClick={handleCreateAutomation}
                disabled={creatingAutomation}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 mb-8"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Automation
              </Button>

              {/* Example Use Cases */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                <div className="bg-white dark:bg-black border border-border rounded-lg p-6">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                    🎵
                  </div>
                  <h4 className="font-semibold mb-2">Sample Pack Delivery</h4>
                  <p className="text-sm text-muted-foreground">
                    Comment "STEMS" → Auto-send download link via DM
                  </p>
                </div>

                <div className="bg-white dark:bg-black border border-border rounded-lg p-6">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                    🎓
                  </div>
                  <h4 className="font-semibold mb-2">Course Enrollment</h4>
                  <p className="text-sm text-muted-foreground">
                    DM "LEARN" → Smart AI guides them to course checkout
                  </p>
                </div>

                <div className="bg-white dark:bg-black border border-border rounded-lg p-6">
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center mb-4">
                    💎
                  </div>
                  <h4 className="font-semibold mb-2">Coaching Upsell</h4>
                  <p className="text-sm text-muted-foreground">
                    Comment "FEEDBACK" → Offer 1-on-1 session booking
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


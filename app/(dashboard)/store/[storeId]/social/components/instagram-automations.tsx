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
  const convexUser = useQuery(api.users.getUserFromClerk, { clerkId: userId });

  // Fetch user's automations
  const automations = useQuery(api.automations.getUserAutomations, { clerkId: userId });

  // Check Instagram connection
  const instagramStatus = useQuery(
    api.integrations.queries.isInstagramConnected,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

  // Get all Instagram accounts for this store
  const instagramAccounts = useQuery(api.socialMedia.getSocialAccounts, { storeId });

  const connectedInstagramAccounts =
    instagramAccounts?.filter(
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
    const clientId =
      process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/instagram/callback`;

    if (!clientId) {
      toast.error(
        "Facebook App ID not configured. Add NEXT_PUBLIC_FACEBOOK_APP_ID to your .env file."
      );
      console.error("Missing NEXT_PUBLIC_FACEBOOK_APP_ID");
      return;
    }

    // Store storeId for redirect after OAuth
    sessionStorage.setItem("lastStoreId", storeId);

    // Use Facebook Login with Instagram permissions
    // NOTE: instagram_manage_comments requires App Review approval for webhooks to work
    const scopes = [
      "instagram_basic",
      "instagram_content_publish",
      "instagram_manage_comments",
      "instagram_manage_messages",
      "pages_show_list",
      "pages_read_engagement",
      "pages_manage_metadata", // Required for webhooks!
      "pages_messaging", // Required for sending DMs
      "pages_manage_engagement", // Required for comment replies
      "business_management",
    ].join(",");

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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
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

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
        <CardContent className="pb-12 pt-12">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900">
              <Instagram className="h-10 w-10 text-purple-600" />
            </div>

            <h3 className="mb-3 text-2xl font-bold">Connect Instagram to Get Started</h3>
            <p className="mb-6 text-muted-foreground">
              Automate your Instagram DMs and comments to capture leads and drive sales. Connect
              your Instagram Business account to enable automations.
            </p>

            <Button
              size="lg"
              onClick={handleConnectInstagram}
              className="mb-8 gap-2 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 px-8 text-white hover:from-purple-700 hover:via-pink-700 hover:to-orange-700"
            >
              <Instagram className="h-5 w-5" />
              Connect Instagram Account
            </Button>

            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-lg border border-border bg-white p-6 text-left dark:bg-black">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                  🎵
                </div>
                <h4 className="mb-2 font-semibold">Sample Pack Delivery</h4>
                <p className="text-sm text-muted-foreground">
                  Comment "STEMS" → Auto-send download link via DM
                </p>
              </div>

              <div className="rounded-lg border border-border bg-white p-6 text-left dark:bg-black">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                  🎓
                </div>
                <h4 className="mb-2 font-semibold">Course Enrollment</h4>
                <p className="text-sm text-muted-foreground">
                  DM "LEARN" → Smart AI guides them to checkout
                </p>
              </div>

              <div className="rounded-lg border border-border bg-white p-6 text-left dark:bg-black">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900">
                  💎
                </div>
                <h4 className="mb-2 font-semibold">Coaching Upsell</h4>
                <p className="text-sm text-muted-foreground">
                  Comment "FEEDBACK" → Offer 1-on-1 booking
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950">
              <div className="flex items-start gap-3 text-left">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600" />
                <div className="text-sm">
                  <p className="mb-1 font-semibold text-yellow-900 dark:text-yellow-100">
                    Requirements
                  </p>
                  <ul className="space-y-1 text-yellow-700 dark:text-yellow-300">
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
          <h2 className="mb-1 text-2xl font-bold">Instagram Automations</h2>
          <p className="text-sm text-muted-foreground">
            Automate your Instagram DMs and comments to capture leads
            {connectedInstagramAccounts.length > 1 && (
              <span className="ml-2 text-blue-600">
                • {connectedInstagramAccounts.length} accounts connected
              </span>
            )}
          </p>

          {/* Account Filter for Multiple Accounts */}
          {connectedInstagramAccounts.length > 1 && (
            <div className="mt-3 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 p-4 dark:border-blue-800 dark:from-blue-950 dark:to-purple-950">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <Instagram className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
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
                    className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-blue-900 focus:ring-2 focus:ring-blue-500 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100"
                  >
                    <option value="all">All Automations ({automations?.length || 0})</option>
                    {connectedInstagramAccounts.map((account: any) => {
                      const accountAutomations =
                        automations?.filter(
                          (auto: any) => auto.instagramAccountId === account._id
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

              <div className="mt-3 flex flex-wrap gap-2">
                {connectedInstagramAccounts.map((account: any) => {
                  const isActive = selectedAccountFilter === account._id;
                  return (
                    <button
                      key={account._id}
                      onClick={() => setSelectedAccountFilter(account._id)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        isActive
                          ? "bg-blue-600 text-white"
                          : "border border-blue-200 bg-white text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
                      }`}
                    >
                      @{account.platformUsername}
                    </button>
                  );
                })}
                <button
                  onClick={() => setSelectedAccountFilter("all")}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    selectedAccountFilter === "all"
                      ? "bg-purple-600 text-white"
                      : "border border-purple-200 bg-white text-purple-700 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-900 dark:text-purple-200 dark:hover:bg-purple-800"
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
                <RefreshCw className="h-4 w-4 animate-spin" />
                Reconnecting...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
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
            <Plus className="mr-2 h-4 w-4" />
            {creatingAutomation ? "Creating..." : "New Automation"}
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Total Automations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{automations?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-normal text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {automations?.filter((a: any) => a.active).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-normal text-muted-foreground">
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
            <CardTitle className="text-sm font-normal text-muted-foreground">DMs Sent</CardTitle>
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
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                  className="group cursor-pointer transition-shadow hover:shadow-lg"
                  onClick={() => router.push(`/dashboard/social/automation/${automation._id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl transition-colors group-hover:text-primary">
                          {automation.name}
                        </CardTitle>
                        {/* Show which Instagram account this automation uses */}
                        {automationAccount && (
                          <div className="mt-2 flex items-center gap-2">
                            <img
                              src={automationAccount.profileImageUrl}
                              alt={automationAccount.platformUsername}
                              className="h-4 w-4 rounded-full"
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
                            <Play className="mr-1 h-3 w-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <Pause className="mr-1 h-3 w-3" />
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
                        <Zap className="h-4 w-4 text-yellow-600" />
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
                          <Badge variant="outline">+{automation.keywords.length - 3} more</Badge>
                        )}
                      </div>
                    )}

                    {/* Listener Type */}
                    {automation.listener && (
                      <div className="flex items-center gap-2">
                        {automation.listener.listener === "SMART_AI" ? (
                          <>
                            <Sparkles className="h-4 w-4 text-purple-600" />
                            <Badge className="bg-gradient-to-r from-purple-600 to-blue-600">
                              🤖 Smart AI
                            </Badge>
                          </>
                        ) : (
                          <>
                            <MessageSquare className="h-4 w-4 text-blue-600" />
                            <Badge variant="secondary">💬 Message</Badge>
                          </>
                        )}
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="border-t pt-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex w-full items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <div>
                          <BarChart3 className="mr-1 inline h-4 w-4" />
                          {automation.totalTriggers || 0} triggers
                        </div>
                        <div>💬 {automation.totalResponses || 0} sent</div>
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
                          <Settings className="h-4 w-4" />
                          Edit
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"
                              disabled={deletingAutomation === automation._id}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {deletingAutomation === automation._id ? (
                                <>
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                                  Deleting...
                                </>
                              ) : (
                                <>
                                  <Trash2 className="h-4 w-4" />
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
                                Are you sure you want to delete "{automation.name}"? This will
                                permanently delete:
                                <div className="mt-3 space-y-1 text-sm">
                                  <div>• All automation rules and keywords</div>
                                  <div>
                                    • All trigger history ({automation.totalTriggers || 0} triggers)
                                  </div>
                                  <div>
                                    • All response data ({automation.totalResponses || 0} messages)
                                  </div>
                                </div>
                                <div className="mt-3 rounded-lg bg-red-50 p-3 dark:bg-red-950">
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
                                className="bg-red-600 text-white hover:bg-red-700"
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
              );
            })}
        </div>
      ) : (
        /* Empty State */
        <Card className="border-2 border-dashed">
          <CardContent className="pb-12 pt-12">
            <div className="mx-auto max-w-2xl text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900">
                <Zap className="h-10 w-10 text-purple-600" />
              </div>

              <h3 className="mb-3 text-2xl font-bold">No automations yet</h3>
              <p className="mb-6 text-muted-foreground">
                Create your first automation to start capturing leads and driving sales on Instagram
              </p>

              <Button
                size="lg"
                onClick={handleCreateAutomation}
                disabled={creatingAutomation}
                className="mb-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Automation
              </Button>

              {/* Example Use Cases */}
              <div className="grid grid-cols-1 gap-6 text-left md:grid-cols-3">
                <div className="rounded-lg border border-border bg-white p-6 dark:bg-black">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                    🎵
                  </div>
                  <h4 className="mb-2 font-semibold">Sample Pack Delivery</h4>
                  <p className="text-sm text-muted-foreground">
                    Comment "STEMS" → Auto-send download link via DM
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-white p-6 dark:bg-black">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                    🎓
                  </div>
                  <h4 className="mb-2 font-semibold">Course Enrollment</h4>
                  <p className="text-sm text-muted-foreground">
                    DM "LEARN" → Smart AI guides them to course checkout
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-white p-6 dark:bg-black">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900">
                    💎
                  </div>
                  <h4 className="mb-2 font-semibold">Coaching Upsell</h4>
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

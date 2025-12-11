"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { EmptyStateEnhanced } from "@/components/ui/empty-state-enhanced";
import { Calendar, Clock, Instagram, Twitter, Facebook, Linkedin, TrendingUp, Plus, Trash2, Edit3, AlertTriangle, RefreshCw, Users, Send, CheckCircle, Zap, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AccountManagementDialog } from "./account-management-dialog";
import { PostComposer } from "./post-composer";
import { AutomationManager } from "./automation-manager";
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

interface SocialSchedulerProps {
  storeId: string;
  userId: string;
}

export function SocialScheduler({ storeId, userId }: SocialSchedulerProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("accounts");
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [showPostComposer, setShowPostComposer] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [refreshingToken, setRefreshingToken] = useState<string | null>(null);

  // Listen for OAuth popup success/error messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'oauth_success') {
        toast({
          title: "🎉 Connected Successfully!",
          description: `${event.data.platform} account has been connected.`,
          className: "bg-white dark:bg-black",
        });
        
        // Refresh the page to show new connection
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else if (event.data.type === 'oauth_error') {
        toast({
          title: "Connection Failed",
          description: `Failed to connect ${event.data.platform}: ${event.data.error}`,
          variant: "destructive",
          className: "bg-white dark:bg-black",
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [toast]);

  // Mutations
  const deletePost = useMutation(api.socialMedia.deleteScheduledPost);
  const refreshToken = useMutation(api.socialMedia.refreshAccountToken);

  // Fetch connected accounts
  const accounts = useQuery(api.socialMedia.getSocialAccounts, { storeId });

  // Fetch scheduled posts
  const scheduledPosts = useQuery(api.socialMedia.getScheduledPosts, {
    storeId,
    status: "scheduled",
    limit: 50,
  });

  const publishedPosts = useQuery(api.socialMedia.getScheduledPosts, {
    storeId,
    status: "published",
    limit: 20,
  });

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "instagram":
        return <Instagram className="h-5 w-5" />;
      case "twitter":
        return <Twitter className="h-5 w-5" />;
      case "facebook":
        return <Facebook className="h-5 w-5" />;
      case "linkedin":
        return <Linkedin className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "instagram":
        return "bg-gradient-to-r from-purple-500 to-pink-500";
      case "twitter":
        return "bg-blue-400";
      case "facebook":
        return "bg-blue-600";
      case "linkedin":
        return "bg-blue-700";
      case "tiktok":
        return "bg-black";
      default:
        return "bg-gray-500";
    }
  };

  const handleRefreshToken = async (accountId: string, platform: string) => {
    // For Instagram, we need to reconnect via OAuth (tokens can't be refreshed programmatically)
    if (platform === "instagram") {
      setRefreshingToken(accountId);
      toast({
        title: "🔄 Reconnecting Instagram",
        description: "Redirecting to Facebook Login to get a fresh token...",
        className: "bg-white dark:bg-black",
      });
      
      // Trigger the OAuth flow
      setTimeout(() => {
        connectPlatform("instagram");
      }, 1000);
      return;
    }

    // For other platforms, try the standard refresh
    setRefreshingToken(accountId);
    try {
      await refreshToken({
        accountId,
      });
      
      toast({
        title: "🔄 Token Refreshed",
        description: `${platform} access token has been refreshed successfully.`,
        className: "bg-white dark:bg-black",
      });
      
      // Refresh the page to show updated connection
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Token refresh error:", error);
      toast({
        title: "Refresh Failed",
        description: `Failed to refresh ${platform} token. Try reconnecting the account.`,
        variant: "destructive",
        className: "bg-white dark:bg-black",
      });
    } finally {
      setRefreshingToken(null);
    }
  };

  const connectPlatform = (platform: string) => {
    const redirectUri = `${window.location.origin}/api/social/oauth/${platform}/callback`;
    const state = storeId;

    const authUrls: Record<string, string> = {
      instagram: `https://www.facebook.com/v21.0/dialog/oauth?client_id=${process.env.NEXT_PUBLIC_FACEBOOK_APP_ID}&redirect_uri=${redirectUri}&state=${state}&scope=instagram_business_basic,instagram_business_manage_comments,instagram_business_manage_messages,instagram_business_content_publish,pages_manage_posts,pages_read_engagement,pages_show_list,pages_manage_metadata,pages_messaging,pages_manage_engagement,business_management&display=popup&response_type=code&auth_type=rerequest`,
      twitter: `https://twitter.com/i/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID}&redirect_uri=${redirectUri}&state=${state}&scope=tweet.read tweet.write users.read offline.access&response_type=code&code_challenge=challenge&code_challenge_method=plain`,
      facebook: `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.NEXT_PUBLIC_FACEBOOK_APP_ID}&redirect_uri=${redirectUri}&state=${state}&scope=pages_read_engagement,pages_manage_posts,pages_show_list,business_management&auth_type=rerequest`,
      linkedin: `https://www.linkedin.com/oauth/v2/authorization?client_id=${process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID}&redirect_uri=${redirectUri}&state=${state}&scope=r_liteprofile r_emailaddress w_member_social&response_type=code`,
      tiktok: `https://www.tiktok.com/auth/authorize/?client_key=${process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY}&redirect_uri=${redirectUri}&state=${state}&scope=user.info.basic,video.upload,video.publish&response_type=code`,
    };

    if (authUrls[platform]) {
      // Open OAuth in popup window (like professional tools)
      const popup = window.open(
        authUrls[platform],
        'oauth_popup',
        'width=500,height=700,scrollbars=yes,resizable=yes'
      );

      // Listen for popup completion
      const checkPopup = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkPopup);
          // Refresh page data after OAuth completion
          window.location.reload();
        }
      }, 1000);

      // Handle popup blocking
      if (!popup) {
        toast({
          title: "Popup blocked",
          description: "Please allow popups and try again",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Platform not supported",
        description: `${platform} integration coming soon!`,
        variant: "destructive",
      });
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const handleDeletePost = async (postId: string) => {
    try {
      setDeletingPostId(postId);
      
      await deletePost({
        postId: postId as Id<"scheduledPosts">,
        userId,
      });
      
      toast({
        title: "Post Deleted",
        description: "The scheduled post has been successfully deleted.",
      });
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({
        title: "Delete Failed", 
        description: "Failed to delete the scheduled post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingPostId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Social Media Scheduler</h2>
          <p className="text-muted-foreground">
            Schedule and manage posts across all your social platforms
          </p>
        </div>
        <Button onClick={() => setShowPostComposer(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Schedule Post
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* Mobile: Horizontal scroll with icons + short text */}
        {/* Desktop: Clean horizontal tabs with full text */}
        <TabsList className="w-full sm:w-auto h-auto overflow-x-auto flex gap-1 p-1">
          <TabsTrigger value="accounts" className="gap-2 px-3 py-2 text-sm whitespace-nowrap">
            <Users className="h-4 w-4 hidden sm:block" />
            Accounts
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="gap-2 px-3 py-2 text-sm whitespace-nowrap">
            <Send className="h-4 w-4 hidden sm:block" />
            Scheduled
            {(scheduledPosts?.length || 0) > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {scheduledPosts?.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="published" className="gap-2 px-3 py-2 text-sm whitespace-nowrap">
            <CheckCircle className="h-4 w-4 hidden sm:block" />
            Published
          </TabsTrigger>
          <TabsTrigger value="automation" className="gap-2 px-3 py-2 text-sm whitespace-nowrap">
            <Zap className="h-4 w-4 hidden sm:block" />
            Automation
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2 px-3 py-2 text-sm whitespace-nowrap">
            <BarChart3 className="h-4 w-4 hidden sm:block" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Connected Accounts Tab */}
        <TabsContent value="accounts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Connect Your Social Accounts</CardTitle>
              <CardDescription>
                Connect your social media accounts to start scheduling posts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {["instagram", "twitter", "facebook", "linkedin", "tiktok"].map((platform) => {
                  // Get all accounts for this platform (supports multiple)
                  const platformAccounts = accounts?.filter((a) => a.platform === platform && a.isConnected) || [];
                  const hasAccounts = platformAccounts.length > 0;
                  const isComingSoon = platform !== "instagram" && platform !== "facebook";

                  return (
                    <Card key={platform} className="relative overflow-hidden">
                      <div className={`absolute top-0 left-0 right-0 h-1 ${getPlatformColor(platform)}`} />
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            {getPlatformIcon(platform)}
                            <div>
                              <h3 className="font-semibold capitalize">{platform}</h3>
                              {hasAccounts && (
                                <p className="text-sm text-muted-foreground">
                                  {platformAccounts.length} account{platformAccounts.length > 1 ? 's' : ''} connected
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {isComingSoon && (
                              <Badge variant="secondary" className="bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-800">
                                Coming Soon
                              </Badge>
                            )}
                          {hasAccounts && (
                            <Badge variant="default" className="bg-green-500">
                              Connected
                            </Badge>
                          )}
                          </div>
                        </div>

                        {isComingSoon ? (
                          <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                              {platform === "twitter" && "Twitter/X integration is currently in development."}
                              {platform === "linkedin" && "LinkedIn integration is currently in development."}
                              {platform === "tiktok" && "TikTok integration is currently in development."}
                            </p>
                            <Button
                              className="w-full"
                              variant="outline"
                              disabled
                            >
                              Coming Soon
                            </Button>
                          </div>
                        ) : hasAccounts ? (
                          <div className="space-y-2">
                            {/* Show all connected accounts */}
                            <div className="space-y-1 mb-3">
                              {platformAccounts.map((account) => (
                                <div key={account._id} className="text-sm p-2 bg-muted/50 rounded">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium">
                                      @{account.platformUsername}
                                    </span>
                                    {account.platformDisplayName && (
                                      <span className="text-xs text-muted-foreground truncate ml-2">
                                        {account.platformDisplayName}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => connectPlatform(platform)}
                              >
                                Add Another
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => {
                                  // For now, manage the first account. Later we can show a list
                                  setSelectedAccount(platformAccounts[0]);
                                  setShowAccountDialog(true);
                                }}
                              >
                                Manage
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 gap-1"
                                onClick={() => handleRefreshToken(platformAccounts[0]._id, platform)}
                                disabled={refreshingToken === platformAccounts[0]._id}
                                title="Refresh access token for better permissions"
                              >
                                {refreshingToken === platformAccounts[0]._id ? (
                                  <>
                                    <div className="w-3 h-3 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                                    Refreshing...
                                  </>
                                ) : (
                                  <>
                                    <RefreshCw className="w-3 h-3" />
                                    Refresh
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            className="w-full"
                            onClick={() => connectPlatform(platform)}
                          >
                            Connect {platform}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scheduled Posts Tab */}
        <TabsContent value="scheduled" className="space-y-4">
          {scheduledPosts && scheduledPosts.length > 0 ? (
            <div className="grid gap-4">
              {scheduledPosts.map((post: any) => (
                <Card key={post._id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                          {post.account && getPlatformIcon(post.account.platform)}
                          <Badge variant="outline">
                            {post.account?.platformUsername || "Unknown"}
                          </Badge>
                          <Badge variant="secondary" className="flex items-center">
                            <Clock className="mr-1 h-3 w-3" />
                            {formatDate(post.scheduledFor)}
                          </Badge>
                        </div>
                        <p className="text-sm">{post.content}</p>
                        {post.mediaUrls && post.mediaUrls.length > 0 && (
                          <div className="flex space-x-2">
                            {post.mediaUrls.map((url: string, idx: number) => (
                              <img
                                key={idx}
                                src={url}
                                alt="Post media"
                                className="h-20 w-20 rounded object-cover"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setEditingPost(post);
                            setShowPostComposer(true);
                          }}
                        >
                          <Edit3 className="mr-1 h-3 w-3" />
                          Edit
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              disabled={deletingPostId === post._id}
                            >
                              {deletingPostId === post._id ? (
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
                                Delete Scheduled Post
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this scheduled post? This action cannot be undone.
                                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                  <p className="text-sm font-medium">Post Content:</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-3">
                                    {post.content}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-2">
                                    Scheduled for: {formatDate(post.scheduledFor)}
                                  </p>
                                </div>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Keep Post</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeletePost(post._id)}
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                <Trash2 className="mr-1 h-3 w-3" />
                                Delete Post
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
            <EmptyStateEnhanced
              icon={Calendar}
              title="No scheduled posts yet"
              description="Schedule posts across Instagram, Twitter, Facebook, and LinkedIn. Save time and maintain consistent presence."
              showSuccessMetric={{
                label: "Creators who post 3x/week",
                value: "2.5x more followers"
              }}
              actions={[
                {
                  label: "Schedule Post",
                  onClick: () => setActiveTab("create"),
                  icon: Plus
                }
              ]}
              tips={[
                {
                  icon: Calendar,
                  title: "Plan Ahead",
                  description: "Schedule a week's worth of content in one sitting for consistency."
                },
                {
                  icon: TrendingUp,
                  title: "Best Times to Post",
                  description: "Post when your audience is most active: weekdays 10am-2pm."
                },
                {
                  icon: Instagram,
                  title: "Cross-Platform",
                  description: "Reuse content across platforms to maximize reach with minimal effort."
                }
              ]}
              examples={[
                {
                  title: "New Product Announcement",
                  description: "Share when you release a new sample pack or course",
                  badge: "High Impact"
                },
                {
                  title: "Behind the Scenes",
                  description: "Show your production process to build connection",
                  badge: "Engaging"
                },
                {
                  title: "Tutorial Snippets",
                  description: "Share quick tips from your courses as teasers",
                  badge: "Value-Add"
                },
                {
                  title: "User Testimonials",
                  description: "Showcase reviews and success stories",
                  badge: "Social Proof"
                }
              ]}
              variant="default"
            />
          )}
        </TabsContent>

        {/* Published Posts Tab */}
        <TabsContent value="published" className="space-y-4">
          {publishedPosts && publishedPosts.length > 0 ? (
            <div className="grid gap-4">
              {publishedPosts.map((post: any) => (
                <Card key={post._id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                          {post.account && getPlatformIcon(post.account.platform)}
                          <Badge variant="outline">
                            {post.account?.platformUsername || "Unknown"}
                          </Badge>
                          <Badge variant="default" className="bg-green-500">
                            Published
                          </Badge>
                          {post.publishedAt && (
                            <span className="text-sm text-muted-foreground">
                              {formatDate(post.publishedAt)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm">{post.content}</p>
                        {post.platformPostUrl && (
                          <a
                            href={post.platformPostUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-500 hover:underline"
                          >
                            View on {post.account?.platform}
                          </a>
                        )}
                      </div>
                      <Button variant="outline" size="sm">
                        <TrendingUp className="mr-2 h-4 w-4" />
                        View Analytics
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No published posts yet</h3>
                <p className="text-muted-foreground text-center">
                  Your published posts will appear here
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Automation Tab */}
        <TabsContent value="automation">
          <AutomationManager 
            storeId={storeId} 
            userId={userId} 
            onSwitchToAccounts={() => setActiveTab("accounts")}
          />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Analytics Dashboard</h3>
              <p className="text-muted-foreground text-center mb-4">
                Track your post performance across all platforms
              </p>
              <Button variant="outline" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Account Management Dialog */}
      <AccountManagementDialog
        account={selectedAccount}
        userId={userId}
        open={showAccountDialog}
        onOpenChange={setShowAccountDialog}
        onReconnect={connectPlatform}
      />

      {/* Post Composer Dialog */}
      <PostComposer
        storeId={storeId}
        userId={userId}
        open={showPostComposer}
        onOpenChange={(open) => {
          setShowPostComposer(open);
          if (!open) {
            setEditingPost(null); // Clear editing post when dialog closes
          }
        }}
        editPost={editingPost ? {
          _id: editingPost._id,
          socialAccountId: editingPost.socialAccountId,
          content: editingPost.content,
          postType: editingPost.postType,
          scheduledFor: editingPost.scheduledFor,
          timezone: editingPost.timezone,
          mediaStorageIds: editingPost.mediaStorageIds,
        } : undefined}
        onSuccess={() => {
          toast({
            title: editingPost ? "Post updated!" : "Post scheduled!",
            description: editingPost ? "Your post has been updated successfully" : "Your post has been scheduled successfully",
          });
          setEditingPost(null);
        }}
      />
    </div>
  );
}

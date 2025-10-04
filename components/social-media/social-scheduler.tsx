"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Instagram, Twitter, Facebook, Linkedin, TrendingUp, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AccountManagementDialog } from "./account-management-dialog";
import { PostComposer } from "./post-composer";

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

  const connectPlatform = (platform: string) => {
    const redirectUri = `${window.location.origin}/api/social/oauth/${platform}/callback`;
    const state = storeId;

    const authUrls: Record<string, string> = {
      instagram: `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.NEXT_PUBLIC_FACEBOOK_APP_ID}&redirect_uri=${redirectUri}&state=${state}&scope=instagram_basic,instagram_content_publish,pages_read_engagement,pages_manage_posts,pages_show_list,business_management`,
      twitter: `https://twitter.com/i/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID}&redirect_uri=${redirectUri}&state=${state}&scope=tweet.read tweet.write users.read offline.access&response_type=code&code_challenge=challenge&code_challenge_method=plain`,
      facebook: `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.NEXT_PUBLIC_FACEBOOK_APP_ID}&redirect_uri=${redirectUri}&state=${state}&scope=pages_read_engagement,pages_manage_posts,pages_show_list,business_management&auth_type=rerequest`,
      linkedin: `https://www.linkedin.com/oauth/v2/authorization?client_id=${process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID}&redirect_uri=${redirectUri}&state=${state}&scope=r_liteprofile r_emailaddress w_member_social&response_type=code`,
      tiktok: `https://www.tiktok.com/auth/authorize/?client_key=${process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY}&redirect_uri=${redirectUri}&state=${state}&scope=user.info.basic,video.upload,video.publish&response_type=code`,
    };

    if (authUrls[platform]) {
      window.location.href = authUrls[platform];
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
        <TabsList>
          <TabsTrigger value="accounts">Connected Accounts</TabsTrigger>
          <TabsTrigger value="scheduled">
            Scheduled ({scheduledPosts?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
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
                          {hasAccounts && (
                            <Badge variant="default" className="bg-green-500">
                              Connected
                            </Badge>
                          )}
                        </div>

                        {hasAccounts ? (
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
                            <div className="flex gap-2">
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
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No scheduled posts</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Schedule your first post to get started
                </p>
                <Button onClick={() => setActiveTab("create")}>
                  Schedule Post
                </Button>
              </CardContent>
            </Card>
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

"use client";

import { useAction, useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Image as ImageIcon, Video, Layers, RefreshCw, Play } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface InstagramPost {
  id: string;
  caption?: string;
  media_url: string;
  thumbnail_url?: string; // For videos
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  timestamp?: string;
  permalink?: string;
}

interface InstagramPostSelectorProps {
  userId: Id<"users">;
  automationId: Id<"automations">;
  selectedPostIds?: string[];
}

export function InstagramPostSelector({
  userId,
  automationId,
  selectedPostIds = [],
}: InstagramPostSelectorProps) {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set(selectedPostIds));
  const [saving, setSaving] = useState(false);

  // Get Instagram posts
  const fetchPosts = useAction(api.integrations.instagram.getUserPosts);
  
  // Save posts mutation
  const savePostsMutation = useMutation(api.automations.savePosts);

  // Fetch existing attached posts from automation
  const automation = useQuery(api.automations.getAutomationById, {
    automationId,
  });

  useEffect(() => {
    loadPosts();
  }, []);

  // Sync selected posts from automation data
  useEffect(() => {
    if (automation?.posts && automation.posts.length > 0) {
      setSelectedPosts(new Set(automation.posts.map((p: any) => p.postId)));
    }
  }, [automation]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      console.log("📡 Fetching Instagram posts for user:", userId);
      const result = await fetchPosts({ userId });
      
      console.log("📥 Fetch result:", result);
      
      if (result.status === 200 && result.data) {
        // Check if data is an array
        if (!Array.isArray(result.data)) {
          console.error("❌ API returned non-array data:", result.data);
          toast.error("Invalid response from Instagram API");
          return;
        }

        // Transform Instagram API response to our format
        const transformedPosts = result.data.map((post: any) => ({
          id: post.id,
          caption: post.caption,
          media_url: post.media_url,
          thumbnail_url: post.thumbnail_url, // For videos
          media_type: post.media_type,
          timestamp: post.timestamp,
          permalink: post.permalink,
        }));
        
        setPosts(transformedPosts);
        console.log("✅ Loaded Instagram posts:", transformedPosts.length);
        
        if (transformedPosts.length === 0) {
          toast.info("No posts found on your Instagram account");
        }
      } else if (result.status === 404) {
        console.error("❌ Instagram not connected");
        toast.error("Instagram not connected. Please reconnect your account.");
      } else {
        const errorMsg = result.data?.error || "Failed to fetch Instagram posts";
        console.error("❌ Fetch posts error:", errorMsg);
        toast.error(errorMsg);
      }
    } catch (error: any) {
      console.error("❌ Error fetching posts:", error);
      toast.error(error.message || "Failed to load Instagram posts");
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePost = (postId: string) => {
    setSelectedPosts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const handleSavePosts = async () => {
    if (selectedPosts.size === 0) {
      toast.error("Select at least one post");
      return;
    }

    setSaving(true);
    try {
      // Get full post data for selected posts
      const postsToSave = posts
        .filter((p) => selectedPosts.has(p.id))
        .map((post) => ({
          postId: post.id,
          caption: post.caption,
          media: post.media_url,
          mediaType: post.media_type,
        }));

      const result = await savePostsMutation({
        automationId,
        posts: postsToSave,
      });

      if (result.status === 200) {
        toast.success(`${postsToSave.length} post${postsToSave.length > 1 ? 's' : ''} attached`);
      } else {
        toast.error("Failed to save posts");
      }
    } catch (error) {
      console.error("Error saving posts:", error);
      toast.error("Failed to attach posts");
    } finally {
      setSaving(false);
    }
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case "VIDEO":
        return <Video className="w-4 h-4" />;
      case "CAROUSEL_ALBUM":
        return <Layers className="w-4 h-4" />;
      default:
        return <ImageIcon className="w-4 h-4" />;
    }
  };

  const getMediaTypeBadge = (type: string) => {
    switch (type) {
      case "VIDEO":
        return (
          <Badge className="gap-1 bg-red-600 text-white border-0">
            <Video className="w-3 h-3" /> Video
          </Badge>
        );
      case "CAROUSEL_ALBUM":
        return (
          <Badge className="gap-1 bg-blue-600 text-white border-0">
            <Layers className="w-3 h-3" /> Carousel
          </Badge>
        );
      default:
        return (
          <Badge className="gap-1 bg-green-600 text-white border-0">
            <ImageIcon className="w-3 h-3" /> Image
          </Badge>
        );
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Loading your Instagram posts...</p>
          <Skeleton className="h-10 w-24" />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (posts.length === 0) {
    return (
      <div className="border-2 border-dashed border-muted rounded-lg p-12 text-center">
        <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="font-semibold mb-2">No Instagram posts found</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Make sure your Instagram account has published posts
        </p>
        <Button
          variant="outline"
          onClick={loadPosts}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Posts
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {selectedPosts.size} of {posts.length} posts selected
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadPosts}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button
            onClick={handleSavePosts}
            disabled={saving || selectedPosts.size === 0}
            className="gap-2"
          >
            {saving ? "Saving..." : `Attach ${selectedPosts.size} Post${selectedPosts.size !== 1 ? 's' : ''}`}
          </Button>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {posts.map((post) => {
          const isSelected = selectedPosts.has(post.id);

          return (
            <Card
              key={post.id}
              className={`
                relative overflow-hidden cursor-pointer transition-all group
                ${isSelected
                  ? "ring-2 ring-purple-600 ring-offset-2"
                  : "hover:ring-2 hover:ring-purple-400 hover:ring-offset-2"
                }
              `}
              onClick={() => handleTogglePost(post.id)}
            >
              {/* Media Preview */}
              <div className="aspect-square relative bg-gray-100 dark:bg-gray-900">
                <Image
                  src={post.media_type === "VIDEO" && post.thumbnail_url 
                    ? post.thumbnail_url 
                    : post.media_url
                  }
                  alt={post.caption || "Instagram post"}
                  fill
                  className={`
                    object-cover transition-all
                    ${isSelected ? "opacity-75" : "group-hover:opacity-90"}
                  `}
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />

                {/* Video Overlay (for VIDEO and CAROUSEL) */}
                {(post.media_type === "VIDEO" || post.media_type === "CAROUSEL_ALBUM") && !isSelected && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                    <div className="w-14 h-14 bg-white/95 rounded-full flex items-center justify-center shadow-lg">
                      <Play className="w-7 h-7 text-gray-900 ml-0.5" fill="currentColor" />
                    </div>
                  </div>
                )}

                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute inset-0 bg-purple-600/20 flex items-center justify-center">
                    <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-white" />
                    </div>
                  </div>
                )}

                {/* Media Type Badge */}
                <div className="absolute top-2 left-2">
                  {getMediaTypeBadge(post.media_type)}
                </div>

                {/* Selection Count (if selected) */}
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {Array.from(selectedPosts).indexOf(post.id) + 1}
                    </div>
                  </div>
                )}
              </div>

              {/* Post Caption */}
              {post.caption && (
                <div className="p-3 border-t">
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {post.caption}
                  </p>
                </div>
              )}

              {/* Timestamp */}
              {post.timestamp && (
                <div className="px-3 pb-3">
                  <p className="text-xs text-muted-foreground">
                    {new Date(post.timestamp).toLocaleDateString()}
                  </p>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Selection Summary */}
      {selectedPosts.size > 0 && (
        <div className="bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-purple-600" />
              <div>
                <p className="font-semibold text-purple-900 dark:text-purple-100">
                  {selectedPosts.size} post{selectedPosts.size !== 1 ? 's' : ''} selected
                </p>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Comments with your keywords on these posts will trigger this automation
                </p>
              </div>
            </div>
            <Button
              onClick={handleSavePosts}
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {saving ? "Saving..." : "Save Selection"}
            </Button>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          <strong>💡 Tip:</strong> Select posts where you want to capture leads. When someone comments with your keyword on these posts, they'll automatically receive a DM.
        </p>
      </div>
    </div>
  );
}


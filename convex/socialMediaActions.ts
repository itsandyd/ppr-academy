"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { decryptToken, isEncrypted } from "./lib/encryption";

// ============================================================================
// SOCIAL MEDIA PUBLISHING ACTIONS
// ============================================================================

/**
 * Publish a post to Instagram
 */
async function publishToInstagram(post: any, account: any): Promise<{ success: boolean; postId?: string; postUrl?: string; error?: string }> {
  try {
    const { content, mediaUrls, platformOptions, postType } = post;
    const rawToken = account.accessToken;
    const accessToken = isEncrypted(rawToken) ? decryptToken(rawToken) : rawToken;
    const { platformData } = account;

    if (!platformData?.instagramBusinessAccountId) {
      throw new Error("Instagram Business Account ID not found");
    }

    // Instagram requires media for all post types
    if (!mediaUrls || mediaUrls.length === 0) {
      throw new Error("Instagram posts require at least one image or video");
    }

    // Step 1: Upload media
    const mediaUrl = mediaUrls[0];
    // Detect media type from URL or content
    const isVideo = mediaUrl.toLowerCase().includes('mp4') || 
                    mediaUrl.toLowerCase().includes('mov') || 
                    mediaUrl.toLowerCase().includes('video');

    const uploadEndpoint = `https://graph.facebook.com/v18.0/${platformData.instagramBusinessAccountId}/media`;
    const uploadParams = new URLSearchParams({
      access_token: accessToken,
    });

    // Add media URL based on type
    if (isVideo) {
      uploadParams.append('video_url', mediaUrl);
      uploadParams.append('media_type', postType === 'reel' ? 'REELS' : 'VIDEO');
    } else {
      uploadParams.append('image_url', mediaUrl);
      // Stories use a different media type
      if (postType === 'story') {
        uploadParams.append('media_type', 'STORIES');
      }
    }

    // Add caption only for posts and reels (stories don't support captions)
    if (content && postType !== 'story') {
      uploadParams.append('caption', content);
    }

    // Add optional location
    if (platformOptions?.instagramLocation) {
      uploadParams.append('location_id', platformOptions.instagramLocation);
    }

    // Upload media to Instagram
    const uploadResponse = await fetch(`${uploadEndpoint}?${uploadParams}`, {
      method: 'POST',
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json();
      console.error('❌ Instagram media upload failed:', error);
      throw new Error(`Failed to upload media: ${JSON.stringify(error)}`);
    }

    const uploadData = await uploadResponse.json();
    const mediaContainerId = (uploadData as any)?.id;

    // Wait for media processing
    if (isVideo) {
      // For videos and reels, wait for processing with status checks
      let processingComplete = false;
      let attempts = 0;
      const maxAttempts = 30; // 5 minutes max

      while (!processingComplete && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds

        const statusResponse = await fetch(
          `https://graph.facebook.com/v18.0/${mediaContainerId}?fields=status_code&access_token=${accessToken}`
        );
        const statusData = await statusResponse.json();

        if ((statusData as any)?.status_code === 'FINISHED') {
          processingComplete = true;
        } else if ((statusData as any)?.status_code === 'ERROR') {
          throw new Error('Video processing failed');
        }

        attempts++;
      }

      if (!processingComplete) {
        throw new Error('Video processing timeout');
      }
    } else {
      // For images and stories, wait a few seconds for Instagram to process
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Step 2: Publish the post (with retry logic)
    const publishEndpoint = `https://graph.facebook.com/v18.0/${platformData.instagramBusinessAccountId}/media_publish`;
    const publishParams = new URLSearchParams({
      access_token: accessToken,
      creation_id: mediaContainerId,
    });

    let publishAttempts = 0;
    const maxPublishAttempts = 5;
    let lastError: any = null;
    
    // Retry publishing if media is not ready yet
    while (publishAttempts < maxPublishAttempts) {
      const publishResponse = await fetch(`${publishEndpoint}?${publishParams}`, {
        method: 'POST',
      });

      if (publishResponse.ok) {
        // Success! Parse and return
        const publishData = await publishResponse.json();
        const postId = (publishData as any)?.id;

        return {
          success: true,
          postId,
          postUrl: `https://www.instagram.com/p/${postId}/`,
        };
      }

      const error = await publishResponse.json();
      lastError = error;
      
      // Check if it's a "media not ready" error (code 9007)
      if ((error as any)?.error?.code === 9007 && publishAttempts < maxPublishAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        publishAttempts++;
        continue;
      }
      
      // Other errors - throw immediately
      console.error('❌ Instagram publish failed:', error);
      throw new Error(`Failed to publish: ${JSON.stringify(error)}`);
    }
    
    // Max attempts reached
    console.error('❌ Instagram publish failed after retries:', lastError);
    throw new Error(`Failed to publish after ${maxPublishAttempts} attempts: ${JSON.stringify(lastError)}`);
  } catch (error: any) {
    console.error('❌ Instagram publish error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Publish a post to Twitter/X
 */
async function publishToTwitter(post: any, account: any): Promise<{ success: boolean; postId?: string; postUrl?: string; error?: string }> {
  try {
    const { content, mediaUrls, platformOptions } = post;
    const rawToken = account.accessToken;
    const accessToken = isEncrypted(rawToken) ? decryptToken(rawToken) : rawToken;

    // Upload media if present
    let mediaIds: string[] = [];
    
    if (mediaUrls && mediaUrls.length > 0) {
      // Note: Twitter media upload requires OAuth 1.0a, which is complex
      // For production, use a library like twitter-api-v2
      // This is a simplified example
    }

    // Create tweet
    const tweetData: any = {
      text: content,
    };

    if (mediaIds.length > 0) {
      tweetData.media = { media_ids: mediaIds };
    }

    if (platformOptions?.twitterReplySettings) {
      tweetData.reply_settings = platformOptions.twitterReplySettings;
    }

    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tweetData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to post tweet: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    const tweetId = (data as any)?.data?.id;
    const username = account.platformUsername || 'unknown';

    return {
      success: true,
      postId: tweetId,
      postUrl: `https://twitter.com/${username}/status/${tweetId}`,
    };
  } catch (error: any) {
    console.error('Twitter publish error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Publish a post to Facebook
 */
async function publishToFacebook(post: any, account: any): Promise<{ success: boolean; postId?: string; postUrl?: string; error?: string }> {
  try {
    const { content, mediaUrls } = post;
    const { platformData } = account;

    if (!platformData?.facebookPageId || !platformData?.facebookPageAccessToken) {
      throw new Error("Facebook Page credentials not found");
    }

    const pageId = platformData.facebookPageId;
    const rawPageToken = platformData.facebookPageAccessToken;
    const pageToken = isEncrypted(rawPageToken) ? decryptToken(rawPageToken) : rawPageToken;

    // Determine post type
    let endpoint: string;
    let params: any = {
      access_token: pageToken,
      message: content,
    };

    if (mediaUrls && mediaUrls.length > 0) {
      // Photo post
      endpoint = `https://graph.facebook.com/v18.0/${pageId}/photos`;
      params.url = mediaUrls[0];
    } else {
      // Text post
      endpoint = `https://graph.facebook.com/v18.0/${pageId}/feed`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to post to Facebook: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    const postId = (data as any)?.id || (data as any)?.post_id;

    return {
      success: true,
      postId,
      postUrl: `https://www.facebook.com/${postId}`,
    };
  } catch (error: any) {
    console.error('Facebook publish error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Publish a post to TikTok
 */
async function publishToTikTok(post: any, account: any): Promise<{ success: boolean; postId?: string; postUrl?: string; error?: string }> {
  try {
    const { content, mediaUrls } = post;
    const rawToken = account.accessToken;
    const accessToken = isEncrypted(rawToken) ? decryptToken(rawToken) : rawToken;

    if (!mediaUrls || mediaUrls.length === 0) {
      throw new Error("TikTok requires video content");
    }

    // TikTok requires a multi-step process:
    // 1. Initialize upload
    // 2. Upload video chunks
    // 3. Publish video

    // Step 1: Initialize upload
    const initResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        post_info: {
          title: content,
          privacy_level: 'SELF_ONLY', // or PUBLIC_TO_EVERYONE
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
          video_cover_timestamp_ms: 1000,
        },
        source_info: {
          source: 'FILE_UPLOAD',
          video_size: 0, // Would need actual file size
          chunk_size: 10000000,
          total_chunk_count: 1,
        },
      }),
    });

    if (!initResponse.ok) {
      const error = await initResponse.json();
      throw new Error(`Failed to initialize TikTok upload: ${JSON.stringify(error)}`);
    }

    const initData = await initResponse.json();
    
    // Note: Full implementation would require video upload
    // This is a placeholder showing the structure

    return {
      success: false,
      error: 'TikTok upload not fully implemented - requires video file handling',
    };
  } catch (error: any) {
    console.error('TikTok publish error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Publish a post to LinkedIn
 */
async function publishToLinkedIn(post: any, account: any): Promise<{ success: boolean; postId?: string; postUrl?: string; error?: string }> {
  try {
    const { content, mediaUrls, platformOptions } = post;
    const rawToken = account.accessToken;
    const accessToken = isEncrypted(rawToken) ? decryptToken(rawToken) : rawToken;
    const { platformUserId } = account;

    const postData: any = {
      author: `urn:li:person:${platformUserId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content,
          },
          shareMediaCategory: mediaUrls && mediaUrls.length > 0 ? 'IMAGE' : 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': platformOptions?.linkedinVisibility || 'PUBLIC',
      },
    };

    if (mediaUrls && mediaUrls.length > 0) {
      // Note: LinkedIn media upload is complex and requires separate API calls
      // This is simplified
      postData.specificContent['com.linkedin.ugc.ShareContent'].media = mediaUrls.map((url: string) => ({
        status: 'READY',
        originalUrl: url,
      }));
    }

    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to post to LinkedIn: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    const postId = (data as any)?.id;

    return {
      success: true,
      postId,
      postUrl: `https://www.linkedin.com/feed/update/${postId}/`,
    };
  } catch (error: any) {
    console.error('LinkedIn publish error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Cron-triggered action: finds all due scheduled posts and publishes them.
 * Uses "publishing" status as a lock to prevent duplicate publishes.
 */
export const publishScheduledPosts = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // 1. Fetch posts that are due
    const duePosts: any[] = await ctx.runQuery(internal.socialMedia.getPostsToPublish);

    if (duePosts.length === 0) {
      return null;
    }

    console.log(`[scheduler] Found ${duePosts.length} post(s) due for publishing`);

    // 2. Process each post independently — one failure must not block others
    for (const post of duePosts) {
      try {
        // Mark as "publishing" (optimistic lock)
        await ctx.runMutation(internal.socialMedia.updatePostStatus, {
          postId: post._id,
          status: "publishing",
        });

        // 3. Look up the connected social account
        const account: any = await ctx.runQuery(
          internal.socialMedia.getSocialAccountById,
          { accountId: post.socialAccountId }
        );

        if (!account) {
          await ctx.runMutation(internal.socialMedia.updatePostStatus, {
            postId: post._id,
            status: "failed",
            errorMessage: "Social account not found — it may have been disconnected.",
          });
          continue;
        }

        if (!account.isActive || !account.isConnected) {
          await ctx.runMutation(internal.socialMedia.updatePostStatus, {
            postId: post._id,
            status: "failed",
            errorMessage: `Reconnect your ${account.platform} account — it is currently disconnected.`,
          });
          continue;
        }

        // 4. Resolve media URLs from storage IDs if present
        let mediaUrls = post.mediaUrls || [];
        if ((!mediaUrls || mediaUrls.length === 0) && post.mediaStorageIds && post.mediaStorageIds.length > 0) {
          const resolvedUrls: (string | null)[] = await ctx.runQuery(
            internal.socialMedia.getMediaUrlsInternal,
            { storageIds: post.mediaStorageIds }
          );
          mediaUrls = resolvedUrls.filter((u): u is string => u !== null);
        }

        // Build the post payload that platform functions expect
        const postPayload = {
          content: post.content,
          mediaUrls,
          postType: post.postType,
          platformOptions: post.platformOptions || {},
        };

        // 5. Dispatch to platform-specific publisher
        let result: { success: boolean; postId?: string; postUrl?: string; error?: string };

        switch (account.platform) {
          case "instagram":
            result = await publishToInstagram(postPayload, account);
            break;
          case "twitter":
            result = await publishToTwitter(postPayload, account);
            break;
          case "facebook":
            result = await publishToFacebook(postPayload, account);
            break;
          case "tiktok":
            result = await publishToTikTok(postPayload, account);
            break;
          case "linkedin":
            result = await publishToLinkedIn(postPayload, account);
            break;
          default:
            result = { success: false, error: `Unsupported platform: ${account.platform}` };
        }

        // 6. Update post status based on result
        if (result.success) {
          console.log(`[scheduler] Published post ${post._id} to ${account.platform}`);
          await ctx.runMutation(internal.socialMedia.updatePostStatus, {
            postId: post._id,
            status: "published",
            platformPostId: result.postId,
            platformPostUrl: result.postUrl,
          });
        } else {
          console.error(`[scheduler] Failed to publish post ${post._id}: ${result.error}`);
          await ctx.runMutation(internal.socialMedia.updatePostStatus, {
            postId: post._id,
            status: "failed",
            errorMessage: result.error || "Unknown publishing error",
          });
        }
      } catch (error: any) {
        // Catch-all so one post doesn't crash the batch
        console.error(`[scheduler] Unexpected error publishing post ${post._id}:`, error);
        try {
          await ctx.runMutation(internal.socialMedia.updatePostStatus, {
            postId: post._id,
            status: "failed",
            errorMessage: error.message || "Unexpected error during publishing",
          });
        } catch {
          // If even the status update fails, log and move on
          console.error(`[scheduler] Could not update status for post ${post._id}`);
        }
      }
    }

    return null;
  },
});

/**
 * Refresh OAuth token for a social account
 */
export const refreshOAuthToken = internalAction({
  args: {
    accountId: v.id("socialAccounts"),
    platform: v.union(
      v.literal("instagram"),
      v.literal("twitter"),
      v.literal("facebook"),
      v.literal("tiktok"),
      v.literal("linkedin")
    ),
    refreshToken: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      // Decrypt refresh token if encrypted at rest
      const refreshToken = isEncrypted(args.refreshToken)
        ? decryptToken(args.refreshToken)
        : args.refreshToken;

      let tokenData: any;

      switch (args.platform) {
        case "instagram":
        case "facebook":
          // Facebook/Instagram use the same OAuth flow
          const fbResponse = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              grant_type: 'fb_exchange_token',
              client_id: process.env.FACEBOOK_APP_ID,
              client_secret: process.env.FACEBOOK_APP_SECRET,
              fb_exchange_token: refreshToken,
            }),
          });

          if (!fbResponse.ok) {
            throw new Error('Failed to refresh Facebook token');
          }

          tokenData = await fbResponse.json();
          break;

        case "twitter":
          const twitterResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': `Basic ${Buffer.from(`${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`).toString('base64')}`,
            },
            body: new URLSearchParams({
              grant_type: 'refresh_token',
              refresh_token: refreshToken,
            }),
          });

          if (!twitterResponse.ok) {
            throw new Error('Failed to refresh Twitter token');
          }

          tokenData = await twitterResponse.json();
          break;

        case "linkedin":
          const linkedinResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              grant_type: 'refresh_token',
              refresh_token: refreshToken,
              client_id: process.env.LINKEDIN_CLIENT_ID!,
              client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
            }),
          });

          if (!linkedinResponse.ok) {
            throw new Error('Failed to refresh LinkedIn token');
          }

          tokenData = await linkedinResponse.json();
          break;

        case "tiktok":
          const tiktokResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              grant_type: 'refresh_token',
              refresh_token: refreshToken,
              client_key: process.env.TIKTOK_CLIENT_KEY!,
              client_secret: process.env.TIKTOK_CLIENT_SECRET!,
            }),
          });

          if (!tiktokResponse.ok) {
            throw new Error('Failed to refresh TikTok token');
          }

          tokenData = await tiktokResponse.json();
          break;
      }

    } catch (error: any) {
      console.error(`Failed to refresh token for account ${args.accountId}:`, error);
    }

    return null;
  },
});

"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// ============================================================================
// SOCIAL MEDIA PUBLISHING ACTIONS
// ============================================================================

/**
 * Publish a post to Instagram
 */
async function publishToInstagram(post: any, account: any): Promise<{ success: boolean; postId?: string; postUrl?: string; error?: string }> {
  try {
    const { content, mediaUrls, platformOptions } = post;
    const { accessToken, platformData } = account;

    if (!platformData?.instagramBusinessAccountId) {
      throw new Error("Instagram Business Account ID not found");
    }

    // Step 1: Upload media (if any)
    let mediaContainerId: string | undefined;
    
    if (mediaUrls && mediaUrls.length > 0) {
      // For single image/video
      const mediaUrl = mediaUrls[0];
      const isVideo = mediaUrl.includes('.mp4') || mediaUrl.includes('.mov');

      const uploadEndpoint = `https://graph.facebook.com/v18.0/${platformData.instagramBusinessAccountId}/media`;
      const uploadParams = new URLSearchParams({
        access_token: accessToken,
        caption: content,
        [isVideo ? 'video_url' : 'image_url']: mediaUrl,
      });

      if (platformOptions?.instagramLocation) {
        uploadParams.append('location_id', platformOptions.instagramLocation);
      }

      const uploadResponse = await fetch(`${uploadEndpoint}?${uploadParams}`, {
        method: 'POST',
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(`Failed to upload media: ${JSON.stringify(error)}`);
      }

      const uploadData = await uploadResponse.json();
      mediaContainerId = uploadData.id;

      // For videos, wait for processing
      if (isVideo) {
        let processingComplete = false;
        let attempts = 0;
        const maxAttempts = 30; // 5 minutes max

        while (!processingComplete && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds

          const statusResponse = await fetch(
            `https://graph.facebook.com/v18.0/${mediaContainerId}?fields=status_code&access_token=${accessToken}`
          );
          const statusData = await statusResponse.json();

          if (statusData.status_code === 'FINISHED') {
            processingComplete = true;
          } else if (statusData.status_code === 'ERROR') {
            throw new Error('Video processing failed');
          }

          attempts++;
        }

        if (!processingComplete) {
          throw new Error('Video processing timeout');
        }
      }
    }

    // Step 2: Publish the post
    const publishEndpoint = `https://graph.facebook.com/v18.0/${platformData.instagramBusinessAccountId}/media_publish`;
    const publishParams = new URLSearchParams({
      access_token: accessToken,
      creation_id: mediaContainerId!,
    });

    const publishResponse = await fetch(`${publishEndpoint}?${publishParams}`, {
      method: 'POST',
    });

    if (!publishResponse.ok) {
      const error = await publishResponse.json();
      throw new Error(`Failed to publish: ${JSON.stringify(error)}`);
    }

    const publishData = await publishResponse.json();
    const postId = publishData.id;

    return {
      success: true,
      postId,
      postUrl: `https://www.instagram.com/p/${postId}/`,
    };
  } catch (error: any) {
    console.error('Instagram publish error:', error);
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
    const { accessToken } = account;

    // Upload media if present
    let mediaIds: string[] = [];
    
    if (mediaUrls && mediaUrls.length > 0) {
      // Note: Twitter media upload requires OAuth 1.0a, which is complex
      // For production, use a library like twitter-api-v2
      // This is a simplified example
      console.log('Media upload not implemented in this example');
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
    const tweetId = data.data.id;
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
    const pageToken = platformData.facebookPageAccessToken;

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
    const postId = data.id || data.post_id;

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
    const { accessToken } = account;

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
    const { accessToken, platformUserId } = account;

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
    const postId = data.id;

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
 * Main action to publish a scheduled post
 */
export const publishScheduledPost = internalAction({
  args: {
    postId: v.id("scheduledPosts"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get the post and account data
    const posts = await ctx.runQuery(internal.socialMedia.getPostsToPublish);
    const post = posts.find((p: any) => p._id === args.postId);

    if (!post) {
      console.error(`Post ${args.postId} not found or not ready to publish`);
      return null;
    }

    const account = post.account;

    if (!account) {
      await ctx.runMutation(internal.socialMedia.updatePostStatus, {
        postId: args.postId,
        status: "failed",
        errorMessage: "Social account not found",
      });
      return null;
    }

    // Update status to publishing
    await ctx.runMutation(internal.socialMedia.updatePostStatus, {
      postId: args.postId,
      status: "publishing",
    });

    // Publish based on platform
    let result: { success: boolean; postId?: string; postUrl?: string; error?: string };

    switch (account.platform) {
      case "instagram":
        result = await publishToInstagram(post, account);
        break;
      case "twitter":
        result = await publishToTwitter(post, account);
        break;
      case "facebook":
        result = await publishToFacebook(post, account);
        break;
      case "tiktok":
        result = await publishToTikTok(post, account);
        break;
      case "linkedin":
        result = await publishToLinkedIn(post, account);
        break;
      default:
        result = {
          success: false,
          error: `Unsupported platform: ${account.platform}`,
        };
    }

    // Update post status based on result
    if (result.success) {
      await ctx.runMutation(internal.socialMedia.updatePostStatus, {
        postId: args.postId,
        status: "published",
        platformPostId: result.postId,
        platformPostUrl: result.postUrl,
      });
    } else {
      await ctx.runMutation(internal.socialMedia.updatePostStatus, {
        postId: args.postId,
        status: "failed",
        errorMessage: result.error,
      });
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
              fb_exchange_token: args.refreshToken,
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
              refresh_token: args.refreshToken,
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
              refresh_token: args.refreshToken,
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
              refresh_token: args.refreshToken,
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

      // Update the account with new tokens
      await ctx.runMutation(internal.socialMedia.refreshAccountToken, {
        accountId: args.accountId,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiresAt: tokenData.expires_in ? Date.now() + (tokenData.expires_in * 1000) : undefined,
      });
    } catch (error: any) {
      console.error(`Failed to refresh token for account ${args.accountId}:`, error);
    }

    return null;
  },
});

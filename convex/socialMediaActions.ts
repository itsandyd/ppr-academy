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
    const { content, mediaUrls, platformOptions, postType } = post;
    const { accessToken, platformData } = account;

    console.log('📸 Publishing to Instagram:', {
      postType,
      hasMedia: mediaUrls?.length > 0,
      mediaCount: mediaUrls?.length || 0,
      accountId: platformData?.instagramBusinessAccountId,
    });

    if (!platformData?.instagramBusinessAccountId) {
      throw new Error("Instagram Business Account ID not found");
    }

    // Instagram requires media for all post types
    if (!mediaUrls || mediaUrls.length === 0) {
      throw new Error("Instagram posts require at least one image or video");
    }

    // Step 1: Upload media
    const mediaUrl = mediaUrls[0];
    console.log('📤 Uploading media:', mediaUrl);
    
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
    console.log('✅ Media container created:', mediaContainerId);

    // Wait for media processing
    if (isVideo) {
      // For videos and reels, wait for processing with status checks
      console.log('⏳ Waiting for video processing...');
      let processingComplete = false;
      let attempts = 0;
      const maxAttempts = 30; // 5 minutes max

      while (!processingComplete && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds

        const statusResponse = await fetch(
          `https://graph.facebook.com/v18.0/${mediaContainerId}?fields=status_code&access_token=${accessToken}`
        );
        const statusData = await statusResponse.json();

        console.log(`⏳ Video status check ${attempts + 1}/${maxAttempts}:`, (statusData as any)?.status_code);

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
      
      console.log('✅ Video processing complete');
    } else {
      // For images and stories, wait a few seconds for Instagram to process
      console.log('⏳ Waiting 5 seconds for image processing...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      console.log('✅ Image processing wait complete');
    }

    // Step 2: Publish the post (with retry logic)
    console.log('📢 Publishing post with container ID:', mediaContainerId);
    
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
        
        console.log('✅ Instagram post published successfully:', postId);

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
        console.log(`⏳ Media not ready yet, waiting 3 seconds... (attempt ${publishAttempts + 1}/${maxPublishAttempts})`);
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

# Social Media Scheduler Setup Guide

## Overview

A complete social media scheduling system similar to Hootsuite or Later, allowing stores to schedule posts across multiple platforms (Instagram, Twitter/X, Facebook, TikTok, LinkedIn).

## Features

✅ **Multi-Platform Support**
- Instagram (Business accounts)
- Twitter/X
- Facebook Pages
- TikTok
- LinkedIn

✅ **Post Scheduling**
- Schedule posts for future publishing
- Draft, edit, and cancel scheduled posts
- Automatic publishing via cron jobs
- Retry logic for failed posts

✅ **OAuth Integration**
- Secure OAuth 2.0 authentication
- Token refresh automation
- Multiple account connections per store

✅ **Analytics Tracking**
- Post performance metrics
- Engagement tracking
- Platform-specific analytics

✅ **Post Templates**
- Reusable content templates
- Multi-platform targeting
- Category organization

## Architecture

### Database Schema (Convex)

```typescript
// Social Accounts - Connected platforms
socialAccounts {
  storeId, userId, platform, platformUserId,
  accessToken, refreshToken, tokenExpiresAt,
  isActive, isConnected, platformData
}

// Scheduled Posts
scheduledPosts {
  storeId, userId, socialAccountId,
  content, mediaUrls, scheduledFor, timezone,
  postType, status, platformPostId, platformPostUrl
}

// Post Analytics
postAnalytics {
  scheduledPostId, socialAccountId, platform,
  likes, comments, shares, views, impressions,
  engagementRate, timestamp
}

// Post Templates
postTemplates {
  storeId, userId, name, content,
  platforms, category, useCount
}
```

### API Routes

1. **OAuth Callbacks**: `/api/social/oauth/[platform]/callback`
   - Handles OAuth redirects
   - Exchanges codes for tokens
   - Stores account connections

2. **Webhooks**: `/api/social/webhooks/[platform]`
   - Receives platform events
   - Verifies signatures
   - Updates post status and analytics

### Cron Jobs

1. **Process Scheduled Posts** (every 5 minutes)
   - Finds posts ready to publish
   - Publishes to respective platforms
   - Updates post status

2. **Refresh Expiring Tokens** (every hour)
   - Checks for expiring tokens
   - Refreshes tokens proactively
   - Prevents connection failures

## Setup Instructions

### 1. Environment Variables

Add these to your `.env.local`:

```bash
# Facebook/Instagram
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret

# Twitter/X
TWITTER_CLIENT_ID=your_client_id
TWITTER_CLIENT_SECRET=your_client_secret
TWITTER_WEBHOOK_SECRET=your_webhook_secret

# LinkedIn
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
LINKEDIN_WEBHOOK_SECRET=your_webhook_secret

# TikTok
TIKTOK_CLIENT_KEY=your_client_key
TIKTOK_CLIENT_SECRET=your_client_secret

# Webhook Verification
WEBHOOK_VERIFY_TOKEN=your_random_token
```

### 2. Platform App Setup

#### Instagram/Facebook

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add **Instagram Basic Display** and **Instagram Content Publishing** products
4. Configure OAuth redirect URI: `https://yourdomain.com/api/social/oauth/facebook/callback`
5. Add required permissions:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_read_engagement`
   - `pages_manage_posts`
6. Get your App ID and App Secret

#### Twitter/X

1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new app
3. Enable OAuth 2.0
4. Configure callback URL: `https://yourdomain.com/api/social/oauth/twitter/callback`
5. Add scopes:
   - `tweet.read`
   - `tweet.write`
   - `users.read`
   - `offline.access`
6. Get your Client ID and Client Secret

#### LinkedIn

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create a new app
3. Add **Sign In with LinkedIn** product
4. Configure redirect URL: `https://yourdomain.com/api/social/oauth/linkedin/callback`
5. Add scopes:
   - `r_liteprofile`
   - `r_emailaddress`
   - `w_member_social`
6. Get your Client ID and Client Secret

#### TikTok

1. Go to [TikTok for Developers](https://developers.tiktok.com/)
2. Create a new app
3. Add **Login Kit** and **Content Posting API**
4. Configure redirect URI: `https://yourdomain.com/api/social/oauth/tiktok/callback`
5. Add scopes:
   - `user.info.basic`
   - `video.upload`
   - `video.publish`
6. Get your Client Key and Client Secret

### 3. Webhook Configuration

#### Facebook/Instagram

1. In your Facebook app, go to **Webhooks**
2. Add callback URL: `https://yourdomain.com/api/social/webhooks/facebook`
3. Add verify token (matches `WEBHOOK_VERIFY_TOKEN`)
4. Subscribe to:
   - `feed`
   - `comments`
   - `messaging`
   - `instagram` (if using Instagram)

#### Twitter/X

1. In Twitter Developer Portal, go to **Webhooks**
2. Add webhook URL: `https://yourdomain.com/api/social/webhooks/twitter`
3. Configure CRC validation
4. Subscribe to events:
   - Tweet create
   - Tweet delete
   - Favorite
   - Follow

#### LinkedIn

1. In LinkedIn app settings, go to **Webhooks**
2. Add webhook URL: `https://yourdomain.com/api/social/webhooks/linkedin`
3. Subscribe to:
   - Share statistics updates
   - Comment notifications

#### TikTok

1. In TikTok app settings, enable **Webhooks**
2. Add webhook URL: `https://yourdomain.com/api/social/webhooks/tiktok`
3. Subscribe to:
   - `video.publish.completed`
   - `video.upload.failed`

### 4. Deploy Convex Functions

```bash
npx convex deploy
```

This will deploy:
- `convex/socialMedia.ts` - Core functions
- `convex/socialMediaActions.ts` - Publishing actions
- `convex/crons.ts` - Scheduled jobs

### 5. Test OAuth Flow

1. Navigate to your store dashboard
2. Click "Connect Social Account"
3. Select a platform
4. Complete OAuth authorization
5. Verify connection appears in dashboard

### 6. Test Scheduling

1. Create a test post
2. Schedule it for 5-10 minutes in the future
3. Wait for cron job to process
4. Verify post appears on platform
5. Check analytics tracking

## Usage

### Connecting a Social Account

```typescript
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

// Initiate OAuth flow
const connectAccount = (platform: string, storeId: string) => {
  const redirectUri = `${window.location.origin}/api/social/oauth/${platform}/callback`;
  const state = storeId; // Pass storeId in state
  
  // Platform-specific OAuth URLs
  const authUrls = {
    instagram: `https://www.facebook.com/v18.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${redirectUri}&state=${state}&scope=instagram_basic,instagram_content_publish`,
    twitter: `https://twitter.com/i/oauth2/authorize?client_id=${TWITTER_CLIENT_ID}&redirect_uri=${redirectUri}&state=${state}&scope=tweet.read tweet.write users.read offline.access&response_type=code&code_challenge=challenge&code_challenge_method=plain`,
    // ... other platforms
  };
  
  window.location.href = authUrls[platform];
};
```

### Creating a Scheduled Post

```typescript
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const createPost = useMutation(api.socialMedia.createScheduledPost);

await createPost({
  storeId: "store_123",
  userId: "user_456",
  socialAccountId: accountId,
  content: "Check out our new product! 🚀",
  mediaUrls: ["https://example.com/image.jpg"],
  scheduledFor: Date.now() + (24 * 60 * 60 * 1000), // 24 hours from now
  timezone: "America/New_York",
  postType: "post",
});
```

### Fetching Scheduled Posts

```typescript
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const posts = useQuery(api.socialMedia.getScheduledPosts, {
  storeId: "store_123",
  status: "scheduled",
  limit: 50,
});
```

## API Reference

### Mutations

- `connectSocialAccount` - Connect a new social account
- `disconnectSocialAccount` - Disconnect an account
- `createScheduledPost` - Create a new scheduled post
- `updateScheduledPost` - Update a scheduled post
- `deleteScheduledPost` - Delete a scheduled post
- `cancelScheduledPost` - Cancel a scheduled post
- `createPostTemplate` - Create a reusable template

### Queries

- `getSocialAccounts` - Get all connected accounts for a store
- `getScheduledPosts` - Get scheduled posts with filters
- `getPostTemplates` - Get post templates for a store

### Internal Actions

- `publishScheduledPost` - Publish a post to a platform
- `refreshOAuthToken` - Refresh an expiring token

## Rate Limits

### Instagram
- 100 API-published posts per 24 hours
- 200 calls per hour per user

### Twitter/X
- 100 tweets per 15 minutes (Pro tier)
- 10,000 requests per 24 hours per app

### Facebook
- 4,800 × engaged users calls per 24 hours
- 200 × daily users per hour

### TikTok
- 6 video publish requests per minute per user
- Daily caps enforced by platform

### LinkedIn
- 500 calls per 24 hours per app

## Error Handling

The system includes comprehensive error handling:

1. **OAuth Errors**: Redirects to store with error message
2. **Publishing Errors**: Updates post status to "failed" with error message
3. **Retry Logic**: Automatically retries failed posts up to 3 times
4. **Token Refresh**: Proactively refreshes expiring tokens
5. **Webhook Validation**: Verifies all webhook signatures

## Security Best Practices

1. **Token Storage**: Tokens stored in Convex (encrypted at rest)
2. **Signature Verification**: All webhooks verified before processing
3. **OAuth State**: State parameter prevents CSRF attacks
4. **HTTPS Only**: All OAuth redirects require HTTPS
5. **Scope Minimization**: Request only necessary permissions

## Monitoring

Monitor the system health:

1. **Cron Job Logs**: Check Convex dashboard for cron execution
2. **Failed Posts**: Query posts with status "failed"
3. **Webhook Events**: Track webhook processing status
4. **Token Expiry**: Monitor accounts with expiring tokens

## Troubleshooting

### Posts Not Publishing

1. Check cron job is running (Convex dashboard)
2. Verify account is still connected
3. Check token hasn't expired
4. Review error message in post record
5. Verify platform rate limits not exceeded

### OAuth Connection Fails

1. Verify environment variables are set
2. Check redirect URI matches platform settings
3. Ensure required scopes are requested
4. Verify app is approved for production (if applicable)

### Webhooks Not Received

1. Verify webhook URL is accessible (HTTPS)
2. Check signature verification is passing
3. Ensure webhook subscriptions are active
4. Review platform webhook logs

## Future Enhancements

- [ ] Bulk scheduling
- [ ] Content calendar UI
- [ ] AI-powered post suggestions
- [ ] Best time to post recommendations
- [ ] Competitor analysis
- [ ] Hashtag suggestions
- [ ] Multi-account posting
- [ ] Post approval workflows
- [ ] Team collaboration features
- [ ] Advanced analytics dashboard

## Resources

- [Facebook Graph API](https://developers.facebook.com/docs/graph-api)
- [Twitter API v2](https://developer.twitter.com/en/docs/twitter-api)
- [LinkedIn Marketing API](https://learn.microsoft.com/en-us/linkedin/marketing/)
- [TikTok Content Posting API](https://developers.tiktok.com/doc/content-posting-api-get-started)
- [Convex Documentation](https://docs.convex.dev/)

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review platform API documentation
3. Check Convex logs for errors
4. Contact support with error details

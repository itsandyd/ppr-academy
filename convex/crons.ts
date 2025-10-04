import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";

/**
 * Process scheduled social media posts
 * Runs every 5 minutes to check for posts that need to be published
 */
export const processScheduledPosts = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    try {
      // Get posts that need to be published
      const posts = await ctx.runQuery(internal.socialMedia.getPostsToPublish);

      console.log(`Found ${posts.length} posts to publish`);

      // Publish each post
      for (const post of posts) {
        try {
          await ctx.runAction(internal.socialMediaActions.publishScheduledPost, {
            postId: post._id,
          });
        } catch (error: any) {
          console.error(`Failed to publish post ${post._id}:`, error);
        }
      }
    } catch (error: any) {
      console.error('Error in processScheduledPosts cron:', error);
    }

    return null;
  },
});

/**
 * Refresh expiring OAuth tokens
 * Runs every hour to check for tokens that will expire soon
 */
export const refreshExpiringTokens = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    try {
      // This would query for accounts with tokens expiring in the next 24 hours
      // and refresh them proactively
      console.log('Checking for expiring tokens...');
      
      // TODO: Implement token refresh logic
      // const expiringAccounts = await ctx.runQuery(internal.socialMedia.getAccountsWithExpiringTokens);
      // for (const account of expiringAccounts) {
      //   await ctx.runAction(internal.socialMediaActions.refreshOAuthToken, {
      //     accountId: account._id,
      //     platform: account.platform,
      //     refreshToken: account.refreshToken,
      //   });
      // }
    } catch (error: any) {
      console.error('Error in refreshExpiringTokens cron:', error);
    }

    return null;
  },
});

const crons = cronJobs();

// Run every 5 minutes to process scheduled posts
crons.interval(
  "process scheduled social media posts",
  { minutes: 5 },
  internal.crons.processScheduledPosts,
  {}
);

// Run every hour to refresh expiring tokens
crons.interval(
  "refresh expiring OAuth tokens",
  { hours: 1 },
  internal.crons.refreshExpiringTokens,
  {}
);

export default crons;

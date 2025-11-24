import { v } from "convex/values";
import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

/**
 * Helper function to refresh account token (avoids circular dependencies)
 */
export async function refreshAccountTokenHelper(
  ctx: MutationCtx,
  accountId: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Get the account
    const account = await ctx.db.get(accountId as Id<"socialAccounts">);
    
    if (!account) {
      return {
        success: false,
        message: "Account not found",
      };
    }

    // Mark account as needing refresh
    await ctx.db.patch(accountId as Id<"socialAccounts">, {
      lastVerified: Date.now(),
      connectionError: "Token needs refresh - click reconnect for updated permissions",
      isActive: false, // Force user to reconnect
    });

    return {
      success: true,
      message: `Token refresh requested for @${account.platformUsername}`,
    };
  } catch (error) {
    console.error("Token refresh error:", error);
    return {
      success: false,
      message: "Failed to refresh token",
    };
  }
}

/**
 * Helper function to update post status (avoids circular dependencies)
 */
export async function updatePostStatusHelper(
  ctx: MutationCtx,
  args: {
    postId: string;
    status: string;
    errorMessage?: string;
    platformPostId?: string;
    platformPostUrl?: string;
  }
): Promise<void> {
  // For now, just log the status update
  console.log("📊 Post status update:", args.postId, args.status, args.errorMessage);
  
  // TODO: Implement actual scheduledPosts table updates when needed
  // This functionality isn't critical for the Instagram automation
}

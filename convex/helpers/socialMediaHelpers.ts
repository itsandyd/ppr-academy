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
  const post = await ctx.db.get(args.postId as Id<"scheduledPosts">);
  if (!post) {
    console.log("📊 Post not found:", args.postId);
    return;
  }

  await ctx.db.patch(args.postId as Id<"scheduledPosts">, {
    status: args.status as "draft" | "scheduled" | "publishing" | "published" | "failed" | "cancelled",
    ...(args.errorMessage && { errorMessage: args.errorMessage }),
    ...(args.platformPostId && { platformPostId: args.platformPostId }),
    ...(args.platformPostUrl && { platformPostUrl: args.platformPostUrl }),
    ...(args.status === "published" && { publishedAt: Date.now() }),
  });

  console.log("📊 Post status updated:", args.postId, args.status);
}

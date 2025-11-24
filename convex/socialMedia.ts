import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";

/**
 * Get Instagram access token for a user (for webhook use)
 */
export const getInstagramToken = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.union(
    v.object({
      accessToken: v.string(),
      username: v.string(),
      instagramId: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    // Get the user to find their Clerk ID
    const user = await ctx.db.get(args.userId);
    if (!user?.clerkId) {
      return null;
    }

    // Fetch current Instagram connection
    const socialAccount = await ctx.db
      .query("socialAccounts")
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), user.clerkId),
          q.eq(q.field("platform"), "instagram"),
          q.eq(q.field("isConnected"), true),
          q.eq(q.field("isActive"), true)
        )
      )
      .first();

    if (!socialAccount?.accessToken) {
      return null;
    }

    return {
      accessToken: socialAccount.accessToken,
      username: socialAccount.platformUsername || "",
      instagramId: socialAccount.platformUserId,
    };
  },
});
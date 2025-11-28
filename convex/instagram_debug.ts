import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Debug function to test specific Instagram account data
 */
export const getAccountData = query({
  args: {
    accountId: v.string(),
  },
  returns: v.union(
    v.object({
      accountId: v.string(),
      username: v.string(),
      platformUserId: v.string(),
      instagramBusinessId: v.string(),
      accessToken: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    console.log("🔍 Looking for account:", args.accountId);
    
    const account = await ctx.db.get(args.accountId as any);
    
    if (!account) {
      console.log("❌ Account not found");
      return null;
    }

    console.log("✅ Account found:", account.platformUsername);
    console.log("📱 Platform:", account.platform);
    console.log("🔗 Instagram Business ID:", account.platformData?.instagramBusinessAccountId);

    return {
      accountId: account._id,
      username: account.platformUsername || "",
      platformUserId: account.platformUserId,
      instagramBusinessId: account.platformData?.instagramBusinessAccountId || account.platformUserId,
      accessToken: account.accessToken || "",
    };
  },
});

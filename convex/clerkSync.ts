import { v } from "convex/values";
import { action, internalAction, internalMutation, internalQuery, query } from "./_generated/server";
import { internal } from "./_generated/api";

// Helper function to verify admin access
async function verifyAdmin(ctx: any, clerkId?: string) {
  if (!clerkId) {
    throw new Error("Unauthorized: Authentication required");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q: any) => q.eq("clerkId", clerkId))
    .unique();

  if (!user || user.admin !== true) {
    throw new Error("Unauthorized: Admin access required");
  }

  return user;
}

// Get sync statistics (admin only)
export const getSyncStats = query({
  args: {
    clerkId: v.optional(v.string()),
  },
  returns: v.object({
    totalInConvex: v.number(),
    lastSyncTime: v.optional(v.number()),
    syncStatus: v.string(),
  }),
  handler: async (ctx, args) => {
    // Verify admin access
    await verifyAdmin(ctx, args.clerkId);

    const users = await ctx.db.query("users").collect();

    // Get sync metadata if it exists
    const syncMeta = await ctx.db
      .query("syncMetadata")
      .filter((q) => q.eq(q.field("type"), "clerk_sync"))
      .first();

    return {
      totalInConvex: users.length,
      lastSyncTime: syncMeta?.lastSyncTime,
      syncStatus: syncMeta?.status || "never_synced",
    };
  },
});

// Quick sync using environment variable (admin only)
export const quickSyncClerkUsers: any = action({
  args: {
    clerkId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    totalClerkUsers: v.number(),
    totalConvexUsers: v.number(),
    usersAdded: v.number(),
    usersUpdated: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx, args): Promise<{
    success: boolean;
    totalClerkUsers: number;
    totalConvexUsers: number;
    usersAdded: number;
    usersUpdated: number;
    errors: string[];
  }> => {
    // Get Clerk secret key from environment
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    
    if (!clerkSecretKey) {
      throw new Error("CLERK_SECRET_KEY not found in environment variables. Please set it in your Convex dashboard.");
    }

    // Call the main sync function
    const result: {
      success: boolean;
      totalClerkUsers: number;
      totalConvexUsers: number;
      usersAdded: number;
      usersUpdated: number;
      errors: string[];
    } = await ctx.runAction(internal.clerkSync.syncClerkUsersInternal, {
      clerkId: args.clerkId,
      clerkSecretKey,
    });
    return result;
  },
});

// Internal sync function (called by both quick sync and manual sync)
export const syncClerkUsersInternal = internalAction({
  args: {
    clerkId: v.string(),
    clerkSecretKey: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    totalClerkUsers: v.number(),
    totalConvexUsers: v.number(),
    usersAdded: v.number(),
    usersUpdated: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    // Verify admin access
    const adminUser = await ctx.runQuery(internal.clerkSync.verifyAdminInternal, {
      clerkId: args.clerkId,
    });

    if (!adminUser) {
      throw new Error("Unauthorized: Admin access required");
    }

    const errors: string[] = [];
    let usersAdded = 0;
    let usersUpdated = 0;

    try {
      // Fetch all users from Clerk
      const clerkUsers = await fetchAllClerkUsers(args.clerkSecretKey);
      
      console.log(`📊 Found ${clerkUsers.length} users in Clerk`);

      // Get existing users in Convex
      const convexUsers: any[] = await ctx.runQuery(internal.clerkSync.getAllUsersInternal);
      const convexUserMap = new Map(
        convexUsers.map((u: any) => [u.clerkId, u])
      );

      console.log(`📊 Found ${convexUsers.length} users in Convex`);

      // Sync each user
      for (const clerkUser of clerkUsers) {
        try {
          const existingUser: any = convexUserMap.get(clerkUser.id);

          // Debug: Log the first user's structure to understand the API response
          if (clerkUser === clerkUsers[0]) {
            console.log("📧 Sample Clerk user structure:", JSON.stringify({
              id: clerkUser.id,
              emailAddresses: clerkUser.emailAddresses,
              email_addresses: clerkUser.email_addresses,
              firstName: clerkUser.firstName,
              first_name: clerkUser.first_name,
              lastName: clerkUser.lastName,
              last_name: clerkUser.last_name,
              imageUrl: clerkUser.imageUrl,
              image_url: clerkUser.image_url,
            }, null, 2));
          }

          const userData = {
            clerkId: clerkUser.id,
            email: clerkUser.email_addresses?.[0]?.email_address || clerkUser.emailAddresses?.[0]?.emailAddress || null,
            firstName: clerkUser.first_name || clerkUser.firstName || null,
            lastName: clerkUser.last_name || clerkUser.lastName || null,
            imageUrl: clerkUser.image_url || clerkUser.imageUrl || null,
          };

          if (existingUser) {
            // Update existing user
            await ctx.runMutation(internal.clerkSync.updateUserInternal, {
              userId: existingUser._id,
              ...userData,
            });
            usersUpdated++;
          } else {
            // Create new user
            await ctx.runMutation(internal.clerkSync.createUserInternal, userData);
            usersAdded++;
          }
        } catch (error: any) {
          console.error(`Error syncing user ${clerkUser.id}:`, error);
          errors.push(`User ${clerkUser.id}: ${error.message}`);
        }
      }

      // Update sync metadata
      await ctx.runMutation(internal.clerkSync.updateSyncMetadata, {
        totalClerkUsers: clerkUsers.length,
        totalConvexUsers: convexUsers.length + usersAdded,
        usersAdded,
        usersUpdated,
      });

      console.log(`✅ Sync complete: ${usersAdded} added, ${usersUpdated} updated`);

      return {
        success: true,
        totalClerkUsers: clerkUsers.length,
        totalConvexUsers: convexUsers.length + usersAdded,
        usersAdded,
        usersUpdated,
        errors,
      };
    } catch (error: any) {
      console.error("Sync failed:", error);
      return {
        success: false,
        totalClerkUsers: 0,
        totalConvexUsers: 0,
        usersAdded,
        usersUpdated,
        errors: [error.message],
      };
    }
  },
});

// Manual sync with provided key (admin only action)
export const syncClerkUsers: any = action({
  args: {
    clerkId: v.string(),
    clerkSecretKey: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    totalClerkUsers: v.number(),
    totalConvexUsers: v.number(),
    usersAdded: v.number(),
    usersUpdated: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx, args): Promise<{
    success: boolean;
    totalClerkUsers: number;
    totalConvexUsers: number;
    usersAdded: number;
    usersUpdated: number;
    errors: string[];
  }> => {
    // Call the internal sync function with the provided key
    const result: {
      success: boolean;
      totalClerkUsers: number;
      totalConvexUsers: number;
      usersAdded: number;
      usersUpdated: number;
      errors: string[];
    } = await ctx.runAction(internal.clerkSync.syncClerkUsersInternal, {
      clerkId: args.clerkId,
      clerkSecretKey: args.clerkSecretKey,
    });
    return result;
  },
});

// Helper function to fetch all users from Clerk API
async function fetchAllClerkUsers(secretKey: string) {
  const users: any[] = [];
  let offset = 0;
  const limit = 100;
  let hasMore = true;

  while (hasMore) {
    try {
      const response = await fetch(
        `https://api.clerk.com/v1/users?limit=${limit}&offset=${offset}`,
        {
          headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Clerk API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      users.push(...(data as any[]));

      // Check if there are more users
      if ((data as any[]).length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
    } catch (error) {
      console.error(`Error fetching users at offset ${offset}:`, error);
      throw error;
    }
  }

  return users;
}

// Internal queries and mutations (not directly accessible)

export const verifyAdminInternal = internalQuery({
  args: {
    clerkId: v.string(),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user || user.admin !== true) {
      return null;
    }

    return user;
  },
});

export const getAllUsersInternal = internalQuery({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

export const createUserInternal = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.union(v.string(), v.null()),
    firstName: v.union(v.string(), v.null()),
    lastName: v.union(v.string(), v.null()),
    imageUrl: v.union(v.string(), v.null()),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    const name =
      args.firstName && args.lastName
        ? `${args.firstName} ${args.lastName}`
        : args.firstName || args.lastName || args.email || "User";

    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email || undefined,
      firstName: args.firstName || undefined,
      lastName: args.lastName || undefined,
      imageUrl: args.imageUrl || undefined,
      name,
      role: "SUBACCOUNT_USER",
      admin: false,
    });

    // Track signup event for analytics
    await ctx.db.insert("analyticsEvents", {
      userId: args.clerkId,
      eventType: "signup",
      timestamp: Date.now(),
      metadata: {},
    });

    console.log(`✅ Created user: ${userId} (${args.email})`);
    return userId;
  },
});

export const updateUserInternal = internalMutation({
  args: {
    userId: v.id("users"),
    clerkId: v.string(),
    email: v.union(v.string(), v.null()),
    firstName: v.union(v.string(), v.null()),
    lastName: v.union(v.string(), v.null()),
    imageUrl: v.union(v.string(), v.null()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const name =
      args.firstName && args.lastName
        ? `${args.firstName} ${args.lastName}`
        : args.firstName || args.lastName || args.email || "User";

    await ctx.db.patch(args.userId, {
      email: args.email || undefined,
      firstName: args.firstName || undefined,
      lastName: args.lastName || undefined,
      imageUrl: args.imageUrl || undefined,
      name,
    });

    console.log(`✅ Updated user: ${args.userId} (${args.email})`);
    return null;
  },
});

export const updateSyncMetadata = internalMutation({
  args: {
    totalClerkUsers: v.number(),
    totalConvexUsers: v.number(),
    usersAdded: v.number(),
    usersUpdated: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Check if sync metadata exists
    const existing = await ctx.db
      .query("syncMetadata")
      .filter((q) => q.eq(q.field("type"), "clerk_sync"))
      .first();

    const metadata = {
      type: "clerk_sync" as const,
      lastSyncTime: Date.now(),
      totalClerkUsers: args.totalClerkUsers,
      totalConvexUsers: args.totalConvexUsers,
      usersAdded: args.usersAdded,
      usersUpdated: args.usersUpdated,
      status: "completed" as const,
    };

    if (existing) {
      await ctx.db.patch(existing._id, metadata);
    } else {
      await ctx.db.insert("syncMetadata", metadata);
    }

    return null;
  },
});


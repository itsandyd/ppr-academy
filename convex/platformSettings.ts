import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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

/**
 * Get platform settings
 */
export const getSettings = query({
  args: {
    clerkId: v.optional(v.string()),
    key: v.optional(v.string()),
  },
  returns: v.union(
    v.object({
      _id: v.id("platformSettings"),
      key: v.string(),
      platformName: v.optional(v.string()),
      tagline: v.optional(v.string()),
      description: v.optional(v.string()),
      supportEmail: v.optional(v.string()),
      logoUrl: v.optional(v.string()),
      faviconUrl: v.optional(v.string()),
      primaryColor: v.optional(v.string()),
      secondaryColor: v.optional(v.string()),
      maintenanceMode: v.optional(v.boolean()),
      allowRegistration: v.optional(v.boolean()),
      requireEmailVerification: v.optional(v.boolean()),
      defaultUserRole: v.optional(v.string()),
      timezone: v.optional(v.string()),
      dateFormat: v.optional(v.string()),
      currency: v.optional(v.string()),
      updatedAt: v.number(),
      updatedBy: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    // Verify admin access
    await verifyAdmin(ctx, args.clerkId);

    const key = args.key || "general";

    const settings = await ctx.db
      .query("platformSettings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();

    return settings;
  },
});

/**
 * Save platform settings
 */
export const saveSettings = mutation({
  args: {
    clerkId: v.string(),
    key: v.optional(v.string()),
    platformName: v.optional(v.string()),
    tagline: v.optional(v.string()),
    description: v.optional(v.string()),
    supportEmail: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    faviconUrl: v.optional(v.string()),
    primaryColor: v.optional(v.string()),
    secondaryColor: v.optional(v.string()),
    maintenanceMode: v.optional(v.boolean()),
    allowRegistration: v.optional(v.boolean()),
    requireEmailVerification: v.optional(v.boolean()),
    defaultUserRole: v.optional(v.string()),
    timezone: v.optional(v.string()),
    dateFormat: v.optional(v.string()),
    currency: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Verify admin access
    await verifyAdmin(ctx, args.clerkId);

    const key = args.key || "general";

    // Check if settings already exist
    const existingSettings = await ctx.db
      .query("platformSettings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();

    const settingsData = {
      key,
      platformName: args.platformName,
      tagline: args.tagline,
      description: args.description,
      supportEmail: args.supportEmail,
      logoUrl: args.logoUrl,
      faviconUrl: args.faviconUrl,
      primaryColor: args.primaryColor,
      secondaryColor: args.secondaryColor,
      maintenanceMode: args.maintenanceMode,
      allowRegistration: args.allowRegistration,
      requireEmailVerification: args.requireEmailVerification,
      defaultUserRole: args.defaultUserRole,
      timezone: args.timezone,
      dateFormat: args.dateFormat,
      currency: args.currency,
      updatedAt: Date.now(),
      updatedBy: args.clerkId,
    };

    if (existingSettings) {
      // Update existing settings
      await ctx.db.patch(existingSettings._id, settingsData);
    } else {
      // Create new settings
      await ctx.db.insert("platformSettings", settingsData);
    }

    return {
      success: true,
      message: "Settings saved successfully",
    };
  },
});

/**
 * Get public platform settings (no admin check - for frontend display)
 */
export const getPublicSettings = query({
  args: {},
  returns: v.union(
    v.object({
      platformName: v.optional(v.string()),
      tagline: v.optional(v.string()),
      description: v.optional(v.string()),
      supportEmail: v.optional(v.string()),
      logoUrl: v.optional(v.string()),
      faviconUrl: v.optional(v.string()),
      primaryColor: v.optional(v.string()),
      secondaryColor: v.optional(v.string()),
      maintenanceMode: v.optional(v.boolean()),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const settings = await ctx.db
      .query("platformSettings")
      .withIndex("by_key", (q) => q.eq("key", "general"))
      .unique();

    if (!settings) return null;

    // Only return public-facing settings
    return {
      platformName: settings.platformName,
      tagline: settings.tagline,
      description: settings.description,
      supportEmail: settings.supportEmail,
      logoUrl: settings.logoUrl,
      faviconUrl: settings.faviconUrl,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      maintenanceMode: settings.maintenanceMode,
    };
  },
});

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Reusable store validator for return types
const storeValidator = v.object({
  _id: v.id("stores"),
  _creationTime: v.number(),
  name: v.string(),
  slug: v.string(),
  description: v.optional(v.string()),
  userId: v.string(),
  avatar: v.optional(v.string()),
  logoUrl: v.optional(v.string()),
  bannerImage: v.optional(v.string()),
  customDomain: v.optional(v.string()),
  domainStatus: v.optional(v.string()),
  bio: v.optional(v.string()),
  socialLinks: v.optional(v.object({
    website: v.optional(v.string()),
    twitter: v.optional(v.string()),
    instagram: v.optional(v.string()),
    linkedin: v.optional(v.string()),
    youtube: v.optional(v.string()),
  })),
  emailConfig: v.optional(v.object({
    fromEmail: v.string(),
    fromName: v.optional(v.string()),
    replyToEmail: v.optional(v.string()),
    isConfigured: v.optional(v.boolean()),
    lastTestedAt: v.optional(v.number()),
    emailsSentThisMonth: v.optional(v.number()),
  })),
  // Creator Plan & Visibility Settings
  plan: v.optional(v.union(
    v.literal("free"),
    v.literal("creator"),
    v.literal("creator_pro"),
    v.literal("early_access")
  )),
  planStartedAt: v.optional(v.number()),
  isPublic: v.optional(v.boolean()),
  isPublishedProfile: v.optional(v.boolean()),
  stripeCustomerId: v.optional(v.string()),
  stripeSubscriptionId: v.optional(v.string()),
  subscriptionStatus: v.optional(v.union(
    v.literal("active"),
    v.literal("trialing"),
    v.literal("past_due"),
    v.literal("canceled"),
    v.literal("incomplete")
  )),
  trialEndsAt: v.optional(v.number()),
  earlyAccessExpiresAt: v.optional(v.number()), // When early access grandfathering ends
});

// Get all stores for a user
export const getStoresByUser = query({
  args: { userId: v.string() },
  returns: v.array(storeValidator),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("stores")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Alias for getUserStores (same as getStoresByUser)
export const getUserStores = query({
  args: { userId: v.string() },
  returns: v.array(storeValidator),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("stores")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Get single store for a user (returns first store or null)
export const getUserStore = query({
  args: { userId: v.string() },
  returns: v.union(storeValidator, v.null()),
  handler: async (ctx, args) => {
    const stores = await ctx.db
      .query("stores")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    
    return stores || null;
  },
});

// Get store by ID
export const getStoreById = query({
  args: { storeId: v.id("stores") },
  returns: v.union(storeValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.storeId);
  },
});

// Migration: Set all stores to public and published (for Early Access rollout)
export const migrateStoresToPublic = mutation({
  args: {},
  returns: v.object({
    updated: v.number(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const stores = await ctx.db.query("stores").collect();
    let updated = 0;

    for (const store of stores) {
      // Update stores that are not already public/published
      if (!store.isPublic || !store.isPublishedProfile) {
        await ctx.db.patch(store._id, {
          isPublic: true,
          isPublishedProfile: true,
        });
        updated++;
      }
    }

    return {
      updated,
      message: `Successfully updated ${updated} stores to public and published status.`,
    };
  },
});

// Get store by slug
export const getStoreBySlug = query({
  args: { slug: v.string() },
  returns: v.union(storeValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("stores")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

// Get all stores (for sitemap generation)
export const getAllStores = query({
  args: {},
  returns: v.array(storeValidator),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("stores")
      .collect();
  },
});

// Helper function to generate URL-friendly slug
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

// Create a new store
export const createStore = mutation({
  args: {
    name: v.string(),
    slug: v.optional(v.string()),
    userId: v.string(),
  },
  returns: v.id("stores"),
  handler: async (ctx, args) => {
    // Use provided slug or generate from name
    let slug = args.slug?.trim() || generateSlug(args.name);
    
    // Ensure slug is unique
    let counter = 1;
    let originalSlug = slug;
    
    while (true) {
      const existingStore = await ctx.db
        .query("stores")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .unique();
      
      if (!existingStore) break;
      
      slug = `${originalSlug}-${counter}`;
      counter++;
    }
    
    return await ctx.db.insert("stores", {
      name: args.name,
      slug,
      userId: args.userId,
      plan: "free", // Default to free plan - users can upgrade for more features
      planStartedAt: Date.now(),
      isPublic: true, // Public by default
      isPublishedProfile: true, // Published by default
      subscriptionStatus: "active",
    });
  },
});

// Update store
export const updateStore = mutation({
  args: {
    id: v.id("stores"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    userId: v.string(), // Add userId for authorization
  },
  returns: v.union(storeValidator, v.null()),
  handler: async (ctx, args) => {
    const { id, userId, ...updates } = args;
    
    // Get current store
    const currentStore = await ctx.db.get(id);
    if (!currentStore) {
      throw new Error("Store not found");
    }
    
    // Check if the user is the owner of this store
    if (currentStore.userId !== userId) {
      throw new Error("Unauthorized: You can only update your own stores");
    }
    
    // Handle slug logic
    if (updates.name !== undefined) {
      // If updating name and no explicit slug provided, generate from name
      if (updates.slug === undefined) {
        let slug = generateSlug(updates.name);
        
        // Ensure slug is unique (excluding current store)
        let counter = 1;
        let originalSlug = slug;
        
        while (true) {
          const existingStore = await ctx.db
            .query("stores")
            .withIndex("by_slug", (q) => q.eq("slug", slug))
            .unique();
          
          if (!existingStore || existingStore._id === id) break;
          
          slug = `${originalSlug}-${counter}`;
          counter++;
        }
        
        updates.slug = slug;
      }
    }
    
    // If explicit slug provided, ensure it's unique
    if (updates.slug !== undefined && updates.slug.trim()) {
      let slug = updates.slug.trim();
      let counter = 1;
      let originalSlug = slug;
      
      while (true) {
        const existingStore = await ctx.db
          .query("stores")
          .withIndex("by_slug", (q) => q.eq("slug", slug))
          .unique();
        
        if (!existingStore || existingStore._id === id) break;
        
        slug = `${originalSlug}-${counter}`;
        counter++;
      }
      
      updates.slug = slug;
    }
    
    await ctx.db.patch(id, updates);
    return await ctx.db.get(id);
  },
});

// Delete store
export const deleteStore = mutation({
  args: { id: v.id("stores") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
}); 

// Update store email sender configuration
export const updateEmailConfig = mutation({
  args: {
    storeId: v.id("stores"),
    fromEmail: v.string(),
    fromName: v.optional(v.string()),
    replyToEmail: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      const store = await ctx.db.get(args.storeId);
      if (!store) {
        return { success: false, message: "Store not found" };
      }

      // Update the store with email sender config
      await ctx.db.patch(args.storeId, {
        emailConfig: {
          fromEmail: args.fromEmail,
          fromName: args.fromName,
          replyToEmail: args.replyToEmail,
          isConfigured: true,
          emailsSentThisMonth: store.emailConfig?.emailsSentThisMonth || 0,
          lastTestedAt: store.emailConfig?.lastTestedAt,
        },
      });

      return { success: true, message: "Email configuration saved successfully" };
    } catch (error) {
      console.error("Failed to update email config:", error);
      return { success: false, message: "Failed to save email configuration" };
    }
  },
});

// Update store admin notification preferences
export const updateAdminNotificationSettings = mutation({
  args: {
    storeId: v.id("stores"),
    enabled: v.optional(v.boolean()),
    emailOnNewLead: v.optional(v.boolean()),
    emailOnReturningUser: v.optional(v.boolean()),
    notificationEmail: v.optional(v.string()),
    customSubjectPrefix: v.optional(v.string()),
    includeLeadDetails: v.optional(v.boolean()),
    sendDigestInsteadOfInstant: v.optional(v.boolean()),
    digestFrequency: v.optional(v.union(
      v.literal("hourly"),
      v.literal("daily"),
      v.literal("weekly")
    )),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      const store = await ctx.db.get(args.storeId);
      if (!store) {
        return { success: false, message: "Store not found" };
      }

      const { storeId, ...notificationSettings } = args;
      
      // Update the store with admin notification settings, preserving existing config
      const existingConfig = store.emailConfig;
      await ctx.db.patch(args.storeId, {
        emailConfig: {
          fromEmail: existingConfig?.fromEmail || 'noreply@ppr-academy.com',
          fromName: existingConfig?.fromName,
          replyToEmail: existingConfig?.replyToEmail,
          isConfigured: existingConfig?.isConfigured,
          lastTestedAt: existingConfig?.lastTestedAt,
          emailsSentThisMonth: existingConfig?.emailsSentThisMonth,
          adminNotifications: {
            ...existingConfig?.adminNotifications,
            ...notificationSettings,
          },
        },
      });

      return { 
        success: true, 
        message: "Admin notification settings updated successfully" 
      };
    } catch (error) {
      console.error("Admin notification settings update error:", error);
      return { 
        success: false, 
        message: "Failed to update admin notification settings" 
      };
    }
  },
});

// Get store email configuration
export const getEmailConfig = query({
  args: { storeId: v.id("stores") },
  returns: v.union(v.null(), v.object({
    fromEmail: v.string(),
    fromName: v.optional(v.string()),
    replyToEmail: v.optional(v.string()),
    isConfigured: v.optional(v.boolean()),
    lastTestedAt: v.optional(v.number()),
    emailsSentThisMonth: v.optional(v.number()),
  })),
  handler: async (ctx, args) => {
    const store = await ctx.db.get(args.storeId);
    if (!store?.emailConfig) {
      return null;
    }

    const config = store.emailConfig;
    return {
      fromEmail: config.fromEmail,
      fromName: config.fromName,
      replyToEmail: config.replyToEmail,
      isConfigured: config.isConfigured,
      lastTestedAt: config.lastTestedAt,
      emailsSentThisMonth: config.emailsSentThisMonth,
    };
  },
});

// Internal function to get store email config for sending emails (no API key needed)
export const getStoreEmailConfigInternal = query({
  args: { storeId: v.id("stores") },
  returns: v.union(v.null(), v.object({
    fromEmail: v.string(),
    fromName: v.optional(v.string()),
    replyToEmail: v.optional(v.string()),
    isConfigured: v.optional(v.boolean()),
    lastTestedAt: v.optional(v.number()),
    emailsSentThisMonth: v.optional(v.number()),
  })),
  handler: async (ctx, args) => {
    const store = await ctx.db.get(args.storeId);
    return store?.emailConfig || null;
  },
});

// Update email usage tracking
export const updateEmailUsage = mutation({
  args: {
    storeId: v.id("stores"),
    emailsSent: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const store = await ctx.db.get(args.storeId);
    if (!store?.emailConfig) return null;

    const currentMonth = new Date().getMonth();
    const lastTestedMonth = store.emailConfig.lastTestedAt 
      ? new Date(store.emailConfig.lastTestedAt).getMonth()
      : -1;

    // Reset counter if it's a new month
    const emailsSentThisMonth = currentMonth !== lastTestedMonth 
      ? args.emailsSent 
      : (store.emailConfig.emailsSentThisMonth || 0) + args.emailsSent;

    await ctx.db.patch(args.storeId, {
      emailConfig: {
        ...store.emailConfig,
        emailsSentThisMonth,
        lastTestedAt: Date.now(),
      },
    });

    return null;
  },
});

// Mark email config as configured/tested
export const markEmailConfigVerified = mutation({
  args: {
    storeId: v.id("stores"),
    isConfigured: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const store = await ctx.db.get(args.storeId);
    if (!store?.emailConfig) return null;

    await ctx.db.patch(args.storeId, {
      emailConfig: {
        ...store.emailConfig,
        isConfigured: args.isConfigured,
        lastTestedAt: Date.now(),
      },
    });

    return null;
  },
}); 
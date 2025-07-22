import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Get all stores for a user
export const getStoresByUser = query({
  args: { userId: v.string() },
  returns: v.array(v.object({
    _id: v.id("stores"),
    _creationTime: v.number(),
    name: v.string(),
    slug: v.optional(v.string()),
    userId: v.string(),
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("stores")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Get store by ID
export const getStoreById = query({
  args: { storeId: v.id("stores") },
  returns: v.union(
    v.object({
      _id: v.id("stores"),
      _creationTime: v.number(),
      name: v.string(),
      slug: v.optional(v.string()),
      userId: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.storeId);
  },
});

// Get store by slug
export const getStoreBySlug = query({
  args: { slug: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("stores"),
      _creationTime: v.number(),
      name: v.string(),
      slug: v.optional(v.string()),
      userId: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("stores")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
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
    });
  },
});

// Update store
export const updateStore = mutation({
  args: {
    id: v.id("stores"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
  },
  returns: v.union(
    v.object({
      _id: v.id("stores"),
      _creationTime: v.number(),
      name: v.string(),
      slug: v.optional(v.string()),
      userId: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    // Get current store
    const currentStore = await ctx.db.get(id);
    if (!currentStore) {
      throw new Error("Store not found");
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
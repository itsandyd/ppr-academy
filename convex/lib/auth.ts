import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

/**
 * Verify the caller is authenticated and owns the given store.
 * Works with storeId as either Id<"stores"> or string.
 * Throws if not authenticated or not the store owner.
 */
export async function requireStoreOwner(
  ctx: QueryCtx | MutationCtx,
  storeId: Id<"stores"> | string
) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  // Try lookup by document _id first
  let store = await ctx.db
    .query("stores")
    .filter((q) => q.eq(q.field("_id"), storeId))
    .first();

  // Fall back to lookup by userId (Clerk ID) since many callers pass the Clerk user ID
  if (!store) {
    store = await ctx.db
      .query("stores")
      .withIndex("by_userId", (q) => q.eq("userId", storeId))
      .first();
  }

  if (!store) {
    throw new Error("Store not found");
  }

  if (store.userId !== identity.subject) {
    throw new Error("Unauthorized: you don't own this store");
  }

  return { identity, store };
}

/**
 * Verify the caller is authenticated.
 * Throws if not authenticated.
 */
export async function requireAuth(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }
  return identity;
}

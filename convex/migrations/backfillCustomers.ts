import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Backfill customer records from existing purchases
 * This should be run once to create customer records for all existing purchases
 * that don't have corresponding customer records
 */
export const backfillCustomersFromPurchases = internalMutation({
  args: {},
  returns: v.object({
    success: v.boolean(),
    customersCreated: v.number(),
    customersUpdated: v.number(),
    errors: v.number(),
  }),
  handler: async (ctx, args) => {
    let customersCreated = 0;
    let customersUpdated = 0;
    let errors = 0;

    try {
      // Get all completed purchases
      const purchases = await ctx.db
        .query("purchases")
        .withIndex("by_status", (q) => q.eq("status", "completed"))
        .collect();

      for (const purchase of purchases) {
        try {
          // Get user info
          const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", purchase.userId))
            .unique();

          if (!user || !user.email) {
            continue;
          }

          const userEmail = user.email; // TypeScript type guard

          // Get product/course name for source
          let sourceName = "Purchase";
          if (purchase.courseId) {
            const course = await ctx.db.get(purchase.courseId);
            sourceName = course?.title || "Course Purchase";
          } else if (purchase.productId) {
            const product = await ctx.db.get(purchase.productId);
            sourceName = product?.title || "Product Purchase";
          }

          // Check if customer already exists for this store
          const existingCustomer = await ctx.db
            .query("customers")
            .withIndex("by_email_and_store", (q) => 
              q.eq("email", userEmail).eq("storeId", purchase.storeId)
            )
            .unique();

          if (existingCustomer) {
            // Update existing customer
            await ctx.db.patch(existingCustomer._id, {
              type: purchase.amount > 0 ? "paying" : existingCustomer.type,
              totalSpent: (existingCustomer.totalSpent || 0) + purchase.amount,
              lastActivity: purchase.lastAccessedAt || purchase._creationTime,
              status: "active",
            });
            customersUpdated++;
          } else {
            // Create new customer record
            await ctx.db.insert("customers", {
              name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || userEmail,
              email: userEmail,
              storeId: purchase.storeId,
              adminUserId: purchase.adminUserId,
              type: purchase.amount > 0 ? "paying" : "lead",
              status: "active",
              totalSpent: purchase.amount,
              lastActivity: purchase.lastAccessedAt || purchase._creationTime,
              source: sourceName,
            });
            customersCreated++;
          }
        } catch (error) {
          console.error(`Error processing purchase ${purchase._id}:`, error);
          errors++;
        }
      }

      return {
        success: true,
        customersCreated,
        customersUpdated,
        errors,
      };
    } catch (error) {
      console.error("Backfill failed:", error);
      return {
        success: false,
        customersCreated,
        customersUpdated,
        errors: errors + 1,
      };
    }
  },
});


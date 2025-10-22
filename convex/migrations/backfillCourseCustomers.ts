import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Backfill customer records for course enrollments
 * 
 * This migration creates customer records for users who:
 * 1. Have purchased courses (via purchases table)
 * 2. Have active subscriptions that grant course access
 * 
 * Run this once to ensure all enrolled students show up in the creator's customer list
 */
export const backfillCourseCustomers = internalMutation({
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
      // Get all course purchases
      const coursePurchases = await ctx.db
        .query("purchases")
        .withIndex("by_productType", (q) => q.eq("productType", "course"))
        .filter((q) => q.eq(q.field("status"), "completed"))
        .collect();

      console.log(`Found ${coursePurchases.length} course purchases to process`);

      for (const purchase of coursePurchases) {
        try {
          if (!purchase.courseId) {
            console.log(`Skipping purchase ${purchase._id} - no courseId`);
            continue;
          }

          // Get course details
          const course = await ctx.db.get(purchase.courseId);
          if (!course) {
            console.log(`Course not found for purchase ${purchase._id}`);
            continue;
          }

          // Get user details
          const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", purchase.userId))
            .unique();

          if (!user) {
            console.log(`User not found for purchase ${purchase._id}, userId: ${purchase.userId}`);
            continue;
          }

          const storeId = course.storeId || course.userId;
          const userEmail = user.email || purchase.userId;

          // Check if customer record already exists
          const existingCustomer = await ctx.db
            .query("customers")
            .withIndex("by_email_and_store", (q) => 
              q.eq("email", userEmail).eq("storeId", storeId)
            )
            .unique();

          const customerType = purchase.amount > 0 ? "paying" : "lead";

          if (existingCustomer) {
            // Update existing customer if needed
            const updates: any = {
              lastActivity: purchase.lastAccessedAt || purchase._creationTime,
              status: "active",
            };
            
            // Upgrade to paying if this was a paid purchase
            if (purchase.amount > 0 && existingCustomer.type === "lead") {
              updates.type = "paying";
              updates.totalSpent = (existingCustomer.totalSpent || 0) + purchase.amount;
            } else if (purchase.amount > 0) {
              updates.totalSpent = (existingCustomer.totalSpent || 0) + purchase.amount;
            }
            
            await ctx.db.patch(existingCustomer._id, updates);
            customersUpdated++;
          } else {
            // Create new customer record
            await ctx.db.insert("customers", {
              name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || userEmail,
              email: userEmail,
              storeId: storeId,
              adminUserId: course.userId,
              type: customerType,
              status: "active",
              totalSpent: purchase.amount,
              lastActivity: purchase.lastAccessedAt || purchase._creationTime,
              source: course.title || "Course Enrollment",
            });
            customersCreated++;
          }
        } catch (error) {
          console.error(`Error processing purchase ${purchase._id}:`, error);
          errors++;
        }
      }

      console.log(`Backfill complete: ${customersCreated} created, ${customersUpdated} updated, ${errors} errors`);

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

/**
 * Backfill customer records for subscription-based course access
 * 
 * This creates "lead" customer records for users who have access to courses
 * through subscriptions but haven't made direct purchases
 */
export const backfillSubscriptionCustomers = internalMutation({
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
      // Get all active subscriptions
      const subscriptions = await ctx.db
        .query("membershipSubscriptions")
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();

      console.log(`Found ${subscriptions.length} active subscriptions to process`);

      for (const subscription of subscriptions) {
        try {
          // Get user details
          const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", subscription.userId))
            .unique();

          if (!user) {
            console.log(`User not found for subscription ${subscription._id}`);
            continue;
          }

          const userEmail = user.email || subscription.userId;

          // Check if customer record already exists
          const existingCustomer = await ctx.db
            .query("customers")
            .withIndex("by_email_and_store", (q) => 
              q.eq("email", userEmail).eq("storeId", subscription.storeId)
            )
            .unique();

          if (existingCustomer) {
            // Update existing customer
            const updates: any = {
              lastActivity: Date.now(),
              status: "active",
            };
            
            // Upgrade to subscription type if they have an active subscription
            if (existingCustomer.type !== "subscription") {
              updates.type = "subscription";
            }
            
            await ctx.db.patch(existingCustomer._id, updates);
            customersUpdated++;
          } else {
            // Get subscription plan for source info
            const plan = await ctx.db.get(subscription.planId);
            
            // Get store to find creator/admin user ID
            const store = await ctx.db.get(subscription.storeId);
            
            // Create new customer record
            await ctx.db.insert("customers", {
              name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || userEmail,
              email: userEmail,
              storeId: subscription.storeId,
              adminUserId: store?.userId || subscription.storeId,
              type: "subscription",
              status: "active",
              totalSpent: subscription.amountPaid || 0,
              lastActivity: Date.now(),
              source: plan?.name || "Subscription",
            });
            customersCreated++;
          }
        } catch (error) {
          console.error(`Error processing subscription ${subscription._id}:`, error);
          errors++;
        }
      }

      console.log(`Subscription backfill complete: ${customersCreated} created, ${customersUpdated} updated, ${errors} errors`);

      return {
        success: true,
        customersCreated,
        customersUpdated,
        errors,
      };
    } catch (error) {
      console.error("Subscription backfill failed:", error);
      return {
        success: false,
        customersCreated,
        customersUpdated,
        errors: errors + 1,
      };
    }
  },
});


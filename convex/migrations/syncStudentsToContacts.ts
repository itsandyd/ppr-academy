import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Sync students (from purchases) to emailContacts
 * This ensures all paying students are in your email list
 * 
 * Run with: storeId = your Convex store ID (e.g., "kh78hrngdvmxbqy6g6w4faecpd7m63ra")
 */
export const syncStudentsToContacts = internalMutation({
  args: {
    storeId: v.string(), // The actual Convex store ID
    batchSize: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    synced: v.number(),
    skipped: v.number(),
    studentsProcessed: v.number(),
    errors: v.array(v.string()),
    isDone: v.boolean(),
    nextCursor: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    let synced = 0;
    let skipped = 0;
    let studentsProcessed = 0;
    const errors: string[] = [];
    const now = Date.now();
    const batchSize = args.batchSize || 50;

    try {
      // Get completed purchases for this store with pagination
      const paginationOpts = {
        numItems: batchSize,
        cursor: args.cursor || null,
      };

      const purchasesResult = await ctx.db
        .query("purchases")
        .withIndex("by_store_status", (q) => 
          q.eq("storeId", args.storeId).eq("status", "completed")
        )
        .paginate(paginationOpts);

      const purchases = purchasesResult.page;
      // Get unique user IDs from this batch
      const userIdsInBatch = [...new Set(purchases.map((p) => p.userId))];

      // Process each unique student
      for (const clerkUserId of userIdsInBatch) {
        studentsProcessed++;

        try {
          // Find user by clerkId
          const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkUserId))
            .first();

          if (!user) {
            errors.push(`User ${clerkUserId} not found in users table`);
            continue;
          }

          if (!user.email) {
            errors.push(`User ${clerkUserId} has no email`);
            continue;
          }

          const email = user.email.toLowerCase();

          // Check if contact already exists (using Clerk userId as storeId for frontend compatibility)
          // First try with the actual storeId
          let existing = await ctx.db
            .query("emailContacts")
            .withIndex("by_storeId_and_email", (q) =>
              q.eq("storeId", args.storeId).eq("email", email)
            )
            .first();

          // Also check with the store's userId (Clerk ID) since frontend uses that
          if (!existing) {
            const store = await ctx.db
              .query("stores")
              .filter((q) => q.eq(q.field("_id"), args.storeId))
              .first();
            if (store && store.userId) {
              existing = await ctx.db
                .query("emailContacts")
                .withIndex("by_storeId_and_email", (q) =>
                  q.eq("storeId", store.userId).eq("email", email)
                )
                .first();
            }
          }

          if (existing) {
            // Update with student info if missing
            const updates: Record<string, any> = { updatedAt: now };
            
            if (!existing.firstName && (user.firstName || user.name)) {
              updates.firstName = user.firstName || user.name?.split(" ")[0];
            }
            if (!existing.lastName && (user.lastName || user.name)) {
              updates.lastName = user.lastName || user.name?.split(" ").slice(1).join(" ");
            }
            
            // Add custom field to mark as student
            const customFields = existing.customFields || {};
            if (!customFields.isStudent) {
              updates.customFields = {
                ...customFields,
                isStudent: true,
                studentSyncedAt: now,
              };
            }

            if (Object.keys(updates).length > 1) {
              await ctx.db.patch(existing._id, updates);
            }
            
            skipped++;
            continue;
          }

          // Get the store to find the owner's Clerk ID (for storeId field)
          const storeForContact = await ctx.db
            .query("stores")
            .filter((q) => q.eq(q.field("_id"), args.storeId))
            .first();
          const storeIdForContact = storeForContact?.userId || args.storeId;

          // Create new contact
          await ctx.db.insert("emailContacts", {
            storeId: storeIdForContact,
            email,
            firstName: user.firstName || user.name?.split(" ")[0],
            lastName: user.lastName || user.name?.split(" ").slice(1).join(" "),
            status: "subscribed",
            subscribedAt: now,
            tagIds: [],
            source: "student_sync",
            customFields: {
              isStudent: true,
              studentSyncedAt: now,
            },
            emailsSent: 0,
            emailsOpened: 0,
            emailsClicked: 0,
            createdAt: now,
            updatedAt: now,
          });

          synced++;
        } catch (error) {
          errors.push(`Error processing user ${clerkUserId}: ${error}`);
        }
      }

      const isDone = purchasesResult.isDone;
      return {
        success: true,
        synced,
        skipped,
        studentsProcessed,
        errors: errors.slice(0, 10),
        isDone,
        nextCursor: isDone ? undefined : purchasesResult.continueCursor,
      };
    } catch (error) {
      console.error("Sync failed:", error);
      return {
        success: false,
        synced,
        skipped,
        studentsProcessed,
        errors: [...errors, `Fatal: ${error}`].slice(0, 10),
        isDone: false,
        nextCursor: undefined,
      };
    }
  },
});

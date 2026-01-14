import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Fix emailContacts that have Convex store ID instead of Clerk User ID
 * The frontend uses Clerk User ID as storeId, so we need to update contacts
 * that were created with the Convex store ID
 */
export const fixContactStoreIds = mutation({
  args: {
    convexStoreId: v.string(), // The Convex store ID (e.g., "kh78hrngdvmxbqy6g6w4faecpd7m63ra")
    clerkUserId: v.string(), // The Clerk User ID (e.g., "user_2UficpPaNnmXib7UksvEIjVwcsx")
    batchSize: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
    updated: v.number(),
    skipped: v.number(),
    duplicates: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    let updated = 0;
    let skipped = 0;
    let duplicates = 0;
    const errors: string[] = [];
    const batchSize = args.batchSize || 100;

    try {
      // Get contacts with the wrong (Convex) storeId
      const contactsWithWrongId = await ctx.db
        .query("emailContacts")
        .withIndex("by_storeId", (q) => q.eq("storeId", args.convexStoreId))
        .take(batchSize);

      console.log(`Found ${contactsWithWrongId.length} contacts with Convex store ID`);

      // Get existing contacts with correct (Clerk) storeId to check for duplicates
      const existingContacts = await ctx.db
        .query("emailContacts")
        .withIndex("by_storeId", (q) => q.eq("storeId", args.clerkUserId))
        .collect();

      const existingEmails = new Set(existingContacts.map((c) => c.email.toLowerCase()));

      for (const contact of contactsWithWrongId) {
        try {
          const email = contact.email.toLowerCase();

          // Check if this email already exists under the correct storeId
          if (existingEmails.has(email)) {
            // Delete the duplicate (keep the one with correct storeId)
            await ctx.db.delete(contact._id);
            duplicates++;
            continue;
          }

          // Update the storeId to the correct Clerk User ID
          await ctx.db.patch(contact._id, {
            storeId: args.clerkUserId,
            updatedAt: Date.now(),
          });

          updated++;
          existingEmails.add(email); // Track to avoid creating duplicates
        } catch (error) {
          errors.push(`Error updating contact ${contact._id}: ${error}`);
        }
      }

      const hasMore = contactsWithWrongId.length === batchSize;
      console.log(
        `Batch complete: ${updated} updated, ${skipped} skipped, ${duplicates} duplicates removed. Has more: ${hasMore}`
      );

      return {
        success: true,
        updated,
        skipped,
        duplicates,
        errors: errors.slice(0, 10),
      };
    } catch (error) {
      console.error("Fix failed:", error);
      return {
        success: false,
        updated,
        skipped,
        duplicates,
        errors: [...errors, `Fatal: ${error}`].slice(0, 10),
      };
    }
  },
});

import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Remove contacts that are not students (e.g., imported contacts from ActiveCampaign)
 * Only keeps contacts with source: "course_enrollment", "student_sync", "manual"
 */
export const removeNonStudentContacts = internalMutation({
  args: {
    storeId: v.string(), // Clerk User ID
    dryRun: v.optional(v.boolean()), // If true, just count without deleting
    batchSize: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
    deleted: v.number(),
    kept: v.number(),
    bySource: v.any(),
    isDryRun: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? true; // Default to dry run for safety
    const batchSize = args.batchSize || 200;
    let deleted = 0;
    let kept = 0;

    // Sources to keep (actual students)
    const studentSources = new Set([
      "course_enrollment",
      "student_sync", 
      "manual",
      "purchase", // In case any were added this way
    ]);

    // Get contacts for this store
    const contacts = await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .take(batchSize);

    const bySource: Record<string, { kept: number; deleted: number }> = {};

    for (const contact of contacts) {
      const source = contact.source || "unknown";
      
      if (!bySource[source]) {
        bySource[source] = { kept: 0, deleted: 0 };
      }

      if (studentSources.has(source)) {
        kept++;
        bySource[source].kept++;
      } else {
        // This is a non-student contact (e.g., activecampaign_import)
        if (!dryRun) {
          await ctx.db.delete(contact._id);
        }
        deleted++;
        bySource[source].deleted++;
      }
    }

    console.log(
      `${dryRun ? "[DRY RUN] " : ""}Processed ${contacts.length} contacts: ${deleted} deleted, ${kept} kept`
    );

    return {
      success: true,
      deleted,
      kept,
      bySource,
      isDryRun: dryRun,
    };
  },
});

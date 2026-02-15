import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

/**
 * Tag contacts to segment students vs leads
 * - Students: People who purchased courses (source: course_enrollment, student_sync)
 * - Leads: People who subscribed but haven't purchased (source: activecampaign_import, etc.)
 */
export const tagStudentsVsLeads = internalMutation({
  args: {
    storeId: v.string(), // Clerk User ID
    batchSize: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    studentsTagged: v.number(),
    leadsTagged: v.number(),
    alreadyTagged: v.number(),
    processed: v.number(),
    isDone: v.boolean(),
    nextCursor: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    let studentsTagged = 0;
    let leadsTagged = 0;
    let alreadyTagged = 0;
    const batchSize = args.batchSize || 100;

    // Sources that indicate actual students (purchased courses)
    const studentSources = new Set([
      "course_enrollment",
      "student_sync",
      "purchase",
    ]);

    // Get or create the "student" tag
    let studentTag = await ctx.db
      .query("emailTags")
      .withIndex("by_storeId_and_name", (q) =>
        q.eq("storeId", args.storeId).eq("name", "student")
      )
      .first();

    if (!studentTag) {
      const now = Date.now();
      const studentTagId = await ctx.db.insert("emailTags", {
        storeId: args.storeId,
        name: "student",
        color: "#22c55e", // Green
        description: "Enrolled students who purchased courses",
        contactCount: 0,
        createdAt: now,
        updatedAt: now,
      });
      studentTag = await ctx.db.get(studentTagId);
    }

    // Get or create the "lead" tag
    let leadTag = await ctx.db
      .query("emailTags")
      .withIndex("by_storeId_and_name", (q) =>
        q.eq("storeId", args.storeId).eq("name", "lead")
      )
      .first();

    if (!leadTag) {
      const now = Date.now();
      const leadTagId = await ctx.db.insert("emailTags", {
        storeId: args.storeId,
        name: "lead",
        color: "#3b82f6", // Blue
        description: "Email subscribers who haven't purchased yet",
        contactCount: 0,
        createdAt: now,
        updatedAt: now,
      });
      leadTag = await ctx.db.get(leadTagId);
    }

    if (!studentTag || !leadTag) {
      return {
        success: false,
        studentsTagged: 0,
        leadsTagged: 0,
        alreadyTagged: 0,
        processed: 0,
        isDone: true,
        nextCursor: undefined,
      };
    }

    const studentTagId = studentTag._id;
    const leadTagId = leadTag._id;

    // Get contacts with pagination
    const paginationOpts = {
      numItems: batchSize,
      cursor: args.cursor || null,
    };

    const contactsResult = await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .paginate(paginationOpts);

    const contacts = contactsResult.page;

    for (const contact of contacts) {
      const source = contact.source || "unknown";
      const currentTags = contact.tagIds || [];

      // Check if already has student or lead tag
      const hasStudentTag = currentTags.includes(studentTagId);
      const hasLeadTag = currentTags.includes(leadTagId);

      if (studentSources.has(source)) {
        // This is a student
        if (!hasStudentTag) {
          // Add student tag, remove lead tag if present
          const newTags = currentTags.filter((t: Id<"emailTags">) => t !== leadTagId);
          newTags.push(studentTagId);
          await ctx.db.patch(contact._id, {
            tagIds: newTags,
            updatedAt: Date.now(),
          });
          studentsTagged++;
        } else {
          alreadyTagged++;
        }
      } else {
        // This is a lead (not a student yet)
        if (!hasLeadTag && !hasStudentTag) {
          // Add lead tag (but don't override if they're already a student)
          const newTags = [...currentTags, leadTagId];
          await ctx.db.patch(contact._id, {
            tagIds: newTags,
            updatedAt: Date.now(),
          });
          leadsTagged++;
        } else {
          alreadyTagged++;
        }
      }
    }

    // Update tag counts
    const allContacts = await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .collect();

    const studentCount = allContacts.filter((c) =>
      c.tagIds?.includes(studentTagId)
    ).length;
    const leadCount = allContacts.filter((c) =>
      c.tagIds?.includes(leadTagId)
    ).length;

    await ctx.db.patch(studentTagId, { contactCount: studentCount });
    await ctx.db.patch(leadTagId, { contactCount: leadCount });

    const isDone = contactsResult.isDone;
    console.log(
      `Batch complete: ${studentsTagged} students tagged, ${leadsTagged} leads tagged, ${alreadyTagged} already tagged. Done: ${isDone}`
    );

    return {
      success: true,
      studentsTagged,
      leadsTagged,
      alreadyTagged,
      processed: contacts.length,
      isDone,
      nextCursor: isDone ? undefined : contactsResult.continueCursor,
    };
  },
});

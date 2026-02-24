import { internalQuery } from "./_generated/server";
import { v } from "convex/values";

/**
 * Internal query to get all chapters for a course (used by batch image generation).
 * Separated from the "use node" action file.
 */
export const getCourseChaptersInternal = internalQuery({
  args: { courseId: v.id("courses") },
  returns: v.array(
    v.object({
      _id: v.id("courseChapters"),
      title: v.string(),
      description: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const chapters = await ctx.db
      .query("courseChapters")
      .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId))
      .take(200);

    return chapters.map((ch) => ({
      _id: ch._id,
      title: ch.title,
      description: ch.description,
    }));
  },
});

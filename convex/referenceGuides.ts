import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const updateReferencePdfInfo = mutation({
  args: {
    courseId: v.id("courses"),
    pdfStorageId: v.string(),
    pdfUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    await ctx.db.patch(args.courseId, {
      referencePdfStorageId: args.pdfStorageId,
      referencePdfUrl: args.pdfUrl,
      referencePdfGeneratedAt: Date.now(),
    });
  },
});

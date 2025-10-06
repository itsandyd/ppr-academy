import { query } from "./_generated/server";
import { v } from "convex/values";

// Temporary debugging query to find courses by title
export const findCourseByTitle = query({
  args: { titleFragment: v.string() },
  returns: v.array(v.object({
    _id: v.id("courses"),
    title: v.string(),
    slug: v.optional(v.string()),
    isPublished: v.optional(v.boolean()),
    userId: v.string(),
  })),
  handler: async (ctx, args) => {
    const allCourses = await ctx.db.query("courses").collect();
    
    // Filter courses that contain the title fragment (case insensitive)
    return allCourses
      .filter(course => 
        course.title.toLowerCase().includes(args.titleFragment.toLowerCase())
      )
      .map(course => ({
        _id: course._id,
        title: course.title,
        slug: course.slug,
        isPublished: course.isPublished,
        userId: course.userId,
      }));
  },
});

// Get all courses for a user
export const getAllUserCourses = query({
  args: { userId: v.string() },
  returns: v.array(v.object({
    _id: v.id("courses"),
    title: v.string(),
    slug: v.optional(v.string()),
    isPublished: v.optional(v.boolean()),
    _creationTime: v.number(),
  })),
  handler: async (ctx, args) => {
    const courses = await ctx.db
      .query("courses")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    
    return courses.map(course => ({
      _id: course._id,
      title: course.title,
      slug: course.slug,
      isPublished: course.isPublished,
      _creationTime: course._creationTime,
    }));
  },
});


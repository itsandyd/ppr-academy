import { query } from "./_generated/server";
import { v } from "convex/values";

// Get user's enrolled courses with progress
export const getUserEnrolledCourses = query({
  args: { userId: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("courses"),
      title: v.string(),
      description: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      price: v.optional(v.number()),
      category: v.optional(v.string()),
      subcategory: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      skillLevel: v.optional(v.string()),
      slug: v.optional(v.string()),
      userId: v.string(),
      progress: v.optional(v.number()),
      enrolledAt: v.optional(v.number()),
      lastAccessedAt: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    // Get user's enrollments
    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    // Get course details for each enrollment
    const coursesWithProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        const course = await ctx.db.get(enrollment.courseId as any) as any;
        if (!course) return null;

        return {
          _id: course._id,
          title: course.title || "",
          description: course.description || undefined,
          imageUrl: course.imageUrl || undefined,
          price: course.price || undefined,
          category: course.category || undefined,
          subcategory: course.subcategory || undefined,
          tags: course.tags || undefined,
          skillLevel: course.skillLevel || undefined,
          slug: course.slug || undefined,
          userId: course.userId || "",
          progress: enrollment.progress || 0,
          enrolledAt: enrollment._creationTime,
          lastAccessedAt: enrollment._creationTime,
        };
      })
    );

    // Filter out null values and return
    return coursesWithProgress.filter((c) => c !== null) as any;
  },
});

// Get user's library stats
export const getUserLibraryStats = query({
  args: { userId: v.string() },
  returns: v.object({
    coursesEnrolled: v.number(),
    coursesCompleted: v.number(),
    totalHoursLearned: v.number(),
    currentStreak: v.number(),
    certificatesEarned: v.number(),
  }),
  handler: async (ctx, args) => {
    // Get enrollments
    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    // Count completed courses (progress >= 100)
    const completedCourses = enrollments.filter(
      (e) => (e.progress || 0) >= 100
    ).length;

    // Get user progress records to calculate hours
    const progressRecords = await ctx.db
      .query("userProgress")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    // Calculate total time spent (sum of timeSpent in minutes, convert to hours)
    const totalMinutes = progressRecords.reduce(
      (acc, p) => acc + (p.timeSpent || 0),
      0
    );
    const totalHours = Math.round(totalMinutes / 60);

    // Calculate streak (simplified - just count days with activity in last 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentActivity = progressRecords.filter(
      (p) => (p.lastAccessedAt || 0) > thirtyDaysAgo
    );
    const uniqueDays = new Set(
      recentActivity.map((p) =>
        new Date(p.lastAccessedAt || 0).toDateString()
      )
    ).size;

    return {
      coursesEnrolled: enrollments.length,
      coursesCompleted: completedCourses,
      totalHoursLearned: totalHours,
      currentStreak: uniqueDays,
      certificatesEarned: completedCourses, // For now, 1 certificate per completed course
    };
  },
});

// Get user's recent activity
export const getUserRecentActivity = query({
  args: { userId: v.string(), limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      id: v.string(),
      type: v.union(
        v.literal("completed_lesson"),
        v.literal("started_course"),
        v.literal("earned_certificate")
      ),
      title: v.string(),
      courseName: v.string(),
      timestamp: v.string(),
      timestampMs: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    // Get recent progress records
    const recentProgress = await ctx.db
      .query("userProgress")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    // Get recent enrollments
    const recentEnrollments = await ctx.db
      .query("enrollments")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(5);

    const activities = [];

    // Add completed lessons
    for (const progress of recentProgress) {
      if (progress.isCompleted) {
        const course = await ctx.db.get(progress.courseId as any) as any;
        if (course && course.title) {
          const timeAgo = getTimeAgo(progress.completedAt || progress._creationTime);
          activities.push({
            id: progress._id,
            type: "completed_lesson" as const,
            title: `Completed a lesson`,
            courseName: course.title,
            timestamp: timeAgo,
            timestampMs: progress.completedAt || progress._creationTime,
          });
        }
      }
    }

    // Add started courses
    for (const enrollment of recentEnrollments) {
      const course = await ctx.db.get(enrollment.courseId as any) as any;
      if (course && course.title) {
        const timeAgo = getTimeAgo(enrollment._creationTime);
        activities.push({
          id: enrollment._id,
          type: "started_course" as const,
          title: "Started new course",
          courseName: course.title,
          timestamp: timeAgo,
          timestampMs: enrollment._creationTime,
        });
      }
    }

    // Sort by timestamp and limit
    activities.sort((a, b) => b.timestampMs - a.timestampMs);
    return activities.slice(0, limit);
  },
});

// Helper function to format time ago
function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  if (days < 30) return `${days} ${days === 1 ? "day" : "days"} ago`;
  return `${Math.floor(days / 30)} ${Math.floor(days / 30) === 1 ? "month" : "months"} ago`;
}

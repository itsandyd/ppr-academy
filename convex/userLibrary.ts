import { query } from "./_generated/server";
import { v } from "convex/values";

// Get user's enrolled courses with progress (IMPROVED)
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
    // IMPROVED: Check both enrollments AND purchases for comprehensive access

    // Method 1: Get from enrollments table
    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    // Method 2: Get from purchases table (more reliable)
    const coursePurchases = await ctx.db
      .query("purchases")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) =>
        q.and(q.eq(q.field("productType"), "course"), q.eq(q.field("status"), "completed"))
      )
      .collect();

    // Combine both sources (purchases are authoritative)
    const allCourseIds = new Set([
      ...enrollments.map((e) => e.courseId),
      ...coursePurchases.map((p) => p.courseId).filter(Boolean),
    ]);

    // Get course details for all accessible courses
    const coursesWithProgress = await Promise.all(
      Array.from(allCourseIds).map(async (courseId) => {
        const course = (await ctx.db.get(courseId as any)) as any;
        if (!course) return null;

        // Get enrollment data (for progress)
        const enrollment = enrollments.find((e) => e.courseId === courseId);

        // Get purchase data (for access verification)
        const purchase = coursePurchases.find((p) => p.courseId === courseId);

        // Calculate progress from userProgress table
        const userProgress = await ctx.db
          .query("userProgress")
          .withIndex("by_user_course", (q) =>
            q.eq("userId", args.userId).eq("courseId", courseId as any)
          )
          .collect();

        const totalChapters = await ctx.db
          .query("courseChapters")
          .withIndex("by_courseId", (q) => q.eq("courseId", courseId as any))
          .collect();

        const completedChapters = userProgress.filter((p) => p.isCompleted).length;
        const calculatedProgress =
          totalChapters.length > 0
            ? Math.round((completedChapters / totalChapters.length) * 100)
            : 0;

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
          progress: calculatedProgress, // Use calculated progress
          enrolledAt: enrollment?._creationTime || purchase?._creationTime,
          lastAccessedAt: purchase?.lastAccessedAt || enrollment?._creationTime,
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
    const completedCourses = enrollments.filter((e) => (e.progress || 0) >= 100).length;

    // Get user progress records to calculate hours
    const progressRecords = await ctx.db
      .query("userProgress")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    // Calculate total time spent (sum of timeSpent in minutes, convert to hours)
    const totalMinutes = progressRecords.reduce((acc, p) => acc + (p.timeSpent || 0), 0);
    const totalHours = Math.round(totalMinutes / 60);

    // Calculate streak (simplified - just count days with activity in last 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentActivity = progressRecords.filter((p) => (p.lastAccessedAt || 0) > thirtyDaysAgo);
    const uniqueDays = new Set(
      recentActivity.map((p) => new Date(p.lastAccessedAt || 0).toDateString())
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
        const course = (await ctx.db.get(progress.courseId as any)) as any;
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
      const course = (await ctx.db.get(enrollment.courseId as any)) as any;
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

export const getContinueWatching = query({
  args: { userId: v.string() },
  returns: v.union(
    v.object({
      course: v.object({
        _id: v.id("courses"),
        title: v.string(),
        slug: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
      }),
      nextChapter: v.object({
        _id: v.string(),
        title: v.string(),
        moduleTitle: v.optional(v.string()),
        lessonTitle: v.optional(v.string()),
        position: v.number(),
      }),
      progress: v.number(),
      totalChapters: v.number(),
      completedChapters: v.number(),
      lastAccessedAt: v.number(),
      timeAgo: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const allProgress = await ctx.db
      .query("userProgress")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    if (allProgress.length === 0) return null;

    const courseProgress = new Map<string, { lastAccessed: number; completed: Set<string> }>();

    for (const p of allProgress) {
      if (!p.courseId) continue;
      const courseId = p.courseId.toString();

      if (!courseProgress.has(courseId)) {
        courseProgress.set(courseId, { lastAccessed: 0, completed: new Set() });
      }

      const cp = courseProgress.get(courseId)!;
      if (p.lastAccessedAt && p.lastAccessedAt > cp.lastAccessed) {
        cp.lastAccessed = p.lastAccessedAt;
      }
      if (p.isCompleted && p.chapterId) {
        cp.completed.add(p.chapterId);
      }
    }

    const sortedCourses = Array.from(courseProgress.entries()).sort(
      (a, b) => b[1].lastAccessed - a[1].lastAccessed
    );

    for (const [courseIdStr, data] of sortedCourses) {
      const course = await ctx.db.get(courseIdStr as any);
      if (!course || !course.isPublished) continue;

      const chapters = await ctx.db
        .query("courseChapters")
        .withIndex("by_courseId", (q) => q.eq("courseId", courseIdStr as any))
        .collect();

      if (chapters.length === 0) continue;

      const sortedChapters = chapters.sort((a, b) => (a.position || 0) - (b.position || 0));
      const nextChapter = sortedChapters.find((ch) => !data.completed.has(ch._id));

      if (!nextChapter) continue;

      let moduleTitle: string | undefined;
      let lessonTitle: string | undefined;

      if (nextChapter.lessonId) {
        const lesson = await ctx.db.get(nextChapter.lessonId as any);
        if (lesson) {
          lessonTitle = (lesson as any).title;
          if ((lesson as any).moduleId) {
            const module = await ctx.db.get((lesson as any).moduleId);
            if (module) moduleTitle = (module as any).title;
          }
        }
      }

      const completedCount = data.completed.size;
      const totalCount = sortedChapters.length;
      const progressPercent = Math.round((completedCount / totalCount) * 100);

      return {
        course: {
          _id: course._id,
          title: course.title || "Untitled Course",
          slug: course.slug,
          imageUrl: course.imageUrl,
        },
        nextChapter: {
          _id: nextChapter._id,
          title: nextChapter.title || "Untitled Chapter",
          moduleTitle,
          lessonTitle,
          position: nextChapter.position || 0,
        },
        progress: progressPercent,
        totalChapters: totalCount,
        completedChapters: completedCount,
        lastAccessedAt: data.lastAccessed,
        timeAgo: getTimeAgo(data.lastAccessed),
      };
    }

    return null;
  },
});

import { internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";

/**
 * Bulk Fix All Enrollment Issues
 * 
 * Automatically fix enrollment problems for ALL users at once
 */
export const fixAllUsersEnrollments = internalMutation({
  args: {},
  returns: v.object({
    totalUsers: v.number(),
    usersFixed: v.number(),
    enrollmentsCreated: v.number(),
    errors: v.number(),
    summary: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const summary: string[] = [];
    let totalUsers = 0;
    let usersFixed = 0;
    let enrollmentsCreated = 0;
    let errors = 0;

    try {
      // Get all course purchases (completed)
      const allPurchases = await ctx.db
        .query("purchases")
        .filter((q) => 
          q.and(
            q.eq(q.field("productType"), "course"),
            q.eq(q.field("status"), "completed")
          )
        )
        .take(10000);

      // Group by user
      const purchasesByUser = allPurchases.reduce((acc, purchase) => {
        if (!purchase.courseId) return acc; // Skip invalid purchases
        if (!acc[purchase.userId]) acc[purchase.userId] = [];
        acc[purchase.userId].push(purchase);
        return acc;
      }, {} as Record<string, typeof allPurchases>);

      totalUsers = Object.keys(purchasesByUser).length;

      // Fix each user
      for (const [userId, userPurchases] of Object.entries(purchasesByUser)) {
        let userFixed = false;
        
        for (const purchase of userPurchases) {
          if (!purchase.courseId) continue;

          try {
            // Check if enrollment exists
            const existingEnrollment = await ctx.db
              .query("enrollments")
              .withIndex("by_user_course", (q) => 
                q.eq("userId", userId).eq("courseId", purchase.courseId as any)
              )
              .unique();

            if (!existingEnrollment) {
              // Create missing enrollment
              await ctx.db.insert("enrollments", {
                userId: userId,
                courseId: purchase.courseId,
                progress: 0,
              });
              
              enrollmentsCreated++;
              userFixed = true;
            }
          } catch (error) {
            errors++;
            console.error(`❌ Failed to sync enrollment for user ${userId}, course ${purchase.courseId}:`, error);
          }
        }

        if (userFixed) {
          usersFixed++;
        }
      }

      // Generate summary
      summary.push(`Total users processed: ${totalUsers}`);
      summary.push(`Users fixed: ${usersFixed}`);
      summary.push(`Enrollments created: ${enrollmentsCreated}`);
      summary.push(`Errors: ${errors}`);

      if (enrollmentsCreated > 0) {
        summary.push("✅ Missing enrollment records have been created");
        summary.push("✅ Users should now be able to access their courses");
        summary.push("✅ Continue Learning buttons should work");
      }

      return {
        totalUsers,
        usersFixed,
        enrollmentsCreated,
        errors,
        summary,
      };

    } catch (error) {
      console.error("💥 Bulk fix failed:", error);
      return {
        totalUsers: 0,
        usersFixed: 0,
        enrollmentsCreated: 0,
        errors: 1,
        summary: [`Fatal error: ${error}`],
      };
    }
  },
});

/**
 * Check Enrollment Health Across All Users
 * 
 * Get overview of enrollment issues without fixing them
 */
export const checkEnrollmentHealth = internalQuery({
  args: {},
  returns: v.object({
    totalPurchases: v.number(),
    totalEnrollments: v.number(),
    usersWithPurchases: v.number(),
    usersWithEnrollments: v.number(),
    usersWithMissingEnrollments: v.number(),
    healthScore: v.number(), // 0-100%
  }),
  handler: async (ctx, args) => {
    // Get all course purchases
    const allPurchases = await ctx.db
      .query("purchases")
      .filter((q) => 
        q.and(
          q.eq(q.field("productType"), "course"),
          q.eq(q.field("status"), "completed")
        )
      )
      .take(10000);

    // Get all enrollments
    const allEnrollments = await ctx.db
      .query("enrollments")
      .take(10000);

    // Count unique users
    const usersWithPurchases = new Set(allPurchases.map(p => p.userId)).size;
    const usersWithEnrollments = new Set(allEnrollments.map(e => e.userId)).size;

    // Find users with purchases but no enrollments
    const purchaseUsers = new Set(allPurchases.map(p => p.userId));
    const enrollmentUsers = new Set(allEnrollments.map(e => e.userId));
    
    const usersWithMissingEnrollments = Array.from(purchaseUsers).filter(
      userId => !enrollmentUsers.has(userId)
    ).length;

    // Calculate health score
    const healthScore = usersWithPurchases > 0 
      ? Math.round(((usersWithPurchases - usersWithMissingEnrollments) / usersWithPurchases) * 100)
      : 100;

    return {
      totalPurchases: allPurchases.length,
      totalEnrollments: allEnrollments.length,
      usersWithPurchases,
      usersWithEnrollments,
      usersWithMissingEnrollments,
      healthScore,
    };
  },
});

/**
 * Backfill Script - Populate analyticsEvents from existing data
 * Uses pagination to avoid document read limits
 */

import { internalMutation, mutation } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

const BATCH_SIZE = 100;

/**
 * Backfill signup events from users table
 * Run multiple times until it returns 0
 */
export const backfillSignups = internalMutation({
  args: {
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, { cursor }) => {
    // Get batch of users
    const usersQuery = ctx.db.query("users").order("asc");
    const users = await usersQuery.take(BATCH_SIZE);

    let created = 0;
    let lastId = cursor;

    for (const user of users) {
      if (!user.clerkId) continue;

      // Skip if we haven't reached cursor yet
      if (cursor && user._id <= cursor) continue;

      // Check if signup event already exists
      const existing = await ctx.db
        .query("analyticsEvents")
        .filter((q) =>
          q.and(
            q.eq(q.field("userId"), user.clerkId),
            q.eq(q.field("eventType"), "signup")
          )
        )
        .first();

      if (!existing) {
        await ctx.db.insert("analyticsEvents", {
          userId: user.clerkId,
          eventType: "signup",
          timestamp: user._creationTime,
          metadata: {},
        });
        created++;
      }
      lastId = user._id;
    }

    return {
      created,
      hasMore: users.length === BATCH_SIZE,
      nextCursor: lastId,
    };
  },
});

/**
 * Backfill creator_started events from stores
 */
export const backfillCreatorStarted = internalMutation({
  args: {},
  handler: async (ctx) => {
    const stores = await ctx.db.query("stores").take(BATCH_SIZE);
    let created = 0;

    for (const store of stores) {
      if (!store.userId) continue;

      const existing = await ctx.db
        .query("analyticsEvents")
        .filter((q) =>
          q.and(
            q.eq(q.field("userId"), store.userId),
            q.eq(q.field("eventType"), "creator_started")
          )
        )
        .first();

      if (!existing) {
        await ctx.db.insert("analyticsEvents", {
          userId: store.userId,
          storeId: store._id,
          eventType: "creator_started",
          timestamp: store._creationTime,
          metadata: {},
        });
        created++;
      }
    }

    return { created };
  },
});

/**
 * Backfill creator_published events
 */
export const backfillCreatorPublished = internalMutation({
  args: {},
  handler: async (ctx) => {
    let created = 0;

    // Get published courses
    const courses = await ctx.db.query("courses").take(500);
    const publishedCourses = courses.filter((c: any) => c.isPublished);

    for (const course of publishedCourses) {
      const courseData = course as any;
      if (!courseData.userId) continue;

      const store = await ctx.db
        .query("stores")
        .withIndex("by_userId", (q) => q.eq("userId", courseData.userId))
        .first();

      if (store) {
        const existing = await ctx.db
          .query("analyticsEvents")
          .filter((q) =>
            q.and(
              q.eq(q.field("storeId"), store._id),
              q.eq(q.field("eventType"), "creator_published")
            )
          )
          .first();

        if (!existing) {
          await ctx.db.insert("analyticsEvents", {
            userId: courseData.userId,
            storeId: store._id,
            eventType: "creator_published",
            resourceId: courseData._id,
            resourceType: "course",
            timestamp: courseData.publishedAt || courseData._creationTime,
            metadata: {},
          });
          created++;
        }
      }
    }

    return { created };
  },
});

/**
 * Backfill purchase events
 */
export const backfillPurchases = internalMutation({
  args: {},
  handler: async (ctx) => {
    const purchases = await ctx.db.query("purchases").take(BATCH_SIZE);
    let created = 0;

    for (const purchase of purchases) {
      const purchaseData = purchase as any;
      if (!purchaseData.userId) continue;

      const resourceId = purchaseData.productId || purchaseData.courseId;

      // Use index for efficient lookup
      const existing = await ctx.db
        .query("analyticsEvents")
        .withIndex("by_user_event", (q) =>
          q.eq("userId", purchaseData.userId).eq("eventType", "purchase")
        )
        .filter((q) => q.eq(q.field("resourceId"), resourceId))
        .first();

      if (!existing) {
        let storeId: string | undefined;
        if (purchaseData.storeId) {
          storeId = purchaseData.storeId;
        }

        await ctx.db.insert("analyticsEvents", {
          userId: purchaseData.userId,
          storeId,
          eventType: "purchase",
          resourceId,
          resourceType: purchaseData.productId ? "digitalProduct" : "course",
          timestamp: purchaseData._creationTime,
          metadata: {
            value: purchaseData.amount || 0,
            currency: "USD",
          },
        });
        created++;
      }
    }

    return { created };
  },
});

/**
 * Backfill enrollment events
 */
export const backfillEnrollments = internalMutation({
  args: {},
  handler: async (ctx) => {
    const enrollments = await ctx.db.query("enrollments").take(BATCH_SIZE);
    let created = 0;

    for (const enrollment of enrollments) {
      const enrollmentData = enrollment as any;
      if (!enrollmentData.userId || !enrollmentData.courseId) continue;

      // Use index for efficient lookup
      const existing = await ctx.db
        .query("analyticsEvents")
        .withIndex("by_user_event", (q) =>
          q.eq("userId", enrollmentData.userId).eq("eventType", "enrollment")
        )
        .filter((q) => q.eq(q.field("resourceId"), enrollmentData.courseId))
        .first();

      if (!existing) {
        await ctx.db.insert("analyticsEvents", {
          userId: enrollmentData.userId,
          eventType: "enrollment",
          resourceId: enrollmentData.courseId,
          resourceType: "course",
          timestamp: enrollmentData._creationTime,
          metadata: {},
        });
        created++;
      }
    }

    return { created };
  },
});

/**
 * Run all backfills (simple version for smaller datasets)
 */
export const backfillAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    const results = {
      signups: 0,
      creatorStarted: 0,
      creatorPublished: 0,
      purchases: 0,
      enrollments: 0,
      errors: [] as string[],
    };

    // 1. Backfill signup events from users
    try {
      const users = await ctx.db.query("users").take(10000);
      for (const user of users) {
        // Check if signup event already exists
        const existing = await ctx.db
          .query("analyticsEvents")
          .filter((q) =>
            q.and(
              q.eq(q.field("userId"), user.clerkId),
              q.eq(q.field("eventType"), "signup")
            )
          )
          .first();

        if (!existing && user.clerkId) {
          await ctx.db.insert("analyticsEvents", {
            userId: user.clerkId,
            eventType: "signup",
            timestamp: user._creationTime,
            metadata: {},
          });
          results.signups++;
        }
      }
    } catch (e) {
      results.errors.push(`Signups: ${e}`);
    }

    // 2. Backfill creator_started events from stores
    try {
      const stores = await ctx.db.query("stores").take(500);
      for (const store of stores) {
        // Check if creator_started event already exists
        const existing = await ctx.db
          .query("analyticsEvents")
          .filter((q) =>
            q.and(
              q.eq(q.field("userId"), store.userId),
              q.eq(q.field("eventType"), "creator_started")
            )
          )
          .first();

        if (!existing && store.userId) {
          await ctx.db.insert("analyticsEvents", {
            userId: store.userId,
            storeId: store._id,
            eventType: "creator_started",
            timestamp: store._creationTime,
            metadata: {},
          });
          results.creatorStarted++;
        }
      }
    } catch (e) {
      results.errors.push(`Creator started: ${e}`);
    }

    // 3. Backfill creator_published events from published courses/products
    try {
      const courses = await ctx.db.query("courses").take(500);
      const publishedCourses = courses.filter((c: any) => c.isPublished);

      for (const course of publishedCourses) {
        const courseData = course as any;
        // Get store for this course
        const store = await ctx.db
          .query("stores")
          .filter((q) => q.eq(q.field("userId"), courseData.userId))
          .first();

        if (store && courseData.userId) {
          // Check if creator_published event already exists for this store
          const existing = await ctx.db
            .query("analyticsEvents")
            .filter((q) =>
              q.and(
                q.eq(q.field("storeId"), store._id),
                q.eq(q.field("eventType"), "creator_published")
              )
            )
            .first();

          if (!existing) {
            await ctx.db.insert("analyticsEvents", {
              userId: courseData.userId,
              storeId: store._id,
              eventType: "creator_published",
              resourceId: courseData._id,
              resourceType: "course",
              timestamp: courseData.publishedAt || courseData._creationTime,
              metadata: {},
            });
            results.creatorPublished++;
          }
        }
      }

      // Also check digital products
      const products = await ctx.db.query("digitalProducts").take(500);
      const publishedProducts = products.filter((p: any) => p.isPublished);

      for (const product of publishedProducts) {
        const productData = product as any;
        const store = await ctx.db
          .query("stores")
          .filter((q) => q.eq(q.field("userId"), productData.userId))
          .first();

        if (store && productData.userId) {
          // Check if already has a creator_published event
          const existing = await ctx.db
            .query("analyticsEvents")
            .filter((q) =>
              q.and(
                q.eq(q.field("storeId"), store._id),
                q.eq(q.field("eventType"), "creator_published")
              )
            )
            .first();

          if (!existing) {
            await ctx.db.insert("analyticsEvents", {
              userId: productData.userId,
              storeId: store._id,
              eventType: "creator_published",
              resourceId: productData._id,
              resourceType: "digitalProduct",
              timestamp: productData._creationTime,
              metadata: {},
            });
            results.creatorPublished++;
          }
        }
      }
    } catch (e) {
      results.errors.push(`Creator published: ${e}`);
    }

    // 4. Backfill purchase events
    try {
      const purchases = await ctx.db.query("purchases").take(5000);
      for (const purchase of purchases) {
        const purchaseData = purchase as any;
        if (!purchaseData.userId) continue;

        const resourceId = purchaseData.productId || purchaseData.courseId;

        // Check if purchase event already exists
        const existing = await ctx.db
          .query("analyticsEvents")
          .filter((q) =>
            q.and(
              q.eq(q.field("userId"), purchaseData.userId),
              q.eq(q.field("eventType"), "purchase"),
              q.eq(q.field("resourceId"), resourceId)
            )
          )
          .first();

        if (!existing) {
          // Get store from admin user
          let storeId: string | undefined;
          if (purchaseData.adminUserId) {
            const store = await ctx.db
              .query("stores")
              .filter((q) => q.eq(q.field("userId"), purchaseData.adminUserId))
              .first();
            storeId = store?._id;
          }

          await ctx.db.insert("analyticsEvents", {
            userId: purchaseData.userId,
            storeId,
            eventType: "purchase",
            resourceId,
            resourceType: purchaseData.productId ? "digitalProduct" : "course",
            timestamp: purchaseData._creationTime,
            metadata: {
              value: purchaseData.amount || 0,
              currency: "USD",
            },
          });
          results.purchases++;
        }
      }
    } catch (e) {
      results.errors.push(`Purchases: ${e}`);
    }

    // 5. Backfill enrollment events (from enrollments table)
    try {
      const enrollments = await ctx.db.query("enrollments").take(10000);
      for (const enrollment of enrollments) {
        const enrollmentData = enrollment as any;
        if (!enrollmentData.userId) continue;

        // Check if enrollment event already exists
        const existing = await ctx.db
          .query("analyticsEvents")
          .filter((q) =>
            q.and(
              q.eq(q.field("userId"), enrollmentData.userId),
              q.eq(q.field("eventType"), "enrollment"),
              q.eq(q.field("resourceId"), enrollmentData.courseId)
            )
          )
          .first();

        if (!existing) {
          // Get course to find store
          let storeId: string | undefined;
          try {
            const course = await ctx.db.get(enrollmentData.courseId as Id<"courses">);
            if (course) {
              const courseObj = course as any;
              if (courseObj.userId) {
                const store = await ctx.db
                  .query("stores")
                  .filter((q) => q.eq(q.field("userId"), courseObj.userId))
                  .first();
                storeId = store?._id;
              }
            }
          } catch {
            // Course might not exist
          }

          await ctx.db.insert("analyticsEvents", {
            userId: enrollmentData.userId,
            storeId,
            eventType: "enrollment",
            resourceId: enrollmentData.courseId,
            resourceType: "course",
            timestamp: enrollmentData._creationTime,
            metadata: {},
          });
          results.enrollments++;
        }
      }
    } catch (e) {
      results.errors.push(`Enrollments: ${e}`);
    }

    return results;
  },
});

/**
 * Check current analytics events count
 */
export const getEventCounts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db.query("analyticsEvents").take(10000);

    const counts: Record<string, number> = {};
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const twentyEightDaysAgo = now - 28 * 24 * 60 * 60 * 1000;

    let last7d = 0;
    let last28d = 0;

    for (const event of events) {
      counts[event.eventType] = (counts[event.eventType] || 0) + 1;
      if (event.timestamp >= sevenDaysAgo) last7d++;
      if (event.timestamp >= twentyEightDaysAgo) last28d++;
    }

    return {
      total: events.length,
      byType: counts,
      last7d,
      last28d,
    };
  },
});

/**
 * Clear all analytics events (use with caution!)
 */
export const clearAllEvents = internalMutation({
  args: {
    confirm: v.literal("DELETE_ALL_ANALYTICS_EVENTS"),
  },
  handler: async (ctx, { confirm }) => {
    if (confirm !== "DELETE_ALL_ANALYTICS_EVENTS") {
      throw new Error("Must confirm deletion");
    }

    const events = await ctx.db.query("analyticsEvents").take(10000);
    let deleted = 0;

    for (const event of events) {
      await ctx.db.delete(event._id);
      deleted++;
    }

    return { deleted };
  },
});

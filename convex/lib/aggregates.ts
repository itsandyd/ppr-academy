import { TableAggregate } from "@convex-dev/aggregate";
import { components } from "../_generated/api";
import { DataModel } from "../_generated/dataModel";

/**
 * Aggregate instances for efficient analytics calculations.
 * These provide O(log n) count and sum operations instead of O(n) scans.
 */

/**
 * Video analytics aggregate.
 * Tracks total watch time per chapter for efficient video performance queries.
 */
export const videoAnalyticsAggregate = new TableAggregate<{
  Key: string;
  DataModel: DataModel;
  TableName: "videoAnalytics";
}>(components.videoAnalytics, {
  sortKey: (doc) => doc.chapterId ?? "",
  sumValue: (doc) => doc.watchDuration ?? 0,
});

/**
 * Enrollment aggregate.
 * Tracks enrollment counts per course for efficient course popularity queries.
 */
export const enrollmentAggregate = new TableAggregate<{
  Key: string;
  DataModel: DataModel;
  TableName: "enrollments";
}>(components.courseAnalytics, {
  sortKey: (doc) => doc.courseId ?? "",
  sumValue: () => 1, // Each enrollment counts as 1
});

/**
 * Revenue aggregate.
 * Tracks total revenue over time for efficient financial reporting.
 */
export const revenueAggregate = new TableAggregate<{
  Key: number;
  DataModel: DataModel;
  TableName: "purchases";
}>(components.revenueAnalytics, {
  sortKey: (doc) => doc._creationTime,
  sumValue: (doc) => doc.amount ?? 0,
});

/**
 * Usage examples:
 *
 * // Get total watch time for a chapter
 * const totalWatchTime = await videoAnalyticsAggregate.sum(ctx);
 *
 * // Get count of enrollments for a course
 * const enrollmentCount = await enrollmentAggregate.count(ctx, {
 *   bounds: { lower: { key: courseId }, upper: { key: courseId } }
 * });
 *
 * // Get total revenue in a time range
 * const revenue = await revenueAggregate.sum(ctx, {
 *   bounds: { lower: { key: startTime }, upper: { key: endTime } }
 * });
 *
 * IMPORTANT: When inserting/updating/deleting records, you must also update the aggregate:
 *
 * // On insert:
 * const id = await ctx.db.insert("enrollments", data);
 * const doc = await ctx.db.get(id);
 * await enrollmentAggregate.insert(ctx, doc!);
 *
 * // On delete:
 * const oldDoc = await ctx.db.get(id);
 * await ctx.db.delete(id);
 * await enrollmentAggregate.delete(ctx, oldDoc!);
 */

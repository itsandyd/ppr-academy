import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Q&A System Schema
 * 
 * Enables students to ask questions on specific lessons and get answers
 * from instructors and other students.
 */

export const questionsTable = defineTable({
  // Course & Lesson Context
  courseId: v.id("courses"),
  lessonId: v.string(), // Lesson identifier within the course
  chapterIndex: v.optional(v.number()), // For organizing by chapter
  lessonIndex: v.optional(v.number()), // For organizing within chapter
  
  // Question Content
  title: v.string(), // Question title/summary
  content: v.string(), // Full question text (supports markdown)
  
  // Author Info
  authorId: v.string(), // Clerk user ID
  authorName: v.string(), // Cached for display
  authorAvatar: v.optional(v.string()), // Cached avatar URL
  
  // Status & Metadata
  isResolved: v.boolean(), // Has an accepted answer
  acceptedAnswerId: v.optional(v.id("answers")), // ID of the best answer
  viewCount: v.number(), // How many times viewed
  upvotes: v.number(), // Net upvotes
  answerCount: v.number(), // Cached count of answers
  
  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
  lastActivityAt: v.number(), // For sorting by recent activity
})
  .index("by_course", ["courseId", "lastActivityAt"])
  .index("by_lesson", ["courseId", "lessonId", "lastActivityAt"])
  .index("by_author", ["authorId", "createdAt"])
  .index("by_resolved", ["courseId", "isResolved", "lastActivityAt"]);

export const answersTable = defineTable({
  // Question Reference
  questionId: v.id("questions"),
  courseId: v.id("courses"), // Denormalized for easier querying
  
  // Answer Content
  content: v.string(), // Answer text (supports markdown)
  
  // Author Info
  authorId: v.string(), // Clerk user ID
  authorName: v.string(), // Cached for display
  authorAvatar: v.optional(v.string()), // Cached avatar URL
  isInstructor: v.boolean(), // Is this from the course creator?
  
  // Status & Metadata
  isAccepted: v.boolean(), // Marked as best answer by question author
  upvotes: v.number(), // Net upvotes
  
  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_question", ["questionId", "createdAt"])
  .index("by_question_votes", ["questionId", "upvotes"])
  .index("by_author", ["authorId", "createdAt"]);

export const qaVotesTable = defineTable({
  // What's being voted on
  targetType: v.union(v.literal("question"), v.literal("answer")),
  targetId: v.string(), // ID of question or answer
  
  // Who voted
  userId: v.string(), // Clerk user ID
  
  // Vote direction
  voteType: v.union(v.literal("upvote"), v.literal("downvote")),
  
  // Timestamp
  createdAt: v.number(),
})
  .index("by_user_and_target", ["userId", "targetType", "targetId"])
  .index("by_target", ["targetType", "targetId"]);

import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Quizzes & Assessments Schema
 * 
 * Supports multiple question types, automated grading, timed assessments,
 * and retake limits.
 */

// ==================== QUIZZES ====================

export const quizzesTable = defineTable({
  // Quiz Info
  title: v.string(),
  description: v.optional(v.string()),
  courseId: v.id("courses"),
  chapterId: v.optional(v.string()), // Optional: attach to specific chapter
  instructorId: v.string(), // Creator's Clerk ID
  
  // Settings
  quizType: v.union(
    v.literal("practice"), // Practice mode: no time limit, can retake unlimited
    v.literal("assessment"), // Graded assessment
    v.literal("final_exam") // Final exam: strict settings
  ),
  
  // Timing
  timeLimit: v.optional(v.number()), // Minutes (null = no limit)
  
  // Attempts
  maxAttempts: v.optional(v.number()), // null = unlimited
  
  // Passing
  passingScore: v.number(), // 0-100 (percentage)
  requiredToPass: v.boolean(), // Must pass to continue course
  
  // Scoring
  totalPoints: v.number(),
  showCorrectAnswers: v.boolean(), // Show after submission
  showScoreImmediately: v.boolean(),
  
  // Question Settings
  shuffleQuestions: v.boolean(),
  shuffleAnswers: v.boolean(),
  
  // Access
  isPublished: v.boolean(),
  availableFrom: v.optional(v.number()), // Timestamp
  availableUntil: v.optional(v.number()), // Timestamp
  
  // Metadata
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_course", ["courseId", "isPublished"])
  .index("by_instructor", ["instructorId", "createdAt"])
  .index("by_chapter", ["chapterId"]);

// ==================== QUESTIONS ====================

export const questionsTable = defineTable({
  quizId: v.id("quizzes"),
  
  // Question Content
  questionType: v.union(
    v.literal("multiple_choice"),
    v.literal("true_false"),
    v.literal("fill_blank"),
    v.literal("short_answer"),
    v.literal("essay"),
    v.literal("matching")
  ),
  
  questionText: v.string(),
  questionImage: v.optional(v.string()), // Storage URL
  explanation: v.optional(v.string()), // Shown after submission
  
  // Order
  order: v.number(),
  
  // Points
  points: v.number(),
  
  // Answers (structure depends on question type)
  // For multiple choice: array of {text, isCorrect}
  // For fill blank: array of acceptable answers
  // For true/false: {correctAnswer: true/false}
  answers: v.any(), // Flexible JSON structure
  
  // Settings
  caseSensitive: v.optional(v.boolean()), // For fill-in-blank
  partialCredit: v.optional(v.boolean()), // For matching/multi-select
  
  // Metadata
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_quiz", ["quizId", "order"]);

// ==================== QUIZ ATTEMPTS ====================

export const quizAttemptsTable = defineTable({
  quizId: v.id("quizzes"),
  userId: v.string(), // Student's Clerk ID
  courseId: v.id("courses"),
  
  // Attempt Info
  attemptNumber: v.number(), // 1, 2, 3, etc.
  
  // Status
  status: v.union(
    v.literal("in_progress"),
    v.literal("submitted"),
    v.literal("graded"),
    v.literal("expired") // Time limit exceeded
  ),
  
  // Timing
  startedAt: v.number(),
  submittedAt: v.optional(v.number()),
  timeSpent: v.optional(v.number()), // Seconds
  
  // Scoring
  score: v.optional(v.number()), // Points earned
  percentage: v.optional(v.number()), // 0-100
  passed: v.optional(v.boolean()),
  
  // Answers
  answers: v.array(v.object({
    questionId: v.id("questions"),
    answer: v.any(), // Student's answer (varies by question type)
    isCorrect: v.optional(v.boolean()),
    pointsEarned: v.optional(v.number()),
    gradedAt: v.optional(v.number()),
    feedback: v.optional(v.string()), // For essay/short answer
  })),
  
  // Metadata
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_user_and_quiz", ["userId", "quizId", "attemptNumber"])
  .index("by_quiz", ["quizId", "status"])
  .index("by_user", ["userId", "submittedAt"]);

// ==================== QUIZ RESULTS ====================

export const quizResultsTable = defineTable({
  quizId: v.id("quizzes"),
  userId: v.string(),
  courseId: v.id("courses"),
  
  // Best Attempt
  bestAttemptId: v.id("quizAttempts"),
  bestScore: v.number(),
  bestPercentage: v.number(),
  
  // All Attempts Summary
  totalAttempts: v.number(),
  averageScore: v.number(),
  averagePercentage: v.number(),
  
  // Status
  hasPassed: v.boolean(),
  firstPassedAt: v.optional(v.number()),
  
  // Completion
  isCompleted: v.boolean(),
  completedAt: v.optional(v.number()),
  
  // Metadata
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_user", ["userId", "courseId"])
  .index("by_quiz", ["quizId", "hasPassed"])
  .index("by_user_and_quiz", ["userId", "quizId"]);

// ==================== QUESTION BANKS ====================

export const questionBanksTable = defineTable({
  title: v.string(),
  description: v.optional(v.string()),
  instructorId: v.string(),
  courseId: v.optional(v.id("courses")),
  
  // Tags for organization
  tags: v.array(v.string()),
  
  // Questions in this bank
  questionIds: v.array(v.id("questions")),
  
  // Metadata
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_instructor", ["instructorId", "createdAt"])
  .index("by_course", ["courseId"]);





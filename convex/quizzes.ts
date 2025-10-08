import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ==================== QUIZ MANAGEMENT ====================

// Create a quiz
export const createQuiz = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    courseId: v.id("courses"),
    chapterId: v.optional(v.string()),
    instructorId: v.string(),
    quizType: v.union(v.literal("practice"), v.literal("assessment"), v.literal("final_exam")),
    timeLimit: v.optional(v.number()),
    maxAttempts: v.optional(v.number()),
    passingScore: v.number(),
    requiredToPass: v.boolean(),
    showCorrectAnswers: v.boolean(),
    showScoreImmediately: v.boolean(),
    shuffleQuestions: v.boolean(),
    shuffleAnswers: v.boolean(),
  },
  returns: v.object({
    success: v.boolean(),
    quizId: v.optional(v.id("quizzes")),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const quizId = await ctx.db.insert("quizzes", {
        title: args.title,
        description: args.description,
        courseId: args.courseId,
        chapterId: args.chapterId,
        instructorId: args.instructorId,
        quizType: args.quizType,
        timeLimit: args.timeLimit,
        maxAttempts: args.maxAttempts,
        passingScore: args.passingScore,
        requiredToPass: args.requiredToPass,
        totalPoints: 0, // Will be calculated from questions
        showCorrectAnswers: args.showCorrectAnswers,
        showScoreImmediately: args.showScoreImmediately,
        shuffleQuestions: args.shuffleQuestions,
        shuffleAnswers: args.shuffleAnswers,
        isPublished: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      return { success: true, quizId };
    } catch (error: any) {
      console.error("Error creating quiz:", error);
      return { success: false, error: error.message };
    }
  },
});

// Add question to quiz
export const addQuestion = mutation({
  args: {
    quizId: v.id("quizzes"),
    questionType: v.union(
      v.literal("multiple_choice"),
      v.literal("true_false"),
      v.literal("fill_blank"),
      v.literal("short_answer"),
      v.literal("essay"),
      v.literal("matching")
    ),
    questionText: v.string(),
    questionImage: v.optional(v.string()),
    explanation: v.optional(v.string()),
    points: v.number(),
    answers: v.any(),
    caseSensitive: v.optional(v.boolean()),
    partialCredit: v.optional(v.boolean()),
  },
  returns: v.object({
    success: v.boolean(),
    questionId: v.optional(v.id("quizQuestions")),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Get existing questions count for ordering
      const existingQuestions = await ctx.db
        .query("quizQuestions")
        .withIndex("by_quiz", (q) => q.eq("quizId", args.quizId))
        .collect();

      const questionId = await ctx.db.insert("quizQuestions", {
        quizId: args.quizId,
        questionType: args.questionType,
        questionText: args.questionText,
        questionImage: args.questionImage,
        explanation: args.explanation,
        order: existingQuestions.length,
        points: args.points,
        answers: args.answers,
        caseSensitive: args.caseSensitive,
        partialCredit: args.partialCredit,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Update quiz totalPoints
      const quiz = await ctx.db.get(args.quizId);
      if (quiz) {
        await ctx.db.patch(args.quizId, {
          totalPoints: quiz.totalPoints + args.points,
          updatedAt: Date.now(),
        });
      }

      return { success: true, questionId };
    } catch (error: any) {
      console.error("Error adding question:", error);
      return { success: false, error: error.message };
    }
  },
});

// Get quiz with questions
export const getQuizWithQuestions = query({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, args) => {
    const quiz = await ctx.db.get(args.quizId);
    if (!quiz) return null;

    const questions = await ctx.db
      .query("quizQuestions")
      .withIndex("by_quiz", (q) => q.eq("quizId", args.quizId))
      .order("asc")
      .collect();

    return {
      ...quiz,
      questions,
    };
  },
});

// Get quizzes for a course
export const getQuizzesForCourse = query({
  args: {
    courseId: v.id("courses"),
    includeUnpublished: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("quizzes")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId));

    const quizzes = await query.collect();

    if (!args.includeUnpublished) {
      return quizzes.filter(q => q.isPublished);
    }

    return quizzes;
  },
});

// Publish quiz
export const publishQuiz = mutation({
  args: { quizId: v.id("quizzes") },
  returns: v.object({ success: v.boolean(), error: v.optional(v.string()) }),
  handler: async (ctx, args) => {
    try {
      const quiz = await ctx.db.get(args.quizId);
      if (!quiz) {
        return { success: false, error: "Quiz not found" };
      }

      // Check if quiz has questions
      const questions = await ctx.db
        .query("quizQuestions")
        .withIndex("by_quiz", (q) => q.eq("quizId", args.quizId))
        .collect();

      if (questions.length === 0) {
        return { success: false, error: "Cannot publish quiz with no questions" };
      }

      await ctx.db.patch(args.quizId, {
        isPublished: true,
        updatedAt: Date.now(),
      });

      return { success: true };
    } catch (error: any) {
      console.error("Error publishing quiz:", error);
      return { success: false, error: error.message };
    }
  },
});

// ==================== QUIZ TAKING ====================

// Start quiz attempt
export const startQuizAttempt = mutation({
  args: {
    quizId: v.id("quizzes"),
    userId: v.string(),
    courseId: v.id("courses"),
  },
  returns: v.object({
    success: v.boolean(),
    attemptId: v.optional(v.id("quizAttempts")),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const quiz = await ctx.db.get(args.quizId);
      if (!quiz) {
        return { success: false, error: "Quiz not found" };
      }

      if (!quiz.isPublished) {
        return { success: false, error: "Quiz is not published" };
      }

      // Check max attempts
      const previousAttempts = await ctx.db
        .query("quizAttempts")
        .withIndex("by_user_and_quiz", (q) => 
          q.eq("userId", args.userId).eq("quizId", args.quizId)
        )
        .collect();

      if (quiz.maxAttempts && previousAttempts.length >= quiz.maxAttempts) {
        return { success: false, error: "Maximum attempts reached" };
      }

      // Create attempt
      const attemptId = await ctx.db.insert("quizAttempts", {
        quizId: args.quizId,
        userId: args.userId,
        courseId: args.courseId,
        attemptNumber: previousAttempts.length + 1,
        status: "in_progress",
        startedAt: Date.now(),
        answers: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      return { success: true, attemptId };
    } catch (error: any) {
      console.error("Error starting quiz attempt:", error);
      return { success: false, error: error.message };
    }
  },
});

// Submit quiz attempt
export const submitQuizAttempt = mutation({
  args: {
    attemptId: v.id("quizAttempts"),
    answers: v.array(v.object({
      questionId: v.id("quizQuestions"),
      answer: v.any(),
    })),
  },
  returns: v.object({
    success: v.boolean(),
    score: v.optional(v.number()),
    percentage: v.optional(v.number()),
    passed: v.optional(v.boolean()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const attempt = await ctx.db.get(args.attemptId);
      if (!attempt) {
        return { success: false, error: "Attempt not found" };
      }

      if (attempt.status !== "in_progress") {
        return { success: false, error: "Attempt already submitted" };
      }

      const quiz = await ctx.db.get(attempt.quizId);
      if (!quiz) {
        return { success: false, error: "Quiz not found" };
      }

      // Grade the quiz
      const questions = await ctx.db
        .query("quizQuestions")
        .withIndex("by_quiz", (q) => q.eq("quizId", attempt.quizId))
        .collect();

      let totalScore = 0;
      const gradedAnswers = args.answers.map(studentAnswer => {
        const question = questions.find(q => q._id === studentAnswer.questionId);
        if (!question) {
          return {
            questionId: studentAnswer.questionId,
            answer: studentAnswer.answer,
            isCorrect: false,
            pointsEarned: 0,
            gradedAt: Date.now(),
          };
        }

        const { isCorrect, pointsEarned } = gradeAnswer(
          question,
          studentAnswer.answer
        );

        totalScore += pointsEarned;

        return {
          questionId: studentAnswer.questionId,
          answer: studentAnswer.answer,
          isCorrect,
          pointsEarned,
          gradedAt: Date.now(),
        };
      });

      const percentage = (totalScore / quiz.totalPoints) * 100;
      const passed = percentage >= quiz.passingScore;
      const timeSpent = Math.floor((Date.now() - attempt.startedAt) / 1000);

      // Update attempt
      await ctx.db.patch(args.attemptId, {
        status: "graded",
        submittedAt: Date.now(),
        timeSpent,
        score: totalScore,
        percentage,
        passed,
        answers: gradedAnswers,
        updatedAt: Date.now(),
      });

      // Update or create quiz results
      await updateQuizResults(ctx, attempt.userId, attempt.quizId, attempt.courseId);

      return { success: true, score: totalScore, percentage, passed };
    } catch (error: any) {
      console.error("Error submitting quiz:", error);
      return { success: false, error: error.message };
    }
  },
});

// Helper function to grade an answer
function gradeAnswer(question: any, studentAnswer: any): { isCorrect: boolean, pointsEarned: number } {
  switch (question.questionType) {
    case "multiple_choice":
      // answers is array of {text: string, isCorrect: boolean}
      const correctAnswer = question.answers.find((a: any) => a.isCorrect);
      const isCorrect = studentAnswer === correctAnswer?.text;
      return { isCorrect, pointsEarned: isCorrect ? question.points : 0 };

    case "true_false":
      // answers is {correctAnswer: boolean}
      const tfCorrect = studentAnswer === question.answers.correctAnswer;
      return { isCorrect: tfCorrect, pointsEarned: tfCorrect ? question.points : 0 };

    case "fill_blank":
      // answers is array of acceptable answers (strings)
      const normalizedAnswer = question.caseSensitive 
        ? studentAnswer 
        : studentAnswer.toLowerCase();
      const normalizedAcceptable = question.answers.map((a: string) =>
        question.caseSensitive ? a : a.toLowerCase()
      );
      const fbCorrect = normalizedAcceptable.includes(normalizedAnswer);
      return { isCorrect: fbCorrect, pointsEarned: fbCorrect ? question.points : 0 };

    case "short_answer":
    case "essay":
      // These require manual grading
      return { isCorrect: false, pointsEarned: 0 };

    case "matching":
      // answers is array of {left: string, right: string}
      // studentAnswer is array of {left: string, right: string}
      if (!Array.isArray(studentAnswer)) {
        return { isCorrect: false, pointsEarned: 0 };
      }
      let correctMatches = 0;
      studentAnswer.forEach((match: any) => {
        const correct = question.answers.find((a: any) => 
          a.left === match.left && a.right === match.right
        );
        if (correct) correctMatches++;
      });
      const matchPercentage = correctMatches / question.answers.length;
      const matchCorrect = matchPercentage === 1;
      const matchPoints = question.partialCredit 
        ? question.points * matchPercentage 
        : matchCorrect ? question.points : 0;
      return { isCorrect: matchCorrect, pointsEarned: matchPoints };

    default:
      return { isCorrect: false, pointsEarned: 0 };
  }
}

// Helper function to update quiz results
async function updateQuizResults(ctx: any, userId: string, quizId: Id<"quizzes">, courseId: Id<"courses">) {
  // Get all attempts for this quiz
  const attempts = await ctx.db
    .query("quizAttempts")
    .withIndex("by_user_and_quiz", (q: any) => 
      q.eq("userId", userId).eq("quizId", quizId)
    )
    .filter((q: any) => q.eq(q.field("status"), "graded"))
    .collect();

  if (attempts.length === 0) return;

  // Find best attempt
  const bestAttempt = attempts.reduce((best: any, current: any) => 
    (current.percentage || 0) > (best.percentage || 0) ? current : best
  );

  // Calculate averages
  const totalScore = attempts.reduce((sum: number, a: any) => sum + (a.score || 0), 0);
  const totalPercentage = attempts.reduce((sum: number, a: any) => sum + (a.percentage || 0), 0);
  const avgScore = totalScore / attempts.length;
  const avgPercentage = totalPercentage / attempts.length;

  // Check if passed
  const hasPassed = attempts.some((a: any) => a.passed);
  const firstPassedAttempt = attempts.find((a: any) => a.passed);

  // Check for existing results
  const existing = await ctx.db
    .query("quizResults")
    .withIndex("by_user_and_quiz", (q: any) => 
      q.eq("userId", userId).eq("quizId", quizId)
    )
    .unique();

  const resultsData = {
    quizId,
    userId,
    courseId,
    bestAttemptId: bestAttempt._id,
    bestScore: bestAttempt.score || 0,
    bestPercentage: bestAttempt.percentage || 0,
    totalAttempts: attempts.length,
    averageScore: avgScore,
    averagePercentage: avgPercentage,
    hasPassed,
    firstPassedAt: firstPassedAttempt?.submittedAt,
    isCompleted: hasPassed,
    completedAt: firstPassedAttempt?.submittedAt,
    updatedAt: Date.now(),
  };

  if (existing) {
    await ctx.db.patch(existing._id, resultsData);
  } else {
    await ctx.db.insert("quizResults", {
      ...resultsData,
      createdAt: Date.now(),
    });
  }
}

// ==================== QUERIES ====================

// Get user's quiz results
export const getUserQuizResults = query({
  args: {
    userId: v.string(),
    quizId: v.optional(v.id("quizzes")),
    courseId: v.optional(v.id("courses")),
  },
  handler: async (ctx, args) => {
    if (args.quizId) {
      return await ctx.db
        .query("quizResults")
        .withIndex("by_user_and_quiz", (q: any) => 
          q.eq("userId", args.userId).eq("quizId", args.quizId!)
        )
        .unique();
    }

    if (args.courseId) {
      return await ctx.db
        .query("quizResults")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .filter((q) => q.eq(q.field("courseId"), args.courseId))
        .collect();
    }

    return await ctx.db
      .query("quizResults")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Get quiz attempt with details
export const getQuizAttempt = query({
  args: { attemptId: v.id("quizAttempts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.attemptId);
  },
});

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ==================== QUERIES ====================

// Get questions for a specific lesson
export const getQuestionsByLesson = query({
  args: {
    courseId: v.id("courses"),
    lessonId: v.string(),
    sortBy: v.optional(v.union(v.literal("recent"), v.literal("votes"), v.literal("unanswered"))),
  },
  returns: v.array(v.object({
    _id: v.id("questions"),
    _creationTime: v.number(),
    courseId: v.id("courses"),
    lessonId: v.string(),
    chapterIndex: v.optional(v.number()),
    lessonIndex: v.optional(v.number()),
    title: v.string(),
    content: v.string(),
    authorId: v.string(),
    authorName: v.string(),
    authorAvatar: v.optional(v.string()),
    isResolved: v.boolean(),
    acceptedAnswerId: v.optional(v.id("answers")),
    viewCount: v.number(),
    upvotes: v.number(),
    answerCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
    lastActivityAt: v.number(),
  })),
  handler: async (ctx, args) => {
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_lesson", (q) =>
        q.eq("courseId", args.courseId).eq("lessonId", args.lessonId)
      )
      .collect();

    // Sort based on preference
    if (args.sortBy === "votes") {
      questions.sort((a, b) => b.upvotes - a.upvotes);
    } else if (args.sortBy === "unanswered") {
      questions.sort((a, b) => {
        if (a.isResolved === b.isResolved) {
          return b.lastActivityAt - a.lastActivityAt;
        }
        return a.isResolved ? 1 : -1;
      });
    } else {
      // Default: recent activity
      questions.sort((a, b) => b.lastActivityAt - a.lastActivityAt);
    }

    return questions;
  },
});

// Get all questions for a course
export const getQuestionsByCourse = query({
  args: {
    courseId: v.id("courses"),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("questions"),
    _creationTime: v.number(),
    courseId: v.id("courses"),
    lessonId: v.string(),
    chapterIndex: v.optional(v.number()),
    lessonIndex: v.optional(v.number()),
    title: v.string(),
    content: v.string(),
    authorId: v.string(),
    authorName: v.string(),
    authorAvatar: v.optional(v.string()),
    isResolved: v.boolean(),
    acceptedAnswerId: v.optional(v.id("answers")),
    viewCount: v.number(),
    upvotes: v.number(),
    answerCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
    lastActivityAt: v.number(),
  })),
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("questions")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .order("desc");

    if (args.limit) {
      return await query.take(args.limit);
    }

    return await query.collect();
  },
});

// Get a single question with details
export const getQuestion = query({
  args: { questionId: v.id("questions") },
  returns: v.union(
    v.object({
      _id: v.id("questions"),
      _creationTime: v.number(),
      courseId: v.id("courses"),
      lessonId: v.string(),
      chapterIndex: v.optional(v.number()),
      lessonIndex: v.optional(v.number()),
      title: v.string(),
      content: v.string(),
      authorId: v.string(),
      authorName: v.string(),
      authorAvatar: v.optional(v.string()),
      isResolved: v.boolean(),
      acceptedAnswerId: v.optional(v.id("answers")),
      viewCount: v.number(),
      upvotes: v.number(),
      answerCount: v.number(),
      createdAt: v.number(),
      updatedAt: v.number(),
      lastActivityAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.questionId);
  },
});

// Get answers for a question
export const getAnswersByQuestion = query({
  args: { questionId: v.id("questions") },
  returns: v.array(v.object({
    _id: v.id("answers"),
    _creationTime: v.number(),
    questionId: v.id("questions"),
    courseId: v.id("courses"),
    content: v.string(),
    authorId: v.string(),
    authorName: v.string(),
    authorAvatar: v.optional(v.string()),
    isInstructor: v.boolean(),
    isAccepted: v.boolean(),
    upvotes: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })),
  handler: async (ctx, args) => {
    const answers = await ctx.db
      .query("answers")
      .withIndex("by_question", (q) => q.eq("questionId", args.questionId))
      .collect();

    // Sort: accepted first, then by votes, then by date
    answers.sort((a, b) => {
      if (a.isAccepted !== b.isAccepted) {
        return a.isAccepted ? -1 : 1;
      }
      if (a.upvotes !== b.upvotes) {
        return b.upvotes - a.upvotes;
      }
      return a.createdAt - b.createdAt;
    });

    return answers;
  },
});

// Get user's vote on a question or answer
export const getUserVote = query({
  args: {
    userId: v.string(),
    targetType: v.union(v.literal("question"), v.literal("answer")),
    targetId: v.string(),
  },
  returns: v.union(
    v.object({
      voteType: v.union(v.literal("upvote"), v.literal("downvote")),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const vote = await ctx.db
      .query("qaVotes")
      .withIndex("by_user_and_target", (q) =>
        q
          .eq("userId", args.userId)
          .eq("targetType", args.targetType)
          .eq("targetId", args.targetId)
      )
      .unique();

    if (!vote) return null;

    return { voteType: vote.voteType };
  },
});

// ==================== MUTATIONS ====================

// Ask a new question
export const askQuestion = mutation({
  args: {
    courseId: v.id("courses"),
    lessonId: v.string(),
    chapterIndex: v.optional(v.number()),
    lessonIndex: v.optional(v.number()),
    title: v.string(),
    content: v.string(),
    authorId: v.string(),
    authorName: v.string(),
    authorAvatar: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    questionId: v.optional(v.id("questions")),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const now = Date.now();

      const questionId = await ctx.db.insert("questions", {
        courseId: args.courseId,
        lessonId: args.lessonId,
        chapterIndex: args.chapterIndex,
        lessonIndex: args.lessonIndex,
        title: args.title,
        content: args.content,
        authorId: args.authorId,
        authorName: args.authorName,
        authorAvatar: args.authorAvatar,
        isResolved: false,
        viewCount: 0,
        upvotes: 0,
        answerCount: 0,
        createdAt: now,
        updatedAt: now,
        lastActivityAt: now,
      });

      return { success: true, questionId };
    } catch (error: any) {
      console.error("Error creating question:", error);
      return { success: false, error: error.message };
    }
  },
});

// Post an answer
export const postAnswer = mutation({
  args: {
    questionId: v.id("questions"),
    courseId: v.id("courses"),
    content: v.string(),
    authorId: v.string(),
    authorName: v.string(),
    authorAvatar: v.optional(v.string()),
    isInstructor: v.boolean(),
  },
  returns: v.object({
    success: v.boolean(),
    answerId: v.optional(v.id("answers")),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const now = Date.now();

      // Create the answer
      const answerId = await ctx.db.insert("answers", {
        questionId: args.questionId,
        courseId: args.courseId,
        content: args.content,
        authorId: args.authorId,
        authorName: args.authorName,
        authorAvatar: args.authorAvatar,
        isInstructor: args.isInstructor,
        isAccepted: false,
        upvotes: 0,
        createdAt: now,
        updatedAt: now,
      });

      // Update question's answer count and last activity
      const question = await ctx.db.get(args.questionId);
      if (question) {
        await ctx.db.patch(args.questionId, {
          answerCount: question.answerCount + 1,
          lastActivityAt: now,
        });
      }

      return { success: true, answerId };
    } catch (error: any) {
      console.error("Error posting answer:", error);
      return { success: false, error: error.message };
    }
  },
});

// Vote on a question or answer
export const vote = mutation({
  args: {
    userId: v.string(),
    targetType: v.union(v.literal("question"), v.literal("answer")),
    targetId: v.string(),
    voteType: v.union(v.literal("upvote"), v.literal("downvote")),
  },
  returns: v.object({
    success: v.boolean(),
    newVoteCount: v.optional(v.number()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Check for existing vote
      const existingVote = await ctx.db
        .query("qaVotes")
        .withIndex("by_user_and_target", (q) =>
          q
            .eq("userId", args.userId)
            .eq("targetType", args.targetType)
            .eq("targetId", args.targetId)
        )
        .unique();

      let voteDelta = 0;

      if (existingVote) {
        if (existingVote.voteType === args.voteType) {
          // Remove vote (toggle off)
          await ctx.db.delete(existingVote._id);
          voteDelta = args.voteType === "upvote" ? -1 : 1;
        } else {
          // Change vote
          await ctx.db.patch(existingVote._id, {
            voteType: args.voteType,
          });
          voteDelta = args.voteType === "upvote" ? 2 : -2;
        }
      } else {
        // New vote
        await ctx.db.insert("qaVotes", {
          userId: args.userId,
          targetType: args.targetType,
          targetId: args.targetId,
          voteType: args.voteType,
          createdAt: Date.now(),
        });
        voteDelta = args.voteType === "upvote" ? 1 : -1;
      }

      // Update vote count on target
      let newVoteCount = 0;
      if (args.targetType === "question") {
        const question = await ctx.db.get(args.targetId as Id<"questions">);
        if (question) {
          newVoteCount = question.upvotes + voteDelta;
          await ctx.db.patch(args.targetId as Id<"questions">, {
            upvotes: newVoteCount,
          });
        }
      } else {
        const answer = await ctx.db.get(args.targetId as Id<"answers">);
        if (answer) {
          newVoteCount = answer.upvotes + voteDelta;
          await ctx.db.patch(args.targetId as Id<"answers">, {
            upvotes: newVoteCount,
          });
        }
      }

      return { success: true, newVoteCount };
    } catch (error: any) {
      console.error("Error voting:", error);
      return { success: false, error: error.message };
    }
  },
});

// Mark answer as accepted (best answer)
export const acceptAnswer = mutation({
  args: {
    questionId: v.id("questions"),
    answerId: v.id("answers"),
    userId: v.string(), // Must be question author
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const question = await ctx.db.get(args.questionId);
      if (!question) {
        return { success: false, error: "Question not found" };
      }

      // Verify user is the question author
      if (question.authorId !== args.userId) {
        return { success: false, error: "Only the question author can accept answers" };
      }

      // If there was a previously accepted answer, unmark it
      if (question.acceptedAnswerId) {
        await ctx.db.patch(question.acceptedAnswerId, {
          isAccepted: false,
        });
      }

      // Mark new answer as accepted
      await ctx.db.patch(args.answerId, {
        isAccepted: true,
      });

      // Update question
      await ctx.db.patch(args.questionId, {
        acceptedAnswerId: args.answerId,
        isResolved: true,
        updatedAt: Date.now(),
      });

      return { success: true };
    } catch (error: any) {
      console.error("Error accepting answer:", error);
      return { success: false, error: error.message };
    }
  },
});

// Increment view count
export const incrementViewCount = mutation({
  args: { questionId: v.id("questions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const question = await ctx.db.get(args.questionId);
    if (question) {
      await ctx.db.patch(args.questionId, {
        viewCount: question.viewCount + 1,
      });
    }
    return null;
  },
});

// Delete a question (author or instructor only)
export const deleteQuestion = mutation({
  args: {
    questionId: v.id("questions"),
    userId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const question = await ctx.db.get(args.questionId);
      if (!question) {
        return { success: false, error: "Question not found" };
      }

      // TODO: Add instructor check
      if (question.authorId !== args.userId) {
        return { success: false, error: "Unauthorized" };
      }

      // Delete all answers
      const answers = await ctx.db
        .query("answers")
        .withIndex("by_question", (q) => q.eq("questionId", args.questionId))
        .collect();

      for (const answer of answers) {
        await ctx.db.delete(answer._id);
      }

      // Delete all votes
      const votes = await ctx.db
        .query("qaVotes")
        .withIndex("by_target", (q) =>
          q.eq("targetType", "question").eq("targetId", args.questionId)
        )
        .collect();

      for (const vote of votes) {
        await ctx.db.delete(vote._id);
      }

      // Delete question
      await ctx.db.delete(args.questionId);

      return { success: true };
    } catch (error: any) {
      console.error("Error deleting question:", error);
      return { success: false, error: error.message };
    }
  },
});

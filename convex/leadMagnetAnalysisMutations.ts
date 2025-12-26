import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// ============================================================================
// VALIDATORS (matching the schema)
// ============================================================================

const visualIdeaValidator = v.object({
  sentenceOrConcept: v.string(),
  visualDescription: v.string(),
  illustrationPrompt: v.string(),
  importance: v.union(
    v.literal("critical"),
    v.literal("helpful"),
    v.literal("optional")
  ),
  category: v.union(
    v.literal("concept_diagram"),
    v.literal("process_flow"),
    v.literal("comparison"),
    v.literal("equipment_setup"),
    v.literal("waveform_visual"),
    v.literal("ui_screenshot"),
    v.literal("metaphor"),
    v.literal("example")
  ),
  leadMagnetPotential: v.number(),
  estimatedPosition: v.number(),
  embedding: v.optional(v.array(v.number())),
  embeddingText: v.optional(v.string()),
});

const chapterAnalysisValidator = v.object({
  chapterId: v.string(),
  chapterTitle: v.string(),
  lessonId: v.optional(v.string()),
  lessonTitle: v.optional(v.string()),
  moduleTitle: v.optional(v.string()),
  wordCount: v.optional(v.number()),
  overallLeadMagnetScore: v.number(),
  keyTopics: v.array(v.string()),
  leadMagnetSuggestions: v.array(v.string()),
  visualIdeas: v.array(visualIdeaValidator),
});

const bundleIdeaValidator = v.object({
  name: v.string(),
  description: v.string(),
  chapterIds: v.array(v.string()),
  estimatedVisuals: v.number(),
});

const analysisResultValidator = v.object({
  courseId: v.string(),
  courseTitle: v.string(),
  totalChapters: v.number(),
  analyzedChapters: v.optional(v.number()),
  totalVisualIdeas: v.number(),
  avgLeadMagnetScore: v.number(),
  overallLeadMagnetScore: v.optional(v.number()),
  chapters: v.array(chapterAnalysisValidator),
  topLeadMagnetCandidates: v.optional(v.array(v.object({
    chapterId: v.string(),
    chapterTitle: v.string(),
    score: v.number(),
    reason: v.string(),
  }))),
  bundleIdeas: v.optional(v.array(bundleIdeaValidator)),
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Save a lead magnet analysis to the database
 */
export const saveAnalysis = mutation({
  args: {
    userId: v.string(),
    courseId: v.id("courses"),
    courseTitle: v.string(),
    name: v.string(),
    analysisResult: analysisResultValidator,
  },
  returns: v.id("leadMagnetAnalyses"),
  handler: async (ctx, args) => {
    const { analysisResult, ...rest } = args;
    
    return await ctx.db.insert("leadMagnetAnalyses", {
      ...rest,
      totalChapters: analysisResult.totalChapters,
      totalVisualIdeas: analysisResult.totalVisualIdeas,
      avgLeadMagnetScore: analysisResult.avgLeadMagnetScore,
      chapters: analysisResult.chapters,
      bundleIdeas: analysisResult.bundleIdeas,
      createdAt: Date.now(),
    });
  },
});

/**
 * Update an existing analysis name
 */
export const updateAnalysisName = mutation({
  args: {
    analysisId: v.id("leadMagnetAnalyses"),
    name: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.analysisId, {
      name: args.name,
      updatedAt: Date.now(),
    });
    return null;
  },
});

/**
 * Delete an analysis
 */
export const deleteAnalysis = mutation({
  args: {
    analysisId: v.id("leadMagnetAnalyses"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.analysisId);
    return null;
  },
});

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get all analyses for a user, ordered by creation date (newest first)
 */
export const getUserAnalyses = query({
  args: {
    userId: v.string(),
  },
  returns: v.array(v.object({
    _id: v.id("leadMagnetAnalyses"),
    _creationTime: v.number(),
    userId: v.string(),
    courseId: v.id("courses"),
    courseTitle: v.string(),
    name: v.string(),
    totalChapters: v.number(),
    totalVisualIdeas: v.number(),
    avgLeadMagnetScore: v.number(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })),
  handler: async (ctx, args) => {
    const analyses = await ctx.db
      .query("leadMagnetAnalyses")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
    
    // Return summary without full chapter data for list view
    return analyses.map(a => ({
      _id: a._id,
      _creationTime: a._creationTime,
      userId: a.userId,
      courseId: a.courseId,
      courseTitle: a.courseTitle,
      name: a.name,
      totalChapters: a.totalChapters,
      totalVisualIdeas: a.totalVisualIdeas,
      avgLeadMagnetScore: a.avgLeadMagnetScore,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    }));
  },
});

/**
 * Get analyses for a specific course
 */
export const getCourseAnalyses = query({
  args: {
    userId: v.string(),
    courseId: v.id("courses"),
  },
  returns: v.array(v.object({
    _id: v.id("leadMagnetAnalyses"),
    _creationTime: v.number(),
    name: v.string(),
    totalChapters: v.number(),
    totalVisualIdeas: v.number(),
    avgLeadMagnetScore: v.number(),
    createdAt: v.number(),
  })),
  handler: async (ctx, args) => {
    const analyses = await ctx.db
      .query("leadMagnetAnalyses")
      .withIndex("by_userId_and_courseId", (q) => 
        q.eq("userId", args.userId).eq("courseId", args.courseId)
      )
      .order("desc")
      .collect();
    
    return analyses.map(a => ({
      _id: a._id,
      _creationTime: a._creationTime,
      name: a.name,
      totalChapters: a.totalChapters,
      totalVisualIdeas: a.totalVisualIdeas,
      avgLeadMagnetScore: a.avgLeadMagnetScore,
      createdAt: a.createdAt,
    }));
  },
});

/**
 * Get a single analysis with full data
 */
export const getAnalysis = query({
  args: {
    analysisId: v.id("leadMagnetAnalyses"),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("leadMagnetAnalyses"),
      _creationTime: v.number(),
      userId: v.string(),
      courseId: v.id("courses"),
      courseTitle: v.string(),
      name: v.string(),
      totalChapters: v.number(),
      totalVisualIdeas: v.number(),
      avgLeadMagnetScore: v.number(),
      chapters: v.array(chapterAnalysisValidator),
      bundleIdeas: v.optional(v.array(bundleIdeaValidator)),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    const analysis = await ctx.db.get(args.analysisId);
    if (!analysis) return null;
    
    return {
      _id: analysis._id,
      _creationTime: analysis._creationTime,
      userId: analysis.userId,
      courseId: analysis.courseId,
      courseTitle: analysis.courseTitle,
      name: analysis.name,
      totalChapters: analysis.totalChapters,
      totalVisualIdeas: analysis.totalVisualIdeas,
      avgLeadMagnetScore: analysis.avgLeadMagnetScore,
      chapters: analysis.chapters,
      bundleIdeas: analysis.bundleIdeas,
      createdAt: analysis.createdAt,
      updatedAt: analysis.updatedAt,
    };
  },
});


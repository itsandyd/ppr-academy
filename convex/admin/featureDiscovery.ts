/**
 * Feature Discovery - Scan courses to identify potential product features
 * 
 * This analyzes course content (titles, descriptions, chapter content) and compares
 * against existing platform features to identify gaps and opportunities.
 * 
 * The "meta-flywheel": Your teaching content becomes the roadmap for platform development.
 * - Course about email marketing → suggests email automation features
 * - Course about lead magnets → suggests landing page builder
 * - Course about funnels → suggests checkout optimization features
 */

import { v } from "convex/values";
import { action, mutation, query, internalMutation, internalQuery } from "../_generated/server";
import { PPR_ACADEMY_FEATURES } from "../masterAI/platformKnowledge";
import { callLLM } from "../masterAI/llmClient";
import { Id } from "../_generated/dataModel";

// Type-escape hatch to avoid deep type inference issues with Convex API types
// Using require to bypass TypeScript's eager type evaluation
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const { internal } = require("../_generated/api") as { internal: any };

// Current platform capabilities (for comparison)
const EXISTING_CAPABILITIES = PPR_ACADEMY_FEATURES.map(f => ({
  name: f.name,
  keywords: f.keywords,
  description: f.description,
}));

// Feature suggestion categories
export const FEATURE_CATEGORIES = [
  { id: "marketing", name: "Marketing & Funnels", icon: "📈" },
  { id: "automation", name: "Automation & AI", icon: "🤖" },
  { id: "content", name: "Content Creation", icon: "✍️" },
  { id: "monetization", name: "Monetization", icon: "💰" },
  { id: "engagement", name: "User Engagement", icon: "🎯" },
  { id: "analytics", name: "Analytics & Insights", icon: "📊" },
  { id: "social", name: "Social & Community", icon: "👥" },
  { id: "audio", name: "Audio & Production", icon: "🎵" },
  { id: "workflow", name: "Workflow & Tools", icon: "⚙️" },
  { id: "other", name: "Other", icon: "📦" },
] as const;

export type FeatureCategory = typeof FEATURE_CATEGORIES[number]["id"];

export interface FeatureSuggestion {
  name: string;
  description: string;
  category: FeatureCategory;
  sourceCourse: string;
  sourceChapters: string[];
  priority: "high" | "medium" | "low";
  reasoning: string;
  existsPartially?: string;
  implementationHint?: string;
  cursorPrompt?: string; // Pre-built prompt for Cursor
}

// =============================================================================
// QUERIES
// =============================================================================

// Get all courses with FULL chapter content for deep analysis
export const getCoursesForAnalysis = query({
  args: {},
  returns: v.array(v.object({
    courseId: v.id("courses"),
    title: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    chapters: v.array(v.object({
      title: v.string(),
      content: v.optional(v.string()), // Full chapter content!
    })),
    totalContentLength: v.number(),
  })),
  handler: async (ctx) => {
    const courses = await ctx.db.query("courses").collect();
    
    const coursesWithContent = await Promise.all(
      courses.map(async (course) => {
        // Get chapters directly for this course (they have courseId field)
        const chapters = await ctx.db.query("courseChapters")
          .withIndex("by_courseId", q => q.eq("courseId", course._id))
          .collect();
        
        // Calculate total content length
        const totalContentLength = chapters.reduce((acc, ch) => 
          acc + (ch.description?.length || 0), 0
        );
        
        return {
          courseId: course._id,
          title: course.title || "Untitled",
          description: course.description,
          category: course.category,
          chapters: chapters.map(ch => ({
            title: ch.title || "Untitled Chapter",
            content: ch.description, // This is where content is stored
          })),
          totalContentLength,
        };
      })
    );
    
    // Sort by content length (richest courses first)
    return coursesWithContent.sort((a, b) => b.totalContentLength - a.totalContentLength);
  },
});

// Get saved feature suggestions
export const getSavedSuggestions = query({
  args: {
    status: v.optional(v.union(
      v.literal("new"),
      v.literal("reviewing"),
      v.literal("planned"),
      v.literal("building"),
      v.literal("completed"),
      v.literal("rejected")
    )),
    category: v.optional(v.string()),
  },
  returns: v.array(v.object({
    _id: v.id("suggestedFeatures"),
    _creationTime: v.number(),
    name: v.string(),
    description: v.string(),
    category: v.string(),
    sourceCourses: v.array(v.string()),
    sourceChapters: v.array(v.string()),
    priority: v.string(),
    reasoning: v.string(),
    existsPartially: v.optional(v.string()),
    implementationHint: v.optional(v.string()),
    cursorPrompt: v.optional(v.string()),
    status: v.string(),
    notes: v.optional(v.string()),
    linkedTaskUrl: v.optional(v.string()),
    analysisRunId: v.optional(v.string()),
    updatedAt: v.number(),
  })),
  handler: async (ctx, args) => {
    let query = ctx.db.query("suggestedFeatures");
    
    if (args.status) {
      query = query.filter(q => q.eq(q.field("status"), args.status));
    }
    
    const suggestions = await query.order("desc").collect();
    
    if (args.category) {
      return suggestions.filter(s => s.category === args.category);
    }
    
    return suggestions;
  },
});

// Get feature stats
export const getFeatureStats = query({
  args: {},
  returns: v.object({
    totalSuggestions: v.number(),
    byStatus: v.object({
      new: v.number(),
      reviewing: v.number(),
      planned: v.number(),
      building: v.number(),
      completed: v.number(),
      rejected: v.number(),
    }),
    byCategory: v.array(v.object({
      category: v.string(),
      count: v.number(),
    })),
    lastAnalysisAt: v.optional(v.number()),
  }),
  handler: async (ctx) => {
    const suggestions = await ctx.db.query("suggestedFeatures").collect();
    
    const byStatus = {
      new: suggestions.filter(s => s.status === "new").length,
      reviewing: suggestions.filter(s => s.status === "reviewing").length,
      planned: suggestions.filter(s => s.status === "planned").length,
      building: suggestions.filter(s => s.status === "building").length,
      completed: suggestions.filter(s => s.status === "completed").length,
      rejected: suggestions.filter(s => s.status === "rejected").length,
    };
    
    const categoryMap = new Map<string, number>();
    for (const s of suggestions) {
      categoryMap.set(s.category, (categoryMap.get(s.category) || 0) + 1);
    }
    
    const byCategory = Array.from(categoryMap.entries()).map(([category, count]) => ({
      category,
      count,
    })).sort((a, b) => b.count - a.count);
    
    // Get last analysis timestamp
    const lastAnalysis = suggestions.length > 0 
      ? Math.max(...suggestions.map(s => s._creationTime))
      : undefined;
    
    return {
      totalSuggestions: suggestions.length,
      byStatus,
      byCategory,
      lastAnalysisAt: lastAnalysis,
    };
  },
});

// Quick keyword-based feature gap detection (no AI, instant)
export const quickFeatureGapScan = query({
  args: {},
  returns: v.object({
    featureOpportunities: v.array(v.object({
      featureName: v.string(),
      featureDescription: v.string(),
      category: v.string(),
      keywordsFound: v.array(v.string()),
      foundIn: v.array(v.string()),
      hasExistingFeature: v.boolean(),
      existingFeatureName: v.optional(v.string()),
    })),
    courseStats: v.object({
      totalCourses: v.number(),
      totalChapters: v.number(),
      totalContentChars: v.number(),
    }),
    courseTopics: v.array(v.string()),
  }),
  handler: async (ctx) => {
    const courses = await ctx.db.query("courses").collect();
    const chapters = await ctx.db.query("courseChapters").take(1000);
    
    // Extract all text to scan
    const allText = [
      ...courses.map(c => `${c.title} ${c.description || ""}`),
      ...chapters.map(ch => `${ch.title} ${ch.description || ""}`),
    ].join(" ").toLowerCase();
    
    const totalContentChars = allText.length;
    
    // Feature opportunities mapped to keywords
    const featureOpportunityMap: Array<{
      featureName: string;
      featureDescription: string;
      category: string;
      keywords: string[];
    }> = [
      // Marketing & Funnels
      {
        featureName: "Lead Magnet Builder",
        featureDescription: "Visual builder for creating lead magnets with opt-in forms and automatic delivery",
        category: "marketing",
        keywords: ["lead magnet", "opt-in", "squeeze page", "free download"],
      },
      {
        featureName: "Landing Page Builder",
        featureDescription: "Drag-and-drop landing page creator for products and campaigns",
        category: "marketing",
        keywords: ["landing page", "sales page", "checkout page"],
      },
      {
        featureName: "Order Bump & Upsell System",
        featureDescription: "One-click upsells, downsells, and order bumps at checkout",
        category: "monetization",
        keywords: ["upsell", "downsell", "order bump", "bump offer", "tripwire"],
      },
      {
        featureName: "Sales Funnel Builder",
        featureDescription: "Multi-step funnel builder with conversion tracking",
        category: "marketing",
        keywords: ["funnel", "sales funnel", "conversion funnel"],
      },
      
      // Email & Automation
      {
        featureName: "Email Sequence Builder",
        featureDescription: "Visual email sequence/drip campaign builder with triggers",
        category: "automation",
        keywords: ["sequence", "drip campaign", "auto-responder", "email automation"],
      },
      {
        featureName: "Workflow Automation",
        featureDescription: "If-this-then-that style automation for customer actions",
        category: "automation",
        keywords: ["automation", "automate", "workflow", "trigger", "zapier"],
      },
      
      // Live & Events
      {
        featureName: "Webinar Platform",
        featureDescription: "Host live and evergreen webinars with registration and replay",
        category: "engagement",
        keywords: ["webinar", "evergreen webinar", "replay", "live class", "masterclass"],
      },
      {
        featureName: "Live Streaming",
        featureDescription: "Built-in live streaming for courses and events",
        category: "content",
        keywords: ["live stream", "go live", "streaming"],
      },
      
      // Growth & Monetization
      {
        featureName: "Affiliate Program Manager",
        featureDescription: "Manage affiliates, track commissions, and automate payouts",
        category: "monetization",
        keywords: ["affiliate", "referral program", "ambassador", "commission", "partner program"],
      },
      {
        featureName: "Membership Tiers",
        featureDescription: "Create subscription tiers with different access levels",
        category: "monetization",
        keywords: ["membership", "subscription", "recurring", "member area", "members only"],
      },
      {
        featureName: "Community Forum",
        featureDescription: "Built-in community forums for student discussions",
        category: "social",
        keywords: ["community", "forum", "discussion"],
      },
      
      // Scheduling & Booking
      {
        featureName: "Booking Calendar",
        featureDescription: "Let students book coaching calls directly from your calendar",
        category: "workflow",
        keywords: ["calendar", "booking", "scheduling", "appointment", "book a call"],
      },
      
      // Engagement & Gamification
      {
        featureName: "Quizzes & Assessments",
        featureDescription: "Create quizzes to test student knowledge and engagement",
        category: "engagement",
        keywords: ["quiz", "assessment", "survey", "poll", "test"],
      },
      {
        featureName: "Gamification System",
        featureDescription: "Points, badges, and leaderboards to motivate students",
        category: "engagement",
        keywords: ["gamification", "points", "badges", "leaderboard", "achievements"],
      },
      
      // Payments
      {
        featureName: "Payment Plans",
        featureDescription: "Offer payment plans and installments for expensive courses",
        category: "monetization",
        keywords: ["payment plan", "installments", "pay in", "split payments"],
      },
      {
        featureName: "Coupon & Promo System",
        featureDescription: "Create discount codes and promotional campaigns",
        category: "monetization",
        keywords: ["coupon", "discount code", "promo code", "discount"],
      },
      {
        featureName: "Product Bundles",
        featureDescription: "Bundle multiple products/courses together at a discount",
        category: "monetization",
        keywords: ["bundle", "package deal", "bundle deal"],
      },
      
      // Launch
      {
        featureName: "Waitlist & Pre-Launch",
        featureDescription: "Collect emails for upcoming launches with countdown timers",
        category: "marketing",
        keywords: ["waitlist", "pre-launch", "launch sequence", "coming soon"],
      },
      {
        featureName: "Countdown & Scarcity",
        featureDescription: "Add urgency with countdown timers and limited spots",
        category: "marketing",
        keywords: ["countdown timer", "scarcity", "deadline", "cart close", "limited"],
      },
      
      // Communication
      {
        featureName: "SMS Marketing",
        featureDescription: "Send SMS notifications and marketing messages",
        category: "automation",
        keywords: ["sms", "text message", "whatsapp"],
      },
      {
        featureName: "Push Notifications",
        featureDescription: "Browser and mobile push notifications for engagement",
        category: "automation",
        keywords: ["push notification", "browser notification", "mobile notification"],
      },
      
      // Content
      {
        featureName: "Podcast Hosting",
        featureDescription: "Host and distribute podcasts alongside courses",
        category: "content",
        keywords: ["podcast", "audio course", "audiobook"],
      },
      {
        featureName: "Resource Library",
        featureDescription: "Organized library of downloadable resources and templates",
        category: "content",
        keywords: ["resource library", "template", "swipe file", "checklist", "pdf guide"],
      },
      
      // Analytics
      {
        featureName: "A/B Testing",
        featureDescription: "Split test sales pages and checkout flows",
        category: "analytics",
        keywords: ["split test", "a/b test", "ab test"],
      },
      {
        featureName: "Conversion Tracking",
        featureDescription: "Track conversions with pixels and retargeting support",
        category: "analytics",
        keywords: ["pixel", "tracking", "retargeting", "conversion rate"],
      },
    ];
    
    const featureOpportunities: Array<{
      featureName: string;
      featureDescription: string;
      category: string;
      keywordsFound: string[];
      foundIn: string[];
      hasExistingFeature: boolean;
      existingFeatureName?: string;
    }> = [];
    
    for (const opportunity of featureOpportunityMap) {
      const keywordsFound: string[] = [];
      const foundIn: Set<string> = new Set();
      
      for (const keyword of opportunity.keywords) {
        if (allText.includes(keyword.toLowerCase())) {
          keywordsFound.push(keyword);
          
          // Find sources
          for (const course of courses) {
            if (`${course.title} ${course.description || ""}`.toLowerCase().includes(keyword.toLowerCase())) {
              foundIn.add(course.title);
            }
          }
          for (const chapter of chapters) {
            if (`${chapter.title} ${chapter.description || ""}`.toLowerCase().includes(keyword.toLowerCase())) {
              // Get course title for this chapter
              const course = courses.find(c => c._id === chapter.courseId);
              if (course) foundIn.add(course.title);
            }
          }
        }
      }
      
      if (keywordsFound.length > 0) {
        // Check if we have an existing feature for this
        const existingFeature = EXISTING_CAPABILITIES.find(f => 
          f.name.toLowerCase().includes(opportunity.featureName.toLowerCase().split(' ')[0]) ||
          opportunity.keywords.some(k => f.keywords.some(fk => fk.includes(k) || k.includes(fk)))
        );
        
        featureOpportunities.push({
          featureName: opportunity.featureName,
          featureDescription: opportunity.featureDescription,
          category: opportunity.category,
          keywordsFound,
          foundIn: Array.from(foundIn),
          hasExistingFeature: !!existingFeature,
          existingFeatureName: existingFeature?.name,
        });
      }
    }
    
    // Sort by number of keywords found (most relevant first)
    featureOpportunities.sort((a, b) => b.keywordsFound.length - a.keywordsFound.length);
    
    // Extract unique course topics
    const courseTopics = courses.map(c => c.category).filter(Boolean) as string[];
    const uniqueTopics = [...new Set(courseTopics)];
    
    return {
      featureOpportunities: featureOpportunities.filter(f => !f.hasExistingFeature),
      courseStats: {
        totalCourses: courses.length,
        totalChapters: chapters.length,
        totalContentChars: totalContentChars,
      },
      courseTopics: uniqueTopics,
    };
  },
});

// =============================================================================
// MUTATIONS
// =============================================================================

// Save a feature suggestion
export const saveSuggestion = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    category: v.string(),
    sourceCourses: v.array(v.string()),
    sourceChapters: v.array(v.string()),
    priority: v.string(),
    reasoning: v.string(),
    existsPartially: v.optional(v.string()),
    implementationHint: v.optional(v.string()),
    cursorPrompt: v.optional(v.string()),
    analysisRunId: v.optional(v.string()),
  },
  returns: v.id("suggestedFeatures"),
  handler: async (ctx, args) => {
    // Check for duplicates by name
    const existing = await ctx.db.query("suggestedFeatures")
      .filter(q => q.eq(q.field("name"), args.name))
      .first();
    
    if (existing) {
      // Update existing instead of creating duplicate
      await ctx.db.patch(existing._id, {
        ...args,
        status: existing.status, // Keep existing status
        updatedAt: Date.now(),
      });
      return existing._id;
    }
    
    return await ctx.db.insert("suggestedFeatures", {
      ...args,
      status: "new",
      updatedAt: Date.now(),
    });
  },
});

// Bulk save suggestions from AI analysis (internal - called by action)
export const bulkSaveSuggestions = internalMutation({
  args: {
    suggestions: v.array(v.object({
      name: v.string(),
      description: v.string(),
      category: v.string(),
      sourceCourses: v.array(v.string()),
      sourceChapters: v.array(v.string()),
      priority: v.string(),
      reasoning: v.string(),
      existsPartially: v.optional(v.string()),
      implementationHint: v.optional(v.string()),
      cursorPrompt: v.optional(v.string()),
    })),
    analysisRunId: v.string(),
  },
  returns: v.object({
    saved: v.number(),
    updated: v.number(),
  }),
  handler: async (ctx, args) => {
    let saved = 0;
    let updated = 0;
    
    for (const suggestion of args.suggestions) {
      // Check for existing by name
      const existing = await ctx.db.query("suggestedFeatures")
        .filter(q => q.eq(q.field("name"), suggestion.name))
        .first();
      
      if (existing) {
        await ctx.db.patch(existing._id, {
          ...suggestion,
          status: existing.status, // Keep existing status
          analysisRunId: args.analysisRunId,
          updatedAt: Date.now(),
        });
        updated++;
      } else {
        await ctx.db.insert("suggestedFeatures", {
          ...suggestion,
          status: "new",
          analysisRunId: args.analysisRunId,
          updatedAt: Date.now(),
        });
        saved++;
      }
    }
    
    return { saved, updated };
  },
});

// Update suggestion status
export const updateSuggestionStatus = mutation({
  args: {
    suggestionId: v.id("suggestedFeatures"),
    status: v.union(
      v.literal("new"),
      v.literal("reviewing"),
      v.literal("planned"),
      v.literal("building"),
      v.literal("completed"),
      v.literal("rejected")
    ),
    notes: v.optional(v.string()),
    linkedTaskUrl: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.suggestionId, {
      status: args.status,
      notes: args.notes,
      linkedTaskUrl: args.linkedTaskUrl,
      updatedAt: Date.now(),
    });
    return null;
  },
});

// Delete a suggestion
export const deleteSuggestion = mutation({
  args: {
    suggestionId: v.id("suggestedFeatures"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.suggestionId);
    return null;
  },
});

// =============================================================================
// AI ANALYSIS ACTION
// =============================================================================

// AI-powered deep feature extraction from course content
export const analyzeCoursesForFeatures = action({
  args: {
    courseData: v.array(v.object({
      courseId: v.string(),
      title: v.string(),
      description: v.optional(v.string()),
      category: v.optional(v.string()),
      chapters: v.array(v.object({
        title: v.string(),
        content: v.optional(v.string()),
      })),
    })),
    saveResults: v.optional(v.boolean()),
  },
  returns: v.object({
    suggestions: v.array(v.object({
      name: v.string(),
      description: v.string(),
      category: v.string(),
      sourceCourse: v.string(),
      sourceChapters: v.array(v.string()),
      priority: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
      reasoning: v.string(),
      existsPartially: v.optional(v.string()),
      implementationHint: v.optional(v.string()),
      cursorPrompt: v.optional(v.string()),
    })),
    tokensUsed: v.optional(v.number()),
    analysisRunId: v.string(),
  }),
  handler: async (ctx, args) => {
    const analysisRunId = `analysis_${Date.now()}`;
    
    console.log(`🔍 Starting feature analysis for ${args.courseData.length} courses...`);
    
    // Log course details
    for (const course of args.courseData) {
      const totalContent = course.chapters.reduce((acc, ch) => acc + (ch.content?.length || 0), 0);
      console.log(`  📚 "${course.title}" - ${course.chapters.length} chapters, ${totalContent} chars of content`);
    }
    
    // Check if we have any courses to analyze
    if (args.courseData.length === 0) {
      console.log("⚠️ No courses provided for analysis");
      return {
        suggestions: [],
        tokensUsed: undefined,
        analysisRunId,
      };
    }
    
    // Build existing features context
    const existingFeaturesContext = EXISTING_CAPABILITIES.map(f => 
      `- ${f.name}: ${f.description}`
    ).join("\n");
    
    const categoryList = FEATURE_CATEGORIES.map(c => `${c.id} (${c.name})`).join(", ");
    
    const systemPrompt = `You are a product discovery AI. Your job is to analyze educational course content and identify 5-10 software features that should be built.

CRITICAL: Return a JSON ARRAY with EXACTLY 5-10 different feature suggestions. Not 1, not 2 - at least 5!

EXISTING FEATURES (already built, do NOT suggest):
${existingFeaturesContext}

CATEGORIES to use: ${categoryList}

ANALYSIS STRATEGY:
1. Scan each course title and description
2. Look at chapter names for specific topics being taught  
3. For EACH major concept taught, suggest a feature that would help users DO that thing
4. Think broadly: marketing tools, automation, content creation, analytics, engagement

FEATURE IDEA TRIGGERS:
- "lead magnet" / "opt-in" → Lead Magnet Builder
- "email sequence" / "nurture" → Email Automation Builder
- "upsell" / "order bump" → One-Click Upsell System
- "funnel" / "sales page" → Funnel/Page Builder
- "webinar" / "live" → Webinar Hosting
- "payment plan" / "installments" → Payment Plan System
- "affiliate" / "referral" → Affiliate Dashboard
- "quiz" / "assessment" → Quiz Builder
- "community" / "forum" → Community Features
- "analytics" / "tracking" → Advanced Analytics
- "automation" / "workflow" → Automation Builder
- "template" / "swipe file" → Template Library
- Music production concepts → Audio tools, MIDI tools, visualization tools

OUTPUT FORMAT - Return a JSON array (NOT an object):
[
  {
    "name": "Feature Name",
    "description": "What it does (2-3 sentences)",
    "category": "one of: ${FEATURE_CATEGORIES.map(c => c.id).join(", ")}",
    "sourceCourse": "Course title where identified",
    "sourceChapters": ["Relevant chapter names"],
    "priority": "high|medium|low",
    "reasoning": "Why this would be valuable",
    "implementationHint": "Technical approach in 1-2 sentences",
    "cursorPrompt": "A detailed prompt (3-5 sentences) that could be pasted into Cursor AI to start building this feature"
  },
  { ... },
  { ... },
  { ... },
  { ... }
]

REQUIREMENTS:
- Return EXACTLY a JSON array starting with [ and ending with ]
- Include AT LEAST 5 suggestions, preferably 7-10
- Each suggestion must have all fields filled in
- Be specific: "Landing Page Builder" not "Marketing Tools"
- cursorPrompt should be detailed enough to actually start building`;

    // Build course content for analysis - include full chapter content
    const courseContent = args.courseData.map(c => {
      const chapterContent = c.chapters.map(ch => {
        const content = ch.content ? `\n      Content: ${ch.content.slice(0, 1000)}${ch.content.length > 1000 ? '...' : ''}` : '';
        return `    - ${ch.title}${content}`;
      }).join("\n");
      
      return `
COURSE: ${c.title}
Category: ${c.category || "N/A"}
Description: ${c.description || "N/A"}

Chapters:
${chapterContent || "  (no chapters yet)"}`;
    }).join("\n\n" + "=".repeat(50) + "\n\n");

    const userPrompt = `Analyze these courses and identify potential software features to build into PPR Academy:

${courseContent}

Return a JSON array of feature suggestions. Focus on gaps - concepts taught in courses that don't exist as platform features yet.

Be thorough - analyze the chapter content, not just titles. Each suggestion should include a detailed cursorPrompt that could be pasted into Cursor to start building.`;

    console.log(`📝 Prepared prompt with ${courseContent.length} chars of course content`);

    try {
      console.log("🤖 Calling Gemini 2.5 Pro (1M context) for analysis...");
      // Use Gemini 2.5 Pro via OpenRouter for 1M context window
      const response = await callLLM({
        model: "gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8, // Higher for more creative/diverse suggestions
        maxTokens: 8000, // Enough for 5-10 detailed suggestions
        responseFormat: "json",
      });

      console.log(`✅ Received response from GPT-4o (${response.tokensUsed?.total || 'unknown'} tokens)`);
      console.log(`📄 FULL RAW RESPONSE:\n${response.content}`);

      // Parse response
      let suggestions: FeatureSuggestion[] = [];
      try {
        const cleaned = response.content
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/\s*```$/i, "")
          .trim();
        console.log(`📄 Cleaned response (${cleaned.length} chars): ${cleaned.slice(0, 200)}...`);
        
        const parsed = JSON.parse(cleaned);
        console.log(`📄 Parsed type: ${typeof parsed}, isArray: ${Array.isArray(parsed)}`);
        
        // Handle various response formats
        if (Array.isArray(parsed)) {
          suggestions = parsed;
          console.log(`✅ Response is array with ${suggestions.length} items`);
        } else if (parsed && typeof parsed === 'object') {
          console.log(`📄 Response is object with keys: ${Object.keys(parsed).join(", ")}`);
          
          // Check if it's a single suggestion object (has 'name' and 'description')
          if (parsed.name && parsed.description) {
            console.log(`✅ Response is a single suggestion object, wrapping in array`);
            suggestions = [parsed];
          } 
          // GPT might return { suggestions: [...] } or { features: [...] }
          else if (parsed.suggestions || parsed.features || parsed.data || parsed.results) {
            suggestions = parsed.suggestions || parsed.features || parsed.data || parsed.results || [];
          }
          
          if (!Array.isArray(suggestions)) {
            console.log("❌ Couldn't find array, trying first array property");
            // Try to find any array property
            for (const key of Object.keys(parsed)) {
              if (Array.isArray(parsed[key])) {
                suggestions = parsed[key];
                console.log(`✅ Found array in property "${key}" with ${suggestions.length} items`);
                break;
              }
            }
          }
        }
        
        console.log(`✅ Final parsed suggestions count: ${suggestions.length}`);
        if (suggestions.length > 0) {
          console.log(`📋 First suggestion:`, JSON.stringify(suggestions[0], null, 2));
        } else {
          console.log(`⚠️ No suggestions parsed! Raw content was: ${response.content.slice(0, 500)}`);
        }
      } catch (e) {
        console.error("❌ Failed to parse feature suggestions:", e);
        console.error("📄 Raw response:\n", response.content);
        throw new Error(`Failed to parse AI response: ${e instanceof Error ? e.message : String(e)}`);
      }

      // Validate and normalize suggestions - be more lenient
      console.log(`🔍 Validating ${suggestions.length} suggestions...`);
      const validSuggestions = suggestions
        .filter(s => {
          // Be more lenient - only require name and description
          const isValid = s && s.name && s.description;
          if (!isValid) {
            console.log(`  ❌ Invalid suggestion:`, JSON.stringify(s).slice(0, 100));
          }
          return isValid;
        })
        .map(s => {
          // Use type assertion for lenient parsing of LLM responses
          const suggestion = s as any;
          return {
            name: String(suggestion.name || "Unnamed Feature"),
            description: String(suggestion.description || "No description"),
            category: FEATURE_CATEGORIES.some(c => c.id === suggestion.category) ? suggestion.category : "other",
            sourceCourse: String(suggestion.sourceCourse || suggestion.source || "Unknown Course"),
            sourceChapters: Array.isArray(suggestion.sourceChapters) ? suggestion.sourceChapters : (suggestion.chapters ? [suggestion.chapters] : []),
            priority: (["high", "medium", "low"].includes(suggestion.priority) ? suggestion.priority : "medium") as "high" | "medium" | "low",
            reasoning: String(suggestion.reasoning || suggestion.reason || suggestion.rationale || "Identified from course content"),
            existsPartially: suggestion.existsPartially || suggestion.existing || undefined,
            implementationHint: suggestion.implementationHint || suggestion.hint || suggestion.implementation || undefined,
            cursorPrompt: suggestion.cursorPrompt || suggestion.prompt || undefined,
          };
        });

      // Optionally save to database
      if (args.saveResults && validSuggestions.length > 0) {
        await ctx.runMutation(internal.admin.featureDiscovery.bulkSaveSuggestions, {
          suggestions: validSuggestions.map(s => ({
            name: s.name,
            description: s.description,
            category: s.category,
            sourceChapters: s.sourceChapters,
            sourceCourses: [s.sourceCourse], // Convert singular to array
            priority: s.priority,
            reasoning: s.reasoning,
            existsPartially: s.existsPartially,
            implementationHint: s.implementationHint,
            cursorPrompt: s.cursorPrompt,
          })),
          analysisRunId,
        });
      }

      console.log(`✅ Feature analysis complete: ${validSuggestions.length} suggestions found`);
      
      return {
        suggestions: validSuggestions,
        tokensUsed: response.tokensUsed?.total,
        analysisRunId,
      };
    } catch (error) {
      console.error("❌ Error analyzing courses:", error);
      // Re-throw so the client sees the error
      throw new Error(`Feature analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

// Generate a Cursor-ready prompt for a specific suggestion
export const generateCursorPrompt = action({
  args: {
    suggestionId: v.id("suggestedFeatures"),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const suggestion = await (ctx as any).runQuery(
      internal.admin.featureDiscovery.getSuggestionByIdInternal, 
      { suggestionId: args.suggestionId }
    );
    
    if (!suggestion) {
      throw new Error("Suggestion not found");
    }
    
    // If we already have a cursor prompt, return it
    if (suggestion.cursorPrompt) {
      return suggestion.cursorPrompt;
    }
    
    // Generate a new one
    const prompt = `# Feature Request: ${suggestion.name}

## Description
${suggestion.description}

## Context
This feature was identified from analyzing course content in: ${suggestion.sourceCourses.join(", ")}
${suggestion.sourceChapters.length > 0 ? `\nRelevant chapters: ${suggestion.sourceChapters.join(", ")}` : ""}

## Why This Matters
${suggestion.reasoning}

${suggestion.existsPartially ? `## Related Existing Feature\n${suggestion.existsPartially} - consider how this integrates or extends it.\n` : ""}

## Implementation Notes
${suggestion.implementationHint || "No specific implementation hints provided."}

## Tasks
Please implement this feature following these steps:
1. Create the necessary database schema (if needed)
2. Create Convex functions (queries, mutations, actions)
3. Build the UI components
4. Add to the appropriate dashboard/page
5. Test the functionality

## Requirements
- Follow existing code patterns in the codebase
- Use shadcn/ui components
- Store data in Convex
- Ensure mobile responsiveness
- Add proper error handling`;

    return prompt;
  },
});

// Get a single suggestion by ID (public)
export const getSuggestionById = query({
  args: {
    suggestionId: v.id("suggestedFeatures"),
  },
  returns: v.union(
    v.object({
      _id: v.id("suggestedFeatures"),
      _creationTime: v.number(),
      name: v.string(),
      description: v.string(),
      category: v.string(),
      sourceCourses: v.array(v.string()),
      sourceChapters: v.array(v.string()),
      priority: v.string(),
      reasoning: v.string(),
      existsPartially: v.optional(v.string()),
      implementationHint: v.optional(v.string()),
      cursorPrompt: v.optional(v.string()),
      status: v.string(),
      notes: v.optional(v.string()),
      linkedTaskUrl: v.optional(v.string()),
      analysisRunId: v.optional(v.string()),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.suggestionId);
  },
});

// Get a single suggestion by ID (internal - for actions)
export const getSuggestionByIdInternal = internalQuery({
  args: {
    suggestionId: v.id("suggestedFeatures"),
  },
  returns: v.union(
    v.object({
      _id: v.id("suggestedFeatures"),
      _creationTime: v.number(),
      name: v.string(),
      description: v.string(),
      category: v.string(),
      sourceCourses: v.array(v.string()),
      sourceChapters: v.array(v.string()),
      priority: v.string(),
      reasoning: v.string(),
      existsPartially: v.optional(v.string()),
      implementationHint: v.optional(v.string()),
      cursorPrompt: v.optional(v.string()),
      status: v.string(),
      notes: v.optional(v.string()),
      linkedTaskUrl: v.optional(v.string()),
      analysisRunId: v.optional(v.string()),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.suggestionId);
  },
});

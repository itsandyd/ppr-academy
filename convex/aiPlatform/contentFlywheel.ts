/**
 * AI Platform Content Flywheel
 * 
 * This system creates a self-improving loop where:
 * 1. Users create content (courses, notes, products, etc.)
 * 2. Content is automatically indexed and analyzed
 * 3. AI learns from high-performing content
 * 4. AI generates suggestions for new content
 * 5. Platform auto-generates features based on content gaps
 * 
 * The goal: A platform that improves itself from user activity.
 */

import { v } from "convex/values";
import { query, mutation, internalMutation, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";

// ============================================================================
// CONTENT INTELLIGENCE - Track all user-generated content
// ============================================================================

export interface ContentSignal {
  contentType: "course" | "lesson" | "note" | "product" | "sample_pack" | "preset" | "project_file";
  contentId: string;
  title: string;
  topics: string[];
  quality: number; // 0-1 based on engagement signals
  createdAt: number;
}

// Get all indexable content from the platform
export const getAllPlatformContent = internalQuery({
  args: {},
  returns: v.object({
    courses: v.array(v.object({
      id: v.string(),
      title: v.string(),
      description: v.optional(v.string()),
      category: v.optional(v.string()),
      lessonCount: v.number(),
      enrollmentCount: v.number(),
      isPublished: v.boolean(),
    })),
    lessons: v.array(v.object({
      id: v.string(),
      courseId: v.string(),
      title: v.string(),
      content: v.optional(v.string()),
      hasVideo: v.boolean(),
    })),
    products: v.array(v.object({
      id: v.string(),
      title: v.string(),
      description: v.optional(v.string()),
      type: v.string(),
      purchaseCount: v.number(),
    })),
    notes: v.array(v.object({
      id: v.string(),
      title: v.optional(v.string()),
      content: v.string(),
      lessonId: v.optional(v.string()),
    })),
    totalContent: v.number(),
  }),
  handler: async (ctx) => {
    // Courses (limit to 50)
    const courses = await ctx.db.query("courses").take(50);
    const courseData = await Promise.all(courses.map(async (c) => {
      // Count lessons
      const courseLessons = await ctx.db.query("lessons")
        .filter(q => q.eq(q.field("courseId"), c._id))
        .take(100);
      
      // Count enrollments
      const courseEnrollments = await ctx.db.query("enrollments")
        .filter(q => q.eq(q.field("courseId"), c._id))
        .take(100);
      
      return {
        id: c._id,
        title: c.title || "Untitled",
        description: c.description,
        category: c.category,
        lessonCount: courseLessons.length,
        enrollmentCount: courseEnrollments.length,
        isPublished: c.isPublished || false,
      };
    }));

    // Lessons (limit to 200, don't include full content to save bytes)
    const lessons = await ctx.db.query("lessons").take(200);
    const lessonData = lessons.map(l => ({
      id: l._id,
      courseId: l.courseId as string,
      title: l.title || "Untitled",
      content: l.content ? l.content.substring(0, 100) : undefined, // Truncate content
      hasVideo: !!(l.videoUrl || l.videoStorageId),
    }));

    // Products (limit to 100)
    const products = await ctx.db.query("products").take(100);
    const productData = products.map(p => ({
      id: p._id,
      title: p.title || "Untitled",
      description: p.description ? p.description.substring(0, 200) : undefined, // Truncate
      type: p.type || "digital",
      purchaseCount: 0,
    }));

    // Notes (limit to 50, truncate content)
    const notes = await ctx.db.query("notes").take(50);
    const noteData = notes.map(n => ({
      id: n._id,
      title: n.title,
      content: (n.content || "").substring(0, 100), // Truncate
      lessonId: n.lessonId as string | undefined,
    }));

    return {
      courses: courseData,
      lessons: lessonData,
      products: productData,
      notes: noteData,
      totalContent: courseData.length + lessonData.length + productData.length + noteData.length,
    };
  },
});

// ============================================================================
// QUALITY SIGNALS - Track what content performs well
// ============================================================================

export const getContentQualitySignals = internalQuery({
  args: {},
  returns: v.object({
    topCourses: v.array(v.object({
      id: v.string(),
      title: v.string(),
      score: v.number(),
      signals: v.object({
        enrollments: v.number(),
        completionRate: v.number(),
        lessonCount: v.number(),
      }),
    })),
    topLessons: v.array(v.object({
      id: v.string(),
      title: v.string(),
      score: v.number(),
      signals: v.object({
        completions: v.number(),
        notesTaken: v.number(),
      }),
    })),
    contentTrends: v.array(v.object({
      topic: v.string(),
      momentum: v.string(),
      contentCount: v.number(),
    })),
  }),
  handler: async (ctx) => {
    // Get only recent courses to limit data (limit to 20 courses)
    const courses = await ctx.db.query("courses")
      .order("desc")
      .take(20);
    
    const courseScores = await Promise.all(courses.map(async (c) => {
      // Get enrollments
      const enrollments = await ctx.db.query("enrollments")
        .filter(q => q.eq(q.field("courseId"), c._id))
        .take(100);
      const completedCount = enrollments.filter(e => e.completedAt).length;
      
      // Get lessons
      const courseLessons = await ctx.db.query("lessons")
        .filter(q => q.eq(q.field("courseId"), c._id))
        .take(50);
      
      // Calculate quality score (0-1)
      const enrollmentScore = Math.min(enrollments.length / 100, 1);
      const lessonScore = Math.min(courseLessons.length / 20, 1);
      const completionRate = enrollments.length > 0 ? completedCount / enrollments.length : 0;
      
      const score = (enrollmentScore * 0.4) + (lessonScore * 0.2) + (completionRate * 0.4);
      
      return {
        id: c._id,
        title: c.title || "Untitled",
        score,
        signals: {
          enrollments: enrollments.length,
          completionRate,
          lessonCount: courseLessons.length,
        },
      };
    }));

    // Get only 20 recent lessons for scoring
    const lessons = await ctx.db.query("lessons")
      .order("desc")
      .take(20);
    
    const lessonScores = await Promise.all(lessons.map(async (l) => {
      // Get progress entries
      const progressEntries = await ctx.db.query("lessonProgress")
        .filter(q => q.eq(q.field("lessonId"), l._id))
        .take(50);
      const completions = progressEntries.filter(p => p.completed).length;
      
      // Get notes
      const lessonNotes = await ctx.db.query("notes")
        .filter(q => q.eq(q.field("lessonId"), l._id))
        .take(20);
      
      const score = Math.min((completions / 50) + (lessonNotes.length / 10), 1);
      
      return {
        id: l._id,
        title: l.title || "Untitled",
        score,
        signals: {
          completions,
          notesTaken: lessonNotes.length,
        },
      };
    }));

    // Extract content trends by category
    const categoryCount: Record<string, number> = {};
    for (const course of courses) {
      const cat = course.category || "uncategorized";
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    }

    const trends = Object.entries(categoryCount)
      .map(([topic, count]) => ({
        topic,
        momentum: count > 3 ? "growing" : count > 1 ? "stable" : "emerging",
        contentCount: count,
      }))
      .sort((a, b) => b.contentCount - a.contentCount);

    return {
      topCourses: courseScores
        .sort((a, b) => b.score - a.score)
        .slice(0, 10),
      topLessons: lessonScores
        .sort((a, b) => b.score - a.score)
        .slice(0, 10),
      contentTrends: trends,
    };
  },
});

// ============================================================================
// CONTENT GAP ANALYSIS - What should we create next?
// ============================================================================

export const analyzeContentGaps = query({
  args: {},
  returns: v.object({
    missingTopics: v.array(v.object({
      topic: v.string(),
      reason: v.string(),
      suggestedContentType: v.string(),
      priority: v.string(),
    })),
    lowCoverageAreas: v.array(v.object({
      area: v.string(),
      currentCount: v.number(),
      recommendedCount: v.number(),
    })),
    opportunityScore: v.number(),
  }),
  handler: async (ctx) => {
    // Limit queries to avoid reading too much data
    const courses = await ctx.db.query("courses").take(100);
    const products = await ctx.db.query("products").take(200);
    
    // Expected topics for a music production platform
    const expectedTopics = [
      { topic: "Sound Design", category: "skills", minCourses: 2, minProducts: 5 },
      { topic: "Mixing", category: "skills", minCourses: 2, minProducts: 3 },
      { topic: "Mastering", category: "skills", minCourses: 1, minProducts: 2 },
      { topic: "Music Theory", category: "fundamentals", minCourses: 2, minProducts: 0 },
      { topic: "Synthesis", category: "skills", minCourses: 1, minProducts: 10 },
      { topic: "Sampling", category: "skills", minCourses: 1, minProducts: 10 },
      { topic: "Arrangement", category: "skills", minCourses: 1, minProducts: 0 },
      { topic: "Marketing", category: "business", minCourses: 2, minProducts: 0 },
      { topic: "Ableton Live", category: "daws", minCourses: 2, minProducts: 5 },
      { topic: "FL Studio", category: "daws", minCourses: 2, minProducts: 5 },
      { topic: "Logic Pro", category: "daws", minCourses: 1, minProducts: 3 },
    ];

    const missingTopics: Array<{
      topic: string;
      reason: string;
      suggestedContentType: string;
      priority: string;
    }> = [];

    const lowCoverageAreas: Array<{
      area: string;
      currentCount: number;
      recommendedCount: number;
    }> = [];

    for (const expected of expectedTopics) {
      // Check courses
      const matchingCourses = courses.filter(c => 
        c.title?.toLowerCase().includes(expected.topic.toLowerCase()) ||
        c.category?.toLowerCase() === expected.category
      );
      
      // Check products
      const matchingProducts = products.filter(p =>
        p.title?.toLowerCase().includes(expected.topic.toLowerCase())
      );

      if (matchingCourses.length < expected.minCourses) {
        missingTopics.push({
          topic: expected.topic,
          reason: `Only ${matchingCourses.length}/${expected.minCourses} courses`,
          suggestedContentType: "course",
          priority: expected.minCourses - matchingCourses.length > 1 ? "high" : "medium",
        });
      }

      if (expected.minProducts > 0 && matchingProducts.length < expected.minProducts) {
        lowCoverageAreas.push({
          area: `${expected.topic} Products`,
          currentCount: matchingProducts.length,
          recommendedCount: expected.minProducts,
        });
      }
    }

    // Calculate opportunity score (0-100)
    const gapCount = missingTopics.length + lowCoverageAreas.length;
    const maxGaps = expectedTopics.length * 2;
    const opportunityScore = Math.round((gapCount / maxGaps) * 100);

    return {
      missingTopics: missingTopics.sort((a, b) => 
        a.priority === "high" ? -1 : b.priority === "high" ? 1 : 0
      ),
      lowCoverageAreas: lowCoverageAreas.sort((a, b) => 
        (b.recommendedCount - b.currentCount) - (a.recommendedCount - a.currentCount)
      ),
      opportunityScore,
    };
  },
});

// ============================================================================
// FLYWHEEL STATS - Platform self-improvement metrics
// ============================================================================

export const getFlywheelStats = query({
  args: {},
  returns: v.object({
    contentCreated: v.object({
      total: v.number(),
      thisMonth: v.number(),
      growth: v.string(),
    }),
    aiGenerated: v.object({
      total: v.number(),
      accuracy: v.number(),
    }),
    knowledgeBase: v.object({
      embeddingsCount: v.number(),
      topicsIndexed: v.number(),
    }),
    flyWheelHealth: v.string(),
  }),
  handler: async (ctx) => {
    const now = Date.now();
    const monthAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    // Use .take() which returns an array directly
    // Count courses (small table, can get all)
    const courses = await ctx.db.query("courses").take(100);
    const courseCount = courses.length;
    const recentCourses = courses.filter(c => c._creationTime > monthAgo).length;
    
    // Count lessons (limit to 500)
    const lessons = await ctx.db.query("lessons").take(500);
    const lessonCount = lessons.length;
    const recentLessons = lessons.filter(l => l._creationTime > monthAgo).length;
    
    // Count products (limit to 200)
    const products = await ctx.db.query("products").take(200);
    const productCount = products.length;
    const recentProducts = products.filter(p => p._creationTime > monthAgo).length;
    
    // Count notes (limit to 200)
    const notes = await ctx.db.query("notes").take(200);
    const noteCount = notes.length;
    
    const totalContent = courseCount + lessonCount + productCount + noteCount;
    const thisMonth = recentCourses + recentLessons + recentProducts;
    
    // Count embeddings (limit to 1000)
    const embeddings = await ctx.db.query("embeddings").take(1000);
    const embeddingsCount = embeddings.length;
    const topicsSet = new Set(embeddings.map(e => e.category).filter(Boolean));
    
    // Count AI conversations (limit to 200)
    const conversations = await ctx.db.query("aiConversations").take(200);
    const conversationCount = conversations.length;
    
    // Determine flywheel health
    let health = "starting";
    if (totalContent > 50 && embeddingsCount > 100) health = "warming";
    if (totalContent > 100 && embeddingsCount > 500 && thisMonth > 10) health = "spinning";
    if (totalContent > 200 && embeddingsCount > 1000 && thisMonth > 20) health = "accelerating";
    
    return {
      contentCreated: {
        total: totalContent,
        thisMonth,
        growth: thisMonth > 10 ? "🚀 Strong" : thisMonth > 5 ? "📈 Growing" : "🌱 Starting",
      },
      aiGenerated: {
        total: conversationCount,
        accuracy: 0.85, // Placeholder - would need feedback system
      },
      knowledgeBase: {
        embeddingsCount,
        topicsIndexed: topicsSet.size,
      },
      flyWheelHealth: health,
    };
  },
});

// ============================================================================
// AUTO-SUGGESTIONS - What to create next based on all signals
// ============================================================================

// Context extraction helpers - expanded for actual lesson content
const SYNTHS = [
  "serum", "massive", "vital", "phase plant", "pigments", "omnisphere", "sylenth", 
  "diva", "analog lab", "spire", "avenger", "kontakt", "reaktor", "fm8", "absynth",
  "synth1", "surge", "tyrell", "dexed", "helm", "wavetable", "granular"
];
const DAWS = [
  "ableton", "fl studio", "logic", "pro tools", "cubase", "bitwig", "studio one",
  "reaper", "garageband", "reason", "live 11", "live 12", "fruity loops"
];
const GENRES = [
  "house", "techno", "dubstep", "trap", "hip hop", "dnb", "drum and bass", 
  "ambient", "edm", "pop", "r&b", "lo-fi", "future bass", "progressive", 
  "trance", "bass music", "garage", "uk garage", "breakbeat", "jungle",
  "hardstyle", "psytrance", "melodic techno", "deep house", "tech house",
  "minimal", "industrial", "synthwave", "vaporwave", "phonk", "drill"
];
const SAMPLE_TYPES = [
  "drums", "kicks", "snares", "hi-hats", "loops", "one-shots", "vocals", 
  "fx", "risers", "impacts", "bass", "synth", "foley", "texture", "atmosphere",
  "808", "clap", "percussion", "tom", "cymbal", "shaker", "tambourine"
];
const TECHNIQUES = [
  "sidechain", "compression", "eq", "reverb", "delay", "distortion", "saturation",
  "layering", "sound design", "synthesis", "sampling", "chopping", "pitch shift",
  "automation", "modulation", "lfo", "envelope", "filter", "oscillator", "wavetable",
  "granular", "fm synthesis", "subtractive", "additive", "resampling", "vocoder"
];

function extractContextFromText(text: string): {
  synths: string[];
  daws: string[];
  genres: string[];
  sampleTypes: string[];
  techniques: string[];
} {
  const lower = text.toLowerCase();
  return {
    synths: SYNTHS.filter(s => lower.includes(s)),
    daws: DAWS.filter(d => lower.includes(d)),
    genres: GENRES.filter(g => lower.includes(g)),
    sampleTypes: SAMPLE_TYPES.filter(t => lower.includes(t)),
    techniques: TECHNIQUES.filter(t => lower.includes(t)),
  };
}

export const getAutoSuggestions = query({
  args: {},
  returns: v.array(v.object({
    type: v.string(),
    title: v.string(),
    description: v.string(),
    basedOn: v.string(),
    confidence: v.number(),
    specs: v.optional(v.object({
      genre: v.optional(v.string()),
      synth: v.optional(v.string()),
      daw: v.optional(v.string()),
      sampleCount: v.optional(v.string()),
      presetCount: v.optional(v.string()),
      details: v.optional(v.array(v.string())),
    })),
    actionUrl: v.optional(v.string()),
  })),
  handler: async (ctx) => {
    const suggestions: Array<{
      type: string;
      title: string;
      description: string;
      basedOn: string;
      confidence: number;
      specs?: {
        genre?: string;
        synth?: string;
        daw?: string;
        sampleCount?: string;
        presetCount?: string;
        details?: string[];
      };
      actionUrl?: string;
    }> = [];

    // Get courses with their content for context extraction
    const courses = await ctx.db.query("courses").take(20);
    const lessons = await ctx.db.query("lessons").take(50); // Reduced to allow for content
    
    // Build combined text for context extraction
    // Include ACTUAL lesson content, not just titles
    const allText = [
      // Course titles and descriptions
      ...courses.map(c => `${c.title || ""} ${c.description || ""}`),
      // Lesson titles, descriptions, AND content (truncated to save memory)
      ...lessons.map(l => {
        const content = l.content || "";
        // Take first 500 chars of content to get the meat without blowing up memory
        const truncatedContent = content.length > 500 ? content.substring(0, 500) : content;
        return `${l.title || ""} ${l.description || ""} ${truncatedContent}`;
      }),
    ].join(" ");
    
    const context = extractContextFromText(allText);
    
    console.log(`📊 Flywheel context extracted from ${courses.length} courses, ${lessons.length} lessons`);
    console.log(`   Found: ${context.synths.join(", ") || "no synths"}, ${context.genres.join(", ") || "no genres"}, ${context.daws.join(", ") || "no DAWs"}`);
    
    // Get existing products to avoid duplicates
    const products = await ctx.db.query("products").take(100);
    const productTitles = products.map(p => (p.title || "").toLowerCase());
    const productTypes = new Set(products.map(p => p.type));
    
    // ========================================================================
    // SAMPLE PACK SUGGESTIONS - Specific based on course content
    // ========================================================================
    if (!productTypes.has("sample_pack") || products.filter(p => p.type === "sample_pack").length < 3) {
      // If we found genres in courses, suggest genre-specific packs
      if (context.genres.length > 0) {
        const topGenre = context.genres[0];
        const genreFormatted = topGenre.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
        
        suggestions.push({
          type: "sample_pack",
          title: `${genreFormatted} Drum Kit`,
          description: `Complete drum sample pack for ${genreFormatted} production with kicks, snares, hi-hats, and percussion`,
          basedOn: `Your courses mention "${topGenre}" - create matching products`,
          confidence: 0.92,
          specs: {
            genre: genreFormatted,
            sampleCount: "150-250 samples",
            details: [
              "30-50 kicks (punchy, subby, layered)",
              "30-50 snares/claps",
              "40-60 hi-hats (closed, open, rides)",
              "30-50 percussion loops",
              "20-30 FX (risers, impacts, sweeps)",
            ],
          },
        });
      }
      
      // If we found DAWs, suggest DAW-specific template packs
      if (context.daws.length > 0) {
        const topDaw = context.daws[0];
        const dawFormatted = topDaw === "fl studio" ? "FL Studio" : 
                            topDaw === "ableton" ? "Ableton Live" :
                            topDaw.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
        
        suggestions.push({
          type: "sample_pack",
          title: `${dawFormatted} Producer Starter Pack`,
          description: `Essential samples organized for ${dawFormatted} workflow with tempo-synced loops and one-shots`,
          basedOn: `Your courses teach ${dawFormatted} - bundle samples for your students`,
          confidence: 0.88,
          specs: {
            daw: dawFormatted,
            sampleCount: "200+ samples",
            details: [
              "All samples labeled with BPM and key",
              "Loops pre-sliced for DAW import",
              "Organized folder structure",
              "Bonus: 5 starter project templates",
            ],
          },
        });
      }
    }

    // ========================================================================
    // PRESET PACK SUGGESTIONS - Specific synths and styles
    // ========================================================================
    if (!productTypes.has("preset") || products.filter(p => p.type === "preset").length < 3) {
      if (context.synths.length > 0) {
        const topSynth = context.synths[0];
        const synthFormatted = topSynth === "serum" ? "Serum" :
                              topSynth === "massive" ? "Massive" :
                              topSynth === "vital" ? "Vital" :
                              topSynth.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
        
        const genre = context.genres[0] || "modern";
        const genreFormatted = genre.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
        
        suggestions.push({
          type: "preset",
          title: `${synthFormatted} ${genreFormatted} Essentials`,
          description: `${synthFormatted} preset pack with ${genreFormatted}-focused sounds, organized by category`,
          basedOn: `Your courses cover ${synthFormatted} - create presets your students can use`,
          confidence: 0.9,
          specs: {
            synth: synthFormatted,
            genre: genreFormatted,
            presetCount: "50-80 presets",
            details: [
              "15-20 Bass presets (sub, mid, growl)",
              "15-20 Lead presets (pluck, saw, supersaw)",
              "10-15 Pad presets (ambient, evolving)",
              "10-15 FX presets (risers, downlifters)",
              "All presets with 4 macro controls mapped",
              "Init preset template included",
            ],
          },
        });
        
        // Suggest a second synth if available
        if (context.synths.length > 1) {
          const secondSynth = context.synths[1];
          const synth2Formatted = secondSynth === "serum" ? "Serum" :
                                  secondSynth === "massive" ? "Massive" :
                                  secondSynth === "vital" ? "Vital" :
                                  secondSynth.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
          
          suggestions.push({
            type: "preset",
            title: `${synth2Formatted} Sound Design Toolkit`,
            description: `Creative ${synth2Formatted} presets for sound design and experimentation`,
            basedOn: `Also detected ${synth2Formatted} in your course content`,
            confidence: 0.82,
            specs: {
              synth: synth2Formatted,
              presetCount: "40-60 presets",
              details: [
                "Experimental textures and drones",
                "Cinematic impacts and hits",
                "Vocal-style synth sounds",
                "Glitchy and lo-fi presets",
              ],
            },
          });
        }
      } else {
        // No synths detected - suggest popular ones
        suggestions.push({
          type: "preset",
          title: "Serum Essential Sounds",
          description: "Industry-standard Serum presets covering bass, leads, pads, and FX",
          basedOn: "Serum is the most popular synth - good starting point",
          confidence: 0.75,
          specs: {
            synth: "Serum",
            presetCount: "50 presets",
            details: [
              "15 Bass (808, reese, wobble)",
              "15 Leads (pluck, saw, detuned)",
              "10 Pads (warm, dark, ambient)",
              "10 FX (risers, impacts)",
            ],
          },
        });
      }
    }

    // ========================================================================
    // COURSE SUGGESTIONS - Based on gaps in content
    // ========================================================================
    const topCourse = courses.find(c => c.isPublished);
    if (topCourse && context.synths.length > 0) {
      const synth = context.synths[0];
      const synthFormatted = synth.charAt(0).toUpperCase() + synth.slice(1);
      
      // Check if we already have a sound design course for this synth
      const hasSoundDesignCourse = courses.some(c => 
        c.title?.toLowerCase().includes("sound design") && 
        c.title?.toLowerCase().includes(synth)
      );
      
      if (!hasSoundDesignCourse) {
        suggestions.push({
          type: "course",
          title: `${synthFormatted} Sound Design Masterclass`,
          description: `Deep dive into ${synthFormatted} synthesis - oscillators, filters, modulation, and creating sounds from scratch`,
          basedOn: `Your courses mention ${synthFormatted} but don't have a dedicated sound design course`,
          confidence: 0.85,
          specs: {
            synth: synthFormatted,
            details: [
              "Module 1: Oscillator fundamentals",
              "Module 2: Filter types and uses",
              "Module 3: Envelopes and LFOs",
              "Module 4: Effects and processing",
              "Module 5: Creating genre-specific sounds",
              "Bonus: Recreate 10 famous sounds",
            ],
          },
          actionUrl: "/create-course",
        });
      }
    }

    // ========================================================================
    // SYSTEM SUGGESTIONS
    // ========================================================================
    const embeddings = await ctx.db.query("embeddings").take(100);
    if (embeddings.length < 100) {
      suggestions.push({
        type: "system",
        title: "Index More Course Content",
        description: "Your AI knowledge base needs more content for better suggestions",
        basedOn: `Only ${embeddings.length} embeddings indexed - AI suggestions will be more accurate with more data`,
        confidence: 0.95,
        actionUrl: "/admin/embeddings",
      });
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 8);
  },
});


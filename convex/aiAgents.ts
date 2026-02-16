import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ============================================================================
// QUERIES
// ============================================================================

// Get all public agents (for agent picker)
export const getPublicAgents = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("aiAgents"),
    _creationTime: v.number(),
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    longDescription: v.optional(v.string()),
    icon: v.string(),
    color: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    category: v.string(),
    tags: v.optional(v.array(v.string())),
    welcomeMessage: v.optional(v.string()),
    suggestedQuestions: v.optional(v.array(v.string())),
    conversationCount: v.number(),
    rating: v.optional(v.number()),
    ratingCount: v.optional(v.number()),
    isBuiltIn: v.boolean(),
    isFeatured: v.optional(v.boolean()),
  })),
  handler: async (ctx) => {
    const agents = await ctx.db
      .query("aiAgents")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .filter((q) => q.eq(q.field("visibility"), "public"))
      .take(500);

    return agents.map((agent) => ({
      _id: agent._id,
      _creationTime: agent._creationTime,
      name: agent.name,
      slug: agent.slug,
      description: agent.description,
      longDescription: agent.longDescription,
      icon: agent.icon,
      color: agent.color,
      avatarUrl: agent.avatarUrl,
      category: agent.category,
      tags: agent.tags,
      welcomeMessage: agent.welcomeMessage,
      suggestedQuestions: agent.suggestedQuestions,
      conversationCount: agent.conversationCount,
      rating: agent.rating,
      ratingCount: agent.ratingCount,
      isBuiltIn: agent.isBuiltIn,
      isFeatured: agent.isFeatured,
    }));
  },
});

// Get featured agents (for homepage/quick access)
export const getFeaturedAgents = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("aiAgents"),
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    icon: v.string(),
    color: v.optional(v.string()),
    category: v.string(),
    conversationCount: v.number(),
  })),
  handler: async (ctx) => {
    const agents = await ctx.db
      .query("aiAgents")
      .withIndex("by_isFeatured", (q) => q.eq("isFeatured", true))
      .filter((q) => q.eq(q.field("isActive"), true))
      .take(6);

    return agents.map((agent) => ({
      _id: agent._id,
      name: agent.name,
      slug: agent.slug,
      description: agent.description,
      icon: agent.icon,
      color: agent.color,
      category: agent.category,
      conversationCount: agent.conversationCount,
    }));
  },
});

// Get a single agent by slug
export const getAgentBySlug = query({
  args: { slug: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("aiAgents"),
      _creationTime: v.number(),
      name: v.string(),
      slug: v.string(),
      description: v.string(),
      longDescription: v.optional(v.string()),
      icon: v.string(),
      color: v.optional(v.string()),
      avatarUrl: v.optional(v.string()),
      systemPrompt: v.string(),
      welcomeMessage: v.optional(v.string()),
      suggestedQuestions: v.optional(v.array(v.string())),
      knowledgeFilters: v.optional(v.object({
        categories: v.optional(v.array(v.string())),
        sourceTypes: v.optional(v.array(v.string())),
        tags: v.optional(v.array(v.string())),
      })),
      enabledTools: v.optional(v.array(v.string())),
      toolConfigs: v.optional(v.any()),
      defaultSettings: v.optional(v.object({
        preset: v.optional(v.string()),
        responseStyle: v.optional(v.string()),
        maxFacets: v.optional(v.number()),
        chunksPerFacet: v.optional(v.number()),
        enableWebResearch: v.optional(v.boolean()),
        enableCreativeMode: v.optional(v.boolean()),
      })),
      category: v.string(),
      tags: v.optional(v.array(v.string())),
      conversationCount: v.number(),
      rating: v.optional(v.number()),
      isBuiltIn: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const agent = await ctx.db
      .query("aiAgents")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!agent || !agent.isActive) return null;

    return {
      _id: agent._id,
      _creationTime: agent._creationTime,
      name: agent.name,
      slug: agent.slug,
      description: agent.description,
      longDescription: agent.longDescription,
      icon: agent.icon,
      color: agent.color,
      avatarUrl: agent.avatarUrl,
      systemPrompt: agent.systemPrompt,
      welcomeMessage: agent.welcomeMessage,
      suggestedQuestions: agent.suggestedQuestions,
      knowledgeFilters: agent.knowledgeFilters,
      enabledTools: agent.enabledTools,
      toolConfigs: agent.toolConfigs,
      defaultSettings: agent.defaultSettings,
      category: agent.category,
      tags: agent.tags,
      conversationCount: agent.conversationCount,
      rating: agent.rating,
      isBuiltIn: agent.isBuiltIn,
    };
  },
});

// Get agent by ID
export const getAgent = query({
  args: { agentId: v.id("aiAgents") },
  returns: v.union(
    v.object({
      _id: v.id("aiAgents"),
      _creationTime: v.number(),
      name: v.string(),
      slug: v.string(),
      description: v.string(),
      icon: v.string(),
      color: v.optional(v.string()),
      systemPrompt: v.string(),
      welcomeMessage: v.optional(v.string()),
      suggestedQuestions: v.optional(v.array(v.string())),
      knowledgeFilters: v.optional(v.object({
        categories: v.optional(v.array(v.string())),
        sourceTypes: v.optional(v.array(v.string())),
        tags: v.optional(v.array(v.string())),
      })),
      enabledTools: v.optional(v.array(v.string())),
      defaultSettings: v.optional(v.object({
        preset: v.optional(v.string()),
        responseStyle: v.optional(v.string()),
        maxFacets: v.optional(v.number()),
        chunksPerFacet: v.optional(v.number()),
        enableWebResearch: v.optional(v.boolean()),
        enableCreativeMode: v.optional(v.boolean()),
      })),
      category: v.string(),
      isBuiltIn: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent || !agent.isActive) return null;

    return {
      _id: agent._id,
      _creationTime: agent._creationTime,
      name: agent.name,
      slug: agent.slug,
      description: agent.description,
      icon: agent.icon,
      color: agent.color,
      systemPrompt: agent.systemPrompt,
      welcomeMessage: agent.welcomeMessage,
      suggestedQuestions: agent.suggestedQuestions,
      knowledgeFilters: agent.knowledgeFilters,
      enabledTools: agent.enabledTools,
      defaultSettings: agent.defaultSettings,
      category: agent.category,
      isBuiltIn: agent.isBuiltIn,
    };
  },
});

// Get agents by category
export const getAgentsByCategory = query({
  args: { category: v.string() },
  returns: v.array(v.object({
    _id: v.id("aiAgents"),
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    icon: v.string(),
    color: v.optional(v.string()),
    conversationCount: v.number(),
    isBuiltIn: v.boolean(),
  })),
  handler: async (ctx, args) => {
    const agents = await ctx.db
      .query("aiAgents")
      .withIndex("by_category", (q) => q.eq("category", args.category as any))
      .filter((q) => 
        q.and(
          q.eq(q.field("isActive"), true),
          q.eq(q.field("visibility"), "public")
        )
      )
      .take(500);

    return agents.map((agent) => ({
      _id: agent._id,
      name: agent.name,
      slug: agent.slug,
      description: agent.description,
      icon: agent.icon,
      color: agent.color,
      conversationCount: agent.conversationCount,
      isBuiltIn: agent.isBuiltIn,
    }));
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

// Increment conversation count for an agent
export const incrementConversationCount = mutation({
  args: { agentId: v.id("aiAgents") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (agent) {
      await ctx.db.patch(args.agentId, {
        conversationCount: agent.conversationCount + 1,
      });
    }
    return null;
  },
});

// Create a new agent (admin only)
export const createAgent = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    longDescription: v.optional(v.string()),
    icon: v.string(),
    color: v.optional(v.string()),
    systemPrompt: v.string(),
    welcomeMessage: v.optional(v.string()),
    suggestedQuestions: v.optional(v.array(v.string())),
    knowledgeFilters: v.optional(v.object({
      categories: v.optional(v.array(v.string())),
      sourceTypes: v.optional(v.array(v.string())),
      tags: v.optional(v.array(v.string())),
    })),
    enabledTools: v.optional(v.array(v.string())),
    toolConfigs: v.optional(v.any()),
    defaultSettings: v.optional(v.object({
      preset: v.optional(v.string()),
      responseStyle: v.optional(v.string()),
      maxFacets: v.optional(v.number()),
      chunksPerFacet: v.optional(v.number()),
      enableWebResearch: v.optional(v.boolean()),
      enableCreativeMode: v.optional(v.boolean()),
    })),
    visibility: v.union(v.literal("public"), v.literal("subscribers"), v.literal("private")),
    category: v.union(
      v.literal("marketing"),
      v.literal("audio"),
      v.literal("business"),
      v.literal("social"),
      v.literal("creative"),
      v.literal("productivity"),
      v.literal("learning"),
      v.literal("custom")
    ),
    tags: v.optional(v.array(v.string())),
    creatorId: v.optional(v.string()),
  },
  returns: v.id("aiAgents"),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Check if slug is unique
    const existing = await ctx.db
      .query("aiAgents")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    
    if (existing) {
      throw new Error(`Agent with slug "${args.slug}" already exists`);
    }

    return await ctx.db.insert("aiAgents", {
      name: args.name,
      slug: args.slug,
      description: args.description,
      longDescription: args.longDescription,
      icon: args.icon,
      color: args.color,
      systemPrompt: args.systemPrompt,
      welcomeMessage: args.welcomeMessage,
      suggestedQuestions: args.suggestedQuestions,
      knowledgeFilters: args.knowledgeFilters,
      enabledTools: args.enabledTools,
      toolConfigs: args.toolConfigs,
      defaultSettings: args.defaultSettings,
      visibility: args.visibility,
      creatorId: args.creatorId,
      category: args.category,
      tags: args.tags,
      conversationCount: 0,
      isActive: true,
      isBuiltIn: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update an agent
export const updateAgent = mutation({
  args: {
    agentId: v.id("aiAgents"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    longDescription: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    systemPrompt: v.optional(v.string()),
    welcomeMessage: v.optional(v.string()),
    suggestedQuestions: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
    isFeatured: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { agentId, ...updates } = args;
    
    const agent = await ctx.db.get(agentId);
    if (!agent) {
      throw new Error("Agent not found");
    }

    await ctx.db.patch(agentId, {
      ...updates,
      updatedAt: Date.now(),
    });
    
    return null;
  },
});

// Seed built-in agents (internal mutation)
export const seedBuiltInAgents = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const now = Date.now();

    const builtInAgents = [
      {
        name: "Brand Marketing Pro",
        slug: "brand-marketing",
        description: "Expert in music brand marketing, social media strategy, and audience growth",
        longDescription: "I'm your dedicated brand marketing expert for musicians and producers. I'll help you build a compelling brand identity, create engaging content strategies, grow your social media presence, and develop marketing campaigns that resonate with your target audience.",
        icon: "📣",
        color: "violet",
        category: "marketing" as const,
        systemPrompt: `You are Brand Marketing Pro, an expert AI assistant specializing in music industry marketing and brand building.

Your expertise includes:
- Social media strategy for musicians (Instagram, TikTok, YouTube, Twitter/X)
- Content marketing and storytelling
- Brand identity development
- Audience growth and engagement tactics
- Email marketing campaigns
- Release strategies and promotional campaigns
- Influencer collaboration strategies
- Fan community building

Guidelines:
- Always provide actionable, practical advice
- Use music industry-specific examples
- Consider budget constraints and DIY approaches
- Stay current with platform algorithms and trends
- Be encouraging but realistic about expectations
- Suggest metrics to track success

When asked about marketing, always consider:
1. The artist's current stage (beginner, established, etc.)
2. Their target audience
3. Available resources and budget
4. Timeline and goals`,
        welcomeMessage: "Hey! I'm Brand Marketing Pro 📣 Ready to help you build your music brand and grow your audience. What marketing challenge can I help you tackle today?",
        suggestedQuestions: [
          "How do I grow my Instagram following as a music producer?",
          "What's the best way to promote a new release?",
          "How do I create a content calendar for my music brand?",
          "What makes a good artist bio?",
        ],
        defaultSettings: {
          preset: "balanced",
          responseStyle: "structured",
          enableWebResearch: true,
          enableCreativeMode: true,
        },
        tags: ["marketing", "social media", "branding", "growth"],
      },
      {
        name: "Mixing & Mastering Engineer",
        slug: "mixing-mastering",
        description: "Professional guidance on mixing techniques, mastering, and audio engineering",
        longDescription: "I'm your virtual mixing and mastering engineer. Whether you're working on your first track or polishing a professional release, I'll guide you through EQ, compression, spatial effects, gain staging, and the entire mastering chain.",
        icon: "🎛️",
        color: "amber",
        category: "audio" as const,
        systemPrompt: `You are Mixing & Mastering Engineer, an expert AI assistant specializing in audio engineering, mixing, and mastering.

Your expertise includes:
- EQ techniques and frequency management
- Compression and dynamics processing
- Spatial effects (reverb, delay, stereo imaging)
- Gain staging and headroom management
- Bus processing and parallel techniques
- Mastering chain setup
- Reference track analysis
- Genre-specific mixing approaches
- DAW-specific workflows (Ableton, Logic, FL Studio, Pro Tools)
- Plugin recommendations and alternatives

Guidelines:
- Explain technical concepts clearly with analogies
- Provide specific parameter suggestions when helpful
- Consider the listener's experience level
- Recommend both expensive and budget-friendly solutions
- Emphasize the importance of good arrangement and sound selection
- Address common mistakes and how to avoid them

When discussing mixing/mastering, always consider:
1. The genre and its conventions
2. The user's DAW and available plugins
3. The intended listening environment
4. The source material quality`,
        welcomeMessage: "Hey! I'm your Mixing & Mastering Engineer 🎛️ Let's get your tracks sounding professional. What are you working on?",
        suggestedQuestions: [
          "How do I make my kicks punch through the mix?",
          "What's a good mastering chain for electronic music?",
          "How do I fix a muddy mix?",
          "What's the best way to use sidechain compression?",
        ],
        knowledgeFilters: {
          categories: ["mixing", "mastering", "audio engineering", "production"],
          sourceTypes: ["course", "chapter", "lesson"],
        },
        defaultSettings: {
          preset: "balanced",
          responseStyle: "structured",
          maxFacets: 4,
          chunksPerFacet: 25,
        },
        tags: ["mixing", "mastering", "audio", "engineering", "production"],
      },
      {
        name: "Social Media Script Writer",
        slug: "social-scripts",
        description: "AI-powered script generation for TikTok, Instagram Reels, and YouTube content",
        longDescription: "I specialize in creating engaging scripts for short-form video content. From hooks that stop the scroll to calls-to-action that convert, I'll help you create content that performs.",
        icon: "🎬",
        color: "pink",
        category: "social" as const,
        enabledTools: ["blotato"],
        systemPrompt: `You are Social Media Script Writer, an expert AI assistant specializing in creating viral video scripts for musicians and producers.

Your expertise includes:
- TikTok script writing and trends
- Instagram Reels content creation
- YouTube Shorts optimization
- Hook writing that stops the scroll
- Storytelling in 15-60 seconds
- Call-to-action strategies
- Trending audio and format utilization
- Behind-the-scenes content ideas
- Tutorial and educational content formats

Guidelines:
- Always start with a strong hook (first 1-3 seconds)
- Keep scripts punchy and scannable
- Use pattern interrupts to maintain attention
- Include clear CTAs when appropriate
- Consider the platform's specific culture and trends
- Provide multiple variations when possible
- Suggest optimal video length for each platform

Script structure should include:
1. HOOK (0-3 sec): Attention grabber
2. CONTENT (main body): Value delivery
3. CTA (end): What you want viewers to do

Output Format:
- Provide scripts in a clear, numbered format
- Include timing suggestions
- Add notes for on-screen text/captions
- Suggest B-roll or visual ideas`,
        welcomeMessage: "Hey creator! 🎬 I'm your Social Media Script Writer. Ready to create some scroll-stopping content? Tell me about your next video idea!",
        suggestedQuestions: [
          "Write a TikTok script about my production process",
          "Create 5 hook variations for a beat-making video",
          "What are trending video formats for music producers?",
          "Write a YouTube Short script about [topic]",
        ],
        defaultSettings: {
          preset: "speed",
          responseStyle: "structured",
          enableCreativeMode: true,
        },
        tags: ["social media", "scripts", "tiktok", "reels", "content"],
      },
      {
        name: "Music Business Advisor",
        slug: "music-business",
        description: "Strategic guidance on music business, revenue streams, and career development",
        longDescription: "I'm your music business advisor, helping you navigate contracts, royalties, distribution, sync licensing, and building sustainable income streams as a music creator.",
        icon: "💼",
        color: "emerald",
        category: "business" as const,
        systemPrompt: `You are Music Business Advisor, an expert AI assistant specializing in the business side of the music industry.

Your expertise includes:
- Revenue streams for musicians (streaming, sync, merch, live, teaching)
- Distribution strategies and platform selection
- Royalty collection and PRO registration
- Contract basics and red flags
- Sync licensing opportunities
- Building a music catalog
- Passive income strategies
- Pricing your services
- Negotiation tactics
- Legal basics for musicians

Guidelines:
- Provide practical, actionable business advice
- Consider different career stages and goals
- Always recommend consulting professionals for legal/financial decisions
- Be realistic about income expectations
- Focus on sustainable long-term strategies
- Consider both independent and label paths

Important disclaimers:
- You provide general guidance, not legal or financial advice
- Recommend consulting lawyers for contracts
- Suggest accountants for tax matters
- Encourage PRO registration for royalty collection`,
        welcomeMessage: "Welcome! 💼 I'm your Music Business Advisor. Whether you're figuring out distribution, understanding royalties, or building income streams, I'm here to help. What business challenge are you facing?",
        suggestedQuestions: [
          "How do I collect all my streaming royalties?",
          "What should I look for in a distribution deal?",
          "How do I get my music in TV shows and commercials?",
          "What are the best passive income streams for producers?",
        ],
        defaultSettings: {
          preset: "balanced",
          responseStyle: "conversational",
          enableWebResearch: true,
        },
        tags: ["business", "royalties", "distribution", "sync", "career"],
      },
      {
        name: "Creative Collaborator",
        slug: "creative-collaborator",
        description: "Brainstorming partner for musical ideas, arrangements, and creative blocks",
        longDescription: "I'm your creative thinking partner. When you're stuck on a track, need arrangement ideas, or want to explore new creative directions, I'm here to brainstorm with you and push your creativity further.",
        icon: "💡",
        color: "yellow",
        category: "creative" as const,
        systemPrompt: `You are Creative Collaborator, an AI brainstorming partner for musicians and producers.

Your role is to:
- Help overcome creative blocks
- Suggest arrangement ideas and variations
- Explore different creative directions
- Provide musical references and inspiration
- Generate lyric ideas and themes
- Suggest sound design approaches
- Help with song structure decisions
- Encourage experimentation

Guidelines:
- Be enthusiastic and encouraging
- Offer multiple options and variations
- Ask clarifying questions to understand the vision
- Reference other artists/tracks for inspiration
- Think outside conventional approaches
- Balance wild ideas with practical suggestions
- Help refine ideas through iteration

Creative techniques to employ:
- "What if..." questioning
- Constraint-based creativity
- Genre mashup suggestions
- Emotional/narrative framing
- Visual-to-audio translation
- Opposite day (flip expectations)`,
        welcomeMessage: "Hey! 💡 I'm your Creative Collaborator. Let's make something amazing together! Are you stuck on something, or ready to explore new ideas?",
        suggestedQuestions: [
          "I'm stuck on this 8-bar loop, how do I develop it?",
          "Give me 5 unconventional arrangement ideas",
          "What artists should I study for [genre] inspiration?",
          "Help me brainstorm themes for my next EP",
        ],
        defaultSettings: {
          preset: "balanced",
          responseStyle: "conversational",
          enableCreativeMode: true,
        },
        tags: ["creative", "brainstorming", "arrangement", "inspiration"],
      },
    ];

    for (const agentData of builtInAgents) {
      // Check if agent already exists
      const existing = await ctx.db
        .query("aiAgents")
        .withIndex("by_slug", (q) => q.eq("slug", agentData.slug))
        .first();

      if (existing) {
        // Update existing agent
        await ctx.db.patch(existing._id, {
          ...agentData,
          updatedAt: now,
        });
      } else {
        // Create new agent
        await ctx.db.insert("aiAgents", {
          ...agentData,
          visibility: "public",
          conversationCount: 0,
          isActive: true,
          isBuiltIn: true,
          isFeatured: true,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    return null;
  },
});


import { v } from "convex/values";
import { query, mutation, internalQuery } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { requireStoreOwner, requireAuth } from "./lib/auth";

const ANDREW_1_VOICE_ID = "IXQAN2tgDlb8raWmXvzP";

export const getSocialMediaPostsByUser = query({
  args: {
    userId: v.string(),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("scripts_generated"),
        v.literal("combined"),
        v.literal("images_generated"),
        v.literal("audio_generated"),
        v.literal("completed"),
        v.literal("published")
      )
    ),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const { userId, status, limit = 50 } = args;

    let postsQuery = ctx.db
      .query("socialMediaPosts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc");

    const posts = await postsQuery.take(limit);

    if (status) {
      return posts.filter((p) => p.status === status);
    }

    return posts;
  },
});

export const getSocialMediaPostById = query({
  args: {
    postId: v.id("socialMediaPosts"),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db.get(args.postId);
  },
});

export const getSocialMediaPostWithDetails = query({
  args: {
    postId: v.id("socialMediaPosts"),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const post = await ctx.db.get(args.postId);
    if (!post) return null;

    let course = null;
    let chapter = null;
    let ctaTemplate = null;
    let linkedProduct = null;
    let linkedCourse = null;

    if (post.courseId) {
      course = await ctx.db.get(post.courseId);
    }
    if (post.chapterId) {
      chapter = await ctx.db.get(post.chapterId);
    }
    if (post.ctaTemplateId) {
      ctaTemplate = await ctx.db.get(post.ctaTemplateId);
    }
    if (post.ctaProductId) {
      linkedProduct = await ctx.db.get(post.ctaProductId);
    }
    if (post.ctaCourseId) {
      linkedCourse = await ctx.db.get(post.ctaCourseId);
    }

    return {
      ...post,
      course,
      chapter,
      ctaTemplate,
      linkedProduct,
      linkedCourse,
    };
  },
});

export const createSocialMediaPost = mutation({
  args: {
    userId: v.string(),
    storeId: v.optional(v.string()),
    courseId: v.optional(v.id("courses")),
    chapterId: v.optional(v.id("courseChapters")),
    sourceContent: v.string(),
    sourceType: v.union(v.literal("chapter"), v.literal("section"), v.literal("custom")),
    selectedHeadings: v.optional(v.array(v.string())),
    title: v.optional(v.string()),
  },
  returns: v.id("socialMediaPosts"),
  handler: async (ctx, args) => {
    if (args.storeId) await requireStoreOwner(ctx, args.storeId);
    else await requireAuth(ctx);
    const now = Date.now();

    return await ctx.db.insert("socialMediaPosts", {
      userId: args.userId,
      storeId: args.storeId,
      courseId: args.courseId,
      chapterId: args.chapterId,
      sourceContent: args.sourceContent,
      sourceType: args.sourceType,
      selectedHeadings: args.selectedHeadings,
      title: args.title,
      status: "draft",
      audioVoiceId: ANDREW_1_VOICE_ID,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateSocialMediaPostScripts = mutation({
  args: {
    postId: v.id("socialMediaPosts"),
    tiktokScript: v.optional(v.string()),
    youtubeScript: v.optional(v.string()),
    instagramScript: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const { postId, ...updates } = args;

    const filteredUpdates: Record<string, string | number> = {};
    if (updates.tiktokScript !== undefined) filteredUpdates.tiktokScript = updates.tiktokScript;
    if (updates.youtubeScript !== undefined) filteredUpdates.youtubeScript = updates.youtubeScript;
    if (updates.instagramScript !== undefined)
      filteredUpdates.instagramScript = updates.instagramScript;

    await ctx.db.patch(postId, {
      ...filteredUpdates,
      status: "scripts_generated",
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const updateSocialMediaPostCombined = mutation({
  args: {
    postId: v.id("socialMediaPosts"),
    combinedScript: v.string(),
    ctaTemplateId: v.optional(v.id("ctaTemplates")),
    ctaText: v.optional(v.string()),
    ctaKeyword: v.optional(v.string()),
    ctaProductId: v.optional(v.id("digitalProducts")),
    ctaCourseId: v.optional(v.id("courses")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const { postId, ...updates } = args;

    await ctx.db.patch(postId, {
      ...updates,
      status: "combined",
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const updateSocialMediaPostImages = mutation({
  args: {
    postId: v.id("socialMediaPosts"),
    images: v.array(
      v.object({
        storageId: v.id("_storage"),
        url: v.string(),
        aspectRatio: v.union(v.literal("16:9"), v.literal("9:16")),
        prompt: v.string(),
        sentence: v.optional(v.string()),
        embedding: v.optional(v.array(v.number())),
        // Prompt editing fields
        originalPrompt: v.optional(v.string()),
        isPromptEdited: v.optional(v.boolean()),
        // Source image for image-to-image generation
        sourceImageUrl: v.optional(v.string()),
        sourceStorageId: v.optional(v.id("_storage")),
      })
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    await ctx.db.patch(args.postId, {
      images: args.images,
      status: "images_generated",
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const addImageToSocialMediaPost = mutation({
  args: {
    postId: v.id("socialMediaPosts"),
    image: v.object({
      storageId: v.id("_storage"),
      url: v.string(),
      aspectRatio: v.union(v.literal("16:9"), v.literal("9:16")),
      prompt: v.string(),
      sentence: v.optional(v.string()),
      embedding: v.optional(v.array(v.number())),
      originalPrompt: v.optional(v.string()),
      isPromptEdited: v.optional(v.boolean()),
      sourceImageUrl: v.optional(v.string()),
      sourceStorageId: v.optional(v.id("_storage")),
    }),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    const existingImages = post.images || [];

    await ctx.db.patch(args.postId, {
      images: [...existingImages, args.image],
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const removeImageFromSocialMediaPost = mutation({
  args: {
    postId: v.id("socialMediaPosts"),
    imageIndex: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    const existingImages = post.images || [];
    const updatedImages = existingImages.filter((_, i) => i !== args.imageIndex);

    await ctx.db.patch(args.postId, {
      images: updatedImages,
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const updateSocialMediaPostAudio = mutation({
  args: {
    postId: v.id("socialMediaPosts"),
    audioStorageId: v.id("_storage"),
    audioUrl: v.string(),
    audioVoiceId: v.optional(v.string()),
    audioDuration: v.optional(v.number()),
    audioScript: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const { postId, ...updates } = args;

    await ctx.db.patch(postId, {
      ...updates,
      status: "audio_generated",
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const updateSocialMediaPostCaptions = mutation({
  args: {
    postId: v.id("socialMediaPosts"),
    instagramCaption: v.optional(v.string()),
    tiktokCaption: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const { postId, instagramCaption, tiktokCaption } = args;

    const updates: Record<string, string | number> = { updatedAt: Date.now() };
    if (instagramCaption !== undefined) updates.instagramCaption = instagramCaption;
    if (tiktokCaption !== undefined) updates.tiktokCaption = tiktokCaption;

    await ctx.db.patch(postId, updates);

    return null;
  },
});

export const completeSocialMediaPost = mutation({
  args: {
    postId: v.id("socialMediaPosts"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    await ctx.db.patch(args.postId, {
      status: "completed",
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const updateSocialMediaPostStatus = mutation({
  args: {
    postId: v.id("socialMediaPosts"),
    status: v.union(
      v.literal("draft"),
      v.literal("scripts_generated"),
      v.literal("combined"),
      v.literal("images_generated"),
      v.literal("audio_generated"),
      v.literal("completed"),
      v.literal("published")
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    await ctx.db.patch(args.postId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const updateSocialMediaPostTitle = mutation({
  args: {
    postId: v.id("socialMediaPosts"),
    title: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    await ctx.db.patch(args.postId, {
      title: args.title,
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const deleteSocialMediaPost = mutation({
  args: {
    postId: v.id("socialMediaPosts"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    await ctx.db.delete(args.postId);
    return null;
  },
});

export const getCTATemplatesByUser = query({
  args: {
    userId: v.string(),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db
      .query("ctaTemplates")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const getCTATemplateById = query({
  args: {
    templateId: v.id("ctaTemplates"),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db.get(args.templateId);
  },
});

export const createCTATemplate = mutation({
  args: {
    userId: v.string(),
    storeId: v.optional(v.string()),
    name: v.string(),
    template: v.string(),
    keyword: v.string(),
    description: v.optional(v.string()),
    productId: v.optional(v.id("digitalProducts")),
    courseId: v.optional(v.id("courses")),
    productName: v.optional(v.string()),
  },
  returns: v.id("ctaTemplates"),
  handler: async (ctx, args) => {
    if (args.storeId) await requireStoreOwner(ctx, args.storeId);
    else await requireAuth(ctx);
    const now = Date.now();

    return await ctx.db.insert("ctaTemplates", {
      userId: args.userId,
      storeId: args.storeId,
      name: args.name,
      template: args.template,
      keyword: args.keyword.toUpperCase(),
      description: args.description,
      productId: args.productId,
      courseId: args.courseId,
      productName: args.productName,
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateCTATemplate = mutation({
  args: {
    templateId: v.id("ctaTemplates"),
    name: v.optional(v.string()),
    template: v.optional(v.string()),
    keyword: v.optional(v.string()),
    description: v.optional(v.string()),
    productId: v.optional(v.id("digitalProducts")),
    courseId: v.optional(v.id("courses")),
    productName: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const { templateId, ...updates } = args;

    const filteredUpdates: Record<string, string | Id<"digitalProducts"> | Id<"courses"> | number> =
      {};
    if (updates.name !== undefined) filteredUpdates.name = updates.name;
    if (updates.template !== undefined) filteredUpdates.template = updates.template;
    if (updates.keyword !== undefined) filteredUpdates.keyword = updates.keyword.toUpperCase();
    if (updates.description !== undefined) filteredUpdates.description = updates.description;
    if (updates.productId !== undefined) filteredUpdates.productId = updates.productId;
    if (updates.courseId !== undefined) filteredUpdates.courseId = updates.courseId;
    if (updates.productName !== undefined) filteredUpdates.productName = updates.productName;

    await ctx.db.patch(templateId, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const incrementCTATemplateUsage = mutation({
  args: {
    templateId: v.id("ctaTemplates"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const template = await ctx.db.get(args.templateId);
    if (!template) return null;

    await ctx.db.patch(args.templateId, {
      usageCount: (template.usageCount || 0) + 1,
      lastUsedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const deleteCTATemplate = mutation({
  args: {
    templateId: v.id("ctaTemplates"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    await ctx.db.delete(args.templateId);
    return null;
  },
});

export const getChapterContentForSocialPost = internalQuery({
  args: {
    chapterId: v.id("courseChapters"),
  },
  returns: v.union(
    v.object({
      _id: v.id("courseChapters"),
      title: v.string(),
      description: v.optional(v.string()),
      courseId: v.string(),
      courseTitle: v.optional(v.string()),
      lessonTitle: v.optional(v.string()),
      moduleTitle: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const chapter = await ctx.db.get(args.chapterId);
    if (!chapter) return null;

    let courseTitle: string | undefined;
    let lessonTitle: string | undefined;
    let moduleTitle: string | undefined;

    const courseIdAsId = chapter.courseId as Id<"courses">;
    const course = await ctx.db.get(courseIdAsId);
    if (course) {
      courseTitle = course.title;
    }

    if (chapter.lessonId) {
      const lessonIdAsId = chapter.lessonId as Id<"courseLessons">;
      const lesson = await ctx.db.get(lessonIdAsId);
      if (lesson) {
        lessonTitle = lesson.title;
        const moduleIdAsId = lesson.moduleId as Id<"courseModules">;
        const module = await ctx.db.get(moduleIdAsId);
        if (module) {
          moduleTitle = module.title;
        }
      }
    }

    return {
      _id: chapter._id,
      title: chapter.title,
      description: chapter.description,
      courseId: chapter.courseId,
      courseTitle,
      lessonTitle,
      moduleTitle,
    };
  },
});

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await requireAuth(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

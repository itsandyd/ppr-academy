import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

const GENRE_KEYWORDS: Record<string, string[]> = {
  techno: ["techno", "tech house", "minimal", "industrial"],
  house: ["house", "deep house", "progressive house", "tech house"],
  "hip-hop": ["hip hop", "hip-hop", "rap", "trap", "boom bap", "drill"],
  trap: ["trap", "808", "drill"],
  rnb: ["rnb", "r&b", "soul", "neo soul"],
  pop: ["pop", "dance pop", "electro pop"],
  edm: ["edm", "electronic", "dance", "festival"],
  "lo-fi": ["lofi", "lo-fi", "chillhop", "chill"],
  ambient: ["ambient", "atmospheric", "soundscape"],
  "drum-and-bass": ["drum and bass", "dnb", "jungle"],
  dubstep: ["dubstep", "bass music", "riddim"],
  reggaeton: ["reggaeton", "latin", "dembow"],
  afrobeat: ["afrobeat", "afro", "amapiano"],
};

const SKILL_KEYWORDS: Record<string, string[]> = {
  beginner: ["beginner", "basic", "intro", "starter", "first", "learn", "101"],
  intermediate: ["intermediate", "mid-level", "improving"],
  advanced: ["advanced", "pro", "master", "expert", "professional"],
};

const PRODUCT_TYPE_TAGS: Record<string, string> = {
  "sample-pack": "interest:samples",
  "preset-pack": "interest:presets",
  "midi-pack": "interest:midi",
  "beat-lease": "interest:beats",
  "effect-chain": "interest:mixing",
  coaching: "interest:coaching",
  course: "interest:learning",
  pdf: "interest:guides",
  service: "interest:services",
};

/**
 * Generate a URL-safe slug from a product title
 */
function generateProductTagSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .substring(0, 50) // Limit length
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Generate a URL-safe slug from a course title (used for course tags)
 */
function generateCourseTagSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .substring(0, 50) // Limit length
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
}

function inferGenresFromText(text: string): string[] {
  const lowerText = text.toLowerCase();
  const matchedGenres: string[] = [];

  for (const [genre, keywords] of Object.entries(GENRE_KEYWORDS)) {
    if (keywords.some((keyword) => lowerText.includes(keyword))) {
      matchedGenres.push(`genre:${genre}`);
    }
  }

  return matchedGenres;
}

function inferSkillLevelFromText(text: string): string | null {
  const lowerText = text.toLowerCase();

  for (const [level, keywords] of Object.entries(SKILL_KEYWORDS)) {
    if (keywords.some((keyword) => lowerText.includes(keyword))) {
      return level;
    }
  }

  return null;
}

async function getOrCreateTag(
  ctx: any,
  storeId: string,
  tagName: string
): Promise<Id<"emailTags">> {
  const existing = await ctx.db
    .query("emailTags")
    .withIndex("by_storeId_and_name", (q: any) => q.eq("storeId", storeId).eq("name", tagName))
    .first();

  if (existing) {
    return existing._id;
  }

  const now = Date.now();

  // Determine color based on tag type
  let color = "#6B7280"; // Default gray
  let description = `Auto-generated tag: ${tagName}`;

  if (tagName.startsWith("product:")) {
    color = "#EC4899"; // Pink for product-specific tags
    const productName = tagName.replace("product:", "").replace(/-/g, " ");
    description = `Purchased: ${productName}`;
  } else if (tagName.startsWith("course:")) {
    color = "#8B5CF6"; // Purple for course-specific tags
    const courseName = tagName.replace("course:", "").replace(/-/g, " ");
    description = `Enrolled in: ${courseName}`;
  } else if (tagName.startsWith("genre:")) {
    color = "#8B5CF6"; // Purple for genres
  } else if (tagName.startsWith("interest:")) {
    color = "#3B82F6"; // Blue for interests
  } else if (tagName.startsWith("skill:")) {
    color = "#10B981"; // Green for skills
  } else if (tagName === "customer") {
    color = "#F59E0B"; // Amber for customers
  }

  return await ctx.db.insert("emailTags", {
    storeId,
    name: tagName,
    color,
    description,
    contactCount: 0,
    createdAt: now,
    updatedAt: now,
  });
}

async function addTagsToContact(
  ctx: any,
  contactId: Id<"emailContacts">,
  storeId: string,
  tagNames: string[]
): Promise<void> {
  const contact = await ctx.db.get(contactId);
  if (!contact) return;

  const newTagIds: Id<"emailTags">[] = [...contact.tagIds];

  for (const tagName of tagNames) {
    const tagId = await getOrCreateTag(ctx, storeId, tagName);

    if (!newTagIds.includes(tagId)) {
      newTagIds.push(tagId);

      const tag = await ctx.db.get(tagId);
      if (tag) {
        await ctx.db.patch(tagId, {
          contactCount: tag.contactCount + 1,
          updatedAt: Date.now(),
        });
      }
    }
  }

  if (newTagIds.length !== contact.tagIds.length) {
    await ctx.db.patch(contactId, {
      tagIds: newTagIds,
      updatedAt: Date.now(),
    });
  }
}

export const syncContactFromFollowGate = internalMutation({
  args: {
    storeId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    productId: v.id("digitalProducts"),
  },
  returns: v.object({
    contactId: v.id("emailContacts"),
    created: v.boolean(),
    tagsAdded: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    const tagsToAdd: string[] = [];

    if (product.productType && PRODUCT_TYPE_TAGS[product.productType]) {
      tagsToAdd.push(PRODUCT_TYPE_TAGS[product.productType]);
    }

    const textToAnalyze = [
      product.title || "",
      product.description || "",
      ...(product.genre || []),
      product.productCategory || "",
    ].join(" ");

    const genreTags = inferGenresFromText(textToAnalyze);
    tagsToAdd.push(...genreTags);

    const skillLevel = inferSkillLevelFromText(textToAnalyze);
    if (skillLevel) {
      tagsToAdd.push(`skill:${skillLevel}`);
    }

    tagsToAdd.push("source:follow-gate");

    const existingContact = await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId_and_email", (q) =>
        q.eq("storeId", args.storeId).eq("email", args.email.toLowerCase())
      )
      .first();

    let contactId: Id<"emailContacts">;
    let created = false;

    if (existingContact) {
      contactId = existingContact._id;

      const updates: Record<string, any> = {
        updatedAt: Date.now(),
      };

      if (!existingContact.sourceProductId) {
        updates.sourceProductId = args.productId;
        updates.source = "follow_gate";
      }

      if (args.name && !existingContact.firstName) {
        const nameParts = args.name.split(" ");
        updates.firstName = nameParts[0];
        if (nameParts.length > 1) {
          updates.lastName = nameParts.slice(1).join(" ");
        }
      }

      const currentCustomFields = existingContact.customFields || {};
      updates.customFields = {
        ...currentCustomFields,
        lastActivity: Date.now(),
        followGateProducts: [...(currentCustomFields.followGateProducts || []), args.productId],
      };

      await ctx.db.patch(contactId, updates);
    } else {
      const now = Date.now();
      const nameParts = args.name?.split(" ") || [];

      contactId = await ctx.db.insert("emailContacts", {
        storeId: args.storeId,
        email: args.email.toLowerCase(),
        firstName: nameParts[0],
        lastName: nameParts.length > 1 ? nameParts.slice(1).join(" ") : undefined,
        status: "subscribed",
        subscribedAt: now,
        tagIds: [],
        source: "follow_gate",
        sourceProductId: args.productId,
        emailsSent: 0,
        emailsOpened: 0,
        emailsClicked: 0,
        customFields: {
          lastActivity: now,
          followGateProducts: [args.productId],
        },
        createdAt: now,
        updatedAt: now,
      });
      created = true;
    }

    await addTagsToContact(ctx, contactId, args.storeId, tagsToAdd);

    await ctx.db.insert("emailContactActivity", {
      contactId,
      storeId: args.storeId,
      activityType: "subscribed",
      metadata: {
        tagName: `Follow gate: ${product.title}`,
      },
      timestamp: Date.now(),
    });

    return {
      contactId,
      created,
      tagsAdded: tagsToAdd,
    };
  },
});

export const syncContactFromPurchase = internalMutation({
  args: {
    storeId: v.string(),
    email: v.string(),
    userId: v.optional(v.string()),
    productId: v.optional(v.id("digitalProducts")),
    courseId: v.optional(v.id("courses")),
    amount: v.number(),
  },
  returns: v.object({
    contactId: v.id("emailContacts"),
    created: v.boolean(),
    tagsAdded: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const tagsToAdd: string[] = ["customer"];

    let textToAnalyze = "";
    let productTitle = "";

    if (args.productId) {
      const product = await ctx.db.get(args.productId);
      if (product) {
        productTitle = product.title || "";
        textToAnalyze = [
          product.title || "",
          product.description || "",
          ...(product.genre || []),
        ].join(" ");

        // Add product-specific tag (e.g., "product:epic-drums-vol-1")
        if (product.title) {
          const productSlug = generateProductTagSlug(product.title);
          if (productSlug) {
            tagsToAdd.push(`product:${productSlug}`);
          }
        }

        // Add product type interest tag
        if (product.productType && PRODUCT_TYPE_TAGS[product.productType]) {
          tagsToAdd.push(PRODUCT_TYPE_TAGS[product.productType]);
        }

        // Also check productCategory for more specific tagging
        if (product.productCategory && PRODUCT_TYPE_TAGS[product.productCategory]) {
          tagsToAdd.push(PRODUCT_TYPE_TAGS[product.productCategory]);
        }
      }
    }

    if (args.courseId) {
      const course = await ctx.db.get(args.courseId);
      if (course) {
        productTitle = course.title || "";
        textToAnalyze = [course.title || "", course.description || "", course.category || ""].join(
          " "
        );

        // Add course-specific tag (e.g., "course:mixing-masterclass")
        if (course.title) {
          const courseSlug = generateProductTagSlug(course.title);
          if (courseSlug) {
            tagsToAdd.push(`course:${courseSlug}`);
          }
        }

        tagsToAdd.push("interest:learning");

        if (course.skillLevel) {
          tagsToAdd.push(`skill:${course.skillLevel}`);
        }
      }
    }

    const genreTags = inferGenresFromText(textToAnalyze);
    tagsToAdd.push(...genreTags);

    const existingContact = await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId_and_email", (q) =>
        q.eq("storeId", args.storeId).eq("email", args.email.toLowerCase())
      )
      .first();

    let contactId: Id<"emailContacts">;
    let created = false;

    if (existingContact) {
      contactId = existingContact._id;

      const currentCustomFields = existingContact.customFields || {};
      const currentPurchasePoints = currentCustomFields.purchasePoints || 0;
      const currentTotalPoints = currentCustomFields.totalPoints || 0;
      const pointsToAdd = Math.floor(args.amount);

      await ctx.db.patch(contactId, {
        customFields: {
          ...currentCustomFields,
          purchasePoints: currentPurchasePoints + pointsToAdd,
          totalPoints: currentTotalPoints + pointsToAdd,
          lastPurchaseAt: Date.now(),
          lastActivity: Date.now(),
          purchases: [
            ...(currentCustomFields.purchases || []),
            {
              productId: args.productId,
              courseId: args.courseId,
              amount: args.amount,
              timestamp: Date.now(),
            },
          ],
        },
        engagementScore: Math.min(100, (existingContact.engagementScore || 0) + 20),
        updatedAt: Date.now(),
      });
    } else {
      const now = Date.now();
      const pointsToAdd = Math.floor(args.amount);

      contactId = await ctx.db.insert("emailContacts", {
        storeId: args.storeId,
        email: args.email.toLowerCase(),
        status: "subscribed",
        subscribedAt: now,
        tagIds: [],
        source: "purchase",
        sourceProductId: args.productId,
        sourceCourseId: args.courseId,
        emailsSent: 0,
        emailsOpened: 0,
        emailsClicked: 0,
        engagementScore: 20,
        customFields: {
          purchasePoints: pointsToAdd,
          totalPoints: pointsToAdd,
          lastPurchaseAt: now,
          lastActivity: now,
          purchases: [
            {
              productId: args.productId,
              courseId: args.courseId,
              amount: args.amount,
              timestamp: now,
            },
          ],
        },
        createdAt: now,
        updatedAt: now,
      });
      created = true;
    }

    await addTagsToContact(ctx, contactId, args.storeId, tagsToAdd);

    await ctx.db.insert("emailContactActivity", {
      contactId,
      storeId: args.storeId,
      activityType: "custom_field_updated",
      metadata: {
        fieldName: "purchase",
        newValue: productTitle,
      },
      timestamp: Date.now(),
    });

    return {
      contactId,
      created,
      tagsAdded: tagsToAdd,
    };
  },
});

export const syncContactFromEnrollment = internalMutation({
  args: {
    storeId: v.string(),
    email: v.string(),
    userId: v.string(),
    courseId: v.id("courses"),
  },
  returns: v.object({
    contactId: v.id("emailContacts"),
    created: v.boolean(),
    tagsAdded: v.array(v.string()),
    skillLevelUpdated: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    const tagsToAdd: string[] = ["interest:learning", "student"];
    let skillLevelUpdated = false;

    // Add course-specific tag using slug or generated slug from title
    const courseSlug = course.slug || generateCourseTagSlug(course.title || "");
    if (courseSlug) {
      tagsToAdd.push(`course:${courseSlug}`);
    }

    const textToAnalyze = [
      course.title || "",
      course.description || "",
      course.category || "",
    ].join(" ");

    const genreTags = inferGenresFromText(textToAnalyze);
    tagsToAdd.push(...genreTags);

    if (course.skillLevel) {
      tagsToAdd.push(`skill:${course.skillLevel}`);
    }

    if (course.category) {
      tagsToAdd.push(`category:${course.category.toLowerCase().replace(/\s+/g, "-")}`);
    }

    const existingContact = await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId_and_email", (q) =>
        q.eq("storeId", args.storeId).eq("email", args.email.toLowerCase())
      )
      .first();

    let contactId: Id<"emailContacts">;
    let created = false;

    if (existingContact) {
      contactId = existingContact._id;

      const currentCustomFields = existingContact.customFields || {};
      const updates: Record<string, any> = {
        updatedAt: Date.now(),
        customFields: {
          ...currentCustomFields,
          lastActivity: Date.now(),
          enrolledCourses: [...(currentCustomFields.enrolledCourses || []), args.courseId],
        },
      };

      if (course.skillLevel && currentCustomFields.studentLevel !== course.skillLevel) {
        updates.customFields.studentLevel = course.skillLevel;
        skillLevelUpdated = true;
      }

      if (!existingContact.sourceCourseId) {
        updates.sourceCourseId = args.courseId;
      }

      await ctx.db.patch(contactId, updates);
    } else {
      const now = Date.now();

      contactId = await ctx.db.insert("emailContacts", {
        storeId: args.storeId,
        email: args.email.toLowerCase(),
        status: "subscribed",
        subscribedAt: now,
        tagIds: [],
        source: "course_enrollment",
        sourceCourseId: args.courseId,
        emailsSent: 0,
        emailsOpened: 0,
        emailsClicked: 0,
        customFields: {
          studentLevel: course.skillLevel,
          lastActivity: now,
          enrolledCourses: [args.courseId],
        },
        createdAt: now,
        updatedAt: now,
      });
      created = true;
      skillLevelUpdated = !!course.skillLevel;
    }

    await addTagsToContact(ctx, contactId, args.storeId, tagsToAdd);

    await ctx.db.insert("emailContactActivity", {
      contactId,
      storeId: args.storeId,
      activityType: "campaign_enrolled",
      metadata: {
        tagName: `Course: ${course.title}`,
      },
      timestamp: Date.now(),
    });

    return {
      contactId,
      created,
      tagsAdded: tagsToAdd,
      skillLevelUpdated,
    };
  },
});

export const syncContactEngagement = internalMutation({
  args: {
    storeId: v.string(),
    email: v.string(),
    eventType: v.union(
      v.literal("email_opened"),
      v.literal("email_clicked"),
      v.literal("email_bounced")
    ),
    linkUrl: v.optional(v.string()),
    emailSubject: v.optional(v.string()),
  },
  returns: v.object({
    contactId: v.union(v.id("emailContacts"), v.null()),
    tagsAdded: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const contact = await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId_and_email", (q) =>
        q.eq("storeId", args.storeId).eq("email", args.email.toLowerCase())
      )
      .first();

    if (!contact) {
      return { contactId: null, tagsAdded: [] };
    }

    const tagsToAdd: string[] = [];
    const currentCustomFields = contact.customFields || {};
    const updates: Record<string, any> = {
      updatedAt: Date.now(),
    };

    if (args.eventType === "email_opened") {
      updates.emailsOpened = (contact.emailsOpened || 0) + 1;
      updates.lastOpenedAt = Date.now();
      updates.engagementScore = Math.min(100, (contact.engagementScore || 0) + 2);
      updates.customFields = {
        ...currentCustomFields,
        lastActivity: Date.now(),
        totalPoints: (currentCustomFields.totalPoints || 0) + 5,
      };
    } else if (args.eventType === "email_clicked") {
      updates.emailsClicked = (contact.emailsClicked || 0) + 1;
      updates.lastClickedAt = Date.now();
      updates.engagementScore = Math.min(100, (contact.engagementScore || 0) + 5);
      updates.customFields = {
        ...currentCustomFields,
        lastActivity: Date.now(),
        totalPoints: (currentCustomFields.totalPoints || 0) + 10,
      };

      if (args.linkUrl) {
        const url = args.linkUrl.toLowerCase();
        if (url.includes("mixing") || url.includes("mix")) {
          tagsToAdd.push("interest:mixing");
        }
        if (url.includes("mastering") || url.includes("master")) {
          tagsToAdd.push("interest:mastering");
        }
        if (url.includes("sample") || url.includes("loop")) {
          tagsToAdd.push("interest:samples");
        }
        if (url.includes("preset")) {
          tagsToAdd.push("interest:presets");
        }
        if (url.includes("course") || url.includes("learn")) {
          tagsToAdd.push("interest:learning");
        }
      }
    } else if (args.eventType === "email_bounced") {
      updates.status = "bounced";
      updates.engagementScore = Math.max(0, (contact.engagementScore || 0) - 10);
    }

    const newEngagementScore = updates.engagementScore || contact.engagementScore || 0;
    if (newEngagementScore >= 80) {
      tagsToAdd.push("engagement:hot");
    } else if (newEngagementScore >= 50) {
      tagsToAdd.push("engagement:warm");
    }

    await ctx.db.patch(contact._id, updates);

    if (tagsToAdd.length > 0) {
      await addTagsToContact(ctx, contact._id, args.storeId, tagsToAdd);
    }

    await ctx.db.insert("emailContactActivity", {
      contactId: contact._id,
      storeId: args.storeId,
      activityType: args.eventType,
      metadata: {
        emailSubject: args.emailSubject,
        linkClicked: args.linkUrl,
      },
      timestamp: Date.now(),
    });

    return {
      contactId: contact._id,
      tagsAdded: tagsToAdd,
    };
  },
});

export const manualTagContact = mutation({
  args: {
    storeId: v.string(),
    email: v.string(),
    tags: v.array(v.string()),
  },
  returns: v.object({
    contactId: v.union(v.id("emailContacts"), v.null()),
    tagsAdded: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const contact = await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId_and_email", (q) =>
        q.eq("storeId", args.storeId).eq("email", args.email.toLowerCase())
      )
      .first();

    if (!contact) {
      return { contactId: null, tagsAdded: [] };
    }

    await addTagsToContact(ctx, contact._id, args.storeId, args.tags);

    return {
      contactId: contact._id,
      tagsAdded: args.tags,
    };
  },
});

const PREBUILT_SEGMENT_TEMPLATES = [
  {
    name: "Hot Leads",
    description: "Highly engaged contacts (score >= 80)",
    tagPattern: "engagement:hot",
    color: "#EF4444",
  },
  {
    name: "Warm Leads",
    description: "Moderately engaged contacts (score >= 50)",
    tagPattern: "engagement:warm",
    color: "#F59E0B",
  },
  {
    name: "Customers",
    description: "Contacts who have made a purchase",
    tagPattern: "customer",
    color: "#10B981",
  },
  {
    name: "Beginners",
    description: "Contacts interested in beginner content",
    tagPattern: "skill:beginner",
    color: "#3B82F6",
  },
  {
    name: "Intermediate",
    description: "Contacts interested in intermediate content",
    tagPattern: "skill:intermediate",
    color: "#6366F1",
  },
  {
    name: "Advanced",
    description: "Contacts interested in advanced content",
    tagPattern: "skill:advanced",
    color: "#8B5CF6",
  },
  {
    name: "Techno Producers",
    description: "Contacts interested in techno music",
    tagPattern: "genre:techno",
    color: "#EC4899",
  },
  {
    name: "Hip-Hop Producers",
    description: "Contacts interested in hip-hop music",
    tagPattern: "genre:hip-hop",
    color: "#14B8A6",
  },
  {
    name: "House Producers",
    description: "Contacts interested in house music",
    tagPattern: "genre:house",
    color: "#F97316",
  },
  {
    name: "EDM Producers",
    description: "Contacts interested in EDM",
    tagPattern: "genre:edm",
    color: "#A855F7",
  },
  {
    name: "Sample Collectors",
    description: "Contacts interested in samples",
    tagPattern: "interest:samples",
    color: "#06B6D4",
  },
  {
    name: "Preset Hunters",
    description: "Contacts interested in presets",
    tagPattern: "interest:presets",
    color: "#84CC16",
  },
  {
    name: "Course Students",
    description: "Contacts interested in learning",
    tagPattern: "interest:learning",
    color: "#0EA5E9",
  },
  {
    name: "Mixing Enthusiasts",
    description: "Contacts interested in mixing",
    tagPattern: "interest:mixing",
    color: "#D946EF",
  },
];

export const createPrebuiltSegments = mutation({
  args: {
    storeId: v.string(),
  },
  returns: v.object({
    created: v.number(),
    skipped: v.number(),
    segments: v.array(
      v.object({
        name: v.string(),
        tagId: v.id("emailTags"),
      })
    ),
  }),
  handler: async (ctx, args) => {
    let created = 0;
    let skipped = 0;
    const segments: Array<{ name: string; tagId: Id<"emailTags"> }> = [];

    for (const template of PREBUILT_SEGMENT_TEMPLATES) {
      const existingTag = await ctx.db
        .query("emailTags")
        .withIndex("by_storeId_and_name", (q) =>
          q.eq("storeId", args.storeId).eq("name", template.tagPattern)
        )
        .first();

      if (existingTag) {
        segments.push({ name: template.name, tagId: existingTag._id });
        skipped++;
        continue;
      }

      const now = Date.now();
      const tagId = await ctx.db.insert("emailTags", {
        storeId: args.storeId,
        name: template.tagPattern,
        color: template.color,
        description: template.description,
        contactCount: 0,
        createdAt: now,
        updatedAt: now,
      });

      segments.push({ name: template.name, tagId });
      created++;
    }

    return { created, skipped, segments };
  },
});

export const getSegmentsByTag = query({
  args: {
    storeId: v.string(),
  },
  returns: v.array(
    v.object({
      tagId: v.id("emailTags"),
      tagName: v.string(),
      displayName: v.string(),
      description: v.optional(v.string()),
      color: v.string(),
      contactCount: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const tags = await ctx.db
      .query("emailTags")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .take(5000);

    const displayNameMap: Record<string, string> = {};
    for (const template of PREBUILT_SEGMENT_TEMPLATES) {
      displayNameMap[template.tagPattern] = template.name;
    }

    return tags.map((tag) => ({
      tagId: tag._id,
      tagName: tag.name,
      displayName: displayNameMap[tag.name] || tag.name,
      description: tag.description,
      color: tag.color || "#6B7280",
      contactCount: tag.contactCount,
    }));
  },
});

export const getContactsByTags = query({
  args: {
    storeId: v.string(),
    tagIds: v.array(v.id("emailTags")),
    mode: v.optional(v.union(v.literal("all"), v.literal("any"))),
    excludeTagIds: v.optional(v.array(v.id("emailTags"))),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      contactId: v.id("emailContacts"),
      email: v.string(),
      name: v.optional(v.string()),
      engagementScore: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    const mode = args.mode || "all";
    const limit = args.limit || 1000;

    const contacts = await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .filter((q) => q.eq(q.field("status"), "subscribed"))
      .take(5000);

    const matchingContacts = contacts.filter((contact) => {
      const contactTagIds = contact.tagIds || [];

      if (args.excludeTagIds && args.excludeTagIds.length > 0) {
        const hasExcludedTag = args.excludeTagIds.some((excludeId) =>
          contactTagIds.includes(excludeId)
        );
        if (hasExcludedTag) return false;
      }

      if (args.tagIds.length === 0) return true;

      if (mode === "all") {
        return args.tagIds.every((tagId) => contactTagIds.includes(tagId));
      } else {
        return args.tagIds.some((tagId) => contactTagIds.includes(tagId));
      }
    });

    return matchingContacts.slice(0, limit).map((c) => ({
      contactId: c._id,
      email: c.email,
      name: c.firstName ? `${c.firstName} ${c.lastName || ""}`.trim() : undefined,
      engagementScore: c.engagementScore,
    }));
  },
});

/**
 * Re-tag contacts based on their purchase history, enrollments, and engagement.
 * This processes contacts in batches to avoid document read limits.
 * Call repeatedly with cursor until done is true.
 */
export const retagAllContacts = mutation({
  args: {
    storeId: v.string(),
    cursor: v.optional(v.string()),
    batchSize: v.optional(v.number()),
  },
  returns: v.object({
    processed: v.number(),
    tagsAdded: v.number(),
    errors: v.number(),
    nextCursor: v.union(v.string(), v.null()),
    done: v.boolean(),
  }),
  handler: async (ctx, args) => {
    let processed = 0;
    let tagsAdded = 0;
    let errors = 0;
    const BATCH_SIZE = args.batchSize || 25; // Process 25 contacts at a time to stay well under limits

    // Get a batch of contacts for this store using pagination
    let query = ctx.db
      .query("emailContacts")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId));

    const paginationResult = await query.paginate({
      numItems: BATCH_SIZE,
      cursor: args.cursor ? (args.cursor as any) : null,
    });

    const contacts = paginationResult.page;
    const nextCursor = paginationResult.continueCursor;
    const isDone = paginationResult.isDone;

    // Get the actual store to find courses (only once per batch)
    const store = await ctx.db
      .query("stores")
      .withIndex("by_userId", (q) => q.eq("userId", args.storeId))
      .first();

    for (const contact of contacts) {
      try {
        const tagsToAdd: string[] = [];

        // 1. Check if they have a customerId - means they're a customer
        if (contact.customerId) {
          tagsToAdd.push("customer");

          // Get customer to check purchase history
          const customer = await ctx.db.get(contact.customerId);
          if (customer) {
            // Check purchases from customer record
            const purchases = await ctx.db
              .query("purchases")
              .withIndex("by_customerId", (q) => q.eq("customerId", contact.customerId!))
              .take(5000);

            for (const purchase of purchases) {
              // Check if it's a product purchase
              if (purchase.productId) {
                const product = await ctx.db.get(purchase.productId);
                if (product) {
                  // Add product type tag
                  if (product.productType && PRODUCT_TYPE_TAGS[product.productType]) {
                    tagsToAdd.push(PRODUCT_TYPE_TAGS[product.productType]);
                  }
                  // Infer genres from product
                  const textToAnalyze = [
                    product.title || "",
                    product.description || "",
                    ...(product.genre || []),
                  ].join(" ");
                  tagsToAdd.push(...inferGenresFromText(textToAnalyze));

                  // Infer skill level
                  const skillLevel = inferSkillLevelFromText(textToAnalyze);
                  if (skillLevel) {
                    tagsToAdd.push(`skill:${skillLevel}`);
                  }
                }
              }

              // Check if it's a course purchase
              if (purchase.courseId) {
                const course = await ctx.db.get(purchase.courseId);
                if (course) {
                  tagsToAdd.push("interest:learning");
                  tagsToAdd.push("student");

                  // Add course-specific tag
                  const courseSlug = course.slug || generateCourseTagSlug(course.title || "");
                  if (courseSlug) {
                    tagsToAdd.push(`course:${courseSlug}`);
                  }

                  if (course.skillLevel) {
                    tagsToAdd.push(`skill:${course.skillLevel}`);
                  }
                  if (course.category) {
                    tagsToAdd.push(
                      `category:${course.category.toLowerCase().replace(/\s+/g, "-")}`
                    );
                  }

                  const textToAnalyze = [
                    course.title || "",
                    course.description || "",
                    course.category || "",
                  ].join(" ");
                  tagsToAdd.push(...inferGenresFromText(textToAnalyze));
                }
              }
            }
          }
        }

        // 2. Check customFields for enrolled courses
        const customFields = contact.customFields || {};
        if (customFields.enrolledCourses && Array.isArray(customFields.enrolledCourses)) {
          for (const courseId of customFields.enrolledCourses) {
            try {
              const course = await ctx.db.get(courseId as Id<"courses">);
              if (course) {
                tagsToAdd.push("interest:learning");
                tagsToAdd.push("student");

                // Add course-specific tag
                const courseSlug = course.slug || generateCourseTagSlug(course.title || "");
                if (courseSlug) {
                  tagsToAdd.push(`course:${courseSlug}`);
                }

                if (course.skillLevel) {
                  tagsToAdd.push(`skill:${course.skillLevel}`);
                }
                if (course.category) {
                  tagsToAdd.push(`category:${course.category.toLowerCase().replace(/\s+/g, "-")}`);
                }

                const textToAnalyze = [
                  course.title || "",
                  course.description || "",
                  course.category || "",
                ].join(" ");
                tagsToAdd.push(...inferGenresFromText(textToAnalyze));
              }
            } catch {
              // Course might not exist anymore
            }
          }
        }

        // 3. Check customFields for follow gate products
        if (customFields.followGateProducts && Array.isArray(customFields.followGateProducts)) {
          for (const productId of customFields.followGateProducts) {
            try {
              const product = await ctx.db.get(productId as Id<"digitalProducts">);
              if (product) {
                if (product.productType && PRODUCT_TYPE_TAGS[product.productType]) {
                  tagsToAdd.push(PRODUCT_TYPE_TAGS[product.productType]);
                }

                const textToAnalyze = [
                  product.title || "",
                  product.description || "",
                  ...(product.genre || []),
                ].join(" ");
                tagsToAdd.push(...inferGenresFromText(textToAnalyze));

                const skillLevel = inferSkillLevelFromText(textToAnalyze);
                if (skillLevel) {
                  tagsToAdd.push(`skill:${skillLevel}`);
                }
              }
            } catch {
              // Product might not exist anymore
            }
          }
          tagsToAdd.push("source:follow-gate");
        }

        // 4. Check source-based tags
        if (contact.source === "purchase" || contact.source === "customer_sync") {
          tagsToAdd.push("customer");
        }
        if (contact.source === "course_enrollment" || contact.source === "student_sync") {
          tagsToAdd.push("student");
          tagsToAdd.push("interest:learning");
        }
        if (contact.source === "follow_gate") {
          tagsToAdd.push("lead");
        }

        // 5. Check engagement score for engagement tags
        const engagementScore = contact.engagementScore || 0;
        if (engagementScore >= 80) {
          tagsToAdd.push("engagement:hot");
        } else if (engagementScore >= 50) {
          tagsToAdd.push("engagement:warm");
        } else if (engagementScore < 20 && contact.emailsSent > 5) {
          tagsToAdd.push("engagement:cold");
        }

        // 6. Check for source product/course
        if (contact.sourceProductId) {
          try {
            const product = await ctx.db.get(contact.sourceProductId);
            if (product) {
              if (product.productType && PRODUCT_TYPE_TAGS[product.productType]) {
                tagsToAdd.push(PRODUCT_TYPE_TAGS[product.productType]);
              }
              const textToAnalyze = [
                product.title || "",
                product.description || "",
                ...(product.genre || []),
              ].join(" ");
              tagsToAdd.push(...inferGenresFromText(textToAnalyze));
            }
          } catch {
            // Product might not exist
          }
        }

        if (contact.sourceCourseId) {
          try {
            const course = await ctx.db.get(contact.sourceCourseId);
            if (course) {
              tagsToAdd.push("interest:learning");
              if (course.skillLevel) {
                tagsToAdd.push(`skill:${course.skillLevel}`);
              }
              if (course.category) {
                tagsToAdd.push(`category:${course.category.toLowerCase().replace(/\s+/g, "-")}`);
              }
            }
          } catch {
            // Course might not exist
          }
        }

        // Deduplicate tags
        const uniqueTags = [...new Set(tagsToAdd)];

        // Add tags to contact
        if (uniqueTags.length > 0) {
          await addTagsToContact(ctx, contact._id, args.storeId, uniqueTags);
          tagsAdded += uniqueTags.length;
        }

        processed++;
      } catch (error) {
        console.error(`Error processing contact ${contact._id}:`, error);
        errors++;
      }
    }

    return {
      processed,
      tagsAdded,
      errors,
      nextCursor: isDone ? null : nextCursor,
      done: isDone,
    };
  },
});

/**
 * Tag enrolled users with course-specific tags.
 * This is much faster than retagAllContacts because it only processes enrolled users
 * by looking at the enrollments table directly, rather than scanning all contacts.
 */
export const tagEnrolledUsersWithCourseTags = mutation({
  args: {
    storeId: v.string(), // Clerk userId from frontend
    cursor: v.optional(v.string()),
    batchSize: v.optional(v.number()),
  },
  returns: v.object({
    processed: v.number(),
    tagsAdded: v.number(),
    errors: v.number(),
    nextCursor: v.union(v.string(), v.null()),
    done: v.boolean(),
  }),
  handler: async (ctx, args) => {
    let processed = 0;
    let tagsAdded = 0;
    let errors = 0;
    const BATCH_SIZE = args.batchSize || 50;

    // Get the actual store
    const store = await ctx.db
      .query("stores")
      .withIndex("by_userId", (q) => q.eq("userId", args.storeId))
      .first();

    if (!store) {
      return { processed: 0, tagsAdded: 0, errors: 0, nextCursor: null, done: true };
    }

    // Get all courses for this store (cache for the batch)
    const coursesByStoreId = await ctx.db
      .query("courses")
      .withIndex("by_storeId", (q) => q.eq("storeId", store._id))
      .take(5000);
    const coursesByUserId = await ctx.db
      .query("courses")
      .withIndex("by_userId", (q) => q.eq("userId", args.storeId))
      .take(5000);

    // Merge and deduplicate courses, create lookup map
    const coursesMap = new Map<string, (typeof coursesByStoreId)[0]>();
    for (const course of [...coursesByStoreId, ...coursesByUserId]) {
      if (!coursesMap.has(course._id.toString())) {
        coursesMap.set(course._id.toString(), course);
      }
    }

    if (coursesMap.size === 0) {
      return { processed: 0, tagsAdded: 0, errors: 0, nextCursor: null, done: true };
    }

    const courseIds = new Set(coursesMap.keys());

    // Paginate through enrollments
    const paginationResult = await ctx.db.query("enrollments").paginate({
      numItems: BATCH_SIZE * 3, // Fetch more since we'll filter
      cursor: args.cursor ? (args.cursor as any) : null,
    });

    // Filter to only enrollments for this store's courses
    const storeEnrollments = paginationResult.page.filter((e) => courseIds.has(e.courseId));

    // Group enrollments by user
    const enrollmentsByUser = new Map<string, string[]>();
    for (const enrollment of storeEnrollments) {
      const existing = enrollmentsByUser.get(enrollment.userId) || [];
      existing.push(enrollment.courseId);
      enrollmentsByUser.set(enrollment.userId, existing);
    }

    // Process each unique user in this batch
    for (const [clerkId, userCourseIds] of enrollmentsByUser) {
      try {
        // Find the user
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
          .first();

        if (!user?.email) {
          errors++;
          continue;
        }

        // Find their contact
        const contact = await ctx.db
          .query("emailContacts")
          .withIndex("by_storeId_and_email", (q) =>
            q.eq("storeId", args.storeId).eq("email", user.email!.toLowerCase())
          )
          .first();

        if (!contact) {
          // No contact exists - they weren't synced yet
          errors++;
          continue;
        }

        // Build tags for all their enrolled courses
        const tagsToAdd: string[] = ["student", "interest:learning"];

        for (const courseIdStr of userCourseIds) {
          const course = coursesMap.get(courseIdStr);
          if (!course) continue;

          // Add course-specific tag
          const courseSlug = course.slug || generateCourseTagSlug(course.title || "");
          if (courseSlug) {
            tagsToAdd.push(`course:${courseSlug}`);
          }

          // Add category and skill tags
          if (course.skillLevel) {
            tagsToAdd.push(`skill:${course.skillLevel}`);
          }
          if (course.category) {
            tagsToAdd.push(`category:${course.category.toLowerCase().replace(/\s+/g, "-")}`);
          }

          // Infer genre tags
          const textToAnalyze = [
            course.title || "",
            course.description || "",
            course.category || "",
          ].join(" ");
          tagsToAdd.push(...inferGenresFromText(textToAnalyze));
        }

        // Deduplicate and add tags
        const uniqueTags = [...new Set(tagsToAdd)];
        if (uniqueTags.length > 0) {
          await addTagsToContact(ctx, contact._id, args.storeId, uniqueTags);
          tagsAdded += uniqueTags.length;
        }

        processed++;
      } catch (error) {
        console.error(`Error processing user ${clerkId}:`, error);
        errors++;
      }
    }

    return {
      processed,
      tagsAdded,
      errors,
      nextCursor: paginationResult.isDone ? null : paginationResult.continueCursor,
      done: paginationResult.isDone,
    };
  },
});

/**
 * Manually tag a specific contact with their course enrollments.
 * Use this to fix contacts that didn't get tagged properly.
 */
export const tagContactWithEnrollments = mutation({
  args: {
    storeId: v.string(),
    contactId: v.id("emailContacts"),
  },
  returns: v.object({
    success: v.boolean(),
    tagsAdded: v.array(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // 1. Get the contact
    const contact = await ctx.db.get(args.contactId);
    if (!contact) {
      return { success: false, tagsAdded: [], error: "Contact not found" };
    }

    // 2. Find the user by email
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), contact.email))
      .first();

    if (!user) {
      return { success: false, tagsAdded: [], error: `No user found with email ${contact.email}` };
    }

    // 3. Get the store
    const store = await ctx.db
      .query("stores")
      .withIndex("by_userId", (q) => q.eq("userId", args.storeId))
      .first();

    // 4. Get all courses for this store
    const coursesByStoreId = store
      ? await ctx.db
          .query("courses")
          .withIndex("by_storeId", (q) => q.eq("storeId", store._id))
          .take(5000)
      : [];
    const coursesByUserId = await ctx.db
      .query("courses")
      .withIndex("by_userId", (q) => q.eq("userId", args.storeId))
      .take(5000);

    const coursesMap = new Map<string, (typeof coursesByStoreId)[0]>();
    for (const course of [...coursesByStoreId, ...coursesByUserId]) {
      coursesMap.set(course._id.toString(), course);
    }

    if (coursesMap.size === 0) {
      return { success: false, tagsAdded: [], error: "No courses found for this store" };
    }

    // 5. Find all enrollments for this user (try multiple ID formats)
    const possibleUserIds = [user.clerkId, user._id.toString(), contact.email].filter(Boolean);

    let allEnrollments: any[] = [];
    for (const userId of possibleUserIds) {
      const enrollments = await ctx.db
        .query("enrollments")
        .withIndex("by_userId", (q) => q.eq("userId", userId as string))
        .take(5000);
      allEnrollments = [...allEnrollments, ...enrollments];
    }

    // Deduplicate enrollments
    const seenCourseIds = new Set<string>();
    const uniqueEnrollments = allEnrollments.filter((e) => {
      if (seenCourseIds.has(e.courseId)) return false;
      seenCourseIds.add(e.courseId);
      return true;
    });

    // 6. Filter to this store's courses
    const storeEnrollments = uniqueEnrollments.filter((e) => coursesMap.has(e.courseId));

    if (storeEnrollments.length === 0) {
      return {
        success: false,
        tagsAdded: [],
        error: `No enrollments found. Checked ${uniqueEnrollments.length} total enrollments, ${coursesMap.size} store courses. User IDs tried: ${possibleUserIds.join(", ")}`,
      };
    }

    // 7. Build tags
    const tagsToAdd: string[] = ["student", "interest:learning"];

    for (const enrollment of storeEnrollments) {
      const course = coursesMap.get(enrollment.courseId);
      if (!course) continue;

      const courseSlug = course.slug || generateCourseTagSlug(course.title || "");
      if (courseSlug) {
        tagsToAdd.push(`course:${courseSlug}`);
      }

      if (course.skillLevel) {
        tagsToAdd.push(`skill:${course.skillLevel}`);
      }
      if (course.category) {
        tagsToAdd.push(`category:${course.category.toLowerCase().replace(/\s+/g, "-")}`);
      }
    }

    // 8. Add tags
    const uniqueTags = [...new Set(tagsToAdd)];
    await addTagsToContact(ctx, args.contactId, args.storeId, uniqueTags);

    return { success: true, tagsAdded: uniqueTags };
  },
});

/**
 * Debug function to check why a contact doesn't have tags.
 * Returns diagnostic info about enrollments and tagging.
 */
export const debugContactTags = query({
  args: {
    storeId: v.string(),
    email: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase();

    // 1. Find the contact
    const contact = await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId_and_email", (q) => q.eq("storeId", args.storeId).eq("email", email))
      .first();

    if (!contact) {
      return { error: "Contact not found", email, storeId: args.storeId };
    }

    // 2. Find the user by email
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), email))
      .first();

    if (!user) {
      return {
        error: "User not found by email",
        email,
        contact: { id: contact._id, tagIds: contact.tagIds },
      };
    }

    // 3. Get the store
    const store = await ctx.db
      .query("stores")
      .withIndex("by_userId", (q) => q.eq("userId", args.storeId))
      .first();

    // 4. Get courses for this store
    const coursesByStoreId = store
      ? await ctx.db
          .query("courses")
          .withIndex("by_storeId", (q) => q.eq("storeId", store._id))
          .take(5000)
      : [];
    const coursesByUserId = await ctx.db
      .query("courses")
      .withIndex("by_userId", (q) => q.eq("userId", args.storeId))
      .take(5000);

    const allCourses = [...coursesByStoreId, ...coursesByUserId];
    const courseIds = new Set(allCourses.map((c) => c._id.toString()));

    // 5. Find enrollments for this user
    const userEnrollments = await ctx.db
      .query("enrollments")
      .withIndex("by_userId", (q) => q.eq("userId", user.clerkId || ""))
      .take(5000);

    // 6. Filter to this store's courses
    const storeEnrollments = userEnrollments.filter((e) => courseIds.has(e.courseId));

    // 7. Get current tags
    const currentTags = await Promise.all(
      (contact.tagIds || []).map(async (tagId: any) => {
        const tag = await ctx.db.get(tagId);
        return tag ? { id: tagId, name: (tag as any).name } : { id: tagId, name: "deleted" };
      })
    );

    return {
      contact: {
        id: contact._id,
        email: contact.email,
        tagCount: contact.tagIds?.length || 0,
        currentTags,
      },
      user: {
        id: user._id,
        clerkId: user.clerkId,
        email: user.email,
      },
      store: store ? { id: store._id, name: (store as any).name } : null,
      courses: {
        total: allCourses.length,
        sample: allCourses.slice(0, 3).map((c) => ({ id: c._id, title: c.title })),
      },
      enrollments: {
        totalForUser: userEnrollments.length,
        forThisStore: storeEnrollments.length,
        sample: storeEnrollments.slice(0, 5).map((e) => ({
          courseId: e.courseId,
          matchesCourse: courseIds.has(e.courseId),
        })),
      },
    };
  },
});

/**
 * Retroactively tag purchasers of a specific product with product-specific tags.
 * Use this to add tags to contacts who purchased before the automation was set up.
 */
export const tagProductPurchasers = mutation({
  args: {
    storeId: v.string(),
    productId: v.optional(v.id("digitalProducts")),
    courseId: v.optional(v.id("courses")),
  },
  returns: v.object({
    processed: v.number(),
    contactsTagged: v.number(),
    alreadyTagged: v.number(),
    noContact: v.number(),
    productTitle: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    let processed = 0;
    let contactsTagged = 0;
    let alreadyTagged = 0;
    let noContact = 0;
    let productTitle: string | undefined;

    // Get all purchases for this product/course
    const purchases = await ctx.db.query("purchases").take(10000);

    // Filter to this store's purchases for the specific product
    const relevantPurchases = purchases.filter((p) => {
      if (args.productId) {
        return p.productId === args.productId;
      }
      if (args.courseId) {
        return p.courseId === args.courseId;
      }
      return false;
    });

    // Get product/course title for the tag
    if (args.productId) {
      const product = await ctx.db.get(args.productId);
      productTitle = product?.title;
    } else if (args.courseId) {
      const course = await ctx.db.get(args.courseId);
      productTitle = course?.title;
    }

    if (!productTitle) {
      return { processed: 0, contactsTagged: 0, alreadyTagged: 0, noContact: 0, productTitle };
    }

    // Generate the tag name
    const tagSlug = generateProductTagSlug(productTitle);
    const tagName = args.courseId ? `course:${tagSlug}` : `product:${tagSlug}`;

    // Process each purchase
    for (const purchase of relevantPurchases) {
      processed++;

      // Find the user
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", purchase.userId))
        .first();

      if (!user?.email) {
        noContact++;
        continue;
      }

      // Find the contact
      const contact = await ctx.db
        .query("emailContacts")
        .withIndex("by_storeId_and_email", (q) =>
          q.eq("storeId", args.storeId).eq("email", user.email!.toLowerCase())
        )
        .first();

      if (!contact) {
        noContact++;
        continue;
      }

      // Check if already has the tag
      const existingTag = await ctx.db
        .query("emailTags")
        .withIndex("by_storeId_and_name", (q) => q.eq("storeId", args.storeId).eq("name", tagName))
        .first();

      if (existingTag && contact.tagIds?.includes(existingTag._id)) {
        alreadyTagged++;
        continue;
      }

      // Add the tag
      await addTagsToContact(ctx, contact._id, args.storeId, [tagName, "customer"]);
      contactsTagged++;
    }

    return {
      processed,
      contactsTagged,
      alreadyTagged,
      noContact,
      productTitle,
    };
  },
});

/**
 * Get contacts who purchased a specific product, with their tag status.
 * Useful for seeing who needs to be retroactively tagged.
 */
export const getProductPurchasers = query({
  args: {
    storeId: v.string(),
    productId: v.optional(v.id("digitalProducts")),
    courseId: v.optional(v.id("courses")),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      email: v.string(),
      name: v.optional(v.string()),
      purchaseDate: v.number(),
      hasProductTag: v.boolean(),
      contactId: v.optional(v.id("emailContacts")),
    })
  ),
  handler: async (ctx, args) => {
    const limit = args.limit || 100;

    // Get all purchases for this product/course
    const purchases = await ctx.db.query("purchases").take(10000);

    // Filter to relevant purchases
    const relevantPurchases = purchases.filter((p) => {
      if (args.productId) {
        return p.productId === args.productId;
      }
      if (args.courseId) {
        return p.courseId === args.courseId;
      }
      return false;
    });

    // Get product/course title for the tag
    let productTitle: string | undefined;
    if (args.productId) {
      const product = await ctx.db.get(args.productId);
      productTitle = product?.title;
    } else if (args.courseId) {
      const course = await ctx.db.get(args.courseId);
      productTitle = course?.title;
    }

    if (!productTitle) {
      return [];
    }

    // Generate the tag name
    const tagSlug = generateProductTagSlug(productTitle);
    const tagName = args.courseId ? `course:${tagSlug}` : `product:${tagSlug}`;

    // Find the tag
    const tag = await ctx.db
      .query("emailTags")
      .withIndex("by_storeId_and_name", (q) => q.eq("storeId", args.storeId).eq("name", tagName))
      .first();

    const results: Array<{
      email: string;
      name?: string;
      purchaseDate: number;
      hasProductTag: boolean;
      contactId?: Id<"emailContacts">;
    }> = [];

    // Process each purchase
    for (const purchase of relevantPurchases.slice(0, limit)) {
      // Find the user
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", purchase.userId))
        .first();

      if (!user?.email) {
        continue;
      }

      // Find the contact
      const contact = await ctx.db
        .query("emailContacts")
        .withIndex("by_storeId_and_email", (q) =>
          q.eq("storeId", args.storeId).eq("email", user.email!.toLowerCase())
        )
        .first();

      const hasProductTag = tag && contact?.tagIds?.includes(tag._id);

      results.push({
        email: user.email,
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || undefined,
        purchaseDate: purchase._creationTime,
        hasProductTag: !!hasProductTag,
        contactId: contact?._id,
      });
    }

    return results;
  },
});

/**
 * Creator Readiness Tagging
 * Tags platform users (admin-level contacts) based on their creator readiness journey.
 * Called by conversion nudge triggers to segment contacts for creator-focused email campaigns.
 *
 * Tags added:
 * - creator:curious - Viewed creator profiles (3+)
 * - creator:potential - Level 5+ or completed a course
 * - creator:ready - Level 8+ or earned certificate
 * - creator:expert - Level 10+ or multiple certificates
 * - creator:converted - Has created a store
 */

const ADMIN_STORE_ID = "admin"; // Admin-level contacts use "admin" as storeId

export const syncCreatorReadinessTag = internalMutation({
  args: {
    userId: v.string(),
    userEmail: v.string(),
    readinessLevel: v.union(
      v.literal("curious"),      // Showed interest in creators
      v.literal("potential"),    // L5+ or course completed
      v.literal("ready"),        // L8+ or certificate earned
      v.literal("expert"),       // L10+ or multi-cert
      v.literal("converted")     // Created a store
    ),
    contextData: v.optional(v.object({
      level: v.optional(v.number()),
      totalXP: v.optional(v.number()),
      coursesCompleted: v.optional(v.number()),
      certificatesEarned: v.optional(v.number()),
      hasStore: v.optional(v.boolean()),
      lessonCount: v.optional(v.number()),
    })),
  },
  returns: v.object({
    contactId: v.union(v.id("emailContacts"), v.null()),
    tagAdded: v.string(),
    previousTags: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    // Find the contact by email in admin store
    const contact = await ctx.db
      .query("emailContacts")
      .withIndex("by_storeId_and_email", (q) =>
        q.eq("storeId", ADMIN_STORE_ID).eq("email", args.userEmail.toLowerCase())
      )
      .first();

    if (!contact) {
      // Contact doesn't exist in admin store - create one
      const now = Date.now();
      const contactId = await ctx.db.insert("emailContacts", {
        storeId: ADMIN_STORE_ID,
        email: args.userEmail.toLowerCase(),
        status: "subscribed",
        subscribedAt: now,
        tagIds: [],
        source: "platform_user",
        emailsSent: 0,
        emailsOpened: 0,
        emailsClicked: 0,
        customFields: {
          userId: args.userId,
          creatorReadiness: args.readinessLevel,
          ...(args.contextData || {}),
          lastActivity: now,
        },
        createdAt: now,
        updatedAt: now,
      });

      const tagName = `creator:${args.readinessLevel}`;
      await addTagsToContact(ctx, contactId, ADMIN_STORE_ID, [tagName]);

      return {
        contactId,
        tagAdded: tagName,
        previousTags: [],
      };
    }

    // Contact exists - update their creator readiness
    const tagName = `creator:${args.readinessLevel}`;

    // Get existing creator tags to track progression
    const existingTags = await ctx.db
      .query("emailTags")
      .withIndex("by_storeId_and_name")
      .filter((q) => q.eq(q.field("storeId"), ADMIN_STORE_ID))
      .take(5000);

    const creatorTagIds = existingTags
      .filter((t) => t.name.startsWith("creator:"))
      .map((t) => t._id);

    const previousCreatorTags = existingTags
      .filter((t) => t.name.startsWith("creator:") && contact.tagIds.includes(t._id))
      .map((t) => t.name);

    // Update contact custom fields
    const currentCustomFields = contact.customFields || {};
    await ctx.db.patch(contact._id, {
      customFields: {
        ...currentCustomFields,
        userId: args.userId,
        creatorReadiness: args.readinessLevel,
        ...(args.contextData || {}),
        lastActivity: Date.now(),
      },
      updatedAt: Date.now(),
    });

    // Add the new tag
    await addTagsToContact(ctx, contact._id, ADMIN_STORE_ID, [tagName]);

    // Log activity
    await ctx.db.insert("emailContactActivity", {
      contactId: contact._id,
      storeId: ADMIN_STORE_ID,
      activityType: "custom_field_updated",
      metadata: {
        fieldName: "creatorReadiness",
        newValue: args.readinessLevel,
        oldValue: currentCustomFields.creatorReadiness as string | undefined,
      },
      timestamp: Date.now(),
    });

    return {
      contactId: contact._id,
      tagAdded: tagName,
      previousTags: previousCreatorTags,
    };
  },
});

/**
 * Calculate user level from XP (same formula used in gamification)
 */
function calculateLevelFromXP(xp: number): number {
  if (xp < 100) return 1;
  if (xp < 250) return 2;
  if (xp < 500) return 3;
  if (xp < 1000) return 4;
  if (xp < 2000) return 5;
  if (xp < 3500) return 6;
  if (xp < 5500) return 7;
  if (xp < 8000) return 8;
  if (xp < 11000) return 9;
  if (xp < 15000) return 10;
  // Beyond level 10, each level requires 5000 more XP
  return 10 + Math.floor((xp - 15000) / 5000);
}

/**
 * Batch update creator readiness tags based on user stats
 * Can be run as a scheduled job or manually triggered
 */
export const batchUpdateCreatorReadiness = internalMutation({
  args: {},
  returns: v.object({
    processed: v.number(),
    updated: v.number(),
  }),
  handler: async (ctx) => {
    // Get all users with their stats
    const users = await ctx.db.query("users").take(10000);

    let processed = 0;
    let updated = 0;

    for (const user of users) {
      if (!user.email || !user.clerkId) continue;
      processed++;

      // Get user's XP from userXP table
      const userXPRecord = await ctx.db
        .query("userXP")
        .withIndex("by_userId", (q) => q.eq("userId", user.clerkId!))
        .first();
      const totalXP = userXPRecord?.totalXP || 0;
      const level = calculateLevelFromXP(totalXP);

      // Count certificates
      const certificates = await ctx.db
        .query("certificates")
        .withIndex("by_user", (q) => q.eq("userId", user.clerkId!))
        .take(5000);
      const certificatesEarned = certificates.length;

      // Count completed enrollments - use enrollments table and check progress
      const enrollments = await ctx.db
        .query("enrollments")
        .withIndex("by_userId", (q) => q.eq("userId", user.clerkId!))
        .take(5000);
      // Count as "completed" if progress is 100%
      const coursesCompleted = enrollments.filter((e) => (e.progress || 0) >= 100).length;

      // Check if user has a store
      const store = await ctx.db
        .query("stores")
        .withIndex("by_userId", (q) => q.eq("userId", user.clerkId!))
        .first();
      const hasStore = !!store;

      // Determine readiness level
      let readinessLevel: "curious" | "potential" | "ready" | "expert" | "converted";

      if (hasStore) {
        readinessLevel = "converted";
      } else if (level >= 10 || certificatesEarned >= 2) {
        readinessLevel = "expert";
      } else if (level >= 8 || certificatesEarned >= 1) {
        readinessLevel = "ready";
      } else if (level >= 5 || coursesCompleted >= 1) {
        readinessLevel = "potential";
      } else {
        // Skip users who haven't shown any readiness signals
        continue;
      }

      // Update the tag
      await ctx.scheduler.runAfter(0, internal.emailContactSync.syncCreatorReadinessTag, {
        userId: user.clerkId,
        userEmail: user.email,
        readinessLevel,
        contextData: {
          level,
          totalXP,
          coursesCompleted,
          certificatesEarned,
          hasStore,
        },
      });

      updated++;
    }

    return { processed, updated };
  },
});

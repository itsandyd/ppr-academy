import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
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
      .collect();

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
      .collect();

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
              .collect();

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

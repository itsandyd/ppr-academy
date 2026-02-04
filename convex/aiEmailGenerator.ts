"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { callLLM, safeParseJson } from "./masterAI/llmClient";
import type { ModelId } from "./masterAI/types";

// Model to use for email generation - Claude 4.5 Sonnet for best copywriting
const EMAIL_MODEL: ModelId = "claude-4.5-sonnet";

/**
 * Generate email content for workflow emails using course/store context
 */
export const generateWorkflowEmail = action({
  args: {
    storeId: v.string(),
    emailType: v.union(
      v.literal("welcome"),
      v.literal("nurture"),
      v.literal("pitch"),
      v.literal("follow_up"),
      v.literal("thank_you"),
      v.literal("reminder"),
      v.literal("custom")
    ),
    contextType: v.union(
      v.literal("course"),
      v.literal("store"),
      v.literal("product"),
      v.literal("custom")
    ),
    courseId: v.optional(v.id("courses")),
    productId: v.optional(v.id("digitalProducts")),
    customPrompt: v.optional(v.string()),
    tone: v.optional(v.union(
      v.literal("professional"),
      v.literal("friendly"),
      v.literal("casual"),
      v.literal("urgent"),
      v.literal("educational")
    )),
  },
  returns: v.object({
    subject: v.string(),
    previewText: v.string(),
    body: v.string(),
  }),
  handler: async (ctx, args) => {
    // Gather context based on contextType
    let contextInfo = "";

    if (args.contextType === "course" && args.courseId) {
      // Fetch course details with instructor info
      const courseData = await ctx.runQuery(api.courses.getCourseWithInstructor, { courseId: args.courseId });
      if (courseData?.course) {
        const course = courseData.course;
        contextInfo = `
COURSE INFORMATION:
- Title: ${course.title}
- Description: ${course.description || "No description"}
- Category: ${course.category || "General"}
- Price: ${course.price ? `$${course.price}` : "Free"}
- What students will learn: ${course.outcomes || "Various skills and knowledge"}
`;
        if (courseData.instructor) {
          contextInfo += `
INSTRUCTOR:
- Name: ${courseData.instructor.name}
- Bio: ${courseData.instructor.bio || "Experienced instructor"}
`;
        }
      }
    } else if (args.contextType === "product" && args.productId) {
      // Fetch digital product details
      const product = await ctx.runQuery(api.digitalProducts.getProductById, { productId: args.productId });
      if (product) {
        contextInfo = `
PRODUCT INFORMATION:
- Name: ${product.title}
- Description: ${product.description || "No description"}
- Type: ${product.productCategory || product.productType || "Digital Product"}
- Price: ${product.price ? `$${product.price}` : "Free"}
`;
      }
    } else if (args.contextType === "store") {
      // Fetch store details
      const store = await ctx.runQuery(api.stores.getUserStore, { userId: args.storeId });
      if (store) {
        contextInfo = `
STORE/BRAND INFORMATION:
- Store Name: ${store.name || "Creator Store"}
- Description: ${store.description || "No description"}
- Bio: ${store.bio || ""}
`;
      }
    }

    // Add custom prompt if provided
    if (args.customPrompt) {
      contextInfo += `\nADDITIONAL CONTEXT:\n${args.customPrompt}`;
    }

    const tone = args.tone || "friendly";
    const toneDescriptions: Record<string, string> = {
      professional: "professional, polished, and business-appropriate",
      friendly: "warm, personable, and conversational",
      casual: "relaxed, informal, and approachable",
      urgent: "time-sensitive with clear calls to action",
      educational: "informative, helpful, and teaching-oriented",
    };

    const emailTypePrompts: Record<string, string> = {
      welcome: "Write a welcome email that introduces the subscriber to the brand/course and sets expectations for what they'll receive.",
      nurture: "Write a nurture email that provides value, shares a tip or insight, and builds trust without being salesy.",
      pitch: "Write a sales email that highlights benefits, addresses objections, and includes a clear call to action to purchase.",
      follow_up: "Write a follow-up email checking in on progress, offering help, and keeping engagement high.",
      thank_you: "Write a thank you email expressing gratitude for a purchase/action and providing next steps.",
      reminder: "Write a reminder email that creates urgency and encourages action.",
      custom: args.customPrompt || "Write a compelling email based on the provided context.",
    };

    const systemPrompt = `You are an expert email copywriter who creates high-converting emails for creators and businesses.

Your emails should be:
- ${toneDescriptions[tone]}
- Scannable with short paragraphs
- Include personalization placeholders: {{firstName}}, {{senderName}}
- Have a clear single call-to-action
- Be authentic and not overly salesy

Format the body as clean HTML with:
- <p> tags for paragraphs
- <strong> for emphasis
- <ul>/<li> for lists
- <a href="[link]"> for links (use [link] as placeholder)
- <blockquote> for testimonials/quotes

DO NOT include full HTML document structure - just the body content.

Return JSON with exactly these fields:
{
  "subject": "Email subject line (50 chars max, compelling)",
  "previewText": "Preview text shown in inbox (80 chars max)",
  "body": "HTML email body content"
}`;

    const userPrompt = `${emailTypePrompts[args.emailType]}

${contextInfo}

Generate an email that feels personal and authentic to the creator's brand.`;

    console.log(`🤖 Generating workflow email with ${EMAIL_MODEL}...`);

    const response = await callLLM({
      model: EMAIL_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      responseFormat: "json",
      temperature: 0.8,
    });

    const result = safeParseJson<{ subject?: string; previewText?: string; body?: string }>(response.content, {});

    return {
      subject: result.subject || "Hello!",
      previewText: result.previewText || "",
      body: result.body || "<p>Email content here</p>",
    };
  },
});

/**
 * Generate email template content using OpenAI
 */
export const generateEmailTemplate = action({
  args: {
    prompt: v.string(),
    templateType: v.optional(v.string()),
  },
  returns: v.object({
    name: v.string(),
    subject: v.string(),
    htmlContent: v.string(),
    textContent: v.string(),
  }),
  handler: async (ctx, args) => {
    const systemPrompt = `You are an expert email copywriter and HTML email designer.
Generate professional, engaging email templates with proper HTML structure.
The emails should be responsive, visually appealing, and follow email best practices.

Always include:
- Proper HTML structure with inline CSS
- Mobile-responsive design
- Clear call-to-action
- Professional tone
- Unsubscribe link in footer
- Max width of 600px for compatibility

Return your response as a JSON object with these exact fields:
{
  "name": "Template name (short, descriptive)",
  "subject": "Email subject line (compelling and clear)",
  "htmlContent": "Full HTML email content with inline styles",
  "textContent": "Plain text version of the email"
}`;

    const userPrompt = args.templateType
      ? `Create a ${args.templateType} email template. ${args.prompt}`
      : args.prompt;

    console.log(`🤖 Generating email template with ${EMAIL_MODEL}...`);
    console.log("Prompt:", userPrompt);

    const response = await callLLM({
      model: EMAIL_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      responseFormat: "json",
      temperature: 0.8,
    });

    console.log("✅ Template generated successfully");

    const result = safeParseJson<{ name?: string; subject?: string; htmlContent?: string; textContent?: string }>(response.content, {});
    
    return {
      name: result.name || "AI Generated Template",
      subject: result.subject || "Welcome!",
      htmlContent: result.htmlContent || "<p>Email content</p>",
      textContent: result.textContent || "Email content",
    };
  },
});

/**
 * Generate a complete email workflow sequence with multiple emails, delays, tags, and conditions
 */
export const generateWorkflowSequence = action({
  args: {
    storeId: v.string(),
    campaignType: v.union(
      // General campaign types
      v.literal("product_launch"),
      v.literal("course_launch"),
      v.literal("lead_nurture"),
      v.literal("onboarding"),
      v.literal("re_engagement"),
      v.literal("promotion"),
      v.literal("evergreen"),
      v.literal("custom"),
      // Product-type specific sequences
      v.literal("sample_pack_launch"),
      v.literal("preset_pack_launch"),
      v.literal("midi_pack_launch"),
      v.literal("beat_lease_launch"),
      v.literal("coaching_launch"),
      v.literal("mixing_service_launch"),
      v.literal("pdf_guide_launch"),
      v.literal("community_launch")
    ),
    contextType: v.union(
      v.literal("course"),
      v.literal("product"),
      v.literal("store")
    ),
    courseId: v.optional(v.id("courses")),
    productId: v.optional(v.id("digitalProducts")),
    customPrompt: v.optional(v.string()),
    sequenceLength: v.optional(v.number()), // Number of emails in sequence (default: 5-7)
    tone: v.optional(v.union(
      v.literal("professional"),
      v.literal("friendly"),
      v.literal("casual"),
      v.literal("urgent"),
      v.literal("educational")
    )),
  },
  returns: v.object({
    workflowName: v.string(),
    workflowDescription: v.string(),
    nodes: v.array(v.object({
      id: v.string(),
      type: v.string(),
      position: v.object({ x: v.number(), y: v.number() }),
      data: v.any(),
    })),
    edges: v.array(v.object({
      id: v.string(),
      source: v.string(),
      target: v.string(),
      sourceHandle: v.optional(v.string()),
      targetHandle: v.optional(v.string()),
    })),
    suggestedTags: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    // Gather context
    let contextInfo = "";
    let productName = "Product";
    let productPrice = "";
    let productUrl = ""; // The actual URL to link to
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ppracademy.com";

    // Debug logging
    console.log("🔍 generateWorkflowSequence args:", {
      contextType: args.contextType,
      courseId: args.courseId,
      productId: args.productId,
      storeId: args.storeId,
    });

    // Get store info for URL building
    const store = await ctx.runQuery(api.stores.getUserStore, { userId: args.storeId });
    const storeSlug = store?.slug || store?.name?.toLowerCase().replace(/\s+/g, "-") || "store";

    if (args.contextType === "course" && args.courseId) {
      console.log("📚 Fetching course data for:", args.courseId);
      const courseData = await ctx.runQuery(api.courses.getCourseWithInstructor, { courseId: args.courseId });
      console.log("📚 Course data received:", courseData?.course?.title);
      if (courseData?.course) {
        const course = courseData.course;
        productName = course.title || "Course";
        console.log("📚 productName set to:", productName);
        productPrice = course.price ? `$${course.price}` : "Free";
        const courseSlug = course.slug || course.title?.toLowerCase().replace(/\s+/g, "-") || "course";
        productUrl = `${baseUrl}/${storeSlug}/courses/${courseSlug}`;

        // Fetch modules and lessons for richer context
        const modules = await ctx.runQuery(internal.courses.getModulesByCourseInternal, { courseId: args.courseId });
        let courseStructure = "";
        for (const mod of modules.slice(0, 5)) { // Limit to first 5 modules
          const lessons = await ctx.runQuery(internal.courses.getLessonsByModuleInternal, { moduleId: mod._id });
          courseStructure += `\n  Module: ${mod.title}`;
          if (mod.description) courseStructure += ` - ${mod.description}`;
          for (const lesson of lessons.slice(0, 3)) { // Limit to first 3 lessons per module
            courseStructure += `\n    - ${lesson.title}`;
          }
        }

        contextInfo = `
COURSE INFORMATION:
- Title: ${course.title}
- Description: ${course.description || "No description"}
- Category: ${course.category || "General"}
- Price: ${productPrice}
- What students will learn: ${course.outcomes || "Various skills and knowledge"}
- Skill Level: ${course.skillLevel || "All levels"}
- COURSE URL: ${productUrl}

COURSE CURRICULUM (use this to make emails specific):${courseStructure || "\n  (No modules available yet)"}
`;
        if (courseData.instructor) {
          contextInfo += `\nINSTRUCTOR: ${courseData.instructor.name}`;
          if (courseData.instructor.bio) {
            contextInfo += `\nINSTRUCTOR BIO: ${courseData.instructor.bio}`;
          }
        }
      }
    } else if (args.contextType === "product" && args.productId) {
      const product = await ctx.runQuery(api.digitalProducts.getProductById, { productId: args.productId });
      if (product) {
        productName = product.title || "Product";
        productPrice = product.price ? `$${product.price}` : "Free";
        const productSlugUrl = product.slug || product.title?.toLowerCase().replace(/\s+/g, "-") || "product";
        productUrl = `${baseUrl}/${storeSlug}/products/${productSlugUrl}`;
        contextInfo = `
PRODUCT INFORMATION:
- Name: ${product.title}
- Description: ${product.description || "No description"}
- Type: ${product.productCategory || product.productType || "Digital Product"}
- Price: ${productPrice}
- Genre/Category: ${product.genre?.join(", ") || "General"}
- PRODUCT URL: ${productUrl}
`;
      }
    } else if (args.contextType === "store") {
      if (store) {
        productName = store.name || "Store";
        productUrl = `${baseUrl}/${storeSlug}`;
        contextInfo = `
STORE/BRAND INFORMATION:
- Store Name: ${store.name || "Creator Store"}
- Description: ${store.description || "A creator's digital storefront"}
- Bio: ${store.bio || ""}
- STORE URL: ${productUrl}
`;
      }
    }

    if (args.customPrompt) {
      contextInfo += `\nADDITIONAL CONTEXT:\n${args.customPrompt}`;
    }

    const tone = args.tone || "friendly";
    const sequenceLength = args.sequenceLength || 5;

    // Create a URL-safe slug from the product name for use in tags
    const productSlug = productName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Remove duplicate hyphens
      .substring(0, 30) // Limit length
      .replace(/-$/, ""); // Remove trailing hyphen

    console.log("🏷️ productSlug calculated:", productSlug, "from productName:", productName);

    // Voice guidelines per tone
    const voiceGuidelines: Record<string, string> = {
      professional: `Use "I" not "we" for personal feel. Reference data/research. Avoid exclamation marks. Use phrases like "Here's the thing:" Structure: Problem → Research → Solution`,
      friendly: `Open with relatable observations. Use "we" for inclusion. Short punchy sentences. Ask questions ("Sound familiar?"). Share personal moments showing empathy.`,
      casual: `Treat reader as a peer. Use contractions. Self-aware about selling. Talk about what you learned. End with genuine invitation, not demand.`,
      urgent: `Open with time constraint immediately. Use specific numbers ("3 spots left"). Include reason for deadline. Show countdown. Make consequence clear.`,
      educational: `Start with a thought-provoking question. Teach a principle, then connect to product. Use specific examples with numbers. Position product as "next step" after learning.`,
    };

    // Enhanced campaign descriptions with psychology
    const campaignDescriptions: Record<string, string> = {
      product_launch: `LAUNCH SEQUENCE PSYCHOLOGY:
- Email 1: Curiosity hook + personal story of why you created this
- Email 2: The transformation - before/after with specific results
- Email 3: Social proof - real testimonial with specific numbers/timeframe
- Email 4: Objection crusher - address the #1 reason people don't buy
- Email 5: Scarcity/urgency - real deadline with reason it exists
- Final: Last chance with clear consequence of missing out`,
      course_launch: `COURSE LAUNCH PSYCHOLOGY:
- Email 1: Share a surprising insight that contradicts common belief
- Email 2: Your unique method/framework explained simply
- Email 3: Student success story with specific transformation
- Email 4: FAQ - address top 3 objections head-on
- Email 5: What happens if they don't take action (cost of inaction)
- Final: Enrollment closing with bonus expiring`,
      lead_nurture: `NURTURE SEQUENCE PSYCHOLOGY:
- Build trust through genuine value (no selling first 3 emails)
- Share counterintuitive insights that make them think differently
- Use "teaching moments" from your experience
- Position yourself as guide, not guru
- Soft CTA only in later emails (inviting, not pushing)`,
      onboarding: `ONBOARDING PSYCHOLOGY:
- Immediate quick win in first email (action they can take in 5 mins)
- Anticipate their fears and address proactively
- Celebrate small progress milestones
- Introduce community/support resources
- Set expectations for what's coming next`,
      re_engagement: `RE-ENGAGEMENT PSYCHOLOGY:
- Pattern interrupt subject line (unexpected/intriguing)
- Acknowledge the silence without guilt-tripping
- Offer genuine value with no strings attached
- Create curiosity about what they've missed
- Final: Direct ask - "Should I remove you?" (loss aversion)`,
      promotion: `PROMO SEQUENCE PSYCHOLOGY:
- Lead with benefit, not discount percentage
- Create urgency through real constraint (not fake scarcity)
- Address "I'll do it later" objection
- Stack value (show everything they get)
- Final countdown with specific deadline`,
      evergreen: `EVERGREEN PSYCHOLOGY:
- 80% pure value, 20% soft pitch
- Build long-term relationship over quick sale
- Position as helpful resource, not salesperson
- Use teaching as selling (educate then offer)
- Natural segues from content to offer`,
      // Product-type specific psychology
      sample_pack_launch: `SAMPLE PACK LAUNCH PSYCHOLOGY:
- Email 1: Tease the vibe/genre with audio preview (describe what they'll hear)
- Email 2: Behind-the-scenes of how you created these sounds
- Email 3: Show what tracks could be made with these samples
- Email 4: FAQ - file formats, DAW compatibility, licensing terms
- Email 5: Limited time bonus (extra loops or one-shots)
- Final: Producer testimonial or track showcase using the samples`,
      preset_pack_launch: `PRESET PACK LAUNCH PSYCHOLOGY:
- Email 1: Before/after audio comparison (dry vs with preset)
- Email 2: Walk through 3 standout presets and when to use them
- Email 3: Show how easy they are to use (no tweaking needed)
- Email 4: Compatible synth/DAW requirements explained
- Email 5: Bonus: Custom macro walkthrough or preset-making tutorial
- Final: Price comparison to other packs in the market`,
      midi_pack_launch: `MIDI PACK LAUNCH PSYCHOLOGY:
- Email 1: Melody/chord progression preview in context of a beat
- Email 2: Theory breakdown - why these progressions work
- Email 3: How to flip/customize the MIDIs for unique tracks
- Email 4: Compatible DAWs and instruments that work best
- Email 5: Bonus loops or chord progressions as incentive
- Final: Show genre versatility (same MIDI, different sounds)`,
      beat_lease_launch: `BEAT LEASE LAUNCH PSYCHOLOGY:
- Email 1: New beat drop announcement with vibe/mood description
- Email 2: Licensing tiers explained simply (basic vs premium vs exclusive)
- Email 3: Artist spotlight using your beats
- Email 4: What you can and can't do with each license
- Email 5: Free beat or discount for email subscribers
- Final: Exclusive/premium tier pitch for serious artists`,
      coaching_launch: `COACHING LAUNCH PSYCHOLOGY:
- Email 1: Your credentials and why you're qualified to teach
- Email 2: Common mistakes you see producers make (that you fix)
- Email 3: Session format, duration, what to expect
- Email 4: Student transformation story with specific results
- Email 5: FAQ - scheduling, refunds, preparation needed
- Final: Limited spots available (real scarcity if applicable)`,
      mixing_service_launch: `MIXING/MASTERING SERVICE PSYCHOLOGY:
- Email 1: Before/after audio examples (night and day difference)
- Email 2: Your signal chain, plugins, approach explained
- Email 3: What you need from the client (stems, reference tracks)
- Email 4: Turnaround time, revisions policy, pricing tiers
- Email 5: Client testimonial with specific feedback
- Final: Special rate for first-time clients`,
      pdf_guide_launch: `PDF/GUIDE LAUNCH PSYCHOLOGY:
- Email 1: The problem this guide solves (the frustration)
- Email 2: Share one key insight from the guide (proof of value)
- Email 3: Table of contents breakdown with what they'll learn
- Email 4: Who this is for (and who it's NOT for)
- Email 5: Bonus resources included (templates, checklists)
- Final: Lifetime access, free updates pitch`,
      community_launch: `COMMUNITY/MEMBERSHIP PSYCHOLOGY:
- Email 1: Why you built this community (your vision)
- Email 2: What's inside (features, content, resources)
- Email 3: Member spotlight or success story
- Email 4: How active the community is, what the vibe is like
- Email 5: FAQ - cancellation, access, private vs public
- Final: Founding member pricing or limited-time bonus`,
      custom: args.customPrompt || `A custom email sequence based on the provided context.`,
    };

    // Define email templates for each position in the sequence
    // These are the STRUCTURES - AI fills in the specific content (10 templates per type)
    const emailTemplates: Record<string, { purpose: string; structure: string; focus: string }[]> = {
      course_launch: [
        {
          purpose: "welcome",
          structure: "Personal story of why you created this course. What problem did YOU face that led to creating it?",
          focus: "Connection - make them feel you understand their struggle",
        },
        {
          purpose: "value",
          structure: "Share ONE powerful insight from the course. Teach something they can use TODAY without buying.",
          focus: "Demonstrate expertise - give real value upfront",
        },
        {
          purpose: "social_proof",
          structure: "Student transformation story. Before/after with SPECIFIC results and timeframe.",
          focus: "Build belief - show what's possible",
        },
        {
          purpose: "behind_scenes",
          structure: "Walk them through what's inside. Highlight 2-3 specific modules/lessons and what they'll learn.",
          focus: "Make the course tangible - show them the goods",
        },
        {
          purpose: "objection",
          structure: "Address the #1 reason people don't buy. Name the fear directly, then overcome it.",
          focus: "Remove barriers - handle 'I'm not sure if...'",
        },
        {
          purpose: "bonus",
          structure: "Spotlight a specific bonus, template, or resource included. Show its standalone value.",
          focus: "Stack value - make it a no-brainer",
        },
        {
          purpose: "faq",
          structure: "Answer 3 real questions people ask before buying. Be direct and honest.",
          focus: "Remove uncertainty - handle the 'but what about...'",
        },
        {
          purpose: "personal_story",
          structure: "Share another struggle or breakthrough moment. Different angle than email 1.",
          focus: "Deepen connection - show you're human",
        },
        {
          purpose: "urgency",
          structure: "Why NOW matters. Cost of waiting. What they're missing each day they delay.",
          focus: "Create urgency - authentic, not fake scarcity",
        },
        {
          purpose: "final_call",
          structure: "Everything they get, one more time. Make the decision easy. This is it.",
          focus: "Close the loop - help them commit",
        },
      ],
      product_launch: [
        {
          purpose: "announcement",
          structure: "Big reveal moment. What's new and why you're excited to share it.",
          focus: "Generate curiosity and excitement",
        },
        {
          purpose: "value",
          structure: "Deep dive into ONE feature/benefit. Show exactly how it solves their problem.",
          focus: "Demonstrate value through specifics",
        },
        {
          purpose: "social_proof",
          structure: "Early feedback, beta tester results, or your own results using it.",
          focus: "Build trust through evidence",
        },
        {
          purpose: "use_case",
          structure: "Paint a specific scenario where this product shines. Day-in-the-life with it.",
          focus: "Help them visualize using it",
        },
        {
          purpose: "objection",
          structure: "FAQ format - address top 3 concerns people have before buying.",
          focus: "Remove friction from the decision",
        },
        {
          purpose: "comparison",
          structure: "Why this vs alternatives? What makes your approach different?",
          focus: "Position against competition",
        },
        {
          purpose: "bonus_reveal",
          structure: "Reveal an extra bonus or feature they didn't know about.",
          focus: "Surprise and delight",
        },
        {
          purpose: "personal_use",
          structure: "How YOU use this product in your own workflow. Real examples.",
          focus: "Authenticity - you believe in it",
        },
        {
          purpose: "urgency",
          structure: "Why waiting costs them. What they're losing by not having this now.",
          focus: "Motivate action through cost of inaction",
        },
        {
          purpose: "last_chance",
          structure: "Final reminder with everything they get. Clear deadline if any.",
          focus: "Help them make the decision",
        },
      ],
      lead_nurture: [
        {
          purpose: "value",
          structure: "Teach something valuable with zero pitch. Pure helpfulness.",
          focus: "Build trust by giving first",
        },
        {
          purpose: "story",
          structure: "Share a failure or lesson learned. Be vulnerable and relatable.",
          focus: "Build connection through authenticity",
        },
        {
          purpose: "insight",
          structure: "Share a counterintuitive insight that challenges common thinking.",
          focus: "Position as thought leader",
        },
        {
          purpose: "case_study",
          structure: "Walk through a detailed example or transformation. Show the process.",
          focus: "Prove your methods work",
        },
        {
          purpose: "resource",
          structure: "Give them a tool, template, or resource they can use immediately.",
          focus: "Deliver tangible value",
        },
        {
          purpose: "myth_bust",
          structure: "Call out a common misconception in your space. Set the record straight.",
          focus: "Build authority by challenging norms",
        },
        {
          purpose: "behind_scenes",
          structure: "Show your process, your setup, how you work. Make them feel like an insider.",
          focus: "Build intimacy and trust",
        },
        {
          purpose: "engagement",
          structure: "Ask them a genuine question. Invite them to reply. Start a conversation.",
          focus: "Two-way relationship, not broadcast",
        },
        {
          purpose: "bridge",
          structure: "Connect the value you've given to what you offer. Natural transition.",
          focus: "Plant seeds for eventual offer",
        },
        {
          purpose: "soft_pitch",
          structure: "Mention what you offer as a natural extension of the value you've given.",
          focus: "Offer without pressure",
        },
      ],
      // SAMPLE PACK LAUNCH TEMPLATES
      sample_pack_launch: [
        {
          purpose: "vibe_tease",
          structure: "Describe the sonic aesthetic. What genre? What mood? What will they FEEL when they drop these samples in?",
          focus: "Create anticipation with vivid sound descriptions",
        },
        {
          purpose: "behind_scenes",
          structure: "How you created these sounds. What gear/software? What inspired the vibe? Recording process.",
          focus: "Show craft and authenticity",
        },
        {
          purpose: "use_case",
          structure: "Paint a picture of a producer using these samples. What track comes out? What elements work together?",
          focus: "Help them visualize making heat with these",
        },
        {
          purpose: "specs_faq",
          structure: "File formats, sample count, BPM range, key info. DAW compatibility. License terms (royalty-free?).",
          focus: "Remove technical uncertainty",
        },
        {
          purpose: "bonus_reveal",
          structure: "Extra one-shots, bonus loops, or MIDI files for email subscribers only.",
          focus: "Reward subscribers with exclusivity",
        },
        {
          purpose: "social_proof",
          structure: "Producer testimonial or track made with these samples. Real results.",
          focus: "Build confidence through evidence",
        },
        {
          purpose: "genre_versatility",
          structure: "Show how the same samples can work across genres. Hip hop, trap, lo-fi, etc.",
          focus: "Expand perceived value",
        },
        {
          purpose: "comparison",
          structure: "Why these samples vs free packs online? Quality difference. Unique sounds.",
          focus: "Justify the investment",
        },
        {
          purpose: "urgency",
          structure: "Limited intro pricing or bonus expiring. Why grab it now.",
          focus: "Create momentum to act",
        },
        {
          purpose: "final_call",
          structure: "Everything included. One more time. Links to previews. Make decision easy.",
          focus: "Close with confidence",
        },
      ],
      // PRESET PACK LAUNCH TEMPLATES
      preset_pack_launch: [
        {
          purpose: "before_after",
          structure: "Describe the sound transformation. Dry synth to massive lead. Weak bass to earth-shaking sub.",
          focus: "Show dramatic difference presets make",
        },
        {
          purpose: "preset_spotlight",
          structure: "Walk through 3 standout presets. When to use each. What genre they shine in.",
          focus: "Make the pack tangible",
        },
        {
          purpose: "ease_of_use",
          structure: "No tweaking needed. Load and go. Macro controls for quick customization.",
          focus: "Remove intimidation factor",
        },
        {
          purpose: "compatibility",
          structure: "Which synth versions work. DAW compatibility. Installation walkthrough.",
          focus: "Technical clarity",
        },
        {
          purpose: "sound_design",
          structure: "Your sound design philosophy. What makes your presets different from stock sounds.",
          focus: "Establish expertise",
        },
        {
          purpose: "genre_use",
          structure: "Show same preset in different genres. Versatility demonstration.",
          focus: "Expand use cases",
        },
        {
          purpose: "tutorial_bonus",
          structure: "Free preset-making tutorial or macro walkthrough included.",
          focus: "Add educational value",
        },
        {
          purpose: "value_comparison",
          structure: "Price vs other preset packs. What you get per dollar. Quality per preset.",
          focus: "Justify investment",
        },
        {
          purpose: "urgency",
          structure: "Intro pricing ending. Bonus presets expiring.",
          focus: "Drive action now",
        },
        {
          purpose: "final_call",
          structure: "Full preset list. Synth requirements. Links to demos. Decision time.",
          focus: "Confident close",
        },
      ],
      // MIDI PACK LAUNCH TEMPLATES
      midi_pack_launch: [
        {
          purpose: "melody_tease",
          structure: "Describe the melodies and progressions. Emotional? Hard-hitting? Chill?",
          focus: "Paint the musical picture",
        },
        {
          purpose: "theory_breakdown",
          structure: "Why these progressions work. Music theory made simple. Keys and modes used.",
          focus: "Educational angle that builds value",
        },
        {
          purpose: "customization",
          structure: "How to flip MIDIs for unique tracks. Change instruments, velocity, timing.",
          focus: "Show creative possibilities",
        },
        {
          purpose: "compatibility",
          structure: "DAW compatibility. Best instruments to use. Piano roll vs external synths.",
          focus: "Technical clarity",
        },
        {
          purpose: "genre_versatility",
          structure: "Same MIDI, different sounds. Show how one progression fits multiple genres.",
          focus: "Maximize perceived value",
        },
        {
          purpose: "workflow_benefit",
          structure: "Beat block solution. Start with MIDI, build around it. Speed up production.",
          focus: "Solve their pain point",
        },
        {
          purpose: "bonus_loops",
          structure: "Extra chord progressions or melody loops for email subscribers.",
          focus: "Exclusive incentive",
        },
        {
          purpose: "comparison",
          structure: "Hand-crafted vs AI-generated. Why these hit different. Original compositions.",
          focus: "Quality differentiation",
        },
        {
          purpose: "urgency",
          structure: "Intro price ending. Bundle deal expiring.",
          focus: "Push to action",
        },
        {
          purpose: "final_call",
          structure: "Full MIDI count. BPM and key range. Everything included. Get it now.",
          focus: "Clear close",
        },
      ],
      // BEAT LEASE LAUNCH TEMPLATES
      beat_lease_launch: [
        {
          purpose: "new_beat_drop",
          structure: "New beat announcement. Vibe, mood, who it's for. What artist would kill this?",
          focus: "Generate excitement",
        },
        {
          purpose: "license_breakdown",
          structure: "Basic vs premium vs exclusive explained simply. What you CAN and CAN'T do.",
          focus: "Clarity removes friction",
        },
        {
          purpose: "artist_spotlight",
          structure: "Artist using your beats. Their release. Their success.",
          focus: "Social proof that converts",
        },
        {
          purpose: "rights_faq",
          structure: "Streaming limits. Distribution rights. Credits required. No legal confusion.",
          focus: "Remove legal fear",
        },
        {
          purpose: "free_beat",
          structure: "Free tagged beat for email subscribers. Show quality before they pay.",
          focus: "Build trust with free value",
        },
        {
          purpose: "exclusive_pitch",
          structure: "Why exclusives are worth it. Own the beat. No competition. Serious artists.",
          focus: "Upsell premium tier",
        },
        {
          purpose: "discography",
          structure: "Your beat catalog overview. Different vibes available. Something for everyone.",
          focus: "Show range and options",
        },
        {
          purpose: "collab_offer",
          structure: "Custom beat offer. Work directly with you. Tailored to their sound.",
          focus: "Premium personalized service",
        },
        {
          purpose: "urgency",
          structure: "Beat might sell exclusive. Limited time discount. Act now.",
          focus: "Real scarcity",
        },
        {
          purpose: "final_call",
          structure: "License comparison. Links to all beats. Special code for subscribers.",
          focus: "Make decision easy",
        },
      ],
      // COACHING LAUNCH TEMPLATES
      coaching_launch: [
        {
          purpose: "credentials",
          structure: "Your background. What qualifies you. Your results and experience.",
          focus: "Establish authority",
        },
        {
          purpose: "common_mistakes",
          structure: "Mistakes you see producers make. Problems you fix in sessions.",
          focus: "Show expertise through diagnosis",
        },
        {
          purpose: "session_format",
          structure: "What a session looks like. Duration. Video call? Screen share? Feedback style.",
          focus: "Make it tangible",
        },
        {
          purpose: "transformation",
          structure: "Student success story. Where they started. Where they are now. Specific results.",
          focus: "Proof it works",
        },
        {
          purpose: "faq",
          structure: "Scheduling. Time zones. Cancellation. What to prepare. Tech requirements.",
          focus: "Remove logistical friction",
        },
        {
          purpose: "value_breakdown",
          structure: "Cost of mistakes vs cost of coaching. ROI of learning faster.",
          focus: "Justify the investment",
        },
        {
          purpose: "philosophy",
          structure: "Your teaching approach. How you're different from YouTube tutorials.",
          focus: "Differentiate from free content",
        },
        {
          purpose: "testimonials",
          structure: "Multiple student quotes. Different skill levels. Different goals achieved.",
          focus: "Broad social proof",
        },
        {
          purpose: "scarcity",
          structure: "Limited spots per month. Your availability is real. Book while open.",
          focus: "Authentic scarcity",
        },
        {
          purpose: "final_call",
          structure: "What you get. How to book. Special rate for email subscribers.",
          focus: "Clear path to action",
        },
      ],
      // MIXING/MASTERING SERVICE TEMPLATES
      mixing_service_launch: [
        {
          purpose: "before_after",
          structure: "Describe the transformation. Muddy to clean. Flat to punchy. Night and day.",
          focus: "Showcase your impact",
        },
        {
          purpose: "process_reveal",
          structure: "Your signal chain. Key plugins. Approach to mixing. What makes you different.",
          focus: "Demonstrate expertise",
        },
        {
          purpose: "requirements",
          structure: "What you need from them. Stems. Reference tracks. Notes on their vision.",
          focus: "Set expectations",
        },
        {
          purpose: "turnaround",
          structure: "Delivery timeline. Revision policy. Communication during process.",
          focus: "Clarity on logistics",
        },
        {
          purpose: "testimonial",
          structure: "Client feedback. Specific results. Before/after their release.",
          focus: "Third-party validation",
        },
        {
          purpose: "pricing_tiers",
          structure: "Basic mix vs full production. What's included at each level.",
          focus: "Clear options",
        },
        {
          purpose: "genre_expertise",
          structure: "Genres you specialize in. Portfolio examples in their style.",
          focus: "Show relevant experience",
        },
        {
          purpose: "comparison",
          structure: "DIY mixing vs professional. Time saved. Quality gained.",
          focus: "Justify outsourcing",
        },
        {
          purpose: "special_offer",
          structure: "First-time client discount. Bundle deal. Email subscriber special.",
          focus: "Lower barrier to try",
        },
        {
          purpose: "final_call",
          structure: "How to submit. What to expect. Link to book.",
          focus: "Simple next step",
        },
      ],
      // PDF/GUIDE LAUNCH TEMPLATES
      pdf_guide_launch: [
        {
          purpose: "problem_agitation",
          structure: "The frustration this guide solves. The struggle they're facing right now.",
          focus: "Connect through shared pain",
        },
        {
          purpose: "insight_preview",
          structure: "Share one key insight from the guide. Prove the value before they buy.",
          focus: "Demonstrate quality",
        },
        {
          purpose: "table_of_contents",
          structure: "What's inside chapter by chapter. What they'll learn. Specific takeaways.",
          focus: "Make content tangible",
        },
        {
          purpose: "ideal_reader",
          structure: "Who this is for. Who it's NOT for. Be specific about skill level.",
          focus: "Qualify the right buyers",
        },
        {
          purpose: "bonus_resources",
          structure: "Templates, checklists, worksheets included. Actionable extras.",
          focus: "Stack the value",
        },
        {
          purpose: "author_story",
          structure: "Why you wrote this. Your journey learning this. Credibility.",
          focus: "Personal connection",
        },
        {
          purpose: "testimonials",
          structure: "Reader feedback. Specific results from applying the guide.",
          focus: "Social proof",
        },
        {
          purpose: "comparison",
          structure: "This guide vs free YouTube videos. Organized, comprehensive, saves time.",
          focus: "Justify paid content",
        },
        {
          purpose: "urgency",
          structure: "Launch pricing ending. Bonus expiring. Future price increase.",
          focus: "Drive action now",
        },
        {
          purpose: "final_call",
          structure: "Everything included. Lifetime access. Free updates. Get it now.",
          focus: "Remove last doubts",
        },
      ],
      // COMMUNITY/MEMBERSHIP LAUNCH TEMPLATES
      community_launch: [
        {
          purpose: "vision",
          structure: "Why you built this community. What void it fills. Your mission.",
          focus: "Inspire with purpose",
        },
        {
          purpose: "whats_inside",
          structure: "Features. Content library. Live calls. Resources. The full picture.",
          focus: "Show the value",
        },
        {
          purpose: "member_spotlight",
          structure: "Member success story. What they achieved. How community helped.",
          focus: "Show real results",
        },
        {
          purpose: "vibe_check",
          structure: "How active is it? What's the culture? Screenshots of conversations.",
          focus: "Show it's not a ghost town",
        },
        {
          purpose: "faq",
          structure: "Cancellation policy. Access levels. Private vs public. What's expected.",
          focus: "Remove commitment fear",
        },
        {
          purpose: "comparison",
          structure: "Facebook groups vs this. Discord servers vs this. What's different.",
          focus: "Differentiate from free",
        },
        {
          purpose: "founder_access",
          structure: "Your involvement. AMAs. Direct feedback. Founder accessibility.",
          focus: "Personal connection value",
        },
        {
          purpose: "roadmap",
          structure: "What's coming. Future features. Growing with the community.",
          focus: "Show long-term value",
        },
        {
          purpose: "founding_member",
          structure: "Special founding member pricing. Lock in rate. Early adopter perks.",
          focus: "Reward early believers",
        },
        {
          purpose: "final_call",
          structure: "Join link. What happens next. Welcome them to the family.",
          focus: "Warm invitation",
        },
      ],
    };

    // Use the appropriate templates or default to course_launch
    const templates = emailTemplates[args.campaignType] || emailTemplates.course_launch;
    const actualSequenceLength = Math.min(sequenceLength, templates.length);

    const systemPrompt = `You are a direct response email copywriter trained by Russell Brunson, Alex Hormozi, and Frank Kern.
You write emails that feel like they're from a friend, not a corporation.

COPYWRITING STYLE (Russell Brunson / Frank Kern / Alex Hormozi):
- Short punchy sentences. Often one per line.
- Conversational tone. Use contractions (you're, don't, it's, won't, I've).
- Write like you talk. Casual. Real. Human.
- Use the Hook → Story → Offer framework in every email.
- End emails with a cliffhanger or tease for the next one (Soap Opera Sequence style).
- Go for REAL emotional depth. Not surface pain points.

TONE: ${tone} - ${voiceGuidelines[tone] || voiceGuidelines.friendly}

SUBJECT LINE RULES (Frank Kern Style):
- Subject lines should NOT look like sales messages
- Use lowercase, casual language, slang, parentheses
- Be intriguing, weird, or pattern-interrupting
- Examples that work:
  - "so this happened yesterday..."
  - "I almost didn't send this"
  - "the ${productName} thing (weird but works)"
  - "quick question about ${productName}"
  - "{{firstName}} - you seeing this?"

⚠️ ANTI-HALLUCINATION RULES (CRITICAL - DO NOT VIOLATE):
- ONLY mention features, modules, lessons, and bonuses that are EXPLICITLY listed in the course/product details below
- NEVER invent bonuses like "cheat sheets", "templates", "communities", "private groups", "worksheets" unless they are explicitly mentioned
- NEVER promise outcomes, timeframes, or results that aren't stated in the course description
- If you're unsure whether something is included, DO NOT mention it
- Violating this rule makes the creator look like a liar - this is unacceptable

CRITICAL RULES:
1. Each email: 150-250 words. Punchy. No fluff.
2. One sentence per line is GOOD. It's how pro copywriters write.
3. ONLY reference modules/lessons/features that appear in the curriculum below. Nothing else.
4. NEVER use em-dashes (—) or double hyphens. Use periods or commas.
5. BANNED phrases: "game-changer", "transform your life", "unlock your potential", "amazing course", "I'm excited to share"
6. Write as {{senderName}} talking directly to {{firstName}}.
7. EVERY email needs a CTA link: <p><a href="${productUrl}">CTA Text</a></p>
8. EVERY email MUST end with the signature - no exceptions.
9. When describing what's included, use ONLY what's in the provided curriculum. Do not embellish.

HOOK → STORY → OFFER STRUCTURE:
- HOOK: First 1-2 lines grab attention. Pattern interrupt. Curiosity.
- STORY: Share a specific moment, struggle, or insight. Make it real.
- OFFER: Natural transition to the CTA. No hard sell.
- For emails 1 to N-1: Add a cliffhanger/tease BEFORE the signature.

EMAIL SIGNATURE (REQUIRED on EVERY email - this is the last thing in the email):
<p>Talk soon,<br/>{{senderName}}</p>

HTML FORMAT:
- Use <p> tags for each line or short thought
- Use <strong> for ONE key emphasis per email
- Use <br/> for line breaks within a thought
- Links: <a href="${productUrl}">CTA Text</a>

RESPONSE FORMAT (strict JSON):
{
  "emails": [
    {
      "subject": "casual, intriguing subject (Frank Kern style)",
      "previewText": "tease that creates curiosity (80 chars max)",
      "body": "HTML email with Hook→Story→Offer structure"
    }
  ]
}`;

    // Build the user prompt with specific email requirements
    let emailRequirements = "";
    for (let i = 0; i < actualSequenceLength; i++) {
      const template = templates[i];
      emailRequirements += `
EMAIL ${i + 1} - ${template.purpose.toUpperCase()}:
- Purpose: ${template.structure}
- Focus: ${template.focus}
- Must reference specific content from the curriculum
`;
    }

    const userPrompt = `Generate ${actualSequenceLength} emails for "${productName}".

${contextInfo}

EMAILS TO GENERATE:
${emailRequirements}

STYLE CHECKLIST (Russell Brunson / Frank Kern):
1. Subject lines: lowercase, casual, intriguing - NOT salesy
2. One sentence per line is the goal. Short. Punchy. Easy to scan.
3. Hook readers in the first 2 lines. Pattern interrupt.
4. Tell a REAL story with specific details from the curriculum above.
5. NO em-dashes (—). Use periods or commas.
6. Emails 1-${actualSequenceLength - 1}: Add a cliffhanger teasing the next email BEFORE the signature.
7. EVERY email MUST end with: <p>Talk soon,<br/>{{senderName}}</p>
8. Each email: 150-250 words. Tight. No fluff.
9. CTA Link for every email: ${productUrl}

⚠️ REMINDER: ONLY mention what's in the curriculum above. Do NOT invent bonuses, communities, cheat sheets, or extras that aren't listed. This is critical.`;

    console.log(`🤖 Generating ${actualSequenceLength} template-based emails with ${EMAIL_MODEL}...`);

    // Lower temperature to reduce hallucination while maintaining some creativity
    const temperature = args.campaignType === "lead_nurture" ? 0.5 : 0.6;

    const response = await callLLM({
      model: EMAIL_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      responseFormat: "json",
      temperature,
      maxTokens: 16000, // Increased for 200+ word emails per email in sequence
    });

    const result = safeParseJson<{ emails?: Array<{ subject?: string; previewText?: string; body?: string }> }>(response.content, { emails: [] });
    console.log("✅ Workflow sequence generated with", result.emails?.length, "emails");

    // Convert AI response to workflow nodes and edges
    const nodes: Array<{
      id: string;
      type: string;
      position: { x: number; y: number };
      data: any;
    }> = [];
    const edges: Array<{
      id: string;
      source: string;
      target: string;
      sourceHandle?: string;
      targetHandle?: string;
    }> = [];

    let yPosition = 50;
    const xCenter = 400;
    const nodeSpacing = 180;
    let previousNodeId = "";

    // Define delays between emails (in hours) - 24 hours = 1 day
    const delaySchedule = [0, 24, 48, 24, 48]; // Day 0, Day 1, Day 3, Day 4, Day 6

    // Add trigger node
    const triggerId = `trigger-${Date.now()}`;
    const triggerTagName = `start-${productSlug}-sequence`;
    nodes.push({
      id: triggerId,
      type: "trigger",
      position: { x: xCenter, y: yPosition },
      data: {
        label: "Sequence Start",
        triggerType: args.campaignType === "onboarding" ? "lead_signup" : "tag_added",
        tagName: triggerTagName,
      },
    });
    previousNodeId = triggerId;
    yPosition += nodeSpacing;

    // Create "Already Purchased - Exit" node on the right side (for sales sequences)
    // All product-type-specific launches are sales sequences
    const salesSequenceTypes = [
      "course_launch", "product_launch", "promotion",
      "sample_pack_launch", "preset_pack_launch", "midi_pack_launch", "beat_lease_launch",
      "coaching_launch", "mixing_service_launch", "pdf_guide_launch", "community_launch"
    ];
    const isSalesSequence = salesSequenceTypes.includes(args.campaignType);
    const exitNodeId = `exit-purchased-${Date.now()}`;

    if (isSalesSequence) {
      nodes.push({
        id: exitNodeId,
        type: "action",
        position: { x: xCenter + 400, y: 300 },
        data: {
          label: "Already Purchased - Exit",
          actionType: "add_tag",
          tagName: `purchased-${productSlug}-exit`,
        },
      });
    }

    // Process emails from AI response
    const emails = result.emails || [];
    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      const template = templates[i] || { purpose: "content" };
      const delayHours = delaySchedule[i] || 24;

      // Add delay node (except before first email)
      if (i > 0 && delayHours > 0) {
        const delayId = `delay-${i}-${Date.now()}`;
        nodes.push({
          id: delayId,
          type: "delay",
          position: { x: xCenter, y: yPosition },
          data: {
            label: `Wait ${delayHours >= 24 ? `${Math.floor(delayHours / 24)} day(s)` : `${delayHours} hours`}`,
            delayType: "hours",
            delayValue: delayHours,
          },
        });
        edges.push({
          id: `edge-${previousNodeId}-${delayId}`,
          source: previousNodeId,
          target: delayId,
        });
        previousNodeId = delayId;
        yPosition += nodeSpacing;
      }

      // Add condition check before each email for sales sequences
      // This checks if user has already purchased - if so, exit the sequence
      if (isSalesSequence) {
        const conditionId = `condition-${i}-${Date.now()}`;
        nodes.push({
          id: conditionId,
          type: "condition",
          position: { x: xCenter, y: yPosition },
          data: {
            label: "Has Purchased?",
            conditionType: "has_purchased_product",
            courseId: args.courseId || undefined,
            productId: args.productId || undefined,
          },
        });
        edges.push({
          id: `edge-${previousNodeId}-${conditionId}`,
          source: previousNodeId,
          target: conditionId,
        });
        // If purchased (YES) → go to exit
        edges.push({
          id: `edge-${conditionId}-${exitNodeId}-yes`,
          source: conditionId,
          target: exitNodeId,
          sourceHandle: "yes",
        });
        previousNodeId = conditionId;
        yPosition += nodeSpacing;
      }

      // Add email node with purpose from template
      const emailId = `email-${i}-${Date.now()}`;
      nodes.push({
        id: emailId,
        type: "email",
        position: { x: xCenter, y: yPosition },
        data: {
          label: `Email ${i + 1}: ${template.purpose.charAt(0).toUpperCase() + template.purpose.slice(1)}`,
          subject: email.subject,
          previewText: email.previewText || "",
          body: email.body,
          senderName: "{{senderName}}",
        },
      });
      // If sales sequence, connect from condition's NO path to email
      if (isSalesSequence) {
        edges.push({
          id: `edge-${previousNodeId}-${emailId}-no`,
          source: previousNodeId,
          target: emailId,
          sourceHandle: "no",
        });
      } else {
        edges.push({
          id: `edge-${previousNodeId}-${emailId}`,
          source: previousNodeId,
          target: emailId,
        });
      }
      previousNodeId = emailId;
      yPosition += nodeSpacing;

      // Add tag node for this email - use deterministic naming with productSlug
      // We ALWAYS add a tag for each email, using the format: sent-{productSlug}-email-{n}
      const tagNodeId = `tag-${i}-${Date.now()}`;
      const correctTagName = `sent-${productSlug}-email-${i + 1}`;
      nodes.push({
        id: tagNodeId,
        type: "action",
        position: { x: xCenter + 250, y: yPosition - nodeSpacing + 30 },
        data: {
          label: `Add Tag: ${correctTagName}`,
          actionType: "add_tag",
          tagName: correctTagName,
        },
      });
      edges.push({
        id: `edge-${emailId}-${tagNodeId}`,
        source: emailId,
        target: tagNodeId,
        sourceHandle: "right",
      });

    }

    // Add "completed sequence" tag before goal - uses productSlug for uniqueness
    const completedTagId = `completed-tag-${Date.now()}`;
    nodes.push({
      id: completedTagId,
      type: "action",
      position: { x: xCenter, y: yPosition },
      data: {
        label: `Add Tag: completed-${productSlug}-sequence`,
        actionType: "add_tag",
        tagName: `completed-${productSlug}-sequence`,
      },
    });
    edges.push({
      id: `edge-${previousNodeId}-${completedTagId}`,
      source: previousNodeId,
      target: completedTagId,
    });
    previousNodeId = completedTagId;
    yPosition += nodeSpacing;

    // Add goal node at the end
    const goalId = `goal-${Date.now()}`;
    nodes.push({
      id: goalId,
      type: "goal",
      position: { x: xCenter, y: yPosition },
      data: {
        label: "Sequence Complete",
        goalType: isSalesSequence ? "purchase" : "engagement",
      },
    });
    edges.push({
      id: `edge-${previousNodeId}-${goalId}`,
      source: previousNodeId,
      target: goalId,
    });

    // Generate descriptive workflow name and description
    const campaignTypeLabel = args.campaignType.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    const workflowName = `${productName} - ${campaignTypeLabel}`;
    const workflowDescription = `${actualSequenceLength}-email ${campaignTypeLabel.toLowerCase()} sequence for ${productName}. Generated with template-based AI.`;

    return {
      workflowName,
      workflowDescription,
      nodes,
      edges,
      suggestedTags: [`start-${productSlug}-sequence`, `completed-${productSlug}-sequence`],
    };
  },
});


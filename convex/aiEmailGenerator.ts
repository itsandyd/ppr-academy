"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import OpenAI from "openai";
import { Id } from "./_generated/dataModel";

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
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-deployment",
    });

    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY not configured");
    }

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

    console.log("🤖 Generating workflow email with AI...");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const responseText = completion.choices[0].message.content;
    if (!responseText) {
      throw new Error("No response from OpenAI");
    }

    const result = JSON.parse(responseText);

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
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-deployment",
    });

    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY not configured in environment variables");
    }

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

    console.log("🤖 Generating email template with OpenAI...");
    console.log("Prompt:", userPrompt);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const responseText = completion.choices[0].message.content;
    if (!responseText) {
      throw new Error("No response from OpenAI");
    }

    console.log("✅ Template generated successfully");

    const result = JSON.parse(responseText);
    
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
      v.literal("product_launch"),
      v.literal("course_launch"),
      v.literal("lead_nurture"),
      v.literal("onboarding"),
      v.literal("re_engagement"),
      v.literal("promotion"),
      v.literal("evergreen"),
      v.literal("custom")
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
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-deployment",
    });

    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY not configured");
    }

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

CRITICAL RULES:
1. Each email: 150-250 words. Punchy. No fluff.
2. One sentence per line is GOOD. It's how pro copywriters write.
3. Use SPECIFIC details from the curriculum - actual module/lesson names.
4. NEVER use em-dashes (—) or double hyphens. Use periods or commas.
5. BANNED phrases: "game-changer", "transform your life", "unlock your potential", "amazing course", "I'm excited to share"
6. Write as {{senderName}} talking directly to {{firstName}}.
7. EVERY email needs a CTA link: <p><a href="${productUrl}">CTA Text</a></p>
8. End every email with a hook for the next one OR the signature.

HOOK → STORY → OFFER STRUCTURE:
- HOOK: First 1-2 lines grab attention. Pattern interrupt. Curiosity.
- STORY: Share a specific moment, struggle, or insight. Make it real.
- OFFER: Natural transition to the CTA. No hard sell.

EMAIL SIGNATURE (use on final email of sequence, or when no cliffhanger):
<p>Talk soon,<br/>{{senderName}}<br/>Pause Play Repeat Team</p>

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
6. End emails 1-${actualSequenceLength - 1} with a cliffhanger teasing the next email.
7. End the final email with: <p>Talk soon,<br/>{{senderName}}<br/>Pause Play Repeat Team</p>
8. Each email: 150-250 words. Tight. No fluff.
9. CTA Link for every email: ${productUrl}`;

    console.log(`🤖 Generating ${actualSequenceLength} template-based emails...`);

    // Lower temperature for more consistent quality while maintaining creativity
    const temperature = args.campaignType === "lead_nurture" ? 0.65 : 0.72;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature,
      max_tokens: 16000, // Increased for 200+ word emails per email in sequence
    });

    const responseText = completion.choices[0].message.content;
    if (!responseText) {
      throw new Error("No response from OpenAI");
    }

    const result = JSON.parse(responseText);
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
      edges.push({
        id: `edge-${previousNodeId}-${emailId}`,
        source: previousNodeId,
        target: emailId,
      });
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
        goalType: args.campaignType === "product_launch" || args.campaignType === "course_launch" ? "purchase" : "engagement",
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


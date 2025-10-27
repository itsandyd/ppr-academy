import { v } from "convex/values";
import { query } from "./_generated/server";

// ============================================================================
// PRE-DEFINED CAMPAIGN TEMPLATES
// ============================================================================

const CAMPAIGN_TEMPLATES = [
  {
    id: "new-product-launch",
    name: "New Product Launch",
    description: "Announce your latest sample pack, course, or product to your audience",
    category: "promotion",
    subject: "🎉 New {{productType}}: {{productName}} is here!",
    previewText: "Check out our latest {{productType}} - limited time offer inside",
    body: `Hey {{firstName}},

I'm excited to announce the launch of my newest {{productType}}: **{{productName}}**!

{{productDescription}}

🎯 **What's Inside:**
{{productFeatures}}

💰 **Special Launch Price:** {{price}} ({{discount}}% off regular price)

This launch price is only available for the next 48 hours, so grab it while you can!

👉 [Get {{productName}} Now]({{productLink}})

Questions? Just reply to this email - I read every message.

To your success,
{{creatorName}}

P.S. - {{psBenefit}}`,
    tags: ["launch", "promotion", "product"],
    useCase: "Product launches, course releases, sample pack drops",
    estimatedOpenRate: "28-35%",
    popular: true,
  },
  {
    id: "weekly-newsletter",
    name: "Weekly Newsletter",
    description: "Regular content digest with tips, updates, and exclusive offers",
    category: "content",
    subject: "🎵 This Week: {{mainTopic}}",
    previewText: "Production tips, new releases, and exclusive content inside",
    body: `Hey {{firstName}},

Welcome to this week's edition! Here's what I have for you:

**📚 This Week's Tip**
{{weeklyTip}}

**🎵 What I'm Working On**
{{creatorUpdate}}

**🆕 New Releases**
{{newReleases}}

**💎 Exclusive Offer**
{{exclusiveOffer}}

See you next week!
{{creatorName}}`,
    tags: ["newsletter", "content", "regular"],
    useCase: "Weekly updates, tips, and community building",
    estimatedOpenRate: "22-28%",
    popular: true,
  },
  {
    id: "abandoned-cart",
    name: "Cart Abandonment",
    description: "Remind users about items left in their cart",
    category: "automation",
    subject: "You left something behind... 🛒",
    previewText: "Complete your purchase and get {{discount}}% off",
    body: `Hey {{firstName}},

I noticed you were checking out **{{productName}}** but didn't complete your purchase.

Still interested? I'm offering {{discount}}% off just for you - but only for the next 24 hours.

👉 [Complete Your Purchase]({{checkoutLink}})

**What you'll get:**
{{productBenefits}}

{{socialProof}}

Questions? Reply to this email anytime.

Best,
{{creatorName}}`,
    tags: ["cart", "recovery", "sales"],
    useCase: "Recover abandoned checkouts and increase conversions",
    estimatedOpenRate: "35-42%",
    popular: true,
  },
  {
    id: "welcome-series",
    name: "Welcome Email",
    description: "First email in a welcome series for new subscribers",
    category: "automation",
    subject: "Welcome to {{communityName}}! Here's what to expect 👋",
    previewText: "Thanks for joining - here's your welcome gift inside",
    body: `Hey {{firstName}},

Welcome to the {{communityName}} family! I'm {{creatorName}}, and I'm so glad you're here.

**🎁 Here's Your Welcome Gift**
{{welcomeGift}}

**What to Expect:**
✅ Weekly production tips and tutorials
✅ Exclusive sample packs and presets
✅ Behind-the-scenes content
✅ Special subscriber-only discounts

**📚 Get Started:**
{{gettingStartedLinks}}

**👋 A Little About Me:**
{{creatorBio}}

Reply to this email and let me know what you're working on - I read every message!

To your success,
{{creatorName}}

P.S. - Check your spam folder and mark this as "not spam" so you don't miss future emails!`,
    tags: ["welcome", "onboarding", "first-email"],
    useCase: "Welcome new subscribers and set expectations",
    estimatedOpenRate: "45-55%",
    popular: true,
  },
  {
    id: "course-enrollment",
    name: "Course Enrollment Confirmation",
    description: "Welcome students who enrolled in your course",
    category: "transactional",
    subject: "🎓 You're enrolled! Here's how to get started with {{courseName}}",
    previewText: "Access your course and start learning today",
    body: `Hey {{firstName}},

Congratulations! You're now enrolled in **{{courseName}}**.

**🎯 Here's How to Get Started:**

1. [Access Your Course Dashboard]({{courseDashboardLink}})
2. Start with Module 1: {{firstModuleName}}
3. Join our private community: {{communityLink}}

**📱 Course Access:**
- Lifetime access to all course materials
- Future updates included free
- Download resources anytime
- Certificate upon completion

**💬 Need Help?**
Reply to this email or join our Discord community.

Ready to level up your production skills? Let's go!

{{creatorName}}

P.S. - {{courseBonus}}`,
    tags: ["course", "enrollment", "transactional"],
    useCase: "Onboard new course students",
    estimatedOpenRate: "65-75%",
    popular: false,
  },
  {
    id: "content-update",
    name: "Course/Content Update",
    description: "Notify students about new content or updates",
    category: "notification",
    subject: "🆕 New content added to {{courseName}}",
    previewText: "Fresh lessons and resources just for you",
    body: `Hey {{firstName}},

Great news! I just added new content to **{{courseName}}**.

**🎉 What's New:**
{{updatesList}}

**📚 Where to Find It:**
[Access the new content here]({{contentLink}})

These additions are based on your feedback and the most common questions I've been getting. I think you'll find them super valuable.

As always, if you have questions or need clarification, just reply to this email!

Keep creating,
{{creatorName}}`,
    tags: ["update", "content", "notification"],
    useCase: "Announce new course content to enrolled students",
    estimatedOpenRate: "40-50%",
    popular: false,
  },
  {
    id: "flash-sale",
    name: "Flash Sale / Limited Offer",
    description: "Create urgency with time-limited promotions",
    category: "promotion",
    subject: "⚡ 24-Hour Flash Sale: {{discount}}% OFF {{productName}}",
    previewText: "Ends tonight at midnight - don't miss out!",
    body: `{{firstName}},

This is it - my biggest discount of the year on {{productName}}.

⏰ **For the next 24 hours only:**
~~\$\{\{regularPrice\}\}~~ → **\$\{\{salePrice\}\}** (\{\{discount\}\}% OFF)

{{productDescription}}

**⚡ Why This Sale?**
{{saleReason}}

**🎁 Bonuses Included:**
{{bonuses}}

[Claim Your {{discount}}% OFF →]({{saleLink}})

**Sale Ends:** {{endTime}}

Don't wait - this price won't be available again.

{{creatorName}}

P.S. - {{urgencyMessage}}`,
    tags: ["sale", "urgency", "promotion"],
    useCase: "Drive immediate sales with limited-time offers",
    estimatedOpenRate: "32-40%",
    popular: true,
  },
  {
    id: "re-engagement",
    name: "Re-Engagement / Win-Back",
    description: "Bring back inactive subscribers",
    category: "retention",
    subject: "We miss you, {{firstName}} 💔",
    previewText: "Come back and get {{incentive}}",
    body: `Hey {{firstName}},

I haven't seen you around in a while, and I wanted to reach out personally.

**Here's what you've missed:**
{{missedContent}}

**I want to make it worth your while to come back:**
{{incentive}}

[Claim Your Welcome Back Offer]({{returnLink}})

This offer is only available to inactive members like yourself, so take advantage of it!

**Or if you'd prefer to unsubscribe**, I completely understand - just click [here]({{unsubscribeLink}}).

Hope to see you back!
{{creatorName}}`,
    tags: ["re-engagement", "win-back", "inactive"],
    useCase: "Reactivate subscribers who haven't engaged recently",
    estimatedOpenRate: "15-22%",
    popular: false,
  },
  {
    id: "feedback-request",
    name: "Feedback Request",
    description: "Ask for reviews, testimonials, or product feedback",
    category: "engagement",
    subject: "Quick question about {{productName}}",
    previewText: "I'd love your honest feedback (2 min survey)",
    body: `Hey {{firstName}},

You recently purchased **{{productName}}**, and I wanted to personally ask:

**How's it working for you?**

I'm always looking to improve, and your honest feedback helps me create better content for producers like you.

[Share Your Feedback (2 minutes)]({{surveyLink}})

**As a thank you**, everyone who completes the survey gets:
{{surveyIncentive}}

Thanks for being part of the community!

{{creatorName}}

P.S. - If you're loving it, I'd be incredibly grateful if you could [leave a review]({{reviewLink}})`,
    tags: ["feedback", "survey", "engagement"],
    useCase: "Collect testimonials and improve products",
    estimatedOpenRate: "25-32%",
    popular: false,
  },
];

// ============================================================================
// PRE-DEFINED AUTOMATION TEMPLATES
// ============================================================================

const AUTOMATION_TEMPLATES = [
  {
    id: "welcome-sequence",
    name: "Welcome Series (5 emails)",
    description: "Onboard new subscribers over 2 weeks",
    category: "onboarding",
    trigger: "new_subscriber",
    emails: [
      {
        delay: 0,
        subject: "Welcome! Here's your free gift 🎁",
        purpose: "Welcome + deliver lead magnet",
      },
      {
        delay: 2,
        subject: "Here's what to expect from me",
        purpose: "Set expectations + introduce content",
      },
      {
        delay: 5,
        subject: "My story + how I can help you",
        purpose: "Build connection + credibility",
      },
      {
        delay: 8,
        subject: "Your biggest production challenge?",
        purpose: "Engage + learn about subscriber",
      },
      {
        delay: 12,
        subject: "Special offer just for you",
        purpose: "First product offer",
      },
    ],
    tags: ["welcome", "onboarding", "nurture"],
    popular: true,
    conversionRate: "12-18%",
  },
  {
    id: "abandoned-cart-sequence",
    name: "Cart Recovery (3 emails)",
    description: "Recover abandoned checkouts automatically",
    category: "sales",
    trigger: "cart_abandoned",
    emails: [
      {
        delay: 1,
        subject: "You left something behind...",
        purpose: "Reminder with product benefits",
      },
      {
        delay: 24,
        subject: "Still interested? Here's 10% off",
        purpose: "Discount incentive",
      },
      {
        delay: 72,
        subject: "Last chance for your discount",
        purpose: "Final urgency push",
      },
    ],
    tags: ["cart", "recovery", "sales"],
    popular: true,
    conversionRate: "25-35%",
  },
  {
    id: "post-purchase-nurture",
    name: "Post-Purchase (4 emails)",
    description: "Maximize customer value after purchase",
    category: "retention",
    trigger: "product_purchased",
    emails: [
      {
        delay: 0,
        subject: "Thanks for your purchase! Here's how to get started",
        purpose: "Delivery + onboarding",
      },
      {
        delay: 3,
        subject: "How's {{productName}} working for you?",
        purpose: "Check-in + support offer",
      },
      {
        delay: 7,
        subject: "Maximize your results with these tips",
        purpose: "Usage tips + value add",
      },
      {
        delay: 14,
        subject: "You might also like...",
        purpose: "Cross-sell related products",
      },
    ],
    tags: ["post-purchase", "upsell", "retention"],
    popular: true,
    conversionRate: "15-22%",
  },
  {
    id: "course-drip",
    name: "Course Drip Sequence",
    description: "Release course content gradually",
    category: "education",
    trigger: "course_enrolled",
    emails: [
      {
        delay: 0,
        subject: "Module 1: {{moduleName}} is now available",
        purpose: "Deliver first module",
      },
      {
        delay: 3,
        subject: "Module 2: {{moduleName}} unlocked!",
        purpose: "Deliver second module",
      },
      {
        delay: 7,
        subject: "Module 3: {{moduleName}} ready for you",
        purpose: "Deliver third module",
      },
      {
        delay: 10,
        subject: "Module 4: {{moduleName}} + bonus content",
        purpose: "Deliver fourth module + extras",
      },
    ],
    tags: ["course", "drip", "education"],
    popular: false,
    conversionRate: "N/A",
  },
  {
    id: "engagement-reactivation",
    name: "Re-Engagement (3 emails)",
    description: "Win back inactive subscribers",
    category: "retention",
    trigger: "inactive_30_days",
    emails: [
      {
        delay: 0,
        subject: "We miss you, {{firstName}}",
        purpose: "Personal reconnection",
      },
      {
        delay: 3,
        subject: "Here's what you've missed",
        purpose: "Show value + updates",
      },
      {
        delay: 7,
        subject: "One last thing before you go...",
        purpose: "Final offer or goodbye",
      },
    ],
    tags: ["re-engagement", "inactive", "retention"],
    popular: false,
    conversionRate: "8-15%",
  },
  {
    id: "lead-magnet-nurture",
    name: "Lead Magnet Nurture (4 emails)",
    description: "Convert free download leads into customers",
    category: "nurture",
    trigger: "lead_magnet_downloaded",
    emails: [
      {
        delay: 0,
        subject: "Here's your {{leadMagnetName}} download",
        purpose: "Deliver lead magnet",
      },
      {
        delay: 2,
        subject: "How to get the most from {{leadMagnetName}}",
        purpose: "Usage tips + engagement",
      },
      {
        delay: 5,
        subject: "Take it to the next level",
        purpose: "Introduce paid product",
      },
      {
        delay: 10,
        subject: "Special offer for {{leadMagnetName}} downloaders",
        purpose: "Exclusive discount offer",
      },
    ],
    tags: ["lead-magnet", "nurture", "conversion"],
    popular: true,
    conversionRate: "18-25%",
  },
];

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get all campaign templates
 */
export const getCampaignTemplates = query({
  args: {
    category: v.optional(v.union(
      v.literal("promotion"),
      v.literal("content"),
      v.literal("transactional"),
      v.literal("notification"),
      v.literal("engagement"),
      v.literal("retention")
    )),
  },
  returns: v.array(v.object({
    id: v.string(),
    name: v.string(),
    description: v.string(),
    category: v.string(),
    subject: v.string(),
    previewText: v.string(),
    body: v.string(),
    tags: v.array(v.string()),
    useCase: v.string(),
    estimatedOpenRate: v.string(),
    popular: v.boolean(),
  })),
  handler: async (ctx, args) => {
    let templates = CAMPAIGN_TEMPLATES;
    
    if (args.category) {
      templates = templates.filter(t => t.category === args.category);
    }
    
    return templates;
  },
});

/**
 * Get single campaign template by ID
 */
export const getCampaignTemplateById = query({
  args: { templateId: v.string() },
  returns: v.union(v.object({
    id: v.string(),
    name: v.string(),
    description: v.string(),
    category: v.string(),
    subject: v.string(),
    previewText: v.string(),
    body: v.string(),
    tags: v.array(v.string()),
    useCase: v.string(),
    estimatedOpenRate: v.string(),
    popular: v.boolean(),
  }), v.null()),
  handler: async (ctx, args) => {
    const template = CAMPAIGN_TEMPLATES.find(t => t.id === args.templateId);
    return template || null;
  },
});

/**
 * Get all automation templates
 */
export const getAutomationTemplates = query({
  args: {
    category: v.optional(v.union(
      v.literal("onboarding"),
      v.literal("sales"),
      v.literal("retention"),
      v.literal("education"),
      v.literal("nurture")
    )),
  },
  returns: v.array(v.object({
    id: v.string(),
    name: v.string(),
    description: v.string(),
    category: v.string(),
    trigger: v.string(),
    emails: v.array(v.object({
      delay: v.number(),
      subject: v.string(),
      purpose: v.string(),
    })),
    tags: v.array(v.string()),
    popular: v.boolean(),
    conversionRate: v.string(),
  })),
  handler: async (ctx, args) => {
    let templates = AUTOMATION_TEMPLATES;
    
    if (args.category) {
      templates = templates.filter(t => t.category === args.category);
    }
    
    return templates;
  },
});

/**
 * Get single automation template by ID
 */
export const getAutomationTemplateById = query({
  args: { templateId: v.string() },
  returns: v.union(v.object({
    id: v.string(),
    name: v.string(),
    description: v.string(),
    category: v.string(),
    trigger: v.string(),
    emails: v.array(v.object({
      delay: v.number(),
      subject: v.string(),
      purpose: v.string(),
    })),
    tags: v.array(v.string()),
    popular: v.boolean(),
    conversionRate: v.string(),
  }), v.null()),
  handler: async (ctx, args) => {
    const template = AUTOMATION_TEMPLATES.find(t => t.id === args.templateId);
    return template || null;
  },
});

/**
 * Get template categories
 */
export const getTemplateCategories = query({
  args: { type: v.union(v.literal("campaign"), v.literal("automation")) },
  returns: v.array(v.object({
    value: v.string(),
    label: v.string(),
    count: v.number(),
  })),
  handler: async (ctx, args) => {
    if (args.type === "campaign") {
      const categories = new Map<string, number>();
      CAMPAIGN_TEMPLATES.forEach(t => {
        categories.set(t.category, (categories.get(t.category) || 0) + 1);
      });
      
      return Array.from(categories.entries()).map(([value, count]) => ({
        value,
        label: value.charAt(0).toUpperCase() + value.slice(1),
        count,
      }));
    } else {
      const categories = new Map<string, number>();
      AUTOMATION_TEMPLATES.forEach(t => {
        categories.set(t.category, (categories.get(t.category) || 0) + 1);
      });
      
      return Array.from(categories.entries()).map(([value, count]) => ({
        value,
        label: value.charAt(0).toUpperCase() + value.slice(1),
        count,
      }));
    }
  },
});


import { v } from "convex/values";
import { mutation } from "./_generated/server";

// ── Seed all 49 content briefs into the content planner ─────────────────────
// Run with: npx convex run seedContentBriefs:seed --args '{"storeId": "YOUR_STORE_ID"}'

export const seed = mutation({
  args: { storeId: v.string() },
  handler: async (ctx, args) => {
    // Check for existing briefs to avoid double-seeding
    const existing = await ctx.db
      .query("contentBriefs")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .take(1);
    if (existing.length > 0) {
      return { success: false, message: "Briefs already exist for this store. Delete them first to re-seed." };
    }

    const briefs = getAllBriefs(args.storeId);
    const ids = [];
    for (const brief of briefs) {
      const id = await ctx.db.insert("contentBriefs", brief);
      ids.push(id);
    }
    return { success: true, count: ids.length };
  },
});

// Clear all briefs for a store (use before re-seeding)
export const clearAll = mutation({
  args: { storeId: v.string() },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("contentBriefs")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .take(500);
    for (const brief of all) {
      await ctx.db.delete(brief._id);
    }
    return { success: true, deleted: all.length };
  },
});

// ── Brief data ──────────────────────────────────────────────────────────────

type BriefInput = {
  storeId: string;
  postNumber: number;
  title: string;
  category: string;
  platform: string;
  hook: string;
  brief: string;
  visualDirection?: string;
  cta?: string;
  dmKeyword?: string;
  source?: string;
  week?: number;
  dayOfWeek?: number;
  status: string;
  tags?: string[];
};

function getAllBriefs(storeId: string): BriefInput[] {
  return [
    // ═══════════════════════════════════════════════════════════════════════
    // WEEK 1 — Establish Authority
    // ═══════════════════════════════════════════════════════════════════════

    // 1.1 — The Stack I Killed
    {
      storeId,
      postNumber: 1.1,
      title: "The Stack I Killed",
      category: "Platform Replacement",
      platform: "Reel / TikTok",
      hook: "Every producer selling online is bleeding money on tools that don't talk to each other. Here's the math on what that actually costs.",
      brief: `PausePlayRepeat replaces 7 separate platforms music producers typically pay for. The platform has 134+ database tables (7,046-line schema.ts file), 186+ verified features, and supports 20 distinct product types. The 7 replaced platforms: (1) Kajabi ($149-600/month) for courses — PPR course system has 14 database tables, 32 features, 4-level hierarchy Course > Module > Lesson > Chapter, each chapter supports video/audio/text/downloads, drip content by days/dates/prerequisites, 6 quiz types, certificates with unique public verification codes at /verify/[id], AI reference guides, free preview chapters, 6-step creation wizard. (2) Mailchimp/ActiveCampaign ($30-259/month) — PPR email system: 50+ tables, 35 features, visual workflow builder with 14 node types including triggers/delays/conditions/actions, 45+ pre-built templates organized TOFU/MOFU/BOFU, A/B testing for subject lines + content + send times, lead scoring with letter grades A-F, dynamic segmentation with AND/OR combinators, send time optimization per subscriber, email processing every 30 seconds, workflows every 60 seconds, drip campaigns every 15 minutes. (3) Buffer ($25-50/month) — PPR AI content engine powered by Gemini 2.5 Flash + Fal.ai + ElevenLabs, generates platform-specific scripts for TikTok/YouTube/Instagram from one source, virality scoring 1-10, image generation in Excalidraw hand-drawn style, voiceover generation, 100+ TikTok hook templates, batch processing entire courses at once. (4) ManyChat ($15-65/month) — PPR DM automation: 18 features, 4 keyword match types (exact/contains/starts-with/regex), Smart AI responses via GPT-4o-mini reading last 10 messages, works on Instagram DMs + Twitter DMs + Facebook Messenger, rated 95% production-ready. (5) Gumroad ($0 + 10%) — PPR storefront: 20 product types at app/[slug]/page.tsx, custom branding, product grid with search/filtering, individual product pages with audio preview. (6) Patreon (8-12%) — PPR memberships: custom tiers, monthly/yearly billing, free trials, content gating by tier. (7) Zapier ($29/month) — PPR automations: purchase triggers > email sequences > drip campaigns > certificates, all built-in. Platform total: 8 automated cron jobs running 30s-24h intervals, 11 Stripe checkout flows, 26 webhook event types handled. Solo founder built.`,
      visualDirection: "Screen recording. Start on a desktop with 7 browser tabs open (Kajabi, Mailchimp, Buffer, ManyChat, Gumroad, Patreon, Zapier logos visible). Close each tab one by one. Then open PausePlayRepeat dashboard showing the unified creator view.",
      cta: "Comment STACK and I'll DM you the full breakdown of what each tool costs",
      dmKeyword: "STACK",
      source: "CONTENT-RESEARCH-PLATFORM-REPLACEMENT.md — Summary table. Creator letter: app/creators/page.tsx lines 110-125.",
      week: 1,
      dayOfWeek: 0,
      status: "brief",
      tags: ["authority", "platform-comparison", "hero-post"],
    },

    // 9.1 — You Need 10K Followers to Sell
    {
      storeId,
      postNumber: 9.1,
      title: '"You Need 10K Followers to Sell"',
      category: "Myth Busting",
      platform: "Reel / TikTok",
      hook: '"I\'ll start selling when I hit 10K followers." No. You need 100 real fans. Here\'s the math.',
      brief: `The most common excuse from producers: "I don't have enough followers." Math breakdown: A $30 sample pack with standard 2% conversion rate. At 10,000 followers = 200 buyers = $6,000. At 1,000 followers = 20 buyers = $600. At 500 followers = 10 buyers = $300. Kevin Kelly's 1,000 True Fans theory (2008) — you don't need massive audience, you need a small audience that trusts you. PPR's follow gate feature (convex/followGateSubmissions.ts) helps identify real fans: offer free cheat sheet, gate behind email + Instagram follow. People who complete that process are qualified leads. The follow gate captures email addresses and social follows simultaneously, building a qualified lead list. First customers aren't random followers — they're the people who already DM asking for help, comment on every post, have been following for months. 10-20 engaged fans buying a $30 product = $300-600 first month. PPR marketplace (convex/marketplace.ts) gives new products visibility via "Newest" sort — baseline discovery without any following at all.`,
      visualDirection: "Text-on-screen math breakdown: 500 followers x 2% = 10 sales x $30 = $300. Then: 20 real fans x $30 = $600. Show the follow gate capture flow.",
      cta: 'Your first 20 fans are already following you. DM me "START" to reach them.',
      dmKeyword: "START",
      source: "convex/followGateSubmissions.ts — follow gate. CONTENT-RESEARCH-ZERO-TO-PRODUCT.md.",
      week: 1,
      dayOfWeek: 1,
      status: "brief",
      tags: ["myth-busting", "math", "follow-gate"],
    },

    // 1.2 — I Replaced Mailchimp
    {
      storeId,
      postNumber: 1.2,
      title: "I Replaced Mailchimp (and it's not even close)",
      category: "Platform Replacement",
      platform: "Carousel / TikTok",
      hook: "Someone downloads your free sample pack. You get their email. Then what? If you're like most producers — nothing. That silence is costing you thousands.",
      brief: `PPR email marketing system replaces Mailchimp/ActiveCampaign ($30-259/month). Built from scratch with 50+ database tables, 35 features, 27,000+ lines of code. Visual workflow builder with 14 node types: triggers (lead signup, purchase, enrollment, form submit, date-based), delays (fixed time, specific date, wait for event), conditions (if/else branching on segment membership, purchase history, email opens), actions (send email, update contact, add tag, move to segment). 45+ pre-built email templates organized by funnel stage: TOFU (awareness — welcome series, free resource delivery), MOFU (consideration — case studies, comparisons, behind-the-scenes), BOFU (decision — limited offers, testimonials, urgency). A/B testing for subject lines, email content, and send times. Lead scoring with letter grades A-F based on engagement (opens, clicks, replies, purchases). Dynamic segmentation with AND/OR logic combinators — combine multiple conditions. Send time optimization per subscriber based on historical open times. Processing intervals: emails every 30 seconds, workflow execution every 60 seconds, drip campaigns every 15 minutes. Pre-built automation sequences: Producer Welcome Series, Free-to-Paid conversion, Cart Recovery, Post-Purchase nurture. Every new creator gets this included — no extra charge on any plan.`,
      visualDirection: "Carousel: 1. Hook text 2. Screenshot of visual workflow builder 3. Template library TOFU/MOFU/BOFU 4. Split screen: ActiveCampaign pricing vs PPR included 5. Stats: 50+ tables, 35 features",
      cta: 'Comment EMAIL and I\'ll DM you a walkthrough of the workflow builder',
      dmKeyword: "EMAIL",
      source: "CONTENT-RESEARCH-PLATFORM-REPLACEMENT.md Section 3. CONTENT-RESEARCH-PLATFORM-COMPARISON.md Section 2. CONTENT-RESEARCH-FEATURE-PAIN-MAP.md Section 1.",
      week: 1,
      dayOfWeek: 2,
      status: "brief",
      tags: ["platform-replacement", "email-marketing"],
    },

    // 4.1 — Your Buyers Can't Hear the Sounds
    {
      storeId,
      postNumber: 4.1,
      title: "Your Buyers Can't Hear the Sounds Before They Buy",
      category: "Competitor Gaps",
      platform: "Reel / TikTok",
      hook: "You buy a $29 sample pack. You download the zip. You open it. Half the sounds aren't what you expected. This is why refund rates for sample packs are insane — and it's a solvable problem.",
      brief: `Gumroad sample pack buying experience: see product image, read description, maybe hear a mixed-down demo loop, pay $20, download zip, open it, 200 samples, use maybe 5. PPR sample marketplace experience (app/marketplace/samples/page.tsx): browse by genre (14 genres available), filter by category (drums, bass, synth, vocals, FX, melody, loops, one-shots — 8 categories), click play on any individual sound, full waveform visualization via HTML5 audio (components/ui/audio-waveform.tsx — canvas-based waveform rendering), see BPM, key, duration metadata per sample. getSamplesFromPacks function extracts individual files from packs for preview. Buyers can purchase individual sounds or the whole pack. Sample pack creation wizard for creators: 4-step wizard — pack details (genre, BPM, key, license type), file upload, optional follow gate for lead capture, pricing. Individual sample metadata gets attached per file. 14 genres supported for filtering. This changes how sample packs sell — good sounds sell themselves when people can actually hear them. Production readiness: Sample Pack Preview rated yellow (functional). Content-Ready Fact #1: "Buyers can preview every individual sound before purchasing."`,
      visualDirection: "Split screen. Left: Gumroad sample pack page — static image, Add to cart, zip download. Right: PPR samples marketplace — filters, play buttons, waveforms, individual sound metadata.",
      cta: 'Comment SAMPLES and I\'ll DM you a link to hear the difference',
      source: "CONTENT-RESEARCH-SAMPLE-PREVIEW.md Sections 2-3. PRODUCTION-READINESS-AUDIT.md.",
      week: 1,
      dayOfWeek: 3,
      status: "brief",
      tags: ["competitor-gaps", "sample-preview", "gumroad"],
    },

    // 1.3 — I Replaced ManyChat
    {
      storeId,
      postNumber: 1.3,
      title: "I Replaced ManyChat and Added AI",
      category: "Platform Replacement",
      platform: "Reel / TikTok",
      hook: "Every comment on your post is a potential customer telling you they're interested. Most producers reply manually — or worse, they don't reply at all. Here's how to fix that.",
      brief: `ManyChat costs $15-65/month for comment-to-DM automation. PPR DM automation system (PRODUCTION-READINESS-AUDIT.md Section E: rated 95% production-ready, all features green): 18 features total. Keyword matching with 4 match types: exact, contains, starts with, regex. Attach automations to specific posts or all future posts. Two response modes: (1) preset message with product links, download URLs, enrollment links, (2) Smart AI responses via GPT-4o-mini that reads the last 10 messages in the conversation thread, understands context, and replies like a human. ManyChat sends canned responses — PPR's AI understands what the user is actually asking about. Auto-sends download links, product pages, course enrollment links. Works on Instagram DMs, Twitter DMs, and Facebook Messenger. Built into every creator plan — zero extra dollars. The automation dashboard (convex/automations.ts) shows keyword triggers, Smart AI toggle, chat history in the backend. Real example flow: someone comments "STEMS" on a post → system detects keyword match → sends DM within seconds with the download link → no human intervention needed.`,
      visualDirection: "Screen recording: Instagram post with comment 'STEMS' → Instagram DM showing auto-reply with download link → PPR automation dashboard with keyword trigger and Smart AI toggle.",
      cta: 'Comment AUTOMATION and I\'ll DM you how to set this up',
      dmKeyword: "AUTOMATION",
      source: "CONTENT-RESEARCH-PLATFORM-REPLACEMENT.md Section 7. PRODUCTION-READINESS-AUDIT.md Section E.",
      week: 1,
      dayOfWeek: 4,
      status: "brief",
      tags: ["platform-replacement", "dm-automation", "ai"],
    },

    // 9.2 — Nobody Will Pay for Presets
    {
      storeId,
      postNumber: 9.2,
      title: '"Nobody Will Pay for Presets When Free Ones Exist"',
      category: "Myth Busting",
      platform: "Reel / TikTok",
      hook: "There are 10,000 free Serum presets on the internet. People still pay $30 for curated packs. Here's why.",
      brief: `"Why would anyone pay for presets when there are free ones everywhere?" Same reason people pay for sample packs when Splice exists, courses when YouTube is free, restaurants when they have a kitchen. Convenience, curation, trust. A free preset folder from Reddit: 500 presets, 490 garbage, 3 hours auditioning to find 10 usable. A curated preset pack from a trusted producer: 50 presets all usable, making music in 5 minutes. People aren't paying for files — they're paying for time saved, curation, and trust in your ears. Producers making real money compete on trust and specificity, not quantity. "50 Dark Trap Serum Presets from [specific producer]" beats "1000 Free Presets" every time. On PPR (app/marketplace/preset-packs/page.tsx): preset packs show target plugin (50+ plugins supported including Serum, Vital, Massive, Omnisphere, Sylenth1, Phase Plant, Pigments), genre tags, creator name. Buyers filter by plugin, DAW, genre, free-only toggle. Creator gets full attribution. The marketplace surfaces YOUR presets when someone searches for that specific plugin + genre combination. Creation wizard: 4-step wizard with plugin selection from 50+ options.`,
      visualDirection: "Split screen: Left — Reddit preset dump, 500 files, no organization. Right — PPR preset pack with plugin badge, genre tag, creator name.",
      cta: "If you have presets people have asked for, they'll pay for them. Link in bio.",
      source: "app/marketplace/preset-packs/page.tsx. CONTENT-RESEARCH-PLATFORM-COMPARISON.md Section 1.",
      week: 1,
      dayOfWeek: 5,
      status: "brief",
      tags: ["myth-busting", "presets"],
    },

    // 3.1 — I Lost Thousands Before Automation
    {
      storeId,
      postNumber: 3.1,
      title: '"I Lost Thousands Before I Set Up Automation"',
      category: "Origin Story",
      platform: "Reel / TikTok",
      hook: "Someone downloaded my free sample pack. I never followed up. That person was ready to buy my $50 course. I'll never know.",
      brief: `Origin story: For the first year of selling, no email automation. Someone downloads free sample pack → get their email → then nothing. No follow-up, no nurture sequence, no second touchpoint. Leaving money on the table every day. By the time realization hit, thousands of potential sales lost from interested people who never heard back. That's why PPR has a full email marketing platform built in. Visual workflow builder (convex/emailWorkflows.ts) with 14 node types. Drip campaigns that fire automatically on lead_signup trigger. 45+ pre-built templates organized by funnel stage (TOFU/MOFU/BOFU). Example automated sequence: Lead signs up → Welcome email sends immediately (Day 0) → Day 2: value email about best content → Day 4: social proof from other students → Day 6: soft pitch with coupon code. System runs forever on autopilot for every single person who downloads. Additional pre-built sequences: "Free Pack to Paid Pack" conversion sequence, Producer Welcome Series, Cart Recovery. Workflow builder has 15+ trigger types including purchase, enrollment, form submit, date-based. CONTENT-RESEARCH-FEATURE-PAIN-MAP.md: "I lost thousands of sales before I set up automation."`,
      visualDirection: "Face to camera for story. Cut to screen recording of email workflow builder — lead_signup trigger → email nodes with delay nodes. Show template library.",
      cta: 'DM me "WORKFLOW" and I\'ll show you how to set one up',
      dmKeyword: "WORKFLOW",
      source: "CONTENT-RESEARCH-FEATURE-PAIN-MAP.md Section 1. CONTENT-RESEARCH-PLATFORM-COMPARISON.md Section 2.",
      week: 1,
      dayOfWeek: 6,
      status: "brief",
      tags: ["origin-story", "email-automation", "pain-point"],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // WEEK 2 — Deepen Pain Points
    // ═══════════════════════════════════════════════════════════════════════

    // 1.4 — I Replaced Buffer
    {
      storeId,
      postNumber: 1.4,
      title: "I Replaced Buffer With an AI Content Engine",
      category: "Platform Replacement",
      platform: "Reel / TikTok",
      hook: "You spent 2 hours making a tutorial. Now you need to turn it into posts for TikTok, Instagram, YouTube, and Twitter. That's another 4 hours. Every week. Here's a better way.",
      brief: `Buffer costs $25-50/month and only schedules posts you already wrote. PPR AI content engine (CONTENT-RESEARCH-EVERGREEN-ENGINE.md): full 8-stage pipeline powered by Gemini 2.5 Flash + Fal.ai + ElevenLabs. Feed it one course chapter → generates 3 platform-specific scripts (TikTok with viral hooks, YouTube with educational structure, Instagram with engagement formatting) → scores each script for virality on 1-10 scale with breakdown → generates images in Excalidraw hand-drawn style via Fal.ai → generates voiceover with ElevenLabs → writes platform-specific captions with correct hashtag count per platform. Batch processing: 5 chapters in parallel, 30 chapters = 90 content pieces. 100+ TikTok hook templates built in. Social scheduling now works for Instagram, Twitter, Facebook, and LinkedIn (TikTok not yet auto-posting). From one piece of content → everything needed for 3 platforms. AI Script Generation rated green/production-ready. The content calendar view shows scheduled posts across days. That's not scheduling — that's a content factory.`,
      visualDirection: "Screen recording: 6-step pipeline. Select course chapter → 3 scripts side by side → virality score → generated images → voiceover → captions with hashtags → calendar view.",
      cta: "Comment CONTENT and I'll DM you how the pipeline works",
      dmKeyword: "CONTENT",
      source: "CONTENT-RESEARCH-EVERGREEN-ENGINE.md Section 1. PRODUCTION-READINESS-AUDIT.md Section D.",
      week: 2,
      dayOfWeek: 0,
      status: "brief",
      tags: ["platform-replacement", "ai-content", "buffer"],
    },

    // 9.3 — I'm Not Good Enough to Teach
    {
      storeId,
      postNumber: 9.3,
      title: '"I\'m Not Good Enough to Teach"',
      category: "Myth Busting",
      platform: "Reel / TikTok",
      hook: "You don't need to be the best producer in the world to teach. You just need to be 2 steps ahead of someone.",
      brief: `Common objection from producers with 5+ years experience who've mixed hundreds of tracks and get DMs for advice: "I'm not good enough to teach." You don't need a Grammy — you need to know something someone else doesn't yet. Producer with 2 years experience knows things 6-month producer doesn't: compressor chains, clean low end, proper sidechain. That's a course, cheat sheet, coaching session. The myth: need to be world's expert. Reality: need to be helpful to the person one step behind you. PPR course system (convex/courses.ts) supports free preview chapters — let people taste your teaching before buying. If free content is helpful, they'll pay for full course. Certificates auto-generate (convex/certificates.ts) at 100% completion with unique verification codes at /verify/[certificateId] — social proof for students, credibility for creators. Lowest barrier entry: upload a PDF cheat sheet (app/dashboard/create/pdf/ — 4-step wizard), set it free, see if people find it useful. The market will tell you if you're "good enough." The "2 steps ahead" teaching principle is widely cited in education.`,
      visualDirection: "Text-on-screen: '2 years experience → 0-6 month producers need YOU.' Show course creation wizard — free preview toggle. Certificate being generated.",
      cta: 'DM me "TEACH" — I\'ll help you figure out your first topic',
      dmKeyword: "TEACH",
      source: "convex/courses.ts, convex/certificates.ts, app/dashboard/create/pdf/. CONTENT-RESEARCH-ZERO-TO-PRODUCT.md.",
      week: 2,
      dayOfWeek: 1,
      status: "brief",
      tags: ["myth-busting", "teaching", "courses"],
    },

    // 4.2 — Exclusive Beats Auto-Remove
    {
      storeId,
      postNumber: 4.2,
      title: "Exclusive Beats That Actually Auto-Remove",
      category: "Competitor Gaps",
      platform: "Reel / TikTok",
      hook: "If you sell beats, you've had this nightmare: someone buys the exclusive and you forget to delist it. Now two people think they own it. Here's how that problem gets solved automatically.",
      brief: `BeatStars problem: sell exclusive beat, have to manually delist. Forget = someone else tries to buy = double-selling problem. PPR auto-removal flow (convex/beatLeases.ts:237-258): (1) Stripe payment clears, (2) beat automatically unpublished from marketplace (isPublished: false), (3) all other license tiers show "This beat has been sold exclusively" with Crown icon, (4) UI disables all purchase buttons, (5) exclusiveSoldAt timestamp recorded. Race condition protection built in: if two people try to buy exclusive simultaneously, only one succeeds, other gets error message. No double-selling possible. 4-tier licensing system: Basic ($25 default — MP3+WAV, 5,000 distribution, 100,000 streams, credit required), Premium ($75 default — MP3+WAV+Stems, 50,000 copies, commercial use), Exclusive ($500 default — all files+trackouts, unlimited distribution, radio rights), Unlimited (fully customizable). Every tier configurable per beat. PDF license agreements auto-generated via pdf-lib with buyer info, beat details, all legal terms. BeatStars charges $10-20/month for licensing. Gumroad has zero licensing. PPR: included.`,
      visualDirection: "Screen recording: Beat with 4 tiers → simulate exclusive purchase → page updates to 'Exclusively Sold' with Crown icon, tiers disabled. Show backend log.",
      cta: "Comment BEATS and I'll DM you how the licensing system works",
      dmKeyword: "BEATS",
      source: "CONTENT-RESEARCH-SAMPLE-PREVIEW.md Section 5. CONTENT-RESEARCH-PLATFORM-COMPARISON.md Section 6.",
      week: 2,
      dayOfWeek: 2,
      status: "brief",
      tags: ["competitor-gaps", "beat-licensing", "exclusive"],
    },

    // 1.5 — $600/Month for Kajabi
    {
      storeId,
      postNumber: 2.3,
      title: "$600/Month for Kajabi (Built for Life Coaches)",
      category: "Cost Comparison",
      platform: "Reel / TikTok",
      hook: "Every course platform is built for life coaches selling 'manifest your dream life' programs. None of them know what a beat license is. That's a problem.",
      brief: `Kajabi starts at $149/month, higher tier $600/month. For a course platform that didn't know what a beat license was, didn't have audio preview, didn't have BPM detection, didn't have follow gates. Built for "manifest your dream life" courses, not Serum presets and mixing tutorials. PPR course system (app/dashboard/create/course/): 14 database tables, 32 features. 4-level hierarchy: Course > Module > Lesson > Chapter. Each chapter supports video, audio, text content, downloadable resources. Drip content that unlocks by days, dates, or prerequisites. 6 quiz question types for student assessment. Certificates with public verification codes at /verify/[id]. AI-generated reference guides from course content. Free preview chapters so people can try before buying. 6-step creation wizard: thumbnail, content structure, pricing, checkout customization, follow gate, options (certificates, drip scheduling). Student progress tracking rated green in production audit. Certificates rated yellow (functional). Course creation wizard functional. And this is just one piece of the platform — not $600/month.`,
      visualDirection: "Split screen: Kajabi pricing $149-600/month vs PPR course wizard showing 5-step flow, module editor, drip content settings.",
      cta: "Comment COURSES and I'll DM you what a music production course platform actually looks like",
      dmKeyword: "COURSES",
      source: "CONTENT-RESEARCH-PLATFORM-REPLACEMENT.md Section 1. app/creators/page.tsx line 110. PRODUCTION-READINESS-AUDIT.md Section A.",
      week: 2,
      dayOfWeek: 3,
      status: "brief",
      tags: ["cost-comparison", "kajabi", "courses"],
    },

    // 3.3 — None of the Platforms Had a Storefront
    {
      storeId,
      postNumber: 3.3,
      title: '"None of the Platforms Had a Storefront for What We Sell"',
      category: "Origin Story",
      platform: "Carousel",
      hook: "Linktree gives you links. Gumroad gives you a checkout page. Neither one is a storefront.",
      brief: `Need: landing page from Instagram bio showing courses, sample packs, presets, coaching — all branded, one page. Shopify: built for physical products, doesn't know what a beat license is. Gumroad: every store looks the same, just a list of checkout links. Linktree: just links, no product grid, no filtering, no audio preview. PPR storefront (app/[slug]/page.tsx, 63KB file): custom URL at pauseplayrepeat.com/your-name, custom branding (logo, banner, accent color), product grid with search and filtering, featured product pinning, mobile link-in-bio layout for Instagram traffic, social links for 15+ platforms. Individual product pages for every type: beats with audio preview and licensing tiers, sample packs with individual sound preview, courses with chapter structure, coaching with booking calendar. 20 product types defined in schema.ts:1124-1161. 8 product card components for different types. Storefront & Products rated 75% production-ready — 16 of 20 product types have full creation wizards. Not a checkout page — an actual store.`,
      visualDirection: "Carousel: 1. Hook 2. Linktree (generic links) 3. Gumroad (basic checkout) 4. PPR storefront — branded hero, product grid, social links 5. Mobile link-in-bio 6. Beat detail with audio player 7. Sample marketplace preview 8. 'Your store lives at pauseplayrepeat.com/your-name'",
      cta: 'DM me "STORE" and I\'ll help you set yours up',
      dmKeyword: "STORE",
      source: "CONTENT-RESEARCH-FEATURE-PAIN-MAP.md Section 5. CONTENT-RESEARCH-PLATFORM-REPLACEMENT.md Section 2.",
      week: 2,
      dayOfWeek: 4,
      status: "brief",
      tags: ["origin-story", "storefront", "link-in-bio"],
    },

    // 9.4 — Selling Online is NOT Passive Income
    {
      storeId,
      postNumber: 9.4,
      title: '"Selling Online is Passive Income"',
      category: "Myth Busting",
      platform: "Reel / TikTok",
      hook: "I need to be honest. Selling digital products is NOT passive income. Here's what it actually requires.",
      brief: `Everyone selling courses about selling courses calls it "passive income." Honest truth: passive income = do nothing, money appears. Doesn't exist in music production. Reality: 20 hours creating quality sample pack + 5 hours product descriptions/demo/listing + 10 hours promotion content + 3 hours email sequences. After setup — yes, automation runs 24/7. Email sequences nurture leads (convex/emailWorkflows.ts — sequences run forever once set up). Marketplace provides discovery. AI content engine repurposes one piece of content across platforms. But still need to: create new content regularly for traffic, respond to customer questions, update products based on feedback, create new products, monitor and adjust. The "passive" part is real — storefront/email/content library work for you 24/7. Tools reduce the work, don't eliminate it. PPR specifically designed so setup work compounds — content you create once gets repurposed by AI engine, email sequences built once run forever (CONTENT-RESEARCH-EVERGREEN-ENGINE.md). If someone says it's easy money, they're selling something. "I'm selling you a tool that makes the hard work more efficient." Direct mirror of creator letter voice (app/creators/page.tsx lines 712-754: "What I Won't Tell You" section).`,
      visualDirection: "Face to camera, honest tone. Text breakdown: '20 hours creating + 5 hours listing + 10 hours promoting + 3 hours automation = ongoing work that compounds.'",
      cta: "If you're willing to do the work, the tools are ready. Link in bio.",
      source: "app/creators/page.tsx lines 712-754. CONTENT-RESEARCH-EVERGREEN-ENGINE.md.",
      week: 2,
      dayOfWeek: 5,
      status: "brief",
      tags: ["myth-busting", "honesty", "expectations"],
    },

    // 3.4 — I Needed Different Tools for Everything
    {
      storeId,
      postNumber: 3.4,
      title: '"I Needed Different Tools for Everything"',
      category: "Origin Story",
      platform: "Reel / TikTok",
      hook: "Gumroad for downloads. Teachable for courses. Calendly for coaching. Patreon for memberships. Four platforms, four dashboards, four payment processors, zero connection.",
      brief: `Fragmentation pain: Gumroad for sample packs, Teachable for courses, Calendly for coaching, Patreon for memberships. Four platforms. When a student bought course on Teachable and wanted sample pack, had to create new account on Gumroad. Losing customers at every handoff. PPR: 20 product types in one platform (schema.ts:1124-1161): sample packs, preset packs, MIDI packs, beat leases with 4 licensing tiers, project files, mixing templates, effect chains, Ableton racks, courses, coaching, mixing services, mastering services, memberships, bundles, tip jars, PDF guides, playlist curation, music releases, workshops, masterclasses. One account, one checkout, one customer identity, one analytics dashboard. Student can buy course + grab preset pack + book coaching call + subscribe to membership — without leaving store or creating new account. Product creation menu in dashboard (app/dashboard/create/) shows all types. Marketplace has 14 categories for discovery. Each product type has a dedicated creation wizard with music-specific fields.`,
      visualDirection: "Quick cuts between 4 platform dashboards (Gumroad, Teachable, Calendly, Patreon) → PPR dashboard showing all 20 product types in one place.",
      cta: "Link in bio to see all 20 product types",
      source: "CONTENT-RESEARCH-FEATURE-PAIN-MAP.md Section 6. CONTENT-RESEARCH-PLATFORM-REPLACEMENT.md Section 2.",
      week: 2,
      dayOfWeek: 6,
      status: "brief",
      tags: ["origin-story", "fragmentation", "product-types"],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // WEEK 3 — Product Deep Dives 1
    // ═══════════════════════════════════════════════════════════════════════

    // 7.1 — Beat Leases
    {
      storeId,
      postNumber: 7.1,
      title: "Beat Leases (with Licensing Tiers)",
      category: "Product Deep Dives",
      platform: "Carousel / TikTok",
      hook: "You're selling beats in DMs with PayPal invoices and no contracts. Someone disputes the payment, you have zero proof of what they bought. Here's how beat licensing should actually work.",
      brief: `Current beat selling: DM negotiations, PayPal invoices, emailed files, prayer they don't dispute. No contract, no terms, no paper trail. PPR beat licensing (convex/beatLeases.ts): 4 tiers fully configurable per beat. Basic ($25 default) — MP3+WAV, 5,000 distribution copies, 100,000 audio streams, credit required. Premium ($75 default) — MP3+WAV+Stems, 50,000 copies, commercial use, music video rights. Exclusive ($500 default) — all files including trackouts, unlimited distribution, unlimited streams, radio broadcasting rights. Unlimited — fully customizable terms. PDF contracts auto-generate via pdf-lib (app/api/beats/contract/route.ts) with beat title, seller name, buyer name, every term spelled out: distribution limits, streaming limits, commercial use rights, music video rights, radio rights. Exclusive auto-removal (convex/beatLeases.ts:237-258): on exclusive purchase → beat auto-unpublished, exclusiveSoldAt timestamp, all tiers disabled, Crown icon badge. Race condition protection — only one exclusive purchase can succeed. Free tier works as lead magnet: MP3 only, producer tag required, 1,000 distribution cap, gate behind email follow for list building. BeatStars charges $10-20/month. Gumroad has zero licensing. PPR: included. Beat Licensing Tiers rated green. Exclusive Auto-Removal rated green.`,
      visualDirection: "Carousel: 1. Hook with waveform background 2. Licensing form screenshot 3. Pricing table: Basic $25/Premium $75/Exclusive $500 4. Auto-generated PDF contract 5. 'SOLD — Exclusive' badge 6. Free tier as lead magnet",
      cta: 'DM me "BEATS" to see the licensing system',
      dmKeyword: "BEATS",
      source: "convex/beatLeases.ts. app/api/beats/contract/route.ts. CONTENT-RESEARCH-PLATFORM-COMPARISON.md Section 6. PRODUCTION-READINESS-AUDIT.md.",
      week: 3,
      dayOfWeek: 0,
      status: "brief",
      tags: ["product-deep-dive", "beats", "licensing"],
    },

    // 7.2 — Sample Packs
    {
      storeId,
      postNumber: 7.2,
      title: "Sample Packs (with Individual Preview)",
      category: "Product Deep Dives",
      platform: "Reel / TikTok",
      hook: "Your sample pack has 200 fire sounds but buyers only hear one demo loop before purchasing. No wonder they request refunds. What if they could preview every single sound first?",
      brief: `Gumroad sample pack experience: product image, description "50 drum loops, 30 one-shots, 20 FX", pay $29, download zip, half the sounds aren't what you expected. Standard everywhere — blind purchase, no preview. PPR sample marketplace (app/marketplace/samples/page.tsx): every sample has its own audio player with waveform visualization (components/ui/audio-waveform.tsx — canvas-based waveform rendering). Click play, hear the sound. See BPM, key, genre, category metadata per sample. Filter by category: drums, bass, synth, vocals, FX, melody, loops, one-shots (8 categories). Filter by 14 genres. getSamplesFromPacks function extracts individual files. Buyer knows exactly what they're getting — no guesswork, no refund requests. Creator upload: 4-step wizard (app/dashboard/create/pack/) — pack details with genre/BPM/key fields, file upload, optional follow gate for lead capture, pricing. Individual sample metadata attached per file. Set genre, BPM, key, license type for the whole pack. Gumroad: file upload + checkout page. PPR: music-specific storefront for your sounds. Sample Pack Preview rated yellow (functional).`,
      visualDirection: "Screen recording: Marketplace sample browser → click into pack → individual sample list with play buttons → waveform animating → filter by drums → filter by Trap → BPM/key badges. Then creator wizard.",
      cta: 'DM me "SAMPLES" to see a live pack',
      dmKeyword: "SAMPLES",
      source: "app/marketplace/samples/page.tsx. CONTENT-RESEARCH-SAMPLE-PREVIEW.md. PRODUCTION-READINESS-AUDIT.md.",
      week: 3,
      dayOfWeek: 1,
      status: "brief",
      tags: ["product-deep-dive", "samples", "audio-preview"],
    },

    // 4.3 — Patreon Can't Sell One-Time Products
    {
      storeId,
      postNumber: 4.3,
      title: "Patreon Can't Sell One-Time Products",
      category: "Competitor Gaps",
      platform: "Carousel",
      hook: "Someone wants to buy ONE preset pack from you. But your only option is a monthly subscription tier. They leave. You lose the sale. This is the Patreon trap nobody talks about.",
      brief: `Patreon is subscriptions only. Want one $15 preset pack? Subscribe to an entire tier. Every month. Even if you just wanted one thing. Doesn't work for music producers who sell individual products AND subscriptions. Buyer might want: one beat lease for specific track ($25-500 one-time), sample pack for current project ($20 one-time), monthly membership for everything (recurring). PPR (CONTENT-RESEARCH-MEMBERSHIPS-VS-PATREON.md Section 2): completely separate checkout flows — 5 different checkout endpoints. A user can be subscribed to $15/month membership AND buy $50 beat lease on same store. Both tracked separately, both generate creator earnings. One-time purchases: individual product checkout via Stripe. Recurring: membership checkout with monthly/yearly billing. Beat leases: per-tier checkout with licensing terms. Bundles: bundled checkout with auto-calculated savings. Services: service order checkout with requirements form. Patreon forces all-or-nothing subscription model. PPR gives buyers the choice: one-time, subscription, licensing tiers — all in one store.`,
      visualDirection: "Carousel: 1. Hook 2. Patreon limitation 3. PPR store: one-time + membership side by side 4. Checkout options 5. Beat licensing tiers 6. 'One-time. Subscription. Licensing. All in one store.'",
      cta: 'Comment COMPARE and I\'ll DM you the full Patreon limitation breakdown',
      dmKeyword: "COMPARE",
      source: "CONTENT-RESEARCH-MEMBERSHIPS-VS-PATREON.md Section 2.",
      week: 3,
      dayOfWeek: 2,
      status: "brief",
      tags: ["competitor-gaps", "patreon", "one-time-vs-recurring"],
    },

    // 7.3 — Preset Packs
    {
      storeId,
      postNumber: 7.3,
      title: "Preset Packs (with Plugin-Specific Filtering)",
      category: "Product Deep Dives",
      platform: "Carousel / TikTok",
      hook: "You made 200 Serum presets. You list them online. Someone searching for 'Vital presets for Future Bass' never finds them because the platform doesn't know what a synth plugin is. That's broken.",
      brief: `Gumroad preset listing: says "Serum presets", buyer trusts you, no plugin filtering, no DAW compatibility, no way to browse "all Vital presets for Future Bass." PPR preset packs (app/marketplace/preset-packs/page.tsx): creation wizard first asks: what plugin? Serum, Vital, Massive, Omnisphere, Sylenth1, Phase Plant, Pigments — 50+ plugins supported. Metadata isn't decorative — marketplace buyers filter by target plugin, DAW, genre, free-only toggle. Someone looking for Vital presets finds YOUR Vital presets, surfaced because system knows what they are, not buried in search. 4-step creation wizard (app/dashboard/create/pack/): pack details with plugin selection from 50+ options, file upload, optional follow gate for lead capture, pricing. Pack type selector for sample/preset/midi differentiation. Product Types rated yellow (16/20 wizards functional). Preset packs are one of the functional wizard types. Genre tags, DAW compatibility, target plugin — all filterable. Gumroad: generic file with a price. PPR: music-specific metadata that drives discovery.`,
      visualDirection: "Carousel: 1. Hook 2. Gumroad vs PPR side-by-side 3. Marketplace plugin dropdown (Serum, Vital, Massive...) 4. Creator wizard with plugin selection 5. Filtered 'Vital presets' results",
      cta: "Link in bio to browse preset marketplace",
      source: "app/marketplace/preset-packs/page.tsx. CONTENT-RESEARCH-PLATFORM-COMPARISON.md Section 1. PRODUCTION-READINESS-AUDIT.md.",
      week: 3,
      dayOfWeek: 3,
      status: "brief",
      tags: ["product-deep-dive", "presets", "plugin-filtering"],
    },

    // 7.5 — Courses
    {
      storeId,
      postNumber: 7.5,
      title: "Courses (with Modules, Chapters, and Certificates)",
      category: "Product Deep Dives",
      platform: "Carousel / TikTok",
      hook: "You know enough about mixing to teach a course. But Teachable costs $149/month and wasn't built for music producers. Here's what a course platform actually designed for us looks like.",
      brief: `Teachable: $39/month basic, $119/month for analytics, $149/month to remove branding. Built for generic online courses — no music production integration, no marketplace discovery, separate login for students. PPR course system (app/dashboard/create/course/): 14 database tables, 32 features. 4-level hierarchy: Course > Module > Lesson > Chapter. Each chapter: video, audio, text content, downloadable resources. Mark chapters as free previews — try before buying. Drip content: modules unlock over time by days, dates, or prerequisites. Student progress tracking chapter by chapter — rated green. At 100% completion: certificate auto-generates (convex/certificates.ts) with unique verification code, public verification URL at /verify/[certificateId]. 6-step creation wizard: thumbnail, content structure (add modules/lessons/chapters), pricing, checkout customization, follow gate, options (certificates, drip scheduling). Courses sit alongside beats, presets, sample packs — one storefront, one checkout, one customer identity. No separate platform, no separate login. Certificates rated yellow (functional). Course creation wizard functional.`,
      visualDirection: "Carousel: 1. Teachable pricing vs 'Included with PPR' 2. Hierarchy diagram 3. Content editor screenshot 4. Student progress tracking 5. Certificate with verification code 6. Creator storefront showing courses alongside other products",
      cta: 'DM me "COURSE" to see a live example',
      dmKeyword: "COURSE",
      source: "app/dashboard/create/course/. convex/courses.ts. convex/certificates.ts. PRODUCTION-READINESS-AUDIT.md Section A.",
      week: 3,
      dayOfWeek: 4,
      status: "brief",
      tags: ["product-deep-dive", "courses", "teachable-replacement"],
    },

    // 7.13 — PDF Guides & Cheat Sheets
    {
      storeId,
      postNumber: 7.13,
      title: "PDF Guides & Cheat Sheets",
      category: "Product Deep Dives",
      platform: "Reel / TikTok",
      hook: "The best lead magnet for music producers isn't a free beat. It's a one-page cheat sheet. An EQ frequency chart. A chord progression reference. Here's why — and how to make one in 2 minutes.",
      brief: `Not every product needs to be $50 sample pack or $200 course. Best first product: one-page cheat sheet. Mixing frequency chart, chord progression reference, EQ cheatsheet for vocals. PPR PDF guides (app/dashboard/create/pdf/ — 4-step wizard): basics, file upload, follow gate, pricing. Dead simple. The move: make useful PDF, set price to free, turn on follow gate — require email address AND Instagram follow before download. Now you have a lead magnet that builds email list and Instagram following simultaneously. Every download grows audience. AI content assistant helps generate description and tags. Recommended as first product for every new creator (CONTENT-RESEARCH-ZERO-TO-PRODUCT.md Step 3: "Cheat Sheet — easiest to create"). Zero risk, maximum list-building potential. Follow gate (convex/followGateSubmissions.ts): captures email + social follows per submission. Can combine with email automation — when someone downloads free PDF, automatic nurture sequence runs. Product Types rated yellow (PDF wizard functional).`,
      visualDirection: "Screen recording: Create new PDF product → 'Vocal EQ Cheat Sheet' → upload PDF → toggle price to Free → enable follow gate → check email + Instagram follow → publish. Show buyer experience.",
      cta: 'DM me "GUIDE" and I\'ll show you the fastest path to your first product',
      dmKeyword: "GUIDE",
      source: "app/dashboard/create/pdf/. CONTENT-RESEARCH-ZERO-TO-PRODUCT.md Step 3. convex/followGateSubmissions.ts.",
      week: 3,
      dayOfWeek: 5,
      status: "brief",
      tags: ["product-deep-dive", "pdf", "lead-magnet", "first-product"],
    },

    // 4.4 — Built-In Email Marketing
    {
      storeId,
      postNumber: 4.4,
      title: "Built-In Email Marketing (Not a Bolt-On)",
      category: "Competitor Gaps",
      platform: "Reel / TikTok",
      hook: "You have 500 email addresses from people who downloaded your stuff. You've emailed them exactly zero times. Here's the automation that turns that dead list into money.",
      brief: `Gumroad: email list collection. That's it. Go pay Mailchimp $50/month to DO something with it. PPR: when someone downloads free sample pack, this happens automatically: Day 0: Welcome email with download link. Day 2: Value email with best content. Day 4: Behind-the-scenes of how the pack was made. Day 6: Soft pitch for premium pack with coupon code. Day 8: Final email with scarcity. And if they buy? System detects purchase, skips remaining pitch emails, enrolls in post-purchase sequence instead. Visual workflow builder (convex/emailWorkflows.ts) with 14 node types. 45+ templates organized TOFU/MOFU/BOFU. Lead scoring with letter grades A-F. A/B testing for subject lines + content + send times. Dynamic segmentation with AND/OR logic. Send time optimization per subscriber. All included on every plan. Gumroad: CSV file export. PPR: full marketing automation platform. CONTENT-RESEARCH-PLATFORM-COMPARISON.md Section 2: 45+ templates, 15+ trigger types. Section 9: Gumroad has "basic email collection (no automations, no templates, no A/B testing)."`,
      visualDirection: "Screen recording: Email workflow builder — lead_signup trigger → email nodes → condition node 'did they purchase?' → branching paths. Show template library. Then Gumroad email settings — just a basic list.",
      cta: "Comment EMAILS and I'll DM you the 5-day email sequence that converts",
      dmKeyword: "EMAILS",
      source: "CONTENT-RESEARCH-PLATFORM-COMPARISON.md Sections 2, 9.",
      week: 3,
      dayOfWeek: 6,
      status: "brief",
      tags: ["competitor-gaps", "email-marketing", "gumroad"],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // WEEK 4 — Product Deep Dives 2
    // ═══════════════════════════════════════════════════════════════════════

    // 7.4 — Effect Chains / Ableton Racks
    {
      storeId,
      postNumber: 7.4,
      title: "Effect Chains / Ableton Racks",
      category: "Product Deep Dives",
      platform: "Reel / TikTok",
      hook: "You spent 3 years perfecting your vocal chain. You could sell it for $25. But most producers never do because there's nowhere to properly list a .adg file. Here's the fix.",
      brief: `Effect chains: underrated product. Hours dialing in perfect vocal chain, master bus, compression-into-saturation combo. Selling on Gumroad: .adg file, no DAW compatibility info, buyer downloads and opens in FL Studio — doesn't work because it's an Ableton rack. PPR effect chain product type (convex/schema.ts digitalProducts): dawType, dawVersion, genre fields. Creation wizard (app/dashboard/create/chain/) — 4 steps: ChainBasicsForm (DAW selection: Ableton, FL Studio, Logic, Bitwig, Studio One, Cubase, Reason — 7 DAWs), ChainFilesForm, ChainFollowGateForm, ChainPricingForm. Marketplace (app/marketplace/ableton-racks/): buyers filter by DAW, only see compatible chains. No confusion, no wasted purchases, no refund headaches. Product pages show DAW compatibility clearly. Also works for Ableton Racks (separate dedicated product type): rackType, effectType array, genre array, BPM, macroCount fields. Multi-DAW support confirmed in CONTENT-RESEARCH-PLATFORM-COMPARISON.md Section 1 row 4.`,
      visualDirection: "Screen recording: Chain creation wizard → select Ableton → fill genre → upload .adg → marketplace filter by Ableton → filtered results with DAW badges.",
      cta: 'DM me "CHAINS" to see the marketplace',
      dmKeyword: "CHAINS",
      source: "convex/schema.ts digitalProducts. app/dashboard/create/chain/. app/marketplace/ableton-racks/. CONTENT-RESEARCH-PLATFORM-COMPARISON.md Section 1.",
      week: 4,
      dayOfWeek: 0,
      status: "brief",
      tags: ["product-deep-dive", "effect-chains", "ableton-racks"],
    },

    // 7.6 — Coaching
    {
      storeId,
      postNumber: 7.6,
      title: "Coaching & 1-on-1 Sessions",
      category: "Product Deep Dives",
      platform: "Reel / TikTok",
      hook: "A producer DMs you: 'Can you check my mix?' You want to help. But you also don't want to work for free. Here's the move that turns DM requests into paid sessions without being awkward about it.",
      brief: `Coaching booking chaos: DM back-and-forth on times, Calendly link, separate Stripe invoice, Zoom call — none of these tools talk to each other. PPR coaching (app/dashboard/create/coaching/): 5-step creation wizard — Basics (title, description), Pricing, Follow Gate, Discord integration, Availability. Session types: video, audio, phone, text. Set duration, price, availability (which days, which hours, buffer time between sessions, max bookings per day, advance booking days). Buyer sees availability → picks slot → pays through Stripe → both get confirmation. Discord integration: auto-assign roles to coaching clients for private channels. No Calendly, no separate invoicing, no scheduling headaches. Everything in one flow. Coaching wizard rated functional in Production Readiness Audit. CONTENT-RESEARCH-PLATFORM-COMPARISON.md Section 1 row 13: "Availability calendar, session duration config, video/audio/phone types, Discord integration." Coaching is one of the best ways to monetize skills — especially for producers who already get DMs asking for feedback.`,
      visualDirection: "Screen recording: Coaching wizard 5 steps → session type 'Video Call' → duration 60 min → price $75 → availability calendar → buyer picking slot → checkout → confirmation.",
      cta: 'DM me "COACHING" to see the booking flow',
      dmKeyword: "COACHING",
      source: "app/dashboard/create/coaching/. CONTENT-RESEARCH-PLATFORM-COMPARISON.md Section 1. PRODUCTION-READINESS-AUDIT.md.",
      week: 4,
      dayOfWeek: 1,
      status: "brief",
      tags: ["product-deep-dive", "coaching", "booking"],
    },

    // 7.7 — Mixing & Mastering Services
    {
      storeId,
      postNumber: 7.7,
      title: "Mixing & Mastering Services",
      category: "Product Deep Dives",
      platform: "Carousel / TikTok",
      hook: "You're mixing tracks for people and collecting payment through PayPal invoices. The client sends stems on Google Drive. You lose track of which version they approved. Here's why that workflow is costing you clients.",
      brief: `Current service selling chaos: stems on Google Drive, PayPal invoice, lost track of which version was approved, chargebacks because no paper trail. PPR mixing/mastering services (app/dashboard/create/service/): 4-step creation wizard — Basics (service details, type selection), Pricing (multiple tiers), Requirements (what you need from client before starting), Delivery (timeline and terms). Full order lifecycle tracked (convex/schema.ts serviceOrders): pending → upload → in-progress → review → revision → completed. In-order messaging so communication stays in one thread. File management so stems and mixes don't get lost in email chains. Set turnaround time, revision limits, rush fees. Everything documented before payment. Replace Fiverr for service-based producers: keep 90% instead of Fiverr's 80%. CONTENT-RESEARCH-FEATURE-PAIN-MAP.md Section 6 row 9: "Mixing Services — Multi-tier pricing, stem count options, turnaround SLA, revision limits, rush fees, full order workflow."`,
      visualDirection: "Carousel: 1. Hook 2. Current chaos: DMs + PayPal + Google Drive (crossed out) 3. PPR wizard 4 steps 4. Order workflow diagram 5. In-order messaging thread 6. Revenue: Fiverr 80% vs PPR 90%",
      cta: 'DM me "MIXING" to see the service setup',
      dmKeyword: "MIXING",
      source: "app/dashboard/create/service/. convex/schema.ts serviceOrders. CONTENT-RESEARCH-FEATURE-PAIN-MAP.md Section 6.",
      week: 4,
      dayOfWeek: 2,
      status: "brief",
      tags: ["product-deep-dive", "mixing-services", "order-workflow"],
    },

    // 7.8 — Memberships
    {
      storeId,
      postNumber: 7.8,
      title: "Memberships & Subscriptions",
      category: "Product Deep Dives",
      platform: "Carousel / TikTok",
      hook: "You want to sell a monthly membership AND individual products. But Patreon is subscriptions only and Gumroad is one-time only. Why can't one store do both? It can.",
      brief: `Patreon: subscription-only (can't sell one-time), 8-12% fee, PLUS you need Mailchimp $30/month + Teachable $39/month + Buffer $25/month = $94/month in tools on top of Patreon's cut. PPR memberships (convex/memberships.ts, app/dashboard/create/membership/): 3-step wizard — Basics (name, description, benefits), Pricing (monthly required, yearly optional with auto-calculated savings percentage), Content (toggle "include all" or select specific courses/products per tier). Custom tiers with custom names and pricing. Monthly and yearly billing — yearly shows savings automatically. Free trials 0-30 days. Two content modes: include everything or hand-pick. A fan can subscribe to $15/month membership AND buy one-time $50 beat lease on same store. Both tracked, both generating revenue, one customer identity. Stripe recurring billing with trial support (app/api/memberships/create-checkout-session/route.ts). 10% platform fee includes everything — no separate tools. PRODUCTION-READINESS-AUDIT.md: Tier Creation rated green, Membership Pricing rated green, Membership Checkout rated green. CONTENT-RESEARCH-MEMBERSHIPS-VS-PATREON.md Section 4: fee comparison, Section 5: tool replacement costs $181-$1,519/month.`,
      visualDirection: "Carousel: 1. Patreon fee math 2. PPR: 10% all-in 3. Membership wizard 3 steps 4. Tier pricing with savings badge 5. Include All vs Select toggle 6. Storefront: memberships + one-time products",
      cta: 'DM me "MEMBERSHIP" to see the tier system',
      dmKeyword: "MEMBERSHIP",
      source: "convex/memberships.ts. app/dashboard/create/membership/. CONTENT-RESEARCH-MEMBERSHIPS-VS-PATREON.md. PRODUCTION-READINESS-AUDIT.md.",
      week: 4,
      dayOfWeek: 3,
      status: "brief",
      tags: ["product-deep-dive", "memberships", "patreon-comparison"],
    },

    // 7.10 — Mixing Templates
    {
      storeId,
      postNumber: 7.10,
      title: "Mixing Templates",
      category: "Product Deep Dives",
      platform: "Reel / TikTok",
      hook: "You've been using the same mixing template for 3 years. It's perfect. Other producers would pay $25 for it. But you've never sold it because you didn't think anyone would care. They do.",
      brief: `Mixing templates: gold. Years building routing, bus processing, reference chain. Selling on other platforms: upload zip to Gumroad, write description, hope someone finds it. PPR mixing templates (app/dashboard/create/mixing-template/): 4-step wizard — Basics (title, description, DAW type: Ableton/FL Studio/Logic/Bitwig/Studio One, DAW version, genre tags, channel count, third-party plugin requirements, installation notes), Files, Follow Gate, Pricing. Marketplace (app/marketplace/mixing-templates/): buyers filter by DAW, see channel count, know which plugins needed before buying. No surprises, no compatibility headaches. Already have a template sitting on hard drive? This is easiest product to list — you already built it. CONTENT-RESEARCH-PLATFORM-COMPARISON.md Section 1 row 6: "Mixing Templates — Pre-configured mixer layouts, effect routing, genre-specific settings."`,
      visualDirection: "Screen recording: Mixing template wizard → select Ableton → add genre → note plugin requirements → set channel count → marketplace filter by DAW → template cards with badges.",
      cta: 'DM me "TEMPLATE" to get started',
      dmKeyword: "TEMPLATE",
      source: "app/dashboard/create/mixing-template/. app/marketplace/mixing-templates/. CONTENT-RESEARCH-PLATFORM-COMPARISON.md Section 1.",
      week: 4,
      dayOfWeek: 4,
      status: "brief",
      tags: ["product-deep-dive", "mixing-templates", "daw-filtering"],
    },

    // 7.9 — Bundles
    {
      storeId,
      postNumber: 7.9,
      title: "Bundles",
      category: "Product Deep Dives",
      platform: "Reel / TikTok",
      hook: "Your average order is $25. Here's the simplest way to push it to $79 without creating a single new product. Bundles. And most producers don't use them.",
      brief: `Bundles: easiest way to increase average order value. On Gumroad: create separate product, manually calculate discount, hope people find it. PPR bundles (convex/bundles.ts, app/dashboard/create/bundle/): 4-step wizard — Basics (title, description, image), Products (pick any combination of courses/products), Pricing (set one price, system auto-calculates savings vs buying individually and displays automatically), Follow Gate. Time-limited availability and quantity-limited availability — real urgency because you configure it, not fake it in copy. Buyer sees bundle on storefront with original price crossed out, bundle price next to it, clear savings badge. One checkout, instant access to everything. Mix courses with sample packs, presets with project files, coaching with courses — any combination. Slug generation, price discounting logic built in. CONTENT-RESEARCH-FEATURE-PAIN-MAP.md Section 6 row 12: "Bundles — Mix courses + products, original vs. bundle pricing with discount display, time-limited and quantity-limited availability." Bundles rated green (backend).`,
      visualDirection: "Screen recording: Bundle wizard → select 3 products → set $79 → auto-calculated 'Save $41' badge → storefront with crossed-out original price → checkout → access all 3.",
      cta: "Link in bio to see live bundles",
      source: "app/dashboard/create/bundle/. convex/bundles.ts. CONTENT-RESEARCH-FEATURE-PAIN-MAP.md Section 6. PRODUCTION-READINESS-AUDIT.md.",
      week: 4,
      dayOfWeek: 5,
      status: "brief",
      tags: ["product-deep-dive", "bundles", "average-order-value"],
    },

    // 3.2 — I Wasted 2 Hours a Day on Content
    {
      storeId,
      postNumber: 3.2,
      title: '"I Wasted 2 Hours a Day on Content"',
      category: "Origin Story",
      platform: "Reel / TikTok",
      hook: "Two years. Every single day. Two hours figuring out what to post. That's 1,460 hours I'll never get back.",
      brief: `Two years manually creating every social media post. Daily: what do I post today? Write caption. Format for Instagram. Rewrite for Twitter. Adjust for TikTok. Find/make image. Schedule each separately. Two hours gone before opening DAW. After two years: complete burnout. Creative energy drained by content creation. Built AI content engine (CONTENT-RESEARCH-EVERGREEN-ENGINE.md Section 1): takes one piece of content (course chapter, tutorial idea) → generates platform-specific scripts for TikTok (with viral hooks, 100+ hook templates), YouTube (educational structure), Instagram (engagement formatting). Plus images in Excalidraw style via Fal.ai. Plus voiceover via ElevenLabs. Plus captions and hashtags per platform. Batch processing: 5 chapters in parallel, 30 chapters = 90 content pieces in minutes not months. Virality scoring 1-10 per script. Calendar view with scheduled content. "I burned out so you don't have to." CONTENT-RESEARCH-FEATURE-PAIN-MAP.md Section 3: "I spent two years manually coming up with posts every day and burning out."`,
      visualDirection: "Face to camera for story. Transition to screen recording: batch-generating scripts → content library with virality scores → calendar view with scheduled content.",
      cta: "Link in bio — try the content generator free",
      source: "CONTENT-RESEARCH-FEATURE-PAIN-MAP.md Section 3. CONTENT-RESEARCH-EVERGREEN-ENGINE.md Section 1.",
      week: 4,
      dayOfWeek: 6,
      status: "brief",
      tags: ["origin-story", "content-burnout", "ai-content"],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // WEEK 5 — Scenarios
    // ═══════════════════════════════════════════════════════════════════════

    // 10.1 — Beat Tape → 5 Revenue Streams
    {
      storeId,
      postNumber: 10.1,
      title: "You Just Finished a Beat Tape with 10 Tracks",
      category: "Scenarios",
      platform: "Carousel / TikTok",
      hook: "You just finished a 10-track beat tape. Here's exactly how you'd turn it into 5 revenue streams on one platform.",
      brief: `10 beats. Most producers: upload to BeatStars, wait. PPR approach — 5 revenue streams: (1) Individual beat leases: list each beat with 4 tiers (Basic $25, Premium $75, Exclusive $500). 10 products from one tape. Exclusive auto-removes (convex/beatLeases.ts). (2) Beat tape bundle (convex/bundles.ts): all 10 beats bundled. Individually $250 at basic tier, bundle $149. Auto-calculated "Save $101" badge. One checkout. (3) Project files: list each .als/.flp as separate product (app/dashboard/create/project-files/ — 4-step wizard). Producers studying your workflow pay $15-25 per session. 10 more products. (4) Free beats as lead magnets: pick 2 weakest beats, set free with follow gate (convex/followGateSubmissions.ts) — require email + Instagram follow. Every download builds audience for paid beats. (5) Email sequence (convex/emailWorkflows.ts): automation trigger on free beat download → 3-email sequence over 5 days: Email 1 "Here's your beat" → Email 2 "Check out these other beats" → Email 3 "The exclusive is still available." Total: 22 products, 2 lead magnets, 1 automated email sequence, one storefront.`,
      visualDirection: "Carousel: 1. '10 beats → 5 revenue streams' 2. Beat leases: 4 tiers x 10 3. Bundle: $250 → $149 4. Project files $15-25 5. Follow gate: free beat → email 6. Email sequence 7. Summary: 22 products, 2 magnets, 1 sequence",
      cta: 'DM me "BEATS" to start listing yours',
      source: "convex/beatLeases.ts. convex/bundles.ts. app/dashboard/create/project-files/. convex/followGateSubmissions.ts. convex/emailWorkflows.ts.",
      week: 5,
      dayOfWeek: 0,
      status: "brief",
      tags: ["scenario", "beats", "revenue-streams"],
    },

    // 10.2 — 200 Serum Presets
    {
      storeId,
      postNumber: 10.2,
      title: "You Have 200 Serum Presets Sitting in a Folder",
      category: "Scenarios",
      platform: "Reel / TikTok",
      hook: 'You have 200 Serum presets in a folder called "My Presets." You made them over 3 years. They\'re doing nothing. Here\'s how to turn them into $2,000.',
      brief: `Step 1: Organize. Split 200 presets into 4 themed packs of 50: "Dark Trap Basses," "Future Bass Leads," "Ambient Pads," "Lo-Fi Keys." Themed > random. Step 2: Create packs on PPR (app/dashboard/create/pack/ — 4-step wizard). Target plugin: Serum. Genre tags. Description (AI assistant helps). 20 min/pack. Step 3: Price — $19 each. Or bundle (convex/bundles.ts): "Complete Serum Collection" — 4 packs for $49 vs $76. Auto savings display. Step 4: Lead magnet — 10 best presets in free pack. Gate behind email + Instagram follow (convex/followGateSubmissions.ts). Try before buying. Step 5: Funnel — automated email sequence (convex/emailWorkflows.ts): Day 1 "Here are your presets" → Day 3 "Here's what else I made" → Day 7 "The bundle saves you $27." Step 6: AI content engine (convex/masterAI/socialMediaGenerator.ts) — feed it preset pack description, get TikTok/Instagram scripts. Post 30-second demo of each preset. Started with folder. End with 5 products, lead magnet, email funnel, content calendar. 50+ plugins supported for marketplace filtering.`,
      visualDirection: "Screen recording: Folder → organize → PPR wizard (select Serum) → publish 4 packs → create bundle → free magnet → email automation → AI content generation.",
      cta: 'DM me "PRESETS" to list your first pack today',
      dmKeyword: "PRESETS",
      source: "app/dashboard/create/pack/. convex/bundles.ts. convex/followGateSubmissions.ts. convex/emailWorkflows.ts. convex/masterAI/socialMediaGenerator.ts.",
      week: 5,
      dayOfWeek: 1,
      status: "brief",
      tags: ["scenario", "presets", "serum", "product-funnel"],
    },

    // 7.11 — Project Files
    {
      storeId,
      postNumber: 7.11,
      title: "Project Files",
      category: "Product Deep Dives",
      platform: "Reel / TikTok",
      hook: "Every time you post a track breakdown, someone asks 'can I get the project file?' You either ignore them or send it free. Both options leave money on the table.",
      brief: `Project files: most requested thing in music production. Every track breakdown post → "can I get the .als/.flp?" Most producers: ignore or send free over DM. Leaving money on the table. PPR project files (app/dashboard/create/project-files/ — 4-step wizard): Project details with genre, BPM, key. File upload — .als, .flp, .logicx, any format. Optional follow gate for lead magnet use. Or set a price. Buyer sees DAW compatibility before purchasing — no "does this work in FL Studio?" questions. convex/schema.ts digitalProducts table — project-files type. CONTENT-RESEARCH-PLATFORM-COMPARISON.md Section 1 row 5: "Project Files — DAW-specific versions (.als, .flp, .logicx), full production files with stems." List it. Price it. Share link when someone asks. Done. Simple flow: Instagram DM asks for project file → create product on PPR → 4 steps → upload → set $15 → publish → copy link → paste in DM reply.`,
      visualDirection: "Screen recording: DM asking 'can I get the project file?' → PPR → create product → 4 steps → upload .als → $15 → publish → copy link → paste in DM.",
      cta: 'DM me "PROJECT" to list your first file',
      dmKeyword: "PROJECT",
      source: "app/dashboard/create/project-files/. convex/schema.ts. CONTENT-RESEARCH-PLATFORM-COMPARISON.md Section 1.",
      week: 5,
      dayOfWeek: 2,
      status: "brief",
      tags: ["product-deep-dive", "project-files"],
    },

    // 10.3 — DM Feedback → Paid Coaching
    {
      storeId,
      postNumber: 10.3,
      title: "Someone DM'd You Asking for Mixing Feedback",
      category: "Scenarios",
      platform: "Reel / TikTok",
      hook: '"Can you listen to my mix and give feedback?" You say yes for free. Here\'s how to turn that into paid coaching without being weird about it.',
      brief: `Every producer with any following gets DMs: "Can you check my track?" Two options: say yes (work free forever) or say no (feel like a jerk). Option three: Create coaching product on PPR (app/dashboard/create/coaching/ — 5-step wizard: Basics, Pricing, Follow Gate, Discord, Availability). "1-on-1 Mix Review — 30 minutes — $50." Set availability and session type (video/audio/text). Next DM: "I'd love to! I do formal mix reviews now — here's the link." No awkward negotiation. Price shown, availability shown, they book, they pay, you show up. Can still do free: create follow-gated coaching intro — free 15-min "quick feedback" gated behind email capture. Serious ones book paid session. Even easier with DM automation (convex/automations.ts): keyword "FEEDBACK" → auto-send booking link. No manual work. DM Automation rated 95% production-ready. CONTENT-RESEARCH-FEATURE-PAIN-MAP.md Section 6 row 8: "Coaching — Session scheduling with timezone support, duration/type configuration."`,
      visualDirection: "Screen recording: DM 'can you check my mix?' → coaching wizard → 'Mix Review' $50/30min → set availability → publish → copy link → paste in DM. Then DM automation: keyword FEEDBACK → auto-send link.",
      cta: 'DM me "COACHING" to set up your first session',
      dmKeyword: "FEEDBACK",
      source: "app/dashboard/create/coaching/. convex/automations.ts. PRODUCTION-READINESS-AUDIT.md. CONTENT-RESEARCH-FEATURE-PAIN-MAP.md Section 6.",
      week: 5,
      dayOfWeek: 3,
      status: "brief",
      tags: ["scenario", "coaching", "dm-automation"],
    },

    // 10.4 — Viral YouTube Tutorial
    {
      storeId,
      postNumber: 10.4,
      title: "You Made a YouTube Tutorial That Went Viral",
      category: "Scenarios",
      platform: "Carousel / TikTok",
      hook: "Your YouTube tutorial hit 500K views. 500,000 people watched you teach for free. Here's how to turn those viewers into customers.",
      brief: `500K YouTube views = ~$1,500 ad revenue. Viewers watched, left. No email, no relationship, no way to reach again. The play: (1) Deeper course (app/dashboard/create/course/ — 6-step wizard): 15-min tutorial → 2-hour course with modules, chapters, downloadable resources. Charge $49. (2) Cheat sheet lead magnet (app/dashboard/create/pdf/ — 4-step wizard): summarize key points into 1-page PDF. Free with follow gate — email capture + Instagram follow. Convert YouTube viewers into YOUR audience. (3) Pin link: YouTube description, Instagram bio → PPR storefront. (4) Email funnel (convex/emailWorkflows.ts): free cheat sheet → Day 1 cheat sheet → Day 3 "Liked it? Here's the full course" → Day 7 testimonial. (5) Related products: vocal mixing tutorial → vocal mixing template, vocal preset pack, mix feedback coaching session. One viral video → five products, email funnel, every future viewer has path from free to paying. Courses alongside beats/presets on same storefront (app/[slug]/page.tsx — unified product grid).`,
      visualDirection: "Carousel: 1. '500K views → $1,500 from YouTube' 2. Tutorial → PPR course 3. Cheat sheet with follow gate 4. Email funnel diagram 5. Related products 6. 'One video. Five products. One funnel.'",
      cta: 'DM me "VIRAL" to plan your product suite',
      dmKeyword: "VIRAL",
      source: "app/dashboard/create/course/. app/dashboard/create/pdf/. convex/emailWorkflows.ts. CONTENT-RESEARCH-EVERGREEN-ENGINE.md.",
      week: 5,
      dayOfWeek: 4,
      status: "brief",
      tags: ["scenario", "youtube", "course-funnel"],
    },

    // 10.5 — Zero Followers Sample Pack
    {
      storeId,
      postNumber: 10.5,
      title: "You Have a Sample Pack but Zero Followers",
      category: "Scenarios",
      platform: "Reel / TikTok",
      hook: "You made a fire sample pack. You have 47 Instagram followers. Here's the plan — and it doesn't start with \"get more followers.\"",
      brief: `Zero audience? Work backwards. Week 1 — List the pack: upload to PPR, set genre/BPM/key, AI assists description, publish. In marketplace under "Newest" (convex/marketplace.ts — "Newest" sort gives new products immediate visibility). Discovery you didn't have 5 minutes ago. Week 2 — Free version: 5-10 best samples in free mini-pack, gate behind email + Instagram follow (convex/followGateSubmissions.ts). Lead magnet. Week 3 — Create content: AI content engine (convex/masterAI/socialMediaGenerator.ts) — feed pack description, get 4 scripts (TikTok, Instagram, YouTube Shorts, YouTube long-form). Post TikTok: "I made a sample pack. Here's what's in it." Play samples, show waveforms. 30 seconds. Week 4 — Engage: find producers in genre, comment genuinely on their posts. Not spam. Build real relationships. Some check your profile → bio links to storefront. Marketplace gives baseline discovery. Content gives reach. Follow gate builds list. List converts to sales. Not fast, not passive, but works. CONTENT-RESEARCH-ZERO-TO-PRODUCT.md Step 6: "Products browsable by category, newest sort means new creators get immediate visibility." Sample browsing with audio preview at app/marketplace/samples/page.tsx.`,
      visualDirection: "Screen recording: Week 1 upload → Week 2 free magnet → Week 3 AI content scripts → Week 4 engagement. Email list growing week over week.",
      cta: 'DM me "ZERO" — I\'ll help you make your first plan',
      dmKeyword: "ZERO",
      source: "convex/marketplace.ts. convex/followGateSubmissions.ts. convex/masterAI/socialMediaGenerator.ts. CONTENT-RESEARCH-ZERO-TO-PRODUCT.md. app/marketplace/samples/page.tsx.",
      week: 5,
      dayOfWeek: 5,
      status: "brief",
      tags: ["scenario", "zero-audience", "growth-plan"],
    },

    // 9.5 — You Need to Be on Every Platform
    {
      storeId,
      postNumber: 9.5,
      title: '"You Need to Be on Every Platform"',
      category: "Myth Busting",
      platform: "Reel / TikTok",
      hook: "Gumroad for downloads. BeatStars for beats. Teachable for courses. Patreon for memberships. What if you just... didn't?",
      brief: `Conventional wisdom: be everywhere. Gumroad for products, BeatStars for beats, Teachable for courses, Patreon for memberships, Buffer for scheduling, Mailchimp for emails. Six platforms, six logins, six analytics that don't talk to each other, six monthly bills, hundreds of dollars ($210-$583/month — CONTENT-RESEARCH-PLATFORM-COMPARISON.md Section 9). Worst part: customers had to create accounts on each. Teachable buyer was stranger on Gumroad. Couldn't email Gumroad buyers about new course — different system. One platform done well beats five done poorly. When everything is in one place — storefront, products, email list, social scheduling, analytics — everything compounds. Student finishes course → recommended preset pack. Sample pack buyer → enrolled in email sequence about mixing course. Beat buyer → sees coaching sessions on storefront. Cross-selling only works when data is connected. On PPR, it is. 7 platforms replaced (CONTENT-RESEARCH-PLATFORM-REPLACEMENT.md), $210-$583/month in hidden costs eliminated. Creator letter (app/creators/page.tsx lines 35-77): "7 platforms (Kajabi, ActiveCampaign, Shopify, Discord, Google Drive, Zapier, Stripe/PayPal)."`,
      visualDirection: "Screen recording: Open 6 browser tabs (Gumroad, BeatStars, Teachable, Patreon, Buffer, Mailchimp). Show chaos. Close them. Open PPR dashboard — products, courses, email, social, analytics. Storefront with everything side by side.",
      cta: "One place. Everything connected. Link in bio.",
      source: "CONTENT-RESEARCH-PLATFORM-REPLACEMENT.md. CONTENT-RESEARCH-PLATFORM-COMPARISON.md Section 9. app/creators/page.tsx.",
      week: 5,
      dayOfWeek: 6,
      status: "brief",
      tags: ["myth-busting", "consolidation", "multi-platform"],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // WEEK 6 — Recruitment
    // ═══════════════════════════════════════════════════════════════════════

    // 8.1 — 10 Founding Creators
    {
      storeId,
      postNumber: 8.1,
      title: "I'm Looking for 10 Founding Creators",
      category: "Creator Recruitment",
      platform: "Carousel / Static Post",
      hook: "I'm looking for 10 music producers to be the first creators on PausePlayRepeat. Not 500. Not 100. Ten.",
      brief: `Over a year building PausePlayRepeat. Platform for music producers: 22+ product types, courses, beats, presets, sample packs, coaching, mixing services, memberships — all under one roof. Now need creators. Not hundreds — ten. Why ten matters: (1) Personal help: not support ticket, not chatbot — me, on a call, walking through storefront, first product, first email sequence. (2) Feedback shapes platform: "I wish beat licensing page showed X" → I build it. Not possible at scale. (3) Near-zero marketplace competition: 14 categories, barely any products in most. List Serum preset pack = you're the only one. List mixing course = THE featured course. Founding creator benefits: early access to every feature, direct line to me (DMs not tickets), input on what gets built next, featured marketplace placement. Pricing (convex/creatorPlans.ts): Free tier (1 product, storefront, directory listing), Starter $12/month (15 products, email marketing, follow gates, coaching), Creator $29/month (50 products, advanced analytics, automations), Pro $79/month (unlimited, custom domain). Plus 10% of each sale covering Stripe payments, email infrastructure, AI content, marketplace — everything. No hidden fees, no annual contracts, cancel anytime. Creator letter: app/creators/page.tsx — "Not 500, not 100. Ten."`,
      visualDirection: "Carousel: 1. 'Looking for 10 founding creators' 2. 'Why 10?' — personal help, input, no competition 3. Benefits 4. Pricing table 5. What's included in 10% 6. CTA: DM FOUNDING",
      cta: 'DM me "FOUNDING" to apply',
      dmKeyword: "FOUNDING",
      source: "app/creators/page.tsx. convex/creatorPlans.ts. CONTENT-RESEARCH-PLATFORM-COMPARISON.md Section 7.",
      week: 6,
      dayOfWeek: 0,
      status: "brief",
      tags: ["recruitment", "founding-creators", "cta"],
    },

    // 8.2 — First Week as Creator
    {
      storeId,
      postNumber: 8.2,
      title: "What Your First Week as a Creator Looks Like",
      category: "Creator Recruitment",
      platform: "Carousel / TikTok",
      hook: "\"I want to sell my presets and tutorials but I don't know where to start.\" Most producers get stuck here for months. Here's exactly what the first 5 days look like when you stop overthinking it.",
      brief: `Day 1: Sign up → "Become Creator" button → store auto-generates from profile (components/dashboard/one-click-creator-setup.tsx — 3-step: Confirm > Customize > Success with confetti). Live at pauseplayrepeat.com/your-name in 30 seconds. Connect Stripe for payments. Day 2: Create first product. Recommend PDF cheat sheet or tip jar. Two steps. Upload file or write title. Free with follow gate for email list building. Published in under 5 minutes. Day 3: AI content engine. Feed product description → 4 social media scripts (TikTok, Instagram, YouTube Shorts, YouTube long-form). Plus images. Plus voiceover audio. Week's worth of content from one product. Day 4: First email sequence. Pre-built templates (app/dashboard/emails/workflows/templates/workflow-templates.ts): Producer Welcome Series, Free-to-Paid conversion, Cart Recovery. Pick one, customize copy, turn on. Runs automatically forever. Day 5: Discoverable. Products show up in marketplace under "Newest" (convex/marketplace.ts). Store in creator directory. Someone searching your genre finds you without promotion. Five days: store live, product listed, content created, email automation running, marketplace presence.`,
      visualDirection: "Carousel: 1. 'Your first week' title 2. Day 1: one-click store with confetti 3. Day 2: PDF wizard 4. Day 3: AI pipeline 5. Day 4: Email workflow template 6. Day 5: Marketplace 'Newest' 7. '5 days. Zero confusion.'",
      cta: 'DM me "WEEK1" and I\'ll walk you through it personally',
      dmKeyword: "WEEK1",
      source: "components/dashboard/one-click-creator-setup.tsx. CONTENT-RESEARCH-ZERO-TO-PRODUCT.md. app/dashboard/emails/workflows/templates/workflow-templates.ts. convex/marketplace.ts.",
      week: 6,
      dayOfWeek: 1,
      status: "brief",
      tags: ["recruitment", "onboarding", "first-week"],
    },

    // 6.3 — I Just Encrypted All OAuth Tokens
    {
      storeId,
      postNumber: 6.3,
      title: "I Just Encrypted All OAuth Tokens",
      category: "Behind the Build",
      platform: "Reel / TikTok",
      hook: "Last week I realized all social media tokens on the platform were stored in plain text. I fixed it that night.",
      brief: `Build-in-public security story. When you connect Instagram/Twitter, you give access token. Lets platform post on your behalf. During security audit: tokens stored as plain text in database. If database breached → access to every connected social account. Not acceptable, even for platform with 10 users. Implemented AES-256-GCM encryption. Every OAuth token now encrypted at rest. Every refresh token too. Added PKCE to OAuth flows — prevents authorization code interception. Nobody asked for this. No user complained. Done because security matters even when small. Especially when small. Git commit: e924968 "feat(encryption): implement token encryption for OAuth and Discord integrations." PRODUCTION-READINESS-AUDIT.md Security Findings: "OAuth Tokens Stored Plaintext — CRITICAL" (now fixed). If trusting a platform with Instagram access, they should take it seriously. Even one guy in Missouri building at midnight. Build-in-public moment, not marketing pitch.`,
      visualDirection: "Face to camera, honest. Show git commit message on screen. Simplified encryption flow. Simple and authentic.",
      cta: "No CTA needed. This one builds trust.",
      source: "Git: commit e924968. PRODUCTION-READINESS-AUDIT.md Security Findings.",
      week: 6,
      dayOfWeek: 2,
      status: "brief",
      tags: ["behind-the-build", "security", "build-in-public"],
    },

    // 8.3 — Founding Creator Advantage
    {
      storeId,
      postNumber: 8.3,
      title: "The Founding Creator Advantage",
      category: "Creator Recruitment",
      platform: "Reel / TikTok",
      hook: "The producers who joined BeatStars in 2015 built the biggest stores on the platform. The ones who joined in 2023 are fighting for scraps. Timing matters.",
      brief: `Every marketplace pattern: early creators get featured placement, build audience before competition, shape platform direction, become default names. BeatStars 2015, Gumroad 2014, Patreon 2013 — early creators built empires. Later joiners: fighting established sellers with thousands of reviews. PPR: early stage right now. 14 marketplace categories (convex/marketplace.ts), most nearly empty. List sample pack today = one of only sample packs. List mixing course = THE mixing course people find browsing. This changes as platform grows — more creators = more competition, more noise, harder to stand out. Right now: founder personally building features based on first creators' needs. "I need X" → I build X. Try getting that from Gumroad's support. This window doesn't stay open — not marketing, just how marketplaces work. Creator directory (app/marketplace/creators/page.tsx) with room for more. Creator letter (app/creators/page.tsx lines 639-677): "Almost no competition. Shape the platform. Direct access to founder. Early advantage."`,
      visualDirection: "Timeline: BeatStars 2015 (early) → 2020 (crowded) → 2024 (saturated). PPR 2026 — 'You are here.' Marketplace with categories and low competition.",
      cta: 'DM me "EARLY" to lock in your spot',
      dmKeyword: "EARLY",
      source: "app/creators/page.tsx lines 639-677. convex/marketplace.ts. app/marketplace/creators/page.tsx.",
      week: 6,
      dayOfWeek: 3,
      status: "brief",
      tags: ["recruitment", "early-advantage", "fomo"],
    },

    // 7.12 — Playlist Curation
    {
      storeId,
      postNumber: 7.12,
      title: "Playlist Curation",
      category: "Product Deep Dives",
      platform: "Reel / TikTok",
      hook: "You curate a playlist with 50K followers. Artists flood your DMs begging for placement. You listen to 50 tracks, add 3, and never reply to the other 47. Here's how to stop working for free.",
      brief: `Playlist curators: artists flood DMs asking for placement. Listen to 50 tracks, add 3, never respond to 47. PPR playlist curation (app/dashboard/create/playlist-curation/ — 3-step wizard): Basics (name, description, genres accepted, cover art), Submission Settings (acceptance criteria, submission rules, review SLA — how long to respond), Pricing (free or paid per submission). convex/schema.ts: curatorPlaylists + trackSubmissions tables. Artists submit through proper form. Review in queue. Accept or decline with feedback. Artist knows what genres accepted before wasting time. Get paid for curation work. Multi-platform: Spotify, Apple Music, SoundCloud. CONTENT-RESEARCH-PLATFORM-COMPARISON.md Section 1 row 15: "Playlist Curation — Multi-platform, submission pricing, review queue." Turns side hustle into real revenue stream. Genres array, submissionSLA, submissionRules, visibility fields.`,
      visualDirection: "Screen recording: Playlist curation product page → genre tags → submission fee → creator review queue → accept/decline. 3-step wizard.",
      cta: 'DM me "PLAYLIST" to set up submissions',
      dmKeyword: "PLAYLIST",
      source: "app/dashboard/create/playlist-curation/. convex/schema.ts. CONTENT-RESEARCH-PLATFORM-COMPARISON.md Section 1.",
      week: 6,
      dayOfWeek: 4,
      status: "brief",
      tags: ["product-deep-dive", "playlist-curation", "submissions"],
    },

    // 5.1 — From Student to Creator
    {
      storeId,
      postNumber: 5.1,
      title: "From Student to Creator Without Leaving the Platform",
      category: "Learner Audience",
      platform: "Reel / TikTok",
      hook: "You don't have to know what to sell. Start by learning. The platform will tell you when you're ready.",
      brief: `Most platforms want you to show up with a product. PPR wants you to show up as a student. Take courses, learn mixing, sound design, music theory. Every course has free preview chapters. Full access starts at $12/month with PPR Pro. Platform tracks progress: XP system (100 XP for first course completion), achievements, learning streaks. Certificates on completion. Nudge system with 10 context-aware triggers (components/dashboard/BecomeCreatorCard.tsx): Complete first course → "Course Completed. Ready to Create?" Hit Level 8 → "Your Expertise is Valuable." Earn certificate → "Certified and Ready to Teach." Click one button → store live in 30 seconds (components/dashboard/one-click-creator-setup.tsx). Free, no credit card. Simplest first product: tip jar — 2 steps, title and description, done. Or upload PDF cheat sheet with follow gate — free download in exchange for email + Instagram follow. Builds audience AND product catalog. Gamification rated 95% production-ready. CONTENT-RESEARCH-ZERO-TO-PRODUCT.md Steps 1-4. "Learn here. Create here. Sell here."`,
      visualDirection: "Story flow: Learning dashboard → XP, badges → BecomeCreatorCard after completion → click 'Become Creator' → one-click store → tip jar in 2 steps → live storefront.",
      cta: "Link in bio — start learning free",
      dmKeyword: "COMPARE",
      source: "CONTENT-RESEARCH-ZERO-TO-PRODUCT.md Steps 1-4. components/dashboard/BecomeCreatorCard.tsx. components/dashboard/one-click-creator-setup.tsx.",
      week: 6,
      dayOfWeek: 5,
      status: "brief",
      tags: ["learner-audience", "student-to-creator", "gamification"],
    },

    // 3.5 — One Guy in Missouri
    {
      storeId,
      postNumber: 6.5,
      title: 'What "One Guy in Missouri" Actually Means',
      category: "Behind the Build",
      platform: "Reel / TikTok",
      hook: "I'm not a venture-backed startup with a 50-person team. It's me. One guy in Missouri. Here's why that's actually better.",
      brief: `Two reactions to "I built this by myself": (1) Weakness — "How can one person compete with Gumroad/Patreon?" (2) Advantage — the people who get it. When something breaks: fixed tonight. Not "escalate to engineering team," not "submit support ticket." Fixed subscriber's access issue at 11pm last week. When you need a feature: I build it. Not filing feature request into void. DMing me directly. Every decision made by someone who actually uses the product — not product manager who's never opened a DAW. Patreon has thousands of employees, still no beat licensing. I have me — and 186 features already built. Being small is the unfair advantage people underestimate. Creator letter (app/creators/page.tsx lines 662-667): "If you need a feature, I'll build it. If something's broken, I'll fix it tonight. I fixed a subscriber's access issue at 11pm last week." Lines 737-738: "One guy in Missouri who taught himself to code." The platform has 134+ tables, 186+ features — all built by someone who personally hits every wall producers face.`,
      visualDirection: "Face to camera, casual setting. Maybe show DM conversation where issue reported and fixed within hours. Juxtapose 'one-person team' with massive feature list scrolling.",
      cta: "DM me. Literally. I respond to everyone.",
      source: "app/creators/page.tsx lines 662-667, 737-738. CONTENT-RESEARCH-PLATFORM-REPLACEMENT.md.",
      week: 6,
      dayOfWeek: 6,
      status: "brief",
      tags: ["behind-the-build", "solo-founder", "accessibility"],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // WEEK 7 — Close & Convert
    // ═══════════════════════════════════════════════════════════════════════

    // 7.14 — Music Releases
    {
      storeId,
      postNumber: 7.14,
      title: "Music Releases (Pre-save Campaigns)",
      category: "Product Deep Dives",
      platform: "Reel / TikTok",
      hook: "You drop a single. You post the Spotify link. 24 hours later, nobody's listening. Here's the pre-release strategy that turns one track into a list-building machine.",
      brief: `Standard release: "New track out now" + Spotify link. Engagement dies after 24 hours. No email capture, no follow-up, no momentum. PPR music releases (app/dashboard/create/release/ — 4-step wizard): Step 1 — Basics: title, artist name, featured artists, release type (single/EP/album/mixtape/remix), genre, BPM, key, cover art, ISRC and UPC codes optional. Step 2 — Platforms: streaming links for Spotify, Apple Music, SoundCloud, YouTube, Tidal, Deezer, Amazon Music, Bandcamp — 8 platforms, all in one place. Step 3 — Pre-save campaign: gate pre-save behind email follow. Every pre-save grows email list. On release day: email everyone who pre-saved. Step 4 — Drip email campaign: automated emails — pre-save confirmation, release day announcement, first-week milestone celebration. Turn single release into list-building, engagement-driving machine. Schema: releaseType, artistName, featuredArtists, label, genre, BPM, key, ISRC, UPC, streamingPlatformURLs (8 platforms), smartLinkUrl. CONTENT-RESEARCH-PLATFORM-COMPARISON.md Section 1 row 19: "Music Releases — Pre-save campaign capture, release day announcements."`,
      visualDirection: "Screen recording: Release wizard 4 steps → track details → paste Spotify/Apple Music links → enable pre-save with email gate → 3-email drip.",
      cta: 'DM me "RELEASE" to set up your next drop',
      dmKeyword: "RELEASE",
      source: "app/dashboard/create/release/. CONTENT-RESEARCH-PLATFORM-COMPARISON.md Section 1.",
      week: 7,
      dayOfWeek: 0,
      status: "brief",
      tags: ["product-deep-dive", "releases", "pre-save"],
    },

    // 7.15 — Tip Jars
    {
      storeId,
      postNumber: 7.15,
      title: "Tip Jars",
      category: "Product Deep Dives",
      platform: "Reel / TikTok",
      hook: "Your followers already appreciate your content. Some of them would literally pay you for it if you gave them a way. A tip jar takes 60 seconds to set up and breaks the mental barrier of 'I'm not ready to sell yet.'",
      brief: `Nobody tells new creators: first product doesn't need to be a masterpiece. Tip jar: lowest-friction product on PPR (app/dashboard/create/tip-jar/ — 2-step wizard: Basics, Publish). Title. Description. That's it. No file uploads, no pricing tiers, no configuration. "Support My Music." "Buy Me a Coffee While I Make Beats." Publish. Share link. People who appreciate content support directly. Won't make you rich. Does two things: (1) gets past mental barrier of "listing first product," (2) proves system works — real payment hits Stripe account. Once done: creating next product feels less scary. CONTENT-RESEARCH-ZERO-TO-PRODUCT.md Step 3: "Tip Jar — 2 steps, title + description only." CONTENT-RESEARCH-FEATURE-PAIN-MAP.md Section 6 row 16: "Tip Jar — Donation/appreciation payments." The simplest possible entry point into selling online.`,
      visualDirection: "Screen recording: Create tip jar → title 'Support My Music' → description → publish → storefront with tip jar → $5 tip processing through Stripe. Timer: 60 seconds.",
      cta: "Create your first product today — link in bio",
      source: "app/dashboard/create/tip-jar/. CONTENT-RESEARCH-ZERO-TO-PRODUCT.md Step 3. CONTENT-RESEARCH-FEATURE-PAIN-MAP.md Section 6.",
      week: 7,
      dayOfWeek: 1,
      status: "brief",
      tags: ["product-deep-dive", "tip-jar", "first-product", "easy-start"],
    },

    // 5.3 — You Already Have Something to Sell
    {
      storeId,
      postNumber: 5.3,
      title: "You Already Have Something to Sell",
      category: "Learner Audience",
      platform: "Carousel",
      hook: '"I don\'t have anything to sell." You do. You just don\'t realize it yet.',
      brief: `You have 50 Serum presets from experimenting = preset pack (50+ plugins supported). You have a vocal chain used 3 years = effect chain (7 DAWs: Ableton, FL Studio, Logic, Bitwig, Studio One, Cubase, Reason). You have Ableton project file from best track = project file. You know how compression works after 6 months learning = course chapter. You can hear when a mix is muddy and fix it = coaching session. PPR supports all of it: Preset packs with plugin-specific filtering (50+ plugins). Effect chains with multi-DAW support. Project files. Courses with modules, lessons, chapters. 1-on-1 coaching with scheduling. PDF cheat sheets. Sample packs with individual preview. And 12 more product types (20 total at schema.ts:1124-1161). CONTENT-RESEARCH-PLATFORM-REPLACEMENT.md Section 2: 20 product types. CONTENT-RESEARCH-FEATURE-PAIN-MAP.md Section 6: full product type inventory. You're sitting on products — you haven't packaged them yet.`,
      visualDirection: "Carousel: 1. Hook 2. '50 Serum presets' → preset wizard 3. 'Your vocal chain' → effect chain wizard 4. 'Ableton project' → project files 5. 'You know compression' → course wizard 6. 'You hear mix problems' → coaching 7. '20 product types. One of them is yours.'",
      cta: "DM me what you make — I'll tell you what to sell first",
      source: "CONTENT-RESEARCH-PLATFORM-REPLACEMENT.md Section 2. CONTENT-RESEARCH-FEATURE-PAIN-MAP.md Section 6.",
      week: 7,
      dayOfWeek: 2,
      status: "brief",
      tags: ["learner-audience", "product-ideas", "anyone-can-sell"],
    },

    // 6.6 — 134 Database Tables
    {
      storeId,
      postNumber: 6.1,
      title: "134 Database Tables as a Solo Founder",
      category: "Behind the Build",
      platform: "Reel / TikTok",
      hook: "I'm a music producer who taught himself to code because every platform built for us sucked. 134 database tables later, here's what happened.",
      brief: `Music producer who taught himself to code because too stubborn to use someone else's platform. 134 database tables. 7,046 lines in schema.ts alone. 71KB courses.ts file. 63KB storefront page (app/[slug]/page.tsx). 27,000+ lines for email system. 8 automated cron jobs running every 30 seconds to 24 hours. 11 separate Stripe checkout flows. 26 Stripe webhook event types handled. 5-agent AI system for course generation. Social media AI pipeline with virality scoring. Smart AI DM responses. One person. Not bragging — every table exists because of a problem hit and solved. Email workflow table: lost sales without automation. Beat licensing table: Gumroad couldn't handle tiers. Achievement tables: gamification keeps students coming back. Every table is a scar from running a music production business on platforms not built for it. 186+ verified features across the platform. 20 product types. CONTENT-RESEARCH-PLATFORM-REPLACEMENT.md summary. Creator letter app/creators/page.tsx lines 96-100.`,
      visualDirection: "Face to camera, desk with code in background. Flash schema.ts scrolling. Show cron job list. Show Stripe webhook handler. Raw and real — actual code scrolling.",
      cta: "Comment BUILD and I'll DM you the behind-the-scenes",
      dmKeyword: "BUILD",
      source: "CONTENT-RESEARCH-PLATFORM-REPLACEMENT.md Summary. app/creators/page.tsx lines 96-100.",
      week: 7,
      dayOfWeek: 3,
      status: "brief",
      tags: ["behind-the-build", "solo-founder", "scale"],
    },

    // 8.4 — Spots Filling Up
    {
      storeId,
      postNumber: 8.4,
      title: "Spots Filling Up",
      category: "Creator Recruitment",
      platform: "Story / Static Post",
      hook: "3 of 10 founding creator spots filled. Here's who's in so far.",
      brief: `Quick update. Posted about 10 founding creators, response exceeded expectations. [Number]/10 spots filled. [Brief genre/type mentions without naming without consent]. Learning from onboarding first few: most producers sitting on products they could list in 10 minutes. One creator: 200+ presets in a folder. Another: mixing template given away free. Third: coaching over DM for months without formalizing. All three live on marketplace now. Remaining spots still open. DM "FOUNDING" for personal help getting set up. No pressure, no manufactured deadline. Real limit because can only give personal attention to so many people at once. app/creators/page.tsx — founding creator recruitment pitch. "Not 500, not 100. Ten." NOTE: Only post after actually onboarding creators. Numbers must be real. Maintain authenticity — no manufactured urgency.`,
      visualDirection: "Simple graphic: '3/10 Founding Creator Spots Filled' with progress bar. Clean, no over-design.",
      cta: 'DM me "FOUNDING" — spots are real, not manufactured',
      source: "app/creators/page.tsx. NOTE: Only post with real numbers.",
      week: 7,
      dayOfWeek: 4,
      status: "brief",
      tags: ["recruitment", "urgency", "update"],
    },

    // 6.7 — 65% Production Ready
    {
      storeId,
      postNumber: 6.2,
      title: "65% Production-Ready. Here's What That Actually Means.",
      category: "Behind the Build",
      platform: "Carousel",
      hook: "My platform is about 65% production-ready. Most founders would never admit that. Here's exactly what works and what doesn't.",
      brief: `Honest platform audit. Production readiness scores: DM Automation 95% — ship it. Gamification (XP, achievements, streaks, leaderboards) 95% — ship it. Automations (purchase → email → drip → certificate) 90% — ship it. Memberships (tiers, checkout, content gating) 80% — solid. Storefront & Products 75% — 16 of 20 product types have full creation wizards. Creator Onboarding 65% — feature gating works, free plan was too restrictive (fixed: canChargeMoney changed to allow charging). Email Marketing 60% — backend incredible, some creator UIs need work. Course System 55% — courses work, video upload for creators needs building. Social Scheduling — content generation excellent, auto-publishing now works for Instagram/Twitter/Facebook/LinkedIn (TikTok not there yet). CAN-SPAM compliance implemented. Being honest because trust matters more than hype. Everything promoted actually works today. PRODUCTION-READINESS-AUDIT.md full platform readiness scores.`,
      visualDirection: "Carousel: one per system. 1. Hook 2. DM Automation 95% green 3. Gamification 95% green 4. Automations 90% green 5. Memberships 80% 6. Storefront 75% 7. Email 60% 8. Course 55% 9. Social publishing: 4/5 platforms 10. '65% done. 100% honest.'",
      cta: "DM me any question about the platform. I'll answer honestly.",
      source: "PRODUCTION-READINESS-AUDIT.md Platform Readiness Scores.",
      week: 7,
      dayOfWeek: 5,
      status: "brief",
      tags: ["behind-the-build", "honesty", "production-readiness"],
    },

    // 6.8 — First Real Week of Sales
    {
      storeId,
      postNumber: 6.4,
      title: "First Real Week of Sales",
      category: "Behind the Build",
      platform: "Reel / TikTok",
      hook: "$165 in 5 days. From $9 courses. Zero paid ads. Here's what that actually proves.",
      brief: `First real week of sales. $165 in 5 days. Doesn't sound like much. It's not. But what it proves: audience (100,000 followers, 50,000 email subscribers) willing to pay for $9 courses with zero paid advertising — just organic traffic from existing content. $165 from one creator (me) with one product type. Now imagine: 10 creators each with own audience, selling own products — presets, beats, sample packs, courses, coaching. One creator $165/week → ten creators $1,650/week. Before marketplace discovery, before cross-promotion, before email list growth. The system works. Now need the creators. PPR takes 10% of each sale — on $165 that's $16.50 platform revenue. Scale that to 10 creators and it sustains development. Creator letter (app/creators/page.tsx lines 287-299): "$165 in 5 days. From one creator — me. Selling $9 courses. With zero paid advertising."`,
      visualDirection: "Face to camera with real energy — genuine conviction. Show Stripe dashboard with real numbers (blur sensitive data). Raw, no fancy graphics.",
      cta: "DM me if you want to be one of the first 10",
      source: "app/creators/page.tsx lines 287-299.",
      week: 7,
      dayOfWeek: 6,
      status: "brief",
      tags: ["behind-the-build", "social-proof", "first-sales"],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // REMAINING POSTS (no week 2 duplicates — 2.1, 2.2, 4.5 mapped above)
    // The Patreon Tax (2.2) and What Producers Pay (2.1) and 4.5
    // These were referenced in the calendar as batch 1 posts that aren't
    // in the 7-week calendar. Including them as unassigned for completeness.
    // ═══════════════════════════════════════════════════════════════════════

    // 2.1 — What Producers Actually Pay
    {
      storeId,
      postNumber: 2.1,
      title: "What Producers Actually Pay Per Month",
      category: "Cost Comparison",
      platform: "Carousel",
      hook: "You're spending more on tools to sell your music than you're making from selling it. And you probably don't even realize it.",
      brief: `Detailed cost breakdown for producer running their business: Email marketing (Mailchimp/ConvertKit) $30-100/month. Social scheduling (Buffer/Later) $25-50/month. AI content generation (Jasper) $39-49/month. DM automation (ManyChat) $15-65/month. Website/storefront (Squarespace/Shopify) $12-39/month. Link-in-bio (Linktree Pro) $5-24/month. Course platform (Teachable/Kajabi) $39-149/month. Coaching/booking (Calendly) $10-20/month. Low end total: $210/month. High end total: $583/month. None of these tools talk to each other. When someone buys course on Teachable, doesn't trigger Mailchimp sequence unless paying Zapier another $29/month. PPR includes all of it. One platform. Starts at $12/month plus 10% of sales. CONTENT-RESEARCH-PLATFORM-COMPARISON.md Section 9: "The Hidden Cost Stack" — exact figures for each category.`,
      visualDirection: "Carousel: 1. Hook 2-8. One per tool with logo + price 9. Calculator totaling $210-583 10. PPR: '$12/month + 10%. Everything included.'",
      cta: "Comment TOOLS and I'll DM you the full breakdown with alternatives",
      dmKeyword: "TOOLS",
      source: "CONTENT-RESEARCH-PLATFORM-COMPARISON.md Section 9.",
      week: undefined,
      dayOfWeek: undefined,
      status: "brief",
      tags: ["cost-comparison", "pricing-breakdown"],
    },

    // 2.2 — The Patreon Tax
    {
      storeId,
      postNumber: 2.2,
      title: "The Patreon Tax Nobody Talks About",
      category: "Cost Comparison",
      platform: "Reel / TikTok",
      hook: "If you're on Patreon, you think you're paying 8-12%. You're actually paying way more. Let me show you the hidden costs nobody talks about.",
      brief: `Patreon: 8-12% depending on plan. Most think that's the only cost. It's not. Patreon doesn't have: email marketing → ConvertKit $29-79/month, social scheduling → Buffer $15-100/month, course platform → Teachable $39-299/month, beat licensing → BeatStars $10-20/month, AI content → ChatGPT Plus $20/month. Estimated total to replicate PPR features: $181 to $1,519/month ON TOP of Patreon's cut. PPR takes 10% — between Patreon Pro (8%) and Patreon Premium (12%). Except PPR's 10% includes everything: email marketing, social scheduling, course platform, beat licensing, AI tools, storefront, marketplace, DM automation, certificates, analytics. No hidden cost stack. Just 10%. CONTENT-RESEARCH-MEMBERSHIPS-VS-PATREON.md Section 4: fee comparison (PPR 10% vs Patreon 5-12%), Section 5: tool costs $181-$1,519/month.`,
      visualDirection: "Text-on-screen, each line appearing. Calculator/receipt aesthetic — itemized 'bill'. End: single line 'PPR: 10%. Everything included.'",
      cta: 'Comment MATH and I\'ll DM you the full Patreon cost comparison',
      dmKeyword: "MATH",
      source: "CONTENT-RESEARCH-MEMBERSHIPS-VS-PATREON.md Sections 4-5.",
      week: undefined,
      dayOfWeek: undefined,
      status: "brief",
      tags: ["cost-comparison", "patreon", "hidden-fees"],
    },

    // 2.4 — $12 vs $210
    {
      storeId,
      postNumber: 2.4,
      title: "What $12/Month Gets You vs. What $210/Month Gets Them",
      category: "Cost Comparison",
      platform: "Carousel",
      hook: "If you're paying $200+ a month to sell beats, presets, and courses... someone is ripping you off. Here's what that same setup should cost.",
      brief: `PPR Starter plan $12/month (convex/creatorPlans.ts): 15 products, branded storefront at your URL, creator directory listing, 500 email sends/month, follow gates for lead gen, email campaigns and workflows, social content AI generator, Instagram DM automation, 4-tier beat licensing, individual sample preview, course platform with certificates, coaching with scheduling. $210/month across 8 separate tools: the same stuff scattered across platforms that don't talk to each other, 8 different logins, 8 billing cycles. "One of these makes sense. The other one is what most producers are doing right now." CONTENT-RESEARCH-PLATFORM-COMPARISON.md Section 7: Creator plan pricing table (Starter $12/mo = 15 products, 500 emails). Section 9: Hidden cost stack low estimate $210/month. "Same features. 17x less money."`,
      visualDirection: "Two-column carousel. Left (green): PPR features '$12/mo'. Right (red/cluttered): same features with different logos '$210+/mo'. Final: 'Same features. 17x less money.'",
      cta: "Comment PRICING and I'll DM you the full feature-by-feature comparison",
      dmKeyword: "PRICING",
      source: "CONTENT-RESEARCH-PLATFORM-COMPARISON.md Sections 7, 9.",
      week: undefined,
      dayOfWeek: undefined,
      status: "brief",
      tags: ["cost-comparison", "side-by-side", "value-prop"],
    },

    // 4.5 — 4-Tier Beat Licensing
    {
      storeId,
      postNumber: 4.5,
      title: "4-Tier Beat Licensing (Gumroad Has Zero)",
      category: "Competitor Gaps",
      platform: "Carousel",
      hook: "You sell a beat for $25. The buyer puts it on Spotify and gets 10 million streams. You see nothing extra. That's what happens when you sell beats without a licensing system.",
      brief: `Gumroad: upload MP3, set price. No licensing tiers, no distribution limits, no streaming caps, no contract generation, no exclusive auto-removal. PPR full licensing system (convex/beatLeases.ts, app/api/beats/contract/route.ts): Basic $25 default — MP3+WAV, 5,000 distribution copies, credit required. Premium $75 default — MP3+WAV+Stems, 50,000 copies, commercial use. Exclusive $500 default — all files+trackouts, unlimited distribution, auto-removes from marketplace. Unlimited — fully customizable. Every tier configurable per beat — set own prices, limits, terms. PDF license agreements auto-generated via pdf-lib with buyer info, beat details, all legal terms. CONTENT-RESEARCH-PLATFORM-COMPARISON.md Section 6: 4-tier licensing table with default prices. "Built for producers. Not for everyone."`,
      visualDirection: "Carousel: 1. Hook 2. Gumroad: file + price 3. PPR: 4-tier picker 4. Tier details table 5. PDF contract screenshot 6. Exclusive sold badge 7. 'Built for producers.'",
      cta: "Comment LICENSE and I'll DM you how beat licensing tiers actually work",
      dmKeyword: "LICENSE",
      source: "CONTENT-RESEARCH-PLATFORM-COMPARISON.md Section 6. CONTENT-RESEARCH-SAMPLE-PREVIEW.md Section 4.",
      week: undefined,
      dayOfWeek: undefined,
      status: "brief",
      tags: ["competitor-gaps", "beat-licensing", "gumroad"],
    },

    // 5.2 — First Product in 2 Minutes
    {
      storeId,
      postNumber: 5.2,
      title: "Your First Product in Under 2 Minutes",
      category: "Learner Audience",
      platform: "Reel / TikTok",
      hook: "\"I want to sell something online but I don't know where to start.\" You can have your first product live in under 2 minutes. I'll prove it.",
      brief: `Step 1: Sign up. Free. 30 seconds. Step 2: "Become Creator" button (components/dashboard/one-click-creator-setup.tsx — 3-step: Confirm > Customize > Success with confetti). Storefront live at pauseplayrepeat.com/your-name. Step 3: Create product. Easiest: tip jar (app/dashboard/create/tip-jar/ — 2 steps). Title: "Support My Music." Description: "Buy me a coffee while I make beats." Hit publish. Done. First product live. Listed in marketplace. Discoverable. Now when ready for priced product: Starter $12/month. Create cheat sheet PDF. Gate behind follow requirement — email + Instagram follow for free download. Building email list, growing social following, AND selling digital products. All from one dashboard. CONTENT-RESEARCH-ZERO-TO-PRODUCT.md Step 3: Tip jar = 2 steps. Step 4: One-click creator setup. Creator letter line 600: "you click one button, your store is live." Timer should show under 2 minutes total.`,
      visualDirection: "Speed run with timer. Sign up → dashboard → 'Become Creator' → confetti → create → select 'Tip Jar' → 2 fields → publish → live storefront. Timer under 2 minutes. Then cheat sheet flow with follow gate.",
      cta: "Comment FIRST and I'll DM you the setup link — takes 2 minutes, no credit card",
      dmKeyword: "FIRST",
      source: "CONTENT-RESEARCH-ZERO-TO-PRODUCT.md Steps 3-4. components/dashboard/one-click-creator-setup.tsx. app/creators/page.tsx line 600.",
      week: undefined,
      dayOfWeek: undefined,
      status: "brief",
      tags: ["learner-audience", "speed-run", "easy-start"],
    },
  ];
}

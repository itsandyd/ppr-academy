# Feature-to-Pain-Point Map: The Origin Story Backbone

> Every feature on PPR was built because I personally hit that problem while growing from 0 to 100,000 followers.

---

## 1. EMAIL MARKETING & AUTOMATION

### The Problem

"I lost thousands of sales before I set up automation."

I was leaving money on the table every single day. Someone would download a free sample pack and I'd never follow up. Someone would enroll in a course and drop off at module 3 and I'd never know. I was manually sending emails one by one, copy-pasting into Mailchimp, and still forgetting to follow up with people who were ready to buy. By the time I realized I needed automation, I'd already lost thousands of potential sales from people who were interested but never got a second touchpoint.

### The Feature

PPR has a **full ActiveCampaign-level email marketing platform** built directly into the creator dashboard. Not a bolt-on integration. Not a Zapier hack. A real email system with:

- **Visual Workflow Builder** with 14 node types (trigger, email, delay, condition, action, stop, webhook, split, notify, goal, courseCycle, courseEmail, purchaseCheck, cycleLoop) for complex branching automation
- **Drip Campaign System** with multi-step sequences, configurable delays, and trigger-based enrollment (lead signup, product purchase, tag added, manual)
- **70+ Pre-Built Campaign Templates** organized by funnel stage:
  - **TOFU (Top of Funnel):** Free Sample Pack Giveaway, Free Course Module, Free Track Feedback Offer, Release Pre-Save Capture
  - **MOFU (Middle of Funnel):** Sample Pack Collection Showcase, Course Behind-the-Scenes, Coaching Client Results, Production Tips Newsletter
  - **BOFU (Bottom of Funnel):** Sample Pack Launch, Course Enrollment Closing, Last Coaching Spots, Cart Abandonment
  - **Post-Purchase:** Confirmation & Access, Request Review, Community Invite, Feature Your Track (UGC)
  - **Re-engagement:** Win Back Inactive Producers (60+ days), Course Dropout sequences
- **15+ Pre-Built Automation Sequences** (multi-email flows):
  - Free Pack to Paid Pack (5 emails)
  - Sample Pack Buyer Ascension (4 emails)
  - Course Student Engagement (6 emails)
  - Course Graduate to Coaching (3 emails)
  - Producer Welcome Series (7 emails)
  - Cart Recovery (3 emails)
  - Inactive Customer Win-Back (4 emails)
- **Dynamic Segmentation** with composite AND/OR logic, field operators (equals, contains, greater_than, in, not_in), and auto-updating member counts
- **Lead Scoring System** inspired by ActiveCampaign with letter grades (A/B/C/D) and point values:
  - Email Opened: +5 | Email Clicked: +10 | Course Enrolled: +25 | Purchase: +100 | Course Completed: +50 | Bounce: -10 | Unsubscribe: -100
- **A/B Testing Framework** for subject lines, content, send times, and from names with statistical significance calculation and automatic winner selection
- **Send Time Optimization** using per-user engagement patterns (24-hour and 7-day matrices) with confidence-scored best-time predictions
- **Deliverability Monitoring** with health scores, bounce/complaint rate alerts, spam score checking (0-10 scale), and list hygiene automation
- **Per-Store Email Infrastructure** where each creator gets their own isolated Resend API configuration with encrypted API keys (AES-256-GCM)

### The Proof

| Component | Location | Purpose |
|-----------|----------|---------|
| Email Schema | `convex/emailSchema.ts` (665 lines) | 20+ tables defining the entire email infrastructure |
| Workflow Engine | `convex/emailWorkflows.ts` | Visual workflow builder with node-by-node execution tracking |
| Drip Campaigns | `convex/dripCampaigns.ts` | Time-based sequence management with enrollment tracking |
| Campaign Manager | `convex/emailCampaigns.ts` | Broadcast campaigns with tag-based targeting and recipient management |
| Segmentation | `convex/emailSegmentation.ts` | Dynamic segments with composite condition logic |
| A/B Testing | `convex/emailABTesting.ts` | Multivariate testing with confidence scoring |
| Lead Scoring | `convex/emailLeadScoring.ts` | Engagement-based lead grading with point decay |
| Template Library | `convex/emailTemplates.ts` | 70+ funnel-organized templates |
| Deliverability | `convex/emailDeliverability.ts` | Health monitoring with automated alerts |
| Health Monitoring | `convex/emailHealthMonitoring.ts` | Domain reputation tracking |
| Unsubscribe | `convex/emailUnsubscribe.ts` | HMAC-signed one-click unsubscribe with workflow cancellation |
| Contact Management | `convex/emailContacts.ts` | Per-store contact CRUD with engagement tracking |
| Tag System | `convex/emailTags.ts` | Flexible contact tagging with merge operations |
| Send Queue | `convex/emailSendQueue.ts` | Rate-limited email dispatch with conflict-free claiming |
| Analytics | `convex/emailAnalytics.ts` | Real-time event tracking with threshold alerts |
| Creator Analytics | `convex/emailCreatorAnalytics.ts` | Per-creator performance dashboards |
| Workflow Triggers | `convex/emailWorkflowActions.ts` | 7 trigger types (signup, purchase, tag, course complete, etc.) |
| Dashboard UI | `app/dashboard/emails/` | 12 sub-pages: campaigns, contacts, workflows, sequences, segments, analytics, deliverability, health, leads, preview, setup, subscribers |

---

## 2. SOCIAL SCHEDULING & CROSS-POSTING

### The Problem

"I wasted hours copying and pasting content across platforms."

Every single day I'd create a post, then manually reformat it for Instagram, rewrite it for Twitter, adjust it for TikTok, and schedule it separately on each platform. Two hours gone before I'd even started making music. I was managing 5 different apps just to post the same idea across 3 platforms. The copy-paste workflow was killing my creativity and eating into the time I should have been spending on production.

### The Feature

PPR has a **unified social media command center** supporting 5 platforms with a 6-step AI-powered content creation pipeline that turns one piece of content into platform-optimized posts:

**Supported Platforms:**
- Instagram (Business accounts - posts, stories, reels via Facebook Graph API v21.0)
- Twitter/X (Tweets via Twitter API v2)
- Facebook (Page posts via Graph API v21.0)
- TikTok (Videos via TikTok Open API)
- LinkedIn (UGC Posts API v2 with visibility controls)

**6-Step Content Creation Pipeline:**
1. **Content Selection** - Choose source: course chapter, section heading, or custom text (min 100 characters)
2. **Platform Scripts** - AI generates platform-specific scripts (TikTok viral hooks, YouTube educational format, Instagram engagement hooks)
3. **Script Combination** - Merge platform scripts into unified narrative with CTA integration and TTS optimization
4. **Image Generation** - AI images per sentence via Fal.ai (nano-banana-pro model) with per-platform aspect ratios (9:16 for TikTok/Instagram, 16:9 for YouTube)
5. **Audio Generation** - ElevenLabs text-to-speech with selectable voices and duration tracking
6. **Review** - Preview all assets, edit captions with hashtags, final approval

**Scheduling System:**
- Schedule posts to specific dates/times with timezone support
- Multi-media attachments (images and videos)
- Hashtag and location tagging
- Platform-specific options per post
- Error handling with automatic retry mechanism
- Status tracking: draft -> scheduled -> publishing -> published -> failed

**Cross-Platform Marketing Campaigns:**
- Same campaign content distributed across email + Instagram + Twitter + Facebook + LinkedIn + TikTok
- Per-platform scheduling (Instagram at 2pm, Twitter at 3pm, Email at 6pm)
- Platform-specific content adaptation from unified templates

**Instagram DM Automation:**
- Trigger types: keyword comment, any comment, DM, mention, hashtag, manual
- Visual flow builder with: trigger, message, delay, condition, resource, tag, webhook nodes
- Real-world use: Comment "STEMS" -> auto-send download link via DM

**CTA Template System:**
- Reusable call-to-action templates with `{{KEYWORD}}` placeholders
- Link to products or courses for conversion tracking
- Usage count and last-used tracking

### The Proof

| Component | Location | Purpose |
|-----------|----------|---------|
| Social Accounts | `convex/schema.ts` (lines 3191-3244) | OAuth connections for 5 platforms with token management |
| Scheduled Posts | `convex/schema.ts` (lines 3247-3326) | Post scheduling with timezone, retry logic, initial metrics |
| Social Media Posts | `convex/schema.ts` (lines 6114-6212) | Full post lifecycle from scripts to publishing |
| Publishing Actions | `convex/socialMediaActions.ts` | Platform-specific API calls (Instagram, Twitter, Facebook, TikTok, LinkedIn) |
| Post Management | `convex/socialMediaPosts.ts` | CRUD operations, CTA templates, post library |
| OAuth Management | `convex/socialMedia.ts` | Token storage, refresh, and platform connection |
| DM Automation | `convex/automation.ts` | Instagram comment/DM automation with flow builder |
| Marketing Campaigns | `convex/marketingCampaigns.ts` | Cross-platform campaign orchestration |
| Create Pipeline UI | `app/dashboard/social/create/` | 6-step content creation wizard |
| Pipeline State | `app/dashboard/social/create/context.tsx` | State management for the creation pipeline |
| Calendar View | `app/dashboard/social/calendar/[profileId]/` | Scheduling calendar interface |
| OAuth Callbacks | `app/api/social/oauth/[platform]/` | OAuth flow for each platform |
| Post Analytics | `convex/schema.ts` (lines 3329+) | Engagement metrics (likes, comments, shares, views, clicks) |

---

## 3. AI CONTENT GENERATION

### The Problem

"I spent two years manually coming up with posts every day and burning out."

Creating content as a music producer is exhausting. You're not a copywriter. You're not a social media manager. You're a musician who happens to need to market yourself. I was spending 2-3 hours every day just trying to figure out what to post, writing captions, creating thumbnails, and recording voiceovers. The creative energy I should have been putting into music was being drained by content creation. After two years of this grind, I was completely burned out.

### The Feature

PPR has a **multi-agent AI system** with 10 distinct content generation workflows, 25+ API endpoints, and support for 20+ LLM models across 6 providers. This isn't a ChatGPT wrapper. It's a purpose-built content factory for music creators.

**Master AI System (7-Stage Pipeline):**
1. **Planner** - Decomposes questions into facets with tool-aware intent classification
2. **Retriever** - Multi-bucket vector search with parallel content fetching
3. **Summarizer** - Compresses chunks per facet, extracts key techniques
4. **Idea Generator** - Creative extrapolation building on summarized content
5. **Fact Verifier** - Cross-checks claims against sources with web research validation
6. **Critic** - Quality gate with automatic retry on low-quality output
7. **Final Writer** - Citation building, streaming, markdown-to-HTML conversion

**AI Models Available (5 Preset Tiers):**
- **Budget:** DeepSeek + Gemini Flash Lite
- **Speed:** Gemini 2.5 Flash
- **Balanced:** Gemini 2.5 + Claude 4.5 Sonnet
- **Deep Reasoning:** Gemini 3 Pro + DeepSeek R1
- **Premium:** Claude 4.5 Opus

**Content Types the AI Can Generate:**

1. **Social Media Scripts** (1,580 lines of generation logic)
   - Multi-platform scripts (TikTok with 60-100 viral hook templates, YouTube educational, Instagram engagement)
   - Script combination with automatic CTA integration
   - Platform-specific captions (Instagram: 20-30 hashtags, TikTok: 3-5 hashtags)
   - Image prompts in Excalidraw hand-drawn style with PPR brand colors

2. **Full Courses** - Topic to complete course structure (modules -> lessons -> chapters) with duration estimates and word counts

3. **Email Copy** - Template-based generation supporting courses, sample-packs, digital-products, coaching with variable replacement

4. **Product Descriptions & SEO** - Long descriptions (150-250 words), short descriptions, meta titles, meta descriptions, keyword arrays (8-12 terms), Open Graph metadata

5. **Cheat Sheets & Reference Guides** - From course content to structured outlines (key takeaways, quick reference, step-by-step, tips, comparison, glossary)

6. **Video Scripts** - Scene-by-scene breakdown with visual directions, image prompts, color palettes, and voiceover scripts (powered by Claude Opus 4.5)

7. **Images** - AI-generated via Fal.ai (Flux model) with parallel generation, multiple aspect ratios, 8k cinematic quality

8. **Audio/Voiceovers** - ElevenLabs TTS with word-level timestamps, custom voice selection, duration tracking

9. **Sound Effects** - Description-to-audio conversion with duration control

10. **Lead Magnet Visuals** - Analyzes courses for visual opportunities, generates educational images with semantic embedding for similarity search

**Agentic System (Tool Execution):**
- AI proposes actions (create course, generate script, publish post, schedule content)
- User confirms before execution
- Role-based permissions (creator, admin, student)
- Conversation memory that learns user preferences across sessions

### The Proof

| Component | Location | Purpose |
|-----------|----------|---------|
| Master AI Orchestrator | `convex/masterAI/index.ts` (992 lines) | 7-stage pipeline with quality gates |
| LLM Client | `convex/masterAI/llmClient.ts` (442 lines) | Unified routing across OpenAI + OpenRouter (20+ models) |
| Social Media Generator | `convex/masterAI/socialMediaGenerator.ts` (1,580 lines) | Multi-platform scripts, captions, images, audio |
| Social Script Agent | `convex/masterAI/socialScriptAgent.ts` (681 lines) | Job-based generation with virality scoring |
| Lead Magnet Analyzer | `convex/masterAI/leadMagnetAnalyzer.ts` (1,340 lines) | Visual opportunity detection with semantic search |
| Planner | `convex/masterAI/planner.ts` (576 lines) | Question decomposition and intent classification |
| Final Writer | `convex/masterAI/finalWriter.ts` (653 lines) | Response generation with citations |
| Fact Verifier | `convex/masterAI/factVerifier.ts` (283 lines) | Multi-source claim verification |
| Cheat Sheet Generator | `convex/masterAI/cheatSheetGenerator.ts` (231 lines) | Structured reference guide generation |
| Tool Schema | `convex/masterAI/tools/schema.ts` | 11+ agentic tools (create course, publish post, schedule, etc.) |
| Tool Executor | `convex/masterAI/tools/executor.ts` | Confirmation-gated tool execution |
| Memory Manager | `convex/masterAI/memoryManager.ts` (268 lines) | Cross-session user preference learning |
| Course Builder | `convex/aiCourseBuilder.ts` | Full pipeline course generation |
| Email Copy | `convex/emailCopyGenerator.ts` | Template-based email generation |
| Product AI | `convex/productAI.ts` | Description and SEO generation |
| Video Pipeline | `convex/videosPipeline/` | 6-step video creation (script, images, voice, code, render, post-process) |
| Chapter Images | `convex/chapterImageGeneration.ts` | Auto-insertion of contextual images into course content |
| Audio Generation | `convex/audioGeneration.ts` | ElevenLabs chapter audio |
| Content Generation | `convex/contentGeneration.ts` | Viral video script generation (TikTok, YouTube, Instagram) |
| Course Builder API | `app/api/ai/course-builder/route.ts` | Streaming course generation endpoint |
| Web Research | `convex/masterAI/webResearch.ts` (437 lines) | Live web search during generation |

---

## 4. ANALYTICS & TRACKING

### The Problem

"I was posting at random times with no strategy."

For the first year, I had zero visibility into what was working. I'd post a tutorial and have no idea if it led to sales. I'd send an email and not know if anyone opened it. I was guessing at everything -- what time to post, what content resonated, which products people wanted. I was flying completely blind, and my growth reflected it. Random posting at random times with random content is not a strategy.

### The Feature

PPR has a **self-contained analytics engine** built entirely on Convex with real-time data. No Google Analytics dependency. No third-party dashboards. Everything the creator needs to make data-driven decisions lives inside the platform.

**Creator Analytics Dashboard:**
- Total revenue (all-time and last 30 days) with trend visualization
- Average order value (AOV)
- Revenue by product type breakdown
- Net revenue after platform and payment processing fees
- Product performance: views, enrollments, conversion rates, revenue per product

**Email Analytics (Full Funnel Visibility):**
- Open rates, click rates, bounce rates, complaint rates per campaign
- Daily email activity metrics (sent, opened, clicked)
- Top performing campaigns ranked by engagement
- Per-contact engagement tracking with activity feeds
- Workflow performance: enrollments, active, completed, completion rate
- Contact engagement breakdown: highly engaged, engaged, low engagement, inactive

**Conversion Funnel Tracking:**
- Full funnel: Visit -> Signup -> Enroll -> Return (Week 2)
- Conversion rates between each stage
- Drop-off analysis
- Time-to-conversion calculations (median and average hours)
- Store-scoped funnel filtering

**UTM Attribution:**
- `utm_source`, `utm_medium`, `utm_campaign` tracking
- Campaign ID attribution
- Revenue event association with UTM parameters

**Revenue Intelligence:**
- Monthly Recurring Revenue (MRR) tracking with month-over-month growth
- Customer Lifetime Value (LTV) calculation
- Revenue by product type
- Top courses and creators by revenue
- Payout scheduling and pending amounts
- Projected monthly revenue based on 3-month average

**Session & Traffic Analytics:**
- Session duration and page views
- Landing page and exit page tracking
- Referrer source attribution
- Device type (desktop, mobile, tablet), browser, OS
- Geographic data (country, city)

**Course-Specific Analytics:**
- Chapter-wise engagement (drop-off rates, difficulty assessment)
- Video analytics (watch time, completion rate, re-watches, playback speed)
- Student roster with individual progress tracking
- Learning streaks and achievement scoring

**Send Time Optimization (AI-Powered):**
- Per-user engagement patterns by hour of day (24-element array) and day of week (7-element array)
- Individual optimal send times with confidence scores
- Campaign-level aggregated optimal times
- Engagement heatmap visualization
- 30-day engagement decay factor

**Leaderboards:**
- Top creators by revenue (weekly, monthly, all-time)
- Top students by XP
- Most active users by learning streak
- Badge system: "Top Seller," "Rising Star," "Scholar"

### The Proof

| Component | Location | Purpose |
|-----------|----------|---------|
| Analytics Schema | `convex/analyticsSchema.ts` | Event tracking tables (analyticsEvents, productViews, revenueEvents, userSessions) |
| Analytics Tracking | `convex/analyticsTracking.ts` | Event logging: page views, product views, purchases, searches |
| Conversion Funnels | `convex/analytics/funnels.ts` | Full-funnel analysis with drop-off and time-to-conversion |
| Creator Pipeline | `convex/analytics/creatorPipeline.ts` | Creator CRM pipeline stage tracking |
| Send Time Optimization | `convex/sendTimeOptimization.ts` | AI-powered best-time calculations per user |
| Admin Analytics | `convex/adminAnalytics.ts` | Platform-wide KPIs, MRR, revenue projections |
| Store Stats | `convex/storeStats.ts` | Per-store revenue, customers, sales metrics |
| Leaderboards | `convex/leaderboards.ts` | Creator, student, and activity rankings |
| Email Analytics | `convex/emailAnalytics.ts` | Email event logging with threshold alerts |
| Creator Email Analytics | `convex/emailCreatorAnalytics.ts` | Per-creator email performance dashboards |
| Email A/B Testing | `convex/emailABTesting.ts` | Subject/content/time testing with significance |
| Email User Stats | `convex/emailUserStats.ts` | Per-user email engagement metrics |
| Creator Dashboard | `app/dashboard/analytics/page.tsx` | Revenue, product performance, student metrics |
| Home Analytics | `app/(dashboard)/home/analytics/page.tsx` | Main analytics dashboard with KPIs |
| Email Analytics UI | `app/dashboard/emails/analytics/page.tsx` | Email-specific metrics and activity feeds |
| Admin Analytics | `app/admin/analytics/page.tsx` | Platform-wide funnels, health, web analytics |

---

## 5. STOREFRONT & LINK-IN-BIO

### The Problem

"None of the platforms had a storefront designed for what we sell."

Linktree gives you a list of links. Gumroad gives you a checkout page. Neither gives you a real storefront. As a music producer, I needed a place where someone could land from my Instagram bio and immediately see my courses, my sample packs, my presets, my coaching -- all in one branded page. I tried Shopify but it's designed for physical products. I tried Gumroad but every store looks the same. I needed something that felt like MY brand, not a generic template.

### The Feature

PPR gives every creator a **branded storefront + link-in-bio** at `pauseplayrepeat.com/{your-slug}` with two responsive display modes:

**Desktop Storefront:**
- Hero section with avatar, display name, tagline, and creator stats (products, students, sales)
- Featured product section with accent-color border and star icon
- Full product grid with search, category filtering, price range filtering, and 5 sort options
- Sidebar with "About This Store" card and social links
- Product pinning system (featured product + multiple pinned products)

**Mobile Link-in-Bio:**
- Vertical link list optimized for Instagram/TikTok bio traffic
- Lead magnet cards prominently displayed for email capture
- Product type icons (graduation cap for courses, etc.)
- Streamlined for one-thumb browsing

**Branding & Customization:**
- 8 preset accent colors (Cyan, Fuchsia, Purple, Amber, Emerald, Rose, Blue, Orange) or custom hex
- Banner image upload (4MB max)
- Custom logo URL
- Tagline (e.g., "Lo-fi beats and mixing tutorials")
- Genre tags: Lo-Fi, Trap, Hip Hop, House, Techno, Drum & Bass, Pop, R&B, EDM, Sound Design, Mixing, Mastering, Music Theory, Ableton, FL Studio, Logic Pro
- Section visibility toggles (bio, social links, stats)
- Default product sort order

**Social Links (V2 System):**
- 15+ platforms: Spotify, Apple Music, Bandcamp, SoundCloud, Beatport, Instagram, Twitter/X, TikTok, YouTube, Threads, Discord, Twitch, LinkedIn, Website
- Multiple links per platform (e.g., two YouTube channels)
- Custom labels per link (e.g., "Ableton Tips" for YouTube)

**Custom Domains:**
- `customDomain` field with verification status (pending, verified, active)
- Available on Creator plan and above

**Personalized URL Paths:**
- `/{slug}/products/{productSlug}` - Individual products
- `/{slug}/courses/{courseSlug}` - Courses
- `/{slug}/beats/{beatSlug}` - Beat leases
- `/{slug}/coaching/{productId}` - Coaching sessions
- `/{slug}/memberships/{membershipSlug}` - Memberships
- `/{slug}/tips/{tipSlug}` - Tips
- `/{slug}/bundles/{bundleSlug}` - Bundles
- `/{slug}/p/{pageSlug}` - Custom landing pages

**AI-Powered Bio Generation:**
- Analyzes store products and generates a relevant bio automatically

**Creator Plan Tiers:**
- Free: Basic link-in-bio, limited products
- Starter ($12/mo): Entry tier
- Creator ($29/mo): Custom domains unlocked
- Creator Pro ($79/mo): Power users
- Business ($149/mo): Teams
- Early Access: Grandfathered unlimited

### The Proof

| Component | Location | Purpose |
|-----------|----------|---------|
| Storefront Page | `app/[slug]/page.tsx` | Public creator storefront with search, filter, featured products |
| Storefront Layout | `app/[slug]/layout.tsx` | SEO metadata, OG tags, structured data |
| Link-in-Bio Layout | `app/[slug]/components/LinkInBioLayout.tsx` | Mobile-optimized vertical link list |
| Desktop Storefront | `app/[slug]/components/DesktopStorefront.tsx` | Full product grid layout |
| Mobile Storefront | `app/[slug]/components/MobileStorefront.tsx` | Link-in-bio pattern layout |
| Stores Backend | `convex/stores.ts` | Store CRUD, slug management, branding fields |
| Store Schema | `convex/schema.ts` (stores table) | accentColor, bannerImage, logoUrl, genreTags, socialLinksV2, featuredProductId, sectionVisibility |
| Profile Editor | `app/dashboard/profile/page.tsx` | 5-tab editor: Basic Info, Branding, Social Links, Settings, Revenue |
| Domain Settings | `app/dashboard/settings/domains/page.tsx` | Custom domain configuration |
| Account Settings | `app/dashboard/settings/account/page.tsx` | Display name and bio |
| Product Pages | `app/[slug]/products/[productSlug]/page.tsx` | Individual product landing pages |
| Course Pages | `app/[slug]/courses/[courseSlug]/page.tsx` | Course detail with enrollment |
| Beat Pages | `app/[slug]/beats/[beatSlug]/page.tsx` | Beat lease with license tiers |
| Coaching Pages | `app/[slug]/coaching/[productId]/page.tsx` | Coaching session booking |
| Music Showcase | `convex/musicShowcase.ts` | Artist-focused profile alternative |

---

## 6. PRODUCT DIVERSITY

### The Problem

"I needed different tools for courses, downloads, services, and memberships."

When I started selling online, I had a Gumroad for my sample packs, Teachable for my courses, Calendly for coaching calls, and Patreon for memberships. Four platforms, four dashboards, four payment processors, four sets of analytics that don't talk to each other. When a student bought my course on Teachable and then wanted a sample pack, they had to create a whole new account on Gumroad. The experience was fragmented and I was losing customers at every handoff.

### The Feature

PPR supports **16+ distinct product types** purpose-built for music creators, all under one roof with a single checkout, single customer identity, and unified analytics.

**Complete Product Type Inventory:**

| # | Product Type | Category Code | Music-Specific Features |
|---|-------------|---------------|------------------------|
| 1 | **Sample Packs** | `sample-pack` | Credit-based pricing, individual sample selling, waveform visualization, BPM/key/genre metadata, royalty-free/exclusive/commercial licensing |
| 2 | **Preset Packs** | `preset-pack` | Target plugin selection (Serum, Vital, Massive, Omnisphere, Sylenth1, Phase Plant, Pigments, and 15+ more), version compatibility, installation notes |
| 3 | **Beat Leases** | `beat-lease` | 4 license tiers (Basic: MP3 only / Premium: WAV + commercial / Exclusive: stems + unlimited / Unlimited: perpetual), automatic contract PDF generation, BPM/key/genre metadata, 30-sec audio preview |
| 4 | **Effect Chains** | `effect-chain` | Multi-DAW support (Ableton, FL Studio, Logic, Bitwig, Studio One, Cubase, Reason), macro controls, CPU load rating, rack types (audio effect, instrument, MIDI, drum), chainshot/macro screenshots |
| 5 | **Project Files** | `project-files` | DAW-specific versions (.als, .flp, .logicx), full production files with stems, sound design documentation |
| 6 | **Mixing Templates** | `mixing-template` | Pre-configured mixer layouts, effect routing, genre-specific EQ/compression settings |
| 7 | **Courses** | `course` | 4-level hierarchy (Course -> Module -> Lesson -> Chapter), video/audio content, interactive quizzes, timestamped notes, downloadable resources, AI-generated cheat sheets, certificate generation, student progress tracking, course Q&A chat |
| 8 | **Coaching** | `coaching` | Session scheduling with timezone support, duration/type configuration (video, audio, phone, text), Discord role auto-assignment, reminder notifications, session notes |
| 9 | **Mixing Services** | `mixing-service` | Multi-tier pricing, stem count options, turnaround SLA, revision limits, rush fees, full order workflow (pending -> upload -> in-progress -> review -> revision -> completed), in-order messaging, file management |
| 10 | **Mastering Services** | `mastering-service` | Same workflow as mixing with mastering-specific configurations |
| 11 | **Memberships** | (subscriptions) | Multiple tiers per creator (Basic, Pro, VIP), monthly & yearly pricing, trial periods, Stripe recurring billing, content access control, cancel-at-period-end |
| 12 | **Bundles** | `bundle` | Mix courses + products, original vs. bundle pricing with discount display, time-limited and quantity-limited availability, follow gate option |
| 13 | **Guides & PDFs** | `pdf` | PDF guides, eBooks, cheat sheets, workbooks, AI-generated from course content with 6 section types |
| 14 | **Playlist Curation** | `playlist-curation` | Multi-platform (Spotify, Apple Music, SoundCloud), submission pricing, review queue, acceptance/decline with feedback, genre constraints |
| 15 | **Plugins** | (directory) | Effect/Instrument/Studio Tool categories, free/paid/freemium pricing, author info, purchase URL |
| 16 | **Tip Jar** | `tip-jar` | Donation/appreciation payments |
| 17 | **Music Releases** | `release` | Pre-save campaign capture, release day announcements |
| 18 | **URL/Media Links** | `urlMedia` | YouTube embeds, Spotify embeds, external links |

**Payment Models:**
- One-time purchase (most products)
- Tiered purchase (beats: 4 tiers, mixing services: multiple levels)
- Credit-based (samples: buy credits, spend per download)
- Recurring subscription (memberships: monthly/yearly)
- Payment plans (installments for expensive products)
- Free with follow gate (lead magnets requiring social follow + email)
- Affiliate commission (revenue sharing on referrals)

**Music-Specific Metadata Across Products:**
- BPM, Key, Genre, SubGenre (beats, samples, effect chains, project files)
- Stems/Trackouts available (beats, samples)
- DAW Compatibility (effect chains, presets, project files, mixing templates)
- Audio Format (WAV, MP3, AIFF, .adg, .adv, .alp)
- Audio Preview with waveform visualization
- License type (royalty-free, exclusive, commercial)

**Engagement Features (Unified):**
- Wishlist (products + courses)
- Product reviews (1-5 stars with verified purchase flag)
- Certificate generation (courses)
- Achievement/XP tracking
- Discord integration (coaching, courses)
- Follow gates (social media + email capture)
- Order bumps (post-purchase upsell)
- Coupons & discounts (percentage or fixed amount)

### The Proof

| Component | Location | Purpose |
|-----------|----------|---------|
| Product Schema | `convex/schema.ts` (digitalProducts table, lines 1089-1489+) | Master product table with all type-specific fields |
| Monetization Schema | `convex/monetizationSchema.ts` | Bundles, subscriptions, affiliate programs, coupons |
| Sample Packs | `convex/schema.ts` (audioSamples, samplePacks, sampleDownloads) | Credit system, individual selling, waveform data |
| Beat Licenses | Components: `components/beats/BeatLicenseCard.tsx`, `components/beats/LicenseTierPicker.tsx` | 4-tier licensing with contract generation |
| Courses | `convex/schema.ts` (courses, courseModules, courseLessons, courseChapters, enrollments) | 4-level hierarchy with progress tracking |
| Coaching | `convex/schema.ts` (coachProfiles, coachingSessions) | Session scheduling, Discord integration |
| Service Orders | `convex/schema.ts` (serviceOrders, serviceOrderMessages) | Full order workflow with messaging and file management |
| Memberships | `convex/schema.ts` (creatorSubscriptionTiers, userCreatorSubscriptions) | Multi-tier recurring billing |
| Bundles | `convex/monetizationSchema.ts` (bundles table) | Course + product bundles with time/quantity limits |
| Cheat Sheets | `convex/cheatSheetPacks.ts`, `convex/cheatSheetMutations.ts` | AI-generated PDF reference guides |
| Playlist Curation | `convex/schema.ts` (curatorPlaylists, trackSubmissions) | Multi-platform submission workflow |
| Plugins | `convex/schema.ts` (plugins, pluginCategories) | Directory with effect/instrument/tool categories |
| Marketplace: Beats | `app/marketplace/beats/` | Beat browsing with license selection |
| Marketplace: Samples | `app/marketplace/samples/` | Sample browsing with credit system |
| Marketplace: Presets | `app/marketplace/preset-packs/` | Preset browsing by target plugin |
| Marketplace: Courses | `app/marketplace/courses/` | Course browsing with enrollment |
| Marketplace: Coaching | `app/marketplace/coaching/` | Coach directory with booking |
| Marketplace: Mixing | `app/marketplace/mixing-services/` | Service tier selection |
| Marketplace: Guides | `app/marketplace/guides/` | PDF/guide browsing |
| Marketplace: Bundles | `app/marketplace/bundles/` | Bundle browsing with savings display |
| Marketplace: Memberships | `app/marketplace/memberships/` | Subscription tier comparison |
| Marketplace: Racks | `app/marketplace/ableton-racks/` | Effect chain browsing by DAW |
| Marketplace: Plugins | `app/marketplace/plugins/` | Plugin directory |
| Marketplace: Templates | `app/marketplace/mixing-templates/` | Template browsing by DAW |
| Marketplace: Projects | `app/marketplace/project-files/` | Project file browsing |

---

## 7. CREATOR-TO-CREATOR DISCOVERY

### The Problem

"How do buyers find creators they don't already follow?"

The biggest problem with platforms like Gumroad and Teachable is that nobody discovers you there. You bring all your own traffic. There's no marketplace, no browse page, no recommendation engine. If someone doesn't already follow you on Instagram, they'll never find your courses. I wanted a platform where a student who finishes one producer's mixing course gets recommended another producer's mastering course. Where browsing exists. Where creators help each other grow.

### The Feature

PPR has a **multi-layered discovery system** that helps buyers find creators organically through browsing, search, recommendations, and social proof:

**Creator Directory:**
- Dedicated browse page at `/marketplace/creators`
- Creator cards with avatar, banner, bio, genre tags, and stats (products, courses, students)
- Real-time search across creator names, bios, and categories
- "View Storefront" CTA linking to `/{creator-slug}`

**Marketplace Search & Filtering:**
- **Content Type Tabs:** All, Courses, Products, Coaching, Plugins, Sample Packs, Bundles, Memberships, Ableton Racks
- **Sidebar Filters:** Category, plugin-specific categories (multi-select searchable), price range (Free, Under $50, $50-100, Over $100)
- **Sort Options:** Newest, Most Popular (by enrollment/download/booking count), Price Low-High, Price High-Low
- **View Modes:** Grid and list
- **Creator Sidebar:** Top 5 creators with product count shown alongside search results
- **Pagination:** 18 items per page

**Featured Content & Spotlight:**
- `getCreatorSpotlight()` - Highlights top creator by sales volume
- `getFeaturedContent()` - 6 featured items (courses + products) randomly shuffled per load
- Badge system: "Top Seller" for #1, "Rising Star" for top 3

**Personalized Recommendations Engine:**
- `generateRecommendations(userId)` with weighted scoring:
  - Similar Category: +40 points (courses in categories user has completed)
  - Skill Level Progression: +30 points (Beginner -> Intermediate)
  - Skill Gaps: +20 points (unexplored categories)
  - Content Quality: +10 points (published courses with modules)
- Top 10 recommendations per user with reason explanations
- 7-day expiration with automatic regeneration

**Leaderboards & Rankings:**
- Top Creators by Revenue (weekly, monthly, all-time) with badge system
- Top Students by XP
- Most Active by Learning Streak
- User position/percentile calculation

**Follow Gate System (Email Capture at Discovery):**
- Gate free downloads behind email + social follow requirements
- Tracks follows across Instagram, TikTok, YouTube, Spotify
- Rate limiting: max 5 submissions per email per hour
- Builds creator email list from marketplace discovery

**Social Proof:**
- Platform stats on homepage (total creators, courses, products, students)
- Creator success stories with estimated monthly earnings ($6.4K-$15.8K)
- Enrollment counts, download counts, booking counts on product cards
- Verified creator badges

**SEO & Discoverability:**
- Schema.org structured data on creator profiles and products
- Dynamic meta descriptions per creator
- OpenGraph and Twitter card support
- Canonical URLs
- JSON-LD for Product + BreadcrumbList on marketplace pages

### The Proof

| Component | Location | Purpose |
|-----------|----------|---------|
| Marketplace Backend | `convex/marketplace.ts` | searchMarketplace(), getAllCreators(), getCreatorSpotlight(), getFeaturedContent(), getMarketplaceCategories() |
| Recommendations | `convex/recommendations.ts` | Personalized course recommendations with weighted scoring |
| Leaderboards | `convex/leaderboards.ts` | Creator/student/activity rankings with badges |
| Follow Gates | `convex/followGateSubmissions.ts` | Email capture with social follow verification |
| Creator Directory UI | `app/marketplace/creators/page.tsx` | Browse page with search and creator cards |
| Creator Directory Layout | `app/marketplace/creators/layout.tsx` | SEO metadata for creator directory |
| Marketplace UI | `app/marketplace/page.tsx` | Full marketplace with 9-tab filtering, sidebar, and pagination |
| Homepage Stats | `app/_components/marketplace-stats.tsx` | Platform-wide stats display |
| Social Proof | `app/_components/social-proof-strip.tsx` | Creator success stories and earnings |
| Marketplace Section | `app/_components/marketplace-section.tsx` | Homepage marketplace preview |
| Creator Storefront | `app/[slug]/page.tsx` | Individual creator pages with full product display |
| Store Management | `convex/stores.ts` | Creator store queries with stats aggregation |

---

## Summary: Feature Count

| Feature Area | Distinct Capabilities |
|---|---|
| Email Marketing | 20+ tables, 70+ templates, 15+ automation sequences, A/B testing, lead scoring, deliverability monitoring |
| Social Scheduling | 5 platforms, 6-step AI pipeline, DM automation, cross-platform campaigns, CTA templates |
| AI Content | 10 distinct workflows, 25+ endpoints, 20+ LLM models, 7-stage quality pipeline |
| Analytics | Conversion funnels, UTM tracking, send time optimization, revenue intelligence, leaderboards |
| Storefront | Dual-mode (desktop + link-in-bio), custom domains, 8 accent colors, 15+ social platforms, AI bio |
| Product Types | 16+ product types, 6 payment models, music-specific metadata, unified checkout |
| Discovery | Creator directory, marketplace search with 9 content tabs, recommendations engine, featured content, follow gates |

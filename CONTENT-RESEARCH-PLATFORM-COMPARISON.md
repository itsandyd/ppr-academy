# Platform Comparison: PPR Academy vs Gumroad vs Patreon vs BeatStars

> Research document for social media content targeting music producers who ALREADY sell on other platforms.
> Only documents features that are actually built and functional in the codebase.

---

## 1. Product Types & Flexibility

### Every Product Type PPR Supports (26+ types)

**Music Production Products:**
| # | Product Type | Schema/Route | Key Features |
|---|---|---|---|
| 1 | Beat Leases | `digitalProducts` (beat-lease) / `/marketplace/beats/` | 4-tier licensing (Free/Basic/Premium/Exclusive), BPM/key/genre metadata, stems, trackouts |
| 2 | Sample Packs | `samplePacks` + `audioSamples` / `/marketplace/samples/` | Individual sample preview with waveform, per-sample metadata (BPM, key, genre, category), credit-based pricing |
| 3 | Preset Packs | `digitalProducts` (preset-pack) / `/marketplace/preset-packs/` | 50+ target plugins supported (Serum, Vital, Massive, Omnisphere, etc.), DAW-specific filtering |
| 4 | Ableton Racks / Effect Chains | `digitalProducts` (effect-chain) / `/marketplace/ableton-racks/` | Multi-DAW support (Ableton/FL/Logic/Bitwig/Studio One/Reason/Cubase), CPU load rating, macro count, M4L compatibility |
| 5 | Project Files | `digitalProducts` (project-files) / `/marketplace/project-files/` | Multi-DAW project templates |
| 6 | Mixing Templates | `digitalProducts` (mixing-template) / `/marketplace/mixing-templates/` | DAW-specific mixing project files |
| 7 | MIDI Packs | `digitalProducts` (midi-pack) | MIDI sequence collections |
| 8 | Plugins | `plugins` table / `/marketplace/plugins/` | VST/AU plugins, categorized by Effect/Instrument/Studio Tool, free/paid/freemium pricing |

**Educational Content:**
| # | Product Type | Schema/Route | Key Features |
|---|---|---|---|
| 9 | Courses | `courses` table / `/marketplace/courses/` | Modules > Lessons > Chapters hierarchy, drip content scheduling, follow gates, AI-generated reference PDFs, Mux video streaming, free preview chapters |
| 10 | Workshops | `digitalProducts` (workshop) | Workshop-format content |
| 11 | Masterclasses | `digitalProducts` (masterclass) | Expert-led sessions |
| 12 | Guides / PDFs / Cheat Sheets | `digitalProducts` (pdf/pdf-guide/cheat-sheet) / `/marketplace/guides/` | Reference materials, ebooks, cheat sheets |

**Services:**
| # | Product Type | Schema/Route | Key Features |
|---|---|---|---|
| 13 | 1-on-1 Coaching | `coachProfiles` + `coachingSessions` / `/marketplace/coaching/` | Availability calendar, session duration config, video/audio/phone types, Discord integration, custom requirements |
| 14 | Mixing Services | `serviceOrders` / `/marketplace/mixing-services/` | Mixing, mastering, stem-mixing, turnaround time config, requirements collection |
| 15 | Playlist Curation | `digitalProducts` (playlist-curation) | Genre acceptance, submission review SLA, max submissions/month |

**Monetization & Community:**
| # | Product Type | Schema/Route | Key Features |
|---|---|---|---|
| 16 | Memberships | `subscriptionPlans` + `membershipSubscriptions` / `/marketplace/memberships/` | Monthly/yearly pricing, trial periods, tiered access (Basic/Pro/VIP), course + product access bundling, discount % |
| 17 | Bundles | `bundles` table / `/marketplace/bundles/` | Mixed product types (courses + products), auto-calculated savings, limited quantity option, time-limited availability |
| 18 | Tip Jar | `digitalProducts` (tip-jar) | Pay-what-you-want donations |
| 19 | Music Releases | `digitalProducts` (release) | Pre-save campaigns, streaming platform integration (Spotify/Apple/SoundCloud/YouTube/Tidal/Deezer/Amazon/Bandcamp), ISRC/UPC codes, playlist pitching |
| 20 | Blog Posts | `digitalProducts` (blog-post) | Creator content marketing |
| 21 | Community | `digitalProducts` (community) | Community features |
| 22 | Lead Magnets | `digitalProducts` (lead-magnet) | Free resources gated behind email/social follows |

**Total: 22+ distinct product types across 14 marketplace categories.**

### What You CAN'T Sell on Each Platform

**On Patreon, you CANNOT:**
- Sell individual products (one-time purchases) -- Patreon is subscription-only
- Offer tiered beat licensing (no licensing system at all)
- Sell individual sample packs or preset packs as standalone products
- Offer mixing/mastering services with order tracking
- Run a coaching business with scheduling
- Offer bundles with mixed product types
- Let buyers preview individual sounds before subscribing
- Sell project files, MIDI packs, or effect chains as individual products
- Run pre-save campaigns for music releases

**On Gumroad, you CANNOT:**
- Offer tiered beat licensing (Free/Basic/Premium/Exclusive with terms)
- Let buyers preview individual samples in a pack (it's a blind zip file)
- Stream course content (Gumroad courses are basic)
- Offer coaching with availability calendars
- Run a mixing service with requirements intake
- Auto-remove beats when exclusive license is sold
- Gate free downloads behind social follows
- Offer DAW-specific filtering for presets/templates
- Run pre-save campaigns or playlist pitching

**On BeatStars, you CANNOT:**
- Sell streaming courses with modules/lessons/chapters
- Offer 1-on-1 coaching with scheduling
- Sell preset packs with plugin-specific metadata
- Run mixing/mastering services
- Sell bundles mixing courses + products
- Offer memberships with tiered access
- Sell project files, effect chains, or MIDI packs
- Run a full marketplace with 14+ categories
- Use built-in email marketing or social scheduling

---

## 2. Email Marketing (Built-in vs Paying Extra)

PPR has a production-grade email marketing system built into the platform. Here's what a creator gets without paying for a separate tool:

### Templates: 45+ Pre-Built Email Templates

Organized by funnel stage:
- **Top of Funnel (5):** Free sample pack giveaway, free course module, free track feedback, release pre-save capture, pre-save confirmation
- **Middle of Funnel (6):** Sample pack showcase, course preview, coaching case study, production tips newsletter, release announcement, 48h follow-up
- **Bottom of Funnel (6):** Sample pack launch, course enrollment closing, last coaching spots, cart abandonment recovery (3-email sequence), release playlist pitch, 1-week milestone
- **Cross-Sell/Upsell (3):** Sample pack -> course, course -> coaching, bundle promotion
- **Retention (2):** Win-back inactive producers, course dropout re-engagement
- **Post-Purchase (4):** Purchase confirmation, review request, Discord invite, feature your track
- **Direct Response (5):** Scarcity, problem/agitate/solution, before/after, value stack, FOMO
- **Promotional (2):** Flash credit sale, bundle deal

Plus **14 multi-step automation sequences** (sample pack buyer ascension, course student engagement, coaching lifecycle, cart recovery, win-back, pre-save to superfan, and more).

**Source:** `convex/emailTemplates.ts`

### Automation Triggers: 15+ Types

| Trigger | What Happens |
|---|---|
| `user_signup` | New registration -> welcome sequence |
| `course_enrollment` | Student enrolls -> onboarding sequence |
| `course_progress` | Hits 25/50/75% -> encouragement email |
| `course_completion` | Finishes course -> graduation + upsell sequence |
| `certificate_issued` | Certificate generated -> delivery email |
| `purchase` | Any product bought -> thank you + cross-sell |
| `inactivity` | Inactive 30/60/90 days -> win-back sequence |
| `lead_magnet_downloaded` | Free resource grabbed -> nurture sequence |
| `cart_abandoned` | Left without buying -> 3-email recovery (1h, 24h, 72h) |
| `release_presave` | Pre-saved music -> confirmation + launch day emails |
| `email_opened` / `email_clicked` | Engagement-based follow-up |
| `page_visit` | Visited specific page -> retargeting email |
| `custom_event` | API-triggered custom workflows |
| `tag_added` | Contact tagged -> segment-specific sequence |
| `quiz_completion` | Completed quiz -> results email |

**Source:** `convex/automationTriggers.ts`, `convex/emailWorkflows.ts`

### Workflow Builder: 12 Node Types

Visual drag-and-drop workflow builder with: Trigger, Email, Delay, Condition (if/then branching), Action, Split (A/B test), Webhook, Notify, Goal, Course Email, Course Cycle, Stop nodes.

**Source:** `convex/emailWorkflows.ts`

### A/B Testing

- Test subject lines, content, send times, or sender names
- Percentage-based split distribution
- Optimize for open rate, click rate, or conversion rate
- Statistical significance calculation (75/85/95% confidence)
- Auto-send winning variant to remaining contacts

**Source:** `convex/emailABTesting.ts`

### Segmentation

- Dynamic segments (auto-updating based on behavior: course progress, purchases, email engagement, inactivity)
- Manual segments (tag-based, custom lists, imports)
- 8 filter operators (equals, not_equals, greater_than, less_than, contains, not_contains, in, not_in)
- AND/OR logic with nested conditions

**Source:** `convex/emailSegmentation.ts`

### Subscriber Management

- Per-creator contact lists (store-scoped)
- Contact tagging system
- CSV bulk import
- Source tracking (lead magnet, signup, purchase, enrollment)
- Engagement stats per contact (sent, opened, clicked, last activity)
- Unsubscribe/bounce/complaint management

**Source:** `convex/emailContacts.ts`

### Analytics & Deliverability

- Open rate, click rate, bounce rate, complaint rate per campaign
- Deliverability monitoring (SPF, DKIM, DMARC verification)
- Bounce/complaint alerts (>2% bounce, >0.5% complaint)
- Domain health monitoring
- Custom sender domain support (creator@yourdomain.com)

**Source:** `convex/emailAnalytics.ts`, `convex/emailDeliverability.ts`

### Additional AI Features

- **AI email copy generator** (`convex/aiEmailGenerator.ts`) - AI-written emails with subject line suggestions
- **Send time optimization** (`convex/sendTimeOptimization.ts`) - Per-user optimal send time
- **Lead scoring** (`convex/emailLeadScoring.ts`) - Behavioral + engagement scoring
- **Spam scoring** (`convex/emailSpamScoring.ts`) - Pre-send content analysis

### What This Replaces

A Gumroad/Patreon/BeatStars creator currently pays **$30-100/month** for Mailchimp, ConvertKit, or ActiveCampaign to get:
- Email templates (PPR has 45+)
- Automation workflows (PPR has visual builder with 12 node types)
- A/B testing (PPR has it; ConvertKit doesn't)
- Segmentation (PPR matches ActiveCampaign)
- Analytics (PPR has full deliverability monitoring)
- Drip campaigns (PPR has 14 pre-built sequences)

PPR includes all of this at $0 extra.

---

## 3. Social Media & Content Tools (Built-in vs Paying Extra)

### Post Scheduling & Publishing

- **Multi-platform scheduling:** Instagram (posts, reels, stories), Twitter/X, Facebook, LinkedIn (TikTok framework in place)
- **Post composer** with platform-specific character limits and aspect ratio guidelines
- **Calendar view** with date/time picker and timezone support
- **OAuth account connections** -- connect multiple accounts per platform
- **Auto-publishing** via platform APIs (Instagram Graph API, Twitter v2, Facebook Page API, LinkedIn UGC)
- **Scheduled + instant posting** with minimum 5-minute advance scheduling

**Source:** `components/social-media/post-composer.tsx`, `components/social-media/social-scheduler.tsx`, `convex/socialMediaActions.ts`

### AI Content Generation Engine

This is where PPR goes far beyond any scheduling tool:

- **Platform-specific script generation** for TikTok, YouTube, Instagram Reels, LinkedIn
- **100+ viral hook templates** ("If I had to start over...", "Stop doing X right now!", "Here's how I went from X to Y...", "5 things that feel illegal to know...", etc.)
- **Virality scoring algorithm** (40% engagement potential, 35% educational value, 25% trend alignment, scored 1-10)
- **One-click content repurposing** -- feed in one course chapter, get back platform-specific scripts for TikTok, YouTube, Instagram, AND a combined master script
- **AI caption generation** with platform-specific hashtags (15-20 for Instagram, 3-5 for TikTok)
- **AI image generation** via FAL.ai for post illustrations (Excalidraw-style educational diagrams)
- **AI voice-over generation** via ElevenLabs for narrated content
- **Batch processing** -- scan an entire course and generate scripts for every chapter automatically

**Source:** `convex/masterAI/socialMediaGenerator.ts`, `convex/masterAI/socialScriptAgent.ts`

### What This Replaces

A Gumroad/Patreon creator currently pays **$25-50/month** for Buffer/Later/Hootsuite to get basic scheduling. None of these tools include:
- AI script writing with 100+ viral hooks
- Virality scoring
- Automatic course-to-social-content pipeline
- AI image generation
- Voice-over generation
- Platform-specific content adaptation from a single source

PPR includes all of this. Buffer is $25-50/month for scheduling alone. Add Jasper AI ($49/mo) for content generation and you're at $74-99/month.

### Honest Gap

PPR's **analytics for social posts** links to native platform insights rather than providing its own analytics dashboard. Buffer/Later have more polished analytics. LinkedIn and TikTok auto-posting are not yet fully active.

---

## 4. Storefront & Discovery

### Creator Storefronts

Every creator gets a full storefront at `pauseplayrepeat.com/[store-slug]` with:

- **Hero section** with avatar, store name, tagline, bio
- **Stats bar** showing product count, free resources, students
- **Product grid** with specialized cards per product type (BeatLeaseCard, CourseCard, CoachingCard, MembershipCard, BundleCard, TipJarCard, etc.)
- **Social links** supporting 14 platforms (Instagram, X, YouTube, TikTok, Spotify, SoundCloud, Apple Music, Bandcamp, Threads, Discord, Twitch, Beatport, LinkedIn, website)
- **Lead magnet section** for free downloads (email capture)
- **Mobile-responsive** with dedicated mobile layout
- **Custom accent color**
- **Featured product pinning**
- **Section visibility toggles** (bio, social links, stats)
- **Custom domain support**
- **Dynamic OG images** for social sharing
- **JSON-LD structured data** for SEO
- **Full metadata** (title, description, keywords, canonical URLs, Twitter cards)

**Source:** `app/[slug]/page.tsx`, `app/[slug]/components/DesktopStorefront.tsx`, `app/[slug]/components/LinkInBioLayout.tsx`

### Storefront Sub-Pages Per Product Type

Each creator store has dedicated detail pages:
- `/[slug]/products/[productSlug]` -- General products
- `/[slug]/beats/[beatSlug]` -- Beats with player + licensing
- `/[slug]/courses/[courseSlug]` -- Courses with enrollment
- `/[slug]/memberships/[membershipSlug]` -- Membership tiers
- `/[slug]/coaching/[productId]` -- Coaching with booking
- `/[slug]/tips/[tipSlug]` -- Tip jar
- `/[slug]/bundles/[bundleSlug]` -- Bundle detail
- `/[slug]/p/[pageSlug]` -- Custom landing pages

### Link-in-Bio

The storefront's mobile layout (`LinkInBioLayout.tsx`) functions as a link-in-bio page -- vertical card stack with product links, social links, and lead magnet email capture. Creators can use their store URL as their Instagram/TikTok bio link.

**Source:** `app/[slug]/components/LinkInBioLayout.tsx`

### Marketplace Discovery

The marketplace at `/marketplace/` includes:
- **14 browsable categories** (beats, courses, samples, presets, ableton racks, guides, coaching, mixing services, mixing templates, project files, plugins, bundles, memberships, creators)
- **Advanced search** with full-text search across titles/descriptions/creators
- **Filters:** content type tabs, price range (Free / Under $50 / $50-$100 / Over $100), category multi-select, plugin-specific filters
- **Sorting:** Newest, Popular, Price Low-High, Price High-Low
- **Grid/List view toggle**
- **Pagination** (18 items per page)
- **Creator directory** (`/marketplace/creators/`) with creator cards, search, and stats

**Source:** `app/marketplace/page.tsx`, `app/marketplace/creators/page.tsx`

### Platform Comparison

**On Gumroad:** Your "store" is a list of checkout links. No marketplace discovery, no browsable categories, no advanced filtering, no social links, no link-in-bio.

**On Patreon:** Your "store" is a single subscription page. Buyers can't browse by product type, filter by price, or discover you through a marketplace.

**On PPR:** Full storefront with 8+ product page types, marketplace with 14 categories, creator directory, advanced filtering, link-in-bio, SEO, structured data, and custom domains.

### Honest Gap

PPR's store customization is limited to a single accent color -- no full theme system or layout customization like Linktree's 50+ templates. OG images use a template rather than dynamic branding overlays.

---

## 5. Audio Preview & Digital Product Experience

### Sample Preview

Buyers can **preview individual sounds in a sample pack before purchasing:**
- Interactive waveform visualization (canvas-based, 100-bar display)
- Click-to-seek on waveform
- Play/pause per sample
- BPM, key, genre, category metadata displayed per sample
- Filter by genre (14 genres), category (8 categories: drums, bass, synth, vocals, FX, melody, loops, one-shots)
- Grid and list view modes
- Download and play counts visible

**Source:** `components/ui/audio-waveform.tsx`, `app/marketplace/samples/page.tsx`

### Beat Preview

Buyers can **listen to full beats before purchasing:**
- Large play button on hero image
- Real-time progress bar overlay
- Volume control with mute
- BPM and key badges displayed on player
- Genre tags visible
- License tiers displayed alongside player
- One-click to purchase specific tier

**Source:** `app/marketplace/beats/[slug]/BeatDetailClient.tsx`

### Course Preview

Buyers can **preview course content before enrolling:**
- Course structure visible (modules, lessons, chapters)
- Free preview chapters (creator marks specific chapters as free)
- Video streaming via Mux (adaptive bitrate, CDN-distributed)
- Audio narration option per chapter
- Chapter progress tracking
- Download notes per chapter

**Source:** `app/courses/[slug]/lessons/[lessonId]/chapters/[chapterId]/page.tsx`, `components/video/MuxPlayer.tsx`

### Preset Pack Browsing

- Filter by target plugin (Serum, Vital, Massive, Omnisphere, Sylenth1, Phase Plant, etc.)
- Filter by DAW (Ableton, FL Studio, Logic Pro, Bitwig, Studio One, Multi-DAW)
- Filter by genre
- Free-only toggle

**Source:** `app/marketplace/preset-packs/page.tsx`

### Download Experience

After purchase:
- Instant file download (blob-based, forced download with proper filename and extension)
- Tier-appropriate files (e.g., basic = MP3+WAV, premium = +stems, exclusive = +trackouts)
- Ownership tracked per-user with download button replacing purchase button
- Pack purchases unlock all individual samples

**Source:** `app/marketplace/samples/page.tsx` (handleDownload function)

### Platform Comparison

**On Gumroad:** Buyers get a blind zip file. No audio preview. No waveform. No per-sample browsing. No filtering by BPM/key/genre. You buy it and hope it's good.

**On Patreon:** Buyers get whatever the creator posts behind the paywall. No individual sound preview. No marketplace browsing. No metadata filtering.

**On BeatStars:** Beat preview exists (this is BeatStars' core feature). But no sample pack preview, no preset filtering by plugin/DAW, no course streaming, no coaching booking.

**On PPR:** Waveform preview per sample, beat player with metadata, course streaming with free chapters, plugin-specific preset filtering, instant downloads with tier-appropriate files.

---

## 6. Licensing & Beat-Specific Features

### 4-Tier Licensing System

| Tier | Default Price | Files Included | Distribution Limit | Streaming Limit | Commercial | Music Video | Radio | Exclusive |
|---|---|---|---|---|---|---|---|---|
| Free | $0 | MP3 only | 1,000 | 10,000 | No | No | No | No |
| Basic | $25 | MP3 + WAV | 5,000 | 100,000 | Yes | No | No | No |
| Premium | $75 | MP3 + WAV + Stems | 50,000 | 1,000,000 | Yes | Yes | No | No |
| Exclusive | $500 | All files + Trackouts | Unlimited | Unlimited | Yes | Yes | Yes | Yes |

Each tier is fully customizable per beat -- creators set their own prices, limits, and terms.

**Source:** `convex/beatLeases.ts`, `app/dashboard/create/beat-lease/types.ts`

### Free Download -> Lead Gen

The **Free tier functions as a lead magnet:**
- MP3 download with producer tag required
- Non-commercial use only
- 1,000 distribution limit
- Described in UI as "Perfect for building your email list and social following"
- Can be gated behind follow requirements (email capture, social follows)

**Source:** `app/dashboard/create/beat-lease/steps/LicensingForm.tsx` (line 68 -- labeled "Lead Magnet")

### Exclusive Auto-Removal

When someone buys the exclusive license:
1. Stripe webhook fires
2. `markBeatAsExclusivelySold()` runs automatically
3. Beat is unpublished from marketplace (`isPublished: false`)
4. Marked with `exclusiveSoldAt`, `exclusiveSoldTo`, `exclusivePurchaseId`
5. All other tiers display "This beat has been sold exclusively" and disable purchase

**Source:** `convex/beatLeases.ts` (lines 237-258), `app/api/webhooks/stripe/route.ts` (lines 570-582), `components/beats/LicenseTierPicker.tsx`

### PDF License Agreement Generation

Auto-generated PDF contracts via `pdf-lib`:
- Beat title, producer name, licensee name/email
- License type and tier details
- All terms (commercial use, distribution/streaming limits, files included)
- Credit requirements
- Exclusivity clause
- Restrictions and termination clause

**Source:** `app/api/beats/contract/route.ts`

### Beat Metadata

Per-beat: BPM, musical key (24 keys), genre (11 genres: Trap, Drill, Hip-Hop, R&B, Pop, Afrobeat, Reggaeton, Boom-Bap, Lo-Fi, Experimental, Other), mood, instruments, duration, producer tag.

### What Patreon/Gumroad Don't Have

**None of this exists on Patreon or Gumroad:**
- No licensing tiers
- No distribution/streaming limits
- No contract generation
- No exclusive auto-removal
- No free-download-as-lead-magnet
- No BPM/key/genre metadata

**BeatStars comparison:**
BeatStars has licensing (Exclusive + Non-exclusive). PPR adds:
- A dedicated Free tier for lead gen (BeatStars doesn't have free-with-terms)
- More granular tier customization (per-tier music video rights, radio rights, credit toggle)
- Full PDF contract auto-generation
- Integration with the rest of the platform (email sequences triggered by license purchase, upsell from basic to exclusive via email)

### Honest Gaps

- No bulk licensing / cart system (each beat purchased individually; bundles exist as alternative)
- No lease upgrade path (can't upgrade basic -> premium without new purchase)
- No automated exclusive offer system (email template exists but manual)
- Sample packs do NOT have licensing tiers -- flat pricing only
- Sales analytics exist in data but per-tier breakdown not surfaced in dashboard UI

---

## 7. Revenue & Fees

### Fee Structure

**PPR Platform Fee: 10% of each sale**

Applied to all product types (courses, beats, samples, coaching, services, tips, bundles, memberships). The 10% is taken as a Stripe application fee -- Stripe splits the payment automatically.

**Source:** `app/api/courses/create-checkout-session/route.ts` (line 110: `coursePrice * 0.1`)

### How Creators Get Paid

PPR uses **Stripe Connect (Express accounts)**:
1. Creator connects their Stripe account during onboarding
2. When a sale happens, Stripe automatically splits: 90% -> creator's Stripe, 10% -> PPR
3. Creator requests payout (minimum $25 threshold)
4. Funds transfer from Stripe to creator's bank account on Stripe's normal schedule

No PPR holding period. Direct to creator.

**Source:** `app/api/payouts/request/route.ts`, `convex/monetizationUtils.ts`

### Creator Plan Pricing

| Tier | Monthly | Yearly | Max Products | Email Sends/mo |
|---|---|---|---|---|
| Free | $0 | $0 | 1 product | 0 |
| Starter | $12 | $108 | 15 | 500 |
| Creator | $29 | $288 | 50 | 2,500 |
| Pro | $79 | $708 | Unlimited | 10,000 |
| Business | $149 | $1,428 | Unlimited | Unlimited |

**Source:** `convex/creatorPlans.ts`

### Fee Comparison

| Platform | Platform Fee | Monthly Cost | Payment Methods |
|---|---|---|---|
| **PPR** | 10% of sales | $12-149/mo (creator plan) | Credit cards |
| **Gumroad** | 10% of sales | $0 (no monthly fee) | Cards, PayPal, Apple Pay, Google Pay |
| **Patreon** | 8-12% of sales | $0 (no monthly fee) | Cards, PayPal, Google Pay |
| **BeatStars** | Varies (0-15%) | $0-20/mo (producer plans) | Cards, PayPal, Apple Pay |

### Additional Revenue Features

- **Coupon system:** Percentage or fixed discounts, per-user limits, first-time-only, min purchase amounts, expiration dates, bulk creation (up to 100 codes). (`convex/coupons.ts`)
- **Credits system:** 5 credit packages from $9.99/10 credits to $129.99/350 credits. Used for sample/preset purchases. (`convex/credits.ts`)
- **Affiliate program:** Schema defined (commission rates, click tracking, payouts) but not fully implemented in production.
- **Payment plans:** Schema defined (installment payments) but not implemented.

### Honest Gaps

- **Payment methods limited to credit cards only** -- no PayPal, Apple Pay, or Google Pay. This is a real limitation vs competitors.
- **Refunds are manual/admin-only** -- no self-service refund window. Gumroad and Patreon offer auto-refunds.
- **Tax system defined but not integrated** into checkout flow.
- **Affiliate system schema exists but isn't active.**
- **Platform fee is hardcoded** across 10+ checkout routes (not configurable).

---

## 8. DM Automation (Built-in vs ManyChat)

### What PPR Has Built

PPR has a **full comment-to-DM automation system** with AI-powered responses:

**Comment-to-DM (ManyChat Replacement):**
- Keyword-triggered automations -- creator sets trigger keywords on specific posts or ALL posts
- When someone comments a keyword, system auto-replies via Instagram DM
- Two response modes: static message OR **Smart AI** (OpenAI-powered conversational responses)
- AI maintains conversation context (last 10 messages stored in chat history)
- Can auto-send product/course links in DM responses
- Prevents self-reply loops (won't respond to creator's own comments)

**Source:** `convex/automations.ts` (lines 208-503), `convex/webhooks/instagram.ts`

**Cross-Platform DM Sending:**
- Instagram DM (via Facebook Graph API v21.0)
- Twitter/X DM (via Twitter API v2)
- Facebook Messenger (via Send API)
- Batch DM sending with rate limiting (1-second delay between messages)

**Source:** `convex/socialDM.ts`, `convex/socialDMWebhooks.ts`

**Full Automation Workflow Engine:**
- Trigger types: keyword, comment, DM, mention, hashtag, page visit, custom event, cart abandonment, purchase, enrollment, manual
- Action types: send message, add/remove tags, send resources (links, courses, products), delay, call webhooks, send notifications
- Conditional branching (if/then logic)
- Response waiting (waits for user to reply, routes based on yes/no)
- Platform support: Instagram, Twitter, Facebook, TikTok, LinkedIn

**Source:** `convex/automation.ts` (2,299 lines)

### What This Replaces

ManyChat costs **$15-65/month** and provides:
- Comment-to-DM automation (PPR has this)
- Keyword triggers (PPR has this)
- Flow builder with branching (PPR has this)
- Instagram, Facebook, TikTok support (PPR has Instagram + Facebook + Twitter; TikTok framework exists)

PPR adds **Smart AI responses** that ManyChat does not have -- AI maintains conversation context and generates contextual replies rather than following a fixed flow.

### Honest Gaps

- TikTok DM automation is framework-only, not fully active
- LinkedIn DM is defined but not deeply implemented
- No visual flow builder UI confirmed (backend logic exists, frontend not verified)
- No SMS/WhatsApp support (ManyChat supports these)

---

## 9. The "Hidden Cost" Stack

Every feature below is something a Gumroad, Patreon, or BeatStars creator currently pays a separate tool for. PPR includes all of them.

| PPR Feature | File Path / Component | External Tool It Replaces | Approx. Monthly Cost |
|---|---|---|---|
| **Email marketing** (45+ templates, workflows, A/B testing, segmentation, analytics) | `convex/emailTemplates.ts`, `convex/emailWorkflows.ts`, `convex/emailABTesting.ts`, `convex/emailSegmentation.ts` | Mailchimp / ConvertKit / ActiveCampaign | **$30-100/mo** |
| **Social media scheduling** (multi-platform, calendar, auto-publish) | `components/social-media/post-composer.tsx`, `components/social-media/social-scheduler.tsx` | Buffer / Later / Hootsuite | **$25-50/mo** |
| **AI content generation** (scripts, captions, hashtags, 100+ viral hooks, virality scoring) | `convex/masterAI/socialMediaGenerator.ts`, `convex/masterAI/socialScriptAgent.ts` | Jasper AI / Copy.ai | **$39-49/mo** |
| **DM automation** (comment-to-DM, keyword triggers, AI responses, flow builder) | `convex/automations.ts`, `convex/socialDM.ts`, `convex/automation.ts` | ManyChat | **$15-65/mo** |
| **Storefront / website** (full store, product pages, checkout, custom domain) | `app/[slug]/`, `app/[slug]/components/DesktopStorefront.tsx` | Squarespace / Carrd / Shopify | **$12-39/mo** |
| **Link-in-bio** (mobile layout, social links, product cards, email capture) | `app/[slug]/components/LinkInBioLayout.tsx` | Linktree Pro | **$5-24/mo** |
| **Course platform** (streaming, modules, drip content, certificates, free previews) | `app/courses/`, `components/video/MuxPlayer.tsx` | Teachable / Thinkific / Kajabi | **$39-149/mo** |
| **Coaching/booking** (availability calendar, session types, requirements) | `app/marketplace/coaching/`, `convex/coachProfiles` | Calendly + Stripe | **$10-20/mo** |
| **AI voice-over** (text-to-speech for content) | `convex/masterAI/socialMediaGenerator.ts` (generateSocialAudio) | ElevenLabs / Murf | **$5-22/mo** |
| **AI image generation** (post illustrations) | `convex/masterAI/socialMediaGenerator.ts` (generateSocialImage) | Midjourney / DALL-E | **$10-20/mo** |
| **Coupon/discount system** | `convex/coupons.ts` | Built into some platforms, paid plugins for others | **$0-10/mo** |
| **Cart abandonment emails** | `convex/automationTriggers.ts`, `convex/emailTemplates.ts` (cart recovery sequence) | Klaviyo / separate tool | **$20-45/mo** |

### Total "Hidden Cost" to Replicate PPR

| Tool Category | Low Estimate | High Estimate |
|---|---|---|
| Email marketing | $30/mo | $100/mo |
| Social scheduling | $25/mo | $50/mo |
| AI content generation | $39/mo | $49/mo |
| DM automation | $15/mo | $65/mo |
| Website/storefront | $12/mo | $39/mo |
| Link-in-bio | $5/mo | $24/mo |
| Course platform | $39/mo | $149/mo |
| Coaching/booking | $10/mo | $20/mo |
| AI voice-over | $5/mo | $22/mo |
| AI image generation | $10/mo | $20/mo |
| Cart abandonment | $20/mo | $45/mo |
| **TOTAL** | **$210/mo** | **$583/mo** |

---

## The Real Comparison

### A producer on Gumroad gets:
- A checkout link per product
- Basic product pages (no audio preview, no filtering)
- Basic email collection (no automations, no templates, no A/B testing)
- No social scheduling
- No DM automation
- No course streaming
- No coaching tools
- No licensing system
- No marketplace discovery

**They pay:** Gumroad (10% fee, no monthly) + Mailchimp ($30-50/mo) + Later ($25/mo) + ManyChat ($15-45/mo) + Linktree ($5-9/mo) + Teachable ($39-149/mo for courses) = **$114-278/month in tools + 10% of sales**

### A producer on Patreon gets:
- A subscription page (recurring only, no one-time purchases)
- Patron-only posts and content
- Basic analytics
- No individual product sales
- No licensing system
- No audio preview or marketplace
- No social scheduling
- No DM automation
- No course platform
- No coaching tools

**They pay:** Patreon (8-12% fee, no monthly) + Mailchimp ($30-50/mo) + Later ($25/mo) + ManyChat ($15-45/mo) + Gumroad or Shopify for one-time sales ($0-39/mo) + Teachable ($39-149/mo for courses) = **$109-308/month in tools + 8-12% of sales**

### A producer on BeatStars gets:
- Beat marketplace with licensing
- Beat player with preview
- Basic producer page
- No course platform
- No preset/sample pack preview
- No email marketing
- No social scheduling
- No DM automation
- No coaching/services

**They pay:** BeatStars ($0-20/mo + sales fee) + Mailchimp ($30-50/mo) + Later ($25/mo) + ManyChat ($15-45/mo) + Teachable ($39-149/mo) + Gumroad for non-beat products ($0 + 10%) = **$109-289/month in tools + variable sales fees**

### A producer on PPR gets:
- 22+ product types (beats, courses, samples, presets, coaching, services, memberships, bundles, and more)
- 4-tier beat licensing with auto-generated contracts and exclusive auto-removal
- Individual sample preview with waveforms
- Course streaming with Mux video, free preview chapters, drip content
- Full email marketing (45+ templates, workflow builder, A/B testing, segmentation, analytics)
- Social media scheduling with AI content generation (100+ viral hooks, virality scoring, voice-over, image generation)
- DM automation with AI-powered comment-to-DM (keyword triggers, conversation context)
- Full storefront with marketplace discovery, 14 categories, link-in-bio
- Coaching platform with availability calendar
- Coupon system, credits system, analytics dashboard

**They pay:** $12-149/month (creator plan based on scale) + 10% of sales. That's it.

---

## Honest Gaps: Where Competitors Win

| Area | Competitor Advantage |
|---|---|
| **Payment methods** | Gumroad, Patreon, BeatStars all support PayPal + Apple Pay + Google Pay. PPR is credit cards only. This likely costs conversions. |
| **Store theming** | Linktree has 50+ templates. Patreon has better visual customization. PPR has one accent color. |
| **Social analytics** | Buffer/Later have polished post-performance dashboards. PPR links to native platform analytics. |
| **Refunds** | Gumroad and Patreon offer self-service refunds. PPR is manual/admin-only. |
| **Mobile app** | Gumroad, Patreon, and BeatStars have native mobile apps. PPR is web-only. |
| **Brand recognition** | Patreon and Gumroad have massive brand awareness. PPR is unknown to most producers. |
| **Community features** | Patreon has built-in community/comments. Discord integration exists on PPR but native community is limited. |
| **TikTok DM automation** | ManyChat fully supports TikTok. PPR has the framework but it's not fully active. |
| **Affiliate system** | Gumroad has active affiliate features. PPR's affiliate schema exists but isn't fully implemented. |
| **Tax handling** | Gumroad handles sales tax automatically. PPR's tax system is defined but not integrated into checkout. |

These gaps are real but addressable. The core platform advantage -- having everything in one place, purpose-built for music producers -- is genuine and significant.

# Zero to Product: The Complete Learner-to-Creator Journey

**Research Date:** 2026-02-24
**Scope:** Full codebase analysis of what exists, what's partially built, and what's missing for someone going from "I just make beats in my bedroom" to "I'm selling my first product."

---

## The Journey at a Glance

| Step | Name | Status |
|------|------|--------|
| 1 | Learn | Fully Built |
| 2 | Figure Out What to Sell | Missing |
| 3 | Create It | Fully Built |
| 4 | List It | Fully Built |
| 5 | Promote It | Fully Built |
| 6 | Get Discovered | Partially Built |

---

## Step 1: Learn

**Status: Fully Built**

### What's Built

**Course System** (`convex/courses.ts`, `convex/courseModules.ts`, `convex/courseLessons.ts`, `convex/courseChapters.ts`)
- Full course hierarchy: Course > Module > Lesson > Chapter
- Video integration (Mux), audio (generated TTS), text content
- Free preview chapters, follow-gated chapters, paid chapters
- Access control with 8 access types: purchased, bundle, membership, ppr_pro, free_preview, follow_gate, creator, admin (`convex/courseAccess.ts`)

**PPR Pro Membership** (`convex/pprPro.ts`, `components/ppr-pro-upsell.tsx`)
- $12/month (monthly) or $10.80/month (yearly at $129.60/year)
- Unlocks ALL published courses platform-wide (the key benefit)
- Stripe integration for subscriptions
- Upsell component with 4 variants: banner, inline, card, display
- `PprProBadge` component shows "PRO" badge next to subscriber names

**Progression System** (`convex/achievements.ts`, `convex/courseProgress.ts`)
- **XP & Levels:** `level = floor(totalXP / 100) + 1`
  - First course completion: 100 XP
  - 5 courses enrolled: 250 XP
  - First certificate: 100 XP
  - 7-day streak: 50 XP
- **Achievements/Badges:** 10+ achievement types with auto-unlock on progress targets
- **Completion Tracking:** Per-chapter progress with `isCompleted`, `completedAt`, `timeSpent`, `viewCount`, `bookmarked`
- **Aggregate Stats:** `getCourseProgress` returns totalChapters, completedChapters, completionPercentage, isComplete, hasCertificate, totalTimeSpent

**Certificates** (`convex/certificates.ts`, `app/verify/[certificateId]`)
- Auto-generated on 100% course completion
- Unique certificate ID format: `CERT-[timestamp]-[random]`
- 9-character verification code (ABC-123-XYZ) for easy sharing
- PDF generation with Convex file storage
- Public verification page at `/verify/[certificateId]`
- Tracks verification count and last verified date

**Dashboard Learn Mode** (`app/dashboard/components/LearnModeContent.tsx`)
- Enrolled courses with progress bars
- Certificates gallery
- Course recommendations
- Beat license library
- Referral card

### What's Partially Built

- **Leaderboards:** Infrastructure exists in `convex/leaderboards.ts` but integration is limited
- **Streaks:** Mentioned in achievement types but may lack full daily tracking UI
- **Course Recommendations:** Basic scoring engine exists (`convex/recommendations.ts`) using category similarity (+40 pts), skill progression (+30 pts), and new category discovery (+20 pts) - but no personalization beyond completed courses

### What's Missing

- Quiz system (mentioned in nudge contexts but no quiz table in schema)
- Skill-based learning paths (no guided "beginner to advanced" track)
- Social features (sharing progress, commenting on lessons)
- Peer cohorts or study groups

---

## Step 1.5: The Nudge (Learn to Create Transition)

**Status: Fully Built**

### What's Built

**Dashboard Mode Toggle** (`app/dashboard/components/ModeToggle.tsx`)
- Simple Learn <-> Create toggle stored in user profile as `dashboardPreference: "learn" | "create"`
- Persisted in Convex user record

**BecomeCreatorCard** (`components/dashboard/BecomeCreatorCard.tsx`)
- 10 context-aware nudge points that appear at milestone moments:

| Trigger | Headline |
|---------|----------|
| `course_completed` | "Course Completed! Ready to Create?" |
| `milestone_xp` | "Level X! You're Ready" |
| `quiz_passed` | "Quiz Master! Share Your Knowledge" |
| `certificate_earned` | "Certified & Ready to Teach!" |
| `enrollment_count` | "X Courses! You Love Learning" |
| `first_enrollment` | "Great Choice! You Could Teach This" |
| `lessons_milestone` | "5+ Lessons! You're On a Roll" |
| `expert_level` | "Expert Level X! Your Expertise is Valuable" |
| `creator_profile_views` | "Exploring Creators? Start Your Own Store!" |
| `leaderboard_visit` | "Level X Learner! Join Top Creators" |

- 5 card variants: `default` (full), `compact` (sidebar), `banner` (hero), `milestone` (inline), `celebration` (full-screen with confetti)
- Messaging emphasizes: 90% revenue share, free to start, no monthly fees, instant Stripe payouts

**Creator XP Track** (separate from learner XP, `convex/achievements.ts`)
- Different level formula: `creatorLevel = floor(sqrt(creatorXP / 100)) + 1`
- XP rewards: course_created (75), course_published (100), student_enrolled (15), chapter_completed (5), course_completed (30), revenue_milestone_100 (200), revenue_milestone_1000 (500)

### What's Missing

- No nudge after consuming specific content types (e.g., "You just took a mixing course - you could sell mixing templates")
- No personalized product suggestions based on learning history
- No "creators like you" social proof (e.g., "Sarah started just like you and earned $X in her first month")

---

## Step 2: Figure Out What to Sell

**Status: Missing**

### What's Built

Nothing directly addresses the "What should I sell?" problem. There are adjacent systems:

**AI Content Flywheel** (`convex/aiPlatform/contentFlywheel.ts`)
- Analyzes platform content to find gaps - but this is for platform admins, not creators
- Could theoretically be repurposed to suggest product ideas

**Feature Discovery** (`app/admin/feature-discovery/page.tsx`)
- AI that analyzes course content to discover what topics are being taught
- Admin-only, not creator-facing

**Recommendation Engine** (`convex/recommendations.ts`)
- Recommends courses to learners, not products for creators to make
- Scoring: category similarity, skill progression, new discovery

### What's Partially Built

**ProductAIAssistant** (`components/ai/ProductAIAssistant.tsx`)
- Generates marketing copy AFTER you know what to sell
- Available AI actions: generateProductDescription, generateSEO, generateSalesCopy, suggestTags, translateContent, rewriteInTone, generateBulletPoints, generateFAQ
- Useful once you have a product concept, but doesn't help you find the concept

### What's Missing (Critical Gap)

1. **No "What Should I Create?" AI** - Nothing that says "Based on your skills in Ableton and your completed mixing courses, you should consider selling mixing templates"
2. **No Creator Skill Profile** - System doesn't capture what someone is good at beyond what courses they've taken
3. **No Market Gap Analysis for Creators** - Could analyze: "Only 3 people sell Serum presets for Future Bass, but 500 people searched for it"
4. **No Trending Product Analysis** - No data on what's selling, what's growing, what niches are underserved
5. **No Audience Interest Signals** - Can't tell a creator "Your followers are mostly interested in mixing and mastering"
6. **No First Product Wizard** - No guided flow that says "Let's figure out what you should sell" before jumping into product creation

**This is the biggest gap in the journey.** A producer who doesn't know they could sell a preset pack, a cheat sheet, or a 1:1 coaching session will bounce at this step.

---

## Step 3: Create It

**Status: Fully Built**

### What's Built

**25+ Product Types with Guided Wizards** (`app/dashboard/create/`)

Each product type has its own multi-step creation flow:

| Category | Product Types | Steps | Complexity |
|----------|--------------|-------|------------|
| **Easiest** | Tip Jar | 2 | Title + description only |
| **Easy** | Cheat Sheet, Donation | 2-3 | + 1 PDF upload |
| **Standard** | Sample Pack, Preset Pack, MIDI Pack, PDF/Guide, Template, Blog Post | 3-4 | + file uploads + pricing |
| **Moderate** | Beat Lease, Effect Chain, Mixing Template, Project Files | 4 | + DAW specifics + tiers |
| **Complex** | Coaching, Mixing/Mastering Service, Workshop | 4 | + availability + scheduling |
| **Advanced** | Course (full lesson builder), Membership (tiered), Bundle | 4+ | Multi-part content |

**Minimum Fields for ANY Product:**
```
Required: title (3+ chars), description (10+ chars), price (number, even if 0)
Auto-filled: slug, storeId, userId, createdAt, isPublished
Optional: imageUrl, tags, productCategory
```

**AI Assistance During Creation** (`app/dashboard/create/shared/AIContentAssistant.tsx`)
- Generate description from title
- Generate tags/keywords
- Generate thumbnail image
- Available in all product creation wizards

**Shared Components Across All Wizards:**
- `ImageUploader.tsx` - Image upload with validation
- `FileUploader.tsx` - File management
- `StepProgress.tsx` - Visual step indicator
- `PricingModelSelector.tsx` - Free vs paid toggle
- `FollowGateConfigStep.tsx` - Social follow requirements

**Simplest Possible First Product: Tip Jar**
1. Enter title (e.g., "Support My Music")
2. Enter description (e.g., "Buy me a coffee while I make beats")
3. Publish

That's it. No files, no pricing tiers, no configuration. Live in under 2 minutes.

**Second Simplest: Cheat Sheet**
1. Enter title + description
2. Upload 1 PDF
3. Set as free with follow gate (collect emails)
4. Publish

### What's Missing

- No "recommended first product" guidance (the wizard doesn't say "start here")
- No product templates (pre-filled examples they can customize)
- No product quality checklist (e.g., "Your description could be stronger - try the AI assistant")

---

## Step 4: List It

**Status: Fully Built**

### What's Built

**One-Click Creator Setup** (`components/dashboard/one-click-creator-setup.tsx`)
- 3-step flow: Confirm > Customize (optional) > Success (with confetti)
- Auto-generates store from user profile: name, slug, avatar, bio, social links
- Sets `isPublic: true` and `isPublishedProfile: true` immediately
- Records analytics event: `creator_started`

**Alternative: Full Store Wizard** (`components/dashboard/store-setup-wizard-enhanced.tsx`)
- 5 steps: Welcome > Store Info > Branding > First Product > Success
- Manual entry of store name, description, logo

**Storefront** (`app/[slug]/`)
- Immediately live at `/{slug}` (e.g., pauseplayrepeat.com/john-smith)
- Custom domain support (paid plans)
- Banner image, logo, bio, tagline, accent color
- Genre tags, social links
- Product grid with sort and filter
- Featured product spotlight

**Creator Plan Tiers** (`convex/creatorPlans.ts`)

| Plan | Price | Products | Can Charge Money | Email Sends | Key Features |
|------|-------|----------|-----------------|-------------|--------------|
| **Free** | $0 | 1 | No | 0 | Link-in-bio storefront, public profile, basic analytics |
| **Starter** | $12/mo | 15 | Yes | 500/mo | Follow gates, email campaigns, coaching (20 sessions) |
| **Creator** | $29/mo | 50 | Yes | 2,500/mo | Unlimited coaching, advanced analytics, automations |
| **Creator Pro** | $79/mo | Unlimited | Yes | 10,000/mo | Custom domain, automation workflows, priority support |
| **Business** | $149/mo | Unlimited | Yes | 50,000/mo | Teams (10 members), white-label, dedicated support |

**Gating System:**
- `ProductLimitGate` - Enforces product count per plan
- `PaidProductGate` - Free plan users can only create free products; shows "Upgrade to Starter ($12/mo) to start charging"
- `useFeatureAccess` hook - Checks feature access by plan

**Stripe Connect for Payments** (`app/api/stripe/connect/`)
1. Create Stripe Connect account (1 click)
2. Complete Stripe onboarding (external Stripe form: bank, tax, identity)
3. Account status check: pending > enabled
4. Revenue split: 90% to creator, 10% platform fee (+ Stripe processing ~2.9% + $0.30)
5. Minimum payout: $25, 2-3 business days

### What's Partially Built

- Store customization has many fields but no guided "make your store look great" flow

### What's Missing

- No "preview your store" before publishing
- No store score/completeness indicator (e.g., "Your store is 60% complete - add a banner image")
- No comparison to successful stores ("Stores with banners get 3x more clicks")

---

## Step 5: Promote It

**Status: Fully Built**

### What's Built

**AI Social Media Content Engine** (`convex/masterAI/socialMediaGenerator.ts`, `app/dashboard/social/create/`)

6-step content creation pipeline:
1. **Content Selection** - Choose source: course chapter, custom text, product description
2. **Platform Scripts** - AI generates 4 unique scripts optimized for:
   - TikTok (15-60s, fast hooks)
   - YouTube Shorts (30-60s, educational)
   - Instagram Reels (15-90s, aesthetic)
   - YouTube Long-form (8-15 min deep-dive)
3. **Combined Script** - Merges into single voiceover script
4. **Image Generation** - AI creates 5-10 Excalidraw-style educational illustrations via FAL.ai
5. **Audio Generation** - Text-to-speech voiceover via ElevenLabs
6. **Review** - Preview all assets before publishing

**Result:** From one piece of content, creator gets 4 ready-to-post video scripts + images + voiceover + captions + hashtags in ~10 minutes.

**Social Media Scheduling** (`components/social-media/social-scheduler.tsx`)
- Connect accounts: Instagram, Facebook, Twitter/X, LinkedIn, TikTok
- Schedule posts for future dates
- Draft/scheduled/published status tracking
- Multiple account management per store

**Instagram DM Automation** (`convex/socialDM.ts`, `convex/socialDMWebhooks.ts`)
- Auto-responses to DM keywords
- Webhook-based real-time trigger handling
- Per-store configuration

**Email Marketing** (`convex/emailCampaigns.ts`, `convex/emailWorkflows.ts`, `convex/emailTemplates.ts`)
- Full campaign system: create, schedule, send, track (opens/clicks)
- Pre-built templates including "Sample Pack Launch" with proven copy
- Visual workflow builder (node-based, like Mailchimp automations):
  - Triggers, email sends, delays, conditions, actions, course cycle nodes, split testing
- Drip campaigns for automated nurture sequences
- Contact management with import, segmentation, lead scoring
- Deliverability monitoring (bounce tracking, spam scoring)

**AI Email Copy** (`convex/emailCopyGenerator.ts`)
- Generates email copy from product context
- Product-aware (uses title, description, features)

**Landing Page Copy Generation** (`convex/contentGeneration.ts`)
- AI generates: headlines, benefits (4-6), audience descriptions (4-5), learning outcomes (6-8), transformation statement, urgency statements
- Conversational tone, avoids marketing buzzwords

**AI Tech Stack:**
| Service | Purpose |
|---------|---------|
| OpenAI GPT-4o | Script generation, copy writing |
| FAL.ai (Nano Banana Pro) | Image generation |
| ElevenLabs | Text-to-speech voiceover |
| Gemini 2.5 Flash | Fast captions/hashtags |

### What's Partially Built

- Social scheduling exists but actual API posting may require manual copy/paste for some platforms
- Email workflow builder is comprehensive but complex for first-time users

### What's Missing

- No "launch checklist" (e.g., "Before you launch: 1. Create 3 social posts, 2. Set up a launch email, 3. Schedule for Tuesday at 10am")
- No auto-generated launch campaign that bundles social + email + DMs into one coordinated release
- No content calendar with AI suggestions for posting cadence
- No competitor content analysis

---

## Step 6: Get Discovered

**Status: Partially Built**

### What's Built

**Creator Directory** (`app/marketplace/creators/page.tsx`)
- All creators with `isPublic: true` appear automatically from day 1
- Zero approval process, zero content required
- Shows: avatar, name, bio, product count, course count, student count, categories, social links

**Marketplace Browsing** (`convex/marketplace.ts`)
- Products browsable by category across 14+ marketplace sections
- Sort options: newest (default), popular, price-low, price-high
- "Newest" sort means new creators get immediate visibility
- Search by title across all products

**SEO & Indexing** (`app/sitemap.ts`)
- Products auto-added to sitemap within 24 hours (revalidate: 86400)
- Product pages: priority 0.6, storefronts: priority 0.7
- OpenGraph + Twitter Card metadata auto-generated for all products
- Schema.org Product structured data (name, description, price, availability)
- Canonical URLs on all pages

**Creator Spotlight** (`convex/marketplace.ts` - `getCreatorSpotlight`)
- 1 featured creator on marketplace homepage
- Currently rotates by highest product count (favors established creators)

**Featured Content** (`convex/marketplace.ts` - `getFeaturedContent`)
- Random shuffle of latest courses/products displayed on marketplace homepage

**Affiliate System** (`convex/affiliates.ts`)
- Commission-based promotion tracking
- Creators can recruit affiliates to promote their products

**Bundles** (`convex/bundles.ts`)
- Creators can bundle their own products for discounts
- Single-creator only (no cross-creator bundles)

**Creator Pipeline Analytics** (`convex/analytics/creatorPipeline.ts`)
- Tracks creator journey: prospect > invited > signed_up > drafting > published > first_sale > active > churn_risk
- Admin visibility into where creators drop off

### What's Missing (Critical Discovery Gaps)

1. **No "New Creator Spotlight"** - The spotlight favors established creators by product count. New creators with 1 product will never be featured.

2. **No "New This Week" Section** - No dedicated marketplace section highlighting products published in the last 7 days.

3. **No Trending/Velocity Algorithm** - No scoring based on recent download velocity, views, or purchases. A product gaining traction fast gets no boost.

4. **No Platform Email Blasts for New Products** - The 50k email subscribers and 100k social followers are NOT automatically exposed to new creator products. Creators must build their own audience from scratch or manually set up campaigns.

5. **No "New Creator" Badge** - No visual indicator for creators in their first 30 days. No visual urgency to check them out.

6. **No Cross-Creator Bundles** - Can't team up with another creator for a joint product. Bundles are single-store only.

7. **No Cold-Start Recommendations** - Recommendation engine only works for users with course history. Brand new users see nothing personalized.

8. **No Platform-Curated Collections** - No admin-curated "Staff Picks," "Rising Stars," or themed collections.

9. **No Follow/Notification System for New Products** - Users can't follow a creator and get notified when they drop something new.

---

## The Complete Journey: What a Bedroom Producer Actually Experiences

### The Good Path (everything works)

1. **Signs up** for PPR Academy, takes a mixing course (free or PPR Pro)
2. **Completes 5 lessons** -> BecomeCreatorCard appears: "5+ Lessons! You're On a Roll"
3. **Finishes course** -> Celebration card with confetti: "Course Completed! Ready to Create?"
4. **Clicks "Become Creator"** -> One-click store creation, live in 30 seconds
5. **Creates a Tip Jar** (2 steps, free plan) -> First product live
6. **Upgrades to Starter ($12/mo)** -> Can now charge money
7. **Creates a cheat sheet PDF** -> Uses AI to generate description and tags
8. **Uses content engine** -> Gets 4 social media scripts + images + voiceover from their cheat sheet content
9. **Posts to Instagram/TikTok** -> Drives traffic to their store
10. **Appears in marketplace** -> Found via category browsing and "newest" sort
11. **Gets first sale** -> 90% revenue, Stripe payout in 2-3 days

### Where People Fall Off

| Drop-off Point | Why | Impact |
|----------------|-----|--------|
| After Step 1 (learning) | Don't know they CAN sell | Nudge system addresses this |
| **After Step 2 (what to sell)** | **Don't know WHAT to sell** | **No system addresses this** |
| After Step 3 (creation) | Product creation feels complex | Tip Jar is 2 steps, but they don't know that |
| After Step 4 (listing) | Free plan limits (1 product, can't charge) | $12/mo Starter unlocks charging |
| After Step 5 (promoting) | Don't know how to market | Content engine exists but may feel overwhelming |
| After Step 6 (discovery) | No sales, no traffic from platform | Platform discovery is weak for new creators |

---

## Priority Recommendations

### Must Build (Critical Path Gaps)

1. **"What Should I Sell?" AI Wizard** - Analyzes learner profile (courses taken, skills, interests) and suggests 3 specific product ideas with reasoning. "You completed 3 mixing courses - here's why a Mixing Template would be your best first product."

2. **Recommended First Product Flow** - After becoming a creator, instead of showing 25 product types, show: "Most creators start with one of these" -> Cheat Sheet (easiest to create), Preset Pack (music producers love these), Tip Jar (zero effort, start collecting support).

3. **New Creator Marketplace Boost** - "New This Week" section, "New Creator" badge for first 30 days, and algorithmic boost for products gaining early traction.

4. **Platform Email Exposure** - Auto-include new products in a weekly "New on PausePlayRepeat" email to the 50k subscriber base.

### Should Build (Engagement & Retention)

5. **Store Completeness Score** - "Your store is 60% ready. Add a banner image (+10%), connect Instagram (+10%), add a second product (+20%)."

6. **Launch Checklist** - Coordinated launch flow: "Before you launch: create 3 social posts, write a launch email, pick a launch date." One-click generates all assets.

7. **Product Templates** - Pre-filled product examples: "Here's what a successful cheat sheet looks like. Customize it to make it yours."

8. **Cross-Creator Bundles** - Let creators team up for joint products, exposing each to the other's audience.

---

## Key File Reference

| Feature | Primary Files |
|---------|--------------|
| Course System | `convex/courses.ts`, `convex/courseAccess.ts`, `convex/courseProgress.ts` |
| PPR Pro | `convex/pprPro.ts`, `components/ppr-pro-upsell.tsx` |
| Gamification | `convex/achievements.ts`, `convex/certificates.ts` |
| Creator Nudge | `components/dashboard/BecomeCreatorCard.tsx` |
| Mode Toggle | `app/dashboard/components/ModeToggle.tsx` |
| Product Creation | `app/dashboard/create/` (25+ subdirectories) |
| AI Content Assistant | `app/dashboard/create/shared/AIContentAssistant.tsx`, `components/ai/ProductAIAssistant.tsx` |
| Creator Onboarding | `components/dashboard/one-click-creator-setup.tsx`, `convex/stores.ts` |
| Creator Plans | `convex/creatorPlans.ts`, `app/dashboard/create/shared/PaidProductGate.tsx` |
| Stripe Connect | `app/api/stripe/connect/`, `app/dashboard/settings/payouts/` |
| Social Content Engine | `convex/masterAI/socialMediaGenerator.ts`, `app/dashboard/social/create/` |
| Email Marketing | `convex/emailCampaigns.ts`, `convex/emailWorkflows.ts`, `convex/emailTemplates.ts` |
| Marketplace | `convex/marketplace.ts`, `app/marketplace/` |
| Creator Directory | `app/marketplace/creators/page.tsx` |
| SEO/Sitemap | `app/sitemap.ts`, product `layout.tsx` files |
| Recommendations | `convex/recommendations.ts` |
| Creator Pipeline | `convex/analytics/creatorPipeline.ts` |
| Affiliates | `convex/affiliates.ts` |
| Content Flywheel | `convex/aiPlatform/contentFlywheel.ts` |

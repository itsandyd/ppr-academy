# PPR Academy — Platform Sides Analysis

> Generated 2026-02-18 by auditing the codebase directly. File paths are relative to project root.

---

## Side 1: Consumer / Learner Side

### What can a regular user (music producer) do?

A free user who signs up via Clerk can:

- **Browse the marketplace** — courses, beats, samples, preset packs, mixing templates, Ableton racks, project files, coaching services, bundles, plugins, and creator profiles (`app/marketplace/`)
- **Preview content** — free chapters of courses, audio previews of samples/beats
- **Enroll in free courses** — some courses are free, optionally gated behind an email/follow requirement (`followGateEnabled` on courses)
- **Purchase individual courses** — one-time payments via Stripe checkout (`app/courses/[slug]/checkout/`)
- **Purchase digital products** — beats, sample packs, preset packs, mixing templates, Ableton racks, project files (`app/api/webhooks/stripe/route.ts` handles 10+ purchase types)
- **Book coaching sessions** — one-time purchase for coaching products (`app/api/coaching/create-checkout-session/`)
- **Track learning progress** — chapter-by-chapter progress, completion certificates (`convex/courseProgress.ts`, `convex/certificates.ts`)
- **Earn XP and achievements** — gamification system with levels, badges, streaks (`convex/achievements.ts`, `convex/leaderboards.ts`, `userXP` table in schema)
- **Follow creators** — artist follow system (`convex/artistFollows.ts`)
- **Leave course reviews** — ratings and reviews on courses (`courseReviews` table in schema)
- **Access a learner dashboard** — `(dashboard)/home` route group with progress tracking, playlists, submissions
- **Use AI chat** — AI-powered music production assistant (`app/api/ai/chat/`)
- **Browse creator storefronts** — each creator has a public page at `/{slug}` with their products

### Plans/Tiers for Consumers

| Tier | Cost | What You Get |
|------|------|-------------|
| **Free** | $0 | Browse marketplace, preview chapters, access free courses (some email-gated), community access, basic dashboard |
| **Individual Purchase** | ~$9/course (varies) | Lifetime access to one course, all chapters + resources, completion certificate |
| **PPR Pro Monthly** | $12/month | Access to ALL courses on the platform, new courses monthly, certificates, cancel anytime |
| **PPR Pro Yearly** | $108/year ($9/mo) | Same as monthly, ~25% savings |

### How Purchasing Works

**PPR Pro Subscription** (`convex/pprPro.ts`, `app/api/ppr-pro/create-checkout-session/route.ts`):
- Stripe subscription mode (recurring billing)
- Stored in `pprProPlans` and `pprProSubscriptions` tables
- Statuses: `active`, `trialing`, `cancelled`, `past_due`, `expired`
- Plans seeded as database records with `stripeProductId` / `stripePriceId`

**Individual Course Purchases** (`app/api/courses/create-checkout-session/route.ts`):
- Stripe one-time payment mode
- If course has a creator with Stripe Connect, payment routes through Connect with 10% platform fee
- On `checkout.session.completed` webhook → enrollment created in `purchases` table
- Metadata tracks: courseId, courseSlug, courseTitle, amount, currency

**Other Product Purchases** (beats, samples, coaching, etc.):
- Each product type has its own checkout session endpoint under `app/api/`
- All converge on the same Stripe webhook handler (`app/api/webhooks/stripe/route.ts`, ~1255 lines)
- Webhook discriminates purchase type via `metadata.type` field

**Credits System** (`convex/userCredits.ts`, `creditTransactions` table):
- Platform currency — users can buy credit packages
- Credits can be spent on certain products (samples, etc.)
- Tracked in `userCredits` (balance) and `creditTransactions` (history)

### Current Pricing (from code)

- PPR Pro Monthly: **$12/month** (1200 cents in `convex/pprPro.ts` `seedPlans`)
- PPR Pro Yearly: **$108/year** (10800 cents)
- Individual courses: **variable** — each course has its own price set by creator (example shown on pricing page: $9)

---

## Side 2: Creator Side

### Is There a Creator Role?

Yes. The `users` table in `convex/schema.ts` has these creator-specific fields:

```
isCreator: v.optional(v.boolean())
creatorSince: v.optional(v.number())     // timestamp
creatorLevel: v.optional(v.number())     // 1-10+
creatorXP: v.optional(v.number())        // experience points
creatorBadges: v.optional(v.array(v.string()))  // e.g. "first_store"
stripeConnectAccountId: v.optional(v.string())
stripeAccountStatus: v.optional(v.string())
stripeOnboardingComplete: v.optional(v.boolean())
```

A user becomes a creator implicitly when they create their first store/product. There's also a `BecomeCreatorCard` component (`components/dashboard/BecomeCreatorCard.tsx`) that nudges learners to become creators, and a `/for-creators` signup flow.

### What Can a Creator Do?

**Create and sell 13+ product types** via the dashboard creation wizards (`app/dashboard/create/`):

| Product Type | Route | Backend |
|-------------|-------|---------|
| Courses | `/dashboard/create/course` | `convex/courses.ts` |
| Beat leases | `/dashboard/create/beat-lease` | `convex/beatLeases.ts` |
| Sample packs | `/dashboard/create/pack` | `convex/samplePacks.ts` |
| Individual samples | `/dashboard/create/sample` | `convex/samples.ts` |
| Preset packs | `/dashboard/create/preset-pack` | `convex/presetPacks.ts` |
| Mixing templates | `/dashboard/create/mixing-template` | `convex/mixingTemplates.ts` |
| Mixing services | `/dashboard/create/mixing-service` | `convex/mixingServices.ts` |
| Coaching products | `/dashboard/create/coaching` | `convex/coachingProducts.ts` |
| Memberships | `/dashboard/create/membership` | `convex/memberships.ts` |
| Bundles | `/dashboard/create/bundle` | `convex/bundles.ts` |
| Digital products | `/dashboard/create/digital` | `convex/digitalProducts.ts` |
| Tip jar | `/dashboard/create/tip-jar` | universal products |
| Blog posts | `/dashboard/create/blog` | `convex/blogPosts.ts` |
| PDF lead magnets | `/dashboard/create/pdf` | landing pages |
| Cheat sheets | `/dashboard/create/cheat-sheet` | `convex/cheatSheets.ts` |
| Project files | `/dashboard/create/project-files` | `convex/projectFiles.ts` |
| Ableton racks | marketplace (via `convex/abletonRacks.ts`) | `convex/abletonRacks.ts` |

**Run email marketing** (`app/dashboard/emails/`):
- Email campaigns with segmentation
- Drip campaign sequences
- Automation workflows with triggers
- Contact management and tagging
- A/B testing
- Deliverability monitoring
- Requires Starter plan or above

**Manage social media** (`app/dashboard/social/`):
- Post scheduling and content calendar
- Multi-platform posting (Instagram, TikTok, Facebook, Twitter, LinkedIn)
- DM automation
- Content library
- Requires Creator plan or above

**Run a storefront** (`app/[slug]/`):
- Custom slug-based URL (e.g., `ppr.academy/creator-name`)
- Public bio, avatar, banner
- Product grid showcasing all their products
- Social links
- Custom pages (`app/[slug]/p/[pageSlug]`)
- Optional custom domain (Pro plan)

**Other creator tools**:
- Student management (`app/dashboard/students/`)
- Analytics dashboard (`app/dashboard/analytics/`, `components/dashboard/creator-dashboard-content.tsx`)
- Affiliate program setup (`app/dashboard/affiliates/`)
- Landing page builder (`app/dashboard/landing-pages/`)
- Direct messaging with students (`app/dashboard/messages/`)
- Coaching session management (`app/dashboard/coaching/`)
- Service order management (`app/dashboard/service-orders/`)
- Notes system (`app/dashboard/notes/`)
- Copyright management (`app/dashboard/copyright/`)
- Integration connections (`app/dashboard/integrations/`)
- Discord bot integration (`convex/discord.ts`)

### Revenue Split and Payments

**Stripe Connect integration** — fully implemented:

| File | Purpose |
|------|---------|
| `app/api/stripe/connect/create-account/route.ts` | Creates Express Connect account |
| `app/api/stripe/connect/onboarding-link/route.ts` | Returns Stripe onboarding URL |
| `app/api/stripe/connect/account-status/route.ts` | Checks account readiness |
| `app/api/payouts/request/route.ts` | Processes payout requests |
| `app/dashboard/settings/payouts/page.tsx` | Payout settings UI |
| `convex/monetizationUtils.ts` | Backend payout logic (~350+ lines) |

**Revenue split**:
- **Platform fee**: 10% of gross revenue
- **Stripe processing**: ~2.9% + $0.30 per transaction
- **Creator receives**: ~87% on a typical $100 sale ($100 − $10 platform − $2.90 Stripe)
- **Minimum payout**: $25 (2500 cents)

**Payout flow**:
1. Creator completes Stripe Connect onboarding (Express account)
2. Account verified: `chargesEnabled`, `payoutsEnabled`, `detailsSubmitted`
3. Earnings accumulate from product sales (tracked in `purchases` table)
4. Creator requests payout (or automatic schedule via `payoutSchedules` table)
5. Payout record created with status `processing`
6. `stripe.transfers.create()` sends funds to connected account
7. Related purchases marked `paidOut`, payout record → `completed`

### Creator Plans (Freemium for Creators)

Creators have their own separate subscription tiers (`convex/creatorPlans.ts`, `app/dashboard/pricing/page.tsx`):

| Plan | Monthly | Annual | Products | Email Sends | Key Features |
|------|---------|--------|----------|------------|--------------|
| **Free** | $0 | $0 | 1 | 0 | 5 links, basic analytics, platform branding, community support |
| **Starter** | $12/mo | $9/mo | 15 | 500/mo | 15 links, email campaigns, email support |
| **Creator** | $29/mo | $24/mo | 50 | 2,500/mo | 50 links, social scheduling, follow gates, no platform branding |
| **Pro** | $79/mo | $59/mo | Unlimited | 10,000/mo | Custom domain, email automations, API access |
| **Business** | $149/mo | $119/mo | Unlimited | Unlimited | Team collaboration (10 members), white-label, dedicated support |
| **Early Access** | $0 | $0 | Unlimited | Unlimited | Grandfathered — all features free until `earlyAccessExpiresAt` |

Checkout via `app/api/creator-plans/create-checkout/route.ts`. Billing portal via `app/api/creator-plans/billing-portal/route.ts`.

### Creator-Facing Database Tables

Key tables in `convex/schema.ts` and `convex/monetizationSchema.ts`:

- `stores` — creator storefronts (slug, bio, social links, visibility)
- `digitalProducts` — universal product catalog
- `purchases` — all purchase records with payout status
- `creatorEarnings` — earnings tracking per creator
- `creatorPayouts` (via `monetizationSchema.ts`) — payout records (gross, platformFee, processingFee, net, status)
- `payoutSchedules` — automatic payout scheduling (weekly/biweekly/monthly)
- `subscriptionPlans` — creator-defined subscription tiers (Basic/Pro/VIP)
- `creatorSubscriptionTiers` — membership tier definitions
- `userCreatorSubscriptions` — consumer subscriptions to individual creators
- `coupons` — discount codes (percentage or fixed)
- `affiliates` — affiliate referral tracking
- `bundles` — product bundles
- `refunds` — refund processing
- `creatorPipeline` — funnel analytics per creator
- `coachProfiles` — coaching service profiles

---

## How the Two Sides Connect

### Marketplace = Discovery Layer

Consumers browse the unified marketplace (`app/marketplace/`) which aggregates products from all creators:

- `/marketplace/courses` — all courses from all creators
- `/marketplace/creators` — directory of all creator profiles
- `/marketplace/beats` — all beats from all creators
- `/marketplace/samples` — all sample packs
- `/marketplace/preset-packs`, `/marketplace/mixing-templates`, `/marketplace/mixing-services`, etc.

Each marketplace page queries Convex for published products across all stores.

### Creator Storefronts = Direct Selling

Each creator also has a direct storefront at `/{slug}` with sub-routes for each product type:
- `/{slug}/courses/{courseSlug}`
- `/{slug}/beats/{beatSlug}`
- `/{slug}/bundles/{bundleSlug}`
- `/{slug}/memberships/{membershipSlug}`
- `/{slug}/coaching/{productId}`
- `/{slug}/products/{productSlug}`
- `/{slug}/tips/{tipSlug}`
- `/{slug}/p/{pageSlug}` (custom pages)

This is a full branded storefront — like a Gumroad/Patreon-style page within the platform.

### PPR Pro vs. Creator Content

**PPR Pro** ($12/mo or $108/yr) grants access to **all courses on the platform** — this includes courses created by any creator, not just platform-owned content.

Individual product purchases (beats, samples, coaching, etc.) are **separate** from PPR Pro — those are always one-time purchases regardless of subscription status.

Creator-specific memberships (`creatorSubscriptionTiers`) are a **separate** subscription — a consumer can subscribe to a specific creator's membership (Basic/Pro/VIP tiers) which unlocks that creator's gated content.

### Content Flow: Creator → Consumer

```
Creator creates product
    → Product stored in Convex (courses table, digitalProducts table, etc.)
    → Product appears on creator's storefront (/{slug}/...)
    → Product appears in marketplace (/marketplace/...)
    → Consumer discovers via marketplace browse or direct storefront link
    → Consumer purchases via Stripe checkout
        → 10% platform fee taken
        → Remaining ~90% allocated to creator's balance
        → Creator requests payout → Stripe Connect transfer
    → Consumer gets access (course enrollment, file download, etc.)
    → Progress/engagement tracked (courseProgress, certificates, etc.)
```

### The Dashboard Splits by Mode

The main dashboard (`app/dashboard/`) has a **mode toggle** between learning and creating:

- `LearnModeContent.tsx` — shows enrolled courses, progress, certificates, submissions
- `CreateModeContent.tsx` — shows products, sales, email campaigns, analytics, student management
- `DashboardSidebar.tsx` — navigation adapts based on mode

This is a single unified dashboard, not two separate apps. The sidebar shows different navigation items depending on whether the user is in "learn" or "create" mode.

---

## Current State Assessment

### What's Fully Built and Functional

| Area | Status | Evidence |
|------|--------|---------|
| **Consumer course browsing/purchase** | Fully functional | Complete checkout flow, webhook handling, enrollment tracking |
| **PPR Pro subscription** | Fully functional | Stripe subscription with monthly/yearly, seedPlans mutation, checkout + webhook |
| **Creator storefronts** | Fully functional | Dynamic `[slug]` routes with product sub-pages, full layout |
| **13+ product types** | Fully functional | Each has creation wizard, schema, backend functions, checkout flow |
| **Stripe Connect payouts** | Fully functional | Account creation, onboarding, status checks, transfer execution, payout history |
| **Creator plans (freemium)** | Fully functional | 5 tiers with feature gates, Stripe checkout, billing portal |
| **Revenue tracking** | Fully functional | 10% platform fee calculation, per-transaction fee tracking, payout records |
| **Marketplace** | Fully functional | 14+ marketplace categories, search/browse |
| **Course learning experience** | Fully functional | Chapter-by-chapter progress, video via Mux, certificates |
| **Gamification** | Fully functional | XP, levels, badges, achievements, streaks, leaderboards |
| **Email marketing** | Fully functional | Campaigns, drip sequences, automation workflows, A/B testing, contact management |
| **Social media management** | Largely functional | Multi-platform OAuth, scheduling, DM automation |
| **AI features** | Fully functional | Chat assistant, course outline generation, content generation |
| **Admin panel** | Fully functional | 50+ admin sections for platform management |
| **Analytics** | Fully functional | Creator pipeline, product views, revenue events, email deliverability |

### What's Partially Built or In-Progress

| Area | Status | Notes |
|------|--------|-------|
| **Creator onboarding nudges** | Implemented but expanding | `BecomeCreatorCard`, `userNudges` table — recent commits adding more trigger points |
| **Custom domains** | Implemented | DNS verification logic exists in `convex/customDomains.ts`, gated to Pro plan |
| **Affiliate system** | Implemented | `convex/affiliates.ts` exists, dashboard route at `/dashboard/affiliates/` |
| **Discord integration** | Implemented | Bot setup, auto-join on purchase, community tracking |
| **Desktop app** | In progress | `/desktop` directory with Electron-based sample browser |
| **Video generation (Remotion)** | Implemented | `/remotion` directory, video script generation, illustration pipeline |

### What's Stubbed/Minimal

| Area | Status | Notes |
|------|--------|-------|
| **Team collaboration** | Planned (Business plan feature) | Listed in pricing but no visible team management UI found |
| **White-label** | Planned (Business plan feature) | Listed in pricing, no implementation found |
| **API access for creators** | Planned (Pro plan feature) | Listed in pricing, no public API docs or keys system found |

### Feature Flags

No traditional feature flag system was found (no `featureFlag` table, no `NEXT_PUBLIC_ENABLE_*` env vars). Feature gating is done through:

1. **Creator plan tier checks** — features locked behind plan level (e.g., custom domain requires Pro)
2. **`isCreator` boolean** — hides/shows creator dashboard content
3. **`isAdmin` check** — admin panel access (`convex/users.ts` `checkIsAdmin` function)
4. **`earlyAccessExpiresAt`** — grandfathered early access creators get everything free

### Role/Permission System

Roles are implicit, not explicit RBAC:
- **Regular user**: has a `users` record, `isCreator` is `false` or unset
- **Creator**: `isCreator: true`, has a `stores` record
- **Admin**: checked via `checkIsAdmin()` function in `convex/users.ts` — likely checks a hardcoded list or Clerk metadata
- **No formal "role" field** — permissions derived from user state (isCreator, plan tier, admin check)

### Percentage Estimate: Creator Side Completeness

**~90% built.** The core creator economy is fully implemented:
- Product creation (13+ types) ✓
- Storefront system ✓
- Stripe Connect payouts ✓
- Creator plans with feature gating ✓
- Email marketing suite ✓
- Analytics pipeline ✓
- Social media management ✓
- Marketplace integration ✓

The remaining ~10% is aspirational features listed in pricing but not yet built (team collaboration, white-label, public API), plus ongoing polish on onboarding nudges and the desktop sample browser.

---

## Key File Reference

| What | Where |
|------|-------|
| Database schema (all tables) | `convex/schema.ts` (~5000 lines) |
| Monetization schema | `convex/monetizationSchema.ts` |
| PPR Pro subscription logic | `convex/pprPro.ts` |
| Creator plans and limits | `convex/creatorPlans.ts` |
| Access control (who can view what) | `convex/accessControl.ts` |
| Payout logic | `convex/monetizationUtils.ts` |
| Stripe webhook handler | `app/api/webhooks/stripe/route.ts` |
| PPR Pro checkout | `app/api/ppr-pro/create-checkout-session/route.ts` |
| Course checkout | `app/api/courses/create-checkout-session/route.ts` |
| Stripe Connect setup | `app/api/stripe/connect/` |
| Payout request | `app/api/payouts/request/route.ts` |
| Creator storefront pages | `app/[slug]/` |
| Marketplace pages | `app/marketplace/` |
| Dashboard (learn + create modes) | `app/dashboard/`, `app/(dashboard)/` |
| Admin panel | `app/admin/` |
| Pricing page (consumer) | `app/pricing/page.tsx` |
| Pricing page (creator plans) | `app/dashboard/pricing/page.tsx` |
| Store backend | `convex/stores.ts` |
| Course backend | `convex/courses.ts` |
| Email campaigns | `convex/emailCampaigns.ts` |
| Achievements/gamification | `convex/achievements.ts`, `convex/leaderboards.ts` |

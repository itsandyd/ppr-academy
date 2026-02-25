# PPR Memberships vs. Patreon: Comprehensive Research

> Research date: February 2026
> Status key: **BUILT** = fully implemented | **PARTIAL** = exists but incomplete | **MISSING** = not yet built

---

## 1. The Membership System

### Schema & Data Model

The membership system lives across three core Convex tables:

**`creatorSubscriptionTiers`** - Defines what a creator is selling
| Field | Type | Purpose |
|---|---|---|
| `tierName` | string | Custom name (e.g., "Producer Pro") |
| `description` | string | Tier description |
| `priceMonthly` | number | Required monthly price |
| `priceYearly` | number (optional) | Yearly price with implied discount |
| `benefits` | string[] | Array of benefit descriptions |
| `maxCourses` | number (optional) | null = unlimited access to all content |
| `trialDays` | number (optional) | Free trial period (0-30 days) |
| `isActive` | boolean | Published or draft |
| `subscriberCount` | number | Cached count for marketplace display |
| `stripePriceIdMonthly` | string | Stripe recurring price ID |
| `stripePriceIdYearly` | string (optional) | Stripe yearly price ID |

**`userCreatorSubscriptions`** - Tracks who subscribes to what
| Field | Type | Purpose |
|---|---|---|
| `userId` | string | Subscriber's Clerk ID |
| `creatorId` | string | Creator being subscribed to |
| `tierId` | reference | Which tier they're on |
| `status` | enum | `active`, `canceled`, `past_due`, `paused` |
| `stripeSubscriptionId` | string | Links to Stripe for webhook updates |
| `currentPeriodStart/End` | number | Billing period timestamps |
| `cancelAtPeriodEnd` | boolean | Soft cancel (access until period ends) |

**`contentAccess`** - Links tiers to specific content
| Field | Type | Purpose |
|---|---|---|
| `resourceId` | string | Course ID or product ID |
| `resourceType` | enum | `course`, `product`, `coaching` |
| `accessType` | enum | `free`, `purchase`, `subscription` |
| `requiredTierId` | reference (optional) | Which tier grants access |

Key files:
- `convex/memberships.ts` - All mutations and queries
- `convex/schema.ts` (lines 1908-2002) - Table definitions
- `convex/accessControl.ts` - Permission checking logic

### Can creators create custom tiers with custom pricing?

**BUILT.** Creators have a full multi-step creation flow at `/dashboard/create/membership`:

1. **Basics** - Custom name, description, benefits list, thumbnail (with AI image generation)
2. **Pricing** - Monthly price (required), yearly price (optional, shows savings %), free trial days (0-30)
3. **Content** - Toggle "Include All Content" or hand-pick specific courses and products

No predefined tier levels. Creators set whatever names and prices they want. Unlimited tiers per store.

### What can be bundled into a membership?

**BUILT:**
- Courses (full course access including all lessons/chapters)
- Digital products (sample packs, presets, MIDI packs, project files, Ableton racks, etc.)

**Two bundling modes:**
- **All Content** (`maxCourses = null`): Members get everything in the store, including future releases
- **Selective**: Creator hand-picks which courses and products are included

**PARTIAL:**
- Coaching sessions: Schema supports `resourceType: "coaching"` but no UI for bundling coaching into tiers yet
- Community access: Not explicitly tracked as a membership benefit (no community table)
- Downloads: Included as digital products, not a separate concept

### Is there tiered access?

**BUILT, but not cascading.** Each tier is independent. A $5 tier and a $15 tier have separately configured content. There is no automatic inheritance where the $15 tier includes everything from $5 plus more.

- Users can only hold ONE active subscription per creator at a time (enforced in code)
- Switching tiers requires canceling the current one and subscribing to a new one
- No built-in upgrade/downgrade proration flow

**Honest assessment:** Patreon has cascading tiers natively (higher tiers unlock everything from lower tiers). PPR requires creators to manually duplicate content access across tiers if they want this behavior. This is a gap.

### How does recurring billing work?

**BUILT.** Uses Stripe Checkout in `subscription` mode via Stripe Connect:

1. User clicks "Subscribe" on membership detail page
2. Backend creates Stripe Checkout session with `mode: "subscription"`
3. Stripe handles recurring billing (monthly or yearly)
4. Webhooks update subscription status on renewal, failure, or cancellation
5. Trial periods supported natively through Stripe's `trial_period_days`

---

## 2. What Patreon Can't Do (That PPR Can)

### Can members also make one-time purchases?

**BUILT.** This is a fundamental architectural advantage.

PPR has completely separate checkout flows for:
- Memberships: `app/api/memberships/create-checkout-session/route.ts` (subscription mode)
- Courses: `app/api/courses/create-checkout-session/route.ts` (payment mode)
- Products: `app/api/products/create-checkout-session/route.ts` (payment mode)
- Bundles: `app/api/bundles/create-checkout-session/route.ts` (payment mode)
- Tips: `app/api/tips/create-checkout-session/route.ts` (payment mode)

A user can be subscribed to a $15/month membership AND buy a $50 one-time beat lease on the same store. Both purchases are tracked separately. Both generate creator earnings.

**Patreon cannot do this.** On Patreon, if someone wants one preset pack, they must subscribe to an entire tier. This forces an all-or-nothing model that doesn't work for music producers who sell individual products.

### Can creators sell licensing tiers on beats?

**BUILT.** Comprehensive beat licensing system:

| License Tier | Features |
|---|---|
| Basic | MP3/WAV, limited distribution & streaming, credit required |
| Premium | MP3/WAV/stems, higher limits, commercial use allowed |
| Exclusive | Full stems + trackouts, unlimited use, no credit required, beat becomes unavailable to others |
| Unlimited | Everything, maximum distribution |

Each tier has configurable:
- Price per tier
- Distribution limit (number of copies)
- Streaming limit
- Commercial use (boolean)
- Music video use (boolean)
- Radio broadcasting (boolean)
- Stems included (boolean)
- Credit required (boolean)

License contracts are generated with buyer & producer info. Exclusive purchases mark the beat as unavailable globally.

**Both members and non-members can purchase beats.** Membership doesn't gate beat licensing - it's a separate product type with its own checkout.

**Patreon has nothing like this.** Beat licensing is a music-industry-specific feature that Patreon has no concept of.

### Can members preview samples before downloading?

**BUILT.** Digital products support `demoAudioUrl` for 30-second preview audio. Ableton racks include `chainImageUrl` and `macroScreenshotUrls[]` for visual previews.

**Honest assessment:** The preview system is functional but basic. There is no waveform player, no per-sample preview within a pack, and no "listen before you subscribe" player embedded in membership tier descriptions. A producer browsing a sample pack can hear the demo, but can't audition individual loops within it.

### Can creators run email sequences for members specifically?

**BUILT.** The email system is extensive (30+ files):

- **Drip campaigns**: Multi-step sequences with configurable delays between steps
- **Workflow automations**: Visual workflow builder with trigger nodes, email nodes, delay nodes, condition nodes, and split (A/B) nodes
- **6 trigger types**: lead_signup, product_purchase, tag_added, custom_event, page_visit, manual
- **Segmentation**: Two systems - store-level segments and global behavioral segments
- **40+ merge tags**: `{{firstName}}`, `{{coursesCompleted}}`, `{{level}}`, `{{xp}}`, `{{totalSpent}}`, etc.
- **A/B testing**: Subject lines, content, send times
- **AI-powered copy generation**: Uses Claude for email writing assistance
- **Analytics**: Opens, clicks, deliverability, bounce management, spam scoring

**Honest gap:** There is no direct "target membership tier X" segment filter in the UI. Creators could achieve this through tags (tag members on signup) but there's no native "send to all Gold tier members" button. This is achievable with the existing segmentation system but requires manual setup.

**Patreon cannot do any of this.** Patreon creators pay for Mailchimp ($11-350/month), ConvertKit ($29-79/month), or similar tools. PPR includes it all.

### Membership + storefront combination?

**BUILT.** The `contentAccess` table explicitly controls whether each product/course is:
- `free` - Anyone can access
- `purchase` - One-time payment required
- `subscription` - Active membership tier required

A creator's storefront at `/{slug}` displays all their products. Some are purchasable by anyone, some require a membership. Members see "Included in your membership" while non-members see "Subscribe to access" or a purchase price.

**Patreon's model is subscription-only.** There's no storefront, no one-time purchases, no public products alongside gated ones.

---

## 3. The Migration Pitch

### If a Patreon creator wanted to move to PPR, what's the process?

**Step 1: Set up store** - Creator creates a store with custom slug, branding, accent color, and social links (supports 15+ platforms including Spotify, SoundCloud, Bandcamp, etc.)

**Step 2: Replicate tiers** - Create equivalent membership tiers with same names, pricing, and benefits. PPR supports:
- Custom tier names (matches Patreon)
- Monthly and yearly pricing (Patreon only does monthly or annual)
- Free trials (Patreon doesn't offer trial periods)
- Custom benefit lists (matches Patreon)

**Step 3: Upload content** - Migrate courses, products, downloads to PPR. Unlike Patreon (which is just posts in a feed), PPR organizes content as structured courses with chapters/lessons and digital products with proper metadata.

**Step 4: Connect Stripe** - Create Stripe Connect Express account through onboarding flow. Requires government ID, bank account, and tax info. Verification takes 1-2 business days.

### Can they import subscribers?

**MISSING.** There is no subscriber import system. People would need to re-subscribe.

**Honest assessment:** This is the hardest part of any Patreon migration. There's no API integration with Patreon to pull subscriber lists. Creators would need to:
1. Announce the move to their Patreon audience
2. Set up equivalent tiers on PPR
3. Direct subscribers to re-subscribe on PPR
4. Optionally run both platforms during transition

The email marketing system could help here - creators could import their Patreon subscriber email list as email contacts and run a migration campaign with the drip sequence tools. But the actual subscription (billing) would need to be re-created.

### What does a PPR membership page look like vs. Patreon?

**PPR storefront:**
- Full branded storefront at `/{slug}` with creator profile, social links, accent color
- Products displayed in filterable grid (category, price range, search)
- Membership tiers shown with pricing comparison, benefits lists, content counts
- Individual product detail pages with descriptions, previews, licensing info
- Marketplace discovery at `/marketplace/memberships` with search and browse

**Patreon page:**
- Feed-based layout (posts in chronological order)
- Tier sidebar with benefits
- No product grid, no filtering, no search within creator's content
- No individual product pages
- Limited customization

**PPR advantage:** It's a real storefront, not a content feed. Music producers sell products, not posts. PPR's layout reflects that.

**Patreon advantage:** Patreon has established brand trust, mobile app, and social discovery features that PPR doesn't match yet. Patreon's community/comments on posts is more mature.

---

## 4. Fees & Revenue

### Fee structure comparison

| | PPR | Patreon Lite | Patreon Pro | Patreon Premium |
|---|---|---|---|---|
| Platform fee | 10% | 5% | 8% | 12% |
| Payment processing | 2.9% + $0.30 | 2.9% + $0.30 | 2.9% + $0.30 | 2.9% + $0.30 |
| Total on $50 sale | $8.65 (17.3%) | $5.80 (11.6%) | $7.15 (14.3%) | $9.15 (18.3%) |
| Total on $10 sale | $1.59 (15.9%) | $1.09 (10.9%) | $1.39 (13.9%) | $1.79 (17.9%) |

**On platform fee alone, PPR (10%) sits between Patreon Pro (8%) and Patreon Premium (12%).**

However, Patreon Pro/Premium charge higher fees for features that PPR includes at the base 10%:
- Patreon Pro ($8%) does NOT include: email marketing, analytics dashboard, social scheduling
- Patreon Premium ($12%) adds: team management, priority support

PPR's 10% includes everything: email marketing, analytics, AI tools, social scheduling, course platform, beat licensing, certificates, landing pages.

**Special case: Tips have 0% platform fee** - 100% goes to the creator (minus Stripe processing).

### How payouts work

**BUILT.** Via Stripe Connect Express transfers:

1. Creator requests payout from dashboard
2. Minimum payout: $25
3. System calculates: gross revenue - 10% platform fee - 2.9% + $0.30 Stripe fee = net
4. Stripe transfer created to creator's connected account
5. Payout status tracked: `pending` → `processing` → `completed`

Example breakdown displayed to creators:
```
Sale Price:           $50.00
Platform Fee (10%):   -$5.00
Stripe Fee (2.9%):    -$1.76
                      ──────
Creator Receives:     $43.24
```

### Additional fees

No hidden fees. The 10% + Stripe processing is the complete cost. No setup fees, no monthly platform fee, no per-subscriber charges.

---

## 5. Built-in Tools That Patreon Charges Extra For

### Email Marketing

**Status: BUILT**

What's included:
- Broadcast campaigns to subscriber lists
- Drip sequences (multi-step automated emails)
- Visual workflow builder (triggers, delays, conditions, A/B splits)
- Audience segmentation (behavioral + tag-based)
- Lead scoring
- A/B testing (subject lines, content, send times)
- 40+ personalization merge tags
- AI-powered email copy generation
- Analytics (opens, clicks, deliverability, spam scoring)
- Unsubscribe management (GDPR/CAN-SPAM compliant)
- Bounce handling and suppression lists
- Encrypted API key storage (AES-256-GCM)

**What Patreon creators pay separately:** Mailchimp ($11-350/month), ConvertKit ($29-79/month), or Klaviyo ($20-300/month)

### Social Media Scheduling

**Status: BUILT**

What's included:
- Multi-platform support (Instagram, Twitter/X, Facebook, LinkedIn)
- Post scheduling with timezone support
- Multiple account management per platform
- Post types: posts, stories, reels, tweets, threads
- Media attachments, hashtags, location tagging
- OAuth integration for account connection

**What Patreon creators pay separately:** Buffer ($35/month), Later ($15-100/month), Hootsuite ($35-600/month)

### Analytics & Tracking

**Status: BUILT**

What's included:
- Revenue analytics with daily graphs (30-day view)
- Product-level revenue breakdown
- Video analytics (watch duration, completion rates, drop-off points, rewatch detection)
- Student progress tracking with at-risk detection
- Course performance (enrollment counts, completion rates, per-chapter metrics)
- Engagement scoring (0-100 per student per course)
- Learning streaks and milestone tracking
- Audience insights (countries, age groups, device types)
- Recent activity feed (purchases, enrollments, completions)

**What Patreon creators pay separately:** Google Analytics (free but limited), Fathom ($14-54/month), course-specific analytics tools ($50-100/month)

### AI Content Tools

**Status: BUILT**

What's included:
- Master AI multi-agent system (question decomposition, vector search, fact verification)
- Social media script generation from course content (TikTok, Instagram, YouTube optimized)
- 65+ TikTok hook templates built-in
- Cheat sheet auto-generation from course chapters
- AI email copy generation
- AI image generation for products and chapters
- Text-to-speech / audio generation
- Custom AI agents (creator can build specialized bots)

**What Patreon creators pay separately:** ChatGPT+ ($20/month), Jasper ($39-125/month), or hiring freelancers

### Course Platform

**Status: BUILT**

What's included:
- Structured courses with chapters, lessons, modules
- Video hosting with playback analytics
- Course drip scheduling (time-based or completion-based content release)
- Certificate generation on completion with public verification
- Reference guide / cheat sheet PDF generation
- Student progress tracking
- Course bundling

**What Patreon creators pay separately:** Teachable ($39-299/month), Kajabi ($149-399/month), Thinkific ($49-499/month)

### Landing Pages

**Status: BUILT**

What's included:
- Block-based landing page builder
- Template library
- A/B page variants
- Publish/unpublish control
- Conversion tracking per page

**What Patreon creators pay separately:** Leadpages ($25-125/month), Carrd ($19/year), ConvertKit landing pages (included with email plan)

### Certificate & Credentialing

**Status: BUILT**

What's included:
- Auto-generated certificates on course completion
- Unique verification codes (ABC-123-XYZ format)
- Public verification page
- PDF download and sharing
- Certificate revocation capability

**What Patreon creators pay separately:** Credly/Acclaim ($3-5 per credential), Kajabi certificates (included at $149+/month tier)

### Direct Messaging

**Status: BUILT**

What's included:
- One-to-one DM between creator and students
- Conversation threading
- Unread message counts
- User search

**What Patreon creators pay separately:** Discord (free but requires separate management), Mighty Networks ($200-500/month)

### Beat Licensing

**Status: BUILT**

What's included:
- 4-tier licensing system (Basic, Premium, Exclusive, Unlimited)
- Per-tier configurable rights (commercial use, stems, broadcasting, video)
- Automatic license contract generation
- Exclusive purchase locks beat from other buyers
- Demo audio previews

**What Patreon creators pay separately:** BeatStars ($9.99-19.99/month), Airbit ($4.99-19.99/month)

### Estimated total replacement cost for a Patreon creator

| Tool | Approximate Monthly Cost |
|---|---|
| Email marketing (ConvertKit/Klaviyo) | $29-300 |
| Social scheduling (Buffer/Later) | $15-100 |
| Course platform (Teachable/Kajabi) | $39-399 |
| Landing pages (Leadpages) | $25-125 |
| Beat licensing (BeatStars) | $10-20 |
| AI tools (ChatGPT+/Jasper) | $20-125 |
| Analytics (Fathom + course analytics) | $14-100 |
| Automations (Zapier) | $20-50 |
| CRM (HubSpot/ActiveCampaign) | $9-300 |
| **Total** | **$181-1,519/month** |

PPR replaces all of this with a 10% transaction fee and no monthly subscription.

---

## 6. Honest Gaps: Where Patreon Still Wins

These are real gaps. Acknowledging them builds credibility.

### Brand trust and audience
Patreon has millions of active patrons. When a creator says "support me on Patreon," people know what that means. PPR is unknown to most music producers. Migration requires convincing your audience to trust a new platform.

### Mobile app
Patreon has iOS and Android apps. PPR is web-only. For some audiences, this matters.

### Community/comments
Patreon has built-in comments on posts, community tab, and polls. PPR has DMs but no public community space, no comments on products, no polls. Discord integration exists for notifications but doesn't replace in-platform community.

### Content feed / posts
Patreon's core UX is a content feed where creators post updates, behind-the-scenes content, polls, and text posts. PPR is product/course-focused. There's no equivalent to "post an update for your patrons." Creators who use Patreon as a blog-style update platform would lose that workflow.

### Cascading tier inheritance
Patreon automatically gives higher tiers access to all lower tier benefits. PPR tiers are independent - creators must manually configure each tier's content access. This is extra work for creators with many tiers.

### Subscriber import
No way to import existing Patreon subscribers. People have to re-subscribe manually, which means inevitable subscriber loss during migration.

### Tier upgrade/downgrade flow
No built-in proration when switching tiers. User must cancel one subscription and start another. Patreon handles this seamlessly.

### Mature creator analytics on audience demographics
Patreon shows patron demographics, geographic distribution, and pledge trends over time. PPR analytics are strong for course/video engagement but lighter on membership-specific retention analytics (churn rate, LTV, cohort analysis).

### Established payout reliability
Patreon has years of proven, reliable payouts on the 1st and 5th of each month. PPR uses Stripe Connect (which is reliable) but doesn't have the same track record and institutional trust.

---

## 7. Key Differentiator Summary

**Why a music producer should choose PPR over Patreon:**

1. **Sell products, not just subscriptions.** One-time purchases + memberships in one store. Patreon forces everything into a subscription.

2. **Beat licensing built in.** 4-tier licensing with contracts, exclusivity locks, and per-tier rights. Patreon has no concept of licensing.

3. **Real storefront.** Filterable product grid, individual product pages, search. Not a chronological feed.

4. **Structured courses.** Chapters, lessons, video analytics, certificates, drip scheduling. Patreon has posts.

5. **Email marketing included.** Drip campaigns, segmentation, A/B testing, AI copy. Patreon creators pay $30-300/month for this separately.

6. **Social media scheduling included.** Multi-platform scheduling. Patreon creators pay $15-100/month for this.

7. **AI tools included.** Content generation, script writing, image generation. All built-in.

8. **Bundles.** Package courses + products together at a discount. Patreon can't do this.

9. **Lower effective cost.** PPR's 10% all-in vs. Patreon 8-12% PLUS $200-1500/month in separate tool subscriptions.

**Why a music producer might stay on Patreon:**

1. Established audience already there
2. Brand recognition and trust
3. Mobile app
4. Community/comments on posts
5. Easier tier management (cascading access)
6. No migration friction

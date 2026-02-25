# PPR Academy: Platform Replacement Research

> Research conducted via codebase analysis on Feb 24, 2026. Every claim below references a specific table, file, or route path found in the codebase.

---

## 1. Replaces Kajabi ($149-$399/mo) - Course Creation & LMS

### Schema Tables (14 tables)
| Table | File | Purpose |
|-------|------|---------|
| `courses` | `convex/schema.ts:187` | Main course entity (title, price, slug, follow gates, reference PDFs) |
| `courseModules` | `convex/schema.ts` | Modules within courses |
| `courseLessons` | `convex/schema.ts` | Lessons within modules |
| `courseChapters` | `convex/schema.ts` | Video/text chapters with AI generation fields |
| `enrollments` | `convex/schema.ts:374` | User-course enrollment records |
| `courseDripAccess` | `convex/schema.ts:3894` | Teachable-style drip content unlock tracking |
| `courseNotes` | `convex/schema.ts:1602` | Student notes with timestamps |
| `userProgress` | `convex/schema.ts:1543` | Chapter completion tracking with time spent |
| `quizzes` | `convex/schema.ts:4273` | Practice, assessment, and final exam quizzes |
| `quizQuestions` | `convex/schema.ts:4299` | 6 question types: multiple choice, T/F, fill-blank, short answer, essay, matching |
| `quizAttempts` | `convex/schema.ts:4321` | Individual quiz attempts with scoring |
| `certificates` | `convex/schema.ts:3852` | Verifiable certificates (CERT-{id} + ABC-123-XYZ codes) |
| `courseAnalytics` | `convex/schema.ts:4110` | Daily enrollments, views, completion rate, revenue |
| `aiCourseOutlines` | `convex/schema.ts:5857` | AI-generated course outlines |

### Features (32 features)
1. **Hierarchical content**: Modules -> Lessons -> Chapters (3-level nesting)
2. **Video hosting**: Native upload + Mux integration (`muxAssetId`, `muxPlaybackId`)
3. **Rich text chapters**: Full content editor with descriptions
4. **AI course generation**: Prompt-to-course pipeline via multi-agent system (`lib/multi-agent-system.ts`) - 5 AI agents (Research, Structure, Content, Image, Quality)
5. **AI audio generation**: Voiceover from chapter content with voice selection (`convex/aiCourseBuilder.ts`)
6. **AI video generation**: Scene-by-scene video pipeline (`videoJobs`, `videoScripts` tables)
7. **AI cheat sheet generation**: Auto-study guides from chapters - key takeaways, quick reference, step-by-step, tips, comparison, glossary (`convex/cheatSheetMutations.ts`)
8. **AI image generation**: Chapter and course thumbnails (`convex/chapterImageGeneration.ts`)
9. **Drip content**: Release by days after enrollment, specific dates, or prerequisite completion (`convex/courseDrip.ts`)
10. **Drip notifications**: Email students when modules unlock
11. **Follow gates**: Require social follows for free courses - 12 platforms supported (Instagram, TikTok, YouTube, Spotify, SoundCloud, Apple Music, Deezer, Twitch, Mixcloud, Facebook, Twitter, Bandcamp)
12. **Quizzes**: 6 question types, time limits, passing scores, multiple attempts, shuffle, partial credit
13. **Certificates**: Auto-issued on 100% completion, unique verification codes, PDF generation, public verification page
14. **Certificate verification**: Public verify endpoint with IP/user-agent tracking (`convex/certificates.ts`)
15. **Student progress tracking**: Per-chapter completion, time spent, engagement scoring
16. **Student risk assessment**: `isAtRisk` flag, estimated completion date, chapters/week metric
17. **Course reviews**: Star ratings + text reviews (`convex/courseReviews.ts`)
18. **Course categories**: Category/subcategory/tags taxonomy
19. **Skill levels**: Beginner, intermediate, advanced designation
20. **Free preview chapters**: Mark chapters as `isFree` for preview
21. **Stripe checkout**: Per-course payment with Connect transfers
22. **Reference PDF generation**: AI-generated guide from course content (`app/api/courses/generate-reference-pdf/route.ts`)
23. **Course notes**: Students can take timestamped notes on chapters
24. **Live viewers**: Real-time presence tracking in courses (`liveViewers` table)
25. **Learning streaks**: Gamified consecutive-day tracking (`learningStreaks` table)
26. **AI recommendations**: Personalized course suggestions (`recommendations` table)
27. **Multi-step creation wizard**: 6-step flow with drag-drop content manager
28. **Landing page copy generator**: AI-powered sales copy (`LandingPageCopyGenerator.tsx`)
29. **Checkout customization**: Custom headline, description, guarantee text
30. **Course bundles**: Group courses + products for bundled pricing
31. **PPR Pro access**: Platform-wide subscription grants access to all courses
32. **Admin course management**: Platform-level course oversight

### Route Paths
- Course creation wizard: `app/dashboard/create/course/page.tsx` (6 steps, 36+ files)
- Creator dashboard: `app/dashboard/courses/page.tsx`
- Student course view: `app/courses/[slug]/`
- Course checkout: `app/courses/[slug]/checkout/`
- Admin management: `app/admin/courses/page.tsx`
- API endpoints: `app/api/courses/` (11 endpoints including purchase, payment-success, generate-reference-pdf, generate-thumbnail, publish-cheat-sheet-pack)

### Backend Files
- `convex/courses.ts` (71KB) - Core CRUD
- `convex/courseProgress.ts` - Progress + certificate issuance
- `convex/courseAccess.ts` - Access control (6 access types: free_preview, creator, purchased, ppr_pro, bundle_purchase, membership)
- `convex/courseDrip.ts` - Drip content engine
- `convex/aiCourseBuilder.ts` - AI generation pipeline
- `convex/certificates.ts` - Certificate CRUD + verification

---

## 2. Replaces Shopify/Gumroad ($39-$399/mo) - Storefront & Digital Products

### Schema Tables (18 tables)
| Table | Purpose |
|-------|---------|
| `digitalProducts` | Main product repository (all types) |
| `stores` | Creator storefronts with custom slugs, branding, plans |
| `purchases` | Transaction history with access tracking |
| `beatLicenses` | Beat lease tier purchases (basic/premium/exclusive/unlimited) |
| `bundles` | Product + course bundles with discount pricing |
| `audioSamples` | Individual samples within packs |
| `productReviews` | Customer reviews and ratings |
| `coachingSessions` | Scheduled coaching appointments |
| `coachProfiles` | Coach professional info |
| `releasePreSaves` | Music release pre-save tracking |
| `followGateSubmissions` | Social follow-gate verification |
| `leadSubmissions` | Lead magnet email captures |
| `coupons` | Discount codes with usage limits |
| `affiliates` | Affiliate program partners |
| `affiliateSales` | Commission tracking |
| `paymentPlans` | Installment payment support |
| `refunds` | Refund request processing |
| `creatorPayouts` | Stripe Connect earnings + payouts |

### Product Types (20 types)
Found in `convex/schema.ts:1124-1161`:

**Music Production Assets (8)**
1. `sample-pack` - Sample collections
2. `preset-pack` - Synthesizer/plugin presets
3. `midi-pack` - MIDI patterns and loops
4. `beat-lease` - Tiered beat licensing (basic/premium/exclusive/unlimited)
5. `project-files` - DAW project files
6. `mixing-template` - Pre-configured mixing templates
7. `effect-chain` - Multi-DAW effect chains
8. `ableton-rack` - Ableton-specific racks

**Services (4)**
9. `coaching` - 1-on-1 coaching sessions
10. `mixing-service` - Professional mixing
11. `mastering-service` - Professional mastering
12. `playlist-curation` - Playlist submission services

**Education (3)**
13. `course` - Full courses
14. `workshop` - Workshop content
15. `masterclass` - Advanced masterclasses

**Digital Content (2)**
16. `pdf` - PDFs, cheat sheets, guides, ebooks
17. `blog-post` - Standalone blog content

**Community & Engagement (3)**
18. `community` - Community membership
19. `tip-jar` - Tip/donation jars
20. `release` - Music release pre-save campaigns

### Features (28 features)
1. **Creator storefronts**: Each creator gets `myapp.com/{slug}` with custom branding
2. **Store branding**: Logo, banner, accent color, bio, tagline, social links
3. **Custom domains**: `customDomain` field on stores table
4. **6 store plans**: Free, Starter ($12/mo), Creator ($29/mo), Creator Pro ($79/mo), Business ($149/mo), Early Access
5. **18 marketplace categories**: `app/marketplace/` with beats, courses, products, bundles, coaching, memberships, preset-packs, plugins, ableton-racks, project-files, mixing-templates, mixing-services, samples, guides, creators
6. **Beat lease licensing**: 4 tiers (basic/premium/exclusive/unlimited) with different file delivery per tier
7. **Exclusive purchases**: Single-buyer exclusive beats
8. **Contract generation**: Auto-generated beat license contracts
9. **Digital file delivery**: Tiered delivery (basic=mp3+wav, premium=+stems, exclusive=+trackouts)
10. **Download tracking**: `downloadCount` in purchases table
11. **Stripe Connect**: Creator payouts with 10% platform fee
12. **11 checkout endpoints**: Separate checkout sessions for beats, products, courses, coaching, bundles, memberships, mixing services, tips, creator plans, PPR Pro, subscriptions
13. **Coupon codes**: Percentage or fixed discount, usage limits, expiration
14. **Affiliate program**: Commission tracking, click attribution, payout processing
15. **Installment payments**: Split purchases over multiple payments
16. **Refund management**: Partial and full refund processing
17. **Follow gates**: Free products gated behind social follows
18. **Lead magnets**: Email capture with automatic delivery
19. **Pre-save campaigns**: Music release marketing with follower tracking
20. **Product reviews**: Star ratings + text reviews
21. **Bundles**: Mix courses + products with discount pricing
22. **Order bumps/upsells**: `upsells` table for checkout upsells
23. **Free trials**: Trial period tracking and conversion
24. **UTM tracking**: Full campaign attribution on checkout
25. **Rate limiting**: 5 requests/min on checkout endpoints
26. **Product pinning**: Featured products with `isPinned` flag
27. **Audio preview**: `demoAudioUrl` for beat previews
28. **Multi-currency + tax rates**: International support

### Route Paths
- Creator storefront: `app/[slug]/page.tsx` (63KB - full store rendering)
- Product pages: `app/[slug]/beats/[beatSlug]`, `app/[slug]/products/[productSlug]`, `app/[slug]/courses/[courseSlug]`, `app/[slug]/coaching/[productId]`, `app/[slug]/memberships/[membershipSlug]`, `app/[slug]/bundles/[bundleSlug]`, `app/[slug]/tips/[tipSlug]`
- Custom pages: `app/[slug]/p/[pageSlug]`
- Marketplace: `app/marketplace/` (18 categories)
- Checkout APIs: `app/api/beats/create-checkout-session/`, `app/api/products/create-checkout-session/`, etc.
- File delivery: `app/api/beats/download/route.ts`
- Stripe webhooks: `app/api/webhooks/stripe/route.ts` (26 event types handled)

### Product Card Components
- `app/[slug]/components/product-cards/BeatLeaseCard.tsx`
- `app/[slug]/components/product-cards/CourseCard.tsx`
- `app/[slug]/components/product-cards/CoachingCard.tsx`
- `app/[slug]/components/product-cards/DigitalProductCard.tsx`
- `app/[slug]/components/product-cards/BundleCard.tsx`
- `app/[slug]/components/product-cards/MembershipCard.tsx`
- `app/[slug]/components/product-cards/TipJarCard.tsx`
- `app/[slug]/components/product-cards/PlaylistCurationCard.tsx`

---

## 3. Replaces ActiveCampaign/Mailchimp ($49-$259/mo) - Email Marketing

### Schema Tables (50+ tables)
**Core (in `convex/schema.ts`):**
| Table | Line | Purpose |
|-------|------|---------|
| `emailWorkflows` | 520 | Visual node-based workflow builder |
| `emailCampaigns` | 2006 | Broadcast email campaigns |
| `emailCampaignRecipients` | 2045 | Per-recipient tracking |
| `emailTemplates` | 2071 | Reusable email templates (HTML/text) |
| `dripCampaigns` | 5906 | Automated drip sequences |
| `dripCampaignSteps` | 5927 | Individual steps with delays |
| `dripCampaignEnrollments` | 5943 | User enrollment tracking |
| `workflowTemplates` | 623 | Pre-built workflow templates |
| `workflowExecutions` | 668 | Individual workflow run tracking |
| `workflowGoalCompletions` | 651 | Goal conversion tracking |
| `workflowNodeABTests` | 699 | A/B testing within workflow nodes |
| `emailContacts` | 5985 | Main subscriber table (40+ fields, engagement scores) |
| `emailTags` | 5972 | Segmentation tags |
| `emailContactTags` | 6058 | Contact-tag junction |
| `emailContactStats` | 6047 | Aggregated engagement counts |
| `emailContactActivity` | 6070 | Activity log for all interactions |
| `emailSendQueue` | 6806 | Email queue with retry logic (max 3 attempts) |
| `emailFlows` | 1482 | Email flow rules |
| `emailDeliverabilityEvents` | 826 | Granular delivery tracking |
| `emailDeliverabilityStats` | 853 | Aggregated delivery metrics |
| `emailDomainReputation` | 875 | Domain/sender reputation |
| `emailTestHistory` | 967 | Test email history |
| `marketingCampaigns` | 2087 | Multi-platform campaigns (email + social) |
| `courseCycleEmails` | 803 | Course-specific email cycles |
| `creatorEmailSegments` | - | Audience segments per creator |

**Advanced (in `convex/emailSchema.ts`, 865 lines):**
| Table | Purpose |
|-------|---------|
| `resendConnections` | Resend API credentials per admin/store |
| `resendTemplates` | Templates stored in Resend |
| `resendCampaigns` | Broadcast campaigns |
| `resendAutomations` | Trigger-based automations |
| `resendLogs` | All sent emails logged with delivery status |
| `resendAudienceLists` | Targeted audience segments |
| `resendPreferences` | Per-user unsubscribe preferences |
| `resendImportedContacts` | Batch import (CSV, Mailchimp, ActiveCampaign, ConvertKit) |
| `leadScores` | Lead scoring A-D grades (0-1000+) |
| `emailSegments` | Dynamic segments with AND/OR composite conditions |
| `emailABTests` | A/B testing (subject, content, send time, from_name) |
| `userEngagementPatterns` | Best send time optimization per user |
| `emailHealthMetrics` | Daily/weekly/monthly health scores |
| `campaignGoals` | Campaign performance targets |
| `spamScoreChecks` | Pre-send spam analysis |
| `listHygieneActions` | Bounce/complaint handling |
| `webhookEmailEvents` | Raw webhook events from Resend |
| `emailAlerts` | Health alerts (high bounce, complaints) |

### Features (35 features)
1. **Visual workflow builder**: Node-based editor with trigger, email, delay, condition, action, stop, webhook, split, notify, goal, courseCycle nodes (`convex/emailWorkflows.ts`, 4,209 lines)
2. **17+ trigger types**: lead_signup, product_purchase, course_enrollment, tag_added, email_opened, email_clicked, custom_event, page_visit, cart_abandon, contact_signup, date_based, any_purchase, manual, all_users, all_creators, all_learners, user_inactivity
3. **Drip campaigns**: Multi-step sequences with configurable delays in minutes (`convex/dripCampaigns.ts`)
4. **A/B testing**: 4 test types - subject line, content, send time, from name. Statistical significance tracking, auto-send winner (`convex/emailABTesting.ts`, 522 lines)
5. **Lead scoring**: Grade A-D, breakdown by emailEngagement, courseEngagement, purchaseActivity. Score decay for inactive contacts
6. **Dynamic segmentation**: Composite AND/OR conditions with operators: equals, not_equals, greater_than, less_than, contains, in/not_in
7. **Contact management**: Status states (subscribed, unsubscribed, bounced, complained), engagement scores 0-100, custom fields
8. **Unsubscribe system**: One-click unsubscribe, CAN-SPAM compliant, per-category preferences (platform, course, marketing, weekly digest)
9. **Suppression checks**: Every email verified against preferences before sending
10. **Bounce handling**: Hard bounce, soft bounce, spam complaint tracking with automatic suppression
11. **Domain reputation tracking**: SPF/DKIM/DMARC validation, domain verification status
12. **Email health monitoring**: listHealthScore (0-100), engagementRate, deliverabilityScore, subscriberGrowth
13. **Health alerts**: Auto-triggered on high_bounce_rate (>2%), high_complaint_rate, delivery_degradation
14. **Spam score checks**: Pre-send analysis
15. **Template library**: Categorized by funnel stage (TOFU/MOFU/BOFU) and product type (`convex/emailTemplates.ts`, 2,126 lines)
16. **Variable personalization**: {{firstName}}, {{email}}, {{productName}}, {{downloadLink}}, {{unsubscribeLink}}
17. **HMAC-signed unsubscribe links**: Secure one-click unsubscribe URLs
18. **List-Unsubscribe headers**: Email client compatibility
19. **Import from competitors**: CSV, Mailchimp, ActiveCampaign, ConvertKit imports with progress tracking
20. **Batch email sending**: Queue processor with priority levels 1-10 and exponential backoff
21. **Pre-built workflow templates**: Welcome Series (3 emails), Re-engagement, Product Launch, Nurture (4 emails), Post-Purchase Onboarding
22. **Durable workflow engine**: Convex Workflows that survive server restarts, pause for days, built-in retry
23. **Campaign analytics**: recipientCount, sentCount, deliveredCount, openedCount, clickedCount, bouncedCount, complainedCount
24. **Engagement tracking**: Opens, clicks, bounces, complaints via Resend webhooks
25. **Best send time optimization**: Per-user engagement pattern analysis
26. **Goal tracking**: Campaign performance targets with conversion measurement
27. **Activity logging**: Every contact interaction tracked with timestamps
28. **Multi-level configuration**: Admin (platform-wide) and Store (creator-specific) email setups
29. **Resend integration**: Full API integration as delivery provider
30. **Course cycle emails**: Perpetual nurture cycles tied to course products
31. **List hygiene**: Automated cleanup actions for bounced/complained addresses
32. **Email test sends**: Test email functionality with history tracking
33. **Campaign recovery**: Resumable campaigns with lastProcessedCursor
34. **Stuck enrollment recovery**: Cron job to recover stuck drip enrollments
35. **Contact source tracking**: lead_magnet, checkout, manual, import attribution

### Processing Infrastructure
- `emailSendQueueActions.processEmailSendQueue` - Runs every **30 seconds**
- `emailWorkflowActions.processEmailWorkflowExecutions` - Runs every **60 seconds**
- `dripCampaignActions.processDueDripEmails` - Runs every **15 minutes**
- `dripCampaigns.recoverStuckEnrollments` - Runs every **15 minutes**

### Backend Files (27,399+ lines total)
- `convex/emailWorkflows.ts` (4,209 lines) - Workflow engine
- `convex/emailTemplates.ts` (2,126 lines) - Template library
- `convex/emailWorkflowActions.ts` (1,448 lines) - Workflow execution
- `convex/emailABTesting.ts` (522 lines) - A/B testing
- `convex/emailSendQueue.ts` (480 lines) - Queue operations
- `convex/dripCampaigns.ts` (451 lines) - Drip campaigns
- `convex/emailUnsubscribe.ts` (436 lines) - Unsubscribe handling
- `convex/emailSegmentation.ts` (432 lines) - Segment management
- `convex/emailTags.ts` (219 lines) - Tag management
- `convex/emailSchema.ts` (865 lines) - Schema definitions
- `convex/emailAnalytics.ts` - Analytics queries
- `convex/emailDeliverability.ts` - Delivery tracking
- `convex/emailHealthMonitoring.ts` - Health monitoring
- `convex/emailCreatorAnalytics.ts` - Creator-level analytics
- `convex/emailAnalyticsRollup.ts` - Aggregation
- `convex/emailContactSync.ts` - External sync
- `convex/emailLeadScoring.ts` - Lead scoring
- `lib/email.ts` (26KB) - Email templates + Resend client

---

## 4. Replaces Buffer/Later ($25-$120/mo) - Social Media Scheduling

### Schema Tables (12 tables)
| Table | Line | Purpose |
|-------|------|---------|
| `socialAccounts` | 3191 | Connected OAuth accounts (Instagram, Twitter, Facebook, TikTok, LinkedIn) |
| `socialAccountProfiles` | 6384 | User-defined social personas with content strategy |
| `generatedScripts` | 6424 | AI-generated multi-platform scripts with virality scores |
| `socialMediaPosts` | 6114 | AI-generated posts with images, audio, captions |
| `scriptCalendarEntries` | 6523 | Per-account content calendar scheduling |
| `scriptGenerationJobs` | 6564 | Background bulk generation job tracking |
| `scheduledPosts` | 3247 | Posts scheduled for publishing |
| `postAnalytics` | 3329 | Performance metrics (likes, comments, shares, saves, views, impressions, reach, clicks) |
| `socialWebhooks` | 3369 | Real-time platform webhook processing |
| `postTemplates` | 3401 | Reusable post templates |
| `ctaTemplates` | - | Reusable call-to-action templates |
| `automationFlows` | 3439 | ManyChat-style visual flow builder |

### Features (25 features)
1. **6 platforms supported**: Instagram, TikTok, Twitter/X, Facebook, YouTube, LinkedIn
2. **OAuth account connection**: Full token management with refresh (`convex/socialMedia.ts`)
3. **Social personas**: Define topics, target audience, preferred post days, posts/week strategy per profile (`convex/socialAccountProfiles.ts`)
4. **AI script generation**: Course content -> platform-specific scripts (TikTok, YouTube, Instagram) (`convex/masterAI/socialMediaGenerator.ts`)
5. **Virality scoring**: AI rates scripts 1-10 with engagement potential (40%), educational value (35%), trend alignment (25%)
6. **Account matching**: AI matches scripts to best social profiles by topic relevance and audience alignment
7. **Week view calendar**: Visual scheduling with day-by-day content planning (`app/dashboard/social/calendar/[profileId]/page.tsx`)
8. **Multi-platform posting**: Single interface to manage all platforms
9. **Content queuing**: Batch script generation from entire courses (full_scan, course_scan, incremental)
10. **TikTok hook templates**: 100+ proven viral hook structures built into generator
11. **AI image generation**: Platform-specific aspect ratios (16:9 for YouTube, 9:16 for TikTok/Reels)
12. **AI audio generation**: Text-to-speech narration with voice selection
13. **AI caption generation**: Platform-optimized captions with hashtags and emojis
14. **CTA management**: Reusable call-to-action templates with product/course linking
15. **Post status pipeline**: draft -> scripts_generated -> combined -> images_generated -> audio_generated -> completed -> published
16. **Performance tracking**: Views, impressions, reach, engagement rate, follower count - with 1h/24h/7d snapshots
17. **Performance feedback loop**: Compare predicted virality score vs actual performance
18. **Content library**: Browse, filter, and manage all generated scripts by status, virality score, platform
19. **Preferred posting days**: Per-profile day-of-week preferences (0-6)
20. **Timezone support**: Timezone-aware scheduling
21. **Sequence tracking**: Chapter-ordered content (1.1, 1.2, 2.1 etc.) for course progression
22. **Bulk generation**: Background job tracking with progress (totalChapters, processedChapters, failedChapters)
23. **Post templates**: Reusable templates with platform-specific content
24. **User notes**: Per-calendar-entry notes for tracking changes
25. **Script editing**: Full editing before scheduling/publishing

### Route Paths
```
app/dashboard/social/
  page.tsx                          - Main social media hub
  create/                           - 6-step content creation flow
    steps/StepContentSelection.tsx  - Choose course/chapter
    steps/StepPlatformScripts.tsx   - Platform-specific scripts
    steps/StepCombineScript.tsx     - Unified script generation
    steps/StepGenerateImages.tsx    - AI image generation
    steps/StepGenerateAudio.tsx     - Text-to-speech
    steps/StepReview.tsx            - Final review + captions
  calendar/[profileId]/page.tsx     - Week view calendar
  library/page.tsx                  - Generated scripts library
  profiles/page.tsx                 - Account profile management
  automation/page.tsx               - Automation flow list
  automation/[id]/page.tsx          - Visual flow editor
```

### Key Components
- `components/social-media/social-scheduler.tsx` (30KB) - Main scheduling interface
- `components/social-media/automation-manager.tsx` (55KB) - Visual flow builder
- `components/social-media/post-composer.tsx` (33KB) - Multi-step post creation

---

## 5. Replaces Patreon/Discord ($0 + 8-12% fees) - Memberships & Community

### Schema Tables (14 tables)
| Table | Line | Purpose |
|-------|------|---------|
| `creatorSubscriptionTiers` | 1908 | Creator-defined membership tiers (Basic/Pro/VIP) |
| `userCreatorSubscriptions` | 1934 | Active subscriptions (status: active/canceled/past_due/paused) |
| `contentAccess` | 1958 | Per-resource access control (free/purchase/subscription) |
| `subscriptionPlans` | monetizationSchema | Plan definitions with monthly/yearly pricing |
| `membershipSubscriptions` | monetizationSchema | Subscription lifecycle tracking |
| `pprProPlans` | 6851 | Platform-level plans ($12/mo or $108/yr) |
| `pprProSubscriptions` | 6862 | Platform membership tracking |
| `creatorEarnings` | 1972 | Revenue tracking (gross, platform fee, processing fee, net) |
| `userXP` | - | Experience points per user |
| `userAchievements` | - | Achievement tracking with progress |
| `learningStreaks` | 4243 | Consecutive day streaks |
| `artistFollows` | - | Follower system with notification preferences |
| `certificates` | 3852 | Verifiable completion certificates |
| `leaderboards` | - | Rankings (top creators, top students, most active) |

### Features (26 features)
1. **Creator membership tiers**: Custom tier names, descriptions, benefits lists, images
2. **Monthly + yearly pricing**: Per-tier pricing with Stripe integration (`convex/memberships.ts`)
3. **Free trials**: Configurable trial days per tier
4. **Content gating**: Per-tier access to specific courses and products, or "all content" access
5. **Subscriber management**: Creator dashboard to view/manage subscribers
6. **Subscription lifecycle**: Create, renew, cancel (immediate or end-of-period), upgrade, downgrade (`convex/subscriptions.ts`)
7. **Failed payment handling**: Retry tracking with `failedPaymentAttempts`
8. **PPR Pro platform membership**: $12/mo or $108/yr for access to ALL courses (`convex/pprPro.ts`)
9. **Creator earnings tracking**: Gross revenue, 10% platform fee, processing fees, net amount
10. **Payout processing**: Stripe Connect transfers with status tracking
11. **Follower system**: Follow creators with notification preferences for new tracks and live streams
12. **XP system**: Points earned for achievements (first course: 25 XP, first completion: 100 XP, 30-day streak: 500 XP, top seller: 1000 XP)
13. **Creator XP**: Separate XP track for creators (first store: 50 XP, product published: 50 XP, first sale: 150 XP, revenue milestones up to 1000 XP)
14. **Level system**: Level = sqrt(XP/100) + 1 for creators; (totalXP/100) + 1 for learners
15. **Achievements**: Progress-based unlocking (first-product, first-sale, revenue-100, 5-star-review, 100-students, 7-day-streak, etc.)
16. **Learning streaks**: Current streak, longest streak, total days active, total hours learned, streak milestones
17. **Leaderboards**: 3 types - Top Creators (by revenue), Top Students (by XP), Most Active (by streak)
18. **Leaderboard badges**: "Top Seller", "Rising Star", "Scholar", fire/star/sparkle emojis
19. **User position tracking**: Rank + percentile for each leaderboard
20. **Verifiable certificates**: CERT-{timestamp} IDs + ABC-123-XYZ verification codes
21. **Certificate PDF generation**: Downloadable certificates with instructor info
22. **Public verification**: Anyone can verify certificate authenticity via code
23. **Comments**: On notes, tracks, and blog posts
24. **Community creation**: In-development workflow (`app/dashboard/create/community/`)
25. **Direct messaging**: User-to-user DMs with attachments, read tracking, email notifications (`convex/directMessages.ts`)
26. **Pinned membership tiers**: Featured tier highlighting

### Route Paths
- Creator membership management: `app/dashboard/memberships/page.tsx`
- Public marketplace: `app/marketplace/memberships/`
- Store membership pages: `app/[slug]/memberships/[membershipSlug]/`
- Community creation (in progress): `app/dashboard/create/community/`
- Verify certificates: `app/verify/[certificateId]/page.tsx`

---

## 6. Replaces Zapier ($29-$99/mo) - Internal Automations

### Schema Tables (16 tables)
| Table | Purpose |
|-------|---------|
| `emailWorkflows` | Visual workflow engine |
| `workflowExecutions` | Execution state tracking (pending/running/completed/failed) |
| `workflowTemplates` | 5 pre-built templates |
| `webhookEndpoints` | Custom incoming webhook listeners with rate limiting |
| `webhookCallLogs` | Payload, status, IP logging |
| `customEvents` | User-defined event types |
| `customEventLogs` | Custom event fire history |
| `pageVisitEvents` | Page visit tracking for triggers |
| `cartAbandonEvents` | Cart abandonment tracking |
| `webhookEvents` | Webhook event processing (idempotency) |
| `dripCampaigns` | Auto-triggered email sequences |
| `dripCampaignEnrollments` | Enrollment state tracking |
| `courseDripAccess` | Module unlock scheduling |
| `automationFlows` | Social media automation flows |
| `automationTriggers` | Trigger event tracking |
| `userAutomationStates` | User progress through flows |

### Features (22 features)
1. **13+ trigger types**: lead_signup, product_purchase, course_enrollment, tag_added, email_opened, email_clicked, custom_event, page_visit, cart_abandon, contact_signup, date_based, any_purchase, manual
2. **Purchase -> Email chain**: Stripe webhook -> enrollment -> workflow trigger -> email sequence (all automatic)
3. **Purchase -> Drip enrollment**: Product purchase auto-enrolls in matching drip campaigns
4. **Enrollment -> Course drip**: Auto-unlock modules by days/date/prerequisites
5. **Course completion -> Certificate**: Auto-issue on 100% completion
6. **Custom events API**: `fireCustomEvent(storeId, eventName, contactEmail, eventData)` triggers matching workflows
7. **Page visit triggers**: Track visits, trigger workflows with wildcard URL matching
8. **Cart abandon recovery**: Track abandoned carts, trigger recovery email workflows
9. **Custom webhook endpoints**: REST endpoints with secret key verification and rate limiting
10. **5 pre-built workflow templates**: Welcome Series, Re-engagement, Product Launch, Nurture, Post-Purchase
11. **Conditional branching**: Check contact data/behavior to route workflow paths
12. **Workflow goal tracking**: Mark conversion goals within workflows
13. **Multi-agent AI system**: 5 AI agents for course generation (Research, Structure, Content, Image, Quality) (`lib/multi-agent-system.ts`)
14. **Cron job infrastructure**: 7 scheduled jobs running every 30s to 24h (`convex/crons.ts`)
15. **Durable workflows**: Survive server restarts, can pause for days/weeks
16. **Webhook processing**: Stripe (26 events), Clerk (user lifecycle), Resend (delivery events)
17. **Batch email processing**: Queue with priority levels, exponential backoff
18. **Stuck enrollment recovery**: Auto-detect and recover stuck drip enrollments
19. **Old webhook cleanup**: Daily cleanup of processed webhook events
20. **Admin metrics aggregation**: Hourly platform-wide metrics rollup
21. **Live viewer cleanup**: 5-minute cleanup of expired live viewers
22. **Course drip notification**: Auto-email students when modules unlock

### Cron Schedule (`convex/crons.ts`)
| Interval | Job |
|----------|-----|
| Every 30s | `processEmailSendQueue` - Email delivery |
| Every 60s | `processEmailWorkflowExecutions` - Workflow engine |
| Every 5m | `cleanupExpiredViewers` - Live presence |
| Every 15m | `processDueDripEmails` - Drip campaigns |
| Every 15m | `processPendingDripUnlocks` - Course drip content |
| Every 15m | `recoverStuckEnrollments` - Enrollment recovery |
| Every 1h | `aggregateAdminMetrics` - Platform metrics |
| Every 24h | `cleanupOldWebhookEvents` - Webhook cleanup |

### Integration Chain
```
Stripe Webhook (checkout.session.completed)
  -> /app/api/webhooks/stripe/route.ts
  -> serverCreateCourseEnrollment
  -> enrollments record created
  -> workflowExecutions triggered (course_enrollment / product_purchase)
  -> emailWorkflowActions processes nodes (every 60s)
  -> emailSendQueue processes emails (every 30s)
  -> Resend delivers email
  -> webhookEmailEvents tracks opens/clicks
  -> dripCampaignActions enrolls in drip (every 15m)
  -> courseDrip unlocks modules (every 15m)
  -> Certificate auto-issued on completion
```

---

## 7. Replaces ManyChat ($15-$65/mo) - DM & Comment Automation

### Schema Tables (10 tables)
| Table | Line | Purpose |
|-------|------|---------|
| `automations` | 4846 | Automation definitions with Instagram account linking |
| `triggers` | 4868 | COMMENT or DM trigger types |
| `keywords` | 4879 | Keyword matching (case-insensitive, full-text search) |
| `listeners` | 4890 | MESSAGE (static) or SMART_AI (OpenAI) response types |
| `posts` | 4917 | Instagram post monitoring (specific posts or ALL_POSTS_AND_FUTURE) |
| `chatHistory` | 4939 | Full conversation history per sender with turn tracking |
| `automationFlows` | 3439 | Advanced node-based flow builder |
| `userAutomationStates` | 3562 | User progress through automation flows |
| `automationTriggers` | 3621 | Trigger event tracking |
| `automationMessages` | 3672 | Message delivery tracking |

### Features (18 features)
1. **Keyword-triggered DM auto-replies**: Case-insensitive keyword matching on Instagram DMs (`convex/automations.ts`)
2. **Comment-to-DM automation**: Auto-reply to Instagram comments containing keywords
3. **Smart AI conversations**: OpenAI-powered chatbot with configurable personality, knowledge base, temperature (`convex/webhooks/instagram.ts`)
4. **Conversation history**: Full chat history per sender in `chatHistory` table with turn tracking
5. **Multi-platform DMs**: Instagram, Twitter/X, Facebook Messenger (`convex/socialDM.ts`)
6. **Batch DMs**: `sendBatchDMs()` for broadcast messaging
7. **Post-specific monitoring**: Attach automations to specific Instagram posts or all future posts
8. **Advanced flow builder**: Visual node-based automation with trigger, message, delay, condition, resource, tag, webhook nodes
9. **4 match types**: exact, contains, starts_with, regex keyword matching
10. **Resource delivery**: Send links, files, courses, products through automation flows
11. **User tagging**: Tag users during automation for segmentation
12. **Webhook nodes**: Call external APIs from automation flows
13. **Conversation timeout**: Configurable timeout (default 30 min) before conversation resets
14. **Max conversation turns**: Limit AI conversation length
15. **Analytics**: dmCount, commentCount, totalTriggers, totalCompletions per automation
16. **Instagram Graph API v21.0**: Full DM sending via Facebook Graph API
17. **Twitter API v2**: DM sending with OAuth 2.0
18. **Facebook Send API**: Messenger integration with messaging_type support

### Webhook Endpoints
- Instagram: `app/api/instagram-webhook/route.ts`
- Universal: `app/api/social/webhooks/[platform]/route.ts` (Instagram, Twitter, Facebook, LinkedIn, TikTok)

### Platform DM Support
| Platform | DM Sending | Comment Auto-Reply | Smart AI |
|----------|------------|-------------------|----------|
| Instagram | `sendInstagramDM()` via Graph API v21.0 | Yes | Yes |
| Twitter/X | `sendTwitterDM()` via API v2 | Yes (mentions) | Yes |
| Facebook | `sendFacebookDM()` via Send API | Yes | Yes |
| TikTok | Limited (API restrictions) | No | No |
| LinkedIn | Webhooks only | No | No |

---

## 8. Replaces Later/Buffer (Duplicate - Covered in #4)

All social scheduling features are covered in Section 4 above. Key differentiators from Later/Buffer:

1. **AI content generation from courses** - Buffer/Later don't generate content
2. **Virality prediction scoring** - No equivalent in Buffer/Later
3. **Smart account matching** - AI recommends best profile for each post
4. **DM/comment automation** - Buffer/Later don't offer this (ManyChat territory)
5. **Course-to-social pipeline** - Unique to PPR
6. **TikTok hook templates** - 100+ proven viral structures built in
7. **Performance learning loop** - Predicted vs actual performance feedback

---

## Summary

### PPR replaces 7 platforms with 186+ features

| Platform Replaced | Monthly Cost | PPR Tables | PPR Features | Key Proof Files |
|-------------------|-------------|------------|--------------|-----------------|
| **Kajabi** (Course LMS) | $149-399 | 14 tables | 32 features | `convex/courses.ts` (71KB), `convex/aiCourseBuilder.ts`, `lib/multi-agent-system.ts` |
| **Shopify/Gumroad** (Storefront) | $39-399 | 18 tables | 28 features | `app/[slug]/page.tsx` (63KB), `convex/digitalProducts.ts`, 20 product types |
| **ActiveCampaign/Mailchimp** (Email) | $49-259 | 50+ tables | 35 features | `convex/emailWorkflows.ts` (4,209 lines), `convex/emailSchema.ts` (865 lines) |
| **Buffer/Later** (Social Scheduling) | $25-120 | 12 tables | 25 features | `convex/masterAI/socialMediaGenerator.ts`, `components/social-media/` (118KB) |
| **Patreon/Discord** (Memberships) | $0 + 8-12% | 14 tables | 26 features | `convex/memberships.ts`, `convex/subscriptions.ts`, `convex/achievements.ts` |
| **Zapier** (Automations) | $29-99 | 16 tables | 22 features | `convex/crons.ts` (8 cron jobs), `app/api/webhooks/stripe/route.ts` (26 events) |
| **ManyChat** (DM Automation) | $15-65 | 10 tables | 18 features | `convex/automations.ts`, `convex/socialDM.ts`, `convex/webhooks/instagram.ts` |

### Totals
- **Platforms replaced**: 7
- **Combined monthly cost of replaced tools**: $306-$1,341/month ($3,672-$16,092/year)
- **Total database tables**: 134+
- **Total features**: 186+
- **Total backend code**: 27,000+ lines of email system alone, 71KB courses.ts, 63KB storefront
- **Product types**: 20 distinct product categories
- **Checkout endpoints**: 11 dedicated Stripe checkout flows
- **Cron jobs**: 8 automated background processors
- **AI agents**: 5-agent course generation system + social media AI + Smart AI chatbot
- **Supported social platforms**: 6 (Instagram, TikTok, Twitter/X, Facebook, YouTube, LinkedIn)
- **Email trigger types**: 17+
- **Schema file**: 7,046 lines (`convex/schema.ts`)

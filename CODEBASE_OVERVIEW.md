# PPR Academy - Codebase Overview

> Music production education platform with creator marketplace, course delivery, email marketing, and payment processing.

**Last Updated**: February 2026
**Repository**: ppr-academy
**Domain**: pauseplayrepeat.com

---

## 1. Project Structure

```
ppr-academy/
├── app/                          # Next.js App Router pages (184 pages)
│   ├── _components/              # Homepage/marketing page components (21 files)
│   ├── (dashboard)/              # Route group: legacy dashboard routes
│   │   ├── home/                 # Home dashboard (redirects to /dashboard)
│   │   ├── music/                # Music showcase pages
│   │   └── settings/             # Settings pages
│   ├── [slug]/                   # Creator storefront catch-all
│   │   ├── beats/                # Storefront beat pages
│   │   ├── bundles/              # Storefront bundle pages
│   │   ├── coaching/             # Storefront coaching pages
│   │   ├── courses/              # Storefront course pages
│   │   ├── memberships/          # Storefront membership pages
│   │   ├── products/             # Storefront product pages
│   │   ├── tips/                 # Storefront tip jar pages
│   │   └── p/                    # Custom pages in storefront
│   ├── actions/                  # Server actions
│   ├── admin/                    # Admin panel (40+ pages)
│   │   ├── activity/             # User activity logs
│   │   ├── ai/                   # AI system monitoring
│   │   ├── ai-flywheel/          # Content generation pipeline
│   │   ├── analytics/            # Platform analytics
│   │   ├── changelog/            # Platform changelog
│   │   ├── communications/       # System communications
│   │   ├── content-generation/   # Content gen tools
│   │   ├── conversions/          # Conversion tracking
│   │   ├── course-builder/       # Admin course builder
│   │   ├── courses/              # Course management
│   │   ├── creators/             # Creator management
│   │   ├── drip-campaigns/       # Drip campaign mgmt
│   │   ├── email-analytics/      # Email analytics dashboard
│   │   ├── email-monitoring/     # Email health monitoring
│   │   ├── emails/               # Email management
│   │   ├── embeddings/           # Vector embeddings
│   │   ├── feature-discovery/    # Feature adoption tracking
│   │   ├── finance/              # Financial reporting
│   │   ├── generate-samples/     # Sample generation
│   │   ├── lead-magnets/         # Lead magnet management
│   │   ├── management/           # Platform management
│   │   ├── marketing/            # Marketing hub
│   │   ├── migrate-stores/       # Store migration
│   │   ├── moderation/           # Content moderation
│   │   ├── notifications/        # Notification management
│   │   ├── plugins/              # Plugin management
│   │   ├── products/             # Product catalog
│   │   ├── revenue/              # Revenue analytics
│   │   ├── seed-credits/         # Credit distribution
│   │   ├── settings/             # Admin settings
│   │   ├── sync/                 # Data synchronization
│   │   └── users/                # User management
│   ├── affiliate/                # Affiliate program pages
│   ├── ai/                       # AI assistant interface
│   ├── api/                      # Next.js API routes (70+ routes)
│   │   ├── admin/                # Admin API endpoints
│   │   ├── ai/                   # AI endpoints
│   │   ├── analytics/            # Analytics tracking
│   │   ├── audio/                # Audio file serving
│   │   ├── auth/                 # Auth callbacks
│   │   ├── beats/                # Beat licensing
│   │   ├── bundles/              # Bundle checkout
│   │   ├── coaching/             # Coaching checkout
│   │   ├── courses/              # Course operations
│   │   ├── creator-plans/        # Creator plan checkout
│   │   ├── credits/              # Credit purchases
│   │   ├── elevenlabs/           # TTS voices
│   │   ├── follow-gate/          # Follow gate OAuth
│   │   ├── github/               # GitHub integration
│   │   ├── lead-magnets/         # Lead magnet gen
│   │   ├── memberships/          # Membership checkout
│   │   ├── mixing-service/       # Mixing service checkout
│   │   ├── mux/                  # Video uploads/webhooks
│   │   ├── payouts/              # Creator payouts
│   │   ├── presave/              # Music presave (Spotify, Apple)
│   │   ├── products/             # Product checkout
│   │   ├── social/               # Social OAuth/webhooks
│   │   ├── stripe/               # Stripe Connect
│   │   ├── submissions/          # Submission checkout
│   │   ├── subscriptions/        # Subscription checkout
│   │   ├── tips/                 # Tip checkout
│   │   ├── uploadthing/          # File uploads
│   │   └── webhooks/             # Stripe, Clerk, Resend webhooks
│   ├── artist/                   # Artist profile pages
│   ├── blog/                     # Blog pages
│   ├── bundles/                  # Bundle product pages
│   ├── courses/                  # Course pages (browse, detail, player)
│   │   └── [slug]/               # Individual course
│   │       ├── checkout/         # Course checkout
│   │       ├── lessons/          # Lesson player
│   │       └── success/          # Post-purchase
│   ├── credits/                  # Credit system pages
│   ├── dashboard/                # Creator/student dashboard (60+ pages)
│   │   ├── affiliates/           # Affiliate dashboard
│   │   ├── analytics/            # Creator analytics
│   │   ├── certificates/         # Earned certificates
│   │   ├── coaching/             # Coaching management
│   │   ├── copyright/            # Copyright management
│   │   ├── courses/              # Course management
│   │   ├── create/               # Product creation (20+ types)
│   │   ├── downloads/            # Digital downloads
│   │   ├── emails/               # Email marketing system
│   │   ├── landing-pages/        # Landing page builder
│   │   ├── lead-magnet-ideas/    # AI lead magnets
│   │   ├── marketing/            # Marketing campaigns
│   │   ├── memberships/          # Membership management
│   │   ├── messages/             # Messaging inbox
│   │   ├── my-orders/            # Purchase history
│   │   ├── notes/                # Collaborative notes
│   │   ├── pricing/              # Pricing page builder
│   │   ├── products/             # Product management
│   │   ├── profile/              # Profile settings
│   │   ├── samples/              # Sample library
│   │   ├── service-orders/       # Service orders
│   │   ├── settings/             # Account settings
│   │   ├── social/               # Social media management
│   │   └── students/             # Student management
│   ├── leaderboards/             # Gamification
│   ├── marketplace/              # Public marketplace (14+ categories)
│   │   ├── beats/                # Beat marketplace
│   │   ├── bundles/              # Bundle marketplace
│   │   ├── coaching/             # Coaching marketplace
│   │   ├── courses/              # Course marketplace
│   │   ├── creators/             # Creator directory
│   │   ├── guides/               # Guide marketplace
│   │   ├── memberships/          # Membership marketplace
│   │   ├── mixing-services/      # Mixing service marketplace
│   │   ├── mixing-templates/     # Template marketplace
│   │   ├── plugins/              # Plugin marketplace
│   │   ├── preset-packs/         # Preset marketplace
│   │   ├── project-files/        # Project file marketplace
│   │   └── samples/              # Sample marketplace
│   ├── playlists/                # Playlist pages
│   ├── products/                 # Product listing
│   ├── sign-in/                  # Clerk sign-in
│   ├── sign-up/                  # Clerk sign-up
│   ├── subscribe/                # Subscription checkout
│   └── verify/                   # Certificate verification
├── components/                   # Shared React components (42 subdirectories, 200+ files)
│   ├── admin/                    # Admin components
│   ├── affiliates/               # Affiliate UI
│   ├── ai/                       # AI assistant components
│   ├── analytics/                # Analytics dashboards
│   ├── beats/                    # Beat licensing UI
│   ├── certificates/             # Certificate components
│   ├── coaching/                 # Coaching UI
│   ├── course/                   # Course editor/player
│   ├── credits/                  # Credit system UI
│   ├── creator/                  # Creator tools
│   ├── dashboard/                # Dashboard components
│   │   └── analytics/            # Analytics widgets
│   ├── discord/                  # Discord integration
│   ├── editor/                   # TipTap WYSIWYG editor
│   ├── emails/                   # Email campaign UI
│   ├── follow-gates/             # Follow gate components
│   ├── gamification/             # Achievement/leaderboard
│   ├── landing-pages/            # Landing page builder
│   ├── library/                  # Library browser
│   ├── marketing/                # Marketing campaign UI
│   ├── messages/                 # Messaging inbox
│   ├── monetization/             # Monetization tools
│   ├── music/                    # Music showcase
│   ├── notes/                    # Note editor
│   ├── onboarding/               # Onboarding flows
│   ├── payments/                 # Stripe Connect UI
│   ├── previews/                 # Phone/device previews
│   ├── products/                 # Product cards/grids
│   ├── providers/                # Context providers
│   ├── qa/                       # Q&A system
│   ├── quiz/                     # Quiz player
│   ├── referrals/                # Referral cards
│   ├── samples/                  # Sample browser
│   ├── settings/                 # Settings forms
│   ├── shared/                   # Shared utilities
│   ├── social-media/             # Social scheduling/automation
│   ├── social-proof/             # Social proof widgets
│   ├── storefront/               # Storefront components
│   ├── ui/                       # shadcn/ui base components (60+ files)
│   ├── video/                    # Mux video player
│   └── workflow/                 # Email workflow builder
├── convex/                       # Convex backend (150+ files, 400+ functions)
│   ├── _generated/               # Auto-generated Convex types
│   ├── admin/                    # Admin functions
│   ├── aiPlatform/               # AI platform functions
│   ├── fixes/                    # Data fix migrations
│   ├── integrations/             # External integrations
│   ├── masterAI/                 # Multi-agent AI system
│   │   └── tools/                # AI tool definitions
│   ├── migrations/               # Data migrations
│   └── questionnaire/            # Q&A system
├── emails/                       # React Email templates (14 templates)
│   ├── components/               # Email layout components
│   └── templates/                # Email template files
├── hooks/                        # Custom React hooks (13 hooks)
├── lib/                          # Core utilities and business logic (30+ files)
│   ├── create/                   # Product creation context
│   ├── marketing-campaigns/      # Campaign templates/utils
│   ├── monitoring/               # Migration monitoring
│   ├── presave/                  # Music presave (Spotify, Apple)
│   ├── seo/                      # Structured data/SEO
│   └── services/                 # Service layer
├── public/                       # Static assets
├── scripts/                      # Utility scripts (9 scripts)
├── shared/                       # Shared types/components
│   └── components/               # Cross-cutting components
├── middleware.ts                  # Route protection & custom domains
├── package.json                  # Dependencies
├── tailwind.config.ts            # Tailwind CSS config
├── tsconfig.json                 # TypeScript config
├── next.config.mjs               # Next.js config
└── convex.json                   # Convex config
```

---

## 2. Tech Stack

### Core Framework
| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 15.3.6 | App Router, SSR/SSG, API routes |
| React | 19.0.1 | UI framework |
| TypeScript | 5.7.3 | Type safety |
| Convex | 1.31.4 | Real-time backend, database, file storage |
| Tailwind CSS | 3.4.17 | Utility-first styling |

### Authentication & Payments
| Technology | Version | Purpose |
|-----------|---------|---------|
| Clerk | 6.21.0 | Auth, user management, webhooks |
| Stripe | 18.5.0 | Payments, Connect, subscriptions, checkout |
| Stripe React | 3.9.2 | Client-side payment UI |

### Email & Communication
| Technology | Version | Purpose |
|-----------|---------|---------|
| Resend | 4.7.0 | Transactional/campaign emails |
| React Email | 0.5.6 | Email template components |
| Svix | 1.67.0 | Webhook verification |

### Media & Content
| Technology | Version | Purpose |
|-----------|---------|---------|
| Mux | 12.8.1 | Video hosting, streaming, processing |
| UploadThing | 7.7.2 | File uploads |
| ElevenLabs | 2.17.0 | Text-to-speech audio generation |
| Fal.ai | 1.7.2 | AI image/video generation |
| TipTap | 2.27.1 | WYSIWYG rich text editor |

### AI & Intelligence
| Technology | Version | Purpose |
|-----------|---------|---------|
| OpenAI | 5.3.0 | GPT for content generation, chat |
| LangChain | 0.3.28 | RAG pipeline, text splitting |
| Convex RAG | 0.6.1 | Vector search, embeddings |

### UI Components
| Technology | Version | Purpose |
|-----------|---------|---------|
| shadcn/ui (Radix) | Various | Base component library (60+ components) |
| Lucide React | 0.468.0 | Icon library |
| Recharts | 3.2.1 | Data visualization charts |
| ReactFlow | 11.11.4 | Visual workflow builder |
| Framer Motion | 12.23.3 | Animations |
| cmdk | 1.1.1 | Command palette |
| react-easy-crop | 5.5.3 | Image cropping |

### Infrastructure
| Technology | Version | Purpose |
|-----------|---------|---------|
| Upstash Redis | 1.35.5 | Rate limiting |
| Vercel Analytics | 1.5.0 | Web analytics |
| Cheerio | 1.1.0 | HTML scraping |
| pdf-lib | 1.17.1 | PDF generation |

### Dev Tools
| Technology | Version | Purpose |
|-----------|---------|---------|
| ESLint | 8.57.1 | Linting |
| Prettier | 3.4.2 | Code formatting |
| Playwright | 1.55.0 | E2E testing |
| Husky | 9.1.6 | Git hooks |
| Concurrently | 9.2.0 | Run dev servers in parallel |

### NPM Scripts
```bash
npm run dev              # Start Next.js + Convex + Stripe CLI concurrently
npm run dev:next         # Next.js only (with Turbopack)
npm run dev:convex       # Convex dev server only
npm run build            # Production build
npm run typecheck        # TypeScript type checking
npm run lint             # ESLint
npx convex deploy        # Deploy Convex to production
```

---

## 3. Database Schema

The Convex database contains **205+ tables** across 11 schema files. Below is every table organized by domain.

### Schema Files
- `convex/schema.ts` - Main schema (100+ tables)
- `convex/monetizationSchema.ts` - Payment plans, affiliates, coupons, refunds, payouts, tax
- `convex/emailSchema.ts` - Email workflows, campaigns, segments, deliverability
- `convex/analyticsSchema.ts` - Events, video analytics, course analytics, revenue, sessions
- `convex/certificatesSchema.ts` - Certificates, verification logs
- `convex/quizzesSchema.ts` - Quizzes, questions, attempts, question banks
- `convex/qaSchema.ts` - Q&A questions, answers, votes
- `convex/discordSchema.ts` - Discord integrations, guilds, events
- `convex/emailDomainSchema.ts` - Email domains, domain analytics, creator stats
- `convex/emailRepliesSchema.ts` - Email replies, matching logs

### Core Users & Auth (3 tables)

**users** - User accounts synced from Clerk
- Fields: name, email, clerkId, firstName, lastName, imageUrl, bio, role, admin, isCreator, creatorSince, creatorLevel, creatorXP, creatorBadges, stripeConnectAccountId, stripeAccountStatus, stripeOnboardingComplete, discordUsername, discordId, dashboardPreference, instagram, tiktok, twitter, youtube, website
- Indexes: by_email, by_clerkId, by_discordId, by_isCreator

**learnerPreferences** - Student skill levels and interests
- Fields: userId, skillLevel (beginner/intermediate/advanced/professional), interests (array), goal (union), weeklyHours, onboardingCompletedAt
- Indexes: by_userId

**syncMetadata** - Clerk-Convex sync tracking
- Fields: type, lastSyncTime, totalClerkUsers, totalConvexUsers, usersAdded, usersUpdated, status
- Indexes: by_type

### Stores & Storefronts (1 table)

**stores** - Creator storefronts/profiles
- Fields: name, slug, description, userId, avatar, logoUrl, bannerImage, customDomain, domainStatus, bio, socialLinks, socialLinksV2, plan (FREE/STARTER/CREATOR/CREATOR_PRO/BUSINESS/EARLY_ACCESS), planStartedAt, isPublic, isPublishedProfile, stripeCustomerId, stripeSubscriptionId, subscriptionStatus, emailConfig, notificationIntegrations, copyrightStrikes, suspendedAt
- Indexes: by_userId, by_slug, by_plan, by_public

### Courses & Learning (6 tables)

**courses** - Course definitions
- Fields: userId, instructorId, storeId, title, description, imageUrl, price, isPublished, slug, category, subcategory, tags, skillLevel, stripeProductId, stripePriceId, followGateEnabled, followGateRequirements, followGateSocialLinks, isPinned
- Indexes: by_instructorId, by_slug, by_userId, by_storeId, by_published, by_category

**courseModules** - Course sections/modules
- Fields: title, description, position, courseId, dripEnabled, dripType, dripDaysAfterEnrollment, dripSpecificDate
- Indexes: by_courseId, by_position

**courseLessons** - Lessons within modules
- Fields: title, description, position, moduleId
- Indexes: by_moduleId, by_position

**courseChapters** - Individual content chapters
- Fields: title, description, videoUrl, position, isPublished, isFree, courseId, audioUrl, lessonId, muxAssetId, muxPlaybackId, videoDuration, generatedAudioUrl, generatedVideoUrl, audioGenerationStatus, videoGenerationStatus
- Indexes: by_courseId, by_lessonId, by_position, by_muxAssetId

**enrollments** - Student course enrollments
- Fields: userId, courseId, progress
- Indexes: by_userId, by_courseId, by_user_course

**courseReviews** - Course ratings and reviews
- Fields: courseId, userId, rating, title, reviewText, isVerifiedPurchase, isPublished, helpfulCount, instructorResponse
- Indexes: by_courseId, by_userId, by_published

### Digital Products (2 tables)

**digitalProducts** - All digital product types (130+ fields)
- Fields: title, slug, description, price, imageUrl, downloadUrl, storeId, userId, isPublished, productType (course/beat/preset/sample_pack/mixing_template/project_file/guide/coaching/service/plugin/community/chain/release/tip_jar/cheat_sheet), productCategory, followGateEnabled, beatLeaseConfig, releaseConfig, sampleIds, and 100+ product-type-specific fields
- Indexes: by_storeId, by_userId, by_productCategory, by_slug

**productReviews** - Product ratings
- Fields: productId, reviewText, rating, customerName
- Indexes: by_productId

### Purchases & Transactions (3 tables)

**purchases** - All purchase records
- Fields: userId, customerId, productId, courseId, bundleId, storeId, amount, currency, status (pending/completed/refunded/failed), paymentMethod, transactionId, productType, accessGranted, isPaidOut, payoutId
- Indexes: by_userId, by_customerId, by_productId, by_courseId, by_storeId, by_status, by_user_product, by_user_course

**customers** - Customer/contact profiles
- Fields: name, email, storeId, type (lead/paying/subscriber), status (active/inactive/churned), totalSpent, source, tags, daw, typeOfMusic, goals, score, opensEmail, clicksLinks
- Indexes: by_email, by_storeId, by_type, by_email_and_store

**fanCounts** - Aggregated fan/follower counts per store
- Fields: storeId, totalCount, leads, paying, subscriptions, lastUpdated
- Indexes: by_storeId

### Bundles (1 table)

**bundles** - Product bundles
- Fields: storeId, creatorId, name, slug, description, bundleType, courseIds, productIds, originalPrice, bundlePrice, discountPercentage, savings, isPublished, stripePriceId, followGateEnabled
- Indexes: by_store, by_creator, by_slug

### Memberships & Subscriptions (4 tables)

**subscriptions** (membershipSubscriptions) - Active subscriptions
- Fields: userId, storeId, planId, status, stripeSubscriptionId, currentPeriodStart, currentPeriodEnd, cancelAtPeriodEnd, billingCycle (monthly/yearly), amountPaid
- Indexes: by_user, by_store, by_plan, by_stripe_id

**subscriptionPlans** - Store-level subscription plans
- Fields: storeId, name, description, tier, monthlyPrice, yearlyPrice, features (array), courseAccess (array), hasAllCourses, digitalProductAccess, trialDays, isActive, stripePriceIdMonthly, stripePriceIdYearly
- Indexes: by_store, by_tier

**creatorSubscriptionTiers** - Creator membership tiers
- Fields: creatorId, storeId, tierName, slug, description, priceMonthly, priceYearly, stripePriceIdMonthly, stripePriceIdYearly, benefits (array), maxCourses, trialDays, subscriberCount, isActive
- Indexes: by_creatorId, by_storeId, by_active, by_slug

**userCreatorSubscriptions** - User-to-creator subscriptions
- Fields: userId, creatorId, tierId, storeId, status (active/cancelled/past_due/paused), stripeSubscriptionId, currentPeriodStart, currentPeriodEnd, cancelAtPeriodEnd
- Indexes: by_userId, by_creatorId, by_user_creator, by_status, by_stripe_id

### Monetization - Coupons (2 tables)

**coupons** - Discount codes
- Fields: code, storeId, creatorId, discountType (percentage/fixed), discountValue, applicableTo (all/courses/products/plans), specificCourseIds, maxUses, currentUses, validFrom, validUntil, isActive, firstTimeOnly
- Indexes: by_code, by_store, by_creator

**couponUsages** - Coupon usage tracking
- Fields: couponId, userId, orderId, discountApplied, usedAt
- Indexes: by_coupon, by_user

### Monetization - Affiliates (4 tables)

**affiliates** - Affiliate accounts
- Fields: affiliateUserId, storeId, creatorId, affiliateCode, commissionRate, commissionType, status (pending/active/suspended/rejected), totalClicks, totalSales, totalRevenue
- Indexes: by_affiliate_user, by_store, by_code

**affiliateClicks** - Click tracking
**affiliateSales** - Sale attribution
**affiliatePayouts** - Commission payouts

### Monetization - Payment Plans (2 tables)

**paymentPlans** - Installment payment plans
- Fields: userId, courseId, totalAmount, downPayment, numberOfInstallments, installmentAmount, frequency (weekly/biweekly/monthly), status
- Indexes: by_user, by_course

**installmentPayments** - Individual installment records

### Monetization - Refunds (1 table)

**refunds** - Refund requests and processing
- Fields: orderId, userId, storeId, itemType, originalAmount, refundAmount, refundType (full/partial), reason, status (requested/approved/denied/processed), stripeRefundId
- Indexes: by_order, by_user, by_store, by_status

### Monetization - Payouts (2 tables)

**creatorPayouts** - Creator earnings payouts
- Fields: creatorId, storeId, amount, grossRevenue, platformFee, paymentProcessingFee, netPayout, status, stripeTransferId
- Indexes: by_creator, by_store, by_status

**payoutSchedules** - Automatic payout schedules
- Fields: creatorId, frequency (weekly/biweekly/monthly), minimumPayout, nextPayoutDate
- Indexes: by_creator, by_next_payout

### Monetization - Trials & Upsells (3 tables)

**freeTrials** - Free trial tracking
**upsells** - Upsell offer configuration
**upsellInteractions** - Upsell conversion tracking

### Monetization - Tax & Currency (2 tables)

**taxRates** - Tax rate definitions by country/state
**currencyRates** - Currency exchange rates

### Beat Licensing (1 table)

**beatLicenses** - Beat lease contracts
- Fields: purchaseId, beatId, userId, tierType (basic/premium/exclusive/unlimited), tierName, price, distributionLimit, streamingLimit, commercialUse, stemsIncluded, creditRequired, deliveredFiles, contractGeneratedAt
- Indexes: by_purchase, by_user, by_beat, by_store

### Audio Samples & Packs (4 tables)

**audioSamples** - Individual audio samples
- Fields: userId, storeId, title, storageId, fileUrl, duration, format, bpm, key, genre, category, waveformData, creditPrice, isPublished, licenseType
- Indexes: by_userId, by_storeId, by_genre, by_category, by_published

**samplePacks** - Sample bundle packs
**sampleDownloads** - Download tracking
**sampleFavorites** - User favorites

### User Progress & Tracking (4 tables)

**userProgress** - Chapter-level completion tracking
- Fields: userId, courseId, moduleId, lessonId, chapterId, isCompleted, completedAt, timeSpent, progressPercentage
- Indexes: by_userId, by_courseId, by_user_chapter, by_user_course

**liveViewers** - Real-time viewer tracking
**librarySessions** - Learning session analytics
**courseNotes** - Student notes per chapter

### Lead Captures (3 tables)

**leadSubmissions** - Email capture form submissions
- Fields: name, email, productId, storeId, hasDownloaded, downloadCount, source
- Indexes: by_email, by_productId, by_storeId

**followGateSubmissions** - Social follow gate completions
- Fields: productId, storeId, creatorId, email, name, followedPlatforms, hasDownloaded
- Indexes: by_product, by_email, by_creator

**releasePreSaves** - Music presave registrations
- Fields: releaseId, storeId, email, platforms (spotify, apple, etc.), spotifyAccessToken, preSavedAt
- Indexes: by_release, by_email, by_creator

### Email Workflows & Automation (5 tables)

**emailWorkflows** - Visual email automation flows
- Fields: name, description, storeId, userId, isActive, isAdminWorkflow, sequenceType, trigger (object), nodes (array), edges (array), totalExecutions, avgOpenRate, avgClickRate
- Indexes: by_storeId, by_userId, by_active, by_isAdminWorkflow

**workflowTemplates** - Reusable workflow templates
**workflowGoalCompletions** - Workflow goal tracking
**workflowExecutions** - Workflow execution instances
**workflowNodeABTests** - A/B testing for workflow nodes

### Email Campaigns & Analytics (8 tables)

**resendCampaigns** - Email campaigns sent via Resend
- Fields: connectionId, templateId, name, subject, htmlContent, targetAudience, status (draft/scheduled/sending/sent/paused), recipientCount, sentCount, deliveredCount, openedCount, clickedCount, bouncedCount
- Indexes: by_connection, by_status, by_target

**resendConnections** - Resend API connections per store
**resendTemplates** - Email templates
**resendAutomations** - Automated email triggers
**resendLogs** - Email delivery logs
**resendAudienceLists** - Audience list management
**resendPreferences** - User email preferences
**resendImportedContacts** - Contact import batches

### Email Deliverability (5 tables)

**emailDeliverabilityEvents** - Bounce/spam/block events
**emailDeliverabilityStats** - Periodic deliverability scores
**emailDomainReputation** - Domain reputation tracking
**webhookEmailEvents** - Resend webhook events (opens, clicks, bounces)
**emailAlerts** - Deliverability alert notifications

### Email Domain Management (5 tables)

**emailDomains** - Configured sending domains
**emailDomainAnalytics** - Per-domain send metrics
**emailCreatorStats** - Creator-level email stats
**emailEvents** - Domain-level events
**emailDomainAlerts** - Domain health alerts

### Email Replies (2 tables)

**emailReplies** - Inbound email replies
- Fields: messageId, inReplyTo, fromEmail, subject, textBody, htmlBody, storeId, campaignId, status (unread/read/replied/archived), category
- Indexes: by_storeId, by_status, by_campaignId

**replyMatchingLog** - Reply-to-campaign matching debug logs

### Contacts & CRM (2 tables)

**contacts** - Full CRM contacts (Active Campaign style)
- Fields: storeId, connectionId, email, firstName, lastName, phone, tags (array), status (subscribed/unsubscribed/bounced/complained), score, totalPoints, source, importBatchId, city, state, country
- Indexes: by_storeId, by_email, by_storeId_and_email, by_status, by_score

**contactActivity** - Contact event timeline
- Fields: contactId, storeId, activityType, campaignId, description, pointsAdded
- Indexes: by_contactId, by_storeId, by_activityType

### Lead Scoring (3 tables)

**leadScoringRules** - Scoring rule definitions
**leadScoreHistory** - Score change log
**leadScoringSummary** - Aggregate score buckets per store

### Quizzes & Assessments (5 tables)

**quizzes** - Quiz definitions
- Fields: title, courseId, chapterId, quizType (multiple_choice/true_false/mixed), timeLimit, maxAttempts, passingScore, isPublished
- Indexes: by_course, by_instructor, by_chapter

**quizQuestions** - Quiz questions
**quizAttempts** - Student attempt records
**quizResults** - Best scores and pass/fail
**questionBanks** - Reusable question pools

### Q&A System (3 tables)

**questions** - Discussion questions per lesson
**answers** - Answers to questions
**qaVotes** - Upvote/downvote system

### Certificates (2 tables)

**certificates** - Earned course certificates
- Fields: userId, userName, courseId, courseTitle, instructorName, certificateId, completionDate, completionPercentage, pdfUrl, verificationCode, isValid
- Indexes: by_user, by_course, by_certificate_id, by_verification_code

**certificateVerifications** - Verification audit trail

### Coaching (2 tables)

**coachProfiles** - Coach profiles and availability
**coachingSessions** - Booked coaching sessions

### Analytics & Reporting (8 tables)

**userEvents** - User behavior events
**videoAnalytics** - Video watch data
**courseAnalytics** - Per-course daily metrics
**revenueAnalytics** - Revenue breakdowns
**studentProgress** - Student engagement scores
**chapterAnalytics** - Per-chapter performance
**learningStreaks** - Streak tracking
**recommendations** - AI-generated recommendations

### Web Analytics (5 tables)

**analyticsEvents** - Custom analytics events
**productViews** - Product page views
**revenueEvents** - Revenue attribution
**userSessions** - Session tracking
**webAnalyticsEvents** - Server-side analytics

### Social Media (5 tables)

**socialAccounts** - Connected social platform accounts
**scheduledPosts** - Queued social posts
**postAnalytics** - Social post performance
**socialWebhooks** - Social platform webhooks
**postTemplates** - Reusable post templates

### Automation Flows (4 tables)

**automationFlows** - Visual automation flows (Instagram DM, etc.)
**userAutomationStates** - Per-user automation state machines
**automationTriggers** - Trigger event logs
**automationMessages** - Sent automation messages

### Instagram & Social Automation (8 tables)

**integrations** - OAuth tokens for Instagram/Facebook
**automations** - Automation definitions
**triggers** - Keyword triggers
**keywords** - Trigger keywords
**listeners** - Automation response configs
**posts** - Instagram posts monitored
**chatHistory** - DM conversation history
**userSubscriptions** - Instagram automation subscriptions

### Discord Integration (3 tables)

**discordIntegrations** - User Discord connections
**discordGuilds** - Discord server configs
**discordEvents** - Discord event logs

### Music Sharing (8 tables)

**artistProfiles** - Artist showcase profiles
**musicTracks** - Shared music tracks
**trackPlays** - Play count tracking
**trackLikes** - Like tracking
**trackComments** - Track comments with timestamps
**artistFollows** - Artist follow relationships
**musicPlaylists** - User playlists
**playlistTracks** - Playlist track entries

### Curator Playlists (3 tables)

**curatorPlaylists** - Curator playlist definitions
**curatorPlaylistTracks** - Tracks in curator playlists
**trackSubmissions** - Playlist submission requests

### Landing Pages (3 tables)

**landingPages** - Custom landing pages
**landingPageAnalytics** - Page performance metrics
**landingPageTemplates** - Landing page templates

### Notes System (5 tables)

**noteFolders** - Note folder organization
**notes** - Rich text notes with AI features
**noteTemplates** - Note templates
**noteComments** - Note comments/collaboration
**noteSources** - Source materials for notes

### Credit System (3 tables)

**userCredits** - User credit balances
**creditTransactions** - Credit earn/spend log
**creditPackages** - Purchasable credit packs

### Gamification (3 tables)

**userAchievements** - Unlocked achievements
**userXP** - Experience points
**userNudges** - Conversion nudge tracking

### Additional Tables

**wishlists** - Product wishlists
**contentAccess** - Resource access control
**creatorEarnings** - Creator revenue tracking
**linkInBioLinks** - Link-in-bio entries
**linkClickAnalytics** - Link click tracking
**reports** - Content moderation reports
**notifications** - In-app notifications
**courseNotifications** - Course update notifications
**notificationPreferences** - Notification settings
**embeddings** - Vector embeddings for RAG
**audioFiles** - Uploaded audio files
**creatorPipeline** - Creator onboarding pipeline
**campaigns** - Marketing campaign definitions
**experiments** - A/B test experiments
**referrals** - Referral program tracking
**userTracks** - User-uploaded tracks
**showcaseProfiles** - Music showcase profiles

---

## 4. API Routes & Endpoints

### Authentication & Webhooks (7 routes)
| Route | Methods | Description |
|-------|---------|-------------|
| `/api/webhooks/clerk` | POST | Clerk webhook: user.created, user.updated, user.deleted |
| `/api/webhooks/stripe` | POST | Stripe webhook: 10 event types (checkout, subscription, invoice, etc.) |
| `/api/webhooks/stripe-library` | POST, GET | Stripe Library webhook handler |
| `/api/webhooks/resend` | POST, GET | Resend email webhooks (bounces, opens, clicks) |
| `/api/webhooks/resend/inbox` | POST, GET | Resend inbound email webhook |
| `/api/auth/discord/callback` | GET | Discord OAuth callback |
| `/api/sync-user` | GET | Sync Clerk user to Convex database |

### AI & Content Generation (8 routes)
| Route | Methods | Description |
|-------|---------|-------------|
| `/api/ai/chat` | POST, GET | Streaming AI chat with multi-stage pipeline |
| `/api/ai/course-builder` | POST | AI course outline generation |
| `/api/generate-audio` | POST | ElevenLabs text-to-speech |
| `/api/generate-video` | POST | AI video generation |
| `/api/generate-content` | POST | AI content creation |
| `/api/generate-thumbnail` | POST | AI thumbnail generation |
| `/api/generate-bio` | POST | AI bio/description generator |
| `/api/admin/generate-course` | POST | Admin-only AI course generation |

### Course Operations (8 routes)
| Route | Methods | Description |
|-------|---------|-------------|
| `/api/courses/by-slug/[slug]` | GET | Get public course by slug |
| `/api/courses/by-user/[userId]` | GET | Get user's published courses |
| `/api/courses/create-checkout-session` | POST | Stripe checkout session for courses |
| `/api/courses/purchase` | POST | Create payment intent for course |
| `/api/courses/verify-session` | POST | Verify checkout completion |
| `/api/courses/payment-success` | POST | Post-purchase enrollment |
| `/api/courses/send-enrollment-email` | POST | Send enrollment confirmation |
| `/api/courses/sync-to-stripe` | POST | Sync course to Stripe products |

### Product Checkout (11 routes)
| Route | Methods | Description |
|-------|---------|-------------|
| `/api/products/create-checkout-session` | POST | Generic product checkout |
| `/api/bundles/create-checkout-session` | POST | Bundle purchase checkout |
| `/api/beats/create-checkout-session` | POST | Beat lease checkout |
| `/api/coaching/create-checkout-session` | POST | Coaching session checkout |
| `/api/memberships/create-checkout-session` | POST | Membership checkout |
| `/api/memberships/verify-session` | POST | Membership verification |
| `/api/credits/create-checkout-session` | POST | Credit pack checkout |
| `/api/submissions/create-checkout-session` | POST | Playlist submission checkout |
| `/api/tips/create-checkout-session` | POST | Tip/donation checkout |
| `/api/subscriptions/create-checkout` | POST | Subscription checkout |
| `/api/mixing-service/create-checkout-session` | POST | Mixing service checkout |

### Beat Licensing (2 routes)
| Route | Methods | Description |
|-------|---------|-------------|
| `/api/beats/contract` | GET | Generate beat lease contract PDF |
| `/api/beats/download` | GET | Download licensed beat files |

### Creator Plans & Stripe Connect (5 routes)
| Route | Methods | Description |
|-------|---------|-------------|
| `/api/creator-plans/create-checkout` | POST | Creator plan subscription |
| `/api/creator-plans/billing-portal` | POST | Stripe Customer Portal |
| `/api/stripe/connect/create-account` | POST | Initialize Stripe Connect |
| `/api/stripe/connect/onboarding-link` | POST | Get Connect onboarding URL |
| `/api/stripe/connect/account-status` | POST | Check Connect account status |

### Follow Gates & Social OAuth (14 routes)
| Route | Methods | Description |
|-------|---------|-------------|
| `/api/follow-gate/instagram` | GET | Instagram follow redirect |
| `/api/follow-gate/instagram/callback` | GET | Instagram callback |
| `/api/follow-gate/spotify` | GET | Spotify follow redirect |
| `/api/follow-gate/spotify/callback` | GET | Spotify callback |
| `/api/follow-gate/youtube` | GET | YouTube follow redirect |
| `/api/follow-gate/youtube/callback` | GET | YouTube callback |
| `/api/follow-gate/tiktok` | GET | TikTok follow redirect |
| `/api/follow-gate/tiktok/callback` | GET | TikTok callback |
| `/api/follow-gate/send-download-email` | POST | Send download link email |
| `/api/social/oauth/[platform]/callback` | GET | Generic social OAuth |
| `/api/social/oauth/[platform]/select-account` | GET | Account selection |
| `/api/social/oauth/[platform]/save-selected` | POST | Save selected account |
| `/api/social/webhooks/[platform]` | POST, GET | Social webhooks |
| `/api/instagram-webhook` | GET, POST | Instagram webhook |

### Music Presaves (4 routes)
| Route | Methods | Description |
|-------|---------|-------------|
| `/api/presave/spotify/authorize` | GET | Spotify presave auth |
| `/api/presave/spotify/callback` | GET | Spotify presave callback |
| `/api/presave/apple-music/token` | GET | Apple Music token |
| `/api/presave/apple-music/add` | POST | Add to Apple Music |

### Media & Files (6 routes)
| Route | Methods | Description |
|-------|---------|-------------|
| `/api/audio/[filename]` | GET | Audio file serving |
| `/api/mux/upload` | POST, GET | Mux video upload |
| `/api/mux/webhook` | POST, GET | Mux webhook |
| `/api/illustrations/[courseId]` | GET | Course illustrations |
| `/api/elevenlabs/voices` | GET, POST | TTS voice management |
| `/api/uploadthing` | Various | UploadThing handler |

### Other (8 routes)
| Route | Methods | Description |
|-------|---------|-------------|
| `/api/unsubscribe` | POST, GET | Email unsubscribe |
| `/api/lead-magnets/generate-pdf` | POST | Generate lead magnet PDF |
| `/api/lead-magnet-analysis/[id]` | GET | Lead magnet analytics |
| `/api/admin/migrate` | POST, GET | Data migration |
| `/api/verify-payment` | POST | Payment verification |
| `/api/analytics/track` | POST | Analytics tracking |
| `/api/github/commits` | GET, POST | GitHub commits |
| `/api/payouts/request` | POST | Creator payout request |

### Convex Backend Functions (~400+ functions)

Organized across 150+ files:

**User & Auth**: getUserFromClerk, createOrUpdateUserFromClerk, getUserById, updateUserByClerkId, updateUserStripeConnectId
**Stores**: getStoresByUser, getStoreBySlug, createStore, updateStore, updateStoreCustomDomain
**Courses**: getCourses, getCourseBySlug, getCoursesByUser, createCourse, updateCourse, publishCourse, deleteCourse
**Content**: getModulesByCourse, getLessonsByCourse, createModule, createLesson, updateLesson
**Products**: getProductById, getProductsByStore, searchProducts, createSample, createSamplePack
**Purchases**: createPurchase, getPurchasesForCustomer, createSubscription, requestRefund, processRefund
**Creator Plans**: getStorePlan, checkFeatureAccess, upgradePlan, adminSetStorePlan (6 tiers: FREE $0, STARTER $12/mo, CREATOR $29/mo, CREATOR_PRO $79/mo, BUSINESS $149/mo, EARLY_ACCESS)
**Email**: getCampaigns, createCampaign, sendCampaign, getEmailSegments, createSegment, logEmailEvent
**Workflows**: getAutomations, createAutomation, createDripCampaign
**Drip Feed**: getCourseDripSettings, isModuleAccessible, processPendingDripUnlocks (internal cron)
**Certificates**: getUserCertificates, generateCertificate, verifyCertificate
**Analytics**: trackPageView, trackEvent, getCreatorAnalytics, getRevenueReport
**Notifications**: getUserNotifications, markNotificationRead, sendNotification (internal)
**Social**: connectSocialAccount, publishPost, syncFollowerCount (internal cron)
**Notes**: getSources, insertNoteSource, getUserMemories, createMemory
**AI**: getConversations, addMessage, getAgents, createAgent
**Coaching**: getCoachingProducts, scheduleSession, cancelSession
**Music**: createArtistProfile, addTrackFromUrl, trackPlay, toggleTrackLike, toggleArtistFollow
**Blog**: getBlogPosts, createBlogPost, publishBlogPost
**Coupons**: getCoupons, createCoupon, validateCoupon, applyCoupon
**Landing Pages**: getLandingPages, createLandingPage, trackPageView, trackConversion
**Affiliates**: getAffiliateProgram, applyToAffiliate, getAffiliateStats
**Reports**: createReport, getReports (admin), markAsReviewed
**Leaderboards**: getCourseLeaderboard, getGlobalLeaderboard, getUserRank
**Conversion**: getActiveNudges, dismissNudge, checkConversionTriggers (internal)

---

## 5. Pages & Routes

### Summary
- **Total Pages**: 184
- **Protected (dashboard/admin)**: ~130
- **Public**: ~54
- **All pages are client components** (`"use client"`)

### Public Routes

**Homepage & Legal**: `/` (marketplace overview), `/privacy-policy`, `/terms-of-service`, `/dmca`, `/for-creators`, `/become-a-coach`

**Authentication**: `/sign-in/[[...sign-in]]`, `/sign-up/[[...sign-up]]`

**Marketplace** (14+ categories): `/marketplace`, `/marketplace/beats`, `/marketplace/courses`, `/marketplace/plugins`, `/marketplace/preset-packs`, `/marketplace/project-files`, `/marketplace/samples`, `/marketplace/guides`, `/marketplace/mixing-templates`, `/marketplace/mixing-services`, `/marketplace/coaching`, `/marketplace/bundles`, `/marketplace/memberships`, `/marketplace/creators`, `/marketplace/products/[slug]`

**Courses**: `/courses`, `/courses/[slug]` (landing page), `/courses/[slug]/checkout`, `/courses/[slug]/lessons/[lessonId]/chapters/[chapterId]` (player)

**Creator Storefronts**: `/[slug]` (catch-all), `/[slug]/courses/[courseSlug]`, `/[slug]/beats/[beatSlug]`, `/[slug]/bundles/[bundleSlug]`, `/[slug]/memberships/[membershipSlug]`, `/[slug]/products/[productSlug]`, `/[slug]/tips/[tipSlug]`, `/[slug]/p/[pageSlug]`

**Content**: `/blog`, `/blog/[slug]`, `/artist/[slug]`, `/playlists`, `/playlists/[slug]`, `/leaderboards`, `/verify/[certificateId]`

### Protected Dashboard Routes (60+)

**Core**: `/dashboard`, `/dashboard/profile`, `/dashboard/settings`, `/dashboard/settings/domains`, `/dashboard/settings/integrations`, `/dashboard/settings/payouts`

**Products**: `/dashboard/products`, `/dashboard/create` (hub), `/dashboard/create/course`, `/dashboard/create/coaching`, `/dashboard/create/beat-lease`, `/dashboard/create/mixing-template`, `/dashboard/create/pack`, `/dashboard/create/project-files`, `/dashboard/create/pdf`, `/dashboard/create/playlist-curation`, `/dashboard/create/service`, `/dashboard/create/chain`, `/dashboard/create/membership`, `/dashboard/create/blog`, `/dashboard/create/bundle`, `/dashboard/create/digital`, `/dashboard/create/release`, `/dashboard/create/sample`, `/dashboard/create/tip-jar`, `/dashboard/create/cheat-sheet`, `/dashboard/create/community`

**Email Marketing**: `/dashboard/emails`, `/dashboard/emails/setup`, `/dashboard/emails/campaigns`, `/dashboard/emails/sequences`, `/dashboard/emails/leads`, `/dashboard/emails/subscribers`, `/dashboard/emails/contacts/[contactId]`, `/dashboard/emails/segments`, `/dashboard/emails/analytics`, `/dashboard/emails/deliverability`, `/dashboard/emails/health`, `/dashboard/emails/workflows`

**Social Media**: `/dashboard/social`, `/dashboard/social/profiles`, `/dashboard/social/calendar/[profileId]`, `/dashboard/social/create`, `/dashboard/social/library`, `/dashboard/social/automation`

**Learning**: `/dashboard/certificates`, `/dashboard/coaching`, `/dashboard/coaching/sessions`

**Other**: `/dashboard/analytics`, `/dashboard/messages`, `/dashboard/my-orders`, `/dashboard/downloads`, `/dashboard/samples`, `/dashboard/memberships`, `/dashboard/notes`, `/dashboard/landing-pages`, `/dashboard/students`, `/dashboard/affiliates`, `/dashboard/copyright`

### Admin Routes (40+)

`/admin`, `/admin/analytics`, `/admin/activity`, `/admin/ai`, `/admin/ai-flywheel`, `/admin/changelog`, `/admin/communications`, `/admin/content-generation`, `/admin/conversions`, `/admin/course-builder`, `/admin/courses`, `/admin/creators`, `/admin/drip-campaigns`, `/admin/email-analytics`, `/admin/email-monitoring`, `/admin/emails`, `/admin/embeddings`, `/admin/feature-discovery`, `/admin/finance`, `/admin/generate-samples`, `/admin/lead-magnets/cheat-sheets`, `/admin/management`, `/admin/marketing`, `/admin/migrate-stores`, `/admin/moderation`, `/admin/notifications`, `/admin/plugins`, `/admin/products`, `/admin/revenue`, `/admin/seed-credits`, `/admin/settings`, `/admin/sync`, `/admin/users`

---

## 6. Key Features

### Course Platform
- Full course hierarchy: Course > Modules > Lessons > Chapters
- Mux-powered video/audio player with progress tracking
- Drip-feed content scheduling (time-based or date-based unlock)
- Chapter-level completion tracking with progress percentages
- Course certificates issued at 100% completion (PDF generation)
- Follow gate system (require social follow before access to free content)
- Quiz/assessment system with multiple question types
- Q&A discussion system per lesson
- Course notes system per chapter
- Course reviews and ratings

### Creator Marketplace
- 14+ product subcategories (beats, presets, samples, plugins, project files, guides, mixing templates, coaching, etc.)
- Creator storefronts with custom slugs (and custom domain support)
- Product bundles with combined discounts
- Membership tiers per creator (monthly/yearly)
- Follow gate for free product downloads
- Product pinning and featuring
- Coupon/discount code system
- Affiliate program with click tracking and commission payouts
- Referral program
- Payment plans (installments)

### Payment System
- Stripe Checkout (hosted) for all product types
- Stripe Connect for creator payouts (90/10 split - 10% platform fee)
- 6 creator plan tiers: Free, Starter ($12/mo), Creator ($29/mo), Creator Pro ($79/mo), Business ($149/mo), Early Access
- Dynamic Stripe product/price creation per checkout
- Webhook handling for 10+ Stripe events
- Billing portal for subscription management
- Credit system (purchasable credits for sample downloads)

### Email Marketing System
- Resend-powered transactional emails (13+ types: welcome, enrollment, payment, coaching, certificates)
- Full campaign system with draft/schedule/send flow
- Visual email workflow builder (ReactFlow-based)
- 18+ workflow trigger types (enrollment, purchase, completion, drip, etc.)
- A/B testing for subject lines and content
- Email segmentation with dynamic conditions
- Lead scoring (hot/warm/cold/inactive)
- Contact CRM with activity timeline
- Email deliverability monitoring (bounce rates, spam rates, health scores)
- Custom domain email setup with DNS verification
- Inbound email reply tracking
- CAN-SPAM compliant unsubscribe system (HMAC-SHA256 signed tokens, RFC 8058)
- 14 React Email templates

### AI System
- Multi-agent AI system (masterAI module with 15+ specialized agents)
- AI chat assistant with streaming responses
- AI course builder (full outline generation)
- AI content generation (thumbnails, descriptions, bios)
- ElevenLabs text-to-speech for audio content
- Fal.ai for video/image generation
- RAG pipeline with vector embeddings (Convex RAG)
- AI note generation from sources (YouTube, URLs)
- Social media script generator with virality scoring

### Social Media Management
- Multi-platform account connection (Instagram, YouTube, TikTok, Spotify, Facebook)
- Content calendar with scheduling
- Social post composer with multi-platform support
- Instagram DM automation (keyword triggers, AI responses)
- Social analytics and engagement tracking
- Post template library

### Gamification
- XP and leveling system
- Achievement unlocking
- Learning streaks
- Course and global leaderboards
- Conversion nudges (become creator, complete course, etc.)

### Other Features
- Music showcase (artist profiles, track sharing, playlists)
- Curator playlist submissions
- Beat licensing with PDF contract generation
- Coaching sessions with Discord integration
- Landing page builder
- Blog/content management
- Discord integration (role-based access)
- Content moderation and copyright claims (DMCA)
- Custom domain routing
- Collaborative notes (Notion-like editor)

---

## 7. External Integrations

| Service | Purpose | Config Location |
|---------|---------|----------------|
| **Clerk** | Authentication, user management | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` |
| **Convex** | Real-time database, file storage, crons | `CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_URL` |
| **Stripe** | Payments, Connect, subscriptions | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| **Resend** | Transactional & campaign email | `RESEND_API_KEY` |
| **Mux** | Video hosting, streaming, processing | `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET` |
| **UploadThing** | File uploads | `UPLOADTHING_SECRET`, `UPLOADTHING_APP_ID` |
| **OpenAI** | GPT for content generation | `OPENAI_API_KEY` |
| **ElevenLabs** | Text-to-speech audio | `ELEVENLABS_API_KEY` |
| **Fal.ai** | AI image/video generation | (API key in env) |
| **Upstash Redis** | Rate limiting | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| **Discord** | Community integration, role assignment | `DISCORD_BOT_TOKEN`, `DISCORD_GUILD_ID` |
| **Instagram** | Follow gate, DM automation | OAuth tokens stored in `integrations` table |
| **Spotify** | Follow gate, presaves | OAuth flow via `/api/follow-gate/spotify` |
| **YouTube** | Follow gate | OAuth flow via `/api/follow-gate/youtube` |
| **TikTok** | Follow gate | OAuth flow via `/api/follow-gate/tiktok` |
| **Apple Music** | Presaves | MusicKit JS via `/api/presave/apple-music` |
| **Facebook** | Social integration | `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` |
| **Vercel** | Hosting, analytics | `@vercel/analytics` |
| **GitHub** | Changelog integration | `/api/github/commits` |

---

## 8. Email System

### Architecture
- **Provider**: Resend (resend.com)
- **Templates**: React Email (`/emails/templates/`)
- **Sending Logic**: `lib/email.ts` (1,573 lines)
- **FROM_EMAIL**: `PPR Academy <no-reply@mail.pauseplayrepeat.com>`
- **Campaign System**: Creator-level campaigns via Convex (`resendCampaigns`)
- **Workflow Engine**: Visual builder with ReactFlow (`emailWorkflows`)
- **CAN-SPAM**: Physical address in footer, signed unsubscribe links

### Transactional Email Types (13+)
1. `sendWelcomeEmail` - New user onboarding
2. `sendLeadMagnetEmail` - Lead magnet download link
3. `sendCourseEnrollmentEmail` - Course enrollment confirmation
4. `sendPaymentFailureEmail` - Failed payment notification
5. `sendMembershipConfirmationEmail` - Membership activation
6. `sendDigitalProductPurchaseEmail` - Product purchase receipt
7. `sendBeatPurchaseEmail` - Beat license delivery
8. `sendBundlePurchaseEmail` - Bundle purchase receipt
9. `sendTipConfirmationEmail` - Tip receipt
10. `sendCoachingConfirmationEmail` - Coaching booking confirmation
11. `sendCreditsPurchaseEmail` - Credit pack receipt
12. `sendMixingServiceEmail` - Mixing service confirmation
13. `sendPlaylistSubmissionEmail` - Playlist submission receipt
14. `sendCoachingReminderEmail` - 24h coaching reminder

### React Email Templates (14)
- WelcomeEmail, EnrollmentEmail, CompletionEmail, ProgressReminderEmail
- LaunchAnnouncementEmail, WeeklyDigestEmail
- CoachingBookingConfirmationEmail, CoachingNewBookingEmail, CoachingSessionReminderEmail
- CertificateEmail
- CopyrightClaimNoticeEmail, CopyrightClaimReceivedEmail, CopyrightClaimResolvedEmail, CopyrightStrikeEmail

### Email Workflow Triggers (18+)
- new_subscriber, tag_added, tag_removed
- course_enrolled, course_completed, lesson_completed, quiz_passed
- product_purchased, bundle_purchased
- subscription_created, subscription_cancelled, subscription_renewed
- cart_abandoned, form_submitted
- date_triggered, webhook_received, custom_event, page_visited

### Deliverability Features
- Domain reputation monitoring
- Bounce/spam tracking with auto-suppression
- Email health scoring
- Creator-level sending limits
- Bulk suppression for hard bounces and spam complaints

---

## 9. Payment System

### Stripe Configuration
- **Mode**: Test mode (sk_test_*)
- **Webhook Events Handled**: account.updated, payment_intent.succeeded, checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.payment_succeeded, invoice.payment_failed, payment_intent.payment_failed, transfer.created

### Product Types Supporting Checkout (11)
1. Course (one-time purchase)
2. Membership (monthly/yearly subscription)
3. Digital Product (download)
4. Bundle (grouped products)
5. Beat License (tiered licensing)
6. Credit Pack (virtual currency)
7. Playlist Submission (review fee)
8. Mixing Service (service)
9. Coaching Session (booking)
10. Tip/Donation (variable amount)
11. Creator Plan (SaaS subscription)

### Checkout Flow
1. User clicks purchase on product page
2. Frontend calls `/api/{productType}/create-checkout-session`
3. Server creates Stripe Checkout Session with dynamic product/price
4. User redirected to Stripe Hosted Checkout
5. On completion, webhook fires `checkout.session.completed`
6. Webhook handler identifies product type from metadata
7. Convex mutations create purchase, grant access, send email
8. Post-checkout verification endpoint as webhook fallback

### Creator Monetization
- **Platform Fee**: 10% on all creator transactions
- **Stripe Connect**: Standard Connect accounts
- **Payout Split**: 90% creator / 10% platform
- **Creator Plans**: 6 tiers from Free to Business ($149/mo)
- **Supported Revenue Streams**: Course sales, memberships, digital products, beat licenses, coaching, tips, sample packs, mixing services

### Creator Plan Tiers
| Plan | Price | Key Limits |
|------|-------|-----------|
| FREE | $0/mo | 5 links, 3 products, 0 email sends |
| STARTER | $12/mo | 15 links, 10 products, 1,000 emails |
| CREATOR | $29/mo | 50 links, 25 products, 5,000 emails |
| CREATOR_PRO | $79/mo | Unlimited links, 100 products, 25,000 emails |
| BUSINESS | $149/mo | Unlimited everything, custom domain |
| EARLY_ACCESS | Free forever | Same as CREATOR features |

---

## 10. Known Issues & TODOs

### Bugs & Missing Implementations

**P0 (Critical)**
- No platform-level "PPR Pro" membership exists - the codebase is built as a creator marketplace where each creator sets their own membership pricing, not a single platform subscription
- No fixed-price $9 individual course checkout - courses use creator-set pricing
- `invoice.payment_failed` webhook handler only logs the error, does not call `sendPaymentFailureEmail()`
- Static OG images referenced in metadata (`/og-image.png`, `/og-courses.png`, `/og-blog.png`) do not exist in `/public/`

**P1 (Important)**
- Welcome email (`sendWelcomeEmail`) is defined but not triggered in the Clerk webhook handler
- No subscription-cancelled email template or trigger
- Homepage `app/page.tsx` uses `export const dynamic = "force-dynamic"` and `"use client"` which prevents static generation (SEO impact)
- Course player tabs (Transcript, Notes, Discussion) are visual shells without full functionality
- No public-facing pricing page for end consumers (only creator plan pricing exists)

**P2 (Enhancement)**
- Duplicate Stripe webhook secrets between `.env` and `.env.local`
- No dedicated onboarding flow for new students (learnerPreferences table exists but no UI collects data)
- No courses exist in the database yet

### TODO Comments in Codebase (19 found)
- Social webhook analytics not yet connected
- Beat payment integration incomplete
- Email workflow integration pending for some triggers
- Real-time alerts need full implementation
- Store setup wizard needs updates
- Post-setup guidance checks incomplete
- Several `// TODO` markers for future API integrations

---

## 11. File Inventory

### Key Configuration Files
| File | Purpose |
|------|---------|
| `package.json` | Dependencies, scripts |
| `tsconfig.json` | TypeScript configuration |
| `next.config.mjs` | Next.js configuration |
| `tailwind.config.ts` | Tailwind CSS config |
| `convex.json` | Convex project config |
| `middleware.ts` | Route protection, custom domains, CORS |
| `.env.local` | Environment variables (dev) |
| `.env` | Environment variables (shared) |
| `convex/schema.ts` | Main database schema |
| `convex/crons.ts` | Background job schedules |
| `convex/http.ts` | HTTP API endpoints |
| `app/layout.tsx` | Root layout with metadata |
| `app/sitemap.ts` | Dynamic sitemap generation |
| `app/robots.ts` | Search engine directives |

### Route Protection (middleware.ts)
Protected routes require Clerk authentication:
- `/dashboard(.*)`
- `/library(.*)`
- `/home(.*)`
- `/courses/create(.*)`
- `/api/courses/create(.*)`
- `/api/user(.*)`
- `/profile(.*)`

Redirects:
- `/home` -> `/dashboard?mode=create`
- `/library/courses/*` -> `/dashboard/courses/*`

### File Counts by Directory
| Directory | Files | Description |
|-----------|-------|-------------|
| `app/` | 184 pages + layouts + components | All Next.js pages |
| `app/api/` | 70+ route files | API endpoints |
| `app/_components/` | 21 files | Homepage components |
| `components/` | 200+ files in 42 subdirectories | Shared UI components |
| `components/ui/` | 60+ files | shadcn/ui base components |
| `convex/` | 150+ files | Backend functions |
| `lib/` | 30+ files + subdirectories | Business logic |
| `hooks/` | 13 files | Custom React hooks |
| `emails/` | 14 templates + layout | Email templates |
| `scripts/` | 9 files | Utility scripts |
| `shared/` | 1 file | Cross-cutting utilities |

### Critical Business Logic Files
| File | Lines | Purpose |
|------|-------|---------|
| `lib/email.ts` | ~1,573 | All transactional email sending |
| `app/api/webhooks/stripe/route.ts` | ~800+ | Stripe webhook handler (10 events, 11 product types) |
| `convex/courseAccess.ts` | ~500+ | Course access logic (free, purchased, membership, follow gate) |
| `convex/creatorPlans.ts` | ~400+ | Creator plan tiers and feature gating |
| `convex/schema.ts` | ~3,000+ | Main database schema (100+ tables) |
| `middleware.ts` | ~150 | Route protection, custom domains |
| `lib/unsubscribe.ts` | ~100 | HMAC unsubscribe token generation |
| `app/api/webhooks/clerk/route.ts` | ~200 | User sync from Clerk to Convex |

---

## Appendix: Environment Variables

### Required for Development
```
CONVEX_DEPLOYMENT=dev:fastidious-snake-859
NEXT_PUBLIC_CONVEX_URL=https://fastidious-snake-859.convex.cloud
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
OPENAI_API_KEY=sk-proj-...
ELEVENLABS_API_KEY=sk_...
RESEND_API_KEY=re_...
UPLOADTHING_SECRET=sk_live_...
UPLOADTHING_APP_ID=...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
MUX_TOKEN_ID=...
MUX_TOKEN_SECRET=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_CLERK_ID=user_...
UNSUBSCRIBE_SECRET=...
```

### Optional/Feature-Specific
```
DISCORD_BOT_TOKEN=...
DISCORD_GUILD_ID=...
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
FACEBOOK_APP_ID=...
FACEBOOK_APP_SECRET=...
TAVILY_API_KEY=...
NODE_ENV=development
```

# Database Schema Reference

> **Last Updated:** 2026-02-19
> **Pass:** 2 — Updated with cheat sheet & reference PDF schema additions
> **Source:** `convex/schema.ts` (7,020+ lines)
> **Total Tables:** ~196 (includes tables from imported schema modules)

---

## Table of Contents

- [Schema Architecture](#schema-architecture)
- [1. Users & Authentication](#1-users--authentication)
- [2. Courses & Learning](#2-courses--learning)
- [3. Stores & E-Commerce](#3-stores--e-commerce)
- [4. Digital Products](#4-digital-products)
- [5. Purchases & Transactions](#5-purchases--transactions)
- [6. Subscriptions & Memberships](#6-subscriptions--memberships)
- [7. Email Marketing & Automation](#7-email-marketing--automation)
- [8. Email Deliverability & Health](#8-email-deliverability--health)
- [9. Lead Scoring & Segmentation](#9-lead-scoring--segmentation)
- [10. Webhooks & Custom Events](#10-webhooks--custom-events)
- [11. Lead Generation & Follow Gates](#11-lead-generation--follow-gates)
- [12. Customer Management](#12-customer-management)
- [13. Analytics & Tracking](#13-analytics--tracking)
- [14. Gamification & Achievements](#14-gamification--achievements)
- [15. AI & Conversations](#15-ai--conversations)
- [16. AI Content Generation](#16-ai-content-generation)
- [17. Social Media](#17-social-media)
- [18. ManyChat-Style Automation](#18-manychat-style-automation)
- [19. Music & Audio](#19-music--audio)
- [20. Coaching & Services](#20-coaching--services)
- [21. Certificates & Q&A](#21-certificates--qa)
- [22. Notes & Content](#22-notes--content)
- [23. Blog & Plugins](#23-blog--plugins)
- [24. Landing Pages](#24-landing-pages)
- [25. Direct Messaging](#25-direct-messaging)
- [26. Video Generation](#26-video-generation)
- [27. Platform Admin](#27-platform-admin)
- [28. PPR Pro](#28-ppr-pro)
- [29. Email Queue](#29-email-queue)
- [30. Imported Schema Modules](#30-imported-schema-modules)

---

## Schema Architecture

The schema is defined in `convex/schema.ts` with additional tables imported from:
- `./monetizationSchema` — Monetization-related tables
- `./emailSchema` — Email system tables
- `./emailDomainSchema` — Email domain management tables
- `./emailRepliesSchema` — Email reply handling tables

**Conventions:**
- User IDs are Clerk `clerkId` strings (not Convex document IDs) unless explicitly typed as `v.id("tableName")`
- Timestamps are Unix milliseconds (`v.number()`)
- Soft deletes use `deletedAt` timestamp fields
- Many tables use `storeId: v.string()` for multi-tenant scoping
- `_creationTime` is automatically added by Convex to all documents

---

## 1. Users & Authentication

### `users`
Primary user table synced from Clerk.

| Field | Type | Description |
|-------|------|-------------|
| name | string? | Full name |
| email | string? | Email address |
| clerkId | string? | Clerk authentication ID (primary identifier) |
| firstName | string? | First name |
| lastName | string? | Last name |
| imageUrl | string? | Profile image URL |
| admin | boolean? | Platform admin flag |
| role | "AGENCY_OWNER" \| "AGENCY_ADMIN" \| "SUBACCOUNT_USER" \| "SUBACCOUNT_GUEST"? | Agency role |
| dashboardPreference | "learn" \| "create"? | Default dashboard mode |
| isCreator | boolean? | Has created a store |
| creatorSince | number? | Timestamp became creator |
| creatorLevel | number? | Creator level (1-10+) |
| creatorXP | number? | XP earned from creating |
| creatorBadges | string[]? | Creator-specific badges |
| bio | string? | Profile biography |
| instagram, tiktok, twitter, youtube, website | string? | Social links |
| stripeConnectAccountId | string? | Stripe Connect account |
| stripeAccountStatus | "pending" \| "restricted" \| "enabled"? | Connect status |
| stripeOnboardingComplete | boolean? | Connect setup done |
| discordUsername, discordId | string? | Discord integration |

**Indexes:** `by_email`, `by_clerkId`, `by_discordId`, `by_isCreator`

### `learnerPreferences`
Onboarding data for personalized learning.

| Field | Type | Description |
|-------|------|-------------|
| userId | string | Clerk ID |
| skillLevel | "beginner" \| "intermediate" \| "advanced" | Self-assessed skill |
| interests | string[] | e.g., ["mixing", "mastering", "sound_design"] |
| goal | "hobby" \| "career" \| "skills" \| "certification" | Learning goal |
| weeklyHours | number? | Hours per week committed |
| onboardingCompletedAt | number? | Completion timestamp |

**Indexes:** `by_userId`

### `syncMetadata`
Tracks Clerk sync operations.

**Indexes:** `by_type`

### `notifications`
User notification records.

| Field | Type | Description |
|-------|------|-------------|
| userId | string | Clerk ID of recipient |
| title, message | string | Notification content |
| type | "info" \| "success" \| "warning" \| "error" | Notification type |
| read | boolean | Read status |
| link | string? | Clickable action URL |
| senderType | "platform" \| "creator" \| "system"? | Source type |
| senderId | string? | Clerk ID of sender |

**Indexes:** `by_userId`, `by_createdAt`

### `courseNotifications`
Course update notifications sent by creators to enrolled students.

**Indexes:** `by_courseId`, `by_creatorId`, `by_sentAt`
**References:** `courses`

### `notificationPreferences`
Per-user notification settings with email and in-app categories.

**Indexes:** `by_userId`

---

## 2. Courses & Learning

### `courses`
Core course table.

| Field | Type | Description |
|-------|------|-------------|
| userId | string | Creator's Clerk ID |
| instructorId | string? | Instructor Clerk ID |
| storeId | string? | Associated store |
| title | string | Course title |
| description | string? | Course description |
| imageUrl | string? | Cover image |
| price | number? | Price in dollars |
| isPublished | boolean? | Publication status |
| slug | string? | URL slug |
| category | string? | Top-level category |
| subcategory | string? | Specific subcategory |
| tags | string[]? | 2-5 search tags |
| skillLevel | string? | Difficulty level |
| followGateEnabled | boolean? | Social follow gate |
| followGateRequirements | object? | Platform-specific requirements |
| followGateSteps | array? | Multi-step follow sequence |
| followGateSocialLinks | object? | Creator social links for gates |
| referencePdfStorageId | string? | AI-generated reference PDF |
| referencePdfUrl | string? | Reference PDF URL |
| referencePdfGeneratedAt | number? | When reference PDF was generated |
| stripeProductId | string? | Synced Stripe product |
| stripePriceId | string? | Synced Stripe price |
| isPinned | boolean? | Pinned in storefront |
| deletedAt | number? | Soft delete timestamp |

**Indexes:** `by_instructorId`, `by_slug`, `by_categoryId`, `by_userId`, `by_storeId`, `by_published`, `by_instructor_published`, `by_category`, `by_category_subcategory`

### `courseCategories`
Category definitions.

**Indexes:** `by_name`

### `courseModules`
Course modules with drip scheduling.

| Field | Type | Description |
|-------|------|-------------|
| title | string | Module title |
| position | number | Sort order |
| courseId | string | Parent course |
| dripEnabled | boolean? | Drip scheduling active |
| dripType | "days_after_enrollment" \| "specific_date" \| "after_previous"? | Drip mode |
| dripDaysAfterEnrollment | number? | Days delay |
| dripSpecificDate | number? | Specific unlock date |
| dripNotifyStudents | boolean? | Email on unlock |

**Indexes:** `by_courseId`, `by_position`

### `courseLessons`
Lessons within modules.

**Indexes:** `by_moduleId`, `by_position`

### `courseChapters`
Chapter content with Mux video and AI generation.

| Field | Type | Description |
|-------|------|-------------|
| title | string | Chapter title |
| videoUrl | string? | Direct video URL |
| courseId | string | Parent course |
| lessonId | string? | Parent lesson |
| muxAssetId | string? | Mux video asset |
| muxPlaybackId | string? | Mux playback ID |
| muxAssetStatus | "waiting" \| "preparing" \| "ready" \| "errored"? | Video status |
| videoDuration | number? | Duration in seconds |
| generatedAudioUrl | string? | AI-generated audio |
| audioGenerationStatus | "pending" \| "generating" \| "completed" \| "failed"? | Audio gen status |
| videoGenerationStatus | similar? | Video gen status |

**Indexes:** `by_courseId`, `by_lessonId`, `by_position`, `by_muxAssetId`

### `enrollments`
Student course enrollments.

| Field | Type | Description |
|-------|------|-------------|
| userId | string | Student Clerk ID |
| courseId | string | Course document ID |
| progress | number? | Progress percentage |

**Indexes:** `by_userId`, `by_courseId`, `by_user_course`

### `userProgress`
Granular chapter-level progress tracking.

| Field | Type | Description |
|-------|------|-------------|
| userId | string | Student Clerk ID |
| courseId | id("courses")? | Course reference |
| chapterId | string | Chapter being tracked |
| isCompleted | boolean? | Completion flag |
| completedAt | number? | Completion timestamp |
| timeSpent | number? | Seconds spent |
| progressPercentage | number? | 0-100 |

**Indexes:** `by_userId`, `by_courseId`, `by_chapterId`, `by_user_chapter`, `by_user_course`, `by_user_completed`, `by_course_completed`, `by_user_course_completed`

### `courseDripAccess`
Tracks which drip-gated modules are unlocked per student.

### `courseNotes`
Timestamped collaborative notes within course chapters.

**Indexes:** `by_chapter`, `by_chapter_user`, `by_chapter_public`, `by_user`, `by_course`
**References:** `courses`, `courseChapters`

### `courseReviews`
Student course reviews with instructor responses.

**Indexes:** `by_courseId`, `by_userId`, `by_courseId_rating`, `by_published`
**References:** `courses`

### `liveViewers`
Real-time viewer presence tracking.

**Indexes:** `by_course`, `by_course_user`, `by_expiresAt`
**References:** `courses`, `courseChapters`

### `librarySessions`
User activity sessions in the library.

**Indexes:** `by_userId`, `by_sessionType`, `by_resourceId`, `by_startedAt`

---

## 3. Stores & E-Commerce

### `stores`
Creator storefronts — the central entity for multi-tenant commerce.

| Field | Type | Description |
|-------|------|-------------|
| name | string | Store name |
| slug | string | URL slug |
| userId | string | Owner Clerk ID |
| customDomain | string? | Custom domain |
| domainStatus | string? | pending/verified/active |
| plan | "free" \| "starter" \| "creator" \| "creator_pro" \| "business" \| "early_access"? | SaaS tier |
| isPublic | boolean? | Discoverable on marketplace |
| isPublishedProfile | boolean? | Profile complete |
| stripeCustomerId | string? | Stripe customer ID |
| stripeSubscriptionId | string? | Plan subscription |
| subscriptionStatus | "active" \| "trialing" \| "past_due" \| "canceled" \| "incomplete"? | Sub status |
| emailConfig | object? | Email sender configuration (fromEmail, fromName, replyTo, adminNotifications) |
| notificationIntegrations | object? | Slack/Discord webhook URLs |
| copyrightStrikes | number? | 0-3 strike system |
| strikeHistory | array? | Strike records |
| suspendedAt | number? | Suspension timestamp |
| socialLinks | object? | Social media links (14 platforms) |
| socialLinksV2 | array? | New format with labels |

**Indexes:** `by_userId`, `by_slug`, `by_plan`, `by_public`

---

## 4. Digital Products

### `digitalProducts`
Mega-table supporting 30+ product categories with type-specific fields.

| Field | Type | Description |
|-------|------|-------------|
| title | string | Product title |
| slug | string? | URL slug |
| price | number | Price in dollars |
| storeId | string | Parent store |
| userId | string | Creator Clerk ID |
| isPublished | boolean? | Publication status |
| productType | "digital" \| "urlMedia" \| "coaching" \| "effectChain" \| "abletonRack" \| "abletonPreset" \| "playlistCuration"? | High-level type |
| productCategory | 30+ literal values | Specific category (see FEATURE_MAP.md) |
| followGateEnabled | boolean? | Social follow gate |
| followGateSteps | array? | Multi-step follow sequence |
| beatLeaseConfig | object? | Beat licensing tiers |
| releaseConfig | object? | Music release marketing config |
| playlistCurationConfig | object? | Curator playlist config |
| dawType | "ableton" \| "fl-studio" \| "logic" \| ... | Target DAW |
| targetPlugin | "serum" \| "vital" \| "massive" \| ... | Target plugin for presets |
| isPinned | boolean? | Pinned in storefront |
| orderBumpEnabled | boolean? | Order bump configuration |
| affiliateEnabled | boolean? | Affiliate commissions |
| sampleIds | id("audioSamples")[]? | Linked audio samples |

**Indexes:** `by_storeId`, `by_userId`, `by_productCategory`, `by_storeId_and_slug`, `by_slug`

### `productReviews`
Product review records.

**Indexes:** `by_productId`

### `emailFlows`
Product-specific email flows.

**Indexes:** `by_productId`

---

## 5. Purchases & Transactions

### `purchases`
Central purchase history table.

| Field | Type | Description |
|-------|------|-------------|
| userId | string | Buyer Clerk ID |
| productId | id("digitalProducts")? | Purchased product |
| courseId | id("courses")? | Purchased course |
| bundleId | id("bundles")? | Purchased bundle |
| storeId | string | Seller's store |
| amount | number | Amount paid |
| status | "pending" \| "completed" \| "refunded" | Transaction status |
| productType | "digitalProduct" \| "course" \| "coaching" \| "bundle" \| "beatLease" | Purchase type |
| beatLicenseId | id("beatLicenses")? | Beat license reference |
| isPaidOut | boolean? | Creator payout status |

**Indexes:** `by_userId`, `by_productId`, `by_courseId`, `by_storeId`, `by_status`, `by_productType`, `by_user_product`, `by_user_course`, `by_store_status`, `by_user_status`

### `beatLicenses`
Beat license purchase records with contract terms snapshot.

| Field | Type | Description |
|-------|------|-------------|
| purchaseId | id("purchases") | Parent purchase |
| beatId | id("digitalProducts") | Beat product |
| tierType | "basic" \| "premium" \| "exclusive" \| "unlimited" | License tier |
| price | number | License price |
| distributionLimit | number? | Distribution copies limit |
| streamingLimit | number? | Stream count limit |
| commercialUse | boolean | Commercial rights |
| stemsIncluded | boolean | Stems included |

**Indexes:** `by_purchase`, `by_user`, `by_beat`, `by_store`, `by_user_beat`

### `creatorEarnings`
Creator earnings with platform fee breakdown.

| Field | Type | Description |
|-------|------|-------------|
| creatorId | string | Creator Clerk ID |
| transactionType | "course_sale" \| "product_sale" \| "subscription_payment" \| "coaching_session" | Type |
| grossAmount | number | Gross revenue |
| platformFee | number | 10% platform cut |
| processingFee | number | Stripe fees |
| netAmount | number | Creator payout amount |
| payoutStatus | "pending" \| "processing" \| "paid" \| "failed" | Payout state |

**Indexes:** `by_creatorId`, `by_storeId`, `by_payoutStatus`, `by_creator_status`, `by_transactionType`

---

## 6. Subscriptions & Memberships

### `pprProPlans`
Platform-level learner subscription plans.

### `pprProSubscriptions`
Active PPR Pro subscriptions.

### `subscriptions` (Legacy)
Legacy subscription records.

**Indexes:** `by_customerId`, `by_storeId`, `by_status`

### `creatorSubscriptionTiers`
Per-creator Patreon-style subscription tiers.

| Field | Type | Description |
|-------|------|-------------|
| creatorId | string | Creator Clerk ID |
| storeId | string | Store |
| tierName | string | "Basic", "Pro", "VIP" |
| priceMonthly | number | Monthly price |
| priceYearly | number? | Yearly price |
| stripePriceIdMonthly | string | Stripe price |
| benefits | string[] | Benefit descriptions |
| maxCourses | number? | Course limit (null = unlimited) |
| trialDays | number? | Free trial days |
| isActive | boolean | Active for sale |

**Indexes:** `by_creatorId`, `by_storeId`, `by_active`, `by_creator_active`, `by_slug`

### `userCreatorSubscriptions`
User subscriptions to specific creators.

**Indexes:** `by_userId`, `by_creatorId`, `by_user_creator`, `by_status`, `by_stripe_id`

### `contentAccess`
Granular content access control (free, purchase, subscription).

**Indexes:** `by_resourceId`, `by_creatorId`, `by_storeId`, `by_resource_type`

### `membershipSubscriptions`
NEEDS EXPANSION IN PASS 2 — from monetizationSchema import

---

## 7. Email Marketing & Automation

### `emailWorkflows`
Visual workflow definitions with node-based automation.

| Field | Type | Description |
|-------|------|-------------|
| name | string | Workflow name |
| storeId | string | Owner store |
| isActive | boolean? | Active/paused |
| isAdminWorkflow | boolean? | Platform-wide targeting |
| sequenceType | 9 literal values | Categorization |
| trigger | object | Trigger configuration (26 trigger types) |
| nodes | array | Node definitions (12 node types) |
| edges | array | Node connections |
| totalExecutions | number? | Execution count |
| avgOpenRate | number? | Performance metric |

**Indexes:** `by_storeId`, `by_userId`, `by_active`, `by_isAdminWorkflow`, `by_sequenceType`, `by_storeId_sequenceType`

### `workflowTemplates`
Pre-built workflow templates.

**Indexes:** `by_category`, `by_public`, `by_creatorId`

### `workflowExecutions`
Individual workflow run tracking.

| Field | Type | Description |
|-------|------|-------------|
| workflowId | id("emailWorkflows") | Parent workflow |
| contactId | id("emailContacts")? | Target contact |
| customerEmail | string | Recipient email |
| status | "pending" \| "running" \| "completed" \| "failed" \| "cancelled" | State |
| currentNodeId | string? | Current position in workflow |
| scheduledFor | number? | Next execution time |

**Indexes:** `by_workflowId`, `by_storeId`, `by_contactId`, `by_status`, `by_scheduledFor`, `by_workflowId_status`, `by_status_scheduledFor`, `by_customerEmail`

### `workflowGoalCompletions`
Track when contacts complete workflow goals.

**Indexes:** `by_workflowId`, `by_storeId`, `by_contactId`, `by_goalType`

### `workflowNodeABTests`
A/B testing within email workflow nodes.

**Indexes:** `by_workflowId`, `by_workflowId_nodeId`

### `courseCycleConfigs`
Perpetual nurture/pitch automation configurations.

**Indexes:** `by_storeId`, `by_active`

### `courseCycleEmails`
AI-generated nurture/pitch email content for course cycles.

**Indexes:** `by_courseCycleConfigId`, `by_courseId_type`, `by_courseId_type_cycle`

### `emailCampaigns`
Broadcast email campaigns.

### `emailTemplates`
Reusable email templates.

### `dripCampaigns`
Time-based drip campaign definitions.

### `dripCampaignSteps`
Individual steps within drip campaigns.

### `dripCampaignEnrollments`
Student enrollments in drip campaigns.

---

## 8. Email Deliverability & Health

### `emailDeliverabilityEvents`
Individual bounce, complaint, and block events.

| Field | Type | Description |
|-------|------|-------------|
| eventType | "hard_bounce" \| "soft_bounce" \| "spam_complaint" \| "blocked" \| "unsubscribe" \| "delivery_delay" | Event type |
| email | string | Affected email |
| reason | string? | Bounce reason |

**Indexes:** `by_storeId`, `by_storeId_timestamp`, `by_email`, `by_eventType`, `by_contactId`

### `emailDeliverabilityStats`
Aggregated deliverability metrics per store per period.

| Field | Type | Description |
|-------|------|-------------|
| period | "daily" \| "weekly" \| "monthly" | Aggregation period |
| deliveryRate | number | Percentage |
| bounceRate | number | Percentage |
| spamRate | number | Percentage |
| healthScore | number | 0-100 overall |

**Indexes:** `by_storeId`, `by_storeId_period`, `by_storeId_periodStart`

### `emailDomainReputation`
Domain reputation tracking with SPF/DKIM/DMARC status.

**Indexes:** `by_storeId`, `by_domain`

---

## 9. Lead Scoring & Segmentation

### `creatorEmailSegments`
Dynamic email segments with condition-based filtering.

**Indexes:** `by_storeId`, `by_name`

### `leadScoringRules`
Customizable lead scoring criteria.

**Indexes:** `by_storeId`, `by_active`

### `leadScoreHistory`
Lead score change audit trail.

**Indexes:** `by_contactId`, `by_storeId_timestamp`

### `leadScoringSummary`
Pre-aggregated lead scoring metrics (avoids 32K doc read limit).

**Indexes:** `by_storeId`

---

## 10. Webhooks & Custom Events

### `webhookEndpoints`
External webhook endpoint configurations.

**Indexes:** `by_storeId`, `by_endpointKey`, `by_active`

### `webhookCallLogs`
Webhook invocation logs.

**Indexes:** `by_webhookEndpointId`, `by_storeId_timestamp`

### `customEvents`
Custom event definitions for workflow triggers.

**Indexes:** `by_storeId`, `by_storeId_eventName`

### `customEventLogs`
Custom event invocation logs.

**Indexes:** `by_customEventId`, `by_storeId_timestamp`, `by_contactId`

### `pageVisitEvents`
Page visit tracking for workflow triggers.

**Indexes:** `by_storeId`, `by_contactId`, `by_storeId_pagePath`, `by_storeId_timestamp`

### `cartAbandonEvents`
Cart abandonment tracking.

**Indexes:** `by_storeId`, `by_contactId`, `by_contactEmail`, `by_recovered`

---

## 11. Lead Generation & Follow Gates

### `leadSubmissions`
Lead magnet form submissions.

**Indexes:** `by_email`, `by_productId`, `by_storeId`, `by_adminUserId`, `by_email_and_product`

### `followGateSubmissions`
Social follow gate submissions with platform-level tracking.

**Indexes:** `by_product`, `by_email`, `by_creator`, `by_store`, `by_email_product`, `by_submitted_at`

### `releasePreSaves`
Music release pre-save submissions with OAuth tokens.

**Indexes:** `by_release`, `by_email`, `by_creator`, `by_store`, `by_email_release`, `by_presaved_at`

---

## 12. Customer Management

### `customers`
CRM-style customer records with music producer profile fields.

| Field | Type | Description |
|-------|------|-------------|
| name, email | string | Contact info |
| storeId | string | Belongs to store |
| type | "lead" \| "paying" \| "subscription" | Customer type |
| status | "active" \| "inactive" | Activity status |
| score | number? | Engagement score (0-100) |
| daw | string? | Their DAW (Ableton, FL Studio, etc.) |
| typeOfMusic | string? | Genre preference |
| goals | string? | Production goals |
| musicAlias | string? | Artist name |
| studentLevel | string? | Beginner/Intermediate/Advanced/Pro |
| activeCampaignId | string? | Import ID from ActiveCampaign |

**Indexes:** `by_email`, `by_storeId`, `by_adminUserId`, `by_type`, `by_email_and_store`

### `fanCounts`
Pre-aggregated customer counts per store.

**Indexes:** `by_storeId`

### `emailContacts`
Email subscriber management with comprehensive engagement tracking.

### `emailContactStats`
Aggregated contact statistics.

### `emailContactTags`
Tag-to-contact relationships.

### `emailContactActivity`
Contact activity log.

### `emailTags`
Tag system for email contacts.

---

## 13. Analytics & Tracking

### `analyticsEvents`
Generic event tracking.

### `productViews`
Product view analytics.

### `revenueEvents`
Revenue event tracking.

### `userSessions`
User session tracking.

### `courseAnalytics`
Course performance metrics.

### `revenueAnalytics`
Revenue metrics aggregation.

### `studentProgress`
Student progress aggregation.

### `chapterAnalytics`
Chapter-level metrics.

### `learningStreaks`
Engagement streak tracking.

### `recommendations`
Course recommendations.

### `adminMetrics`
Pre-aggregated admin dashboard metrics.

### `creatorPipeline`
Creator conversion funnel tracking.

### `campaigns`
Marketing campaign tracking.

### `experiments`
A/B testing experiments.

### `videoAnalytics`
Video-specific analytics.

### `linkClickAnalytics`
Link-in-bio click tracking.

### `landingPageAnalytics`
Landing page analytics.

---

## 14. Gamification & Achievements

### `userAchievements`
Achievement unlock records.

### `userXP`
XP and leveling tracking.

### `userNudges`
Contextual nudge delivery tracking.

### `userTracks`
Music track uploads for showcase.

### `showcaseProfiles`
Music showcase profiles.

### `curatorPlaylists`
Curator playlist definitions.

### `curatorPlaylistTracks`
Tracks within curator playlists.

### `trackSubmissions`
Track submission to playlists.

### `aiOutreachDrafts`
AI-generated outreach templates.

---

## 15. AI & Conversations

### `aiConversations`
AI chat conversation metadata with goal anchoring.

### `aiMessages`
Individual AI messages with citations.

### `aiMemories`
Long-term memory storage for AI assistant.

### `aiAgents`
Custom AI agent definitions.

### `aiMessageFeedback`
User feedback on AI responses.

### `webResearch`
Cached web research results (Tavily).

---

## 16. AI Content Generation

### `suggestedFeatures`
AI-identified feature suggestions.

### `scriptIllustrations`
AI-generated images (FAL).

### `scriptIllustrationJobs`
Batch illustration generation jobs.

### `leadMagnetAnalyses`
Visual idea analysis for lead magnets.

### `cheatSheets`
Individual cheat sheet documents (per-module, AI-generated).

| Field | Type | Description |
|-------|------|-------------|
| userId | string | Creator Clerk ID |
| courseId | id("courses") | Source course |
| courseTitle | string | Course title |
| selectedChapterIds | string[] | Chapter IDs used as source content |
| moduleTitle | string? | Module name (for pack-generated sheets) |
| moduleId | id("courseModules")? | Source module |
| packId | id("cheatSheetPacks")? | Parent pack |
| outline | object | Structured outline: `{ title, subtitle?, sections[], footer?, showTOC?, badgeText? }` |
| aiModel | string? | Model used for generation |
| generatedAt | number? | Generation timestamp |
| pdfStorageId | id("_storage")? | Convex storage ID for generated PDF |
| pdfUrl | string? | PDF download URL |
| pdfGeneratedAt | number? | PDF generation timestamp |
| digitalProductId | id("digitalProducts")? | Linked product (if published) |
| status | "draft" \| "generated" \| "published" | Lifecycle state |
| createdAt | number | Creation timestamp |
| updatedAt | number | Last update timestamp |

**Indexes:** `by_userId`, `by_courseId`, `by_status`, `by_packId`

**Outline section types:** `key_takeaways`, `quick_reference`, `step_by_step`, `tips`, `comparison`, `glossary`, `custom`

### `cheatSheetPacks`
Course-wide cheat sheet packs (one pack per course, contains per-module sheets).

| Field | Type | Description |
|-------|------|-------------|
| courseId | id("courses") | Source course |
| courseTitle | string | Course title |
| userId | string | Creator Clerk ID |
| cheatSheetIds | id("cheatSheets")[] | Individual sheets in this pack |
| status | "generating" \| "partial" \| "complete" | Generation state |
| totalModules | number | Total modules to process |
| completedModules | number | Modules processed so far |
| failedModules | string[] | Module names that failed generation |
| modelId | string? | AI model used |
| digitalProductId | id("digitalProducts")? | Linked product (if published) |
| createdAt | number | Creation timestamp |
| updatedAt | number | Last update timestamp |

**Indexes:** `by_courseId`, `by_userId`, `by_digitalProductId`

### `aiCourseQueue`
AI course creation queue.

### `aiCourseOutlines`
Generated course outlines.

---

## 17. Social Media

### `socialAccounts`
OAuth-connected social platform accounts.

### `scheduledPosts`
Posts scheduled for publishing.

### `postAnalytics`
Post performance metrics.

### `socialWebhooks`
Incoming social webhook tracking.

### `postTemplates`
Reusable post templates.

### `socialAccountProfiles`
Account profile definitions.

### `generatedScripts`
Pre-generated scripts with virality scoring.

### `scriptCalendarEntries`
Script scheduling.

### `scriptGenerationJobs`
Batch script generation tracking.

### `socialMediaPosts`
AI-generated social media post content.

### `ctaTemplates`
CTA template library.

---

## 18. ManyChat-Style Automation

### `automationFlows`
Conversation/automation flow definitions.

### `userAutomationStates`
User progress through automation flows.

### `automationTriggers`
Trigger tracking.

### `automationMessages`
Automated message records.

### Instagram DM Automation Tables

### `integrations`
OAuth connections for Instagram/Facebook.

### `automations`
Main automation container.

### `triggers`
Automation trigger definitions.

### `keywords`
Trigger keywords (has search index).

### `listeners`
Action configurations.

### `posts`
Instagram post references.

### `chatHistory`
Conversation history.

### `userSubscriptions`
Feature paywall for automation.

---

## 19. Music & Audio

### `audioSamples`
Individual audio samples with waveform data.

### `samplePacks`
Sample pack collections.

### `sampleDownloads`
Download tracking.

### `sampleFavorites`
Favorite tracking.

### `artistProfiles`
Artist profile records.

### `musicTracks`
URL-based track references.

### `trackPlays`
Play count analytics.

### `trackLikes`
Like tracking.

### `trackComments`
Comments with threading.

### `artistFollows`
Following system.

### `musicPlaylists`
User-created playlists.

### `playlistTracks`
Playlist track contents.

### `audioFiles`
Audio file storage records.

### `userCredits`
Credit balance tracking.

### `creditTransactions`
Credit transaction history.

### `wishlists`
Wishlist items.

### `creditPackages`
Credit purchase package definitions.

---

## 20. Coaching & Services

### `coachProfiles`
Coach profile and verification data.

**Indexes:** `by_userId`

### `coachingSessions`
Session booking records.

| Field | Type | Description |
|-------|------|-------------|
| productId | id("digitalProducts") | Coaching product |
| coachId | string | Coach Clerk ID |
| studentId | string | Student Clerk ID |
| scheduledDate | number | Session date |
| status | "SCHEDULED" \| "IN_PROGRESS" \| "COMPLETED" \| "CANCELLED" \| "NO_SHOW" | State |
| discordChannelId | string? | Discord session channel |

**Indexes:** `by_productId`, `by_coachId`, `by_studentId`, `by_scheduledDate`, `by_status`

### `serviceOrders`
Mixing/mastering service orders.

### `serviceOrderMessages`
In-order messaging.

---

## 21. Certificates & Q&A

### `certificates`
Course completion certificates.

### `certificateVerifications`
Certificate verification tracking.

### `quizzes`
Quiz definitions.

### `quizQuestions`
Quiz question records.

### `quizAttempts`
Student quiz attempts.

### `quizResults`
Quiz result summaries.

### `questionBanks`
Reusable question banks.

### `questions`
Q&A system questions.

### `answers`
Q&A system answers.

### `qaVotes`
Q&A upvotes/downvotes.

---

## 22. Notes & Content

### `noteFolders`
Notion-style folder structure.

### `notes`
Note documents (has search index).

### `noteTemplates`
Note templates.

### `noteComments`
Note collaboration comments.

### `noteSources`
External content source references.

---

## 23. Blog & Plugins

### `blogPosts`
Blog content with full body.

### `blogComments`
Blog comment system.

### `pluginTypes`
Plugin category definitions.

### `pluginEffectCategories`
Effect plugin categories.

### `pluginInstrumentCategories`
Instrument plugin categories.

### `pluginStudioToolCategories`
Studio tool categories.

### `plugins`
Plugin directory entries (has search index).

---

## 24. Landing Pages

### `landingPages`
Landing page content.

### `landingPageAnalytics`
Page-level analytics.

### `landingPageTemplates`
Reusable page templates.

---

## 25. Direct Messaging

### `dmConversations`
1:1 conversation metadata.

### `dmMessages`
Individual direct messages.

---

## 26. Video Generation

### `videoJobs`
Video generation job queue.

### `videoScripts`
Scene-by-scene video scripts.

### `videoLibrary`
Finished video library.

---

## 27. Platform Admin

### `githubConfig`
GitHub integration configuration.

### `changelogEntries`
Platform changelog entries.

### `changelogReleases`
Release groupings.

### `adminActivityLogs`
Admin action audit trail.

### `platformSettings`
Platform-wide configuration.

### `reports`
Content moderation reports (DMCA support).

---

## 28. PPR Pro

### `pprProPlans`
PPR Pro plan configuration (monthly/yearly).

### `pprProSubscriptions`
Active PPR Pro subscriptions.

---

## 29. Email Queue

### `emailSendQueue`
Fair multi-tenant email send queue.

---

## 30. Imported Schema Modules

The following tables are imported from separate schema files:

### From `monetizationSchema`
- `subscriptionPlans`
- `coupons`
- `affiliates`
- `referrals`
- `paymentPlans`
- `bundles`
- `taxRates`
- `refunds`
- `creatorPayouts`

### From `emailSchema`
- Additional email system tables
- `resendConnections`
- `resendTemplates`
- `resendCampaigns`
- `resendAutomations`
- `resendLogs`
- `resendPreferences`
- `emailSuppressions`

### From `emailDomainSchema`
- Email domain management tables

### From `emailRepliesSchema`
- Email reply handling tables

**NEEDS EXPANSION IN PASS 2:** Read and document all imported schema module tables with complete field definitions.

---

## Relationship Map (Key Foreign Keys)

```
users.clerkId ← courses.userId
users.clerkId ← stores.userId
users.clerkId ← purchases.userId
users.clerkId ← enrollments.userId
users.clerkId ← userProgress.userId

stores.slug → routes: /[slug]/*
stores._id ← digitalProducts.storeId
stores._id ← emailWorkflows.storeId
stores._id ← emailContacts.storeId
stores._id ← customers.storeId
stores._id ← purchases.storeId

courses._id ← courseModules.courseId
courses._id ← courseLessons.moduleId (indirect)
courses._id ← courseChapters.courseId
courses._id ← enrollments.courseId
courses._id ← userProgress.courseId
courses._id ← purchases.courseId
courses._id ← courseReviews.courseId

digitalProducts._id ← purchases.productId
digitalProducts._id ← beatLicenses.beatId
digitalProducts._id ← leadSubmissions.productId
digitalProducts._id ← followGateSubmissions.productId
digitalProducts._id ← coachingSessions.productId

emailWorkflows._id ← workflowExecutions.workflowId
emailWorkflows._id ← workflowGoalCompletions.workflowId
emailWorkflows._id ← workflowNodeABTests.workflowId

emailContacts._id ← workflowExecutions.contactId
emailContacts._id ← leadScoreHistory.contactId
```

---

*NEEDS EXPANSION IN PASS 2: Complete field definitions for ALL 196 tables (especially imported modules), full index documentation, search index configurations, foreign key validation patterns, data migration history.*

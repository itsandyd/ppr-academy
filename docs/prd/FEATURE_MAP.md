# Feature Map — Complete Feature Inventory

> **Last Updated:** 2026-02-19
> **Pass:** 3 — Updated with cheat sheet pack system, reference PDF enhancements, PDF templates

---

## Table of Contents

- [1. Course Creation & Management](#1-course-creation--management)
- [2. Course Consumption & Progress Tracking](#2-course-consumption--progress-tracking)
- [3. Digital Products & Marketplace](#3-digital-products--marketplace)
- [4. Beat Marketplace & Licensing](#4-beat-marketplace--licensing)
- [5. Memberships & Subscriptions](#5-memberships--subscriptions)
- [6. Email Marketing System](#6-email-marketing-system)
- [7. Social Media Tools](#7-social-media-tools)
- [8. AI-Powered Features](#8-ai-powered-features)
- [9. Analytics & Reporting](#9-analytics--reporting)
- [10. User Profiles & Settings](#10-user-profiles--settings)
- [11. Creator Storefronts](#11-creator-storefronts)
- [12. Payments & Payouts](#12-payments--payouts)
- [13. Community & Communication](#13-community--communication)
- [14. Lead Magnets & Growth Tools](#14-lead-magnets--growth-tools)
- [15. Gamification & Achievements](#15-gamification--achievements)
- [16. Admin Tools](#16-admin-tools)
- [17. Content & Blog](#17-content--blog)
- [18. Video Generation](#18-video-generation)
- [19. Music-Specific Features](#19-music-specific-features)
- [20. Landing Pages](#20-landing-pages)
- [21. Notes System](#21-notes-system)
- [22. Automation (ManyChat-style)](#22-automation-manychat-style)

**Status Legend:** Active = fully functional | Partial = partially built | WIP = work in progress | Deprecated = legacy code present

---

## 1. Course Creation & Management

| Sub-feature | Route | Key Components | Key Convex Functions | Status |
|-------------|-------|----------------|---------------------|--------|
| Create course wizard | `/dashboard/create/course` | `CreateCourseForm`, `ChapterDialog` | `courses.createCourse` | Active |
| Course editor (modules/lessons/chapters) | `/dashboard/courses/[slug]` | `CourseContentEditor`, `CourseModuleList` | `courses.updateCourse`, `courses.createOrUpdateChapter` | Active |
| Chapter video upload (Mux) | — | `MuxUploader` | `courses.setChapterMuxUpload` | Active |
| Course publishing | — | `PublishToggle` | `courses.togglePublished` | Active |
| Drip content scheduling (3 modes) | — | Module-level drip config | `courseDrip.processDripUnlocks` | Active |
| Follow-gate configuration | — | `FollowGateSettings` | `courses.updateCourse` | Active |
| Course access control (8 types) | — | — | `courseAccess.checkAccess` (free_preview > creator > admin > ppr_pro > purchased > bundle > membership > follow_gate) | Active |
| Stripe product sync | — | — | `courses.syncCourseToStripe` | Active |
| AI course outline generation | `/admin/course-builder` | `AICourseBuilder` | `aiCourseBuilder.generateOutline` | Active |
| AI chapter content expansion | — | — | `aiCourseBuilder.expandChapterContent` | Active |
| Reference PDF generation | — | `ReferenceGuidePDF` (react-pdf) | API: `/api/courses/generate-reference-pdf`, `convex/referenceGuides.updateReferencePdfInfo` | Active |
| Cheat sheet pack generation | — | `CheatSheetPackDialog` | API: `/api/courses/generate-cheat-sheet-pack`, `convex/cheatSheetPacks.*` | Active |
| Cheat sheet pack publishing | — | `CheatSheetPackDialog` (publish flow) | API: `/api/courses/publish-cheat-sheet-pack`, `convex/cheatSheetPacks.publishPackAsProduct` | Active |
| Individual cheat sheet CRUD | — | — | `convex/cheatSheetMutations.*` (save, updateOutline, updatePdfInfo, publishAsLeadMagnet) | Active |
| Cheat sheets student view | `/courses/[slug]/lessons` | `CourseCheatSheets` | `convex/cheatSheetPacks.getPacksForEnrolledCourse` | Active |
| Course categories | — | Category selector | `courses.getCourses` (by category) | Active |
| Course notifications to students | — | — | `courseNotifications.sendNotification` | Active |

## 2. Course Consumption & Progress Tracking

| Sub-feature | Route | Key Components | Key Convex Functions | Status |
|-------------|-------|----------------|---------------------|--------|
| Course catalog | `/courses`, `/marketplace/courses` | `CourseCard`, `CourseGrid` | `courses.getAllPublishedCourses` | Active |
| Course detail page | `/courses/[slug]` | `CourseDetailClient` | `courses.getCourseBySlug` | Active |
| Lesson/chapter player | `/courses/[slug]/lessons/[id]/chapters/[id]` | `ChapterPlayer`, `MuxPlayer` | `courseProgress.markChapterComplete` | Active |
| Progress tracking | — | `ProgressBar` | `courseProgress.getCourseProgress` | Active |
| Chapter completion | — | `CompleteButton` | `userProgress.markComplete` | Active |
| Learning streaks | — | `StreakBadge` | `analyticsTracking.updateLearningStreak` | Active |
| Course enrollment | — | `EnrollButton` | `enrollments.enroll` | Active |
| Q&A system | — | `QuestionList`, `AnswerForm` | `questions.create`, `answers.create` | Active |
| Quizzes | — | `QuizPlayer`, `QuizResults` | `quizzes.submitAttempt` | Active |
| Certificates | `/dashboard/certificates`, `/verify/[id]` | `CertificateViewer` | `certificates.generateCertificate` | Active |
| Timestamped notes | — | `CourseNotes` | `courseNotes.create` | Active |
| Live viewer presence | — | `LiveViewers` | `liveViewers.heartbeat` | Active |
| Course reviews (with ratings) | — | `ReviewForm`, `ReviewList` | `courseReviews.create` | Active |
| Auto-certificate issuance | — | — | `certificates.autoIssueCertificate` (triggers on 100% progress) | Active |
| Collaborative notes | — | — | `courseNotes.getPublicNotes` | Partial |
| Course checkout | `/courses/[slug]/checkout` | `CheckoutForm` | API: `/api/courses/create-checkout-session` | Active |

## 3. Digital Products & Marketplace

| Sub-feature | Route | Key Components | Key Convex Functions | Status |
|-------------|-------|----------------|---------------------|--------|
| Product creation (20+ types) | `/dashboard/create/*` | Type-specific create forms | `digitalProducts.createProduct` | Active |
| Product listing | `/dashboard/products` | `ProductGrid` | `digitalProducts.getProductsByStore` | Active |
| Public marketplace | `/marketplace/products` | `MarketplaceGrid` | `digitalProducts.getAllPublishedProducts` | Active |
| Product detail pages | `/marketplace/products/[slug]` | `ProductDetail` | `digitalProducts.getProductBySlug` | Active |
| Product categories (30+) | — | Category filters | `digitalProducts.getByCategory` | Active |
| Sample pack creation | `/dashboard/create/sample`, `/dashboard/create/pack` | `SamplePackEditor` | `digitalProducts.createProduct` | Active |
| Preset pack creation | — | `PresetPackEditor` | (same) | Active |
| Project files | `/dashboard/create/project-files` | `ProjectFilesForm` | (same) | Active |
| Mixing templates | `/dashboard/create/mixing-template` | `MixingTemplateForm` | (same) | Active |
| PDF/guide creation | `/dashboard/create/pdf` | `PDFEditor` | (same) | Active |
| Product reviews | — | `ReviewList` | `productReviews.create` | Active |
| Follow-gate products | — | `FollowGateModal` | `followGateSubmissions.submit` | Active |
| Order bumps | — | `OrderBumpConfig` | Product-level config | Partial |
| Pinned products | — | — | `digitalProducts.updateProduct` (isPinned) | Active |
| Bundle creation | `/dashboard/create/bundle` | `BundleEditor` | `bundles.create` | Active |
| Product downloads | `/dashboard/downloads` | `DownloadList` | `purchases.getUserPurchases` | Active |

### Product Categories Supported
`sample-pack`, `preset-pack`, `midi-pack`, `bundle`, `effect-chain`, `ableton-rack`, `beat-lease`, `project-files`, `mixing-template`, `coaching`, `mixing-service`, `mastering-service`, `playlist-curation`, `course`, `workshop`, `masterclass`, `pdf`, `pdf-guide`, `cheat-sheet`, `template`, `blog-post`, `community`, `tip-jar`, `donation`, `release`, `lead-magnet`

### Marketplace Sections
| Section | Route | Status |
|---------|-------|--------|
| All Products | `/marketplace/products` | Active |
| Beats | `/marketplace/beats` | Active |
| Courses | `/marketplace/courses` | Active |
| Bundles | `/marketplace/bundles` | Active |
| Guides | `/marketplace/guides` | Active |
| Memberships | `/marketplace/memberships` | Active |
| Mixing Services | `/marketplace/mixing-services` | Active |
| Mixing Templates | `/marketplace/mixing-templates` | Active |
| Plugins | `/marketplace/plugins` | Active |
| Preset Packs | `/marketplace/preset-packs` | Active |
| Project Files | `/marketplace/project-files` | Active |
| Samples | `/marketplace/samples` | Active |
| Ableton Racks | `/marketplace/ableton-racks` | Active |
| Coaching | `/marketplace/coaching` | Active |
| Creators | `/marketplace/creators` | Active |

## 4. Beat Marketplace & Licensing

| Sub-feature | Route | Key Components | Key Convex Functions | Status |
|-------------|-------|----------------|---------------------|--------|
| Beat creation | `/dashboard/create/beat-lease` | `BeatLeaseForm` | `digitalProducts.createProduct` | Active |
| Tiered licensing (Basic/Premium/Exclusive/Unlimited) | — | `LicenseTierConfig` | Product-level beatLeaseConfig | Active |
| Beat player | `/marketplace/beats/[slug]` | `BeatPlayer`, `WaveSurfer` | — | Active |
| Beat purchase with license | — | `LicensePicker` | API: `/api/beats/create-checkout-session` | Active |
| License contract PDF | — | — | API: `/api/beats/contract` | Active |
| Beat download (tier-specific files) | — | — | API: `/api/beats/download` | Active |
| Exclusive sale tracking | — | — | `digitalProducts.markBeatAsExclusivelySold` | Active |
| WAV/Stems/Trackouts delivery | — | — | Tier-based file URLs | Active |

## 5. Memberships & Subscriptions

| Sub-feature | Route | Key Components | Key Convex Functions | Status |
|-------------|-------|----------------|---------------------|--------|
| PPR Pro subscription | `/pricing` | `PricingCards` | `pprPro.getPlans`, API: `/api/ppr-pro/create-checkout-session` | Active |
| Creator plan management | `/dashboard/pricing` | `PlanSelector` | `creatorPlans.getCreatorPlans` | Active |
| Creator subscription tiers (Patreon-style) | `/dashboard/memberships` | `MembershipEditor` | `creatorSubscriptionTiers.create` | Active |
| Membership checkout | `/marketplace/memberships/[slug]` | `MembershipCheckout` | API: `/api/memberships/create-checkout-session` | Active |
| Billing portal | `/dashboard/settings` | — | API: `/api/ppr-pro/billing-portal`, `/api/creator-plans/billing-portal` | Active |
| Subscription lifecycle | — | — | Stripe webhook handlers | Active |
| Content access gating | — | — | `contentAccess`, `courseAccess` | Active |
| Coupon system (7-condition validation, bulk create) | — | `CouponInput` | `coupons.validateCoupon`, `coupons.bulkCreateCoupons` | Active |
| Early Access plan sunset tools | — | — | `creatorPlans.sunsetAllEarlyAccess`, `creatorPlans.extendEarlyAccess` | Active |

## 6. Email Marketing System

| Sub-feature | Route | Key Components | Key Convex Functions | Status |
|-------------|-------|----------------|---------------------|--------|
| Contact management | `/dashboard/emails/contacts` | `ContactList`, `ContactDetail` | `emailContacts.getContacts` | Active |
| Contact detail page | `/dashboard/emails/contacts/[id]` | `ContactProfile` | `emailContacts.getContactById` | Active |
| Email templates | `/dashboard/emails/preview` | `EmailTemplateEditor` | `emailTemplates.create` | Active |
| Broadcast campaigns | `/dashboard/emails/campaigns` | `CampaignEditor` | `emailCampaigns.createCampaign` | Active |
| Visual workflow builder | `/dashboard/emails/workflows` | `WorkflowEditor` (XYFlow) | `emailWorkflows.createWorkflow` | Active |
| Drip sequences | `/dashboard/emails/sequences` | `SequenceEditor` | `dripCampaigns.create` | Active |
| Email segmentation | `/dashboard/emails/segments` | `SegmentBuilder` | `creatorEmailSegments.create` | Active |
| Lead scoring | `/dashboard/emails/leads` | `LeadScoringDashboard` | `leadScoring.getRules` | Active |
| A/B testing | — | `ABTestConfig` | `workflowNodeABTests` | Active |
| Deliverability monitoring | `/dashboard/emails/deliverability` | `DeliverabilityDashboard` | `emailDeliverabilityStats` | Active |
| Email health | `/dashboard/emails/health` | `HealthDashboard` | `emailDomainReputation` | Active |
| Email analytics | `/dashboard/emails/analytics` | `AnalyticsCharts` | `emailAnalytics` | Active |
| Email setup | `/dashboard/emails/setup` | `EmailConfigForm` | `stores.updateEmailConfig` | Active |
| Subscriber management | `/dashboard/emails/subscribers` | `SubscriberList` | `emailContacts.getSubscribers` | Active |
| Course cycle automation | — | — | `courseCycles` (perpetual nurture/pitch) | Active |
| Webhook endpoints | — | `WebhookConfig` | `webhookEndpoints.create` | Active |
| Custom events | — | — | `customEvents` | Active |
| Fair multi-tenant send queue | — | — | `emailSendQueue.claimBatchForStore` (round-robin, 200/store/30s) | Active |
| Course cycle automation (perpetual) | — | — | `courseCycles` (nurture/pitch rotation with A/B testing) | Active |
| 3-layer suppression system | — | — | `emailUnsubscribe` (dual-check: pre-enqueue + pre-send) | Active |
| HMAC-signed unsubscribe URLs | — | — | `lib/email.ts` (CAN-SPAM compliance) | Active |
| Cart abandon tracking | — | — | `cartAbandonEvents` | Partial |
| Page visit tracking | — | — | `pageVisitEvents` | Partial |
| Unsubscribe handling | `/unsubscribe/[token]` | `UnsubscribePage` | `emailContacts.unsubscribe` | Active |
| 85+ pre-built email templates | — | — | `emailTemplates` (seeded via Convex) | Active |

### Workflow Node Types
`trigger`, `email`, `delay`, `condition`, `action`, `stop`, `webhook`, `split`, `notify`, `goal`, `courseCycle`, `courseEmail`, `purchaseCheck`, `cycleLoop`

### Workflow Trigger Types
`lead_signup`, `product_purchase`, `tag_added`, `segment_member`, `manual`, `time_delay`, `date_time`, `customer_action`, `webhook`, `page_visit`, `cart_abandon`, `birthday`, `anniversary`, `custom_event`, `api_call`, `form_submit`, `email_reply`, `all_users`, `all_creators`, `all_learners`, `new_signup`, `user_inactivity`, `any_purchase`, `any_course_complete`, `learner_conversion`

## 7. Social Media Tools

| Sub-feature | Route | Key Components | Key Convex Functions | Status |
|-------------|-------|----------------|---------------------|--------|
| Connected accounts | `/dashboard/social/profiles` | `SocialAccountList` | `socialMedia.getAccounts` | Active |
| Content calendar | `/dashboard/social/calendar` | `CalendarView` | `socialMediaPosts.getScheduled` | Active |
| Post composer | `/dashboard/social` | `PostComposer` | `socialMediaPosts.create` | Active |
| AI script generation | — | `ScriptGenerator` | `contentGeneration.generatePlatformScripts` | Active |
| Post templates | — | `TemplateLibrary` | `postTemplates.getAll` | Active |
| Content library | `/dashboard/social/library` | `ContentLibrary` | `socialMediaPosts.getLibrary` | Active |
| Multi-platform publishing | — | — | `socialMediaActions.publishPost` | Active |
| Platform OAuth (TikTok, Twitter, Instagram, LinkedIn) | `/api/social/oauth/[platform]` | — | OAuth flow | Active |
| Social webhooks | `/api/social/webhooks/[platform]` | — | Webhook handlers | Active |
| DM automation (keyword-based) | `/dashboard/social/automation` | `AutomationBuilder` | `automations.create` (COMMENT + DM triggers) | Active |
| Smart AI DM responses | — | — | `automations.saveListener` (10-message conversation history) | Active |
| Virality scoring (1-10) | — | `ViralityBadge` | `generatedScripts.viralityScore` (6 factors analyzed) | Active |
| CTA templates | — | `CTAEditor` | `ctaTemplates.create` | Active |
| Token refresh (auto) | — | — | `socialMedia.refreshToken` (4 platforms: IG/FB/Twitter/LinkedIn/TikTok) | Active |
| TikTok post publishing | — | — | `socialMediaActions.publishToTikTok` | Stubbed |
| YouTube integration | — | — | Schema only, no implementation | WIP |

## 8. AI-Powered Features

| Sub-feature | Route | Key Components | Key Convex Functions | Status |
|-------------|-------|----------------|---------------------|--------|
| AI chat assistant | `/ai` | `AIChatInterface` | `masterAI.askMasterAI` | Active |
| AI agents (custom) | — | `AgentBuilder` | `aiAgents.create` | Active |
| Conversation memory | — | — | `aiMemories.getUserMemories` | Active |
| Course outline generation | `/admin/course-builder` | `OutlineGenerator` | `aiCourseBuilder.generateOutline` | Active |
| Chapter content expansion | — | — | `aiCourseBuilder.expandChapterContent` | Active |
| Cheat sheet pack generation | — | `CheatSheetPackDialog` | API: `/api/courses/generate-cheat-sheet-pack` (Claude 3.5 Haiku) | Active |
| Cheat sheet pack publishing | — | `CheatSheetPackDialog` | API: `/api/courses/publish-cheat-sheet-pack` | Active |
| Reference PDF generation | — | `ReferenceGuidePDF` (@react-pdf/renderer) | API: `/api/courses/generate-reference-pdf` (Claude 3.5 Haiku) | Active |
| Social caption generation | — | `CaptionGenerator` | `contentGeneration.generateCaptions` | Active |
| Email content generation | — | — | `aiEmailGenerator` | Active |
| Video script generation | — | `ScriptEditor` | `videosPipeline.generateScript` | Active |
| Web research | — | — | `webResearch` (Tavily) | Active |
| RAG / embeddings | — | — | `embeddings`, Convex RAG | Active |
| Fact verification | — | — | `masterAI.verifyFacts` | Active |
| Lead magnet analysis | — | `AnalysisViewer` | `leadMagnetAnalysisMutations` | Active |
| AI thumbnail generation | — | — | API: `/api/generate-thumbnail` | Active |
| Script illustration generation | — | — | `scriptIllustrations` (fal-ai/flux/schnell) | Active |
| Audio generation (TTS) | — | — | API: `/api/generate-audio` (ElevenLabs, 10 req/hour) | Active |
| MasterAI quality presets (5 tiers) | — | — | budget ($0.002) → speed → balanced → deepReasoning → premium ($0.50) | Active |
| AI agent tools (16 tools) | — | `AgentBuilder` | `aiAgents.executeConfirmedActions` (course, social, content tools) | Active |
| AI goal tracking | — | — | `masterAI/goalExtractor.ts` (prevents context drift) | Active |
| AI platform knowledge base | — | — | `masterAI/platformKnowledge.ts` (domain-specific knowledge) | Active |

## 9. Analytics & Reporting

| Sub-feature | Route | Key Components | Key Convex Functions | Status |
|-------------|-------|----------------|---------------------|--------|
| Creator analytics dashboard | `/dashboard/analytics` | `AnalyticsDashboard` | `analytics.getCreatorAnalytics` | Active |
| Revenue analytics | — | `RevenueCharts` | `analytics.getRevenueAnalytics` | Active |
| Course analytics | — | `CourseMetrics` | `analytics.getCourseAnalytics` | Active |
| Student progress tracking | — | `StudentProgressTable` | `analytics.getStudentProgress` | Active |
| Product view tracking | — | — | `analyticsTracking.trackProductView` | Active |
| Event tracking | — | — | `analyticsTracking.trackEvent` | Active |
| Email analytics | `/dashboard/emails/analytics` | `EmailAnalyticsCharts` | `emailAnalytics` | Active |
| Video analytics | — | — | `videoAnalytics` | Active |
| Link click analytics | — | — | `linkClickAnalytics.track` | Active |
| Admin platform overview | `/admin/analytics` | `PlatformOverview` | `adminAnalytics.getPlatformOverview` | Active |
| Admin revenue | `/admin/revenue` | `RevenueTimeline` | `adminAnalytics.getRevenueOverTime` | Active |
| Admin user growth | — | `UserGrowthChart` | `adminAnalytics.getUserGrowth` | Active |
| Pre-aggregated admin metrics | — | — | `adminMetricsAggregation.aggregate` | Active |

## 10. User Profiles & Settings

| Sub-feature | Route | Key Components | Key Convex Functions | Status |
|-------------|-------|----------------|---------------------|--------|
| Profile page | `/dashboard/profile` | `ProfileEditor` | `users.updateMyProfile` | Active |
| Settings | `/dashboard/settings` | `SettingsPage` | `users.updateSettings` | Active |
| Domain settings | `/dashboard/settings/domains` | `DomainConfig` | `stores.updateCustomDomain` | Active |
| Integration settings | `/dashboard/settings/integrations` | `IntegrationsList` | OAuth connections | Active |
| Payout settings | `/dashboard/settings/payouts` | `StripeConnectSetup` | API: `/api/stripe/connect/*` | Active |
| Notification preferences | — | `NotificationPrefs` | `notificationPreferences.update` | Active |

## 11. Creator Storefronts

| Sub-feature | Route | Key Components | Key Convex Functions | Status |
|-------------|-------|----------------|---------------------|--------|
| Public store page | `/[slug]` | `StorefrontLayout` | `stores.getStoreBySlug` | Active |
| Store courses | `/[slug]/courses` | `StoreCourseGrid` | `courses.getCoursesByStore` | Active |
| Store products | `/[slug]/products` | `StoreProductGrid` | `digitalProducts.getByStore` | Active |
| Store beats | `/[slug]/beats` | `StoreBeatGrid` | — | Active |
| Store memberships | `/[slug]/memberships` | `StoreMembershipList` | — | Active |
| Store coaching | `/[slug]/coaching` | `StoreCoachingList` | — | Active |
| Store bundles | `/[slug]/bundles` | — | — | Active |
| Store tips | `/[slug]/tips` | `TipJar` | — | Active |
| Landing pages | `/[slug]/p/[pageSlug]` | `LandingPageRenderer` | `landingPages.getBySlug` | Active |
| Custom domain routing | (middleware) | — | `customDomains.getStoreByCustomDomain` | Active |
| Link-in-bio | — | `LinkInBio` | `linkInBioLinks.getByStore` | Active |

## 12. Payments & Payouts

| Sub-feature | Route | Key Components | Key Convex Functions | Status |
|-------------|-------|----------------|---------------------|--------|
| Stripe checkout (13 product types) | Various `/api/*/create-checkout-session` | `CheckoutButton` | API routes | Active |
| Stripe Connect (creator payouts) | `/dashboard/settings/payouts` | `StripeConnectOnboarding` | API: `/api/stripe/connect/*` | Active |
| Purchase history | `/dashboard/my-orders` | `OrderList` | `purchases.getUserPurchases` | Active |
| Creator earnings | — | `EarningsDashboard` | `creatorEarnings.getByCreator` | Active |
| Refund handling | — | — | `refunds.processRefund` | Partial |
| Payment plans (installments) | — | — | `paymentPlans` schema exists | WIP |
| Credit system | `/credits` | `CreditBalance`, `CreditPurchase` | `credits.getUserCredits` | Active |
| Credit transactions | `/credits/history` | `TransactionList` | `credits.getCreditTransactions` | Active |
| Tax rates | — | — | `taxRates` schema exists | WIP |

## 13. Community & Communication

| Sub-feature | Route | Key Components | Key Convex Functions | Status |
|-------------|-------|----------------|---------------------|--------|
| Direct messaging | `/dashboard/messages` | `MessageList`, `ChatWindow` | `dmConversations`, `dmMessages` | Active |
| Conversation detail | `/dashboard/messages/[id]` | `ConversationView` | `dmMessages.getByConversation` | Active |
| Discord integration | `/dashboard/settings/integrations` | `DiscordConnect` | `discord.connectServer` | Active |
| Service order messaging | `/dashboard/service-orders/[id]` | `OrderChat` | `serviceOrderMessages` | Active |
| Course Q&A | — | `QASection` | `questions.create`, `answers.create` | Active |
| Community products | `/dashboard/create/community` | `CommunityEditor` | — | Partial |

## 14. Lead Magnets & Growth Tools

| Sub-feature | Route | Key Components | Key Convex Functions | Status |
|-------------|-------|----------------|---------------------|--------|
| Follow gates (multi-platform) | — | `FollowGateModal`, `FollowGateSteps` | `followGateSubmissions.submit` | Active |
| Lead magnet forms | — | `LeadMagnetForm` | `leadSubmissions.submit` | Active |
| Follow gate email delivery | — | — | API: `/api/follow-gate/send-download-email` | Active |
| Instagram follow verification | — | — | API: `/api/follow-gate/instagram` | Active |
| Spotify follow verification | — | — | API: `/api/follow-gate/spotify` | Active |
| TikTok follow verification | — | — | API: `/api/follow-gate/tiktok` | Active |
| YouTube follow verification | — | — | API: `/api/follow-gate/youtube` | Active |
| Pre-save campaigns | — | `PreSaveForm` | `releasePreSaves.submit` | Active |
| Affiliate program | `/affiliate/apply`, `/affiliate/dashboard` | `AffiliateApply`, `AffiliateDashboard` | `affiliates.apply` | Active |
| Referral tracking | `/dashboard/affiliates` | `ReferralStats` | `referrals.track` | Active |
| Lead magnet ideas (AI) | `/dashboard/lead-magnet-ideas` | `IdeaGenerator` | `leadMagnetAnalysisMutations` | Active |
| Coupon system (7-step validation + bulk create) | — | `CouponInput` | `coupons.validate`, `coupons.bulkCreateCoupons` | Active |

## 15. Gamification & Achievements

| Sub-feature | Route | Key Components | Key Convex Functions | Status |
|-------------|-------|----------------|---------------------|--------|
| XP and leveling | — | `XPBar`, `LevelBadge` | `userXP.award` | Active |
| Achievements/badges | — | `AchievementList` | `achievements.unlock` | Active |
| Creator XP | — | `CreatorLevelBadge` | `achievements.awardCreatorXP` | Active |
| Learning streaks | — | `StreakCounter` | `analyticsTracking.updateLearningStreak` | Active |
| Leaderboards | `/leaderboards` | `LeaderboardTable` | `leaderboards.getTopUsers` | Active |
| Certificates | `/dashboard/certificates`, `/verify/[id]` | `CertificateCard` | `certificates.generate` | Active |
| Conversion nudges | — | `BecomeCreatorCard`, `NudgeModal` | `conversionNudges.create` | Active |
| User tracks (showcase) | — | `TrackUploader` | `userTracks.create` | Partial |

## 16. Admin Tools

| Sub-feature | Route | Key Convex Functions | Status |
|-------------|-------|---------------------|--------|
| Admin dashboard | `/admin` | `adminAnalytics.getPlatformOverview` | Active |
| User management | `/admin/users` | `users.getAllUsers` | Active |
| Course management | `/admin/courses` | `courses.getAllCourses` | Active |
| Product management | `/admin/products` | `digitalProducts.getAll` | Active |
| Finance overview | `/admin/finance` | `adminAnalytics.getRevenueOverTime` | Active |
| Revenue dashboard | `/admin/revenue` | `adminAnalytics.getAdvancedRevenueMetrics` | Active |
| Creator management | `/admin/creators` | — | Active |
| Content moderation (DMCA) | `/admin/moderation` | `reports` | Active |
| Copyright system | `/dashboard/copyright` | Copyright strike flow | Active |
| Email monitoring | `/admin/email-monitoring` | `adminEmailMonitoring` | Active |
| Email analytics | `/admin/email-analytics` | — | Active |
| AI management | `/admin/ai` | — | Active |
| AI flywheel | `/admin/ai-flywheel` | — | Active |
| Content generation | `/admin/content-generation` | — | Active |
| Conversion tracking | `/admin/conversions` | `adminConversion` | Active |
| Drip campaigns | `/admin/drip-campaigns` | — | Active |
| Plugin directory | `/admin/plugins` | `plugins` | Active |
| Embeddings management | `/admin/embeddings` | `embeddings` | Active |
| Platform settings | `/admin/settings/*` | `platformSettings` | Active |
| Activity log | `/admin/activity` | `adminActivityLogs` | Active |
| Changelog | `/admin/changelog` | `changelogEntries` | Active |
| Database management | `/admin/settings/database` | — | Active |
| Notifications | `/admin/notifications` | — | Active |
| Sync operations | `/admin/sync` | — | Active |
| Feature discovery | `/admin/feature-discovery` | `suggestedFeatures` | Active |
| Sample generation | `/admin/generate-samples` | — | Active |
| Lead magnet cheat sheets | `/admin/lead-magnets/cheat-sheets` | — | Active |
| Store migrations | `/admin/migrate-stores` | — | Active |
| Customer migrations | `/admin/migrate-customers` | — | Active |

## 17. Content & Blog

| Sub-feature | Route | Key Components | Key Convex Functions | Status |
|-------------|-------|----------------|---------------------|--------|
| Blog listing | `/blog` | `BlogList` | `blogPosts.getPublished` | Active |
| Blog post | `/blog/[slug]` | `BlogPost` | `blogPosts.getBySlug` | Active |
| Blog creation | `/dashboard/create/blog` | `BlogEditor` | `blogPosts.create` | Active |
| Blog comments | — | `CommentSection` | `blogComments.create` | Active |

## 18. Video Generation

| Sub-feature | Route | Key Components | Key Convex Functions | Status |
|-------------|-------|----------------|---------------------|--------|
| Video generation pipeline | — | `VideoGenerator` | `videos.startVideoGeneration` | Active |
| Script generation | — | `ScriptEditor` | `videosPipeline.generateScript` | Active |
| Voice-over generation | — | — | `videosPipeline.generateVoice` | Active |
| Image generation for videos | — | — | `videosPipeline.generateImages` | Active |
| Remotion rendering | — | Remotion compositions in `/remotion/` | `videosPipeline.renderVideo` | Active |
| Video library | — | `VideoLibrary` | `videoLibrary.getAll` | Active |

## 19. Music-Specific Features

| Sub-feature | Route | Key Components | Key Convex Functions | Status |
|-------------|-------|----------------|---------------------|--------|
| Audio sample browser | `/marketplace/samples` | `SampleBrowser`, `WaveformPlayer` | `audioSamples.getAll` | Active |
| Sample packs | `/dashboard/samples` | `SamplePackManager` | `samplePacks.getByStore` | Active |
| Ableton rack marketplace | `/marketplace/ableton-racks` | `RackBrowser` | `abletonRacks.getPublished` | Active |
| Plugin directory | `/marketplace/plugins` | `PluginBrowser` | `plugins.getAll` | Active |
| Curator playlists | `/playlists` | `PlaylistBrowser` | `curatorPlaylists.getAll` | Active |
| Track submission system | — | `SubmissionForm` | `trackSubmissions.submit` | Active |
| Artist profiles | `/artist/[slug]` | `ArtistProfile` | `artistProfiles.getBySlug` | Active |
| Music release marketing | `/dashboard/create/release` | `ReleaseEditor` | `digitalProducts` (releaseConfig) | Active |
| Pre-save campaigns (Spotify/Apple) | — | `PreSaveButton` | API: `/api/presave/*` | Active |
| Waveform visualization | — | `WaveSurfer` component | — | Active |
| Credit-based sample purchases | `/credits/purchase` | `CreditPackages` | `credits.purchaseCredits` | Active |
| Wishlist | — | `WishlistButton` | `wishlists.add` | Active |

## 20. Landing Pages

| Sub-feature | Route | Key Components | Key Convex Functions | Status |
|-------------|-------|----------------|---------------------|--------|
| Landing page builder | `/dashboard/landing-pages/[id]/edit` | `LandingPageEditor` | `landingPages.update` | Active |
| Landing page listing | `/dashboard/landing-pages` | `PageList` | `landingPages.getByStore` | Active |
| Public landing pages | `/[slug]/p/[pageSlug]` | `LandingPageRenderer` | `landingPages.getBySlug` | Active |
| Landing page analytics | — | — | `landingPageAnalytics.track` | Active |
| Landing page templates | — | `TemplateGallery` | `landingPageTemplates.getAll` | Active |

## 21. Notes System

| Sub-feature | Route | Key Components | Key Convex Functions | Status |
|-------------|-------|----------------|---------------------|--------|
| Notes listing | `/dashboard/notes` | `NotesList` | `notes.getByUser` | Active |
| Note editor | `/dashboard/notes/[id]/edit` | `NoteEditor` (TipTap) | `notes.update` | Active |
| Note folders | `/dashboard/notes/folder/[id]` | `FolderView` | `noteFolders.getAll` | Active |
| Note templates | — | `TemplateSelector` | `noteTemplates.getAll` | Active |
| Note collaboration | — | `CommentThread` | `noteComments.create` | Partial |
| External sources | — | `SourceAttacher` | `noteSources.create` | Partial |

## 22. Automation (ManyChat-style)

| Sub-feature | Route | Key Components | Key Convex Functions | Status |
|-------------|-------|----------------|---------------------|--------|
| Automation flows | `/dashboard/automations` | `FlowBuilder` | `automationFlows.create` | Active |
| Automation detail | `/dashboard/automations/[id]` | `FlowEditor` | `automationFlows.update` | Active |
| Instagram DM automation | `/dashboard/social/automation` | `DMAutomationBuilder` | `automations.create` | Active |
| Keyword triggers | — | `KeywordManager` | `keywords.create` | Active |
| Conversation tracking | — | `ChatHistory` | `chatHistory.getAll` | Active |
| User state machine | — | — | `userAutomationStates.update` | Active |
| Condition resolution (4 types) | — | — | `user_response`, `keyword`, `tag_based`, `time_based` | Active |
| Resource sharing nodes | — | — | Share link/file/course/product within flow | Active |
| Webhook nodes (external) | — | — | Call external webhook from automation flow | Active |

---

*Updated in Pass 2 with: 8-type course access hierarchy, fair multi-tenant email send queue, course cycle automation, 3-layer email suppression, MasterAI 5-tier presets, 16 AI agent tools, TTS audio generation, smart AI DM responses, 4-type automation conditions, coupon status corrected to Active.*

*Updated in Pass 3 with: Cheat sheet pack system (generate, publish, student view), reference PDF enhancements (dedicated referenceGuides module, @react-pdf/renderer integration, PausePlayRepeat branding), publish-cheat-sheet-pack API route, cheat sheet limits enforcement utility, updated AI model references (Claude 3.5 Haiku as default for both cheat sheets and reference PDFs via OpenRouter).*

*NEEDS EXPANSION IN PASS 4: Feature completeness assessment per feature, integration testing status, feature flag mapping, deprecated feature cleanup candidates, mobile responsiveness assessment per feature, API endpoint inventory, webhook event matrix.*

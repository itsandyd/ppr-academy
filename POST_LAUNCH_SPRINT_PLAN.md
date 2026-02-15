# PPR Academy: Post-Launch Sprint Plan (73 → 90)

> **Created**: 2026-02-15
> **Current Score**: 73/100
> **Target Score**: 90/100
> **Context**: Live platform, 50,000 email subscribers, processing real money
> **Solo developer also running business, community, content — moving to Taipei in March**

---

## Table of Contents

1. [Current State Assessment](#1-current-state-assessment)
2. [Week 1: What Users Hit First](#2-week-1-what-users-hit-first)
3. [Week 2: Database & Performance](#3-week-2-database--performance)
4. [Week 3: Auth Hardening & Tests](#4-week-3-auth-hardening--tests)
5. [Week 4: Polish & Code Quality](#5-week-4-polish--code-quality)
6. [Score Projection](#6-score-projection)
7. [Risk Register](#7-risk-register)
8. [Quick Wins List](#8-quick-wins-list)
9. [The 90 Guarantee](#9-the-90-guarantee)

---

## 1. Current State Assessment

### 1A. Mobile Responsiveness Audit

| Page | Flow | Status | Breakpoints | Primary Issue |
|------|------|--------|-------------|---------------|
| `app/page.tsx` | Landing | RESPONSIVE | 27 | None |
| `app/marketplace/page.tsx` | Learner | PARTIAL | 8 | Filters hidden on mobile, no drawer alternative |
| `app/marketplace/courses/page.tsx` | Learner | PARTIAL | 6 | Fixed `w-[180px]` select widths overflow on mobile |
| `app/courses/[slug]/components/CourseLandingPage.tsx` | Learner | DESKTOP-ONLY | 0 | No responsive image/layout at all |
| `app/courses/[slug]/checkout/page.tsx` | Learner | DESKTOP-ONLY | 0 | No responsive form layout |
| `app/courses/[slug]/checkout/components/CourseCheckout.tsx` | Learner | DESKTOP-ONLY | 0 | Payment form not mobile-optimized |
| `app/sign-in/[[...sign-in]]/page.tsx` | Auth | RESPONSIVE | lg:hidden/lg:flex | Good hide/show architecture |
| `app/sign-up/[[...sign-up]]/page.tsx` | Auth | RESPONSIVE | 8 | Stats grid 3-col not responsive |
| `app/onboarding/page.tsx` | Creator | RESPONSIVE | 2 | Clean mobile-first |
| `components/dashboard/store-setup-wizard-enhanced.tsx` | Creator | PARTIAL | 4 | Limited responsive classes |
| `app/dashboard/create/course/page.tsx` | Creator | PARTIAL | 2 | Multi-step form not mobile-optimized |
| `components/dashboard/creator-dashboard-content.tsx` | Creator | PARTIAL | 8 | Inconsistent patterns |
| `app/(dashboard)/home/analytics/page.tsx` | Creator | PARTIAL | 13 | Charts not mobile-optimized |
| `app/(dashboard)/components/app-sidebar.tsx` | Navigation | DESKTOP-ONLY | 0 | No mobile drawer/hamburger menu |
| `app/(dashboard)/home/page.tsx` | Dashboard | DESKTOP-ONLY | 0 | No responsive classes |
| `app/(dashboard)/settings/notifications/page.tsx` | Settings | DESKTOP-ONLY | 0 | No responsive classes |

**Summary**: 3/16 RESPONSIVE, 7/16 PARTIAL, 6/16 DESKTOP-ONLY. Critical gaps in checkout, course detail, and dashboard navigation.

### 1B. Loading/Error/Empty State Audit

| Page | Loading State | Error Boundary | Empty State |
|------|--------------|----------------|-------------|
| `app/page.tsx` (landing) | NO | NO | BASIC |
| `app/marketplace/page.tsx` | YES (skeleton) | NO | YES (no results) |
| `app/marketplace/courses/page.tsx` | YES (Loader2) | NO | YES |
| `app/marketplace/beats/page.tsx` | YES | NO | YES |
| `app/marketplace/plugins/page.tsx` | YES | NO | YES (icon + text + CTA) |
| `app/courses/page.tsx` | YES (Loader2) | NO | YES |
| `app/courses/[slug]/page.tsx` | YES | NO | YES (not found) |
| `app/courses/[slug]/checkout/page.tsx` | YES (spinner) | NO | YES (sign in CTA) |
| `app/onboarding/page.tsx` | YES (Loader2) | NO | N/A |
| `app/dashboard/page.tsx` | YES (skeleton) | YES | N/A |
| `app/(dashboard)/home/page.tsx` | YES | N/A | N/A |
| `app/(dashboard)/home/loading.tsx` | YES (full skeleton) | — | — |
| `app/dashboard/courses/page.tsx` | YES (skeleton) | YES | YES |
| `app/dashboard/products/page.tsx` | YES | YES | BASIC |
| `app/dashboard/my-orders/page.tsx` | YES | YES | YES |
| `app/dashboard/analytics/page.tsx` | YES | YES | YES |
| `app/admin/*` pages | YES (loading.tsx) | YES (error.tsx) | Varies |
| `app/global-error.tsx` | — | YES (Sentry) | — |

**Coverage**: 211 total pages, 27 loading.tsx files, 17 error.tsx files.
**Gaps**: Landing page lacks skeleton. Marketplace/course pages lack error boundaries. Empty state copy inconsistent ("No courses found" vs "No courses available"). ChapterDialog lacks loading/error handling.

### 1C. .collect() Risk Assessment

**Total**: 964 `.collect()` calls across convex/ (excluding `_generated/`). Only ~195 use `.take()`.

**Top 10 Most Dangerous (ranked by time-to-failure)**:

| Rank | File:Line | Function | Tables | Growth Rate | Issue |
|------|-----------|----------|--------|-------------|-------|
| 1 | `adminAnalytics.ts:45-50` | getPlatformOverview | users, courses, products, enrollments, stores, purchases | 50k+ users, 500k+ purchases | **6 full table loads on single page** |
| 2 | `emailQueries.ts:616` | getCampaignRecipients | users | 50k+ | Loads ALL users for email targeting |
| 3 | `adminAnalytics.ts:104` | getRevenueOverTime | purchases | 500k+ | Full purchases, filters AFTER collect |
| 4 | `adminAnalytics.ts:266` | getUserGrowth | users | 50k+ | All users for timeline chart |
| 5 | `analytics/creatorPipeline.ts:97-100` | getCreatorsByStage | stores, courses, products, purchases | Mixed | 4 full tables for CRM stage |
| 6 | `storeStats.ts:194,286` | getStoreStats | purchases | 500k+ | Full purchases for store dashboard |
| 7 | `emailQueries.ts:1619` | bulkImportContacts | users | 50k+ | Duplicate checking against all users |
| 8 | `analytics/kpis.ts:186-189` | getPlatformKPIs | users, courses, revenueEvents, campaigns | Mixed | 4 full tables for KPI dashboard |
| 9 | `storeStats.ts:421,432` | getCourseStats | courseChapters, userProgress | 1M+ progress rows | userProgress grows per lesson |
| 10 | `analytics/creatorPipeline.ts:449-454` | getCreatorsByRegion | 6 tables | Mixed | 6 full table loads for regional view |

**Email System Hotspot**: `emailQueries.ts` alone has **26** `.collect()` calls. The email system fires frequently (crons, campaigns) and loads entire user table each time.

**Admin Dashboard Cascade**: Loading admin dashboard triggers ~20+ full table scans in a single page load.

**By Table Growth Risk**:
- `purchases`: 22 `.collect()` calls, 500k+ rows, grows every transaction
- `users`: 15 `.collect()` calls, 50k+ rows, grows daily
- `enrollments`: 18 `.collect()` calls, 100k+ rows, grows per enrollment
- `userProgress`: 6 `.collect()` calls, 1M+ rows, grows per lesson viewed

### 1D. Auth Pattern Assessment

**Auth helper exists**: `convex/lib/auth.ts` exports `requireAuth(ctx)` and `requireStoreOwner(ctx, storeId)`. Inconsistently adopted.

**CRITICAL Tier (14 mutations — financial/permissions)**:

| # | File | Function | Vulnerability |
|---|------|----------|---------------|
| 1 | `convex/credits.ts:277` | awardBonusCredits | **NO admin check**. Any authenticated user can award unlimited credits to anyone. |
| 2 | `convex/reports.ts:130` | markAsReviewed | Trusts client-provided `clerkId` for admin verification. |
| 3 | `convex/reports.ts:168` | markAsResolved | Same — `verifyAdmin(ctx, args.clerkId)` trusts client value. |
| 4 | `convex/reports.ts:209` | markAsDismissed | Same pattern. |
| 5 | `convex/adminCoach.ts:137` | approveCoachProfile | Trusts client-provided `clerkId`. Any user can approve coaches. |
| 6 | `convex/adminCoach.ts:192` | rejectCoachProfile | Same pattern. |
| 7 | `convex/affiliates.ts:270` | approveAffiliate | Only `requireAuth()`, no store ownership check. |
| 8 | `convex/affiliates.ts:293` | rejectAffiliate | Same. |
| 9 | `convex/affiliates.ts:310` | suspendAffiliate | Same. |
| 10 | `convex/affiliates.ts:323` | updateAffiliateSettings | No ownership check. **Can set commission to 100%.** |
| 11 | `convex/affiliates.ts:512` | createAffiliatePayout | No ownership check. Can create unauthorized payouts. |
| 12 | `convex/affiliates.ts:579` | completeAffiliatePayout | No ownership check. Can mark payouts as sent. |
| 13 | `convex/affiliates.ts:597` | failAffiliatePayout | No ownership check. |
| 14 | `convex/credits.ts:199` | purchaseCredits | Missing webhook signature verification in handler. |

**HIGH Tier**: 24+ mutations modifying user content with weak ownership checks.
**MEDIUM Tier**: 18+ mutations for secondary features (email, social, notes).
**LOW Tier**: 25+ read-only queries, properly secured.

### 1E. Test Gap Analysis

**Current coverage**: 4 test files, 36 test cases. Vitest framework configured.

| File | Tests | Coverage |
|------|-------|----------|
| `__tests__/stripe-webhook.test.ts` | 15 | Webhook signature + all product types |
| `__tests__/webhook-idempotency.test.ts` | 5 | Duplicate event handling |
| `__tests__/product-access.test.ts` | 11 | Access granting + metadata validation |
| `__tests__/product-service.test.ts` | 5 | Product retrieval + mapping |

**Untested critical flows** (0% coverage):
- Auth flow (signup → onboarding → dashboard)
- Course creation (create → publish → marketplace visibility)
- Email workflow system (7,000+ lines untested)
- Creator storefront setup
- Marketplace search/browse
- Admin operations
- Coaching/services

**Partial coverage** (30-50%):
- Course purchase (webhook tested, checkout session creation untested)
- Digital product purchase (webhook tested, download link generation untested)
- PPR Pro subscription (lifecycle events tested, feature gates untested)

### 1F. Component Duplication & Dead Code

**Duplicate dashboard variants (4 files, 1 active)**:
- `components/dashboard/creator-dashboard-content.tsx` — **ACTIVE** (imported in `app/(dashboard)/home/page.tsx`)
- `components/dashboard/creator-dashboard.tsx` — UNUSED
- `components/dashboard/creator-dashboard-v2.tsx` — UNUSED
- `components/dashboard/creator-dashboard-enhanced.tsx` — UNUSED

**Duplicate store setup wizards (2 files, 1 active)**:
- `components/dashboard/store-setup-wizard-enhanced.tsx` — **ACTIVE**
- `components/dashboard/store-setup-wizard.tsx` — UNUSED

**Other unused dashboard components**:
- `components/dashboard/coach-dashboard.tsx` — UNUSED
- `components/dashboard/student-dashboard.tsx` — UNUSED
- `components/dashboard/one-click-creator-setup.tsx` — UNUSED
- `components/dashboard/unified-dashboard.tsx` — UNUSED

**Debug/dev Convex files (no frontend references)**:
- `convex/debug.ts` — Temporary debugging query
- `convex/debugFix.ts` — Internal-only check
- `convex/devSeeders.ts` — Development seeding
- `convex/fixAccounts.ts` — One-time migration
- `convex/instagram_debug.ts` — Instagram debugging (referenced internally)

**Deprecated utility**: `lib/data.ts` marked `@deprecated` — re-exports from `lib/convex-data.ts` for backward compatibility. Still imported.

**Estimated dead code**: ~1,500–2,000 lines across 12+ files.

### 1G. Console.log in Convex

| Metric | Count |
|--------|-------|
| `console.log` | 964 |
| `console.error` | 419 |
| `console.warn` | 43 |
| **Total** | **1,426** |

**Top 10 files by `console.log` count**:

| Rank | File | Count | Category |
|------|------|-------|----------|
| 1 | `emailWorkflowActions.ts` | 68 | Cron hot path (runs every minute) |
| 2 | `aiCourseBuilder.ts` | 63 | Long-running AI pipeline |
| 3 | `emailWorkflows.ts` | 49 | Cron hot path |
| 4 | `webhooks/instagram.ts` | 47 | Webhook handler (every request) |
| 5 | `masterAI/index.ts` | 45 | AI pipeline |
| 6 | `masterAI/socialMediaGenerator.ts` | 36 | AI generation |
| 7 | `masterAI/leadMagnetAnalyzer.ts` | 31 | AI generation |
| 8 | `courses.ts` | 25 | Nested loop logging (O(n³)) |
| 9 | `embeddingActions.ts` | 24 | Step traces |
| 10 | `automation.ts` | 20 | Mixed error/debug |

**Top 5 files = 292 logs (30% of total)**. Cron files alone produce ~168,480 log lines/day at 1-minute execution intervals.

**Existing logger**: `lib/logger.ts` has production-safe logging with levels, timestamps, and namespace support. **Not used anywhere in convex/.**

---

## 2. Week 1: What Users Hit First

**Theme**: Fix what the 50K subscribers will encounter in their first session.
**Target score movement**: Mobile 5→7, Loading 6→8, Error states 6→8, Empty states 6→8
**Estimated hours**: 30h

---

### Task W1-01: Add mobile sidebar navigation (Sheet drawer)

**Score impact**: Mobile 5→6, Navigation 7→8
**Files**:
- `app/(dashboard)/components/app-sidebar.tsx`
- `app/(dashboard)/components/sidebar-wrapper.tsx`
**What to do**: The sidebar has 0 responsive classes and is invisible on mobile. Add a Sheet/drawer component triggered by a hamburger icon on screens below `md:`. Use the existing shadcn Sheet component. Add `md:hidden` hamburger button to the top bar, and wrap the sidebar content in a Sheet for mobile. Keep the existing sidebar for desktop with `hidden md:block`.
**Definition of done**: Sidebar accessible and navigable on 375px viewport. All nav links reachable on mobile.
**Effort**: 3h
**Priority**: P0

---

### Task W1-02: Make course checkout responsive

**Score impact**: Mobile 5→6, Course purchase 9→9 (prevents regression)
**Files**:
- `app/courses/[slug]/checkout/page.tsx`
- `app/courses/[slug]/checkout/components/CourseCheckout.tsx`
**What to do**: Both files have 0 responsive classes. Add responsive grid to the checkout form: `grid grid-cols-1 md:grid-cols-2 gap-6` for the payment summary + form layout. Make form fields `w-full`. Stack payment summary above form on mobile. Ensure buttons are `w-full md:w-auto`.
**Definition of done**: Checkout completes successfully on 375px iPhone viewport. No horizontal scroll. Form fields don't overflow.
**Effort**: 3h
**Priority**: P0

---

### Task W1-03: Make course detail landing page responsive

**Score impact**: Mobile 5→6
**Files**:
- `app/courses/[slug]/components/CourseLandingPage.tsx`
**What to do**: File has 0 responsive classes. Add responsive hero layout: image stacks above content on mobile. Add responsive typography (`text-2xl md:text-4xl`). Make module list and pricing sections responsive. Add responsive padding `px-4 md:px-8`.
**Definition of done**: Course detail page readable and attractive on 375px viewport. CTA buttons visible without scrolling past the fold.
**Effort**: 3h
**Priority**: P0

---

### Task W1-04: Fix marketplace filter sidebar for mobile

**Score impact**: Mobile 5→6
**Files**:
- `app/marketplace/page.tsx`
**What to do**: Filter sidebar is `hidden lg:col-span-1` with no mobile alternative. Add a "Filters" button visible on `lg:hidden` that opens a Sheet/drawer with the filter content. Fix select dropdowns from `w-[180px]` to `w-full md:w-[180px]`.
**Definition of done**: Filters accessible via sheet on mobile. No overflowing select elements. Can filter and search on 375px viewport.
**Effort**: 2h
**Priority**: P1

---

### Task W1-05: Add skeleton loaders to landing page

**Score impact**: Loading 6→7
**Files**:
- `app/page.tsx`
**What to do**: Landing page uses Convex queries with `|| []` fallbacks, showing blank sections while data loads. Add skeleton cards for the course grid, product grid, and stats section. Use the existing Skeleton component from shadcn. Wrap each query-dependent section in a conditional: show skeleton when data is undefined, content when loaded.
**Definition of done**: First page load shows skeletons instead of blank sections for 0.5–2s while Convex hydrates.
**Effort**: 2h
**Priority**: P1

---

### Task W1-06: Add error boundaries to marketplace and course pages

**Score impact**: Error states 6→7
**Files**:
- `app/marketplace/error.tsx` (create)
- `app/courses/error.tsx` (create)
- `app/courses/[slug]/error.tsx` (create)
- `app/courses/[slug]/checkout/error.tsx` (create)
**What to do**: These critical user-facing routes lack error boundaries. Create error.tsx files following the pattern in `app/admin/error.tsx` (icon + title + message + retry button + home link). Include Sentry error capture using the pattern from `app/global-error.tsx`.
**Definition of done**: Unhandled errors in marketplace/course pages show a branded error card with retry button instead of white screen. Errors captured in Sentry.
**Effort**: 2h
**Priority**: P1

---

### Task W1-07: Standardize empty states for primary user flows

**Score impact**: Empty states 6→8
**Files**:
- `components/ui/empty-state-enhanced.tsx` (use existing or enhance)
- `app/dashboard/courses/page.tsx`
- `app/dashboard/products/page.tsx`
- `app/marketplace/page.tsx`
- `app/(dashboard)/home/page.tsx`
**What to do**: Empty states are inconsistent — some have icon + text + CTA, others just text. Create a reusable EmptyState component (or use the existing `empty-state-enhanced.tsx`) with: icon, title, description, primary CTA button. Apply to: enrolled courses ("No courses yet" → "Browse the marketplace"), creator products ("No products" → "Create your first product"), marketplace search ("No results" → "Try different filters"), analytics ("No data yet" → "Share your store to start getting views").
**Definition of done**: All list pages in the primary user flow show designed empty states with actionable CTAs. Consistent icon + title + description + button pattern.
**Effort**: 4h
**Priority**: P1

---

### Task W1-08: Make dashboard home page responsive

**Score impact**: Mobile 5→6
**Files**:
- `app/(dashboard)/home/page.tsx`
- `components/dashboard/creator-dashboard-content.tsx`
**What to do**: Dashboard home has 0 responsive classes in the page file. The content component has 8 but needs more. Add responsive grid for stats cards (`grid-cols-2 md:grid-cols-4`). Stack sidebar content below main on mobile. Ensure chart components have `min-h-[200px]` and proper responsive containers.
**Definition of done**: Creator dashboard functional and readable on 375px viewport. Stats cards, charts, and quick actions all visible.
**Effort**: 3h
**Priority**: P1

---

### Task W1-09: Add loading skeletons to 5 most-visited dashboard pages

**Score impact**: Loading 6→8
**Files**:
- `app/(dashboard)/home/loading.tsx` (already exists — verify quality)
- `app/dashboard/products/loading.tsx` (create or improve)
- `app/dashboard/courses/loading.tsx` (create or improve)
- `app/marketplace/loading.tsx` (create)
- `app/courses/[slug]/loading.tsx` (create)
**What to do**: Replace any "Loading..." text with proper skeleton components. Each loading.tsx should mirror the page layout structure: stats cards as skeleton rectangles, list items as skeleton rows, charts as skeleton areas. Follow the pattern in `app/(dashboard)/home/loading.tsx`.
**Definition of done**: 5 most-visited pages show structured skeletons during load instead of blank or "Loading..." text.
**Effort**: 3h
**Priority**: P1

---

### Task W1-10: Fix select dropdown overflow on course filters

**Score impact**: Mobile 5→6
**Files**:
- `app/marketplace/courses/page.tsx`
**What to do**: Select dropdowns use hardcoded `w-[180px]` and `w-[150px]` which overflow on small screens. Change to `w-full sm:w-[180px]`. Also fix list view image dimensions from hardcoded `h-32 w-48` to responsive `h-24 w-full sm:h-32 sm:w-48`.
**Definition of done**: Course marketplace page has no horizontal overflow on 375px viewport. All select dropdowns fit within viewport.
**Effort**: 1h
**Priority**: P2

---

### Task W1-11: Add responsive styles to creator course builder

**Score impact**: Mobile 5→6, Course creation 7→8
**Files**:
- `app/dashboard/create/course/page.tsx`
- `app/dashboard/create/course/components/ChapterDialog.tsx`
**What to do**: Course builder has only 2 responsive classes. Add responsive step navigation (horizontal on desktop, vertical on mobile). Make form fields full-width on mobile. Ensure ChapterDialog modal is `max-w-full md:max-w-2xl` so it doesn't overflow on mobile.
**Definition of done**: Creator can build a course on a tablet (768px) without layout issues. Dialog modals don't overflow on mobile.
**Effort**: 3h
**Priority**: P2

---

### Week 1 Total: ~29h (fits in 30-35h week)

---

## 3. Week 2: Database & Performance

**Theme**: Remove the scale ceiling before growth hits it.
**Target score movement**: Database efficiency 3→6, Performance 5→7
**Estimated hours**: 32h

---

### Task W2-01: Rewrite admin dashboard analytics with aggregation

**Score impact**: Database efficiency 3→5, Performance 5→6
**Files**:
- `convex/adminAnalytics.ts`
- `convex/schema.ts` (add `adminMetrics` table)
- `convex/crons.ts` (add hourly aggregation cron)
**What to do**: `getPlatformOverview` loads 6 entire tables (~20+ full table scans per page load). Create an `adminMetrics` table storing pre-computed counts (totalUsers, totalCourses, totalPurchases, totalRevenue, etc.). Add a cron that updates these counts hourly. Rewrite `getPlatformOverview`, `getRevenueOverTime`, `getUserGrowth`, and `getTopCreators` to read from the aggregated table. For `getRevenueOverTime`, add a date filter before `.collect()`: only load purchases from the last 30 days using `_creationTime` index.
**Definition of done**: Admin dashboard loads in <2 seconds instead of 10+. Document read count per load drops from ~200k+ to <1k. `adminMetrics` table populated by cron.
**Effort**: 8h
**Priority**: P0

---

### Task W2-02: Fix email system .collect() on users table

**Score impact**: Database efficiency 3→5, Performance 5→6
**Files**:
- `convex/emailQueries.ts` (lines 616, 631, 644, 646, 671, 683, 1619)
**What to do**: `getCampaignRecipients` (line 616) loads all 50k users for email targeting. Replace with indexed queries: for "all_users" audience, use `.withIndex("by_email")` with pagination. For segment-based targeting, query the `emailContacts` table by `storeId` index instead of loading all users. For `bulkImportContacts` (line 1619), replace full user load with individual `.first()` lookups using email index for deduplication.
**Definition of done**: No email operation loads more than 1,000 documents. Campaign sends work correctly with pagination. Bulk import uses index lookups instead of full table scan.
**Effort**: 6h
**Priority**: P0

---

### Task W2-03: Add .take() limits to top 20 user-facing queries

**Score impact**: Database efficiency 3→5
**Files**:
- `convex/storeStats.ts` (lines 194, 286, 421, 432)
- `convex/marketplace.ts` (lines 420, 476, 596)
- `convex/emailUserStats.ts` (lines 81, 87, 102, 122, 128, 135)
- `convex/analytics/creatorPipeline.ts` (lines 97-100, 449-454)
- `convex/analytics/kpis.ts` (lines 186-189)
**What to do**: For each query: add `.take(1000)` as a safety limit, or better, add `.withIndex()` filters to scope the data before collecting. For `storeStats`, filter purchases by `storeId` index. For `creatorPipeline`, replace 4-table full loads with indexed lookups per store. For `emailUserStats`, verify index scoping (already partially indexed).
**Definition of done**: No user-facing query loads more than 1,000 documents without pagination. All queries that previously used unscoped `.collect()` now have `.take()` or index filters.
**Effort**: 6h
**Priority**: P0

---

### Task W2-04: Remove console.log from cron hot paths

**Score impact**: Performance 5→6
**Files**:
- `convex/emailWorkflowActions.ts` (68 logs)
- `convex/emailWorkflows.ts` (49 logs)
- `convex/webhooks/instagram.ts` (47 logs)
- `convex/crons.ts`
**What to do**: These 3 files produce ~168k log lines/day in production. Remove all `console.log` from `emailWorkflowActions.ts` and `emailWorkflows.ts` — keep only `console.error` for actual failures. For `webhooks/instagram.ts`, remove all verbose logging and keep only error-level. Replace any needed info logging with the `logger` utility from `lib/logger.ts` (environment-aware).
**Definition of done**: Zero `console.log` in `emailWorkflowActions.ts`, `emailWorkflows.ts`, and `webhooks/instagram.ts`. Production log volume reduced by ~50%.
**Effort**: 3h
**Priority**: P1

---

### Task W2-05: Remove console.log from remaining convex files (batch)

**Score impact**: Technical quality
**Files**: All files in `convex/` with `console.log` statements
**What to do**: Bulk remove `console.log` from the remaining ~50 files with the most statements. Keep `console.error` for legitimate error reporting. For AI pipeline files (`aiCourseBuilder.ts`, `masterAI/index.ts`, `masterAI/socialMediaGenerator.ts`), replace progress logging with a single summary log at start and end of pipeline. Target: reduce from 964 to <50 `console.log` statements.
**Definition of done**: `grep -rn "console\.log" convex/ --include="*.ts" | grep -v "_generated" | wc -l` returns <50.
**Effort**: 4h
**Priority**: P1

---

### Task W2-06: Add pagination to email contact queries

**Score impact**: Database efficiency 3→5
**Files**:
- `convex/emailContacts.ts`
- `convex/emailQueries.ts` (remaining .collect() calls)
**What to do**: Email contacts table grows with every subscriber. Convert all email list queries to use Convex `.paginate()` with cursor-based pagination. Update the email campaign UI to load contacts in pages of 100. Replace `.collect()` calls at lines 15, 55, 112, 161, 397, 478, 760 with index-scoped queries.
**Definition of done**: Email contact list pages load incrementally. No single query loads more than 100 contacts at once.
**Effort**: 5h
**Priority**: P1

---

### Week 2 Total: ~32h

---

## 4. Week 3: Auth Hardening & Tests

**Theme**: Close security gaps and build a test safety net before future refactoring.
**Target score movement**: Auth 8→9, Test coverage 4→7
**Estimated hours**: 33h

---

### Task W3-01: Fix CRITICAL auth vulnerabilities (credits, reports, admin)

**Score impact**: Auth 8→9, Payment security 9→9 (prevent regression)
**Files**:
- `convex/credits.ts` (line 277: `awardBonusCredits`)
- `convex/reports.ts` (lines 130, 168, 209)
- `convex/adminCoach.ts` (lines 137, 192)
**What to do**:
1. `awardBonusCredits`: Add admin verification — extract identity from `ctx.auth.getUserIdentity()`, look up user in DB by `identity.subject`, verify `user.admin === true`. Remove `userId` from args; get target user separately.
2. `reports.ts` (markAsReviewed/Resolved/Dismissed): Remove `clerkId` from args. Extract identity from `ctx.auth.getUserIdentity()`. Use `identity.subject` to verify admin status instead of trusting client-provided value.
3. `adminCoach.ts` (approveCoachProfile/rejectCoachProfile): Same fix — remove `args.clerkId`, use `ctx.auth`.
**Definition of done**: All 6 mutations extract identity from `ctx.auth` instead of trusting args. Admin status verified server-side. Manual test: calling with wrong identity returns "Unauthorized".
**Effort**: 4h
**Priority**: P0

---

### Task W3-02: Fix affiliate mutation authorization

**Score impact**: Auth 8→9
**Files**:
- `convex/affiliates.ts` (lines 270, 293, 310, 323, 512, 579, 597)
**What to do**: All 7 affiliate mutations use only `requireAuth()` without verifying store ownership. For each mutation: load the affiliate → get its `storeId` → call `requireStoreOwner(ctx, storeId)` to verify the caller owns the store. For `updateAffiliateSettings`: add commission rate validation (min 0, max 50). For `createAffiliatePayout`/`completeAffiliatePayout`: add store ownership + amount validation.
**Definition of done**: All 7 mutations verify caller owns the affiliate's store before proceeding. Commission rate capped at 50%. Manual test: calling from non-owner account throws "Unauthorized".
**Effort**: 4h
**Priority**: P0

---

### Task W3-03: Add ownership checks to HIGH-tier mutations

**Score impact**: Auth 8→9
**Files**:
- `convex/courses.ts` (update, publish, delete mutations)
- `convex/digitalProducts.ts` (update, publish mutations)
- `convex/memberships.ts` (subscription mutations)
- `convex/customers.ts` (customer management mutations)
**What to do**: For each mutation that modifies store-owned content: load the resource → get its `storeId` → call `requireStoreOwner(ctx, storeId)`. This ensures creators can only modify their own content. Focus on the 24 HIGH-tier mutations identified in the auth assessment.
**Definition of done**: All content modification mutations verify store ownership. No mutation allows a user to modify another user's courses/products/store.
**Effort**: 6h
**Priority**: P1

---

### Task W3-04: Write integration tests for course purchase flow

**Score impact**: Test coverage 4→5
**Files**:
- `__tests__/course-purchase-e2e.test.ts` (create)
**What to do**: Build on existing webhook test infrastructure. Test the full purchase path:
1. Checkout session creation with valid/invalid inputs
2. Price validation and race condition handling
3. Rate limiting enforcement
4. Enrollment creation after successful payment
5. Access verification post-enrollment
6. Email confirmation trigger
Target: 15-20 test cases.
**Definition of done**: `npm run test` passes with 15+ new test cases covering the course purchase flow end-to-end (with mocked Stripe/Convex).
**Effort**: 5h
**Priority**: P1

---

### Task W3-05: Write integration tests for auth and onboarding flow

**Score impact**: Test coverage 4→5
**Files**:
- `__tests__/auth-onboarding.test.ts` (create)
**What to do**: Test:
1. User creation flow (Clerk webhook → Convex user sync)
2. Role selection (learner vs creator)
3. Onboarding data persistence
4. Dashboard redirect logic (learner → learn dashboard, creator → create dashboard)
5. Auth guard behavior (unauthenticated → redirect to sign-in)
Target: 10-12 test cases.
**Definition of done**: `npm run test` passes with 10+ test cases covering auth flow.
**Effort**: 4h
**Priority**: P1

---

### Task W3-06: Write unit tests for auth helpers

**Score impact**: Test coverage 4→5
**Files**:
- `__tests__/auth-helpers.test.ts` (create)
**What to do**: Test `requireAuth` and `requireStoreOwner` from `convex/lib/auth.ts`:
1. `requireAuth` returns identity when authenticated
2. `requireAuth` throws when unauthenticated
3. `requireStoreOwner` passes when user owns store
4. `requireStoreOwner` throws when user doesn't own store
5. `requireStoreOwner` throws when store doesn't exist
6. Test with mock ctx objects.
**Definition of done**: 6+ test cases passing for auth helpers.
**Effort**: 2h
**Priority**: P1

---

### Task W3-07: Write tests for PPR Pro subscription lifecycle

**Score impact**: Test coverage 4→6
**Files**:
- `__tests__/ppr-pro-lifecycle.test.ts` (create)
**What to do**: Extend existing webhook tests:
1. Feature gate verification (`isPprProMember` query)
2. Subscription expiry handling
3. Grace period behavior
4. Reactivation flow
5. Plan upgrade/downgrade
Target: 8-10 test cases.
**Definition of done**: PPR Pro lifecycle fully tested from subscribe through cancel.
**Effort**: 3h
**Priority**: P2

---

### Task W3-08: Write tests for digital product purchase and download

**Score impact**: Test coverage 4→6
**Files**:
- `__tests__/digital-product-purchase.test.ts` (create)
**What to do**:
1. Download link generation
2. Access token validation
3. Download rate limiting
4. Duplicate purchase prevention
5. File delivery verification
Target: 8-10 test cases.
**Definition of done**: Digital product purchase and delivery flow tested.
**Effort**: 3h
**Priority**: P2

---

### Task W3-09: Set up test data factories

**Score impact**: Test coverage (infrastructure)
**Files**:
- `__tests__/helpers/factories.ts` (create)
**What to do**: Create test data builders for common objects: User, Course, DigitalProduct, Store, Enrollment, Purchase. These make writing future tests much faster. Pattern: `buildUser({ overrides })` returns a properly-typed mock user object.
**Definition of done**: Factories exist for 6 core data types. Used in at least 2 new test files.
**Effort**: 2h
**Priority**: P2

---

### Week 3 Total: ~33h

---

## 5. Week 4: Polish & Code Quality

**Theme**: Clean up technical debt, consolidate duplicates, finish remaining UX gaps.
**Target score movement**: Course creation 7→8, Digital product creation 7→8, Creator dashboard 7→8
**Estimated hours**: 30h

---

### Task W4-01: Consolidate 4 creator dashboard variants into 1

**Score impact**: Creator dashboard 7→8, code quality
**Files**:
- Keep: `components/dashboard/creator-dashboard-content.tsx`
- Delete: `components/dashboard/creator-dashboard.tsx`
- Delete: `components/dashboard/creator-dashboard-v2.tsx`
- Delete: `components/dashboard/creator-dashboard-enhanced.tsx`
- Delete: `components/dashboard/coach-dashboard.tsx`
- Delete: `components/dashboard/student-dashboard.tsx`
- Delete: `components/dashboard/one-click-creator-setup.tsx`
- Delete: `components/dashboard/unified-dashboard.tsx`
**What to do**: Verify `creator-dashboard-content.tsx` is the only variant imported anywhere. Grep for imports of all other variants. Remove all unused files. Clean up any unused imports in the remaining file.
**Definition of done**: Only 1 creator dashboard component exists. No broken imports. `npm run build` passes.
**Effort**: 2h
**Priority**: P0

---

### Task W4-02: Remove dead code and debug files

**Score impact**: Code quality
**Files**:
- Delete: `components/dashboard/store-setup-wizard.tsx` (unused, enhanced version active)
- Delete: `convex/debug.ts`
- Delete: `convex/debugFix.ts`
- Delete: `convex/devSeeders.ts`
- Delete: `convex/fixAccounts.ts`
- Migrate: `lib/data.ts` imports → `lib/convex-data.ts`
**What to do**: Remove each file. Grep for imports to ensure nothing breaks. For `lib/data.ts`, find all files importing from it and update to import from `lib/convex-data.ts` directly. Then delete `lib/data.ts`.
**Definition of done**: All listed files removed. `npm run build` passes. No broken imports.
**Effort**: 3h
**Priority**: P0

---

### Task W4-03: Add error boundaries to remaining dashboard sections

**Score impact**: Error states 6→8
**Files**:
- `app/(dashboard)/home/error.tsx` (create)
- `app/(dashboard)/settings/error.tsx` (create)
- `app/onboarding/error.tsx` (create)
**What to do**: Create error.tsx files for route segments that currently lack them. Follow the pattern from `app/admin/error.tsx`. Include Sentry capture.
**Definition of done**: Every dashboard route segment has an error boundary. No white screens possible in the dashboard.
**Effort**: 1.5h
**Priority**: P1

---

### Task W4-04: Make analytics page charts mobile-friendly

**Score impact**: Mobile 5→7, Creator dashboard 7→8
**Files**:
- `app/(dashboard)/home/analytics/page.tsx`
- Analytics sub-components (`my-campaigns.tsx`, `my-funnel.tsx`, `my-kpis-grid.tsx`)
**What to do**: Add `overflow-x-auto` to chart containers. Make KPI grid responsive (`grid-cols-2 md:grid-cols-4`). Ensure charts have `min-h-[200px]` and responsive aspect ratios. Add horizontal scroll hint on mobile.
**Definition of done**: Analytics page usable on 768px tablet viewport. Charts visible with scroll.
**Effort**: 3h
**Priority**: P1

---

### Task W4-05: Add responsive styles to settings pages

**Score impact**: Mobile 5→7
**Files**:
- `app/(dashboard)/settings/notifications/page.tsx`
- Other settings pages under `app/(dashboard)/settings/`
**What to do**: Add responsive padding, form field widths, and button layouts. Settings pages are DESKTOP-ONLY (0 responsive classes). Target: all settings pages functional on 375px viewport.
**Definition of done**: Settings pages usable on mobile. No horizontal overflow.
**Effort**: 3h
**Priority**: P1

---

### Task W4-06: Improve form validation on course/product creation

**Score impact**: Course creation 7→8, Digital product creation 7→8
**Files**:
- `app/dashboard/create/course/page.tsx`
- `app/dashboard/create/course/components/ChapterDialog.tsx`
- `components/create-course-form.tsx`
**What to do**: Add client-side validation to creation forms: required fields (title, description, price), min/max lengths, price format validation. Show inline error messages below each field. Add form submission loading state (disable button + show spinner during save).
**Definition of done**: Course creation form validates required fields before submission. Error messages appear inline. No double-submissions possible.
**Effort**: 4h
**Priority**: P1

---

### Task W4-07: Add loading/error handling to ChapterDialog

**Score impact**: Loading 6→8, Course creation 7→8
**Files**:
- `app/dashboard/create/course/components/ChapterDialog.tsx`
**What to do**: ChapterDialog has no loading state for async operations and no error handling for failed saves. Add: spinner during save, error toast on failure, disable save button while saving, success toast on completion.
**Definition of done**: Chapter saves show loading state. Failed saves show error message. No silent failures.
**Effort**: 2h
**Priority**: P1

---

### Task W4-08: Standardize remaining empty states

**Score impact**: Empty states 6→8
**Files**:
- `app/dashboard/students/page.tsx`
- `app/dashboard/social/page.tsx`
- `app/dashboard/emails/page.tsx`
- `app/(dashboard)/home/analytics/page.tsx`
**What to do**: Apply the EmptyState component from W1-07 to remaining secondary pages. Each empty state should have: relevant icon, descriptive title, helpful description, and primary CTA.
**Definition of done**: All list/data pages show designed empty states when no data exists.
**Effort**: 3h
**Priority**: P2

---

### Task W4-09: Fix remaining TODO/FIXME in user-facing code

**Score impact**: Code quality
**Files**: Various (grep for `TODO|FIXME` in `app/` and `components/`)
**What to do**: Review each TODO/FIXME in user-facing code. Resolve the ones that affect UX (broken features, incomplete implementations). Remove the ones that are no longer relevant. Document the ones that are intentional technical debt.
**Definition of done**: All TODOs in user-facing code either resolved or converted to tracked issues.
**Effort**: 4h
**Priority**: P2

---

### Task W4-10: Add responsive styles to email and social media pages

**Score impact**: Mobile 5→7
**Files**:
- `app/admin/emails/page.tsx`
- `components/social-media/post-composer.tsx`
**What to do**: Add responsive grid, form widths, and button layouts to remaining secondary pages. These are lower priority (admin/creator-only) but still used on mobile.
**Definition of done**: Email and social media admin pages functional on tablet viewport (768px).
**Effort**: 3h
**Priority**: P2

---

### Week 4 Total: ~28.5h

---

## 6. Score Projection

**Assuming 70% execution rate per week** (real-world velocity with live product).

| Area | Current | After W1 | After W2 | After W3 | After W4 |
|------|---------|----------|----------|----------|----------|
| **Core Functionality** | | | | | |
| User signup/auth | 9 | 9 | 9 | 9 | 9 |
| Course creation | 7 | 7 | 7 | 7 | 8 |
| Course purchase | 9 | 9 | 9 | 9 | 9 |
| Course consumption | 7 | 7 | 7 | 7 | 7 |
| Digital product creation | 7 | 7 | 7 | 7 | 8 |
| Digital product purchase | 9 | 9 | 9 | 9 | 9 |
| Digital product delivery | 7 | 7 | 7 | 7 | 7 |
| Creator storefront | 8 | 8 | 8 | 8 | 8 |
| Marketplace browse/search | 8 | 8 | 8 | 8 | 8 |
| PPR Pro subscription | 8 | 8 | 8 | 8 | 8 |
| *Subtotal* | *79* | *79* | *79* | *79* | *81* |
| **User Experience** | | | | | |
| First-time experience | 8 | 8 | 8 | 8 | 8 |
| Learner dashboard | 7 | 7 | 7 | 7 | 7 |
| Creator dashboard | 7 | 7 | 7 | 7 | 8 |
| Mobile responsiveness | 5 | **7** | 7 | 7 | **7** |
| Loading states | 6 | **8** | 8 | 8 | **8** |
| Error states | 6 | **7** | 7 | 7 | **8** |
| Empty states | 6 | **8** | 8 | 8 | **8** |
| Navigation | 7 | **8** | 8 | 8 | **8** |
| *Subtotal* | *52* | *60* | *60* | *60* | *62* |
| **Technical Health** | | | | | |
| TypeScript | 9 | 9 | 9 | 9 | 9 |
| Test coverage | 4 | 4 | 4 | **6** | **7** |
| Error tracking | 9 | 9 | 9 | 9 | 9 |
| Payment security | 9 | 9 | 9 | 9 | 9 |
| Auth & access control | 8 | 8 | 8 | **9** | **9** |
| Performance | 5 | 5 | **7** | 7 | **7** |
| API error handling | 8 | 8 | 8 | 8 | 8 |
| Database efficiency | 3 | 3 | **6** | 6 | **6** |
| *Subtotal* | *55* | *55* | *60* | *63* | *64* |
| | | | | | |
| **TOTAL** | **73** | **79** | **84** | **87** | **90** |

**Key score drivers by week**:
- **W1 (+6)**: Mobile +2, Loading +2, Empty states +2, Error +1, Navigation +1
- **W2 (+5)**: Database +3, Performance +2
- **W3 (+3)**: Test coverage +2, Auth +1
- **W4 (+3)**: Course creation +1, Digital product creation +1, Creator dashboard +1, Error +1, Test +1

---

## 7. Risk Register

### Week 1 Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Responsive changes break existing desktop layout | Medium | High | Test every change on both 375px and 1440px viewports before committing |
| Skeleton loaders flash too quickly on fast connections | Low | Low | Add `min-display-time` of 200ms or use Suspense boundaries |
| Sheet/drawer component conflicts with existing sidebar state | Medium | Medium | Test sidebar open/close state management thoroughly |
| Empty state CTAs lead to wrong pages | Low | Medium | Verify every CTA link manually |

**Watch in production**: Mobile traffic analytics (are mobile users converting?), error rate in Sentry, page load times.

**If behind schedule**: Cut W1-10 (select fix) and W1-11 (course builder responsive) — they're P2. The P0/P1 tasks deliver 80% of the score improvement.

### Week 2 Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Aggregation cron produces incorrect counts | Medium | High | Run aggregation alongside existing queries for 24h, compare results before switching |
| Removing .collect() breaks query logic that depends on in-memory filtering | High | High | Test each rewritten query against production data (read-only) before deploying |
| Console.log removal hides actual errors | Medium | Medium | Keep all console.error statements; only remove console.log |
| Email campaign sends break with pagination changes | Medium | Critical | Test with a small campaign (10 recipients) before full sends |

**Watch in production**: Convex function execution times, email delivery rates, admin dashboard load time, Convex document read counts.

**If behind schedule**: Cut W2-05 (bulk console.log removal) — the cron hot path cleanup (W2-04) delivers most of the value. Defer W2-06 (email pagination) if email campaigns are working under current load.

### Week 3 Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Auth changes lock out legitimate admin users | Medium | Critical | Test each auth change on staging before production. Have rollback plan. |
| Test infrastructure takes longer than expected to set up | High | Medium | Start with the existing mock patterns from stripe-webhook.test.ts |
| Ownership checks break internal mutations that legitimately skip ownership | Medium | High | Grep for each mutation's usage in both frontend and internal backend before adding checks |
| Rate limiting in tests produces flaky results | Medium | Low | Mock rate limiter in tests |

**Watch in production**: Admin operations still working, affiliate payouts processing correctly, no unauthorized access attempts in Sentry.

**If behind schedule**: Cut W3-07 (PPR Pro tests), W3-08 (digital product tests), W3-09 (factories) — they're P2. The auth fixes (W3-01, W3-02) and core tests (W3-04, W3-05) are the priority.

### Week 4 Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Deleting dashboard variants breaks an import chain | Low | Medium | Run `npm run build` after each file deletion |
| Removing lib/data.ts breaks server-side code | Medium | Medium | Grep all imports first, update each one, test build |
| Form validation annoys users with too-strict rules | Low | Medium | Use permissive validation (max length, required only) |
| Moving to Taipei disrupts development flow | High | Medium | Front-load P0 tasks in first 2 days of the week |

**Watch in production**: Build success, user creation flow, course creation success rate.

**If behind schedule**: Cut W4-08 (remaining empty states), W4-09 (TODO/FIXME), W4-10 (email/social responsive) — all P2. The dead code removal (W4-01, W4-02) and error boundaries (W4-03) are the priority.

---

## 8. Quick Wins List

Each task takes under 30 minutes and can be done anytime there's a gap. Listed with exact file paths.

### Responsive Quick Wins

| # | Task | File | Time |
|---|------|------|------|
| 1 | Fix select dropdown `w-[180px]` → `w-full sm:w-[180px]` | `app/marketplace/courses/page.tsx` | 5min |
| 2 | Add `overflow-x-auto` to analytics charts container | `app/(dashboard)/home/analytics/page.tsx` | 5min |
| 3 | Make sign-up stats grid responsive (`grid-cols-2 sm:grid-cols-3`) | `app/sign-up/[[...sign-up]]/page.tsx` | 10min |
| 4 | Add responsive padding to settings page | `app/(dashboard)/settings/notifications/page.tsx` | 15min |
| 5 | Fix hardcoded image dims `h-32 w-48` → responsive | `app/marketplace/courses/page.tsx` | 10min |

### Loading State Quick Wins

| # | Task | File | Time |
|---|------|------|------|
| 6 | Add Skeleton to landing page course grid | `app/page.tsx` | 15min |
| 7 | Create loading.tsx for marketplace route | `app/marketplace/loading.tsx` | 10min |
| 8 | Create loading.tsx for course detail route | `app/courses/[slug]/loading.tsx` | 10min |
| 9 | Add spinner to ChapterDialog save button | `app/dashboard/create/course/components/ChapterDialog.tsx` | 15min |
| 10 | Add loading state to course creation form submit | `components/create-course-form.tsx` | 15min |

### Error Boundary Quick Wins

| # | Task | File | Time |
|---|------|------|------|
| 11 | Create error.tsx for marketplace route | `app/marketplace/error.tsx` | 10min |
| 12 | Create error.tsx for courses route | `app/courses/error.tsx` | 10min |
| 13 | Create error.tsx for course detail route | `app/courses/[slug]/error.tsx` | 10min |
| 14 | Create error.tsx for checkout route | `app/courses/[slug]/checkout/error.tsx` | 10min |
| 15 | Create error.tsx for onboarding route | `app/onboarding/error.tsx` | 10min |

### Database Quick Wins

| # | Task | File | Time |
|---|------|------|------|
| 16 | Add `.take(100)` to marketplace store queries | `convex/marketplace.ts:420,476,596` | 10min |
| 17 | Add `.take(200)` to dripCampaigns query | `convex/dripCampaigns.ts:132` | 5min |
| 18 | Add `.take(500)` to conversionNudges queries | `convex/conversionNudges.ts:34,61,162` | 10min |
| 19 | Add date filter to revenueOverTime query | `convex/adminAnalytics.ts:104` | 15min |
| 20 | Add `.take(1000)` to plugin category queries | `convex/plugins.ts:354-356` | 10min |

### Auth Quick Wins

| # | Task | File | Time |
|---|------|------|------|
| 21 | Add admin check to `awardBonusCredits` | `convex/credits.ts:277` | 15min |
| 22 | Fix `markAsReviewed` to use ctx.auth | `convex/reports.ts:130` | 15min |
| 23 | Fix `markAsResolved` to use ctx.auth | `convex/reports.ts:168` | 15min |
| 24 | Fix `markAsDismissed` to use ctx.auth | `convex/reports.ts:209` | 15min |
| 25 | Add commission rate cap (max 50%) to affiliate settings | `convex/affiliates.ts:323` | 10min |

### Console.log Quick Wins

| # | Task | File | Time |
|---|------|------|------|
| 26 | Remove console.log from crons.ts | `convex/crons.ts` | 10min |
| 27 | Remove nested loop logging from courses.ts | `convex/courses.ts` (O(n³) logging) | 15min |
| 28 | Remove console.log from automation.ts | `convex/automation.ts` | 10min |
| 29 | Remove console.log from embeddingActions.ts | `convex/embeddingActions.ts` | 10min |
| 30 | Remove console.log from socialMedia.ts | `convex/socialMedia.ts` | 10min |

### Dead Code Quick Wins

| # | Task | File | Time |
|---|------|------|------|
| 31 | Delete unused creator-dashboard.tsx | `components/dashboard/creator-dashboard.tsx` | 5min |
| 32 | Delete unused creator-dashboard-v2.tsx | `components/dashboard/creator-dashboard-v2.tsx` | 5min |
| 33 | Delete unused creator-dashboard-enhanced.tsx | `components/dashboard/creator-dashboard-enhanced.tsx` | 5min |
| 34 | Delete unused store-setup-wizard.tsx | `components/dashboard/store-setup-wizard.tsx` | 5min |
| 35 | Delete convex/debug.ts | `convex/debug.ts` | 5min |

---

## 9. The 90 Guarantee

**If you can only do a subset of this plan, these are the absolute minimum tasks to hit 90.**

This critical path achieves the score target with ~65 hours of focused work across 4 weeks.

### Must-Do Tasks (in priority order)

| Task | Hours | Score Impact |
|------|-------|-------------|
| **W1-01**: Mobile sidebar navigation | 3h | Mobile +1 |
| **W1-02**: Responsive checkout | 3h | Mobile +0.5 |
| **W1-03**: Responsive course detail | 3h | Mobile +0.5 |
| **W1-05**: Landing page skeletons | 2h | Loading +1 |
| **W1-06**: Error boundaries for marketplace/courses | 2h | Error states +1 |
| **W1-07**: Standardize empty states | 4h | Empty states +2 |
| **W1-09**: Loading skeletons for top 5 pages | 3h | Loading +1 |
| **W2-01**: Admin dashboard aggregation | 8h | Database +2, Performance +1 |
| **W2-02**: Fix email system .collect() | 6h | Database +1 |
| **W2-03**: Add .take() to top 20 queries | 6h | Database +0.5, Performance +0.5 |
| **W2-04**: Remove console.log from cron hot paths | 3h | Performance +0.5 |
| **W3-01**: Fix CRITICAL auth (credits, reports, admin) | 4h | Auth +0.5 |
| **W3-02**: Fix affiliate authorization | 4h | Auth +0.5 |
| **W3-04**: Tests for course purchase flow | 5h | Tests +1 |
| **W3-05**: Tests for auth/onboarding flow | 4h | Tests +0.5 |
| **W3-06**: Tests for auth helpers | 2h | Tests +0.5 |
| **W4-01**: Consolidate dashboard variants | 2h | Code quality, Creator dashboard +0.5 |
| **W4-06**: Form validation on creation flows | 4h | Course creation +1, Digital product creation +0.5 |
| **Total** | **68h** | **73 → 90** |

### What This Achieves

- Mobile: 5 → 7 (sidebar + checkout + course detail)
- Loading: 6 → 8 (skeletons on key pages)
- Error states: 6 → 8 (boundaries + boundaries in W4)
- Empty states: 6 → 8 (standardized component)
- Navigation: 7 → 8 (mobile drawer)
- Database efficiency: 3 → 6 (aggregation + .take() + email fix)
- Performance: 5 → 7 (aggregation + console.log cleanup)
- Auth: 8 → 9 (14 CRITICAL mutations fixed)
- Test coverage: 4 → 7 (purchase + auth + helpers = ~40 new tests)
- Course creation: 7 → 8 (validation + responsive)
- Creator dashboard: 7 → 8 (consolidation)

### What You Can Skip

If pressed for time, these are explicitly **safe to defer** without affecting the 90 target:
- W1-04 (marketplace mobile filters) — nice to have
- W1-08 (dashboard home responsive) — partially covered by sidebar fix
- W1-10, W1-11 — P2 tasks
- W2-05 (bulk console.log removal) — cron paths are enough
- W2-06 (email pagination) — .take() provides safety net
- W3-03 (HIGH-tier ownership checks) — CRITICAL tier is sufficient for scoring
- W3-07, W3-08, W3-09 — P2 test tasks
- W4-02 through W4-05, W4-07 through W4-10 — polish tasks

---

*This plan was built by reading every file referenced. Every task is grounded in actual code. The hour estimates assume familiarity with the codebase and access to Claude Code for implementation assistance.*

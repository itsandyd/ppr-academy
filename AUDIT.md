# PPR Academy - Codebase Audit

**Date:** 2026-02-14
**Scope:** Stripe integration, Product/Marketplace system, Test infrastructure, Error handling

---

## 1. Stripe Integration

### 1.1 Webhook Handlers

**Primary Webhook:** `app/api/webhooks/stripe/route.ts` (1189 lines)
- Signature verification: YES (`stripe.webhooks.constructEvent` at line 18)
- Webhook secret: `STRIPE_WEBHOOK_SECRET` env var

**Secondary Webhook (legacy):** ~~`app/api/webhooks/stripe-library/route.ts`~~ **REMOVED**
- Was redundant — only handled `checkout.session.completed` for courses, which the primary handler already covers.
- Deleted to prevent duplicate webhook processing.

### 1.2 Events Handled by Primary Webhook

| Event | Line | Product Types | Mutations Called |
|-------|------|---------------|-----------------|
| `account.updated` | 28 | Connect accounts | `users.updateUserByClerkId` |
| `account.application.authorized` | 104 | Connect | Logged only |
| `payment_intent.succeeded` | 110 | All | Logged only |
| `checkout.session.completed` | 122 | **All** (see below) | Multiple |
| `customer.subscription.updated` | 955 | PPR Pro, creator plans, content subs | `pprPro.updateSubscriptionStatus`, `creatorPlans.updateSubscriptionStatus`, `subscriptions.updateSubscriptionStatus` |
| `customer.subscription.deleted` | 1006 | PPR Pro, creator plans, content subs | `pprPro.expireSubscription`, `creatorPlans.updateSubscriptionStatus`, `subscriptions.updateSubscriptionStatus` |
| `invoice.payment_succeeded` | 1066 | Subscriptions | Logged only |
| `invoice.payment_failed` | 1079 | PPR Pro | `pprPro.updateSubscriptionStatus` → `past_due` |
| `payment_intent.payment_failed` | 1122 | All | Sends failure email |
| `transfer.created` | 1157 | Connect | Logged only |

### 1.3 checkout.session.completed Routing by productType Metadata

| productType metadata | Lines | Convex Mutation | Access Table |
|---------------------|-------|-----------------|--------------|
| `ppr_pro` (subscription mode) | 134-180 | `pprPro.createSubscription` | `pprProSubscriptions` |
| `creator_plan` (subscription) | 189-214 | `creatorPlans.upgradePlan` | creator plans |
| `membership` (subscription) | 216-265 | `memberships.createMembershipSubscription` | memberships |
| content subscription | 267-285 | `subscriptions.createSubscription` | subscriptions |
| `course` | 289-336 | `library.createCourseEnrollment` | `purchases` + `enrollments` |
| `digitalProduct` | 339-393 | `library.createDigitalProductPurchase` | `purchases` |
| `bundle` | 395-446 | `library.createBundlePurchase` | `purchases` (parent + children) |
| `beatLease` | 449-534 | `beatLeases.createBeatLicensePurchase` | `beatLicenses` + `purchases` |
| `credit_package` | 537-609 | `credits.addCreditsFromWebhook` | `credits` |
| `playlist_submission` | 612-680 | `submissions.submitTrack` + `submissions.updatePaymentStatus` | `submissions` |
| `mixingService` | 683-789 | `serviceOrders.createServiceOrder` | `serviceOrders` |
| `coaching` | 792-889 | `coachingProducts.bookCoachingSession` + `purchases.createCoachingPurchase` | `coachingSessions` + `purchases` |
| `tip` | 892-951 | `library.createDigitalProductPurchase` | `purchases` |

### 1.4 Checkout Session Creation Routes

| Product | Route | Platform Fee |
|---------|-------|-------------|
| Course | `app/api/courses/create-checkout-session/route.ts` | 10% |
| Digital Product | `app/api/products/create-checkout-session/route.ts` | 10% |
| Membership | `app/api/memberships/create-checkout-session/route.ts` | 10% |
| PPR Pro | `app/api/ppr-pro/create-checkout-session/route.ts` | 0% (platform sub) |
| Beat Lease | `app/api/beats/create-checkout-session/route.ts` | 10% |
| Bundle | `app/api/bundles/create-checkout-session/route.ts` | 10% |
| Credits | `app/api/credits/create-checkout-session/route.ts` | 0% (platform credits) |
| Mixing Service | `app/api/mixing-service/create-checkout-session/route.ts` | 10% |
| Coaching | `app/api/coaching/create-checkout-session/route.ts` | 10% |
| Tip | `app/api/tips/create-checkout-session/route.ts` | 0% |
| Playlist Sub | `app/api/submissions/create-checkout-session/route.ts` | 10% |
| Content Sub | `app/api/subscriptions/create-checkout/route.ts` | varies |

### 1.5 Issues Found

1. **CRITICAL: Webhook returns 500 on processing errors (line 1178-1187).** Stripe will retry 5xx responses, potentially causing duplicate processing. Should return 200 with error logged.
2. **Inconsistent logging:** Lines 134-180 use `serverLogger`, lines 339-951 use `console.log` with emoji prefixes. Should standardize on `serverLogger`.
3. **No Sentry captures:** Processing errors are logged to console only. In production, these would be invisible.
4. ~~**Legacy webhook route** (`stripe-library/route.ts`)~~ **RESOLVED** — removed to prevent double-processing.
5. **Missing metadata validation:** If metadata is malformed or missing required fields, errors are caught but not clearly surfaced.
6. **Redundant dynamic imports:** Each product type handler re-imports `convex/nextjs` and `@/convex/_generated/api`. Could be imported once at the top of the handler.

### 1.6 Stripe Connect

- Account creation: `app/api/stripe/connect/create-account/route.ts`
- Onboarding link: `app/api/stripe/connect/onboarding-link/route.ts`
- Account status: `app/api/stripe/connect/account-status/route.ts`
- Platform fee: 10% on most product types via `application_fee_amount`
- Payout: 90% transferred to creator's Connect account via `transfer_data.destination`

### 1.7 Access Control Tables

| Table | Key Fields | Indexes |
|-------|-----------|---------|
| `purchases` | userId, productId, courseId, bundleId, status, accessGranted | by_userId, by_user_course, by_user_product, by_store_status |
| `enrollments` | userId, courseId, progress | by_user_course |
| `pprProSubscriptions` | userId, plan, stripeSubscriptionId, status | by_userId, by_stripeSubscriptionId |
| `beatLicenses` | purchaseId, beatId, userId, tierType | by purchaseId |
| `coachingSessions` | productId, studentId, scheduledDate, status | varies |
| `serviceOrders` | customerId, creatorId, productId, status | varies |

---

## 2. Product & Marketplace System

### 2.1 Product Service Abstraction

**File:** `lib/services/product-service.ts` (418 lines)

Three service classes:
- **LegacyCourseService** (lines 78-190): Fully implemented for courses only
- **MarketplaceProductService** (lines 193-240): **ALL methods stubbed/empty**
- **HybridProductService** (lines 243-394): Routes between the two based on feature flags

#### MarketplaceProductService Stubbed Methods

| Method | Line | Returns |
|--------|------|---------|
| `getProducts()` | 196-199 | `[]` (empty array) |
| `getProduct()` | 201-204 | `null` |
| `getProductBySlug()` | 206-208 | `null` |
| `createProduct()` | 210-213 | **throws "Not implemented yet"** |
| `updateProduct()` | 215-217 | **throws "Not implemented yet"** |
| `deleteProduct()` | 219-221 | **throws "Not implemented yet"** |
| `publishProduct()` | 223-225 | **throws "Not implemented yet"** |
| `unpublishProduct()` | 227-229 | **throws "Not implemented yet"** |
| `getProductMetrics()` | 231-239 | `{ views: 0, sales: 0, revenue: 0, conversionRate: 0 }` |

### 2.2 Feature Flags (lib/features.ts)

| Flag | Default | Purpose |
|------|---------|---------|
| `useNewMarketplace` | false | Enable MarketplaceProductService |
| `legacyCoursesEnabled` | true | Enable LegacyCourseService |
| `unifiedProductModel` | false | Use new schema only |
| `parallelSystemRun` | false | Use HybridProductService |
| `creatorStorefronts` | false | Enable storefronts |

### 2.3 Convex Backend (FULLY IMPLEMENTED)

**File:** `convex/digitalProducts.ts` (~2016 lines)

All queries are implemented and working:
- `getProductsByStore` — dashboard view
- `getPublishedProductsByStore` — storefront view
- `getProductById` — single product detail
- `getProductByGlobalSlug` — slug-based lookup
- `getAllPublishedProducts` — global marketplace
- `getRelatedProducts` — recommendations
- `createProduct`, `updateProduct`, `deleteProduct` — CRUD

**File:** `convex/marketplace.ts` (~806 lines)

Global marketplace queries:
- `searchMarketplace` — full-text search with filters (type, category, price range, sort)
- `getFeaturedContent` — homepage featured items
- `getPlatformStats` — total creators/courses/products/students
- `getCreatorSpotlight` — top creator
- `getAllCreators` — paginated creator list

### 2.4 UI Pages (ALL WORKING)

| Page | File | Data Source |
|------|------|-------------|
| Marketplace | `app/marketplace/page.tsx` | `marketplace.searchMarketplace` |
| Product detail | `app/marketplace/products/[slug]/page.tsx` | `digitalProducts.getProductByGlobalSlug` + `getProductById` |
| Creator storefront | `app/[slug]/page.tsx` | `digitalProducts.getPublishedProductsByStore` + `courses.getPublishedCoursesByStore` + bundles + memberships |

### 2.5 Key Insight

The `MarketplaceProductService` abstraction layer is **not used by the marketplace UI**. The UI pages query Convex directly via `useQuery()`. The product service is a server-side abstraction that was meant for a migration path. The marketplace browse, filtering, sorting, and detail pages all work because they bypass the product service and hit Convex queries directly.

**Impact:** The stubbed methods in `MarketplaceProductService` do NOT break the marketplace browse experience. They would only break if the product service were used by admin/creation flows with the `useNewMarketplace` flag enabled. Since the flag defaults to `false`, the legacy course service handles those flows.

---

## 3. Test Infrastructure

### 3.1 Current State

| Type | Framework | Files | Status |
|------|-----------|-------|--------|
| Unit tests | None | 0 | Not configured |
| Integration tests | None | 0 | Not configured |
| E2E tests | Playwright | 2 specs | Basic responsive tests only |

### 3.2 Existing Test Files

- `tests/simple-test.spec.ts` — Playwright responsive design test
- `tests/course-marketplace.spec.ts` — Playwright marketplace responsive test
- `playwright.config.ts` — Playwright configuration (baseURL: `http://localhost:3002`)

### 3.3 Missing

- No vitest/jest configuration
- No test scripts in `package.json` (only `lint` and `typecheck`)
- No mocking libraries installed
- No test utilities or fixtures
- **Zero coverage of payment flows, webhook handling, or access control logic**

---

## 4. Error Handling Patterns

### 4.1 Custom Error Classes

**File:** `lib/errors.ts`

Well-structured error hierarchy:
- `APIError` (base) → `NotFoundError`, `UnauthorizedError`, `ForbiddenError`, `ValidationError`, `ConflictError`, `RateLimitError`, `PaymentError`, `ExternalServiceError`
- `formatErrorResponse()` utility (sanitizes in prod, shows details in dev)
- `withErrorHandling()` wrapper for API routes

### 4.2 Logging

| Logger | File | Usage |
|--------|------|-------|
| Client logger | `lib/logger.ts` | Dev-only, log levels |
| Server logger | `lib/server-logger.ts` | Environment-aware, PII sanitization, payment-specific methods |

### 4.3 Rate Limiting

**File:** `lib/rate-limit.ts`
- Upstash Redis-based
- Three tiers: strict (5/min), standard (30/min), generous (100/min)
- Graceful degradation if Redis unavailable

### 4.4 Auth Helpers

**File:** `lib/auth-helpers.ts`
- `requireAuth()`, `withAuth()`, `requireAdmin()`, `withAdmin()`, `withRole()`
- Role hierarchy: admin > AGENCY_OWNER > AGENCY_ADMIN > MODERATOR

### 4.5 Error Boundaries

- 17 `error.tsx` files across app routes
- **No `global-error.tsx`** at app root
- **No `instrumentation.ts`**
- **No Sentry or any error tracking service**

### 4.6 Key Gap

In production, errors go to console only. If a webhook fails to grant access after payment, nobody knows until a user complains. No alerting, no aggregation, no dashboards.

---

## 5. Decisions for Sprint

### Fix 1: Stripe Webhook Hardening

The webhook handler already processes all product types. The fix is:
1. Change outer catch to return 200 (prevent Stripe retries on processing errors)
2. Standardize all logging to use `serverLogger` instead of `console.log`
3. Add metadata validation helper
4. Add Sentry captures once Sentry is configured (Fix 3)

### Fix 2: MarketplaceProductService

The Convex backend is fully implemented. The UI works by querying Convex directly. The fix is:
1. Wire `MarketplaceProductService` methods to actual Convex queries
2. This makes the abstraction layer functional for any server-side code that uses it
3. Only implement `getProducts`, `getProduct`, `getProductBySlug`, `getProductMetrics` (read methods)
4. Leave write methods (create/update/delete/publish) with clear Phase 2 comments — the UI uses Convex mutations directly

### Fix 3: Sentry

Start from zero. Install, configure, add global-error.tsx, capture critical path errors.

### Fix 4: Tests

Start from zero on unit tests. Install vitest, create test infrastructure, write focused tests for webhook handler and access granting.

# Sprint Status - Money Path Critical Fixes

**Date:** 2026-02-14
**Sprint:** Week 1 - Critical Launch Fixes (Money Path)

---

## Completed Items

### Fix 1: Stripe Webhook Hardening (HIGHEST)
**File:** `app/api/webhooks/stripe/route.ts`

**What changed:**
- Replaced all `console.log` emoji logging (~40 calls) with structured `serverLogger` calls (`.payment()`, `.info()`, `.error()`, `.debug()`, `.webhook()`)
- Changed outer catch from returning HTTP 500 to HTTP 200 — prevents Stripe retries that cause duplicate purchases
- Added `Sentry.captureException` for signature verification failures and unhandled processing errors
- Added webhook event logging at entry point: `serverLogger.webhook("Event received", { type, id })`

**Key audit finding:** The webhook handler already processed all 13 product types (courses, digital products, PPR Pro, bundles, beat leases, credits, playlist submissions, coaching, mixing services, tips, memberships, creator plans, content subscriptions). The task brief stated only courses were handled — this was incorrect. The actual problems were error handling and observability.

### Fix 2: MarketplaceProductService (HIGH)
**File:** `lib/services/product-service.ts`

**What changed:**
- Replaced stub implementations in `MarketplaceProductService` with real Convex queries:
  - `getProducts()` → calls `api.digitalProducts.getProductsByUser`
  - `getProduct()` → calls `api.digitalProducts.getProductById`
  - `getProductBySlug()` → calls `api.digitalProducts.getProductByGlobalSlug`
  - `getProductMetrics()` → queries product data and returns available metrics
- Added `digitalProductToProduct()` mapper for Convex → Product interface conversion
- Write methods updated to throw descriptive "Phase 2" errors directing devs to use Convex mutations directly

**Key audit finding:** The marketplace UI queries Convex directly via `useQuery()`, bypassing the product service abstraction. The service layer is used by server-side code that references the `useNewMarketplace` feature flag. Write methods were intentionally left as Phase 2 since the UI already uses Convex mutations directly.

### Fix 3: Sentry Error Tracking (HIGH)

**New files:**
- `sentry.client.config.ts` — Client SDK with replay integration (0.1 session / 1.0 error sample rates)
- `sentry.server.config.ts` — Server SDK (0.1 trace sample rate in production)
- `sentry.edge.config.ts` — Edge runtime SDK
- `instrumentation.ts` — Next.js runtime registration + `onRequestError` capture
- `app/global-error.tsx` — Global error boundary with Sentry capture and styled fallback UI

**Modified files:**
- `next.config.ts` — Wrapped with `withSentryConfig()` for source map upload
- `package.json` — Added `@sentry/nextjs` dependency

**Setup required:** Set the following environment variables:
```
NEXT_PUBLIC_SENTRY_DSN=<your-dsn>
SENTRY_AUTH_TOKEN=<your-token>
SENTRY_ORG=<your-org>
SENTRY_PROJECT=<your-project>
```

### Fix 4: Critical Path Payment Tests (HIGH)

**New files:**
- `vitest.config.ts` — Test runner configuration with path aliases
- `__tests__/stripe-webhook.test.ts` — 11 tests covering webhook handler
- `__tests__/product-access.test.ts` — 13 tests covering access granting logic
- `__tests__/product-service.test.ts` — 7 tests covering MarketplaceProductService

**Modified files:**
- `package.json` — Added `vitest`, `@vitejs/plugin-react` devDeps; `test` and `test:watch` scripts

**Test coverage (31 tests total):**

| Test File | Tests | Coverage Area |
|---|---|---|
| stripe-webhook.test.ts | 11 | Signature verification, course/digital/PPR Pro/bundle purchase flows, subscription lifecycle, missing metadata, error handling returns 200 |
| product-access.test.ts | 13 | Purchase record shapes, subscription records, webhook metadata validation, product type routing, status mapping |
| product-service.test.ts | 7 | Convex query integration, category mapping, empty results, invalid IDs, Product interface conformance, type filtering |

---

## Files Changed Summary

### Modified (5)
| File | Change |
|---|---|
| `app/api/webhooks/stripe/route.ts` | Logging, error handling, Sentry integration |
| `lib/services/product-service.ts` | Wired MarketplaceProductService to Convex queries |
| `next.config.ts` | Added withSentryConfig wrapper |
| `package.json` | Added deps (sentry, vitest) and test scripts |
| `package-lock.json` | Lockfile update |

### Created (8)
| File | Purpose |
|---|---|
| `sentry.client.config.ts` | Sentry client SDK |
| `sentry.server.config.ts` | Sentry server SDK |
| `sentry.edge.config.ts` | Sentry edge SDK |
| `instrumentation.ts` | Next.js instrumentation |
| `app/global-error.tsx` | Global error boundary |
| `vitest.config.ts` | Test configuration |
| `__tests__/stripe-webhook.test.ts` | Webhook handler tests |
| `__tests__/product-access.test.ts` | Access granting tests |
| `__tests__/product-service.test.ts` | Product service tests |
| `AUDIT.md` | Codebase audit findings |

---

## Decisions Made

1. **Webhook 200 vs 500:** Changed outer catch to return 200. Returning 500 causes Stripe to retry the webhook, which can result in duplicate purchases. Errors are logged to Sentry and serverLogger for investigation.

2. **MarketplaceProductService write ops:** Left as "Phase 2" instead of implementing full CRUD. The marketplace UI already uses Convex mutations directly via `useMutation()`, making the service layer write operations redundant for launch.

3. **Feature flag routing:** The `createProductService` factory returns `LegacyCourseService` when `unifiedProductModel` is false. This is correct — the marketplace service is only activated when the unified product model flag is enabled.

4. **Email mock strategy:** Used explicit named exports instead of Proxy-based mocks for `@/lib/email` in tests. Dynamic `await import()` calls in the webhook handler don't work reliably with Proxy-based vitest mocks.

5. **Test timeout:** Set global test timeout to 15s in vitest config to accommodate dynamic import resolution in webhook handler tests.

---

## Known Issues

1. **No `.env.example` for Sentry:** A `.env.example` was not created (avoiding unnecessary files). The required vars are documented above.

2. **Module caching in tests:** The webhook handler module is imported dynamically in `beforeEach`. Vitest caches modules after first import, so `vi.clearAllMocks()` doesn't reset module-level state. Tests are designed to work with this behavior.

3. **Email module not fully mocked:** The `@/lib/email` module has 20+ email functions. Only the 13 used by the webhook handler are mocked. If new email functions are added to the webhook, they need to be added to the mock.

---

## Week 2 Recommendations

1. **Idempotency keys:** Add Stripe idempotency checks to prevent duplicate purchases when webhooks are retried before the 200 fix takes full effect.

2. **Webhook event replay:** Implement a dead letter queue for failed webhook events (currently logged but not retried).

3. **Product service Phase 2:** Implement write operations in MarketplaceProductService if/when the admin UI needs to create products through the service layer.

4. **Integration tests:** Add Playwright E2E tests for the full purchase flow (checkout → webhook → library access).

5. **Monitoring dashboard:** Configure Sentry alerts for payment-related errors with high priority.

# Payments System

> **Last Updated:** 2026-02-19
> **Pass:** 2 — System Deep Dive
> **Key Files:** `app/api/webhooks/stripe/route.ts`, `convex/monetizationSchema.ts`, `convex/purchases.ts`, `convex/pprPro.ts`, `convex/creatorPlans.ts`, `convex/credits.ts`, `convex/monetizationUtils.ts`

---

## Table of Contents

- [1. System Overview](#1-system-overview)
- [2. Revenue Model](#2-revenue-model)
- [3. Stripe Webhook Handler](#3-stripe-webhook-handler)
- [4. Checkout Session Routes](#4-checkout-session-routes)
- [5. Platform Fee Structure](#5-platform-fee-structure)
- [6. PPR Pro Consumer Membership](#6-ppr-pro-consumer-membership)
- [7. Creator Plans](#7-creator-plans)
- [8. Stripe Connect (Creator Payouts)](#8-stripe-connect-creator-payouts)
- [9. Credit System](#9-credit-system)
- [10. Monetization Schema](#10-monetization-schema)
- [11. Revenue & Earnings Tracking](#11-revenue--earnings-tracking)
- [12. Currency Handling](#12-currency-handling)
- [13. Security & Compliance](#13-security--compliance)
- [14. Technical Debt](#14-technical-debt)

---

## 1. System Overview

PPR Academy uses Stripe as its sole payment provider with three integration patterns:

1. **Stripe Checkout** — 13 product-type-specific checkout session endpoints
2. **Stripe Connect** — Standard Connect for creator payouts with 10% platform fee
3. **Stripe Billing** — Subscription management for PPR Pro and Creator Plans

All payment events flow through a single webhook handler at `/api/webhooks/stripe` which processes 11 event types.

---

## 2. Revenue Model

| Revenue Stream | Type | Platform Cut |
|----------------|------|-------------|
| PPR Pro | Subscription (monthly/yearly) | 100% (platform product) |
| Creator Plans | SaaS subscription (5 tiers) | 100% (platform product) |
| Course Sales | One-time via Stripe Connect | 10% application fee |
| Digital Products | One-time via Stripe Connect | 10% application fee |
| Beat Licenses | One-time via Stripe Connect | 10% application fee |
| Bundle Sales | One-time via Stripe Connect | 10% application fee |
| Coaching Sessions | One-time via Stripe Connect | 10% application fee |
| Mixing Services | One-time via Stripe Connect | 10% application fee |
| Tips | One-time via Stripe Connect | 10% application fee |
| Credit Packages | One-time (platform product) | 100% |
| Creator Subscriptions | Per-creator recurring | 10% application fee |

---

## 3. Stripe Webhook Handler

**File:** `app/api/webhooks/stripe/route.ts`

### Security

```typescript
// Signature verification
const sig = headers().get("stripe-signature");
const event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);

// Idempotency protection via webhook event table
const existingEvent = await getWebhookEvent(event.id);
if (existingEvent?.status === "processed") return; // Skip duplicate
```

### Event Types Handled

| Event | Handler | Purpose |
|-------|---------|---------|
| `account.updated` | Updates user Stripe Connect status | Tracks onboarding completion |
| `checkout.session.completed` | Routes to 13 product handlers | Main purchase processor |
| `customer.subscription.updated` | Updates subscription status | Handles upgrades/downgrades |
| `customer.subscription.deleted` | Expires subscription | Handles cancellation |
| `invoice.payment_succeeded` | Tracks renewal | Subscription renewals |
| `invoice.payment_failed` | Sends failure notification | Dunning |
| `payment_intent.succeeded` | Logs success | Audit trail |
| `payment_intent.payment_failed` | Sends failure email | Customer notification |
| `transfer.created` | Logs transfer | Connect audit |
| `transfer.paid` | Tracks completion | Connect audit |

### checkout.session.completed Routing

Routes based on `metadata.productType`:

| productType | Handler | Mode |
|-------------|---------|------|
| `ppr_pro` | `serverCreateSubscription` | subscription |
| `creator_plan` | `creatorPlans.upgradePlan` | subscription |
| `membership` | Create membership subscription | subscription |
| `course` | `serverCreateCourseEnrollment` | payment |
| `digitalProduct` | `serverCreateDigitalProductPurchase` | payment |
| `bundle` | `serverCreateBundlePurchase` | payment |
| `beatLease` | `beatLeases.createBeatLicensePurchase` | payment |
| `credit_package` | `credits.addCreditsFromWebhook` | payment |
| `playlist_submission` | `submissions.submitTrack` | payment |
| `mixingService` | `serviceOrders.internalCreateServiceOrder` | payment |
| `coaching` | `coachingProducts.internalBookCoachingSession` | payment |
| `tip` | `serverCreateDigitalProductPurchase` | payment |
| (default) | Content subscription handler | subscription |

### Email Notifications

Every successful checkout triggers a confirmation email via Resend. Failed payments trigger failure notification emails. All emails use branded HTML templates.

---

## 4. Checkout Session Routes

**13 Routes in `app/api/*/create-checkout-session/`**

### Common Pattern

```typescript
export async function POST(req: Request) {
  // 1. Authenticate user
  const user = await requireAuth();

  // 2. Rate limit (strict: 5 req/min)
  await checkRateLimit(req, "strict");

  // 3. Validate user owns request
  if (body.userId !== user.id) throw new Error("Unauthorized");

  // 4. Sync Stripe product/price (create if needed)
  // Stripe prices are immutable — deactivate old, create new if changed

  // 5. Create checkout session with metadata
  const session = await stripe.checkout.sessions.create({
    mode: "payment" | "subscription",
    line_items: [{ price: stripePriceId, quantity: 1 }],
    metadata: { userId, productType, courseId, ... },
    // For Connect:
    payment_intent_data: {
      application_fee_amount: Math.round(price * 0.1 * 100), // 10%
      transfer_data: { destination: creatorStripeAccountId },
    },
    success_url: `${APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}/cancel`,
  });

  return NextResponse.json({ url: session.url });
}
```

### Stripe Price Synchronization

```typescript
// Check if cached stripePriceId matches current price
if (existingPrice && existingPrice.unit_amount !== expectedCents) {
  // Deactivate old price
  await stripe.prices.update(existingPriceId, { active: false });
  // Create new price
  const newPrice = await stripe.prices.create({ ... });
  // Save new IDs to database
  await updateStripeIds(productId, newPrice.id);
}
```

---

## 5. Platform Fee Structure

### Fee Calculation (`convex/monetizationUtils.ts`)

```typescript
const PLATFORM_FEE_PERCENT = 10;        // 10% platform fee
const STRIPE_FEE_PERCENT = 2.9;         // 2.9% Stripe processing
const STRIPE_FEE_FIXED_CENTS = 30;      // $0.30 fixed Stripe fee

// Example: $100 sale
grossRevenue     = 10000 cents  ($100.00)
platformFees     =  1000 cents  ($10.00)   // 10%
processingFees   =   319 cents  ($3.19)    // 2.9% + $0.30
netEarnings      =  8681 cents  ($86.81)
```

### Where Fees Apply

| Product Type | Platform Fee | Processing Fee |
|--------------|-------------|----------------|
| Courses | 10% via Connect application_fee | Stripe standard |
| Digital products | 10% via Connect application_fee | Stripe standard |
| Beat licenses | 10% via Connect application_fee | Stripe standard |
| Bundles | 10% via Connect application_fee | Stripe standard |
| PPR Pro | N/A (platform product) | Stripe standard |
| Creator Plans | N/A (platform product) | Stripe standard |
| Credits | N/A (platform product) | Stripe standard |

**Concern:** 10% fee is hardcoded in multiple files. Should be centralized.

---

## 6. PPR Pro Consumer Membership

**File:** `convex/pprPro.ts`

### Plans

| Interval | Price | Stripe Amount |
|----------|-------|---------------|
| Monthly | $12 | 1200 cents |
| Yearly | $108 ($9/mo) | 10800 cents |

### Key Functions

```typescript
seedPlans()                    // Initialize default plans
getPlanByInterval(interval)    // Fetch plan details
isPprProMember(userId)         // Check active subscription
getSubscription(userId)        // Get current subscription
createSubscription(...)        // Called from webhook (internal)
updateSubscriptionStatus(...)  // Called from subscription.updated webhook
expireSubscription(...)        // Called from subscription.deleted webhook
```

### Statuses

`active` → `past_due` (failed payment) → `expired` (canceled/deleted)
`active` → `trialing` (if trial enabled)

---

## 7. Creator Plans

**File:** `convex/creatorPlans.ts`

### Tier Matrix

| Plan | Monthly | Yearly | Products | Email Sends | Key Feature |
|------|---------|--------|----------|-------------|-------------|
| Free | $0 | $0 | 1 free only | 0 | No monetization |
| Starter | $12 | $108 | 15 | 500 | Basic email |
| Creator | $29 | $288 | 50 | 2,500 | Follow gates, analytics |
| Creator Pro | $79 | $708 | Unlimited | 10,000 | Custom domain, API |
| Business | $149 | $1,428 | Unlimited | Unlimited | Team (10 members) |
| Early Access | $0 | $0 | Unlimited | Unlimited | Grandfathered (being sunset) |

### Feature Gating

```typescript
free: {
  canChargeMoney: false,          // Cannot sell products
  maxProducts: 1,                 // 1 free product only
  maxLinks: 5,
  showPlatformBranding: true,
}

creator_pro: {
  canChargeMoney: true,
  maxProducts: -1,                // -1 = unlimited
  canUseCustomDomain: true,
  canUseAutomations: true,
  canUseApi: true,
}
```

### Early Access Sunset

Admin functions exist to manage grandfathered users:
- `getEarlyAccessStores` — Identify affected users
- `sunsetAllEarlyAccess` — Mass set expiration dates
- `extendEarlyAccess` — Extend for special cases

---

## 8. Stripe Connect (Creator Payouts)

### Account Setup

```typescript
// app/api/stripe/connect/create-account/route.ts
const account = await stripe.accounts.create({
  type: "express",                // Standard Express Connect
  capabilities: { transfers: { requested: true } },
  metadata: { userId, platform: "ppr-academy" },
});
```

### Payout Flow

```
Creator sells product
  ↓
Stripe Checkout with application_fee_amount (10%)
  ↓
Stripe automatically splits: 90% → creator, 10% → platform
  ↓
Creator Connect account receives funds
  ↓
Stripe handles payout to creator's bank per their schedule
```

### Account Status

| Status | Meaning |
|--------|---------|
| `pending` | Account created, onboarding incomplete |
| `restricted` | Some capabilities missing |
| `enabled` | Full functionality, charges and payouts enabled |

---

## 9. Credit System

**File:** `convex/credits.ts`

### Credit Packages

| Package | Credits | Price | Bonus | Effective $/Credit |
|---------|---------|-------|-------|-------------------|
| Starter | 10 | $9.99 | 0 | $1.00 |
| Basic | 25 | $19.99 | 5 | $0.67 |
| Pro | 50 | $34.99 | 15 | $0.54 |
| Premium | 100 | $59.99 | 35 | $0.44 |
| Elite | 250 | $129.99 | 100 | $0.37 |

### Transaction Types

- `purchase` — User buys credits
- `spend` — User uses credits (sample purchases, etc.)
- `earn` — Creator earns credits from sales
- `bonus` — Promotional/admin-awarded
- `refund` — Credit refunds

### Idempotency

```typescript
// Webhook handler uses stripePaymentId to prevent duplicate additions
const existing = await ctx.db.query("creditTransactions")
  .filter(q => q.eq(q.field("stripePaymentId"), paymentId))
  .first();
if (existing) return; // Already processed
```

---

## 10. Monetization Schema

**File:** `convex/monetizationSchema.ts`

### Tables Defined

| Table | Purpose |
|-------|---------|
| `subscriptionPlans` | Creator subscription plan definitions |
| `coupons` | Promotional discount codes |
| `couponUsages` | Coupon usage tracking |
| `affiliates` | Affiliate registrations |
| `affiliateClicks` | Click tracking |
| `affiliateSales` | Commission records |
| `affiliatePayouts` | Payout execution |
| `referrals` | User-to-user referral tracking |
| `paymentPlans` | Installment payment configurations |
| `installmentPayments` | Individual installment records |
| `bundles` | Product bundle definitions |
| `taxRates` | Tax calculation (country/state/rate) |
| `currencyRates` | Exchange rate tracking |
| `refunds` | Refund management |
| `creatorPayouts` | Creator payout records |
| `payoutSchedules` | Payout frequency configuration |
| `freeTrials` | Trial management |
| `upsells` | Upsell campaign definitions |
| `upsellInteractions` | Upsell interaction tracking |

### Refund Structure

```typescript
refunds: {
  orderId: Id<"purchases">
  itemType: "course" | "product" | "subscription" | "bundle"
  refundType: "full" | "partial"
  status: "requested" | "approved" | "processed" | "denied" | "canceled"
  revokeAccess: boolean           // Whether to revoke on refund
  requestedAt, approvedAt, processedAt
}
```

### Creator Payouts Structure

```typescript
creatorPayouts: {
  periodStart, periodEnd
  status: "pending" | "processing" | "completed" | "failed" | "on_hold"
  grossRevenue, platformFee, paymentProcessingFee, refunds, netPayout, taxWithheld
  stripeTransferId?: string
}
```

---

## 11. Revenue & Earnings Tracking

### Creator Pending Earnings Query

```typescript
getCreatorPendingEarnings(creatorId)
→ {
    grossRevenue,                // Total from completed, unpaid purchases
    platformFees,                // 10% of gross
    processingFees,              // 2.9% + $0.30 per transaction
    refunds,                     // Deducted amount
    netEarnings,                 // What creator receives
    itemizedBreakdown: [{
      purchaseId, amount, fee, net, productType, date
    }]
  }
```

### Payout Process

```
getCreatorPendingEarnings → Calculate owed amount
     ↓
createCreatorPayout → status: "pending"
     ↓
Stripe Transfer API → Transfer to Connect account
     ↓
completeCreatorPayout → status: "completed", save stripeTransferId
     ↓
markPurchasesAsPaidOut → Mark source purchases as paid
```

---

## 12. Currency Handling

### Conventions

- **Database storage:** Cents as numbers (integer)
- **Stripe API:** Always cents
- **Display:** Divide by 100 for dollar display
- **Course prices in DB:** Stored in DOLLARS (converted to cents for Stripe)

### Conversion Patterns

```typescript
// Dollar → Stripe (cents)
Math.round(price * 100)

// Stripe (cents) → Display
amount / 100

// Fee calculation (stays in cents)
Math.round((amount * percent) / 100)
```

**Concern:** Mixed dollar/cent storage across tables. Course prices are in dollars, purchase amounts are in cents. This inconsistency is a source of bugs.

---

## 13. Security & Compliance

### Strengths

| Feature | Implementation |
|---------|---------------|
| Webhook signature verification | `stripe.webhooks.constructEvent()` with secret |
| Idempotency | Webhook event table prevents duplicate processing |
| User ID validation | All routes verify userId matches auth |
| Rate limiting | Strict (5 req/min) on all checkout routes |
| Amount validation | Checks valid prices before creating sessions |

### Concerns

| Issue | Risk | Recommendation |
|-------|------|----------------|
| Platform fee hardcoded (10%) | Fee change requires code updates | Centralize in config |
| Mixed dollar/cent storage | Rounding errors, bugs | Standardize to cents |
| Stripe price update not atomic | Price could be deactivated without new one | Add retry/rollback |
| No automatic refund processing | Manual-only via admin | Integrate Stripe Refund API |
| No fraud checks on affiliates | Commission gaming | Add velocity detection |
| No rate limiting on read queries | Data scraping | Add generous rate limits |

---

## 14. Technical Debt

### High Priority

| Issue | Location | Impact |
|-------|----------|--------|
| Platform fee hardcoded in 5+ files | Various checkout routes, monetizationUtils | Change requires updating all files |
| Dollar vs cents inconsistency | Course prices (dollars) vs purchases (cents) | Bug-prone |
| Stripe price creation not atomic | Checkout routes | Potential orphaned deactivated prices |
| No subscription dunning logic | Webhook handler | Failed payments not retried |

### Medium Priority

| Issue | Location | Impact |
|-------|----------|--------|
| Payment plans (installments) schema only | monetizationSchema | Feature incomplete |
| Tax system basic | taxRates table | No automation/compliance |
| Refund is admin-only | No auto-processing | Manual overhead |
| No receipt generation | Webhook handler | Compliance gap |

### Low Priority

| Issue | Location | Impact |
|-------|----------|--------|
| currencyRates defined but unused | monetizationSchema | Dead table |
| upsells/upsellInteractions | monetizationSchema | Feature incomplete |
| freeTrials table | monetizationSchema | Not integrated |

---

*NEEDS EXPANSION IN PASS 3: Tax compliance automation, international payments, subscription upgrade/downgrade flows, detailed refund workflow, Stripe Connect onboarding UX, receipt generation, payment analytics dashboard.*

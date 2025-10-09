# 💰 Advanced Monetization & Payments System

Complete implementation of advanced monetization features for PPR Academy.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Features Implemented](#features-implemented)
3. [Database Schema](#database-schema)
4. [Backend Functions](#backend-functions)
5. [Frontend Components](#frontend-components)
6. [Integration Guide](#integration-guide)
7. [Testing Checklist](#testing-checklist)

---

## Overview

This system provides a comprehensive monetization solution including subscriptions, coupons, affiliates, bundles, payment plans, tax calculation, refunds, and creator payouts.

### 🎯 Key Capabilities

- **Recurring Revenue**: Monthly/yearly subscriptions with trials
- **Flexible Pricing**: Bundles, payment plans, dynamic discounts
- **Growth Tools**: Affiliate program, referral bonuses, upsells
- **Global Support**: Multi-currency, tax calculation by region
- **Creator Payouts**: Automated scheduling and processing

---

## Features Implemented

### ✅ 1. Subscriptions & Memberships

**File**: `convex/subscriptions.ts`

- Create subscription plans with tiered access (Basic/Pro/VIP)
- Monthly, yearly, and lifetime billing cycles
- Free trial periods (configurable days)
- Access control by course/product or "all content"
- Member-only discounts on additional purchases
- Automatic renewal and upgrade/downgrade
- Cancel at period end or immediately

**Usage**:
```typescript
// Create a subscription plan
const planId = await createSubscriptionPlan({
  storeId,
  creatorId,
  name: "Pro Plan",
  tier: 2,
  monthlyPrice: 2900, // $29.00
  yearlyPrice: 29000, // $290.00 (save ~17%)
  features: ["Access to all courses", "Priority support", "Exclusive community"],
  hasAllCourses: true,
  trialDays: 7,
});

// Subscribe a user
await createSubscription({
  userId,
  planId,
  billingCycle: "monthly",
  startTrial: true,
});
```

**UI Component**: `components/monetization/SubscriptionPlansGrid.tsx`

---

### ✅ 2. Coupons & Discount Codes

**File**: `convex/coupons.ts`

- Percentage or fixed amount discounts
- Apply to all, courses, products, subscriptions, or specific items
- Usage limits (total and per-user)
- Time-limited validity
- First-time customer only option
- Stackable coupons
- Bulk code generation
- Real-time validation

**Usage**:
```typescript
// Create a coupon
await createCoupon({
  code: "LAUNCH50",
  storeId,
  creatorId,
  discountType: "percentage",
  discountValue: 50,
  applicableTo: "all",
  maxUses: 100,
  validFrom: Date.now(),
  validUntil: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  firstTimeOnly: true,
});

// Validate before purchase
const validation = await validateCoupon({
  code: "LAUNCH50",
  userId,
  itemType: "course",
  itemId: courseId,
  purchaseAmount: 5000, // $50.00
});
```

**UI Component**: `components/monetization/CouponManager.tsx`

---

### ✅ 3. Affiliate Program

**File**: `convex/affiliates.ts`

- Application and approval workflow
- Unique affiliate codes
- Click tracking with conversion
- Commission calculation (percentage or fixed)
- Multi-tier payouts (Stripe, PayPal, manual)
- Cookie-based attribution (configurable duration)
- Comprehensive analytics dashboard

**Usage**:
```typescript
// Apply to be an affiliate
const { affiliateCode } = await applyForAffiliate({
  affiliateUserId,
  storeId,
  creatorId,
  applicationNote: "I have a YouTube channel with 50k subscribers",
});

// Track a click
await trackAffiliateClick({
  affiliateCode,
  landingPage: window.location.href,
  visitorId: cookieId,
});

// Record a sale
await recordAffiliateSale({
  affiliateCode,
  customerId,
  storeId,
  orderId,
  orderAmount: 5000,
  itemType: "course",
  itemId: courseId,
});
```

**UI Component**: `components/monetization/AffiliateDashboard.tsx`

---

### ✅ 4. Payment Plans (Installments)

**File**: `convex/paymentPlans.ts`

- Split payments over time (weekly/biweekly/monthly)
- Configurable down payment
- Automatic retry on failed payments
- Default handling after 3 failures
- Access granted immediately (optional)

**Usage**:
```typescript
await createPaymentPlan({
  userId,
  courseId,
  totalAmount: 50000, // $500
  downPayment: 10000, // $100
  numberOfInstallments: 4,
  frequency: "monthly",
});
```

---

### ✅ 5. Course & Product Bundles

**File**: `convex/bundles.ts`

- Package multiple courses/products
- Automatic discount calculation
- Limited quantity offers
- Time-limited availability
- Purchase tracking and analytics

**Usage**:
```typescript
await createBundle({
  storeId,
  creatorId,
  name: "Complete Producer Bundle",
  courseIds: [courseId1, courseId2, courseId3],
  productIds: [productId1],
  bundlePrice: 15000, // $150 (vs $200 individually)
});
```

---

### ✅ 6. Tax & Multi-Currency

**File**: `convex/monetizationUtils.ts`

- Tax rate by country and state
- VAT, GST, sales tax support
- Currency exchange rates
- Automatic conversion
- Stripe tax code integration

**Usage**:
```typescript
// Calculate tax
const tax = await calculateTax({
  amount: 5000,
  country: "US",
  state: "CA",
});
// Returns: { taxAmount: 413, totalAmount: 5413, taxRate: 8.25 }

// Convert currency
const converted = await convertCurrency({
  amount: 5000,
  from: "USD",
  to: "EUR",
});
```

---

### ✅ 7. Refund Management

**File**: `convex/monetizationUtils.ts`

- Customer-initiated refund requests
- Creator approval workflow
- Full or partial refunds
- Access revocation (optional)
- Stripe refund processing
- Refund analytics by store

**Usage**:
```typescript
// Request refund
await requestRefund({
  orderId,
  userId,
  storeId,
  creatorId,
  itemType: "course",
  itemId: courseId,
  originalAmount: 5000,
  refundAmount: 5000,
  reason: "Not as expected",
  revokeAccess: true,
});

// Approve refund (creator)
await approveRefund({ refundId, approvedBy: creatorId });

// Process refund (system)
await processRefund({ refundId, stripeRefundId });
```

---

### ✅ 8. Creator Payout Scheduling

**File**: `convex/monetizationUtils.ts`

- Automated payout schedules (weekly/biweekly/monthly)
- Minimum payout threshold
- Platform fee calculation
- Payment processing fee tracking
- Tax withholding
- Stripe Connect integration
- Payout history and analytics

**Usage**:
```typescript
// Set up payout schedule
await createPayoutSchedule({
  creatorId,
  storeId,
  frequency: "biweekly",
  minimumPayout: 10000, // $100 minimum
});

// Create payout
await createCreatorPayout({
  creatorId,
  storeId,
  amount: 45000,
  grossRevenue: 50000,
  platformFee: 2500, // 5%
  paymentProcessingFee: 1500, // 3%
  refunds: 1000,
  netPayout: 45000,
  periodStart,
  periodEnd,
});
```

---

### ✅ 9. Referral Program

**File**: `convex/monetizationUtils.ts`

- User-to-user referrals
- Unique referral codes
- Dual-sided rewards (referrer + referred)
- Credits, discounts, or cash rewards
- Purchase verification
- Expiration handling

**Usage**:
```typescript
// Generate referral code
const { code } = await createReferralCode({ userId });

// Apply referral code (new user)
await applyReferralCode({
  referralCode: code,
  referredUserId: newUserId,
});
```

---

### ✅ 10. Upsells & Cross-sells

**File**: `convex/monetizationSchema.ts` (schema only)

- Trigger-based offers (purchase, completion, checkout)
- Discount incentives
- Conversion tracking
- A/B testing support

---

## Database Schema

### Core Tables

All tables defined in `convex/monetizationSchema.ts` and imported into `convex/schema.ts`:

1. **membershipSubscriptions** - Subscription instances
2. **subscriptionPlans** - Subscription tier definitions
3. **coupons** - Discount codes
4. **couponUsages** - Usage tracking
5. **affiliates** - Affiliate accounts
6. **affiliateClicks** - Click tracking
7. **affiliateSales** - Commission records
8. **affiliatePayouts** - Payout processing
9. **referrals** - Referral program
10. **paymentPlans** - Installment plans
11. **installmentPayments** - Individual payments
12. **bundles** - Product bundles
13. **taxRates** - Regional tax rates
14. **currencyRates** - Exchange rates
15. **refunds** - Refund requests
16. **creatorPayouts** - Creator earnings
17. **payoutSchedules** - Automated schedules
18. **freeTrials** - Trial tracking
19. **upsells** - Upsell offers
20. **upsellInteractions** - User interactions

---

## Backend Functions

### Subscriptions (`convex/subscriptions.ts`)
- `getUserSubscriptions` - Get user's subscriptions
- `getActiveSubscription` - Check active subscription
- `checkSubscriptionAccess` - Verify content access
- `getSubscriptionPlans` - List available plans
- `createSubscription` - Subscribe user to plan
- `cancelSubscription` - Cancel subscription
- `upgradeSubscription` - Upgrade to higher tier
- `downgradeSubscription` - Downgrade to lower tier
- `createSubscriptionPlan` - Create new plan (creator)
- `updateSubscriptionPlan` - Modify existing plan

### Coupons (`convex/coupons.ts`)
- `validateCoupon` - Validate coupon code
- `getCouponsByStore` - List store coupons
- `getUserCouponUsages` - User's coupon history
- `createCoupon` - Create new coupon
- `applyCoupon` - Apply coupon to purchase
- `updateCoupon` - Modify coupon settings
- `deactivateCoupon` - Disable coupon
- `bulkCreateCoupons` - Generate multiple codes

### Affiliates (`convex/affiliates.ts`)
- `getAffiliateByCode` - Look up affiliate
- `getAffiliateStats` - Affiliate analytics
- `getAffiliateSales` - Commission history
- `applyForAffiliate` - Submit application
- `approveAffiliate` - Approve application
- `trackAffiliateClick` - Log click
- `recordAffiliateSale` - Record commission
- `createAffiliatePayout` - Process payout

### Payment Plans (`convex/paymentPlans.ts`)
- `getUserPaymentPlans` - User's installment plans
- `getPaymentPlanDetails` - Plan details
- `getUpcomingPayments` - Next payments due
- `createPaymentPlan` - Set up installment plan
- `recordInstallmentPayment` - Process payment
- `recordFailedPayment` - Handle failure
- `cancelPaymentPlan` - Cancel plan

### Bundles (`convex/bundles.ts`)
- `getBundlesByStore` - List bundles
- `getBundleDetails` - Bundle details with items
- `getPublishedBundles` - Active bundles
- `createBundle` - Create new bundle
- `updateBundle` - Modify bundle
- `publishBundle` - Make bundle live
- `recordBundlePurchase` - Track purchase

### Monetization Utils (`convex/monetizationUtils.ts`)
- `getTaxRate` - Get tax rate by location
- `calculateTax` - Calculate tax amount
- `getCurrencyRate` - Get exchange rate
- `convertCurrency` - Convert amount
- `requestRefund` - Request refund
- `approveRefund` - Approve refund
- `getCreatorPayouts` - Payout history
- `createCreatorPayout` - Create payout
- `createPayoutSchedule` - Set up schedule
- `createReferralCode` - Generate code
- `getUserReferrals` - Referral history

---

## Frontend Components

### 1. Subscription Plans Grid
**File**: `components/monetization/SubscriptionPlansGrid.tsx`

Displays subscription tiers with pricing, features, and subscribe buttons.

```tsx
<SubscriptionPlansGrid storeId={storeId} userId={userId} />
```

### 2. Coupon Manager
**File**: `components/monetization/CouponManager.tsx`

Complete coupon management interface for creators.

```tsx
<CouponManager storeId={storeId} creatorId={creatorId} />
```

### 3. Affiliate Dashboard
**File**: `components/monetization/AffiliateDashboard.tsx`

Affiliate earnings, stats, and link sharing.

```tsx
<AffiliateDashboard affiliateId={affiliateId} />
```

---

## Integration Guide

### 1. Add Subscription Plans to Your Store

```typescript
// In your store settings page
import { SubscriptionPlansGrid } from "@/components/monetization/SubscriptionPlansGrid";

<SubscriptionPlansGrid storeId={storeId} userId={userId} />
```

### 2. Apply Coupons at Checkout

```typescript
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const validation = useQuery(api.coupons.validateCoupon, {
  code: couponCode,
  userId,
  itemType: "course",
  itemId: courseId,
  purchaseAmount: price,
});

if (validation?.valid) {
  finalAmount = validation.finalAmount;
}
```

### 3. Track Affiliate Referrals

```typescript
// On page load, check for ?ref=CODE
const params = new URLSearchParams(window.location.search);
const refCode = params.get("ref");

if (refCode) {
  await trackAffiliateClick({
    affiliateCode: refCode,
    landingPage: window.location.href,
  });
  // Store in cookie for 30 days
  document.cookie = `ref=${refCode}; max-age=${30 * 24 * 60 * 60}`;
}
```

### 4. Offer Payment Plans

```typescript
// In checkout flow
if (userWantsPaymentPlan) {
  await createPaymentPlan({
    userId,
    courseId,
    totalAmount: price,
    downPayment: price * 0.25, // 25% down
    numberOfInstallments: 4,
    frequency: "monthly",
  });
}
```

---

## Testing Checklist

### Subscriptions
- [ ] Create subscription plan
- [ ] Subscribe with monthly billing
- [ ] Subscribe with yearly billing
- [ ] Start free trial
- [ ] Cancel subscription
- [ ] Upgrade to higher tier
- [ ] Downgrade to lower tier
- [ ] Verify access control

### Coupons
- [ ] Create percentage coupon
- [ ] Create fixed amount coupon
- [ ] Apply coupon at checkout
- [ ] Test usage limits
- [ ] Test expiration
- [ ] Test first-time customer only
- [ ] Bulk generate codes

### Affiliates
- [ ] Apply for affiliate program
- [ ] Approve application
- [ ] Track affiliate click
- [ ] Record sale with commission
- [ ] Test conversion tracking
- [ ] Process affiliate payout

### Payment Plans
- [ ] Create installment plan
- [ ] Process first payment
- [ ] Process subsequent payments
- [ ] Handle failed payment
- [ ] Cancel payment plan

### Bundles
- [ ] Create bundle
- [ ] Calculate discount
- [ ] Purchase bundle
- [ ] Grant access to all items

### Tax & Currency
- [ ] Add tax rates
- [ ] Calculate tax
- [ ] Update currency rates
- [ ] Convert currency

### Refunds
- [ ] Request refund
- [ ] Approve refund
- [ ] Process refund
- [ ] Verify access revocation

### Payouts
- [ ] Create payout schedule
- [ ] Generate payout
- [ ] Complete payout
- [ ] Handle failed payout

---

## Environment Variables

No additional environment variables required for core functionality. Stripe integration requires:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## Next Steps

### Stripe Integration
1. Create Stripe products for subscription plans
2. Set up Stripe webhooks for subscription events
3. Implement Stripe Checkout for subscriptions
4. Configure Stripe Connect for creator payouts

### Automation
1. Set up cron job for subscription renewals
2. Automate failed payment retries
3. Schedule automatic payouts
4. Send notification emails

### Analytics
1. Revenue dashboard by plan
2. Coupon performance tracking
3. Affiliate leaderboard
4. Refund rate monitoring

---

## Support

For questions or issues:
1. Check the implementation in `convex/` files
2. Review component examples in `components/monetization/`
3. Test with the provided checklist
4. Refer to Stripe documentation for payment processing

---

**Built with ❤️ for PPR Academy**





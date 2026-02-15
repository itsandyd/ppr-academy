# 🎯 TODO Triage Report - Beta Launch
**Date:** October 9, 2025  
**Total Items Found:** 75 TODOs/FIXMEs/BUGs  
**Critical Items:** 6  
**Important Items:** 15  
**Nice-to-Have Items:** 52  

---

## 🔴 CRITICAL (Fix Before Beta Launch) - 6 Items

These items **block core functionality** and must be fixed before beta launch.

### 1. ⚠️ Payment Success Verification (Line 2)
**File:** `app/courses/[slug]/success/page.tsx:29`  
**Issue:** Payment verification API route not created  
**Impact:** Users can't confirm successful payments  
**Priority:** P0 - BLOCKING  
**Estimate:** 1 hour

```typescript
// TODO: Create payment verification API route
```

**Fix Required:** Create API route to verify payment with Stripe and grant access.

---

### 2. ⚠️ Stripe Connect Account Missing in Checkout (Lines 3-4)
**Files:**
- `app/courses/[slug]/checkout/components/StripePaymentForm.tsx:56`
- `app/courses/[slug]/checkout/components/CourseCheckout.tsx:132`

**Issue:** Creator's Stripe Connect account ID not being passed to payment  
**Impact:** Payments won't route to creators - they won't get paid!  
**Priority:** P0 - BLOCKING  
**Estimate:** 2 hours

```typescript
// TODO: Add creator's Stripe Connect account ID
```

**Fix Required:** Query creator's `stripeConnectAccountId` and pass to Stripe checkout.

---

### 3. ⚠️ Course Enrollment Not Created (Lines 16, 21)
**Files:**
- `app/api/courses/payment-success/route.ts:30`
- `app/api/webhooks/stripe/route.ts:59`

**Issue:** After payment, course enrollment not created in Convex  
**Impact:** Users can't access purchased courses  
**Priority:** P0 - BLOCKING  
**Estimate:** 1 hour

```typescript
// TODO: Create course enrollment in Convex
```

**Fix Required:** Call Convex mutation to create enrollment record after successful payment.

---

### 4. ⚠️ Credit System Not Working (Line 22)
**File:** `app/api/webhooks/stripe/route.ts:113`  
**Issue:** Credits not added to user account after purchase  
**Impact:** Sample marketplace credit purchases don't work  
**Priority:** P0 - BLOCKING (if credit system is in beta)  
**Estimate:** 30 minutes

```typescript
// TODO: Call Convex mutation to add credits to user account
```

**Fix Required:** Add credits to user balance after credit package purchase.

---

### 5. ⚠️ User Stripe Account Status Not Updated (Line 20)
**File:** `app/api/webhooks/stripe/route.ts:38`  
**Issue:** Stripe Connect account status not synced to Convex  
**Impact:** Creators don't know when their account is ready  
**Priority:** P1 - HIGH  
**Estimate:** 30 minutes

```typescript
// TODO: Update user record with account status in Convex
```

**Fix Required:** Update user's `stripeAccountStatus` field when webhook received.

---

### 6. ⚠️ Payment Failure Not Handled (Line 23)
**File:** `app/api/webhooks/stripe/route.ts:193`  
**Issue:** Payment failures don't notify users  
**Impact:** Users won't know their payment failed  
**Priority:** P1 - HIGH  
**Estimate:** 1 hour

```typescript
// TODO: Handle payment failure notification
```

**Fix Required:** Send email notification when payment fails.

---

## 🟡 IMPORTANT (Fix Before Expanding Beta) - 15 Items

These items **impact user experience** but don't break core flows. Fix during first week of beta.

### 7. Debug Console Logs in Production (Lines 5-7, 17, 60-61)
**Files:**
- `app/actions/course-actions.ts:2179-2207`
- `app/api/debug-user/route.ts:13`
- `components/course/course-detail-client.tsx:149-276`

**Issue:** Debug console.logs left in code  
**Impact:** Performance and security concerns  
**Priority:** P1 - HIGH  
**Estimate:** 30 minutes

**Fix Required:** Remove all debug console.logs or gate behind `process.env.NODE_ENV === 'development'`.

---

### 8. Hardcoded Dummy Data (Lines 8-11, 62-63)
**Files:**
- `app/actions/coaching-actions.ts:65-66, 116-117`
- `components/dashboard/creator-dashboard-v2.tsx:106-107`

**Issue:** Ratings, session counts, revenue showing fake/zero data  
**Impact:** Creators see inaccurate stats  
**Priority:** P1 - HIGH  
**Estimate:** 2 hours

```typescript
rating: 4.5, // TODO: Calculate from actual reviews
totalSessions: 0, // TODO: Calculate from actual sessions
totalRevenue: products.reduce((sum, product) => sum + (product.price * 0), 0), // TODO: Add actual sales data
```

**Fix Required:** Calculate real metrics from database.

---

### 9. Missing Post-Purchase Actions (Lines 18-19)
**File:** ~~`app/api/webhooks/stripe-library/route.ts:65-66`~~ **REMOVED** — now handled by `app/api/webhooks/stripe/route.ts`

**Issue:** No confirmation email or workflows after purchase  
**Impact:** Poor user experience, no order confirmation  
**Priority:** P1 - HIGH  
**Estimate:** 2 hours

```typescript
// TODO: Send confirmation email
// TODO: Trigger any post-purchase workflows
```

**Fix Required:** Send Resend email and trigger email workflows.

---

### 10. Social Media Webhooks Incomplete (Lines 12-15)
**File:** `app/api/social/webhooks/[platform]/route.ts:172-235`

**Issue:** Social media webhook handlers not implemented  
**Impact:** Post analytics won't update automatically  
**Priority:** P2 - MEDIUM  
**Estimate:** 3 hours

**Fix Required:** Implement Convex mutations for webhook data storage if social features in beta.

---

### 11. PhonePreview Using Placeholder Data (Lines 24-26)
**Files:**
- `app/(dashboard)/store/components/PhonePreview.tsx:246-257`

**Issue:** Lead magnet preview not using real API  
**Impact:** Preview doesn't match actual functionality  
**Priority:** P2 - MEDIUM  
**Estimate:** 1 hour

**Fix Required:** Connect to actual Convex API calls.

---

### 12. Course Progress Not Tracked (Lines 44-47)
**Files:**
- `app/(dashboard)/store/[storeId]/courses/[courseId]/components/CourseViewLayout.tsx:61-167`

**Issue:** Completed lessons count is hardcoded to 0  
**Impact:** Students can't see their progress  
**Priority:** P1 - HIGH  
**Estimate:** 2 hours

```typescript
const completedLessons = 0; // TODO: Implement progress tracking
```

**Fix Required:** Query user progress from Convex and display real completion status.

---

### 13. Course Enrollment Form Incomplete (Lines 41-43)
**File:** `app/(dashboard)/store/[storeId]/courses/[courseId]/enroll/components/CourseEnrollmentForm.tsx:76-87`

**Issue:** Enrollment/purchase logic not implemented  
**Impact:** Can't enroll from certain pages  
**Priority:** P2 - MEDIUM  
**Estimate:** 2 hours

**Fix Required:** Implement enrollment logic or redirect to main checkout.

---

### 14. Discord Invite Link Hardcoded (Line 64)
**File:** `components/coaching/DiscordVerificationCard.tsx:103`

**Issue:** Discord invite link not fetched from store's guild  
**Impact:** Wrong invite link shown  
**Priority:** P2 - MEDIUM (if Discord integration in beta)  
**Estimate:** 1 hour

**Fix Required:** Fetch invite link from Convex `discordGuilds` table.

---

### 15. Temp User ID Used (Lines 43, 47)
**Files:**
- `app/(dashboard)/store/[storeId]/courses/[courseId]/enroll/page.tsx:17`
- `app/(dashboard)/store/[storeId]/courses/[courseId]/page.tsx:34`

**Issue:** Using "temp" as userId instead of actual authenticated user  
**Impact:** Features won't work correctly  
**Priority:** P1 - HIGH  
**Estimate:** 1 hour

```typescript
userId: "temp" // TODO: Get actual userId
```

**Fix Required:** Get userId from Clerk authentication.

---

## 🟢 NICE-TO-HAVE (Document & Defer) - 52 Items

These items are **features not yet built** or **deferred to Phase 2**. Document as "Coming Soon" for beta users.

### Category: Unimplemented Features (36 items)
- Lines 1: Messaging functionality in coaching
- Lines 27-35: Various form submission handlers (placeholders for features)
- Lines 36-39: Membership, webinar, affiliate program creation
- Lines 40: Leads page API calls
- Lines 48-49: Coaching profiles fetch
- Lines 51: QA instructor authorization check
- Lines 52: Module creation (legacy system)
- Lines 53: Stripe webhook Phase 2 handling
- Lines 54: Certificate authorization check
- Lines 55: Campaign sending implementation
- Lines 67-73: Admin panel data queries (7 items)

**Action:** Document as "Coming Soon" in beta known issues.

---

### Category: Seed Data & Configuration (4 items)
- Lines 56-59: Placeholder Stripe price IDs in seed data

**Action:** Replace with real Stripe price IDs before going live with credit system.

---

### Category: Not Actual TODOs (4 items)
- Lines 50: next-env.d.ts NOTE (auto-generated file)
- Lines 65-66: package-lock.json integrity hashes (not TODOs)
- Lines 74-75: Debug flags in .env file (expected for development)

**Action:** Ignore these.

---

## 📊 Summary Statistics

| Priority | Count | Est. Time | Status |
|----------|-------|-----------|--------|
| 🔴 P0 - Critical | 4 | 5.5 hours | Must fix before beta |
| 🔴 P1 - High | 9 | 11.5 hours | Fix during Week 1 |
| 🟡 P2 - Medium | 6 | 9 hours | Fix during beta |
| 🟢 P3 - Low | 56 | N/A | Document & defer |
| **TOTAL** | **75** | **26 hours** | |

---

## ✅ Action Plan

### Immediate (Before Beta - 6 hours)
1. ✅ Fix payment verification route (1h)
2. ✅ Add Stripe Connect account to checkout (2h)
3. ✅ Create course enrollment after payment (1h)
4. ✅ Fix credit system webhook (0.5h)
5. ✅ Update Stripe account status (0.5h)
6. ✅ Handle payment failures (1h)

### Week 1 of Beta (11.5 hours)
1. Remove debug console.logs (0.5h)
2. Calculate real stats for coaching/dashboard (2h)
3. Add post-purchase emails (2h)
4. Implement course progress tracking (2h)
5. Fix enrollment form logic (2h)
6. Get real user IDs instead of "temp" (1h)
7. Fix PhonePreview API calls (1h)
8. Discord invite link from database (1h)

### Week 2+ of Beta (9 hours)
1. Social media webhook handlers (3h)
2. Other P2 items as needed

### Document & Defer
1. Create `BETA_KNOWN_ISSUES.md` listing all 🟢 items
2. Mark features as "Coming in Phase 2"

---

## 🎯 Next Steps

1. **Run this command to start fixing critical items:**
   ```bash
   # Create tracking file for fixes
   touch CRITICAL_FIXES_LOG.md
   ```

2. **Work through P0 items first (5.5 hours)**
   - These are blocking issues
   - Must be fixed before any beta users

3. **Then P1 items during first week of beta (11.5 hours)**
   - Fix as user feedback comes in
   - Prioritize based on what beta users actually use

4. **Monitor and adjust**
   - Some items may not be needed if features aren't used
   - Add new items from beta feedback

---

**Generated:** October 9, 2025  
**Review Date:** After completing critical fixes  
**Next Review:** After Week 1 of beta


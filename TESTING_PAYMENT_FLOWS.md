# Payment Flow Testing - Comprehensive Test Plan

## 🎯 Test Objective
Verify that payment processing works correctly for:
1. Successful payments (various card types)
2. Failed payments (declined cards, errors)
3. Webhook event handling
4. Access control after payment
5. Creator earnings calculation
6. Email notifications
7. Stripe Connect payouts

**Estimated Time:** 60-90 minutes  
**Test Date:** _______________  
**Tester:** _______________

---

## 📋 Pre-Test Setup

### Prerequisites
- [ ] Stripe account in TEST MODE
- [ ] Stripe webhooks configured
- [ ] Creator with published course ($49 price)
- [ ] Stripe Connect account linked (creator)
- [ ] Email service configured (Resend/SendGrid)

### Test Environment
```
Stripe Mode: TEST
Webhook Endpoint: https://your-domain.com/api/webhooks/stripe
Webhook Secret: whsec_...
Test Course: "Mastering FL Studio 101"
Course Price: $49.00
Platform Fee: 10% ($4.90)
Creator Payout: $44.10
```

### Stripe Test Cards

| Scenario | Card Number | Expected Result |
|----------|-------------|-----------------|
| Success | 4242 4242 4242 4242 | Charge succeeds |
| Decline | 4000 0000 0000 0002 | Card declined |
| Insufficient Funds | 4000 0000 0000 9995 | Insufficient funds |
| Lost Card | 4000 0000 0000 9987 | Lost card |
| Stolen Card | 4000 0000 0000 9979 | Stolen card |
| Expired Card | 4000 0000 0000 0069 | Expired card |
| Processing Error | 4000 0000 0000 0119 | Processing error |
| 3D Secure | 4000 0027 6000 3184 | 3DS authentication |
| Dispute (Later) | 4000 0000 0000 0259 | Will be disputed |

---

## ✅ Test Checklist

### Phase 1: Successful Payment Flow (15 minutes)

#### Test 1.1: Basic Successful Payment
**Test Data:**
- Card: `4242 4242 4242 4242`
- Expiry: `12/26`
- CVC: `123`
- ZIP: `12345`

**Steps:**
- [ ] Student navigates to course: "Mastering FL Studio 101"
- [ ] Click "Enroll Now" ($49)
- [ ] Enter payment details above
- [ ] Click "Pay $49"
- [ ] **Expected:** Payment processes within 5 seconds

**✅ Verify:**
- [ ] Success page displays
- [ ] Toast notification: "Payment successful!"
- [ ] Redirected to course or library
- [ ] Course appears in student's library
- [ ] Progress initialized to 0%

**⏱️ Processing Time:** _____ seconds

**🐛 Issues:**
```
_______________________________________
```

---

#### Test 1.2: Verify Database Enrollment
**Steps:**
- [ ] Open Convex Dashboard
- [ ] Navigate to `enrollments` table
- [ ] Find most recent enrollment
- [ ] **Expected:** New enrollment record created

**✅ Verify Fields:**
- [ ] `studentId`: Matches test student
- [ ] `courseId`: Matches test course
- [ ] `status`: "active"
- [ ] `paymentStatus`: "paid"
- [ ] `amount`: 49.00
- [ ] `currency`: "usd"
- [ ] `stripePaymentIntentId`: Present
- [ ] `_creationTime`: Recent timestamp

**Pass/Fail:** [ ] PASS [ ] FAIL

---

#### Test 1.3: Verify Stripe Dashboard
**Steps:**
- [ ] Open Stripe Dashboard (Test Mode)
- [ ] Navigate to Payments
- [ ] Find most recent payment
- [ ] **Expected:** Payment Intent with status "succeeded"

**✅ Verify:**
- [ ] Amount: $49.00
- [ ] Status: Succeeded
- [ ] Customer email matches
- [ ] Description includes course name
- [ ] Metadata includes:
  - `courseId`
  - `studentId`
  - `creatorId`
  - `storeId`
- [ ] Connected account: Creator's Stripe account
- [ ] Application fee: $4.90 (10%)

**Pass/Fail:** [ ] PASS [ ] FAIL

---

#### Test 1.4: Verify Webhook Events
**Steps:**
- [ ] In Stripe Dashboard, go to Developers → Webhooks
- [ ] Find your webhook endpoint
- [ ] View recent events
- [ ] **Expected:** See these events in order:
  1. `checkout.session.completed`
  2. `payment_intent.succeeded`
  3. `charge.succeeded`

**✅ Verify Each Event:**
- [ ] All events delivered successfully (200 response)
- [ ] No retries needed
- [ ] Response time < 2 seconds
- [ ] Event data includes metadata

**Pass/Fail:** [ ] PASS [ ] FAIL

**🐛 Issues:**
```
_______________________________________
```

---

#### Test 1.5: Verify Email Notifications
**Steps:**
- [ ] Check student's email inbox
- [ ] **Expected:** Purchase confirmation email received

**✅ Verify Email:**
- [ ] Received within 2 minutes
- [ ] Subject: "Your enrollment is confirmed!"
- [ ] Contains:
  - Course name
  - Amount paid: $49
  - Receipt/invoice link
  - "Access Your Course" button
  - Creator name
- [ ] All links work
- [ ] Professional design
- [ ] No broken images

**Pass/Fail:** [ ] PASS [ ] FAIL

---

#### Test 1.6: Verify Creator Earnings
**Steps:**
- [ ] Log in as creator
- [ ] Navigate to creator dashboard/earnings
- [ ] **Expected:** New earning recorded

**✅ Verify:**
- [ ] Total revenue increased by $49
- [ ] Platform fee deducted: $4.90
- [ ] Creator payout: $44.10
- [ ] Transaction appears in earnings list
- [ ] Status: "pending" or "available"
- [ ] Stripe Connect balance updated

**Pass/Fail:** [ ] PASS [ ] FAIL

**⏱️ Total Time for Test 1:** _____ minutes

---

### Phase 2: Failed Payment Scenarios (20 minutes)

#### Test 2.1: Declined Card
**Test Data:**
- Card: `4000 0000 0000 0002`
- Expiry: `12/26`
- CVC: `123`

**Steps:**
- [ ] Create new test student account
- [ ] Navigate to course
- [ ] Enter declined card details
- [ ] Click "Pay $49"
- [ ] **Expected:** Payment fails

**✅ Verify:**
- [ ] Error message displayed: "Your card was declined"
- [ ] User-friendly message (not raw error)
- [ ] Can retry payment
- [ ] NO enrollment created
- [ ] NO charge in Stripe
- [ ] NO email sent
- [ ] User remains on checkout page

**Pass/Fail:** [ ] PASS [ ] FAIL

**🐛 Issues:**
```
_______________________________________
```

---

#### Test 2.2: Insufficient Funds
**Test Data:**
- Card: `4000 0000 0000 9995`

**Steps:**
- [ ] Attempt payment with insufficient funds card
- [ ] **Expected:** Payment fails

**✅ Verify:**
- [ ] Error: "Insufficient funds"
- [ ] Helpful message displayed
- [ ] Retry option available
- [ ] No enrollment created

**Pass/Fail:** [ ] PASS [ ] FAIL

---

#### Test 2.3: Expired Card
**Test Data:**
- Card: `4000 0000 0000 0069`

**Steps:**
- [ ] Attempt payment with expired card
- [ ] **Expected:** Payment fails

**✅ Verify:**
- [ ] Error: "Your card has expired"
- [ ] Clear instructions to use valid card
- [ ] Can update payment method

**Pass/Fail:** [ ] PASS [ ] FAIL

---

#### Test 2.4: Processing Error
**Test Data:**
- Card: `4000 0000 0000 0119`

**Steps:**
- [ ] Attempt payment with processing error card
- [ ] **Expected:** Generic error

**✅ Verify:**
- [ ] Error message shown
- [ ] User can retry
- [ ] Support contact information provided
- [ ] Error logged for debugging

**Pass/Fail:** [ ] PASS [ ] FAIL

---

### Phase 3: 3D Secure Authentication (10 minutes)

#### Test 3.1: 3DS Payment Flow
**Test Data:**
- Card: `4000 0027 6000 3184`

**Steps:**
- [ ] Enter 3DS card details
- [ ] Click "Pay $49"
- [ ] **Expected:** 3DS authentication modal appears
- [ ] Complete authentication (click "Authenticate" in test modal)
- [ ] **Expected:** Payment succeeds after authentication

**✅ Verify:**
- [ ] 3DS modal triggered correctly
- [ ] Test authentication works
- [ ] Payment completes after auth
- [ ] Enrollment created
- [ ] Normal flow continues

**Pass/Fail:** [ ] PASS [ ] FAIL

**⏱️ Time:** _____ seconds

---

### Phase 4: Webhook Resilience (15 minutes)

#### Test 4.1: Manual Webhook Replay
**Steps:**
- [ ] In Stripe Dashboard → Webhooks
- [ ] Find a successful `checkout.session.completed` event
- [ ] Click "Resend"
- [ ] **Expected:** Webhook endpoint handles duplicate

**✅ Verify:**
- [ ] Duplicate detected (idempotency)
- [ ] No duplicate enrollment created
- [ ] No duplicate email sent
- [ ] Webhook returns 200 OK
- [ ] Logged as duplicate in system

**Pass/Fail:** [ ] PASS [ ] FAIL

---

#### Test 4.2: Webhook Signature Verification
**Steps:**
- [ ] Use tool to send fake webhook (no signature)
- [ ] Or temporarily disable signature check and test
- [ ] **Expected:** Request rejected

**✅ Verify:**
- [ ] Unsigned webhooks rejected (400 or 401)
- [ ] Error logged
- [ ] No action taken on fake webhook
- [ ] Security maintained

**Pass/Fail:** [ ] PASS [ ] FAIL

**🐛 Issues:**
```
_______________________________________
```

---

#### Test 4.3: Webhook Failure Recovery
**Steps:**
- [ ] Temporarily break webhook endpoint (return 500 error)
- [ ] Make a test payment
- [ ] **Expected:** Stripe retries webhook
- [ ] Fix webhook endpoint
- [ ] Wait for retry (minutes)
- [ ] **Expected:** Eventually processes

**✅ Verify:**
- [ ] Stripe retries failed webhooks
- [ ] Enrollment eventually created
- [ ] System recovers gracefully
- [ ] No data loss

**Pass/Fail:** [ ] PASS [ ] FAIL

---

### Phase 5: Edge Cases & Scenarios (20 minutes)

#### Test 5.1: Concurrent Enrollments
**Scenario:** Same student tries to enroll in same course twice

**Steps:**
- [ ] Student A enrolls in Course X
- [ ] Payment succeeds
- [ ] Before leaving page, open new tab
- [ ] Try to enroll again in Course X
- [ ] **Expected:** System prevents duplicate enrollment

**✅ Verify:**
- [ ] Duplicate detection works
- [ ] Message: "You're already enrolled in this course"
- [ ] Redirect to course player
- [ ] No duplicate charge
- [ ] No duplicate enrollment record

**Pass/Fail:** [ ] PASS [ ] FAIL

---

#### Test 5.2: Abandoned Checkout
**Steps:**
- [ ] Start checkout process
- [ ] Enter payment details
- [ ] Close browser WITHOUT completing
- [ ] Wait 30 minutes
- [ ] Check Stripe Dashboard
- [ ] **Expected:** Incomplete Payment Intent

**✅ Verify:**
- [ ] Payment Intent status: "requires_payment_method" or "canceled"
- [ ] No charge made
- [ ] No enrollment created
- [ ] Can restart checkout

**Pass/Fail:** [ ] PASS [ ] FAIL

---

#### Test 5.3: Refund Processing
**Steps:**
- [ ] Complete a successful purchase
- [ ] In Stripe Dashboard, issue full refund
- [ ] **Expected:** Refund webhook triggers
- [ ] **Expected:** System handles refund

**✅ Verify:**
- [ ] `charge.refunded` webhook received
- [ ] Enrollment status updated (if applicable)
- [ ] Access revoked (optional, based on policy)
- [ ] Creator payout adjusted
- [ ] Refund email sent to student

**Pass/Fail:** [ ] PASS [ ] FAIL

**🐛 Issues:**
```
_______________________________________
```

---

#### Test 5.4: Multiple Course Purchase
**Steps:**
- [ ] Student enrolls in Course A ($49)
- [ ] Payment succeeds
- [ ] Immediately enroll in Course B ($99)
- [ ] Payment succeeds
- [ ] **Expected:** Both enrollments process correctly

**✅ Verify:**
- [ ] Both payments successful
- [ ] Both enrollments created
- [ ] Both courses in library
- [ ] Separate confirmation emails
- [ ] Creator earnings correct for both

**Pass/Fail:** [ ] PASS [ ] FAIL

---

#### Test 5.5: Payment Intent Confirmation Race
**Steps:**
- [ ] Start payment
- [ ] Immediately refresh page
- [ ] **Expected:** System handles gracefully

**✅ Verify:**
- [ ] No double charging
- [ ] Clear status message
- [ ] Can verify payment status
- [ ] Recovery path available

**Pass/Fail:** [ ] PASS [ ] FAIL

---

### Phase 6: Stripe Connect (Creator Payouts) (15 minutes)

#### Test 6.1: Creator Payout Calculation
**Scenario:** Creator sells course for $49

**Calculations:**
```
Course Price:     $49.00
Stripe Fee (2.9% + $0.30): $1.72
Platform Fee (10%): $4.90
Creator Payout:   $42.38 (or $44.10 if platform covers Stripe)
```

**Steps:**
- [ ] Complete purchase
- [ ] Check Stripe Connect transfer
- [ ] **Expected:** Correct amount transferred to creator

**✅ Verify:**
- [ ] Transfer created
- [ ] Destination: Creator's Stripe account
- [ ] Amount matches calculation
- [ ] Transfer status: "paid" or "pending"
- [ ] Description includes course name
- [ ] Metadata correct

**Pass/Fail:** [ ] PASS [ ] FAIL

---

#### Test 6.2: Creator Without Stripe Connect
**Steps:**
- [ ] Create new creator account
- [ ] Do NOT connect Stripe
- [ ] Publish course with price
- [ ] Student tries to enroll
- [ ] **Expected:** Cannot complete purchase

**✅ Verify:**
- [ ] Error message shown
- [ ] "Creator hasn't set up payments yet"
- [ ] Student is not charged
- [ ] Enrollment not created
- [ ] Creator notified to set up Stripe

**Pass/Fail:** [ ] PASS [ ] FAIL

**🐛 Issues:**
```
_______________________________________
```

---

#### Test 6.3: Creator Payout History
**Steps:**
- [ ] As creator, navigate to earnings/payouts
- [ ] **Expected:** Transaction history visible

**✅ Verify:**
- [ ] All transactions listed
- [ ] Amounts correct
- [ ] Dates accurate
- [ ] Can filter by date range
- [ ] Can export to CSV
- [ ] Running balance shown
- [ ] Pending vs. available balance

**Pass/Fail:** [ ] PASS [ ] FAIL

---

### Phase 7: Performance & Load Testing (10 minutes)

#### Test 7.1: Concurrent Payments
**Steps:**
- [ ] Create 5 test student accounts
- [ ] Simultaneously (within 10 seconds) have all 5 enroll in same course
- [ ] **Expected:** All payments process successfully

**✅ Verify:**
- [ ] All 5 payments succeed
- [ ] All 5 enrollments created
- [ ] No race conditions
- [ ] No duplicate charges
- [ ] Webhooks all processed
- [ ] Creator earnings reflect all 5 sales

**Pass/Fail:** [ ] PASS [ ] FAIL

**⏱️ Time:** _____ seconds

---

#### Test 7.2: Payment Processing Speed
**Metric:** Time from "Pay" button click to success page

**Steps:**
- [ ] Complete 5 test payments
- [ ] Record time for each
- [ ] Calculate average

**Results:**
```
Payment 1: _____ seconds
Payment 2: _____ seconds
Payment 3: _____ seconds
Payment 4: _____ seconds
Payment 5: _____ seconds

Average: _____ seconds
Target: < 5 seconds
```

**Pass/Fail:** [ ] PASS (< 5s avg) [ ] FAIL

---

## 📊 Test Results Summary

### Overall Statistics
```
Total Tests: 21
Passed: ___
Passed with Issues: ___
Failed: ___

Success Rate: ____%
```

### Payment Success Rate
```
Successful Payments Attempted: ___
Successful Completions: ___
Success Rate: ____%
Target: 100%
```

### Failed Payment Handling
```
Failed Payment Scenarios Tested: 5
Handled Gracefully: ___
Issues Found: ___
```

### Webhook Reliability
```
Webhooks Sent: ___
Webhooks Received: ___
Webhooks Processed: ___
Success Rate: ____%
Target: 100%
```

---

## 🐛 Critical Issues Found

### Payment Blocking Issues (P0)
```
1. _______________________________________
2. _______________________________________
3. _______________________________________
```

### Revenue Impact Issues (P1)
```
1. _______________________________________
2. _______________________________________
```

### User Experience Issues (P2)
```
1. _______________________________________
2. _______________________________________
```

---

## ✅ Stripe Integration Checklist

### Configuration
- [ ] Stripe API keys configured (test & production)
- [ ] Webhook endpoint URL correct
- [ ] Webhook secret configured
- [ ] Webhook events subscribed:
  - [ ] checkout.session.completed
  - [ ] payment_intent.succeeded
  - [ ] payment_intent.payment_failed
  - [ ] charge.refunded
  - [ ] charge.succeeded
  - [ ] customer.subscription.* (if subscriptions)

### Stripe Connect
- [ ] OAuth flow works
- [ ] Creators can connect accounts
- [ ] Payouts are calculated correctly
- [ ] Platform fee is appropriate (10%)
- [ ] Transfers happen automatically

### Security
- [ ] Webhook signature verification enabled
- [ ] API keys stored securely (environment variables)
- [ ] No hardcoded secrets in code
- [ ] HTTPS enforced
- [ ] Payment intents confirmed server-side

### Error Handling
- [ ] Declined cards handled gracefully
- [ ] Network errors caught and displayed
- [ ] Webhook failures logged and retried
- [ ] User-friendly error messages
- [ ] Support contact info provided

---

## 🎯 Performance Metrics

### Speed
```
Average Payment Time: _____ seconds
Target: < 5 seconds
Status: [ ] PASS [ ] FAIL
```

### Reliability
```
Payment Success Rate: ____%
Target: > 95%
Status: [ ] PASS [ ] FAIL
```

### Webhook Delivery
```
First Attempt Success: ____%
Target: > 95%
Status: [ ] PASS [ ] FAIL
```

---

## 💡 Recommendations

### Must Fix Before Beta (P0)
1. _______________________________________
2. _______________________________________

### Should Fix Before Beta (P1)
1. _______________________________________
2. _______________________________________

### Nice to Have (P2)
1. _______________________________________
2. _______________________________________

---

## 🏁 Final Checklist

- [ ] All test scenarios completed
- [ ] Critical bugs identified and documented
- [ ] Payment flow works end-to-end
- [ ] Webhook handling is reliable
- [ ] Creator payouts are accurate
- [ ] Error handling is user-friendly
- [ ] Performance meets targets
- [ ] Security measures validated
- [ ] Test results shared with team
- [ ] Priority fixes assigned

---

**Test Status:** [ ] READY FOR BETA [ ] NEEDS FIXES [ ] BLOCKED

**Tester Signature:** _______________  
**Date Completed:** _______________

**Next Steps:**
```
_______________________________________
_______________________________________
_______________________________________
```


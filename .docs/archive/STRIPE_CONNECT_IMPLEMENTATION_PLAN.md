# Stripe Connect Implementation Plan for Course Marketplace

## 🎯 Overview

This document outlines the implementation of Stripe Connect for the course marketplace, enabling:
- **Seller Onboarding**: Course creators connect their Stripe accounts
- **Course Payments**: Students purchase courses with Stripe
- **Automated Payouts**: Revenue distribution to course creators
- **Platform Fees**: PausePlayRepeat takes a percentage

## 🏗️ Architecture Overview

### **Payment Flow**
```
Student Purchase → Stripe Payment → Platform Account → Creator Payout
    ($100)           ($100)           ($90 + $10 fee)      ($90 to creator)
```

### **Stripe Connect Model: Express Accounts**
- **Express Accounts**: Simplified onboarding for creators
- **Platform Responsibility**: Handle compliance, KYC, tax reporting
- **Creator Experience**: Minimal setup, fast onboarding

## 🗄️ Database Schema Extensions

### 1. Stripe Connect Fields (Add to existing tables)

#### Users Table (Add fields)
```typescript
// Add to existing users schema
stripeConnectAccountId: v.optional(v.string()),
stripeAccountStatus: v.optional(v.union(
  v.literal("pending"),
  v.literal("restricted"),
  v.literal("enabled")
)),
stripeOnboardingComplete: v.optional(v.boolean()),
payoutSchedule: v.optional(v.union(
  v.literal("daily"),
  v.literal("weekly"),
  v.literal("monthly")
)),
```

#### Stores Table (Add fields)
```typescript
// Add to existing stores schema
stripeConnectAccountId: v.optional(v.string()),
stripeAccountStatus: v.optional(v.string()),
payoutEnabled: v.optional(v.boolean()),
platformFeePercentage: v.optional(v.number()), // Default 10%
```

### 2. New Tables for Payment Tracking

#### Course Enrollments
```typescript
courseEnrollments: defineTable({
  courseId: v.id("courses"),
  studentId: v.string(), // Customer ID or email
  studentEmail: v.string(),
  studentName: v.string(),
  storeId: v.id("stores"),
  creatorId: v.string(), // Course creator user ID
  purchaseDate: v.number(),
  amount: v.number(),
  platformFee: v.number(),
  creatorEarnings: v.number(),
  stripePaymentId: v.string(),
  stripeTransferId: v.optional(v.string()),
  status: v.union(
    v.literal("pending"),
    v.literal("completed"),
    v.literal("refunded")
  ),
}).index("by_courseId", ["courseId"])
  .index("by_studentEmail", ["studentEmail"])
  .index("by_creatorId", ["creatorId"])
  .index("by_storeId", ["storeId"]);
```

#### Payouts
```typescript
payouts: defineTable({
  creatorId: v.string(),
  storeId: v.id("stores"),
  amount: v.number(),
  platformFee: v.number(),
  stripePayoutId: v.string(),
  payoutDate: v.number(),
  status: v.union(
    v.literal("pending"),
    v.literal("in_transit"),
    v.literal("paid"),
    v.literal("failed")
  ),
  enrollmentIds: v.array(v.id("courseEnrollments")),
}).index("by_creatorId", ["creatorId"])
  .index("by_storeId", ["storeId"])
  .index("by_status", ["status"]);
```

## 🚀 Implementation Phases

### **Phase 1: Stripe Connect Setup (Week 1-2)**

#### 1.1 Environment Configuration
```env
# Add to .env.local
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_CONNECT_CLIENT_ID=ca_...
```

#### 1.2 Stripe Connect Account Creation
```typescript
// API route: /api/stripe/connect/create-account
export async function POST(request: Request) {
  const { userId, email, type = "express" } = await request.json();
  
  const account = await stripe.accounts.create({
    type: "express",
    email,
    capabilities: {
      transfers: { requested: true },
    },
    business_type: "individual",
    metadata: {
      userId,
    },
  });
  
  // Save account ID to user record
  await updateUser({ id: userId, stripeConnectAccountId: account.id });
  
  return Response.json({ accountId: account.id });
}
```

#### 1.3 Onboarding Link Generation
```typescript
// API route: /api/stripe/connect/onboarding-link
export async function POST(request: Request) {
  const { accountId } = await request.json();
  
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/store/settings/payouts?refresh=true`,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/store/settings/payouts?success=true`,
    type: "account_onboarding",
  });
  
  return Response.json({ url: accountLink.url });
}
```

### **Phase 2: Seller Onboarding UI (Week 2-3)**

#### 2.1 Payout Settings Page
**Location**: `/store/{storeId}/settings/payouts`

**Features:**
- Stripe Connect account status
- Onboarding flow initiation
- Payout schedule configuration
- Earnings dashboard
- Account verification status

#### 2.2 Onboarding Flow Components
```typescript
// Components to create:
- StripeConnectButton
- OnboardingStatus
- PayoutDashboard
- EarningsChart
- AccountVerificationBanner
```

### **Phase 3: Course Payment Integration (Week 3-4)**

#### 3.1 Course Purchase API
```typescript
// API route: /api/courses/purchase
export async function POST(request: Request) {
  const { courseId, customerEmail, customerName } = await request.json();
  
  // 1. Fetch course and creator info
  const course = await getCourse(courseId);
  const creator = await getUser(course.userId);
  
  // 2. Create Stripe Payment Intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: course.price * 100, // Convert to cents
    currency: "usd",
    application_fee_amount: Math.round(course.price * 0.1 * 100), // 10% platform fee
    transfer_data: {
      destination: creator.stripeConnectAccountId,
    },
    metadata: {
      courseId,
      customerEmail,
      customerName,
      storeId: course.storeId,
    },
  });
  
  return Response.json({ 
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id 
  });
}
```

#### 3.2 Payment Success Handler
```typescript
// API route: /api/courses/payment-success
export async function POST(request: Request) {
  const { paymentIntentId } = await request.json();
  
  // 1. Verify payment with Stripe
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  
  if (paymentIntent.status === "succeeded") {
    // 2. Create enrollment record
    const enrollment = await createEnrollment({
      courseId: paymentIntent.metadata.courseId,
      studentEmail: paymentIntent.metadata.customerEmail,
      studentName: paymentIntent.metadata.customerName,
      amount: paymentIntent.amount / 100,
      stripePaymentId: paymentIntentId,
    });
    
    // 3. Send confirmation email
    await sendEnrollmentConfirmation(enrollment);
    
    return Response.json({ success: true, enrollmentId: enrollment.id });
  }
  
  return Response.json({ success: false });
}
```

### **Phase 4: Automated Payouts (Week 4-5)**

#### 4.1 Payout Calculation
```typescript
// Convex function: calculateCreatorPayouts
export const calculateCreatorPayouts = internalAction({
  args: { creatorId: v.string() },
  returns: v.object({
    totalEarnings: v.number(),
    platformFees: v.number(),
    payoutAmount: v.number(),
    enrollmentCount: v.number(),
  }),
  handler: async (ctx, args) => {
    // Get unpaid enrollments for creator
    const enrollments = await ctx.db
      .query("courseEnrollments")
      .withIndex("by_creatorId", q => q.eq("creatorId", args.creatorId))
      .filter(q => q.eq(q.field("status"), "completed"))
      .filter(q => q.eq(q.field("payoutStatus"), "pending"))
      .collect();
    
    const totalEarnings = enrollments.reduce((sum, e) => sum + e.creatorEarnings, 0);
    const platformFees = enrollments.reduce((sum, e) => sum + e.platformFee, 0);
    
    return {
      totalEarnings,
      platformFees,
      payoutAmount: totalEarnings,
      enrollmentCount: enrollments.length,
    };
  },
});
```

## 🎨 User Interface Components

### **1. Seller Onboarding Page**
```typescript
// /store/{storeId}/settings/payouts
<Card>
  <CardHeader>
    <CardTitle>Payout Settings</CardTitle>
  </CardHeader>
  <CardContent>
    {!stripeConnectAccountId ? (
      <StripeConnectOnboarding />
    ) : (
      <PayoutDashboard />
    )}
  </CardContent>
</Card>
```

### **2. Course Purchase Integration**
```typescript
// Update CourseEnrollmentForm.tsx
const handleEnrollment = async () => {
  // 1. Create payment intent
  const { clientSecret } = await fetch('/api/courses/purchase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      courseId: course._id,
      customerEmail: customerData.email,
      customerName: customerData.name,
    }),
  }).then(res => res.json());
  
  // 2. Process payment with Stripe Elements
  const { error } = await stripe.confirmPayment({
    elements,
    clientSecret,
    confirmParams: {
      return_url: `/store/${storeId}/courses/${course._id}/success`,
    },
  });
};
```

### **3. Earnings Dashboard**
```typescript
// /store/{storeId}/analytics/earnings
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <Card>
    <CardHeader>
      <CardTitle>Total Earnings</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold">${totalEarnings}</div>
      <p className="text-muted-foreground">This month</p>
    </CardContent>
  </Card>
  
  <Card>
    <CardHeader>
      <CardTitle>Course Sales</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold">{enrollmentCount}</div>
      <p className="text-muted-foreground">Total enrollments</p>
    </CardContent>
  </Card>
  
  <Card>
    <CardHeader>
      <CardTitle>Next Payout</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold">${pendingPayout}</div>
      <p className="text-muted-foreground">In 7 days</p>
    </CardContent>
  </Card>
</div>
```

## 🔧 Technical Implementation Steps

### **Immediate Next Steps (This Week)**

1. **Set up Stripe Connect in your Stripe Dashboard**
   - Enable Connect in your Stripe account
   - Get your Connect Client ID
   - Configure webhooks for Connect events

2. **Create Stripe Connect API Routes**
   - `/api/stripe/connect/create-account`
   - `/api/stripe/connect/onboarding-link`
   - `/api/stripe/connect/account-status`

3. **Add Payout Settings Page**
   - Create `/store/{storeId}/settings/payouts`
   - Stripe Connect onboarding flow
   - Account status dashboard

### **Short Term (Next 2 Weeks)**

4. **Implement Course Payment Flow**
   - Update course enrollment form with Stripe Elements
   - Create payment processing API routes
   - Add payment success/failure handling

5. **Create Enrollment Management**
   - Student access control system
   - Course enrollment tracking
   - Email confirmation system

### **Medium Term (Month 1)**

6. **Automated Payout System**
   - Weekly/monthly payout calculations
   - Stripe Transfer API integration
   - Payout notifications and reporting

## 💰 Revenue Model

### **Platform Fee Structure**
- **Course Sales**: 10% platform fee + Stripe fees (~3%)
- **Bundle Sales**: 8% platform fee + Stripe fees (lower fee for higher value)
- **Minimum Payout**: $25 (to reduce transfer costs)

### **Payout Schedule**
- **Weekly Payouts**: Every Friday for balances > $25
- **Instant Payouts**: Available for Premium creators (coming later)
- **Hold Period**: 7 days for new creators (fraud protection)

## 🔒 Security & Compliance

### **Required Compliance**
- **KYC/AML**: Handled by Stripe Connect
- **Tax Reporting**: 1099 forms generated by Stripe
- **PCI Compliance**: Handled by Stripe Elements
- **Data Protection**: Minimal financial data storage

### **Fraud Prevention**
- **Identity Verification**: Required for payouts > $500/week
- **Account Monitoring**: Stripe's built-in fraud detection
- **Dispute Handling**: Automatic chargeback management

## 🎓 Course Creator Experience

### **Onboarding Flow**
1. **Create Course** → Course creation flow
2. **Connect Stripe** → Payout settings page
3. **Verify Identity** → Stripe Express onboarding
4. **Publish Course** → Course goes live for sales
5. **Earn Revenue** → Automatic weekly payouts

### **Ongoing Management**
- **Earnings Dashboard**: Real-time revenue tracking
- **Student Analytics**: Enrollment and completion metrics
- **Payout History**: Transaction and transfer records
- **Tax Documents**: Automatic 1099 generation

## 🛒 Student Purchase Experience

### **Course Purchase Flow**
1. **Browse Courses** → Public storefront
2. **Course Details** → Enrollment page with pricing
3. **Secure Checkout** → Stripe Elements payment form
4. **Instant Access** → Immediate course access after payment
5. **Confirmation** → Email with course access link

### **Payment Methods**
- **Credit Cards**: Visa, MasterCard, Amex
- **Digital Wallets**: Apple Pay, Google Pay
- **Bank Transfers**: ACH (US), SEPA (EU) - coming later
- **Buy Now, Pay Later**: Klarna, Afterpay - coming later

## 📊 Analytics & Reporting

### **Creator Analytics**
- **Revenue Trends**: Daily/weekly/monthly earnings
- **Course Performance**: Best-selling courses
- **Student Demographics**: Geographic and enrollment patterns
- **Conversion Metrics**: Storefront visit to purchase rates

### **Platform Analytics**
- **Total GMV**: Gross Merchandise Value
- **Platform Revenue**: Total platform fees collected
- **Creator Success**: Average creator earnings
- **Course Catalog Growth**: New courses published

## 🚀 Implementation Roadmap

### **Week 1-2: Foundation**
- [ ] Stripe Connect dashboard setup
- [ ] Basic API routes for account creation
- [ ] Payout settings page UI
- [ ] Database schema updates

### **Week 3-4: Payment Integration**
- [ ] Course purchase API with Stripe
- [ ] Payment form with Stripe Elements
- [ ] Enrollment creation and access control
- [ ] Email confirmation system

### **Week 5-6: Payout System**
- [ ] Automated payout calculations
- [ ] Stripe Transfer API integration
- [ ] Earnings dashboard for creators
- [ ] Payout history and reporting

### **Week 7-8: Polish & Testing**
- [ ] Error handling and edge cases
- [ ] Comprehensive testing (sandbox)
- [ ] Creator onboarding documentation
- [ ] Student purchase flow optimization

## 💡 Key Considerations

### **Platform Economics**
- **10% Platform Fee**: Competitive with Teachable (10%), Thinkific (10%)
- **Volume Discounts**: 8% for bundles, 6% for high-volume creators
- **Stripe Fees**: ~2.9% + 30¢ per transaction (passed to creators)

### **Creator Incentives**
- **Fast Payouts**: Weekly instead of monthly
- **Low Minimums**: $25 minimum vs $100 on other platforms
- **Transparent Fees**: Clear fee structure, no hidden costs
- **Growth Support**: Marketing tools, analytics, student insights

### **Competitive Advantages**
- **Integrated Storefront**: Courses + digital products + coaching in one place
- **Bundle System**: Unique cross-product bundling capabilities
- **Creator Tools**: Built-in course creation, marketing, and analytics
- **Student Experience**: Unified learning platform

---

## 🎯 Next Actions

### **Immediate (This Week)**
1. **Enable Stripe Connect** in your Stripe dashboard
2. **Create payout settings page** for seller onboarding
3. **Update course enrollment form** with payment integration
4. **Test with your first course** to validate the flow

### **Priority Implementation Order**
1. **Seller Onboarding** (creators can connect Stripe accounts)
2. **Course Payments** (students can purchase courses)
3. **Access Control** (purchased course access)
4. **Automated Payouts** (revenue distribution)

This plan will transform your course creation platform into a **full marketplace** where creators can monetize their expertise and students can purchase comprehensive learning experiences!

---

*Last Updated: January 2025*
*Status: Ready for Implementation*

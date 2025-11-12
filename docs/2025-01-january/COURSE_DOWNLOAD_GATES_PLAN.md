# 🎓 Course Download Gates - Implementation Plan

**Date**: November 11, 2025  
**Feature**: Add free with download gate option to course creation  
**Status**: 📋 Ready to Implement

---

## 🎯 The Goal

Enable courses to use the same flexible pricing as other products:
- **Free with Download Gate**: Require email + social follows to enroll
- **Paid**: Traditional paid enrollment

---

## 🏗️ Implementation Plan

### Step 1: Update Course Data Interface

**File**: `app/(dashboard)/store/[storeId]/course/create/context.tsx`

Add to `CourseData`:
```typescript
export interface CourseData {
  // ... existing fields ...
  
  // NEW: Pricing Model
  pricingModel?: "free_with_gate" | "paid";
  
  // NEW: Follow Gate Config (if free)
  followGateEnabled?: boolean;
  followGateRequirements?: {
    requireEmail?: boolean;
    requireInstagram?: boolean;
    requireTiktok?: boolean;
    requireYoutube?: boolean;
    requireSpotify?: boolean;
    minFollowsRequired?: number;
  };
  followGateSocialLinks?: {
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    spotify?: string;
  };
  followGateMessage?: string;
}
```

### Step 2: Add Pricing Model Step

**New Step**: Between "course" and "checkout"

**Flow**:
```
Step 1: Course (modules/lessons)
Step 2: Pricing Model (NEW!)  ← Choose free or paid
Step 3: Checkout (if paid) OR Follow Gate (if free)
Step 4: Options
```

**Component**: Reuse `PricingModelSelector` from universal wizard!

### Step 3: Update Checkout Step

**File**: `steps/CheckoutForm.tsx`

**Changes**:
- Show only if `pricingModel === "paid"`
- Skip if free with gate

### Step 4: Add Follow Gate Step

**New File**: `steps/FollowGateForm.tsx`

**Component**: Reuse `FollowGateConfigStep` from universal wizard!

**Shows only if**: `pricingModel === "free_with_gate"`

### Step 5: Update Course Schema

**File**: `convex/schema.ts`

Add to `courses` table:
```typescript
courses: defineTable({
  // ... existing fields ...
  
  // Follow Gate Configuration (NEW)
  followGateEnabled: v.optional(v.boolean()),
  followGateRequirements: v.optional(v.object({
    requireEmail: v.optional(v.boolean()),
    requireInstagram: v.optional(v.boolean()),
    requireTiktok: v.optional(v.boolean()),
    requireYoutube: v.optional(v.boolean()),
    requireSpotify: v.optional(v.boolean()),
    minFollowsRequired: v.optional(v.number()),
  })),
  followGateSocialLinks: v.optional(v.object({
    instagram: v.optional(v.string()),
    tiktok: v.optional(v.string()),
    youtube: v.optional(v.string()),
    spotify: v.optional(v.string()),
  })),
  followGateMessage: v.optional(v.string()),
})
```

### Step 6: Update Course Enrollment

**File**: `convex/enrollments.ts` or course enrollment logic

**Check access**:
```typescript
// Before enrolling user in free course
if (course.followGateEnabled) {
  // Check if user completed follow gate
  const submission = await ctx.db
    .query("followGateSubmissions")
    .withIndex("by_email_product", (q) =>
      q.eq("email", userEmail).eq("productId", course._id)
    )
    .first();
  
  if (!submission) {
    return { error: "Complete follow gate first" };
  }
}
```

---

## 🎨 Updated Course Creation Flow

### **Before** (Paid Only)
```
Step 1: Course Info (title, description)
Step 2: Checkout (price, payment)
Step 3: Options (settings)
```

### **After** (Free or Paid)
```
Step 1: Course Info (title, description, modules)
Step 2: Pricing Model (NEW!)
        ⭕ Free with Download Gate
        ⚫ Paid
        
If PAID:
  Step 3: Checkout (price, payment)
  Step 4: Options
  
If FREE:
  Step 3: Follow Gate (email + socials)
  Step 4: Options
```

---

## 💡 Use Cases

### **Free Course with Email Gate**
```
Course: "Intro to Music Production"
Pricing: FREE - Require email
Result: Build email list, then upsell to paid courses
```

### **Free Course with Instagram + Spotify**
```
Course: "10 Beat Making Tips"
Pricing: FREE - Require Instagram + Spotify follow
Result: Grow social following, position as authority
```

### **Freemium Model**
```
Course 1: "Basics" - FREE with email gate
Course 2: "Advanced" - PAID $99
Result: Free course builds trust, paid course monetizes
```

---

## 🔧 Components to Reuse

### From Universal Wizard:
1. ✅ `PricingModelSelector` - Choose free or paid
2. ✅ `FollowGateConfigStep` - Configure download gate
3. ✅ Existing follow gate backend functions

### No New Components Needed!
Just integrate existing ones into course flow.

---

## ⏱️ Estimated Time

- Update CourseData interface: 15 min
- Add pricing model step: 30 min
- Add follow gate step: 30 min
- Update checkout conditional logic: 15 min
- Update course schema: 15 min
- Update enrollment logic: 1 hour
- Testing: 1 hour

**Total**: ~3-4 hours

---

## 🎯 Priority

**Recommendation**: Build this AFTER current system is tested

**Why**:
- Current universal wizard already works for 17 simple products
- Courses work with existing paid flow
- This is an enhancement, not blocking
- Can be added anytime

**When to build**:
- After Phase 2 is deployed and tested
- When you want to offer free courses as lead magnets
- When you want to use courses for audience growth

---

**Want me to implement this now, or should we test the current system first?** 🚀


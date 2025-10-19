# Customer Records Fix - Missing Course Purchases

## Problem Identified

The **customers page was missing people who purchased courses** because course enrollments weren't creating customer records.

### What Was Happening

**Lead Magnets:** ✅ Creating customer records  
**Digital Product Purchases:** ✅ Creating customer records  
**Course Purchases:** ❌ NOT creating customer records  

This meant course buyers weren't appearing in your Customers list even though they should!

---

## ✅ Fixes Applied

### 1. **Updated Course Enrollment Mutation**

**File:** `/convex/library.ts` - `createCourseEnrollment` mutation

**Added:**
```typescript
// Create or update customer record for this purchase
try {
  const storeId = course.storeId || course.userId;
  
  // Get user info for customer record
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", args.userId))
    .unique();
  
  if (user && storeId) {
    // Check if customer already exists
    const existingCustomer = await ctx.db
      .query("customers")
      .withIndex("by_email_and_store", (q) => 
        q.eq("email", user.email || "").eq("storeId", storeId)
      )
      .unique();

    if (existingCustomer) {
      // Update existing customer
      await ctx.db.patch(existingCustomer._id, {
        type: "paying",
        totalSpent: (existingCustomer.totalSpent || 0) + args.amount,
        lastActivity: Date.now(),
        status: "active",
      });
    } else {
      // Create new customer record
      await ctx.db.insert("customers", {
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "Unknown",
        email: user.email || args.userId,
        storeId: storeId,
        adminUserId: course.userId,
        type: "paying",
        status: "active",
        totalSpent: args.amount,
        lastActivity: Date.now(),
        source: course.title || "Course Purchase",
      });
    }
  }
} catch (error) {
  console.error("Failed to create/update customer record:", error);
}
```

**Behavior:**
- ✅ Creates customer record when course is purchased
- ✅ Updates existing customer if they already exist
- ✅ Sets type to "paying"
- ✅ Tracks total spent
- ✅ Records course name as source
- ✅ Doesn't fail enrollment if customer creation fails

---

### 2. **Created Backfill Migration**

**File:** `/convex/migrations/backfillCustomers.ts`

**Purpose:** One-time script to create customer records for existing course purchases

**How to Run:**

You can call this migration from the Convex dashboard or create a simple admin button:

```typescript
// In Convex dashboard Functions tab:
// Call: migrations/backfillCustomers:backfillCustomersFromPurchases
// Args: {}
```

**What It Does:**
1. Finds all completed purchases
2. For each purchase, gets user info
3. Creates or updates customer record
4. Tracks: customers created, customers updated, errors
5. Doesn't fail if individual records error

**Returns:**
```json
{
  "success": true,
  "customersCreated": 15,
  "customersUpdated": 5,
  "errors": 0
}
```

---

## 🔍 Why Customers Were Missing

### **The Gap**

**Before Fix:**
```
User buys course
  ↓
createCourseEnrollment called
  ↓
✅ Purchase record created
✅ Enrollment record created
❌ Customer record NOT created ← THE PROBLEM
  ↓
Customers page shows nothing for this buyer
```

**After Fix:**
```
User buys course
  ↓
createCourseEnrollment called
  ↓
✅ Purchase record created
✅ Enrollment record created
✅ Customer record created ← FIXED!
  ↓
Customers page shows the buyer ✨
```

---

## 📊 Customer Record Details

### **What Gets Created**

```typescript
{
  name: "John Doe",
  email: "john@example.com",
  storeId: "your-store-id",
  adminUserId: "course-creator-id",
  type: "paying",           // Lead, Paying, or Subscription
  status: "active",
  totalSpent: 49.99,        // Accumulated from all purchases
  lastActivity: 1697500000,
  source: "Course Title"    // Shows what brought them in
}
```

### **Customer Types**

| Type | When | Example |
|------|------|---------|
| **lead** | Free lead magnet | Email opt-in for free sample pack |
| **paying** | Paid purchase | Bought a course for $49 |
| **subscription** | Active subscription | Monthly membership |

---

## 🚀 Next Steps

### **For Future Purchases**
✅ Automatically handled - new course purchases will create customer records

### **For Existing Purchases** (Backfill)

**Option 1: Run migration from Convex Dashboard**
1. Go to https://dashboard.convex.dev
2. Navigate to Functions
3. Find `migrations/backfillCustomers:backfillCustomersFromPurchases`
4. Click "Run" with empty args `{}`
5. Check result

**Option 2: Create Admin Button** (I can implement this)
```tsx
// Add to admin page
<Button onClick={runBackfill}>
  Backfill Customers from Purchases
</Button>
```

---

## 🎯 Expected Results

### **After Running Backfill**

If you have existing purchases, you should see:
- ✅ All course buyers appear in customers list
- ✅ Correct "paying" customer type
- ✅ Total spent accumulated
- ✅ Course name shown as source

### **Stats Will Update**
- Total Customers: ⬆️ (includes course buyers)
- Paying Customers: ⬆️ (course purchases counted)
- Total Revenue: ⬆️ (course revenue included)

---

## 🔧 Other Places Customers Are Created

**Currently Creating Customers:**
1. ✅ Lead magnet submissions (`leadSubmissions.ts`)
2. ✅ Digital product purchases (`customers.ts`)
3. ✅ **NOW: Course purchases** (`library.ts`) ← FIXED

**Should We Add:**
- Subscription purchases?
- Bundle purchases?
- Coaching session bookings?

Let me know if you want me to check/fix those as well!

---

## ✅ Summary

**Problem:** Course purchases weren't creating customer records  
**Impact:** Customers page showed fewer people than expected  
**Fix:** Added customer creation to course enrollment  
**Backfill:** Migration script to fix existing data  
**Status:** ✅ Complete - Future purchases will work automatically  

**Next Action:** Run the backfill migration to populate customers from existing course purchases

---

**Date:** October 19, 2025  
**Status:** ✅ Fixed  
**Testing:** Ready for backfill  
**Linting:** ✅ No errors


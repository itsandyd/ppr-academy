# Customer Tracking System - Complete Guide

## Overview

All users enrolled in your courses or subscribed to your store will now automatically appear in your **Customers** page (`/store/[storeId]/customers`). This guide explains how the system works and how to ensure all your existing students are tracked.

---

## ✅ What's Been Fixed

### 1. **Course Enrollments Create Customer Records**
   - When a user enrolls in a course (paid or free), a customer record is automatically created
   - **Paid courses** → Customer type: "paying"
   - **Free courses** → Customer type: "lead"
   - Tracks: enrollment date, course progress, total spent

### 2. **Subscription Access Creates Customer Records**
   - When a user subscribes to your store/creator profile, they're added as a customer
   - Customer type: "subscription"
   - Tracks: subscription plan, billing info

### 3. **Enhanced Customer Display**
   - Customers page now shows:
     - Which courses they're enrolled in
     - Their progress in each course
     - Which digital products they've purchased
     - Total amount spent
     - Customer type (Lead, Customer, or Subscriber)

---

## 🔄 Backfilling Existing Students

If you have students who enrolled **before this update**, you need to run a one-time backfill to add them to your customer list.

### Option 1: Run via Convex Dashboard (Recommended)

1. Go to your Convex dashboard: https://dashboard.convex.dev
2. Select your project
3. Click on "Functions" in the sidebar
4. Find and run these functions in order:

   **Step 1: Backfill Course Customers**
   ```
   Function: migrations/backfillCourseCustomers:backfillCourseCustomers
   Arguments: {}
   ```
   
   **Step 2: Backfill Subscription Customers**
   ```
   Function: migrations/backfillCourseCustomers:backfillSubscriptionCustomers
   Arguments: {}
   ```

5. Check the logs to see how many customers were created/updated

### Option 2: Run via Convex CLI

```bash
# Make sure you're in the project directory
cd /path/to/ppr-academy

# Run the course customers backfill
npx convex run migrations/backfillCourseCustomers:backfillCourseCustomers

# Run the subscription customers backfill
npx convex run migrations/backfillCourseCustomers:backfillSubscriptionCustomers
```

### Expected Output

The backfill will show:
```
✓ Found X course purchases to process
✓ Backfill complete: Y created, Z updated, 0 errors
```

---

## 📊 Understanding Customer Types

### Lead
- Free course enrollments
- Lead magnet opt-ins
- Newsletter subscribers
- **Total Spent:** $0

### Paying Customer
- Purchased at least one paid course
- Purchased digital products
- **Total Spent:** > $0

### Subscriber
- Active subscription to your store/creator profile
- Gets access to all included courses/products
- Recurring payment
- **Total Spent:** Tracks subscription payments

---

## 🎯 Customer Information Displayed

For each customer, you'll see:

1. **Basic Info**
   - Name and email
   - Avatar with initials
   - Customer type badge

2. **Enrollment Details**
   - List of enrolled courses with progress percentage
   - List of purchased digital products
   - Source of enrollment (which course/product/subscription)

3. **Financial Info**
   - Total amount spent
   - Last activity timestamp
   - Customer status (active/inactive)

4. **Engagement Metrics**
   - Course progress tracking
   - Last accessed time
   - Activity history

---

## 🔍 Filtering & Search

Use the search bar to find customers by:
- Name
- Email
- Course/product name (in the source field)

Use filter chips to refine by:
- Customer type (Lead, Paying, Subscription)
- Date range
- Purchase amount
- Active subscription status

---

## 🛠️ Technical Details

### Customer Record Creation

Customer records are automatically created when:

1. **Course Enrollment** (`createCourseEnrollment` mutation)
   ```typescript
   // Free course → Lead customer
   // Paid course → Paying customer
   ```

2. **Subscription Creation** (`createSubscription` mutation)
   ```typescript
   // Any subscription → Subscription customer
   ```

3. **Digital Product Purchase** (`createPurchase` mutation)
   ```typescript
   // Product purchase → Paying customer
   ```

### Database Schema

The `customers` table includes:
```typescript
{
  name: string,
  email: string,
  storeId: string,
  adminUserId: string,
  type: "lead" | "paying" | "subscription",
  status: "active" | "inactive",
  totalSpent: number,
  lastActivity: number,
  source: string, // Course/product/subscription name
  notes?: string,
  
  // Enhanced fields (returned by query)
  enrolledCourses?: [{
    courseId: Id<"courses">,
    courseTitle: string,
    enrolledAt: number,
    progress: number,
  }],
  purchasedProducts?: [{
    productId: Id<"digitalProducts">,
    productTitle: string,
    purchasedAt: number,
  }]
}
```

---

## 🚨 Troubleshooting

### "My students aren't showing up"

1. **Run the backfill** (see above)
2. Check that courses have a valid `storeId` set
3. Verify users exist in the `users` table
4. Check Convex logs for any error messages

### "Customer count doesn't match enrollment count"

This is expected if:
- Same user enrolled in multiple courses → Shows as 1 customer
- Users enrolled before customer tracking was added → Run backfill
- Test/demo accounts → Can be filtered out

### "Free course students not showing"

- Free course enrollments create "Lead" type customers
- Make sure to filter by "Lead" type or view all customers
- Check that enrollment went through `createCourseEnrollment`

---

## 📈 Future Enhancements

Planned improvements:
- ✅ Show course progress in customer list
- ✅ Display purchased products
- 🔜 Email engagement tracking
- 🔜 Customer lifetime value (CLV) calculation
- 🔜 Customer segmentation and tagging
- 🔜 Automated customer journey emails
- 🔜 Customer detail page with full activity history

---

## 💡 Best Practices

1. **Run backfill after major data imports**
2. **Monitor customer stats in the dashboard**
3. **Use customer notes for personalization**
4. **Tag customers for segmented marketing**
5. **Regularly review inactive customers for re-engagement**

---

## 🎓 Example Use Cases

### Use Case 1: Find All Students in a Specific Course

1. Go to Customers page
2. Search for the course name
3. View list of all enrolled students
4. Check their progress percentages

### Use Case 2: Identify High-Value Customers

1. Sort by "Total Spent"
2. Filter by "Paying" or "Subscription" type
3. Export list for special offers
4. Add notes for personalized outreach

### Use Case 3: Re-engage Inactive Leads

1. Filter by "Lead" type
2. Check "Last Activity" date
3. Send targeted re-engagement email
4. Offer free trial or discount

---

## 📞 Support

If you encounter any issues:

1. Check Convex logs for errors
2. Verify database indexes are up to date
3. Review the code in:
   - `convex/library.ts` (enrollment logic)
   - `convex/customers.ts` (customer queries)
   - `convex/subscriptions.ts` (subscription logic)
   - `convex/migrations/backfillCourseCustomers.ts` (backfill)

---

**Last Updated:** October 22, 2025


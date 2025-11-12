# 🔍 Debugging: Students Not Showing in Customers Page

## Step 1: Run Diagnostic Queries

I've created debug queries to help diagnose the issue. Run these in your Convex dashboard:

### Open Convex Dashboard
1. Go to https://dashboard.convex.dev
2. Select your project
3. Click "Functions" tab

### Run These Debug Queries:

#### Query 1: Check Store Summary
```
Function: debug/checkEnrollments:getStoreCustomerSummary
Arguments: {}
```

**This will show you:**
- All stores in your system
- How many customers each store has
- How many course enrollments each store has
- If there's a mismatch, that's the problem!

#### Query 2: Check Specific Store Enrollments
```
Function: debug/checkEnrollments:checkCourseEnrollments  
Arguments: { "storeId": "YOUR_STORE_ID_HERE" }
```

**Replace `YOUR_STORE_ID_HERE` with your actual store ID**

**This will show:**
- Total enrollments vs total customers
- Sample of enrollments without customer records
- Which users need to be backfilled

#### Query 3: Check Specific User
```
Function: debug/checkEnrollments:checkUserEnrollments
Arguments: { "userId": "USER_CLERK_ID_HERE" }
```

**This will show:**
- If the user exists in the database
- All their enrollments
- All their customer records
- Why they might not be showing up

---

## Step 2: Common Issues & Fixes

### Issue #1: Backfill Not Run ⚠️
**Symptom:** `enrollmentsWithoutCustomers > 0`

**Fix:** Run the backfill scripts:

```bash
# Terminal Option
npx convex run migrations/backfillCourseCustomers:backfillCourseCustomers
npx convex run migrations/backfillCourseCustomers:backfillSubscriptionCustomers
```

OR in Convex Dashboard:
- Function: `migrations/backfillCourseCustomers:backfillCourseCustomers`
- Arguments: `{}`

---

### Issue #2: Wrong Store ID 🏪
**Symptom:** Customers exist but on wrong store

**Check:**
```javascript
// In your courses, what is the storeId?
// It should match the storeId in the customers table
```

**Fix:**
1. Check course records: What `storeId` do they have?
2. Check customer page URL: `/store/[storeId]/customers`
3. Make sure they match!

---

### Issue #3: Users Not in Database 👤
**Symptom:** `userExists: false` when checking user

**Fix:**
- Make sure Clerk webhook is configured
- Users need to be synced from Clerk to Convex
- Check `users` table has records

---

### Issue #4: Course Missing `storeId` 📚
**Symptom:** Purchases exist but with wrong `storeId`

**Fix:** Courses need to have a proper `storeId`. Check your course records:

```javascript
// Each course should have:
{
  storeId: "k1234567890", // Proper store ID
  userId: "user_123...",   // Creator's Clerk ID
  // ... other fields
}
```

---

## Step 3: Quick Check Queries

Run these in your Convex dashboard to get quick answers:

### Count All Enrollments
```javascript
// Query: purchases (table)
// Filter: productType = "course", status = "completed"
```

### Count All Customers
```javascript  
// Query: customers (table)
// Group by: storeId
```

### Check If StoreId Matches
```javascript
// Are the storeIds in purchases the same as in customers?
```

---

## Step 4: Manual Verification

### Check the Database Tables Directly

1. **Go to Convex Dashboard → Data**

2. **Check `purchases` table:**
   - Filter: `productType = "course"`
   - Note the `storeId` values
   - Note the `userId` values

3. **Check `customers` table:**
   - Filter: `storeId = [your store ID]`
   - Count how many records you see

4. **Check `courses` table:**
   - Pick one course that has enrollments
   - What is its `storeId`?
   - What is its `userId`?

---

## Step 5: Force Create a Customer (Test)

Run this to manually test customer creation:

```javascript
// In Convex Dashboard → Functions
// Function: customers:upsertCustomer

{
  "name": "Test Student",
  "email": "test@example.com",
  "storeId": "YOUR_STORE_ID",
  "adminUserId": "YOUR_USER_ID",
  "type": "lead",
  "source": "Manual Test"
}
```

Then check if "Test Student" shows up in your customers page.

---

## Step 6: Common Mistakes

### ❌ Using the wrong storeId in the URL
```
Wrong: /store/user_123abc/customers
Right: /store/k1234567890/customers
```

### ❌ Courses don't have storeId set
```javascript
// Bad:
{ userId: "user_123", storeId: undefined }

// Good:
{ userId: "user_123", storeId: "k1234567890" }
```

### ❌ Email mismatch
```javascript
// Customer record email: "john@gmail.com"
// User record email: "john.doe@gmail.com"
// These won't match! Must be exact.
```

---

## Expected Results After Fixes

After running backfill and fixing any issues, you should see:

```
✅ Store: "My Store"
   - 45 course enrollments
   - 45 customer records
   - 0 enrollments without customers

✅ Customer List Page:
   - Shows all 45 students
   - Each with enrolled course badges
   - Course progress percentages visible
```

---

## Still Having Issues?

### Share These Debug Results:

1. Output from `getStoreCustomerSummary`
2. Output from `checkCourseEnrollments` (with your storeId)
3. Screenshot of your customers page
4. One example userId that should be showing but isn't

### Quick Sanity Checks:

- [ ] Have you run the backfill scripts?
- [ ] Are you looking at the correct store in the URL?
- [ ] Do your courses have a valid `storeId`?
- [ ] Are users synced from Clerk to Convex?
- [ ] Do purchase records exist in the database?

---

## Emergency Fix: Re-run Everything

If all else fails:

```bash
# 1. Run both backfills
npx convex run migrations/backfillCourseCustomers:backfillCourseCustomers
npx convex run migrations/backfillCourseCustomers:backfillSubscriptionCustomers

# 2. Check the logs - should show:
# ✓ X customers created, Y updated

# 3. Refresh your customers page
```

---

**Created:** October 22, 2025  
**Purpose:** Diagnose why enrolled students aren't showing in customers page


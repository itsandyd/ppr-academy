# Course Access Issues - Debugging Guide

**Date**: 2025-11-17  
**Issues**: Users can't access enrolled courses, "Continue Learning" button not working

---

## 🚨 Potential Issues Found

### 1. Enrollment vs Purchase Data Mismatch

**Issue**: Your system has TWO enrollment systems:
- `enrollments` table (legacy)
- `purchases` table (new)

**Code shows**:
```typescript
// userLibrary.ts uses enrollments table
getUserEnrolledCourses → queries "enrollments" table

// library.ts uses purchases table  
verifyCourseAccess → queries "purchases" table
```

**Potential Problem**: User might have a purchase but no enrollment record (or vice versa).

---

### 2. Continue Learning Button Issues

**Found in code**: The "Continue Learning" button does nothing!

```typescript
// app/dashboard/components/LearnModeContent.tsx:212-215
<Button className="...">
  <Play className="w-4 h-4 mr-2" />
  Continue Learning
</Button>
// ⚠️ NO onClick handler - button does nothing!
```

**Same issue in library/page.tsx:254-257**

---

### 3. User ID Confusion

**Issue**: Mixing Clerk IDs and Convex user IDs

```typescript
// Some queries use clerkId (Clerk's user.id)
getUserEnrolledCourses({ userId: convexUser.clerkId })

// Others use Convex user._id
// This could cause mismatches
```

---

### 4. Course Access Verification

**Multiple access check systems**:
- `verifyCourseAccess` (library.ts)
- `checkResourceAccess` (accessControl.ts)
- `checkSubscriptionAccess` (subscriptions.ts)

**Potential conflicts** between these systems.

---

## 🔍 Debugging Steps

### Step 1: Check User's Enrollment Data

Add this to your Convex dashboard or create a debug function:

```typescript
// Debug function to check user's enrollment status
export const debugUserEnrollments = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    // Check enrollments table
    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("by_userId", (q) => q.eq("userId", args.clerkId))
      .collect();

    // Check purchases table
    const purchases = await ctx.db
      .query("purchases")
      .withIndex("by_userId", (q) => q.eq("userId", args.clerkId))
      .filter((q) => q.eq(q.field("productType"), "course"))
      .collect();

    return {
      clerkId: args.clerkId,
      enrollmentCount: enrollments.length,
      enrollments: enrollments.map(e => ({
        courseId: e.courseId,
        progress: e.progress,
        createdAt: e._creationTime,
      })),
      purchaseCount: purchases.length,
      purchases: purchases.map(p => ({
        courseId: p.courseId,
        status: p.status,
        amount: p.amount,
        createdAt: p._creationTime,
      })),
    };
  },
});
```

### Step 2: Fix Continue Learning Button

The button needs to actually do something:

```typescript
// In LearnModeContent.tsx
<Button 
  className="..."
  onClick={() => {
    // Find user's most recent course
    const recentCourse = enrolledCourses?.[0];
    if (recentCourse?.slug) {
      window.location.href = `/dashboard/courses/${recentCourse.slug}`;
    } else {
      window.location.href = '/dashboard/courses?mode=learn';
    }
  }}
>
  <Play className="w-4 h-4 mr-2" />
  Continue Learning
</Button>
```

### Step 3: Check Course Slug Issues

**Potential problem**: Course slugs might be missing or malformed.

```typescript
// Check if course has valid slug
const course = await ctx.db.get(courseId);
if (!course.slug) {
  // Course missing slug - would cause 404s
}
```

---

## 🛠️ Immediate Fixes Needed

### Fix 1: Continue Learning Button

**Problem**: Button does nothing  
**Fix**: Add onClick handler to navigate to recent course

### Fix 2: Enrollment Data Sync

**Problem**: Enrollment vs Purchase mismatch  
**Fix**: Ensure both tables are in sync

### Fix 3: User ID Consistency

**Problem**: Mixing Clerk ID and Convex user ID  
**Fix**: Use consistent ID type throughout

---

## 🧪 Quick Tests to Run

1. **Check user's enrollment data**:
   - Run debug query with user's Clerk ID
   - Verify they have both enrollment AND purchase records

2. **Test Continue Learning button**:
   - Click button in library or dashboard
   - Should navigate to most recent course

3. **Test course access**:
   - Navigate directly to course URL
   - Verify enrollment check works

---

## 💡 Recommended Actions

1. **Immediate**: Fix Continue Learning button (5 min)
2. **Debug**: Check specific user's enrollment data
3. **Sync**: Ensure enrollment and purchase tables match
4. **Test**: Verify course access flow end-to-end

**Want me to implement these fixes?** 🔧

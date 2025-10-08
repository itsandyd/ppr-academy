# PPR Academy - User Journey Analysis

*Generated using Nia MCP Codebase Search*

## 📊 Executive Summary

After analyzing the PPR Academy codebase and comparing it with similar LMS platforms (ClassroomIO, LearnHouse, and Frappe LMS), here's the assessment of your current user journey and landing page strategy.

**Key Finding:** Your current root landing page (`/`) is **partially appropriate** but has some UX gaps that could confuse users. The platform needs clearer role differentiation and onboarding flows.

---

## 🎯 Current User Journey Map

### 1. **Landing Page (Root `/`)**
**Current State:**
- Marketing-focused landing page with multiple sections:
  - Hero section
  - Social proof
  - Dashboard showcase
  - Feature grid
  - Integrations
  - Pricing
  - Results gallery
  - Trustpilot reviews
  - Comparison checklist
  - Final CTA

**User Types Addressed:**
- Primarily targets **creators** (producers, DJs, artists)
- Implicitly addresses students/customers through course discovery
- No clear differentiation of user paths

**Files Analyzed:**
- `app/page.tsx`
- `app/_components/` (14 landing page components)

---

### 2. **Sign-Up Flow**

#### Current Implementation
```
Landing Page → Sign Up → ??? → Store Setup or Dashboard
```

**Analysis from Codebase:**

**`app/sign-up/[[...sign-up]]/page.tsx`:**
- Uses Clerk authentication
- Generic messaging: "Join PPR Academy and start learning"
- **Issue:** Doesn't clarify if user is signing up to:
  - Buy/enroll in courses (Student)
  - Create and sell content (Creator)

**Post-Sign-Up Redirect Logic:**

From `app/sign-in/[[...sign-in]]/page.tsx`:
```typescript
redirectUrl={searchParams.redirect_url || "/dashboard"}
```

From `app/(dashboard)/store/setup/page.tsx`:
```typescript
// If user already has stores, redirect to their first store
useEffect(() => {
  if (stores && stores.length > 0) {
    const firstStoreId = stores[0]._id;
    router.replace(`/store/${firstStoreId}/products`);
  }
}, [stores, router]);
```

**Flow:**
1. User signs up
2. Redirected to `/dashboard` (default)
3. If no store exists → Shows `StoreSetupWizard`
4. If store exists → Redirected to `/store/[storeId]/products`

**Problem:** No clear distinction between:
- Users who want to **buy** courses/products (students/customers)
- Users who want to **sell** courses/products (creators)

---

### 3. **Two Distinct User Paths**

#### Path A: Student/Customer Journey
**Intent:** Enroll in courses, buy digital products

**Current Flow:**
```
1. Landing Page → Browse Storefronts (e.g., /[slug])
2. Discover courses/products on creator storefronts
3. Click "Enroll Now" or "Get Access"
4. Course Checkout Page (/courses/[slug]/checkout)
5. Enter customer info (name, email)
6. Pay via Stripe (if paid) or free enrollment
7. Redirect to Library (/library)
8. Access course content
```

**Key Files:**
- `app/[slug]/page.tsx` - Creator storefronts
- `app/courses/[slug]/checkout/components/CourseCheckout.tsx`
- `convex/library.ts` - `createCourseEnrollment` mutation
- `app/library/page.tsx` - Student's course library

**Strengths:**
- Clear storefront experience
- Good product filtering and search
- Smooth checkout flow
- Free course support

**Weaknesses:**
- No dedicated course marketplace/browse page
- Students must know creator's storefront URL
- No discovery mechanism for new students
- Library page is only accessible after enrollment

---

#### Path B: Creator Journey
**Intent:** Create store, sell courses/products

**Current Flow:**
```
1. Landing Page → Sign Up
2. Redirected to Store Setup (/store/setup)
3. Create store with StoreSetupWizard
4. Dashboard with tabs:
   - Student (view enrolled courses)
   - Creator (manage products/courses)
   - Coach (coaching services)
   - Account (settings)
5. Create products/courses
6. Share storefront link ([slug])
```

**Key Files:**
- `app/(dashboard)/store/setup/page.tsx`
- `components/dashboard/store-setup-wizard.tsx`
- `components/dashboard/unified-dashboard.tsx`
- `components/dashboard/creator-dashboard-content.tsx`

**Strengths:**
- Comprehensive creator dashboard
- Multiple product types (courses, digital products, coaching)
- Store management tools
- Analytics and monetization features

**Weaknesses:**
- No onboarding flow asking user intent
- All users forced into store creation
- Students who just want to learn must create a store
- Dashboard is complex for simple student use cases

---

## 🔍 Comparison with Best-in-Class LMS Platforms

### 1. **ClassroomIO** (Analyzed via Nia MCP)

**Approach:**
- **Subdomain-based separation**: `app.classroomio.com` (admin) vs `org.classroomio.com` (LMS)
- **Role-based auto-redirect**: Students automatically redirected to LMS
- **Clear role assignment**: Users are assigned STUDENT or TEACHER role on signup

**Key Insight:**
```typescript
if (isStudentAccount) {
  console.log('Student logged into dashboard');
  window.location.replace(`${currentOrgDomainStore}/lms`);
}
```

Students **never** see the admin dashboard - automatic redirect to LMS.

**Lessons for PPR Academy:**
- Separate student and creator experiences
- Auto-detect user intent based on first action
- Redirect accordingly

---

### 2. **LearnHouse** (Analyzed via Nia MCP)

**Approach:**
- All users start as **"User" role** (basic learner)
- Promotion to Instructor is **admin-controlled** post-signup
- No self-service role selection during registration

**Role Hierarchy:**
1. Admin (full access)
2. Maintainer (manage courses & users)
3. Instructor (create own courses)
4. User (read-only learner)

**Key Code:**
```python
user_organization = UserOrganization(
    user_id=user.id,
    org_id=int(org_id),
    role_id=4,  # Automatically "User" role
)
```

**Lessons for PPR Academy:**
- Default to student role for new users
- Allow creators to self-promote via onboarding flow
- Separate permissions for learning vs teaching

---

### 3. **Frappe LMS** (Analyzed via Nia MCP)

**Approach:**
- **Combined homepage** for dual-role users
- Dynamic content based on enrollment and instructor status
- Shows both "courses I'm taking" and "courses I'm teaching"

**Homepage Features:**
- Personalized greeting with learning streak
- Upcoming live classes
- Course cards with progress tracking
- Recently published courses

**Key Insight:**
Users see a unified experience but content adapts based on:
- Enrollment records (student view)
- Instructor checks (teacher view)

**Lessons for PPR Academy:**
- Support dual-role users in single dashboard
- Use tab-based interface (already implemented!)
- Show relevant content per role

---

## 🎨 Current State Analysis

### ✅ What's Working Well

1. **Beautiful Landing Page**
   - Professional design
   - Clear value proposition for creators
   - Strong social proof elements

2. **Powerful Creator Dashboard**
   - Unified dashboard with tabs (Student, Creator, Coach, Account)
   - Comprehensive product management
   - Analytics and monetization features

3. **Smooth Checkout Experience**
   - Clean course checkout flow
   - Stripe integration
   - Free course support

4. **Storefront System**
   - Individual creator storefronts (`/[slug]`)
   - Good filtering and search
   - Product variety (courses, digital products, coaching)

---

### ⚠️ Current UX Gaps

#### Gap 1: **Unclear User Intent on Landing**
**Problem:** Landing page doesn't clearly ask:
- "Are you here to learn or to teach?"
- "Do you want to buy courses or sell courses?"

**Impact:**
- All users funneled into creator onboarding
- Students forced to create stores
- Confusion about platform purpose

**Example from Landing:**
- CTA: "Start Your Storefront Free" (creator-focused)
- No CTA for "Browse Courses" or "Start Learning" (student-focused)

---

#### Gap 2: **No Course Discovery for Students**
**Problem:** No central marketplace or course browse page

**Current Reality:**
- Students must know creator's storefront URL
- No `/courses` browse page
- No search across all courses
- Discovery limited to social media links

**Missing:**
- `/courses` - Browse all courses
- `/marketplace` - All products across creators
- Search and filter functionality
- Categories and tags

---

#### Gap 3: **Forced Store Creation**
**Problem:** All authenticated users pushed toward store setup

**From `app/(dashboard)/store/setup/page.tsx`:**
```typescript
// If user has stores, show loading while redirecting
if (stores && stores.length > 0) {
  return <div>Redirecting to your store...</div>
}

// Show store setup wizard if no stores exist
return <StoreSetupWizard />
```

**Impact:**
- Students who just want to learn must create a store
- Extra friction in student onboarding
- Confusing for non-creator users

---

#### Gap 4: **Library Requires Enrollment**
**Problem:** Library page only shows enrolled courses

**From `app/library/page.tsx`:**
- Shows courses user has purchased
- No browse/discovery feature
- No recommended courses
- No "get started" flow for new users

---

#### Gap 5: **Dashboard Complexity for Students**
**Problem:** Unified dashboard shows creator tabs even for pure students

**From `components/dashboard/unified-dashboard.tsx`:**
```typescript
<TabsList className="grid w-full grid-cols-4">
  <TabsTrigger value="student">Student</TabsTrigger>
  <TabsTrigger value="creator">Creator</TabsTrigger>
  <TabsTrigger value="coach">Coach</TabsTrigger>
  <TabsTrigger value="account">Account</TabsTrigger>
</TabsList>
```

**Impact:**
- Overwhelming for students who only want to learn
- Cognitive load from unused features
- Unclear primary action

---

## 💡 Recommendations

### Option 1: **Two-Path Landing Page** (Recommended)

**Approach:** Keep current landing page but add clear role selection

**Implementation:**
```
Landing Page
├─ Hero Section
│  ├─ Primary CTA: "Start Creating" (for creators)
│  └─ Secondary CTA: "Browse Courses" (for students)
│
├─ Path A: Student Journey
│  └─ Browse Courses → Enroll → Library
│
└─ Path B: Creator Journey
   └─ Sign Up → Store Setup → Dashboard
```

**New Pages Needed:**
1. `/courses` or `/marketplace` - Browse all published courses
2. `/onboarding` - Ask user intent after sign-up
3. Improve `/library` to show recommended courses when empty

**Landing Page Updates:**
- Add "Browse Courses" CTA in hero
- Create "Browse as Student" link in navigation
- Maintain creator focus but acknowledge both audiences

**Code Changes:**

**`app/page.tsx`** - Add dual CTAs:
```tsx
<div className="flex gap-4">
  <Button size="lg" asChild>
    <Link href="/courses">Browse Courses</Link>
  </Button>
  <Button size="lg" variant="outline" asChild>
    <Link href="/sign-up?intent=creator">Start Creating</Link>
  </Button>
</div>
```

**New `app/courses/page.tsx`** - Public course marketplace:
```tsx
export default function CoursesMarketplace() {
  // Show all published courses across all creators
  // Filter by category, price, rating
  // Search functionality
  // No authentication required
}
```

**`app/onboarding/page.tsx`** - Post-signup role selection:
```tsx
export default function OnboardingPage() {
  return (
    <div>
      <h1>Welcome to PPR Academy!</h1>
      <p>What brings you here today?</p>
      
      <Card onClick={() => handleRoleSelection('student')}>
        <h2>I want to learn</h2>
        <p>Browse courses and start learning</p>
      </Card>
      
      <Card onClick={() => handleRoleSelection('creator')}>
        <h2>I want to teach</h2>
        <p>Create courses and build your brand</p>
      </Card>
    </div>
  )
}
```

**Middleware update** - `middleware.ts`:
```typescript
// Redirect authenticated users without intent
if (isAuthenticated && !hasCompletedOnboarding) {
  return NextResponse.redirect('/onboarding')
}
```

---

### Option 2: **Separate Landing Pages** (Alternative)

**Approach:** Create distinct landing pages for each audience

**Structure:**
```
/ (root)
├─ /creators → Creator-focused landing
│  └─ Sign Up → Store Setup → Dashboard
│
└─ /students or /learn → Student-focused landing
   └─ Browse → Enroll → Library
```

**Pros:**
- Highly targeted messaging
- Clearer value propositions per audience
- Better conversion rates

**Cons:**
- Harder to discover alternate path
- More pages to maintain
- Split traffic

---

### Option 3: **Dynamic Landing Based on Auth State** (Advanced)

**Approach:** Show different landing based on user status

**Logic:**
```typescript
export default function LandingPage() {
  const { user } = useUser()
  
  if (!user) {
    return <MarketingLandingPage /> // Current page
  }
  
  const hasStore = userHasStore(user)
  
  if (hasStore) {
    return <CreatorDashboard />
  } else {
    return <StudentDashboard /> // Library + course browse
  }
}
```

**Pros:**
- Personalized experience
- No unnecessary navigation
- Smooth authenticated experience

**Cons:**
- Complex logic
- Requires careful state management
- May confuse dual-role users

---

## 🚀 Recommended Implementation Plan

### Phase 1: **Immediate Improvements** (1-2 days)

1. **Add Course Marketplace**
   - Create `/courses/page.tsx` - public browse page
   - Show all published courses across creators
   - Basic filtering (category, price)
   - No authentication required

2. **Update Landing Page CTAs**
   - Add "Browse Courses" button in hero
   - Make navigation clearer for students
   - Add "Learn" vs "Teach" distinction

3. **Improve Empty Library State**
   - Show recommended courses when user has no enrollments
   - Add "Browse More Courses" CTA
   - Display featured creators

### Phase 2: **Onboarding Flow** (3-5 days)

1. **Create `/onboarding` page**
   - Ask user intent after sign-up
   - Two clear paths: "Learn" vs "Create"
   - Store selection in Convex user profile

2. **Update Sign-Up Flow**
   - Pass intent parameter: `/sign-up?intent=creator`
   - Use URL param to pre-select onboarding path
   - Skip onboarding if intent is clear

3. **Smart Dashboard Routing**
   - Students → Library by default
   - Creators → Store dashboard by default
   - Allow role switching via tabs

### Phase 3: **Discovery Features** (1 week)

1. **Search Functionality**
   - Global search across courses
   - Filter by creator, category, price
   - Tag-based discovery

2. **Recommendation Engine**
   - Based on enrollment history
   - Similar courses
   - Popular in category

3. **Featured Creators**
   - Showcase top creators
   - Creator profiles
   - Social proof

### Phase 4: **Advanced Personalization** (2+ weeks)

1. **Learning Paths**
   - Curated course sequences
   - Skill-based progression
   - Certificates

2. **Creator Marketplace**
   - Unified product discovery
   - Cross-creator bundles
   - Affiliate system integration

3. **Community Features**
   - Course discussions
   - Creator communities
   - Student forums

---

## 📋 Quick Wins Checklist

✅ **Do Now:**
- [ ] Create `/courses` marketplace page
- [ ] Add "Browse Courses" CTA to landing page
- [ ] Update sign-up copy to mention both paths
- [ ] Add "Get Started" flow for new students in library

✅ **Do Next:**
- [ ] Build onboarding flow with intent selection
- [ ] Update middleware to handle user intent
- [ ] Create student-focused landing page section
- [ ] Add course recommendations to library

✅ **Do Later:**
- [ ] Build advanced search
- [ ] Implement learning paths
- [ ] Add community features
- [ ] Create analytics dashboard

---

## 🎯 Conclusion

**Is your current root landing page right?**

**Yes, with modifications.** Your landing page is well-designed and professional, but it needs clearer role differentiation. The platform should:

1. **Acknowledge both audiences** (students and creators) on the landing page
2. **Provide clear paths** for each user type
3. **Add a course marketplace** for student discovery
4. **Implement onboarding** to capture user intent
5. **Smart routing** based on user role and intent

**Key Insight from Nia Analysis:**
- ClassroomIO: Separates admin and student experiences completely
- LearnHouse: Defaults to student role, requires admin promotion for creators
- Frappe LMS: Shows unified experience with dynamic content

**PPR Academy's Unique Position:**
You're a **creator-first platform** (like Teachable or Kajabi) rather than a traditional LMS. This means:
- Primary audience: Creators/teachers
- Secondary audience: Students/customers
- Landing page should reflect this hierarchy

**Recommendation:** Keep creator focus but add clear student discovery paths. Think of it like Etsy:
- Sellers get the tools and dashboard
- Buyers get the marketplace and search
- Both coexist seamlessly

---

## 🔗 Related Documentation

- `CREATOR_MARKETPLACE_PIVOT.md` - Marketplace strategy
- `DASHBOARD_SETUP.md` - Dashboard configuration
- `CLERK_SETUP_INSTRUCTIONS.md` - Authentication flow
- `COMPREHENSIVE_IMPROVEMENT_PLAN.md` - Overall roadmap

---

*Generated using Nia MCP by searching:*
- ClassroomIO codebase
- LearnHouse codebase  
- Frappe LMS codebase
- PPR Academy codebase (local analysis)

*Last Updated: October 8, 2025*



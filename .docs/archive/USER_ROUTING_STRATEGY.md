# User Routing Strategy

## 🎯 Current Pages Analysis

### 1. **`/` (Root)** - Marketplace Homepage
- **Current Use:** Public marketplace showing all courses, products, sample packs
- **Audience:** Everyone (signed in or not)
- **Purpose:** Discovery, browsing, search
- **Should redirect after login?** NO - keep as public discovery page

### 2. **`/home`** - Creator Dashboard
- **Current Use:** Creator dashboard with CreatorDashboardContent
- **Audience:** Content creators
- **Purpose:** Overview of creator's business (sales, students, courses)
- **Should be accessed by:** Creators only

### 3. **`/library`** - Student Library
- **Current Use:** Student's personal learning hub
- **Audience:** Students/learners
- **Purpose:** View enrolled courses, track progress, certificates
- **Should be accessed by:** Students only

### 4. **`/store`** - Store Dashboard (Creator)
- **Current Use:** Creator's store management (CreatorDashboardEnhanced)
- **Audience:** Content creators
- **Purpose:** Manage store, products, courses
- **Should be accessed by:** Creators only
- **Note:** Requires store to exist (StoreRequiredGuard)

### 5. **`/olddashboard`** - Old Dashboard
- **Current Use:** NOT BEING USED
- **Audience:** Both students and creators (unified)
- **Purpose:** Old implementation with server-side rendering
- **Should be:** DEPRECATED and removed OR repurposed

---

## 🚨 Problems

1. **No clear post-login redirect**
   - Students sign in → stay on `/` (should go to `/library`)
   - Creators sign in → stay on `/` (should go to `/home` or `/store`)

2. **`/olddashboard` is unused**
   - Dead code cluttering the codebase
   - Uses old patterns (server components, different data fetching)

3. **Confusing home vs store**
   - `/home` = creator dashboard (overview)
   - `/store` = store management (detailed)
   - When should creators use which?

4. **No user type detection**
   - System doesn't know if user is student or creator
   - No automatic routing based on role

---

## ✅ Recommended Solution

### Phase 1: Clear User Type Detection

Add a `userType` field to users:
- `"student"` - Only enrolls in courses
- `"creator"` - Creates and sells content
- `"both"` - Both student and creator (most common)

### Phase 2: Smart Post-Login Redirect

Create a `/dashboard` redirect page that routes users:

```
User signs in
↓
Check user type & preferences
↓
Student → /library
Creator → /home
Both → /home (with library link in nav)
No history → /library (first-time users start as students)
```

### Phase 3: Navigation Updates

**For Students:**
- Primary nav: Browse (/) | Library | Courses | Products

**For Creators:**
- Primary nav: Browse (/) | Dashboard (/home) | Store (/store) | Library
- Dashboard = high-level overview
- Store = detailed management

**For Both:**
- Show all links, highlight based on context

---

## 📋 Detailed Page Purposes

### `/` - Public Marketplace (KEEP AS-IS)
**Who:** Everyone
**When:** Discovery, browsing before/after sign-in
**Content:**
- Search all courses/products/sample packs
- Featured content
- Platform stats
- Marketing sections
- CTAs for both students and creators

**Navigation:**
- [Browse] [Courses] [Products] [Sample Packs] [Pricing] [Sign In/Up]

---

### `/library` - Student Hub (STUDENT PRIMARY)
**Who:** Signed-in students
**When:** After enrolling in courses, checking progress
**Content:**
- Enrolled courses with progress
- Certificates earned
- Recent activity
- Recommendations based on progress
- Quick actions (continue learning, schedule study time)

**Navigation:**
- [Browse] [Library] [Store (if creator)] [Profile]

**Should redirect to `/` if:** User not signed in

---

### `/home` - Creator Dashboard (CREATOR PRIMARY)
**Who:** Signed-in creators
**When:** Checking business overview, analytics
**Content:**
- Revenue overview
- Student count
- Course performance
- Recent sales
- Quick actions (create course, view analytics)

**Navigation:**
- [Browse] [Dashboard] [Store] [Library] [Profile]

**Should redirect to:** `/` if user not signed in, `/store-setup` if no store exists

---

### `/store` - Store Management (CREATOR DETAILED)
**Who:** Signed-in creators with existing store
**When:** Managing products, courses, store settings
**Content:**
- Store settings (name, description, branding)
- Product/course management (create, edit, delete)
- Order management
- Detailed analytics

**Navigation:**
- [Dashboard] [Products] [Courses] [Orders] [Analytics] [Settings]

**Should redirect to:** `/store-setup` if no store exists

---

### `/dashboard` - Smart Redirect (NEW)
**Who:** Signed-in users
**When:** After sign-in or clicking "Dashboard"
**Logic:**
```typescript
if (!user) redirect("/")
if (user.hasStore) redirect("/home") // Creator
if (user.enrollments.length > 0) redirect("/library") // Student with courses
else redirect("/library") // New student
```

---

## 🔧 Implementation Plan

### Step 1: Create `/dashboard` redirect
```typescript
// app/dashboard/page.tsx
export default function DashboardRedirect() {
  const { user } = useUser();
  const convexUser = useQuery(api.users.getUserFromClerk, ...);
  const userStore = useQuery(api.stores.getUserStore, ...);
  
  useEffect(() => {
    if (!user) {
      router.push("/");
    } else if (userStore) {
      router.push("/home"); // Has store = creator
    } else {
      router.push("/library"); // No store = student
    }
  }, [user, userStore]);
  
  return <LoadingSpinner />;
}
```

### Step 2: Update Clerk redirects
```typescript
// app/sign-in/[[...sign-in]]/page.tsx
<SignIn 
  afterSignInUrl="/dashboard"
  afterSignUpUrl="/dashboard"
/>

// app/sign-up/[[...sign-up]]/page.tsx
<SignUp 
  afterSignInUrl="/dashboard"
  afterSignUpUrl="/dashboard?new=true"
/>
```

### Step 3: Update navigation
- Students see: [Browse] [Library] [Profile]
- Creators see: [Browse] [Dashboard] [Store] [Library] [Profile]
- Detect via `userStore` existence

### Step 4: Remove `/olddashboard`
```bash
rm -rf app/olddashboard
rm lib/data.ts # If only used by olddashboard
```

### Step 5: Add user type badges
- In profile: "Student" or "Creator" badge
- Allow switching (become a creator)

---

## 🎨 Visual User Journeys

### Student Journey
```
1. Land on / (marketplace)
2. Browse courses
3. Click course → view details
4. Sign up → /dashboard → /library
5. Purchase course → appears in /library
6. Click "Continue Learning" → /courses/[slug]
7. Complete course → certificate in /library
```

### Creator Journey
```
1. Land on / (marketplace)
2. Click "Become a Creator" CTA
3. Sign up with ?intent=creator → /dashboard → /store-setup
4. Create store
5. Redirected to /home (creator dashboard)
6. Click "Create Course" → /store/courses/new
7. Publish course → appears on /
8. Check sales in /home dashboard
9. Manage details in /store
```

### Hybrid (Both) Journey
```
1. Start as student → /library
2. Click "Become a Creator" → /store-setup
3. Now see both nav items
4. /home for creator business
5. /library for personal learning
```

---

## 📊 Page Access Matrix

| Page | Unauthenticated | Student | Creator | Both |
|------|----------------|---------|---------|------|
| `/` | ✅ Browse | ✅ Browse | ✅ Browse | ✅ Browse |
| `/library` | ❌ Redirect to `/` | ✅ Primary | ➡️ Secondary | ✅ Learning |
| `/home` | ❌ Redirect to `/` | ❌ No access | ✅ Primary | ✅ Business |
| `/store` | ❌ Redirect to `/` | ❌ No access | ✅ Manage | ✅ Manage |
| `/dashboard` | ❌ Redirect to `/` | ➡️ to `/library` | ➡️ to `/home` | ➡️ to `/home` |

---

## 🚀 Quick Wins (Do These First)

### 1. Delete `/olddashboard` (1 min)
```bash
git rm -r app/olddashboard
```

### 2. Update hero CTAs to use `/dashboard` (5 min)
```typescript
// app/_components/marketplace-hero.tsx
// Change all /home links to /dashboard
<Link href="/dashboard">Go to Dashboard</Link>
```

### 3. Update Clerk after-sign-in URL (2 min)
```typescript
// middleware.ts or sign-in page
afterSignInUrl="/dashboard"
```

### 4. Create `/dashboard` smart redirect (15 min)
See Step 1 above

---

## 🎯 Final State

### Unauthenticated User
- Sees: `/` (marketplace homepage)
- Can: Browse, search, view details
- CTAs: "Sign Up" → `/dashboard` → routed to `/library` or `/home`

### Student
- Primary page: `/library` (their enrolled courses)
- Can access: `/` (browse more courses)
- Navigation: [Browse] [Library] [Profile]
- CTA: "Become a Creator" → `/store-setup`

### Creator
- Primary page: `/home` (business overview)
- Secondary page: `/store` (detailed management)
- Can access: `/` (browse marketplace), `/library` (their own learning)
- Navigation: [Browse] [Dashboard] [Store] [Library] [Profile]

### Both (Student + Creator)
- Primary page: `/home` (business first)
- Can access: Everything
- Navigation: [Browse] [Dashboard] [Store] [Library] [Profile]

---

## 💡 Naming Clarity

To avoid confusion, consider renaming:

| Current | Better Name | Reason |
|---------|-------------|--------|
| `/home` | `/dashboard` or `/creator` | "Home" is ambiguous |
| `/store` | `/manage` or `/store-settings` | Clear it's management |
| `/library` | `/learning` or `/my-courses` | More descriptive |

**OR** keep current names but add clear descriptions in nav:
- Dashboard (Creator Overview)
- Store (Manage Content)
- Library (My Learning)

---

*Let me know which approach you prefer and I'll implement it!*


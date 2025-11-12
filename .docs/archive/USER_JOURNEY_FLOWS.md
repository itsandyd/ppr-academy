# PPR Academy - User Journey Flows

## 📍 Current State vs. Proposed State

### 🔴 CURRENT STATE (Before Changes)

```
┌─────────────────────────────────────────────────────────────────┐
│                        LANDING PAGE (/)                          │
│                                                                  │
│  • Hero with "Start Your Storefront Free" CTA                   │
│  • All content focused on creators                               │
│  • No clear path for students/learners                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
         ┌───────────────────────────────┐
         │      SIGN UP / SIGN IN        │
         │                               │
         │  Generic: "Join PPR Academy"  │
         └───────────┬───────────────────┘
                     │
                     ↓
         ┌───────────────────────────────┐
         │   AUTOMATIC REDIRECT TO       │
         │   /store/setup or /dashboard  │
         │                               │
         │   ⚠️ PROBLEM: No intent       │
         │   All users pushed to         │
         │   store creation              │
         └───────────┬───────────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
          ↓                     ↓
┌─────────────────┐   ┌─────────────────┐
│ Has Store?      │   │ No Store?       │
│ → Store         │   │ → Store Setup   │
│   Dashboard     │   │   Wizard        │
└─────────────────┘   └─────────────────┘

🔴 ISSUES:
• Students forced to create stores
• No course discovery page
• Unclear value for learners
• High friction for non-creators
```

---

### 🟢 PROPOSED STATE (After Phase 1 Changes)

```
┌─────────────────────────────────────────────────────────────────┐
│                        LANDING PAGE (/)                          │
│                                                                  │
│  • Hero with TWO clear CTAs:                                     │
│    1. "Start Creating" → /sign-up?intent=creator                 │
│    2. "Browse Courses" → /courses                                │
│                                                                  │
│  • Navigation includes "Courses" link                            │
│  • Clear messaging for both audiences                            │
└─────────────┬────────────────────────────┬──────────────────────┘
              │                            │
              ↓                            ↓
    ┌─────────────────┐        ┌─────────────────────┐
    │   CREATOR PATH  │        │   STUDENT PATH      │
    └─────────┬───────┘        └──────────┬──────────┘
              │                           │
              ↓                           ↓
```

#### 🎨 CREATOR PATH (Left Branch)

```
┌────────────────────────────────────┐
│  SIGN UP (/sign-up?intent=creator) │
│                                    │
│  "Join thousands of creators       │
│   sharing their knowledge"         │
└──────────────┬─────────────────────┘
               │
               ↓
┌────────────────────────────────────┐
│  STORE SETUP WIZARD                │
│                                    │
│  • Create store name               │
│  • Choose URL slug                 │
│  • Set up profile                  │
└──────────────┬─────────────────────┘
               │
               ↓
┌────────────────────────────────────┐
│  CREATOR DASHBOARD                 │
│                                    │
│  Tabs:                             │
│  • Student (view enrolled)         │
│  • Creator (manage products) ⭐    │
│  • Coach (coaching services)       │
│  • Account (settings)              │
│                                    │
│  Quick Actions:                    │
│  • Create Course                   │
│  • Add Product                     │
│  • View Analytics                  │
└────────────────────────────────────┘
```

#### 🎓 STUDENT PATH (Right Branch)

```
┌────────────────────────────────────┐
│  COURSE MARKETPLACE (/courses)     │
│  ✨ NEW PAGE                        │
│                                    │
│  • Browse all published courses    │
│  • Search & filter                 │
│  • Categories                      │
│  • Price filters (free/paid)       │
│  • No auth required                │
└──────────────┬─────────────────────┘
               │
               ↓
┌────────────────────────────────────┐
│  COURSE DETAIL PAGE                │
│  (/courses/[slug])                 │
│                                    │
│  • Course overview                 │
│  • Curriculum preview              │
│  • Creator info                    │
│  • "Enroll Now" CTA                │
└──────────────┬─────────────────────┘
               │
               ↓
┌────────────────────────────────────┐
│  COURSE CHECKOUT                   │
│  (/courses/[slug]/checkout)        │
│                                    │
│  • Enter name & email              │
│  • Payment (Stripe) or Free        │
│  • Create enrollment               │
└──────────────┬─────────────────────┘
               │
               ↓
┌────────────────────────────────────┐
│  LIBRARY (/library)                │
│  ✨ IMPROVED                        │
│                                    │
│  Has Enrollments:                  │
│  • My Courses grid                 │
│  • Progress tracking               │
│  • Continue Learning               │
│                                    │
│  Empty State:                      │
│  • Featured courses                │
│  • "Browse All Courses" CTA        │
│  • Category quick links            │
└────────────────────────────────────┘
```

---

## 🔄 User Flow Comparison

### Before: Single Path (Confusing)

```
All Users → Landing → Sign Up → Store Setup ❌
                                    ↓
                          (Students confused here)
```

### After: Dual Path (Clear)

```
           ┌─ Landing ─┐
           │           │
     ┌─────┴───┐   ┌───┴──────┐
     │ Creator │   │ Student  │
     └────┬────┘   └───┬──────┘
          │            │
    Store Setup    /courses ✅
```

---

## 🎯 Key User Scenarios

### Scenario 1: "I want to learn music production"

**Before (❌ Confusing):**
```
1. Land on homepage → See "Start Your Storefront" → Confused
2. Sign up anyway
3. Forced to create a store
4. Don't know where to find courses
5. ❌ High drop-off rate
```

**After (✅ Clear):**
```
1. Land on homepage → See "Browse Courses" → Click
2. Browse course marketplace
3. Find interesting course
4. Click "Enroll Now"
5. Sign up during checkout
6. Complete enrollment
7. Access course in Library
8. ✅ Smooth experience
```

---

### Scenario 2: "I want to sell my sample packs"

**Before (✅ Already good):**
```
1. Land on homepage
2. See "Start Your Storefront Free"
3. Sign up
4. Complete store setup
5. Create products
6. Share storefront link
7. ✅ Works well
```

**After (✅ Even better):**
```
1. Land on homepage
2. See "Start Creating" with clear messaging
3. Sign up with intent=creator
4. Get creator-specific onboarding copy
5. Complete store setup
6. Create products
7. Courses appear in /courses marketplace automatically
8. ✅ More visibility + better UX
```

---

### Scenario 3: "I want to both learn and teach"

**Before (⚠️ Works but unclear):**
```
1. Sign up → Create store
2. Teach courses from dashboard
3. Find other courses... where?
4. ⚠️ No clear path to discover other creators' courses
```

**After (✅ Clear dual path):**
```
1. Sign up as creator → Create store
2. Dashboard tabs: Student | Creator | Coach
3. Student tab → Empty state → "Browse Courses"
4. Creator tab → Manage my courses
5. Browse /courses marketplace anytime
6. Enroll in others' courses → Shows in Student tab
7. ✅ Both roles supported seamlessly
```

---

## 📊 Page Responsibilities Matrix

| Page | Purpose | Auth Required | User Type |
|------|---------|---------------|-----------|
| `/` (Landing) | Marketing, CTAs, value prop | ❌ No | Both |
| `/courses` | Browse all courses | ❌ No | Students |
| `/[slug]` | Creator storefronts | ❌ No | Students |
| `/courses/[slug]` | Course details | ❌ No | Students |
| `/courses/[slug]/checkout` | Purchase/enroll | ⚠️ During checkout | Students |
| `/library` | My enrolled courses | ✅ Yes | Students |
| `/sign-up` | Create account | ❌ No | Both |
| `/store/setup` | Create store | ✅ Yes | Creators |
| `/store/[storeId]/*` | Manage store/products | ✅ Yes | Creators |
| `/dashboard` or `/home` | Unified dashboard | ✅ Yes | Both |

---

## 🎨 Navigation Structure

### Public Navigation (Not Logged In)

```
┌──────────────────────────────────────────────────┐
│  PPR Academy Logo  │  Courses  │  Sign In  │  →  │
└──────────────────────────────────────────────────┘
                                              ↑
                                         Sign Up Button
```

### Authenticated Navigation (Logged In)

```
┌─────────────────────────────────────────────────────────────┐
│  PPR Academy  │  Courses  │  Library  │  Dashboard  │  👤   │
└─────────────────────────────────────────────────────────────┘
```

### Dashboard Tabs (Unified Interface)

```
┌─────────────────────────────────────────────────┐
│  Student  │  Creator  │  Coach  │  Account      │
└─────────────────────────────────────────────────┘
     ↑
  Default for students

              ↑
         Default for creators
```

---

## 🚦 Decision Points in User Journey

### 1. Landing Page Decision

```
User lands on / (root)
    │
    ├─ Wants to create/sell?
    │  └─ Click "Start Creating" → /sign-up?intent=creator
    │
    └─ Wants to learn/buy?
       └─ Click "Browse Courses" → /courses
```

### 2. Course Discovery Decision

```
User on /courses (marketplace)
    │
    ├─ Found interesting course?
    │  └─ Click course → /courses/[slug]
    │
    └─ Want to filter/search?
       └─ Use filters → Refined results
```

### 3. Enrollment Decision

```
User on /courses/[slug]
    │
    ├─ Ready to enroll?
    │  └─ Click "Enroll Now" → /courses/[slug]/checkout
    │
    └─ Need more info?
       └─ Scroll through curriculum, reviews, etc.
```

### 4. Post-Enrollment Navigation

```
User completes enrollment
    │
    └─ Redirected to /library
        │
        ├─ Continue learning → Access course content
        │
        └─ Discover more → "Browse Courses" link
```

---

## 🎯 Success Metrics

### Phase 1 Implementation Goals

| Metric | Before | Target | How to Measure |
|--------|--------|--------|----------------|
| Student sign-up friction | High | Low | Conversion rate: landing → enrollment |
| Course discovery rate | 0% | 30%+ | Users who visit `/courses` |
| Store creation pressure | 100% | 50% | % of users creating stores |
| Library engagement | Low | High | Return visits to `/library` |
| Course enrollment rate | Low | 2x | Enrollments per month |

---

## 🔮 Future Enhancements (Phase 2+)

### Onboarding Flow

```
Sign Up → Onboarding Page (NEW)
          │
          ├─ "I want to learn"
          │  └─ Set role: student → /courses
          │
          └─ "I want to create"
             └─ Set role: creator → /store/setup
```

### Personalized Homepage

```
Authenticated User → / (root)
    │
    ├─ Has store?
    │  └─ Show creator dashboard
    │
    └─ No store?
       └─ Show student dashboard with recommendations
```

### Smart Recommendations

```
/library (for students)
    │
    ├─ Enrolled courses
    │
    └─ "Recommended for you" section
       ├─ Based on category
       ├─ Based on skill level
       └─ Based on enrollment history
```

---

## 📝 Implementation Order

### Week 1: Foundation
- [x] Analyze current state (DONE)
- [ ] Create `/courses` marketplace page
- [ ] Add `getAllPublishedCourses` Convex query
- [ ] Update landing page CTAs

### Week 2: Enhancement
- [ ] Improve `/library` empty state
- [ ] Add featured courses section
- [ ] Update navigation with "Courses" link
- [ ] Test student flow end-to-end

### Week 3: Refinement
- [ ] Add sign-up intent parameters
- [ ] Update copy based on intent
- [ ] Implement smart redirects
- [ ] A/B test different CTAs

### Week 4: Optimization
- [ ] Add analytics tracking
- [ ] Monitor conversion funnels
- [ ] Gather user feedback
- [ ] Iterate based on data

---

## 🎬 Before & After User Quotes

### Before Implementation

> "I clicked Sign Up because I wanted to take a course, but it asked me to create a store. I'm not a creator, I just want to learn. Where are the courses?"  
> — Confused Student

> "The landing page looks great, but where do I browse courses? I only see 'Start Your Storefront' everywhere."  
> — Potential Customer

### After Implementation

> "I found exactly what I was looking for! Clicked 'Browse Courses' and within 2 minutes I was enrolled in a beat-making course."  
> — Happy Student

> "Love that I can both take courses to improve my skills AND sell my own sample packs. The tabs make it super clear."  
> — Creator & Learner

---

*Visual flows created from analysis in `USER_JOURNEY_ANALYSIS.md`*  
*Last Updated: October 8, 2025*



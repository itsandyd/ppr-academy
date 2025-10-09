# PPR Academy - User Flow Diagram

## 🎯 Complete User Journeys

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         LANDING PAGE (/)                                 │
│                      Public Marketplace Homepage                         │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  • Hero with search bar                                            │ │
│  │  • Browse all courses, sample packs, products                      │ │
│  │  • Platform stats (creators, students, content)                    │ │
│  │  • Featured content                                                 │ │
│  │  • How It Works section                                            │ │
│  │  • CTAs: "Start for Free" | "Become a Creator"                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                │                                    │
                │ (Not signed in)                    │ (Signed in)
                │                                    │
        ┌───────▼───────┐                   ┌────────▼────────┐
        │   SIGN UP     │                   │   /dashboard    │
        │   SIGN IN     │                   │ Smart Redirect  │
        └───────┬───────┘                   └────────┬────────┘
                │                                    │
                │                                    │
                │                           ┌────────┴─────────┐
                │                           │ Check user type  │
                │                           └────────┬─────────┘
                │                                    │
                └────────────────────────────────────┤
                                                     │
                        ┌────────────────────────────┼────────────────────────────┐
                        │                            │                            │
                  ┌─────▼─────┐              ┌──────▼──────┐            ┌────────▼────────┐
                  │  Student  │              │   Creator   │            │ Unauthenticated │
                  │ (No Store)│              │ (Has Store) │            │   (Redirect)    │
                  └─────┬─────┘              └──────┬──────┘            └────────┬────────┘
                        │                           │                            │
                        │                           │                            ▼
                        │                           │                            /
                        │                           │                    (Back to homepage)
                        │                           │
                        │                           │
               ┌────────▼────────┐         ┌────────▼────────┐
               │   /library      │         │     /home       │
               │ Student Library │         │ Creator Dashboard│
               └────────┬────────┘         └────────┬────────┘
                        │                           │
                        │                           │


┌────────────────────────────────────────────────────────────────────────────────┐
│                           STUDENT PATH (/library)                              │
├────────────────────────────────────────────────────────────────────────────────┤
│  Navigation: [Browse] [Library] [Profile]                                     │
│                                                                                │
│  Content:                                                                      │
│  • Welcome header with avatar & level                                         │
│  • Stats cards (enrolled, completed, hours, streak)                          │
│  • Tabs:                                                                       │
│    - Continue (enrolled courses with progress)                               │
│    - Recommended (personalized suggestions)                                  │
│    - Favorites (bookmarked content)                                          │
│    - Certificates (earned achievements)                                      │
│  • Sidebar:                                                                    │
│    - Next milestone progress                                                  │
│    - Recent activity feed                                                     │
│    - Quick actions (schedule, browse, certificates)                          │
│                                                                                │
│  Actions Available:                                                            │
│  • Continue learning → /courses/[slug]                                        │
│  • Browse courses → /                                                          │
│  • View certificates → Certificate modal                                      │
│  • Become a creator → /store-setup (if not already creator)                  │
└────────────────────────────────────────────────────────────────────────────────┘


┌────────────────────────────────────────────────────────────────────────────────┐
│                         CREATOR PATH (/home)                                   │
├────────────────────────────────────────────────────────────────────────────────┤
│  Navigation: [Browse] [Dashboard] [Store] [Library] [Profile]                │
│                                                                                │
│  Content:                                                                      │
│  • Revenue overview (today, week, month, all-time)                           │
│  • Key metrics (total students, active courses, conversion rate)             │
│  • Recent sales list                                                          │
│  • Course performance table                                                   │
│  • Quick actions (create course, view analytics, manage store)               │
│                                                                                │
│  Actions Available:                                                            │
│  • View detailed store → /store                                               │
│  • Create content → /store/courses/new or /store/products/new                │
│  • View analytics → /store/analytics                                          │
│  • Browse marketplace → /                                                      │
│  • View personal learning → /library                                          │
└────────────────────────────────────────────────────────────────────────────────┘


┌────────────────────────────────────────────────────────────────────────────────┐
│                      CREATOR STORE MANAGEMENT (/store)                         │
├────────────────────────────────────────────────────────────────────────────────┤
│  Navigation: [Dashboard] [Courses] [Products] [Samples] [Settings]           │
│                                                                                │
│  Guard: Requires existing store (StoreRequiredGuard)                         │
│  If no store → Redirect to /store-setup                                       │
│                                                                                │
│  Content:                                                                      │
│  • Store header (name, logo, description)                                    │
│  • Content tabs:                                                               │
│    - Courses (create, edit, publish, analytics)                              │
│    - Digital Products (upload, price, manage)                                │
│    - Sample Packs (organize, price, publish)                                 │
│    - Orders (view, refund, manage)                                           │
│    - Analytics (detailed charts, cohorts, funnels)                           │
│    - Settings (branding, payment, notifications)                             │
│                                                                                │
│  Actions Available:                                                            │
│  • Create new course → /store/courses/new                                     │
│  • Create new product → /store/products/new                                   │
│  • Edit content → /store/courses/[id] or /store/products/[id]               │
│  • View analytics → /store/analytics                                          │
│  • Manage settings → /store/settings                                          │
└────────────────────────────────────────────────────────────────────────────────┘


┌────────────────────────────────────────────────────────────────────────────────┐
│                         BOTH PATHS (Student + Creator)                         │
├────────────────────────────────────────────────────────────────────────────────┤
│  Default redirect: /home (creator dashboard)                                  │
│                                                                                │
│  Full Navigation: [Browse] [Dashboard] [Store] [Library] [Profile]           │
│                                                                                │
│  Use Cases:                                                                    │
│  • Creator who also takes courses from others                                │
│  • Student who becomes a creator                                              │
│                                                                                │
│  Context Switching:                                                            │
│  • Click "Library" → See enrolled courses (student view)                     │
│  • Click "Dashboard" → See business overview (creator view)                  │
│  • Click "Store" → Manage own content (creator view)                         │
│  • Click "Browse" → Discover new content (student view)                      │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Page Purpose Summary

| Page | Who | Primary Purpose | Secondary Purpose |
|------|-----|----------------|-------------------|
| `/` | Everyone | Browse & discover content | Marketing & conversion |
| `/dashboard` | Signed-in | Smart redirect | Route to correct dashboard |
| `/library` | Students | View enrolled courses & progress | Track learning, earn certificates |
| `/home` | Creators | Business overview | Quick access to analytics & actions |
| `/store` | Creators | Detailed content management | Settings, analytics, orders |

---

## 🔄 User Type Transitions

### Student → Creator
```
1. Student using /library
2. Clicks "Become a Creator" CTA
3. Redirected to /store-setup
4. Creates store
5. Now has access to:
   - /home (new primary)
   - /store (new available)
   - /library (still available)
```

### New User → Student
```
1. Lands on / (marketplace)
2. Signs up via "Start for Free"
3. Redirected to /dashboard
4. No store detected → /library
5. Starts as student
```

### New User → Creator
```
1. Lands on / (marketplace)
2. Signs up via "Become a Creator"
3. Redirected to /store-setup
4. Creates store
5. Redirected to /home
6. Starts as creator
```

---

## 🎯 Navigation Context

### Student Navigation
```
┌─────────────────────────────────────────────────────┐
│  [Browse]  [Library]  [Profile]  [Become Creator]  │
└─────────────────────────────────────────────────────┘
     ↓          ↓          ↓              ↓
     /       /library   /profile   /store-setup
```

### Creator Navigation
```
┌──────────────────────────────────────────────────────────┐
│  [Browse]  [Dashboard]  [Store]  [Library]  [Profile]   │
└──────────────────────────────────────────────────────────┘
     ↓          ↓          ↓         ↓          ↓
     /        /home     /store   /library   /profile
```

---

## 🚀 Implementation Status

### ✅ Completed
- [x] Marketplace homepage (`/`)
- [x] Student library (`/library`)
- [x] Creator dashboard (`/home`)
- [x] Creator store (`/store`)
- [x] Smart redirect (`/dashboard`)
- [x] Hero CTA updated to use `/dashboard`

### 🔄 Recommended Next Steps
1. Update Clerk redirects to use `/dashboard`
2. Add "Become a Creator" CTA to `/library`
3. Delete `/olddashboard` (unused)
4. Add role badges to user profile
5. Create `/store-setup` onboarding flow
6. Update all internal links to use `/dashboard` instead of `/home`

---

## 💡 Key Benefits

1. **Clear Separation of Concerns**
   - `/` = Discovery (public)
   - `/library` = Learning (student)
   - `/home` = Business (creator)
   - `/store` = Management (creator)

2. **Smart Routing**
   - Users always land on the right page
   - No confusion about where to go
   - Seamless transitions between roles

3. **Scalable Architecture**
   - Easy to add new user types (admin, moderator)
   - Clear navigation patterns
   - Consistent user experience

---

*User flow complete! 🎉*


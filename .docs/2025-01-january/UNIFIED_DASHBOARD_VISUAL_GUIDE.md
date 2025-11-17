# Unified Dashboard - Visual Guide & UX Flow

**Purpose**: Visual mockups and user experience flows for the unified dashboard

---

## 📐 Layout Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│  Header                                                              │
│  ┌──────────────────────────┐  ┌─────────────────────────────────┐ │
│  │ My Learning / Creator     │  │  [Learn] [Create]  🔍 🔔 ⚙️ 👤  │ │
│  │ Studio                    │  │   Mode Toggle                    │ │
│  └──────────────────────────┘  └─────────────────────────────────┘ │
├──────────┬──────────────────────────────────────────────────────────┤
│          │                                                           │
│ Sidebar  │  Main Content Area                                       │
│          │                                                           │
│ 🏠 Home  │  ┌──────────────────────────────────────────────────┐   │
│ 📚 Course│  │ Welcome Card / Hero Section                      │   │
│ 📥 Down. │  └──────────────────────────────────────────────────┘   │
│ 🏆 Certs │                                                           │
│ 📈 Progr.│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐           │
│          │  │ Stat 1 │ │ Stat 2 │ │ Stat 3 │ │ Stat 4 │           │
│          │  └────────┘ └────────┘ └────────┘ └────────┘           │
│          │                                                           │
│          │  Main Content (mode-specific)                            │
│          │                                                           │
│ ⚙️ Setti.│                                                           │
└──────────┴──────────────────────────────────────────────────────────┘
```

---

## 🎨 Mode Toggle Component

```
┌───────────────────────────────────────┐
│  ┌─────────────────────────────────┐  │
│  │  📚 Learn    │    ✨ Create     │  │ ← Default (Learn selected)
│  │   ACTIVE     │                  │  │
│  └─────────────────────────────────┘  │
└───────────────────────────────────────┘

After click:

┌───────────────────────────────────────┐
│  ┌─────────────────────────────────┐  │
│  │  📚 Learn    │    ✨ Create     │  │ ← Switched to Create
│  │              │     ACTIVE       │  │
│  └─────────────────────────────────┘  │
└───────────────────────────────────────┘
```

**Interaction**:
- Smooth transition (200ms ease)
- Background slides to active button
- URL updates: `?mode=learn` → `?mode=create`
- Content crossfades
- Preference saved to Convex + localStorage

---

## 🎭 Learn Mode View

```
┌─────────────────────────────────────────────────────────────────────┐
│  HEADER: "My Learning"          [📚 LEARN] [Create]  🔍 🔔 ⚙️ 👤   │
├──────────┬──────────────────────────────────────────────────────────┤
│          │                                                           │
│ 🏠 Home  │  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   │
│ 📚 Course│  ┃ Welcome back, Alex! 👋                           ┃   │
│ 📥 Down. │  ┃ Ready to continue your music production journey? ┃   │
│ 🏆 Certs │  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   │
│ 📈 Progr.│                                                           │
│          │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│          │  │ 📚 Enroll│ │ 🏆 Compl │ │ ⏰ Hours │ │ 🔥 Streak│   │
│          │  │    12    │ │     3    │ │    47    │ │     5    │   │
│          │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│          │                                                           │
│          │  Continue Learning                     [Browse Courses]  │
│          │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│          │  │ 🎹 Mixing    │ │ 🎵 Sound     │ │ 🎚️ Master   │   │
│          │  │   Basics     │ │   Design     │ │   Class      │   │
│          │  │ ████████░░ 80%│ │ ███░░░░░░ 30%│ │ ██████████100%│   │
│ ⚙️ Setti.│  └──────────────┘ └──────────────┘ └──────────────┘   │
│          │                                                           │
│          │  My Downloads                                            │
│          │  🎵 Trap Drum Kit Pro.zip                    [Download]  │
│          │  🎹 Serum Preset Pack.zip                    [Download]  │
└──────────┴──────────────────────────────────────────────────────────┘
```

**Key Features**:
- Focus on **consumption**: Courses enrolled, progress, downloads
- No "create" actions visible
- Stats show learning metrics
- Quick access to continue where they left off

---

## 🎨 Create Mode View

```
┌─────────────────────────────────────────────────────────────────────┐
│  HEADER: "Creator Studio"       [Learn] [✨ CREATE]  🔍 🔔 ⚙️ 👤   │
├──────────┬──────────────────────────────────────────────────────────┤
│          │                                                           │
│ 🏠 Home  │  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   │
│ 📦 Prods │  ┃ Creator Studio                      [+ Create]  ┃   │
│ 📚 Course│  ┃ Manage your products and grow your business     ┃   │
│ 🎵 Sample│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   │
│ 👥 Custom│                                                           │
│ 📊 Analy.│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│          │  │ 📦 Total │ │ 💰Revenue│ │ 📥 Down. │ │ 📈 Growth│   │
│          │  │     8    │ │   $450   │ │   124    │ │   +12%   │   │
│          │  │ Pub: 6   │ │ +15% ↑   │ │ All time │ │ This mo. │   │
│          │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│          │                                                           │
│          │  Quick Create                                            │
│          │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│          │  │ 🎵 Sample│ │ 🎛️ Preset│ │ 📚 Course│ │ 🎧 Coach │   │
│          │  │   Pack   │ │   Pack   │ │          │ │   ing    │   │
│ ⚙️ Setti.│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│          │                                                           │
│          │  Recent Products                             [View All]  │
│          │  🎵 Trap Drums Vol 2    [Published] $29     [Edit]       │
│          │  🎹 Serum Bass Presets  [Draft]     $19     [Edit]       │
│          │  📚 Mixing Masterclass  [Published] $99     [Edit]       │
└──────────┴──────────────────────────────────────────────────────────┘
```

**Key Features**:
- Focus on **creation**: Products published, sales, analytics
- Quick create buttons for common product types
- Stats show business metrics (revenue, downloads, growth)
- Direct access to product management

---

## 🔀 User Flow: Mode Switching

```
┌─────────────────────────────────────────────────────────────────┐
│ User Journey: Learning → Inspiration → Creation                 │
└─────────────────────────────────────────────────────────────────┘

1. USER STARTS IN LEARN MODE
   ┌───────────────────────────────┐
   │ "I'm taking a course on       │
   │  sound design..."             │
   └───────────────────────────────┘
                ↓
   📚 Watching lessons
   📝 Taking notes
   🎵 Downloading samples

2. USER GETS INSPIRED
   ┌───────────────────────────────┐
   │ "I just learned this cool     │
   │  technique, I could teach it!"│
   └───────────────────────────────┘
                ↓
   👆 Clicks "Create" mode toggle

3. SMOOTH TRANSITION
   ┌───────────────────────────────┐
   │ Content fades out (200ms)     │
   │ Mode toggle slides (200ms)    │
   │ URL updates                   │
   │ Content fades in (200ms)      │
   └───────────────────────────────┘
                ↓
   Toast: "Switched to Create Mode"

4. USER NOW IN CREATE MODE
   ┌───────────────────────────────┐
   │ Quick create buttons visible  │
   │ Stats show creator metrics    │
   │ Sidebar shows creator nav     │
   └───────────────────────────────┘
                ↓
   👆 Clicks "Course" quick create
                ↓
   Redirects to: /store/[id]/course/create
                ↓
   User creates course
                ↓
   Returns to: /dashboard?mode=create
```

---

## 📱 Mobile Responsive Design

### Mobile Learn Mode

```
┌─────────────────────────┐
│ ☰  My Learning    🔔 👤 │
│─────────────────────────│
│ [📚 LEARN] [Create]     │
│─────────────────────────│
│ Welcome back, Alex! 👋  │
│─────────────────────────│
│ ┌─────────┐ ┌─────────┐│
│ │📚 12    │ │🏆  3    ││
│ │Enrolled │ │Complete ││
│ └─────────┘ └─────────┘│
│ ┌─────────┐ ┌─────────┐│
│ │⏰ 47hrs │ │🔥  5    ││
│ │Learned  │ │Streak   ││
│ └─────────┘ └─────────┘│
│─────────────────────────│
│ Continue Learning       │
│                         │
│ ┌─────────────────────┐ │
│ │ 🎹 Mixing Basics    │ │
│ │ ████████░░ 80%      │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ 🎵 Sound Design     │ │
│ │ ███░░░░░░ 30%       │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

### Mobile Create Mode

```
┌─────────────────────────┐
│ ☰  Creator Studio   🔔👤│
│─────────────────────────│
│ [Learn] [✨ CREATE]     │
│─────────────────────────│
│ Manage your products    │
│               [+Create] │
│─────────────────────────│
│ ┌─────────┐ ┌─────────┐│
│ │📦  8    │ │💰 $450  ││
│ │Products │ │Revenue  ││
│ └─────────┘ └─────────┘│
│─────────────────────────│
│ Quick Create            │
│                         │
│ ┌─────┐ ┌─────┐ ┌─────┐│
│ │🎵   │ │🎛️   │ │📚   ││
│ │Pack │ │Pres.│ │Cours││
│ └─────┘ └─────┘ └─────┘│
│ ┌─────┐                 │
│ │🎧   │                 │
│ │Coach│                 │
│ └─────┘                 │
│─────────────────────────│
│ Recent Products         │
│                         │
│ 🎵 Trap Drums Vol 2     │
│ [Published] $29  [Edit] │
│                         │
│ 🎹 Serum Bass Presets   │
│ [Draft] $19      [Edit] │
└─────────────────────────┘
```

---

## 🎯 Key UX Principles

### 1. **Clear Mental Model**
- Two modes = Two mindsets
- Learn = Consume content
- Create = Publish content
- Mode toggle is always visible and prominent

### 2. **Smooth Transitions**
- No jarring page reloads
- Content crossfades
- Mode toggle animates
- URL updates silently

### 3. **Context Preservation**
- If viewing a specific course in Learn mode
- Switch to Create
- Can still navigate back to Learn mode and continue where you left off

### 4. **Progressive Disclosure**
- Learn mode: Simple, focused on consumption
- Create mode: More powerful, shows business metrics
- Advanced features only shown in Create mode

### 5. **Intelligent Defaults**
- New users → Learn mode (they're exploring)
- Users with products → Create mode (they're managing)
- Preference is saved and remembered

---

## 🎨 Design Tokens

### Colors

```typescript
Learn Mode Theme:
- Primary: chart-1 (Blue/Teal)
- Accent: chart-2 (Green)
- Gradient: from-chart-1 to-chart-4

Create Mode Theme:
- Primary: chart-4 (Purple/Pink)
- Accent: chart-3 (Orange)
- Gradient: from-purple-500 to-pink-500
```

### Spacing

```typescript
Mobile:
- Stats grid: 2 columns
- Course cards: 1 column
- Padding: 1rem (16px)

Desktop:
- Stats grid: 4 columns
- Course cards: 3 columns
- Padding: 2rem (32px)
```

### Typography

```typescript
Headings:
- H1 (Page title): 2xl (24px) mobile, 3xl (30px) desktop
- H2 (Section): xl (20px) mobile, 2xl (24px) desktop
- H3 (Card title): lg (18px)

Body:
- Default: sm (14px)
- Muted: xs (12px)
```

---

## 🔄 State Management

### Mode State

```typescript
State hierarchy:
1. URL param (?mode=learn) - Source of truth
2. Convex database - Persistent preference
3. localStorage - Fallback/quick access
4. React state - UI state

Sync flow:
URL → React State → Convex → localStorage
```

### Data Flow

```typescript
Learn Mode:
┌─────────────────┐
│ useQuery        │
│ enrolledCourses │ → Display in cards
│ libraryStats    │ → Display in stats
│ purchases       │ → Display in downloads
└─────────────────┘

Create Mode:
┌─────────────────┐
│ useQuery        │
│ createdCourses  │ → Display in products list
│ digitalProducts │ → Display in products list
│ salesStats      │ → Display in analytics
└─────────────────┘
```

---

## 📊 Analytics Events to Track

### Mode Switching
```typescript
analytics.track('Dashboard Mode Changed', {
  from: 'learn',
  to: 'create',
  timestamp: Date.now(),
  userId: user.id,
});
```

### Mode Usage
```typescript
analytics.track('Mode Session Duration', {
  mode: 'learn',
  duration: 1234567, // milliseconds
  pagesVisited: ['dashboard', 'courses', 'certificates'],
});
```

### Conversions
```typescript
// Learn → Create conversion
analytics.track('Learn to Create Conversion', {
  trigger: 'mode_toggle',
  timestamp: Date.now(),
});

// Create action from Create mode
analytics.track('Product Created from Dashboard', {
  productType: 'course',
  fromMode: 'create',
});
```

---

## 🎬 Animation Specifications

### Mode Toggle

```css
Transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1)

Active state:
- Background: bg-background
- Shadow: shadow-sm
- Text: text-foreground
- Scale: 1.0

Inactive state:
- Background: transparent
- Shadow: none
- Text: text-muted-foreground
- Scale: 0.98 (subtle)

Hover (inactive):
- Background: bg-background/50
- Text: text-foreground
```

### Content Transition

```css
Fade out: 200ms ease-out
Opacity: 1 → 0
Transform: translateY(0) → translateY(-10px)

Fade in: 200ms ease-in (delayed 200ms)
Opacity: 0 → 1
Transform: translateY(10px) → translateY(0)
```

---

## 🚀 Performance Targets

- **Mode switch**: < 200ms perceived latency
- **First contentful paint**: < 1.5s
- **Time to interactive**: < 3s
- **Largest contentful paint**: < 2.5s

---

## ✅ Accessibility Checklist

- [ ] Mode toggle has clear focus states
- [ ] Screen reader announces mode changes
- [ ] Keyboard navigation works (Tab, Enter, Space)
- [ ] Color contrast meets WCAG AA standards
- [ ] Icons have text alternatives
- [ ] Loading states are announced
- [ ] Error states are announced

---

## 📝 Microcopy

### Toasts

```
Mode Switch (Learn):
"Switched to Learn Mode"
"View your courses and learning progress"

Mode Switch (Create):
"Switched to Create Mode"
"Manage your products and sales"

First Time User:
"Welcome to your unified dashboard!"
"Toggle between Learn and Create modes anytime"
```

### Empty States

```
Learn Mode (No Courses):
Title: "No Courses Yet"
Body: "Start your learning journey by enrolling in a course."
CTA: "Browse Courses"

Create Mode (No Products):
Title: "No Products Yet"
Body: "Create your first product to start earning from your music"
CTA: "Create Product"
```

---

## 🎯 Success Metrics

### Immediate (Week 1)
- [ ] 0 broken links from redirects
- [ ] Mode toggle works 100% of time
- [ ] < 1% error rate on mode switch

### Short-term (Month 1)
- [ ] 20% of users use both modes
- [ ] 15% conversion from Learn → Create
- [ ] Average 2.5 mode switches per session

### Long-term (Quarter 1)
- [ ] 30% of active users are hybrid
- [ ] 50% reduction in "where is X" support tickets
- [ ] +10 NPS score improvement

---

## 🎨 Visual Inspiration

The dashboard should feel like:
- **Notion**: Clean, mode-based UI
- **Spotify**: Seamless transitions, great stats
- **Teachable**: Creator-friendly, clear metrics
- **YouTube Studio**: Powerful but not overwhelming

**NOT like**:
- Cluttered admin panels
- Generic SaaS dashboards
- Overly complex analytics tools

---

**Remember**: The goal is to make users feel like they have one home base, not two separate apps.


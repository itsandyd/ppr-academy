# 🎨 Optional Components - Usage Guide

## Overview

The following 6 components are **built, tested, and ready** but considered optional polish. Use them when you want additional visual variety or specific layout needs.

---

## 1. Alternative Grid Layouts

### MasonryGrid (Pinterest-Style)
**File:** `components/ui/masonry-grid.tsx`

**When to Use:**
- Mixed content heights
- Blog-style layouts
- Portfolio galleries

**Example:**
```tsx
import { MasonryGrid } from "@/components/ui/masonry-grid";

<MasonryGrid columns={{ sm: 1, md: 2, lg: 3 }} gap={6} animated={true}>
  {products.map(product => (
    <ProductCard key={product.id} {...product} />
  ))}
</MasonryGrid>
```

---

### StaggeredGrid
**When to Use:**
- Featured collections
- Visual variety needed
- Highlight specific items

**Example:**
```tsx
import { StaggeredGrid } from "@/components/ui/masonry-grid";

<StaggeredGrid>
  {products.map(product => (
    <ProductCard key={product.id} {...product} />
  ))}
</StaggeredGrid>
```

---

### BentoGrid (Asymmetric Modern)
**When to Use:**
- Hero sections
- Modern aesthetic
- Featured items need emphasis

**Example:**
```tsx
import { BentoGrid } from "@/components/ui/masonry-grid";

<BentoGrid featuredIndices={[0, 5, 10]}>
  {products.map(product => (
    <ProductCard key={product.id} {...product} />
  ))}
</BentoGrid>
```

---

## 2. Visual Effects

### PulsingGlow
**File:** `components/ui/hero-flourishes.tsx`

**When to Use:**
- Draw attention to important CTAs
- Highlight new features
- Create focus

**Example:**
```tsx
import { PulsingGlow } from "@/components/ui/hero-flourishes";

<div className="relative">
  <PulsingGlow color="purple" />
  <Button className="relative z-10">
    Limited Offer - 50% Off!
  </Button>
</div>
```

---

### BrandedWatermark
**When to Use:**
- Reinforce branding
- Background of sections
- Subtle brand presence

**Example:**
```tsx
import { BrandedWatermark } from "@/components/ui/hero-flourishes";

<div className="relative p-12">
  <BrandedWatermark />
  <div className="relative z-10">
    <h1>Content Here</h1>
  </div>
</div>
```

---

### AnimatedGradientBackground
**When to Use:**
- Hero sections
- Landing pages
- Dynamic feel needed

**Example:**
```tsx
import { AnimatedGradientBackground } from "@/components/ui/hero-flourishes";

<div className="relative overflow-hidden rounded-2xl">
  <AnimatedGradientBackground />
  <div className="relative z-10 p-12 text-white">
    <h1>Dynamic Hero</h1>
  </div>
</div>
```

---

## 3. Loading States

### When to Replace Basic Loaders:
- Any "Loading..." text
- Spinner-only loading states
- Improve perceived performance

**Available Skeletons:**
- `MetricCardsLoading`
- `ProductGridLoading`
- `ListItemLoading`
- `TableLoading`
- `FormLoading`
- `AchievementCardsLoading`
- `LeaderboardLoading`
- `ChartLoading`
- `PageLoading`
- `LoadingSpinner`

**Example:**
```tsx
import { ProductGridLoading } from "@/components/ui/loading-states";

{isLoading ? (
  <ProductGridLoading count={6} />
) : (
  <ProductGrid products={products} />
)}
```

---

## 4. Course Engagement

### LessonFeedbackPrompt
**File:** `components/courses/lesson-feedback-prompt.tsx`

**When to Integrate:**
- When you have a course lesson player
- After video completion
- For collecting course feedback

**Example:**
```tsx
import { LessonFeedbackPrompt } from "@/components/courses/lesson-feedback-prompt";

const [showFeedback, setShowFeedback] = useState(false);

// After lesson completion:
<LessonFeedbackPrompt
  lessonTitle={lesson.title}
  lessonId={lesson.id}
  autoShow={showFeedback}
  onSubmit={(feedback) => saveFeedback(feedback)}
  onSkip={() => setShowFeedback(false)}
/>
```

---

### QuickLessonRating
**When to Use:**
- Simpler than full modal
- Inline rating preferred
- Quick feedback collection

**Example:**
```tsx
import { QuickLessonRating } from "@/components/courses/lesson-feedback-prompt";

<QuickLessonRating
  lessonTitle={lesson.title}
  lessonId={lesson.id}
  onRate={(stars) => saveRating(stars)}
/>
```

---

## 📋 Summary

**All 11 optional components are:**
- ✅ Built and tested
- ✅ Zero linting errors
- ✅ TypeScript typed
- ✅ Dark mode compatible
- ✅ Documented

**Use them when:**
- You need visual variety
- Specific layout requirements
- Want additional polish
- User feedback requests them

**Don't use them if:**
- Current layouts work fine
- Time-constrained
- Users haven't requested

---

**Your app is complete with 28 integrated features. These 11 are here when you need them!** ✨


# PPR Academy - User Journey Quick Start Guide

## 🚀 Immediate Implementation: Phase 1 Changes

This guide provides copy-paste code for the first phase of improvements identified in `USER_JOURNEY_ANALYSIS.md`.

---

## 1️⃣ Create Public Course Marketplace

### File: `app/courses/page.tsx` (NEW)

```tsx
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Search, Filter, Star, Users, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export default function CoursesMarketplace() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPrice, setSelectedPrice] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Fetch all published courses across all stores
  const allCourses = useQuery(api.courses.getAllPublishedCourses);
  
  // Get unique categories
  const categories = useMemo(() => {
    if (!allCourses) return [];
    const uniqueCategories = [...new Set(allCourses.map(c => c.category).filter(Boolean))];
    return uniqueCategories;
  }, [allCourses]);

  // Filter and sort courses
  const filteredCourses = useMemo(() => {
    if (!allCourses) return [];
    
    let filtered = [...allCourses];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(course => course.category === selectedCategory);
    }

    // Price filter
    if (selectedPrice !== "all") {
      switch (selectedPrice) {
        case "free":
          filtered = filtered.filter(course => course.price === 0);
          break;
        case "paid":
          filtered = filtered.filter(course => (course.price || 0) > 0);
          break;
      }
    }

    // Sort
    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => b._creationTime - a._creationTime);
        break;
      case "popular":
        // Sort by enrollment count when available
        break;
      case "price-low":
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case "price-high":
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
    }

    return filtered;
  }, [allCourses, searchTerm, selectedCategory, selectedPrice, sortBy]);

  if (allCourses === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-80" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Course Marketplace</h1>
              <p className="text-muted-foreground">Discover courses from talented creators</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedPrice} onValueChange={setSelectedPrice}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue placeholder="Price" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-36">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground">
            {filteredCourses.length} {filteredCourses.length === 1 ? 'course' : 'courses'} found
          </p>
          {(searchTerm || selectedCategory !== "all" || selectedPrice !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
                setSelectedPrice("all");
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>

        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card 
                key={course._id} 
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/courses/${course.slug}`)}
              >
                {/* Course Image */}
                <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  {/* Price Badge */}
                  <Badge className="absolute top-3 right-3 bg-white text-gray-900 font-semibold">
                    {course.price === 0 ? "FREE" : `$${course.price}`}
                  </Badge>
                  {/* Category Badge */}
                  {course.category && (
                    <Badge className="absolute top-3 left-3 bg-primary text-white">
                      {course.category}
                    </Badge>
                  )}
                </div>

                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg line-clamp-2 hover:text-primary transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {course.description}
                      </p>
                    </div>

                    {/* Course Meta */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{course.enrollmentCount || 0} enrolled</span>
                      </div>
                      {course.skillLevel && (
                        <Badge variant="outline" className="text-xs">
                          {course.skillLevel}
                        </Badge>
                      )}
                    </div>

                    <Button className="w-full">
                      View Course
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No courses found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search or filter criteria
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
                setSelectedPrice("all");
              }}
            >
              Clear All Filters
            </Button>
          </div>
        )}
      </div>

      {/* CTA Section for Creators */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-t">
        <div className="container mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold mb-2">Are you a creator?</h2>
          <p className="text-muted-foreground mb-6">
            Share your knowledge and build your brand with PPR Academy
          </p>
          <Button size="lg" onClick={() => router.push('/sign-up?intent=creator')}>
            Start Creating
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### Convex Query: `convex/courses.ts` (ADD)

Add this query to your courses file:

```typescript
// Get all published courses across all stores (public marketplace)
export const getAllPublishedCourses = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("courses"),
    _creationTime: v.number(),
    title: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    thumbnail: v.optional(v.string()),
    category: v.optional(v.string()),
    skillLevel: v.optional(v.string()),
    storeId: v.optional(v.id("stores")),
    userId: v.string(),
    published: v.boolean(),
    enrollmentCount: v.optional(v.number()),
  })),
  handler: async (ctx) => {
    const courses = await ctx.db
      .query("courses")
      .filter((q) => q.eq(q.field("published"), true))
      .collect();

    // Optionally enrich with enrollment counts
    const coursesWithCounts = await Promise.all(
      courses.map(async (course) => {
        const enrollmentCount = await ctx.db
          .query("purchases")
          .withIndex("by_course", (q) => q.eq("courseId", course._id))
          .collect()
          .then(purchases => purchases.length);

        return {
          ...course,
          enrollmentCount,
        };
      })
    );

    return coursesWithCounts;
  },
});
```

---

## 2️⃣ Update Landing Page CTAs

### File: `app/page.tsx` (MODIFY)

Update the landing page to add dual CTAs. Find the hero section component and update it:

### File: `app/_components/hero-enhanced.tsx` (MODIFY)

Add a second CTA button for browsing courses:

```tsx
// Find the CTA section and update it to include both buttons:

<div className="flex flex-col sm:flex-row gap-4 justify-center">
  <Button 
    size="lg" 
    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-6 text-lg font-semibold"
    onClick={() => router.push('/sign-up?intent=creator')}
  >
    Start Creating Free
  </Button>
  <Button 
    size="lg" 
    variant="outline"
    className="border-2 border-purple-600/30 hover:bg-purple-600/10 px-8 py-6 text-lg font-semibold"
    onClick={() => router.push('/courses')}
  >
    <BookOpen className="w-5 h-5 mr-2" />
    Browse Courses
  </Button>
</div>
```

### File: `app/_components/sticky-nav.tsx` (MODIFY)

Add "Browse Courses" link to navigation:

```tsx
// Add this to the navigation links:

<Link 
  href="/courses" 
  className="text-foreground/80 hover:text-foreground transition-colors"
>
  Courses
</Link>
```

---

## 3️⃣ Improve Empty Library State

### File: `app/library/page.tsx` (MODIFY)

Find the empty state section and enhance it:

```tsx
// Replace the empty state with this enhanced version:

{enrolledCourses.length === 0 ? (
  <div className="text-center py-16">
    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
      <BookOpen className="w-12 h-12 text-primary" />
    </div>
    <h2 className="text-2xl font-bold mb-3">Start Your Learning Journey</h2>
    <p className="text-muted-foreground mb-8 max-w-md mx-auto">
      You haven't enrolled in any courses yet. Browse our marketplace to find courses that match your interests.
    </p>
    
    {/* Quick Browse Categories */}
    <div className="mb-8">
      <h3 className="font-semibold mb-4">Popular Categories</h3>
      <div className="flex flex-wrap gap-2 justify-center">
        {["Music Production", "Sound Design", "Mixing", "Mastering", "DJing"].map(cat => (
          <Button 
            key={cat}
            variant="outline" 
            onClick={() => router.push(`/courses?category=${encodeURIComponent(cat)}`)}
          >
            {cat}
          </Button>
        ))}
      </div>
    </div>

    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <Button 
        size="lg" 
        onClick={() => router.push('/courses')}
      >
        <Search className="w-4 h-4 mr-2" />
        Browse All Courses
      </Button>
      <Button 
        size="lg" 
        variant="outline"
        onClick={() => router.push('/')}
      >
        Learn More About PPR Academy
      </Button>
    </div>

    {/* Featured Courses Preview */}
    {featuredCourses && featuredCourses.length > 0 && (
      <div className="mt-16">
        <h3 className="text-xl font-semibold mb-6">Featured Courses</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredCourses.slice(0, 3).map(course => (
            <Card 
              key={course._id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push(`/courses/${course.slug}`)}
            >
              {/* Course card content */}
            </Card>
          ))}
        </div>
      </div>
    )}
  </div>
) : (
  // Existing enrolled courses grid
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {enrolledCourses.map((course) => (
      // Existing course card
    ))}
  </div>
)}
```

---

## 4️⃣ Add Featured Courses Query

### File: `convex/courses.ts` (ADD)

```typescript
// Get featured courses for homepage/library
export const getFeaturedCourses = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("courses"),
    _creationTime: v.number(),
    title: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    thumbnail: v.optional(v.string()),
    category: v.optional(v.string()),
    published: v.boolean(),
  })),
  handler: async (ctx, args) => {
    const limit = args.limit || 6;
    
    // Get published courses sorted by enrollments or creation date
    const courses = await ctx.db
      .query("courses")
      .filter((q) => q.eq(q.field("published"), true))
      .order("desc")
      .take(limit);

    return courses;
  },
});
```

---

## 5️⃣ Update Sign-Up Flow with Intent

### File: `app/sign-up/[[...sign-up]]/page.tsx` (MODIFY)

```tsx
import { SignUp } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const intent = searchParams.get('intent'); // 'creator' or 'student'
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-600 mt-2">
            {intent === 'creator' 
              ? "Join thousands of creators sharing their knowledge"
              : "Start your learning journey today"
            }
          </p>
        </div>
        <SignUp 
          appearance={{
            elements: {
              formButtonPrimary: "bg-[#6356FF] hover:bg-[#5248E6]",
              footerActionLink: "text-[#6356FF] hover:text-[#5248E6]"
            }
          }}
          redirectUrl={intent === 'creator' ? '/store/setup' : '/courses'}
        />
      </div>
    </div>
  );
}
```

---

## 6️⃣ Add Navigation Link to Header

### File: `components/dashboard/unified-dashboard.tsx` (MODIFY)

Add a "Browse Courses" link that's always visible:

```tsx
// In the dashboard header, add:

<div className="flex items-center gap-4 mb-8">
  <h1 className="text-3xl font-bold">
    Welcome back, {user.firstName}!
  </h1>
  <Button 
    variant="outline" 
    size="sm"
    onClick={() => router.push('/courses')}
  >
    <Search className="w-4 h-4 mr-2" />
    Browse Courses
  </Button>
</div>
```

---

## ✅ Testing Checklist

After implementing these changes, test:

### New Course Marketplace
- [ ] Navigate to `/courses` - should show all published courses
- [ ] Search functionality works
- [ ] Filters work (category, price)
- [ ] Sorting works
- [ ] Click on course card redirects to course detail page
- [ ] "Start Creating" CTA redirects to sign-up with creator intent

### Updated Landing Page
- [ ] Two CTAs visible: "Start Creating" and "Browse Courses"
- [ ] "Browse Courses" redirects to `/courses`
- [ ] Navigation has "Courses" link
- [ ] Sign-up flow captures intent from URL parameter

### Improved Library
- [ ] Empty state shows featured courses
- [ ] "Browse All Courses" button works
- [ ] Category quick links work
- [ ] Featured courses display correctly

### Sign-Up Flow
- [ ] `/sign-up?intent=creator` shows creator-focused messaging
- [ ] `/sign-up?intent=student` shows student-focused messaging
- [ ] Redirects work correctly based on intent

---

## 🎨 Styling Notes

All components use:
- **shadcn/ui** components (already installed)
- **Tailwind CSS** classes
- **Lucide React** icons
- Dark mode support via `dark:` classes

No additional packages required!

---

## 🚀 Deployment

1. **Run locally:**
   ```bash
   npm run dev
   ```

2. **Test all flows:**
   - Student journey: `/courses` → enroll → `/library`
   - Creator journey: `/sign-up?intent=creator` → store setup → dashboard

3. **Deploy:**
   ```bash
   npm run build
   vercel deploy
   ```

---

## 📊 Expected Impact

After implementing Phase 1:

**For Students:**
- ✅ Clear entry point (`/courses`)
- ✅ Easy course discovery
- ✅ No forced store creation
- ✅ Improved empty library state

**For Creators:**
- ✅ Clear sign-up intent
- ✅ Existing creator flow unchanged
- ✅ More visibility for their courses

**For Platform:**
- ✅ Lower friction for both user types
- ✅ Better conversion rates
- ✅ Clearer value proposition
- ✅ Improved user satisfaction

---

## 🔜 Next Steps

Once Phase 1 is complete and tested:

1. **Phase 2:** Implement onboarding flow with role selection
2. **Phase 3:** Add advanced search and recommendations
3. **Phase 4:** Build learning paths and community features

See `USER_JOURNEY_ANALYSIS.md` for full roadmap.

---

*Last Updated: October 8, 2025*


# PPR Academy - Marketplace Homepage Strategy

## 💡 Vision Statement

**Transform the homepage (`/`) into a marketplace-first experience where all courses and products from all creators are showcased together, making discovery immediate and intuitive.**

---

## 🎯 New Approach: Marketplace-First Homepage

### Concept
Instead of a traditional marketing landing page that requires clicking "Browse Courses" to see products, the homepage ITSELF becomes the marketplace - similar to:
- **Udemy**: Homepage shows courses from all instructors
- **Etsy**: Homepage displays products from all sellers
- **Gumroad**: Discover page showcases all creators' work
- **Skillshare**: Browse page IS the main experience

### Key Principle
**"Show, don't tell"** - Instead of explaining what PPR Academy offers, show users the actual courses, sample packs, and products immediately.

---

## 🏗️ Revised Homepage Structure

### Section 1: Hero + Live Search (Above the Fold)

```tsx
┌────────────────────────────────────────────────────┐
│  PPR ACADEMY                    [Dashboard] [Sign In]│
├────────────────────────────────────────────────────┤
│                                                    │
│     🎵 Discover Music Production Courses &         │
│        Products from Top Creators                  │
│                                                    │
│  [🔍 Search courses, sample packs, presets...]     │
│                                                    │
│  [All] [Courses] [Sample Packs] [Presets] [More]  │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Features:**
- Prominent search bar
- Category filter tabs
- Minimal marketing copy (one sentence)
- Immediate product visibility

---

### Section 2: Featured / Trending (Curated)

```tsx
┌────────────────────────────────────────────────────┐
│  ⭐ Featured This Week                              │
├────────────────────────────────────────────────────┤
│  [Course A]  [Course B]  [Product C]  [Course D]  │
│  Creator X   Creator Y   Creator Z    Creator A    │
│  $49         FREE        $29          $99          │
└────────────────────────────────────────────────────┘
```

**Logic:**
- Mix of courses and products
- Rotates weekly
- Highlights quality content
- Shows diversity of creators

---

### Section 3: All Courses (Grid View)

```tsx
┌────────────────────────────────────────────────────┐
│  📚 All Courses                    [Sort ▼] [⋮]    │
├────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ Course 1 │  │ Course 2 │  │ Course 3 │        │
│  │ by User A│  │ by User B│  │ by User C│        │
│  │ $49      │  │ FREE     │  │ $99      │        │
│  └──────────┘  └──────────┘  └──────────┘        │
│                                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ Course 4 │  │ Course 5 │  │ Course 6 │        │
│  └──────────┘  └──────────┘  └──────────┘        │
│                                                    │
│              [Load More Courses]                   │
└────────────────────────────────────────────────────┘
```

**Key Features:**
- Shows ALL published courses (not just 6)
- Infinite scroll or "Load More"
- Each card shows: thumbnail, title, creator, price
- Click goes directly to course detail page

---

### Section 4: All Digital Products (Grid View)

```tsx
┌────────────────────────────────────────────────────┐
│  🎹 Sample Packs & Digital Products   [Sort ▼] [⋮] │
├────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ Pack 1   │  │ Preset 2 │  │ Pack 3   │        │
│  │ by User D│  │ by User E│  │ by User F│        │
│  │ $19      │  │ $9       │  │ FREE     │        │
│  └──────────┘  └──────────┘  └──────────┘        │
│                                                    │
│              [Load More Products]                  │
└────────────────────────────────────────────────────┘
```

**Same pattern:**
- ALL published digital products
- Mix from all creators
- Filterable and sortable

---

### Section 5: Creator Spotlight (Rotating)

```tsx
┌────────────────────────────────────────────────────┐
│  ✨ Creator Spotlight                               │
├────────────────────────────────────────────────────┤
│  [Creator Avatar]                                  │
│  Featured Creator: John Doe                        │
│  "Techno producer & sound designer with 10 years   │
│   experience. Teaching 500+ students."             │
│                                                    │
│  [View John's Storefront →]                        │
│                                                    │
│  Top Products:                                     │
│  • Techno Drums Vol. 1                             │
│  • Complete Techno Production Course               │
│  • Berlin Techno Presets                           │
└────────────────────────────────────────────────────┘
```

**Rotates:**
- Changes weekly
- Highlights top creators
- Drives traffic to individual storefronts

---

### Section 6: Call-to-Action for Creators

```tsx
┌────────────────────────────────────────────────────┐
│  🚀 Are You a Creator?                              │
│                                                    │
│  Join hundreds of producers earning passive income │
│  by sharing their knowledge and sounds.            │
│                                                    │
│  ✓ Set your own prices                             │
│  ✓ Keep 90% of revenue                             │
│  ✓ Your own branded storefront                     │
│                                                    │
│     [Start Creating - Free] [See Examples]         │
└────────────────────────────────────────────────────┘
```

**Purpose:**
- Convert browsers into creators
- Still shows value prop
- Bottom of page (after showing products)

---

## 💻 Implementation Strategy

### Approach: Progressive Enhancement

Instead of completely rebuilding, we'll progressively transform the existing landing page:

#### Phase 1: Add Marketplace Sections (Week 1)
- Keep existing hero
- ADD "Featured This Week" section
- ADD "All Courses" grid section
- ADD "All Products" grid section

#### Phase 2: Simplify Hero (Week 2)
- Reduce hero section height
- Add search bar to hero
- Add category filter tabs
- Remove or condense marketing content

#### Phase 3: Optimize Performance (Week 3)
- Implement infinite scroll
- Add lazy loading for images
- Optimize queries (pagination)
- Add skeleton states

---

## 🚀 Implementation Code

### Updated `app/page.tsx` (Marketplace Homepage)

```tsx
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Search, TrendingUp, Sparkles, Music } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Simplified hero component
import { SimplifiedHero } from "./_components/simplified-hero";
import { CreatorCTA } from "./_components/creator-cta";

export default function MarketplaceHomepage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");

  // Fetch all published content
  const allCourses = useQuery(api.courses.getAllPublishedCourses);
  const allProducts = useQuery(api.digitalProducts.getAllPublishedProducts);
  const featuredContent = useQuery(api.marketplace.getFeaturedContent, { limit: 4 });
  const creatorSpotlight = useQuery(api.marketplace.getCreatorSpotlight);

  // Combine all content
  const allContent = useMemo(() => {
    const courses = (allCourses || []).map(c => ({ ...c, contentType: 'course' }));
    const products = (allProducts || []).map(p => ({ ...p, contentType: 'product' }));
    return [...courses, ...products];
  }, [allCourses, allProducts]);

  // Filter based on search and tab
  const filteredContent = useMemo(() => {
    let filtered = allContent;

    // Filter by tab
    if (selectedTab !== "all") {
      filtered = filtered.filter(item => item.contentType === selectedTab);
    }

    // Filter by search
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [allContent, selectedTab, searchTerm]);

  // Separate courses and products for sections
  const coursesOnly = filteredContent.filter(c => c.contentType === 'course');
  const productsOnly = filteredContent.filter(p => p.contentType === 'product');

  return (
    <div className="min-h-screen bg-background">
      {/* Simplified Hero with Search */}
      <section className="border-b bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Discover Music Production Courses & Products
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Learn from top creators. Download premium sample packs, presets, and project files.
            </p>

            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto mb-6">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Search courses, sample packs, presets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-14 text-lg"
              />
            </div>

            {/* Category Tabs */}
            <div className="flex justify-center gap-2 flex-wrap">
              <Button
                variant={selectedTab === "all" ? "default" : "outline"}
                onClick={() => setSelectedTab("all")}
              >
                All
              </Button>
              <Button
                variant={selectedTab === "course" ? "default" : "outline"}
                onClick={() => setSelectedTab("course")}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Courses
              </Button>
              <Button
                variant={selectedTab === "product" ? "default" : "outline"}
                onClick={() => setSelectedTab("product")}
              >
                <Music className="w-4 h-4 mr-2" />
                Products
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4">
        {/* Featured Content */}
        {featuredContent && featuredContent.length > 0 && (
          <section className="py-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold">Featured This Week</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredContent.map((item) => (
                <ContentCard key={item._id} content={item} featured />
              ))}
            </div>
          </section>
        )}

        {/* All Courses Section */}
        {(selectedTab === "all" || selectedTab === "course") && (
          <section className="py-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold">All Courses</h2>
                <Badge variant="secondary">{coursesOnly.length}</Badge>
              </div>
              {/* Sort dropdown could go here */}
            </div>
            
            {coursesOnly.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {coursesOnly.map((course) => (
                  <ContentCard key={course._id} content={course} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No courses found. Try adjusting your search.
              </div>
            )}
          </section>
        )}

        {/* All Products Section */}
        {(selectedTab === "all" || selectedTab === "product") && (
          <section className="py-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Music className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold">Sample Packs & Digital Products</h2>
                <Badge variant="secondary">{productsOnly.length}</Badge>
              </div>
            </div>
            
            {productsOnly.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {productsOnly.map((product) => (
                  <ContentCard key={product._id} content={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No products found. Try adjusting your search.
              </div>
            )}
          </section>
        )}

        {/* Creator Spotlight */}
        {creatorSpotlight && (
          <section className="py-12">
            <CreatorSpotlightCard creator={creatorSpotlight} />
          </section>
        )}
      </div>

      {/* Creator CTA at Bottom */}
      <CreatorCTA />
    </div>
  );
}

// Reusable Content Card Component
function ContentCard({ content, featured = false }: { content: any; featured?: boolean }) {
  const router = useRouter();
  
  const handleClick = () => {
    if (content.contentType === 'course') {
      router.push(`/courses/${content.slug}`);
    } else {
      // Handle product click - could go to product detail or direct download
      if (content.downloadUrl) {
        window.open(content.downloadUrl, '_blank');
      }
    }
  };

  return (
    <Card 
      className={`overflow-hidden hover:shadow-lg transition-all cursor-pointer group ${
        featured ? 'border-primary/50' : ''
      }`}
      onClick={handleClick}
    >
      {/* Thumbnail */}
      <div className="relative h-40 bg-gradient-to-br from-gray-100 to-gray-200">
        {content.thumbnail || content.imageUrl ? (
          <img
            src={content.thumbnail || content.imageUrl}
            alt={content.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {content.contentType === 'course' ? (
              <BookOpen className="w-12 h-12 text-gray-400" />
            ) : (
              <Music className="w-12 h-12 text-gray-400" />
            )}
          </div>
        )}
        
        {/* Content Type Badge */}
        <Badge className="absolute top-2 left-2">
          {content.contentType === 'course' ? 'Course' : 'Product'}
        </Badge>
        
        {/* Price Badge */}
        <Badge className="absolute top-2 right-2 bg-white text-gray-900 font-semibold">
          {content.price === 0 ? 'FREE' : `$${content.price}`}
        </Badge>

        {/* Featured Badge */}
        {featured && (
          <Badge className="absolute bottom-2 left-2 bg-primary text-white">
            <Sparkles className="w-3 h-3 mr-1" />
            Featured
          </Badge>
        )}
      </div>

      <CardContent className="p-4">
        <div className="space-y-2">
          {/* Title */}
          <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
            {content.title}
          </h3>
          
          {/* Creator */}
          <p className="text-sm text-muted-foreground">
            by {content.creatorName || 'Creator'}
          </p>

          {/* Category */}
          {content.category && (
            <Badge variant="outline" className="text-xs">
              {content.category}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Creator Spotlight Component
function CreatorSpotlightCard({ creator }: { creator: any }) {
  const router = useRouter();
  
  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
      <CardContent className="p-8">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Creator Spotlight</h2>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6 items-center">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white text-3xl font-bold shrink-0">
            {creator.avatar ? (
              <img src={creator.avatar} alt={creator.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              creator.name.charAt(0)
            )}
          </div>

          <div className="flex-1 text-center md:text-left">
            <h3 className="text-2xl font-bold mb-2">{creator.name}</h3>
            <p className="text-muted-foreground mb-4">{creator.bio}</p>
            
            <div className="flex gap-4 justify-center md:justify-start mb-4">
              <div>
                <div className="text-2xl font-bold">{creator.totalProducts}</div>
                <div className="text-sm text-muted-foreground">Products</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{creator.totalStudents}</div>
                <div className="text-sm text-muted-foreground">Students</div>
              </div>
            </div>

            <Button onClick={() => router.push(`/${creator.slug}`)}>
              View Storefront →
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 📊 New Convex Queries Needed

### `convex/marketplace.ts` (NEW FILE)

```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

// Get featured content (mix of courses and products)
export const getFeaturedContent = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const limit = args.limit || 6;
    
    // Get featured courses
    const featuredCourses = await ctx.db
      .query("courses")
      .filter((q) => 
        q.and(
          q.eq(q.field("published"), true),
          q.eq(q.field("featured"), true) // Add 'featured' field to schema
        )
      )
      .take(3);

    // Get featured products
    const featuredProducts = await ctx.db
      .query("digitalProducts")
      .filter((q) =>
        q.and(
          q.eq(q.field("published"), true),
          q.eq(q.field("featured"), true) // Add 'featured' field to schema
        )
      )
      .take(3);

    // Combine and shuffle
    const combined = [
      ...featuredCourses.map(c => ({ ...c, contentType: 'course' })),
      ...featuredProducts.map(p => ({ ...p, contentType: 'product' })),
    ];

    // Shuffle and limit
    return combined
      .sort(() => Math.random() - 0.5)
      .slice(0, limit);
  },
});

// Get creator spotlight (rotates weekly)
export const getCreatorSpotlight = query({
  args: {},
  returns: v.union(v.object({
    _id: v.id("users"),
    name: v.string(),
    slug: v.string(),
    bio: v.optional(v.string()),
    avatar: v.optional(v.string()),
    totalProducts: v.number(),
    totalStudents: v.number(),
  }), v.null()),
  handler: async (ctx) => {
    // Logic to select spotlight creator
    // Could be based on: most sales, most students, manual selection, rotation, etc.
    
    // For now, get creator with most published content
    const stores = await ctx.db.query("stores").collect();
    
    if (stores.length === 0) return null;

    // Get store with most courses + products
    const storesWithCounts = await Promise.all(
      stores.map(async (store) => {
        const coursesCount = await ctx.db
          .query("courses")
          .withIndex("by_store", (q) => q.eq("storeId", store._id))
          .filter((q) => q.eq(q.field("published"), true))
          .collect()
          .then(c => c.length);

        const productsCount = await ctx.db
          .query("digitalProducts")
          .withIndex("by_store", (q) => q.eq("storeId", store._id))
          .collect()
          .then(p => p.length);

        const studentsCount = await ctx.db
          .query("purchases")
          .filter((q) => q.eq(q.field("storeId"), store._id))
          .collect()
          .then(p => new Set(p.map(x => x.userId)).size);

        return {
          store,
          totalProducts: coursesCount + productsCount,
          studentsCount,
        };
      })
    );

    // Sort by total products
    storesWithCounts.sort((a, b) => b.totalProducts - a.totalProducts);

    const topStore = storesWithCounts[0];
    if (!topStore) return null;

    // Get user info
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), topStore.store.userId))
      .first();

    if (!user) return null;

    return {
      _id: user._id,
      name: user.name || "Creator",
      slug: topStore.store.slug,
      bio: user.bio,
      avatar: user.imageUrl,
      totalProducts: topStore.totalProducts,
      totalStudents: topStore.studentsCount,
    };
  },
});
```

### `convex/digitalProducts.ts` (ADD QUERY)

```typescript
// Get all published products across all stores
export const getAllPublishedProducts = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("digitalProducts"),
    _creationTime: v.number(),
    title: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    imageUrl: v.optional(v.string()),
    category: v.optional(v.string()),
    storeId: v.id("stores"),
    published: v.boolean(),
    downloadUrl: v.optional(v.string()),
    creatorName: v.optional(v.string()),
  })),
  handler: async (ctx) => {
    const products = await ctx.db
      .query("digitalProducts")
      .filter((q) => q.eq(q.field("published"), true))
      .collect();

    // Enrich with creator names
    const enrichedProducts = await Promise.all(
      products.map(async (product) => {
        const store = await ctx.db.get(product.storeId);
        const user = store ? await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("clerkId"), store.userId))
          .first() : null;

        return {
          ...product,
          creatorName: user?.name || store?.name || "Creator",
        };
      })
    );

    return enrichedProducts;
  },
});
```

---

## 🎨 Schema Updates Needed

### `convex/schema.ts` (ADD FIELDS)

```typescript
// Add to courses table:
courses: defineTable({
  // ... existing fields
  featured: v.optional(v.boolean()), // NEW: For featured section
  // ... rest of fields
}),

// Add to digitalProducts table:
digitalProducts: defineTable({
  // ... existing fields
  featured: v.optional(v.boolean()), // NEW: For featured section
  // ... rest of fields
}),
```

---

## ✅ Benefits of This Approach

### For Students
1. **Immediate Discovery**: See all content without clicking around
2. **Cross-Creator Browse**: Find best content regardless of creator
3. **Easier Comparison**: See prices, categories, creators side-by-side
4. **No Login Required**: Browse entire marketplace anonymously

### For Creators
5. **More Visibility**: Courses appear on homepage, not just storefront
6. **Equal Opportunity**: All creators' content shown together
7. **Network Effects**: Platform grows, everyone benefits
8. **Featured Spots**: Chance to be highlighted

### For Platform
9. **Lower Bounce Rate**: Immediate value on landing
10. **Better SEO**: All products indexed from root domain
11. **Higher Conversions**: Less friction to browse → buy
12. **True Marketplace**: Positions PPR as discovery platform

---

## 🚦 Migration Strategy

### Option A: Gradual Transition (Recommended)

**Week 1:**
- Keep existing landing page
- Add "Featured Content" section below hero
- Add "Browse All" link

**Week 2:**
- Add "All Courses" section
- Add "All Products" section
- Reduce hero section height

**Week 3:**
- Add search bar to hero
- Add category tabs
- Remove redundant marketing content

**Week 4:**
- Final polish
- Performance optimization
- A/B test if needed

### Option B: Complete Overhaul

- Create new page at `/marketplace`
- Test with subset of users
- Switch root to marketplace when validated
- Keep old landing as `/about` or `/for-creators`

---

## 📈 Success Metrics

### Before (Current State)
- Homepage bounce rate: ~60-70%
- Time on homepage: 10-20 seconds
- Click-through to courses: Low
- Course enrollments: Baseline

### After (Marketplace Homepage)
- Homepage bounce rate: Target 30-40%
- Time on homepage: 2-3 minutes (browsing)
- Click-through to courses: 40-50%
- Course enrollments: 2-3x increase

---

## 🎯 Comparison: Marketing Page vs Marketplace Page

| Aspect | Marketing Page (Old) | Marketplace Page (New) |
|--------|---------------------|----------------------|
| **First Impression** | Value proposition text | Actual products |
| **Clicks to Browse** | 2-3 clicks | 0 clicks (scroll) |
| **Content Visible** | ~0 products | ALL products |
| **For Students** | "What is this?" | "I can buy this!" |
| **For Creators** | "How do I sell?" | "Look at all these sellers!" |
| **Discovery** | Limited | Immediate |
| **Trust** | Promises | Proof (real products) |

---

## 💡 Inspiration Examples

### Gumroad Discover Page
- Shows all products from all creators
- Simple grid layout
- Minimal chrome, maximum content
- **PPR can do the same!**

### Udemy Homepage
- Categories at top
- Courses from all instructors
- Featured/trending sections
- **Same concept, music niche!**

### Etsy Homepage
- Search bar prominent
- Products from all shops
- Category filters
- **Marketplace-first approach!**

---

## 🔮 Future Enhancements

### Phase 2: Personalization
- Show relevant courses based on:
  - Previous browsing
  - Previous purchases
  - Similar users' preferences

### Phase 3: Social Features
- "Trending Now" section
- "Popular This Week"
- User reviews on cards
- Social proof indicators

### Phase 4: Advanced Discovery
- "Because you viewed X"
- "Courses often bought together"
- Learning paths
- Curated collections

---

## ✅ Action Items

### Immediate (This Week)
- [ ] Create `getAllPublishedProducts` query
- [ ] Create `marketplace.ts` with featured/spotlight queries
- [ ] Add `featured` field to courses & products schemas
- [ ] Build `ContentCard` component
- [ ] Build simplified hero component

### Next Week
- [ ] Implement new homepage layout
- [ ] Add search functionality
- [ ] Add category tabs
- [ ] Test performance with real data

### Week 3
- [ ] Creator spotlight feature
- [ ] Featured content rotation
- [ ] A/B test with subset of users
- [ ] Gather feedback

### Week 4
- [ ] Final optimization
- [ ] Deploy to production
- [ ] Monitor metrics
- [ ] Iterate based on data

---

## 🎬 Conclusion

**Your instinct is spot on!** 

A marketplace-first homepage where all courses and products are showcased together is much better than a traditional marketing landing page for your use case. It:

1. **Shows immediate value** (products, not promises)
2. **Enables discovery** (students can browse everything)
3. **Builds trust** (see real creators and content)
4. **Reduces friction** (no extra clicks needed)
5. **Creates network effects** (more content = more value)

This transforms PPR Academy from "creator tool with courses" to **"marketplace for music education and products"** - which is much more compelling!

---

*Last Updated: October 8, 2025*


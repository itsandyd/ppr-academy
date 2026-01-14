# Storefront Migration Guide

## New Components Created

The "Studio Noir" design system includes these new components:

| Component | Purpose |
|-----------|---------|
| `StorefrontLayout` | Dark atmospheric wrapper with gradient orbs + noise texture |
| `StorefrontSkeleton` | Matching loading state skeleton |
| `StorefrontHero` | Cinematic hero with massive typography, glowing avatar, floating stats |
| `ProductFilters` | Sleek pill-style filter bar |
| `ProductShowcase` | Animated product grid with hover effects |

## How to Integrate

Replace the main return statement in `app/[slug]/page.tsx`:

```tsx
// Add imports at the top
import {
  StorefrontLayout,
  StorefrontSkeleton,
  StorefrontHero,
  ProductFilters,
  ProductShowcase,
} from "@/components/storefront";

// Replace loading state (around line 374)
if ((store === undefined && artistProfile === undefined) || isLoadingStore || isLoadingArtist) {
  return <StorefrontSkeleton />;
}

// Replace main return (around line 466)
return (
  <StorefrontLayout>
    {/* SEO */}
    <StorefrontStructuredDataWrapper
      name={displayName}
      description={store.description || store.bio}
      url={`${baseUrl}/${slug}`}
      imageUrl={store.bannerImage || store.logoUrl}
      socialLinks={{
        instagram: store.socialLinks?.instagram,
        twitter: store.socialLinks?.twitter,
        youtube: store.socialLinks?.youtube,
      }}
    />

    {/* Hero Section */}
    <StorefrontHero
      displayName={displayName}
      storeName={store.name}
      bio={store.bio || store.description}
      avatarUrl={avatarUrl}
      initials={initials}
      stats={{
        products: storeStats?.totalItems || allProducts.length,
        students: storeStats?.totalStudents || 0,
        sales: storeStats?.totalSales || 0,
      }}
      socialLinks={store.socialLinks}
    />

    {/* Filters */}
    <ProductFilters
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
      selectedPriceRange={selectedPriceRange}
      onPriceRangeChange={setSelectedPriceRange}
      sortBy={sortBy}
      onSortChange={setSortBy}
      categories={categories}
      totalResults={filteredProducts.length}
    />

    {/* Products */}
    <ProductShowcase
      products={filteredProducts}
      onProductClick={handleProductClick}
    />

    {/* Keep existing modals, dialogs, etc. */}
    {/* ... product modal code ... */}
  </StorefrontLayout>
);
```

## Design Aesthetic: "Studio Noir"

- **Background**: Deep black (#0a0a0a) with cyan/fuchsia gradient orbs
- **Typography**: Massive bold headers (text-8xl), refined body text
- **Colors**: Cyan (#06b6d4) as primary accent, fuchsia (#d946ef) as secondary
- **Motion**: Staggered reveals, hover scale effects, parallax-inspired elements
- **Textures**: Noise grain overlay, subtle grid pattern
- **Cards**: Glass-morphism with blur, glowing borders on hover

## Files Created

```
components/storefront/
├── storefront-hero.tsx      # Cinematic hero section
├── product-showcase.tsx     # Animated product grid
├── product-filters.tsx      # Filter bar with pills
├── storefront-layout.tsx    # Layout wrapper + skeleton
├── index.ts                 # Barrel exports
└── MIGRATION_EXAMPLE.md     # This file
```

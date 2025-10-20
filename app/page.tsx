"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MarketplaceHero } from "./_components/marketplace-hero";
import { MarketplaceStats } from "./_components/marketplace-stats";
import { MarketplaceSection } from "./_components/marketplace-section";
import { FeatureGrid } from "./_components/feature-grid";
import { HowItWorks } from "./_components/how-it-works";
import { FinalCTA } from "./_components/final-cta";
import { Footer } from "./_components/footer";
import { BookOpen, Package, Layers, Sparkles } from "lucide-react";

// Force dynamic rendering to avoid build-time Clerk issues
export const dynamic = 'force-dynamic';

export default function SectionedMarketplace() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // Keep for hero component

  // Fetch data
  const courses = useQuery(api.courses.getAllPublishedCourses) || [];
  const products = useQuery(api.digitalProducts.getAllPublishedProducts) || [];
  const samplePacks = useQuery(api.samplePacks?.getAllPublishedSamplePacks as any) || [];
  const platformStats = useQuery(api.marketplace?.getPlatformStats as any);

  // Transform data to include contentType
  const coursesWithType = useMemo(() => 
    courses.map((c: any) => ({ ...c, contentType: 'course' as const })),
    [courses]
  );

  const productsWithType = useMemo(() => 
    products.map((p: any) => ({ ...p, contentType: 'product' as const })),
    [products]
  );

  const samplePacksWithType = useMemo(() => 
    samplePacks.map((sp: any) => ({ ...sp, contentType: 'sample-pack' as const })),
    [samplePacks]
  );

  // Filter by search term
  const filterBySearch = (items: any[]) => {
    if (!searchTerm) return items;
    const searchLower = searchTerm.toLowerCase();
    return items.filter((item: any) =>
      item.title?.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower) ||
      item.creatorName?.toLowerCase().includes(searchLower)
    );
  };

  const filteredCourses = useMemo(() => filterBySearch(coursesWithType), [coursesWithType, searchTerm]);
  const filteredProducts = useMemo(() => filterBySearch(productsWithType), [productsWithType, searchTerm]);
  const filteredSamplePacks = useMemo(() => filterBySearch(samplePacksWithType), [samplePacksWithType, searchTerm]);

  // Stats with defaults
  const stats = {
    totalCreators: platformStats?.totalCreators || 0,
    totalCourses: platformStats?.totalCourses || courses.length,
    totalProducts: platformStats?.totalProducts || products.length + samplePacks.length,
    totalStudents: platformStats?.totalStudents || 0,
  };

  // Determine if we're showing search results
  const isSearching = searchTerm.length > 0;
  const totalResults = filteredCourses.length + filteredProducts.length + filteredSamplePacks.length;

  return (
    <div className="min-h-screen bg-background">
      {/* 1. HERO + SEARCH */}
      <MarketplaceHero
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        totalCourses={stats.totalCourses}
        totalProducts={stats.totalProducts}
        totalCreators={stats.totalCreators}
      />

      {/* 2. PLATFORM STATS */}
      {platformStats && !isSearching && (stats.totalCreators > 0 || stats.totalCourses > 0 || stats.totalProducts > 0) && (
        <MarketplaceStats
          totalCreators={stats.totalCreators}
          totalCourses={stats.totalCourses}
          totalProducts={stats.totalProducts}
          totalStudents={stats.totalStudents}
        />
      )}

      {/* Search Results Header */}
      {isSearching && (
        <section className="py-8 bg-muted/40">
          <div className="mx-auto w-full max-w-[1140px] px-6">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-primary" />
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  Search Results for "{searchTerm}"
                </h2>
                <p className="text-muted-foreground">
                  Found {totalResults} {totalResults === 1 ? "result" : "results"}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. ALL COURSES SECTION */}
      {filteredCourses.length > 0 && (
        <MarketplaceSection
          title="All Courses"
          subtitle={`${filteredCourses.length} expert-led courses to master music production`}
          icon={<BookOpen className="w-6 h-6 text-primary-foreground" />}
          content={filteredCourses}
          viewAllLink="/courses"
          emptyMessage="No courses available yet."
          limit={isSearching ? undefined : 6}
          gradient="from-chart-1 to-chart-2"
        />
      )}

      {/* 4. ALL SAMPLE PACKS SECTION */}
      {filteredSamplePacks.length > 0 && (
        <MarketplaceSection
          title="Sample Packs"
          subtitle={`${filteredSamplePacks.length} professional sample collections`}
          icon={<Layers className="w-6 h-6 text-secondary-foreground" />}
          content={filteredSamplePacks}
          viewAllLink="/sample-packs"
          emptyMessage="No sample packs available yet."
          limit={isSearching ? undefined : 6}
          gradient="from-secondary to-chart-5"
        />
      )}

      {/* 5. ALL DIGITAL PRODUCTS SECTION */}
      {filteredProducts.length > 0 && (
        <MarketplaceSection
          title="Digital Products"
          subtitle={`${filteredProducts.length} presets, templates, and tools`}
          icon={<Package className="w-6 h-6 text-accent-foreground" />}
          content={filteredProducts}
          viewAllLink="/products"
          emptyMessage="No products available yet."
          limit={isSearching ? undefined : 6}
          gradient="from-accent to-chart-4"
        />
      )}

      {/* No Results Message */}
      {isSearching && totalResults === 0 && (
        <section className="py-20">
          <div className="mx-auto w-full max-w-[1140px] px-6 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-foreground">No results found</h3>
            <p className="text-muted-foreground mb-6">
              We couldn't find anything matching "{searchTerm}". Try different keywords or browse all content below.
            </p>
            <button
              onClick={() => setSearchTerm("")}
              className="text-primary hover:text-primary/80 font-medium"
            >
              Clear search and view all content
            </button>
          </div>
        </section>
      )}

      {/* Only show marketing sections if NOT searching */}
      {!isSearching && (
        <>
          {/* 6. VALUE PROPOSITIONS */}
          <FeatureGrid />

          {/* 7. HOW IT WORKS */}
          <HowItWorks />

          {/* 8. FINAL CREATOR CTA */}
          <FinalCTA />
        </>
      )}

      {/* 9. FOOTER (always show) */}
      <Footer />
    </div>
  );
}

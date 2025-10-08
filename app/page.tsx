"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MarketplaceHero } from "./_components/marketplace-hero";
import { MarketplaceStats } from "./_components/marketplace-stats";
import { MarketplaceGrid } from "./_components/marketplace-grid";
import { FeatureGrid } from "./_components/feature-grid";
import { HowItWorks } from "./_components/how-it-works";
import { FinalCTA } from "./_components/final-cta";
import { Footer } from "./_components/footer";
import { TabsContent, Tabs } from "@/components/ui/tabs";

// Force dynamic rendering to avoid build-time Clerk issues
export const dynamic = 'force-dynamic';

export default function HybridHomepage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Fetch data
  const courses = useQuery(api.courses.getAllPublishedCourses) || [];
  const products = useQuery(api.digitalProducts.getAllPublishedProducts) || [];
  const platformStats = useQuery(api.marketplace?.getPlatformStats as any);

  // Combine content
  const allContent = useMemo(() => {
    return [
      ...courses.map((c: any) => ({ ...c, contentType: 'course' as const })),
      ...products.map((p: any) => ({ ...p, contentType: 'product' as const })),
    ];
  }, [courses, products]);

  // Filter content based on search and active tab
  const filteredContent = useMemo(() => {
    let filtered = allContent;

    // Filter by tab
    if (activeTab !== "all") {
      filtered = filtered.filter((item: any) => item.contentType === activeTab);
    }

    // Filter by search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((item: any) =>
        item.title?.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower) ||
        item.creatorName?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [allContent, activeTab, searchTerm]);

  // Separate by type for tab content
  const coursesOnly = filteredContent.filter((c: any) => c.contentType === 'course');
  const productsOnly = filteredContent.filter((p: any) => p.contentType === 'product');

  // Stats with defaults
  const stats = {
    totalCreators: platformStats?.totalCreators || 0,
    totalCourses: platformStats?.totalCourses || courses.length,
    totalProducts: platformStats?.totalProducts || products.length,
    totalStudents: platformStats?.totalStudents || 0,
  };

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
      {platformStats && (
        <MarketplaceStats
          totalCreators={stats.totalCreators}
          totalCourses={stats.totalCourses}
          totalProducts={stats.totalProducts}
          totalStudents={stats.totalStudents}
        />
      )}

      {/* 3. MAIN CONTENT GRID */}
      <section className="py-16 md:py-24 bg-background">
        <div className="mx-auto w-full max-w-[1140px] px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="all" className="mt-0">
              <div className="mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  {searchTerm ? `Search Results for "${searchTerm}"` : "All Content"}
                </h2>
                <p className="text-muted-foreground">
                  {filteredContent.length} {filteredContent.length === 1 ? "item" : "items"} available
                </p>
              </div>
              <MarketplaceGrid
                content={filteredContent}
                emptyMessage={searchTerm ? `No results found for "${searchTerm}". Try different keywords.` : "No content available yet. Check back soon!"}
              />
            </TabsContent>

            <TabsContent value="course" className="mt-0">
              <div className="mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  {searchTerm ? `Course Results for "${searchTerm}"` : "All Courses"}
                </h2>
                <p className="text-muted-foreground">
                  {coursesOnly.length} {coursesOnly.length === 1 ? "course" : "courses"} available
                </p>
              </div>
              <MarketplaceGrid
                content={coursesOnly}
                emptyMessage={searchTerm ? `No courses found for "${searchTerm}". Try different keywords.` : "No courses available yet. Check back soon!"}
              />
            </TabsContent>

            <TabsContent value="product" className="mt-0">
              <div className="mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  {searchTerm ? `Product Results for "${searchTerm}"` : "All Products"}
                </h2>
                <p className="text-muted-foreground">
                  {productsOnly.length} {productsOnly.length === 1 ? "product" : "products"} available
                </p>
              </div>
              <MarketplaceGrid
                content={productsOnly}
                emptyMessage={searchTerm ? `No products found for "${searchTerm}". Try different keywords.` : "No products available yet. Check back soon!"}
              />
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* 4. VALUE PROPOSITIONS (from your existing design) */}
      <FeatureGrid />

      {/* 5. HOW IT WORKS */}
      <HowItWorks />

      {/* 6. FINAL CREATOR CTA (from your existing design) */}
      <FinalCTA />

      {/* 7. FOOTER (from your existing design) */}
      <Footer />
    </div>
  );
}

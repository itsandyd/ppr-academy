import { fetchQuery } from "convex/nextjs";
import { api } from "@/lib/convex-api";
import { HomepageContent } from "./_components/homepage-content";
import { HomepageStructuredData } from "./_components/HomepageStructuredData";
import { MarketplaceNavbar } from "@/components/marketplace-navbar";
import { Footer } from "./_components/footer";

export const revalidate = 3600;

export default async function HomePage() {
  const [courses, products, samplePacks, abletonRacks, platformStats, featuredCreators] =
    await Promise.all([
      fetchQuery(api.courses.getAllPublishedCourses).catch(() => []),
      fetchQuery(api.digitalProducts.getAllPublishedProducts).catch(() => []),
      fetchQuery(api.samplePacks.getAllPublishedSamplePacks).catch(() => []),
      fetchQuery(api.abletonRacks.getPublishedAbletonRacks, {}).catch(() => []),
      fetchQuery(api.marketplace.getPlatformStats).catch(() => null),
      fetchQuery(api.marketplace.getAllCreators, { limit: 6 }).catch(() => []),
    ]);

  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <HomepageStructuredData />
      <MarketplaceNavbar />
      <HomepageContent
        courses={courses ?? []}
        products={products ?? []}
        samplePacks={samplePacks ?? []}
        abletonRacks={abletonRacks ?? []}
        platformStats={platformStats}
        featuredCreators={featuredCreators ?? []}
      />
      <Footer />
    </div>
  );
}

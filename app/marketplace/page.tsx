import { Suspense } from "react";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/lib/convex-api";
import { MarketplaceContent } from "./_components/marketplace-content";
import { MarketplaceNavbar } from "@/components/marketplace-navbar";

export const revalidate = 3600;

type ContentType = "all" | "courses" | "products" | "coaching" | "sample-packs" | "plugins" | "ableton-racks" | "bundles";
type PriceRange = "free" | "under-10" | "10-25" | "25-50" | "50-100" | "over-100";
type SortBy = "newest" | "popular" | "price-low" | "price-high";

const VALID_CONTENT_TYPES: ContentType[] = ["all", "courses", "products", "coaching", "sample-packs", "plugins", "ableton-racks", "bundles"];
const VALID_PRICE_RANGES: PriceRange[] = ["free", "under-10", "10-25", "25-50", "50-100", "over-100"];
const VALID_SORT_BY: SortBy[] = ["newest", "popular", "price-low", "price-high"];

const ITEMS_PER_PAGE = 18;

export default async function MarketplacePage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;

  // Parse filter values from URL
  const typeParam = typeof searchParams.type === "string" ? searchParams.type : undefined;
  const contentType: ContentType = VALID_CONTENT_TYPES.includes(typeParam as ContentType)
    ? (typeParam as ContentType)
    : "all";
  const selectedCategory = typeof searchParams.category === "string" ? searchParams.category : undefined;
  const subcategoriesParam = typeof searchParams.subcategories === "string" ? searchParams.subcategories : undefined;
  const selectedSpecificCategories = subcategoriesParam?.split(",").filter(Boolean) || [];
  const priceParam = typeof searchParams.price === "string" ? searchParams.price : undefined;
  const priceRange: PriceRange | undefined = VALID_PRICE_RANGES.includes(priceParam as PriceRange)
    ? (priceParam as PriceRange)
    : undefined;
  const sortParam = typeof searchParams.sort === "string" ? searchParams.sort : undefined;
  const sortBy: SortBy = VALID_SORT_BY.includes(sortParam as SortBy)
    ? (sortParam as SortBy)
    : "newest";
  const searchTerm = typeof searchParams.q === "string" ? searchParams.q : "";
  const pageParam = typeof searchParams.page === "string" ? searchParams.page : "1";
  const currentPage = Math.max(1, parseInt(pageParam, 10) || 1);

  const isPlugins = contentType === "plugins";

  const [
    marketplaceData,
    categories,
    creators,
    stats,
    justAdded,
    pluginCategories,
    specificCategories,
  ] = await Promise.all([
    fetchQuery(api.marketplace.searchMarketplace, {
      searchTerm: searchTerm || undefined,
      contentType: contentType === "all" ? undefined : contentType,
      category: selectedCategory,
      specificCategories:
        selectedSpecificCategories.length > 0 ? selectedSpecificCategories : undefined,
      priceRange,
      sortBy,
      limit: ITEMS_PER_PAGE,
      offset: (currentPage - 1) * ITEMS_PER_PAGE,
    }).catch(() => ({ results: [], total: 0 })),
    fetchQuery(api.marketplace.getMarketplaceCategories, {
      contentType: contentType !== "plugins" ? contentType : undefined,
    }).catch(() => []),
    fetchQuery(api.marketplace.getAllCreators, { limit: 8 }).catch(() => []),
    fetchQuery(api.marketplace.getPlatformStats).catch(() => null),
    fetchQuery(api.marketplace.getJustAdded, { limit: 10 }).catch(() => []),
    isPlugins
      ? fetchQuery(api.plugins.getPluginCategories, {}).catch(() => [])
      : Promise.resolve([]),
    isPlugins
      ? fetchQuery(api.plugins.getAllSpecificCategories, {}).catch(() => [])
      : Promise.resolve([]),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceNavbar />
      <Suspense
        fallback={
          <div className="flex min-h-[50vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        }
      >
        <MarketplaceContent
          marketplaceData={marketplaceData ?? { results: [], total: 0 }}
          categories={categories ?? []}
          creators={creators ?? []}
          stats={stats}
          justAdded={justAdded ?? []}
          pluginCategories={pluginCategories ?? []}
          specificCategories={specificCategories ?? []}
        />
      </Suspense>
    </div>
  );
}

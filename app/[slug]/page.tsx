import { fetchQuery } from "convex/nextjs";
import { api } from "@/lib/convex-api";
import { notFound } from "next/navigation";
import { StorefrontContent } from "./_components/StorefrontContent";
import { ArtistProfileView } from "./_components/ArtistProfileView";

export const revalidate = 3600;

interface StorefrontPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function StorefrontPage({ params }: StorefrontPageProps) {
  const { slug } = await params;

  // Fetch store and artist profile in parallel
  const [store, artistProfile] = await Promise.all([
    fetchQuery(api.stores.getStoreBySlug, { slug }).catch(() => null),
    fetchQuery(api.musicShowcase.getArtistProfileBySlug, { slug }).catch(() => null),
  ]);

  // Determine if store has products (need to fetch to check)
  let user = null;
  let products = null;
  let courses = null;
  let storeStats = null;
  let coachProfiles = null;
  let bundles = null;
  let membershipTiers = null;

  if (store) {
    // Fetch all store-related data in parallel
    const results = await Promise.all([
      fetchQuery(api.users.getUserFromClerk, { clerkId: store.userId }).catch(() => null),
      fetchQuery(api.digitalProducts.getPublishedProductsByStore, { storeId: store._id }).catch(() => null),
      fetchQuery(api.courses.getPublishedCoursesByStore, { storeId: store._id }).catch(() => null),
      fetchQuery(api.storeStats.getQuickStoreStats, { storeId: store._id }).catch(() => null),
      fetchQuery(api.adminCoach.getActiveCoachProfilesByUserId, { userId: store.userId }).catch(() => null),
      fetchQuery(api.bundles.getPublishedBundles, { storeId: store._id }).catch(() => null),
      fetchQuery(api.memberships.getStoreMemberships, { storeId: store._id }).catch(() => null),
    ]);

    [user, products, courses, storeStats, coachProfiles, bundles, membershipTiers] = results;
  }

  const hasProducts = (products && products.length > 0) || (courses && courses.length > 0);
  const shouldShowStore = !!store && hasProducts;
  const shouldShowArtistProfile = !!artistProfile && !shouldShowStore;

  // Show artist profile if no store or store has no products
  if (shouldShowArtistProfile) {
    return (
      <ArtistProfileView
        displayName={artistProfile.displayName || artistProfile.artistName}
        userId={artistProfile.userId}
      />
    );
  }

  // Store not found and no artist profile
  if (!store && !artistProfile) {
    notFound();
  }

  // No store to display
  if (!store) {
    notFound();
  }

  return (
    <StorefrontContent
      slug={slug}
      store={store}
      user={user}
      products={products}
      courses={courses}
      storeStats={storeStats}
      coachProfiles={coachProfiles}
      bundles={bundles}
      membershipTiers={membershipTiers}
    />
  );
}

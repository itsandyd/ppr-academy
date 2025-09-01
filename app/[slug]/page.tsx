"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { use } from "react";
import { notFound } from "next/navigation";
import { Loader2 } from "lucide-react";
import { DesktopStorefront } from "./components/DesktopStorefront";
import { MobileStorefront } from "./components/MobileStorefront";
import { useEffect, useState } from "react";

interface StorefrontPageProps {
  params: Promise<{
    slug: string;
  }>;
}



export default function StorefrontPage({ params }: StorefrontPageProps) {
  // Unwrap the params Promise
  const { slug } = use(params);
  
  // Track if we're on desktop or mobile
  const [isDesktop, setIsDesktop] = useState(false);
  
  useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024); // lg breakpoint
    };
    
    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);
    
    return () => window.removeEventListener('resize', checkIsDesktop);
  }, []);
  
  // Fetch store by slug
  const store = useQuery(
    api.stores.getStoreBySlug,
    { slug: slug }
  );

  // Fetch user data if store exists
  const user = useQuery(
    api.users.getUserByClerkId,
    store ? { clerkId: store.userId } : "skip"
  );

  // Fetch products for this store
  const products = useQuery(
    api.digitalProducts.getProductsByStore,
    store ? { storeId: store._id } : "skip"
  );

  // Loading state
  if (store === undefined || user === undefined || products === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-lg text-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  // Store not found
  if (store === null) {
    notFound();
  }

  // Get display name and avatar
  const displayName = user?.name || "Store Owner";
  const initials = displayName
    .split(" ")
    .map((name: string) => name.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const avatarUrl = user?.imageUrl || "";

  // Check if there are lead magnets (price: 0)
  const leadMagnets = products?.filter(p => p.price === 0 && p.style === "card") || [];
  const hasLeadMagnets = leadMagnets.length > 0;
  const latestLeadMagnet = hasLeadMagnets ? leadMagnets.sort((a, b) => b._creationTime - a._creationTime)[0] : null;

  const leadMagnetData = latestLeadMagnet ? {
    title: latestLeadMagnet.title,
    subtitle: latestLeadMagnet.description,
    imageUrl: latestLeadMagnet.imageUrl,
    ctaText: latestLeadMagnet.buttonLabel,
    downloadUrl: latestLeadMagnet.downloadUrl
  } : null;

  return (
    <div className="min-h-screen bg-background">
      {isDesktop ? (
        <DesktopStorefront 
          store={store}
          user={user}
          products={products as any || []}
          displayName={displayName}
          initials={initials}
          avatarUrl={avatarUrl}
        />
      ) : (
        <MobileStorefront 
          store={store}
          user={user}
          products={products as any || []}
          displayName={displayName}
          initials={initials}
          avatarUrl={avatarUrl}
          leadMagnetData={leadMagnetData}
        />
      )}
    </div>
  );
} 
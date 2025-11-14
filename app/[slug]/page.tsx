"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { use } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Loader2, Search, Filter, BookOpen, Play, Users, Star, X, ExternalLink, Download, ShoppingCart, ArrowRight, Package, Waves } from "lucide-react";
import { DesktopStorefront } from "./components/DesktopStorefront";
import { MobileStorefront } from "./components/MobileStorefront";
import { SubscriptionSection } from "./components/SubscriptionSection";
import { CreatorsPicks } from "@/components/storefront/creators-picks";
import { FollowCreatorCTA } from "@/components/storefront/follow-creator-cta";
import { AnimatedFilterResults, AnimatedGridItem } from "@/components/ui/animated-filter-transitions";
import { StorefrontStructuredDataWrapper } from "./components/StorefrontStructuredDataWrapper";
import { ArtistShowcase } from "@/components/music/artist-showcase";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ppracademy.com";

interface StorefrontPageProps {
  params: Promise<{
    slug: string;
  }>;
}



export default function StorefrontPage({ params }: StorefrontPageProps) {
  // Unwrap the params Promise
  const { slug } = use(params);
  const router = useRouter();
  
  // Track if we're on desktop or mobile
  const [isDesktop, setIsDesktop] = useState(false);
  
  // Enhanced filtering and search state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPriceRange, setSelectedPriceRange] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  
  // Product modal state
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmittedEmail, setHasSubmittedEmail] = useState(false);
  
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

  // Fetch artist profile by slug (for Linktree-style profiles)
  const artistProfile = useQuery(
    api.musicShowcase.getArtistProfileBySlug,
    { slug: slug }
  );

  // Fetch user data if store exists
  const user = useQuery(
    api.users.getUserFromClerk,
    store ? { clerkId: store.userId } : "skip"
  );

  // Fetch user data for artist profile if no store
  const artistUser = useQuery(
    api.users.getUserFromClerk,
    artistProfile && !store ? { clerkId: artistProfile.userId } : "skip"
  );

  // Fetch published products for this store (public storefront only shows published)
  const products = useQuery(
    api.digitalProducts.getPublishedProductsByStore,
    store ? { storeId: store._id } : "skip"
  );

  // Fetch published courses from Convex (public storefront only shows published)
  const courses = useQuery(
    api.courses.getPublishedCoursesByStore,
    store ? { storeId: store._id } : "skip"
  );

  // Fetch connected social accounts for this store
  const socialAccounts = useQuery(
    api.socialMedia?.getSocialAccounts as any,
    store ? { storeId: store._id } : "skip"
  );

  // Fetch store statistics
  const storeStats = useQuery(
    api.storeStats.getQuickStoreStats,
    store ? { storeId: store._id } : "skip"
  );

  // TODO: Fetch coaching profiles for this store
  // const coachProfiles = useQuery(
  //   api.coachProfiles.getProfilesByStore,
  //   store ? { storeId: store._id } : "skip"
  // );

  // Combine all product types into unified list with enhanced metadata
  const allProducts = useMemo(() => [
    // Digital Products (preserve existing productType or default to "digitalProduct")
    ...(products || []).map(product => ({
      ...product,
      slug: (product as any).slug || product._id,
      productType: product.productType || "digitalProduct",
      category: (product as any).category || "Digital Product",
      icon: Play,
      badgeColor: "bg-blue-100 text-blue-800",
    })),
    
    // Courses (add course-specific properties)
    ...(courses || []).map(course => ({
      ...course,
      slug: course.slug || course._id,
      productType: "course",
      category: course.category || "Course",
      style: undefined, // Courses don't have style
      buttonLabel: "Enroll Now", // Default CTA for courses
      icon: BookOpen,
      badgeColor: "bg-green-100 text-green-800",
    })),
    
    // TODO: Add coaching profiles when available
    // ...(coachProfiles || []).map(profile => ({
    //   ...profile,
    //   productType: "coaching",
    //   category: "Coaching",
    //   price: profile.basePrice,
    //   title: profile.title,
    //   description: profile.description,
    //   buttonLabel: "Book Session",
    //   icon: Users,
    //   badgeColor: "bg-purple-100 text-purple-800",
    // }))
  ], [products, courses]);

  // Enhanced filtering and search logic
  const filteredProducts = useMemo(() => {
    let filtered = [...allProducts];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.category || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(product => product.productType === selectedCategory);
    }

    // Price range filter
    if (selectedPriceRange !== "all") {
      switch (selectedPriceRange) {
        case "free":
          filtered = filtered.filter(product => (product.price || 0) === 0);
          break;
        case "under50":
          filtered = filtered.filter(product => (product.price || 0) > 0 && (product.price || 0) < 50);
          break;
        case "50to100":
          filtered = filtered.filter(product => (product.price || 0) >= 50 && (product.price || 0) <= 100);
          break;
        case "over100":
          filtered = filtered.filter(product => (product.price || 0) > 100);
          break;
      }
    }

    // Sort products
    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => b._creationTime - a._creationTime);
        break;
      case "oldest":
        filtered.sort((a, b) => a._creationTime - b._creationTime);
        break;
      case "price-low":
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case "price-high":
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case "title":
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return filtered;
  }, [allProducts, searchTerm, selectedCategory, selectedPriceRange, sortBy]);

  // Get unique categories for filter dropdown
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(allProducts.map(p => p.productType))];
    return uniqueCategories.map(cat => ({
      value: cat,
      label: cat === "digitalProduct" ? "Digital Product" : 
             cat === "course" ? "Course" : 
             cat === "coaching" ? "Coaching" : cat
    }));
  }, [allProducts]);

  // Check if there are lead magnets (price: 0)
  const leadMagnets = products?.filter(p => p.price === 0 && (p.style === "card" || p.style === "callout")) || [];
  const hasLeadMagnets = leadMagnets.length > 0;
  const latestLeadMagnet = hasLeadMagnets ? leadMagnets.sort((a, b) => b._creationTime - a._creationTime)[0] : null;

  const leadMagnetData = latestLeadMagnet ? {
    title: latestLeadMagnet.title,
    subtitle: latestLeadMagnet.description,
    imageUrl: latestLeadMagnet.imageUrl,
    ctaText: latestLeadMagnet.buttonLabel,
    downloadUrl: latestLeadMagnet.downloadUrl
  } : null;

  // Click handlers
  const handleProductClick = (product: any) => {
    if (product.productType === "course") {
      router.push(`/courses/${product.slug}`);
    } else {
      // Reset form state
      setEmail("");
      setName("");
      setHasSubmittedEmail(false);
      // Debug: Log product to check URL fields
      console.log("🔍 Product clicked:", product.title);
      console.log("📦 Full product data:", product);
      console.log("📥 downloadUrl:", product.downloadUrl);
      console.log("🔗 url:", product.url);
      console.log("✅ Has downloadUrl:", !!product.downloadUrl);
      console.log("✅ Has url:", !!product.url);
      console.log("🔑 All product keys:", Object.keys(product));
      // Open modal for digital products
      setSelectedProduct(product);
      setProductModalOpen(true);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !selectedProduct) return;

    setIsSubmitting(true);
    try {
      // TODO: Submit to Convex to store lead/contact
      console.log("Capturing lead:", { email, name, productId: selectedProduct._id, storeId: store?._id });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setHasSubmittedEmail(true);
    } catch (error) {
      console.error("Failed to capture email:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDownload = (product: any) => {
    if (product.downloadUrl) {
      window.open(product.downloadUrl, '_blank');
    } else if (product.url) {
      window.open(product.url, '_blank');
    }
    // Don't close modal immediately
    setTimeout(() => {
      setProductModalOpen(false);
    }, 1000);
  };

  const handleStartStorefront = () => {
    router.push('/sign-up?intent=creator');
  };

  const handleSeeExamples = () => {
    router.push('/courses'); // or wherever you want to show examples
  };

  const handleLeadMagnetClick = () => {
    if (leadMagnetData?.downloadUrl) {
      window.open(leadMagnetData.downloadUrl, '_blank');
    }
  };

  // Determine page type: store storefront or artist profile
  const hasStore = !!store;
  const hasProducts = (products && products.length > 0) || (courses && courses.length > 0);
  const hasArtistProfile = !!artistProfile;
  const shouldShowStore = hasStore && hasProducts;
  const shouldShowArtistProfile = hasArtistProfile && !shouldShowStore;

  // Enhanced loading state with skeleton
  // If we have a store, wait for store data. Otherwise, wait for artist profile data.
  const isLoadingStore = store === undefined || (store && (user === undefined || products === undefined || courses === undefined));
  const isLoadingArtist = !store && (artistProfile === undefined || (artistProfile && artistUser === undefined));
  
  // Show loading if we're still determining what to show
  if ((store === undefined && artistProfile === undefined) || isLoadingStore || isLoadingArtist) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header Skeleton */}
        <div className="border-b bg-white">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-4">
              <Skeleton className="w-16 h-16 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Skeleton */}
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>

          {/* Products Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-4" />
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-9 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show artist profile if no store or store has no products
  if (shouldShowArtistProfile && artistProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        {/* Header */}
        <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="font-semibold">{artistProfile.displayName || artistProfile.artistName}</h1>
                <p className="text-sm text-muted-foreground hidden sm:block">Music Showcase</p>
              </div>
            </div>
          </div>
        </div>

        {/* Artist Showcase Content */}
        <div className="container mx-auto px-4 py-8">
          <ArtistShowcase 
            artistProfileId={artistProfile.userId} 
            isOwner={false}
          />
        </div>
      </div>
    );
  }

  // Store not found and no artist profile
  if (store === null && artistProfile === null) {
    notFound();
  }

  // If we get here, show store storefront
  if (!store) {
    return null; // Should not happen, but safety check
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

  return (
    <div className="min-h-screen bg-background">
      {/* Structured Data for SEO */}
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

      {/* Enhanced Header with Stats and Social */}
      <div className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 lg:gap-8">
            {/* Avatar */}
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold text-2xl flex-shrink-0 shadow-lg">
              {avatarUrl ? (
                <Image src={avatarUrl} alt={displayName} width={96} height={96} className="w-full h-full rounded-full object-cover" />
              ) : (
                initials
              )}
            </div>
            
            {/* Name, Bio, and Stats */}
            <div className="flex-1 text-center lg:text-left min-w-0">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{displayName}</h1>
              <p className="text-lg text-muted-foreground mb-4">{store.name}</p>
              
              {/* Bio if available */}
              {(store.bio || store.description) && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2 max-w-2xl">
                  {store.bio || store.description}
                </p>
              )}
              
              {/* Stats Row */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 md:gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Star className="w-5 h-5 text-primary fill-current" />
                  </div>
                  <div className="text-left">
                    <div className="text-2xl font-bold text-foreground">{storeStats?.totalItems || allProducts.length}</div>
                    <div className="text-xs text-muted-foreground">Products</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-chart-2/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-chart-2" />
                  </div>
                  <div className="text-left">
                    <div className="text-2xl font-bold text-foreground">{storeStats?.totalStudents || 0}</div>
                    <div className="text-xs text-muted-foreground">Students</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-chart-3/10 flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-chart-3" />
                  </div>
                  <div className="text-left">
                    <div className="text-2xl font-bold text-foreground">{storeStats?.totalSales || 0}</div>
                    <div className="text-xs text-muted-foreground">Sales</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media Links - Desktop */}
            {(store.socialLinks?.instagram || store.socialLinks?.twitter || store.socialLinks?.youtube || store.socialLinks?.tiktok || store.socialLinks?.spotify) && (
              <div className="hidden lg:flex flex-col items-end gap-3">
                <span className="text-sm font-medium text-muted-foreground">Connect</span>
                <div className="flex flex-wrap gap-2 justify-end">
                  {store.socialLinks?.instagram && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-10 h-10 rounded-full hover:bg-[#E4405F]/10 hover:border-[#E4405F] hover:text-[#E4405F] transition-colors"
                      asChild
                    >
                      <a href={store.socialLinks.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      </a>
                    </Button>
                  )}
                  
                  {store.socialLinks?.twitter && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-10 h-10 rounded-full hover:bg-[#1DA1F2]/10 hover:border-[#1DA1F2] hover:text-[#1DA1F2] transition-colors"
                      asChild
                    >
                      <a href={store.socialLinks.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      </a>
                    </Button>
                  )}
                  
                  {store.socialLinks?.youtube && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-10 h-10 rounded-full hover:bg-[#FF0000]/10 hover:border-[#FF0000] hover:text-[#FF0000] transition-colors"
                      asChild
                    >
                      <a href={store.socialLinks.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                      </a>
                    </Button>
                  )}
                  
                  {store.socialLinks?.tiktok && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-10 h-10 rounded-full hover:bg-black/10 dark:hover:bg-white/10 hover:border-foreground transition-colors"
                      asChild
                    >
                      <a href={store.socialLinks.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                        </svg>
                      </a>
                    </Button>
                  )}
                  
                  {store.socialLinks?.spotify && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-10 h-10 rounded-full hover:bg-[#1DB954]/10 hover:border-[#1DB954] hover:text-[#1DB954] transition-colors"
                      asChild
                    >
                      <a href={store.socialLinks.spotify} target="_blank" rel="noopener noreferrer" aria-label="Spotify">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                        </svg>
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Social Media Links - Mobile */}
          {(store.socialLinks?.instagram || store.socialLinks?.twitter || store.socialLinks?.youtube || store.socialLinks?.tiktok || store.socialLinks?.spotify) && (
            <div className="flex lg:hidden flex-col items-center gap-3 mt-4 pt-4 border-t border-border">
              <span className="text-sm font-medium text-muted-foreground">Connect</span>
              <div className="flex flex-wrap gap-2 justify-center">
                {store.socialLinks?.instagram && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-10 h-10 rounded-full hover:bg-[#E4405F]/10 hover:border-[#E4405F] hover:text-[#E4405F] transition-colors"
                    asChild
                  >
                    <a href={store.socialLinks.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </a>
                  </Button>
                )}
                
                {store.socialLinks?.twitter && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-10 h-10 rounded-full hover:bg-[#1DA1F2]/10 hover:border-[#1DA1F2] hover:text-[#1DA1F2] transition-colors"
                    asChild
                  >
                    <a href={store.socialLinks.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    </a>
                  </Button>
                )}
                
                {store.socialLinks?.youtube && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-10 h-10 rounded-full hover:bg-[#FF0000]/10 hover:border-[#FF0000] hover:text-[#FF0000] transition-colors"
                    asChild
                  >
                    <a href={store.socialLinks.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                    </a>
                  </Button>
                )}
                
                {store.socialLinks?.tiktok && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-10 h-10 rounded-full hover:bg-black/10 dark:hover:bg-white/10 hover:border-foreground transition-colors"
                    asChild
                  >
                    <a href={store.socialLinks.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                      </svg>
                    </a>
                  </Button>
                )}
                
                {store.socialLinks?.spotify && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-10 h-10 rounded-full hover:bg-[#1DB954]/10 hover:border-[#1DB954] hover:text-[#1DB954] transition-colors"
                    asChild
                  >
                    <a href={store.socialLinks.spotify} target="_blank" rel="noopener noreferrer" aria-label="Spotify">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                      </svg>
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Search and Filters */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Search & Filter
              </h2>
              <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search products, courses, and more..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Price Range Filter */}
            <Select value={selectedPriceRange} onValueChange={setSelectedPriceRange}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="All Prices" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="under50">Under $50</SelectItem>
                <SelectItem value="50to100">$50 - $100</SelectItem>
                <SelectItem value="over100">Over $100</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-36">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="title">Title A-Z</SelectItem>
              </SelectContent>
            </Select>
              </div>
            </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
            {searchTerm && ` for "${searchTerm}"`}
          </p>
          {(searchTerm || selectedCategory !== "all" || selectedPriceRange !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
                setSelectedPriceRange("all");
                setSortBy("newest");
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* Products Organized by Category */}
        {filteredProducts.length > 0 ? (
          <AnimatedFilterResults filterKey={`${selectedCategory}-${selectedPriceRange}-${searchTerm}-${sortBy}`}>
            {/* Group products by type when showing all categories */}
            {selectedCategory === "all" && !searchTerm ? (
              <div className="space-y-12">
                {/* Ableton Racks Section */}
                {(() => {
                  const abletonRacks = filteredProducts.filter(p => 
                    p.productType === "abletonRack" || p.productType === "abletonPreset"
                  );
                  if (abletonRacks.length === 0) return null;
                  return (
                    <div>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-chart-2/10 flex items-center justify-center">
                          <Waves className="w-5 h-5 text-chart-2" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold">Ableton Racks</h2>
                          <p className="text-sm text-muted-foreground">Professional audio effect racks and presets</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {abletonRacks.map((product) => {
                          const IconComponent = product.icon;
                          return (
                            <Card key={product._id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200 group">
                              <div className="relative h-48 bg-gradient-to-br from-muted to-muted/80">
                                {product.imageUrl ? (
                                  <Image
                                    src={product.imageUrl}
                                    alt={product.title}
                                    width={640}
                                    height={192}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <IconComponent className="w-12 h-12 text-muted-foreground" />
                                  </div>
                                )}
                                <Badge className={`absolute top-3 left-3 ${product.badgeColor}`}>
                                  <IconComponent className="w-3 h-3 mr-1" />
                                  Ableton Rack
                                </Badge>
                                <Badge className="absolute top-3 right-3 bg-card text-card-foreground font-semibold border border-border">
                                  {product.price === 0 ? "FREE" : `$${product.price}`}
                                </Badge>
                              </div>
                              <CardContent className="p-4">
                                <div className="space-y-3">
                                  <div>
                                    <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                                      {product.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                      {product.description}
                                    </p>
                                  </div>
                                  <Button 
                                    className="w-full"
                                    onClick={() => handleProductClick(product)}
                                  >
                                    {product.buttonLabel || "View Details"}
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Courses Section */}
                {(() => {
                  const courses = filteredProducts.filter(p => p.productType === "course");
                  if (courses.length === 0) return null;
                  return (
                    <div>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-chart-1/10 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-chart-1" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold">Courses</h2>
                          <p className="text-sm text-muted-foreground">In-depth video courses and tutorials</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map((product) => {
                          const IconComponent = product.icon;
                          return (
                            <Card key={product._id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200 group">
                              <div className="relative h-48 bg-gradient-to-br from-muted to-muted/80">
                                {product.imageUrl ? (
                                  <Image
                                    src={product.imageUrl}
                                    alt={product.title}
                                    width={640}
                                    height={192}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <IconComponent className="w-12 h-12 text-muted-foreground" />
                                  </div>
                                )}
                                <Badge className={`absolute top-3 left-3 ${product.badgeColor}`}>
                                  <IconComponent className="w-3 h-3 mr-1" />
                                  Course
                                </Badge>
                                <Badge className="absolute top-3 right-3 bg-card text-card-foreground font-semibold border border-border">
                                  {product.price === 0 ? "FREE" : `$${product.price}`}
                                </Badge>
                              </div>
                              <CardContent className="p-4">
                                <div className="space-y-3">
                                  <div>
                                    <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                                      {product.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                      {product.description}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>{product.category}</span>
                                    {(product as any).skillLevel && (
                                      <>
                                        <span>•</span>
                                        <span>{(product as any).skillLevel}</span>
                                      </>
                                    )}
                                  </div>
                                  <Button 
                                    className="w-full"
                                    onClick={() => handleProductClick(product)}
                                  >
                                    {product.buttonLabel || "Enroll Now"}
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Digital Products Section */}
                {(() => {
                  const digitalProducts = filteredProducts.filter(p => 
                    p.productType === "digital" || p.productType === "digitalProduct" || !p.productType
                  );
                  if (digitalProducts.length === 0) return null;
                  return (
                    <div>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-chart-3/10 flex items-center justify-center">
                          <Package className="w-5 h-5 text-chart-3" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold">Digital Products</h2>
                          <p className="text-sm text-muted-foreground">Sample packs, templates, and downloadable content</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {digitalProducts.map((product) => {
                          const IconComponent = product.icon;
                          return (
                            <Card key={product._id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200 group">
                              <div className="relative h-48 bg-gradient-to-br from-muted to-muted/80">
                                {product.imageUrl ? (
                                  <Image
                                    src={product.imageUrl}
                                    alt={product.title}
                                    width={640}
                                    height={192}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <IconComponent className="w-12 h-12 text-muted-foreground" />
                                  </div>
                                )}
                                <Badge className={`absolute top-3 left-3 ${product.badgeColor}`}>
                                  <IconComponent className="w-3 h-3 mr-1" />
                                  Digital
                                </Badge>
                                <Badge className="absolute top-3 right-3 bg-card text-card-foreground font-semibold border border-border">
                                  {product.price === 0 ? "FREE" : `$${product.price}`}
                                </Badge>
                              </div>
                              <CardContent className="p-4">
                                <div className="space-y-3">
                                  <div>
                                    <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                                      {product.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                      {product.description}
                                    </p>
                                  </div>
                                  <Button 
                                    className="w-full"
                                    onClick={() => handleProductClick(product)}
                                  >
                                    {product.buttonLabel || "Get Access"}
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* URL/Media Section */}
                {(() => {
                  const urlMedia = filteredProducts.filter(p => p.productType === "urlMedia");
                  if (urlMedia.length === 0) return null;
                  return (
                    <div>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                          <ExternalLink className="w-5 h-5 text-purple-500" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold">Links & Media</h2>
                          <p className="text-sm text-muted-foreground">External resources and curated content</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {urlMedia.map((product) => {
                          const IconComponent = product.icon;
                          return (
                            <Card key={product._id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200 group">
                              <div className="relative h-48 bg-gradient-to-br from-muted to-muted/80">
                                {product.imageUrl ? (
                                  <Image
                                    src={product.imageUrl}
                                    alt={product.title}
                                    width={640}
                                    height={192}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <ExternalLink className="w-12 h-12 text-muted-foreground" />
                                  </div>
                                )}
                                <Badge className="absolute top-3 left-3 bg-purple-500/10 text-purple-500 dark:bg-purple-500/20 dark:text-purple-400">
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  Link
                                </Badge>
                                <Badge className="absolute top-3 right-3 bg-card text-card-foreground font-semibold border border-border">
                                  {product.price === 0 ? "FREE" : `$${product.price}`}
                                </Badge>
                              </div>
                              <CardContent className="p-4">
                                <div className="space-y-3">
                                  <div>
                                    <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                                      {product.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                      {product.description}
                                    </p>
                                  </div>
                                  <Button 
                                    className="w-full"
                                    onClick={() => handleProductClick(product)}
                                  >
                                    {product.buttonLabel || "Visit Link"}
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Coaching Section */}
                {(() => {
                  const coaching = filteredProducts.filter(p => p.productType === "coaching");
                  if (coaching.length === 0) return null;
                  return (
                    <div>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                          <Users className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold">Coaching</h2>
                          <p className="text-sm text-muted-foreground">One-on-one sessions and personalized guidance</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {coaching.map((product) => {
                          return (
                            <Card key={product._id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200 group">
                              <div className="relative h-48 bg-gradient-to-br from-muted to-muted/80">
                                {product.imageUrl ? (
                                  <Image
                                    src={product.imageUrl}
                                    alt={product.title}
                                    width={640}
                                    height={192}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Users className="w-12 h-12 text-muted-foreground" />
                                  </div>
                                )}
                                <Badge className="absolute top-3 left-3 bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-400">
                                  <Users className="w-3 h-3 mr-1" />
                                  Coaching
                                </Badge>
                                <Badge className="absolute top-3 right-3 bg-card text-card-foreground font-semibold border border-border">
                                  {product.price === 0 ? "FREE" : `$${product.price}`}
                                </Badge>
                              </div>
                              <CardContent className="p-4">
                                <div className="space-y-3">
                                  <div>
                                    <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                                      {product.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                      {product.description}
                                    </p>
                                  </div>
                                  <Button 
                                    className="w-full"
                                    onClick={() => handleProductClick(product)}
                                  >
                                    {product.buttonLabel || "Book Session"}
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              /* Show flat grid when filtering or searching */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => {
              const IconComponent = product.icon;
              return (
                <Card key={product._id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200 group">
                  {/* Product Image */}
                  <div className="relative h-48 bg-gradient-to-br from-muted to-muted/80">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.title}
                        width={640}
                        height={192}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <IconComponent className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    {/* Product Type Badge */}
                    <Badge className={`absolute top-3 left-3 ${product.badgeColor}`}>
                      <IconComponent className="w-3 h-3 mr-1" />
                      {product.productType === "digitalProduct" ? "Digital" : 
                       product.productType === "course" ? "Course" : 
                       product.productType}
                    </Badge>
                    {/* Price Badge */}
                    <Badge className="absolute top-3 right-3 bg-card text-card-foreground font-semibold border border-border">
                      {product.price === 0 ? "FREE" : `$${product.price}`}
                    </Badge>
                  </div>

                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                          {product.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {product.description}
                        </p>
                      </div>

                      {/* Category and Meta */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{product.category}</span>
                        {(product as any).skillLevel && (
                          <>
                            <span>•</span>
                            <span>{(product as any).skillLevel}</span>
                          </>
                        )}
                      </div>

                      {/* Action Button */}
                      <Button 
                        className="w-full"
                        onClick={() => handleProductClick(product)}
                      >
                        {product.buttonLabel || (product.productType === "course" ? "Enroll Now" : "Get Access")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
              </div>
            )}
          </AnimatedFilterResults>
        ) : (
          /* No Results State */
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search or filter criteria
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
                setSelectedPriceRange("all");
              }}
            >
              Clear All Filters
            </Button>
          </div>
        )}

        {/* Lead Magnet Section (if exists) */}
        {leadMagnetData && (
          <div className="mt-12 p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">🎁 Free Resource</h3>
              <h4 className="text-lg font-semibold mb-2">{leadMagnetData.title}</h4>
              <p className="text-muted-foreground mb-4">{leadMagnetData.subtitle}</p>
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-primary to-primary/80"
                onClick={handleLeadMagnetClick}
              >
                {leadMagnetData.ctaText || "Download Free"}
              </Button>
            </div>
          </div>
        )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* About Store Card */}
            <Card className="bg-card border-border sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Star className="w-5 h-5 text-primary" />
                  About This Store
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm font-medium">Products</span>
                    <Badge variant="secondary">{storeStats?.totalItems || allProducts.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm font-medium">Students</span>
                    <Badge variant="secondary">{storeStats?.totalStudents || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm font-medium">Sales</span>
                    <Badge variant="secondary">{storeStats?.totalSales || 0}</Badge>
                  </div>
                </div>

                {/* Creator Info */}
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold flex-shrink-0">
                      {avatarUrl ? (
                        <Image src={avatarUrl} alt={displayName} width={48} height={48} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        initials
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{displayName}</p>
                      <p className="text-xs text-muted-foreground truncate">{store.name}</p>
                    </div>
                  </div>
                  {(store.bio || store.description) && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {store.bio || store.description}
                    </p>
                  )}
                </div>

                {/* Social Links in Sidebar - Mobile Only Alternative */}
                {(store.socialLinks?.instagram || store.socialLinks?.twitter || store.socialLinks?.youtube || store.socialLinks?.tiktok || store.socialLinks?.spotify) && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm font-medium mb-3">Connect with me</p>
                    <div className="flex flex-wrap gap-2">
                      {store.socialLinks?.instagram && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 min-w-[80px] hover:bg-[#E4405F]/10 hover:border-[#E4405F] hover:text-[#E4405F]"
                          asChild
                        >
                          <a href={store.socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                            </svg>
                            Instagram
                          </a>
                        </Button>
                      )}
                      {store.socialLinks?.youtube && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 min-w-[80px] hover:bg-[#FF0000]/10 hover:border-[#FF0000] hover:text-[#FF0000]"
                          asChild
                        >
                          <a href={store.socialLinks.youtube} target="_blank" rel="noopener noreferrer">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                            </svg>
                            YouTube
                          </a>
                        </Button>
                      )}
                      {store.socialLinks?.spotify && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 min-w-[80px] hover:bg-[#1DB954]/10 hover:border-[#1DB954] hover:text-[#1DB954]"
                          asChild
                        >
                          <a href={store.socialLinks.spotify} target="_blank" rel="noopener noreferrer">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                            </svg>
                            Spotify
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

        {/* Enhanced Creator Call-to-Action Section */}
        <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="relative overflow-hidden">
          {/* Enhanced Background with Gradient & Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-chart-1/30 via-chart-2/20 to-chart-3/30 rounded-3xl"></div>
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
          
          {/* Floating Elements for Visual Interest */}
          <div className="absolute top-10 left-10 w-20 h-20 bg-chart-1/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-chart-3/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          
          <div className="relative p-8 md:p-16">
            <div className="max-w-5xl mx-auto">
              {/* Attention-Grabbing Pre-Headline */}
              <div className="text-center mb-8">
                <Badge className="mb-4 bg-gradient-to-r from-chart-1 to-chart-4 text-primary-foreground border-none px-6 py-2 text-base font-semibold shadow-lg">
                  🎵 For Music Creators Like {displayName}
                </Badge>
                
                {/* Power Headline with Benefit Focus */}
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                  <span className="bg-gradient-to-r from-chart-1 via-chart-2 to-chart-3 bg-clip-text text-transparent">
                    Build Your Own
                  </span>
                  <br />
                  <span className="text-foreground">Professional Storefront</span>
                </h2>
                
                {/* Compelling Sub-Headline */}
                <p className="text-xl md:text-2xl text-foreground/80 max-w-3xl mx-auto font-medium mb-4">
                  Sell sample packs, presets, courses, and coaching - all from your own link-in-bio storefront
                </p>
              </div>

              {/* Benefit-Driven Value Props */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="group bg-card/60 backdrop-blur-sm rounded-2xl p-6 border-2 border-border hover:border-chart-1/50 transition-all duration-300 hover:shadow-2xl hover:scale-105">
                  <div className="w-14 h-14 bg-gradient-to-br from-chart-1 to-chart-2 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg">
                    <BookOpen className="w-7 h-7 text-primary-foreground" aria-hidden="true" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-bold text-lg mb-2">All-in-One Platform</h3>
                    <p className="text-sm text-muted-foreground">Sell products, courses, and services from one professional storefront</p>
                  </div>
                </div>

                <div className="group bg-card/60 backdrop-blur-sm rounded-2xl p-6 border-2 border-border hover:border-chart-2/50 transition-all duration-300 hover:shadow-2xl hover:scale-105">
                  <div className="w-14 h-14 bg-gradient-to-br from-chart-2 to-chart-3 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg">
                    <Users className="w-7 h-7 text-primary-foreground" aria-hidden="true" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-bold text-lg mb-2">Your Brand, Your Way</h3>
                    <p className="text-sm text-muted-foreground">Custom branding perfect for Instagram, TikTok, and YouTube bios</p>
                  </div>
                </div>

                <div className="group bg-card/60 backdrop-blur-sm rounded-2xl p-6 border-2 border-border hover:border-chart-3/50 transition-all duration-300 hover:shadow-2xl hover:scale-105">
                  <div className="w-14 h-14 bg-gradient-to-br from-chart-3 to-chart-1 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg">
                    <Play className="w-7 h-7 text-primary-foreground" aria-hidden="true" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-bold text-lg mb-2">Setup in Minutes</h3>
                    <p className="text-sm text-muted-foreground">Get started quickly with our intuitive platform - no coding required</p>
                  </div>
                </div>
              </div>

              {/* Powerful CTA with Risk Reversal */}
              <div className="text-center">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
                  <Button 
                    size="lg" 
                    className="group relative bg-gradient-to-r from-chart-1 via-chart-2 to-chart-3 hover:opacity-90 text-primary-foreground px-12 py-7 text-xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 overflow-hidden"
                    onClick={handleStartStorefront}
                    aria-label="Start your free storefront"
                  >
                    <span className="relative z-10 flex items-center gap-3">
                      <span>Get Started Free</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-chart-2 via-chart-3 to-chart-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Button>
                </div>

                {/* Trust Signals & Guarantees */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm mb-4">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span>Free plan available</span>
                  </div>
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span>No credit card required</span>
                  </div>
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span>Setup in under 10 minutes</span>
                  </div>
                </div>

                {/* Final Trust Line */}
                <p className="text-sm text-muted-foreground">
                  Join producers and creators already earning with their own storefronts
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Section */}
      <SubscriptionSection 
        storeId={store._id}
        storeName={displayName}
      />

      {/* Fallback to original components for specific mobile optimizations if needed */}
      <div className="hidden">
        {isDesktop ? (
          <DesktopStorefront 
            store={store!}
            user={user!}
            products={allProducts as any || []}
            displayName={displayName}
            initials={initials}
            avatarUrl={avatarUrl}
            socialAccounts={socialAccounts || []}
          />
        ) : (
          <MobileStorefront 
            store={store!}
            user={user!}
            products={allProducts as any || []}
            displayName={displayName}
            initials={initials}
            avatarUrl={avatarUrl}
            leadMagnetData={leadMagnetData}
          />
        )}
      </div>

      {/* Product Details Modal */}
      <Dialog open={productModalOpen} onOpenChange={setProductModalOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col bg-white dark:bg-black">
          {selectedProduct && (
            <>
              <DialogHeader className="flex-shrink-0">
                <DialogTitle className="text-xl line-clamp-2">{selectedProduct.title}</DialogTitle>
                <DialogDescription>
                  {selectedProduct.category}
                </DialogDescription>
              </DialogHeader>
              
              <div className="overflow-y-auto flex-1 space-y-4 pr-2">
                {/* Product Image */}
                {selectedProduct.imageUrl && (
                  <div className="relative h-48 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={selectedProduct.imageUrl}
                      alt={selectedProduct.title}
                      width={640}
                      height={192}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Price Badge */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <Badge className="text-base px-3 py-1">
                    {selectedProduct.price === 0 ? "FREE" : `$${selectedProduct.price}`}
                  </Badge>
                  {selectedProduct.productType && (
                    <Badge variant="outline" className="text-xs">
                      {selectedProduct.productType === "digitalProduct" ? "Digital Product" : selectedProduct.productType}
                    </Badge>
                  )}
                </div>

                {/* Description - Scrollable */}
                {selectedProduct.description && (
                  <div className="flex-shrink-0">
                    <h3 className="font-semibold mb-2 text-sm">About this product</h3>
                    <div className="max-h-32 overflow-y-auto pr-2">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {selectedProduct.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Opt-in Form or Action Buttons */}
                {selectedProduct.price === 0 && !hasSubmittedEmail ? (
                  /* Show opt-in form for free products */
                  <div className="space-y-3 flex-shrink-0">
                    <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-3 rounded-lg border border-primary/20">
                      <h3 className="font-semibold mb-1 text-sm">🎁 Get Free Access</h3>
                      <p className="text-xs text-muted-foreground mb-3">
                        Enter your email to download this free resource instantly
                      </p>
                      <form onSubmit={handleEmailSubmit} className="space-y-2">
                        <div>
                          <label htmlFor="storefront-name" className="text-xs font-medium block mb-1">
                            Name (optional)
                          </label>
                          <Input
                            id="storefront-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your name"
                            className="bg-white dark:bg-black h-9 text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="storefront-email" className="text-xs font-medium block mb-1">
                            Email <span className="text-red-500">*</span>
                          </label>
                          <Input
                            id="storefront-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            className="bg-white dark:bg-black h-9 text-sm"
                          />
                        </div>
                        <Button 
                          type="submit"
                          className="w-full h-9 text-sm"
                          disabled={isSubmitting || !email}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4 mr-2" />
                              Get Free Access
                            </>
                          )}
                        </Button>
                      </form>
                      <p className="text-[10px] text-muted-foreground text-center mt-2">
                        🔒 We respect your privacy. Unsubscribe anytime.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Show action buttons after email submission or for paid products */
                  <div className="space-y-3 flex-shrink-0">
                    {hasSubmittedEmail && (
                      <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                        <p className="text-primary text-xs font-medium">
                          ✓ Email confirmed! Click below to access your download.
                        </p>
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-2">
                      {(selectedProduct.downloadUrl || selectedProduct.url) ? (
                        <>
                          <Button 
                            className="flex-1 h-9 text-sm"
                            onClick={() => {
                              console.log("Download button clicked for:", selectedProduct.title);
                              console.log("downloadUrl:", selectedProduct.downloadUrl);
                              console.log("url:", selectedProduct.url);
                              handleDownload(selectedProduct);
                            }}
                          >
                            {selectedProduct.downloadUrl ? (
                              <>
                                <Download className="w-4 h-4 mr-2" />
                                {selectedProduct.buttonLabel || "Download Now"}
                              </>
                            ) : selectedProduct.url ? (
                              <>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                {selectedProduct.buttonLabel || "Visit Link"}
                              </>
                            ) : (
                              <>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Access Product
                              </>
                            )}
                          </Button>
                          {selectedProduct.price > 0 && (
                            <Button 
                              variant="outline"
                              className="h-9 text-sm"
                              onClick={() => {
                                alert(`To purchase "${selectedProduct.title}", please contact ${displayName} directly.`);
                              }}
                            >
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              Purchase
                            </Button>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-xs text-muted-foreground mb-2">
                            ⚠️ Debug: No URL found for this product
                          </p>
                          <Button 
                            className="flex-1 h-9 text-sm"
                            onClick={() => {
                              const message = selectedProduct.price === 0 
                                ? `I'm interested in the free resource "${selectedProduct.title}".`
                                : `I'm interested in purchasing "${selectedProduct.title}" for $${selectedProduct.price}.`;
                              alert(`${message}\n\nPlease contact ${displayName} for more information.`);
                              setProductModalOpen(false);
                            }}
                          >
                            Contact {displayName}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
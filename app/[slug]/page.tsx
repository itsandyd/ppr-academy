"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { use } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import {
  Loader2,
  Search,
  Filter,
  BookOpen,
  Play,
  Users,
  Star,
  X,
  ExternalLink,
  Download,
  ShoppingCart,
  ArrowRight,
  Package,
  Waves,
} from "lucide-react";
import { DesktopStorefront } from "./components/DesktopStorefront";
import { MobileStorefront } from "./components/MobileStorefront";
import { SubscriptionSection } from "./components/SubscriptionSection";
import { CreatorsPicks } from "@/components/storefront/creators-picks";
import { FollowCreatorCTA } from "@/components/storefront/follow-creator-cta";
import {
  StorefrontLayout,
  StorefrontSkeleton,
  StorefrontHero,
  ProductFilters,
  ProductShowcase,
} from "@/components/storefront";
import {
  AnimatedFilterResults,
  AnimatedGridItem,
} from "@/components/ui/animated-filter-transitions";
import { StorefrontStructuredDataWrapper } from "./components/StorefrontStructuredDataWrapper";
import { ArtistShowcase } from "@/components/music/artist-showcase";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    window.addEventListener("resize", checkIsDesktop);

    return () => window.removeEventListener("resize", checkIsDesktop);
  }, []);

  // Fetch store by slug
  const store = useQuery(api.stores.getStoreBySlug, { slug: slug });

  // Fetch artist profile by slug (for Linktree-style profiles)
  const artistProfile = useQuery(api.musicShowcase.getArtistProfileBySlug, { slug: slug });

  // Fetch user data if store exists
  const user = useQuery(api.users.getUserFromClerk, store ? { clerkId: store.userId } : "skip");

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

  // Mutation for creating lead contacts
  const createContact = useMutation(api.emailContacts.createContact);

  // Combine all product types into unified list with enhanced metadata
  const allProducts = useMemo(
    () => [
      // Digital Products (preserve existing productType or default to "digitalProduct")
      ...(products || []).map((product: any) => ({
        ...product,
        slug: (product as any).slug || product._id,
        productType: product.productType || "digitalProduct",
        category: (product as any).category || "Digital Product",
        icon: Play,
        badgeColor: "bg-blue-100 text-blue-800",
      })),

      // Courses (add course-specific properties)
      ...(courses || []).map((course: any) => ({
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
    ],
    [products, courses]
  );

  // Enhanced filtering and search logic
  const filteredProducts = useMemo(() => {
    let filtered = [...allProducts];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (product.category || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((product) => product.productType === selectedCategory);
    }

    // Price range filter
    if (selectedPriceRange !== "all") {
      switch (selectedPriceRange) {
        case "free":
          filtered = filtered.filter((product) => (product.price || 0) === 0);
          break;
        case "under50":
          filtered = filtered.filter(
            (product) => (product.price || 0) > 0 && (product.price || 0) < 50
          );
          break;
        case "50to100":
          filtered = filtered.filter(
            (product) => (product.price || 0) >= 50 && (product.price || 0) <= 100
          );
          break;
        case "over100":
          filtered = filtered.filter((product) => (product.price || 0) > 100);
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
    const uniqueCategories = [...new Set(allProducts.map((p) => p.productType))];
    return uniqueCategories.map((cat) => ({
      value: cat,
      label:
        cat === "digitalProduct"
          ? "Digital Product"
          : cat === "course"
            ? "Course"
            : cat === "coaching"
              ? "Coaching"
              : cat,
    }));
  }, [allProducts]);

  // Check if there are lead magnets (price: 0)
  const leadMagnets =
    products?.filter((p: any) => p.price === 0 && (p.style === "card" || p.style === "callout")) ||
    [];
  const hasLeadMagnets = leadMagnets.length > 0;
  const latestLeadMagnet = hasLeadMagnets
    ? leadMagnets.sort((a: any, b: any) => b._creationTime - a._creationTime)[0]
    : null;

  const leadMagnetData = latestLeadMagnet
    ? {
        title: latestLeadMagnet.title,
        subtitle: latestLeadMagnet.description,
        imageUrl: latestLeadMagnet.imageUrl,
        ctaText: latestLeadMagnet.buttonLabel,
        downloadUrl: latestLeadMagnet.downloadUrl,
      }
    : null;

  // Click handlers
  const handleProductClick = (product: any) => {
    if (product.productType === "course") {
      router.push(`/courses/${product.slug}`);
    } else {
      // Reset form state
      setEmail("");
      setName("");
      setHasSubmittedEmail(false);
      // Open modal for digital products
      setSelectedProduct(product);
      setProductModalOpen(true);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !selectedProduct || !store) return;

    setIsSubmitting(true);
    try {
      // Parse name into first/last
      const nameParts = name.trim().split(" ");
      const firstName = nameParts[0] || undefined;
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : undefined;

      // Save lead to Convex emailContacts
      await createContact({
        storeId: store._id,
        email: email.toLowerCase(),
        firstName,
        lastName,
        source: "lead_magnet",
        sourceProductId: selectedProduct._id,
      });

      setHasSubmittedEmail(true);
    } catch (error: any) {
      // Handle duplicate contact gracefully
      if (error?.message?.includes("already exists")) {
        setHasSubmittedEmail(true); // Still show success - they're already subscribed
      } else {
        console.error("Failed to capture email:", error);
        alert("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = (product: any) => {
    if (product.downloadUrl) {
      window.open(product.downloadUrl, "_blank");
    } else if (product.url) {
      window.open(product.url, "_blank");
    }
    // Don't close modal immediately
    setTimeout(() => {
      setProductModalOpen(false);
    }, 1000);
  };

  const handleStartStorefront = () => {
    router.push("/sign-up?intent=creator");
  };

  const handleSeeExamples = () => {
    router.push("/courses"); // or wherever you want to show examples
  };

  const handleLeadMagnetClick = () => {
    if (leadMagnetData?.downloadUrl) {
      window.open(leadMagnetData.downloadUrl, "_blank");
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
  const isLoadingStore =
    store === undefined ||
    (store && (user === undefined || products === undefined || courses === undefined));
  const isLoadingArtist =
    !store && (artistProfile === undefined || (artistProfile && artistUser === undefined));

  // Show loading if we're still determining what to show
  if ((store === undefined && artistProfile === undefined) || isLoadingStore || isLoadingArtist) {
    return <StorefrontSkeleton />;
  }

  // Show artist profile if no store or store has no products
  if (shouldShowArtistProfile && artistProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="font-semibold">
                  {artistProfile.displayName || artistProfile.artistName}
                </h1>
                <p className="hidden text-sm text-muted-foreground sm:block">Music Showcase</p>
              </div>
            </div>
          </div>
        </div>

        {/* Artist Showcase Content */}
        <div className="container mx-auto px-4 py-8">
          <ArtistShowcase artistProfileId={artistProfile.userId} isOwner={false} />
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
    <StorefrontLayout>
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
        userId={store.userId}
      />

      {/* Main Content with Sidebar */}
      <div className="container mx-auto px-6 py-8 md:py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Main Content */}
          <div className="space-y-8 lg:col-span-3">
            {/* Search and Filters */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                <Filter className="h-5 w-5 text-cyan-400" />
                Search & Filter
              </h2>
              <div className="flex flex-col gap-4 md:flex-row">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
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
                    {categories.map((cat) => (
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
            <div className="mb-6 flex items-center justify-between">
              <p className="text-muted-foreground">
                {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"}{" "}
                found
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
              <AnimatedFilterResults
                filterKey={`${selectedCategory}-${selectedPriceRange}-${searchTerm}-${sortBy}`}
              >
                {/* Group products by type when showing all categories */}
                {selectedCategory === "all" && !searchTerm ? (
                  <div className="space-y-12">
                    {/* Ableton Racks Section */}
                    {(() => {
                      const abletonRacks = filteredProducts.filter(
                        (p) => p.productType === "abletonRack" || p.productType === "abletonPreset"
                      );
                      if (abletonRacks.length === 0) return null;
                      return (
                        <div>
                          <div className="mb-6 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10">
                              <Waves className="h-5 w-5 text-chart-2" />
                            </div>
                            <div>
                              <h2 className="text-2xl font-bold">Ableton Racks</h2>
                              <p className="text-sm text-muted-foreground">
                                Professional audio effect racks and presets
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {abletonRacks.map((product) => {
                              const IconComponent = product.icon;
                              return (
                                <Card
                                  key={product._id}
                                  className="group overflow-hidden transition-shadow duration-200 hover:shadow-lg"
                                >
                                  <div className="relative h-48 bg-gradient-to-br from-muted to-muted/80">
                                    {product.imageUrl ? (
                                      <Image
                                        src={product.imageUrl}
                                        alt={product.title}
                                        width={640}
                                        height={192}
                                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                      />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center">
                                        <IconComponent className="h-12 w-12 text-muted-foreground" />
                                      </div>
                                    )}
                                    <Badge
                                      className={`absolute left-3 top-3 ${product.badgeColor}`}
                                    >
                                      <IconComponent className="mr-1 h-3 w-3" />
                                      Ableton Rack
                                    </Badge>
                                    <Badge className="absolute right-3 top-3 border border-border bg-card font-semibold text-card-foreground">
                                      {product.price === 0 ? "FREE" : `$${product.price}`}
                                    </Badge>
                                  </div>
                                  <CardContent className="p-4">
                                    <div className="space-y-3">
                                      <div>
                                        <h3 className="line-clamp-2 text-lg font-semibold transition-colors group-hover:text-primary">
                                          {product.title}
                                        </h3>
                                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
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
                      const courses = filteredProducts.filter((p) => p.productType === "course");
                      if (courses.length === 0) return null;
                      return (
                        <div>
                          <div className="mb-6 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-1/10">
                              <BookOpen className="h-5 w-5 text-chart-1" />
                            </div>
                            <div>
                              <h2 className="text-2xl font-bold">Courses</h2>
                              <p className="text-sm text-muted-foreground">
                                In-depth video courses and tutorials
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {courses.map((product) => {
                              const IconComponent = product.icon;
                              return (
                                <Card
                                  key={product._id}
                                  className="group overflow-hidden transition-shadow duration-200 hover:shadow-lg"
                                >
                                  <div className="relative h-48 bg-gradient-to-br from-muted to-muted/80">
                                    {product.imageUrl ? (
                                      <Image
                                        src={product.imageUrl}
                                        alt={product.title}
                                        width={640}
                                        height={192}
                                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                      />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center">
                                        <IconComponent className="h-12 w-12 text-muted-foreground" />
                                      </div>
                                    )}
                                    <Badge
                                      className={`absolute left-3 top-3 ${product.badgeColor}`}
                                    >
                                      <IconComponent className="mr-1 h-3 w-3" />
                                      Course
                                    </Badge>
                                    <Badge className="absolute right-3 top-3 border border-border bg-card font-semibold text-card-foreground">
                                      {product.price === 0 ? "FREE" : `$${product.price}`}
                                    </Badge>
                                  </div>
                                  <CardContent className="p-4">
                                    <div className="space-y-3">
                                      <div>
                                        <h3 className="line-clamp-2 text-lg font-semibold transition-colors group-hover:text-primary">
                                          {product.title}
                                        </h3>
                                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
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
                      const digitalProducts = filteredProducts.filter(
                        (p) =>
                          p.productType === "digital" ||
                          p.productType === "digitalProduct" ||
                          !p.productType
                      );
                      if (digitalProducts.length === 0) return null;
                      return (
                        <div>
                          <div className="mb-6 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-3/10">
                              <Package className="h-5 w-5 text-chart-3" />
                            </div>
                            <div>
                              <h2 className="text-2xl font-bold">Digital Products</h2>
                              <p className="text-sm text-muted-foreground">
                                Sample packs, templates, and downloadable content
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {digitalProducts.map((product) => {
                              const IconComponent = product.icon;
                              return (
                                <Card
                                  key={product._id}
                                  className="group overflow-hidden transition-shadow duration-200 hover:shadow-lg"
                                >
                                  <div className="relative h-48 bg-gradient-to-br from-muted to-muted/80">
                                    {product.imageUrl ? (
                                      <Image
                                        src={product.imageUrl}
                                        alt={product.title}
                                        width={640}
                                        height={192}
                                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                      />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center">
                                        <IconComponent className="h-12 w-12 text-muted-foreground" />
                                      </div>
                                    )}
                                    <Badge
                                      className={`absolute left-3 top-3 ${product.badgeColor}`}
                                    >
                                      <IconComponent className="mr-1 h-3 w-3" />
                                      Digital
                                    </Badge>
                                    <Badge className="absolute right-3 top-3 border border-border bg-card font-semibold text-card-foreground">
                                      {product.price === 0 ? "FREE" : `$${product.price}`}
                                    </Badge>
                                  </div>
                                  <CardContent className="p-4">
                                    <div className="space-y-3">
                                      <div>
                                        <h3 className="line-clamp-2 text-lg font-semibold transition-colors group-hover:text-primary">
                                          {product.title}
                                        </h3>
                                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
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
                      const urlMedia = filteredProducts.filter((p) => p.productType === "urlMedia");
                      if (urlMedia.length === 0) return null;
                      return (
                        <div>
                          <div className="mb-6 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                              <ExternalLink className="h-5 w-5 text-purple-500" />
                            </div>
                            <div>
                              <h2 className="text-2xl font-bold">Links & Media</h2>
                              <p className="text-sm text-muted-foreground">
                                External resources and curated content
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {urlMedia.map((product) => {
                              const IconComponent = product.icon;
                              return (
                                <Card
                                  key={product._id}
                                  className="group overflow-hidden transition-shadow duration-200 hover:shadow-lg"
                                >
                                  <div className="relative h-48 bg-gradient-to-br from-muted to-muted/80">
                                    {product.imageUrl ? (
                                      <Image
                                        src={product.imageUrl}
                                        alt={product.title}
                                        width={640}
                                        height={192}
                                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                      />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center">
                                        <ExternalLink className="h-12 w-12 text-muted-foreground" />
                                      </div>
                                    )}
                                    <Badge className="absolute left-3 top-3 bg-purple-500/10 text-purple-500 dark:bg-purple-500/20 dark:text-purple-400">
                                      <ExternalLink className="mr-1 h-3 w-3" />
                                      Link
                                    </Badge>
                                    <Badge className="absolute right-3 top-3 border border-border bg-card font-semibold text-card-foreground">
                                      {product.price === 0 ? "FREE" : `$${product.price}`}
                                    </Badge>
                                  </div>
                                  <CardContent className="p-4">
                                    <div className="space-y-3">
                                      <div>
                                        <h3 className="line-clamp-2 text-lg font-semibold transition-colors group-hover:text-primary">
                                          {product.title}
                                        </h3>
                                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
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
                      const coaching = filteredProducts.filter((p) => p.productType === "coaching");
                      if (coaching.length === 0) return null;
                      return (
                        <div>
                          <div className="mb-6 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10">
                              <Users className="h-5 w-5 text-indigo-500" />
                            </div>
                            <div>
                              <h2 className="text-2xl font-bold">Coaching</h2>
                              <p className="text-sm text-muted-foreground">
                                One-on-one sessions and personalized guidance
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {coaching.map((product) => {
                              return (
                                <Card
                                  key={product._id}
                                  className="group overflow-hidden transition-shadow duration-200 hover:shadow-lg"
                                >
                                  <div className="relative h-48 bg-gradient-to-br from-muted to-muted/80">
                                    {product.imageUrl ? (
                                      <Image
                                        src={product.imageUrl}
                                        alt={product.title}
                                        width={640}
                                        height={192}
                                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                      />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center">
                                        <Users className="h-12 w-12 text-muted-foreground" />
                                      </div>
                                    )}
                                    <Badge className="absolute left-3 top-3 bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-400">
                                      <Users className="mr-1 h-3 w-3" />
                                      Coaching
                                    </Badge>
                                    <Badge className="absolute right-3 top-3 border border-border bg-card font-semibold text-card-foreground">
                                      {product.price === 0 ? "FREE" : `$${product.price}`}
                                    </Badge>
                                  </div>
                                  <CardContent className="p-4">
                                    <div className="space-y-3">
                                      <div>
                                        <h3 className="line-clamp-2 text-lg font-semibold transition-colors group-hover:text-primary">
                                          {product.title}
                                        </h3>
                                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
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
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredProducts.map((product) => {
                      const IconComponent = product.icon;
                      return (
                        <Card
                          key={product._id}
                          className="group overflow-hidden transition-shadow duration-200 hover:shadow-lg"
                        >
                          {/* Product Image */}
                          <div className="relative h-48 bg-gradient-to-br from-muted to-muted/80">
                            {product.imageUrl ? (
                              <Image
                                src={product.imageUrl}
                                alt={product.title}
                                width={640}
                                height={192}
                                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <IconComponent className="h-12 w-12 text-muted-foreground" />
                              </div>
                            )}
                            {/* Product Type Badge */}
                            <Badge className={`absolute left-3 top-3 ${product.badgeColor}`}>
                              <IconComponent className="mr-1 h-3 w-3" />
                              {product.productType === "digitalProduct"
                                ? "Digital"
                                : product.productType === "course"
                                  ? "Course"
                                  : product.productType}
                            </Badge>
                            {/* Price Badge */}
                            <Badge className="absolute right-3 top-3 border border-border bg-card font-semibold text-card-foreground">
                              {product.price === 0 ? "FREE" : `$${product.price}`}
                            </Badge>
                          </div>

                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div>
                                <h3 className="line-clamp-2 text-lg font-semibold transition-colors group-hover:text-primary">
                                  {product.title}
                                </h3>
                                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
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
                                {product.buttonLabel ||
                                  (product.productType === "course" ? "Enroll Now" : "Get Access")}
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
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">No products found</h3>
                <p className="mb-4 text-muted-foreground">
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
              <div className="mt-12 rounded-lg border border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5 p-6">
                <div className="text-center">
                  <h3 className="mb-2 text-xl font-bold">🎁 Free Resource</h3>
                  <h4 className="mb-2 text-lg font-semibold">{leadMagnetData.title}</h4>
                  <p className="mb-4 text-muted-foreground">{leadMagnetData.subtitle}</p>
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
          <div className="space-y-6 lg:col-span-1">
            {/* About Store Card */}
            <Card className="sticky top-4 border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Star className="h-5 w-5 text-primary" />
                  About This Store
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                    <span className="text-sm font-medium">Products</span>
                    <Badge variant="secondary">
                      {storeStats?.totalItems || allProducts.length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                    <span className="text-sm font-medium">Students</span>
                    <Badge variant="secondary">{storeStats?.totalStudents || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                    <span className="text-sm font-medium">Sales</span>
                    <Badge variant="secondary">{storeStats?.totalSales || 0}</Badge>
                  </div>
                </div>

                {/* Creator Info */}
                <div className="border-t border-border pt-4">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 font-bold text-primary-foreground">
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt={displayName}
                          width={48}
                          height={48}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        initials
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{displayName}</p>
                      <p className="truncate text-xs text-muted-foreground">{store.name}</p>
                    </div>
                  </div>
                  {(store.bio || store.description) && (
                    <p className="line-clamp-3 text-sm text-muted-foreground">
                      {store.bio || store.description}
                    </p>
                  )}
                </div>

                {/* Social Links in Sidebar - Mobile Only Alternative */}
                {(store.socialLinks?.instagram ||
                  store.socialLinks?.twitter ||
                  store.socialLinks?.youtube ||
                  store.socialLinks?.tiktok ||
                  store.socialLinks?.spotify) && (
                  <div className="border-t border-border pt-4">
                    <p className="mb-3 text-sm font-medium">Connect with me</p>
                    <div className="flex flex-wrap gap-2">
                      {store.socialLinks?.instagram && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="min-w-[80px] flex-1 hover:border-[#E4405F] hover:bg-[#E4405F]/10 hover:text-[#E4405F]"
                          asChild
                        >
                          <a
                            href={store.socialLinks.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <svg className="mr-1 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                            </svg>
                            Instagram
                          </a>
                        </Button>
                      )}
                      {store.socialLinks?.youtube && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="min-w-[80px] flex-1 hover:border-[#FF0000] hover:bg-[#FF0000]/10 hover:text-[#FF0000]"
                          asChild
                        >
                          <a
                            href={store.socialLinks.youtube}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <svg className="mr-1 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                            </svg>
                            YouTube
                          </a>
                        </Button>
                      )}
                      {store.socialLinks?.spotify && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="min-w-[80px] flex-1 hover:border-[#1DB954] hover:bg-[#1DB954]/10 hover:text-[#1DB954]"
                          asChild
                        >
                          <a
                            href={store.socialLinks.spotify}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <svg className="mr-1 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
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
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-chart-1/30 via-chart-2/20 to-chart-3/30"></div>
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          ></div>

          {/* Floating Elements for Visual Interest */}
          <div className="absolute left-10 top-10 h-20 w-20 animate-pulse rounded-full bg-chart-1/20 blur-3xl"></div>
          <div className="absolute bottom-10 right-10 h-32 w-32 animate-pulse rounded-full bg-chart-3/20 blur-3xl delay-1000"></div>

          <div className="relative p-8 md:p-16">
            <div className="mx-auto max-w-5xl">
              {/* Attention-Grabbing Pre-Headline */}
              <div className="mb-8 text-center">
                <Badge className="mb-4 border-none bg-gradient-to-r from-chart-1 to-chart-4 px-6 py-2 text-base font-semibold text-primary-foreground shadow-lg">
                  🎵 For Music Creators Like {displayName}
                </Badge>

                {/* Power Headline with Benefit Focus */}
                <h2 className="mb-6 text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
                  <span className="bg-gradient-to-r from-chart-1 via-chart-2 to-chart-3 bg-clip-text text-transparent">
                    Build Your Own
                  </span>
                  <br />
                  <span className="text-foreground">Professional Storefront</span>
                </h2>

                {/* Compelling Sub-Headline */}
                <p className="mx-auto mb-4 max-w-3xl text-xl font-medium text-foreground/80 md:text-2xl">
                  Sell sample packs, presets, courses, and coaching - all from your own link-in-bio
                  storefront
                </p>
              </div>

              {/* Benefit-Driven Value Props */}
              <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="group rounded-2xl border-2 border-border bg-card/60 p-6 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-chart-1/50 hover:shadow-2xl">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-chart-1 to-chart-2 shadow-lg transition-transform group-hover:scale-110">
                    <BookOpen className="h-7 w-7 text-primary-foreground" aria-hidden="true" />
                  </div>
                  <div className="text-center">
                    <h3 className="mb-2 text-lg font-bold">All-in-One Platform</h3>
                    <p className="text-sm text-muted-foreground">
                      Sell products, courses, and services from one professional storefront
                    </p>
                  </div>
                </div>

                <div className="group rounded-2xl border-2 border-border bg-card/60 p-6 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-chart-2/50 hover:shadow-2xl">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-chart-2 to-chart-3 shadow-lg transition-transform group-hover:scale-110">
                    <Users className="h-7 w-7 text-primary-foreground" aria-hidden="true" />
                  </div>
                  <div className="text-center">
                    <h3 className="mb-2 text-lg font-bold">Your Brand, Your Way</h3>
                    <p className="text-sm text-muted-foreground">
                      Custom branding perfect for Instagram, TikTok, and YouTube bios
                    </p>
                  </div>
                </div>

                <div className="group rounded-2xl border-2 border-border bg-card/60 p-6 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-chart-3/50 hover:shadow-2xl">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-chart-3 to-chart-1 shadow-lg transition-transform group-hover:scale-110">
                    <Play className="h-7 w-7 text-primary-foreground" aria-hidden="true" />
                  </div>
                  <div className="text-center">
                    <h3 className="mb-2 text-lg font-bold">Setup in Minutes</h3>
                    <p className="text-sm text-muted-foreground">
                      Get started quickly with our intuitive platform - no coding required
                    </p>
                  </div>
                </div>
              </div>

              {/* Powerful CTA with Risk Reversal */}
              <div className="text-center">
                <div className="mb-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Button
                    size="lg"
                    className="hover:shadow-3xl group relative overflow-hidden bg-gradient-to-r from-chart-1 via-chart-2 to-chart-3 px-12 py-7 text-xl font-bold text-primary-foreground shadow-2xl transition-all duration-300 hover:scale-105 hover:opacity-90"
                    onClick={handleStartStorefront}
                    aria-label="Start your free storefront"
                  >
                    <span className="relative z-10 flex items-center gap-3">
                      <span>Get Started Free</span>
                      <ArrowRight
                        className="h-5 w-5 transition-transform group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-chart-2 via-chart-3 to-chart-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                  </Button>
                </div>

                {/* Trust Signals & Guarantees */}
                <div className="mb-4 flex flex-col items-center justify-center gap-4 text-sm sm:flex-row sm:gap-8">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500">
                      <svg
                        className="h-4 w-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <span>Free plan available</span>
                  </div>
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500">
                      <svg
                        className="h-4 w-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <span>No credit card required</span>
                  </div>
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500">
                      <svg
                        className="h-4 w-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
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
      <SubscriptionSection storeId={store._id} storeName={displayName} />

      {/* Fallback to original components for specific mobile optimizations if needed */}
      <div className="hidden">
        {isDesktop ? (
          <DesktopStorefront
            store={store!}
            user={user!}
            products={(allProducts as any) || []}
            displayName={displayName}
            initials={initials}
            avatarUrl={avatarUrl}
            socialAccounts={socialAccounts || []}
          />
        ) : (
          <MobileStorefront
            store={store!}
            user={user!}
            products={(allProducts as any) || []}
            displayName={displayName}
            initials={initials}
            avatarUrl={avatarUrl}
            leadMagnetData={leadMagnetData}
          />
        )}
      </div>

      {/* Product Details Modal */}
      <Dialog open={productModalOpen} onOpenChange={setProductModalOpen}>
        <DialogContent className="flex max-h-[85vh] max-w-lg flex-col overflow-hidden bg-white dark:bg-black">
          {selectedProduct && (
            <>
              <DialogHeader className="flex-shrink-0">
                <DialogTitle className="line-clamp-2 text-xl">{selectedProduct.title}</DialogTitle>
                <DialogDescription>{selectedProduct.category}</DialogDescription>
              </DialogHeader>

              <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                {/* Product Image */}
                {selectedProduct.imageUrl && (
                  <div className="relative h-48 flex-shrink-0 overflow-hidden rounded-lg">
                    <Image
                      src={selectedProduct.imageUrl}
                      alt={selectedProduct.title}
                      width={640}
                      height={192}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                {/* Price Badge */}
                <div className="flex flex-shrink-0 items-center gap-3">
                  <Badge className="px-3 py-1 text-base">
                    {selectedProduct.price === 0 ? "FREE" : `$${selectedProduct.price}`}
                  </Badge>
                  {selectedProduct.productType && (
                    <Badge variant="outline" className="text-xs">
                      {selectedProduct.productType === "digitalProduct"
                        ? "Digital Product"
                        : selectedProduct.productType}
                    </Badge>
                  )}
                </div>

                {/* Description - Scrollable */}
                {selectedProduct.description && (
                  <div className="flex-shrink-0">
                    <h3 className="mb-2 text-sm font-semibold">About this product</h3>
                    <div className="max-h-32 overflow-y-auto pr-2">
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {selectedProduct.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Opt-in Form or Action Buttons */}
                {selectedProduct.price === 0 && !hasSubmittedEmail ? (
                  /* Show opt-in form for free products */
                  <div className="flex-shrink-0 space-y-3">
                    <div className="rounded-lg border border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5 p-3">
                      <h3 className="mb-1 text-sm font-semibold">🎁 Get Free Access</h3>
                      <p className="mb-3 text-xs text-muted-foreground">
                        Enter your email to download this free resource instantly
                      </p>
                      <form onSubmit={handleEmailSubmit} className="space-y-2">
                        <div>
                          <label
                            htmlFor="storefront-name"
                            className="mb-1 block text-xs font-medium"
                          >
                            Name (optional)
                          </label>
                          <Input
                            id="storefront-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your name"
                            className="h-9 bg-white text-sm dark:bg-black"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="storefront-email"
                            className="mb-1 block text-xs font-medium"
                          >
                            Email <span className="text-red-500">*</span>
                          </label>
                          <Input
                            id="storefront-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            className="h-9 bg-white text-sm dark:bg-black"
                          />
                        </div>
                        <Button
                          type="submit"
                          className="h-9 w-full text-sm"
                          disabled={isSubmitting || !email}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Download className="mr-2 h-4 w-4" />
                              Get Free Access
                            </>
                          )}
                        </Button>
                      </form>
                      <p className="mt-2 text-center text-[10px] text-muted-foreground">
                        🔒 We respect your privacy. Unsubscribe anytime.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Show action buttons after email submission or for paid products */
                  <div className="flex-shrink-0 space-y-3">
                    {hasSubmittedEmail && (
                      <div className="rounded-lg border border-primary/20 bg-primary/10 p-3">
                        <p className="text-xs font-medium text-primary">
                          ✓ Email confirmed! Click below to access your download.
                        </p>
                      </div>
                    )}
                    <div className="flex flex-col gap-2 sm:flex-row">
                      {selectedProduct.downloadUrl || selectedProduct.url ? (
                        <>
                          <Button
                            className="h-9 flex-1 text-sm"
                            onClick={() => {
                              console.log("Download button clicked for:", selectedProduct.title);
                              console.log("downloadUrl:", selectedProduct.downloadUrl);
                              console.log("url:", selectedProduct.url);
                              handleDownload(selectedProduct);
                            }}
                          >
                            {selectedProduct.downloadUrl ? (
                              <>
                                <Download className="mr-2 h-4 w-4" />
                                {selectedProduct.buttonLabel || "Download Now"}
                              </>
                            ) : selectedProduct.url ? (
                              <>
                                <ExternalLink className="mr-2 h-4 w-4" />
                                {selectedProduct.buttonLabel || "Visit Link"}
                              </>
                            ) : (
                              <>
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Access Product
                              </>
                            )}
                          </Button>
                          {selectedProduct.price > 0 && (
                            <Button
                              variant="outline"
                              className="h-9 text-sm"
                              onClick={() => {
                                alert(
                                  `To purchase "${selectedProduct.title}", please contact ${displayName} directly.`
                                );
                              }}
                            >
                              <ShoppingCart className="mr-2 h-4 w-4" />
                              Purchase
                            </Button>
                          )}
                        </>
                      ) : (
                        <>
                          <Button
                            className="h-9 flex-1 text-sm"
                            onClick={() => {
                              const message =
                                selectedProduct.price === 0
                                  ? `I'm interested in the free resource "${selectedProduct.title}".`
                                  : `I'm interested in purchasing "${selectedProduct.title}" for $${selectedProduct.price}.`;
                              alert(
                                `${message}\n\nPlease contact ${displayName} for more information.`
                              );
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
    </StorefrontLayout>
  );
}

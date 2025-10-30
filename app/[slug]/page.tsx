"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { use } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Loader2, Search, Filter, BookOpen, Play, Users, Star, X, ExternalLink, Download, ShoppingCart, ArrowRight } from "lucide-react";
import { DesktopStorefront } from "./components/DesktopStorefront";
import { MobileStorefront } from "./components/MobileStorefront";
import { SubscriptionSection } from "./components/SubscriptionSection";
import { CreatorsPicks } from "@/components/storefront/creators-picks";
import { FollowCreatorCTA } from "@/components/storefront/follow-creator-cta";
import { AnimatedFilterResults, AnimatedGridItem } from "@/components/ui/animated-filter-transitions";
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

  // Fetch user data if store exists
  const user = useQuery(
    api.users.getUserFromClerk,
    store ? { clerkId: store.userId } : "skip"
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

  // Enhanced loading state with skeleton
  if (store === undefined || user === undefined || products === undefined || courses === undefined) {
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

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Header */}
      <div className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold text-xl">
              {avatarUrl ? (
                <Image src={avatarUrl} alt={displayName} width={64} height={64} className="w-full h-full rounded-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
              <p className="text-muted-foreground">{store.name}</p>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                <Star className="w-3 h-3 mr-1 fill-current" />
                {allProducts.length} Products
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
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

        {/* Creator's Picks Section - Featured Products */}
        {allProducts.length >= 3 && !searchTerm && selectedCategory === "all" && (
          <div className="mb-12">
            <CreatorsPicks
              products={allProducts.slice(0, 3).map(p => ({
                id: p._id,
                title: p.title,
                description: p.description || "",
                imageUrl: p.imageUrl,
                price: p.price || 0,
                slug: p.slug || p._id,
                type: p.productType as "course" | "digital" | "bundle",
                rating: 4.8,
                students: 150,
                reason: "This is one of my most popular products - students love the quality and practical value!"
              }))}
              creatorName={store.name}
              onProductClick={handleProductClick}
              allProductsData={allProducts}
            />
          </div>
        )}

        {/* Enhanced Products Grid with Animations */}
        {filteredProducts.length > 0 ? (
          <AnimatedFilterResults filterKey={`${selectedCategory}-${selectedPriceRange}-${searchTerm}-${sortBy}`}>
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
            <FollowCreatorCTA
              creatorName={store.name}
              creatorSlug={store.slug}
              creatorAvatar={avatarUrl}
              followerCount={allProducts.length * 50} // Estimate
              sticky={true}
              onFollow={() => {
                toast.success(`You're now following ${store.name}`);
              }}
              onNotify={() => {
                toast.success(`You'll be notified of new releases from ${store.name}`);
              }}
            />
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
        <DialogContent className="max-w-2xl bg-white dark:bg-black">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedProduct.title}</DialogTitle>
                <DialogDescription>
                  {selectedProduct.category}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Product Image */}
                {selectedProduct.imageUrl && (
                  <div className="relative h-64 rounded-lg overflow-hidden">
                    <Image
                      src={selectedProduct.imageUrl}
                      alt={selectedProduct.title}
                      width={640}
                      height={256}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Price Badge */}
                <div className="flex items-center gap-4">
                  <Badge className="text-lg px-4 py-2">
                    {selectedProduct.price === 0 ? "FREE" : `$${selectedProduct.price}`}
                  </Badge>
                  {selectedProduct.productType && (
                    <Badge variant="outline">
                      {selectedProduct.productType === "digitalProduct" ? "Digital Product" : selectedProduct.productType}
                    </Badge>
                  )}
                </div>

                {/* Description */}
                <div>
                  <h3 className="font-semibold mb-2">About this product</h3>
                  <p className="text-muted-foreground">
                    {selectedProduct.description || "No description available."}
                  </p>
                </div>

                {/* Opt-in Form or Action Buttons */}
                {selectedProduct.price === 0 && !hasSubmittedEmail ? (
                  /* Show opt-in form for free products */
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-lg border border-primary/20">
                      <h3 className="font-semibold mb-2">🎁 Get Free Access</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Enter your email to download this free resource instantly
                      </p>
                      <form onSubmit={handleEmailSubmit} className="space-y-3">
                        <div>
                          <label htmlFor="storefront-name" className="text-sm font-medium block mb-1">
                            Name (optional)
                          </label>
                          <Input
                            id="storefront-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your name"
                            className="bg-white dark:bg-black"
                          />
                        </div>
                        <div>
                          <label htmlFor="storefront-email" className="text-sm font-medium block mb-1">
                            Email <span className="text-red-500">*</span>
                          </label>
                          <Input
                            id="storefront-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            className="bg-white dark:bg-black"
                          />
                        </div>
                        <Button 
                          type="submit"
                          size="lg"
                          className="w-full"
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
                      <p className="text-xs text-muted-foreground text-center mt-3">
                        🔒 We respect your privacy. Unsubscribe anytime.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Show action buttons after email submission or for paid products */
                  <div className="space-y-4">
                    {hasSubmittedEmail && (
                      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                        <p className="text-primary text-sm font-medium">
                          ✓ Email confirmed! Click below to access your download.
                        </p>
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-3">
                      {(selectedProduct.downloadUrl || selectedProduct.url) ? (
                        <>
                          <Button 
                            size="lg"
                            className="flex-1"
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
                              size="lg"
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
                          <p className="text-sm text-muted-foreground mb-2">
                            ⚠️ Debug: No URL found for this product
                          </p>
                          <Button 
                            size="lg"
                            className="flex-1"
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

                {/* Additional Info */}
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    💡 This product is offered by <span className="font-semibold text-foreground">{displayName}</span>
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
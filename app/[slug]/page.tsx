"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { use } from "react";
import { notFound } from "next/navigation";
import { Loader2, Search, Filter, BookOpen, Play, Users, Star } from "lucide-react";
import { DesktopStorefront } from "./components/DesktopStorefront";
import { MobileStorefront } from "./components/MobileStorefront";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

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
      productType: product.productType || "digitalProduct",
      category: (product as any).category || "Digital Product",
      icon: Play,
      badgeColor: "bg-blue-100 text-blue-800",
    })),
    
    // Courses (add course-specific properties)
    ...(courses || []).map(course => ({
      ...course,
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
    } else if (product.downloadUrl) {
      window.open(product.downloadUrl, '_blank');
    } else if (product.url) {
      // For URL-based products (like links)
      window.open(product.url, '_blank');
    } else if (product.price === 0) {
      // Free products - might need special handling
      alert("This is a free resource! Contact the creator for access details.");
    } else {
      // Paid products without direct URLs - redirect to a purchase/contact page
      alert(`Interested in "${product.title}"? Contact ${displayName} for purchase details.`);
    }
  };

  const handleStartStorefront = () => {
    router.push('/sign-up');
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
      <div className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-bold text-xl">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-full h-full rounded-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
              <p className="text-muted-foreground">{store.name}</p>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Star className="w-3 h-3 mr-1 fill-current" />
                {allProducts.length} Products
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="container mx-auto px-4 py-6">
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

        {/* Enhanced Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => {
              const IconComponent = product.icon;
              return (
                <Card key={product._id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200 group">
                  {/* Product Image */}
                  <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <IconComponent className="w-12 h-12 text-gray-400" />
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
                    <Badge className="absolute top-3 right-3 bg-white text-gray-900 font-semibold">
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
        ) : (
          /* No Results State */
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400" />
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

        {/* Creator Call-to-Action Section */}
        <div className="mt-16 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20 rounded-2xl"></div>
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
          
          <div className="relative p-8 md:p-12">
            <div className="max-w-4xl mx-auto text-center">
              {/* Main Headline */}
              <div className="mb-6">
                <Badge className="mb-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white border-none px-4 py-2">
                  🎵 For Music Creators
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                  Ready to Build Your Own Music Storefront?
                </h2>
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                  Join thousands of producers, DJs, and artists selling sample packs, presets, coaching, and more with their own professional link-in-bio storefront.
                </p>
              </div>

              {/* Value Propositions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Sell Everything</h3>
                  <p className="text-sm text-muted-foreground">Sample packs, presets, project files, coaching sessions, and music promotion services - all in one place.</p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Your Brand</h3>
                  <p className="text-sm text-muted-foreground">Custom storefront that matches your style. Perfect for Instagram, TikTok, and social media link-in-bio.</p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Play className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Easy Setup</h3>
                  <p className="text-sm text-muted-foreground">Get started in minutes. No coding required. Upload your content and start selling immediately.</p>
                </div>
              </div>

              {/* Social Proof */}
              <div className="mb-8">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="flex -space-x-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                      >
                        {String.fromCharCode(65 + i)}
                      </div>
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">2,500+</span> creators already earning
                  </div>
                </div>
                <div className="flex items-center justify-center gap-1 text-yellow-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                  <span className="ml-2 text-sm text-muted-foreground">4.9/5 from 1,200+ reviews</span>
                </div>
              </div>

              {/* Call-to-Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  onClick={handleStartStorefront}
                >
                  Start Your Storefront Free
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-2 border-purple-600/30 text-purple-600 hover:bg-purple-600/10 px-8 py-3 text-lg font-semibold"
                  onClick={handleSeeExamples}
                >
                  See Examples
                </Button>
              </div>

              {/* Additional Info */}
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>No setup fees</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Cancel anytime</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>14-day free trial</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
    </div>
  );
}
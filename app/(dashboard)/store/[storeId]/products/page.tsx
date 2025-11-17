"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useValidStoreId } from "@/hooks/useStoreId";
import { StoreRequiredGuard } from "@/components/dashboard/store-required-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Music, BookOpen, Users, Zap, Search, Filter, Package, Plus, Eye, DollarSign, TrendingUp, Mail, Waves, Sparkles, Gift, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MusicOptionCard } from "../components/MusicOptionCard";
import { musicOptions, groupedOptions, popularOptions } from "../components/music-options";
import { ProductsList } from "../../components/ProductsList";
import { SamplesList } from "@/components/samples/SamplesList";
import { CreditBalance } from "@/components/credits/CreditBalance";
import { useToast } from "@/hooks/use-toast";
import { ProductTypeSelector } from "@/components/products/product-type-selector";
import { Skeleton } from "@/components/ui/skeleton";

// Loading state component
function LoadingState() {
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-4 flex-1">
            <Skeleton className="h-8 w-48 bg-purple-100 dark:bg-purple-900/20" />
            <Skeleton className="h-12 w-96" />
            <Skeleton className="h-6 w-full max-w-2xl" />
          </div>
          <Skeleton className="h-12 w-48" />
        </div>

        {/* Credit Balance Skeleton */}
        <Skeleton className="h-24 w-full mb-8 rounded-2xl" />

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs Skeleton */}
        <div className="mb-8">
          <Skeleton className="h-12 w-full max-w-lg mx-auto mb-8 rounded-full" />
          
          {/* Products Grid Skeleton */}
          <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-6">
            <Skeleton className="h-10 w-full mb-6 rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <Skeleton className="h-48 w-full rounded-t-lg" />
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Empty state component
function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction 
}: { 
  icon: any; 
  title: string; 
  description: string; 
  actionLabel: string; 
  onAction: () => void;
}) {
  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden">
      <div className="text-center py-20 px-6">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
          <Icon className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-2xl font-semibold mb-3">{title}</h3>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          {description}
        </p>
        <Button 
          onClick={onAction}
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const storeId = useValidStoreId();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("manage");
  
  // Debug logging
  console.log("Current activeTab:", activeTab);
  const [searchTerm, setSearchTerm] = useState("");

  // Get user from Convex using Clerk ID
  // Suppress TypeScript deep instantiation errors
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getUserFromClerkFn: any = (() => {
    // @ts-ignore TS2589
    return api.users.getUserFromClerk as any;
  })();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const useQueryAny: any = useQuery as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const convexUser: any = useQueryAny(
    getUserFromClerkFn,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Get user's products (using clerkId since courses.userId stores clerkId)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userCourses: any = (() => {
    // @ts-ignore TS2589 - Type instantiation is excessively deep
    return useQuery(
      api.courses.getCoursesByUser,
      convexUser?.clerkId ? { userId: convexUser.clerkId } : "skip"
    );
  })();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const digitalProducts: any = (() => {
    // @ts-ignore TS2589 - Type instantiation is excessively deep
    return useQuery(
      api.digitalProducts.getProductsByStore,
      storeId ? { storeId } : "skip"
    );
  })();

  // Get user's samples
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userSamples: any = (() => {
    // @ts-ignore TS2589 - Type instantiation is excessively deep
    return useQuery(
      api.samples.getStoreSamples,
      storeId ? { storeId } : "skip"
    );
  })();

  // Combine products for display
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allProducts: any = [
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(userCourses?.map((course: any) => ({
      _id: course._id,
      title: course.title,
      description: course.description,
      price: course.price || 0,
      imageUrl: course.imageUrl,
      isPublished: course.isPublished,
      slug: course.slug,
      userId: course.userId,
      type: 'course',
      productType: undefined,
      storeId: course.storeId,
    })) || []),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(digitalProducts?.map((product: any) => ({
      _id: product._id,
      title: product.title || 'Untitled Product',
      description: product.description,
      price: product.price || 0,
      imageUrl: product.imageUrl,
      isPublished: product.isPublished,
      userId: product.userId,
      type: 'digitalProduct',
      productType: product.productType, // Preserve the productType
      productCategory: product.productCategory, // Preserve the productCategory
      storeId: product.storeId,
    })) || [])
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const musicProducts = allProducts.filter((p: any) => p.type === 'digitalProduct' && p.productType !== 'abletonRack' && p.productType !== 'abletonPreset');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const abletonRacks = allProducts.filter((p: any) => p.productType === 'abletonRack' || p.productType === 'abletonPreset');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const courseProducts = allProducts.filter((p: any) => p.type === 'course');

  // Check if data is still loading
  const isLoading = convexUser === undefined || 
                    userCourses === undefined || 
                    digitalProducts === undefined || 
                    userSamples === undefined;

  // Calculate stats
  const stats = {
    totalProducts: allProducts.length + (userSamples?.length || 0),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    publishedProducts: allProducts.filter((p: any) => p.isPublished).length + (userSamples?.filter((s: any) => s.isPublished).length || 0),
    totalViews: 0, // Placeholder for future analytics
    totalRevenue: 0, // Placeholder for future analytics
  };

  // Show loading state while data is being fetched
  if (isLoading) {
    return <LoadingState />;
  }

  if (!storeId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Store Not Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              The store you're trying to access could not be found or is invalid.
            </p>
            <Button onClick={() => router.push('/store')} variant="outline">
              Go Back to Store Selection
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleOptionClick = (optionId: string) => {
    if (!storeId) {
      console.error('No storeId provided');
      return;
    }

    // Enhanced route mapping for music-focused products
    const routeMap: Record<string, string> = {
      // Music Products
      'sample-pack': `/store/${storeId}/products/digital-download/create?type=sample-pack`,
      'preset-pack': `/store/${storeId}/products/digital-download/create?type=preset-pack`,
      'ableton-rack': `/store/${storeId}/products/ableton-rack/create`,
      'beat-lease': `/store/${storeId}/products/digital-download/create?type=beat-lease`,
      'project-files': `/store/${storeId}/products/digital-download/create?type=project-files`,
      
      // Content & Education
      'ecourse': `/store/${storeId}/course/create`,
      'digital': `/store/${storeId}/products/digital-download/create`,
      
      // Services
      'coaching': `/store/${storeId}/products/coaching-call/create`,
      'mixing-service': `/store/${storeId}/products/coaching-call/create?type=mixing-service`,
      
      // Community
      'emails': `/store/${storeId}/products/lead-magnet`,
      'membership': '#',
      'webinar': '#',
      
      // Special
      'bundle': `/store/${storeId}/products/bundle/create`,
      'url': `/store/${storeId}/products/url-media/create`,
      'affiliate': '#',
      
      // Legacy mappings (for backward compatibility)
      'custom': '#',
      'community': '#',
    };

    const comingSoonFeatures: Record<string, string> = {
      'membership': 'Membership Creation',
      'webinar': 'Webinar System',
      'affiliate': 'Affiliate Program',
      'custom': 'Custom Products',
      'community': 'Community Features',
    };

    const route = routeMap[optionId];
    if (route && route !== '#') {
      router.push(route);
    } else {
      const featureName = comingSoonFeatures[optionId] || 'This feature';
      toast({
        title: "Coming Soon! 🚀",
        description: `${featureName} is currently in development and will be available in a future update.`,
        className: "bg-white dark:bg-black",
      });
    }
  };

  // Filter options based on search
  const filteredOptions = musicOptions.filter(option =>
    option.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.subtitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 px-4 py-2 rounded-full mb-4">
              <Music className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Music Creator Studio</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              My Products
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
              Manage your existing products or create new ones to grow your music business
        </p>
      </div>
          
          {/* Quick Create Button */}
          <Button
            onClick={() => router.push(`/store/${storeId}/products/create`)}
            size="lg"
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Product
          </Button>
        </motion.div>

        {/* Credit Balance Widget */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <CreditBalance storeId={storeId} showDetails />
        </motion.div>

        {/* Stats Overview - only show if user has products */}
        {allProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8"
          >
            <Card className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Package className="h-4 w-4 text-white/80" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProducts}</div>
                <p className="text-xs text-white/70">Published: {stats.publishedProducts}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-white/80" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$0.00</div>
                <p className="text-xs text-white/70">+0% from last month</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-white/80" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-white/70">+0% from last month</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-white/80" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+0%</div>
                <p className="text-xs text-white/70">New products this month</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Main Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-lg mx-auto grid-cols-2 mb-8">
              <TabsTrigger value="manage" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                <span>My Products</span>
              </TabsTrigger>
              <TabsTrigger value="create" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span>Create New</span>
              </TabsTrigger>
            </TabsList>

            {activeTab === "manage" && (
                <TabsContent key="tab-manage" value="manage" className="space-y-8">
                  <motion.div
                    key="manage-content"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    {allProducts.length > 0 || (userSamples && userSamples.length > 0) ? (
                      <div className="space-y-6">
                        {/* Filters */}
                        <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-4">
                          <Tabs defaultValue="all" className="w-full">
                            <TabsList className="bg-muted/50 p-1 h-auto rounded-xl">
                              <TabsTrigger 
                                value="all" 
                                className="flex items-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
                              >
                                <Package className="w-4 h-4" />
                                <span>All Products</span>
                                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                                  {allProducts.length + (userSamples?.length || 0)}
                                </Badge>
                              </TabsTrigger>
                              <TabsTrigger 
                                value="courses" 
                                className="flex items-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
                              >
                                <BookOpen className="w-4 h-4" />
                                <span>Courses</span>
                                {courseProducts.length > 0 && (
                                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                                    {courseProducts.length}
                                  </Badge>
                                )}
                              </TabsTrigger>
                              <TabsTrigger 
                                value="samples" 
                                className="flex items-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
                              >
                                <Music className="w-4 h-4" />
                                <span>Samples</span>
                                {userSamples && userSamples.length > 0 && (
                                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                                    {userSamples.length}
                                  </Badge>
                                )}
                              </TabsTrigger>
                              <TabsTrigger 
                                value="abletonRacks" 
                                className="flex items-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
                              >
                                <Waves className="w-4 h-4" />
                                <span>Racks</span>
                                {abletonRacks.length > 0 && (
                                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                                    {abletonRacks.length}
                                  </Badge>
                                )}
                              </TabsTrigger>
                              <TabsTrigger 
                                value="music" 
                                className="flex items-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
                              >
                                <Music className="w-4 h-4" />
                                <span>Packs</span>
                                {musicProducts.length > 0 && (
                                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                                    {musicProducts.length}
                                  </Badge>
                                )}
                              </TabsTrigger>
                            </TabsList>

                            <div className="mt-6">
                              <TabsContent value="all" className="mt-0">
                                {userSamples && userSamples.length > 0 && (
                                  <div className="mb-8">
                                    <h3 className="text-lg font-semibold mb-4">Samples</h3>
                                    <SamplesList samples={userSamples} storeId={storeId} />
                                  </div>
                                )}
                                <ProductsList products={allProducts as any} storeId={storeId} />
                              </TabsContent>
                              
                              <TabsContent value="courses" className="mt-0">
                                {courseProducts.length > 0 ? (
                                  <ProductsList products={courseProducts as any} storeId={storeId} />
                                ) : (
                                  <EmptyState
                                    icon={BookOpen}
                                    title="No courses yet"
                                    description="Create your first course to start teaching and earning from your expertise."
                                    actionLabel="Create Course"
                                    onAction={() => router.push(`/store/${storeId}/course/create`)}
                                  />
                                )}
                              </TabsContent>
                              
                              <TabsContent value="samples" className="mt-0">
                                {userSamples && userSamples.length > 0 ? (
                                  <SamplesList samples={userSamples} storeId={storeId} />
                                ) : (
                                  <EmptyState
                                    icon={Music}
                                    title="No samples yet"
                                    description="Upload your first sample to start building your sample library and earning credits."
                                    actionLabel="Upload Sample"
                                    onAction={() => router.push(`/store/${storeId}/samples/upload`)}
                                  />
                                )}
                              </TabsContent>
                              
                              <TabsContent value="abletonRacks" className="mt-0">
                                {abletonRacks.length > 0 ? (
                                  <ProductsList products={abletonRacks as any} storeId={storeId} />
                                ) : (
                                  <EmptyState
                                    icon={Waves}
                                    title="No Ableton racks yet"
                                    description="Upload your first Ableton rack to start sharing your custom device chains and sound design."
                                    actionLabel="Create Ableton Rack"
                                    onAction={() => router.push(`/store/${storeId}/products/ableton-rack/create`)}
                                  />
                                )}
                              </TabsContent>
                              
                              <TabsContent value="music" className="mt-0">
                                {musicProducts.length > 0 ? (
                                  <ProductsList products={musicProducts as any} storeId={storeId} />
                                ) : (
                                  <EmptyState
                                    icon={Package}
                                    title="No packs yet"
                                    description="Create your first sample pack, preset pack, or MIDI pack to start selling."
                                    actionLabel="Create Pack"
                                    onAction={() => router.push(`/store/${storeId}/products/pack/create`)}
                                  />
                                )}
                              </TabsContent>
                            </div>
                          </Tabs>
                        </div>
                      </div>
                    ) : (
                      <EmptyState
                        icon={Package}
                        title="No products yet"
                        description="Start by creating your first product to begin selling your music and content to your audience."
                        actionLabel="Create Your First Product"
                        onAction={() => setActiveTab("create")}
                      />
                    )}
                  </motion.div>
                </TabsContent>
              )}

              {activeTab === "create" && (
                <TabsContent key="tab-create" value="create" className="space-y-8">
                  {/* Hero Section */}
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-purple-950/20 dark:via-pink-950/20 dark:to-blue-950/20 rounded-3xl p-12 mb-12 border border-purple-200 dark:border-purple-800"
                  >
                    <div className="text-center">
                      <div className="inline-flex items-center gap-2 bg-white dark:bg-black/50 px-4 py-2 rounded-full mb-6 shadow-sm">
                        <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Choose Your Product Type</span>
                      </div>
                      <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                        What would you like to create?
                      </h2>
                      <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        Select a product type below to get started. Each has a dedicated creation flow optimized for your workflow.
                      </p>
                    </div>
                  </motion.div>

                  {/* What You Can Create - Organized by Category */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-10"
                  >
                    {/* Music Production */}
                    <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                          <Music className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-xl font-bold">Music Production</h3>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[
                          { icon: "🎵", label: "Sample Pack", type: "sample-pack", route: `/store/${storeId}/products/pack/create?type=sample-pack` },
                          { icon: "🎛️", label: "Preset Pack", type: "preset-pack", route: `/store/${storeId}/products/pack/create?type=preset-pack` },
                          { icon: "🎹", label: "MIDI Pack", type: "midi-pack", route: `/store/${storeId}/products/pack/create?type=midi-pack` },
                          { icon: "🔊", label: "Ableton Rack", type: "ableton-rack", route: `/store/${storeId}/products/ableton-rack/create` },
                          { icon: "🎹", label: "Beat Lease", type: "beat-lease", route: `/store/${storeId}/products/digital-download/create?type=beat-lease` },
                          { icon: "📁", label: "Project Files", type: "project-files", route: `/store/${storeId}/products/digital-download/create?type=project-files` },
                          { icon: "🎚️", label: "Mixing Template", type: "mixing-template", route: `/store/${storeId}/products/digital-download/create?type=mixing-template` },
                          { icon: "📦", label: "Bundle", type: "bundle", route: `/store/${storeId}/products/bundle/create` },
                        ].map((item, index) => (
                          <motion.div
                            key={item.label}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.15 + index * 0.05 }}
                          >
                            <Card 
                              className="text-center p-5 hover:shadow-lg transition-all cursor-pointer hover:bg-accent hover:scale-105"
                              onClick={() => router.push(item.route)}
                            >
                              <div className="text-4xl mb-2">{item.icon}</div>
                              <p className="text-sm font-medium">{item.label}</p>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Digital Content */}
                    <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
                          <FileText className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-xl font-bold">Digital Content</h3>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[
                          { icon: "📄", label: "PDF Guide", type: "pdf-guide", route: `/store/${storeId}/products/digital-download/create?type=pdf-guide` },
                          { icon: "📋", label: "Cheat Sheet", type: "cheat-sheet", route: `/store/${storeId}/products/digital-download/create?type=cheat-sheet` },
                          { icon: "🎨", label: "Template", type: "template", route: `/store/${storeId}/products/digital-download/create?type=template` },
                          { icon: "📝", label: "Blog Post", type: "blog-post", route: `/store/${storeId}/products/url-media/create?type=blog-post` },
                        ].map((item, index) => (
                          <motion.div
                            key={item.label}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.25 + index * 0.05 }}
                          >
                            <Card 
                              className="text-center p-5 hover:shadow-lg transition-all cursor-pointer hover:bg-accent hover:scale-105"
                              onClick={() => router.push(item.route)}
                            >
                              <div className="text-4xl mb-2">{item.icon}</div>
                              <p className="text-sm font-medium">{item.label}</p>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Services */}
                    <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-xl font-bold">Services</h3>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[
                          { icon: "🎼", label: "Playlist Curation", type: "playlist-curation", route: `/store/${storeId}/products/create?type=playlist-curation` },
                          { icon: "💬", label: "Coaching Session", type: "coaching", route: `/store/${storeId}/products/coaching-call/create?type=coaching` },
                          { icon: "🎚️", label: "Mixing Service", type: "mixing-service", route: `/store/${storeId}/products/coaching-call/create?type=mixing-service` },
                          { icon: "💿", label: "Mastering Service", type: "mastering-service", route: `/store/${storeId}/products/coaching-call/create?type=mastering-service` },
                        ].map((item, index) => (
                          <motion.div
                            key={item.label}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.35 + index * 0.05 }}
                          >
                            <Card 
                              className="text-center p-5 hover:shadow-lg transition-all cursor-pointer hover:bg-accent hover:scale-105"
                              onClick={() => router.push(item.route)}
                            >
                              <div className="text-4xl mb-2">{item.icon}</div>
                              <p className="text-sm font-medium">{item.label}</p>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Education */}
                    <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                          <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-xl font-bold">Education</h3>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[
                          { icon: "🎓", label: "Online Course", type: "course", route: `/store/${storeId}/course/create` },
                          { icon: "👥", label: "Workshop", type: "workshop", route: `/store/${storeId}/products/coaching-call/create?type=workshop` },
                          { icon: "⭐", label: "Masterclass", type: "masterclass", route: `/store/${storeId}/products/create?type=masterclass` },
                        ].map((item, index) => (
                          <motion.div
                            key={item.label}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.45 + index * 0.05 }}
                          >
                            <Card 
                              className="text-center p-5 hover:shadow-lg transition-all cursor-pointer hover:bg-accent hover:scale-105"
                              onClick={() => router.push(item.route)}
                            >
                              <div className="text-4xl mb-2">{item.icon}</div>
                              <p className="text-sm font-medium">{item.label}</p>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Community */}
                    <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-xl font-bold">Community</h3>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[
                          { icon: "👥", label: "Community", type: "community", route: `/store/${storeId}/products/digital-download/create?type=community` },
                        ].map((item, index) => (
                          <motion.div
                            key={item.label}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.55 + index * 0.05 }}
                          >
                            <Card 
                              className="text-center p-5 hover:shadow-lg transition-all cursor-pointer hover:bg-accent hover:scale-105"
                              onClick={() => router.push(item.route)}
                            >
                              <div className="text-4xl mb-2">{item.icon}</div>
                              <p className="text-sm font-medium">{item.label}</p>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Support */}
                    <div className="bg-card rounded-2xl shadow-sm border border-border/50 p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg">
                          <Gift className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-xl font-bold">Support & Donations</h3>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[
                          { icon: "☕", label: "Tip Jar", type: "tip-jar", route: `/store/${storeId}/products/digital-download/create?type=tip-jar` },
                          { icon: "💝", label: "Donation", type: "donation", route: `/store/${storeId}/products/digital-download/create?type=donation` },
                        ].map((item, index) => (
                          <motion.div
                            key={item.label}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.55 + index * 0.05 }}
                          >
                            <Card 
                              className="text-center p-5 hover:shadow-lg transition-all cursor-pointer hover:bg-accent hover:scale-105"
                              onClick={() => router.push(item.route)}
                            >
                              <div className="text-4xl mb-2">{item.icon}</div>
                              <p className="text-sm font-medium">{item.label}</p>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>

                  {/* Key Features */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
                  >
                    <Card className="text-center p-8 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800 hover:shadow-xl transition-all">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Gift className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="font-bold text-lg mb-2">Free with Download Gates</h4>
                      <p className="text-sm text-muted-foreground">
                        Grow your audience by requiring email or social follows to unlock free products
                      </p>
                    </Card>
                    
                    <Card className="text-center p-8 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800 hover:shadow-xl transition-all">
                      <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <DollarSign className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="font-bold text-lg mb-2">Direct Sales</h4>
                      <p className="text-sm text-muted-foreground">
                        Sell directly with Stripe checkout, instant delivery, and automatic email confirmations
                      </p>
                    </Card>
                    
                    <Card className="text-center p-8 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800 hover:shadow-xl transition-all">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Zap className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="font-bold text-lg mb-2">Flexible Pricing</h4>
                      <p className="text-sm text-muted-foreground">
                        Offer the same product as free (lead magnet) or paid. Test what works best for your audience.
                      </p>
                    </Card>
                  </motion.div>
                </TabsContent>
              )}
          </Tabs>
        </motion.div>

      </div>
    </div>
  );
} 
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
import {
  AlertTriangle,
  Music,
  BookOpen,
  Users,
  Zap,
  Search,
  Filter,
  Package,
  Plus,
  Eye,
  DollarSign,
  TrendingUp,
  Mail,
  Waves,
  Sparkles,
  Gift,
  FileText,
} from "lucide-react";
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
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Skeleton */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex-1 space-y-4">
            <Skeleton className="h-8 w-48 bg-purple-100 dark:bg-purple-900/20" />
            <Skeleton className="h-12 w-96" />
            <Skeleton className="h-6 w-full max-w-2xl" />
          </div>
          <Skeleton className="h-12 w-48" />
        </div>

        {/* Credit Balance Skeleton */}
        <Skeleton className="mb-8 h-24 w-full rounded-2xl" />

        {/* Stats Skeleton */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card
              key={i}
              className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="mb-2 h-8 w-16" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs Skeleton */}
        <div className="mb-8">
          <Skeleton className="mx-auto mb-8 h-12 w-full max-w-lg rounded-full" />

          {/* Products Grid Skeleton */}
          <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
            <Skeleton className="mb-6 h-10 w-full rounded-xl" />
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <Skeleton className="h-48 w-full rounded-t-lg" />
                  <CardContent className="p-6">
                    <Skeleton className="mb-2 h-6 w-3/4" />
                    <Skeleton className="mb-4 h-4 w-1/2" />
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
  onAction,
}: {
  icon: any;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
      <div className="px-6 py-20 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <Icon className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="mb-3 text-2xl font-semibold">{title}</h3>
        <p className="mx-auto mb-8 max-w-md text-muted-foreground">{description}</p>
        <Button
          onClick={onAction}
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:from-blue-700 hover:to-purple-700"
        >
          <Plus className="mr-2 h-5 w-5" />
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
  const convexUser: any = useQueryAny(getUserFromClerkFn, user?.id ? { clerkId: user.id } : "skip");

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
    return useQuery(api.digitalProducts.getProductsByStore, storeId ? { storeId } : "skip");
  })();

  // Get user's individual samples
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const individualSamples: any = (() => {
    // @ts-ignore TS2589 - Type instantiation is excessively deep
    return useQuery(api.samples.getStoreSamples, storeId ? { storeId } : "skip");
  })();

  // Extract samples from packs (stored in packFiles)
  const packSamples =
    digitalProducts
      ?.filter((p: any) => p.productCategory === "sample-pack" && p.packFiles)
      .flatMap((pack: any) => {
        try {
          const files = JSON.parse(pack.packFiles);
          return files.map((file: any) => ({
            _id: file.storageId,
            title: file.name.replace(/\.(wav|mp3|flac|aiff)$/i, ""), // Remove extension
            fileName: file.name,
            fileSize: file.size,
            storageId: file.storageId,
            fileUrl: file.url || file.storageId,
            category: "pack-sample",
            genre: pack.tags?.[0] || "Various",
            tags: pack.tags || [],
            creditPrice: 0, // Pack samples aren't sold individually
            isPublished: pack.isPublished,
            storeId: pack.storeId,
            userId: pack.userId,
            packId: pack._id,
            packTitle: pack.title,
            duration: 0,
            plays: 0,
            downloads: 0,
            favorites: 0,
          }));
        } catch (e) {
          console.error("Error parsing pack files:", e);
          return [];
        }
      }) || [];

  // Combine individual samples + pack samples
  const userSamples = [...(individualSamples || []), ...packSamples];

  // Debug logging for samples
  console.log("📊 Samples Debug:", {
    storeId,
    individualSamples: individualSamples?.length,
    packSamples: packSamples?.length,
    totalSamples: userSamples?.length,
    userSamples,
    sampleTitles: userSamples?.map((s: any) => s.title),
  });

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
      type: "course",
      productType: undefined,
      storeId: course.storeId,
    })) || []),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(digitalProducts?.map((product: any) => ({
      _id: product._id,
      title: product.title || "Untitled Product",
      description: product.description,
      price: product.price || 0,
      imageUrl: product.imageUrl,
      isPublished: product.isPublished,
      userId: product.userId,
      type: "digitalProduct",
      productType: product.productType, // Preserve the productType
      productCategory: product.productCategory, // Preserve the productCategory
      storeId: product.storeId,
    })) || []),
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const musicProducts = allProducts.filter(
    (p: any) =>
      p.type === "digitalProduct" &&
      p.productType !== "abletonRack" &&
      p.productType !== "abletonPreset"
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const abletonRacks = allProducts.filter(
    (p: any) => p.productType === "abletonRack" || p.productType === "abletonPreset"
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const courseProducts = allProducts.filter((p: any) => p.type === "course");

  // Check if data is still loading
  const isLoading =
    convexUser === undefined ||
    userCourses === undefined ||
    digitalProducts === undefined ||
    userSamples === undefined;

  // Calculate stats
  const stats = {
    totalProducts: allProducts.length + (userSamples?.length || 0),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    publishedProducts:
      allProducts.filter((p: any) => p.isPublished).length +
      (userSamples?.filter((s: any) => s.isPublished).length || 0),
    totalViews: 0, // Placeholder for future analytics
    totalRevenue: 0, // Placeholder for future analytics
  };

  // Show loading state while data is being fetched
  if (isLoading) {
    return <LoadingState />;
  }

  if (!storeId) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Store Not Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              The store you're trying to access could not be found or is invalid.
            </p>
            <Button onClick={() => router.push("/store")} variant="outline">
              Go Back to Store Selection
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleOptionClick = (optionId: string) => {
    if (!storeId) {
      console.error("No storeId provided");
      return;
    }

    // Route mapping to new unified product creation at /dashboard/create
    const routeMap: Record<string, string> = {
      // Music Products
      "sample-pack": "/dashboard/create/pack?type=sample-pack",
      "preset-pack": "/dashboard/create/pack?type=preset-pack",
      "ableton-rack": "/dashboard/create/chain",
      "beat-lease": "/dashboard/create/beat-lease",
      "project-files": "/dashboard/create/pack?type=project-files",

      // Content & Education
      ecourse: "/dashboard/create/course",
      digital: "/dashboard/create",

      // Services
      coaching: "/dashboard/create/coaching",
      "mixing-service": "/dashboard/create/service?type=mixing-service",

      // Community
      emails: "/dashboard/create?type=lead-magnet",
      membership: "#",
      webinar: "#",

      // Special
      bundle: "/dashboard/create?type=bundle",
      url: "/dashboard/create?type=url-media",
      affiliate: "#",

      // Legacy mappings (for backward compatibility)
      custom: "#",
      community: "#",
    };

    const comingSoonFeatures: Record<string, string> = {
      membership: "Membership Creation",
      webinar: "Webinar System",
      affiliate: "Affiliate Program",
      custom: "Custom Products",
      community: "Community Features",
    };

    const route = routeMap[optionId];
    if (route && route !== "#") {
      router.push(route);
    } else {
      const featureName = comingSoonFeatures[optionId] || "This feature";
      toast({
        title: "Coming Soon! 🚀",
        description: `${featureName} is currently in development and will be available in a future update.`,
        className: "bg-white dark:bg-black",
      });
    }
  };

  // Filter options based on search
  const filteredOptions = musicOptions.filter(
    (option) =>
      option.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      option.subtitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-2 dark:from-purple-900/20 dark:to-pink-900/20">
              <Music className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                Music Creator Studio
              </span>
            </div>
            <h1 className="mb-2 text-4xl font-bold text-slate-900 dark:text-slate-100 md:text-5xl">
              My Products
            </h1>
            <p className="text-xl leading-relaxed text-slate-600 dark:text-slate-400">
              Manage your existing products or create new ones to grow your music business
            </p>
          </div>

          {/* Quick Create Button */}
          <Button
            onClick={() => router.push("/dashboard/create")}
            size="lg"
            className="bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg hover:from-purple-600 hover:to-pink-600"
          >
            <Plus className="mr-2 h-5 w-5" />
            Create Product
          </Button>
        </motion.div>

        {/* Stats Overview - only show if user has products */}
        {allProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4"
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
            <TabsList className="mx-auto mb-8 grid w-full max-w-lg grid-cols-2">
              <TabsTrigger value="manage" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span>My Products</span>
              </TabsTrigger>
              <TabsTrigger value="create" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
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
                      <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm">
                        <Tabs defaultValue="all" className="w-full">
                          <TabsList className="h-auto rounded-xl bg-muted/50 p-1">
                            <TabsTrigger
                              value="all"
                              className="flex items-center gap-2 rounded-lg px-4 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                            >
                              <Package className="h-4 w-4" />
                              <span>All Products</span>
                              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                                {allProducts.length + (userSamples?.length || 0)}
                              </Badge>
                            </TabsTrigger>
                            <TabsTrigger
                              value="courses"
                              className="flex items-center gap-2 rounded-lg px-4 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                            >
                              <BookOpen className="h-4 w-4" />
                              <span>Courses</span>
                              {courseProducts.length > 0 && (
                                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                                  {courseProducts.length}
                                </Badge>
                              )}
                            </TabsTrigger>
                            <TabsTrigger
                              value="samples"
                              className="flex items-center gap-2 rounded-lg px-4 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                            >
                              <Music className="h-4 w-4" />
                              <span>Samples</span>
                              {userSamples && userSamples.length > 0 && (
                                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                                  {userSamples.length}
                                </Badge>
                              )}
                            </TabsTrigger>
                            <TabsTrigger
                              value="abletonRacks"
                              className="flex items-center gap-2 rounded-lg px-4 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                            >
                              <Waves className="h-4 w-4" />
                              <span>Racks</span>
                              {abletonRacks.length > 0 && (
                                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                                  {abletonRacks.length}
                                </Badge>
                              )}
                            </TabsTrigger>
                            <TabsTrigger
                              value="music"
                              className="flex items-center gap-2 rounded-lg px-4 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                            >
                              <Music className="h-4 w-4" />
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
                                  <h3 className="mb-4 text-lg font-semibold">Samples</h3>
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
                                  onAction={() => router.push("/dashboard/create/course")}
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
                                  onAction={() =>
                                    router.push("/dashboard/create/pack?type=sample-pack")
                                  }
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
                                  onAction={() => router.push("/dashboard/create/chain")}
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
                                  onAction={() => router.push("/dashboard/create/pack")}
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
                  className="mb-12 rounded-3xl border border-purple-200 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-12 dark:border-purple-800 dark:from-purple-950/20 dark:via-pink-950/20 dark:to-blue-950/20"
                >
                  <div className="text-center">
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm dark:bg-black/50">
                      <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                        Choose Your Product Type
                      </span>
                    </div>
                    <h2 className="mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
                      What would you like to create?
                    </h2>
                    <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
                      Select a product type below to get started. Each has a dedicated creation flow
                      optimized for your workflow.
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
                  <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
                    <div className="mb-6 flex items-center gap-3">
                      <div className="rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 p-2">
                        <Music className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold">Music Production</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                      {[
                        {
                          icon: "🎵",
                          label: "Sample Pack",
                          type: "sample-pack",
                          route: "/dashboard/create/pack?type=sample-pack",
                        },
                        {
                          icon: "🎛️",
                          label: "Preset Pack",
                          type: "preset-pack",
                          route: "/dashboard/create/pack?type=preset-pack",
                        },
                        {
                          icon: "🎹",
                          label: "MIDI Pack",
                          type: "midi-pack",
                          route: "/dashboard/create/pack?type=midi-pack",
                        },
                        {
                          icon: "🔊",
                          label: "Ableton Rack",
                          type: "ableton-rack",
                          route: "/dashboard/create/chain",
                        },
                        {
                          icon: "🎹",
                          label: "Beat Lease",
                          type: "beat-lease",
                          route: "/dashboard/create/beat-lease",
                        },
                        {
                          icon: "📁",
                          label: "Project Files",
                          type: "project-files",
                          route: "/dashboard/create/pack?type=project-files",
                        },
                        {
                          icon: "🎚️",
                          label: "Mixing Template",
                          type: "mixing-template",
                          route: "/dashboard/create/pack?type=mixing-template",
                        },
                        {
                          icon: "📦",
                          label: "Bundle",
                          type: "bundle",
                          route: "/dashboard/create?type=bundle",
                        },
                      ].map((item, index) => (
                        <motion.div
                          key={item.label}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.15 + index * 0.05 }}
                        >
                          <Card
                            className="cursor-pointer p-5 text-center transition-all hover:scale-105 hover:bg-accent hover:shadow-lg"
                            onClick={() => router.push(item.route)}
                          >
                            <div className="mb-2 text-4xl">{item.icon}</div>
                            <p className="text-sm font-medium">{item.label}</p>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Digital Content */}
                  <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
                    <div className="mb-6 flex items-center gap-3">
                      <div className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 p-2">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold">Digital Content</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                      {[
                        {
                          icon: "📄",
                          label: "PDF Guide",
                          type: "pdf-guide",
                          route: "/dashboard/create/pdf",
                        },
                        {
                          icon: "📋",
                          label: "Cheat Sheet",
                          type: "cheat-sheet",
                          route: "/dashboard/create/pdf?type=cheat-sheet",
                        },
                        {
                          icon: "🎨",
                          label: "Template",
                          type: "template",
                          route: "/dashboard/create?type=template",
                        },
                        {
                          icon: "📝",
                          label: "Blog Post",
                          type: "blog-post",
                          route: "/dashboard/create?type=blog-post",
                        },
                      ].map((item, index) => (
                        <motion.div
                          key={item.label}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.25 + index * 0.05 }}
                        >
                          <Card
                            className="cursor-pointer p-5 text-center transition-all hover:scale-105 hover:bg-accent hover:shadow-lg"
                            onClick={() => router.push(item.route)}
                          >
                            <div className="mb-2 text-4xl">{item.icon}</div>
                            <p className="text-sm font-medium">{item.label}</p>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Services */}
                  <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
                    <div className="mb-6 flex items-center gap-3">
                      <div className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 p-2">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold">Services</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                      {[
                        {
                          icon: "🎼",
                          label: "Playlist Curation",
                          type: "playlist-curation",
                          route: "/dashboard/create/service?type=playlist-curation",
                        },
                        {
                          icon: "💬",
                          label: "Coaching Session",
                          type: "coaching",
                          route: "/dashboard/create/coaching",
                        },
                        {
                          icon: "🎚️",
                          label: "Mixing Service",
                          type: "mixing-service",
                          route: "/dashboard/create/service?type=mixing-service",
                        },
                        {
                          icon: "💿",
                          label: "Mastering Service",
                          type: "mastering-service",
                          route: "/dashboard/create/service?type=mastering-service",
                        },
                      ].map((item, index) => (
                        <motion.div
                          key={item.label}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.35 + index * 0.05 }}
                        >
                          <Card
                            className="cursor-pointer p-5 text-center transition-all hover:scale-105 hover:bg-accent hover:shadow-lg"
                            onClick={() => router.push(item.route)}
                          >
                            <div className="mb-2 text-4xl">{item.icon}</div>
                            <p className="text-sm font-medium">{item.label}</p>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Education */}
                  <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
                    <div className="mb-6 flex items-center gap-3">
                      <div className="rounded-lg bg-gradient-to-r from-orange-500 to-red-500 p-2">
                        <BookOpen className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold">Education</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                      {[
                        {
                          icon: "🎓",
                          label: "Online Course",
                          type: "course",
                          route: "/dashboard/create/course",
                        },
                        {
                          icon: "👥",
                          label: "Workshop",
                          type: "workshop",
                          route: "/dashboard/create/coaching?type=workshop",
                        },
                        {
                          icon: "⭐",
                          label: "Masterclass",
                          type: "masterclass",
                          route: "/dashboard/create/course?type=masterclass",
                        },
                      ].map((item, index) => (
                        <motion.div
                          key={item.label}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.45 + index * 0.05 }}
                        >
                          <Card
                            className="cursor-pointer p-5 text-center transition-all hover:scale-105 hover:bg-accent hover:shadow-lg"
                            onClick={() => router.push(item.route)}
                          >
                            <div className="mb-2 text-4xl">{item.icon}</div>
                            <p className="text-sm font-medium">{item.label}</p>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Community */}
                  <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
                    <div className="mb-6 flex items-center gap-3">
                      <div className="rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 p-2">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold">Community</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                      {[
                        {
                          icon: "👥",
                          label: "Community",
                          type: "community",
                          route: "/dashboard/create?type=community",
                        },
                      ].map((item, index) => (
                        <motion.div
                          key={item.label}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.55 + index * 0.05 }}
                        >
                          <Card
                            className="cursor-pointer p-5 text-center transition-all hover:scale-105 hover:bg-accent hover:shadow-lg"
                            onClick={() => router.push(item.route)}
                          >
                            <div className="mb-2 text-4xl">{item.icon}</div>
                            <p className="text-sm font-medium">{item.label}</p>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Support */}
                  <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
                    <div className="mb-6 flex items-center gap-3">
                      <div className="rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 p-2">
                        <Gift className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold">Support & Donations</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                      {[
                        {
                          icon: "☕",
                          label: "Tip Jar",
                          type: "tip-jar",
                          route: "/dashboard/create?type=tip-jar",
                        },
                        {
                          icon: "💝",
                          label: "Donation",
                          type: "donation",
                          route: "/dashboard/create?type=donation",
                        },
                      ].map((item, index) => (
                        <motion.div
                          key={item.label}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.55 + index * 0.05 }}
                        >
                          <Card
                            className="cursor-pointer p-5 text-center transition-all hover:scale-105 hover:bg-accent hover:shadow-lg"
                            onClick={() => router.push(item.route)}
                          >
                            <div className="mb-2 text-4xl">{item.icon}</div>
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
                  className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3"
                >
                  <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-8 text-center transition-all hover:shadow-xl dark:border-blue-800 dark:from-blue-950/20 dark:to-cyan-950/20">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg">
                      <Gift className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="mb-2 text-lg font-bold">Free with Download Gates</h4>
                    <p className="text-sm text-muted-foreground">
                      Grow your audience by requiring email or social follows to unlock free
                      products
                    </p>
                  </Card>

                  <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-8 text-center transition-all hover:shadow-xl dark:border-green-800 dark:from-green-950/20 dark:to-emerald-950/20">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg">
                      <DollarSign className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="mb-2 text-lg font-bold">Direct Sales</h4>
                    <p className="text-sm text-muted-foreground">
                      Sell directly with Stripe checkout, instant delivery, and automatic email
                      confirmations
                    </p>
                  </Card>

                  <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-8 text-center transition-all hover:shadow-xl dark:border-purple-800 dark:from-purple-950/20 dark:to-pink-950/20">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
                      <Zap className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="mb-2 text-lg font-bold">Flexible Pricing</h4>
                    <p className="text-sm text-muted-foreground">
                      Offer the same product as free (lead magnet) or paid. Test what works best for
                      your audience.
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

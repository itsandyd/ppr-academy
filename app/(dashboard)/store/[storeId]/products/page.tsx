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
import { AlertTriangle, Music, BookOpen, Users, Zap, Search, Filter, Package, Plus, Eye, DollarSign, TrendingUp, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MusicOptionCard } from "../components/MusicOptionCard";
import { musicOptions, groupedOptions, popularOptions } from "../components/music-options";
import { ProductsList } from "../../components/ProductsList";
import { SamplesList } from "@/components/samples/SamplesList";
import { CreditBalance } from "@/components/credits/CreditBalance";
import { useToast } from "@/hooks/use-toast";

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
  const convexUser = useQuery(
    api.users.getUserFromClerk,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Get user's products (using clerkId since courses.userId stores clerkId)
  const userCourses = useQuery(
    api.courses.getCoursesByUser,
    convexUser?.clerkId ? { userId: convexUser.clerkId } : "skip"
  );

  const digitalProducts = useQuery(
    api.digitalProducts.getProductsByUser,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

  // Get user's samples
  const userSamples = useQuery(
    api.samples.getStoreSamples,
    storeId ? { storeId } : "skip"
  );

  // Combine products for display
  const allProducts = [
    ...(userCourses?.map(course => ({
      _id: course._id,
      title: course.title,
      description: course.description,
      price: course.price || 0,
      imageUrl: course.imageUrl,
      isPublished: course.isPublished,
      slug: course.slug,
      userId: course.userId,
      type: 'course',
      storeId: course.storeId,
    })) || []),
    ...(digitalProducts?.map(product => ({
      _id: product._id,
      title: product.title || 'Untitled Product',
      description: product.description,
      price: product.price || 0,
      imageUrl: product.imageUrl,
      isPublished: product.isPublished,
      userId: product.userId,
      type: 'digitalProduct',
      storeId: product.storeId,
    })) || [])
  ];

  const musicProducts = allProducts.filter(p => p.type === 'digitalProduct');
  const courseProducts = allProducts.filter(p => p.type === 'course');

  // Calculate stats
  const stats = {
    totalProducts: allProducts.length + (userSamples?.length || 0),
    publishedProducts: allProducts.filter(p => p.isPublished).length + (userSamples?.filter(s => s.isPublished).length || 0),
    totalViews: 0, // Placeholder for future analytics
    totalRevenue: 0, // Placeholder for future analytics
  };

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
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
                      <Tabs defaultValue="all" className="space-y-6">
                        <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4">
                          <TabsTrigger value="all" className="flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            All
                          </TabsTrigger>
                          <TabsTrigger value="samples" className="flex items-center gap-2">
                            <Music className="w-4 h-4" />
                            Samples
                            {userSamples && userSamples.length > 0 && (
                              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                                {userSamples.length}
                              </Badge>
                            )}
                          </TabsTrigger>
                          <TabsTrigger value="music" className="flex items-center gap-2">
                            <Music className="w-4 h-4" />
                            Products
                          </TabsTrigger>
                          <TabsTrigger value="courses" className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            Courses
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="all">
                          {userSamples && userSamples.length > 0 && (
                            <div className="mb-8">
                              <SamplesList samples={userSamples} storeId={storeId} />
                            </div>
                          )}
                          <ProductsList products={allProducts} storeId={storeId} />
                        </TabsContent>
                        <TabsContent value="samples">
                          {userSamples && userSamples.length > 0 ? (
                            <SamplesList samples={userSamples} storeId={storeId} />
                          ) : (
                            <Card className="text-center py-16">
                              <CardContent>
                                <Music className="w-20 h-20 text-muted-foreground mx-auto mb-6" />
                                <h3 className="text-2xl font-semibold mb-3">No samples yet</h3>
                                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                                  Upload your first sample to start building your sample library and earning credits.
                                </p>
                                <Button 
                                  onClick={() => router.push(`/store/${storeId}/samples/upload`)}
                                  className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  Upload Sample
                                </Button>
                              </CardContent>
                            </Card>
                          )}
                        </TabsContent>
                        <TabsContent value="music">
                          <ProductsList products={musicProducts} storeId={storeId} />
                        </TabsContent>
                        <TabsContent value="courses">
                          <ProductsList products={courseProducts} storeId={storeId} />
                        </TabsContent>
                      </Tabs>
                    ) : (
                      <Card className="text-center py-16">
                        <CardContent>
                          <Package className="w-20 h-20 text-muted-foreground mx-auto mb-6" />
                          <h3 className="text-2xl font-semibold mb-3">No products yet</h3>
                          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                            Start by creating your first product to begin selling your music and content to your audience.
                          </p>
                          <Button 
                            onClick={() => setActiveTab("create")}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Your First Product
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </motion.div>
                </TabsContent>
              )}

              {activeTab === "create" && (
                <TabsContent key="tab-create" value="create" className="space-y-8">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/20 px-4 py-2 rounded-full mb-4">
                      <Plus className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">Create New Product</span>
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                      What are you creating today?
                    </h2>
                    <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
                      Choose the perfect format for your music content — from sample packs and beats to courses and coaching sessions.
                    </p>
                  </div>

                  {/* Quick Create Buttons - Always Visible */}
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 text-center">
                      📦 Choose Your Product Type
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleOptionClick('ecourse')}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Music Course</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Teach production, mixing, theory</p>
                        </div>
                      </div>
                    </Card>
                    
                    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleOptionClick('digital')}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-slate-600 to-slate-800 rounded-lg flex items-center justify-center">
                          <Package className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Digital Product</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">PDFs, guides, templates</p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleOptionClick('membership')}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-violet-500 to-purple-500 rounded-lg flex items-center justify-center">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Subscription</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Monthly membership</p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleOptionClick('emails')}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center">
                          <Mail className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Lead Magnet</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Free content for emails</p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleOptionClick('sample-pack')}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                          <Music className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Sample Pack</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Drums, loops, one-shots</p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleOptionClick('coaching')}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Coaching Call</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">1-on-1 sessions</p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleOptionClick('beat-lease')}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                          <Music className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Beat Lease</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">License your beats</p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleOptionClick('preset-pack')}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                          <Package className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Preset Pack</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Synth presets, effects</p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleOptionClick('webinar')}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Live Workshop</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Group sessions</p>
                        </div>
                      </div>
                    </Card>
                    </div>
                  </div>

                  {/* Creation Category Tabs */}
                  <Tabs defaultValue="popular" className="w-full">
                    <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4 mb-8">
                      <TabsTrigger value="popular" className="flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        <span className="hidden sm:inline">Popular</span>
                      </TabsTrigger>
                      <TabsTrigger value="music" className="flex items-center gap-2">
                        <Music className="w-4 h-4" />
                        <span className="hidden sm:inline">Music</span>
                      </TabsTrigger>
                      <TabsTrigger value="content" className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        <span className="hidden sm:inline">Content</span>
                      </TabsTrigger>
                      <TabsTrigger value="services" className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span className="hidden sm:inline">Services</span>
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="popular" className="space-y-8">
                      <motion.div
                        key="popular-header"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="text-center mb-8"
                      >
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                          🔥 Most Popular Choices
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400">
                          The top picks among music creators on our platform
                        </p>
                      </motion.div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {popularOptions.map((option, index) => (
                          <MusicOptionCard
                            key={`popular-${option.id}`}
                            title={option.title}
                            subtitle={option.subtitle}
                            icon={option.icon}
                            gradient={option.gradient}
                            iconColor={option.iconColor}
                            isPopular={option.isPopular}
                            isNew={option.isNew}
                            onClick={() => handleOptionClick(option.id)}
                            index={index}
                          />
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="music" className="space-y-8">
                      <motion.div
                        key="music-header"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="text-center mb-8"
                      >
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                          🎵 Music Products
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400">
                          Sell your beats, samples, presets, and project files
                        </p>
                      </motion.div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {groupedOptions.music.map((option, index) => (
                          <MusicOptionCard
                            key={`music-${option.id}`}
                            title={option.title}
                            subtitle={option.subtitle}
                            icon={option.icon}
                            gradient={option.gradient}
                            iconColor={option.iconColor}
                            isPopular={option.isPopular}
                            isNew={option.isNew}
                            onClick={() => handleOptionClick(option.id)}
                            index={index}
                          />
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="content" className="space-y-8">
                      <motion.div
                        key="content-header"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="text-center mb-8"
                      >
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                          📚 Educational Content
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400">
                          Share your knowledge through courses, guides, and tutorials
                        </p>
                      </motion.div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {groupedOptions.content.map((option, index) => (
                          <MusicOptionCard
                            key={`content-${option.id}`}
                            title={option.title}
                            subtitle={option.subtitle}
                            icon={option.icon}
                            gradient={option.gradient}
                            iconColor={option.iconColor}
                            isPopular={option.isPopular}
                            isNew={option.isNew}
                            onClick={() => handleOptionClick(option.id)}
                            index={index}
                          />
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="services" className="space-y-8">
                      <motion.div
                        key="services-header"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="text-center mb-8"
                      >
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                          🎧 Services & Community
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400">
                          Offer coaching, mixing services, and build your community
                        </p>
                      </motion.div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...groupedOptions.services, ...groupedOptions.community].map((option, index) => (
                          <MusicOptionCard
                            key={`services-${option.id}`}
            title={option.title}
            subtitle={option.subtitle}
            icon={option.icon}
                            gradient={option.gradient}
                            iconColor={option.iconColor}
                            isPopular={option.isPopular}
                            isNew={option.isNew}
            onClick={() => handleOptionClick(option.id)}
                            index={index}
          />
        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </TabsContent>
              )}
          </Tabs>
        </motion.div>

        {/* Quick Start Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16"
        >
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 border-purple-200 dark:border-purple-800">
            <CardContent className="p-8">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                  💡 New to selling music online?
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-2xl mx-auto">
                  Start with a <strong>Sample Pack</strong> or <strong>Beat Lease</strong> — they're the most popular and easiest to get started with!
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button 
                    onClick={() => handleOptionClick('sample-pack')}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    <Music className="w-4 h-4 mr-2" />
                    Start with Sample Pack
                  </Button>
                  <Button 
                    onClick={() => handleOptionClick('beat-lease')}
                    variant="outline"
                    className="border-purple-200 hover:bg-purple-50 dark:border-purple-700 dark:hover:bg-purple-900/20"
                  >
                    Try Beat Licensing
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
} 
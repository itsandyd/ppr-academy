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
import { AlertTriangle, Music, BookOpen, Users, Zap, Search, Filter, Package, Plus, Eye, DollarSign, TrendingUp, Mail, Waves, Sparkles, Gift } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MusicOptionCard } from "../components/MusicOptionCard";
import { musicOptions, groupedOptions, popularOptions } from "../components/music-options";
import { ProductsList } from "../../components/ProductsList";
import { SamplesList } from "@/components/samples/SamplesList";
import { CreditBalance } from "@/components/credits/CreditBalance";
import { useToast } from "@/hooks/use-toast";
import { ProductTypeSelector } from "@/components/products/product-type-selector";

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
    api.digitalProducts.getProductsByStore,
    storeId ? { storeId } : "skip"
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
      productType: undefined,
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
      productType: product.productType, // Preserve the productType
      storeId: product.storeId,
    })) || [])
  ];

  const musicProducts = allProducts.filter(p => p.type === 'digitalProduct' && p.productType !== 'abletonRack' && p.productType !== 'abletonPreset');
  const abletonRacks = allProducts.filter(p => p.productType === 'abletonRack' || p.productType === 'abletonPreset');
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
                      <Tabs defaultValue="all" className="space-y-6">
                        <TabsList className="grid w-full max-w-3xl mx-auto grid-cols-5">
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
                          <TabsTrigger value="abletonRacks" className="flex items-center gap-2">
                            <Waves className="w-4 h-4" />
                            Racks
                            {abletonRacks.length > 0 && (
                              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                                {abletonRacks.length}
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
                        <TabsContent value="abletonRacks">
                          {abletonRacks.length > 0 ? (
                            <ProductsList products={abletonRacks} storeId={storeId} />
                          ) : (
                            <Card className="text-center py-16">
                              <CardContent>
                                <Waves className="w-20 h-20 text-muted-foreground mx-auto mb-6" />
                                <h3 className="text-2xl font-semibold mb-3">No Ableton racks yet</h3>
                                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                                  Upload your first Ableton rack to start sharing your custom device chains and sound design.
                                </p>
                                <Button 
                                  onClick={() => handleOptionClick('ableton-rack')}
                                  className="bg-gradient-to-r from-chart-1 to-chart-2 hover:from-chart-1/90 hover:to-chart-2/90"
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  Create Ableton Rack
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
                            onClick={() => router.push(`/store/${storeId}/products/create`)}
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
                  {/* Hero Section */}
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                  >
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 px-4 py-2 rounded-full mb-6">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Universal Product Creator</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                      Create Your Product
                    </h2>
                    <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed mb-8">
                      One simple wizard for everything — sample packs, PDFs, tip jars, playlists, and more. 
                      Choose free with download gates or direct sales.
                    </p>
                    
                    {/* Main CTA */}
                    <Button
                      onClick={() => router.push(`/store/${storeId}/products/create`)}
                      size="lg"
                      className="text-lg px-8 py-6 h-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all"
                    >
                      <Plus className="w-6 h-6 mr-2" />
                      Start Creating →
                    </Button>
                  </motion.div>

                  {/* What You Can Create - Organized by Category */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-10"
                  >
                    {/* Music Production */}
                    <div>
                      <h3 className="text-xl font-bold mb-6">Music Production</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[
                          { icon: "🎵", label: "Sample Pack", type: "sample-pack" },
                          { icon: "🎛️", label: "Preset Pack", type: "preset-pack" },
                          { icon: "🎹", label: "MIDI Pack", type: "midi-pack" },
                          { icon: "🔊", label: "Ableton Rack", type: "ableton-rack" },
                          { icon: "🎹", label: "Beat Lease", type: "beat-lease" },
                          { icon: "📁", label: "Project Files", type: "project-files" },
                          { icon: "🎚️", label: "Mixing Template", type: "mixing-template" },
                        ].map((item, index) => (
                          <motion.div
                            key={item.label}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.15 + index * 0.05 }}
                          >
                            <Card 
                              className="text-center p-5 hover:shadow-lg transition-all cursor-pointer hover:bg-accent hover:scale-105"
                              onClick={() => router.push(`/store/${storeId}/products/create?type=${item.type}`)}
                            >
                              <div className="text-4xl mb-2">{item.icon}</div>
                              <p className="text-sm font-medium">{item.label}</p>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Digital Content */}
                    <div>
                      <h3 className="text-xl font-bold mb-6">Digital Content</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[
                          { icon: "📄", label: "PDF Guide", type: "pdf-guide" },
                          { icon: "📋", label: "Cheat Sheet", type: "cheat-sheet" },
                          { icon: "🎨", label: "Template", type: "template" },
                          { icon: "📝", label: "Blog Post", type: "blog-post" },
                        ].map((item, index) => (
                          <motion.div
                            key={item.label}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.25 + index * 0.05 }}
                          >
                            <Card 
                              className="text-center p-5 hover:shadow-lg transition-all cursor-pointer hover:bg-accent hover:scale-105"
                              onClick={() => router.push(`/store/${storeId}/products/create?type=${item.type}`)}
                            >
                              <div className="text-4xl mb-2">{item.icon}</div>
                              <p className="text-sm font-medium">{item.label}</p>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Services */}
                    <div>
                      <h3 className="text-xl font-bold mb-6">Services</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[
                          { icon: "🎼", label: "Playlist Curation", type: "playlist-curation" },
                          { icon: "💬", label: "Coaching Session", type: "coaching" },
                          { icon: "🎚️", label: "Mixing Service", type: "mixing-service" },
                          { icon: "💿", label: "Mastering Service", type: "mastering-service" },
                        ].map((item, index) => (
                          <motion.div
                            key={item.label}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.35 + index * 0.05 }}
                          >
                            <Card 
                              className="text-center p-5 hover:shadow-lg transition-all cursor-pointer hover:bg-accent hover:scale-105"
                              onClick={() => router.push(`/store/${storeId}/products/create?type=${item.type}`)}
                            >
                              <div className="text-4xl mb-2">{item.icon}</div>
                              <p className="text-sm font-medium">{item.label}</p>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Education */}
                    <div>
                      <h3 className="text-xl font-bold mb-6">Education</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[
                          { icon: "🎓", label: "Online Course", type: "course" },
                          { icon: "👥", label: "Workshop", type: "workshop" },
                          { icon: "⭐", label: "Masterclass", type: "masterclass" },
                        ].map((item, index) => (
                          <motion.div
                            key={item.label}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.45 + index * 0.05 }}
                          >
                            <Card 
                              className="text-center p-5 hover:shadow-lg transition-all cursor-pointer hover:bg-accent hover:scale-105"
                              onClick={() => router.push(`/store/${storeId}/products/create?type=${item.type}`)}
                            >
                              <div className="text-4xl mb-2">{item.icon}</div>
                              <p className="text-sm font-medium">{item.label}</p>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Support */}
                    <div>
                      <h3 className="text-xl font-bold mb-6">Support</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[
                          { icon: "☕", label: "Tip Jar", type: "tip-jar" },
                          { icon: "💝", label: "Donation", type: "donation" },
                        ].map((item, index) => (
                          <motion.div
                            key={item.label}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.55 + index * 0.05 }}
                          >
                            <Card 
                              className="text-center p-5 hover:shadow-lg transition-all cursor-pointer hover:bg-accent hover:scale-105"
                              onClick={() => router.push(`/store/${storeId}/products/create?type=${item.type}`)}
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
                  >
                    <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                      <Card className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800">
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Gift className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="font-bold mb-2">Free with Download Gates</h4>
                        <p className="text-sm text-muted-foreground">
                          Grow your audience by requiring email or social follows to unlock free products
                        </p>
                      </Card>
                      
                      <Card className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                          <DollarSign className="w-6 h-6 text-white" />
                      </div>
                        <h4 className="font-bold mb-2">Direct Sales</h4>
                        <p className="text-sm text-muted-foreground">
                          Sell directly with Stripe checkout, instant delivery, and automatic email confirmations
                        </p>
                      </Card>
                      
                      <Card className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
                        <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Zap className="w-6 h-6 text-white" />
                      </div>
                        <h4 className="font-bold mb-2">Flexible Pricing</h4>
                        <p className="text-sm text-muted-foreground">
                          Offer the same product as free (lead magnet) or paid. Test what works best for your audience.
                        </p>
                      </Card>
                      </div>
                      </motion.div>
                </TabsContent>
              )}
          </Tabs>
        </motion.div>

      </div>
    </div>
  );
} 
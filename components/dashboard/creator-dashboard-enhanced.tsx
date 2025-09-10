/**
 * Enhanced Creator Dashboard - Mobile-First, Music Creator Focused
 * Modern UI with responsive design, quick actions, and music-specific features
 */

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  Users, 
  TrendingUp, 
  Plus,
  DollarSign,
  BarChart,
  Video,
  Clock,
  Star,
  Loader2,
  MessageSquare,
  Calendar,
  Package,
  Music,
  FileText,
  Crown,
  Menu,
  X,
  Upload,
  Play,
  Headphones,
  Mic,
  Zap,
  Eye,
  Download,
  Share,
  Settings,
  Bell,
  Search,
  Filter,
  ChevronUp,
  ChevronDown,
  Activity,
  Waves
} from "lucide-react";

// Hooks and components
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { features } from "@/lib/features";
import { createCoachApplication, getUserCoachProfile, updateCoachApplication } from "@/app/actions/coaching-actions";
import CoachScheduleManager from "@/components/coach-schedule-manager";

// Product type interface for compatibility
interface Product {
  _id: string;
  title: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  isPublished?: boolean;
  type?: string;
  category?: string;
  slug?: string;
  downloadCount?: number;
  rating?: number;
  storeId?: string; // Add storeId for proper routing
}

type ProductType = "course" | "digitalProduct" | "coaching" | "samplePack" | "preset";

interface CreatorDashboardEnhancedProps {
  legacyDashboardStats?: {
    enrolledCourses: number;
    completedCourses: number;
    createdCourses: number;
    totalStudents: number;
  };
}

export function CreatorDashboardEnhanced({ 
  legacyDashboardStats 
}: CreatorDashboardEnhancedProps) {
  const { user } = useUser();
  const { toast } = useToast();
  
  // First, get the Convex user record from Clerk ID
  const convexUser = useQuery(
    api.users.getUserFromClerk,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Use the Convex user ID for all queries
  const convexUserId = convexUser?._id;

  // Fetch user's stores using Clerk user ID (stores use Clerk IDs)
  const stores = useQuery(
    api.stores.getStoresByUser,
    user?.id ? { userId: user.id } : "skip"
  );
  
  // Get the first store ID (or use a fallback)
  const storeId = stores?.[0]?._id;
  
  // Fetch data using Convex
  const courses = useQuery(api.courses.getCourses, {});
  const digitalProducts = useQuery(api.digitalProducts.getProductsByUser, 
    convexUserId ? { userId: convexUserId } : "skip"
  );
  
  // Combine products for unified display
  const products = React.useMemo(() => {
    const transformedCourses = (courses || []).map(course => ({
      _id: course._id,
      title: course.title,
      description: course.description,
      price: course.price || 0,
      imageUrl: course.imageUrl,
      isPublished: course.isPublished,
      type: 'course',
      slug: course.slug,
      category: course.category,
      downloadCount: 0,
      rating: 4.5,
      storeId: (course as any).storeId, // Include storeId for proper routing
    }));

    const transformedDigitalProducts = (digitalProducts || []).map(product => ({
      _id: product._id,
      title: product.title,
      description: product.description,
      price: product.price || 0,
      imageUrl: product.imageUrl,
      isPublished: product.isPublished,
      type: 'digitalProduct',
      slug: (product as any).slug || product._id,
      category: (product as any).category || 'Digital',
      downloadCount: (product as any).downloadCount || 0,
      rating: 4.5,
      storeId: (product as any).storeId, // Include storeId for proper routing
    }));

    return [...transformedCourses, ...transformedDigitalProducts];
  }, [courses, digitalProducts]);

  const isLoadingProducts = courses === undefined || digitalProducts === undefined;
  
  // Enhanced state for mobile-first design
  const [activeTab, setActiveTab] = useState("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCoachingDialogOpen, setIsCoachingDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [existingProfile, setExistingProfile] = useState<any>(null);
  const [isCreateProductDialogOpen, setIsCreateProductDialogOpen] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  
  // Form states (unchanged from original)
  const [coachingForm, setCoachingForm] = useState({
    category: "",
    title: "",
    description: "",
    basePrice: "",
    location: "",
    timezone: "",
    availableDays: "",
    availableHours: "",
  });

  const [newProductForm, setNewProductForm] = useState({
    type: "course" as ProductType,
    title: "",
    description: "",
    price: "",
  });

  // Enhanced dashboard metrics with music-specific data
  const dashboardMetrics = {
    totalProducts: products.length,
    publishedProducts: products.filter((p: any) => p.isPublished).length,
    draftProducts: products.filter((p: any) => !p.isPublished).length,
    totalRevenue: products.reduce((sum: number, p: any) => sum + (p.price || 0), 0),
    totalStudents: legacyDashboardStats?.totalStudents || 0,
    courseCount: products.filter((p: any) => p.type === 'course').length,
    coachingCount: products.filter((p: any) => p.type === 'coaching').length,
    digitalProductCount: products.filter((p: any) => p.type === 'digitalProduct').length,
    // Music-specific metrics
    samplePackCount: products.filter((p: any) => p.category?.includes('sample') || p.type === 'samplePack').length,
    presetCount: products.filter((p: any) => p.category?.includes('preset') || p.type === 'preset').length,
    totalDownloads: products.reduce((sum: number, p: any) => sum + (p.downloadCount || 0), 0),
    averageRating: products.reduce((sum: number, p: any) => sum + (p.rating || 0), 0) / products.length || 0,
  };

  // Quick action items for music creators
  const quickActions = [
    {
      id: 'upload-sample-pack',
      title: 'Upload Sample Pack',
      description: 'Share your beats and loops',
      icon: Music,
      color: 'from-purple-500 to-pink-500',
      action: () => setIsCreateProductDialogOpen(true)
    },
    {
      id: 'create-preset',
      title: 'Create Preset',
      description: 'Upload synth presets',
      icon: Waves,
      color: 'from-blue-500 to-cyan-500',
      action: () => setIsCreateProductDialogOpen(true)
    },
    {
      id: 'new-course',
      title: 'New Course',
      description: 'Teach production skills',
      icon: BookOpen,
      color: 'from-green-500 to-emerald-500',
      action: () => window.location.href = '/create-course'
    },
    {
      id: 'coaching-session',
      title: 'Offer Coaching',
      description: '1-on-1 mentoring',
      icon: Headphones,
      color: 'from-orange-500 to-red-500',
      action: () => handleOpenCoachingDialog()
    }
  ];

  // Handle functions (simplified for demo)
  const handleCreateProduct = async () => {
    try {
      // For now, just show success message - implement actual creation logic later
      toast({
        title: "Product Created",
        description: `${newProductForm.type} "${newProductForm.title}" will be created.`,
      });
      
      setIsCreateProductDialogOpen(false);
      setNewProductForm({
        type: "course",
        title: "",
        description: "",
        price: "",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create product. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditProduct = (product: Product) => {
    if (product.type === 'course') {
      // For courses, check if the storeId is valid or if it's actually a user ID
      let courseStoreId = product.storeId;
      
      // If the storeId looks like a user ID (starts with "ks" - Convex user ID pattern), 
      // use the user's actual store ID instead
      if (courseStoreId && courseStoreId.startsWith('ks7')) {
        console.log('⚠️ Course has invalid storeId (user ID):', courseStoreId, 'using user store:', storeId);
        courseStoreId = storeId; // Use the user's actual store ID
      }
      
      // Fallback to user's store or setup
      courseStoreId = courseStoreId || storeId || 'setup';
      
      const editUrl = `/store/${courseStoreId}/course/create?edit=${product._id}`;
      console.log('🔗 Editing course with URL:', editUrl);
      window.location.href = editUrl;
    } else {
      // Route to digital product editing
      const editUrl = `/products/${product.slug || product._id}/edit`;
      window.location.href = editUrl;
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (confirm(`Are you sure you want to delete "${product.title}"?`)) {
      toast({
        title: "Product Deleted",
        description: `"${product.title}" has been deleted.`,
      });
    }
  };

  const handlePublishProduct = async (product: Product) => {
    toast({
      title: "Product Published",
      description: `"${product.title}" is now live.`,
    });
  };

  const handleUnpublishProduct = async (product: Product) => {
    toast({
      title: "Product Unpublished",
      description: `"${product.title}" has been unpublished.`,
    });
  };

  const handleOpenCoachingDialog = async () => {
    setIsLoadingProfile(true);
    setIsCoachingDialogOpen(true);
    
    try {
      const result = await getUserCoachProfile();
      
      if (result.success && result.profile) {
        setExistingProfile(result.profile);
        setCoachingForm({
          category: result.profile.category || "",
          title: result.profile.title || "",
          description: result.profile.description || "",
          basePrice: result.profile.basePrice?.toString() || "",
          location: result.profile.location || "",
          timezone: result.profile.timezone || "",
          availableDays: result.profile.availableDays || "",
          availableHours: result.profile.availableHours || "",
        });
      } else {
        setExistingProfile(null);
        setCoachingForm({
          category: "",
          title: "",
          description: "",
          basePrice: "",
          location: "",
          timezone: "",
          availableDays: "",
          availableHours: "",
        });
      }
    } catch (error) {
      console.error("Error fetching coach profile:", error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleSubmitCoaching = async () => {
    if (!coachingForm.category || !coachingForm.title || !coachingForm.description || !coachingForm.basePrice) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in specialty, title, description, and hourly rate.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const applicationData = {
        ...coachingForm,
        basePrice: Number(coachingForm.basePrice)
      };

      let result;
      if (existingProfile) {
        result = await updateCoachApplication(applicationData);
      } else {
        result = await createCoachApplication(applicationData);
      }

      if (result.success) {
        toast({
          title: existingProfile ? "Profile Updated" : "Application Submitted",
          description: existingProfile 
            ? "Your coaching profile has been updated successfully."
            : "Your coaching application has been submitted for review.",
        });
        setIsCoachingDialogOpen(false);
      } else {
        toast({
          title: "Error",
          description: result.error || "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting coaching application:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mobile responsive breakpoint detection
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-lg">Loading your studio...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Music className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-slate-900 dark:text-slate-100">
                {user.firstName || 'Creator'}
              </h1>
              <p className="text-xs text-slate-500">Music Studio</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 min-h-screen">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Music className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-slate-900 dark:text-slate-100">
                  {user.firstName || 'Creator'} Studio
                </h1>
                <p className="text-sm text-slate-500">Music Dashboard</p>
              </div>
            </div>

            <nav className="space-y-2">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart },
                { id: 'products', label: 'My Music', icon: Music },
                { id: 'analytics', label: 'Analytics', icon: TrendingUp },
                { id: 'coaching', label: 'Coaching', icon: Headphones },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <motion.div
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                className="w-64 bg-white dark:bg-slate-800 min-h-screen p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <nav className="space-y-2">
                  {[
                    { id: 'overview', label: 'Overview', icon: BarChart },
                    { id: 'products', label: 'My Music', icon: Music },
                    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
                    { id: 'coaching', label: 'Coaching', icon: Headphones },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 p-4 lg:p-8">
          {/* Welcome Header - Hidden on mobile, shown in sidebar */}
          <div className="hidden lg:block mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Welcome back, {user.firstName || user.primaryEmailAddress?.emailAddress?.split('@')[0]}! 🎵
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Ready to create some amazing music content today?
            </p>
          </div>

          {/* Content based on active tab */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Quick Actions - Collapsible on mobile */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 lg:p-6 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        Quick Actions
                      </h2>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowQuickActions(!showQuickActions)}
                        className="lg:hidden"
                      >
                        {showQuickActions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </div>
                    
                    <AnimatePresence>
                      {showQuickActions && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4"
                        >
                          {quickActions.map((action, index) => (
                            <motion.button
                              key={action.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.1 }}
                              onClick={action.action}
                              className="group relative overflow-hidden rounded-xl p-4 text-left transition-all hover:scale-105"
                            >
                              <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-10 group-hover:opacity-20 transition-opacity`}></div>
                              <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center mb-3`}>
                                <action.icon className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                              </div>
                              <h3 className="font-medium text-slate-900 dark:text-slate-100 text-sm lg:text-base mb-1">
                                {action.title}
                              </h3>
                              <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400">
                                {action.description}
                              </p>
                            </motion.button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Stats Overview - Enhanced for music creators */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-slate-200 dark:border-slate-700">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          Total Releases
                        </CardTitle>
                        <Music className="h-4 w-4 text-purple-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                          {dashboardMetrics.totalProducts}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {dashboardMetrics.publishedProducts} live
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-slate-200 dark:border-slate-700">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          Total Downloads
                        </CardTitle>
                        <Download className="h-4 w-4 text-blue-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                          {dashboardMetrics.totalDownloads.toLocaleString()}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          All time
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-slate-200 dark:border-slate-700">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          Revenue
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-green-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                          ${dashboardMetrics.totalRevenue.toFixed(0)}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Lifetime earnings
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-slate-200 dark:border-slate-700">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          Avg Rating
                        </CardTitle>
                        <Star className="h-4 w-4 text-yellow-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                          {dashboardMetrics.averageRating.toFixed(1)}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {dashboardMetrics.totalStudents} reviews
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Content Mix */}
                  <Card className="border-slate-200 dark:border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-slate-900 dark:text-slate-100">Content Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <Music className="w-4 h-4 text-white" />
                          </div>
                          <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                            {dashboardMetrics.samplePackCount}
                          </div>
                          <p className="text-sm text-purple-600 dark:text-purple-400">Sample Packs</p>
                        </div>
                        
                        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <Waves className="w-4 h-4 text-white" />
                          </div>
                          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                            {dashboardMetrics.presetCount}
                          </div>
                          <p className="text-sm text-blue-600 dark:text-blue-400">Presets</p>
                        </div>
                        
                        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <BookOpen className="w-4 h-4 text-white" />
                          </div>
                          <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                            {dashboardMetrics.courseCount}
                          </div>
                          <p className="text-sm text-green-600 dark:text-green-400">Courses</p>
                        </div>
                        
                        <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <Headphones className="w-4 h-4 text-white" />
                          </div>
                          <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                            {dashboardMetrics.coachingCount}
                          </div>
                          <p className="text-sm text-orange-600 dark:text-orange-400">Coaching</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === 'products' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      Your Music Library
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => setIsCreateProductDialogOpen(true)} className="bg-purple-500 hover:bg-purple-600">
                        <Plus className="w-4 h-4 mr-2" />
                        New Release
                      </Button>
                      <Link href={`/store/${storeId || 'setup'}/course/create`}>
                        <Button variant="outline">
                          <BookOpen className="w-4 h-4 mr-2" />
                          Create Course
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {isLoadingProducts ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                          <div className="w-full h-32 bg-slate-200 dark:bg-slate-700 rounded-lg mb-4 animate-pulse"></div>
                          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mb-2 animate-pulse"></div>
                          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3 animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  ) : products.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {products.map((product) => (
                        <Card key={product._id} className="border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
                          <CardContent className="p-6">
                            <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg mb-4 flex items-center justify-center">
                              {product.imageUrl ? (
                                <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover rounded-lg" />
                              ) : (
                                <Music className="w-8 h-8 text-purple-500" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={product.type === 'course' ? 'default' : 'secondary'} className="text-xs">
                                {product.type === 'course' ? '📚 Course' : '🎵 Digital'}
                              </Badge>
                              {product.isPublished ? (
                                <Badge variant="outline" className="text-xs text-green-600 border-green-200">Live</Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">Draft</Badge>
                              )}
                            </div>
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 line-clamp-2">
                              {product.title}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
                              {product.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-purple-600 dark:text-purple-400">
                                ${product.price?.toFixed(2) || '0.00'}
                              </span>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleEditProduct(product)}>
                                  <Settings className="w-3 h-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant={product.isPublished ? "outline" : "default"}
                                  onClick={() => product.isPublished ? handleUnpublishProduct(product) : handlePublishProduct(product)}
                                >
                                  {product.isPublished ? <Eye className="w-3 h-3" /> : <Upload className="w-3 h-3" />}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Music className="w-12 h-12 text-purple-500" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                        Ready to share your music?
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
                        Upload your first sample pack, preset, or course to start building your music empire.
                      </p>
                      <Button onClick={() => setIsCreateProductDialogOpen(true)} className="bg-purple-500 hover:bg-purple-600">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Your First Release
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    Analytics & Insights
                  </h2>
                  <Card className="border-slate-200 dark:border-slate-700">
                    <CardContent className="p-8 text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <BarChart className="w-8 h-8 text-blue-500" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                        Advanced Analytics Coming Soon
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 mb-4">
                        Get detailed insights into your music performance, audience demographics, and revenue trends.
                      </p>
                      <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                        In Development
                      </Badge>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === 'coaching' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      Music Coaching
                    </h2>
                    <Button onClick={handleOpenCoachingDialog} className="bg-orange-500 hover:bg-orange-600">
                      <Plus className="w-4 h-4 mr-2" />
                      {existingProfile ? 'Update Profile' : 'Become a Coach'}
                    </Button>
                  </div>

                  {existingProfile?.isActive ? (
                    <CoachScheduleManager />
                  ) : (
                    <Card className="border-slate-200 dark:border-slate-700">
                      <CardContent className="p-8 text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Headphones className="w-8 h-8 text-orange-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                          Share Your Music Knowledge
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">
                          Help other producers level up their skills with personalized coaching sessions.
                        </p>
                        <Button onClick={handleOpenCoachingDialog} className="bg-orange-500 hover:bg-orange-600">
                          <Headphones className="w-4 h-4 mr-2" />
                          Start Coaching
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Create Product Dialog - Enhanced for music creators */}
      <Dialog open={isCreateProductDialogOpen} onOpenChange={setIsCreateProductDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Release</DialogTitle>
            <DialogDescription>
              Choose what type of music content you want to share with the world.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="type">Content Type</Label>
              <Select
                value={newProductForm.type}
                onValueChange={(value) => setNewProductForm({ ...newProductForm, type: value as ProductType })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select content type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="samplePack">🎵 Sample Pack</SelectItem>
                  <SelectItem value="preset">🎛️ Preset Pack</SelectItem>
                  <SelectItem value="course">📚 Course</SelectItem>
                  <SelectItem value="coaching">🎧 Coaching</SelectItem>
                  <SelectItem value="digitalProduct">📦 Digital Product</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g., Future Bass Sample Pack Vol. 1"
                value={newProductForm.title}
                onChange={(e) => setNewProductForm({ ...newProductForm, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your content and what makes it special..."
                value={newProductForm.description}
                onChange={(e) => setNewProductForm({ ...newProductForm, description: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                placeholder="0 for free"
                value={newProductForm.price}
                onChange={(e) => setNewProductForm({ ...newProductForm, price: e.target.value })}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateProductDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateProduct} className="bg-purple-500 hover:bg-purple-600">
                Create Release
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Coaching Dialog - Keep original functionality */}
      <Dialog open={isCoachingDialogOpen} onOpenChange={setIsCoachingDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {existingProfile ? "Update Your Coaching Profile" : "Become a Music Coach"}
            </DialogTitle>
            <DialogDescription>
              Help other producers and musicians improve their skills with personalized coaching sessions.
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingProfile ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading profile...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="category">Specialty</Label>
                <Select
                  value={coachingForm.category}
                  onValueChange={(value) => setCoachingForm({ ...coachingForm, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your coaching specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Music Production">🎛️ Music Production</SelectItem>
                    <SelectItem value="Mixing & Mastering">🎚️ Mixing & Mastering</SelectItem>
                    <SelectItem value="Beat Making">🥁 Beat Making</SelectItem>
                    <SelectItem value="Songwriting">✍️ Songwriting</SelectItem>
                    <SelectItem value="Sound Design">🔊 Sound Design</SelectItem>
                    <SelectItem value="Music Business">💼 Music Business</SelectItem>
                    <SelectItem value="DJ Skills">🎧 DJ Skills</SelectItem>
                    <SelectItem value="Vocal Coaching">🎤 Vocal Coaching</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="title">Coaching Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Professional Mixing & Mastering Coach"
                  value={coachingForm.title}
                  onChange={(e) => setCoachingForm({ ...coachingForm, title: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="description">About Your Coaching</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your experience, teaching style, and what students can expect..."
                  value={coachingForm.description}
                  onChange={(e) => setCoachingForm({ ...coachingForm, description: e.target.value })}
                  rows={4}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="basePrice">Hourly Rate ($)</Label>
                  <Input
                    id="basePrice"
                    type="number"
                    placeholder="50"
                    value={coachingForm.basePrice}
                    onChange={(e) => setCoachingForm({ ...coachingForm, basePrice: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="Online/City"
                    value={coachingForm.location}
                    onChange={(e) => setCoachingForm({ ...coachingForm, location: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={coachingForm.timezone}
                  onValueChange={(value) => setCoachingForm({ ...coachingForm, timezone: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "UTC-12:00", "UTC-11:00", "UTC-10:00", "UTC-09:00", "UTC-08:00",
                      "UTC-07:00", "UTC-06:00", "UTC-05:00", "UTC-04:00", "UTC-03:00",
                      "UTC-02:00", "UTC-01:00", "UTC+00:00", "UTC+01:00", "UTC+02:00",
                      "UTC+03:00", "UTC+04:00", "UTC+05:00", "UTC+06:00", "UTC+07:00",
                      "UTC+08:00", "UTC+09:00", "UTC+10:00", "UTC+11:00", "UTC+12:00"
                    ].map(tz => (
                      <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="availableDays">Available Days</Label>
                  <Input
                    id="availableDays"
                    placeholder="Mon-Fri"
                    value={coachingForm.availableDays}
                    onChange={(e) => setCoachingForm({ ...coachingForm, availableDays: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="availableHours">Available Hours</Label>
                  <Input
                    id="availableHours"
                    placeholder="9AM-5PM"
                    value={coachingForm.availableHours}
                    onChange={(e) => setCoachingForm({ ...coachingForm, availableHours: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsCoachingDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitCoaching} 
                  disabled={isSubmitting}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {existingProfile ? "Updating..." : "Submitting..."}
                    </>
                  ) : (
                    existingProfile ? "Update Profile" : "Submit Application"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

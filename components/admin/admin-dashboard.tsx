"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { generateSlug } from "@/lib/utils";
import { 
  Users, 
  BookOpen, 
  Star, 
  TrendingUp, 
  Shield,
  Sparkles,
  Loader2,
  Eye,
  Check,
  X,
  Search,
  Settings,
  UserCheck,
  Activity,
  MessageCircle,
  BarChart3,
  Trash2,
  AlertTriangle,
  DollarSign,
  Volume2,
  FileText
} from "lucide-react";
import { 
  updateUserRole, 
  approveCourse, 
  rejectCourse, 
  toggleFeatureCourse,
  approveCoach,
  rejectCoach,
  debugCoachProfiles,
  cleanupOrphanedCoachProfiles,

  searchImages,
  enhancedImageSearch,
  searchCourseImages,
  updateCourseImage,
  deleteCourse,
  searchContent,
  reindexContent,
  scrapeContentFromUrl,
  generateContentEmbeddings
} from "@/app/actions/admin-actions";
import { populateCourseSlugs, clearNonPlayableAudio, testAudioUrl, testElevenLabsApiKey, cleanupLegacyAudioReferences } from "@/app/actions/course-actions";
import type { User } from "@/lib/types";

interface AdminDashboardProps {
  user: User;
  adminStats: any;
  allUsers: any[];
  pendingCourses: any[];
  allCourses: any[];
  recentReviews: any[];
  coachApplications: any[];
}

export default function AdminDashboard({
  user,
  adminStats,
  allUsers,
  pendingCourses,
  allCourses,
  recentReviews,
  coachApplications,
}: AdminDashboardProps) {
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserRole, setSelectedUserRole] = useState("all");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [isCoursePreviewOpen, setIsCoursePreviewOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // AI Course Generation state
  const [aiCourseForm, setAiCourseForm] = useState({
    topic: '',
    skillLevel: '',
    category: '',
    price: '',
    description: '',
    learningObjectives: [''],
    targetModules: 4,
    targetLessonsPerModule: 3,
    additionalContext: ''
  });
  const [isGeneratingCourse, setIsGeneratingCourse] = useState(false);

  // Search functionality state
  const [searchForm, setSearchForm] = useState({
    topic: '',
    skillLevel: 'intermediate'
  });
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [foundImages, setFoundImages] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Content scraping state
  const [contentScrapingForm, setContentScrapingForm] = useState({
    url: '',
    fixErrors: false
  });
  const [scrapedContent, setScrapedContent] = useState<any>(null);
  const [isScrapingContent, setIsScrapingContent] = useState(false);

  // Enhanced Image Search state
  const [imageSearchForm, setImageSearchForm] = useState({
    query: '',
    includeYoutube: true,
    includeProfessional: true,
    maxResults: 12
  });
  const [selectedImageForCourse, setSelectedImageForCourse] = useState<string>('');
  const [courseForImageUpdate, setCourseForImageUpdate] = useState<any>(null);
  const [isImageSearching, setIsImageSearching] = useState(false);

  // Course deletion state
  const [courseToDelete, setCourseToDelete] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletingCourse, setIsDeletingCourse] = useState(false);

  // Populate slugs state
  const [isPopulatingSlugs, setIsPopulatingSlugs] = useState(false);
  const [isClearingAudio, setIsClearingAudio] = useState(false);
  const [isTestingAudio, setIsTestingAudio] = useState(false);
  const [isTestingApiKey, setIsTestingApiKey] = useState(false);
  const [isCleaningLegacyAudio, setIsCleaningLegacyAudio] = useState(false);

  const handleUpdateUserRole = async (userId: string, role: string) => {
    setIsLoading(true);
    const result = await updateUserRole(userId, role);
    setIsLoading(false);
    
    if (result.success) {
      toast({
        title: "User Role Updated",
        description: "User role has been updated successfully.",
      });
      setIsUserDialogOpen(false);
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const handleApproveCourse = async (courseId: string) => {
    const result = await approveCourse(courseId);
    
    if (result.success) {
      toast({
        title: "Course Approved",
        description: "Course has been approved and published.",
      });
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to approve course",
        variant: "destructive",
      });
    }
  };

  const handleApproveCoach = async (profileId: string) => {
    const result = await approveCoach(profileId);
    
    if (result.success) {
      toast({
        title: "Coach Approved",
        description: "Coach has been approved and is now active.",
      });
      // Refresh the page to update the list
      window.location.reload();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to approve coach",
        variant: "destructive",
      });
    }
  };

  const handleRejectCoach = async (profileId: string) => {
    const result = await rejectCoach(profileId);
    
    if (result.success) {
      toast({
        title: "Coach Rejected",
        description: "Coach application has been rejected.",
      });
      // Refresh the page to update the list
      window.location.reload();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to reject coach",
        variant: "destructive",
      });
    }
  };

  const handleDebugCoachProfiles = async () => {
    setIsLoading(true);
    const result = await debugCoachProfiles();
    setIsLoading(false);
    
    if (result.success) {
      console.log("Coach profiles debug results:", result.profiles);
      toast({
        title: "Debug Complete",
        description: `Found ${result.profiles?.length || 0} coach profiles. Check console for details.`,
      });
    } else {
      toast({
        title: "Debug Failed",
        description: result.error || "Failed to debug coach profiles",
        variant: "destructive",
      });
    }
  };

  const handleCleanupOrphanedProfiles = async () => {
    setIsLoading(true);
    const result = await cleanupOrphanedCoachProfiles();
    setIsLoading(false);
    
    if (result.success) {
      toast({
        title: "Cleanup Complete",
        description: result.message || "Cleanup completed successfully",
      });
      // Refresh the page to update the list
      window.location.reload();
    } else {
      toast({
        title: "Cleanup Failed",
        description: result.error || "Failed to cleanup orphaned profiles",
        variant: "destructive",
      });
    }
  };

  const handleRejectCourse = async (courseId: string) => {
    const result = await rejectCourse(courseId);
    
    if (result.success) {
      toast({
        title: "Course Rejected",
        description: "Course has been rejected.",
      });
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to reject course",
        variant: "destructive",
      });
    }
  };

  const handleGenerateAICourse = async () => {
    if (!aiCourseForm.topic || !aiCourseForm.skillLevel || !aiCourseForm.category || !aiCourseForm.price) {
      toast({
        title: "Missing Information",
        description: "Please fill in topic, skill level, category, and price to generate a course.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingCourse(true);
    try {
      const response = await fetch('/api/admin/generate-course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...aiCourseForm,
          learningObjectives: aiCourseForm.learningObjectives.filter(obj => obj.trim() !== '')
        }),
      });

      const result = await response.json();
      
      if (result.success) {
      const coursePath = result.course?.slug ? `/courses/${result.course.slug}` : '/courses';
      toast({
        title: "Course Generated Successfully",
        description: result.course && result.stats 
          ? `Created "${result.course.title}" with ${result.stats.modules} modules, ${result.stats.lessons} lessons, and ${result.stats.chapters} chapters. Visit: ${coursePath}`
          : "Course has been generated successfully.",
      });
      setAiCourseForm({ 
        topic: '', 
        skillLevel: '', 
        category: '', 
        price: '',
        description: '',
        learningObjectives: [''],
        targetModules: 4,
        targetLessonsPerModule: 3,
        additionalContext: ''
      });
      } else {
        toast({
          title: "Failed to Generate Course",
          description: result.error || "An error occurred while generating the course",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Failed to Generate Course",
        description: error.message || "Network error occurred while generating the course",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingCourse(false);
    }
  };

  const handleSearchImages = async () => {
    if (!searchForm.topic.trim()) {
      toast({
        title: "Missing Topic",
        description: "Please enter a topic to search for images.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    const result = await searchImages(searchForm.topic, searchForm.skillLevel);
    setIsSearching(false);

    if (result.success) {
      setFoundImages(result.images || []);
      toast({
        title: "Images Found",
        description: `Found ${result.images?.length || 0} relevant images.`,
      });
    } else {
      toast({
        title: "Search Failed",
        description: result.error || "Failed to search for images",
        variant: "destructive",
      });
    }
  };

  const handleReindexContent = async () => {
    setIsLoading(true);
    const result = await reindexContent();
    setIsLoading(false);

    if (result.success) {
      toast({
        title: "Content Reindexed",
        description: "All content has been reindexed successfully.",
      });
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to reindex content",
        variant: "destructive",
      });
    }
  };

  const handleScrapeContent = async () => {
    if (!contentScrapingForm.url.trim()) {
      toast({
        title: "Missing URL",
        description: "Please enter a URL to scrape content from.",
        variant: "destructive",
      });
      return;
    }

    setIsScrapingContent(true);
    const result = await scrapeContentFromUrl(contentScrapingForm.url, contentScrapingForm.fixErrors);
    setIsScrapingContent(false);

    if (result.success) {
      setScrapedContent(result.content);
      toast({
        title: "Content Scraped Successfully",
        description: `Extracted ${result.metadata?.contentLength} characters from ${result.metadata?.type} content.`,
      });
    } else {
      toast({
        title: "Scraping Failed",
        description: result.error || "Failed to scrape content from URL",
        variant: "destructive",
      });
    }
  };

  const handleEnhancedImageSearch = async () => {
    if (!imageSearchForm.query.trim()) {
      toast({
        title: "Missing Query",
        description: "Please enter a search term to find images.",
        variant: "destructive",
      });
      return;
    }

    setIsImageSearching(true);
    const result = await enhancedImageSearch(imageSearchForm.query, {
      includeYoutube: imageSearchForm.includeYoutube,
      includeProfessional: imageSearchForm.includeProfessional,
      maxResults: imageSearchForm.maxResults
    });
    setIsImageSearching(false);

    if (result.success) {
      setFoundImages(result.images || []);
      toast({
        title: "Images Found",
        description: `Found ${result.totalFound || 0} images for "${result.query}".`,
      });
    } else {
      toast({
        title: "Search Failed",
        description: result.error || "Failed to search for images",
        variant: "destructive",
      });
    }
  };

  const handleSearchCourseImages = async (courseId: string, customTopic?: string) => {
    setIsImageSearching(true);
    const result = await searchCourseImages(courseId, customTopic);
    setIsImageSearching(false);

    if (result.success) {
      setFoundImages(result.images || []);
      setCourseForImageUpdate(result.course);
      toast({
        title: "Course Images Found",
        description: `Found ${result.images?.length || 0} images for "${result.course?.title}".`,
      });
    } else {
      toast({
        title: "Search Failed",
        description: result.error || "Failed to search course images",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCourseImage = async (imageUrl: string) => {
    if (!courseForImageUpdate) {
      toast({
        title: "No Course Selected",
        description: "Please select a course first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const result = await updateCourseImage(courseForImageUpdate.id, imageUrl);
    setIsLoading(false);

    if (result.success) {
      toast({
        title: "Course Image Updated",
        description: `Successfully updated image for "${(result as { success: true; course?: { title?: string } }).course?.title}".`,
      });
      setCourseForImageUpdate(null);
      setFoundImages([]);
      setSelectedImageForCourse('');
    } else {
      toast({
        title: "Update Failed",
        description: result.error || "Failed to update course image",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    setIsDeletingCourse(true);
    const result = await deleteCourse(courseId);
    setIsDeletingCourse(false);

    if (result.success) {
      toast({
        title: "Course Deleted",
        description: "Course has been permanently deleted.",
      });
      setIsDeleteDialogOpen(false);
      setCourseToDelete(null);
      // Refresh the page or refetch data
      window.location.reload();
    } else {
      toast({
        title: "Delete Failed",
        description: result.error || "Failed to delete course",
        variant: "destructive",
      });
    }
  };

  const confirmDeleteCourse = (course: any) => {
    setCourseToDelete(course);
    setIsDeleteDialogOpen(true);
  };

  const handlePopulateSlugs = async () => {
    setIsPopulatingSlugs(true);
    try {
      const result = await populateCourseSlugs();
      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "Course slugs populated successfully!",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to populate course slugs",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to populate course slugs",
        variant: "destructive",
      });
    } finally {
      setIsPopulatingSlugs(false);
    }
  };

  const handleClearNonPlayableAudio = async () => {
    setIsClearingAudio(true);
    try {
      const result = await clearNonPlayableAudio();
      if (result.success) {
        toast({
          title: "Success",
          description: (result as { success: true; message?: string }).message || "Non-playable audio URLs cleared successfully!",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to clear non-playable audio URLs",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear non-playable audio URLs",
        variant: "destructive",
      });
    } finally {
      setIsClearingAudio(false);
    }
  };

  const handleTestAudioUrl = async () => {
    setIsTestingAudio(true);
    try {
      // Test with a sample chapter ID - you can modify this
      const result = await testAudioUrl("sample-chapter-id");
      if (result.success) {
        console.log("Audio URL test result:", result);
        toast({
          title: "Audio Test Complete",
          description: "Check console for detailed audio URL information",
        });
      } else {
        toast({
          title: "Test Failed",
          description: result.error || "Failed to test audio URL",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Test Error",
        description: "Failed to test audio URL",
        variant: "destructive",
      });
    } finally {
      setIsTestingAudio(false);
    }
  };

  const handleTestApiKey = async () => {
    setIsTestingApiKey(true);
    
    try {
      const result = await testElevenLabsApiKey();
      
      if (result.success) {
        toast({
          title: "API Key Test Successful",
          description: result.message,
        });
      } else {
        toast({
          title: "API Key Test Failed",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to test API key",
        variant: "destructive",
      });
    } finally {
      setIsTestingApiKey(false);
    }
  };

  const handleCleanupLegacyAudio = async () => {
    setIsCleaningLegacyAudio(true);
    
    try {
      const result = await cleanupLegacyAudioReferences();
      
      if (result.success) {
        toast({
          title: "Legacy Audio Cleaned",
          description: (result as { success: true; message?: string }).message,
        });
      } else {
        toast({
          title: "Cleanup Failed",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clean up legacy audio",
        variant: "destructive",
      });
    } finally {
      setIsCleaningLegacyAudio(false);
    }
  };

  const filteredUsers = allUsers.filter((user: any) => {
    const matchesSearch = !searchQuery || 
      user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedUserRole === 'all' || user.role === selectedUserRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-screen bg-slate-50 pt-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-slate-200 mt-2 text-sm sm:text-base">Manage users, courses, and platform settings</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <Button 
                variant="secondary" 
                className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:border-slate-500 text-xs sm:text-sm"
                onClick={handlePopulateSlugs}
                disabled={isPopulatingSlugs}
              >
                <BookOpen className="w-4 h-4 mr-1 sm:mr-2" />
                {isPopulatingSlugs ? "Populating..." : "Populate Slugs"}
              </Button>
              <Button 
                variant="secondary" 
                className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:border-slate-500 text-xs sm:text-sm"
                onClick={handleReindexContent}
                disabled={isLoading}
              >
                <Activity className="w-4 h-4 mr-1 sm:mr-2" />
                {isLoading ? "Reindexing..." : "Reindex Content"}
              </Button>
              <Button 
                variant="secondary" 
                className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:border-slate-500 text-xs sm:text-sm"
                onClick={handleClearNonPlayableAudio}
                disabled={isClearingAudio}
              >
                <Volume2 className="w-4 h-4 mr-1 sm:mr-2" />
                {isClearingAudio ? "Clearing..." : "Clear Non-Playable Audio"}
              </Button>
              <Button 
                variant="secondary" 
                className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:border-slate-500 text-xs sm:text-sm"
                onClick={handleTestAudioUrl}
                disabled={isTestingAudio}
              >
                <Volume2 className="w-4 h-4 mr-1 sm:mr-2" />
                {isTestingAudio ? "Testing..." : "Test Audio URL"}
              </Button>
              <Button 
                variant="secondary" 
                className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:border-slate-500 text-xs sm:text-sm"
                onClick={handleTestApiKey}
                disabled={isTestingApiKey}
              >
                <Volume2 className="w-4 h-4 mr-1 sm:mr-2" />
                {isTestingApiKey ? "Testing..." : "Test 11 Labs API Key"}
              </Button>
              <Button 
                variant="secondary" 
                className="bg-red-700 border-red-600 text-white hover:bg-red-600 hover:border-red-500 text-xs sm:text-sm"
                onClick={handleCleanupLegacyAudio}
                disabled={isCleaningLegacyAudio}
              >
                <Trash2 className="w-4 h-4 mr-1 sm:mr-2" />
                {isCleaningLegacyAudio ? "Cleaning..." : "Cleanup Legacy Audio"}
              </Button>
              <Button className="bg-white text-slate-900 hover:bg-slate-100 text-xs sm:text-sm">
                <Settings className="w-4 h-4 mr-1 sm:mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="w-8 h-8 text-primary mx-auto mb-3" />
                <div className="text-2xl font-bold text-dark">{adminStats?.totalUsers || 0}</div>
                <p className="text-slate-600">Total Users</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <BookOpen className="w-8 h-8 text-secondary mx-auto mb-3" />
                <div className="text-2xl font-bold text-dark">{adminStats?.totalCourses || 0}</div>
                <p className="text-slate-600">Total Courses</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <Star className="w-8 h-8 text-accent mx-auto mb-3" />
                <div className="text-2xl font-bold text-dark">{adminStats?.totalReviews || 0}</div>
                <p className="text-slate-600">Total Reviews</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-3" />
                <div className="text-2xl font-bold text-dark">{adminStats?.pendingApprovals || 0}</div>
                <p className="text-slate-600">Pending Approvals</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <Tabs defaultValue="users" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1 h-14 sm:h-12">
            <TabsTrigger value="users" className="text-xs sm:text-sm h-full">
              <Users className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="courses" className="text-xs sm:text-sm h-full">
              <BookOpen className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Courses</span>
            </TabsTrigger>
            <TabsTrigger value="ai-generator" className="text-xs sm:text-sm h-full">
              <Sparkles className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">AI Gen</span>
            </TabsTrigger>
            <TabsTrigger value="search-tools" className="text-xs sm:text-sm h-full">
              <Search className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Search</span>
            </TabsTrigger>
            <TabsTrigger value="content-scraper" className="text-xs sm:text-sm h-full">
              <Activity className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Scraper</span>
            </TabsTrigger>
            <TabsTrigger value="reviews" className="text-xs sm:text-sm h-full">
              <Star className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Reviews</span>
            </TabsTrigger>
            <TabsTrigger value="coaching" className="text-xs sm:text-sm h-full">
              <MessageCircle className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Coaching</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm h-full">
              <BarChart3 className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6 pt-8">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>User Management</CardTitle>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search users..."
                        className="pl-10 w-64"
                      />
                    </div>
                    <Select value={selectedUserRole} onValueChange={setSelectedUserRole}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="All Roles" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="SUBACCOUNT_USER">Student</SelectItem>
                        <SelectItem value="AGENCY_ADMIN">Instructor</SelectItem>
                        <SelectItem value="AGENCY_OWNER">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredUsers.length > 0 ? (
                  <div className="space-y-4">
                    {filteredUsers.map((user: any) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            <AvatarImage src={user.imageUrl} />
                            <AvatarFallback>
                              {user.firstName?.[0]}{user.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium text-dark">
                              {user.firstName} {user.lastName}
                            </h4>
                            <p className="text-sm text-slate-600">{user.email}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant={user.admin ? 'default' : 'secondary'}>
                                {user.admin ? 'Admin' : user.role || 'User'}
                              </Badge>
                              {user.isCoach && (
                                <Badge variant="outline">Coach</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsUserDialogOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Manage
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    No users found
                  </div>
                )}
              </CardContent>
            </Card>

            {/* User Management Dialog */}
            <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Manage User: {selectedUser?.firstName} {selectedUser?.lastName}</DialogTitle>
                </DialogHeader>
                {selectedUser && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={selectedUser.imageUrl} />
                        <AvatarFallback>
                          {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-dark">
                          {selectedUser.firstName} {selectedUser.lastName}
                        </h3>
                        <p className="text-sm text-slate-600">{selectedUser.email}</p>
                        <p className="text-xs text-slate-500">
                          Joined {new Date(selectedUser.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Role</label>
                      <Select 
                        defaultValue={selectedUser.role} 
                        onValueChange={(role) => {
                          handleUpdateUserRole(selectedUser.id, role);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SUBACCOUNT_USER">Student</SelectItem>
                          <SelectItem value="AGENCY_ADMIN">Instructor</SelectItem>
                          <SelectItem value="AGENCY_OWNER">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-6 pt-8">
            <Card>
              <CardHeader>
                <CardTitle>Course Management</CardTitle>
                <p className="text-slate-600">
                  Manage all courses - published and draft. {allCourses?.length || 0} total courses.
                </p>
              </CardHeader>
              <CardContent>
                {allCourses && allCourses.length > 0 ? (
                  <div className="space-y-4">
                    {allCourses.map((course: any) => (
                      <div key={course.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
                        <Link 
                          href={`/courses/${course.slug || generateSlug(course.title)}`}
                          className="flex items-start space-x-3 flex-1 cursor-pointer group"
                        >
                          <img
                            src={course.imageUrl || "https://images.unsplash.com/photo-1571330735066-03aaa9429d89"}
                            alt={course.title}
                            className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg flex-shrink-0 group-hover:opacity-90 transition-opacity"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-dark text-sm sm:text-base line-clamp-1 group-hover:text-primary transition-colors">{course.title}</h4>
                              <Badge 
                                variant={course.isPublished ? "default" : "secondary"}
                                className={course.isPublished ? "bg-green-500" : "bg-yellow-500"}
                              >
                                {course.isPublished ? "Published" : "Draft"}
                              </Badge>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 mt-1">{course.description}</p>
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-2">
                              <span className="text-xs sm:text-sm text-slate-500">${course.price?.toFixed(0) || '0'}</span>
                              <span className="text-xs text-slate-400">•</span>
                              <span className="text-xs text-slate-500">{course._count?.enrollments || 0} students</span>
                              <span className="text-xs text-slate-400">•</span>
                              <span className="text-xs text-slate-500">{new Date(course.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              by {course.instructor?.firstName} {course.instructor?.lastName}
                            </p>
                          </div>
                        </Link>
                        
                        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full sm:w-auto text-xs"
                            onClick={() => toggleFeatureCourse(course.id, !course.isPublished)}
                          >
                            <Star className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 ${course.isPublished ? 'text-yellow-400 fill-current' : ''}`} />
                            {course.isPublished ? 'Unpublish' : 'Publish'}
                          </Button>
                          <div className="flex gap-2">
                            {!course.isPublished && (
                              <Button
                                size="sm"
                                className="flex-1 sm:flex-none text-xs"
                                onClick={() => handleApproveCourse(course.id)}
                              >
                                <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                <span className="hidden sm:inline">Approve</span>
                                <span className="sm:hidden">✓</span>
                              </Button>
                            )}
                            {!course.isPublished && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 sm:flex-none text-xs"
                                onClick={() => handleRejectCourse(course.id)}
                              >
                                <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                <span className="hidden sm:inline">Reject</span>
                                <span className="sm:hidden">✗</span>
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              className="flex-1 sm:flex-none text-xs"
                              onClick={() => confirmDeleteCourse(course)}
                            >
                              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              <span className="hidden sm:inline">Delete</span>
                              <span className="sm:hidden">🗑️</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    No courses found
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Course Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-red-600">
                    <Trash2 className="w-5 h-5" />
                    Delete Course
                  </DialogTitle>
                  <DialogDescription className="text-slate-600">
                    This action cannot be undone. This will permanently delete the course and all its content.
                  </DialogDescription>
                </DialogHeader>
                
                {courseToDelete && (
                  <div className="my-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <img
                        src={courseToDelete.imageUrl || "https://images.unsplash.com/photo-1571330735066-03aaa9429d89"}
                        alt={courseToDelete.title}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-red-900">{courseToDelete.title}</h4>
                        <p className="text-sm text-red-700 mt-1">
                          {courseToDelete._count?.enrollments || 0} students enrolled
                        </p>
                        <p className="text-sm text-red-700">
                          Created by {courseToDelete.instructor?.firstName} {courseToDelete.instructor?.lastName}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium mb-1">Warning: This will delete:</p>
                      <ul className="space-y-1 text-sm">
                        <li>• The course and all its chapters</li>
                        <li>• All student enrollments and progress</li>
                        <li>• Course reviews and ratings</li>
                        <li>• All associated data (cannot be recovered)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDeleteDialogOpen(false);
                      setCourseToDelete(null);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteCourse(courseToDelete.id)}
                    disabled={isDeletingCourse}
                    className="flex-1"
                  >
                    {isDeletingCourse ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Permanently
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* AI Course Generator Tab */}
          <TabsContent value="ai-generator" className="space-y-6 pt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  AI Course Generator
                </CardTitle>
                <p className="text-slate-600">
                  Generate comprehensive music production courses using AI research and content creation.
                  The system will search current information and create structured lessons with modules, chapters, and educational content.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="topic">Course Topic</Label>
                      <Input
                        id="topic"
                        placeholder="e.g., Advanced Vocal Processing, Trap Production, Sound Design"
                        value={aiCourseForm.topic}
                        onChange={(e) => setAiCourseForm(prev => ({ ...prev, topic: e.target.value }))}
                        className="mt-1"
                      />
                      <p className="text-sm text-slate-500 mt-1">
                        Be specific about the music production topic you want to create a course for
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="skill-level">Skill Level</Label>
                      <Select
                        value={aiCourseForm.skillLevel}
                        onValueChange={(value) => setAiCourseForm(prev => ({ ...prev, skillLevel: value }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select skill level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={aiCourseForm.category}
                        onValueChange={(value) => setAiCourseForm(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Hip-Hop Production">Hip-Hop Production</SelectItem>
                          <SelectItem value="Electronic Music">Electronic Music</SelectItem>
                          <SelectItem value="Mixing & Mastering">Mixing & Mastering</SelectItem>
                          <SelectItem value="Sound Design">Sound Design</SelectItem>
                          <SelectItem value="Music Theory">Music Theory</SelectItem>
                          <SelectItem value="Pop Production">Pop Production</SelectItem>
                          <SelectItem value="Rock Production">Rock Production</SelectItem>
                          <SelectItem value="DAWs">DAWs</SelectItem>
                          <SelectItem value="Trap Production">Trap Production</SelectItem>
                          <SelectItem value="House Music">House Music</SelectItem>
                          <SelectItem value="Techno Production">Techno Production</SelectItem>
                          <SelectItem value="Vocal Production">Vocal Production</SelectItem>
                          <SelectItem value="Jazz Production">Jazz Production</SelectItem>
                          <SelectItem value="R&B Production">R&B Production</SelectItem>
                          <SelectItem value="Ambient Music">Ambient Music</SelectItem>
                          <SelectItem value="Drum Programming">Drum Programming</SelectItem>
                          <SelectItem value="Synthesis">Synthesis</SelectItem>
                          <SelectItem value="Sampling">Sampling</SelectItem>
                          <SelectItem value="Audio Engineering">Audio Engineering</SelectItem>
                          <SelectItem value="Live Performance">Live Performance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="price">Course Price ($)</Label>
                      <Input
                        id="price"
                        type="number"
                        placeholder="49.99"
                        value={aiCourseForm.price}
                        onChange={(e) => setAiCourseForm(prev => ({ ...prev, price: e.target.value }))}
                        className="mt-1"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  {/* Custom Course Structure */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-slate-900">Course Structure & Content</h3>
                    
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-sm text-slate-700">
                        <strong>Flexible Structure:</strong> AI will determine the optimal number of modules and lessons based on your topic, skill level, and learning objectives. Each course is uniquely structured for maximum learning effectiveness.
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="description">Custom Course Description (Optional)</Label>
                      <Textarea
                        id="description"
                        placeholder="Provide a specific description of what this course should cover..."
                        value={aiCourseForm.description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAiCourseForm(prev => ({ ...prev, description: e.target.value }))}
                        className="mt-1"
                        rows={3}
                      />
                      <p className="text-xs text-slate-500 mt-1">AI will use this to shape the course content and focus</p>
                    </div>

                    <div>
                      <Label>Learning Objectives</Label>
                      <div className="space-y-2 mt-1">
                        {aiCourseForm.learningObjectives.map((objective, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              placeholder={`Learning objective ${index + 1}...`}
                              value={objective}
                              onChange={(e) => {
                                const newObjectives = [...aiCourseForm.learningObjectives];
                                newObjectives[index] = e.target.value;
                                setAiCourseForm(prev => ({ ...prev, learningObjectives: newObjectives }));
                              }}
                            />
                            {index > 0 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newObjectives = aiCourseForm.learningObjectives.filter((_, i) => i !== index);
                                  setAiCourseForm(prev => ({ ...prev, learningObjectives: newObjectives }));
                                }}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAiCourseForm(prev => ({ 
                              ...prev, 
                              learningObjectives: [...prev.learningObjectives, ''] 
                            }));
                          }}
                          className="text-xs"
                        >
                          + Add Learning Objective
                        </Button>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Specific skills or knowledge students should gain</p>
                    </div>

                    <div>
                      <Label htmlFor="additional-context">Additional Context & Requirements</Label>
                      <Textarea
                        id="additional-context"
                        placeholder="Any specific techniques, tools, software, or approaches you want covered..."
                        value={aiCourseForm.additionalContext}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAiCourseForm(prev => ({ ...prev, additionalContext: e.target.value }))}
                        className="mt-1"
                        rows={3}
                      />
                      <p className="text-xs text-slate-500 mt-1">Include specific DAWs, plugins, techniques, or industry practices to focus on</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="font-medium text-dark mb-3">Flexible AI Course Generation:</h3>
                    <div className="space-y-3 text-sm text-slate-600">
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center mt-0.5 font-medium">1</div>
                        <div>
                          <strong>Research:</strong> AI searches current information incorporating your additional context and requirements
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center mt-0.5 font-medium">2</div>
                        <div>
                          <strong>Custom Structure:</strong> Creates course with your specified number of modules and lessons per module
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center mt-0.5 font-medium">3</div>
                        <div>
                          <strong>Targeted Content:</strong> Generates content focused on your learning objectives and custom description
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center mt-0.5 font-medium">4</div>
                        <div>
                          <strong>Review:</strong> Course created as draft incorporating all your specifications for review before publishing
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-slate-600">
                    Generation typically takes 30-60 seconds and creates a comprehensive course ready for review.
                  </div>
                  <Button
                    onClick={handleGenerateAICourse}
                    disabled={isGeneratingCourse}
                    className="min-w-[140px]"
                  >
                    {isGeneratingCourse ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Course
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enhanced Search Tools Tab */}
          <TabsContent value="search-tools" className="space-y-6 pt-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Image Search */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Basic Image Search
                  </CardTitle>
                  <p className="text-slate-600 text-sm">
                    Quick image search for course topics using Tavily API
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="search-topic">Search Topic</Label>
                    <Input
                      id="search-topic"
                      placeholder="e.g., FL Studio mixing techniques"
                      value={searchForm.topic}
                      onChange={(e) => setSearchForm(prev => ({ ...prev, topic: e.target.value }))}
                      className="mt-1"
                    />
                  </div>

                  <Button 
                    onClick={handleSearchImages}
                    disabled={isSearching || !searchForm.topic.trim()}
                    className="w-full"
                  >
                    {isSearching ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4 mr-2" />
                    )}
                    Find Images
                  </Button>
                </CardContent>
              </Card>

              {/* Enhanced Image Search */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Enhanced Image Search
                  </CardTitle>
                  <p className="text-slate-600 text-sm">
                    Advanced multi-strategy image search with customizable options
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="enhanced-search-query">Search Query</Label>
                    <Input
                      id="enhanced-search-query"
                      placeholder="e.g., Ableton Live arpeggiator tutorial"
                      value={imageSearchForm.query}
                      onChange={(e) => setImageSearchForm(prev => ({ ...prev, query: e.target.value }))}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="include-youtube"
                        checked={imageSearchForm.includeYoutube}
                        onChange={(e) => setImageSearchForm(prev => ({ ...prev, includeYoutube: e.target.checked }))}
                        className="rounded"
                      />
                      <Label htmlFor="include-youtube" className="text-sm">Include YouTube</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="include-professional"
                        checked={imageSearchForm.includeProfessional}
                        onChange={(e) => setImageSearchForm(prev => ({ ...prev, includeProfessional: e.target.checked }))}
                        className="rounded"
                      />
                      <Label htmlFor="include-professional" className="text-sm">Professional Content</Label>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="max-results">Max Results: {imageSearchForm.maxResults}</Label>
                    <input
                      type="range"
                      id="max-results"
                      min="6"
                      max="24"
                      step="6"
                      value={imageSearchForm.maxResults}
                      onChange={(e) => setImageSearchForm(prev => ({ ...prev, maxResults: parseInt(e.target.value) }))}
                      className="w-full mt-1"
                    />
                  </div>

                  <Button 
                    onClick={handleEnhancedImageSearch}
                    disabled={isImageSearching || !imageSearchForm.query.trim()}
                    className="w-full"
                  >
                    {isImageSearching ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Enhanced Search
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Course Image Management */}
            {allCourses && allCourses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary" />
                    Course Image Management
                  </CardTitle>
                  <p className="text-slate-600">
                    Search and update images for existing courses
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allCourses.slice(0, 6).map((course: any) => (
                      <div key={course.id} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <img
                            src={course.imageUrl || "https://images.unsplash.com/photo-1571330735066-03aaa9429d89"}
                            alt={course.title}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{course.title}</h4>
                            <p className="text-xs text-slate-500">
                              {course.isPublished ? 'Published' : 'Draft'}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSearchCourseImages(course.id)}
                          disabled={isImageSearching}
                          className="w-full text-xs"
                        >
                          <Search className="w-3 h-3 mr-1" />
                          Find Images
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Found Images Display */}
            {foundImages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Found Images ({foundImages.length})</span>
                    {courseForImageUpdate && (
                      <Badge variant="outline" className="text-xs">
                        For: {courseForImageUpdate.title}
                      </Badge>
                    )}
                  </CardTitle>
                  {courseForImageUpdate && (
                    <p className="text-slate-600 text-sm">
                      Click on an image to set it as the course thumbnail
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {foundImages.map((imageUrl, index) => (
                      <div 
                        key={index} 
                        className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImageForCourse === imageUrl 
                            ? 'border-primary ring-2 ring-primary/20' 
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                        onClick={() => {
                          if (courseForImageUpdate) {
                            setSelectedImageForCourse(imageUrl);
                            handleUpdateCourseImage(imageUrl);
                          }
                        }}
                      >
                        <img
                          src={imageUrl}
                          alt={`Found image ${index + 1}`}
                          className="w-full h-32 object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="text-white text-center">
                            <Eye className="w-5 h-5 mx-auto mb-1" />
                            <span className="text-xs">
                              {courseForImageUpdate ? 'Set as Course Image' : 'Preview'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 flex justify-between items-center">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFoundImages([]);
                        setCourseForImageUpdate(null);
                        setSelectedImageForCourse('');
                      }}
                    >
                      Clear Results
                    </Button>
                    {courseForImageUpdate && (
                      <p className="text-sm text-slate-600">
                        💡 Tip: Click any image to instantly set it as the course thumbnail
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Content Scraper Tab */}
          <TabsContent value="content-scraper" className="space-y-6 pt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Content Scraper
                </CardTitle>
                <p className="text-slate-600">
                  Extract content from YouTube videos and articles for course research and development.
                  Supports transcript extraction, content cleaning, and text chunking for AI processing.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="scraper-url">Content URL</Label>
                      <Input
                        id="scraper-url"
                        placeholder="https://www.youtube.com/watch?v=... or article URL"
                        value={contentScrapingForm.url}
                        onChange={(e) => setContentScrapingForm(prev => ({ ...prev, url: e.target.value }))}
                        className="mt-1"
                      />
                      <p className="text-sm text-slate-500 mt-1">
                        Enter a YouTube video URL or article URL to extract content
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="fix-errors"
                        checked={contentScrapingForm.fixErrors}
                        onChange={(e) => setContentScrapingForm(prev => ({ ...prev, fixErrors: e.target.checked }))}
                        className="rounded"
                      />
                      <Label htmlFor="fix-errors" className="text-sm">
                        Fix transcription errors (YouTube only)
                      </Label>
                    </div>

                    <Button 
                      onClick={handleScrapeContent}
                      disabled={isScrapingContent || !contentScrapingForm.url.trim()}
                      className="w-full"
                    >
                      {isScrapingContent ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Activity className="w-4 h-4 mr-2" />
                      )}
                      Scrape Content
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium text-slate-900">Supported Content Types</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-red-100 text-red-600 text-xs flex items-center justify-center mt-0.5 font-medium">YT</div>
                        <div>
                          <strong>YouTube Videos:</strong> Extracts video transcripts, handles multiple languages, fixes transcription errors with AI
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center mt-0.5 font-medium">WEB</div>
                        <div>
                          <strong>Articles & Blogs:</strong> Extracts main content, removes navigation/ads, improves readability with AI
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 text-xs flex items-center justify-center mt-0.5 font-medium">AI</div>
                        <div>
                          <strong>AI Processing:</strong> Automatic text chunking, embedding generation, content optimization
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scraped Content Display */}
                {scrapedContent && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">
                      Scraped Content: {scrapedContent.title}
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                      <div className="bg-slate-50 p-3 rounded-lg">
                        <div className="text-sm text-slate-600">Content Type</div>
                        <div className="font-medium capitalize">{scrapedContent.type}</div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg">
                        <div className="text-sm text-slate-600">Content Length</div>
                        <div className="font-medium">{scrapedContent.content?.length || 0} characters</div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg">
                        <div className="text-sm text-slate-600">Text Chunks</div>
                        <div className="font-medium">{scrapedContent.chunks?.length || 0} chunks</div>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                      <div className="text-sm text-slate-600 mb-2">Content Preview:</div>
                      <div className="text-sm whitespace-pre-wrap">
                        {scrapedContent.content?.substring(0, 2000)}
                        {scrapedContent.content?.length > 2000 && "..."}
                      </div>
                    </div>
                    {scrapedContent.metadata && (
                      <div className="mt-4 text-xs text-slate-500">
                        <div><strong>Author:</strong> {scrapedContent.metadata.author || 'Unknown'}</div>
                        {scrapedContent.metadata.publishDate && (
                          <div><strong>Published:</strong> {scrapedContent.metadata.publishDate}</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other tabs with minimal content */}
          <TabsContent value="reviews" className="space-y-6 pt-8">
            <Card>
              <CardHeader>
                <CardTitle>Recent Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-slate-500">
                  No recent reviews
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="coaching" className="space-y-6 pt-8">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Coach Applications</CardTitle>
                    <p className="text-slate-600">
                      Review and approve coach applications. {coachApplications?.length || 0} pending applications.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDebugCoachProfiles}
                      disabled={isLoading}
                      className="text-xs"
                    >
                      {isLoading ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <Search className="w-3 h-3 mr-1" />
                      )}
                      Debug
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCleanupOrphanedProfiles}
                      disabled={isLoading}
                      className="text-xs border-orange-200 text-orange-600 hover:bg-orange-50"
                    >
                      {isLoading ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <Activity className="w-3 h-3 mr-1" />
                      )}
                      Cleanup
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {coachApplications && coachApplications.length > 0 ? (
                  <div className="space-y-4">
                    {coachApplications.map((application: any) => (
                      <div key={application.id} className="p-6 border border-slate-200 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4 flex-1">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={application.imageUrl} />
                              <AvatarFallback>
                                {application.firstName?.[0]}{application.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-dark">
                                  {application.firstName} {application.lastName}
                                </h4>
                                <Badge variant="outline" className="text-xs">
                                  {application.category}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-600 mb-2">{application.email}</p>
                              <h5 className="font-medium text-sm text-dark mb-1">{application.title}</h5>
                              <p className="text-sm text-slate-600 line-clamp-2 mb-3">{application.description}</p>
                              <div className="flex items-center gap-4 text-xs text-slate-500">
                                <span>${application.basePrice}/hour</span>
                                {application.location && (
                                  <>
                                    <span>•</span>
                                    <span>{application.location}</span>
                                  </>
                                )}
                                <span>•</span>
                                <span>Applied {new Date(application.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              onClick={() => handleApproveCoach(application.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <UserCheck className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRejectCoach(application.id)}
                              className="border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <h3 className="font-medium text-slate-700 mb-1">No pending applications</h3>
                    <p className="text-sm">All coach applications have been reviewed.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6 pt-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">New Users (This Month)</span>
                      <span className="font-semibold text-dark">{adminStats?.newUsersThisMonth || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">New Courses (This Month)</span>
                      <span className="font-semibold text-dark">{adminStats?.newCoursesThisMonth || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-slate-600">Database Status</span>
                      </div>
                      <Badge variant="secondary">Healthy</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-slate-600">API Status</span>
                      </div>
                      <Badge variant="secondary">Operational</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>AI & Embeddings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-slate-600 mb-4">
                      Manage vector embeddings for semantic search and AI-powered features.
                    </p>
                    <Link href="/admin/embeddings">
                      <Button className="w-full">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Manage Course Embeddings
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 
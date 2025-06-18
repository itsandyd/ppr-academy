"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { 
  BookOpen, 
  Users, 
  TrendingUp, 
  Plus,
  Eye,
  Edit,
  DollarSign,
  BarChart,
  Video,
  Clock,
  Star,
  Loader2,
  MessageSquare,
  BarChart3,
  Calendar
} from "lucide-react";
import CourseCard from "@/components/course-card";
import { createCoachApplication, getUserCoachProfile, updateCoachApplication } from "@/app/actions/coaching-actions";
import type { User, CourseWithDetails } from "@/lib/types";
import { generateSlug } from "@/lib/utils";
import CoachScheduleManager from "@/components/coach-schedule-manager";

interface CreatorDashboardProps {
  user: User;
  userCourses: CourseWithDetails[];
  coachingSessions: any[];
  dashboardStats: {
    enrolledCourses: number;
    completedCourses: number;
    createdCourses: number;
    totalStudents: number;
  };
}

export function CreatorDashboard({ 
  user, 
  userCourses, 
  coachingSessions,
  dashboardStats 
}: CreatorDashboardProps) {
  const { toast } = useToast();
  const [isCoachingDialogOpen, setIsCoachingDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [existingProfile, setExistingProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("courses");
  
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

  // Load coach profile on component mount
  useEffect(() => {
    const loadInitialProfile = async () => {
      try {
        const result = await getUserCoachProfile();
        if (result.success && result.profile) {
          setExistingProfile(result.profile);
        }
      } catch (error) {
        console.error("Error loading initial coach profile:", error);
      }
    };

    loadInitialProfile();
  }, []);

  const totalRevenue = userCourses.reduce((sum, course) => {
    const revenue = (course.price || 0) * (course._count?.enrollments || 0);
    return sum + revenue;
  }, 0);

  const categories = [
    "Hip-Hop Production",
    "Electronic Music", 
    "Mixing & Mastering",
    "Sound Design",
    "Music Theory",
    "Pop Production",
    "Rock Production",
    "DAWs",
    "Trap Production",
    "House Music",
    "Techno Production",
    "Vocal Production",
  ];

  const timezones = [
    "UTC-12:00", "UTC-11:00", "UTC-10:00", "UTC-09:00", "UTC-08:00",
    "UTC-07:00", "UTC-06:00", "UTC-05:00", "UTC-04:00", "UTC-03:00",
    "UTC-02:00", "UTC-01:00", "UTC+00:00", "UTC+01:00", "UTC+02:00",
    "UTC+03:00", "UTC+04:00", "UTC+05:00", "UTC+06:00", "UTC+07:00",
    "UTC+08:00", "UTC+09:00", "UTC+10:00", "UTC+11:00", "UTC+12:00"
  ];

  const handleInputChange = (field: string, value: string) => {
    setCoachingForm(prev => ({ ...prev, [field]: value }));
  };

  const handleOpenCoachingDialog = async () => {
    setIsLoadingProfile(true);
    setIsCoachingDialogOpen(true);
    
    try {
      const result = await getUserCoachProfile();
      
      if (result.success && result.profile) {
        setExistingProfile(result.profile);
        // Pre-fill form with existing data
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
        // Reset form for new application
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
        // Update existing profile
        result = await updateCoachApplication(applicationData);
      } else {
        // Create new profile
        result = await createCoachApplication(applicationData);
      }

      if (result.success) {
        toast({
          title: existingProfile ? "Profile Updated!" : "Application Submitted!",
          description: existingProfile 
            ? "Your coaching profile has been updated."
            : "We'll review your application and get back to you soon.",
        });
        setIsCoachingDialogOpen(false);
      } else {
        toast({
          title: existingProfile ? "Update Failed" : "Application Failed",
          description: result.error || "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: existingProfile ? "Update Failed" : "Application Failed", 
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark mb-2">
          Welcome back, {user.firstName || user.email}!
        </h1>
        <p className="text-slate-600">
          Manage your courses and track your impact
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Created Courses
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.createdCourses}</div>
            <p className="text-xs text-muted-foreground">
              Active courses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Enrolled learners
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Lifetime earnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Engagement Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">
              Student activity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList>
          <TabsTrigger value="courses">My Courses</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="coaching">Coaching</TabsTrigger>
          {existingProfile?.isActive && (
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="courses" className="space-y-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Your Courses</h2>
            <Link href="/create-course">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create New Course
              </Button>
            </Link>
          </div>

          {userCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userCourses.map((course) => (
                <Card key={course.id} className="overflow-hidden">
                  <div className="relative h-48 bg-slate-200">
                    {course.imageUrl ? (
                      <img
                        src={course.imageUrl}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
                        <span className="text-white text-4xl font-bold">
                          {course.title.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="absolute top-4 right-4 flex gap-2">
                      {course.isPublished ? (
                        <span className="bg-green-500 text-white px-2 py-1 rounded text-xs">
                          Published
                        </span>
                      ) : (
                        <span className="bg-yellow-500 text-white px-2 py-1 rounded text-xs">
                          Draft
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-dark mb-2 line-clamp-2">
                      {course.title}
                    </h3>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm text-slate-600">
                        <span>Students</span>
                        <span className="font-semibold">{course._count?.enrollments || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-slate-600">
                        <span>Revenue</span>
                        <span className="font-semibold">
                          ${((course.price || 0) * (course._count?.enrollments || 0)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Link href={`/courses/${course.slug || generateSlug(course.title)}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      <Link href={`/courses/${course.slug || generateSlug(course.title)}`} className="flex-1">
                        <Button size="sm" className="w-full">
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No courses yet</h3>
                <p className="text-slate-600 mb-6">
                  Create your first course and start teaching
                </p>
                <Link href="/create-course">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Course
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-8">
          <Card>
            <CardContent className="p-12 text-center">
              <BarChart className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Analytics Coming Soon</h3>
              <p className="text-slate-600">
                Detailed insights about your courses and students will be available here
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coaching" className="space-y-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Coaching Sessions</h2>
            <Button onClick={handleOpenCoachingDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Set Up Coaching
            </Button>
          </div>

          {existingProfile?.isActive ? (
            <div className="space-y-6">
              {/* Active Coach Status */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-dark mb-1">✅ Active Coach</h3>
                      <p className="text-sm text-slate-600">
                        Your coaching profile is live! Students can now book sessions with you.
                      </p>
                    </div>
                    <Button variant="outline" onClick={handleOpenCoachingDialog}>
                      Edit Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-primary">0</div>
                    <p className="text-sm text-slate-600">Total Sessions</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">${existingProfile.basePrice}</div>
                    <p className="text-sm text-slate-600">Hourly Rate</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">4.5</div>
                    <p className="text-sm text-slate-600">Average Rating</p>
                  </CardContent>
                </Card>
              </div>

              {/* Call to Action for Schedule */}
              <Card>
                <CardContent className="p-6 text-center">
                  <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Ready to Accept Bookings?</h3>
                  <p className="text-slate-600 mb-4">
                    Set your availability so students can book sessions with you.
                  </p>
                  <Button onClick={() => setActiveTab("schedule")}>
                    <Calendar className="w-4 h-4 mr-2" />
                    Manage Schedule
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No coaching sessions yet</h3>
                <p className="text-slate-600 mb-6">
                  Offer 1-on-1 coaching to help students directly
                </p>
                <Button variant="outline" onClick={handleOpenCoachingDialog}>
                  <Video className="w-4 h-4 mr-2" />
                  Set Up Coaching Profile
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Schedule Tab - Only for Active Coaches */}
        {existingProfile?.isActive && (
          <TabsContent value="schedule" className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-dark mb-2">Manage Your Schedule</h2>
              <p className="text-slate-600">
                Set your availability for different days. Students will only be able to book sessions during your available hours.
              </p>
            </div>
            
            <CoachScheduleManager />
          </TabsContent>
        )}
      </Tabs>

      {/* Coaching Setup Dialog */}
      <Dialog open={isCoachingDialogOpen} onOpenChange={setIsCoachingDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="w-5 h-5 text-primary" />
              {existingProfile ? "Update Your Coaching Profile" : "Set Up Your Coaching Profile"}
            </DialogTitle>
            <DialogDescription>
              {existingProfile 
                ? "Update your coaching profile information and availability."
                : "Create your coaching profile to start offering 1-on-1 sessions to students."
              }
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingProfile ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Loading your profile...</span>
            </div>
          ) : (
            <>
              {/* Status Banner */}
              {existingProfile && (
                <div className={`p-4 rounded-lg border ${
                  existingProfile.isActive 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-start space-x-2">
                    {existingProfile.isActive ? (
                      <span className="w-2 h-2 bg-green-500 rounded-full mt-2"></span>
                    ) : (
                      <Clock className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    )}
                    <div className={`text-sm ${
                      existingProfile.isActive ? 'text-green-800' : 'text-yellow-800'
                    }`}>
                      <p className="font-medium mb-1">
                        {existingProfile.isActive ? 'Profile Active' : 'Pending Review'}
                      </p>
                      <p className="text-sm">
                        {existingProfile.isActive 
                          ? 'Your coaching profile is live and students can book sessions with you.'
                          : 'Your application is being reviewed by our team. You can update your information anytime.'
                        }
                      </p>
                      <p className="text-xs mt-1 opacity-75">
                        Applied on {new Date(existingProfile.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="specialty">Specialty *</Label>
                <Select value={coachingForm.category} onValueChange={(value) => handleInputChange("category", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="basePrice">Hourly Rate (USD) *</Label>
                <Input
                  id="basePrice"
                  type="number"
                  min="1"
                  placeholder="50"
                  value={coachingForm.basePrice}
                  onChange={(e) => handleInputChange("basePrice", e.target.value)}
                />
                <p className="text-xs text-slate-500 mt-1">Recommended: $25-150/hour</p>
              </div>
            </div>

            <div>
              <Label htmlFor="title">Professional Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Professional Music Producer & Mix Engineer"
                value={coachingForm.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="description">About You & Your Teaching Style *</Label>
              <Textarea
                id="description"
                placeholder="Tell students about your experience and how you approach coaching..."
                rows={4}
                value={coachingForm.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., Los Angeles, CA or Remote"
                  value={coachingForm.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={coachingForm.timezone} onValueChange={(value) => handleInputChange("timezone", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="availableDays">Available Days</Label>
                <Input
                  id="availableDays"
                  placeholder="e.g., Monday-Friday"
                  value={coachingForm.availableDays}
                  onChange={(e) => handleInputChange("availableDays", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="availableHours">Available Hours</Label>
                <Input
                  id="availableHours"
                  placeholder="e.g., 9 AM - 6 PM EST"
                  value={coachingForm.availableHours}
                  onChange={(e) => handleInputChange("availableHours", e.target.value)}
                />
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-2">
                <Star className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">What happens next?</p>
                  <ul className="space-y-1 text-sm">
                    <li>• Your application will be reviewed by our team</li>
                    <li>• We'll verify your experience and credentials</li>
                    <li>• Once approved, you'll appear in our coaches directory</li>
                    <li>• Students can book sessions directly with you</li>
                  </ul>
                </div>
              </div>
              </div>
            </div>
            
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setIsCoachingDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitCoaching}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {existingProfile ? "Updating..." : "Submitting..."}
                  </>
                ) : (
                  <>
                    <Video className="w-4 h-4 mr-2" />
                    {existingProfile ? "Update Profile" : "Submit Application"}
                  </>
                )}
              </Button>
            </div>
          </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 
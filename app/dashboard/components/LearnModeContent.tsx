'use client';

import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { CourseCardEnhanced } from '@/components/ui/course-card-enhanced';
import { CertificateCard } from '@/components/certificates/CertificateCard';
import { NoCoursesEmptyState } from '@/components/ui/empty-state-enhanced';
import { HeroFlourishes } from '@/components/ui/hero-flourishes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Award, 
  Clock, 
  TrendingUp,
  Download,
  Music,
  Package,
  Loader2,
  Play,
  Star,
  Target,
  Calendar
} from 'lucide-react';
import { useEffect } from 'react';

export function LearnModeContent() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const createUser = useMutation(api.users.createOrUpdateUserFromClerk);
  
  // Get Convex user
  const convexUser = useQuery(
    api.users.getUserFromClerk,
    user?.id ? { clerkId: user.id } : 'skip'
  );

  // Auto-create user if needed
  useEffect(() => {
    if (isUserLoaded && user && convexUser === null) {
      createUser({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress || null,
        firstName: user.firstName || null,
        lastName: user.lastName || null,
        imageUrl: user.imageUrl || null,
      }).catch((error) => {
        console.error('Failed to auto-create user:', error);
      });
    }
  }, [isUserLoaded, user, convexUser, createUser]);

  // Fetch enrolled courses
  const enrolledCourses = useQuery(
    api.userLibrary.getUserEnrolledCourses,
    convexUser?.clerkId ? { userId: convexUser.clerkId } : 'skip'
  );

  // Fetch library stats
  const userStats = useQuery(
    api.userLibrary.getUserLibraryStats,
    convexUser?.clerkId ? { userId: convexUser.clerkId } : 'skip'
  );

  // Fetch recent activity
  const recentActivity = useQuery(
    api.userLibrary.getUserRecentActivity,
    convexUser?.clerkId ? { userId: convexUser.clerkId, limit: 5 } : 'skip'
  );

  // Fetch user's certificates
  const userCertificates = useQuery(
    api.certificates.getUserCertificates,
    convexUser?.clerkId ? { userId: convexUser.clerkId } : 'skip'
  );

  // Fetch user's purchased products/samples
  const userPurchases = useQuery(
    api.library.getUserPurchases,
    convexUser?.clerkId ? { userId: convexUser.clerkId } : 'skip'
  );

  // Extract purchased packs
  const purchasedPacks = userPurchases?.filter((purchase: any) => 
    purchase.product?.productCategory === "sample-pack" ||
    purchase.product?.productCategory === "midi-pack" ||
    purchase.product?.productCategory === "preset-pack"
  ) || [];

  // Extract samples from purchased packs
  const purchasedSamples = purchasedPacks.flatMap((purchase: any) => {
    const pack = purchase.product;
    if (!pack?.packFiles) return [];
    
    try {
      const files = JSON.parse(pack.packFiles);
      return files.map((file: any) => ({
        _id: file.storageId,
        title: file.name.replace(/\.(wav|mp3|flac|aiff)$/i, ''),
        fileName: file.name,
        fileSize: file.size,
        fileUrl: file.url || file.storageId,
        storageId: file.storageId,
        packTitle: pack.title,
        packId: pack._id,
        purchaseDate: purchase._creationTime,
      }));
    } catch (e) {
      return [];
    }
  });

  // User display data
  const userData = {
    name: user?.firstName || "Student",
    email: user?.primaryEmailAddress?.emailAddress || "",
    avatar: user?.imageUrl,
    level: "Music Producer Level 3",
    xp: (userStats?.coursesCompleted || 0) * 100 + (userStats?.totalHoursLearned || 0) * 10,
    nextLevelXp: 3000,
  };

  const stats = userStats || {
    coursesEnrolled: 0,
    coursesCompleted: 0,
    totalHoursLearned: 0,
    currentStreak: 0,
    certificatesEarned: 0,
  };

  const nextMilestone = {
    title: "Complete 5 Courses",
    progress: stats.coursesCompleted,
    target: 5,
  };

  const levelProgress = (userData.xp / userData.nextLevelXp) * 100;

  // Loading state
  const isLoadingUser = !isUserLoaded || (user && convexUser === undefined);
  const isCreatingUser = isUserLoaded && user && convexUser === null;
  const isLoadingData = convexUser && (enrolledCourses === undefined || userStats === undefined || recentActivity === undefined);
  const isLoading = isLoadingUser || isCreatingUser || isLoadingData;
  
  if (isLoading) {
    return <LoadingState isCreatingUser={isCreatingUser} />;
  }

  // Empty state - no courses enrolled
  const hasNoCourses = !enrolledCourses || enrolledCourses.length === 0;
  
  if (hasNoCourses) {
    return (
      <div className="space-y-6 md:space-y-8">
        <div className="bg-gradient-to-r from-chart-1 to-chart-4 rounded-2xl p-6 md:p-8 text-primary-foreground relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">
              Welcome to Your Library! 👋
            </h1>
            <p className="text-primary-foreground/80">
              Start your learning journey by exploring courses
            </p>
          </div>
        </div>
        <NoCoursesEmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Welcome Header with Level Progress */}
      <div className="bg-gradient-to-r from-chart-1 to-chart-4 rounded-2xl p-6 md:p-8 text-primary-foreground relative overflow-hidden">
        <HeroFlourishes variant="music" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {userData.name}! 👋
              </h1>
              <p className="text-primary-foreground/80">
                Ready to continue your music production journey?
              </p>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <Avatar className="w-16 h-16 border-2 border-primary-foreground/20">
                <AvatarImage src={userData.avatar} />
                <AvatarFallback className="text-2xl">
                  {userData.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
          
          {/* Level Progress */}
          <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{userData.level}</span>
              <span className="text-sm text-primary-foreground/80">
                {userData.xp} / {userData.nextLevelXp} XP
              </span>
            </div>
            <Progress value={levelProgress} className="h-2 bg-primary-foreground/20" />
          </div>

          <div className="flex flex-wrap gap-4">
            <Button className="bg-primary-foreground/20 hover:bg-primary-foreground/30 border border-primary-foreground/30 backdrop-blur-sm text-primary-foreground">
              <Play className="w-4 h-4 mr-2" />
              Continue Learning
            </Button>
            <Button 
              variant="ghost" 
              className="text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => window.location.href = '/'}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Browse Courses
            </Button>
          </div>
        </div>
        
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-foreground rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-foreground rounded-full translate-y-24 -translate-x-24"></div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Courses Enrolled</p>
                <p className="text-2xl font-bold">{stats.coursesEnrolled}</p>
              </div>
              <BookOpen className="w-8 h-8 text-chart-1" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{stats.coursesCompleted}</p>
              </div>
              <Award className="w-8 h-8 text-chart-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hours Learned</p>
                <p className="text-2xl font-bold">{stats.totalHoursLearned}</p>
              </div>
              <Clock className="w-8 h-8 text-chart-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Streak</p>
                <p className="text-2xl font-bold">{stats.currentStreak}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-chart-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6 md:space-y-8">
          {/* Content Tabs */}
          <Tabs defaultValue="continue" className="w-full">
            <TabsList className="grid w-full max-w-3xl grid-cols-5">
              <TabsTrigger value="continue">Continue</TabsTrigger>
              <TabsTrigger value="downloads">
                <Download className="w-4 h-4 mr-2" />
                Downloads
              </TabsTrigger>
              <TabsTrigger value="recommended">Recommended</TabsTrigger>
              <TabsTrigger value="favorites">Favorites</TabsTrigger>
              <TabsTrigger value="certificates">
                <Award className="w-4 h-4 mr-2" />
                Certificates
              </TabsTrigger>
            </TabsList>

            <TabsContent value="continue" className="space-y-6">
              {enrolledCourses && enrolledCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {enrolledCourses.map((course: any) => (
                    <CourseCardEnhanced
                      key={course._id}
                      id={course._id}
                      title={course.title}
                      description={course.description || ''}
                      imageUrl={course.imageUrl || ''}
                      price={course.price || 0}
                      category={course.category || 'Course'}
                      skillLevel={course.skillLevel || 'Beginner'}
                      slug={course.slug || ''}
                      instructor={{
                        name: 'Instructor',
                        avatar: '',
                        verified: true,
                      }}
                      stats={{
                        students: 0,
                        lessons: 0,
                        duration: '0h 0m',
                        rating: 0,
                        reviews: 0,
                      }}
                      progress={course.progress || 0}
                      isEnrolled={true}
                      isNew={false}
                      isTrending={false}
                      variant="default"
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Enrolled Courses Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start your learning journey by enrolling in a course.
                  </p>
                  <Button onClick={() => window.location.href = '/'}>
                    <BookOpen className="w-4 h-4 mr-2" />
                    Browse Courses
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="downloads" className="space-y-6">
              <div className="space-y-6 pt-2">
                {/* Purchased Packs */}
                {purchasedPacks.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Your Packs ({purchasedPacks.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {purchasedPacks.map((purchase: any) => (
                        <Card key={purchase._id} className="hover:shadow-lg transition-all">
                          <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 flex items-center justify-center flex-shrink-0">
                                <Package className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-lg mb-1 line-clamp-1">
                                  {purchase.product?.title}
                                </h4>
                                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                  {purchase.product?.description}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                                  <span className="flex items-center gap-1">
                                    <Music className="w-3 h-3" />
                                    {JSON.parse(purchase.product?.packFiles || '[]').length} files
                                  </span>
                                  <span>
                                    {new Date(purchase._creationTime).toLocaleDateString()}
                                  </span>
                                </div>
                                <Button 
                                  size="sm" 
                                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                  onClick={() => {
                                    const samplesSection = document.getElementById(`pack-${purchase.product._id}-samples`);
                                    samplesSection?.scrollIntoView({ behavior: 'smooth' });
                                  }}
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  View {JSON.parse(purchase.product?.packFiles || '[]').length} Samples
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Purchased Samples */}
                {purchasedSamples.length > 0 ? (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Music className="w-5 h-5" />
                      All Your Samples ({purchasedSamples.length})
                    </h3>
                    <div className="space-y-2">
                      {purchasedSamples.map((sample: any) => (
                        <Card 
                          key={sample._id} 
                          id={`pack-${sample.packId}-samples`}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 flex items-center justify-center flex-shrink-0">
                                <Music className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium truncate">{sample.title}</h4>
                                <p className="text-sm text-muted-foreground">
                                  From: {sample.packTitle}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {(sample.fileSize / 1024).toFixed(0)} KB
                                </Badge>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={async () => {
                                    try {
                                      const response = await fetch(sample.fileUrl);
                                      const blob = await response.blob();
                                      const url = window.URL.createObjectURL(blob);
                                      const link = document.createElement('a');
                                      link.href = url;
                                      link.download = sample.fileName;
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                      window.URL.revokeObjectURL(url);
                                    } catch (error) {
                                      console.error('Download failed:', error);
                                    }
                                  }}
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Download
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Downloads Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Purchase sample packs from the marketplace to build your library.
                    </p>
                    <Button onClick={() => window.location.href = '/marketplace/samples'}>
                      <Package className="w-4 h-4 mr-2" />
                      Browse Samples
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="recommended" className="space-y-6">
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Personalized Recommendations</h3>
                <p className="text-muted-foreground">
                  Based on your learning progress, we'll recommend courses tailored for you.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="favorites" className="space-y-6">
              <div className="text-center py-12">
                <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Your Favorites</h3>
                <p className="text-muted-foreground">
                  Courses you've bookmarked will appear here.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="certificates" className="space-y-6">
              {userCertificates === undefined ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2].map((i) => (
                    <Card key={i}>
                      <CardContent className="p-6">
                        <Skeleton className="h-24 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : userCertificates && userCertificates.length > 0 ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Your Certificates</h3>
                      <p className="text-sm text-muted-foreground">
                        {userCertificates.length} certificate{userCertificates.length !== 1 ? 's' : ''} earned
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {userCertificates.map((certificate: any) => (
                      <CertificateCard
                        key={certificate._id}
                        certificate={certificate}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Certificates Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Complete a course to earn your first certificate!
                  </p>
                  <Button variant="outline" onClick={() => {
                    const continueTab = document.querySelector('[value="continue"]') as HTMLElement;
                    continueTab?.click();
                  }}>
                    Browse Your Courses
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 md:space-y-6">
          {/* Next Milestone */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-chart-4" />
                Next Milestone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">{nextMilestone.title}</span>
                    <span className="text-muted-foreground">
                      {nextMilestone.progress}/{nextMilestone.target}
                    </span>
                  </div>
                  <Progress 
                    value={(nextMilestone.progress / nextMilestone.target) * 100} 
                    className="h-2"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {nextMilestone.progress >= nextMilestone.target
                    ? "🎉 Milestone achieved! Great work!"
                    : `Complete ${nextMilestone.target - nextMilestone.progress} more ${nextMilestone.target - nextMilestone.progress === 1 ? "course" : "courses"} to unlock your next achievement!`}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-chart-1" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity && recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity: any) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-chart-1 to-chart-2 flex items-center justify-center flex-shrink-0">
                        {activity.type === "completed_lesson" ? (
                          <Award className="w-4 h-4 text-primary-foreground" />
                        ) : activity.type === "started_course" ? (
                          <Play className="w-4 h-4 text-primary-foreground" />
                        ) : (
                          <Award className="w-4 h-4 text-primary-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">{activity.courseName}</p>
                        <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No recent activity yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Study Time
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.location.href = '/'}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Browse New Courses
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  const certificatesTab = document.querySelector('[value="certificates"]') as HTMLElement;
                  certificatesTab?.click();
                }}
              >
                <Award className="w-4 h-4 mr-2" />
                View Certificates
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function LoadingState({ isCreatingUser }: { isCreatingUser?: boolean }) {
  return (
    <div className="space-y-6 md:space-y-8">
      <Card className="p-6 md:p-8">
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
      </Card>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-4 md:p-6">
              <Skeleton className="h-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        {isCreatingUser && (
          <p className="text-sm text-muted-foreground">
            Setting up your library...
          </p>
        )}
      </div>
    </div>
  );
}

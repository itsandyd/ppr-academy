"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CourseCardEnhanced } from "@/components/ui/course-card-enhanced";
import { CertificateCard } from "@/components/certificates/CertificateCard";
import { NoCoursesEmptyState } from "@/components/ui/empty-state-enhanced";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Award,
  Clock,
  Download,
  Music,
  Package,
  Loader2,
  Play,
  Target,
  ChevronRight,
  Zap,
  Flame,
  Heart,
  Trash2,
  TrendingDown,
  Star,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { LearnerOnboarding } from "@/components/onboarding/LearnerOnboarding";
import { ReferralCard } from "@/components/referrals/ReferralCard";
import { useApplyReferral } from "@/hooks/use-apply-referral";
import { BeatLicenseCard } from "@/components/beats/BeatLicenseCard";
import { BecomeCreatorCard } from "@/components/dashboard/BecomeCreatorCard";
import { PprProUpsell, PprProBadge } from "@/components/ppr-pro-upsell";

export function LearnModeContent() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const createUser = useMutation(api.users.createOrUpdateUserFromClerk);
  const searchParams = useSearchParams();
  const sessionVerified = useRef(false);

  // Apply referral code if user came from a referral link
  useApplyReferral();

  // Get Convex user
  const convexUser = useQuery(api.users.getUserFromClerk, user?.id ? { clerkId: user.id } : "skip");

  // Check if user already has a store (to conditionally show BecomeCreatorCard)
  const userStores = useQuery(api.stores.getStoresByUser, user?.id ? { userId: user.id } : "skip");

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
        console.error("Failed to auto-create user:", error);
      });
    }
  }, [isUserLoaded, user, convexUser, createUser]);

  // Verify purchase/subscription session if redirected from Stripe checkout
  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId || sessionVerified.current || !user) return;

    const isPurchase = searchParams.get("purchase") === "success";
    const isSubscription = searchParams.get("subscription") === "success";
    if (!isPurchase && !isSubscription) return;

    sessionVerified.current = true;

    const endpoint = isPurchase
      ? "/api/courses/verify-session"
      : "/api/memberships/verify-session";

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    }).catch((err) => {
      console.error("Session verification failed:", err);
    });
  }, [searchParams, user]);

  const enrolledCourses = useQuery(
    api.userLibrary.getUserEnrolledCourses,
    convexUser?.clerkId ? { userId: convexUser.clerkId } : "skip"
  );

  const continueWatching = useQuery(
    api.userLibrary.getContinueWatching,
    convexUser?.clerkId ? { userId: convexUser.clerkId } : "skip"
  );

  const userStats = useQuery(
    api.userLibrary.getUserLibraryStats,
    convexUser?.clerkId ? { userId: convexUser.clerkId } : "skip"
  );

  // Fetch recent activity
  const recentActivity = useQuery(
    api.userLibrary.getUserRecentActivity,
    convexUser?.clerkId ? { userId: convexUser.clerkId, limit: 5 } : "skip"
  );

  // Fetch user's certificates
  const userCertificates = useQuery(
    api.certificates.getUserCertificates,
    convexUser?.clerkId ? { userId: convexUser.clerkId } : "skip"
  );

  // Fetch user's purchased products/samples
  const userPurchases = useQuery(
    api.library.getUserPurchases,
    convexUser?.clerkId ? { userId: convexUser.clerkId } : "skip"
  );

  // Fetch user's wishlist/favorites
  const userWishlist = useQuery(api.wishlists.getUserWishlist, {});
  const removeFromWishlist = useMutation(api.wishlists.removeFromWishlist);

  // Fetch user's beat licenses
  const userBeatLicenses = useQuery(
    api.beatLeases.getUserBeatLicenses,
    convexUser?.clerkId ? { userId: convexUser.clerkId } : "skip"
  );

  // Fetch user's XP and level
  const userXP = useQuery(
    api.achievements.getUserXP,
    convexUser?.clerkId ? { userId: convexUser.clerkId } : "skip"
  );

  // Extract purchased packs
  const purchasedPacks =
    userPurchases?.filter(
      (purchase: any) =>
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
        title: file.name.replace(/\.(wav|mp3|flac|aiff)$/i, ""),
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

  // Level titles based on level number
  const getLevelTitle = (level: number): string => {
    const levelTitles = [
      "Beginner",          // 1
      "Novice",            // 2
      "Apprentice",        // 3
      "Student",           // 4
      "Practitioner",      // 5
      "Adept",             // 6
      "Skilled",           // 7
      "Expert",            // 8
      "Master",            // 9
      "Grandmaster",       // 10+
    ];
    const index = Math.min(level - 1, levelTitles.length - 1);
    return levelTitles[Math.max(0, index)];
  };

  // User display data with real XP
  const currentLevel = userXP?.level ?? 1;
  const userData = {
    name: user?.firstName || "Student",
    email: user?.primaryEmailAddress?.emailAddress || "",
    avatar: user?.imageUrl,
    level: `${getLevelTitle(currentLevel)} (Level ${currentLevel})`,
    xp: userXP?.totalXP ?? 0,
    nextLevelXp: (userXP?.totalXP ?? 0) + (userXP?.xpToNextLevel ?? 100),
    xpToNextLevel: userXP?.xpToNextLevel ?? 100,
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

  // Calculate XP progress within current level
  // Each level requires (level * 100) XP
  const xpInCurrentLevel = userData.xp % (currentLevel * 100);
  const xpNeededForLevel = currentLevel * 100;
  const levelProgress = Math.min((xpInCurrentLevel / xpNeededForLevel) * 100, 100);

  const isLoadingUser = !isUserLoaded || (user && convexUser === undefined);
  const isCreatingUser = Boolean(isUserLoaded && user && convexUser === null);
  const isLoadingData =
    convexUser &&
    (enrolledCourses === undefined || userStats === undefined || recentActivity === undefined);
  const isLoading = isLoadingUser || isCreatingUser || isLoadingData;

  if (isLoading) {
    return <LoadingState isCreatingUser={isCreatingUser} />;
  }

  // Empty state - no courses enrolled
  const hasNoCourses = !enrolledCourses || enrolledCourses.length === 0;

  if (hasNoCourses) {
    return (
      <div className="space-y-6 md:space-y-8">
        {/* Learner Onboarding Modal */}
        <LearnerOnboarding />

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-chart-1 to-chart-4 p-6 text-primary-foreground md:p-8">
          <div className="relative z-10">
            <h1 className="mb-2 text-3xl font-bold">Welcome to Your Library! 👋</h1>
            <p className="text-primary-foreground/80">
              Start your learning journey by exploring courses
            </p>
          </div>
        </div>

        {/* PPR Pro Upgrade for new users */}
        <PprProUpsell variant="card" />

        {/* Show creator CTA prominently for new users without courses */}
        {userStores !== undefined && userStores.length === 0 && (
          <BecomeCreatorCard variant="banner" />
        )}

        <NoCoursesEmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Learner Onboarding Modal (shows once) */}
      <LearnerOnboarding />

      {/* PPR Pro Upgrade Banner (hidden for Pro members) */}
      <PprProUpsell variant="banner" />

      {/* Continue Watching - THE PRIMARY CTA */}
      {continueWatching && (
        <Card className="group relative overflow-hidden border-2 border-chart-1/20 bg-gradient-to-br from-chart-1/5 via-background to-chart-2/5 transition-all hover:border-chart-1/40 hover:shadow-xl">
          <CardContent className="p-0">
            <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:p-8">
              {/* Course Thumbnail */}
              <div className="relative h-32 w-full flex-shrink-0 overflow-hidden rounded-xl md:h-40 md:w-56">
                {continueWatching.course.imageUrl ? (
                  <img
                    src={continueWatching.course.imageUrl}
                    alt={continueWatching.course.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-chart-1 to-chart-2">
                    <BookOpen className="h-12 w-12 text-primary-foreground" />
                  </div>
                )}
                <div className="absolute bottom-2 left-2">
                  <Badge className="bg-black/70 text-white backdrop-blur-sm">
                    {continueWatching.progress}% complete
                  </Badge>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 space-y-4">
                <div>
                  <p className="mb-1 flex items-center gap-2 text-sm font-medium text-chart-1">
                    <Zap className="h-4 w-4" />
                    Continue where you left off
                  </p>
                  <h2 className="text-2xl font-bold tracking-tight">
                    {continueWatching.course.title}
                  </h2>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Play className="h-4 w-4" />
                    <span className="font-medium">Next up:</span>
                    <span>{continueWatching.nextChapter.title}</span>
                  </div>
                  {continueWatching.nextChapter.lessonTitle && (
                    <p className="text-sm text-muted-foreground">
                      {continueWatching.nextChapter.moduleTitle && (
                        <span>{continueWatching.nextChapter.moduleTitle} → </span>
                      )}
                      {continueWatching.nextChapter.lessonTitle}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    href={`/dashboard/courses/${continueWatching.course.slug}?chapter=${continueWatching.nextChapter._id}`}
                  >
                    <Button size="lg" className="gap-2 bg-chart-1 hover:bg-chart-1/90">
                      <Play className="h-5 w-5" />
                      Resume Learning
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      {continueWatching.completedChapters}/{continueWatching.totalChapters} lessons
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {continueWatching.timeAgo}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <Progress value={continueWatching.progress} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats Row */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl bg-muted/50 p-4">
        <div className="flex items-center gap-2">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${stats.currentStreak > 0 ? 'bg-orange-500/10' : 'bg-muted'}`}>
            <Flame className={`h-5 w-5 ${stats.currentStreak > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
          </div>
          <div>
            <p className={`text-2xl font-bold ${stats.currentStreak > 0 ? 'text-orange-500' : ''}`}>{stats.currentStreak}</p>
            <p className="text-xs text-muted-foreground">day streak</p>
          </div>
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-chart-2/10">
            <Award className="h-5 w-5 text-chart-2" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.coursesCompleted}</p>
            <p className="text-xs text-muted-foreground">completed</p>
          </div>
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-chart-3/10">
            <Clock className="h-5 w-5 text-chart-3" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.totalHoursLearned}h</p>
            <p className="text-xs text-muted-foreground">learned</p>
          </div>
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/10">
            <Star className="h-5 w-5 text-yellow-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">Lv.{currentLevel}</p>
            <p className="text-xs text-muted-foreground">{userData.xp} XP</p>
          </div>
        </div>
        <div className="ml-auto">
          <Link href="/marketplace?contentType=courses">
            <Button variant="ghost" size="sm" className="gap-1">
              Browse more courses
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-4">
        {/* Main Content */}
        <div className="space-y-6 md:space-y-8 lg:col-span-3">
          {/* Content Tabs */}
          <Tabs defaultValue="continue" className="w-full">
            <TabsList className="grid w-full max-w-3xl grid-cols-4">
              <TabsTrigger value="continue">Continue</TabsTrigger>
              <TabsTrigger value="favorites">
                <Heart className="mr-2 h-4 w-4" />
                Favorites
                {userWishlist && userWishlist.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                    {userWishlist.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="downloads">
                <Download className="mr-2 h-4 w-4" />
                Downloads
              </TabsTrigger>
              <TabsTrigger value="certificates">
                <Award className="mr-2 h-4 w-4" />
                Certificates
              </TabsTrigger>
            </TabsList>

            <TabsContent value="continue" className="space-y-6">
              {enrolledCourses && enrolledCourses.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 pt-2 md:grid-cols-2">
                  {enrolledCourses.map((course: any) => (
                    <CourseCardEnhanced
                      key={course._id}
                      id={course._id}
                      title={course.title}
                      description={course.description || ""}
                      imageUrl={course.imageUrl || ""}
                      price={course.price || 0}
                      category={course.category || "Course"}
                      skillLevel={course.skillLevel || "Beginner"}
                      slug={course.slug || ""}
                      instructor={{
                        name: "Instructor",
                        avatar: "",
                        verified: true,
                      }}
                      stats={{
                        students: 0,
                        lessons: 0,
                        duration: "0h 0m",
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
                <div className="py-12 text-center">
                  <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-medium">No Enrolled Courses Yet</h3>
                  <p className="mb-4 text-muted-foreground">
                    Start your learning journey by enrolling in a course.
                  </p>
                  <Button onClick={() => (window.location.href = "/")}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Browse Courses
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="favorites" className="space-y-6">
              {userWishlist === undefined ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Card key={i}>
                      <CardContent className="p-6">
                        <Skeleton className="h-24 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : userWishlist && userWishlist.length > 0 ? (
                <div className="space-y-6 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Your Favorites</h3>
                      <p className="text-sm text-muted-foreground">
                        {userWishlist.length} item{userWishlist.length !== 1 ? "s" : ""} saved
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {userWishlist.map((item: typeof userWishlist[number]) => (
                      <Card key={item._id} className="group transition-all hover:shadow-lg">
                        <CardContent className="p-0">
                          <div className="flex gap-4 p-4">
                            {/* Thumbnail */}
                            <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg">
                              {item.coverImageUrl ? (
                                <img
                                  src={item.coverImageUrl}
                                  alt={item.title}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-chart-1 to-chart-2">
                                  {item.itemType === "course" ? (
                                    <BookOpen className="h-8 w-8 text-primary-foreground" />
                                  ) : (
                                    <Package className="h-8 w-8 text-primary-foreground" />
                                  )}
                                </div>
                              )}
                              {item.priceDropped && (
                                <div className="absolute right-1 top-1">
                                  <Badge className="bg-green-500 px-1.5 py-0.5 text-[10px]">
                                    <TrendingDown className="mr-0.5 h-3 w-3" />
                                    Sale
                                  </Badge>
                                </div>
                              )}
                            </div>

                            {/* Content */}
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex items-start justify-between gap-2">
                                <Link
                                  href={
                                    item.itemType === "course"
                                      ? `/courses/${item.slug}`
                                      : `/marketplace/product/${item.slug}`
                                  }
                                  className="line-clamp-2 font-semibold hover:text-chart-1"
                                >
                                  {item.title}
                                </Link>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-destructive"
                                  onClick={() => {
                                    if (item.itemType === "course" && item.courseId) {
                                      removeFromWishlist({ courseId: item.courseId });
                                    } else if (item.productId) {
                                      removeFromWishlist({ productId: item.productId });
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>

                              <Badge variant="outline" className="mb-2 text-xs">
                                {item.category}
                              </Badge>

                              <div className="flex items-center gap-2">
                                {item.priceDropped && item.priceAtAdd !== undefined ? (
                                  <>
                                    <span className="font-bold text-green-600">
                                      ${item.currentPrice.toFixed(2)}
                                    </span>
                                    <span className="text-sm text-muted-foreground line-through">
                                      ${item.priceAtAdd.toFixed(2)}
                                    </span>
                                    <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                      Save ${item.priceDropAmount?.toFixed(2)}
                                    </Badge>
                                  </>
                                ) : (
                                  <span className="font-bold">${item.currentPrice.toFixed(2)}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Heart className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-medium">No Favorites Yet</h3>
                  <p className="mb-4 text-muted-foreground">
                    Save courses and products you're interested in to find them later.
                  </p>
                  <Button onClick={() => (window.location.href = "/marketplace")}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Browse Marketplace
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="downloads" className="space-y-6">
              <div className="space-y-6 pt-2">
                {/* Beat Licenses */}
                {userBeatLicenses && userBeatLicenses.length > 0 && (
                  <div>
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                      <Music className="h-5 w-5" />
                      Beat Licenses ({userBeatLicenses.length})
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      {userBeatLicenses.map((license: any) => (
                        <BeatLicenseCard key={license._id} license={license} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Purchased Packs */}
                {purchasedPacks.length > 0 && (
                  <div>
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                      <Package className="h-5 w-5" />
                      Your Packs ({purchasedPacks.length})
                    </h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {purchasedPacks.map((purchase: any) => (
                        <Card key={purchase._id} className="transition-all hover:shadow-lg">
                          <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20">
                                <Package className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="mb-1 line-clamp-1 text-lg font-semibold">
                                  {purchase.product?.title}
                                </h4>
                                <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                                  {purchase.product?.description}
                                </p>
                                <div className="mb-4 flex items-center gap-4 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Music className="h-3 w-3" />
                                    {JSON.parse(purchase.product?.packFiles || "[]").length} files
                                  </span>
                                  <span>
                                    {new Date(purchase._creationTime).toLocaleDateString()}
                                  </span>
                                </div>
                                <Button
                                  size="sm"
                                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                  onClick={() => {
                                    const samplesSection = document.getElementById(
                                      `pack-${purchase.product._id}-samples`
                                    );
                                    samplesSection?.scrollIntoView({ behavior: "smooth" });
                                  }}
                                >
                                  <Download className="mr-2 h-4 w-4" />
                                  View {JSON.parse(purchase.product?.packFiles || "[]").length}{" "}
                                  Samples
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
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                      <Music className="h-5 w-5" />
                      All Your Samples ({purchasedSamples.length})
                    </h3>
                    <div className="space-y-2">
                      {purchasedSamples.map((sample: any) => (
                        <Card
                          key={sample._id}
                          id={`pack-${sample.packId}-samples`}
                          className="transition-colors hover:bg-muted/30"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20">
                                <Music className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="truncate font-medium">{sample.title}</h4>
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
                                      const link = document.createElement("a");
                                      link.href = url;
                                      link.download = sample.fileName;
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                      window.URL.revokeObjectURL(url);
                                    } catch (error) {
                                      console.error("Download failed:", error);
                                    }
                                  }}
                                >
                                  <Download className="mr-2 h-4 w-4" />
                                  Download
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : !userBeatLicenses || userBeatLicenses.length === 0 ? (
                  <div className="py-12 text-center">
                    <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <h3 className="mb-2 text-lg font-medium">No Downloads Yet</h3>
                    <p className="mb-4 text-muted-foreground">
                      Purchase sample packs or license beats from the marketplace to build your library.
                    </p>
                    <div className="flex justify-center gap-4">
                      <Button onClick={() => (window.location.href = "/marketplace/samples")}>
                        <Package className="mr-2 h-4 w-4" />
                        Browse Samples
                      </Button>
                      <Button variant="outline" onClick={() => (window.location.href = "/marketplace/beats")}>
                        <Music className="mr-2 h-4 w-4" />
                        Browse Beats
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            </TabsContent>


            <TabsContent value="certificates" className="space-y-6">
              {userCertificates === undefined ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                        {userCertificates.length} certificate
                        {userCertificates.length !== 1 ? "s" : ""} earned
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {userCertificates.map((certificate: any) => (
                      <CertificateCard key={certificate._id} certificate={certificate} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Award className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-medium">No Certificates Yet</h3>
                  <p className="mb-4 text-muted-foreground">
                    Complete a course to earn your first certificate!
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const continueTab = document.querySelector(
                        '[value="continue"]'
                      ) as HTMLElement;
                      continueTab?.click();
                    }}
                  >
                    Browse Your Courses
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 md:space-y-6">
          {/* Become a Creator CTA - show only if user doesn't have a store */}
          {userStores !== undefined && userStores.length === 0 && (
            <BecomeCreatorCard variant="default" />
          )}

          {/* Next Milestone */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-chart-4" />
                Next Milestone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex justify-between text-sm">
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
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-chart-1" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity && recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity: any) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-chart-1 to-chart-2">
                        {activity.type === "completed_lesson" ? (
                          <Award className="h-4 w-4 text-primary-foreground" />
                        ) : activity.type === "started_course" ? (
                          <Play className="h-4 w-4 text-primary-foreground" />
                        ) : (
                          <Award className="h-4 w-4 text-primary-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-medium">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">{activity.courseName}</p>
                        <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center">
                  <Clock className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
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
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => (window.location.href = "/")}
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Browse New Courses
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  const certificatesTab = document.querySelector(
                    '[value="certificates"]'
                  ) as HTMLElement;
                  certificatesTab?.click();
                }}
              >
                <Award className="mr-2 h-4 w-4" />
                View Certificates
              </Button>
            </CardContent>
          </Card>

          {/* Referral Program */}
          <ReferralCard />
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
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex-1">
            <Skeleton className="mb-2 h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
      </Card>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-4 md:p-6">
              <Skeleton className="h-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        {isCreatingUser && (
          <p className="text-sm text-muted-foreground">Setting up your library...</p>
        )}
      </div>
    </div>
  );
}

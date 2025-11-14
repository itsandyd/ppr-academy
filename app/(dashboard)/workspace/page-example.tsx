"use client";

/**
 * Unified Workspace Dashboard - Clean UI Example
 * 
 * Using "/workspace" instead of "/store" for better naming
 * Shows a clean, non-overwhelming interface
 */

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, TrendingUp, Store, Music, ArrowRight, Play } from "lucide-react";
import { useRouter } from "next/navigation";

export default function WorkspacePage() {
  const { user } = useUser();
  const router = useRouter();
  
  const convexUser = useQuery(
    api.users.getUserFromClerk,
    user?.id ? { clerkId: user.id } : "skip"
  );
  
  const userStore = useQuery(
    api.stores.getUserStore,
    convexUser?.clerkId ? { userId: convexUser.clerkId } : "skip"
  );
  
  const enrolledCourses = useQuery(
    api.userLibrary.getUserEnrolledCourses,
    convexUser?.clerkId ? { userId: convexUser.clerkId } : "skip"
  );
  
  const hasStore = !!userStore;
  const hasEnrollments = enrolledCourses && enrolledCourses.length > 0;
  const storeId = userStore?._id;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Simple Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.firstName}</h1>
        <p className="text-muted-foreground">
          Everything you need in one place
        </p>
      </div>

      {/* Clean Grid Layout - Only shows what's relevant */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Learning Section - Shows if user has enrollments */}
        {(hasEnrollments || !hasStore) && (
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => router.push("/workspace/library")}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-lg font-semibold mb-2">My Library</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Continue learning with your enrolled courses
              </p>
              {hasEnrollments && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Play className="w-4 h-4" />
                  <span>{enrolledCourses?.length || 0} courses</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Creator Studio - Shows if user has store */}
        {hasStore && (
          <>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => router.push("/workspace/studio")}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Creator Studio</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  View your business overview and analytics
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Revenue</span>
                    <p className="font-semibold">$0</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Students</span>
                    <p className="font-semibold">0</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => router.push(`/workspace/${storeId}/products`)}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <Store className="w-6 h-6 text-green-600" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Store Management</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Manage products, customers, and settings
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Products • Customers • Analytics</span>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => router.push(`/workspace/${storeId}/showcase`)}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center">
                    <Music className="w-6 h-6 text-pink-600" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Music Showcase</h3>
                <p className="text-sm text-muted-foreground">
                  Manage your artist profile and tracks
                </p>
              </CardContent>
            </Card>
          </>
        )}

        {/* Empty State for New Users */}
        {!hasStore && !hasEnrollments && (
          <Card className="col-span-full">
            <CardContent className="p-6 text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Get Started</h3>
              <p className="text-muted-foreground mb-4">
                Start learning or create your first product
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => router.push("/")}>
                  Browse Courses
                </Button>
                <Button variant="outline" onClick={() => router.push("/workspace/studio")}>
                  Become a Creator
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions - Only if user has content */}
      {(hasStore || hasEnrollments) && (
        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            {hasEnrollments && (
              <Button variant="outline" onClick={() => router.push("/workspace/library")}>
                <Play className="w-4 h-4 mr-2" />
                Continue Learning
              </Button>
            )}
            {hasStore && (
              <>
                <Button variant="outline" onClick={() => router.push(`/workspace/${storeId}/products/create`)}>
                  Create Product
                </Button>
                <Button variant="outline" onClick={() => router.push(`/workspace/${storeId}/courses/create`)}>
                  Create Course
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => router.push("/")}>
              Browse Marketplace
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}




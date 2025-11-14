"use client";

/**
 * Unified Store Dashboard - Example Structure
 * 
 * This shows how everything could be consolidated under /store
 * with tabs/sections for Library, Studio, and Store Management
 */

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Store, Music, TrendingUp, Users, Award } from "lucide-react";
import { useRouter } from "next/navigation";
import { StoreRequiredGuard } from "@/components/dashboard/store-required-guard";

export default function UnifiedStorePage() {
  const { user } = useUser();
  const router = useRouter();
  
  // Get user's store
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Store</h1>
          <p className="text-muted-foreground">
            Manage your content, learning, and business in one place
          </p>
        </div>
      </div>

      {/* Unified Tabs */}
      <Tabs defaultValue={hasStore ? "studio" : "library"} className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          {/* Library Tab - Always visible for learners */}
          {(hasEnrollments || !hasStore) && (
            <TabsTrigger value="library" className="gap-2">
              <BookOpen className="w-4 h-4" />
              My Library
            </TabsTrigger>
          )}
          
          {/* Studio Tab - Creator overview */}
          {hasStore && (
            <TabsTrigger value="studio" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Studio
            </TabsTrigger>
          )}
          
          {/* Store Management Tab - Detailed store management */}
          {hasStore && (
            <TabsTrigger value="store" className="gap-2">
              <Store className="w-4 h-4" />
              Store Management
            </TabsTrigger>
          )}
        </TabsList>

        {/* Library Content */}
        {(hasEnrollments || !hasStore) && (
          <TabsContent value="library" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  My Learning Library
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  View your enrolled courses, track progress, and manage your learning.
                </p>
                <button
                  onClick={() => router.push("/store/library")}
                  className="text-primary hover:underline"
                >
                  Go to Library →
                </button>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Studio Content - Creator Overview */}
        {hasStore && (
          <TabsContent value="studio" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">$0</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Students
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">0</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Products
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">0</p>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <button
                  onClick={() => router.push(`/store/${storeId}/products/create`)}
                  className="w-full text-left p-3 rounded-lg hover:bg-muted"
                >
                  Create New Product
                </button>
                <button
                  onClick={() => router.push(`/store/${storeId}/courses/create`)}
                  className="w-full text-left p-3 rounded-lg hover:bg-muted"
                >
                  Create New Course
                </button>
                <button
                  onClick={() => router.push(`/store/${storeId}/analytics`)}
                  className="w-full text-left p-3 rounded-lg hover:bg-muted"
                >
                  View Analytics
                </button>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Store Management Content */}
        {hasStore && (
          <TabsContent value="store" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  Store Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Manage your products, customers, and store settings.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button
                    onClick={() => router.push(`/store/${storeId}/products`)}
                    className="p-4 rounded-lg border hover:bg-muted text-center"
                  >
                    <Store className="w-6 h-6 mx-auto mb-2" />
                    Products
                  </button>
                  <button
                    onClick={() => router.push(`/store/${storeId}/customers`)}
                    className="p-4 rounded-lg border hover:bg-muted text-center"
                  >
                    <Users className="w-6 h-6 mx-auto mb-2" />
                    Customers
                  </button>
                  <button
                    onClick={() => router.push(`/store/${storeId}/analytics`)}
                    className="p-4 rounded-lg border hover:bg-muted text-center"
                  >
                    <TrendingUp className="w-6 h-6 mx-auto mb-2" />
                    Analytics
                  </button>
                  <button
                    onClick={() => router.push(`/store/${storeId}/showcase`)}
                    className="p-4 rounded-lg border hover:bg-muted text-center"
                  >
                    <Music className="w-6 h-6 mx-auto mb-2" />
                    Showcase
                  </button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}




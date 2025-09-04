"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Book,
  Download,
  Calendar,
  Package,
  Clock,
  TrendingUp,
  PlayCircle,
  FileText,
  ExternalLink,
  CheckCircle,
  Search,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export default function LibraryOverviewPage() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  
  // Handle purchase success
  useEffect(() => {
    const purchaseStatus = searchParams.get("purchase");
    const sessionId = searchParams.get("session_id");
    
    if (purchaseStatus === "success" && sessionId) {
      toast.success("🎉 Purchase successful! Welcome to your new content.");
    }
  }, [searchParams]);
  
  const purchases = useQuery(
    api.library.getUserPurchases,
    user?.id ? { userId: user.id } : "skip"
  );

  const courses = useQuery(
    api.library.getUserCourses,
    user?.id ? { userId: user.id } : "skip"
  );

  const digitalProducts = useQuery(
    api.library.getUserDigitalProducts,
    user?.id ? { userId: user.id } : "skip"
  );

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">Please sign in</h2>
          <p className="text-muted-foreground">Access your library by signing in</p>
        </div>
      </div>
    );
  }

  const stats = {
    totalPurchases: purchases?.length || 0,
    totalCourses: courses?.length || 0,
    totalDownloads: digitalProducts?.length || 0,
    totalCoaching: purchases?.filter(p => p.productType === "coaching").length || 0,
    completedCourses: courses?.filter(c => (c.progress || 0) >= 100).length || 0,
    avgProgress: courses?.length ? 
      Math.round((courses.reduce((sum, c) => sum + (c.progress || 0), 0) / courses.length)) : 0,
  };

  const recentActivity = [
    ...(courses?.slice(0, 3).map(course => ({
      type: "course" as const,
      id: course._id,
      title: course.title,
      description: `${course.progress || 0}% complete`,
      imageUrl: course.imageUrl,
      href: `/library/courses/${course._id}`,
      timestamp: course.lastAccessedAt || course._creationTime,
    })) || []),
    ...(digitalProducts?.slice(0, 2).map(product => ({
      type: "download" as const,
      id: product._id,
      title: product.title,
      description: `Downloaded ${product.downloadCount || 0} times`,
      imageUrl: product.imageUrl,
      href: `/library/downloads/${product._id}`,
      timestamp: product.lastAccessedAt || product._creationTime,
    })) || []),
  ].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {user.firstName}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Continue your learning journey and explore your content library.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <Book className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedCourses} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Downloads</CardTitle>
            <Download className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDownloads}</div>
            <p className="text-xs text-muted-foreground">
              Digital products owned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgProgress}%</div>
            <p className="text-xs text-muted-foreground">
              Across all courses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <Package className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${purchases?.reduce((sum, p) => sum + p.amount, 0).toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalPurchases} purchases
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Continue Learning */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PlayCircle className="w-5 h-5" />
              <span>Continue Learning</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {courses?.slice(0, 3).map((course) => (
              <div key={course._id} className="flex items-center space-x-4 p-3 bg-background rounded-lg">
                <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden">
                  {course.imageUrl ? (
                    <img 
                      src={course.imageUrl} 
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Book className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground truncate">{course.title}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <Progress value={course.progress || 0} className="flex-1 h-2" />
                    <span className="text-xs text-muted-foreground">{course.progress || 0}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {course.storeName}
                  </p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/library/courses/${course._id}`}>
                    Continue
                  </Link>
                </Button>
              </div>
            ))}
            
            {courses && courses.length === 0 && (
              <div className="text-center py-8">
                <Book className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium text-foreground">No courses yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start learning by purchasing your first course
                </p>
                <Button asChild>
                  <Link href="/courses">Browse Courses</Link>
                </Button>
              </div>
            )}

            {courses && courses.length > 3 && (
              <Button asChild variant="outline" className="w-full">
                <Link href="/library/courses">View All Courses</Link>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Recent Downloads */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Download className="w-5 h-5" />
              <span>Your Downloads</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {digitalProducts?.slice(0, 3).map((product) => (
              <div key={product._id} className="flex items-center space-x-4 p-3 bg-background rounded-lg">
                <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden">
                  {product.imageUrl ? (
                    <img 
                      src={product.imageUrl} 
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground truncate">{product.title}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {product.productType === "urlMedia" ? "URL/Media" : "Digital"}
                    </Badge>
                    {product.downloadCount && (
                      <span className="text-xs text-muted-foreground">
                        Downloaded {product.downloadCount}x
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {product.storeName}
                  </p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/library/downloads/${product._id}`}>
                    {product.productType === "urlMedia" ? (
                      <>
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-1" />
                        Access
                      </>
                    )}
                  </Link>
                </Button>
              </div>
            ))}

            {digitalProducts && digitalProducts.length === 0 && (
              <div className="text-center py-8">
                <Download className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium text-foreground">No downloads yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Purchase digital products to access them here
                </p>
                <Button asChild>
                  <Link href="/courses">Browse Products</Link>
                </Button>
              </div>
            )}

            {digitalProducts && digitalProducts.length > 3 && (
              <Button asChild variant="outline" className="w-full">
                <Link href="/library/downloads">View All Downloads</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((item) => (
                <div key={`${item.type}-${item.id}`} className="flex items-center space-x-4 p-3 bg-background rounded-lg hover:bg-accent transition-colors">
                  <div className="w-10 h-10 bg-muted rounded-lg overflow-hidden">
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl} 
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {item.type === "course" ? (
                          <Book className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <FileText className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(item.timestamp || 0), { addSuffix: true })}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="ghost">
                    <Link href={item.href}>
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {(!purchases || purchases.length === 0) && (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Your library is empty</h2>
            <p className="text-muted-foreground mb-6">
              Start building your collection by purchasing courses and digital products
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <Link href="/courses">
                  <Book className="w-4 h-4 mr-2" />
                  Browse Courses
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/creators">
                  <Search className="w-4 h-4 mr-2" />
                  Explore Creators
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper function to get icon for product type
function getProductTypeIcon(type: string) {
  switch (type) {
    case "course":
      return Book;
    case "digitalProduct":
      return FileText;
    case "coaching":
      return Calendar;
    case "bundle":
      return Package;
    default:
      return FileText;
  }
}

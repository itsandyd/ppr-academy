"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Book,
  Download,
  Calendar,
  ExternalLink,
  PlayCircle,
  FileText,
  Package,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function LibraryRecentPage() {
  const { user } = useUser();
  
  const courses = useQuery(
    api.library.getUserCourses,
    user?.id ? { userId: user.id } : "skip"
  );

  const digitalProducts = useQuery(
    api.library.getUserDigitalProducts,
    user?.id ? { userId: user.id } : "skip"
  );

  const purchases = useQuery(
    api.library.getUserPurchases,
    user?.id ? { userId: user.id } : "skip"
  );

  // Combine all recent activity
  const recentActivity = [
    ...(courses?.map(course => ({
      type: "course" as const,
      id: course._id,
      title: course.title,
      description: course.description,
      imageUrl: course.imageUrl,
      href: `/library/courses/${course.slug}`,
      timestamp: course.lastAccessedAt || course.purchaseDate,
      storeName: course.storeName,
      progress: course.progress,
      badge: `${course.progress || 0}% complete`,
    })) || []),
    
    ...(digitalProducts?.map(product => ({
      type: "download" as const,
      id: product._id,
      title: product.title,
      description: product.description,
      imageUrl: product.imageUrl,
      href: `/library/downloads/${product._id}`,
      timestamp: product.lastAccessedAt || product.purchaseDate,
      storeName: product.storeName,
      badge: product.productType === "urlMedia" ? "URL/Media" : "Digital File",
      downloadCount: product.downloadCount,
    })) || []),
    
    ...(purchases?.filter(p => p.productType === "coaching").map(coaching => ({
      type: "coaching" as const,
      id: coaching._id,
      title: coaching.productTitle || "Coaching Session",
      description: `Coaching session with ${coaching.storeName}`,
      imageUrl: coaching.productImageUrl,
      href: `/library/coaching`,
      timestamp: coaching.lastAccessedAt || coaching._creationTime,
      storeName: coaching.storeName,
      badge: "Coaching",
    })) || []),
  ].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "course":
        return Book;
      case "download":
        return FileText;
      case "coaching":
        return Calendar;
      default:
        return Package;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "course":
        return "text-blue-600";
      case "download":
        return "text-green-600";
      case "coaching":
        return "text-purple-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Recent Activity</h1>
        <p className="text-muted-foreground mt-2">
          Your recently accessed content and purchases
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-foreground">{recentActivity.length}</div>
            <div className="text-sm text-muted-foreground">Total Items</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {recentActivity.filter(a => a.type === "course").length}
            </div>
            <div className="text-sm text-muted-foreground">Courses</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {recentActivity.filter(a => a.type === "download").length}
            </div>
            <div className="text-sm text-muted-foreground">Downloads</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {recentActivity.filter(a => a.type === "coaching").length}
            </div>
            <div className="text-sm text-muted-foreground">Coaching</div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Timeline */}
      {recentActivity.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Recent Activity</h2>
          
          {recentActivity.map((item, index) => {
            const Icon = getActivityIcon(item.type);
            const colorClass = getActivityColor(item.type);
            
            return (
              <Card key={`${item.type}-${item.id}`} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    {/* Timeline dot */}
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full bg-background border-2 flex items-center justify-center ${colorClass.replace('text-', 'border-')}`}>
                        <Icon className={`w-5 h-5 ${colorClass}`} />
                      </div>
                      {index < recentActivity.length - 1 && (
                        <div className="w-px h-8 bg-border mt-2" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground line-clamp-2">
                            {item.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            by {item.storeName}
                          </p>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                        </div>
                        
                        {/* Thumbnail */}
                        <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden ml-4">
                          {item.imageUrl ? (
                            <img 
                              src={item.imageUrl} 
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Icon className={`w-6 h-6 ${colorClass}`} />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center space-x-3">
                          <Badge variant="secondary" className="text-xs">
                            {item.badge}
                          </Badge>
                          
                          {item.type === "course" && item.progress !== undefined && (
                            <div className="flex items-center space-x-2">
                              <Progress value={item.progress} className="w-16 h-2" />
                              <span className="text-xs text-muted-foreground">
                                {item.progress}%
                              </span>
                            </div>
                          )}
                          
                          {item.type === "download" && item.downloadCount !== undefined && (
                            <div className="text-xs text-muted-foreground">
                              <Download className="w-3 h-3 inline mr-1" />
                              {item.downloadCount} downloads
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(item.timestamp || 0), { addSuffix: true })}
                          </span>
                          <Button asChild size="sm" variant="outline">
                            <Link href={item.href}>
                              {item.type === "course" ? (
                                <>
                                  <PlayCircle className="w-4 h-4 mr-1" />
                                  Continue
                                </>
                              ) : (
                                <>
                                  <ExternalLink className="w-4 h-4 mr-1" />
                                  Access
                                </>
                              )}
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">No recent activity</h2>
            <p className="text-muted-foreground mb-6">
              Start learning or accessing your content to see activity here
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <Link href="/library/courses">
                  <Book className="w-4 h-4 mr-2" />
                  My Courses
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/library/downloads">
                  <Download className="w-4 h-4 mr-2" />
                  My Downloads
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

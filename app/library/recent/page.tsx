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
  Folder,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { Progress } from "@/components/ui/progress";

export default function LibraryRecentPage() {
  const { user } = useUser();

  const courses = useQuery(api.library.getUserCourses, user?.id ? { userId: user.id } : "skip");

  const digitalProducts = useQuery(
    api.library.getUserDigitalProducts,
    user?.id ? { userId: user.id } : "skip"
  );

  const purchases = useQuery(api.library.getUserPurchases, user?.id ? { userId: user.id } : "skip");

  // Combine all recent activity
  const recentActivity = [
    ...(courses?.map((course: any) => ({
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

    ...(digitalProducts?.map((product: any) => ({
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

    ...(purchases
      ?.filter((p: any) => p.productType === "coaching")
      .map((coaching: any) => ({
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
        <p className="mt-2 text-muted-foreground">Your recently accessed content and purchases</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-foreground">{recentActivity.length}</div>
            <div className="text-sm text-muted-foreground">Total Items</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {recentActivity.filter((a) => a.type === "course").length}
            </div>
            <div className="text-sm text-muted-foreground">Courses</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {recentActivity.filter((a) => a.type === "download").length}
            </div>
            <div className="text-sm text-muted-foreground">Downloads</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {recentActivity.filter((a) => a.type === "coaching").length}
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
              <Card key={`${item.type}-${item.id}`} className="transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    {/* Timeline dot */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 bg-background ${colorClass.replace("text-", "border-")}`}
                      >
                        <Icon className={`h-5 w-5 ${colorClass}`} />
                      </div>
                      {index < recentActivity.length - 1 && (
                        <div className="mt-2 h-8 w-px bg-border" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <h3 className="line-clamp-2 font-semibold text-foreground">
                            {item.title}
                          </h3>
                          <p className="mt-1 text-sm text-muted-foreground">by {item.storeName}</p>
                          {item.description && (
                            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                              {item.description}
                            </p>
                          )}
                        </div>

                        {/* Thumbnail */}
                        <div className="ml-4 h-16 w-16 overflow-hidden rounded-lg bg-muted">
                          {item.imageUrl ? (
                            <Image
                              src={item.imageUrl}
                              alt={item.title}
                              width={64}
                              height={64}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Icon className={`h-6 w-6 ${colorClass}`} />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Badge variant="secondary" className="text-xs">
                            {item.badge}
                          </Badge>

                          {item.type === "course" && item.progress !== undefined && (
                            <div className="flex items-center space-x-2">
                              <Progress value={item.progress} className="h-2 w-16" />
                              <span className="text-xs text-muted-foreground">
                                {item.progress}%
                              </span>
                            </div>
                          )}

                          {item.type === "download" && item.downloadCount !== undefined && (
                            <div className="text-xs text-muted-foreground">
                              <Download className="mr-1 inline h-3 w-3" />
                              {item.downloadCount} downloads
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(item.timestamp || 0), {
                              addSuffix: true,
                            })}
                          </span>
                          <Button asChild size="sm" variant="outline">
                            <Link href={item.href}>
                              {item.type === "course" ? (
                                <>
                                  <PlayCircle className="mr-1 h-4 w-4" />
                                  Continue
                                </>
                              ) : (
                                <>
                                  <ExternalLink className="mr-1 h-4 w-4" />
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
          <CardContent className="py-12 text-center">
            <Clock className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h2 className="mb-2 text-2xl font-bold text-foreground">No recent activity</h2>
            <p className="mb-6 text-muted-foreground">
              Start learning or accessing your content to see activity here
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button asChild>
                <Link href="/library/courses">
                  <Book className="mr-2 h-4 w-4" />
                  My Courses
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/library/downloads">
                  <Download className="mr-2 h-4 w-4" />
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

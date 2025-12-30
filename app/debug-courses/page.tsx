"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Copy, ExternalLink, CheckCircle, Wrench, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Id } from "@/convex/_generated/dataModel";

// Separate component for each course card to avoid hooks in loops
function CourseDebugCard({
  course,
  copiedSlug,
  fixingCourseId,
  onCopy,
  onFix,
}: {
  course: {
    _id: string;
    title: string;
    slug?: string;
    isPublished?: boolean;
  };
  copiedSlug: string | null;
  fixingCourseId: string | null;
  onCopy: (slug: string) => void;
  onFix: (courseId: string, courseTitle: string) => void;
}) {
  // Check course data to see if it has issues
  const courseData = useQuery(
    api.debugFix.checkCourseData,
    course.slug ? { slug: course.slug } : "skip"
  );
  const hasStoreId = courseData?.hasStoreId ?? true;
  const storeExists = courseData?.storeExists ?? true;
  const userExists = courseData?.userExists ?? true;
  const needsFix = !hasStoreId || !storeExists || !userExists;

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="mb-1 text-lg font-semibold">{course.title}</h3>
            <div className="mb-2 flex items-center gap-2">
              <Badge variant={course.isPublished ? "default" : "secondary"}>
                {course.isPublished ? "Published" : "Draft"}
              </Badge>
              {needsFix && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {!hasStoreId
                    ? "Missing Store ID"
                    : !storeExists
                      ? "Store Not Found"
                      : "User Not Synced"}
                </Badge>
              )}
            </div>
            {course.slug ? (
              <>
                <div className="mb-2 flex items-center gap-2">
                  <code className="rounded bg-muted px-2 py-1 text-sm">/courses/{course.slug}</code>
                </div>
                <p className="break-all text-xs text-muted-foreground">
                  Preview URL: {window.location.origin}/courses/{course.slug}?preview=true
                </p>
                {needsFix && (
                  <p className="mt-2 text-xs text-destructive">
                    ⚠️ This course{" "}
                    {!hasStoreId
                      ? "is missing a storeId"
                      : !storeExists
                        ? "has an invalid storeId"
                        : "has an owner that's not synced to the database"}{" "}
                    and will show a 404 error. Click "Fix Course" below.
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-destructive">❌ No slug found for this course</p>
            )}
          </div>
        </div>

        {course.slug && (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCopy(course.slug!)}
              className="gap-2"
            >
              {copiedSlug === course.slug ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Preview URL
                </>
              )}
            </Button>
            <Button size="sm" asChild>
              <Link href={`/courses/${course.slug}?preview=true`} target="_blank" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Open Preview
              </Link>
            </Button>
            {needsFix && (
              <Button
                size="sm"
                variant="default"
                onClick={() => onFix(course._id, course.title)}
                disabled={fixingCourseId === course._id}
                className="gap-2"
              >
                <Wrench className="h-4 w-4" />
                {fixingCourseId === course._id ? "Fixing..." : "Fix Course"}
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

export default function DebugCoursesPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [fixingCourseId, setFixingCourseId] = useState<string | null>(null);

  // Get user from Convex
  const convexUser = useQuery(api.users.getUserFromClerk, user?.id ? { clerkId: user.id } : "skip");

  const fixCourseStoreId = useMutation(api.debugFix.fixCourseStoreId);

  // Get all user's courses
  const userCourses = useQuery(
    api.debug.getAllUserCourses,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

  // Search courses by title
  const searchResults = useQuery(
    api.debug.findCourseByTitle,
    searchTerm.length > 2 ? { titleFragment: searchTerm } : "skip"
  );

  const copyToClipboard = (slug: string) => {
    const url = `${window.location.origin}/courses/${slug}?preview=true`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleFixCourse = async (courseId: string, courseTitle: string) => {
    if (!convexUser?._id) {
      toast({
        title: "Error",
        description: "User not found. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    setFixingCourseId(courseId);
    try {
      const result = await fixCourseStoreId({
        courseId: courseId as any,
        userId: convexUser._id,
      });

      if (result.success) {
        toast({
          title: "Fixed! ✅",
          description: `"${courseTitle}" now has a storeId and should work!`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fix course",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fix course. Please try again.",
        variant: "destructive",
      });
    } finally {
      setFixingCourseId(null);
    }
  };

  const coursesToShow = searchTerm.length > 2 ? searchResults : userCourses;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>🔍 Course Slug Finder</CardTitle>
            <p className="text-sm text-muted-foreground">
              Find your course's actual slug to access the landing page
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Input
                placeholder="Search courses by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>

            {!user && <p className="text-muted-foreground">Please sign in to see your courses</p>}

            {coursesToShow === undefined && user && (
              <p className="text-muted-foreground">Loading courses...</p>
            )}

            {coursesToShow && coursesToShow.length === 0 && (
              <p className="text-muted-foreground">
                {searchTerm.length > 2
                  ? "No courses found matching your search"
                  : "No courses found"}
              </p>
            )}

            {coursesToShow && coursesToShow.length > 0 && (
              <div className="space-y-3">
                {coursesToShow.map((course: any) => (
                  <CourseDebugCard
                    key={course._id}
                    course={course}
                    copiedSlug={copiedSlug}
                    fixingCourseId={fixingCourseId}
                    onCopy={copyToClipboard}
                    onFix={handleFixCourse}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>💡 Troubleshooting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="mb-1 font-medium">If your course has no slug:</p>
              <p className="text-muted-foreground">
                The course may have been created before slug generation was added. Try editing and
                saving the course again to generate a slug.
              </p>
            </div>
            <div>
              <p className="mb-1 font-medium">If you get a 404:</p>
              <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                <li>Make sure you're using the exact slug shown above</li>
                <li>
                  Include <code className="rounded bg-muted px-1">?preview=true</code> for
                  unpublished courses
                </li>
                <li>Check that you're signed in with the same account that created the course</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

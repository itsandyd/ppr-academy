'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Download, RefreshCw, Sparkles, BookOpen } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { ExportReferencePdfDialog } from '@/components/course/ExportReferencePdfDialog';
import { useEffect, useState } from 'react';

export const dynamic = 'force-dynamic';

export default function ReferenceGuidesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const mode = searchParams.get('mode');

  useEffect(() => {
    if (mode !== 'create') {
      router.push('/dashboard?mode=create');
    }
  }, [mode, router]);

  const convexUser = useQuery(
    api.users.getUserFromClerk,
    user?.id ? { clerkId: user.id } : 'skip'
  );

  const createdCourses = useQuery(
    api.courses.getCoursesByUser,
    convexUser?.clerkId ? { userId: convexUser.clerkId } : 'skip'
  );

  const [dialogCourse, setDialogCourse] = useState<{ id: string; title: string } | null>(null);

  const isLoading = !user || convexUser === undefined;

  if (isLoading) {
    return <LoadingState />;
  }

  const courses = createdCourses || [];
  const hasCourses = courses.length > 0;
  const guidesGenerated = courses.filter((c: any) => c.referencePdfUrl).length;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-3xl font-bold">Reference Guides</h1>
          <p className="text-muted-foreground">
            AI-generated reference PDFs from your course content
          </p>
        </div>
        {hasCourses && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="w-4 h-4" />
            <span>{guidesGenerated} of {courses.length} courses have guides</span>
          </div>
        )}
      </div>

      {/* Info card */}
      {hasCourses && (
        <Card className="border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-pink-500/5">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium">How it works</p>
              <p className="text-xs text-muted-foreground">
                Claude AI reads your course chapters and transforms them into a branded, scannable reference guide PDF
                with key takeaways, quick references, and pro tips. Great as a lead magnet or bonus for students.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Course list */}
      {!hasCourses ? (
        <EmptyState
          icon={BookOpen}
          title="No courses yet"
          description="Create a course first, then generate reference guide PDFs from its content."
          action={{ label: "Create Course", href: "/dashboard/create/course?category=course" }}
        />
      ) : (
        <div className="space-y-3">
          {courses.map((course: any) => {
            const hasGuide = !!course.referencePdfUrl;
            const generatedDate = course.referencePdfGeneratedAt
              ? new Date(course.referencePdfGeneratedAt).toLocaleDateString()
              : null;

            return (
              <Card key={course._id} className="overflow-hidden">
                <CardContent className="p-4 flex items-center gap-4">
                  {/* Course thumbnail */}
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20">
                    {hasGuide ? (
                      <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    ) : (
                      <BookOpen className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>

                  {/* Course info */}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium truncate">{course.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {course.isPublished ? (
                        <Badge variant="outline" className="text-xs text-green-600">Published</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-yellow-600">Draft</Badge>
                      )}
                      {hasGuide ? (
                        <Badge variant="secondary" className="text-xs">
                          Guide generated {generatedDate}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">No guide yet</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {hasGuide && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={course.referencePdfUrl} target="_blank" rel="noopener noreferrer" download>
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </a>
                      </Button>
                    )}
                    <Button
                      variant={hasGuide ? "ghost" : "default"}
                      size="sm"
                      onClick={() => setDialogCourse({ id: course._id, title: course.title })}
                    >
                      {hasGuide ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Regenerate
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-1" />
                          Generate
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Generate dialog */}
      {dialogCourse && (
        <ExportReferencePdfDialog
          courseId={dialogCourse.id}
          courseTitle={dialogCourse.title}
          isOpen={!!dialogCourse}
          onClose={() => setDialogCourse(null)}
        />
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    </div>
  );
}

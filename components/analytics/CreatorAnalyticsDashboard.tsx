"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Award,
  Eye,
  Clock,
  AlertTriangle,
  Target,
  BarChart3,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface CreatorAnalyticsDashboardProps {
  creatorId: string;
  courseId?: Id<"courses">;
}

export function CreatorAnalyticsDashboard({ creatorId, courseId }: CreatorAnalyticsDashboardProps) {
  // Get revenue analytics
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore Convex type instantiation too deep
  const revenueData: any[] | undefined = useQuery(api.analytics.getRevenueAnalytics, { creatorId });

  // Get course analytics if courseId provided
  const courseData = useQuery(api.analytics.getCourseAnalytics, courseId ? { courseId } : "skip");

  // Get at-risk students
  const atRiskStudents = useQuery(
    api.analytics.getAtRiskStudents,
    courseId ? { courseId } : "skip"
  );

  // Get completion rate
  const completionRate = useQuery(
    api.analytics.getCourseCompletionRate,
    courseId ? { courseId } : "skip"
  );

  // Get drop-off points
  const dropOffPoints = useQuery(
    api.analytics.getCourseDropOffPoints,
    courseId ? { courseId } : "skip"
  );

  // Calculate totals from revenue data
  const totalRevenue = revenueData?.reduce((sum: number, r: any) => sum + r.netRevenue, 0) || 0;
  const totalTransactions =
    revenueData?.reduce((sum: number, r: any) => sum + r.successfulTransactions, 0) || 0;
  const avgOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  // Calculate course metrics
  const totalViews = courseData?.reduce((sum: number, c: any) => sum + c.views, 0) || 0;
  const totalEnrollments = courseData?.reduce((sum: number, c: any) => sum + c.enrollments, 0) || 0;
  const avgConversionRate =
    courseData && courseData.length > 0
      ? courseData.reduce((sum: number, c: any) => sum + c.conversionRate, 0) / courseData.length
      : 0;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{totalTransactions} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEnrollments}</div>
            <p className="text-xs text-muted-foreground">{totalViews} total views</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${avgOrderValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgConversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Views to enrollments</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Completion Rate */}
          {completionRate && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Course Completion</CardTitle>
                <CardDescription>Track how many students complete your course</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold">{completionRate.completionRate}%</div>
                      <p className="text-sm text-muted-foreground">
                        {completionRate.completedStudents} of {completionRate.totalStudents}{" "}
                        students
                      </p>
                    </div>
                    <Award className="h-12 w-12 text-primary" />
                  </div>
                  <Progress value={completionRate.completionRate} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Drop-off Points */}
          {dropOffPoints && dropOffPoints.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Drop-off Points</CardTitle>
                <CardDescription>Chapters where students are most likely to stop</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dropOffPoints.map((chapter: any, index: number) => (
                    <div
                      key={chapter.chapterId}
                      className="flex items-center justify-between rounded-lg bg-muted p-3"
                    >
                      <div className="flex-1">
                        <div className="font-medium">Chapter {chapter.chapterIndex + 1}</div>
                        <div className="text-sm text-muted-foreground">
                          {chapter.uniqueStudents} students
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={chapter.dropOffRate > 50 ? "destructive" : "secondary"}>
                          {chapter.dropOffRate.toFixed(0)}% drop-off
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          {/* At-Risk Students */}
          {atRiskStudents && atRiskStudents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  At-Risk Students
                </CardTitle>
                <CardDescription>Students who haven't accessed the course recently</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">{atRiskStudents.length}</div>
                  <p className="text-sm text-muted-foreground">students need engagement</p>
                  <Progress
                    value={(atRiskStudents.length / (completionRate?.totalStudents || 1)) * 100}
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Student Engagement */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Student Engagement</CardTitle>
              <CardDescription>Average time and activity metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="mb-1 text-sm text-muted-foreground">Avg Time Spent</div>
                  <div className="text-2xl font-bold">
                    {courseData && courseData.length > 0
                      ? Math.round(courseData[courseData.length - 1].avgTimeSpent)
                      : 0}
                    min
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-sm text-muted-foreground">Active Students</div>
                  <div className="text-2xl font-bold">
                    {courseData && courseData.length > 0
                      ? courseData[courseData.length - 1].activeStudents
                      : 0}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          {revenueData && revenueData.length > 0 && (
            <>
              {/* Revenue Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Revenue Breakdown</CardTitle>
                  <CardDescription>Last 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Gross Revenue</span>
                      <span className="font-bold">
                        ${revenueData[revenueData.length - 1].grossRevenue.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="text-sm">Platform Fee</span>
                      <span>-${revenueData[revenueData.length - 1].platformFee.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="text-sm">Processing Fee</span>
                      <span>
                        -${revenueData[revenueData.length - 1].paymentProcessingFee.toFixed(2)}
                      </span>
                    </div>
                    <div className="h-px bg-border" />
                    <div className="flex items-center justify-between text-lg font-bold">
                      <span>Net Revenue</span>
                      <span className="text-green-600">
                        ${revenueData[revenueData.length - 1].netRevenue.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Customer Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="mb-1 text-sm text-muted-foreground">New Customers</div>
                      <div className="flex items-center gap-2 text-2xl font-bold">
                        {revenueData[revenueData.length - 1].newCustomers}
                        <ArrowUp className="h-4 w-4 text-green-500" />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 text-sm text-muted-foreground">Returning</div>
                      <div className="text-2xl font-bold">
                        {revenueData[revenueData.length - 1].returningCustomers}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          {courseData && courseData.length > 0 && (
            <>
              {/* Chapters Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Content Engagement</CardTitle>
                  <CardDescription>Chapter completion and activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Chapters Started</span>
                      <span className="font-bold">
                        {courseData[courseData.length - 1].chaptersStarted}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Chapters Completed</span>
                      <span className="font-bold text-green-600">
                        {courseData[courseData.length - 1].chaptersCompleted}
                      </span>
                    </div>
                    <Progress
                      value={
                        (courseData[courseData.length - 1].chaptersCompleted /
                          courseData[courseData.length - 1].chaptersStarted) *
                        100
                      }
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Certificates Issued */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Certificates Issued</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Award className="h-12 w-12 text-primary" />
                    <div>
                      <div className="text-3xl font-bold">
                        {courseData[courseData.length - 1].certificatesIssued}
                      </div>
                      <p className="text-sm text-muted-foreground">students earned certificates</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { BookOpen, Loader2 } from "lucide-react";

interface CoursePerformanceChartProps {
  userId: string;
}

interface CoursePerformanceData {
  courseId: string;
  title: string;
  enrollments: number;
  revenue: number;
  completionRate: number;
}

type FormattedCourseData = CoursePerformanceData & { displayTitle: string };

const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444"];

export function CoursePerformanceChart({ userId }: CoursePerformanceChartProps) {
  const courseData = useQuery(api.analytics.getCreatorCoursePerformance, {
    userId,
  });

  if (!courseData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-500" />
            Course Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (courseData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-500" />
            Course Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No courses yet</p>
            <p className="text-sm">Create a course to see performance data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Truncate long titles
  const formattedData = courseData.slice(0, 5).map((course: CoursePerformanceData) => ({
    ...course,
    displayTitle:
      course.title.length > 20
        ? course.title.substring(0, 20) + "..."
        : course.title,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-500" />
          Course Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis
                dataKey="displayTitle"
                type="category"
                tick={{ fontSize: 11 }}
                width={120}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number, name: string) => {
                  if (name === "enrollments") return [value, "Students"];
                  if (name === "completionRate") return [`${value}%`, "Completion"];
                  return [value, name];
                }}
              />
              <Bar dataKey="enrollments" name="enrollments" radius={[0, 4, 4, 0]}>
                {formattedData.map((_: FormattedCourseData, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Course stats table */}
        <div className="mt-4 space-y-2">
          {formattedData.map((course: FormattedCourseData, index: number) => (
            <div
              key={course.courseId}
              className="flex items-center justify-between text-sm py-2 border-b last:border-0"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="font-medium truncate max-w-[150px]">
                  {course.title}
                </span>
              </div>
              <div className="flex items-center gap-4 text-muted-foreground">
                <span>{course.enrollments} students</span>
                <span>{course.completionRate}% completed</span>
                <span className="text-emerald-600 font-medium">
                  ${course.revenue.toFixed(0)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

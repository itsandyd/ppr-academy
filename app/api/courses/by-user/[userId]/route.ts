import { NextRequest, NextResponse } from "next/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    const allCourses = await fetchQuery(api.courses.getCoursesByUser, { userId });

    // Only return published courses for public storefront
    const courses = allCourses?.filter((course: any) => course.isPublished === true) || [];

    return NextResponse.json({ courses });

  } catch (error) {
    console.error("Failed to fetch courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}

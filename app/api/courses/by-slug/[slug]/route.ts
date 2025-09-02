import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const course = await prisma.course.findUnique({
      where: { slug },
      include: {
        modules: {
          include: {
            lessons: {
              include: {
                chapters: {
                  orderBy: { position: 'asc' }
                }
              },
              orderBy: { position: 'asc' }
            }
          },
          orderBy: { position: 'asc' }
        },
        instructor: true,
        category: true
      }
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Only return published courses for public access
    if (!course.isPublished) {
      return NextResponse.json({ error: "Course not available" }, { status: 404 });
    }

    return NextResponse.json({ course });

  } catch (error) {
    console.error("Failed to fetch course:", error);
    return NextResponse.json(
      { error: "Failed to fetch course" },
      { status: 500 }
    );
  }
}

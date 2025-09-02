import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    const courses = await prisma.course.findMany({
      where: { 
        userId,
        isPublished: true // Only return published courses for public storefront
      },
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
        category: true,
        _count: {
          select: {
            enrollments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ courses });

  } catch (error) {
    console.error("Failed to fetch courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}

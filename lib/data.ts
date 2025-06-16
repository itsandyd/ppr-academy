import { prisma } from "@/lib/prisma";
import { CourseWithDetails, EnrollmentWithCourse } from "@/lib/types";
import { auth } from "@clerk/nextjs/server";

// Helper function to get or create user from Clerk
export async function getUserFromClerk(clerkId: string) {
  try {
    let user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      // If user doesn't exist, create it using Clerk data
      // This is a fallback for when webhooks aren't working
      try {
        const { clerkClient } = await import('@clerk/nextjs/server');
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(clerkId);
        
        const email = clerkUser.primaryEmailAddress?.emailAddress || `${clerkId}@unknown.com`;
        
        // Use upsert to handle potential race conditions and duplicate emails
        user = await prisma.user.upsert({
          where: { clerkId },
          update: {
            email,
            firstName: clerkUser.firstName,
            lastName: clerkUser.lastName,
            imageUrl: clerkUser.imageUrl,
          },
          create: {
            clerkId,
            email,
            firstName: clerkUser.firstName,
            lastName: clerkUser.lastName,
            imageUrl: clerkUser.imageUrl,
          },
        });
        
        console.log(`✅ Created/updated user from Clerk data: ${user.email}`);
      } catch (createError) {
        console.error("Error creating user from Clerk data:", createError);
        
        // If it's still a unique constraint error, try to find an existing user by email
        if (createError instanceof Error && createError.message.includes('Unique constraint')) {
          try {
            const { clerkClient } = await import('@clerk/nextjs/server');
            const client = await clerkClient();
            const clerkUser = await client.users.getUser(clerkId);
            const email = clerkUser.primaryEmailAddress?.emailAddress;
            
            if (email) {
              // Try to find user by email and update their clerkId
              const existingUser = await prisma.user.findUnique({
                where: { email }
              });
              
              if (existingUser && !existingUser.clerkId) {
                user = await prisma.user.update({
                  where: { id: existingUser.id },
                  data: { clerkId }
                });
                console.log(`✅ Updated existing user with clerkId: ${user.email}`);
                return user;
              }
            }
          } catch (findError) {
            console.error("Error finding existing user:", findError);
          }
        }
        
        return null;
      }
    }

    return user;
  } catch (error) {
    console.error("Error getting user from Clerk:", error);
    return null;
  }
}

export async function getFeaturedCourses(): Promise<CourseWithDetails[]> {
  try {
    // Since there's no 'featured' field, let's get the most recent published courses
    const courses = await prisma.course.findMany({
      where: {
        isPublished: true,
      },
      include: {
        instructor: true,
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      take: 6,
      orderBy: { createdAt: 'desc' }
    });
    return courses;
  } catch (error) {
    console.error("Error fetching featured courses:", error);
    return [];
  }
}

export async function getPopularCourses(): Promise<CourseWithDetails[]> {
  try {
    const courses = await prisma.course.findMany({
      include: {
        instructor: true,
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: {
        enrollments: {
          _count: "desc",
        },
      },
      take: 10,
    });
    return courses;
  } catch (error) {
    console.error("Error fetching popular courses:", error);
    return [];
  }
}

export async function getUserEnrollments(userId: string): Promise<EnrollmentWithCourse[]> {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId,
      },
      include: {
        course: {
          include: {
            instructor: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
    return enrollments;
  } catch (error) {
    console.error("Error fetching user enrollments:", error);
    return [];
  }
}

export async function getUserCourses(userId: string): Promise<CourseWithDetails[]> {
  try {
    const courses = await prisma.course.findMany({
      where: {
        instructorId: userId,
      },
      include: {
        instructor: true,
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return courses;
  } catch (error) {
    console.error("Error fetching user courses:", error);
    return [];
  }
}

// New function to get current user's enrollments using Clerk auth
export async function getCurrentUserEnrollments(): Promise<EnrollmentWithCourse[]> {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return [];

    const user = await getUserFromClerk(clerkId);
    if (!user) return [];

    return getUserEnrollments(user.id);
  } catch (error) {
    console.error("Error fetching current user enrollments:", error);
    return [];
  }
}

// New function to get current user's courses using Clerk auth
export async function getCurrentUserCourses(): Promise<CourseWithDetails[]> {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return [];

    const user = await getUserFromClerk(clerkId);
    if (!user) return [];

    return getUserCourses(user.id);
  } catch (error) {
    console.error("Error fetching current user courses:", error);
    return [];
  }
}

export async function getCourses(filters?: {
  search?: string;
  category?: string;
  skillLevel?: string;
  includeUnpublished?: boolean;
}) {
  try {
    const where: any = {};

    // Only filter by published status if not including unpublished courses
    if (!filters?.includeUnpublished) {
      where.isPublished = true;
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { description: { contains: filters.search } },
        { instructor: { 
          OR: [
            { firstName: { contains: filters.search } },
            { lastName: { contains: filters.search } },
          ]
        }}
      ];
    }

    // Since category and skillLevel don't exist in the schema, 
    // we'll need to handle this differently or update the schema
    // For now, we'll just ignore these filters

    const courses = await prisma.course.findMany({
      where,
      include: {
        instructor: true,
        _count: {
          select: { enrollments: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📚 Fetched ${courses.length} courses (includeUnpublished: ${filters?.includeUnpublished})`);
    return courses;
  } catch (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
} 
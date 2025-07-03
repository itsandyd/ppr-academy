import { prisma } from "@/lib/prisma";
import { CourseWithDetails, EnrollmentWithCourse } from "@/lib/types";
import { auth } from "@clerk/nextjs/server";

// Helper function to get or create user from Clerk
export async function getUserFromClerk(clerkId: string) {
  console.log(`🔍 Looking up user with clerkId: ${clerkId}`);
  
  try {
    // First, try to find the user in our database
    let user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (user) {
      console.log(`✅ Found existing user in database: ${user.email}`);
      return user;
    }

    console.log(`⚠️ User not found in database, fetching from Clerk...`);

    // If user doesn't exist, fetch from Clerk and create in database
    try {
      const { clerkClient } = await import('@clerk/nextjs/server');
      const client = await clerkClient();
      
      console.log(`📡 Fetching user data from Clerk...`);
      const clerkUser = await client.users.getUser(clerkId);
      
      if (!clerkUser) {
        console.error(`❌ User not found in Clerk: ${clerkId}`);
        return null;
      }

      console.log(`📋 Clerk user data:`, {
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        hasImage: !!clerkUser.imageUrl
      });
      
      const email = clerkUser.primaryEmailAddress?.emailAddress;
      
      if (!email) {
        console.error(`❌ No email found for Clerk user: ${clerkId}`);
        return null;
      }

      // Create user in database
      console.log(`🔨 Creating user in database...`);
      user = await prisma.user.create({
        data: {
          clerkId,
          email,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          imageUrl: clerkUser.imageUrl,
        },
      });
      
      console.log(`✅ Successfully created user: ${user.email} (ID: ${user.id})`);
      return user;

    } catch (createError: any) {
      console.error("💥 Error creating user from Clerk data:", createError);
      
      // If it's a unique constraint error, the user might already exist by email
      if (createError?.code === 'P2002' || createError?.message?.includes('Unique constraint')) {
        console.log(`🔄 Unique constraint error, checking for existing user by email...`);
        
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
            
            if (existingUser) {
              if (!existingUser.clerkId) {
                // Update existing user with clerkId
                user = await prisma.user.update({
                  where: { id: existingUser.id },
                  data: { 
                    clerkId,
                    firstName: clerkUser.firstName,
                    lastName: clerkUser.lastName,
                    imageUrl: clerkUser.imageUrl,
                  }
                });
                console.log(`✅ Updated existing user with clerkId: ${user.email}`);
                return user;
              } else if (existingUser.clerkId === clerkId) {
                // User already exists with this clerkId
                console.log(`✅ Found existing user by email: ${existingUser.email}`);
                return existingUser;
              } else {
                // User exists but with different clerkId - update to new clerkId
                console.log(`🔄 User exists with different clerkId. Email: ${email}, Existing clerkId: ${existingUser.clerkId}, New clerkId: ${clerkId}`);
                console.log(`🔨 Updating user's clerkId to new value...`);
                
                user = await prisma.user.update({
                  where: { id: existingUser.id },
                  data: { 
                    clerkId,
                    firstName: clerkUser.firstName,
                    lastName: clerkUser.lastName,
                    imageUrl: clerkUser.imageUrl,
                  }
                });
                console.log(`✅ Successfully updated user's clerkId: ${user.email}`);
                return user;
              }
            }
          }
        } catch (findError) {
          console.error("💥 Error finding existing user by email:", findError);
        }
      }
      
      // For any other error, return null
      return null;
    }

  } catch (error) {
    console.error("💥 Unexpected error in getUserFromClerk:", error);
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
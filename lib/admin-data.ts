import { prisma } from "@/lib/prisma";

export async function getAdminStats() {
  try {
    const [totalUsers, totalCourses, totalReviews, pendingApprovals] = await Promise.all([
      prisma.user.count(),
      prisma.course.count(),
      // Reviews don't exist in the schema, so we'll return 0
      Promise.resolve(0),
      prisma.course.count({ where: { isPublished: false } }),
    ]);

    // Calculate monthly stats
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [newUsersThisMonth, newCoursesThisMonth] = await Promise.all([
      prisma.user.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      prisma.course.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
    ]);

    return {
      totalUsers,
      totalCourses,
      totalReviews,
      pendingApprovals,
      newUsersThisMonth,
      newCoursesThisMonth,
      activeSessionsToday: 0, // Would need session tracking
      revenueThisMonth: 0, // Would need payment tracking
    };
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return {
      totalUsers: 0,
      totalCourses: 0,
      totalReviews: 0,
      pendingApprovals: 0,
      newUsersThisMonth: 0,
      newCoursesThisMonth: 0,
      activeSessionsToday: 0,
      revenueThisMonth: 0,
    };
  }
}

export async function getAllUsers() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        imageUrl: true,
        role: true,
        admin: true,
        createdAt: true,
        _count: {
          select: {
            courses: true,
          },
        },
      },
    });

    return users.map(user => ({
      ...user,
      isCoach: user._count.courses > 0,
    }));
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

export async function getPendingCourses() {
  try {
    const courses = await prisma.course.findMany({
      where: { isPublished: false },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: { enrollments: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return courses;
  } catch (error) {
    console.error("Error fetching pending courses:", error);
    return [];
  }
}

export async function getAllCourses() {
  try {
    const courses = await prisma.course.findMany({
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: { enrollments: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`📚 Admin dashboard: Found ${courses.length} total courses`);
    return courses;
  } catch (error) {
    console.error("Error fetching all courses:", error);
    return [];
  }
}

export async function getRecentReviews() {
  // Reviews don't exist in the current schema
  // Return empty array for now
  return [];
}

export async function getCoachApplications() {
  try {
    // Find inactive coach profiles (pending approval)
    const coachProfiles = await prisma.coachProfile.findMany({
      where: {
        isActive: false, // Pending approval
      },
      select: {
        id: true,
        userId: true,
        title: true,
        description: true,
        category: true,
        basePrice: true,
        location: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Get user data for each coach profile
    const userIds = coachProfiles.map(profile => profile.userId);
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: userIds
        }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        imageUrl: true,
      }
    });

    // Combine coach profile data with user data
    const coachApplications = coachProfiles.map(profile => {
      const user = users.find(u => u.id === profile.userId);
      return {
        id: profile.id, // Use profile ID for approval
        userId: profile.userId,
        email: user?.email || '',
        firstName: user?.firstName || 'Unknown',
        lastName: user?.lastName || 'Coach',
        imageUrl: user?.imageUrl || '',
        title: profile.title,
        description: profile.description,
        category: profile.category,
        basePrice: profile.basePrice,
        location: profile.location,
        createdAt: profile.createdAt,
      };
    });

    console.log(`👥 Found ${coachApplications.length} pending coach applications`);
    return coachApplications;
  } catch (error) {
    console.error("Error fetching coach applications:", error);
    return [];
  }
}

export async function getCourseDetails(courseId: string) {
  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: true,
        enrollments: {
          include: {
            user: true,
          },
        },
      },
    });

    // Since the schema doesn't have modules/lessons/chapters structure
    // We'll return a simplified version
    return {
      ...course,
      modules: [], // Would need to extend schema for full course structure
    };
  } catch (error) {
    console.error("Error fetching course details:", error);
    return null;
  }
} 
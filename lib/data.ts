/**
 * @deprecated This file is deprecated - use /lib/convex-data.ts instead
 *
 * This file now redirects all calls to Convex-based functions.
 * Prisma has been completely removed from this project.
 */

import { auth } from "@clerk/nextjs/server";
import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";

/**
 * Get or create user from Clerk ID
 * @deprecated Use convex/users.ts getUserFromClerk query directly
 */
export async function getUserFromClerk(clerkId: string) {
  try {
    const user = await fetchQuery(api.users.getUserFromClerk, { clerkId });

    if (user) {
      // Transform Convex user to match expected Prisma format
      // (for backward compatibility with existing code)
      return {
        ...user,
        id: user._id, // Add `id` field that maps to `_id`
        createdAt: new Date(user._creationTime),
        updatedAt: new Date(user._creationTime),
      };
    }

    return user;
  } catch (error) {
    console.error("Error fetching user from Convex:", error);
    return null;
  }
}

/**
 * Get featured courses (most recent published courses)
 * @deprecated Use convex/courses.ts queries directly
 */
export async function getFeaturedCourses() {
  try {
    // console.log(...);
    const courses = await fetchQuery(api.courses.getCourses, {});

    // Return first 6 courses as "featured"
    return courses?.slice(0, 6) || [];
  } catch (error) {
    console.error("Error fetching featured courses:", error);
    return [];
  }
}

/**
 * Get popular courses
 * @deprecated Use convex/courses.ts queries directly
 */
export async function getPopularCourses() {
  try {
    // console.log(...);
    const courses = await fetchQuery(api.courses.getCourses, {});

    // Return first 10 courses as "popular" (can be enhanced with enrollment stats later)
    return courses?.slice(0, 10) || [];
  } catch (error) {
    console.error("Error fetching popular courses:", error);
    return [];
  }
}

/**
 * Get user enrollments
 * @deprecated Use convex/library.ts queries directly
 */
export async function getUserEnrollments(userId: string) {
  try {
    const enrollments = await fetchQuery(api.library.getUserCourses, { userId });
    return enrollments || [];
  } catch (error) {
    console.error("Error fetching user enrollments:", error);
    return [];
  }
}

/**
 * Get user courses (courses created by user)
 * @deprecated Use convex/courses.ts getCoursesByUser query directly
 */
export async function getUserCourses(userId: string) {
  try {
    const courses = await fetchQuery(api.courses.getCoursesByUser, { userId });
    return courses || [];
  } catch (error) {
    console.error("Error fetching user courses:", error);
    return [];
  }
}

/**
 * @deprecated - kept for backward compatibility
 */
export async function getUserCoursesLegacy(userId: string) {
  return getUserCourses(userId);
}

/**
 * Get current user's enrollments using Clerk auth
 * @deprecated Use Convex queries directly in client components
 */
export async function getCurrentUserEnrollments() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return [];

    const user = await getUserFromClerk(clerkId);
    if (!user) return [];

    return getUserEnrollments(user._id);
  } catch (error) {
    console.error("Error fetching current user enrollments:", error);
    return [];
  }
}

/**
 * Get current user's courses using Clerk auth
 * @deprecated Use Convex queries directly in client components
 */
export async function getCurrentUserCourses() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return [];

    const user = await getUserFromClerk(clerkId);
    if (!user) return [];

    return getUserCourses(user._id);
  } catch (error) {
    console.error("Error fetching current user courses:", error);
    return [];
  }
}

/**
 * Get courses with optional filters
 * @deprecated Use convex/courses.ts getCourses query directly
 */
export async function getCourses(filters?: {
  search?: string;
  category?: string;
  skillLevel?: string;
  includeUnpublished?: boolean;
}) {
  try {
    // console.log(...);

    // For now, just fetch all courses
    // You can add filtering logic in the Convex query later
    const courses = await fetchQuery(api.courses.getCourses, {});

    // Client-side filtering if needed
    let filteredCourses = courses || [];

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredCourses = filteredCourses.filter(
        (course: { title: string; description?: string }) =>
          course.title.toLowerCase().includes(searchLower) ||
          course.description?.toLowerCase().includes(searchLower)
      );
    }

    return filteredCourses;
  } catch (error) {
    console.error("Error fetching courses:", error);
    return [];
  }
}

/**
 * Get course by slug
 * @deprecated Use convex/courses.ts getCourseBySlug query directly
 */
export async function getCourseBySlug(slug: string) {
  try {
    const course = await fetchQuery(api.courses.getCourseBySlug, { slug });
    return course;
  } catch (error) {
    console.error(`Error fetching course by slug (${slug}):`, error);
    return null;
  }
}

/**
 * Re-export functions from convex-data for convenience
 */
export {
  getAuthenticatedUser,
  getCourseWithDetails,
  getUserCourseProgress,
  isUserEnrolledInCourse,
  getPublishedCourses,
  getCoursesByUser,
  getInstructorCourses,
  getCoursesByStore,
  verifyCourseAccess,
  handleDataError,
} from "@/lib/convex-data";

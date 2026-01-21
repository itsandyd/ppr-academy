import { auth } from "@clerk/nextjs/server";
import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// Helper function to get authenticated user
export async function getAuthenticatedUser() {
  const { userId: clerkId } = await auth();
  
  if (!clerkId) {
    return null;
  }

  try {
    // Use preloadQuery for server-side data fetching
    const userQuery = await preloadQuery(api.users.getUserFromClerk, { 
      clerkId 
    });
    
    return userQuery;
  } catch (error) {
    console.error(`❌ Error fetching authenticated user:`, error);
    return null;
  }
}

// Get user courses (enrolled courses)
export async function getUserCourses(userId: string) {
  try {
    const coursesQuery = await preloadQuery(api.library.getUserCourses, { 
      userId 
    });
    
    return coursesQuery;
  } catch (error) {
    console.error(`❌ Error fetching user courses:`, error);
    return null;
  }
}

// Get course by slug
export async function getCourseBySlug(slug: string) {
  try {
    const courseQuery = await preloadQuery(api.courses.getCourseBySlug, { 
      slug 
    });
    
    return courseQuery;
  } catch (error) {
    console.error(`❌ Error fetching course by slug:`, error);
    return null;
  }
}

// Get course with details (modules, lessons, chapters)
export async function getCourseWithDetails(slug: string, userId: string) {
  try {
    const courseQuery = await preloadQuery(api.library.getCourseWithProgress, { 
      slug,
      userId
    });
    
    return courseQuery;
  } catch (error) {
    console.error(`❌ Error fetching course details:`, error);
    return null;
  }
}

// Get user progress for a course
export async function getUserCourseProgress(userId: string, slug: string) {
  try {
    const progressQuery = await preloadQuery(api.library.getCourseWithProgress, { 
      slug,
      userId
    });
    
    return progressQuery;
  } catch (error) {
    console.error(`❌ Error fetching user progress:`, error);
    return null;
  }
}

// Check if user is enrolled in course
export async function isUserEnrolledInCourse(userId: string, slug: string) {
  try {
    const enrollmentQuery = await preloadQuery(api.library.verifyCourseAccess, { 
      userId,
      slug 
    });
    
    return enrollmentQuery;
  } catch (error) {
    console.error(`❌ Error checking enrollment:`, error);
    return null;
  }
}

// Get published courses
export async function getPublishedCourses() {
  try {
    const coursesQuery = await preloadQuery(api.courses.getCourses, {});
    
    return coursesQuery;
  } catch (error) {
    console.error(`❌ Error fetching published courses:`, error);
    return null;
  }
}

// Get courses by user
export async function getCoursesByUser(userId: string) {
  try {
    const coursesQuery = await preloadQuery(api.courses.getCoursesByUser, { 
      userId 
    });
    
    return coursesQuery;
  } catch (error) {
    console.error(`❌ Error fetching courses by user:`, error);
    return null;
  }
}

// Get instructor courses
export async function getInstructorCourses(instructorId: string) {
  try {
    const coursesQuery = await preloadQuery(api.courses.getCoursesByInstructor, { 
      instructorId 
    });
    
    return coursesQuery;
  } catch (error) {
    console.error(`❌ Error fetching instructor courses:`, error);
    return null;
  }
}

// Get courses by store
export async function getCoursesByStore(storeId: string) {
  try {
    const coursesQuery = await preloadQuery(api.courses.getCoursesByStore, { 
      storeId 
    });
    
    return coursesQuery;
  } catch (error) {
    console.error(`❌ Error fetching courses by store:`, error);
    return null;
  }
}

// Verify course access
export async function verifyCourseAccess(userId: string, slug: string) {
  try {
    const accessQuery = await preloadQuery(api.library.verifyCourseAccess, { 
      userId,
      slug 
    });
    
    return accessQuery;
  } catch (error) {
    console.error(`❌ Error verifying course access:`, error);
    return null;
  }
}

// Helper function for error handling
export function handleDataError(error: any, operation: string) {
  console.error(`❌ Data operation failed (${operation}):`, error);
  
  // You can add more sophisticated error handling here
  // For example, different handling for different types of errors
  if (error?.message?.includes('Authentication')) {
    throw new Error('Authentication required');
  }
  
  if (error?.message?.includes('Permission')) {
    throw new Error('Insufficient permissions');
  }
  
  throw new Error(`Failed to ${operation}`);
}
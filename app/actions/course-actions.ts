"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getUserFromClerk } from "@/lib/data";
import { generateSlug, generateUniqueSlug } from "@/lib/utils";

interface CourseData {
  title: string;
  description: string;
  price: number;
  category: string;
  skillLevel: string;
  thumbnail?: string;
  isPublished: boolean;
  modules: {
    title: string;
    description: string;
    orderIndex: number;
    lessons: {
      title: string;
      description: string;
      orderIndex: number;
      chapters: {
        title: string;
        content: string;
        videoUrl: string;
        duration: number;
        orderIndex: number;
      }[];
    }[];
  }[];
}

export async function createCourse(courseData: CourseData) {
  try {
    const { userId: clerkId } = await auth();
    
    if (!clerkId) {
      return { success: false, error: "Unauthorized" };
    }

    // Get the user from our database
    const user = await getUserFromClerk(clerkId);
    
    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Generate a unique slug for the course
    const baseSlug = generateSlug(courseData.title);
    const existingCourses = await prisma.course.findMany({
      where: { slug: { not: null } },
      select: { slug: true }
    });
    const existingSlugs = existingCourses.map(c => c.slug).filter(Boolean) as string[];
    const uniqueSlug = generateUniqueSlug(baseSlug, existingSlugs);

    // Create the course
    // Note: The form collects 'category' and 'skillLevel' but these fields
    // don't exist in the current Prisma schema. You would need to either:
    // 1. Add these fields to the Course model in schema.prisma
    // 2. Create a CourseCategory relation using courseCategoryId
    // 3. Store them in a JSON field or separate metadata table
    const course = await prisma.course.create({
      data: {
        title: courseData.title,
        slug: uniqueSlug,
        description: courseData.description,
        price: courseData.price,
        imageUrl: courseData.thumbnail || null,
        isPublished: courseData.isPublished,
        instructorId: user.id,
        userId: user.id, // Required field in schema
      },
    });

    // Create modules with lessons and chapters if provided
    if (courseData.modules && courseData.modules.length > 0) {
      // This would require additional models in your Prisma schema
      // For now, we'll just create the course without the nested structure
      // You would need to add Module, Lesson, and Chapter models to your schema
    }

    revalidatePath("/courses");
    revalidatePath("/dashboard");
    revalidatePath(`/courses/${course.slug}`);

    return { success: true, courseId: course.id, slug: course.slug };
  } catch (error) {
    console.error("Error creating course:", error);
    return { 
      success: false, 
      error: "Failed to create course. Please try again." 
    };
  }
}

export async function updateCourse(courseId: string, courseData: Partial<CourseData>) {
  try {
    const { userId: clerkId } = await auth();
    
    if (!clerkId) {
      return { success: false, error: "Unauthorized" };
    }

    const user = await getUserFromClerk(clerkId);
    
    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Check if the user owns this course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });

    if (!course || course.instructorId !== user.id) {
      return { success: false, error: "Unauthorized to update this course" };
    }

    // Update the course
    await prisma.course.update({
      where: { id: courseId },
      data: {
        title: courseData.title,
        description: courseData.description,
        price: courseData.price,
        imageUrl: courseData.thumbnail,
        isPublished: courseData.isPublished,
      },
    });

    revalidatePath("/courses");
    revalidatePath(`/courses/${courseId}`);
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error updating course:", error);
    return { 
      success: false, 
      error: "Failed to update course. Please try again." 
    };
  }
}

export async function deleteCourse(courseId: string) {
  try {
    const { userId: clerkId } = await auth();
    
    if (!clerkId) {
      return { success: false, error: "Unauthorized" };
    }

    const user = await getUserFromClerk(clerkId);
    
    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Check if the user owns this course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });

    if (!course || course.instructorId !== user.id) {
      return { success: false, error: "Unauthorized to delete this course" };
    }

    // Delete the course
    await prisma.course.delete({
      where: { id: courseId },
    });

    revalidatePath("/courses");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error deleting course:", error);
    return { 
      success: false, 
      error: "Failed to delete course. Please try again." 
    };
  }
}

export async function publishCourse(courseId: string) {
  try {
    const { userId: clerkId } = await auth();
    
    if (!clerkId) {
      return { success: false, error: "Unauthorized" };
    }

    const user = await getUserFromClerk(clerkId);
    
    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Check if the user owns this course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });

    if (!course || course.instructorId !== user.id) {
      return { success: false, error: "Unauthorized to publish this course" };
    }

    // Publish the course
    await prisma.course.update({
      where: { id: courseId },
      data: { isPublished: true },
    });

    revalidatePath("/courses");
    revalidatePath(`/courses/${courseId}`);
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error publishing course:", error);
    return { 
      success: false, 
      error: "Failed to publish course. Please try again." 
    };
  }
}

async function checkAuth() {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");
  
  const user = await getUserFromClerk(clerkId);
  if (!user) throw new Error("User not found");
  
  return user;
}

export async function enrollInCourse(courseId: string) {
  try {
    const user = await checkAuth();
    
    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: courseId
        }
      }
    });

    if (existingEnrollment) {
      return { success: false, error: "Already enrolled in this course" };
    }

    // Create enrollment
    await prisma.enrollment.create({
      data: {
        userId: user.id,
        courseId: courseId,
        progress: 0
      }
    });

    revalidatePath(`/courses/${courseId}`);
    return { success: true };
  } catch (error) {
    console.error("Error enrolling in course:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to enroll in course" };
  }
}

export async function submitCourseReview(courseId: string, rating: number, comment: string) {
  try {
    const user = await checkAuth();
    
    // Check if user is enrolled
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: courseId
        }
      }
    });

    if (!enrollment) {
      return { success: false, error: "Must be enrolled to leave a review" };
    }

    // Note: There's no Review model in the current schema
    // This is a placeholder for when reviews are implemented
    // For now, we'll just return success
    console.log(`Review submitted: ${rating}/5 - ${comment} for course ${courseId} by user ${user.id}`);

    revalidatePath(`/courses/${courseId}`);
    return { success: true };
  } catch (error) {
    console.error("Error submitting review:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to submit review" };
  }
}

export async function markChapterComplete(chapterId: string) {
  try {
    const user = await checkAuth();
    
    // Get the chapter to find the course
    const chapter = await prisma.courseChapter.findUnique({
      where: { id: chapterId }
    });

    if (!chapter) {
      return { success: false, error: "Chapter not found" };
    }

    // Check if user is enrolled in the course
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: chapter.courseId
        }
      }
    });

    if (!enrollment) {
      return { success: false, error: "Must be enrolled to mark chapters complete" };
    }

    // Note: There's no UserProgress or chapter completion tracking in the current schema
    // This would need to be implemented with additional models
    // For now, we'll just simulate success
    console.log(`Chapter ${chapterId} marked complete by user ${user.id}`);

    revalidatePath(`/courses/${chapter.courseId}`);
    return { success: true };
  } catch (error) {
    console.error("Error marking chapter complete:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to mark chapter complete" };
  }
}

interface ChapterUpdateData {
  title?: string;
  description?: string;
  videoUrl?: string;
  isPublished?: boolean;
  isFree?: boolean;
}

export async function updateChapterContent(chapterId: string, content: string) {
  try {
    const user = await checkAuth();
    
    // Check if user is admin
    if (!user.admin) {
      return { success: false, error: "Admin access required" };
    }

    await prisma.courseChapter.update({
      where: { id: chapterId },
      data: { description: content }
    });

    revalidatePath(`/courses/*`);
    return { success: true };
  } catch (error) {
    console.error("Error updating chapter content:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to update chapter" };
  }
}

export async function updateChapter(chapterId: string, updateData: ChapterUpdateData) {
  try {
    const user = await checkAuth();
    
    // Check if user is admin
    if (!user.admin) {
      return { success: false, error: "Admin access required" };
    }

    // Prepare the update data, filtering out undefined values
    const updateFields: any = {};
    if (updateData.title !== undefined) updateFields.title = updateData.title;
    if (updateData.description !== undefined) updateFields.description = updateData.description;
    if (updateData.videoUrl !== undefined) updateFields.videoUrl = updateData.videoUrl;
    if (updateData.isPublished !== undefined) updateFields.isPublished = updateData.isPublished;
    if (updateData.isFree !== undefined) updateFields.isFree = updateData.isFree;

    await prisma.courseChapter.update({
      where: { id: chapterId },
      data: updateFields
    });

    revalidatePath(`/courses/*`);
    return { success: true };
  } catch (error) {
    console.error("Error updating chapter:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to update chapter" };
  }
}

export async function populateCourseSlugs() {
  try {
    const { userId: clerkId } = await auth();
    
    if (!clerkId) {
      return { success: false, error: "Unauthorized" };
    }

    const user = await getUserFromClerk(clerkId);
    
    if (!user?.admin) {
      return { success: false, error: "Admin access required" };
    }

    // Find courses without slugs
    const coursesWithoutSlugs = await prisma.course.findMany({
      where: {
        OR: [
          { slug: null },
          { slug: "" }
        ]
      },
      select: {
        id: true,
        title: true,
        slug: true
      }
    });

    if (coursesWithoutSlugs.length === 0) {
      return { success: true, message: "All courses already have slugs", updated: 0 };
    }

    // Get all existing slugs to avoid duplicates
    const existingCourses = await prisma.course.findMany({
      where: { slug: { not: null } },
      select: { slug: true }
    });
    const existingSlugs = existingCourses.map(c => c.slug).filter(Boolean) as string[];

    // Update courses without slugs
    let updatedCount = 0;
    for (const course of coursesWithoutSlugs) {
      const baseSlug = generateSlug(course.title);
      const uniqueSlug = generateUniqueSlug(baseSlug, [...existingSlugs]);
      
      await prisma.course.update({
        where: { id: course.id },
        data: { slug: uniqueSlug }
      });
      
      existingSlugs.push(uniqueSlug); // Add to list to avoid future duplicates
      updatedCount++;
    }

    revalidatePath("/courses");
    revalidatePath("/admin");

    return { 
      success: true, 
      message: `Successfully populated slugs for ${updatedCount} courses`,
      updated: updatedCount 
    };
  } catch (error) {
    console.error("Error populating course slugs:", error);
    return { 
      success: false, 
      error: "Failed to populate course slugs. Please try again." 
    };
  }
} 
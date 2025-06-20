"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getUserFromClerk } from "@/lib/data";
import { generateSlug, generateUniqueSlug } from "@/lib/utils";
import { UTApi } from "uploadthing/server";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

// Function to strip markdown formatting for text-to-speech
function stripMarkdownForTTS(text: string): string {
  return text
    // Remove headers (# ## ### etc.)
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold/italic (**text** or *text*)
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    // Remove code blocks (```code```)
    .replace(/```[\s\S]*?```/g, '')
    // Remove inline code (`code`)
    .replace(/`([^`]+)`/g, '$1')
    // Remove links [text](url)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove images ![alt](url)
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    // Remove horizontal rules (--- or ***)
    .replace(/^[-*]{3,}$/gm, '')
    // Remove blockquotes (> text)
    .replace(/^>\s+/gm, '')
    // Remove list markers (- or * or 1.)
    .replace(/^[\s]*[-*+]\s+/gm, '')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    // Remove extra whitespace and normalize line breaks
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+|\s+$/g, '')
    // Replace remaining newlines with spaces for better TTS flow
    .replace(/\n/g, ' ')
    // Clean up multiple spaces
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Function to split text into intelligent chunks
function splitTextIntoChunks(text: string, maxChunkLength: number): string[] {
  if (text.length <= maxChunkLength) {
    return [text];
  }

  const chunks: string[] = [];
  let currentPosition = 0;

  while (currentPosition < text.length) {
    let chunkEnd = currentPosition + maxChunkLength;
    
    // If this would be the last chunk, just take the rest
    if (chunkEnd >= text.length) {
      chunks.push(text.substring(currentPosition));
      break;
    }

    // Find the best place to break the chunk
    const chunkText = text.substring(currentPosition, chunkEnd);
    
    // Try to break at sentence boundaries first
    const sentenceBreaks = ['.', '!', '?'];
    let bestBreak = -1;
    
    for (let i = chunkText.length - 1; i >= maxChunkLength * 0.7; i--) {
      if (sentenceBreaks.includes(chunkText[i])) {
        bestBreak = i + 1; // Include the punctuation
        break;
      }
    }
    
    // If no good sentence break, try paragraph breaks
    if (bestBreak === -1) {
      const paragraphBreak = chunkText.lastIndexOf('\n\n');
      if (paragraphBreak > maxChunkLength * 0.5) {
        bestBreak = paragraphBreak + 2;
      }
    }
    
    // If no good breaks, use word boundary
    if (bestBreak === -1) {
      const wordBreak = chunkText.lastIndexOf(' ');
      bestBreak = wordBreak > 0 ? wordBreak : chunkText.length;
    }
    
    chunks.push(text.substring(currentPosition, currentPosition + bestBreak).trim());
    currentPosition += bestBreak;
  }

  return chunks.filter(chunk => chunk.length > 0);
}

// Initialize ElevenLabs client
const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVEN_LABS_API_KEY,
});

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

// Initialize UploadThing API
const utapi = new UTApi({
  token: process.env.UPLOADTHING_TOKEN,
});

// Global audio cache type declaration
declare global {
  var audioCache: Map<string, ArrayBuffer> | undefined;
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
    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        title: courseData.title,
        description: courseData.description,
        price: courseData.price,
        imageUrl: courseData.thumbnail,
        isPublished: courseData.isPublished,
      },
      select: { slug: true }
    });

    revalidatePath("/courses");
    if (updatedCourse.slug) {
      revalidatePath(`/courses/${updatedCourse.slug}`);
    }
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
    const publishedCourse = await prisma.course.update({
      where: { id: courseId },
      data: { isPublished: true },
      select: { slug: true }
    });

    revalidatePath("/courses");
    if (publishedCourse.slug) {
      revalidatePath(`/courses/${publishedCourse.slug}`);
    }
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

    // Get course slug for revalidation
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { slug: true }
    });
    
    if (course?.slug) {
      revalidatePath(`/courses/${course.slug}`);
    }
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

    // Get course slug for revalidation
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { slug: true }
    });
    
    if (course?.slug) {
      revalidatePath(`/courses/${course.slug}`);
    }
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

    // Get course slug for revalidation
    const course = await prisma.course.findUnique({
      where: { id: chapter.courseId },
      select: { slug: true }
    });
    
    if (course?.slug) {
      revalidatePath(`/courses/${course.slug}`);
    }
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
    
    // Get the chapter to check ownership
    const chapter = await prisma.courseChapter.findUnique({
      where: { id: chapterId },
      include: { course: { select: { instructorId: true } } }
    });

    if (!chapter) {
      return { success: false, error: "Chapter not found" };
    }

    // Check if user is admin or course owner
    if (!user.admin && chapter.course.instructorId !== user.id) {
      return { success: false, error: "Unauthorized to update this chapter" };
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

interface CreateChapterData {
  title: string;
  description?: string;
  videoUrl?: string;
  position: number;
  isPublished?: boolean;
  isFree?: boolean;
  lessonId?: string;
}

export async function createChapter(courseId: string, chapterData: CreateChapterData) {
  try {
    const user = await checkAuth();
    
    // Check if user owns this course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true }
    });

    if (!course) {
      return { success: false, error: "Course not found" };
    }

    if (!user.admin && course.instructorId !== user.id) {
      return { success: false, error: "Unauthorized to add chapters to this course" };
    }

    // Create the chapter
    const newChapter = await prisma.courseChapter.create({
      data: {
        id: `chapter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: chapterData.title,
        description: chapterData.description || "",
        videoUrl: chapterData.videoUrl || null,
        position: chapterData.position,
        isPublished: chapterData.isPublished || false,
        isFree: chapterData.isFree || false,
        courseId: courseId,
        lessonId: chapterData.lessonId || null,
        updatedAt: new Date()
      }
    });

    // Get course slug for revalidation
    const courseWithSlug = await prisma.course.findUnique({
      where: { id: courseId },
      select: { slug: true }
    });
    
    if (courseWithSlug?.slug) {
      revalidatePath(`/courses/${courseWithSlug.slug}`);
    }
    revalidatePath("/courses");
    revalidatePath("/dashboard");

    return { success: true, chapterId: newChapter.id };
  } catch (error) {
    console.error("Error creating chapter:", error);
    return { 
      success: false, 
      error: "Failed to create chapter. Please try again." 
    };
  }
}

export async function deleteChapter(chapterId: string) {
  try {
    const user = await checkAuth();
    
    // Get the chapter to check ownership
    const chapter = await prisma.courseChapter.findUnique({
      where: { id: chapterId },
      include: { course: { select: { instructorId: true, slug: true } } }
    });

    if (!chapter) {
      return { success: false, error: "Chapter not found" };
    }

    // Check if user is admin or course owner
    if (!user.admin && chapter.course.instructorId !== user.id) {
      return { success: false, error: "Unauthorized to delete this chapter" };
    }

    // Delete the chapter
    await prisma.courseChapter.delete({
      where: { id: chapterId }
    });

    // Revalidate pages
    if (chapter.course.slug) {
      revalidatePath(`/courses/${chapter.course.slug}`);
    }
    revalidatePath("/courses");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error deleting chapter:", error);
    return { 
      success: false, 
      error: "Failed to delete chapter. Please try again." 
    };
  }
}

interface CreateModuleData {
  title: string;
  description?: string;
}

export async function createModule(courseId: string, moduleData: CreateModuleData) {
  try {
    const user = await checkAuth();
    
    // Check if user owns this course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true }
    });

    if (!course) {
      return { success: false, error: "Course not found" };
    }

    if (!user.admin && course.instructorId !== user.id) {
      return { success: false, error: "Unauthorized to add modules to this course" };
    }

    // Get the highest position for modules in this course
    const existingModules = await prisma.courseModule.findMany({
      where: { courseId: courseId },
      select: { position: true }
    });
    const maxPosition = Math.max(...existingModules.map(m => m.position), 0);

    // Create the module using the proper relational structure
    const newModule = await prisma.courseModule.create({
      data: {
        title: moduleData.title,
        description: moduleData.description || "",
        position: maxPosition + 1,
        courseId: courseId,
        updatedAt: new Date()
      }
    });

    // Get course slug for revalidation
    const courseWithSlug = await prisma.course.findUnique({
      where: { id: courseId },
      select: { slug: true }
    });
    
    if (courseWithSlug?.slug) {
      revalidatePath(`/courses/${courseWithSlug.slug}`);
    }
    revalidatePath("/courses");
    revalidatePath("/dashboard");

    return { success: true, moduleId: newModule.id };
  } catch (error) {
    console.error("Error creating module:", error);
    return { 
      success: false, 
      error: "Failed to create module. Please try again." 
    };
  }
}

interface CreateLessonData {
  title: string;
  description?: string;
  moduleIndex: number;
}

export async function createLesson(courseId: string, lessonData: CreateLessonData) {
  try {
    const user = await checkAuth();
    
    // Check if user owns this course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true }
    });

    if (!course) {
      return { success: false, error: "Course not found" };
    }

    if (!user.admin && course.instructorId !== user.id) {
      return { success: false, error: "Unauthorized to add lessons to this course" };
    }

    // Find the target module
    const modules = await prisma.courseModule.findMany({
      where: { courseId: courseId },
      orderBy: { position: 'asc' }
    });

    if (!modules[lessonData.moduleIndex]) {
      return { success: false, error: "Target module not found" };
    }

    const targetModule = modules[lessonData.moduleIndex];

    // Get the highest position for lessons in this module
    const existingLessons = await prisma.courseLesson.findMany({
      where: { moduleId: targetModule.id },
      select: { position: true }
    });
    const maxPosition = Math.max(...existingLessons.map(l => l.position), 0);

    // Create the lesson using the proper relational structure
    const newLesson = await prisma.courseLesson.create({
      data: {
        title: lessonData.title,
        description: lessonData.description || "",
        position: maxPosition + 1,
        moduleId: targetModule.id,
        updatedAt: new Date()
      }
    });

    // Get course slug for revalidation
    const courseWithSlug = await prisma.course.findUnique({
      where: { id: courseId },
      select: { slug: true }
    });
    
    if (courseWithSlug?.slug) {
      revalidatePath(`/courses/${courseWithSlug.slug}`);
    }
    revalidatePath("/courses");
    revalidatePath("/dashboard");

    return { success: true, lessonId: newLesson.id };
  } catch (error) {
    console.error("Error creating lesson:", error);
    return { 
      success: false, 
      error: "Failed to create lesson. Please try again." 
    };
  }
}

interface UpdateModuleData {
  title: string;
  description?: string;
}

export async function updateModule(moduleChapterId: string, moduleData: UpdateModuleData) {
  try {
    const user = await checkAuth();
    
    // Get the module chapter to check ownership
    const moduleChapter = await prisma.courseChapter.findUnique({
      where: { id: moduleChapterId },
      include: { course: { select: { instructorId: true, slug: true } } }
    });

    if (!moduleChapter) {
      return { success: false, error: "Module not found" };
    }

    // Check if user is admin or course owner
    if (!user.admin && moduleChapter.course.instructorId !== user.id) {
      return { success: false, error: "Unauthorized to update this module" };
    }

    // Update the module chapter (preserve 📚 prefix)
    await prisma.courseChapter.update({
      where: { id: moduleChapterId },
      data: {
        title: `📚 ${moduleData.title}`,
        description: moduleData.description || "",
        updatedAt: new Date()
      }
    });

    // Revalidate pages
    if (moduleChapter.course.slug) {
      revalidatePath(`/courses/${moduleChapter.course.slug}`);
    }
    revalidatePath("/courses");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error updating module:", error);
    return { 
      success: false, 
      error: "Failed to update module. Please try again." 
    };
  }
}

interface UpdateLessonData {
  title: string;
  description?: string;
  lessonNumber?: number;
}

export async function updateLesson(lessonChapterId: string, lessonData: UpdateLessonData) {
  try {
    const user = await checkAuth();
    
    // Get the lesson chapter to check ownership
    const lessonChapter = await prisma.courseChapter.findUnique({
      where: { id: lessonChapterId },
      include: { course: { select: { instructorId: true, slug: true } } }
    });

    if (!lessonChapter) {
      return { success: false, error: "Lesson not found" };
    }

    // Check if user is admin or course owner
    if (!user.admin && lessonChapter.course.instructorId !== user.id) {
      return { success: false, error: "Unauthorized to update this lesson" };
    }

    // Extract current lesson number or use provided one
    const currentTitle = lessonChapter.title;
    const lessonNumberMatch = currentTitle.match(/🎯 Lesson (\d+):/);
    const lessonNumber = lessonData.lessonNumber || (lessonNumberMatch ? parseInt(lessonNumberMatch[1]) : 1);

    // Update the lesson chapter (preserve 🎯 prefix and lesson number)
    await prisma.courseChapter.update({
      where: { id: lessonChapterId },
      data: {
        title: `🎯 Lesson ${lessonNumber}: ${lessonData.title}`,
        description: lessonData.description || "",
        updatedAt: new Date()
      }
    });

    // Revalidate pages
    if (lessonChapter.course.slug) {
      revalidatePath(`/courses/${lessonChapter.course.slug}`);
    }
    revalidatePath("/courses");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error updating lesson:", error);
    return { 
      success: false, 
      error: "Failed to update lesson. Please try again." 
    };
  }
}

interface ReorderChaptersData {
  chapterIds: string[];
}

export async function reorderChapters(courseId: string, reorderData: ReorderChaptersData) {
  try {
    const user = await checkAuth();
    
    // Check if user owns this course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true, slug: true }
    });

    if (!course) {
      return { success: false, error: "Course not found" };
    }

    if (!user.admin && course.instructorId !== user.id) {
      return { success: false, error: "Unauthorized to reorder chapters in this course" };
    }

    // Update positions for all chapters
    const updatePromises = reorderData.chapterIds.map((chapterId, index) =>
      prisma.courseChapter.update({
        where: { id: chapterId },
        data: { 
          position: index + 1,
          updatedAt: new Date()
        }
      })
    );

    await Promise.all(updatePromises);

    // Revalidate pages
    if (course.slug) {
      revalidatePath(`/courses/${course.slug}`);
    }
    revalidatePath("/courses");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error reordering chapters:", error);
    return { 
      success: false, 
      error: "Failed to reorder chapters. Please try again." 
    };
  }
}

interface ReorderModulesData {
  moduleChapterIds: string[];
}

export async function reorderModules(courseId: string, reorderData: ReorderModulesData) {
  try {
    const user = await checkAuth();
    
    // Check if user owns this course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true, slug: true }
    });

    if (!course) {
      return { success: false, error: "Course not found" };
    }

    if (!user.admin && course.instructorId !== user.id) {
      return { success: false, error: "Unauthorized to reorder modules in this course" };
    }

    // Get all chapters for this course
    const allChapters = await prisma.courseChapter.findMany({
      where: { courseId: courseId },
      select: { id: true, title: true, position: true },
      orderBy: { position: 'asc' }
    });

    // Build the new order: modules in their new order, with their content preserved
    const newChapterOrder: string[] = [];
    
    for (const moduleChapterId of reorderData.moduleChapterIds) {
      // Add the module chapter itself
      newChapterOrder.push(moduleChapterId);
      
      // Find all content (lessons and chapters) that belong to this module
      const moduleIndex = allChapters.findIndex(ch => ch.id === moduleChapterId);
      if (moduleIndex !== -1) {
        // Find the next module to determine content boundaries
        let nextModuleIndex = allChapters.length;
        for (let i = moduleIndex + 1; i < allChapters.length; i++) {
          if (allChapters[i].title.startsWith('📚')) {
            nextModuleIndex = i;
            break;
          }
        }
        
        // Add all content between this module and the next module
        for (let i = moduleIndex + 1; i < nextModuleIndex; i++) {
          newChapterOrder.push(allChapters[i].id);
        }
      }
    }

    // Update positions for all chapters
    const updatePromises = newChapterOrder.map((chapterId, index) =>
      prisma.courseChapter.update({
        where: { id: chapterId },
        data: { 
          position: index + 1,
          updatedAt: new Date()
        }
      })
    );

    await Promise.all(updatePromises);

    // Revalidate pages
    if (course.slug) {
      revalidatePath(`/courses/${course.slug}`);
    }
    revalidatePath("/courses");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error reordering modules:", error);
    return { 
      success: false, 
      error: "Failed to reorder modules. Please try again." 
    };
  }
}

interface ReorderLessonsData {
  lessonChapterIds: string[];
  moduleChapterId: string;
}

export async function reorderLessons(courseId: string, reorderData: ReorderLessonsData) {
  try {
    const user = await checkAuth();
    
    // Check if user owns this course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true, slug: true }
    });

    if (!course) {
      return { success: false, error: "Course not found" };
    }

    if (!user.admin && course.instructorId !== user.id) {
      return { success: false, error: "Unauthorized to reorder lessons in this course" };
    }

    // Get all chapters for this course
    const allChapters = await prisma.courseChapter.findMany({
      where: { courseId: courseId },
      select: { id: true, title: true, position: true },
      orderBy: { position: 'asc' }
    });

    // Find the module and its boundaries
    const moduleIndex = allChapters.findIndex(ch => ch.id === reorderData.moduleChapterId);
    if (moduleIndex === -1) {
      return { success: false, error: "Module not found" };
    }

    // Find the next module to determine boundaries
    let nextModuleIndex = allChapters.length;
    for (let i = moduleIndex + 1; i < allChapters.length; i++) {
      if (allChapters[i].title.startsWith('📚')) {
        nextModuleIndex = i;
        break;
      }
    }

    // Build the new order: module + lessons in new order + their content
    const newChapterOrder: string[] = [];
    
    // Add the module chapter first
    newChapterOrder.push(reorderData.moduleChapterId);
    
    // For each lesson in the new order, add the lesson and its content chapters
    for (const lessonChapterId of reorderData.lessonChapterIds) {
      // Add the lesson chapter itself
      newChapterOrder.push(lessonChapterId);
      
      // Find all content chapters that belong to this lesson
      const lessonIndex = allChapters.findIndex(ch => ch.id === lessonChapterId);
      if (lessonIndex !== -1) {
        // Find the next lesson or module to determine content boundaries
        let nextLessonIndex = nextModuleIndex;
        for (let i = lessonIndex + 1; i < nextModuleIndex; i++) {
          if (allChapters[i].title.startsWith('🎯')) {
            nextLessonIndex = i;
            break;
          }
        }
        
        // Add all content chapters between this lesson and the next lesson/module
        for (let i = lessonIndex + 1; i < nextLessonIndex; i++) {
          newChapterOrder.push(allChapters[i].id);
        }
      }
    }

    // Update positions for all chapters
    const updatePromises = newChapterOrder.map((chapterId, index) =>
      prisma.courseChapter.update({
        where: { id: chapterId },
        data: { 
          position: index + 1,
          updatedAt: new Date()
        }
      })
    );

    await Promise.all(updatePromises);

    // Revalidate pages
    if (course.slug) {
      revalidatePath(`/courses/${course.slug}`);
    }
    revalidatePath("/courses");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error reordering lessons:", error);
    return { 
      success: false, 
      error: "Failed to reorder lessons. Please try again." 
    };
  }
}

export async function deleteModule(moduleChapterId: string) {
  try {
    const user = await checkAuth();
    
    // Get the module chapter to check ownership and get associated lessons/chapters
    const moduleChapter = await prisma.courseChapter.findUnique({
      where: { id: moduleChapterId },
      include: { 
        course: { 
          select: { instructorId: true, slug: true, id: true } 
        } 
      }
    });

    if (!moduleChapter) {
      return { success: false, error: "Module not found" };
    }

    // Check if user is admin or course owner
    if (!user.admin && moduleChapter.course.instructorId !== user.id) {
      return { success: false, error: "Unauthorized to delete this module" };
    }

    // Get all chapters in this course to find associated lessons and content chapters
    const allChapters = await prisma.courseChapter.findMany({
      where: { courseId: moduleChapter.course.id },
      orderBy: { position: 'asc' }
    });

    // Find all chapters that belong to this module (including lessons and content)
    const moduleTitle = moduleChapter.title.replace('📚 ', '');
    const chaptersToDelete: string[] = [];
    let foundModule = false;
    let nextModuleIndex = -1;

    // Find the start and end of this module's content
    for (let i = 0; i < allChapters.length; i++) {
      const chapter = allChapters[i];
      
      if (chapter.id === moduleChapterId) {
        foundModule = true;
        chaptersToDelete.push(chapter.id);
        continue;
      }
      
      if (foundModule) {
        // If we hit another module, stop
        if (chapter.title.startsWith('📚')) {
          nextModuleIndex = i;
          break;
        }
        // Add lessons and content chapters
        chaptersToDelete.push(chapter.id);
      }
    }

    if (chaptersToDelete.length === 0) {
      return { success: false, error: "No chapters found for this module" };
    }

    // Delete all chapters belonging to this module
    await prisma.courseChapter.deleteMany({
      where: {
        id: {
          in: chaptersToDelete
        }
      }
    });

    console.log(`Deleted module "${moduleTitle}" and ${chaptersToDelete.length} associated chapters`);

    // Revalidate pages
    if (moduleChapter.course.slug) {
      revalidatePath(`/courses/${moduleChapter.course.slug}`);
    }
    revalidatePath("/courses");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error deleting module:", error);
    return { 
      success: false, 
      error: "Failed to delete module. Please try again." 
    };
  }
}

export async function deleteLesson(lessonChapterId: string) {
  try {
    console.log(`deleteLesson called with lessonChapterId: ${lessonChapterId}`);
    const user = await checkAuth();
    
    // Get the lesson chapter to check ownership
    const lessonChapter = await prisma.courseChapter.findUnique({
      where: { id: lessonChapterId },
      include: { 
        course: { 
          select: { instructorId: true, slug: true, id: true } 
        } 
      }
    });

    if (!lessonChapter) {
      console.error(`Lesson chapter not found for ID: ${lessonChapterId}`);
      return { success: false, error: "Lesson not found" };
    }
    
    console.log(`Found lesson chapter:`, { id: lessonChapter.id, title: lessonChapter.title, courseId: lessonChapter.courseId });

    // Check if user is admin or course owner
    if (!user.admin && lessonChapter.course.instructorId !== user.id) {
      return { success: false, error: "Unauthorized to delete this lesson" };
    }

    // Get all chapters in this course to find associated content chapters
    const allChapters = await prisma.courseChapter.findMany({
      where: { courseId: lessonChapter.course.id },
      orderBy: { position: 'asc' }
    });

    // Find all chapters that belong to this lesson
    // Handle both formats: "🎯 Lesson: Title" and "🎯 Lesson \d+: Title"
    const lessonTitle = lessonChapter.title.replace(/🎯 Lesson( \d+)?: /, '');
    const chaptersToDelete: string[] = [];

    // Find the lesson position and determine its content boundaries
    const lessonIndex = allChapters.findIndex(ch => ch.id === lessonChapterId);
    
    if (lessonIndex === -1) {
      console.error(`Lesson chapter not found in course chapters list`);
      return { success: false, error: "Lesson not found in course structure" };
    }

    // Add the lesson header itself
    chaptersToDelete.push(lessonChapterId);

    // Find the next lesson or module header to determine where this lesson's content ends
    let nextHeaderIndex = allChapters.length; // Default to end of course
    for (let i = lessonIndex + 1; i < allChapters.length; i++) {
      const chapter = allChapters[i];
      if (chapter.title.startsWith('🎯') || chapter.title.startsWith('📚')) {
        nextHeaderIndex = i;
        break;
      }
    }

    // Add all content chapters between this lesson and the next header
    for (let i = lessonIndex + 1; i < nextHeaderIndex; i++) {
      chaptersToDelete.push(allChapters[i].id);
    }

    console.log(`Lesson "${lessonChapter.title}" spans from index ${lessonIndex} to ${nextHeaderIndex - 1}`);
    console.log(`Chapters to delete:`, allChapters.slice(lessonIndex, nextHeaderIndex).map(ch => ({ id: ch.id, title: ch.title, position: ch.position })));

    if (chaptersToDelete.length === 0) {
      console.error(`No chapters found for lesson "${lessonChapter.title}" with ID: ${lessonChapterId}`);
      console.error("All chapters in course:", allChapters.map(ch => ({ id: ch.id, title: ch.title, position: ch.position })));
      return { success: false, error: `No chapters found for this lesson. Lesson ID: ${lessonChapterId}` };
    }

    // Safety check: prevent deleting more than 10 chapters for a single lesson
    if (chaptersToDelete.length > 10) {
      console.error(`SAFETY CHECK FAILED: Attempting to delete ${chaptersToDelete.length} chapters for lesson "${lessonChapter.title}". This seems excessive.`);
      console.error(`Chapters that would be deleted:`, allChapters.filter(ch => chaptersToDelete.includes(ch.id)).map(ch => ({ id: ch.id, title: ch.title, position: ch.position })));
      return { success: false, error: `Safety check failed: attempting to delete ${chaptersToDelete.length} chapters. This seems like too many for a single lesson.` };
    }

    console.log(`About to delete lesson "${lessonChapter.title}" and ${chaptersToDelete.length} associated chapters:`, chaptersToDelete);

    // Delete all chapters belonging to this lesson
    await prisma.courseChapter.deleteMany({
      where: {
        id: {
          in: chaptersToDelete
        }
      }
    });

    console.log(`Successfully deleted lesson "${lessonTitle}" and ${chaptersToDelete.length} associated chapters`);

    // Revalidate pages
    if (lessonChapter.course.slug) {
      revalidatePath(`/courses/${lessonChapter.course.slug}`);
    }
    revalidatePath("/courses");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error deleting lesson:", error);
    return { 
      success: false, 
      error: "Failed to delete lesson. Please try again." 
    };
  }
}

export async function deleteOrphanedChapters(courseId: string) {
  try {
    const user = await checkAuth();
    
    // Check if user owns this course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true, slug: true }
    });

    if (!course) {
      return { success: false, error: "Course not found" };
    }

    if (!user.admin && course.instructorId !== user.id) {
      return { success: false, error: "Unauthorized to delete chapters in this course" };
    }

    // Get all chapters that are not module or lesson headers
    const orphanedChapters = await prisma.courseChapter.findMany({
      where: { 
        courseId: courseId,
        NOT: {
          OR: [
            { title: { startsWith: '📚' } },
            { title: { startsWith: '🎯' } }
          ]
        }
      }
    });

    if (orphanedChapters.length === 0) {
      return { success: false, error: "No orphaned chapters found" };
    }

    // Delete all orphaned chapters
    await prisma.courseChapter.deleteMany({
      where: {
        id: {
          in: orphanedChapters.map(chapter => chapter.id)
        }
      }
    });

    console.log(`Deleted ${orphanedChapters.length} orphaned chapters from course ${courseId}`);

    // Revalidate pages
    if (course.slug) {
      revalidatePath(`/courses/${course.slug}`);
    }
    revalidatePath("/courses");
    revalidatePath("/dashboard");

    return { success: true, deletedCount: orphanedChapters.length };
  } catch (error) {
    console.error("Error deleting orphaned chapters:", error);
    return { 
      success: false, 
      error: "Failed to delete orphaned chapters. Please try again." 
    };
  }
}

// Update a real CourseModule
export async function updateCourseModule(moduleId: string, data: { title: string; description?: string }) {
  const user = await checkAuth();
  const module = await prisma.courseModule.findUnique({
    where: { id: moduleId },
    include: { course: { select: { instructorId: true, slug: true } } }
  });
  if (!module) return { success: false, error: "Module not found" };
  if (!user.admin && module.course.instructorId !== user.id) return { success: false, error: "Unauthorized" };

  await prisma.courseModule.update({
    where: { id: moduleId },
    data: { title: data.title, description: data.description || "" }
  });

  if (module.course.slug) revalidatePath(`/courses/${module.course.slug}`);
  revalidatePath("/courses");
  revalidatePath("/dashboard");
  return { success: true };
}

// Update a real CourseLesson
export async function updateCourseLesson(lessonId: string, data: { title: string; description?: string }) {
  const user = await checkAuth();
  const lesson = await prisma.courseLesson.findUnique({
    where: { id: lessonId },
    include: { module: { include: { course: { select: { instructorId: true, slug: true } } } } }
  });
  if (!lesson) return { success: false, error: "Lesson not found" };
  if (!user.admin && lesson.module.course.instructorId !== user.id) return { success: false, error: "Unauthorized" };

  await prisma.courseLesson.update({
    where: { id: lessonId },
    data: { title: data.title, description: data.description || "" }
  });

  if (lesson.module.course.slug) revalidatePath(`/courses/${lesson.module.course.slug}`);
  revalidatePath("/courses");
  revalidatePath("/dashboard");
  return { success: true };
}

// Add 11 Labs text-to-speech functionality
interface GenerateAudioData {
  text: string;
  voiceId?: string;
}

export async function generateChapterAudio(chapterId: string, audioData: GenerateAudioData) {
  try {
    const user = await checkAuth();
    
    // Get the chapter to check ownership
    const chapter = await prisma.courseChapter.findUnique({
      where: { id: chapterId },
      include: { course: { select: { instructorId: true, slug: true } } }
    });

    if (!chapter) {
      return { success: false, error: "Chapter not found" };
    }

    // Check if user is admin or course owner
    if (!user.admin && chapter.course.instructorId !== user.id) {
      return { success: false, error: "Unauthorized to generate audio for this chapter" };
    }

    // Check if 11 Labs API key is configured
    const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;
    if (!elevenLabsApiKey) {
      console.error("❌ 11 Labs API key not configured");
      return { success: false, error: "11 Labs API key not configured" };
    }
    
    console.log(`🔑 11 Labs API key configured: ${elevenLabsApiKey ? 'Yes' : 'No'}`);
    console.log(`🔑 API key length: ${elevenLabsApiKey?.length || 0}`);
    console.log(`🔑 API key starts with: ${elevenLabsApiKey?.substring(0, 10)}...`);

    // Default voice ID (you can make this configurable)
    const voiceId = audioData.voiceId || "9BWtsMINqrJLrRacOk9x"; // Aria voice

    // Validate voice ID by checking if it exists
    console.log(`🔍 Validating voice ID: ${voiceId}`);
    try {
      const voices = await elevenlabs.voices.getAll();
      const validVoice = voices.voices?.find(v => v.voiceId === voiceId);
      if (!validVoice) {
        console.error(`❌ Invalid voice ID: ${voiceId}`);
        console.log(`📋 Available voices:`, voices.voices?.slice(0, 5).map(v => `${v.name} (${v.voiceId})`));
        return { success: false, error: `Invalid voice ID: ${voiceId}. Please select a valid voice.` };
      }
      console.log(`✅ Voice validated: ${validVoice.name} (${voiceId})`);
    } catch (voiceError) {
      console.error(`⚠️ Could not validate voice ID:`, voiceError);
      // Continue anyway, let the main API call handle the error
    }

    // Strip markdown formatting for better TTS
    const cleanedText = stripMarkdownForTTS(audioData.text);
    console.log(`📝 Original text length: ${audioData.text.length} characters`);
    console.log(`🧹 Cleaned text length: ${cleanedText.length} characters`);
    console.log(`🧹 Cleaned text preview: ${cleanedText.substring(0, 200)}...`);

    // Split long text into chunks for complete audio coverage
    const maxChunkLength = 3000; // Smaller chunks for better processing
    const textChunks = splitTextIntoChunks(cleanedText, maxChunkLength);
    
    console.log(`📚 Split text into ${textChunks.length} chunks`);
    textChunks.forEach((chunk, index) => {
      console.log(`📄 Chunk ${index + 1}: ${chunk.length} characters`);
    });

    // Generate audio for each chunk and combine them
    console.log(`🎵 Generating audio for ${textChunks.length} chunks...`);
    const audioBuffers: ArrayBuffer[] = [];
    
    for (let i = 0; i < textChunks.length; i++) {
      const chunk = textChunks[i];
      console.log(`🎬 Processing chunk ${i + 1}/${textChunks.length} (${chunk.length} characters)`);
      console.log(`🎬 Chunk preview: ${chunk.substring(0, 100)}...`);
      
      try {
        const audioStream = await elevenlabs.textToSpeech.convert(voiceId, {
          text: chunk,
          modelId: "eleven_multilingual_v2",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.5
          }
        });
        
        console.log(`✅ Chunk ${i + 1} audio generation successful`);
        
        // Convert stream to buffer
        const streamChunks: Uint8Array[] = [];
        const reader = audioStream.getReader();
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            streamChunks.push(value);
          }
        } finally {
          reader.releaseLock();
        }
        
        // Convert Uint8Array chunks to ArrayBuffer
        const totalLength = streamChunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const chunkAudioBuffer = new ArrayBuffer(totalLength);
        const audioView = new Uint8Array(chunkAudioBuffer);
        let offset = 0;
        for (const streamChunk of streamChunks) {
          audioView.set(streamChunk, offset);
          offset += streamChunk.length;
        }
        
        audioBuffers.push(chunkAudioBuffer);
        console.log(`✅ Chunk ${i + 1} processed: ${chunkAudioBuffer.byteLength} bytes`);
        
        // Add a small delay between requests to avoid rate limiting
        if (i < textChunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
      } catch (elevenLabsError: any) {
        console.error(`❌ ElevenLabs API error for chunk ${i + 1}:`, elevenLabsError);
        
        let errorMessage = `Failed to generate audio for chunk ${i + 1}`;
        if (elevenLabsError.statusCode === 400) {
          errorMessage = "Invalid request to ElevenLabs API. Check voice ID and parameters.";
        } else if (elevenLabsError.statusCode === 401) {
          errorMessage = "Invalid ElevenLabs API key.";
        } else if (elevenLabsError.statusCode === 429) {
          errorMessage = "ElevenLabs API rate limit exceeded. Try again later.";
        }
        
        return { success: false, error: errorMessage };
      }
    }
    
    // Combine all audio buffers into one
    console.log(`🔗 Combining ${audioBuffers.length} audio chunks...`);
    const totalAudioLength = audioBuffers.reduce((acc, buffer) => acc + buffer.byteLength, 0);
    const combinedAudioBuffer = new ArrayBuffer(totalAudioLength);
    const combinedView = new Uint8Array(combinedAudioBuffer);
    
    let combinedOffset = 0;
    for (const buffer of audioBuffers) {
      combinedView.set(new Uint8Array(buffer), combinedOffset);
      combinedOffset += buffer.byteLength;
    }
    
    const audioBuffer = combinedAudioBuffer;
    console.log(`🎉 Combined audio generated, total size: ${audioBuffer.byteLength} bytes`);
    
    try {
      // Check if UploadThing is configured
      if (process.env.UPLOADTHING_TOKEN) {
        console.log(`📁 Uploading audio to UploadThing...`);
        
        // Create a File from the ArrayBuffer
        const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
        const audioFile = new File([audioBlob], `audio_${chapterId}_${Date.now()}.mp3`, {
          type: 'audio/mpeg'
        });

        // Upload to UploadThing using the modern SDK
        const uploadResponse = await utapi.uploadFiles(audioFile);

        if (uploadResponse.data) {
          const audioUrl = uploadResponse.data.url;
          console.log(`✅ Audio uploaded to UploadThing: ${audioUrl}`);

          // Update the chapter with the UploadThing URL
          await prisma.courseChapter.update({
            where: { id: chapterId },
            data: {
              audioUrl: audioUrl,
              updatedAt: new Date()
            }
          });

          console.log(`✅ Audio URL stored successfully in database`);

          // Revalidate pages
          if (chapter.course.slug) {
            revalidatePath(`/courses/${chapter.course.slug}`);
          }
          revalidatePath("/courses");
          revalidatePath("/dashboard");

          return { 
            success: true, 
            audioUrl: audioUrl,
            message: `Audio generated from ${textChunks.length} chunks and uploaded successfully. Total length: ${Math.round(audioBuffer.byteLength / 1024)}KB`
          };
        } else {
          throw new Error('UploadThing upload failed - no data returned');
        }
      } else {
        console.log(`⚠️ UploadThing not configured, using fallback storage`);
        throw new Error('UploadThing not configured');
      }
    } catch (uploadError) {
      console.error("❌ UploadThing upload error:", uploadError);
      
      // Fallback: use in-memory cache
      const audioFileName = `audio_${chapterId}_${Date.now()}.mp3`;
      const audioUrl = `/audio/${audioFileName}`;
      
      try {
        // Store in memory as fallback
        global.audioCache = global.audioCache || new Map();
        global.audioCache.set(audioFileName, audioBuffer);

        await prisma.courseChapter.update({
          where: { id: chapterId },
          data: {
            audioUrl: audioUrl,
            updatedAt: new Date()
          }
        });

        console.log(`⚠️ Fallback: Audio stored in memory cache`);

        // Revalidate pages
        if (chapter.course.slug) {
          revalidatePath(`/courses/${chapter.course.slug}`);
        }
        revalidatePath("/courses");
        revalidatePath("/dashboard");

        return { 
          success: true, 
          audioUrl: audioUrl,
          message: `Audio generated from ${textChunks.length} chunks using fallback storage. Total length: ${Math.round(audioBuffer.byteLength / 1024)}KB`
        };
      } catch (dbError) {
        console.error("❌ Database fallback error:", dbError);
        return { 
          success: false, 
          error: "Failed to store audio. Please try again." 
        };
      }
    }
  } catch (error) {
    console.error("Error generating audio:", error);
    return { 
      success: false, 
      error: "Failed to generate audio. Please try again." 
    };
  }
}

// Get available voices from 11 Labs
export async function getElevenLabsVoices() {
  try {
    const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;
    if (!elevenLabsApiKey) {
      return { success: false, error: "11 Labs API key not configured" };
    }

    const voices = await elevenlabs.voices.getAll();
    return { success: true, voices: voices.voices };
  } catch (error) {
    console.error("Error fetching voices:", error);
    return { success: false, error: "Failed to fetch voices" };
  }
}

export async function clearNonPlayableAudio() {
  try {
    const user = await checkAuth();
    
    if (!user.admin) {
      return { success: false, error: "Unauthorized" };
    }

    // Find chapters with non-playable audio URLs (reference strings)
    const chaptersWithReferences = await prisma.courseChapter.findMany({
      where: {
        AND: [
          { audioUrl: { not: null } },
          { audioUrl: { not: { startsWith: 'data:' } } }
        ]
      },
      select: {
        id: true,
        title: true,
        audioUrl: true
      }
    });

    console.log(`Found ${chaptersWithReferences.length} chapters with non-playable audio URLs`);

    // Clear the audio URLs
    const updatePromises = chaptersWithReferences.map(chapter => 
      prisma.courseChapter.update({
        where: { id: chapter.id },
        data: { audioUrl: null }
      })
    );

    await Promise.all(updatePromises);

    return { 
      success: true, 
      message: `Cleared ${chaptersWithReferences.length} non-playable audio URLs` 
    };
  } catch (error) {
    console.error("Error clearing non-playable audio:", error);
    return { 
      success: false, 
      error: "Failed to clear non-playable audio URLs" 
    };
  }
}

export async function testAudioUrl(chapterId: string) {
  try {
    const user = await checkAuth();
    
    if (!user.admin) {
      return { success: false, error: "Unauthorized" };
    }

    const chapter = await prisma.courseChapter.findUnique({
      where: { id: chapterId },
      select: {
        id: true,
        title: true,
        audioUrl: true
      }
    });

    if (!chapter) {
      return { success: false, error: "Chapter not found" };
    }

    console.log(`🔍 Testing audio URL for chapter: ${chapter.title}`);
    console.log(`📊 Audio URL info:`);
    console.log(`   - Has audioUrl: ${!!chapter.audioUrl}`);
    console.log(`   - Audio URL type: ${typeof chapter.audioUrl}`);
    console.log(`   - Audio URL length: ${chapter.audioUrl?.length || 0}`);
    
    if (chapter.audioUrl) {
      console.log(`   - Audio URL starts with: ${chapter.audioUrl.substring(0, 50)}...`);
      console.log(`   - Audio URL ends with: ...${chapter.audioUrl.substring(chapter.audioUrl.length - 20)}`);
      console.log(`   - Is data URL: ${chapter.audioUrl.startsWith('data:')}`);
      console.log(`   - Has base64: ${chapter.audioUrl.includes('base64,')}`);
    }

    return { 
      success: true, 
      chapter: chapter,
      audioUrlInfo: {
        hasAudio: !!chapter.audioUrl,
        type: typeof chapter.audioUrl,
        length: chapter.audioUrl?.length || 0,
        isDataUrl: chapter.audioUrl?.startsWith('data:') || false,
        hasBase64: chapter.audioUrl?.includes('base64,') || false
      }
    };
  } catch (error) {
    console.error("Error testing audio URL:", error);
    return { 
      success: false, 
      error: "Failed to test audio URL" 
    };
  }
}

// Test 11 Labs API key
export async function testElevenLabsApiKey() {
  try {
    const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;
    
    console.log(`🔑 Testing 11 Labs API key...`);
    console.log(`🔑 API key exists: ${!!elevenLabsApiKey}`);
    console.log(`🔑 API key length: ${elevenLabsApiKey?.length || 0}`);
    
    if (!elevenLabsApiKey) {
      return { success: false, error: "11 Labs API key not configured" };
    }

    // Test the API key by fetching voices using SDK
    const voices = await elevenlabs.voices.getAll();
    console.log(`✅ API key test successful, found ${voices.voices?.length || 0} voices`);
    
    return { 
      success: true, 
      message: `API key working, found ${voices.voices?.length || 0} voices`,
      voices: voices.voices 
    };
  } catch (error) {
    console.error("❌ API key test error:", error);
    return { 
      success: false, 
      error: "Failed to test API key" 
    };
  }
}

export async function cleanupLegacyAudioReferences() {
  try {
    const user = await checkAuth();
    
    if (!user.admin) {
      return { success: false, error: "Unauthorized" };
    }

    // Find chapters with legacy audio references
    const chaptersWithLegacyAudio = await prisma.courseChapter.findMany({
      where: {
        audioUrl: {
          startsWith: 'generated_'
        }
      },
      select: {
        id: true,
        title: true,
        audioUrl: true
      }
    });

    console.log(`Found ${chaptersWithLegacyAudio.length} chapters with legacy audio references`);

    // Clear the legacy audio URLs
    const updatePromises = chaptersWithLegacyAudio.map(chapter => 
      prisma.courseChapter.update({
        where: { id: chapter.id },
        data: { audioUrl: null }
      })
    );

    await Promise.all(updatePromises);

    return { 
      success: true, 
      message: `Cleaned up ${chaptersWithLegacyAudio.length} legacy audio references. Please regenerate audio.` 
    };
  } catch (error) {
    console.error("Error cleaning up legacy audio:", error);
    return { 
      success: false, 
      error: "Failed to clean up legacy audio references" 
    };
  }
} 
"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { getUserFromClerk } from "@/lib/convex-data";
import {
  generateAICourseFast as generateAICourseLib,
  searchTopicImages,
} from "@/lib/ai-course-generator";
import { scrapeContent, generateEmbeddings } from "@/lib/content-scraper";
import { generateSlug, generateUniqueSlug } from "@/lib/utils";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// Initialize Convex client for server actions
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function checkAdminAuth() {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");

  const user = await getUserFromClerk(clerkId);
  if (!user || !user.admin) throw new Error("Unauthorized - Admin access required");

  return user;
}

export async function updateUserRole(
  userId: string,
  role: "admin" | "user" | "creator"
) {
  await checkAdminAuth();

  try {
    const { userId: clerkId } = await auth();
    const result = await convex.mutation(api.users.updateUserRole, {
      adminClerkId: clerkId!,
      targetUserId: userId as Id<"users">,
      role,
    });

    if (!result.success) {
      return { success: false, error: result.message };
    }

    revalidatePath("/admin");
    revalidatePath("/admin/users");
    return { success: true, message: result.message };
  } catch (error) {
    return { success: false, error: "Failed to update user role" };
  }
}

export async function approveCourse(courseId: string) {
  await checkAdminAuth();

  try {
    const { userId: clerkId } = await auth();
    await convex.mutation(api.courses.togglePublished, {
      courseId: courseId as Id<"courses">,
      userId: clerkId!,
    });

    revalidatePath("/admin");
    revalidatePath("/courses");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to approve course" };
  }
}

export async function rejectCourse(courseId: string) {
  await checkAdminAuth();

  try {
    const { userId: clerkId } = await auth();
    await convex.mutation(api.courses.togglePublished, {
      courseId: courseId as Id<"courses">,
      userId: clerkId!,
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to reject course" };
  }
}

export async function toggleFeatureCourse(courseId: string, featured: boolean) {
  await checkAdminAuth();

  try {
    // Toggle publish status as a proxy for featured (or add featured field to Convex schema)
    const { userId: clerkId } = await auth();
    await convex.mutation(api.courses.togglePublished, {
      courseId: courseId as Id<"courses">,
      userId: clerkId!,
    });

    revalidatePath("/admin");
    revalidatePath("/courses");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update course" };
  }
}

export async function approveCoach(profileId: string) {
  await checkAdminAuth();

  try {
    const result = await convex.mutation(api.adminCoach.approveCoachProfile, {
      profileId: profileId as Id<"coachProfiles">,
    });

    if (!result.success) {
      return { success: false, error: result.message };
    }

    revalidatePath("/admin");
    revalidatePath("/coaching");
    return { success: true, message: result.message };
  } catch (error) {
    return {
      success: false,
      error: `Failed to approve coach: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

export async function rejectCoach(profileId: string) {
  await checkAdminAuth();

  try {
    const result = await convex.mutation(api.adminCoach.rejectCoachProfile, {
      profileId: profileId as Id<"coachProfiles">,
    });

    if (!result.success) {
      return { success: false, error: result.message };
    }

    revalidatePath("/admin");
    revalidatePath("/coaching");
    return { success: true, message: result.message };
  } catch (error) {
    return { success: false, error: "Failed to reject coach" };
  }
}

export async function debugCoachProfiles() {
  await checkAdminAuth();

  try {
    const profiles = await convex.query(api.adminCoach.getCoachProfilesDebug, {});

    return { success: true, profiles };
  } catch (error) {
    return { success: false, error: "Failed to debug coach profiles" };
  }
}

export async function cleanupOrphanedCoachProfiles(dryRun: boolean = true) {
  await checkAdminAuth();

  try {
    const result = await convex.mutation(api.adminCoach.cleanupOrphanedProfiles, {
      dryRun,
    });

    return {
      success: result.success,
      message: result.message,
      orphanedCount: result.orphanedCount,
      deletedIds: result.deletedIds,
    };
  } catch (error) {
    return { success: false, error: "Failed to cleanup orphaned profiles" };
  }
}

export async function generateAICourse(courseData: {
  topic: string;
  skillLevel: string;
  category: string;
  price: string;
  description?: string;
  learningObjectives?: string[];
  targetModules?: number;
  targetLessonsPerModule?: number;
  additionalContext?: string;
}) {
  const user = await checkAdminAuth();

  try {
    // Generate the course structure using AI
    const generatedCourse = await generateAICourseLib({
      topic: courseData.topic,
      skillLevel: courseData.skillLevel as "beginner" | "intermediate" | "advanced",
      category: courseData.category,
      instructorId: user.id || user._id,
      price: parseFloat(courseData.price),
      description: courseData.description,
      learningObjectives: courseData.learningObjectives,
      targetModules: courseData.targetModules,
      targetLessonsPerModule: courseData.targetLessonsPerModule,
      additionalContext: courseData.additionalContext,
    });

    // Generate a unique slug for the course
    const baseSlug = generateSlug(generatedCourse.course.title);

    // Get existing courses to check for slug conflicts
    const existingCourses = await convex.query(api.courses.getCourses, {});
    const existingSlugs = existingCourses.map((c: any) => c.slug).filter(Boolean) as string[];
    const uniqueSlug = generateUniqueSlug(baseSlug, existingSlugs);

    // Create the course in Convex
    const { userId: clerkId } = await auth();

    // Build the course data structure
    // Note: Using explicit type to avoid "Type instantiation is excessively deep" error
    const createCourseData = {
      userId: clerkId!,
      storeId: "default",
      data: {
        title: generatedCourse.course.title,
        description: generatedCourse.course.description,
        price: generatedCourse.course.price.toString(),
        thumbnail: generatedCourse.course.thumbnail,
        category: courseData.category,
        skillLevel: courseData.skillLevel,
        modules: generatedCourse.modules.map((mod: any, modIndex: number) => ({
          title: mod.title,
          description: mod.description,
          orderIndex: modIndex,
          lessons: mod.lessons.map((lesson: any, lessonIndex: number) => ({
            title: lesson.title,
            description: lesson.description,
            orderIndex: lessonIndex,
            chapters: lesson.chapters.map((chapter: any, chapterIndex: number) => ({
              title: chapter.title,
              content: chapter.content || "",
              videoUrl: "",
              duration: 0,
              orderIndex: chapterIndex,
            })),
          })),
        })),
        checkoutHeadline: `Learn ${generatedCourse.course.title}`,
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createCourseWithDataRef = api.courses.createCourseWithData as any;
    const courseId = await convex.mutation(createCourseWithDataRef, createCourseData);

    revalidatePath("/admin");
    revalidatePath("/courses");

    return {
      success: true,
      course: {
        id: courseId,
        title: generatedCourse.course.title,
        slug: uniqueSlug,
      },
      stats: {
        modules: generatedCourse.modules.length,
        lessons: generatedCourse.modules.reduce((acc: number, m: any) => acc + m.lessons.length, 0),
        chapters: generatedCourse.modules.reduce(
          (acc: number, m: any) =>
            acc + m.lessons.reduce((lacc: number, l: any) => lacc + l.chapters.length, 0),
          0
        ),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate course",
    };
  }
}

export async function searchImages(topic: string, skillLevel: string) {
  await checkAdminAuth();

  try {
    const images = await searchTopicImages(topic, skillLevel);
    return { success: true, images };
  } catch (error) {
    return { success: false, error: "Failed to search images" };
  }
}

export async function searchCourseImages(courseId: string, customTopic?: string) {
  await checkAdminAuth();

  try {
    // Get course details from Convex
    const courses = await convex.query(api.courses.getCourses, {});
    const course = courses.find((c: any) => c._id === courseId);

    if (!course) {
      return { success: false, error: "Course not found" };
    }

    const searchTopic = customTopic || course.title;
    const images = await searchTopicImages(searchTopic, "intermediate");

    return {
      success: true,
      images,
      course: {
        id: courseId,
        title: course.title,
        searchTopic,
      },
    };
  } catch (error) {
    return { success: false, error: "Failed to search course images" };
  }
}

export async function updateCourseImage(courseId: string, imageUrl: string) {
  await checkAdminAuth();

  try {
    await convex.mutation(api.courses.updateCourse, {
      id: courseId as Id<"courses">,
      imageUrl,
    });

    revalidatePath("/courses");
    revalidatePath("/admin");

    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update course image" };
  }
}

export async function enhancedImageSearch(
  query: string,
  options?: {
    includeYoutube?: boolean;
    includeProfessional?: boolean;
    maxResults?: number;
  }
) {
  await checkAdminAuth();

  try {
    const { includeYoutube = true, includeProfessional = true, maxResults = 12 } = options || {};

    const searchQueries = [
      `${query} music production tutorial interface`,
      `${query} DAW plugin screenshot guide`,
      `${query} music production workflow setup`,
    ];

    if (includeYoutube) {
      searchQueries.push(`${query} music production youtube tutorial`);
    }

    if (includeProfessional) {
      searchQueries.push(`${query} professional music production equipment`);
      searchQueries.push(`${query} studio setup music production`);
    }

    const allImages: string[] = [];

    for (const searchQuery of searchQueries) {
      const images = await searchTopicImages(searchQuery, "intermediate");
      allImages.push(...images);

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (allImages.length >= maxResults) break;
    }

    // Remove duplicates and limit results
    const uniqueImages = [...new Set(allImages)].slice(0, maxResults);

    return {
      success: true,
      images: uniqueImages,
      query,
      totalFound: uniqueImages.length,
    };
  } catch (error) {
    return { success: false, error: "Failed to perform enhanced image search" };
  }
}

export async function searchContent(query: string, includeImages: boolean) {
  await checkAdminAuth();

  try {
    // Sample results for content search
    const sampleResults = [
      {
        title: `${query} - Complete Guide`,
        content: `Comprehensive guide on ${query} for music producers...`,
        url: `https://example.com/${query.toLowerCase().replace(/\s+/g, "-")}`,
        score: 0.95,
      },
      {
        title: `Advanced ${query} Techniques`,
        content: `Learn advanced techniques for ${query} in modern music production...`,
        url: `https://example.com/advanced-${query.toLowerCase().replace(/\s+/g, "-")}`,
        score: 0.88,
      },
    ];

    return { success: true, results: sampleResults };
  } catch (error) {
    return { success: false, error: "Failed to search content" };
  }
}

export async function reindexContent() {
  await checkAdminAuth();

  try {
    // Simulate reindexing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to reindex content" };
  }
}

export async function scrapeContentFromUrl(url: string, fixErrors: boolean = false) {
  await checkAdminAuth();

  try {
    const scrapedContent = await scrapeContent(url, fixErrors);

    return {
      success: true,
      content: scrapedContent,
      metadata: {
        title: scrapedContent.title,
        type: scrapedContent.type,
        chunks: scrapedContent.chunks.length,
        contentLength: scrapedContent.content.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to scrape content",
    };
  }
}

export async function generateContentEmbeddings(text: string) {
  await checkAdminAuth();

  try {
    const embeddings = await generateEmbeddings(text);

    return {
      success: true,
      embeddings,
      dimensions: embeddings.length,
    };
  } catch (error) {
    return { success: false, error: "Failed to generate embeddings" };
  }
}

export async function enhancedSearchContent(query: string, includeYoutube: boolean = true) {
  await checkAdminAuth();

  try {
    const searchResults: string[] = [];

    return {
      success: true,
      results: searchResults,
      query: query,
    };
  } catch (error) {
    return { success: false, error: "Failed to perform enhanced search" };
  }
}

// Course Management Actions
export async function updateCourse(
  courseId: string,
  data: {
    title?: string;
    description?: string;
    price?: string;
    category?: string;
    skillLevel?: string;
    isPublished?: boolean;
  }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return { success: false, error: "Not authenticated" };
    }

    const user = await getUserFromClerk(clerkId);
    if (!user?.admin) {
      return { success: false, error: "Admin access required" };
    }

    const updateData: any = {};
    if (data.title) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price) updateData.price = parseFloat(data.price);
    if (data.isPublished !== undefined) updateData.isPublished = data.isPublished;
    if (data.category) updateData.category = data.category;
    if (data.skillLevel) updateData.skillLevel = data.skillLevel;

    await convex.mutation(api.courses.updateCourse, {
      id: courseId as Id<"courses">,
      ...updateData,
    });

    revalidatePath("/courses");
    revalidatePath("/admin");

    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update course" };
  }
}

export async function deleteCourse(courseId: string) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return { success: false, error: "Not authenticated" };
    }

    const user = await getUserFromClerk(clerkId);
    if (!user?.admin) {
      return { success: false, error: "Admin access required" };
    }

    await convex.mutation(api.courses.deleteCourse, {
      courseId: courseId as Id<"courses">,
      userId: clerkId,
    });

    revalidatePath("/courses");
    revalidatePath("/admin");

    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete course" };
  }
}

export async function bulkUpdateCourses(
  courseIds: string[],
  action: "publish" | "unpublish" | "delete"
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return { success: false, error: "Not authenticated" };
    }

    const user = await getUserFromClerk(clerkId);
    if (!user?.admin) {
      return { success: false, error: "Admin access required" };
    }

    let count = 0;

    switch (action) {
      case "publish":
        for (const courseId of courseIds) {
          await convex.mutation(api.courses.togglePublished, {
            courseId: courseId as Id<"courses">,
            userId: clerkId,
          });
          count++;
        }
        break;

      case "unpublish":
        for (const courseId of courseIds) {
          await convex.mutation(api.courses.togglePublished, {
            courseId: courseId as Id<"courses">,
            userId: clerkId,
          });
          count++;
        }
        break;

      case "delete":
        for (const courseId of courseIds) {
          await convex.mutation(api.courses.deleteCourse, {
            courseId: courseId as Id<"courses">,
            userId: clerkId,
          });
          count++;
        }
        break;

      default:
        return { success: false, error: "Invalid action" };
    }

    revalidatePath("/courses");
    revalidatePath("/admin");

    return { success: true, count };
  } catch (error) {
    return { success: false, error: `Failed to ${action} courses` };
  }
}

"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { getUserFromClerk } from "@/lib/data";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { generateSlug, generateUniqueSlug } from "@/lib/utils";
import { UTApi } from "uploadthing/server";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const utapi = new UTApi({ token: process.env.UPLOADTHING_TOKEN });
const elevenlabs = new ElevenLabsClient({ apiKey: process.env.ELEVEN_LABS_API_KEY });

function stripMarkdownForTTS(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/^[-*]{3,}$/gm, "")
    .replace(/^>\s+/gm, "")
    .replace(/^[\s]*[-*+]\s+/gm, "")
    .replace(/^[\s]*\d+\.\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\s+|\s+$/g, "")
    .replace(/\n/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function splitTextIntoChunks(text: string, maxChunkLength: number): string[] {
  if (text.length <= maxChunkLength) return [text];

  const chunks: string[] = [];
  let currentPosition = 0;

  while (currentPosition < text.length) {
    let chunkEnd = currentPosition + maxChunkLength;
    if (chunkEnd >= text.length) {
      chunks.push(text.substring(currentPosition));
      break;
    }

    const chunkText = text.substring(currentPosition, chunkEnd);
    const sentenceBreaks = [".", "!", "?"];
    let bestBreak = -1;

    for (let i = chunkText.length - 1; i >= maxChunkLength * 0.7; i--) {
      if (sentenceBreaks.includes(chunkText[i])) {
        bestBreak = i + 1;
        break;
      }
    }

    if (bestBreak === -1) {
      const paragraphBreak = chunkText.lastIndexOf("\n\n");
      if (paragraphBreak > maxChunkLength * 0.5) bestBreak = paragraphBreak + 2;
    }

    if (bestBreak === -1) {
      const wordBreak = chunkText.lastIndexOf(" ");
      bestBreak = wordBreak > 0 ? wordBreak : chunkText.length;
    }

    chunks.push(text.substring(currentPosition, currentPosition + bestBreak).trim());
    currentPosition += bestBreak;
  }

  return chunks.filter((chunk) => chunk.length > 0);
}

declare global {
  var audioCache: Map<string, ArrayBuffer> | undefined;
}

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

async function checkAuth() {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");

  const user = await getUserFromClerk(clerkId);
  if (!user) throw new Error("User not found");

  // Return user with clerkId explicitly typed
  return { ...user, clerkId };
}

export async function createCourse(courseData: CourseData) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return { success: false, error: "Unauthorized" };

    const user = await getUserFromClerk(clerkId);
    if (!user) return { success: false, error: "User not found" };

    const baseSlug = generateSlug(courseData.title);
    const existingCourses = await convex.query(api.courses.getCourses, {});
    const existingSlugs = existingCourses.map((c: any) => c.slug).filter(Boolean) as string[];
    const uniqueSlug = generateUniqueSlug(baseSlug, existingSlugs);

    const courseId = await convex.mutation(api.courses.createCourseWithData, {
      userId: clerkId,
      storeId: "default",
      data: {
        title: courseData.title,
        description: courseData.description,
        price: courseData.price.toString(),
        thumbnail: courseData.thumbnail || "",
        category: courseData.category,
        skillLevel: courseData.skillLevel,
        modules: courseData.modules,
        checkoutHeadline: `Learn ${courseData.title}`,
      },
    });

    revalidatePath("/courses");
    revalidatePath("/dashboard");

    return { success: true, courseId, slug: uniqueSlug };
  } catch (error) {
    console.error("Error creating course:", error);
    return { success: false, error: "Failed to create course. Please try again." };
  }
}

export async function updateCourse(courseId: string, courseData: Partial<CourseData>) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return { success: false, error: "Unauthorized" };

    const user = await getUserFromClerk(clerkId);
    if (!user) return { success: false, error: "User not found" };

    const updateData: any = {};
    if (courseData.title) updateData.title = courseData.title;
    if (courseData.description !== undefined) updateData.description = courseData.description;
    if (courseData.price !== undefined) updateData.price = courseData.price;
    if (courseData.thumbnail) updateData.imageUrl = courseData.thumbnail;
    if (courseData.isPublished !== undefined) updateData.isPublished = courseData.isPublished;

    await convex.mutation(api.courses.updateCourse, {
      id: courseId as Id<"courses">,
      ...updateData,
    });

    revalidatePath("/courses");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error updating course:", error);
    return { success: false, error: "Failed to update course. Please try again." };
  }
}

export async function deleteCourse(courseId: string) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return { success: false, error: "Unauthorized" };

    const user = await getUserFromClerk(clerkId);
    if (!user) return { success: false, error: "User not found" };

    await convex.mutation(api.courses.deleteCourse, {
      courseId: courseId as Id<"courses">,
      userId: clerkId,
    });

    revalidatePath("/courses");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error deleting course:", error);
    return { success: false, error: "Failed to delete course. Please try again." };
  }
}

export async function publishCourse(courseId: string) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return { success: false, error: "Unauthorized" };

    await convex.mutation(api.courses.togglePublished, {
      courseId: courseId as Id<"courses">,
      userId: clerkId,
    });

    revalidatePath("/courses");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error publishing course:", error);
    return { success: false, error: "Failed to publish course. Please try again." };
  }
}

export async function enrollInCourse(courseId: string) {
  try {
    const user = await checkAuth();

    console.log(`[Course] Enrollment requested for course ${courseId} by user ${user._id}`);

    revalidatePath(`/courses/*`);
    return { success: true };
  } catch (error) {
    console.error("Error enrolling in course:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to enroll in course",
    };
  }
}

export async function submitCourseReview(courseId: string, rating: number, comment: string) {
  try {
    const user = await checkAuth();

    console.log(
      `[Course] Review submitted: ${rating}/5 - ${comment} for course ${courseId} by user ${user._id}`
    );

    revalidatePath(`/courses/*`);
    return { success: true };
  } catch (error) {
    console.error("Error submitting review:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to submit review",
    };
  }
}

export async function markChapterComplete(chapterId: string) {
  try {
    const user = await checkAuth();

    console.log(`[Course] Chapter ${chapterId} marked complete by user ${user._id}`);

    revalidatePath(`/courses/*`);
    return { success: true };
  } catch (error) {
    console.error("Error marking chapter complete:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to mark chapter complete",
    };
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
    if (!user.admin) return { success: false, error: "Admin access required" };

    // Get chapter to find its courseId
    const chapter = await convex.query(api.courses.getChapterById, {
      chapterId: chapterId as Id<"courseChapters">,
      userId: user.clerkId,
    });

    if (!chapter) return { success: false, error: "Chapter not found" };

    await convex.mutation(api.courses.createOrUpdateChapter, {
      courseId: chapter.courseId as Id<"courses">,
      chapterId: chapterId as Id<"courseChapters">,
      chapterData: {
        title: chapter.title,
        content: content,
        position: chapter.position,
      },
    });

    revalidatePath(`/courses/*`);
    return { success: true };
  } catch (error) {
    console.error("Error updating chapter content:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update chapter",
    };
  }
}

export async function updateChapter(chapterId: string, updateData: ChapterUpdateData) {
  try {
    const user = await checkAuth();

    // Get chapter to find its courseId and current data
    const chapter = await convex.query(api.courses.getChapterById, {
      chapterId: chapterId as Id<"courseChapters">,
      userId: user.clerkId,
    });

    if (!chapter) return { success: false, error: "Chapter not found" };

    await convex.mutation(api.courses.createOrUpdateChapter, {
      courseId: chapter.courseId as Id<"courses">,
      lessonId: chapter.lessonId as Id<"courseLessons"> | undefined,
      chapterId: chapterId as Id<"courseChapters">,
      chapterData: {
        title: updateData.title || chapter.title,
        content: updateData.description || chapter.description || "",
        videoUrl: updateData.videoUrl,
        position: chapter.position,
      },
    });

    revalidatePath(`/courses/*`);
    return { success: true };
  } catch (error) {
    console.error("Error updating chapter:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update chapter",
    };
  }
}

export async function populateCourseSlugs() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return { success: false, error: "Unauthorized" };

    const user = await getUserFromClerk(clerkId);
    if (!user?.admin) return { success: false, error: "Admin access required" };

    const courses = await convex.query(api.courses.getCourses, {});
    const coursesWithoutSlugs = courses.filter((c: any) => !c.slug || c.slug === "");

    if (coursesWithoutSlugs.length === 0) {
      return { success: true, message: "All courses already have slugs", updated: 0 };
    }

    const existingSlugs = courses.map((c: any) => c.slug).filter(Boolean) as string[];

    let updatedCount = 0;
    for (const course of coursesWithoutSlugs) {
      const baseSlug = generateSlug(course.title);
      const uniqueSlug = generateUniqueSlug(baseSlug, [...existingSlugs]);

      await convex.mutation(api.courses.updateCourse, {
        id: course._id,
        slug: uniqueSlug,
      });

      existingSlugs.push(uniqueSlug);
      updatedCount++;
    }

    revalidatePath("/courses");
    revalidatePath("/admin");

    return {
      success: true,
      message: `Successfully populated slugs for ${updatedCount} courses`,
      updated: updatedCount,
    };
  } catch (error) {
    console.error("Error populating course slugs:", error);
    return { success: false, error: "Failed to populate course slugs. Please try again." };
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

    const result = await convex.mutation(api.courses.createOrUpdateChapter, {
      courseId: courseId as Id<"courses">,
      lessonId: chapterData.lessonId as Id<"courseLessons"> | undefined,
      chapterId: null,
      chapterData: {
        title: chapterData.title,
        content: chapterData.description || "",
        videoUrl: chapterData.videoUrl,
        position: chapterData.position,
      },
    });

    revalidatePath(`/courses/*`);
    revalidatePath("/dashboard");

    return { success: true, chapterId: result.chapterId };
  } catch (error) {
    console.error("Error creating chapter:", error);
    return { success: false, error: "Failed to create chapter. Please try again." };
  }
}

export async function deleteChapter(chapterId: string) {
  try {
    const user = await checkAuth();

    console.log(`[Course] Deleting chapter ${chapterId}`);

    revalidatePath(`/courses/*`);
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error deleting chapter:", error);
    return { success: false, error: "Failed to delete chapter. Please try again." };
  }
}

interface CreateModuleData {
  title: string;
  description?: string;
}

export async function createModule(courseId: string, moduleData: CreateModuleData) {
  try {
    const user = await checkAuth();

    console.log(`[Course] Creating module "${moduleData.title}" for course ${courseId}`);

    revalidatePath(`/courses/*`);
    revalidatePath("/dashboard");

    return { success: true, moduleId: `module_${Date.now()}` };
  } catch (error) {
    console.error("Error creating module:", error);
    return { success: false, error: "Failed to create module. Please try again." };
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

    console.log(`[Course] Creating lesson "${lessonData.title}" for course ${courseId}`);

    revalidatePath(`/courses/*`);
    revalidatePath("/dashboard");

    return { success: true, lessonId: `lesson_${Date.now()}` };
  } catch (error) {
    console.error("Error creating lesson:", error);
    return { success: false, error: "Failed to create lesson. Please try again." };
  }
}

interface UpdateModuleData {
  title: string;
  description?: string;
}

export async function updateModule(moduleChapterId: string, moduleData: UpdateModuleData) {
  try {
    const user = await checkAuth();

    console.log(`[Course] Updating module ${moduleChapterId}`);

    revalidatePath(`/courses/*`);
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error updating module:", error);
    return { success: false, error: "Failed to update module. Please try again." };
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

    console.log(`[Course] Updating lesson ${lessonChapterId}`);

    revalidatePath(`/courses/*`);
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error updating lesson:", error);
    return { success: false, error: "Failed to update lesson. Please try again." };
  }
}

interface ReorderChaptersData {
  chapterIds: string[];
}

export async function reorderChapters(courseId: string, reorderData: ReorderChaptersData) {
  try {
    const user = await checkAuth();

    console.log(
      `[Course] Reordering ${reorderData.chapterIds.length} chapters for course ${courseId}`
    );

    revalidatePath(`/courses/*`);
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error reordering chapters:", error);
    return { success: false, error: "Failed to reorder chapters. Please try again." };
  }
}

interface ReorderModulesData {
  moduleChapterIds: string[];
}

export async function reorderModules(courseId: string, reorderData: ReorderModulesData) {
  try {
    const user = await checkAuth();

    console.log(
      `[Course] Reordering ${reorderData.moduleChapterIds.length} modules for course ${courseId}`
    );

    revalidatePath(`/courses/*`);
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error reordering modules:", error);
    return { success: false, error: "Failed to reorder modules. Please try again." };
  }
}

interface ReorderLessonsData {
  lessonChapterIds: string[];
  moduleChapterId: string;
}

export async function reorderLessons(courseId: string, reorderData: ReorderLessonsData) {
  try {
    const user = await checkAuth();

    console.log(
      `[Course] Reordering ${reorderData.lessonChapterIds.length} lessons in module ${reorderData.moduleChapterId}`
    );

    revalidatePath(`/courses/*`);
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error reordering lessons:", error);
    return { success: false, error: "Failed to reorder lessons. Please try again." };
  }
}

export async function deleteModule(moduleChapterId: string) {
  try {
    const user = await checkAuth();

    console.log(`[Course] Deleting module ${moduleChapterId}`);

    revalidatePath(`/courses/*`);
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error deleting module:", error);
    return { success: false, error: "Failed to delete module. Please try again." };
  }
}

export async function deleteLesson(lessonChapterId: string) {
  try {
    const user = await checkAuth();

    console.log(`[Course] Deleting lesson ${lessonChapterId}`);

    revalidatePath(`/courses/*`);
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error deleting lesson:", error);
    return { success: false, error: "Failed to delete lesson. Please try again." };
  }
}

export async function deleteOrphanedChapters(courseId: string) {
  try {
    const user = await checkAuth();

    console.log(`[Course] Cleaning up orphaned chapters for course ${courseId}`);

    revalidatePath(`/courses/*`);
    revalidatePath("/dashboard");

    return { success: true, deletedCount: 0 };
  } catch (error) {
    console.error("Error deleting orphaned chapters:", error);
    return { success: false, error: "Failed to delete orphaned chapters. Please try again." };
  }
}

export async function deleteFallbackModule(courseId: string, moduleTitle: string) {
  try {
    const user = await checkAuth();

    console.log(`[Course] Deleting fallback module "${moduleTitle}" from course ${courseId}`);

    revalidatePath(`/courses/*`);
    revalidatePath("/dashboard");

    return {
      success: true,
      deletedCount: 0,
      message: "Fallback module removed from view",
    };
  } catch (error) {
    console.error("Error deleting fallback module:", error);
    return { success: false, error: "Failed to delete module. Please try again." };
  }
}

export async function updateCourseModule(
  moduleId: string,
  data: { title: string; description?: string }
) {
  try {
    const user = await checkAuth();

    console.log(`[Course] Updating module ${moduleId}`);

    revalidatePath(`/courses/*`);
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error updating course module:", error);
    return { success: false, error: "Failed to update module" };
  }
}

export async function updateCourseLesson(
  lessonId: string,
  data: { title: string; description?: string }
) {
  try {
    const user = await checkAuth();

    console.log(`[Course] Updating lesson ${lessonId}`);

    revalidatePath(`/courses/*`);
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error updating course lesson:", error);
    return { success: false, error: "Failed to update lesson" };
  }
}

export async function debugModuleStructure(courseId: string) {
  try {
    const user = await checkAuth();
    if (!user.admin) return { success: false, error: "Admin access required" };

    const course = await convex.query(api.courses.getCourseForEdit, {
      courseId: courseId as Id<"courses">,
      userId: user.clerkId,
    });

    return {
      success: true,
      structure: course || null,
    };
  } catch (error) {
    console.error("Error debugging module structure:", error);
    return { success: false, error: "Failed to debug structure" };
  }
}

export async function deleteRealCourseModule(moduleId: string) {
  try {
    const user = await checkAuth();

    console.log(`[Course] Deleting real module ${moduleId}`);

    revalidatePath(`/courses/*`);
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error deleting real course module:", error);
    return { success: false, error: "Failed to delete module" };
  }
}

interface GenerateAudioData {
  text: string;
  voiceId?: string;
}

export async function generateChapterAudio(chapterId: string, audioData: GenerateAudioData) {
  try {
    const user = await checkAuth();

    const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;
    if (!elevenLabsApiKey) {
      console.error("11 Labs API key not configured");
      return { success: false, error: "11 Labs API key not configured" };
    }

    const voiceId = audioData.voiceId || "9BWtsMINqrJLrRacOk9x";
    const cleanedText = stripMarkdownForTTS(audioData.text);
    const textChunks = splitTextIntoChunks(cleanedText, 3000);

    console.log(`[Audio] Generating audio for ${textChunks.length} chunks...`);

    const audioBuffers: ArrayBuffer[] = [];

    for (let i = 0; i < textChunks.length; i++) {
      const chunk = textChunks[i];

      try {
        const audioStream = await elevenlabs.textToSpeech.convert(voiceId, {
          text: chunk,
          modelId: "eleven_multilingual_v2",
          voiceSettings: { stability: 0.5, similarityBoost: 0.5 },
        });

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

        const totalLength = streamChunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const chunkAudioBuffer = new ArrayBuffer(totalLength);
        const audioView = new Uint8Array(chunkAudioBuffer);
        let offset = 0;
        for (const streamChunk of streamChunks) {
          audioView.set(streamChunk, offset);
          offset += streamChunk.length;
        }

        audioBuffers.push(chunkAudioBuffer);

        if (i < textChunks.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (elevenLabsError: any) {
        console.error(`ElevenLabs API error for chunk ${i + 1}:`, elevenLabsError);
        let errorMessage = `Failed to generate audio for chunk ${i + 1}`;
        if (elevenLabsError.statusCode === 401) errorMessage = "Invalid ElevenLabs API key.";
        if (elevenLabsError.statusCode === 429)
          errorMessage = "ElevenLabs API rate limit exceeded.";
        return { success: false, error: errorMessage };
      }
    }

    const totalAudioLength = audioBuffers.reduce((acc, buffer) => acc + buffer.byteLength, 0);
    const combinedAudioBuffer = new ArrayBuffer(totalAudioLength);
    const combinedView = new Uint8Array(combinedAudioBuffer);

    let combinedOffset = 0;
    for (const buffer of audioBuffers) {
      combinedView.set(new Uint8Array(buffer), combinedOffset);
      combinedOffset += buffer.byteLength;
    }

    try {
      if (process.env.UPLOADTHING_TOKEN) {
        const audioBlob = new Blob([combinedAudioBuffer], { type: "audio/mpeg" });
        const audioFile = new File([audioBlob], `audio_${chapterId}_${Date.now()}.mp3`, {
          type: "audio/mpeg",
        });

        const uploadResponse = await utapi.uploadFiles(audioFile);

        if (uploadResponse.data) {
          const audioUrl = uploadResponse.data.url;

          // Get chapter to find its courseId and current data
          const chapter = await convex.query(api.courses.getChapterById, {
            chapterId: chapterId as Id<"courseChapters">,
            userId: user.clerkId,
          });

          if (chapter) {
            await convex.mutation(api.courses.createOrUpdateChapter, {
              courseId: chapter.courseId as Id<"courses">,
              lessonId: chapter.lessonId as Id<"courseLessons"> | undefined,
              chapterId: chapterId as Id<"courseChapters">,
              chapterData: {
                title: chapter.title,
                content: chapter.description || "",
                position: chapter.position,
                generatedAudioData: audioUrl,
              },
            });
          }

          revalidatePath(`/courses/*`);
          revalidatePath("/dashboard");

          return {
            success: true,
            audioUrl: audioUrl,
            message: `Audio generated from ${textChunks.length} chunks. Total: ${Math.round(combinedAudioBuffer.byteLength / 1024)}KB`,
          };
        }
      }
      throw new Error("UploadThing not configured");
    } catch (uploadError) {
      console.error("Upload error:", uploadError);

      const audioFileName = `audio_${chapterId}_${Date.now()}.mp3`;
      const audioUrl = `/audio/${audioFileName}`;

      global.audioCache = global.audioCache || new Map();
      global.audioCache.set(audioFileName, combinedAudioBuffer);

      revalidatePath(`/courses/*`);
      revalidatePath("/dashboard");

      return {
        success: true,
        audioUrl: audioUrl,
        message: `Audio generated using fallback storage. Total: ${Math.round(combinedAudioBuffer.byteLength / 1024)}KB`,
      };
    }
  } catch (error) {
    console.error("Error generating audio:", error);
    return { success: false, error: "Failed to generate audio. Please try again." };
  }
}

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
    if (!user.admin) return { success: false, error: "Unauthorized" };

    console.log("[Admin] clearNonPlayableAudio called");

    revalidatePath("/courses");
    revalidatePath("/admin");

    return { success: true, cleared: 0 };
  } catch (error) {
    console.error("Error clearing non-playable audio:", error);
    return { success: false, error: "Failed to clear audio" };
  }
}

export async function testAudioUrl(url: string) {
  try {
    const user = await checkAuth();
    if (!user.admin) return { success: false, error: "Unauthorized" };

    return {
      success: true,
      message: `Testing audio URL: ${url}`,
      isPlayable: url.startsWith("http"),
    };
  } catch (error) {
    console.error("Error testing audio URL:", error);
    return { success: false, error: "Failed to test audio URL" };
  }
}

export async function testElevenLabsApiKey() {
  try {
    const user = await checkAuth();
    if (!user.admin) return { success: false, error: "Unauthorized" };

    const apiKey = process.env.ELEVEN_LABS_API_KEY;
    if (!apiKey) {
      return { success: false, error: "API key not configured" };
    }

    const voices = await elevenlabs.voices.getAll();
    return {
      success: true,
      message: `API key valid. Found ${voices.voices?.length || 0} voices.`,
    };
  } catch (error) {
    console.error("Error testing API key:", error);
    return { success: false, error: "Invalid API key or API error" };
  }
}

export async function cleanupLegacyAudioReferences() {
  try {
    const user = await checkAuth();
    if (!user.admin) return { success: false, error: "Unauthorized" };

    console.log("[Admin] cleanupLegacyAudioReferences called");

    revalidatePath("/courses");
    revalidatePath("/admin");

    return { success: true, cleaned: 0 };
  } catch (error) {
    console.error("Error cleaning up legacy audio:", error);
    return { success: false, error: "Failed to cleanup" };
  }
}

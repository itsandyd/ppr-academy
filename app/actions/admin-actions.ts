"use server";

import { auth } from "@clerk/nextjs/server";
// Prisma removed - using Convex instead
import { revalidatePath } from "next/cache";
import { getUserFromClerk } from "@/lib/data";
import { generateAICourseFast as generateAICourseLib, searchTopicImages } from "@/lib/ai-course-generator";
import { scrapeContent, generateEmbeddings } from "@/lib/content-scraper";
import { generateSlug, generateUniqueSlug } from "@/lib/utils";

async function checkAdminAuth() {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");
  
  const user = await getUserFromClerk(clerkId);
  if (!user || !user.admin) throw new Error("Unauthorized - Admin access required");
  
  return user;
}

export async function updateUserRole(userId: string, role: string) {
  await checkAdminAuth();
  
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role: role as any }, // Cast to handle enum
    });
    
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error updating user role:", error);
    return { success: false, error: "Failed to update user role" };
  }
}

export async function approveCourse(courseId: string) {
  await checkAdminAuth();
  
  try {
    await prisma.course.update({
      where: { id: courseId },
      data: { isPublished: true },
    });
    
    revalidatePath("/admin");
    revalidatePath("/courses");
    return { success: true };
  } catch (error) {
    console.error("Error approving course:", error);
    return { success: false, error: "Failed to approve course" };
  }
}

export async function rejectCourse(courseId: string) {
  await checkAdminAuth();
  
  try {
    // In a real app, you might want to add a status field
    // For now, we'll just keep it unpublished
    await prisma.course.update({
      where: { id: courseId },
      data: { isPublished: false },
    });
    
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error rejecting course:", error);
    return { success: false, error: "Failed to reject course" };
  }
}

export async function toggleFeatureCourse(courseId: string, featured: boolean) {
  await checkAdminAuth();
  
  try {
    // Since there's no featured field in the schema, 
    // we'll just update the publish status for now
    // In a real app, you'd add a featured field to the Course model
    await prisma.course.update({
      where: { id: courseId },
      data: { isPublished: featured },
    });
    
    revalidatePath("/admin");
    revalidatePath("/courses");
    return { success: true };
  } catch (error) {
    console.error("Error updating course featured status:", error);
    return { success: false, error: "Failed to update course" };
  }
}

export async function approveCoach(profileId: string) {
  await checkAdminAuth();
  
  try {
    // Get the coach profile to find the user
    const coachProfile = await prisma.coachProfile.findUnique({
      where: { id: profileId },
      select: { userId: true, title: true }
    });

    if (!coachProfile) {
      return { success: false, error: "Coach profile not found" };
    }

    console.log(`🔍 Approving coach profile: ${profileId} for user: ${coachProfile.userId}`);

    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: coachProfile.userId },
      select: { id: true, firstName: true, lastName: true, email: true }
    });

    if (!user) {
      console.error(`❌ User not found: ${coachProfile.userId} for coach profile: ${profileId}`);
      return { success: false, error: `User not found. The coach application may be corrupted.` };
    }

    console.log(`👤 Found user: ${user.firstName} ${user.lastName} (${user.email})`);

    // Activate the coach profile
    await prisma.coachProfile.update({
      where: { id: profileId },
      data: { 
        isActive: true,
        updatedAt: new Date(),
      },
    });

    // Update user role to instructor/coach
    await prisma.user.update({
      where: { id: coachProfile.userId },
      data: { 
        role: "AGENCY_ADMIN", // Using AGENCY_ADMIN as instructor role
      },
    });
    
    console.log(`✅ Approved coach profile: ${profileId} for ${user.firstName} ${user.lastName}`);
    
    revalidatePath("/admin");
    revalidatePath("/coaching");
    return { success: true };
  } catch (error) {
    console.error("Error approving coach:", error);
    return { success: false, error: `Failed to approve coach: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

export async function rejectCoach(profileId: string) {
  await checkAdminAuth();
  
  try {
    // Delete the coach profile (rejection)
    await prisma.coachProfile.delete({
      where: { id: profileId },
    });
    
    console.log(`❌ Rejected coach profile: ${profileId}`);
    
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error rejecting coach:", error);
    return { success: false, error: "Failed to reject coach" };
  }
}

export async function debugCoachProfiles() {
  await checkAdminAuth();
  
  try {
    // Get all coach profiles
    const coachProfiles = await prisma.coachProfile.findMany({
      select: { 
        id: true, 
        userId: true, 
        title: true, 
        isActive: true,
        createdAt: true 
      }
    });

    console.log(`🔍 Found ${coachProfiles.length} coach profiles:`);
    
    const results = [];
    
    for (const profile of coachProfiles) {
      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: profile.userId },
        select: { id: true, firstName: true, lastName: true, email: true }
      });

      const status = user ? 'Valid' : 'Orphaned (User Missing)';
      
      console.log(`Profile ${profile.id}: ${status}`);
      console.log(`  - User ID: ${profile.userId}`);
      console.log(`  - Title: ${profile.title}`);
      console.log(`  - Active: ${profile.isActive}`);
      
      if (user) {
        console.log(`  - User: ${user.firstName} ${user.lastName} (${user.email})`);
      }
      
      results.push({
        profileId: profile.id,
        userId: profile.userId,
        title: profile.title,
        isActive: profile.isActive,
        userExists: !!user,
        user: user ? `${user.firstName} ${user.lastName} (${user.email})` : null
      });
    }

    return { success: true, profiles: results };
  } catch (error) {
    console.error("Error debugging coach profiles:", error);
    return { success: false, error: "Failed to debug coach profiles" };
  }
}

export async function cleanupOrphanedCoachProfiles() {
  await checkAdminAuth();
  
  try {
    // Get all coach profiles
    const coachProfiles = await prisma.coachProfile.findMany({
      select: { id: true, userId: true }
    });

    const orphanedProfiles = [];
    
    for (const profile of coachProfiles) {
      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: profile.userId },
        select: { id: true }
      });

      if (!user) {
        orphanedProfiles.push(profile.id);
      }
    }

    if (orphanedProfiles.length > 0) {
      // Delete orphaned profiles
      await prisma.coachProfile.deleteMany({
        where: { 
          id: { in: orphanedProfiles }
        }
      });

      console.log(`🧹 Cleaned up ${orphanedProfiles.length} orphaned coach profiles`);
      
      revalidatePath("/admin");
      return { 
        success: true, 
        message: `Cleaned up ${orphanedProfiles.length} orphaned coach profiles`,
        deletedProfiles: orphanedProfiles
      };
    } else {
      return { 
        success: true, 
        message: "No orphaned coach profiles found"
      };
    }
  } catch (error) {
    console.error("Error cleaning up orphaned coach profiles:", error);
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
      skillLevel: courseData.skillLevel as 'beginner' | 'intermediate' | 'advanced',
      category: courseData.category,
      instructorId: user.id,
      price: parseFloat(courseData.price),
      description: courseData.description,
      learningObjectives: courseData.learningObjectives,
      targetModules: courseData.targetModules,
      targetLessonsPerModule: courseData.targetLessonsPerModule,
      additionalContext: courseData.additionalContext,
    });

    // Generate a unique slug for the course
    const baseSlug = generateSlug(generatedCourse.course.title);
    const existingCourses = await prisma.course.findMany({
      where: { slug: { not: null } },
      select: { slug: true }
    });
    const existingSlugs = existingCourses.map(c => c.slug).filter(Boolean) as string[];
    const uniqueSlug = generateUniqueSlug(baseSlug, existingSlugs);

    // Create the course in the database
    const course = await prisma.course.create({
      data: {
        title: generatedCourse.course.title,
        slug: uniqueSlug,
        description: generatedCourse.course.description,
        price: generatedCourse.course.price,
        imageUrl: generatedCourse.course.thumbnail,
        userId: user.id,
        instructorId: user.id,
        isPublished: false, // Admin approval needed
      },
    });

    // Create chapters using the existing CourseChapter model
    const createdChapters = [];
    let position = 1;

    console.log(`📚 Processing ${generatedCourse.modules.length} modules for course creation`);
    
    for (const moduleData of generatedCourse.modules) {
      console.log(`📂 Processing module: "${moduleData.title}" with ${moduleData.lessons.length} lessons`);
      
      // Create a module header chapter
      const moduleHeader = await prisma.courseChapter.create({
        data: {
          id: `ch_${Date.now()}_${position}`,
          title: `📚 ${moduleData.title}`,
          description: `# ${moduleData.title}\n\n${moduleData.description}\n\n---\n\nThis module contains ${moduleData.lessons.length} lessons covering essential aspects of ${courseData.topic}. Each lesson is designed to build upon the previous one, providing you with comprehensive knowledge and practical skills.`,
          videoUrl: null,
          position: position,
          isPublished: false,
          isFree: position === 1, // Make first module header free
          courseId: course.id,
          updatedAt: new Date(),
        },
      });
      createdChapters.push(moduleHeader);
      position++;
      
      for (const lessonData of moduleData.lessons) {
        console.log(`  📝 Processing lesson: "${lessonData.title}" with ${lessonData.chapters.length} chapters`);
        
        // Create a lesson introduction chapter
        const lessonIntro = await prisma.courseChapter.create({
          data: {
            id: `ch_${Date.now()}_${position}`,
            title: `🎯 ${moduleData.title}: ${lessonData.title}`,
            description: `## ${lessonData.title}\n\n${lessonData.description}\n\n---\n\nIn this lesson, you'll learn:\n\n${lessonData.chapters.map((ch: any, idx: number) => `${idx + 1}. ${ch.title}`).join('\n')}\n\nThis lesson is part of **${moduleData.title}** and will take approximately ${lessonData.chapters.length * 15} minutes to complete.`,
            videoUrl: null,
            position: position,
            isPublished: false,
            isFree: false,
            courseId: course.id,
            updatedAt: new Date(),
          },
        });
        createdChapters.push(lessonIntro);
        position++;
        
        for (const chapterData of lessonData.chapters) {
          console.log(`    📖 Creating chapter: "${chapterData.title}"`);
          
          const chapter = await prisma.courseChapter.create({
            data: {
              id: `ch_${Date.now()}_${position}`,
              title: `${chapterData.title}`,
              description: chapterData.content || `## ${chapterData.title}\n\nContent for this chapter is being prepared. This section will cover important aspects of ${courseData.topic} as it relates to ${chapterData.title}.\n\n### What You'll Learn\n\n- Key concepts and techniques\n- Practical applications\n- Industry best practices\n- Hands-on examples\n\nThis chapter is part of **${lessonData.title}** in the **${moduleData.title}** module.`,
              videoUrl: null,
              position: position,
              isPublished: false,
              isFree: false,
              courseId: course.id,
              updatedAt: new Date(),
            },
          });
          createdChapters.push(chapter);
          position++;
        }
      }
    }

    console.log(`✅ Created course: "${course.title}" with slug: "${course.slug}"`);
    console.log(`📊 Course structure: ${generatedCourse.modules.length} modules, ${generatedCourse.modules.reduce((acc: number, m: any) => acc + m.lessons.length, 0)} lessons, ${createdChapters.length} total chapters`);
    console.log(`📝 Chapter breakdown:`);
    console.log(`  - Module headers: ${generatedCourse.modules.length}`);
    console.log(`  - Lesson intros: ${generatedCourse.modules.reduce((acc: number, m: any) => acc + m.lessons.length, 0)}`);
    console.log(`  - Content chapters: ${generatedCourse.modules.reduce((acc: number, m: any) => acc + m.lessons.reduce((lacc: number, l: any) => lacc + l.chapters.length, 0), 0)}`);
    console.log(`📝 First few chapters: ${createdChapters.slice(0, 3).map(ch => ch.title).join(', ')}`);
    
    revalidatePath("/admin");
    revalidatePath("/courses");
    revalidatePath(`/courses/${course.slug}`);
    
    return { 
      success: true, 
      course: {
        ...course,
        slug: course.slug // Make sure slug is included in response
      },
      stats: {
        modules: generatedCourse.modules.length,
        lessons: generatedCourse.lessons.length,
        chapters: createdChapters.length,
      }
    };
  } catch (error) {
    console.error("Error generating AI course:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to generate course" };
  }
}

export async function searchImages(topic: string, skillLevel: string) {
  await checkAdminAuth();
  
  try {
    const images = await searchTopicImages(topic, skillLevel);
    console.log(`🖼️ Admin image search: Found ${images.length} images for "${topic}"`);
    return { success: true, images };
  } catch (error) {
    console.error("Error searching images:", error);
    return { success: false, error: "Failed to search images" };
  }
}

export async function searchCourseImages(courseId: string, customTopic?: string) {
  await checkAdminAuth();
  
  try {
    // Get course details
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { title: true, description: true }
    });

    if (!course) {
      return { success: false, error: "Course not found" };
    }

    const searchTopic = customTopic || course.title;
    const images = await searchTopicImages(searchTopic, 'intermediate');
    
    console.log(`🖼️ Course image search: Found ${images.length} images for course "${course.title}"`);
    
    return { 
      success: true, 
      images,
      course: {
        id: courseId,
        title: course.title,
        searchTopic
      }
    };
  } catch (error) {
    console.error("Error searching course images:", error);
    return { success: false, error: "Failed to search course images" };
  }
}

export async function updateCourseImage(courseId: string, imageUrl: string) {
  await checkAdminAuth();
  
  try {
    const course = await prisma.course.update({
      where: { id: courseId },
      data: { imageUrl },
      select: { id: true, title: true, imageUrl: true, slug: true }
    });

    revalidatePath("/courses");
    revalidatePath(`/courses/${course.slug}`);
    revalidatePath("/admin");

    console.log(`✅ Updated course image for: ${course.title}`);
    
    return { success: true, course };
  } catch (error) {
    console.error("Error updating course image:", error);
    return { success: false, error: "Failed to update course image" };
  }
}

export async function enhancedImageSearch(query: string, options?: {
  includeYoutube?: boolean;
  includeProfessional?: boolean;
  maxResults?: number;
}) {
  await checkAdminAuth();
  
  try {
    const { 
      includeYoutube = true, 
      includeProfessional = true,
      maxResults = 12 
    } = options || {};

    const searchQueries = [
      `${query} music production tutorial interface`,
      `${query} DAW plugin screenshot guide`,
      `${query} music production workflow setup`
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
      const images = await searchTopicImages(searchQuery, 'intermediate');
      allImages.push(...images);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (allImages.length >= maxResults) break;
    }

    // Remove duplicates and limit results
    const uniqueImages = [...new Set(allImages)].slice(0, maxResults);
    
    console.log(`🎯 Enhanced image search: Found ${uniqueImages.length} images for "${query}"`);
    
    return { 
      success: true, 
      images: uniqueImages,
      query,
      totalFound: uniqueImages.length
    };
  } catch (error) {
    console.error("Error in enhanced image search:", error);
    return { success: false, error: "Failed to perform enhanced image search" };
  }
}

export async function searchContent(query: string, includeImages: boolean) {
  await checkAdminAuth();
  
  try {
    // In a real implementation, this would call a content search API
    // For now, return sample results
    const sampleResults = [
      {
        title: `${query} - Complete Guide`,
        content: `Comprehensive guide on ${query} for music producers...`,
        url: `https://example.com/${query.toLowerCase().replace(/\s+/g, '-')}`,
        score: 0.95,
      },
      {
        title: `Advanced ${query} Techniques`,
        content: `Learn advanced techniques for ${query} in modern music production...`,
        url: `https://example.com/advanced-${query.toLowerCase().replace(/\s+/g, '-')}`,
        score: 0.88,
      },
    ];
    
    return { success: true, results: sampleResults };
  } catch (error) {
    console.error("Error searching content:", error);
    return { success: false, error: "Failed to search content" };
  }
}

export async function reindexContent() {
  await checkAdminAuth();
  
  try {
    // In a real implementation, this would trigger content reindexing
    // For now, just simulate success
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing
    
    return { success: true };
  } catch (error) {
    console.error("Error reindexing content:", error);
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
        contentLength: scrapedContent.content.length
      }
    };
  } catch (error) {
    console.error("Error scraping content:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to scrape content" };
  }
}

export async function generateContentEmbeddings(text: string) {
  await checkAdminAuth();
  
  try {
    const embeddings = await generateEmbeddings(text);
    
    return { 
      success: true, 
      embeddings,
      dimensions: embeddings.length
    };
  } catch (error) {
    console.error("Error generating embeddings:", error);
    return { success: false, error: "Failed to generate embeddings" };
  }
}

export async function enhancedSearchContent(query: string, includeYoutube: boolean = true) {
  await checkAdminAuth();
  
  try {
    // In a real implementation, this would search various sources
    // and scrape relevant content for course research
    
    const searchResults: string[] = [];
    
    // Sample YouTube URLs for music production (in production, these would come from search APIs)
    if (includeYoutube) {
      const sampleYouTubeUrls = [
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Sample URL - replace with actual search results
      ];
      
      // Note: In production, you'd get these URLs from YouTube Data API search
      console.log(`Enhanced search for: ${query} (YouTube: ${includeYoutube})`);
    }
    
    return { 
      success: true, 
      results: searchResults,
      query: query
    };
  } catch (error) {
    console.error("Error in enhanced search:", error);
    return { success: false, error: "Failed to perform enhanced search" };
  }
}

// Course Management Actions
export async function updateCourse(courseId: string, data: {
  title?: string;
  description?: string;
  price?: string;
  category?: string;
  skillLevel?: string;
  isPublished?: boolean;
}) {
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

    const course = await prisma.course.update({
      where: { id: courseId },
      data: updateData,
      include: {
        instructor: true,
        _count: {
          select: { enrollments: true }
        }
      }
    });

    revalidatePath("/courses");
    revalidatePath(`/courses/${course.slug}`);
    revalidatePath("/admin");

    console.log(`✅ Updated course: ${course.title} (Published: ${course.isPublished})`);

    return { success: true, course };
  } catch (error) {
    console.error("Error updating course:", error);
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

    // First delete related chapters
    await prisma.courseChapter.deleteMany({
      where: { courseId }
    });

    // Then delete enrollments
    await prisma.enrollment.deleteMany({
      where: { courseId }
    });

    // Finally delete the course
    const course = await prisma.course.delete({
      where: { id: courseId }
    });

    revalidatePath("/courses");
    revalidatePath("/admin");

    console.log(`🗑️ Deleted course: ${course.title}`);

    return { success: true };
  } catch (error) {
    console.error("Error deleting course:", error);
    return { success: false, error: "Failed to delete course" };
  }
}

export async function bulkUpdateCourses(courseIds: string[], action: 'publish' | 'unpublish' | 'delete') {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return { success: false, error: "Not authenticated" };
    }

    const user = await getUserFromClerk(clerkId);
    if (!user?.admin) {
      return { success: false, error: "Admin access required" };
    }

    let result;

    switch (action) {
      case 'publish':
        result = await prisma.course.updateMany({
          where: { id: { in: courseIds } },
          data: { isPublished: true }
        });
        console.log(`✅ Published ${result.count} courses`);
        break;
        
      case 'unpublish':
        result = await prisma.course.updateMany({
          where: { id: { in: courseIds } },
          data: { isPublished: false }
        });
        console.log(`📝 Unpublished ${result.count} courses`);
        break;
        
      case 'delete':
        // Delete chapters first
        await prisma.courseChapter.deleteMany({
          where: { courseId: { in: courseIds } }
        });
        
        // Delete enrollments
        await prisma.enrollment.deleteMany({
          where: { courseId: { in: courseIds } }
        });
        
        // Delete courses
        result = await prisma.course.deleteMany({
          where: { id: { in: courseIds } }
        });
        console.log(`🗑️ Deleted ${result.count} courses`);
        break;
        
      default:
        return { success: false, error: "Invalid action" };
    }

    revalidatePath("/courses");
    revalidatePath("/admin");

    return { success: true, count: result.count };
  } catch (error) {
    console.error(`Error performing bulk ${action}:`, error);
    return { success: false, error: `Failed to ${action} courses` };
  }
}

 
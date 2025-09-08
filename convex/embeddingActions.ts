"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";

// Bulk generate embeddings for all courses (Node.js action)
export const generateAllCourseEmbeddings = action({
  args: {
    userId: v.string(),
    overwrite: v.optional(v.boolean()), // Whether to overwrite existing embeddings
  },
  returns: v.object({
    success: v.boolean(),
    processed: v.number(),
    skipped: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const results = {
      success: true,
      processed: 0,
      skipped: 0,
      errors: [] as string[],
    };

    try {
      // Get all courses
      const courses = await ctx.runQuery(internal.embeddings.getAllCourses, {});
      
      console.log(`Found ${courses.length} courses to process`);

      for (const course of courses) {
        try {
          // Check if course embedding already exists
          const existingCourseEmbeddings = await ctx.runQuery(internal.embeddings.checkExistingEmbeddings, {
            sourceId: course._id,
            sourceType: "course",
          });

          // Process course content
          if (existingCourseEmbeddings === 0 || args.overwrite) {
            if (existingCourseEmbeddings > 0 && args.overwrite) {
              // Delete existing embeddings first
              await ctx.runMutation(internal.embeddings.deleteEmbeddingsBySource, {
                sourceId: course._id,
                sourceType: "course",
              });
            }

            const courseContent = `${course.title}\n${course.description || 'No description available'}`;
            
            await ctx.runMutation(api.rag.addContent, {
              content: courseContent,
              userId: args.userId,
              title: course.title,
              category: course.category || "uncategorized",
              sourceType: "course",
              sourceId: course._id,
              metadata: {
                courseId: course._id,
                skillLevel: course.skillLevel,
                isPublished: course.isPublished,
              },
            });

            results.processed++;
            console.log(`✅ Processed course: ${course.title}`);
          } else {
            results.skipped++;
            console.log(`⏭️ Skipped course (already exists): ${course.title}`);
          }

          // Get and process chapters
          const chapters = await ctx.runQuery(internal.embeddings.getCourseChapters, {
            courseId: course._id,
          });

          for (const chapter of chapters) {
            try {
              const existingChapterEmbeddings = await ctx.runQuery(internal.embeddings.checkExistingEmbeddings, {
                sourceId: chapter._id,
                sourceType: "chapter",
              });

              if (existingChapterEmbeddings === 0 || args.overwrite) {
                if (existingChapterEmbeddings > 0 && args.overwrite) {
                  await ctx.runMutation(internal.embeddings.deleteEmbeddingsBySource, {
                    sourceId: chapter._id,
                    sourceType: "chapter",
                  });
                }

                const chapterContent = `${chapter.title}\n${chapter.description || 'No description available'}`;
                
                await ctx.runMutation(api.rag.addContent, {
                  content: chapterContent,
                  userId: args.userId,
                  title: chapter.title,
                  category: course.category || "uncategorized",
                  sourceType: "chapter",
                  sourceId: chapter._id,
                  metadata: {
                    courseId: course._id,
                    chapterId: chapter._id,
                    position: chapter.position,
                  },
                });

                results.processed++;
                console.log(`✅ Processed chapter: ${chapter.title}`);
              } else {
                results.skipped++;
                console.log(`⏭️ Skipped chapter (already exists): ${chapter.title}`);
              }

              // Add a small delay to avoid rate limiting
              await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
              const errorMsg = `Error processing chapter ${chapter.title}: ${error}`;
              results.errors.push(errorMsg);
              console.error(errorMsg);
            }
          }

          // Add delay between courses to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
          const errorMsg = `Error processing course ${course.title}: ${error}`;
          results.errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      console.log(`🎉 Embedding generation complete! Processed: ${results.processed}, Skipped: ${results.skipped}, Errors: ${results.errors.length}`);

    } catch (error) {
      results.success = false;
      results.errors.push(`Fatal error: ${error}`);
      console.error("Fatal error in bulk embedding generation:", error);
    }

    return results;
  },
});

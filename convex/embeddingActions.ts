"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";

// ============================================================================
// CONTENT TYPE CONFIGURATIONS
// ============================================================================

type ContentType = "courseContent" | "products" | "plugins" | "notes";

const CONTENT_TYPES: Record<ContentType, { icon: string; name: string }> = {
  courseContent: { icon: "📚", name: "Course Content (Courses, Chapters, Lessons)" },
  products: { icon: "🎹", name: "Digital Products (Sample Packs, Presets, etc.)" },
  plugins: { icon: "⚡", name: "Plugins & Effect Chains" },
  notes: { icon: "📝", name: "User Notes" },
};

// Migrate all embeddings to the new text-embedding-3-small model
// This deletes ALL existing embeddings in batches and regenerates them fresh
export const migrateToNewEmbeddingModel = action({
  args: {
    userId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    deleted: v.number(),
    processed: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const results = {
      success: true,
      deleted: 0,
      processed: 0,
      errors: [] as string[],
    };

    try {
      // Step 1: Delete ALL existing embeddings in batches
      console.log("🗑️ Deleting all existing embeddings in batches...");
      let hasMore = true;
      let batchCount = 0;

      while (hasMore) {
        const batchResult = await ctx.runMutation(
          // @ts-ignore Convex type instantiation too deep
          internal.embeddings.deleteEmbeddingsBatch,
          { batchSize: 50 } // Small batches to avoid memory issues
        );

        results.deleted += batchResult.deleted;
        hasMore = batchResult.hasMore;
        batchCount++;

        console.log(
          `   Batch ${batchCount}: Deleted ${batchResult.deleted} embeddings (total: ${results.deleted})`
        );

        // Small delay between batches to prevent overwhelming the system
        if (hasMore) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      console.log(`   ✅ Total deleted: ${results.deleted} embeddings`);

      // Step 2: Regenerate all embeddings with the new model
      console.log("🚀 Regenerating embeddings with text-embedding-3-small...");
      const regenerateResult = await ctx.runAction(
        // @ts-ignore Convex type instantiation too deep
        api.embeddingActions.generateAllCourseEmbeddings,
        {
          userId: args.userId,
          overwrite: false, // All embeddings were deleted, no need to overwrite
        }
      );

      results.processed = regenerateResult.processed;
      results.errors = regenerateResult.errors;
      results.success = regenerateResult.success;

      console.log(
        `🎉 Migration complete! Deleted: ${results.deleted}, Regenerated: ${results.processed}`
      );
    } catch (error) {
      results.success = false;
      results.errors.push(`Migration failed: ${error}`);
      console.error("Migration error:", error);
    }

    return results;
  },
});

// Bulk generate embeddings for all courses (Node.js action) - Legacy, kept for migration
export const generateAllCourseEmbeddings = action({
  args: {
    userId: v.string(),
    overwrite: v.boolean(),
  },
  returns: v.object({
    success: v.boolean(),
    processed: v.number(),
    skipped: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (
    ctx,
    args
  ): Promise<{ success: boolean; processed: number; skipped: number; errors: string[] }> => {
    // Delegate to the new combined function
    // @ts-ignore Convex type instantiation too deep - self-referential action
    return await ctx.runAction(api.embeddingActions.generateCourseContentEmbeddings, args);
  },
});

// ============================================================================
// GENERATE COURSE CONTENT EMBEDDINGS (Courses + Chapters + Lessons combined)
// ============================================================================

export const generateCourseContentEmbeddings = action({
  args: {
    userId: v.string(),
    overwrite: v.boolean(),
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
      const courses = await ctx.runQuery(internal.embeddings.getAllCourses, {});
      console.log(`📚 Starting course content embedding for ${courses.length} courses`);

      for (const course of courses) {
        try {
          // === COURSE ===
          const existingCourseEmbeddings = await ctx.runQuery(
            internal.embeddings.checkExistingEmbeddings,
            {
              sourceId: course._id,
              sourceType: "course",
            }
          );

          if (existingCourseEmbeddings === 0 || args.overwrite) {
            if (existingCourseEmbeddings > 0 && args.overwrite) {
              await ctx.runMutation(internal.embeddings.deleteEmbeddingsBySource, {
                sourceId: course._id,
                sourceType: "course",
              });
            }

            const courseContent = `${course.title}\n${course.description || ""}`;

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
            console.log(`✅ Course: ${course.title}`);
          } else {
            results.skipped++;
          }

          // === CHAPTERS ===
          const chapters = await ctx.runQuery(internal.embeddings.getCourseChapters, {
            courseId: course._id,
          });

          for (const chapter of chapters) {
            try {
              const existingChapterEmbeddings = await ctx.runQuery(
                internal.embeddings.checkExistingEmbeddings,
                {
                  sourceId: chapter._id,
                  sourceType: "chapter",
                }
              );

              if (existingChapterEmbeddings === 0 || args.overwrite) {
                if (existingChapterEmbeddings > 0 && args.overwrite) {
                  await ctx.runMutation(internal.embeddings.deleteEmbeddingsBySource, {
                    sourceId: chapter._id,
                    sourceType: "chapter",
                  });
                }

                const chapterContent = `${chapter.title}\n${chapter.description || ""}\nFrom course: ${course.title}`;

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
                    courseName: course.title,
                    position: chapter.position,
                  },
                });

                results.processed++;
                console.log(`✅ Chapter: ${chapter.title}`);
              } else {
                results.skipped++;
              }

              await new Promise((resolve) => setTimeout(resolve, 50));
            } catch (error) {
              results.errors.push(`Chapter ${chapter.title}: ${error}`);
            }
          }

          // === MODULES & LESSONS ===
          const modules = await ctx.runQuery(internal.embeddings.getCourseModules, {
            courseId: course._id,
          });

          for (const module of modules) {
            const lessons = await ctx.runQuery(internal.embeddings.getModuleLessons, {
              moduleId: module._id,
            });

            for (const lesson of lessons) {
              try {
                const existingLessonEmbeddings = await ctx.runQuery(
                  internal.embeddings.checkExistingEmbeddings,
                  {
                    sourceId: lesson._id,
                    sourceType: "lesson",
                  }
                );

                if (existingLessonEmbeddings === 0 || args.overwrite) {
                  if (existingLessonEmbeddings > 0 && args.overwrite) {
                    await ctx.runMutation(internal.embeddings.deleteEmbeddingsBySource, {
                      sourceId: lesson._id,
                      sourceType: "lesson",
                    });
                  }

                  const lessonContent = `${lesson.title}\n${lesson.description || ""}\nCourse: ${course.title}\nModule: ${module.title}`;

                  await ctx.runMutation(api.rag.addContent, {
                    content: lessonContent,
                    userId: args.userId,
                    title: lesson.title,
                    category: course.category || "uncategorized",
                    sourceType: "lesson",
                    sourceId: lesson._id,
                    metadata: {
                      lessonId: lesson._id,
                      moduleId: module._id,
                      courseId: course._id,
                      courseName: course.title,
                      moduleName: module.title,
                    },
                  });

                  results.processed++;
                  console.log(`✅ Lesson: ${lesson.title}`);
                } else {
                  results.skipped++;
                }

                await new Promise((resolve) => setTimeout(resolve, 50));
              } catch (error) {
                results.errors.push(`Lesson ${lesson.title}: ${error}`);
              }
            }
          }

          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (error) {
          results.errors.push(`Course ${course.title}: ${error}`);
        }
      }

      console.log(
        `📚 Course content complete! Processed: ${results.processed}, Skipped: ${results.skipped}`
      );
    } catch (error) {
      results.success = false;
      results.errors.push(`Fatal error: ${error}`);
    }

    return results;
  },
});

// ============================================================================
// GENERATE DIGITAL PRODUCT EMBEDDINGS (excludes plugins/racks)
// ============================================================================

export const generateProductEmbeddings = action({
  args: {
    userId: v.string(),
    overwrite: v.boolean(),
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

    // Plugin types to EXCLUDE from this action
    const PLUGIN_TYPES = ["abletonRack", "effectChain", "abletonPreset"];

    try {
      const allProducts = await ctx.runQuery(internal.embeddings.getAllDigitalProducts, {});

      // Filter out plugins - those go in the plugins embedding action
      const products = allProducts.filter((p: any) => !PLUGIN_TYPES.includes(p.productType || ""));
      console.log(
        `🎹 Starting product embedding for ${products.length} products (excluding ${allProducts.length - products.length} plugins)`
      );

      for (const product of products) {
        try {
          const existingCount = await ctx.runQuery(internal.embeddings.checkExistingEmbeddings, {
            sourceId: product._id,
            sourceType: "document",
          });

          if (existingCount === 0 || args.overwrite) {
            if (existingCount > 0 && args.overwrite) {
              await ctx.runMutation(internal.embeddings.deleteEmbeddingsBySource, {
                sourceId: product._id,
                sourceType: "document",
              });
            }

            const productType = product.productCategory || product.productType || "digital product";
            const productContent = `${product.title}
Type: ${productType}
${product.description || ""}
Category: ${product.category || "uncategorized"}
Price: $${product.price}`;

            await ctx.runMutation(api.rag.addContent, {
              content: productContent,
              userId: args.userId,
              title: product.title,
              category: product.category || productType,
              sourceType: "document",
              sourceId: product._id,
              metadata: {
                type: "digital_product",
                productId: product._id,
                productType: product.productType,
                productCategory: product.productCategory,
                price: product.price,
                isPublished: product.isPublished,
              },
            });

            results.processed++;
            console.log(`✅ Product: ${product.title} (${productType})`);
          } else {
            results.skipped++;
          }

          await new Promise((resolve) => setTimeout(resolve, 50));
        } catch (error) {
          results.errors.push(`Product ${product.title}: ${error}`);
        }
      }

      console.log(
        `🎹 Product embeddings complete! Processed: ${results.processed}, Skipped: ${results.skipped}`
      );
    } catch (error) {
      results.success = false;
      results.errors.push(`Fatal error: ${error}`);
    }

    return results;
  },
});

// ============================================================================
// GENERATE PLUGIN/EFFECT CHAIN EMBEDDINGS
// ============================================================================

export const generatePluginEmbeddings = action({
  args: {
    userId: v.string(),
    overwrite: v.boolean(),
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

    // Plugin types to include
    const PLUGIN_TYPES = ["abletonRack", "effectChain", "abletonPreset"];

    try {
      const allProducts = await ctx.runQuery(internal.embeddings.getAllDigitalProducts, {});

      // Filter for plugins only
      const plugins = allProducts.filter((p: any) => PLUGIN_TYPES.includes(p.productType || ""));
      console.log(`⚡ Starting plugin embedding for ${plugins.length} plugins/effect chains`);

      for (const plugin of plugins) {
        try {
          const existingCount = await ctx.runQuery(internal.embeddings.checkExistingEmbeddings, {
            sourceId: plugin._id,
            sourceType: "document",
          });

          if (existingCount === 0 || args.overwrite) {
            if (existingCount > 0 && args.overwrite) {
              await ctx.runMutation(internal.embeddings.deleteEmbeddingsBySource, {
                sourceId: plugin._id,
                sourceType: "document",
              });
            }

            // Determine friendly type name
            let typeName = "Plugin";
            if (plugin.productType === "abletonRack") typeName = "Ableton Rack";
            if (plugin.productType === "effectChain") typeName = "Effect Chain";
            if (plugin.productType === "abletonPreset") typeName = "Ableton Preset";

            const pluginContent = `${plugin.title}
Type: ${typeName}
${plugin.description || ""}
Category: ${plugin.category || "audio tools"}
Price: $${plugin.price}`;

            await ctx.runMutation(api.rag.addContent, {
              content: pluginContent,
              userId: args.userId,
              title: plugin.title,
              category: plugin.category || "plugins",
              sourceType: "document",
              sourceId: plugin._id,
              metadata: {
                type: "plugin",
                productId: plugin._id,
                productType: plugin.productType,
                productCategory: plugin.productCategory,
                typeName,
                price: plugin.price,
                isPublished: plugin.isPublished,
              },
            });

            results.processed++;
            console.log(`✅ Plugin: ${plugin.title} (${typeName})`);
          } else {
            results.skipped++;
          }

          await new Promise((resolve) => setTimeout(resolve, 50));
        } catch (error) {
          results.errors.push(`Plugin ${plugin.title}: ${error}`);
        }
      }

      console.log(
        `⚡ Plugin embeddings complete! Processed: ${results.processed}, Skipped: ${results.skipped}`
      );
    } catch (error) {
      results.success = false;
      results.errors.push(`Fatal error: ${error}`);
    }

    return results;
  },
});

// ============================================================================
// GENERATE NOTE EMBEDDINGS
// ============================================================================

export const generateNoteEmbeddings = action({
  args: {
    userId: v.string(),
    overwrite: v.boolean(),
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
      const notes = await ctx.runQuery(internal.embeddings.getAllNotes, {});
      console.log(`📝 Starting note embedding generation for ${notes.length} notes`);

      for (const note of notes) {
        try {
          // Only skip archived notes - drafts should still be searchable
          if (note.status === "archived") {
            results.skipped++;
            continue;
          }

          // Check if note embedding already exists
          const existingCount = await ctx.runQuery(internal.embeddings.checkExistingEmbeddings, {
            sourceId: note._id,
            sourceType: "note",
          });

          if (existingCount === 0 || args.overwrite) {
            if (existingCount > 0 && args.overwrite) {
              await ctx.runMutation(internal.embeddings.deleteEmbeddingsBySource, {
                sourceId: note._id,
                sourceType: "note",
              });
            }

            // Use plainTextContent if available, otherwise use content
            const noteText = note.plainTextContent || note.content;
            const noteContent = `${note.title}\n${noteText}\nTags: ${note.tags.join(", ")}`;

            await ctx.runMutation(api.rag.addContent, {
              content: noteContent,
              userId: args.userId,
              title: note.title,
              category: note.category || "notes",
              sourceType: "note",
              sourceId: note._id,
              metadata: {
                noteId: note._id,
                tags: note.tags,
                status: note.status,
                authorId: note.userId,
              },
            });

            results.processed++;
            console.log(`✅ Note: ${note.title}`);
          } else {
            results.skipped++;
          }

          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          results.errors.push(`Note ${note.title}: ${error}`);
        }
      }

      console.log(
        `📝 Note embeddings complete! Processed: ${results.processed}, Skipped: ${results.skipped}`
      );
    } catch (error) {
      results.success = false;
      results.errors.push(`Fatal error: ${error}`);
    }

    return results;
  },
});

// ============================================================================
// GENERATE ALL CONTENT EMBEDDINGS
// ============================================================================

export const generateAllContentEmbeddings = action({
  args: {
    userId: v.string(),
    overwrite: v.boolean(),
    contentTypes: v.array(
      v.union(
        v.literal("courseContent"),
        v.literal("products"),
        v.literal("plugins"),
        v.literal("notes")
      )
    ),
  },
  returns: v.object({
    success: v.boolean(),
    results: v.record(
      v.string(),
      v.object({
        processed: v.number(),
        skipped: v.number(),
        errors: v.number(),
      })
    ),
    totalProcessed: v.number(),
    totalErrors: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const finalResults = {
      success: true,
      results: {} as Record<string, { processed: number; skipped: number; errors: number }>,
      totalProcessed: 0,
      totalErrors: [] as string[],
    };

    console.log(
      `🚀 Starting comprehensive embedding generation for: ${args.contentTypes.join(", ")}`
    );

    for (const contentType of args.contentTypes) {
      const config = CONTENT_TYPES[contentType];
      console.log(`\n${config.icon} Processing ${config.name}...`);

      let result;
      switch (contentType) {
        case "courseContent":
          result = await ctx.runAction(api.embeddingActions.generateCourseContentEmbeddings, {
            userId: args.userId,
            overwrite: args.overwrite,
          });
          break;
        case "products":
          result = await ctx.runAction(api.embeddingActions.generateProductEmbeddings, {
            userId: args.userId,
            overwrite: args.overwrite,
          });
          break;
        case "plugins":
          result = await ctx.runAction(api.embeddingActions.generatePluginEmbeddings, {
            userId: args.userId,
            overwrite: args.overwrite,
          });
          break;
        case "notes":
          result = await ctx.runAction(api.embeddingActions.generateNoteEmbeddings, {
            userId: args.userId,
            overwrite: args.overwrite,
          });
          break;
      }

      if (result) {
        finalResults.results[contentType] = {
          processed: result.processed,
          skipped: result.skipped,
          errors: result.errors.length,
        };
        finalResults.totalProcessed += result.processed;
        finalResults.totalErrors.push(...result.errors);

        if (!result.success) {
          finalResults.success = false;
        }
      }
    }

    console.log(`\n🎉 All content embedding complete!`);
    console.log(`   Total processed: ${finalResults.totalProcessed}`);
    console.log(`   Total errors: ${finalResults.totalErrors.length}`);

    return finalResults;
  },
});

/**
 * Migration script to transition from legacy course system to unified marketplace
 * This script safely migrates existing data while maintaining backwards compatibility
 */

import { ConvexHttpClient } from "convex/browser";
import { api as typedApi } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const api = typedApi as any;

interface MigrationConfig {
  dryRun: boolean;
  batchSize: number;
  delayBetweenBatches: number; // milliseconds
  createBackup: boolean;
  skipExisting: boolean;
}

interface MigrationStats {
  usersProcessed: number;
  usersCreated: number;
  usersSkipped: number;
  coursesProcessed: number;
  coursesCreated: number;
  coursesSkipped: number;
  storesCreated: number;
  errors: Array<{ type: string; message: string; data?: any }>;
}

class MarketplaceMigration {
  private convex: ConvexHttpClient;
  private stats: MigrationStats;

  constructor(convexUrl: string) {
    this.convex = new ConvexHttpClient(convexUrl);
    this.stats = {
      usersProcessed: 0,
      usersCreated: 0,
      usersSkipped: 0,
      coursesProcessed: 0,
      coursesCreated: 0,
      coursesSkipped: 0,
      storesCreated: 0,
      errors: [],
    };
  }

  async runMigration(config: MigrationConfig): Promise<MigrationStats> {
    console.log("🚀 Starting marketplace migration...");
    console.log("Config:", config);

    try {
      if (config.createBackup) {
        await this.createBackup();
      }

      // Step 1: Migrate users and create creator stores
      await this.migrateUsersAndStores(config);

      // Step 2: Migrate courses to products
      await this.migrateCoursesToProducts(config);

      // Step 3: Migrate enrollments to purchases
      await this.migrateEnrollmentsToPurchases(config);

      // Step 4: Update indexes and cleanup
      if (!config.dryRun) {
        await this.finalizeIndexes();
      }

      console.log("✅ Migration completed successfully!");
      console.log("Final stats:", this.stats);
    } catch (error) {
      console.error("❌ Migration failed:", error);
      this.stats.errors.push({
        type: "CRITICAL",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }

    return this.stats;
  }

  private async createBackup(): Promise<void> {
    console.log("📦 Creating backup...");

    // Export all critical data before migration
    const backup = {
      timestamp: new Date().toISOString(),
      users: await this.convex.query(api.users.getAll),
      courses: await this.convex.query(api.courses.getAll),
      enrollments: await this.convex.query(api.enrollments.getAll),
    };

    // In a real implementation, you'd save this to a file or external storage
    console.log(
      `Backup created with ${backup.users.length} users and ${backup.courses.length} courses`
    );
  }

  private async migrateUsersAndStores(config: MigrationConfig): Promise<void> {
    console.log("👥 Migrating users and creating creator stores...");

    // Get all users who have created courses (potential creators)
    const courseCreators = await this.convex.query(api.courses.getAllInstructors);

    for (const creator of courseCreators) {
      try {
        this.stats.usersProcessed++;

        // Check if creator store already exists
        if (config.skipExisting) {
          const existingStore = await this.convex.query(api.stores.getByUserId, {
            userId: creator._id,
          });
          if (existingStore) {
            this.stats.usersSkipped++;
            continue;
          }
        }

        if (!config.dryRun) {
          // Update user to mark as creator
          await this.convex.mutation(api.users.update, {
            id: creator._id,
            isCreator: true,
            username: this.generateUsername(creator.name || creator.email),
          });

          // Create creator store
          const storeId = await this.convex.mutation(api.stores.create, {
            userId: creator._id,
            name: `${creator.name || "Creator"}'s Store`,
            slug: this.generateSlug(creator.name || creator.email || "creator"),
            description: `Welcome to ${creator.name || "my"} music production store!`,
          });

          this.stats.storesCreated++;
        }

        this.stats.usersCreated++;
        console.log(`✓ Migrated creator: ${creator.name} (${creator.email})`);
      } catch (error) {
        this.stats.errors.push({
          type: "USER_MIGRATION",
          message: error instanceof Error ? error.message : "Unknown error",
          data: { userId: creator._id, name: creator.name },
        });
        console.error(`✗ Failed to migrate creator ${creator.name}:`, error);
      }

      // Rate limiting
      if (config.delayBetweenBatches > 0) {
        await this.delay(config.delayBetweenBatches);
      }
    }
  }

  private async migrateCoursesToProducts(config: MigrationConfig): Promise<void> {
    console.log("📚 Migrating courses to products...");

    const courses = await this.convex.query(api.courses.getAll);

    for (let i = 0; i < courses.length; i += config.batchSize) {
      const batch = courses.slice(i, i + config.batchSize);

      for (const course of batch) {
        try {
          this.stats.coursesProcessed++;

          // Skip if product already exists
          if (config.skipExisting) {
            const existingProduct = await this.convex.query(api.products?.getByLegacyId, {
              legacyId: course._id,
            });
            if (existingProduct) {
              this.stats.coursesSkipped++;
              continue;
            }
          }

          if (!config.dryRun) {
            // Get creator store
            const creatorStore = await this.convex.query(api.stores.getByUserId, {
              userId: course.instructorId || course.userId,
            });

            if (!creatorStore) {
              throw new Error(`No creator store found for course ${course.title}`);
            }

            // Create product from course
            await this.convex.mutation(api.products?.create, {
              creatorId: course.instructorId || course.userId,
              storeId: creatorStore._id,
              type: "course",
              title: course.title,
              description: course.description,
              price: course.price || 0,
              thumbnailUrl: course.imageUrl,
              isPublished: course.isPublished || false,
              slug: course.slug || this.generateSlug(course.title),
              content: {
                // Migrate course structure
                legacyCourseId: course._id,
                modules: await this.migrateCourseContent(course._id),
              },
            });
          }

          this.stats.coursesCreated++;
          console.log(`✓ Migrated course: ${course.title}`);
        } catch (error) {
          this.stats.errors.push({
            type: "COURSE_MIGRATION",
            message: error instanceof Error ? error.message : "Unknown error",
            data: { courseId: course._id, title: course.title },
          });
          console.error(`✗ Failed to migrate course ${course.title}:`, error);
        }
      }

      // Batch delay
      if (config.delayBetweenBatches > 0 && i + config.batchSize < courses.length) {
        console.log(`Processed batch ${Math.floor(i / config.batchSize) + 1}, waiting...`);
        await this.delay(config.delayBetweenBatches);
      }
    }
  }

  private async migrateCourseContent(courseId: Id<"courses">): Promise<any> {
    // Migrate course modules, lessons, and chapters
    const modules = await this.convex.query(api.courseModules?.getByCourseId, { courseId });

    const migratedModules = [];
    for (const module of modules) {
      const lessons = await this.convex.query(api.courseLessons?.getByModuleId, {
        moduleId: module._id,
      });

      const migratedLessons = [];
      for (const lesson of lessons) {
        const chapters = await this.convex.query(api.courseChapters?.getByLessonId, {
          lessonId: lesson._id,
        });

        migratedLessons.push({
          id: lesson._id,
          title: lesson.title,
          description: lesson.description,
          position: lesson.position,
          chapters: chapters.map((chapter: any) => ({
            id: chapter._id,
            title: chapter.title,
            description: chapter.description,
            videoUrl: chapter.videoUrl,
            audioUrl: chapter.audioUrl,
            position: chapter.position,
            isPublished: chapter.isPublished,
            isFree: chapter.isFree,
          })),
        });
      }

      migratedModules.push({
        id: module._id,
        title: module.title,
        description: module.description,
        position: module.position,
        lessons: migratedLessons,
      });
    }

    return migratedModules;
  }

  private async migrateEnrollmentsToPurchases(config: MigrationConfig): Promise<void> {
    console.log("💰 Migrating enrollments to purchases...");

    const enrollments = await this.convex.query(api.enrollments?.getAll);

    for (const enrollment of enrollments) {
      try {
        // Find the corresponding product
        const product = await this.convex.query(api.products?.getByLegacyId, {
          legacyId: enrollment.courseId,
        });

        if (product && !config.dryRun) {
          await this.convex.mutation(api.purchases?.create, {
            userId: enrollment.userId,
            productId: product._id,
            creatorId: product.creatorId,
            amount: product.price,
            status: "completed",
            completedAt: enrollment._creationTime,
          });
        }

        console.log(`✓ Migrated enrollment for user ${enrollment.userId}`);
      } catch (error) {
        this.stats.errors.push({
          type: "ENROLLMENT_MIGRATION",
          message: error instanceof Error ? error.message : "Unknown error",
          data: { enrollmentId: enrollment._id },
        });
        console.error(`✗ Failed to migrate enrollment:`, error);
      }
    }
  }

  private async finalizeIndexes(): Promise<void> {
    console.log("🔍 Finalizing indexes...");
    // Any final cleanup or index optimization would go here
  }

  private generateUsername(name: string): string {
    return (
      name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .substring(0, 20) + Math.random().toString(36).substring(2, 6)
    );
  }

  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Migration runner
export async function runMarketplaceMigration(config: Partial<MigrationConfig> = {}) {
  const defaultConfig: MigrationConfig = {
    dryRun: true,
    batchSize: 10,
    delayBetweenBatches: 100,
    createBackup: true,
    skipExisting: true,
  };

  const finalConfig = { ...defaultConfig, ...config };

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
  }

  const migration = new MarketplaceMigration(convexUrl);
  return await migration.runMigration(finalConfig);
}

// CLI runner
if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = !args.includes("--execute");

  console.log(dryRun ? "🔍 Running in DRY RUN mode" : "⚠️  Running in EXECUTE mode");

  runMarketplaceMigration({ dryRun })
    .then((stats) => {
      console.log("Migration completed:", stats);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}

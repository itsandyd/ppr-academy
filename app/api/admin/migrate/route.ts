/**
 * API route for running the marketplace migration
 * This provides a safe way to run migrations with proper authentication
 * and monitoring capabilities
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-helpers';
import { checkRateLimit, getRateLimitIdentifier, rateLimiters } from '@/lib/rate-limit';
import { runMarketplaceMigration } from '@/scripts/migrate-to-marketplace';
import { features } from '@/lib/features';

// Only allow migrations in development or with specific env flag
const MIGRATION_ENABLED = 
  process.env.NODE_ENV === 'development' || 
  process.env.ENABLE_DATA_MIGRATION === 'true';

interface MigrationRequest {
  dryRun?: boolean;
  batchSize?: number;
  delayBetweenBatches?: number;
  createBackup?: boolean;
  skipExisting?: boolean;
  adminPassword?: string;
}

export async function POST(request: NextRequest) {
  try {
    // ✅ SECURITY: Require admin authentication
    const user = await requireAdmin();
    
    // ✅ SECURITY: Rate limiting (very strict - migrations are critical)
    const identifier = getRateLimitIdentifier(request, user.id);
    const rateCheck = await checkRateLimit(identifier, rateLimiters.strict);
    if (rateCheck instanceof NextResponse) {
      return rateCheck;
    }
    
    // Check if migrations are enabled
    if (!MIGRATION_ENABLED) {
      return NextResponse.json(
        { error: 'Migrations are not enabled in this environment' },
        { status: 403 }
      );
    }

    const body: MigrationRequest = await request.json();

    // Additional security check for production-like environments
    if (!body.dryRun && process.env.NODE_ENV !== 'development') {
      const requiredPassword = process.env.MIGRATION_ADMIN_PASSWORD;
      if (!requiredPassword || body.adminPassword !== requiredPassword) {
        return NextResponse.json(
          { error: 'Admin password required for destructive operations' },
          { status: 403 }
        );
      }
    }

    // Default to dry run for safety
    const migrationConfig = {
      dryRun: body.dryRun ?? true,
      batchSize: body.batchSize ?? 10,
      delayBetweenBatches: body.delayBetweenBatches ?? 100,
      createBackup: body.createBackup ?? true,
      skipExisting: body.skipExisting ?? true,
    };

    console.log('🚀 Starting migration with config:', migrationConfig);

    // Run migration
    const stats = await runMarketplaceMigration(migrationConfig);

    return NextResponse.json({
      success: true,
      message: 'Migration completed',
      stats,
      config: migrationConfig,
    });

  } catch (error) {
    console.error('Migration API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Migration failed',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId || !ADMIN_USER_IDS.includes(userId)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Return migration status and configuration
    return NextResponse.json({
      enabled: MIGRATION_ENABLED,
      features: {
        useNewMarketplace: features.useNewMarketplace,
        useSimplifiedSchema: features.useSimplifiedSchema,
        enableDataMigration: features.enableDataMigration,
        parallelSystemRun: features.parallelSystemRun,
      },
      environment: process.env.NODE_ENV,
      convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL,
    });

  } catch (error) {
    console.error('Migration status API error:', error);
    
    return NextResponse.json(
      { error: 'Failed to get migration status' },
      { status: 500 }
    );
  }
}
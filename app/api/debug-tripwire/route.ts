import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

/**
 * Debug endpoint to help diagnose 403 errors in the admin migrate tripwire
 * This endpoint provides detailed information about the current configuration
 * and authentication state to help identify why the migrate endpoint returns 403
 */

export async function GET(request: NextRequest) {
  try {
    // Get authentication info
    const authResult = await auth();
    const { userId } = authResult;

    // Check environment configuration
    const migrationEnabled = 
      process.env.NODE_ENV === 'development' || 
      process.env.ENABLE_DATA_MIGRATION === 'true';

    const adminUserIds = process.env.ADMIN_USER_IDS?.split(',').map(id => id.trim()) || [];
    const hasAdminPassword = !!process.env.MIGRATION_ADMIN_PASSWORD;
    const hasClerkKeys = !!(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);

    // Determine user's admin status
    const isAdmin = userId ? adminUserIds.includes(userId) : false;

    // Analyze potential issues
    const issues = [];
    const solutions = [];

    if (!migrationEnabled) {
      issues.push('Migrations are disabled in this environment');
      solutions.push('Set ENABLE_DATA_MIGRATION=true in your deployment environment variables');
    }

    if (!hasClerkKeys) {
      issues.push('Clerk authentication keys are missing');
      solutions.push('Ensure NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY are configured');
    }

    if (adminUserIds.length === 0) {
      issues.push('No admin users configured');
      solutions.push('Set ADMIN_USER_IDS environment variable with comma-separated user IDs');
    }

    if (!userId) {
      issues.push('User is not authenticated');
      solutions.push('Make sure you are logged in with a valid Clerk session');
    } else if (!isAdmin) {
      issues.push('Current user is not in the admin list');
      solutions.push(`Add your user ID (${userId}) to the ADMIN_USER_IDS environment variable`);
    }

    if (process.env.NODE_ENV === 'production' && !hasAdminPassword) {
      issues.push('Admin password not configured for production');
      solutions.push('Set MIGRATION_ADMIN_PASSWORD environment variable for production deployments');
    }

    // Determine the most likely cause of 403
    let primaryCause = 'Unknown';
    if (!migrationEnabled) {
      primaryCause = 'Migrations disabled';
    } else if (!userId) {
      primaryCause = 'Not authenticated';
    } else if (!isAdmin) {
      primaryCause = 'Not an admin user';
    } else if (adminUserIds.length === 0) {
      primaryCause = 'No admin users configured';
    }

    const response = {
      timestamp: new Date().toISOString(),
      endpoint: '/api/admin/migrate',
      status: issues.length === 0 ? 'healthy' : 'issues_detected',
      
      // Authentication info
      authentication: {
        isAuthenticated: !!userId,
        userId: userId || null,
        isAdmin,
        clerkConfigured: hasClerkKeys
      },

      // Environment configuration
      configuration: {
        environment: process.env.NODE_ENV || 'unknown',
        migrationEnabled,
        adminUsersCount: adminUserIds.length,
        adminUserIds: adminUserIds.length > 0 ? adminUserIds : ['none configured'],
        hasAdminPassword,
        convexConfigured: !!process.env.NEXT_PUBLIC_CONVEX_URL
      },

      // Issue analysis
      analysis: {
        primaryCause,
        issuesFound: issues.length,
        issues,
        solutions
      },

      // Test commands (without sensitive data)
      testCommands: {
        getStatus: `GET ${request.nextUrl.origin}/api/admin/migrate`,
        postDryRun: `POST ${request.nextUrl.origin}/api/admin/migrate`,
        sampleBody: {
          dryRun: true,
          batchSize: 10,
          ...(process.env.NODE_ENV === 'production' ? { adminPassword: 'YOUR_ADMIN_PASSWORD' } : {})
        }
      },

      // Next steps
      nextSteps: issues.length === 0 
        ? [
            'Configuration looks good!',
            'Try accessing the migrate endpoint directly',
            'If still getting 403, check browser network tab for detailed error'
          ]
        : [
            'Fix the configuration issues listed above',
            'Redeploy your application',
            'Test the migrate endpoint again'
          ]
    };

    return NextResponse.json(response, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Debug tripwire error:', error);
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to analyze tripwire configuration',
      hint: 'This might indicate a deeper configuration issue with Clerk or environment setup'
    }, { status: 500 });
  }
}

// Also provide a simple POST endpoint for testing auth flow
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        hint: 'Make sure you are logged in'
      }, { status: 401 });
    }

    const adminUserIds = process.env.ADMIN_USER_IDS?.split(',').map(id => id.trim()) || [];
    const isAdmin = adminUserIds.includes(userId);

    if (!isAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Admin access required',
        userId,
        configuredAdmins: adminUserIds,
        hint: `Add your user ID (${userId}) to ADMIN_USER_IDS environment variable`
      }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      message: 'Authentication successful',
      userId,
      isAdmin: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
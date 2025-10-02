#!/usr/bin/env node

/**
 * Debug script to help diagnose 403 errors in the admin migrate tripwire endpoint
 * Run this to check your deployment configuration
 */

const https = require('https');
const http = require('http');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnvironmentVariables() {
  log('\n🔍 Checking Environment Variables...', 'blue');
  
  const requiredEnvVars = {
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY': process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    'CLERK_SECRET_KEY': process.env.CLERK_SECRET_KEY ? '***CONFIGURED***' : undefined,
    'ADMIN_USER_IDS': process.env.ADMIN_USER_IDS,
    'ENABLE_DATA_MIGRATION': process.env.ENABLE_DATA_MIGRATION,
    'MIGRATION_ADMIN_PASSWORD': process.env.MIGRATION_ADMIN_PASSWORD ? '***CONFIGURED***' : undefined,
    'NODE_ENV': process.env.NODE_ENV,
    'NEXT_PUBLIC_CONVEX_URL': process.env.NEXT_PUBLIC_CONVEX_URL
  };

  let allConfigured = true;
  
  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (value) {
      log(`  ✅ ${key}: ${value}`, 'green');
    } else {
      log(`  ❌ ${key}: NOT SET`, 'red');
      allConfigured = false;
    }
  }

  if (!allConfigured) {
    log('\n⚠️  Missing environment variables detected!', 'yellow');
    log('This is likely the cause of your 403 error.', 'yellow');
  }

  return allConfigured;
}

function analyzeConfiguration() {
  log('\n🔧 Configuration Analysis...', 'blue');
  
  // Check if migrations are enabled
  const migrationEnabled = process.env.NODE_ENV === 'development' || process.env.ENABLE_DATA_MIGRATION === 'true';
  if (migrationEnabled) {
    log('  ✅ Migrations are enabled', 'green');
  } else {
    log('  ❌ Migrations are DISABLED', 'red');
    log('    To enable: Set ENABLE_DATA_MIGRATION=true in production', 'yellow');
  }

  // Check admin user IDs
  const adminUserIds = process.env.ADMIN_USER_IDS?.split(',') || [];
  if (adminUserIds.length > 0) {
    log(`  ✅ Admin users configured: ${adminUserIds.length} user(s)`, 'green');
    adminUserIds.forEach((id, index) => {
      log(`    ${index + 1}. ${id.trim()}`, 'blue');
    });
  } else {
    log('  ❌ No admin users configured (ADMIN_USER_IDS)', 'red');
  }

  // Check environment
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    log('  🚀 Running in PRODUCTION mode', 'yellow');
    const hasAdminPassword = !!process.env.MIGRATION_ADMIN_PASSWORD;
    if (hasAdminPassword) {
      log('  ✅ Admin password configured for production', 'green');
    } else {
      log('  ⚠️  No admin password set (MIGRATION_ADMIN_PASSWORD)', 'yellow');
      log('    This is required for non-dry-run operations in production', 'yellow');
    }
  } else {
    log(`  🛠️  Running in ${process.env.NODE_ENV || 'unknown'} mode`, 'blue');
  }
}

function generateCurlCommands() {
  log('\n📋 Test Commands...', 'blue');
  
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  log(`\n1. Test GET request (check status):`, 'green');
  log(`curl -X GET "${baseUrl}/api/admin/migrate" \\`, 'blue');
  log(`  -H "Authorization: Bearer YOUR_CLERK_SESSION_TOKEN"`, 'blue');

  log(`\n2. Test POST request (dry run):`, 'green');
  log(`curl -X POST "${baseUrl}/api/admin/migrate" \\`, 'blue');
  log(`  -H "Content-Type: application/json" \\`, 'blue');
  log(`  -H "Authorization: Bearer YOUR_CLERK_SESSION_TOKEN" \\`, 'blue');
  log(`  -d '{"dryRun": true}'`, 'blue');

  log(`\n📝 To get your Clerk session token:`, 'yellow');
  log(`1. Open browser dev tools`, 'yellow');
  log(`2. Go to Application/Storage > Cookies`, 'yellow');
  log(`3. Look for __session cookie value`, 'yellow');
  log(`4. Use that as your Bearer token`, 'yellow');
}

function provideSolutions() {
  log('\n💡 Common Solutions for 403 Errors:', 'blue');
  
  log('\n1. Missing ADMIN_USER_IDS:', 'yellow');
  log('   - Get your Clerk user ID from the Clerk dashboard', 'reset');
  log('   - Set ADMIN_USER_IDS=user_abc123,user_def456 in your deployment', 'reset');
  
  log('\n2. Migrations disabled in production:', 'yellow');
  log('   - Set ENABLE_DATA_MIGRATION=true in your deployment environment', 'reset');
  
  log('\n3. Authentication issues:', 'yellow');
  log('   - Ensure NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY are set', 'reset');
  log('   - Make sure you\'re authenticated when making the request', 'reset');
  
  log('\n4. Missing admin password (for production):', 'yellow');
  log('   - Set MIGRATION_ADMIN_PASSWORD=your_secure_password', 'reset');
  log('   - Include "adminPassword": "your_secure_password" in request body', 'reset');

  log('\n5. Deployment-specific issues:', 'yellow');
  log('   - Vercel: Check Environment Variables in dashboard', 'reset');
  log('   - Railway: Check Variables tab in project settings', 'reset');
  log('   - Netlify: Check Site settings > Environment variables', 'reset');
}

async function testEndpoint(url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const req = protocol.request(url + '/api/admin/migrate', {
      method: 'GET',
      headers: {
        'User-Agent': 'tripwire-debug-script'
      }
    }, (res) => {
      resolve({
        status: res.statusCode,
        headers: res.headers,
        accessible: true
      });
    });

    req.on('error', (err) => {
      resolve({
        status: null,
        error: err.message,
        accessible: false
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        status: null,
        error: 'Timeout',
        accessible: false
      });
    });

    req.end();
  });
}

async function main() {
  log('🔥 Tripwire 403 Debug Tool', 'red');
  log('================================', 'red');
  
  // Check environment variables
  const envConfigured = checkEnvironmentVariables();
  
  // Analyze configuration
  analyzeConfiguration();
  
  // Test endpoint if URL is available
  const testUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_APP_URL;
    
  if (testUrl) {
    log('\n🌐 Testing Endpoint Accessibility...', 'blue');
    const result = await testEndpoint(testUrl);
    
    if (result.accessible) {
      if (result.status === 401) {
        log('  ✅ Endpoint accessible, returns 401 (authentication required)', 'green');
        log('  This is expected - you need to be authenticated', 'yellow');
      } else if (result.status === 403) {
        log('  ⚠️  Endpoint returns 403 (forbidden)', 'yellow');
        log('  This confirms your issue - likely missing admin permissions', 'yellow');
      } else {
        log(`  ℹ️  Endpoint returns ${result.status}`, 'blue');
      }
    } else {
      log(`  ❌ Cannot reach endpoint: ${result.error}`, 'red');
    }
  }
  
  // Generate curl commands
  generateCurlCommands();
  
  // Provide solutions
  provideSolutions();
  
  log('\n🎯 Next Steps:', 'green');
  if (!envConfigured) {
    log('1. Configure missing environment variables in your deployment', 'yellow');
    log('2. Redeploy your application', 'yellow');
    log('3. Test the endpoint again', 'yellow');
  } else {
    log('1. Make sure you\'re authenticated with a user ID in ADMIN_USER_IDS', 'yellow');
    log('2. Check that ENABLE_DATA_MIGRATION=true in production', 'yellow');
    log('3. Use the curl commands above to test', 'yellow');
  }
  
  log('\n✨ Happy debugging!', 'green');
}

main().catch(console.error);
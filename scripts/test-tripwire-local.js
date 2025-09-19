#!/usr/bin/env node

/**
 * Local test script for the tripwire endpoint
 * This helps verify the endpoint works locally before debugging deployment issues
 */

const http = require('http');

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;

async function testEndpoint(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'tripwire-test-script'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
            parseError: true
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing Tripwire Endpoint Locally');
  console.log('=====================================\n');

  try {
    // Test 1: Debug endpoint
    console.log('1. Testing debug endpoint...');
    const debugResult = await testEndpoint('/api/debug-tripwire');
    console.log(`   Status: ${debugResult.status}`);
    
    if (debugResult.status === 200) {
      console.log('   ✅ Debug endpoint working');
      console.log(`   Issues found: ${debugResult.data.analysis?.issuesFound || 0}`);
      
      if (debugResult.data.analysis?.issues?.length > 0) {
        console.log('   Issues:');
        debugResult.data.analysis.issues.forEach((issue, i) => {
          console.log(`     ${i + 1}. ${issue}`);
        });
      }
    } else {
      console.log('   ❌ Debug endpoint failed');
      console.log(`   Error: ${debugResult.data?.error || 'Unknown'}`);
    }

    // Test 2: Migrate endpoint GET
    console.log('\n2. Testing migrate endpoint (GET)...');
    const migrateGetResult = await testEndpoint('/api/admin/migrate');
    console.log(`   Status: ${migrateGetResult.status}`);
    
    if (migrateGetResult.status === 200) {
      console.log('   ✅ Migrate GET working');
    } else if (migrateGetResult.status === 401) {
      console.log('   ⚠️  Authentication required (expected if not logged in)');
    } else if (migrateGetResult.status === 403) {
      console.log('   ❌ Forbidden - this is your issue!');
      console.log(`   Error: ${migrateGetResult.data?.error || 'Unknown'}`);
    } else {
      console.log(`   ❓ Unexpected status: ${migrateGetResult.status}`);
    }

    // Test 3: Migrate endpoint POST (dry run)
    console.log('\n3. Testing migrate endpoint (POST - dry run)...');
    const migratePostResult = await testEndpoint('/api/admin/migrate', 'POST', {
      dryRun: true,
      batchSize: 1
    });
    console.log(`   Status: ${migratePostResult.status}`);
    
    if (migratePostResult.status === 200) {
      console.log('   ✅ Migrate POST working');
    } else if (migratePostResult.status === 401) {
      console.log('   ⚠️  Authentication required (expected if not logged in)');
    } else if (migratePostResult.status === 403) {
      console.log('   ❌ Forbidden - this is your issue!');
      console.log(`   Error: ${migratePostResult.data?.error || 'Unknown'}`);
    } else {
      console.log(`   ❓ Unexpected status: ${migratePostResult.status}`);
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure your Next.js dev server is running:');
      console.log('   npm run dev');
      console.log('   # or');
      console.log('   yarn dev');
    }
  }

  console.log('\n🎯 Next Steps:');
  console.log('1. If tests pass locally but fail in deployment:');
  console.log('   - Check environment variables in your deployment platform');
  console.log('   - Verify ADMIN_USER_IDS contains your Clerk user ID');
  console.log('   - Set ENABLE_DATA_MIGRATION=true for production');
  console.log('');
  console.log('2. If tests fail locally:');
  console.log('   - Check your .env.local file');
  console.log('   - Make sure Clerk is properly configured');
  console.log('   - Verify you\'re logged in with an admin user');
}

// Check if server is running first
async function checkServer() {
  try {
    await testEndpoint('/api/debug-tripwire');
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('❌ Cannot connect to local server');
    console.log(`Make sure your Next.js server is running on port ${PORT}`);
    console.log('\nStart it with:');
    console.log('  npm run dev');
    console.log('  # or');
    console.log('  yarn dev');
    process.exit(1);
  }

  await runTests();
}

main().catch(console.error);
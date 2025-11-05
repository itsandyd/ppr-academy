import { ConvexHttpClient } from "convex/browser";
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
const ADMIN_CLERK_ID = process.env.ADMIN_CLERK_ID;

if (!CONVEX_URL) {
  throw new Error('NEXT_PUBLIC_CONVEX_URL not found in environment variables');
}

if (!ADMIN_CLERK_ID) {
  throw new Error('ADMIN_CLERK_ID not found in environment variables');
}

const client = new ConvexHttpClient(CONVEX_URL);

async function clearPlugins() {
  try {
    console.log('🗑️  Starting plugin data cleanup...\n');

    const result = await client.action('importPlugins:clearAllPlugins' as any, {
      clerkId: ADMIN_CLERK_ID,
    });

    console.log('\n✅ Cleanup completed!\n');
    console.log('📊 Deleted Records:');
    console.log(`  - Plugins: ${result.deleted.plugins}`);
    console.log(`  - Plugin Types: ${result.deleted.pluginTypes}`);
    console.log(`  - Plugin Categories: ${result.deleted.pluginCategories}`);
    console.log(`  - Effect Categories: ${result.deleted.effectCategories}`);
    console.log(`  - Instrument Categories: ${result.deleted.instrumentCategories}`);
    console.log(`  - Studio Tool Categories: ${result.deleted.studioToolCategories}`);
    
    console.log('\n✨ Database is now ready for a fresh import!\n');

  } catch (error: any) {
    console.error('\n❌ Cleanup failed:', error.message);
    process.exit(1);
  }
}

// Run the cleanup
clearPlugins();


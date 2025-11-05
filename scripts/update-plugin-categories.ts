import { ConvexHttpClient } from "convex/browser";
import * as fs from 'fs';
import * as path from 'path';
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

async function updatePluginCategories() {
  try {
    console.log('🔄 Starting plugin category update...\n');

    // Read the JSON file
    const jsonPath = path.join(process.cwd(), 'plugin-import.json');
    
    if (!fs.existsSync(jsonPath)) {
      throw new Error('plugin-import.json not found in project root');
    }

    const jsonData = fs.readFileSync(jsonPath, 'utf-8');
    
    console.log('📁 JSON file loaded successfully\n');

    // Call the Convex update action
    const result = await client.action('importPlugins:updatePluginCategories' as any, {
      clerkId: ADMIN_CLERK_ID,
      jsonData: jsonData,
    });

    console.log('\n✅ Update completed!\n');
    console.log('📊 Statistics:');
    console.log(`  - Effect Categories Imported: ${result.stats.effectCategories}`);
    console.log(`  - Instrument Categories Imported: ${result.stats.instrumentCategories}`);
    console.log(`  - Studio Tool Categories Imported: ${result.stats.studioToolCategories}`);
    console.log(`  - Plugins Updated: ${result.stats.pluginsUpdated}`);
    console.log(`  - Plugins Skipped: ${result.stats.pluginsSkipped}`);
    
    if (result.stats.pluginsError > 0) {
      console.log(`  - Plugins Failed: ${result.stats.pluginsError}`);
    }

    if (result.errors && result.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      result.errors.slice(0, 10).forEach((error: string, index: number) => {
        console.log(`  ${index + 1}. ${error}`);
      });
      if (result.errors.length > 10) {
        console.log(`  ... and ${result.errors.length - 10} more errors`);
      }
    }

    console.log('\n✨ Update process finished!\n');

  } catch (error: any) {
    console.error('\n❌ Update failed:', error.message);
    
    if (error.message.includes('Unauthorized')) {
      console.error('\n💡 Make sure your ADMIN_CLERK_ID is correct and the user has admin privileges.');
    }
    
    process.exit(1);
  }
}

// Run the update
updatePluginCategories();


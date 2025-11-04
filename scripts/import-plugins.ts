import { ConvexHttpClient } from "convex/browser";
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
const ADMIN_CLERK_ID = process.env.ADMIN_CLERK_ID; // Add this to your .env.local

if (!CONVEX_URL) {
  throw new Error('NEXT_PUBLIC_CONVEX_URL not found in environment variables');
}

if (!ADMIN_CLERK_ID) {
  throw new Error('ADMIN_CLERK_ID not found in environment variables. Add your Clerk ID to .env.local');
}

const client = new ConvexHttpClient(CONVEX_URL);

async function importPlugins() {
  try {
    console.log('🔄 Starting plugin import...\n');

    // Read the JSON file
    const jsonPath = path.join(process.cwd(), 'plugin-import.json');
    
    if (!fs.existsSync(jsonPath)) {
      throw new Error('plugin-import.json not found in project root');
    }

    const jsonData = fs.readFileSync(jsonPath, 'utf-8');
    
    console.log('📁 JSON file loaded successfully');
    console.log(`📊 File size: ${(jsonData.length / 1024).toFixed(2)} KB\n`);

    // Call the Convex import action
    const result = await client.action('importPlugins:importPluginsFromJSON' as any, {
      clerkId: ADMIN_CLERK_ID,
      jsonData: jsonData,
    });

    console.log('\n✅ Import completed!\n');
    console.log('📊 Statistics:');
    console.log(`  - Plugin Types: ${result.stats.pluginTypes}`);
    console.log(`  - Plugin Categories: ${result.stats.pluginCategories}`);
    console.log(`  - Effect Categories: ${result.stats.effectCategories}`);
    console.log(`  - Instrument Categories: ${result.stats.instrumentCategories}`);
    console.log(`  - Studio Tool Categories: ${result.stats.studioToolCategories}`);
    console.log(`  - Plugins Imported: ${result.stats.pluginsSuccess}`);
    
    if (result.stats.pluginsError > 0) {
      console.log(`  - Plugins Failed: ${result.stats.pluginsError}`);
    }

    if (result.errors && result.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      result.errors.forEach((error: string, index: number) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    console.log('\n✨ Import process finished!\n');

  } catch (error: any) {
    console.error('\n❌ Import failed:', error.message);
    
    if (error.message.includes('Unauthorized')) {
      console.error('\n💡 Make sure your ADMIN_CLERK_ID is correct and the user has admin privileges.');
    }
    
    process.exit(1);
  }
}

// Run the import
importPlugins();


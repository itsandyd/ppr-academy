import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function exportPluginData() {
  try {
    console.log('🔄 Starting plugin data export...\n');

    // Fetch all plugin types
    const pluginTypes = await prisma.pluginType.findMany({
      orderBy: { createdAt: 'asc' },
    });
    console.log(`✓ Fetched ${pluginTypes.length} plugin types`);

    // Fetch all plugin categories
    const pluginCategories = await prisma.pluginCategory.findMany({
      orderBy: { createdAt: 'asc' },
    });
    console.log(`✓ Fetched ${pluginCategories.length} plugin categories`);

    // Fetch effect categories
    const pluginEffectCategories = await prisma.pluginEffectCategory.findMany({
      orderBy: { createdAt: 'asc' },
    });
    console.log(`✓ Fetched ${pluginEffectCategories.length} effect categories`);

    // Fetch instrument categories
    const pluginInstrumentCategories = await prisma.pluginInstrumentCategory.findMany({
      orderBy: { createdAt: 'asc' },
    });
    console.log(`✓ Fetched ${pluginInstrumentCategories.length} instrument categories`);

    // Fetch studio tool categories
    const pluginStudioToolCategories = await prisma.pluginStudioToolCategory.findMany({
      orderBy: { createdAt: 'asc' },
    });
    console.log(`✓ Fetched ${pluginStudioToolCategories.length} studio tool categories`);

    // Fetch all plugins with their relations
    const plugins = await prisma.plugin.findMany({
      include: {
        category: true,
        pluginType: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    console.log(`✓ Fetched ${plugins.length} plugins`);

    // Prepare export data
    const exportData = {
      exportedAt: new Date().toISOString(),
      pluginTypes,
      pluginCategories,
      pluginEffectCategories,
      pluginInstrumentCategories,
      pluginStudioToolCategories,
      plugins,
    };

    // Write to JSON file
    const outputPath = path.join(process.cwd(), 'plugin-export.json');
    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
    console.log(`\n✅ Export completed successfully!`);
    console.log(`📁 File saved to: ${outputPath}`);

    // Also create a backup with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(process.cwd(), `plugin-export-${timestamp}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(exportData, null, 2));
    console.log(`📁 Backup saved to: ${backupPath}`);

    console.log('\n📊 Export Summary:');
    console.log(`  - Plugin Types: ${pluginTypes.length}`);
    console.log(`  - Plugin Categories: ${pluginCategories.length}`);
    console.log(`  - Effect Categories: ${pluginEffectCategories.length}`);
    console.log(`  - Instrument Categories: ${pluginInstrumentCategories.length}`);
    console.log(`  - Studio Tool Categories: ${pluginStudioToolCategories.length}`);
    console.log(`  - Total Plugins: ${plugins.length}`);

  } catch (error) {
    console.error('❌ Export failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

exportPluginData()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


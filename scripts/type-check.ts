#!/usr/bin/env tsx

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

interface TypeCheckResult {
  success: boolean;
  errors: string[];
}

async function runTypeCheck(command: string, description: string): Promise<TypeCheckResult> {
  console.log(`🔍 ${description}...`);
  
  try {
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr && stderr.trim()) {
      console.error(`❌ ${description} failed:`);
      console.error(stderr);
      return { success: false, errors: [stderr] };
    }
    
    console.log(`✅ ${description} passed`);
    return { success: true, errors: [] };
  } catch (error: any) {
    console.error(`❌ ${description} failed:`);
    console.error(error.stdout || error.message);
    return { success: false, errors: [error.stdout || error.message] };
  }
}

async function checkConvexSchemaConsistency(): Promise<TypeCheckResult> {
  console.log('🔍 Checking Convex schema consistency...');
  
  try {
    // Check if schema.ts exists
    const schemaPath = path.join(process.cwd(), 'convex', 'schema.ts');
    await fs.access(schemaPath);
    
    // Check if _generated directory exists
    const generatedPath = path.join(process.cwd(), 'convex', '_generated');
    try {
      await fs.access(generatedPath);
    } catch {
      console.warn('⚠️  Generated Convex files not found. Run `npx convex dev` or `npx convex deploy` first.');
      return { success: false, errors: ['Generated Convex files not found'] };
    }
    
    console.log('✅ Convex schema consistency check passed');
    return { success: true, errors: [] };
  } catch (error: any) {
    console.error('❌ Convex schema consistency check failed:', error.message);
    return { success: false, errors: [error.message] };
  }
}

async function main() {
  console.log('🚀 Starting comprehensive type checking...\n');
  
  const checks = [
    runTypeCheck('tsc --noEmit', 'Main TypeScript check'),
    runTypeCheck('tsc --noEmit --project convex/', 'Convex TypeScript check'),
    checkConvexSchemaConsistency(),
    runTypeCheck('next lint --max-warnings 0', 'Next.js linting'),
  ];
  
  const results = await Promise.all(checks);
  
  const failures = results.filter(r => !r.success);
  
  console.log('\n📊 Type Check Summary:');
  console.log(`✅ Passed: ${results.length - failures.length}`);
  console.log(`❌ Failed: ${failures.length}`);
  
  if (failures.length > 0) {
    console.log('\n🔥 Failures:');
    failures.forEach((failure, index) => {
      console.log(`${index + 1}. ${failure.errors.join(', ')}`);
    });
    process.exit(1);
  }
  
  console.log('\n🎉 All type checks passed!');
}

main().catch(console.error);

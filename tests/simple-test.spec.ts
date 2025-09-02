import { test, expect } from '@playwright/test';

test('Course Marketplace Responsive Test', async ({ page }) => {
  const viewports = [
    { name: 'Small Mobile', width: 360, height: 780 },
    { name: 'iPhone 12', width: 390, height: 844 },
    { name: 'iPhone 11 Pro', width: 414, height: 896 },
    { name: 'iPad', width: 768, height: 1024 },
    { name: 'Desktop', width: 1280, height: 800 }
  ];

  console.log('\n📱 Course Marketplace Responsive Testing Results:\n');
  console.log('| Viewport | URL | Horizontal Scroll | Issues |');
  console.log('|----------|-----|------------------|--------|');

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    
    try {
      // Test course landing page
      await page.goto('http://localhost:3002/courses/test-8');
      await page.waitForLoadState('networkidle');
      
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      
      const issues = hasHorizontalScroll ? '⚠️ Horizontal scroll' : '✅ No issues';
      
      console.log(`| ${viewport.name} | /courses/test-8 | ${hasHorizontalScroll ? 'YES' : 'NO'} | ${issues} |`);
      
    } catch (error) {
      console.log(`| ${viewport.name} | /courses/test-8 | ERROR | ❌ Page failed to load |`);
    }
  }
});

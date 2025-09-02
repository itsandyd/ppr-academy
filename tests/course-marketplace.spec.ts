import { test, expect } from '@playwright/test';

const viewports = [
  { name: 'Small Mobile', width: 360, height: 780 },
  { name: 'iPhone 12', width: 390, height: 844 },
  { name: 'iPhone 11 Pro', width: 414, height: 896 },
  { name: 'iPad', width: 768, height: 1024 },
  { name: 'Desktop', width: 1280, height: 800 }
];

const testUrls = [
  { name: 'Courses Page', url: 'http://localhost:3002/courses' },
  { name: 'Course Landing', url: 'http://localhost:3002/courses/test-8' },
  { name: 'Store Page', url: 'http://localhost:3002/ppr' },
];

for (const viewport of viewports) {
  test.describe(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
    });

    for (const testUrl of testUrls) {
      test(`${testUrl.name} - Responsive Design`, async ({ page }) => {
        // Navigate to page
        await page.goto(testUrl.url);
        
        // Wait for network idle
        await page.waitForLoadState('networkidle');
        
        // Take screenshot
        await page.screenshot({ 
          path: `tests/screenshots/${viewport.name.replace(' ', '-')}-${testUrl.name.replace(' ', '-')}.png`,
          fullPage: true 
        });
        
        // Check for horizontal overflow
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });
        
        // Check for accessibility issues
        const accessibilityTree = await page.accessibility.snapshot();
        
        // Log results
        console.log(`${viewport.name} - ${testUrl.name}:`);
        console.log(`  Horizontal Overflow: ${hasHorizontalScroll ? 'YES' : 'NO'}`);
        console.log(`  Accessibility Nodes: ${accessibilityTree?.children?.length || 0}`);
        
        // Assertions
        expect(hasHorizontalScroll).toBe(false);
        expect(page.locator('body')).toBeVisible();
      });
    }
  });
}

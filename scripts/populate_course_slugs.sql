-- PlanetScale MySQL Script: Populate Course Slugs
-- This script safely adds slugs to courses that don't have them
-- Run this script in your PlanetScale database console

-- First, let's see what courses need slugs
SELECT 
    id, 
    title, 
    slug,
    createdAt
FROM Course 
WHERE slug IS NULL OR slug = '' 
ORDER BY createdAt ASC;

-- Create a temporary table to generate unique slugs
-- Note: PlanetScale doesn't support stored procedures, so we'll use a different approach

-- Step 1: Generate base slugs for courses without slugs
UPDATE Course 
SET slug = CONCAT(
    LOWER(
        TRIM(
            REGEXP_REPLACE(
                REGEXP_REPLACE(
                    REGEXP_REPLACE(title, '[^a-zA-Z0-9\\s\\-]', ''),
                    '[\\s_-]+', '-'
                ),
                '^-+|-+$', ''
            )
        )
    ),
    '-',
    SUBSTRING(id, 1, 8)  -- Add part of the ID to ensure uniqueness
)
WHERE slug IS NULL OR slug = '';

-- Step 2: Handle any remaining edge cases (very short titles, etc.)
UPDATE Course 
SET slug = CONCAT('course-', SUBSTRING(id, 1, 12))
WHERE slug IS NULL OR slug = '' OR LENGTH(slug) < 3;

-- Step 3: Verify the results
SELECT 
    id,
    title,
    slug,
    LENGTH(slug) as slug_length,
    createdAt
FROM Course 
WHERE slug IS NOT NULL AND slug != ''
ORDER BY createdAt DESC
LIMIT 20;

-- Step 4: Check for any duplicates (should be none due to ID suffix)
SELECT 
    slug, 
    COUNT(*) as count 
FROM Course 
WHERE slug IS NOT NULL 
GROUP BY slug 
HAVING COUNT(*) > 1;

-- Step 5: Final verification - count courses with and without slugs
SELECT 
    'With Slug' as status,
    COUNT(*) as count
FROM Course 
WHERE slug IS NOT NULL AND slug != ''
UNION ALL
SELECT 
    'Without Slug' as status,
    COUNT(*) as count
FROM Course 
WHERE slug IS NULL OR slug = ''; 
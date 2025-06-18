-- PlanetScale MySQL Script: Populate Course Slugs (Simple & Safe)
-- This script safely adds slugs to courses that don't have them
-- Run each section one at a time in your PlanetScale database console

-- STEP 1: Check current state (run this first)
SELECT 
    COUNT(*) as total_courses,
    SUM(CASE WHEN slug IS NULL OR slug = '' THEN 1 ELSE 0 END) as courses_without_slug,
    SUM(CASE WHEN slug IS NOT NULL AND slug != '' THEN 1 ELSE 0 END) as courses_with_slug
FROM Course;

-- STEP 2: See which courses need slugs (run this to preview)
SELECT 
    id, 
    title, 
    slug,
    createdAt
FROM Course 
WHERE slug IS NULL OR slug = '' 
ORDER BY createdAt ASC
LIMIT 10;

-- STEP 3: Generate slugs for courses without them (run this to update)
-- This uses a simple approach with ID suffix to guarantee uniqueness
UPDATE Course 
SET slug = CONCAT(
    LOWER(
        REPLACE(
            REPLACE(
                REPLACE(
                    REPLACE(
                        REPLACE(
                            REPLACE(
                                REPLACE(
                                    REPLACE(
                                        REPLACE(
                                            REPLACE(title, ' ', '-'),
                                            '&', 'and'
                                        ),
                                        '!', ''
                                    ),
                                    '?', ''
                                ),
                                '.', ''
                            ),
                            ',', ''
                        ),
                        ':', ''
                    ),
                    ';', ''
                ),
                '(', ''
            ),
            ')', ''
        )
    ),
    '-',
    SUBSTRING(id, 1, 8)
)
WHERE slug IS NULL OR slug = '';

-- STEP 4: Clean up any double dashes or trailing dashes
UPDATE Course 
SET slug = TRIM(TRAILING '-' FROM REPLACE(slug, '--', '-'))
WHERE slug LIKE '%-%-%' OR slug LIKE '%-';

-- STEP 5: Handle edge cases (very short or empty slugs)
UPDATE Course 
SET slug = CONCAT('course-', SUBSTRING(id, 1, 12))
WHERE slug IS NULL OR slug = '' OR LENGTH(slug) < 5;

-- STEP 6: Verify results (run this to check)
SELECT 
    id,
    title,
    slug,
    LENGTH(slug) as slug_length
FROM Course 
WHERE slug IS NOT NULL AND slug != ''
ORDER BY createdAt DESC
LIMIT 10;

-- STEP 7: Final count check
SELECT 
    COUNT(*) as total_courses,
    SUM(CASE WHEN slug IS NULL OR slug = '' THEN 1 ELSE 0 END) as still_without_slug,
    SUM(CASE WHEN slug IS NOT NULL AND slug != '' THEN 1 ELSE 0 END) as now_with_slug
FROM Course; 
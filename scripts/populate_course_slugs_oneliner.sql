-- One-liner to populate course slugs (PlanetScale MySQL)
-- Run this single command to add slugs to all courses that don't have them

UPDATE Course 
SET slug = CONCAT(
    LOWER(
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
            )
        )
    ),
    '-',
    SUBSTRING(id, 1, 8)
)
WHERE slug IS NULL OR slug = '';

-- Verify the update
SELECT COUNT(*) as courses_updated FROM Course WHERE slug IS NOT NULL AND slug != ''; 
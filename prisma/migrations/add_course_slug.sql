-- Migration to add slug field to Course table
-- This should be run manually when DATABASE_URL is configured

-- Add slug column to Course table
ALTER TABLE `Course` ADD COLUMN `slug` VARCHAR(191) NOT NULL UNIQUE;

-- Add index for better performance
CREATE INDEX `Course_slug_idx` ON `Course`(`slug`);

-- Populate existing courses with slugs based on their titles
-- Note: This assumes no duplicate slugs will be created
UPDATE `Course` SET `slug` = LOWER(
  TRIM(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(title, '[^a-zA-Z0-9\\s\\-]', ''),
        '[\\s_-]+', '-'
      ),
      '^-+|-+$', ''
    )
  )
) WHERE `slug` IS NULL OR `slug` = '';

-- Handle potential duplicates by appending numbers
-- This is a simplified approach - in production you might want a more sophisticated solution 
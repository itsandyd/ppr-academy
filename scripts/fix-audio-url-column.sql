-- Fix audioUrl column type to handle large audio data
-- Run this script in PlanetScale to ensure the column can store large base64 audio data

ALTER TABLE `CourseChapter` MODIFY COLUMN `audioUrl` TEXT; 
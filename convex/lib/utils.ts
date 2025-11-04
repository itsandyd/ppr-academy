// Utility functions for Convex queries/mutations

/**
 * Generate a URL-friendly slug from a string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores with -
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing -
}

/**
 * Parse a date string to timestamp
 */
export function parseDate(dateString: string): number {
  return new Date(dateString).getTime();
}

/**
 * Format a timestamp to date string
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toISOString();
}


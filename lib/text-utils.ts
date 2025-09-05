/**
 * Utility functions for text processing and cleaning
 */

/**
 * Legacy alias for cleanTextForSpeech - strips HTML tags from a string
 * @deprecated Use cleanTextForSpeech instead
 */
export function stripHtmlTags(html: string): string {
  return cleanTextForSpeech(html);
}

/**
 * Cleans HTML content to plain text suitable for text-to-speech APIs
 * Removes all HTML tags, entities, and formatting artifacts
 */
export function cleanTextForSpeech(htmlContent: string): string {
  if (!htmlContent || typeof htmlContent !== 'string') {
    return '';
  }

  let cleanText = htmlContent;

  // Remove HTML tags
  cleanText = cleanText.replace(/<[^>]*>/g, '');

  // Convert HTML entities back to regular characters
  const htmlEntities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&copy;': '©',
    '&reg;': '®',
    '&trade;': '™',
    '&hellip;': '...',
    '&mdash;': '—',
    '&ndash;': '–',
    '&lsquo;': '\'',
    '&rsquo;': '\'',
    '&ldquo;': '"',
    '&rdquo;': '"',
  };

  // Replace HTML entities
  Object.entries(htmlEntities).forEach(([entity, replacement]) => {
    cleanText = cleanText.replace(new RegExp(entity, 'g'), replacement);
  });

  // Handle numeric HTML entities (e.g., &#8217;)
  cleanText = cleanText.replace(/&#(\d+);/g, (match, num) => {
    return String.fromCharCode(parseInt(num, 10));
  });

  // Handle hex HTML entities (e.g., &#x2019;)
  cleanText = cleanText.replace(/&#x([0-9a-f]+);/gi, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });

  // Remove extra whitespace and line breaks
  cleanText = cleanText.replace(/\s+/g, ' ');
  
  // Remove leading/trailing whitespace
  cleanText = cleanText.trim();

  // Ensure proper sentence spacing (single space after periods)
  cleanText = cleanText.replace(/\.\s+/g, '. ');

  // Remove multiple consecutive periods
  cleanText = cleanText.replace(/\.{3,}/g, '...');

  return cleanText;
}

/**
 * Extract images from HTML content
 * Returns array of image URLs found in the HTML
 */
export function extractImagesFromHtml(htmlContent: string): string[] {
  if (!htmlContent || typeof htmlContent !== 'string') {
    return [];
  }

  const imageRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  const images: string[] = [];
  let match;

  while ((match = imageRegex.exec(htmlContent)) !== null) {
    images.push(match[1]);
  }

  return images;
}

/**
 * Validate if text is suitable for speech synthesis
 * Checks length, content quality, etc.
 */
export function validateTextForSpeech(text: string): {
  isValid: boolean;
  errors: string[];
  wordCount: number;
  characterCount: number;
} {
  const errors: string[] = [];
  const wordCount = text.trim().split(/\s+/).length;
  const characterCount = text.length;

  // Check minimum length
  if (characterCount < 10) {
    errors.push('Text is too short (minimum 10 characters)');
  }

  // Check maximum length (ElevenLabs has limits)
  if (characterCount > 5000) {
    errors.push('Text is too long (maximum 5000 characters)');
  }

  // Check if text is mostly meaningful content
  const meaningfulCharCount = text.replace(/[^a-zA-Z0-9\s]/g, '').length;
  if (meaningfulCharCount < characterCount * 0.5) {
    errors.push('Text contains too many special characters or symbols');
  }

  // Check for empty or whitespace-only content
  if (!text.trim()) {
    errors.push('Text is empty or contains only whitespace');
  }

  return {
    isValid: errors.length === 0,
    errors,
    wordCount,
    characterCount,
  };
}

/**
 * Preview cleaned text with statistics
 * Useful for showing users what will be sent to TTS
 */
export function previewCleanedText(htmlContent: string) {
  const cleanedText = cleanTextForSpeech(htmlContent);
  const validation = validateTextForSpeech(cleanedText);
  const images = extractImagesFromHtml(htmlContent);

  return {
    originalHtml: htmlContent,
    cleanedText,
    validation,
    images,
    estimatedDuration: Math.ceil(validation.wordCount / 150), // ~150 words per minute average reading speed
  };
}

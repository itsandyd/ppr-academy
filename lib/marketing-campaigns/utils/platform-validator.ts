import { Platform, platformMeta } from "../types";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate content length for a platform
 */
export function validateContentLength(
  platform: Platform,
  content: string
): ValidationResult {
  const meta = platformMeta.find((m) => m.id === platform);
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!meta) {
    return { valid: true, errors: [], warnings: [] };
  }

  const length = content.length;
  const limit = meta.characterLimit;

  if (limit && length > limit) {
    errors.push(
      `Content exceeds ${platform} character limit: ${length}/${limit} characters`
    );
  } else if (limit && length > limit * 0.9) {
    warnings.push(
      `Content is approaching ${platform} limit: ${length}/${limit} characters`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate hashtag count for a platform
 */
export function validateHashtagCount(
  platform: Platform,
  hashtags: string[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const limits: Record<Platform, { max: number; recommended: number }> = {
    email: { max: 0, recommended: 0 },
    instagram: { max: 30, recommended: 10 },
    twitter: { max: 5, recommended: 2 },
    facebook: { max: 10, recommended: 3 },
    linkedin: { max: 5, recommended: 3 },
    tiktok: { max: 5, recommended: 4 },
  };

  const limit = limits[platform];
  const count = hashtags.length;

  if (count > limit.max) {
    errors.push(
      `Too many hashtags for ${platform}: ${count}/${limit.max} max`
    );
  } else if (count > limit.recommended) {
    warnings.push(
      `Consider using fewer hashtags for ${platform}: ${count} used, ${limit.recommended} recommended`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate email content
 */
export function validateEmailContent(content: {
  subject?: string;
  previewText?: string;
  body?: string;
}): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Subject line validation
  if (!content.subject || content.subject.trim() === "") {
    errors.push("Email subject is required");
  } else if (content.subject.length > 100) {
    warnings.push(
      `Email subject may be truncated: ${content.subject.length} characters (recommended: under 50)`
    );
  } else if (content.subject.length > 50) {
    warnings.push(
      `Consider shorter email subject: ${content.subject.length} characters (recommended: under 50)`
    );
  }

  // Preview text validation
  if (content.previewText && content.previewText.length > 150) {
    warnings.push(
      `Email preview text may be truncated: ${content.previewText.length} characters (recommended: under 100)`
    );
  }

  // Body validation
  if (!content.body || content.body.trim() === "") {
    errors.push("Email body is required");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate Twitter/X content
 */
export function validateTwitterContent(content: {
  tweet?: string;
  hashtags?: string[];
}): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!content.tweet || content.tweet.trim() === "") {
    errors.push("Tweet content is required");
  } else {
    // Calculate total length including hashtags
    const hashtagString = content.hashtags
      ? content.hashtags.map((h) => `#${h}`).join(" ")
      : "";
    const totalLength = content.tweet.length + (hashtagString ? hashtagString.length + 1 : 0);

    if (totalLength > 280) {
      errors.push(
        `Tweet exceeds character limit: ${totalLength}/280 characters (including hashtags)`
      );
    } else if (totalLength > 250) {
      warnings.push(
        `Tweet is approaching limit: ${totalLength}/280 characters`
      );
    }
  }

  if (content.hashtags) {
    const hashtagResult = validateHashtagCount("twitter", content.hashtags);
    errors.push(...hashtagResult.errors);
    warnings.push(...hashtagResult.warnings);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate Instagram content
 */
export function validateInstagramContent(content: {
  caption?: string;
  hashtags?: string[];
}): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!content.caption || content.caption.trim() === "") {
    errors.push("Instagram caption is required");
  } else if (content.caption.length > 2200) {
    errors.push(
      `Instagram caption exceeds limit: ${content.caption.length}/2200 characters`
    );
  } else if (content.caption.length > 2000) {
    warnings.push(
      `Instagram caption is approaching limit: ${content.caption.length}/2200 characters`
    );
  }

  if (content.hashtags) {
    const hashtagResult = validateHashtagCount("instagram", content.hashtags);
    errors.push(...hashtagResult.errors);
    warnings.push(...hashtagResult.warnings);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate TikTok content
 */
export function validateTikTokContent(content: {
  caption?: string;
  hashtags?: string[];
  hookLine?: string;
}): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!content.caption || content.caption.trim() === "") {
    errors.push("TikTok caption is required");
  } else if (content.caption.length > 150) {
    errors.push(
      `TikTok caption exceeds limit: ${content.caption.length}/150 characters`
    );
  } else if (content.caption.length > 120) {
    warnings.push(
      `TikTok caption is approaching limit: ${content.caption.length}/150 characters`
    );
  }

  if (content.hashtags) {
    const hashtagResult = validateHashtagCount("tiktok", content.hashtags);
    errors.push(...hashtagResult.errors);
    warnings.push(...hashtagResult.warnings);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate Facebook content
 */
export function validateFacebookContent(content: {
  post?: string;
}): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!content.post || content.post.trim() === "") {
    errors.push("Facebook post content is required");
  } else if (content.post.length > 63206) {
    errors.push("Facebook post exceeds maximum length");
  } else if (content.post.length > 500) {
    // Facebook shows "See more" after about 480 characters
    warnings.push(
      "Facebook post will be truncated with 'See more': consider keeping it under 500 characters for full visibility"
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate LinkedIn content
 */
export function validateLinkedInContent(content: {
  post?: string;
  hashtags?: string[];
}): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!content.post || content.post.trim() === "") {
    errors.push("LinkedIn post content is required");
  } else if (content.post.length > 3000) {
    errors.push(
      `LinkedIn post exceeds limit: ${content.post.length}/3000 characters`
    );
  } else if (content.post.length > 2500) {
    warnings.push(
      `LinkedIn post is approaching limit: ${content.post.length}/3000 characters`
    );
  }

  if (content.hashtags) {
    const hashtagResult = validateHashtagCount("linkedin", content.hashtags);
    errors.push(...hashtagResult.errors);
    warnings.push(...hashtagResult.warnings);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate all platform content for a campaign
 */
export function validateAllPlatformContent(content: {
  email?: { subject?: string; previewText?: string; body?: string };
  instagram?: { caption?: string; hashtags?: string[] };
  twitter?: { tweet?: string; hashtags?: string[] };
  facebook?: { post?: string };
  linkedin?: { post?: string; hashtags?: string[] };
  tiktok?: { caption?: string; hashtags?: string[]; hookLine?: string };
}): Record<Platform, ValidationResult> {
  return {
    email: content.email
      ? validateEmailContent(content.email)
      : { valid: true, errors: [], warnings: [] },
    instagram: content.instagram
      ? validateInstagramContent(content.instagram)
      : { valid: true, errors: [], warnings: [] },
    twitter: content.twitter
      ? validateTwitterContent(content.twitter)
      : { valid: true, errors: [], warnings: [] },
    facebook: content.facebook
      ? validateFacebookContent(content.facebook)
      : { valid: true, errors: [], warnings: [] },
    linkedin: content.linkedin
      ? validateLinkedInContent(content.linkedin)
      : { valid: true, errors: [], warnings: [] },
    tiktok: content.tiktok
      ? validateTikTokContent(content.tiktok)
      : { valid: true, errors: [], warnings: [] },
  };
}

/**
 * Get overall validation status
 */
export function getOverallValidation(
  results: Record<Platform, ValidationResult>
): { valid: boolean; totalErrors: number; totalWarnings: number } {
  let valid = true;
  let totalErrors = 0;
  let totalWarnings = 0;

  for (const result of Object.values(results)) {
    if (!result.valid) valid = false;
    totalErrors += result.errors.length;
    totalWarnings += result.warnings.length;
  }

  return { valid, totalErrors, totalWarnings };
}

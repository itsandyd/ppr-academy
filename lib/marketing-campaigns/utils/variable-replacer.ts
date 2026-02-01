import { MarketingCampaignTemplate, TemplateVariable } from "../types";

/**
 * Replace template variables in a string with actual values
 */
export function replaceVariables(
  content: string,
  values: Record<string, string>,
  variables: TemplateVariable[]
): string {
  let result = content;

  // Replace each variable with its value or default
  for (const variable of variables) {
    const value = values[variable.key] || variable.defaultValue || "";
    // Escape special regex characters in the key
    const escapedKey = variable.key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    result = result.replace(new RegExp(escapedKey, "g"), value);
  }

  return result;
}

/**
 * Replace variables in all platform content for a template
 */
export function replaceTemplateVariables(
  template: MarketingCampaignTemplate,
  values: Record<string, string>
): {
  email?: MarketingCampaignTemplate["email"];
  instagram?: MarketingCampaignTemplate["instagram"];
  twitter?: MarketingCampaignTemplate["twitter"];
  facebook?: MarketingCampaignTemplate["facebook"];
  linkedin?: MarketingCampaignTemplate["linkedin"];
  tiktok?: MarketingCampaignTemplate["tiktok"];
} {
  const { variables } = template;

  return {
    email: template.email ? {
      subject: replaceVariables(template.email.subject, values, variables),
      previewText: replaceVariables(template.email.previewText, values, variables),
      body: replaceVariables(template.email.body, values, variables),
      ctaText: replaceVariables(template.email.ctaText, values, variables),
      ctaUrl: template.email.ctaUrl ? replaceVariables(template.email.ctaUrl, values, variables) : undefined,
    } : undefined,

    instagram: template.instagram ? {
      caption: replaceVariables(template.instagram.caption, values, variables),
      hashtags: template.instagram.hashtags,
      callToAction: replaceVariables(template.instagram.callToAction || "", values, variables),
      suggestedImageStyle: template.instagram.suggestedImageStyle,
    } : undefined,

    twitter: template.twitter ? {
      tweet: replaceVariables(template.twitter.tweet, values, variables),
      hashtags: template.twitter.hashtags,
    } : undefined,

    facebook: template.facebook ? {
      post: replaceVariables(template.facebook.post, values, variables),
      callToAction: replaceVariables(template.facebook.callToAction || "", values, variables),
      suggestedImageStyle: template.facebook.suggestedImageStyle,
    } : undefined,

    linkedin: template.linkedin ? {
      post: replaceVariables(template.linkedin.post, values, variables),
      hashtags: template.linkedin.hashtags,
      professionalAngle: template.linkedin.professionalAngle,
    } : undefined,

    tiktok: template.tiktok ? {
      caption: replaceVariables(template.tiktok.caption, values, variables),
      hashtags: template.tiktok.hashtags,
      hookLine: replaceVariables(template.tiktok.hookLine || "", values, variables),
    } : undefined,
  };
}

/**
 * Get all unfilled required variables
 */
export function getUnfilledRequiredVariables(
  variables: TemplateVariable[],
  values: Record<string, string>
): TemplateVariable[] {
  return variables.filter((v) => {
    if (!v.required) return false;
    const value = values[v.key];
    return !value || value.trim() === "";
  });
}

/**
 * Validate all required variables are filled
 */
export function validateVariables(
  variables: TemplateVariable[],
  values: Record<string, string>
): { valid: boolean; missing: TemplateVariable[] } {
  const missing = getUnfilledRequiredVariables(variables, values);
  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Get preview of content with placeholder indicators for missing variables
 */
export function getPreviewWithPlaceholders(
  content: string,
  values: Record<string, string>,
  variables: TemplateVariable[]
): string {
  let result = content;

  for (const variable of variables) {
    const value = values[variable.key];
    const escapedKey = variable.key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    if (value && value.trim() !== "") {
      result = result.replace(new RegExp(escapedKey, "g"), value);
    } else if (variable.defaultValue) {
      result = result.replace(new RegExp(escapedKey, "g"), variable.defaultValue);
    } else {
      // Show placeholder for missing value
      const placeholder = `[${variable.label}]`;
      result = result.replace(new RegExp(escapedKey, "g"), placeholder);
    }
  }

  return result;
}

/**
 * Extract variable keys from content string
 */
export function extractVariableKeys(content: string): string[] {
  const regex = /\{\{([^}]+)\}\}/g;
  const matches: string[] = [];
  let match;

  while ((match = regex.exec(content)) !== null) {
    const key = `{{${match[1]}}}`;
    if (!matches.includes(key)) {
      matches.push(key);
    }
  }

  return matches;
}

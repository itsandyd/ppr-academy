import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Common spam trigger words and phrases
const SPAM_TRIGGERS = [
  { pattern: /free/gi, weight: 1, category: "promotional" },
  { pattern: /buy now/gi, weight: 2, category: "promotional" },
  { pattern: /limited time/gi, weight: 1, category: "urgency" },
  { pattern: /act now/gi, weight: 2, category: "urgency" },
  { pattern: /urgent/gi, weight: 2, category: "urgency" },
  { pattern: /click here/gi, weight: 1, category: "link" },
  { pattern: /click below/gi, weight: 1, category: "link" },
  { pattern: /winner/gi, weight: 2, category: "promotional" },
  { pattern: /congratulations/gi, weight: 1, category: "promotional" },
  { pattern: /cash/gi, weight: 1, category: "financial" },
  { pattern: /earn money/gi, weight: 2, category: "financial" },
  { pattern: /make money/gi, weight: 2, category: "financial" },
  { pattern: /100% free/gi, weight: 2, category: "promotional" },
  { pattern: /no obligation/gi, weight: 1, category: "promotional" },
  { pattern: /risk.?free/gi, weight: 1, category: "promotional" },
  { pattern: /guarantee/gi, weight: 1, category: "promotional" },
  { pattern: /!!!/g, weight: 2, category: "formatting" },
  { pattern: /\$\$\$/g, weight: 2, category: "financial" },
  { pattern: /ALL CAPS/g, weight: 1, category: "formatting" },
  { pattern: /unsubscribe/gi, weight: -1, category: "compliance" }, // Good to have
  { pattern: /opt.?out/gi, weight: -1, category: "compliance" }, // Good to have
];

// Analyze email for spam indicators
export const analyzeSpamScore = query({
  args: {
    subject: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const fullText = `${args.subject} ${args.body}`;

    let totalScore = 0;
    const issues: Array<{ text: string; category: string; severity: "low" | "medium" | "high" }> = [];

    // Check for spam triggers
    for (const trigger of SPAM_TRIGGERS) {
      const matches = fullText.match(trigger.pattern);
      if (matches) {
        const count = matches.length;
        totalScore += trigger.weight * count;

        if (trigger.weight > 0) {
          issues.push({
            text: `Found "${matches[0]}" ${count > 1 ? `(${count} times)` : ""}`,
            category: trigger.category,
            severity: trigger.weight >= 2 ? "high" : "low",
          });
        }
      }
    }

    // Check subject line length
    if (args.subject.length > 60) {
      totalScore += 1;
      issues.push({
        text: "Subject line is too long (over 60 characters)",
        category: "formatting",
        severity: "low",
      });
    }

    // Check for excessive capitalization in subject
    const capsRatio = (args.subject.match(/[A-Z]/g) || []).length / args.subject.length;
    if (capsRatio > 0.5 && args.subject.length > 10) {
      totalScore += 2;
      issues.push({
        text: "Too many capital letters in subject line",
        category: "formatting",
        severity: "medium",
      });
    }

    // Check for missing personalization
    if (!args.body.includes("{{firstName}}") && !args.body.includes("{{name}}")) {
      totalScore += 1;
      issues.push({
        text: "No personalization found (consider adding {{firstName}})",
        category: "personalization",
        severity: "low",
      });
    }

    // Check for unsubscribe link
    if (!args.body.toLowerCase().includes("unsubscribe")) {
      totalScore += 3;
      issues.push({
        text: "Missing unsubscribe link (required by law)",
        category: "compliance",
        severity: "high",
      });
    }

    // Check text-to-link ratio
    const linkCount = (args.body.match(/<a\s/gi) || []).length;
    const wordCount = args.body.split(/\s+/).length;
    if (linkCount > 0 && wordCount / linkCount < 20) {
      totalScore += 2;
      issues.push({
        text: "Too many links relative to text content",
        category: "content",
        severity: "medium",
      });
    }

    // Calculate final score (0-100, lower is better)
    const spamScore = Math.min(100, Math.max(0, totalScore * 5));

    // Determine rating
    let rating: "excellent" | "good" | "fair" | "poor";
    if (spamScore <= 10) rating = "excellent";
    else if (spamScore <= 30) rating = "good";
    else if (spamScore <= 50) rating = "fair";
    else rating = "poor";

    return {
      score: spamScore,
      rating,
      issues,
      recommendations: getRecommendations(issues),
    };
  },
});

function getRecommendations(issues: Array<{ category: string }>): string[] {
  const recommendations: string[] = [];
  const categories = new Set(issues.map((i) => i.category));

  if (categories.has("urgency")) {
    recommendations.push("Reduce urgency language - it can trigger spam filters and annoy subscribers");
  }
  if (categories.has("promotional")) {
    recommendations.push("Balance promotional content with valuable information");
  }
  if (categories.has("formatting")) {
    recommendations.push("Use normal capitalization and avoid excessive punctuation");
  }
  if (categories.has("compliance")) {
    recommendations.push("Ensure your email includes a clear unsubscribe link for CAN-SPAM compliance");
  }
  if (categories.has("personalization")) {
    recommendations.push("Add personalization tokens to increase engagement");
  }

  return recommendations;
}

// Validate links in email content
export const validateLinks = query({
  args: {
    body: v.string(),
  },
  handler: async (ctx, args) => {
    // Extract all links from the HTML content
    const linkRegex = /href=["']([^"']+)["']/gi;
    const links: Array<{ url: string; valid: boolean; issue?: string }> = [];

    let match;
    while ((match = linkRegex.exec(args.body)) !== null) {
      const url = match[1];

      // Check for common issues
      if (url.startsWith("{{") && url.endsWith("}}")) {
        // It's a template variable
        links.push({
          url,
          valid: true,
          issue: "Template variable - will be replaced",
        });
      } else if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("mailto:")) {
        links.push({
          url,
          valid: false,
          issue: "Missing protocol (http:// or https://)",
        });
      } else if (url.includes(" ")) {
        links.push({
          url,
          valid: false,
          issue: "URL contains spaces",
        });
      } else if (url.length > 2000) {
        links.push({
          url: url.substring(0, 50) + "...",
          valid: false,
          issue: "URL is too long",
        });
      } else {
        links.push({
          url,
          valid: true,
        });
      }
    }

    const validCount = links.filter((l) => l.valid).length;
    const invalidCount = links.filter((l) => !l.valid).length;

    return {
      links,
      summary: {
        total: links.length,
        valid: validCount,
        invalid: invalidCount,
        hasIssues: invalidCount > 0,
      },
    };
  },
});

// Replace template variables with preview data
export const previewWithData = query({
  args: {
    subject: v.string(),
    body: v.string(),
    previewData: v.optional(
      v.object({
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        email: v.optional(v.string()),
        storeName: v.optional(v.string()),
        creatorName: v.optional(v.string()),
        productName: v.optional(v.string()),
        downloadUrl: v.optional(v.string()),
        storeUrl: v.optional(v.string()),
        productUrl: v.optional(v.string()),
        courseUrl: v.optional(v.string()),
        libraryUrl: v.optional(v.string()),
        reviewUrl: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const defaults = {
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      storeName: "Your Store",
      creatorName: "The Creator",
      productName: "Amazing Product",
      downloadUrl: "https://example.com/download",
      storeUrl: "https://example.com/store",
      productUrl: "https://example.com/product",
      courseUrl: "https://example.com/course",
      libraryUrl: "https://example.com/library",
      reviewUrl: "https://example.com/review",
    };

    const data = { ...defaults, ...args.previewData };

    let subject = args.subject;
    let body = args.body;

    // Replace all template variables
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{${key}}}`, "gi");
      subject = subject.replace(regex, value);
      body = body.replace(regex, value);
    }

    return { subject, body };
  },
});

// Record test email sent
export const recordTestEmail = mutation({
  args: {
    storeId: v.string(),
    userId: v.string(),
    subject: v.string(),
    recipient: v.string(),
    templateId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("emailTestHistory", {
      storeId: args.storeId,
      userId: args.userId,
      subject: args.subject,
      recipient: args.recipient,
      templateId: args.templateId,
      sentAt: Date.now(),
    });
  },
});

// Get test email history
export const getTestEmailHistory = query({
  args: {
    storeId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    const history = await ctx.db
      .query("emailTestHistory")
      .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
      .order("desc")
      .take(limit);

    return history;
  },
});

// Calculate email readability score
export const analyzeReadability = query({
  args: {
    body: v.string(),
  },
  handler: async (ctx, args) => {
    // Strip HTML tags for text analysis
    const text = args.body.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const words = text.split(/\s+/).filter((w) => w.length > 0);
    const syllables = countSyllables(text);

    const avgWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0;
    const avgSyllablesPerWord = words.length > 0 ? syllables / words.length : 0;

    // Flesch Reading Ease formula
    const fleschScore = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
    const normalizedScore = Math.min(100, Math.max(0, fleschScore));

    // Reading level
    let level: string;
    let description: string;
    if (normalizedScore >= 80) {
      level = "Easy";
      description = "Easy to read. Perfect for casual email.";
    } else if (normalizedScore >= 60) {
      level = "Standard";
      description = "Standard readability. Good for most audiences.";
    } else if (normalizedScore >= 40) {
      level = "Moderate";
      description = "Somewhat complex. Consider simplifying.";
    } else {
      level = "Difficult";
      description = "Complex text. May lose reader attention.";
    }

    return {
      score: Math.round(normalizedScore),
      level,
      description,
      stats: {
        wordCount: words.length,
        sentenceCount: sentences.length,
        avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
        estimatedReadTime: Math.ceil(words.length / 200), // minutes at 200 wpm
      },
    };
  },
});

function countSyllables(text: string): number {
  const words = text.toLowerCase().split(/\s+/);
  let total = 0;

  for (const word of words) {
    if (word.length <= 3) {
      total += 1;
      continue;
    }

    // Count vowel groups
    const cleaned = word.replace(/[^a-z]/g, "");
    const vowelGroups = cleaned.match(/[aeiouy]+/g) || [];
    let count = vowelGroups.length;

    // Adjust for common patterns
    if (cleaned.endsWith("e") && count > 1) count--;
    if (cleaned.endsWith("le") && cleaned.length > 2) count++;
    if (cleaned.endsWith("es") || cleaned.endsWith("ed")) count--;

    total += Math.max(1, count);
  }

  return total;
}

// Get comprehensive email analysis
export const getFullAnalysis = query({
  args: {
    subject: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    // Spam analysis
    const fullText = `${args.subject} ${args.body}`;

    let spamScore = 0;
    const spamIssues: Array<{ text: string; category: string; severity: "low" | "medium" | "high" }> = [];

    for (const trigger of SPAM_TRIGGERS) {
      const matches = fullText.match(trigger.pattern);
      if (matches && trigger.weight > 0) {
        spamScore += trigger.weight * matches.length;
        spamIssues.push({
          text: `Found "${matches[0]}"`,
          category: trigger.category,
          severity: trigger.weight >= 2 ? "high" : "low",
        });
      }
    }

    // Subject analysis
    const subjectIssues: string[] = [];
    if (args.subject.length > 60) {
      subjectIssues.push("Subject line is too long (over 60 characters)");
    }
    if (args.subject.length < 20) {
      subjectIssues.push("Subject line may be too short");
    }
    const capsRatio = (args.subject.match(/[A-Z]/g) || []).length / args.subject.length;
    if (capsRatio > 0.5 && args.subject.length > 10) {
      subjectIssues.push("Too many capital letters");
    }

    // Link validation
    const linkRegex = /href=["']([^"']+)["']/gi;
    const links: string[] = [];
    let match;
    while ((match = linkRegex.exec(args.body)) !== null) {
      links.push(match[1]);
    }

    // Readability
    const text = args.body.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    const words = text.split(/\s+/).filter((w) => w.length > 0);
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

    // Overall score (0-100)
    const spamPenalty = Math.min(40, spamScore * 5);
    const subjectPenalty = subjectIssues.length * 10;
    const hasUnsubscribe = args.body.toLowerCase().includes("unsubscribe");
    const compliancePenalty = hasUnsubscribe ? 0 : 20;

    const overallScore = Math.max(0, 100 - spamPenalty - subjectPenalty - compliancePenalty);

    return {
      overallScore,
      overallRating: overallScore >= 80 ? "excellent" : overallScore >= 60 ? "good" : overallScore >= 40 ? "fair" : "poor",
      spam: {
        score: Math.min(100, spamScore * 5),
        issues: spamIssues,
      },
      subject: {
        length: args.subject.length,
        issues: subjectIssues,
        previewText: args.subject.substring(0, 40) + (args.subject.length > 40 ? "..." : ""),
      },
      content: {
        wordCount: words.length,
        sentenceCount: sentences.length,
        linkCount: links.length,
        hasPersonalization: args.body.includes("{{"),
        hasUnsubscribe,
        estimatedReadTime: Math.ceil(words.length / 200),
      },
      compliance: {
        hasUnsubscribe,
        issues: !hasUnsubscribe ? ["Missing unsubscribe link"] : [],
      },
    };
  },
});

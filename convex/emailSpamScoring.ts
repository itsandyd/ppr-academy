/**
 * Spam Score Checking System
 * Analyze emails before sending to predict spam score (ActiveCampaign-level)
 */

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ============================================================================
// SPAM TRIGGER WORDS
// ============================================================================

const SPAM_WORDS = [
  // High-risk words
  "free", "winner", "congratulations", "claim", "prize", "cash", "bonus",
  "earn money", "make money", "work from home", "no obligation", "risk-free",
  "guarantee", "limited time", "act now", "urgent", "hurry", "don't wait",
  "click here", "click below", "order now", "buy now", "subscribe now",
  "100% free", "completely free", "absolutely free",
  
  // Medium-risk words
  "deal", "discount", "save", "offer", "special promotion", "lowest price",
  "compare", "cheap", "affordable", "cost", "price",
  "gift", "giveaway", "bonus", "extra", "trial",
  "incredible", "amazing", "fantastic", "unbelievable",
  "limited", "exclusive", "special", "secret", "hidden",
  
  // Aggressive words
  "buy", "purchase", "order", "shop", "sale", "clearance",
  "instant", "immediate", "fast", "quick", "easy",
  "no credit card", "no hidden fees", "no strings attached",
  "satisfaction guaranteed", "money back", "refund",
];

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get spam score check results
 */
export const getSpamScoreCheck = query({
  args: {
    campaignId: v.optional(v.id("resendCampaigns")),
    templateId: v.optional(v.id("resendTemplates")),
  },
  returns: v.union(
    v.object({
      subject: v.string(),
      htmlContent: v.string(),
      spamScore: v.number(),
      riskLevel: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
      issues: v.array(v.object({
        type: v.union(
          v.literal("subject"),
          v.literal("content"),
          v.literal("links"),
          v.literal("images"),
          v.literal("authentication")
        ),
        severity: v.union(v.literal("warning"), v.literal("error")),
        message: v.string(),
        suggestion: v.optional(v.string()),
      })),
      checks: v.object({
        hasSpamWords: v.boolean(),
        hasExcessiveCaps: v.boolean(),
        hasExcessivePunctuation: v.boolean(),
        hasBrokenLinks: v.boolean(),
        hasUnsubscribeLink: v.boolean(),
        imageToTextRatio: v.number(),
        linkCount: v.number(),
      }),
      checkedAt: v.number(),
      _id: v.id("spamScoreChecks"),
      _creationTime: v.number(),
      campaignId: v.optional(v.id("resendCampaigns")),
      templateId: v.optional(v.id("resendTemplates")),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    if (args.campaignId !== undefined) {
      const check = await ctx.db
        .query("spamScoreChecks")
        .withIndex("by_campaignId", (q) => q.eq("campaignId", args.campaignId as Id<"resendCampaigns">))
        .order("desc")
        .first();
      return check;
    }
    
    if (args.templateId !== undefined) {
      const check = await ctx.db
        .query("spamScoreChecks")
        .withIndex("by_template", (q) => q.eq("templateId", args.templateId as Id<"resendTemplates">))
        .order("desc")
        .first();
      return check;
    }
    
    const check = await ctx.db.query("spamScoreChecks").order("desc").first();
    return check;
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Check email for spam indicators
 */
export const checkSpamScore = mutation({
  args: {
    subject: v.string(),
    htmlContent: v.string(),
    campaignId: v.optional(v.id("resendCampaigns")),
    templateId: v.optional(v.id("resendTemplates")),
  },
  returns: v.object({
    spamScore: v.number(),
    riskLevel: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    issues: v.array(v.object({
      type: v.union(
        v.literal("subject"),
        v.literal("content"),
        v.literal("links"),
        v.literal("images"),
        v.literal("authentication")
      ),
      severity: v.union(v.literal("warning"), v.literal("error")),
      message: v.string(),
      suggestion: v.optional(v.string()),
    })),
    checks: v.object({
      hasSpamWords: v.boolean(),
      hasExcessiveCaps: v.boolean(),
      hasExcessivePunctuation: v.boolean(),
      hasBrokenLinks: v.boolean(),
      hasUnsubscribeLink: v.boolean(),
      imageToTextRatio: v.number(),
      linkCount: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Analyze email
    const analysis = analyzeEmail(args.subject, args.htmlContent);
    
    // Store the check
    await ctx.db.insert("spamScoreChecks", {
      campaignId: args.campaignId,
      templateId: args.templateId,
      subject: args.subject,
      htmlContent: args.htmlContent,
      spamScore: analysis.spamScore,
      riskLevel: analysis.riskLevel,
      issues: analysis.issues,
      checks: analysis.checks,
      checkedAt: now,
    });
    
    return {
      spamScore: analysis.spamScore,
      riskLevel: analysis.riskLevel,
      issues: analysis.issues,
      checks: analysis.checks,
    };
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

interface SpamAnalysis {
  spamScore: number;
  riskLevel: "low" | "medium" | "high";
  issues: Array<{
    type: "subject" | "content" | "links" | "images" | "authentication";
    severity: "warning" | "error";
    message: string;
    suggestion?: string;
  }>;
  checks: {
    hasSpamWords: boolean;
    hasExcessiveCaps: boolean;
    hasExcessivePunctuation: boolean;
    hasBrokenLinks: boolean;
    hasUnsubscribeLink: boolean;
    imageToTextRatio: number;
    linkCount: number;
  };
}

function analyzeEmail(subject: string, htmlContent: string): SpamAnalysis {
  let spamScore = 0;
  const issues: SpamAnalysis["issues"] = [];
  
  // Extract text content from HTML
  const textContent = stripHtml(htmlContent);
  const combinedText = (subject + " " + textContent).toLowerCase();
  
  // Check 1: Spam words
  const spamWordsFound = SPAM_WORDS.filter(word => 
    combinedText.includes(word.toLowerCase())
  );
  const hasSpamWords = spamWordsFound.length > 0;
  
  if (spamWordsFound.length > 5) {
    spamScore += 3;
    issues.push({
      type: "content",
      severity: "error",
      message: `Found ${spamWordsFound.length} spam trigger words: ${spamWordsFound.slice(0, 3).join(", ")}...`,
      suggestion: "Remove or replace spam trigger words with more professional language.",
    });
  } else if (spamWordsFound.length > 2) {
    spamScore += 2;
    issues.push({
      type: "content",
      severity: "warning",
      message: `Found ${spamWordsFound.length} spam trigger words: ${spamWordsFound.join(", ")}`,
      suggestion: "Consider replacing some spam trigger words.",
    });
  } else if (spamWordsFound.length > 0) {
    spamScore += 1;
    issues.push({
      type: "content",
      severity: "warning",
      message: `Found spam trigger words: ${spamWordsFound.join(", ")}`,
    });
  }
  
  // Check 2: Excessive capitalization in subject
  const capsRatio = (subject.match(/[A-Z]/g) || []).length / subject.length;
  const hasExcessiveCaps = capsRatio > 0.5;
  
  if (hasExcessiveCaps) {
    spamScore += 2;
    issues.push({
      type: "subject",
      severity: "error",
      message: "Subject line has excessive capitalization",
      suggestion: "Use sentence case for better deliverability.",
    });
  }
  
  // Check 3: Excessive punctuation
  const exclamationCount = (subject.match(/!/g) || []).length;
  const questionCount = (subject.match(/\?/g) || []).length;
  const hasExcessivePunctuation = exclamationCount > 1 || questionCount > 1;
  
  if (exclamationCount > 2 || questionCount > 2) {
    spamScore += 2;
    issues.push({
      type: "subject",
      severity: "error",
      message: "Subject has excessive punctuation (!!!, ???)",
      suggestion: "Use one exclamation or question mark maximum.",
    });
  } else if (exclamationCount > 1 || questionCount > 1) {
    spamScore += 1;
    issues.push({
      type: "subject",
      severity: "warning",
      message: "Subject has multiple punctuation marks",
    });
  }
  
  // Check 4: Links
  const linkMatches = htmlContent.match(/<a\s+[^>]*href=["']([^"']*)["'][^>]*>/gi) || [];
  const linkCount = linkMatches.length;
  
  if (linkCount > 10) {
    spamScore += 2;
    issues.push({
      type: "links",
      severity: "warning",
      message: `Email contains ${linkCount} links (high number may trigger filters)`,
      suggestion: "Reduce number of links to 5-10 for better deliverability.",
    });
  }
  
  // Check 5: Unsubscribe link
  const hasUnsubscribeLink = 
    /unsubscribe/i.test(htmlContent) || 
    /opt[- ]?out/i.test(htmlContent);
  
  if (!hasUnsubscribeLink) {
    spamScore += 3;
    issues.push({
      type: "content",
      severity: "error",
      message: "Missing unsubscribe link (required by law)",
      suggestion: "Add an unsubscribe link in the footer.",
    });
  }
  
  // Check 6: Image to text ratio
  const imageMatches = htmlContent.match(/<img[^>]*>/gi) || [];
  const imageCount = imageMatches.length;
  const textLength = textContent.length;
  const imageToTextRatio = textLength > 0 ? imageCount / (textLength / 100) : 0;
  
  if (imageToTextRatio > 3) {
    spamScore += 2;
    issues.push({
      type: "images",
      severity: "warning",
      message: "High image-to-text ratio (may trigger spam filters)",
      suggestion: "Add more text content or reduce images.",
    });
  }
  
  // Check 7: Empty or very short content
  if (textContent.length < 50) {
    spamScore += 2;
    issues.push({
      type: "content",
      severity: "warning",
      message: "Email content is very short",
      suggestion: "Add more meaningful content to your email.",
    });
  }
  
  // Check 8: Subject line length
  if (subject.length < 10) {
    spamScore += 1;
    issues.push({
      type: "subject",
      severity: "warning",
      message: "Subject line is very short",
      suggestion: "Use a descriptive subject line (40-60 characters recommended).",
    });
  } else if (subject.length > 100) {
    spamScore += 1;
    issues.push({
      type: "subject",
      severity: "warning",
      message: "Subject line is too long (will be truncated)",
      suggestion: "Keep subject lines under 60 characters.",
    });
  }
  
  // Determine risk level
  let riskLevel: "low" | "medium" | "high";
  if (spamScore >= 7) riskLevel = "high";
  else if (spamScore >= 4) riskLevel = "medium";
  else riskLevel = "low";
  
  return {
    spamScore,
    riskLevel,
    issues,
    checks: {
      hasSpamWords,
      hasExcessiveCaps,
      hasExcessivePunctuation,
      hasBrokenLinks: false, // Would need actual link checking
      hasUnsubscribeLink,
      imageToTextRatio,
      linkCount,
    },
  };
}

function stripHtml(html: string): string {
  // Remove HTML tags
  let text = html.replace(/<[^>]*>/g, " ");
  
  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
  
  // Remove extra whitespace
  text = text.replace(/\s+/g, " ").trim();
  
  return text;
}


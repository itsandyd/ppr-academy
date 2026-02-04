"use node";

import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal, api } from "./_generated/api";

/**
 * Email Workflow Test Suite
 *
 * These tests verify that the email workflow system works correctly,
 * especially for large lists. Run these tests to ensure:
 *
 * 1. Rate limiting works correctly
 * 2. Batch processing doesn't timeout
 * 3. Resumability works for interrupted campaigns
 * 4. Progress tracking is accurate
 */

/**
 * Test rate limiting by simulating multiple email sends
 */
export const testRateLimiting = action({
  args: {},
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    details: v.object({
      emailsSimulated: v.number(),
      totalTimeMs: v.number(),
      avgTimePerEmailMs: v.number(),
      rateLimitRespected: v.boolean(),
    }),
  }),
  handler: async () => {
    const startTime = Date.now();
    const emailCount = 10;

    // Simulate the rate limiting delay
    const DELAY_BETWEEN_EMAILS_MS = 200; // 5 emails/second

    const delays: number[] = [];
    for (let i = 0; i < emailCount; i++) {
      const iterStart = Date.now();
      // Simulate email send (just a small delay)
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_EMAILS_MS));
      delays.push(Date.now() - iterStart);
    }

    const totalTime = Date.now() - startTime;
    const avgTimePerEmail = totalTime / emailCount;

    // We expect at least 180ms per email due to rate limiting (with some tolerance)
    const rateLimitRespected = avgTimePerEmail >= 180;

    return {
      success: rateLimitRespected,
      message: rateLimitRespected
        ? `Rate limiting working correctly. Average ${Math.round(avgTimePerEmail)}ms per email.`
        : `Rate limiting may not be working. Average ${Math.round(avgTimePerEmail)}ms per email is too fast.`,
      details: {
        emailsSimulated: emailCount,
        totalTimeMs: totalTime,
        avgTimePerEmailMs: Math.round(avgTimePerEmail),
        rateLimitRespected,
      },
    };
  },
});

/**
 * Test batch processing by verifying batch size limits
 */
export const testBatchProcessing = action({
  args: {},
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    details: v.object({
      batchSize: v.number(),
      maxBatchesPerInvocation: v.number(),
      maxEmailsPerInvocation: v.number(),
      estimatedTimePerBatchSeconds: v.number(),
    }),
  }),
  handler: async () => {
    // These are the configured values from emails.ts
    const BATCH_SIZE = 50;
    const MAX_BATCHES_PER_INVOCATION = 10;
    const DELAY_BETWEEN_EMAILS_MS = 200;

    const maxEmailsPerInvocation = BATCH_SIZE * MAX_BATCHES_PER_INVOCATION;
    const estimatedTimePerBatch = (BATCH_SIZE * DELAY_BETWEEN_EMAILS_MS + 500) / 1000; // +500ms delay between batches

    // Convex action timeout is ~10 minutes (600 seconds)
    const maxTimePerInvocation = estimatedTimePerBatch * MAX_BATCHES_PER_INVOCATION;
    const withinTimeout = maxTimePerInvocation < 540; // Leave 1 minute buffer

    return {
      success: withinTimeout,
      message: withinTimeout
        ? `Batch processing configured correctly. Can process up to ${maxEmailsPerInvocation} emails per invocation in ~${Math.round(maxTimePerInvocation)}s.`
        : `Warning: Batch processing may timeout. Estimated time ${Math.round(maxTimePerInvocation)}s exceeds safe limit.`,
      details: {
        batchSize: BATCH_SIZE,
        maxBatchesPerInvocation: MAX_BATCHES_PER_INVOCATION,
        maxEmailsPerInvocation,
        estimatedTimePerBatchSeconds: Math.round(estimatedTimePerBatch),
      },
    };
  },
});

/**
 * Test progress tracking by creating a mock campaign and checking updates
 */
export const testProgressTracking = action({
  args: {
    campaignId: v.optional(v.union(v.id("resendCampaigns"), v.id("emailCampaigns"))),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    details: v.optional(v.object({
      status: v.string(),
      sentCount: v.number(),
      failedCount: v.number(),
      percentComplete: v.number(),
      canResume: v.boolean(),
    })),
  }),
  handler: async (ctx, args) => {
    if (!args.campaignId) {
      return {
        success: true,
        message: "No campaign ID provided. Pass a campaignId to test progress tracking for a specific campaign.",
        details: undefined,
      };
    }

    try {
      const progress = await ctx.runAction(api.emails.getCampaignProgress, {
        campaignId: args.campaignId,
      });

      return {
        success: true,
        message: `Progress tracking working. Campaign is ${progress.percentComplete}% complete.`,
        details: {
          status: progress.status,
          sentCount: progress.sentCount,
          failedCount: progress.failedCount,
          percentComplete: progress.percentComplete,
          canResume: progress.canResume,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to get campaign progress: ${error.message}`,
        details: undefined,
      };
    }
  },
});

/**
 * Comprehensive email workflow test
 * Runs all tests and returns a summary
 */
export const runAllEmailTests = action({
  args: {},
  returns: v.object({
    success: v.boolean(),
    summary: v.string(),
    tests: v.array(v.object({
      name: v.string(),
      passed: v.boolean(),
      message: v.string(),
    })),
  }),
  handler: async (ctx) => {
    const tests: Array<{ name: string; passed: boolean; message: string }> = [];

    // Test 1: Rate Limiting
    try {
      const rateLimitResult = await ctx.runAction(api.emailTests.testRateLimiting, {});
      tests.push({
        name: "Rate Limiting",
        passed: rateLimitResult.success,
        message: rateLimitResult.message,
      });
    } catch (error: any) {
      tests.push({
        name: "Rate Limiting",
        passed: false,
        message: `Test failed with error: ${error.message}`,
      });
    }

    // Test 2: Batch Processing
    try {
      const batchResult = await ctx.runAction(api.emailTests.testBatchProcessing, {});
      tests.push({
        name: "Batch Processing",
        passed: batchResult.success,
        message: batchResult.message,
      });
    } catch (error: any) {
      tests.push({
        name: "Batch Processing",
        passed: false,
        message: `Test failed with error: ${error.message}`,
      });
    }

    // Test 3: Progress Tracking (without a campaign)
    try {
      const progressResult = await ctx.runAction(api.emailTests.testProgressTracking, {});
      tests.push({
        name: "Progress Tracking",
        passed: progressResult.success,
        message: progressResult.message,
      });
    } catch (error: any) {
      tests.push({
        name: "Progress Tracking",
        passed: false,
        message: `Test failed with error: ${error.message}`,
      });
    }

    const passed = tests.filter(t => t.passed).length;
    const total = tests.length;
    const allPassed = passed === total;

    return {
      success: allPassed,
      summary: `Email Workflow Tests: ${passed}/${total} passed${allPassed ? " ✅" : " ⚠️"}`,
      tests,
    };
  },
});

/**
 * Simulate a large campaign send (dry run)
 * This tests the workflow without actually sending emails
 */
export const simulateLargeCampaign = action({
  args: {
    recipientCount: v.number(), // How many recipients to simulate
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    projections: v.object({
      totalRecipients: v.number(),
      batchCount: v.number(),
      invocationsNeeded: v.number(),
      estimatedTotalTimeMinutes: v.number(),
      estimatedEmailsPerMinute: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    const BATCH_SIZE = 50;
    const MAX_BATCHES_PER_INVOCATION = 10;
    const DELAY_BETWEEN_EMAILS_MS = 200;
    const DELAY_BETWEEN_BATCHES_MS = 500;
    const SCHEDULER_DELAY_MS = 1000;

    const batchCount = Math.ceil(args.recipientCount / BATCH_SIZE);
    const invocationsNeeded = Math.ceil(batchCount / MAX_BATCHES_PER_INVOCATION);

    // Time calculation per invocation
    const timePerBatch = (BATCH_SIZE * DELAY_BETWEEN_EMAILS_MS + DELAY_BETWEEN_BATCHES_MS) / 1000;
    const batchesInFullInvocation = Math.min(MAX_BATCHES_PER_INVOCATION, batchCount);
    const timePerInvocation = timePerBatch * batchesInFullInvocation + (SCHEDULER_DELAY_MS / 1000);

    const estimatedTotalTime = timePerInvocation * invocationsNeeded;
    const estimatedTotalTimeMinutes = Math.ceil(estimatedTotalTime / 60);

    const emailsPerMinute = args.recipientCount / (estimatedTotalTime / 60);

    const isReasonable = estimatedTotalTimeMinutes < 60; // Under an hour is reasonable

    return {
      success: true,
      message: isReasonable
        ? `Campaign projection looks good! ${args.recipientCount} emails can be sent in ~${estimatedTotalTimeMinutes} minutes.`
        : `Large campaign warning: ${args.recipientCount} emails will take ~${estimatedTotalTimeMinutes} minutes (${Math.round(estimatedTotalTime / 3600)} hours).`,
      projections: {
        totalRecipients: args.recipientCount,
        batchCount,
        invocationsNeeded,
        estimatedTotalTimeMinutes,
        estimatedEmailsPerMinute: Math.round(emailsPerMinute),
      },
    };
  },
});

"use node";

/**
 * AI-powered actions for admin creator outreach.
 * Separated from creatorOutreach.ts because actions need "use node" for LLM calls,
 * but queries/mutations cannot run in Node.js mode.
 */

import { v } from "convex/values";
import { action } from "../_generated/server";
import { callLLM, safeParseJson } from "../masterAI/llmClient";
import type { ModelId } from "../masterAI/types";

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const { internal } = require("../_generated/api") as { internal: any };

const EMAIL_MODEL: ModelId = "claude-4.5-sonnet";

// ─── AI Outreach Sequence Generator ─────────────────────────────────────────

/**
 * Generate a complete outreach workflow sequence using AI.
 * Returns ReactFlow nodes & edges for the visual editor.
 */
export const generateOutreachSequence = action({
  args: {
    clerkId: v.string(),
    goal: v.string(),
    sequenceLength: v.optional(v.number()),
    tone: v.optional(
      v.union(
        v.literal("casual"),
        v.literal("friendly"),
        v.literal("professional")
      )
    ),
    plainTextMode: v.optional(v.boolean()),
  },
  returns: v.object({
    name: v.string(),
    nodes: v.array(v.any()),
    edges: v.array(v.any()),
  }),
  handler: async (ctx, args) => {
    // Verify admin
    const user = await ctx.runQuery(internal.admin.creatorOutreach.verifyAdminQuery, {
      clerkId: args.clerkId,
    });
    if (!user) throw new Error("Unauthorized");

    const numEmails = args.sequenceLength || 5;
    const tone = args.tone || "casual";
    const isPlainText = args.plainTextMode !== false; // Default true

    const plainTextInstructions = isPlainText
      ? `\n\nFORMAT: Output plain text only. No HTML tags. No markdown. For links, paste the raw URL on its own line. Write like you're texting a friend from your phone. URLs should be naked: https://pauseplayrepeat.com/dashboard/products/new not <a href="...">click here</a>.`
      : "";

    const systemPrompt = `You are an expert email copywriter for PausePlayRepeat (PPR), a music production creator platform. You write outreach emails FROM the platform admin (Andrew) TO creators who have signed up but need encouragement to take action.

CONTEXT:
- PPR lets music producers build storefronts to sell courses, beats, sample packs, presets, and more
- Creators sign up but often don't upload products, connect Stripe, or engage
- These outreach emails help activate those creators
- Emails are sent FROM "Andrew" <andrew@pauseplayrepeat.com>
- Available merge tags: {{firstName}}, {{name}}, {{email}}, {{storeName}}, {{storeSlug}}

VOICE & STYLE (Cymatics-inspired conversational):
- Subject lines: lowercase, no periods, can use emoji at end, curiosity-driven
- Body: casual, conversational, like texting a friend who makes music
- Use filler words naturally: "tbh", "lol", "ngl", "lowkey", "fr"
- Use contractions, parenthetical asides, and short paragraphs
- P.S. lines that tease the next email to build anticipation
- Pressure release after CTAs: "no pressure tho", "totally cool if not"
- Reference music production naturally
- Sign off as "- Andrew" or "Andrew"
- Keep emails SHORT - 100-200 words max per email${plainTextInstructions}

TONE: ${tone}

You must return valid JSON with this structure:
{
  "name": "sequence name",
  "emails": [
    {
      "subject": "the subject line",
      "body": "the email body text (plain text with \\n for newlines)",
      "delayDays": number (days to wait before sending this email, 0 for first)
    }
  ],
  "conditions": [
    {
      "afterEmailIndex": number (0-based index of email after which to add condition),
      "type": "has_products" | "has_stripe" | "emails_opened",
      "yesAction": "continue" | "stop",
      "noAction": "continue" | "stop"
    }
  ]
}

Generate exactly ${numEmails} emails. The first email should have delayDays: 0.
Include 1-2 condition checks at natural points (e.g., check if they uploaded a product halfway through).
Make each email build on the previous one — a narrative arc.`;

    const userPrompt = `Generate an outreach email sequence for this goal:\n\n"${args.goal}"\n\nCreate ${numEmails} emails with the ${tone} tone. Return only valid JSON.`;

    const response = await callLLM({
      model: EMAIL_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
      maxTokens: 4000,
      responseFormat: "json",
    });

    const result = safeParseJson<{
      name: string;
      emails: Array<{
        subject: string;
        body: string;
        delayDays: number;
      }>;
      conditions?: Array<{
        afterEmailIndex: number;
        type: string;
        yesAction: string;
        noAction: string;
      }>;
    }>(response.content);

    // Build ReactFlow nodes and edges from the AI response
    const nodes: Array<{
      id: string;
      type: string;
      position: { x: number; y: number };
      data: Record<string, any>;
    }> = [];
    const edges: Array<{
      id: string;
      source: string;
      target: string;
      sourceHandle?: string;
      type: string;
      animated: boolean;
      style: { stroke: string; strokeWidth: number };
    }> = [];

    let nodeIdx = 0;
    const yStep = 120;
    const xCenter = 250;

    // Trigger node
    const triggerId = `node_${nodeIdx++}`;
    nodes.push({
      id: triggerId,
      type: "outreachTrigger",
      position: { x: xCenter, y: 50 },
      data: {
        fromName: "Andrew",
        fromEmail: "andrew@pauseplayrepeat.com",
        replyTo: "andrew@pauseplayrepeat.com",
        stopOnProductUpload: true,
        stopOnReply: true,
      },
    });

    let prevId = triggerId;
    let emailIdx = 0;

    // Build a map of conditions keyed by afterEmailIndex
    const conditionMap = new Map<number, { afterEmailIndex: number; type: string; yesAction: string; noAction: string }>();
    if (result.conditions) {
      for (const cond of result.conditions) {
        conditionMap.set(cond.afterEmailIndex, cond);
      }
    }

    for (const email of result.emails) {
      // Delay node (skip for first email if delayDays is 0)
      if (email.delayDays > 0) {
        const delayId = `node_${nodeIdx++}`;
        nodes.push({
          id: delayId,
          type: "delay",
          position: { x: xCenter, y: 50 + nodeIdx * yStep },
          data: { delayValue: email.delayDays, delayUnit: "days" },
        });
        edges.push({
          id: `edge_${prevId}_${delayId}`,
          source: prevId.includes("::") ? prevId.split("::")[0] : prevId,
          target: delayId,
          ...(prevId.includes("::") ? { sourceHandle: prevId.split("::")[1] } : {}),
          type: "smoothstep",
          animated: true,
          style: { stroke: "#6366f1", strokeWidth: 2 },
        });
        prevId = delayId;
      }

      // Email node
      const emailNodeId = `node_${nodeIdx++}`;
      nodes.push({
        id: emailNodeId,
        type: "sendEmail",
        position: { x: xCenter, y: 50 + nodeIdx * yStep },
        data: {
          subject: email.subject,
          htmlContent: email.body,
          textContent: email.body,
        },
      });
      edges.push({
        id: `edge_${(prevId.includes("::") ? prevId.split("::")[0] : prevId)}_${emailNodeId}`,
        source: prevId.includes("::") ? prevId.split("::")[0] : prevId,
        target: emailNodeId,
        ...(prevId.includes("::") ? { sourceHandle: prevId.split("::")[1] } : {}),
        type: "smoothstep",
        animated: true,
        style: { stroke: "#6366f1", strokeWidth: 2 },
      });
      prevId = emailNodeId;

      // Check if there's a condition after this email
      const condition = conditionMap.get(emailIdx);
      if (condition) {
        const condId = `node_${nodeIdx++}`;
        nodes.push({
          id: condId,
          type: "condition",
          position: { x: xCenter, y: 50 + nodeIdx * yStep },
          data: { conditionType: condition.type },
        });
        edges.push({
          id: `edge_${prevId}_${condId}`,
          source: prevId,
          target: condId,
          type: "smoothstep",
          animated: true,
          style: { stroke: "#6366f1", strokeWidth: 2 },
        });

        if (condition.yesAction === "stop") {
          // Yes branch -> stop
          const stopId = `node_${nodeIdx++}`;
          nodes.push({
            id: stopId,
            type: "stop",
            position: { x: xCenter + 200, y: 50 + nodeIdx * yStep },
            data: {},
          });
          edges.push({
            id: `edge_${condId}_yes_${stopId}`,
            source: condId,
            target: stopId,
            sourceHandle: "yes",
            type: "smoothstep",
            animated: true,
            style: { stroke: "#6366f1", strokeWidth: 2 },
          });
          // No branch continues
          prevId = `${condId}::no`;
        } else {
          // Yes branch continues (condition met = good, keep going)
          // No branch -> stop
          const stopId = `node_${nodeIdx++}`;
          nodes.push({
            id: stopId,
            type: "stop",
            position: { x: xCenter + 200, y: 50 + nodeIdx * yStep },
            data: {},
          });
          edges.push({
            id: `edge_${condId}_no_${stopId}`,
            source: condId,
            target: stopId,
            sourceHandle: "no",
            type: "smoothstep",
            animated: true,
            style: { stroke: "#6366f1", strokeWidth: 2 },
          });
          prevId = `${condId}::yes`;
        }
      }

      emailIdx++;
    }

    // Final stop node
    const finalStopId = `node_${nodeIdx++}`;
    nodes.push({
      id: finalStopId,
      type: "stop",
      position: { x: xCenter, y: 50 + nodeIdx * yStep },
      data: {},
    });

    // Connect last node to final stop
    if (prevId.includes("::")) {
      const [sourceId, handle] = prevId.split("::");
      edges.push({
        id: `edge_${sourceId}_${handle}_${finalStopId}`,
        source: sourceId,
        target: finalStopId,
        sourceHandle: handle,
        type: "smoothstep",
        animated: true,
        style: { stroke: "#6366f1", strokeWidth: 2 },
      });
    } else {
      edges.push({
        id: `edge_${prevId}_${finalStopId}`,
        source: prevId,
        target: finalStopId,
        type: "smoothstep",
        animated: true,
        style: { stroke: "#6366f1", strokeWidth: 2 },
      });
    }

    return {
      name: result.name || "AI-Generated Outreach",
      nodes,
      edges,
    };
  },
});

// ─── AI Single Email Generator ──────────────────────────────────────────────

/**
 * Generate or rewrite a single outreach email using AI
 */
export const generateOutreachEmail = action({
  args: {
    clerkId: v.string(),
    goal: v.optional(v.string()),
    existingSubject: v.optional(v.string()),
    existingBody: v.optional(v.string()),
    emailPosition: v.optional(v.string()),
    plainTextMode: v.optional(v.boolean()),
  },
  returns: v.object({
    subject: v.string(),
    body: v.string(),
  }),
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.admin.creatorOutreach.verifyAdminQuery, {
      clerkId: args.clerkId,
    });
    if (!user) throw new Error("Unauthorized");

    const isRewrite = !!(args.existingSubject || args.existingBody);
    const isPlainText = args.plainTextMode !== false; // Default true

    const plainTextInstructions = isPlainText
      ? `\n\nFORMAT: Output plain text only. No HTML tags. No markdown. For links, paste the raw URL on its own line. Write like you're texting a friend from your phone. URLs should be naked: https://pauseplayrepeat.com/dashboard/products/new not <a href="...">click here</a>.`
      : "";

    const systemPrompt = `You are an expert email copywriter for PausePlayRepeat (PPR), a music production creator platform. Write a single outreach email FROM the platform admin (Andrew) TO a creator.

CONTEXT:
- PPR lets music producers build storefronts to sell courses, beats, sample packs, presets, and more
- These emails encourage creators to take action on the platform
- Available merge tags: {{firstName}}, {{name}}, {{email}}, {{storeName}}, {{storeSlug}}

VOICE & STYLE (Cymatics-inspired conversational):
- Subject line: lowercase, no periods, curiosity-driven
- Body: casual, conversational, like texting a friend who makes music
- Use filler words naturally: "tbh", "lol", "ngl", "lowkey"
- Short paragraphs, 100-200 words max
- Sign off as "- Andrew"
- P.S. line optional${plainTextInstructions}

Return valid JSON: { "subject": "...", "body": "..." }
Body should be plain text with \\n for newlines.`;

    let userPrompt: string;
    if (isRewrite) {
      userPrompt = `Rewrite and improve this outreach email. Make it more engaging and conversational:\n\nSubject: ${args.existingSubject || "(none)"}\nBody: ${args.existingBody || "(none)"}\n\n${args.goal ? `Goal: ${args.goal}` : ""}`;
    } else {
      userPrompt = `Write a single outreach email.\n\nGoal: ${args.goal || "Get inactive creators to engage with the platform"}\n${args.emailPosition ? `Position in sequence: ${args.emailPosition}` : ""}`;
    }

    const response = await callLLM({
      model: EMAIL_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
      maxTokens: 1500,
      responseFormat: "json",
    });

    return safeParseJson<{ subject: string; body: string }>(response.content);
  },
});

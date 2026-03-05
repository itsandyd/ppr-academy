import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Pre-built system templates
const SYSTEM_TEMPLATES = [
  {
    name: "Welcome Series",
    description: "A 5-email welcome sequence that builds trust before selling",
    category: "welcome" as const,
    trigger: { type: "lead_signup", config: {} },
    nodes: [
      { id: "trigger-1", type: "trigger", position: { x: 250, y: 50 }, data: { triggerType: "lead_signup" } },
      { id: "email-1", type: "email", position: { x: 250, y: 150 }, data: { subject: "hey, glad you're here", templateName: "Personal Intro" } },
      { id: "delay-1", type: "delay", position: { x: 250, y: 250 }, data: { delayValue: 2, delayUnit: "days" } },
      { id: "email-2", type: "email", position: { x: 250, y: 350 }, data: { subject: "wanted to share something with you", templateName: "Creator Story" } },
      { id: "delay-2", type: "delay", position: { x: 250, y: 450 }, data: { delayValue: 2, delayUnit: "days" } },
      { id: "email-3", type: "email", position: { x: 250, y: 550 }, data: { subject: "this is what I wish someone told me when I started", templateName: "Value Share" } },
      { id: "delay-3", type: "delay", position: { x: 250, y: 650 }, data: { delayValue: 3, delayUnit: "days" } },
      { id: "email-4", type: "email", position: { x: 250, y: 750 }, data: { subject: "been getting some cool messages from people", templateName: "Social Proof" } },
      { id: "delay-4", type: "delay", position: { x: 250, y: 850 }, data: { delayValue: 2, delayUnit: "days" } },
      { id: "email-5", type: "email", position: { x: 250, y: 950 }, data: { subject: "quick thing before I forget", templateName: "Soft Offer" } },
    ],
    edges: [
      { id: "e1", source: "trigger-1", target: "email-1" },
      { id: "e2", source: "email-1", target: "delay-1" },
      { id: "e3", source: "delay-1", target: "email-2" },
      { id: "e4", source: "email-2", target: "delay-2" },
      { id: "e5", source: "delay-2", target: "email-3" },
      { id: "e6", source: "email-3", target: "delay-3" },
      { id: "e7", source: "delay-3", target: "email-4" },
      { id: "e8", source: "email-4", target: "delay-4" },
      { id: "e9", source: "delay-4", target: "email-5" },
    ],
  },
  {
    name: "Re-engagement Campaign",
    description: "Win back inactive subscribers with personal, low-pressure touches",
    category: "re_engagement" as const,
    trigger: { type: "manual", config: {} },
    nodes: [
      { id: "trigger-1", type: "trigger", position: { x: 250, y: 50 }, data: { triggerType: "manual" } },
      { id: "email-1", type: "email", position: { x: 250, y: 150 }, data: { subject: "been a minute, wanted to say hey", templateName: "Personal Catch-up" } },
      { id: "delay-1", type: "delay", position: { x: 250, y: 250 }, data: { delayValue: 3, delayUnit: "days" } },
      { id: "condition-1", type: "condition", position: { x: 250, y: 350 }, data: { conditionType: "opened_email" } },
      { id: "email-2", type: "email", position: { x: 100, y: 450 }, data: { subject: "made something I think you'll dig", templateName: "Soft Product Link" } },
      { id: "email-3", type: "email", position: { x: 400, y: 450 }, data: { subject: "totally get it if the timing isn't right", templateName: "Low Pressure Last Touch" } },
    ],
    edges: [
      { id: "e1", source: "trigger-1", target: "email-1" },
      { id: "e2", source: "email-1", target: "delay-1" },
      { id: "e3", source: "delay-1", target: "condition-1" },
      { id: "e4", source: "condition-1", target: "email-2", sourceHandle: "yes" },
      { id: "e5", source: "condition-1", target: "email-3", sourceHandle: "no" },
    ],
  },
  {
    name: "Product Launch",
    description: "7-email launch sequence that builds anticipation before the reveal",
    category: "sales" as const,
    trigger: { type: "manual", config: {} },
    nodes: [
      { id: "trigger-1", type: "trigger", position: { x: 250, y: 50 }, data: { triggerType: "manual" } },
      { id: "email-1", type: "email", position: { x: 250, y: 150 }, data: { subject: "been working on something for a while now", templateName: "Tease" } },
      { id: "delay-1", type: "delay", position: { x: 250, y: 250 }, data: { delayValue: 2, delayUnit: "days" } },
      { id: "email-2", type: "email", position: { x: 250, y: 350 }, data: { subject: "okay here's a little more about what I've been building", templateName: "Deeper Tease" } },
      { id: "delay-2", type: "delay", position: { x: 250, y: 450 }, data: { delayValue: 2, delayUnit: "days" } },
      { id: "email-3", type: "email", position: { x: 250, y: 550 }, data: { subject: "I'm honestly nervous to share this", templateName: "Vulnerability" } },
      { id: "delay-3", type: "delay", position: { x: 250, y: 650 }, data: { delayValue: 1, delayUnit: "days" } },
      { id: "email-4", type: "email", position: { x: 250, y: 750 }, data: { subject: "it's live. here's what it is", templateName: "The Reveal" } },
      { id: "delay-4", type: "delay", position: { x: 250, y: 850 }, data: { delayValue: 1, delayUnit: "days" } },
      { id: "email-5", type: "email", position: { x: 250, y: 950 }, data: { subject: "the response has been kind of crazy honestly", templateName: "Social Proof" } },
      { id: "delay-5", type: "delay", position: { x: 250, y: 1050 }, data: { delayValue: 2, delayUnit: "days" } },
      { id: "email-6", type: "email", position: { x: 250, y: 1150 }, data: { subject: "here's what's actually inside", templateName: "Breakdown" } },
      { id: "delay-6", type: "delay", position: { x: 250, y: 1250 }, data: { delayValue: 2, delayUnit: "days" } },
      { id: "email-7", type: "email", position: { x: 250, y: 1350 }, data: { subject: "last thing on this, then I'll move on", templateName: "Last Chance" } },
      { id: "goal-1", type: "goal", position: { x: 250, y: 1450 }, data: { goalType: "purchase", description: "Made a purchase" } },
    ],
    edges: [
      { id: "e1", source: "trigger-1", target: "email-1" },
      { id: "e2", source: "email-1", target: "delay-1" },
      { id: "e3", source: "delay-1", target: "email-2" },
      { id: "e4", source: "email-2", target: "delay-2" },
      { id: "e5", source: "delay-2", target: "email-3" },
      { id: "e6", source: "email-3", target: "delay-3" },
      { id: "e7", source: "delay-3", target: "email-4" },
      { id: "e8", source: "email-4", target: "delay-4" },
      { id: "e9", source: "delay-4", target: "email-5" },
      { id: "e10", source: "email-5", target: "delay-5" },
      { id: "e11", source: "delay-5", target: "email-6" },
      { id: "e12", source: "email-6", target: "delay-6" },
      { id: "e13", source: "delay-6", target: "email-7" },
      { id: "e14", source: "email-7", target: "goal-1" },
    ],
  },
  {
    name: "Nurture Sequence",
    description: "Build trust with story-driven value before a soft product reveal",
    category: "nurture" as const,
    trigger: { type: "tag_added", config: {} },
    nodes: [
      { id: "trigger-1", type: "trigger", position: { x: 250, y: 50 }, data: { triggerType: "tag_added" } },
      { id: "email-1", type: "email", position: { x: 250, y: 150 }, data: { subject: "here's that thing you grabbed", templateName: "Download Delivery" } },
      { id: "delay-1", type: "delay", position: { x: 250, y: 250 }, data: { delayValue: 2, delayUnit: "days" } },
      { id: "email-2", type: "email", position: { x: 250, y: 350 }, data: { subject: "quick tip that changed everything for me", templateName: "Pure Value" } },
      { id: "delay-2", type: "delay", position: { x: 250, y: 450 }, data: { delayValue: 3, delayUnit: "days" } },
      { id: "email-3", type: "email", position: { x: 250, y: 550 }, data: { subject: "the mistake I kept making for months", templateName: "Story Value" } },
      { id: "delay-3", type: "delay", position: { x: 250, y: 650 }, data: { delayValue: 4, delayUnit: "days" } },
      { id: "email-4", type: "email", position: { x: 250, y: 750 }, data: { subject: "made something you might like", templateName: "Soft Product Reveal" } },
    ],
    edges: [
      { id: "e1", source: "trigger-1", target: "email-1" },
      { id: "e2", source: "email-1", target: "delay-1" },
      { id: "e3", source: "delay-1", target: "email-2" },
      { id: "e4", source: "email-2", target: "delay-2" },
      { id: "e5", source: "delay-2", target: "email-3" },
      { id: "e6", source: "email-3", target: "delay-3" },
      { id: "e7", source: "delay-3", target: "email-4" },
    ],
  },
  {
    name: "Post-Purchase Onboarding",
    description: "Casual onboarding that helps customers succeed and asks for a review",
    category: "onboarding" as const,
    trigger: { type: "product_purchase", config: {} },
    nodes: [
      { id: "trigger-1", type: "trigger", position: { x: 250, y: 50 }, data: { triggerType: "product_purchase" } },
      { id: "email-1", type: "email", position: { x: 250, y: 150 }, data: { subject: "you're in. here's how to get started", templateName: "Access Link" } },
      { id: "delay-1", type: "delay", position: { x: 250, y: 250 }, data: { delayValue: 1, delayUnit: "days" } },
      { id: "email-2", type: "email", position: { x: 250, y: 350 }, data: { subject: "quick tip to get the most out of this", templateName: "Usage Tip" } },
      { id: "delay-2", type: "delay", position: { x: 250, y: 450 }, data: { delayValue: 3, delayUnit: "days" } },
      { id: "email-3", type: "email", position: { x: 250, y: 550 }, data: { subject: "how's it going so far", templateName: "Check-in" } },
      { id: "delay-3", type: "delay", position: { x: 250, y: 650 }, data: { delayValue: 7, delayUnit: "days" } },
      { id: "email-4", type: "email", position: { x: 250, y: 750 }, data: { subject: "quick favor if you have a sec", templateName: "Review Request" } },
    ],
    edges: [
      { id: "e1", source: "trigger-1", target: "email-1" },
      { id: "e2", source: "email-1", target: "delay-1" },
      { id: "e3", source: "delay-1", target: "email-2" },
      { id: "e4", source: "email-2", target: "delay-2" },
      { id: "e5", source: "delay-2", target: "email-3" },
      { id: "e6", source: "email-3", target: "delay-3" },
      { id: "e7", source: "delay-3", target: "email-4" },
    ],
  },
];

// Get all templates
export const getTemplates = query({
  args: {
    category: v.optional(
      v.union(
        v.literal("welcome"),
        v.literal("nurture"),
        v.literal("sales"),
        v.literal("re_engagement"),
        v.literal("onboarding"),
        v.literal("custom")
      )
    ),
  },
  handler: async (ctx, args) => {
    let templates;

    if (args.category) {
      templates = await ctx.db
        .query("workflowTemplates")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .take(500);
    } else {
      templates = await ctx.db.query("workflowTemplates").take(500);
    }

    // If no templates in DB, return system templates
    if (templates.length === 0) {
      const systemTemplates = args.category
        ? SYSTEM_TEMPLATES.filter((t) => t.category === args.category)
        : SYSTEM_TEMPLATES;
      return systemTemplates.map((t, i) => ({
        _id: `system-${i}` as any,
        ...t,
        isPublic: true,
        usageCount: 0,
        createdAt: Date.now(),
      }));
    }

    return templates;
  },
});

// Get system templates (pre-built)
export const getSystemTemplates = query({
  args: {},
  handler: async () => {
    return SYSTEM_TEMPLATES.map((t, i) => ({
      id: `system-${i}`,
      ...t,
    }));
  },
});

// Use a template (create workflow from template)
export const useTemplate = mutation({
  args: {
    templateId: v.string(),
    storeId: v.string(),
    userId: v.string(),
    workflowName: v.string(),
  },
  handler: async (ctx, args) => {
    let template;

    // Check if it's a system template
    if (args.templateId.startsWith("system-")) {
      const index = parseInt(args.templateId.replace("system-", ""));
      template = SYSTEM_TEMPLATES[index];
    } else {
      template = await ctx.db.get(args.templateId as Id<"workflowTemplates">);
    }

    if (!template) {
      throw new Error("Template not found");
    }

    // Create workflow from template
    const workflowId = await ctx.db.insert("emailWorkflows", {
      name: args.workflowName,
      description: template.description,
      storeId: args.storeId,
      userId: args.userId,
      isActive: false,
      trigger: template.trigger as any,
      nodes: template.nodes as any,
      edges: template.edges as any,
      totalExecutions: 0,
    });

    // Update template usage count if it's in DB
    if (!args.templateId.startsWith("system-")) {
      const dbTemplate = await ctx.db.get(args.templateId as Id<"workflowTemplates">);
      if (dbTemplate) {
        await ctx.db.patch(args.templateId as Id<"workflowTemplates">, {
          usageCount: dbTemplate.usageCount + 1,
        });
      }
    }

    return workflowId;
  },
});

// Save workflow as template
export const saveAsTemplate = mutation({
  args: {
    workflowId: v.id("emailWorkflows"),
    name: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("welcome"),
      v.literal("nurture"),
      v.literal("sales"),
      v.literal("re_engagement"),
      v.literal("onboarding"),
      v.literal("custom")
    ),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow) throw new Error("Workflow not found");

    return await ctx.db.insert("workflowTemplates", {
      name: args.name,
      description: args.description,
      category: args.category,
      trigger: workflow.trigger,
      nodes: workflow.nodes,
      edges: workflow.edges,
      isPublic: false,
      creatorId: workflow.userId,
      usageCount: 0,
      createdAt: Date.now(),
    });
  },
});

// Delete a user template
export const deleteTemplate = mutation({
  args: {
    templateId: v.id("workflowTemplates"),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    if (!template) throw new Error("Template not found");
    if (template.isPublic) throw new Error("Cannot delete system templates");

    await ctx.db.delete(args.templateId);
  },
});

// Get goal completions for a workflow
export const getGoalCompletions = query({
  args: {
    workflowId: v.id("emailWorkflows"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    const completions = await ctx.db
      .query("workflowGoalCompletions")
      .withIndex("by_workflowId", (q) => q.eq("workflowId", args.workflowId))
      .order("desc")
      .take(limit);

    // Enrich with contact info
    const enriched = await Promise.all(
      completions.map(async (c) => {
        const contact = await ctx.db.get(c.contactId);
        return {
          ...c,
          contactEmail: contact?.email,
          contactName: contact?.firstName
            ? `${contact.firstName} ${contact.lastName || ""}`.trim()
            : undefined,
        };
      })
    );

    return enriched;
  },
});

// Get goal completion stats for a workflow
export const getGoalStats = query({
  args: {
    workflowId: v.id("emailWorkflows"),
  },
  handler: async (ctx, args) => {
    const completions = await ctx.db
      .query("workflowGoalCompletions")
      .withIndex("by_workflowId", (q) => q.eq("workflowId", args.workflowId))
      .take(500);

    // Get total executions
    const executions = await ctx.db
      .query("workflowExecutions")
      .withIndex("by_workflowId", (q) => q.eq("workflowId", args.workflowId))
      .take(500);

    const totalExecutions = executions.length;
    const completedGoals = completions.length;
    const conversionRate = totalExecutions > 0 ? (completedGoals / totalExecutions) * 100 : 0;

    // Calculate average time to complete
    const avgTimeToComplete =
      completions.length > 0
        ? completions.reduce((sum, c) => sum + c.timeToComplete, 0) / completions.length
        : 0;

    // Group by goal type
    const byGoalType = completions.reduce(
      (acc, c) => {
        acc[c.goalType] = (acc[c.goalType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalExecutions,
      completedGoals,
      conversionRate: Math.round(conversionRate * 100) / 100,
      avgTimeToCompleteHours: Math.round(avgTimeToComplete / (1000 * 60 * 60) * 10) / 10,
      byGoalType,
    };
  },
});

// ─── Real Workflow Data: Extracted from PPR Email Workflow Engine ──────────
// Source files: convex/emailWorkflowActions.ts, convex/schema.ts,
//               convex/workflowTemplates.ts, convex/emailTemplates.ts

// Real node types from convex/schema.ts lines 588-603
export type NodeType =
  | "trigger"
  | "email"
  | "delay"
  | "condition"
  | "action"
  | "stop"
  | "goal"
  | "purchaseCheck"
  | "courseCycle";

// Real trigger types from convex/schema.ts lines 554-581
export type TriggerType =
  | "lead_signup"
  | "product_purchase"
  | "tag_added"
  | "manual"
  | "form_submit"
  | "all_users"
  | "new_signup";

export type WorkflowNode = {
  id: string;
  type: NodeType;
  label: string;
  data?: {
    subject?: string;
    previewText?: string;
    delayValue?: number;
    delayUnit?: string;
    conditionType?: string;
    conditionLabel?: string;
    tagName?: string;
    triggerType?: TriggerType;
    triggerTag?: string;
  };
};

export type WorkflowEdge = {
  source: string;
  target: string;
  sourceHandle?: "yes" | "no";
};

// ─── The Free Pack → Paid Pack Workflow ─────────────────────────────────
// Based on convex/emailTemplates.ts "free-pack-to-paid-funnel" (lines 1265-1301)
// and the real Nurture Sequence template from convex/workflowTemplates.ts
// Combined with the actual execution engine logic from convex/emailWorkflowActions.ts
export const WORKFLOW_NODES: WorkflowNode[] = [
  {
    id: "trigger-1",
    type: "trigger",
    label: "Tag Added",
    data: {
      triggerType: "tag_added",
      triggerTag: "free-pack-download",
    },
  },
  {
    id: "condition-1",
    type: "condition",
    label: "Has purchased?",
    data: {
      conditionType: "has_purchased",
      conditionLabel: "Has purchased sample pack?",
    },
  },
  {
    id: "email-1",
    type: "email",
    label: "Email 1",
    data: {
      // Real subject from convex/emailTemplates.ts line 1275
      subject: "Your free pack is ready! 🎁",
      previewText: "Download your samples and start making beats",
    },
  },
  {
    id: "action-1",
    type: "action",
    label: "Add Tag",
    data: { tagName: "sent-welcome-email" },
  },
  {
    id: "delay-1",
    type: "delay",
    label: "Wait 24h",
    data: { delayValue: 1, delayUnit: "days" },
  },
  {
    id: "condition-2",
    type: "condition",
    label: "Has purchased?",
    data: {
      conditionType: "has_purchased",
      conditionLabel: "Has purchased sample pack?",
    },
  },
  {
    id: "email-2",
    type: "email",
    label: "Email 2",
    data: {
      // Real subject from convex/emailTemplates.ts line 1280
      subject: "3 ways to use your samples in beats",
      previewText: "Producer tips you need to try today",
    },
  },
  {
    id: "action-2",
    type: "action",
    label: "Add Tag",
    data: { tagName: "sent-tips-email" },
  },
  {
    id: "delay-2",
    type: "delay",
    label: "Wait 3 days",
    data: { delayValue: 3, delayUnit: "days" },
  },
  {
    id: "condition-3",
    type: "condition",
    label: "Has purchased?",
    data: {
      conditionType: "has_purchased",
      conditionLabel: "Has purchased sample pack?",
    },
  },
  {
    id: "email-3",
    type: "email",
    label: "Email 3",
    data: {
      // Real subject from convex/emailTemplates.ts line 1285
      subject: "Here's what's NOT in the free pack...",
      previewText: "The premium sounds you're missing",
    },
  },
  {
    id: "delay-3",
    type: "delay",
    label: "Wait 3 days",
    data: { delayValue: 3, delayUnit: "days" },
  },
  {
    id: "email-4",
    type: "email",
    label: "Email 4",
    data: {
      // Real subject from convex/emailTemplates.ts line 1290
      subject: "My full sample collection",
      previewText: "Every sound you need in one place",
    },
  },
  {
    id: "delay-4",
    type: "delay",
    label: "Wait 5 days",
    data: { delayValue: 5, delayUnit: "days" },
  },
  {
    id: "email-5",
    type: "email",
    label: "Email 5",
    data: {
      // Real subject from convex/emailTemplates.ts line 1295
      subject: "Exclusive: 25% off for free pack users",
      previewText: "This offer expires in 48 hours",
    },
  },
  {
    id: "goal-1",
    type: "goal",
    label: "Purchase Complete",
  },
];

export const WORKFLOW_EDGES: WorkflowEdge[] = [
  { source: "trigger-1", target: "condition-1" },
  { source: "condition-1", target: "goal-1", sourceHandle: "yes" },
  { source: "condition-1", target: "email-1", sourceHandle: "no" },
  { source: "email-1", target: "action-1" },
  { source: "action-1", target: "delay-1" },
  { source: "delay-1", target: "condition-2" },
  { source: "condition-2", target: "goal-1", sourceHandle: "yes" },
  { source: "condition-2", target: "email-2", sourceHandle: "no" },
  { source: "email-2", target: "action-2" },
  { source: "action-2", target: "delay-2" },
  { source: "delay-2", target: "condition-3" },
  { source: "condition-3", target: "goal-1", sourceHandle: "yes" },
  { source: "condition-3", target: "email-3", sourceHandle: "no" },
  { source: "email-3", target: "delay-3" },
  { source: "delay-3", target: "email-4" },
  { source: "delay-3", target: "delay-4" },
  { source: "delay-4", target: "email-5" },
  { source: "email-5", target: "goal-1" },
];

// ─── Real Engine Data ───────────────────────────────────────────────────
// From convex/emailWorkflowActions.ts

// Real function names from the codebase
export const ENGINE = {
  processorFn: "processEmailWorkflowExecutions", // line 25
  broadcastFn: "sendWorkflowBroadcast", // line 1151
  executeFn: "executeWorkflowNode", // line 144
  cronInterval: "60 seconds", // convex/crons.ts
  tableName: "workflowExecutions", // convex/schema.ts line 681
  contactsTable: "emailContacts", // convex/emailContacts.ts
};

// Real per-recipient variables from line 1076
export const PER_RECIPIENT_VARS = [
  "{{level}}",
  "{{xp}}",
  "{{coursesEnrolled}}",
  "{{lessonsCompleted}}",
  "{{storeName}}",
  "{{memberSince}}",
  "{{daysSinceJoined}}",
  "{{totalSpent}}",
];

// Broadcast-safe variables (line 1081-1085)
export const BROADCAST_SAFE_VARS = [
  "{{firstName}}",
  "{{email}}",
  "{{unsubscribeLink}}",
  "{{senderName}}",
  "{{platformUrl}}",
];

// Node colors for visualization
export const NODE_COLORS: Record<string, string> = {
  trigger: "#22c55e", // green
  email: "#6366f1", // indigo
  condition: "#f59e0b", // amber
  delay: "#71717a", // zinc-500
  action: "#8b5cf6", // violet
  goal: "#22c55e", // green
  stop: "#ef4444", // red
  purchaseCheck: "#f59e0b", // amber
};

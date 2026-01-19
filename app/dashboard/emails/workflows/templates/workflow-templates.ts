import { Node, Edge } from "reactflow";

export type WorkflowTemplate = {
  id: string;
  name: string;
  description: string;
  category: "onboarding" | "sales" | "engagement" | "education";
  icon: string;
  estimatedTime: string;
  nodes: Node[];
  edges: Edge[];
};

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: "welcome-series",
    name: "Welcome Series",
    description:
      "Onboard new leads with a 3-email welcome sequence. Introduce yourself, share your best content, and guide them to take action.",
    category: "onboarding",
    icon: "wave",
    estimatedTime: "5 days",
    nodes: [
      {
        id: "node_0",
        type: "trigger",
        position: { x: 250, y: 0 },
        data: {
          triggerType: "lead_signup",
          description: "When a lead signs up",
        },
      },
      {
        id: "node_1",
        type: "email",
        position: { x: 250, y: 120 },
        data: {
          subject: "Welcome to {{storeName}}!",
          body: "<p>Hey {{firstName}},</p><p>Welcome! I'm thrilled you're here.</p><p>Here's what you can expect from me...</p>",
          templateName: "Welcome Email",
        },
      },
      {
        id: "node_2",
        type: "delay",
        position: { x: 250, y: 240 },
        data: {
          delayValue: 2,
          delayUnit: "days",
        },
      },
      {
        id: "node_3",
        type: "email",
        position: { x: 250, y: 360 },
        data: {
          subject: "My best resources for you",
          body: "<p>Hey {{firstName}},</p><p>I wanted to share some of my best free resources to help you get started...</p>",
          templateName: "Value Email",
        },
      },
      {
        id: "node_4",
        type: "delay",
        position: { x: 250, y: 480 },
        data: {
          delayValue: 3,
          delayUnit: "days",
        },
      },
      {
        id: "node_5",
        type: "email",
        position: { x: 250, y: 600 },
        data: {
          subject: "Ready to level up?",
          body: "<p>Hey {{firstName}},</p><p>Now that you've had a chance to explore, here's how we can work together...</p>",
          templateName: "CTA Email",
        },
      },
      {
        id: "node_6",
        type: "action",
        position: { x: 250, y: 720 },
        data: {
          actionType: "add_tag",
          value: "completed-welcome-series",
        },
      },
    ],
    edges: [
      { id: "e0-1", source: "node_0", target: "node_1" },
      { id: "e1-2", source: "node_1", target: "node_2" },
      { id: "e2-3", source: "node_2", target: "node_3" },
      { id: "e3-4", source: "node_3", target: "node_4" },
      { id: "e4-5", source: "node_4", target: "node_5" },
      { id: "e5-6", source: "node_5", target: "node_6" },
    ],
  },
  {
    id: "purchase-followup",
    name: "Purchase Follow-up",
    description:
      "Thank customers after a purchase, deliver value, and ask for a review. Perfect for digital products and courses.",
    category: "sales",
    icon: "shoppingBag",
    estimatedTime: "7 days",
    nodes: [
      {
        id: "node_0",
        type: "trigger",
        position: { x: 250, y: 0 },
        data: {
          triggerType: "product_purchase",
          description: "When a product is purchased",
        },
      },
      {
        id: "node_1",
        type: "email",
        position: { x: 250, y: 120 },
        data: {
          subject: "Thank you for your purchase!",
          body: "<p>Hey {{firstName}},</p><p>Thank you so much for your purchase! Here's how to access your content...</p>",
          templateName: "Thank You Email",
        },
      },
      {
        id: "node_2",
        type: "delay",
        position: { x: 250, y: 240 },
        data: {
          delayValue: 3,
          delayUnit: "days",
        },
      },
      {
        id: "node_3",
        type: "email",
        position: { x: 250, y: 360 },
        data: {
          subject: "How's it going with {{productName}}?",
          body: "<p>Hey {{firstName}},</p><p>I wanted to check in and see how you're doing with your purchase. Any questions?</p>",
          templateName: "Check-in Email",
        },
      },
      {
        id: "node_4",
        type: "delay",
        position: { x: 250, y: 480 },
        data: {
          delayValue: 4,
          delayUnit: "days",
        },
      },
      {
        id: "node_5",
        type: "email",
        position: { x: 250, y: 600 },
        data: {
          subject: "Quick favor?",
          body: "<p>Hey {{firstName}},</p><p>If you're enjoying the product, would you mind leaving a quick review? It really helps!</p>",
          templateName: "Review Request",
        },
      },
      {
        id: "node_6",
        type: "action",
        position: { x: 250, y: 720 },
        data: {
          actionType: "add_tag",
          value: "review-requested",
        },
      },
    ],
    edges: [
      { id: "e0-1", source: "node_0", target: "node_1" },
      { id: "e1-2", source: "node_1", target: "node_2" },
      { id: "e2-3", source: "node_2", target: "node_3" },
      { id: "e3-4", source: "node_3", target: "node_4" },
      { id: "e4-5", source: "node_4", target: "node_5" },
      { id: "e5-6", source: "node_5", target: "node_6" },
    ],
  },
  {
    id: "course-onboarding",
    name: "Course Onboarding",
    description:
      "Guide new students through your course with scheduled check-ins and encouragement to complete lessons.",
    category: "education",
    icon: "graduationCap",
    estimatedTime: "14 days",
    nodes: [
      {
        id: "node_0",
        type: "trigger",
        position: { x: 250, y: 0 },
        data: {
          triggerType: "product_purchase",
          description: "When enrolled in a course",
        },
      },
      {
        id: "node_1",
        type: "email",
        position: { x: 250, y: 120 },
        data: {
          subject: "Welcome to the course! Here's how to get started",
          body: "<p>Hey {{firstName}},</p><p>Congrats on enrolling! Here's your roadmap to success...</p>",
          templateName: "Course Welcome",
        },
      },
      {
        id: "node_2",
        type: "delay",
        position: { x: 250, y: 240 },
        data: {
          delayValue: 2,
          delayUnit: "days",
        },
      },
      {
        id: "node_3",
        type: "condition",
        position: { x: 250, y: 360 },
        data: {
          conditionType: "opened_email",
          description: "Opened welcome email?",
        },
      },
      {
        id: "node_4",
        type: "email",
        position: { x: 100, y: 500 },
        data: {
          subject: "Great progress! Keep it up",
          body: "<p>Hey {{firstName}},</p><p>I see you're diving in - that's awesome! Here are some tips for Module 1...</p>",
          templateName: "Progress Email",
        },
      },
      {
        id: "node_5",
        type: "email",
        position: { x: 400, y: 500 },
        data: {
          subject: "Don't miss out on your course",
          body: "<p>Hey {{firstName}},</p><p>I noticed you haven't started yet. Need any help getting set up?</p>",
          templateName: "Reminder Email",
        },
      },
      {
        id: "node_6",
        type: "delay",
        position: { x: 250, y: 640 },
        data: {
          delayValue: 5,
          delayUnit: "days",
        },
      },
      {
        id: "node_7",
        type: "email",
        position: { x: 250, y: 760 },
        data: {
          subject: "How's the course going?",
          body: "<p>Hey {{firstName}},</p><p>Just checking in! Any questions about the material so far?</p>",
          templateName: "Mid-course Check-in",
        },
      },
      {
        id: "node_8",
        type: "delay",
        position: { x: 250, y: 880 },
        data: {
          delayValue: 7,
          delayUnit: "days",
        },
      },
      {
        id: "node_9",
        type: "email",
        position: { x: 250, y: 1000 },
        data: {
          subject: "You're almost there!",
          body: "<p>Hey {{firstName}},</p><p>You're making great progress! Here's what to focus on to finish strong...</p>",
          templateName: "Final Push Email",
        },
      },
    ],
    edges: [
      { id: "e0-1", source: "node_0", target: "node_1" },
      { id: "e1-2", source: "node_1", target: "node_2" },
      { id: "e2-3", source: "node_2", target: "node_3" },
      { id: "e3-4", source: "node_3", target: "node_4", sourceHandle: "yes" },
      { id: "e3-5", source: "node_3", target: "node_5", sourceHandle: "no" },
      { id: "e4-6", source: "node_4", target: "node_6" },
      { id: "e5-6", source: "node_5", target: "node_6" },
      { id: "e6-7", source: "node_6", target: "node_7" },
      { id: "e7-8", source: "node_7", target: "node_8" },
      { id: "e8-9", source: "node_8", target: "node_9" },
    ],
  },
  {
    id: "re-engagement",
    name: "Re-engagement Campaign",
    description:
      "Win back inactive subscribers with a compelling offer or reminder of the value you provide.",
    category: "engagement",
    icon: "heart",
    estimatedTime: "7 days",
    nodes: [
      {
        id: "node_0",
        type: "trigger",
        position: { x: 250, y: 0 },
        data: {
          triggerType: "tag_added",
          description: "When tagged as inactive",
        },
      },
      {
        id: "node_1",
        type: "email",
        position: { x: 250, y: 120 },
        data: {
          subject: "We miss you, {{firstName}}!",
          body: "<p>Hey {{firstName}},</p><p>It's been a while! I wanted to share what's new and exciting...</p>",
          templateName: "Re-engagement Email 1",
        },
      },
      {
        id: "node_2",
        type: "delay",
        position: { x: 250, y: 240 },
        data: {
          delayValue: 3,
          delayUnit: "days",
        },
      },
      {
        id: "node_3",
        type: "condition",
        position: { x: 250, y: 360 },
        data: {
          conditionType: "opened_email",
          description: "Opened re-engagement email?",
        },
      },
      {
        id: "node_4",
        type: "action",
        position: { x: 100, y: 500 },
        data: {
          actionType: "remove_tag",
          value: "inactive",
        },
      },
      {
        id: "node_5",
        type: "email",
        position: { x: 400, y: 500 },
        data: {
          subject: "Last chance: Special offer inside",
          body: "<p>Hey {{firstName}},</p><p>I have a special offer just for you to help you get back on track...</p>",
          templateName: "Re-engagement Offer",
        },
      },
      {
        id: "node_6",
        type: "delay",
        position: { x: 400, y: 620 },
        data: {
          delayValue: 4,
          delayUnit: "days",
        },
      },
      {
        id: "node_7",
        type: "condition",
        position: { x: 400, y: 740 },
        data: {
          conditionType: "opened_email",
          description: "Opened offer email?",
        },
      },
      {
        id: "node_8",
        type: "action",
        position: { x: 300, y: 880 },
        data: {
          actionType: "remove_tag",
          value: "inactive",
        },
      },
      {
        id: "node_9",
        type: "action",
        position: { x: 500, y: 880 },
        data: {
          actionType: "add_tag",
          value: "unengaged",
        },
      },
    ],
    edges: [
      { id: "e0-1", source: "node_0", target: "node_1" },
      { id: "e1-2", source: "node_1", target: "node_2" },
      { id: "e2-3", source: "node_2", target: "node_3" },
      { id: "e3-4", source: "node_3", target: "node_4", sourceHandle: "yes" },
      { id: "e3-5", source: "node_3", target: "node_5", sourceHandle: "no" },
      { id: "e5-6", source: "node_5", target: "node_6" },
      { id: "e6-7", source: "node_6", target: "node_7" },
      { id: "e7-8", source: "node_7", target: "node_8", sourceHandle: "yes" },
      { id: "e7-9", source: "node_7", target: "node_9", sourceHandle: "no" },
    ],
  },
  {
    id: "lead-nurture",
    name: "Lead Nurture Sequence",
    description:
      "Nurture leads over time with valuable content, building trust before making an offer.",
    category: "sales",
    icon: "seedling",
    estimatedTime: "14 days",
    nodes: [
      {
        id: "node_0",
        type: "trigger",
        position: { x: 250, y: 0 },
        data: {
          triggerType: "tag_added",
          description: "When tagged for nurture",
        },
      },
      {
        id: "node_1",
        type: "email",
        position: { x: 250, y: 120 },
        data: {
          subject: "The #1 mistake most producers make",
          body: "<p>Hey {{firstName}},</p><p>Let me share the biggest mistake I see producers make...</p>",
          templateName: "Nurture Email 1",
        },
      },
      {
        id: "node_2",
        type: "delay",
        position: { x: 250, y: 240 },
        data: {
          delayValue: 3,
          delayUnit: "days",
        },
      },
      {
        id: "node_3",
        type: "email",
        position: { x: 250, y: 360 },
        data: {
          subject: "How I went from bedroom producer to...",
          body: "<p>Hey {{firstName}},</p><p>Here's my story and the lessons I learned along the way...</p>",
          templateName: "Story Email",
        },
      },
      {
        id: "node_4",
        type: "delay",
        position: { x: 250, y: 480 },
        data: {
          delayValue: 3,
          delayUnit: "days",
        },
      },
      {
        id: "node_5",
        type: "email",
        position: { x: 250, y: 600 },
        data: {
          subject: "Free resource: My production checklist",
          body: "<p>Hey {{firstName}},</p><p>I want to give you something that's helped hundreds of my students...</p>",
          templateName: "Value Email",
        },
      },
      {
        id: "node_6",
        type: "delay",
        position: { x: 250, y: 720 },
        data: {
          delayValue: 4,
          delayUnit: "days",
        },
      },
      {
        id: "node_7",
        type: "email",
        position: { x: 250, y: 840 },
        data: {
          subject: "Case study: How {{studentName}} did it",
          body: "<p>Hey {{firstName}},</p><p>Let me share a success story that might inspire you...</p>",
          templateName: "Social Proof Email",
        },
      },
      {
        id: "node_8",
        type: "delay",
        position: { x: 250, y: 960 },
        data: {
          delayValue: 4,
          delayUnit: "days",
        },
      },
      {
        id: "node_9",
        type: "email",
        position: { x: 250, y: 1080 },
        data: {
          subject: "Ready to take the next step?",
          body: "<p>Hey {{firstName}},</p><p>If you're serious about leveling up, here's how I can help...</p>",
          templateName: "Soft Pitch Email",
        },
      },
      {
        id: "node_10",
        type: "action",
        position: { x: 250, y: 1200 },
        data: {
          actionType: "add_tag",
          value: "nurture-complete",
        },
      },
    ],
    edges: [
      { id: "e0-1", source: "node_0", target: "node_1" },
      { id: "e1-2", source: "node_1", target: "node_2" },
      { id: "e2-3", source: "node_2", target: "node_3" },
      { id: "e3-4", source: "node_3", target: "node_4" },
      { id: "e4-5", source: "node_4", target: "node_5" },
      { id: "e5-6", source: "node_5", target: "node_6" },
      { id: "e6-7", source: "node_6", target: "node_7" },
      { id: "e7-8", source: "node_7", target: "node_8" },
      { id: "e8-9", source: "node_8", target: "node_9" },
      { id: "e9-10", source: "node_9", target: "node_10" },
    ],
  },
  {
    id: "sample-pack-promo",
    name: "Sample Pack Promotion",
    description: "Promote a new sample pack or sound library with a limited-time offer sequence.",
    category: "sales",
    icon: "music",
    estimatedTime: "5 days",
    nodes: [
      {
        id: "node_0",
        type: "trigger",
        position: { x: 250, y: 0 },
        data: {
          triggerType: "manual",
          description: "Manual enrollment for promo",
        },
      },
      {
        id: "node_1",
        type: "email",
        position: { x: 250, y: 120 },
        data: {
          subject: "NEW: {{packName}} just dropped",
          body: "<p>Hey {{firstName}},</p><p>I'm excited to announce my newest sample pack...</p>",
          templateName: "Launch Announcement",
        },
      },
      {
        id: "node_2",
        type: "delay",
        position: { x: 250, y: 240 },
        data: {
          delayValue: 1,
          delayUnit: "days",
        },
      },
      {
        id: "node_3",
        type: "condition",
        position: { x: 250, y: 360 },
        data: {
          conditionType: "has_purchased_product",
          description: "Already purchased?",
        },
      },
      {
        id: "node_4",
        type: "stop",
        position: { x: 100, y: 500 },
        data: {},
      },
      {
        id: "node_5",
        type: "email",
        position: { x: 400, y: 500 },
        data: {
          subject: "Hear what producers are saying about {{packName}}",
          body: "<p>Hey {{firstName}},</p><p>The response has been incredible! Here's what other producers are creating...</p>",
          templateName: "Social Proof Email",
        },
      },
      {
        id: "node_6",
        type: "delay",
        position: { x: 400, y: 620 },
        data: {
          delayValue: 2,
          delayUnit: "days",
        },
      },
      {
        id: "node_7",
        type: "email",
        position: { x: 400, y: 740 },
        data: {
          subject: "Last chance: Intro pricing ends tonight",
          body: "<p>Hey {{firstName}},</p><p>Just a heads up - the intro pricing for {{packName}} ends at midnight...</p>",
          templateName: "Urgency Email",
        },
      },
    ],
    edges: [
      { id: "e0-1", source: "node_0", target: "node_1" },
      { id: "e1-2", source: "node_1", target: "node_2" },
      { id: "e2-3", source: "node_2", target: "node_3" },
      { id: "e3-4", source: "node_3", target: "node_4", sourceHandle: "yes" },
      { id: "e3-5", source: "node_3", target: "node_5", sourceHandle: "no" },
      { id: "e5-6", source: "node_5", target: "node_6" },
      { id: "e6-7", source: "node_6", target: "node_7" },
    ],
  },
];

export const templateCategories = [
  { id: "all", label: "All Templates", icon: "grid" },
  { id: "onboarding", label: "Onboarding", icon: "userPlus" },
  { id: "sales", label: "Sales & Promos", icon: "dollarSign" },
  { id: "engagement", label: "Engagement", icon: "heart" },
  { id: "education", label: "Education", icon: "graduationCap" },
];

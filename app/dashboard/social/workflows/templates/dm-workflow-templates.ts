import { Node, Edge } from "reactflow";
import { MessageCircle, Bot, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type DMWorkflowTemplate = {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  nodes: Node[];
  edges: Edge[];
};

export const dmWorkflowTemplates: DMWorkflowTemplate[] = [
  {
    id: "comment-to-dm",
    name: "Comment-to-DM Funnel",
    description:
      "When someone comments a keyword, DM them a product link. Follow up if they don't purchase, then capture their email for nurturing.",
    icon: MessageCircle,
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-500",
    nodes: [
      {
        id: "node_0",
        type: "trigger",
        position: { x: 250, y: 0 },
        data: {
          triggerType: "comment_keyword",
          description: "When someone comments a keyword",
          keywords: ["LINK", "SEND"],
        },
      },
      {
        id: "node_1",
        type: "sendDM",
        position: { x: 250, y: 120 },
        data: {
          messageText:
            "Hey! Thanks for your interest. Here's the link you requested:",
          includeLink: "",
        },
      },
      {
        id: "node_2",
        type: "delay",
        position: { x: 250, y: 240 },
        data: { delayValue: 6, delayUnit: "hours" },
      },
      {
        id: "node_3",
        type: "dmCondition",
        position: { x: 250, y: 360 },
        data: { conditionType: "purchased" },
      },
      {
        id: "node_4",
        type: "sendDM",
        position: { x: 80, y: 500 },
        data: { messageText: "Thanks for your purchase! Let me know if you have any questions." },
      },
      {
        id: "node_5",
        type: "sendDM",
        position: { x: 420, y: 500 },
        data: {
          messageText:
            "Hey! Want some free tips? Drop your email and I'll send you my best resources.",
        },
      },
      {
        id: "node_6",
        type: "captureEmail",
        position: { x: 420, y: 620 },
        data: { retryOnFail: true, tags: ["dm-lead", "instagram-lead"] },
      },
      {
        id: "node_7",
        type: "enterEmailWorkflow",
        position: { x: 300, y: 740 },
        data: { targetWorkflowId: "", tags: ["dm-lead"] },
      },
      {
        id: "node_8",
        type: "stop",
        position: { x: 540, y: 740 },
        data: {},
      },
    ],
    edges: [
      { id: "e_0_1", source: "node_0", target: "node_1" },
      { id: "e_1_2", source: "node_1", target: "node_2" },
      { id: "e_2_3", source: "node_2", target: "node_3" },
      { id: "e_3_4", source: "node_3", target: "node_4", sourceHandle: "yes" },
      { id: "e_3_5", source: "node_3", target: "node_5", sourceHandle: "no" },
      { id: "e_5_6", source: "node_5", target: "node_6" },
      { id: "e_6_7", source: "node_6", target: "node_7", sourceHandle: "yes" },
      { id: "e_6_8", source: "node_6", target: "node_8", sourceHandle: "no" },
    ],
  },
  {
    id: "ai-conversation",
    name: "AI Conversation Funnel",
    description:
      "Start an AI-powered conversation when someone DMs you. The AI guides the conversation toward capturing their email, then bridges to your email workflow.",
    icon: Bot,
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-500",
    nodes: [
      {
        id: "node_0",
        type: "trigger",
        position: { x: 250, y: 0 },
        data: {
          triggerType: "dm_received",
          description: "When someone sends you a DM",
        },
      },
      {
        id: "node_1",
        type: "aiConversation",
        position: { x: 250, y: 120 },
        data: {
          goalDescription: "Help the user and naturally guide the conversation toward capturing their email address",
          waitForReply: true,
        },
      },
      {
        id: "node_2",
        type: "captureEmail",
        position: { x: 250, y: 260 },
        data: {
          retryOnFail: true,
          retryMessage: "I'd love to send you some exclusive resources — could you share your email?",
          tags: ["dm-lead", "ai-conversation"],
        },
      },
      {
        id: "node_3",
        type: "enterEmailWorkflow",
        position: { x: 120, y: 400 },
        data: { targetWorkflowId: "", tags: ["dm-lead"] },
      },
      {
        id: "node_4",
        type: "aiConversation",
        position: { x: 380, y: 400 },
        data: {
          goalDescription: "Continue the conversation and try again to capture email",
          waitForReply: true,
        },
      },
    ],
    edges: [
      { id: "e_0_1", source: "node_0", target: "node_1" },
      { id: "e_1_2", source: "node_1", target: "node_2" },
      { id: "e_2_3", source: "node_2", target: "node_3", sourceHandle: "yes" },
      { id: "e_2_4", source: "node_2", target: "node_4", sourceHandle: "no" },
    ],
  },
  {
    id: "simple-dm-response",
    name: "Simple DM Response",
    description:
      "Automatically respond to a comment keyword with a static DM message. Perfect for lead magnets and download links.",
    icon: Zap,
    iconBg: "bg-green-500/10",
    iconColor: "text-green-500",
    nodes: [
      {
        id: "node_0",
        type: "trigger",
        position: { x: 250, y: 0 },
        data: {
          triggerType: "comment_keyword",
          description: "When someone comments a keyword",
          keywords: ["FREE"],
        },
      },
      {
        id: "node_1",
        type: "sendDM",
        position: { x: 250, y: 120 },
        data: {
          messageText: "Hey! Here's the free resource you requested. Let me know if you have any questions!",
          includeLink: "",
        },
      },
      {
        id: "node_2",
        type: "stop",
        position: { x: 250, y: 240 },
        data: {},
      },
    ],
    edges: [
      { id: "e_0_1", source: "node_0", target: "node_1" },
      { id: "e_1_2", source: "node_1", target: "node_2" },
    ],
  },
];

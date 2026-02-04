"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Node, Edge } from "reactflow";
import { useFeatureAccess } from "@/hooks/use-feature-access";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { WysiwygEditor } from "@/components/ui/wysiwyg-editor";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Save,
  Trash2,
  AlertTriangle,
  Check,
  UserPlus,
  Search,
  Power,
  Users,
  Clock,
  Mail,
  Grid3X3,
  FileText,
  FlaskConical,
  Plus,
  X,
  Trophy,
  RotateCcw,
  Filter,
  Sparkles,
  Loader2,
  BookOpen,
  Store,
  Package,
  Wand2,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import NodeSidebar from "./components/NodeSidebar";
import WorkflowCanvas from "./components/WorkflowCanvas";
import CourseCycleConfig from "./components/CourseCycleConfig";
import {
  prebuiltEmailTemplates,
  emailTemplateCategories,
  type EmailTemplate,
} from "./templates/email-templates";

// Component to show contacts waiting at a node
function ContactsAtNodeList({
  workflowId,
  nodeId,
}: {
  workflowId: Id<"emailWorkflows">;
  nodeId: string;
}) {
  const contacts = useQuery(
    api.emailWorkflows.getContactsAtNode,
    workflowId ? { workflowId, nodeId } : "skip"
  );
  const cancelExecution = useMutation(api.emailWorkflows.cancelExecution);
  const { toast } = useToast();

  const handleRemove = async (executionId: Id<"workflowExecutions">, email: string) => {
    try {
      await cancelExecution({ executionId });
      toast({
        title: "Contact removed",
        description: `${email} has been removed from this automation.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove contact from automation.",
        variant: "destructive",
      });
    }
  };

  if (!contacts || contacts.length === 0) {
    return <p className="text-xs text-muted-foreground">No contacts waiting</p>;
  }

  return (
    <div className="max-h-[150px] space-y-1 overflow-y-auto">
      {contacts.map((contact) => (
        <div
          key={contact.executionId}
          className="flex items-center justify-between rounded bg-white px-2 py-1 text-xs dark:bg-zinc-800"
        >
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium">{contact.name || contact.email}</div>
            {contact.name && <div className="truncate text-muted-foreground">{contact.email}</div>}
          </div>
          <div className="ml-2 flex items-center gap-2">
            {contact.scheduledFor && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>
                  {new Date(contact.scheduledFor).toLocaleDateString()}{" "}
                  {new Date(contact.scheduledFor).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            )}
            <button
              onClick={() => handleRemove(contact.executionId, contact.email)}
              className="rounded p-1 text-red-500 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/30"
              title="Remove from automation"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

type TriggerType =
  | "lead_signup"
  | "product_purchase"
  | "tag_added"
  | "manual"
  | "time_delay"
  | "date_time"
  | "customer_action"
  | "segment_member"
  // Phase 8: Expanded triggers
  | "webhook"
  | "page_visit"
  | "cart_abandon"
  | "birthday"
  | "anniversary"
  | "custom_event"
  | "api_call"
  | "form_submit"
  | "email_reply";

const triggerOptions: { value: TriggerType; label: string; category?: string }[] = [
  // Core triggers
  { value: "lead_signup", label: "Lead Signs Up", category: "core" },
  { value: "product_purchase", label: "Product Purchased", category: "core" },
  { value: "tag_added", label: "Tag Added to Contact", category: "core" },
  { value: "segment_member", label: "Segment Membership", category: "core" },
  { value: "manual", label: "Manual Enrollment", category: "core" },
  // Time-based triggers
  { value: "time_delay", label: "Time Delay", category: "time" },
  { value: "date_time", label: "Specific Date/Time", category: "time" },
  { value: "birthday", label: "Contact Birthday", category: "time" },
  { value: "anniversary", label: "Subscription Anniversary", category: "time" },
  // Behavior triggers
  { value: "customer_action", label: "Customer Action", category: "behavior" },
  { value: "page_visit", label: "Page Visit", category: "behavior" },
  { value: "cart_abandon", label: "Cart Abandoned", category: "behavior" },
  { value: "email_reply", label: "Email Reply", category: "behavior" },
  { value: "form_submit", label: "Form Submitted", category: "behavior" },
  // Integration triggers
  { value: "webhook", label: "Webhook Received", category: "integration" },
  { value: "custom_event", label: "Custom Event", category: "integration" },
  { value: "api_call", label: "API Call", category: "integration" },
];

const conditionOptions = [
  { value: "opened_email", label: "Opened Email" },
  { value: "clicked_link", label: "Clicked Link" },
  { value: "has_tag", label: "Has Tag" },
  { value: "has_purchased_product", label: "Has Purchased Product" },
  { value: "time_based", label: "Time Based" },
];

const actionOptions = [
  { value: "add_tag", label: "Add Tag" },
  { value: "remove_tag", label: "Remove Tag" },
  { value: "add_to_list", label: "Add to List" },
  { value: "notify", label: "Send Notification" },
];

const delayUnits = [
  { value: "minutes", label: "Minutes" },
  { value: "hours", label: "Hours" },
  { value: "days", label: "Days" },
];

type ValidationError = {
  nodeId?: string;
  edgeId?: string;
  message: string;
};

function validateWorkflow(nodes: Node[], edges: Edge[]): ValidationError[] {
  const errors: ValidationError[] = [];

  const nodeTypeById = new Map(nodes.map((n) => [n.id, n.type || ""]));
  const nodesWithIncomingEdge = new Set(edges.map((e) => e.target));
  const nodesWithOutgoingEdge = new Set(edges.map((e) => e.source));

  for (const edge of edges) {
    const isEmailToEmail =
      nodeTypeById.get(edge.source) === "email" && nodeTypeById.get(edge.target) === "email";
    if (isEmailToEmail) {
      errors.push({
        edgeId: edge.id,
        nodeId: edge.target,
        message: "Cannot send two emails back-to-back. Add a delay node between them.",
      });
    }
  }

  for (const node of nodes) {
    const isTrigger = node.type === "trigger";
    const isOrphan = !nodesWithIncomingEdge.has(node.id) && !nodesWithOutgoingEdge.has(node.id);
    if (!isTrigger && isOrphan) {
      errors.push({
        nodeId: node.id,
        message: `Node "${node.type}" is not connected to the workflow.`,
      });
    }
  }

  for (const node of nodes) {
    if (node.type !== "email") continue;
    const mode = node.data?.mode || "custom";
    const missingTemplate = mode === "template" && !node.data?.templateId;
    const missingSubject = mode === "custom" && !node.data?.subject;
    if (missingTemplate) {
      errors.push({
        nodeId: node.id,
        message: "Email node using template mode must have a template selected.",
      });
    }
    if (missingSubject) {
      errors.push({
        nodeId: node.id,
        message: "Email node using custom mode must have a subject.",
      });
    }
  }

  return errors;
}

// Valid sequence types that match the schema
type SequenceType =
  | "welcome"
  | "buyer"
  | "course_student"
  | "coaching_client"
  | "lead_nurture"
  | "product_launch"
  | "reengagement"
  | "winback"
  | "custom";

// Pre-built workflow templates for each sequence type
function getSequenceTemplate(sequenceType?: SequenceType): { nodes: Node[]; edges: Edge[] } {
  const baseY = 50;
  const nodeSpacing = 150;

  // Helper to create nodes and edges
  const createWorkflow = (
    triggerType: TriggerType,
    triggerDescription: string,
    emails: Array<{ subject: string; body: string; previewText?: string; delayDays?: number }>
  ) => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    let nodeIndex = 0;
    let yPos = baseY;

    // Add trigger node
    nodes.push({
      id: `node_${nodeIndex}`,
      type: "trigger",
      position: { x: 250, y: yPos },
      data: { triggerType, description: triggerDescription },
    });
    const triggerId = `node_${nodeIndex}`;
    nodeIndex++;
    yPos += nodeSpacing;

    let prevNodeId = triggerId;

    // Add email and delay nodes
    emails.forEach((email) => {
      // Add delay before email (except first one)
      if (email.delayDays && email.delayDays > 0) {
        const delayId = `node_${nodeIndex}`;
        nodes.push({
          id: delayId,
          type: "delay",
          position: { x: 250, y: yPos },
          data: { delayValue: email.delayDays, delayUnit: "days" },
        });
        edges.push({
          id: `edge_${prevNodeId}_${delayId}`,
          source: prevNodeId,
          target: delayId,
        });
        prevNodeId = delayId;
        nodeIndex++;
        yPos += nodeSpacing;
      }

      // Add email node with full content
      const emailId = `node_${nodeIndex}`;
      nodes.push({
        id: emailId,
        type: "email",
        position: { x: 250, y: yPos },
        data: {
          subject: email.subject,
          body: email.body,
          previewText: email.previewText || "",
          mode: "custom",
          templateName: "",
        },
      });
      edges.push({
        id: `edge_${prevNodeId}_${emailId}`,
        source: prevNodeId,
        target: emailId,
      });
      prevNodeId = emailId;
      nodeIndex++;
      yPos += nodeSpacing;
    });

    return { nodes, edges };
  };

  switch (sequenceType) {
    case "welcome":
      return createWorkflow("lead_signup", "When a new subscriber joins", [
        {
          subject: "Welcome! Here's what to expect...",
          previewText: "You're in! Here's what happens next",
          delayDays: 0,
          body: `<p>Hey {{firstName}},</p>
<p>Welcome to the community! I'm so glad you're here.</p>
<p>Over the next few days, I'll be sharing some of my best tips and resources to help you get started.</p>
<p>Here's what you can expect:</p>
<ul>
<li>Actionable tips you can use right away</li>
<li>Free resources to help you level up</li>
<li>Behind-the-scenes insights</li>
</ul>
<p>In the meantime, feel free to reply to this email and introduce yourself. I'd love to hear about your goals!</p>
<p>Talk soon,<br/>{{senderName}}</p>`,
        },
        {
          subject: "Quick tip to get you started",
          previewText: "Here's something that helped me",
          delayDays: 1,
          body: `<p>Hey {{firstName}},</p>
<p>I wanted to share a quick tip that made a huge difference for me when I was starting out.</p>
<p><strong>The tip:</strong> [Insert your best quick-win tip here]</p>
<p>This might seem simple, but it's often the simple things that make the biggest impact.</p>
<p>Try it out today and let me know how it goes!</p>
<p>{{senderName}}</p>`,
        },
        {
          subject: "Your free resource is inside",
          previewText: "I made this for you",
          delayDays: 2,
          body: `<p>Hey {{firstName}},</p>
<p>As promised, here's a free resource I put together just for you:</p>
<p><strong>[Insert resource name and link here]</strong></p>
<p>This covers:</p>
<ul>
<li>[Key benefit 1]</li>
<li>[Key benefit 2]</li>
<li>[Key benefit 3]</li>
</ul>
<p>Download it, save it, use it. It's yours!</p>
<p>{{senderName}}</p>`,
        },
        {
          subject: "What our community is saying",
          previewText: "Real results from real people",
          delayDays: 3,
          body: `<p>Hey {{firstName}},</p>
<p>I love hearing from people in our community. Here's what some of them have shared:</p>
<blockquote>
<p>"[Insert testimonial 1]" - [Name]</p>
</blockquote>
<blockquote>
<p>"[Insert testimonial 2]" - [Name]</p>
</blockquote>
<p>These results are totally achievable for you too.</p>
<p>Ready to get started? Here's the next step: [Insert CTA]</p>
<p>{{senderName}}</p>`,
        },
      ]);

    case "buyer":
      return createWorkflow("product_purchase", "When a customer makes a purchase", [
        {
          subject: "Thank you for your purchase!",
          previewText: "Here's how to access your purchase",
          delayDays: 0,
          body: `<p>Hey {{firstName}},</p>
<p>Thank you so much for your purchase! I'm excited to have you.</p>
<p><strong>Here's how to access what you bought:</strong></p>
<p>[Insert access instructions or download link]</p>
<p>If you have any questions, just hit reply and I'll help you out.</p>
<p>Cheers,<br/>{{senderName}}</p>`,
        },
        {
          subject: "How to get the most from your purchase",
          previewText: "Quick tips to maximize your results",
          delayDays: 1,
          body: `<p>Hey {{firstName}},</p>
<p>Now that you have [product name], I wanted to share some tips to help you get the most out of it:</p>
<ol>
<li><strong>Start here:</strong> [First step recommendation]</li>
<li><strong>Quick win:</strong> [Something they can do immediately]</li>
<li><strong>Pro tip:</strong> [Advanced tip for better results]</li>
</ol>
<p>Don't try to do everything at once. Pick one thing and run with it!</p>
<p>{{senderName}}</p>`,
        },
        {
          subject: "Quick check-in: How's it going?",
          previewText: "I'd love to hear from you",
          delayDays: 3,
          body: `<p>Hey {{firstName}},</p>
<p>Just wanted to check in and see how things are going with [product name].</p>
<p>Have you had a chance to dive in yet?</p>
<p>If you're stuck or have questions, just reply to this email. I'm here to help!</p>
<p>{{senderName}}</p>`,
        },
        {
          subject: "You might also like...",
          previewText: "Based on your purchase",
          delayDays: 7,
          body: `<p>Hey {{firstName}},</p>
<p>Since you got [product name], I thought you might be interested in this:</p>
<p><strong>[Related product/offer name]</strong></p>
<p>It's perfect for [who it's for] who want to [benefit].</p>
<p>[Insert link to learn more]</p>
<p>No pressure at all - just wanted to let you know it exists!</p>
<p>{{senderName}}</p>`,
        },
      ]);

    case "course_student":
      return createWorkflow("product_purchase", "When a student enrolls in your course", [
        {
          subject: "Welcome to the course! Let's get started",
          previewText: "Your learning journey begins now",
          delayDays: 0,
          body: `<p>Hey {{firstName}},</p>
<p>Welcome to [Course Name]! I'm so excited to have you as a student.</p>
<p><strong>Here's how to get started:</strong></p>
<ol>
<li>Log in to your account: [Login link]</li>
<li>Start with Lesson 1: [Link to first lesson]</li>
<li>Join our community: [Community link if applicable]</li>
</ol>
<p>Take your time, go at your own pace, and don't hesitate to reach out if you need help.</p>
<p>Let's do this!<br/>{{senderName}}</p>`,
        },
        {
          subject: "Day 1: Your first lesson awaits",
          previewText: "Time to dive into the content",
          delayDays: 1,
          body: `<p>Hey {{firstName}},</p>
<p>Ready to dive in? Your first lesson is waiting for you!</p>
<p><strong>Today's lesson:</strong> [Lesson title]</p>
<p>In this lesson, you'll learn:</p>
<ul>
<li>[Key takeaway 1]</li>
<li>[Key takeaway 2]</li>
<li>[Key takeaway 3]</li>
</ul>
<p><a href="[lesson link]">Start Lesson 1 →</a></p>
<p>See you inside!<br/>{{senderName}}</p>`,
        },
        {
          subject: "How's your progress? Tips for success",
          previewText: "A few things that help students succeed",
          delayDays: 3,
          body: `<p>Hey {{firstName}},</p>
<p>How's the course going so far? I hope you're enjoying it!</p>
<p>Here are a few tips from students who got the best results:</p>
<ul>
<li><strong>Set a schedule:</strong> Block out dedicated learning time</li>
<li><strong>Take notes:</strong> Write down key insights as you go</li>
<li><strong>Apply immediately:</strong> Don't just watch - do the exercises!</li>
</ul>
<p>If you're stuck, hit reply and let me know. I'm here to help!</p>
<p>{{senderName}}</p>`,
        },
        {
          subject: "Halfway there! Keep up the momentum",
          previewText: "You're making great progress",
          delayDays: 7,
          body: `<p>Hey {{firstName}},</p>
<p>You're halfway through the course - amazing work!</p>
<p>By now, you should be seeing some real progress. Keep that momentum going!</p>
<p><strong>Coming up next:</strong></p>
<p>[Preview of upcoming modules/lessons]</p>
<p>The best is yet to come. Keep pushing!</p>
<p>{{senderName}}</p>`,
        },
        {
          subject: "Final stretch - you've got this!",
          previewText: "Almost at the finish line",
          delayDays: 14,
          body: `<p>Hey {{firstName}},</p>
<p>You're in the home stretch! The finish line is in sight.</p>
<p>Remember why you started this course. You wanted to [main goal/outcome].</p>
<p>Now it's time to finish strong and make it happen!</p>
<p><a href="[course link]">Continue the course →</a></p>
<p>I believe in you!<br/>{{senderName}}</p>`,
        },
      ]);

    case "coaching_client":
      return createWorkflow("tag_added", "When a client books a coaching session", [
        {
          subject: "Your session is confirmed!",
          previewText: "Details for our upcoming session",
          delayDays: 0,
          body: `<p>Hey {{firstName}},</p>
<p>Your coaching session is confirmed! I'm looking forward to working with you.</p>
<p><strong>Session details:</strong></p>
<ul>
<li><strong>Date:</strong> [Date]</li>
<li><strong>Time:</strong> [Time + timezone]</li>
<li><strong>Location:</strong> [Zoom link or location]</li>
</ul>
<p>If you need to reschedule, please let me know at least 24 hours in advance.</p>
<p>See you soon!<br/>{{senderName}}</p>`,
        },
        {
          subject: "Prepare for our session: What to bring",
          previewText: "Get the most out of our time together",
          delayDays: 1,
          body: `<p>Hey {{firstName}},</p>
<p>I'm excited for our session! To make sure we get the most out of our time, here's what I'd like you to prepare:</p>
<ul>
<li><strong>Your #1 challenge:</strong> What's the biggest thing you're struggling with?</li>
<li><strong>Your goal:</strong> What outcome would make this session a success?</li>
<li><strong>Questions:</strong> Write down any specific questions you have</li>
</ul>
<p>Take a few minutes to think through these before we meet.</p>
<p>{{senderName}}</p>`,
        },
        {
          subject: "Session reminder: See you soon!",
          previewText: "Your session is coming up",
          delayDays: 0,
          body: `<p>Hey {{firstName}},</p>
<p>Just a quick reminder that our session is coming up!</p>
<p><strong>Join here:</strong> [Meeting link]</p>
<p>Make sure you're in a quiet space where you can focus.</p>
<p>See you soon!<br/>{{senderName}}</p>`,
        },
        {
          subject: "Follow-up: Action items from our session",
          previewText: "Here's what we covered and your next steps",
          delayDays: 1,
          body: `<p>Hey {{firstName}},</p>
<p>Great session! Here's a summary of what we covered and your action items:</p>
<p><strong>Key insights:</strong></p>
<ul>
<li>[Insight 1]</li>
<li>[Insight 2]</li>
</ul>
<p><strong>Your action items:</strong></p>
<ol>
<li>[Action 1]</li>
<li>[Action 2]</li>
<li>[Action 3]</li>
</ol>
<p>Complete these before our next session. Let me know if you have questions!</p>
<p>{{senderName}}</p>`,
        },
      ]);

    case "lead_nurture":
      return createWorkflow("lead_signup", "When a lead needs nurturing", [
        {
          subject: "Here's something valuable for you",
          previewText: "A quick win to get you started",
          delayDays: 0,
          body: `<p>Hey {{firstName}},</p>
<p>I wanted to share something that I think you'll find really valuable:</p>
<p><strong>[Insert tip, insight, or resource]</strong></p>
<p>This is one of the things that made the biggest difference for me, and I hope it helps you too.</p>
<p>More good stuff coming your way soon!</p>
<p>{{senderName}}</p>`,
        },
        {
          subject: "The #1 mistake people make (and how to avoid it)",
          previewText: "Don't let this trip you up",
          delayDays: 2,
          body: `<p>Hey {{firstName}},</p>
<p>There's one mistake I see people make over and over again:</p>
<p><strong>[Describe the common mistake]</strong></p>
<p>Here's why it's such a problem: [Explain the consequences]</p>
<p><strong>The fix:</strong> [Provide the solution]</p>
<p>Avoid this, and you're already ahead of most people.</p>
<p>{{senderName}}</p>`,
        },
        {
          subject: "How others are getting results",
          previewText: "Real stories from real people",
          delayDays: 4,
          body: `<p>Hey {{firstName}},</p>
<p>I love sharing success stories because they show what's possible.</p>
<p>Here's what one person achieved:</p>
<blockquote>
<p>"[Success story or testimonial]"</p>
</blockquote>
<p>The best part? This is totally achievable for you too.</p>
<p>Here's how they did it: [Brief explanation]</p>
<p>{{senderName}}</p>`,
        },
        {
          subject: "Quick question for you",
          previewText: "I'd love your input",
          delayDays: 7,
          body: `<p>Hey {{firstName}},</p>
<p>I have a quick question for you:</p>
<p><strong>What's the biggest challenge you're facing right now with [topic]?</strong></p>
<p>Just hit reply and let me know. I read every response!</p>
<p>Your answer helps me create better content for you.</p>
<p>{{senderName}}</p>`,
        },
        {
          subject: "Ready to take the next step?",
          previewText: "Here's how I can help",
          delayDays: 10,
          body: `<p>Hey {{firstName}},</p>
<p>Over the past week, I've shared some of my best tips with you.</p>
<p>If you're ready to take things to the next level, I have something that might help:</p>
<p><strong>[Your offer/product/service]</strong></p>
<p>It's perfect for people who want to [desired outcome].</p>
<p><a href="[link]">Learn more here →</a></p>
<p>No pressure - just wanted to let you know it exists!</p>
<p>{{senderName}}</p>`,
        },
      ]);

    case "product_launch":
      return createWorkflow("manual", "When you launch a new product", [
        {
          subject: "Big announcement: Something new is here!",
          previewText: "I've been working on something special",
          delayDays: 0,
          body: `<p>Hey {{firstName}},</p>
<p>I'm so excited to share this with you...</p>
<p>After months of work, <strong>[Product Name]</strong> is finally here!</p>
<p>It's designed to help you [main benefit].</p>
<p><strong>Here's what's included:</strong></p>
<ul>
<li>[Feature/benefit 1]</li>
<li>[Feature/benefit 2]</li>
<li>[Feature/benefit 3]</li>
</ul>
<p><a href="[link]">Check it out here →</a></p>
<p>{{senderName}}</p>`,
        },
        {
          subject: "Why I created this (and who it's for)",
          previewText: "The story behind the product",
          delayDays: 1,
          body: `<p>Hey {{firstName}},</p>
<p>Yesterday I announced [Product Name]. Today I want to share why I created it.</p>
<p>[Share the story - what problem did you see? What inspired you?]</p>
<p><strong>This is perfect for you if:</strong></p>
<ul>
<li>You're struggling with [problem 1]</li>
<li>You want to [desired outcome]</li>
<li>You're ready to [action they need to take]</li>
</ul>
<p><a href="[link]">See if it's right for you →</a></p>
<p>{{senderName}}</p>`,
        },
        {
          subject: "Early bird special ends soon",
          previewText: "Don't miss this",
          delayDays: 2,
          body: `<p>Hey {{firstName}},</p>
<p>Quick reminder: the early bird pricing for [Product Name] ends soon!</p>
<p><strong>What you get:</strong></p>
<ul>
<li>[Benefit 1]</li>
<li>[Benefit 2]</li>
<li>[Bonus if applicable]</li>
</ul>
<p><strong>Early bird price:</strong> [Price] (Regular: [Higher price])</p>
<p><a href="[link]">Get it before the price goes up →</a></p>
<p>{{senderName}}</p>`,
        },
        {
          subject: "Last chance: Don't miss out",
          previewText: "Final reminder",
          delayDays: 3,
          body: `<p>Hey {{firstName}},</p>
<p>This is your last chance to get [Product Name] at the launch price.</p>
<p><strong>After today, the price goes up.</strong></p>
<p>If you've been on the fence, now's the time to decide.</p>
<p>Remember, you get:</p>
<ul>
<li>[Key benefit 1]</li>
<li>[Key benefit 2]</li>
<li>[Guarantee if applicable]</li>
</ul>
<p><a href="[link]">Get it now before it's too late →</a></p>
<p>{{senderName}}</p>`,
        },
      ]);

    case "reengagement":
      return createWorkflow("customer_action", "When a subscriber becomes inactive", [
        {
          subject: "We miss you! Here's what you've missed",
          previewText: "It's been a while...",
          delayDays: 0,
          body: `<p>Hey {{firstName}},</p>
<p>I noticed it's been a while since we connected. I hope everything's okay!</p>
<p>In case you missed it, here's what's been happening:</p>
<ul>
<li>[Recent update 1]</li>
<li>[Recent update 2]</li>
<li>[Recent update 3]</li>
</ul>
<p>Would love to have you back. Is there anything I can help with?</p>
<p>{{senderName}}</p>`,
        },
        {
          subject: "A special offer just for you",
          previewText: "Because we want you back",
          delayDays: 3,
          body: `<p>Hey {{firstName}},</p>
<p>Since we haven't heard from you in a while, I wanted to offer you something special:</p>
<p><strong>[Special offer details - discount, bonus, etc.]</strong></p>
<p>This is my way of saying "we miss you and we'd love to have you back!"</p>
<p><a href="[link]">Claim your offer →</a></p>
<p>{{senderName}}</p>`,
        },
        {
          subject: "Should we part ways?",
          previewText: "It's okay if you want to go",
          delayDays: 7,
          body: `<p>Hey {{firstName}},</p>
<p>I don't want to keep emailing you if you're not interested anymore.</p>
<p>If you want to stay on my list and keep getting emails from me, just click this link:</p>
<p><a href="[stay subscribed link]">Yes, I want to stay! →</a></p>
<p>If I don't hear from you, I'll assume you want to be removed, and that's totally okay.</p>
<p>No hard feelings either way!</p>
<p>{{senderName}}</p>`,
        },
      ]);

    case "winback":
      return createWorkflow("customer_action", "When a subscriber is about to churn", [
        {
          subject: "We want you back - here's 20% off",
          previewText: "A special offer just for you",
          delayDays: 0,
          body: `<p>Hey {{firstName}},</p>
<p>It's been a while, and I wanted to reach out personally.</p>
<p>I'd love to have you back, so here's a special offer:</p>
<p><strong>20% off [product/service] - just for you</strong></p>
<p>Use code: <strong>WELCOMEBACK</strong></p>
<p><a href="[link]">Claim your discount →</a></p>
<p>This offer expires in 7 days.</p>
<p>{{senderName}}</p>`,
        },
        {
          subject: "Last chance to save your spot",
          previewText: "Your discount expires soon",
          delayDays: 3,
          body: `<p>Hey {{firstName}},</p>
<p>Just a reminder: your 20% discount expires in a few days.</p>
<p>If there's something holding you back, just reply and let me know. Maybe I can help!</p>
<p>Otherwise, here's the link to claim your discount:</p>
<p><a href="[link]">Use code WELCOMEBACK →</a></p>
<p>{{senderName}}</p>`,
        },
        {
          subject: "Goodbye (unless you want to stay)",
          previewText: "This is my last email",
          delayDays: 7,
          body: `<p>Hey {{firstName}},</p>
<p>This is my last email to you (unless you tell me otherwise).</p>
<p>I don't want to clutter your inbox if you're not interested.</p>
<p>But if you DO want to stay connected, just click here:</p>
<p><a href="[stay link]">Yes, keep me on the list! →</a></p>
<p>Either way, I wish you all the best!</p>
<p>{{senderName}}</p>`,
        },
      ]);

    case "custom":
    default:
      // Just a trigger node for custom workflows
      return {
        nodes: [
          {
            id: "node_0",
            type: "trigger",
            position: { x: 250, y: baseY },
            data: { triggerType: "lead_signup", description: "When a new lead signs up" },
          },
        ],
        edges: [],
      };
  }
}

export default function WorkflowBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workflowId = searchParams.get("id");
  const sequenceTypeParam = searchParams.get("type") as SequenceType | null;
  const workflowNameParam = searchParams.get("name");
  const { user } = useUser();
  const { toast } = useToast();

  // Initialize workflow name from URL param or default
  const [workflowName, setWorkflowName] = useState(workflowNameParam || "New Workflow");
  // Track the sequence type for this workflow
  const [sequenceType, setSequenceType] = useState<SequenceType | undefined>(
    sequenceTypeParam || undefined
  );
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [addNodeFn, setAddNodeFn] = useState<((type: string) => void) | null>(null);
  const [isAddContactsOpen, setIsAddContactsOpen] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [contactSearchQuery, setContactSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isEnrollingAll, setIsEnrollingAll] = useState(false);

  // AI Email Generation State
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiContextType, setAiContextType] = useState<"course" | "store" | "product" | "custom">("store");
  const [aiEmailType, setAiEmailType] = useState<"welcome" | "nurture" | "pitch" | "follow_up" | "thank_you" | "reminder" | "custom">("nurture");
  const [aiSelectedCourseId, setAiSelectedCourseId] = useState<string>("");
  const [aiSelectedProductId, setAiSelectedProductId] = useState<string>("");
  const [aiCustomPrompt, setAiCustomPrompt] = useState("");
  const [aiTone, setAiTone] = useState<"professional" | "friendly" | "casual" | "urgent" | "educational">("friendly");

  // Debounce the search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(contactSearchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [contactSearchQuery]);
  const [isActive, setIsActive] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [isEmailEditorOpen, setIsEmailEditorOpen] = useState(false);
  const [isTemplateBrowserOpen, setIsTemplateBrowserOpen] = useState(false);
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState<string | null>(null);
  const [isCourseCycleConfigOpen, setIsCourseCycleConfigOpen] = useState(false);

  // AI Workflow Sequence Generator State
  const [isSequenceGeneratorOpen, setIsSequenceGeneratorOpen] = useState(false);
  const [isGeneratingSequence, setIsGeneratingSequence] = useState(false);
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);
  const [sequenceWizardStep, setSequenceWizardStep] = useState(1);
  const [sequenceCampaignType, setSequenceCampaignType] = useState<
    "product_launch" | "course_launch" | "lead_nurture" | "onboarding" | "re_engagement" | "promotion" | "evergreen" | "custom"
  >("product_launch");
  const [sequenceContextType, setSequenceContextType] = useState<"course" | "product" | "store">("store");
  const [sequenceCourseId, setSequenceCourseId] = useState<string>("");
  const [sequenceProductId, setSequenceProductId] = useState<string>("");
  const [sequenceCustomPrompt, setSequenceCustomPrompt] = useState("");
  const [sequenceLength, setSequenceLength] = useState(5);
  const [sequenceTone, setSequenceTone] = useState<"professional" | "friendly" | "casual" | "urgent" | "educational">("friendly");

  // A/B Testing State
  const [abTestEnabled, setAbTestEnabled] = useState(false);
  const [abVariants, setAbVariants] = useState<Array<{
    id: string;
    name: string;
    subject: string;
    body?: string;
    percentage: number;
  }>>([]);
  const [abSampleSize, setAbSampleSize] = useState(100);
  const [abWinnerMetric, setAbWinnerMetric] = useState<"open_rate" | "click_rate">("open_rate");
  const [abAutoSelectWinner, setAbAutoSelectWinner] = useState(true);
  const [abWinnerThreshold, setAbWinnerThreshold] = useState(5);

  // Get user's store
  const store = useQuery(
    // @ts-ignore - Convex type instantiation is excessively deep
    api.stores.getUserStore,
    user?.id ? { userId: user.id } : "skip"
  ) as { _id: Id<"stores">; plan?: string } | null | undefined;
  // Use Clerk user ID for storeId since that's what emailContacts uses
  const storeId = user?.id || "";

  // Check if user has access to automations feature
  const {
    hasAccess,
    isLoading: featureLoading,
    UpgradePromptComponent,
  } = useFeatureAccess(store?._id, "automations");

  const emailTemplates = useQuery(
    api.emailWorkflows.listEmailTemplates,
    storeId ? { storeId } : "skip"
  );

  const existingWorkflow = useQuery(
    api.emailWorkflows.getWorkflow,
    workflowId ? { workflowId: workflowId as Id<"emailWorkflows"> } : "skip"
  );

  // List all workflows for this store (for workflow chaining)
  const allWorkflows = useQuery(
    api.emailWorkflows.listWorkflows,
    storeId ? { storeId } : "skip"
  );

  // Search contacts with server-side filtering for the "Add Contacts" dialog
  const contacts = useQuery(
    api.emailContacts.searchContacts,
    storeId ? { storeId, search: debouncedSearchQuery || undefined, limit: 100 } : "skip"
  );

  const tags = useQuery(api.emailTags.listTags, storeId ? { storeId } : "skip");

  // Queries for AI email generation
  const userCourses = useQuery(api.courses.getCoursesByUser, user?.id ? { userId: user.id } : "skip");
  const userProducts = useQuery(api.digitalProducts.getProductsByStore, storeId ? { storeId } : "skip");

  // Get contact stats for total count
  const contactStats = useQuery(
    api.emailContacts.getContactStats,
    storeId ? { storeId } : "skip"
  );

  // Get segments for segment-based triggers
  const segments = useQuery(
    api.emailCreatorSegments.getCreatorSegments,
    storeId ? { storeId } : "skip"
  );

  // Get products and courses for trigger configuration
  const products = useQuery(
    api.digitalProducts.getProductsByStore,
    store?._id ? { storeId: store._id } : "skip"
  );
  const courses = useQuery(
    api.courses.getCoursesByStore,
    store?._id ? { storeId: store._id } : "skip"
  );

  const nodeExecutionCounts = useQuery(
    api.emailWorkflows.getNodeExecutionCounts,
    workflowId ? { workflowId: workflowId as Id<"emailWorkflows"> } : "skip"
  );

  const createWorkflow = useMutation(api.emailWorkflows.createWorkflow);
  const updateWorkflow = useMutation(api.emailWorkflows.updateWorkflow);
  const deleteWorkflow = useMutation(api.emailWorkflows.deleteWorkflow);
  const bulkEnrollContacts = useMutation(api.emailWorkflows.bulkEnrollContactsInWorkflow);
  const bulkEnrollAll = useAction(api.emailWorkflows.bulkEnrollAllContactsByFilter);
  const generateAIEmail = useAction(api.aiEmailGenerator.generateWorkflowEmail);
  const generateWorkflowSequence = useAction(api.aiEmailGenerator.generateWorkflowSequence);
  const preCreateWorkflowTags = useMutation(api.emailWorkflows.preCreateWorkflowTags);
  const toggleActive = useMutation(api.emailWorkflows.toggleWorkflowActive);
  const createEmailTemplate = useMutation(api.emailWorkflows.createEmailTemplate);
  const saveABTest = useMutation(api.emailWorkflowABTesting.saveNodeABTest);
  const selectABWinner = useMutation(api.emailWorkflowABTesting.selectWinner);
  const resetABTest = useMutation(api.emailWorkflowABTesting.resetTestStats);

  // Query A/B test for selected email node
  const abTestData = useQuery(
    api.emailWorkflowABTesting.getVariantStats,
    workflowId && selectedNode?.type === "email"
      ? {
          workflowId: workflowId as Id<"emailWorkflows">,
          nodeId: selectedNode.id,
        }
      : "skip"
  );

  useEffect(() => {
    if (existingWorkflow) {
      setWorkflowName(existingWorkflow.name || "New Workflow");
      setIsActive(existingWorkflow.isActive || false);
      // Set sequence type from existing workflow
      if (existingWorkflow.sequenceType) {
        setSequenceType(existingWorkflow.sequenceType as SequenceType);
      }
      if (existingWorkflow.nodes) {
        setNodes(existingWorkflow.nodes);
      }
      if (existingWorkflow.edges) {
        setEdges(existingWorkflow.edges);
      }
    }
  }, [existingWorkflow]);

  // Initialize workflow with template nodes based on sequence type
  const [hasInitialized, setHasInitialized] = useState(false);
  useEffect(() => {
    // Only initialize once for new workflows (no workflowId)
    if (!workflowId && !hasInitialized) {
      const { nodes: templateNodes, edges: templateEdges } = getSequenceTemplate(sequenceType);
      setNodes(templateNodes);
      setEdges(templateEdges);
      setHasInitialized(true);
    }
  }, [workflowId, hasInitialized, sequenceType]);

  const handleNodesChange = useCallback((newNodes: Node[]) => {
    setNodes(newNodes);
  }, []);

  const handleEdgesChange = useCallback((newEdges: Edge[]) => {
    setEdges(newEdges);
  }, []);

  const handleNodeSelect = useCallback((node: Node | null) => {
    setSelectedNode(node);
  }, []);

  const updateNodeData = useCallback(
    (nodeId: string, data: Record<string, unknown>) => {
      setNodes((nds) =>
        nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n))
      );
      if (selectedNode?.id === nodeId) {
        setSelectedNode((prev) => (prev ? { ...prev, data: { ...prev.data, ...data } } : null));
      }
    },
    [selectedNode]
  );

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setSelectedNode(null);
  }, []);

  const handleSave = async () => {
    if (!storeId || !user?.id) {
      toast({
        title: "Error",
        description: "Please sign in to save workflows",
        variant: "destructive",
      });
      return;
    }

    const triggerNode = nodes.find((n) => n.type === "trigger");
    if (!triggerNode) {
      toast({
        title: "Error",
        description: "Workflow must have a trigger node",
        variant: "destructive",
      });
      return;
    }

    const errors = validateWorkflow(nodes, edges);
    if (errors.length > 0) {
      setValidationErrors(errors);
      toast({
        title: "Validation Error",
        description: `${errors.length} issue(s) found. Please fix them before saving.`,
        variant: "destructive",
      });
      return;
    }

    setValidationErrors([]);
    setIsSaving(true);
    try {
      const nodesData = nodes.map((n) => ({
        id: n.id,
        type: n.type as "trigger" | "email" | "delay" | "condition" | "action",
        position: n.position,
        data: n.data,
      }));

      const edgesData = edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle || undefined,
        targetHandle: e.targetHandle || undefined,
      }));

      const triggerData = {
        type: (triggerNode.data.triggerType || "lead_signup") as TriggerType,
        config: triggerNode.data,
      };

      if (workflowId) {
        // Update existing workflow - don't pass storeId/userId
        await updateWorkflow({
          workflowId: workflowId as Id<"emailWorkflows">,
          name: workflowName,
          trigger: triggerData,
          nodes: nodesData,
          edges: edgesData,
          sequenceType: sequenceType,
        });
        toast({ title: "Saved", description: "Workflow updated successfully" });
      } else {
        // Create new workflow - include storeId/userId and sequenceType
        const newId = await createWorkflow({
          name: workflowName,
          storeId,
          userId: user.id,
          trigger: triggerData,
          nodes: nodesData,
          edges: edgesData,
          sequenceType: sequenceType,
        });
        toast({ title: "Saved", description: "Workflow created successfully" });
        router.push(`/dashboard/emails/workflows?mode=create&id=${newId}`);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to save workflow", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!workflowId) return;
    try {
      await deleteWorkflow({ workflowId: workflowId as Id<"emailWorkflows"> });
      toast({ title: "Deleted", description: "Workflow deleted" });
      router.push("/dashboard/emails?mode=create");
    } catch {
      toast({ title: "Error", description: "Failed to delete workflow", variant: "destructive" });
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!selectedNode || !storeId) return;
    if (!templateName.trim()) {
      toast({ title: "Error", description: "Template name is required", variant: "destructive" });
      return;
    }
    if (!selectedNode.data.subject) {
      toast({ title: "Error", description: "Email subject is required", variant: "destructive" });
      return;
    }

    setIsSavingTemplate(true);
    try {
      await createEmailTemplate({
        storeId,
        name: templateName.trim(),
        subject: selectedNode.data.subject,
        content: selectedNode.data.body || "",
        category: "workflow",
      });
      toast({ title: "Template Saved", description: "Email saved as template for reuse" });
      setTemplateName("");
    } catch {
      toast({ title: "Error", description: "Failed to save template", variant: "destructive" });
    } finally {
      setIsSavingTemplate(false);
    }
  };

  // AI Email Generation Handler
  const handleGenerateAIEmail = async () => {
    if (!selectedNode || !storeId) return;

    setIsGeneratingAI(true);
    try {
      const result = await generateAIEmail({
        storeId,
        emailType: aiEmailType,
        contextType: aiContextType,
        courseId: aiContextType === "course" && aiSelectedCourseId ? aiSelectedCourseId as Id<"courses"> : undefined,
        productId: aiContextType === "product" && aiSelectedProductId ? aiSelectedProductId as Id<"digitalProducts"> : undefined,
        customPrompt: aiCustomPrompt || undefined,
        tone: aiTone,
      });

      // Update the email node with generated content
      updateNodeData(selectedNode.id, {
        subject: result.subject,
        previewText: result.previewText,
        body: result.body,
        mode: "custom",
      });

      toast({
        title: "Email Generated!",
        description: "AI has created your email content. Review and customize as needed.",
      });
    } catch (error) {
      console.error("AI generation error:", error);
      toast({
        title: "Generation Failed",
        description: "Could not generate email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // AI Workflow Sequence Generation Handler
  const handleGenerateSequence = async (skipConfirm = false) => {
    if (!storeId) return;

    // Show custom confirmation dialog if overwriting existing work
    if (nodes.length > 1 && !skipConfirm) {
      setShowOverwriteConfirm(true);
      return;
    }

    setIsGeneratingSequence(true);
    try {
      const result = await generateWorkflowSequence({
        storeId,
        campaignType: sequenceCampaignType,
        contextType: sequenceContextType,
        courseId: sequenceContextType === "course" && sequenceCourseId ? sequenceCourseId as Id<"courses"> : undefined,
        productId: sequenceContextType === "product" && sequenceProductId ? sequenceProductId as Id<"digitalProducts"> : undefined,
        customPrompt: sequenceCustomPrompt || undefined,
        sequenceLength,
        tone: sequenceTone,
      });

      // Set the workflow name
      setWorkflowName(result.workflowName);

      // Pre-create tags from the generated workflow and get tagName -> tagId mapping
      // This ensures tags exist before we try to resolve them
      const tagMap = await preCreateWorkflowTags({
        storeId,
        nodes: result.nodes,
      });

      // Create a lookup map for quick resolution
      const tagNameToId = new Map(tagMap.map((t) => [t.name, t.tagId]));

      // Resolve tagName to tagId for action nodes using the freshly created/fetched tags
      const resolvedNodes = (result.nodes as Node[]).map((node) => {
        if (node.type === "action" && node.data?.tagName && !node.data?.tagId) {
          const tagId = tagNameToId.get(node.data.tagName);
          if (tagId) {
            return {
              ...node,
              data: {
                ...node.data,
                tagId,
              },
            };
          }
        }
        return node;
      });

      // Load the generated nodes and edges
      setNodes(resolvedNodes);
      setEdges(result.edges as Edge[]);

      toast({
        title: "Workflow Generated!",
        description: `Created ${result.nodes.length} nodes with ${result.edges.length} connections. Review and customize as needed.`,
      });

      setIsSequenceGeneratorOpen(false);

      // Only reset custom prompt - preserve course/product selection for potential regeneration
      setSequenceCustomPrompt("");
    } catch (error) {
      console.error("Sequence generation error:", error);
      toast({
        title: "Generation Failed",
        description: "Could not generate workflow sequence. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSequence(false);
    }
  };

  // Contacts are now filtered server-side via the search query
  const filteredContacts = contacts || [];

  const toggleContactSelection = useCallback((contactId: string) => {
    setSelectedContacts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(contactId)) {
        newSet.delete(contactId);
      } else {
        newSet.add(contactId);
      }
      return newSet;
    });
  }, []);

  const toggleAllContacts = useCallback(() => {
    if (selectedContacts.size === filteredContacts.length && filteredContacts.length > 0) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(filteredContacts.map((c: any) => c._id)));
    }
  }, [filteredContacts, selectedContacts.size]);

  const handleBulkEnroll = async () => {
    if (!workflowId || selectedContacts.size === 0) return;
    setIsEnrolling(true);
    try {
      const result = await bulkEnrollContacts({
        workflowId: workflowId as Id<"emailWorkflows">,
        contactIds: Array.from(selectedContacts) as any[],
      });
      toast({
        title: "Contacts Enrolled",
        description: `Enrolled ${result.enrolled} contact${result.enrolled !== 1 ? "s" : ""}, skipped ${result.skipped} (already enrolled)`,
      });
      setSelectedContacts(new Set());
      setIsAddContactsOpen(false);
    } catch {
      toast({ title: "Error", description: "Failed to enroll contacts", variant: "destructive" });
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleEnrollAllContacts = async () => {
    if (!workflowId || !storeId) return;
    setIsEnrollingAll(true);
    try {
      const result = await bulkEnrollAll({
        workflowId: workflowId as Id<"emailWorkflows">,
        storeId,
      });
      toast({
        title: "All Contacts Enrolled",
        description: result.message,
      });
      setIsAddContactsOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to enroll all contacts",
        variant: "destructive",
      });
    } finally {
      setIsEnrollingAll(false);
    }
  };

  // Show loading state while checking feature access
  if (featureLoading || store === undefined) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show upgrade prompt if user doesn't have access to automations
  if (!hasAccess) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-8">
        <div className="max-w-md space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold">Email Automations</h1>
          <p className="text-muted-foreground">
            Email automation workflows are a Creator Pro feature. Upgrade your plan to create
            automated email sequences that nurture your leads and customers.
          </p>
          <div className="space-y-3">
            <Button
              className="w-full"
              onClick={() => router.push("/dashboard/settings?tab=billing")}
            >
              Upgrade to Creator Pro
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/dashboard/emails")}
            >
              Back to Emails
            </Button>
          </div>
        </div>
        <UpgradePromptComponent />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-2 py-2 dark:border-zinc-800 dark:bg-zinc-950 md:px-4 md:py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => router.push("/dashboard/emails?mode=create")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Input
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="min-w-0 flex-1 border-none bg-transparent text-base font-semibold focus-visible:ring-0 md:max-w-64 md:text-lg"
          />
        </div>
        <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
          {validationErrors.length > 0 && (
            <div className="flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-1 text-xs text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 md:gap-1.5 md:px-2.5 md:text-sm">
              <AlertTriangle className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden sm:inline">
                {validationErrors.length} issue{validationErrors.length > 1 ? "s" : ""}
              </span>
              <span className="sm:hidden">{validationErrors.length}</span>
            </div>
          )}
          {/* AI Sequence Generator Button - show when creating new workflow */}
          {!workflowId && (
            <Button
              variant="outline"
              onClick={() => setIsSequenceGeneratorOpen(true)}
              className="h-8 gap-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 md:h-9 md:px-3"
            >
              <Wand2 className="h-4 w-4 text-purple-600" />
              <span className="hidden md:inline">AI Generate</span>
            </Button>
          )}
          {workflowId && (
            <>
              <Button
                variant="outline"
                onClick={() => setIsSequenceGeneratorOpen(true)}
                className="h-8 w-8 bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 md:h-9 md:w-auto md:gap-2 md:px-3"
                title="Generate new sequence with AI"
              >
                <Wand2 className="h-4 w-4 text-purple-600" />
                <span className="hidden md:inline">AI Generate</span>
              </Button>
              <div className="flex items-center gap-2 rounded-md border px-2 py-1 md:px-3 md:py-1.5">
                <Power
                  className={`h-3.5 w-3.5 md:h-4 md:w-4 ${isActive ? "text-green-600" : "text-muted-foreground"}`}
                />
                <span className="hidden text-sm md:inline">{isActive ? "Active" : "Inactive"}</span>
                <Switch
                  checked={isActive}
                  onCheckedChange={async (checked) => {
                    setIsActive(checked);
                    await toggleActive({
                      workflowId: workflowId as Id<"emailWorkflows">,
                      isActive: checked,
                    });
                    toast({
                      title: checked ? "Workflow Activated" : "Workflow Deactivated",
                      description: checked
                        ? "Enrolled contacts will now receive emails"
                        : "Email sending paused",
                    });
                  }}
                  className="scale-75 md:scale-90"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsAddContactsOpen(true)}
                className="h-8 w-8 md:h-9 md:w-auto md:gap-2 md:px-3"
              >
                <UserPlus className="h-4 w-4" />
                <span className="hidden md:inline">Add Contacts</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleDelete}
                className="h-8 w-8 text-red-600 md:h-9 md:w-auto md:gap-2 md:px-3"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden md:inline">Delete</span>
              </Button>
            </>
          )}
          <Button
            size="icon"
            onClick={handleSave}
            disabled={isSaving}
            className="h-8 w-8 md:h-9 md:w-auto md:gap-2 md:px-3"
          >
            <Save className="h-4 w-4" />
            <span className="hidden md:inline">{isSaving ? "Saving..." : "Save"}</span>
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
        <NodeSidebar onAddNode={addNodeFn || undefined} />

        <div className="min-h-0 flex-1">
          <WorkflowCanvas
            initialNodes={nodes}
            initialEdges={edges}
            nodeExecutionCounts={nodeExecutionCounts || {}}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onNodeSelect={handleNodeSelect}
            onAddNodeRef={(fn) => setAddNodeFn(() => fn)}
          />
        </div>

        <Dialog open={!!selectedNode} onOpenChange={(open) => !open && setSelectedNode(null)}>
          <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto bg-white dark:bg-black">
            <DialogHeader>
              <DialogTitle className="capitalize">{selectedNode?.type} Settings</DialogTitle>
              <DialogDescription>Configure this node</DialogDescription>
            </DialogHeader>

            {selectedNode && (
              <div className="mt-6 space-y-4">
                {selectedNode.type === "trigger" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Trigger Type</Label>
                      <Select
                        value={selectedNode.data.triggerType || "lead_signup"}
                        onValueChange={(v) =>
                          updateNodeData(selectedNode.id, {
                            triggerType: v,
                            // Reset product/course/tag/segment selection when changing trigger type
                            productId: undefined,
                            courseId: undefined,
                            tagId: undefined,
                            segmentId: undefined,
                            segmentName: undefined,
                            segmentMemberCount: undefined,
                          })
                        }
                      >
                        <SelectTrigger className="bg-white dark:bg-black">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-black">
                          {triggerOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Product Purchased - show product/course selector */}
                    {selectedNode.data.triggerType === "product_purchase" && (
                      <div className="space-y-2">
                        <Label>Which Product/Course?</Label>
                        <Select
                          value={
                            selectedNode.data.productId
                              ? `product:${selectedNode.data.productId}`
                              : selectedNode.data.courseId
                                ? `course:${selectedNode.data.courseId}`
                                : "any"
                          }
                          onValueChange={(v) => {
                            if (v === "any") {
                              updateNodeData(selectedNode.id, {
                                productId: undefined,
                                productName: undefined,
                                courseId: undefined,
                                courseName: undefined,
                              });
                            } else if (v.startsWith("product:")) {
                              const productId = v.replace("product:", "");
                              const product = products?.find((p: any) => p._id === productId);
                              updateNodeData(selectedNode.id, {
                                productId,
                                productName: product?.title,
                                courseId: undefined,
                                courseName: undefined,
                              });
                            } else if (v.startsWith("course:")) {
                              const courseId = v.replace("course:", "");
                              const course = courses?.find((c: any) => c._id === courseId);
                              updateNodeData(selectedNode.id, {
                                courseId,
                                courseName: course?.title,
                                productId: undefined,
                                productName: undefined,
                              });
                            }
                          }}
                        >
                          <SelectTrigger className="bg-white dark:bg-black">
                            <SelectValue placeholder="Select product or course..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px] bg-white dark:bg-black">
                            <SelectItem value="any">Any product or course</SelectItem>
                            {courses && courses.length > 0 && (
                              <>
                                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                  Courses
                                </div>
                                {courses.map((course: any) => (
                                  <SelectItem key={course._id} value={`course:${course._id}`}>
                                    {course.title}
                                  </SelectItem>
                                ))}
                              </>
                            )}
                            {products && products.length > 0 && (
                              <>
                                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                  Digital Products
                                </div>
                                {products.map((product: any) => (
                                  <SelectItem key={product._id} value={`product:${product._id}`}>
                                    {product.title}
                                  </SelectItem>
                                ))}
                              </>
                            )}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Choose a specific product/course or trigger on any purchase
                        </p>
                      </div>
                    )}

                    {/* Tag Added - show tag selector */}
                    {selectedNode.data.triggerType === "tag_added" && (
                      <div className="space-y-2">
                        <Label>Which Tag?</Label>
                        <Select
                          value={selectedNode.data.tagId || "any"}
                          onValueChange={(v) => {
                            if (v === "any") {
                              updateNodeData(selectedNode.id, {
                                tagId: undefined,
                                tagName: undefined,
                              });
                            } else {
                              const tag = tags?.find((t: any) => t._id === v);
                              updateNodeData(selectedNode.id, {
                                tagId: v,
                                tagName: tag?.name,
                              });
                            }
                          }}
                        >
                          <SelectTrigger className="bg-white dark:bg-black">
                            <SelectValue placeholder="Select a tag..." />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-black">
                            <SelectItem value="any">Any tag</SelectItem>
                            {tags?.map((tag: { _id: string; name: string; color?: string }) => (
                              <SelectItem key={tag._id} value={tag._id}>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: tag.color || "#6b7280" }}
                                  />
                                  {tag.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Trigger when this tag is added to a contact
                        </p>
                      </div>
                    )}

                    {/* Segment Member - show segment selector */}
                    {selectedNode.data.triggerType === "segment_member" && (
                      <div className="space-y-2">
                        <Label>Which Segment?</Label>
                        <Select
                          value={selectedNode.data.segmentId || ""}
                          onValueChange={(v) => {
                            const segment = segments?.find((s: any) => s._id === v);
                            updateNodeData(selectedNode.id, {
                              segmentId: v,
                              segmentName: segment?.name,
                              segmentMemberCount: segment?.memberCount,
                            });
                          }}
                        >
                          <SelectTrigger className="bg-white dark:bg-black">
                            <SelectValue placeholder="Select a segment..." />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-black">
                            {segments && segments.length > 0 ? (
                              segments.map((segment) => (
                                <SelectItem key={segment._id} value={segment._id}>
                                  <div className="flex items-center gap-2">
                                    <Filter className="h-3 w-3 text-purple-500" />
                                    <span>{segment.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      ({segment.memberCount} contacts)
                                    </span>
                                  </div>
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="" disabled>
                                No segments available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Trigger for all contacts in this segment
                        </p>
                        {selectedNode.data.segmentId && selectedNode.data.segmentMemberCount && (
                          <p className="text-xs text-purple-600 dark:text-purple-400">
                            {selectedNode.data.segmentMemberCount} contacts will be enrolled
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {selectedNode.type === "email" && (
                  <>
                    {/* Email Preview */}
                    <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                      {selectedNode.data.subject ? (
                        <>
                          <p className="text-xs text-zinc-500">Subject:</p>
                          <p className="text-sm font-medium">{selectedNode.data.subject}</p>
                          {selectedNode.data.templateName && (
                            <p className="mt-1 text-xs text-zinc-500">
                              Template: {selectedNode.data.templateName}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-zinc-500">No email configured</p>
                      )}
                    </div>

                    <Button className="w-full" onClick={() => setIsEmailEditorOpen(true)}>
                      {selectedNode.data.subject ? "Edit Email" : "Configure Email"}
                    </Button>

                    {validationErrors.some((e) => e.nodeId === selectedNode.id) && (
                      <div className="rounded-md border border-red-200 bg-red-50 p-2 dark:border-red-900 dark:bg-red-900/20">
                        {validationErrors
                          .filter((e) => e.nodeId === selectedNode.id)
                          .map((e, i) => (
                            <p key={i} className="text-sm text-red-600 dark:text-red-400">
                              {e.message}
                            </p>
                          ))}
                      </div>
                    )}
                  </>
                )}

                {selectedNode.type === "delay" && (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <div className="flex-1 space-y-2">
                        <Label>Duration</Label>
                        <Input
                          type="number"
                          min="1"
                          value={selectedNode.data.delayValue || 1}
                          onChange={(e) =>
                            updateNodeData(selectedNode.id, {
                              delayValue: parseInt(e.target.value) || 1,
                            })
                          }
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <Label>Unit</Label>
                        <Select
                          value={selectedNode.data.delayUnit || "hours"}
                          onValueChange={(v) => updateNodeData(selectedNode.id, { delayUnit: v })}
                        >
                          <SelectTrigger className="bg-white dark:bg-black">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-black">
                            {delayUnits.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Contacts waiting at this delay */}
                    {selectedNode.data.waitingCount > 0 && (
                      <div className="rounded-md border bg-orange-50 p-3 dark:bg-orange-900/20">
                        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-orange-700 dark:text-orange-300">
                          <Users className="h-4 w-4" />
                          {selectedNode.data.waitingCount} contact
                          {selectedNode.data.waitingCount !== 1 ? "s" : ""} waiting
                        </div>
                        <ContactsAtNodeList
                          workflowId={workflowId as Id<"emailWorkflows">}
                          nodeId={selectedNode.id}
                        />
                      </div>
                    )}
                  </div>
                )}

                {selectedNode.type === "condition" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Condition Type</Label>
                      <Select
                        value={selectedNode.data.conditionType || "opened_email"}
                        onValueChange={(v) => updateNodeData(selectedNode.id, { conditionType: v })}
                      >
                        <SelectTrigger className="bg-white dark:bg-black">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-black">
                          {conditionOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Has Tag - show tag selector */}
                    {selectedNode.data.conditionType === "has_tag" && (
                      <div className="space-y-2">
                        <Label>Select Tag</Label>
                        <Select
                          value={selectedNode.data.tagId || ""}
                          onValueChange={(v) => updateNodeData(selectedNode.id, { tagId: v })}
                        >
                          <SelectTrigger className="bg-white dark:bg-black">
                            <SelectValue placeholder="Choose a tag..." />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-black">
                            {tags?.map((tag: { _id: string; name: string; color?: string }) => (
                              <SelectItem key={tag._id} value={tag._id}>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: tag.color || "#6b7280" }}
                                  />
                                  {tag.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Has Purchased Product - show product/course selector */}
                    {selectedNode.data.conditionType === "has_purchased_product" && (
                      <div className="space-y-2">
                        <Label>Which Product/Course?</Label>
                        <Select
                          value={
                            selectedNode.data.productId
                              ? `product:${selectedNode.data.productId}`
                              : selectedNode.data.courseId
                                ? `course:${selectedNode.data.courseId}`
                                : "any"
                          }
                          onValueChange={(v) => {
                            if (v === "any") {
                              updateNodeData(selectedNode.id, {
                                productId: undefined,
                                courseId: undefined,
                              });
                            } else if (v.startsWith("product:")) {
                              updateNodeData(selectedNode.id, {
                                productId: v.replace("product:", ""),
                                courseId: undefined,
                              });
                            } else if (v.startsWith("course:")) {
                              updateNodeData(selectedNode.id, {
                                courseId: v.replace("course:", ""),
                                productId: undefined,
                              });
                            }
                          }}
                        >
                          <SelectTrigger className="bg-white dark:bg-black">
                            <SelectValue placeholder="Select product or course..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px] bg-white dark:bg-black">
                            <SelectItem value="any">Any product or course</SelectItem>
                            {courses && courses.length > 0 && (
                              <>
                                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                  Courses
                                </div>
                                {courses.map((course: any) => (
                                  <SelectItem key={course._id} value={`course:${course._id}`}>
                                    {course.title}
                                  </SelectItem>
                                ))}
                              </>
                            )}
                            {products && products.length > 0 && (
                              <>
                                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                  Digital Products
                                </div>
                                {products.map((product: any) => (
                                  <SelectItem key={product._id} value={`product:${product._id}`}>
                                    {product.title}
                                  </SelectItem>
                                ))}
                              </>
                            )}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Check if the contact has purchased a specific product/course
                        </p>
                      </div>
                    )}

                    {/* Opened Email - show email selector */}
                    {selectedNode.data.conditionType === "opened_email" && (
                      <div className="space-y-2">
                        <Label>Which Email</Label>
                        <Select
                          value={selectedNode.data.emailNodeId || "any"}
                          onValueChange={(v) => updateNodeData(selectedNode.id, { emailNodeId: v })}
                        >
                          <SelectTrigger className="bg-white dark:bg-black">
                            <SelectValue placeholder="Select email..." />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-black">
                            <SelectItem value="any">Any previous email</SelectItem>
                            {nodes
                              .filter((n) => n.type === "email")
                              .map((emailNode) => (
                                <SelectItem key={emailNode.id} value={emailNode.id}>
                                  {emailNode.data?.subject || `Email (${emailNode.id})`}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Clicked Link - show link input */}
                    {selectedNode.data.conditionType === "clicked_link" && (
                      <div className="space-y-2">
                        <Label>Link URL (optional)</Label>
                        <Input
                          value={selectedNode.data.linkUrl || ""}
                          onChange={(e) =>
                            updateNodeData(selectedNode.id, { linkUrl: e.target.value })
                          }
                          placeholder="Leave empty for any link"
                        />
                        <p className="text-xs text-muted-foreground">
                          Leave empty to match any clicked link, or enter a specific URL to match.
                        </p>
                      </div>
                    )}

                    {/* Time Based - show time options */}
                    {selectedNode.data.conditionType === "time_based" && (
                      <div className="space-y-2">
                        <Label>Time Condition</Label>
                        <Select
                          value={selectedNode.data.timeCondition || "after_hours"}
                          onValueChange={(v) =>
                            updateNodeData(selectedNode.id, { timeCondition: v })
                          }
                        >
                          <SelectTrigger className="bg-white dark:bg-black">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-black">
                            <SelectItem value="after_hours">
                              After X hours since enrollment
                            </SelectItem>
                            <SelectItem value="after_days">
                              After X days since enrollment
                            </SelectItem>
                            <SelectItem value="day_of_week">On specific day of week</SelectItem>
                          </SelectContent>
                        </Select>
                        {(selectedNode.data.timeCondition === "after_hours" ||
                          selectedNode.data.timeCondition === "after_days") && (
                          <Input
                            type="number"
                            min="1"
                            value={selectedNode.data.timeValue || 24}
                            onChange={(e) =>
                              updateNodeData(selectedNode.id, {
                                timeValue: parseInt(e.target.value) || 1,
                              })
                            }
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}

                {selectedNode.type === "action" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Action Type</Label>
                      <Select
                        value={selectedNode.data.actionType || "add_tag"}
                        onValueChange={(v) => updateNodeData(selectedNode.id, { actionType: v })}
                      >
                        <SelectTrigger className="bg-white dark:bg-black">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-black">
                          {actionOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Tag selector for add_tag and remove_tag */}
                    {(selectedNode.data.actionType === "add_tag" ||
                      selectedNode.data.actionType === "remove_tag") && (
                      <div className="space-y-2">
                        <Label>Select Tag</Label>
                        <Select
                          value={
                            // Resolve tagId from tagName if tagId is not set
                            selectedNode.data.tagId ||
                            (selectedNode.data.tagName
                              ? tags?.find((t: { name: string }) => t.name === selectedNode.data.tagName)?._id
                              : "") ||
                            ""
                          }
                          onValueChange={(v) => {
                            // When selecting, also clear tagName to avoid confusion
                            updateNodeData(selectedNode.id, { tagId: v, tagName: undefined });
                          }}
                        >
                          <SelectTrigger className="bg-white dark:bg-black">
                            <SelectValue placeholder={selectedNode.data.tagName || "Choose a tag..."} />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-black">
                            {tags?.map((tag: { _id: string; name: string; color?: string }) => (
                              <SelectItem key={tag._id} value={tag._id}>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: tag.color || "#6b7280" }}
                                  />
                                  {tag.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Text input for other action types */}
                    {selectedNode.data.actionType !== "add_tag" &&
                      selectedNode.data.actionType !== "remove_tag" && (
                        <div className="space-y-2">
                          <Label>Value</Label>
                          <Input
                            value={selectedNode.data.value || ""}
                            onChange={(e) =>
                              updateNodeData(selectedNode.id, { value: e.target.value })
                            }
                            placeholder="List name, field value, etc."
                          />
                        </div>
                      )}
                  </div>
                )}

                {selectedNode.type === "webhook" && (
                  <div className="space-y-2">
                    <Label>Webhook URL</Label>
                    <Input
                      value={selectedNode.data.webhookUrl || ""}
                      onChange={(e) =>
                        updateNodeData(selectedNode.id, { webhookUrl: e.target.value })
                      }
                      placeholder="https://hooks.zapier.com/..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Sends contact data to this URL via POST request
                    </p>
                  </div>
                )}

                {selectedNode.type === "split" && (
                  <div className="space-y-2">
                    <Label>Split Percentage (Path A)</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        type="number"
                        min="1"
                        max="99"
                        value={selectedNode.data.splitPercentage || 50}
                        onChange={(e) =>
                          updateNodeData(selectedNode.id, {
                            splitPercentage: Math.min(
                              99,
                              Math.max(1, parseInt(e.target.value) || 50)
                            ),
                          })
                        }
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">
                        Path A: {selectedNode.data.splitPercentage || 50}% / Path B:{" "}
                        {100 - (selectedNode.data.splitPercentage || 50)}%
                      </span>
                    </div>
                  </div>
                )}

                {selectedNode.type === "notify" && (
                  <>
                    <div className="space-y-2">
                      <Label>Notification Method</Label>
                      <Select
                        value={selectedNode.data.notifyMethod || "email"}
                        onValueChange={(v) => updateNodeData(selectedNode.id, { notifyMethod: v })}
                      >
                        <SelectTrigger className="bg-white dark:bg-black">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-black">
                          <SelectItem value="email">Email Store Owner</SelectItem>
                          <SelectItem value="slack">Slack</SelectItem>
                          <SelectItem value="discord">Discord</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Message</Label>
                      <Input
                        value={selectedNode.data.message || ""}
                        onChange={(e) =>
                          updateNodeData(selectedNode.id, { message: e.target.value })
                        }
                        placeholder="New lead reached this step!"
                      />
                    </div>
                  </>
                )}

                {selectedNode.type === "goal" && (
                  <div className="space-y-2">
                    <Label>Goal Type</Label>
                    <Select
                      value={selectedNode.data.goalType || "purchase"}
                      onValueChange={(v) => updateNodeData(selectedNode.id, { goalType: v })}
                    >
                      <SelectTrigger className="bg-white dark:bg-black">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-black">
                        <SelectItem value="purchase">Made Purchase</SelectItem>
                        <SelectItem value="clicked">Clicked Link</SelectItem>
                        <SelectItem value="opened">Opened Email</SelectItem>
                        <SelectItem value="replied">Replied to Email</SelectItem>
                        <SelectItem value="custom">Custom Goal</SelectItem>
                      </SelectContent>
                    </Select>
                    {selectedNode.data.goalType === "custom" && (
                      <Input
                        value={selectedNode.data.customGoal || ""}
                        onChange={(e) =>
                          updateNodeData(selectedNode.id, { customGoal: e.target.value })
                        }
                        placeholder="Describe your goal..."
                        className="mt-2"
                      />
                    )}
                    <p className="text-xs text-muted-foreground">
                      Goal nodes mark this path complete when reached
                    </p>

                    {/* Next Workflow - Workflow Chaining */}
                    <div className="mt-4 border-t pt-4">
                      <Label>After Goal is Reached</Label>
                      <Select
                        value={selectedNode.data.nextWorkflowId || "none"}
                        onValueChange={(v) =>
                          updateNodeData(selectedNode.id, {
                            nextWorkflowId: v === "none" ? undefined : v,
                          })
                        }
                      >
                        <SelectTrigger className="mt-2 bg-white dark:bg-black">
                          <SelectValue placeholder="Select next workflow..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px] bg-white dark:bg-black">
                          <SelectItem value="none">End sequence (no next workflow)</SelectItem>
                          {allWorkflows
                            ?.filter((w: any) => w._id !== workflowId) // Exclude current workflow
                            .map((workflow: any) => (
                              <SelectItem key={workflow._id} value={workflow._id}>
                                {workflow.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Automatically enroll contacts in another workflow when they reach this goal
                      </p>
                    </div>
                  </div>
                )}

                {selectedNode.type === "stop" && (
                  <p className="text-sm text-muted-foreground">
                    This node ends the workflow. No further actions will be taken for contacts that
                    reach this point.
                  </p>
                )}

                {/* Course Cycle Nodes */}
                {selectedNode.type === "courseCycle" && (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-violet-200 bg-violet-50 p-3 dark:border-violet-900 dark:bg-violet-950/30">
                      <div className="flex items-center gap-2">
                        <RotateCcw className="h-5 w-5 text-violet-600" />
                        <div>
                          <p className="text-sm font-medium text-violet-800 dark:text-violet-200">
                            Perpetual Course Cycle
                          </p>
                          <p className="text-xs text-violet-600 dark:text-violet-400">
                            Rotate through courses with AI-generated emails
                          </p>
                        </div>
                      </div>
                    </div>

                    {selectedNode.data.courseCycleConfigId ? (
                      <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950/30">
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">
                          Linked to: {selectedNode.data.configName || "Course Cycle"}
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          {selectedNode.data.courseCount || 0} courses in rotation
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => setIsCourseCycleConfigOpen(true)}
                        >
                          Change Configuration
                        </Button>
                      </div>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => setIsCourseCycleConfigOpen(true)}
                      >
                        Configure Course Cycle
                      </Button>
                    )}
                  </div>
                )}

                {selectedNode.type === "courseEmail" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Email Phase</Label>
                      <Select
                        value={selectedNode.data.emailPhase || "nurture"}
                        onValueChange={(v) =>
                          updateNodeData(selectedNode.id, { emailPhase: v as "nurture" | "pitch" })
                        }
                      >
                        <SelectTrigger className="bg-white dark:bg-black">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-black">
                          <SelectItem value="nurture">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-blue-500" />
                              Nurture Email (value/tips)
                            </div>
                          </SelectItem>
                          <SelectItem value="pitch">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-orange-500" />
                              Pitch Email (sales)
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {selectedNode.data.emailPhase === "pitch"
                        ? "Sales-focused emails with CTAs to purchase the current course"
                        : "Value-focused emails with tips and insights from the course"}
                    </p>
                  </div>
                )}

                {selectedNode.type === "purchaseCheck" && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Checks if the user has purchased the current course in the cycle.
                      Routes to different paths based on purchase status.
                    </p>
                    <div className="space-y-2">
                      <Label>Purchase Tag Prefix</Label>
                      <Input
                        value={selectedNode.data.purchaseTagPrefix || "purchased_course_"}
                        onChange={(e) =>
                          updateNodeData(selectedNode.id, { purchaseTagPrefix: e.target.value })
                        }
                        placeholder="purchased_course_"
                      />
                      <p className="text-xs text-muted-foreground">
                        Tag added when user purchases (prefix + course ID)
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded border border-green-200 bg-green-50 p-2 dark:border-green-900 dark:bg-green-950/30">
                        <p className="font-medium text-green-700 dark:text-green-300">Purchased Path</p>
                        <p className="text-green-600 dark:text-green-400">User bought the course</p>
                      </div>
                      <div className="rounded border border-red-200 bg-red-50 p-2 dark:border-red-900 dark:bg-red-950/30">
                        <p className="font-medium text-red-700 dark:text-red-300">Not Purchased Path</p>
                        <p className="text-red-600 dark:text-red-400">User hasn&apos;t bought yet</p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedNode.type === "cycleLoop" && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Advances to the next unpurchased course in the cycle.
                      If all courses are purchased, exits the loop.
                    </p>
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30">
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        <strong>Tip:</strong> Connect the output back to the Course Cycle node
                        to create a perpetual loop.
                      </p>
                    </div>
                  </div>
                )}

                <DialogFooter className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteNode(selectedNode.id)}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Node
                  </Button>
                  <Button size="sm" onClick={() => setSelectedNode(null)} className="gap-2">
                    <Check className="h-4 w-4" />
                    Done
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={isAddContactsOpen} onOpenChange={setIsAddContactsOpen}>
          <DialogContent className="max-h-[80vh] max-w-lg bg-white dark:bg-black">
            <DialogHeader>
              <DialogTitle>Add Contacts to Workflow</DialogTitle>
              <DialogDescription>
                Select contacts to enroll in this automation workflow
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Enroll All Contacts Option */}
              {contactStats && contactStats.total > 0 && (
                <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-900 dark:bg-purple-950/30">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
                        Enroll All Contacts
                      </p>
                      <p className="text-xs text-purple-600 dark:text-purple-400">
                        Add all {contactStats.total.toLocaleString()} contacts to this automation
                      </p>
                    </div>
                    <Button
                      onClick={handleEnrollAllContacts}
                      disabled={isEnrollingAll}
                      className="shrink-0 gap-2 bg-purple-600 hover:bg-purple-700"
                    >
                      <Users className="h-4 w-4" />
                      {isEnrollingAll ? "Enrolling..." : "Enroll All"}
                    </Button>
                  </div>
                </div>
              )}

              <div className="relative flex items-center gap-2">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">or select specific contacts</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search contacts..."
                  className="pl-10"
                  value={contactSearchQuery}
                  onChange={(e) => setContactSearchQuery(e.target.value)}
                />
              </div>

              {selectedContacts.size > 0 && (
                <div className="flex items-center justify-between rounded-md bg-primary/10 px-3 py-2">
                  <span className="text-sm font-medium">
                    {selectedContacts.size} contact{selectedContacts.size !== 1 ? "s" : ""} selected
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedContacts(new Set())}>
                    Clear
                  </Button>
                </div>
              )}

              <div className="max-h-[300px] overflow-y-auto rounded-md border">
                {filteredContacts.length > 0 && (
                  <div
                    className="flex cursor-pointer items-center gap-3 border-b bg-muted/50 px-3 py-2"
                    onClick={toggleAllContacts}
                  >
                    <Checkbox
                      checked={
                        filteredContacts.length > 0 &&
                        selectedContacts.size === filteredContacts.length
                      }
                      onCheckedChange={toggleAllContacts}
                    />
                    <span className="text-sm font-medium">Select All</span>
                  </div>
                )}
                {contacts === undefined ? (
                  <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                    {contactSearchQuery !== debouncedSearchQuery
                      ? "Searching..."
                      : "Loading contacts..."}
                  </div>
                ) : filteredContacts.length === 0 ? (
                  <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                    {debouncedSearchQuery
                      ? `No contacts found for "${debouncedSearchQuery}"`
                      : "No contacts found"}
                  </div>
                ) : (
                  filteredContacts.slice(0, 100).map((contact: any) => (
                    <div
                      key={contact._id}
                      className="flex cursor-pointer items-center gap-3 border-b px-3 py-2 last:border-b-0 hover:bg-muted/50"
                      onClick={() => toggleContactSelection(contact._id)}
                    >
                      <Checkbox
                        checked={selectedContacts.has(contact._id)}
                        onCheckedChange={() => toggleContactSelection(contact._id)}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {contact.firstName || contact.lastName
                            ? `${contact.firstName || ""} ${contact.lastName || ""}`.trim()
                            : contact.email}
                        </div>
                        {(contact.firstName || contact.lastName) && (
                          <div className="truncate text-xs text-muted-foreground">
                            {contact.email}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {filteredContacts.length > 100 && (
                  <div className="px-3 py-2 text-center text-xs text-muted-foreground">
                    Showing 100 of {filteredContacts.length} contacts
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddContactsOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleBulkEnroll}
                disabled={selectedContacts.size === 0 || isEnrolling}
                className="gap-2"
              >
                <UserPlus className="h-4 w-4" />
                {isEnrolling
                  ? "Enrolling..."
                  : `Enroll ${selectedContacts.size} Contact${selectedContacts.size !== 1 ? "s" : ""}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Email Editor Dialog */}
        <Dialog open={isEmailEditorOpen} onOpenChange={setIsEmailEditorOpen}>
          <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto bg-white dark:bg-black">
            <DialogHeader>
              <DialogTitle>Configure Email</DialogTitle>
              <DialogDescription>
                Create your email content or select from a saved template
              </DialogDescription>
            </DialogHeader>

            {selectedNode?.type === "email" && (
              <div className="space-y-6 py-4">
                <Tabs
                  value={selectedNode.data.mode || "custom"}
                  onValueChange={(v) =>
                    updateNodeData(selectedNode.id, { mode: v as "template" | "custom" | "abtest" })
                  }
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="template">Template</TabsTrigger>
                    <TabsTrigger value="custom">Custom</TabsTrigger>
                    <TabsTrigger value="abtest" className="gap-1">
                      <FlaskConical className="h-3 w-3" />
                      A/B Test
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="template" className="mt-4 space-y-4">
                    {/* Quick start - always show browse button prominently */}
                    <div className="space-y-4">
                      <Button
                        onClick={() => setIsTemplateBrowserOpen(true)}
                        className="w-full gap-2"
                        size="lg"
                      >
                        <Search className="h-4 w-4" />
                        Browse Email Templates
                      </Button>

                      {/* Selected Template Preview */}
                      {(selectedNode.data.templateId ||
                        selectedNode.data.prebuiltTemplateId ||
                        selectedNode.data.subject) && (
                        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
                          <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                              <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                Template loaded: {selectedNode.data.templateName || "Custom"}
                              </p>
                              <p className="mt-0.5 truncate text-sm text-green-600 dark:text-green-400">
                                Subject: {selectedNode.data.subject}
                              </p>
                              <p className="mt-2 text-xs text-green-600 dark:text-green-400">
                                Switch to &quot;Custom Email&quot; tab to edit the content
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <p className="text-center text-xs text-zinc-500">
                        Choose from {prebuiltEmailTemplates.length} pre-built templates designed for
                        music producers
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="custom" className="mt-4 space-y-4">
                    {/* AI Email Generation */}
                    <div className="rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 p-4 dark:border-purple-900 dark:from-purple-950/30 dark:to-blue-950/30">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                        <span className="font-semibold text-purple-800 dark:text-purple-200">AI Email Generator</span>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-xs">Content Source</Label>
                          <Select
                            value={aiContextType}
                            onValueChange={(v) => setAiContextType(v as typeof aiContextType)}
                          >
                            <SelectTrigger className="bg-white dark:bg-black">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-black">
                              <SelectItem value="store">
                                <div className="flex items-center gap-2">
                                  <Store className="h-4 w-4" />
                                  My Store/Brand
                                </div>
                              </SelectItem>
                              <SelectItem value="course">
                                <div className="flex items-center gap-2">
                                  <BookOpen className="h-4 w-4" />
                                  From a Course
                                </div>
                              </SelectItem>
                              <SelectItem value="product">
                                <div className="flex items-center gap-2">
                                  <Package className="h-4 w-4" />
                                  From a Product
                                </div>
                              </SelectItem>
                              <SelectItem value="custom">
                                <div className="flex items-center gap-2">
                                  <Wand2 className="h-4 w-4" />
                                  Custom Prompt
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Email Type</Label>
                          <Select
                            value={aiEmailType}
                            onValueChange={(v) => setAiEmailType(v as typeof aiEmailType)}
                          >
                            <SelectTrigger className="bg-white dark:bg-black">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-black">
                              <SelectItem value="welcome">Welcome Email</SelectItem>
                              <SelectItem value="nurture">Nurture / Value</SelectItem>
                              <SelectItem value="pitch">Sales Pitch</SelectItem>
                              <SelectItem value="follow_up">Follow-up</SelectItem>
                              <SelectItem value="thank_you">Thank You</SelectItem>
                              <SelectItem value="reminder">Reminder</SelectItem>
                              <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {aiContextType === "course" && (
                          <div className="space-y-2 md:col-span-2">
                            <Label className="text-xs">Select Course</Label>
                            <Select
                              value={aiSelectedCourseId}
                              onValueChange={setAiSelectedCourseId}
                            >
                              <SelectTrigger className="bg-white dark:bg-black">
                                <SelectValue placeholder="Choose a course..." />
                              </SelectTrigger>
                              <SelectContent className="bg-white dark:bg-black">
                                {userCourses?.map((course: { _id: string; title: string }) => (
                                  <SelectItem key={course._id} value={course._id}>
                                    {course.title}
                                  </SelectItem>
                                ))}
                                {(!userCourses || userCourses.length === 0) && (
                                  <SelectItem value="" disabled>No courses found</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {aiContextType === "product" && (
                          <div className="space-y-2 md:col-span-2">
                            <Label className="text-xs">Select Product</Label>
                            <Select
                              value={aiSelectedProductId}
                              onValueChange={setAiSelectedProductId}
                            >
                              <SelectTrigger className="bg-white dark:bg-black">
                                <SelectValue placeholder="Choose a product..." />
                              </SelectTrigger>
                              <SelectContent className="bg-white dark:bg-black">
                                {userProducts?.map((product: { _id: string; title: string }) => (
                                  <SelectItem key={product._id} value={product._id}>
                                    {product.title}
                                  </SelectItem>
                                ))}
                                {(!userProducts || userProducts.length === 0) && (
                                  <SelectItem value="" disabled>No products found</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label className="text-xs">Tone</Label>
                          <Select
                            value={aiTone}
                            onValueChange={(v) => setAiTone(v as typeof aiTone)}
                          >
                            <SelectTrigger className="bg-white dark:bg-black">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-black">
                              <SelectItem value="friendly">Friendly</SelectItem>
                              <SelectItem value="professional">Professional</SelectItem>
                              <SelectItem value="casual">Casual</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                              <SelectItem value="educational">Educational</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-end">
                          <Button
                            onClick={handleGenerateAIEmail}
                            disabled={isGeneratingAI || (aiContextType === "course" && !aiSelectedCourseId) || (aiContextType === "product" && !aiSelectedProductId)}
                            className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
                          >
                            {isGeneratingAI ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4" />
                                Generate Email
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      {(aiContextType === "custom" || aiEmailType === "custom") && (
                        <div className="mt-3 space-y-2">
                          <Label className="text-xs">Custom Instructions (optional)</Label>
                          <Input
                            value={aiCustomPrompt}
                            onChange={(e) => setAiCustomPrompt(e.target.value)}
                            placeholder="E.g., Mention the 50% discount, include a testimonial..."
                            className="bg-white dark:bg-black"
                          />
                        </div>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Subject Line *</Label>
                        <Input
                          value={selectedNode.data.subject || ""}
                          onChange={(e) =>
                            updateNodeData(selectedNode.id, { subject: e.target.value })
                          }
                          placeholder="Email subject line"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Preview Text</Label>
                        <Input
                          value={selectedNode.data.previewText || ""}
                          onChange={(e) =>
                            updateNodeData(selectedNode.id, { previewText: e.target.value })
                          }
                          placeholder="Shows in inbox preview"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Email Body</Label>
                      <WysiwygEditor
                        content={selectedNode.data.body || ""}
                        onChange={(html) => updateNodeData(selectedNode.id, { body: html })}
                        placeholder="Write your email content here..."
                        className="min-h-[350px]"
                      />
                    </div>

                    {/* Save as Template */}
                    <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                      <Label className="text-sm font-medium">Save for Reuse</Label>
                      <p className="mb-3 text-xs text-zinc-500">
                        Save this email as a template to use in other workflows
                      </p>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Template name..."
                          value={templateName}
                          onChange={(e) => setTemplateName(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          onClick={handleSaveAsTemplate}
                          disabled={isSavingTemplate || !selectedNode.data.subject}
                        >
                          {isSavingTemplate ? "Saving..." : "Save as Template"}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  {/* A/B Test Tab */}
                  <TabsContent value="abtest" className="mt-4 space-y-4">
                    <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-900 dark:bg-purple-950/30">
                      <div className="flex items-center gap-2">
                        <FlaskConical className="h-5 w-5 text-purple-600" />
                        <div>
                          <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
                            A/B Test Your Emails
                          </p>
                          <p className="text-xs text-purple-600 dark:text-purple-400">
                            Test different subject lines to see which performs better
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Enable A/B Testing Toggle */}
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <Label className="font-medium">Enable A/B Testing</Label>
                        <p className="text-xs text-muted-foreground">
                          Split test subject lines with your contacts
                        </p>
                      </div>
                      <Switch
                        checked={selectedNode.data.abTestEnabled || false}
                        onCheckedChange={(checked) => {
                          updateNodeData(selectedNode.id, { abTestEnabled: checked });
                          if (checked && (!selectedNode.data.abVariants || selectedNode.data.abVariants.length < 2)) {
                            // Initialize with 2 variants
                            const variants = [
                              { id: "variant_a", name: "Variant A", subject: selectedNode.data.subject || "", percentage: 50 },
                              { id: "variant_b", name: "Variant B", subject: "", percentage: 50 },
                            ];
                            updateNodeData(selectedNode.id, { abVariants: variants });
                          }
                        }}
                      />
                    </div>

                    {selectedNode.data.abTestEnabled && (
                      <div className="space-y-4">
                        {/* Variants */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="font-medium">Subject Line Variants</Label>
                            {(selectedNode.data.abVariants?.length || 0) < 3 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const variants = selectedNode.data.abVariants || [];
                                  const newVariant = {
                                    id: `variant_${String.fromCharCode(97 + variants.length)}`,
                                    name: `Variant ${String.fromCharCode(65 + variants.length)}`,
                                    subject: "",
                                    percentage: Math.floor(100 / (variants.length + 1)),
                                  };
                                  // Redistribute percentages
                                  const newPercentage = Math.floor(100 / (variants.length + 1));
                                  const updatedVariants = variants.map((v: any) => ({
                                    ...v,
                                    percentage: newPercentage,
                                  }));
                                  updatedVariants.push({ ...newVariant, percentage: 100 - (newPercentage * variants.length) });
                                  updateNodeData(selectedNode.id, { abVariants: updatedVariants });
                                }}
                                className="gap-1"
                              >
                                <Plus className="h-3 w-3" />
                                Add Variant
                              </Button>
                            )}
                          </div>

                          {(selectedNode.data.abVariants || []).map((variant: any, idx: number) => (
                            <div
                              key={variant.id}
                              className="rounded-lg border bg-white p-4 dark:bg-zinc-900"
                            >
                              <div className="mb-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-xs font-medium text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                                    {String.fromCharCode(65 + idx)}
                                  </span>
                                  <Input
                                    value={variant.name}
                                    onChange={(e) => {
                                      const variants = [...(selectedNode.data.abVariants || [])];
                                      variants[idx] = { ...variants[idx], name: e.target.value };
                                      updateNodeData(selectedNode.id, { abVariants: variants });
                                    }}
                                    className="h-8 w-32"
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">
                                    {variant.percentage}%
                                  </span>
                                  {(selectedNode.data.abVariants?.length || 0) > 2 && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const variants = selectedNode.data.abVariants.filter(
                                          (_: any, i: number) => i !== idx
                                        );
                                        // Redistribute percentages
                                        const newPercentage = Math.floor(100 / variants.length);
                                        const updatedVariants = variants.map((v: any, i: number) => ({
                                          ...v,
                                          percentage: i === variants.length - 1
                                            ? 100 - (newPercentage * (variants.length - 1))
                                            : newPercentage,
                                        }));
                                        updateNodeData(selectedNode.id, { abVariants: updatedVariants });
                                      }}
                                      className="h-6 w-6 p-0 text-zinc-400 hover:text-red-500"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                              <Input
                                value={variant.subject}
                                onChange={(e) => {
                                  const variants = [...(selectedNode.data.abVariants || [])];
                                  variants[idx] = { ...variants[idx], subject: e.target.value };
                                  updateNodeData(selectedNode.id, { abVariants: variants });
                                  // Also update main subject if this is first variant
                                  if (idx === 0) {
                                    updateNodeData(selectedNode.id, { subject: e.target.value });
                                  }
                                }}
                                placeholder="Enter subject line..."
                              />
                            </div>
                          ))}
                        </div>

                        {/* Test Settings */}
                        <div className="space-y-4 rounded-lg border p-4">
                          <Label className="font-medium">Test Settings</Label>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">
                                Sample Size (contacts)
                              </Label>
                              <Input
                                type="number"
                                value={selectedNode.data.abSampleSize || 100}
                                onChange={(e) =>
                                  updateNodeData(selectedNode.id, {
                                    abSampleSize: parseInt(e.target.value) || 100,
                                  })
                                }
                                min={10}
                                max={10000}
                              />
                              <p className="text-[10px] text-muted-foreground">
                                Test with this many contacts before selecting winner
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">
                                Winner Metric
                              </Label>
                              <Select
                                value={selectedNode.data.abWinnerMetric || "open_rate"}
                                onValueChange={(v) =>
                                  updateNodeData(selectedNode.id, {
                                    abWinnerMetric: v as "open_rate" | "click_rate",
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="open_rate">Open Rate</SelectItem>
                                  <SelectItem value="click_rate">Click Rate</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="text-xs">Auto-select Winner</Label>
                              <p className="text-[10px] text-muted-foreground">
                                Automatically pick the best variant after sample
                              </p>
                            </div>
                            <Switch
                              checked={selectedNode.data.abAutoSelectWinner !== false}
                              onCheckedChange={(checked) =>
                                updateNodeData(selectedNode.id, { abAutoSelectWinner: checked })
                              }
                            />
                          </div>
                        </div>

                        {/* Live Stats (if test is running) */}
                        {abTestData && abTestData.variants.length > 0 && (
                          <div className="space-y-3 rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-900 dark:bg-purple-950/30">
                            <div className="flex items-center justify-between">
                              <Label className="font-medium text-purple-800 dark:text-purple-200">
                                Live Test Results
                              </Label>
                              {abTestData.isComplete && abTestData.winner && (
                                <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                                  <Trophy className="h-3 w-3" />
                                  Test Complete
                                </span>
                              )}
                            </div>

                            <div className="space-y-2">
                              {abTestData.variants.map((v: any) => (
                                <div
                                  key={v.id}
                                  className={`flex items-center justify-between rounded p-2 ${
                                    abTestData.winner === v.id
                                      ? "bg-green-100 dark:bg-green-900/30"
                                      : "bg-white dark:bg-zinc-800"
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    {abTestData.winner === v.id && (
                                      <Trophy className="h-4 w-4 text-green-600" />
                                    )}
                                    <span className="text-sm font-medium">{v.name}</span>
                                  </div>
                                  <div className="flex gap-4 text-xs">
                                    <span>Sent: {v.sent}</span>
                                    <span className="font-medium text-purple-600">
                                      {v.openRate}% opens
                                    </span>
                                    <span>{v.clickRate}% clicks</span>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="flex items-center justify-between pt-2 text-xs text-purple-600 dark:text-purple-400">
                              <span>
                                Progress: {abTestData.totalSent}/{abTestData.sampleSize} contacts
                              </span>
                              {!abTestData.isComplete && workflowId && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={async () => {
                                    await resetABTest({
                                      workflowId: workflowId as Id<"emailWorkflows">,
                                      nodeId: selectedNode.id,
                                    });
                                    toast({ title: "Test stats reset" });
                                  }}
                                  className="h-6 gap-1 text-xs"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                  Reset
                                </Button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Save A/B Test Config */}
                        {workflowId && (
                          <Button
                            onClick={async () => {
                              try {
                                await saveABTest({
                                  workflowId: workflowId as Id<"emailWorkflows">,
                                  nodeId: selectedNode.id,
                                  isEnabled: selectedNode.data.abTestEnabled || false,
                                  variants: (selectedNode.data.abVariants || []).map((v: any) => ({
                                    id: v.id,
                                    name: v.name,
                                    subject: v.subject,
                                    body: v.body,
                                    percentage: v.percentage,
                                  })),
                                  sampleSize: selectedNode.data.abSampleSize || 100,
                                  winnerMetric: selectedNode.data.abWinnerMetric || "open_rate",
                                  autoSelectWinner: selectedNode.data.abAutoSelectWinner !== false,
                                  winnerThreshold: 5,
                                });
                                toast({ title: "A/B test configuration saved" });
                              } catch (error: any) {
                                toast({
                                  title: "Error",
                                  description: error.message,
                                  variant: "destructive",
                                });
                              }
                            }}
                            className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
                          >
                            <FlaskConical className="h-4 w-4" />
                            Save A/B Test Configuration
                          </Button>
                        )}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}

            <DialogFooter>
              <Button onClick={() => setIsEmailEditorOpen(false)}>Done</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Template Browser Dialog - Pre-built Templates */}
        <Dialog open={isTemplateBrowserOpen} onOpenChange={setIsTemplateBrowserOpen}>
          <DialogContent className="max-h-[85vh] max-w-4xl overflow-hidden bg-white dark:bg-black">
            <DialogHeader>
              <DialogTitle>Choose an Email Template</DialogTitle>
              <DialogDescription>
                Select a pre-built template to get started quickly. You can customize the content
                after selecting.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Category Filter - exclude "admin" category for creators */}
              <div className="flex flex-wrap gap-2">
                {emailTemplateCategories
                  .filter((cat) => cat.id !== "admin")
                  .map((cat) => (
                  <Button
                    key={cat.id}
                    variant={
                      (cat.id === "all" && templateCategoryFilter === null) ||
                      templateCategoryFilter === cat.id
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => setTemplateCategoryFilter(cat.id === "all" ? null : cat.id)}
                  >
                    {cat.label}
                  </Button>
                ))}
              </div>

              {/* Templates Grid - exclude "admin" category for creators */}
              <div className="max-h-[55vh] overflow-y-auto pr-2">
                <div className="grid gap-3 sm:grid-cols-2">
                  {prebuiltEmailTemplates
                    .filter((t) => t.category !== "admin" && (!templateCategoryFilter || t.category === templateCategoryFilter))
                    .map((template) => (
                      <div
                        key={template.id}
                        className={`cursor-pointer rounded-lg border p-4 transition-all hover:border-primary hover:shadow-md ${
                          selectedNode?.data.prebuiltTemplateId === template.id
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-zinc-200 dark:border-zinc-800"
                        }`}
                        onClick={() => {
                          if (selectedNode) {
                            updateNodeData(selectedNode.id, {
                              prebuiltTemplateId: template.id,
                              templateName: template.name,
                              subject: template.subject,
                              body: template.body,
                              mode: "custom", // Switch to custom mode so they can edit
                            });
                          }
                          setIsTemplateBrowserOpen(false);
                          toast({
                            title: "Template loaded",
                            description:
                              "You can now customize the subject and content in the editor.",
                          });
                        }}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-medium leading-tight">{template.name}</span>
                            <span className="shrink-0 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] capitalize text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                              {template.category}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500">{template.description}</p>
                          <p className="truncate rounded bg-zinc-50 px-2 py-1 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                            <span className="text-zinc-400">Subject:</span> {template.subject}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>

                {prebuiltEmailTemplates.filter(
                  (t) => t.category !== "admin" && (!templateCategoryFilter || t.category === templateCategoryFilter)
                ).length === 0 && (
                  <div className="py-8 text-center text-sm text-zinc-500">
                    No templates in this category
                  </div>
                )}
              </div>

              {/* User's saved templates section */}
              {emailTemplates && emailTemplates.length > 0 && (
                <div className="border-t pt-4">
                  <p className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Your Saved Templates
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {emailTemplates.map((template: any) => (
                      <Button
                        key={template._id}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => {
                          if (selectedNode) {
                            updateNodeData(selectedNode.id, {
                              templateId: template._id,
                              templateName: template.name,
                              subject: template.subject,
                              mode: "template",
                            });
                          }
                          setIsTemplateBrowserOpen(false);
                        }}
                      >
                        <FileText className="h-3.5 w-3.5" />
                        {template.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsTemplateBrowserOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* AI Workflow Sequence Generator Dialog - Premium Redesign */}
        <Dialog
          open={isSequenceGeneratorOpen}
          onOpenChange={(open) => {
            setIsSequenceGeneratorOpen(open);
            if (!open) setSequenceWizardStep(1);
          }}
        >
          <DialogContent className="flex max-h-[90vh] w-[95vw] max-w-4xl flex-col overflow-hidden border-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-0 shadow-2xl sm:w-full">
            {/* Accessibility: Hidden title for screen readers */}
            <DialogTitle className="sr-only">AI Workflow Sequence Generator</DialogTitle>

            {/* Animated background gradient */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute -left-1/4 -top-1/4 h-96 w-96 animate-pulse rounded-full bg-violet-600/20 blur-3xl" />
              <div className="absolute -bottom-1/4 -right-1/4 h-96 w-96 animate-pulse rounded-full bg-fuchsia-600/20 blur-3xl" style={{ animationDelay: '1s' }} />
              <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-cyan-600/10 blur-3xl" style={{ animationDelay: '2s' }} />
            </div>

            {/* Content container */}
            <div className="relative z-10 flex h-full flex-col">
              {/* Header */}
              <div className="border-b border-white/10 px-4 py-4 sm:px-6 sm:py-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative shrink-0">
                      <div className="absolute inset-0 animate-ping rounded-xl bg-violet-500/50" style={{ animationDuration: '2s' }} />
                      <div className="relative rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 p-2 shadow-lg shadow-violet-500/25 sm:p-2.5">
                        <Wand2 className="h-4 w-4 text-white sm:h-5 sm:w-5" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-semibold tracking-tight text-white sm:text-xl">AI Sequence Generator</h2>
                      <p className="truncate text-xs text-slate-400 sm:text-sm">Create high-converting email sequences in seconds</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsSequenceGeneratorOpen(false)}
                    className="shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Step indicator */}
                <div className="mt-5 flex items-center gap-2">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center gap-2">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all ${
                          sequenceWizardStep === step
                            ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30'
                            : sequenceWizardStep > step
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-white/5 text-slate-500'
                        }`}
                      >
                        {sequenceWizardStep > step ? <Check className="h-4 w-4" /> : step}
                      </div>
                      <span className={`hidden text-sm sm:block ${sequenceWizardStep >= step ? 'text-slate-300' : 'text-slate-600'}`}>
                        {step === 1 ? 'Campaign' : step === 2 ? 'Details' : 'Generate'}
                      </span>
                      {step < 3 && <div className={`hidden h-px w-8 sm:block ${sequenceWizardStep > step ? 'bg-emerald-500/50' : 'bg-white/10'}`} />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
                {/* Step 1: Campaign Type Selection */}
                {sequenceWizardStep === 1 && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="mb-1 text-lg font-medium text-white">What type of campaign?</h3>
                      <p className="text-sm text-slate-400">Choose the goal for your email sequence</p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        { id: 'product_launch', icon: Package, color: 'orange', label: 'Product Launch', desc: 'Build hype & drive sales' },
                        { id: 'course_launch', icon: BookOpen, color: 'blue', label: 'Course Launch', desc: 'Educate & convert students' },
                        { id: 'lead_nurture', icon: Users, color: 'emerald', label: 'Lead Nurture', desc: 'Build trust over time' },
                        { id: 'onboarding', icon: UserPlus, color: 'cyan', label: 'Onboarding', desc: 'Welcome new customers' },
                        { id: 're_engagement', icon: RotateCcw, color: 'amber', label: 'Re-engagement', desc: 'Win back cold leads' },
                        { id: 'promotion', icon: Trophy, color: 'yellow', label: 'Promotion', desc: 'Limited-time offers' },
                      ].map(({ id, icon: Icon, color, label, desc }) => (
                        <button
                          key={id}
                          onClick={() => {
                            setSequenceCampaignType(id as any);
                            // Auto-set context type based on campaign type for better UX
                            if (id === 'course_launch') {
                              setSequenceContextType('course');
                            } else if (id === 'product_launch' || id === 'promotion') {
                              setSequenceContextType('product');
                            }
                          }}
                          className={`group relative overflow-hidden rounded-xl border p-4 text-left transition-all ${
                            sequenceCampaignType === id
                              ? `border-${color}-500/50 bg-${color}-500/10 ring-1 ring-${color}-500/30`
                              : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                          }`}
                        >
                          <div className={`absolute inset-0 bg-gradient-to-br from-${color}-500/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100`} />
                          <div className="relative flex items-start gap-3">
                            <div className={`rounded-lg bg-${color}-500/20 p-2`}>
                              <Icon className={`h-5 w-5 text-${color}-400`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-white">{label}</span>
                                {sequenceCampaignType === id && (
                                  <div className={`rounded-full bg-${color}-500 p-0.5`}>
                                    <Check className="h-3 w-3 text-white" />
                                  </div>
                                )}
                              </div>
                              <p className="mt-0.5 text-sm text-slate-400">{desc}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 2: Details */}
                {sequenceWizardStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="mb-1 text-lg font-medium text-white">Customize your sequence</h3>
                      <p className="text-sm text-slate-400">Tell the AI about your campaign</p>
                    </div>

                    {/* Context Type Cards */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-slate-300">This campaign is for:</label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { id: 'store', icon: Store, label: 'My Brand' },
                          { id: 'course', icon: BookOpen, label: 'A Course' },
                          { id: 'product', icon: Package, label: 'A Product' },
                        ].map(({ id, icon: Icon, label }) => (
                          <button
                            key={id}
                            onClick={() => {
                              setSequenceContextType(id as any);
                              setSequenceCourseId('');
                              setSequenceProductId('');
                            }}
                            className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all ${
                              sequenceContextType === id
                                ? 'border-violet-500/50 bg-violet-500/10 text-white'
                                : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white'
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                            <span className="text-sm font-medium">{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Course/Product Selection */}
                    {sequenceContextType === 'course' && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Select your course</label>
                        {userCourses && userCourses.length > 0 ? (
                          <Select value={sequenceCourseId} onValueChange={setSequenceCourseId}>
                            <SelectTrigger className="border-white/10 bg-white/5 text-white hover:bg-white/10">
                              <SelectValue placeholder="Choose a course..." />
                            </SelectTrigger>
                            <SelectContent className="border-white/10 bg-slate-900">
                              {userCourses.map((course: any) => (
                                <SelectItem key={course._id} value={course._id} className="text-white focus:bg-white/10">
                                  {course.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                            <p className="text-sm text-amber-200">You don't have any courses yet.</p>
                            <p className="mt-1 text-xs text-slate-400">
                              Create a course first, or select "My Brand" to generate a general sequence.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {sequenceContextType === 'product' && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Select your product</label>
                        {userProducts && userProducts.length > 0 ? (
                          <Select value={sequenceProductId} onValueChange={setSequenceProductId}>
                            <SelectTrigger className="border-white/10 bg-white/5 text-white hover:bg-white/10">
                              <SelectValue placeholder="Choose a product..." />
                            </SelectTrigger>
                            <SelectContent className="border-white/10 bg-slate-900">
                              {userProducts.map((product: any) => (
                                <SelectItem key={product._id} value={product._id} className="text-white focus:bg-white/10">
                                  {product.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                            <p className="text-sm text-amber-200">You don't have any products yet.</p>
                            <p className="mt-1 text-xs text-slate-400">
                              Create a product first, or select "My Brand" to generate a general sequence.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Sequence Length - Visual slider-like buttons */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-slate-300">Sequence length</label>
                      <div className="flex gap-2">
                        {[
                          { value: 3, label: '3', desc: 'Quick' },
                          { value: 5, label: '5', desc: 'Standard' },
                          { value: 7, label: '7', desc: 'Extended' },
                          { value: 10, label: '10', desc: 'Full' },
                        ].map(({ value, label, desc }) => (
                          <button
                            key={value}
                            onClick={() => setSequenceLength(value)}
                            className={`flex-1 rounded-xl border px-3 py-3 text-center transition-all ${
                              sequenceLength === value
                                ? 'border-violet-500/50 bg-violet-500/10'
                                : 'border-white/10 bg-white/5 hover:border-white/20'
                            }`}
                          >
                            <div className={`text-xl font-bold ${sequenceLength === value ? 'text-white' : 'text-slate-400'}`}>
                              {label}
                            </div>
                            <div className="text-xs text-slate-500">{desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tone Selection */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-slate-300">Writing tone</label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: 'friendly', label: 'Friendly' },
                          { id: 'professional', label: 'Professional' },
                          { id: 'casual', label: 'Casual' },
                          { id: 'urgent', label: 'Urgent' },
                          { id: 'educational', label: 'Educational' },
                        ].map(({ id, label }) => (
                          <button
                            key={id}
                            onClick={() => setSequenceTone(id as any)}
                            className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                              sequenceTone === id
                                ? 'border-violet-500/50 bg-violet-500/20 text-white'
                                : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Instructions */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Special instructions (optional)</label>
                      <textarea
                        value={sequenceCustomPrompt}
                        onChange={(e) => setSequenceCustomPrompt(e.target.value)}
                        placeholder="E.g., Focus on the limited-time bonus, mention our money-back guarantee, include social proof..."
                        className="h-24 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 transition-colors focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
                      />
                    </div>
                  </div>
                )}

                {/* Step 3: Preview & Generate */}
                {sequenceWizardStep === 3 && !isGeneratingSequence && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="mb-1 text-lg font-medium text-white">Ready to generate</h3>
                      <p className="text-sm text-slate-400">Review your settings and create your sequence</p>
                    </div>

                    {/* Visual Preview */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
                      <div className="mb-4 flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-300">Your sequence will include:</span>
                        <span className="rounded-full bg-violet-500/20 px-3 py-1 text-xs font-medium text-violet-300">
                          {sequenceLength} emails
                        </span>
                      </div>

                      {/* Visual workflow preview - show first 5 emails, then ellipsis if more */}
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20">
                          <UserPlus className="h-4 w-4 text-emerald-400" />
                        </div>
                        {Array.from({ length: Math.min(sequenceLength, 5) }).map((_, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <div className="h-px w-3 bg-white/20" />
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/20">
                              <Mail className="h-3.5 w-3.5 text-blue-400" />
                            </div>
                          </div>
                        ))}
                        {sequenceLength > 5 && (
                          <div className="flex items-center gap-1.5">
                            <div className="h-px w-3 bg-white/20" />
                            <div className="flex h-9 items-center justify-center rounded-lg bg-white/5 px-3 text-xs text-slate-400">
                              +{sequenceLength - 5} more
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <div className="h-px w-3 bg-white/20" />
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/20">
                            <Trophy className="h-4 w-4 text-violet-400" />
                          </div>
                        </div>
                      </div>

                      {/* Summary */}
                      <div className="mt-4 space-y-3 border-t border-white/10 pt-4 text-sm">
                        <div className="flex items-start justify-between gap-4">
                          <span className="shrink-0 text-slate-400">Campaign type</span>
                          <span className="text-right font-medium capitalize text-white">{sequenceCampaignType.replace(/_/g, ' ')}</span>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <span className="shrink-0 text-slate-400">Writing tone</span>
                          <span className="text-right font-medium capitalize text-white">{sequenceTone}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-slate-400">Context</span>
                          <span className="break-words font-medium text-white">
                            {sequenceContextType === 'course' && sequenceCourseId
                              ? userCourses?.find((c: any) => c._id === sequenceCourseId)?.title || 'Course'
                              : sequenceContextType === 'product' && sequenceProductId
                                ? userProducts?.find((p: any) => p._id === sequenceProductId)?.title || 'Product'
                                : 'My Brand'}
                          </span>
                        </div>
                        {sequenceCustomPrompt && (
                          <div className="flex flex-col gap-1">
                            <span className="text-slate-400">Custom notes</span>
                            <span className="break-words text-xs text-slate-300">{sequenceCustomPrompt}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* What you get */}
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-emerald-500/20 p-2">
                          <Sparkles className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-white">AI will generate:</h4>
                          <ul className="mt-2 space-y-1.5 text-sm text-slate-300">
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-emerald-400" />
                              {sequenceLength} professionally written emails
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-emerald-400" />
                              Optimized timing delays
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-emerald-400" />
                              Subscriber segmentation tags
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-emerald-400" />
                              Conversion-focused structure
                            </li>
                          </ul>
                          <p className="mt-3 text-xs text-slate-400">
                            Every email, delay, and condition is fully customizable after generation
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Generating State */}
                {isGeneratingSequence && (
                  <div className="flex min-h-[300px] flex-col items-center justify-center py-12">
                    <div className="relative">
                      {/* Outer glow rings */}
                      <div className="absolute inset-0 animate-ping rounded-full border-2 border-violet-500/30" style={{ animationDuration: '2s' }} />
                      <div className="absolute inset-0 animate-ping rounded-full border border-fuchsia-500/20" style={{ animationDuration: '3s', animationDelay: '0.5s' }} />

                      {/* Main icon */}
                      <div className="relative rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 p-6 shadow-2xl shadow-violet-500/30">
                        <Wand2 className="h-10 w-10 animate-pulse text-white" />
                      </div>
                    </div>

                    <div className="mt-8 text-center">
                      <h3 className="text-xl font-semibold text-white">Creating your sequence...</h3>
                      <p className="mt-2 text-slate-400">AI is crafting {sequenceLength} emails optimized for conversion</p>
                      <p className="mt-1 text-xs text-slate-500">This typically takes 20-40 seconds</p>
                    </div>

                    {/* Progress dots */}
                    <div className="mt-6 flex gap-1.5">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="h-2 w-2 animate-pulse rounded-full bg-violet-500"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              {!isGeneratingSequence && (
                <div className="border-t border-white/10 px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        if (sequenceWizardStep === 1) {
                          setIsSequenceGeneratorOpen(false);
                        } else {
                          setSequenceWizardStep(sequenceWizardStep - 1);
                        }
                      }}
                      className="text-slate-400 hover:bg-white/5 hover:text-white"
                    >
                      {sequenceWizardStep === 1 ? 'Cancel' : 'Back'}
                    </Button>

                    {sequenceWizardStep < 3 ? (
                      <Button
                        onClick={() => setSequenceWizardStep(sequenceWizardStep + 1)}
                        disabled={
                          sequenceWizardStep === 2 &&
                          ((sequenceContextType === 'course' && !sequenceCourseId) ||
                           (sequenceContextType === 'product' && !sequenceProductId))
                        }
                        className="gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-50"
                      >
                        Continue
                        <ArrowLeft className="h-4 w-4 rotate-180" />
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleGenerateSequence()}
                        className="gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 text-white shadow-lg shadow-violet-500/25 hover:from-violet-500 hover:to-fuchsia-500"
                      >
                        <Sparkles className="h-4 w-4" />
                        Generate Sequence
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Course Cycle Configuration Dialog */}
        <Dialog open={isCourseCycleConfigOpen} onOpenChange={setIsCourseCycleConfigOpen}>
          <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto bg-white dark:bg-black">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-violet-500" />
                Course Cycle Configuration
              </DialogTitle>
              <DialogDescription>
                Set up a perpetual course rotation with AI-generated nurture and pitch emails
              </DialogDescription>
            </DialogHeader>

            <CourseCycleConfig
              storeId={storeId}
              selectedConfigId={selectedNode?.data.courseCycleConfigId || null}
              onConfigSelect={(configId, configName, courseCount) => {
                if (selectedNode && selectedNode.type === "courseCycle") {
                  updateNodeData(selectedNode.id, {
                    courseCycleConfigId: configId,
                    configName: configName || "Course Cycle",
                    courseCount: courseCount || 0,
                  });
                }
                if (configId) {
                  setIsCourseCycleConfigOpen(false);
                }
              }}
            />

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCourseCycleConfigOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Overwrite Confirmation Dialog */}
        <AlertDialog open={showOverwriteConfirm} onOpenChange={setShowOverwriteConfirm}>
          <AlertDialogContent className="border-slate-800 bg-slate-900">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-white">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Replace existing workflow?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400">
                This will replace your current workflow with <span className="font-medium text-white">{nodes.length} nodes</span>.
                Your unsaved changes will be lost. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setShowOverwriteConfirm(false);
                  handleGenerateSequence(true);
                }}
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500"
              >
                Yes, replace workflow
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

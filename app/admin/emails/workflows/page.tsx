"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Node, Edge } from "reactflow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { WysiwygEditor } from "@/components/ui/wysiwyg-editor";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Save,
  Trash2,
  AlertTriangle,
  Power,
  Clock,
  Users,
  UserPlus,
  ShoppingCart,
  GraduationCap,
  UserX,
  Search,
  Check,
  FlaskConical,
  Plus,
  X,
  Mail,
  Filter,
  FileText,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  prebuiltEmailTemplates,
  emailTemplateCategories,
  type EmailTemplate,
} from "@/app/dashboard/emails/workflows/templates/email-templates";
import NodeSidebar from "@/app/dashboard/emails/workflows/components/NodeSidebar";
import WorkflowCanvas from "@/app/dashboard/emails/workflows/components/WorkflowCanvas";
import CourseCycleConfig from "@/app/dashboard/emails/workflows/components/CourseCycleConfig";
import { RotateCcw } from "lucide-react";

// Admin-specific trigger types
type AdminTriggerType =
  | "all_users"
  | "all_creators"
  | "all_learners"
  | "new_signup"
  | "user_inactivity"
  | "any_purchase"
  | "any_course_complete"
  | "manual";

const adminTriggerOptions: { value: AdminTriggerType; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: "all_users",
    label: "All Platform Users",
    description: "Target every user on the platform",
    icon: <Users className="h-4 w-4" />
  },
  {
    value: "all_creators",
    label: "All Creators",
    description: "Target users who have created a store",
    icon: <UserPlus className="h-4 w-4" />
  },
  {
    value: "all_learners",
    label: "All Learners",
    description: "Target users without a store (learners only)",
    icon: <GraduationCap className="h-4 w-4" />
  },
  {
    value: "new_signup",
    label: "New User Signup",
    description: "Trigger when any new user signs up",
    icon: <UserPlus className="h-4 w-4" />
  },
  {
    value: "user_inactivity",
    label: "User Inactivity",
    description: "Trigger when user hasn't logged in for X days",
    icon: <UserX className="h-4 w-4" />
  },
  {
    value: "any_purchase",
    label: "Any Purchase",
    description: "Trigger on any product purchase (platform-wide)",
    icon: <ShoppingCart className="h-4 w-4" />
  },
  {
    value: "any_course_complete",
    label: "Any Course Completed",
    description: "Trigger when any user completes any course",
    icon: <GraduationCap className="h-4 w-4" />
  },
  {
    value: "manual",
    label: "Manual Enrollment",
    description: "Manually add users to this workflow",
    icon: <Users className="h-4 w-4" />
  },
];

const conditionOptions = [
  { value: "is_creator", label: "Is Creator" },
  { value: "is_learner", label: "Is Learner" },
  { value: "has_purchased", label: "Has Made Purchase" },
  { value: "course_enrolled", label: "Enrolled in Course" },
  { value: "level_reached", label: "Reached Level" },
  { value: "days_since_signup", label: "Days Since Signup" },
  { value: "days_inactive", label: "Days Inactive" },
];

const actionOptions = [
  { value: "send_notification", label: "Send Admin Notification" },
  { value: "add_to_segment", label: "Add to Segment" },
  { value: "mark_as_creator", label: "Mark as Creator" },
  { value: "award_xp", label: "Award XP" },
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

// Full sequence templates with all nodes pre-configured
interface SequenceTemplate {
  name: string;
  triggerType: AdminTriggerType;
  triggerConfig?: Record<string, unknown>;
  nodes: Node[];
  edges: Edge[];
}

const sequenceTemplates: Record<string, SequenceTemplate> = {
  welcome: {
    name: "Platform Welcome",
    triggerType: "new_signup",
    nodes: [
      {
        id: "trigger-1",
        type: "trigger",
        position: { x: 250, y: 0 },
        data: { triggerType: "new_signup", label: "New User Signup" },
      },
      {
        id: "email-1",
        type: "email",
        position: { x: 250, y: 120 },
        data: {
          label: "Welcome Email",
          subject: "Welcome to PPR Academy, {{firstName}}! 🎵",
          body: `<h2>Hey {{firstName}},</h2>
<p>Welcome to PPR Academy! We're thrilled to have you join our community of music producers.</p>
<p>Here's what you can do now:</p>
<ul>
<li><strong>Browse courses</strong> – Learn from top producers</li>
<li><strong>Get sample packs</strong> – Professional sounds for your productions</li>
<li><strong>Earn XP</strong> – Level up and climb the leaderboard</li>
</ul>
<p style="margin-top: 24px;">
<a href="{{platformUrl}}/courses" style="display: inline-block; background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Explore Courses →</a>
</p>
<p style="margin-top: 16px;">
<a href="{{platformUrl}}/sample-packs" style="color: #7c3aed; text-decoration: underline;">Browse Sample Packs</a> · <a href="{{platformUrl}}/leaderboard" style="color: #7c3aed; text-decoration: underline;">View Leaderboard</a>
</p>
<p style="margin-top: 24px;">Let's make some music!</p>
<p>– The PPR Team</p>`,
        },
      },
      {
        id: "delay-1",
        type: "delay",
        position: { x: 250, y: 240 },
        data: { delayValue: 2, delayUnit: "days", label: "Wait 2 days" },
      },
      {
        id: "email-2",
        type: "email",
        position: { x: 250, y: 360 },
        data: {
          label: "Getting Started",
          subject: "{{firstName}}, here's how to get the most out of PPR Academy",
          body: `<h2>Ready to level up?</h2>
<p>Hey {{firstName}},</p>
<p>Now that you've had a chance to look around, here are some tips to get the most out of PPR Academy:</p>
<div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 20px 0;">
<p style="margin: 0 0 12px 0;"><strong>1. Take a free course</strong></p>
<p style="margin: 0 0 8px 0; color: #6b7280;">Start with beginner-friendly content to build your foundation.</p>
<a href="{{platformUrl}}/courses?filter=free" style="color: #7c3aed; text-decoration: underline;">Browse free courses →</a>
</div>
<div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 20px 0;">
<p style="margin: 0 0 12px 0;"><strong>2. Download sample packs</strong></p>
<p style="margin: 0 0 8px 0; color: #6b7280;">Get professional sounds to use in your productions.</p>
<a href="{{platformUrl}}/sample-packs" style="color: #7c3aed; text-decoration: underline;">Explore sample packs →</a>
</div>
<div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 20px 0;">
<p style="margin: 0 0 12px 0;"><strong>3. Check your dashboard</strong></p>
<p style="margin: 0 0 8px 0; color: #6b7280;">Track your progress and see your XP grow.</p>
<a href="{{platformUrl}}/dashboard" style="color: #7c3aed; text-decoration: underline;">Go to dashboard →</a>
</div>
<p>Your current level: <strong>L{{level}}</strong> with <strong>{{xp}} XP</strong></p>
<p>Keep learning!</p>`,
        },
      },
      {
        id: "delay-2",
        type: "delay",
        position: { x: 250, y: 480 },
        data: { delayValue: 3, delayUnit: "days", label: "Wait 3 days" },
      },
      {
        id: "email-3",
        type: "email",
        position: { x: 250, y: 600 },
        data: {
          label: "Explore More",
          subject: "Discover what's popular on PPR Academy this week",
          body: `<h2>You're doing great, {{firstName}}!</h2>
<p>It's been almost a week since you joined. Here's what's trending on PPR Academy:</p>
<div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 20px 0;">
<p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280; text-transform: uppercase;">🔥 Trending This Week</p>
<p style="margin: 0 0 4px 0;"><strong>{{topCourseThisWeek}}</strong></p>
<a href="{{platformUrl}}/courses" style="color: #7c3aed; text-decoration: underline; font-size: 14px;">View all courses →</a>
</div>
<p><strong>{{newSamplePacksCount}} new sample packs</strong> were added this week. Don't miss out!</p>
<p style="margin-top: 24px;">
<a href="{{platformUrl}}/sample-packs?sort=newest" style="display: inline-block; background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">See New Sample Packs →</a>
</p>
<p style="margin-top: 24px; color: #6b7280;">Have questions? Just reply to this email – we read every message.</p>
<p>Keep creating!</p>`,
        },
      },
      {
        id: "action-1",
        type: "action",
        position: { x: 250, y: 720 },
        data: { actionType: "add_to_segment", segmentName: "Onboarded", label: "Tag: Onboarded" },
      },
    ],
    edges: [
      { id: "e1", source: "trigger-1", target: "email-1" },
      { id: "e2", source: "email-1", target: "delay-1" },
      { id: "e3", source: "delay-1", target: "email-2" },
      { id: "e4", source: "email-2", target: "delay-2" },
      { id: "e5", source: "delay-2", target: "email-3" },
      { id: "e6", source: "email-3", target: "action-1" },
    ],
  },
  new_learner: {
    name: "New Learner Journey",
    triggerType: "new_signup",
    nodes: [
      {
        id: "trigger-1",
        type: "trigger",
        position: { x: 250, y: 0 },
        data: { triggerType: "new_signup", label: "First Course Enrollment" },
      },
      {
        id: "email-1",
        type: "email",
        position: { x: 250, y: 120 },
        data: {
          label: "Course Welcome",
          subject: "You're enrolled! Let's start learning 🎓",
          body: `<h2>Congrats on enrolling, {{firstName}}!</h2>
<p>You've taken the first step. Now let's make sure you succeed.</p>
<p><strong>Quick tips:</strong></p>
<ul>
<li>Set aside 15-30 minutes daily</li>
<li>Complete lessons in order</li>
<li>Practice what you learn</li>
</ul>
<p>You've got this!</p>`,
        },
      },
      {
        id: "delay-1",
        type: "delay",
        position: { x: 250, y: 240 },
        data: { delayValue: 1, delayUnit: "days", label: "Wait 1 day" },
      },
      {
        id: "email-2",
        type: "email",
        position: { x: 250, y: 360 },
        data: {
          label: "Progress Check",
          subject: "How's your learning going, {{firstName}}?",
          body: `<h2>Just checking in!</h2>
<p>Hey {{firstName}}, how's the course going?</p>
<p>You've completed {{lessonsCompleted}} lessons so far. Keep up the momentum!</p>
<p>Remember: consistency beats intensity. Even 10 minutes today moves you forward.</p>`,
        },
      },
      {
        id: "delay-2",
        type: "delay",
        position: { x: 250, y: 480 },
        data: { delayValue: 3, delayUnit: "days", label: "Wait 3 days" },
      },
      {
        id: "email-3",
        type: "email",
        position: { x: 250, y: 600 },
        data: {
          label: "Motivation Boost",
          subject: "Keep going – you're making progress!",
          body: `<h2>You're doing amazing!</h2>
<p>{{firstName}}, you're already at Level {{level}} with {{xp}} XP!</p>
<p>The producers who succeed are the ones who keep showing up. You're one of them.</p>
<p>What will you learn today?</p>`,
        },
      },
      {
        id: "delay-3",
        type: "delay",
        position: { x: 250, y: 720 },
        data: { delayValue: 4, delayUnit: "days", label: "Wait 4 days" },
      },
      {
        id: "email-4",
        type: "email",
        position: { x: 250, y: 840 },
        data: {
          label: "Halfway Check",
          subject: "You're making real progress 🔥",
          body: `<h2>Look how far you've come!</h2>
<p>{{firstName}}, you've completed {{lessonsCompleted}} lessons. That's real progress!</p>
<p>Most people give up before they get this far. You're different.</p>
<p>Keep pushing – the finish line is closer than you think.</p>`,
        },
      },
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
  course_complete: {
    name: "Course Completion",
    triggerType: "any_course_complete",
    nodes: [
      {
        id: "trigger-1",
        type: "trigger",
        position: { x: 250, y: 0 },
        data: { triggerType: "any_course_complete", label: "Course Completed" },
      },
      {
        id: "email-1",
        type: "email",
        position: { x: 250, y: 120 },
        data: {
          label: "Celebration",
          subject: "🎉 You did it, {{firstName}}! Course complete!",
          body: `<h2>CONGRATULATIONS! 🎉</h2>
<p>{{firstName}}, you've completed the course!</p>
<p>This is a huge accomplishment. Most people start but never finish. You're in the top tier now.</p>
<p>Your certificate is ready to download in your dashboard.</p>
<p>Celebrate this win – you earned it!</p>`,
        },
      },
      {
        id: "delay-1",
        type: "delay",
        position: { x: 250, y: 240 },
        data: { delayValue: 2, delayUnit: "days", label: "Wait 2 days" },
      },
      {
        id: "email-2",
        type: "email",
        position: { x: 250, y: 360 },
        data: {
          label: "What's Next",
          subject: "What's next for you, {{firstName}}?",
          body: `<h2>Ready for your next challenge?</h2>
<p>Now that you've mastered that course, here are some paths forward:</p>
<ul>
<li>Take an advanced course</li>
<li>Apply what you learned to your own productions</li>
<li>Share your new skills with the community</li>
</ul>
<p>The learning never stops!</p>`,
        },
      },
    ],
    edges: [
      { id: "e1", source: "trigger-1", target: "email-1" },
      { id: "e2", source: "email-1", target: "delay-1" },
      { id: "e3", source: "delay-1", target: "email-2" },
    ],
  },
  learner_to_creator: {
    name: "Learner to Creator",
    triggerType: "all_learners",
    nodes: [
      {
        id: "trigger-1",
        type: "trigger",
        position: { x: 250, y: 0 },
        data: { triggerType: "all_learners", label: "Qualified Learner" },
      },
      {
        id: "condition-1",
        type: "condition",
        position: { x: 250, y: 120 },
        data: { conditionType: "level_reached", levelThreshold: 5, label: "Level 5+?" },
      },
      {
        id: "email-1",
        type: "email",
        position: { x: 250, y: 260 },
        data: {
          label: "Creator Invite",
          subject: "{{firstName}}, have you thought about creating?",
          body: `<h2>You've got skills worth sharing</h2>
<p>Hey {{firstName}},</p>
<p>You're at Level {{level}} now. That means you've learned a lot.</p>
<p>Have you ever thought about sharing your knowledge? Creating your own samples? Teaching what you know?</p>
<p>PPR Academy makes it easy to become a creator. Set up your store in minutes and start earning.</p>
<p>No pressure – just something to think about.</p>`,
        },
      },
      {
        id: "delay-1",
        type: "delay",
        position: { x: 250, y: 380 },
        data: { delayValue: 3, delayUnit: "days", label: "Wait 3 days" },
      },
      {
        id: "email-2",
        type: "email",
        position: { x: 250, y: 500 },
        data: {
          label: "Why Create",
          subject: "Why producers are becoming creators on PPR",
          body: `<h2>The creator opportunity</h2>
<p>{{firstName}}, here's why producers like you are becoming creators:</p>
<ul>
<li>Share your unique sounds with the world</li>
<li>Build passive income from your productions</li>
<li>Grow your reputation in the community</li>
</ul>
<p>You already have what it takes. The question is: will you take the leap?</p>`,
        },
      },
      {
        id: "delay-2",
        type: "delay",
        position: { x: 250, y: 620 },
        data: { delayValue: 4, delayUnit: "days", label: "Wait 4 days" },
      },
      {
        id: "email-3",
        type: "email",
        position: { x: 250, y: 740 },
        data: {
          label: "Getting Started",
          subject: "How to start your creator journey (it's easier than you think)",
          body: `<h2>Start small, dream big</h2>
<p>{{firstName}}, becoming a creator is simpler than you might think:</p>
<ol>
<li>Create your store (takes 2 minutes)</li>
<li>Upload your first sample pack or preset</li>
<li>Share it with the community</li>
</ol>
<p>You don't need to be perfect. You just need to start.</p>
<p>Ready to try it? Click below to create your store.</p>`,
        },
      },
      {
        id: "delay-3",
        type: "delay",
        position: { x: 250, y: 860 },
        data: { delayValue: 5, delayUnit: "days", label: "Wait 5 days" },
      },
      {
        id: "email-4",
        type: "email",
        position: { x: 250, y: 980 },
        data: {
          label: "Final Nudge",
          subject: "Last thought on becoming a creator...",
          body: `<h2>One last thing</h2>
<p>{{firstName}}, I won't keep bugging you about this.</p>
<p>But I genuinely believe you have something valuable to share. Your unique perspective, your sounds, your knowledge.</p>
<p>The world needs more creators. Maybe you're one of them.</p>
<p>No matter what you decide, keep making music. That's what matters most.</p>`,
        },
      },
      {
        id: "action-1",
        type: "action",
        position: { x: 250, y: 1100 },
        data: { actionType: "add_to_segment", segmentName: "Creator Sequence Completed", label: "Tag: Sequence Complete" },
      },
    ],
    edges: [
      { id: "e1", source: "trigger-1", target: "condition-1" },
      { id: "e2", source: "condition-1", target: "email-1", sourceHandle: "yes" },
      { id: "e3", source: "email-1", target: "delay-1" },
      { id: "e4", source: "delay-1", target: "email-2" },
      { id: "e5", source: "email-2", target: "delay-2" },
      { id: "e6", source: "delay-2", target: "email-3" },
      { id: "e7", source: "email-3", target: "delay-3" },
      { id: "e8", source: "delay-3", target: "email-4" },
      { id: "e9", source: "email-4", target: "action-1" },
    ],
  },
  new_creator: {
    name: "New Creator Onboarding",
    triggerType: "all_creators",
    nodes: [
      {
        id: "trigger-1",
        type: "trigger",
        position: { x: 250, y: 0 },
        data: { triggerType: "all_creators", label: "Store Created" },
      },
      {
        id: "email-1",
        type: "email",
        position: { x: 250, y: 120 },
        data: {
          label: "Welcome Creator",
          subject: "Welcome to the creator side, {{firstName}}! 🚀",
          body: `<h2>You're officially a creator!</h2>
<p>{{firstName}}, congrats on setting up your store!</p>
<p>This is the start of something exciting. Here's what to do next:</p>
<ol>
<li>Complete your store profile</li>
<li>Upload your first product</li>
<li>Share your store link</li>
</ol>
<p>We're here to help you succeed.</p>`,
        },
      },
      {
        id: "delay-1",
        type: "delay",
        position: { x: 250, y: 240 },
        data: { delayValue: 1, delayUnit: "days", label: "Wait 1 day" },
      },
      {
        id: "email-2",
        type: "email",
        position: { x: 250, y: 360 },
        data: {
          label: "First Product",
          subject: "Tips for your first product",
          body: `<h2>Creating your first product</h2>
<p>{{firstName}}, here are tips for a successful first product:</p>
<ul>
<li>Start with what you know best</li>
<li>Quality over quantity</li>
<li>Write a compelling description</li>
<li>Use eye-catching artwork</li>
</ul>
<p>Your first product doesn't need to be perfect. It just needs to exist.</p>`,
        },
      },
      {
        id: "delay-2",
        type: "delay",
        position: { x: 250, y: 480 },
        data: { delayValue: 2, delayUnit: "days", label: "Wait 2 days" },
      },
      {
        id: "email-3",
        type: "email",
        position: { x: 250, y: 600 },
        data: {
          label: "Promotion Tips",
          subject: "How to get your first sale",
          body: `<h2>Getting your first sale</h2>
<p>{{firstName}}, here's how creators get their first sale:</p>
<ol>
<li>Share on social media</li>
<li>Engage with the PPR community</li>
<li>Offer a launch discount</li>
<li>Ask friends to check it out</li>
</ol>
<p>The first sale is the hardest. After that, it gets easier.</p>`,
        },
      },
      {
        id: "delay-3",
        type: "delay",
        position: { x: 250, y: 720 },
        data: { delayValue: 4, delayUnit: "days", label: "Wait 4 days" },
      },
      {
        id: "email-4",
        type: "email",
        position: { x: 250, y: 840 },
        data: {
          label: "Keep Going",
          subject: "The creator journey – keep going!",
          body: `<h2>You're on your way</h2>
<p>{{firstName}}, how's the creator journey going?</p>
<p>Remember: every successful creator started exactly where you are now.</p>
<p>Keep creating, keep sharing, keep improving. The results will come.</p>`,
        },
      },
      {
        id: "delay-4",
        type: "delay",
        position: { x: 250, y: 960 },
        data: { delayValue: 7, delayUnit: "days", label: "Wait 7 days" },
      },
      {
        id: "email-5",
        type: "email",
        position: { x: 250, y: 1080 },
        data: {
          label: "Check In",
          subject: "How can we help you succeed?",
          body: `<h2>We're here to help</h2>
<p>{{firstName}}, you've been a creator for a couple weeks now.</p>
<p>How's it going? Is there anything we can help with?</p>
<p>Reply to this email with any questions – we read and respond to every message.</p>`,
        },
      },
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
  platform_reengagement: {
    name: "Platform Re-engagement",
    triggerType: "user_inactivity",
    triggerConfig: { inactivityDays: 14 },
    nodes: [
      {
        id: "trigger-1",
        type: "trigger",
        position: { x: 250, y: 0 },
        data: { triggerType: "user_inactivity", inactivityDays: 14, label: "14 Days Inactive" },
      },
      {
        id: "email-1",
        type: "email",
        position: { x: 250, y: 120 },
        data: {
          label: "We Miss You",
          subject: "{{firstName}}, we miss you at PPR Academy!",
          body: `<h2>Hey {{firstName}}, where'd you go?</h2>
<p>We noticed you haven't been around lately. Everything okay?</p>
<p>Since you've been away, here's what's new on PPR Academy:</p>
<ul>
<li><strong>{{newCoursesCount}} new courses</strong> added{{#if latestCourseName}} – including "{{latestCourseName}}"{{/if}}</li>
<li><strong>{{newSamplePacksCount}} fresh sample packs</strong> from creators you might like</li>
<li><strong>{{newCreatorsCount}} new creators</strong> have joined the community</li>
</ul>
<p style="margin-top: 24px;">
<a href="{{platformUrl}}/courses" style="display: inline-block; background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Browse New Courses →</a>
</p>
<p style="margin-top: 16px;">
<a href="{{platformUrl}}/sample-packs" style="color: #7c3aed; text-decoration: underline;">Check out new sample packs</a>
</p>`,
        },
      },
      {
        id: "delay-1",
        type: "delay",
        position: { x: 250, y: 240 },
        data: { delayValue: 3, delayUnit: "days", label: "Wait 3 days" },
      },
      {
        id: "email-2",
        type: "email",
        position: { x: 250, y: 360 },
        data: {
          label: "Your Progress",
          subject: "Your PPR Academy progress (don't lose it!)",
          body: `<h2>Your progress is waiting, {{firstName}}</h2>
<p>Here's where you left off:</p>
<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
<tr style="background: #f3f4f6;">
<td style="padding: 12px; border-radius: 6px 0 0 6px;"><strong>Your Level</strong></td>
<td style="padding: 12px;">L{{level}}</td>
</tr>
<tr>
<td style="padding: 12px;"><strong>Total XP</strong></td>
<td style="padding: 12px;">{{xp}} XP</td>
</tr>
<tr style="background: #f3f4f6;">
<td style="padding: 12px;"><strong>Courses Enrolled</strong></td>
<td style="padding: 12px;">{{coursesEnrolled}}</td>
</tr>
<tr>
<td style="padding: 12px; border-radius: 0 0 0 6px;"><strong>Lessons Completed</strong></td>
<td style="padding: 12px; border-radius: 0 0 6px 0;">{{lessonsCompleted}}</td>
</tr>
</table>
<p>You were making great progress. Don't let that momentum slip away!</p>
<p style="margin-top: 24px;">
<a href="{{platformUrl}}/dashboard" style="display: inline-block; background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Continue Learning →</a>
</p>`,
        },
      },
      {
        id: "delay-2",
        type: "delay",
        position: { x: 250, y: 480 },
        data: { delayValue: 5, delayUnit: "days", label: "Wait 5 days" },
      },
      {
        id: "email-3",
        type: "email",
        position: { x: 250, y: 600 },
        data: {
          label: "Special Offer",
          subject: "{{firstName}}, here's 20% off to come back",
          body: `<h2>We want you back, {{firstName}}</h2>
<p>It's been a few weeks since you logged in. We get it – life gets busy.</p>
<p>To make coming back easier, here's a <strong>20% discount</strong> on any course or sample pack:</p>
<div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
<p style="color: white; font-size: 14px; margin: 0;">Your exclusive code:</p>
<p style="color: white; font-size: 28px; font-weight: bold; margin: 8px 0; letter-spacing: 2px;">COMEBACK20</p>
<p style="color: rgba(255,255,255,0.8); font-size: 12px; margin: 0;">Valid for 7 days</p>
</div>
<p style="margin-top: 24px;">
<a href="{{platformUrl}}/courses?discount=COMEBACK20" style="display: inline-block; background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Shop with 20% Off →</a>
</p>
<p style="color: #6b7280; font-size: 14px; margin-top: 24px;">Your music production journey is worth continuing. We're here when you're ready.</p>`,
        },
      },
    ],
    edges: [
      { id: "e1", source: "trigger-1", target: "email-1" },
      { id: "e2", source: "email-1", target: "delay-1" },
      { id: "e3", source: "delay-1", target: "email-2" },
      { id: "e4", source: "email-2", target: "delay-2" },
      { id: "e5", source: "delay-2", target: "email-3" },
    ],
  },
  platform_winback: {
    name: "Platform Win-back",
    triggerType: "user_inactivity",
    triggerConfig: { inactivityDays: 60 },
    nodes: [
      {
        id: "trigger-1",
        type: "trigger",
        position: { x: 250, y: 0 },
        data: { triggerType: "user_inactivity", inactivityDays: 60, label: "60 Days Inactive" },
      },
      {
        id: "email-1",
        type: "email",
        position: { x: 250, y: 120 },
        data: {
          label: "Been a While",
          subject: "It's been a while, {{firstName}}",
          body: `<h2>Hey {{firstName}}</h2>
<p>It's been about 2 months since we've seen you. Life gets busy – we get it.</p>
<p>But your music production journey doesn't have to stop.</p>
<p>We're still here, and so is everything you started.</p>
<p>Ready to pick up where you left off?</p>`,
        },
      },
      {
        id: "delay-1",
        type: "delay",
        position: { x: 250, y: 240 },
        data: { delayValue: 5, delayUnit: "days", label: "Wait 5 days" },
      },
      {
        id: "email-2",
        type: "email",
        position: { x: 250, y: 360 },
        data: {
          label: "Last Chance",
          subject: "One last message from PPR Academy",
          body: `<h2>This is our last email</h2>
<p>{{firstName}}, we don't want to keep bothering you if you're not interested.</p>
<p>But before we stop emailing, we wanted to say: your spot is still here.</p>
<p>Your progress, your level, your community – all waiting for you.</p>
<p>If you ever want to come back, we'd love to have you.</p>
<p>Until then, keep making music. 🎵</p>`,
        },
      },
      {
        id: "action-1",
        type: "action",
        position: { x: 250, y: 480 },
        data: { actionType: "add_to_segment", segmentName: "Churned", label: "Tag: Churned" },
      },
    ],
    edges: [
      { id: "e1", source: "trigger-1", target: "email-1" },
      { id: "e2", source: "email-1", target: "delay-1" },
      { id: "e3", source: "delay-1", target: "email-2" },
      { id: "e4", source: "email-2", target: "action-1" },
    ],
  },
  course_progress: {
    name: "Course Progress",
    triggerType: "any_course_complete",
    nodes: [
      {
        id: "trigger-1",
        type: "trigger",
        position: { x: 250, y: 0 },
        data: { triggerType: "any_course_complete", label: "Module Completed" },
      },
      {
        id: "email-1",
        type: "email",
        position: { x: 250, y: 120 },
        data: {
          label: "Progress Update",
          subject: "Nice work on your progress, {{firstName}}! 🎯",
          body: `<h2>You're making progress!</h2>
<p>{{firstName}}, you just completed another module. That's awesome!</p>
<p>Current stats: Level {{level}} | {{xp}} XP | {{lessonsCompleted}} lessons completed</p>
<p>Keep up the great work!</p>`,
        },
      },
    ],
    edges: [
      { id: "e1", source: "trigger-1", target: "email-1" },
    ],
  },
  creator_success: {
    name: "Creator Success",
    triggerType: "any_purchase",
    nodes: [
      {
        id: "trigger-1",
        type: "trigger",
        position: { x: 250, y: 0 },
        data: { triggerType: "any_purchase", label: "First Sale Made" },
      },
      {
        id: "email-1",
        type: "email",
        position: { x: 250, y: 120 },
        data: {
          label: "First Sale",
          subject: "🎉 You made your first sale!",
          body: `<h2>CONGRATULATIONS!</h2>
<p>{{firstName}}, you just made your first sale! This is HUGE!</p>
<p>Most creators never get this far. You did it.</p>
<p>This is proof that people value what you create. Now imagine what happens when you keep going.</p>
<p>Celebrate this win – you earned it!</p>`,
        },
      },
      {
        id: "delay-1",
        type: "delay",
        position: { x: 250, y: 240 },
        data: { delayValue: 2, delayUnit: "days", label: "Wait 2 days" },
      },
      {
        id: "email-2",
        type: "email",
        position: { x: 250, y: 360 },
        data: {
          label: "Keep Momentum",
          subject: "Keep the momentum going!",
          body: `<h2>What's next?</h2>
<p>{{firstName}}, now that you've proven your work sells, here's how to keep growing:</p>
<ul>
<li>Create more products</li>
<li>Engage with your buyers</li>
<li>Share your success story</li>
</ul>
<p>You're a real creator now. Act like it!</p>`,
        },
      },
      {
        id: "delay-2",
        type: "delay",
        position: { x: 250, y: 480 },
        data: { delayValue: 5, delayUnit: "days", label: "Wait 5 days" },
      },
      {
        id: "email-3",
        type: "email",
        position: { x: 250, y: 600 },
        data: {
          label: "Growth Tips",
          subject: "Tips from top creators",
          body: `<h2>Level up your creator game</h2>
<p>{{firstName}}, here's what successful creators do:</p>
<ol>
<li>Release consistently</li>
<li>Listen to customer feedback</li>
<li>Build an email list</li>
<li>Cross-promote with other creators</li>
</ol>
<p>Total earnings so far: {{totalEarnings}}</p>
<p>Let's grow that number!</p>`,
        },
      },
    ],
    edges: [
      { id: "e1", source: "trigger-1", target: "email-1" },
      { id: "e2", source: "email-1", target: "delay-1" },
      { id: "e3", source: "delay-1", target: "email-2" },
      { id: "e4", source: "email-2", target: "delay-2" },
      { id: "e5", source: "delay-2", target: "email-3" },
    ],
  },
};

export default function AdminWorkflowBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workflowId = searchParams.get("id");
  const sequenceType = searchParams.get("sequence");
  const { user } = useUser();
  const { toast } = useToast();

  // Get sequence template if creating from overview
  const sequenceTemplate = sequenceType ? sequenceTemplates[sequenceType] : null;

  const [workflowName, setWorkflowName] = useState(sequenceTemplate?.name || "New Admin Workflow");
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [addNodeFn, setAddNodeFn] = useState<((type: string) => void) | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Email editor dialog state
  const [isEmailEditorOpen, setIsEmailEditorOpen] = useState(false);
  const [isTemplateBrowserOpen, setIsTemplateBrowserOpen] = useState(false);
  const [isCourseCycleConfigOpen, setIsCourseCycleConfigOpen] = useState(false);
  const [templateSearchQuery, setTemplateSearchQuery] = useState("");
  const [templateCategory, setTemplateCategory] = useState<string>("all");
  const [templateName, setTemplateName] = useState("");
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  // Get existing workflow if editing
  const existingWorkflow = useQuery(
    api.emailWorkflows.getWorkflow,
    workflowId ? { workflowId: workflowId as Id<"emailWorkflows"> } : "skip"
  );

  // Get admin email templates
  const emailTemplates = useQuery(
    api.emailWorkflows.listEmailTemplates,
    { storeId: "admin" }
  );

  const nodeExecutionCounts = useQuery(
    api.emailWorkflows.getNodeExecutionCounts,
    workflowId ? { workflowId: workflowId as Id<"emailWorkflows"> } : "skip"
  );

  // Mutations
  const createAdminWorkflow = useMutation(api.emailWorkflows.createAdminWorkflow);
  const updateWorkflow = useMutation(api.emailWorkflows.updateWorkflow);
  const deleteWorkflow = useMutation(api.emailWorkflows.deleteWorkflow);
  const toggleActive = useMutation(api.emailWorkflows.toggleWorkflowActive);
  const createEmailTemplate = useMutation(api.emailWorkflows.createEmailTemplate);

  // Initialize from existing workflow
  useEffect(() => {
    if (existingWorkflow) {
      setWorkflowName(existingWorkflow.name || "New Admin Workflow");
      setIsActive(existingWorkflow.isActive || false);
      if (existingWorkflow.nodes) {
        setNodes(existingWorkflow.nodes);
      }
      if (existingWorkflow.edges) {
        setEdges(existingWorkflow.edges);
      }
      setInitialized(true);
    }
  }, [existingWorkflow]);

  // Initialize from sequence type (only for new workflows) - use full template
  useEffect(() => {
    if (!workflowId && sequenceType && sequenceTemplates[sequenceType] && !initialized) {
      const template = sequenceTemplates[sequenceType];

      setWorkflowName(template.name);
      setNodes(template.nodes);
      setEdges(template.edges);
      setInitialized(true);

      const emailCount = template.nodes.filter(n => n.type === "email").length;
      const delayCount = template.nodes.filter(n => n.type === "delay").length;

      toast({
        title: `${template.name} loaded`,
        description: `Complete sequence with ${emailCount} emails, ${delayCount} delays. Review and save when ready.`,
      });
    }
  }, [workflowId, sequenceType, initialized, toast]);

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

  // Handle saving email as template
  const handleSaveAsTemplate = async () => {
    if (!selectedNode || !templateName.trim() || !selectedNode.data.subject) {
      toast({
        title: "Cannot save template",
        description: "Please provide a template name and subject line",
        variant: "destructive",
      });
      return;
    }

    setIsSavingTemplate(true);
    try {
      await createEmailTemplate({
        storeId: "admin",
        name: templateName,
        subject: selectedNode.data.subject,
        content: selectedNode.data.body || "",
      });
      toast({ title: "Template saved!", description: `"${templateName}" has been saved for reuse.` });
      setTemplateName("");
    } catch (error: any) {
      toast({ title: "Failed to save template", description: error.message, variant: "destructive" });
    } finally {
      setIsSavingTemplate(false);
    }
  };

  // Filter prebuilt templates
  const filteredTemplates = prebuiltEmailTemplates.filter((template) => {
    const matchesSearch =
      !templateSearchQuery ||
      template.name.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(templateSearchQuery.toLowerCase());
    const matchesCategory = templateCategory === "all" || template.category === templateCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSave = async () => {
    if (!user?.id) {
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
        type: n.type as "trigger" | "email" | "delay" | "condition" | "action" | "stop" | "webhook" | "split" | "notify" | "goal",
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
        type: (triggerNode.data.triggerType || "all_users") as AdminTriggerType,
        config: triggerNode.data,
      };

      if (workflowId) {
        await updateWorkflow({
          workflowId: workflowId as Id<"emailWorkflows">,
          name: workflowName,
          trigger: triggerData,
          nodes: nodesData,
          edges: edgesData,
        });
        toast({ title: "Saved", description: "Workflow updated successfully" });
      } else {
        const newId = await createAdminWorkflow({
          name: workflowName,
          userId: user.id,
          trigger: triggerData,
          nodes: nodesData,
          edges: edgesData,
        });
        toast({ title: "Saved", description: "Workflow created successfully" });
        router.push(`/admin/emails/workflows?id=${newId}`);
      }
    } catch (error) {
      console.error("Save error:", error);
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
      router.push("/admin/emails");
    } catch {
      toast({ title: "Error", description: "Failed to delete workflow", variant: "destructive" });
    }
  };

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/emails")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Input
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="max-w-64 border-none bg-transparent text-lg font-semibold focus-visible:ring-0"
          />
          <span className="rounded-md bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
            Admin Workflow
          </span>
        </div>
        <div className="flex items-center gap-2">
          {validationErrors.length > 0 && (
            <div className="flex items-center gap-1.5 rounded-md bg-amber-100 px-2.5 py-1 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              {validationErrors.length} issue{validationErrors.length > 1 ? "s" : ""}
            </div>
          )}
          {workflowId && (
            <>
              <div className="flex items-center gap-2 rounded-md border px-3 py-1.5">
                <Power
                  className={`h-4 w-4 ${isActive ? "text-green-600" : "text-muted-foreground"}`}
                />
                <span className="text-sm">{isActive ? "Active" : "Inactive"}</span>
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
                        ? "Users will now receive emails from this workflow"
                        : "Email sending paused",
                    });
                  }}
                />
              </div>
              <Button
                variant="outline"
                onClick={handleDelete}
                className="gap-2 text-red-600"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </>
          )}
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        <NodeSidebar onAddNode={addNodeFn || undefined} />

        <div className="flex-1">
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

        {/* Node configuration dialog */}
        <Dialog open={!!selectedNode} onOpenChange={(open) => !open && setSelectedNode(null)}>
          <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto bg-white dark:bg-black">
            <DialogHeader>
              <DialogTitle className="capitalize">{selectedNode?.type} Settings</DialogTitle>
              <DialogDescription>Configure this node for your admin workflow</DialogDescription>
            </DialogHeader>

            {selectedNode && (
              <div className="mt-6 space-y-4">
                {/* Trigger Node Configuration */}
                {selectedNode.type === "trigger" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Trigger Type</Label>
                      <Select
                        value={selectedNode.data.triggerType || "all_users"}
                        onValueChange={(v) =>
                          updateNodeData(selectedNode.id, {
                            triggerType: v,
                            inactivityDays: undefined,
                          })
                        }
                      >
                        <SelectTrigger className="bg-white dark:bg-black">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-black">
                          {adminTriggerOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              <div className="flex items-center gap-2">
                                {opt.icon}
                                <div>
                                  <div>{opt.label}</div>
                                  <div className="text-xs text-muted-foreground">{opt.description}</div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Inactivity days configuration */}
                    {selectedNode.data.triggerType === "user_inactivity" && (
                      <div className="space-y-2">
                        <Label>Days of Inactivity</Label>
                        <Input
                          type="number"
                          value={selectedNode.data.inactivityDays || 30}
                          onChange={(e) =>
                            updateNodeData(selectedNode.id, {
                              inactivityDays: parseInt(e.target.value) || 30,
                            })
                          }
                          className="bg-white dark:bg-black"
                          min={1}
                        />
                        <p className="text-xs text-muted-foreground">
                          Trigger when user hasn&apos;t logged in for this many days
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Email Node Configuration - Preview & Edit Button */}
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
                        <p className="text-sm text-muted-foreground">No email configured</p>
                      )}
                    </div>

                    <Button
                      className="w-full gap-2"
                      onClick={() => setIsEmailEditorOpen(true)}
                    >
                      <Mail className="h-4 w-4" />
                      {selectedNode.data.subject ? "Edit Email" : "Configure Email"}
                    </Button>
                  </>
                )}

                {/* Delay Node Configuration */}
                {selectedNode.type === "delay" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Duration</Label>
                        <Input
                          type="number"
                          value={selectedNode.data.delayValue || 1}
                          onChange={(e) =>
                            updateNodeData(selectedNode.id, {
                              delayValue: parseInt(e.target.value) || 1,
                            })
                          }
                          className="bg-white dark:bg-black"
                          min={1}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Unit</Label>
                        <Select
                          value={selectedNode.data.delayUnit || "days"}
                          onValueChange={(v) => updateNodeData(selectedNode.id, { delayUnit: v })}
                        >
                          <SelectTrigger className="bg-white dark:bg-black">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-black">
                            {delayUnits.map((unit) => (
                              <SelectItem key={unit.value} value={unit.value}>
                                {unit.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Condition Node Configuration */}
                {selectedNode.type === "condition" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Condition</Label>
                      <Select
                        value={selectedNode.data.conditionType || "is_creator"}
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

                    {/* Level threshold for level_reached condition */}
                    {selectedNode.data.conditionType === "level_reached" && (
                      <div className="space-y-2">
                        <Label>Minimum Level</Label>
                        <Input
                          type="number"
                          value={selectedNode.data.levelThreshold || 5}
                          onChange={(e) =>
                            updateNodeData(selectedNode.id, {
                              levelThreshold: parseInt(e.target.value) || 5,
                            })
                          }
                          className="bg-white dark:bg-black"
                          min={1}
                        />
                      </div>
                    )}

                    {/* Days threshold for time-based conditions */}
                    {(selectedNode.data.conditionType === "days_since_signup" ||
                      selectedNode.data.conditionType === "days_inactive") && (
                      <div className="space-y-2">
                        <Label>Days</Label>
                        <Input
                          type="number"
                          value={selectedNode.data.daysThreshold || 7}
                          onChange={(e) =>
                            updateNodeData(selectedNode.id, {
                              daysThreshold: parseInt(e.target.value) || 7,
                            })
                          }
                          className="bg-white dark:bg-black"
                          min={1}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Action Node Configuration */}
                {selectedNode.type === "action" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Action</Label>
                      <Select
                        value={selectedNode.data.actionType || "send_notification"}
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

                    {/* XP amount for award_xp action */}
                    {selectedNode.data.actionType === "award_xp" && (
                      <div className="space-y-2">
                        <Label>XP Amount</Label>
                        <Input
                          type="number"
                          value={selectedNode.data.xpAmount || 100}
                          onChange={(e) =>
                            updateNodeData(selectedNode.id, {
                              xpAmount: parseInt(e.target.value) || 100,
                            })
                          }
                          className="bg-white dark:bg-black"
                          min={1}
                        />
                      </div>
                    )}
                  </div>
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
                        className="bg-white dark:bg-black"
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

                {/* Delete Node Button */}
                <div className="flex justify-end border-t pt-4">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteNode(selectedNode.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Node
                  </Button>
                </div>
              </div>
            )}
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
                    {/* Quick start - browse templates */}
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
                                Switch to &quot;Custom&quot; tab to edit the content
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <p className="text-center text-xs text-zinc-500">
                        Choose from {prebuiltEmailTemplates.length} pre-built templates
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="custom" className="mt-4 space-y-4">
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

                    {/* Personalization Variables */}
                    <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
                      <p className="font-medium">User Variables:</p>
                      <p className="mt-1 text-xs">
                        {"{{firstName}}, {{name}}, {{email}}, {{level}}, {{xp}}, {{coursesEnrolled}}, {{lessonsCompleted}}, {{storeName}}, {{memberSince}}, {{daysSinceJoined}}, {{totalSpent}}"}
                      </p>
                      <p className="font-medium mt-2">Platform Variables:</p>
                      <p className="mt-1 text-xs">
                        {"{{platformUrl}}, {{newCoursesCount}}, {{latestCourseName}}, {{newSamplePacksCount}}, {{newCreatorsCount}}, {{topCourseThisWeek}}"}
                      </p>
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
                          Split test subject lines with your users
                        </p>
                      </div>
                      <Switch
                        checked={selectedNode.data.abTestEnabled || false}
                        onCheckedChange={(checked) => {
                          updateNodeData(selectedNode.id, { abTestEnabled: checked });
                          if (checked && (!selectedNode.data.abVariants || selectedNode.data.abVariants.length < 2)) {
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
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="font-medium">Subject Line Variants</Label>
                            {(selectedNode.data.abVariants?.length || 0) < 3 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const variants = selectedNode.data.abVariants || [];
                                  const newPercentage = Math.floor(100 / (variants.length + 1));
                                  const updatedVariants = variants.map((v: any) => ({
                                    ...v,
                                    percentage: newPercentage,
                                  }));
                                  updatedVariants.push({
                                    id: `variant_${String.fromCharCode(97 + variants.length)}`,
                                    name: `Variant ${String.fromCharCode(65 + variants.length)}`,
                                    subject: "",
                                    percentage: 100 - (newPercentage * variants.length),
                                  });
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
                                  <span className="text-sm font-medium">{variant.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">{variant.percentage}%</span>
                                  {(selectedNode.data.abVariants?.length || 0) > 2 && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => {
                                        const variants = selectedNode.data.abVariants.filter(
                                          (_: any, i: number) => i !== idx
                                        );
                                        const perEach = Math.floor(100 / variants.length);
                                        const redistributed = variants.map((v: any, i: number) => ({
                                          ...v,
                                          percentage: i === variants.length - 1 ? 100 - perEach * (variants.length - 1) : perEach,
                                        }));
                                        updateNodeData(selectedNode.id, { abVariants: redistributed });
                                      }}
                                    >
                                      <X className="h-3 w-3" />
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
                                }}
                                placeholder="Subject line for this variant..."
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEmailEditorOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsEmailEditorOpen(false)}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Template Browser Dialog */}
        <Dialog open={isTemplateBrowserOpen} onOpenChange={setIsTemplateBrowserOpen}>
          <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden bg-white dark:bg-black">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Email Template Library
              </DialogTitle>
              <DialogDescription>
                Choose a pre-built template to get started quickly
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Search and Filter */}
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search templates..."
                    value={templateSearchQuery}
                    onChange={(e) => setTemplateSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={templateCategory} onValueChange={setTemplateCategory}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-black">
                    <SelectItem value="all">All Categories</SelectItem>
                    {emailTemplateCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Template Grid */}
              <ScrollArea className="h-[400px] pr-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="group cursor-pointer rounded-lg border-2 p-4 transition-all hover:border-primary hover:bg-primary/5"
                      onClick={() => {
                        if (selectedNode) {
                          updateNodeData(selectedNode.id, {
                            prebuiltTemplateId: template.id,
                            templateName: template.name,
                            subject: template.subject,
                            body: template.body,
                            mode: "template",
                          });
                          setIsTemplateBrowserOpen(false);
                          toast({
                            title: "Template loaded",
                            description: `"${template.name}" has been applied to your email.`,
                          });
                        }
                      }}
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{template.name}</h4>
                          <Badge variant="secondary" className="mt-1">
                            {emailTemplateCategories.find((c) => c.id === template.category)?.label || template.category}
                          </Badge>
                        </div>
                      </div>
                      {template.description && (
                        <p className="mb-2 text-sm text-muted-foreground line-clamp-2">
                          {template.description}
                        </p>
                      )}
                      <p className="text-xs text-zinc-500">
                        Subject: {template.subject}
                      </p>
                    </div>
                  ))}
                </div>

                {filteredTemplates.length === 0 && (
                  <div className="py-12 text-center">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-muted-foreground">No templates match your search</p>
                  </div>
                )}
              </ScrollArea>
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
              storeId={user?.id || "admin"}
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
      </div>
    </div>
  );
}

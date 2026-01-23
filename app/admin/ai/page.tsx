"use client";

import { AdminCategoryPage } from "../components/AdminCategoryPage";
import { Sparkles, Wand2, TrendingUp, Lightbulb } from "lucide-react";

const aiCards = [
  {
    title: "Course Builder",
    description: "Generate courses at scale with AI-powered content creation",
    href: "/admin/course-builder",
    icon: Wand2,
    color: "bg-violet-500",
    badge: "NEW",
  },
  {
    title: "AI Flywheel",
    description: "Monitor and improve the self-learning AI system",
    href: "/admin/ai-flywheel",
    icon: TrendingUp,
    color: "bg-pink-500",
    badge: "✨",
  },
  {
    title: "Feature Discovery",
    description: "AI-powered insights for product and feature ideas",
    href: "/admin/feature-discovery",
    icon: Lightbulb,
    color: "bg-amber-500",
  },
  {
    title: "AI Studio",
    description: "Tools for AI content generation and automation",
    href: "/admin/ai-tools",
    icon: Sparkles,
    color: "bg-blue-500",
  },
];

export default function AIPage() {
  return (
    <AdminCategoryPage
      title="AI Platform"
      description="Manage AI-powered tools, content generation, and automation"
      icon={Sparkles}
      iconColor="bg-pink-500"
      cards={aiCards}
    />
  );
}

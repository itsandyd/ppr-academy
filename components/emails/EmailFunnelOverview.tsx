"use client";

import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Users,
  Mail,
  Workflow,
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Pause,
  Play,
  Plus,
  Settings,
  TrendingUp,
  UserPlus,
  ShoppingCart,
  GraduationCap,
  Store,
  Clock,
  UserX,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface EmailFunnelOverviewProps {
  storeId: string;
}

// Sequence types for the funnel - Creator-focused (for THEIR audience)
type SequenceType =
  | "welcome"
  | "buyer"
  | "course_student"
  | "lead_nurture"
  | "product_launch"
  | "coaching_client"
  | "reengagement"
  | "winback";

interface SequenceNode {
  id: SequenceType;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  triggerDescription: string;
  emailCount: number;
  status: "active" | "paused" | "draft" | "not_configured";
  enrolledCount: number;
  nextSequences: SequenceType[];
  position: "main" | "branch" | "recovery";
}

// Define the funnel structure - Creator-focused (for THEIR customers/audience)
const sequenceNodes: SequenceNode[] = [
  {
    id: "welcome",
    name: "Welcome Sequence",
    description: "New subscriber onboarding",
    icon: UserPlus,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    triggerDescription: "New subscriber joins your list",
    emailCount: 3,
    status: "not_configured",
    enrolledCount: 0,
    nextSequences: ["lead_nurture", "product_launch"],
    position: "main",
  },
  {
    id: "buyer",
    name: "Purchase Thank You",
    description: "Post-purchase follow-up",
    icon: ShoppingCart,
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    triggerDescription: "Customer makes a purchase",
    emailCount: 3,
    status: "not_configured",
    enrolledCount: 0,
    nextSequences: ["course_student", "coaching_client"],
    position: "main",
  },
  {
    id: "course_student",
    name: "Course Student",
    description: "Guide students through your course",
    icon: GraduationCap,
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    triggerDescription: "Student enrolls in your course",
    emailCount: 5,
    status: "not_configured",
    enrolledCount: 0,
    nextSequences: ["product_launch"],
    position: "branch",
  },
  {
    id: "coaching_client",
    name: "Coaching Client",
    description: "Onboard & follow up with clients",
    icon: Users,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/30",
    triggerDescription: "Client books coaching session",
    emailCount: 4,
    status: "not_configured",
    enrolledCount: 0,
    nextSequences: [],
    position: "branch",
  },
  {
    id: "lead_nurture",
    name: "Lead Nurture",
    description: "Build trust with value content",
    icon: Sparkles,
    color: "text-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    triggerDescription: "Subscriber hasn't purchased yet",
    emailCount: 5,
    status: "not_configured",
    enrolledCount: 0,
    nextSequences: ["product_launch"],
    position: "main",
  },
  {
    id: "product_launch",
    name: "Product Launch",
    description: "Announce & sell new products",
    icon: TrendingUp,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    triggerDescription: "You launch a new product",
    emailCount: 4,
    status: "not_configured",
    enrolledCount: 0,
    nextSequences: ["buyer"],
    position: "main",
  },
  {
    id: "reengagement",
    name: "Re-engagement",
    description: "Bring back inactive subscribers",
    icon: Clock,
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
    triggerDescription: "Subscriber inactive 14+ days",
    emailCount: 3,
    status: "not_configured",
    enrolledCount: 0,
    nextSequences: ["winback"],
    position: "recovery",
  },
  {
    id: "winback",
    name: "Win-back",
    description: "Last attempt for churned subscribers",
    icon: UserX,
    color: "text-red-600",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    triggerDescription: "Subscriber inactive 60+ days",
    emailCount: 3,
    status: "not_configured",
    enrolledCount: 0,
    nextSequences: [],
    position: "recovery",
  },
];

function StatusBadge({ status }: { status: SequenceNode["status"] }) {
  const config = {
    active: { label: "Active", variant: "default" as const, icon: CheckCircle2, className: "bg-green-500" },
    paused: { label: "Paused", variant: "secondary" as const, icon: Pause, className: "" },
    draft: { label: "Draft", variant: "outline" as const, icon: Settings, className: "" },
    not_configured: { label: "Not Set Up", variant: "outline" as const, icon: AlertCircle, className: "text-muted-foreground" },
  };

  const { label, variant, icon: Icon, className } = config[status];

  return (
    <Badge variant={variant} className={cn("gap-1", className)}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

function SequenceCard({
  node,
  onClick,
  showArrow = true,
}: {
  node: SequenceNode;
  onClick?: () => void;
  showArrow?: boolean;
}) {
  const Icon = node.icon;

  return (
    <div className="relative">
      <Card
        className={cn(
          "cursor-pointer transition-all hover:shadow-md border-2",
          node.status === "active" && "border-green-500/50",
          node.status === "not_configured" && "border-dashed opacity-75 hover:opacity-100"
        )}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={cn("p-2 rounded-lg", node.bgColor)}>
              <Icon className={cn("h-5 w-5", node.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-sm truncate">{node.name}</h3>
                <StatusBadge status={node.status} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{node.description}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {node.emailCount} emails
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {node.enrolledCount} enrolled
                </span>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs">
              <span className="text-muted-foreground">Trigger: </span>
              <span className="font-medium">{node.triggerDescription}</span>
            </p>
          </div>
        </CardContent>
      </Card>
      {showArrow && node.nextSequences.length > 0 && (
        <div className="flex justify-center py-2">
          <ArrowDown className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

export function EmailFunnelOverview({ storeId }: EmailFunnelOverviewProps) {
  const router = useRouter();

  // Get workflows to check which sequences are configured
  const workflows = useQuery(api.emailWorkflows.listWorkflows, { storeId });

  // Get stats
  const contactStats = useQuery(api.emailContacts.getContactStats, { storeId });

  // Separate sequences by position
  const mainFlow = sequenceNodes.filter(n => n.position === "main");
  const branchFlow = sequenceNodes.filter(n => n.position === "branch");
  const recoveryFlow = sequenceNodes.filter(n => n.position === "recovery");

  // Navigate to workflow editor with sequence type pre-selected
  const handleSequenceClick = (sequenceId: SequenceType) => {
    router.push(`/dashboard/emails/sequences?type=${sequenceId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <Workflow className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{sequenceNodes.filter(n => n.status === "active").length}/{sequenceNodes.length}</p>
                <p className="text-xs text-muted-foreground">Sequences Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/30">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{contactStats?.total || 0}</p>
                <p className="text-xs text-muted-foreground">Total Contacts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/30">
                <Mail className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{sequenceNodes.reduce((acc, n) => acc + n.emailCount, 0)}</p>
                <p className="text-xs text-muted-foreground">Total Emails</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{sequenceNodes.reduce((acc, n) => acc + n.enrolledCount, 0)}</p>
                <p className="text-xs text-muted-foreground">Currently Enrolled</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Setup CTA if nothing configured */}
      {sequenceNodes.every(n => n.status === "not_configured") && (
        <Card className="border-dashed bg-muted/30">
          <CardContent className="py-8 text-center">
            <Workflow className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Set Up Your Email Automations</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              Create automated email sequences that guide users through your funnel -
              from new signup to successful creator.
            </p>
            <Button asChild>
              <Link href="/dashboard/emails/sequences/new">
                <Plus className="h-4 w-4 mr-2" />
                Create First Sequence
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Funnel Visualization */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Flow */}
        <div className="lg:col-span-2 space-y-2">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-semibold">Main Journey</h3>
            <Badge variant="outline" className="text-xs">Core funnel</Badge>
          </div>

          {/* Entry point */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 mb-2">
            <UserPlus className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">New User Signs Up</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
          </div>

          <div className="space-y-2">
            {mainFlow.map((node, index) => (
              <SequenceCard
                key={node.id}
                node={node}
                showArrow={index < mainFlow.length - 1}
                onClick={() => handleSequenceClick(node.id)}
              />
            ))}
          </div>

          {/* Branch paths */}
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-semibold">Branch Sequences</h3>
              <Badge variant="outline" className="text-xs">Triggered by actions</Badge>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {branchFlow.map((node) => (
                <SequenceCard
                  key={node.id}
                  node={node}
                  showArrow={false}
                  onClick={() => handleSequenceClick(node.id)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Recovery Flow */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-semibold">Recovery Sequences</h3>
            <Badge variant="outline" className="text-xs">Re-engage inactive</Badge>
          </div>

          <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900 mb-4">
            <p className="text-xs text-orange-700 dark:text-orange-400">
              These run in the background to catch users who become inactive.
            </p>
          </div>

          {recoveryFlow.map((node, index) => (
            <SequenceCard
              key={node.id}
              node={node}
              showArrow={index < recoveryFlow.length - 1}
              onClick={() => handleSequenceClick(node.id)}
            />
          ))}

          {/* Help Card */}
          <Card className="mt-6 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20 border-cyan-200 dark:border-cyan-900">
            <CardContent className="p-4">
              <h4 className="font-semibold text-sm mb-2">How It Works</h4>
              <ul className="text-xs space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 mt-0.5 text-green-600 shrink-0" />
                  <span>Users automatically enter sequences based on their actions</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 mt-0.5 text-green-600 shrink-0" />
                  <span>Higher priority sequences override lower ones</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 mt-0.5 text-green-600 shrink-0" />
                  <span>Recovery sequences run independently in background</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 pt-4 border-t">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/emails/sequences">
            <Settings className="h-4 w-4 mr-2" />
            Manage All Sequences
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/emails/workflows?mode=create">
            <Plus className="h-4 w-4 mr-2" />
            Create Custom Workflow
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/emails/templates">
            <Mail className="h-4 w-4 mr-2" />
            Email Templates
          </Link>
        </Button>
      </div>
    </div>
  );
}

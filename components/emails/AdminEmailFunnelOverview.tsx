"use client";

import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Globe,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Platform-wide sequence types
type SequenceType =
  | "welcome"
  | "new_learner"
  | "course_progress"
  | "course_complete"
  | "learner_to_creator"
  | "new_creator"
  | "creator_success"
  | "platform_reengagement"
  | "platform_winback";

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
  sentCount: number;
  openRate: number;
  position: "main" | "branch" | "recovery";
}

// Platform-level sequences
const platformSequences: SequenceNode[] = [
  {
    id: "welcome",
    name: "Platform Welcome",
    description: "Welcome new users to PPR Academy",
    icon: UserPlus,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    triggerDescription: "New user signup",
    emailCount: 3,
    status: "not_configured",
    enrolledCount: 0,
    sentCount: 0,
    openRate: 0,
    position: "main",
  },
  {
    id: "new_learner",
    name: "New Learner Journey",
    description: "Onboard new course enrollees",
    icon: GraduationCap,
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    triggerDescription: "First course enrollment",
    emailCount: 4,
    status: "not_configured",
    enrolledCount: 0,
    sentCount: 0,
    openRate: 0,
    position: "main",
  },
  {
    id: "course_progress",
    name: "Course Progress",
    description: "Celebrate milestones & encourage completion",
    icon: TrendingUp,
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    triggerDescription: "Module/lesson completion",
    emailCount: 5,
    status: "not_configured",
    enrolledCount: 0,
    sentCount: 0,
    openRate: 0,
    position: "branch",
  },
  {
    id: "course_complete",
    name: "Course Completion",
    description: "Celebrate completion & suggest next steps",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    triggerDescription: "Course completed",
    emailCount: 2,
    status: "not_configured",
    enrolledCount: 0,
    sentCount: 0,
    openRate: 0,
    position: "main",
  },
  {
    id: "learner_to_creator",
    name: "Learner → Creator",
    description: "Convert learners into creators",
    icon: Sparkles,
    color: "text-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    triggerDescription: "Qualified learner + no store",
    emailCount: 5,
    status: "not_configured",
    enrolledCount: 0,
    sentCount: 0,
    openRate: 0,
    position: "main",
  },
  {
    id: "new_creator",
    name: "New Creator Onboarding",
    description: "Help new creators succeed",
    icon: Store,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/30",
    triggerDescription: "Store created",
    emailCount: 5,
    status: "not_configured",
    enrolledCount: 0,
    sentCount: 0,
    openRate: 0,
    position: "main",
  },
  {
    id: "creator_success",
    name: "Creator Success",
    description: "Celebrate sales & encourage growth",
    icon: TrendingUp,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    triggerDescription: "First sale made",
    emailCount: 3,
    status: "not_configured",
    enrolledCount: 0,
    sentCount: 0,
    openRate: 0,
    position: "branch",
  },
  {
    id: "platform_reengagement",
    name: "Platform Re-engagement",
    description: "Bring back inactive users",
    icon: Clock,
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
    triggerDescription: "14+ days inactive",
    emailCount: 3,
    status: "not_configured",
    enrolledCount: 0,
    sentCount: 0,
    openRate: 0,
    position: "recovery",
  },
  {
    id: "platform_winback",
    name: "Platform Win-back",
    description: "Last attempt for churned users",
    icon: UserX,
    color: "text-red-600",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    triggerDescription: "60+ days inactive",
    emailCount: 3,
    status: "not_configured",
    enrolledCount: 0,
    sentCount: 0,
    openRate: 0,
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
                {node.status === "active" && (
                  <>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {node.enrolledCount.toLocaleString()} enrolled
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {node.openRate}% opens
                    </span>
                  </>
                )}
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
      {showArrow && (
        <div className="flex justify-center py-2">
          <ArrowDown className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

export function AdminEmailFunnelOverview() {
  const router = useRouter();

  // Get admin workflows to check which sequences are configured
  const adminWorkflows = useQuery(api.emailWorkflows.listAdminWorkflows, {});

  // Get platform-wide stats
  const platformOverview = useQuery(api.adminEmailMonitoring.getPlatformOverview, {});

  // Separate sequences by position
  const mainFlow = platformSequences.filter(n => n.position === "main");
  const branchFlow = platformSequences.filter(n => n.position === "branch");
  const recoveryFlow = platformSequences.filter(n => n.position === "recovery");

  const activeCount = platformSequences.filter(n => n.status === "active").length;
  const totalEmails = platformSequences.reduce((acc, n) => acc + n.emailCount, 0);

  // Navigate directly to workflow builder with sequence template loaded
  const handleSequenceClick = (sequenceId: SequenceType) => {
    router.push(`/admin/emails/workflows?sequence=${sequenceId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-600" />
            Platform Email Funnel
          </h2>
          <p className="text-sm text-muted-foreground">
            Automated sequences for the entire platform user journey
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/emails/workflows">
            <Settings className="h-4 w-4 mr-2" />
            Manage Workflows
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <Workflow className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCount}/{platformSequences.length}</p>
                <p className="text-xs text-muted-foreground">Sequences Active</p>
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
                <p className="text-2xl font-bold">{totalEmails}</p>
                <p className="text-xs text-muted-foreground">Total Emails</p>
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
                <p className="text-2xl font-bold">{platformOverview?.trend?.sent?.toLocaleString() || 0}</p>
                <p className="text-xs text-muted-foreground">Emails Sent (7d)</p>
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
                <p className="text-2xl font-bold">{platformOverview?.trend?.openRate?.toFixed(1) || 0}%</p>
                <p className="text-xs text-muted-foreground">Avg Open Rate (7d)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Setup CTA if nothing configured */}
      {activeCount === 0 && (
        <Card className="border-dashed bg-muted/30">
          <CardContent className="py-8 text-center">
            <Workflow className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Set Up Platform Automations</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              Configure automated email sequences that guide users through their journey -
              from signup to becoming successful creators.
            </p>
            <Button asChild>
              <Link href="/admin/emails/workflows">
                <Plus className="h-4 w-4 mr-2" />
                Configure Sequences
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
            <h3 className="font-semibold">User Journey</h3>
            <Badge variant="outline" className="text-xs">Core funnel</Badge>
          </div>

          {/* Entry point */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 mb-2">
            <UserPlus className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">User Signs Up to PPR Academy</span>
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
              <h3 className="font-semibold">Action-Based Sequences</h3>
              <Badge variant="outline" className="text-xs">Triggered by behavior</Badge>
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
              These run automatically to re-engage users who become inactive.
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

          {/* Quick Actions */}
          <Card className="mt-6 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20 border-cyan-200 dark:border-cyan-900">
            <CardContent className="p-4">
              <h4 className="font-semibold text-sm mb-2">Quick Actions</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Set up automated sequences or create new workflows.
              </p>
              <div className="flex flex-col gap-2">
                <Button variant="outline" size="sm" className="justify-start" asChild>
                  <Link href="/admin/emails?tab=workflows">
                    <Settings className="h-3 w-3 mr-2" />
                    Manage Workflows
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="justify-start" asChild>
                  <Link href="/admin/emails?tab=templates">
                    <Mail className="h-3 w-3 mr-2" />
                    Email Templates
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

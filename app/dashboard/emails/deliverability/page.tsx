"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Mail,
  Ban,
  AlertOctagon,
  UserX,
  Clock,
  RefreshCw,
  Trash2,
  ExternalLink,
  HelpCircle,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// Health score component
function HealthScoreGauge({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    if (score >= 40) return "text-orange-500";
    return "text-red-500";
  };

  const getLabel = () => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Poor";
  };

  const getBgColor = () => {
    if (score >= 80) return "bg-green-500/10";
    if (score >= 60) return "bg-yellow-500/10";
    if (score >= 40) return "bg-orange-500/10";
    return "bg-red-500/10";
  };

  return (
    <div className={cn("flex flex-col items-center justify-center rounded-xl p-6", getBgColor())}>
      <div className={cn("text-5xl font-bold", getColor())}>{score}</div>
      <div className="mt-1 text-sm font-medium text-muted-foreground">out of 100</div>
      <Badge variant="outline" className={cn("mt-2", getColor())}>
        {getLabel()}
      </Badge>
    </div>
  );
}

// Event type badge
function EventTypeBadge({ type }: { type: string }) {
  const config: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    hard_bounce: {
      label: "Hard Bounce",
      color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      icon: <XCircle className="h-3 w-3" />,
    },
    soft_bounce: {
      label: "Soft Bounce",
      color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
      icon: <AlertTriangle className="h-3 w-3" />,
    },
    spam_complaint: {
      label: "Spam Complaint",
      color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      icon: <AlertOctagon className="h-3 w-3" />,
    },
    blocked: {
      label: "Blocked",
      color: "bg-zinc-100 text-zinc-700 dark:bg-zinc-900/30 dark:text-zinc-400",
      icon: <Ban className="h-3 w-3" />,
    },
    unsubscribe: {
      label: "Unsubscribe",
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      icon: <UserX className="h-3 w-3" />,
    },
    delivery_delay: {
      label: "Delayed",
      color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      icon: <Clock className="h-3 w-3" />,
    },
  };

  const { label, color, icon } = config[type] || {
    label: type,
    color: "bg-zinc-100 text-zinc-700",
    icon: <Mail className="h-3 w-3" />,
  };

  return (
    <Badge variant="secondary" className={cn("gap-1", color)}>
      {icon}
      {label}
    </Badge>
  );
}

export default function DeliverabilityPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const { user, isLoaded } = useUser();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("overview");
  const [eventTypeFilter, setEventTypeFilter] = useState<string | null>(null);
  const [trendPeriod, setTrendPeriod] = useState<"daily" | "weekly" | "monthly">("daily");

  const storeId = user?.id ?? "";

  // Queries
  const health = useQuery(
    api.emailDeliverability.getDeliverabilityHealth,
    storeId ? { storeId } : "skip"
  );

  const events = useQuery(
    api.emailDeliverability.getDeliverabilityEvents,
    storeId
      ? {
          storeId,
          limit: 50,
          ...(eventTypeFilter ? { eventType: eventTypeFilter as any } : {}),
        }
      : "skip"
  );

  const trends = useQuery(
    api.emailDeliverability.getDeliverabilityTrends,
    storeId ? { storeId, period: trendPeriod, limit: 30 } : "skip"
  );

  const bouncesByDomain = useQuery(
    api.emailDeliverability.getBounceRateByDomain,
    storeId ? { storeId } : "skip"
  );

  const problematicContacts = useQuery(
    api.emailDeliverability.getProblematicContacts,
    storeId ? { storeId, limit: 25 } : "skip"
  );

  const cleanBounced = useMutation(api.emailDeliverability.cleanBouncedContacts);

  if (isLoaded && mode !== "create") {
    router.push("/dashboard?mode=create");
    return null;
  }

  const handleCleanBounced = async (hardOnly: boolean) => {
    try {
      const result = await cleanBounced({
        storeId,
        hardBouncesOnly: hardOnly,
      });
      toast({
        title: "List cleaned",
        description: `${result.cleanedCount} contacts marked as bounced`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clean bounced contacts",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 md:space-y-6 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/emails?mode=create")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold md:text-2xl">
              <Shield className="h-5 w-5 text-cyan-600 md:h-6 md:w-6" />
              Deliverability Health
            </h1>
            <p className="mt-1 text-xs text-muted-foreground md:text-sm">
              Monitor bounces, spam complaints, and sender reputation
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="domains">Domains</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Health Score */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Health Score</CardTitle>
              </CardHeader>
              <CardContent>
                <HealthScoreGauge score={health?.healthScore || 0} />
              </CardContent>
            </Card>

            {/* Event Summary */}
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Last 30 Days</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-2xl font-bold text-red-500">
                      <XCircle className="h-5 w-5" />
                      {health?.eventCounts.hardBounces || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Hard Bounces</div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-2xl font-bold text-orange-500">
                      <AlertTriangle className="h-5 w-5" />
                      {health?.eventCounts.softBounces || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Soft Bounces</div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-2xl font-bold text-purple-500">
                      <AlertOctagon className="h-5 w-5" />
                      {health?.eventCounts.spamComplaints || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Spam Complaints</div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-2xl font-bold text-zinc-500">
                      <Ban className="h-5 w-5" />
                      {health?.eventCounts.blocks || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Blocks</div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-2xl font-bold text-blue-500">
                      <UserX className="h-5 w-5" />
                      {health?.eventCounts.unsubscribes || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Unsubscribes</div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-2xl font-bold text-yellow-500">
                      <Clock className="h-5 w-5" />
                      {health?.eventCounts.deliveryDelays || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Delays</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          {health?.recommendations && health.recommendations.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {health.recommendations.map((rec: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCleanBounced(true)}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Clean Hard Bounces
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCleanBounced(false)}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Clean All Bounces
                </Button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <HelpCircle className="h-4 w-4" />
                        Learn More
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>
                        Hard bounces are permanent delivery failures. Soft bounces are temporary.
                        Cleaning bounces marks those contacts so they won't receive future emails.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Recent Events</CardTitle>
                <Select
                  value={eventTypeFilter || "all"}
                  onValueChange={(v) => setEventTypeFilter(v === "all" ? null : v)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    <SelectItem value="hard_bounce">Hard Bounces</SelectItem>
                    <SelectItem value="soft_bounce">Soft Bounces</SelectItem>
                    <SelectItem value="spam_complaint">Spam Complaints</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                    <SelectItem value="unsubscribe">Unsubscribes</SelectItem>
                    <SelectItem value="delivery_delay">Delays</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {!events || events.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-green-500" />
                  No deliverability events recorded
                </div>
              ) : (
                <div className="space-y-2">
                  {events.map((event: any) => (
                    <div
                      key={event._id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <EventTypeBadge type={event.eventType} />
                        <div>
                          <div className="text-sm font-medium">{event.email}</div>
                          {event.reason && (
                            <div className="text-xs text-muted-foreground">{event.reason}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(event.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Domains Tab */}
        <TabsContent value="domains" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Bounce Rate by Recipient Domain</CardTitle>
              <CardDescription>
                Domains with the most bounces in the last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!bouncesByDomain || bouncesByDomain.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-green-500" />
                  No bounces recorded by domain
                </div>
              ) : (
                <div className="space-y-2">
                  {bouncesByDomain.map((domain: { domain: string; total: number; hard: number; soft: number }) => (
                    <div
                      key={domain.domain}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div className="font-medium">{domain.domain}</div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-red-500">
                          <XCircle className="h-3 w-3" />
                          {domain.hard} hard
                        </div>
                        <div className="flex items-center gap-1 text-orange-500">
                          <AlertTriangle className="h-3 w-3" />
                          {domain.soft} soft
                        </div>
                        <div className="text-muted-foreground">{domain.total} total</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Problematic Contacts</CardTitle>
              <CardDescription>
                Contacts with delivery issues that may need attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!problematicContacts || problematicContacts.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-green-500" />
                  No problematic contacts found
                </div>
              ) : (
                <div className="space-y-2">
                  {problematicContacts.map((contact: any) => (
                    <div
                      key={contact.email}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="text-sm font-medium">{contact.email}</div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {contact.issueCount} issue{contact.issueCount !== 1 ? "s" : ""}
                            {contact.hasHardBounce && (
                              <Badge
                                variant="secondary"
                                className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              >
                                Hard Bounce
                              </Badge>
                            )}
                            {contact.hasSpamComplaint && (
                              <Badge
                                variant="secondary"
                                className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                              >
                                Spam Complaint
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      {contact.lastEvent && (
                        <div className="text-xs text-muted-foreground">
                          Last: {new Date(contact.lastEvent.timestamp).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

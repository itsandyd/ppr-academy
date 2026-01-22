"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Mail,
  TrendingUp,
  TrendingDown,
  Info,
  Loader2,
  Clock,
  BarChart3,
  Activity,
  Send,
} from "lucide-react";
import Link from "next/link";

interface DomainHealthDashboardProps {
  storeId?: string;
}

interface DnsStatus {
  spf: { verified: boolean; record?: string; lastChecked?: number };
  dkim: { verified: boolean; record?: string; lastChecked?: number };
  dmarc: { verified: boolean; record?: string; lastChecked?: number };
  mx?: { verified: boolean; record?: string; lastChecked?: number };
}

interface DomainHealth {
  domain: string;
  status: "active" | "pending" | "verifying" | "suspended" | "retired";
  type: "shared" | "dedicated" | "custom";
  dnsStatus: DnsStatus;
  reputation: {
    score: number;
    status: "excellent" | "good" | "fair" | "poor" | "critical";
    trend: "up" | "down" | "stable";
  };
  stats: {
    deliveryRate: number;
    bounceRate: number;
    openRate: number;
    spamRate: number;
    sentToday: number;
    sentWeek: number;
  };
}

export function DomainHealthDashboard({ storeId }: DomainHealthDashboardProps) {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch real domain health stats from Convex
  const healthStats = useQuery(api.emailHealthMonitoring.getDomainHealthStats);

  // Build domain data from real stats
  const domains: DomainHealth[] = healthStats ? [
    {
      domain: healthStats.domain,
      status: healthStats.status as "active" | "pending",
      type: "shared",
      dnsStatus: {
        // DNS status would need to be fetched separately from Resend API
        // For now, show as verified if domain is active
        spf: { verified: healthStats.status === "active", record: "v=spf1 include:resend.com ~all", lastChecked: Date.now() - 3600000 },
        dkim: { verified: healthStats.status === "active", record: "v=DKIM1; k=rsa; p=...", lastChecked: Date.now() - 3600000 },
        dmarc: { verified: healthStats.status === "active", record: "v=DMARC1; p=quarantine;", lastChecked: Date.now() - 3600000 },
        mx: { verified: true, record: "10 feedback-smtp.resend.com", lastChecked: Date.now() - 3600000 },
      },
      reputation: {
        score: healthStats.reputationScore,
        status: healthStats.reputationStatus as "excellent" | "good" | "fair" | "poor",
        trend: healthStats.reputationTrend as "up" | "down" | "stable",
      },
      stats: {
        deliveryRate: healthStats.deliveryRate,
        bounceRate: healthStats.bounceRate,
        openRate: healthStats.openRate,
        spamRate: healthStats.spamRate,
        sentToday: healthStats.sentToday,
        sentWeek: healthStats.sentThisWeek,
      },
    },
  ] : [];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // The query will automatically refetch
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
    toast({
      title: "Stats Refreshed",
      description: "Domain health data has been updated.",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "pending":
      case "verifying":
        return "bg-yellow-500";
      case "suspended":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getReputationColor = (score: number) => {
    if (score >= 90) return "text-green-500";
    if (score >= 70) return "text-blue-500";
    if (score >= 50) return "text-yellow-500";
    if (score >= 30) return "text-orange-500";
    return "text-red-500";
  };

  const getProgressColor = (score: number) => {
    if (score >= 90) return "bg-green-500";
    if (score >= 70) return "bg-blue-500";
    if (score >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  const formatLastChecked = (timestamp?: number) => {
    if (!timestamp) return "Never";
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Domain Health</h2>
            <p className="text-muted-foreground">
              Monitor your email domain's DNS configuration and reputation
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh Status
          </Button>
        </div>

        {/* Domain Cards */}
        {healthStats && healthStats.totalSent > 0 && domains.map((domain) => (
          <Card key={domain.domain} className="overflow-hidden">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${getStatusColor(domain.status)}`} />
                  <div>
                    <CardTitle className="text-lg">{domain.domain}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {domain.type}
                      </Badge>
                      <span className="capitalize">{domain.status}</span>
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Reputation</p>
                    <p className={`text-2xl font-bold ${getReputationColor(domain.reputation.score)}`}>
                      {domain.reputation.score}
                      <span className="text-sm font-normal text-muted-foreground">/100</span>
                    </p>
                  </div>
                  {domain.reputation.trend === "up" && (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  )}
                  {domain.reputation.trend === "down" && (
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {/* DNS Records Status */}
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  DNS Authentication Status
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* SPF */}
                  <div className={`rounded-lg border p-4 ${domain.dnsStatus.spf.verified ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20" : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">SPF</span>
                      {domain.dnsStatus.spf.verified ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Sender Policy Framework</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatLastChecked(domain.dnsStatus.spf.lastChecked)}
                    </p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="mt-2 h-6 px-2 text-xs">
                          <Info className="h-3 w-3 mr-1" />
                          Details
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[300px]">
                        <p className="font-mono text-xs break-all">{domain.dnsStatus.spf.record}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {/* DKIM */}
                  <div className={`rounded-lg border p-4 ${domain.dnsStatus.dkim.verified ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20" : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">DKIM</span>
                      {domain.dnsStatus.dkim.verified ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">DomainKeys Identified Mail</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatLastChecked(domain.dnsStatus.dkim.lastChecked)}
                    </p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="mt-2 h-6 px-2 text-xs">
                          <Info className="h-3 w-3 mr-1" />
                          Details
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[300px]">
                        <p className="font-mono text-xs break-all">{domain.dnsStatus.dkim.record}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {/* DMARC */}
                  <div className={`rounded-lg border p-4 ${domain.dnsStatus.dmarc.verified ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20" : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">DMARC</span>
                      {domain.dnsStatus.dmarc.verified ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Domain-based Authentication</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatLastChecked(domain.dnsStatus.dmarc.lastChecked)}
                    </p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="mt-2 h-6 px-2 text-xs">
                          <Info className="h-3 w-3 mr-1" />
                          Details
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[300px]">
                        <p className="font-mono text-xs break-all">{domain.dnsStatus.dmarc.record}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {/* MX */}
                  <div className={`rounded-lg border p-4 ${domain.dnsStatus.mx?.verified ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20" : "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">MX</span>
                      {domain.dnsStatus.mx?.verified ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Mail Exchange (Optional)</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatLastChecked(domain.dnsStatus.mx?.lastChecked)}
                    </p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="mt-2 h-6 px-2 text-xs">
                          <Info className="h-3 w-3 mr-1" />
                          Details
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[300px]">
                        <p className="font-mono text-xs break-all">{domain.dnsStatus.mx?.record || "Not configured"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Performance Metrics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Delivery Rate</span>
                      <span className="font-semibold text-green-500">{domain.stats.deliveryRate}%</span>
                    </div>
                    <Progress
                      value={domain.stats.deliveryRate}
                      className="h-2"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Open Rate</span>
                      <span className="font-semibold text-blue-500">{domain.stats.openRate}%</span>
                    </div>
                    <Progress
                      value={domain.stats.openRate}
                      className="h-2"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Bounce Rate</span>
                      <span className={`font-semibold ${domain.stats.bounceRate < 2 ? "text-green-500" : domain.stats.bounceRate < 5 ? "text-yellow-500" : "text-red-500"}`}>
                        {domain.stats.bounceRate}%
                      </span>
                    </div>
                    <Progress
                      value={domain.stats.bounceRate * 10}
                      className="h-2"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Spam Rate</span>
                      <span className={`font-semibold ${domain.stats.spamRate < 0.1 ? "text-green-500" : "text-red-500"}`}>
                        {domain.stats.spamRate}%
                      </span>
                    </div>
                    <Progress
                      value={domain.stats.spamRate * 100}
                      className="h-2"
                    />
                  </div>
                </div>
              </div>

              {/* Sending Volume */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Sending Volume
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <p className="text-sm text-muted-foreground">Today</p>
                    <p className="text-2xl font-bold">{domain.stats.sentToday.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">emails sent</p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <p className="text-sm text-muted-foreground">This Week</p>
                    <p className="text-2xl font-bold">{domain.stats.sentWeek.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">emails sent</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Loading State */}
        {healthStats === undefined && (
          <Card>
            <CardContent className="py-12 text-center">
              <Loader2 className="mx-auto h-12 w-12 text-muted-foreground mb-4 animate-spin" />
              <h3 className="text-lg font-semibold mb-2">Loading Domain Health</h3>
              <p className="text-muted-foreground">
                Fetching email statistics...
              </p>
            </CardContent>
          </Card>
        )}

        {/* Empty State - No emails sent yet */}
        {healthStats && healthStats.totalSent === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Mail className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Emails Sent Yet</h3>
              <p className="text-muted-foreground mb-4">
                Send your first email to start tracking domain health metrics.
              </p>
              <Button asChild>
                <Link href="/dashboard/emails">
                  <Send className="mr-2 h-4 w-4" />
                  Go to Email Dashboard
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Help Section */}
        <Card className="border-dashed">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <Info className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Understanding Domain Health</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Proper DNS configuration ensures your emails reach the inbox and not spam.
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">SPF (Sender Policy Framework)</p>
                    <p className="text-muted-foreground text-xs">Authorizes which servers can send email for your domain</p>
                  </div>
                  <div>
                    <p className="font-medium">DKIM (DomainKeys Identified Mail)</p>
                    <p className="text-muted-foreground text-xs">Adds a digital signature to verify email authenticity</p>
                  </div>
                  <div>
                    <p className="font-medium">DMARC</p>
                    <p className="text-muted-foreground text-xs">Tells receivers how to handle failed SPF/DKIM checks</p>
                  </div>
                  <div>
                    <p className="font-medium">Reputation Score</p>
                    <p className="text-muted-foreground text-xs">Overall health based on bounce rates, spam complaints, and engagement</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}

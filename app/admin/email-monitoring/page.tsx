"use client";

import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Mail,
  Server,
  Users,
  AlertTriangle,
  BarChart3,
  Activity,
  RefreshCw,
  Plus,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function AdminEmailMonitoringPage() {
  const { toast } = useToast();
  const [selectedDomainId, setSelectedDomainId] = useState<Id<"emailDomains"> | null>(null);
  const [isAddDomainOpen, setIsAddDomainOpen] = useState(false);
  const [newDomainName, setNewDomainName] = useState("");
  const [newDomainType, setNewDomainType] = useState<"shared" | "dedicated" | "custom">("shared");
  const [isAdding, setIsAdding] = useState(false);

  // Fetch data
  const overview = useQuery(api.adminEmailMonitoring?.getPlatformOverview);
  const domains = useQuery(api.adminEmailMonitoring?.listEmailDomains);
  const flaggedCreators = useQuery(api.adminEmailMonitoring?.getFlaggedCreators);
  const domainDetails = useQuery(
    api.adminEmailMonitoring?.getDomainDetails,
    selectedDomainId ? { domainId: selectedDomainId } : "skip"
  );

  // Mutations
  const addDomain = useMutation(api.adminEmailMonitoring?.addEmailDomain);
  const updateDomainStatus = useMutation(api.adminEmailMonitoring?.updateDomainStatus);
  const resolveAlert = useMutation(api.adminEmailMonitoring?.resolveAlert);
  const deleteDomain = useMutation(api.adminEmailMonitoring?.deleteEmailDomain);

  // Actions
  const syncDomainsFromResend = useAction(api.resendDomainSync?.syncDomainsFromResend);
  const verifyDomain = useAction(api.resendDomainSync?.verifyDomainInResend);

  const handleAddDomain = async () => {
    if (!newDomainName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a domain name",
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);
    try {
      const domainId = await addDomain({
        domain: newDomainName,
        type: newDomainType,
      });

      toast({
        title: "Domain Added!",
        description: `${newDomainName} has been added. Configure DNS to verify.`,
      });

      setIsAddDomainOpen(false);
      setNewDomainName("");
      setNewDomainType("shared");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add domain",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      excellent: { color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle2 },
      good: { color: "bg-blue-100 text-blue-800 border-blue-200", icon: CheckCircle2 },
      fair: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: AlertTriangle },
      poor: { color: "bg-orange-100 text-orange-800 border-orange-200", icon: AlertCircle },
      critical: { color: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
    };

    const variant = variants[status as keyof typeof variants] || variants.fair;
    const Icon = variant.icon;

    return (
      <Badge className={variant.color}>
        <Icon className="mr-1 h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatPercent = (num: number) => {
    return `${num.toFixed(2)}%`;
  };

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Monitoring Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of email domains, deliverability, and creator health
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                const result = await syncDomainsFromResend();
                toast({
                  title: "Sync Complete!",
                  description: `Synced ${result.synced} domains. Added ${result.added}, Updated ${result.updated}`,
                });
              } catch (error) {
                toast({
                  title: "Sync Failed",
                  description: error instanceof Error ? error.message : "Failed to sync domains",
                  variant: "destructive",
                });
              }
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync from Resend
          </Button>
          <Button size="sm" onClick={() => setIsAddDomainOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Domain
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      {overview && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Today's Volume */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Emails Sent Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold">{formatNumber(overview.today.sent)}</div>
                <Badge variant="outline" className="text-xs">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  {formatNumber(overview.trend.sent)} (7d)
                </Badge>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {formatNumber(overview.today.delivered)} delivered
              </div>
            </CardContent>
          </Card>

          {/* Delivery Rate */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Delivery Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <div
                  className={`text-2xl font-bold ${overview.today.deliveryRate >= 95 ? "text-green-600" : overview.today.deliveryRate >= 90 ? "text-yellow-600" : "text-red-600"}`}
                >
                  {formatPercent(overview.today.deliveryRate)}
                </div>
                <Badge
                  variant={overview.today.deliveryRate >= 95 ? "default" : "destructive"}
                  className="text-xs"
                >
                  {overview.today.deliveryRate >= 95
                    ? "Excellent"
                    : overview.today.deliveryRate >= 90
                      ? "Good"
                      : "Poor"}
                </Badge>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                7d avg: {formatPercent(overview.trend.deliveryRate)}
              </div>
            </CardContent>
          </Card>

          {/* Bounce Rate */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Bounce Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <div
                  className={`text-2xl font-bold ${overview.today.bounceRate < 2 ? "text-green-600" : overview.today.bounceRate < 5 ? "text-yellow-600" : "text-red-600"}`}
                >
                  {formatPercent(overview.today.bounceRate)}
                </div>
                {overview.today.bounceRate >= 5 && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    Critical
                  </Badge>
                )}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {formatNumber(overview.today.bounced)} bounces
              </div>
            </CardContent>
          </Card>

          {/* Open Rate */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Open Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold">{formatPercent(overview.today.openRate)}</div>
                <Badge variant="outline" className="text-xs">
                  7d: {formatPercent(overview.trend.openRate)}
                </Badge>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {formatNumber(overview.today.opened)} opens
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Platform Health */}
      {overview && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Server className="h-4 w-4" />
                Domains
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Active:</span>
                  <span className="font-medium">{overview.domains.active}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Warning:</span>
                  <span className="font-medium text-yellow-600">{overview.domains.warning}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Suspended:</span>
                  <span className="font-medium text-red-600">{overview.domains.suspended}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Users className="h-4 w-4" />
                Creators
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Active:</span>
                  <span className="font-medium">{overview.creators.active}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Flagged:</span>
                  <span className="font-medium text-red-600">{overview.creators.flagged}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total:</span>
                  <span className="font-medium">{overview.creators.total}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <AlertTriangle className="h-4 w-4" />
                Active Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{overview.alerts}</div>
              {overview.alerts > 0 && (
                <Button variant="link" className="mt-2 h-auto px-0 text-xs">
                  View all alerts →
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="domains" className="space-y-4">
        <TabsList>
          <TabsTrigger value="domains">
            <Server className="mr-2 h-4 w-4" />
            Domains ({domains?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="creators">
            <Users className="mr-2 h-4 w-4" />
            Flagged Creators ({flaggedCreators?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="mr-2 h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="mr-2 h-4 w-4" />
            Live Activity
          </TabsTrigger>
        </TabsList>

        {/* Domains Tab */}
        <TabsContent value="domains" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Sending Domains</CardTitle>
              <CardDescription>
                Monitor all email sending domains and their health status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {domains && domains.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Domain</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reputation</TableHead>
                      <TableHead className="text-right">Today's Sent</TableHead>
                      <TableHead className="text-right">Bounce Rate</TableHead>
                      <TableHead className="text-right">Spam Rate</TableHead>
                      <TableHead className="text-right">Alerts</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {domains.map((domain) => (
                      <TableRow key={domain._id}>
                        <TableCell className="font-medium">
                          <Button
                            variant="link"
                            className="h-auto px-0"
                            onClick={() => setSelectedDomainId(domain._id)}
                          >
                            {domain.domain}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{domain.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={domain.status === "active" ? "success" : "secondary"}>
                            {domain.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(domain.reputation.status)}
                          <span className="ml-2 text-sm text-muted-foreground">
                            {domain.reputation.score}/100
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {domain.todayStats ? formatNumber(domain.todayStats.sent) : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {domain.todayStats ? (
                            <span
                              className={
                                domain.todayStats.bounceRate < 2
                                  ? "text-green-600"
                                  : domain.todayStats.bounceRate < 5
                                    ? "text-yellow-600"
                                    : "text-red-600"
                              }
                            >
                              {formatPercent(domain.todayStats.bounceRate)}
                            </span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {domain.todayStats ? (
                            <span
                              className={
                                domain.todayStats.spamRate < 0.01
                                  ? "text-green-600"
                                  : domain.todayStats.spamRate < 0.1
                                    ? "text-yellow-600"
                                    : "text-red-600"
                              }
                            >
                              {formatPercent(domain.todayStats.spamRate)}
                            </span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {domain.alerts > 0 ? (
                            <Badge variant="destructive">{domain.alerts}</Badge>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedDomainId(domain._id);
                              // Details will show in a dialog below
                            }}
                          >
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-12 text-center">
                  <Server className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-medium">No domains configured</h3>
                  <p className="mb-4 text-muted-foreground">
                    Add your first sending domain to start monitoring
                  </p>
                  <Button onClick={() => setIsAddDomainOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Domain
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Flagged Creators Tab */}
        <TabsContent value="creators" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Flagged Creators</CardTitle>
              <CardDescription>
                Creators with high bounce rates, spam complaints, or other issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              {flaggedCreators && flaggedCreators.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Store Name</TableHead>
                      <TableHead>Domain</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Bounce Rate</TableHead>
                      <TableHead>Spam Rate</TableHead>
                      <TableHead>Reputation</TableHead>
                      <TableHead>Issues</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {flaggedCreators.map((creator) => (
                      <TableRow key={creator.storeId}>
                        <TableCell className="font-medium">{creator.storeName}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {creator.domain}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={creator.status === "suspended" ? "destructive" : "secondary"}
                          >
                            {creator.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              creator.bounceRate >= 5
                                ? "font-medium text-red-600"
                                : "text-yellow-600"
                            }
                          >
                            {formatPercent(creator.bounceRate)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              creator.spamRate >= 0.1
                                ? "font-medium text-red-600"
                                : "text-yellow-600"
                            }
                          >
                            {formatPercent(creator.spamRate)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              creator.reputationScore < 30
                                ? "text-red-600"
                                : creator.reputationScore < 50
                                  ? "text-yellow-600"
                                  : "text-green-600"
                            }
                          >
                            {creator.reputationScore}/100
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {creator.issues.map((issue, idx) => (
                              <div key={idx} className="text-xs text-red-600">
                                • {issue}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                            {creator.status !== "suspended" && (
                              <Button variant="destructive" size="sm">
                                Suspend
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-12 text-center">
                  <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-green-500" />
                  <h3 className="mb-2 text-lg font-medium">All clear!</h3>
                  <p className="text-muted-foreground">No creators currently flagged for issues</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Analytics</CardTitle>
              <CardDescription>Detailed platform-wide email performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-12 text-center text-muted-foreground">
                Charts and detailed analytics coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Live Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Live Activity Feed</CardTitle>
              <CardDescription>Real-time email events across all domains</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-12 text-center text-muted-foreground">
                Live activity feed coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Domain Details Dialog */}
      <Dialog open={!!selectedDomainId} onOpenChange={(open) => !open && setSelectedDomainId(null)}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto bg-white dark:bg-black">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle>Domain Details</DialogTitle>
                <DialogDescription>
                  Comprehensive analytics and health metrics for this domain
                </DialogDescription>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={async () => {
                  if (!selectedDomainId) return;

                  if (
                    confirm("Are you sure you want to delete this domain? This cannot be undone.")
                  ) {
                    try {
                      await deleteDomain({ domainId: selectedDomainId });
                      toast({
                        title: "Domain Deleted",
                        description: "The domain has been removed successfully",
                      });
                      setSelectedDomainId(null);
                    } catch (error) {
                      toast({
                        title: "Cannot Delete",
                        description:
                          error instanceof Error ? error.message : "Failed to delete domain",
                        variant: "destructive",
                      });
                    }
                  }
                }}
              >
                Delete Domain
              </Button>
            </div>
          </DialogHeader>

          {domainDetails && (
            <div className="space-y-6 py-4">
              {/* Domain Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Domain Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Domain:</span>
                    <span className="font-medium">{domainDetails.domain.domain}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <Badge variant="outline">{domainDetails.domain.type}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge
                      variant={domainDetails.domain.status === "active" ? "success" : "secondary"}
                    >
                      {domainDetails.domain.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reputation:</span>
                    {getStatusBadge(domainDetails.domain.reputation.status)}
                  </div>
                </CardContent>
              </Card>

              {/* Today's Stats */}
              {domainDetails.analytics.today && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Today's Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {formatNumber(domainDetails.analytics.today.totalSent)}
                        </div>
                        <div className="text-xs text-muted-foreground">Sent</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {formatPercent(domainDetails.analytics.today.deliveryRate)}
                        </div>
                        <div className="text-xs text-muted-foreground">Delivery Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {formatPercent(domainDetails.analytics.today.openRate)}
                        </div>
                        <div className="text-xs text-muted-foreground">Open Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {formatPercent(domainDetails.analytics.today.bounceRate)}
                        </div>
                        <div className="text-xs text-muted-foreground">Bounce Rate</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 30-Day Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Last 30 Days</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-xl font-bold">
                        {formatNumber(domainDetails.analytics.last30Days.totalSent)}
                      </div>
                      <div className="text-xs text-muted-foreground">Total Sent</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold">
                        {formatPercent(domainDetails.analytics.last30Days.avgDeliveryRate)}
                      </div>
                      <div className="text-xs text-muted-foreground">Avg Delivery</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold">
                        {formatPercent(domainDetails.analytics.last30Days.avgOpenRate)}
                      </div>
                      <div className="text-xs text-muted-foreground">Avg Open Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Creators */}
              {domainDetails.topCreators && domainDetails.topCreators.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Top Senders Today</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Store</TableHead>
                          <TableHead className="text-right">Sent</TableHead>
                          <TableHead className="text-right">Bounce Rate</TableHead>
                          <TableHead className="text-right">Open Rate</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {domainDetails.topCreators.map((creator) => (
                          <TableRow key={creator.storeId}>
                            <TableCell className="font-medium">{creator.storeName}</TableCell>
                            <TableCell className="text-right">
                              {formatNumber(creator.sent)}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={creator.bounceRate > 5 ? "text-red-600" : ""}>
                                {formatPercent(creator.bounceRate)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              {formatPercent(creator.openRate)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={creator.status === "active" ? "success" : "destructive"}
                              >
                                {creator.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Active Alerts */}
              {domainDetails.alerts && domainDetails.alerts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Active Alerts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {domainDetails.alerts.map((alert: any) => (
                        <div
                          key={alert._id}
                          className={`rounded-lg border p-3 ${
                            alert.severity === "critical"
                              ? "border-red-200 bg-red-50"
                              : alert.severity === "warning"
                                ? "border-yellow-200 bg-yellow-50"
                                : "border-blue-200 bg-blue-50"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-medium">{alert.message}</div>
                              {alert.details && (
                                <div className="mt-1 text-sm text-muted-foreground">
                                  {alert.details}
                                </div>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => resolveAlert({ alertId: alert._id })}
                            >
                              Resolve
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Domain Dialog */}
      <Dialog open={isAddDomainOpen} onOpenChange={setIsAddDomainOpen}>
        <DialogContent className="bg-white dark:bg-black">
          <DialogHeader>
            <DialogTitle>Add Email Domain</DialogTitle>
            <DialogDescription>
              Add a new sending domain to monitor. You'll need to configure DNS records after
              adding.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="domain">Domain Name *</Label>
              <Input
                id="domain"
                placeholder="mail.pauseplayrepeat.com"
                value={newDomainName}
                onChange={(e) => setNewDomainName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Example: mail.pauseplayrepeat.com or yourdomain.com
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Domain Type *</Label>
              <Select value={newDomainType} onValueChange={(value: any) => setNewDomainType(value)}>
                <SelectTrigger className="bg-white dark:bg-black">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-black">
                  <SelectItem value="shared">Shared (All creators use this domain)</SelectItem>
                  <SelectItem value="dedicated">Dedicated (Specific creators only)</SelectItem>
                  <SelectItem value="custom">Custom (Creator's own domain)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDomainOpen(false);
                setNewDomainName("");
                setNewDomainType("shared");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddDomain} disabled={isAdding}>
              {isAdding ? "Adding..." : "Add Domain"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Users,
  DollarSign,
  TrendingUp,
  MousePointerClick,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Package,
  UserPlus,
  Percent,
  Eye,
  MoreHorizontal,
  Ban,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Affiliate {
  _id: Id<"affiliates">;
  affiliateUserId: string;
  storeId: Id<"stores">;
  creatorId: string;
  affiliateCode: string;
  commissionRate: number;
  commissionType: string;
  status: "active" | "pending" | "suspended" | "rejected";
  totalClicks: number;
  totalSales: number;
  totalRevenue: number;
  totalCommissionEarned: number;
  totalCommissionPaid: number;
  applicationNote?: string;
  rejectionReason?: string;
  appliedAt: number;
  approvedAt?: number;
  createdAt: number;
}

export default function AffiliatesPage() {
  const { user, isLoaded } = useUser();
  const [selectedTab, setSelectedTab] = useState("all");
  const [approveDialog, setApproveDialog] = useState<Affiliate | null>(null);
  const [rejectDialog, setRejectDialog] = useState<Affiliate | null>(null);
  const [commissionRate, setCommissionRate] = useState("20");
  const [rejectionReason, setRejectionReason] = useState("");

  // Get user's store
  const store = useQuery(
    api.stores.getUserStore,
    user?.id ? { userId: user.id } : "skip"
  );

  // Get affiliates for the store
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const allAffiliates = useQuery(
    (api as any).affiliates.getAffiliatesByStore,
    store?._id ? { storeId: store._id } : "skip"
  ) as Affiliate[] | undefined;

  const approveAffiliate = useMutation((api as any).affiliates.approveAffiliate);
  const rejectAffiliate = useMutation((api as any).affiliates.rejectAffiliate);
  const suspendAffiliate = useMutation((api as any).affiliates.suspendAffiliate);
  /* eslint-enable @typescript-eslint/no-explicit-any */

  // Filter affiliates by status
  const filteredAffiliates = allAffiliates?.filter((a) => {
    if (selectedTab === "all") return true;
    return a.status === selectedTab;
  });

  // Calculate stats
  const stats = {
    totalAffiliates: allAffiliates?.filter((a) => a.status === "active").length || 0,
    pendingApplications: allAffiliates?.filter((a) => a.status === "pending").length || 0,
    totalRevenueDriven: allAffiliates?.reduce((sum, a) => sum + a.totalRevenue, 0) || 0,
    totalCommissionsPaid: allAffiliates?.reduce((sum, a) => sum + a.totalCommissionPaid, 0) || 0,
    totalClicks: allAffiliates?.reduce((sum, a) => sum + a.totalClicks, 0) || 0,
    totalSales: allAffiliates?.reduce((sum, a) => sum + a.totalSales, 0) || 0,
  };

  const handleApprove = async () => {
    if (!approveDialog) return;

    try {
      await approveAffiliate({
        affiliateId: approveDialog._id,
        commissionRate: parseInt(commissionRate),
      });
      toast.success("Affiliate approved successfully!");
      setApproveDialog(null);
      setCommissionRate("20");
    } catch (error) {
      toast.error("Failed to approve affiliate");
    }
  };

  const handleReject = async () => {
    if (!rejectDialog || !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    try {
      await rejectAffiliate({
        affiliateId: rejectDialog._id,
        reason: rejectionReason,
      });
      toast.success("Affiliate application rejected");
      setRejectDialog(null);
      setRejectionReason("");
    } catch (error) {
      toast.error("Failed to reject affiliate");
    }
  };

  const handleSuspend = async (affiliate: Affiliate) => {
    try {
      await suspendAffiliate({ affiliateId: affiliate._id });
      toast.success("Affiliate suspended");
    } catch (error) {
      toast.error("Failed to suspend affiliate");
    }
  };

  // Loading state
  if (!isLoaded || store === undefined) {
    return (
      <div className="container mx-auto max-w-6xl p-4 md:p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      </div>
    );
  }

  // No store yet
  if (!store) {
    return (
      <div className="container mx-auto max-w-6xl space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white md:text-3xl">
            Affiliate Program
          </h1>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">
            Manage your affiliate partners
          </p>
        </div>
        <Card>
          <CardContent className="flex min-h-[300px] items-center justify-center">
            <div className="text-center">
              <Package className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-700" />
              <p className="mt-4 text-zinc-500 dark:text-zinc-400">
                Set up your store to start an affiliate program
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">Active</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20">Pending</Badge>;
      case "suspended":
        return <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20">Suspended</Badge>;
      case "rejected":
        return <Badge className="bg-zinc-500/10 text-zinc-600 hover:bg-zinc-500/20">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white md:text-3xl">
            Affiliate Program
          </h1>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">
            Manage your affiliate partners and track their performance
          </p>
        </div>
        {stats.pendingApplications > 0 && (
          <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600">
            {stats.pendingApplications} pending
          </Badge>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Affiliates</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAffiliates}</div>
            <p className="text-xs text-zinc-500">
              {stats.pendingApplications} pending approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenue Generated</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenueDriven.toFixed(2)}</div>
            <p className="text-xs text-zinc-500">
              From {stats.totalSales} affiliate sales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Commissions Paid</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalCommissionsPaid.toFixed(2)}</div>
            <p className="text-xs text-zinc-500">
              Total payouts to affiliates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointerClick className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClicks}</div>
            <p className="text-xs text-zinc-500">
              {stats.totalSales > 0 && stats.totalClicks > 0
                ? `${((stats.totalSales / stats.totalClicks) * 100).toFixed(1)}% conversion`
                : "No conversions yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Affiliates List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Affiliates</CardTitle>
          <CardDescription>
            Review applications and manage your affiliate partners
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList>
              <TabsTrigger value="all">All ({allAffiliates?.length || 0})</TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({allAffiliates?.filter((a) => a.status === "pending").length || 0})
              </TabsTrigger>
              <TabsTrigger value="active">
                Active ({allAffiliates?.filter((a) => a.status === "active").length || 0})
              </TabsTrigger>
              <TabsTrigger value="suspended">
                Suspended ({allAffiliates?.filter((a) => a.status === "suspended").length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={selectedTab} className="mt-4">
              {filteredAffiliates && filteredAffiliates.length > 0 ? (
                <div className="space-y-4">
                  {filteredAffiliates.map((affiliate) => (
                    <div
                      key={affiliate._id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                            {affiliate.affiliateCode.substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {affiliate.affiliateCode}
                            </span>
                            {getStatusBadge(affiliate.status)}
                          </div>
                          <div className="mt-1 flex items-center gap-4 text-sm text-zinc-500">
                            <span className="flex items-center gap-1">
                              <Percent className="h-3 w-3" />
                              {affiliate.commissionRate}% commission
                            </span>
                            <span className="flex items-center gap-1">
                              <MousePointerClick className="h-3 w-3" />
                              {affiliate.totalClicks} clicks
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              ${affiliate.totalRevenue.toFixed(2)} revenue
                            </span>
                          </div>
                          {affiliate.applicationNote && affiliate.status === "pending" && (
                            <p className="mt-2 text-sm text-zinc-500 italic">
                              "{affiliate.applicationNote}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {affiliate.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => setApproveDialog(affiliate)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle2 className="mr-1 h-4 w-4" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setRejectDialog(affiliate)}
                            >
                              <XCircle className="mr-1 h-4 w-4" />
                              Reject
                            </Button>
                          </>
                        )}

                        {affiliate.status === "active" && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleSuspend(affiliate)}
                              >
                                <Ban className="mr-2 h-4 w-4" />
                                Suspend Affiliate
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}

                        {affiliate.status === "suspended" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setApproveDialog(affiliate)}
                          >
                            Reactivate
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-[200px] items-center justify-center">
                  <div className="text-center">
                    <UserPlus className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-700" />
                    <p className="mt-4 text-zinc-500 dark:text-zinc-400">
                      {selectedTab === "pending"
                        ? "No pending applications"
                        : selectedTab === "active"
                        ? "No active affiliates yet"
                        : "No affiliates yet"}
                    </p>
                    <p className="mt-2 text-sm text-zinc-400">
                      Share your affiliate link to attract partners who can promote your products
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* How Affiliates Work Info */}
      <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-500" />
            How Your Affiliate Program Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/10">
                <span className="text-sm font-bold text-purple-600">1</span>
              </div>
              <h4 className="font-medium">Affiliates Apply</h4>
              <p className="text-sm text-zinc-500">
                Users apply to become affiliates for your store and products
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/10">
                <span className="text-sm font-bold text-purple-600">2</span>
              </div>
              <h4 className="font-medium">They Promote</h4>
              <p className="text-sm text-zinc-500">
                Approved affiliates share their unique link and drive traffic to your products
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/10">
                <span className="text-sm font-bold text-purple-600">3</span>
              </div>
              <h4 className="font-medium">Everyone Earns</h4>
              <p className="text-sm text-zinc-500">
                You get sales, they earn commissions. Win-win growth.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={!!approveDialog} onOpenChange={() => setApproveDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Affiliate</DialogTitle>
            <DialogDescription>
              Set the commission rate for this affiliate. They'll earn this percentage on every sale they refer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="commission">Commission Rate (%)</Label>
              <Input
                id="commission"
                type="number"
                min="1"
                max="50"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
              />
              <p className="text-xs text-zinc-500">
                Recommended: 15-25% for digital products
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
              Approve Affiliate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={() => setRejectDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this affiliate application.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea
                id="reason"
                placeholder="E.g., We're not accepting new affiliates at this time..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Reject Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

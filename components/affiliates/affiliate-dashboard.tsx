"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Users,
  DollarSign,
  MousePointerClick,
  TrendingUp,
  Copy,
  ExternalLink,
  Loader2,
  Link2,
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Calendar,
  Info,
  RefreshCw,
  Gift,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface AffiliateDashboardProps {
  storeId: Id<"stores">;
  storeSlug: string;
  className?: string;
}

export function AffiliateDashboard({
  storeId,
  storeSlug,
  className,
}: AffiliateDashboardProps) {
  const { user } = useUser();

  // Get affiliate for current user and store
  const affiliateData = useQuery(
    api.affiliates.getAffiliateByUser,
    user?.id ? { userId: user.id, storeId } : "skip"
  );

  const affiliate = Array.isArray(affiliateData) ? affiliateData[0] : affiliateData;

  const stats = useQuery(
    api.affiliates.getAffiliateStats,
    affiliate?._id ? { affiliateId: affiliate._id } : "skip"
  );

  const sales = useQuery(
    api.affiliates.getAffiliateSales,
    affiliate?._id ? { affiliateId: affiliate._id, limit: 10 } : "skip"
  );

  const payouts = useQuery(
    api.affiliates.getAffiliatePayouts,
    affiliate?._id ? { affiliateId: affiliate._id } : "skip"
  );

  const applyForAffiliate = useMutation(api.affiliates.applyForAffiliate);

  const [isApplying, setIsApplying] = useState(false);
  const [applicationNote, setApplicationNote] = useState("");

  if (!user) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-lg font-medium">Sign in to join the affiliate program</p>
        </CardContent>
      </Card>
    );
  }

  // Show application form if not an affiliate
  if (!affiliate) {
    return (
      <AffiliateApplicationForm
        storeId={storeId}
        userId={user.id}
        onApply={async (note) => {
          setIsApplying(true);
          try {
            await applyForAffiliate({
              affiliateUserId: user.id,
              storeId,
              creatorId: storeId.toString(),
              applicationNote: note,
            });
            toast.success("Application submitted! We'll review it soon.");
          } catch (error) {
            toast.error("Failed to submit application");
          } finally {
            setIsApplying(false);
          }
        }}
        isApplying={isApplying}
        className={className}
      />
    );
  }

  // Show pending status
  if (affiliate.status === "pending") {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Clock className="h-12 w-12 text-amber-500" />
          <p className="mt-4 text-lg font-medium">Application Under Review</p>
          <p className="text-sm text-muted-foreground text-center max-w-md mt-2">
            Your affiliate application is being reviewed. You&apos;ll be notified once
            it&apos;s approved.
          </p>
          <Badge variant="outline" className="mt-4">
            Applied {format(affiliate.appliedAt, "MMM d, yyyy")}
          </Badge>
        </CardContent>
      </Card>
    );
  }

  // Show rejected status
  if (affiliate.status === "rejected") {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <XCircle className="h-12 w-12 text-red-500" />
          <p className="mt-4 text-lg font-medium">Application Not Approved</p>
          {affiliate.rejectionReason && (
            <p className="text-sm text-muted-foreground text-center max-w-md mt-2">
              Reason: {affiliate.rejectionReason}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Show suspended status
  if (affiliate.status === "suspended") {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <XCircle className="h-12 w-12 text-red-500" />
          <p className="mt-4 text-lg font-medium">Account Suspended</p>
          <p className="text-sm text-muted-foreground text-center max-w-md mt-2">
            Your affiliate account has been suspended. Please contact support for more
            information.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Active affiliate dashboard
  const affiliateLink = `${process.env.NEXT_PUBLIC_APP_URL}/${storeSlug}?ref=${affiliate.affiliateCode}`;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Affiliate Link Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Your Affiliate Link
          </CardTitle>
          <CardDescription>
            Share this link to earn {affiliate.commissionRate}% commission on every sale
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input value={affiliateLink} readOnly className="font-mono text-sm" />
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(affiliateLink);
                toast.success("Link copied to clipboard!");
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="outline" asChild>
              <a href={affiliateLink} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
          <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
            <span>Code: <code className="font-mono text-primary">{affiliate.affiliateCode}</code></span>
            <span>Cookie Duration: {affiliate.cookieDuration} days</span>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.stats?.totalClicks || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.stats?.convertedClicks || 0} converted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.stats?.conversionRate || 0).toFixed(1)}%
            </div>
            <Progress
              value={stats?.stats?.conversionRate || 0}
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${((stats?.stats?.totalEarnings || 0) / 100).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              From {affiliate.totalSales} sales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Available Payout</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${((stats?.stats?.availableForPayout || 0) / 100).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              ${((stats?.stats?.pendingCommission || 0) / 100).toFixed(2)} pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Sales and Payouts */}
      <Tabs defaultValue="sales">
        <TabsList>
          <TabsTrigger value="sales">Recent Sales</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Sales</CardTitle>
              <CardDescription>
                Track commissions from your referrals
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sales && sales.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Order Amount</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.map((sale: any) => (
                      <TableRow key={sale._id}>
                        <TableCell>
                          {format(sale.saleDate, "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="capitalize">
                          {sale.itemType}
                        </TableCell>
                        <TableCell>
                          ${(sale.orderAmount / 100).toFixed(2)}
                        </TableCell>
                        <TableCell className="font-medium">
                          ${(sale.commissionAmount / 100).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <CommissionStatusBadge status={sale.commissionStatus} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <BarChart3 className="h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    No sales yet. Share your affiliate link to start earning!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Payout History</CardTitle>
              <CardDescription>
                Track your commission payouts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {payouts && payouts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Sales Included</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payouts.map((payout: any) => (
                      <TableRow key={payout._id}>
                        <TableCell>
                          {format(payout.createdAt, "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="font-medium">
                          ${(payout.amount / 100).toFixed(2)}
                        </TableCell>
                        <TableCell>{payout.totalSales}</TableCell>
                        <TableCell className="capitalize">
                          {payout.payoutMethod}
                        </TableCell>
                        <TableCell>
                          <PayoutStatusBadge status={payout.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <Wallet className="h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    No payouts yet. Earn commissions to receive payouts.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Tips Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Tips for Success
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <h4 className="font-medium">Share on Social Media</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Post your affiliate link on Instagram, Twitter, and TikTok to reach more
                potential customers.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h4 className="font-medium">Create Content</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Write reviews, tutorials, or create videos showcasing the products you&apos;re
                promoting.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h4 className="font-medium">Build an Email List</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Send your affiliate link to your email subscribers for higher conversion
                rates.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Application Form Component
function AffiliateApplicationForm({
  storeId,
  userId,
  onApply,
  isApplying,
  className,
}: {
  storeId: Id<"stores">;
  userId: string;
  onApply: (note: string) => void;
  isApplying: boolean;
  className?: string;
}) {
  const [note, setNote] = useState("");

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Join the Affiliate Program
        </CardTitle>
        <CardDescription>
          Earn commissions by promoting products to your audience
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex flex-col items-center rounded-lg border p-4 text-center">
            <DollarSign className="h-8 w-8 text-green-500" />
            <h3 className="mt-2 font-semibold">Earn 20%+</h3>
            <p className="text-sm text-muted-foreground">
              Commission on every sale
            </p>
          </div>
          <div className="flex flex-col items-center rounded-lg border p-4 text-center">
            <Clock className="h-8 w-8 text-blue-500" />
            <h3 className="mt-2 font-semibold">30-Day Cookie</h3>
            <p className="text-sm text-muted-foreground">
              Long tracking window
            </p>
          </div>
          <div className="flex flex-col items-center rounded-lg border p-4 text-center">
            <RefreshCw className="h-8 w-8 text-purple-500" />
            <h3 className="mt-2 font-semibold">Monthly Payouts</h3>
            <p className="text-sm text-muted-foreground">
              Reliable payment schedule
            </p>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="note">Tell us about yourself (optional)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="How do you plan to promote? What's your audience size?"
              rows={4}
            />
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={() => onApply(note)}
            disabled={isApplying}
          >
            {isApplying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Users className="mr-2 h-4 w-4" />
                Apply to Become an Affiliate
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Status Badge Components
function CommissionStatusBadge({ status }: { status: string }) {
  const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
    pending: { variant: "secondary", icon: <Clock className="mr-1 h-3 w-3" /> },
    approved: { variant: "default", icon: <CheckCircle2 className="mr-1 h-3 w-3" /> },
    paid: { variant: "outline", icon: <DollarSign className="mr-1 h-3 w-3" /> },
    reversed: { variant: "destructive", icon: <XCircle className="mr-1 h-3 w-3" /> },
  };

  const config = variants[status] || variants.pending;

  return (
    <Badge variant={config.variant} className="capitalize">
      {config.icon}
      {status}
    </Badge>
  );
}

function PayoutStatusBadge({ status }: { status: string }) {
  const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
    pending: { variant: "secondary" },
    processing: { variant: "outline", className: "border-blue-500 text-blue-500" },
    completed: { variant: "default", className: "bg-green-500" },
    failed: { variant: "destructive" },
  };

  const config = variants[status] || variants.pending;

  return (
    <Badge variant={config.variant} className={cn("capitalize", config.className)}>
      {status}
    </Badge>
  );
}

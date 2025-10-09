"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, TrendingUp, Users, Link2, Copy } from "lucide-react";

interface AffiliateDashboardProps {
  affiliateId: Id<"affiliates">;
}

export function AffiliateDashboard({ affiliateId }: AffiliateDashboardProps) {
  const stats = useQuery(api.affiliates.getAffiliateStats, { affiliateId });
  const sales = useQuery(api.affiliates.getAffiliateSales, { affiliateId, limit: 10 });
  const { toast } = useToast();

  const copyAffiliateLink = () => {
    if (!stats) return;
    const link = `${window.location.origin}?ref=${stats.affiliateCode}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied!",
      description: "Your affiliate link has been copied to clipboard",
      className: "bg-white dark:bg-black",
    });
  };

  if (!stats) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Affiliate Dashboard</h1>
        <p className="text-muted-foreground">Track your earnings and performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${((stats.stats?.totalEarnings || 0) / 100).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              ${((stats.stats?.pendingCommission || 0) / 100).toFixed(2)} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.stats?.totalClicks || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats.stats?.convertedClicks || 0} converted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.stats?.conversionRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalSales} sales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${((stats.totalRevenue || 0) / 100).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Generated for creator
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Affiliate Link</CardTitle>
          <CardDescription>Share this link to earn commissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-4 py-2 bg-muted rounded-md text-sm">
              {`${window.location.origin}?ref=${stats.affiliateCode}`}
            </code>
            <Button onClick={copyAffiliateLink} variant="outline">
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
          </div>
          <div className="mt-4 p-4 bg-muted rounded-md">
            <p className="text-sm font-medium mb-2">Your Affiliate Code:</p>
            <code className="text-lg font-mono font-bold">{stats.affiliateCode}</code>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
          <CardDescription>Your latest commissions</CardDescription>
        </CardHeader>
        <CardContent>
          {sales && sales.length > 0 ? (
            <div className="space-y-4">
              {sales.map((sale) => (
                <div
                  key={sale._id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium">
                      ${((sale.orderAmount || 0) / 100).toFixed(2)} sale
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(sale.saleDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      +${((sale.commissionAmount || 0) / 100).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {sale.commissionStatus}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No sales yet. Start sharing your affiliate link!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}





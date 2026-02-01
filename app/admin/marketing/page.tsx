"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Megaphone,
  LayoutTemplate,
  FileText,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  Clock,
  Send,
} from "lucide-react";
import Link from "next/link";
import { campaignCategories } from "@/lib/marketing-campaigns/types";
import { templateCounts } from "@/lib/marketing-campaigns/templates";

export default function AdminMarketingPage() {
  const campaignStats = useQuery(api.marketingCampaigns.getCampaignStats, {
    storeId: "admin",
  });

  const recentCampaigns = useQuery(api.marketingCampaigns.listAdminCampaigns, {
    limit: 5,
  });

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Megaphone className="h-8 w-8" />
            Admin Marketing Hub
          </h1>
          <p className="text-muted-foreground mt-1">
            Create platform-wide marketing campaigns and manage templates
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/admin/marketing/campaigns/new">
            <PlusCircle className="h-5 w-5 mr-2" />
            New Campaign
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Campaigns</CardDescription>
            <CardTitle className="text-3xl">
              {campaignStats?.total ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Admin-level campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {campaignStats?.active ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Currently running
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Scheduled</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {campaignStats?.scheduled ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Ready to launch
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Templates</CardDescription>
            <CardTitle className="text-3xl text-purple-600">
              {templateCounts.total}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Available templates
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="group hover:shadow-md transition-shadow">
          <Link href="/admin/marketing/templates">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <LayoutTemplate className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Campaign Templates</CardTitle>
                    <CardDescription>
                      Browse {templateCounts.total} ready-to-use templates
                    </CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {campaignCategories.map((cat) => (
                  <Badge
                    key={cat.type}
                    variant="secondary"
                    style={{ borderColor: cat.color }}
                  >
                    {cat.label}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="group hover:shadow-md transition-shadow">
          <Link href="/admin/marketing/campaigns">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Admin Campaigns</CardTitle>
                    <CardDescription>
                      Platform-wide marketing campaigns
                    </CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {campaignStats?.draft ?? 0} drafts
                </span>
                <span className="flex items-center gap-1">
                  <Send className="h-4 w-4 text-muted-foreground" />
                  {campaignStats?.scheduled ?? 0} scheduled
                </span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  {campaignStats?.completed ?? 0} completed
                </span>
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Recent Campaigns */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Admin Campaigns</CardTitle>
            <CardDescription>Platform-wide marketing campaigns</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/marketing/campaigns">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {!recentCampaigns || recentCampaigns.length === 0 ? (
            <div className="text-center py-8">
              <Megaphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">
                No admin campaigns yet. Create your first campaign to get started.
              </p>
              <Button asChild>
                <Link href="/admin/marketing/campaigns/new">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Campaign
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentCampaigns.map((campaign) => {
                const category = campaignCategories.find(
                  (c) => c.type === campaign.campaignType
                );
                return (
                  <Link
                    key={campaign._id}
                    href={`/admin/marketing/campaigns/${campaign._id}`}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${category?.color}20` }}
                      >
                        <Megaphone
                          className="h-5 w-5"
                          style={{ color: category?.color }}
                        />
                      </div>
                      <div>
                        <p className="font-medium">{campaign.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {category?.label}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          campaign.status === "active"
                            ? "default"
                            : campaign.status === "scheduled"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {campaign.status}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

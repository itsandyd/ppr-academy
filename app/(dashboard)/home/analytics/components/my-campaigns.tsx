/**
 * My Campaigns - Shows creator's campaign performance
 * Displays email campaigns, social posts, and their metrics
 */

"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Mail,
  Instagram,
  Music,
  MessageSquare,
  Eye,
  MousePointer,
  TrendingUp,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

interface MyCampaignsProps {
  userId: string; // Clerk ID
}

export function MyCampaigns({ userId }: MyCampaignsProps) {
  const campaigns = useQuery(api.campaigns.getMyCampaigns, { userId });

  if (!campaigns) {
    return <MyCampaignsSkeleton />;
  }

  if (campaigns.length === 0) {
    return <NoCampaignsState />;
  }

  const activeCampaigns = campaigns.filter(
    (c: any) => c.status === "active" || c.status === "scheduled"
  );
  const completedCampaigns = campaigns.filter((c: any) => c.status === "completed");

  return (
    <Card className="bg-white dark:bg-black">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg font-semibold">My Campaigns</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {activeCampaigns.length} active · {completedCampaigns.length} completed
            </p>
          </div>
          <Button size="sm" className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto">
            Create Campaign
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {campaigns.slice(0, 5).map((campaign: any) => (
            <CampaignItem key={campaign._id} campaign={campaign} />
          ))}

          {campaigns.length > 5 && (
            <Button variant="outline" className="mt-4 w-full">
              View All Campaigns ({campaigns.length})
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface Campaign {
  _id: string;
  name: string;
  type: "email" | "instagram" | "tiktok" | "dm_batch";
  status: "draft" | "scheduled" | "active" | "completed" | "paused";
  sentCount?: number;
  deliveredCount?: number;
  openedCount?: number;
  clickedCount?: number;
  convertedCount?: number;
  scheduledAt?: number;
  sentAt?: number;
  createdAt: number;
}

interface CampaignItemProps {
  campaign: Campaign;
}

function CampaignItem({ campaign }: CampaignItemProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "email":
        return Mail;
      case "instagram":
        return Instagram;
      case "tiktok":
        return Music;
      case "dm_batch":
        return MessageSquare;
      default:
        return Mail;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "scheduled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "completed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
      case "paused":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const Icon = getTypeIcon(campaign.type);
  const openRate =
    campaign.deliveredCount && campaign.deliveredCount > 0
      ? ((campaign.openedCount || 0) / campaign.deliveredCount) * 100
      : 0;
  const clickRate =
    campaign.openedCount && campaign.openedCount > 0
      ? ((campaign.clickedCount || 0) / campaign.openedCount) * 100
      : 0;

  return (
    <div className="flex items-start gap-4 rounded-lg bg-muted/50 p-4 transition-colors hover:bg-muted">
      {/* Icon */}
      <div className="flex-shrink-0 rounded-full bg-purple-100 p-3 dark:bg-purple-900/30">
        <Icon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h4 className="truncate font-semibold">{campaign.name}</h4>
            <p className="text-sm text-muted-foreground">
              {campaign.sentAt
                ? `Sent ${formatDistanceToNow(campaign.sentAt, { addSuffix: true })}`
                : campaign.scheduledAt
                  ? `Scheduled for ${formatDistanceToNow(campaign.scheduledAt, { addSuffix: true })}`
                  : "Draft"}
            </p>
          </div>
          <Badge className={getStatusColor(campaign.status)} variant="secondary">
            {campaign.status}
          </Badge>
        </div>

        {/* Metrics */}
        {campaign.status === "completed" && campaign.sentCount && (
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Metric label="Sent" value={campaign.sentCount} icon={Mail} color="text-blue-600" />
            <Metric
              label="Opened"
              value={campaign.openedCount || 0}
              percentage={openRate}
              icon={Eye}
              color="text-green-600"
            />
            <Metric
              label="Clicked"
              value={campaign.clickedCount || 0}
              percentage={clickRate}
              icon={MousePointer}
              color="text-purple-600"
            />
            <Metric
              label="Converted"
              value={campaign.convertedCount || 0}
              icon={TrendingUp}
              color="text-orange-600"
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <Button variant="ghost" size="sm" className="flex-shrink-0">
        <ExternalLink className="h-4 w-4" />
      </Button>
    </div>
  );
}

interface MetricProps {
  label: string;
  value: number;
  percentage?: number;
  icon: React.ComponentType<any>;
  color: string;
}

function Metric({ label, value, percentage, icon: Icon, color }: MetricProps) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5">
        <Icon className={`h-3 w-3 ${color}`} />
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="text-lg font-bold">
        {value}
        {percentage !== undefined && (
          <span className="ml-1 text-xs text-muted-foreground">({percentage.toFixed(0)}%)</span>
        )}
      </p>
    </div>
  );
}

function NoCampaignsState() {
  return (
    <Card className="bg-white dark:bg-black">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="mb-4 rounded-full bg-purple-100 p-4 dark:bg-purple-900/30">
          <Mail className="h-8 w-8 text-purple-600 dark:text-purple-400" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">No campaigns yet</h3>
        <p className="mb-4 max-w-md text-center text-sm text-muted-foreground">
          Create email campaigns to engage with your students and promote your courses
        </p>
        <Button className="bg-purple-600 hover:bg-purple-700">Create Your First Campaign</Button>
      </CardContent>
    </Card>
  );
}

function MyCampaignsSkeleton() {
  return (
    <Card className="bg-white dark:bg-black">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="mb-2 h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-4 p-4">
              <Skeleton className="h-12 w-12 flex-shrink-0 rounded-full" />
              <div className="flex-1">
                <Skeleton className="mb-2 h-5 w-48" />
                <Skeleton className="h-4 w-32" />
                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

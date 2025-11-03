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
  ExternalLink
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
    (c) => c.status === "active" || c.status === "scheduled"
  );
  const completedCampaigns = campaigns.filter((c) => c.status === "completed");

  return (
    <Card className="bg-white dark:bg-black">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">My Campaigns</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {activeCampaigns.length} active · {completedCampaigns.length} completed
            </p>
          </div>
          <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
            Create Campaign
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {campaigns.slice(0, 5).map((campaign) => (
            <CampaignItem key={campaign._id} campaign={campaign} />
          ))}

          {campaigns.length > 5 && (
            <Button variant="outline" className="w-full mt-4">
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
    <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
      {/* Icon */}
      <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30 flex-shrink-0">
        <Icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold truncate">{campaign.name}</h4>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
            <Metric
              label="Sent"
              value={campaign.sentCount}
              icon={Mail}
              color="text-blue-600"
            />
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
        <ExternalLink className="w-4 h-4" />
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
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={`w-3 h-3 ${color}`} />
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="text-lg font-bold">
        {value}
        {percentage !== undefined && (
          <span className="text-xs text-muted-foreground ml-1">
            ({percentage.toFixed(0)}%)
          </span>
        )}
      </p>
    </div>
  );
}

function NoCampaignsState() {
  return (
    <Card className="bg-white dark:bg-black">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="p-4 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
          <Mail className="w-8 h-8 text-purple-600 dark:text-purple-400" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
          Create email campaigns to engage with your students and promote your courses
        </p>
        <Button className="bg-purple-600 hover:bg-purple-700">
          Create Your First Campaign
        </Button>
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
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-4 p-4">
              <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-5 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
                <div className="grid grid-cols-4 gap-3 mt-3">
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


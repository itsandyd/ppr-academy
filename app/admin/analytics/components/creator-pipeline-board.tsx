/**
 * Creator Pipeline Board - Kanban-style CRM for managing creator journey
 * Shows creators organized by stage with quick action buttons
 */

"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { 
  Users, 
  Mail, 
  MessageSquare, 
  Phone,
  Clock,
  DollarSign,
  Package,
  TrendingUp,
  ChevronRight
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export function CreatorPipelineBoard() {
  const { toast } = useToast();

  // Get pipeline stats for column headers
  const pipelineStats = useQuery(api.analytics.creatorPipeline.getPipelineStats, {});

  // Get creators for first 4 stages (most actionable)
  const prospects = useQuery(api.analytics.creatorPipeline.getCreatorsByStage, {
    stage: "prospect",
  });
  const invited = useQuery(api.analytics.creatorPipeline.getCreatorsByStage, {
    stage: "invited",
  });
  const signedUp = useQuery(api.analytics.creatorPipeline.getCreatorsByStage, {
    stage: "signed_up",
  });
  const drafting = useQuery(api.analytics.creatorPipeline.getCreatorsByStage, {
    stage: "drafting",
  });

  const updateStage = useMutation(api.analytics.creatorPipeline.updateCreatorStage);
  const addTouch = useMutation(api.analytics.creatorPipeline.addCreatorTouch);

  if (!pipelineStats || !prospects || !invited || !signedUp || !drafting) {
    return <CreatorPipelineBoardSkeleton />;
  }

  const handleSendEmail = async (creatorId: string, creatorEmail?: string) => {
    if (!creatorEmail) {
      toast({
        title: "No email available",
        description: "This creator doesn't have an email address",
        variant: "destructive",
      });
      return;
    }

    await addTouch({
      creatorId: creatorId as any,
      touchType: "email",
      note: "Sent welcome email",
    });

    toast({
      title: "Email logged",
      description: `Touchpoint recorded for ${creatorEmail}`,
    });
  };

  const stages = [
    {
      name: "Prospects",
      stage: "prospect" as const,
      count: pipelineStats.prospect,
      creators: prospects.slice(0, 3),
      color: "gray",
    },
    {
      name: "Invited",
      stage: "invited" as const,
      count: pipelineStats.invited,
      creators: invited.slice(0, 3),
      color: "blue",
    },
    {
      name: "Signed Up",
      stage: "signed_up" as const,
      count: pipelineStats.signed_up,
      creators: signedUp.slice(0, 3),
      color: "green",
    },
    {
      name: "Drafting",
      stage: "drafting" as const,
      count: pipelineStats.drafting,
      creators: drafting.slice(0, 3),
      color: "orange",
    },
  ];

  return (
    <Card className="bg-white dark:bg-black">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Creator Pipeline</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Manage creators through their journey
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">
              {pipelineStats.published} Published
            </Badge>
            <Badge variant="outline" className="text-xs">
              {pipelineStats.first_sale} First Sale
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stages.map((stage) => (
            <PipelineColumn
              key={stage.stage}
              name={stage.name}
              count={stage.count}
              creators={stage.creators}
              color={stage.color}
              onSendEmail={handleSendEmail}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface PipelineColumnProps {
  name: string;
  count: number;
  creators: any[];
  color: string;
  onSendEmail: (creatorId: string, email?: string) => void;
}

function PipelineColumn({ name, count, creators, color, onSendEmail }: PipelineColumnProps) {
  const colorClasses = {
    gray: "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300",
    blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
    green: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
    orange: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
  };

  return (
    <div className="space-y-3">
      {/* Column Header */}
      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
        <h3 className="font-semibold text-sm">{name}</h3>
        <Badge className={colorClasses[color as keyof typeof colorClasses]} variant="secondary">
          {count}
        </Badge>
      </div>

      {/* Creator Cards */}
      <div className="space-y-2">
        {creators.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground bg-muted/50 rounded-lg">
            No creators
          </div>
        ) : (
          creators.map((creator) => (
            <CreatorCard
              key={creator._id}
              creator={creator}
              onSendEmail={onSendEmail}
            />
          ))
        )}

        {count > 3 && (
          <Button variant="ghost" size="sm" className="w-full text-xs">
            View all {count} <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}

interface CreatorCardProps {
  creator: any;
  onSendEmail: (creatorId: string, email?: string) => void;
}

function CreatorCard({ creator, onSendEmail }: CreatorCardProps) {
  const daysSinceTouch = creator.daysSinceLastTouch;

  return (
    <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border hover:shadow-md transition-shadow">
      {/* Creator Info */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{creator.userName}</p>
          <p className="text-xs text-muted-foreground truncate">{creator.userEmail}</p>
        </div>
      </div>

      {/* Metadata */}
      <div className="flex gap-2 text-xs text-muted-foreground mb-2">
        {creator.daw && (
          <span className="flex items-center gap-1">
            🎵 {creator.daw}
          </span>
        )}
        {creator.audienceSize && (
          <span className="flex items-center gap-1">
            👥 {creator.audienceSize}
          </span>
        )}
      </div>

      {/* Stats */}
      {(creator.totalRevenue || creator.productCount) && (
        <div className="flex gap-3 text-xs mb-2">
          {creator.totalRevenue && (
            <div className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              ${creator.totalRevenue}
            </div>
          )}
          {creator.productCount && (
            <div className="flex items-center gap-1">
              <Package className="w-3 h-3" />
              {creator.productCount}
            </div>
          )}
        </div>
      )}

      {/* Last Touch */}
      {daysSinceTouch !== undefined && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
          <Clock className="w-3 h-3" />
          <span>
            {daysSinceTouch === 0 ? "Today" : `${daysSinceTouch}d ago`}
          </span>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 h-7 text-xs"
          onClick={() => onSendEmail(creator._id, creator.userEmail)}
        >
          <Mail className="w-3 h-3 mr-1" />
          Email
        </Button>
        <Button variant="ghost" size="sm" className="h-7 px-2">
          <MessageSquare className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

function CreatorPipelineBoardSkeleton() {
  return (
    <Card className="bg-white dark:bg-black">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}


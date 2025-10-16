"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Users, 
  MessageSquare, 
  TrendingUp, 
  ExternalLink,
  Radio,
  Hash,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DiscordStatsWidgetProps {
  serverId?: string;
  inviteUrl?: string;
  className?: string;
}

export function DiscordStatsWidget({ 
  serverId,
  inviteUrl = "#",
  className 
}: DiscordStatsWidgetProps) {
  // Mock data - replace with real Discord API integration
  const stats = {
    totalMembers: 1247,
    onlineMembers: 342,
    activeChannels: 12,
    recentMessages: 156,
    growthRate: "+12%"
  };

  const recentActivity = [
    {
      id: "1",
      user: "BeatMaster",
      action: "shared a new track",
      channel: "music-feedback",
      time: "2m ago"
    },
    {
      id: "2",
      user: "SoundDesigner",
      action: "asked a question",
      channel: "production-help",
      time: "15m ago"
    },
    {
      id: "3",
      user: "ProducerPro",
      action: "started a discussion",
      channel: "gear-talk",
      time: "1h ago"
    }
  ];

  const activeChannels = [
    { name: "general", members: 89, active: true },
    { name: "music-feedback", members: 67, active: true },
    { name: "production-help", members: 54, active: true },
    { name: "sample-sharing", members: 43, active: false }
  ];

  return (
    <Card className={cn("bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 border-indigo-200 dark:border-indigo-800", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#5865F2] rounded-lg flex items-center justify-center">
              <svg
                width="20"
                height="20"
                viewBox="0 0 71 55"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z"
                  fill="white"
                />
              </svg>
            </div>
            Discord Community
          </CardTitle>
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
            <Radio className="w-3 h-3 mr-1 animate-pulse" />
            Live
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-card rounded-lg border border-indigo-200 dark:border-indigo-800">
            <div className="flex items-center justify-center mb-2">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.totalMembers}</p>
            <p className="text-xs text-muted-foreground">Total Members</p>
          </div>

          <div className="text-center p-4 bg-white dark:bg-black rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-center mb-2">
              <Radio className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.onlineMembers}</p>
            <p className="text-xs text-muted-foreground">Online Now</p>
          </div>

          <div className="text-center p-4 bg-white dark:bg-black rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-center mb-2">
              <Hash className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.activeChannels}</p>
            <p className="text-xs text-muted-foreground">Channels</p>
          </div>

          <div className="text-center p-4 bg-white dark:bg-black rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-center mb-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.recentMessages}</p>
            <p className="text-xs text-muted-foreground">Today</p>
          </div>
        </div>

        {/* Growth Badge */}
        <div className="flex items-center justify-center gap-2 p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
          <TrendingUp className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-700 dark:text-green-300">
            {stats.growthRate} growth this month
          </span>
        </div>

        {/* Active Channels */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Hash className="w-4 h-4 text-purple-600" />
            Active Channels
          </h4>
          <div className="space-y-2">
            {activeChannels.map((channel) => (
              <div
                key={channel.name}
                className="flex items-center justify-between p-2 bg-white dark:bg-black rounded-lg border border-slate-200 dark:border-slate-800"
              >
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{channel.name}</span>
                  {channel.active && (
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="w-3 h-3" />
                  {channel.members}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            Recent Activity
          </h4>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 bg-white dark:bg-black rounded-lg border border-slate-200 dark:border-slate-800"
              >
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xs">
                    {activity.user.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{activity.user}</span>{" "}
                    <span className="text-muted-foreground">{activity.action}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-indigo-600 dark:text-indigo-400">
                      #{activity.channel}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {activity.time}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Join Button */}
        <Button 
          className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white gap-2"
          onClick={() => window.open(inviteUrl, '_blank')}
        >
          <Users className="w-4 h-4" />
          Join Our Discord Community
          <ExternalLink className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

// Compact version for sidebar
export function DiscordStatsCompact({ 
  serverId,
  inviteUrl = "#",
  className 
}: DiscordStatsWidgetProps) {
  const stats = {
    totalMembers: 1247,
    onlineMembers: 342
  };

  return (
    <Card className={cn("bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 border-indigo-200 dark:border-indigo-800", className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-[#5865F2] rounded-lg flex items-center justify-center flex-shrink-0">
            <svg
              width="20"
              height="20"
              viewBox="0 0 71 55"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z"
                fill="white"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm">Discord Community</h4>
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 text-xs">
              <Radio className="w-2 h-2 mr-1 animate-pulse" />
              {stats.onlineMembers} online
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="text-center p-2 bg-white dark:bg-black rounded border border-slate-200 dark:border-slate-800">
            <p className="text-lg font-bold">{stats.totalMembers}</p>
            <p className="text-xs text-muted-foreground">Members</p>
          </div>
          <div className="text-center p-2 bg-white dark:bg-black rounded border border-slate-200 dark:border-slate-800">
            <p className="text-lg font-bold">{stats.onlineMembers}</p>
            <p className="text-xs text-muted-foreground">Online</p>
          </div>
        </div>

        <Button 
          className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm"
          onClick={() => window.open(inviteUrl, '_blank')}
        >
          Join Server
        </Button>
      </CardContent>
    </Card>
  );
}


"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Users, Headphones } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface JoinDiscordCTAProps {
  storeId: Id<"stores">;
  variant?: "card" | "banner" | "inline";
}

export function JoinDiscordCTA({ storeId, variant = "card" }: JoinDiscordCTAProps) {
  const discordGuild = useQuery(api.discordPublic.getStoreDiscordGuild, { storeId });

  if (!discordGuild || !discordGuild.isActive) {
    return null;
  }

  const inviteUrl = discordGuild.inviteCode
    ? `https://discord.gg/${discordGuild.inviteCode}`
    : null;

  if (variant === "banner") {
    return (
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-lg">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center justify-center w-12 h-12 bg-white/20 rounded-full">
              <svg className="w-6 h-6" viewBox="0 0 127.14 96.36" fill="currentColor">
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-lg">Join Our Discord Community</h3>
              <p className="text-sm text-white/90">
                Connect with instructors and fellow students
              </p>
            </div>
          </div>
          {inviteUrl && (
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="flex-shrink-0"
            >
              <a href={inviteUrl} target="_blank" rel="noopener noreferrer">
                Join Discord
              </a>
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (variant === "inline") {
    return inviteUrl ? (
      <Button asChild variant="outline" size="sm" className="gap-2">
        <a href={inviteUrl} target="_blank" rel="noopener noreferrer">
          <svg className="w-4 h-4" viewBox="0 0 127.14 96.36" fill="currentColor">
            <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
          </svg>
          Join Discord
        </a>
      </Button>
    ) : null;
  }

  // Default: card variant
  return (
    <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-200 dark:border-indigo-800">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-full flex-shrink-0">
            <svg className="w-6 h-6 text-white" viewBox="0 0 127.14 96.36" fill="currentColor">
              <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-2">Join the Discord Community</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Connect with fellow students, ask questions, share your work, and get real-time support from instructors.
            </p>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                <span className="text-muted-foreground">Live Chat</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-indigo-600" />
                <span className="text-muted-foreground">Community</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Headphones className="w-4 h-4 text-indigo-600" />
                <span className="text-muted-foreground">Support</span>
              </div>
            </div>
            {inviteUrl && (
              <Button asChild className="w-full sm:w-auto">
                <a href={inviteUrl} target="_blank" rel="noopener noreferrer">
                  Join {discordGuild.guildName || "Discord Server"}
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


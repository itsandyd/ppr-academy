"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, ExternalLink, Loader2 } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface DiscordVerificationCardProps {
  onVerificationChange?: (isVerified: boolean) => void;
  storeId?: Id<"stores">; // Optional storeId for dynamic guild lookup
}

export function DiscordVerificationCard({ onVerificationChange, storeId }: DiscordVerificationCardProps) {
  const { user } = useUser();
  const [isConnecting, setIsConnecting] = useState(false);

  // Check Discord connection status
  const discordConnection = useQuery(
    api.coachingProducts.checkUserDiscordConnection,
    user?.id ? { userId: user.id } : "skip"
  );

  // Get store's Discord guild configuration for dynamic invite links
  const storeGuild = useQuery(
    api.discordPublic.getStoreDiscordGuild,
    storeId ? { storeId } : "skip"
  );

  const isConnected = discordConnection?.isConnected ?? false;
  const isInGuild = discordConnection?.guildMemberStatus === "joined";

  // Notify parent component of verification status
  useEffect(() => {
    if (onVerificationChange && discordConnection) {
      onVerificationChange(isConnected && isInGuild);
    }
  }, [isConnected, isInGuild, onVerificationChange, discordConnection]);

  const handleConnectDiscord = useCallback(() => {
    setIsConnecting(true);
    // Redirect to Discord OAuth flow
    window.location.href = "/api/auth/discord";
  }, []);

  const handleJoinServer = useCallback(() => {
    // Use store's guild invite code if available, otherwise fall back to default
    let inviteUrl = "https://discord.gg/dX2JNRqpZd"; // Default fallback

    if (storeGuild?.inviteCode) {
      inviteUrl = `https://discord.gg/${storeGuild.inviteCode}`;
    } else if (typeof window !== "undefined") {
      // Fall back to environment variable or static config
      const envInviteCode = process.env.NEXT_PUBLIC_DISCORD_INVITE_CODE;
      if (envInviteCode) {
        inviteUrl = `https://discord.gg/${envInviteCode}`;
      }
    }

    window.open(inviteUrl, "_blank", "noopener,noreferrer");
  }, [storeGuild]);

  if (!discordConnection) {
    return (
      <Card className="border-[#E5E7F5]">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
            Discord Connection
          </CardTitle>
          <CardDescription>Loading Discord status...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
            Discord Connection Required
          </CardTitle>
          <CardDescription className="text-amber-800 dark:text-amber-300">
            Coaching sessions use Discord for communication. Please connect your Discord account to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleConnectDiscord}
            disabled={isConnecting}
            className="bg-[#5865F2] hover:bg-[#4752C4] text-white"
          >
            {isConnecting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4 mr-2" />
                Connect Discord
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!isInGuild) {
    return (
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-500" />
            Join {storeGuild?.guildName || "Our"} Discord Server
          </CardTitle>
          <CardDescription className="text-blue-800 dark:text-blue-300">
            You're connected to Discord as <strong>{discordConnection.discordUsername}</strong>, but
            you need to join our Discord server to access coaching channels.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleJoinServer}
            className="bg-[#5865F2] hover:bg-[#4752C4] text-white"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Join Discord Server
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Fully verified
  return (
    <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
          Discord Connected
        </CardTitle>
        <CardDescription className="text-emerald-800 dark:text-emerald-300">
          You're connected as <strong>{discordConnection.discordUsername}</strong> and will receive
          access to coaching channels upon booking.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}


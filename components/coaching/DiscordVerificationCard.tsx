"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertCircle, ExternalLink } from "lucide-react";
import { useState } from "react";

interface DiscordVerificationCardProps {
  onVerificationChange?: (isVerified: boolean) => void;
}

export function DiscordVerificationCard({ onVerificationChange }: DiscordVerificationCardProps) {
  const { user } = useUser();
  const [isConnecting, setIsConnecting] = useState(false);

  // Check Discord connection status
  const discordConnection = useQuery(
    api.coachingProducts.checkUserDiscordConnection,
    user?.id ? { userId: user.id } : "skip"
  );

  const isConnected = discordConnection?.isConnected ?? false;
  const isInGuild = discordConnection?.guildMemberStatus === "joined";

  // Notify parent component of verification status
  React.useEffect(() => {
    if (onVerificationChange && discordConnection) {
      onVerificationChange(isConnected && isInGuild);
    }
  }, [isConnected, isInGuild, onVerificationChange, discordConnection]);

  const handleConnectDiscord = () => {
    setIsConnecting(true);
    // Redirect to Discord OAuth flow
    window.location.href = "/api/auth/discord";
  };

  if (!discordConnection) {
    return (
      <Card className="border-[#E5E7F5]">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-gray-400" />
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
              "Connecting..."
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
            Join Our Discord Server
          </CardTitle>
          <CardDescription className="text-blue-800 dark:text-blue-300">
            You're connected to Discord as <strong>{discordConnection.discordUsername}</strong>, but
            you need to join our Discord server to access coaching channels.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => {
              // TODO: Get invite link from store's Discord guild
              window.open("https://discord.gg/your-invite-code", "_blank");
            }}
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

// Import React for useEffect
import React from "react";


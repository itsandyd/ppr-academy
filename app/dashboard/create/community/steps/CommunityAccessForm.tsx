"use client";

import { useCommunityCreation } from "../context";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Shield, Check, MessageCircle, Lock, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";

export function CommunityAccessForm() {
  const { state, updateData } = useCommunityCreation();

  const accessTypes = [
    {
      id: "paid" as const,
      label: "Paid Access",
      description: "Members pay a one-time fee to join",
      icon: Lock,
      color: "from-purple-500 to-indigo-500",
      borderColor: "border-purple-500/50",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
    },
    {
      id: "free_with_gate" as const,
      label: "Free Access",
      description: "Members join for free (follow gate optional)",
      icon: Unlock,
      color: "from-green-500 to-emerald-500",
      borderColor: "border-green-500/50",
      bgColor: "bg-green-50 dark:bg-green-950/20",
    },
  ];

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-2">Access & Pricing</h2>
          <p className="text-muted-foreground">
            Configure how members can access your community
          </p>
        </div>

        {/* Access Type Selection */}
        <div className="space-y-4">
          <Label>Access Type</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accessTypes.map((type) => {
              const isSelected = state.data.accessType === type.id;
              const Icon = type.icon;
              return (
                <Card
                  key={type.id}
                  className={cn(
                    "cursor-pointer transition-all duration-200 border-2",
                    isSelected
                      ? `${type.borderColor} ${type.bgColor}`
                      : "border-transparent hover:border-muted-foreground/20"
                  )}
                  onClick={() => updateData("access", { accessType: type.id })}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br",
                          type.color
                        )}
                      >
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{type.label}</h3>
                          {isSelected && (
                            <Check className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {type.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Price Input (only for paid) */}
        {state.data.accessType === "paid" && (
          <Card className="border-2 border-purple-500/50 bg-purple-50 dark:bg-purple-950/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-1">One-Time Payment</h3>
                  <p className="text-sm text-muted-foreground">
                    Members pay once for lifetime access to your community
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-green-500" />
                    Instant access after payment
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-green-500" />
                    Secure Stripe checkout
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-green-500" />
                    Automatic member verification
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Label htmlFor="price" className="text-lg font-semibold">
                    Access Price (USD)
                  </Label>
                  <div className="relative max-w-xs mt-2">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </div>
                    <Input
                      id="price"
                      type="number"
                      min="1"
                      step="1"
                      value={state.data.price || "10"}
                      onChange={(e) =>
                        updateData("access", {
                          price: Math.max(1, Number(e.target.value)).toString(),
                        })
                      }
                      className="pl-8 text-2xl font-bold h-14"
                      placeholder="10"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Set a one-time price for lifetime community access
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Free access info */}
        {state.data.accessType === "free_with_gate" && (
          <Card className="border-2 border-green-500/50 bg-green-50 dark:bg-green-950/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <Unlock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-1">Free Community</h3>
                  <p className="text-sm text-muted-foreground">
                    Grow your community with free access
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-green-500" />
                  Email capture for all members
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-green-500" />
                  Optional social follow requirements
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-green-500" />
                  Build your audience faster
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Discord Invite Link */}
        <Card className="bg-muted/50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#5865F2] flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Discord Integration (Optional)</h3>
                <p className="text-sm text-muted-foreground">
                  Add a Discord invite link to give members access to your server
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="discordLink">Discord Invite Link</Label>
              <Input
                id="discordLink"
                type="url"
                value={state.data.discordInviteLink || ""}
                onChange={(e) => updateData("access", { discordInviteLink: e.target.value })}
                placeholder="https://discord.gg/your-invite"
              />
              <p className="text-xs text-muted-foreground">
                Create a permanent invite link in your Discord server settings
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Card>
  );
}

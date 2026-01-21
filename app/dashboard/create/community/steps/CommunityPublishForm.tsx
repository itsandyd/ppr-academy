"use client";

import { useCommunityCreation } from "../context";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Check, X, MessageCircle, Shield, Unlock } from "lucide-react";

export function CommunityPublishForm() {
  const { state, canPublish } = useCommunityCreation();

  const checklist = [
    {
      label: "Title added",
      completed: !!(state.data.title && state.data.title.length >= 3),
    },
    {
      label: "Description added",
      completed: !!(state.data.description && state.data.description.length >= 10),
    },
    {
      label: "Access type selected",
      completed: !!state.data.accessType,
    },
    {
      label: state.data.accessType === "paid" ? "Price set" : "Free access configured",
      completed:
        state.data.accessType === "free_with_gate" ||
        (state.data.accessType === "paid" && state.data.price && parseFloat(state.data.price) >= 1),
    },
  ];

  const allComplete = checklist.every((item) => item.completed);

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-2">Ready to Launch?</h2>
          <p className="text-muted-foreground">
            Review your community details before publishing
          </p>
        </div>

        {/* Preview Card */}
        <Card className="bg-muted/50">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Preview</h3>
            <div className="flex items-start gap-4">
              {state.data.thumbnail ? (
                <img
                  src={state.data.thumbnail}
                  alt="Community thumbnail"
                  className="w-20 h-20 rounded-lg object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                  <Users className="w-8 h-8 text-white" />
                </div>
              )}
              <div className="flex-1">
                <h4 className="font-bold text-lg">{state.data.title || "Untitled Community"}</h4>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {state.data.description || "No description"}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {state.data.accessType === "paid" ? (
                    <>
                      <Shield className="w-4 h-4 text-purple-500" />
                      <p className="text-lg font-bold text-purple-600">
                        ${state.data.price || "10"}
                      </p>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4 text-green-500" />
                      <p className="text-lg font-bold text-green-600">Free</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What's Included */}
        <Card className="border-2 border-purple-500/50 bg-purple-50 dark:bg-purple-950/20">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">What Members Get</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500" />
                Exclusive community access
              </div>
              {state.data.discordInviteLink && (
                <div className="flex items-center gap-2 text-sm">
                  <MessageCircle className="w-4 h-4 text-[#5865F2]" />
                  Discord server invite
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500" />
                Direct connection with you
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500" />
                Network with other members
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Checklist */}
        <Card className={allComplete ? "border-green-500/50" : "border-amber-500/50"}>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">
              {allComplete ? "Ready to publish!" : "Complete these steps"}
            </h3>
            <div className="space-y-3">
              {checklist.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  {item.completed ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <X className="w-4 h-4 text-amber-500" />
                  )}
                  <span
                    className={
                      item.completed ? "text-muted-foreground" : "font-medium"
                    }
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Publish Note */}
        {allComplete && (
          <p className="text-sm text-center text-muted-foreground">
            Click "Publish Community" below to make your community live
          </p>
        )}
      </div>
    </Card>
  );
}

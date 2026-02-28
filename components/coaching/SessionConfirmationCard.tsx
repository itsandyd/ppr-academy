"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function SessionConfirmationCard({
  sessionId,
  userId,
  isCoach,
  otherPartyName,
}: {
  sessionId: Id<"coachingSessions">;
  userId: string;
  isCoach: boolean;
  otherPartyName: string;
}) {
  const confirmSession = useMutation(api.coachingSessionQueries.confirmSession);
  const reportNoShow = useMutation(api.coachingSessionQueries.reportNoShow);
  const [loading, setLoading] = useState<"confirm" | "noshow" | null>(null);

  const handleConfirm = async () => {
    setLoading("confirm");
    try {
      const result = await confirmSession({ sessionId, userId });
      if (result.success) {
        toast.success("Session confirmed! " + (isCoach ? "Payment will be released." : "Thank you for confirming."));
      } else {
        toast.error(result.error || "Failed to confirm session");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(null);
    }
  };

  const handleNoShow = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to report that ${otherPartyName} did not show up? This will ${isCoach ? "release the payment to you" : "trigger a full refund"}.`
    );
    if (!confirmed) return;

    setLoading("noshow");
    try {
      const result = await reportNoShow({ sessionId, userId });
      if (result.success) {
        toast.success(
          isCoach
            ? "No-show reported. Payment will be released to you."
            : "No-show reported. You will receive a full refund."
        );
      } else {
        toast.error(result.error || "Failed to report no-show");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card className="border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950/20">
      <CardContent className="p-4">
        <p className="mb-3 text-sm font-medium">
          Did this session with <strong>{otherPartyName}</strong> take place?
        </p>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={loading !== null}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading === "confirm" ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : (
              <CheckCircle className="mr-1 h-3 w-3" />
            )}
            Yes, it happened
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleNoShow}
            disabled={loading !== null}
          >
            {loading === "noshow" ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : (
              <XCircle className="mr-1 h-3 w-3" />
            )}
            {isCoach ? "Student no-show" : "Coach no-show"}
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          If no response within 48 hours, the session will be auto-confirmed.
        </p>
      </CardContent>
    </Card>
  );
}

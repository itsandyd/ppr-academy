"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Shield,
  AlertTriangle,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import Link from "next/link";

export const dynamic = "force-dynamic";

type CopyrightClaim = {
  _id: Id<"reports">;
  _creationTime: number;
  contentTitle?: string;
  status: "pending" | "reviewed" | "resolved" | "dismissed" | "counter_notice";
  copyrightClaim?: {
    claimantName: string;
    claimantEmail: string;
    originalWorkDescription: string;
    infringementDescription: string;
  };
  resolution?: string;
  reviewedAt?: number;
  takenDownAt?: number;
};

function StrikeIndicator({ strikeNumber, isActive }: { strikeNumber: number; isActive: boolean }) {
  return (
    <div
      className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
        isActive
          ? "bg-red-500 text-white"
          : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
      }`}
    >
      {strikeNumber}
    </div>
  );
}

function ClaimStatusBadge({ status }: { status: CopyrightClaim["status"] }) {
  const statusConfig = {
    pending: {
      variant: "secondary" as const,
      className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      label: "Pending Review",
    },
    reviewed: {
      variant: "secondary" as const,
      className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      label: "Under Review",
    },
    resolved: {
      variant: "destructive" as const,
      className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      label: "Claim Upheld",
    },
    dismissed: {
      variant: "secondary" as const,
      className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      label: "Dismissed",
    },
    counter_notice: {
      variant: "secondary" as const,
      className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      label: "Counter-Notice Filed",
    },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
}

export default function CopyrightDashboardPage() {
  const { user } = useUser();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const store = useQuery((api as any).stores.getUserStore, user?.id ? { userId: user.id } : "skip");

  const storeId = store?._id as Id<"stores"> | undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const claims = useQuery(
    (api as any).copyright.getStoreCopyrightClaims,
    storeId ? { storeId } : "skip"
  ) as CopyrightClaim[] | undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const strikeStatus = useQuery(
    (api as any).copyright.getStoreStrikeStatus,
    storeId ? { storeId } : "skip"
  ) as { strikes: number; isSuspended: boolean; strikeHistory: any[] } | undefined;

  const isLoading =
    store === undefined || (storeId && (claims === undefined || strikeStatus === undefined));

  if (!user) {
    return (
      <div className="mx-auto max-w-5xl p-4 md:p-6 pt-10">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Not Authenticated</AlertTitle>
          <AlertDescription>Please sign in to view your copyright status.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (store === null) {
    return (
      <div className="mx-auto max-w-5xl p-4 md:p-6 pt-10">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No Store Found</AlertTitle>
          <AlertDescription>
            You need to create a store before you can view copyright claims.
          </AlertDescription>
        </Alert>
        <Button asChild className="mt-4">
          <Link href="/dashboard?mode=create">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go to Dashboard
          </Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl p-4 md:p-6 pt-10">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-32 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-64 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    );
  }

  const pendingClaims = claims?.filter((c) => c.status === "pending") || [];
  const hasStrikes = strikeStatus && strikeStatus.strikes > 0;

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6 pb-24 pt-10">
      <div className="mb-6">
        <Button variant="ghost" asChild size="sm">
          <Link href="/dashboard?mode=create">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="mb-2 text-xl md:text-3xl font-bold">Copyright & DMCA</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage copyright claims against your content
        </p>
      </div>

      {strikeStatus?.isSuspended && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Account Suspended</AlertTitle>
          <AlertDescription>
            Your account has been suspended due to repeated copyright violations. Your products are
            hidden from the marketplace. Contact support@pauseplayrepeat.com for assistance.
          </AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Copyright Strike Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <StrikeIndicator strikeNumber={1} isActive={(strikeStatus?.strikes || 0) >= 1} />
              <StrikeIndicator strikeNumber={2} isActive={(strikeStatus?.strikes || 0) >= 2} />
              <StrikeIndicator strikeNumber={3} isActive={(strikeStatus?.strikes || 0) >= 3} />
            </div>
            <div className="text-right">
              {hasStrikes ? (
                <div>
                  <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                    {strikeStatus.strikes} of 3 strikes
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {3 - strikeStatus.strikes} remaining before suspension
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                    No strikes
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Your account is in good standing
                  </p>
                </div>
              )}
            </div>
          </div>

          {hasStrikes && strikeStatus.strikeHistory.length > 0 && (
            <div className="mt-6 border-t pt-6">
              <h4 className="mb-3 font-medium">Strike History</h4>
              <div className="space-y-2">
                {strikeStatus.strikeHistory.map((strike: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg bg-red-50 p-3 text-sm dark:bg-red-900/20"
                  >
                    <span className="font-medium">Strike {strike.strikeNumber}</span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {format(new Date(strike.issuedAt), "MMM d, yyyy")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {pendingClaims.length > 0 && (
        <Alert className="mb-6 border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
          <Clock className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800 dark:text-yellow-200">Action Required</AlertTitle>
          <AlertDescription className="text-yellow-700 dark:text-yellow-300">
            You have {pendingClaims.length} pending copyright claim(s). Review them below and submit
            a counter-notice if you believe the claim is invalid.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Copyright Claims ({claims?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!claims || claims.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">No copyright claims</h3>
              <p className="text-gray-600 dark:text-gray-400">
                You haven&apos;t received any copyright claims against your content.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {claims.map((claim) => (
                <Card key={claim._id} className="border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <h3 className="font-semibold">{claim.contentTitle || "Unknown Content"}</h3>
                        <ClaimStatusBadge status={claim.status} />
                      </div>

                      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <p>
                          <span className="font-medium">Claimant:</span>{" "}
                          {claim.copyrightClaim?.claimantName || "Unknown"}
                        </p>
                        <p>
                          <span className="font-medium">Filed:</span>{" "}
                          {formatDistanceToNow(new Date(claim._creationTime))} ago
                        </p>
                        {claim.copyrightClaim?.originalWorkDescription && (
                          <p className="mt-2">
                            <span className="font-medium">Original work:</span>{" "}
                            {claim.copyrightClaim.originalWorkDescription.substring(0, 150)}
                            {claim.copyrightClaim.originalWorkDescription.length > 150 ? "..." : ""}
                          </p>
                        )}
                      </div>

                      {claim.status === "resolved" && claim.takenDownAt && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                          <XCircle className="h-4 w-4" />
                          Content removed on {format(new Date(claim.takenDownAt), "MMM d, yyyy")}
                        </div>
                      )}

                      {claim.status === "dismissed" && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                          <CheckCircle className="h-4 w-4" />
                          Claim was dismissed - no action required
                        </div>
                      )}
                    </div>

                    {claim.status === "pending" && (
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/copyright/counter-notice?claim=${claim._id}`}>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          File Counter-Notice
                        </Link>
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-8 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
        <h3 className="mb-2 font-semibold">Need Help?</h3>
        <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
          If you have questions about a copyright claim or need legal guidance, please consult with
          a qualified attorney. For platform-specific questions, contact our support team.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dmca">View DMCA Policy</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="mailto:support@pauseplayrepeat.com">Contact Support</a>
          </Button>
        </div>
      </div>
    </div>
  );
}

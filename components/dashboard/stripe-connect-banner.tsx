"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DollarSign,
  CreditCard,
  CheckCircle2,
  ExternalLink,
  Loader2,
  AlertCircle,
  ArrowRight,
  Clock,
  Settings,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Link from "next/link";

type StripeStatus = "not_started" | "incomplete" | "restricted" | "enabled";

interface StripeAccountInfo {
  id: string;
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  status: string;
  isComplete: boolean;
}

interface StripeConnectBannerProps {
  /** "prominent" = large card for dashboard home, "compact" = inline alert for product creation */
  variant?: "prominent" | "compact";
  className?: string;
}

export function StripeConnectBanner({
  variant = "prominent",
  className,
}: StripeConnectBannerProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [accountInfo, setAccountInfo] = useState<StripeAccountInfo | null>(null);
  const [fetchError, setFetchError] = useState(false);

  const convexUser = useQuery(
    api.users.getUserFromClerk,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const userStore = useQuery(
    api.stores.getUserStore,
    user?.id ? { userId: user.id } : "skip"
  );

  const updateUser = useMutation(api.users.updateUserByClerkId);

  const stripeAccountId = convexUser?.stripeConnectAccountId;
  const storeId = userStore?._id;
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  // Determine the current status.
  // Use the live Stripe data (accountInfo) when available, but fall back to
  // the persisted Convex status so we don't flash "incomplete" while the
  // account-status API call is in flight.
  const getStatus = useCallback((): StripeStatus => {
    if (!stripeAccountId) return "not_started";
    if (accountInfo) {
      if (accountInfo.isComplete) return "enabled";
      if (accountInfo.detailsSubmitted) return "restricted";
      return "incomplete";
    }
    // accountInfo not yet fetched — use persisted Convex value as fallback
    if (convexUser?.stripeOnboardingComplete && convexUser?.stripeAccountStatus === "enabled") {
      return "enabled";
    }
    if (convexUser?.stripeAccountStatus === "restricted") return "restricted";
    // Still loading from Stripe — don't show a misleading banner
    if (isCheckingStatus) return "enabled"; // hide banner while loading
    return "incomplete";
  }, [stripeAccountId, accountInfo, convexUser?.stripeOnboardingComplete, convexUser?.stripeAccountStatus, isCheckingStatus]);

  // Fetch account status from Stripe
  useEffect(() => {
    if (!stripeAccountId) return;

    const checkStatus = async () => {
      setIsCheckingStatus(true);
      try {
        const res = await fetch("/api/stripe/connect/account-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accountId: stripeAccountId }),
        });
        const data = await res.json();
        if (data.success) {
          setAccountInfo(data.account);
          // Sync status to Convex if needed
          const newStatus = data.account.isComplete
            ? "enabled"
            : data.account.detailsSubmitted
              ? "restricted"
              : "pending";
          if (user?.id && newStatus !== convexUser?.stripeAccountStatus) {
            // Only upgrade stripeOnboardingComplete, never downgrade it.
            // The webhook may have already set it to true based on
            // details_submitted alone.
            const shouldUpdateOnboarding =
              data.account.isComplete || !convexUser?.stripeOnboardingComplete;
            await updateUser({
              clerkId: user.id,
              updates: {
                stripeAccountStatus: newStatus as "pending" | "restricted" | "enabled",
                ...(shouldUpdateOnboarding
                  ? { stripeOnboardingComplete: data.account.isComplete }
                  : {}),
              },
            });
          }
        }
      } catch {
        setFetchError(true);
      } finally {
        setIsCheckingStatus(false);
      }
    };
    checkStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stripeAccountId]);

  const handleSetupPayments = async () => {
    if (!user?.emailAddresses?.[0]?.emailAddress) {
      toast({
        title: "Error",
        description: "Email address is required to set up payments.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      let accountId = stripeAccountId;

      // Step 1: Create account if needed
      if (!accountId) {
        const createRes = await fetch("/api/stripe/connect/create-account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.emailAddresses[0].emailAddress,
            businessType: "individual",
            userId: user.id,
          }),
        });
        const createData = await createRes.json();
        if (!createData.success) {
          throw new Error(createData.error || "Failed to create Stripe account");
        }
        accountId = createData.accountId;

        // Save to Convex
        await updateUser({
          clerkId: user.id,
          updates: {
            stripeConnectAccountId: accountId,
            stripeAccountStatus: "pending",
          },
        });
      }

      // Step 2: Get onboarding link
      const onboardingRes = await fetch("/api/stripe/connect/onboarding-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, storeId }),
      });
      const onboardingData = await onboardingRes.json();
      if (!onboardingData.success) {
        throw new Error(onboardingData.error || "Failed to create onboarding link");
      }

      // Step 3: Open Stripe onboarding in new tab
      window.open(onboardingData.onboardingUrl, "_blank");

      toast({
        title: "Stripe setup opened",
        description: "Complete the setup in the new tab. Come back here when you're done.",
      });
    } catch (error) {
      toast({
        title: "Setup failed",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshStatus = async () => {
    if (!stripeAccountId) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/stripe/connect/account-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: stripeAccountId }),
      });
      const data = await res.json();
      if (data.success) {
        setAccountInfo(data.account);
        if (user?.id) {
          const newStatus = data.account.isComplete
            ? "enabled"
            : data.account.detailsSubmitted
              ? "restricted"
              : "pending";
          const shouldUpdateOnboarding =
            data.account.isComplete || !convexUser?.stripeOnboardingComplete;
          await updateUser({
            clerkId: user.id,
            updates: {
              stripeAccountStatus: newStatus as "pending" | "restricted" | "enabled",
              ...(shouldUpdateOnboarding
                ? { stripeOnboardingComplete: data.account.isComplete }
                : {}),
            },
          });
        }
        toast({
          title: data.account.isComplete ? "Payments active!" : "Status updated",
          description: data.account.isComplete
            ? "Your Stripe account is fully connected. You can now receive payments."
            : "Your Stripe setup is still in progress.",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Could not check account status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const status = getStatus();

  // Don't show banner if fully connected
  if (status === "enabled" && variant === "prominent") return null;
  if (status === "enabled" && variant === "compact") return null;

  // Still loading user data
  if (convexUser === undefined) return null;

  // --- COMPACT VARIANT (for product creation flow) ---
  if (variant === "compact") {
    if (status === "not_started") {
      return (
        <Alert className={cn("border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20", className)}>
          <DollarSign className="h-4 w-4 text-amber-600" />
          <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-amber-900 dark:text-amber-100">
              Set up Stripe to receive payments for paid products. You keep 90% of each sale.
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSetupPayments}
              disabled={isLoading}
              className="shrink-0 border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300"
            >
              {isLoading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <CreditCard className="mr-2 h-3 w-3" />}
              Set Up Payments
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    if (status === "incomplete") {
      return (
        <Alert className={cn("border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20", className)}>
          <Clock className="h-4 w-4 text-amber-600" />
          <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-amber-900 dark:text-amber-100">
              Your Stripe setup isn't complete. Finish it to start receiving payments.
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSetupPayments}
              disabled={isLoading}
              className="shrink-0 border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300"
            >
              {isLoading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Settings className="mr-2 h-3 w-3" />}
              Continue Setup
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    if (status === "restricted") {
      return (
        <Alert className={cn("border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20", className)}>
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-yellow-900 dark:text-yellow-100">
              Stripe needs additional verification before you can receive payments.
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSetupPayments}
              disabled={isLoading}
              className="shrink-0 border-yellow-300 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-700 dark:text-yellow-300"
            >
              {isLoading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <ExternalLink className="mr-2 h-3 w-3" />}
              Complete Verification
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  }

  // --- PROMINENT VARIANT (for dashboard home) ---
  if (status === "not_started") {
    return (
      <Card className={cn("border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 dark:border-purple-800 dark:from-purple-900/10 dark:to-blue-900/10", className)}>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Set up payments to start selling</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Connect Stripe to receive payments directly to your bank account.
                  You keep 90% of each sale &mdash; Pause Play Repeat takes a 10% platform fee.
                </p>
              </div>
            </div>
            <Button
              onClick={handleSetupPayments}
              disabled={isLoading}
              className="shrink-0 gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
              {isLoading ? "Setting up..." : "Set Up Payments"}
              {!isLoading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === "incomplete") {
    return (
      <Card className={cn("border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 dark:border-amber-800 dark:from-amber-900/10 dark:to-orange-900/10", className)}>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Finish setting up payments</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your Stripe account was created but setup isn't complete.
                  Continue where you left off to start receiving payments.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleRefreshStatus}
                disabled={isLoading}
                size="sm"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh Status"}
              </Button>
              <Button
                onClick={handleSetupPayments}
                disabled={isLoading}
                className="shrink-0 gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Settings className="h-4 w-4" />
                )}
                Continue Setup
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === "restricted") {
    return (
      <Card className={cn("border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50 dark:border-yellow-800 dark:from-yellow-900/10 dark:to-amber-900/10", className)}>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-500 to-amber-500">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Verification needed</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Stripe needs additional information to fully activate your account.
                  This may include verifying your identity or banking details.
                </p>
                <div className="mt-2 flex gap-3">
                  {accountInfo && (
                    <>
                      <Badge variant="outline" className={accountInfo.chargesEnabled ? "border-green-500/30 text-green-600" : "border-red-500/30 text-red-600"}>
                        {accountInfo.chargesEnabled ? "Charges: OK" : "Charges: Pending"}
                      </Badge>
                      <Badge variant="outline" className={accountInfo.payoutsEnabled ? "border-green-500/30 text-green-600" : "border-red-500/30 text-red-600"}>
                        {accountInfo.payoutsEnabled ? "Payouts: OK" : "Payouts: Pending"}
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleRefreshStatus}
                disabled={isLoading}
                size="sm"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
              </Button>
              <Button
                onClick={handleSetupPayments}
                disabled={isLoading}
                className="shrink-0 gap-2"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                Complete Verification
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}

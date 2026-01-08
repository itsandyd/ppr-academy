"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StripeConnectFlow } from "@/components/payments/stripe-connect-flow";
import {
  CreditCard,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Loader2,
  TrendingUp,
  Calendar,
  Settings,
  Banknote,
  Clock,
  History
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

export default function PayoutSettingsPage() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isRequestingPayout, setIsRequestingPayout] = useState(false);
  const [stripeAccountStatus, setStripeAccountStatus] = useState<any>(null);

  // Check for success/refresh params
  const success = searchParams.get("success");
  const refresh = searchParams.get("refresh");

  // Get user data from Convex
  const convexUser = useQuery(
    api.users.getUserFromClerk,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Get user's store
  const userStore = useQuery(
    api.stores.getUserStore,
    user?.id ? { userId: user.id } : "skip"
  );

  const storeId = userStore?._id;

  // Get pending earnings
  const pendingEarnings = useQuery(
    api.monetizationUtils.getCreatorPendingEarnings,
    user?.id ? { creatorId: user.id } : "skip"
  );

  // Get payout history
  const payoutHistory = useQuery(
    api.monetizationUtils.getCreatorPayouts,
    user?.id ? { creatorId: user.id } : "skip"
  );

  // Calculate totals from payout history
  const totalEarnings = payoutHistory
    ?.filter((p: { status: string }) => p.status === "completed")
    .reduce((sum: number, p: { netPayout: number }) => sum + p.netPayout, 0) || 0;

  const totalSales = payoutHistory
    ?.filter((p: { status: string }) => p.status === "completed")
    .reduce((sum: number, p: { totalSales: number }) => sum + p.totalSales, 0) || 0;

  // Update user with Stripe account info
  const updateUser = useMutation(api.users.updateUserByClerkId);

  useEffect(() => {
    if (success === "true") {
      toast({
        title: "Stripe Connect Setup Complete!",
        description: "Your payout account has been successfully configured.",
      });
    }
    
    if (refresh === "true") {
      toast({
        title: "Setup Incomplete",
        description: "Please complete your Stripe account setup to receive payouts.",
        variant: "destructive",
      });
    }
  }, [success, refresh, toast]);

  // Check Stripe account status if user has an account
  useEffect(() => {
    const checkAccountStatus = async () => {
      if (convexUser?.stripeConnectAccountId) {
        try {
          const response = await fetch("/api/stripe/connect/account-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ accountId: convexUser.stripeConnectAccountId }),
          });
          
          const data = await response.json();
          if (data.success) {
            setStripeAccountStatus(data.account);
          }
        } catch (error) {
          console.error("Failed to check account status:", error);
        }
      }
    };

    checkAccountStatus();
  }, [convexUser?.stripeConnectAccountId]);

  const handleCreateStripeAccount = async () => {
    if (!user?.emailAddresses?.[0]?.emailAddress) {
      toast({
        title: "Error",
        description: "Email address is required to set up payouts.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // 1. Create Stripe Connect account
      const createResponse = await fetch("/api/stripe/connect/create-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.emailAddresses[0].emailAddress,
          businessType: "individual",
        }),
      });

      const createData = await createResponse.json();
      
      if (!createData.success) {
        throw new Error(createData.error || "Failed to create account");
      }

      // 2. Update user with Stripe account ID
      await updateUser({
        clerkId: user.id,
        updates: {
          stripeConnectAccountId: createData.accountId,
        },
      });

      // 3. Create onboarding link
      const onboardingResponse = await fetch("/api/stripe/connect/onboarding-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: createData.accountId,
          storeId,
        }),
      });

      const onboardingData = await onboardingResponse.json();
      
      if (!onboardingData.success) {
        throw new Error(onboardingData.error || "Failed to create onboarding link");
      }

      // 4. Redirect to Stripe onboarding
      window.location.href = onboardingData.onboardingUrl;

    } catch (error) {
      console.error("Stripe Connect setup error:", error);
      toast({
        title: "Setup Failed",
        description: error instanceof Error ? error.message : "Failed to set up Stripe Connect",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryOnboarding = async () => {
    if (!convexUser?.stripeConnectAccountId) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/stripe/connect/onboarding-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: convexUser.stripeConnectAccountId,
          storeId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        window.location.href = data.onboardingUrl;
      } else {
        throw new Error(data.error || "Failed to create onboarding link");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to restart onboarding process.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestPayout = async () => {
    if (!convexUser?.stripeConnectAccountId || !pendingEarnings) return;

    setIsRequestingPayout(true);

    try {
      const response = await fetch("/api/payouts/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          stripeConnectAccountId: convexUser.stripeConnectAccountId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Payout Requested!",
          description: `$${(data.payout.amount / 100).toFixed(2)} is being transferred to your account.`,
        });
      } else {
        throw new Error(data.error || "Failed to request payout");
      }
    } catch (error) {
      toast({
        title: "Payout Failed",
        description: error instanceof Error ? error.message : "Failed to process payout request.",
        variant: "destructive",
      });
    } finally {
      setIsRequestingPayout(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "enabled":
        return <Badge className="bg-green-500/10 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-500/20">Active</Badge>;
      case "restricted":
        return <Badge className="bg-yellow-500/10 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border border-yellow-500/20">Restricted</Badge>;
      case "pending":
        return <Badge className="bg-muted text-muted-foreground border border-border">Pending</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (!user || !convexUser || userStore === undefined) {
    return (
      <div className="max-w-4xl mx-auto px-8 pt-10 pb-24">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-8"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  // If user doesn't have a store yet, show a message
  if (!userStore) {
    return (
      <div className="max-w-4xl mx-auto px-8 pt-10 pb-24">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">No Store Found</h2>
            <p className="text-muted-foreground">
              You need to create a store before you can set up payouts.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-8 pt-10 pb-24 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Payout Settings</h1>
        <p className="text-muted-foreground">
          Connect your Stripe account to receive payments from course sales and other products.
        </p>
      </div>

      {/* Stripe Connect Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Stripe Connect Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!convexUser.stripeConnectAccountId ? (
            /* Enhanced Stripe Connect Flow */
            <StripeConnectFlow
              currentStep={isLoading ? "connecting" : "not-started"}
              onConnect={handleCreateStripeAccount}
              stripeAccountId={convexUser.stripeConnectAccountId}
              verificationStatus={
                stripeAccountStatus?.chargesEnabled ? "verified" :
                stripeAccountStatus?.detailsSubmitted ? "pending" :
                "pending"
              }
            />
          ) : (
            /* Has Stripe Account */
            <div className="space-y-6">
              {/* Account Status */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/10 dark:bg-green-500/20 rounded-full flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Stripe Account Connected</h4>
                    <p className="text-sm text-muted-foreground">Account ID: {convexUser.stripeConnectAccountId}</p>
                  </div>
                </div>
                {stripeAccountStatus && getStatusBadge(stripeAccountStatus.status)}
              </div>

              {/* Account Details */}
              {stripeAccountStatus && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle className={`w-5 h-5 ${
                          stripeAccountStatus.detailsSubmitted ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                        }`} />
                        <div>
                          <p className="font-medium text-sm text-foreground">Details Submitted</p>
                          <p className="text-xs text-muted-foreground">
                            {stripeAccountStatus.detailsSubmitted ? "Complete" : "Pending"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <CreditCard className={`w-5 h-5 ${
                          stripeAccountStatus.chargesEnabled ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                        }`} />
                        <div>
                          <p className="font-medium text-sm text-foreground">Charges Enabled</p>
                          <p className="text-xs text-muted-foreground">
                            {stripeAccountStatus.chargesEnabled ? "Can receive payments" : "Not yet enabled"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <DollarSign className={`w-5 h-5 ${
                          stripeAccountStatus.payoutsEnabled ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                        }`} />
                        <div>
                          <p className="font-medium text-sm text-foreground">Payouts Enabled</p>
                          <p className="text-xs text-muted-foreground">
                            {stripeAccountStatus.payoutsEnabled ? "Can receive payouts" : "Not yet enabled"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                {stripeAccountStatus && !stripeAccountStatus.isComplete && (
                  <Button 
                    onClick={handleRetryOnboarding}
                    disabled={isLoading}
                    variant="outline"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Settings className="w-4 h-4 mr-2" />
                        Complete Setup
                      </>
                    )}
                  </Button>
                )}
                
                <Button variant="outline" asChild>
                  <a 
                    href="https://dashboard.stripe.com/connect/accounts/overview" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Stripe Dashboard
                  </a>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Earnings Overview */}
      {convexUser.stripeConnectAccountId && stripeAccountStatus?.isComplete && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Earnings Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-green-500/10 dark:bg-green-500/20 rounded-lg border border-green-500/20">
                <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                  {formatCurrency(totalEarnings + (pendingEarnings?.netEarnings || 0))}
                </div>
                <p className="text-sm text-green-600 dark:text-green-500">Total Earnings</p>
              </div>
              <div className="text-center p-4 bg-blue-500/10 dark:bg-blue-500/20 rounded-lg border border-blue-500/20">
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                  {totalSales + (pendingEarnings?.totalSales || 0)}
                </div>
                <p className="text-sm text-blue-600 dark:text-blue-500">Total Sales</p>
              </div>
              <div className="text-center p-4 bg-purple-500/10 dark:bg-purple-500/20 rounded-lg border border-purple-500/20">
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                  {formatCurrency(totalEarnings)}
                </div>
                <p className="text-sm text-purple-600 dark:text-purple-500">Paid Out</p>
              </div>
              <div className="text-center p-4 bg-orange-500/10 dark:bg-orange-500/20 rounded-lg border border-orange-500/20">
                <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                  {formatCurrency(pendingEarnings?.netEarnings || 0)}
                </div>
                <p className="text-sm text-orange-600 dark:text-orange-500">Available for Payout</p>
              </div>
            </div>

            {/* Request Payout Section */}
            {pendingEarnings && pendingEarnings.netEarnings > 0 && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">Ready to cash out?</h4>
                    <p className="text-sm text-muted-foreground">
                      You have {formatCurrency(pendingEarnings.netEarnings)} available from{" "}
                      {pendingEarnings.totalSales} sale{pendingEarnings.totalSales !== 1 ? "s" : ""}.
                    </p>
                  </div>
                  <Button
                    onClick={handleRequestPayout}
                    disabled={isRequestingPayout || pendingEarnings.netEarnings < 2500}
                    className="gap-2"
                  >
                    {isRequestingPayout ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Banknote className="w-4 h-4" />
                        Request Payout
                      </>
                    )}
                  </Button>
                </div>
                {pendingEarnings.netEarnings < 2500 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Minimum payout amount is $25. You need {formatCurrency(2500 - pendingEarnings.netEarnings)} more.
                  </p>
                )}
              </div>
            )}

            <Alert className="mt-6">
              <Calendar className="w-4 h-4" />
              <AlertDescription>
                Request payouts anytime once you reach the $25 minimum. Funds typically arrive in 2-3 business days.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Payout History */}
      {convexUser.stripeConnectAccountId && payoutHistory && payoutHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Payout History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {payoutHistory.map((payout: {
                _id: string;
                status: string;
                netPayout: number;
                totalSales: number;
                createdAt: number;
              }) => (
                <div
                  key={payout._id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        payout.status === "completed"
                          ? "bg-green-500/10 dark:bg-green-500/20"
                          : payout.status === "processing"
                          ? "bg-blue-500/10 dark:bg-blue-500/20"
                          : payout.status === "failed"
                          ? "bg-red-500/10 dark:bg-red-500/20"
                          : "bg-muted"
                      }`}
                    >
                      {payout.status === "completed" ? (
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : payout.status === "processing" ? (
                        <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      ) : payout.status === "failed" ? (
                        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      ) : (
                        <Clock className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {formatCurrency(payout.netPayout)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {payout.totalSales} sale{payout.totalSales !== 1 ? "s" : ""} •{" "}
                        {formatDistanceToNow(new Date(payout.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={
                      payout.status === "completed"
                        ? "bg-green-500/10 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-500/20"
                        : payout.status === "processing"
                        ? "bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-500/20"
                        : payout.status === "failed"
                        ? "bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/20"
                        : "bg-muted text-muted-foreground border border-border"
                    }
                  >
                    {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Platform Fee Information */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Fees</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg border border-border">
              <span className="font-medium text-foreground">Course Sales</span>
              <span className="text-sm text-muted-foreground">10% platform fee</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg border border-border">
              <span className="font-medium text-foreground">Stripe Processing</span>
              <span className="text-sm text-muted-foreground">2.9% + 30¢ per transaction</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Example: $100 course sale = $87.40 to you ($10 platform fee + $2.60 Stripe fee)
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help & Support */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              If you're having trouble with your payout setup or have questions about fees and payments, we're here to help.
            </p>
            <div className="flex gap-4">
              <Button variant="outline" size="sm">
                Contact Support
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="https://stripe.com/docs/connect" target="_blank" rel="noopener noreferrer">
                  Stripe Documentation
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

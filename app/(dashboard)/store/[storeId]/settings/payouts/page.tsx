"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useParams, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CreditCard, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  ExternalLink,
  Loader2,
  TrendingUp,
  Calendar,
  Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PayoutSettingsPage() {
  const { user } = useUser();
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const storeId = params.storeId as string;
  
  const [isLoading, setIsLoading] = useState(false);
  const [stripeAccountStatus, setStripeAccountStatus] = useState<any>(null);
  
  // Check for success/refresh params
  const success = searchParams.get("success");
  const refresh = searchParams.get("refresh");

  // Get user data from Convex
  const convexUser = useQuery(
    api.users.getUserFromClerk,
    user?.id ? { clerkId: user.id } : "skip"
  );

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
        stripeConnectAccountId: createData.accountId,
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "enabled":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "restricted":
        return <Badge className="bg-yellow-100 text-yellow-800">Restricted</Badge>;
      case "pending":
        return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (!user || !convexUser) {
    return (
      <div className="max-w-4xl mx-auto px-8 pt-10 pb-24">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-8"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
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
            /* No Stripe Account */
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <CreditCard className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Connect Your Stripe Account</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                To receive payments from course sales, you'll need to connect a Stripe account. 
                This process takes just a few minutes and is completely secure.
              </p>
              
              <Button 
                onClick={handleCreateStripeAccount}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Connect Stripe Account
                  </>
                )}
              </Button>
              
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-left">
                    <h4 className="font-medium text-blue-800 mb-1">What happens next?</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Secure redirect to Stripe's onboarding</li>
                      <li>• Provide basic business information</li>
                      <li>• Verify your identity and bank account</li>
                      <li>• Start receiving payments within 24 hours</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Has Stripe Account */
            <div className="space-y-6">
              {/* Account Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Stripe Account Connected</h4>
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
                          stripeAccountStatus.detailsSubmitted ? "text-green-600" : "text-gray-400"
                        }`} />
                        <div>
                          <p className="font-medium text-sm">Details Submitted</p>
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
                          stripeAccountStatus.chargesEnabled ? "text-green-600" : "text-gray-400"
                        }`} />
                        <div>
                          <p className="font-medium text-sm">Charges Enabled</p>
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
                          stripeAccountStatus.payoutsEnabled ? "text-green-600" : "text-gray-400"
                        }`} />
                        <div>
                          <p className="font-medium text-sm">Payouts Enabled</p>
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
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">$0</div>
                <p className="text-sm text-green-600">Total Earnings</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">0</div>
                <p className="text-sm text-blue-600">Course Sales</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-700">$0</div>
                <p className="text-sm text-purple-600">This Month</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-700">$0</div>
                <p className="text-sm text-orange-600">Pending Payout</p>
              </div>
            </div>
            
            <Alert className="mt-6">
              <Calendar className="w-4 h-4" />
              <AlertDescription>
                Payouts are processed weekly on Fridays. Minimum payout amount is $25.
              </AlertDescription>
            </Alert>
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
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">Course Sales</span>
              <span className="text-sm text-muted-foreground">10% platform fee</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">Stripe Processing</span>
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

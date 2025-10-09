"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ExternalLink, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function SubscriptionsPage() {
  const { user } = useUser();
  
  const subscriptions = user
    ? useQuery(api.subscriptions.getUserSubscriptions, { userId: user.id })
    : null;

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const activeSubscriptions = subscriptions?.filter((sub) => sub.status === "active");
  const inactiveSubscriptions = subscriptions?.filter((sub) => sub.status !== "active");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">My Subscriptions</h1>
        <p className="text-muted-foreground mt-2">
          Manage your creator subscriptions and access all your content
        </p>
      </div>

      {/* Active Subscriptions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Active Subscriptions</h2>
        
        {!activeSubscriptions || activeSubscriptions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                You don't have any active subscriptions yet.
              </p>
              <Button onClick={() => window.location.href = "/"}>
                Browse Creators
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSubscriptions.map((subscription) => (
              <Card key={subscription._id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{subscription.plan?.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {subscription.store?.name || "Creator Store"}
                      </CardDescription>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  {/* Billing Info */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Billing Cycle</span>
                      <span className="font-medium capitalize">{subscription.billingCycle}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="font-medium">
                        ${(subscription.amountPaid / 100).toFixed(2)}/{subscription.billingCycle === "monthly" ? "mo" : "yr"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Next Billing</span>
                      <span className="font-medium">
                        {subscription.nextBillingDate
                          ? format(new Date(subscription.nextBillingDate), "MMM d, yyyy")
                          : "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Trial Info */}
                  {subscription.status === "trialing" && subscription.trialEnd && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <p className="text-sm text-blue-900 dark:text-blue-100">
                        Trial ends {format(new Date(subscription.trialEnd), "MMM d, yyyy")}
                      </p>
                    </div>
                  )}

                  {/* What's Included */}
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-2">Includes:</p>
                    <div className="space-y-1">
                      {subscription.plan?.hasAllCourses && (
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary" />
                          <span>All Courses</span>
                        </div>
                      )}
                      {subscription.plan?.hasAllProducts && (
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary" />
                          <span>All Products</span>
                        </div>
                      )}
                      {subscription.plan?.features.slice(0, 2).map((feature: string, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.open(`https://billing.stripe.com/p/login/${subscription.stripeSubscriptionId}`, "_blank")}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Manage Billing
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Inactive/Canceled Subscriptions */}
      {inactiveSubscriptions && inactiveSubscriptions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Past Subscriptions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inactiveSubscriptions.map((subscription) => (
              <Card key={subscription._id} className="flex flex-col opacity-60">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{subscription.plan?.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {subscription.store?.name || "Creator Store"}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">{subscription.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <span className="font-medium capitalize">{subscription.status}</span>
                    </div>
                    {subscription.canceledAt && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Canceled On</span>
                        <span className="font-medium">
                          {format(new Date(subscription.canceledAt), "MMM d, yyyy")}
                        </span>
                      </div>
                    )}
                    {subscription.cancelAtPeriodEnd && subscription.currentPeriodEnd && (
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                        <p className="text-sm text-yellow-900 dark:text-yellow-100">
                          Access continues until {format(new Date(subscription.currentPeriodEnd), "MMM d, yyyy")}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <strong>To cancel a subscription:</strong> Click "Manage Billing" and follow the Stripe portal instructions.
          </p>
          <p>
            <strong>Questions about access?</strong> Contact the creator directly through their store page.
          </p>
          <p className="text-muted-foreground">
            Note: When you cancel, you'll keep access until the end of your current billing period.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}


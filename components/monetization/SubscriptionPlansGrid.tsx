"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SubscriptionPlansGridProps {
  storeId: Id<"stores">;
  userId?: string;
}

export function SubscriptionPlansGrid({ storeId, userId }: SubscriptionPlansGridProps) {
  const plans = useQuery(api.subscriptions.getSubscriptionPlans, { storeId });
  const createSubscription = useMutation(api.subscriptions.createSubscription);
  const { toast } = useToast();

  const handleSubscribe = async (planId: Id<"subscriptionPlans">, billingCycle: "monthly" | "yearly") => {
    if (!userId) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to subscribe",
        variant: "destructive",
      });
      return;
    }

    try {
      await createSubscription({
        userId,
        planId,
        billingCycle,
      });

      toast({
        title: "Subscription created!",
        description: "Your subscription is now active",
        className: "bg-white dark:bg-black",
      });
    } catch (error: any) {
      toast({
        title: "Subscription failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!plans || plans.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No subscription plans available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {plans.map((plan) => (
        <Card key={plan._id} className="flex flex-col">
          <CardHeader>
            <CardTitle>{plan.name}</CardTitle>
            <CardDescription>{plan.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="mb-6">
              <div className="text-3xl font-bold">
                ${(plan.monthlyPrice / 100).toFixed(2)}
                <span className="text-base font-normal text-muted-foreground">/month</span>
              </div>
              <div className="text-sm text-muted-foreground">
                or ${(plan.yearlyPrice / 100).toFixed(2)}/year
              </div>
            </div>

            <div className="space-y-2">
              {plan.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button
              className="w-full"
              onClick={() => handleSubscribe(plan._id, "monthly")}
            >
              Subscribe Monthly
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => handleSubscribe(plan._id, "yearly")}
            >
              Subscribe Yearly (Save {Math.round((1 - (plan.yearlyPrice / 12) / plan.monthlyPrice) * 100)}%)
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}






"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Users, DollarSign, TrendingUp } from "lucide-react";
import { useState } from "react";
import { CreateSubscriptionPlanDialog } from "./components/CreateSubscriptionPlanDialog";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";

export default function SubscriptionPlansPage({ params }: { params: { storeId: string } }) {
  const storeId = params.storeId as Id<"stores">;
  const { user } = useUser();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);

  const plans = useQuery(api.subscriptions.getSubscriptionPlans, { storeId });
  const stats = useQuery(api.subscriptions.getStoreSubscriptionStats, { storeId });
  const deletePlan = useMutation(api.subscriptions.deleteSubscriptionPlan);

  const handleDeletePlan = async (planId: Id<"subscriptionPlans">) => {
    if (
      !confirm("Are you sure you want to delete this plan? This will prevent new subscriptions.")
    ) {
      return;
    }

    try {
      await deletePlan({ planId });
      toast.success("Plan deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete plan");
    }
  };

  return (
    <div className="container mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subscription Plans</h1>
          <p className="mt-1 text-muted-foreground">Create subscription tiers for your content</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Create Plan
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
              <p className="mt-1 text-xs text-muted-foreground">
                {stats.trialingSubscriptions} on trial
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Monthly MRR</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(stats.totalMRR / 100).toFixed(2)}</div>
              <p className="mt-1 text-xs text-muted-foreground">Recurring revenue</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSubscriptions}</div>
              <p className="mt-1 text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats.churnRate * 100).toFixed(1)}%</div>
              <p className="mt-1 text-xs text-muted-foreground">
                {stats.canceledSubscriptions} canceled
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Plans List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Plans</h2>

        {!plans || plans.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="mb-4 text-muted-foreground">
                No subscription plans yet. Create your first one!
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Plan
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan: any) => (
              <Card key={plan._id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{plan.name}</CardTitle>
                      <CardDescription className="mt-1">Tier {plan.tier}</CardDescription>
                    </div>
                    {plan.isActive ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div>
                    <p className="text-2xl font-bold">
                      ${(plan.monthlyPrice / 100).toFixed(2)}
                      <span className="text-sm font-normal text-muted-foreground">/month</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      or ${(plan.yearlyPrice / 100).toFixed(2)}/year
                      <span className="ml-1 text-green-600">
                        (save {Math.round((1 - plan.yearlyPrice / 12 / plan.monthlyPrice) * 100)}%)
                      </span>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Includes:</p>
                    {plan.hasAllCourses && <Badge variant="secondary">All Courses</Badge>}
                    {plan.hasAllProducts && (
                      <Badge variant="secondary" className="ml-2">
                        All Products
                      </Badge>
                    )}
                    {!plan.hasAllCourses && plan.courseAccess.length > 0 && (
                      <Badge variant="secondary">
                        {plan.courseAccess.length} Course{plan.courseAccess.length > 1 ? "s" : ""}
                      </Badge>
                    )}
                    {!plan.hasAllProducts && plan.digitalProductAccess.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {plan.digitalProductAccess.length} Product
                        {plan.digitalProductAccess.length > 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1">
                    {plan.features.slice(0, 3).map((feature: string, index: number) => (
                      <p key={index} className="flex items-start text-sm text-muted-foreground">
                        <span className="mr-2">✓</span>
                        {feature}
                      </p>
                    ))}
                    {plan.features.length > 3 && (
                      <p className="text-sm text-muted-foreground">
                        +{plan.features.length - 3} more features
                      </p>
                    )}
                  </div>

                  <div className="border-t pt-2">
                    <p className="text-sm text-muted-foreground">
                      <Users className="mr-1 inline h-3 w-3" />
                      {plan.currentStudents} active subscriber
                      {plan.currentStudents !== 1 ? "s" : ""}
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setEditingPlan(plan);
                      setShowCreateDialog(true);
                    }}
                  >
                    <Edit className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeletePlan(plan._id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <CreateSubscriptionPlanDialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) setEditingPlan(null);
        }}
        storeId={storeId}
        creatorId={user?.id || ""}
        existingPlan={editingPlan}
      />
    </div>
  );
}

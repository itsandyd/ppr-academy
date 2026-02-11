"use client";

import React from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Crown,
  Users,
  DollarSign,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ArrowLeft,
  Calendar,
  ExternalLink,
  BookOpen,
  ShoppingBag,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export const dynamic = "force-dynamic";

export default function MembershipsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get("mode") as "learn" | "create" | null;
  const { user, isLoaded: isUserLoaded } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    if (!mode || (mode !== "learn" && mode !== "create")) {
      router.push("/dashboard/memberships?mode=learn");
    }
  }, [mode, router]);

  if (mode === "learn") {
    return <LearnModeMemberships />;
  }

  return <CreateModeMemberships />;
}

// ─── Learn Mode: User's Subscriptions ──────────────────────────────────────────

function LearnModeMemberships() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { toast } = useToast();

  const convexUser = useQuery(
    api.users.getUserFromClerk,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const memberships = useQuery(
    api.memberships.getUserMemberships,
    convexUser?.clerkId ? { userId: convexUser.clerkId } : "skip"
  );

  const cancelMembership = useMutation(api.memberships.cancelMembership);

  const isLoading = !isUserLoaded || (user && convexUser === undefined) || memberships === undefined;

  const activeMemberships = memberships?.filter((m: any) => m.status === "active") || [];
  const canceledMemberships =
    memberships?.filter((m: any) => m.status === "canceled" || m.cancelAtPeriodEnd) || [];

  const handleCancel = async (subscriptionId: string) => {
    try {
      await cancelMembership({
        subscriptionId: subscriptionId as Id<"userCreatorSubscriptions">,
      });
      toast({
        title: "Subscription Canceled",
        description: "Your access will continue until the end of your billing period.",
      });
    } catch {
      toast({ title: "Failed to cancel subscription", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div>
            <Skeleton className="mb-2 h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
            <Crown className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">My Memberships</h1>
            <p className="text-muted-foreground">
              {activeMemberships.length > 0
                ? `${activeMemberships.length} active membership${activeMemberships.length !== 1 ? "s" : ""}`
                : "Subscribe to creators for ongoing access"}
            </p>
          </div>
        </div>
        <Link href="/dashboard?mode=learn">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Active Memberships */}
      {memberships && memberships.length > 0 ? (
        <div className="space-y-6">
          {activeMemberships.length > 0 && (
            <div>
              <h2 className="mb-4 text-lg font-semibold">Active Subscriptions</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {activeMemberships.map((sub: any) => (
                  <SubscriptionCard
                    key={sub._id}
                    subscription={sub}
                    onCancel={handleCancel}
                  />
                ))}
              </div>
            </div>
          )}

          {canceledMemberships.length > 0 && (
            <div>
              <h2 className="mb-4 text-lg font-semibold text-muted-foreground">
                Canceled / Ending
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {canceledMemberships.map((sub: any) => (
                  <SubscriptionCard
                    key={sub._id}
                    subscription={sub}
                    onCancel={handleCancel}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Crown className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h3 className="mb-2 text-xl font-semibold">No Active Memberships</h3>
          <p className="mx-auto mb-6 max-w-md text-muted-foreground">
            Subscribe to creator memberships for ongoing access to exclusive courses, products, and
            content.
          </p>
          <Link href="/marketplace/memberships">
            <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
              <Crown className="mr-2 h-4 w-4" />
              Browse Memberships
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}

function SubscriptionCard({
  subscription,
  onCancel,
}: {
  subscription: any;
  onCancel: (id: string) => void;
}) {
  const isActive = subscription.status === "active" && !subscription.cancelAtPeriodEnd;
  const isCanceling = subscription.cancelAtPeriodEnd;
  const isCanceled = subscription.status === "canceled";

  const renewalDate = subscription.renewalDate
    ? new Date(subscription.renewalDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <Card className={isCanceled ? "border-dashed opacity-75" : ""}>
      <CardContent className="p-5">
        {/* Creator Info */}
        <div className="mb-4 flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={subscription.creator?.imageUrl} />
            <AvatarFallback className="bg-gradient-to-r from-amber-500 to-orange-500 text-xs text-white">
              {subscription.creator?.name?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{subscription.creator?.name || "Creator"}</p>
            <p className="truncate text-sm text-muted-foreground">
              {subscription.store?.name || "Store"}
            </p>
          </div>
          <Badge
            className={
              isActive
                ? "border-green-500/20 bg-green-500/10 text-green-600"
                : isCanceling
                  ? "border-amber-500/20 bg-amber-500/10 text-amber-600"
                  : "border-muted bg-muted/50 text-muted-foreground"
            }
          >
            {isActive ? "Active" : isCanceling ? "Ending" : "Canceled"}
          </Badge>
        </div>

        {/* Tier Info */}
        <div className="mb-3">
          <h3 className="font-semibold">{subscription.tier?.tierName || "Membership"}</h3>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl font-bold text-amber-600">
              ${subscription.tier?.priceMonthly?.toFixed(2) || "0.00"}
            </span>
            <span className="text-sm text-muted-foreground">/mo</span>
          </div>
        </div>

        {/* Benefits preview */}
        {subscription.tier?.benefits && subscription.tier.benefits.length > 0 && (
          <div className="mb-3 space-y-1">
            {subscription.tier.benefits.slice(0, 3).map((benefit: string, i: number) => (
              <p key={i} className="text-xs text-muted-foreground">
                &bull; {benefit}
              </p>
            ))}
            {subscription.tier.benefits.length > 3 && (
              <p className="text-xs text-muted-foreground">
                +{subscription.tier.benefits.length - 3} more
              </p>
            )}
          </div>
        )}

        {/* Renewal / Status info */}
        <div className="flex items-center justify-between border-t pt-3 text-sm text-muted-foreground">
          {renewalDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {isCanceling ? "Access until" : "Renews"} {renewalDate}
            </div>
          )}
          <div className="flex items-center gap-2">
            {subscription.store?.slug && (
              <Link href={`/${subscription.store.slug}`}>
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  <ExternalLink className="mr-1 h-3 w-3" />
                  Store
                </Button>
              </Link>
            )}
            {isActive && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-red-500 hover:text-red-600"
                onClick={() => onCancel(subscription._id)}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Create Mode: Creator's Tier Management ────────────────────────────────────

function CreateModeMemberships() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { toast } = useToast();

  const stores = useQuery(
    api.stores.getStoresByUser,
    user?.id ? { userId: user.id } : "skip"
  );
  const store = stores?.[0];

  const storeId = store?._id;

  const tiers = useQuery(
    api.memberships.getMembershipTiersByStore,
    storeId ? { storeId, includeInactive: true } : "skip"
  );

  const subscribers = useQuery(
    api.memberships.getStoreSubscribers,
    storeId ? { storeId } : "skip"
  );

  const publishTier = useMutation(api.memberships.publishMembershipTier);
  const unpublishTier = useMutation(api.memberships.unpublishMembershipTier);
  const deleteTier = useMutation(api.memberships.deleteMembershipTier);

  const isLoading = !isUserLoaded || stores === undefined || (store && tiers === undefined);

  const activeTiers = tiers?.filter((t: any) => t.isActive) || [];
  const activeSubscribers = subscribers?.filter((s: any) => s.status === "active") || [];

  const monthlyRevenue = activeSubscribers.reduce((sum: number, sub: any) => {
    const tier = tiers?.find((t: any) => t._id === sub.tierId);
    return sum + (tier?.priceMonthly || 0);
  }, 0);

  const handlePublish = async (tierId: string) => {
    try {
      await publishTier({ tierId: tierId as Id<"creatorSubscriptionTiers"> });
      toast({ title: "Membership Published", description: "Tier is now visible to subscribers." });
    } catch (error: any) {
      toast({
        title: "Publish Failed",
        description: error?.message || "Stripe price ID may be missing. Try saving the tier first.",
        variant: "destructive",
      });
    }
  };

  const handleUnpublish = async (tierId: string) => {
    try {
      await unpublishTier({ tierId: tierId as Id<"creatorSubscriptionTiers"> });
      toast({ title: "Membership Unpublished", description: "Tier is now hidden." });
    } catch {
      toast({ title: "Failed to unpublish", variant: "destructive" });
    }
  };

  const handleDelete = async (tierId: string) => {
    try {
      const result = await deleteTier({ tierId: tierId as Id<"creatorSubscriptionTiers"> });
      toast({ title: result.message || "Tier deleted" });
    } catch {
      toast({ title: "Failed to delete tier", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div>
            <Skeleton className="mb-2 h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <Card className="p-12 text-center">
        <Crown className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
        <h3 className="mb-2 text-xl font-semibold">Store Required</h3>
        <p className="mx-auto mb-6 max-w-md text-muted-foreground">
          Create a store first to start offering memberships.
        </p>
        <Link href="/dashboard?mode=create">
          <Button>Create Store</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
            <Crown className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Memberships</h1>
            <p className="text-muted-foreground">
              {tiers && tiers.length > 0
                ? `${activeTiers.length} active tier${activeTiers.length !== 1 ? "s" : ""}, ${activeSubscribers.length} subscriber${activeSubscribers.length !== 1 ? "s" : ""}`
                : "Create subscription tiers for your audience"}
            </p>
          </div>
        </div>
        <Link href="/dashboard/create/membership">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Membership
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Crown className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Tiers</p>
              <p className="text-2xl font-bold">{tiers?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Subscribers</p>
              <p className="text-2xl font-bold">{activeSubscribers.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monthly Revenue</p>
              <p className="text-2xl font-bold">${monthlyRevenue.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tier Grid */}
      {tiers && tiers.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tiers.map((tier: any) => {
            const tierSubscribers = activeSubscribers.filter(
              (s: any) => s.tierId === tier._id
            ).length;

            return (
              <Card
                key={tier._id}
                className={tier.isActive ? "" : "border-dashed opacity-75"}
              >
                <CardContent className="p-5">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <h3 className="font-semibold">{tier.tierName}</h3>
                        <Badge
                          className={
                            tier.isActive
                              ? "border-green-500/20 bg-green-500/10 text-green-600"
                              : "border-muted bg-muted/50 text-muted-foreground"
                          }
                        >
                          {tier.isActive ? "Active" : "Draft"}
                        </Badge>
                      </div>
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {tier.description}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/create/membership?tierId=${tier._id}`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        {tier.isActive ? (
                          <DropdownMenuItem onClick={() => handleUnpublish(tier._id)}>
                            <EyeOff className="mr-2 h-4 w-4" />
                            Unpublish
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handlePublish(tier._id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Publish
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(tier._id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mb-3 flex items-baseline gap-1">
                    <span className="text-2xl font-bold">
                      ${tier.priceMonthly.toFixed(2)}
                    </span>
                    <span className="text-sm text-muted-foreground">/mo</span>
                    {tier.priceYearly && (
                      <span className="ml-2 text-sm text-muted-foreground">
                        ${tier.priceYearly.toFixed(2)}/yr
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t pt-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {tierSubscribers} subscriber{tierSubscribers !== 1 ? "s" : ""}
                    </div>
                    <div>
                      {tier.includedCourseIds?.length || 0} courses &middot;{" "}
                      {tier.includedProductIds?.length || 0} products
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Crown className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h3 className="mb-2 text-xl font-semibold">No Membership Tiers Yet</h3>
          <p className="mx-auto mb-6 max-w-md text-muted-foreground">
            Create subscription tiers to offer recurring access to your courses, products, and
            exclusive content.
          </p>
          <Link href="/dashboard/create/membership">
            <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Membership
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}

"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AffiliateDashboard } from "@/components/monetization/AffiliateDashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function AffiliatePortalPage() {
  const { user } = useUser();

  const affiliates = useQuery(
    api.affiliates.getAffiliateByUser,
    user ? { userId: user.id } : "skip"
  );

  if (!user) {
    return (
      <div className="container mx-auto py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
        <p className="text-muted-foreground">You need to be signed in to view your affiliate dashboard</p>
      </div>
    );
  }

  if (!affiliates) {
    return (
      <div className="container mx-auto py-16 text-center">
        <p>Loading...</p>
      </div>
    );
  }

  // Check if user has any affiliates
  const affiliateArray = Array.isArray(affiliates) ? affiliates : affiliates ? [affiliates] : [];
  const activeAffiliates = affiliateArray.filter((a) => a.status === "active");
  const pendingAffiliates = affiliateArray.filter((a) => a.status === "pending");

  if (affiliateArray.length === 0) {
    return (
      <div className="container mx-auto py-16 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>No Affiliate Accounts</CardTitle>
            <CardDescription>
              You haven't applied to any affiliate programs yet
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center py-8">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-6">
              Browse courses and apply to become an affiliate to start earning commissions
            </p>
            <Button asChild>
              <Link href="/courses">Browse Courses</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {pendingAffiliates.length > 0 && (
        <Card className="border-yellow-500">
          <CardHeader>
            <CardTitle>⏳ Pending Applications</CardTitle>
            <CardDescription>
              Your affiliate applications are being reviewed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingAffiliates.map((affiliate) => (
                <div
                  key={affiliate._id}
                  className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg"
                >
                  <p className="font-medium">Code: {affiliate.affiliateCode}</p>
                  <p className="text-sm text-muted-foreground">
                    Applied {new Date(affiliate.appliedAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeAffiliates.length > 0 ? (
        activeAffiliates.map((affiliate) => (
          <AffiliateDashboard key={affiliate._id} affiliateId={affiliate._id} />
        ))
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Active Affiliates</CardTitle>
            <CardDescription>
              Your applications are pending review
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Once approved, your affiliate dashboard will appear here with your unique link,
              earnings, and performance stats.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}



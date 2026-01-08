"use client";

import { useState } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Package, Check, AlertCircle, CreditCard, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function SeedCreditsPage() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isSyncingStripe, setIsSyncingStripe] = useState(false);
  const seedPackages = useMutation(api.seedCreditPackages.seedDefaultPackages);
  const syncToStripe = useAction(api.creditPackageStripe.syncCreditPackagesToStripe);
  const existingPackages = useQuery(api.credits.getCreditPackages);

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      const result = await seedPackages({});
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.info(result.message);
      }
    } catch (error) {
      toast.error("Failed to seed packages");
      console.error(error);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSyncToStripe = async () => {
    setIsSyncingStripe(true);
    try {
      const result = await syncToStripe({});
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
      // Log individual results
      console.log("Stripe sync results:", result.results);
    } catch (error) {
      toast.error("Failed to sync to Stripe");
      console.error(error);
    } finally {
      setIsSyncingStripe(false);
    }
  };

  // Check if packages have valid Stripe price IDs
  const packagesWithoutStripe = existingPackages?.filter(
    (pkg: any) => !pkg.stripePriceId || pkg.stripePriceId.length < 20
  ) || [];
  const packagesWithStripe = existingPackages?.filter(
    (pkg: any) => pkg.stripePriceId && pkg.stripePriceId.length > 20
  ) || [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-6 w-6" />
            Seed Credit Packages
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="mb-4 text-muted-foreground">
              This will create default credit packages in your database if they don't already exist.
            </p>

            {existingPackages && existingPackages.length > 0 ? (
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <Check className="h-5 w-5" />
                  <span className="font-semibold">
                    {existingPackages.length} credit packages already exist
                  </span>
                </div>
                <ul className="mt-3 space-y-1 text-sm text-green-600 dark:text-green-400">
                  {existingPackages.map((pkg: any) => (
                    <li key={pkg._id}>
                      • {pkg.name} - {pkg.credits} credits - ${pkg.priceUsd}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
                <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-semibold">No credit packages found</span>
                </div>
                <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
                  Click the button below to create default packages.
                </p>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="font-semibold">Packages that will be created:</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[
                  { name: "Mini Pack", credits: 25, price: 2.99 },
                  { name: "Starter Pack", credits: 100, price: 9.99, bonus: 0 },
                  {
                    name: "Pro Pack",
                    credits: 500,
                    price: 39.99,
                    bonus: 50,
                    badge: "Most Popular",
                  },
                  {
                    name: "Ultimate Pack",
                    credits: 1200,
                    price: 89.99,
                    bonus: 200,
                    badge: "Best Value",
                  },
                ].map((pkg) => (
                  <Card key={pkg.name} className="bg-muted/50">
                    <CardContent className="p-4">
                      <div className="mb-2 flex items-start justify-between">
                        <h4 className="font-semibold">{pkg.name}</h4>
                        {pkg.badge && (
                          <span className="rounded bg-purple-100 px-2 py-1 text-xs text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                            {pkg.badge}
                          </span>
                        )}
                      </div>
                      <p className="mb-1 text-sm text-muted-foreground">
                        {pkg.credits} credits
                        {pkg.bonus ? ` + ${pkg.bonus} bonus` : ""}
                      </p>
                      <p className="text-lg font-bold">${pkg.price}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <Button
            onClick={handleSeed}
            disabled={isSeeding || (existingPackages && existingPackages.length > 0)}
            className="w-full"
          >
            {isSeeding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Seeding Packages...
              </>
            ) : (
              <>
                <Package className="mr-2 h-4 w-4" />
                Seed Credit Packages
              </>
            )}
          </Button>

          <div className="text-xs text-muted-foreground">
            <p className="mb-1 font-semibold">Note:</p>
            <ul className="list-inside list-disc space-y-1">
              <li>You can run this safely - it won't create duplicates</li>
              <li>Packages can be managed through the database later</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Stripe Sync Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            Sync to Stripe
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="mb-4 text-muted-foreground">
              Create permanent Stripe products and prices for your credit packages. This replaces placeholder IDs with real Stripe price IDs.
            </p>

            {/* Status display */}
            {existingPackages && existingPackages.length > 0 && (
              <div className="mb-4 space-y-3">
                {packagesWithStripe.length > 0 && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                      <Check className="h-5 w-5" />
                      <span className="font-semibold">
                        {packagesWithStripe.length} package(s) synced to Stripe
                      </span>
                    </div>
                    <ul className="mt-2 space-y-1 text-sm text-green-600 dark:text-green-400">
                      {packagesWithStripe.map((pkg: any) => (
                        <li key={pkg._id} className="flex items-center gap-2">
                          <Check className="h-3 w-3" />
                          {pkg.name} - <code className="text-xs">{pkg.stripePriceId?.substring(0, 20)}...</code>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {packagesWithoutStripe.length > 0 && (
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
                    <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-semibold">
                        {packagesWithoutStripe.length} package(s) need Stripe sync
                      </span>
                    </div>
                    <ul className="mt-2 space-y-1 text-sm text-yellow-600 dark:text-yellow-400">
                      {packagesWithoutStripe.map((pkg: any) => (
                        <li key={pkg._id}>• {pkg.name} - placeholder ID</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={handleSyncToStripe}
              disabled={isSyncingStripe || !existingPackages || existingPackages.length === 0}
              className="w-full"
              variant={packagesWithoutStripe.length > 0 ? "default" : "outline"}
            >
              {isSyncingStripe ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Syncing to Stripe...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {packagesWithoutStripe.length > 0
                    ? `Sync ${packagesWithoutStripe.length} Package(s) to Stripe`
                    : "Re-sync All to Stripe"
                  }
                </>
              )}
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            <p className="mb-1 font-semibold">What this does:</p>
            <ul className="list-inside list-disc space-y-1">
              <li>Creates Stripe products for each credit package</li>
              <li>Creates Stripe prices with correct amounts</li>
              <li>Updates database with real Stripe price IDs</li>
              <li>Checkout will use stored prices (no more duplicates)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

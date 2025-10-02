"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Package, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function SeedCreditsPage() {
  const [isSeeding, setIsSeeding] = useState(false);
  const seedPackages = useMutation(api.seedCreditPackages.seedDefaultPackages);
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-6 h-6" />
            Seed Credit Packages
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-muted-foreground mb-4">
              This will create default credit packages in your database if they don't already exist.
            </p>

            {existingPackages && existingPackages.length > 0 ? (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <Check className="w-5 h-5" />
                  <span className="font-semibold">
                    {existingPackages.length} credit packages already exist
                  </span>
                </div>
                <ul className="mt-3 space-y-1 text-sm text-green-600 dark:text-green-400">
                  {existingPackages.map((pkg) => (
                    <li key={pkg._id}>
                      • {pkg.name} - {pkg.credits} credits - ${pkg.priceUsd}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-semibold">No credit packages found</span>
                </div>
                <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
                  Click the button below to create default packages.
                </p>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="font-semibold">Packages that will be created:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: "Mini Pack", credits: 25, price: 2.99 },
                  { name: "Starter Pack", credits: 100, price: 9.99, bonus: 0 },
                  { name: "Pro Pack", credits: 500, price: 39.99, bonus: 50, badge: "Most Popular" },
                  { name: "Ultimate Pack", credits: 1200, price: 89.99, bonus: 200, badge: "Best Value" },
                ].map((pkg) => (
                  <Card key={pkg.name} className="bg-muted/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{pkg.name}</h4>
                        {pkg.badge && (
                          <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">
                            {pkg.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
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
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Seeding Packages...
              </>
            ) : (
              <>
                <Package className="w-4 h-4 mr-2" />
                Seed Credit Packages
              </>
            )}
          </Button>

          <div className="text-xs text-muted-foreground">
            <p className="font-semibold mb-1">Note:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Stripe price IDs are placeholders and need to be updated</li>
              <li>You can run this safely - it won't create duplicates</li>
              <li>Packages can be managed through the database later</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


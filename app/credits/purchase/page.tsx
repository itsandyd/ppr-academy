"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Check,
  Zap,
  TrendingUp,
  Star,
  CreditCard,
  ArrowLeft,
  Loader2,
  Download,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function PurchaseCreditsPage() {
  const router = useRouter();
  const { user } = useUser();
  const [purchasingPackage, setPurchasingPackage] = useState<string | null>(null);

  const packages = useQuery(api.credits.getCreditPackages) || [];
  const userCredits = useQuery(api.credits.getUserCredits);

  const handlePurchase = async (pkg: {
    id: string;
    credits: number;
    price: number;
    bonus: number;
  }) => {
    if (!user) {
      toast.error("Please sign in to purchase credits");
      return;
    }

    setPurchasingPackage(pkg.id);

    try {
      const response = await fetch("/api/credits/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: pkg.id,
          packageName: `${pkg.credits} Credits${pkg.bonus > 0 ? ` + ${pkg.bonus} Bonus` : ""}`,
          credits: pkg.credits,
          bonusCredits: pkg.bonus,
          priceUsd: pkg.price,
          customerEmail: user.primaryEmailAddress?.emailAddress,
          userId: user.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to start checkout");
      setPurchasingPackage(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="bg-gradient-to-r from-chart-1 to-chart-4 bg-clip-text text-4xl font-bold text-transparent">
                Purchase Credits
              </h1>
              <p className="mt-2 text-muted-foreground">
                Get credits to download samples, packs, and more
              </p>
            </div>
          </div>

          {/* Current Balance */}
          {userCredits && (
            <Card className="border-chart-1/20 bg-gradient-to-r from-chart-1/10 to-chart-2/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-chart-1/20 p-3">
                    <Package className="h-8 w-8 text-chart-1" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Current Balance</div>
                    <div className="text-3xl font-bold text-chart-1">
                      {userCredits.balance} credits
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Packages */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg: any, index: number) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card
                className={`relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
                  pkg.popular
                    ? "border-2 border-chart-1 shadow-lg shadow-chart-1/20"
                    : "border-border"
                }`}
              >
                {/* Popular Badge */}
                {pkg.popular && (
                  <div className="absolute right-0 top-0 rounded-bl-lg bg-gradient-to-r from-chart-1 to-chart-2 px-4 py-1 text-primary-foreground">
                    <div className="flex items-center gap-1 text-xs font-bold">
                      <Star className="h-3 w-3 fill-current" />
                      MOST POPULAR
                    </div>
                  </div>
                )}

                <CardHeader className={`pb-4 text-center ${pkg.popular ? "pt-8" : ""}`}>
                  <CardTitle className="text-2xl">{pkg.credits} Credits</CardTitle>
                  {pkg.bonus > 0 && (
                    <Badge className="mx-auto mt-2 border-chart-2/20 bg-chart-2/10 text-chart-2">
                      <Zap className="mr-1 h-3 w-3" />+{pkg.bonus} Bonus Credits
                    </Badge>
                  )}
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Price */}
                  <div className="text-center">
                    <div className="text-4xl font-bold">${pkg.price}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      ${pkg.pricePerCredit}/credit
                    </div>
                  </div>

                  {/* Savings */}
                  {pkg.savingsPercent > 0 && (
                    <div className="rounded-lg border border-chart-1/20 bg-chart-1/5 p-3">
                      <div className="flex items-center justify-center gap-2 text-chart-1">
                        <TrendingUp className="h-4 w-4" />
                        <span className="font-semibold">Save {pkg.savingsPercent}%</span>
                      </div>
                    </div>
                  )}

                  {/* Total */}
                  <div className="border-t border-border pt-4 text-center">
                    <div className="text-sm text-muted-foreground">You Get</div>
                    <div className="mt-1 text-2xl font-bold text-chart-1">
                      {pkg.totalCredits} Total Credits
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2 border-t border-border pt-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 flex-shrink-0 text-chart-1" />
                      <span>Download samples & packs</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 flex-shrink-0 text-chart-1" />
                      <span>Never expire</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 flex-shrink-0 text-chart-1" />
                      <span>Instant delivery</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 flex-shrink-0 text-chart-1" />
                      <span>Royalty-free license</span>
                    </div>
                  </div>

                  <Button
                    className={`w-full py-6 text-base ${
                      pkg.popular
                        ? "bg-gradient-to-r from-chart-1 to-chart-2 hover:from-chart-1/90 hover:to-chart-2/90"
                        : ""
                    }`}
                    size="lg"
                    onClick={() => handlePurchase(pkg)}
                    disabled={purchasingPackage === pkg.id}
                  >
                    {purchasingPackage === pkg.id ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <CreditCard className="mr-2 h-5 w-5" />
                    )}
                    {purchasingPackage === pkg.id ? "Processing..." : `Buy ${pkg.credits} Credits`}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Info Section */}
        <Card className="mt-12 border-chart-1/20 bg-gradient-to-br from-chart-1/5 to-chart-4/5">
          <CardContent className="p-8">
            <h3 className="mb-4 text-xl font-bold">How Credits Work</h3>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-1/20">
                  <Package className="h-6 w-6 text-chart-1" />
                </div>
                <h4 className="font-semibold">Buy Credits</h4>
                <p className="text-sm text-muted-foreground">
                  Purchase credit packages. Larger packages include bonus credits!
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-2/20">
                  <Download className="h-6 w-6 text-chart-2" />
                </div>
                <h4 className="font-semibold">Spend Credits</h4>
                <p className="text-sm text-muted-foreground">
                  Use credits to download individual samples or entire packs
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-3/20">
                  <Check className="h-6 w-6 text-chart-3" />
                </div>
                <h4 className="font-semibold">Own Forever</h4>
                <p className="text-sm text-muted-foreground">
                  All purchases are yours to keep with a royalty-free license
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

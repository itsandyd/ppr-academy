"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
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
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function PurchaseCreditsPage() {
  const router = useRouter();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  // Queries
  const packages = useQuery(api.credits.getCreditPackages) || [];
  const userCredits = useQuery(api.credits.getUserCredits);

  const handlePurchase = async (packageId: string) => {
    setSelectedPackage(packageId);
    
    // TODO: Integrate with Stripe
    toast.info("Stripe integration coming soon! This will create a checkout session.");
    
    // Placeholder for Stripe flow:
    // 1. Create Stripe checkout session
    // 2. Redirect to Stripe
    // 3. On success, Stripe webhook calls purchaseCredits mutation
    // 4. User gets credits added to balance
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-chart-1 to-chart-4 bg-clip-text text-transparent">
                Purchase Credits
              </h1>
              <p className="text-muted-foreground mt-2">
                Get credits to download samples, packs, and more
              </p>
            </div>
          </div>

          {/* Current Balance */}
          {userCredits && (
            <Card className="bg-gradient-to-r from-chart-1/10 to-chart-2/10 border-chart-1/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-chart-1/20 rounded-lg">
                    <Package className="w-8 h-8 text-chart-1" />
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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg, index) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
                  pkg.popular
                    ? "border-chart-1 border-2 shadow-lg shadow-chart-1/20"
                    : "border-border"
                }`}
              >
                {/* Popular Badge */}
                {pkg.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-chart-1 to-chart-2 text-primary-foreground px-4 py-1 rounded-bl-lg">
                    <div className="flex items-center gap-1 text-xs font-bold">
                      <Star className="w-3 h-3 fill-current" />
                      MOST POPULAR
                    </div>
                  </div>
                )}

                <CardHeader className={`text-center pb-4 ${pkg.popular ? "pt-8" : ""}`}>
                  <CardTitle className="text-2xl">
                    {pkg.credits} Credits
                  </CardTitle>
                  {pkg.bonus > 0 && (
                    <Badge className="mx-auto mt-2 bg-chart-2/10 text-chart-2 border-chart-2/20">
                      <Zap className="w-3 h-3 mr-1" />
                      +{pkg.bonus} Bonus Credits
                    </Badge>
                  )}
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Price */}
                  <div className="text-center">
                    <div className="text-4xl font-bold">${pkg.price}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      ${pkg.pricePerCredit}/credit
                    </div>
                  </div>

                  {/* Savings */}
                  {pkg.savingsPercent > 0 && (
                    <div className="p-3 bg-chart-1/5 rounded-lg border border-chart-1/20">
                      <div className="flex items-center justify-center gap-2 text-chart-1">
                        <TrendingUp className="w-4 h-4" />
                        <span className="font-semibold">
                          Save {pkg.savingsPercent}%
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Total */}
                  <div className="pt-4 border-t border-border text-center">
                    <div className="text-sm text-muted-foreground">You Get</div>
                    <div className="text-2xl font-bold text-chart-1 mt-1">
                      {pkg.totalCredits} Total Credits
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2 pt-4 border-t border-border">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-chart-1 flex-shrink-0" />
                      <span>Download samples & packs</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-chart-1 flex-shrink-0" />
                      <span>Never expire</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-chart-1 flex-shrink-0" />
                      <span>Instant delivery</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-chart-1 flex-shrink-0" />
                      <span>Royalty-free license</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <Button
                    className={`w-full text-base py-6 ${
                      pkg.popular
                        ? "bg-gradient-to-r from-chart-1 to-chart-2 hover:from-chart-1/90 hover:to-chart-2/90"
                        : ""
                    }`}
                    size="lg"
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={selectedPackage === pkg.id}
                  >
                    <CreditCard className="w-5 h-5 mr-2" />
                    Buy {pkg.credits} Credits
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Info Section */}
        <Card className="mt-12 bg-gradient-to-br from-chart-1/5 to-chart-4/5 border-chart-1/20">
          <CardContent className="p-8">
            <h3 className="text-xl font-bold mb-4">How Credits Work</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="w-12 h-12 bg-chart-1/20 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-chart-1" />
                </div>
                <h4 className="font-semibold">Buy Credits</h4>
                <p className="text-sm text-muted-foreground">
                  Purchase credit packages. Larger packages include bonus credits!
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 bg-chart-2/20 rounded-lg flex items-center justify-center">
                  <Download className="w-6 h-6 text-chart-2" />
                </div>
                <h4 className="font-semibold">Spend Credits</h4>
                <p className="text-sm text-muted-foreground">
                  Use credits to download individual samples or entire packs
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 bg-chart-3/20 rounded-lg flex items-center justify-center">
                  <Check className="w-6 h-6 text-chart-3" />
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

// Import Download icon
import { Download } from "lucide-react";


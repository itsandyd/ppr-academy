"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useValidStoreId } from "@/hooks/useStoreId";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, ArrowLeft, Check, Zap, TrendingUp, Star } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function BuyCreditsPage() {
  const router = useRouter();
  const storeId = useValidStoreId();
  const { user } = useUser();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [processingPackage, setProcessingPackage] = useState<string | null>(null);

  const userCredits = useQuery(api.credits.getUserCredits);
  // @ts-ignore Convex type instantiation too deep
  const creditPackages: any[] | undefined = useQuery(api.credits.getCreditPackages);

  if (!storeId) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Invalid store ID</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handlePurchase = async (packageId: string) => {
    if (!user) {
      toast.error("Please sign in to purchase credits");
      return;
    }

    const pkg = creditPackages?.find((p) => p.id === packageId);
    if (!pkg) {
      toast.error("Package not found");
      return;
    }

    setProcessingPackage(packageId);

    try {
      // Create Stripe checkout session
      const response = await fetch("/api/credits/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          packageId: pkg.id,
          packageName: pkg.id, // Using id as name
          credits: pkg.credits,
          bonusCredits: pkg.bonus || 0,
          priceUsd: pkg.price,
          customerEmail: user.primaryEmailAddress?.emailAddress || "",
          userId: user.id,
        }),
      });

      const data = await response.json();

      if (data.success && data.checkoutUrl) {
        // Redirect to Stripe checkout
        window.location.href = data.checkoutUrl;
      } else {
        toast.error(data.error || "Failed to create checkout session");
        setProcessingPackage(null);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to start checkout. Please try again.");
      setProcessingPackage(null);
    }
  };

  const getPackageIcon = (index: number) => {
    switch (index) {
      case 0:
        return Coins;
      case 1:
        return Zap;
      case 2:
        return TrendingUp;
      default:
        return Star;
    }
  };

  const getGradient = (index: number) => {
    const gradients = [
      "from-blue-500 to-cyan-500",
      "from-purple-500 to-pink-500",
      "from-orange-500 to-red-500",
      "from-green-500 to-emerald-500",
    ];
    return gradients[index % gradients.length];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push(`/store/${storeId}/products`)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Button>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-100 to-indigo-100 px-4 py-2 dark:from-purple-900/20 dark:to-indigo-900/20">
            <Coins className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
              Buy Credits
            </span>
          </div>
          <h1 className="mb-2 text-4xl font-bold">Purchase Credits</h1>
          <p className="text-muted-foreground">
            Choose a credit package to start buying samples and packs
          </p>
        </div>

        {/* Current Balance */}
        {user && userCredits !== undefined && userCredits !== null && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 dark:border-purple-800 dark:from-purple-900/20 dark:to-indigo-900/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg">
                      <Coins className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Your Current Balance
                      </p>
                      <p className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-4xl font-bold text-transparent">
                        {userCredits.balance.toLocaleString()} credits
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <div>Earned: {userCredits.lifetimeEarned.toLocaleString()}</div>
                    <div>Spent: {userCredits.lifetimeSpent.toLocaleString()}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Credit Packages */}
        <div className="mb-8">
          <h2 className="mb-6 text-center text-2xl font-bold">Choose Your Package</h2>

          {!creditPackages || creditPackages.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Coins className="mx-auto mb-4 h-16 w-16 text-muted-foreground opacity-50" />
                <h3 className="mb-2 text-xl font-semibold">No Packages Available</h3>
                <p className="mb-6 text-muted-foreground">
                  Credit packages are being set up. Check back soon!
                </p>
                <div className="mx-auto max-w-2xl space-y-4 text-left">
                  <h4 className="text-lg font-semibold">Coming Soon:</h4>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {[
                      { name: "Starter Pack", credits: 100, price: 9.99 },
                      { name: "Pro Pack", credits: 500, price: 39.99 },
                      { name: "Ultimate Pack", credits: 1200, price: 89.99 },
                    ].map((pack, i) => (
                      <Card key={i} className="opacity-50">
                        <CardContent className="p-4">
                          <h5 className="font-semibold">{pack.name}</h5>
                          <p className="text-sm text-muted-foreground">{pack.credits} credits</p>
                          <p className="text-lg font-bold">${pack.price}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {creditPackages.map((pkg, index) => {
                const Icon = getPackageIcon(index);
                const isPopular = pkg.badge?.toLowerCase().includes("popular");
                const isBestValue = pkg.badge?.toLowerCase().includes("value");

                return (
                  <motion.div
                    key={pkg._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card
                      className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl ${
                        isPopular || isBestValue
                          ? "border-2 border-purple-500 dark:border-purple-400"
                          : "border-2 hover:border-purple-200 dark:hover:border-purple-800"
                      }`}
                    >
                      {/* Badge */}
                      {pkg.badge && (
                        <div className="absolute right-4 top-4">
                          <Badge
                            className={`${
                              isPopular
                                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                                : isBestValue
                                  ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                                  : "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                            }`}
                          >
                            {pkg.badge}
                          </Badge>
                        </div>
                      )}

                      <CardHeader className="pb-4 text-center">
                        {/* Icon */}
                        <div
                          className={`mx-auto mb-4 h-20 w-20 rounded-full bg-gradient-to-br ${getGradient(
                            index
                          )} flex items-center justify-center shadow-lg`}
                        >
                          <Icon className="h-10 w-10 text-white" />
                        </div>

                        <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                        <CardDescription>{pkg.description}</CardDescription>
                      </CardHeader>

                      <CardContent className="space-y-6 text-center">
                        {/* Credits */}
                        <div>
                          <p className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-5xl font-bold text-transparent">
                            {pkg.credits.toLocaleString()}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">credits</p>
                          {pkg.bonusCredits && pkg.bonusCredits > 0 && (
                            <Badge variant="secondary" className="mt-2">
                              +{pkg.bonusCredits} bonus credits!
                            </Badge>
                          )}
                        </div>

                        {/* Price */}
                        <div>
                          <p className="text-3xl font-bold">${pkg.priceUsd.toFixed(2)}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            ${(pkg.priceUsd / pkg.credits).toFixed(3)} per credit
                          </p>
                        </div>

                        {/* Features */}
                        <div className="space-y-2 text-left text-sm">
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span>Use on any sample or pack</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span>Never expires</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span>Instant delivery</span>
                          </div>
                          {pkg.bonusCredits && pkg.bonusCredits > 0 && (
                            <div className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-500" />
                              <span className="font-semibold text-green-600 dark:text-green-400">
                                Bonus credits included!
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Purchase Button */}
                        <Button
                          className={`w-full bg-gradient-to-r ${getGradient(
                            index
                          )} transition-opacity hover:opacity-90`}
                          onClick={() => handlePurchase(pkg._id)}
                          disabled={processingPackage === pkg._id}
                        >
                          {processingPackage === pkg._id ? (
                            <>
                              <Coins className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Coins className="mr-2 h-4 w-4" />
                              Buy Now
                            </>
                          )}
                        </Button>

                        {/* Purchase Count */}
                        {pkg.purchaseCount > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {pkg.purchaseCount.toLocaleString()} creators purchased
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* FAQ / Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>How Credits Work</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <h3 className="mb-2 flex items-center gap-2 font-semibold">
                    <Coins className="h-4 w-4 text-purple-600" />
                    Buying & Spending
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Purchase credits with USD (credit card, PayPal, etc.)</li>
                    <li>• Use credits to buy individual samples or sample packs</li>
                    <li>• Credits never expire - use them whenever you want</li>
                    <li>• Instant delivery to your account</li>
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 flex items-center gap-2 font-semibold">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    Earning Credits
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Sell your own samples and packs to earn credits</li>
                    <li>• You keep 90% of every sale (10% platform fee)</li>
                    <li>• Earned credits can be used to buy more samples</li>
                    <li>• Build a library while earning from your creations</li>
                  </ul>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="mb-2 font-semibold">Need Help?</h3>
                <p className="text-sm text-muted-foreground">
                  Have questions about credits or purchases?{" "}
                  <Link href="/support" className="text-purple-600 hover:underline">
                    Contact our support team
                  </Link>
                  .
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

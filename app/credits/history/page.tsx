"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowDown,
  ArrowUp,
  Package,
  Gift,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function CreditHistoryPage() {
  const router = useRouter();
  
  const transactions = useQuery(api.credits.getCreditTransactions, {
    limit: 100,
  });

  const userCredits = useQuery(api.credits.getUserCredits);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "purchase":
        return <ArrowDown className="w-5 h-5 text-chart-1" />;
      case "earn":
        return <ArrowUp className="w-5 h-5 text-chart-2" />;
      case "spend":
        return <ArrowDown className="w-5 h-5 text-chart-4" />;
      case "bonus":
        return <Gift className="w-5 h-5 text-chart-5" />;
      case "refund":
        return <RefreshCw className="w-5 h-5 text-chart-3" />;
      default:
        return <Package className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "purchase":
      case "earn":
      case "bonus":
      case "refund":
        return "text-chart-1";
      case "spend":
        return "text-chart-4";
      default:
        return "text-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold">Credit History</h1>
            <p className="text-muted-foreground mt-1">
              View all your credit transactions
            </p>
          </div>
        </div>

        {/* Current Balance */}
        {userCredits && (
          <Card className="mb-8 bg-gradient-to-r from-chart-1/10 to-chart-2/10 border-chart-1/20">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-sm text-muted-foreground">Current Balance</div>
                  <div className="text-3xl font-bold text-chart-1">
                    {userCredits.balance} credits
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Lifetime Earned</div>
                  <div className="text-2xl font-bold text-chart-2">
                    {userCredits.lifetimeEarned} credits
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Lifetime Spent</div>
                  <div className="text-2xl font-bold text-chart-4">
                    {userCredits.lifetimeSpent} credits
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transactions */}
        <div className="space-y-3">
          {transactions && transactions.transactions.length > 0 ? (
            transactions.transactions.map((transaction: any, index: number) => (
              <motion.div
                key={transaction._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
              >
                <Card className="hover:shadow-md transition-shadow border-border bg-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Icon */}
                        <div className="p-2 bg-muted rounded-lg">
                          {getTransactionIcon(transaction.type)}
                        </div>

                        {/* Info */}
                        <div>
                          <div className="font-medium">{transaction.description}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(transaction._creationTime).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Amount & Balance */}
                      <div className="text-right">
                        <div className={`text-xl font-bold ${getTransactionColor(transaction.type)}`}>
                          {transaction.amount > 0 ? "+" : ""}
                          {transaction.amount}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Balance: {transaction.balance}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <Card className="p-12 text-center border-border bg-card">
              <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No transactions yet</h3>
              <p className="text-muted-foreground mb-6">
                Purchase credits to start downloading samples
              </p>
              <Button onClick={() => router.push("/credits/purchase")}>
                Buy Credits
              </Button>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}


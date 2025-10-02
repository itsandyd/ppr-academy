"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, Plus, TrendingUp } from "lucide-react";
import Link from "next/link";

interface CreditBalanceProps {
  storeId: string;
  showDetails?: boolean;
}

export function CreditBalance({ storeId, showDetails = false }: CreditBalanceProps) {
  const userCredits = useQuery(api.credits.getUserCredits);

  if (!userCredits) {
    return (
      <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Coins className="w-5 h-5 text-purple-600 dark:text-purple-400 animate-pulse" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-800">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <Coins className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Credit Balance</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                {userCredits.balance.toLocaleString()}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            asChild
          >
            <Link href={`/store/${storeId}/credits/buy`}>
              <Plus className="w-4 h-4 mr-1" />
              Buy
            </Link>
          </Button>
        </div>

        {showDetails && (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-xs text-muted-foreground">Earned</p>
                <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                  {userCredits.lifetimeEarned.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-xs text-muted-foreground">Spent</p>
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {userCredits.lifetimeSpent.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 text-xs text-center text-muted-foreground">
          Use credits to purchase samples & packs
        </div>
      </CardContent>
    </Card>
  );
}


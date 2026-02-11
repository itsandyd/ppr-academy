"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  Crown,
  Grid3x3,
  List as ListIcon,
  BookOpen,
  ShoppingBag,
  Users,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function MembershipsMarketplacePage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");

  const memberships =
    useQuery(api.memberships.getAllPublishedMemberships, {
      searchQuery: searchTerm || undefined,
    }) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="border-b border-border bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-rose-500/10 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8 space-y-4 text-center">
            <motion.div
              className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-4 py-2"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Crown className="h-5 w-5 text-amber-600" />
              <span className="text-sm font-semibold text-amber-600">Memberships</span>
            </motion.div>

            <motion.h1
              className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 bg-clip-text text-5xl font-bold text-transparent md:text-6xl"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Memberships
            </motion.h1>

            <motion.p
              className="mx-auto max-w-2xl text-xl text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              Subscribe to your favorite creators for ongoing access to courses, products, and
              exclusive content
            </motion.p>
          </div>

          {/* Search */}
          <div className="relative mx-auto max-w-2xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search memberships..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-14 border-2 border-border bg-background/80 pl-12 pr-4 text-base backdrop-blur-sm transition-all focus:border-amber-500"
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Toolbar */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Available Memberships</h2>
            <p className="text-sm text-muted-foreground">
              {memberships.length} membership{memberships.length !== 1 ? "s" : ""} found
            </p>
          </div>

          <div className="flex rounded-lg border border-border">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-r-none"
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-l-none"
            >
              <ListIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Grid / List */}
        {memberships.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {memberships.map((tier: any, index: number) => (
                <MembershipCard key={tier._id} tier={tier} index={index} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {memberships.map((tier: any, index: number) => (
                <MembershipListItem key={tier._id} tier={tier} index={index} />
              ))}
            </div>
          )
        ) : (
          <Card className="p-12 text-center">
            <Crown className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-xl font-semibold">No memberships found</h3>
            <p className="text-muted-foreground">
              {searchTerm
                ? "Try adjusting your search terms"
                : "No creator memberships are available yet"}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

function MembershipCard({ tier, index }: { tier: any; index: number }) {
  const slug = tier.slug || tier._id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Link href={`/marketplace/memberships/${slug}`}>
        <Card className="group cursor-pointer overflow-hidden border-border bg-card transition-all duration-300 hover:shadow-xl">
          {/* Top gradient bar */}
          <div className="h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />

          <CardContent className="space-y-4 p-5">
            {/* Creator info */}
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={tier.creator?.imageUrl} />
                <AvatarFallback className="bg-gradient-to-r from-amber-500 to-orange-500 text-xs text-white">
                  {tier.creator?.name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{tier.creator?.name || "Creator"}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {tier.store?.name || "Store"}
                </p>
              </div>
            </div>

            {/* Tier name & description */}
            <div>
              <h3 className="mb-1 text-lg font-bold transition-colors group-hover:text-amber-600">
                {tier.tierName}
              </h3>
              <p className="line-clamp-2 text-sm text-muted-foreground">{tier.description}</p>
            </div>

            {/* Content counts */}
            <div className="flex flex-wrap gap-2">
              {tier.includesAllContent ? (
                <Badge variant="secondary" className="text-xs">
                  <Sparkles className="mr-1 h-3 w-3" />
                  All Content
                </Badge>
              ) : (
                <>
                  {tier.courseCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      <BookOpen className="mr-1 h-3 w-3" />
                      {tier.courseCount} Course{tier.courseCount !== 1 ? "s" : ""}
                    </Badge>
                  )}
                  {tier.productCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      <ShoppingBag className="mr-1 h-3 w-3" />
                      {tier.productCount} Product{tier.productCount !== 1 ? "s" : ""}
                    </Badge>
                  )}
                </>
              )}
              {(tier.subscriberCount || 0) > 0 && (
                <Badge variant="outline" className="text-xs">
                  <Users className="mr-1 h-3 w-3" />
                  {tier.subscriberCount} member{tier.subscriberCount !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>

            {/* Price */}
            <div className="flex items-baseline justify-between border-t border-border pt-3">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-amber-600">
                  ${tier.priceMonthly.toFixed(2)}
                </span>
                <span className="text-sm text-muted-foreground">/mo</span>
              </div>
              {tier.priceYearly && (
                <span className="text-sm text-muted-foreground">
                  ${tier.priceYearly.toFixed(2)}/yr
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

function MembershipListItem({ tier, index }: { tier: any; index: number }) {
  const slug = tier.slug || tier._id;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
    >
      <Link href={`/marketplace/memberships/${slug}`}>
        <Card className="cursor-pointer border-border transition-colors hover:bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={tier.creator?.imageUrl} />
                <AvatarFallback className="bg-gradient-to-r from-amber-500 to-orange-500 text-sm text-white">
                  {tier.creator?.name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{tier.tierName}</div>
                <div className="text-sm text-muted-foreground">
                  by {tier.creator?.name || "Creator"} &middot;{" "}
                  {tier.includesAllContent
                    ? "All content"
                    : `${tier.courseCount} courses, ${tier.productCount} products`}
                </div>
              </div>
              {(tier.subscriberCount || 0) > 0 && (
                <Badge variant="outline" className="text-xs">
                  <Users className="mr-1 h-3 w-3" />
                  {tier.subscriberCount}
                </Badge>
              )}
              <div className="text-right">
                <div className="text-xl font-bold text-amber-600">
                  ${tier.priceMonthly.toFixed(2)}
                  <span className="text-sm font-normal text-muted-foreground">/mo</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

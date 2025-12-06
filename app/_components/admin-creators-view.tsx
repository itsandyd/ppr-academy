"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Users,
  Package,
  BookOpen,
  DollarSign,
  Store,
  CheckCircle,
  XCircle,
  Search,
  X,
  TrendingUp,
  ExternalLink,
  Sparkles,
  Crown,
  ArrowUpRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AdminCreatorsViewProps {
  clerkId: string;
}

export function AdminCreatorsView({ clerkId }: AdminCreatorsViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Fetch all creators with their products
  const creatorsData = useQuery(
    api.adminAnalytics.getAllCreatorsWithProducts,
    { clerkId }
  );

  // Filter creators by search term
  const filteredCreators = useMemo(() => {
    if (!creatorsData) return [];
    if (!searchTerm) return creatorsData;
    
    const searchLower = searchTerm.toLowerCase();
    return creatorsData.filter(creator =>
      creator.name.toLowerCase().includes(searchLower) ||
      creator.email?.toLowerCase().includes(searchLower) ||
      creator.stores.some(s => s.name.toLowerCase().includes(searchLower)) ||
      creator.courses.some(c => c.title.toLowerCase().includes(searchLower)) ||
      creator.digitalProducts.some(p => p.title.toLowerCase().includes(searchLower))
    );
  }, [creatorsData, searchTerm]);

  // Calculate summary stats
  const stats = useMemo(() => {
    if (!filteredCreators) return {
      totalCreators: 0,
      totalCourses: 0,
      totalProducts: 0,
      totalRevenue: 0,
    };
    
    return {
      totalCreators: filteredCreators.length,
      totalCourses: filteredCreators.reduce((sum, c) => sum + c.courses.length, 0),
      totalProducts: filteredCreators.reduce((sum, c) => sum + c.digitalProducts.length, 0),
      totalRevenue: filteredCreators.reduce((sum, c) => sum + c.totalRevenue, 0),
    };
  }, [filteredCreators]);

  if (!creatorsData) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center space-y-4">
          <div className="relative mx-auto w-16 h-16">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-chart-1 to-chart-2 animate-pulse" />
            <div className="absolute inset-[2px] rounded-2xl bg-background flex items-center justify-center">
              <Users className="w-6 h-6 text-chart-1" />
            </div>
          </div>
          <div>
            <p className="font-medium">Loading creators</p>
            <p className="text-sm text-muted-foreground">Fetching data...</p>
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Creators",
      value: stats.totalCreators,
      icon: Users,
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      title: "Total Courses",
      value: stats.totalCourses,
      icon: BookOpen,
      gradient: "from-violet-500 to-purple-500",
    },
    {
      title: "Total Products",
      value: stats.totalProducts,
      icon: Package,
      gradient: "from-pink-500 to-rose-500",
    },
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      gradient: "from-emerald-500 to-green-500",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header with Stats */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              Creators & Products
              <Badge variant="outline" className="font-normal text-muted-foreground">
                {stats.totalCreators} active
              </Badge>
            </h2>
            <p className="text-muted-foreground mt-1">
              Manage and monitor all creators and their offerings
            </p>
          </div>
        </div>

        {/* Summary Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="border-border/50 hover:border-border transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "flex items-center justify-center w-12 h-12 rounded-xl",
                      "bg-gradient-to-br shadow-lg",
                      stat.gradient
                    )}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search creators, stores, courses, or products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 pr-11 h-12 rounded-xl border-border/50 bg-muted/30 focus:bg-background transition-colors"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 hover:bg-muted"
              onClick={() => setSearchTerm("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Creators List */}
      {filteredCreators.length === 0 ? (
        <Card className="border-border/50 border-dashed">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground font-medium">
              {searchTerm ? "No creators found matching your search" : "No creators with products found"}
            </p>
            {searchTerm && (
              <Button 
                variant="ghost" 
                onClick={() => setSearchTerm("")}
                className="mt-4"
              >
                Clear search
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Accordion type="single" collapsible className="space-y-3">
          {filteredCreators.map((creator, index) => (
            <AccordionItem
              key={creator.userId}
              value={creator.userId}
              className={cn(
                "border border-border/50 rounded-2xl overflow-hidden",
                "bg-card/50 hover:bg-card transition-all duration-200",
                "data-[state=open]:bg-card data-[state=open]:border-border"
              )}
            >
              <AccordionTrigger className="px-6 py-5 hover:no-underline group">
                <div className="flex items-center gap-5 w-full text-left">
                  <div className="relative">
                    <Avatar className="h-14 w-14 border-2 border-border/50 group-hover:border-chart-1/30 transition-colors">
                      <AvatarImage src={creator.imageUrl} alt={creator.name} />
                      <AvatarFallback className="bg-gradient-to-br from-chart-1/20 to-chart-2/20 text-foreground font-bold text-lg">
                        {creator.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {creator.stores.length > 0 && creator.stores[0].isPublic && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-lg">
                        <Crown className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg truncate">{creator.name}</h3>
                      {creator.totalRevenue > 1000 && (
                        <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 text-[10px]">
                          <Sparkles className="w-2.5 h-2.5 mr-1" />
                          Top Creator
                        </Badge>
                      )}
                    </div>
                    {creator.email && (
                      <p className="text-sm text-muted-foreground truncate">{creator.email}</p>
                    )}
                  </div>

                  <div className="hidden md:flex items-center gap-6 text-sm pr-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Store className="h-4 w-4" />
                      <span className="font-semibold text-foreground">{creator.stores.length}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <BookOpen className="h-4 w-4" />
                      <span className="font-semibold text-foreground">{creator.courses.length}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Package className="h-4 w-4" />
                      <span className="font-semibold text-foreground">{creator.digitalProducts.length}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10">
                      <DollarSign className="h-4 w-4 text-emerald-500" />
                      <span className="font-bold text-emerald-500">{creator.totalRevenue.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-6 pb-6 pt-2 space-y-6">
                {/* Mobile stats */}
                <div className="flex flex-wrap gap-3 md:hidden">
                  <Badge variant="outline" className="gap-1.5 py-1.5">
                    <Store className="h-3 w-3" />
                    {creator.stores.length} stores
                  </Badge>
                  <Badge variant="outline" className="gap-1.5 py-1.5">
                    <BookOpen className="h-3 w-3" />
                    {creator.courses.length} courses
                  </Badge>
                  <Badge variant="outline" className="gap-1.5 py-1.5">
                    <Package className="h-3 w-3" />
                    {creator.digitalProducts.length} products
                  </Badge>
                  <Badge className="gap-1.5 py-1.5 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                    <DollarSign className="h-3 w-3" />
                    ${creator.totalRevenue.toLocaleString()}
                  </Badge>
                </div>

                {/* Stores */}
                {creator.stores.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                        <Store className="h-3 w-3 text-white" />
                      </div>
                      Stores ({creator.stores.length})
                    </h4>
                    <div className="grid gap-2">
                      {creator.stores.map((store) => (
                        <div
                          key={store._id}
                          className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-border transition-colors"
                        >
                          <div>
                            <p className="font-medium">{store.name}</p>
                            <p className="text-sm text-muted-foreground font-mono">/{store.slug}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge 
                              variant="outline" 
                              className={cn(
                                store.isPublic 
                                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600" 
                                  : "border-border"
                              )}
                            >
                              {store.isPublic ? (
                                <CheckCircle className="h-3 w-3 mr-1.5" />
                              ) : (
                                <XCircle className="h-3 w-3 mr-1.5" />
                              )}
                              {store.isPublic ? "Public" : "Private"}
                            </Badge>
                            <Link href={`/${store.slug}`} target="_blank">
                              <Button variant="outline" size="sm" className="gap-1.5">
                                View
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Courses */}
                {creator.courses.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                        <BookOpen className="h-3 w-3 text-white" />
                      </div>
                      Courses ({creator.courses.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {creator.courses.map((course) => (
                        <div
                          key={course._id}
                          className="p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-border transition-colors group"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <p className="font-medium flex-1 line-clamp-1 group-hover:text-chart-1 transition-colors">
                              {course.title}
                            </p>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "ml-2 shrink-0",
                                course.isPublished 
                                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600" 
                                  : ""
                              )}
                            >
                              {course.isPublished ? "Published" : "Draft"}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold">
                              {course.price ? `$${course.price}` : "Free"}
                            </span>
                            <Link href={`/courses/${course._id}`} target="_blank">
                              <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-xs">
                                View
                                <ArrowUpRight className="h-3 w-3" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Digital Products */}
                {creator.digitalProducts.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                        <Package className="h-3 w-3 text-white" />
                      </div>
                      Digital Products ({creator.digitalProducts.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {creator.digitalProducts.map((product) => (
                        <div
                          key={product._id}
                          className="p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-border transition-colors group"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate group-hover:text-chart-1 transition-colors">
                                {product.title}
                              </p>
                              {product.productType && (
                                <p className="text-xs text-muted-foreground capitalize mt-0.5">
                                  {product.productType.replace("-", " ")}
                                </p>
                              )}
                            </div>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "ml-2 shrink-0",
                                product.isPublished 
                                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600" 
                                  : ""
                              )}
                            >
                              {product.isPublished ? "Published" : "Draft"}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold">
                              {product.price ? `$${product.price}` : "Free"}
                            </span>
                            <Link href={`/products/${product._id}`} target="_blank">
                              <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-xs">
                                View
                                <ArrowUpRight className="h-3 w-3" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats Summary Footer */}
                <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-border/50 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Total Revenue:</span>
                    <span className="font-bold text-emerald-500">${creator.totalRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Enrollments:</span>
                    <span className="font-semibold flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-chart-1" />
                      {creator.totalEnrollments}
                    </span>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}

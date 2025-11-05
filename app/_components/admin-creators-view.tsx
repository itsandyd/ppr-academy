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
} from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";

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
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-chart-1 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading creators data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Stats */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Creators & Products</h2>
            <p className="text-muted-foreground mt-1">
              Manage and view all creators and their product offerings
            </p>
          </div>
        </div>

        {/* Summary Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Creators</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.totalCreators}</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.totalCourses}</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.totalProducts}</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ${stats.totalRevenue.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search creators, stores, courses, or products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10 bg-background"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchTerm("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Creators List */}
      {filteredCreators.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {searchTerm ? "No creators found matching your search." : "No creators with products found."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="single" collapsible className="space-y-4">
          {filteredCreators.map((creator) => (
            <AccordionItem
              key={creator.userId}
              value={creator.userId}
              className="border border-border rounded-lg bg-card overflow-hidden"
            >
              <AccordionTrigger className="px-6 py-4 hover:bg-muted/50 transition-colors hover:no-underline">
                <div className="flex items-center gap-4 w-full text-left">
                  <Avatar className="h-12 w-12 border-2 border-border">
                    <AvatarImage src={creator.imageUrl} alt={creator.name} />
                    <AvatarFallback className="bg-gradient-to-br from-chart-1 to-chart-2 text-primary-foreground">
                      {creator.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg text-foreground">{creator.name}</h3>
                      {creator.stores.length > 0 && creator.stores[0].isPublic && (
                        <Badge variant="outline" className="bg-chart-1/10 text-chart-1 border-chart-1/20">
                          Public Store
                        </Badge>
                      )}
                    </div>
                    {creator.email && (
                      <p className="text-sm text-muted-foreground">{creator.email}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-1">
                      <Store className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{creator.stores.length}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{creator.courses.length}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{creator.digitalProducts.length}</span>
                    </div>
                    <div className="flex items-center gap-1 text-chart-1">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-bold">{creator.totalRevenue.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-6 pb-6 pt-2 space-y-6 bg-muted/20">
                {/* Stores */}
                {creator.stores.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Store className="h-4 w-4" />
                      Stores ({creator.stores.length})
                    </h4>
                    <div className="space-y-2">
                      {creator.stores.map((store) => (
                        <div
                          key={store._id}
                          className="flex items-center justify-between p-3 rounded-lg bg-background border border-border"
                        >
                          <div>
                            <p className="font-medium text-foreground">{store.name}</p>
                            <p className="text-sm text-muted-foreground">/{store.slug}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={store.isPublic ? "default" : "secondary"}>
                              {store.isPublic ? (
                                <CheckCircle className="h-3 w-3 mr-1" />
                              ) : (
                                <XCircle className="h-3 w-3 mr-1" />
                              )}
                              {store.isPublic ? "Public" : "Private"}
                            </Badge>
                            <Link href={`/${store.slug}`} target="_blank">
                              <Button variant="outline" size="sm">
                                View Store
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
                    <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Courses ({creator.courses.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {creator.courses.map((course) => (
                        <div
                          key={course._id}
                          className="p-3 rounded-lg bg-background border border-border"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <p className="font-medium text-foreground flex-1">{course.title}</p>
                            <Badge variant={course.isPublished ? "default" : "secondary"} className="ml-2">
                              {course.isPublished ? "Published" : "Draft"}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {course.price ? `$${course.price}` : "Free"}
                            </span>
                            <Link href={`/courses/${course._id}`} target="_blank">
                              <Button variant="ghost" size="sm">
                                View
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
                    <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Digital Products ({creator.digitalProducts.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {creator.digitalProducts.map((product) => (
                        <div
                          key={product._id}
                          className="p-3 rounded-lg bg-background border border-border"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{product.title}</p>
                              {product.productType && (
                                <p className="text-xs text-muted-foreground capitalize mt-0.5">
                                  {product.productType.replace("-", " ")}
                                </p>
                              )}
                            </div>
                            <Badge variant={product.isPublished ? "default" : "secondary"} className="ml-2">
                              {product.isPublished ? "Published" : "Draft"}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {product.price ? `$${product.price}` : "Free"}
                            </span>
                            <Link href={`/products/${product._id}`} target="_blank">
                              <Button variant="ghost" size="sm">
                                View
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats Summary */}
                <div className="flex items-center gap-6 pt-4 border-t border-border text-sm">
                  <div>
                    <span className="text-muted-foreground">Total Revenue:</span>{" "}
                    <span className="font-bold text-chart-1">${creator.totalRevenue.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Enrollments:</span>{" "}
                    <span className="font-medium text-foreground">{creator.totalEnrollments}</span>
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


"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { useValidStoreId } from "@/hooks/useStoreId";

// Prevent static generation for this page
export const dynamic = 'force-dynamic';
import { FilterChip } from './components/FilterChip';
import { EmptyStateCard } from './components/EmptyStateCard';
import { AddContactsDialog } from './components/AddContactsDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Plus, Search, Gift, ShoppingCart, Crown, Users, DollarSign, GraduationCap, Package } from 'lucide-react';
import { formatDistanceToNow } from "date-fns";

const filters = [
  'Name',
  'Email',
  'Since',
  'Purchases',
  'Spent',
  'Product',
  'Active Subscription',
  'Tag',
];

export default function CustomersPage() {
  const { user } = useUser();
  const params = useParams();
  const router = useRouter();
  const storeId = useValidStoreId();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  if (!storeId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-destructive">⚠️</span>
              Store Not Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              The store you're trying to access could not be found or is invalid.
            </p>
            <Button onClick={() => router.push('/store')} variant="outline">
              Go Back to Store Selection
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Use the customers API directly (now that Convex dev server is running)
  const customersFromDB = useQuery(
    api.customers.getCustomersForStore,
    storeId ? { storeId } : "skip"
  );
  
  const customerStatsFromDB = useQuery(
    api.customers.getCustomerStats,
    user?.id ? { adminUserId: user.id } : "skip"
  );

  // Note: Mock data removed since we're now using real Convex API

  // Use real data from database (with fallback during loading)
  const customers = customersFromDB || [];
  const customerStats = customerStatsFromDB || {
    totalCustomers: 0,
    leads: 0,
    payingCustomers: 0,
    subscriptionCustomers: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
  };

  // Log the data source for debugging
  console.log("✅ Using real customer data from database");

  // Filter customers based on search and active filter
  const filteredCustomers = customers.filter((customer: any) => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.source?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    // Apply filter logic based on activeFilter
    switch (activeFilter) {
      case "Name":
        return customer.name.toLowerCase().includes(searchTerm.toLowerCase());
      case "Email":
        return customer.email.toLowerCase().includes(searchTerm.toLowerCase());
      case "Product":
        return customer.source?.toLowerCase().includes(searchTerm.toLowerCase());
      default:
        return true;
    }
  });

  const getCustomerIcon = (type: string) => {
    switch (type) {
      case "lead":
        return <Gift className="w-4 h-4 text-green-600" />;
      case "paying":
        return <ShoppingCart className="w-4 h-4 text-blue-600" />;
      case "subscription":
        return <Crown className="w-4 h-4 text-purple-600" />;
      default:
        return <Users className="w-4 h-4 text-gray-600" />;
    }
  };

  const getCustomerBadge = (customer: any) => {
    switch (customer.type) {
      case "lead":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Lead
          </Badge>
        );
      case "paying":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Customer
          </Badge>
        );
      case "subscription":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            Subscriber
          </Badge>
        );
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  // Show empty state if no customers
  if (!customers || customers.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-8 pt-10 pb-24 space-y-6">
        {/* chip row + add */}
        <div className="flex justify-between">
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <FilterChip key={f} label={f} />
            ))}
          </div>

          <AddContactsDialog>
            <Button variant="outline" className="h-8 px-5 border-[#6356FF] text-[#6356FF] hover:bg-[#F1EEFF]">
              <Plus className="h-4 w-4 mr-1" /> Add Contacts
            </Button>
          </AddContactsDialog>
        </div>

        <EmptyStateCard />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-8 pt-10 pb-24 space-y-6">
      {/* Data Source Indicator - Removed since we're now using real API */}

      {/* Filter chips + Add Contacts button */}
      <div className="flex justify-between">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <FilterChip 
              key={f} 
              label={f} 
              active={activeFilter === f}
              onClick={() => setActiveFilter(activeFilter === f ? null : f)}
            />
          ))}
        </div>

        <AddContactsDialog>
          <Button variant="outline" className="h-8 px-5 border-[#6356FF] text-[#6356FF] hover:bg-[#F1EEFF]">
            <Plus className="h-4 w-4 mr-1" /> Add Contacts
          </Button>
        </AddContactsDialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold">{customerStats.totalCustomers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Gift className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Leads</p>
                <p className="text-2xl font-bold">{customerStats.leads}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Paying Customers</p>
                <p className="text-2xl font-bold">{customerStats.payingCustomers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">${customerStats.totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search customers by name, email, or source..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customer List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Customers ({filteredCustomers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No customers found</h3>
              <p className="text-gray-600">Try adjusting your search terms or filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCustomers.map((customer: any) => (
                <Card key={customer._id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {customer.name
                            .split(" ")
                            .map((n: string) => n.charAt(0))
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{customer.name}</h3>
                          {getCustomerBadge(customer)}
                        </div>
                        <p className="text-sm text-gray-600">{customer.email}</p>
                        <p className="text-xs text-gray-500">
                          {customer.source} • {formatDistanceToNow(new Date(customer._creationTime))} ago
                        </p>
                        {/* Show enrolled courses and purchased products */}
                        {(customer.enrolledCourses && customer.enrolledCourses.length > 0) || 
                         (customer.purchasedProducts && customer.purchasedProducts.length > 0) ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {customer.enrolledCourses && customer.enrolledCourses.map((course: any, index: number) => (
                              <Badge 
                                key={`${course.courseId}-${course.enrolledAt}-${index}`}
                                variant="outline" 
                                className="bg-blue-50 text-blue-700 border-blue-200 text-xs"
                              >
                                <GraduationCap className="w-3 h-3 mr-1" />
                                {course.courseTitle}
                                {course.progress > 0 && ` (${course.progress}%)`}
                              </Badge>
                            ))}
                            {customer.purchasedProducts && customer.purchasedProducts.map((product: any, index: number) => (
                              <Badge 
                                key={`${product.productId}-${product.purchasedAt}-${index}`}
                                variant="outline" 
                                className="bg-purple-50 text-purple-700 border-purple-200 text-xs"
                              >
                                <Package className="w-3 h-3 mr-1" />
                                {product.productTitle}
                              </Badge>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">${customer.totalSpent?.toFixed(2) || "0.00"}</p>
                        <p className="text-xs text-gray-500">
                          {customer.type === "lead" ? "Lead" : 
                           customer.type === "paying" ? "Customer" : "Subscriber"}
                        </p>
                        {customer.enrolledCourses && customer.enrolledCourses.length > 0 && (
                          <p className="text-xs text-blue-600 mt-1">
                            {customer.enrolledCourses.length} course{customer.enrolledCourses.length > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {getCustomerIcon(customer.type)}
                        <Badge 
                          variant={customer.status === "active" ? "default" : "secondary"}
                          className={customer.status === "active" ? "bg-green-100 text-green-800" : ""}
                        >
                          {customer.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
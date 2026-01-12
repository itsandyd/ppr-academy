"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Headphones,
  Clock,
  DollarSign,
  MessageSquare,
  Package,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  FileAudio,
  Zap,
  ArrowRight,
  Inbox,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any; customerAction?: string }> = {
  pending_payment: { label: "Pending Payment", color: "bg-gray-500", icon: DollarSign },
  pending_upload: { label: "Upload Files", color: "bg-yellow-500", icon: Upload, customerAction: "Upload your stems" },
  files_received: { label: "In Queue", color: "bg-blue-500", icon: Package },
  in_progress: { label: "Being Mixed", color: "bg-purple-500", icon: RefreshCw },
  pending_review: { label: "Ready for Review", color: "bg-indigo-500", icon: CheckCircle, customerAction: "Review your mix" },
  revision_requested: { label: "Revision in Progress", color: "bg-orange-500", icon: RefreshCw },
  completed: { label: "Completed", color: "bg-green-500", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-red-500", icon: AlertCircle },
  refunded: { label: "Refunded", color: "bg-red-500", icon: AlertCircle },
};

const SERVICE_TYPE_LABELS: Record<string, string> = {
  mixing: "Mixing",
  mastering: "Mastering",
  "mix-and-master": "Mix & Master",
  "stem-mixing": "Stem Mixing",
};

export default function MyOrdersPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("active");

  const orders = useQuery(
    api.serviceOrders.getCustomerOrders,
    user?.id ? { userId: user.id } : "skip"
  );

  const stats = useQuery(
    api.serviceOrders.getOrderStats,
    user?.id ? { userId: user.id, role: "customer" } : "skip"
  );

  if (!user || orders === undefined || stats === undefined) {
    return <LoadingState />;
  }

  const activeOrders = orders.filter((o: { status: string }) =>
    ["pending_upload", "files_received", "in_progress", "pending_review", "revision_requested"].includes(o.status)
  );
  const completedOrders = orders.filter((o: { status: string }) => o.status === "completed");
  const cancelledOrders = orders.filter((o: { status: string }) => ["cancelled", "refunded"].includes(o.status));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Orders</h1>
          <p className="text-muted-foreground">Track your mixing and mastering orders</p>
        </div>
        <Link href="/marketplace/mixing-services">
          <Button className="gap-2">
            <Headphones className="h-4 w-4" />
            Browse Services
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          title="Active Orders"
          value={stats.inProgress + stats.pending}
          icon={<RefreshCw className="h-5 w-5" />}
          color="text-purple-500"
        />
        <StatCard
          title="Needs Action"
          value={stats.pending + stats.awaitingReview}
          icon={<AlertCircle className="h-5 w-5" />}
          color="text-yellow-500"
        />
        <StatCard
          title="In Progress"
          value={stats.inProgress}
          icon={<Clock className="h-5 w-5" />}
          color="text-blue-500"
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          icon={<CheckCircle className="h-5 w-5" />}
          color="text-green-500"
        />
      </div>

      {/* Orders List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Active ({activeOrders.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Completed ({completedOrders.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="gap-2">
            <AlertCircle className="h-4 w-4" />
            Cancelled ({cancelledOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          {activeOrders.length === 0 ? (
            <EmptyState
              title="No active orders"
              description="When you purchase a mixing service, your orders will appear here."
              icon={<Inbox className="h-12 w-12 text-muted-foreground" />}
              action={
                <Link href="/marketplace/mixing-services">
                  <Button className="mt-4">Browse Mixing Services</Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-4">
              {activeOrders.map((order: any) => (
                <OrderCard key={order._id} order={order} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {completedOrders.length === 0 ? (
            <EmptyState
              title="No completed orders"
              description="Your completed orders will appear here."
              icon={<CheckCircle className="h-12 w-12 text-muted-foreground" />}
            />
          ) : (
            <div className="space-y-4">
              {completedOrders.map((order: any) => (
                <OrderCard key={order._id} order={order} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="mt-6">
          {cancelledOrders.length === 0 ? (
            <EmptyState
              title="No cancelled orders"
              description="Cancelled or refunded orders will appear here."
              icon={<AlertCircle className="h-12 w-12 text-muted-foreground" />}
            />
          ) : (
            <div className="space-y-4">
              {cancelledOrders.map((order: any) => (
                <OrderCard key={order._id} order={order} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={color}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function OrderCard({ order }: { order: any }) {
  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending_upload;
  const StatusIcon = statusConfig.icon;

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Left side - Order info */}
          <div className="flex items-start gap-4">
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-purple-500/20 to-indigo-500/20">
              {order.productImage ? (
                <img src={order.productImage} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Headphones className="h-8 w-8 text-purple-500" />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{order.orderNumber}</h3>
                <Badge className={`${statusConfig.color} text-white`}>
                  <StatusIcon className="mr-1 h-3 w-3" />
                  {statusConfig.label}
                </Badge>
                {order.isRush && (
                  <Badge variant="secondary" className="gap-1 bg-amber-500/20 text-amber-600">
                    <Zap className="h-3 w-3" />
                    Rush
                  </Badge>
                )}
              </div>

              <p className="text-sm text-muted-foreground">{order.productTitle}</p>

              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Headphones className="h-3 w-3" />
                  {SERVICE_TYPE_LABELS[order.serviceType] || order.serviceType}
                </span>
                <span className="flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  {order.selectedTier?.name}
                </span>
                <span className="flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" />
                  {order.revisionsAllowed - order.revisionsUsed} revisions left
                </span>
                {(order.unreadByCustomer ?? 0) > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    <MessageSquare className="mr-1 h-3 w-3" />
                    {order.unreadByCustomer} new
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Right side - Price and action */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-lg font-bold text-purple-600">${order.totalPrice}</p>
              <p className="text-xs text-muted-foreground">
                {order.paidAt
                  ? formatDistanceToNow(new Date(order.paidAt), { addSuffix: true })
                  : "Pending"}
              </p>
            </div>

            <Link href={`/dashboard/my-orders/${order._id}`}>
              <Button
                variant={statusConfig.customerAction ? "default" : "outline"}
                size="sm"
                className={statusConfig.customerAction ? "gap-2 bg-gradient-to-r from-purple-500 to-indigo-500" : "gap-2"}
              >
                {statusConfig.customerAction || "View"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Action prompt */}
        {statusConfig.customerAction && (
          <div className="mt-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
            <div className="flex items-center gap-2 text-sm font-medium text-yellow-600">
              <AlertCircle className="h-4 w-4" />
              Action needed: {statusConfig.customerAction}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <Card className="p-12 text-center">
      <div className="flex flex-col items-center gap-4">
        {icon}
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
        {action}
      </div>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>

      <Skeleton className="h-10 w-96" />

      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending_payment: { label: "Pending Payment", color: "bg-gray-500", icon: DollarSign },
  pending_upload: { label: "Awaiting Files", color: "bg-yellow-500", icon: FileAudio },
  files_received: { label: "Files Received", color: "bg-blue-500", icon: Package },
  in_progress: { label: "In Progress", color: "bg-purple-500", icon: RefreshCw },
  pending_review: { label: "Awaiting Review", color: "bg-indigo-500", icon: Clock },
  revision_requested: { label: "Revision Requested", color: "bg-orange-500", icon: AlertCircle },
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

export default function ServiceOrdersPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("active");

  const orders = useQuery(
    api.serviceOrders.getCreatorOrders,
    user?.id ? { userId: user.id } : "skip"
  );

  const stats = useQuery(
    api.serviceOrders.getOrderStats,
    user?.id ? { userId: user.id, role: "creator" } : "skip"
  );

  if (!user || orders === undefined || stats === undefined) {
    return <LoadingState />;
  }

  const activeOrders = orders.filter((o) =>
    ["pending_upload", "files_received", "in_progress", "pending_review", "revision_requested"].includes(o.status)
  );
  const completedOrders = orders.filter((o) => o.status === "completed");
  const cancelledOrders = orders.filter((o) => ["cancelled", "refunded"].includes(o.status));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Service Orders</h1>
          <p className="text-muted-foreground">Manage your incoming mixing and mastering orders</p>
        </div>
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
          title="Awaiting Review"
          value={stats.awaitingReview}
          icon={<Clock className="h-5 w-5" />}
          color="text-indigo-500"
        />
        <StatCard
          title="Revisions Requested"
          value={stats.revisionRequested}
          icon={<AlertCircle className="h-5 w-5" />}
          color="text-orange-500"
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
              description="When customers purchase your mixing services, they'll appear here."
              icon={<Inbox className="h-12 w-12 text-muted-foreground" />}
            />
          ) : (
            <div className="space-y-4">
              {activeOrders.map((order) => (
                <OrderCard key={order._id} order={order} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {completedOrders.length === 0 ? (
            <EmptyState
              title="No completed orders"
              description="Completed orders will appear here."
              icon={<CheckCircle className="h-12 w-12 text-muted-foreground" />}
            />
          ) : (
            <div className="space-y-4">
              {completedOrders.map((order) => (
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
              {cancelledOrders.map((order) => (
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
            <Avatar className="h-12 w-12">
              <AvatarImage src={order.customerAvatar} />
              <AvatarFallback className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
                {order.customerName?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>

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

              <p className="text-sm text-muted-foreground">
                <span className="font-medium">{order.customerName}</span> • {order.productTitle}
              </p>

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
                  {order.revisionsUsed}/{order.revisionsAllowed} revisions
                </span>
                {(order.unreadByCreator ?? 0) > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    <MessageSquare className="mr-1 h-3 w-3" />
                    {order.unreadByCreator} new
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

            <Link href={`/dashboard/service-orders/${order._id}`}>
              <Button variant="outline" size="sm" className="gap-2">
                View
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Due date warning */}
        {order.dueDate && order.status !== "completed" && (
          <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Due date:</span>
              <span className={`font-medium ${new Date(order.dueDate) < new Date() ? "text-red-500" : ""}`}>
                {new Date(order.dueDate).toLocaleDateString()} (
                {formatDistanceToNow(new Date(order.dueDate), { addSuffix: true })})
              </span>
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
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="p-12 text-center">
      <div className="flex flex-col items-center gap-4">
        {icon}
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
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

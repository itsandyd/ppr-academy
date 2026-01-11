"use client";

import { use, useState, useRef, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
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
  Download,
  Upload,
  Send,
  Paperclip,
  Play,
  User,
  Calendar,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { useUploadThing } from "@/lib/uploadthing-hooks";
import { cn } from "@/lib/utils";

interface OrderDetailPageProps {
  params: Promise<{
    orderId: string;
  }>;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  pending_payment: { label: "Pending Payment", color: "text-gray-600", bgColor: "bg-gray-100" },
  pending_upload: { label: "Awaiting Files", color: "text-yellow-600", bgColor: "bg-yellow-100" },
  files_received: { label: "Files Received", color: "text-blue-600", bgColor: "bg-blue-100" },
  in_progress: { label: "In Progress", color: "text-purple-600", bgColor: "bg-purple-100" },
  pending_review: { label: "Awaiting Review", color: "text-indigo-600", bgColor: "bg-indigo-100" },
  revision_requested: { label: "Revision Requested", color: "text-orange-600", bgColor: "bg-orange-100" },
  completed: { label: "Completed", color: "text-green-600", bgColor: "bg-green-100" },
  cancelled: { label: "Cancelled", color: "text-red-600", bgColor: "bg-red-100" },
  refunded: { label: "Refunded", color: "text-red-600", bgColor: "bg-red-100" },
};

const SERVICE_TYPE_LABELS: Record<string, string> = {
  mixing: "Mixing",
  mastering: "Mastering",
  "mix-and-master": "Mix & Master",
  "stem-mixing": "Stem Mixing",
};

export default function CreatorOrderDetailPage({ params }: OrderDetailPageProps) {
  const { orderId } = use(params);
  const { user } = useUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const order = useQuery(
    api.serviceOrders.getOrderById,
    { orderId: orderId as Id<"serviceOrders"> }
  );

  const updateStatus = useMutation(api.serviceOrders.updateOrderStatus);
  const deliverFiles = useMutation(api.serviceOrders.deliverFiles);
  const sendMessage = useMutation(api.serviceOrders.sendMessage);
  const markMessagesRead = useMutation(api.serviceOrders.markMessagesRead);

  const [messageText, setMessageText] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [deliveryFiles, setDeliveryFiles] = useState<File[]>([]);
  const [isDelivering, setIsDelivering] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { startUpload, isUploading } = useUploadThing("audioUploader", {
    onUploadProgress: (progress) => setUploadProgress(progress),
  });

  // Mark messages as read when viewing
  useEffect(() => {
    if (order && user?.id && (order.unreadByCreator ?? 0) > 0) {
      markMessagesRead({
        orderId: orderId as Id<"serviceOrders">,
        userId: user.id,
        userType: "creator",
      });
    }
  }, [order, user?.id, orderId, markMessagesRead]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [order?.messages]);

  if (!user || order === undefined) {
    return <LoadingState />;
  }

  if (!order) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Order not found</h2>
          <p className="text-muted-foreground">This order may have been deleted or you don&apos;t have access.</p>
          <Link href="/dashboard/service-orders">
            <Button className="mt-4">Back to Orders</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Check if current user is the creator
  if (order.creatorId !== user.id) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Access Denied</h2>
          <p className="text-muted-foreground">You don&apos;t have permission to view this order.</p>
          <Link href="/dashboard/service-orders">
            <Button className="mt-4">Back to Orders</Button>
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending_upload;

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateStatus({
        orderId: orderId as Id<"serviceOrders">,
        status: newStatus as any,
      });
      toast.success("Status updated");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    setIsSendingMessage(true);
    try {
      await sendMessage({
        orderId: orderId as Id<"serviceOrders">,
        senderId: user.id,
        senderType: "creator",
        content: messageText,
      });
      setMessageText("");
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleDeliverFiles = async () => {
    if (deliveryFiles.length === 0) {
      toast.error("Please select files to deliver");
      return;
    }

    setIsDelivering(true);
    try {
      // Upload files
      const uploadedFiles = await startUpload(deliveryFiles);

      if (!uploadedFiles || uploadedFiles.length === 0) {
        throw new Error("File upload failed");
      }

      // Deliver files
      const files = uploadedFiles.map((f, index) => ({
        id: crypto.randomUUID(),
        name: deliveryFiles[index].name,
        storageId: f.key,
        size: deliveryFiles[index].size,
        type: deliveryFiles[index].type,
      }));

      await deliverFiles({
        orderId: orderId as Id<"serviceOrders">,
        files,
        notes: deliveryNotes || undefined,
      });

      toast.success("Files delivered successfully!");
      setDeliveryFiles([]);
      setDeliveryNotes("");
      setUploadProgress(0);
    } catch (error) {
      console.error("Delivery error:", error);
      toast.error("Failed to deliver files");
    } finally {
      setIsDelivering(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/service-orders">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Order Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
                    <Badge className={cn(statusConfig.bgColor, statusConfig.color)}>
                      {statusConfig.label}
                    </Badge>
                    {order.isRush && (
                      <Badge className="gap-1 bg-amber-500/20 text-amber-600">
                        <Zap className="h-3 w-3" />
                        Rush
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Headphones className="h-4 w-4" />
                      {SERVICE_TYPE_LABELS[order.serviceType]}
                    </span>
                    <span className="flex items-center gap-1">
                      <Package className="h-4 w-4" />
                      {order.selectedTier?.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <RefreshCw className="h-4 w-4" />
                      {order.revisionsUsed}/{order.revisionsAllowed} revisions
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold text-purple-600">${order.totalPrice}</p>
                  {order.isRush && order.rushFee && (
                    <p className="text-xs text-muted-foreground">Includes ${order.rushFee} rush fee</p>
                  )}
                </div>
              </div>

              {/* Status Update */}
              {order.status !== "completed" && order.status !== "cancelled" && (
                <div className="mt-6 flex items-center gap-4">
                  <span className="text-sm font-medium">Update Status:</span>
                  <Select value={order.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="files_received">Files Received</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="pending_review">Pending Review</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Files */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileAudio className="h-5 w-5" />
                Customer Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.customerFiles && order.customerFiles.length > 0 ? (
                <div className="space-y-2">
                  {order.customerFiles.map((file: any) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <FileAudio className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      {file.url && (
                        <a href={file.url} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </Button>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-muted-foreground">
                  Customer hasn&apos;t uploaded files yet
                </p>
              )}

              {order.customerNotes && (
                <div className="mt-4 rounded-lg bg-muted/50 p-4">
                  <h4 className="mb-2 text-sm font-semibold">Customer Notes</h4>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">{order.customerNotes}</p>
                </div>
              )}

              {order.referenceTrackUrl && (
                <div className="mt-4">
                  <h4 className="mb-2 text-sm font-semibold">Reference Track</h4>
                  <a
                    href={order.referenceTrackUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-purple-600 hover:underline"
                  >
                    {order.referenceTrackUrl}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Deliver Files */}
          {["files_received", "in_progress", "revision_requested"].includes(order.status) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Deliver Files
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 p-6 transition-colors hover:border-purple-500/50"
                  onClick={() => document.getElementById("deliveryFileInput")?.click()}
                >
                  <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Click to upload files</p>
                  <p className="text-xs text-muted-foreground">WAV, MP3, or other audio files</p>
                </div>

                <input
                  id="deliveryFileInput"
                  type="file"
                  multiple
                  accept="audio/*,.wav,.mp3,.flac,.aiff"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      setDeliveryFiles(Array.from(e.target.files));
                    }
                  }}
                />

                {deliveryFiles.length > 0 && (
                  <div className="space-y-2">
                    {deliveryFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between rounded-lg border border-border p-2">
                        <div className="flex items-center gap-2">
                          <FileAudio className="h-5 w-5 text-muted-foreground" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-muted-foreground">({formatFileSize(file.size)})</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeliveryFiles(deliveryFiles.filter((_, i) => i !== index))}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <Textarea
                  placeholder="Add delivery notes (optional)..."
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  className="min-h-[80px]"
                />

                {isUploading && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} />
                    <p className="text-center text-sm text-muted-foreground">Uploading... {uploadProgress}%</p>
                  </div>
                )}

                <Button
                  onClick={handleDeliverFiles}
                  disabled={deliveryFiles.length === 0 || isDelivering}
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-500"
                >
                  {isDelivering ? "Delivering..." : "Deliver Files"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Delivered Files */}
          {order.deliveredFiles && order.deliveredFiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Delivered Files
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Group by version */}
                  {Array.from(new Set(order.deliveredFiles.map((f: any) => f.version))).map((version: any) => (
                    <div key={version} className="rounded-lg border border-border p-4">
                      <h4 className="mb-3 text-sm font-semibold">
                        {version === 1 ? "Initial Delivery" : `Revision ${version - 1}`}
                      </h4>
                      <div className="space-y-2">
                        {order.deliveredFiles
                          .filter((f: any) => f.version === version)
                          .map((file: any) => (
                            <div key={file.id} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FileAudio className="h-5 w-5 text-muted-foreground" />
                                <span className="text-sm">{file.name}</span>
                              </div>
                              {file.url && (
                                <a href={file.url} target="_blank" rel="noopener noreferrer">
                                  <Button variant="ghost" size="sm">
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </a>
                              )}
                            </div>
                          ))}
                      </div>
                      {order.deliveredFiles.find((f: any) => f.version === version)?.notes && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          {order.deliveredFiles.find((f: any) => f.version === version)?.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[400px] space-y-4 overflow-y-auto">
                {order.messages?.map((msg: any) => (
                  <div
                    key={msg._id}
                    className={cn(
                      "flex gap-3",
                      msg.senderType === "creator" && !msg.isSystemMessage && "flex-row-reverse"
                    )}
                  >
                    {msg.isSystemMessage ? (
                      <div className="w-full rounded-lg bg-muted/50 p-3 text-center">
                        <p className="text-sm text-muted-foreground">{msg.content}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {format(new Date(msg.createdAt), "MMM d, h:mm a")}
                        </p>
                      </div>
                    ) : (
                      <>
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={msg.senderAvatar} />
                          <AvatarFallback>{msg.senderName?.charAt(0) || "?"}</AvatarFallback>
                        </Avatar>
                        <div
                          className={cn(
                            "max-w-[70%] rounded-lg p-3",
                            msg.senderType === "creator"
                              ? "bg-purple-500 text-white"
                              : "bg-muted"
                          )}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p
                            className={cn(
                              "mt-1 text-xs",
                              msg.senderType === "creator" ? "text-purple-200" : "text-muted-foreground"
                            )}
                          >
                            {format(new Date(msg.createdAt), "h:mm a")}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {order.status !== "completed" && order.status !== "cancelled" && (
                <div className="mt-4 flex gap-2">
                  <Textarea
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="min-h-[80px] flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || isSendingMessage}
                    className="self-end"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={order.customerAvatar} />
                  <AvatarFallback className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
                    {order.customerName?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{order.customerName}</p>
                  <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Service</span>
                <span className="text-sm font-medium">{SERVICE_TYPE_LABELS[order.serviceType]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Package</span>
                <span className="text-sm font-medium">{order.selectedTier?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Stems</span>
                <span className="text-sm font-medium">{order.selectedTier?.stemCount}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Base Price</span>
                <span className="text-sm font-medium">${order.basePrice}</span>
              </div>
              {order.rushFee && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Rush Fee</span>
                  <span className="text-sm font-medium">${order.rushFee}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm font-medium">Total</span>
                <span className="text-sm font-bold text-purple-600">${order.totalPrice}</span>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.paidAt && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Paid</span>
                  <span className="text-sm">{format(new Date(order.paidAt), "MMM d, yyyy")}</span>
                </div>
              )}
              {order.filesUploadedAt && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Files Received</span>
                  <span className="text-sm">{format(new Date(order.filesUploadedAt), "MMM d, yyyy")}</span>
                </div>
              )}
              {order.workStartedAt && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Work Started</span>
                  <span className="text-sm">{format(new Date(order.workStartedAt), "MMM d, yyyy")}</span>
                </div>
              )}
              {order.firstDeliveryAt && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">First Delivery</span>
                  <span className="text-sm">{format(new Date(order.firstDeliveryAt), "MMM d, yyyy")}</span>
                </div>
              )}
              {order.completedAt && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Completed</span>
                  <span className="text-sm">{format(new Date(order.completedAt), "MMM d, yyyy")}</span>
                </div>
              )}
              {order.dueDate && order.status !== "completed" && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Due Date</span>
                  <span className={cn(
                    "text-sm font-medium",
                    new Date(order.dueDate) < new Date() ? "text-red-500" : "text-purple-600"
                  )}>
                    {format(new Date(order.dueDate), "MMM d, yyyy")}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-32" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-64" />
          <Skeleton className="h-96" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    </div>
  );
}

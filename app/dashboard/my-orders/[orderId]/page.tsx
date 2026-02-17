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
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  User,
  Calendar,
  FileText,
  Music,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
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

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; description: string }> = {
  pending_payment: { label: "Pending Payment", color: "text-gray-600", bgColor: "bg-gray-100", description: "Complete your payment to continue" },
  pending_upload: { label: "Upload Your Files", color: "text-yellow-600", bgColor: "bg-yellow-100", description: "Upload your stems/files to get started" },
  files_received: { label: "Files Received", color: "text-blue-600", bgColor: "bg-blue-100", description: "Your files are in the queue" },
  in_progress: { label: "Being Mixed", color: "text-purple-600", bgColor: "bg-purple-100", description: "Your mix is being worked on" },
  pending_review: { label: "Ready for Review", color: "text-indigo-600", bgColor: "bg-indigo-100", description: "Review your mix and approve or request revisions" },
  revision_requested: { label: "Revision in Progress", color: "text-orange-600", bgColor: "bg-orange-100", description: "Your revision request is being worked on" },
  completed: { label: "Completed", color: "text-green-600", bgColor: "bg-green-100", description: "Your order has been completed" },
  cancelled: { label: "Cancelled", color: "text-red-600", bgColor: "bg-red-100", description: "This order was cancelled" },
  refunded: { label: "Refunded", color: "text-red-600", bgColor: "bg-red-100", description: "This order was refunded" },
};

const SERVICE_TYPE_LABELS: Record<string, string> = {
  mixing: "Mixing",
  mastering: "Mastering",
  "mix-and-master": "Mix & Master",
  "stem-mixing": "Stem Mixing",
};

export default function CustomerOrderDetailPage({ params }: OrderDetailPageProps) {
  const { orderId } = use(params);
  const { user } = useUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const order = useQuery(
    api.serviceOrders.getOrderById,
    { orderId: orderId as Id<"serviceOrders"> }
  );

  const uploadCustomerFiles = useMutation(api.serviceOrders.uploadCustomerFiles);
  const requestRevision = useMutation(api.serviceOrders.requestRevision);
  const approveDelivery = useMutation(api.serviceOrders.approveDelivery);
  const sendMessage = useMutation(api.serviceOrders.sendMessage);
  const markMessagesRead = useMutation(api.serviceOrders.markMessagesRead);

  const [messageText, setMessageText] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [customerNotes, setCustomerNotes] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [revisionFeedback, setRevisionFeedback] = useState("");
  const [isRequestingRevision, setIsRequestingRevision] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const { startUpload } = useUploadThing("audioUploader", {
    onUploadProgress: (progress) => setUploadProgress(progress),
  });

  // Mark messages as read when viewing
  useEffect(() => {
    if (order && user?.id && (order.unreadByCustomer ?? 0) > 0) {
      markMessagesRead({
        orderId: orderId as Id<"serviceOrders">,
        userType: "customer",
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
          <Link href="/dashboard/my-orders">
            <Button className="mt-4">Back to My Orders</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Check if current user is the customer
  if (order.customerId !== user.id) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Access Denied</h2>
          <p className="text-muted-foreground">You don&apos;t have permission to view this order.</p>
          <Link href="/dashboard/my-orders">
            <Button className="mt-4">Back to My Orders</Button>
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending_upload;

  const handleUploadFiles = async () => {
    if (uploadFiles.length === 0) {
      toast.error("Please select files to upload");
      return;
    }

    setIsUploading(true);
    try {
      const uploadedFiles = await startUpload(uploadFiles);

      if (!uploadedFiles || uploadedFiles.length === 0) {
        throw new Error("File upload failed");
      }

      const files = uploadedFiles.map((f, index) => ({
        id: crypto.randomUUID(),
        name: uploadFiles[index].name,
        storageId: f.key,
        size: uploadFiles[index].size,
        type: uploadFiles[index].type,
      }));

      await uploadCustomerFiles({
        orderId: orderId as Id<"serviceOrders">,
        files,
        notes: customerNotes || undefined,
        referenceTrackUrl: referenceUrl || undefined,
      });

      toast.success("Files uploaded successfully!");
      setUploadFiles([]);
      setCustomerNotes("");
      setReferenceUrl("");
      setUploadProgress(0);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload files");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    setIsSendingMessage(true);
    try {
      await sendMessage({
        orderId: orderId as Id<"serviceOrders">,
        senderType: "customer",
        content: messageText,
      });
      setMessageText("");
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!revisionFeedback.trim()) {
      toast.error("Please provide feedback for your revision request");
      return;
    }

    setIsRequestingRevision(true);
    try {
      const result = await requestRevision({
        orderId: orderId as Id<"serviceOrders">,
        feedback: revisionFeedback,
      });
      toast.success(`Revision requested! ${result.revisionsRemaining} revision(s) remaining.`);
      setShowRevisionDialog(false);
      setRevisionFeedback("");
    } catch (error: any) {
      toast.error(error.message || "Failed to request revision");
    } finally {
      setIsRequestingRevision(false);
    }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await approveDelivery({
        orderId: orderId as Id<"serviceOrders">,
      });
      toast.success("Order completed! Thank you for your business.");
    } catch (error) {
      toast.error("Failed to approve delivery");
    } finally {
      setIsApproving(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const revisionsRemaining = order.revisionsAllowed - order.revisionsUsed;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/my-orders">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Orders
          </Button>
        </Link>
      </div>

      {/* Status Banner */}
      <Card className={cn("border-2", statusConfig.bgColor.replace("bg-", "border-").replace("100", "300"))}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className={cn("rounded-full p-3", statusConfig.bgColor)}>
              {order.status === "pending_upload" && <Upload className={cn("h-6 w-6", statusConfig.color)} />}
              {order.status === "files_received" && <Package className={cn("h-6 w-6", statusConfig.color)} />}
              {order.status === "in_progress" && <RefreshCw className={cn("h-6 w-6", statusConfig.color)} />}
              {order.status === "pending_review" && <CheckCircle className={cn("h-6 w-6", statusConfig.color)} />}
              {order.status === "revision_requested" && <RefreshCw className={cn("h-6 w-6", statusConfig.color)} />}
              {order.status === "completed" && <CheckCircle className={cn("h-6 w-6", statusConfig.color)} />}
              {["cancelled", "refunded"].includes(order.status) && <AlertCircle className={cn("h-6 w-6", statusConfig.color)} />}
            </div>
            <div>
              <h2 className={cn("text-xl font-bold", statusConfig.color)}>{statusConfig.label}</h2>
              <p className="text-muted-foreground">{statusConfig.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

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
                    {order.isRush && (
                      <Badge className="gap-1 bg-amber-500/20 text-amber-600">
                        <Zap className="h-3 w-3" />
                        Rush Delivery
                      </Badge>
                    )}
                  </div>

                  <p className="text-muted-foreground">{order.product?.title}</p>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Headphones className="h-4 w-4" />
                      {SERVICE_TYPE_LABELS[order.serviceType]}
                    </span>
                    <span className="flex items-center gap-1">
                      <Package className="h-4 w-4" />
                      {order.selectedTier?.name}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold text-purple-600">${order.totalPrice}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload Files - Only show if pending_upload */}
          {order.status === "pending_upload" && (
            <Card className="border-2 border-yellow-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-600">
                  <Upload className="h-5 w-5" />
                  Upload Your Files
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 p-6 transition-colors hover:border-purple-500/50"
                  onClick={() => document.getElementById("customerFileInput")?.click()}
                >
                  <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Click to upload stems/files</p>
                  <p className="text-xs text-muted-foreground">WAV, MP3, ZIP, or other audio files</p>
                </div>

                <input
                  id="customerFileInput"
                  type="file"
                  multiple
                  accept="audio/*,.wav,.mp3,.flac,.aiff,.zip"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      setUploadFiles(Array.from(e.target.files));
                    }
                  }}
                />

                {uploadFiles.length > 0 && (
                  <div className="space-y-2">
                    {uploadFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between rounded-lg border border-border p-2">
                        <div className="flex items-center gap-2">
                          <FileAudio className="h-5 w-5 text-muted-foreground" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-muted-foreground">({formatFileSize(file.size)})</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setUploadFiles(uploadFiles.filter((_, i) => i !== index))}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <Textarea
                  placeholder="Notes for the engineer (style preferences, reference details, etc.)..."
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  className="min-h-[80px]"
                />

                <Input
                  placeholder="Reference track URL (optional - Spotify, YouTube, SoundCloud, etc.)"
                  value={referenceUrl}
                  onChange={(e) => setReferenceUrl(e.target.value)}
                />

                {isUploading && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} />
                    <p className="text-center text-sm text-muted-foreground">Uploading... {uploadProgress}%</p>
                  </div>
                )}

                <Button
                  onClick={handleUploadFiles}
                  disabled={uploadFiles.length === 0 || isUploading}
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-500"
                >
                  {isUploading ? "Uploading..." : "Upload Files"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Delivered Files - Show if there are delivered files */}
          {order.deliveredFiles && order.deliveredFiles.length > 0 && (
            <Card className={order.status === "pending_review" ? "border-2 border-indigo-500/30" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5 text-indigo-500" />
                  Your Mixed Files
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Group by version */}
                {Array.from(new Set(order.deliveredFiles.map((f: any) => f.version))).map((version: any) => (
                  <div key={version} className="rounded-lg border border-border p-4">
                    <h4 className="mb-3 text-sm font-semibold">
                      {version === 1 ? "Initial Mix" : `Revision ${version - 1}`}
                    </h4>
                    <div className="space-y-2">
                      {order.deliveredFiles
                        .filter((f: any) => f.version === version)
                        .map((file: any) => (
                          <div key={file.id} className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
                            <div className="flex items-center gap-3">
                              <FileAudio className="h-6 w-6 text-purple-500" />
                              <div>
                                <p className="font-medium">{file.name}</p>
                                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                              </div>
                            </div>
                            {file.url && (
                              <a href={file.url} target="_blank" rel="noopener noreferrer">
                                <Button className="gap-2">
                                  <Download className="h-4 w-4" />
                                  Download
                                </Button>
                              </a>
                            )}
                          </div>
                        ))}
                    </div>
                    {order.deliveredFiles.find((f: any) => f.version === version)?.notes && (
                      <p className="mt-3 text-sm text-muted-foreground">
                        <span className="font-medium">Notes:</span> {order.deliveredFiles.find((f: any) => f.version === version)?.notes}
                      </p>
                    )}
                  </div>
                ))}

                {/* Review Actions */}
                {order.status === "pending_review" && (
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleApprove}
                      disabled={isApproving}
                      className="flex-1 gap-2 bg-green-500 hover:bg-green-600"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      {isApproving ? "Approving..." : "Approve & Complete"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowRevisionDialog(true)}
                      disabled={revisionsRemaining === 0}
                      className="flex-1 gap-2"
                    >
                      <ThumbsDown className="h-4 w-4" />
                      Request Revision ({revisionsRemaining} left)
                    </Button>
                  </div>
                )}
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
                      msg.senderType === "customer" && !msg.isSystemMessage && "flex-row-reverse"
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
                            msg.senderType === "customer"
                              ? "bg-purple-500 text-white"
                              : "bg-muted"
                          )}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p
                            className={cn(
                              "mt-1 text-xs",
                              msg.senderType === "customer" ? "text-purple-200" : "text-muted-foreground"
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
          {/* Creator Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Your Engineer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={order.creatorAvatar} />
                  <AvatarFallback className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
                    {order.creatorName?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{order.creatorName}</p>
                  <p className="text-sm text-muted-foreground">{order.creatorEmail}</p>
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
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Revisions</span>
                <span className="text-sm font-medium">{revisionsRemaining} of {order.revisionsAllowed} remaining</span>
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
                <span className="text-sm font-medium">Total Paid</span>
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
                  <span className="text-sm text-muted-foreground">Ordered</span>
                  <span className="text-sm">{format(new Date(order.paidAt), "MMM d, yyyy")}</span>
                </div>
              )}
              {order.filesUploadedAt && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Files Sent</span>
                  <span className="text-sm">{format(new Date(order.filesUploadedAt), "MMM d, yyyy")}</span>
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
                  <span className="text-sm font-medium">Expected By</span>
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

      {/* Revision Dialog */}
      <Dialog open={showRevisionDialog} onOpenChange={setShowRevisionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request a Revision</DialogTitle>
            <DialogDescription>
              Please provide specific feedback about what you&apos;d like changed. You have {revisionsRemaining} revision(s) remaining.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Please describe what you'd like adjusted in your mix..."
            value={revisionFeedback}
            onChange={(e) => setRevisionFeedback(e.target.value)}
            className="min-h-[150px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRevisionDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRequestRevision}
              disabled={!revisionFeedback.trim() || isRequestingRevision}
            >
              {isRequestingRevision ? "Submitting..." : "Submit Revision Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-24" />
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

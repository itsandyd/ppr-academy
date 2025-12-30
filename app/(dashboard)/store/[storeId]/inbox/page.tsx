"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export const dynamic = "force-dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Inbox,
  Mail,
  MailOpen,
  Reply,
  Trash2,
  Archive,
  AlertCircle,
  CheckCircle2,
  Clock,
  Send,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CreatorInboxPage() {
  const params = useParams();
  const storeId = params.storeId as Id<"stores">;
  const { toast } = useToast();

  const [selectedFilter, setSelectedFilter] = useState<"all" | "new" | "read" | "replied">("all");
  const [selectedReplyId, setSelectedReplyId] = useState<Id<"emailReplies"> | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Fetch inbox
  const allReplies = useQuery(api.inboxQueries?.getCreatorInbox, { storeId });
  const stats = useQuery(api.inboxQueries?.getInboxStats, { storeId });
  const selectedReply = selectedReplyId
    ? useQuery(api.inboxQueries?.getReplyDetails, { replyId: selectedReplyId })
    : null;

  // Mutations
  const markAsRead = useMutation(api.inboxQueries?.markReplyAsRead);
  const replyToCustomer = useMutation(api.inboxQueries?.replyToCustomer);
  const markAsSpam = useMutation(api.inboxQueries?.markAsSpam);
  const archiveReply = useMutation(api.inboxQueries?.archiveReply);

  // Filter replies
  const filteredReplies =
    allReplies?.filter((reply: any) => {
      if (selectedFilter === "all") return true;
      return reply.status === selectedFilter;
    }) || [];

  const handleReplyClick = async (replyId: Id<"emailReplies">) => {
    setSelectedReplyId(replyId);
    // Mark as read when opened
    try {
      await markAsRead({ replyId });
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleSendReply = async () => {
    if (!selectedReplyId || !replyMessage.trim()) return;

    setIsSending(true);
    try {
      await replyToCustomer({
        replyId: selectedReplyId,
        message: replyMessage,
      });

      toast({
        title: "Reply Sent!",
        description: "Your reply has been sent to the customer",
      });

      setReplyMessage("");
      setSelectedReplyId(null);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send reply",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
    if (diffHours < 48) return "Yesterday";
    return date.toLocaleDateString();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-8">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <Inbox className="h-8 w-8" />
          Customer Inbox
        </h1>
        <p className="text-muted-foreground">
          View and respond to customer replies from your email campaigns
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Replies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">New</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Read</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.read}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Replied</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.replied}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter Tabs */}
      <Tabs value={selectedFilter} onValueChange={(v: any) => setSelectedFilter(v)}>
        <TabsList>
          <TabsTrigger value="all">All ({stats?.total || 0})</TabsTrigger>
          <TabsTrigger value="new">
            <Mail className="mr-2 h-4 w-4" />
            New ({stats?.new || 0})
          </TabsTrigger>
          <TabsTrigger value="read">
            <MailOpen className="mr-2 h-4 w-4" />
            Read ({stats?.read || 0})
          </TabsTrigger>
          <TabsTrigger value="replied">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Replied ({stats?.replied || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedFilter} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Replies</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredReplies.length > 0 ? (
                <div className="space-y-2">
                  {filteredReplies.map((reply: any) => (
                    <div
                      key={reply._id}
                      onClick={() => handleReplyClick(reply._id)}
                      className={`cursor-pointer rounded-lg border p-4 transition-all hover:shadow-md ${
                        reply.status === "new"
                          ? "border-blue-200 bg-blue-50 dark:bg-blue-950"
                          : "bg-white dark:bg-black"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <span className="font-medium">{reply.fromName || reply.fromEmail}</span>
                            {reply.status === "new" && (
                              <Badge className="bg-blue-100 text-xs text-blue-800">New</Badge>
                            )}
                            {reply.status === "replied" && (
                              <Badge className="bg-green-100 text-xs text-green-800">
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                Replied
                              </Badge>
                            )}
                            {reply.matchConfidence && reply.matchConfidence !== "high" && (
                              <Badge variant="outline" className="text-xs">
                                {reply.matchConfidence} confidence
                              </Badge>
                            )}
                          </div>
                          <div className="mb-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                            {reply.subject}
                          </div>
                          <div className="line-clamp-2 text-sm text-muted-foreground">
                            {reply.textBody}
                          </div>
                        </div>
                        <div className="ml-4 text-sm text-muted-foreground">
                          <Clock className="mr-1 inline h-4 w-4" />
                          {formatDate(reply.receivedAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Inbox className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-medium">No replies yet</h3>
                  <p className="text-muted-foreground">
                    Customer replies to your email campaigns will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reply Details Dialog */}
      <Dialog open={!!selectedReplyId} onOpenChange={(open) => !open && setSelectedReplyId(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto bg-white dark:bg-black">
          <DialogHeader>
            <DialogTitle>Customer Reply</DialogTitle>
            <DialogDescription>View and respond to customer message</DialogDescription>
          </DialogHeader>

          {selectedReply && (
            <div className="space-y-4">
              {/* Email Details */}
              <Card>
                <CardContent className="space-y-3 pt-6">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">From:</span>
                    <span className="font-medium">
                      {selectedReply.fromName || selectedReply.fromEmail}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Email:</span>
                    <span className="text-sm">{selectedReply.fromEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Subject:</span>
                    <span className="text-sm font-medium">{selectedReply.subject}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Received:</span>
                    <span className="text-sm">
                      {new Date(selectedReply.receivedAt).toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Message Content */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Message</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-wrap rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
                    {selectedReply.textBody || selectedReply.htmlBody || "No content"}
                  </div>
                </CardContent>
              </Card>

              {/* Previous Reply (if exists) */}
              {selectedReply.creatorReply && (
                <Card className="border-green-200 bg-green-50 dark:bg-green-950">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      Your Reply
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="whitespace-pre-wrap rounded-lg bg-white p-4 dark:bg-black">
                      {selectedReply.creatorReply.message}
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      Sent {new Date(selectedReply.creatorReply.sentAt).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Reply Form (if not already replied) */}
              {selectedReply.status !== "replied" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Your Reply</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder="Type your reply..."
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      rows={6}
                      className="w-full"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSendReply}
                        disabled={!replyMessage.trim() || isSending}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        {isSending ? "Sending..." : "Send Reply"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={async () => {
                          try {
                            await markAsSpam({ replyId: selectedReplyId! });
                            toast({ title: "Marked as spam" });
                            setSelectedReplyId(null);
                          } catch (error) {
                            toast({
                              title: "Error",
                              description: "Failed to mark as spam",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Mark as Spam
                      </Button>
                      <Button
                        variant="outline"
                        onClick={async () => {
                          try {
                            await archiveReply({ replyId: selectedReplyId! });
                            toast({ title: "Archived" });
                            setSelectedReplyId(null);
                          } catch (error) {
                            toast({
                              title: "Error",
                              description: "Failed to archive",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <Archive className="mr-2 h-4 w-4" />
                        Archive
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

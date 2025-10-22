"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export const dynamic = 'force-dynamic';
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
  const filteredReplies = allReplies?.filter(reply => {
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
    <div className="max-w-7xl mx-auto p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Inbox className="w-8 h-8" />
          Customer Inbox
        </h1>
        <p className="text-muted-foreground">
          View and respond to customer replies from your email campaigns
        </p>
      </div>
      
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <CardTitle className="text-sm font-medium text-muted-foreground">
                New
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Read
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.read}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Replied
              </CardTitle>
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
          <TabsTrigger value="all">
            All ({stats?.total || 0})
          </TabsTrigger>
          <TabsTrigger value="new">
            <Mail className="w-4 h-4 mr-2" />
            New ({stats?.new || 0})
          </TabsTrigger>
          <TabsTrigger value="read">
            <MailOpen className="w-4 h-4 mr-2" />
            Read ({stats?.read || 0})
          </TabsTrigger>
          <TabsTrigger value="replied">
            <CheckCircle2 className="w-4 h-4 mr-2" />
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
                  {filteredReplies.map((reply) => (
                    <div
                      key={reply._id}
                      onClick={() => handleReplyClick(reply._id)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        reply.status === "new" 
                          ? "bg-blue-50 dark:bg-blue-950 border-blue-200" 
                          : "bg-white dark:bg-black"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{reply.fromName || reply.fromEmail}</span>
                            {reply.status === "new" && (
                              <Badge className="bg-blue-100 text-blue-800 text-xs">New</Badge>
                            )}
                            {reply.status === "replied" && (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Replied
                              </Badge>
                            )}
                            {reply.matchConfidence && reply.matchConfidence !== "high" && (
                              <Badge variant="outline" className="text-xs">
                                {reply.matchConfidence} confidence
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                            {reply.subject}
                          </div>
                          <div className="text-sm text-muted-foreground line-clamp-2">
                            {reply.textBody}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground ml-4">
                          <Clock className="w-4 h-4 inline mr-1" />
                          {formatDate(reply.receivedAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Inbox className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No replies yet</h3>
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
        <DialogContent className="bg-white dark:bg-black max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Reply</DialogTitle>
            <DialogDescription>
              View and respond to customer message
            </DialogDescription>
          </DialogHeader>
          
          {selectedReply && (
            <div className="space-y-4">
              {/* Email Details */}
              <Card>
                <CardContent className="pt-6 space-y-3">
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
                    <span className="text-sm">{new Date(selectedReply.receivedAt).toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
              
              {/* Message Content */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Message</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg whitespace-pre-wrap">
                    {selectedReply.textBody || selectedReply.htmlBody || "No content"}
                  </div>
                </CardContent>
              </Card>
              
              {/* Previous Reply (if exists) */}
              {selectedReply.creatorReply && (
                <Card className="border-green-200 bg-green-50 dark:bg-green-950">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      Your Reply
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-white dark:bg-black p-4 rounded-lg whitespace-pre-wrap">
                      {selectedReply.creatorReply.message}
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">
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
                        <Send className="w-4 h-4 mr-2" />
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
                        <Trash2 className="w-4 h-4 mr-2" />
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
                        <Archive className="w-4 h-4 mr-2" />
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


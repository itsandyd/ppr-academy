"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Inbox, 
  CheckCircle2, 
  XCircle, 
  MessageSquare, 
  Music,
  Calendar,
  DollarSign,
  Filter,
  Settings,
  Play
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useToast } from "@/hooks/use-toast";
import { EmptyStateEnhanced } from "@/components/ui/empty-state-enhanced";
import { formatDistanceToNow } from "date-fns";

export default function SubmissionsPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("inbox");
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [feedback, setFeedback] = useState("");
  const [selectedPlaylist, setSelectedPlaylist] = useState("");

  // Fetch submissions
  const allSubmissions = useQuery(
    api.submissions.getCreatorSubmissions,
    user?.id ? { creatorId: user.id } : "skip"
  );

  const stats = useQuery(
    api.submissions.getSubmissionStats,
    user?.id ? { creatorId: user.id } : "skip"
  );

  const playlists = useQuery(
    api.playlists.getCreatorPlaylists,
    user?.id ? { creatorId: user.id } : "skip"
  );

  const acceptSubmission = useMutation(api.submissions.acceptSubmission);
  const declineSubmission = useMutation(api.submissions.declineSubmission);

  const filteredSubmissions = allSubmissions?.filter(s => {
    if (activeTab === "inbox") return s.status === "inbox";
    if (activeTab === "reviewed") return s.status === "reviewed";
    if (activeTab === "accepted") return s.status === "accepted";
    if (activeTab === "declined") return s.status === "declined";
    return true;
  });

  const handleAccept = async (submissionId: string) => {
    if (!selectedPlaylist) {
      toast({
        title: "Select Playlist",
        description: "Please select a playlist to add this track to",
        variant: "destructive",
      });
      return;
    }

    try {
      await acceptSubmission({
        submissionId: submissionId as any,
        playlistId: selectedPlaylist as any,
        feedback: feedback || undefined,
      });

      toast({
        title: "✅ Submission Accepted!",
        description: "Track added to your playlist",
        className: "bg-white dark:bg-black",
      });

      setShowFeedbackDialog(false);
      setFeedback("");
      setSelectedPlaylist("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept submission",
        variant: "destructive",
      });
    }
  };

  const handleDecline = async (submissionId: string, reason: string) => {
    try {
      await declineSubmission({
        submissionId: submissionId as any,
        decisionNotes: reason || "Not a fit at this time",
        feedback: feedback || undefined,
      });

      toast({
        title: "Submission Declined",
        description: "Artist will be notified",
        className: "bg-white dark:bg-black",
      });

      setShowFeedbackDialog(false);
      setFeedback("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to decline submission",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Submissions</h1>
          <p className="text-muted-foreground">
            Review and manage track submissions to your playlists
          </p>
        </div>
        <Button variant="outline" asChild>
          <a href="/home/playlists">
            <Settings className="w-4 h-4 mr-2" />
            Playlist Settings
          </a>
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">{stats.inbox}</div>
              <div className="text-sm text-muted-foreground">Inbox</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.reviewed}</div>
              <div className="text-sm text-muted-foreground">Reviewed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
              <div className="text-sm text-muted-foreground">Accepted</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{stats.declined}</div>
              <div className="text-sm text-muted-foreground">Declined</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="inbox" className="gap-2">
            <Inbox className="w-4 h-4" />
            Inbox ({stats?.inbox || 0})
          </TabsTrigger>
          <TabsTrigger value="reviewed" className="gap-2">
            Reviewed ({stats?.reviewed || 0})
          </TabsTrigger>
          <TabsTrigger value="accepted" className="gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Accepted ({stats?.accepted || 0})
          </TabsTrigger>
          <TabsTrigger value="declined" className="gap-2">
            <XCircle className="w-4 h-4" />
            Declined ({stats?.declined || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredSubmissions && filteredSubmissions.length > 0 ? (
            <div className="space-y-4">
              {filteredSubmissions.map((submission) => (
                <Card key={submission._id}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-6">
                      {/* Track Info */}
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Music className="w-8 h-8 text-purple-600" />
                      </div>

                      <div className="flex-1 space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{submission.track?.title || "Untitled"}</h3>
                            <p className="text-sm text-muted-foreground">
                              by {submission.submitterName}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {submission.submissionFee > 0 && (
                              <Badge variant="secondary" className="gap-1">
                                <DollarSign className="w-3 h-3" />
                                ${submission.submissionFee}
                              </Badge>
                            )}
                            {submission.playlistName && (
                              <Badge variant="outline">
                                {submission.playlistName}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Message */}
                        {submission.message && (
                          <div className="bg-muted rounded-lg p-3">
                            <p className="text-sm text-muted-foreground italic">
                              "{submission.message}"
                            </p>
                          </div>
                        )}

                        {/* Meta */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDistanceToNow(new Date(submission._creationTime), { addSuffix: true })}
                          </span>
                          {submission.track?.genre && (
                            <Badge variant="secondary" className="text-xs capitalize">
                              {submission.track.genre}
                            </Badge>
                          )}
                        </div>

                        {/* Actions (Inbox only) */}
                        {submission.status === "inbox" && (
                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              className="gap-1"
                              onClick={() => {
                                setSelectedSubmission(submission);
                                setShowFeedbackDialog(true);
                              }}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Accept & Add to Playlist
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              onClick={() => handleDecline(submission._id, "Not a fit")}
                            >
                              <XCircle className="w-4 h-4" />
                              Decline
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1"
                            >
                              <Play className="w-4 h-4" />
                              Listen
                            </Button>
                          </div>
                        )}

                        {/* Feedback (if accepted/declined) */}
                        {submission.feedback && (
                          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                            <p className="text-sm text-blue-900 dark:text-blue-100">
                              <strong>Your feedback:</strong> {submission.feedback}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyStateEnhanced
              icon={Inbox}
              title={`No ${activeTab} submissions`}
              description={
                activeTab === "inbox" 
                  ? "New submissions will appear here when artists submit tracks to your playlists"
                  : `No submissions in the ${activeTab} category yet`
              }
              actions={
                activeTab === "inbox" ? [
                  {
                    label: "Enable Submissions on Playlist",
                    href: "/home/playlists",
                    icon: Settings
                  }
                ] : undefined
              }
              variant="compact"
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Accept/Feedback Dialog */}
      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent className="max-w-md bg-white dark:bg-black">
          <DialogHeader>
            <DialogTitle>Accept Submission</DialogTitle>
            <DialogDescription>
              Add "{selectedSubmission?.track?.title}" to a playlist and optionally send feedback
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Select Playlist *</Label>
              <Select value={selectedPlaylist} onValueChange={setSelectedPlaylist}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Choose a playlist" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-black">
                  {playlists?.map(p => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.name} ({p.trackCount || 0} tracks)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Feedback to Artist (Optional)</Label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Great track! Love the production quality..."
                rows={4}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Positive feedback encourages artists and builds relationships
              </p>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowFeedbackDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => handleAccept(selectedSubmission?._id)}
                disabled={!selectedPlaylist}
                className="flex-1 gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Accept & Add
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


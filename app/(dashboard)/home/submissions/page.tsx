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
  Settings,
  Play,
  Sparkles,
  Trash2
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
  const [showSendFeedbackDialog, setShowSendFeedbackDialog] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [feedback, setFeedback] = useState("");
  const [selectedPlaylist, setSelectedPlaylist] = useState("");
  const [playlistFilter, setPlaylistFilter] = useState("all");
  const [genreFilter, setGenreFilter] = useState("all");

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
  
  // DEV ONLY: Seeder for testing
  const createSampleSubmissions = useMutation(api.devSeeders.createSampleSubmissions);
  const clearTestSubmissions = useMutation(api.devSeeders.clearTestSubmissions);

  const handleGenerateSamples = async () => {
    if (!user?.id) return;
    
    try {
      await createSampleSubmissions({
        creatorId: user.id,
        count: 3,
      });

      toast({
        title: "Test Submissions Created!",
        description: "3 sample submissions added to your inbox",
        className: "bg-white dark:bg-black",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create samples. Make sure you have a playlist accepting submissions.",
        variant: "destructive",
      });
    }
  };

  const handleClearSamples = async () => {
    if (!user?.id) return;

    try {
      await clearTestSubmissions({
        creatorId: user.id,
      });

      toast({
        title: "Test Data Cleared",
        description: "All test submissions removed",
        className: "bg-white dark:bg-black",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear test data",
        variant: "destructive",
      });
    }
  };

  const filteredSubmissions = allSubmissions?.filter(s => {
    // Status filter
    if (activeTab === "inbox" && s.status !== "inbox") return false;
    if (activeTab === "reviewed" && s.status !== "reviewed") return false;
    if (activeTab === "accepted" && s.status !== "accepted") return false;
    if (activeTab === "declined" && s.status !== "declined") return false;
    
    // Playlist filter
    if (playlistFilter !== "all" && s.playlistId !== playlistFilter) return false;
    
    // Genre filter
    if (genreFilter !== "all" && s.track?.genre !== genreFilter) return false;
    
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
      const playlistName = playlists?.find(p => p._id === selectedPlaylist)?.name || "playlist";
      
      await acceptSubmission({
        submissionId: submissionId as any,
        playlistId: selectedPlaylist as any,
        feedback: feedback || undefined,
      });

      toast({
        title: "✅ Submission Accepted!",
        description: `Track added to "${playlistName}"`,
        className: "bg-white dark:bg-black",
      });

      setShowFeedbackDialog(false);
      setFeedback("");
      setSelectedPlaylist("");
      setSelectedSubmission(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept submission",
        variant: "destructive",
      });
    }
  };

  const handleSendFeedback = async (submissionId: string) => {
    if (!feedback.trim()) {
      toast({
        title: "Feedback Required",
        description: "Please enter some feedback for the artist",
        variant: "destructive",
      });
      return;
    }

    try {
      // Mark as reviewed with feedback
      await declineSubmission({
        submissionId: submissionId as any,
        decisionNotes: "Reviewed - Feedback sent",
        feedback: feedback.trim(),
      });

      // Update to "reviewed" status instead of "declined"
      // TODO: Add separate markAsReviewed mutation

      toast({
        title: "Feedback Sent!",
        description: "Artist will receive your feedback",
        className: "bg-white dark:bg-black",
      });

      setShowSendFeedbackDialog(false);
      setFeedback("");
      setSelectedSubmission(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send feedback",
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
        title: "❌ Submission Declined",
        description: feedback ? "Artist will receive your feedback" : "Artist will be notified",
        className: "bg-white dark:bg-black",
      });

      setShowFeedbackDialog(false);
      setFeedback("");
      setSelectedSubmission(null);
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
        <div className="flex items-center gap-2">
          {/* DEV ONLY: Test Data Seeder */}
          {stats?.total === 0 && (
            <Button 
              variant="outline"
              onClick={handleGenerateSamples}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Generate Test Data
            </Button>
          )}
          {stats && stats.total > 0 && (
            <Button 
              variant="ghost"
              onClick={handleClearSamples}
              size="sm"
              className="gap-1 text-red-600"
            >
              <Trash2 className="w-3 h-3" />
              Clear Test Data
            </Button>
          )}
          <Button variant="outline" asChild>
            <a href="/home/playlists">
              <Settings className="w-4 h-4 mr-2" />
              Playlist Settings
            </a>
          </Button>
        </div>
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

      {/* Filters */}
      {allSubmissions && allSubmissions.length > 0 && (
        <div className="flex items-center gap-4">
          <Select value={playlistFilter} onValueChange={setPlaylistFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Playlists" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-black">
              <SelectItem value="all">All Playlists</SelectItem>
              {playlists?.map(p => (
                <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={genreFilter} onValueChange={setGenreFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Genres" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-black">
              <SelectItem value="all">All Genres</SelectItem>
              <SelectItem value="electronic">Electronic</SelectItem>
              <SelectItem value="hip-hop">Hip-Hop</SelectItem>
              <SelectItem value="house">House</SelectItem>
              <SelectItem value="trap">Trap</SelectItem>
              <SelectItem value="ambient">Ambient</SelectItem>
            </SelectContent>
          </Select>
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
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Music className="w-8 h-8 text-purple-600" />
                      </div>

                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{submission.track?.title || "Untitled"}</h3>
                            <p className="text-sm text-muted-foreground">
                              by {submission.submitterName}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {submission.submissionFee > 0 && (
                              <Badge variant="secondary" className="gap-1">
                                <DollarSign className="w-3 h-3" />
                                ${submission.submissionFee}
                              </Badge>
                            )}
                            {submission.playlistName && (
                              <Badge variant="outline" className="gap-1">
                                <Music className="w-3 h-3" />
                                {submission.playlistName}
                              </Badge>
                            )}
                            {submission.status === "accepted" && submission.addedToPlaylistId && (
                              <Badge className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300">
                                ✓ Added to Playlist
                              </Badge>
                            )}
                          </div>
                        </div>

                        {submission.message && (
                          <div className="bg-muted rounded-lg p-3">
                            <p className="text-sm text-muted-foreground italic">
                              "{submission.message}"
                            </p>
                          </div>
                        )}

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

                        {submission.status === "inbox" && (
                          <div className="flex gap-2 pt-2 flex-wrap">
                            <Button
                              size="sm"
                              className="gap-1"
                              onClick={() => {
                                setSelectedSubmission(submission);
                                setSelectedPlaylist(submission.playlistId || "");
                                setShowFeedbackDialog(true);
                              }}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Accept
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              onClick={() => {
                                setSelectedSubmission(submission);
                                setShowSendFeedbackDialog(true);
                              }}
                            >
                              <MessageSquare className="w-4 h-4" />
                              Send Feedback
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 text-red-600"
                              onClick={() => handleDecline(submission._id, "Not a fit")}
                            >
                              <XCircle className="w-4 h-4" />
                              Decline
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="gap-1"
                              onClick={() => window.open(submission.track?.sourceUrl, '_blank')}
                            >
                              <Play className="w-4 h-4" />
                              Listen
                            </Button>
                          </div>
                        )}

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

      {/* Send Feedback Dialog (Reviewed status) */}
      <Dialog open={showSendFeedbackDialog} onOpenChange={setShowSendFeedbackDialog}>
        <DialogContent className="max-w-md bg-white dark:bg-black">
          <DialogHeader>
            <DialogTitle>Send Feedback</DialogTitle>
            <DialogDescription>
              Provide constructive feedback on "{selectedSubmission?.track?.title}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Your Feedback *</Label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Great production! The mix is clean and the energy is perfect. A few suggestions..."
                rows={6}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This will be marked as "Reviewed" and sent to the artist
              </p>
            </div>

            {/* Quick Templates */}
            <div className="space-y-2">
              <Label className="text-xs">Quick Templates</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFeedback("Great track! The production quality is excellent.")}
                >
                  Positive
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFeedback("Good concept, but the mix needs work. Consider EQ adjustments on the low end.")}
                >
                  Constructive
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFeedback("Interesting track! Not quite right for this playlist, but keep creating.")}
                >
                  Encouraging
                </Button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowSendFeedbackDialog(false);
                  setFeedback("");
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => handleSendFeedback(selectedSubmission?._id)}
                disabled={!feedback.trim()}
                className="flex-1 gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Send Feedback
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


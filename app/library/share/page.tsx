"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Upload, Link as LinkIcon, Music, Sparkles, CheckCircle2, Eye, Zap } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FormFieldWithHelp, courseFieldHelp } from "@/components/ui/form-field-with-help";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export default function ShareTrackPage() {
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [sourceType, setSourceType] = useState<"upload" | "url">("url");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdTrackId, setCreatedTrackId] = useState<string | null>(null);
  
  const [trackData, setTrackData] = useState({
    title: "",
    artist: "",
    genre: "",
    mood: "",
    description: "",
    sourceUrl: "",
  });

  const createTrack = useMutation(api.tracks.createTrack);

  const handleSubmit = async () => {
    if (!user?.id || !trackData.title || !trackData.sourceUrl) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const trackId = await createTrack({
        userId: user.id,
        title: trackData.title,
        artist: trackData.artist || user.fullName || "Unknown Artist",
        genre: trackData.genre || undefined,
        mood: trackData.mood || undefined,
        description: trackData.description || undefined,
        sourceType,
        sourceUrl: sourceType === "url" ? trackData.sourceUrl : undefined,
        isPublic: true,
      });

      setCreatedTrackId(trackId);
      setShowSuccessModal(true);
      
      toast({
        title: "🎉 Track Published!",
        description: "Your track is now live on your showcase",
        className: "bg-white dark:bg-black",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to publish track. Please try again.",
        variant: "destructive",
      });
    }
  };

  const genres = [
    "Electronic", "Hip-Hop", "House", "Techno", "Drum & Bass",
    "Trap", "Dubstep", "Lo-Fi", "Ambient", "Experimental"
  ];

  const moods = [
    "Energetic", "Chill", "Dark", "Uplifting", "Melancholic",
    "Aggressive", "Dreamy", "Atmospheric"
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Share Your Track</h1>
        <p className="text-muted-foreground">
          Upload your music and build your public showcase
        </p>
      </div>

      {/* Main Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="w-5 h-5 text-purple-600" />
            Track Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Source Type Toggle */}
          <div>
            <Label>Track Source</Label>
            <Tabs value={sourceType} onValueChange={(v) => setSourceType(v as "upload" | "url")} className="mt-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url">
                  <LinkIcon className="w-4 h-4 mr-2" />
                  From URL
                </TabsTrigger>
                <TabsTrigger value="upload">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload File
                </TabsTrigger>
              </TabsList>

              <TabsContent value="url" className="space-y-4 mt-4">
                <FormFieldWithHelp
                  label="Track URL"
                  name="sourceUrl"
                  type="url"
                  value={trackData.sourceUrl}
                  onChange={(v) => setTrackData(prev => ({ ...prev, sourceUrl: v }))}
                  placeholder="https://youtube.com/watch?v=... or soundcloud.com/..."
                  required
                  help={{
                    description: "Paste a link from YouTube, SoundCloud, or Spotify. Your track will be embedded from the platform.",
                    examples: [
                      "https://youtube.com/watch?v=dQw4w9WgXcQ",
                      "https://soundcloud.com/artist/track-name",
                      "https://open.spotify.com/track/..."
                    ],
                    bestPractices: [
                      "Make sure the track is set to public on the platform",
                      "YouTube videos will show the video player",
                      "SoundCloud embeds work best for audio-only"
                    ]
                  }}
                />
              </TabsContent>

              <TabsContent value="upload" className="space-y-4 mt-4">
                <div className="border-2 border-dashed rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm font-medium mb-2">Drop your track here or click to browse</p>
                  <p className="text-xs text-muted-foreground mb-4">MP3, WAV, or FLAC (max 50MB)</p>
                  <Button type="button">Choose File</Button>
                  <p className="text-xs text-muted-foreground mt-4">
                    ⚠️ File upload coming soon! For now, use URL option.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Track Metadata */}
          <FormFieldWithHelp
            label="Track Title"
            name="title"
            value={trackData.title}
            onChange={(v) => setTrackData(prev => ({ ...prev, title: v }))}
            placeholder="e.g., Midnight Drive"
            required
            help={{
              description: "Give your track a catchy, memorable title that captures its essence",
              examples: [
                "Sunset Dreams",
                "808 Vibes",
                "Lost in the City",
                "Neon Nights"
              ],
              bestPractices: [
                "Keep it short and memorable",
                "Avoid generic titles like 'Beat 1' or 'Track 2'",
                "Consider the mood or story of the track"
              ]
            }}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="genre">Genre *</Label>
              <Select value={trackData.genre} onValueChange={(v) => setTrackData(prev => ({ ...prev, genre: v }))}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select genre" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-black">
                  {genres.map(g => (
                    <SelectItem key={g} value={g.toLowerCase()}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="mood">Mood</Label>
              <Select value={trackData.mood} onValueChange={(v) => setTrackData(prev => ({ ...prev, mood: v }))}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select mood" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-black">
                  {moods.map(m => (
                    <SelectItem key={m} value={m.toLowerCase()}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <FormFieldWithHelp
            label="Description"
            name="description"
            type="textarea"
            value={trackData.description}
            onChange={(v) => setTrackData(prev => ({ ...prev, description: v }))}
            placeholder="Tell people about your track..."
            rows={4}
            help={{
              description: "Describe the vibe, inspiration, or story behind your track. This helps curators and listeners connect with your music.",
              examples: [
                "Late night studio session vibes with atmospheric pads and smooth 808s",
                "Hard-hitting trap beat perfect for rap vocals, inspired by Metro Boomin",
                "Chill lo-fi beat with vinyl crackle and dreamy piano loops"
              ],
              tips: [
                "Mention the mood and energy level",
                "Share what inspired you to make it",
                "Note any unique production techniques",
                "Suggest what it's perfect for (studying, gaming, etc.)"
              ]
            }}
          />

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleSubmit} 
              className="flex-1" 
              size="lg"
              disabled={!trackData.title || !trackData.sourceUrl}
            >
              <Music className="w-4 h-4 mr-2" />
              Publish to Showcase
            </Button>
            <Button variant="outline" size="lg">
              Save Draft
            </Button>
          </div>

          {/* Help Text */}
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>💡 What happens next:</strong> Your track will be added to your public showcase and can be submitted to curator playlists for features!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-md bg-white dark:bg-black">
          <DialogHeader>
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-center text-2xl">Track Published! 🎉</DialogTitle>
            <DialogDescription className="text-center">
              Your track is now live on your showcase. What would you like to do next?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Button 
              className="w-full gap-2" 
              size="lg"
              onClick={() => router.push("/library/showcase")}
            >
              <Eye className="w-4 h-4" />
              View My Showcase
            </Button>
            
            <Button 
              className="w-full gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" 
              size="lg"
              onClick={() => {
                setShowSuccessModal(false);
                // Open AI outreach modal
              }}
            >
              <Zap className="w-4 h-4" />
              Promote This Track with AI
            </Button>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setShowSuccessModal(false)}
            >
              Add Another Track
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


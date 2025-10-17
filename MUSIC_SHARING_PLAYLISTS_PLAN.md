# 🎵 Music Sharing & Playlists - Implementation Plan

## Overview

Based on your comprehensive proposal, this adds **music sharing for free users** and **playlist curation + submissions for creators**.

---

## 🎯 Core Features

### For Free Users (Library):
1. **Share Your Track** - Upload music, build showcase
2. **My Showcase** - Public profile with tracks
3. **Promote with AI** - Generate outreach drafts
4. **Submit to Playlists** - Submit tracks to curator playlists

### For Creators (Home):
5. **Playlists** - Curate public playlists
6. **Submissions** - Accept/review submissions
7. **Submission Pricing** - Monetize curation

---

## 📋 Implementation Phases

### Phase 1: Data Model & Backend (Sprint 1)

#### Convex Schema Extensions

**File:** `convex/schema.ts`

```typescript
// Add to existing schema:

tracks: defineTable({
  userId: v.string(), // Clerk ID
  title: v.string(),
  artist: v.optional(v.string()),
  genre: v.optional(v.string()),
  mood: v.optional(v.string()),
  description: v.optional(v.string()),
  coverUrl: v.optional(v.string()),
  
  // Track source
  sourceType: v.union(
    v.literal("upload"),
    v.literal("youtube"),
    v.literal("soundcloud"),
    v.literal("spotify")
  ),
  sourceUrl: v.optional(v.string()), // For URLs
  storageId: v.optional(v.id("_storage")), // For uploads
  
  // Metadata
  duration: v.optional(v.number()),
  releaseDate: v.optional(v.number()),
  tags: v.optional(v.array(v.string())),
  
  // Stats
  plays: v.optional(v.number()),
  likes: v.optional(v.number()),
  shares: v.optional(v.number()),
  
  // Visibility
  isPublic: v.boolean(),
  featuredInPlaylists: v.optional(v.array(v.id("playlists"))),
})
  .index("by_userId", ["userId"])
  .index("by_isPublic", ["isPublic"])
  .index("by_genre", ["genre"]),

showcaseProfiles: defineTable({
  userId: v.string(), // Clerk ID
  displayName: v.string(),
  bio: v.optional(v.string()),
  avatarUrl: v.optional(v.string()),
  coverUrl: v.optional(v.string()),
  
  // Social links
  instagram: v.optional(v.string()),
  twitter: v.optional(v.string()),
  youtube: v.optional(v.string()),
  spotify: v.optional(v.string()),
  
  // Settings
  isPublic: v.boolean(),
  customSlug: v.optional(v.string()),
  
  // Stats
  totalPlays: v.optional(v.number()),
  totalFollowers: v.optional(v.number()),
})
  .index("by_userId", ["userId"])
  .index("by_customSlug", ["customSlug"]),

playlists: defineTable({
  creatorId: v.string(), // Clerk ID
  name: v.string(),
  description: v.optional(v.string()),
  coverUrl: v.optional(v.string()),
  
  // Organization
  tags: v.optional(v.array(v.string())),
  genres: v.optional(v.array(v.string())),
  
  // Visibility
  isPublic: v.boolean(),
  customSlug: v.optional(v.string()),
  
  // Submissions
  acceptsSubmissions: v.boolean(),
  submissionRules: v.optional(v.object({
    allowedGenres: v.optional(v.array(v.string())),
    maxLengthSeconds: v.optional(v.number()),
    requiresMessage: v.optional(v.boolean()),
    guidelines: v.optional(v.string()),
  })),
  submissionPricing: v.optional(v.object({
    isFree: v.boolean(),
    price: v.optional(v.number()),
    currency: v.optional(v.string()),
  })),
  submissionSLA: v.optional(v.number()), // Days to review
  
  // Stats
  trackCount: v.optional(v.number()),
  totalPlays: v.optional(v.number()),
  totalSubmissions: v.optional(v.number()),
})
  .index("by_creatorId", ["creatorId"])
  .index("by_isPublic", ["isPublic"])
  .index("by_acceptsSubmissions", ["acceptsSubmissions"]),

playlistTracks: defineTable({
  playlistId: v.id("playlists"),
  trackId: v.id("tracks"),
  addedBy: v.string(), // Clerk ID of curator
  position: v.number(), // For ordering
  featuredAt: v.optional(v.number()),
  notes: v.optional(v.string()),
})
  .index("by_playlistId", ["playlistId"])
  .index("by_trackId", ["trackId"])
  .index("by_playlistId_and_position", ["playlistId", "position"]),

submissions: defineTable({
  submitterId: v.string(), // Clerk ID
  creatorId: v.string(), // Playlist owner
  trackId: v.id("tracks"),
  playlistId: v.optional(v.id("playlists")), // Target playlist
  
  // Submission details
  message: v.optional(v.string()),
  submissionFee: v.optional(v.number()),
  paymentId: v.optional(v.string()), // Stripe payment ID
  
  // Status
  status: v.union(
    v.literal("inbox"),
    v.literal("reviewed"),
    v.literal("accepted"),
    v.literal("declined")
  ),
  
  // Decision
  decidedAt: v.optional(v.number()),
  decisionNotes: v.optional(v.string()),
  feedback: v.optional(v.string()),
  addedToPlaylistId: v.optional(v.id("playlists")),
})
  .index("by_submitterId", ["submitterId"])
  .index("by_creatorId", ["creatorId"])
  .index("by_status", ["status"])
  .index("by_creatorId_and_status", ["creatorId", "status"]),

aiOutreachDrafts: defineTable({
  userId: v.string(), // Clerk ID
  trackId: v.id("tracks"),
  
  // Target
  targetType: v.union(
    v.literal("labels"),
    v.literal("playlists"),
    v.literal("blogs"),
    v.literal("ar"),
    v.literal("generic")
  ),
  
  // Generated content
  subject: v.string(),
  emailBody: v.string(),
  dmScript: v.optional(v.string()),
  followUpSuggestions: v.optional(v.array(v.string())),
  
  // Settings
  tone: v.optional(v.string()), // professional, casual, enthusiastic
  style: v.optional(v.string()),
  
  // Metadata
  generatedAt: v.number(),
  exported: v.optional(v.boolean()),
})
  .index("by_userId", ["userId"])
  .index("by_trackId", ["trackId"]),
```

---

### Phase 2: Free User Features (Sprint 1-2)

#### A. Share Your Track

**Component:** `app/library/share/page.tsx`

```tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Link as LinkIcon, Music, Sparkles } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FormFieldWithHelp } from "@/components/ui/form-field-with-help";

export default function ShareTrackPage() {
  const { user } = useUser();
  const [sourceType, setSourceType] = useState<"upload" | "url">("upload");
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
    // Create track in Convex
    const trackId = await createTrack({
      userId: user!.id,
      title: trackData.title,
      artist: trackData.artist || user?.fullName,
      genre: trackData.genre,
      mood: trackData.mood,
      description: trackData.description,
      sourceType,
      sourceUrl: sourceType === "url" ? trackData.sourceUrl : undefined,
      isPublic: true,
    });

    // Show success modal with options
    // - View My Showcase
    // - Promote This Track (AI)
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Share Your Track</h1>
        <p className="text-muted-foreground">
          Upload your music and build your public showcase
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Track Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Source Type Toggle */}
          <Tabs value={sourceType} onValueChange={(v) => setSourceType(v as "upload" | "url")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">
                <Upload className="w-4 h-4 mr-2" />
                Upload File
              </TabsTrigger>
              <TabsTrigger value="url">
                <LinkIcon className="w-4 h-4 mr-2" />
                From URL
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              {/* File upload component */}
              <div className="border-2 border-dashed rounded-lg p-12 text-center hover:border-primary transition-colors">
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm font-medium mb-2">Drop your track here</p>
                <p className="text-xs text-muted-foreground mb-4">MP3, WAV, or FLAC (max 50MB)</p>
                <Button>Choose File</Button>
              </div>
            </TabsContent>

            <TabsContent value="url" className="space-y-4">
              <FormFieldWithHelp
                label="Track URL"
                name="sourceUrl"
                type="url"
                value={trackData.sourceUrl}
                onChange={(v) => setTrackData(prev => ({ ...prev, sourceUrl: v }))}
                placeholder="https://youtube.com/watch?v=... or spotify.com/track/..."
                help={{
                  description: "Paste a link from YouTube, SoundCloud, or Spotify",
                  examples: [
                    "https://youtube.com/watch?v=dQw4w9WgXcQ",
                    "https://soundcloud.com/artist/track",
                    "https://open.spotify.com/track/..."
                  ]
                }}
              />
            </TabsContent>
          </Tabs>

          {/* Track Metadata */}
          <FormFieldWithHelp
            label="Track Title"
            name="title"
            value={trackData.title}
            onChange={(v) => setTrackData(prev => ({ ...prev, title: v }))}
            placeholder="e.g., Midnight Drive"
            required
            help={{
              description: "Give your track a catchy, memorable title",
              examples: [
                "Sunset Dreams",
                "808 Vibes",
                "Lost in the City"
              ]
            }}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Genre</Label>
              <Select value={trackData.genre} onValueChange={(v) => setTrackData(prev => ({ ...prev, genre: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select genre" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-black">
                  <SelectItem value="electronic">Electronic</SelectItem>
                  <SelectItem value="hip-hop">Hip-Hop</SelectItem>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="techno">Techno</SelectItem>
                  <SelectItem value="dnb">Drum & Bass</SelectItem>
                  <SelectItem value="ambient">Ambient</SelectItem>
                  <SelectItem value="trap">Trap</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Mood</Label>
              <Select value={trackData.mood} onValueChange={(v) => setTrackData(prev => ({ ...prev, mood: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select mood" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-black">
                  <SelectItem value="energetic">Energetic</SelectItem>
                  <SelectItem value="chill">Chill</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="uplifting">Uplifting</SelectItem>
                  <SelectItem value="melancholic">Melancholic</SelectItem>
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
              description: "Describe the vibe, inspiration, or story behind your track",
              examples: [
                "Late night studio session vibes with atmospheric pads",
                "Hard-hitting trap beat perfect for rap vocals"
              ]
            }}
          />

          <div className="flex gap-3">
            <Button onClick={handleSubmit} className="flex-1">
              <Music className="w-4 h-4 mr-2" />
              Publish to Showcase
            </Button>
            <Button variant="outline">
              Save Draft
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

#### B. AI Outreach Modal

**Component:** `components/music/ai-outreach-modal.tsx`

```typescript
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Copy, Download, Mail, MessageSquare, ArrowRight, Crown } from "lucide-react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

interface AIOutreachModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackId: string;
  trackTitle: string;
}

export function AIOutreachModal({ isOpen, onClose, trackId, trackTitle }: AIOutreachModalProps) {
  const [targetType, setTargetType] = useState("playlists");
  const [tone, setTone] = useState("professional");
  const [generated, setGenerated] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateOutreach = useAction(api.ai.generateOutreachDraft);

  const handleGenerate = async () => {
    setIsGenerating(true);
    const result = await generateOutreach({
      trackId,
      targetType,
      tone,
    });
    setGenerated(result);
    setIsGenerating(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-white dark:bg-black max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Outreach for "{trackTitle}"
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!generated ? (
            // Generation form
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Target</Label>
                  <Select value={targetType} onValueChange={setTargetType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-black">
                      <SelectItem value="playlists">Playlist Curators</SelectItem>
                      <SelectItem value="labels">Record Labels</SelectItem>
                      <SelectItem value="ar">A&R Reps</SelectItem>
                      <SelectItem value="blogs">Music Blogs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-black">
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleGenerate} disabled={isGenerating} className="w-full" size="lg">
                {isGenerating ? (
                  <>Generating...</>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Outreach
                  </>
                )}
              </Button>
            </div>
          ) : (
            // Generated results
            <Tabs defaultValue="email">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="dm">DM Script</TabsTrigger>
              </TabsList>

              <TabsContent value="email" className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Subject Line</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input value={generated.subject} readOnly className="flex-1" />
                    <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(generated.subject)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Email Body</Label>
                  <Textarea value={generated.emailBody} readOnly rows={12} className="mt-2 font-mono text-sm" />
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => navigator.clipboard.writeText(generated.emailBody)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Email
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="dm" className="space-y-4">
                <Textarea value={generated.dmScript} readOnly rows={8} className="font-mono text-sm" />
                <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(generated.dmScript)}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy DM
                </Button>
              </TabsContent>
            </Tabs>

            {/* Follow-up Suggestions */}
            {generated.followUpSuggestions && (
              <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-sm mb-2">Follow-up Suggestions</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {generated.followUpSuggestions.map((suggestion: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-blue-600">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Upsell */}
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 border-purple-200 dark:border-purple-800">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Crown className="w-10 h-10 text-purple-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold mb-2">Upgrade to Creator</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Automate your outreach, track responses, and send bulk campaigns with AI
                    </p>
                    <Button>
                      Upgrade Now
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setGenerated(null)}>
                Generate Another
              </Button>
              <Button onClick={onClose}>
                Done
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Phase 3: Creator Features (Sprint 3-4)

#### A. Playlists Manager

**File:** `app/(dashboard)/home/playlists/page.tsx`

#### B. Submissions Queue

**File:** `app/(dashboard)/home/submissions/page.tsx`

---

## 📊 Navigation Updates

### Library Sidebar (Add Section):
```tsx
{
  label: "Share & Showcase",
  items: [
    { icon: Upload, label: "Share Your Track", href: "/library/share" },
    { icon: Music, label: "My Showcase", href: "/library/showcase" },
  ]
}
```

### Home Sidebar (Add to Create & Distribute):
```tsx
{ icon: List, label: "Playlists", href: "/home/playlists" },
{ icon: Inbox, label: "Submissions", href: "/home/submissions" },
```

---

## 🎯 Implementation Timeline

### Sprint 1 (Week 1):
- Convex schema additions
- Share Your Track page
- Basic showcase display

### Sprint 2 (Week 2):
- AI Outreach modal
- Submit to playlists flow
- Public showcase profiles

### Sprint 3 (Week 3):
- Playlists manager (creator)
- Playlist editor
- Submission rules config

### Sprint 4 (Week 4):
- Submissions queue
- Accept/decline workflow
- Feedback templates

---

## 💰 Monetization

### Free Tier Limits:
- 10 tracks max
- AI drafts only (no automated sends)
- Submit to 5 playlists/month

### Creator Tier ($29/mo):
- Unlimited tracks
- Create unlimited playlists
- Accept submissions (set pricing)
- AI campaign automation
- Analytics & tracking

---

## 🧪 Success Metrics

### Free Users:
- Track upload rate
- AI draft generation usage
- Submission conversion
- Upgrade rate

### Creators:
- Playlists created
- Submissions volume
- Revenue from submissions
- Acceptance rate

---

This is a **major new feature set**. Want me to start building the components, or would you like to refine the plan first?


"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Copy, Download, Mail, MessageSquare, ArrowRight, Crown, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AIOutreachModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackId: string;
  trackTitle: string;
}

export function AIOutreachModal({ isOpen, onClose, trackId, trackTitle }: AIOutreachModalProps) {
  const { toast } = useToast();
  const [targetType, setTargetType] = useState("playlists");
  const [tone, setTone] = useState("professional");
  const [generated, setGenerated] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    // Simulate AI generation (replace with actual API call)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setGenerated({
      subject: `New ${targetType === "playlists" ? "Playlist" : "Label"} Submission: ${trackTitle}`,
      emailBody: `Hi there,\n\nI hope this email finds you well! I'm reaching out to share my latest track "${trackTitle}" with you.\n\nI've been following your ${targetType === "playlists" ? "playlist" : "label"} for a while and I think this track would be a perfect fit. The production features [unique elements], and I believe it aligns well with your aesthetic.\n\nYou can listen here: [TRACK_LINK]\n\nI'd love to hear your thoughts and see if there's an opportunity to collaborate or be featured.\n\nBest regards,\n[YOUR_NAME]`,
      dmScript: `Hey! 👋 Just dropped "${trackTitle}" and thought you might vibe with it. Would love to get your feedback! 🎵\n\nListen: [TRACK_LINK]`,
      followUpSuggestions: [
        "Wait 3-5 days before following up if no response",
        "Share their content on your socials to build rapport",
        "Mention specific tracks/posts of theirs you enjoyed",
        "Keep it brief and respectful - they get many submissions"
      ]
    });
    
    setIsGenerating(false);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
      className: "bg-white dark:bg-black",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-white dark:bg-black max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="w-6 h-6 text-purple-600" />
            AI Outreach for "{trackTitle}"
          </DialogTitle>
          <DialogDescription>
            Generate professional pitch emails and DM scripts in seconds
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!generated ? (
            // Generation Form
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Target Audience</Label>
                  <Select value={targetType} onValueChange={setTargetType}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-black">
                      <SelectItem value="playlists">🎵 Playlist Curators</SelectItem>
                      <SelectItem value="labels">🏢 Record Labels</SelectItem>
                      <SelectItem value="ar">👔 A&R Reps</SelectItem>
                      <SelectItem value="blogs">📝 Music Blogs</SelectItem>
                      <SelectItem value="generic">💼 Generic Pitch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-black">
                      <SelectItem value="professional">💼 Professional</SelectItem>
                      <SelectItem value="casual">😎 Casual</SelectItem>
                      <SelectItem value="enthusiastic">🚀 Enthusiastic</SelectItem>
                      <SelectItem value="humble">🙏 Humble</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>💡 Tip:</strong> AI will generate a customized pitch based on your target and tone. You can edit the output before sending!
                </p>
              </div>

              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating} 
                className="w-full" 
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    Generating with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Outreach
                  </>
                )}
              </Button>
            </div>
          ) : (
            // Generated Results
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Generated successfully!</span>
              </div>

              <Tabs defaultValue="email">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="email">
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </TabsTrigger>
                  <TabsTrigger value="dm">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    DM Script
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="email" className="space-y-4 mt-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm text-muted-foreground">Subject Line</Label>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleCopy(generated.subject, "Subject")}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <Input value={generated.subject} readOnly className="font-medium" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm text-muted-foreground">Email Body</Label>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleCopy(generated.emailBody, "Email body")}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <Textarea 
                      value={generated.emailBody} 
                      readOnly 
                      rows={16} 
                      className="font-mono text-sm resize-none"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="dm" className="space-y-4 mt-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm text-muted-foreground">DM Script</Label>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleCopy(generated.dmScript, "DM script")}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <Textarea 
                      value={generated.dmScript} 
                      readOnly 
                      rows={8} 
                      className="font-mono text-sm resize-none"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              {/* Follow-up Suggestions */}
              <Card className="bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    Follow-up Tips
                  </h4>
                  <ul className="space-y-2">
                    {generated.followUpSuggestions.map((suggestion: string, i: number) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-purple-600 mt-0.5">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Upsell to Creator */}
              <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 border-purple-200 dark:border-purple-800">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Crown className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg mb-2">Upgrade to Creator Plan</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Automate your outreach, track email opens and responses, and send bulk campaigns to hundreds of contacts with one click.
                      </p>
                      <ul className="space-y-1 text-sm text-muted-foreground mb-4">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          Automated email sequences
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          Response tracking & analytics
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          Bulk send to lists
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          AI-powered follow-ups
                        </li>
                      </ul>
                      <Button className="gap-2">
                        Upgrade Now
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setGenerated(null)} className="flex-1">
                  Generate Another
                </Button>
                <Button onClick={onClose} className="flex-1">
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


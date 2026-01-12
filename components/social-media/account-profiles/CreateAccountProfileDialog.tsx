"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PLATFORMS = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "twitter", label: "Twitter/X" },
  { value: "facebook", label: "Facebook" },
  { value: "linkedin", label: "LinkedIn" },
];

const SUGGESTED_TOPICS = [
  "mixing",
  "mastering",
  "compression",
  "EQ",
  "vocals",
  "vocal production",
  "beat making",
  "sound design",
  "synthesis",
  "sampling",
  "arrangement",
  "music theory",
  "home studio",
  "recording",
  "plugins",
  "DAW tips",
  "production workflow",
  "creative techniques",
];

interface CreateAccountProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  userId: string;
  editProfile?: {
    _id: Id<"socialAccountProfiles">;
    name: string;
    description: string;
    platform: string;
    topics: string[];
    targetAudience?: string;
  } | null;
}

export function CreateAccountProfileDialog({
  open,
  onOpenChange,
  storeId,
  userId,
  editProfile,
}: CreateAccountProfileDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [platform, setPlatform] = useState<string>("");
  const [topics, setTopics] = useState<string[]>([]);
  const [targetAudience, setTargetAudience] = useState("");
  const [newTopic, setNewTopic] = useState("");

  const createProfile = useMutation(api.socialAccountProfiles.createAccountProfile);
  const updateProfile = useMutation(api.socialAccountProfiles.updateAccountProfile);

  // Reset form when dialog opens/closes or editProfile changes
  useEffect(() => {
    if (open) {
      if (editProfile) {
        setName(editProfile.name);
        setDescription(editProfile.description);
        setPlatform(editProfile.platform);
        setTopics(editProfile.topics);
        setTargetAudience(editProfile.targetAudience || "");
      } else {
        setName("");
        setDescription("");
        setPlatform("");
        setTopics([]);
        setTargetAudience("");
      }
      setNewTopic("");
    }
  }, [open, editProfile]);

  const handleAddTopic = () => {
    if (newTopic && !topics.includes(newTopic.toLowerCase())) {
      setTopics([...topics, newTopic.toLowerCase()]);
      setNewTopic("");
    }
  };

  const handleRemoveTopic = (topic: string) => {
    setTopics(topics.filter((t) => t !== topic));
  };

  const handleSuggestedTopic = (topic: string) => {
    if (!topics.includes(topic)) {
      setTopics([...topics, topic]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !description || !platform || topics.length === 0) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields and add at least one topic.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (editProfile) {
        await updateProfile({
          profileId: editProfile._id,
          name,
          description,
          platform: platform as any,
          topics,
          targetAudience: targetAudience || undefined,
        });
        toast({
          title: "Profile updated",
          description: "Your account profile has been updated.",
        });
      } else {
        await createProfile({
          storeId,
          userId,
          name,
          description,
          platform: platform as any,
          topics,
          targetAudience: targetAudience || undefined,
        });
        toast({
          title: "Profile created",
          description: "Your new account profile has been created.",
        });
      }
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableSuggestions = SUGGESTED_TOPICS.filter(
    (t) => !topics.includes(t)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editProfile ? "Edit Account Profile" : "Create Account Profile"}
          </DialogTitle>
          <DialogDescription>
            {editProfile
              ? "Update the details of your account profile."
              : "Create a profile to organize your content for different social media pages."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Profile Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Vocal Production IG"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="platform">Platform *</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger>
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="What kind of content does this account post? e.g., Tips for vocal processing, recording techniques, and vocal mixing"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Topics *</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a topic"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTopic();
                  }
                }}
              />
              <Button type="button" variant="outline" size="icon" onClick={handleAddTopic}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {topics.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {topics.map((topic) => (
                  <Badge
                    key={topic}
                    variant="secondary"
                    className="gap-1 pr-1"
                  >
                    {topic}
                    <button
                      type="button"
                      onClick={() => handleRemoveTopic(topic)}
                      className="hover:bg-muted rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {availableSuggestions.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-1">
                  Suggested topics:
                </p>
                <div className="flex flex-wrap gap-1">
                  {availableSuggestions.slice(0, 8).map((topic) => (
                    <Badge
                      key={topic}
                      variant="outline"
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => handleSuggestedTopic(topic)}
                    >
                      + {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="audience">Target Audience (optional)</Label>
            <Input
              id="audience"
              placeholder="e.g., bedroom producers, beginners, hip-hop artists"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? editProfile
                  ? "Updating..."
                  : "Creating..."
                : editProfile
                  ? "Update Profile"
                  : "Create Profile"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

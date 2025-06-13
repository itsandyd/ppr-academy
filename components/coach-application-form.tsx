"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { submitCoachApplication } from "@/app/actions/coach-actions";
import { Loader2 } from "lucide-react";
import type { User } from "@/lib/types";

interface CoachApplicationFormProps {
  user: User;
}

export default function CoachApplicationForm({ user }: CoachApplicationFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    experience: "",
    portfolio: "",
    specialties: "",
    teachingPhilosophy: "",
    availability: "",
    timezone: "",
    preferredRate: "",
    socialLinks: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.experience || !formData.portfolio || !formData.specialties || !formData.teachingPhilosophy) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    const result = await submitCoachApplication({
      userId: user.id,
      ...formData,
    });

    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Application Submitted",
        description: "Your coach application has been submitted successfully. We'll review it and get back to you soon!",
      });
      router.push("/dashboard");
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to submit application",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="experience" className="text-base font-semibold">
            Music Production Experience *
          </Label>
          <Textarea
            id="experience"
            placeholder="Tell us about your experience in music production. Include years of experience, genres you specialize in, and any notable achievements..."
            value={formData.experience}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, experience: e.target.value })}
            className="mt-2 min-h-[120px]"
            required
          />
        </div>

        <div>
          <Label htmlFor="portfolio" className="text-base font-semibold">
            Portfolio / Work Samples *
          </Label>
          <Textarea
            id="portfolio"
            placeholder="Share links to your music, productions, or any relevant work. Include Spotify, SoundCloud, YouTube, or your website..."
            value={formData.portfolio}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, portfolio: e.target.value })}
            className="mt-2 min-h-[100px]"
            required
          />
        </div>

        <div>
          <Label htmlFor="specialties" className="text-base font-semibold">
            Teaching Specialties *
          </Label>
          <Textarea
            id="specialties"
            placeholder="What specific areas of music production would you like to teach? (e.g., mixing, mastering, sound design, specific DAWs, genres...)"
            value={formData.specialties}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, specialties: e.target.value })}
            className="mt-2 min-h-[100px]"
            required
          />
        </div>

        <div>
          <Label htmlFor="teachingPhilosophy" className="text-base font-semibold">
            Teaching Philosophy *
          </Label>
          <Textarea
            id="teachingPhilosophy"
            placeholder="Describe your approach to teaching. How do you help students learn effectively? What makes you a good coach?"
            value={formData.teachingPhilosophy}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, teachingPhilosophy: e.target.value })}
            className="mt-2 min-h-[120px]"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="availability" className="text-base font-semibold">
              Weekly Availability
            </Label>
            <Input
              id="availability"
              placeholder="e.g., 10-15 hours per week"
              value={formData.availability}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, availability: e.target.value })}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="timezone" className="text-base font-semibold">
              Timezone
            </Label>
            <Select 
              value={formData.timezone} 
              onValueChange={(value) => setFormData({ ...formData, timezone: value })}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select your timezone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PST">Pacific Time (PST/PDT)</SelectItem>
                <SelectItem value="MST">Mountain Time (MST/MDT)</SelectItem>
                <SelectItem value="CST">Central Time (CST/CDT)</SelectItem>
                <SelectItem value="EST">Eastern Time (EST/EDT)</SelectItem>
                <SelectItem value="GMT">GMT/UTC</SelectItem>
                <SelectItem value="CET">Central European Time</SelectItem>
                <SelectItem value="AEST">Australian Eastern Time</SelectItem>
                <SelectItem value="JST">Japan Standard Time</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="preferredRate" className="text-base font-semibold">
            Preferred Hourly Rate (USD)
          </Label>
          <Input
            id="preferredRate"
            type="number"
            placeholder="e.g., 75"
            value={formData.preferredRate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, preferredRate: e.target.value })}
            className="mt-2"
            min="20"
            max="500"
          />
          <p className="text-sm text-slate-500 mt-1">
            Typical rates range from $50-150/hour depending on experience
          </p>
        </div>

        <div>
          <Label htmlFor="socialLinks" className="text-base font-semibold">
            Social Media / Website
          </Label>
          <Textarea
            id="socialLinks"
            placeholder="Share your Instagram, Twitter, website, or other professional links (one per line)"
            value={formData.socialLinks}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, socialLinks: e.target.value })}
            className="mt-2"
          />
        </div>
      </div>

      <Card className="p-4 bg-blue-50 border-blue-200">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Applications are typically reviewed within 3-5 business days. 
          We'll email you at <span className="font-semibold">{user.email}</span> with our decision 
          and next steps.
        </p>
      </Card>

      <div className="flex gap-4 pt-4">
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Application"
          )}
        </Button>
      </div>
    </form>
  );
} 
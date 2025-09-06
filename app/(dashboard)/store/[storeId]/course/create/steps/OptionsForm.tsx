"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Check, Settings, Share, Award, MessageSquare, Save } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useCourseCreation } from "../context";

export function OptionsForm() {
  const router = useRouter();
  const params = useParams();
  const storeId = params.storeId as string;
  
  const { state, updateData, saveCourse, createCourse } = useCourseCreation();

  const [formData, setFormData] = useState({
    // Sharing & SEO
    enableSharing: true,
    seoTitle: "",
    seoDescription: "",
    
    // Student Features
    enableComments: true,
    enableProgress: true,
    enableCertificates: false,
    certificateTemplate: "modern",
    
    // Access Control
    drippingEnabled: false,
    drippingDays: "7",
    accessDuration: "lifetime",
    
    // Email Automation
    welcomeEmail: true,
    completionEmail: true,
    reminderEmails: false,
    
    // Advanced
    enableDownloads: false,
    enableMobileApp: true,
    enableDiscussions: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load data from context when available
  useEffect(() => {
    if (state.data) {
      setFormData({
        enableSharing: state.data.enableSharing ?? true,
        seoTitle: state.data.seoTitle || "",
        seoDescription: state.data.seoDescription || "",
        enableComments: state.data.enableComments ?? true,
        enableProgress: state.data.enableProgress ?? true,
        enableCertificates: state.data.enableCertificates ?? false,
        certificateTemplate: state.data.certificateTemplate || "modern",
        drippingEnabled: state.data.drippingEnabled ?? false,
        drippingDays: state.data.drippingDays || "7",
        accessDuration: state.data.accessDuration || "lifetime",
        welcomeEmail: state.data.welcomeEmail ?? true,
        completionEmail: state.data.completionEmail ?? true,
        reminderEmails: state.data.reminderEmails ?? false,
        enableDownloads: state.data.enableDownloads ?? false,
        enableMobileApp: state.data.enableMobileApp ?? true,
        enableDiscussions: state.data.enableDiscussions ?? true,
      });
    }
  }, [state.data]);

  const handleInputChange = (field: string, value: string | boolean) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    
    // Update context with new data
    updateData("options", newData);
  };

  const handleBack = () => {
    router.push(`/store/${storeId}/course/create?step=course`);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const result = await createCourse();
      if (result.success) {
        router.push(`/store/${storeId}/products`);
      } else {
        console.error("Failed to create course:", result.error);
      }
    } catch (error) {
      console.error("Error creating course:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Sharing & SEO */}
      <Card className="border-0 sm:border shadow-none sm:shadow-sm">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Share className="w-5 h-5" />
            Sharing & SEO
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <Label className="text-foreground text-sm font-medium">Enable Social Sharing</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Allow students to share course progress
              </p>
            </div>
            <Switch
              checked={formData.enableSharing}
              onCheckedChange={(checked) => handleInputChange("enableSharing", checked)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="seo-title" className="text-foreground text-sm font-medium">SEO Title</Label>
            <Input
              id="seo-title"
              value={formData.seoTitle}
              onChange={(e) => handleInputChange("seoTitle", e.target.value)}
              placeholder="Course title for search engines"
              className="mt-2 h-12 text-base"
            />
          </div>

          <div>
            <Label htmlFor="seo-description" className="text-foreground text-sm font-medium">SEO Description</Label>
            <Textarea
              id="seo-description"
              value={formData.seoDescription}
              onChange={(e) => handleInputChange("seoDescription", e.target.value)}
              placeholder="Course description for search engines"
              rows={3}
              className="mt-2 text-base min-h-[80px] resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Student Features */}
      <Card className="border-0 sm:border shadow-none sm:shadow-sm">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Award className="w-5 h-5" />
            Student Features
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <Label className="text-foreground text-sm font-medium">Enable Comments</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Students can comment on lessons
              </p>
            </div>
            <Switch
              checked={formData.enableComments}
              onCheckedChange={(checked) => handleInputChange("enableComments", checked)}
              className="mt-1"
            />
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <Label className="text-foreground text-sm font-medium">Progress Tracking</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Show course completion progress
              </p>
            </div>
            <Switch
              checked={formData.enableProgress}
              onCheckedChange={(checked) => handleInputChange("enableProgress", checked)}
              className="mt-1"
            />
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <Label className="text-foreground text-sm font-medium">Completion Certificates</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Award certificates when course is completed
              </p>
            </div>
            <Switch
              checked={formData.enableCertificates}
              onCheckedChange={(checked) => handleInputChange("enableCertificates", checked)}
              className="mt-1"
            />
          </div>

          {formData.enableCertificates && (
            <div>
              <Label className="text-foreground text-sm font-medium">Certificate Template</Label>
              <Select 
                value={formData.certificateTemplate} 
                onValueChange={(value) => handleInputChange("certificateTemplate", value)}
              >
                <SelectTrigger className="mt-2 h-12 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="modern" className="text-base py-3">Modern</SelectItem>
                  <SelectItem value="classic" className="text-base py-3">Classic</SelectItem>
                  <SelectItem value="minimal" className="text-base py-3">Minimal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Access Control */}
      <Card className="border-0 sm:border shadow-none sm:shadow-sm">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Settings className="w-5 h-5" />
            Access Control
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <Label className="text-foreground text-sm font-medium">Content Dripping</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Release lessons gradually over time
              </p>
            </div>
            <Switch
              checked={formData.drippingEnabled}
              onCheckedChange={(checked) => handleInputChange("drippingEnabled", checked)}
              className="mt-1"
            />
          </div>

          {formData.drippingEnabled && (
            <div>
              <Label htmlFor="dripping-days" className="text-foreground text-sm font-medium">Days Between Lessons</Label>
              <Input
                id="dripping-days"
                type="number"
                min="1"
                value={formData.drippingDays}
                onChange={(e) => handleInputChange("drippingDays", e.target.value)}
                className="mt-2 h-12 text-base"
              />
            </div>
          )}

          <div>
            <Label className="text-foreground text-sm font-medium">Access Duration</Label>
            <Select 
              value={formData.accessDuration} 
              onValueChange={(value) => handleInputChange("accessDuration", value)}
            >
              <SelectTrigger className="mt-2 h-12 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lifetime" className="text-base py-3">Lifetime Access</SelectItem>
                <SelectItem value="1year" className="text-base py-3">1 Year</SelectItem>
                <SelectItem value="6months" className="text-base py-3">6 Months</SelectItem>
                <SelectItem value="3months" className="text-base py-3">3 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Email Automation */}
      <Card className="border-0 sm:border shadow-none sm:shadow-sm">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <MessageSquare className="w-5 h-5" />
            Email Automation
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <Label className="text-foreground text-sm font-medium">Welcome Email</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Send welcome email when student enrolls
              </p>
            </div>
            <Switch
              checked={formData.welcomeEmail}
              onCheckedChange={(checked) => handleInputChange("welcomeEmail", checked)}
              className="mt-1"
            />
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <Label className="text-foreground text-sm font-medium">Completion Email</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Send congratulations when course is completed
              </p>
            </div>
            <Switch
              checked={formData.completionEmail}
              onCheckedChange={(checked) => handleInputChange("completionEmail", checked)}
              className="mt-1"
            />
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <Label className="text-foreground text-sm font-medium">Reminder Emails</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Send reminders to inactive students
              </p>
            </div>
            <Switch
              checked={formData.reminderEmails}
              onCheckedChange={(checked) => handleInputChange("reminderEmails", checked)}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="pt-6 border-t border-border space-y-4">
        {/* Mobile: Stack buttons vertically */}
        <div className="flex flex-col sm:hidden gap-3">
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="gap-2 h-12 order-1"
          >
            {isSubmitting ? (
              "Creating Course..."
            ) : (
              <>
                <Check className="w-4 h-4" />
                Create Course
              </>
            )}
          </Button>
          
          <div className="flex gap-3 order-2">
            <Button variant="outline" onClick={handleBack} className="gap-2 h-12 flex-1">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            
            <Button 
              variant="outline" 
              onClick={saveCourse}
              disabled={state.isSaving}
              className="gap-2 h-12 flex-1"
            >
              <Save className="w-4 h-4" />
              {state.isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
        
        {/* Desktop: Horizontal layout */}
        <div className="hidden sm:flex justify-between">
          <Button variant="outline" onClick={handleBack} className="gap-2 h-10">
            <ArrowLeft className="w-4 h-4" />
            Back to Course Content
          </Button>
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={saveCourse}
              disabled={state.isSaving}
              className="gap-2 h-10"
            >
              <Save className="w-4 h-4" />
              {state.isSaving ? "Saving..." : "Save Course"}
            </Button>
            
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="gap-2 h-10"
            >
              {isSubmitting ? (
                "Creating Course..."
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Create Course
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 
"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { User, Bell, Shield, CreditCard, Palette, Save, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user } = useUser();
  const profile = useQuery(api.users.getMyProfile);
  const updateProfile = useMutation(api.users.updateMyProfile);

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    instagram: "",
    tiktok: "",
    twitter: "",
    youtube: "",
    website: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        bio: profile.bio || "",
        instagram: profile.instagram || "",
        tiktok: profile.tiktok || "",
        twitter: profile.twitter || "",
        youtube: profile.youtube || "",
        website: profile.website || "",
      });
    }
  }, [profile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        name: formData.name || undefined,
        bio: formData.bio || undefined,
        instagram: formData.instagram || undefined,
        tiktok: formData.tiktok || undefined,
        twitter: formData.twitter || undefined,
        youtube: formData.youtube || undefined,
        website: formData.website || undefined,
      });
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white md:text-3xl">Settings</h1>
        <p className="mt-1 text-zinc-500 dark:text-zinc-400">Manage your account preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:w-auto md:grid-cols-4">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Billing</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                  {user?.imageUrl ? (
                    <img
                      src={user.imageUrl}
                      alt="Profile"
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-8 w-8 text-zinc-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{user?.fullName || formData.name || "User"}</p>
                  <p className="text-sm text-zinc-500">{user?.primaryEmailAddress?.emailAddress}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Your display name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleInputChange("website", e.target.value)}
                    placeholder="https://yoursite.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Social Links
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      value={formData.instagram}
                      onChange={(e) => handleInputChange("instagram", e.target.value)}
                      placeholder="@username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twitter">Twitter / X</Label>
                    <Input
                      id="twitter"
                      value={formData.twitter}
                      onChange={(e) => handleInputChange("twitter", e.target.value)}
                      placeholder="@username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tiktok">TikTok</Label>
                    <Input
                      id="tiktok"
                      value={formData.tiktok}
                      onChange={(e) => handleInputChange("tiktok", e.target.value)}
                      placeholder="@username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="youtube">YouTube</Label>
                    <Input
                      id="youtube"
                      value={formData.youtube}
                      onChange={(e) => handleInputChange("youtube", e.target.value)}
                      placeholder="Channel URL or @handle"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveProfile} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose what notifications you receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-zinc-500">Receive updates about your courses</p>
                </div>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Marketing Emails</Label>
                  <p className="text-sm text-zinc-500">Receive tips and product updates</p>
                </div>
                <Switch checked={marketingEmails} onCheckedChange={setMarketingEmails} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Billing & Subscription</CardTitle>
              <CardDescription>Manage your subscription and payment methods</CardDescription>
            </CardHeader>
            <CardContent className="flex min-h-[200px] items-center justify-center">
              <div className="text-center">
                <CreditCard className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-700" />
                <p className="mt-4 text-zinc-500 dark:text-zinc-400">
                  Billing management coming soon
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how the app looks</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-500">
                Use the theme toggle in the sidebar to switch between light and dark mode.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

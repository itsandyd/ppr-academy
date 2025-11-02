"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Instagram, Music, Loader2, Twitter, Youtube, Globe, Video, Eye, EyeOff, Shield } from "lucide-react";
import { AvatarUpload } from "./AvatarUpload";
import { SocialField } from "./SocialField";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

const headerSchema = z.object({
  name: z.string().max(50, "Name must be 50 characters or less"),
  bio: z.string().max(80, "Bio must be 80 characters or less"),
  socials: z.object({
    instagram: z.string().optional(),
    tiktok: z.string().optional(),
    twitter: z.string().optional(),
    youtube: z.string().optional(),
    website: z.string().optional(),
  }),
});

type HeaderSchema = z.infer<typeof headerSchema>;

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  counter?: string;
  counterClass?: string;
}

function FormField({ label, children, counter, counterClass }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold uppercase tracking-wide">
          {label}
        </Label>
        {counter && (
          <span className={`text-xs ${counterClass || "text-muted-foreground"}`}>
            {counter}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

export function HeaderForm() {
  const { user: clerkUser } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Get user data from Convex
  const convexUser = useQuery(
    api.users.getUserFromClerk,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );
  
  // Get store data for visibility toggle
  const stores = useQuery(
    api.stores.getStoresByUser,
    clerkUser?.id ? { userId: clerkUser.id } : "skip"
  );
  const userStore = stores?.[0];
  const storeData = useQuery(
    api.stores.getStoreById,
    userStore?._id ? { storeId: userStore._id } : "skip"
  );
  
  // Check if user is admin
  const adminStatus = useQuery(
    api.users.checkIsAdmin,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );
  const isAdmin = adminStatus?.isAdmin === true;
  
  const updateUser = useMutation(api.users.updateUserByClerkId);
  const updateVisibility = useMutation(api.creatorPlans.updateStoreVisibility);
  
  const isPublicFromDb = storeData?.isPublic ?? false;
  const storePlan = storeData?.plan || "free";
  
  const form = useForm<HeaderSchema>({
    resolver: zodResolver(headerSchema),
    defaultValues: {
      name: "",
      bio: "",
      socials: {
        instagram: "",
        tiktok: "",
        twitter: "",
        youtube: "",
        website: "",
      },
    },
  });

  const { register, watch, formState, handleSubmit, reset } = form;
  const bio = watch("bio") || "";

  // Load user data when available
  useEffect(() => {
    if (clerkUser && convexUser) {
      // Prioritize saved name, fallback to Clerk's firstName + lastName
      const displayName = convexUser.name || 
        (clerkUser.firstName && clerkUser.lastName 
          ? `${clerkUser.firstName} ${clerkUser.lastName}`
          : clerkUser.firstName || clerkUser.lastName || "");
        
      reset({
        name: displayName,
        bio: convexUser.bio || "",
        socials: {
          instagram: convexUser.instagram || "",
          tiktok: convexUser.tiktok || "",
          twitter: convexUser.twitter || "",
          youtube: convexUser.youtube || "",
          website: convexUser.website || "",
        },
      });
    }
  }, [clerkUser, convexUser, reset]);

  const onSubmit = async (data: HeaderSchema) => {
    if (!clerkUser?.id) {
      toast({
        title: "Error",
        description: "Please sign in to update your profile",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await updateUser({
        clerkId: clerkUser.id,
        name: data.name,
        bio: data.bio,
        instagram: data.socials.instagram,
        tiktok: data.socials.tiktok,
        twitter: data.socials.twitter,
        youtube: data.socials.youtube,
        website: data.socials.website,
      });
      
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVisibilityToggle = async (checked: boolean) => {
    if (!userStore?._id) {
      toast({
        title: "Error",
        description: "Store not found. Please try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await updateVisibility({
        storeId: userStore._id,
        isPublic: checked,
        isPublishedProfile: checked,
        clerkId: clerkUser?.id,
      });
      
      if (!result.success) {
        throw new Error(result.message);
      }
      
      toast({
        title: "Success",
        description: result.message,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update visibility",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Visibility Card */}
      <Card className="max-w-[720px] rounded-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            {isPublicFromDb ? <Eye className="h-5 w-5 text-green-500" /> : <EyeOff className="h-5 w-5 text-muted-foreground" />}
            Profile Visibility
            {isAdmin && <Badge variant="secondary" className="ml-2"><Shield className="w-3 h-3 mr-1" />Admin</Badge>}
          </CardTitle>
          <CardDescription>
            Control whether your creator profile appears in the public marketplace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="profile-visibility" className="text-base font-medium">
                Make Profile Public
              </Label>
              <p className="text-sm text-muted-foreground">
                {isPublicFromDb
                  ? "Your profile is visible to everyone on the marketplace"
                  : "Your profile is private and only accessible via direct link"}
              </p>
            </div>
            <Switch
              id="profile-visibility"
              checked={isPublicFromDb}
              onCheckedChange={handleVisibilityToggle}
              disabled={!isAdmin && storePlan === "free"}
            />
          </div>
          
          {!isAdmin && storePlan === "free" && (
            <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                🔒 Public profile visibility requires Creator or Creator Pro plan
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
                Upgrade your plan to showcase your profile in the marketplace
              </p>
            </div>
          )}

          {isAdmin && (
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                <Shield className="w-4 h-4 inline mr-1" />
                <strong>Admin Access:</strong> You can toggle visibility regardless of plan
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile Edit Form */}
      <Card className="max-w-[720px] rounded-3xl p-12">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <AvatarUpload />

        <FormField label="Display Name">
          <Input {...register("name")} placeholder="Your display name" />
        </FormField>

        <FormField
          label="Bio"
          counter={`${bio.length}/80`}
          counterClass={bio.length > 80 ? "text-red-500" : "text-[#6B6E85]"}
        >
          <Textarea 
            rows={3} 
            {...register("bio")} 
            placeholder="Write a short bio about yourself..."
          />
        </FormField>

        <fieldset className="space-y-4">
          <legend className="text-base font-semibold">Social Links (URL)</legend>
          <SocialField 
            icon={Instagram} 
            placeholder="Your Username" 
            iconBg="bg-gradient-to-br from-purple-500 to-pink-500"
            {...register("socials.instagram")} 
          />
          <SocialField 
            icon={Video} 
            placeholder="Your Username" 
            iconBg="bg-black"
            {...register("socials.tiktok")} 
          />

          <Accordion type="single" collapsible>
            <AccordionItem value="more">
              <AccordionTrigger className="text-[#6356FF] text-sm font-bold hover:underline">
                More socials
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <SocialField 
                  icon={Twitter} 
                  placeholder="Your Username" 
                  iconBg="bg-blue-500"
                  label="Twitter"
                  {...register("socials.twitter")} 
                />
                <SocialField 
                  icon={Youtube} 
                  placeholder="Your Username" 
                  iconBg="bg-red-500"
                  label="YouTube"
                  {...register("socials.youtube")} 
                />
                <SocialField 
                  icon={Globe} 
                  placeholder="Your Website URL" 
                  iconBg="bg-gray-600"
                  label="Website"
                  {...register("socials.website")} 
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </fieldset>
        <Button type="submit" className="w-full mt-6" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </form>
    </Card>
    </div>
  );
} 
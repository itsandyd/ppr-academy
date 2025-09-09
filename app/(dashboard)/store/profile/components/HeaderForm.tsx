"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Instagram, Music, Loader2, Twitter, Youtube, Globe, Video } from "lucide-react";
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
  
  const updateUser = useMutation(api.users.updateUserByClerkId);
  
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

  return (
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
  );
} 
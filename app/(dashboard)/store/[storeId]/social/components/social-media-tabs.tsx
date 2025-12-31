"use client";

import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SocialScheduler } from "@/components/social-media/social-scheduler";
import { InstagramAutomations } from "./instagram-automations-fixed";
import { Calendar, Zap, Wand2 } from "lucide-react";

interface SocialMediaTabsProps {
  storeId: string;
  userId: string;
}

export function SocialMediaTabs({ storeId, userId }: SocialMediaTabsProps) {
  const router = useRouter();

  const handleTabChange = (value: string) => {
    if (value === "generator") {
      router.push("/dashboard/social/create");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 text-3xl font-bold">Social Media</h1>
        <p className="text-muted-foreground">
          Schedule posts and automate Instagram DMs to grow your audience
        </p>
      </div>

      <Tabs defaultValue="scheduler" className="space-y-6" onValueChange={handleTabChange}>
        <TabsList className="grid w-full max-w-xl grid-cols-3">
          <TabsTrigger value="scheduler" className="gap-2">
            <Calendar className="h-4 w-4" />
            Post Scheduler
          </TabsTrigger>
          <TabsTrigger value="automations" className="gap-2">
            <Zap className="h-4 w-4" />
            DM Automation
          </TabsTrigger>
          <TabsTrigger value="generator" className="gap-2">
            <Wand2 className="h-4 w-4" />
            Content Generator
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scheduler">
          <SocialScheduler storeId={storeId} userId={userId} />
        </TabsContent>

        <TabsContent value="automations">
          <InstagramAutomations storeId={storeId} userId={userId} />
        </TabsContent>

        <TabsContent value="generator">
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            Redirecting to Content Generator...
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

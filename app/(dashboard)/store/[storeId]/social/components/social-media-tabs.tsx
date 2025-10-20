"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SocialScheduler } from "@/components/social-media/social-scheduler";
import { InstagramAutomations } from "./instagram-automations";
import { Calendar, Zap } from "lucide-react";

interface SocialMediaTabsProps {
  storeId: string;
  userId: string;
}

export function SocialMediaTabs({ storeId, userId }: SocialMediaTabsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Social Media</h1>
        <p className="text-muted-foreground">
          Schedule posts and automate Instagram DMs to grow your audience
        </p>
      </div>

      <Tabs defaultValue="scheduler" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="scheduler" className="gap-2">
            <Calendar className="w-4 h-4" />
            Post Scheduler
          </TabsTrigger>
          <TabsTrigger value="automations" className="gap-2">
            <Zap className="w-4 h-4" />
            DM Automation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scheduler">
          <SocialScheduler storeId={storeId} userId={userId} />
        </TabsContent>

        <TabsContent value="automations">
          <InstagramAutomations storeId={storeId} userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}


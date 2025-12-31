"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SocialScheduler } from "@/components/social-media/social-scheduler";
import { InstagramAutomations } from "./instagram-automations-fixed";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Calendar, Zap, Plus } from "lucide-react";

interface SocialMediaTabsProps {
  storeId: string;
  userId: string;
}

export function SocialMediaTabs({ storeId, userId }: SocialMediaTabsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold">Social Media</h1>
          <p className="text-muted-foreground">
            Schedule posts and automate Instagram DMs to grow your audience
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/social/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Post
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="scheduler" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="scheduler" className="gap-2">
            <Calendar className="h-4 w-4" />
            Post Scheduler
          </TabsTrigger>
          <TabsTrigger value="automations" className="gap-2">
            <Zap className="h-4 w-4" />
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

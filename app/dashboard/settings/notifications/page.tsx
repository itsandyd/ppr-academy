"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useEffectiveUserId } from "@/lib/impersonation-context";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Bell, ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export default function NotificationSettingsPage() {
  const { user } = useUser();
  const effectiveUserId = useEffectiveUserId(user?.id);
  const store = useQuery(
    api.stores.getUserStore,
    effectiveUserId ? { userId: effectiveUserId } : "skip"
  );
  const isCreator = !!store;

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/settings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            Notifications
          </h1>
          <p className="mt-1 text-muted-foreground">
            Choose what notifications you receive
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>
            Control which emails you receive from the platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive updates about your courses
              </p>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Marketing Emails</Label>
              <p className="text-sm text-muted-foreground">
                Receive tips and product updates
              </p>
            </div>
            <Switch
              checked={marketingEmails}
              onCheckedChange={setMarketingEmails}
            />
          </div>
        </CardContent>
      </Card>

      {isCreator && (
        <Card className="border-purple-200 bg-purple-50 dark:border-purple-900 dark:bg-purple-950/30">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/30">
                <Bell className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold">Slack & Discord Integrations</h4>
                <p className="text-sm text-muted-foreground">
                  Connect your team chat for workflow notifications
                </p>
              </div>
            </div>
            <Button asChild variant="outline">
              <Link href="/dashboard/settings/integrations">Configure</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

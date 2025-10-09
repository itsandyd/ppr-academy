"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, DollarSign, Users, ArrowRight } from "lucide-react";

export default function AffiliateApplicationPage() {
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const storeId = searchParams.get("storeId");
  const [applicationNote, setApplicationNote] = useState("");
  const [customCode, setCustomCode] = useState("");

  const applyForAffiliate = useMutation(api.affiliates.applyForAffiliate);
  const store = useQuery(
    api.stores.getStoreById,
    storeId ? { storeId: storeId as any } : "skip"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !storeId || !store) {
      toast({
        title: "Error",
        description: "Missing required information",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await applyForAffiliate({
        affiliateUserId: user.id,
        storeId: storeId as any,
        creatorId: store.userId,
        affiliateCode: customCode || undefined,
        applicationNote: applicationNote || undefined,
      });

      toast({
        title: "Application submitted!",
        description: `Your affiliate code will be ${result.affiliateCode}. The creator will review your application.`,
        className: "bg-white dark:bg-black",
      });

      router.push("/home");
    } catch (error: any) {
      toast({
        title: "Application failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
        <p className="text-muted-foreground">You need to be signed in to apply for the affiliate program</p>
      </div>
    );
  }

  if (!storeId) {
    return (
      <div className="container mx-auto py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Store not found</h1>
        <p className="text-muted-foreground">Please select a store to apply as an affiliate</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-16 max-w-4xl">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4">🤝 Join the Affiliate Program</h1>
        <p className="text-xl text-muted-foreground">
          Earn commissions by promoting {store?.name || "this store"}'s courses and products
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card>
          <CardHeader>
            <TrendingUp className="w-8 h-8 text-green-500 mb-2" />
            <CardTitle>Earn Commissions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Get paid for every sale you refer. Typical commission rates are 20-30%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <DollarSign className="w-8 h-8 text-blue-500 mb-2" />
            <CardTitle>Track Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              See clicks, conversions, and earnings in real-time with your affiliate dashboard
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Users className="w-8 h-8 text-purple-500 mb-2" />
            <CardTitle>Share Your Link</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Get a unique tracking link to share on social media, blogs, or YouTube
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Application Form</CardTitle>
          <CardDescription>
            Tell us about yourself and how you plan to promote
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="customCode">Preferred Affiliate Code (Optional)</Label>
              <Input
                id="customCode"
                placeholder="YOURNAME"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                maxLength={15}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave blank to auto-generate. Must be unique.
              </p>
            </div>

            <div>
              <Label htmlFor="applicationNote">
                Why do you want to be an affiliate? *
              </Label>
              <Textarea
                id="applicationNote"
                placeholder="Tell us about your audience, platform, or promotional strategy..."
                value={applicationNote}
                onChange={(e) => setApplicationNote(e.target.value)}
                rows={6}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Include details about your reach, audience, and how you plan to promote
              </p>
            </div>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h3 className="font-semibold">Program Terms</h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Commission rate set by creator (typically 20-30%)</li>
                <li>30-day cookie tracking window</li>
                <li>Payouts processed monthly via Stripe or PayPal</li>
                <li>Must comply with promotional guidelines</li>
                <li>Creator reserves right to revoke affiliate status</li>
              </ul>
            </div>

            <Button type="submit" size="lg" className="w-full">
              Submit Application
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>Questions about the affiliate program? Contact the creator directly.</p>
      </div>
    </div>
  );
}






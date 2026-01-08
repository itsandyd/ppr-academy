"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Gift,
  Copy,
  Share2,
  Users,
  CheckCircle2,
  Sparkles,
  Twitter,
  Facebook,
  Mail,
  MessageCircle
} from "lucide-react";
import { toast } from "sonner";

interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalRewardsEarned: number;
}

interface Referral {
  _id: string;
  referrerUserId: string;
  referredUserId: string;
  referralCode: string;
  status: string;
  rewardType: string;
  rewardAmount: number;
  rewardReferrer: number;
  rewardReferred: number;
  hasReferredMadePurchase: boolean;
  expiresAt?: number;
  createdAt: number;
}

export function ReferralCard() {
  const { user } = useUser();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    completedReferrals: 0,
    pendingReferrals: 0,
    totalRewardsEarned: 0,
  });

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const referrals = useQuery(
    (api as any).monetizationUtils.getUserReferrals,
    user?.id ? { userId: user.id } : "skip"
  ) as Referral[] | undefined;

  const createReferralCode = useMutation(
    (api as any).monetizationUtils.createReferralCode
  );
  /* eslint-enable @typescript-eslint/no-explicit-any */

  // Calculate stats from referrals
  useEffect(() => {
    if (referrals && referrals.length > 0) {
      // Find the user's referral code (first pending one they created)
      const userReferral = referrals.find((r: Referral) => r.status === "pending" && !r.referredUserId);
      if (userReferral) {
        setReferralCode(userReferral.referralCode);
      }

      // Calculate stats
      const completed = referrals.filter((r: Referral) => r.status === "completed" || r.status === "rewarded");
      const pending = referrals.filter((r: Referral) => r.status === "pending" && r.referredUserId);

      setStats({
        totalReferrals: referrals.filter((r: Referral) => r.referredUserId).length,
        completedReferrals: completed.length,
        pendingReferrals: pending.length,
        totalRewardsEarned: completed.reduce((sum: number, r: Referral) => sum + (r.rewardReferrer || 0), 0),
      });
    }
  }, [referrals]);

  const handleGenerateCode = async () => {
    if (!user?.id) return;

    try {
      const result = await createReferralCode({ userId: user.id });
      if (result.success) {
        setReferralCode(result.code);
        toast.success("Referral code generated!");
      }
    } catch (error) {
      toast.error("Failed to generate referral code");
    }
  };

  const referralLink = referralCode
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/sign-up?ref=${referralCode}`
    : null;

  const handleCopyLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      toast.success("Referral link copied to clipboard!");
    }
  };

  const handleCopyCode = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode);
      toast.success("Referral code copied!");
    }
  };

  const shareText = `Join me on PPR Academy and learn music production from the best creators! Use my referral link to get started:`;

  const handleShareTwitter = () => {
    if (referralLink) {
      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(referralLink)}`;
      window.open(url, '_blank', 'width=550,height=420');
    }
  };

  const handleShareFacebook = () => {
    if (referralLink) {
      const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}&quote=${encodeURIComponent(shareText)}`;
      window.open(url, '_blank', 'width=550,height=420');
    }
  };

  const handleShareEmail = () => {
    if (referralLink) {
      const subject = "Join me on PPR Academy!";
      const body = `${shareText}\n\n${referralLink}`;
      window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
  };

  const handleShareWhatsApp = () => {
    if (referralLink) {
      const url = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${referralLink}`)}`;
      window.open(url, '_blank');
    }
  };

  const handleNativeShare = async () => {
    if (referralLink && navigator.share) {
      try {
        await navigator.share({
          title: "Join PPR Academy",
          text: shareText,
          url: referralLink,
        });
      } catch (error) {
        // User cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
  };

  if (!user) return null;

  return (
    <Card className="overflow-hidden">
      <div className="h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500" />
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Invite Friends</CardTitle>
              <CardDescription>Earn rewards when friends join</CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
            <Sparkles className="w-3 h-3 mr-1" />
            Earn Rewards
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-primary">{stats.totalReferrals}</div>
            <div className="text-xs text-muted-foreground">Friends Invited</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-green-600">{stats.completedReferrals}</div>
            <div className="text-xs text-muted-foreground">Signed Up</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-orange-600">{stats.pendingReferrals}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-purple-600">{stats.totalRewardsEarned}</div>
            <div className="text-xs text-muted-foreground">Credits Earned</div>
          </div>
        </div>

        {/* Referral Code Section */}
        {referralCode ? (
          <div className="space-y-4">
            {/* Referral Link */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Your Referral Link
              </label>
              <div className="flex gap-2">
                <Input
                  value={referralLink || ''}
                  readOnly
                  className="font-mono text-sm bg-muted"
                />
                <Button variant="outline" size="icon" onClick={handleCopyLink}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Referral Code */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Your Referral Code
              </label>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center justify-center py-3 px-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-200 dark:border-purple-800">
                  <span className="font-mono text-xl font-bold tracking-wider">{referralCode}</span>
                </div>
                <Button variant="outline" size="icon" onClick={handleCopyCode}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Share Buttons */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Share with Friends
              </label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShareTwitter}
                  className="flex-1 min-w-[100px]"
                >
                  <Twitter className="w-4 h-4 mr-2" />
                  Twitter
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShareFacebook}
                  className="flex-1 min-w-[100px]"
                >
                  <Facebook className="w-4 h-4 mr-2" />
                  Facebook
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShareWhatsApp}
                  className="flex-1 min-w-[100px]"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShareEmail}
                  className="flex-1 min-w-[100px]"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
              </div>
              <Button
                className="w-full mt-2"
                onClick={handleNativeShare}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share Link
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Start Earning Rewards</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Generate your unique referral code and earn credits when friends sign up!
            </p>
            <Button onClick={handleGenerateCode}>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Referral Code
            </Button>
          </div>
        )}

        {/* Rewards Info */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-purple-500/5 to-pink-500/5 border border-purple-200/50 dark:border-purple-800/50">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Gift className="w-4 h-4 text-purple-500" />
            How it works
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              Share your unique referral link with friends
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              When they sign up, you both get rewarded
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              You earn <strong>1,000 credits</strong>, they get <strong>500 credits</strong>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

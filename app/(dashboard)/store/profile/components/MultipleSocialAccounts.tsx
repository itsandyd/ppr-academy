"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Instagram, Twitter, Facebook, Music2, Youtube, Globe, Plus, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useToast } from "@/hooks/use-toast";
import { Id } from "@/convex/_generated/dataModel";

type Platform = "instagram" | "twitter" | "facebook" | "tiktok" | "youtube" | "linkedin";

interface SocialAccount {
  _id: Id<"socialAccounts">;
  platform: Platform;
  platformUsername?: string;
  platformDisplayName?: string;
  accountLabel?: string;
  isActive: boolean;
  isConnected: boolean;
}

interface NewAccount {
  platform: Platform;
  username: string;
  label: string;
}

const platformConfig = {
  instagram: {
    icon: Instagram,
    color: "from-purple-500 to-pink-500",
    name: "Instagram",
    placeholder: "@username",
    urlFormat: (username: string) => `https://instagram.com/${username.replace('@', '')}`,
  },
  twitter: {
    icon: Twitter,
    color: "from-blue-400 to-blue-600",
    name: "Twitter / X",
    placeholder: "@username",
    urlFormat: (username: string) => `https://twitter.com/${username.replace('@', '')}`,
  },
  facebook: {
    icon: Facebook,
    color: "from-blue-600 to-blue-800",
    name: "Facebook",
    placeholder: "username or profile URL",
    urlFormat: (username: string) => `https://facebook.com/${username.replace('@', '')}`,
  },
  tiktok: {
    icon: Music2,
    color: "from-black to-gray-800 dark:from-white dark:to-gray-200",
    name: "TikTok",
    placeholder: "@username",
    urlFormat: (username: string) => `https://tiktok.com/@${username.replace('@', '')}`,
  },
  youtube: {
    icon: Youtube,
    color: "from-red-500 to-red-700",
    name: "YouTube",
    placeholder: "channel URL or @handle",
    urlFormat: (username: string) => username.startsWith('http') ? username : `https://youtube.com/@${username.replace('@', '')}`,
  },
  linkedin: {
    icon: Globe,
    color: "from-blue-700 to-blue-900",
    name: "LinkedIn",
    placeholder: "profile URL",
    urlFormat: (username: string) => username.startsWith('http') ? username : `https://linkedin.com/in/${username}`,
  },
};

export function MultipleSocialAccounts() {
  const { user: clerkUser } = useUser();
  const { toast } = useToast();
  
  const [isAdding, setIsAdding] = useState(false);
  const [newAccount, setNewAccount] = useState<NewAccount>({
    platform: "instagram",
    username: "",
    label: "",
  });
  const [savingAccountId, setSavingAccountId] = useState<string | null>(null);
  
  // Get store data
  const stores = useQuery(
    api.stores.getStoresByUser,
    clerkUser?.id ? { userId: clerkUser.id } : "skip"
  );
  const store = stores?.[0];
  
  // Get social accounts
  const socialAccounts = useQuery(
    api.socialMedia?.getSocialAccounts as any,
    store ? { storeId: store._id } : "skip"
  ) as SocialAccount[] | undefined;
  
  // Mutations
  const addAccount = useMutation(api.socialMedia?.connectSocialAccount as any);
  const removeAccount = useMutation(api.socialMedia?.disconnectSocialAccount as any);
  const updateLabel = useMutation(api.socialMedia?.updateAccountLabel as any);
  
  const handleAddAccount = async () => {
    if (!newAccount.username.trim() || !store || !clerkUser) {
      toast({
        title: "Missing information",
        description: "Please enter a username",
        variant: "destructive",
      });
      return;
    }
    
    setSavingAccountId("new");
    try {
      await addAccount({
        storeId: store._id,
        userId: clerkUser.id,
        platform: newAccount.platform,
        platformUserId: newAccount.username.replace('@', ''), // Use username as ID for manual entries
        platformUsername: newAccount.username,
        platformDisplayName: newAccount.label || newAccount.username,
        accessToken: "manual", // Manual entry (not OAuth)
        grantedScopes: ["display"], // Limited scope
        accountLabel: newAccount.label || undefined,
      });
      
      toast({
        title: "Account added!",
        description: `${platformConfig[newAccount.platform].name} account has been added to your profile`,
      });
      
      // Reset form
      setNewAccount({
        platform: "instagram",
        username: "",
        label: "",
      });
      setIsAdding(false);
    } catch (error) {
      console.error("Failed to add account:", error);
      toast({
        title: "Failed to add account",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setSavingAccountId(null);
    }
  };
  
  const handleRemoveAccount = async (accountId: Id<"socialAccounts">) => {
    if (!clerkUser) return;
    
    setSavingAccountId(accountId);
    try {
      await removeAccount({
        accountId,
        userId: clerkUser.id,
      });
      
      toast({
        title: "Account removed",
        description: "The social account has been removed from your profile",
      });
    } catch (error) {
      console.error("Failed to remove account:", error);
      toast({
        title: "Failed to remove account",
        description: "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setSavingAccountId(null);
    }
  };
  
  const groupedAccounts = socialAccounts?.reduce((acc, account) => {
    if (!acc[account.platform]) {
      acc[account.platform] = [];
    }
    acc[account.platform].push(account);
    return acc;
  }, {} as Record<Platform, SocialAccount[]>) || {};
  
  return (
    <Card className="max-w-[720px] rounded-3xl">
      <CardHeader>
        <CardTitle className="text-xl">Social Media Accounts</CardTitle>
        <CardDescription>
          Add multiple accounts per platform. These will appear on your public storefront.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Existing Accounts */}
        <div className="space-y-4">
          {Object.entries(platformConfig).map(([platform, config]) => {
            const accounts = groupedAccounts[platform as Platform] || [];
            const Icon = config.icon;
            
            return (
              <div key={platform} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${config.color} flex items-center justify-center text-white`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-sm">{config.name}</h3>
                  <Badge variant="secondary" className="ml-auto">
                    {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}
                  </Badge>
                </div>
                
                {accounts.length > 0 ? (
                  <div className="space-y-2 ml-10">
                    {accounts.map((account) => (
                      <div
                        key={account._id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {account.platformUsername || account.platformDisplayName}
                          </p>
                          {account.accountLabel && (
                            <Badge variant="outline" className="text-xs mt-1">
                              {account.accountLabel}
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            const url = config.urlFormat(account.platformUsername || '');
                            window.open(url, '_blank');
                          }}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveAccount(account._id)}
                          disabled={savingAccountId === account._id}
                        >
                          {savingAccountId === account._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground ml-10">No accounts added yet</p>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Add New Account */}
        {!isAdding ? (
          <Button
            onClick={() => setIsAdding(true)}
            variant="outline"
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Social Account
          </Button>
        ) : (
          <Card className="p-4 bg-muted/30">
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Add New Account</h4>
              
              {/* Platform Select */}
              <div className="space-y-2">
                <Label>Platform</Label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(platformConfig).map(([platform, config]) => {
                    const Icon = config.icon;
                    const isSelected = newAccount.platform === platform;
                    
                    return (
                      <button
                        key={platform}
                        type="button"
                        onClick={() => setNewAccount({ ...newAccount, platform: platform as Platform })}
                        className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/10 shadow-sm'
                            : 'border-border bg-background hover:border-primary/50'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${config.color} flex items-center justify-center text-white flex-shrink-0`}>
                          <Icon className="w-3 h-3" />
                        </div>
                        <span className="text-xs font-medium truncate">{config.name.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Username Input */}
              <div className="space-y-2">
                <Label>Username or URL</Label>
                <Input
                  value={newAccount.username}
                  onChange={(e) => setNewAccount({ ...newAccount, username: e.target.value })}
                  placeholder={platformConfig[newAccount.platform].placeholder}
                />
              </div>
              
              {/* Label Input (optional) */}
              <div className="space-y-2">
                <Label>
                  Label <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Input
                  value={newAccount.label}
                  onChange={(e) => setNewAccount({ ...newAccount, label: e.target.value })}
                  placeholder="e.g., Personal, Business, Shop"
                />
                <p className="text-xs text-muted-foreground">
                  Use labels to distinguish between multiple accounts
                </p>
              </div>
              
              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={handleAddAccount}
                  disabled={!newAccount.username.trim() || savingAccountId === "new"}
                  className="flex-1"
                >
                  {savingAccountId === "new" ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Account
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setIsAdding(false);
                    setNewAccount({ platform: "instagram", username: "", label: "" });
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}
        
      </CardContent>
    </Card>
  );
}


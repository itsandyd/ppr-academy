"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Instagram } from "lucide-react";

interface InstagramAccountSelectorProps {
  storeId: string;
  selectedAccountId?: string;
  onAccountSelect: (accountId: string) => void;
}

export function InstagramAccountSelector({ 
  storeId, 
  selectedAccountId, 
  onAccountSelect 
}: InstagramAccountSelectorProps) {
  // Get all Instagram accounts for this store
  const socialAccounts = useQuery(api.socialMedia.getSocialAccounts, { storeId });
  
  const instagramAccounts = socialAccounts?.filter(
    (account: any) => account.platform === "instagram" && account.isConnected
  ) || [];

  // Don't show selector if only one account
  if (instagramAccounts.length <= 1) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Instagram className="w-5 h-5 text-purple-600" />
          Instagram Account Selection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label htmlFor="instagram-account" className="text-sm font-medium">
            Which Instagram account should this automation use?
          </Label>
          <Select value={selectedAccountId} onValueChange={onAccountSelect}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select Instagram account..." />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-black">
              {instagramAccounts.map((account: any) => (
                <SelectItem key={account._id} value={account._id}>
                  <div className="flex items-center gap-3">
                    <img 
                      src={account.profileImageUrl} 
                      alt={account.platformUsername}
                      className="w-6 h-6 rounded-full"
                    />
                    <div>
                      <span className="font-medium">@{account.platformUsername}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {account.platformDisplayName}
                      </span>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {instagramAccounts.map((account: any) => (
            <div 
              key={account._id}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                selectedAccountId === account._id
                  ? "border-purple-300 dark:border-purple-700 bg-purple-100 dark:bg-purple-900/30"
                  : "border-border hover:border-purple-200 dark:hover:border-purple-800"
              }`}
              onClick={() => onAccountSelect(account._id)}
            >
              <div className="flex items-center gap-3">
                <img 
                  src={account.profileImageUrl} 
                  alt={account.platformUsername}
                  className="w-8 h-8 rounded-full"
                />
                <div className="flex-1">
                  <p className="font-medium text-sm">@{account.platformUsername}</p>
                  <p className="text-xs text-muted-foreground">{account.platformDisplayName}</p>
                </div>
                {selectedAccountId === account._id && (
                  <Badge className="bg-purple-600 text-white">Selected</Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        {selectedAccountId && (
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <p className="text-sm text-green-800 dark:text-green-200">
              ✅ This automation will use <strong>@{instagramAccounts.find(a => a._id === selectedAccountId)?.platformUsername}</strong> 
              for posting replies and sending messages.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

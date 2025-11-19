"use client";

import { useBeatLeaseCreation } from "../context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, FileText, Eye, CheckCircle, X } from "lucide-react";
import { LeaseType, LeaseOption } from "../types";
import { getContractPreview } from "../contracts";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function LicensingForm() {
  const { state, updateData, saveBeat } = useBeatLeaseCreation();
  const router = useRouter();

  const handleBack = () => {
    router.push(`/dashboard/create/beat-lease?step=files${state.beatId ? `&beatId=${state.beatId}` : ''}`);
  };

  const updateLeaseOption = (leaseType: LeaseType, updates: Partial<LeaseOption>) => {
    const currentOptions = state.data.leaseOptions || [];
    const newOptions = currentOptions.map(option => 
      option.type === leaseType ? { ...option, ...updates } : option
    );
    updateData("licensing", { leaseOptions: newOptions });
  };

  const toggleLeaseOption = (leaseType: LeaseType, enabled: boolean) => {
    updateLeaseOption(leaseType, { enabled });
  };

  const canProceed = state.data.leaseOptions?.some(opt => opt.enabled) || false;

  const getLeaseOption = (type: LeaseType) => {
    return state.data.leaseOptions?.find(opt => opt.type === type);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">License Options</h2>
        <p className="text-muted-foreground mt-1">
          Configure pricing and terms for different license types
        </p>
      </div>

      {/* License Options */}
      <div className="space-y-4">
        {/* Free License */}
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  🎁 Free License
                  <Badge variant="outline" className="text-xs">Lead Magnet</Badge>
                </CardTitle>
                <CardDescription>MP3 with producer tag, no commercial use</CardDescription>
              </div>
              <Switch
                checked={getLeaseOption('free')?.enabled || false}
                onCheckedChange={(checked) => toggleLeaseOption('free', checked)}
              />
            </div>
          </CardHeader>
          {getLeaseOption('free')?.enabled && (
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Perfect for building your email list and social following. Artists get a tagged MP3 for non-commercial use.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Files included:</span>
                  <div className="flex gap-2">
                    <Badge variant="secondary">MP3</Badge>
                  </div>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-2" />
                      Preview Contract
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white dark:bg-black">
                    <DialogHeader>
                      <DialogTitle>Free License Contract Preview</DialogTitle>
                      <DialogDescription>
                        This contract will be generated for each free download
                      </DialogDescription>
                    </DialogHeader>
                    <pre className="text-xs bg-muted p-4 rounded-lg whitespace-pre-wrap">
                      {getContractPreview(state.data, 'free')}
                    </pre>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Basic License */}
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  🥉 Basic License
                  <Badge variant="outline" className="text-xs">Most Popular</Badge>
                </CardTitle>
                <CardDescription>MP3 + WAV, commercial use, 5K distribution limit</CardDescription>
              </div>
              <Switch
                checked={getLeaseOption('basic')?.enabled || false}
                onCheckedChange={(checked) => toggleLeaseOption('basic', checked)}
              />
            </div>
          </CardHeader>
          {getLeaseOption('basic')?.enabled && (
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Price</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                      <Input
                        type="number"
                        min="1"
                        value={getLeaseOption('basic')?.price || 25}
                        onChange={(e) => updateLeaseOption('basic', { price: parseFloat(e.target.value) || 25 })}
                        className="pl-8 bg-background"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Files included:</span>
                    <div className="flex gap-2">
                      <Badge variant="secondary">MP3</Badge>
                      <Badge variant="secondary">WAV</Badge>
                    </div>
                  </div>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-2" />
                      Preview Contract
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white dark:bg-black">
                    <DialogHeader>
                      <DialogTitle>Basic License Contract Preview</DialogTitle>
                      <DialogDescription>
                        This contract will be sent with basic license purchases
                      </DialogDescription>
                    </DialogHeader>
                    <pre className="text-xs bg-muted p-4 rounded-lg whitespace-pre-wrap">
                      {getContractPreview(state.data, 'basic')}
                    </pre>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Premium License */}
        <Card className="border-purple-200 dark:border-purple-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  🥈 Premium License
                  <Badge variant="outline" className="text-xs">Includes Stems</Badge>
                </CardTitle>
                <CardDescription>MP3 + WAV + Stems, 50K distribution limit</CardDescription>
              </div>
              <Switch
                checked={getLeaseOption('premium')?.enabled || false}
                onCheckedChange={(checked) => toggleLeaseOption('premium', checked)}
              />
            </div>
          </CardHeader>
          {getLeaseOption('premium')?.enabled && (
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Price</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                      <Input
                        type="number"
                        min="1"
                        value={getLeaseOption('premium')?.price || 75}
                        onChange={(e) => updateLeaseOption('premium', { price: parseFloat(e.target.value) || 75 })}
                        className="pl-8 bg-background"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Files included:</span>
                    <div className="flex gap-2">
                      <Badge variant="secondary">MP3</Badge>
                      <Badge variant="secondary">WAV</Badge>
                      <Badge variant="secondary">Stems</Badge>
                    </div>
                  </div>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-2" />
                      Preview Contract
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white dark:bg-black">
                    <DialogHeader>
                      <DialogTitle>Premium License Contract Preview</DialogTitle>
                    </DialogHeader>
                    <pre className="text-xs bg-muted p-4 rounded-lg whitespace-pre-wrap">
                      {getContractPreview(state.data, 'premium')}
                    </pre>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Exclusive License */}
        <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  🥇 Exclusive License
                  <Badge className="bg-yellow-600">Full Rights</Badge>
                </CardTitle>
                <CardDescription>All files, unlimited use, beat removed from store</CardDescription>
              </div>
              <Switch
                checked={getLeaseOption('exclusive')?.enabled || false}
                onCheckedChange={(checked) => toggleLeaseOption('exclusive', checked)}
              />
            </div>
          </CardHeader>
          {getLeaseOption('exclusive')?.enabled && (
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Price</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                      <Input
                        type="number"
                        min="100"
                        value={getLeaseOption('exclusive')?.price || 500}
                        onChange={(e) => updateLeaseOption('exclusive', { price: parseFloat(e.target.value) || 500 })}
                        className="pl-8 bg-background"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Files included:</span>
                    <div className="flex gap-2">
                      <Badge variant="secondary">MP3</Badge>
                      <Badge variant="secondary">WAV</Badge>
                      <Badge variant="secondary">Stems</Badge>
                      <Badge variant="secondary">Trackouts</Badge>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-yellow-100 dark:bg-yellow-950/20 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Note:</strong> When someone buys exclusive rights, this beat will be automatically removed from your store.
                  </p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-2" />
                      Preview Contract
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white dark:bg-black">
                    <DialogHeader>
                      <DialogTitle>Exclusive License Contract Preview</DialogTitle>
                      <DialogDescription>
                        This comprehensive contract transfers full rights
                      </DialogDescription>
                    </DialogHeader>
                    <pre className="text-xs bg-muted p-4 rounded-lg whitespace-pre-wrap">
                      {getContractPreview(state.data, 'exclusive')}
                    </pre>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Summary */}
      <Card className="bg-muted/50">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">License Summary</h3>
          <div className="space-y-2">
            {state.data.leaseOptions?.filter(opt => opt.enabled).map((option) => (
              <div key={option.type} className="flex items-center justify-between">
                <span className="text-sm">
                  {option.type === 'free' && '🎁 Free'}
                  {option.type === 'basic' && '🥉 Basic'}
                  {option.type === 'premium' && '🥈 Premium'}
                  {option.type === 'exclusive' && '🥇 Exclusive'}
                </span>
                <span className="font-semibold">${option.price}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            💡 Each license type has its own contract with specific terms and file access
          </p>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={handleBack}>
          ← Back
        </Button>
        <Button disabled={!canProceed}>
          {canProceed ? "Ready to Publish" : "Enable at least one license"}
        </Button>
      </div>
    </div>
  );
}

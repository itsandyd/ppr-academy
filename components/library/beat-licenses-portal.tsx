"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Music,
  Download,
  FileText,
  ExternalLink,
  Loader2,
  Check,
  X,
  Crown,
  FileAudio,
  Layers,
  Calendar,
  DollarSign,
  User,
  Store,
  Info,
  Play,
  Pause,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface BeatLicensesPortalProps {
  className?: string;
}

const TIER_ICONS = {
  basic: FileAudio,
  premium: Layers,
  exclusive: Crown,
  unlimited: Crown,
};

const TIER_COLORS = {
  basic: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  premium: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  exclusive: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  unlimited: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

export function BeatLicensesPortal({ className }: BeatLicensesPortalProps) {
  const { user } = useUser();
  const licenses = useQuery(
    api.beatLeases.getUserBeatLicenses,
    user?.id ? { userId: user.id } : "skip"
  );

  const [playingBeatId, setPlayingBeatId] = useState<string | null>(null);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  const [selectedLicense, setSelectedLicense] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const handlePlayPause = (beatId: string, audioUrl: string) => {
    if (playingBeatId === beatId) {
      audioRef?.pause();
      setPlayingBeatId(null);
    } else {
      if (audioRef) {
        audioRef.pause();
      }
      const audio = new Audio(audioUrl);
      audio.play();
      audio.onended = () => setPlayingBeatId(null);
      setAudioRef(audio);
      setPlayingBeatId(beatId);
    }
  };

  const handleDownloadContract = async (licenseId: string) => {
    try {
      const response = await fetch(`/api/beats/contract?licenseId=${licenseId}`);
      if (!response.ok) throw new Error("Failed to download contract");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "license_agreement.pdf";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Contract downloaded");
    } catch (error) {
      toast.error("Failed to download contract");
    }
  };

  const handleDownloadFiles = async (license: any) => {
    setIsDownloading(license._id);
    try {
      // In a real implementation, this would call an API to get download links
      const response = await fetch(`/api/beats/download?licenseId=${license._id}`);
      if (!response.ok) throw new Error("Failed to get download links");

      const data = await response.json();
      // Open download links
      if (data.downloadUrls) {
        for (const url of data.downloadUrls) {
          window.open(url, "_blank");
        }
      }
      toast.success("Download started");
    } catch (error) {
      toast.error("Failed to download files");
    } finally {
      setIsDownloading(null);
    }
  };

  if (!user) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Music className="h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-lg font-medium">Sign in to view your licenses</p>
          <p className="text-sm text-muted-foreground">
            Access your purchased beat licenses and download files
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!licenses) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (licenses.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            My Beat Licenses
          </CardTitle>
          <CardDescription>
            View and manage your purchased beat licenses
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Music className="h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-lg font-medium">No licenses yet</p>
          <p className="text-sm text-muted-foreground">
            Your purchased beat licenses will appear here
          </p>
          <Button className="mt-4" variant="outline" asChild>
            <a href="/marketplace/beats">Browse Beats</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Group by tier type for stats
  const stats = {
    total: licenses.length,
    basic: licenses.filter((l: any) => l.tierType === "basic").length,
    premium: licenses.filter((l: any) => l.tierType === "premium").length,
    exclusive: licenses.filter((l: any) => l.tierType === "exclusive").length,
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Licenses</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Basic</CardDescription>
            <CardTitle className="text-2xl">{stats.basic}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Premium</CardDescription>
            <CardTitle className="text-2xl">{stats.premium}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Exclusive</CardDescription>
            <CardTitle className="text-2xl">{stats.exclusive}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Licenses Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            My Beat Licenses
          </CardTitle>
          <CardDescription>
            View and manage your purchased beat licenses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Beat</TableHead>
                <TableHead>License Type</TableHead>
                <TableHead>Producer</TableHead>
                <TableHead>Purchased</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {licenses.map((license: any) => {
                const TierIcon = TIER_ICONS[license.tierType as keyof typeof TIER_ICONS];
                return (
                  <TableRow key={license._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {license.beat?.imageUrl ? (
                          <img
                            src={license.beat.imageUrl}
                            alt={license.beatTitle}
                            className="h-12 w-12 rounded-md object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
                            <Music className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{license.beatTitle}</p>
                          {license.beat && (
                            <div className="flex gap-2 text-xs text-muted-foreground">
                              {license.beat.bpm && <span>{license.beat.bpm} BPM</span>}
                              {license.beat.key && <span>{license.beat.key}</span>}
                            </div>
                          )}
                        </div>
                        {license.beat?.audioUrl && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              handlePlayPause(license.beatId.toString(), license.beat.audioUrl)
                            }
                          >
                            {playingBeatId === license.beatId.toString() ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "gap-1",
                          TIER_COLORS[license.tierType as keyof typeof TIER_COLORS]
                        )}
                      >
                        <TierIcon className="h-3 w-3" />
                        {license.tierName}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{license.producerName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(license.createdAt, "MMM d, yyyy")}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedLicense(license)}
                            >
                              <Info className="mr-2 h-4 w-4" />
                              Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle>License Details</DialogTitle>
                              <DialogDescription>
                                {license.beatTitle} - {license.tierName}
                              </DialogDescription>
                            </DialogHeader>
                            <LicenseDetails license={license} />
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadContract(license._id)}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Contract
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleDownloadFiles(license)}
                          disabled={isDownloading === license._id}
                        >
                          {isDownloading === license._id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="mr-2 h-4 w-4" />
                          )}
                          Download
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function LicenseDetails({ license }: { license: any }) {
  return (
    <div className="space-y-6">
      {/* Beat Info */}
      <div className="flex items-start gap-4">
        {license.beat?.imageUrl ? (
          <img
            src={license.beat.imageUrl}
            alt={license.beatTitle}
            className="h-20 w-20 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-muted">
            <Music className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        <div>
          <h3 className="text-lg font-semibold">{license.beatTitle}</h3>
          <p className="text-sm text-muted-foreground">
            Produced by {license.producerName}
          </p>
          {license.store && (
            <p className="text-sm text-muted-foreground">
              via {license.store.name}
            </p>
          )}
        </div>
      </div>

      <Separator />

      {/* License Terms */}
      <div className="space-y-4">
        <h4 className="font-medium">License Terms</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            {license.commercialUse ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <X className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm">Commercial Use</span>
          </div>
          <div className="flex items-center gap-2">
            {license.musicVideoUse ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <X className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm">Music Videos</span>
          </div>
          <div className="flex items-center gap-2">
            {license.radioBroadcasting ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <X className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm">Radio/TV</span>
          </div>
          <div className="flex items-center gap-2">
            {license.stemsIncluded ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <X className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm">Stems Included</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Distribution Limits */}
      <div className="space-y-2">
        <h4 className="font-medium">Distribution Limits</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Downloads/Sales:</span>
            <p className="font-medium">
              {license.distributionLimit
                ? license.distributionLimit.toLocaleString()
                : "Unlimited"}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Streams:</span>
            <p className="font-medium">
              {license.streamingLimit
                ? license.streamingLimit.toLocaleString()
                : "Unlimited"}
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Files Included */}
      <div className="space-y-2">
        <h4 className="font-medium">Files Included</h4>
        <div className="flex flex-wrap gap-2">
          {license.deliveredFiles?.map((file: string) => (
            <Badge key={file} variant="secondary">
              {file.toUpperCase()}
            </Badge>
          ))}
        </div>
      </div>

      {/* Credit Requirement */}
      {license.creditRequired && (
        <>
          <Separator />
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/50">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Credit Required
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              You must credit: &quot;Prod. by {license.producerName}&quot;
            </p>
          </div>
        </>
      )}

      {/* Purchase Info */}
      <Separator />
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Purchase Date</span>
        <span>{format(license.createdAt, "MMMM d, yyyy")}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Amount Paid</span>
        <span className="font-medium">${license.price.toFixed(2)}</span>
      </div>
    </div>
  );
}

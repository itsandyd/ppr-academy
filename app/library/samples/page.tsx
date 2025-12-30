"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Music, Search, Package, Download, Filter, Play, Pause } from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function LibrarySamplesPage() {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPack, setFilterPack] = useState<string>("all");
  const [playingSample, setPlayingSample] = useState<any | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Get samples with properly resolved URLs from Convex
  const allSamples =
    useQuery(api.libraryHelpers.getPackSamplesWithUrls, user?.id ? { userId: user.id } : "skip") ||
    [];

  // Get user's purchases for pack count
  const userPurchases = useQuery(
    api.library.getUserPurchases,
    user?.id ? { userId: user.id } : "skip"
  );

  // Extract purchased packs for stats
  const purchasedPacks = useMemo(() => {
    return (
      userPurchases?.filter(
        (purchase: any) =>
          purchase.product?.productCategory === "sample-pack" ||
          purchase.product?.productCategory === "midi-pack" ||
          purchase.product?.productCategory === "preset-pack"
      ) || []
    );
  }, [userPurchases]);

  // Get unique packs for filter
  const uniquePacks = Array.from(new Set(allSamples.map((s: any) => s.packId))).map(
    (packId: any) => {
      const sample = allSamples.find((s: any) => s.packId === packId);
      return { id: packId, title: sample?.packTitle };
    }
  );

  // Filter samples
  const filteredSamples = allSamples.filter((sample: any) => {
    const matchesSearch =
      sample.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sample.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sample.packTitle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPack = filterPack === "all" || sample.packId === filterPack;

    return matchesSearch && matchesPack;
  });

  // Stats
  const stats = {
    totalPacks: purchasedPacks.length,
    totalSamples: allSamples.length,
    totalSize: allSamples.reduce((sum: number, s: any) => sum + (s.fileSize || 0), 0),
  };

  // Audio player
  const handlePlayPause = async (sample: any) => {
    if (playingSample?._id === sample._id && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (audioRef.current && sample.fileUrl) {
        try {
          audioRef.current.src = sample.fileUrl;
          await audioRef.current.play();
          setPlayingSample(sample);
          setIsPlaying(true);
        } catch (error) {
          console.error("Play failed:", error);
          toast.error("Failed to play sample");
        }
      }
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => setIsPlaying(false);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("pause", handlePause);
    };
  }, []);

  const handleDownload = async (sample: any) => {
    try {
      const response = await fetch(sample.fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = sample.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(`Downloading ${sample.fileName}`);
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Download failed. Please try again.");
    }
  };

  const handleDownloadAll = async () => {
    toast.success(`Downloading ${filteredSamples.length} samples...`);
    for (const sample of filteredSamples) {
      await handleDownload(sample);
      // Small delay between downloads to avoid overwhelming the browser
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden audio element */}
      <audio ref={audioRef} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Samples</h1>
          <p className="mt-2 text-muted-foreground">
            Access and download all your purchased samples
          </p>
        </div>
        {filteredSamples.length > 0 && (
          <Button
            onClick={handleDownloadAll}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Download className="mr-2 h-4 w-4" />
            Download All ({filteredSamples.length})
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-foreground">{stats.totalPacks}</div>
            <div className="text-sm text-muted-foreground">Packs Owned</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.totalSamples}</div>
            <div className="text-sm text-muted-foreground">Total Samples</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {(stats.totalSize / 1024 / 1024).toFixed(1)} MB
            </div>
            <div className="text-sm text-muted-foreground">Total Size</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{filteredSamples.length}</div>
            <div className="text-sm text-muted-foreground">Showing</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search samples by name, pack, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterPack === "all" ? "default" : "outline"}
            onClick={() => setFilterPack("all")}
            size="sm"
          >
            <Filter className="mr-2 h-4 w-4" />
            All Packs
          </Button>
          {uniquePacks.map((pack) => (
            <Button
              key={pack.id}
              variant={filterPack === pack.id ? "default" : "outline"}
              onClick={() => setFilterPack(pack.id)}
              size="sm"
            >
              {pack.title}
            </Button>
          ))}
        </div>
      </div>

      {/* Samples List */}
      {filteredSamples.length > 0 ? (
        <div className="space-y-2">
          {filteredSamples.map((sample: any, index: number) => (
            <motion.div
              key={sample._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.02 }}
            >
              <Card className="transition-all hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Play Button */}
                    <Button
                      size="icon"
                      variant={
                        playingSample?._id === sample._id && isPlaying ? "default" : "outline"
                      }
                      onClick={() => handlePlayPause(sample)}
                      className="flex-shrink-0"
                    >
                      {playingSample?._id === sample._id && isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>

                    {/* Sample Icon */}
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20">
                      <Music className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>

                    {/* Sample Info */}
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate font-semibold">{sample.title}</h4>
                      <p className="text-sm text-muted-foreground">From: {sample.packTitle}</p>
                    </div>

                    {/* Metadata */}
                    <div className="hidden items-center gap-2 md:flex">
                      <Badge variant="outline" className="text-xs">
                        {(sample.fileSize / 1024).toFixed(0)} KB
                      </Badge>
                      {sample.tags?.slice(0, 2).map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    {/* Download Button */}
                    <Button
                      size="sm"
                      onClick={() => handleDownload(sample)}
                      className="flex-shrink-0 bg-green-600 hover:bg-green-700"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            {allSamples.length === 0 ? (
              <>
                <Package className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                <h2 className="mb-2 text-2xl font-bold text-foreground">No samples yet</h2>
                <p className="mb-6 text-muted-foreground">
                  Purchase sample packs from the marketplace to build your library
                </p>
                <Button asChild>
                  <Link href="/marketplace/samples">
                    <Package className="mr-2 h-4 w-4" />
                    Browse Sample Packs
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Search className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                <h2 className="mb-2 text-2xl font-bold text-foreground">No samples found</h2>
                <p className="mb-6 text-muted-foreground">
                  Try adjusting your search or filter criteria
                </p>
                <Button
                  onClick={() => {
                    setSearchQuery("");
                    setFilterPack("all");
                  }}
                  variant="outline"
                >
                  Clear Filters
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

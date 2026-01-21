"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Download,
  Music,
  Package,
  Loader2,
  ArrowLeft,
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  Search,
  Folder,
  FileAudio,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface SampleFile {
  id: string;
  name: string;
  url: string;
  storageId?: string;
  size?: number;
  type?: string;
  bpm?: number;
  key?: string;
  duration?: number;
}

interface SamplePack {
  _id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  packFiles: SampleFile[];
  purchaseDate: number;
  productCategory: string;
  genre?: string;
  storeName?: string;
  storeSlug?: string;
}

function SampleFileRow({
  file,
  packTitle,
  isPlaying,
  onPlay,
  onPause,
}: {
  file: SampleFile;
  packTitle: string;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
}) {
  const displayName = file.name.replace(/\.(wav|mp3|flac|aiff|mid|midi)$/i, "");
  const extension = file.name.split(".").pop()?.toUpperCase() || "AUDIO";
  const fileSizeKB = file.size ? (file.size / 1024).toFixed(0) : null;

  const handleDownload = async () => {
    try {
      const response = await fetch(file.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 p-3 transition-colors hover:bg-muted/50">
      <Button
        size="sm"
        variant="ghost"
        className="h-9 w-9 flex-shrink-0 rounded-full p-0"
        onClick={isPlaying ? onPause : onPlay}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4 text-pink-500" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>

      <div className="flex min-w-0 flex-1 items-center gap-2">
        <FileAudio className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        <span className="truncate font-medium">{displayName}</span>
      </div>

      <div className="flex items-center gap-2">
        {file.bpm && (
          <Badge variant="outline" className="text-xs">
            {file.bpm} BPM
          </Badge>
        )}
        {file.key && (
          <Badge variant="outline" className="text-xs">
            {file.key}
          </Badge>
        )}
        <Badge variant="secondary" className="text-xs">
          {extension}
        </Badge>
        {fileSizeKB && (
          <span className="text-xs text-muted-foreground">{fileSizeKB} KB</span>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 text-green-600 hover:bg-green-100 hover:text-green-700 dark:hover:bg-green-900/20"
          onClick={handleDownload}
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function SamplePackCard({
  pack,
  isExpanded,
  onToggle,
  playingFileId,
  onPlayFile,
  onPauseFile,
}: {
  pack: SamplePack;
  isExpanded: boolean;
  onToggle: () => void;
  playingFileId: string | null;
  onPlayFile: (fileId: string, url: string) => void;
  onPauseFile: () => void;
}) {
  const fileCount = pack.packFiles.length;
  const totalSize = pack.packFiles.reduce((acc, f) => acc + (f.size || 0), 0);
  const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(1);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "sample-pack":
        return "from-pink-500 to-rose-500";
      case "midi-pack":
        return "from-blue-500 to-cyan-500";
      case "preset-pack":
        return "from-purple-500 to-violet-500";
      default:
        return "from-gray-500 to-slate-500";
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "sample-pack":
        return "Sample Pack";
      case "midi-pack":
        return "MIDI Pack";
      case "preset-pack":
        return "Preset Pack";
      default:
        return "Pack";
    }
  };

  const handleDownloadAll = async () => {
    for (const file of pack.packFiles) {
      try {
        const response = await fetch(file.url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to download ${file.name}:`, error);
      }
    }
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg">
      <CardContent className="p-0">
        <div
          className="flex cursor-pointer items-start gap-4 p-4"
          onClick={onToggle}
        >
          <div
            className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${getCategoryColor(pack.productCategory)}`}
          >
            {pack.imageUrl ? (
              <img
                src={pack.imageUrl}
                alt={pack.title}
                className="h-full w-full rounded-lg object-cover"
              />
            ) : (
              <Package className="h-8 w-8 text-white" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <h3 className="truncate text-lg font-semibold">{pack.title}</h3>
              <Badge
                variant="secondary"
                className={`bg-gradient-to-r ${getCategoryColor(pack.productCategory)} text-xs text-white`}
              >
                {getCategoryLabel(pack.productCategory)}
              </Badge>
            </div>

            {pack.description && (
              <p className="mb-2 line-clamp-1 text-sm text-muted-foreground">
                {pack.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Music className="h-3.5 w-3.5" />
                {fileCount} files
              </span>
              <span className="flex items-center gap-1">
                <Folder className="h-3.5 w-3.5" />
                {totalSizeMB} MB
              </span>
              {pack.genre && (
                <Badge variant="outline" className="text-xs">
                  {pack.genre}
                </Badge>
              )}
              {pack.storeName && (
                <span className="text-xs">by {pack.storeName}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                handleDownloadAll();
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Download All
            </Button>
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>

        {isExpanded && pack.packFiles.length > 0 && (
          <div className="border-t bg-muted/20 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-medium text-muted-foreground">
                Files ({fileCount})
              </h4>
            </div>
            <div className="space-y-2">
              {pack.packFiles.map((file) => (
                <SampleFileRow
                  key={file.id || file.storageId || file.name}
                  file={file}
                  packTitle={pack.title}
                  isPlaying={
                    playingFileId === (file.id || file.storageId || file.name)
                  }
                  onPlay={() =>
                    onPlayFile(file.id || file.storageId || file.name, file.url)
                  }
                  onPause={onPauseFile}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function SamplesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") as "learn" | "create" | null;
  const { user, isLoaded: isUserLoaded } = useUser();

  const [expandedPacks, setExpandedPacks] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [playingFileId, setPlayingFileId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!mode || mode !== "learn") {
      router.push("/dashboard/samples?mode=learn");
    }
  }, [mode, router]);

  const convexUser = useQuery(
    api.users.getUserFromClerk,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const userPurchases = useQuery(
    api.library.getUserPurchases,
    convexUser?.clerkId ? { userId: convexUser.clerkId } : "skip"
  );

  // Filter to sample/midi/preset packs only
  const samplePacks: SamplePack[] =
    userPurchases
      ?.filter(
        (purchase: any) =>
          purchase.product?.productCategory === "sample-pack" ||
          purchase.product?.productCategory === "midi-pack" ||
          purchase.product?.productCategory === "preset-pack"
      )
      .map((purchase: any) => {
        const pack = purchase.product;
        let files: SampleFile[] = [];

        try {
          if (pack?.packFiles) {
            files = JSON.parse(pack.packFiles);
          }
        } catch (e) {
          files = [];
        }

        return {
          _id: pack._id,
          title: pack.title,
          description: pack.description,
          imageUrl: pack.imageUrl,
          packFiles: files,
          purchaseDate: purchase._creationTime,
          productCategory: pack.productCategory,
          genre: pack.genre,
          storeName: purchase.storeName,
          storeSlug: purchase.storeSlug,
        };
      }) || [];

  // Filter by search query
  const filteredPacks = samplePacks.filter((pack) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      pack.title.toLowerCase().includes(query) ||
      pack.description?.toLowerCase().includes(query) ||
      pack.genre?.toLowerCase().includes(query) ||
      pack.packFiles.some((f) => f.name.toLowerCase().includes(query))
    );
  });

  const togglePack = (packId: string) => {
    setExpandedPacks((prev) => {
      const next = new Set(prev);
      if (next.has(packId)) {
        next.delete(packId);
      } else {
        next.add(packId);
      }
      return next;
    });
  };

  const handlePlayFile = (fileId: string, url: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(url);
    audio.play();
    audio.onended = () => setPlayingFileId(null);
    audioRef.current = audio;
    setPlayingFileId(fileId);
  };

  const handlePauseFile = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setPlayingFileId(null);
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const isLoading =
    !isUserLoaded ||
    (user && convexUser === undefined) ||
    userPurchases === undefined;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div>
            <Skeleton className="mb-2 h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const totalFiles = samplePacks.reduce(
    (acc, pack) => acc + pack.packFiles.length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-500">
            <Music className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">My Samples</h1>
            <p className="text-muted-foreground">
              {samplePacks.length} packs &bull; {totalFiles} files
            </p>
          </div>
        </div>
        <Link href="/dashboard?mode=learn">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Search */}
      {samplePacks.length > 0 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search packs and files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {/* Pack List */}
      {filteredPacks.length > 0 ? (
        <div className="space-y-4">
          {filteredPacks.map((pack) => (
            <SamplePackCard
              key={pack._id}
              pack={pack}
              isExpanded={expandedPacks.has(pack._id)}
              onToggle={() => togglePack(pack._id)}
              playingFileId={playingFileId}
              onPlayFile={handlePlayFile}
              onPauseFile={handlePauseFile}
            />
          ))}
        </div>
      ) : searchQuery ? (
        <Card className="p-8 text-center">
          <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No results found</h3>
          <p className="text-muted-foreground">
            Try searching with different keywords
          </p>
        </Card>
      ) : (
        <Card className="p-12 text-center">
          <Package className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h3 className="mb-2 text-xl font-semibold">No Sample Packs Yet</h3>
          <p className="mb-6 text-muted-foreground">
            Purchase sample packs, MIDI packs, or preset packs from the
            marketplace to build your library.
          </p>
          <Link href="/marketplace/samples">
            <Button className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600">
              <Package className="mr-2 h-4 w-4" />
              Browse Sample Packs
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}

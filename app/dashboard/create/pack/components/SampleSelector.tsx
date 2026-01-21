"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Music,
  Play,
  Pause,
  Package,
  Check,
  X,
  Filter,
} from "lucide-react";

interface Sample {
  _id: Id<"audioSamples">;
  title: string;
  genre: string;
  category: string;
  bpm?: number;
  key?: string;
  duration: number;
  creditPrice: number;
  fileUrl: string;
  packIds?: Id<"digitalProducts">[];
  packCount?: number;
}

interface SampleSelectorProps {
  storeId: string;
  selectedSampleIds: Id<"audioSamples">[];
  onSampleToggle: (sampleId: Id<"audioSamples">, selected: boolean) => void;
  onSelectAll: (sampleIds: Id<"audioSamples">[]) => void;
  onClearAll: () => void;
  currentPackId?: Id<"digitalProducts">;
}

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "drums", label: "Drums" },
  { value: "bass", label: "Bass" },
  { value: "synth", label: "Synth" },
  { value: "vocals", label: "Vocals" },
  { value: "fx", label: "FX" },
  { value: "melody", label: "Melody" },
  { value: "loops", label: "Loops" },
  { value: "one-shots", label: "One-shots" },
];

export function SampleSelector({
  storeId,
  selectedSampleIds,
  onSampleToggle,
  onSelectAll,
  onClearAll,
  currentPackId,
}: SampleSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [playingSampleId, setPlayingSampleId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch creator's samples
  const samples = useQuery(api.samples.getCreatorSamplesForPacks, { storeId }) as Sample[] | undefined;

  // Filter samples
  const filteredSamples = samples?.filter((sample) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !sample.title.toLowerCase().includes(query) &&
        !sample.genre.toLowerCase().includes(query) &&
        !sample.category.toLowerCase().includes(query)
      ) {
        return false;
      }
    }

    // Category filter
    if (categoryFilter !== "all" && sample.category !== categoryFilter) {
      return false;
    }

    return true;
  });

  const handlePlayPause = (sample: Sample) => {
    if (playingSampleId === sample._id) {
      audioRef.current?.pause();
      setPlayingSampleId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = sample.fileUrl;
        audioRef.current.play();
        setPlayingSampleId(sample._id);
      }
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => setPlayingSampleId(null);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.pause();
    };
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const selectedCount = selectedSampleIds.length;
  const totalCredits = samples
    ?.filter((s) => selectedSampleIds.includes(s._id))
    .reduce((sum, s) => sum + s.creditPrice, 0) || 0;

  if (!samples) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-muted-foreground">
              Loading your samples...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (samples.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Music className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Samples Yet</h3>
            <p className="text-muted-foreground mb-4">
              Upload individual samples first to add them to your pack.
            </p>
            <Button variant="outline" asChild>
              <a href="/dashboard/create/sample">Upload Samples</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Add Existing Samples
        </CardTitle>
        <CardDescription>
          Select samples from your library to include in this pack. Customers
          can buy the pack to get all samples, or buy individual samples
          separately.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Hidden audio element */}
        <audio ref={audioRef} />

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search samples..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selection Summary */}
        {selectedCount > 0 && (
          <div className="flex items-center justify-between rounded-lg bg-primary/5 p-3">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span className="font-medium">
                {selectedCount} sample{selectedCount !== 1 ? "s" : ""} selected
              </span>
              <Badge variant="secondary" className="ml-2">
                Total value: {totalCredits} credits
              </Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={onClearAll}>
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        )}

        {/* Bulk Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const allIds = filteredSamples?.map((s) => s._id) || [];
              onSelectAll(allIds);
            }}
          >
            Select All ({filteredSamples?.length || 0})
          </Button>
          {selectedCount > 0 && (
            <Button variant="outline" size="sm" onClick={onClearAll}>
              Clear Selection
            </Button>
          )}
        </div>

        {/* Sample List */}
        <ScrollArea className="h-[400px] rounded-md border">
          <div className="space-y-1 p-2">
            {filteredSamples?.map((sample) => {
              const isSelected = selectedSampleIds.includes(sample._id);
              const isInOtherPacks =
                sample.packIds &&
                sample.packIds.length > 0 &&
                (!currentPackId || !sample.packIds.includes(currentPackId));

              return (
                <div
                  key={sample._id}
                  className={`flex items-center gap-3 rounded-lg border p-3 transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) =>
                      onSampleToggle(sample._id, checked as boolean)
                    }
                    className="h-5 w-5"
                  />

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={() => handlePlayPause(sample)}
                  >
                    {playingSampleId === sample._id ? (
                      <Pause className="h-4 w-4 text-primary" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{sample.title}</span>
                      {isInOtherPacks && (
                        <Badge variant="outline" className="text-xs">
                          In {sample.packCount} pack{sample.packCount !== 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{sample.category}</span>
                      <span>•</span>
                      <span>{sample.genre}</span>
                      {sample.bpm && (
                        <>
                          <span>•</span>
                          <span>{sample.bpm} BPM</span>
                        </>
                      )}
                      {sample.key && (
                        <>
                          <span>•</span>
                          <span>{sample.key}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{formatDuration(sample.duration)}</span>
                    </div>
                  </div>

                  <Badge variant="secondary" className="flex-shrink-0">
                    {sample.creditPrice} credits
                  </Badge>
                </div>
              );
            })}

            {filteredSamples?.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                No samples match your search
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Suggested Pack Price */}
        {selectedCount > 0 && (
          <div className="rounded-lg bg-muted/50 p-4">
            <h4 className="font-medium mb-2">Suggested Pack Pricing</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Individual total</p>
                <p className="text-lg font-semibold">{totalCredits} credits</p>
              </div>
              <div>
                <p className="text-muted-foreground">20% discount</p>
                <p className="text-lg font-semibold text-green-600">
                  {Math.round(totalCredits * 0.8)} credits
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">30% discount</p>
                <p className="text-lg font-semibold text-green-600">
                  {Math.round(totalCredits * 0.7)} credits
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

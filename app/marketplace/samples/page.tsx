"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Play,
  Pause,
  Download,
  Heart,
  ShoppingCart,
  Package,
  Music,
  Filter,
  Grid3x3,
  List,
  Waves,
  Volume2,
  X,
  Menu,
  BookOpen,
  Store,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { SignUpButton, useAuth } from "@clerk/nextjs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ReportButton } from "@/components/shared/report-button";

const GENRES = [
  "Hip Hop",
  "Trap",
  "R&B",
  "Pop",
  "Electronic",
  "House",
  "Techno",
  "Drum & Bass",
  "Dubstep",
  "Lo-Fi",
  "Ambient",
  "Indie",
  "Rock",
  "Jazz",
];

const CATEGORIES = ["drums", "bass", "synth", "vocals", "fx", "melody", "loops", "one-shots"];

export default function SamplesMarketplacePage() {
  const { isSignedIn, userId } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // View state
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState<"samples" | "packs">("samples");

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string | undefined>();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState("newest");

  // Audio player state
  const [playingSample, setPlayingSample] = useState<any | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Purchase modal state
  const [selectedForPurchase, setSelectedForPurchase] = useState<any | null>(null);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);

  // Queries
  const legacySamples =
    useQuery(api.samples.getPublishedSamples, {
      limit: 50,
      genre: selectedGenre,
      category: selectedCategory,
      searchQuery: searchTerm,
    }) || [];

  // Get samples from packs (new system)
  // @ts-ignore TS2589 - Type instantiation is excessively deep
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const packSamples: any =
    useQuery(api.packSamples.getSamplesFromPacks, {
      limit: 50,
      genre: selectedGenre,
    }) || [];

  // Combine legacy samples + pack samples
  const samples = [...legacySamples, ...packSamples];

  // Get all published digital products (packs are now in digitalProducts table)
  // @ts-ignore TS2589 - Type instantiation is excessively deep
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allPublishedProducts: any = useQuery(api.digitalProducts.getAllPublishedProducts) || [];

  // Filter for pack products only (sample-pack, midi-pack, preset-pack)
  const packs = allPublishedProducts.filter(
    (p: any) =>
      p.productCategory === "sample-pack" ||
      p.productCategory === "midi-pack" ||
      p.productCategory === "preset-pack"
  );

  const userCredits = useQuery(api.credits.getUserCredits);

  // Get user's library/purchases to check ownership
  // @ts-ignore TS2589
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userLibrary: any = useQuery(
    api.library.getUserPurchases,
    isSignedIn && userId ? { userId } : "skip"
  );

  // Create ownership lookup map for fast checking
  const ownedProductIds = new Set(
    userLibrary?.map((purchase: any) => purchase.productId).filter(Boolean) || []
  );
  const ownedPackIds = new Set(
    packs.filter((pack: any) => ownedProductIds.has(pack._id)).map((p: any) => p._id)
  );

  // Helper to check if user owns a sample
  const userOwnsSample = (sample: any) => {
    // Check if it's a pack sample and user owns the pack
    if (sample.packId) {
      return ownedPackIds.has(sample.packId);
    }
    // For individual samples, check if they own it directly
    return ownedProductIds.has(sample._id);
  };

  // Mutations
  const purchaseSample = useMutation(api.samples.purchaseSample);
  const purchaseOldPack = useMutation(api.samplePacks.purchasePack);
  const purchaseDigitalPack = useMutation(api.samplePacks.purchaseDigitalPack);
  const toggleFavorite = useMutation(api.samples.toggleFavorite);

  // Audio player
  const handlePlayPause = (sample: any) => {
    if (playingSample?._id === sample._id && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (audioRef.current) {
        audioRef.current.src = sample.fileUrl;
        audioRef.current.play();
        setPlayingSample(sample);
        setIsPlaying(true);
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

  const handlePurchase = async () => {
    if (!selectedForPurchase) return;

    try {
      if (selectedForPurchase.type === "pack") {
        // All packs are now in digitalProducts table
        const result = await purchaseDigitalPack({ packId: selectedForPurchase._id as any });

        setPurchaseModalOpen(false);

        if (result.alreadyOwned) {
          // User already owns it - show toast with library link
          toast.success(result.message, {
            duration: 5000,
            action: {
              label: "Open Library",
              onClick: () => router.push("/library"),
            },
          });
        } else {
          // Successful purchase - show toast with library link
          toast.success(result.message, {
            duration: 5000,
            action: {
              label: "View Downloads",
              onClick: () => router.push("/library"),
            },
          });
        }
      } else {
        const result = await purchaseSample({ sampleId: selectedForPurchase._id });
        setPurchaseModalOpen(false);
        toast.success("Sample purchased successfully!", {
          duration: 5000,
          action: {
            label: "View Library",
            onClick: () => router.push("/library"),
          },
        });
      }
    } catch (error: any) {
      toast.error(error.message || "Purchase failed");
    }
  };

  const openPurchaseModal = (item: any, type: "sample" | "pack") => {
    // If this is a pack sample (has packId), redirect to buying the pack
    if (type === "sample" && item.packId) {
      setSelectedForPurchase({
        _id: item.packId,
        title: item.packTitle,
        price: item.price || item.creditPrice,
        creditPrice: item.creditPrice || item.price,
        type: "pack",
      });
    } else {
      setSelectedForPurchase({ ...item, type });
    }
    setPurchaseModalOpen(true);
  };

  const handleToggleFavorite = async (sampleId: Id<"audioSamples">) => {
    try {
      await toggleFavorite({ sampleId });
    } catch (error) {
      toast.error("Failed to update favorites");
    }
  };

  const activeFiltersCount = [selectedGenre, selectedCategory, searchTerm].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar - Same as homepage */}
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-chart-1 to-chart-2">
                <Music className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">PPR Academy</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden items-center gap-6 md:flex">
              <Link
                href="/marketplace"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Marketplace
              </Link>
              <Link
                href="/marketplace/samples"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Samples
              </Link>
              <Link
                href="/marketplace/creators"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Creators
              </Link>
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden items-center gap-3 md:flex">
              {isSignedIn ? (
                <>
                  <Link href="/library">
                    <Button variant="ghost" size="sm">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Library
                    </Button>
                  </Link>
                  <Link href="/home">
                    <Button size="sm" className="bg-gradient-to-r from-chart-1 to-chart-2">
                      Dashboard
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/sign-in">
                    <Button variant="ghost" size="sm">
                      Sign In
                    </Button>
                  </Link>
                  <SignUpButton mode="modal">
                    <Button size="sm" className="bg-gradient-to-r from-chart-1 to-chart-2">
                      Get Started
                    </Button>
                  </SignUpButton>
                </>
              )}
            </div>

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-white dark:bg-black">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Music className="h-5 w-5 text-chart-1" />
                    Menu
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-8 flex flex-col gap-4">
                  {/* Navigation Links */}
                  <Link href="/marketplace" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      <Search className="mr-3 h-4 w-4" />
                      Marketplace
                    </Button>
                  </Link>
                  <Link href="/marketplace/samples" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      <Music className="mr-3 h-4 w-4" />
                      Samples
                    </Button>
                  </Link>
                  <Link href="/marketplace/creators" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      <Users className="mr-3 h-4 w-4" />
                      Creators
                    </Button>
                  </Link>

                  <div className="my-4 border-t border-border"></div>

                  {/* Auth Actions */}
                  {isSignedIn ? (
                    <>
                      <Link href="/library" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start">
                          <BookOpen className="mr-3 h-4 w-4" />
                          My Library
                        </Button>
                      </Link>
                      <Link href="/home" onClick={() => setMobileMenuOpen(false)}>
                        <Button className="w-full bg-gradient-to-r from-chart-1 to-chart-2">
                          <Store className="mr-2 h-4 w-4" />
                          Dashboard
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/sign-in" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full">
                          Sign In
                        </Button>
                      </Link>
                      <SignUpButton mode="modal">
                        <Button className="w-full bg-gradient-to-r from-chart-1 to-chart-2">
                          Get Started Free
                        </Button>
                      </SignUpButton>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* Hidden audio element */}
      <audio ref={audioRef} />

      {/* Header */}
      <section className="border-b border-border bg-card/50 pt-16 backdrop-blur-sm">
        {/* pt-16 for navbar spacing */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 space-y-4 text-center">
            <motion.h1
              className="bg-gradient-to-r from-chart-1 to-chart-4 bg-clip-text text-4xl font-bold text-transparent md:text-5xl"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Samples & Packs
            </motion.h1>
            <motion.p
              className="text-xl text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              Professional samples and presets for music production
            </motion.p>
          </div>

          {/* Credits Balance */}
          {userCredits && (
            <motion.div
              className="mb-6 flex items-center justify-center gap-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-chart-1/20 bg-gradient-to-r from-chart-1/10 to-chart-2/10">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="rounded-lg bg-chart-1/20 p-2">
                    <Package className="h-5 w-5 text-chart-1" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Your Credits</div>
                    <div className="text-2xl font-bold text-chart-1">{userCredits.balance}</div>
                  </div>
                  <Link href="/credits/purchase">
                    <Button size="sm" variant="outline">
                      Buy Credits
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Search */}
          <div className="relative mx-auto max-w-2xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search samples, packs, creators..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 border-border bg-background pl-12 pr-4 text-base"
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
          <TabsList className="mb-6 bg-white dark:bg-black">
            <TabsTrigger value="samples" className="gap-2">
              <Music className="h-4 w-4" />
              Individual Samples ({samples.length})
            </TabsTrigger>
            <TabsTrigger value="packs" className="gap-2">
              <Package className="h-4 w-4" />
              Sample Packs ({packs.length})
            </TabsTrigger>
          </TabsList>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            {/* Filters Sidebar */}
            <aside className="lg:col-span-1">
              <Card className="sticky top-4 border-border bg-card">
                <CardContent className="space-y-6 p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="flex items-center gap-2 font-semibold">
                      <Filter className="h-5 w-5" />
                      Filters
                    </h3>
                    {activeFiltersCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSearchTerm("");
                          setSelectedGenre(undefined);
                          setSelectedCategory(undefined);
                        }}
                        className="text-xs"
                      >
                        Clear ({activeFiltersCount})
                      </Button>
                    )}
                  </div>

                  {/* Genre Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Genre</Label>
                    <Select
                      value={selectedGenre || "all"}
                      onValueChange={(v) => setSelectedGenre(v === "all" ? undefined : v)}
                    >
                      <SelectTrigger className="bg-white dark:bg-black">
                        <SelectValue placeholder="All Genres" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-black">
                        <SelectItem value="all">All Genres</SelectItem>
                        {GENRES.map((genre) => (
                          <SelectItem key={genre} value={genre}>
                            {genre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Category Filter */}
                  {activeTab === "samples" && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Category</Label>
                      <Select
                        value={selectedCategory || "all"}
                        onValueChange={(v) => setSelectedCategory(v === "all" ? undefined : v)}
                      >
                        <SelectTrigger className="bg-white dark:bg-black">
                          <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-black">
                          <SelectItem value="all">All Categories</SelectItem>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Sort */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Sort By</Label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="bg-white dark:bg-black">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-black">
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="popular">Most Popular</SelectItem>
                        <SelectItem value="price-low">Price: Low to High</SelectItem>
                        <SelectItem value="price-high">Price: High to Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </aside>

            {/* Main Content */}
            <div className="space-y-6 lg:col-span-3">
              {/* Toolbar */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">
                    {activeTab === "samples" ? "Individual Samples" : "Sample Packs"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {activeTab === "samples" ? samples.length : packs.length} results
                  </p>
                </div>

                {/* View Toggle */}
                <div className="flex rounded-lg border border-border">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="rounded-r-none"
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="rounded-l-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <TabsContent value="samples" className="mt-0">
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {samples.map((sample: any, index: number) => (
                      <SampleCard
                        key={sample._id}
                        sample={sample}
                        index={index}
                        isPlaying={playingSample?._id === sample._id && isPlaying}
                        onPlayPause={handlePlayPause}
                        onPurchase={() => openPurchaseModal(sample, "sample")}
                        onToggleFavorite={() => handleToggleFavorite(sample._id)}
                        isOwned={userOwnsSample(sample)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {samples.map((sample: any, index: number) => (
                      <SampleListItem
                        key={sample._id}
                        sample={sample}
                        index={index}
                        isPlaying={playingSample?._id === sample._id && isPlaying}
                        onPlayPause={handlePlayPause}
                        onPurchase={() => openPurchaseModal(sample, "sample")}
                        isOwned={userOwnsSample(sample)}
                      />
                    ))}
                  </div>
                )}

                {samples.length === 0 && (
                  <Card className="p-12 text-center">
                    <Music className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                    <h3 className="mb-2 text-xl font-semibold">No samples found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your filters or search terms
                    </p>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="packs" className="mt-0">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {packs.map((pack: any, index: number) => (
                    <PackCard
                      key={pack._id}
                      pack={pack}
                      index={index}
                      onPurchase={() => openPurchaseModal(pack, "pack")}
                      isOwned={ownedProductIds.has(pack._id)}
                    />
                  ))}
                </div>

                {packs.length === 0 && (
                  <Card className="p-12 text-center">
                    <Package className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                    <h3 className="mb-2 text-xl font-semibold">No packs found</h3>
                    <p className="text-muted-foreground">Check back soon for new sample packs</p>
                  </Card>
                )}
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>

      {/* Purchase Modal */}
      <Dialog open={purchaseModalOpen} onOpenChange={setPurchaseModalOpen}>
        <DialogContent className="bg-white dark:bg-black">
          {selectedForPurchase && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {selectedForPurchase.type === "pack" ? "Purchase Pack" : "Purchase Sample"}
                </DialogTitle>
                <DialogDescription>
                  {selectedForPurchase.title || selectedForPurchase.name}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="rounded-lg bg-muted/50 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Price</span>
                    <span className="text-2xl font-bold text-chart-1">
                      {selectedForPurchase.creditPrice || selectedForPurchase.price} credits
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Your Balance</span>
                    <span className="font-semibold">{userCredits?.balance || 0} credits</span>
                  </div>
                </div>

                {userCredits &&
                userCredits.balance <
                  (selectedForPurchase.creditPrice || selectedForPurchase.price) ? (
                  <div className="space-y-3">
                    <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3">
                      <p className="text-sm text-destructive">
                        Insufficient credits. You need{" "}
                        {(selectedForPurchase.creditPrice || selectedForPurchase.price) -
                          userCredits.balance}{" "}
                        more credits.
                      </p>
                    </div>
                    <Link href="/credits/purchase">
                      <Button className="w-full" size="lg">
                        Buy Credits
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <Button className="w-full" size="lg" onClick={handlePurchase}>
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Purchase Now
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Sample Card Component
function SampleCard({
  sample,
  index,
  isPlaying,
  onPlayPause,
  onPurchase,
  onToggleFavorite,
  isOwned,
}: any) {
  const handleDownload = async () => {
    try {
      // Fetch the file from Convex storage
      const response = await fetch(sample.fileUrl);
      const blob = await response.blob();

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Use fileName if available, otherwise construct from title
      // Check if title/fileName already has extension to avoid duplication
      let filename = sample.fileName || sample.title;
      if (filename && !filename.match(/\.(wav|mp3|flac|aiff)$/i)) {
        filename = `${filename}.${sample.format || "wav"}`;
      }
      link.download = filename;

      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Download started!");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Download failed. Please try again.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="border-border bg-card transition-all duration-300 hover:shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Play Button */}
            <Button
              size="icon"
              variant={isPlaying ? "default" : "outline"}
              className="h-12 w-12 flex-shrink-0 rounded-full"
              onClick={() => onPlayPause(sample)}
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>

            {/* Sample Info */}
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold">{sample.title}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{sample.genre}</span>
                <span>•</span>
                <span>{sample.category}</span>
                {sample.bpm && (
                  <>
                    <span>•</span>
                    <span>{sample.bpm} BPM</span>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button size="icon" variant="ghost" onClick={() => onToggleFavorite()}>
                <Heart className="h-4 w-4" />
              </Button>
              <ReportButton
                contentId={sample._id}
                contentType="sample"
                contentTitle={sample.title}
                creatorName={sample.creatorName}
                variant="icon"
              />
              {isOwned ? (
                <Button
                  size="sm"
                  onClick={handleDownload}
                  className="gap-1 bg-green-600 hover:bg-green-700"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              ) : (
                <Button size="sm" onClick={onPurchase} className="gap-1">
                  {sample.creditPrice} <Package className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Waveform placeholder */}
          {isPlaying && (
            <div className="mt-3 flex h-12 items-center justify-center rounded-lg bg-gradient-to-r from-chart-1/20 via-chart-1/40 to-chart-1/20">
              <Waves className="h-6 w-6 animate-pulse text-chart-1" />
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Sample List Item Component
function SampleListItem({ sample, index, isPlaying, onPlayPause, onPurchase, isOwned }: any) {
  const handleDownload = async () => {
    try {
      // Fetch the file from Convex storage
      const response = await fetch(sample.fileUrl);
      const blob = await response.blob();

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Use fileName if available, otherwise construct from title
      // Check if title/fileName already has extension to avoid duplication
      let filename = sample.fileName || sample.title;
      if (filename && !filename.match(/\.(wav|mp3|flac|aiff)$/i)) {
        filename = `${filename}.${sample.format || "wav"}`;
      }
      link.download = filename;

      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Download started!");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Download failed. Please try again.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
    >
      <Card className="border-border bg-card transition-colors hover:bg-muted/30">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant={isPlaying ? "default" : "ghost"}
              onClick={() => onPlayPause(sample)}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Music className="h-5 w-5 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{sample.title}</div>
            </div>
            <Badge variant="secondary">{sample.genre}</Badge>
            <Badge variant="outline">{sample.category}</Badge>
            {sample.bpm && <Badge variant="outline">{sample.bpm} BPM</Badge>}
            {isOwned ? (
              <Button
                size="sm"
                onClick={handleDownload}
                className="gap-1 bg-green-600 hover:bg-green-700"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            ) : (
              <Button size="sm" onClick={onPurchase}>
                {sample.creditPrice} credits
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Pack Card Component
function PackCard({ pack, index, onPurchase, isOwned }: any) {
  const router = useRouter();

  const handleViewPack = () => {
    // Navigate to library to view/download pack
    router.push("/library?filter=packs");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="group cursor-pointer overflow-hidden border-border bg-card transition-all duration-300 hover:shadow-xl">
        {/* Cover Image */}
        <div className="relative h-48 bg-gradient-to-br from-chart-1/20 to-chart-4/20">
          {pack.imageUrl && (
            <Image
              src={pack.imageUrl}
              alt={pack.title}
              width={400}
              height={192}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <Badge className="bg-chart-1 text-primary-foreground">
              {pack.sampleCount || JSON.parse(pack.packFiles || "[]").length} Samples
            </Badge>
            {isOwned && <Badge className="bg-green-600 text-white">✓ Owned</Badge>}
          </div>

          <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
            <ReportButton
              contentId={pack._id}
              contentType="product"
              contentTitle={pack.title}
              creatorName={pack.creatorName}
              variant="icon"
            />
          </div>
        </div>

        <CardContent className="space-y-4 p-6">
          <div>
            <h3 className="line-clamp-1 text-lg font-bold transition-colors group-hover:text-chart-1">
              {pack.title}
            </h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{pack.description}</p>
          </div>

          {/* Genres */}
          {pack.genres && pack.genres.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {pack.genres.slice(0, 3).map((genre: string) => (
                <Badge key={genre} variant="secondary" className="text-xs">
                  {genre}
                </Badge>
              ))}
            </div>
          )}

          {/* Creator */}
          {pack.creatorName && (
            <div className="flex items-center gap-2 border-t border-border pt-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={pack.creatorAvatar} />
                <AvatarFallback className="bg-gradient-to-r from-chart-1 to-chart-2 text-xs text-primary-foreground">
                  {pack.creatorName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">{pack.creatorName}</span>
            </div>
          )}

          {/* Purchase or Download */}
          <div className="flex items-center justify-between pt-2">
            {isOwned ? (
              <>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  In Your Library
                </span>
                <Button onClick={handleViewPack} className="gap-2 bg-green-600 hover:bg-green-700">
                  <Download className="h-4 w-4" />
                  View & Download
                </Button>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-chart-1">{pack.price} credits</div>
                <Button onClick={onPurchase} className="gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Buy Pack
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Label component
function Label({ children, className = "", ...props }: any) {
  return (
    <label className={`text-sm font-medium ${className}`} {...props}>
      {children}
    </label>
  );
}

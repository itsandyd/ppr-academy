"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const GENRES = [
  "Hip Hop", "Trap", "R&B", "Pop", "Electronic", "House", "Techno",
  "Drum & Bass", "Dubstep", "Lo-Fi", "Ambient", "Indie", "Rock", "Jazz"
];

const CATEGORIES = [
  "drums", "bass", "synth", "vocals", "fx", "melody", "loops", "one-shots"
];

export default function SamplesMarketplacePage() {
  const { isSignedIn } = useAuth();
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
  const legacySamples = useQuery(api.samples.getPublishedSamples, {
    limit: 50,
    genre: selectedGenre,
    category: selectedCategory,
    searchQuery: searchTerm,
  }) || [];
  
  // Get samples from packs (new system)
  // @ts-ignore TS2589 - Type instantiation is excessively deep
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const packSamples: any = useQuery(api.packSamples.getSamplesFromPacks, {
    limit: 50,
    genre: selectedGenre,
  }) || [];
  
  // Combine legacy samples + pack samples
  const samples = [...legacySamples, ...packSamples];

  // Get all published digital products (packs are now in digitalProducts table)
  // @ts-ignore TS2589 - Type instantiation is excessively deep
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allPublishedProducts: any = useQuery(api.digitalProducts.getAllPublishedProducts) || [];
  
  // Debug logging
  console.log("All published products:", allPublishedProducts.length);
  console.log("Product categories:", allPublishedProducts.map((p: any) => p.productCategory));
  
  // Filter for pack products only (sample-pack, midi-pack, preset-pack)
  const packs = allPublishedProducts.filter((p: any) => 
    p.productCategory === "sample-pack" || 
    p.productCategory === "midi-pack" || 
    p.productCategory === "preset-pack"
  );
  
  console.log("Filtered packs:", packs.length, packs);
  
  const userCredits = useQuery(api.credits.getUserCredits);

  // Mutations
  const purchaseSample = useMutation(api.samples.purchaseSample);
  const purchasePack = useMutation(api.samplePacks.purchasePack);
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
        const result = await purchasePack({ packId: selectedForPurchase._id });
        toast.success(result.message);
      } else {
        const result = await purchaseSample({ sampleId: selectedForPurchase._id });
        toast.success("Sample purchased successfully!");
      }
      setPurchaseModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Purchase failed");
    }
  };

  const openPurchaseModal = (item: any, type: "sample" | "pack") => {
    setSelectedForPurchase({ ...item, type });
    setPurchaseModalOpen(true);
  };

  const handleToggleFavorite = async (sampleId: Id<"audioSamples">) => {
    try {
      await toggleFavorite({ sampleId });
    } catch (error) {
      toast.error("Failed to update favorites");
    }
  };

  const activeFiltersCount = [
    selectedGenre,
    selectedCategory,
    searchTerm,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar - Same as homepage */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-chart-1 to-chart-2 rounded-lg flex items-center justify-center">
                <Music className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">PPR Academy</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
              <Link href="/marketplace" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Marketplace
              </Link>
              <Link href="/marketplace/samples" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Samples
              </Link>
              <Link href="/marketplace/creators" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Creators
              </Link>
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              {isSignedIn ? (
                <>
                  <Link href="/library">
                    <Button variant="ghost" size="sm">
                      <BookOpen className="w-4 h-4 mr-2" />
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
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-white dark:bg-black">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Music className="w-5 h-5 text-chart-1" />
                    Menu
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-8">
                  {/* Navigation Links */}
                  <Link href="/marketplace" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      <Search className="w-4 h-4 mr-3" />
                      Marketplace
                    </Button>
                  </Link>
                  <Link href="/marketplace/samples" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      <Music className="w-4 h-4 mr-3" />
                      Samples
                    </Button>
                  </Link>
                  <Link href="/marketplace/creators" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      <Users className="w-4 h-4 mr-3" />
                      Creators
                    </Button>
                  </Link>
                  
                  <div className="border-t border-border my-4"></div>
                  
                  {/* Auth Actions */}
                  {isSignedIn ? (
                    <>
                      <Link href="/library" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start">
                          <BookOpen className="w-4 h-4 mr-3" />
                          My Library
                        </Button>
                      </Link>
                      <Link href="/home" onClick={() => setMobileMenuOpen(false)}>
                        <Button className="w-full bg-gradient-to-r from-chart-1 to-chart-2">
                          <Store className="w-4 h-4 mr-2" />
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
      <section className="border-b border-border bg-card/50 backdrop-blur-sm pt-16">{/* pt-16 for navbar spacing */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center space-y-4 mb-6">
            <motion.h1 
              className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-chart-1 to-chart-4 bg-clip-text text-transparent"
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
              className="flex items-center justify-center gap-2 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-gradient-to-r from-chart-1/10 to-chart-2/10 border-chart-1/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 bg-chart-1/20 rounded-lg">
                    <Package className="w-5 h-5 text-chart-1" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Your Credits</div>
                    <div className="text-2xl font-bold text-chart-1">
                      {userCredits.balance}
                    </div>
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
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search samples, packs, creators..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 h-12 text-base bg-background border-border"
            />
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
          <TabsList className="bg-white dark:bg-black mb-6">
            <TabsTrigger value="samples" className="gap-2">
              <Music className="w-4 h-4" />
              Individual Samples ({samples.length})
            </TabsTrigger>
            <TabsTrigger value="packs" className="gap-2">
              <Package className="w-4 h-4" />
              Sample Packs ({packs.length})
            </TabsTrigger>
          </TabsList>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1">
            <Card className="bg-card border-border sticky top-4">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Filter className="w-5 h-5" />
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
          <div className="lg:col-span-3 space-y-6">
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
              <div className="flex border border-border rounded-lg">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <TabsContent value="samples" className="mt-0">
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {samples.map((sample: any, index: number) => (
                    <SampleCard
                      key={sample._id}
                      sample={sample}
                      index={index}
                      isPlaying={playingSample?._id === sample._id && isPlaying}
                      onPlayPause={handlePlayPause}
                      onPurchase={() => openPurchaseModal(sample, "sample")}
                      onToggleFavorite={() => handleToggleFavorite(sample._id)}
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
                    />
                  ))}
                </div>
              )}

              {samples.length === 0 && (
                <Card className="p-12 text-center">
                  <Music className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No samples found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your filters or search terms
                  </p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="packs" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {packs.map((pack: any, index: number) => (
                  <PackCard
                    key={pack._id}
                    pack={pack}
                    index={index}
                    onPurchase={() => openPurchaseModal(pack, "pack")}
                  />
                ))}
              </div>

              {packs.length === 0 && (
                <Card className="p-12 text-center">
                  <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No packs found</h3>
                  <p className="text-muted-foreground">
                    Check back soon for new sample packs
                  </p>
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
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Price</span>
                    <span className="text-2xl font-bold text-chart-1">
                      {selectedForPurchase.creditPrice || selectedForPurchase.price} credits
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Your Balance</span>
                    <span className="font-semibold">
                      {userCredits?.balance || 0} credits
                    </span>
                  </div>
                </div>

                {userCredits && userCredits.balance < (selectedForPurchase.creditPrice || selectedForPurchase.price) ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <p className="text-sm text-destructive">
                        Insufficient credits. You need {(selectedForPurchase.creditPrice || selectedForPurchase.price) - userCredits.balance} more credits.
                      </p>
                    </div>
                    <Link href="/credits/purchase">
                      <Button className="w-full" size="lg">
                        Buy Credits
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handlePurchase}
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
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
function SampleCard({ sample, index, isPlaying, onPlayPause, onPurchase, onToggleFavorite }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="hover:shadow-lg transition-all duration-300 border-border bg-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Play Button */}
            <Button
              size="icon"
              variant={isPlaying ? "default" : "outline"}
              className="w-12 h-12 rounded-full flex-shrink-0"
              onClick={() => onPlayPause(sample)}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </Button>

            {/* Sample Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{sample.title}</h3>
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
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onToggleFavorite()}
              >
                <Heart className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                onClick={onPurchase}
                className="gap-1"
              >
                {sample.creditPrice} <Package className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Waveform placeholder */}
          {isPlaying && (
            <div className="mt-3 h-12 bg-gradient-to-r from-chart-1/20 via-chart-1/40 to-chart-1/20 rounded-lg flex items-center justify-center">
              <Waves className="w-6 h-6 text-chart-1 animate-pulse" />
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Sample List Item Component
function SampleListItem({ sample, index, isPlaying, onPlayPause, onPurchase }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
    >
      <Card className="hover:bg-muted/30 transition-colors border-border bg-card">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant={isPlaying ? "default" : "ghost"}
              onClick={() => onPlayPause(sample)}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Music className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{sample.title}</div>
            </div>
            <Badge variant="secondary">{sample.genre}</Badge>
            <Badge variant="outline">{sample.category}</Badge>
            {sample.bpm && <Badge variant="outline">{sample.bpm} BPM</Badge>}
            <Button size="sm" onClick={onPurchase}>
              {sample.creditPrice} credits
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Pack Card Component
function PackCard({ pack, index, onPurchase }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-border bg-card group cursor-pointer">
        {/* Cover Image */}
        <div className="relative h-48 bg-gradient-to-br from-chart-1/20 to-chart-4/20">
          {pack.imageUrl && (
            <Image
              src={pack.imageUrl}
              alt={pack.title}
              width={400}
              height={192}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          <div className="absolute bottom-3 left-3 right-3">
            <Badge className="bg-chart-1 text-primary-foreground">
              {pack.sampleCount} Samples
            </Badge>
          </div>
        </div>

        <CardContent className="p-6 space-y-4">
          <div>
            <h3 className="font-bold text-lg line-clamp-1 group-hover:text-chart-1 transition-colors">
              {pack.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {pack.description}
            </p>
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
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <Avatar className="w-6 h-6">
                <AvatarImage src={pack.creatorAvatar} />
                <AvatarFallback className="text-xs bg-gradient-to-r from-chart-1 to-chart-2 text-primary-foreground">
                  {pack.creatorName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">{pack.creatorName}</span>
            </div>
          )}

          {/* Purchase */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-2xl font-bold text-chart-1">
              {pack.price} credits
            </div>
            <Button onClick={onPurchase} className="gap-2">
              <ShoppingCart className="w-4 h-4" />
              Buy Pack
            </Button>
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


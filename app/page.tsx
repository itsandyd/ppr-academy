// @ts-nocheck - Bypassing deep type instantiation errors with large Convex API
"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/lib/convex-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { 
  Music, 
  BookOpen, 
  Package, 
  Users, 
  CheckCircle, 
  Zap,
  Play,
  Search,
  Store,
  Upload,
  DollarSign,
  BarChart3,
  MessageCircle,
  ArrowRight,
  Menu,
} from "lucide-react";
import Link from "next/link";
import { SignUpButton, useAuth } from "@clerk/nextjs";
import { Footer } from "./_components/footer";
import { HomepageStructuredData } from "./_components/HomepageStructuredData";
import { motion } from "framer-motion";
import { MarketplaceGrid } from "./_components/marketplace-grid";

// Force dynamic rendering to avoid build-time Clerk issues
export const dynamic = 'force-dynamic';

export default function SectionedMarketplace() {
  const { isSignedIn } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch data
  const courses = useQuery(api.courses.getAllPublishedCourses) || [];
  const products = useQuery(api.digitalProducts.getAllPublishedProducts) || [];
  const samplePacks = useQuery(api.samplePacks?.getAllPublishedSamplePacks) || [];
  const platformStats = useQuery(api.marketplace?.getPlatformStats);
  const featuredCreators = useQuery(api.marketplace?.getAllCreators, { limit: 6 }) || [];

  // Transform data to include contentType
  const coursesWithType = useMemo(() => 
    courses.map((c: any) => ({ ...c, contentType: 'course' as const })),
    [courses]
  );

  const productsWithType = useMemo(() => 
    products.map((p: any) => ({ ...p, contentType: 'product' as const })),
    [products]
  );

  const samplePacksWithType = useMemo(() => 
    samplePacks.map((sp: any) => ({ ...sp, contentType: 'sample-pack' as const })),
    [samplePacks]
  );

  // Combine all content
  const allContent = useMemo(() => 
    [...coursesWithType, ...productsWithType, ...samplePacksWithType],
    [coursesWithType, productsWithType, samplePacksWithType]
  );

  // Filter by search term
  const filteredContent = useMemo(() => {
    if (!searchTerm) return allContent;
    const searchLower = searchTerm.toLowerCase();
    return allContent.filter((item: any) =>
      item.title?.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower) ||
      item.creatorName?.toLowerCase().includes(searchLower)
    );
  }, [allContent, searchTerm]);

  // Stats with defaults
  const stats = {
    totalCreators: platformStats?.totalCreators || 0,
    totalCourses: courses.length,
    totalProducts: products.length + samplePacks.length,
    totalStudents: platformStats?.totalStudents || 0,
  };

  const isSearching = searchTerm.length > 0;

  const studentSteps = [
    {
      icon: Search,
      title: "Discover",
      description: "Browse courses, sample packs, and digital products from top music creators.",
    },
    {
      icon: BookOpen,
      title: "Learn",
      description: "Enroll in expert-led courses and access premium content to level up your skills.",
    },
    {
      icon: Play,
      title: "Create",
      description: "Apply what you learn and start producing professional-quality music.",
    },
  ];

  const creatorSteps = [
    {
      icon: Store,
      title: "Build Your Store",
      description: "Create your custom storefront in minutes with your brand and style.",
    },
    {
      icon: Upload,
      title: "Share Your Knowledge",
      description: "Upload courses, sample packs, presets, and other digital products.",
    },
    {
      icon: DollarSign,
      title: "Earn Revenue",
      description: "Get paid directly when students purchase your content. Keep 90% of sales.",
    },
  ];

  const features = [
    {
      icon: Users,
      title: "Smart Connections",
      description: "Connect with the right creators and students through intelligent matching.",
    },
    {
      icon: Zap,
      title: "AI-Powered Tools",
      description: "Leverage AI to create better content and personalize learning experiences.",
    },
    {
      icon: CheckCircle,
      title: "Verified Community",
      description: "Join a trusted network of music professionals and serious learners.",
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Track your progress, sales, and engagement with detailed insights.",
    },
    {
      icon: Music,
      title: "Content Library",
      description: "Access and organize all your courses, products, and resources in one place.",
    },
    {
      icon: MessageCircle,
      title: "Direct Communication",
      description: "Connect with creators and students through built-in messaging.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Structured Data for SEO */}
      <HomepageStructuredData />
      
      {/* Navigation Bar */}
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

      {/* Fixed background elements */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full filter blur-3xl animate-float bg-chart-1/10"></div>
        <div className="absolute bottom-1/3 left-1/3 w-96 h-96 rounded-full filter blur-3xl animate-float-slow bg-chart-4/10" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-2/3 right-1/3 w-64 h-64 rounded-full filter blur-3xl animate-float-slow bg-chart-3/10" style={{ animationDelay: '4s' }}></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.05)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-7xl mx-auto relative">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <motion.div 
                className="inline-flex items-center px-3 py-1.5 rounded-full bg-chart-1/10 text-chart-1 text-sm font-medium mb-6 backdrop-blur-sm border border-chart-1/20"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Music className="h-4 w-4 mr-2" />
                Where Music Creators & Students Connect
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="tracking-tight font-display"
              >
                <span className="block text-5xl font-bold sm:text-6xl drop-shadow-sm">
                  <span className="relative mt-1 block">
                    <span className="text-transparent relative bg-clip-text bg-gradient-to-r from-chart-1 to-chart-4">
                      Build and learn in one place
                    </span>
                  </span>
                </span>
              </motion.h1>
              
              <motion.p 
                className="mt-6 text-xl text-muted-foreground leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                PausePlayRepeat Academy connects music producers who want to grow with creators who teach, share, and sell what they've learned.
              </motion.p>
              
              <div className="mt-10 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0">
                <motion.div 
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  {isSignedIn ? (
                    <>
                      <Link href="/library">
                        <Button className="w-full py-6 text-lg shadow-md shadow-chart-1/20 hover:shadow-lg hover:scale-105 hover:-translate-y-1 transition-all duration-300 bg-gradient-to-r from-chart-1 to-chart-1/80 text-primary-foreground border-2 border-chart-1/40">
                          <BookOpen className="mr-2 h-5 w-5" />
                          My Library
                        </Button>
                      </Link>
                      <Link href="/home">
                        <Button variant="outline" className="w-full py-6 text-lg hover:scale-105 hover:-translate-y-1 transition-all duration-300 border-2 border-chart-1/40 bg-background/80 hover:bg-background/90 hover:shadow-lg">
                          <Store className="mr-2 h-5 w-5" />
                          Creator Dashboard
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                        <Link href="/sign-in">
                          <Button className="w-full py-6 text-base shadow-md shadow-chart-1/20 hover:shadow-lg hover:scale-105 hover:-translate-y-1 transition-all duration-300 bg-gradient-to-r from-chart-1 to-chart-1/80 text-primary-foreground border-2 border-chart-1/40">
                          Explore Courses and Tools
                          </Button>
                        </Link>
                        <Link href="/sign-up?intent=creator">
                          <Button variant="outline" className="w-full py-6 text-base hover:scale-105 hover:-translate-y-1 transition-all duration-300 border-2 border-chart-1/40 bg-background/80 hover:bg-background/90 hover:shadow-lg">
                          Start Free as a Creator
                          </Button>
                        </Link>
                    </>
                  )}
                </motion.div>
                
                <motion.div 
                  className="mt-8 flex items-center justify-center sm:justify-start"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <div className="flex -space-x-2">
                    {[...Array(4)].map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 border-background text-xs text-primary-foreground font-medium shadow-md ${
                          i % 2 === 0 
                          ? 'bg-gradient-to-br from-chart-1 to-chart-2' 
                          : 'bg-gradient-to-br from-chart-3 to-chart-4'
                        }`}
                      >
                        {String.fromCharCode(65 + i)}
                      </div>
                    ))}
                  </div>
                  <div className="ml-4">
                    <span className="text-sm font-medium">Join our growing community</span>
                    <p className="text-xs text-muted-foreground">{stats.totalCreators}+ creators • {stats.totalStudents || '2,000'}+ students</p>
                  </div>
                </motion.div>
              </div>
            </div>
            
            {/* Right Column - Visual */}
            <motion.div 
              className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
            >
              <div className="relative mx-auto w-full rounded-2xl shadow-2xl lg:max-w-xl overflow-hidden backdrop-blur-md border border-border bg-gradient-to-br from-chart-1/10 to-chart-4/10">
                <div className="aspect-video bg-gradient-to-br from-chart-1/20 to-chart-4/20 flex items-center justify-center p-12 relative overflow-hidden">
                  {/* Overlay Text */}
                  <div className="relative z-10 text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-chart-1 to-chart-2 rounded-2xl shadow-xl mb-4">
                      <Music className="w-10 h-10 text-primary-foreground" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground">
                      WHERE MUSIC CREATORS &
                      <span className="block">STUDENTS CONNECT</span>
                    </h3>
                    <div className="flex items-center justify-center gap-6 pt-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold bg-gradient-to-r from-chart-1 to-chart-2 bg-clip-text text-transparent">{stats.totalCourses}+</div>
                        <div className="text-xs text-muted-foreground">Courses</div>
                      </div>
                      <div className="w-px h-12 bg-border"></div>
                      <div className="text-center">
                        <div className="text-3xl font-bold bg-gradient-to-r from-chart-3 to-chart-4 bg-clip-text text-transparent">{stats.totalProducts}+</div>
                        <div className="text-xs text-muted-foreground">Products</div>
                      </div>
                      <div className="w-px h-12 bg-border"></div>
                      <div className="text-center">
                        <div className="text-3xl font-bold bg-gradient-to-r from-chart-4 to-chart-5 bg-clip-text text-transparent">{stats.totalCreators}+</div>
                        <div className="text-xs text-muted-foreground">Creators</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMSI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NGgyVjZoNFY0aC00ek02IDM0di00SDR2NEgwdjJoNHY0aDJ2LTRoNHYtMkg2ek02IDRWMEg0djRIMHYyaDR2NGgyVjZoNFY0SDZ6Ii8+PC9nPjwvZz48L3N2Zz4=')]"></div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      {isSearching && (
        <section className="relative py-12 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                  Search Results for "{searchTerm}"
                </h2>
                <p className="text-muted-foreground">
                Found {filteredContent.length} {filteredContent.length === 1 ? "result" : "results"}
              </p>
            </div>
            <MarketplaceGrid content={filteredContent.slice(0, 12)} />
            {filteredContent.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No results found. Try different keywords.</p>
                <Button onClick={() => setSearchTerm("")} variant="outline">Clear Search</Button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Creator Spotlight Section */}
      {!isSearching && featuredCreators.length > 0 && (
        <section className="relative py-24 z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-chart-1/5 via-transparent to-chart-4/5"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div 
              className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
              <h2 className="text-3xl leading-8 font-bold tracking-tight sm:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-chart-1 to-chart-4 mb-4">
                Discover real producers teaching what they know
              </h2>
              <p className="max-w-2xl text-lg text-muted-foreground mx-auto">
                Browse packs, presets, and lessons from independent producers building their brands on PausePlayRepeat.
            </p>
          </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCreators.slice(0, 6).map((creator: any, index: number) => (
              <motion.div 
                  key={creator._id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                        viewport={{ once: true }}
                      >
                  <Link href={`/${creator.slug}`}>
                    <Card className="group overflow-hidden border-border bg-card hover:shadow-2xl hover:shadow-black/10 dark:hover:shadow-white/5 transition-all duration-300 cursor-pointer hover:-translate-y-1">
                      {/* Banner */}
                      <div className="relative h-32 overflow-hidden">
                        {creator.bannerImage ? (
                          <div className="relative w-full h-full">
                            <img
                              src={creator.bannerImage}
                              alt={`${creator.name} banner`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-chart-1/20 via-chart-2/20 to-chart-3/20 dark:from-chart-1/30 dark:via-chart-2/30 dark:to-chart-3/30" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
                          </div>

                      <CardContent className="pb-6 px-6 -mt-10 relative z-10 space-y-3">
                        {/* Avatar */}
                        <div className="flex justify-center">
                          <Avatar className="w-20 h-20 border-4 border-card shadow-xl ring-2 ring-border">
                            <AvatarImage src={creator.avatar} />
                            <AvatarFallback className="text-xl bg-gradient-to-br from-chart-1 to-chart-2 text-primary-foreground">
                              {creator.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        
                        {/* Name & Bio */}
                        <div className="text-center">
                          <h3 className="font-bold text-lg group-hover:text-chart-1 transition-colors mb-1">
                            {creator.name}
                  </h3>
                          {creator.bio && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {creator.bio}
                            </p>
                          )}
                </div>
                
                        {/* Stats */}
                        <div className="flex items-center justify-center gap-4 pt-3 border-t border-border text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4" />
                            <span>{creator.totalCourses}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Package className="w-4 h-4" />
                            <span>{creator.totalProducts}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{creator.totalStudents}</span>
                        </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                      </motion.div>
                    ))}
                  </div>

          <motion.div 
              className="mt-12 text-center"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
          >
              <Link href="/marketplace/creators">
                <Button variant="outline" size="lg" className="group">
                  View All Creators
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
          </motion.div>
        </div>
      </section>
      )}

      {/* Feature Section (Framed for Both) */}
      <section id="how-it-works" className="relative py-24 z-10">
        <div className="absolute inset-0 backdrop-blur-sm bg-card/30"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-base text-chart-1 font-semibold tracking-wide uppercase">What You Can Do</h2>
            <p className="mt-2 text-3xl leading-8 font-bold tracking-tight sm:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-chart-1 to-chart-4">
              Learn, create, and grow together
            </p>
            <p className="mt-4 max-w-2xl text-xl text-muted-foreground mx-auto">
              Whether you're here to learn or to teach, this is your home base
            </p>
          </motion.div>

          <div className="mt-16 grid md:grid-cols-3 gap-8">
            {/* A. Learn from real producers */}
              <motion.div 
              className="bg-card/50 backdrop-blur-sm p-8 rounded-xl shadow-md border border-border hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
                viewport={{ once: true }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-chart-1 to-chart-2 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                <BookOpen className="w-8 h-8 text-primary-foreground" />
                  </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Learn from real producers</h3>
              <p className="text-muted-foreground leading-relaxed">
                Watch courses, download tools, and apply what you learn instantly in your DAW.
              </p>
              </motion.div>

            {/* B. Create and share your own */}
          <motion.div 
              className="bg-card/50 backdrop-blur-sm p-8 rounded-xl shadow-md border border-border hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
          >
              <div className="w-16 h-16 bg-gradient-to-br from-chart-3 to-chart-4 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                <Upload className="w-8 h-8 text-primary-foreground" />
            </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Create and share your own</h3>
              <p className="text-muted-foreground leading-relaxed">
                Turn your knowledge into income with a page that sells for you.
            </p>
          </motion.div>

            {/* C. Grow together */}
          <motion.div
              className="bg-card/50 backdrop-blur-sm p-8 rounded-xl shadow-md border border-border hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
              <div className="w-16 h-16 bg-gradient-to-br from-chart-4 to-chart-5 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                <Users className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Grow together</h3>
              <p className="text-muted-foreground leading-relaxed">
                Join a community of artists who learn, teach, and push each other forward.
              </p>
          </motion.div>
          </div>
        </div>
      </section>

      {/* What You Can Find Section (Explore the Academy Library) */}
      {!isSearching && allContent.length > 0 && (
        <section className="relative py-24 z-10">
          <div className="absolute inset-0 bg-card/50 backdrop-blur-sm"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <motion.div 
              className="text-center mb-12"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-foreground mb-4 bg-clip-text text-transparent bg-gradient-to-r from-chart-1 to-chart-4">
                Explore the Academy Library
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Courses, sound packs, and presets from producers around the world — new drops every week.
              </p>
            </motion.div>
            
            <MarketplaceGrid content={allContent.slice(0, 6)} />
            
            {allContent.length > 6 && (
              <motion.div 
                className="mt-12 text-center"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <Link href="/marketplace">
                  <Button variant="outline" size="lg" className="group">
                    Browse All Products
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </motion.div>
            )}
          </div>
        </section>
      )}

      {/* Final Gradient CTA Section */}
      <section className="relative py-32 z-10">
        <div className="absolute inset-0 backdrop-blur-sm bg-gradient-to-br from-chart-1 via-chart-2 to-chart-4"></div>
        
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full filter blur-3xl bg-primary-foreground"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full filter blur-3xl bg-primary-foreground"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            className="text-center space-y-10"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight">
                Whether you're learning or creating,
                <span className="block">this is your home base</span>
              </h2>
              <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto leading-relaxed">
                Join PausePlayRepeat Academy today and start building your skills or sharing your knowledge with the world. Start for free.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {!isSignedIn ? (
                <>
                  <SignUpButton mode="modal">
                    <Button 
                      size="lg" 
                      className="w-full sm:w-auto rounded-xl bg-background text-chart-1 hover:bg-background/90 font-bold px-12 py-6 text-xl shadow-2xl transition-all duration-300 hover:scale-105"
                    >
                      Start Learning Free
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </SignUpButton>
                  <Link href="/sign-up?intent=creator">
                    <Button 
                      variant="outline"
                      size="lg" 
                      className="w-full sm:w-auto rounded-xl border-2 border-primary-foreground bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-background font-semibold px-12 py-6 text-xl shadow-lg transition-all duration-300 hover:scale-105"
                    >
                      Become a Creator
                    </Button>
                  </Link>
                </>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/library">
                    <Button 
                      size="lg" 
                      className="w-full sm:w-auto rounded-xl bg-background text-chart-1 hover:bg-background/90 font-bold px-12 py-6 text-xl shadow-2xl transition-all duration-300 hover:scale-105"
                    >
                      <BookOpen className="mr-2 w-5 h-5" />
                      Student Library
                    </Button>
                  </Link>
                  <Link href="/home">
                    <Button 
                      variant="outline"
                      size="lg" 
                      className="w-full sm:w-auto rounded-xl border-2 border-primary-foreground bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-background font-semibold px-12 py-6 text-xl shadow-lg transition-all duration-300 hover:scale-105"
                    >
                      <Store className="mr-2 w-5 h-5" />
                      Creator Studio
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-primary-foreground/60 text-sm pt-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Free to browse</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>90% creator payout</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Money-back guarantee</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Start instantly</span>
              </div>
            </div>

            {/* Platform Stats */}
            <div className="border-t border-primary-foreground/20 pt-8 mt-10">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary-foreground">Expert</div>
                  <div className="text-sm text-primary-foreground/60">Quality Creators</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary-foreground">90%</div>
                  <div className="text-sm text-primary-foreground/60">Revenue Share</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary-foreground">Direct</div>
                  <div className="text-sm text-primary-foreground/60">Support</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary-foreground">Instant</div>
                  <div className="text-sm text-primary-foreground/60">Access</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>


      {/* Footer */}
      <Footer />
    </div>
  );
}


"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Music, 
  BookOpen, 
  Package, 
  Users, 
  CheckCircle, 
  TrendingUp,
  Zap,
  Play,
  Search,
  Store,
  Upload,
  DollarSign,
  Target,
  BarChart3,
  MessageCircle,
  Star,
  ArrowRight,
  ChevronDown,
  Menu,
  X
} from "lucide-react";
import Link from "next/link";
import { SignUpButton, useAuth } from "@clerk/nextjs";
import { Footer } from "./_components/footer";
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
  const samplePacks = useQuery(api.samplePacks?.getAllPublishedSamplePacks as any) || [];
  const platformStats = useQuery(api.marketplace?.getPlatformStats as any);

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
                  <span className="block bg-gradient-to-r from-[#1e293b] via-[#6b7280] to-[#1e293b] dark:from-[#e2e8f0] dark:via-[#9ca3af] dark:to-[#e2e8f0] bg-clip-text text-transparent">The Smart Way To</span>
                  <span className="relative mt-1 block">
                    <span className="text-transparent relative bg-clip-text bg-gradient-to-r from-chart-1 to-chart-4">
                      Learn Production & Sell Your Sound
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
                PPR Academy brings together music creators and students in one seamless platform. Learn from experts with personalized content, or build your own creator business.
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
                      <div className="space-y-2">
                        <Link href="/sign-in">
                          <Button className="w-full py-6 text-base shadow-md shadow-chart-1/20 hover:shadow-lg hover:scale-105 hover:-translate-y-1 transition-all duration-300 bg-gradient-to-r from-chart-1 to-chart-1/80 text-primary-foreground border-2 border-chart-1/40">
                            <BookOpen className="mr-2 h-5 w-5" />
                            For Students
                          </Button>
                        </Link>
                        <p className="text-xs text-muted-foreground mt-2 text-center">Learn & access content</p>
                      </div>
                      <div className="space-y-2">
                        <Link href="/sign-up?intent=creator">
                          <Button variant="outline" className="w-full py-6 text-base hover:scale-105 hover:-translate-y-1 transition-all duration-300 border-2 border-chart-1/40 bg-background/80 hover:bg-background/90 hover:shadow-lg">
                            <Store className="mr-2 h-5 w-5" />
                            For Creators
                          </Button>
                        </Link>
                        <p className="text-xs text-muted-foreground mt-2 text-center">Sell your content</p>
                      </div>
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

      {/* How It Works */}
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
            <h2 className="text-base text-chart-1 font-semibold tracking-wide uppercase">How It Works</h2>
            <p className="mt-2 text-3xl leading-8 font-bold tracking-tight sm:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-chart-1 to-chart-4">
              Connecting creativity with opportunity
            </p>
            <p className="mt-4 max-w-2xl text-xl text-muted-foreground mx-auto">
              Our platform streamlines music education and creator commerce for everyone
            </p>
          </motion.div>

          <div className="mt-16">
            <div className="flex flex-col lg:flex-row space-y-10 lg:space-y-0 lg:space-x-10">
              {/* For Students */}
              <motion.div 
                className="lg:w-1/2"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <div className="bg-chart-1/10 backdrop-blur-sm rounded-xl p-6 mb-10 border border-chart-1/20 shadow-md">
                  <h3 className="text-xl text-center font-bold text-chart-1 flex items-center justify-center">
                    <BookOpen className="mr-2 h-5 w-5" /> For Students
                  </h3>
                </div>
                
                <div className="relative">
                  <div className="absolute top-12 left-0 w-full border-t-2 border-dashed border-muted/30 z-0"></div>
                  
                  <div className="relative z-10 flex flex-col space-y-8">
                    {studentSteps.map((step, index) => (
                      <motion.div 
                        key={index}
                        className="bg-card/50 backdrop-blur-sm p-6 rounded-xl shadow-md border border-border hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 * index }}
                        viewport={{ once: true }}
                      >
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-chart-1/20 text-chart-1 font-bold text-lg border border-chart-1/20 shadow-inner">{index + 1}</div>
                          </div>
                          <div className="ml-5">
                            <h4 className="text-lg font-bold text-foreground">{step.title}</h4>
                            <p className="text-muted-foreground mt-2">{step.description}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
              
              {/* For Creators */}
              <motion.div 
                className="lg:w-1/2"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <div className="bg-chart-3/10 backdrop-blur-sm rounded-xl p-6 mb-10 border border-chart-3/20 shadow-md">
                  <h3 className="text-xl text-center font-bold text-chart-3 flex items-center justify-center">
                    <Store className="mr-2 h-5 w-5" /> For Creators
                  </h3>
                </div>
                
                <div className="relative">
                  <div className="absolute top-12 left-0 w-full border-t-2 border-dashed border-muted/30 z-0"></div>
                  
                  <div className="relative z-10 flex flex-col space-y-8">
                    {creatorSteps.map((step, index) => (
                      <motion.div 
                        key={index}
                        className="bg-card/50 backdrop-blur-sm p-6 rounded-xl shadow-md border border-border hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 * index }}
                        viewport={{ once: true }}
                      >
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-chart-3/20 text-chart-3 font-bold text-lg border border-chart-3/20 shadow-inner">{index + 1}</div>
                          </div>
                          <div className="ml-5">
                            <h4 className="text-lg font-bold text-foreground">{step.title}</h4>
                            <p className="text-muted-foreground mt-2">{step.description}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 z-10">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-base text-chart-1 font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-bold tracking-tight sm:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-chart-1 to-chart-4">
              Smart tools for both sides of music
            </p>
            <p className="mt-4 max-w-2xl text-xl text-muted-foreground mx-auto">
              PPR Academy combines powerful tools to create a platform where creators and students thrive together.
            </p>
          </motion.div>

          <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="p-6 bg-card border-border hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-chart-1 to-chart-2 rounded-xl flex items-center justify-center">
                      <feature.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative py-24 z-10">
        <div className="absolute inset-0 bg-card/50 backdrop-blur-sm"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-base text-chart-1 font-semibold tracking-wide uppercase">Testimonials</h2>
            <p className="mt-2 text-3xl leading-8 font-bold tracking-tight sm:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-chart-1 to-chart-4">
              What our community says
            </p>
            <p className="mt-4 max-w-2xl text-xl text-muted-foreground mx-auto">
              Join thousands of artists and students who are already transforming their music careers
            </p>
          </motion.div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                content: "PPR Academy completely transformed my approach to music production. I've learned more in 3 months than I did in years of trial and error.",
                author: "Alex Rivera",
                role: "Electronic Music Producer"
              },
              {
                content: "As a creator, this platform lets me focus on what I do best - teaching. The tools handle everything else seamlessly.",
                author: "Samantha Wright",
                role: "Course Creator"
              },
              {
                content: "The quality of courses and sample packs here is unmatched. Every purchase has been worth it and helped me level up my skills.",
                author: "Marcus Johnson",
                role: "Hip-Hop Producer"
              }
            ].map((testimonial, index) => (
              <motion.div 
                key={index}
                className="transform transition-all duration-500 hover:-translate-y-2"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                style={index === 1 ? { transform: 'translateY(2rem)' } : {}}
              >
                <Card className="h-full bg-card border-border backdrop-blur-sm p-6">
                  <div className="flex items-start gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-chart-5 text-chart-5" />
                    ))}
                  </div>
                  <p className="text-foreground mb-6 leading-relaxed">"{testimonial.content}"</p>
                  <div className="border-t border-border pt-4">
                    <p className="font-semibold text-foreground">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div 
            className="mt-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center space-x-2 bg-chart-1/10 px-5 py-3 rounded-full text-chart-1 text-sm border border-chart-1/20 backdrop-blur-sm">
              <TrendingUp className="h-4 w-4 mr-2" />
              <span>Join {stats.totalCreators || '2,500'}+ music professionals using PPR Academy</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="relative py-24 z-10">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div 
            className="text-center mb-12 relative"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-base text-chart-1 font-semibold tracking-wide uppercase">FAQ</h2>
            <p className="mt-2 text-3xl leading-8 font-bold tracking-tight sm:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-chart-1 to-chart-4">
              Frequently asked questions
            </p>
            <p className="mt-4 max-w-2xl text-xl text-muted-foreground mx-auto">
              Everything you need to know about PPR Academy
            </p>
          </motion.div>

          <motion.div
            className="max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <Accordion type="single" collapsible className="space-y-4">
              {[
                {
                  question: "What is PPR Academy?",
                  answer: "PPR Academy is a marketplace platform connecting music creators with students. Creators can sell courses, sample packs, and digital products, while students get access to high-quality educational content and production resources from industry professionals."
                },
                {
                  question: "How much does it cost for students?",
                  answer: "It's completely free to browse and discover content. You only pay when you purchase individual courses, sample packs, or digital products. Each item has its own price set by the creator, with no monthly subscription required."
                },
                {
                  question: "How much does it cost for creators?",
                  answer: "Creating an account and setting up your storefront is free. We only earn when you earn - taking just a 10% platform fee on sales. You keep 90% of every sale, which is paid out directly to your connected Stripe account."
                },
                {
                  question: "What can I sell as a creator?",
                  answer: "You can sell online courses with video lessons, sample packs, presets, project templates, e-books, and any other digital products related to music production. You can also offer coaching sessions and build a subscriber base."
                },
                {
                  question: "Do I need to be verified to start selling?",
                  answer: "No verification required! Simply sign up, create your profile, connect your Stripe account for payments, and start uploading your content. Your products go live immediately after you publish them."
                },
                {
                  question: "How do students access purchased content?",
                  answer: "After purchasing, all content is instantly available in your Library. For courses, you'll get lifetime access to all lessons and materials. Sample packs and digital products can be downloaded directly from your library at any time."
                },
                {
                  question: "Is there a refund policy?",
                  answer: "Yes! We offer a money-back guarantee. If you're not satisfied with a purchase within the first 30 days, contact our support team for a full refund. We want to ensure you're happy with every purchase."
                },
                {
                  question: "How do I get paid as a creator?",
                  answer: "Connect your Stripe account in your dashboard settings. When students purchase your content, payments are processed through Stripe, and you receive 90% of the sale directly. Payouts follow Stripe's standard schedule."
                }
              ].map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="bg-card/50 border border-border backdrop-blur-sm rounded-lg px-6 overflow-hidden"
                >
                  <AccordionTrigger className="hover:no-underline py-6 text-left">
                    <h3 className="text-lg font-semibold text-foreground pr-4">
                      {faq.question}
                    </h3>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-6">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>

          <motion.div 
            className="mt-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <p className="text-muted-foreground mb-6">
              Still have questions?
            </p>
            <Button className="px-8 py-6 rounded-xl text-base transition-all duration-300 hover:shadow-lg hover:shadow-chart-1/20 hover:scale-105 hover:-translate-y-1">
              Contact Support
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Content Showcase - After FAQ */}
      {!isSearching && allContent.length > 0 && (
        <section className="relative py-24 z-10">
          <div className="absolute inset-0 bg-background"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <motion.div 
              className="text-center mb-12"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-foreground mb-4">Explore Our Marketplace</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Discover courses, sample packs, and digital products from talented creators
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
                <Link href="/courses">
                  <Button variant="outline" size="lg" className="group">
                    View All Content
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
                Ready to transform your
                <span className="block">music career?</span>
              </h2>
              <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto leading-relaxed">
                Join PPR Academy today and start building your skills or sharing your knowledge with the world. Start for free.
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
                      Get Started Free
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </SignUpButton>
                  <Link href="/sign-in">
                    <Button 
                      variant="outline"
                      size="lg" 
                      className="w-full sm:w-auto rounded-xl border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 font-semibold px-12 py-6 text-xl shadow-lg transition-all duration-300 hover:scale-105"
                    >
                      Sign In
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
                      className="w-full sm:w-auto rounded-xl border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 font-semibold px-12 py-6 text-xl shadow-lg transition-all duration-300 hover:scale-105"
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


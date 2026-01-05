// @ts-nocheck - Bypassing deep type instantiation errors with large Convex API
"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/lib/convex-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  BarChart3,
  MessageCircle,
  ArrowRight,
  Headphones,
  ListMusic,
  Video,
  Mic2,
  FileText,
  Music2,
  Sliders,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import { SignUpButton, useAuth } from "@clerk/nextjs";
import { Footer } from "./_components/footer";
import { HomepageStructuredData } from "./_components/HomepageStructuredData";
import { motion } from "framer-motion";
import { MarketplaceGrid } from "./_components/marketplace-grid";
import { MarketplaceNavbar } from "@/components/marketplace-navbar";

// Force dynamic rendering to avoid build-time Clerk issues
export const dynamic = "force-dynamic";

export default function SectionedMarketplace() {
  const { isSignedIn } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch data
  const courses = useQuery(api.courses.getAllPublishedCourses) || [];
  const products = useQuery(api.digitalProducts.getAllPublishedProducts) || [];
  const samplePacks = useQuery(api.samplePacks?.getAllPublishedSamplePacks) || [];
  const platformStats = useQuery(api.marketplace?.getPlatformStats);
  const featuredCreators = useQuery(api.marketplace?.getAllCreators, { limit: 6 }) || [];

  // Transform data to include contentType
  const coursesWithType = useMemo(
    () => courses.map((c: any) => ({ ...c, contentType: "course" as const })),
    [courses]
  );

  const productsWithType = useMemo(
    () => products.map((p: any) => ({ ...p, contentType: "product" as const })),
    [products]
  );

  const samplePacksWithType = useMemo(
    () => samplePacks.map((sp: any) => ({ ...sp, contentType: "sample-pack" as const })),
    [samplePacks]
  );

  // Combine all content
  const allContent = useMemo(
    () => [...coursesWithType, ...productsWithType, ...samplePacksWithType],
    [coursesWithType, productsWithType, samplePacksWithType]
  );

  // Filter by search term
  const filteredContent = useMemo(() => {
    if (!searchTerm) return allContent;
    const searchLower = searchTerm.toLowerCase();
    return allContent.filter(
      (item: any) =>
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
      description:
        "Enroll in expert-led courses and access premium content to level up your skills.",
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
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      {/* Structured Data for SEO */}
      <HomepageStructuredData />

      <MarketplaceNavbar />

      {/* Fixed background elements - Enhanced with dramatic orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Primary large orb - top right */}
        <motion.div
          className="absolute -right-20 -top-20 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-chart-1/30 to-chart-2/20 blur-[100px] filter"
          animate={{
            scale: [1, 1.1, 1],
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Secondary orb - bottom left */}
        <motion.div
          className="absolute -bottom-32 -left-32 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-chart-4/25 to-chart-3/15 blur-[80px] filter"
          animate={{
            scale: [1, 1.15, 1],
            x: [0, -20, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />

        {/* Accent orb - center */}
        <motion.div
          className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-chart-2/10 blur-[120px] filter"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />

        {/* Small floating orbs */}
        <motion.div
          className="absolute right-1/4 top-1/3 h-32 w-32 rounded-full bg-chart-1/20 blur-2xl filter"
          animate={{ y: [0, -40, 0], x: [0, 20, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/4 h-24 w-24 rounded-full bg-chart-3/20 blur-2xl filter"
          animate={{ y: [0, 30, 0], x: [0, -15, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.03)_1px,transparent_1px)] bg-[size:50px_50px] dark:bg-[linear-gradient(rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.05)_1px,transparent_1px)]"></div>

        {/* Noise texture for depth */}
        <div className="noise-overlay absolute inset-0"></div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 overflow-hidden px-4 pb-24 pt-32 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-7xl">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:mx-auto md:max-w-2xl lg:col-span-6 lg:text-left">
              <motion.div
                className="glass border-gradient animate-border-glow mb-8 inline-flex items-center rounded-full px-4 py-2 text-sm font-medium text-chart-1"
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
              >
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Music className="mr-2 h-4 w-4" />
                </motion.div>
                Where Music Creators & Students Connect
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, type: "spring", stiffness: 80 }}
                className="font-display tracking-tight"
              >
                <span className="block text-5xl font-extrabold sm:text-6xl lg:text-7xl">
                  <motion.span
                    className="mb-2 block text-foreground"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    Build and learn
                  </motion.span>
                  <motion.span
                    className="gradient-text-animated relative block"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    in one place
                    <motion.span
                      className="absolute -bottom-2 left-0 h-1 rounded-full bg-gradient-to-r from-chart-1 via-chart-2 to-chart-4"
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 1, delay: 0.8, ease: "easeOut" }}
                    />
                  </motion.span>
                </span>
              </motion.h1>

              <motion.p
                className="mt-8 max-w-lg text-xl leading-relaxed text-muted-foreground"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                PausePlayRepeat connects music producers who want to grow with creators who teach,
                share, and sell what they've learned.
              </motion.p>

              <div className="mt-10 sm:mx-auto sm:max-w-lg sm:text-center lg:mx-0 lg:text-left">
                <motion.div
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  {isSignedIn ? (
                    <>
                      <Link href="/dashboard?mode=learn">
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button className="group relative h-12 w-full rounded-xl bg-gradient-to-r from-chart-1 to-chart-2 px-6 text-sm font-semibold text-primary-foreground shadow-lg shadow-chart-1/25 transition-shadow hover:shadow-xl hover:shadow-chart-1/30">
                            <BookOpen className="mr-2 h-4 w-4" />
                            My Learning
                          </Button>
                        </motion.div>
                      </Link>
                      <Link href="/dashboard?mode=create">
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            variant="outline"
                            className="group h-12 w-full rounded-xl border-2 border-border bg-background/80 px-6 text-sm font-semibold backdrop-blur-sm transition-all hover:border-chart-1/50 hover:bg-background"
                          >
                            <Store className="mr-2 h-4 w-4" />
                            Creator Dashboard
                          </Button>
                        </motion.div>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/marketplace">
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button className="group relative h-12 w-full justify-center gap-2 rounded-xl bg-gradient-to-r from-chart-1 to-chart-2 px-5 text-sm font-semibold text-primary-foreground shadow-lg shadow-chart-1/25 transition-shadow hover:shadow-xl hover:shadow-chart-1/30">
                            <span>Explore Marketplace</span>
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </Button>
                        </motion.div>
                      </Link>
                      <Link href="/sign-up?intent=creator">
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            variant="outline"
                            className="group h-12 w-full justify-center gap-2 rounded-xl border-2 border-border bg-background/80 px-5 text-sm font-semibold backdrop-blur-sm transition-all hover:border-chart-1/50 hover:bg-background"
                          >
                            <span>Start as Creator</span>
                            <Zap className="h-4 w-4 transition-colors group-hover:text-chart-1" />
                          </Button>
                        </motion.div>
                      </Link>
                    </>
                  )}
                </motion.div>

                <motion.div
                  className="mt-6 flex items-center gap-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <div className="flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1.5">
                    <div className="relative">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <div className="absolute inset-0 h-2 w-2 animate-ping rounded-full bg-green-500 opacity-75" />
                    </div>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      Live community
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {stats.totalCreators}+ creators • {stats.totalStudents || "2,000"}+ students
                  </span>
                </motion.div>
              </div>
            </div>

            {/* Right Column - Visual */}
            <motion.div
              className="relative mt-12 sm:mx-auto sm:max-w-lg lg:col-span-6 lg:mx-0 lg:mt-0 lg:flex lg:max-w-none lg:items-center"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <div className="relative mx-auto w-full lg:max-w-xl">
                <div className="absolute -inset-8 rounded-3xl bg-gradient-to-r from-chart-1/30 via-chart-2/20 to-chart-4/30 blur-3xl" />

                <div className="relative grid grid-cols-3 gap-3">
                  {[
                    {
                      icon: Video,
                      label: "Courses",
                      gradient: "from-chart-1 to-chart-2",
                      href: "/marketplace/courses",
                    },
                    {
                      icon: Music,
                      label: "Sample Packs",
                      gradient: "from-chart-2 to-chart-3",
                      href: "/marketplace/samples",
                    },
                    {
                      icon: Sliders,
                      label: "Presets",
                      gradient: "from-chart-3 to-chart-4",
                      href: "/marketplace/ableton-racks",
                    },
                    {
                      icon: Zap,
                      label: "Effect Chains",
                      gradient: "from-chart-4 to-chart-5",
                      href: "/marketplace/ableton-racks",
                    },
                    {
                      icon: Music2,
                      label: "Beat Leases",
                      gradient: "from-chart-5 to-chart-1",
                      href: "/marketplace/beats",
                    },
                    {
                      icon: FileText,
                      label: "PDFs & Guides",
                      gradient: "from-chart-1 to-chart-3",
                      href: "/marketplace/guides",
                    },
                    {
                      icon: Mic2,
                      label: "Coaching",
                      gradient: "from-chart-2 to-chart-4",
                      href: "/marketplace/coaching",
                    },
                    {
                      icon: Headphones,
                      label: "Mix & Master",
                      gradient: "from-chart-3 to-chart-5",
                      href: "/marketplace/coaching",
                    },
                    {
                      icon: ListMusic,
                      label: "Playlisting",
                      gradient: "from-chart-4 to-chart-1",
                      href: "/marketplace",
                    },
                  ].map((item, i) => (
                    <Link key={item.label} href={item.href}>
                      <motion.div
                        className="cursor-pointer overflow-hidden rounded-xl border border-border/50 bg-card/80 p-4 backdrop-blur-sm transition-colors hover:border-chart-1/50"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.05 }}
                        whileHover={{ scale: 1.05, y: -2 }}
                      >
                        <motion.div
                          className={`mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${item.gradient}`}
                          animate={{ y: [0, -3, 0] }}
                          transition={{
                            duration: 2 + (i % 3) * 0.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.2,
                          }}
                        >
                          <item.icon className="h-5 w-5 text-primary-foreground" />
                        </motion.div>
                        <p className="text-sm font-medium">{item.label}</p>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      {isSearching && (
        <section className="relative z-10 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 text-center">
              <h2 className="mb-2 text-2xl font-bold text-foreground">
                Search Results for "{searchTerm}"
              </h2>
              <p className="text-muted-foreground">
                Found {filteredContent.length} {filteredContent.length === 1 ? "result" : "results"}
              </p>
            </div>
            <MarketplaceGrid content={filteredContent.slice(0, 12)} />
            {filteredContent.length === 0 && (
              <div className="py-12 text-center">
                <p className="mb-4 text-muted-foreground">
                  No results found. Try different keywords.
                </p>
                <Button onClick={() => setSearchTerm("")} variant="outline">
                  Clear Search
                </Button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Creator Spotlight Section */}
      {!isSearching && featuredCreators.length > 0 && (
        <section className="relative z-10 overflow-hidden py-24">
          <div className="absolute inset-0 bg-gradient-to-br from-chart-1/5 via-transparent to-chart-4/5"></div>

          {/* Decorative floating orbs */}
          <motion.div
            className="absolute right-10 top-20 h-64 w-64 rounded-full bg-chart-2/10 blur-3xl"
            animate={{ y: [0, -30, 0], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-20 left-10 h-48 w-48 rounded-full bg-chart-4/10 blur-3xl"
            animate={{ y: [0, 20, 0], opacity: [0.4, 0.6, 0.4] }}
            transition={{ duration: 6, repeat: Infinity, delay: 2 }}
          />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              className="mb-16 text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <motion.span
                className="mb-4 inline-block text-sm font-semibold uppercase tracking-wider text-chart-1"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                viewport={{ once: true }}
              >
                Featured Creators
              </motion.span>
              <h2 className="gradient-text-animated mb-4 text-3xl font-bold leading-8 tracking-tight sm:text-4xl lg:text-5xl">
                Discover real producers teaching what they know
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Browse packs, presets, and lessons from independent producers building their brands
                on PausePlayRepeat.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {featuredCreators.slice(0, 6).map((creator: any, index: number) => (
                <motion.div
                  key={creator._id}
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1, type: "spring", stiffness: 100 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -8 }}
                >
                  <Link href={`/${creator.slug}`}>
                    <Card className="card-hover-glow group relative cursor-pointer overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm">
                      {/* Hover glow effect */}
                      <div className="absolute -inset-px rounded-xl bg-gradient-to-r from-chart-1/0 via-chart-2/0 to-chart-4/0 opacity-0 blur transition-opacity duration-500 group-hover:from-chart-1/20 group-hover:via-chart-2/20 group-hover:to-chart-4/20 group-hover:opacity-100" />

                      {/* Banner */}
                      <div className="relative h-36 overflow-hidden">
                        {creator.bannerImage ? (
                          <div className="relative h-full w-full">
                            <img
                              src={creator.bannerImage}
                              alt={`${creator.name} banner`}
                              className="h-full w-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-110"
                            />
                          </div>
                        ) : (
                          <div className="animate-gradient absolute inset-0 bg-gradient-to-br from-chart-1/30 via-chart-2/20 to-chart-3/30" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />

                        {/* Shimmer on hover */}
                        <div className="absolute inset-0 translate-x-[-200%] bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 group-hover:translate-x-[200%]" />
                      </div>

                      <CardContent className="relative z-10 -mt-12 space-y-4 px-6 pb-6">
                        {/* Avatar with glow */}
                        <div className="flex justify-center">
                          <div className="relative">
                            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-chart-1 to-chart-2 opacity-0 blur-sm transition-opacity duration-300 group-hover:opacity-70" />
                            <Avatar className="relative h-24 w-24 border-4 border-card shadow-2xl ring-2 ring-chart-1/20 transition-transform duration-300 group-hover:scale-105">
                              <AvatarImage src={creator.avatar} />
                              <AvatarFallback className="bg-gradient-to-br from-chart-1 to-chart-2 text-2xl font-bold text-primary-foreground">
                                {creator.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        </div>

                        {/* Name & Bio */}
                        <div className="text-center">
                          <h3 className="group-hover:gradient-text mb-1 text-xl font-bold transition-colors duration-300">
                            {creator.name}
                          </h3>
                          {creator.bio && (
                            <p className="line-clamp-2 text-sm text-muted-foreground">
                              {creator.bio}
                            </p>
                          )}
                        </div>

                        {/* Stats with icons */}
                        <div className="flex items-center justify-center gap-6 border-t border-border/50 pt-4 text-sm">
                          <motion.div
                            className="flex items-center gap-1.5 text-muted-foreground transition-colors group-hover:text-chart-1"
                            whileHover={{ scale: 1.1 }}
                          >
                            <BookOpen className="h-4 w-4" />
                            <span className="font-medium">{creator.totalCourses}</span>
                          </motion.div>
                          <motion.div
                            className="flex items-center gap-1.5 text-muted-foreground transition-colors group-hover:text-chart-2"
                            whileHover={{ scale: 1.1 }}
                          >
                            <Package className="h-4 w-4" />
                            <span className="font-medium">{creator.totalProducts}</span>
                          </motion.div>
                          <motion.div
                            className="flex items-center gap-1.5 text-muted-foreground transition-colors group-hover:text-chart-3"
                            whileHover={{ scale: 1.1 }}
                          >
                            <Users className="h-4 w-4" />
                            <span className="font-medium">{creator.totalStudents}</span>
                          </motion.div>
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
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* Feature Section (Framed for Both) */}
      <section id="how-it-works" className="relative z-10 overflow-hidden py-24">
        <div className="glass absolute inset-0"></div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <motion.span
              className="mb-4 inline-block text-sm font-semibold uppercase tracking-wider text-chart-1"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
            >
              What You Can Do
            </motion.span>
            <h2 className="gradient-text-animated text-3xl font-bold leading-8 tracking-tight sm:text-4xl lg:text-5xl">
              Learn, create, and grow together
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-xl text-muted-foreground">
              Whether you're here to learn or to teach, this is your home base
            </p>
          </motion.div>

          <div className="mt-20 grid gap-8 md:grid-cols-3">
            {[
              {
                icon: BookOpen,
                title: "Learn from real producers",
                desc: "Watch courses, download tools, and apply what you learn instantly in your DAW.",
                gradient: "from-chart-1 to-chart-2",
                delay: 0,
              },
              {
                icon: Upload,
                title: "Create and share your own",
                desc: "Turn your knowledge into income with a page that sells for you.",
                gradient: "from-chart-3 to-chart-4",
                delay: 0.1,
              },
              {
                icon: Users,
                title: "Grow together",
                desc: "Join a community of artists who learn, teach, and push each other forward.",
                gradient: "from-chart-4 to-chart-5",
                delay: 0.2,
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                className="group relative rounded-2xl border border-border/50 bg-card/50 p-8 backdrop-blur-sm transition-all duration-500"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: feature.delay }}
                viewport={{ once: true }}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                {/* Glow on hover */}
                <div
                  className={`absolute -inset-px rounded-2xl bg-gradient-to-r ${feature.gradient} opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-20`}
                />

                <div className="relative">
                  <motion.div
                    className={`mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} shadow-lg shadow-chart-1/20`}
                    whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <feature.icon className="h-10 w-10 text-primary-foreground" />
                  </motion.div>
                  <h3 className="group-hover:gradient-text mb-4 text-2xl font-bold text-foreground transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="leading-relaxed text-muted-foreground">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What You Can Find Section (Explore the Academy Library) */}
      {!isSearching && allContent.length > 0 && (
        <section className="relative z-10 py-24">
          <div className="absolute inset-0 bg-card/50 backdrop-blur-sm"></div>

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              className="mb-12 text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="mb-4 bg-gradient-to-r from-chart-1 to-chart-4 bg-clip-text text-3xl font-bold text-foreground text-transparent">
                Explore the Library
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Courses, sound packs, and presets from producers around the world — new drops every
                week.
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
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </motion.div>
            )}
          </div>
        </section>
      )}

      {/* Final Gradient CTA Section */}
      <section className="relative z-10 overflow-hidden py-32">
        <div className="animate-gradient absolute inset-0 bg-gradient-to-br from-chart-1 via-chart-2 to-chart-4"></div>

        <motion.div
          className="absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-white/10 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.3, 0.2] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-white/10 blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.2, 0.3] }}
          transition={{ duration: 6, repeat: Infinity, delay: 2 }}
        />
        <motion.div
          className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-3xl"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 10, repeat: Infinity }}
        />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="space-y-12 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="space-y-6">
              <motion.h2
                className="text-4xl font-extrabold leading-tight text-white drop-shadow-lg md:text-5xl lg:text-6xl xl:text-7xl"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                viewport={{ once: true }}
              >
                Whether you're learning or creating,
                <motion.span
                  className="mt-2 block"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  viewport={{ once: true }}
                >
                  this is your home base
                </motion.span>
              </motion.h2>
              <motion.p
                className="mx-auto max-w-2xl text-xl leading-relaxed text-white/80"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                viewport={{ once: true }}
              >
                Join PausePlayRepeat today and start building your skills or sharing your knowledge
                with the world. Start for free.
              </motion.p>
            </div>

            <motion.div
              className="flex flex-col items-center justify-center gap-6 sm:flex-row"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              viewport={{ once: true }}
            >
              {!isSignedIn ? (
                <>
                  <SignUpButton mode="modal">
                    <motion.div whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        size="lg"
                        className="group relative w-full overflow-hidden rounded-2xl bg-white px-14 py-8 text-xl font-bold text-gray-900 shadow-2xl shadow-black/30 transition-all duration-300 hover:bg-gray-50 sm:w-auto"
                      >
                        <span className="relative z-10">Start Learning Free</span>
                        <ArrowRight className="relative z-10 ml-2 h-6 w-6 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </motion.div>
                  </SignUpButton>
                  <Link href="/sign-up?intent=creator">
                    <motion.div whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        variant="outline"
                        size="lg"
                        className="group w-full rounded-2xl border-2 border-white/30 bg-white/10 px-14 py-8 text-xl font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:border-white/60 hover:bg-white/20 sm:w-auto"
                      >
                        Become a Creator
                        <Zap className="ml-2 h-5 w-5 transition-transform group-hover:scale-110" />
                      </Button>
                    </motion.div>
                  </Link>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
                  <Link href="/dashboard?mode=learn">
                    <motion.div whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        size="lg"
                        className="group relative w-full overflow-hidden rounded-2xl bg-white px-14 py-8 text-xl font-bold text-gray-900 shadow-2xl shadow-black/30 transition-all duration-300 hover:bg-gray-50 sm:w-auto"
                      >
                        <BookOpen className="relative z-10 mr-2 h-6 w-6" />
                        <span className="relative z-10">My Learning</span>
                      </Button>
                    </motion.div>
                  </Link>
                  <Link href="/dashboard?mode=create">
                    <motion.div whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        variant="outline"
                        size="lg"
                        className="group w-full rounded-2xl border-2 border-white/30 bg-white/10 px-14 py-8 text-xl font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:border-white/60 hover:bg-white/20 sm:w-auto"
                      >
                        <Store className="mr-2 h-5 w-5" />
                        Creator Studio
                      </Button>
                    </motion.div>
                  </Link>
                </div>
              )}
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 pt-8 text-sm text-white/70"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 1 }}
              viewport={{ once: true }}
            >
              {[
                "Free to browse",
                "90% creator payout",
                "Money-back guarantee",
                "Start instantly",
              ].map((item, i) => (
                <motion.div
                  key={item}
                  className="flex items-center space-x-2"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 + i * 0.1 }}
                  viewport={{ once: true }}
                >
                  <CheckCircle className="h-5 w-5 text-white/80" />
                  <span className="font-medium">{item}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* Platform Stats */}
            <motion.div
              className="mt-12 border-t border-white/20 pt-10"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              viewport={{ once: true }}
            >
              <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
                {[
                  { value: "Expert", label: "Quality Creators" },
                  { value: "90%", label: "Revenue Share" },
                  { value: "Direct", label: "Support" },
                  { value: "Instant", label: "Access" },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.3 + i * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <div className="text-3xl font-bold text-white drop-shadow-lg">{stat.value}</div>
                    <div className="mt-1 text-sm text-white/60">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

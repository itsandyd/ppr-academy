"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  Users,
  BookOpen,
  Package,
  TrendingUp,
  MapPin,
  Music,
  Menu,
  Store,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { SignUpButton, useAuth } from "@clerk/nextjs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export const dynamic = "force-dynamic";

export default function CreatorsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { isSignedIn } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch all creators
  const allCreators = useQuery(api.marketplace.getAllCreators, { limit: 100 }) || [];

  // Filter creators based on search
  const filteredCreators = allCreators.filter(
    (creator: any) =>
      creator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      creator.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      creator.categories.some((cat: any) => cat.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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

      {/* Header */}
      <section className="border-b border-border bg-card/50 pt-16 backdrop-blur-sm">
        {/* pt-16 for navbar spacing */}
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8 space-y-4 text-center">
            <motion.h1
              className="bg-gradient-to-r from-chart-1 to-chart-4 bg-clip-text text-4xl font-bold text-transparent md:text-5xl"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Browse Creators
            </motion.h1>
            <motion.p
              className="mx-auto max-w-2xl text-xl text-muted-foreground"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Discover talented creators and explore their products
            </motion.p>
          </div>

          {/* Search */}
          <motion.div
            className="relative mx-auto max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search creators by name, bio, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 border-border bg-background pl-12 pr-4 text-base"
            />
          </motion.div>
        </div>
      </section>

      {/* Creators Grid */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-muted-foreground">
            {filteredCreators.length} {filteredCreators.length === 1 ? "creator" : "creators"} found
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCreators.map((creator: any, index: number) => (
            <motion.div
              key={creator._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
            >
              <Link href={`/${creator.slug}`}>
                <Card className="group cursor-pointer overflow-hidden border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/10 dark:hover:shadow-white/5">
                  {/* Banner */}
                  <div className="relative h-40 overflow-hidden">
                    {creator.bannerImage ? (
                      <Image
                        src={creator.bannerImage}
                        alt={`${creator.name} banner`}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-chart-1/20 via-chart-2/20 to-chart-3/20 dark:from-chart-1/30 dark:via-chart-2/30 dark:to-chart-3/30" />
                    )}
                    {/* Gradient overlay for better contrast */}
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
                  </div>

                  <CardContent className="relative z-10 -mt-12 space-y-4 px-6 pb-6">
                    {/* Avatar */}
                    <div className="flex justify-center">
                      <Avatar className="h-24 w-24 border-4 border-card shadow-xl ring-2 ring-border">
                        <AvatarImage src={creator.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-chart-1 to-chart-2 text-2xl text-primary-foreground">
                          {creator.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    {/* Name & Bio */}
                    <div className="text-center">
                      <h3 className="mb-2 text-xl font-bold transition-colors group-hover:text-chart-1">
                        {creator.name}
                      </h3>
                      {creator.bio && (
                        <p className="line-clamp-2 text-sm text-muted-foreground">{creator.bio}</p>
                      )}
                    </div>

                    {/* Categories */}
                    {creator.categories.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-2">
                        {creator.categories.slice(0, 3).map((cat: any) => (
                          <Badge
                            key={cat}
                            variant="secondary"
                            className="bg-muted/50 text-xs hover:bg-muted"
                          >
                            {cat}
                          </Badge>
                        ))}
                        {creator.categories.length > 3 && (
                          <Badge variant="secondary" className="bg-muted/50 text-xs">
                            +{creator.categories.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 border-t border-border pt-4">
                      <div className="text-center">
                        <div className="mb-1 flex items-center justify-center gap-1 text-chart-1">
                          <Package className="h-4 w-4" />
                          <span className="font-bold">{creator.totalProducts}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">Products</div>
                      </div>
                      <div className="text-center">
                        <div className="mb-1 flex items-center justify-center gap-1 text-chart-2">
                          <BookOpen className="h-4 w-4" />
                          <span className="font-bold">{creator.totalCourses}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">Courses</div>
                      </div>
                      <div className="text-center">
                        <div className="mb-1 flex items-center justify-center gap-1 text-chart-3">
                          <Users className="h-4 w-4" />
                          <span className="font-bold">{creator.totalStudents}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">Students</div>
                      </div>
                    </div>

                    {/* CTA */}
                    <Button
                      variant="outline"
                      className="w-full transition-all group-hover:border-chart-1 group-hover:bg-chart-1 group-hover:text-primary-foreground"
                    >
                      View Storefront
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredCreators.length === 0 && (
          <Card className="border-border bg-card p-12 text-center">
            <Users className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-xl font-semibold">No creators found</h3>
            <p className="mb-6 text-muted-foreground">
              {searchTerm
                ? `No creators match "${searchTerm}". Try a different search term.`
                : "There are no creators yet. Check back soon!"}
            </p>
            {searchTerm && <Button onClick={() => setSearchTerm("")}>Clear Search</Button>}
          </Card>
        )}
      </section>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Users, BookOpen, Package, TrendingUp, MapPin, Music, Menu, Store } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { SignUpButton, useAuth } from "@clerk/nextjs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export const dynamic = 'force-dynamic';

export default function CreatorsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { isSignedIn } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Fetch all creators
  const allCreators = useQuery(api.marketplace.getAllCreators, { limit: 100 }) || [];

  // Filter creators based on search
  const filteredCreators = allCreators.filter((creator) =>
    creator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    creator.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    creator.categories.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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

      {/* Header */}
      <section className="border-b border-border bg-card/50 backdrop-blur-sm pt-16">{/* pt-16 for navbar spacing */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center space-y-4 mb-8">
            <motion.h1 
              className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-chart-1 to-chart-4 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Browse Creators
            </motion.h1>
            <motion.p 
              className="text-xl text-muted-foreground max-w-2xl mx-auto"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Discover talented creators and explore their products
            </motion.p>
          </div>

          {/* Search */}
          <motion.div 
            className="relative max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search creators by name, bio, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 h-12 text-base bg-background border-border"
            />
          </motion.div>
        </div>
      </section>

      {/* Creators Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <p className="text-muted-foreground">
            {filteredCreators.length} {filteredCreators.length === 1 ? 'creator' : 'creators'} found
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCreators.map((creator, index) => (
            <motion.div
              key={creator._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
            >
              <Link href={`/${creator.slug}`}>
                <Card className="group overflow-hidden border-border bg-card hover:shadow-2xl hover:shadow-black/10 dark:hover:shadow-white/5 transition-all duration-300 cursor-pointer hover:-translate-y-1">
                  {/* Banner */}
                  <div className="relative h-40 overflow-hidden">
                    {creator.bannerImage ? (
                      <Image
                        src={creator.bannerImage}
                        alt={`${creator.name} banner`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-chart-1/20 via-chart-2/20 to-chart-3/20 dark:from-chart-1/30 dark:via-chart-2/30 dark:to-chart-3/30" />
                    )}
                    {/* Gradient overlay for better contrast */}
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
                  </div>

                  <CardContent className="pb-6 px-6 -mt-12 relative z-10 space-y-4">
                    {/* Avatar */}
                    <div className="flex justify-center">
                      <Avatar className="w-24 h-24 border-4 border-card shadow-xl ring-2 ring-border">
                        <AvatarImage src={creator.avatar} />
                        <AvatarFallback className="text-2xl bg-gradient-to-br from-chart-1 to-chart-2 text-primary-foreground">
                          {creator.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    {/* Name & Bio */}
                    <div className="text-center">
                      <h3 className="font-bold text-xl group-hover:text-chart-1 transition-colors mb-2">
                        {creator.name}
                      </h3>
                      {creator.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {creator.bio}
                        </p>
                      )}
                    </div>

                    {/* Categories */}
                    {creator.categories.length > 0 && (
                      <div className="flex flex-wrap gap-2 justify-center">
                        {creator.categories.slice(0, 3).map((cat) => (
                          <Badge 
                            key={cat} 
                            variant="secondary" 
                            className="text-xs bg-muted/50 hover:bg-muted"
                          >
                            {cat}
                          </Badge>
                        ))}
                        {creator.categories.length > 3 && (
                          <Badge variant="secondary" className="text-xs bg-muted/50">
                            +{creator.categories.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="pt-4 border-t border-border grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-chart-1 mb-1">
                          <Package className="w-4 h-4" />
                          <span className="font-bold">{creator.totalProducts}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">Products</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-chart-2 mb-1">
                          <BookOpen className="w-4 h-4" />
                          <span className="font-bold">{creator.totalCourses}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">Courses</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-chart-3 mb-1">
                          <Users className="w-4 h-4" />
                          <span className="font-bold">{creator.totalStudents}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">Students</div>
                      </div>
                    </div>

                    {/* CTA */}
                    <Button 
                      variant="outline" 
                      className="w-full group-hover:bg-chart-1 group-hover:text-primary-foreground group-hover:border-chart-1 transition-all"
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
          <Card className="p-12 text-center bg-card border-border">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No creators found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm 
                ? `No creators match "${searchTerm}". Try a different search term.`
                : "There are no creators yet. Check back soon!"
              }
            </p>
            {searchTerm && (
              <Button onClick={() => setSearchTerm("")}>Clear Search</Button>
            )}
          </Card>
        )}
      </section>
    </div>
  );
}


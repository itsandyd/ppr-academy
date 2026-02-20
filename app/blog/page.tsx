"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookOpen, Search, Calendar, Clock, Eye, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { format } from "date-fns";

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);

  // Fetch data
  const postsData = useQuery(api.blog.getPublishedPosts, {});
  const categoriesData = useQuery(api.blog.getCategories, {});

  const posts = postsData ?? [];
  const categories = categoriesData ?? [];

  // Filter posts
  const filteredPosts = useMemo(() => {
    let filtered = posts;

    // Search filter
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (post: any) =>
          post.title.toLowerCase().includes(search) ||
          post.excerpt?.toLowerCase().includes(search) ||
          post.authorName?.toLowerCase().includes(search)
      );
    }

    // Category filter
    if (selectedCategory && selectedCategory !== "all") {
      filtered = filtered.filter((post: any) => post.category === selectedCategory);
    }

    return filtered;
  }, [posts, searchQuery, selectedCategory]);

  const featuredPost = filteredPosts[0];
  const regularPosts = filteredPosts.slice(1);

  // Handle loading state
  const isLoading = postsData === undefined || categoriesData === undefined;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <BookOpen className="mx-auto mb-4 h-16 w-16 animate-pulse text-muted-foreground" />
          <p className="text-muted-foreground">Loading blog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 py-20 text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-lg">
              <BookOpen className="h-10 w-10" />
            </div>
            <h1 className="mb-4 text-4xl font-bold md:text-6xl">PausePlayRepeat Blog</h1>
            <p className="mx-auto max-w-3xl text-xl text-white/90 md:text-2xl">
              Tutorials, tips, and insights to help you grow as a creator
            </p>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search blog posts..."
                  className="bg-background pl-10"
                />
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-4">
                <Select
                  value={selectedCategory || "all"}
                  onValueChange={(v) => setSelectedCategory(v === "all" ? undefined : v)}
                >
                  <SelectTrigger className="w-[200px] bg-background">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-black">
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category: any) => (
                      <SelectItem key={category.name} value={category.name}>
                        {category.name} ({category.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {(searchQuery || selectedCategory) && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory(undefined);
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Featured Post */}
        {featuredPost && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-12"
          >
            <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl">
              <div className="grid gap-0 md:grid-cols-2">
                {/* Featured Image */}
                <div className="relative h-64 bg-gradient-to-br from-purple-500/20 to-pink-500/20 md:h-full">
                  {featuredPost.coverImage ? (
                    <Image
                      src={featuredPost.coverImage}
                      alt={featuredPost.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <BookOpen className="h-24 w-24 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute left-4 top-4">
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 font-semibold text-white">
                      <Sparkles className="mr-1 h-3 w-3" />
                      Featured
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <CardContent className="flex flex-col justify-center p-8">
                  <div className="space-y-4">
                    {featuredPost.category && (
                      <Badge variant="secondary">{featuredPost.category}</Badge>
                    )}

                    <h2 className="text-3xl font-bold">
                      <Link
                        href={`/blog/${featuredPost.slug}`}
                        className="transition-colors hover:text-purple-500"
                      >
                        {featuredPost.title}
                      </Link>
                    </h2>

                    {featuredPost.excerpt && (
                      <p className="text-lg text-muted-foreground">{featuredPost.excerpt}</p>
                    )}

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      {featuredPost.authorName && (
                        <div className="flex items-center gap-2">
                          {featuredPost.authorAvatar && (
                            <div className="relative h-6 w-6 overflow-hidden rounded-full">
                              <Image
                                src={featuredPost.authorAvatar}
                                alt={featuredPost.authorName}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <span>{featuredPost.authorName}</span>
                        </div>
                      )}
                      {featuredPost.publishedAt && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{format(featuredPost.publishedAt, "MMM d, yyyy")}</span>
                        </div>
                      )}
                      {featuredPost.readTimeMinutes && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{featuredPost.readTimeMinutes} min read</span>
                        </div>
                      )}
                    </div>

                    <Button asChild className="w-fit">
                      <Link href={`/blog/${featuredPost.slug}`}>
                        Read Article
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Regular Posts Grid */}
        {regularPosts.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {regularPosts.map((post: any, index: number) => (
              <motion.div
                key={post._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Card className="group flex h-full flex-col overflow-hidden transition-all duration-300 hover:shadow-lg">
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                    {post.coverImage ? (
                      <Image
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <BookOpen className="h-16 w-16 text-muted-foreground/30" />
                      </div>
                    )}

                    {post.category && (
                      <div className="absolute left-3 top-3">
                        <Badge variant="secondary" className="bg-white dark:bg-black">
                          {post.category}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <CardContent className="flex flex-1 flex-col p-6">
                    {/* Title */}
                    <h3 className="mb-2 line-clamp-2 text-xl font-bold transition-colors group-hover:text-purple-500">
                      <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                    </h3>

                    {/* Excerpt */}
                    {post.excerpt && (
                      <p className="mb-4 line-clamp-3 flex-1 text-sm text-muted-foreground">
                        {post.excerpt}
                      </p>
                    )}

                    {/* Meta */}
                    <div className="mt-auto flex flex-wrap items-center gap-3 border-t pt-4 text-xs text-muted-foreground">
                      {post.authorName && (
                        <div className="flex items-center gap-1">
                          {post.authorAvatar && (
                            <div className="relative h-5 w-5 overflow-hidden rounded-full">
                              <Image
                                src={post.authorAvatar}
                                alt={post.authorName}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <span className="truncate">{post.authorName}</span>
                        </div>
                      )}
                      {post.readTimeMinutes && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{post.readTimeMinutes} min</span>
                        </div>
                      )}
                      {typeof post.views === "number" && (
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          <span>{post.views}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 text-xl font-semibold">No posts found</h3>
              <p className="text-muted-foreground">
                {searchQuery || selectedCategory
                  ? "Try adjusting your filters"
                  : "Check back soon for new content"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

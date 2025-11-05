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
import { 
  BookOpen, 
  Search, 
  Calendar,
  Clock,
  Eye,
  ArrowRight,
  Sparkles,
} from "lucide-react";
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
        (post) =>
          post.title.toLowerCase().includes(search) ||
          post.excerpt?.toLowerCase().includes(search) ||
          post.authorName?.toLowerCase().includes(search)
      );
    }

    // Category filter
    if (selectedCategory && selectedCategory !== "all") {
      filtered = filtered.filter((post) => post.category === selectedCategory);
    }

    return filtered;
  }, [posts, searchQuery, selectedCategory]);

  const featuredPost = filteredPosts[0];
  const regularPosts = filteredPosts.slice(1);

  // Handle loading state
  const isLoading = postsData === undefined || categoriesData === undefined;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading blog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white py-20">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-lg rounded-2xl mb-6">
              <BookOpen className="w-10 h-10" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              PPR Academy Blog
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
              Tutorials, tips, and insights to help you grow as a creator
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search blog posts..."
                  className="pl-10 bg-background"
                />
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-4">
                <Select 
                  value={selectedCategory || "all"} 
                  onValueChange={(v) => setSelectedCategory(v === "all" ? undefined : v)}
                >
                  <SelectTrigger className="bg-background w-[200px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-black">
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
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
            <Card className="overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="grid md:grid-cols-2 gap-0">
                {/* Featured Image */}
                <div className="relative h-64 md:h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                  {featuredPost.coverImage ? (
                    <Image
                      src={featuredPost.coverImage}
                      alt={featuredPost.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-24 h-24 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <CardContent className="p-8 flex flex-col justify-center">
                  <div className="space-y-4">
                    {featuredPost.category && (
                      <Badge variant="secondary">{featuredPost.category}</Badge>
                    )}
                    
                    <h2 className="text-3xl font-bold">
                      <Link 
                        href={`/blog/${featuredPost.slug}`}
                        className="hover:text-purple-500 transition-colors"
                      >
                        {featuredPost.title}
                      </Link>
                    </h2>
                    
                    {featuredPost.excerpt && (
                      <p className="text-lg text-muted-foreground">
                        {featuredPost.excerpt}
                      </p>
                    )}

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      {featuredPost.authorName && (
                        <div className="flex items-center gap-2">
                          {featuredPost.authorAvatar && (
                            <div className="relative w-6 h-6 rounded-full overflow-hidden">
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
                          <Calendar className="w-4 h-4" />
                          <span>{format(featuredPost.publishedAt, "MMM d, yyyy")}</span>
                        </div>
                      )}
                      {featuredPost.readTimeMinutes && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{featuredPost.readTimeMinutes} min read</span>
                        </div>
                      )}
                    </div>

                    <Button asChild className="w-fit">
                      <Link href={`/blog/${featuredPost.slug}`}>
                        Read Article
                        <ArrowRight className="w-4 h-4 ml-2" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularPosts.map((post, index) => (
              <motion.div
                key={post._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden h-full flex flex-col">
                  {/* Image */}
                  <div className="relative h-48 bg-gradient-to-br from-blue-500/10 to-purple-500/10 overflow-hidden">
                    {post.coverImage ? (
                      <Image
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-16 h-16 text-muted-foreground/30" />
                      </div>
                    )}
                    
                    {post.category && (
                      <div className="absolute top-3 left-3">
                        <Badge variant="secondary" className="bg-white dark:bg-black">
                          {post.category}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-6 flex flex-col flex-1">
                    {/* Title */}
                    <h3 className="text-xl font-bold mb-2 group-hover:text-purple-500 transition-colors line-clamp-2">
                      <Link href={`/blog/${post.slug}`}>
                        {post.title}
                      </Link>
                    </h3>

                    {/* Excerpt */}
                    {post.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
                        {post.excerpt}
                      </p>
                    )}

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-4 border-t mt-auto">
                      {post.authorName && (
                        <div className="flex items-center gap-1">
                          {post.authorAvatar && (
                            <div className="relative w-5 h-5 rounded-full overflow-hidden">
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
                          <Clock className="w-3 h-3" />
                          <span>{post.readTimeMinutes} min</span>
                        </div>
                      )}
                      {typeof post.views === 'number' && (
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
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
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No posts found</h3>
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


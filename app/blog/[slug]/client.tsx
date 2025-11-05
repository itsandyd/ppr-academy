"use client";

import { useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar,
  Clock,
  Eye,
  Share2,
  ArrowLeft,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { format } from "date-fns";
import { notFound } from "next/navigation";

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

export default function BlogPostPageClient({ params }: BlogPostPageProps) {
  const post = useQuery(api.blog.getPostBySlug, { slug: params.slug });
  const incrementViews = useMutation(api.blog.incrementViews);

  // Increment views when post loads
  useEffect(() => {
    if (post && post._id) {
      incrementViews({ postId: post._id });
    }
  }, [post?._id]);

  if (post === null) {
    notFound();
  }

  if (post === undefined) {
    // Loading state
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading article...</p>
        </div>
      </div>
    );
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.excerpt || post.title,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // Could show a toast notification here
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Cover Image */}
      <section className="relative bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 overflow-hidden">
        {post.coverImage && (
          <div className="absolute inset-0 opacity-30">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}
        <div className="relative max-w-4xl mx-auto px-6 py-12 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Back Button */}
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="mb-6"
            >
              <Link href="/blog">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Blog
              </Link>
            </Button>

            {/* Category Badge */}
            {post.category && (
              <Badge variant="secondary" className="mb-4">
                {post.category}
              </Badge>
            )}

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              {post.title}
            </h1>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-xl text-muted-foreground mb-6">
                {post.excerpt}
              </p>
            )}

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {/* Author */}
              {post.authorName && (
                <div className="flex items-center gap-2">
                  {post.authorAvatar && (
                    <div className="relative w-8 h-8 rounded-full overflow-hidden">
                      <Image
                        src={post.authorAvatar}
                        alt={post.authorName}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <span className="font-medium">{post.authorName}</span>
                </div>
              )}

              {/* Published Date */}
              {post.publishedAt && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{format(post.publishedAt, "MMM d, yyyy")}</span>
                </div>
              )}

              {/* Read Time */}
              {post.readTimeMinutes && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{post.readTimeMinutes} min read</span>
                </div>
              )}

              {/* Views */}
              {typeof post.views === 'number' && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Eye className="w-4 h-4" />
                  <span>{post.views.toLocaleString()} views</span>
                </div>
              )}

              {/* Share Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="ml-auto"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-8 md:p-12">
              {/* Blog Content */}
              <div 
                className="prose prose-lg dark:prose-invert max-w-none
                  prose-headings:font-bold 
                  prose-h1:text-4xl prose-h1:mb-4
                  prose-h2:text-3xl prose-h2:mt-8 prose-h2:mb-4
                  prose-h3:text-2xl prose-h3:mt-6 prose-h3:mb-3
                  prose-p:mb-4 prose-p:leading-relaxed
                  prose-a:text-purple-500 prose-a:no-underline hover:prose-a:underline
                  prose-img:rounded-lg prose-img:shadow-md
                  prose-code:bg-muted prose-code:px-2 prose-code:py-1 prose-code:rounded
                  prose-pre:bg-muted prose-pre:border prose-pre:border-border
                  prose-blockquote:border-l-4 prose-blockquote:border-purple-500 prose-blockquote:pl-4 prose-blockquote:italic
                  prose-ul:my-4 prose-ol:my-4
                  prose-li:my-2
                "
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="mt-12 pt-8 border-t">
                  <h3 className="text-sm font-semibold mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Author Card */}
              {post.authorName && (
                <div className="mt-12 pt-8 border-t">
                  <div className="flex items-start gap-4">
                    {post.authorAvatar && (
                      <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                        <Image
                          src={post.authorAvatar}
                          alt={post.authorName}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-lg mb-1">
                        Written by {post.authorName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Creator at PPR Academy
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Call to Action */}
          <div className="mt-12">
            <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-4">
                  Ready to start your creator journey?
                </h3>
                <p className="text-muted-foreground mb-6">
                  Join PPR Academy and access exclusive courses, tools, and community support
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button asChild size="lg">
                    <Link href="/marketplace">
                      Explore Marketplace
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/blog">
                      Read More Articles
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}


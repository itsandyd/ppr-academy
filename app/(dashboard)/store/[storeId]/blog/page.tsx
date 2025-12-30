"use client";

import { useState, use } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BookOpen, Plus, Edit, Trash2, MoreVertical, Eye, Clock, Calendar } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";

interface BlogPageProps {
  params: Promise<{
    storeId: string;
  }>;
}

export default function CreatorBlogPage({ params }: BlogPageProps) {
  const { storeId } = use(params);
  const { user } = useUser();
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<"all" | "draft" | "published" | "archived">(
    "all"
  );

  // Fetch posts by creator
  const postsData = useQuery(
    api.blog.getPostsByCreator,
    user?.id
      ? {
          authorId: user.id,
          status: selectedStatus === "all" ? undefined : selectedStatus,
        }
      : "skip"
  );

  const deletePost = useMutation(api.blog.deletePost);

  const posts = postsData ?? [];

  const handleDelete = async (postId: any) => {
    if (!confirm("Are you sure you want to delete this blog post?")) {
      return;
    }

    try {
      await deletePost({ postId });
      toast.success("Blog post deleted successfully");
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete blog post");
    }
  };

  const stats = {
    total: posts.length,
    published: posts.filter((p: any) => p.status === "published").length,
    draft: posts.filter((p: any) => p.status === "draft").length,
    totalViews: posts.reduce((acc: number, p: any) => acc + (p.views || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Blog Posts</h1>
          <p className="mt-1 text-muted-foreground">Create and manage your blog posts</p>
        </div>
        <Button asChild>
          <Link href={`/store/${storeId}/blog/new`}>
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Posts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-green-500">{stats.published}</div>
            <div className="text-sm text-muted-foreground">Published</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-yellow-500">{stats.draft}</div>
            <div className="text-sm text-muted-foreground">Drafts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-blue-500">{stats.totalViews}</div>
            <div className="text-sm text-muted-foreground">Total Views</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Button
              variant={selectedStatus === "all" ? "default" : "outline"}
              onClick={() => setSelectedStatus("all")}
            >
              All
            </Button>
            <Button
              variant={selectedStatus === "published" ? "default" : "outline"}
              onClick={() => setSelectedStatus("published")}
            >
              Published
            </Button>
            <Button
              variant={selectedStatus === "draft" ? "default" : "outline"}
              onClick={() => setSelectedStatus("draft")}
            >
              Drafts
            </Button>
            <Button
              variant={selectedStatus === "archived" ? "default" : "outline"}
              onClick={() => setSelectedStatus("archived")}
            >
              Archived
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Posts List */}
      {posts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-xl font-semibold">No blog posts yet</h3>
            <p className="mb-6 text-muted-foreground">
              Create your first blog post to share knowledge with your audience
            </p>
            <Button asChild>
              <Link href={`/store/${storeId}/blog/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Post
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {posts.map((post: any) => (
            <Card key={post._id} className="transition-shadow hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <h3 className="text-xl font-semibold">{post.title}</h3>
                      <Badge
                        variant={
                          post.status === "published"
                            ? "default"
                            : post.status === "draft"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {post.status}
                      </Badge>
                      {post.category && <Badge variant="outline">{post.category}</Badge>}
                    </div>

                    {post.excerpt && (
                      <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                        {post.excerpt}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      {post.publishedAt && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{format(post.publishedAt, "MMM d, yyyy")}</span>
                        </div>
                      )}
                      {typeof post.views === "number" && (
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          <span>{post.views} views</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>Updated {format(post.updatedAt, "MMM d, yyyy")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-white dark:bg-black" align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/store/${storeId}/blog/${post._id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      {post.status === "published" && (
                        <DropdownMenuItem asChild>
                          <Link href={`/blog/${post.slug}`} target="_blank">
                            <Eye className="mr-2 h-4 w-4" />
                            View Live
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => handleDelete(post._id)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

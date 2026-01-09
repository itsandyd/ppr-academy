"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Sparkles, Loader2, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { TiptapEditor } from "@/components/editor/tiptap-editor";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  excerpt: z.string().optional(),
  content: z.string().min(1, "Content is required"),
  coverImage: z.string().url().optional().or(z.literal("")),
  category: z.string().optional(),
  tags: z.string().optional(), // comma-separated
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  keywords: z.string().optional(), // comma-separated
  status: z.enum(["draft", "published", "archived"]),
  readTimeMinutes: z.number().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function BlogEditorPage() {
  const router = useRouter();
  const { user } = useUser();
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const createPost = useMutation(api.blog.createPost);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: "draft",
    },
  });

  const titleWatch = watch("title");

  // Auto-generate slug from title
  useEffect(() => {
    if (titleWatch) {
      const slug = titleWatch
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      setValue("slug", slug);
    }
  }, [titleWatch, setValue]);

  // Calculate estimated read time from content
  useEffect(() => {
    const text = content.replace(/<[^>]*>/g, ""); // Strip HTML
    const words = text.trim().split(/\s+/).length;
    const readTime = Math.ceil(words / 200); // 200 words per minute
    setValue("readTimeMinutes", readTime);
  }, [content, setValue]);

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags([...selectedTags, trimmed]);
    }
  };

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag));
  };

  const addKeyword = (keyword: string) => {
    const trimmed = keyword.trim();
    if (trimmed && !selectedKeywords.includes(trimmed)) {
      setSelectedKeywords([...selectedKeywords, trimmed]);
    }
  };

  const removeKeyword = (keyword: string) => {
    setSelectedKeywords(selectedKeywords.filter((k) => k !== keyword));
  };

  const handleGenerateCoverImage = async () => {
    const title = watch("title");
    const excerpt = watch("excerpt");

    if (!title) {
      setImageError("Please enter a title before generating an image");
      return;
    }

    setIsGeneratingImage(true);
    setImageError(null);

    try {
      console.log("🎨 Generating cover image with:", { title, excerpt });

      const response = await fetch("/api/generate-thumbnail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title,
          description: excerpt || title,
          category: watch("category") || "blog",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate image");
      }

      if (data.success && data.imageUrl) {
        setValue("coverImage", data.imageUrl);
      } else {
        throw new Error("Invalid response from AI service");
      }
    } catch (error: any) {
      console.error("Error generating cover image:", error);
      setImageError(error.message || "Failed to generate image. Please try again.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!user) {
      toast.error("You must be logged in to create a post");
      return;
    }

    try {
      await createPost({
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        content,
        coverImage: data.coverImage || undefined,
        authorId: user.id,
        authorName: user.fullName || user.firstName || undefined,
        authorAvatar: user.imageUrl || undefined,
        category: data.category,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        keywords: selectedKeywords.length > 0 ? selectedKeywords : undefined,
        status: data.status,
        readTimeMinutes: data.readTimeMinutes,
      });

      toast.success(`Blog post ${data.status === "published" ? "published" : "saved as draft"}!`);
      router.push(`/dashboard?mode=create`);
    } catch (error: any) {
      console.error("Error creating post:", error);
      toast.error(error.message || "Failed to create blog post");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/create">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Product Selector
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Blog Post</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="Enter blog post title..."
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">
                URL Slug <span className="text-red-500">*</span>
              </Label>
              <Input
                id="slug"
                {...register("slug")}
                placeholder="auto-generated-from-title"
                className={errors.slug ? "border-red-500" : ""}
              />
              {errors.slug && (
                <p className="text-sm text-red-500">{errors.slug.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                This will be the URL: /blog/{watch("slug") || "your-slug"}
              </p>
            </div>

            {/* Excerpt */}
            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                {...register("excerpt")}
                placeholder="A brief summary of your post (used in listings)"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                This appears in blog listings and search results
              </p>
            </div>

            {/* Cover Image */}
            <div className="space-y-2">
              <Label htmlFor="coverImage">Cover Image URL</Label>
              
              {/* AI Generation Button */}
              <div className="flex items-center gap-2 mb-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateCoverImage}
                  disabled={isGeneratingImage || !watch("title")}
                  className="gap-2"
                >
                  {isGeneratingImage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {isGeneratingImage ? "Generating..." : "Generate with AI"}
                </Button>
                {!watch("title") && (
                  <p className="text-xs text-muted-foreground">
                    Enter a title first to generate an image
                  </p>
                )}
              </div>

              {/* Error message */}
              {imageError && (
                <div className="text-sm bg-destructive/10 p-3 rounded mb-2">
                  <p className="text-destructive font-medium">{imageError}</p>
                  {imageError.includes('billing') && (
                    <div className="text-muted-foreground text-xs space-y-1 mt-2">
                      <p>• Visit platform.openai.com/account/billing to add credits</p>
                      <p>• Image generation costs ~$0.04-0.08 per image</p>
                      <p>• You can enter an image URL manually below</p>
                    </div>
                  )}
                </div>
              )}

              <Input
                id="coverImage"
                {...register("coverImage")}
                placeholder="https://example.com/image.jpg or generate with AI"
                type="url"
              />
              {errors.coverImage && (
                <p className="text-sm text-red-500">{errors.coverImage.message}</p>
              )}
              
              {/* Image Preview */}
              {watch("coverImage") && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                  <div className="relative w-full max-w-md rounded-lg overflow-hidden border border-border">
                    <img
                      src={watch("coverImage")}
                      alt="Cover preview"
                      className="w-full h-auto object-cover"
                      onError={() => {
                        setImageError("Failed to load image preview");
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Content Editor */}
            <div className="space-y-2">
              <Label htmlFor="content">
                Content <span className="text-red-500">*</span>
              </Label>
              <TiptapEditor
                content={content}
                onChange={setContent}
                placeholder="Start writing your blog post... Use the toolbar above to format your content."
              />
              {!content && (
                <p className="text-sm text-red-500">Content is required</p>
              )}
            </div>

            {/* Category & Tags */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select onValueChange={(value) => setValue("category", value)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-black">
                    <SelectItem value="tutorials">Tutorials</SelectItem>
                    <SelectItem value="tips">Tips & Tricks</SelectItem>
                    <SelectItem value="news">News</SelectItem>
                    <SelectItem value="guides">Guides</SelectItem>
                    <SelectItem value="resources">Resources</SelectItem>
                    <SelectItem value="case-studies">Case Studies</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">
                  Status <span className="text-red-500">*</span>
                </Label>
                <Select onValueChange={(value: any) => setValue("status", value)} defaultValue="draft">
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-black">
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag(e.currentTarget.value);
                      e.currentTarget.value = "";
                    }
                  }}
                />
              </div>
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedTags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Press Enter to add a tag
              </p>
            </div>
          </CardContent>
        </Card>

        {/* SEO Settings */}
        <Card>
          <CardHeader>
            <CardTitle>SEO Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Meta Title */}
            <div className="space-y-2">
              <Label htmlFor="metaTitle">Meta Title</Label>
              <Input
                id="metaTitle"
                {...register("metaTitle")}
                placeholder="Custom title for search engines"
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to use the post title
              </p>
            </div>

            {/* Meta Description */}
            <div className="space-y-2">
              <Label htmlFor="metaDescription">Meta Description</Label>
              <Textarea
                id="metaDescription"
                {...register("metaDescription")}
                placeholder="Description for search engines (150-160 characters)"
                rows={3}
                maxLength={160}
              />
            </div>

            {/* Keywords */}
            <div className="space-y-2">
              <Label>SEO Keywords</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a keyword..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addKeyword(e.currentTarget.value);
                      e.currentTarget.value = "";
                    }
                  }}
                />
              </div>
              {selectedKeywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedKeywords.map((keyword) => (
                    <Badge key={keyword} variant="outline">
                      {keyword}
                      <button
                        type="button"
                        onClick={() => removeKeyword(keyword)}
                        className="ml-2"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Press Enter to add a keyword
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Submit Actions */}
        <div className="flex gap-4">
          <Button type="submit" size="lg" className="flex-1">
            <Save className="w-4 h-4 mr-2" />
            {watch("status") === "published" ? "Publish" : "Save Draft"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => router.push(`/dashboard?mode=create`)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}


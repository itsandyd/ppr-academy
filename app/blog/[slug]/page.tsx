import { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import BlogPostPageClient from "./client";
import { generateBlogPostingStructuredData, generateBreadcrumbStructuredData } from "@/lib/seo/structured-data";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ppracademy.com";

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const post = await fetchQuery(api.blog.getPostBySlug, { slug });

    if (!post) {
      return {
        title: "Blog Post Not Found | PPR Academy",
        description: "This blog post could not be found.",
      };
    }

    const title = post.metaTitle || post.title;
    const description = post.metaDescription || post.excerpt || `Read "${post.title}" on PPR Academy Blog`;
    const postUrl = `${baseUrl}/blog/${slug}`;

    return {
      title: `${title} | PPR Academy Blog`,
      description,
      keywords: post.keywords || post.tags || [],
      authors: post.authorName ? [{ name: post.authorName }] : undefined,
      openGraph: {
        title,
        description,
        url: postUrl,
        siteName: "PPR Academy",
        type: "article",
        publishedTime: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
        modifiedTime: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
        authors: post.authorName ? [post.authorName] : undefined,
        section: post.category || undefined,
        tags: post.tags || undefined,
        images: post.coverImage
          ? [
              {
                url: post.coverImage,
                width: 1200,
                height: 630,
                alt: post.title,
              },
            ]
          : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: post.coverImage ? [post.coverImage] : undefined,
      },
      alternates: {
        canonical: post.canonicalUrl || postUrl,
      },
    };
  } catch (error) {
    console.error("Error generating blog metadata:", error);
    return {
      title: "Blog | PPR Academy",
      description: "Read our latest articles on music production, creative tips, and industry insights.",
    };
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;

  // Fetch post data for structured data
  let structuredDataHtml: { __html: string } | null = null;
  let breadcrumbDataHtml: { __html: string } | null = null;

  try {
    const post = await fetchQuery(api.blog.getPostBySlug, { slug });

    if (post) {
      const postUrl = `${baseUrl}/blog/${slug}`;

      structuredDataHtml = generateBlogPostingStructuredData({
        headline: post.title,
        description: post.excerpt || undefined,
        author: {
          name: post.authorName || "PPR Academy",
          image: post.authorAvatar || undefined,
        },
        datePublished: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
        dateModified: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
        imageUrl: post.coverImage || undefined,
        url: postUrl,
        category: post.category || undefined,
        tags: post.tags || undefined,
        readTimeMinutes: post.readTimeMinutes || undefined,
      });

      breadcrumbDataHtml = generateBreadcrumbStructuredData({
        items: [
          { name: "Home", url: baseUrl },
          { name: "Blog", url: `${baseUrl}/blog` },
          { name: post.title, url: postUrl },
        ],
      });
    }
  } catch (error) {
    console.error("Error generating blog structured data:", error);
  }

  return (
    <>
      {/* JSON-LD Structured Data */}
      {structuredDataHtml && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={structuredDataHtml}
        />
      )}
      {breadcrumbDataHtml && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={breadcrumbDataHtml}
        />
      )}
      <BlogPostPageClient slug={slug} />
    </>
  );
}

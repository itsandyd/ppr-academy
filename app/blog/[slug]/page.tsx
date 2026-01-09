import { Metadata } from "next";
import BlogPostPageClient from "./client";

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Blog Post | PPR Academy`,
    description: "Read our latest blog post on PPR Academy",
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  return <BlogPostPageClient slug={slug} />;
}

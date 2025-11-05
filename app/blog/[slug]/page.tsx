import { Metadata } from "next";
import BlogPostPageClient from "./client";

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

// This will be populated by the client component
export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  // Note: We can't use fetchQuery here easily, so we'll rely on dynamic metadata
  // The client component will handle the full rendering
  return {
    title: `Blog Post | PPR Academy`,
    description: "Read our latest blog post on PPR Academy",
  };
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  return <BlogPostPageClient params={params} />;
}

import { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { PublicLandingPage } from "./client";

interface Props {
  params: { slug: string; pageSlug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const page = await fetchQuery(api.landingPages.getLandingPageBySlug, {
      storeSlug: params.slug,
      pageSlug: params.pageSlug,
    });

    if (!page) {
      return {
        title: "Page Not Found",
      };
    }

    return {
      title: page.metaTitle || page.title,
      description: page.metaDescription || page.description,
      openGraph: {
        title: page.metaTitle || page.title,
        description: page.metaDescription || page.description,
        images: page.metaImage ? [page.metaImage] : undefined,
      },
    };
  } catch {
    return {
      title: "Page Not Found",
    };
  }
}

export default async function LandingPageRoute({ params }: Props) {
  const page = await fetchQuery(api.landingPages.getLandingPageBySlug, {
    storeSlug: params.slug,
    pageSlug: params.pageSlug,
  });

  if (!page || !page.isPublished) {
    notFound();
  }

  return <PublicLandingPage page={page} storeSlug={params.slug} />;
}

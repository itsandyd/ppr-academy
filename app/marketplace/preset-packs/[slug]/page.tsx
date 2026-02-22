import { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { notFound } from "next/navigation";
import { PresetPackDetailClient } from "./PresetPackDetailClient";
import {
  generateProductStructuredData,
  generateBreadcrumbStructuredData,
} from "@/lib/seo/structured-data";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pauseplayrepeat.com";

interface PresetPackDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: PresetPackDetailPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const product = await fetchQuery(api.presetPacks.getBySlug, { slug });

    if (!product) {
      return {
        title: "Preset Pack Not Found | PausePlayRepeat",
        description: "This preset pack is no longer available.",
      };
    }

    const priceText =
      product.price === 0 ? "Free" : `$${product.price.toFixed(2)}`;
    const pluginText = product.targetPlugin
      ? getPluginLabel(product.targetPlugin)
      : "Synth";

    return {
      title: `${product.title} | ${pluginText} Presets | PausePlayRepeat`,
      description:
        product.description ||
        `Download "${product.title}" - ${pluginText} preset pack. ${priceText}. Professional sound design for your productions.`,
      openGraph: {
        title: product.title,
        description:
          product.description ||
          `${pluginText} preset pack available for ${priceText}. Unlock professional sounds for your productions.`,
        images: product.imageUrl ? [{ url: product.imageUrl }] : [],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: product.title,
        description:
          product.description ||
          `${pluginText} preset pack for ${priceText}. Download now.`,
        images: product.imageUrl ? [product.imageUrl] : [],
      },
      alternates: {
        canonical: `${baseUrl}/marketplace/preset-packs/${slug}`,
      },
    };
  } catch {
    return {
      title: "Preset Pack | PausePlayRepeat",
      description:
        "Download professional synth presets for Serum, Vital, Massive, and more.",
    };
  }
}

export default async function PresetPackDetailPage({
  params,
}: PresetPackDetailPageProps) {
  const { slug } = await params;

  let product = null;
  try {
    product = await fetchQuery(api.presetPacks.getBySlug, { slug });
  } catch (error) {
    console.error("Error fetching preset pack:", error);
  }

  if (!product) {
    notFound();
  }

  const presetUrl = `${baseUrl}/marketplace/preset-packs/${slug}`;
  const brandName = product.store?.name || "PausePlayRepeat";

  const productData = generateProductStructuredData({
    name: product.title,
    description: product.description || `Preset pack available on PausePlayRepeat`,
    price: product.price || 0,
    currency: "USD",
    imageUrl: product.imageUrl || undefined,
    url: presetUrl,
    brand: brandName,
    category: "Preset Pack",
    availability: "InStock",
  });

  const breadcrumbData = generateBreadcrumbStructuredData({
    items: [
      { name: "Home", url: baseUrl },
      { name: "Marketplace", url: `${baseUrl}/marketplace` },
      { name: "Preset Packs", url: `${baseUrl}/marketplace/preset-packs` },
      { name: product.title, url: presetUrl },
    ],
  });

  return (
    <div className="min-h-screen px-4 md:px-0">
      <script type="application/ld+json" dangerouslySetInnerHTML={productData} />
      <script type="application/ld+json" dangerouslySetInnerHTML={breadcrumbData} />
      <PresetPackDetailClient
        productId={product._id}
        slug={product.slug || slug}
        initialProduct={product}
        initialStore={product.store}
      />
    </div>
  );
}

// Helper function for metadata
function getPluginLabel(plugin: string): string {
  const pluginMap: Record<string, string> = {
    serum: "Serum",
    vital: "Vital",
    massive: "Massive",
    "massive-x": "Massive X",
    omnisphere: "Omnisphere",
    sylenth1: "Sylenth1",
    "phase-plant": "Phase Plant",
    pigments: "Pigments",
    diva: "Diva",
    "ableton-wavetable": "Wavetable",
    "fl-sytrus": "Sytrus",
    other: "Synth",
  };
  return pluginMap[plugin] || plugin;
}

"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, Play, Music, Tag, DollarSign, User, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { ReportButton } from "@/components/shared/report-button";
import { sanitizeHtml } from "@/lib/sanitize";

interface PluginPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function PluginDetailPage({ params }: PluginPageProps) {
  const { slug } = use(params);
  const plugin = useQuery(api.plugins.getPluginBySlug, { slug });

  // Handle loading state
  if (plugin === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  // Handle not found
  if (plugin === null) {
    notFound();
  }

  const formatPrice = (price?: number, pricingType?: string) => {
    if (pricingType === "FREE") return "Free";
    if (!price) return "Free";
    return `$${price.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Link href="/marketplace/plugins">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Plugins
            </Button>
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-8 lg:col-span-2">
            {/* Plugin Header */}
            <div>
              <div className="mb-6 flex items-start gap-4">
                {plugin.image && (
                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg border border-border">
                    <Image src={plugin.image} alt={plugin.name} fill className="object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  <h1 className="mb-2 text-4xl font-bold">{plugin.name}</h1>
                  {plugin.author && (
                    <div className="mb-3 flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>{plugin.author}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={plugin.pricingType === "FREE" ? "secondary" : "default"}>
                      {plugin.pricingType}
                    </Badge>
                    {plugin.categoryName && (
                      <Badge variant="outline">
                        <Tag className="mr-1 h-3 w-3" />
                        {plugin.categoryName}
                      </Badge>
                    )}
                    {plugin.typeName && <Badge variant="outline">{plugin.typeName}</Badge>}
                  </div>
                </div>
              </div>

              {/* Description */}
              {plugin.description && (
                <div
                  className="prose max-w-none text-lg leading-relaxed text-muted-foreground dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(plugin.description) }}
                />
              )}
            </div>

            <Separator />

            {/* Video Demo */}
            {plugin.videoUrl && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    Video Demo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video overflow-hidden rounded-lg bg-muted">
                    {plugin.videoUrl.includes("youtube.com") ||
                    plugin.videoUrl.includes("youtu.be") ? (
                      <iframe
                        src={plugin.videoUrl.replace("watch?v=", "embed/")}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video src={plugin.videoUrl} controls className="h-full w-full" />
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Audio Demo */}
            {plugin.audioUrl && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="h-5 w-5" />
                    Audio Demo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <audio src={plugin.audioUrl} controls className="w-full" />
                </CardContent>
              </Card>
            )}

            {/* Video Script */}
            {plugin.videoScript && (
              <Card>
                <CardHeader>
                  <CardTitle>About This Plugin</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none dark:prose-invert">
                    <p className="whitespace-pre-wrap">{plugin.videoScript}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardContent className="space-y-6 p-6">
                {/* Price */}
                <div className="py-4 text-center">
                  <div className="mb-2 flex items-center justify-center gap-2">
                    <DollarSign className="h-6 w-6 text-muted-foreground" />
                    <span className="text-4xl font-bold">
                      {formatPrice(plugin.price, plugin.pricingType)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {plugin.pricingType === "FREEMIUM" && "Free version available"}
                  </p>
                </div>

                <Separator />

                {/* Action Buttons */}
                <div className="space-y-3">
                  {plugin.purchaseUrl && (
                    <Button
                      asChild
                      size="lg"
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      <a href={plugin.purchaseUrl} target="_blank" rel="noopener noreferrer">
                        {plugin.pricingType === "FREE" ? "Get Free" : "Buy Now"}
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  )}

                  {plugin.optInFormUrl && (
                    <Button asChild variant="outline" size="lg" className="w-full">
                      <a href={plugin.optInFormUrl} target="_blank" rel="noopener noreferrer">
                        Learn More
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  )}

                  {plugin.videoUrl && (
                    <Button
                      variant="secondary"
                      size="lg"
                      className="w-full"
                      onClick={() => {
                        document
                          .getElementById("video-section")
                          ?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Watch Demo
                    </Button>
                  )}

                  {plugin.audioUrl && (
                    <Button
                      variant="secondary"
                      size="lg"
                      className="w-full"
                      onClick={() => {
                        document
                          .getElementById("audio-section")
                          ?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      <Music className="mr-2 h-4 w-4" />
                      Listen to Demo
                    </Button>
                  )}
                </div>

                <Separator />

                {/* Plugin Details */}
                <div className="space-y-4 text-sm">
                  <h3 className="text-base font-semibold">Plugin Details</h3>

                  {plugin.author && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Developer</span>
                      <span className="font-medium">{plugin.author}</span>
                    </div>
                  )}

                  {plugin.typeName && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type</span>
                      <span className="font-medium">{plugin.typeName}</span>
                    </div>
                  )}

                  {plugin.categoryName && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category</span>
                      <span className="font-medium">{plugin.categoryName}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pricing</span>
                    <span className="font-medium">{plugin.pricingType}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-center">
                  <ReportButton
                    contentId={plugin._id}
                    contentType="product"
                    contentTitle={plugin.name}
                    creatorName={plugin.author}
                    variant="text"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

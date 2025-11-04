"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ExternalLink,
  Play,
  Music,
  Tag,
  DollarSign,
  User,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/marketplace/plugins">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Plugins
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Plugin Header */}
            <div>
              <div className="flex items-start gap-4 mb-6">
                {plugin.image && (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border flex-shrink-0">
                    <Image
                      src={plugin.image}
                      alt={plugin.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h1 className="text-4xl font-bold mb-2">{plugin.name}</h1>
                  {plugin.author && (
                    <div className="flex items-center gap-2 text-muted-foreground mb-3">
                      <User className="w-4 h-4" />
                      <span>{plugin.author}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        plugin.pricingType === "FREE"
                          ? "secondary"
                          : "default"
                      }
                    >
                      {plugin.pricingType}
                    </Badge>
                    {plugin.categoryName && (
                      <Badge variant="outline">
                        <Tag className="w-3 h-3 mr-1" />
                        {plugin.categoryName}
                      </Badge>
                    )}
                    {plugin.typeName && (
                      <Badge variant="outline">{plugin.typeName}</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {plugin.description && (
                <div 
                  className="prose dark:prose-invert max-w-none text-lg text-muted-foreground leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: plugin.description }}
                />
              )}
            </div>

            <Separator />

            {/* Video Demo */}
            {plugin.videoUrl && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="w-5 h-5" />
                    Video Demo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                    {plugin.videoUrl.includes("youtube.com") ||
                    plugin.videoUrl.includes("youtu.be") ? (
                      <iframe
                        src={plugin.videoUrl.replace("watch?v=", "embed/")}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        src={plugin.videoUrl}
                        controls
                        className="w-full h-full"
                      />
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
                    <Music className="w-5 h-5" />
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
                  <div className="prose dark:prose-invert max-w-none">
                    <p className="whitespace-pre-wrap">{plugin.videoScript}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardContent className="p-6 space-y-6">
                {/* Price */}
                <div className="text-center py-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <DollarSign className="w-6 h-6 text-muted-foreground" />
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
                      <a
                        href={plugin.purchaseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {plugin.pricingType === "FREE" ? "Get Free" : "Buy Now"}
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </a>
                    </Button>
                  )}

                  {plugin.optInFormUrl && (
                    <Button
                      asChild
                      variant="outline"
                      size="lg"
                      className="w-full"
                    >
                      <a
                        href={plugin.optInFormUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Learn More
                        <ExternalLink className="w-4 h-4 ml-2" />
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
                      <Play className="w-4 h-4 mr-2" />
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
                      <Music className="w-4 h-4 mr-2" />
                      Listen to Demo
                    </Button>
                  )}
                </div>

                <Separator />

                {/* Plugin Details */}
                <div className="space-y-4 text-sm">
                  <h3 className="font-semibold text-base">Plugin Details</h3>
                  
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}


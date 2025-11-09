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
  Download,
  Music,
  Tag,
  DollarSign,
  User,
  ArrowLeft,
  Cpu,
  Zap,
  Package,
  CheckCircle,
  AlertCircle,
  Waves,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";

interface AbletonRackPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function AbletonRackDetailPage({ params }: AbletonRackPageProps) {
  const { slug } = use(params);
  const rack = useQuery(api.abletonRacks.getAbletonRackBySlug, { slug });

  // Handle loading state
  if (rack === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  // Handle not found
  if (rack === null) {
    notFound();
  }

  const formatPrice = (price?: number) => {
    if (!price || price === 0) return "Free";
    return `$${price.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/marketplace/ableton-racks">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Ableton Racks
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Rack Header */}
            <div>
              <div className="flex items-start gap-4 mb-6">
                {rack.chainImageUrl && (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border flex-shrink-0">
                    <Image
                      src={rack.chainImageUrl}
                      alt={rack.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h1 className="text-4xl font-bold mb-2">{rack.title}</h1>
                  {rack.creatorName && (
                    <div className="flex items-center gap-2 text-muted-foreground mb-3">
                      <User className="w-4 h-4" />
                      <span>{rack.creatorName}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={rack.price === 0 ? "secondary" : "default"}>
                      {formatPrice(rack.price)}
                    </Badge>
                    {rack.rackType && (
                      <Badge variant="outline">
                        <Tag className="w-3 h-3 mr-1" />
                        {rack.rackType === "audioEffect" ? "Audio Effect" :
                         rack.rackType === "instrument" ? "Instrument" :
                         rack.rackType === "midiEffect" ? "MIDI Effect" :
                         rack.rackType === "drumRack" ? "Drum Rack" : rack.rackType}
                      </Badge>
                    )}
                    {rack.complexity && (
                      <Badge variant="outline">
                        {rack.complexity.charAt(0).toUpperCase() + rack.complexity.slice(1)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {rack.description && (
                <div className="prose dark:prose-invert max-w-none text-lg text-muted-foreground leading-relaxed">
                  <p className="whitespace-pre-wrap">{rack.description}</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Audio Demo */}
            {rack.demoAudioUrl && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="w-5 h-5" />
                    Audio Demo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <audio src={rack.demoAudioUrl} controls className="w-full" />
                </CardContent>
              </Card>
            )}

            {/* Macro Screenshots */}
            {rack.macroScreenshotUrls && rack.macroScreenshotUrls.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Waves className="w-5 h-5" />
                    Macro Controls
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {rack.macroScreenshotUrls.map((url, index) => (
                      <div key={index} className="relative aspect-video rounded-lg overflow-hidden border border-border">
                        <Image
                          src={url}
                          alt={`Macro ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Installation Notes */}
            {rack.installationNotes && (
              <Card>
                <CardHeader>
                  <CardTitle>Installation Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose dark:prose-invert max-w-none">
                    <p className="whitespace-pre-wrap">{rack.installationNotes}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Effect Types */}
            {rack.effectType && rack.effectType.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Included Effects</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {rack.effectType.map((effect, index) => (
                      <Badge key={index} variant="secondary">
                        {effect}
                      </Badge>
                    ))}
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
                      {formatPrice(rack.price)}
                    </span>
                  </div>
                </div>

                <Separator />

                {/* Action Buttons */}
                <div className="space-y-3">
                  {rack.downloadUrl && (
                    <Button
                      asChild
                      size="lg"
                      className="w-full bg-gradient-to-r from-chart-1 to-chart-2 hover:from-chart-1/90 hover:to-chart-2/90"
                    >
                      <a
                        href={rack.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {rack.price === 0 ? "Download Free" : "Buy Now"}
                        <Download className="w-4 h-4 ml-2" />
                      </a>
                    </Button>
                  )}

                  {rack.demoAudioUrl && (
                    <Button
                      variant="secondary"
                      size="lg"
                      className="w-full"
                      onClick={() => {
                        document
                          .querySelector('audio')
                          ?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      <Music className="w-4 h-4 mr-2" />
                      Listen to Demo
                    </Button>
                  )}
                </div>

                <Separator />

                {/* Rack Details */}
                <div className="space-y-4 text-sm">
                  <h3 className="font-semibold text-base">Rack Details</h3>
                  
                  {rack.abletonVersion && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ableton Version</span>
                      <span className="font-medium">{rack.abletonVersion}</span>
                    </div>
                  )}

                  {rack.minAbletonVersion && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Min Version</span>
                      <span className="font-medium">{rack.minAbletonVersion}</span>
                    </div>
                  )}

                  {rack.rackType && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type</span>
                      <span className="font-medium">
                        {rack.rackType === "audioEffect" ? "Audio Effect" :
                         rack.rackType === "instrument" ? "Instrument" :
                         rack.rackType === "midiEffect" ? "MIDI Effect" :
                         rack.rackType === "drumRack" ? "Drum Rack" : rack.rackType}
                      </span>
                    </div>
                  )}

                  {rack.macroCount !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Macros</span>
                      <span className="font-medium">{rack.macroCount}</span>
                    </div>
                  )}

                  {rack.cpuLoad && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">CPU Load</span>
                      <Badge variant={
                        rack.cpuLoad === "low" ? "secondary" :
                        rack.cpuLoad === "medium" ? "default" : "destructive"
                      }>
                        <Cpu className="w-3 h-3 mr-1" />
                        {rack.cpuLoad.charAt(0).toUpperCase() + rack.cpuLoad.slice(1)}
                      </Badge>
                    </div>
                  )}

                  {rack.fileFormat && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">File Format</span>
                      <span className="font-medium">.{rack.fileFormat}</span>
                    </div>
                  )}

                  {rack.fileSize && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">File Size</span>
                      <span className="font-medium">{rack.fileSize.toFixed(2)} MB</span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Requirements */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-base">Requirements</h3>
                  
                  <div className="flex items-start gap-2">
                    {rack.requiresMaxForLive ? (
                      <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-medium">Max for Live</p>
                      <p className="text-xs text-muted-foreground">
                        {rack.requiresMaxForLive ? "Required" : "Not Required"}
                      </p>
                    </div>
                  </div>

                  {rack.thirdPartyPlugins && rack.thirdPartyPlugins.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Third-Party Plugins</p>
                      <div className="space-y-1">
                        {rack.thirdPartyPlugins.map((plugin, index) => (
                          <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Package className="w-3 h-3" />
                            {plugin}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Genres */}
                {rack.genre && rack.genre.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="font-semibold text-base">Best For</h3>
                      <div className="flex flex-wrap gap-2">
                        {rack.genre.map((g, index) => (
                          <Badge key={index} variant="outline">
                            {g}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}


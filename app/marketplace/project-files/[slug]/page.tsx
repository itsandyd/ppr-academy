"use client";

import { use, useState } from "react";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  Tag,
  DollarSign,
  User,
  ArrowLeft,
  FolderOpen,
  Package,
  Loader2,
  ShoppingCart,
  Music,
  Layers,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";

interface ProjectFilePageProps {
  params: Promise<{
    slug: string;
  }>;
}

const DAW_LABELS: Record<string, string> = {
  ableton: "Ableton Live",
  "fl-studio": "FL Studio",
  logic: "Logic Pro",
  bitwig: "Bitwig Studio",
  "studio-one": "Studio One",
  reason: "Reason",
  cubase: "Cubase",
  "multi-daw": "Multi-DAW",
};

const DAW_ICONS: Record<string, string> = {
  ableton: "🔊",
  "fl-studio": "🎚️",
  logic: "🎹",
  bitwig: "⚡",
  "studio-one": "🎼",
  reason: "🔌",
  cubase: "🎛️",
  "multi-daw": "🔗",
};

export default function ProjectFileDetailPage({ params }: ProjectFilePageProps) {
  const { slug } = use(params);
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();
  const project = useQuery(api.projectFiles.getProjectFileBySlug, { slug });
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Handle loading state
  if (project === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  // Handle not found
  if (project === null) {
    notFound();
  }

  const formatPrice = (price?: number) => {
    if (!price || price === 0) return "Free";
    return `$${price.toFixed(2)}`;
  };

  const handlePurchase = async () => {
    // Check if user is signed in
    if (!isUserLoaded) return;

    if (!user) {
      toast.error("Please sign in to purchase");
      router.push(`/sign-in?redirect_url=/marketplace/project-files/${slug}`);
      return;
    }

    // For free products, go directly to download
    if (!project.price || project.price === 0) {
      if (project.downloadUrl) {
        window.open(project.downloadUrl, "_blank");
      } else {
        toast.error("Download not available");
      }
      return;
    }

    // For paid products, create checkout session
    setIsCheckingOut(true);
    try {
      const response = await fetch("/api/products/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: project._id,
          productSlug: slug,
          customerEmail: user.emailAddresses[0]?.emailAddress || "",
          customerName: user.fullName || user.firstName || "Customer",
          productPrice: project.price,
          productTitle: project.title,
          productImageUrl: project.imageUrl,
          userId: user.id,
          storeId: project.storeId,
        }),
      });

      const data = await response.json();

      if (data.success && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast.error(data.error || "Failed to create checkout session");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to process checkout. Please try again.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Link href="/marketplace/project-files">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Project Files
            </Button>
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-8 lg:col-span-2">
            {/* Project Header */}
            <div>
              <div className="mb-6 flex items-start gap-4">
                {project.imageUrl && (
                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg border border-border">
                    <Image
                      src={project.imageUrl}
                      alt={project.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h1 className="mb-2 text-4xl font-bold">{project.title}</h1>
                  {project.creatorName && (
                    <div className="mb-3 flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>{project.creatorName}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={project.price === 0 ? "secondary" : "default"}>
                      {formatPrice(project.price)}
                    </Badge>
                    {project.dawType && (
                      <Badge variant="outline">
                        {DAW_ICONS[project.dawType] || "📁"} {DAW_LABELS[project.dawType] || project.dawType}
                      </Badge>
                    )}
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                      <FolderOpen className="mr-1 h-3 w-3" />
                      Full Project
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Description */}
              {project.description && (
                <div className="prose max-w-none text-lg leading-relaxed text-muted-foreground dark:prose-invert">
                  <p className="whitespace-pre-wrap">{project.description}</p>
                </div>
              )}
            </div>

            <Separator />

            {/* What You'll Learn */}
            <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 dark:border-purple-900 dark:from-purple-950/30 dark:to-indigo-950/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                  <BookOpen className="h-5 w-5" />
                  What You&apos;ll Learn
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-3 sm:grid-cols-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-600" />
                    <span>Full arrangement and song structure</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-600" />
                    <span>Sound design and synthesis techniques</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-600" />
                    <span>Mixing and processing chains</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-600" />
                    <span>Automation and effects usage</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Installation Notes */}
            {project.installationNotes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Setup Instructions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none dark:prose-invert">
                    <p className="whitespace-pre-wrap">{project.installationNotes}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Genres */}
            {project.genre && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="h-5 w-5" />
                    Genre
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {(Array.isArray(project.genre) ? project.genre : [project.genre]).map((g: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {g}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tags */}
            {project.tags && project.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="outline">
                        {tag}
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
              <CardContent className="space-y-6 p-6">
                {/* Price */}
                <div className="py-4 text-center">
                  <div className="mb-2 flex items-center justify-center gap-2">
                    <DollarSign className="h-6 w-6 text-muted-foreground" />
                    <span className="text-4xl font-bold">{formatPrice(project.price)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">One-time purchase, lifetime access</p>
                </div>

                <Separator />

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={handlePurchase}
                    disabled={isCheckingOut}
                    size="lg"
                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-500/90 hover:to-indigo-500/90"
                  >
                    {isCheckingOut ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : project.price === 0 ? (
                      <>
                        Download Free
                        <Download className="ml-2 h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Buy Now
                        <ShoppingCart className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>

                <Separator />

                {/* Project Details */}
                <div className="space-y-4 text-sm">
                  <h3 className="text-base font-semibold">Project Details</h3>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium">Full DAW Project</span>
                  </div>

                  {project.dawType && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">DAW</span>
                      <span className="font-medium">
                        {DAW_ICONS[project.dawType]} {DAW_LABELS[project.dawType] || project.dawType}
                      </span>
                    </div>
                  )}

                  {project.dawVersion && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Min Version</span>
                      <span className="font-medium">{project.dawVersion}</span>
                    </div>
                  )}

                  {project.fileSize && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">File Size</span>
                      <span className="font-medium">{project.fileSize}</span>
                    </div>
                  )}
                </div>

                {/* Requirements */}
                {project.thirdPartyPlugins && project.thirdPartyPlugins.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="text-base font-semibold">Required Plugins</h3>
                      <div className="space-y-1">
                        {project.thirdPartyPlugins.map((plugin: string, index: number) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 text-xs text-muted-foreground"
                          >
                            <Package className="h-3 w-3" />
                            {plugin}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* What's Included */}
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-base font-semibold">What&apos;s Included</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Complete project file
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      All MIDI patterns
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Audio samples used
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Mixer settings & automation
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

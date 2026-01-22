"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { use, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Loader2,
  ArrowLeft,
  Download,
  ExternalLink,
  ShoppingCart,
  Share2,
  Heart,
  Check,
  Star,
  Clock,
  Package,
  BookOpen,
  Music,
  Users,
  Play,
  Pause,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProductPageProps {
  params: Promise<{
    slug: string;
    productSlug: string;
  }>;
}

export default function ProductPage({ params }: ProductPageProps) {
  const { slug, productSlug } = use(params);
  const router = useRouter();

  // State
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmittedEmail, setHasSubmittedEmail] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Fetch store by slug
  const store = useQuery(api.stores.getStoreBySlug, { slug });

  // Fetch user data if store exists
  const user = useQuery(api.users.getUserFromClerk, store ? { clerkId: store.userId } : "skip");

  // Fetch product by slug - try digital products first
  const digitalProduct = useQuery(
    api.digitalProducts.getProductBySlug,
    store && productSlug ? { storeId: store._id, slug: productSlug } : "skip"
  );

  // Fetch course by slug as fallback
  const course = useQuery(
    api.courses.getCourseBySlug,
    store && productSlug && !digitalProduct ? { slug: productSlug } : "skip"
  );

  // Mutations
  const createContact = useMutation(api.emailContacts.createContact);
  const submitLead = useMutation(api.leadSubmissions.submitLead);

  // Determine which product we have
  const product = digitalProduct || course;
  const productType = digitalProduct ? "digitalProduct" : course ? "course" : null;

  // Loading state
  if (store === undefined || (store && (user === undefined || (digitalProduct === undefined && course === undefined)))) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not found
  if (!store || !product) {
    notFound();
  }

  const displayName = user?.name || "Creator";
  const avatarUrl = user?.imageUrl || "";
  const initials = displayName
    .split(" ")
    .map((n: string) => n.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isFree = (product as any).price === 0;
  const price = (product as any).price || 0;

  // Handle email submission for free products
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !store) return;

    setIsSubmitting(true);
    try {
      const nameParts = name.trim().split(" ");
      const firstName = nameParts[0] || undefined;
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : undefined;

      await createContact({
        storeId: store._id,
        email: email.toLowerCase(),
        firstName,
        lastName,
        source: "product_page",
        sourceProductId: (product as any)._id,
      });

      if (isFree) {
        await submitLead({
          name: name.trim() || email.split("@")[0],
          email: email.toLowerCase(),
          productId: (product as any)._id,
          storeId: store._id,
          adminUserId: store.userId,
          source: "product_page",
        });
      }

      setHasSubmittedEmail(true);
    } catch (error: any) {
      if (error?.message?.includes("already exists")) {
        setHasSubmittedEmail(true);
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle download
  const handleDownload = () => {
    const downloadUrl = (product as any).downloadUrl || (product as any).url;
    if (downloadUrl) {
      window.open(downloadUrl, "_blank");
    }
  };

  // Handle share
  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({
        title: (product as any).title,
        text: (product as any).description,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  // Get product icon based on type
  const getProductIcon = () => {
    if (productType === "course") return BookOpen;
    const category = (product as any).productCategory || (product as any).category || "";
    if (category.includes("beat")) return Music;
    if (category.includes("coaching")) return Users;
    return Package;
  };

  const ProductIcon = getProductIcon();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link
            href={`/${slug}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {store.name}
          </Link>
          <Button variant="ghost" size="icon" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="relative aspect-video overflow-hidden rounded-2xl bg-gradient-to-br from-muted to-muted/80">
              {(product as any).imageUrl ? (
                <Image
                  src={(product as any).imageUrl}
                  alt={(product as any).title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <ProductIcon className="h-24 w-24 text-muted-foreground/50" />
                </div>
              )}

              {/* Audio preview for beats */}
              {(product as any).demoAudioUrl && (
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-xl">
                    {isPlaying ? (
                      <Pause className="h-6 w-6 text-primary" />
                    ) : (
                      <Play className="h-6 w-6 text-primary ml-1" />
                    )}
                  </div>
                </button>
              )}
            </div>

            {/* Creator info */}
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{displayName}</p>
                  <p className="text-sm text-muted-foreground truncate">@{slug}</p>
                </div>
                <Link href={`/${slug}`}>
                  <Button variant="outline" size="sm">
                    View Store
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {productType === "course" ? "Course" : (product as any).category || "Digital Product"}
              </Badge>
              {(product as any).skillLevel && (
                <Badge variant="secondary">{(product as any).skillLevel}</Badge>
              )}
            </div>

            {/* Title & Description */}
            <div>
              <h1 className="text-3xl font-bold md:text-4xl">{(product as any).title}</h1>
              {(product as any).description && (
                <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                  {(product as any).description}
                </p>
              )}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2">
              <span className={cn("text-4xl font-bold", isFree ? "text-emerald-500" : "text-primary")}>
                {isFree ? "FREE" : `$${price}`}
              </span>
              {productType === "course" && (
                <span className="text-sm text-muted-foreground">one-time payment</span>
              )}
            </div>

            <Separator />

            {/* Meta info */}
            {((product as any).lessonsCount || (product as any).duration || (product as any).bpm) && (
              <div className="flex flex-wrap gap-4 text-sm">
                {(product as any).lessonsCount && (
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span>{(product as any).lessonsCount} lessons</span>
                  </div>
                )}
                {(product as any).duration && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{(product as any).duration}</span>
                  </div>
                )}
                {(product as any).bpm && (
                  <div className="flex items-center gap-2">
                    <Music className="h-4 w-4 text-muted-foreground" />
                    <span>{(product as any).bpm} BPM</span>
                  </div>
                )}
              </div>
            )}

            {/* CTA Section */}
            <Card className="border-2">
              <CardContent className="p-6">
                {isFree && !hasSubmittedEmail ? (
                  <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <div className="text-center">
                      <h3 className="font-semibold">Get Free Access</h3>
                      <p className="text-sm text-muted-foreground">
                        Enter your email to download instantly
                      </p>
                    </div>
                    <div className="space-y-3">
                      <Input
                        type="text"
                        placeholder="Your name (optional)"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" size="lg" disabled={isSubmitting || !email}>
                      {isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="mr-2 h-4 w-4" />
                      )}
                      Get Free Access
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                      We respect your privacy. Unsubscribe anytime.
                    </p>
                  </form>
                ) : hasSubmittedEmail ? (
                  <div className="space-y-4 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                      <Check className="h-6 w-6 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold">You're all set!</h3>
                      <p className="text-sm text-muted-foreground">Click below to access your download</p>
                    </div>
                    <Button className="w-full" size="lg" onClick={handleDownload}>
                      <Download className="mr-2 h-4 w-4" />
                      Download Now
                    </Button>
                  </div>
                ) : productType === "course" ? (
                  <div className="space-y-4">
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => router.push(`/courses/${(product as any).slug}`)}
                    >
                      <BookOpen className="mr-2 h-4 w-4" />
                      Enroll Now - ${price}
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                      Instant access after purchase
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Button className="w-full" size="lg">
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Buy Now - ${price}
                    </Button>
                    <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Check className="h-3 w-3 text-emerald-500" />
                        Instant delivery
                      </span>
                      <span className="flex items-center gap-1">
                        <Check className="h-3 w-3 text-emerald-500" />
                        Secure checkout
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Trust signals */}
            <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                Quality guaranteed
              </span>
              <span className="flex items-center gap-1">
                <Download className="h-3 w-3" />
                Instant access
              </span>
            </div>
          </div>
        </div>

        {/* Related products section would go here */}
      </main>
    </div>
  );
}

"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Video,
  Phone,
  Headphones,
  Clock,
  Calendar,
  CheckCircle,
  Users,
  ArrowLeft,
  MessageCircle,
  Star,
  Shield,
  Zap,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { MarketplaceNavbar } from "@/components/marketplace-navbar";

interface CoachingDetailClientProps {
  productId: string;
  slug: string;
  initialProduct: any;
  initialStore: any;
}

export function CoachingDetailClient({
  productId,
  slug,
  initialProduct,
  initialStore,
}: CoachingDetailClientProps) {
  const product =
    useQuery(api.coachingProducts.getCoachingProductForBooking, {
      productId: productId as Id<"digitalProducts">,
    }) ?? initialProduct;

  const store =
    useQuery(api.stores.getStoreById, initialStore?._id ? { storeId: initialStore._id } : "skip") ??
    initialStore;

  const creator = useQuery(
    api.users.getUserFromClerk,
    product?.userId ? { clerkId: product.userId } : "skip"
  );

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Session Not Found</h1>
          <p className="mt-2 text-muted-foreground">
            This coaching session is no longer available.
          </p>
          <Link href="/marketplace/coaching">
            <Button className="mt-4">Browse Coaching Sessions</Button>
          </Link>
        </div>
      </div>
    );
  }

  const getSessionTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-5 w-5" />;
      case "audio":
        return <Headphones className="h-5 w-5" />;
      case "phone":
        return <Phone className="h-5 w-5" />;
      default:
        return <Video className="h-5 w-5" />;
    }
  };

  const getSessionTypeLabel = (type: string) => {
    switch (type) {
      case "video":
        return "Video Call";
      case "audio":
        return "Audio Call";
      case "phone":
        return "Phone Call";
      default:
        return "Video Call";
    }
  };

  const bookingUrl = store?.slug
    ? `/${store.slug}/coaching/${slug}`
    : `/marketplace/coaching/${slug}/book`;

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceNavbar />

      <div className="mx-auto max-w-6xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Link
            href="/marketplace/coaching"
            className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Coaching
          </Link>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-3">
          <motion.div
            className="space-y-6 lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="relative aspect-video overflow-hidden rounded-2xl">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 66vw"
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                  <Video className="h-20 w-20 text-purple-500/50" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                <div className="flex gap-2">
                  {product.sessionType && (
                    <Badge className="bg-purple-500 text-white">
                      {getSessionTypeIcon(product.sessionType)}
                      <span className="ml-1">{getSessionTypeLabel(product.sessionType)}</span>
                    </Badge>
                  )}
                  {product.duration && (
                    <Badge variant="secondary" className="bg-white/90 text-black">
                      <Clock className="mr-1 h-3 w-3" />
                      {product.duration} min
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h1 className="text-3xl font-bold md:text-4xl">{product.title}</h1>
              {product.description && (
                <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                  {product.description}
                </p>
              )}
            </div>

            {product.deliverables && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="mb-4 flex items-center text-xl font-semibold">
                    <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                    What You'll Get
                  </h2>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <p className="whitespace-pre-wrap text-muted-foreground">
                      {product.deliverables}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-6">
                <h2 className="mb-4 text-xl font-semibold">Session Details</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                      {getSessionTypeIcon(product.sessionType || "video")}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Session Type</p>
                      <p className="font-medium">
                        {getSessionTypeLabel(product.sessionType || "video")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                      <Clock className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="font-medium">{product.duration || 60} minutes</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                      <Calendar className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Scheduling</p>
                      <p className="font-medium">Flexible booking</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                      <MessageCircle className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Platform</p>
                      <p className="font-medium">Discord</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="mb-4 text-xl font-semibold">Why Book This Session?</h2>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10">
                      <Zap className="h-6 w-6 text-purple-500" />
                    </div>
                    <h3 className="font-medium">Personalized Feedback</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Get tailored advice specific to your music
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10">
                      <Users className="h-6 w-6 text-purple-500" />
                    </div>
                    <h3 className="font-medium">1-on-1 Attention</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Direct access to professional expertise
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10">
                      <Shield className="h-6 w-6 text-purple-500" />
                    </div>
                    <h3 className="font-medium">Safe Environment</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Ask any questions without judgment
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <div className="mb-6 text-center">
                  <div className="text-4xl font-bold text-purple-500">
                    {product.price === 0 ? "Free" : `$${product.price}`}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {product.duration || 60} minute session
                  </p>
                </div>

                <Link href={bookingUrl}>
                  <Button className="w-full bg-purple-500 hover:bg-purple-600" size="lg">
                    <Calendar className="mr-2 h-5 w-5" />
                    Book Session
                  </Button>
                </Link>

                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Select your preferred date and time on the next page
                </p>

                <Separator className="my-6" />

                {(creator || store) && (
                  <div className="space-y-4">
                    <h3 className="font-semibold">Your Coach</h3>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={creator?.imageUrl || store?.logoUrl} />
                        <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                          {creator?.name?.charAt(0) || store?.name?.charAt(0) || "C"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{creator?.name || store?.name || "Coach"}</p>
                        {store?.slug && (
                          <Link
                            href={`/${store.slug}`}
                            className="text-sm text-purple-500 hover:underline"
                          >
                            View Profile
                          </Link>
                        )}
                      </div>
                    </div>
                    {(creator?.bio || store?.description) && (
                      <p className="line-clamp-3 text-sm text-muted-foreground">
                        {creator?.bio || store?.description}
                      </p>
                    )}
                  </div>
                )}

                <Separator className="my-6" />

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Flexible scheduling</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Secure payment</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Session via Discord</span>
                  </div>
                  {product.price === 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>No payment required</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

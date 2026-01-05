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
  FileText,
  ArrowLeft,
  Download,
  ShoppingCart,
  CheckCircle,
  BookOpen,
  Zap,
  Shield,
  Clock,
  Layers,
  GraduationCap,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { MarketplaceNavbar } from "@/components/marketplace-navbar";

interface GuideDetailClientProps {
  productId: string;
  slug: string;
  initialProduct: any;
  initialStore: any;
}

export function GuideDetailClient({
  productId,
  slug,
  initialProduct,
  initialStore,
}: GuideDetailClientProps) {
  const product =
    useQuery(api.digitalProducts.getProductById, {
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
          <h1 className="text-2xl font-bold">Guide Not Found</h1>
          <p className="mt-2 text-muted-foreground">This guide is no longer available.</p>
          <Link href="/marketplace/guides">
            <Button className="mt-4">Browse Guides</Button>
          </Link>
        </div>
      </div>
    );
  }

  const purchaseUrl = store?.slug
    ? `/${store.slug}/products/${slug}`
    : `/marketplace/guides/${slug}/purchase`;

  const getFormatLabel = () => {
    const category = product.productCategory || product.productType || "";
    if (category.toLowerCase().includes("ebook")) return "eBook";
    if (category.toLowerCase().includes("cheatsheet")) return "Cheat Sheet";
    if (category.toLowerCase().includes("workbook")) return "Workbook";
    return "PDF";
  };

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
            href="/marketplace/guides"
            className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Guides
          </Link>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-3">
          <motion.div
            className="space-y-6 lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="relative overflow-hidden rounded-2xl">
              <div className="relative aspect-[4/3]">
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
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
                    <FileText className="h-32 w-32 text-emerald-500/50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                  <div className="flex gap-2">
                    <Badge className="bg-emerald-500 text-white">
                      <FileText className="mr-1 h-3 w-3" />
                      {getFormatLabel()}
                    </Badge>
                    {product.category && (
                      <Badge variant="secondary" className="bg-white/90 text-black">
                        {product.category}
                      </Badge>
                    )}
                  </div>
                  {product.price === 0 && <Badge className="bg-green-500 text-white">Free</Badge>}
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
                    What You&apos;ll Learn
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
                <h2 className="mb-4 text-xl font-semibold">Guide Details</h2>
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                      <FileText className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Format</p>
                      <p className="font-medium">{getFormatLabel()}</p>
                    </div>
                  </div>
                  {product.pageCount && (
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                        <BookOpen className="h-5 w-5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Pages</p>
                        <p className="font-medium">{product.pageCount}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                      <Clock className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Access</p>
                      <p className="font-medium">Instant Download</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                      <Layers className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Level</p>
                      <p className="font-medium">{product.level || "All Levels"}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="mb-4 text-xl font-semibold">Why Get This Guide?</h2>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                      <Zap className="h-6 w-6 text-emerald-500" />
                    </div>
                    <h3 className="font-medium">Expert Knowledge</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Learn from industry professionals
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                      <GraduationCap className="h-6 w-6 text-emerald-500" />
                    </div>
                    <h3 className="font-medium">Practical Tips</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Actionable advice you can use today
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                      <Shield className="h-6 w-6 text-emerald-500" />
                    </div>
                    <h3 className="font-medium">Lifetime Access</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Download and keep forever</p>
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
                  <div className="text-4xl font-bold text-emerald-500">
                    {product.price === 0 ? "Free" : `$${(product.price / 100).toFixed(2)}`}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{getFormatLabel()} Download</p>
                </div>

                <Link href={purchaseUrl}>
                  <Button className="w-full bg-emerald-500 hover:bg-emerald-600" size="lg">
                    {product.price === 0 ? (
                      <>
                        <Download className="mr-2 h-5 w-5" />
                        Download Free
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        Get Guide
                      </>
                    )}
                  </Button>
                </Link>

                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Instant access after purchase
                </p>

                <Separator className="my-6" />

                {(creator || store) && (
                  <div className="space-y-4">
                    <h3 className="font-semibold">Author</h3>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={creator?.imageUrl || store?.logoUrl} />
                        <AvatarFallback className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                          {creator?.name?.charAt(0) || store?.name?.charAt(0) || "A"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {creator?.name || store?.name || product.creatorName || "Author"}
                        </p>
                        {store?.slug && (
                          <Link
                            href={`/${store.slug}`}
                            className="text-sm text-emerald-500 hover:underline"
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
                    <span>Instant download</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>PDF format</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Lifetime access</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Mobile friendly</span>
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

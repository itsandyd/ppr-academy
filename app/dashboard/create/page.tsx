"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles } from "lucide-react";
import { PRODUCT_CATEGORIES, getFlowForCategory, ProductCategory } from "./types";
import { motion } from "framer-motion";
import { useValidStoreId } from "@/hooks/useStoreId";

export default function ProductTypeSelectorPage() {
  const router = useRouter();
  const storeId = useValidStoreId();

  const handleSelectCategory = (categoryId: ProductCategory) => {
    // Special routing for different product types

    // Packs (sample, preset, MIDI) go to pack creator
    if (
      categoryId === "sample-pack" ||
      categoryId === "preset-pack" ||
      categoryId === "midi-pack"
    ) {
      router.push(`/dashboard/create/pack?type=${categoryId}`);
      return;
    }

    // Courses go to course creator (placeholder for now)
    if (categoryId === "course") {
      router.push(`/dashboard/create/course?category=${categoryId}`);
      return;
    }

    // Coaching sessions (live calls)
    if (categoryId === "coaching" || categoryId === "workshop") {
      router.push(`/dashboard/create/coaching?category=${categoryId}`);
      return;
    }

    // Services (async work) - mixing, mastering, playlist curation
    if (categoryId === "mixing-service") {
      router.push(`/dashboard/create/service?type=mixing`);
      return;
    }
    if (categoryId === "mastering-service") {
      router.push(`/dashboard/create/service?type=mastering`);
      return;
    }
    if (categoryId === "playlist-curation") {
      router.push(`/dashboard/create/service?type=curation`);
      return;
    }

    // Bundles go to bundle creator
    if (categoryId === "bundle") {
      router.push(`/dashboard/create/bundle?category=${categoryId}`);
      return;
    }

    // Memberships go to membership creator
    if (categoryId === "membership") {
      router.push(`/dashboard/create/membership`);
      return;
    }

    // Effect chains go to chain creator
    if (categoryId === "effect-chain") {
      router.push(`/dashboard/create/chain?category=${categoryId}`);
      return;
    }

    // PDFs go to PDF creator
    if (categoryId === "pdf") {
      router.push(`/dashboard/create/pdf?type=guide`);
      return;
    }

    // Blog posts go to blog creator
    if (categoryId === "blog-post") {
      router.push(`/dashboard/create/blog`);
      return;
    }

    // Beat leases go to beat lease creator
    if (categoryId === "beat-lease") {
      router.push(`/dashboard/create/beat-lease`);
      return;
    }

    // Everything else goes to digital creator
    const flow = getFlowForCategory(categoryId);
    router.push(`/dashboard/create/${flow}?category=${categoryId}`);
  };

  const groupedProducts = PRODUCT_CATEGORIES.reduce(
    (acc, product) => {
      const cat = product.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(product);
      return acc;
    },
    {} as Record<string, Array<(typeof PRODUCT_CATEGORIES)[number]>>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 rounded-3xl border border-purple-200 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-12 dark:border-purple-800 dark:from-purple-950/20 dark:via-pink-950/20 dark:to-blue-950/20"
        >
          <div className="text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm dark:bg-black/50">
              <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                Unified Product Creation
              </span>
            </div>
            <h1 className="mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
              What would you like to create?
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Select a product type below. Each has a streamlined creation flow optimized for your
              workflow.
            </p>
          </div>
        </motion.div>

        {/* Product Categories */}
        <div className="space-y-10">
          {Object.entries(groupedProducts).map(([categoryName, products], categoryIndex) => (
            <motion.div
              key={categoryName}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: categoryIndex * 0.1 }}
            >
              <div className="mb-6">
                <h2 className="mb-2 text-2xl font-bold">{categoryName}</h2>
                <p className="text-muted-foreground">
                  {categoryName === "Music Production" &&
                    "Create and sell beats, samples, presets, and more"}
                  {categoryName === "Education" &&
                    "Share your knowledge through courses and workshops"}
                  {categoryName === "Services" &&
                    "Offer coaching, mixing, mastering, and curation services"}
                  {categoryName === "Digital Content" && "Share guides, templates, and content"}
                  {categoryName === "Community" && "Build and monetize your community"}
                  {categoryName === "Support" && "Let fans support your work"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {products.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: categoryIndex * 0.1 + index * 0.05 }}
                  >
                    <Card
                      className="group h-full cursor-pointer border-border transition-all duration-200 hover:scale-105 hover:shadow-lg"
                      onClick={() => handleSelectCategory(product.id as ProductCategory)}
                    >
                      <CardContent className="flex h-full flex-col items-center p-6 text-center">
                        <div className="mb-4 text-5xl">{product.icon}</div>
                        <h3 className="mb-2 text-lg font-semibold transition-colors group-hover:text-purple-600">
                          {product.label}
                        </h3>
                        <p className="mb-4 flex-1 text-sm text-muted-foreground">
                          {product.description}
                        </p>
                        <Badge variant="secondary" className="text-xs">
                          {product.flow === "digital" && "3-step wizard"}
                          {product.flow === "course" && "4-step wizard"}
                          {product.flow === "service" && "4-step wizard"}
                          {product.flow === "bundle" && "3-step wizard"}
                        </Badge>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer Help */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <Card className="border-dashed bg-muted/50">
            <CardContent className="p-8">
              <h3 className="mb-2 font-semibold">Not sure which to choose?</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Don't worry! You can always change the product type later. Each wizard guides you
                through the process step-by-step.
              </p>
              <Button variant="outline" onClick={() => router.push("/dashboard?mode=create")}>
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

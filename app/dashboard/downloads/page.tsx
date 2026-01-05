"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Music, Package, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function DownloadsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") as "learn" | "create" | null;
  const { user, isLoaded: isUserLoaded } = useUser();

  useEffect(() => {
    if (!mode || mode !== "learn") {
      router.push("/dashboard/downloads?mode=learn");
    }
  }, [mode, router]);

  const convexUser = useQuery(api.users.getUserFromClerk, user?.id ? { clerkId: user.id } : "skip");

  const userPurchases = useQuery(
    api.library.getUserPurchases,
    convexUser?.clerkId ? { userId: convexUser.clerkId } : "skip"
  );

  const purchasedPacks =
    userPurchases?.filter(
      (purchase: any) =>
        purchase.product?.productCategory === "sample-pack" ||
        purchase.product?.productCategory === "midi-pack" ||
        purchase.product?.productCategory === "preset-pack"
    ) || [];

  const purchasedSamples = purchasedPacks.flatMap((purchase: any) => {
    const pack = purchase.product;
    if (!pack?.packFiles) return [];

    try {
      const files = JSON.parse(pack.packFiles);
      return files.map((file: any) => ({
        _id: file.storageId,
        title: file.name.replace(/\.(wav|mp3|flac|aiff)$/i, ""),
        fileName: file.name,
        fileSize: file.size,
        fileUrl: file.url || file.storageId,
        storageId: file.storageId,
        packTitle: pack.title,
        packId: pack._id,
        purchaseDate: purchase._creationTime,
      }));
    } catch (e) {
      return [];
    }
  });

  const isLoading =
    !isUserLoaded || (user && convexUser === undefined) || userPurchases === undefined;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div>
            <Skeleton className="mb-2 h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500">
            <Download className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Downloads</h1>
            <p className="text-muted-foreground">Your purchased packs and samples</p>
          </div>
        </div>
        <Link href="/dashboard?mode=learn">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {purchasedPacks.length > 0 && (
        <div className="space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Package className="h-5 w-5" />
            Your Packs ({purchasedPacks.length})
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {purchasedPacks.map((purchase: any) => (
              <Card key={purchase._id} className="transition-all hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20">
                      <Package className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="mb-1 line-clamp-1 text-lg font-semibold">
                        {purchase.product?.title}
                      </h4>
                      <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                        {purchase.product?.description}
                      </p>
                      <div className="mb-4 flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Music className="h-3 w-3" />
                          {JSON.parse(purchase.product?.packFiles || "[]").length} files
                        </span>
                        <span>{new Date(purchase._creationTime).toLocaleDateString()}</span>
                      </div>
                      <Button
                        size="sm"
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        onClick={() => {
                          const samplesSection = document.getElementById(
                            `pack-${purchase.product._id}-samples`
                          );
                          samplesSection?.scrollIntoView({ behavior: "smooth" });
                        }}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        View {JSON.parse(purchase.product?.packFiles || "[]").length} Samples
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {purchasedSamples.length > 0 ? (
        <div className="space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Music className="h-5 w-5" />
            All Your Samples ({purchasedSamples.length})
          </h2>
          <div className="space-y-2">
            {purchasedSamples.map((sample: any) => (
              <Card
                key={sample._id}
                id={`pack-${sample.packId}-samples`}
                className="transition-colors hover:bg-muted/30"
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20">
                      <Music className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate font-medium">{sample.title}</h4>
                      <p className="text-sm text-muted-foreground">From: {sample.packTitle}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {(sample.fileSize / 1024).toFixed(0)} KB
                      </Badge>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={async () => {
                          try {
                            const response = await fetch(sample.fileUrl);
                            const blob = await response.blob();
                            const url = window.URL.createObjectURL(blob);
                            const link = document.createElement("a");
                            link.href = url;
                            link.download = sample.fileName;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            window.URL.revokeObjectURL(url);
                          } catch (error) {
                            console.error("Download failed:", error);
                          }
                        }}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Package className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h3 className="mb-2 text-xl font-semibold">No Downloads Yet</h3>
          <p className="mb-6 text-muted-foreground">
            Purchase sample packs, MIDI packs, or preset packs from the marketplace to build your
            library.
          </p>
          <Link href="/marketplace/samples">
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <Package className="mr-2 h-4 w-4" />
              Browse Samples
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}

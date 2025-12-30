"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Download,
  FileText,
  ExternalLink,
  Search,
  Filter,
  Calendar,
  MoreHorizontal,
  Folder,
  Link as LinkIcon,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export default function LibraryDownloadsPage() {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "digital" | "urlMedia">("all");

  const digitalProducts = useQuery(
    api.library.getUserDigitalProducts,
    user?.id ? { userId: user.id } : "skip"
  );

  const trackDownload = useMutation(api.library.trackDownload);

  const filteredProducts =
    digitalProducts?.filter((product: any) => {
      const matchesSearch =
        product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.storeName?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        filterType === "all" ||
        (filterType === "digital" && (!product.productType || product.productType === "digital")) ||
        (filterType === "urlMedia" && product.productType === "urlMedia");

      return matchesSearch && matchesFilter;
    }) || [];

  const handleDownload = async (productId: string, downloadUrl: string, title: string) => {
    if (!user?.id) return;

    try {
      // Track the download
      await trackDownload({ userId: user.id, productId: productId as any });

      // Open download link
      window.open(downloadUrl, "_blank");

      toast.success(`${title} download started`);
    } catch (error) {
      toast.error("Failed to track download");
      // Still allow download even if tracking fails
      window.open(downloadUrl, "_blank");
    }
  };

  const stats = {
    total: digitalProducts?.length || 0,
    digital:
      digitalProducts?.filter((p: any) => !p.productType || p.productType === "digital").length ||
      0,
    urlMedia: digitalProducts?.filter((p: any) => p.productType === "urlMedia").length || 0,
    totalDownloads:
      digitalProducts?.reduce((sum: number, p: any) => (p.downloadCount || 0) + sum, 0) || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Downloads</h1>
        <p className="mt-2 text-muted-foreground">Access and manage your digital content library</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Items</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.digital}</div>
            <div className="text-sm text-muted-foreground">Digital Files</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.urlMedia}</div>
            <div className="text-sm text-muted-foreground">URL/Media</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.totalDownloads}</div>
            <div className="text-sm text-muted-foreground">Total Downloads</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search downloads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex space-x-2">
          <Button
            variant={filterType === "all" ? "default" : "outline"}
            onClick={() => setFilterType("all")}
            size="sm"
          >
            All
          </Button>
          <Button
            variant={filterType === "digital" ? "default" : "outline"}
            onClick={() => setFilterType("digital")}
            size="sm"
          >
            <Folder className="mr-1 h-4 w-4" />
            Files
          </Button>
          <Button
            variant={filterType === "urlMedia" ? "default" : "outline"}
            onClick={() => setFilterType("urlMedia")}
            size="sm"
          >
            <LinkIcon className="mr-1 h-4 w-4" />
            Links
          </Button>
        </div>
      </div>

      {/* Downloads Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product: any) => (
            <Card key={product._id} className="overflow-hidden transition-shadow hover:shadow-lg">
              <div className="aspect-video overflow-hidden bg-muted">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.title}
                    width={640}
                    height={360}
                    className="h-full w-full object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    {product.productType === "urlMedia" ? (
                      <LinkIcon className="h-12 w-12 text-muted-foreground" />
                    ) : (
                      <FileText className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                )}
              </div>

              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="line-clamp-2 text-lg font-bold text-foreground">
                      {product.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">by {product.storeName}</p>
                  </div>

                  {product.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {product.description}
                    </p>
                  )}

                  <div className="flex items-center space-x-2">
                    <Badge variant={product.productType === "urlMedia" ? "default" : "secondary"}>
                      {product.productType === "urlMedia" ? "URL/Media" : "Digital File"}
                    </Badge>
                    {product.style && (
                      <Badge variant="outline" className="text-xs">
                        {product.style}
                      </Badge>
                    )}
                  </div>

                  {product.downloadCount !== undefined && (
                    <div className="text-sm text-muted-foreground">
                      <Download className="mr-1 inline h-4 w-4" />
                      Downloaded {product.downloadCount} times
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    {product.lastAccessedAt ? (
                      <>
                        Last accessed{" "}
                        {formatDistanceToNow(new Date(product.lastAccessedAt), { addSuffix: true })}
                      </>
                    ) : (
                      <>
                        Purchased{" "}
                        {formatDistanceToNow(new Date(product.purchaseDate), { addSuffix: true })}
                      </>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    {product.productType === "urlMedia" && product.url ? (
                      <Button onClick={() => window.open(product.url, "_blank")} className="flex-1">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open Link
                      </Button>
                    ) : product.downloadUrl ? (
                      <Button
                        onClick={() =>
                          handleDownload(product._id, product.downloadUrl!, product.title)
                        }
                        className="flex-1"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    ) : (
                      <Button disabled className="flex-1">
                        <Download className="mr-2 h-4 w-4" />
                        Unavailable
                      </Button>
                    )}

                    <Button variant="outline" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            {digitalProducts && digitalProducts.length === 0 ? (
              <>
                <Download className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                <h2 className="mb-2 text-2xl font-bold text-foreground">No downloads yet</h2>
                <p className="mb-6 text-muted-foreground">
                  Purchase digital products to access them here
                </p>
                <Button asChild>
                  <Link href="/courses">
                    <Search className="mr-2 h-4 w-4" />
                    Browse Products
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Search className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                <h2 className="mb-2 text-2xl font-bold text-foreground">No downloads found</h2>
                <p className="mb-6 text-muted-foreground">
                  Try adjusting your search or filter criteria
                </p>
                <Button
                  onClick={() => {
                    setSearchQuery("");
                    setFilterType("all");
                  }}
                  variant="outline"
                >
                  Clear Filters
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Package,
  Plus,
  Search,
  Music,
  Eye,
  EyeOff,
  Trash2,
  Edit,
  Download,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import Image from "next/image";

export default function PacksManagementPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const storeId = params.storeId as string;

  const [searchTerm, setSearchTerm] = useState("");

  // Queries
  const packs = useQuery(api.samplePacks.getPacksByStore, { storeId }) || [];

  // Mutations
  const togglePublish = useMutation(api.samplePacks.togglePackPublish);
  const deletePack = useMutation(api.samplePacks.deleteSamplePack);

  const filteredPacks = packs.filter((pack: any) =>
    pack.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pack.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTogglePublish = async (packId: Id<"samplePacks">) => {
    try {
      const result = await togglePublish({ packId });
      toast.success(
        result.isPublished
          ? "Pack published successfully!"
          : "Pack unpublished"
      );
    } catch (error) {
      toast.error("Failed to update pack status");
    }
  };

  const handleDelete = async (packId: Id<"samplePacks">) => {
    if (!confirm("Are you sure you want to delete this pack?")) return;

    try {
      await deletePack({ packId });
      toast.success("Pack deleted successfully");
    } catch (error) {
      toast.error("Failed to delete pack");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sample Packs</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage your sample packs
          </p>
        </div>
        <Link href={`/store/${storeId}/packs/create`}>
          <Button size="lg" className="gap-2">
            <Plus className="w-5 h-5" />
            Create Pack
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-chart-1/10 rounded-lg">
                <Package className="w-6 h-6 text-chart-1" />
              </div>
              <div>
                <p className="text-2xl font-bold">{packs.length}</p>
                <p className="text-sm text-muted-foreground">Total Packs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-chart-2/10 rounded-lg">
                <Eye className="w-6 h-6 text-chart-2" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {packs.filter((p: any) => p.isPublished).length}
                </p>
                <p className="text-sm text-muted-foreground">Published</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-chart-3/10 rounded-lg">
                <Download className="w-6 h-6 text-chart-3" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {packs.reduce((sum: number, p: any) => sum + (p.downloads || 0), 0)}
                </p>
                <p className="text-sm text-muted-foreground">Downloads</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-chart-4/10 rounded-lg">
                <DollarSign className="w-6 h-6 text-chart-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {packs.reduce((sum: number, p: any) => sum + (p.revenue || 0), 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Search packs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Packs Grid */}
      {filteredPacks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPacks.map((pack: any) => (
            <Card key={pack._id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Cover Image */}
              <div className="relative h-48 bg-gradient-to-br from-chart-1/20 to-chart-4/20">
                {pack.coverImageUrl ? (
                  <Image
                    src={pack.coverImageUrl}
                    alt={pack.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-16 h-16 text-muted-foreground/30" />
                  </div>
                )}

                {/* Status Badge */}
                <Badge
                  className={`absolute top-3 right-3 ${
                    pack.isPublished
                      ? "bg-chart-1 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {pack.isPublished ? "Published" : "Draft"}
                </Badge>
              </div>

              <CardContent className="p-6 space-y-4">
                {/* Title & Description */}
                <div>
                  <h3 className="font-bold text-lg line-clamp-1">{pack.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {pack.description}
                  </p>
                </div>

                {/* Metadata */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Music className="w-4 h-4" />
                    <span>{pack.totalSamples} samples</span>
                  </div>
                  <div className="font-bold text-chart-1">
                    {pack.creditPrice} credits
                  </div>
                </div>

                {/* Genres */}
                {pack.genres && pack.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {pack.genres.slice(0, 3).map((genre: string) => (
                      <Badge key={genre} variant="secondary" className="text-xs">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div className="text-center">
                    <div className="text-lg font-bold">{pack.downloads || 0}</div>
                    <div className="text-xs text-muted-foreground">Downloads</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">{pack.revenue || 0}</div>
                    <div className="text-xs text-muted-foreground">Revenue</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-3 gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/store/${storeId}/packs/${pack._id}/edit`)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTogglePublish(pack._id)}
                  >
                    {pack.isPublished ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(pack._id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto bg-muted rounded-full flex items-center justify-center">
              <Package className="w-10 h-10 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">No packs yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first sample pack to get started
              </p>
              <Link href={`/store/${storeId}/packs/create`}>
                <Button size="lg" className="gap-2">
                  <Plus className="w-5 h-5" />
                  Create Your First Pack
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}


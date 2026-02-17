"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Store, ShoppingBag } from "lucide-react";

interface ConvexExampleProps {
  userId: string;
}

/**
 * Example component demonstrating Convex integration
 * Shows real-time data fetching and mutations
 */
export function ConvexExample({ userId }: ConvexExampleProps) {
  const { toast } = useToast();
  const [storeName, setStoreName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Real-time query - automatically updates when data changes
  const stores = useQuery(api.stores.getStoresByUser, { userId });

  // Mutations for creating stores
  const createStore = useMutation(api.stores.createStore);
  const deleteStore = useMutation(api.stores.deleteStore);

  // Handle store creation
  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) return;

    setIsCreating(true);
    try {
      await createStore({
        name: storeName,
      });

      toast({
        title: "Store created",
        description: `Successfully created store "${storeName}"`,
      });

      setStoreName("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create store",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Handle store deletion
  const handleDeleteStore = async (storeId: string, name: string) => {
    try {
      await deleteStore({ id: storeId as any });

      toast({
        title: "Store deleted",
        description: `Successfully deleted store "${name}"`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete store",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Convex Integration Example
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            This component demonstrates real-time data fetching and mutations using Convex hooks.
            Data updates automatically across all connected clients.
          </p>

          {/* Create Store Form */}
          <form onSubmit={handleCreateStore} className="mb-6 flex gap-2">
            <Input
              placeholder="Enter store name"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              disabled={isCreating}
            />
            <Button type="submit" disabled={isCreating || !storeName.trim()}>
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Create Store
            </Button>
          </form>

          {/* Stores List */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 font-semibold">
              <ShoppingBag className="h-4 w-4" />
              Your Stores
            </h3>

            {stores === undefined ? (
              // Loading state
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : stores.length === 0 ? (
              // Empty state
              <div className="py-8 text-center text-muted-foreground">
                <Store className="mx-auto mb-2 h-12 w-12 opacity-50" />
                <p>No stores yet. Create your first store above!</p>
              </div>
            ) : (
              // Stores grid
              <div className="grid gap-3">
                {stores.map((store: any) => (
                  <Card key={store._id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium">{store.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            ID: {store._id}
                          </Badge>
                          <span>Created: {new Date(store._creationTime).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteStore(store._id, store.name)}
                      >
                        Delete
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Integration Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Integration Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-muted-foreground">
          <div>
            <strong>Real-time Query:</strong> <code>useQuery(api.stores.getStoresByUser)</code>
          </div>
          <div>
            <strong>Mutations:</strong> <code>useMutation(api.stores.createStore)</code>
          </div>
          <div>
            <strong>Automatic Updates:</strong> Data syncs across all connected clients
          </div>
          <div>
            <strong>Type Safety:</strong> Full TypeScript support with generated types
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

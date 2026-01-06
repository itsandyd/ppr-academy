"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, Rocket, BookOpen, Package, Sparkles } from "lucide-react";
import { useMembershipCreation, IncludedContent } from "../context";
import Image from "next/image";

export function MembershipContentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    state,
    updateData,
    saveTier,
    validateStep,
    canPublish,
    publishTier,
    availableCourses,
    availableProducts,
  } = useMembershipCreation();

  const tierId = searchParams.get("tierId");

  const handleBack = () => {
    router.push(`/dashboard/create/membership?step=pricing${tierId ? `&tierId=${tierId}` : ""}`);
  };

  const handlePublish = async () => {
    const result = await publishTier();
    if (result.success) {
      router.push("/dashboard?mode=create");
    }
  };

  const toggleContent = (item: any, type: "course" | "product") => {
    const currentContent = state.data.includedContent || [];
    const itemId = item._id;

    const isIncluded = currentContent.some((c) => c.id === itemId);

    if (isIncluded) {
      updateData("content", {
        includedContent: currentContent.filter((c) => c.id !== itemId),
      });
    } else {
      const newContent: IncludedContent = {
        id: itemId,
        type,
        title: item.title,
        imageUrl: item.imageUrl,
      };
      updateData("content", {
        includedContent: [...currentContent, newContent],
      });
    }
  };

  const isContentIncluded = (itemId: string) => {
    return state.data.includedContent?.some((c) => c.id === itemId) || false;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Content Access</CardTitle>
          <CardDescription>Choose what members get access to with this tier</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border bg-gradient-to-r from-primary/5 to-primary/10 p-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <div>
                <Label htmlFor="includeAll" className="text-base font-medium">
                  Include All Content
                </Label>
                <p className="text-sm text-muted-foreground">
                  Members get access to all your courses and products
                </p>
              </div>
            </div>
            <Switch
              id="includeAll"
              checked={state.data.includeAllContent || false}
              onCheckedChange={(checked) => updateData("content", { includeAllContent: checked })}
            />
          </div>

          {!state.data.includeAllContent && (
            <>
              {availableCourses.length > 0 && (
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-base">
                    <BookOpen className="h-4 w-4" />
                    Courses ({availableCourses.length})
                  </Label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {availableCourses.map((course: any) => (
                      <div
                        key={course._id}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                          isContentIncluded(course._id)
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() => toggleContent(course, "course")}
                      >
                        <Checkbox
                          checked={isContentIncluded(course._id)}
                          onCheckedChange={() => toggleContent(course, "course")}
                        />
                        {course.imageUrl && (
                          <Image
                            src={course.imageUrl}
                            alt={course.title}
                            width={48}
                            height={48}
                            className="rounded object-cover"
                          />
                        )}
                        <div className="flex-1 truncate">
                          <p className="truncate font-medium">{course.title}</p>
                          <p className="text-xs text-muted-foreground">${course.price || 0}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {availableProducts.length > 0 && (
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-base">
                    <Package className="h-4 w-4" />
                    Digital Products ({availableProducts.length})
                  </Label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {availableProducts.map((product: any) => (
                      <div
                        key={product._id}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                          isContentIncluded(product._id)
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() => toggleContent(product, "product")}
                      >
                        <Checkbox
                          checked={isContentIncluded(product._id)}
                          onCheckedChange={() => toggleContent(product, "product")}
                        />
                        {product.imageUrl && (
                          <Image
                            src={product.imageUrl}
                            alt={product.title}
                            width={48}
                            height={48}
                            className="rounded object-cover"
                          />
                        )}
                        <div className="flex-1 truncate">
                          <p className="truncate font-medium">{product.title}</p>
                          <p className="text-xs text-muted-foreground">${product.price || 0}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {availableCourses.length === 0 && availableProducts.length === 0 && (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <p className="text-muted-foreground">
                    No published courses or products found. Create some content first, or enable
                    "Include All Content" to automatically include future content.
                  </p>
                </div>
              )}
            </>
          )}

          {state.data.includedContent &&
            state.data.includedContent.length > 0 &&
            !state.data.includeAllContent && (
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm font-medium">
                  Selected: {state.data.includedContent.length} item(s)
                </p>
              </div>
            )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={saveTier} disabled={state.isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {state.isSaving ? "Saving..." : "Save Draft"}
          </Button>
          <Button
            onClick={handlePublish}
            disabled={!canPublish()}
            className="bg-gradient-to-r from-primary to-primary/80"
          >
            <Rocket className="mr-2 h-4 w-4" />
            Publish Membership
          </Button>
        </div>
      </div>
    </div>
  );
}

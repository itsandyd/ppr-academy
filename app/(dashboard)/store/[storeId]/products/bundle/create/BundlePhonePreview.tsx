"use client";

import { PhoneShell } from "@/components/shared/PhoneShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Layers, 
  GraduationCap, 
  Box, 
  Star,
  Users,
  Clock
} from "lucide-react";
import { UserResource } from "@clerk/types";

interface BundlePhonePreviewProps {
  user: UserResource;
  store?: {
    _id: string;
    name: string;
    slug?: string;
    userId: string;
  };
}

export function BundlePhonePreview({ user, store }: BundlePhonePreviewProps) {
  const displayName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}`
    : user.firstName || user.lastName || "Creator";

  const avatarUrl = user.imageUrl || "";

  return (
    <PhoneShell
      storeName={store?.name || displayName}
      displayName={displayName}
      slug={store?.slug || store?.name?.toLowerCase().replace(/\s+/g, '') || "store"}
      avatarUrl={avatarUrl}
    >
      <div className="p-4 bg-background">
        <div className="w-full space-y-3">
          {/* Bundle Card */}
          <Card className="p-6 border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 hover:shadow-lg transition-all">
            <div className="space-y-4">
              {/* Bundle Header */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Layers className="w-8 h-8 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base text-emerald-800">
                    Ableton Complete Bundle
                  </h3>
                  <p className="text-sm text-emerald-600 mt-1">
                    Everything you need to master Ableton Live
                  </p>
                </div>
              </div>

              {/* Bundle Contents Preview */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-emerald-700 uppercase tracking-wide">
                  What's Included:
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-emerald-600">
                    <GraduationCap className="w-3 h-3" />
                    <span>3 Comprehensive Courses</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-emerald-600">
                    <Box className="w-3 h-3" />
                    <span>2 Digital Resources</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-emerald-600">
                    <Star className="w-3 h-3" />
                    <span>Bonus Templates & Presets</span>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="flex items-center justify-between pt-3 border-t border-emerald-200">
                <div className="text-xs text-emerald-600">
                  <span className="line-through">$297 individual</span>
                  <span className="ml-2 font-medium">Save $98!</span>
                </div>
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                  $199
                </Badge>
              </div>

              {/* CTA */}
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                Get Bundle
              </Button>
            </div>
          </Card>

          {/* Bundle Benefits */}
          <Card className="p-4">
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-foreground">Why Choose Bundles?</h4>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Star className="w-3 h-3 text-emerald-600" />
                  <span>Save 20-30% vs individual purchases</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-3 h-3 text-emerald-600" />
                  <span>Complete learning path</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-emerald-600" />
                  <span>Lifetime access to all content</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PhoneShell>
  );
}

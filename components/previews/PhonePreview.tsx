"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Star, Users, Clock } from "lucide-react";

interface CoursePreview {
  title?: string;
  description?: string;
  category?: string;
  skillLevel?: string;
  thumbnail?: string;
  price?: number;
  modules?: number;
}

interface PhonePreviewProps {
  user?: any;
  store?: any;
  mode?: "course" | "product" | "lead-magnet";
  coursePreview?: CoursePreview;
}

export function PhonePreview({ user, store, mode = "course", coursePreview }: PhonePreviewProps) {
  return (
    <div className="relative mx-auto" style={{ width: "320px", height: "640px" }}>
      {/* Phone Frame */}
      <div className="absolute inset-0 bg-black rounded-[3rem] shadow-2xl">
        {/* Notch */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-full z-10" />

        {/* Screen */}
        <div className="absolute inset-3 bg-background rounded-[2.5rem] overflow-hidden">
          {/* Status Bar */}
          <div className="h-10 bg-card flex items-center justify-between px-6 pt-2">
            <span className="text-xs text-muted-foreground">9:41</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-2 bg-muted-foreground/50 rounded-sm" />
              <div className="w-6 h-3 border border-muted-foreground/50 rounded-sm relative">
                <div className="absolute inset-0.5 bg-green-500 rounded-sm" style={{ width: "70%" }} />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4 overflow-y-auto h-[calc(100%-40px)]">
            {/* Course Preview */}
            {mode === "course" && (
              <>
                {/* Thumbnail */}
                <div className="aspect-video bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center overflow-hidden">
                  {coursePreview?.thumbnail ? (
                    <img
                      src={coursePreview.thumbnail}
                      alt="Course thumbnail"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen className="w-12 h-12 text-white/70" />
                  )}
                </div>

                {/* Title */}
                <h3 className="font-bold text-lg leading-tight">
                  {coursePreview?.title || "Your Course Title"}
                </h3>

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  {coursePreview?.category && (
                    <Badge variant="secondary" className="text-xs">
                      {coursePreview.category}
                    </Badge>
                  )}
                  {coursePreview?.skillLevel && (
                    <Badge variant="outline" className="text-xs">
                      {coursePreview.skillLevel}
                    </Badge>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {coursePreview?.description || "Add a description to show your students what they'll learn..."}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500" />
                    <span>4.8</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>0 students</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{coursePreview?.modules || 0} modules</span>
                  </div>
                </div>

                {/* Price */}
                <div className="pt-2">
                  <span className="text-2xl font-bold">
                    {coursePreview?.price ? `$${coursePreview.price}` : "Free"}
                  </span>
                </div>

                {/* CTA Button */}
                <button className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm">
                  Enroll Now
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

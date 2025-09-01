"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Phone, Video, Calendar, User, Clock } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface CoachingCallPhonePreviewProps {
  style?: "button" | "callout" | "preview";
  title?: string;
  price?: number;
  duration?: number;
  imageUrl?: string | null;
  user?: {
    displayName: string;
    initials: string;
    avatarUrl: string;
    storeSlug: string;
  };
}

export function CoachingCallPhonePreview({ 
  style = "button",
  title = "1:1 Call with Me",
  price = 99,
  duration = 60,
  imageUrl,
  user
}: CoachingCallPhonePreviewProps) {
  const params = useParams();
  const storeId = params.storeId as string;

  return (
    <div className="lg:sticky lg:top-24">
      <Card className="w-[356px] h-[678px] rounded-3xl border-4 border-foreground/90 bg-card flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-card border-b border-border p-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user?.avatarUrl} alt={`${user?.displayName}'s profile`} />
              <AvatarFallback className="text-sm font-semibold bg-muted">
                {user?.initials || "AD"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-sm truncate block">{user?.displayName || "Coach"}</span>
              <span className="text-xs text-muted-foreground truncate block">@{user?.storeSlug || "store"}</span>
            </div>
          </div>
        </div>
        
        {/* Coaching Call Preview */}
        <div className="flex-1 p-4 overflow-y-auto bg-background">
          <div className="w-full space-y-3">
            {style === "button" && (
              /* Button Style - Simple compact card */
              <Card className="p-4 border border-gray-200 hover:shadow-md transition-all cursor-pointer touch-manipulation">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt="Coaching session"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Video className="w-6 h-6 text-teal-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">
                      {title}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {duration} min session
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Badge variant="secondary" className="text-xs">
                      ${price}
                    </Badge>
                  </div>
                </div>
              </Card>
            )}

            {style === "callout" && (
              /* Callout Style - Larger highlighted card */
              <Card className="p-6 border border-teal-200 bg-gradient-to-r from-teal-50 to-blue-50 hover:shadow-lg transition-all cursor-pointer">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {imageUrl ? (
                        <img 
                          src={imageUrl} 
                          alt="Coaching session"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Video className="w-8 h-8 text-teal-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base text-teal-800">
                        {title}
                      </h3>
                      <p className="text-sm text-teal-600 mt-1">
                        {duration} minute coaching session
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className="bg-teal-100 text-teal-800 border-teal-200">
                          ${price}
                        </Badge>
                        <span className="text-xs text-teal-600">• Click to book</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {style === "preview" && (
              /* Preview Style - Full coaching showcase */
              <div className="space-y-4">
                <Card className="overflow-hidden">
                  {/* Large Coach Image */}
                  <div className="w-full h-48 bg-gradient-to-br from-teal-100 to-blue-100 flex items-center justify-center overflow-hidden">
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt="Coaching session"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center">
                        <div className="w-20 h-20 bg-muted/50 rounded-lg mx-auto mb-2 flex items-center justify-center">
                          <User className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <span className="text-sm text-muted-foreground">Coach Photo</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Coaching Details */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg">
                        {title}
                      </h3>
                      <Badge className="bg-teal-100 text-teal-800 text-sm">
                        ${price}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{duration} minutes</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Video className="w-4 h-4" />
                        <span>Video call</span>
                      </div>
                    </div>
                    
                    <button className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 px-4 rounded-lg transition-colors">
                      Book Now
                    </button>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
} 
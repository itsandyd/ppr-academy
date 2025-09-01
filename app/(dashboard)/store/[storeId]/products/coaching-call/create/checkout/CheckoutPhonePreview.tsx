"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Video, Calendar, Clock, User } from "lucide-react";

interface CheckoutPhonePreviewProps {
  title?: string;
  description?: string;
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

export function CheckoutPhonePreview({ 
  title = "1:1 Call with Me",
  description = "",
  price = 99,
  duration = 60,
  imageUrl,
  user
}: CheckoutPhonePreviewProps) {
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
        
        {/* Coaching Call Checkout Preview */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-4">
            {/* Large Coach Image */}
            <div className="w-full h-48 bg-gradient-to-br from-teal-100 to-blue-100 rounded-lg flex items-center justify-center overflow-hidden">
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
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg leading-tight">
                  {title}
                </h3>
                <Badge className="bg-teal-100 text-teal-800">
                  ${price}
                </Badge>
              </div>
              
              {/* Description */}
              {description && (
                <div 
                  className="text-sm text-muted-foreground leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: description }}
                />
              )}
              
              {/* Session Details */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></span>
                  <span>{duration} minute video call</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></span>
                  <span>Flexible scheduling</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></span>
                  <span>Follow-up support included</span>
                </div>
              </div>
            </div>

            {/* Booking Form */}
            <div className="space-y-3 pt-4">
              <Button 
                className="w-full bg-teal-600 hover:bg-teal-700 text-white h-10 rounded-lg"
              >
                Book Now - ${price}
              </Button>
              
              {/* Customer Info Fields */}
              <div className="space-y-2 pt-2">
                <Input placeholder="Your Name" className="h-9 text-sm" />
                <Input placeholder="Your Email" className="h-9 text-sm" />
                <Input placeholder="Preferred Time" className="h-9 text-sm" />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

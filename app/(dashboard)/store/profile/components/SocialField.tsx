import React from "react";
import { Input } from "@/components/ui/input";
import { type LucideIcon } from "lucide-react";

interface SocialFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: LucideIcon;
  iconBg: string;
  label?: string;
}

export const SocialField = React.forwardRef<HTMLInputElement, SocialFieldProps>(
  ({ icon: Icon, iconBg, label, placeholder, ...props }, ref) => {
    return (
      <div className="flex items-center gap-3">
        {/* Icon Tile */}
        <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-4 h-4 text-white" />
        </div>

        {/* @ Divider */}
        <span className="text-muted-foreground font-medium">@</span>

        {/* Input Field */}
        <Input
          ref={ref}
          placeholder={placeholder}
          className="flex-1"
          {...props}
        />
      </div>
    );
  }
);

SocialField.displayName = "SocialField"; 
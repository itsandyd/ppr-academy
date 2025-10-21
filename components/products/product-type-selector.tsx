"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductTypeTooltip, productTypes } from "@/components/ui/product-type-tooltip";
import { 
  Music, 
  Package, 
  Headphones, 
  Play, 
  DollarSign,
  Gift,
  Calendar,
  Layers,
  BookOpen,
  FileAudio,
  Disc3,
  Radio,
  Mic2
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap = {
  Music,
  Package,
  Headphones,
  Play,
  DollarSign,
  Gift,
  Calendar,
  Layers,
  BookOpen,
  FileAudio,
  Disc3,
  Radio,
  Mic2
};

interface ProductTypeSelectorProps {
  onSelect: (typeId: string) => void;
  selectedType?: string;
  className?: string;
}

export function ProductTypeSelector({ onSelect, selectedType, className }: ProductTypeSelectorProps) {
  const productTypesList = [
    { id: 'samplePack', mapTo: 'samplePack', label: 'Sample Pack', description: 'Drums, loops, one-shots', gradient: 'from-purple-500 to-pink-500' },
    { id: 'presetPack', mapTo: 'presetPack', label: 'Preset Pack', description: 'Synth/effect settings', gradient: 'from-blue-500 to-cyan-500' },
    { id: 'midiPack', mapTo: 'midiPack', label: 'MIDI Pack', description: 'Melodies & chords', gradient: 'from-violet-500 to-purple-500' },
    { id: 'projectFile', mapTo: 'projectFile', label: 'Project File', description: 'DAW sessions', gradient: 'from-teal-500 to-emerald-500' },
    { id: 'musicCourse', mapTo: 'musicCourse', label: 'Music Course', description: 'Structured lessons', gradient: 'from-green-500 to-emerald-500' },
    { id: 'coachingCall', mapTo: 'coachingCall', label: 'Coaching Call', description: '1-on-1 mentoring', gradient: 'from-orange-500 to-red-500' },
    { id: 'workshop', mapTo: 'workshop', label: 'Workshop', description: 'Live group sessions', gradient: 'from-pink-500 to-rose-500' },
    { id: 'masterclass', mapTo: 'masterclass', label: 'Masterclass', description: 'Premium training', gradient: 'from-fuchsia-500 to-pink-500' },
    { id: 'beatLease', mapTo: 'beatLease', label: 'Beat Lease', description: 'License instrumentals', gradient: 'from-indigo-500 to-purple-500' },
    { id: 'mixingTemplate', mapTo: 'mixingTemplate', label: 'Mix Template', description: 'Effect chains', gradient: 'from-sky-500 to-blue-500' },
    { id: 'leadMagnet', mapTo: 'leadMagnet', label: 'Lead Magnet', description: 'Free content', gradient: 'from-cyan-500 to-blue-500' },
    { id: 'bundle', mapTo: 'bundle', label: 'Product Bundle', description: 'Combined products', gradient: 'from-amber-500 to-orange-500' },
    { id: 'membership', mapTo: 'membership', label: 'Membership', description: 'Monthly content', gradient: 'from-rose-500 to-red-500' }
  ];

  return (
    <div className={cn("space-y-4", className)}>
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Choose Your Product Type</h3>
        <p className="text-sm text-muted-foreground">
          Hover over each option to see examples, pricing, and tips
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {productTypesList.map((type) => {
          const productInfo = productTypes[type.mapTo];
          if (!productInfo) return null;

          const Icon = productInfo.icon;
          const isSelected = selectedType === type.id;

          return (
            <ProductTypeTooltip 
              key={type.id} 
              productTypeId={type.mapTo as keyof typeof productTypes}
              side="top"
            >
              <Card
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg group",
                  isSelected && "ring-2 ring-primary shadow-lg scale-105"
                )}
                onClick={() => onSelect(type.id)}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center gap-3">
                    {/* Icon */}
                    <div className={cn(
                      "w-12 h-12 rounded-xl bg-gradient-to-r flex items-center justify-center group-hover:scale-110 transition-transform",
                      type.gradient
                    )}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>

                    {/* Title */}
                    <div>
                      <h4 className="font-semibold text-sm mb-1">{type.label}</h4>
                      <p className="text-xs text-muted-foreground">{type.description}</p>
                    </div>

                    {/* Quick Info */}
                    <div className="flex items-center gap-2 flex-wrap justify-center">
                      <Badge variant="secondary" className="text-xs">
                        {productInfo.typicalPrice}
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        {productInfo.difficulty}
                      </Badge>
                    </div>

                    {/* Hover Prompt */}
                    <p className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      Hover for details →
                    </p>
                  </div>
                </CardContent>
              </Card>
            </ProductTypeTooltip>
          );
        })}
      </div>

      {/* Help Text */}
      <div className="text-center mt-6">
        <p className="text-sm text-muted-foreground">
          Not sure which to choose? Each card shows examples and best practices when you hover over it
        </p>
      </div>
    </div>
  );
}

// Compact version for dialogs
export function ProductTypeSelectorCompact({ onSelect, selectedType, className }: ProductTypeSelectorProps) {
  const productTypesList = [
    { id: 'samplePack', mapTo: 'samplePack', label: 'Sample Pack', icon: Music },
    { id: 'presetPack', mapTo: 'presetPack', label: 'Preset Pack', icon: Package },
    { id: 'midiPack', mapTo: 'midiPack', label: 'MIDI Pack', icon: Disc3 },
    { id: 'projectFile', mapTo: 'projectFile', label: 'Project File', icon: FileAudio },
    { id: 'musicCourse', mapTo: 'musicCourse', label: 'Music Course', icon: BookOpen },
    { id: 'coachingCall', mapTo: 'coachingCall', label: 'Coaching', icon: Headphones },
    { id: 'workshop', mapTo: 'workshop', label: 'Workshop', icon: Calendar },
    { id: 'masterclass', mapTo: 'masterclass', label: 'Masterclass', icon: Mic2 },
    { id: 'beatLease', mapTo: 'beatLease', label: 'Beat Lease', icon: DollarSign },
    { id: 'mixingTemplate', mapTo: 'mixingTemplate', label: 'Mix Template', icon: Radio },
    { id: 'leadMagnet', mapTo: 'leadMagnet', label: 'Lead Magnet', icon: Gift },
    { id: 'bundle', mapTo: 'bundle', label: 'Bundle', icon: Layers },
    { id: 'membership', mapTo: 'membership', label: 'Membership', icon: BookOpen }
  ];

  return (
    <div className={cn("space-y-3", className)}>
      {productTypesList.map((type) => {
        const Icon = type.icon;
        const isSelected = selectedType === type.id;

        return (
          <ProductTypeTooltip key={type.id} productTypeId={type.mapTo as keyof typeof productTypes} side="right">
            <div
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:border-primary hover:bg-accent",
                isSelected && "border-primary bg-accent"
              )}
              onClick={() => onSelect(type.id)}
            >
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{type.label}</p>
                <p className="text-xs text-muted-foreground">Click for details →</p>
              </div>
              {isSelected && (
                <div className="w-2 h-2 rounded-full bg-primary" />
              )}
            </div>
          </ProductTypeTooltip>
        );
      })}
    </div>
  );
}


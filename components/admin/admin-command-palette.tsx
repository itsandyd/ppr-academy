"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { 
  Search, 
  Users, 
  BookOpen, 
  Package,
  DollarSign,
  BarChart3,
  Settings,
  Mail,
  Shield,
  Activity,
  Sparkles,
  Crown,
  Zap,
  Terminal,
  ArrowRight,
  Command,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface AdminCommandPaletteProps {
  className?: string;
}

export function AdminCommandPalette({ className }: AdminCommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Toggle with Cmd+K or Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = useCallback((callback: () => void) => {
    setOpen(false);
    callback();
  }, []);

  const adminActions = [
    // Navigation
    {
      group: "Navigate",
      items: [
        { icon: BarChart3, label: "Dashboard", action: () => router.push("/admin"), color: "text-blue-500" },
        { icon: Users, label: "Manage Users", action: () => router.push("/admin/users"), color: "text-violet-500" },
        { icon: BookOpen, label: "Manage Courses", action: () => router.push("/admin/courses"), color: "text-emerald-500" },
        { icon: Package, label: "Manage Products", action: () => router.push("/admin/products"), color: "text-pink-500" },
        { icon: DollarSign, label: "Revenue Dashboard", action: () => router.push("/admin/revenue"), color: "text-green-500" },
        { icon: BarChart3, label: "Analytics", action: () => router.push("/admin/analytics"), color: "text-cyan-500" },
        { icon: Shield, label: "Content Moderation", action: () => router.push("/admin/moderation"), color: "text-amber-500" },
        { icon: Mail, label: "Email Marketing", action: () => router.push("/admin/emails"), color: "text-rose-500" },
      ]
    },
    // Quick Actions
    {
      group: "Quick Actions",
      items: [
        { icon: Users, label: "Find User by Email...", action: () => router.push("/admin/users"), color: "text-violet-500" },
        { icon: BookOpen, label: "Find Course by Title...", action: () => router.push("/admin/courses"), color: "text-emerald-500" },
        { icon: Package, label: "Find Product by Name...", action: () => router.push("/admin/products"), color: "text-pink-500" },
        { icon: Crown, label: "Promote User to Creator", action: () => router.push("/admin/users"), color: "text-amber-500" },
        { icon: Zap, label: "Send Platform Announcement", action: () => router.push("/admin/emails?action=broadcast"), color: "text-orange-500" },
      ]
    },
    // System
    {
      group: "System",
      items: [
        { icon: Settings, label: "Platform Settings", action: () => router.push("/admin/settings"), color: "text-slate-500" },
        { icon: Activity, label: "Activity Logs", action: () => router.push("/admin/activity"), color: "text-teal-500" },
        { icon: Sparkles, label: "AI Tools", action: () => router.push("/admin/ai"), color: "text-fuchsia-500" },
      ]
    }
  ];

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl",
          "bg-muted/50 hover:bg-muted border border-border/50 hover:border-border",
          "text-muted-foreground hover:text-foreground",
          "transition-all duration-200 group",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-chart-1 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline font-medium">Command</span>
        </div>
        <kbd className={cn(
          "hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg",
          "bg-background border border-border/50",
          "font-mono text-[10px] font-medium text-muted-foreground"
        )}>
          <Command className="w-3 h-3" />
          <span>K</span>
        </kbd>
      </button>

      {/* Command Dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-chart-1/5 via-transparent to-chart-3/5 pointer-events-none" />
          <CommandInput 
            placeholder="Type a command or search..." 
            className="border-b border-border/50"
          />
        </div>
        <CommandList className="max-h-[400px]">
          <CommandEmpty className="py-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
              <Search className="w-5 h-5 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground font-medium">No results found</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Try a different search term</p>
          </CommandEmpty>
          
          {adminActions.map((group, groupIndex) => (
            <div key={group.group}>
              <CommandGroup heading={group.group} className="px-2">
                {group.items.map((item, itemIndex) => {
                  const Icon = item.icon;
                  return (
                    <CommandItem
                      key={`${groupIndex}-${itemIndex}`}
                      onSelect={() => handleSelect(item.action)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer",
                        "aria-selected:bg-muted/50"
                      )}
                    >
                      <div className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-lg",
                        "bg-muted/50",
                        item.color
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="flex-1 font-medium">{item.label}</span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground/50" />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              {groupIndex < adminActions.length - 1 && (
                <CommandSeparator className="my-2" />
              )}
            </div>
          ))}
        </CommandList>
        
        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 bg-muted/30">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border/50 font-mono">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border/50 font-mono">↵</kbd>
              Select
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border/50 font-mono">esc</kbd>
              Close
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Terminal className="w-3 h-3 text-chart-1" />
            <span>Mission Control</span>
          </div>
        </div>
      </CommandDialog>
    </>
  );
}

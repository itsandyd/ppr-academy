"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffectiveUserId } from "@/lib/impersonation-context";
import { useEffect, useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarDays,
  LayoutList,
  Kanban,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Filter,
  Hash,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";
import { ContentBriefDialog } from "./content-brief-dialog";

export const dynamic = "force-dynamic";

// ── Colors & Constants ──────────────────────────────────────────────────────

const CATEGORY_META: Record<string, { color: string; dot: string; badge: string }> = {
  "Platform Replacement": { color: "text-indigo-600 dark:text-indigo-400", dot: "bg-indigo-500", badge: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20" },
  "Cost Comparison": { color: "text-red-600 dark:text-red-400", dot: "bg-red-500", badge: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20" },
  "Origin Story": { color: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500", badge: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20" },
  "Competitor Gaps": { color: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20" },
  "Learner Audience": { color: "text-violet-600 dark:text-violet-400", dot: "bg-violet-500", badge: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20" },
  "Behind the Build": { color: "text-pink-600 dark:text-pink-400", dot: "bg-pink-500", badge: "bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/20" },
  "Product Deep Dives": { color: "text-sky-600 dark:text-sky-400", dot: "bg-sky-500", badge: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20" },
  "Creator Recruitment": { color: "text-orange-600 dark:text-orange-400", dot: "bg-orange-500", badge: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20" },
  "Myth Busting": { color: "text-teal-600 dark:text-teal-400", dot: "bg-teal-500", badge: "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20" },
  Scenarios: { color: "text-purple-600 dark:text-purple-400", dot: "bg-purple-500", badge: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20" },
};

const STATUS_OPTIONS = [
  "idea", "brief", "scripted", "recording", "editing", "ready", "scheduled", "published",
] as const;

const STATUS_META: Record<string, { label: string; dot: string; bg: string }> = {
  idea:       { label: "Idea",       dot: "bg-zinc-400",    bg: "bg-zinc-100 dark:bg-zinc-800" },
  brief:      { label: "Brief",      dot: "bg-blue-500",    bg: "bg-blue-50 dark:bg-blue-950" },
  scripted:   { label: "Scripted",   dot: "bg-indigo-500",  bg: "bg-indigo-50 dark:bg-indigo-950" },
  recording:  { label: "Recording",  dot: "bg-amber-500",   bg: "bg-amber-50 dark:bg-amber-950" },
  editing:    { label: "Editing",    dot: "bg-orange-500",  bg: "bg-orange-50 dark:bg-orange-950" },
  ready:      { label: "Ready",      dot: "bg-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950" },
  scheduled:  { label: "Scheduled",  dot: "bg-purple-500",  bg: "bg-purple-50 dark:bg-purple-950" },
  published:  { label: "Published",  dot: "bg-green-500",   bg: "bg-green-50 dark:bg-green-950" },
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_LABELS_SHORT = ["M", "T", "W", "T", "F", "S", "S"];

const WEEK_THEMES = [
  "Establish Authority",
  "Deepen Pain Points",
  "Product Deep Dives 1",
  "Product Deep Dives 2",
  "Scenarios",
  "Recruitment",
  "Close & Convert",
];

type ViewMode = "calendar" | "list" | "pipeline";

type ContentBrief = {
  _id: Id<"contentBriefs">;
  _creationTime: number;
  storeId: string;
  postNumber: number;
  title: string;
  category: string;
  platform: string;
  hook: string;
  brief: string;
  visualDirection?: string;
  cta?: string;
  dmKeyword?: string;
  source?: string;
  scriptedContent?: string;
  assets?: Array<{ type: string; url?: string; storageId?: string; name: string; notes?: string }>;
  week?: number;
  dayOfWeek?: number;
  scheduledDate?: string;
  status: string;
  socialPostId?: Id<"socialMediaPosts">;
  productId?: string;
  tags?: string[];
  notes?: string;
};

// ── Main Page ───────────────────────────────────────────────────────────────

export default function ContentPlanPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const effectiveUserId = useEffectiveUserId(user?.id);

  const mode = searchParams.get("mode");

  useEffect(() => {
    if (isLoaded && mode !== "create") {
      router.replace("/dashboard?mode=learn");
    }
  }, [mode, isLoaded, router]);

  const stores = useQuery(
    api.stores.getStoresByUser,
    effectiveUserId ? { userId: effectiveUserId } : "skip"
  );

  const storeId = stores?.[0]?._id;

  const briefs = useQuery(
    api.contentBriefs.list,
    storeId ? { storeId: storeId as string } : "skip"
  ) as ContentBrief[] | undefined;

  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedBriefId, setSelectedBriefId] = useState<Id<"contentBriefs"> | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filteredBriefs = useMemo(() => {
    if (!briefs) return [];
    return briefs.filter((b) => {
      if (filterCategory !== "all" && b.category !== filterCategory) return false;
      if (filterStatus !== "all" && b.status !== filterStatus) return false;
      return true;
    });
  }, [briefs, filterCategory, filterStatus]);

  const categories = useMemo(() => {
    if (!briefs) return [];
    return [...new Set(briefs.map((b) => b.category))].sort();
  }, [briefs]);

  const stats = useMemo(() => {
    if (!briefs) return null;
    const byStatus: Record<string, number> = {};
    for (const b of briefs) byStatus[b.status] = (byStatus[b.status] || 0) + 1;
    return { total: briefs.length, byStatus };
  }, [briefs]);

  const activeFilterCount = (filterCategory !== "all" ? 1 : 0) + (filterStatus !== "all" ? 1 : 0);

  // Loading states
  if (!isLoaded || !user || stores === undefined) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-8 w-full" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      </div>
    );
  }

  if (mode !== "create") {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!storeId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <AlertCircle className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">No Store Found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a store first to use the content planner.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-8 md:gap-6 md:p-6">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight md:text-2xl">Content Planner</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {stats ? `${stats.total} briefs` : "Loading..."}
              {activeFilterCount > 0 && ` \u00b7 ${filteredBriefs.length} shown`}
            </p>
          </div>
        </div>

        {/* View toggle + filter button row */}
        <div className="flex items-center gap-2">
          {/* Segmented view toggle */}
          <div className="inline-flex items-center rounded-lg border bg-muted/50 p-0.5">
            {([
              { key: "calendar" as const, icon: CalendarDays, label: "Calendar" },
              { key: "list" as const, icon: LayoutList, label: "List" },
              { key: "pipeline" as const, icon: Kanban, label: "Pipeline" },
            ]).map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setViewMode(key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                  viewMode === key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          <div className="flex-1" />

          {/* Filter toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn("h-8 gap-1.5 text-xs", activeFilterCount > 0 && "border-primary/50 text-primary")}
          >
            <Filter className="h-3.5 w-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

        {/* Collapsible filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-2 rounded-lg border bg-card p-3">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="h-8 w-full text-xs sm:w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-8 w-full text-xs sm:w-[160px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground"
                onClick={() => { setFilterCategory("all"); setFilterStatus("all"); }}
              >
                Clear
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ── Stats (scrollable pills) ──────────────────────── */}
      {stats && stats.total > 0 && (
        <ScrollArea className="w-full">
          <div className="flex gap-2 pb-2">
            {STATUS_OPTIONS.map((s) => {
              const count = stats.byStatus[s] || 0;
              if (count === 0) return null;
              const meta = STATUS_META[s];
              return (
                <button
                  key={s}
                  onClick={() => { setFilterStatus(filterStatus === s ? "all" : s); setShowFilters(true); }}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors hover:bg-accent/50",
                    filterStatus === s && "border-primary/50 bg-primary/5"
                  )}
                >
                  <div className={cn("h-2 w-2 rounded-full", meta.dot)} />
                  <span className="text-xs font-medium capitalize">{meta.label}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">{count}</span>
                </button>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      {/* ── Views ─────────────────────────────────────────── */}
      {briefs === undefined ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : briefs.length === 0 ? (
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <Sparkles className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="font-semibold">No content briefs yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Seed your content ideas to start planning
            </p>
          </div>
        </div>
      ) : (
        <>
          {viewMode === "calendar" && <CalendarView briefs={filteredBriefs} onSelect={setSelectedBriefId} />}
          {viewMode === "list" && <ListView briefs={filteredBriefs} onSelect={setSelectedBriefId} />}
          {viewMode === "pipeline" && <PipelineView briefs={filteredBriefs} onSelect={setSelectedBriefId} />}
        </>
      )}

      {/* ── Detail Dialog ─────────────────────────────────── */}
      {selectedBriefId && (
        <ContentBriefDialog
          briefId={selectedBriefId}
          open={!!selectedBriefId}
          onClose={() => setSelectedBriefId(null)}
        />
      )}
    </div>
  );
}

// ── Calendar View ───────────────────────────────────────────────────────────
// Desktop: 7-column grid.  Mobile: stacked cards per day.

function CalendarView({
  briefs,
  onSelect,
}: {
  briefs: ContentBrief[];
  onSelect: (id: Id<"contentBriefs">) => void;
}) {
  const [expandedWeek, setExpandedWeek] = useState<number | null>(1);

  const weeks = useMemo(() => {
    const weekMap: Record<number, ContentBrief[]> = {};
    for (const b of briefs) {
      const w = b.week ?? 0;
      if (!weekMap[w]) weekMap[w] = [];
      weekMap[w].push(b);
    }
    return Object.entries(weekMap)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([week, items]) => ({ week: Number(week), items }));
  }, [briefs]);

  return (
    <div className="space-y-3">
      {weeks.map(({ week, items }) => {
        const isExpanded = expandedWeek === week;
        const theme = week > 0 && week <= WEEK_THEMES.length ? WEEK_THEMES[week - 1] : null;

        return (
          <div key={week} className="overflow-hidden rounded-xl border bg-card">
            {/* Week header — always visible, acts as accordion toggle */}
            <button
              onClick={() => setExpandedWeek(isExpanded ? null : week)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/30"
            >
              {isExpanded
                ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              }
              <div className="min-w-0 flex-1">
                <span className="text-sm font-semibold">
                  {week === 0 ? "Unassigned" : `Week ${week}`}
                </span>
                {theme && (
                  <span className="ml-2 text-xs text-muted-foreground">{theme}</span>
                )}
              </div>
              <Badge variant="outline" className="shrink-0 text-xs tabular-nums">
                {items.length}
              </Badge>
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div className="border-t">
                {/* Desktop: 7-column grid */}
                <div className="hidden md:block">
                  <div className="grid grid-cols-7 border-b bg-muted/30">
                    {DAY_LABELS.map((d) => (
                      <div key={d} className="px-2 py-1.5 text-center text-[11px] font-medium text-muted-foreground">
                        {d}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 divide-x">
                    {Array.from({ length: 7 }, (_, dayIdx) => {
                      const dayBriefs = items.filter((b) => b.dayOfWeek === dayIdx);
                      return (
                        <div key={dayIdx} className="min-h-[100px] p-1.5">
                          <div className="flex flex-col gap-1">
                            {dayBriefs.map((b) => (
                              <BriefCard key={b._id} brief={b} onClick={() => onSelect(b._id)} />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Mobile: stacked per-day groups */}
                <div className="divide-y md:hidden">
                  {Array.from({ length: 7 }, (_, dayIdx) => {
                    const dayBriefs = items.filter((b) => b.dayOfWeek === dayIdx);
                    if (dayBriefs.length === 0) return null;
                    return (
                      <div key={dayIdx} className="p-3">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-[10px] font-bold text-muted-foreground">
                            {DAY_LABELS_SHORT[dayIdx]}
                          </span>
                          <span className="text-xs font-medium text-muted-foreground">
                            {DAY_LABELS[dayIdx]}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          {dayBriefs.map((b) => (
                            <BriefCard key={b._id} brief={b} onClick={() => onSelect(b._id)} variant="mobile" />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {/* Show unslotted items (no dayOfWeek) */}
                  {items.filter((b) => b.dayOfWeek === undefined).length > 0 && (
                    <div className="p-3">
                      <div className="mb-2 text-xs font-medium text-muted-foreground">Unslotted</div>
                      <div className="flex flex-col gap-1.5">
                        {items.filter((b) => b.dayOfWeek === undefined).map((b) => (
                          <BriefCard key={b._id} brief={b} onClick={() => onSelect(b._id)} variant="mobile" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── List View ───────────────────────────────────────────────────────────────

function ListView({
  briefs,
  onSelect,
}: {
  briefs: ContentBrief[];
  onSelect: (id: Id<"contentBriefs">) => void;
}) {
  const [sortBy, setSortBy] = useState<"week" | "status" | "category">("week");

  const sorted = useMemo(() => {
    return [...briefs].sort((a, b) => {
      if (sortBy === "week") {
        const wDiff = (a.week ?? 99) - (b.week ?? 99);
        if (wDiff !== 0) return wDiff;
        return (a.dayOfWeek ?? 99) - (b.dayOfWeek ?? 99);
      }
      if (sortBy === "status") {
        return (
          STATUS_OPTIONS.indexOf(a.status as (typeof STATUS_OPTIONS)[number]) -
          STATUS_OPTIONS.indexOf(b.status as (typeof STATUS_OPTIONS)[number])
        );
      }
      return a.category.localeCompare(b.category);
    });
  }, [briefs, sortBy]);

  return (
    <div className="space-y-3">
      {/* Sort pills */}
      <div className="inline-flex items-center rounded-lg border bg-muted/50 p-0.5">
        {(["week", "status", "category"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSortBy(s)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-all",
              sortBy === s
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {/* List items */}
      <div className="flex flex-col gap-1.5">
        {sorted.map((b) => {
          const cat = CATEGORY_META[b.category];
          const status = STATUS_META[b.status];
          return (
            <button
              key={b._id}
              onClick={() => onSelect(b._id)}
              className="group flex items-center gap-3 rounded-xl border bg-card p-3 text-left transition-all hover:shadow-sm active:scale-[0.99] md:px-4"
            >
              {/* Category dot */}
              <div className={cn("h-2.5 w-2.5 shrink-0 rounded-full", cat?.dot ?? "bg-zinc-400")} />

              {/* Title & hook */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{b.title}</p>
                <p className="mt-0.5 hidden truncate text-xs text-muted-foreground sm:block">
                  {b.hook}
                </p>
              </div>

              {/* Metadata — responsive */}
              <div className="flex shrink-0 items-center gap-2">
                {/* Status pill */}
                <div className="flex items-center gap-1.5 rounded-full border px-2 py-0.5">
                  <div className={cn("h-1.5 w-1.5 rounded-full", status?.dot ?? "bg-zinc-400")} />
                  <span className="text-[11px] font-medium capitalize">{b.status}</span>
                </div>

                {/* Week/day — hidden on small screens */}
                {b.week !== undefined && (
                  <span className="hidden text-xs tabular-nums text-muted-foreground lg:inline">
                    W{b.week}{b.dayOfWeek !== undefined ? `/${DAY_LABELS[b.dayOfWeek]}` : ""}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Pipeline View ───────────────────────────────────────────────────────────
// Horizontal scroll with snap on mobile, full columns on desktop.

function PipelineView({
  briefs,
  onSelect,
}: {
  briefs: ContentBrief[];
  onSelect: (id: Id<"contentBriefs">) => void;
}) {
  const columns = useMemo(() => {
    const map: Record<string, ContentBrief[]> = {};
    for (const s of STATUS_OPTIONS) map[s] = [];
    for (const b of briefs) {
      if (map[b.status]) map[b.status].push(b);
      else map[b.status] = [b];
    }
    return STATUS_OPTIONS.map((s) => ({ status: s, items: map[s] }));
  }, [briefs]);

  return (
    <ScrollArea className="w-full">
      <div className="flex gap-3 pb-4">
        {columns.map(({ status, items }) => {
          const meta = STATUS_META[status];
          return (
            <div
              key={status}
              className="flex w-[260px] shrink-0 snap-start flex-col rounded-xl border bg-card md:w-[240px]"
            >
              {/* Column header */}
              <div className="flex items-center gap-2 border-b px-3 py-2.5">
                <div className={cn("h-2 w-2 rounded-full", meta.dot)} />
                <span className="text-xs font-semibold capitalize">{meta.label}</span>
                <span className="ml-auto text-xs tabular-nums text-muted-foreground">{items.length}</span>
              </div>

              {/* Column body */}
              <div className="flex flex-1 flex-col gap-1.5 p-2">
                {items.length === 0 && (
                  <div className="flex h-20 items-center justify-center rounded-lg border border-dashed">
                    <span className="text-[11px] text-muted-foreground">No items</span>
                  </div>
                )}
                {items.map((b) => (
                  <BriefCard key={b._id} brief={b} onClick={() => onSelect(b._id)} variant="pipeline" />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

// ── Brief Card ──────────────────────────────────────────────────────────────
// Shared card component used across all three views.

function BriefCard({
  brief,
  onClick,
  variant = "default",
}: {
  brief: ContentBrief;
  onClick: () => void;
  variant?: "default" | "mobile" | "pipeline";
}) {
  const cat = CATEGORY_META[brief.category];
  const status = STATUS_META[brief.status];

  if (variant === "mobile") {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-3 rounded-lg border bg-background p-3 text-left transition-colors active:bg-accent/30"
      >
        <div className={cn("h-2.5 w-2.5 shrink-0 rounded-full", cat?.dot ?? "bg-zinc-400")} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-tight">{brief.title}</p>
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{brief.hook}</p>
        </div>
        <div className="flex items-center gap-1 rounded-full border px-1.5 py-0.5">
          <div className={cn("h-1.5 w-1.5 rounded-full", status?.dot ?? "bg-zinc-400")} />
          <span className="text-[10px] font-medium capitalize">{brief.status}</span>
        </div>
      </button>
    );
  }

  if (variant === "pipeline") {
    return (
      <button
        onClick={onClick}
        className="w-full rounded-lg border bg-background p-2.5 text-left transition-all hover:shadow-sm active:scale-[0.98]"
      >
        <div className="flex items-start gap-2">
          <div className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", cat?.dot ?? "bg-zinc-400")} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium leading-snug">{brief.title}</p>
            {brief.dmKeyword && (
              <div className="mt-1.5 inline-flex items-center gap-1 rounded border bg-muted/50 px-1.5 py-0.5">
                <Hash className="h-2.5 w-2.5 text-muted-foreground" />
                <span className="font-mono text-[10px] text-muted-foreground">{brief.dmKeyword}</span>
              </div>
            )}
          </div>
        </div>
      </button>
    );
  }

  // Default: calendar desktop cells
  return (
    <button
      onClick={onClick}
      className="w-full rounded-lg border bg-background p-1.5 text-left transition-all hover:shadow-sm active:scale-[0.98]"
    >
      <div className="flex items-start gap-1.5">
        <div className={cn("mt-1 h-1.5 w-1.5 shrink-0 rounded-full", cat?.dot ?? "bg-zinc-400")} />
        <p className="line-clamp-2 text-[11px] font-medium leading-tight">{brief.title}</p>
      </div>
    </button>
  );
}

"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Copy,
  Trash2,
  Check,
  FileText,
  Film,
  StickyNote,
  ImageIcon,
  Hash,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  "idea", "brief", "scripted", "recording", "editing", "ready", "scheduled", "published",
] as const;

const STATUS_META: Record<string, { label: string; dot: string }> = {
  idea:       { label: "Idea",       dot: "bg-zinc-400" },
  brief:      { label: "Brief",      dot: "bg-blue-500" },
  scripted:   { label: "Scripted",   dot: "bg-indigo-500" },
  recording:  { label: "Recording",  dot: "bg-amber-500" },
  editing:    { label: "Editing",    dot: "bg-orange-500" },
  ready:      { label: "Ready",      dot: "bg-emerald-500" },
  scheduled:  { label: "Scheduled",  dot: "bg-purple-500" },
  published:  { label: "Published",  dot: "bg-green-500" },
};

const CATEGORY_COLORS: Record<string, string> = {
  "Platform Replacement": "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20",
  "Cost Comparison": "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20",
  "Origin Story": "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
  "Competitor Gaps": "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  "Learner Audience": "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20",
  "Behind the Build": "bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/20",
  "Product Deep Dives": "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20",
  "Creator Recruitment": "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20",
  "Myth Busting": "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20",
  Scenarios: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
};

type AssetType = { type: string; url?: string; storageId?: string; name: string; notes?: string };

type TabKey = "brief" | "script" | "assets" | "notes";

const TABS: { key: TabKey; label: string; icon: typeof FileText }[] = [
  { key: "brief", label: "Brief", icon: FileText },
  { key: "script", label: "Script", icon: Film },
  { key: "assets", label: "Assets", icon: ImageIcon },
  { key: "notes", label: "Notes", icon: StickyNote },
];

interface ContentBriefDialogProps {
  briefId: Id<"contentBriefs">;
  open: boolean;
  onClose: () => void;
}

export function ContentBriefDialog({ briefId, open, onClose }: ContentBriefDialogProps) {
  const brief = useQuery(api.contentBriefs.get, { id: briefId });
  const updateBrief = useMutation(api.contentBriefs.update);
  const updateStatus = useMutation(api.contentBriefs.updateStatus);
  const removeBrief = useMutation(api.contentBriefs.remove);

  const [activeTab, setActiveTab] = useState<TabKey>("brief");
  const [editTitle, setEditTitle] = useState("");
  const [editHook, setEditHook] = useState("");
  const [editBrief, setEditBrief] = useState("");
  const [editVisualDirection, setEditVisualDirection] = useState("");
  const [editCta, setEditCta] = useState("");
  const [editDmKeyword, setEditDmKeyword] = useState("");
  const [editSource, setEditSource] = useState("");
  const [editScript, setEditScript] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editTags, setEditTags] = useState("");
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (brief) {
      setEditTitle(brief.title);
      setEditHook(brief.hook);
      setEditBrief(brief.brief);
      setEditVisualDirection(brief.visualDirection ?? "");
      setEditCta(brief.cta ?? "");
      setEditDmKeyword(brief.dmKeyword ?? "");
      setEditSource(brief.source ?? "");
      setEditScript(brief.scriptedContent ?? "");
      setEditNotes(brief.notes ?? "");
      setEditTags(brief.tags?.join(", ") ?? "");
      setDirty(false);
    }
  }, [brief]);

  if (!brief) return null;

  const markDirty = () => setDirty(true);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateBrief({
        id: briefId,
        title: editTitle,
        hook: editHook,
        brief: editBrief,
        visualDirection: editVisualDirection || undefined,
        cta: editCta || undefined,
        dmKeyword: editDmKeyword || undefined,
        source: editSource || undefined,
        scriptedContent: editScript || undefined,
        notes: editNotes || undefined,
        tags: editTags ? editTags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
      });
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    await updateStatus({ id: briefId, status: newStatus });
  };

  const handleDelete = async () => {
    if (confirm("Delete this content brief? This cannot be undone.")) {
      await removeBrief({ id: briefId });
      onClose();
    }
  };

  const handleCopyBrief = async () => {
    await navigator.clipboard.writeText(editBrief);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusMeta = STATUS_META[brief.status];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[600px]">
        <DialogTitle className="sr-only">Content Brief</DialogTitle>

        {/* ── Fixed Header ──────────────────────────────────── */}
        <div className="shrink-0 border-b px-5 pb-3 pt-5">
          <Input
            value={editTitle}
            onChange={(e) => { setEditTitle(e.target.value); markDirty(); }}
            className="border-none bg-transparent px-0 text-lg font-bold shadow-none focus-visible:ring-0"
            placeholder="Brief title..."
          />

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className={cn("border text-[11px]", CATEGORY_COLORS[brief.category])}>
              {brief.category}
            </Badge>
            <Badge variant="outline" className="text-[11px]">
              {brief.platform}
            </Badge>
            {brief.dmKeyword && (
              <Badge variant="outline" className="gap-1 font-mono text-[11px]">
                <Hash className="h-2.5 w-2.5" />
                {brief.dmKeyword}
              </Badge>
            )}

            <div className="flex-1" />

            <Select value={brief.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="h-7 w-auto gap-1.5 border-none bg-muted/50 px-2 text-xs shadow-none">
                <div className={cn("h-2 w-2 rounded-full", statusMeta?.dot ?? "bg-zinc-400")} />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    <div className="flex items-center gap-2">
                      <div className={cn("h-2 w-2 rounded-full", STATUS_META[s]?.dot ?? "bg-zinc-400")} />
                      <span className="capitalize">{s}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-3 flex gap-0.5 rounded-lg bg-muted/50 p-0.5">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-all",
                  activeTab === key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden min-[400px]:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Scrollable Body ───────────────────────────────── */}
        <ScrollArea className="min-h-0 flex-1">
          <div className="p-5">
            {activeTab === "brief" && (
              <div className="space-y-4">
                <FieldGroup label="Hook">
                  <Textarea
                    value={editHook}
                    onChange={(e) => { setEditHook(e.target.value); markDirty(); }}
                    rows={2}
                    className="text-sm font-medium"
                    placeholder="The scroll-stopping first line..."
                  />
                </FieldGroup>

                <FieldGroup label="Content Brief">
                  <Textarea
                    value={editBrief}
                    onChange={(e) => { setEditBrief(e.target.value); markDirty(); }}
                    rows={10}
                    className="text-sm"
                    placeholder="Dense content brief / source material..."
                  />
                </FieldGroup>

                <FieldGroup label="Visual Direction">
                  <Textarea
                    value={editVisualDirection}
                    onChange={(e) => { setEditVisualDirection(e.target.value); markDirty(); }}
                    rows={3}
                    className="text-sm"
                    placeholder="What to show on screen..."
                  />
                </FieldGroup>

                <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
                  <FieldGroup label="CTA">
                    <Input
                      value={editCta}
                      onChange={(e) => { setEditCta(e.target.value); markDirty(); }}
                      className="text-sm"
                      placeholder="Call to action..."
                    />
                  </FieldGroup>
                  <FieldGroup label="DM Keyword">
                    <Input
                      value={editDmKeyword}
                      onChange={(e) => { setEditDmKeyword(e.target.value); markDirty(); }}
                      className="font-mono text-sm uppercase"
                      placeholder="KEYWORD"
                    />
                  </FieldGroup>
                </div>

                <FieldGroup label="Source">
                  <Textarea
                    value={editSource}
                    onChange={(e) => { setEditSource(e.target.value); markDirty(); }}
                    rows={2}
                    className="font-mono text-xs"
                    placeholder="Research file or code path..."
                  />
                </FieldGroup>
              </div>
            )}

            {activeTab === "script" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Copy the brief, run through your script tool, paste result here.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyBrief}
                    className="h-7 shrink-0 gap-1.5 text-xs"
                  >
                    {copied ? (
                      <><Check className="h-3 w-3" /> Copied</>
                    ) : (
                      <><Copy className="h-3 w-3" /> Copy Brief</>
                    )}
                  </Button>
                </div>
                <Textarea
                  value={editScript}
                  onChange={(e) => { setEditScript(e.target.value); markDirty(); }}
                  rows={18}
                  className="text-sm"
                  placeholder="Paste the final script here..."
                />
              </div>
            )}

            {activeTab === "assets" && (
              <div>
                {brief.assets && brief.assets.length > 0 ? (
                  <div className="space-y-2">
                    {brief.assets.map((asset: AssetType, i: number) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 rounded-xl border p-3"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-xs font-bold uppercase text-muted-foreground">
                          {asset.type.slice(0, 3)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{asset.name}</p>
                          {asset.notes && (
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">{asset.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-dashed">
                    <div className="text-center">
                      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">No assets yet</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Images, videos, audio & screen recordings
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "notes" && (
              <div className="space-y-4">
                <FieldGroup label="Notes">
                  <Textarea
                    value={editNotes}
                    onChange={(e) => { setEditNotes(e.target.value); markDirty(); }}
                    rows={6}
                    className="text-sm"
                    placeholder="Freeform notes..."
                  />
                </FieldGroup>

                <FieldGroup label="Tags" hint="Comma-separated">
                  <Input
                    value={editTags}
                    onChange={(e) => { setEditTags(e.target.value); markDirty(); }}
                    className="text-sm"
                    placeholder="tag1, tag2, tag3"
                  />
                </FieldGroup>

                {brief.productId && (
                  <FieldGroup label="Linked Product">
                    <p className="rounded-lg bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
                      {brief.productId}
                    </p>
                  </FieldGroup>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* ── Sticky Footer ─────────────────────────────────── */}
        <div className="shrink-0 border-t px-5 py-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="h-8 gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Delete</span>
            </Button>

            <div className="flex-1" />

            {dirty && (
              <span className="text-xs text-muted-foreground">Unsaved</span>
            )}
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!dirty || saving}
              className="h-8 gap-1.5 text-xs"
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FieldGroup({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <Label className="text-xs font-semibold">{label}</Label>
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

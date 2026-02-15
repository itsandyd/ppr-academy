"use client";

import { useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  FileText,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Download,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  CheckCircle2,
  Save,
  RefreshCw,
  BookOpen,
} from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================

interface OutlineItem {
  text: string;
  subItems?: string[];
  isTip?: boolean;
  isWarning?: boolean;
}

type SectionType = "key_takeaways" | "quick_reference" | "step_by_step" | "tips" | "comparison" | "glossary" | "custom";

interface OutlineSection {
  heading: string;
  type: SectionType;
  items: OutlineItem[];
}

interface Outline {
  title: string;
  subtitle?: string;
  sections: OutlineSection[];
  footer?: string;
}

type Step = "select" | "generating" | "edit" | "preview";

const SECTION_TYPES = [
  { value: "key_takeaways", label: "Key Takeaways" },
  { value: "quick_reference", label: "Quick Reference" },
  { value: "step_by_step", label: "Step by Step" },
  { value: "tips", label: "Pro Tips" },
  { value: "comparison", label: "Comparison" },
  { value: "glossary", label: "Glossary" },
  { value: "custom", label: "Custom" },
];

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function CheatSheetGeneratorPage() {
  const { user } = useUser();

  // Step management
  const [step, setStep] = useState<Step>("select");

  // Step 1: Course & chapter selection
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedChapterIds, setSelectedChapterIds] = useState<Set<string>>(new Set());
  const [customInstructions, setCustomInstructions] = useState("");

  // Step 2-3: Outline
  const [outline, setOutline] = useState<Outline | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Step 4: PDF
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [savedCheatSheetId, setSavedCheatSheetId] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // Saved panel
  const [showSaved, setShowSaved] = useState(false);

  // Convex queries
  const courses = useQuery(api.courses.getAllCourses) || [];
  const chapters = useQuery(
    api.courses.getCourseChaptersEnriched,
    selectedCourseId ? { courseId: selectedCourseId as Id<"courses"> } : "skip"
  );
  const savedCheatSheets = useQuery(
    api.cheatSheetMutations.listCheatSheets,
    user?.id ? { userId: user.id } : "skip"
  );

  // Convex actions/mutations
  const generateOutlineAction = useAction(api.masterAI.cheatSheetGenerator.generateOutline);
  const saveCheatSheetMutation = useMutation(api.cheatSheetMutations.saveCheatSheet);
  const updateOutlineMutation = useMutation(api.cheatSheetMutations.updateOutline);
  const publishMutation = useMutation(api.cheatSheetMutations.publishAsLeadMagnet);
  const deleteCheatSheetMutation = useMutation(api.cheatSheetMutations.deleteCheatSheet);

  // Group chapters by module
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chaptersByModule: [string, any[]][] = chapters
    ? (Object.entries(
        chapters.reduce((acc: Record<string, typeof chapters>, ch: any) => {
          const key = ch.moduleTitle || "Ungrouped";
          if (!acc[key]) acc[key] = [];
          acc[key].push(ch);
          return acc;
        }, {} as Record<string, typeof chapters>)
      ) as [string, any[]][])
    : [];

  const selectedCourse = courses.find((c: any) => c._id === selectedCourseId);

  // ─── HANDLERS ───

  const handleToggleChapter = (chapterId: string) => {
    setSelectedChapterIds((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) next.delete(chapterId);
      else next.add(chapterId);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (!chapters) return;
    setSelectedChapterIds(new Set(chapters.map((ch: any) => ch._id)));
  };

  const handleDeselectAll = () => {
    setSelectedChapterIds(new Set());
  };

  const handleGenerateOutline = async () => {
    if (!selectedCourseId || selectedChapterIds.size === 0) return;
    setIsGenerating(true);
    setStep("generating");

    try {
      const result = await generateOutlineAction({
        courseId: selectedCourseId as Id<"courses">,
        chapterIds: Array.from(selectedChapterIds),
        customInstructions: customInstructions || undefined,
      });

      setOutline(result as Outline);
      setStep("edit");
      toast.success("Outline generated successfully!");
    } catch (error) {
      console.error("Failed to generate outline:", error);
      toast.error("Failed to generate outline. Please try again.");
      setStep("select");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!outline || !user?.id || !selectedCourseId) return;

    try {
      const id = await saveCheatSheetMutation({
        cheatSheetId: savedCheatSheetId ? (savedCheatSheetId as Id<"cheatSheets">) : undefined,
        userId: user.id,
        courseId: selectedCourseId as Id<"courses">,
        courseTitle: selectedCourse?.title || "Untitled",
        selectedChapterIds: Array.from(selectedChapterIds),
        outline,
        aiModel: "gemini-2.5-flash",
      });

      setSavedCheatSheetId(id);
      toast.success("Draft saved!");
    } catch (error) {
      console.error("Failed to save:", error);
      toast.error("Failed to save draft.");
    }
  };

  const handleGeneratePdf = async () => {
    if (!outline || !user?.id || !selectedCourseId) return;
    setIsGeneratingPdf(true);

    try {
      // Save first if not saved yet
      let cheatSheetId = savedCheatSheetId;
      if (!cheatSheetId) {
        cheatSheetId = await saveCheatSheetMutation({
          userId: user.id,
          courseId: selectedCourseId as Id<"courses">,
          courseTitle: selectedCourse?.title || "Untitled",
          selectedChapterIds: Array.from(selectedChapterIds),
          outline,
          aiModel: "gemini-2.5-flash",
        });
        setSavedCheatSheetId(cheatSheetId);
      } else {
        // Update outline before generating
        await updateOutlineMutation({
          cheatSheetId: cheatSheetId as Id<"cheatSheets">,
          outline,
        });
      }

      const response = await fetch("/api/lead-magnets/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cheatSheetId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate PDF");
      }

      setPdfUrl(data.pdfUrl);
      setStep("preview");
      toast.success("PDF generated!");
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePublish = async () => {
    if (!savedCheatSheetId || !user?.id) return;
    setIsPublishing(true);

    try {
      // Use storeId from the selected course if available, fallback to userId
      const storeId = selectedCourse?.storeId || user.id;
      await publishMutation({
        cheatSheetId: savedCheatSheetId as Id<"cheatSheets">,
        storeId,
        userId: user.id,
      });
      toast.success("Published as lead magnet!");
    } catch (error) {
      console.error("Publish failed:", error);
      toast.error("Failed to publish.");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleLoadSaved = (saved: any) => {
    setSelectedCourseId(saved.courseId);
    setSelectedChapterIds(new Set(saved.selectedChapterIds || []));
    setOutline(saved.outline);
    setSavedCheatSheetId(saved._id);
    setPdfUrl(saved.pdfUrl || null);
    setStep(saved.pdfUrl ? "preview" : "edit");
    setShowSaved(false);
    toast.success(`Loaded: ${saved.outline.title}`);
  };

  const handleDeleteSaved = async (id: string) => {
    try {
      await deleteCheatSheetMutation({ cheatSheetId: id as Id<"cheatSheets"> });
      if (savedCheatSheetId === id) {
        setSavedCheatSheetId(null);
      }
      toast.success("Deleted");
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  const handleReset = () => {
    setStep("select");
    setOutline(null);
    setPdfUrl(null);
    setSavedCheatSheetId(null);
    setSelectedChapterIds(new Set());
    setCustomInstructions("");
  };

  // ─── OUTLINE EDITING HELPERS ───

  const updateSection = (sectionIndex: number, updates: Partial<OutlineSection>) => {
    if (!outline) return;
    const newSections = [...outline.sections];
    newSections[sectionIndex] = { ...newSections[sectionIndex], ...updates };
    setOutline({ ...outline, sections: newSections });
  };

  const updateItem = (sectionIndex: number, itemIndex: number, updates: Partial<OutlineItem>) => {
    if (!outline) return;
    const newSections = [...outline.sections];
    const newItems = [...newSections[sectionIndex].items];
    newItems[itemIndex] = { ...newItems[itemIndex], ...updates };
    newSections[sectionIndex] = { ...newSections[sectionIndex], items: newItems };
    setOutline({ ...outline, sections: newSections });
  };

  const addSection = () => {
    if (!outline) return;
    setOutline({
      ...outline,
      sections: [
        ...outline.sections,
        { heading: "New Section", type: "custom", items: [{ text: "" }] },
      ],
    });
  };

  const removeSection = (index: number) => {
    if (!outline) return;
    setOutline({
      ...outline,
      sections: outline.sections.filter((_, i) => i !== index),
    });
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    if (!outline) return;
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= outline.sections.length) return;
    const newSections = [...outline.sections];
    [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
    setOutline({ ...outline, sections: newSections });
  };

  const addItem = (sectionIndex: number) => {
    if (!outline) return;
    const newSections = [...outline.sections];
    newSections[sectionIndex] = {
      ...newSections[sectionIndex],
      items: [...newSections[sectionIndex].items, { text: "" }],
    };
    setOutline({ ...outline, sections: newSections });
  };

  const removeItem = (sectionIndex: number, itemIndex: number) => {
    if (!outline) return;
    const newSections = [...outline.sections];
    newSections[sectionIndex] = {
      ...newSections[sectionIndex],
      items: newSections[sectionIndex].items.filter((_, i) => i !== itemIndex),
    };
    setOutline({ ...outline, sections: newSections });
  };

  // ─── RENDER ───

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cheat Sheet Generator</h1>
          <p className="text-muted-foreground">
            Generate branded PDF cheat sheets from your course content
          </p>
        </div>
        <div className="flex items-center gap-2">
          {savedCheatSheets && savedCheatSheets.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowSaved(!showSaved)}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Saved ({savedCheatSheets.length})
            </Button>
          )}
          {step !== "select" && (
            <Button variant="ghost" onClick={handleReset}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Start Over
            </Button>
          )}
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2">
        {["select", "edit", "preview"].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                step === s || (step === "generating" && s === "select")
                  ? "bg-indigo-500 text-white"
                  : outline && i < ["select", "edit", "preview"].indexOf(step as any)
                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}
            </div>
            <span className="text-sm hidden sm:inline">
              {s === "select" ? "Select Content" : s === "edit" ? "Edit Outline" : "Preview & Publish"}
            </span>
            {i < 2 && <div className="h-px w-8 bg-border" />}
          </div>
        ))}
      </div>

      {/* Saved cheat sheets panel */}
      {showSaved && savedCheatSheets && savedCheatSheets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Saved Cheat Sheets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {savedCheatSheets.map((saved: any) => (
              <div
                key={saved._id}
                className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => handleLoadSaved(saved)}
                >
                  <p className="font-medium">{saved.outline?.title || "Untitled"}</p>
                  <p className="text-sm text-muted-foreground">
                    {saved.courseTitle} &middot; {new Date(saved.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      saved.status === "published"
                        ? "default"
                        : saved.status === "generated"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {saved.status}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteSaved(saved._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ─── STEP 1: COURSE & CHAPTER SELECTION ─── */}
      {(step === "select" || step === "generating") && (
        <div className="space-y-6">
          {/* Course selector */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <Label>Select Course</Label>
              <Select value={selectedCourseId} onValueChange={(v) => {
                setSelectedCourseId(v);
                setSelectedChapterIds(new Set());
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a course..." />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course: any) => (
                    <SelectItem key={course._id} value={course._id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Chapter selection */}
          {selectedCourseId && chapters && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Select Chapters ({selectedChapterIds.size} selected)
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleSelectAll}>
                      Select All
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                      Deselect All
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {chaptersByModule.map(([moduleName, moduleChapters]) => (
                  <div key={moduleName}>
                    <h4 className="mb-2 text-sm font-semibold text-muted-foreground">
                      {moduleName}
                    </h4>
                    <div className="space-y-1">
                      {moduleChapters
                        .sort((a: any, b: any) => a.position - b.position)
                        .map((ch: any) => (
                          <label
                            key={ch._id}
                            className="flex cursor-pointer items-center gap-3 rounded-md p-2 transition-colors hover:bg-muted/50"
                          >
                            <input
                              type="checkbox"
                              checked={selectedChapterIds.has(ch._id)}
                              onChange={() => handleToggleChapter(ch._id)}
                              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <div className="flex-1">
                              <span className="text-sm font-medium">{ch.title}</span>
                              {ch.lessonTitle && (
                                <span className="ml-2 text-xs text-muted-foreground">
                                  ({ch.lessonTitle})
                                </span>
                              )}
                            </div>
                            {ch.description && (
                              <Badge variant="outline" className="text-xs">
                                Has content
                              </Badge>
                            )}
                          </label>
                        ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Custom instructions */}
          {selectedChapterIds.size > 0 && (
            <Card>
              <CardContent className="p-6 space-y-2">
                <Label>Custom Instructions (Optional)</Label>
                <Textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder='e.g., "Focus on EQ settings and frequency ranges" or "Make it beginner-friendly"'
                  rows={2}
                />
              </CardContent>
            </Card>
          )}

          {/* Generate button */}
          <Button
            onClick={handleGenerateOutline}
            disabled={selectedChapterIds.size === 0 || isGenerating}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating outline from {selectedChapterIds.size} chapters...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Generate Cheat Sheet Outline ({selectedChapterIds.size} chapters)
              </>
            )}
          </Button>
        </div>
      )}

      {/* ─── STEP 3: OUTLINE EDITOR ─── */}
      {step === "edit" && outline && (
        <div className="space-y-6">
          {/* Title & subtitle */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Cheat Sheet Title</Label>
                <Input
                  value={outline.title}
                  onChange={(e) => setOutline({ ...outline, title: e.target.value })}
                  className="text-lg font-semibold"
                />
              </div>
              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Input
                  value={outline.subtitle || ""}
                  onChange={(e) => setOutline({ ...outline, subtitle: e.target.value })}
                  placeholder="Brief description..."
                />
              </div>
              <div className="space-y-2">
                <Label>Footer Text</Label>
                <Input
                  value={outline.footer || ""}
                  onChange={(e) => setOutline({ ...outline, footer: e.target.value })}
                  placeholder="Download more at ppr.academy"
                />
              </div>
            </CardContent>
          </Card>

          {/* Sections */}
          {outline.sections.map((section, sIdx) => (
            <Card key={sIdx}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2">
                    <Input
                      value={section.heading}
                      onChange={(e) => updateSection(sIdx, { heading: e.target.value })}
                      className="font-semibold"
                    />
                    <Select
                      value={section.type}
                      onValueChange={(v) => updateSection(sIdx, { type: v as SectionType })}
                    >
                      <SelectTrigger className="w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SECTION_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => moveSection(sIdx, "up")}
                    disabled={sIdx === 0}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => moveSection(sIdx, "down")}
                    disabled={sIdx === outline.sections.length - 1}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSection(sIdx)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {section.items.map((item, iIdx) => (
                  <div key={iIdx} className="rounded-md border p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <Textarea
                        value={item.text}
                        onChange={(e) => updateItem(sIdx, iIdx, { text: e.target.value })}
                        rows={2}
                        className="flex-1 text-sm"
                        placeholder="Item text..."
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(sIdx, iIdx)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={item.isTip || false}
                          onCheckedChange={(v) => updateItem(sIdx, iIdx, { isTip: v, isWarning: v ? false : item.isWarning })}
                        />
                        <Label className="text-xs">Tip</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={item.isWarning || false}
                          onCheckedChange={(v) => updateItem(sIdx, iIdx, { isWarning: v, isTip: v ? false : item.isTip })}
                        />
                        <Label className="text-xs">Warning</Label>
                      </div>
                    </div>
                    {/* Sub-items */}
                    {item.subItems && item.subItems.length > 0 && (
                      <div className="ml-4 space-y-1">
                        {item.subItems.map((sub, subIdx) => (
                          <div key={subIdx} className="flex items-center gap-2">
                            <span className="text-muted-foreground">-</span>
                            <Input
                              value={sub}
                              onChange={(e) => {
                                const newSubs = [...(item.subItems || [])];
                                newSubs[subIdx] = e.target.value;
                                updateItem(sIdx, iIdx, { subItems: newSubs });
                              }}
                              className="h-8 text-sm"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                const newSubs = (item.subItems || []).filter((_, i) => i !== subIdx);
                                updateItem(sIdx, iIdx, { subItems: newSubs.length > 0 ? newSubs : undefined });
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        updateItem(sIdx, iIdx, {
                          subItems: [...(item.subItems || []), ""],
                        });
                      }}
                      className="text-xs"
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Add sub-item
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addItem(sIdx)}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add Item
                </Button>
              </CardContent>
            </Card>
          ))}

          {/* Add section */}
          <Button variant="outline" onClick={addSection} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Add Section
          </Button>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleSaveDraft}>
              <Save className="mr-2 h-4 w-4" />
              Save Draft
            </Button>
            <Button variant="outline" onClick={() => { setOutline(null); setStep("select"); }}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Regenerate
            </Button>
            <div className="flex-1" />
            <Button
              onClick={handleGeneratePdf}
              disabled={isGeneratingPdf}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate PDF
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ─── STEP 4: PDF PREVIEW & PUBLISH ─── */}
      {step === "preview" && pdfUrl && (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-0">
              <iframe
                src={pdfUrl}
                className="w-full rounded-lg"
                style={{ height: "70vh" }}
                title="Cheat Sheet PDF Preview"
              />
            </CardContent>
          </Card>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setStep("edit")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Edit Outline
            </Button>
            <Button variant="outline" asChild>
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </a>
            </Button>
            <div className="flex-1" />
            <Button
              onClick={handlePublish}
              disabled={isPublishing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Publish as Lead Magnet
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

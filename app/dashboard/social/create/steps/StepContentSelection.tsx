"use client";

import { useState, useEffect, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useSocialPost } from "../context";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BookOpen,
  FileText,
  Edit3,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  Hash,
  FolderOpen,
  Clock,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Heading {
  level: number;
  text: string;
  startIndex: number;
  endIndex: number;
}

function extractHeadingsFromHtml(html: string): Heading[] {
  const headings: Heading[] = [];
  const headingRegex = /<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi;
  let match;

  while ((match = headingRegex.exec(html)) !== null) {
    const level = parseInt(match[1], 10);
    const text = match[2].replace(/<[^>]+>/g, "").trim();
    if (text) {
      headings.push({
        level,
        text,
        startIndex: match.index,
        endIndex: headingRegex.lastIndex,
      });
    }
  }

  return headings;
}

function extractPlainTextFromHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function extractSectionContent(html: string, heading: Heading, nextHeading?: Heading): string {
  const startIndex = heading.endIndex;
  const endIndex = nextHeading ? nextHeading.startIndex : html.length;
  const sectionHtml = html.substring(startIndex, endIndex);
  return extractPlainTextFromHtml(sectionHtml);
}

export function StepContentSelection() {
  const { user } = useUser();
  const router = useRouter();
  const { state, updateData, goToStep, savePost } = useSocialPost();

  const [sourceTab, setSourceTab] = useState<"course" | "custom">(
    state.data.sourceType === "custom" ? "custom" : "course"
  );
  const [selectedCourseId, setSelectedCourseId] = useState<Id<"courses"> | undefined>(
    state.data.courseId
  );
  const [selectedChapterId, setSelectedChapterId] = useState<Id<"courseChapters"> | undefined>(
    state.data.chapterId
  );
  const [selectedHeadings, setSelectedHeadings] = useState<string[]>(
    state.data.selectedHeadings || []
  );
  const [customContent, setCustomContent] = useState(
    state.data.sourceType === "custom" ? state.data.sourceContent : ""
  );
  const [title, setTitle] = useState(state.data.title || "");
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [showDrafts, setShowDrafts] = useState(!state.postId);

  const savedPosts = useQuery(
    api.socialMediaPosts.getSocialMediaPostsByUser,
    user?.id ? { userId: user.id, limit: 10 } : "skip"
  );

  const deletePostMutation = useMutation(api.socialMediaPosts.deleteSocialMediaPost);

  // @ts-ignore
  const userCourses = useQuery(
    api.courses.getCoursesByUser,
    user?.id ? { userId: user.id } : "skip"
  );

  const selectedCourse = useMemo(() => {
    if (!selectedCourseId || !userCourses) return null;
    return userCourses.find((c: { _id: Id<"courses"> }) => c._id === selectedCourseId);
  }, [selectedCourseId, userCourses]);

  // @ts-ignore
  const courseChapters = useQuery(
    api.courses.getCourseChapters,
    selectedCourseId ? { courseId: selectedCourseId } : "skip"
  );

  const selectedChapter = useMemo(() => {
    if (!selectedChapterId || !courseChapters) return null;
    return courseChapters.find((c: { _id: Id<"courseChapters"> }) => c._id === selectedChapterId);
  }, [selectedChapterId, courseChapters]);

  const chapterHeadings = useMemo(() => {
    if (!selectedChapter?.description) return [];
    return extractHeadingsFromHtml(selectedChapter.description);
  }, [selectedChapter]);

  const chapterPlainText = useMemo(() => {
    if (!selectedChapter?.description) return "";
    return extractPlainTextFromHtml(selectedChapter.description);
  }, [selectedChapter]);

  const selectedSectionText = useMemo(() => {
    if (!selectedChapter?.description || selectedHeadings.length === 0) return "";

    const html = selectedChapter.description;
    const headings = chapterHeadings;

    const selectedTexts: string[] = [];
    for (const heading of headings) {
      if (selectedHeadings.includes(heading.text)) {
        const nextHeading = headings.find(
          (h) => h.startIndex > heading.startIndex && h.level <= heading.level
        );
        const sectionText = extractSectionContent(html, heading, nextHeading);
        selectedTexts.push(`## ${heading.text}\n\n${sectionText}`);
      }
    }

    return selectedTexts.join("\n\n");
  }, [selectedChapter, selectedHeadings, chapterHeadings]);

  const finalContent = useMemo(() => {
    if (sourceTab === "custom") {
      return customContent;
    }

    if (selectedHeadings.length > 0) {
      return selectedSectionText;
    }

    return chapterPlainText;
  }, [sourceTab, customContent, selectedHeadings, selectedSectionText, chapterPlainText]);

  const contentLength = finalContent.length;
  const isContentValid = contentLength >= 100;
  const isContentLong = contentLength > 15000;

  useEffect(() => {
    if (sourceTab === "course" && selectedChapterId) {
      updateData("content", {
        sourceType: selectedHeadings.length > 0 ? "section" : "chapter",
        sourceContent: finalContent,
        courseId: selectedCourseId,
        chapterId: selectedChapterId,
        selectedHeadings: selectedHeadings.length > 0 ? selectedHeadings : undefined,
        title: title || selectedChapter?.title || "Untitled Post",
      });
    } else if (sourceTab === "custom") {
      updateData("content", {
        sourceType: "custom",
        sourceContent: customContent,
        courseId: undefined,
        chapterId: undefined,
        selectedHeadings: undefined,
        title: title || "Untitled Post",
      });
    }
  }, [
    sourceTab,
    selectedCourseId,
    selectedChapterId,
    selectedHeadings,
    finalContent,
    customContent,
    title,
    selectedChapter,
  ]);

  const handleToggleHeading = (headingText: string) => {
    setSelectedHeadings((prev) =>
      prev.includes(headingText) ? prev.filter((h) => h !== headingText) : [...prev, headingText]
    );
  };

  const handleSelectAllHeadings = () => {
    if (selectedHeadings.length === chapterHeadings.length) {
      setSelectedHeadings([]);
    } else {
      setSelectedHeadings(chapterHeadings.map((h) => h.text));
    }
  };

  const handleContinue = async () => {
    if (isContentValid) {
      await savePost();
      goToStep("scripts");
    }
  };

  const handleLoadDraft = (postId: string) => {
    router.push(`/dashboard/social/create?postId=${postId}&step=content&mode=create`);
  };

  const handleDeletePost = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    if (confirm("Delete this post?")) {
      await deletePostMutation({ postId: postId as any });
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "draft":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="mb-2 text-2xl font-bold text-foreground">Select Content</h2>
          <p className="text-muted-foreground">
            Choose content from your courses or paste custom text to generate social media scripts.
          </p>
        </div>
        {!state.postId && savedPosts && savedPosts.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDrafts(!showDrafts)}
            className="gap-2"
          >
            <FolderOpen className="h-4 w-4" />
            {showDrafts ? "Hide" : "Show"} Saved Posts ({savedPosts.length})
          </Button>
        )}
      </div>

      {showDrafts && savedPosts && savedPosts.length > 0 && !state.postId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FolderOpen className="h-5 w-5" />
              Saved Posts
            </CardTitle>
            <CardDescription>Continue working on a previous post</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[250px] overflow-y-auto">
              <div className="space-y-2 pr-2">
                {savedPosts.map((post: any) => (
                  <div
                    key={post._id}
                    onClick={() => handleLoadDraft(post._id)}
                    className="flex w-full cursor-pointer items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-muted"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && handleLoadDraft(post._id)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{post.title || "Untitled Post"}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDate(post.updatedAt)}
                      </div>
                    </div>
                    <Badge className={cn("ml-2", getStatusColor(post.status))}>{post.status}</Badge>
                    <button
                      onClick={(e) => handleDeletePost(e, post._id)}
                      className="ml-2 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      title="Delete post"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <Label htmlFor="post-title">Post Title (for organization)</Label>
        <Input
          id="post-title"
          placeholder="e.g., Compression Tips from Chapter 3"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="max-w-md"
        />
      </div>

      <Tabs value={sourceTab} onValueChange={(v) => setSourceTab(v as "course" | "custom")}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="course" className="gap-2">
            <BookOpen className="h-4 w-4" />
            From Course
          </TabsTrigger>
          <TabsTrigger value="custom" className="gap-2">
            <Edit3 className="h-4 w-4" />
            Custom Text
          </TabsTrigger>
        </TabsList>

        <TabsContent value="course" className="mt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <Label>Select Course</Label>
              <Select
                value={selectedCourseId}
                onValueChange={(v) => {
                  setSelectedCourseId(v as Id<"courses">);
                  setSelectedChapterId(undefined);
                  setSelectedHeadings([]);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a course" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-black">
                  {userCourses?.map((course: { _id: Id<"courses">; title: string }) => (
                    <SelectItem key={course._id} value={course._id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <Label>Select Chapter</Label>
              <Select
                value={selectedChapterId}
                onValueChange={(v) => {
                  setSelectedChapterId(v as Id<"courseChapters">);
                  setSelectedHeadings([]);
                }}
                disabled={!selectedCourseId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a chapter" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-black">
                  {courseChapters?.map(
                    (chapter: { _id: Id<"courseChapters">; title: string; position: number }) => (
                      <SelectItem key={chapter._id} value={chapter._id}>
                        {chapter.position}. {chapter.title}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedChapter && chapterHeadings.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Select Sections (Optional)</CardTitle>
                    <CardDescription>
                      Choose specific sections or use the entire chapter
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleSelectAllHeadings}>
                    {selectedHeadings.length === chapterHeadings.length
                      ? "Deselect All"
                      : "Select All"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px] pr-4">
                  <div className="space-y-2">
                    {chapterHeadings.map((heading, index) => (
                      <div
                        key={index}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                          selectedHeadings.includes(heading.text)
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted"
                        )}
                        onClick={() => handleToggleHeading(heading.text)}
                        style={{ paddingLeft: `${(heading.level - 1) * 16 + 12}px` }}
                      >
                        <Checkbox
                          checked={selectedHeadings.includes(heading.text)}
                          onCheckedChange={() => handleToggleHeading(heading.text)}
                        />
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            H{heading.level}
                          </Badge>
                          <span className="text-sm font-medium">{heading.text}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {selectedChapter && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-4 w-4" />
                  Content Preview
                  {selectedHeadings.length > 0 && (
                    <Badge variant="secondary">{selectedHeadings.length} sections selected</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="whitespace-pre-wrap pr-4 text-sm text-muted-foreground">
                    {finalContent || "No content available"}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="custom" className="mt-6 space-y-6">
          <div className="space-y-4">
            <Label htmlFor="custom-content">Paste Your Content</Label>
            <Textarea
              id="custom-content"
              placeholder="Paste your course content, blog post, or any text you want to turn into social media scripts..."
              value={customContent}
              onChange={(e) => setCustomContent(e.target.value)}
              className="min-h-[400px] font-mono text-sm"
            />
          </div>
        </TabsContent>
      </Tabs>

      <Card
        className={cn(
          "border-2 transition-colors",
          isContentValid
            ? isContentLong
              ? "border-amber-500/50 bg-amber-500/5"
              : "border-green-500/50 bg-green-500/5"
            : "border-orange-500/50 bg-orange-500/5"
        )}
      >
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            {isContentValid ? (
              isContentLong ? (
                <AlertCircle className="mt-0.5 h-5 w-5 text-amber-500" />
              ) : (
                <CheckCircle className="mt-0.5 h-5 w-5 text-green-500" />
              )
            ) : (
              <AlertCircle className="mt-0.5 h-5 w-5 text-orange-500" />
            )}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Content Status</h4>
                <Badge variant={isContentValid ? "default" : "secondary"}>
                  {contentLength.toLocaleString()} characters
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {isContentLong
                  ? "Long content detected. Generation may take longer and use more tokens."
                  : isContentValid
                    ? "Content is ready for script generation."
                    : `Need at least 100 characters. Add ${100 - contentLength} more.`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleContinue}
          disabled={!isContentValid || state.isSaving}
          className="gap-2"
          size="lg"
        >
          {state.isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Continue to Scripts
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

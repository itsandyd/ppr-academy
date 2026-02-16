"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Video, BookOpen, Sparkles, Copy, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ContentGenerationPage() {
  const { user } = useUser();
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Video Script Generation State
  const [videoTopic, setVideoTopic] = useState("");
  const [platform, setPlatform] = useState<"tiktok" | "youtube-short" | "instagram-reel" | "youtube-long">("tiktok");
  const [tone, setTone] = useState<"educational" | "entertaining" | "motivational" | "storytelling">("educational");
  const [videoScript, setVideoScript] = useState<any>(null);

  // Course Generation State
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [category, setCategory] = useState("");
  const [skillLevel, setSkillLevel] = useState<"Beginner" | "Intermediate" | "Advanced">("Beginner");
  const [courseOutline, setCourseOutline] = useState<any>(null);

  // Actions
  const generateVideoScript = useAction(api.contentGeneration.generateViralVideoScript);
  const generateCourse = useAction(api.contentGeneration.generateCourseFromContent);

  const handleGenerateVideo = async () => {
    if (!user || !videoTopic) return;

    setIsGenerating(true);
    setVideoScript(null);

    try {
      const result = await generateVideoScript({
        userId: user.id,
        topic: videoTopic,
        platform,
        tone,
        targetAudience: "Music producers and beatmakers",
      });

      if (result.success) {
        setVideoScript(result);
      } else {
        alert(result.error || "Failed to generate video script");
      }
    } catch (error) {
      console.error("Error generating video script:", error);
      alert("Failed to generate video script. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateCourse = async () => {
    if (!user || !courseTitle || !courseDescription) return;

    setIsGenerating(true);
    setCourseOutline(null);

    try {
      const result = await generateCourse({
        userId: user.id,
        courseTitle,
        courseDescription,
        category: category || "Production Skills",
        skillLevel,
        numberOfModules: 5,
      });

      if (result.success) {
        setCourseOutline(result.outline);
      } else {
        alert(result.error || "Failed to generate course outline");
      }
    } catch (error) {
      console.error("Error generating course outline:", error);
      alert("Failed to generate course outline. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Please sign in to access the content generation tools.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-6xl">
      <div className="flex items-center gap-3">
        <Sparkles className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">AI Content Generation</h1>
          <p className="text-muted-foreground">
            Create viral videos and courses based on your existing content
          </p>
        </div>
      </div>

      <Alert>
        <Sparkles className="h-4 w-4" />
        <AlertDescription>
          This tool uses AI to analyze all your course content and generate new content that matches your teaching style.
          Make sure you have generated embeddings first!
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="video" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="video" className="gap-2">
            <Video className="h-4 w-4" />
            Viral Video Scripts
          </TabsTrigger>
          <TabsTrigger value="course" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Course Outlines
          </TabsTrigger>
        </TabsList>

        {/* Video Script Generation */}
        <TabsContent value="video" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate Viral Video Script</CardTitle>
              <CardDescription>
                AI will analyze your course content and create platform-optimized video scripts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="video-topic">Video Topic</Label>
                <Input
                  id="video-topic"
                  placeholder="e.g., 808 bass mixing techniques"
                  value={videoTopic}
                  onChange={(e) => setVideoTopic(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Platform</Label>
                  <Select value={platform} onValueChange={(v: any) => setPlatform(v)}>
                    <SelectTrigger className="bg-white dark:bg-black">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-black">
                      <SelectItem value="tiktok">TikTok (15-60s)</SelectItem>
                      <SelectItem value="youtube-short">YouTube Short (30-60s)</SelectItem>
                      <SelectItem value="instagram-reel">Instagram Reel (15-90s)</SelectItem>
                      <SelectItem value="youtube-long">YouTube Long (8-15min)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tone</Label>
                  <Select value={tone} onValueChange={(v: any) => setTone(v)}>
                    <SelectTrigger className="bg-white dark:bg-black">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-black">
                      <SelectItem value="educational">Educational</SelectItem>
                      <SelectItem value="entertaining">Entertaining</SelectItem>
                      <SelectItem value="motivational">Motivational</SelectItem>
                      <SelectItem value="storytelling">Storytelling</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleGenerateVideo}
                disabled={isGenerating || !videoTopic}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Video Script
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Video Script Result */}
          {videoScript && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Generated Script</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(videoScript.script)}
                  >
                    {copied ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <CardDescription>
                  Estimated Duration: {videoScript.estimatedDuration}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {videoScript.hook && (
                  <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <h4 className="font-semibold mb-2 text-green-900 dark:text-green-100">🎣 Hook</h4>
                    <p className="text-green-800 dark:text-green-200">{videoScript.hook}</p>
                  </div>
                )}

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">📝 Full Script</h4>
                  <pre className="whitespace-pre-wrap text-sm font-mono">{videoScript.script}</pre>
                </div>

                {videoScript.mainPoints && videoScript.mainPoints.length > 0 && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">💡 Key Points</h4>
                    <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                      {videoScript.mainPoints.map((point: string, index: number) => (
                        <li key={index}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {videoScript.cta && (
                  <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <h4 className="font-semibold mb-2 text-purple-900 dark:text-purple-100">🎯 Call to Action</h4>
                    <p className="text-purple-800 dark:text-purple-200">{videoScript.cta}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Course Generation */}
        <TabsContent value="course" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate Course Outline</CardTitle>
              <CardDescription>
                AI will create a structured course outline based on your existing content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="course-title">Course Title</Label>
                <Input
                  id="course-title"
                  placeholder="e.g., Advanced Vocal Mixing Masterclass"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="course-description">Course Description</Label>
                <Textarea
                  id="course-description"
                  placeholder="Describe what students will learn..."
                  value={courseDescription}
                  onChange={(e) => setCourseDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input
                    placeholder="e.g., Mixing"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Skill Level</Label>
                  <Select value={skillLevel} onValueChange={(v: any) => setSkillLevel(v)}>
                    <SelectTrigger className="bg-white dark:bg-black">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-black">
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleGenerateCourse}
                disabled={isGenerating || !courseTitle || !courseDescription}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Course Outline
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Course Outline Result */}
          {courseOutline && (
            <Card>
              <CardHeader>
                <CardTitle>Generated Course Outline</CardTitle>
                <CardDescription>
                  {courseOutline.modules?.length || 0} modules generated
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {courseOutline.modules?.map((module: any, moduleIndex: number) => (
                  <div key={moduleIndex} className="p-4 border rounded-lg space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg">
                        Module {moduleIndex + 1}: {module.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
                    </div>

                    <div className="space-y-2 pl-4">
                      {module.lessons?.map((lesson: any, lessonIndex: number) => (
                        <div key={lessonIndex} className="p-3 bg-muted rounded space-y-2">
                          <h4 className="font-medium text-sm">
                            Lesson {lessonIndex + 1}: {lesson.title}
                          </h4>
                          <p className="text-xs text-muted-foreground">{lesson.description}</p>
                          {lesson.keyPoints && lesson.keyPoints.length > 0 && (
                            <ul className="text-xs list-disc list-inside space-y-1 pl-2">
                              {lesson.keyPoints.map((point: string, pointIndex: number) => (
                                <li key={pointIndex}>{point}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}


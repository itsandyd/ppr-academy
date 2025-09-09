"use client";

import { FC, useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  Download,
  Share2,
  BookOpen,
  CheckCircle,
  Circle,
  Clock,
  User,
  MessageSquare,
  ThumbsUp,
  Star,
  ChevronLeft,
  ChevronRight,
  FileText,
  Headphones,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Chapter {
  id: string;
  title: string;
  duration: string;
  isCompleted: boolean;
  isCurrent: boolean;
  hasAudio: boolean;
  hasVideo: boolean;
  description?: string;
}

interface CoursePlayerProps {
  courseTitle: string;
  currentChapter: Chapter;
  chapters: Chapter[];
  videoUrl?: string;
  audioUrl?: string;
  transcript?: string;
  notes?: string;
  progress: number;
  onChapterChange: (chapterId: string) => void;
  onProgressUpdate: (progress: number) => void;
  onComplete: () => void;
}

export const CoursePlayerEnhanced: FC<CoursePlayerProps> = ({
  courseTitle,
  currentChapter,
  chapters,
  videoUrl,
  audioUrl,
  transcript,
  notes,
  progress,
  onChapterChange,
  onProgressUpdate,
  onComplete,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentIndex = chapters.findIndex(c => c.id === currentChapter.id);
  const hasNext = currentIndex < chapters.length - 1;
  const hasPrevious = currentIndex > 0;

  const togglePlayPause = () => {
    const media = videoRef.current || audioRef.current;
    if (media) {
      if (isPlaying) {
        media.pause();
      } else {
        media.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      onChapterChange(chapters[currentIndex + 1].id);
    }
  };

  const handlePrevious = () => {
    if (hasPrevious) {
      onChapterChange(chapters[currentIndex - 1].id);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleMute = () => {
    const media = videoRef.current || audioRef.current;
    if (media) {
      media.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    const media = videoRef.current || audioRef.current;
    if (media) {
      media.volume = newVolume;
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (!isFullscreen) {
        videoRef.current.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-0">
        {/* Main Player */}
        <div className="lg:col-span-3">
          <div className="bg-black relative">
            {/* Video Player */}
            {videoUrl ? (
              <div className="relative aspect-video">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full h-full"
                  onTimeUpdate={(e) => {
                    const target = e.target as HTMLVideoElement;
                    setCurrentTime(target.currentTime);
                    const progressPercent = (target.currentTime / target.duration) * 100;
                    onProgressUpdate(progressPercent);
                  }}
                  onLoadedMetadata={(e) => {
                    const target = e.target as HTMLVideoElement;
                    setDuration(target.duration);
                  }}
                  onEnded={onComplete}
                />
                
                {/* Video Controls Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 opacity-0 hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between p-4">
                    <div className="text-white">
                      <h2 className="font-semibold text-lg">{currentChapter.title}</h2>
                      <p className="text-sm text-white/80">{courseTitle}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-white hover:bg-white/20" onClick={toggleFullscreen}>
                        <Maximize className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Center Play Button */}
                  <div className="flex-1 flex items-center justify-center">
                    <Button
                      size="lg"
                      variant="ghost"
                      onClick={togglePlayPause}
                      className="w-16 h-16 rounded-full bg-white/20 hover:bg-white/30 text-white"
                    >
                      {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                    </Button>
                  </div>

                  {/* Bottom Controls */}
                  <div className="p-4 space-y-2">
                    <Progress value={(currentTime / duration) * 100} className="h-1 bg-white/20" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Button size="sm" variant="ghost" onClick={togglePlayPause} className="text-white hover:bg-white/20">
                          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handlePrevious} disabled={!hasPrevious} className="text-white hover:bg-white/20 disabled:opacity-50">
                          <SkipBack className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleNext} disabled={!hasNext} className="text-white hover:bg-white/20 disabled:opacity-50">
                          <SkipForward className="w-4 h-4" />
                        </Button>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" onClick={toggleMute} className="text-white hover:bg-white/20">
                            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                      <div className="text-white text-sm">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : audioUrl ? (
              // Audio Player
              <div className="aspect-video bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col items-center justify-center relative">
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onTimeUpdate={(e) => {
                    const target = e.target as HTMLAudioElement;
                    setCurrentTime(target.currentTime);
                    const progressPercent = (target.currentTime / target.duration) * 100;
                    onProgressUpdate(progressPercent);
                  }}
                  onLoadedMetadata={(e) => {
                    const target = e.target as HTMLAudioElement;
                    setDuration(target.duration);
                  }}
                  onEnded={onComplete}
                />
                
                {/* Audio Visualization */}
                <div className="text-center mb-8">
                  <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mb-4 mx-auto">
                    <Headphones className="w-12 h-12 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">{currentChapter.title}</h2>
                  <p className="text-white/80">{courseTitle}</p>
                </div>

                {/* Audio Controls */}
                <div className="w-full max-w-md px-8">
                  <Progress value={(currentTime / duration) * 100} className="h-2 mb-4 bg-white/20" />
                  
                  <div className="flex items-center justify-center gap-6 mb-4">
                    <Button size="sm" variant="ghost" onClick={handlePrevious} disabled={!hasPrevious} className="text-white hover:bg-white/20 disabled:opacity-50">
                      <SkipBack className="w-5 h-5" />
                    </Button>
                    
                    <Button
                      size="lg"
                      variant="ghost"
                      onClick={togglePlayPause}
                      className="w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 text-white"
                    >
                      {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                    </Button>
                    
                    <Button size="sm" variant="ghost" onClick={handleNext} disabled={!hasNext} className="text-white hover:bg-white/20 disabled:opacity-50">
                      <SkipForward className="w-5 h-5" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between text-white text-sm">
                    <span>{formatTime(currentTime)}</span>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={toggleMute} className="text-white hover:bg-white/20">
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </Button>
                    </div>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white rounded-full"></div>
                  <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-white rounded-full"></div>
                  <div className="absolute top-3/4 left-1/2 w-16 h-16 bg-white rounded-full"></div>
                </div>
              </div>
            ) : (
              // No Media Placeholder
              <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                <div className="text-center text-white">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">Text-Based Lesson</h3>
                  <p className="text-white/70">This lesson contains written content and materials</p>
                </div>
              </div>
            )}
          </div>

          {/* Lesson Content */}
          <div className="bg-white p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold mb-2">{currentChapter.title}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{currentChapter.duration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>Instructor Name</span>
                  </div>
                  <Badge variant={currentChapter.isCompleted ? "default" : "secondary"}>
                    {currentChapter.isCompleted ? "Completed" : "In Progress"}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button onClick={onComplete} disabled={currentChapter.isCompleted}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {currentChapter.isCompleted ? "Completed" : "Mark Complete"}
                </Button>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="transcript">Transcript</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="discussion">Discussion</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <div className="prose max-w-none">
                  <p className="text-muted-foreground leading-relaxed">
                    {currentChapter.description || "This lesson covers important concepts in music production..."}
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="transcript" className="mt-6">
                <ScrollArea className="h-96">
                  <div className="prose max-w-none text-sm">
                    {transcript ? (
                      <p className="leading-relaxed">{transcript}</p>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No transcript available for this lesson</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="notes" className="mt-6">
                <ScrollArea className="h-96">
                  <div className="prose max-w-none text-sm">
                    {notes ? (
                      <p className="leading-relaxed">{notes}</p>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No additional notes for this lesson</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="discussion" className="mt-6">
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="font-medium mb-2">Join the Discussion</h3>
                  <p>Ask questions and share insights with other students</p>
                  <Button className="mt-4">
                    Start Discussion
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Sidebar - Course Navigation */}
        <div className="bg-white border-l">
          <div className="p-4 border-b">
            <h3 className="font-semibold mb-2">Course Content</h3>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{chapters.filter(c => c.isCompleted).length} of {chapters.length} completed</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="mt-2 h-1" />
          </div>

          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="p-4 space-y-2">
              {chapters.map((chapter, index) => (
                <Card
                  key={chapter.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    chapter.isCurrent && "ring-2 ring-primary border-primary"
                  )}
                  onClick={() => onChapterChange(chapter.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {chapter.isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : chapter.isCurrent ? (
                          <Play className="w-5 h-5 text-primary" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-muted-foreground">
                            {(index + 1).toString().padStart(2, '0')}
                          </span>
                          {chapter.hasVideo && <Play className="w-3 h-3 text-muted-foreground" />}
                          {chapter.hasAudio && <Headphones className="w-3 h-3 text-muted-foreground" />}
                        </div>
                        
                        <h4 className={cn(
                          "font-medium text-sm line-clamp-2 mb-1",
                          chapter.isCurrent && "text-primary"
                        )}>
                          {chapter.title}
                        </h4>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {chapter.duration}
                          </span>
                          {chapter.isCompleted && (
                            <Badge variant="secondary" className="text-xs">
                              Done
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>

          {/* Navigation Buttons */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={!hasPrevious}
                className="flex-1"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <Button
                size="sm"
                onClick={handleNext}
                disabled={!hasNext}
                className="flex-1"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

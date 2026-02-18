"use client";

import { FC } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Clock,
  Users,
  Star,
  Play,
  BookOpen,
  TrendingUp,
  Heart,
  Share2,
  ChevronRight,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CourseCardProps {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  price?: number;
  category?: string;
  skillLevel?: "Beginner" | "Intermediate" | "Advanced";
  slug?: string;
  instructor?: {
    name: string;
    avatar?: string;
    verified?: boolean;
  };
  stats?: {
    students: number;
    lessons: number;
    duration: string;
    rating: number;
    reviews: number;
  };
  progress?: number; // For enrolled courses
  isEnrolled?: boolean;
  isFavorited?: boolean;
  isNew?: boolean;
  isTrending?: boolean;
  isCreatorMode?: boolean; // NEW: If true, link to course editor
  isPublished?: boolean; // NEW: For creator actions
  onEdit?: (courseId: string) => void; // NEW: Edit callback
  onDelete?: (courseId: string) => void; // NEW: Delete callback
  onTogglePublish?: (courseId: string, currentState: boolean) => void; // NEW: Publish toggle
  variant?: "default" | "compact" | "featured";
  className?: string;
}

export const CourseCardEnhanced: FC<CourseCardProps> = ({
  id,
  title,
  description,
  imageUrl,
  price,
  category,
  skillLevel,
  slug,
  instructor,
  stats,
  progress,
  isEnrolled = false,
  isFavorited = false,
  isNew = false,
  isTrending = false,
  isCreatorMode = false,
  isPublished = false,
  onEdit,
  onDelete,
  onTogglePublish,
  variant = "default",
  className,
}) => {
  // Determine link based on context
  const href = isCreatorMode
    ? `/dashboard/create/course?courseId=${id}&step=course` // Creator mode: Edit course
    : isEnrolled 
    ? (slug ? `/dashboard/courses/${slug}` : `/dashboard/courses/${id}`) // Learn mode: Course player
    : (slug ? `/courses/${slug}` : `/courses/${id}`); // Public: Sales page
  
  const skillLevelColors = {
    Beginner: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800",
    Intermediate: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800", 
    Advanced: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  };

  if (variant === "compact") {
    return (
      <Card className={cn("group hover:shadow-lg transition-all duration-300", className)}>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-400 to-blue-600 flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                  {title}
                </h3>
                {progress !== undefined && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {Math.round(progress)}%
                  </Badge>
                )}
              </div>
              
              {instructor && (
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="w-5 h-5">
                    <AvatarImage src={instructor.avatar} />
                    <AvatarFallback className="text-xs">
                      {instructor.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground truncate">
                    {instructor.name}
                  </span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {stats?.students && (
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{stats.students}</span>
                    </div>
                  )}
                  {stats?.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span>{stats.rating}</span>
                    </div>
                  )}
                </div>
                
                {price !== undefined && (
                  <div className="font-semibold text-sm">
                    ${price === 0 ? "Free" : price}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {progress !== undefined && (
            <Progress value={progress} className="mt-3 h-1" />
          )}
        </CardContent>
      </Card>
    );
  }

  if (variant === "featured") {
    return (
      <Card className={cn(
        "group hover:shadow-2xl transition-all duration-500 overflow-hidden",
        className
      )}>
        <div className="relative">
          {/* Image Container */}
          <div className="relative aspect-[16/9] overflow-hidden">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={title}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-700"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-500 via-blue-600 to-indigo-700 flex items-center justify-center">
                <BookOpen className="w-16 h-16 text-white/80" />
              </div>
            )}
            
            {/* Overlay Badges */}
            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              {isNew && (
                <Badge className="bg-red-500 hover:bg-red-600 text-white font-medium">
                  New
                </Badge>
              )}
              {isTrending && (
                <Badge className="bg-orange-500 hover:bg-orange-600 text-white font-medium">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Trending
                </Badge>
              )}
              {skillLevel && (
                <Badge 
                  variant="secondary"
                  className={cn("font-medium", skillLevelColors[skillLevel])}
                >
                  {skillLevel}
                </Badge>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {isCreatorMode ? (
                /* Creator Actions Dropdown */
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-8 h-8 p-0 rounded-full bg-white/90 dark:bg-black/90 hover:bg-white dark:hover:bg-black"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white dark:bg-zinc-900 text-foreground">
                    <DropdownMenuItem onClick={() => onEdit?.(id)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Course
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onTogglePublish?.(id, isPublished)}>
                      {isPublished ? (
                        <>
                          <EyeOff className="w-4 h-4 mr-2" />
                          Unpublish
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-2" />
                          Publish
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onDelete?.(id)} className="text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Course
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                /* Student Actions */
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-8 h-8 p-0 rounded-full bg-white/90 dark:bg-black/90 hover:bg-white dark:hover:bg-black"
                  >
                    <Heart className={cn("w-4 h-4", isFavorited && "fill-red-500 text-red-500")} />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-8 h-8 p-0 rounded-full bg-white/90 dark:bg-black/90 hover:bg-white dark:hover:bg-black"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
            
            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Button
                size="lg"
                className="rounded-full w-16 h-16 bg-white/20 backdrop-blur-sm hover:bg-white/30 border border-white/30"
              >
                <Play className="w-6 h-6 text-white fill-white ml-1" />
              </Button>
            </div>
          </div>
          
          {/* Content */}
          <CardContent className="p-6">
            {/* Category */}
            {category && (
              <Badge variant="outline" className="mb-3 text-xs font-medium">
                {category}
              </Badge>
            )}
            
            {/* Title */}
            <Link href={href}>
              <h3 className="font-bold text-xl mb-3 line-clamp-2 group-hover:text-primary transition-colors cursor-pointer">
                {title}
              </h3>
            </Link>
            
            {/* Description */}
            {description && (
              <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                {description}
              </p>
            )}
            
            {/* Instructor */}
            {instructor && (
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={instructor.avatar} />
                  <AvatarFallback>{instructor.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-sm">{instructor.name}</div>
                  {instructor.verified && (
                    <div className="text-xs text-muted-foreground">Verified Instructor</div>
                  )}
                </div>
              </div>
            )}
            
            {/* Stats */}
            {stats && (
              <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{stats.students.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  <span>{stats.lessons} lessons</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{stats.duration}</span>
                </div>
                {stats.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>{stats.rating} ({stats.reviews})</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Progress Bar for Enrolled */}
            {isEnrolled && progress !== undefined && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
            
            {/* Action Button & Price */}
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {price === 0 ? (
                  <span className="text-green-600 dark:text-green-400">Free</span>
                ) : price ? (
                  <span>${price}</span>
                ) : null}
              </div>
              
              <Link href={href}>
                <Button className="group/btn">
                  {isEnrolled ? "Continue Learning" : "Learn More"}
                  <ChevronRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </div>
      </Card>
    );
  }

  // Default variant
  return (
    <Card className={cn(
      "group hover:shadow-xl transition-all duration-300 overflow-hidden",
      className
    )}>
      <div className="relative">
        {/* Image */}
        <div className="relative aspect-[16/9] overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-white/80" />
            </div>
          )}
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            {isNew && <Badge className="bg-red-500 text-white">New</Badge>}
            {isTrending && (
              <Badge className="bg-orange-500 text-white">
                <TrendingUp className="w-3 h-3 mr-1" />
                Trending
              </Badge>
            )}
          </div>
          
          {/* Action Button */}
          {isCreatorMode ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-3 right-3 w-8 h-8 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-black/90 hover:bg-white dark:hover:bg-black"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white dark:bg-zinc-900 text-foreground">
                <DropdownMenuItem onClick={() => onEdit?.(id)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Course
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onTogglePublish?.(id, isPublished)}>
                  {isPublished ? (
                    <>
                      <EyeOff className="w-4 h-4 mr-2" />
                      Unpublish
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Publish
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete?.(id)} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Course
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              className="absolute top-3 right-3 w-8 h-8 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-black/90 hover:bg-white dark:hover:bg-black"
            >
              <Heart className={cn("w-4 h-4", isFavorited && "fill-red-500 text-red-500")} />
            </Button>
          )}
        </div>
        
        {/* Content */}
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              {category && (
                <Badge variant="outline" className="mb-2 text-xs">
                  {category}
                </Badge>
              )}
              <Link href={href}>
                <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors cursor-pointer">
                  {title}
                </h3>
              </Link>
            </div>
            {skillLevel && (
              <Badge 
                variant="secondary" 
                className={cn("ml-2 text-xs", skillLevelColors[skillLevel])}
              >
                {skillLevel}
              </Badge>
            )}
          </div>
          
          {description && (
            <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
              {description}
            </p>
          )}
          
          {instructor && (
            <div className="flex items-center gap-2 mb-3">
              <Avatar className="w-6 h-6">
                <AvatarImage src={instructor.avatar} />
                <AvatarFallback className="text-xs">
                  {instructor.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">
                {instructor.name}
              </span>
            </div>
          )}
          
          {stats && (
            <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{stats.students}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{stats.duration}</span>
              </div>
              {stats.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span>{stats.rating}</span>
                </div>
              )}
            </div>
          )}
          
          {isEnrolled && progress !== undefined && (
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="text-xl font-bold">
              {price === 0 ? (
                <span className="text-green-600 dark:text-green-400">Free</span>
              ) : price ? (
                <span>${price}</span>
              ) : null}
            </div>
            
            <Link href={href}>
              <Button size="sm" className="group/btn">
                {isCreatorMode ? "Edit Course" : isEnrolled ? "Continue Learning" : "View Course"}
                <ChevronRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};

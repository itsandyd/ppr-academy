"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Settings, Eye } from "lucide-react";

interface CourseFiltersProps {
  isAdmin?: boolean;
}

export default function CourseFilters({ isAdmin = false }: CourseFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [skillLevel, setSkillLevel] = useState(searchParams.get("skillLevel") || "");
  const [showFilters, setShowFilters] = useState(false);
  
  const currentView = searchParams.get("view") || "browse";
  const isManageView = currentView === "manage";

  const categories = [
    "Hip-Hop Production",
    "Electronic Music", 
    "Mixing & Mastering",
    "Sound Design",
    "Music Theory",
    "Pop Production",
    "Rock Production",
    "DAWs",
    "Trap Production",
    "House Music",
    "Techno Production",
    "Vocal Production",
    "Jazz Production",
    "R&B Production",
    "Ambient Music",
    "Drum Programming",
    "Synthesis",
    "Sampling",
    "Audio Engineering",
    "Live Performance"
  ];

  const skillLevels = [
    "Beginner",
    "Intermediate", 
    "Advanced",
    "All Levels"
  ];

  const updateSearchParams = useCallback(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (category) params.set("category", category);
    if (skillLevel) params.set("skillLevel", skillLevel);
    if (isAdmin && currentView) params.set("view", currentView);
    
    router.push(`/courses?${params.toString()}`);
  }, [searchQuery, category, skillLevel, router, isAdmin, currentView]);

  const handleSearch = () => {
    updateSearchParams();
  };

  const clearFilters = () => {
    setSearchQuery("");
    setCategory("");
    setSkillLevel("");
    const params = new URLSearchParams();
    if (isAdmin && currentView) params.set("view", currentView);
    router.push(`/courses${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const toggleView = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (category) params.set("category", category);
    if (skillLevel) params.set("skillLevel", skillLevel);
    params.set("view", isManageView ? "browse" : "manage");
    
    router.push(`/courses?${params.toString()}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Admin View Toggle */}
      {isAdmin && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Badge variant={isManageView ? "default" : "secondary"} className="px-3 py-1">
              {isManageView ? "Management Mode" : "Browse Mode"}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleView}
              className="flex items-center space-x-2"
            >
              {isManageView ? (
                <>
                  <Eye className="w-4 h-4" />
                  <span>Switch to Browse</span>
                </>
              ) : (
                <>
                  <Settings className="w-4 h-4" />
                  <span>Switch to Manage</span>
                </>
              )}
            </Button>
          </div>
          <div className="text-sm text-slate-600">
            {isManageView 
              ? "Edit, publish, and organize courses" 
              : "Browse courses as a regular user"
            }
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input
            type="text"
            placeholder={isManageView 
              ? "Search courses to manage..." 
              : "Search courses, instructors, topics..."
            }
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && handleSearch()}
            className="pl-12 h-12 text-lg"
          />
        </div>
        <Button onClick={handleSearch} size="lg" className="px-8">
          Search
        </Button>
        <Button 
          variant="outline" 
          size="lg"
          onClick={() => setShowFilters(!showFilters)}
          className="px-4"
        >
          <Filter className="w-5 h-5" />
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Skill Level</label>
            <Select value={skillLevel} onValueChange={setSkillLevel}>
              <SelectTrigger>
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Levels</SelectItem>
                {skillLevels.map((level) => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button 
              variant="outline" 
              onClick={clearFilters}
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 
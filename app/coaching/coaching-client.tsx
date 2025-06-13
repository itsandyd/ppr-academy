'use client'

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users,
  Star,
  Clock,
  Video,
  Search,
  MapPin,
  Calendar,
  MessageSquare,
  ArrowRight,
  Filter,
  DollarSign,
  BookOpen
} from "lucide-react";
import type { Coach } from "@/app/actions/coaching-actions";

interface CoachingClientProps {
  coaches: Coach[];
  isAuthenticated: boolean;
}

export default function CoachingClient({ coaches, isAuthenticated }: CoachingClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");

  const specialties = [
    { value: "all", label: "All Specialties" },
    { value: "mixing", label: "Mixing" },
    { value: "mastering", label: "Mastering" }, 
    { value: "sound-design", label: "Sound Design" },
    { value: "composition", label: "Composition" },
    { value: "arrangement", label: "Arrangement" },
    { value: "dj-techniques", label: "DJ Techniques" },
    { value: "live-performance", label: "Live Performance" },
    { value: "music-theory", label: "Music Theory" },
    { value: "ableton-live", label: "Ableton Live" },
    { value: "logic-pro", label: "Logic Pro" },
    { value: "pro-tools", label: "Pro Tools" },
    { value: "fl-studio", label: "FL Studio" }
  ];

  const filteredCoaches = coaches.filter((coach) => {
    const matchesSearch = searchQuery === "" || 
      coach.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coach.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coach.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesSpecialty = selectedSpecialty === "all" || 
      coach.specialties.includes(selectedSpecialty);
    
    return matchesSearch && matchesSpecialty;
  });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) 
            ? 'fill-yellow-400 text-yellow-400' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <>
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Find Your Perfect <span className="text-yellow-300">Music Production</span> Coach
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Connect with expert producers for personalized mentorship, skill development, and career guidance
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/become-a-coach">
                <Button size="lg" className="bg-white text-primary hover:bg-slate-100">
                  Become a Coach
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="py-8 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search coaches by name or specialty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
              <SelectTrigger className="w-full md:w-64">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by specialty" />
              </SelectTrigger>
              <SelectContent>
                {specialties.map((specialty) => (
                  <SelectItem key={specialty.value} value={specialty.value}>
                    {specialty.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Coaches Grid */}
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredCoaches.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">No coaches available</h3>
              <p className="text-gray-600 mb-6">
                {coaches.length === 0 
                  ? "Be the first to join our coaching community!" 
                  : "Try adjusting your search criteria to find more coaches."
                }
              </p>
              <Link href="/become-a-coach">
                <Button>
                  Apply to Become a Coach
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCoaches.map((coach) => (
                <Card key={coach.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-start space-x-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={coach.imageUrl} alt={coach.firstName} />
                        <AvatarFallback className="bg-primary text-white">
                          {coach.firstName[0]}{coach.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-semibold text-gray-900 truncate">
                          {coach.firstName} {coach.lastName}
                        </h3>
                        <div className="flex items-center mt-1">
                          <div className="flex items-center">
                            {renderStars(coach.rating)}
                            <span className="ml-2 text-sm text-gray-600">
                              {coach.rating.toFixed(1)} ({coach.totalSessions} sessions)
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center mt-2 text-primary font-semibold">
                          <DollarSign className="w-4 h-4 mr-1" />
                          ${coach.hourlyRate}/hour
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {coach.bio}
                    </p>
                    
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {coach.specialties.slice(0, 3).map((specialty, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {specialty.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                        ))}
                        {coach.specialties.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{coach.specialties.length - 3} more
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {coach.availability}
                        </div>
                        {coach.location && (
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {coach.location}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 mt-6">
                      <Button 
                        className="flex-1" 
                        size="sm"
                        disabled={!isAuthenticated}
                        onClick={() => {
                          if (!isAuthenticated) {
                            // Redirect to sign-in or show auth modal
                            window.location.href = '/sign-in';
                          } else {
                            // TODO: Implement booking modal or redirect to booking page
                            console.log('Book session with coach:', coach.id);
                          }
                        }}
                      >
                        <Video className="w-4 h-4 mr-2" />
                        Book Session
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={!isAuthenticated}
                        onClick={() => {
                          if (!isAuthenticated) {
                            window.location.href = '/sign-in';
                          } else {
                            // TODO: Implement messaging functionality
                            console.log('Message coach:', coach.id);
                          }
                        }}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
} 
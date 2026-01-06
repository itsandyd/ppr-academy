"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
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
  BookOpen,
  Loader2,
  CalendarDays,
} from "lucide-react";
import type { Coach } from "@/app/actions/coaching-actions";
import {
  createCoachingSession,
  getCoachAvailability,
  initializeDiscordAuth,
} from "@/app/actions/coaching-actions";

interface CoachingClientProps {
  coaches: Coach[];
  isAuthenticated: boolean;
}

export default function CoachingClient({ coaches, isAuthenticated }: CoachingClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [isBookingSession, setIsBookingSession] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [requiresDiscordAuth, setRequiresDiscordAuth] = useState(false);
  const { toast } = useToast();

  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    date: "",
    time: "",
    duration: 60,
    notes: "",
    sessionType: "video",
  });

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
    { value: "fl-studio", label: "FL Studio" },
  ];

  const durationOptions = [
    { value: 30, label: "30 minutes" },
    { value: 60, label: "1 hour" },
    { value: 90, label: "1.5 hours" },
    { value: 120, label: "2 hours" },
  ];

  const timeSlots = [
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
  ];

  const filteredCoaches = coaches.filter((coach) => {
    const matchesSearch =
      searchQuery === "" ||
      coach.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coach.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coach.specialties.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSpecialty =
      selectedSpecialty === "all" || coach.specialties.includes(selectedSpecialty);

    return matchesSearch && matchesSpecialty;
  });

  const handleBookSession = async (coach: Coach) => {
    if (!isAuthenticated) {
      window.location.href = "/sign-in";
      return;
    }

    setSelectedCoach(coach);
    setIsBookingDialogOpen(true);
    setRequiresDiscordAuth(false);

    // Reset form
    setBookingForm({
      date: "",
      time: "",
      duration: 60,
      notes: "",
      sessionType: "video",
    });

    setAvailableSlots([]);
  };

  const fetchAvailableSlots = async (date: string) => {
    if (!selectedCoach || !date) return;

    setIsLoadingSlots(true);
    try {
      const result = await getCoachAvailability(selectedCoach.userId, new Date(date));
      if (result.success) {
        setAvailableSlots(result.availability || []);
      } else {
        toast({
          title: "Error",
          description: "Failed to load available time slots",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching availability:", error);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleDateChange = (date: string) => {
    setBookingForm((prev) => ({ ...prev, date, time: "" }));
    fetchAvailableSlots(date);
  };

  const handleDiscordAuth = async () => {
    try {
      const result = await initializeDiscordAuth();
      if (result.success && result.authUrl) {
        window.location.href = result.authUrl;
      }
    } catch (error) {
      console.error("Discord auth error:", error);
      toast({
        title: "Error",
        description: "Failed to initialize Discord authentication",
        variant: "destructive",
      });
    }
  };

  const getAvailableTimeSlots = () => {
    if (!bookingForm.date || availableSlots.length === 0) return [];

    // Generate time slots based on coach availability
    const timeSlots: string[] = [];

    availableSlots.forEach((slot) => {
      const startTime = slot.startTime;
      const endTime = slot.endTime;

      // Convert times to minutes for easier calculation
      const startMinutes = timeToMinutes(startTime);
      const endMinutes = timeToMinutes(endTime);

      // Generate slots based on session duration
      for (let time = startMinutes; time + bookingForm.duration <= endMinutes; time += 30) {
        const timeString = minutesToTime(time);
        timeSlots.push(timeString);
      }
    });

    return timeSlots.sort();
  };

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
  };

  const calculateTotalCost = () => {
    if (!selectedCoach) return 0;
    return (selectedCoach.hourlyRate * bookingForm.duration) / 60;
  };

  const handleSubmitBooking = async () => {
    if (!selectedCoach || !bookingForm.date || !bookingForm.time) {
      toast({
        title: "Missing Information",
        description: "Please select a date and time for your session.",
        variant: "destructive",
      });
      return;
    }

    setIsBookingSession(true);

    try {
      const result = await createCoachingSession({
        coachId: selectedCoach.userId,
        scheduledDate: new Date(bookingForm.date),
        startTime: bookingForm.time,
        duration: bookingForm.duration,
        notes: bookingForm.notes,
        sessionType: bookingForm.sessionType,
      });

      if (result.success) {
        toast({
          title: "Session Booked Successfully!",
          description: `Your ${bookingForm.duration}-minute session with ${selectedCoach.firstName} ${selectedCoach.lastName} has been scheduled for ${bookingForm.date} at ${bookingForm.time}.`,
        });

        setIsBookingDialogOpen(false);
        setSelectedCoach(null);
      } else if ("requiresDiscordAuth" in result && result.requiresDiscordAuth) {
        setRequiresDiscordAuth(true);
        toast({
          title: "Discord Authentication Required",
          description: "Please link your Discord account to book coaching sessions.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Booking Failed",
          description: result.error || "Failed to book session",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Booking error:", error);
      toast({
        title: "Booking Failed",
        description: "Something went wrong while booking your session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBookingSession(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <>
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary to-secondary py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="mb-4 text-4xl font-bold md:text-5xl">
              Find Your Perfect <span className="text-yellow-300">Music Production</span> Coach
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-xl text-blue-100">
              Connect with expert producers for personalized mentorship, skill development, and
              career guidance
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link href="/become-a-coach">
                <Button size="lg" className="bg-white text-primary hover:bg-slate-100">
                  Become a Coach
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="border-b bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
              <Input
                placeholder="Search coaches by name or specialty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
              <SelectTrigger className="w-full md:w-64">
                <Filter className="mr-2 h-4 w-4" />
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
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {filteredCoaches.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="mx-auto mb-4 h-16 w-16 text-gray-400" />
              <h3 className="mb-2 text-2xl font-semibold text-gray-900">No coaches available</h3>
              <p className="mb-6 text-gray-600">
                {coaches.length === 0
                  ? "Be the first to join our coaching community!"
                  : "Try adjusting your search criteria to find more coaches."}
              </p>
              <Link href="/become-a-coach">
                <Button>
                  Apply to Become a Coach
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filteredCoaches.map((coach) => (
                <Card key={coach.id} className="transition-shadow hover:shadow-lg">
                  <CardHeader className="pb-4">
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={coach.imageUrl} alt={coach.firstName} />
                        <AvatarFallback className="bg-primary text-white">
                          {coach.firstName[0]}
                          {coach.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-xl font-semibold text-gray-900">
                          {coach.firstName} {coach.lastName}
                        </h3>
                        <div className="mt-1 flex items-center">
                          <div className="flex items-center">
                            {renderStars(coach.rating)}
                            <span className="ml-2 text-sm text-gray-600">
                              {coach.rating.toFixed(1)} ({coach.totalSessions} sessions)
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center font-semibold text-primary">
                          <DollarSign className="mr-1 h-4 w-4" />${coach.hourlyRate}/hour
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 line-clamp-3 text-sm text-gray-600">{coach.bio}</p>

                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {coach.specialties.slice(0, 3).map((specialty, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {specialty.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
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
                          <Clock className="mr-1 h-4 w-4" />
                          {coach.availability}
                        </div>
                        {coach.location && (
                          <div className="flex items-center">
                            <MapPin className="mr-1 h-4 w-4" />
                            {coach.location}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 flex gap-2">
                      <Button
                        className="flex-1"
                        size="sm"
                        disabled={!isAuthenticated}
                        onClick={() => handleBookSession(coach)}
                      >
                        <Video className="mr-2 h-4 w-4" />
                        Book Session
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!isAuthenticated}
                        onClick={() => {
                          if (!isAuthenticated) {
                            window.location.href = "/sign-in";
                          } else {
                            // TODO: Implement messaging functionality
                            console.log("Message coach:", coach.id);
                          }
                        }}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Booking Dialog */}
      <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Book Session with {selectedCoach?.firstName} {selectedCoach?.lastName}
            </DialogTitle>
            <DialogDescription>
              Schedule your music production coaching session. You'll receive a confirmation email
              with meeting details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Discord Authentication Warning */}
            {requiresDiscordAuth && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-start space-x-3">
                  <MessageSquare className="mt-0.5 h-5 w-5 text-red-600" />
                  <div className="flex-1">
                    <h4 className="mb-1 font-medium text-red-900">
                      Discord Authentication Required
                    </h4>
                    <p className="mb-3 text-sm text-red-800">
                      To book coaching sessions, you need to link your Discord account. This allows
                      us to create private channels and give you access to your coaching sessions.
                    </p>
                    <Button
                      size="sm"
                      onClick={handleDiscordAuth}
                      className="bg-[#5865F2] text-white hover:bg-[#4752C4]"
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Connect Discord
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Coach Summary */}
            <div className="rounded-lg bg-slate-50 p-4">
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedCoach?.imageUrl} alt={selectedCoach?.firstName} />
                  <AvatarFallback className="bg-primary text-sm text-white">
                    {selectedCoach?.firstName?.[0]}
                    {selectedCoach?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h4 className="font-medium text-dark">
                    {selectedCoach?.firstName} {selectedCoach?.lastName}
                  </h4>
                  <div className="flex items-center text-sm text-slate-600">
                    <DollarSign className="mr-1 h-3 w-3" />${selectedCoach?.hourlyRate}/hour
                  </div>
                </div>
              </div>
            </div>

            {/* Date Selection */}
            <div>
              <Label htmlFor="session-date">Session Date</Label>
              <Input
                id="session-date"
                type="date"
                value={bookingForm.date}
                onChange={(e) => handleDateChange(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="mt-1"
              />
            </div>

            {/* Time Selection - Only show available slots */}
            <div>
              <Label htmlFor="session-time">Available Time Slots</Label>
              {isLoadingSlots ? (
                <div className="mt-1 flex items-center justify-center rounded-md border p-3">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading available slots...
                </div>
              ) : (
                <Select
                  value={bookingForm.time}
                  onValueChange={(value) => setBookingForm((prev) => ({ ...prev, time: value }))}
                  disabled={!bookingForm.date || getAvailableTimeSlots().length === 0}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue
                      placeholder={
                        !bookingForm.date
                          ? "Select a date first"
                          : getAvailableTimeSlots().length === 0
                            ? "No available slots"
                            : "Select time slot"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableTimeSlots().map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {bookingForm.date && getAvailableTimeSlots().length === 0 && !isLoadingSlots && (
                <p className="mt-1 text-sm text-slate-500">
                  No available slots for this date. Please select a different date.
                </p>
              )}
            </div>

            {/* Duration Selection */}
            <div>
              <Label htmlFor="session-duration">Session Duration</Label>
              <Select
                value={bookingForm.duration.toString()}
                onValueChange={(value) => {
                  setBookingForm((prev) => ({ ...prev, duration: parseInt(value), time: "" }));
                  if (bookingForm.date) {
                    fetchAvailableSlots(bookingForm.date);
                  }
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Session Notes */}
            <div>
              <Label htmlFor="session-notes">Session Notes (Optional)</Label>
              <Textarea
                id="session-notes"
                placeholder="What would you like to focus on in this session? Any specific tracks or techniques you'd like to work on?"
                value={bookingForm.notes}
                onChange={(e) => setBookingForm((prev) => ({ ...prev, notes: e.target.value }))}
                className="mt-1 min-h-[80px]"
                rows={3}
              />
            </div>

            {/* Cost Summary */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span>Duration:</span>
                <span>{bookingForm.duration} minutes</span>
              </div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span>Rate:</span>
                <span>${selectedCoach?.hourlyRate}/hour</span>
              </div>
              <div className="border-t border-primary/20 pt-2">
                <div className="flex items-center justify-between font-semibold">
                  <span>Total Cost:</span>
                  <span className="text-primary">${calculateTotalCost().toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsBookingDialogOpen(false)}
                className="flex-1"
                disabled={isBookingSession}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitBooking}
                className="flex-1"
                disabled={
                  isBookingSession || !bookingForm.date || !bookingForm.time || requiresDiscordAuth
                }
              >
                {isBookingSession ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Booking...
                  </>
                ) : (
                  <>
                    <Calendar className="mr-2 h-4 w-4" />
                    Book Session
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

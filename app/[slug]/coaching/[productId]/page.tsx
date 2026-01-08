"use client";

import { use, useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  Clock,
  User,
  MessageCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { toast } from "sonner";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
} from "date-fns";

interface CoachingBookingPageProps {
  params: Promise<{
    slug: string;
    productId: string;
  }>;
}

function isConvexId(str: string): boolean {
  return /^[a-z0-9]{32}$/.test(str);
}

export default function CoachingBookingPage({ params }: CoachingBookingPageProps) {
  const { slug: storeSlug, productId: productSlugOrId } = use(params);
  const { user, isLoaded: userLoaded } = useUser();
  const router = useRouter();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [isBooking, setIsBooking] = useState(false);

  const store = useQuery(api.stores.getStoreBySlug, { slug: storeSlug });

  const productBySlug = useQuery(
    api.coachingProducts.getCoachingProductBySlug,
    store?._id && !isConvexId(productSlugOrId)
      ? { storeId: store._id, slug: productSlugOrId }
      : "skip"
  );

  const productById = useQuery(
    api.coachingProducts.getCoachingProductForBooking,
    isConvexId(productSlugOrId) ? { productId: productSlugOrId as Id<"digitalProducts"> } : "skip"
  );

  const product = productBySlug || productById;

  const availableSlots = useQuery(
    api.coachingProducts.getAvailableSlots,
    selectedDate && product?._id
      ? {
          productId: product._id,
          date: selectedDate.getTime(),
        }
      : "skip"
  );

  const discordConnection = useQuery(
    api.coachingProducts.checkUserDiscordConnection,
    user?.id ? { userId: user.id } : "skip"
  );

  const bookSession = useMutation(api.coachingProducts.bookCoachingSession);

  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const availability = product?.availability?.weekSchedule;
  const enabledDays = useMemo(() => {
    if (!availability?.schedule) return new Set<string>();
    return new Set(
      availability.schedule
        .filter((d: any) => d.enabled && d.timeSlots?.length > 0)
        .map((d: any) => d.day)
    );
  }, [availability]);

  const isDayAvailable = (date: Date) => {
    if (isBefore(startOfDay(date), startOfDay(new Date()))) return false;
    const dayName = format(date, "EEEE").toLowerCase();
    return enabledDays.has(dayName);
  };

  const handleBookSession = async () => {
    if (!user?.id || !selectedDate || !selectedSlot || !product) {
      toast.error("Please select a date and time slot");
      return;
    }

    if (!discordConnection?.isConnected) {
      toast.error("Please connect your Discord account first");
      return;
    }

    setIsBooking(true);
    try {
      if (product.price > 0) {
        const response = await fetch("/api/coaching/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: product._id,
            productTitle: product.title,
            price: product.price,
            duration: product.duration,
            scheduledDate: selectedDate.getTime(),
            startTime: selectedSlot,
            customerEmail: user.primaryEmailAddress?.emailAddress,
            customerName: user.fullName,
            userId: user.id,
            storeSlug: storeSlug,
            notes,
          }),
        });

        const data = await response.json();
        if (data.success && data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
          return;
        } else {
          toast.error(data.error || "Failed to create checkout");
        }
      } else {
        const result = await bookSession({
          productId: product._id,
          studentId: user.id,
          scheduledDate: selectedDate.getTime(),
          startTime: selectedSlot,
          notes: notes || undefined,
        });

        if (result.success) {
          toast.success("Session booked successfully!");
          router.push("/dashboard/coaching");
        } else if (result.requiresDiscordAuth) {
          toast.error("Please connect Discord first");
        } else {
          toast.error(result.error || "Failed to book session");
        }
      }
    } catch (error) {
      toast.error("Failed to book session");
    } finally {
      setIsBooking(false);
    }
  };

  if (product === null) {
    notFound();
  }

  if (!product || !store) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link
          href={`/${storeSlug}`}
          className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to {store.name}
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-start gap-4">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.title}
                      width={80}
                      height={80}
                      className="rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-muted">
                      <User className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <CardTitle className="text-2xl">{product.title}</CardTitle>
                    <p className="mt-1 text-muted-foreground">{product.description}</p>
                    <div className="mt-3 flex items-center gap-4">
                      <Badge variant="secondary">
                        <Clock className="mr-1 h-3 w-3" />
                        {product.duration || 60} min
                      </Badge>
                      <span className="text-2xl font-bold">
                        {product.price === 0 ? "Free" : `$${product.price}`}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Select a Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h3 className="font-semibold">{format(currentMonth, "MMMM yyyy")}</h3>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mb-2 grid grid-cols-7 gap-1">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div
                      key={day}
                      className="py-2 text-center text-xs font-medium text-muted-foreground"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {Array.from({
                    length: new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth(),
                      1
                    ).getDay(),
                  }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {calendarDays.map((day) => {
                    const available = isDayAvailable(day);
                    const selected = selectedDate && isSameDay(day, selectedDate);
                    const today = isToday(day);

                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => available && setSelectedDate(day)}
                        disabled={!available}
                        className={`rounded-lg p-2 text-sm transition-all ${available ? "cursor-pointer hover:bg-primary/10" : "cursor-not-allowed text-muted-foreground/40"} ${selected ? "bg-primary text-primary-foreground" : ""} ${today && !selected ? "ring-1 ring-primary" : ""} `}
                      >
                        {format(day, "d")}
                      </button>
                    );
                  })}
                </div>

                {availability?.timezone && (
                  <p className="mt-4 text-center text-xs text-muted-foreground">
                    Times shown in {availability.timezone}
                  </p>
                )}
              </CardContent>
            </Card>

            {selectedDate && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Available Times for {format(selectedDate, "EEEE, MMMM d")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {availableSlots === undefined ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : availableSlots.filter(
                      (s: { start: string; end: string; available: boolean }) => s.available
                    ).length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <AlertCircle className="mx-auto mb-2 h-8 w-8" />
                      <p>No available slots on this date</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {availableSlots
                        .filter(
                          (slot: { start: string; end: string; available: boolean }) =>
                            slot.available
                        )
                        .map((slot: { start: string; end: string; available: boolean }) => (
                          <button
                            key={slot.start}
                            onClick={() => setSelectedSlot(slot.start)}
                            className={`rounded-lg border p-3 text-sm font-medium transition-all ${
                              selectedSlot === slot.start
                                ? "border-primary bg-primary text-primary-foreground"
                                : "bg-background hover:border-primary/50"
                            } `}
                          >
                            {slot.start}
                          </button>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {selectedSlot && (
              <Card>
                <CardHeader>
                  <CardTitle>Additional Notes (Optional)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Any specific topics you'd like to cover, questions, or context..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="bg-background"
                  />
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader className="pb-4">
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 rounded-lg bg-muted/50 p-3">
                  <Avatar className="h-12 w-12 ring-2 ring-background">
                    <AvatarImage src={store.logoUrl} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-lg text-white">
                      {store.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{store.name}</p>
                    <p className="text-sm text-muted-foreground">Coaching Session</p>
                  </div>
                </div>

                <div className="space-y-3 border-t pt-4">
                  <div className="flex justify-between gap-4">
                    <span className="text-sm text-muted-foreground">Session</span>
                    <span className="flex-1 truncate text-right text-sm font-medium">
                      {product.title}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-sm text-muted-foreground">Duration</span>
                    <span className="text-sm font-medium">{product.duration || 60} minutes</span>
                  </div>
                  {selectedDate && (
                    <div className="flex justify-between gap-4">
                      <span className="text-sm text-muted-foreground">Date</span>
                      <span className="text-sm font-medium">
                        {format(selectedDate, "EEEE, MMM d, yyyy")}
                      </span>
                    </div>
                  )}
                  {selectedSlot && (
                    <div className="flex justify-between gap-4">
                      <span className="text-sm text-muted-foreground">Time</span>
                      <span className="text-sm font-medium">{selectedSlot}</span>
                    </div>
                  )}
                  {!selectedDate && !selectedSlot && (
                    <p className="text-sm italic text-muted-foreground">
                      Select a date and time above
                    </p>
                  )}
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Total</span>
                    <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {product.price === 0 ? "Free" : `$${product.price}`}
                    </span>
                  </div>
                </div>

                <div
                  className={`rounded-lg p-3 ${discordConnection?.isConnected ? "bg-green-50 dark:bg-green-950/20" : "bg-orange-50 dark:bg-orange-950/20"}`}
                >
                  <div className="flex items-center gap-2">
                    <MessageCircle
                      className={`h-4 w-4 ${discordConnection?.isConnected ? "text-green-600" : "text-orange-600"}`}
                    />
                    <span className="text-sm font-medium">
                      {discordConnection?.isConnected
                        ? `Discord: ${discordConnection.discordUsername}`
                        : "Discord Required"}
                    </span>
                  </div>
                  {!discordConnection?.isConnected && (
                    <>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Sessions are held on Discord for quality assurance
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 w-full"
                        onClick={() => {
                          const returnUrl = window.location.pathname;
                          const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
                          if (!clientId) {
                            toast.error("Discord not configured");
                            return;
                          }
                          const redirectUri = encodeURIComponent(
                            `${window.location.origin}/api/auth/discord/callback`
                          );
                          const scope = encodeURIComponent("identify guilds.join");
                          const stateParam = encodeURIComponent(returnUrl);
                          window.location.href = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${stateParam}`;
                        }}
                      >
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Connect Discord
                      </Button>
                    </>
                  )}
                </div>

                {!userLoaded ? (
                  <Button disabled className="w-full">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </Button>
                ) : !user ? (
                  <Button className="w-full" asChild>
                    <Link
                      href={`/sign-in?redirect_url=${encodeURIComponent(window.location.pathname)}`}
                    >
                      Sign in to Book
                    </Link>
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    size="lg"
                    disabled={
                      !selectedDate || !selectedSlot || isBooking || !discordConnection?.isConnected
                    }
                    onClick={handleBookSession}
                  >
                    {isBooking ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Booking...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        {product.price === 0 ? "Book Free Session" : `Book - $${product.price}`}
                      </>
                    )}
                  </Button>
                )}

                {product.deliverables && (
                  <div className="border-t pt-4">
                    <p className="mb-2 text-sm font-medium">What you'll get:</p>
                    <p className="text-sm text-muted-foreground">{product.deliverables}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

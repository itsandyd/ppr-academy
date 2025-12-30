"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  Clock,
  Video,
  User,
  Search,
  CalendarPlus,
  MessageCircle,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { formatDistanceToNow, format } from "date-fns";

export default function LibraryCoachingPage() {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");

  // This would need to be implemented in Convex
  const coachingSessions = useQuery(
    api.library.getUserPurchases,
    user?.id ? { userId: user.id } : "skip"
  )?.filter((p: any) => p.productType === "coaching");

  const stats = {
    total: coachingSessions?.length || 0,
    upcoming: 0, // Would need to implement session scheduling
    completed: 0,
    cancelled: 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Coaching</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your coaching sessions and connect with mentors
          </p>
        </div>
        <Button asChild>
          <Link href="/courses">
            <CalendarPlus className="mr-2 h-4 w-4" />
            Book New Session
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Sessions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.upcoming}</div>
            <div className="text-sm text-muted-foreground">Upcoming</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
            <div className="text-sm text-muted-foreground">Cancelled</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search sessions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Sessions List */}
      {coachingSessions && coachingSessions.length > 0 ? (
        <div className="space-y-4">
          {coachingSessions.map((session: any) => (
            <Card key={session._id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                      <User className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-foreground">{session.productTitle}</h3>
                      <p className="text-sm text-muted-foreground">with {session.storeName}</p>
                      <div className="mt-2 flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Purchased{" "}
                            {formatDistanceToNow(new Date(session._creationTime), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>60 min session</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">Purchased</Badge>
                    <Button size="sm">
                      <Calendar className="mr-2 h-4 w-4" />
                      Schedule
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h2 className="mb-2 text-2xl font-bold text-foreground">No coaching sessions</h2>
            <p className="mb-6 text-muted-foreground">
              Book your first coaching session to get personalized guidance
            </p>
            <Button asChild>
              <Link href="/courses">
                <CalendarPlus className="mr-2 h-4 w-4" />
                Browse Coaches
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Sessions Section (placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Upcoming Sessions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            <AlertCircle className="mx-auto mb-2 h-8 w-8" />
            <p>Session scheduling system coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

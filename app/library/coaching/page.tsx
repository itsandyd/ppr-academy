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
  )?.filter(p => p.productType === "coaching");

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
          <p className="text-muted-foreground mt-2">
            Manage your coaching sessions and connect with mentors
          </p>
        </div>
        <Button asChild>
          <Link href="/courses">
            <CalendarPlus className="w-4 h-4 mr-2" />
            Book New Session
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
          {coachingSessions.map((session) => (
            <Card key={session._id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-foreground">
                        {session.productTitle}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        with {session.storeName}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>Purchased {formatDistanceToNow(new Date(session._creationTime), { addSuffix: true })}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>60 min session</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">
                      Purchased
                    </Badge>
                    <Button size="sm">
                      <Calendar className="w-4 h-4 mr-2" />
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
          <CardContent className="text-center py-12">
            <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">No coaching sessions</h2>
            <p className="text-muted-foreground mb-6">
              Book your first coaching session to get personalized guidance
            </p>
            <Button asChild>
              <Link href="/courses">
                <CalendarPlus className="w-4 h-4 mr-2" />
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
            <Calendar className="w-5 h-5" />
            <span>Upcoming Sessions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p>Session scheduling system coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

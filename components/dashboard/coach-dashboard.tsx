import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { Users, Calendar, Star, Clock, TrendingUp, DollarSign, Video, MessageSquare } from "lucide-react";

interface CoachDashboardProps {
  user: any;
  coachingSessions: any[];
  dashboardStats: any;
}

export function CoachDashboard({ user, coachingSessions, dashboardStats }: CoachDashboardProps) {
  return (
    <>
      {/* Coach Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
            <div className="flex items-center space-x-4 mb-4 lg:mb-0">
              <Avatar className="w-16 h-16 border-2 border-white">
                <AvatarImage src={user.imageUrl} />
                <AvatarFallback className="text-lg bg-white text-purple-600">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold">
                  Coach Dashboard - {user.firstName}
                </h1>
                <p className="text-purple-100">Help producers reach their full potential</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <p className="text-3xl font-bold">0</p>
                <p className="text-sm text-purple-100">Active Students</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">0</p>
                <p className="text-sm text-purple-100">Sessions</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">-</p>
                <p className="text-sm text-purple-100">Rating</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-dark mb-6">Coaching Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600">Total Sessions</p>
                        <p className="text-2xl font-bold">0</p>
                      </div>
                      <Video className="w-8 h-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600">Revenue</p>
                        <p className="text-2xl font-bold">$0</p>
                      </div>
                      <DollarSign className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600">Avg Rating</p>
                        <p className="text-2xl font-bold">-</p>
                      </div>
                      <Star className="w-8 h-8 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600">Response Time</p>
                        <p className="text-2xl font-bold">-</p>
                      </div>
                      <MessageSquare className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Quick Actions */}
            <section>
              <h2 className="text-2xl font-bold text-dark mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <Calendar className="w-8 h-8 text-primary mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">Set Availability</h3>
                    <p className="text-sm text-slate-600">Update your coaching schedule</p>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <Users className="w-8 h-8 text-secondary mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">View Students</h3>
                    <p className="text-sm text-slate-600">Manage your coaching relationships</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <TrendingUp className="w-8 h-8 text-accent mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">Performance</h3>
                    <p className="text-sm text-slate-600">Track your coaching impact</p>
                  </CardContent>
                </Card>
              </div>
            </section>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-6">
            <section className="text-center py-12">
              <Video className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No coaching sessions yet</h3>
              <p className="text-slate-600 mb-4">Start offering your expertise to music producers</p>
              <Button>Set Up Coaching Profile</Button>
            </section>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-6">
            <section className="text-center py-12">
              <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No students yet</h3>
              <p className="text-slate-600">Your coaching students will appear here</p>
            </section>
          </TabsContent>

          {/* Availability Tab */}
          <TabsContent value="availability" className="space-y-6">
            <section className="text-center py-12">
              <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Set your coaching availability</h3>
              <p className="text-slate-600 mb-4">Let students know when you're available for sessions</p>
              <Button>Configure Availability</Button>
            </section>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
} 
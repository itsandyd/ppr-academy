"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TopCreatorsLeaderboard, 
  TopStudentsLeaderboard, 
  ActiveUsersLeaderboard 
} from "@/components/gamification/leaderboard";
import { 
  Trophy, 
  Crown, 
  Star, 
  Flame, 
  TrendingUp,
  Award,
  Users,
  Sparkles
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function LeaderboardsPage() {
  return (
    <div className="container max-w-6xl mx-auto py-8 space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 rounded-full mb-4">
          <Trophy className="w-5 h-5 text-amber-600" />
          <span className="text-sm font-medium text-amber-900 dark:text-amber-100">
            Community Leaderboards
          </span>
        </div>
        
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Top Performers
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          See who's leading the pack! Compete with fellow creators and students to climb the rankings.
        </p>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <p className="text-2xl font-bold">247</p>
            <p className="text-sm text-muted-foreground">Active Creators</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
              <Star className="w-6 h-6 text-white" />
            </div>
            <p className="text-2xl font-bold">1,542</p>
            <p className="text-sm text-muted-foreground">Active Students</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-orange-400 to-red-600 rounded-full flex items-center justify-center">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <p className="text-2xl font-bold">89</p>
            <p className="text-sm text-muted-foreground">7-Day Streaks</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <p className="text-2xl font-bold">+12%</p>
            <p className="text-sm text-muted-foreground">Growth This Week</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Leaderboards Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs defaultValue="creators" className="w-full">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 h-12">
            <TabsTrigger value="creators" className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              <span>Top Creators</span>
            </TabsTrigger>
            <TabsTrigger value="students" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              <span>Top Students</span>
            </TabsTrigger>
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Flame className="w-4 h-4" />
              <span>Most Active</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="creators" className="mt-6">
            <TopCreatorsLeaderboard />
            
            {/* How to Climb */}
            <Card className="mt-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border-amber-200 dark:border-amber-800">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-2">How to Climb the Creator Leaderboard</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Publish high-quality products that generate revenue</li>
                      <li>• Get positive reviews from customers</li>
                      <li>• Maintain consistent sales momentum</li>
                      <li>• Engage with your community</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students" className="mt-6">
            <TopStudentsLeaderboard />
            
            {/* How to Climb */}
            <Card className="mt-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 border-blue-200 dark:border-blue-800">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-2">How to Climb the Student Leaderboard</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Complete courses to earn XP</li>
                      <li>• Maintain daily learning streaks</li>
                      <li>• Participate in community discussions</li>
                      <li>• Earn achievements and certificates</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="active" className="mt-6">
            <ActiveUsersLeaderboard />
            
            {/* How to Climb */}
            <Card className="mt-6 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/10 dark:to-red-900/10 border-orange-200 dark:border-orange-800">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-2">How to Stay Active</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Log in daily to build your streak</li>
                      <li>• Engage with courses regularly</li>
                      <li>• Participate in Discord community</li>
                      <li>• Share your progress and wins</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0">
          <CardContent className="p-8 text-center">
            <Trophy className="w-16 h-16 mx-auto mb-4 opacity-90" />
            <h3 className="text-2xl font-bold mb-2">Want to See Your Name Here?</h3>
            <p className="text-white/90 mb-6 max-w-md mx-auto">
              Start creating amazing content, engage with the community, and climb your way to the top!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                size="lg" 
                variant="secondary"
                className="bg-white text-purple-600 hover:bg-white/90"
                asChild
              >
                <Link href="/home">
                  Create Your First Product
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-white text-white hover:bg-white/10"
                asChild
              >
                <Link href="/library">
                  Start Learning
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}


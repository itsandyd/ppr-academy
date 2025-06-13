import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { getUserFromClerk, getUserEnrollments, getUserCourses, getFeaturedCourses, getPopularCourses } from "@/lib/data";
import { 
  BookOpen, 
  Users, 
  TrendingUp, 
  Clock, 
  PlayCircle, 
  Star,
  Calendar,
  Award,
  Plus,
  Eye,
  Edit,
  Target,
  Zap,
  Sparkles,
  FileText,
  Search,
  Pin,
  Archive,
  Trash2,
  Tag,
  X
} from "lucide-react";
import { StudentDashboard } from "@/components/dashboard/student-dashboard";
import { CreatorDashboard } from "@/components/dashboard/creator-dashboard";

export default async function Dashboard() {
  const { userId: clerkId } = await auth();
  
  if (!clerkId) {
    redirect("/");
  }

  const user = await getUserFromClerk(clerkId);
  
  if (!user) {
    // User doesn't exist in database yet, maybe redirect to a setup page
    return (
      <div className="min-h-screen bg-slate-50 pt-16 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Setting up your account...</h2>
            <p className="text-slate-600 mb-6">
              We're creating your profile. Please refresh the page in a moment.
            </p>
            <Link href="/dashboard">
              <Button>Refresh Page</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch all data in parallel
  const [enrollments, courses, featuredCourses, popularCourses] = await Promise.all([
    getUserEnrollments(user.id),
    getUserCourses(user.id),
    getFeaturedCourses(),
    getPopularCourses(),
  ]);

  // Calculate dashboard stats
  const dashboardStats = {
    enrolledCourses: enrollments.length,
    createdCourses: courses.length,
    totalStudents: courses.reduce((acc, course) => acc + (course._count?.enrollments || 0), 0),
    completedCourses: enrollments.filter((e: any) => e.progress === 100).length,
  };

  // Determine user role - for now, we'll use a simple logic
  // If user has created courses, they're a creator
  // Otherwise, they're a student
  // In the future, you could add a role field to the User model
  const userRole: 'student' | 'creator' | 'coach' = courses.length > 0 ? 'creator' : 'student';

  return (
    <div className="min-h-screen bg-slate-50 pt-16">
      {/* Render role-specific dashboard */}
      {userRole === 'student' ? (
        <StudentDashboard 
          user={user} 
          enrollments={enrollments} 
          dashboardStats={dashboardStats}
          featuredCourses={featuredCourses}
          popularCourses={popularCourses}
        />
      ) : (
        <CreatorDashboard 
          user={user} 
          userCourses={courses} 
          coachingSessions={[]} 
          dashboardStats={dashboardStats} 
        />
      )}
    </div>
  );
} 
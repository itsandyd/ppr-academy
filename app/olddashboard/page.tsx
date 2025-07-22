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
import { ensureUserExists } from "@/app/actions/user-actions";
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
  X,
  Settings,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  User,
  GraduationCap,
  Video,
  UserCheck,
  RefreshCw
} from "lucide-react";
import { StudentDashboard } from "@/components/dashboard/student-dashboard";
import { CreatorDashboard } from "@/components/dashboard/creator-dashboard";
import UnifiedDashboard from "@/components/dashboard/unified-dashboard";
import DashboardNavbar from "@/components/dashboard-navbar";
import { UserSyncFallback, UserErrorFallback } from "@/components/user-sync-fallback";

export default async function olddashboard() {
  const { userId: clerkId } = await auth();
  
  if (!clerkId) {
    redirect("/");
  }

  // Try to get user from database first
  let user = await getUserFromClerk(clerkId);
  
  // If user doesn't exist, try to create them automatically
  if (!user) {
    console.log(`⚠️ User not found in database, attempting automatic creation...`);
    
    try {
      const result = await ensureUserExists();
      if (result.success) {
        // Re-fetch the user after creation
        user = await getUserFromClerk(clerkId);
        console.log(`✅ User automatically created and fetched`);
      } else {
        console.error(`❌ Failed to automatically create user: ${result.error}`);
      }
    } catch (error) {
      console.error(`💥 Error during automatic user creation:`, error);
    }
  }

  // If user still doesn't exist after automatic creation attempt, show fallback UI
  if (!user) {
    return <UserErrorFallback clerkId={clerkId} />;
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

  // Format user data for navbar
  const navbarUser = {
    name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
    instructor: courses.length > 0,
    admin: user.admin || false
  };

  return (
    <>
      <DashboardNavbar user={navbarUser} />
      <div className="min-h-screen bg-slate-50 pt-16">
        <UnifiedDashboard 
          user={user}
          enrollments={enrollments}
          userCourses={courses}
          dashboardStats={dashboardStats}
          featuredCourses={featuredCourses}
          popularCourses={popularCourses}
        />
      </div>
    </>
  );
} 
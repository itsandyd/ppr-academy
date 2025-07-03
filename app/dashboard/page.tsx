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

// Component for handling user sync
function UserSyncFallback({ clerkId }: { clerkId: string }) {
  const handleSyncUser = async () => {
    try {
      const response = await fetch('/api/sync-user', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        // Refresh the page to try loading again
        window.location.reload();
      } else {
        console.error('Failed to sync user');
        alert('Failed to sync user. Please try again or contact support.');
      }
    } catch (error) {
      console.error('Error syncing user:', error);
      alert('Error syncing user. Please try again or contact support.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-16 flex items-center justify-center">
      <Card className="max-w-lg">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Setting up your account...</h2>
          <p className="text-slate-600 mb-6">
            We're creating your profile in our database. This usually happens automatically, 
            but sometimes we need to sync it manually.
          </p>
          <div className="space-y-4">
            <Button 
              onClick={handleSyncUser} 
              className="w-full"
              size="lg"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Sync Account Now
            </Button>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Page
              </Button>
            </Link>
          </div>
          <p className="text-sm text-slate-500 mt-4">
            If this continues to fail, please contact support with your user ID: 
            <code className="bg-slate-100 px-2 py-1 rounded text-xs">{clerkId}</code>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function Dashboard() {
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
    return (
      <div className="min-h-screen bg-slate-50 pt-16 flex items-center justify-center">
        <Card className="max-w-lg">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Account Setup Issue</h2>
            <p className="text-slate-600 mb-6">
              We're having trouble setting up your account. This usually happens due to a temporary connection issue.
            </p>
            <div className="space-y-4">
              <Link href="/dashboard">
                <Button className="w-full" size="lg">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </Link>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/">
                  Back to Home
                </Link>
              </Button>
            </div>
            <p className="text-sm text-slate-500 mt-4">
              If this problem persists, please contact support with your user ID: 
              <code className="bg-slate-100 px-2 py-1 rounded text-xs">{clerkId}</code>
            </p>
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
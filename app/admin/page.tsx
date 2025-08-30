import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getAdminStats, getAllUsers, getPendingCourses, getAllCourses, getRecentReviews, getCoachApplications } from "@/lib/admin-data";
import AdminDashboard from "@/components/admin/admin-dashboard";

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const { userId: clerkId } = await auth();
  
  if (!clerkId) {
    redirect("/");
  }

  // Fetch user and check admin status
  const { getUserFromClerk } = await import("@/lib/data");
  const user = await getUserFromClerk(clerkId);
  
  if (!user || !user.admin) {
    // Not an admin, redirect to dashboard
    redirect("/dashboard");
  }

  // Fetch all admin data in parallel
  const [adminStats, allUsers, pendingCourses, allCourses, recentReviews, coachApplications] = await Promise.all([
    getAdminStats(),
    getAllUsers(),
    getPendingCourses(),
    getAllCourses(),
    getRecentReviews(),
    getCoachApplications(),
  ]);

  return (
    <AdminDashboard
      user={user}
      adminStats={adminStats}
      allUsers={allUsers}
      pendingCourses={pendingCourses}
      allCourses={allCourses}
      recentReviews={recentReviews}
      coachApplications={coachApplications}
    />
  );
} 
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  Search,
  UserPlus,
  MoreVertical,
  Mail,
  Shield,
  Ban,
  CheckCircle,
  Loader2,
  Lock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const USERS_PER_PAGE = 20;

export default function UsersManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [paginationCursor, setPaginationCursor] = useState<string | null>(null);
  const [cursorHistory, setCursorHistory] = useState<(string | null)[]>([null]);
  const [currentPage, setCurrentPage] = useState(0);
  const { user, isLoaded } = useUser();
  const router = useRouter();
  
  // Check if user is admin
  const adminCheck = useQuery(
    api.users.checkIsAdmin,
    user?.id ? { clerkId: user.id } : "skip"
  );
  
  // Fetch paginated users (only if admin)
  const usersResult = useQuery(
    api.users.getAllUsers,
    user?.id && adminCheck?.isAdmin 
      ? { 
          clerkId: user.id,
          paginationOpts: {
            numItems: USERS_PER_PAGE,
            cursor: paginationCursor,
          }
        } 
      : "skip"
  );

  // Fetch user statistics
  const userStats = useQuery(
    api.users.getUserStats,
    user?.id && adminCheck?.isAdmin ? { clerkId: user.id } : "skip"
  );

  const users = usersResult?.page || [];

  // Redirect non-admin users
  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in?redirect_url=/admin/users");
    } else if (adminCheck !== undefined && !adminCheck.isAdmin) {
      router.push("/");
    }
  }, [isLoaded, user, adminCheck, router]);

  // Show loading state
  if (!isLoaded || adminCheck === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  // Show access denied
  if (!adminCheck.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
                <Lock className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
                <p className="text-muted-foreground">
                  You don't have permission to access user management.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredUsers = users.filter((user) =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination handlers
  const handleNextPage = () => {
    if (usersResult && !usersResult.isDone) {
      const newCursor = usersResult.continueCursor;
      setCursorHistory([...cursorHistory, newCursor]);
      setPaginationCursor(newCursor);
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      const newHistory = cursorHistory.slice(0, -1);
      setCursorHistory(newHistory);
      setPaginationCursor(newHistory[newHistory.length - 1]);
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground">
            Manage all platform users and permissions
          </p>
        </div>
        <Button>
          <UserPlus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{userStats?.total || 0}</div>
            <div className="text-sm text-muted-foreground">Total Users</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {userStats?.creators || 0}
            </div>
            <div className="text-sm text-muted-foreground">Owners & Admins</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {userStats?.students || 0}
            </div>
            <div className="text-sm text-muted-foreground">Users & Guests</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {userStats?.verified || 0}
            </div>
            <div className="text-sm text-muted-foreground">Verified</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div
                key={user._id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                    <span className="text-purple-600 dark:text-purple-300 font-semibold">
                      {user.name?.charAt(0).toUpperCase() || "?"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{user.name || "Unknown"}</span>
                      {user.emailVerified && (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-3 h-3" />
                      {user.email || "No email"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Badge variant={
                    user.role === "AGENCY_OWNER" || user.role === "AGENCY_ADMIN" 
                      ? "default" 
                      : "secondary"
                  }>
                    {user.role === "AGENCY_OWNER" ? "Owner" :
                     user.role === "AGENCY_ADMIN" ? "Admin" :
                     user.role === "SUBACCOUNT_GUEST" ? "Guest" :
                     "User"}
                  </Badge>
                  
                  {user.stripeConnectAccountId && (
                    <Badge variant="outline">Stripe Connected</Badge>
                  )}

                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            {filteredUsers.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No users found matching your search.
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {!searchQuery && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Page {currentPage + 1} • Showing {filteredUsers.length} users
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 0}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={usersResult?.isDone}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


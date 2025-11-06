"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
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
  Edit,
  Eye,
  Trash2,
  UserCog,
  Send,
  Crown,
  Package,
  BookOpen,
  Music,
  FileText,
  Video,
  Clock,
  ListChecks
} from "lucide-react";
import { BulkSelectionTable, userBulkActions } from "@/components/admin/bulk-selection-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const USERS_PER_PAGE = 1000;

export default function UsersManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [paginationCursor, setPaginationCursor] = useState<string | null>(null);
  const [cursorHistory, setCursorHistory] = useState<(string | null)[]>([null]);
  const [currentPage, setCurrentPage] = useState(0);
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  
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

  // User action handlers
  const handleViewProfile = (userId: string, userName: string) => {
    toast({
      title: "View Profile",
      description: `Opening profile for ${userName}`,
    });
    // Navigate to user profile page
    router.push(`/admin/users/${userId}`);
  };

  const handleEditUser = (userId: string, userName: string) => {
    toast({
      title: "Edit User",
      description: `Opening editor for ${userName}`,
    });
    // Navigate to edit page or open modal
    router.push(`/admin/users/${userId}/edit`);
  };

  const handleEmailUser = (userEmail: string, userName: string) => {
    if (!userEmail) {
      toast({
        title: "No Email",
        description: "This user doesn't have an email address",
        variant: "destructive",
      });
      return;
    }
    // Open email client
    window.location.href = `mailto:${userEmail}`;
    toast({
      title: "Opening Email",
      description: `Composing email to ${userName}`,
    });
  };

  const handleToggleAdmin = (userId: string, userName: string, isCurrentlyAdmin: boolean) => {
    toast({
      title: isCurrentlyAdmin ? "Remove Admin" : "Make Admin",
      description: `This will ${isCurrentlyAdmin ? "remove admin access from" : "grant admin access to"} ${userName}`,
    });
    // TODO: Implement admin toggle mutation
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      toast({
        title: "Delete User",
        description: `Deleting ${userName}...`,
        variant: "destructive",
      });
      // TODO: Implement delete user mutation
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

      {/* Users Table with Bulk Selection */}
      <Card>
        <CardHeader>
          <CardTitle>All Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <BulkSelectionTable
            data={filteredUsers}
            columns={[
              {
                key: "name",
                label: "Name",
                render: (user: any) => (
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={user.imageUrl} />
                      <AvatarFallback className="bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300">
                        {user.name?.charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{user.name || "Unknown"}</span>
                        {user.emailVerified && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">{user.email || "No email"}</div>
                    </div>
                  </div>
                )
              },
              {
                key: "role",
                label: "Role",
                render: (user: any) => (
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
                )
              },
              {
                key: "content",
                label: "Content",
                render: (user: any) => {
                  // Fetch the user's store and content counts
                  const CreatorContentStats = ({ clerkId, userName }: { clerkId: string; userName: string }) => {
                    const [isOpen, setIsOpen] = useState(false);
                    const store = useQuery(api.stores.getUserStore, { userId: clerkId });
                    const courses = useQuery(
                      api.courses.getCoursesByUser,
                      clerkId ? { userId: clerkId } : "skip"
                    );
                    const products = useQuery(
                      api.digitalProducts.getProductsByUser,
                      clerkId ? { userId: clerkId } : "skip"
                    );
                    const samplePacks = useQuery(
                      api.samplePacks.getPacksByStore as any,
                      store?._id ? { storeId: store._id } : "skip"
                    );

                    if (!store) return <span className="text-xs text-muted-foreground">No store</span>;

                    const courseCount = courses?.length || 0;
                    const productCount = products?.length || 0;
                    const packCount = samplePacks?.length || 0;
                    const totalContent = courseCount + productCount + packCount;

                    if (totalContent === 0) {
                      return <span className="text-xs text-muted-foreground">No content</span>;
                    }

                    return (
                      <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild>
                          <button className="flex items-center gap-3 text-xs hover:opacity-70 transition-opacity">
                            {courseCount > 0 && (
                              <div className="flex items-center gap-1">
                                <BookOpen className="w-3 h-3 text-blue-500" />
                                <span>{courseCount}</span>
                              </div>
                            )}
                            {productCount > 0 && (
                              <div className="flex items-center gap-1">
                                <Package className="w-3 h-3 text-green-500" />
                                <span>{productCount}</span>
                              </div>
                            )}
                            {packCount > 0 && (
                              <div className="flex items-center gap-1">
                                <Music className="w-3 h-3 text-purple-500" />
                                <span>{packCount}</span>
                              </div>
                            )}
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white dark:bg-black">
                          <DialogHeader>
                            <DialogTitle>Content for {userName}</DialogTitle>
                            <DialogDescription>
                              View all courses, products, and sample packs by this creator
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-6 mt-4">
                            {/* Courses */}
                            {courseCount > 0 && (
                              <div>
                                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                  <BookOpen className="w-4 h-4 text-blue-500" />
                                  Courses ({courseCount})
                                </h3>
                                <Accordion type="single" collapsible className="space-y-2">
                                  {courses?.map((course: any, idx: number) => {
                                    // Calculate course completion percentage
                                    const totalChapters = course.chapters?.length || 0;
                                    const completedChapters = course.chapters?.filter((ch: any) => ch.isPublished)?.length || 0;
                                    const completionPercent = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;
                                    
                                    return (
                                      <AccordionItem key={course._id} value={`course-${idx}`} className="border rounded-lg">
                                        <AccordionTrigger className="px-3 py-2 hover:no-underline hover:bg-muted/50">
                                          <div className="flex items-center justify-between w-full pr-2">
                                            <div className="flex-1 text-left">
                                              <p className="font-medium text-sm">{course.title}</p>
                                              <div className="flex items-center gap-2 mt-1">
                                                <Badge variant={course.isPublished ? "default" : "secondary"} className="text-xs">
                                                  {course.isPublished ? "Published" : "Draft"}
                                                </Badge>
                                                {course.price && (
                                                  <span className="text-xs text-muted-foreground">
                                                    ${(course.price / 100).toFixed(2)}
                                                  </span>
                                                )}
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                  <ListChecks className="w-3 h-3" />
                                                  <span>{completionPercent}% complete</span>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="px-3 pb-3">
                                          <div className="space-y-2 mt-2">
                                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                                              <span>{totalChapters} chapters total</span>
                                              <span>{completedChapters} published</span>
                                            </div>
                                            
                                            {/* Chapters List */}
                                            {course.chapters && course.chapters.length > 0 ? (
                                              <div className="space-y-1">
                                                {course.chapters.map((chapter: any, chIdx: number) => (
                                                  <div key={chapter._id || chIdx} className="flex items-center gap-2 p-2 bg-muted/30 rounded text-xs">
                                                    <span className="text-muted-foreground font-mono">{chIdx + 1}</span>
                                                    <div className="flex-1">
                                                      <p className="font-medium">{chapter.title || "Untitled Chapter"}</p>
                                                      <div className="flex items-center gap-2 mt-0.5">
                                                        {chapter.videoUrl && (
                                                          <span className="flex items-center gap-1 text-muted-foreground">
                                                            <Video className="w-3 h-3" />
                                                            Video
                                                          </span>
                                                        )}
                                                        {chapter.duration && (
                                                          <span className="flex items-center gap-1 text-muted-foreground">
                                                            <Clock className="w-3 h-3" />
                                                            {chapter.duration}
                                                          </span>
                                                        )}
                                                      </div>
                                                    </div>
                                                    <Badge variant={chapter.isPublished ? "outline" : "secondary"} className="text-xs">
                                                      {chapter.isPublished ? "✓" : "Draft"}
                                                    </Badge>
                                                  </div>
                                                ))}
                                              </div>
                                            ) : (
                                              <p className="text-xs text-muted-foreground italic">No chapters yet</p>
                                            )}

                                            {/* Course Stats */}
                                            {course.description && (
                                              <div className="mt-3 pt-2 border-t">
                                                <p className="text-xs text-muted-foreground line-clamp-2">
                                                  {course.description}
                                                </p>
                                              </div>
                                            )}
                                          </div>
                                        </AccordionContent>
                                      </AccordionItem>
                                    );
                                  })}
                                </Accordion>
                              </div>
                            )}

                            {/* Digital Products */}
                            {productCount > 0 && (
                              <div>
                                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                  <Package className="w-4 h-4 text-green-500" />
                                  Digital Products ({productCount})
                                </h3>
                                <div className="space-y-2">
                                  {products?.map((product: any) => (
                                    <div key={product._id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                                      <div className="flex-1">
                                        <p className="font-medium text-sm">{product.title}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                          <Badge variant={product.isPublished ? "default" : "secondary"} className="text-xs">
                                            {product.isPublished ? "Published" : "Draft"}
                                          </Badge>
                                          {product.price && (
                                            <span className="text-xs text-muted-foreground">
                                              ${(product.price / 100).toFixed(2)}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Sample Packs */}
                            {packCount > 0 && (
                              <div>
                                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                  <Music className="w-4 h-4 text-purple-500" />
                                  Sample Packs ({packCount})
                                </h3>
                                <div className="space-y-2">
                                  {samplePacks?.map((pack: any) => (
                                    <div key={pack._id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                                      <div className="flex-1">
                                        <p className="font-medium text-sm">{pack.name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                          <Badge variant={pack.isPublished ? "default" : "secondary"} className="text-xs">
                                            {pack.isPublished ? "Published" : "Draft"}
                                          </Badge>
                                          {pack.price && (
                                            <span className="text-xs text-muted-foreground">
                                              ${(pack.price / 100).toFixed(2)}
                                            </span>
                                          )}
                                          {pack.sampleCount && (
                                            <span className="text-xs text-muted-foreground">
                                              {pack.sampleCount} samples
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    );
                  };

                  return <CreatorContentStats clerkId={user.clerkId} userName={user.name || "Creator"} />;
                }
              },
              {
                key: "stripe",
                label: "Payment Status",
                render: (user: any) => (
                  user.stripeConnectAccountId ? (
                    <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300">
                      Stripe Connected
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">Not connected</span>
                  )
                )
              },
              {
                key: "joined",
                label: "Joined",
                render: (user: any) => (
                  <span className="text-sm text-muted-foreground">
                    {new Date(user._creationTime).toLocaleDateString()}
                  </span>
                )
              }
            ]}
            bulkActions={userBulkActions}
            getItemId={(user: any) => user._id}
          />
          
          {/* Legacy individual user cards (hidden) */}
          <div className="hidden">
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

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="bg-white dark:bg-black">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white dark:bg-black">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      
                      <DropdownMenuItem
                        onClick={() => handleViewProfile(user._id, user.name || "Unknown")}
                        className="cursor-pointer"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Profile
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem
                        onClick={() => handleEditUser(user._id, user.name || "Unknown")}
                        className="cursor-pointer"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit User
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem
                        onClick={() => handleEmailUser(user.email || "", user.name || "Unknown")}
                        className="cursor-pointer"
                        disabled={!user.email}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Email User
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      
                      <DropdownMenuItem
                        onClick={() => handleToggleAdmin(user._id, user.name || "Unknown", user.admin || false)}
                        className="cursor-pointer"
                      >
                        <UserCog className="w-4 h-4 mr-2" />
                        {user.admin ? "Remove Admin" : "Make Admin"}
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      
                      <DropdownMenuItem
                        onClick={() => handleDeleteUser(user._id, user.name || "Unknown")}
                        className="cursor-pointer text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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


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
  Video,
  Clock,
  ListChecks,
  Users,
  UserCheck,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { BulkSelectionTable, userBulkActions } from "@/components/admin/bulk-selection-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const USERS_PER_PAGE = 1000;

export default function UsersManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [paginationCursor, setPaginationCursor] = useState<string | null>(null);
  const [cursorHistory, setCursorHistory] = useState<(string | null)[]>([null]);
  const [currentPage, setCurrentPage] = useState(0);
  const [mounted, setMounted] = useState(false);
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);
  
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
          <div className="relative mx-auto w-16 h-16">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-chart-1 to-chart-2 animate-pulse" />
            <div className="absolute inset-[2px] rounded-2xl bg-background flex items-center justify-center">
              <Users className="w-6 h-6 text-chart-1" />
            </div>
          </div>
          <div>
            <p className="font-medium">Loading users</p>
            <p className="text-sm text-muted-foreground">Fetching data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show access denied
  if (!adminCheck.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto">
                <Lock className="w-8 h-8 text-destructive" />
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
    router.push(`/admin/users/${userId}`);
  };

  const handleEditUser = (userId: string, userName: string) => {
    toast({
      title: "Edit User",
      description: `Opening editor for ${userName}`,
    });
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
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      toast({
        title: "Delete User",
        description: `Deleting ${userName}...`,
        variant: "destructive",
      });
    }
  };

  const statCards = [
    {
      title: "Total Users",
      value: userStats?.total || 0,
      icon: Users,
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      title: "Owners & Admins",
      value: userStats?.creators || 0,
      icon: Crown,
      gradient: "from-amber-500 to-orange-500",
    },
    {
      title: "Users & Guests",
      value: userStats?.students || 0,
      icon: UserCheck,
      gradient: "from-violet-500 to-purple-500",
    },
    {
      title: "Verified",
      value: userStats?.verified || 0,
      icon: ShieldCheck,
      gradient: "from-emerald-500 to-green-500",
    },
  ];

  return (
    <div className={cn(
      "space-y-8",
      mounted ? "animate-in fade-in-0 duration-500" : "opacity-0"
    )}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold tracking-tight">User Management</h1>
            <Badge variant="outline" className="text-muted-foreground">
              {userStats?.total || 0} total
            </Badge>
          </div>
          <p className="text-lg text-muted-foreground">
            Manage all platform users and their permissions
          </p>
        </div>
        <Button className="gap-2 bg-gradient-to-r from-chart-1 to-chart-2 hover:opacity-90 transition-opacity">
          <UserPlus className="w-4 h-4" />
          Add User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border-border/50 hover:border-border transition-colors">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-xl",
                    "bg-gradient-to-br shadow-lg",
                    stat.gradient
                  )}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{stat.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-xl">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search users by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-11 h-12 rounded-xl border-border/50 bg-muted/30 focus:bg-background transition-colors"
        />
      </div>

      {/* Users Table with Bulk Selection */}
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-chart-1 to-chart-2 flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            All Users
            <Badge variant="outline" className="ml-2 font-normal">
              {filteredUsers.length} showing
            </Badge>
          </CardTitle>
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
                    <Avatar className="w-10 h-10 border-2 border-border/50">
                      <AvatarImage src={user.imageUrl} />
                      <AvatarFallback className="bg-gradient-to-br from-chart-1/20 to-chart-2/20 text-foreground font-semibold">
                        {user.name?.charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{user.name || "Unknown"}</span>
                        {user.emailVerified && (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
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
                  <Badge 
                    variant="outline"
                    className={cn(
                      user.role === "AGENCY_OWNER" || user.role === "AGENCY_ADMIN" 
                        ? "border-amber-500/30 bg-amber-500/10 text-amber-600" 
                        : "border-border"
                    )}
                  >
                    {user.role === "AGENCY_OWNER" && <Crown className="w-3 h-3 mr-1" />}
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
                              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-blue-500/10">
                                <BookOpen className="w-3 h-3 text-blue-500" />
                                <span className="text-blue-600 font-medium">{courseCount}</span>
                              </div>
                            )}
                            {productCount > 0 && (
                              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/10">
                                <Package className="w-3 h-3 text-emerald-500" />
                                <span className="text-emerald-600 font-medium">{productCount}</span>
                              </div>
                            )}
                            {packCount > 0 && (
                              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-violet-500/10">
                                <Music className="w-3 h-3 text-violet-500" />
                                <span className="text-violet-600 font-medium">{packCount}</span>
                              </div>
                            )}
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white dark:bg-black">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Sparkles className="w-5 h-5 text-chart-1" />
                              Content for {userName}
                            </DialogTitle>
                            <DialogDescription>
                              View all courses, products, and sample packs by this creator
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-6 mt-4">
                            {/* Courses */}
                            {courseCount > 0 && (
                              <div>
                                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                                    <BookOpen className="w-3 w-3 text-white" />
                                  </div>
                                  Courses ({courseCount})
                                </h3>
                                <Accordion type="single" collapsible className="space-y-2">
                                  {courses?.map((course: any, idx: number) => {
                                    const totalChapters = course.chapters?.length || 0;
                                    const completedChapters = course.chapters?.filter((ch: any) => ch.isPublished)?.length || 0;
                                    const completionPercent = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;
                                    
                                    return (
                                      <AccordionItem key={course._id} value={`course-${idx}`} className="border rounded-xl overflow-hidden">
                                        <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
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
                                        <AccordionContent className="px-4 pb-4">
                                          <div className="space-y-2 mt-2">
                                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                                              <span>{totalChapters} chapters total</span>
                                              <span>{completedChapters} published</span>
                                            </div>
                                            
                                            {course.chapters && course.chapters.length > 0 ? (
                                              <div className="space-y-1">
                                                {course.chapters.map((chapter: any, chIdx: number) => (
                                                  <div key={chapter._id || chIdx} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg text-xs">
                                                    <span className="text-muted-foreground font-mono w-4">{chIdx + 1}</span>
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
                                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
                                    <Package className="w-3 h-3 text-white" />
                                  </div>
                                  Digital Products ({productCount})
                                </h3>
                                <div className="space-y-2">
                                  {products?.map((product: any) => (
                                    <div key={product._id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border/50">
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
                                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                                    <Music className="w-3 h-3 text-white" />
                                  </div>
                                  Sample Packs ({packCount})
                                </h3>
                                <div className="space-y-2">
                                  {samplePacks?.map((pack: any) => (
                                    <div key={pack._id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border/50">
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
                    <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
                      <CheckCircle className="w-3 h-3 mr-1" />
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
          
          {/* Pagination Controls */}
          {!searchQuery && (
            <div className="flex items-center justify-between pt-6 border-t border-border/50 mt-6">
              <div className="text-sm text-muted-foreground">
                Page {currentPage + 1} • Showing {filteredUsers.length} users
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 0}
                  className="gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={usersResult?.isDone}
                  className="gap-1"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

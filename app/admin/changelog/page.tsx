"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import {
  GitBranch,
  GitCommit,
  RefreshCw,
  Plus,
  Trash2,
  Send,
  Check,
  X,
  ExternalLink,
  Sparkles,
  Bug,
  Zap,
  AlertTriangle,
  Settings,
  Eye,
  EyeOff,
  Bell,
  Clock,
  User,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

type Category = "feature" | "improvement" | "fix" | "breaking" | "internal";

interface GitHubCommit {
  sha: string;
  shortSha: string;
  message: string;
  url: string;
  authorName: string;
  authorEmail: string;
  authorAvatar: string | null;
  authorLogin: string | null;
  committedAt: number;
  committedAtFormatted: string;
}

interface ChangelogEntry {
  _id: Id<"changelogEntries">;
  commitSha: string;
  commitMessage: string;
  commitUrl: string;
  authorName: string;
  authorAvatar?: string;
  committedAt: number;
  category: Category;
  title: string;
  description?: string;
  isPublished: boolean;
  notificationSent?: boolean;
}

const categoryConfig: Record<
  Category,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
  }
> = {
  feature: {
    label: "Feature",
    icon: Sparkles,
    color: "text-purple-600",
    bgColor: "bg-purple-500/10",
  },
  improvement: {
    label: "Improvement",
    icon: Zap,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
  },
  fix: {
    label: "Bug Fix",
    icon: Bug,
    color: "text-green-600",
    bgColor: "bg-green-500/10",
  },
  breaking: {
    label: "Breaking",
    icon: AlertTriangle,
    color: "text-red-600",
    bgColor: "bg-red-500/10",
  },
  internal: {
    label: "Internal",
    icon: Settings,
    color: "text-gray-600",
    bgColor: "bg-gray-500/10",
  },
};

export default function AdminChangelogPage() {
  const { user } = useUser();

  // State
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);
  const [repository, setRepository] = useState("");
  const [branch, setBranch] = useState("main");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [githubCommits, setGithubCommits] = useState<GitHubCommit[]>([]);
  const [selectedCommits, setSelectedCommits] = useState<Set<string>>(new Set());
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [notifyTitle, setNotifyTitle] = useState("");
  const [notifyMessage, setNotifyMessage] = useState("");
  const [notifyTarget, setNotifyTarget] = useState<"all" | "students" | "creators">("all");
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState<"commits" | "entries">("commits");

  // Convex queries
  const config = useQuery(api.changelog.getGithubConfig, user?.id ? { clerkId: user.id } : "skip");
  const entries = useQuery(
    api.changelog.getChangelogEntries,
    user?.id ? { clerkId: user.id, limit: 100 } : "skip"
  );
  const stats = useQuery(api.changelog.getChangelogStats, user?.id ? { clerkId: user.id } : "skip");

  // Convex mutations
  const saveConfig = useMutation(api.changelog.saveGithubConfig);
  const saveCommits = useMutation(api.changelog.saveCommitsAsEntries);
  const updateEntry = useMutation(api.changelog.updateEntry);
  const deleteEntry = useMutation(api.changelog.deleteEntry);
  const sendNotification = useMutation(api.changelog.sendChangelogNotification);

  // Load saved config
  useEffect(() => {
    if (config) {
      setRepository(config.repository);
      setBranch(config.branch);
    }
  }, [config]);

  // Test connection and save config
  const handleConnect = async () => {
    if (!user?.id || !repository) return;

    setIsConnecting(true);
    try {
      const response = await fetch("/api/github/commits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repository, branch }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to connect");
        return;
      }

      // Save config
      await saveConfig({ clerkId: user.id, repository, branch });
      toast.success(`Connected to ${data.repository.fullName}`);
      setIsConfigOpen(false);

      // Fetch commits
      fetchCommits();
    } catch (error: any) {
      toast.error(error.message || "Connection failed");
    } finally {
      setIsConnecting(false);
    }
  };

  // Fetch commits from GitHub
  const fetchCommits = async () => {
    if (!config?.repository) {
      toast.error("Please configure your repository first");
      return;
    }

    setIsFetching(true);
    try {
      const response = await fetch(
        `/api/github/commits?repository=${encodeURIComponent(config.repository)}&branch=${encodeURIComponent(config.branch)}&per_page=50`
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to fetch commits");
        return;
      }

      setGithubCommits(data.commits);
      toast.success(`Fetched ${data.commits.length} commits`);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch commits");
    } finally {
      setIsFetching(false);
    }
  };

  // Import selected commits
  const handleImportCommits = async () => {
    if (!user?.id || selectedCommits.size === 0) return;

    const commitsToImport = githubCommits.filter((c) => selectedCommits.has(c.sha));

    try {
      const result = await saveCommits({
        clerkId: user.id,
        commits: commitsToImport.map((c) => ({
          sha: c.sha,
          message: c.message,
          url: c.url,
          authorName: c.authorName,
          authorEmail: c.authorEmail,
          authorAvatar: c.authorAvatar || undefined,
          committedAt: c.committedAt,
        })),
      });

      toast.success(`Imported ${result.saved} commits (${result.skipped} already existed)`);
      setSelectedCommits(new Set());
    } catch (error: any) {
      toast.error(error.message || "Failed to import commits");
    }
  };

  // Update entry category
  const handleCategoryChange = async (entryId: Id<"changelogEntries">, category: Category) => {
    if (!user?.id) return;

    try {
      await updateEntry({ clerkId: user.id, entryId, category });
      toast.success("Category updated");
    } catch (error: any) {
      toast.error(error.message || "Failed to update");
    }
  };

  // Toggle entry publish status
  const handleTogglePublish = async (entry: ChangelogEntry) => {
    if (!user?.id) return;

    try {
      await updateEntry({
        clerkId: user.id,
        entryId: entry._id,
        isPublished: !entry.isPublished,
      });
      toast.success(entry.isPublished ? "Unpublished" : "Published");
    } catch (error: any) {
      toast.error(error.message || "Failed to update");
    }
  };

  // Delete entry
  const handleDelete = async (entryId: Id<"changelogEntries">) => {
    if (!user?.id) return;

    try {
      await deleteEntry({ clerkId: user.id, entryId });
      toast.success("Entry deleted");
      setSelectedEntries((prev) => {
        const next = new Set(prev);
        next.delete(entryId);
        return next;
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to delete");
    }
  };

  // Send notification
  const handleSendNotification = async () => {
    if (!user?.id || !notifyTitle || !notifyMessage) return;

    setIsSending(true);
    try {
      const entryIds = Array.from(selectedEntries) as Id<"changelogEntries">[];
      const result = await sendNotification({
        clerkId: user.id,
        entryIds,
        title: notifyTitle,
        message: notifyMessage,
        targetType: notifyTarget,
      });

      toast.success(result.message);
      setIsNotifyOpen(false);
      setNotifyTitle("");
      setNotifyMessage("");
      setSelectedEntries(new Set());
    } catch (error: any) {
      toast.error(error.message || "Failed to send notification");
    } finally {
      setIsSending(false);
    }
  };

  // Generate notification message from selected entries
  const generateNotificationContent = () => {
    if (!entries || selectedEntries.size === 0) return;

    const selected = entries.filter((e: ChangelogEntry) => selectedEntries.has(e._id));
    const features = selected.filter((e: ChangelogEntry) => e.category === "feature");
    const improvements = selected.filter((e: ChangelogEntry) => e.category === "improvement");
    const fixes = selected.filter((e: ChangelogEntry) => e.category === "fix");

    let title = "New Updates Available";
    let message = "We've made some updates to improve your experience:\n\n";

    if (features.length > 0) {
      message += `New Features:\n${features.map((f: ChangelogEntry) => `- ${f.title}`).join("\n")}\n\n`;
    }
    if (improvements.length > 0) {
      message += `Improvements:\n${improvements.map((i: ChangelogEntry) => `- ${i.title}`).join("\n")}\n\n`;
    }
    if (fixes.length > 0) {
      message += `Bug Fixes:\n${fixes.map((f: ChangelogEntry) => `- ${f.title}`).join("\n")}\n\n`;
    }

    setNotifyTitle(title);
    setNotifyMessage(message.trim());
  };

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Loading state
  if (!entries || !stats) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <GitCommit className="mx-auto mb-4 h-12 w-12 animate-pulse text-purple-600" />
          <p className="text-muted-foreground">Loading changelog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Changelog</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Track commits and notify users about updates
          </p>
        </div>
        <div className="flex gap-3">
          <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="lg" className="gap-2">
                <GitBranch className="h-5 w-5" />
                {config ? "Change Repo" : "Connect Repo"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-white dark:bg-black">
              <DialogHeader>
                <div className="mb-2 flex items-center gap-3">
                  <div className="rounded-full bg-purple-500/10 p-3">
                    <GitBranch className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl">Connect Repository</DialogTitle>
                    <DialogDescription className="mt-1">
                      Link your GitHub repository to track commits
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="repository">Repository</Label>
                  <Input
                    id="repository"
                    placeholder="owner/repo"
                    value={repository}
                    onChange={(e) => setRepository(e.target.value)}
                    className="bg-white dark:bg-black"
                  />
                  <p className="text-xs text-muted-foreground">Format: owner/repository-name</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="branch">Branch</Label>
                  <Input
                    id="branch"
                    placeholder="main"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="bg-white dark:bg-black"
                  />
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    Make sure{" "}
                    <code className="rounded bg-amber-200 px-1 dark:bg-amber-900">
                      GITHUB_TOKEN
                    </code>{" "}
                    is set in your environment variables.
                  </p>
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button
                  onClick={handleConnect}
                  disabled={isConnecting || !repository}
                  className="w-full"
                >
                  {isConnecting ? "Connecting..." : "Connect & Save"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {selectedEntries.size > 0 && (
            <Dialog open={isNotifyOpen} onOpenChange={setIsNotifyOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="gap-2">
                  <Bell className="h-5 w-5" />
                  Notify Users ({selectedEntries.size})
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-white dark:bg-black">
                <DialogHeader>
                  <div className="mb-2 flex items-center gap-3">
                    <div className="rounded-full bg-blue-500/10 p-3">
                      <Bell className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <DialogTitle className="text-2xl">Send Update Notification</DialogTitle>
                      <DialogDescription className="mt-1">
                        Notify users about the selected changes
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <div className="mt-4 space-y-4">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={generateNotificationContent}>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Auto-generate
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notifyTitle">Title</Label>
                    <Input
                      id="notifyTitle"
                      placeholder="New Updates Available"
                      value={notifyTitle}
                      onChange={(e) => setNotifyTitle(e.target.value)}
                      className="bg-white dark:bg-black"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notifyMessage">Message</Label>
                    <Textarea
                      id="notifyMessage"
                      placeholder="We've made some updates..."
                      value={notifyMessage}
                      onChange={(e) => setNotifyMessage(e.target.value)}
                      rows={6}
                      className="bg-white dark:bg-black"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Target Audience</Label>
                    <Select
                      value={notifyTarget}
                      onValueChange={(v) => setNotifyTarget(v as typeof notifyTarget)}
                    >
                      <SelectTrigger className="bg-white dark:bg-black">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-black">
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="students">Students Only</SelectItem>
                        <SelectItem value="creators">Creators Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter className="mt-6 gap-2">
                  <Button variant="outline" onClick={() => setIsNotifyOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSendNotification}
                    disabled={isSending || !notifyTitle || !notifyMessage}
                  >
                    {isSending ? "Sending..." : "Send Notification"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card className="border-2 transition-shadow hover:shadow-lg">
          <CardContent className="p-6">
            <div className="mb-3 flex items-start justify-between">
              <div className="rounded-full bg-purple-500/10 p-3">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold tracking-tight">{stats.totalEntries}</p>
              <p className="text-sm font-medium text-muted-foreground">Total Entries</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 transition-shadow hover:shadow-lg">
          <CardContent className="p-6">
            <div className="mb-3 flex items-start justify-between">
              <div className="rounded-full bg-green-500/10 p-3">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold tracking-tight">{stats.publishedEntries}</p>
              <p className="text-sm font-medium text-muted-foreground">Published</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 transition-shadow hover:shadow-lg">
          <CardContent className="p-6">
            <div className="mb-3 flex items-start justify-between">
              <div className="rounded-full bg-blue-500/10 p-3">
                <Bell className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold tracking-tight">{stats.notificationsSent}</p>
              <p className="text-sm font-medium text-muted-foreground">Notifications Sent</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 transition-shadow hover:shadow-lg">
          <CardContent className="p-6">
            <div className="mb-3 flex items-start justify-between">
              <div className={`rounded-full ${categoryConfig.feature.bgColor} p-3`}>
                <Sparkles className={`h-6 w-6 ${categoryConfig.feature.color}`} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold tracking-tight">{stats.byCategory.feature}</p>
              <p className="text-sm font-medium text-muted-foreground">Features</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 transition-shadow hover:shadow-lg">
          <CardContent className="p-6">
            <div className="mb-3 flex items-start justify-between">
              <div className={`rounded-full ${categoryConfig.fix.bgColor} p-3`}>
                <Bug className={`h-6 w-6 ${categoryConfig.fix.color}`} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold tracking-tight">{stats.byCategory.fix}</p>
              <p className="text-sm font-medium text-muted-foreground">Bug Fixes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connection Status */}
      {config && (
        <Card className="border-2">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold">Connected to {config.repository}</p>
                <p className="text-sm text-muted-foreground">
                  Branch: {config.branch} | Last sync:{" "}
                  {config.lastSyncAt ? formatDate(config.lastSyncAt) : "Never"}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={fetchCommits}
              disabled={isFetching}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              {isFetching ? "Fetching..." : "Fetch Commits"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("commits")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "commits"
              ? "border-b-2 border-purple-600 text-purple-600"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          GitHub Commits ({githubCommits.length})
        </button>
        <button
          onClick={() => setActiveTab("entries")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "entries"
              ? "border-b-2 border-purple-600 text-purple-600"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Changelog Entries ({entries.length})
        </button>
      </div>

      {/* GitHub Commits Tab */}
      {activeTab === "commits" && (
        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-2xl font-bold">Recent Commits</CardTitle>
            {selectedCommits.size > 0 && (
              <Button onClick={handleImportCommits} className="gap-2">
                <Plus className="h-4 w-4" />
                Import {selectedCommits.size} Selected
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {!config ? (
              <div className="py-12 text-center">
                <GitBranch className="mx-auto mb-4 h-16 w-16 text-muted-foreground opacity-50" />
                <p className="text-lg font-medium text-muted-foreground">No repository connected</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Connect your GitHub repository to start tracking commits
                </p>
                <Button className="mt-4" onClick={() => setIsConfigOpen(true)}>
                  Connect Repository
                </Button>
              </div>
            ) : githubCommits.length === 0 ? (
              <div className="py-12 text-center">
                <GitCommit className="mx-auto mb-4 h-16 w-16 text-muted-foreground opacity-50" />
                <p className="text-lg font-medium text-muted-foreground">No commits fetched yet</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Click &quot;Fetch Commits&quot; to load recent commits
                </p>
                <Button className="mt-4" onClick={fetchCommits} disabled={isFetching}>
                  {isFetching ? "Fetching..." : "Fetch Commits"}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Select All */}
                <div className="flex items-center gap-2 border-b pb-2">
                  <Checkbox
                    checked={selectedCommits.size === githubCommits.length}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedCommits(new Set(githubCommits.map((c) => c.sha)));
                      } else {
                        setSelectedCommits(new Set());
                      }
                    }}
                  />
                  <span className="text-sm text-muted-foreground">Select all</span>
                </div>

                {githubCommits.map((commit) => {
                  const existingEntry = entries.find(
                    (e: ChangelogEntry) => e.commitSha === commit.sha
                  );
                  const isSelected = selectedCommits.has(commit.sha);

                  return (
                    <div
                      key={commit.sha}
                      className={`flex items-start gap-4 rounded-lg border p-4 transition-all ${
                        existingEntry
                          ? "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20"
                          : isSelected
                            ? "border-purple-200 bg-purple-50/50 dark:border-purple-900 dark:bg-purple-950/20"
                            : "hover:bg-muted/50"
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        disabled={!!existingEntry}
                        onCheckedChange={(checked) => {
                          setSelectedCommits((prev) => {
                            const next = new Set(prev);
                            if (checked) {
                              next.add(commit.sha);
                            } else {
                              next.delete(commit.sha);
                            }
                            return next;
                          });
                        }}
                      />

                      {commit.authorAvatar ? (
                        <img
                          src={commit.authorAvatar}
                          alt={commit.authorName}
                          className="h-10 w-10 rounded-full"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium">{commit.message.split("\n")[0]}</p>
                            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="font-mono">{commit.shortSha}</span>
                              <span>{commit.authorName}</span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(commit.committedAt)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {existingEntry && (
                              <Badge
                                variant="secondary"
                                className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                              >
                                Imported
                              </Badge>
                            )}
                            <a
                              href={commit.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Changelog Entries Tab */}
      {activeTab === "entries" && (
        <Card className="border-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold">Changelog Entries</CardTitle>
          </CardHeader>
          <CardContent>
            {entries.length === 0 ? (
              <div className="py-12 text-center">
                <FileText className="mx-auto mb-4 h-16 w-16 text-muted-foreground opacity-50" />
                <p className="text-lg font-medium text-muted-foreground">
                  No changelog entries yet
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Import commits from the &quot;GitHub Commits&quot; tab to create entries
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Select All */}
                <div className="flex items-center gap-2 border-b pb-2">
                  <Checkbox
                    checked={selectedEntries.size === entries.length}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedEntries(new Set(entries.map((e: ChangelogEntry) => e._id)));
                      } else {
                        setSelectedEntries(new Set());
                      }
                    }}
                  />
                  <span className="text-sm text-muted-foreground">Select all</span>
                </div>

                {entries.map((entry: ChangelogEntry) => {
                  const config = categoryConfig[entry.category];
                  const Icon = config.icon;
                  const isSelected = selectedEntries.has(entry._id);

                  return (
                    <div
                      key={entry._id}
                      className={`flex items-start gap-4 rounded-lg border-2 p-4 transition-all ${
                        isSelected
                          ? "border-purple-300 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/20"
                          : "hover:shadow-md"
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          setSelectedEntries((prev) => {
                            const next = new Set(prev);
                            if (checked) {
                              next.add(entry._id);
                            } else {
                              next.delete(entry._id);
                            }
                            return next;
                          });
                        }}
                      />

                      <div className={`rounded-full p-3 ${config.bgColor}`}>
                        <Icon className={`h-4 w-4 ${config.color}`} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold">{entry.title}</h3>
                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                              {entry.commitMessage}
                            </p>
                            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="font-mono">{entry.commitSha.substring(0, 7)}</span>
                              <span>{entry.authorName}</span>
                              <span>{formatDate(entry.committedAt)}</span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-2">
                              <Select
                                value={entry.category}
                                onValueChange={(v) =>
                                  handleCategoryChange(entry._id, v as Category)
                                }
                              >
                                <SelectTrigger className="h-8 w-32 bg-white dark:bg-black">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-black">
                                  {Object.entries(categoryConfig).map(([key, cfg]) => (
                                    <SelectItem key={key} value={key}>
                                      <div className="flex items-center gap-2">
                                        <cfg.icon className={`h-4 w-4 ${cfg.color}`} />
                                        {cfg.label}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleTogglePublish(entry)}
                                className={
                                  entry.isPublished
                                    ? "text-green-600 hover:text-green-700"
                                    : "text-muted-foreground"
                                }
                              >
                                {entry.isPublished ? (
                                  <Eye className="h-4 w-4" />
                                ) : (
                                  <EyeOff className="h-4 w-4" />
                                )}
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(entry._id)}
                                className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="flex items-center gap-2">
                              {entry.isPublished && (
                                <Badge
                                  variant="secondary"
                                  className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                >
                                  Published
                                </Badge>
                              )}
                              {entry.notificationSent && (
                                <Badge
                                  variant="secondary"
                                  className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                >
                                  Notified
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

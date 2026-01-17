import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  html_url: string;
  author: {
    avatar_url: string;
    login: string;
  } | null;
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const repository = searchParams.get("repository");
    const branch = searchParams.get("branch") || "main";
    const perPage = searchParams.get("per_page") || "30";
    const page = searchParams.get("page") || "1";
    const since = searchParams.get("since"); // ISO date string

    if (!repository) {
      return NextResponse.json(
        { error: "Repository is required (format: owner/repo)" },
        { status: 400 }
      );
    }

    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "GitHub token not configured. Add GITHUB_TOKEN to your environment variables." },
        { status: 500 }
      );
    }

    // Build the GitHub API URL
    const url = new URL(`https://api.github.com/repos/${repository}/commits`);
    url.searchParams.set("sha", branch);
    url.searchParams.set("per_page", perPage);
    url.searchParams.set("page", page);
    if (since) {
      url.searchParams.set("since", since);
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      next: { revalidate: 60 }, // Cache for 1 minute
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        {
          error: error.message || "Failed to fetch commits from GitHub",
          details: error,
        },
        { status: response.status }
      );
    }

    const commits: GitHubCommit[] = await response.json();

    // Transform the response
    const transformedCommits = commits.map((commit) => ({
      sha: commit.sha,
      shortSha: commit.sha.substring(0, 7),
      message: commit.commit.message,
      url: commit.html_url,
      authorName: commit.commit.author.name,
      authorEmail: commit.commit.author.email,
      authorAvatar: commit.author?.avatar_url || null,
      authorLogin: commit.author?.login || null,
      committedAt: new Date(commit.commit.author.date).getTime(),
      committedAtFormatted: new Date(commit.commit.author.date).toLocaleString(),
    }));

    // Get pagination info from headers
    const linkHeader = response.headers.get("Link");
    const hasMore = linkHeader?.includes('rel="next"') || false;

    return NextResponse.json({
      commits: transformedCommits,
      pagination: {
        page: parseInt(page),
        perPage: parseInt(perPage),
        hasMore,
      },
    });
  } catch (error) {
    console.error("Error fetching GitHub commits:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Test the connection to a repository
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { repository, branch = "main" } = body;

    if (!repository) {
      return NextResponse.json(
        { error: "Repository is required (format: owner/repo)" },
        { status: 400 }
      );
    }

    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "GitHub token not configured. Add GITHUB_TOKEN to your environment variables." },
        { status: 500 }
      );
    }

    // Test connection by fetching repo info
    const repoResponse = await fetch(`https://api.github.com/repos/${repository}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (!repoResponse.ok) {
      const error = await repoResponse.json();
      return NextResponse.json(
        {
          connected: false,
          error: error.message || "Failed to connect to repository",
        },
        { status: repoResponse.status }
      );
    }

    const repoData = await repoResponse.json();

    // Test branch access
    const branchResponse = await fetch(
      `https://api.github.com/repos/${repository}/branches/${branch}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );

    if (!branchResponse.ok) {
      return NextResponse.json(
        {
          connected: false,
          error: `Branch '${branch}' not found`,
          availableBranch: repoData.default_branch,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      connected: true,
      repository: {
        name: repoData.name,
        fullName: repoData.full_name,
        description: repoData.description,
        defaultBranch: repoData.default_branch,
        private: repoData.private,
        htmlUrl: repoData.html_url,
      },
      branch: branch,
    });
  } catch (error) {
    console.error("Error testing GitHub connection:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

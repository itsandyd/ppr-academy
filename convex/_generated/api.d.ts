/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type { FunctionReference } from "convex/server";
import type { GenericId as Id } from "convex/values";

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: {
  abletonRacks: {
    createAbletonRack: FunctionReference<
      "mutation",
      "public",
      {
        abletonVersion: string;
        bpm?: number;
        chainImageUrl?: string;
        complexity?: "beginner" | "intermediate" | "advanced";
        cpuLoad?: "low" | "medium" | "high";
        demoAudioUrl?: string;
        description?: string;
        downloadUrl?: string;
        effectType?: Array<string>;
        fileFormat: "adg" | "adv" | "alp";
        fileSize?: number;
        genre?: Array<string>;
        imageUrl?: string;
        installationNotes?: string;
        macroCount?: number;
        macroScreenshotUrls?: Array<string>;
        minAbletonVersion?: string;
        musicalKey?: string;
        price: number;
        rackType: "audioEffect" | "instrument" | "midiEffect" | "drumRack";
        requiresMaxForLive?: boolean;
        storeId: string;
        tags?: Array<string>;
        thirdPartyPlugins?: Array<string>;
        title: string;
        userId: string;
      },
      Id<"digitalProducts">
    >;
    deleteAbletonRack: FunctionReference<
      "mutation",
      "public",
      { rackId: Id<"digitalProducts">; userId: string },
      { message: string; success: boolean }
    >;
    getAbletonRackById: FunctionReference<
      "query",
      "public",
      { rackId: Id<"digitalProducts">; userId?: string },
      any | null
    >;
    getAbletonRackBySlug: FunctionReference<
      "query",
      "public",
      { slug: string },
      {
        _creationTime: number;
        _id: Id<"digitalProducts">;
        abletonVersion?: string;
        affiliateEnabled?: boolean;
        bpm?: number;
        chainImageUrl?: string;
        complexity?: "beginner" | "intermediate" | "advanced";
        cpuLoad?: "low" | "medium" | "high";
        creatorAvatar?: string;
        creatorName?: string;
        demoAudioUrl?: string;
        description?: string;
        downloadUrl?: string;
        effectType?: Array<string>;
        fileFormat?: "adg" | "adv" | "alp";
        fileSize?: number;
        genre?: Array<string>;
        imageUrl?: string;
        installationNotes?: string;
        isPublished?: boolean;
        macroCount?: number;
        macroScreenshotUrls?: Array<string>;
        minAbletonVersion?: string;
        musicalKey?: string;
        orderBumpEnabled?: boolean;
        price: number;
        productType?:
          | "digital"
          | "urlMedia"
          | "coaching"
          | "effectChain"
          | "abletonRack"
          | "abletonPreset"
          | "playlistCuration";
        rackType?: "audioEffect" | "instrument" | "midiEffect" | "drumRack";
        requiresMaxForLive?: boolean;
        storeId: string;
        tags?: Array<string>;
        thirdPartyPlugins?: Array<string>;
        title: string;
        userId: string;
      } | null
    >;
    getAbletonRacksByStore: FunctionReference<
      "query",
      "public",
      { storeId: string },
      Array<any>
    >;
    getAbletonRackStats: FunctionReference<
      "query",
      "public",
      { storeId: string },
      {
        publishedRacks: number;
        racksByType: any;
        totalDownloads: number;
        totalRacks: number;
        totalRevenue: number;
      }
    >;
    getPublishedAbletonRacks: FunctionReference<
      "query",
      "public",
      {
        abletonVersion?: string;
        complexity?: "beginner" | "intermediate" | "advanced";
        cpuLoad?: "low" | "medium" | "high";
        effectType?: string;
        genre?: string;
        rackType?: "audioEffect" | "instrument" | "midiEffect" | "drumRack";
        searchQuery?: string;
      },
      Array<any>
    >;
    updateAbletonRack: FunctionReference<
      "mutation",
      "public",
      {
        abletonVersion?: string;
        bpm?: number;
        chainImageUrl?: string;
        complexity?: "beginner" | "intermediate" | "advanced";
        cpuLoad?: "low" | "medium" | "high";
        demoAudioUrl?: string;
        description?: string;
        downloadUrl?: string;
        effectType?: Array<string>;
        fileFormat?: "adg" | "adv" | "alp";
        fileSize?: number;
        genre?: Array<string>;
        id: Id<"digitalProducts">;
        imageUrl?: string;
        installationNotes?: string;
        isPublished?: boolean;
        macroCount?: number;
        macroScreenshotUrls?: Array<string>;
        minAbletonVersion?: string;
        musicalKey?: string;
        price?: number;
        rackType?: "audioEffect" | "instrument" | "midiEffect" | "drumRack";
        requiresMaxForLive?: boolean;
        tags?: Array<string>;
        thirdPartyPlugins?: Array<string>;
        title?: string;
      },
      null
    >;
  };
  accessControl: {
    checkResourceAccess: FunctionReference<
      "query",
      "public",
      {
        resourceId: string;
        resourceType: "course" | "product";
        userId: string;
      },
      {
        expiresAt?: number;
        hasAccess: boolean;
        metadata?: { accessType?: string; tierName?: string };
        reason: string;
      }
    >;
    getSubscriptionAccessibleContent: FunctionReference<
      "query",
      "public",
      { resourceType?: "course" | "product"; userId: string },
      Array<string>
    >;
    getUserSubscriptions: FunctionReference<
      "query",
      "public",
      { userId: string },
      Array<{
        cancelAtPeriodEnd: boolean;
        creatorId: string;
        creatorName?: string;
        currentPeriodEnd: number;
        priceMonthly: number;
        status: string;
        subscriptionId: Id<"userCreatorSubscriptions">;
        tierName: string;
      }>
    >;
  };
  achievements: {
    getCreatorXP: FunctionReference<
      "query",
      "public",
      { userId: string },
      {
        creatorBadges: Array<string>;
        creatorLevel: number;
        creatorSince?: number;
        creatorXP: number;
        isCreator: boolean;
        xpToNextLevel: number;
      }
    >;
    getUserAchievements: FunctionReference<
      "query",
      "public",
      { userId: string },
      Array<{
        _id: Id<"userAchievements">;
        achievementId: string;
        progress?: { current: number; target: number };
        unlocked: boolean;
        unlockedAt?: number;
      }>
    >;
    getUserXP: FunctionReference<
      "query",
      "public",
      { userId: string },
      { level: number; totalXP: number; xpToNextLevel: number }
    >;
    unlockAchievement: FunctionReference<
      "mutation",
      "public",
      { achievementId: string; userId: string; xpReward: number },
      { newXP: number; unlocked: boolean }
    >;
    updateAchievementProgress: FunctionReference<
      "mutation",
      "public",
      {
        achievementId: string;
        current: number;
        target: number;
        userId: string;
      },
      null
    >;
  };
  admin: {
    featureDiscovery: {
      analyzeCoursesForFeatures: FunctionReference<
        "action",
        "public",
        {
          courseData: Array<{
            category?: string;
            chapters: Array<{ content?: string; title: string }>;
            courseId: string;
            description?: string;
            title: string;
          }>;
          saveResults?: boolean;
        },
        {
          analysisRunId: string;
          suggestions: Array<{
            category: string;
            cursorPrompt?: string;
            description: string;
            existsPartially?: string;
            implementationHint?: string;
            name: string;
            priority: "high" | "medium" | "low";
            reasoning: string;
            sourceChapters: Array<string>;
            sourceCourse: string;
          }>;
          tokensUsed?: number;
        }
      >;
      deleteSuggestion: FunctionReference<
        "mutation",
        "public",
        { suggestionId: Id<"suggestedFeatures"> },
        null
      >;
      generateCursorPrompt: FunctionReference<
        "action",
        "public",
        { suggestionId: Id<"suggestedFeatures"> },
        string
      >;
      getCoursesForAnalysis: FunctionReference<
        "query",
        "public",
        {},
        Array<{
          category?: string;
          chapters: Array<{ content?: string; title: string }>;
          courseId: Id<"courses">;
          description?: string;
          title: string;
          totalContentLength: number;
        }>
      >;
      getFeatureStats: FunctionReference<
        "query",
        "public",
        {},
        {
          byCategory: Array<{ category: string; count: number }>;
          byStatus: {
            building: number;
            completed: number;
            new: number;
            planned: number;
            rejected: number;
            reviewing: number;
          };
          lastAnalysisAt?: number;
          totalSuggestions: number;
        }
      >;
      getSavedSuggestions: FunctionReference<
        "query",
        "public",
        {
          category?: string;
          status?:
            | "new"
            | "reviewing"
            | "planned"
            | "building"
            | "completed"
            | "rejected";
        },
        Array<{
          _creationTime: number;
          _id: Id<"suggestedFeatures">;
          analysisRunId?: string;
          category: string;
          cursorPrompt?: string;
          description: string;
          existsPartially?: string;
          implementationHint?: string;
          linkedTaskUrl?: string;
          name: string;
          notes?: string;
          priority: string;
          reasoning: string;
          sourceChapters: Array<string>;
          sourceCourses: Array<string>;
          status: string;
          updatedAt: number;
        }>
      >;
      getSuggestionById: FunctionReference<
        "query",
        "public",
        { suggestionId: Id<"suggestedFeatures"> },
        {
          _creationTime: number;
          _id: Id<"suggestedFeatures">;
          analysisRunId?: string;
          category: string;
          cursorPrompt?: string;
          description: string;
          existsPartially?: string;
          implementationHint?: string;
          linkedTaskUrl?: string;
          name: string;
          notes?: string;
          priority: string;
          reasoning: string;
          sourceChapters: Array<string>;
          sourceCourses: Array<string>;
          status: string;
          updatedAt: number;
        } | null
      >;
      quickFeatureGapScan: FunctionReference<
        "query",
        "public",
        {},
        {
          courseStats: {
            totalChapters: number;
            totalContentChars: number;
            totalCourses: number;
          };
          courseTopics: Array<string>;
          featureOpportunities: Array<{
            category: string;
            existingFeatureName?: string;
            featureDescription: string;
            featureName: string;
            foundIn: Array<string>;
            hasExistingFeature: boolean;
            keywordsFound: Array<string>;
          }>;
        }
      >;
      saveSuggestion: FunctionReference<
        "mutation",
        "public",
        {
          analysisRunId?: string;
          category: string;
          cursorPrompt?: string;
          description: string;
          existsPartially?: string;
          implementationHint?: string;
          name: string;
          priority: string;
          reasoning: string;
          sourceChapters: Array<string>;
          sourceCourses: Array<string>;
        },
        Id<"suggestedFeatures">
      >;
      updateSuggestionStatus: FunctionReference<
        "mutation",
        "public",
        {
          linkedTaskUrl?: string;
          notes?: string;
          status:
            | "new"
            | "reviewing"
            | "planned"
            | "building"
            | "completed"
            | "rejected";
          suggestionId: Id<"suggestedFeatures">;
        },
        null
      >;
    };
  };
  adminActivityLogs: {
    getActivitySummary: FunctionReference<
      "query",
      "public",
      { clerkId?: string; days?: number },
      {
        byActionType: Array<{ count: number; type: string }>;
        byAdmin: Array<{ adminId: string; adminName?: string; count: number }>;
        byResourceType: Array<{ count: number; type: string }>;
        recentActivity: Array<{ count: number; date: string }>;
        totalActions: number;
      }
    >;
    getRecentActivity: FunctionReference<
      "query",
      "public",
      {
        actionType?:
          | "create"
          | "update"
          | "delete"
          | "approve"
          | "reject"
          | "export"
          | "view";
        clerkId?: string;
        limit?: number;
        resourceType?: string;
      },
      Array<{
        _id: Id<"adminActivityLogs">;
        action: string;
        actionType: string;
        adminEmail?: string;
        adminId: string;
        adminName?: string;
        details?: string;
        resourceId?: string;
        resourceName?: string;
        resourceType: string;
        timeAgo: string;
        timestamp: number;
      }>
    >;
    getResourceActivity: FunctionReference<
      "query",
      "public",
      { clerkId?: string; resourceId: string; resourceType: string },
      Array<{
        _id: Id<"adminActivityLogs">;
        action: string;
        actionType: string;
        adminName?: string;
        details?: string;
        timeAgo: string;
        timestamp: number;
      }>
    >;
    logActivity: FunctionReference<
      "mutation",
      "public",
      {
        action: string;
        actionType:
          | "create"
          | "update"
          | "delete"
          | "approve"
          | "reject"
          | "export"
          | "view";
        adminClerkId: string;
        details?: string;
        newValue?: string;
        previousValue?: string;
        resourceId?: string;
        resourceName?: string;
        resourceType: string;
      },
      Id<"adminActivityLogs">
    >;
  };
  adminAnalytics: {
    getAdvancedRevenueMetrics: FunctionReference<
      "query",
      "public",
      { clerkId?: string },
      {
        activeCustomers: number;
        averageLtv: number;
        churnRate: number;
        churnedCustomers: number;
        currentRevenue: number;
        goalProgress: number;
        highestLtv: number;
        monthsToGoal: number;
        mrr: number;
        mrrGrowth: number;
        previousMrr: number;
        projectedMonthlyRevenue: number;
        revenueByType: Array<{
          count: number;
          percentage: number;
          revenue: number;
          type: string;
        }>;
        revenueGoal: number;
      }
    >;
    getAllCreatorsWithProducts: FunctionReference<
      "query",
      "public",
      { clerkId?: string },
      Array<{
        courses: Array<{
          _id: Id<"courses">;
          isPublished?: boolean;
          price?: number;
          storeId?: string;
          title: string;
        }>;
        digitalProducts: Array<{
          _id: Id<"digitalProducts">;
          isPublished?: boolean;
          price?: number;
          productType?: string;
          storeId?: string;
          title: string;
        }>;
        email?: string;
        imageUrl?: string;
        name: string;
        stores: Array<{
          _id: Id<"stores">;
          isPublic: boolean;
          name: string;
          slug: string;
        }>;
        totalEnrollments: number;
        totalRevenue: number;
        userId: string;
      }>
    >;
    getCategoryDistribution: FunctionReference<
      "query",
      "public",
      { clerkId?: string },
      Array<{ category: string; count: number; revenue: number }>
    >;
    getCreatorEmailStats: FunctionReference<
      "query",
      "public",
      { clerkId?: string },
      {
        activeCreators: number;
        creatorsWithEmail: number;
        newCreatorsThisMonth: number;
        totalCreators: number;
      }
    >;
    getCreatorsForEmail: FunctionReference<
      "query",
      "public",
      { clerkId?: string; limit?: number; search?: string },
      Array<{
        _id: Id<"users">;
        clerkId: string;
        courseCount: number;
        email?: string;
        imageUrl?: string;
        lastActive?: number;
        name?: string;
        productCount: number;
        storeName?: string;
        storeSlug?: string;
        totalRevenue: number;
      }>
    >;
    getPlatformOverview: FunctionReference<
      "query",
      "public",
      { clerkId?: string },
      {
        activeUsers: number;
        newUsersThisMonth: number;
        publishedCourses: number;
        revenueThisMonth: number;
        totalCourses: number;
        totalEnrollments: number;
        totalProducts: number;
        totalPurchases: number;
        totalRevenue: number;
        totalStores: number;
        totalUsers: number;
      }
    >;
    getRecentActivity: FunctionReference<
      "query",
      "public",
      { clerkId?: string },
      Array<{
        amount?: number;
        description: string;
        timestamp: number;
        type: string;
        userId?: string;
      }>
    >;
    getRevenueExportData: FunctionReference<
      "query",
      "public",
      { clerkId?: string; endDate?: number; startDate?: number },
      Array<{
        amount: number;
        customerEmail?: string;
        date: string;
        productName: string;
        status: string;
        transactionId: string;
        type: string;
      }>
    >;
    getRevenueOverTime: FunctionReference<
      "query",
      "public",
      { clerkId?: string },
      Array<{ date: string; purchases: number; revenue: number }>
    >;
    getTopCourses: FunctionReference<
      "query",
      "public",
      { clerkId?: string; limit?: number },
      Array<{
        courseId: Id<"courses">;
        enrollments: number;
        rating: number;
        revenue: number;
        title: string;
        views: number;
      }>
    >;
    getTopCreators: FunctionReference<
      "query",
      "public",
      { clerkId?: string; limit?: number },
      Array<{
        courseCount: number;
        name: string;
        totalEnrollments: number;
        totalRevenue: number;
        userId: string;
      }>
    >;
    getUserGrowth: FunctionReference<
      "query",
      "public",
      { clerkId?: string },
      Array<{ date: string; newUsers: number; totalUsers: number }>
    >;
  };
  adminCoach: {
    approveCoachProfile: FunctionReference<
      "mutation",
      "public",
      { clerkId: string; profileId: Id<"coachProfiles"> },
      { message: string; success: boolean }
    >;
    cleanupOrphanedProfiles: FunctionReference<
      "mutation",
      "public",
      { clerkId: string; dryRun?: boolean },
      {
        deletedIds: Array<string>;
        message: string;
        orphanedCount: number;
        success: boolean;
      }
    >;
    deleteCoachProfile: FunctionReference<
      "mutation",
      "public",
      { clerkId: string; profileId: Id<"coachProfiles"> },
      { message: string; success: boolean }
    >;
    getActiveCoachProfilesByUserId: FunctionReference<
      "query",
      "public",
      { userId: string },
      Array<{
        _creationTime: number;
        _id: Id<"coachProfiles">;
        availableDays: string;
        availableHours?: string;
        basePrice: number;
        category: string;
        description: string;
        imageSrc: string;
        location: string;
        timezone: string;
        title: string;
        userId: string;
      }>
    >;
    getAllCoachProfiles: FunctionReference<
      "query",
      "public",
      { clerkId: string },
      Array<{
        _creationTime: number;
        _id: Id<"coachProfiles">;
        alternativeContact?: string;
        availableDays: string;
        availableHours?: string;
        basePrice: number;
        category: string;
        certifications?: string;
        description: string;
        discordId?: string;
        discordUsername: string;
        imageSrc: string;
        isActive?: boolean;
        location: string;
        notableProjects?: string;
        professionalBackground?: string;
        stripeAccountId?: string;
        stripeAccountStatus?: string;
        stripeConnectComplete?: boolean;
        timezone: string;
        title: string;
        userEmail?: string;
        userId: string;
        userName?: string;
      }>
    >;
    getCoachProfilesDebug: FunctionReference<
      "query",
      "public",
      { clerkId: string },
      Array<{
        _creationTime: number;
        _id: Id<"coachProfiles">;
        hasUser: boolean;
        isActive?: boolean;
        stripeAccountStatus?: string;
        stripeConnectComplete?: boolean;
        title: string;
        userId: string;
        userIsAdmin?: boolean;
      }>
    >;
    rejectCoachProfile: FunctionReference<
      "mutation",
      "public",
      { clerkId: string; profileId: Id<"coachProfiles"> },
      { message: string; success: boolean }
    >;
  };
  adminConversion: {
    getAbandonedCarts: FunctionReference<
      "query",
      "public",
      { clerkId?: string; days?: number },
      Array<{
        abandonedAt: number;
        amount: number;
        daysSinceAbandoned: number;
        productName: string;
        productType: string;
        userEmail?: string;
        userId: string;
        userName?: string;
      }>
    >;
    getConversionBySource: FunctionReference<
      "query",
      "public",
      { clerkId?: string; days?: number },
      Array<{
        conversionRate: number;
        purchases: number;
        revenue: number;
        signups: number;
        source: string;
        visitors: number;
      }>
    >;
    getConversionMetrics: FunctionReference<
      "query",
      "public",
      { clerkId?: string },
      {
        averageOrderValue: number;
        cartAbandonmentRate: number;
        enrollToPurchase: number;
        overallConversion: number;
        repeatPurchaseRate: number;
        signupToEnroll: number;
        visitToSignup: number;
      }
    >;
    getCouponPerformance: FunctionReference<
      "query",
      "public",
      { clerkId?: string },
      {
        activeCoupons: number;
        recentUsages: Array<{
          code: string;
          discountApplied: number;
          usedAt: number;
          userName?: string;
        }>;
        topCoupons: Array<{
          code: string;
          conversionRate: number;
          discountGiven: number;
          isActive: boolean;
          usageCount: number;
        }>;
        totalCoupons: number;
        totalDiscountGiven: number;
        totalUsages: number;
      }
    >;
    getPurchaseFunnel: FunctionReference<
      "query",
      "public",
      { clerkId?: string; days?: number },
      {
        averageTimeToConvert: number;
        overallConversion: number;
        steps: Array<{
          conversionRate: number;
          count: number;
          dropOffRate: number;
          name: string;
        }>;
      }
    >;
  };
  adminEmailMonitoring: {
    addEmailDomain: FunctionReference<
      "mutation",
      "public",
      { domain: string; type: "shared" | "dedicated" | "custom" },
      Id<"emailDomains">
    >;
    createDomainAlert: FunctionReference<
      "mutation",
      "public",
      {
        details?: string;
        domainId: Id<"emailDomains">;
        message: string;
        severity: "info" | "warning" | "critical";
        type:
          | "high_bounce_rate"
          | "spam_complaints"
          | "dns_issue"
          | "rate_limit_reached"
          | "reputation_drop"
          | "blacklist_detected";
      },
      Id<"emailDomainAlerts">
    >;
    deleteEmailDomain: FunctionReference<
      "mutation",
      "public",
      { domainId: Id<"emailDomains"> },
      null
    >;
    getDomainDetails: FunctionReference<
      "query",
      "public",
      { domainId: Id<"emailDomains"> },
      {
        alerts: Array<any>;
        analytics: {
          last30Days: {
            avgBounceRate: number;
            avgDeliveryRate: number;
            avgOpenRate: number;
            totalSent: number;
          };
          last7Days: Array<any>;
          today: any;
        };
        domain: any;
        recentEvents: Array<any>;
        topCreators: Array<{
          bounceRate: number;
          openRate: number;
          sent: number;
          status: string;
          storeId: Id<"stores">;
          storeName: string;
        }>;
      }
    >;
    getEmailAnalyticsChartData: FunctionReference<
      "query",
      "public",
      { days?: number },
      Array<{
        bounceRate: number;
        bounced: number;
        clicked: number;
        date: string;
        delivered: number;
        deliveryRate: number;
        openRate: number;
        opened: number;
        sent: number;
        spamComplaints: number;
      }>
    >;
    getFlaggedCreators: FunctionReference<
      "query",
      "public",
      {},
      Array<{
        bounceRate: number;
        domain: string;
        issues: Array<string>;
        reputationScore: number;
        spamRate: number;
        status: string;
        storeId: Id<"stores">;
        storeName: string;
      }>
    >;
    getPlatformOverview: FunctionReference<
      "query",
      "public",
      {},
      {
        alerts: number;
        creators: { active: number; flagged: number; total: number };
        domains: {
          active: number;
          suspended: number;
          total: number;
          warning: number;
        };
        today: {
          bounceRate: number;
          bounced: number;
          clicked: number;
          delivered: number;
          deliveryRate: number;
          openRate: number;
          opened: number;
          sent: number;
          spamComplaints: number;
          spamRate: number;
        };
        trend: { deliveryRate: number; openRate: number; sent: number };
      }
    >;
    getRecentEmailActivity: FunctionReference<
      "query",
      "public",
      { limit?: number },
      Array<{
        domain?: string;
        email?: string;
        id: string;
        message: string;
        status?: string;
        timestamp: number;
        type: string;
      }>
    >;
    listEmailDomains: FunctionReference<
      "query",
      "public",
      {},
      Array<{
        _id: Id<"emailDomains">;
        alerts: number;
        domain: string;
        reputation: { lastUpdated: number; score: number; status: string };
        status: string;
        todayStats?: {
          bounceRate: number;
          delivered: number;
          sent: number;
          spamRate: number;
        };
        type: string;
      }>
    >;
    resolveAlert: FunctionReference<
      "mutation",
      "public",
      { alertId: Id<"emailDomainAlerts"> },
      null
    >;
    updateDomainStatus: FunctionReference<
      "mutation",
      "public",
      {
        domainId: Id<"emailDomains">;
        status: "pending" | "verifying" | "active" | "suspended" | "retired";
      },
      null
    >;
  };
  adminSetup: {
    checkAdminStatus: FunctionReference<
      "query",
      "public",
      { clerkId: string },
      { found: boolean; isAdmin: boolean; userInfo?: string }
    >;
    makeUserAdmin: FunctionReference<
      "mutation",
      "public",
      { clerkId: string },
      { message: string; success: boolean }
    >;
  };
  affiliates: {
    applyForAffiliate: FunctionReference<
      "mutation",
      "public",
      {
        affiliateCode?: string;
        affiliateUserId: string;
        applicationNote?: string;
        creatorId: string;
        storeId: Id<"stores">;
      },
      any
    >;
    approveAffiliate: FunctionReference<
      "mutation",
      "public",
      { affiliateId: Id<"affiliates">; commissionRate?: number },
      any
    >;
    approveSale: FunctionReference<
      "mutation",
      "public",
      { saleId: Id<"affiliateSales"> },
      any
    >;
    completeAffiliatePayout: FunctionReference<
      "mutation",
      "public",
      { payoutId: Id<"affiliatePayouts">; transactionId?: string },
      any
    >;
    createAffiliatePayout: FunctionReference<
      "mutation",
      "public",
      { affiliateId: Id<"affiliates">; saleIds: Array<Id<"affiliateSales">> },
      any
    >;
    failAffiliatePayout: FunctionReference<
      "mutation",
      "public",
      { payoutId: Id<"affiliatePayouts">; reason: string },
      any
    >;
    getAffiliateByCode: FunctionReference<
      "query",
      "public",
      { affiliateCode: string },
      any
    >;
    getAffiliateByUser: FunctionReference<
      "query",
      "public",
      { storeId?: Id<"stores">; userId: string },
      any
    >;
    getAffiliateClicks: FunctionReference<
      "query",
      "public",
      { affiliateId: Id<"affiliates">; endDate?: number; startDate?: number },
      any
    >;
    getAffiliatePayouts: FunctionReference<
      "query",
      "public",
      { affiliateId: Id<"affiliates"> },
      any
    >;
    getAffiliateSales: FunctionReference<
      "query",
      "public",
      {
        affiliateId: Id<"affiliates">;
        limit?: number;
        status?: "pending" | "approved" | "paid" | "reversed";
      },
      any
    >;
    getAffiliatesByStore: FunctionReference<
      "query",
      "public",
      {
        status?: "active" | "pending" | "suspended" | "rejected";
        storeId: Id<"stores">;
      },
      any
    >;
    getAffiliateStats: FunctionReference<
      "query",
      "public",
      { affiliateId: Id<"affiliates"> },
      any
    >;
    recordAffiliateSale: FunctionReference<
      "mutation",
      "public",
      {
        affiliateCode: string;
        customerId: string;
        itemId: string;
        itemType: "course" | "product" | "subscription";
        orderAmount: number;
        orderId: string;
        storeId: Id<"stores">;
      },
      any
    >;
    rejectAffiliate: FunctionReference<
      "mutation",
      "public",
      { affiliateId: Id<"affiliates">; reason: string },
      any
    >;
    reverseSale: FunctionReference<
      "mutation",
      "public",
      { saleId: Id<"affiliateSales"> },
      any
    >;
    suspendAffiliate: FunctionReference<
      "mutation",
      "public",
      { affiliateId: Id<"affiliates"> },
      any
    >;
    trackAffiliateClick: FunctionReference<
      "mutation",
      "public",
      {
        affiliateCode: string;
        ipAddress?: string;
        landingPage: string;
        referrerUrl?: string;
        userAgent?: string;
        visitorId?: string;
      },
      any
    >;
    updateAffiliateSettings: FunctionReference<
      "mutation",
      "public",
      {
        affiliateId: Id<"affiliates">;
        commissionRate?: number;
        payoutEmail?: string;
        payoutMethod?: "stripe" | "paypal" | "manual";
      },
      any
    >;
  };
  aiAgents: {
    createAgent: FunctionReference<
      "mutation",
      "public",
      {
        category:
          | "marketing"
          | "audio"
          | "business"
          | "social"
          | "creative"
          | "productivity"
          | "learning"
          | "custom";
        color?: string;
        creatorId?: string;
        defaultSettings?: {
          chunksPerFacet?: number;
          enableCreativeMode?: boolean;
          enableWebResearch?: boolean;
          maxFacets?: number;
          preset?: string;
          responseStyle?: string;
        };
        description: string;
        enabledTools?: Array<string>;
        icon: string;
        knowledgeFilters?: {
          categories?: Array<string>;
          sourceTypes?: Array<string>;
          tags?: Array<string>;
        };
        longDescription?: string;
        name: string;
        slug: string;
        suggestedQuestions?: Array<string>;
        systemPrompt: string;
        tags?: Array<string>;
        toolConfigs?: any;
        visibility: "public" | "subscribers" | "private";
        welcomeMessage?: string;
      },
      Id<"aiAgents">
    >;
    getAgent: FunctionReference<
      "query",
      "public",
      { agentId: Id<"aiAgents"> },
      {
        _creationTime: number;
        _id: Id<"aiAgents">;
        category: string;
        color?: string;
        defaultSettings?: {
          chunksPerFacet?: number;
          enableCreativeMode?: boolean;
          enableWebResearch?: boolean;
          maxFacets?: number;
          preset?: string;
          responseStyle?: string;
        };
        description: string;
        enabledTools?: Array<string>;
        icon: string;
        isBuiltIn: boolean;
        knowledgeFilters?: {
          categories?: Array<string>;
          sourceTypes?: Array<string>;
          tags?: Array<string>;
        };
        name: string;
        slug: string;
        suggestedQuestions?: Array<string>;
        systemPrompt: string;
        welcomeMessage?: string;
      } | null
    >;
    getAgentBySlug: FunctionReference<
      "query",
      "public",
      { slug: string },
      {
        _creationTime: number;
        _id: Id<"aiAgents">;
        avatarUrl?: string;
        category: string;
        color?: string;
        conversationCount: number;
        defaultSettings?: {
          chunksPerFacet?: number;
          enableCreativeMode?: boolean;
          enableWebResearch?: boolean;
          maxFacets?: number;
          preset?: string;
          responseStyle?: string;
        };
        description: string;
        enabledTools?: Array<string>;
        icon: string;
        isBuiltIn: boolean;
        knowledgeFilters?: {
          categories?: Array<string>;
          sourceTypes?: Array<string>;
          tags?: Array<string>;
        };
        longDescription?: string;
        name: string;
        rating?: number;
        slug: string;
        suggestedQuestions?: Array<string>;
        systemPrompt: string;
        tags?: Array<string>;
        toolConfigs?: any;
        welcomeMessage?: string;
      } | null
    >;
    getAgentsByCategory: FunctionReference<
      "query",
      "public",
      { category: string },
      Array<{
        _id: Id<"aiAgents">;
        color?: string;
        conversationCount: number;
        description: string;
        icon: string;
        isBuiltIn: boolean;
        name: string;
        slug: string;
      }>
    >;
    getFeaturedAgents: FunctionReference<
      "query",
      "public",
      {},
      Array<{
        _id: Id<"aiAgents">;
        category: string;
        color?: string;
        conversationCount: number;
        description: string;
        icon: string;
        name: string;
        slug: string;
      }>
    >;
    getPublicAgents: FunctionReference<
      "query",
      "public",
      {},
      Array<{
        _creationTime: number;
        _id: Id<"aiAgents">;
        avatarUrl?: string;
        category: string;
        color?: string;
        conversationCount: number;
        description: string;
        icon: string;
        isBuiltIn: boolean;
        isFeatured?: boolean;
        longDescription?: string;
        name: string;
        rating?: number;
        ratingCount?: number;
        slug: string;
        suggestedQuestions?: Array<string>;
        tags?: Array<string>;
        welcomeMessage?: string;
      }>
    >;
    incrementConversationCount: FunctionReference<
      "mutation",
      "public",
      { agentId: Id<"aiAgents"> },
      null
    >;
    updateAgent: FunctionReference<
      "mutation",
      "public",
      {
        agentId: Id<"aiAgents">;
        color?: string;
        description?: string;
        icon?: string;
        isActive?: boolean;
        isFeatured?: boolean;
        longDescription?: string;
        name?: string;
        suggestedQuestions?: Array<string>;
        systemPrompt?: string;
        welcomeMessage?: string;
      },
      null
    >;
  };
  aiConversations: {
    archiveConversation: FunctionReference<
      "mutation",
      "public",
      { conversationId: Id<"aiConversations"> },
      null
    >;
    createConversation: FunctionReference<
      "mutation",
      "public",
      {
        agentId?: Id<"aiAgents">;
        agentName?: string;
        agentSlug?: string;
        preset?: string;
        responseStyle?: string;
        title?: string;
        userId: string;
      },
      Id<"aiConversations">
    >;
    deleteConversation: FunctionReference<
      "mutation",
      "public",
      { conversationId: Id<"aiConversations"> },
      null
    >;
    generateConversationTitle: FunctionReference<
      "action",
      "public",
      { conversationId: Id<"aiConversations">; userId: string },
      { success: boolean; title: string }
    >;
    getConversation: FunctionReference<
      "query",
      "public",
      { conversationId: Id<"aiConversations"> },
      {
        _creationTime: number;
        _id: Id<"aiConversations">;
        agentId?: Id<"aiAgents">;
        agentName?: string;
        agentSlug?: string;
        archived?: boolean;
        conversationGoal?: {
          deliverableType?: string;
          extractedAt: number;
          keyConstraints?: Array<string>;
          originalIntent: string;
        };
        createdAt: number;
        lastMessageAt: number;
        messageCount: number;
        preset?: string;
        preview?: string;
        responseStyle?: string;
        settings?: {
          agenticMode?: boolean;
          autoSaveWebResearch: boolean;
          chunksPerFacet: number;
          enableCreativeMode: boolean;
          enableCritic: boolean;
          enableFactVerification: boolean;
          enableWebResearch: boolean;
          maxFacets: number;
          maxRetries?: number;
          preset: string;
          qualityThreshold?: number;
          responseStyle: string;
          similarityThreshold: number;
          webSearchMaxResults?: number;
        };
        starred?: boolean;
        title: string;
        updatedAt: number;
        userId: string;
      } | null
    >;
    getConversationMessages: FunctionReference<
      "query",
      "public",
      { conversationId: Id<"aiConversations">; limit?: number },
      Array<{
        _creationTime: number;
        _id: Id<"aiMessages">;
        citations?: Array<{
          id: number;
          sourceId?: string;
          sourceType: string;
          title: string;
        }>;
        content: string;
        conversationId: Id<"aiConversations">;
        createdAt: number;
        facetsUsed?: Array<string>;
        pipelineMetadata?: {
          finalWriterModel?: string;
          plannerModel?: string;
          processingTimeMs: number;
          summarizerModel?: string;
          totalChunksProcessed: number;
        };
        role: "user" | "assistant";
        userId: string;
      }>
    >;
    getRecentContext: FunctionReference<
      "query",
      "public",
      { conversationId: Id<"aiConversations">; messageCount?: number },
      Array<{ content: string; role: "user" | "assistant" }>
    >;
    getUserConversations: FunctionReference<
      "query",
      "public",
      {
        agentId?: Id<"aiAgents">;
        includeArchived?: boolean;
        limit?: number;
        userId: string;
      },
      Array<{
        _creationTime: number;
        _id: Id<"aiConversations">;
        agentId?: Id<"aiAgents">;
        agentName?: string;
        agentSlug?: string;
        archived?: boolean;
        conversationGoal?: {
          deliverableType?: string;
          extractedAt: number;
          keyConstraints?: Array<string>;
          originalIntent: string;
        };
        createdAt: number;
        lastMessageAt: number;
        messageCount: number;
        preset?: string;
        preview?: string;
        responseStyle?: string;
        settings?: {
          agenticMode?: boolean;
          autoSaveWebResearch: boolean;
          chunksPerFacet: number;
          enableCreativeMode: boolean;
          enableCritic: boolean;
          enableFactVerification: boolean;
          enableWebResearch: boolean;
          maxFacets: number;
          maxRetries?: number;
          preset: string;
          qualityThreshold?: number;
          responseStyle: string;
          similarityThreshold: number;
          webSearchMaxResults?: number;
        };
        starred?: boolean;
        title: string;
        updatedAt: number;
        userId: string;
      }>
    >;
    saveMessage: FunctionReference<
      "mutation",
      "public",
      {
        citations?: Array<{
          id: number;
          sourceId?: string;
          sourceType: string;
          title: string;
        }>;
        content: string;
        conversationId: Id<"aiConversations">;
        facetsUsed?: Array<string>;
        pipelineMetadata?: {
          finalWriterModel?: string;
          plannerModel?: string;
          processingTimeMs: number;
          summarizerModel?: string;
          totalChunksProcessed: number;
        };
        role: "user" | "assistant";
        userId: string;
      },
      Id<"aiMessages"> | null
    >;
    searchConversations: FunctionReference<
      "query",
      "public",
      {
        includeArchived?: boolean;
        limit?: number;
        searchQuery: string;
        userId: string;
      },
      Array<{
        _creationTime: number;
        _id: Id<"aiConversations">;
        agentId?: Id<"aiAgents">;
        agentName?: string;
        agentSlug?: string;
        archived?: boolean;
        conversationGoal?: {
          deliverableType?: string;
          extractedAt: number;
          keyConstraints?: Array<string>;
          originalIntent: string;
        };
        createdAt: number;
        lastMessageAt: number;
        matchedMessageCount: number;
        matchedMessagePreview?: string;
        messageCount: number;
        preset?: string;
        preview?: string;
        responseStyle?: string;
        settings?: {
          agenticMode?: boolean;
          autoSaveWebResearch: boolean;
          chunksPerFacet: number;
          enableCreativeMode: boolean;
          enableCritic: boolean;
          enableFactVerification: boolean;
          enableWebResearch: boolean;
          maxFacets: number;
          maxRetries?: number;
          preset: string;
          qualityThreshold?: number;
          responseStyle: string;
          similarityThreshold: number;
          webSearchMaxResults?: number;
        };
        starred?: boolean;
        title: string;
        updatedAt: number;
        userId: string;
      }>
    >;
    toggleStarred: FunctionReference<
      "mutation",
      "public",
      { conversationId: Id<"aiConversations"> },
      null
    >;
    unarchiveConversation: FunctionReference<
      "mutation",
      "public",
      { conversationId: Id<"aiConversations"> },
      null
    >;
    updateConversationSettings: FunctionReference<
      "mutation",
      "public",
      {
        conversationId: Id<"aiConversations">;
        settings: {
          agenticMode?: boolean;
          autoSaveWebResearch: boolean;
          chunksPerFacet: number;
          enableCreativeMode: boolean;
          enableCritic: boolean;
          enableFactVerification: boolean;
          enableWebResearch: boolean;
          maxFacets: number;
          maxRetries?: number;
          preset: string;
          qualityThreshold?: number;
          responseStyle: string;
          similarityThreshold: number;
          webSearchMaxResults?: number;
        };
      },
      null
    >;
    updateConversationTitle: FunctionReference<
      "mutation",
      "public",
      { conversationId: Id<"aiConversations">; title: string },
      null
    >;
  };
  aiCourseBuilder: {
    createCourseFromOutline: FunctionReference<
      "action",
      "public",
      {
        outlineId: Id<"aiCourseOutlines">;
        price?: number;
        publish?: boolean;
        queueId: Id<"aiCourseQueue">;
      },
      {
        courseId?: Id<"courses">;
        error?: string;
        slug?: string;
        success: boolean;
      }
    >;
    expandAllChapters: FunctionReference<
      "action",
      "public",
      {
        outlineId: Id<"aiCourseOutlines">;
        parallelBatchSize?: number;
        queueId: Id<"aiCourseQueue">;
        settings?: {
          autoSaveWebResearch: boolean;
          chunksPerFacet: number;
          customModels?: {
            critic?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
            finalWriter?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
            ideaGenerator?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
            planner?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
            summarizer?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
          };
          enableCreativeMode: boolean;
          enableCritic: boolean;
          enableFactVerification: boolean;
          enableWebResearch: boolean;
          maxFacets: number;
          maxRetries?: number;
          preset: "budget" | "speed" | "balanced" | "deepReasoning" | "premium";
          qualityThreshold?: number;
          responseStyle:
            | "structured"
            | "conversational"
            | "concise"
            | "educational";
          similarityThreshold: number;
          sourceTypes?: Array<
            "course" | "chapter" | "lesson" | "document" | "note" | "custom"
          >;
          webSearchMaxResults?: number;
        };
      },
      {
        error?: string;
        expandedCount: number;
        failedCount: number;
        success: boolean;
      }
    >;
    expandChapterContent: FunctionReference<
      "action",
      "public",
      {
        chapterIndex: number;
        lessonIndex: number;
        moduleIndex: number;
        outlineId: Id<"aiCourseOutlines">;
        settings?: {
          autoSaveWebResearch: boolean;
          chunksPerFacet: number;
          customModels?: {
            critic?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
            finalWriter?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
            ideaGenerator?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
            planner?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
            summarizer?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
          };
          enableCreativeMode: boolean;
          enableCritic: boolean;
          enableFactVerification: boolean;
          enableWebResearch: boolean;
          maxFacets: number;
          maxRetries?: number;
          preset: "budget" | "speed" | "balanced" | "deepReasoning" | "premium";
          qualityThreshold?: number;
          responseStyle:
            | "structured"
            | "conversational"
            | "concise"
            | "educational";
          similarityThreshold: number;
          sourceTypes?: Array<
            "course" | "chapter" | "lesson" | "document" | "note" | "custom"
          >;
          webSearchMaxResults?: number;
        };
      },
      { content?: string; error?: string; success: boolean; wordCount?: number }
    >;
    expandExistingChapter: FunctionReference<
      "action",
      "public",
      {
        chapterId: Id<"courseChapters">;
        courseTitle: string;
        lessonTitle: string;
        moduleTitle: string;
        settings?: {
          autoSaveWebResearch: boolean;
          chunksPerFacet: number;
          customModels?: {
            critic?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
            finalWriter?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
            ideaGenerator?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
            planner?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
            summarizer?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
          };
          enableCreativeMode: boolean;
          enableCritic: boolean;
          enableFactVerification: boolean;
          enableWebResearch: boolean;
          maxFacets: number;
          maxRetries?: number;
          preset: "budget" | "speed" | "balanced" | "deepReasoning" | "premium";
          qualityThreshold?: number;
          responseStyle:
            | "structured"
            | "conversational"
            | "concise"
            | "educational";
          similarityThreshold: number;
          sourceTypes?: Array<
            "course" | "chapter" | "lesson" | "document" | "note" | "custom"
          >;
          webSearchMaxResults?: number;
        };
        skillLevel?: string;
      },
      { content?: string; error?: string; success: boolean; wordCount?: number }
    >;
    expandExistingCourseChapters: FunctionReference<
      "action",
      "public",
      {
        courseId: Id<"courses">;
        onlyEmpty?: boolean;
        parallelBatchSize?: number;
        settings?: {
          autoSaveWebResearch: boolean;
          chunksPerFacet: number;
          customModels?: {
            critic?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
            finalWriter?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
            ideaGenerator?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
            planner?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
            summarizer?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
          };
          enableCreativeMode: boolean;
          enableCritic: boolean;
          enableFactVerification: boolean;
          enableWebResearch: boolean;
          maxFacets: number;
          maxRetries?: number;
          preset: "budget" | "speed" | "balanced" | "deepReasoning" | "premium";
          qualityThreshold?: number;
          responseStyle:
            | "structured"
            | "conversational"
            | "concise"
            | "educational";
          similarityThreshold: number;
          sourceTypes?: Array<
            "course" | "chapter" | "lesson" | "document" | "note" | "custom"
          >;
          webSearchMaxResults?: number;
        };
      },
      {
        error?: string;
        expandedCount: number;
        failedCount: number;
        skippedCount: number;
        success: boolean;
      }
    >;
    generateOutline: FunctionReference<
      "action",
      "public",
      {
        queueId: Id<"aiCourseQueue">;
        settings?: {
          autoSaveWebResearch: boolean;
          chunksPerFacet: number;
          customModels?: {
            critic?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
            finalWriter?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
            ideaGenerator?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
            planner?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
            summarizer?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
          };
          enableCreativeMode: boolean;
          enableCritic: boolean;
          enableFactVerification: boolean;
          enableWebResearch: boolean;
          maxFacets: number;
          maxRetries?: number;
          preset: "budget" | "speed" | "balanced" | "deepReasoning" | "premium";
          qualityThreshold?: number;
          responseStyle:
            | "structured"
            | "conversational"
            | "concise"
            | "educational";
          similarityThreshold: number;
          sourceTypes?: Array<
            "course" | "chapter" | "lesson" | "document" | "note" | "custom"
          >;
          webSearchMaxResults?: number;
        };
      },
      {
        error?: string;
        outline?: any;
        outlineId?: Id<"aiCourseOutlines">;
        pipelineMetadata?: any;
        success: boolean;
      }
    >;
    getCourseStructureForExpansion: FunctionReference<
      "action",
      "public",
      { courseId: Id<"courses"> },
      {
        chaptersWithContent?: number;
        course?: {
          _id: Id<"courses">;
          description?: string;
          skillLevel?: string;
          title: string;
        };
        error?: string;
        modules?: Array<{
          _id: Id<"courseModules">;
          description?: string;
          lessons: Array<{
            _id: Id<"courseLessons">;
            chapters: Array<{
              _id: Id<"courseChapters">;
              description?: string;
              hasContent: boolean;
              position: number;
              title: string;
              wordCount: number;
            }>;
            description?: string;
            position: number;
            title: string;
          }>;
          position: number;
          title: string;
        }>;
        success: boolean;
        totalChapters?: number;
      }
    >;
    processNextInQueue: FunctionReference<
      "action",
      "public",
      { userId?: string },
      { error?: string; processed: boolean; queueId?: Id<"aiCourseQueue"> }
    >;
    reformatChapterContent: FunctionReference<
      "action",
      "public",
      { chapterId: Id<"courseChapters">; chapterTitle: string },
      { content?: string; error?: string; success: boolean; wordCount?: number }
    >;
    reformatCourseChapters: FunctionReference<
      "action",
      "public",
      { courseId: Id<"courses">; parallelBatchSize?: number },
      {
        error?: string;
        failedCount: number;
        reformattedCount: number;
        skippedCount: number;
        success: boolean;
      }
    >;
  };
  aiCourseBuilderQueries: {
    addBatchToQueue: FunctionReference<
      "mutation",
      "public",
      {
        prompts: Array<{
          prompt: string;
          skillLevel?: "beginner" | "intermediate" | "advanced";
          targetLessonsPerModule?: number;
          targetModules?: number;
        }>;
        storeId: string;
        userId: string;
      },
      Array<Id<"aiCourseQueue">>
    >;
    addToQueue: FunctionReference<
      "mutation",
      "public",
      {
        priority?: number;
        prompt: string;
        skillLevel?: "beginner" | "intermediate" | "advanced";
        storeId: string;
        targetLessonsPerModule?: number;
        targetModules?: number;
        userId: string;
      },
      Id<"aiCourseQueue">
    >;
    cleanupCourseTitles: FunctionReference<
      "mutation",
      "public",
      { courseId: Id<"courses"> },
      { lessonsFixed: number; modulesFixed: number; success: boolean }
    >;
    deleteOrphanLessons: FunctionReference<
      "mutation",
      "public",
      { lessonIds: Array<string> },
      { deleted: number; success: boolean }
    >;
    deleteQueueItem: FunctionReference<
      "mutation",
      "public",
      { queueId: Id<"aiCourseQueue">; userId: string },
      boolean
    >;
    exportOutlineAsJson: FunctionReference<
      "query",
      "public",
      { outlineId: Id<"aiCourseOutlines"> },
      any
    >;
    fixChapterLessonMappings: FunctionReference<
      "mutation",
      "public",
      { courseId: Id<"courses">; outlineId: Id<"aiCourseOutlines"> },
      { errors: Array<string>; fixed: number; success: boolean }
    >;
    getActiveQueueItems: FunctionReference<
      "query",
      "public",
      { userId: string },
      Array<any>
    >;
    getCourseStructure: FunctionReference<
      "query",
      "public",
      { courseId: Id<"courses"> },
      | {
          chaptersWithContent: number;
          course: {
            _id: Id<"courses">;
            description?: string;
            skillLevel?: string;
            title: string;
          };
          modules: Array<{
            _id: Id<"courseModules">;
            description?: string;
            lessons: Array<{
              _id: Id<"courseLessons">;
              chapters: Array<{
                _id: Id<"courseChapters">;
                description?: string;
                hasContent: boolean;
                position: number;
                title: string;
                wordCount: number;
              }>;
              description?: string;
              position: number;
              title: string;
            }>;
            position: number;
            title: string;
          }>;
          success: true;
          totalChapters: number;
        }
      | { error: string; success: false }
      | null
    >;
    getOutline: FunctionReference<
      "query",
      "public",
      { outlineId: Id<"aiCourseOutlines"> },
      any
    >;
    getQueueItems: FunctionReference<
      "query",
      "public",
      { limit?: number; status?: string; userId: string },
      Array<any>
    >;
    getQueueItemWithOutline: FunctionReference<
      "query",
      "public",
      { queueId: Id<"aiCourseQueue"> },
      any
    >;
    repairCourseFromOutline: FunctionReference<
      "mutation",
      "public",
      { courseId: Id<"courses">; outlineId: Id<"aiCourseOutlines"> },
      {
        chaptersFixed: number;
        error?: string;
        lessonsCreated: number;
        success: boolean;
      }
    >;
    startBackgroundChapterExpansion: FunctionReference<
      "mutation",
      "public",
      {
        outlineId: Id<"aiCourseOutlines">;
        parallelBatchSize?: number;
        queueId: Id<"aiCourseQueue">;
        settings?: {
          autoSaveWebResearch: boolean;
          chunksPerFacet: number;
          customModels?: {
            critic?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
            finalWriter?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
            ideaGenerator?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
            planner?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
            summarizer?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
          };
          enableCreativeMode: boolean;
          enableCritic: boolean;
          enableFactVerification: boolean;
          enableWebResearch: boolean;
          maxFacets: number;
          maxRetries?: number;
          preset: "budget" | "speed" | "balanced" | "deepReasoning" | "premium";
          qualityThreshold?: number;
          responseStyle:
            | "structured"
            | "conversational"
            | "concise"
            | "educational";
          similarityThreshold: number;
          sourceTypes?: Array<
            "course" | "chapter" | "lesson" | "document" | "note" | "custom"
          >;
          webSearchMaxResults?: number;
        };
      },
      { error?: string; success: boolean }
    >;
    startBackgroundExistingCourseExpansion: FunctionReference<
      "mutation",
      "public",
      {
        courseId: Id<"courses">;
        parallelBatchSize?: number;
        settings?: {
          autoSaveWebResearch: boolean;
          chunksPerFacet: number;
          customModels?: {
            critic?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
            finalWriter?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
            ideaGenerator?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
            planner?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
            summarizer?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
          };
          enableCreativeMode: boolean;
          enableCritic: boolean;
          enableFactVerification: boolean;
          enableWebResearch: boolean;
          maxFacets: number;
          maxRetries?: number;
          preset: "budget" | "speed" | "balanced" | "deepReasoning" | "premium";
          qualityThreshold?: number;
          responseStyle:
            | "structured"
            | "conversational"
            | "concise"
            | "educational";
          similarityThreshold: number;
          sourceTypes?: Array<
            "course" | "chapter" | "lesson" | "document" | "note" | "custom"
          >;
          webSearchMaxResults?: number;
        };
        storeId: string;
        userId: string;
      },
      { error?: string; queueId?: Id<"aiCourseQueue">; success: boolean }
    >;
    startBackgroundOutlineGeneration: FunctionReference<
      "mutation",
      "public",
      {
        prompt: string;
        settings?: {
          autoSaveWebResearch: boolean;
          chunksPerFacet: number;
          customModels?: {
            critic?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
            finalWriter?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
            ideaGenerator?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
            planner?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
            summarizer?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
          };
          enableCreativeMode: boolean;
          enableCritic: boolean;
          enableFactVerification: boolean;
          enableWebResearch: boolean;
          maxFacets: number;
          maxRetries?: number;
          preset: "budget" | "speed" | "balanced" | "deepReasoning" | "premium";
          qualityThreshold?: number;
          responseStyle:
            | "structured"
            | "conversational"
            | "concise"
            | "educational";
          similarityThreshold: number;
          sourceTypes?: Array<
            "course" | "chapter" | "lesson" | "document" | "note" | "custom"
          >;
          webSearchMaxResults?: number;
        };
        skillLevel?: "beginner" | "intermediate" | "advanced";
        storeId: string;
        targetLessonsPerModule?: number;
        targetModules?: number;
        userId: string;
      },
      { error?: string; queueId?: Id<"aiCourseQueue">; success: boolean }
    >;
    startBackgroundReformatting: FunctionReference<
      "mutation",
      "public",
      {
        courseId: Id<"courses">;
        parallelBatchSize?: number;
        storeId: string;
        userId: string;
      },
      { error?: string; queueId?: Id<"aiCourseQueue">; success: boolean }
    >;
    subscribeToQueueItem: FunctionReference<
      "query",
      "public",
      { queueId: Id<"aiCourseQueue"> },
      any
    >;
    updateOutline: FunctionReference<
      "mutation",
      "public",
      {
        description?: string;
        outline?: any;
        outlineId: Id<"aiCourseOutlines">;
        title?: string;
      },
      null
    >;
    updateQueueStatus: FunctionReference<
      "mutation",
      "public",
      {
        error?: string;
        progress?: {
          completedSteps: number;
          currentChapter?: string;
          currentStep: string;
          totalSteps: number;
        };
        queueId: Id<"aiCourseQueue">;
        status:
          | "queued"
          | "generating_outline"
          | "outline_ready"
          | "expanding_content"
          | "reformatting"
          | "ready_to_create"
          | "creating_course"
          | "completed"
          | "failed";
      },
      null
    >;
  };
  aiEmailGenerator: {
    generateEmailTemplate: FunctionReference<
      "action",
      "public",
      { prompt: string; templateType?: string },
      {
        htmlContent: string;
        name: string;
        subject: string;
        textContent: string;
      }
    >;
    generateWorkflowEmail: FunctionReference<
      "action",
      "public",
      {
        contextType: "course" | "store" | "product" | "custom";
        courseId?: Id<"courses">;
        customPrompt?: string;
        emailType:
          | "welcome"
          | "nurture"
          | "pitch"
          | "follow_up"
          | "thank_you"
          | "reminder"
          | "custom";
        productId?: Id<"digitalProducts">;
        storeId: string;
        tone?:
          | "professional"
          | "friendly"
          | "casual"
          | "urgent"
          | "educational";
      },
      { body: string; previewText: string; subject: string }
    >;
  };
  aiMemories: {
    archiveMemory: FunctionReference<
      "mutation",
      "public",
      { memoryId: Id<"aiMemories"> },
      null
    >;
    boostMemoryImportance: FunctionReference<
      "mutation",
      "public",
      { boost?: number; memoryId: Id<"aiMemories"> },
      null
    >;
    clearMemories: FunctionReference<
      "mutation",
      "public",
      {
        type?: "preference" | "fact" | "skill_level" | "context" | "correction";
        userId: string;
      },
      { deleted: number }
    >;
    createMemory: FunctionReference<
      "mutation",
      "public",
      {
        content: string;
        expiresAt?: number;
        importance?: number;
        sourceConversationId?: Id<"aiConversations">;
        sourceMessageId?: Id<"aiMessages">;
        summary?: string;
        type: "preference" | "fact" | "skill_level" | "context" | "correction";
        userId: string;
      },
      Id<"aiMemories">
    >;
    deleteMemory: FunctionReference<
      "mutation",
      "public",
      { memoryId: Id<"aiMemories"> },
      null
    >;
    getRelevantMemories: FunctionReference<
      "query",
      "public",
      { limit?: number; userId: string },
      Array<{ content: string; importance: number; type: string }>
    >;
    getUserMemories: FunctionReference<
      "query",
      "public",
      {
        includeArchived?: boolean;
        limit?: number;
        type?: "preference" | "fact" | "skill_level" | "context" | "correction";
        userId: string;
      },
      Array<{
        _creationTime: number;
        _id: Id<"aiMemories">;
        accessCount: number;
        archived?: boolean;
        content: string;
        createdAt: number;
        expiresAt?: number;
        importance: number;
        lastAccessedAt?: number;
        sourceConversationId?: Id<"aiConversations">;
        sourceMessageId?: Id<"aiMessages">;
        summary?: string;
        type: "preference" | "fact" | "skill_level" | "context" | "correction";
        updatedAt: number;
        userId: string;
      }>
    >;
    markMemoryAccessed: FunctionReference<
      "mutation",
      "public",
      { memoryId: Id<"aiMemories"> },
      null
    >;
    updateMemory: FunctionReference<
      "mutation",
      "public",
      {
        content?: string;
        expiresAt?: number;
        importance?: number;
        memoryId: Id<"aiMemories">;
        summary?: string;
      },
      null
    >;
  };
  aiMessageFeedback: {
    getFeedbackForConversation: FunctionReference<
      "query",
      "public",
      { conversationId: Id<"aiConversations">; userId: string },
      Array<{ messageId: Id<"aiMessages">; vote: "up" | "down" }>
    >;
    getFeedbackForMessage: FunctionReference<
      "query",
      "public",
      { messageId: Id<"aiMessages">; userId: string },
      null | {
        _id: Id<"aiMessageFeedback">;
        reason?: string;
        tags?: Array<
          | "accurate"
          | "helpful"
          | "creative"
          | "well_written"
          | "inaccurate"
          | "unhelpful"
          | "off_topic"
          | "too_long"
          | "too_short"
        >;
        vote: "up" | "down";
      }
    >;
    getFeedbackStats: FunctionReference<
      "query",
      "public",
      { userId?: string },
      {
        downvotes: number;
        topTags: Array<{ count: number; tag: string }>;
        totalFeedback: number;
        upvotes: number;
      }
    >;
    removeFeedback: FunctionReference<
      "mutation",
      "public",
      { messageId: Id<"aiMessages">; userId: string },
      boolean
    >;
    submitFeedback: FunctionReference<
      "mutation",
      "public",
      {
        conversationId: Id<"aiConversations">;
        messageId: Id<"aiMessages">;
        reason?: string;
        tags?: Array<
          | "accurate"
          | "helpful"
          | "creative"
          | "well_written"
          | "inaccurate"
          | "unhelpful"
          | "off_topic"
          | "too_long"
          | "too_short"
        >;
        userId: string;
        vote: "up" | "down";
      },
      Id<"aiMessageFeedback">
    >;
  };
  aiPlatform: {
    contentFlywheel: {
      analyzeContentGaps: FunctionReference<
        "query",
        "public",
        {},
        {
          lowCoverageAreas: Array<any>;
          missingTopics: Array<any>;
          opportunityScore: number;
        }
      >;
      getAutoSuggestions: FunctionReference<
        "query",
        "public",
        {},
        Array<{
          actionUrl?: string;
          basedOn: string;
          confidence: number;
          description: string;
          specs?: any;
          title: string;
          type: string;
        }>
      >;
      getFlywheelStats: FunctionReference<
        "query",
        "public",
        {},
        {
          aiGenerated: { accuracy: number; total: number };
          contentCreated: { growth: string; thisMonth: number; total: number };
          flyWheelHealth: string;
          knowledgeBase: { embeddingsCount: number; topicsIndexed: number };
        }
      >;
    };
  };
  analytics: {
    creatorPipeline: {
      addCreatorTouch: FunctionReference<
        "mutation",
        "public",
        {
          creatorId: Id<"creatorPipeline">;
          note?: string;
          touchType: "dm" | "email" | "comment" | "call";
        },
        null
      >;
      getCreatorLeaderboard: FunctionReference<
        "query",
        "public",
        {
          limit?: number;
          sortBy?: "revenue" | "healthScore" | "products" | "enrollments";
        },
        Array<{
          _id?: Id<"creatorPipeline">;
          avgRating: number;
          courseCount: number;
          daysSinceLastSale?: number;
          healthScore: number;
          healthStatus: string;
          lastActiveAt?: number;
          onboardingProgress: number;
          productCount: number;
          rank: number;
          revenueThisMonth: number;
          storeName?: string;
          storeSlug?: string;
          totalEnrollments: number;
          totalRevenue: number;
          userAvatar?: string;
          userEmail?: string;
          userId: string;
          userName: string;
        }>
      >;
      getCreatorOnboardingStatus: FunctionReference<
        "query",
        "public",
        { userId: string },
        {
          overallProgress: number;
          steps: Array<{
            completed: boolean;
            completedAt?: number;
            description: string;
            id: string;
            title: string;
          }>;
          userId: string;
          userName?: string;
        }
      >;
      getCreatorsByStage: FunctionReference<
        "query",
        "public",
        {
          stage?:
            | "prospect"
            | "invited"
            | "signed_up"
            | "drafting"
            | "published"
            | "first_sale"
            | "active"
            | "churn_risk";
        },
        Array<{
          _id?: Id<"creatorPipeline">;
          assignedTo?: string;
          audienceSize?: number;
          daw?: string;
          daysSinceLastTouch?: number;
          instagramHandle?: string;
          lastTouchAt?: number;
          lastTouchType?: string;
          nextStepNote?: string;
          niche?: string;
          productCount?: number;
          stage: string;
          storeId?: Id<"stores">;
          tiktokHandle?: string;
          totalRevenue?: number;
          userAvatar?: string;
          userEmail?: string;
          userId: string;
          userName?: string;
        }>
      >;
      getCreatorsForBulkEmail: FunctionReference<
        "query",
        "public",
        {
          filter?:
            | "all"
            | "no_sales_30d"
            | "low_health"
            | "new_creators"
            | "top_performers";
        },
        Array<{
          email: string;
          lastSaleAt?: number;
          productCount: number;
          storeName?: string;
          totalRevenue: number;
          userId: string;
          userName: string;
        }>
      >;
      getCreatorsNeedingAttention: FunctionReference<
        "query",
        "public",
        {},
        Array<{
          daysSinceLastSale?: number;
          healthScore: number;
          issue: string;
          severity: string;
          storeName?: string;
          suggestedAction: string;
          userEmail?: string;
          userId: string;
          userName: string;
        }>
      >;
      getPipelineStats: FunctionReference<
        "query",
        "public",
        {},
        {
          active: number;
          churn_risk: number;
          drafting: number;
          first_sale: number;
          invited: number;
          prospect: number;
          published: number;
          signed_up: number;
        }
      >;
      getStuckCreators: FunctionReference<
        "query",
        "public",
        {},
        Array<{
          _id: Id<"creatorPipeline">;
          daysSinceStep: number;
          recommendedAction: string;
          stage: string;
          userEmail?: string;
          userId: string;
          userName?: string;
        }>
      >;
      updateCreatorStage: FunctionReference<
        "mutation",
        "public",
        {
          creatorId: Id<"creatorPipeline">;
          newStage:
            | "prospect"
            | "invited"
            | "signed_up"
            | "drafting"
            | "published"
            | "first_sale"
            | "active"
            | "churn_risk";
          note?: string;
        },
        null
      >;
      upsertCreatorPipeline: FunctionReference<
        "mutation",
        "public",
        {
          metadata?: {
            audienceSize?: number;
            daw?: string;
            instagramHandle?: string;
            niche?: string;
            tiktokHandle?: string;
          };
          stage:
            | "prospect"
            | "invited"
            | "signed_up"
            | "drafting"
            | "published"
            | "first_sale"
            | "active"
            | "churn_risk";
          storeId?: Id<"stores">;
          userId: string;
        },
        Id<"creatorPipeline">
      >;
    };
    errors: {
      getErrorRate: FunctionReference<
        "query",
        "public",
        { endTime: number; startTime: number },
        { errorRate: number; totalErrors: number; totalEvents: number }
      >;
      getRecentErrors: FunctionReference<
        "query",
        "public",
        { limit?: number },
        Array<{
          _id: Id<"analyticsEvents">;
          errorCode: string;
          errorMessage: string;
          storeId?: string;
          timestamp: number;
          userId: string;
        }>
      >;
    };
    funnels: {
      getCreatorFunnel: FunctionReference<
        "query",
        "public",
        { endTime: number; startTime: number; storeId?: string },
        {
          steps: Array<{
            conversionRate: number;
            count: number;
            dropOff: number;
            medianTimeToNext?: number;
            name: string;
          }>;
          stuckCreators: Array<{
            currentStep: string;
            daysSinceStep: number;
            userId: string;
          }>;
        }
      >;
      getLearnerFunnel: FunctionReference<
        "query",
        "public",
        { endTime: number; startTime: number; storeId?: string },
        {
          steps: Array<{
            conversionRate: number;
            count: number;
            dropOff: number;
            name: string;
          }>;
          totalDuration: { average: number; median: number };
        }
      >;
      getStuckUsers: FunctionReference<
        "query",
        "public",
        { daysStuck: number; funnelType: "learner" | "creator"; step: string },
        Array<{
          daysSinceStep: number;
          lastActivity: number;
          stuckAt: string;
          userId: string;
        }>
      >;
    };
    getAtRiskStudents: FunctionReference<
      "query",
      "public",
      { courseId: Id<"courses"> },
      any
    >;
    getChapterAnalytics: FunctionReference<
      "query",
      "public",
      { chapterId?: string; courseId: Id<"courses"> },
      any
    >;
    getCourseAnalytics: FunctionReference<
      "query",
      "public",
      { courseId: Id<"courses">; endDate?: string; startDate?: string },
      any
    >;
    getCourseCompletionRate: FunctionReference<
      "query",
      "public",
      { courseId: Id<"courses"> },
      any
    >;
    getCourseDropOffPoints: FunctionReference<
      "query",
      "public",
      { courseId: Id<"courses"> },
      any
    >;
    getCreatorAnalytics: FunctionReference<
      "query",
      "public",
      { timeRange: "7d" | "30d" | "90d" | "1y"; userId: string },
      {
        audienceInsights: {
          ageGroups: Array<{ percentage: number; range: string }>;
          deviceTypes: Array<{ percentage: number; type: string }>;
          topCountries: Array<{ country: string; percentage: number }>;
        };
        overview: {
          avgRating: number;
          conversionRate: number;
          publishedProducts: number;
          totalProducts: number;
          totalRevenue: number;
          totalSales: number;
          totalStudents: number;
          totalViews: number;
        };
        revenueData: Array<{ period: string; revenue: number }>;
        topProducts: Array<{
          _id: Id<"courses">;
          rating: number;
          revenue: number;
          sales: number;
          title: string;
          type: string;
          views: number;
        }>;
      }
    >;
    getCreatorCoursePerformance: FunctionReference<
      "query",
      "public",
      { userId: string },
      Array<{
        completionRate: number;
        courseId: string;
        enrollments: number;
        revenue: number;
        title: string;
      }>
    >;
    getCreatorEngagementRate: FunctionReference<
      "query",
      "public",
      { userId: string },
      { activeStudents: number; engagementRate: number; totalStudents: number }
    >;
    getCreatorRecentActivity: FunctionReference<
      "query",
      "public",
      { limit?: number; userId: string },
      Array<{
        amount?: number;
        description: string;
        id: string;
        timestamp: number;
        title: string;
        type: "purchase" | "enrollment" | "completion";
        userInfo?: { email?: string; name?: string };
      }>
    >;
    getCreatorRevenueOverTime: FunctionReference<
      "query",
      "public",
      { days?: number; userId: string },
      Array<{ date: string; revenue: number; sales: number }>
    >;
    getCreatorStudentProgress: FunctionReference<
      "query",
      "public",
      { limit?: number; userId: string },
      {
        activeStudents: number;
        atRiskStudents: number;
        avgProgress: number;
        students: Array<{
          courseTitle: string;
          email?: string;
          enrolledAt: number;
          id: string;
          isAtRisk: boolean;
          lastActivity?: number;
          name?: string;
          progress: number;
          streak?: number;
        }>;
        totalStudents: number;
      }
    >;
    getCreatorVideoAnalytics: FunctionReference<
      "query",
      "public",
      { userId: string },
      {
        avgCompletionRate: number;
        chapters: Array<{
          avgDropOffPoint: number;
          avgPercentWatched: number;
          chapterId: string;
          chapterTitle: string;
          completionCount: number;
          completionRate: number;
          courseTitle: string;
          rewatchCount: number;
          totalWatchTime: number;
          viewCount: number;
        }>;
        dropOffHotspots: Array<{
          avgDropOffPoint: number;
          chapterId: string;
          chapterTitle: string;
          courseTitle: string;
          dropOffRate: number;
        }>;
        totalViews: number;
        totalWatchTime: number;
      }
    >;
    getLearningStreak: FunctionReference<
      "query",
      "public",
      { userId: string },
      any
    >;
    getProductAnalytics: FunctionReference<
      "query",
      "public",
      { userId: string },
      null
    >;
    getProductMetrics: FunctionReference<
      "query",
      "public",
      { productId: string; productType: "course" | "digitalProduct" },
      {
        averageRating: number;
        conversionRate: number;
        revenue: number;
        reviewCount: number;
        sales: number;
        views: number;
      }
    >;
    getRecommendations: FunctionReference<
      "query",
      "public",
      { userId: string },
      any
    >;
    getRevenueAnalytics: FunctionReference<
      "query",
      "public",
      { creatorId: string; endDate?: string; startDate?: string },
      any
    >;
    getStudentProgress: FunctionReference<
      "query",
      "public",
      { courseId?: Id<"courses">; userId: string },
      any
    >;
    getUserEvents: FunctionReference<
      "query",
      "public",
      { eventType?: string; limit?: number; userId: string },
      any
    >;
    getVideoAnalytics: FunctionReference<
      "query",
      "public",
      { chapterId: string; courseId?: Id<"courses"> },
      any
    >;
    kpis: {
      getKPIs: FunctionReference<
        "query",
        "public",
        { endTime: number; startTime: number; storeId?: string },
        {
          creatorActivationRate: number;
          emailHealth: {
            bounceRate: number;
            bounced: number;
            delivered: number;
            sent: number;
          };
          learnerActivationRate: number;
          newCreatorSignups: number;
          newSignups: number;
          totalRevenue: number;
          traffic: {
            direct: number;
            email: number;
            instagram: number;
            tiktok: number;
            total: number;
          };
        }
      >;
      getQuickStats: FunctionReference<
        "query",
        "public",
        { storeId?: string },
        {
          activeCampaigns: number;
          totalCourses: number;
          totalRevenue: number;
          totalUsers: number;
        }
      >;
    };
    trackEvent: FunctionReference<
      "mutation",
      "public",
      {
        browserInfo?: string;
        chapterId?: string;
        courseId?: Id<"courses">;
        deviceType?: string;
        eventType:
          | "course_viewed"
          | "course_enrolled"
          | "chapter_started"
          | "chapter_completed"
          | "course_completed"
          | "video_played"
          | "video_paused"
          | "video_progress"
          | "checkout_started"
          | "purchase_completed"
          | "refund_requested"
          | "question_asked"
          | "answer_posted"
          | "comment_posted"
          | "content_liked"
          | "certificate_shared"
          | "course_reviewed"
          | "login"
          | "logout"
          | "profile_updated";
        metadata?: any;
        productId?: Id<"digitalProducts">;
        sessionId?: string;
        userId: string;
      },
      { success: boolean }
    >;
    trackVideoAnalytics: FunctionReference<
      "mutation",
      "public",
      {
        chapterId: string;
        completedWatch: boolean;
        courseId: Id<"courses">;
        dropOffPoint?: number;
        percentWatched: number;
        playbackSpeed?: number;
        qualitySetting?: string;
        rewatches: number;
        sessionId?: string;
        userId: string;
        videoDuration: number;
        watchDuration: number;
      },
      { success: boolean }
    >;
    updateLearningStreak: FunctionReference<
      "mutation",
      "public",
      { userId: string },
      { currentStreak: number; longestStreak: number; totalDaysActive: number }
    >;
  };
  analyticsTracking: {
    trackEvent: FunctionReference<
      "mutation",
      "public",
      {
        eventType:
          | "page_view"
          | "product_view"
          | "course_view"
          | "purchase"
          | "download"
          | "video_play"
          | "video_complete"
          | "lesson_complete"
          | "course_complete"
          | "search"
          | "click"
          | "signup"
          | "login"
          | "creator_started"
          | "creator_profile_completed"
          | "creator_published"
          | "first_sale"
          | "enrollment"
          | "return_week_2"
          | "email_sent"
          | "email_delivered"
          | "email_opened"
          | "email_clicked"
          | "email_bounced"
          | "email_complained"
          | "dm_sent"
          | "cta_clicked"
          | "campaign_view"
          | "error"
          | "webhook_failed";
        ipAddress?: string;
        metadata?: {
          amount_cents?: number;
          audience_size?: number;
          browser?: string;
          campaign_id?: string;
          city?: string;
          country?: string;
          currency?: string;
          daw?: string;
          device?: string;
          duration?: number;
          error_code?: string;
          error_message?: string;
          experiment_id?: string;
          os?: string;
          page?: string;
          product_id?: string;
          progress?: number;
          referrer?: string;
          searchTerm?: string;
          source?: string;
          utm_campaign?: string;
          utm_medium?: string;
          utm_source?: string;
          value?: number;
          variant?: string;
        };
        resourceId?: string;
        resourceType?:
          | "course"
          | "digitalProduct"
          | "lesson"
          | "chapter"
          | "page";
        sessionId?: string;
        storeId?: string;
        userAgent?: string;
        userId: string;
      },
      Id<"analyticsEvents">
    >;
    trackEventsBatch: FunctionReference<
      "mutation",
      "public",
      {
        events: Array<{
          eventType:
            | "page_view"
            | "product_view"
            | "course_view"
            | "purchase"
            | "download"
            | "video_play"
            | "video_complete"
            | "lesson_complete"
            | "course_complete"
            | "search"
            | "click"
            | "signup"
            | "login"
            | "creator_started"
            | "creator_profile_completed"
            | "creator_published"
            | "first_sale"
            | "enrollment"
            | "return_week_2"
            | "email_sent"
            | "email_delivered"
            | "email_opened"
            | "email_clicked"
            | "email_bounced"
            | "email_complained"
            | "dm_sent"
            | "cta_clicked"
            | "campaign_view"
            | "error"
            | "webhook_failed";
          ipAddress?: string;
          metadata?: {
            amount_cents?: number;
            audience_size?: number;
            browser?: string;
            campaign_id?: string;
            city?: string;
            country?: string;
            currency?: string;
            daw?: string;
            device?: string;
            duration?: number;
            error_code?: string;
            error_message?: string;
            experiment_id?: string;
            os?: string;
            page?: string;
            product_id?: string;
            progress?: number;
            referrer?: string;
            searchTerm?: string;
            source?: string;
            utm_campaign?: string;
            utm_medium?: string;
            utm_source?: string;
            value?: number;
            variant?: string;
          };
          resourceId?: string;
          resourceType?:
            | "course"
            | "digitalProduct"
            | "lesson"
            | "chapter"
            | "page";
          sessionId?: string;
          storeId?: string;
          userAgent?: string;
          userId: string;
        }>;
      },
      Array<Id<"analyticsEvents">>
    >;
    trackProductView: FunctionReference<
      "mutation",
      "public",
      {
        country?: string;
        device?: string;
        referrer?: string;
        resourceId: string;
        resourceType: "course" | "digitalProduct";
        sessionId?: string;
        storeId: string;
        userId?: string;
        viewDuration?: number;
      },
      Id<"productViews">
    >;
    trackRevenue: FunctionReference<
      "mutation",
      "public",
      {
        country?: string;
        creatorId: string;
        currency: string;
        grossAmount: number;
        netAmount: number;
        paymentMethod?: string;
        platformFee: number;
        processingFee: number;
        purchaseId: Id<"purchases">;
        resourceId: string;
        resourceType: "course" | "digitalProduct" | "coaching" | "bundle";
        storeId: string;
        userId: string;
      },
      Id<"revenueEvents">
    >;
    trackSession: FunctionReference<
      "mutation",
      "public",
      {
        browser?: string;
        city?: string;
        country?: string;
        device?: string;
        endTime?: number;
        events?: number;
        exitPage?: string;
        landingPage?: string;
        os?: string;
        pageViews?: number;
        referrer?: string;
        sessionId: string;
        startTime?: number;
        storeId?: string;
        userId: string;
      },
      Id<"userSessions"> | null
    >;
  };
  audioGeneration: {
    generateAISample: FunctionReference<
      "action",
      "public",
      {
        category:
          | "drums"
          | "bass"
          | "synth"
          | "vocals"
          | "fx"
          | "melody"
          | "loops"
          | "one-shots";
        creditPrice: number;
        description: string;
        duration: number;
        genre: string;
        licenseType: "royalty-free" | "exclusive" | "commercial";
        storeId: string;
        tags: Array<string>;
        title: string;
        userId: string;
      },
      any
    >;
    generateTextToSoundEffect: FunctionReference<
      "action",
      "public",
      { description: string; duration: number },
      {
        audioUrl?: string;
        error?: string;
        filePath?: string;
        fileSize?: number;
        format?: string;
        storageId?: string;
        success: boolean;
      }
    >;
    getAudioGenerationStatus: FunctionReference<
      "query",
      "public",
      { chapterId: Id<"courseChapters"> },
      {
        audioUrl?: string;
        error?: string;
        generatedAt?: number;
        status: "pending" | "generating" | "completed" | "failed";
      } | null
    >;
    saveGeneratedAudioToChapter: FunctionReference<
      "mutation",
      "public",
      {
        audioData?: string;
        audioUrl?: string;
        chapterId: Id<"courseChapters">;
        metadata: {
          audioSize?: number;
          estimatedDuration?: number;
          isBase64Fallback?: boolean;
          isSimulated?: boolean;
          voiceName: string;
          wordCount?: number;
        };
      },
      { error?: string; success: boolean }
    >;
    saveSampleToMarketplace: FunctionReference<
      "action",
      "public",
      {
        audioUrl: string;
        category:
          | "drums"
          | "bass"
          | "synth"
          | "vocals"
          | "fx"
          | "melody"
          | "loops"
          | "one-shots";
        creditPrice: number;
        description: string;
        duration: number;
        fileSize: number;
        format: string;
        genre: string;
        licenseType: "royalty-free" | "exclusive" | "commercial";
        storageId: Id<"_storage">;
        storeId: string;
        tags: Array<string>;
        title: string;
        userId: string;
      },
      any
    >;
    startAudioGeneration: FunctionReference<
      "mutation",
      "public",
      { chapterId: Id<"courseChapters"> },
      { message: string; success: boolean }
    >;
    startVideoGeneration: FunctionReference<
      "mutation",
      "public",
      { chapterId: Id<"courseChapters"> },
      { message: string; success: boolean }
    >;
  };
  automation: {
    createAutomationFlow: FunctionReference<
      "mutation",
      "public",
      {
        description?: string;
        flowDefinition: {
          connections: Array<{ from: string; label?: string; to: string }>;
          nodes: Array<{
            data: {
              conditionType?:
                | "keyword"
                | "user_response"
                | "time_based"
                | "tag_based";
              conditionValue?: string;
              content?: string;
              delayMinutes?: number;
              mediaUrls?: Array<string>;
              resourceId?: string;
              resourceType?: "link" | "file" | "course" | "product";
              resourceUrl?: string;
              tagName?: string;
              webhookData?: any;
              webhookUrl?: string;
            };
            id: string;
            position: { x: number; y: number };
            type:
              | "trigger"
              | "message"
              | "delay"
              | "condition"
              | "resource"
              | "tag"
              | "webhook";
          }>;
        };
        name: string;
        settings?: {
          allowMultipleRuns?: boolean;
          stopOnError?: boolean;
          timeoutMinutes?: number;
        };
        storeId: string;
        triggerConditions: {
          keywords?: Array<string>;
          matchType: "exact" | "contains" | "starts_with" | "regex";
          platforms: Array<
            "instagram" | "twitter" | "facebook" | "tiktok" | "linkedin"
          >;
          socialAccountIds?: Array<Id<"socialAccounts">>;
        };
        triggerType:
          | "keyword"
          | "comment"
          | "dm"
          | "mention"
          | "hashtag"
          | "manual";
        userId: string;
      },
      Id<"automationFlows">
    >;
    createSocialWebhook: FunctionReference<
      "mutation",
      "public",
      {
        eventType: string;
        payload: any;
        platform: "instagram" | "twitter" | "facebook" | "tiktok" | "linkedin";
        scheduledPostId?: Id<"scheduledPosts">;
        signature?: string;
        socialAccountId?: Id<"socialAccounts">;
      },
      Id<"socialWebhooks">
    >;
    deleteAutomationFlow: FunctionReference<
      "mutation",
      "public",
      { flowId: Id<"automationFlows">; userId: string },
      null
    >;
    getAutomationFlow: FunctionReference<
      "query",
      "public",
      { flowId: Id<"automationFlows">; userId: string },
      any | null
    >;
    getAutomationFlows: FunctionReference<
      "query",
      "public",
      { isActive?: boolean; storeId: string; userId: string },
      Array<any>
    >;
    processSocialWebhookForAutomation: FunctionReference<
      "action",
      "public",
      { webhookId: Id<"socialWebhooks"> },
      null
    >;
    testAutomationTrigger: FunctionReference<
      "mutation",
      "public",
      {
        flowId: Id<"automationFlows">;
        testData: {
          content: string;
          platform:
            | "instagram"
            | "twitter"
            | "facebook"
            | "tiktok"
            | "linkedin";
          platformUserId: string;
          platformUsername?: string;
        };
        userId: string;
      },
      null
    >;
    toggleAutomationFlow: FunctionReference<
      "mutation",
      "public",
      { flowId: Id<"automationFlows">; isActive: boolean; userId: string },
      null
    >;
    updateAutomationFlow: FunctionReference<
      "mutation",
      "public",
      {
        description?: string;
        flowDefinition?: {
          connections: Array<{ from: string; label?: string; to: string }>;
          nodes: Array<{
            data: {
              conditionType?:
                | "keyword"
                | "user_response"
                | "time_based"
                | "tag_based";
              conditionValue?: string;
              content?: string;
              delayMinutes?: number;
              mediaUrls?: Array<string>;
              resourceId?: string;
              resourceType?: "link" | "file" | "course" | "product";
              resourceUrl?: string;
              tagName?: string;
              webhookData?: any;
              webhookUrl?: string;
            };
            id: string;
            position: { x: number; y: number };
            type:
              | "trigger"
              | "message"
              | "delay"
              | "condition"
              | "resource"
              | "tag"
              | "webhook";
          }>;
        };
        flowId: Id<"automationFlows">;
        name?: string;
        settings?: {
          allowMultipleRuns?: boolean;
          stopOnError?: boolean;
          timeoutMinutes?: number;
        };
        triggerConditions?: {
          keywords?: Array<string>;
          matchType: "exact" | "contains" | "starts_with" | "regex";
          platforms: Array<
            "instagram" | "twitter" | "facebook" | "tiktok" | "linkedin"
          >;
          socialAccountIds?: Array<Id<"socialAccounts">>;
        };
        userId: string;
      },
      null
    >;
  };
  automations: {
    addKeyword: FunctionReference<
      "mutation",
      "public",
      { automationId: Id<"automations">; keyword: string },
      { data: any | null; status: number }
    >;
    createAutomation: FunctionReference<
      "mutation",
      "public",
      { automationId?: string; clerkId: string; name?: string },
      { data: any | null; status: number }
    >;
    deleteAutomation: FunctionReference<
      "mutation",
      "public",
      { automationId: Id<"automations">; clerkId: string },
      { message: string; status: number }
    >;
    deleteKeyword: FunctionReference<
      "mutation",
      "public",
      { keywordId: Id<"keywords"> },
      { message: string; status: number }
    >;
    findAutomationByKeyword: FunctionReference<
      "query",
      "public",
      { keyword: string },
      any | null
    >;
    getAutomationById: FunctionReference<
      "query",
      "public",
      { automationId: Id<"automations"> },
      any | null
    >;
    getChatHistory: FunctionReference<
      "query",
      "public",
      { automationId: Id<"automations">; instagramUserId: string },
      Array<any>
    >;
    getUserAutomations: FunctionReference<
      "query",
      "public",
      { clerkId: string },
      Array<any>
    >;
    saveListener: FunctionReference<
      "mutation",
      "public",
      {
        automationId: Id<"automations">;
        listenerType: "MESSAGE" | "SMART_AI";
        prompt?: string;
        reply?: string;
      },
      { message: string; status: number }
    >;
    savePosts: FunctionReference<
      "mutation",
      "public",
      {
        automationId: Id<"automations">;
        posts: Array<{
          caption?: string;
          media: string;
          mediaType: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | "GLOBAL";
          postId: string;
        }>;
      },
      { message: string; status: number }
    >;
    saveTrigger: FunctionReference<
      "mutation",
      "public",
      { automationId: Id<"automations">; types: Array<"COMMENT" | "DM"> },
      { message: string; status: number }
    >;
    updateAutomation: FunctionReference<
      "mutation",
      "public",
      {
        active?: boolean;
        automationId: Id<"automations">;
        instagramAccountId?: string;
        name?: string;
      },
      { message: string; status: number }
    >;
  };
  automationTriggers: {
    createCustomEvent: FunctionReference<
      "mutation",
      "public",
      { description?: string; eventName: string; storeId: string },
      any
    >;
    createWebhookEndpoint: FunctionReference<
      "mutation",
      "public",
      {
        description?: string;
        name: string;
        rateLimitPerMinute?: number;
        storeId: string;
        workflowId?: Id<"emailWorkflows">;
      },
      any
    >;
    deleteCustomEvent: FunctionReference<
      "mutation",
      "public",
      { eventId: Id<"customEvents"> },
      any
    >;
    deleteWebhookEndpoint: FunctionReference<
      "mutation",
      "public",
      { webhookId: Id<"webhookEndpoints"> },
      any
    >;
    fireCustomEvent: FunctionReference<
      "mutation",
      "public",
      {
        contactEmail?: string;
        contactId?: Id<"emailContacts">;
        eventData?: any;
        eventName: string;
        source?: string;
        storeId: string;
      },
      any
    >;
    getAbandonedCarts: FunctionReference<
      "query",
      "public",
      { limit?: number; recoveredOnly?: boolean; storeId: string },
      any
    >;
    getCartAbandonStats: FunctionReference<
      "query",
      "public",
      { daysBack?: number; storeId: string },
      any
    >;
    getCustomEventLogs: FunctionReference<
      "query",
      "public",
      { eventId: Id<"customEvents">; limit?: number },
      any
    >;
    getCustomEvents: FunctionReference<
      "query",
      "public",
      { storeId: string },
      any
    >;
    getPageVisitAnalytics: FunctionReference<
      "query",
      "public",
      { daysBack?: number; storeId: string },
      any
    >;
    getTriggerOverview: FunctionReference<
      "query",
      "public",
      { storeId: string },
      any
    >;
    getWebhookByKey: FunctionReference<
      "query",
      "public",
      { endpointKey: string },
      any
    >;
    getWebhookCallLogs: FunctionReference<
      "query",
      "public",
      { limit?: number; webhookEndpointId: Id<"webhookEndpoints"> },
      any
    >;
    getWebhookEndpoints: FunctionReference<
      "query",
      "public",
      { storeId: string },
      any
    >;
    markCartRecovered: FunctionReference<
      "mutation",
      "public",
      { cartId: Id<"cartAbandonEvents"> },
      any
    >;
    regenerateWebhookSecret: FunctionReference<
      "mutation",
      "public",
      { webhookId: Id<"webhookEndpoints"> },
      any
    >;
    trackCartAbandon: FunctionReference<
      "mutation",
      "public",
      {
        cartId?: string;
        cartItems?: Array<{
          price: number;
          productId: string;
          productName: string;
          quantity: number;
        }>;
        cartValue?: number;
        contactEmail: string;
        storeId: string;
      },
      any
    >;
    trackPageVisit: FunctionReference<
      "mutation",
      "public",
      {
        contactEmail?: string;
        contactId?: Id<"emailContacts">;
        pagePath: string;
        pageTitle?: string;
        pageUrl: string;
        referrer?: string;
        sessionId?: string;
        storeId: string;
        userAgent?: string;
      },
      any
    >;
    updateCustomEvent: FunctionReference<
      "mutation",
      "public",
      { description?: string; eventId: Id<"customEvents">; isActive?: boolean },
      any
    >;
    updateWebhookEndpoint: FunctionReference<
      "mutation",
      "public",
      {
        description?: string;
        isActive?: boolean;
        name?: string;
        rateLimitPerMinute?: number;
        webhookId: Id<"webhookEndpoints">;
        workflowId?: Id<"emailWorkflows">;
      },
      any
    >;
  };
  beatLeases: {
    checkUserBeatLicense: FunctionReference<
      "query",
      "public",
      {
        beatId: Id<"digitalProducts">;
        tierType?: "basic" | "premium" | "exclusive" | "unlimited";
        userId: string;
      },
      {
        hasLicense: boolean;
        licenses: Array<{
          _id: Id<"beatLicenses">;
          createdAt: number;
          tierName: string;
          tierType: "basic" | "premium" | "exclusive" | "unlimited";
        }>;
      }
    >;
    createBeatLicensePurchase: FunctionReference<
      "mutation",
      "public",
      {
        amount: number;
        beatId: Id<"digitalProducts">;
        buyerEmail: string;
        buyerName?: string;
        currency?: string;
        paymentMethod?: string;
        storeId: string;
        tierName: string;
        tierType: "basic" | "premium" | "exclusive" | "unlimited";
        transactionId?: string;
        userId: string;
      },
      { beatLicenseId: Id<"beatLicenses">; purchaseId: Id<"purchases"> }
    >;
    getBeatLicenseByPurchase: FunctionReference<
      "query",
      "public",
      { purchaseId: Id<"purchases"> },
      any
    >;
    getBeatLicenseTiers: FunctionReference<
      "query",
      "public",
      { beatId: Id<"digitalProducts"> },
      any
    >;
    getCreatorBeatSales: FunctionReference<
      "query",
      "public",
      { limit?: number; storeId: Id<"stores"> },
      any
    >;
    getUserBeatLicenses: FunctionReference<
      "query",
      "public",
      { userId: string },
      any
    >;
    isBeatAvailable: FunctionReference<
      "query",
      "public",
      { beatId: Id<"digitalProducts"> },
      { available: boolean; exclusiveSoldAt?: number }
    >;
    markContractGenerated: FunctionReference<
      "mutation",
      "public",
      { beatLicenseId: Id<"beatLicenses"> },
      any
    >;
  };
  blog: {
    createPost: FunctionReference<
      "mutation",
      "public",
      {
        authorAvatar?: string;
        authorId: string;
        authorName?: string;
        canonicalUrl?: string;
        category?: string;
        content: string;
        coverImage?: string;
        excerpt?: string;
        keywords?: Array<string>;
        metaDescription?: string;
        metaTitle?: string;
        readTimeMinutes?: number;
        slug: string;
        status: "draft" | "published" | "archived";
        storeId?: Id<"stores">;
        tags?: Array<string>;
        title: string;
      },
      { postId: Id<"blogPosts"> }
    >;
    deletePost: FunctionReference<
      "mutation",
      "public",
      { postId: Id<"blogPosts"> },
      null
    >;
    getCategories: FunctionReference<
      "query",
      "public",
      {},
      Array<{ count: number; name: string }>
    >;
    getPostById: FunctionReference<
      "query",
      "public",
      { postId: Id<"blogPosts"> },
      {
        _creationTime: number;
        _id: Id<"blogPosts">;
        authorAvatar?: string;
        authorId: string;
        authorName?: string;
        canonicalUrl?: string;
        category?: string;
        content: string;
        coverImage?: string;
        createdAt: number;
        excerpt?: string;
        keywords?: Array<string>;
        metaDescription?: string;
        metaTitle?: string;
        publishedAt?: number;
        readTimeMinutes?: number;
        scheduledFor?: number;
        slug: string;
        status: "draft" | "published" | "archived";
        storeId?: Id<"stores">;
        tags?: Array<string>;
        title: string;
        updatedAt: number;
        views?: number;
      } | null
    >;
    getPostBySlug: FunctionReference<
      "query",
      "public",
      { slug: string },
      {
        _creationTime: number;
        _id: Id<"blogPosts">;
        authorAvatar?: string;
        authorId: string;
        authorName?: string;
        canonicalUrl?: string;
        category?: string;
        content: string;
        coverImage?: string;
        createdAt: number;
        excerpt?: string;
        keywords?: Array<string>;
        metaDescription?: string;
        metaTitle?: string;
        publishedAt?: number;
        readTimeMinutes?: number;
        slug: string;
        status: "draft" | "published" | "archived";
        storeId?: Id<"stores">;
        tags?: Array<string>;
        title: string;
        updatedAt: number;
        views?: number;
      } | null
    >;
    getPostsByCreator: FunctionReference<
      "query",
      "public",
      { authorId: string; status?: "draft" | "published" | "archived" },
      Array<{
        _creationTime: number;
        _id: Id<"blogPosts">;
        category?: string;
        coverImage?: string;
        createdAt: number;
        excerpt?: string;
        publishedAt?: number;
        slug: string;
        status: "draft" | "published" | "archived";
        title: string;
        updatedAt: number;
        views?: number;
      }>
    >;
    getPublishedPosts: FunctionReference<
      "query",
      "public",
      { category?: string; limit?: number },
      Array<{
        _creationTime: number;
        _id: Id<"blogPosts">;
        authorAvatar?: string;
        authorId: string;
        authorName?: string;
        category?: string;
        coverImage?: string;
        createdAt: number;
        excerpt?: string;
        publishedAt?: number;
        readTimeMinutes?: number;
        slug: string;
        tags?: Array<string>;
        title: string;
        views?: number;
      }>
    >;
    incrementViews: FunctionReference<
      "mutation",
      "public",
      { postId: Id<"blogPosts"> },
      null
    >;
    updatePost: FunctionReference<
      "mutation",
      "public",
      {
        canonicalUrl?: string;
        category?: string;
        content?: string;
        coverImage?: string;
        excerpt?: string;
        keywords?: Array<string>;
        metaDescription?: string;
        metaTitle?: string;
        postId: Id<"blogPosts">;
        readTimeMinutes?: number;
        slug?: string;
        status?: "draft" | "published" | "archived";
        tags?: Array<string>;
        title?: string;
      },
      null
    >;
  };
  bundles: {
    createBundle: FunctionReference<
      "mutation",
      "public",
      {
        availableFrom?: number;
        availableUntil?: number;
        bundlePrice: number;
        bundleType: "course_bundle" | "mixed" | "product_bundle";
        courseIds?: Array<Id<"courses">>;
        creatorId: string;
        description: string;
        imageUrl?: string;
        maxPurchases?: number;
        name: string;
        productIds?: Array<Id<"digitalProducts">>;
        storeId: Id<"stores">;
      },
      any
    >;
    deleteBundle: FunctionReference<
      "mutation",
      "public",
      { bundleId: Id<"bundles"> },
      any
    >;
    getAllPublishedBundles: FunctionReference<
      "query",
      "public",
      {
        bundleType?: "course_bundle" | "mixed" | "product_bundle";
        searchQuery?: string;
      },
      any
    >;
    getBundleBySlug: FunctionReference<
      "query",
      "public",
      { slug: string },
      any
    >;
    getBundleDetails: FunctionReference<
      "query",
      "public",
      { bundleId: Id<"bundles"> },
      any
    >;
    getBundlesByStore: FunctionReference<
      "query",
      "public",
      { includeUnpublished?: boolean; storeId: Id<"stores"> },
      any
    >;
    getPublishedBundles: FunctionReference<
      "query",
      "public",
      { storeId: Id<"stores"> },
      any
    >;
    publishBundle: FunctionReference<
      "mutation",
      "public",
      { bundleId: Id<"bundles"> },
      any
    >;
    recordBundlePurchase: FunctionReference<
      "mutation",
      "public",
      { amount: number; bundleId: Id<"bundles"> },
      any
    >;
    unpublishBundle: FunctionReference<
      "mutation",
      "public",
      { bundleId: Id<"bundles"> },
      any
    >;
    updateBundle: FunctionReference<
      "mutation",
      "public",
      {
        availableFrom?: number;
        availableUntil?: number;
        bundleId: Id<"bundles">;
        bundlePrice?: number;
        courseIds?: Array<Id<"courses">>;
        description?: string;
        followGateEnabled?: boolean;
        followGateMessage?: string;
        followGateRequirements?: {
          minFollowsRequired?: number;
          requireEmail?: boolean;
          requireInstagram?: boolean;
          requireSpotify?: boolean;
          requireTiktok?: boolean;
          requireYoutube?: boolean;
        };
        followGateSocialLinks?: {
          instagram?: string;
          soundcloud?: string;
          spotify?: string;
          tiktok?: string;
          twitter?: string;
          youtube?: string;
        };
        imageUrl?: string;
        isActive?: boolean;
        maxPurchases?: number;
        name?: string;
        productIds?: Array<Id<"digitalProducts">>;
      },
      any
    >;
  };
  campaigns: {
    getMyCampaigns: FunctionReference<
      "query",
      "public",
      { userId: string },
      Array<{
        _id: Id<"campaigns">;
        clickedCount?: number;
        convertedCount?: number;
        createdAt: number;
        deliveredCount?: number;
        name: string;
        openedCount?: number;
        scheduledAt?: number;
        sentAt?: number;
        sentCount?: number;
        status: string;
        type: string;
      }>
    >;
  };
  certificates: {
    generateCertificate: FunctionReference<
      "mutation",
      "public",
      {
        completedChapters: number;
        completionPercentage: number;
        courseId: Id<"courses">;
        courseTitle: string;
        instructorId: string;
        instructorName: string;
        timeSpent?: number;
        totalChapters: number;
        userEmail: string;
        userId: string;
        userName: string;
      },
      {
        certificateId?: string;
        error?: string;
        success: boolean;
        verificationCode?: string;
      }
    >;
    getCertificateByCode: FunctionReference<
      "query",
      "public",
      { verificationCode: string },
      {
        _id: Id<"certificates">;
        certificateId: string;
        completionDate: number;
        completionPercentage: number;
        courseTitle: string;
        instructorName: string;
        isValid: boolean;
        issueDate: number;
        userId: string;
        userName: string;
        verificationCount: number;
      } | null
    >;
    getCertificateById: FunctionReference<
      "query",
      "public",
      { certificateId: string },
      {
        _id: Id<"certificates">;
        certificateId: string;
        completedChapters: number;
        completionDate: number;
        completionPercentage: number;
        courseId: Id<"courses">;
        courseTitle: string;
        instructorId: string;
        instructorName: string;
        isValid: boolean;
        issueDate: number;
        lastVerifiedAt?: number;
        totalChapters: number;
        userEmail: string;
        userId: string;
        userName: string;
        verificationCode: string;
        verificationCount: number;
      } | null
    >;
    getUserCertificates: FunctionReference<
      "query",
      "public",
      { userId: string },
      Array<{
        _id: Id<"certificates">;
        certificateId: string;
        completionDate: number;
        completionPercentage: number;
        courseId: Id<"courses">;
        courseTitle: string;
        instructorName: string;
        isValid: boolean;
        issueDate: number;
        pdfUrl?: string;
        userId: string;
        userName: string;
        verificationCode: string;
      }>
    >;
    hasCertificate: FunctionReference<
      "query",
      "public",
      { courseId: Id<"courses">; userId: string },
      { certificateId?: string; hasCertificate: boolean } | null
    >;
    revokeCertificate: FunctionReference<
      "mutation",
      "public",
      { certificateId: string; revokedBy: string },
      { error?: string; success: boolean }
    >;
    updateCertificatePdf: FunctionReference<
      "mutation",
      "public",
      { certificateId: string; pdfStorageId: Id<"_storage"> },
      { error?: string; success: boolean }
    >;
    verifyCertificate: FunctionReference<
      "mutation",
      "public",
      {
        certificateId: string;
        verifierIp?: string;
        verifierUserAgent?: string;
      },
      {
        certificate?: {
          completionDate: number;
          courseTitle: string;
          instructorName: string;
          issueDate: number;
          userName: string;
        };
        isValid: boolean;
      }
    >;
  };
  changelog: {
    createRelease: FunctionReference<
      "mutation",
      "public",
      {
        clerkId: string;
        description?: string;
        entryIds: Array<Id<"changelogEntries">>;
        publish?: boolean;
        title: string;
        version: string;
      },
      any
    >;
    deleteEntry: FunctionReference<
      "mutation",
      "public",
      { clerkId: string; entryId: Id<"changelogEntries"> },
      any
    >;
    getChangelogEntries: FunctionReference<
      "query",
      "public",
      {
        category?: "feature" | "improvement" | "fix" | "breaking" | "internal";
        clerkId: string;
        limit?: number;
        publishedOnly?: boolean;
      },
      any
    >;
    getChangelogStats: FunctionReference<
      "query",
      "public",
      { clerkId: string },
      any
    >;
    getGithubConfig: FunctionReference<
      "query",
      "public",
      { clerkId: string },
      any
    >;
    getReleases: FunctionReference<
      "query",
      "public",
      { clerkId: string; limit?: number },
      any
    >;
    saveCommitsAsEntries: FunctionReference<
      "mutation",
      "public",
      {
        clerkId: string;
        commits: Array<{
          authorAvatar?: string;
          authorEmail?: string;
          authorName: string;
          committedAt: number;
          message: string;
          sha: string;
          url: string;
        }>;
      },
      any
    >;
    saveGithubConfig: FunctionReference<
      "mutation",
      "public",
      { branch: string; clerkId: string; repository: string },
      any
    >;
    sendChangelogNotification: FunctionReference<
      "mutation",
      "public",
      {
        clerkId: string;
        entryIds: Array<Id<"changelogEntries">>;
        message: string;
        targetType: "all" | "students" | "creators";
        title: string;
      },
      any
    >;
    updateEntry: FunctionReference<
      "mutation",
      "public",
      {
        category?: "feature" | "improvement" | "fix" | "breaking" | "internal";
        clerkId: string;
        description?: string;
        entryId: Id<"changelogEntries">;
        isPublished?: boolean;
        title?: string;
      },
      any
    >;
  };
  changelogActions: {
    generateNotificationContent: FunctionReference<
      "action",
      "public",
      { clerkId: string; entryIds: Array<Id<"changelogEntries">> },
      { message: string; success: boolean; title: string }
    >;
  };
  clerkSync: {
    getSyncStats: FunctionReference<
      "query",
      "public",
      { clerkId?: string },
      { lastSyncTime?: number; syncStatus: string; totalInConvex: number }
    >;
    quickSyncClerkUsers: FunctionReference<
      "action",
      "public",
      { clerkId: string },
      {
        errors: Array<string>;
        success: boolean;
        totalClerkUsers: number;
        totalConvexUsers: number;
        usersAdded: number;
        usersUpdated: number;
      }
    >;
    syncClerkUsers: FunctionReference<
      "action",
      "public",
      { clerkId: string; clerkSecretKey: string },
      {
        errors: Array<string>;
        success: boolean;
        totalClerkUsers: number;
        totalConvexUsers: number;
        usersAdded: number;
        usersUpdated: number;
      }
    >;
  };
  coachingProducts: {
    backfillCoachingSlugs: FunctionReference<
      "mutation",
      "public",
      {},
      { skipped: number; updated: number }
    >;
    bookCoachingSession: FunctionReference<
      "mutation",
      "public",
      {
        customFieldResponses?: any;
        notes?: string;
        productId: Id<"digitalProducts">;
        scheduledDate: number;
        startTime: string;
        studentId: string;
      },
      {
        error?: string;
        requiresDiscordAuth?: boolean;
        sessionId?: Id<"coachingSessions">;
        success: boolean;
      }
    >;
    checkUserDiscordConnection: FunctionReference<
      "query",
      "public",
      { userId: string },
      {
        discordUsername?: string;
        guildMemberStatus?: string;
        isConnected: boolean;
      }
    >;
    createCoachingProduct: FunctionReference<
      "mutation",
      "public",
      {
        availability?: any;
        customFields?: any;
        description?: string;
        duration: number;
        imageUrl?: string;
        price: number;
        sessionType: string;
        storeId: string;
        thumbnailStyle?: string;
        title: string;
        userId: string;
      },
      { error?: string; productId?: Id<"digitalProducts">; success: boolean }
    >;
    deleteCoachingSession: FunctionReference<
      "mutation",
      "public",
      { sessionId: Id<"coachingSessions"> },
      { error?: string; success: boolean }
    >;
    getAvailableSlots: FunctionReference<
      "query",
      "public",
      { date: number; productId: Id<"digitalProducts"> },
      Array<{ available: boolean; end: string; start: string }>
    >;
    getBookedSessions: FunctionReference<
      "query",
      "public",
      { endDate: number; productId: Id<"digitalProducts">; startDate: number },
      Array<{ date: number; endTime: string; startTime: string }>
    >;
    getCoachingProductByGlobalSlug: FunctionReference<
      "query",
      "public",
      { slug: string },
      {
        _id: Id<"digitalProducts">;
        availability?: any;
        deliverables?: string;
        description?: string;
        discordRequired?: boolean;
        duration?: number;
        imageUrl?: string;
        price: number;
        pricingModel?: string;
        sessionType?: string;
        slug?: string;
        storeId: string;
        title: string;
        userId: string;
      } | null
    >;
    getCoachingProductById: FunctionReference<
      "query",
      "public",
      { productId: Id<"digitalProducts"> },
      {
        _creationTime: number;
        _id: Id<"digitalProducts">;
        availability?: any;
        customFields?: any;
        description?: string;
        discordRoleId?: string;
        duration?: number;
        imageUrl?: string;
        isPublished?: boolean;
        price: number;
        sessionType?: string;
        storeId: string;
        title: string;
        userId: string;
      } | null
    >;
    getCoachingProductBySlug: FunctionReference<
      "query",
      "public",
      { slug: string; storeId: string },
      {
        _id: Id<"digitalProducts">;
        availability?: any;
        deliverables?: string;
        description?: string;
        discordRequired?: boolean;
        duration?: number;
        imageUrl?: string;
        price: number;
        pricingModel?: string;
        sessionType?: string;
        slug?: string;
        storeId: string;
        title: string;
        userId: string;
      } | null
    >;
    getCoachingProductForBooking: FunctionReference<
      "query",
      "public",
      { productId: Id<"digitalProducts"> },
      {
        _id: Id<"digitalProducts">;
        availability?: any;
        deliverables?: string;
        description?: string;
        discordRequired?: boolean;
        duration?: number;
        imageUrl?: string;
        price: number;
        pricingModel?: string;
        sessionType?: string;
        slug?: string;
        storeId: string;
        title: string;
        userId: string;
      } | null
    >;
    getCoachingProductsByCoach: FunctionReference<
      "query",
      "public",
      { coachId: string },
      Array<{
        _creationTime: number;
        _id: Id<"digitalProducts">;
        description?: string;
        duration?: number;
        imageUrl?: string;
        isPublished?: boolean;
        price: number;
        sessionType?: string;
        storeId: string;
        title: string;
      }>
    >;
    getCoachingProductsByStore: FunctionReference<
      "query",
      "public",
      { storeId: string },
      Array<{
        _creationTime: number;
        _id: Id<"digitalProducts">;
        availability?: any;
        customFields?: any;
        description?: string;
        discordRoleId?: string;
        duration?: number;
        imageUrl?: string;
        isPublished?: boolean;
        price: number;
        sessionType?: string;
        storeId: string;
        title: string;
        userId: string;
      }>
    >;
    getCoachSessions: FunctionReference<
      "query",
      "public",
      { coachId: string; status?: string },
      Array<{
        _creationTime: number;
        _id: Id<"coachingSessions">;
        discordSetupComplete?: boolean;
        duration: number;
        endTime: string;
        notes?: string;
        productId: Id<"digitalProducts">;
        productTitle: string;
        scheduledDate: number;
        startTime: string;
        status: string;
        studentEmail?: string;
        studentId: string;
        studentName?: string;
        totalCost: number;
      }>
    >;
    getCoachSessionStats: FunctionReference<
      "query",
      "public",
      { coachId: string },
      {
        cancelled: number;
        completed: number;
        revenue: number;
        total: number;
        upcoming: number;
      }
    >;
    getPublishedCoachingProductsByStore: FunctionReference<
      "query",
      "public",
      { storeId: string },
      Array<{
        _creationTime: number;
        _id: Id<"digitalProducts">;
        description?: string;
        duration?: number;
        imageUrl?: string;
        price: number;
        sessionType?: string;
        storeId: string;
        title: string;
        userId: string;
      }>
    >;
    getStudentSessions: FunctionReference<
      "query",
      "public",
      { studentId: string },
      Array<{
        _creationTime: number;
        _id: Id<"coachingSessions">;
        coachId: string;
        coachName?: string;
        discordChannelId?: string;
        duration: number;
        endTime: string;
        notes?: string;
        productId: Id<"digitalProducts">;
        productTitle: string;
        scheduledDate: number;
        startTime: string;
        status: string;
        storeName?: string;
        storeSlug?: string;
        totalCost: number;
      }>
    >;
    publishCoachingProduct: FunctionReference<
      "mutation",
      "public",
      { productId: Id<"digitalProducts"> },
      { error?: string; success: boolean }
    >;
    unpublishCoachingProduct: FunctionReference<
      "mutation",
      "public",
      { productId: Id<"digitalProducts"> },
      { error?: string; success: boolean }
    >;
    updateCoachingProduct: FunctionReference<
      "mutation",
      "public",
      {
        availability?: any;
        customFields?: any;
        description?: string;
        discordRoleId?: string;
        duration?: number;
        imageUrl?: string;
        isPublished?: boolean;
        price?: number;
        productId: Id<"digitalProducts">;
        sessionType?: string;
        thumbnailStyle?: string;
        title?: string;
      },
      { error?: string; success: boolean }
    >;
    updateSessionStatus: FunctionReference<
      "mutation",
      "public",
      {
        notes?: string;
        sessionId: Id<"coachingSessions">;
        status:
          | "SCHEDULED"
          | "IN_PROGRESS"
          | "COMPLETED"
          | "CANCELLED"
          | "NO_SHOW";
      },
      { error?: string; success: boolean }
    >;
  };
  coachingSessionQueries: {
    getSessionsNeedingReminders: FunctionReference<
      "query",
      "public",
      {},
      Array<{
        _id: Id<"coachingSessions">;
        coachId: string;
        duration: number;
        endTime: string;
        productId: Id<"digitalProducts">;
        reminderSent?: boolean;
        scheduledDate: number;
        startTime: string;
        studentId: string;
        totalCost: number;
      }>
    >;
    markReminderSent: FunctionReference<
      "mutation",
      "public",
      { sessionId: Id<"coachingSessions"> },
      null
    >;
  };
  collaborativeNotes: {
    createNote: FunctionReference<
      "mutation",
      "public",
      {
        chapterId: Id<"courseChapters">;
        content: string;
        courseId: Id<"courses">;
        isPublic?: boolean;
        timestamp: number;
        userId: string;
      },
      { _id: Id<"courseNotes">; success: boolean }
    >;
    deleteNote: FunctionReference<
      "mutation",
      "public",
      { noteId: Id<"courseNotes">; userId: string },
      { success: boolean }
    >;
    getChapterNotes: FunctionReference<
      "query",
      "public",
      {
        chapterId: Id<"courseChapters">;
        includePublic?: boolean;
        userId: string;
      },
      Array<{
        _creationTime: number;
        _id: Id<"courseNotes">;
        chapterId: Id<"courseChapters">;
        content: string;
        courseId: Id<"courses">;
        createdAt: number;
        isOwner: boolean;
        isPublic: boolean;
        timestamp: number;
        updatedAt: number;
        userAvatar?: string;
        userId: string;
        userName?: string;
      }>
    >;
    getNotesAtTimestamp: FunctionReference<
      "query",
      "public",
      {
        chapterId: Id<"courseChapters">;
        includePublic?: boolean;
        timeWindow?: number;
        timestamp: number;
        userId: string;
      },
      Array<{
        _id: Id<"courseNotes">;
        content: string;
        isOwner: boolean;
        isPublic: boolean;
        timestamp: number;
        userAvatar?: string;
        userId: string;
        userName?: string;
      }>
    >;
    toggleNoteVisibility: FunctionReference<
      "mutation",
      "public",
      { noteId: Id<"courseNotes">; userId: string },
      { isPublic: boolean; success: boolean }
    >;
    updateNote: FunctionReference<
      "mutation",
      "public",
      { content: string; isPublic?: boolean; noteId: Id<"courseNotes"> },
      { success: boolean }
    >;
  };
  contentGeneration: {
    generateCourseFromContent: FunctionReference<
      "action",
      "public",
      {
        category: string;
        courseDescription: string;
        courseTitle: string;
        numberOfModules?: number;
        similarCourseIds?: Array<Id<"courses">>;
        skillLevel: "Beginner" | "Intermediate" | "Advanced";
        subcategory?: string;
        userId: string;
      },
      {
        error?: string;
        outline?: {
          modules: Array<{
            description: string;
            lessons: Array<{
              description: string;
              keyPoints: Array<string>;
              title: string;
            }>;
            title: string;
          }>;
        };
        success: boolean;
      }
    >;
    generateLandingPageCopy: FunctionReference<
      "action",
      "public",
      { courseId: Id<"courses">; userId: string },
      {
        copy?: {
          headline: string;
          keyBenefits: Array<string>;
          subheadline: string;
          transformationStatement: string;
          urgencyStatement: string;
          whatYouWillLearn: Array<string>;
          whoIsThisFor: Array<string>;
        };
        error?: string;
        success: boolean;
      }
    >;
    generateViralVideoScript: FunctionReference<
      "action",
      "public",
      {
        courseIds?: Array<Id<"courses">>;
        platform:
          | "tiktok"
          | "youtube-short"
          | "instagram-reel"
          | "youtube-long";
        targetAudience?: string;
        tone?: "educational" | "entertaining" | "motivational" | "storytelling";
        topic: string;
        userId: string;
      },
      {
        cta?: string;
        error?: string;
        estimatedDuration?: string;
        hook?: string;
        mainPoints?: Array<string>;
        script?: string;
        success: boolean;
      }
    >;
  };
  conversionNudges: {
    dismissNudge: FunctionReference<
      "mutation",
      "public",
      { nudgeId: Id<"userNudges">; userId: string },
      any
    >;
    getActiveNudges: FunctionReference<
      "query",
      "public",
      { userId: string },
      any
    >;
    getCreatorProfileViewNudge: FunctionReference<
      "query",
      "public",
      { userId: string },
      any
    >;
    getPriorityNudge: FunctionReference<
      "query",
      "public",
      { userId: string },
      any
    >;
    markNudgeConverted: FunctionReference<
      "mutation",
      "public",
      { nudgeContext: string; userId: string },
      any
    >;
    markNudgeShown: FunctionReference<
      "mutation",
      "public",
      { nudgeId: Id<"userNudges">; userId: string },
      any
    >;
    trackCreatorProfileView: FunctionReference<
      "mutation",
      "public",
      { creatorId: string; storeId?: Id<"stores">; userId: string },
      any
    >;
    trackLeaderboardVisit: FunctionReference<
      "mutation",
      "public",
      { leaderboardType?: string; userId: string },
      any
    >;
  };
  copyright: {
    getCopyrightReports: FunctionReference<
      "query",
      "public",
      {
        clerkId?: string;
        status?:
          | "pending"
          | "reviewed"
          | "resolved"
          | "dismissed"
          | "counter_notice";
      },
      Array<any>
    >;
    getStoreCopyrightClaims: FunctionReference<
      "query",
      "public",
      { storeId: Id<"stores"> },
      Array<any>
    >;
    getStoreStrikeStatus: FunctionReference<
      "query",
      "public",
      { storeId: Id<"stores"> },
      { isSuspended: boolean; strikeHistory: Array<any>; strikes: number }
    >;
    issueCopyrightStrike: FunctionReference<
      "mutation",
      "public",
      {
        clerkId: string;
        reason: string;
        reportId: Id<"reports">;
        storeId: Id<"stores">;
      },
      { success: boolean; suspended: boolean; totalStrikes: number }
    >;
    submitCopyrightClaim: FunctionReference<
      "mutation",
      "public",
      {
        accuracyStatement: boolean;
        claimantAddress?: string;
        claimantEmail: string;
        claimantName: string;
        claimantPhone?: string;
        contentId: string;
        contentTitle: string;
        contentType: "sample" | "product" | "course";
        digitalSignature: string;
        goodFaithStatement: boolean;
        infringementDescription: string;
        originalWorkDescription: string;
        originalWorkUrl?: string;
        reportedUserName?: string;
        storeId?: string;
      },
      Id<"reports">
    >;
    submitCounterNotice: FunctionReference<
      "mutation",
      "public",
      {
        consentToJurisdiction: boolean;
        digitalSignature: string;
        explanation: string;
        reportId: Id<"reports">;
        respondentAddress: string;
        respondentEmail: string;
        respondentName: string;
        statementOfGoodFaith: boolean;
      },
      null
    >;
    takedownContent: FunctionReference<
      "mutation",
      "public",
      { clerkId: string; reason?: string; reportId: Id<"reports"> },
      { message: string; success: boolean }
    >;
  };
  coupons: {
    applyCoupon: FunctionReference<
      "mutation",
      "public",
      {
        couponId: Id<"coupons">;
        discountApplied: number;
        orderId?: string;
        userId: string;
      },
      any
    >;
    bulkCreateCoupons: FunctionReference<
      "mutation",
      "public",
      {
        applicableTo: "all" | "courses" | "products" | "subscriptions";
        count: number;
        creatorId: string;
        currency?: string;
        discountType: "percentage" | "fixed_amount";
        discountValue: number;
        maxUsesPerCoupon?: number;
        prefix: string;
        storeId: Id<"stores">;
        validFrom: number;
        validUntil?: number;
      },
      any
    >;
    createCoupon: FunctionReference<
      "mutation",
      "public",
      {
        applicableTo:
          | "all"
          | "courses"
          | "products"
          | "subscriptions"
          | "specific_items";
        code: string;
        creatorId: string;
        currency?: string;
        discountType: "percentage" | "fixed_amount";
        discountValue: number;
        firstTimeOnly?: boolean;
        maxUses?: number;
        maxUsesPerUser?: number;
        minPurchaseAmount?: number;
        specificCourseIds?: Array<Id<"courses">>;
        specificPlanIds?: Array<Id<"subscriptionPlans">>;
        specificProductIds?: Array<Id<"digitalProducts">>;
        stackable?: boolean;
        storeId: Id<"stores">;
        validFrom: number;
        validUntil?: number;
      },
      any
    >;
    deactivateCoupon: FunctionReference<
      "mutation",
      "public",
      { couponId: Id<"coupons"> },
      any
    >;
    deleteCoupon: FunctionReference<
      "mutation",
      "public",
      { couponId: Id<"coupons"> },
      any
    >;
    getCouponDetails: FunctionReference<
      "query",
      "public",
      { couponId: Id<"coupons"> },
      any
    >;
    getCouponsByStore: FunctionReference<
      "query",
      "public",
      { includeInactive?: boolean; storeId: Id<"stores"> },
      any
    >;
    getUserCouponUsages: FunctionReference<
      "query",
      "public",
      { userId: string },
      any
    >;
    updateCoupon: FunctionReference<
      "mutation",
      "public",
      {
        couponId: Id<"coupons">;
        discountValue?: number;
        isActive?: boolean;
        maxUses?: number;
        maxUsesPerUser?: number;
        minPurchaseAmount?: number;
        stackable?: boolean;
        validUntil?: number;
      },
      any
    >;
    validateCoupon: FunctionReference<
      "query",
      "public",
      {
        code: string;
        itemId?: string;
        itemType?: "course" | "product" | "subscription";
        purchaseAmount?: number;
        userId: string;
      },
      any
    >;
  };
  courseAccess: {
    canAccessChapter: FunctionReference<
      "query",
      "public",
      { chapterId: string; courseId: Id<"courses">; userId?: string },
      {
        accessType: string;
        hasAccess: boolean;
        reason?: string;
        requiresFollowGate?: boolean;
      }
    >;
    canAccessCourse: FunctionReference<
      "query",
      "public",
      { courseId: Id<"courses">; userId?: string },
      {
        accessType: string;
        followGateConfig?: any;
        freeChaptersCount?: number;
        hasAccess: boolean;
        purchaseDate?: number;
        requiresFollowGate?: boolean;
        totalChapters?: number;
      }
    >;
    completeFollowGate: FunctionReference<
      "mutation",
      "public",
      {
        completedRequirements: {
          email?: boolean;
          instagram?: boolean;
          spotify?: boolean;
          tiktok?: boolean;
          youtube?: boolean;
        };
        courseId: Id<"courses">;
        email: string;
        name?: string;
        userId: string;
      },
      { alreadyCompleted?: boolean; error?: string; success: boolean }
    >;
    getAccessibleChapters: FunctionReference<
      "query",
      "public",
      { courseId: Id<"courses">; userId?: string },
      any
    >;
    validateFollowGateRequirements: FunctionReference<
      "query",
      "public",
      {
        completedRequirements: {
          email?: boolean;
          instagram?: boolean;
          spotify?: boolean;
          tiktok?: boolean;
          youtube?: boolean;
        };
        courseId: Id<"courses">;
      },
      {
        isValid: boolean;
        message?: string;
        missingRequirements: Array<string>;
        requirements?: any;
        socialLinks?: any;
      }
    >;
  };
  courseCycleAI: {
    generateAllCycleEmails: FunctionReference<
      "action",
      "public",
      {
        courseCycleConfigId: Id<"courseCycleConfigs">;
        generateSecondCycle?: boolean;
      },
      { coursesProcessed: number; emailsGenerated: number; success: boolean }
    >;
    regenerateCourseEmails: FunctionReference<
      "action",
      "public",
      {
        courseCycleConfigId: Id<"courseCycleConfigs">;
        courseId: Id<"courses">;
        cycleNumber?: number;
      },
      boolean
    >;
  };
  courseCycles: {
    createCourseCycleConfig: FunctionReference<
      "mutation",
      "public",
      {
        courseIds: Array<Id<"courses">>;
        courseTimings: Array<{
          courseId: Id<"courses">;
          engagementWaitDays?: number;
          minEngagementActions?: number;
          nurtureDelayDays: number;
          nurtureEmailCount: number;
          pitchDelayDays: number;
          pitchEmailCount: number;
          purchaseCheckDelayDays: number;
          timingMode: "fixed" | "engagement";
        }>;
        description?: string;
        differentContentOnSecondCycle: boolean;
        loopOnCompletion: boolean;
        name: string;
        storeId: string;
      },
      Id<"courseCycleConfigs">
    >;
    deleteCourseCycleConfig: FunctionReference<
      "mutation",
      "public",
      { configId: Id<"courseCycleConfigs"> },
      null
    >;
    deleteCourseEmails: FunctionReference<
      "mutation",
      "public",
      {
        courseCycleConfigId: Id<"courseCycleConfigs">;
        courseId: Id<"courses">;
      },
      number
    >;
    getAvailableCoursesForCycle: FunctionReference<
      "query",
      "public",
      { storeId: string },
      Array<any>
    >;
    getCourseCycleConfig: FunctionReference<
      "query",
      "public",
      { configId: Id<"courseCycleConfigs"> },
      any
    >;
    listCourseCycleConfigs: FunctionReference<
      "query",
      "public",
      { storeId: string },
      Array<any>
    >;
    listCycleEmails: FunctionReference<
      "query",
      "public",
      { courseCycleConfigId: Id<"courseCycleConfigs"> },
      Array<any>
    >;
    toggleCourseCycleActive: FunctionReference<
      "mutation",
      "public",
      { configId: Id<"courseCycleConfigs"> },
      boolean
    >;
    updateCourseCycleConfig: FunctionReference<
      "mutation",
      "public",
      {
        configId: Id<"courseCycleConfigs">;
        courseIds?: Array<Id<"courses">>;
        courseTimings?: Array<{
          courseId: Id<"courses">;
          engagementWaitDays?: number;
          minEngagementActions?: number;
          nurtureDelayDays: number;
          nurtureEmailCount: number;
          pitchDelayDays: number;
          pitchEmailCount: number;
          purchaseCheckDelayDays: number;
          timingMode: "fixed" | "engagement";
        }>;
        description?: string;
        differentContentOnSecondCycle?: boolean;
        isActive?: boolean;
        loopOnCompletion?: boolean;
        name?: string;
      },
      null
    >;
    updateCycleEmail: FunctionReference<
      "mutation",
      "public",
      {
        emailId: Id<"courseCycleEmails">;
        htmlContent?: string;
        subject?: string;
        textContent?: string;
      },
      null
    >;
  };
  courseDrip: {
    getCourseDripSettings: FunctionReference<
      "query",
      "public",
      { courseId: string },
      any
    >;
    getStudentDripAccess: FunctionReference<
      "query",
      "public",
      { courseId: Id<"courses">; userId: string },
      any
    >;
    grantFullAccess: FunctionReference<
      "mutation",
      "public",
      { courseId: Id<"courses">; reason?: string; userId: string },
      any
    >;
    initializeDripAccess: FunctionReference<
      "mutation",
      "public",
      { courseId: Id<"courses">; userId: string },
      any
    >;
    isModuleAccessible: FunctionReference<
      "query",
      "public",
      { moduleId: Id<"courseModules">; userId: string },
      any
    >;
    manuallyUnlockModule: FunctionReference<
      "mutation",
      "public",
      { moduleId: Id<"courseModules">; reason?: string; userId: string },
      any
    >;
    restoreDripSchedule: FunctionReference<
      "mutation",
      "public",
      { courseId: Id<"courses">; userId: string },
      any
    >;
    updateCourseDripSettings: FunctionReference<
      "mutation",
      "public",
      {
        courseId: string;
        modules: Array<{
          dripDaysAfterEnrollment?: number;
          dripEnabled: boolean;
          dripNotifyStudents?: boolean;
          dripSpecificDate?: number;
          dripType?:
            | "days_after_enrollment"
            | "specific_date"
            | "after_previous";
          moduleId: Id<"courseModules">;
        }>;
      },
      any
    >;
    updateModuleDripSettings: FunctionReference<
      "mutation",
      "public",
      {
        dripDaysAfterEnrollment?: number;
        dripEnabled: boolean;
        dripNotifyStudents?: boolean;
        dripSpecificDate?: number;
        dripType?: "days_after_enrollment" | "specific_date" | "after_previous";
        moduleId: Id<"courseModules">;
      },
      any
    >;
  };
  courseNotificationQueries: {
    detectCourseChanges: FunctionReference<
      "query",
      "public",
      { courseId: Id<"courses">; userId: string },
      {
        changes?: {
          newChapters: number;
          newLessons: number;
          newModules: number;
          newModulesList: Array<string>;
        };
        currentState: {
          modulesList: Array<string>;
          totalChapters: number;
          totalLessons: number;
          totalModules: number;
        };
        enrolledStudentCount: number;
        hasChanges: boolean;
        lastNotification?: {
          message: string;
          sentAt: number;
          snapshot: {
            totalChapters: number;
            totalLessons: number;
            totalModules: number;
          };
          title: string;
        };
      }
    >;
    getCourseNotificationHistory: FunctionReference<
      "query",
      "public",
      { courseId: Id<"courses">; userId: string },
      Array<{
        _id: Id<"courseNotifications">;
        changes: {
          modulesList?: Array<string>;
          newChapters: number;
          newLessons: number;
          newModules: number;
          updatedContent: boolean;
        };
        emailSent?: boolean;
        message: string;
        recipientCount: number;
        sentAt: number;
        title: string;
      }>
    >;
    getCourseNotificationStats: FunctionReference<
      "query",
      "public",
      { courseId: Id<"courses"> },
      {
        averageRecipients: number;
        lastSentAt?: number;
        totalRecipients: number;
        totalSent: number;
      }
    >;
    sendCourseUpdateNotification: FunctionReference<
      "mutation",
      "public",
      {
        courseId: Id<"courses">;
        emailPreview?: string;
        emailSubject?: string;
        message: string;
        sendEmail: boolean;
        title: string;
        userId: string;
      },
      {
        error?: string;
        notificationId?: Id<"courseNotifications">;
        recipientCount: number;
        success: boolean;
      }
    >;
  };
  courseNotifications: {
    generateNotificationCopy: FunctionReference<
      "action",
      "public",
      {
        changes: {
          newChapters: number;
          newLessons: number;
          newModules: number;
          newModulesList: Array<string>;
        };
        courseId: Id<"courses">;
        userId: string;
      },
      {
        copy?: {
          emailPreview: string;
          emailSubject: string;
          message: string;
          title: string;
        };
        error?: string;
        success: boolean;
      }
    >;
  };
  courseProgress: {
    getCourseProgress: FunctionReference<
      "query",
      "public",
      { courseId: Id<"courses">; userId: string },
      {
        completedChapters: number;
        completionPercentage: number;
        hasCertificate: boolean;
        isComplete: boolean;
        totalChapters: number;
        totalTimeSpent: number;
      }
    >;
    getUserCourseProgressList: FunctionReference<
      "query",
      "public",
      { userId: string },
      any
    >;
    markChapterComplete: FunctionReference<
      "mutation",
      "public",
      {
        chapterId: string;
        courseId: Id<"courses">;
        lessonId?: string;
        moduleId?: string;
        timeSpent?: number;
        userId: string;
      },
      any
    >;
    updateChapterTimeSpent: FunctionReference<
      "mutation",
      "public",
      {
        chapterId: string;
        courseId: Id<"courses">;
        timeSpent: number;
        userId: string;
      },
      any
    >;
  };
  courseReviews: {
    addInstructorResponse: FunctionReference<
      "mutation",
      "public",
      { instructorId: string; response: string; reviewId: Id<"courseReviews"> },
      any
    >;
    canUserReviewCourse: FunctionReference<
      "query",
      "public",
      { courseId: Id<"courses">; userId: string },
      {
        canReview: boolean;
        existingReviewId?: Id<"courseReviews">;
        reason?: string;
      }
    >;
    createReview: FunctionReference<
      "mutation",
      "public",
      {
        courseId: Id<"courses">;
        rating: number;
        reviewText: string;
        title?: string;
        userId: string;
      },
      Id<"courseReviews">
    >;
    deleteReview: FunctionReference<
      "mutation",
      "public",
      { reviewId: Id<"courseReviews">; userId: string },
      any
    >;
    getCourseRatingSummary: FunctionReference<
      "query",
      "public",
      { courseId: Id<"courses"> },
      {
        averageRating: number;
        ratingDistribution: {
          five: number;
          four: number;
          one: number;
          three: number;
          two: number;
        };
        totalReviews: number;
      }
    >;
    getCourseReviews: FunctionReference<
      "query",
      "public",
      {
        courseId: Id<"courses">;
        limit?: number;
        sortBy?: "recent" | "helpful" | "highest" | "lowest";
      },
      {
        averageRating: number;
        ratingDistribution: {
          five: number;
          four: number;
          one: number;
          three: number;
          two: number;
        };
        reviews: Array<{
          _id: Id<"courseReviews">;
          createdAt: number;
          helpfulCount: number;
          instructorResponse?: string;
          instructorResponseAt?: number;
          isVerifiedPurchase: boolean;
          rating: number;
          reviewText: string;
          title?: string;
          userAvatar?: string;
          userId: string;
          userName?: string;
        }>;
        totalCount: number;
      }
    >;
    getUserReviewForCourse: FunctionReference<
      "query",
      "public",
      { courseId: Id<"courses">; userId: string },
      any
    >;
    getUserReviews: FunctionReference<
      "query",
      "public",
      { limit?: number; userId: string },
      any
    >;
    markReviewHelpful: FunctionReference<
      "mutation",
      "public",
      { reviewId: Id<"courseReviews">; userId: string },
      any
    >;
    reportReview: FunctionReference<
      "mutation",
      "public",
      { reason?: string; reviewId: Id<"courseReviews">; userId: string },
      any
    >;
    updateReview: FunctionReference<
      "mutation",
      "public",
      {
        rating?: number;
        reviewId: Id<"courseReviews">;
        reviewText?: string;
        title?: string;
        userId: string;
      },
      any
    >;
  };
  courses: {
    cleanupDuplicateChapters: FunctionReference<
      "mutation",
      "public",
      { courseId: Id<"courses">; userId: string },
      { message: string; removedCount: number; success: boolean }
    >;
    createCourse: FunctionReference<
      "mutation",
      "public",
      {
        courseCategoryId?: string;
        description?: string;
        imageUrl?: string;
        price?: number;
        slug?: string;
        title: string;
        userId: string;
      },
      Id<"courses">
    >;
    createCourseWithData: FunctionReference<
      "mutation",
      "public",
      {
        data: {
          category?: string;
          checkoutHeadline: string;
          description?: string;
          modules?: any;
          price: string;
          skillLevel?: string;
          subcategory?: string;
          tags?: Array<string>;
          thumbnail?: string;
          title: string;
        };
        storeId: string;
        userId: string;
      },
      { courseId?: Id<"courses">; slug?: string; success: boolean }
    >;
    createOrUpdateChapter: FunctionReference<
      "mutation",
      "public",
      {
        chapterData: {
          content: string;
          duration?: number;
          generatedAudioData?: string;
          position: number;
          title: string;
          videoUrl?: string;
        };
        chapterId: Id<"courseChapters"> | null;
        courseId: Id<"courses">;
        lessonId?: Id<"courseLessons">;
      },
      { chapterId?: Id<"courseChapters">; error?: string; success: boolean }
    >;
    deleteCourse: FunctionReference<
      "mutation",
      "public",
      { courseId: Id<"courses">; userId: string },
      { message: string; success: boolean }
    >;
    getAllCourses: FunctionReference<"query", "public", {}, Array<any>>;
    getAllPublishedCourses: FunctionReference<
      "query",
      "public",
      {},
      Array<{
        _creationTime: number;
        _id: Id<"courses">;
        category?: string;
        creatorAvatar?: string;
        creatorName?: string;
        description?: string;
        enrollmentCount?: number;
        followGateEnabled?: boolean;
        followGateMessage?: string;
        followGateRequirements?: {
          minFollowsRequired?: number;
          requireEmail?: boolean;
          requireInstagram?: boolean;
          requireSpotify?: boolean;
          requireTiktok?: boolean;
          requireYoutube?: boolean;
        };
        followGateSocialLinks?: {
          instagram?: string;
          spotify?: string;
          tiktok?: string;
          youtube?: string;
        };
        price: number;
        published: boolean;
        skillLevel?: string;
        slug: string;
        storeId?: Id<"stores">;
        subcategory?: string;
        tags?: Array<string>;
        thumbnail?: string;
        title: string;
        userId: string;
      }>
    >;
    getChapterById: FunctionReference<
      "query",
      "public",
      { chapterId: Id<"courseChapters">; userId: string },
      {
        _id: Id<"courseChapters">;
        audioGenerationStatus?:
          | "pending"
          | "generating"
          | "completed"
          | "failed";
        audioUrl?: string;
        courseId: string;
        description?: string;
        generatedAudioUrl?: string;
        generatedVideoUrl?: string;
        lessonId?: string;
        position: number;
        title: string;
        videoGenerationStatus?:
          | "pending"
          | "generating"
          | "completed"
          | "failed";
        videoUrl?: string;
      } | null
    >;
    getChapterVideo: FunctionReference<
      "query",
      "public",
      { chapterId: Id<"courseChapters"> },
      null | {
        muxAssetStatus?: string;
        muxPlaybackId?: string;
        videoDuration?: number;
        videoUrl?: string;
      }
    >;
    getCourseBySlug: FunctionReference<
      "query",
      "public",
      { slug: string },
      {
        _creationTime: number;
        _id: Id<"courses">;
        acceptsPayPal?: boolean;
        acceptsStripe?: boolean;
        category?: string;
        checkoutDescription?: string;
        checkoutHeadline?: string;
        courseCategoryId?: string;
        description?: string;
        followGateEnabled?: boolean;
        followGateMessage?: string;
        followGateRequirements?: {
          minFollowsRequired?: number;
          requireEmail?: boolean;
          requireInstagram?: boolean;
          requireSpotify?: boolean;
          requireTiktok?: boolean;
          requireYoutube?: boolean;
        };
        followGateSocialLinks?: {
          instagram?: string;
          spotify?: string;
          tiktok?: string;
          youtube?: string;
        };
        guaranteeText?: string;
        imageUrl?: string;
        instructorId?: string;
        isPublished?: boolean;
        modules?: any;
        paymentDescription?: string;
        price?: number;
        showGuarantee?: boolean;
        skillLevel?: string;
        slug?: string;
        storeId?: string;
        stripePriceId?: string;
        stripeProductId?: string;
        subcategory?: string;
        tags?: Array<string>;
        title: string;
        userId: string;
      } | null
    >;
    getCourseChapters: FunctionReference<
      "query",
      "public",
      { courseId: Id<"courses"> },
      Array<{
        _creationTime: number;
        _id: Id<"courseChapters">;
        audioGeneratedAt?: number;
        audioGenerationError?: string;
        audioGenerationStatus?:
          | "pending"
          | "generating"
          | "completed"
          | "failed";
        audioUrl?: string;
        courseId: string;
        description?: string;
        generatedAudioUrl?: string;
        generatedVideoUrl?: string;
        isFree?: boolean;
        isPublished?: boolean;
        lessonId?: string;
        position: number;
        title: string;
        videoGeneratedAt?: number;
        videoGenerationError?: string;
        videoGenerationStatus?:
          | "pending"
          | "generating"
          | "completed"
          | "failed";
        videoUrl?: string;
      }>
    >;
    getCourseForEdit: FunctionReference<
      "query",
      "public",
      { courseId: Id<"courses">; userId: string },
      {
        _creationTime: number;
        _id: Id<"courses">;
        acceptsPayPal?: boolean;
        acceptsStripe?: boolean;
        category?: string;
        checkoutDescription?: string;
        checkoutHeadline?: string;
        courseCategoryId?: string;
        description?: string;
        guaranteeText?: string;
        imageUrl?: string;
        instructorId?: string;
        isPublished?: boolean;
        modules?: Array<{
          description: string;
          lessons: Array<{
            chapters: Array<{
              content: string;
              duration: number;
              generatedAudioData?: string;
              orderIndex: number;
              title: string;
              videoUrl: string;
            }>;
            description: string;
            orderIndex: number;
            title: string;
          }>;
          orderIndex: number;
          title: string;
        }>;
        paymentDescription?: string;
        price?: number;
        showGuarantee?: boolean;
        skillLevel?: string;
        slug?: string;
        subcategory?: string;
        tags?: Array<string>;
        title: string;
        userId: string;
      } | null
    >;
    getCourses: FunctionReference<
      "query",
      "public",
      {},
      Array<{
        _creationTime: number;
        _id: Id<"courses">;
        acceptsPayPal?: boolean;
        acceptsStripe?: boolean;
        category?: string;
        checkoutDescription?: string;
        checkoutHeadline?: string;
        courseCategoryId?: string;
        description?: string;
        followGateEnabled?: boolean;
        followGateMessage?: string;
        followGateRequirements?: {
          minFollowsRequired?: number;
          requireEmail?: boolean;
          requireInstagram?: boolean;
          requireSpotify?: boolean;
          requireTiktok?: boolean;
          requireYoutube?: boolean;
        };
        followGateSocialLinks?: {
          instagram?: string;
          spotify?: string;
          tiktok?: string;
          youtube?: string;
        };
        guaranteeText?: string;
        imageUrl?: string;
        instructorId?: string;
        isPublished?: boolean;
        paymentDescription?: string;
        price?: number;
        showGuarantee?: boolean;
        skillLevel?: string;
        slug?: string;
        storeId?: string;
        stripePriceId?: string;
        stripeProductId?: string;
        subcategory?: string;
        tags?: Array<string>;
        title: string;
        userId: string;
      }>
    >;
    getCoursesByInstructor: FunctionReference<
      "query",
      "public",
      { instructorId: string },
      Array<{
        _creationTime: number;
        _id: Id<"courses">;
        acceptsPayPal?: boolean;
        acceptsStripe?: boolean;
        category?: string;
        checkoutDescription?: string;
        checkoutHeadline?: string;
        courseCategoryId?: string;
        description?: string;
        followGateEnabled?: boolean;
        followGateMessage?: string;
        followGateRequirements?: {
          minFollowsRequired?: number;
          requireEmail?: boolean;
          requireInstagram?: boolean;
          requireSpotify?: boolean;
          requireTiktok?: boolean;
          requireYoutube?: boolean;
        };
        followGateSocialLinks?: {
          instagram?: string;
          spotify?: string;
          tiktok?: string;
          youtube?: string;
        };
        guaranteeText?: string;
        imageUrl?: string;
        instructorId?: string;
        isPublished?: boolean;
        paymentDescription?: string;
        price?: number;
        showGuarantee?: boolean;
        skillLevel?: string;
        slug?: string;
        storeId?: string;
        stripePriceId?: string;
        stripeProductId?: string;
        subcategory?: string;
        tags?: Array<string>;
        title: string;
        userId: string;
      }>
    >;
    getCoursesByStore: FunctionReference<
      "query",
      "public",
      { storeId: string },
      Array<{
        _creationTime: number;
        _id: Id<"courses">;
        acceptsPayPal?: boolean;
        acceptsStripe?: boolean;
        category?: string;
        checkoutDescription?: string;
        checkoutHeadline?: string;
        courseCategoryId?: string;
        description?: string;
        followGateEnabled?: boolean;
        followGateMessage?: string;
        followGateRequirements?: {
          minFollowsRequired?: number;
          requireEmail?: boolean;
          requireInstagram?: boolean;
          requireSpotify?: boolean;
          requireTiktok?: boolean;
          requireYoutube?: boolean;
        };
        followGateSocialLinks?: {
          instagram?: string;
          spotify?: string;
          tiktok?: string;
          youtube?: string;
        };
        guaranteeText?: string;
        imageUrl?: string;
        instructorId?: string;
        isPublished?: boolean;
        paymentDescription?: string;
        price?: number;
        showGuarantee?: boolean;
        skillLevel?: string;
        slug?: string;
        storeId?: string;
        stripePriceId?: string;
        stripeProductId?: string;
        subcategory?: string;
        tags?: Array<string>;
        title: string;
        userId: string;
      }>
    >;
    getCoursesByUser: FunctionReference<
      "query",
      "public",
      { userId: string },
      Array<{
        _creationTime: number;
        _id: Id<"courses">;
        acceptsPayPal?: boolean;
        acceptsStripe?: boolean;
        category?: string;
        checkoutDescription?: string;
        checkoutHeadline?: string;
        courseCategoryId?: string;
        description?: string;
        followGateEnabled?: boolean;
        followGateMessage?: string;
        followGateRequirements?: {
          minFollowsRequired?: number;
          requireEmail?: boolean;
          requireInstagram?: boolean;
          requireSpotify?: boolean;
          requireTiktok?: boolean;
          requireYoutube?: boolean;
        };
        followGateSocialLinks?: {
          instagram?: string;
          spotify?: string;
          tiktok?: string;
          youtube?: string;
        };
        guaranteeText?: string;
        imageUrl?: string;
        instructorId?: string;
        isPublished?: boolean;
        paymentDescription?: string;
        price?: number;
        showGuarantee?: boolean;
        skillLevel?: string;
        slug?: string;
        storeId?: string;
        stripePriceId?: string;
        stripeProductId?: string;
        subcategory?: string;
        tags?: Array<string>;
        title: string;
        userId: string;
      }>
    >;
    getCourseWithInstructor: FunctionReference<
      "query",
      "public",
      { courseId: Id<"courses"> },
      {
        course: any;
        instructor: {
          avatar?: string;
          bio?: string;
          courseCount: number;
          name: string;
          rating: number;
          socialLinks?: {
            instagram?: string;
            twitter?: string;
            youtube?: string;
          };
          studentCount: number;
          verified: boolean;
        };
      } | null
    >;
    getPublishedCoursesByStore: FunctionReference<
      "query",
      "public",
      { storeId: string },
      Array<{
        _creationTime: number;
        _id: Id<"courses">;
        acceptsPayPal?: boolean;
        acceptsStripe?: boolean;
        category?: string;
        checkoutDescription?: string;
        checkoutHeadline?: string;
        courseCategoryId?: string;
        description?: string;
        followGateEnabled?: boolean;
        followGateMessage?: string;
        followGateRequirements?: {
          minFollowsRequired?: number;
          requireEmail?: boolean;
          requireInstagram?: boolean;
          requireSpotify?: boolean;
          requireTiktok?: boolean;
          requireYoutube?: boolean;
        };
        followGateSocialLinks?: {
          instagram?: string;
          spotify?: string;
          tiktok?: string;
          youtube?: string;
        };
        guaranteeText?: string;
        imageUrl?: string;
        instructorId?: string;
        isPublished?: boolean;
        paymentDescription?: string;
        price?: number;
        showGuarantee?: boolean;
        skillLevel?: string;
        slug?: string;
        storeId?: string;
        stripePriceId?: string;
        stripeProductId?: string;
        subcategory?: string;
        tags?: Array<string>;
        title: string;
        userId: string;
      }>
    >;
    setChapterMuxAssetId: FunctionReference<
      "mutation",
      "public",
      { chapterId: Id<"courseChapters">; muxAssetId: string },
      any
    >;
    setChapterMuxUpload: FunctionReference<
      "mutation",
      "public",
      { chapterId: Id<"courseChapters">; muxUploadId: string },
      any
    >;
    syncCourseToStripe: FunctionReference<
      "action",
      "public",
      { courseId: Id<"courses"> },
      {
        message: string;
        stripePriceId?: string;
        stripeProductId?: string;
        success: boolean;
      }
    >;
    togglePublished: FunctionReference<
      "mutation",
      "public",
      { courseId: Id<"courses">; userId: string },
      { isPublished?: boolean; success: boolean }
    >;
    updateChapterMuxAsset: FunctionReference<
      "mutation",
      "public",
      {
        muxAssetId: string;
        muxAssetStatus: "waiting" | "preparing" | "ready" | "errored";
        muxPlaybackId?: string;
        videoDuration?: number;
      },
      any
    >;
    updateCourse: FunctionReference<
      "mutation",
      "public",
      {
        acceptsPayPal?: boolean;
        acceptsStripe?: boolean;
        category?: string;
        checkoutDescription?: string;
        checkoutHeadline?: string;
        courseCategoryId?: string;
        description?: string;
        guaranteeText?: string;
        id: Id<"courses">;
        imageUrl?: string;
        isPinned?: boolean;
        isPublished?: boolean;
        paymentDescription?: string;
        pinnedAt?: number;
        price?: number;
        showGuarantee?: boolean;
        skillLevel?: string;
        slug?: string;
        storeId?: string;
        stripePriceId?: string;
        stripeProductId?: string;
        title?: string;
      },
      {
        _creationTime: number;
        _id: Id<"courses">;
        acceptsPayPal?: boolean;
        acceptsStripe?: boolean;
        category?: string;
        checkoutDescription?: string;
        checkoutHeadline?: string;
        courseCategoryId?: string;
        description?: string;
        guaranteeText?: string;
        imageUrl?: string;
        instructorId?: string;
        isPinned?: boolean;
        isPublished?: boolean;
        paymentDescription?: string;
        pinnedAt?: number;
        price?: number;
        showGuarantee?: boolean;
        skillLevel?: string;
        slug?: string;
        storeId?: string;
        subcategory?: string;
        title: string;
        userId: string;
      } | null
    >;
    updateCourseWithModules: FunctionReference<
      "mutation",
      "public",
      {
        courseData: {
          acceptsPayPal?: boolean;
          acceptsStripe?: boolean;
          category?: string;
          checkoutDescription?: string;
          checkoutHeadline?: string;
          description?: string;
          guaranteeText?: string;
          imageUrl?: string;
          paymentDescription?: string;
          price?: number;
          showGuarantee?: boolean;
          skillLevel?: string;
          subcategory?: string;
          title?: string;
        };
        courseId: Id<"courses">;
        modules?: Array<{
          description: string;
          lessons: Array<{
            chapters: Array<{
              content: string;
              duration: number;
              generatedAudioData?: string;
              orderIndex: number;
              title: string;
              videoUrl: string;
            }>;
            description: string;
            orderIndex: number;
            title: string;
          }>;
          orderIndex: number;
          title: string;
        }>;
      },
      { error?: string; success: boolean }
    >;
  };
  creatorPlans: {
    adminGetStoreByUserId: FunctionReference<
      "query",
      "public",
      { clerkId: string; targetUserId: string },
      {
        courseCount: number;
        plan:
          | "free"
          | "starter"
          | "creator"
          | "creator_pro"
          | "business"
          | "early_access";
        productCount: number;
        storeId: Id<"stores">;
        storeName: string;
        storeSlug: string;
      } | null
    >;
    adminSetStorePlan: FunctionReference<
      "mutation",
      "public",
      {
        clerkId: string;
        plan:
          | "free"
          | "starter"
          | "creator"
          | "creator_pro"
          | "business"
          | "early_access";
        storeId: Id<"stores">;
      },
      { message: string; success: boolean }
    >;
    checkFeatureAccess: FunctionReference<
      "query",
      "public",
      { clerkId?: string; feature: string; storeId: Id<"stores"> },
      {
        currentUsage?: number;
        earlyAccessExpired?: boolean;
        hasAccess: boolean;
        isAdmin?: boolean;
        limit?: number;
        requiresPlan?: "starter" | "creator" | "creator_pro";
      }
    >;
    extendEarlyAccess: FunctionReference<
      "mutation",
      "public",
      { additionalDays: number; clerkId: string; storeId: Id<"stores"> },
      { message: string; newExpirationDate?: number; success: boolean }
    >;
    getEarlyAccessStores: FunctionReference<
      "query",
      "public",
      { clerkId: string },
      Array<{
        courseCount: number;
        daysUntilExpiration?: number;
        earlyAccessExpiresAt?: number;
        isExpired: boolean;
        planStartedAt?: number;
        productCount: number;
        storeId: Id<"stores">;
        storeName: string;
        storeSlug: string;
        totalRevenue: number;
        userEmail?: string;
        userId: string;
        userName?: string;
      }>
    >;
    getPlanUsageStats: FunctionReference<
      "query",
      "public",
      { storeId: Id<"stores"> },
      {
        plan:
          | "free"
          | "starter"
          | "creator"
          | "creator_pro"
          | "business"
          | "early_access";
        usage: {
          emailsSentThisMonth: { current: number; limit: number };
          links: { current: number; limit: number };
          products: { current: number; limit: number };
        };
      }
    >;
    getStorePlan: FunctionReference<
      "query",
      "public",
      { storeId: Id<"stores"> },
      {
        daysUntilExpiration?: number;
        earlyAccessExpired: boolean;
        earlyAccessExpiresAt?: number;
        effectivePlan:
          | "free"
          | "starter"
          | "creator"
          | "creator_pro"
          | "business"
          | "early_access";
        isActive: boolean;
        limits: any;
        plan:
          | "free"
          | "starter"
          | "creator"
          | "creator_pro"
          | "business"
          | "early_access";
        pricing: any;
        subscriptionStatus?:
          | "active"
          | "trialing"
          | "past_due"
          | "canceled"
          | "incomplete";
        trialEndsAt?: number;
      } | null
    >;
    initializeStorePlan: FunctionReference<
      "mutation",
      "public",
      { storeId: Id<"stores"> },
      { success: boolean }
    >;
    setEarlyAccessExpiration: FunctionReference<
      "mutation",
      "public",
      { clerkId: string; expiresAt: number; storeId: Id<"stores"> },
      { message: string; success: boolean }
    >;
    sunsetAllEarlyAccess: FunctionReference<
      "mutation",
      "public",
      { clerkId: string; daysUntilExpiration: number },
      { affectedStores: number; message: string; success: boolean }
    >;
    updateStoreVisibility: FunctionReference<
      "mutation",
      "public",
      {
        clerkId?: string;
        isPublic: boolean;
        isPublishedProfile?: boolean;
        storeId: Id<"stores">;
      },
      { message: string; success: boolean }
    >;
    updateSubscriptionStatus: FunctionReference<
      "mutation",
      "public",
      {
        downgradeToPlan?:
          | "free"
          | "starter"
          | "creator"
          | "creator_pro"
          | "business";
        storeId: Id<"stores">;
        subscriptionStatus:
          | "active"
          | "trialing"
          | "past_due"
          | "canceled"
          | "incomplete";
      },
      { success: boolean }
    >;
    upgradePlan: FunctionReference<
      "mutation",
      "public",
      {
        plan: "starter" | "creator" | "creator_pro" | "business";
        storeId: Id<"stores">;
        stripeCustomerId: string;
        stripeSubscriptionId: string;
        subscriptionStatus:
          | "active"
          | "trialing"
          | "past_due"
          | "canceled"
          | "incomplete";
        trialEndsAt?: number;
      },
      { message: string; success: boolean }
    >;
  };
  creditPackageStripe: {
    createCreditCheckoutSession: FunctionReference<
      "action",
      "public",
      { customerEmail: string; packageId: string; userId: string },
      {
        checkoutUrl?: string;
        error?: string;
        sessionId?: string;
        success: boolean;
      }
    >;
    getPackageStripePriceId: FunctionReference<
      "action",
      "public",
      { packageId: string },
      string | null
    >;
    syncCreditPackagesToStripe: FunctionReference<
      "action",
      "public",
      {},
      {
        message: string;
        results: Array<{
          error?: string;
          packageName: string;
          stripePriceId?: string;
          stripeProductId?: string;
        }>;
        success: boolean;
      }
    >;
  };
  credits: {
    addCreditsFromWebhook: FunctionReference<
      "mutation",
      "public",
      {
        amount: number;
        description: string;
        metadata?: { dollarAmount?: number; packageName?: string };
        stripePaymentId: string;
        type: "purchase" | "bonus" | "earn" | "refund";
        userId: string;
      },
      {
        alreadyProcessed?: boolean;
        newBalance: number;
        success: boolean;
        transactionId?: Id<"creditTransactions">;
      }
    >;
    awardBonusCredits: FunctionReference<
      "mutation",
      "public",
      { amount: number; reason: string; userId: string },
      { newBalance: number; success: boolean }
    >;
    earnCredits: FunctionReference<
      "mutation",
      "public",
      {
        amount: number;
        creatorId: string;
        description: string;
        relatedResourceId?: string;
        relatedResourceType?: "sample" | "pack";
      },
      { newBalance: number; success: boolean }
    >;
    getCreditPackages: FunctionReference<
      "query",
      "public",
      {},
      Array<{
        bonus: number;
        credits: number;
        id: string;
        popular: boolean;
        price: number;
        pricePerCredit: number;
        savingsPercent: number;
        totalCredits: number;
      }>
    >;
    getCreditTransactions: FunctionReference<
      "query",
      "public",
      { limit?: number; offset?: number },
      {
        total: number;
        transactions: Array<{
          _creationTime: number;
          _id: Id<"creditTransactions">;
          amount: number;
          balance: number;
          description: string;
          type: "purchase" | "spend" | "earn" | "bonus" | "refund";
        }>;
      }
    >;
    getUserCredits: FunctionReference<
      "query",
      "public",
      {},
      {
        balance: number;
        lastUpdated: number;
        lifetimeEarned: number;
        lifetimeSpent: number;
      } | null
    >;
    initializeUserCredits: FunctionReference<
      "mutation",
      "public",
      { userId: string },
      Id<"userCredits">
    >;
    purchaseCredits: FunctionReference<
      "mutation",
      "public",
      { dollarAmount: number; packageId: string; stripePaymentId: string },
      { creditsAdded: number; newBalance: number; success: boolean }
    >;
    spendCredits: FunctionReference<
      "mutation",
      "public",
      {
        amount: number;
        description: string;
        relatedResourceId?: string;
        relatedResourceType?: "sample" | "pack" | "credit_package";
      },
      {
        newBalance: number;
        success: boolean;
        transactionId: Id<"creditTransactions">;
      }
    >;
  };
  customDomains: {
    connectCustomDomain: FunctionReference<
      "action",
      "public",
      { domain: string; storeId: Id<"stores"> },
      { message: string; success: boolean }
    >;
    getStoreByCustomDomain: FunctionReference<
      "query",
      "public",
      { domain: string },
      { _id: Id<"stores">; name: string; slug: string; userId: string } | null
    >;
    removeCustomDomain: FunctionReference<
      "action",
      "public",
      { storeId: Id<"stores"> },
      { message: string; success: boolean }
    >;
    verifyCustomDomain: FunctionReference<
      "action",
      "public",
      { storeId: Id<"stores"> },
      {
        dnsRecords?: { aRecords?: Array<string>; cname?: string };
        message: string;
        status: string;
        success: boolean;
      }
    >;
  };
  customers: {
    createPurchase: FunctionReference<
      "mutation",
      "public",
      {
        adminUserId: string;
        amount: number;
        currency?: string;
        customerId: Id<"customers">;
        paymentMethod?: string;
        productId: Id<"digitalProducts">;
        storeId: string;
        transactionId?: string;
        userId: string;
      },
      Id<"purchases">
    >;
    createSubscription: FunctionReference<
      "mutation",
      "public",
      {
        adminUserId: string;
        amount: number;
        billingInterval: "monthly" | "yearly";
        currency?: string;
        customerId: Id<"customers">;
        planName: string;
        storeId: string;
        subscriptionId?: string;
      },
      Id<"subscriptions">
    >;
    debugEmailDomains: FunctionReference<
      "query",
      "public",
      { storeId: string },
      {
        domains: Array<{ count: number; domain: string }>;
        gmailCount: number;
        sampleEmails: Array<string>;
        totalChecked: number;
      }
    >;
    getCustomerCount: FunctionReference<
      "query",
      "public",
      { storeId: string },
      { exact: boolean; lastUpdated?: number; showing: number; total: number }
    >;
    getCustomersByType: FunctionReference<
      "query",
      "public",
      { adminUserId: string; type: "lead" | "paying" | "subscription" },
      Array<{
        _creationTime: number;
        _id: Id<"customers">;
        adminUserId: string;
        email: string;
        lastActivity?: number;
        name: string;
        notes?: string;
        source?: string;
        status: "active" | "inactive";
        storeId: string;
        totalSpent?: number;
        type: "lead" | "paying" | "subscription";
      }>
    >;
    getCustomersForAdmin: FunctionReference<
      "query",
      "public",
      { adminUserId: string },
      Array<{
        _creationTime: number;
        _id: Id<"customers">;
        adminUserId: string;
        email: string;
        lastActivity?: number;
        name: string;
        notes?: string;
        source?: string;
        status: "active" | "inactive";
        storeId: string;
        totalSpent?: number;
        type: "lead" | "paying" | "subscription";
      }>
    >;
    getCustomersForStore: FunctionReference<
      "query",
      "public",
      { storeId: string },
      Array<{
        _creationTime: number;
        _id: Id<"customers">;
        activeCampaignId?: string;
        adminUserId: string;
        city?: string;
        clicksLinks?: boolean;
        country?: string;
        countryCode?: string;
        daw?: string;
        email: string;
        enrolledCourses?: Array<{
          courseId: Id<"courses">;
          courseTitle: string;
          enrolledAt: number;
          progress?: number;
        }>;
        genreSpecialty?: string;
        goals?: string;
        howLongProducing?: string;
        lastActivity?: number;
        lastOpenDate?: number;
        musicAlias?: string;
        name: string;
        notes?: string;
        opensEmail?: boolean;
        phone?: string;
        purchasedProducts?: Array<{
          productId: Id<"digitalProducts">;
          productTitle: string;
          purchasedAt: number;
        }>;
        score?: number;
        source?: string;
        state?: string;
        stateCode?: string;
        status: "active" | "inactive";
        storeId: string;
        studentLevel?: string;
        tags?: Array<string>;
        totalSpent?: number;
        type: "lead" | "paying" | "subscription";
        typeOfMusic?: string;
        whySignedUp?: string;
        zipCode?: string;
      }>
    >;
    getCustomersForStorePaginated: FunctionReference<
      "query",
      "public",
      {
        paginationOpts: {
          cursor: string | null;
          endCursor?: string | null;
          id?: number;
          maximumBytesRead?: number;
          maximumRowsRead?: number;
          numItems: number;
        };
        storeId: string;
      },
      any
    >;
    getCustomerStats: FunctionReference<
      "query",
      "public",
      { adminUserId: string },
      {
        averageOrderValue: number;
        leads: number;
        payingCustomers: number;
        subscriptionCustomers: number;
        totalCustomers: number;
        totalRevenue: number;
      }
    >;
    getFansForStore: FunctionReference<
      "query",
      "public",
      { storeId: string },
      Array<{
        _creationTime: number;
        _id: Id<"customers"> | Id<"users">;
        activeCampaignId?: string;
        adminUserId?: string;
        city?: string;
        clicksLinks?: boolean;
        country?: string;
        countryCode?: string;
        daw?: string;
        email: string;
        enrolledCourses?: Array<{
          courseId: Id<"courses">;
          courseTitle: string;
          enrolledAt: number;
          progress?: number;
        }>;
        genreSpecialty?: string;
        goals?: string;
        howLongProducing?: string;
        imageUrl?: string;
        lastActivity?: number;
        lastOpenDate?: number;
        musicAlias?: string;
        name: string;
        notes?: string;
        opensEmail?: boolean;
        phone?: string;
        purchasedProducts?: Array<{
          productId: Id<"digitalProducts">;
          productTitle: string;
          purchasedAt: number;
        }>;
        score?: number;
        source?: string;
        state?: string;
        stateCode?: string;
        status?: "active" | "inactive";
        storeId?: string;
        studentLevel?: string;
        tags?: Array<string>;
        totalSpent?: number;
        type: "lead" | "paying" | "subscription" | "user";
        typeOfMusic?: string;
        whySignedUp?: string;
        zipCode?: string;
      }>
    >;
    getPurchasesForCustomer: FunctionReference<
      "query",
      "public",
      { customerId: Id<"customers"> },
      Array<{
        _creationTime: number;
        _id: Id<"purchases">;
        accessExpiresAt?: number;
        accessGranted?: boolean;
        adminUserId: string;
        amount: number;
        beatLicenseId?: Id<"beatLicenses">;
        courseId?: Id<"courses">;
        currency?: string;
        customerId?: Id<"customers">;
        downloadCount?: number;
        lastAccessedAt?: number;
        paymentMethod?: string;
        productId?: Id<"digitalProducts">;
        productType:
          | "digitalProduct"
          | "course"
          | "coaching"
          | "bundle"
          | "beatLease";
        status: "pending" | "completed" | "refunded";
        storeId: string;
        transactionId?: string;
        userId: string;
      }>
    >;
    searchCustomersForStore: FunctionReference<
      "query",
      "public",
      { searchTerm: string; storeId: string },
      Array<{
        _creationTime: number;
        _id: Id<"customers">;
        activeCampaignId?: string;
        adminUserId: string;
        city?: string;
        clicksLinks?: boolean;
        country?: string;
        countryCode?: string;
        daw?: string;
        email: string;
        enrolledCourses?: Array<{
          courseId: Id<"courses">;
          courseTitle: string;
          enrolledAt: number;
          progress?: number;
        }>;
        genreSpecialty?: string;
        goals?: string;
        howLongProducing?: string;
        lastActivity?: number;
        lastOpenDate?: number;
        musicAlias?: string;
        name: string;
        notes?: string;
        opensEmail?: boolean;
        phone?: string;
        purchasedProducts?: Array<{
          productId: Id<"digitalProducts">;
          productTitle: string;
          purchasedAt: number;
        }>;
        score?: number;
        source?: string;
        state?: string;
        stateCode?: string;
        status: "active" | "inactive";
        storeId: string;
        studentLevel?: string;
        tags?: Array<string>;
        totalSpent?: number;
        type: "lead" | "paying" | "subscription";
        typeOfMusic?: string;
        whySignedUp?: string;
        zipCode?: string;
      }>
    >;
    updateCustomerNotes: FunctionReference<
      "mutation",
      "public",
      { customerId: Id<"customers">; notes: string },
      null
    >;
    upsertCustomer: FunctionReference<
      "mutation",
      "public",
      {
        adminUserId: string;
        email: string;
        name: string;
        source?: string;
        storeId: string;
        type: "lead" | "paying" | "subscription";
      },
      Id<"customers">
    >;
  };
  debug: {
    checkEnrollments: {
      checkCourseEnrollments: FunctionReference<
        "query",
        "public",
        { storeId: string },
        {
          enrollmentsWithoutCustomers: number;
          sampleEnrollments: Array<{
            courseId: Id<"courses">;
            courseTitle: string;
            hasCustomerRecord: boolean;
            purchaseAmount?: number;
            userEmail?: string;
            userId: string;
          }>;
          totalCustomers: number;
          totalEnrollments: number;
        }
      >;
      checkUserEnrollments: FunctionReference<
        "query",
        "public",
        { userId: string },
        {
          customerRecords: Array<{
            _id: Id<"customers">;
            storeId: string;
            totalSpent?: number;
            type: "lead" | "paying" | "subscription";
          }>;
          enrollments: Array<{
            amount: number;
            courseId: Id<"courses">;
            courseTitle: string;
            purchaseDate: number;
            storeId: string;
          }>;
          totalEnrollments: number;
          userEmail?: string;
          userExists: boolean;
        }
      >;
      getStoreCustomerSummary: FunctionReference<
        "query",
        "public",
        {},
        Array<{
          leads: number;
          paying: number;
          storeId: string;
          storeName?: string;
          subscriptions: number;
          totalCustomers: number;
          totalEnrollments: number;
        }>
      >;
    };
    findCourseByTitle: FunctionReference<
      "query",
      "public",
      { titleFragment: string },
      Array<{
        _id: Id<"courses">;
        isPublished?: boolean;
        slug?: string;
        title: string;
        userId: string;
      }>
    >;
    getAllUserCourses: FunctionReference<
      "query",
      "public",
      { userId: string },
      Array<{
        _creationTime: number;
        _id: Id<"courses">;
        isPublished?: boolean;
        slug?: string;
        title: string;
      }>
    >;
    userEnrollments: {
      debugUserEnrollments: FunctionReference<
        "query",
        "public",
        { clerkId: string },
        {
          clerkId: string;
          enrollmentCount: number;
          enrollments: Array<{
            courseId: string;
            courseTitle: string;
            enrolledAt: number;
            progress?: number;
          }>;
          missingEnrollments: Array<string>;
          missingPurchases: Array<string>;
          purchaseCount: number;
          purchases: Array<{
            amount: number;
            courseId?: string;
            courseTitle?: string;
            purchasedAt: number;
            status: string;
          }>;
          userEmail?: string;
          userExists: boolean;
        }
      >;
      syncEnrollmentsFromPurchases: FunctionReference<
        "mutation",
        "public",
        { clerkId: string },
        { created: number; errors: number }
      >;
    };
  };
  debugFix: {
    checkCourseData: FunctionReference<
      "query",
      "public",
      { slug: string },
      {
        _id: Id<"courses">;
        hasStoreId: boolean;
        isPublished?: boolean;
        slug?: string;
        storeExists: boolean;
        storeId?: string;
        title: string;
        userExists: boolean;
        userId: string;
      } | null
    >;
    fixCourseStoreId: FunctionReference<
      "mutation",
      "public",
      { courseId: Id<"courses">; userId: string },
      {
        error?: string;
        fixed?: { storeId?: boolean; userId?: boolean };
        storeId?: string;
        success: boolean;
      }
    >;
  };
  devSeeders: {
    clearTestSubmissions: FunctionReference<
      "mutation",
      "public",
      { creatorId: string },
      null
    >;
    createSampleSubmissions: FunctionReference<
      "mutation",
      "public",
      { count?: number; creatorId: string },
      null
    >;
  };
  digitalProducts: {
    backfillProductSlugs: FunctionReference<
      "mutation",
      "public",
      {},
      { skipped: number; updated: number }
    >;
    createProduct: FunctionReference<
      "mutation",
      "public",
      {
        buttonLabel?: string;
        description?: string;
        displayStyle?: "embed" | "card" | "button";
        downloadUrl?: string;
        imageUrl?: string;
        mediaType?: "youtube" | "spotify" | "website" | "social";
        price: number;
        productType?: "digital" | "urlMedia";
        storeId: string;
        style?: "button" | "callout" | "preview" | "card" | "minimal";
        title: string;
        url?: string;
        userId: string;
      },
      Id<"digitalProducts">
    >;
    createUrlMediaProduct: FunctionReference<
      "mutation",
      "public",
      {
        buttonLabel?: string;
        description?: string;
        displayStyle: "embed" | "card" | "button";
        mediaType: "youtube" | "spotify" | "website" | "social";
        storeId: string;
        title: string;
        url: string;
        userId: string;
      },
      Id<"digitalProducts">
    >;
    deleteProduct: FunctionReference<
      "mutation",
      "public",
      { id: Id<"digitalProducts">; userId: string },
      null
    >;
    getAllProducts: FunctionReference<"query", "public", {}, Array<any>>;
    getAllPublishedProducts: FunctionReference<
      "query",
      "public",
      {},
      Array<{
        _creationTime: number;
        _id: Id<"digitalProducts">;
        abletonVersion?: string;
        bpm?: number;
        buttonLabel?: string;
        category?: string;
        chainImageUrl?: string;
        complexity?: "beginner" | "intermediate" | "advanced";
        contentType?: string;
        cpuLoad?: "low" | "medium" | "high";
        creatorAvatar?: string;
        creatorName?: string;
        demoAudioUrl?: string;
        description?: string;
        downloadCount?: number;
        downloadUrl?: string;
        effectType?: Array<string>;
        fileFormat?: "adg" | "adv" | "alp";
        fileSize?: number;
        genre?: Array<string>;
        imageUrl?: string;
        installationNotes?: string;
        macroCount?: number;
        macroScreenshotUrls?: Array<string>;
        minAbletonVersion?: string;
        musicalKey?: string;
        price: number;
        productCategory?: string;
        productType?:
          | "digital"
          | "urlMedia"
          | "coaching"
          | "effectChain"
          | "abletonRack"
          | "abletonPreset"
          | "playlistCuration";
        published: boolean;
        rackType?: "audioEffect" | "instrument" | "midiEffect" | "drumRack";
        requiresMaxForLive?: boolean;
        slug?: string;
        storeId: string;
        style?: "button" | "callout" | "preview" | "card" | "minimal";
        tags?: Array<string>;
        thirdPartyPlugins?: Array<string>;
        title: string;
        url?: string;
      }>
    >;
    getProductByGlobalSlug: FunctionReference<
      "query",
      "public",
      { slug: string },
      {
        _creationTime: number;
        _id: Id<"digitalProducts">;
        abletonVersion?: string;
        affiliateCommissionRate?: number;
        affiliateCookieDuration?: number;
        affiliateEnabled?: boolean;
        affiliateMinPayout?: number;
        availability?: any;
        bpm?: number;
        buttonLabel?: string;
        category?: string;
        chainImageUrl?: string;
        complexity?: string;
        confirmationEmailBody?: string;
        confirmationEmailSubject?: string;
        cpuLoad?: string;
        customFields?: any;
        dawType?: string;
        dawVersion?: string;
        demoAudioUrl?: string;
        description?: string;
        discordRoleId?: string;
        displayStyle?: string;
        downloadUrl?: string;
        duration?: number;
        effectType?: Array<string>;
        fileFormat?: string;
        fileSize?: number;
        followGateEnabled?: boolean;
        followGateMessage?: string;
        followGateRequirements?: any;
        followGateSocialLinks?: any;
        genre?: any;
        imageUrl?: string;
        installationNotes?: string;
        isPublished?: boolean;
        macroCount?: number;
        macroScreenshotUrls?: Array<string>;
        mediaType?: string;
        minAbletonVersion?: string;
        musicalKey?: string;
        orderBumpDescription?: string;
        orderBumpEnabled?: boolean;
        orderBumpImageUrl?: string;
        orderBumpPrice?: number;
        orderBumpProductName?: string;
        packFiles?: string;
        price: number;
        productCategory?: string;
        productType?: string;
        rackType?: string;
        requiresMaxForLive?: boolean;
        sessionType?: string;
        slug?: string;
        storeId: string;
        style?: string;
        tags?: Array<string>;
        thirdPartyPlugins?: Array<string>;
        thumbnailStyle?: string;
        title: string;
        url?: string;
        userId: string;
      } | null
    >;
    getProductById: FunctionReference<
      "query",
      "public",
      { productId: Id<"digitalProducts"> },
      {
        _creationTime: number;
        _id: Id<"digitalProducts">;
        abletonVersion?: string;
        affiliateCommissionRate?: number;
        affiliateCookieDuration?: number;
        affiliateEnabled?: boolean;
        affiliateMinPayout?: number;
        availability?: any;
        beatLeaseConfig?: {
          bpm?: number;
          genre?: string;
          key?: string;
          tiers?: Array<{
            commercialUse: boolean;
            creditRequired: boolean;
            distributionLimit?: number;
            enabled: boolean;
            musicVideoUse: boolean;
            name: string;
            price: number;
            radioBroadcasting: boolean;
            stemsIncluded: boolean;
            streamingLimit?: number;
            type: "basic" | "premium" | "exclusive" | "unlimited";
          }>;
        };
        bpm?: number;
        buttonLabel?: string;
        chainImageUrl?: string;
        complexity?: "beginner" | "intermediate" | "advanced";
        confirmationEmailBody?: string;
        confirmationEmailSubject?: string;
        cpuLoad?: "low" | "medium" | "high";
        customFields?: any;
        dawType?:
          | "ableton"
          | "fl-studio"
          | "logic"
          | "bitwig"
          | "studio-one"
          | "reason"
          | "cubase"
          | "multi-daw";
        dawVersion?: string;
        demoAudioUrl?: string;
        description?: string;
        discordRoleId?: string;
        displayStyle?: "embed" | "card" | "button";
        downloadUrl?: string;
        duration?: number;
        effectType?: Array<string>;
        exclusivePurchaseId?: Id<"purchases">;
        exclusiveSoldAt?: number;
        exclusiveSoldTo?: string;
        fileFormat?: "adg" | "adv" | "alp";
        fileSize?: number;
        followGateEnabled?: boolean;
        followGateMessage?: string;
        followGateRequirements?: {
          minFollowsRequired?: number;
          requireEmail?: boolean;
          requireInstagram?: boolean;
          requireSpotify?: boolean;
          requireTiktok?: boolean;
          requireYoutube?: boolean;
        };
        followGateSocialLinks?: {
          instagram?: string;
          spotify?: string;
          tiktok?: string;
          youtube?: string;
        };
        genre?: Array<string>;
        imageUrl?: string;
        installationNotes?: string;
        isPublished?: boolean;
        macroCount?: number;
        macroScreenshotUrls?: Array<string>;
        mediaType?: "youtube" | "spotify" | "website" | "social";
        minAbletonVersion?: string;
        musicalKey?: string;
        orderBumpDescription?: string;
        orderBumpEnabled?: boolean;
        orderBumpImageUrl?: string;
        orderBumpPrice?: number;
        orderBumpProductName?: string;
        packFiles?: string;
        price: number;
        productCategory?: string;
        productType?:
          | "digital"
          | "urlMedia"
          | "coaching"
          | "effectChain"
          | "abletonRack"
          | "abletonPreset"
          | "playlistCuration";
        rackType?: "audioEffect" | "instrument" | "midiEffect" | "drumRack";
        requiresMaxForLive?: boolean;
        sessionType?: string;
        slug?: string;
        stemsUrl?: string;
        storeId: string;
        style?: "button" | "callout" | "preview" | "card" | "minimal";
        tags?: Array<string>;
        thirdPartyPlugins?: Array<string>;
        thumbnailStyle?: string;
        title: string;
        trackoutsUrl?: string;
        url?: string;
        userId: string;
        wavUrl?: string;
      } | null
    >;
    getProductBySlug: FunctionReference<
      "query",
      "public",
      { slug: string; storeId: string },
      {
        _creationTime: number;
        _id: Id<"digitalProducts">;
        abletonVersion?: string;
        affiliateCommissionRate?: number;
        affiliateCookieDuration?: number;
        affiliateEnabled?: boolean;
        affiliateMinPayout?: number;
        availability?: any;
        bpm?: number;
        buttonLabel?: string;
        category?: string;
        chainImageUrl?: string;
        complexity?: string;
        confirmationEmailBody?: string;
        confirmationEmailSubject?: string;
        cpuLoad?: string;
        customFields?: any;
        dawType?: string;
        dawVersion?: string;
        demoAudioUrl?: string;
        description?: string;
        discordRoleId?: string;
        displayStyle?: string;
        downloadUrl?: string;
        duration?: number;
        effectType?: Array<string>;
        fileFormat?: string;
        fileSize?: number;
        followGateEnabled?: boolean;
        followGateMessage?: string;
        followGateRequirements?: any;
        followGateSocialLinks?: any;
        genre?: any;
        imageUrl?: string;
        installationNotes?: string;
        isPublished?: boolean;
        macroCount?: number;
        macroScreenshotUrls?: Array<string>;
        mediaType?: string;
        minAbletonVersion?: string;
        musicalKey?: string;
        orderBumpDescription?: string;
        orderBumpEnabled?: boolean;
        orderBumpImageUrl?: string;
        orderBumpPrice?: number;
        orderBumpProductName?: string;
        packFiles?: string;
        price: number;
        productCategory?: string;
        productType?: string;
        rackType?: string;
        requiresMaxForLive?: boolean;
        sessionType?: string;
        slug?: string;
        storeId: string;
        style?: string;
        tags?: Array<string>;
        thirdPartyPlugins?: Array<string>;
        thumbnailStyle?: string;
        title: string;
        url?: string;
        userId: string;
      } | null
    >;
    getProductsByStore: FunctionReference<
      "query",
      "public",
      { storeId: string },
      Array<{
        _creationTime: number;
        _id: Id<"digitalProducts">;
        abletonVersion?: string;
        affiliateCommissionRate?: number;
        affiliateCookieDuration?: number;
        affiliateEnabled?: boolean;
        affiliateMinPayout?: number;
        availability?: any;
        beatLeaseConfig?: {
          bpm?: number;
          genre?: string;
          key?: string;
          tiers?: Array<{
            commercialUse: boolean;
            creditRequired: boolean;
            distributionLimit?: number;
            enabled: boolean;
            musicVideoUse: boolean;
            name: string;
            price: number;
            radioBroadcasting: boolean;
            stemsIncluded: boolean;
            streamingLimit?: number;
            type: "basic" | "premium" | "exclusive" | "unlimited";
          }>;
        };
        bpm?: number;
        buttonLabel?: string;
        chainImageUrl?: string;
        complexity?: "beginner" | "intermediate" | "advanced";
        confirmationEmailBody?: string;
        confirmationEmailSubject?: string;
        cpuLoad?: "low" | "medium" | "high";
        customFields?: any;
        dawType?:
          | "ableton"
          | "fl-studio"
          | "logic"
          | "bitwig"
          | "studio-one"
          | "reason"
          | "cubase"
          | "multi-daw";
        dawVersion?: string;
        demoAudioUrl?: string;
        description?: string;
        discordRoleId?: string;
        displayStyle?: "embed" | "card" | "button";
        downloadUrl?: string;
        duration?: number;
        effectType?: Array<string>;
        exclusivePurchaseId?: Id<"purchases">;
        exclusiveSoldAt?: number;
        exclusiveSoldTo?: string;
        fileFormat?: "adg" | "adv" | "alp";
        fileSize?: number;
        followGateEnabled?: boolean;
        followGateMessage?: string;
        followGateRequirements?: {
          minFollowsRequired?: number;
          requireEmail?: boolean;
          requireInstagram?: boolean;
          requireSpotify?: boolean;
          requireTiktok?: boolean;
          requireYoutube?: boolean;
        };
        followGateSocialLinks?: {
          instagram?: string;
          spotify?: string;
          tiktok?: string;
          youtube?: string;
        };
        genre?: Array<string>;
        imageUrl?: string;
        installationNotes?: string;
        isPublished?: boolean;
        macroCount?: number;
        macroScreenshotUrls?: Array<string>;
        mediaType?: "youtube" | "spotify" | "website" | "social";
        minAbletonVersion?: string;
        musicalKey?: string;
        orderBumpDescription?: string;
        orderBumpEnabled?: boolean;
        orderBumpImageUrl?: string;
        orderBumpPrice?: number;
        orderBumpProductName?: string;
        packFiles?: string;
        price: number;
        productCategory?: string;
        productType?:
          | "digital"
          | "urlMedia"
          | "coaching"
          | "effectChain"
          | "abletonRack"
          | "abletonPreset"
          | "playlistCuration";
        rackType?: "audioEffect" | "instrument" | "midiEffect" | "drumRack";
        requiresMaxForLive?: boolean;
        sessionType?: string;
        slug?: string;
        stemsUrl?: string;
        storeId: string;
        style?: "button" | "callout" | "preview" | "card" | "minimal";
        tags?: Array<string>;
        thirdPartyPlugins?: Array<string>;
        thumbnailStyle?: string;
        title: string;
        trackoutsUrl?: string;
        url?: string;
        userId: string;
        wavUrl?: string;
      }>
    >;
    getProductsByUser: FunctionReference<
      "query",
      "public",
      { userId: string },
      Array<{
        _creationTime: number;
        _id: Id<"digitalProducts">;
        abletonVersion?: string;
        affiliateCommissionRate?: number;
        affiliateCookieDuration?: number;
        affiliateEnabled?: boolean;
        affiliateMinPayout?: number;
        availability?: any;
        beatLeaseConfig?: {
          bpm?: number;
          genre?: string;
          key?: string;
          tiers?: Array<{
            commercialUse: boolean;
            creditRequired: boolean;
            distributionLimit?: number;
            enabled: boolean;
            musicVideoUse: boolean;
            name: string;
            price: number;
            radioBroadcasting: boolean;
            stemsIncluded: boolean;
            streamingLimit?: number;
            type: "basic" | "premium" | "exclusive" | "unlimited";
          }>;
        };
        bpm?: number;
        buttonLabel?: string;
        chainImageUrl?: string;
        complexity?: "beginner" | "intermediate" | "advanced";
        confirmationEmailBody?: string;
        confirmationEmailSubject?: string;
        cpuLoad?: "low" | "medium" | "high";
        customFields?: any;
        dawType?:
          | "ableton"
          | "fl-studio"
          | "logic"
          | "bitwig"
          | "studio-one"
          | "reason"
          | "cubase"
          | "multi-daw";
        dawVersion?: string;
        demoAudioUrl?: string;
        description?: string;
        discordRoleId?: string;
        displayStyle?: "embed" | "card" | "button";
        downloadUrl?: string;
        duration?: number;
        effectType?: Array<string>;
        exclusivePurchaseId?: Id<"purchases">;
        exclusiveSoldAt?: number;
        exclusiveSoldTo?: string;
        fileFormat?: "adg" | "adv" | "alp";
        fileSize?: number;
        followGateEnabled?: boolean;
        followGateMessage?: string;
        followGateRequirements?: {
          minFollowsRequired?: number;
          requireEmail?: boolean;
          requireInstagram?: boolean;
          requireSpotify?: boolean;
          requireTiktok?: boolean;
          requireYoutube?: boolean;
        };
        followGateSocialLinks?: {
          instagram?: string;
          spotify?: string;
          tiktok?: string;
          youtube?: string;
        };
        genre?: Array<string>;
        imageUrl?: string;
        installationNotes?: string;
        isPublished?: boolean;
        macroCount?: number;
        macroScreenshotUrls?: Array<string>;
        mediaType?: "youtube" | "spotify" | "website" | "social";
        minAbletonVersion?: string;
        musicalKey?: string;
        orderBumpDescription?: string;
        orderBumpEnabled?: boolean;
        orderBumpImageUrl?: string;
        orderBumpPrice?: number;
        orderBumpProductName?: string;
        packFiles?: string;
        price: number;
        productCategory?: string;
        productType?:
          | "digital"
          | "urlMedia"
          | "coaching"
          | "effectChain"
          | "abletonRack"
          | "abletonPreset"
          | "playlistCuration";
        rackType?: "audioEffect" | "instrument" | "midiEffect" | "drumRack";
        requiresMaxForLive?: boolean;
        sessionType?: string;
        slug?: string;
        stemsUrl?: string;
        storeId: string;
        style?: "button" | "callout" | "preview" | "card" | "minimal";
        tags?: Array<string>;
        thirdPartyPlugins?: Array<string>;
        thumbnailStyle?: string;
        title: string;
        trackoutsUrl?: string;
        url?: string;
        userId: string;
        wavUrl?: string;
      }>
    >;
    getPublishedProductsByStore: FunctionReference<
      "query",
      "public",
      { storeId: string },
      Array<{
        _creationTime: number;
        _id: Id<"digitalProducts">;
        abletonVersion?: string;
        affiliateCommissionRate?: number;
        affiliateCookieDuration?: number;
        affiliateEnabled?: boolean;
        affiliateMinPayout?: number;
        availability?: any;
        beatLeaseConfig?: {
          bpm?: number;
          genre?: string;
          key?: string;
          tiers?: Array<{
            commercialUse: boolean;
            creditRequired: boolean;
            distributionLimit?: number;
            enabled: boolean;
            musicVideoUse: boolean;
            name: string;
            price: number;
            radioBroadcasting: boolean;
            stemsIncluded: boolean;
            streamingLimit?: number;
            type: "basic" | "premium" | "exclusive" | "unlimited";
          }>;
        };
        bpm?: number;
        buttonLabel?: string;
        chainImageUrl?: string;
        complexity?: "beginner" | "intermediate" | "advanced";
        confirmationEmailBody?: string;
        confirmationEmailSubject?: string;
        cpuLoad?: "low" | "medium" | "high";
        customFields?: any;
        dawType?:
          | "ableton"
          | "fl-studio"
          | "logic"
          | "bitwig"
          | "studio-one"
          | "reason"
          | "cubase"
          | "multi-daw";
        dawVersion?: string;
        demoAudioUrl?: string;
        description?: string;
        discordRoleId?: string;
        displayStyle?: "embed" | "card" | "button";
        downloadUrl?: string;
        duration?: number;
        effectType?: Array<string>;
        exclusivePurchaseId?: Id<"purchases">;
        exclusiveSoldAt?: number;
        exclusiveSoldTo?: string;
        fileFormat?: "adg" | "adv" | "alp";
        fileSize?: number;
        followGateEnabled?: boolean;
        followGateMessage?: string;
        followGateRequirements?: {
          minFollowsRequired?: number;
          requireEmail?: boolean;
          requireInstagram?: boolean;
          requireSpotify?: boolean;
          requireTiktok?: boolean;
          requireYoutube?: boolean;
        };
        followGateSocialLinks?: {
          instagram?: string;
          spotify?: string;
          tiktok?: string;
          youtube?: string;
        };
        genre?: Array<string>;
        imageUrl?: string;
        installationNotes?: string;
        isPublished?: boolean;
        macroCount?: number;
        macroScreenshotUrls?: Array<string>;
        mediaType?: "youtube" | "spotify" | "website" | "social";
        minAbletonVersion?: string;
        musicalKey?: string;
        orderBumpDescription?: string;
        orderBumpEnabled?: boolean;
        orderBumpImageUrl?: string;
        orderBumpPrice?: number;
        orderBumpProductName?: string;
        packFiles?: string;
        price: number;
        productCategory?: string;
        productType?:
          | "digital"
          | "urlMedia"
          | "coaching"
          | "effectChain"
          | "abletonRack"
          | "abletonPreset"
          | "playlistCuration";
        rackType?: "audioEffect" | "instrument" | "midiEffect" | "drumRack";
        requiresMaxForLive?: boolean;
        sessionType?: string;
        slug?: string;
        stemsUrl?: string;
        storeId: string;
        style?: "button" | "callout" | "preview" | "card" | "minimal";
        tags?: Array<string>;
        thirdPartyPlugins?: Array<string>;
        thumbnailStyle?: string;
        title: string;
        trackoutsUrl?: string;
        url?: string;
        userId: string;
        wavUrl?: string;
      }>
    >;
    getRelatedProducts: FunctionReference<
      "query",
      "public",
      {
        category?: string;
        limit?: number;
        productId: Id<"digitalProducts">;
        storeId?: string;
      },
      Array<{
        _id: Id<"digitalProducts">;
        category: string;
        imageUrl?: string;
        price: number;
        slug?: string;
        storeId: string;
        title: string;
      }>
    >;
    updateEmailConfirmation: FunctionReference<
      "mutation",
      "public",
      {
        confirmationEmailBody: string;
        confirmationEmailSubject: string;
        productId: Id<"digitalProducts">;
      },
      { message: string; success: boolean }
    >;
    updateProduct: FunctionReference<
      "mutation",
      "public",
      {
        abletonVersion?: string;
        affiliateCommissionRate?: number;
        affiliateCookieDuration?: number;
        affiliateEnabled?: boolean;
        affiliateMinPayout?: number;
        beatLeaseConfig?: {
          bpm?: number;
          genre?: string;
          key?: string;
          tiers?: Array<{
            commercialUse: boolean;
            creditRequired: boolean;
            distributionLimit?: number;
            enabled: boolean;
            musicVideoUse: boolean;
            name: string;
            price: number;
            radioBroadcasting: boolean;
            stemsIncluded: boolean;
            streamingLimit?: number;
            type: "basic" | "premium" | "exclusive" | "unlimited";
          }>;
        };
        bpm?: number;
        buttonLabel?: string;
        chainImageUrl?: string;
        complexity?: "beginner" | "intermediate" | "advanced";
        confirmationEmailBody?: string;
        confirmationEmailSubject?: string;
        cpuLoad?: "low" | "medium" | "high";
        dawType?:
          | "ableton"
          | "fl-studio"
          | "logic"
          | "bitwig"
          | "studio-one"
          | "reason"
          | "cubase"
          | "multi-daw";
        dawVersion?: string;
        demoAudioUrl?: string;
        description?: string;
        displayStyle?: "embed" | "card" | "button";
        downloadUrl?: string;
        duration?: number;
        effectType?: Array<string>;
        fileFormat?: "adg" | "adv" | "alp";
        fileSize?: number;
        followGateEnabled?: boolean;
        followGateMessage?: string;
        followGateRequirements?: {
          minFollowsRequired?: number;
          requireEmail?: boolean;
          requireInstagram?: boolean;
          requireSpotify?: boolean;
          requireTiktok?: boolean;
          requireYoutube?: boolean;
        };
        followGateSocialLinks?: {
          instagram?: string;
          spotify?: string;
          tiktok?: string;
          youtube?: string;
        };
        genre?: Array<string>;
        id: Id<"digitalProducts">;
        imageUrl?: string;
        installationNotes?: string;
        isPinned?: boolean;
        isPublished?: boolean;
        macroCount?: number;
        macroScreenshotUrls?: Array<string>;
        mediaType?: "youtube" | "spotify" | "website" | "social";
        minAbletonVersion?: string;
        musicalKey?: string;
        orderBumpDescription?: string;
        orderBumpEnabled?: boolean;
        orderBumpImageUrl?: string;
        orderBumpPrice?: number;
        orderBumpProductName?: string;
        packFiles?: string;
        pinnedAt?: number;
        price?: number;
        pricingModel?: "free_with_gate" | "paid";
        productType?:
          | "digital"
          | "urlMedia"
          | "coaching"
          | "effectChain"
          | "abletonRack"
          | "abletonPreset"
          | "playlistCuration";
        rackType?: "audioEffect" | "instrument" | "midiEffect" | "drumRack";
        requiresMaxForLive?: boolean;
        sessionType?: string;
        stemsUrl?: string;
        style?: "button" | "callout" | "preview" | "card" | "minimal";
        tags?: Array<string>;
        thirdPartyPlugins?: Array<string>;
        title?: string;
        trackoutsUrl?: string;
        url?: string;
        wavUrl?: string;
      },
      {
        _creationTime: number;
        _id: Id<"digitalProducts">;
        abletonVersion?: string;
        affiliateCommissionRate?: number;
        affiliateCookieDuration?: number;
        affiliateEnabled?: boolean;
        affiliateMinPayout?: number;
        availability?: any;
        beatLeaseConfig?: {
          bpm?: number;
          genre?: string;
          key?: string;
          tiers?: Array<{
            commercialUse: boolean;
            creditRequired: boolean;
            distributionLimit?: number;
            enabled: boolean;
            musicVideoUse: boolean;
            name: string;
            price: number;
            radioBroadcasting: boolean;
            stemsIncluded: boolean;
            streamingLimit?: number;
            type: "basic" | "premium" | "exclusive" | "unlimited";
          }>;
        };
        bpm?: number;
        buttonLabel?: string;
        chainImageUrl?: string;
        complexity?: "beginner" | "intermediate" | "advanced";
        confirmationEmailBody?: string;
        confirmationEmailSubject?: string;
        cpuLoad?: "low" | "medium" | "high";
        customFields?: any;
        dawType?:
          | "ableton"
          | "fl-studio"
          | "logic"
          | "bitwig"
          | "studio-one"
          | "reason"
          | "cubase"
          | "multi-daw";
        dawVersion?: string;
        demoAudioUrl?: string;
        description?: string;
        discordRoleId?: string;
        displayStyle?: "embed" | "card" | "button";
        downloadUrl?: string;
        duration?: number;
        effectType?: Array<string>;
        exclusivePurchaseId?: Id<"purchases">;
        exclusiveSoldAt?: number;
        exclusiveSoldTo?: string;
        fileFormat?: "adg" | "adv" | "alp";
        fileSize?: number;
        followGateEnabled?: boolean;
        followGateMessage?: string;
        followGateRequirements?: {
          minFollowsRequired?: number;
          requireEmail?: boolean;
          requireInstagram?: boolean;
          requireSpotify?: boolean;
          requireTiktok?: boolean;
          requireYoutube?: boolean;
        };
        followGateSocialLinks?: {
          instagram?: string;
          spotify?: string;
          tiktok?: string;
          youtube?: string;
        };
        genre?: Array<string>;
        imageUrl?: string;
        installationNotes?: string;
        isPinned?: boolean;
        isPublished?: boolean;
        macroCount?: number;
        macroScreenshotUrls?: Array<string>;
        mediaType?: "youtube" | "spotify" | "website" | "social";
        minAbletonVersion?: string;
        musicalKey?: string;
        orderBumpDescription?: string;
        orderBumpEnabled?: boolean;
        orderBumpImageUrl?: string;
        orderBumpPrice?: number;
        orderBumpProductName?: string;
        packFiles?: string;
        pinnedAt?: number;
        price: number;
        productCategory?: string;
        productType?:
          | "digital"
          | "urlMedia"
          | "coaching"
          | "effectChain"
          | "abletonRack"
          | "abletonPreset"
          | "playlistCuration";
        rackType?: "audioEffect" | "instrument" | "midiEffect" | "drumRack";
        requiresMaxForLive?: boolean;
        sessionType?: string;
        slug?: string;
        stemsUrl?: string;
        storeId: string;
        style?: "button" | "callout" | "preview" | "card" | "minimal";
        tags?: Array<string>;
        thirdPartyPlugins?: Array<string>;
        thumbnailStyle?: string;
        title: string;
        trackoutsUrl?: string;
        url?: string;
        userId: string;
        wavUrl?: string;
      } | null
    >;
  };
  directMessages: {
    getConversationDetails: FunctionReference<
      "query",
      "public",
      { conversationId: Id<"dmConversations"> },
      any
    >;
    getConversations: FunctionReference<"query", "public", {}, any>;
    getMessages: FunctionReference<
      "query",
      "public",
      { conversationId: Id<"dmConversations">; limit?: number },
      any
    >;
    getOrCreateConversation: FunctionReference<
      "mutation",
      "public",
      { otherUserId: string },
      any
    >;
    getTotalUnreadCount: FunctionReference<"query", "public", {}, any>;
    markAsRead: FunctionReference<
      "mutation",
      "public",
      { conversationId: Id<"dmConversations"> },
      any
    >;
    searchUsersForDM: FunctionReference<
      "query",
      "public",
      { limit?: number; searchQuery: string },
      any
    >;
    sendMessage: FunctionReference<
      "mutation",
      "public",
      {
        attachments?: Array<{
          id: string;
          name: string;
          size: number;
          storageId: string;
          type: string;
        }>;
        content: string;
        conversationId: Id<"dmConversations">;
      },
      any
    >;
  };
  discord: {
    addUserToGuild: FunctionReference<
      "action",
      "public",
      { guildId: string; userId: string },
      { error?: string; success: boolean }
    >;
    assignDiscordRole: FunctionReference<
      "action",
      "public",
      { guildId: string; roleId: string; userId: string },
      { error?: string; success: boolean }
    >;
    syncUserRoles: FunctionReference<
      "action",
      "public",
      { storeId: Id<"stores">; userId: string },
      { error?: string; rolesAssigned: number; success: boolean }
    >;
  };
  discordPublic: {
    connectDiscordAccount: FunctionReference<
      "mutation",
      "public",
      {
        accessToken: string;
        discordAvatar?: string;
        discordDiscriminator?: string;
        discordUserId: string;
        discordUsername: string;
        expiresIn: number;
        refreshToken: string;
        userId: string;
      },
      {
        connectionId?: Id<"discordIntegrations">;
        error?: string;
        success: boolean;
      }
    >;
    disconnectDiscord: FunctionReference<
      "mutation",
      "public",
      { userId: string },
      { success: boolean }
    >;
    getStoreDiscordGuild: FunctionReference<
      "query",
      "public",
      { storeId: Id<"stores"> },
      {
        _id: Id<"discordGuilds">;
        guildId: string;
        guildName: string;
        inviteCode?: string;
        isActive: boolean;
      } | null
    >;
    getUserDiscordConnection: FunctionReference<
      "query",
      "public",
      { userId: string },
      {
        _id: Id<"discordIntegrations">;
        connectedAt: number;
        discordAvatar?: string;
        discordUserId: string;
        discordUsername: string;
        guildMemberStatus?: string;
        lastSyncedAt: number;
        userId: string;
      } | null
    >;
    updateDiscordGuildConfig: FunctionReference<
      "mutation",
      "public",
      {
        botToken: string;
        courseRoles?: any;
        guildId: string;
        guildName: string;
        inviteCode?: string;
        isActive: boolean;
        storeId: Id<"stores">;
      },
      { guildConfigId?: Id<"discordGuilds">; success: boolean }
    >;
  };
  domainVerification: {
    verifyDomainDNS: FunctionReference<
      "action",
      "public",
      { domain: string; storeId: Id<"stores"> },
      {
        aRecordValid: boolean;
        cnameRecordValid: boolean;
        message: string;
        status: string;
        success: boolean;
      }
    >;
  };
  dripCampaigns: {
    addStep: FunctionReference<
      "mutation",
      "public",
      {
        campaignId: Id<"dripCampaigns">;
        delayMinutes: number;
        htmlContent: string;
        stepNumber: number;
        subject: string;
        textContent?: string;
      },
      Id<"dripCampaignSteps">
    >;
    createCampaign: FunctionReference<
      "mutation",
      "public",
      {
        description?: string;
        name: string;
        storeId: string;
        triggerConfig?: any;
        triggerType:
          | "lead_signup"
          | "product_purchase"
          | "tag_added"
          | "manual";
      },
      Id<"dripCampaigns">
    >;
    deleteCampaign: FunctionReference<
      "mutation",
      "public",
      { campaignId: Id<"dripCampaigns"> },
      null
    >;
    deleteStep: FunctionReference<
      "mutation",
      "public",
      { stepId: Id<"dripCampaignSteps"> },
      null
    >;
    enrollContact: FunctionReference<
      "mutation",
      "public",
      {
        campaignId: Id<"dripCampaigns">;
        customerId?: string;
        email: string;
        metadata?: any;
        name?: string;
      },
      Id<"dripCampaignEnrollments"> | null
    >;
    getAllDripCampaigns: FunctionReference<"query", "public", {}, Array<any>>;
    getCampaign: FunctionReference<
      "query",
      "public",
      { campaignId: Id<"dripCampaigns"> },
      any
    >;
    getCampaignsByStore: FunctionReference<
      "query",
      "public",
      { storeId: string },
      Array<any>
    >;
    getEnrollmentsByEmail: FunctionReference<
      "query",
      "public",
      { email: string },
      Array<any>
    >;
    toggleCampaign: FunctionReference<
      "mutation",
      "public",
      { campaignId: Id<"dripCampaigns"> },
      { isActive: boolean }
    >;
    unenrollContact: FunctionReference<
      "mutation",
      "public",
      { campaignId: Id<"dripCampaigns">; email: string },
      boolean
    >;
    updateStep: FunctionReference<
      "mutation",
      "public",
      {
        delayMinutes?: number;
        htmlContent?: string;
        isActive?: boolean;
        stepId: Id<"dripCampaignSteps">;
        subject?: string;
        textContent?: string;
      },
      null
    >;
  };
  emailABTesting: {
    assignVariant: FunctionReference<
      "query",
      "public",
      { testId: Id<"emailABTests">; userId: string },
      { variantId: string; variantName: string; variantValue: string }
    >;
    createABTest: FunctionReference<
      "mutation",
      "public",
      {
        campaignId: Id<"resendCampaigns">;
        sampleSize: number;
        testType: "subject" | "content" | "send_time" | "from_name";
        variants: Array<{ name: string; percentage: number; value: string }>;
        winnerMetric: "open_rate" | "click_rate" | "conversion_rate";
      },
      Id<"emailABTests">
    >;
    getABTestByCampaign: FunctionReference<
      "query",
      "public",
      { campaignId: Id<"resendCampaigns"> },
      any | null
    >;
    getAllABTests: FunctionReference<
      "query",
      "public",
      { status?: "draft" | "running" | "analyzing" | "completed" },
      Array<any>
    >;
    recordABTestResult: FunctionReference<
      "mutation",
      "public",
      {
        eventType: "sent" | "delivered" | "opened" | "clicked" | "converted";
        testId: Id<"emailABTests">;
        variantId: string;
      },
      { success: boolean }
    >;
    sendWinnerToRemaining: FunctionReference<
      "mutation",
      "public",
      { testId: Id<"emailABTests"> },
      { message: string; success: boolean }
    >;
    startABTest: FunctionReference<
      "mutation",
      "public",
      { testId: Id<"emailABTests"> },
      { message: string; success: boolean }
    >;
  };
  emailCampaigns: {
    addAllCustomersAsRecipients: FunctionReference<
      "mutation",
      "public",
      {
        batchSize?: number;
        campaignId: Id<"emailCampaigns">;
        currentTotalCount?: number;
        cursor?: string;
        storeId: string;
      },
      {
        addedCount: number;
        hasMore: boolean;
        nextCursor?: string;
        totalCount: number;
      }
    >;
    addRecipients: FunctionReference<
      "mutation",
      "public",
      { campaignId: Id<"emailCampaigns">; customerIds: Array<Id<"customers">> },
      number
    >;
    addRecipientsFromTags: FunctionReference<
      "mutation",
      "public",
      {
        campaignId: Id<"emailCampaigns">;
        excludeTagIds?: Array<Id<"emailTags">>;
        storeId: string;
        targetTagIds: Array<Id<"emailTags">>;
        targetTagMode?: "all" | "any";
      },
      { addedCount: number; skippedCount: number; totalRecipients: number }
    >;
    createCampaign: FunctionReference<
      "mutation",
      "public",
      {
        adminUserId: string;
        content: string;
        fromEmail: string;
        name: string;
        previewText?: string;
        replyToEmail?: string;
        storeId: string;
        subject: string;
        tags?: Array<string>;
        templateId?: string;
      },
      Id<"emailCampaigns">
    >;
    deleteCampaign: FunctionReference<
      "mutation",
      "public",
      { campaignId: Id<"emailCampaigns"> },
      null
    >;
    duplicateAllRecipients: FunctionReference<
      "mutation",
      "public",
      {
        batchSize?: number;
        currentTotalCount?: number;
        cursor?: string;
        sourceCampaignId: Id<"emailCampaigns">;
        targetCampaignId: Id<"emailCampaigns">;
      },
      {
        addedCount: number;
        hasMore: boolean;
        nextCursor?: string;
        totalCount: number;
      }
    >;
    getCampaign: FunctionReference<
      "query",
      "public",
      { campaignId: Id<"emailCampaigns"> },
      null | {
        _creationTime: number;
        _id: Id<"emailCampaigns">;
        adminUserId: string;
        clickedCount?: number;
        content: string;
        deliveredCount?: number;
        fromEmail: string;
        name: string;
        openedCount?: number;
        previewText?: string;
        recipientCount?: number;
        replyToEmail?: string;
        scheduledAt?: number;
        sentAt?: number;
        sentCount?: number;
        status: "draft" | "scheduled" | "sending" | "sent" | "failed";
        storeId: string;
        subject: string;
        tags?: Array<string>;
        templateId?: string;
        updatedAt?: number;
      }
    >;
    getCampaignForSending: FunctionReference<
      "query",
      "public",
      { campaignId: Id<"emailCampaigns"> },
      null | {
        _id: Id<"emailCampaigns">;
        content: string;
        fromEmail: string;
        name: string;
        recipientCount?: number;
        replyToEmail?: string;
        status: "draft" | "scheduled" | "sending" | "sent" | "failed";
        subject: string;
      }
    >;
    getCampaignRecipients: FunctionReference<
      "query",
      "public",
      {
        campaignId: Id<"emailCampaigns">;
        status?:
          | "queued"
          | "sent"
          | "delivered"
          | "opened"
          | "clicked"
          | "bounced"
          | "failed";
      },
      Array<{
        _creationTime: number;
        _id: Id<"emailCampaignRecipients">;
        campaignId: Id<"emailCampaigns">;
        clickedAt?: number;
        customerEmail: string;
        customerId: Id<"customers">;
        customerName: string;
        deliveredAt?: number;
        errorMessage?: string;
        openedAt?: number;
        resendMessageId?: string;
        sentAt?: number;
        status:
          | "queued"
          | "sent"
          | "delivered"
          | "opened"
          | "clicked"
          | "bounced"
          | "failed";
      }>
    >;
    getCampaigns: FunctionReference<
      "query",
      "public",
      {
        status?: "draft" | "scheduled" | "sending" | "sent" | "failed";
        storeId: string;
      },
      Array<{
        _creationTime: number;
        _id: Id<"emailCampaigns">;
        adminUserId: string;
        clickedCount?: number;
        content: string;
        deliveredCount?: number;
        fromEmail: string;
        name: string;
        openedCount?: number;
        previewText?: string;
        recipientCount?: number;
        replyToEmail?: string;
        scheduledAt?: number;
        sentAt?: number;
        sentCount?: number;
        status: "draft" | "scheduled" | "sending" | "sent" | "failed";
        storeId: string;
        subject: string;
        tags?: Array<string>;
        templateId?: string;
        updatedAt?: number;
      }>
    >;
    getTagPreview: FunctionReference<
      "query",
      "public",
      {
        excludeTagIds?: Array<Id<"emailTags">>;
        storeId: string;
        targetTagIds: Array<Id<"emailTags">>;
        targetTagMode?: "all" | "any";
      },
      {
        matchingContacts: number;
        matchingCustomers: number;
        sampleEmails: Array<string>;
      }
    >;
    removeRecipients: FunctionReference<
      "mutation",
      "public",
      { campaignId: Id<"emailCampaigns">; customerIds: Array<Id<"customers">> },
      number
    >;
    updateCampaign: FunctionReference<
      "mutation",
      "public",
      {
        campaignId: Id<"emailCampaigns">;
        content?: string;
        fromEmail?: string;
        name?: string;
        replyToEmail?: string;
        subject?: string;
        tags?: Array<string>;
      },
      null
    >;
    updateCampaignStatus: FunctionReference<
      "mutation",
      "public",
      {
        campaignId: Id<"emailCampaigns">;
        deliveredCount?: number;
        sentAt?: number;
        status: "draft" | "scheduled" | "sending" | "sent" | "failed";
      },
      null
    >;
  };
  emailContacts: {
    addTagToContact: FunctionReference<
      "mutation",
      "public",
      { contactId: Id<"emailContacts">; tagId: Id<"emailTags"> },
      null
    >;
    addTagToContactWithJunction: FunctionReference<
      "mutation",
      "public",
      { contactId: Id<"emailContacts">; tagId: Id<"emailTags"> },
      boolean
    >;
    bulkAddTagToContacts: FunctionReference<
      "mutation",
      "public",
      { contactIds: Array<Id<"emailContacts">>; tagId: Id<"emailTags"> },
      { added: number; skipped: number }
    >;
    bulkImportContacts: FunctionReference<
      "mutation",
      "public",
      {
        contacts: Array<{
          email: string;
          firstName?: string;
          lastName?: string;
          tagNames?: Array<string>;
        }>;
        source?: string;
        storeId: string;
      },
      { errors: Array<string>; imported: number; skipped: number }
    >;
    createContact: FunctionReference<
      "mutation",
      "public",
      {
        customFields?: any;
        email: string;
        firstName?: string;
        lastName?: string;
        source?: string;
        sourceCourseId?: Id<"courses">;
        sourceProductId?: Id<"digitalProducts">;
        storeId: string;
        tagIds?: Array<Id<"emailTags">>;
        userId: string;
      },
      Id<"emailContacts">
    >;
    debugTagFilter: FunctionReference<
      "query",
      "public",
      { storeId: string; tagId: Id<"emailTags"> },
      any
    >;
    deleteContact: FunctionReference<
      "mutation",
      "public",
      { contactId: Id<"emailContacts">; userId: string },
      null
    >;
    findDuplicateContacts: FunctionReference<
      "action",
      "public",
      { storeId: string },
      {
        duplicateCount: number;
        topDuplicates: Array<{ count: number; email: string }>;
        totalContacts: number;
        uniqueEmails: number;
      }
    >;
    getContact: FunctionReference<
      "query",
      "public",
      { contactId: Id<"emailContacts"> },
      any
    >;
    getContactActivity: FunctionReference<
      "query",
      "public",
      { contactId: Id<"emailContacts">; limit?: number },
      Array<any>
    >;
    getContactByEmail: FunctionReference<
      "query",
      "public",
      { email: string; storeId: string },
      any
    >;
    getContactStats: FunctionReference<
      "query",
      "public",
      { storeId: string },
      {
        avgEngagement: number;
        bounced: number;
        isEstimate?: boolean;
        subscribed: number;
        total: number;
        unsubscribed: number;
      }
    >;
    importContacts: FunctionReference<
      "mutation",
      "public",
      {
        contacts: Array<{
          email: string;
          firstName?: string;
          lastName?: string;
        }>;
        storeId: string;
      },
      { errors: number; imported: number; skipped: number }
    >;
    listContacts: FunctionReference<
      "query",
      "public",
      {
        cursor?: string;
        limit?: number;
        noTags?: boolean;
        status?: "subscribed" | "unsubscribed" | "bounced" | "complained";
        storeId: string;
        tagId?: Id<"emailTags">;
      },
      { contacts: Array<any>; hasMore: boolean; nextCursor: string | null }
    >;
    migrateTagsToJunctionTable: FunctionReference<
      "mutation",
      "public",
      { batchSize?: number; cursor?: string; storeId: string },
      {
        created: number;
        done: boolean;
        nextCursor: string | null;
        processed: number;
      }
    >;
    recalculateContactStats: FunctionReference<
      "action",
      "public",
      { storeId: string },
      { message: string; success: boolean }
    >;
    removeDuplicateContacts: FunctionReference<
      "action",
      "public",
      { dryRun?: boolean; storeId: string },
      { deleted: number; errors: number; kept: number; processed: number }
    >;
    removeTagFromContact: FunctionReference<
      "mutation",
      "public",
      { contactId: Id<"emailContacts">; tagId: Id<"emailTags"> },
      null
    >;
    removeTagFromContactWithJunction: FunctionReference<
      "mutation",
      "public",
      { contactId: Id<"emailContacts">; tagId: Id<"emailTags"> },
      boolean
    >;
    runFullTagMigration: FunctionReference<
      "action",
      "public",
      { storeId: string },
      { batches: number; totalCreated: number; totalProcessed: number }
    >;
    searchContacts: FunctionReference<
      "query",
      "public",
      { limit?: number; search?: string; storeId: string },
      Array<any>
    >;
    syncCustomersToEmailContacts: FunctionReference<
      "mutation",
      "public",
      { batchSize?: number; storeId: string },
      { skipped: number; synced: number; total: number }
    >;
    syncEnrolledUsersToEmailContacts: FunctionReference<
      "mutation",
      "public",
      { storeId: string },
      { errors: Array<string>; skipped: number; synced: number; total: number }
    >;
    updateContact: FunctionReference<
      "mutation",
      "public",
      {
        contactId: Id<"emailContacts">;
        customFields?: any;
        firstName?: string;
        lastName?: string;
        status?: "subscribed" | "unsubscribed" | "bounced" | "complained";
        userId: string;
      },
      null
    >;
  };
  emailContactSync: {
    createPrebuiltSegments: FunctionReference<
      "mutation",
      "public",
      { storeId: string },
      {
        created: number;
        segments: Array<{ name: string; tagId: Id<"emailTags"> }>;
        skipped: number;
      }
    >;
    debugContactTags: FunctionReference<
      "query",
      "public",
      { email: string; storeId: string },
      any
    >;
    getContactsByTags: FunctionReference<
      "query",
      "public",
      {
        excludeTagIds?: Array<Id<"emailTags">>;
        limit?: number;
        mode?: "all" | "any";
        storeId: string;
        tagIds: Array<Id<"emailTags">>;
      },
      Array<{
        contactId: Id<"emailContacts">;
        email: string;
        engagementScore?: number;
        name?: string;
      }>
    >;
    getProductPurchasers: FunctionReference<
      "query",
      "public",
      {
        courseId?: Id<"courses">;
        limit?: number;
        productId?: Id<"digitalProducts">;
        storeId: string;
      },
      Array<{
        contactId?: Id<"emailContacts">;
        email: string;
        hasProductTag: boolean;
        name?: string;
        purchaseDate: number;
      }>
    >;
    getSegmentsByTag: FunctionReference<
      "query",
      "public",
      { storeId: string },
      Array<{
        color: string;
        contactCount: number;
        description?: string;
        displayName: string;
        tagId: Id<"emailTags">;
        tagName: string;
      }>
    >;
    manualTagContact: FunctionReference<
      "mutation",
      "public",
      { email: string; storeId: string; tags: Array<string> },
      { contactId: Id<"emailContacts"> | null; tagsAdded: Array<string> }
    >;
    retagAllContacts: FunctionReference<
      "mutation",
      "public",
      { batchSize?: number; cursor?: string; storeId: string },
      {
        done: boolean;
        errors: number;
        nextCursor: string | null;
        processed: number;
        tagsAdded: number;
      }
    >;
    tagContactWithEnrollments: FunctionReference<
      "mutation",
      "public",
      { contactId: Id<"emailContacts">; storeId: string },
      { error?: string; success: boolean; tagsAdded: Array<string> }
    >;
    tagEnrolledUsersWithCourseTags: FunctionReference<
      "mutation",
      "public",
      { batchSize?: number; cursor?: string; storeId: string },
      {
        done: boolean;
        errors: number;
        nextCursor: string | null;
        processed: number;
        tagsAdded: number;
      }
    >;
    tagProductPurchasers: FunctionReference<
      "mutation",
      "public",
      {
        courseId?: Id<"courses">;
        productId?: Id<"digitalProducts">;
        storeId: string;
      },
      {
        alreadyTagged: number;
        contactsTagged: number;
        noContact: number;
        processed: number;
        productTitle?: string;
      }
    >;
  };
  emailCopyGenerator: {
    generateEmailCopy: FunctionReference<
      "action",
      "public",
      {
        creatorName: string;
        productInfo: {
          creditPrice?: number;
          description?: string;
          duration?: number;
          features?: Array<string>;
          genres?: Array<string>;
          moduleCount?: number;
          name: string;
          price?: number;
          sampleCount?: number;
          type: string;
        };
        templateBody: string;
        templateSubject: string;
        tone?: string;
      },
      { body: string; previewText: string; subject: string }
    >;
  };
  emailCreatorAnalytics: {
    getBestSendTimes: FunctionReference<
      "query",
      "public",
      { storeId: string },
      Array<{
        clickRate: number;
        dayOfWeek: number;
        hour: number;
        openRate: number;
        totalOpens: number;
      }>
    >;
    getCreatorEmailMetrics: FunctionReference<
      "query",
      "public",
      { days?: number; storeId: string },
      {
        bounceRate: number;
        clickRate: number;
        openRate: number;
        totalBounced: number;
        totalClicked: number;
        totalDelivered: number;
        totalOpened: number;
        totalSent: number;
        totalUnsubscribed: number;
        unsubscribeRate: number;
      }
    >;
    getDailyEmailActivity: FunctionReference<
      "query",
      "public",
      { days?: number; storeId: string },
      Array<{ clicked: number; date: string; opened: number; sent: number }>
    >;
    getEngagementBreakdown: FunctionReference<
      "query",
      "public",
      { storeId: string },
      {
        engaged: number;
        highlyEngaged: number;
        inactive: number;
        lowEngagement: number;
        total: number;
      }
    >;
    getRecentActivity: FunctionReference<
      "query",
      "public",
      { limit?: number; storeId: string },
      Array<{
        contactEmail: string;
        contactName?: string;
        id: string;
        metadata?: any;
        timestamp: number;
        type: string;
      }>
    >;
    getTopPerformingEmails: FunctionReference<
      "query",
      "public",
      { limit?: number; storeId: string },
      Array<{
        clickRate: number;
        clicked: number;
        emailSubject: string;
        openRate: number;
        opened: number;
        sent: number;
        workflowName?: string;
      }>
    >;
    getWorkflowAnalytics: FunctionReference<
      "query",
      "public",
      { storeId: string },
      Array<{
        completionRate: number;
        isActive: boolean;
        totalActive: number;
        totalCompleted: number;
        totalEnrolled: number;
        workflowId: string;
        workflowName: string;
      }>
    >;
  };
  emailCreatorSegments: {
    createSegment: FunctionReference<
      "mutation",
      "public",
      {
        conditions: Array<{
          field: string;
          id: string;
          logic?: "AND" | "OR";
          operator:
            | "equals"
            | "not_equals"
            | "greater_than"
            | "less_than"
            | "contains"
            | "not_contains"
            | "is_empty"
            | "is_not_empty"
            | "in_list"
            | "not_in_list"
            | "before"
            | "after"
            | "between";
          value: any;
        }>;
        description?: string;
        isDynamic: boolean;
        name: string;
        storeId: string;
      },
      Id<"creatorEmailSegments">
    >;
    deleteSegment: FunctionReference<
      "mutation",
      "public",
      { segmentId: Id<"creatorEmailSegments"> },
      { success: boolean }
    >;
    duplicateSegment: FunctionReference<
      "mutation",
      "public",
      { segmentId: Id<"creatorEmailSegments"> },
      Id<"creatorEmailSegments">
    >;
    getCreatorSegments: FunctionReference<
      "query",
      "public",
      { storeId: string },
      Array<any>
    >;
    getSegmentById: FunctionReference<
      "query",
      "public",
      { segmentId: Id<"creatorEmailSegments"> },
      any | null
    >;
    getSegmentContactIds: FunctionReference<
      "query",
      "public",
      { segmentId: Id<"creatorEmailSegments"> },
      Array<Id<"emailContacts">>
    >;
    getSegmentContacts: FunctionReference<
      "query",
      "public",
      {
        limit?: number;
        offset?: number;
        segmentId: Id<"creatorEmailSegments">;
      },
      { contacts: Array<any>; total: number }
    >;
    previewSegment: FunctionReference<
      "query",
      "public",
      {
        conditions: Array<{
          field: string;
          id: string;
          logic?: "AND" | "OR";
          operator:
            | "equals"
            | "not_equals"
            | "greater_than"
            | "less_than"
            | "contains"
            | "not_contains"
            | "is_empty"
            | "is_not_empty"
            | "in_list"
            | "not_in_list"
            | "before"
            | "after"
            | "between";
          value: any;
        }>;
        limit?: number;
        storeId: string;
      },
      {
        contacts: Array<{
          _id: Id<"emailContacts">;
          email: string;
          firstName?: string;
          lastName?: string;
          tags: Array<string>;
        }>;
        count: number;
      }
    >;
    refreshSegment: FunctionReference<
      "mutation",
      "public",
      { segmentId: Id<"creatorEmailSegments"> },
      { memberCount: number; success: boolean }
    >;
    updateSegment: FunctionReference<
      "mutation",
      "public",
      {
        conditions?: Array<{
          field: string;
          id: string;
          logic?: "AND" | "OR";
          operator:
            | "equals"
            | "not_equals"
            | "greater_than"
            | "less_than"
            | "contains"
            | "not_contains"
            | "is_empty"
            | "is_not_empty"
            | "in_list"
            | "not_in_list"
            | "before"
            | "after"
            | "between";
          value: any;
        }>;
        description?: string;
        isDynamic?: boolean;
        name?: string;
        segmentId: Id<"creatorEmailSegments">;
      },
      { success: boolean }
    >;
  };
  emailDeliverability: {
    cleanBouncedContacts: FunctionReference<
      "mutation",
      "public",
      { hardBouncesOnly?: boolean; storeId: string },
      any
    >;
    getBounceRateByDomain: FunctionReference<
      "query",
      "public",
      { storeId: string },
      any
    >;
    getDeliverabilityEvents: FunctionReference<
      "query",
      "public",
      {
        eventType?:
          | "hard_bounce"
          | "soft_bounce"
          | "spam_complaint"
          | "blocked"
          | "unsubscribe"
          | "delivery_delay";
        limit?: number;
        storeId: string;
      },
      any
    >;
    getDeliverabilityHealth: FunctionReference<
      "query",
      "public",
      { storeId: string },
      any
    >;
    getDeliverabilityTrends: FunctionReference<
      "query",
      "public",
      {
        limit?: number;
        period: "daily" | "weekly" | "monthly";
        storeId: string;
      },
      any
    >;
    getDomainReputation: FunctionReference<
      "query",
      "public",
      { storeId: string },
      any
    >;
    getProblematicContacts: FunctionReference<
      "query",
      "public",
      { limit?: number; storeId: string },
      any
    >;
    markEventProcessed: FunctionReference<
      "mutation",
      "public",
      { eventId: Id<"emailDeliverabilityEvents"> },
      any
    >;
    recordDeliverabilityEvent: FunctionReference<
      "mutation",
      "public",
      {
        broadcastId?: string;
        email: string;
        emailId?: string;
        eventType:
          | "hard_bounce"
          | "soft_bounce"
          | "spam_complaint"
          | "blocked"
          | "unsubscribe"
          | "delivery_delay";
        reason?: string;
        storeId: string;
        workflowId?: Id<"emailWorkflows">;
      },
      any
    >;
  };
  emailHealthMonitoring: {
    getDomainHealthStats: FunctionReference<
      "query",
      "public",
      {},
      {
        bounceRate: number;
        deliveryRate: number;
        domain: string;
        openRate: number;
        reputationScore: number;
        reputationStatus: string;
        reputationTrend: string;
        sentThisMonth: number;
        sentThisWeek: number;
        sentToday: number;
        spamRate: number;
        status: string;
        totalBounced: number;
        totalComplained: number;
        totalDelivered: number;
        totalOpened: number;
        totalSent: number;
      }
    >;
    getEmailHealthHistory: FunctionReference<
      "query",
      "public",
      { connectionId?: Id<"resendConnections">; days?: number },
      Array<any>
    >;
    getEmailHealthMetrics: FunctionReference<
      "query",
      "public",
      {
        connectionId?: Id<"resendConnections">;
        period?: "daily" | "weekly" | "monthly";
      },
      {
        _creationTime: number;
        _id: Id<"emailHealthMetrics">;
        activeSubscribers: number;
        bounceRate: number;
        connectionId?: Id<"resendConnections">;
        createdAt: number;
        date: number;
        deliverabilityScore: number;
        engagementRate: number;
        engagementTrend: "up" | "down" | "stable";
        inactiveSubscribers: number;
        listHealthScore: number;
        period: "daily" | "weekly" | "monthly";
        recommendations: Array<{
          message: string;
          priority: "high" | "medium" | "low";
          type: "warning" | "alert" | "suggestion";
        }>;
        spamComplaintRate: number;
        subscriberGrowth: number;
        totalSubscribers: number;
        unsubscribeRate: number;
      } | null
    >;
  };
  emailLeadScoring: {
    getLeadScoreDistribution: FunctionReference<
      "query",
      "public",
      {},
      {
        averageScore: number;
        gradeA: number;
        gradeB: number;
        gradeC: number;
        gradeD: number;
        totalLeads: number;
      }
    >;
    getTopLeads: FunctionReference<
      "query",
      "public",
      { grade?: "A" | "B" | "C" | "D"; limit?: number; minScore?: number },
      Array<any>
    >;
    getUserLeadScore: FunctionReference<
      "query",
      "public",
      { userId: string },
      {
        _creationTime: number;
        _id: Id<"leadScores">;
        courseEngagement: number;
        createdAt: number;
        daysSinceLastActivity: number;
        emailEngagement: number;
        grade: "A" | "B" | "C" | "D";
        lastActivity: number;
        lastDecayAt: number;
        purchaseActivity: number;
        score: number;
        scoreHistory: Array<{
          reason: string;
          score: number;
          timestamp: number;
        }>;
        totalEmailsClicked: number;
        totalEmailsOpened: number;
        totalPurchases: number;
        updatedAt: number;
        userId: string;
      } | null
    >;
    updateLeadScore: FunctionReference<
      "mutation",
      "public",
      {
        activityType:
          | "email_opened"
          | "email_clicked"
          | "course_enrolled"
          | "course_progress_50"
          | "course_completed"
          | "purchase"
          | "quiz_completed"
          | "certificate_earned"
          | "bounced"
          | "unsubscribed";
        metadata?: any;
        userId: string;
      },
      { newGrade: "A" | "B" | "C" | "D"; newScore: number; pointsAdded: number }
    >;
  };
  emailPreview: {
    analyzeReadability: FunctionReference<
      "query",
      "public",
      { body: string },
      any
    >;
    analyzeSpamScore: FunctionReference<
      "query",
      "public",
      { body: string; subject: string },
      any
    >;
    getFullAnalysis: FunctionReference<
      "query",
      "public",
      { body: string; subject: string },
      any
    >;
    getTestEmailHistory: FunctionReference<
      "query",
      "public",
      { limit?: number; storeId: string },
      any
    >;
    previewWithData: FunctionReference<
      "query",
      "public",
      {
        body: string;
        previewData?: {
          courseUrl?: string;
          creatorName?: string;
          downloadUrl?: string;
          email?: string;
          firstName?: string;
          lastName?: string;
          libraryUrl?: string;
          productName?: string;
          productUrl?: string;
          reviewUrl?: string;
          storeName?: string;
          storeUrl?: string;
        };
        subject: string;
      },
      any
    >;
    recordTestEmail: FunctionReference<
      "mutation",
      "public",
      {
        recipient: string;
        storeId: string;
        subject: string;
        templateId?: string;
        userId: string;
      },
      any
    >;
    validateLinks: FunctionReference<"query", "public", { body: string }, any>;
  };
  emailQueries: {
    cancelImport: FunctionReference<
      "mutation",
      "public",
      { importId: Id<"resendImportedContacts"> },
      any
    >;
    connectAdminResend: FunctionReference<
      "mutation",
      "public",
      {
        fromEmail: string;
        fromName: string;
        replyToEmail?: string;
        resendApiKey: string;
        userId: string;
      },
      any
    >;
    connectStoreResend: FunctionReference<
      "mutation",
      "public",
      {
        fromEmail: string;
        fromName: string;
        replyToEmail?: string;
        resendApiKey: string;
        storeId: Id<"stores">;
        userId: string;
      },
      any
    >;
    createAudienceFromImport: FunctionReference<
      "mutation",
      "public",
      {
        connectionId: Id<"resendConnections">;
        description: string;
        name: string;
        userIds: Array<string>;
      },
      any
    >;
    createAutomation: FunctionReference<
      "mutation",
      "public",
      {
        delayMinutes: number;
        name: string;
        templateId: Id<"resendTemplates">;
        trigger:
          | "user_enrolled"
          | "course_completed"
          | "user_inactive"
          | "certificate_issued"
          | "user_registered";
      },
      Id<"resendAutomations">
    >;
    createCampaign: FunctionReference<
      "mutation",
      "public",
      {
        audienceType: "all" | "enrolled" | "active" | "specific" | "creators";
        htmlContent?: string;
        name: string;
        scheduledFor?: number;
        specificUserIds?: Array<Id<"users">>;
        subject: string;
        templateId?: Id<"resendTemplates">;
        textContent?: string;
      },
      Id<"resendCampaigns">
    >;
    createStoreAutomation: FunctionReference<
      "mutation",
      "public",
      {
        connectionId: Id<"resendConnections">;
        delayMinutes?: number;
        description: string;
        inactivityDays?: number;
        name: string;
        progressThreshold?: number;
        templateId: Id<"resendTemplates">;
        triggerCourseId?: Id<"courses">;
        triggerStoreId?: Id<"stores">;
        triggerType:
          | "user_signup"
          | "course_enrollment"
          | "course_progress"
          | "course_completion"
          | "certificate_issued"
          | "purchase"
          | "inactivity"
          | "quiz_completion"
          | "milestone";
      },
      any
    >;
    createStoreCampaign: FunctionReference<
      "mutation",
      "public",
      {
        connectionId: Id<"resendConnections">;
        customRecipients?: Array<string>;
        htmlContent?: string;
        name: string;
        scheduledFor?: number;
        subject: string;
        targetAudience:
          | "all_users"
          | "course_students"
          | "store_students"
          | "inactive_users"
          | "completed_course"
          | "custom_list";
        targetCourseId?: Id<"courses">;
        targetStoreId?: Id<"stores">;
        templateId?: Id<"resendTemplates">;
        textContent?: string;
      },
      any
    >;
    createStoreTemplate: FunctionReference<
      "mutation",
      "public",
      {
        connectionId: Id<"resendConnections">;
        htmlContent: string;
        name: string;
        subject: string;
        textContent: string;
        type:
          | "welcome"
          | "launch"
          | "enrollment"
          | "progress_reminder"
          | "completion"
          | "certificate"
          | "new_course"
          | "re_engagement"
          | "weekly_digest"
          | "custom";
        variables: Array<string>;
      },
      any
    >;
    createTemplate: FunctionReference<
      "mutation",
      "public",
      {
        htmlContent: string;
        name: string;
        subject: string;
        textContent: string;
        type:
          | "welcome"
          | "launch"
          | "enrollment"
          | "progress_reminder"
          | "completion"
          | "certificate"
          | "new_course"
          | "re_engagement"
          | "weekly_digest"
          | "custom";
      },
      Id<"resendTemplates">
    >;
    debugCampaign: FunctionReference<
      "query",
      "public",
      { campaignId: Id<"resendCampaigns"> },
      any
    >;
    deleteAudienceList: FunctionReference<
      "mutation",
      "public",
      { listId: Id<"resendAudienceLists"> },
      any
    >;
    deleteImport: FunctionReference<
      "mutation",
      "public",
      { importId: Id<"resendImportedContacts"> },
      any
    >;
    getAdminConnection: FunctionReference<"query", "public", {}, any>;
    getAudienceLists: FunctionReference<
      "query",
      "public",
      { connectionId: Id<"resendConnections"> },
      any
    >;
    getAutomations: FunctionReference<
      "query",
      "public",
      { activeOnly?: boolean; connectionId: Id<"resendConnections"> },
      any
    >;
    getCampaigns: FunctionReference<"query", "public", {}, Array<any>>;
    getCampaignStats: FunctionReference<
      "query",
      "public",
      { campaignId: Id<"resendCampaigns"> },
      any
    >;
    getDomainStatus: FunctionReference<
      "query",
      "public",
      { connectionId: Id<"resendConnections"> },
      any
    >;
    getEmailAnalytics: FunctionReference<
      "query",
      "public",
      { days?: number },
      {
        bounceRate: number;
        clickRate: number;
        clickToOpenRate: number;
        deliveryRate: number;
        openRate: number;
        totalBounced: number;
        totalClicked: number;
        totalComplaints: number;
        totalDelivered: number;
        totalOpened: number;
        totalSent: number;
      }
    >;
    getEmailLogs: FunctionReference<
      "query",
      "public",
      { connectionId: Id<"resendConnections">; limit?: number },
      any
    >;
    getImports: FunctionReference<
      "query",
      "public",
      { connectionId: Id<"resendConnections">; limit?: number },
      any
    >;
    getImportStatus: FunctionReference<
      "query",
      "public",
      { importId: Id<"resendImportedContacts"> },
      any
    >;
    getStoreCampaigns: FunctionReference<
      "query",
      "public",
      {
        connectionId: Id<"resendConnections">;
        status?: "draft" | "scheduled" | "sending" | "sent" | "failed";
      },
      any
    >;
    getStoreConnection: FunctionReference<
      "query",
      "public",
      { storeId: Id<"stores"> },
      any
    >;
    getStoreEmailAnalytics: FunctionReference<
      "query",
      "public",
      { connectionId: Id<"resendConnections">; days?: number },
      any
    >;
    getStoreTemplates: FunctionReference<
      "query",
      "public",
      { activeOnly?: boolean; connectionId: Id<"resendConnections"> },
      any
    >;
    getTemplates: FunctionReference<
      "query",
      "public",
      { activeOnly?: boolean },
      Array<any>
    >;
    handleWebhookEvent: FunctionReference<
      "mutation",
      "public",
      { emailId: string; event: string; metadata: any; timestamp: number },
      any
    >;
    processContactBatch: FunctionReference<
      "mutation",
      "public",
      {
        contacts: Array<{
          email: string;
          firstName?: string;
          lastName?: string;
          metadata?: any;
          name?: string;
        }>;
        importId: Id<"resendImportedContacts">;
      },
      any
    >;
    startContactImport: FunctionReference<
      "mutation",
      "public",
      {
        connectionId: Id<"resendConnections">;
        fileName?: string;
        source:
          | "csv"
          | "mailchimp"
          | "activecampaign"
          | "convertkit"
          | "manual";
        totalContacts: number;
        userId: string;
      },
      any
    >;
    toggleAutomation: FunctionReference<
      "mutation",
      "public",
      { automationId: Id<"resendAutomations">; isActive: boolean },
      any
    >;
    updateAudienceList: FunctionReference<
      "mutation",
      "public",
      {
        description?: string;
        listId: Id<"resendAudienceLists">;
        name?: string;
        userIds?: Array<string>;
      },
      any
    >;
  };
  emails: {
    connectAdminResendSecure: FunctionReference<
      "action",
      "public",
      {
        fromEmail: string;
        fromName: string;
        replyToEmail?: string;
        resendApiKey: string;
        userId: string;
      },
      Id<"resendConnections">
    >;
    connectStoreResendSecure: FunctionReference<
      "action",
      "public",
      {
        fromEmail: string;
        fromName: string;
        replyToEmail?: string;
        resendApiKey: string;
        storeId: Id<"stores">;
        userId: string;
      },
      Id<"resendConnections">
    >;
    sendBroadcastEmail: FunctionReference<
      "action",
      "public",
      {
        contactIds: Array<Id<"emailContacts">>;
        fromName?: string;
        htmlContent: string;
        storeId: string;
        subject: string;
      },
      {
        failed: number;
        message: string;
        sent: number;
        skipped: number;
        success: boolean;
      }
    >;
    sendCampaign: FunctionReference<
      "action",
      "public",
      { campaignId: Id<"resendCampaigns"> | Id<"emailCampaigns"> },
      null
    >;
    testStoreEmailConfig: FunctionReference<
      "action",
      "public",
      {
        fromEmail: string;
        fromName?: string;
        replyToEmail?: string;
        storeId: Id<"stores">;
        testEmail: string;
      },
      { message: string; success: boolean }
    >;
  };
  emailSegmentation: {
    createSegment: FunctionReference<
      "mutation",
      "public",
      {
        conditions: Array<{
          field: string;
          logic?: "AND" | "OR";
          operator:
            | "equals"
            | "not_equals"
            | "greater_than"
            | "less_than"
            | "contains"
            | "not_contains"
            | "in"
            | "not_in";
          value: any;
        }>;
        connectionId?: Id<"resendConnections">;
        description: string;
        isDynamic: boolean;
        name: string;
      },
      Id<"emailSegments">
    >;
    getSegmentById: FunctionReference<
      "query",
      "public",
      { segmentId: Id<"emailSegments"> },
      any | null
    >;
    getSegmentMembers: FunctionReference<
      "query",
      "public",
      { limit?: number; segmentId: Id<"emailSegments"> },
      Array<string>
    >;
    getSegments: FunctionReference<
      "query",
      "public",
      { connectionId?: Id<"resendConnections">; isDynamic?: boolean },
      Array<any>
    >;
    getSegmentSize: FunctionReference<
      "query",
      "public",
      { segmentId: Id<"emailSegments"> },
      number
    >;
    userMatchesSegment: FunctionReference<
      "query",
      "public",
      { segmentId: Id<"emailSegments">; userId: string },
      { matches: boolean; reasons: Array<string> }
    >;
  };
  emailSpamScoring: {
    checkSpamScore: FunctionReference<
      "mutation",
      "public",
      {
        campaignId?: Id<"resendCampaigns">;
        htmlContent: string;
        subject: string;
        templateId?: Id<"resendTemplates">;
      },
      {
        checks: {
          hasBrokenLinks: boolean;
          hasExcessiveCaps: boolean;
          hasExcessivePunctuation: boolean;
          hasSpamWords: boolean;
          hasUnsubscribeLink: boolean;
          imageToTextRatio: number;
          linkCount: number;
        };
        issues: Array<{
          message: string;
          severity: "warning" | "error";
          suggestion?: string;
          type: "subject" | "content" | "links" | "images" | "authentication";
        }>;
        riskLevel: "low" | "medium" | "high";
        spamScore: number;
      }
    >;
    getSpamScoreCheck: FunctionReference<
      "query",
      "public",
      {
        campaignId?: Id<"resendCampaigns">;
        templateId?: Id<"resendTemplates">;
      },
      {
        _creationTime: number;
        _id: Id<"spamScoreChecks">;
        campaignId?: Id<"resendCampaigns">;
        checkedAt: number;
        checks: {
          hasBrokenLinks: boolean;
          hasExcessiveCaps: boolean;
          hasExcessivePunctuation: boolean;
          hasSpamWords: boolean;
          hasUnsubscribeLink: boolean;
          imageToTextRatio: number;
          linkCount: number;
        };
        htmlContent: string;
        issues: Array<{
          message: string;
          severity: "warning" | "error";
          suggestion?: string;
          type: "subject" | "content" | "links" | "images" | "authentication";
        }>;
        riskLevel: "low" | "medium" | "high";
        spamScore: number;
        subject: string;
        templateId?: Id<"resendTemplates">;
      } | null
    >;
  };
  emailTags: {
    createTag: FunctionReference<
      "mutation",
      "public",
      { color?: string; description?: string; name: string; storeId: string },
      Id<"emailTags">
    >;
    deleteTag: FunctionReference<
      "mutation",
      "public",
      { tagId: Id<"emailTags"> },
      null
    >;
    getTag: FunctionReference<
      "query",
      "public",
      { tagId: Id<"emailTags"> },
      any
    >;
    getTagByName: FunctionReference<
      "query",
      "public",
      { name: string; storeId: string },
      any
    >;
    getTagStats: FunctionReference<
      "query",
      "public",
      { storeId: string },
      {
        mostUsedTags: Array<{
          _id: Id<"emailTags">;
          contactCount: number;
          name: string;
        }>;
        totalTaggedContacts: number;
        totalTags: number;
      }
    >;
    listTags: FunctionReference<
      "query",
      "public",
      { storeId: string },
      Array<any>
    >;
    mergeTags: FunctionReference<
      "mutation",
      "public",
      { sourceTagId: Id<"emailTags">; targetTagId: Id<"emailTags"> },
      null
    >;
    updateTag: FunctionReference<
      "mutation",
      "public",
      {
        color?: string;
        description?: string;
        name?: string;
        tagId: Id<"emailTags">;
      },
      null
    >;
  };
  emailTemplates: {
    getAutomationTemplateById: FunctionReference<
      "query",
      "public",
      { templateId: string },
      {
        category: string;
        conversionRate: string;
        description: string;
        emails: Array<{ delay: number; purpose: string; subject: string }>;
        funnelStage?: string;
        id: string;
        name: string;
        popular: boolean;
        tags: Array<string>;
        trigger: string;
      } | null
    >;
    getAutomationTemplates: FunctionReference<
      "query",
      "public",
      {
        category?: string;
        funnelStage?:
          | "TOFU"
          | "MOFU"
          | "BOFU"
          | "FULL-FUNNEL"
          | "POST-PURCHASE"
          | "RE-ENGAGEMENT";
      },
      Array<{
        category: string;
        conversionRate: string;
        description: string;
        emails: Array<{ delay: number; purpose: string; subject: string }>;
        funnelStage?: string;
        id: string;
        name: string;
        popular: boolean;
        tags: Array<string>;
        trigger: string;
      }>
    >;
    getCampaignTemplateById: FunctionReference<
      "query",
      "public",
      { templateId: string },
      {
        body: string;
        category: string;
        description: string;
        estimatedOpenRate: string;
        funnelStage?: string;
        id: string;
        name: string;
        popular: boolean;
        previewText: string;
        subject: string;
        tags: Array<string>;
        useCase: string;
      } | null
    >;
    getCampaignTemplates: FunctionReference<
      "query",
      "public",
      {
        category?: string;
        funnelStage?:
          | "TOFU"
          | "MOFU"
          | "BOFU"
          | "POST-PURCHASE"
          | "RE-ENGAGEMENT"
          | "NURTURE";
      },
      Array<{
        body: string;
        category: string;
        description: string;
        estimatedOpenRate: string;
        funnelStage?: string;
        id: string;
        name: string;
        popular: boolean;
        previewText: string;
        subject: string;
        tags: Array<string>;
        useCase: string;
      }>
    >;
    getFunnelStages: FunctionReference<
      "query",
      "public",
      { type: "campaign" | "automation" },
      Array<{
        count: number;
        description: string;
        label: string;
        value: string;
      }>
    >;
    getTemplateCategories: FunctionReference<
      "query",
      "public",
      { type: "campaign" | "automation" },
      Array<{ count: number; label: string; value: string }>
    >;
  };
  emailUnsubscribe: {
    checkSuppression: FunctionReference<
      "query",
      "public",
      { email: string },
      { reason?: string; suppressed: boolean }
    >;
    getUnsubscribeStats: FunctionReference<
      "query",
      "public",
      {},
      {
        recentUnsubscribes: Array<{
          email: string;
          reason?: string;
          unsubscribedAt: number;
        }>;
        totalBounced: number;
        totalComplained: number;
        totalUnsubscribed: number;
      }
    >;
    unsubscribeByEmail: FunctionReference<
      "mutation",
      "public",
      { email: string; reason?: string },
      { message: string; success: boolean }
    >;
  };
  emailUserStats: {
    getUserStatsForEmail: FunctionReference<
      "query",
      "public",
      { userId: string },
      null | any
    >;
  };
  emailWorkflowABTesting: {
    assignVariant: FunctionReference<
      "query",
      "public",
      {
        contactId: Id<"emailContacts">;
        nodeId: string;
        workflowId: Id<"emailWorkflows">;
      },
      null | {
        body?: string;
        subject: string;
        variantId: string;
        variantName: string;
      }
    >;
    deleteNodeABTest: FunctionReference<
      "mutation",
      "public",
      { nodeId: string; workflowId: Id<"emailWorkflows"> },
      boolean
    >;
    getNodeABTest: FunctionReference<
      "query",
      "public",
      { nodeId: string; workflowId: Id<"emailWorkflows"> },
      null | any
    >;
    getVariantStats: FunctionReference<
      "query",
      "public",
      { nodeId: string; workflowId: Id<"emailWorkflows"> },
      null | {
        isComplete: boolean;
        isEnabled: boolean;
        sampleSize: number;
        totalSent: number;
        variants: Array<{
          clickRate: number;
          clicked: number;
          id: string;
          name: string;
          openRate: number;
          opened: number;
          percentage: number;
          sent: number;
          subject: string;
        }>;
        winner: null | string;
      }
    >;
    getWorkflowABTests: FunctionReference<
      "query",
      "public",
      { workflowId: Id<"emailWorkflows"> },
      Array<any>
    >;
    recordVariantEvent: FunctionReference<
      "mutation",
      "public",
      {
        eventType: "sent" | "delivered" | "opened" | "clicked";
        nodeId: string;
        variantId: string;
        workflowId: Id<"emailWorkflows">;
      },
      { success: boolean }
    >;
    resetTestStats: FunctionReference<
      "mutation",
      "public",
      { nodeId: string; workflowId: Id<"emailWorkflows"> },
      { success: boolean }
    >;
    saveNodeABTest: FunctionReference<
      "mutation",
      "public",
      {
        autoSelectWinner: boolean;
        isEnabled: boolean;
        nodeId: string;
        sampleSize: number;
        variants: Array<{
          body?: string;
          id: string;
          name: string;
          percentage: number;
          subject: string;
        }>;
        winnerMetric: "open_rate" | "click_rate";
        winnerThreshold?: number;
        workflowId: Id<"emailWorkflows">;
      },
      Id<"workflowNodeABTests">
    >;
    selectWinner: FunctionReference<
      "mutation",
      "public",
      { nodeId: string; variantId: string; workflowId: Id<"emailWorkflows"> },
      { success: boolean }
    >;
  };
  emailWorkflows: {
    bulkEnrollAllContactsByFilter: FunctionReference<
      "action",
      "public",
      {
        noTags?: boolean;
        storeId: string;
        tagId?: Id<"emailTags">;
        workflowId: Id<"emailWorkflows">;
      },
      { enrolled: number; message: string; skipped: number }
    >;
    bulkEnrollContactsInWorkflow: FunctionReference<
      "mutation",
      "public",
      {
        contactIds: Array<Id<"emailContacts">>;
        workflowId: Id<"emailWorkflows">;
      },
      { enrolled: number; errors: Array<string>; skipped: number }
    >;
    cancelExecution: FunctionReference<
      "mutation",
      "public",
      { executionId: Id<"workflowExecutions"> },
      null
    >;
    createAdminWorkflow: FunctionReference<
      "mutation",
      "public",
      {
        description?: string;
        edges: Array<{
          id: string;
          source: string;
          sourceHandle?: string;
          target: string;
          targetHandle?: string;
        }>;
        name: string;
        nodes: Array<{
          data: any;
          id: string;
          position: { x: number; y: number };
          type:
            | "trigger"
            | "email"
            | "delay"
            | "condition"
            | "action"
            | "stop"
            | "webhook"
            | "split"
            | "notify"
            | "goal"
            | "courseCycle"
            | "courseEmail"
            | "purchaseCheck"
            | "cycleLoop";
        }>;
        trigger: {
          config: any;
          type:
            | "lead_signup"
            | "product_purchase"
            | "tag_added"
            | "segment_member"
            | "manual"
            | "time_delay"
            | "date_time"
            | "customer_action"
            | "webhook"
            | "page_visit"
            | "cart_abandon"
            | "birthday"
            | "anniversary"
            | "custom_event"
            | "api_call"
            | "form_submit"
            | "email_reply"
            | "all_users"
            | "all_creators"
            | "all_learners"
            | "new_signup"
            | "user_inactivity"
            | "any_purchase"
            | "any_course_complete";
        };
        userId: string;
      },
      Id<"emailWorkflows">
    >;
    createEmailTemplate: FunctionReference<
      "mutation",
      "public",
      {
        category?: string;
        content: string;
        description?: string;
        name: string;
        storeId: string;
        subject: string;
      },
      Id<"emailTemplates">
    >;
    createWorkflow: FunctionReference<
      "mutation",
      "public",
      {
        description?: string;
        edges: Array<{
          id: string;
          source: string;
          sourceHandle?: string;
          target: string;
          targetHandle?: string;
        }>;
        name: string;
        nodes: Array<{
          data: any;
          id: string;
          position: { x: number; y: number };
          type:
            | "trigger"
            | "email"
            | "delay"
            | "condition"
            | "action"
            | "stop"
            | "webhook"
            | "split"
            | "notify"
            | "goal"
            | "courseCycle"
            | "courseEmail"
            | "purchaseCheck"
            | "cycleLoop";
        }>;
        sequenceType?:
          | "welcome"
          | "buyer"
          | "course_student"
          | "coaching_client"
          | "lead_nurture"
          | "product_launch"
          | "reengagement"
          | "winback"
          | "custom";
        storeId: string;
        trigger: {
          config: any;
          type:
            | "lead_signup"
            | "product_purchase"
            | "tag_added"
            | "segment_member"
            | "manual"
            | "time_delay"
            | "date_time"
            | "customer_action"
            | "webhook"
            | "page_visit"
            | "cart_abandon"
            | "birthday"
            | "anniversary"
            | "custom_event"
            | "api_call"
            | "form_submit"
            | "email_reply"
            | "all_users"
            | "all_creators"
            | "all_learners"
            | "new_signup"
            | "user_inactivity"
            | "any_purchase"
            | "any_course_complete";
        };
        userId: string;
      },
      Id<"emailWorkflows">
    >;
    deleteWorkflow: FunctionReference<
      "mutation",
      "public",
      { workflowId: Id<"emailWorkflows"> },
      { deleted: boolean; remainingExecutions: number }
    >;
    duplicateWorkflow: FunctionReference<
      "mutation",
      "public",
      { workflowId: Id<"emailWorkflows"> },
      Id<"emailWorkflows">
    >;
    enrollContactInWorkflow: FunctionReference<
      "mutation",
      "public",
      { contactId: Id<"emailContacts">; workflowId: Id<"emailWorkflows"> },
      Id<"workflowExecutions">
    >;
    enrollUserInAdminWorkflow: FunctionReference<
      "mutation",
      "public",
      {
        userEmail: string;
        userId: string;
        userName?: string;
        workflowId: Id<"emailWorkflows">;
      },
      Id<"workflowExecutions">
    >;
    getContactsAtNode: FunctionReference<
      "query",
      "public",
      { limit?: number; nodeId: string; workflowId: Id<"emailWorkflows"> },
      Array<{
        contactId?: Id<"emailContacts">;
        email: string;
        executionId: Id<"workflowExecutions">;
        name?: string;
        scheduledFor?: number;
        startedAt?: number;
      }>
    >;
    getContactWorkflowStatus: FunctionReference<
      "query",
      "public",
      { contactId: Id<"emailContacts">; storeId: string },
      Array<any>
    >;
    getEmailTemplate: FunctionReference<
      "query",
      "public",
      { templateId: Id<"emailTemplates"> },
      any
    >;
    getNodeExecutionCounts: FunctionReference<
      "query",
      "public",
      { workflowId: Id<"emailWorkflows"> },
      any
    >;
    getWorkflow: FunctionReference<
      "query",
      "public",
      { workflowId: Id<"emailWorkflows"> },
      any
    >;
    getWorkflowCountsByType: FunctionReference<
      "query",
      "public",
      { storeId: string },
      any
    >;
    listAdminWorkflows: FunctionReference<"query", "public", {}, Array<any>>;
    listEmailTemplates: FunctionReference<
      "query",
      "public",
      { storeId: string },
      Array<{
        _id: Id<"emailTemplates">;
        category?: string;
        name: string;
        subject: string;
      }>
    >;
    listWorkflows: FunctionReference<
      "query",
      "public",
      { storeId: string },
      Array<any>
    >;
    listWorkflowsBySequenceType: FunctionReference<
      "query",
      "public",
      {
        sequenceType?:
          | "welcome"
          | "buyer"
          | "course_student"
          | "coaching_client"
          | "lead_nurture"
          | "product_launch"
          | "reengagement"
          | "winback"
          | "custom";
        storeId: string;
      },
      Array<any>
    >;
    toggleWorkflowActive: FunctionReference<
      "mutation",
      "public",
      { isActive: boolean; workflowId: Id<"emailWorkflows"> },
      null
    >;
    updateWorkflow: FunctionReference<
      "mutation",
      "public",
      {
        description?: string;
        edges?: Array<{
          id: string;
          source: string;
          sourceHandle?: string;
          target: string;
          targetHandle?: string;
        }>;
        isActive?: boolean;
        name?: string;
        nodes?: Array<{
          data: any;
          id: string;
          position: { x: number; y: number };
          type:
            | "trigger"
            | "email"
            | "delay"
            | "condition"
            | "action"
            | "stop"
            | "webhook"
            | "split"
            | "notify"
            | "goal"
            | "courseCycle"
            | "courseEmail"
            | "purchaseCheck"
            | "cycleLoop";
        }>;
        sequenceType?:
          | "welcome"
          | "buyer"
          | "course_student"
          | "coaching_client"
          | "lead_nurture"
          | "product_launch"
          | "reengagement"
          | "winback"
          | "custom";
        trigger?: {
          config: any;
          type:
            | "lead_signup"
            | "product_purchase"
            | "tag_added"
            | "segment_member"
            | "manual"
            | "time_delay"
            | "date_time"
            | "customer_action"
            | "webhook"
            | "page_visit"
            | "cart_abandon"
            | "birthday"
            | "anniversary"
            | "custom_event"
            | "api_call"
            | "form_submit"
            | "email_reply"
            | "all_users"
            | "all_creators"
            | "all_learners"
            | "new_signup"
            | "user_inactivity"
            | "any_purchase"
            | "any_course_complete";
        };
        workflowId: Id<"emailWorkflows">;
      },
      null
    >;
  };
  embeddingActions: {
    generateAllContentEmbeddings: FunctionReference<
      "action",
      "public",
      {
        contentTypes: Array<"courseContent" | "products" | "plugins" | "notes">;
        overwrite: boolean;
        userId: string;
      },
      {
        results: Record<
          string,
          { errors: number; processed: number; skipped: number }
        >;
        success: boolean;
        totalErrors: Array<string>;
        totalProcessed: number;
      }
    >;
    generateAllCourseEmbeddings: FunctionReference<
      "action",
      "public",
      { overwrite: boolean; userId: string },
      {
        errors: Array<string>;
        processed: number;
        skipped: number;
        success: boolean;
      }
    >;
    generateCourseContentEmbeddings: FunctionReference<
      "action",
      "public",
      { overwrite: boolean; userId: string },
      {
        errors: Array<string>;
        processed: number;
        skipped: number;
        success: boolean;
      }
    >;
    generateNoteEmbeddings: FunctionReference<
      "action",
      "public",
      { overwrite: boolean; userId: string },
      {
        errors: Array<string>;
        processed: number;
        skipped: number;
        success: boolean;
      }
    >;
    generatePluginEmbeddings: FunctionReference<
      "action",
      "public",
      { overwrite: boolean; userId: string },
      {
        errors: Array<string>;
        processed: number;
        skipped: number;
        success: boolean;
      }
    >;
    generateProductEmbeddings: FunctionReference<
      "action",
      "public",
      { overwrite: boolean; userId: string },
      {
        errors: Array<string>;
        processed: number;
        skipped: number;
        success: boolean;
      }
    >;
    migrateToNewEmbeddingModel: FunctionReference<
      "action",
      "public",
      { userId: string },
      {
        deleted: number;
        errors: Array<string>;
        processed: number;
        success: boolean;
      }
    >;
  };
  embeddings: {
    getEmbeddingStats: FunctionReference<
      "action",
      "public",
      {},
      {
        bySourceType: {
          chapters: number;
          courses: number;
          lessons: number;
          notes: number;
          other: number;
          products: number;
          webResearch: number;
        };
        contentCounts: {
          chapters: number;
          courses: number;
          lessons: number;
          notes: number;
          products: number;
        };
        coveragePercentage: number;
        totalEmbeddings: number;
      }
    >;
  };
  enhancePluginDescriptions: {
    enhanceAllPluginDescriptions: FunctionReference<
      "action",
      "public",
      { clerkId: string; limit?: number },
      {
        errorCount: number;
        errors: Array<string>;
        success: boolean;
        successCount: number;
        totalProcessed: number;
      }
    >;
    enhancePluginDescription: FunctionReference<
      "action",
      "public",
      { clerkId: string; pluginId: Id<"plugins"> },
      {
        enhancedDescription?: string;
        error?: string;
        originalDescription?: string;
        success: boolean;
      }
    >;
  };
  fanCountAggregation: {
    triggerCountForStore: FunctionReference<
      "action",
      "public",
      { storeId: string },
      { message: string; success: boolean; total?: number }
    >;
  };
  files: {
    deleteFile: FunctionReference<
      "mutation",
      "public",
      { storageId: string },
      null
    >;
    generateUploadUrl: FunctionReference<"mutation", "public", {}, string>;
    getFileMetadata: FunctionReference<
      "query",
      "public",
      { storageId: Id<"_storage"> },
      {
        _creationTime: number;
        _id: Id<"_storage">;
        contentType?: string;
        sha256: string;
        size: number;
      } | null
    >;
    getStorageUrl: FunctionReference<
      "query",
      "public",
      { storageId: Id<"_storage"> },
      string | null
    >;
    getUrl: FunctionReference<
      "mutation",
      "public",
      { storageId: string },
      string | null
    >;
  };
  fixAccounts: {
    createBothInstagramAccounts: FunctionReference<
      "action",
      "public",
      { storeId: string; userId: string },
      { message: string; success: boolean }
    >;
  };
  fixes: {
    bulkEnrollmentFix: {
      checkEnrollmentHealth: FunctionReference<
        "query",
        "public",
        {},
        {
          healthScore: number;
          totalEnrollments: number;
          totalPurchases: number;
          usersWithEnrollments: number;
          usersWithMissingEnrollments: number;
          usersWithPurchases: number;
        }
      >;
      fixAllUsersEnrollments: FunctionReference<
        "mutation",
        "public",
        {},
        {
          enrollmentsCreated: number;
          errors: number;
          summary: Array<string>;
          totalUsers: number;
          usersFixed: number;
        }
      >;
    };
    enrollmentSync: {
      fixAllEnrollmentIssues: FunctionReference<
        "mutation",
        "public",
        {},
        { enrollmentsCreated: number; errors: number; usersProcessed: number }
      >;
      fixUserEnrollments: FunctionReference<
        "mutation",
        "public",
        { clerkId: string; courseSlug?: string },
        { actions: Array<string>; fixed: boolean; issues: Array<string> }
      >;
    };
  };
  followGateSubmissions: {
    checkFollowGateSubmission: FunctionReference<
      "query",
      "public",
      { email: string; productId: Id<"digitalProducts"> },
      | {
          hasSubmitted: true;
          submission: {
            _id: Id<"followGateSubmissions">;
            downloadCount?: number;
            followedPlatforms: {
              instagram?: boolean;
              spotify?: boolean;
              tiktok?: boolean;
              youtube?: boolean;
            };
            hasDownloaded?: boolean;
            submittedAt: number;
          };
        }
      | { hasSubmitted: false }
    >;
    getFollowGateAnalytics: FunctionReference<
      "query",
      "public",
      {
        creatorId?: string;
        productId?: Id<"digitalProducts">;
        storeId?: string;
      },
      {
        conversionRate: number;
        platformBreakdown: {
          instagram: number;
          spotify: number;
          tiktok: number;
          youtube: number;
        };
        recentSubmissions: Array<{
          email: string;
          platformCount: number;
          submittedAt: number;
        }>;
        totalDownloads: number;
        totalSubmissions: number;
      }
    >;
    getProductFollowGateSubmissions: FunctionReference<
      "query",
      "public",
      { limit?: number; productId: Id<"digitalProducts"> },
      Array<{
        _id: Id<"followGateSubmissions">;
        downloadCount?: number;
        email: string;
        followedPlatforms: {
          instagram?: boolean;
          spotify?: boolean;
          tiktok?: boolean;
          youtube?: boolean;
        };
        hasDownloaded?: boolean;
        name?: string;
        submittedAt: number;
      }>
    >;
    getSubmissionById: FunctionReference<
      "query",
      "public",
      { submissionId: Id<"followGateSubmissions"> },
      any
    >;
    submitFollowGate: FunctionReference<
      "mutation",
      "public",
      {
        email: string;
        followedPlatforms: {
          instagram?: boolean;
          spotify?: boolean;
          tiktok?: boolean;
          youtube?: boolean;
        };
        ipAddress?: string;
        name?: string;
        productId: Id<"digitalProducts">;
        userAgent?: string;
      },
      {
        alreadySubmitted: boolean;
        submissionId: Id<"followGateSubmissions">;
        success: boolean;
      }
    >;
    trackFollowGateDownload: FunctionReference<
      "mutation",
      "public",
      { submissionId: Id<"followGateSubmissions"> },
      { success: boolean }
    >;
  };
  generatedScripts: {
    archiveScript: FunctionReference<
      "mutation",
      "public",
      { scriptId: Id<"generatedScripts"> },
      any
    >;
    assignScriptToAccount: FunctionReference<
      "mutation",
      "public",
      {
        accountProfileId: Id<"socialAccountProfiles">;
        scriptId: Id<"generatedScripts">;
      },
      any
    >;
    deleteScript: FunctionReference<
      "mutation",
      "public",
      { scriptId: Id<"generatedScripts"> },
      any
    >;
    getFeedbackSummary: FunctionReference<
      "query",
      "public",
      { storeId: string },
      any
    >;
    getGeneratedScripts: FunctionReference<
      "query",
      "public",
      {
        accountProfileId?: Id<"socialAccountProfiles">;
        courseId?: Id<"courses">;
        cursor?: string;
        limit?: number;
        minViralityScore?: number;
        status?:
          | "generated"
          | "reviewed"
          | "scheduled"
          | "in_progress"
          | "completed"
          | "archived";
        storeId: string;
      },
      any
    >;
    getScriptById: FunctionReference<
      "query",
      "public",
      { scriptId: Id<"generatedScripts"> },
      any
    >;
    getScriptsByCourse: FunctionReference<
      "query",
      "public",
      { courseId: Id<"courses">; limit?: number },
      any
    >;
    getScriptsForAccount: FunctionReference<
      "query",
      "public",
      {
        accountProfileId: Id<"socialAccountProfiles">;
        limit?: number;
        status?:
          | "generated"
          | "reviewed"
          | "scheduled"
          | "in_progress"
          | "completed"
          | "archived";
      },
      any
    >;
    getScriptStats: FunctionReference<
      "query",
      "public",
      { storeId: string },
      any
    >;
    linkScriptToPost: FunctionReference<
      "mutation",
      "public",
      {
        scriptId: Id<"generatedScripts">;
        socialMediaPostId: Id<"socialMediaPosts">;
      },
      any
    >;
    submitPerformanceFeedback: FunctionReference<
      "mutation",
      "public",
      {
        comments?: number;
        likes?: number;
        saves?: number;
        scriptId: Id<"generatedScripts">;
        shares?: number;
        views?: number;
      },
      any
    >;
    submitUserFeedback: FunctionReference<
      "mutation",
      "public",
      {
        audienceReaction?: "positive" | "mixed" | "negative";
        notes?: string;
        rating?: number;
        scriptId: Id<"generatedScripts">;
        whatDidntWork?: Array<string>;
        whatWorked?: Array<string>;
      },
      any
    >;
    updateScriptStatus: FunctionReference<
      "mutation",
      "public",
      {
        scriptId: Id<"generatedScripts">;
        status:
          | "generated"
          | "reviewed"
          | "scheduled"
          | "in_progress"
          | "completed"
          | "archived";
      },
      any
    >;
  };
  importFans: {
    importFansBatch: FunctionReference<
      "mutation",
      "public",
      {
        adminUserId: string;
        fans: Array<{
          activeCampaignId?: string;
          city?: string;
          clicksLinks?: boolean;
          country?: string;
          countryCode?: string;
          daw?: string;
          email: string;
          firstName?: string;
          genreSpecialty?: string;
          goals?: string;
          howLongProducing?: string;
          lastName?: string;
          lastOpenDate?: number;
          musicAlias?: string;
          opensEmail?: boolean;
          phone?: string;
          score?: number;
          state?: string;
          stateCode?: string;
          studentLevel?: string;
          tags?: Array<string>;
          typeOfMusic?: string;
          whySignedUp?: string;
          zipCode?: string;
        }>;
        storeId: string;
      },
      {
        errors: Array<{ email: string; error: string }>;
        imported: number;
        skipped: number;
        updated: number;
      }
    >;
  };
  importPlugins: {
    batchCreatePlugins: FunctionReference<
      "action",
      "public",
      {
        clerkId: string;
        plugins: Array<{
          audioUrl?: string;
          author?: string;
          description?: string;
          image?: string;
          isPublished?: boolean;
          name: string;
          optInFormUrl?: string;
          price?: number;
          pricingType: "FREE" | "PAID" | "FREEMIUM";
          purchaseUrl?: string;
          slug?: string;
          videoUrl?: string;
        }>;
      },
      { errors?: Array<string>; failed: number; success: number }
    >;
    clearAllPlugins: FunctionReference<
      "action",
      "public",
      { clerkId: string },
      {
        deleted: {
          effectCategories: number;
          instrumentCategories: number;
          pluginCategories: number;
          pluginTypes: number;
          plugins: number;
          studioToolCategories: number;
        };
        success: boolean;
      }
    >;
    importPluginsFromJSON: FunctionReference<
      "action",
      "public",
      { clerkId: string; jsonData: string },
      {
        errors?: Array<string>;
        stats: {
          effectCategories: number;
          instrumentCategories: number;
          pluginCategories: number;
          pluginTypes: number;
          pluginsError: number;
          pluginsSuccess: number;
          studioToolCategories: number;
        };
        success: boolean;
      }
    >;
    updatePluginCategories: FunctionReference<
      "action",
      "public",
      { clerkId: string; jsonData: string },
      {
        errors?: Array<string>;
        stats: {
          effectCategories: number;
          instrumentCategories: number;
          pluginsError: number;
          pluginsSkipped: number;
          pluginsUpdated: number;
          studioToolCategories: number;
        };
        success: boolean;
      }
    >;
  };
  inboxQueries: {
    archiveReply: FunctionReference<
      "mutation",
      "public",
      { replyId: Id<"emailReplies"> },
      null
    >;
    createInboxReply: FunctionReference<
      "mutation",
      "public",
      {
        fromEmail: string;
        fromName?: string;
        hasAttachments?: boolean;
        htmlBody?: string;
        inReplyTo?: string;
        messageId: string;
        references?: Array<string>;
        subject: string;
        textBody?: string;
        toEmail: string;
      },
      Id<"emailReplies">
    >;
    getCreatorInbox: FunctionReference<
      "query",
      "public",
      {
        status?: "new" | "read" | "replied" | "spam" | "archived";
        storeId: Id<"stores">;
      },
      Array<{
        _id: Id<"emailReplies">;
        fromEmail: string;
        fromName?: string;
        hasAttachments?: boolean;
        matchConfidence?: string;
        readAt?: number;
        receivedAt: number;
        status: string;
        subject: string;
        textBody?: string;
      }>
    >;
    getInboxStats: FunctionReference<
      "query",
      "public",
      { storeId: Id<"stores"> },
      { new: number; read: number; replied: number; total: number }
    >;
    getReplyDetails: FunctionReference<
      "query",
      "public",
      { replyId: Id<"emailReplies"> },
      null | any
    >;
    markAsSpam: FunctionReference<
      "mutation",
      "public",
      { replyId: Id<"emailReplies"> },
      null
    >;
    markReplyAsRead: FunctionReference<
      "mutation",
      "public",
      { replyId: Id<"emailReplies"> },
      null
    >;
    replyToCustomer: FunctionReference<
      "mutation",
      "public",
      { message: string; replyId: Id<"emailReplies"> },
      null
    >;
  };
  instagram_debug: {
    debugTokenPermissions: FunctionReference<
      "action",
      "public",
      { username: string },
      any
    >;
    getAccountData: FunctionReference<
      "query",
      "public",
      { accountId: string },
      {
        accessToken: string;
        accountId: string;
        instagramBusinessId: string;
        platformUserId: string;
        username: string;
      } | null
    >;
    getTokenByUsername: FunctionReference<
      "query",
      "public",
      { username: string },
      { instagramId?: string; token: string } | null
    >;
  };
  integrations: {
    blotato: {
      createTwitterThread: FunctionReference<
        "action",
        "public",
        {
          accountId: string;
          scheduledTime?: string;
          tweets: Array<{ mediaUrls?: Array<string>; text: string }>;
        },
        {
          error?: string;
          success: boolean;
          threadId?: string;
          tweetCount?: number;
        }
      >;
      generateAndPublishScript: FunctionReference<
        "action",
        "public",
        {
          accountId?: string;
          mediaUrls?: Array<string>;
          platform: string;
          publishImmediately?: boolean;
          scheduledTime?: string;
          style?:
            | "educational"
            | "entertaining"
            | "promotional"
            | "behind-the-scenes"
            | "tutorial";
          tone?: "professional" | "casual" | "humorous" | "inspirational";
          topic: string;
        },
        {
          error?: string;
          postId?: string;
          published?: boolean;
          script?: {
            body: string;
            cta: string;
            fullScript: string;
            hashtags?: Array<string>;
            hook: string;
            suggestedLength?: string;
          };
          success: boolean;
        }
      >;
      generateMultiPlatformContent: FunctionReference<
        "action",
        "public",
        {
          baseContent?: string;
          platforms: Array<string>;
          style?: string;
          topic: string;
        },
        {
          content?: Record<
            string,
            {
              characterCount: number;
              hashtags: Array<string>;
              text: string;
              tips?: string;
            }
          >;
          error?: string;
          success: boolean;
        }
      >;
      getConnectedAccounts: FunctionReference<
        "action",
        "public",
        {},
        {
          accounts?: Array<{
            id: string;
            name: string;
            platform: string;
            username?: string;
          }>;
          error?: string;
          success: boolean;
        }
      >;
      publishPost: FunctionReference<
        "action",
        "public",
        {
          accountId: string;
          additionalPosts?: Array<{ mediaUrls?: Array<string>; text: string }>;
          mediaUrls?: Array<string>;
          pageId?: string;
          platform: string;
          text: string;
          userId?: string;
        },
        { error?: string; postId?: string; postUrl?: string; success: boolean }
      >;
      schedulePost: FunctionReference<
        "action",
        "public",
        {
          accountId: string;
          additionalPosts?: Array<{ mediaUrls?: Array<string>; text: string }>;
          mediaUrls?: Array<string>;
          pageId?: string;
          platform: string;
          scheduledTime: string;
          text: string;
        },
        {
          error?: string;
          postId?: string;
          scheduledFor?: string;
          success: boolean;
        }
      >;
    };
    instagram: {
      getUserPosts: FunctionReference<
        "action",
        "public",
        { instagramAccountId?: string; userId: Id<"users"> },
        { data: any; status: number }
      >;
      handleOAuthCallback: FunctionReference<
        "action",
        "public",
        { code: string; userId?: Id<"users"> },
        null
      >;
    };
    internal: {
      disconnectInstagram: FunctionReference<
        "mutation",
        "public",
        { userId: Id<"users"> },
        { message: string; success: boolean }
      >;
      updateInstagramToken: FunctionReference<
        "mutation",
        "public",
        { token: string; username: string },
        { message: string; success: boolean }
      >;
    };
    queries: {
      getInstagramIntegration: FunctionReference<
        "query",
        "public",
        { userId: Id<"users"> },
        any | null
      >;
      isInstagramConnected: FunctionReference<
        "query",
        "public",
        { userId: Id<"users"> },
        {
          connected: boolean;
          expiresAt?: number;
          instagramId?: string;
          source?: string;
          username?: string;
        } | null
      >;
    };
  };
  landingPages: {
    addBlock: FunctionReference<
      "mutation",
      "public",
      {
        pageId: Id<"landingPages">;
        position: number;
        settings?: any;
        type:
          | "hero"
          | "features"
          | "testimonials"
          | "pricing"
          | "cta"
          | "faq"
          | "video"
          | "image"
          | "text"
          | "countdown"
          | "social_proof"
          | "product_showcase"
          | "custom_html";
      },
      any
    >;
    createLandingPage: FunctionReference<
      "mutation",
      "public",
      {
        slug: string;
        storeId: string;
        templateId?: string;
        title: string;
        userId: string;
      },
      any
    >;
    createVariant: FunctionReference<
      "mutation",
      "public",
      {
        parentPageId: Id<"landingPages">;
        trafficSplit: number;
        variantName: string;
      },
      any
    >;
    deletePage: FunctionReference<
      "mutation",
      "public",
      { pageId: Id<"landingPages"> },
      any
    >;
    duplicatePage: FunctionReference<
      "mutation",
      "public",
      { pageId: Id<"landingPages"> },
      any
    >;
    getLandingPage: FunctionReference<
      "query",
      "public",
      { pageId: Id<"landingPages"> },
      any
    >;
    getLandingPageAnalytics: FunctionReference<
      "query",
      "public",
      { endDate?: string; pageId: Id<"landingPages">; startDate?: string },
      any
    >;
    getLandingPageBySlug: FunctionReference<
      "query",
      "public",
      { slug: string; storeId: string },
      any
    >;
    getLandingPageByStoreSlug: FunctionReference<
      "query",
      "public",
      { pageSlug: string; storeSlug: string },
      any
    >;
    getLandingPages: FunctionReference<
      "query",
      "public",
      { includeUnpublished?: boolean; storeId: string },
      any
    >;
    getTemplates: FunctionReference<
      "query",
      "public",
      {
        category?:
          | "course"
          | "product"
          | "webinar"
          | "ebook"
          | "music"
          | "general";
      },
      any
    >;
    removeBlock: FunctionReference<
      "mutation",
      "public",
      { blockId: string; pageId: Id<"landingPages"> },
      any
    >;
    reorderBlocks: FunctionReference<
      "mutation",
      "public",
      { blockIds: Array<string>; pageId: Id<"landingPages"> },
      any
    >;
    togglePublish: FunctionReference<
      "mutation",
      "public",
      { pageId: Id<"landingPages"> },
      any
    >;
    trackConversion: FunctionReference<
      "mutation",
      "public",
      { pageId: Id<"landingPages"> },
      any
    >;
    trackPageView: FunctionReference<
      "mutation",
      "public",
      { pageId: Id<"landingPages">; visitorId?: string },
      any
    >;
    updateBlock: FunctionReference<
      "mutation",
      "public",
      {
        blockId: string;
        isVisible?: boolean;
        pageId: Id<"landingPages">;
        settings: any;
      },
      any
    >;
    updateLandingPage: FunctionReference<
      "mutation",
      "public",
      {
        blocks?: Array<{
          id: string;
          isVisible: boolean;
          position: number;
          settings: any;
          type:
            | "hero"
            | "features"
            | "testimonials"
            | "pricing"
            | "cta"
            | "faq"
            | "video"
            | "image"
            | "text"
            | "countdown"
            | "social_proof"
            | "product_showcase"
            | "custom_html";
        }>;
        description?: string;
        linkedCourseId?: Id<"courses">;
        linkedProductId?: Id<"digitalProducts">;
        metaDescription?: string;
        metaTitle?: string;
        ogImage?: string;
        pageId: Id<"landingPages">;
        slug?: string;
        title?: string;
      },
      any
    >;
  };
  langchainNotes: {
    deleteSource: FunctionReference<
      "mutation",
      "public",
      { sourceId: Id<"noteSources">; userId: string },
      { error?: string; success: boolean }
    >;
    getSourceById: FunctionReference<
      "query",
      "public",
      { sourceId: Id<"noteSources"> },
      {
        _id: Id<"noteSources">;
        createdAt: number;
        errorMessage?: string;
        fileName?: string;
        generatedNoteIds?: Array<Id<"notes">>;
        keyPoints?: Array<string>;
        processedAt?: number;
        sourceType: "pdf" | "youtube" | "website" | "audio" | "text";
        status: "pending" | "processing" | "completed" | "failed";
        storeId: string;
        summary?: string;
        title: string;
        url?: string;
        userId: string;
        websiteAuthor?: string;
        websiteDomain?: string;
        youtubeChannel?: string;
        youtubeThumbnail?: string;
        youtubeVideoId?: string;
      } | null
    >;
    getSources: FunctionReference<
      "query",
      "public",
      { storeId: string; userId: string },
      Array<{
        _id: Id<"noteSources">;
        createdAt: number;
        fileName?: string;
        generatedNoteIds?: Array<Id<"notes">>;
        sourceType: "pdf" | "youtube" | "website" | "audio" | "text";
        status: "pending" | "processing" | "completed" | "failed";
        summary?: string;
        title: string;
        url?: string;
      }>
    >;
  };
  langchainNotesActions: {
    createNoteSource: FunctionReference<
      "action",
      "public",
      {
        fileName?: string;
        fileSize?: number;
        rawContent?: string;
        sourceType: "pdf" | "youtube" | "website" | "audio" | "text";
        storageId?: Id<"_storage">;
        storeId: string;
        tags?: Array<string>;
        title: string;
        url?: string;
        userId: string;
      },
      { error?: string; sourceId?: Id<"noteSources">; success: boolean }
    >;
    generateMultipleNotesFromSource: FunctionReference<
      "action",
      "public",
      {
        folderId?: Id<"noteFolders">;
        noteTypes: Array<
          "summary" | "detailed" | "bullet_points" | "study_guide" | "outline"
        >;
        sourceId: Id<"noteSources">;
        storeId: string;
        userId: string;
      },
      { errors: Array<string>; noteIds: Array<Id<"notes">>; success: boolean }
    >;
    generateNotesFromSource: FunctionReference<
      "action",
      "public",
      {
        customPrompt?: string;
        folderId?: Id<"noteFolders">;
        noteStyle?:
          | "summary"
          | "detailed"
          | "bullet_points"
          | "study_guide"
          | "outline";
        sourceId: Id<"noteSources">;
        storeId: string;
        userId: string;
      },
      { error?: string; noteId?: Id<"notes">; success: boolean }
    >;
  };
  leaderboards: {
    getMostActive: FunctionReference<
      "query",
      "public",
      { limit?: number },
      Array<{
        avatar?: string;
        badge?: string;
        name: string;
        rank: number;
        streak: number;
        userId: string;
      }>
    >;
    getTopCreators: FunctionReference<
      "query",
      "public",
      { limit?: number; period?: "weekly" | "monthly" | "all-time" },
      Array<{
        avatar?: string;
        badge?: string;
        name: string;
        productCount: number;
        rank: number;
        studentCount: number;
        totalRevenue: number;
        userId: string;
      }>
    >;
    getTopStudents: FunctionReference<
      "query",
      "public",
      { limit?: number },
      Array<{
        avatar?: string;
        badge?: string;
        coursesCompleted: number;
        name: string;
        rank: number;
        totalXP: number;
        userId: string;
      }>
    >;
    getUserPosition: FunctionReference<
      "query",
      "public",
      { leaderboardType: "creators" | "students" | "active"; userId: string },
      { percentile: number; rank: number }
    >;
  };
  leadMagnetAnalysisMutations: {
    deleteAnalysis: FunctionReference<
      "mutation",
      "public",
      { analysisId: Id<"leadMagnetAnalyses"> },
      null
    >;
    getAnalysis: FunctionReference<
      "query",
      "public",
      { analysisId: Id<"leadMagnetAnalyses"> },
      null | {
        _creationTime: number;
        _id: Id<"leadMagnetAnalyses">;
        avgLeadMagnetScore: number;
        bundleIdeas?: Array<{
          chapterIds: Array<string>;
          description: string;
          estimatedVisuals: number;
          name: string;
        }>;
        chapters: Array<{
          chapterId: string;
          chapterTitle: string;
          keyTopics: Array<string>;
          leadMagnetSuggestions: Array<string>;
          lessonId?: string;
          lessonTitle?: string;
          moduleTitle?: string;
          overallLeadMagnetScore: number;
          visualIdeas: Array<{
            category:
              | "concept_diagram"
              | "process_flow"
              | "comparison"
              | "equipment_setup"
              | "waveform_visual"
              | "ui_screenshot"
              | "metaphor"
              | "example";
            embedding?: Array<number>;
            embeddingText?: string;
            estimatedPosition: number;
            illustrationPrompt: string;
            importance: "critical" | "helpful" | "optional";
            leadMagnetPotential: number;
            sentenceOrConcept: string;
            visualDescription: string;
          }>;
          wordCount?: number;
        }>;
        courseId: Id<"courses">;
        courseTitle: string;
        createdAt: number;
        name: string;
        totalChapters: number;
        totalVisualIdeas: number;
        updatedAt?: number;
        userId: string;
      }
    >;
    getCourseAnalyses: FunctionReference<
      "query",
      "public",
      { courseId: Id<"courses">; userId: string },
      Array<{
        _creationTime: number;
        _id: Id<"leadMagnetAnalyses">;
        avgLeadMagnetScore: number;
        createdAt: number;
        name: string;
        totalChapters: number;
        totalVisualIdeas: number;
      }>
    >;
    getUserAnalyses: FunctionReference<
      "query",
      "public",
      { userId: string },
      Array<{
        _creationTime: number;
        _id: Id<"leadMagnetAnalyses">;
        avgLeadMagnetScore: number;
        courseId: Id<"courses">;
        courseTitle: string;
        createdAt: number;
        name: string;
        totalChapters: number;
        totalVisualIdeas: number;
        updatedAt?: number;
        userId: string;
      }>
    >;
    saveAnalysis: FunctionReference<
      "mutation",
      "public",
      {
        analysisResult: {
          analyzedChapters?: number;
          avgLeadMagnetScore: number;
          bundleIdeas?: Array<{
            chapterIds: Array<string>;
            description: string;
            estimatedVisuals: number;
            name: string;
          }>;
          chapters: Array<{
            chapterId: string;
            chapterTitle: string;
            keyTopics: Array<string>;
            leadMagnetSuggestions: Array<string>;
            lessonId?: string;
            lessonTitle?: string;
            moduleTitle?: string;
            overallLeadMagnetScore: number;
            visualIdeas: Array<{
              category:
                | "concept_diagram"
                | "process_flow"
                | "comparison"
                | "equipment_setup"
                | "waveform_visual"
                | "ui_screenshot"
                | "metaphor"
                | "example";
              embedding?: Array<number>;
              embeddingText?: string;
              estimatedPosition: number;
              illustrationPrompt: string;
              importance: "critical" | "helpful" | "optional";
              leadMagnetPotential: number;
              sentenceOrConcept: string;
              visualDescription: string;
            }>;
            wordCount?: number;
          }>;
          courseId: string;
          courseTitle: string;
          overallLeadMagnetScore?: number;
          topLeadMagnetCandidates?: Array<{
            chapterId: string;
            chapterTitle: string;
            reason: string;
            score: number;
          }>;
          totalChapters: number;
          totalVisualIdeas: number;
        };
        courseId: Id<"courses">;
        courseTitle: string;
        name: string;
        userId: string;
      },
      Id<"leadMagnetAnalyses">
    >;
    updateAnalysisName: FunctionReference<
      "mutation",
      "public",
      { analysisId: Id<"leadMagnetAnalyses">; name: string },
      null
    >;
  };
  leadScoring: {
    calculateContactScore: FunctionReference<
      "query",
      "public",
      { contactId: Id<"emailContacts">; storeId: string },
      any
    >;
    deleteScoringRules: FunctionReference<
      "mutation",
      "public",
      { ruleSetId: Id<"leadScoringRules"> },
      any
    >;
    getActiveScoringRules: FunctionReference<
      "query",
      "public",
      { storeId: string },
      any
    >;
    getContactScoreHistory: FunctionReference<
      "query",
      "public",
      { contactId: Id<"emailContacts">; limit?: number },
      any
    >;
    getLeadScoringSummary: FunctionReference<
      "query",
      "public",
      { storeId: string },
      any
    >;
    getLeadsNeedingAttention: FunctionReference<
      "query",
      "public",
      { limit?: number; storeId: string },
      any
    >;
    getScoreDistribution: FunctionReference<
      "query",
      "public",
      { storeId: string },
      any
    >;
    getScoringRules: FunctionReference<
      "query",
      "public",
      { storeId: string },
      any
    >;
    getTopLeads: FunctionReference<
      "query",
      "public",
      { limit?: number; storeId: string },
      any
    >;
    rebuildLeadScoringSummary: FunctionReference<
      "mutation",
      "public",
      { storeId: string },
      any
    >;
    recalculateAllScores: FunctionReference<
      "mutation",
      "public",
      { storeId: string },
      any
    >;
    saveScoringRules: FunctionReference<
      "mutation",
      "public",
      {
        description?: string;
        isActive: boolean;
        name: string;
        ruleSetId?: Id<"leadScoringRules">;
        rules: Array<{
          category: "engagement" | "demographic" | "behavior" | "recency";
          field: string;
          id: string;
          isNegative?: boolean;
          operator:
            | "equals"
            | "greater_than"
            | "less_than"
            | "between"
            | "contains";
          points: number;
          value: any;
        }>;
        storeId: string;
      },
      any
    >;
  };
  leadSubmissions: {
    checkDownloadAccess: FunctionReference<
      "query",
      "public",
      { email: string; productId: Id<"digitalProducts"> },
      {
        downloadUrl?: string;
        hasAccess: boolean;
        submissionInfo?: {
          _id: Id<"leadSubmissions">;
          downloadCount?: number;
          lastDownloadAt?: number;
          name: string;
        };
      }
    >;
    getLeadsForAdmin: FunctionReference<
      "query",
      "public",
      { adminUserId: string },
      Array<{
        _creationTime: number;
        _id: Id<"leadSubmissions">;
        adminUserId: string;
        downloadCount?: number;
        email: string;
        hasDownloaded?: boolean;
        lastDownloadAt?: number;
        name: string;
        productId: Id<"digitalProducts">;
        productTitle?: string;
        source?: string;
        storeId: string;
      }>
    >;
    getLeadsForProduct: FunctionReference<
      "query",
      "public",
      { productId: Id<"digitalProducts"> },
      Array<{
        _creationTime: number;
        _id: Id<"leadSubmissions">;
        downloadCount?: number;
        email: string;
        hasDownloaded?: boolean;
        lastDownloadAt?: number;
        name: string;
        source?: string;
      }>
    >;
    getLeadsForStore: FunctionReference<
      "query",
      "public",
      { storeId: string },
      Array<{
        _creationTime: number;
        _id: Id<"leadSubmissions">;
        downloadCount?: number;
        email: string;
        hasDownloaded?: boolean;
        lastDownloadAt?: number;
        name: string;
        productId: Id<"digitalProducts">;
        productTitle?: string;
        source?: string;
      }>
    >;
    getLeadStats: FunctionReference<
      "query",
      "public",
      { adminUserId: string },
      {
        conversionRate: number;
        totalDownloads: number;
        totalLeads: number;
        uniqueDownloaders: number;
      }
    >;
    submitLead: FunctionReference<
      "mutation",
      "public",
      {
        adminUserId: string;
        email: string;
        ipAddress?: string;
        name: string;
        productId: Id<"digitalProducts">;
        source?: string;
        storeId: string;
        userAgent?: string;
      },
      {
        downloadUrl?: string;
        hasAccess: boolean;
        submissionId: Id<"leadSubmissions">;
      }
    >;
    trackDownload: FunctionReference<
      "mutation",
      "public",
      { submissionId: Id<"leadSubmissions"> },
      null
    >;
  };
  library: {
    createBundlePurchase: FunctionReference<
      "mutation",
      "public",
      {
        amount: number;
        bundleId: Id<"bundles">;
        currency?: string;
        paymentMethod?: string;
        transactionId?: string;
        userId: string;
      },
      Id<"purchases">
    >;
    createCourseEnrollment: FunctionReference<
      "mutation",
      "public",
      {
        amount: number;
        courseId: Id<"courses">;
        currency?: string;
        paymentMethod?: string;
        transactionId?: string;
        userId: string;
      },
      Id<"purchases">
    >;
    createDigitalProductPurchase: FunctionReference<
      "mutation",
      "public",
      {
        amount: number;
        currency?: string;
        paymentMethod?: string;
        productId: Id<"digitalProducts">;
        transactionId?: string;
        userId: string;
      },
      Id<"purchases">
    >;
    getCourseWithProgress: FunctionReference<
      "query",
      "public",
      { slug: string; userId: string },
      {
        _creationTime: number;
        _id: Id<"courses">;
        category?: string;
        description?: string;
        imageUrl?: string;
        lastAccessedChapter?: string;
        modules?: Array<{
          _id: string;
          description?: string;
          lessons?: Array<{
            _id: string;
            chapters?: Array<{
              _id: string;
              audioGenerationStatus?:
                | "pending"
                | "generating"
                | "completed"
                | "failed";
              audioUrl?: string;
              description?: string;
              generatedAudioUrl?: string;
              generatedVideoUrl?: string;
              isCompleted?: boolean;
              position: number;
              timeSpent?: number;
              title: string;
              videoGenerationStatus?:
                | "pending"
                | "generating"
                | "completed"
                | "failed";
              videoUrl?: string;
            }>;
            description?: string;
            position: number;
            title: string;
          }>;
          position: number;
          title: string;
        }>;
        overallProgress: number;
        skillLevel?: string;
        slug?: string;
        subcategory?: string;
        tags?: Array<string>;
        title: string;
      } | null
    >;
    getUserCourses: FunctionReference<
      "query",
      "public",
      { userId: string },
      Array<{
        _creationTime: number;
        _id: Id<"courses">;
        category?: string;
        description?: string;
        imageUrl?: string;
        lastAccessedAt?: number;
        progress?: number;
        purchaseDate: number;
        skillLevel?: string;
        slug?: string;
        storeName?: string;
        storeSlug?: string;
        subcategory?: string;
        tags?: Array<string>;
        title: string;
      }>
    >;
    getUserDigitalProducts: FunctionReference<
      "query",
      "public",
      { userId: string },
      Array<{
        _creationTime: number;
        _id: Id<"digitalProducts">;
        description?: string;
        downloadCount?: number;
        downloadUrl?: string;
        imageUrl?: string;
        lastAccessedAt?: number;
        productType?: "digital" | "urlMedia";
        purchaseDate: number;
        storeName?: string;
        storeSlug?: string;
        style?: "button" | "callout" | "preview" | "card" | "minimal";
        title: string;
        url?: string;
      }>
    >;
    getUserPurchases: FunctionReference<
      "query",
      "public",
      { userId: string },
      Array<{
        _creationTime: number;
        _id: Id<"purchases">;
        accessGranted?: boolean;
        amount: number;
        beatLicenseId?: Id<"beatLicenses">;
        courseId?: Id<"courses">;
        currency?: string;
        downloadCount?: number;
        lastAccessedAt?: number;
        product?: any;
        productDescription?: string;
        productId?: Id<"digitalProducts">;
        productImageUrl?: string;
        productTitle?: string;
        productType:
          | "digitalProduct"
          | "course"
          | "coaching"
          | "bundle"
          | "beatLease";
        status: "pending" | "completed" | "refunded";
        storeName?: string;
        storeSlug?: string;
        userId: string;
      }>
    >;
    hasUserPurchasedCourse: FunctionReference<
      "query",
      "public",
      { courseId: Id<"courses">; userId: string },
      boolean
    >;
    trackDownload: FunctionReference<
      "mutation",
      "public",
      { productId: Id<"digitalProducts">; userId: string },
      null
    >;
    trackLibrarySession: FunctionReference<
      "mutation",
      "public",
      {
        deviceType?: string;
        duration?: number;
        resourceId?: string;
        sessionType: "course" | "download" | "coaching" | "browse";
        userAgent?: string;
        userId: string;
      },
      Id<"librarySessions">
    >;
    updateProgress: FunctionReference<
      "mutation",
      "public",
      {
        chapterId: string;
        isCompleted: boolean;
        lessonId?: string;
        moduleId?: string;
        slug: string;
        timeSpent?: number;
        userId: string;
      },
      Id<"userProgress">
    >;
    verifyCourseAccess: FunctionReference<
      "query",
      "public",
      { slug: string; userId: string },
      { hasAccess: boolean; progress?: number; purchaseDate?: number }
    >;
    verifyProductAccess: FunctionReference<
      "query",
      "public",
      { productId: Id<"digitalProducts">; userId: string },
      { downloadCount?: number; hasAccess: boolean; purchaseDate?: number }
    >;
  };
  libraryHelpers: {
    getPackSamplesWithUrls: FunctionReference<
      "query",
      "public",
      { userId: string },
      Array<{
        _id: string;
        fileName: string;
        fileSize: number;
        fileUrl: string;
        packId: Id<"digitalProducts">;
        packTitle: string;
        purchaseDate: number;
        storageId: string;
        tags: Array<string>;
        title: string;
      }>
    >;
  };
  linkInBio: {
    createLink: FunctionReference<
      "mutation",
      "public",
      {
        description?: string;
        icon?: string;
        storeId: Id<"stores">;
        thumbnailUrl?: string;
        title: string;
        url: string;
        userId: string;
      },
      { linkId?: Id<"linkInBioLinks">; message: string; success: boolean }
    >;
    deleteLink: FunctionReference<
      "mutation",
      "public",
      { linkId: Id<"linkInBioLinks"> },
      { message: string; success: boolean }
    >;
    getLinkAnalytics: FunctionReference<
      "query",
      "public",
      { days?: number; linkId: Id<"linkInBioLinks"> },
      {
        clicksByCountry: Array<{ clicks: number; country: string }>;
        clicksByDevice: Array<{ clicks: number; device: string }>;
        clicksBySource: Array<{ clicks: number; source: string }>;
        clicksOverTime: Array<{ clicks: number; date: string }>;
        totalClicks: number;
      }
    >;
    getPublicStoreLinks: FunctionReference<
      "query",
      "public",
      { storeId: Id<"stores"> },
      Array<{
        _id: Id<"linkInBioLinks">;
        description?: string;
        icon?: string;
        order: number;
        thumbnailUrl?: string;
        title: string;
        url: string;
      }>
    >;
    getStoreLinks: FunctionReference<
      "query",
      "public",
      { storeId: Id<"stores"> },
      Array<{
        _id: Id<"linkInBioLinks">;
        clicks: number;
        createdAt: number;
        description?: string;
        icon?: string;
        isActive: boolean;
        order: number;
        storeId: Id<"stores">;
        thumbnailUrl?: string;
        title: string;
        updatedAt: number;
        url: string;
        userId: string;
      }>
    >;
    getStoreLinksAnalytics: FunctionReference<
      "query",
      "public",
      { days?: number; storeId: Id<"stores"> },
      {
        deviceBreakdown: Array<{ clicks: number; device: string }>;
        linkPerformance: Array<{
          clicks: number;
          linkId: Id<"linkInBioLinks">;
          percentOfTotal: number;
          title: string;
          url: string;
        }>;
        topSources: Array<{ clicks: number; source: string }>;
        totalClicks: number;
      }
    >;
    reorderLinks: FunctionReference<
      "mutation",
      "public",
      { linkIds: Array<Id<"linkInBioLinks">>; storeId: Id<"stores"> },
      { message: string; success: boolean }
    >;
    trackLinkClick: FunctionReference<
      "mutation",
      "public",
      {
        browser?: string;
        campaign?: string;
        city?: string;
        country?: string;
        deviceType?: "desktop" | "mobile" | "tablet";
        linkId: Id<"linkInBioLinks">;
        medium?: string;
        os?: string;
        referrer?: string;
        region?: string;
        source?: string;
        userAgent?: string;
      },
      { success: boolean }
    >;
    updateLink: FunctionReference<
      "mutation",
      "public",
      {
        description?: string;
        icon?: string;
        isActive?: boolean;
        linkId: Id<"linkInBioLinks">;
        thumbnailUrl?: string;
        title?: string;
        url?: string;
      },
      { message: string; success: boolean }
    >;
  };
  liveViewers: {
    getActiveViewers: FunctionReference<
      "query",
      "public",
      {
        chapterId?: Id<"courseChapters">;
        courseId: Id<"courses">;
        limit?: number;
      },
      Array<{
        chapterId?: Id<"courseChapters">;
        chapterTitle?: string;
        lastSeen: number;
        userAvatar?: string;
        userId: string;
        userName?: string;
      }>
    >;
    getLiveViewerCount: FunctionReference<
      "query",
      "public",
      { chapterId?: Id<"courseChapters">; courseId: Id<"courses"> },
      {
        byChapter?: Array<{ chapterId: Id<"courseChapters">; count: number }>;
        total: number;
      }
    >;
    recordPresence: FunctionReference<
      "mutation",
      "public",
      {
        chapterId?: Id<"courseChapters">;
        courseId: Id<"courses">;
        userId: string;
      },
      any
    >;
    removePresence: FunctionReference<
      "mutation",
      "public",
      { courseId: Id<"courses">; userId: string },
      any
    >;
  };
  marketingCampaigns: {
    createCampaign: FunctionReference<
      "mutation",
      "public",
      {
        campaignType:
          | "product_launch"
          | "welcome_onboarding"
          | "flash_sale"
          | "reengagement"
          | "course_milestone"
          | "seasonal_holiday";
        courseId?: Id<"courses">;
        description?: string;
        emailContent?: any;
        facebookContent?: any;
        instagramContent?: any;
        linkedinContent?: any;
        name: string;
        productId?: Id<"digitalProducts">;
        storeId: string;
        templateId: string;
        tiktokContent?: any;
        twitterContent?: any;
        userId: string;
        variableValues?: any;
      },
      Id<"marketingCampaigns">
    >;
    deleteCampaign: FunctionReference<
      "mutation",
      "public",
      { campaignId: Id<"marketingCampaigns"> },
      null
    >;
    duplicateCampaign: FunctionReference<
      "mutation",
      "public",
      { campaignId: Id<"marketingCampaigns"> },
      Id<"marketingCampaigns">
    >;
    getCampaign: FunctionReference<
      "query",
      "public",
      { campaignId: Id<"marketingCampaigns"> },
      any | null
    >;
    getCampaignStats: FunctionReference<
      "query",
      "public",
      { storeId: string },
      {
        active: number;
        completed: number;
        draft: number;
        paused: number;
        scheduled: number;
        total: number;
      }
    >;
    listAdminCampaigns: FunctionReference<
      "query",
      "public",
      {
        campaignType?:
          | "product_launch"
          | "welcome_onboarding"
          | "flash_sale"
          | "reengagement"
          | "course_milestone"
          | "seasonal_holiday";
        limit?: number;
        status?: "draft" | "scheduled" | "active" | "completed" | "paused";
      },
      Array<any>
    >;
    listCampaigns: FunctionReference<
      "query",
      "public",
      {
        campaignType?:
          | "product_launch"
          | "welcome_onboarding"
          | "flash_sale"
          | "reengagement"
          | "course_milestone"
          | "seasonal_holiday";
        limit?: number;
        status?: "draft" | "scheduled" | "active" | "completed" | "paused";
        storeId: string;
      },
      Array<any>
    >;
    schedulePlatform: FunctionReference<
      "mutation",
      "public",
      {
        campaignId: Id<"marketingCampaigns">;
        enabled: boolean;
        platform:
          | "email"
          | "instagram"
          | "twitter"
          | "facebook"
          | "linkedin"
          | "tiktok";
        scheduledAt: number;
      },
      null
    >;
    updateAnalytics: FunctionReference<
      "mutation",
      "public",
      {
        analytics: {
          conversions?: number;
          emailClicks?: number;
          emailOpens?: number;
          revenue?: number;
          socialEngagement?: number;
          socialImpressions?: number;
        };
        campaignId: Id<"marketingCampaigns">;
      },
      null
    >;
    updateCampaign: FunctionReference<
      "mutation",
      "public",
      {
        analytics?: any;
        campaignId: Id<"marketingCampaigns">;
        description?: string;
        emailContent?: any;
        facebookContent?: any;
        instagramContent?: any;
        linkedinContent?: any;
        name?: string;
        scheduledPlatforms?: any;
        status?: "draft" | "scheduled" | "active" | "completed" | "paused";
        tiktokContent?: any;
        twitterContent?: any;
        variableValues?: any;
      },
      null
    >;
    updatePlatformContent: FunctionReference<
      "mutation",
      "public",
      {
        campaignId: Id<"marketingCampaigns">;
        content: any;
        platform:
          | "email"
          | "instagram"
          | "twitter"
          | "facebook"
          | "linkedin"
          | "tiktok";
      },
      null
    >;
    updatePlatformStatus: FunctionReference<
      "mutation",
      "public",
      {
        campaignId: Id<"marketingCampaigns">;
        emailCampaignId?: Id<"emailCampaigns">;
        error?: string;
        platform:
          | "email"
          | "instagram"
          | "twitter"
          | "facebook"
          | "linkedin"
          | "tiktok";
        postId?: string;
        scheduledPostId?: Id<"scheduledPosts">;
        status: "pending" | "sent" | "failed" | "skipped";
      },
      null
    >;
  };
  marketplace: {
    getAllCreators: FunctionReference<
      "query",
      "public",
      { limit?: number; offset?: number },
      Array<{
        _id: Id<"stores">;
        avatar?: string;
        bannerImage?: string;
        bio?: string;
        categories: Array<string>;
        name: string;
        slug: string;
        totalCourses: number;
        totalProducts: number;
        totalStudents: number;
      }>
    >;
    getCreatorSpotlight: FunctionReference<
      "query",
      "public",
      {},
      {
        _id: Id<"users">;
        avatar?: string;
        bio?: string;
        name: string;
        slug: string;
        totalProducts: number;
        totalStudents: number;
      } | null
    >;
    getFeaturedContent: FunctionReference<
      "query",
      "public",
      { limit?: number },
      Array<any>
    >;
    getMarketplaceCategories: FunctionReference<
      "query",
      "public",
      {},
      Array<string>
    >;
    getPlatformStats: FunctionReference<
      "query",
      "public",
      {},
      {
        totalCourses: number;
        totalCreators: number;
        totalProducts: number;
        totalStudents: number;
      }
    >;
    searchMarketplace: FunctionReference<
      "query",
      "public",
      {
        category?: string;
        contentType?:
          | "all"
          | "courses"
          | "products"
          | "coaching"
          | "sample-packs"
          | "plugins"
          | "ableton-racks";
        limit?: number;
        offset?: number;
        priceRange?: "free" | "under-50" | "50-100" | "over-100";
        searchTerm?: string;
        sortBy?: "newest" | "popular" | "price-low" | "price-high";
        specificCategories?: Array<string>;
      },
      { results: Array<any>; total: number }
    >;
  };
  masterAI: {
    index: {
      askAgenticAI: FunctionReference<
        "action",
        "public",
        {
          agentEnabledTools?: Array<string>;
          agentId?: Id<"aiAgents">;
          agentSystemPrompt?: string;
          confirmedActions?: Array<{ parameters: any; tool: string }>;
          conversationContext?: Array<{
            content: string;
            role: "user" | "assistant";
          }>;
          conversationId?: string;
          executeActions?: boolean;
          question: string;
          settings?: {
            autoSaveWebResearch: boolean;
            chunksPerFacet: number;
            customModels?: {
              critic?:
                | "gpt-4o"
                | "gpt-4o-mini"
                | "o1"
                | "o1-mini"
                | "gpt-5-mini"
                | "gpt-oss-120b"
                | "claude-4.5-sonnet"
                | "claude-4.5-opus"
                | "claude-4-sonnet"
                | "claude-3.5-sonnet"
                | "claude-3.5-haiku"
                | "gemini-3-pro"
                | "gemini-2.5-flash"
                | "gemini-2.5-flash-lite"
                | "gemini-2.5-pro"
                | "gemini-2.0-flash"
                | "deepseek-chat"
                | "deepseek-r1"
                | "grok-code-fast"
                | "grok-4-fast"
                | "llama-3.3-70b"
                | "qwen-2.5-72b";
              finalWriter?:
                | "gpt-4o"
                | "gpt-4o-mini"
                | "o1"
                | "o1-mini"
                | "gpt-5-mini"
                | "gpt-oss-120b"
                | "claude-4.5-sonnet"
                | "claude-4.5-opus"
                | "claude-4-sonnet"
                | "claude-3.5-sonnet"
                | "claude-3.5-haiku"
                | "gemini-3-pro"
                | "gemini-2.5-flash"
                | "gemini-2.5-flash-lite"
                | "gemini-2.5-pro"
                | "gemini-2.0-flash"
                | "deepseek-chat"
                | "deepseek-r1"
                | "grok-code-fast"
                | "grok-4-fast"
                | "llama-3.3-70b"
                | "qwen-2.5-72b";
              ideaGenerator?:
                | "gpt-4o"
                | "gpt-4o-mini"
                | "o1"
                | "o1-mini"
                | "gpt-5-mini"
                | "gpt-oss-120b"
                | "claude-4.5-sonnet"
                | "claude-4.5-opus"
                | "claude-4-sonnet"
                | "claude-3.5-sonnet"
                | "claude-3.5-haiku"
                | "gemini-3-pro"
                | "gemini-2.5-flash"
                | "gemini-2.5-flash-lite"
                | "gemini-2.5-pro"
                | "gemini-2.0-flash"
                | "deepseek-chat"
                | "deepseek-r1"
                | "grok-code-fast"
                | "grok-4-fast"
                | "llama-3.3-70b"
                | "qwen-2.5-72b";
              planner?:
                | "gpt-4o"
                | "gpt-4o-mini"
                | "o1"
                | "o1-mini"
                | "gpt-5-mini"
                | "gpt-oss-120b"
                | "claude-4.5-sonnet"
                | "claude-4.5-opus"
                | "claude-4-sonnet"
                | "claude-3.5-sonnet"
                | "claude-3.5-haiku"
                | "gemini-3-pro"
                | "gemini-2.5-flash"
                | "gemini-2.5-flash-lite"
                | "gemini-2.5-pro"
                | "gemini-2.0-flash"
                | "deepseek-chat"
                | "deepseek-r1"
                | "grok-code-fast"
                | "grok-4-fast"
                | "llama-3.3-70b"
                | "qwen-2.5-72b";
              summarizer?:
                | "gpt-4o"
                | "gpt-4o-mini"
                | "o1"
                | "o1-mini"
                | "gpt-5-mini"
                | "gpt-oss-120b"
                | "claude-4.5-sonnet"
                | "claude-4.5-opus"
                | "claude-4-sonnet"
                | "claude-3.5-sonnet"
                | "claude-3.5-haiku"
                | "gemini-3-pro"
                | "gemini-2.5-flash"
                | "gemini-2.5-flash-lite"
                | "gemini-2.5-pro"
                | "gemini-2.0-flash"
                | "deepseek-chat"
                | "deepseek-r1"
                | "grok-code-fast"
                | "grok-4-fast"
                | "llama-3.3-70b"
                | "qwen-2.5-72b";
            };
            enableCreativeMode: boolean;
            enableCritic: boolean;
            enableFactVerification: boolean;
            enableWebResearch: boolean;
            maxFacets: number;
            maxRetries?: number;
            preset:
              | "budget"
              | "speed"
              | "balanced"
              | "deepReasoning"
              | "premium";
            qualityThreshold?: number;
            responseStyle:
              | "structured"
              | "conversational"
              | "concise"
              | "educational";
            similarityThreshold: number;
            sourceTypes?: Array<
              "course" | "chapter" | "lesson" | "document" | "note" | "custom"
            >;
            webSearchMaxResults?: number;
          };
          storeId?: string;
          userId: string;
          userRole?: "creator" | "admin" | "student";
        },
        | {
            answer: string;
            citations: Array<{
              excerpt?: string;
              id: number;
              sourceId?: string;
              sourceType: string;
              title: string;
            }>;
            facetsUsed: Array<string>;
            pipelineMetadata: {
              criticModel?: string;
              finalWriterModel: string;
              ideaGeneratorModel?: string;
              plannerModel: string;
              processingTimeMs: number;
              summarizerModel: string;
              totalChunksProcessed: number;
              totalTokensUsed?: number;
              webResearchResults?: number;
            };
          }
        | {
            message: string;
            proposedActions: Array<{
              description: string;
              parameters: any;
              requiresConfirmation: boolean;
              tool: string;
            }>;
            summary: string;
            type: "action_proposal";
          }
        | {
            links?: Array<{ label: string; url: string }>;
            results: Array<{
              error?: string;
              result?: any;
              success: boolean;
              tool: string;
            }>;
            summary: string;
            type: "actions_executed";
          }
      >;
      askMasterAI: FunctionReference<
        "action",
        "public",
        {
          conversationContext?: Array<{
            content: string;
            role: "user" | "assistant";
          }>;
          conversationGoal?: {
            deliverableType?: string;
            extractedAt: number;
            keyConstraints?: Array<string>;
            originalIntent: string;
          };
          conversationId?: string;
          question: string;
          settings?: {
            autoSaveWebResearch: boolean;
            chunksPerFacet: number;
            customModels?: {
              critic?:
                | "gpt-4o"
                | "gpt-4o-mini"
                | "o1"
                | "o1-mini"
                | "gpt-5-mini"
                | "gpt-oss-120b"
                | "claude-4.5-sonnet"
                | "claude-4.5-opus"
                | "claude-4-sonnet"
                | "claude-3.5-sonnet"
                | "claude-3.5-haiku"
                | "gemini-3-pro"
                | "gemini-2.5-flash"
                | "gemini-2.5-flash-lite"
                | "gemini-2.5-pro"
                | "gemini-2.0-flash"
                | "deepseek-chat"
                | "deepseek-r1"
                | "grok-code-fast"
                | "grok-4-fast"
                | "llama-3.3-70b"
                | "qwen-2.5-72b";
              finalWriter?:
                | "gpt-4o"
                | "gpt-4o-mini"
                | "o1"
                | "o1-mini"
                | "gpt-5-mini"
                | "gpt-oss-120b"
                | "claude-4.5-sonnet"
                | "claude-4.5-opus"
                | "claude-4-sonnet"
                | "claude-3.5-sonnet"
                | "claude-3.5-haiku"
                | "gemini-3-pro"
                | "gemini-2.5-flash"
                | "gemini-2.5-flash-lite"
                | "gemini-2.5-pro"
                | "gemini-2.0-flash"
                | "deepseek-chat"
                | "deepseek-r1"
                | "grok-code-fast"
                | "grok-4-fast"
                | "llama-3.3-70b"
                | "qwen-2.5-72b";
              ideaGenerator?:
                | "gpt-4o"
                | "gpt-4o-mini"
                | "o1"
                | "o1-mini"
                | "gpt-5-mini"
                | "gpt-oss-120b"
                | "claude-4.5-sonnet"
                | "claude-4.5-opus"
                | "claude-4-sonnet"
                | "claude-3.5-sonnet"
                | "claude-3.5-haiku"
                | "gemini-3-pro"
                | "gemini-2.5-flash"
                | "gemini-2.5-flash-lite"
                | "gemini-2.5-pro"
                | "gemini-2.0-flash"
                | "deepseek-chat"
                | "deepseek-r1"
                | "grok-code-fast"
                | "grok-4-fast"
                | "llama-3.3-70b"
                | "qwen-2.5-72b";
              planner?:
                | "gpt-4o"
                | "gpt-4o-mini"
                | "o1"
                | "o1-mini"
                | "gpt-5-mini"
                | "gpt-oss-120b"
                | "claude-4.5-sonnet"
                | "claude-4.5-opus"
                | "claude-4-sonnet"
                | "claude-3.5-sonnet"
                | "claude-3.5-haiku"
                | "gemini-3-pro"
                | "gemini-2.5-flash"
                | "gemini-2.5-flash-lite"
                | "gemini-2.5-pro"
                | "gemini-2.0-flash"
                | "deepseek-chat"
                | "deepseek-r1"
                | "grok-code-fast"
                | "grok-4-fast"
                | "llama-3.3-70b"
                | "qwen-2.5-72b";
              summarizer?:
                | "gpt-4o"
                | "gpt-4o-mini"
                | "o1"
                | "o1-mini"
                | "gpt-5-mini"
                | "gpt-oss-120b"
                | "claude-4.5-sonnet"
                | "claude-4.5-opus"
                | "claude-4-sonnet"
                | "claude-3.5-sonnet"
                | "claude-3.5-haiku"
                | "gemini-3-pro"
                | "gemini-2.5-flash"
                | "gemini-2.5-flash-lite"
                | "gemini-2.5-pro"
                | "gemini-2.0-flash"
                | "deepseek-chat"
                | "deepseek-r1"
                | "grok-code-fast"
                | "grok-4-fast"
                | "llama-3.3-70b"
                | "qwen-2.5-72b";
            };
            enableCreativeMode: boolean;
            enableCritic: boolean;
            enableFactVerification: boolean;
            enableWebResearch: boolean;
            maxFacets: number;
            maxRetries?: number;
            preset:
              | "budget"
              | "speed"
              | "balanced"
              | "deepReasoning"
              | "premium";
            qualityThreshold?: number;
            responseStyle:
              | "structured"
              | "conversational"
              | "concise"
              | "educational";
            similarityThreshold: number;
            sourceTypes?: Array<
              "course" | "chapter" | "lesson" | "document" | "note" | "custom"
            >;
            webSearchMaxResults?: number;
          };
          userId?: string;
        },
        {
          answer: string;
          citations: Array<{
            excerpt?: string;
            id: number;
            sourceId?: string;
            sourceType: string;
            title: string;
          }>;
          facetsUsed: Array<string>;
          pipelineMetadata: {
            criticModel?: string;
            finalWriterModel: string;
            ideaGeneratorModel?: string;
            plannerModel: string;
            processingTimeMs: number;
            summarizerModel: string;
            totalChunksProcessed: number;
            totalTokensUsed?: number;
            webResearchResults?: number;
          };
        }
      >;
      executeConfirmedActions: FunctionReference<
        "action",
        "public",
        {
          actions: Array<{ parameters: any; tool: string }>;
          storeId?: string;
          userId: string;
        },
        {
          links?: Array<{ label: string; url: string }>;
          results: Array<{
            error?: string;
            result?: any;
            success: boolean;
            tool: string;
          }>;
          summary: string;
          type: "actions_executed";
        }
      >;
      quickAsk: FunctionReference<
        "action",
        "public",
        { question: string; userId?: string },
        {
          answer: string;
          sources: Array<{ sourceType: string; title: string }>;
        }
      >;
    };
    leadMagnetAnalyzer: {
      analyzeChapterForLeadMagnet: FunctionReference<
        "action",
        "public",
        { chapterId: Id<"courseChapters">; generateEmbeddings?: boolean },
        {
          chapterId: string;
          chapterTitle: string;
          keyTopics: Array<string>;
          leadMagnetSuggestions: Array<string>;
          lessonId?: string;
          lessonTitle?: string;
          moduleTitle?: string;
          overallLeadMagnetScore: number;
          visualIdeas: Array<{
            category:
              | "concept_diagram"
              | "process_flow"
              | "comparison"
              | "equipment_setup"
              | "waveform_visual"
              | "ui_screenshot"
              | "metaphor"
              | "example";
            embedding?: Array<number>;
            embeddingText?: string;
            estimatedPosition: number;
            illustrationPrompt: string;
            importance: "critical" | "helpful" | "optional";
            leadMagnetPotential: number;
            sentenceOrConcept: string;
            visualDescription: string;
          }>;
          wordCount: number;
        }
      >;
      analyzeLeadMagnetOpportunities: FunctionReference<
        "action",
        "public",
        {
          courseId: Id<"courses">;
          generateEmbeddings?: boolean;
          maxChapters?: number;
        },
        {
          analysisTimestamp: number;
          analyzedChapters: number;
          bundleIdeas: Array<{
            chapterIds: Array<string>;
            description: string;
            estimatedVisuals: number;
            name: string;
          }>;
          chapters: Array<{
            chapterId: string;
            chapterTitle: string;
            keyTopics: Array<string>;
            leadMagnetSuggestions: Array<string>;
            lessonId?: string;
            lessonTitle?: string;
            moduleTitle?: string;
            overallLeadMagnetScore: number;
            visualIdeas: Array<{
              category:
                | "concept_diagram"
                | "process_flow"
                | "comparison"
                | "equipment_setup"
                | "waveform_visual"
                | "ui_screenshot"
                | "metaphor"
                | "example";
              embedding?: Array<number>;
              embeddingText?: string;
              estimatedPosition: number;
              illustrationPrompt: string;
              importance: "critical" | "helpful" | "optional";
              leadMagnetPotential: number;
              sentenceOrConcept: string;
              visualDescription: string;
            }>;
            wordCount: number;
          }>;
          courseId: string;
          courseTitle: string;
          topLeadMagnetCandidates: Array<{
            chapterId: string;
            chapterTitle: string;
            reason: string;
            score: number;
          }>;
          totalChapters: number;
          totalVisualIdeas: number;
        }
      >;
      findSimilarVisualIdeas: FunctionReference<
        "action",
        "public",
        {
          analysisResults: {
            analysisTimestamp: number;
            analyzedChapters: number;
            bundleIdeas: Array<{
              chapterIds: Array<string>;
              description: string;
              estimatedVisuals: number;
              name: string;
            }>;
            chapters: Array<{
              chapterId: string;
              chapterTitle: string;
              keyTopics: Array<string>;
              leadMagnetSuggestions: Array<string>;
              lessonId?: string;
              lessonTitle?: string;
              moduleTitle?: string;
              overallLeadMagnetScore: number;
              visualIdeas: Array<{
                category:
                  | "concept_diagram"
                  | "process_flow"
                  | "comparison"
                  | "equipment_setup"
                  | "waveform_visual"
                  | "ui_screenshot"
                  | "metaphor"
                  | "example";
                embedding?: Array<number>;
                embeddingText?: string;
                estimatedPosition: number;
                illustrationPrompt: string;
                importance: "critical" | "helpful" | "optional";
                leadMagnetPotential: number;
                sentenceOrConcept: string;
                visualDescription: string;
              }>;
              wordCount: number;
            }>;
            courseId: string;
            courseTitle: string;
            topLeadMagnetCandidates: Array<{
              chapterId: string;
              chapterTitle: string;
              reason: string;
              score: number;
            }>;
            totalChapters: number;
            totalVisualIdeas: number;
          };
          minScore?: number;
          query: string;
          topK?: number;
        },
        Array<{
          chapterId: string;
          chapterTitle: string;
          similarityScore: number;
          visualIdea: {
            category:
              | "concept_diagram"
              | "process_flow"
              | "comparison"
              | "equipment_setup"
              | "waveform_visual"
              | "ui_screenshot"
              | "metaphor"
              | "example";
            embedding?: Array<number>;
            embeddingText?: string;
            estimatedPosition: number;
            illustrationPrompt: string;
            importance: "critical" | "helpful" | "optional";
            leadMagnetPotential: number;
            sentenceOrConcept: string;
            visualDescription: string;
          };
        }>
      >;
      generateVisualImage: FunctionReference<
        "action",
        "public",
        {
          category?: string;
          chapterId?: string;
          chapterTitle?: string;
          courseTitle?: string;
          importance?: string;
          prompt: string;
          sentenceOrConcept?: string;
          visualDescription?: string;
          visualIndex?: number;
        },
        {
          error?: string;
          imageData?: string;
          imageUrl?: string;
          storageId?: Id<"_storage">;
          success: boolean;
        }
      >;
      saveAcceptedImage: FunctionReference<
        "action",
        "public",
        {
          category: string;
          chapterId: string;
          courseId: string;
          illustrationPrompt: string;
          imageData: string;
          sentenceOrConcept: string;
          storageId?: Id<"_storage">;
          userId: string;
          visualDescription: string;
        },
        {
          error?: string;
          illustrationId?: Id<"scriptIllustrations">;
          imageUrl?: string;
          success: boolean;
        }
      >;
    };
    socialMediaGenerator: {
      combineScripts: FunctionReference<
        "action",
        "public",
        {
          ctaText?: string;
          instagramScript: string;
          tiktokScript: string;
          youtubeScript: string;
        },
        { combinedScript: string; scriptWithCta: string }
      >;
      editSocialImage: FunctionReference<
        "action",
        "public",
        { aspectRatio: "16:9" | "9:16"; imageUrl: string; prompt: string },
        {
          error?: string;
          imageUrl?: string;
          storageId?: Id<"_storage">;
          success: boolean;
        }
      >;
      extractHeadingsFromHtml: FunctionReference<
        "action",
        "public",
        { html: string },
        Array<{
          endIndex: number;
          level: number;
          startIndex: number;
          text: string;
        }>
      >;
      extractSectionContent: FunctionReference<
        "action",
        "public",
        { endIndex: number; html: string; startIndex: number },
        string
      >;
      generateCaptions: FunctionReference<
        "action",
        "public",
        { ctaText?: string; script: string; title?: string },
        { instagramCaption: string; tiktokCaption: string }
      >;
      generateFromUploadedImage: FunctionReference<
        "action",
        "public",
        {
          aspectRatio: "16:9" | "9:16";
          sourceImageUrl: string;
          stylePrompt: string;
        },
        {
          error?: string;
          imageUrl?: string;
          storageId?: Id<"_storage">;
          success: boolean;
        }
      >;
      generateImageEmbedding: FunctionReference<
        "action",
        "public",
        { description: string; imageUrl: string },
        Array<number>
      >;
      generateImagePrompts: FunctionReference<
        "action",
        "public",
        { aspectRatio?: "16:9" | "9:16"; numImages?: number; script: string },
        Array<{
          aspectRatio: "16:9" | "9:16";
          prompt: string;
          sentence: string;
        }>
      >;
      generatePlatformScripts: FunctionReference<
        "action",
        "public",
        {
          chapterTitle?: string;
          courseTitle?: string;
          sourceContent: string;
          userId?: string;
        },
        { instagramScript: string; tiktokScript: string; youtubeScript: string }
      >;
      generatePostImageEmbeddings: FunctionReference<
        "action",
        "public",
        { postId: Id<"socialMediaPosts"> },
        { errors: Array<string>; processedCount: number; success: boolean }
      >;
      generateSocialAudio: FunctionReference<
        "action",
        "public",
        { script: string; voiceId?: string },
        {
          audioUrl?: string;
          duration?: number;
          error?: string;
          storageId?: Id<"_storage">;
          success: boolean;
        }
      >;
      generateSocialImage: FunctionReference<
        "action",
        "public",
        {
          aspectRatio: "16:9" | "9:16";
          prompt: string;
          sentence?: string;
          userId?: string;
        },
        {
          error?: string;
          imageUrl?: string;
          storageId?: Id<"_storage">;
          success: boolean;
        }
      >;
      searchPostImages: FunctionReference<
        "action",
        "public",
        { limit?: number; query: string; userId: string },
        Array<{
          imageIndex: number;
          imageUrl: string;
          postId: Id<"socialMediaPosts">;
          postTitle?: string;
          prompt: string;
          sentence?: string;
          similarity: number;
        }>
      >;
    };
    socialScriptAgent: {
      cancelJob: FunctionReference<
        "action",
        "public",
        { jobId: Id<"scriptGenerationJobs"> },
        any
      >;
      getJobStatus: FunctionReference<
        "action",
        "public",
        { jobId: Id<"scriptGenerationJobs"> },
        any
      >;
      resumeJob: FunctionReference<
        "action",
        "public",
        { jobId: Id<"scriptGenerationJobs"> },
        any
      >;
      startRescoring: FunctionReference<
        "action",
        "public",
        { storeId: string; userId: string },
        any
      >;
      startScriptGeneration: FunctionReference<
        "action",
        "public",
        {
          courseId?: Id<"courses">;
          jobType: "full_scan" | "course_scan" | "incremental";
          storeId: string;
          userId: string;
        },
        Id<"scriptGenerationJobs">
      >;
    };
    socialScriptAgentMutations: {
      getActiveJobs: FunctionReference<
        "query",
        "public",
        { userId: string },
        any
      >;
      getJobById: FunctionReference<
        "query",
        "public",
        { jobId: Id<"scriptGenerationJobs"> },
        any
      >;
      getRecentJobs: FunctionReference<
        "query",
        "public",
        { limit?: number; userId: string },
        any
      >;
    };
  };
  memberships: {
    cancelMembership: FunctionReference<
      "mutation",
      "public",
      {
        cancelImmediately?: boolean;
        subscriptionId: Id<"userCreatorSubscriptions">;
      },
      any
    >;
    checkMembershipAccess: FunctionReference<
      "query",
      "public",
      {
        courseId?: string;
        productId?: string;
        storeId: string;
        userId: string;
      },
      any
    >;
    createMembershipSubscription: FunctionReference<
      "mutation",
      "public",
      {
        billingCycle: "monthly" | "yearly";
        stripeSubscriptionId: string;
        tierId: Id<"creatorSubscriptionTiers">;
        trialEnd?: number;
        userId: string;
      },
      any
    >;
    createMembershipTier: FunctionReference<
      "mutation",
      "public",
      {
        benefits: Array<string>;
        creatorId: string;
        description: string;
        includeAllContent?: boolean;
        includedCourseIds?: Array<string>;
        includedProductIds?: Array<string>;
        maxCourses?: number;
        priceMonthly: number;
        priceYearly?: number;
        storeId: string;
        tierName: string;
        trialDays?: number;
      },
      any
    >;
    deleteMembershipTier: FunctionReference<
      "mutation",
      "public",
      { tierId: Id<"creatorSubscriptionTiers"> },
      any
    >;
    getCreatorCoursesAndProducts: FunctionReference<
      "query",
      "public",
      { storeId: string },
      any
    >;
    getMembershipTierDetails: FunctionReference<
      "query",
      "public",
      { tierId: Id<"creatorSubscriptionTiers"> },
      any
    >;
    getMembershipTiersByStore: FunctionReference<
      "query",
      "public",
      { includeInactive?: boolean; storeId: string },
      any
    >;
    getStoreSubscribers: FunctionReference<
      "query",
      "public",
      {
        status?: "active" | "canceled" | "past_due" | "paused";
        storeId: string;
      },
      any
    >;
    getUserMembership: FunctionReference<
      "query",
      "public",
      { storeId: string; userId: string },
      any
    >;
    publishMembershipTier: FunctionReference<
      "mutation",
      "public",
      { tierId: Id<"creatorSubscriptionTiers"> },
      any
    >;
    unpublishMembershipTier: FunctionReference<
      "mutation",
      "public",
      { tierId: Id<"creatorSubscriptionTiers"> },
      any
    >;
    updateMembershipSubscriptionStatus: FunctionReference<
      "mutation",
      "public",
      {
        cancelAtPeriodEnd?: boolean;
        currentPeriodEnd?: number;
        status: "active" | "canceled" | "past_due" | "paused";
        stripeSubscriptionId: string;
      },
      any
    >;
    updateMembershipTier: FunctionReference<
      "mutation",
      "public",
      {
        benefits?: Array<string>;
        description?: string;
        includedCourseIds?: Array<string>;
        includedProductIds?: Array<string>;
        isActive?: boolean;
        maxCourses?: number;
        priceMonthly?: number;
        priceYearly?: number;
        tierId: Id<"creatorSubscriptionTiers">;
        tierName?: string;
        trialDays?: number;
      },
      any
    >;
    updateStripePriceIds: FunctionReference<
      "mutation",
      "public",
      {
        stripePriceIdMonthly?: string;
        stripePriceIdYearly?: string;
        tierId: Id<"creatorSubscriptionTiers">;
      },
      any
    >;
  };
  migrations: {
    backfillCustomersToContacts: {
      backfillCustomersToContacts: FunctionReference<
        "mutation",
        "public",
        { batchSize?: number; cursor?: string; storeId: string },
        {
          alreadyExisted: number;
          contactsCreated: number;
          contactsUpdated: number;
          customersProcessed: number;
          errorDetails: Array<string>;
          errors: number;
          isDone: boolean;
          nextCursor?: string;
          success: boolean;
        }
      >;
    };
    fixContactStoreIds: {
      fixContactStoreIds: FunctionReference<
        "mutation",
        "public",
        { batchSize?: number; clerkUserId: string; convexStoreId: string },
        {
          duplicates: number;
          errors: Array<string>;
          skipped: number;
          success: boolean;
          updated: number;
        }
      >;
    };
    importPlugins: {
      batchCreatePlugins: FunctionReference<
        "action",
        "public",
        {
          clerkId: string;
          plugins: Array<{
            audioUrl?: string;
            author?: string;
            description?: string;
            image?: string;
            isPublished?: boolean;
            name: string;
            optInFormUrl?: string;
            price?: number;
            pricingType: "FREE" | "PAID" | "FREEMIUM";
            purchaseUrl?: string;
            slug?: string;
            videoUrl?: string;
          }>;
        },
        { errors?: Array<string>; failed: number; success: number }
      >;
      importPluginsFromJSON: FunctionReference<
        "action",
        "public",
        { clerkId: string; jsonData: string },
        {
          errors?: Array<string>;
          stats: {
            effectCategories: number;
            instrumentCategories: number;
            pluginCategories: number;
            pluginTypes: number;
            pluginsError: number;
            pluginsSuccess: number;
            studioToolCategories: number;
          };
          success: boolean;
        }
      >;
    };
    removeNonStudentContacts: {
      removeNonStudentContacts: FunctionReference<
        "mutation",
        "public",
        { batchSize?: number; dryRun?: boolean; storeId: string },
        {
          bySource: any;
          deleted: number;
          isDryRun: boolean;
          kept: number;
          success: boolean;
        }
      >;
    };
    syncStudentsToContacts: {
      syncStudentsToContacts: FunctionReference<
        "mutation",
        "public",
        { batchSize?: number; cursor?: string; storeId: string },
        {
          errors: Array<string>;
          isDone: boolean;
          nextCursor?: string;
          skipped: number;
          studentsProcessed: number;
          success: boolean;
          synced: number;
        }
      >;
    };
    tagStudentsVsLeads: {
      tagStudentsVsLeads: FunctionReference<
        "mutation",
        "public",
        { batchSize?: number; cursor?: string; storeId: string },
        {
          alreadyTagged: number;
          isDone: boolean;
          leadsTagged: number;
          nextCursor?: string;
          processed: number;
          studentsTagged: number;
          success: boolean;
        }
      >;
    };
  };
  mixingServices: {
    getCreatorServices: FunctionReference<
      "query",
      "public",
      { includeUnpublished?: boolean; userId: string },
      Array<any>
    >;
    getMixingServiceBySlug: FunctionReference<
      "query",
      "public",
      { slug: string },
      any | null
    >;
    getPublishedMixingServices: FunctionReference<
      "query",
      "public",
      {
        maxPrice?: number;
        minPrice?: number;
        searchQuery?: string;
        serviceType?: "mixing" | "mastering" | "mix-and-master" | "stem-mixing";
      },
      Array<any>
    >;
    getServiceTypes: FunctionReference<
      "query",
      "public",
      {},
      Array<{ count: number; id: string; label: string }>
    >;
  };
  mixingTemplates: {
    getMixingTemplateBySlug: FunctionReference<
      "query",
      "public",
      { slug: string },
      any | null
    >;
    getPublishedMixingTemplates: FunctionReference<
      "query",
      "public",
      {
        dawType?:
          | "ableton"
          | "fl-studio"
          | "logic"
          | "bitwig"
          | "studio-one"
          | "reason"
          | "cubase"
          | "multi-daw";
        genre?: string;
        searchQuery?: string;
      },
      Array<any>
    >;
  };
  monetizationUtils: {
    applyReferralCode: FunctionReference<
      "mutation",
      "public",
      { referralCode: string; referredUserId: string },
      any
    >;
    approveRefund: FunctionReference<
      "mutation",
      "public",
      { approvedBy: string; refundId: Id<"refunds"> },
      any
    >;
    calculateTax: FunctionReference<
      "query",
      "public",
      { amount: number; country: string; state?: string },
      any
    >;
    completeCreatorPayout: FunctionReference<
      "mutation",
      "public",
      { payoutId: Id<"creatorPayouts">; stripeTransferId?: string },
      any
    >;
    convertCurrency: FunctionReference<
      "query",
      "public",
      { amount: number; from: string; to: string },
      any
    >;
    createCreatorPayout: FunctionReference<
      "mutation",
      "public",
      {
        amount: number;
        creatorId: string;
        currency: string;
        grossRevenue: number;
        netPayout: number;
        paymentProcessingFee: number;
        payoutMethod: string;
        periodEnd: number;
        periodStart: number;
        platformFee: number;
        refunds: number;
        storeId: Id<"stores">;
        stripeConnectAccountId?: string;
        taxWithheld?: number;
        totalSales: number;
      },
      any
    >;
    createPayoutSchedule: FunctionReference<
      "mutation",
      "public",
      {
        creatorId: string;
        dayOfMonth?: number;
        dayOfWeek?: number;
        frequency: "weekly" | "biweekly" | "monthly";
        minimumPayout: number;
        storeId: Id<"stores">;
      },
      any
    >;
    createReferralCode: FunctionReference<
      "mutation",
      "public",
      { userId: string },
      any
    >;
    createTaxRate: FunctionReference<
      "mutation",
      "public",
      {
        country: string;
        state?: string;
        stripeTaxCodeId?: string;
        taxName: string;
        taxRate: number;
        taxType: "vat" | "gst" | "sales_tax";
      },
      any
    >;
    denyRefund: FunctionReference<
      "mutation",
      "public",
      { approvedBy: string; reason: string; refundId: Id<"refunds"> },
      any
    >;
    failCreatorPayout: FunctionReference<
      "mutation",
      "public",
      { payoutId: Id<"creatorPayouts">; reason: string },
      any
    >;
    getCreatorPayouts: FunctionReference<
      "query",
      "public",
      {
        creatorId: string;
        status?: "pending" | "processing" | "completed" | "failed" | "on_hold";
      },
      any
    >;
    getCreatorPendingEarnings: FunctionReference<
      "query",
      "public",
      { creatorId: string },
      any
    >;
    getCurrencyRate: FunctionReference<
      "query",
      "public",
      { from: string; to: string },
      any
    >;
    getPayoutSchedule: FunctionReference<
      "query",
      "public",
      { creatorId: string },
      any
    >;
    getRefundsByStore: FunctionReference<
      "query",
      "public",
      {
        status?: "requested" | "approved" | "processed" | "denied" | "canceled";
        storeId: Id<"stores">;
      },
      any
    >;
    getTaxRate: FunctionReference<
      "query",
      "public",
      { country: string; state?: string },
      any
    >;
    getUserReferrals: FunctionReference<
      "query",
      "public",
      { userId: string },
      any
    >;
    getUserRefunds: FunctionReference<
      "query",
      "public",
      { userId: string },
      any
    >;
    markPurchasesAsPaidOut: FunctionReference<
      "mutation",
      "public",
      { payoutId: Id<"creatorPayouts">; purchaseIds: Array<Id<"purchases">> },
      any
    >;
    processPayoutRequest: FunctionReference<
      "mutation",
      "public",
      {
        amount: number;
        creatorId: string;
        currency: string;
        grossRevenue: number;
        platformFee: number;
        processingFee: number;
        purchaseIds: Array<Id<"purchases">>;
        storeId: Id<"stores">;
        stripeConnectAccountId: string;
      },
      any
    >;
    processRefund: FunctionReference<
      "mutation",
      "public",
      { refundId: Id<"refunds">; stripeRefundId?: string },
      any
    >;
    requestRefund: FunctionReference<
      "mutation",
      "public",
      {
        creatorId: string;
        itemId: string;
        itemType: "course" | "product" | "subscription" | "bundle";
        orderId: string;
        originalAmount: number;
        reason: string;
        refundAmount: number;
        revokeAccess?: boolean;
        storeId: Id<"stores">;
        userId: string;
      },
      any
    >;
    updateCurrencyRate: FunctionReference<
      "mutation",
      "public",
      { from: string; rate: number; source: string; to: string },
      any
    >;
    updatePayoutSchedule: FunctionReference<
      "mutation",
      "public",
      {
        dayOfMonth?: number;
        dayOfWeek?: number;
        frequency?: "weekly" | "biweekly" | "monthly";
        isActive?: boolean;
        minimumPayout?: number;
        scheduleId: Id<"payoutSchedules">;
      },
      any
    >;
  };
  musicShowcase: {
    addTrackFromUrl: FunctionReference<
      "mutation",
      "public",
      {
        artist?: string;
        artistProfileId: Id<"artistProfiles">;
        artworkUrl?: string;
        customDescription?: string;
        customGenre?: string;
        customTags?: Array<string>;
        description?: string;
        duration?: number;
        embedUrl?: string;
        genre?: string;
        isFeatured?: boolean;
        isPublic?: boolean;
        originalUrl: string;
        platform:
          | "spotify"
          | "soundcloud"
          | "youtube"
          | "apple_music"
          | "bandcamp"
          | "other";
        releaseDate?: string;
        slug?: string;
        storeId?: string;
        tags?: Array<string>;
        title: string;
        userId: string;
      },
      Id<"musicTracks">
    >;
    createArtistProfile: FunctionReference<
      "mutation",
      "public",
      {
        artistName: string;
        bannerImage?: string;
        bio?: string;
        displayName?: string;
        location?: string;
        profileImage?: string;
        slug?: string;
        socialLinks?: {
          apple_music?: string;
          bandcamp?: string;
          facebook?: string;
          instagram?: string;
          soundcloud?: string;
          spotify?: string;
          tiktok?: string;
          twitter?: string;
          youtube?: string;
        };
        storeId?: string;
        userId: string;
        website?: string;
      },
      Id<"artistProfiles">
    >;
    getArtistProfile: FunctionReference<
      "query",
      "public",
      { userId: string },
      {
        _creationTime: number;
        _id: Id<"artistProfiles">;
        artistName: string;
        bannerImage?: string;
        bio?: string;
        displayName?: string;
        isPublic?: boolean;
        location?: string;
        profileImage?: string;
        slug?: string;
        socialLinks?: {
          apple_music?: string;
          bandcamp?: string;
          facebook?: string;
          instagram?: string;
          soundcloud?: string;
          spotify?: string;
          tiktok?: string;
          twitter?: string;
          youtube?: string;
        };
        storeId?: string;
        totalFollowers?: number;
        totalLikes?: number;
        totalPlays?: number;
        totalViews?: number;
        userId: string;
        website?: string;
      } | null
    >;
    getArtistProfileBySlug: FunctionReference<
      "query",
      "public",
      { slug: string },
      {
        _creationTime: number;
        _id: Id<"artistProfiles">;
        artistName: string;
        bannerImage?: string;
        bio?: string;
        displayName?: string;
        isPublic?: boolean;
        location?: string;
        profileImage?: string;
        slug?: string;
        socialLinks?: {
          apple_music?: string;
          bandcamp?: string;
          facebook?: string;
          instagram?: string;
          soundcloud?: string;
          spotify?: string;
          tiktok?: string;
          twitter?: string;
          youtube?: string;
        };
        storeId?: string;
        totalFollowers?: number;
        totalLikes?: number;
        totalPlays?: number;
        totalViews?: number;
        userId: string;
        website?: string;
      } | null
    >;
    getArtistTracks: FunctionReference<
      "query",
      "public",
      {
        artistProfileId: Id<"artistProfiles">;
        limit?: number;
        publicOnly?: boolean;
      },
      Array<{
        _creationTime: number;
        _id: Id<"musicTracks">;
        artist?: string;
        artistProfileId: Id<"artistProfiles">;
        artworkUrl?: string;
        customDescription?: string;
        customGenre?: string;
        customTags?: Array<string>;
        description?: string;
        duration?: number;
        embedUrl?: string;
        genre?: string;
        isFeatured?: boolean;
        isPublic?: boolean;
        likeCount?: number;
        originalUrl: string;
        platform:
          | "spotify"
          | "soundcloud"
          | "youtube"
          | "apple_music"
          | "bandcamp"
          | "other";
        playCount?: number;
        releaseDate?: string;
        shareCount?: number;
        slug?: string;
        storeId?: string;
        tags?: Array<string>;
        title: string;
        userId: string;
        viewCount?: number;
      }>
    >;
    searchMusic: FunctionReference<
      "query",
      "public",
      { limit?: number; query: string; type?: "artists" | "tracks" | "all" },
      {
        artists: Array<{
          _id: Id<"artistProfiles">;
          artistName: string;
          displayName?: string;
          profileImage?: string;
          slug?: string;
          totalFollowers?: number;
          totalViews?: number;
        }>;
        tracks: Array<{
          _id: Id<"musicTracks">;
          artist?: string;
          artistProfileId: Id<"artistProfiles">;
          artworkUrl?: string;
          duration?: number;
          slug?: string;
          title: string;
          viewCount?: number;
        }>;
      }
    >;
    toggleArtistFollow: FunctionReference<
      "mutation",
      "public",
      { artistProfileId: Id<"artistProfiles">; followerId: string },
      { followerCount: number; following: boolean }
    >;
    toggleTrackLike: FunctionReference<
      "mutation",
      "public",
      { trackId: Id<"musicTracks">; userId: string },
      { likeCount: number; liked: boolean }
    >;
    trackPlay: FunctionReference<
      "mutation",
      "public",
      {
        city?: string;
        completionPercentage?: number;
        country?: string;
        device?: string;
        ipAddress?: string;
        playDuration?: number;
        referrer?: string;
        source?: "profile" | "embed" | "direct_link" | "search" | "playlist";
        trackId: Id<"musicTracks">;
        userAgent?: string;
        userId?: string;
      },
      Id<"trackPlays">
    >;
  };
  notes: {
    createFolder: FunctionReference<
      "mutation",
      "public",
      {
        color?: string;
        description?: string;
        icon?: string;
        name: string;
        parentId?: Id<"noteFolders">;
        storeId: string;
        userId: string;
      },
      Id<"noteFolders">
    >;
    createNote: FunctionReference<
      "mutation",
      "public",
      {
        category?: string;
        content: string;
        coverImage?: string;
        folderId?: Id<"noteFolders">;
        icon?: string;
        priority?: "low" | "medium" | "high" | "urgent";
        storeId: string;
        tags?: Array<string>;
        title: string;
        userId: string;
      },
      Id<"notes">
    >;
    createNoteTemplate: FunctionReference<
      "mutation",
      "public",
      {
        category: string;
        content: string;
        createdBy: string;
        description: string;
        icon?: string;
        isPublic: boolean;
        name: string;
        tags: Array<string>;
      },
      Id<"noteTemplates">
    >;
    deleteFolder: FunctionReference<
      "mutation",
      "public",
      { folderId: Id<"noteFolders">; moveNotesToFolderId?: Id<"noteFolders"> },
      null
    >;
    deleteNote: FunctionReference<
      "mutation",
      "public",
      { noteId: Id<"notes"> },
      null
    >;
    getFoldersByUser: FunctionReference<
      "query",
      "public",
      { parentId?: Id<"noteFolders">; storeId: string; userId: string },
      Array<{
        _creationTime: number;
        _id: Id<"noteFolders">;
        color?: string;
        description?: string;
        icon?: string;
        isArchived: boolean;
        name: string;
        parentId?: Id<"noteFolders">;
        position: number;
        storeId: string;
        userId: string;
      }>
    >;
    getNote: FunctionReference<
      "query",
      "public",
      { noteId: Id<"notes"> },
      {
        _creationTime: number;
        _id: Id<"notes">;
        aiSummary?: string;
        category?: string;
        content: string;
        coverImage?: string;
        folderId?: Id<"noteFolders">;
        icon?: string;
        isArchived: boolean;
        isFavorite: boolean;
        isProcessedForRAG: boolean;
        isShared: boolean;
        isTemplate: boolean;
        lastEditedAt: number;
        lastViewedAt?: number;
        linkedCourseId?: Id<"courses">;
        plainTextContent?: string;
        priority?: "low" | "medium" | "high" | "urgent";
        readTimeMinutes?: number;
        sharedWith?: Array<string>;
        status: "draft" | "in_progress" | "completed" | "archived";
        storeId: string;
        tags: Array<string>;
        templateCategory?: string;
        title: string;
        userId: string;
        wordCount?: number;
      } | null
    >;
    getNotesByUser: FunctionReference<
      "query",
      "public",
      {
        folderId?: Id<"noteFolders">;
        paginationOpts: {
          cursor: string | null;
          endCursor?: string | null;
          id?: number;
          maximumBytesRead?: number;
          maximumRowsRead?: number;
          numItems: number;
        };
        status?: "draft" | "in_progress" | "completed" | "archived";
        storeId: string;
        userId: string;
      },
      any
    >;
    getNoteTemplates: FunctionReference<
      "query",
      "public",
      { category?: string; createdBy?: string; limit?: number },
      Array<{
        _creationTime: number;
        _id: Id<"noteTemplates">;
        category: string;
        content: string;
        createdBy: string;
        description: string;
        icon?: string;
        isPublic: boolean;
        name: string;
        tags: Array<string>;
        usageCount: number;
      }>
    >;
    searchNotes: FunctionReference<
      "query",
      "public",
      {
        category?: string;
        limit?: number;
        searchQuery: string;
        status?: "draft" | "in_progress" | "completed" | "archived";
        storeId: string;
        userId: string;
      },
      Array<{
        _creationTime: number;
        _id: Id<"notes">;
        category?: string;
        icon?: string;
        isFavorite: boolean;
        lastEditedAt: number;
        plainTextContent?: string;
        status: "draft" | "in_progress" | "completed" | "archived";
        tags: Array<string>;
        title: string;
      }>
    >;
    updateFolder: FunctionReference<
      "mutation",
      "public",
      {
        color?: string;
        description?: string;
        folderId: Id<"noteFolders">;
        icon?: string;
        name?: string;
        parentId?: Id<"noteFolders">;
      },
      null
    >;
    updateNote: FunctionReference<
      "mutation",
      "public",
      {
        category?: string;
        content?: string;
        coverImage?: string;
        folderId?: Id<"noteFolders">;
        icon?: string;
        isFavorite?: boolean;
        noteId: Id<"notes">;
        priority?: "low" | "medium" | "high" | "urgent";
        status?: "draft" | "in_progress" | "completed" | "archived";
        tags?: Array<string>;
        title?: string;
      },
      null
    >;
    updateNoteLastViewed: FunctionReference<
      "mutation",
      "public",
      { noteId: Id<"notes"> },
      null
    >;
    useNoteTemplate: FunctionReference<
      "mutation",
      "public",
      {
        folderId?: Id<"noteFolders">;
        storeId: string;
        templateId: Id<"noteTemplates">;
        title: string;
        userId: string;
      },
      Id<"notes">
    >;
  };
  notesToCourse: {
    generateCourseFromNotes: FunctionReference<
      "action",
      "public",
      {
        courseCategory?: string;
        courseDescription?: string;
        courseTitle: string;
        includeQuizzes?: boolean;
        matchExistingStyle?: boolean;
        noteIds: Array<Id<"notes">>;
        preferredModuleCount?: number;
        skillLevel?: "beginner" | "intermediate" | "advanced";
        storeId: string;
        targetAudience?: string;
        userId: string;
      },
      {
        courseId?: Id<"courses">;
        courseStructure?: any;
        error?: string;
        success: boolean;
      }
    >;
    generateNotesSummary: FunctionReference<
      "action",
      "public",
      {
        noteIds: Array<Id<"notes">>;
        summaryType?: "brief" | "detailed" | "outline" | "key_points";
        userId: string;
      },
      {
        estimatedReadTime: number;
        keyTopics: Array<string>;
        suggestedTags: Array<string>;
        summary: string;
        wordCount: number;
      }
    >;
    getNotesImprovementSuggestions: FunctionReference<
      "action",
      "public",
      { courseGoal: string; noteIds: Array<Id<"notes">>; userId: string },
      {
        estimatedCourseLength: string;
        overallRecommendations: Array<string>;
        recommendedStructure: any;
        suggestions: Array<{
          missingTopics: Array<string>;
          noteId: Id<"notes">;
          noteTitle: string;
          qualityScore: number;
          suggestions: Array<string>;
        }>;
      }
    >;
  };
  notificationPreferences: {
    getUserPreferences: FunctionReference<
      "query",
      "public",
      { userId: string },
      {
        _id: Id<"notificationPreferences">;
        emailDigest: "realtime" | "daily" | "weekly" | "never";
        emailNotifications: {
          announcements: boolean;
          courseUpdates: boolean;
          earnings: boolean;
          marketing: boolean;
          mentions: boolean;
          newContent: boolean;
          purchases: boolean;
          replies: boolean;
          systemAlerts: boolean;
        };
        inAppNotifications: {
          announcements: boolean;
          courseUpdates: boolean;
          earnings: boolean;
          marketing: boolean;
          mentions: boolean;
          newContent: boolean;
          purchases: boolean;
          replies: boolean;
          systemAlerts: boolean;
        };
        userId: string;
      } | null
    >;
    toggleEmailNotification: FunctionReference<
      "mutation",
      "public",
      {
        category:
          | "announcements"
          | "courseUpdates"
          | "newContent"
          | "mentions"
          | "replies"
          | "purchases"
          | "earnings"
          | "systemAlerts"
          | "marketing";
        enabled: boolean;
        userId: string;
      },
      { success: boolean }
    >;
    updatePreferences: FunctionReference<
      "mutation",
      "public",
      {
        emailDigest?: "realtime" | "daily" | "weekly" | "never";
        emailNotifications?: {
          announcements: boolean;
          courseUpdates: boolean;
          earnings: boolean;
          marketing: boolean;
          mentions: boolean;
          newContent: boolean;
          purchases: boolean;
          replies: boolean;
          systemAlerts: boolean;
        };
        inAppNotifications?: {
          announcements: boolean;
          courseUpdates: boolean;
          earnings: boolean;
          marketing: boolean;
          mentions: boolean;
          newContent: boolean;
          purchases: boolean;
          replies: boolean;
          systemAlerts: boolean;
        };
        userId: string;
      },
      { preferencesId: Id<"notificationPreferences">; success: boolean }
    >;
  };
  notifications: {
    createNotification: FunctionReference<
      "mutation",
      "public",
      {
        actionLabel?: string;
        category?:
          | "announcements"
          | "courseUpdates"
          | "newContent"
          | "mentions"
          | "replies"
          | "purchases"
          | "earnings"
          | "systemAlerts"
          | "marketing";
        clerkId: string;
        link?: string;
        message: string;
        sendEmail?: boolean;
        targetType: "all" | "students" | "creators" | "specific";
        targetUserIds?: Array<string>;
        title: string;
        type: "info" | "success" | "warning" | "error";
      },
      { message: string; notificationCount: number; success: boolean }
    >;
    deleteNotification: FunctionReference<
      "mutation",
      "public",
      { clerkId: string; notificationId: Id<"notifications"> },
      null
    >;
    getAllNotifications: FunctionReference<
      "query",
      "public",
      { clerkId?: string },
      Array<any>
    >;
    getNotificationStats: FunctionReference<
      "query",
      "public",
      { clerkId?: string },
      {
        byType: {
          error: number;
          info: number;
          success: number;
          warning: number;
        };
        total: number;
        unread: number;
      }
    >;
    getUnreadCount: FunctionReference<
      "query",
      "public",
      { userId: string },
      number
    >;
    getUserNotifications: FunctionReference<
      "query",
      "public",
      { limit?: number; userId: string },
      Array<{
        _creationTime: number;
        _id: Id<"notifications">;
        actionLabel?: string;
        createdAt: number;
        emailSent?: boolean;
        emailSentAt?: number;
        link?: string;
        message: string;
        read: boolean;
        readAt?: number;
        senderAvatar?: string;
        senderId?: string;
        senderName?: string;
        senderType?: "platform" | "creator" | "system";
        title: string;
        type: "info" | "success" | "warning" | "error";
        userId: string;
      }>
    >;
    markAllAsRead: FunctionReference<
      "mutation",
      "public",
      { userId: string },
      null
    >;
    markAsRead: FunctionReference<
      "mutation",
      "public",
      { notificationId: Id<"notifications">; userId: string },
      null
    >;
  };
  packSamples: {
    getSamplesFromPacks: FunctionReference<
      "query",
      "public",
      { genre?: string; limit?: number; packId?: Id<"digitalProducts"> },
      Array<{
        _id: string;
        bpm?: number;
        category?: string;
        creatorAvatar?: string;
        creatorName?: string;
        creditPrice: number;
        fileSize?: number;
        fileType?: string;
        fileUrl: string;
        genre?: string;
        genres?: Array<string>;
        name: string;
        packCategory?: string;
        packId: Id<"digitalProducts">;
        packTitle: string;
        price: number;
        storageId: string;
        tags?: Array<string>;
        title: string;
      }>
    >;
  };
  paymentPlans: {
    cancelPaymentPlan: FunctionReference<
      "mutation",
      "public",
      { planId: Id<"paymentPlans"> },
      any
    >;
    createPaymentPlan: FunctionReference<
      "mutation",
      "public",
      {
        bundleId?: Id<"bundles">;
        courseId?: Id<"courses">;
        downPayment: number;
        frequency: "weekly" | "biweekly" | "monthly";
        numberOfInstallments: number;
        productId?: Id<"digitalProducts">;
        stripeSubscriptionId?: string;
        totalAmount: number;
        userId: string;
      },
      any
    >;
    getPaymentPlanDetails: FunctionReference<
      "query",
      "public",
      { planId: Id<"paymentPlans"> },
      any
    >;
    getUpcomingPayments: FunctionReference<
      "query",
      "public",
      { daysAhead?: number; userId: string },
      any
    >;
    getUserPaymentPlans: FunctionReference<
      "query",
      "public",
      {
        status?: "active" | "completed" | "defaulted" | "canceled";
        userId: string;
      },
      any
    >;
    recordFailedPayment: FunctionReference<
      "mutation",
      "public",
      { failureReason: string; installmentId: Id<"installmentPayments"> },
      any
    >;
    recordInstallmentPayment: FunctionReference<
      "mutation",
      "public",
      {
        installmentId: Id<"installmentPayments">;
        stripePaymentIntentId?: string;
      },
      any
    >;
  };
  platformSettings: {
    getPublicSettings: FunctionReference<
      "query",
      "public",
      {},
      {
        description?: string;
        faviconUrl?: string;
        logoUrl?: string;
        maintenanceMode?: boolean;
        platformName?: string;
        primaryColor?: string;
        secondaryColor?: string;
        supportEmail?: string;
        tagline?: string;
      } | null
    >;
    getSettings: FunctionReference<
      "query",
      "public",
      { clerkId?: string; key?: string },
      {
        _id: Id<"platformSettings">;
        allowRegistration?: boolean;
        currency?: string;
        dateFormat?: string;
        defaultUserRole?: string;
        description?: string;
        faviconUrl?: string;
        key: string;
        logoUrl?: string;
        maintenanceMode?: boolean;
        platformName?: string;
        primaryColor?: string;
        requireEmailVerification?: boolean;
        secondaryColor?: string;
        supportEmail?: string;
        tagline?: string;
        timezone?: string;
        updatedAt: number;
        updatedBy?: string;
      } | null
    >;
    saveSettings: FunctionReference<
      "mutation",
      "public",
      {
        allowRegistration?: boolean;
        clerkId: string;
        currency?: string;
        dateFormat?: string;
        defaultUserRole?: string;
        description?: string;
        faviconUrl?: string;
        key?: string;
        logoUrl?: string;
        maintenanceMode?: boolean;
        platformName?: string;
        primaryColor?: string;
        requireEmailVerification?: boolean;
        secondaryColor?: string;
        supportEmail?: string;
        tagline?: string;
        timezone?: string;
      },
      { message: string; success: boolean }
    >;
  };
  playlists: {
    addTrackToPlaylist: FunctionReference<
      "mutation",
      "public",
      {
        addedBy: string;
        notes?: string;
        playlistId: Id<"curatorPlaylists">;
        trackId: Id<"userTracks">;
      },
      null
    >;
    createPlaylist: FunctionReference<
      "mutation",
      "public",
      {
        acceptsSubmissions: boolean;
        applePlaylistUrl?: string;
        coverUrl?: string;
        creatorId: string;
        customSlug?: string;
        description?: string;
        genres?: Array<string>;
        isPublic: boolean;
        name: string;
        soundcloudPlaylistUrl?: string;
        spotifyPlaylistUrl?: string;
        submissionPricing?: {
          currency: string;
          isFree: boolean;
          price?: number;
        };
        submissionRules?: {
          allowedGenres?: Array<string>;
          guidelines?: string;
          maxLengthSeconds?: number;
          requiresMessage: boolean;
        };
        submissionSLA?: number;
      },
      Id<"curatorPlaylists">
    >;
    getCreatorPlaylists: FunctionReference<
      "query",
      "public",
      { creatorId: string },
      Array<any>
    >;
    getPlaylistByIdOrSlug: FunctionReference<
      "query",
      "public",
      { identifier: string },
      any | null
    >;
    getPlaylistsAcceptingSubmissions: FunctionReference<
      "query",
      "public",
      { genre?: string; limit?: number },
      Array<any>
    >;
    getPlaylistTracks: FunctionReference<
      "query",
      "public",
      { playlistId: Id<"curatorPlaylists"> },
      Array<any>
    >;
    updatePlaylist: FunctionReference<
      "mutation",
      "public",
      {
        acceptsSubmissions?: boolean;
        applePlaylistUrl?: string;
        coverUrl?: string;
        customSlug?: string;
        description?: string;
        genres?: Array<string>;
        isPublic?: boolean;
        name?: string;
        playlistId: Id<"curatorPlaylists">;
        soundcloudPlaylistUrl?: string;
        spotifyPlaylistUrl?: string;
        submissionPricing?: {
          currency: string;
          isFree: boolean;
          price?: number;
        };
        submissionRules?: {
          allowedGenres?: Array<string>;
          guidelines?: string;
          maxLengthSeconds?: number;
          requiresMessage: boolean;
        };
        submissionSLA?: number;
      },
      null
    >;
  };
  plugins: {
    createEffectCategory: FunctionReference<
      "mutation",
      "public",
      { clerkId: string; name: string; pluginTypeId?: Id<"pluginTypes"> },
      Id<"pluginEffectCategories">
    >;
    createInstrumentCategory: FunctionReference<
      "mutation",
      "public",
      { clerkId: string; name: string; pluginTypeId?: Id<"pluginTypes"> },
      Id<"pluginInstrumentCategories">
    >;
    createPlugin: FunctionReference<
      "mutation",
      "public",
      {
        audioUrl?: string;
        author?: string;
        categoryId?: Id<"pluginCategories">;
        clerkId: string;
        description?: string;
        effectCategoryId?: Id<"pluginEffectCategories">;
        image?: string;
        instrumentCategoryId?: Id<"pluginInstrumentCategories">;
        isPublished?: boolean;
        name: string;
        optInFormUrl?: string;
        pluginTypeId?: Id<"pluginTypes">;
        price?: number;
        pricingType: "FREE" | "PAID" | "FREEMIUM";
        purchaseUrl?: string;
        slug?: string;
        studioToolCategoryId?: Id<"pluginStudioToolCategories">;
        videoScript?: string;
        videoUrl?: string;
      },
      any
    >;
    createPluginCategory: FunctionReference<
      "mutation",
      "public",
      { clerkId: string; name: string },
      Id<"pluginCategories">
    >;
    createPluginType: FunctionReference<
      "mutation",
      "public",
      { clerkId: string; name: string },
      any
    >;
    createStudioToolCategory: FunctionReference<
      "mutation",
      "public",
      { clerkId: string; name: string; pluginTypeId?: Id<"pluginTypes"> },
      Id<"pluginStudioToolCategories">
    >;
    deleteAllEffectCategories: FunctionReference<
      "mutation",
      "public",
      { clerkId: string },
      number
    >;
    deleteAllInstrumentCategories: FunctionReference<
      "mutation",
      "public",
      { clerkId: string },
      number
    >;
    deleteAllPluginCategories: FunctionReference<
      "mutation",
      "public",
      { clerkId: string },
      number
    >;
    deleteAllPlugins: FunctionReference<
      "mutation",
      "public",
      { clerkId: string },
      number
    >;
    deleteAllPluginTypes: FunctionReference<
      "mutation",
      "public",
      { clerkId: string },
      number
    >;
    deleteAllStudioToolCategories: FunctionReference<
      "mutation",
      "public",
      { clerkId: string },
      number
    >;
    deletePlugin: FunctionReference<
      "mutation",
      "public",
      { clerkId: string; pluginId: Id<"plugins"> },
      any
    >;
    getAllPlugins: FunctionReference<
      "query",
      "public",
      { clerkId: string },
      Array<{
        _creationTime: number;
        _id: Id<"plugins">;
        audioUrl?: string;
        author?: string;
        categoryId?: Id<"pluginCategories">;
        categoryName?: string;
        createdAt: number;
        description?: string;
        effectCategoryId?: Id<"pluginEffectCategories">;
        image?: string;
        instrumentCategoryId?: Id<"pluginInstrumentCategories">;
        isPublished?: boolean;
        name: string;
        optInFormUrl?: string;
        pluginTypeId?: Id<"pluginTypes">;
        price?: number;
        pricingType: "FREE" | "PAID" | "FREEMIUM";
        purchaseUrl?: string;
        slug?: string;
        studioToolCategoryId?: Id<"pluginStudioToolCategories">;
        tags?: Array<string>;
        typeName?: string;
        updatedAt: number;
        userId?: string;
        videoScript?: string;
        videoUrl?: string;
      }>
    >;
    getAllPublishedPlugins: FunctionReference<
      "query",
      "public",
      {},
      Array<{
        _creationTime: number;
        _id: Id<"plugins">;
        audioUrl?: string;
        author?: string;
        categoryId?: Id<"pluginCategories">;
        categoryName?: string;
        createdAt: number;
        description?: string;
        effectCategoryId?: Id<"pluginEffectCategories">;
        image?: string;
        instrumentCategoryId?: Id<"pluginInstrumentCategories">;
        isPublished?: boolean;
        name: string;
        optInFormUrl?: string;
        pluginTypeId?: Id<"pluginTypes">;
        price?: number;
        pricingType: "FREE" | "PAID" | "FREEMIUM";
        purchaseUrl?: string;
        slug?: string;
        studioToolCategoryId?: Id<"pluginStudioToolCategories">;
        tags?: Array<string>;
        typeName?: string;
        updatedAt: number;
        userId?: string;
        videoScript?: string;
        videoUrl?: string;
      }>
    >;
    getAllSpecificCategories: FunctionReference<
      "query",
      "public",
      {},
      Array<{ _id: string; name: string; type: string }>
    >;
    getEffectCategories: FunctionReference<
      "query",
      "public",
      { pluginTypeId?: Id<"pluginTypes"> },
      Array<{
        _creationTime: number;
        _id: Id<"pluginEffectCategories">;
        createdAt: number;
        name: string;
        pluginTypeId?: Id<"pluginTypes">;
        updatedAt: number;
      }>
    >;
    getInstrumentCategories: FunctionReference<
      "query",
      "public",
      { pluginTypeId?: Id<"pluginTypes"> },
      Array<{
        _creationTime: number;
        _id: Id<"pluginInstrumentCategories">;
        createdAt: number;
        name: string;
        pluginTypeId?: Id<"pluginTypes">;
        updatedAt: number;
      }>
    >;
    getPluginById: FunctionReference<
      "query",
      "public",
      { pluginId: Id<"plugins"> },
      any
    >;
    getPluginBySlug: FunctionReference<
      "query",
      "public",
      { slug: string },
      any
    >;
    getPluginCategories: FunctionReference<
      "query",
      "public",
      {},
      Array<{
        _creationTime: number;
        _id: Id<"pluginCategories">;
        createdAt: number;
        name: string;
        updatedAt: number;
      }>
    >;
    getPluginTags: FunctionReference<"query", "public", {}, Array<string>>;
    getPluginTypes: FunctionReference<
      "query",
      "public",
      {},
      Array<{
        _creationTime: number;
        _id: Id<"pluginTypes">;
        createdAt: number;
        name: string;
        updatedAt: number;
      }>
    >;
    getStudioToolCategories: FunctionReference<
      "query",
      "public",
      { pluginTypeId?: Id<"pluginTypes"> },
      Array<{
        _creationTime: number;
        _id: Id<"pluginStudioToolCategories">;
        createdAt: number;
        name: string;
        pluginTypeId?: Id<"pluginTypes">;
        updatedAt: number;
      }>
    >;
    updatePlugin: FunctionReference<
      "mutation",
      "public",
      {
        audioUrl?: string;
        author?: string;
        categoryId?: Id<"pluginCategories">;
        clerkId: string;
        description?: string;
        image?: string;
        isPublished?: boolean;
        name?: string;
        optInFormUrl?: string;
        pluginId: Id<"plugins">;
        pluginTypeId?: Id<"pluginTypes">;
        price?: number;
        pricingType?: "FREE" | "PAID" | "FREEMIUM";
        purchaseUrl?: string;
        slug?: string;
        videoScript?: string;
        videoUrl?: string;
      },
      any
    >;
    updatePluginCategories: FunctionReference<
      "mutation",
      "public",
      {
        clerkId: string;
        effectCategoryId?: Id<"pluginEffectCategories">;
        instrumentCategoryId?: Id<"pluginInstrumentCategories">;
        pluginId: Id<"plugins">;
        studioToolCategoryId?: Id<"pluginStudioToolCategories">;
      },
      null
    >;
  };
  pluginVideoGeneration: {
    generateUniversalPluginScript: FunctionReference<
      "action",
      "public",
      {
        clerkId: string;
        generateAudio?: boolean;
        pluginId: Id<"plugins">;
        voiceId?: string;
      },
      {
        audioScript?: string;
        audioUrl?: string;
        error?: string;
        script?: string;
        storageId?: string;
        success: boolean;
      }
    >;
  };
  presetPacks: {
    getBySlug: FunctionReference<"query", "public", { slug: string }, any>;
    getProductById: FunctionReference<
      "query",
      "public",
      { productId: Id<"digitalProducts"> },
      any
    >;
    getRelated: FunctionReference<
      "query",
      "public",
      { limit?: number; productId: Id<"digitalProducts"> },
      any
    >;
    listPublished: FunctionReference<
      "query",
      "public",
      {
        cursor?: string;
        dawType?: string;
        genre?: string;
        limit?: number;
        priceFilter?: "free" | "paid" | "all";
        searchQuery?: string;
        sortBy?: "newest" | "popular" | "price-low" | "price-high";
        targetPlugin?: string;
      },
      any
    >;
  };
  productAI: {
    generateAll: FunctionReference<
      "action",
      "public",
      {
        category: string;
        existingDescription?: string;
        price?: number;
        title: string;
      },
      {
        description: string;
        faqs: Array<{ answer: string; question: string }>;
        salesCopy: {
          bulletPoints: Array<string>;
          ctaText: string;
          headline: string;
          subheadline: string;
        };
        seo: {
          keywords: Array<string>;
          metaDescription: string;
          metaTitle: string;
        };
        shortDescription: string;
        tags: Array<string>;
      }
    >;
    generateBulletPoints: FunctionReference<
      "action",
      "public",
      { category: string; description: string; title: string },
      {
        benefits: Array<string>;
        features: Array<string>;
        whatsIncluded: Array<string>;
      }
    >;
    generateFAQ: FunctionReference<
      "action",
      "public",
      { category: string; description: string; price?: number; title: string },
      { faqs: Array<{ answer: string; question: string }> }
    >;
    generateProductDescription: FunctionReference<
      "action",
      "public",
      {
        category: string;
        existingDescription?: string;
        keywords?: Array<string>;
        title: string;
      },
      { description: string; shortDescription: string }
    >;
    generateSalesCopy: FunctionReference<
      "action",
      "public",
      { category: string; description: string; price?: number; title: string },
      {
        bulletPoints: Array<string>;
        ctaText: string;
        headline: string;
        socialProof: string;
        subheadline: string;
        urgencyText?: string;
      }
    >;
    generateSEO: FunctionReference<
      "action",
      "public",
      { category: string; description: string; title: string },
      {
        keywords: Array<string>;
        metaDescription: string;
        metaTitle: string;
        ogDescription: string;
        ogTitle: string;
      }
    >;
    rewriteInTone: FunctionReference<
      "action",
      "public",
      {
        text: string;
        textType: "title" | "description" | "headline";
        tone:
          | "professional"
          | "casual"
          | "hype"
          | "minimal"
          | "storytelling"
          | "technical";
      },
      { rewritten: string; tone: string }
    >;
    suggestTags: FunctionReference<
      "action",
      "public",
      { category: string; description: string; title: string },
      {
        genres: Array<string>;
        instruments: Array<string>;
        moods: Array<string>;
        tags: Array<string>;
      }
    >;
    translateContent: FunctionReference<
      "action",
      "public",
      { description: string; targetLanguage: string; title: string },
      { description: string; language: string; title: string }
    >;
  };
  projectFiles: {
    getCreatorProjectFiles: FunctionReference<
      "query",
      "public",
      { includeUnpublished?: boolean; userId: string },
      Array<any>
    >;
    getProjectFileBySlug: FunctionReference<
      "query",
      "public",
      { slug: string },
      any | null
    >;
    getProjectFileGenres: FunctionReference<
      "query",
      "public",
      {},
      Array<string>
    >;
    getPublishedProjectFiles: FunctionReference<
      "query",
      "public",
      {
        dawType?:
          | "ableton"
          | "fl-studio"
          | "logic"
          | "bitwig"
          | "studio-one"
          | "reason"
          | "cubase"
          | "multi-daw";
        genre?: string;
        maxPrice?: number;
        minPrice?: number;
        searchQuery?: string;
      },
      Array<any>
    >;
  };
  purchases: {
    createCoachingPurchase: FunctionReference<
      "mutation",
      "public",
      {
        amount: number;
        coachingSessionId: Id<"coachingSessions">;
        currency?: string;
        paymentMethod?: string;
        productId: Id<"digitalProducts">;
        transactionId?: string;
        userId: string;
      },
      Id<"purchases">
    >;
    getStorePurchases: FunctionReference<
      "query",
      "public",
      { limit?: number; storeId: string },
      Array<{
        _creationTime: number;
        _id: Id<"purchases">;
        amount: number;
        buyerEmail?: string;
        buyerName?: string;
        currency?: string;
        productTitle?: string;
        productType:
          | "digitalProduct"
          | "course"
          | "coaching"
          | "bundle"
          | "beatLease";
        status: "pending" | "completed" | "refunded";
        userId: string;
      }>
    >;
    getStorePurchaseStats: FunctionReference<
      "query",
      "public",
      { storeId: string; timeRange?: "7d" | "30d" | "90d" | "all" },
      {
        averageOrderValue: number;
        completedPurchases: number;
        totalPurchases: number;
        totalRevenue: number;
      }
    >;
    getUserPurchases: FunctionReference<
      "query",
      "public",
      {
        limit?: number;
        status?: "pending" | "completed" | "refunded";
        userId: string;
      },
      Array<{
        _creationTime: number;
        _id: Id<"purchases">;
        amount: number;
        currency?: string;
        productImage?: string;
        productTitle?: string;
        productType:
          | "digitalProduct"
          | "course"
          | "coaching"
          | "bundle"
          | "beatLease";
        status: "pending" | "completed" | "refunded";
        storeName?: string;
      }>
    >;
  };
  qa: {
    acceptAnswer: FunctionReference<
      "mutation",
      "public",
      { answerId: Id<"answers">; questionId: Id<"questions">; userId: string },
      { error?: string; success: boolean }
    >;
    askQuestion: FunctionReference<
      "mutation",
      "public",
      {
        authorAvatar?: string;
        authorId: string;
        authorName: string;
        chapterIndex?: number;
        content: string;
        courseId: Id<"courses">;
        lessonId: string;
        lessonIndex?: number;
        title: string;
      },
      { error?: string; questionId?: Id<"questions">; success: boolean }
    >;
    deleteQuestion: FunctionReference<
      "mutation",
      "public",
      { questionId: Id<"questions">; userId: string },
      { error?: string; success: boolean }
    >;
    getAnswersByQuestion: FunctionReference<
      "query",
      "public",
      { questionId: Id<"questions"> },
      Array<{
        _creationTime: number;
        _id: Id<"answers">;
        authorAvatar?: string;
        authorId: string;
        authorName: string;
        content: string;
        courseId: Id<"courses">;
        createdAt: number;
        isAccepted: boolean;
        isInstructor: boolean;
        questionId: Id<"questions">;
        updatedAt: number;
        upvotes: number;
      }>
    >;
    getQuestion: FunctionReference<
      "query",
      "public",
      { questionId: Id<"questions"> },
      {
        _creationTime: number;
        _id: Id<"questions">;
        acceptedAnswerId?: Id<"answers">;
        answerCount: number;
        authorAvatar?: string;
        authorId: string;
        authorName: string;
        chapterIndex?: number;
        content: string;
        courseId: Id<"courses">;
        createdAt: number;
        isResolved: boolean;
        lastActivityAt: number;
        lessonId: string;
        lessonIndex?: number;
        title: string;
        updatedAt: number;
        upvotes: number;
        viewCount: number;
      } | null
    >;
    getQuestionsByCourse: FunctionReference<
      "query",
      "public",
      { courseId: Id<"courses">; limit?: number },
      Array<{
        _creationTime: number;
        _id: Id<"questions">;
        acceptedAnswerId?: Id<"answers">;
        answerCount: number;
        authorAvatar?: string;
        authorId: string;
        authorName: string;
        chapterIndex?: number;
        content: string;
        courseId: Id<"courses">;
        createdAt: number;
        isResolved: boolean;
        lastActivityAt: number;
        lessonId: string;
        lessonIndex?: number;
        title: string;
        updatedAt: number;
        upvotes: number;
        viewCount: number;
      }>
    >;
    getQuestionsByLesson: FunctionReference<
      "query",
      "public",
      {
        courseId: Id<"courses">;
        lessonId: string;
        sortBy?: "recent" | "votes" | "unanswered";
      },
      Array<{
        _creationTime: number;
        _id: Id<"questions">;
        acceptedAnswerId?: Id<"answers">;
        answerCount: number;
        authorAvatar?: string;
        authorId: string;
        authorName: string;
        chapterIndex?: number;
        content: string;
        courseId: Id<"courses">;
        createdAt: number;
        isResolved: boolean;
        lastActivityAt: number;
        lessonId: string;
        lessonIndex?: number;
        title: string;
        updatedAt: number;
        upvotes: number;
        viewCount: number;
      }>
    >;
    getUserVote: FunctionReference<
      "query",
      "public",
      { targetId: string; targetType: "question" | "answer"; userId: string },
      { voteType: "upvote" | "downvote" } | null
    >;
    incrementViewCount: FunctionReference<
      "mutation",
      "public",
      { questionId: Id<"questions"> },
      null
    >;
    postAnswer: FunctionReference<
      "mutation",
      "public",
      {
        authorAvatar?: string;
        authorId: string;
        authorName: string;
        content: string;
        courseId: Id<"courses">;
        isInstructor: boolean;
        questionId: Id<"questions">;
      },
      { answerId?: Id<"answers">; error?: string; success: boolean }
    >;
    vote: FunctionReference<
      "mutation",
      "public",
      {
        targetId: string;
        targetType: "question" | "answer";
        userId: string;
        voteType: "upvote" | "downvote";
      },
      { error?: string; newVoteCount?: number; success: boolean }
    >;
  };
  quizzes: {
    addQuestion: FunctionReference<
      "mutation",
      "public",
      {
        answers: any;
        caseSensitive?: boolean;
        explanation?: string;
        partialCredit?: boolean;
        points: number;
        questionImage?: string;
        questionText: string;
        questionType:
          | "multiple_choice"
          | "true_false"
          | "fill_blank"
          | "short_answer"
          | "essay"
          | "matching";
        quizId: Id<"quizzes">;
      },
      { error?: string; questionId?: Id<"quizQuestions">; success: boolean }
    >;
    createQuiz: FunctionReference<
      "mutation",
      "public",
      {
        chapterId?: string;
        courseId: Id<"courses">;
        description?: string;
        instructorId: string;
        maxAttempts?: number;
        passingScore: number;
        quizType: "practice" | "assessment" | "final_exam";
        requiredToPass: boolean;
        showCorrectAnswers: boolean;
        showScoreImmediately: boolean;
        shuffleAnswers: boolean;
        shuffleQuestions: boolean;
        timeLimit?: number;
        title: string;
      },
      { error?: string; quizId?: Id<"quizzes">; success: boolean }
    >;
    getQuizAttempt: FunctionReference<
      "query",
      "public",
      { attemptId: Id<"quizAttempts"> },
      any
    >;
    getQuizWithQuestions: FunctionReference<
      "query",
      "public",
      { quizId: Id<"quizzes"> },
      any
    >;
    getQuizzesForCourse: FunctionReference<
      "query",
      "public",
      { courseId: Id<"courses">; includeUnpublished?: boolean },
      any
    >;
    getUserQuizResults: FunctionReference<
      "query",
      "public",
      { courseId?: Id<"courses">; quizId?: Id<"quizzes">; userId: string },
      any
    >;
    publishQuiz: FunctionReference<
      "mutation",
      "public",
      { quizId: Id<"quizzes"> },
      { error?: string; success: boolean }
    >;
    startQuizAttempt: FunctionReference<
      "mutation",
      "public",
      { courseId: Id<"courses">; quizId: Id<"quizzes">; userId: string },
      { attemptId?: Id<"quizAttempts">; error?: string; success: boolean }
    >;
    submitQuizAttempt: FunctionReference<
      "mutation",
      "public",
      {
        answers: Array<{ answer: any; questionId: Id<"quizQuestions"> }>;
        attemptId: Id<"quizAttempts">;
      },
      {
        error?: string;
        passed?: boolean;
        percentage?: number;
        score?: number;
        success: boolean;
      }
    >;
  };
  rag: {
    addContent: FunctionReference<
      "mutation",
      "public",
      {
        category?: string;
        content: string;
        metadata?: any;
        sourceId?: string;
        sourceType?:
          | "course"
          | "chapter"
          | "lesson"
          | "document"
          | "note"
          | "custom"
          | "socialPost";
        title?: string;
        userId: string;
      },
      Id<"embeddings">
    >;
    importCourseContent: FunctionReference<
      "mutation",
      "public",
      { courseId: Id<"courses">; userId: string },
      null
    >;
  };
  ragActions: {
    askQuestion: FunctionReference<
      "action",
      "public",
      {
        category?: string;
        limit?: number;
        question: string;
        sourceType?:
          | "course"
          | "chapter"
          | "lesson"
          | "document"
          | "note"
          | "custom";
        systemPrompt?: string;
        userId?: string;
      },
      {
        answer: string;
        sources: Array<{
          content: string;
          similarity: number;
          sourceType?: string;
          title?: string;
        }>;
      }
    >;
    searchSimilar: FunctionReference<
      "action",
      "public",
      {
        category?: string;
        limit?: number;
        query: string;
        sourceType?:
          | "course"
          | "chapter"
          | "lesson"
          | "document"
          | "note"
          | "custom";
        threshold?: number;
        userId?: string;
      },
      Array<{
        _id: Id<"embeddings">;
        category?: string;
        content: string;
        metadata: any;
        similarity: number;
        sourceId?: string;
        sourceType?: string;
        title?: string;
        userId: string;
      }>
    >;
  };
  recommendations: {
    generateRecommendations: FunctionReference<
      "mutation",
      "public",
      { userId: string },
      { count: number; success: boolean }
    >;
    getRecommendationsWithDetails: FunctionReference<
      "query",
      "public",
      { userId: string },
      any
    >;
  };
  releasePreSaves: {
    checkPreSave: FunctionReference<
      "query",
      "public",
      { email: string; releaseId: Id<"digitalProducts"> },
      | {
          hasPreSaved: true;
          platforms: {
            amazonMusic?: boolean;
            appleMusic?: boolean;
            deezer?: boolean;
            spotify?: boolean;
            tidal?: boolean;
          };
        }
      | { hasPreSaved: false }
    >;
    createPreSave: FunctionReference<
      "mutation",
      "public",
      {
        appleMusicUserToken?: string;
        email: string;
        ipAddress?: string;
        name?: string;
        platforms: {
          amazonMusic?: boolean;
          appleMusic?: boolean;
          deezer?: boolean;
          spotify?: boolean;
          tidal?: boolean;
        };
        releaseId: Id<"digitalProducts">;
        source?: string;
        spotifyAccessToken?: string;
        spotifyRefreshToken?: string;
        spotifyUserId?: string;
        userAgent?: string;
      },
      Id<"releasePreSaves">
    >;
    getByCreator: FunctionReference<
      "query",
      "public",
      { creatorId: string; limit?: number },
      Array<{
        _id: Id<"releasePreSaves">;
        email: string;
        name?: string;
        platforms: {
          amazonMusic?: boolean;
          appleMusic?: boolean;
          deezer?: boolean;
          spotify?: boolean;
          tidal?: boolean;
        };
        preSavedAt: number;
        releaseId: Id<"digitalProducts">;
      }>
    >;
    getByRelease: FunctionReference<
      "query",
      "public",
      { releaseId: Id<"digitalProducts"> },
      Array<{
        _creationTime: number;
        _id: Id<"releasePreSaves">;
        email: string;
        name?: string;
        platforms: {
          amazonMusic?: boolean;
          appleMusic?: boolean;
          deezer?: boolean;
          spotify?: boolean;
          tidal?: boolean;
        };
        preSavedAt: number;
        source?: string;
      }>
    >;
    getCount: FunctionReference<
      "query",
      "public",
      { releaseId: Id<"digitalProducts"> },
      { appleMusic: number; spotify: number; total: number }
    >;
    getPreSavesNeedingEmail: FunctionReference<
      "query",
      "public",
      {
        emailType:
          | "preSaveConfirmation"
          | "releaseDay"
          | "followUp48h"
          | "playlistPitch";
        limit?: number;
        releaseId: Id<"digitalProducts">;
      },
      Array<{
        _id: Id<"releasePreSaves">;
        email: string;
        name?: string;
        platforms: {
          amazonMusic?: boolean;
          appleMusic?: boolean;
          deezer?: boolean;
          spotify?: boolean;
          tidal?: boolean;
        };
      }>
    >;
    updateEmailStatus: FunctionReference<
      "mutation",
      "public",
      {
        emailType:
          | "preSaveConfirmation"
          | "releaseDay"
          | "followUp48h"
          | "playlistPitch";
        preSaveId: Id<"releasePreSaves">;
      },
      any
    >;
  };
  reports: {
    createReport: FunctionReference<
      "mutation",
      "public",
      {
        contentId: string;
        contentPreview?: string;
        contentTitle: string;
        contentType?: string;
        reason: string;
        reportedBy: string;
        reportedUserName?: string;
        reporterName: string;
        storeId?: string;
        type:
          | "course"
          | "comment"
          | "user"
          | "product"
          | "sample"
          | "copyright";
      },
      Id<"reports">
    >;
    createSampleReports: FunctionReference<"mutation", "public", {}, null>;
    deleteReport: FunctionReference<
      "mutation",
      "public",
      { clerkId: string; reportId: Id<"reports"> },
      null
    >;
    getAllReports: FunctionReference<
      "query",
      "public",
      { clerkId?: string },
      Array<any>
    >;
    getReportsByStatus: FunctionReference<
      "query",
      "public",
      {
        clerkId?: string;
        status:
          | "pending"
          | "reviewed"
          | "resolved"
          | "dismissed"
          | "counter_notice";
      },
      Array<any>
    >;
    getReportStats: FunctionReference<
      "query",
      "public",
      { clerkId?: string },
      {
        counter_notice: number;
        dismissed: number;
        pending: number;
        resolved: number;
        reviewed: number;
        total: number;
      }
    >;
    markAsDismissed: FunctionReference<
      "mutation",
      "public",
      {
        clerkId: string;
        reportId: Id<"reports">;
        resolution?: string;
        reviewedBy: string;
      },
      null
    >;
    markAsResolved: FunctionReference<
      "mutation",
      "public",
      {
        clerkId: string;
        reportId: Id<"reports">;
        resolution?: string;
        reviewedBy: string;
      },
      null
    >;
    markAsReviewed: FunctionReference<
      "mutation",
      "public",
      { clerkId: string; reportId: Id<"reports">; reviewedBy: string },
      null
    >;
  };
  resendDomainSync: {
    syncDomainsFromResend: FunctionReference<
      "action",
      "public",
      {},
      { added: number; synced: number; updated: number }
    >;
    verifyDomainInResend: FunctionReference<
      "action",
      "public",
      { domainId: Id<"emailDomains"> },
      { records: any; verified: boolean }
    >;
  };
  samplePacks: {
    addSamplesToPack: FunctionReference<
      "mutation",
      "public",
      { packId: Id<"samplePacks">; sampleIds: Array<Id<"audioSamples">> },
      { success: boolean; totalSamples: number }
    >;
    checkPackOwnership: FunctionReference<
      "query",
      "public",
      { packId: Id<"samplePacks"> },
      boolean
    >;
    createSamplePack: FunctionReference<
      "mutation",
      "public",
      {
        categories: Array<string>;
        coverImageStorageId?: Id<"_storage">;
        coverImageUrl?: string;
        creditPrice: number;
        description: string;
        genres: Array<string>;
        name: string;
        storeId: string;
        tags: Array<string>;
      },
      Id<"samplePacks">
    >;
    deleteSamplePack: FunctionReference<
      "mutation",
      "public",
      { packId: Id<"samplePacks"> },
      { success: boolean }
    >;
    getAllPublishedSamplePacks: FunctionReference<
      "query",
      "public",
      {},
      Array<{
        _creationTime: number;
        _id: Id<"samplePacks">;
        coverImage?: string;
        creatorAvatar?: string;
        creatorName?: string;
        description: string;
        downloadCount: number;
        genres: Array<string>;
        imageUrl?: string;
        price: number;
        published: boolean;
        sampleCount: number;
        storeId: string;
        title: string;
      }>
    >;
    getPacksByStore: FunctionReference<
      "query",
      "public",
      { storeId: string },
      Array<any>
    >;
    getPackWithSamples: FunctionReference<
      "query",
      "public",
      { packId: Id<"samplePacks"> },
      { pack: any; samples: Array<any> } | null
    >;
    purchaseDigitalPack: FunctionReference<
      "mutation",
      "public",
      { packId: Id<"digitalProducts"> },
      {
        alreadyOwned?: boolean;
        downloadUrl?: string;
        message: string;
        success: boolean;
      }
    >;
    purchasePack: FunctionReference<
      "mutation",
      "public",
      { packId: Id<"samplePacks"> },
      { downloadUrl?: string; message: string; success: boolean }
    >;
    removeSampleFromPack: FunctionReference<
      "mutation",
      "public",
      { packId: Id<"samplePacks">; sampleId: Id<"audioSamples"> },
      { success: boolean }
    >;
    togglePackPublish: FunctionReference<
      "mutation",
      "public",
      { packId: Id<"samplePacks"> },
      { isPublished: boolean; success: boolean }
    >;
    updateSamplePack: FunctionReference<
      "mutation",
      "public",
      {
        categories?: Array<string>;
        coverImageUrl?: string;
        creditPrice?: number;
        description?: string;
        genres?: Array<string>;
        name?: string;
        packId: Id<"samplePacks">;
        tags?: Array<string>;
      },
      { success: boolean }
    >;
  };
  samples: {
    addSamplesToPack: FunctionReference<
      "mutation",
      "public",
      { packId: Id<"digitalProducts">; sampleIds: Array<Id<"audioSamples">> },
      any
    >;
    addSampleToPack: FunctionReference<
      "mutation",
      "public",
      { packId: Id<"digitalProducts">; sampleId: Id<"audioSamples"> },
      any
    >;
    checkFullSampleOwnership: FunctionReference<
      "query",
      "public",
      { sampleId: Id<"audioSamples">; userId: string },
      any
    >;
    checkSampleOwnership: FunctionReference<
      "query",
      "public",
      { sampleId: Id<"audioSamples"> },
      any
    >;
    createSample: FunctionReference<
      "mutation",
      "public",
      {
        bpm?: number;
        category:
          | "drums"
          | "bass"
          | "synth"
          | "vocals"
          | "fx"
          | "melody"
          | "loops"
          | "one-shots";
        creditPrice: number;
        description?: string;
        duration: number;
        fileName: string;
        fileSize: number;
        fileUrl: string;
        format: string;
        genre: string;
        key?: string;
        licenseTerms?: string;
        licenseType: "royalty-free" | "exclusive" | "commercial";
        storageId: Id<"_storage">;
        storeId: string;
        subGenre?: string;
        tags: Array<string>;
        title: string;
        waveformData?: Array<number>;
      },
      any
    >;
    deleteSample: FunctionReference<
      "mutation",
      "public",
      { sampleId: Id<"audioSamples"> },
      any
    >;
    getCreatorSamplesForPacks: FunctionReference<
      "query",
      "public",
      { storeId: string },
      any
    >;
    getFavoriteSamples: FunctionReference<"query", "public", {}, any>;
    getPublishedSamples: FunctionReference<
      "query",
      "public",
      {
        category?: string;
        genre?: string;
        limit?: number;
        offset?: number;
        searchQuery?: string;
      },
      any
    >;
    getPublishedSamplesWithPackInfo: FunctionReference<
      "query",
      "public",
      { category?: string; genre?: string; limit?: number },
      any
    >;
    getSample: FunctionReference<
      "query",
      "public",
      { sampleId: Id<"audioSamples"> },
      any
    >;
    getSamplesByPackId: FunctionReference<
      "query",
      "public",
      { packId: Id<"digitalProducts"> },
      any
    >;
    getSampleStats: FunctionReference<"query", "public", {}, any>;
    getStoreSamples: FunctionReference<
      "query",
      "public",
      { storeId: string },
      Array<any>
    >;
    getUserLibrary: FunctionReference<"query", "public", {}, any>;
    incrementPlayCount: FunctionReference<
      "mutation",
      "public",
      { sampleId: Id<"audioSamples"> },
      any
    >;
    purchaseSample: FunctionReference<
      "mutation",
      "public",
      { sampleId: Id<"audioSamples"> },
      any
    >;
    removeSampleFromPack: FunctionReference<
      "mutation",
      "public",
      { packId: Id<"digitalProducts">; sampleId: Id<"audioSamples"> },
      any
    >;
    toggleFavorite: FunctionReference<
      "mutation",
      "public",
      { sampleId: Id<"audioSamples"> },
      any
    >;
    toggleSamplePublish: FunctionReference<
      "mutation",
      "public",
      { sampleId: Id<"audioSamples"> },
      any
    >;
    updateSample: FunctionReference<
      "mutation",
      "public",
      {
        bpm?: number;
        category?:
          | "drums"
          | "bass"
          | "synth"
          | "vocals"
          | "fx"
          | "melody"
          | "loops"
          | "one-shots";
        creditPrice?: number;
        description?: string;
        genre?: string;
        key?: string;
        licenseTerms?: string;
        licenseType?: "royalty-free" | "exclusive" | "commercial";
        sampleId: Id<"audioSamples">;
        subGenre?: string;
        tags?: Array<string>;
        title?: string;
      },
      any
    >;
  };
  scriptCalendar: {
    bulkScheduleScripts: FunctionReference<
      "mutation",
      "public",
      {
        accountProfileId: Id<"socialAccountProfiles">;
        customDays?: Array<number>;
        pattern: "daily" | "weekdays" | "custom";
        scriptIds: Array<Id<"generatedScripts">>;
        startDate: number;
        storeId: string;
        timezone: string;
        userId: string;
      },
      any
    >;
    getAllCalendarEntries: FunctionReference<
      "query",
      "public",
      { endDate: number; startDate: number; storeId: string },
      any
    >;
    getCalendarEntriesForAccount: FunctionReference<
      "query",
      "public",
      {
        accountProfileId: Id<"socialAccountProfiles">;
        endDate: number;
        startDate: number;
      },
      any
    >;
    getCalendarEntriesForDay: FunctionReference<
      "query",
      "public",
      { accountProfileId: Id<"socialAccountProfiles">; date: number },
      any
    >;
    getCalendarEntriesForWeek: FunctionReference<
      "query",
      "public",
      { accountProfileId: Id<"socialAccountProfiles">; weekStartDate: number },
      any
    >;
    getCalendarEntryById: FunctionReference<
      "query",
      "public",
      { entryId: Id<"scriptCalendarEntries"> },
      any
    >;
    removeFromCalendar: FunctionReference<
      "mutation",
      "public",
      { entryId: Id<"scriptCalendarEntries"> },
      any
    >;
    reorderEntries: FunctionReference<
      "mutation",
      "public",
      {
        entries: Array<{
          entryId: Id<"scriptCalendarEntries">;
          newSequenceOrder: number;
        }>;
      },
      any
    >;
    rescheduleEntry: FunctionReference<
      "mutation",
      "public",
      {
        entryId: Id<"scriptCalendarEntries">;
        newDate: number;
        newTime?: number;
      },
      any
    >;
    scheduleScript: FunctionReference<
      "mutation",
      "public",
      {
        accountProfileId: Id<"socialAccountProfiles">;
        generatedScriptId: Id<"generatedScripts">;
        scheduledDate: number;
        scheduledTime?: number;
        storeId: string;
        timezone: string;
        userId: string;
        userNotes?: string;
      },
      any
    >;
    updateEntryNotes: FunctionReference<
      "mutation",
      "public",
      { entryId: Id<"scriptCalendarEntries">; userNotes: string },
      any
    >;
    updateEntryStatus: FunctionReference<
      "mutation",
      "public",
      {
        entryId: Id<"scriptCalendarEntries">;
        status: "planned" | "in_progress" | "ready" | "published" | "skipped";
      },
      any
    >;
  };
  scriptIllustrationQueries: {
    getIllustrationsByScript: FunctionReference<
      "query",
      "public",
      { scriptId: string },
      any
    >;
    getJobStatus: FunctionReference<
      "query",
      "public",
      { jobId: Id<"scriptIllustrationJobs"> },
      any
    >;
    getUserJobs: FunctionReference<
      "query",
      "public",
      { limit?: number; userId: string },
      any
    >;
  };
  scriptIllustrations: {
    generateScriptIllustrations: FunctionReference<
      "action",
      "public",
      {
        generateEmbeddings?: boolean;
        imageModel?: string;
        scriptText: string;
        scriptTitle?: string;
        skipEmptySentences?: boolean;
        sourceId?: string;
        sourceType: "course" | "lesson" | "script" | "custom";
        storeId?: string;
        userId: string;
      },
      {
        error?: string;
        jobId?: Id<"scriptIllustrationJobs">;
        message?: string;
        success: boolean;
        totalSentences: number;
      }
    >;
  };
  scriptIllustrationSearch: {
    findSimilarIllustrations: FunctionReference<
      "action",
      "public",
      {
        illustrationId: Id<"scriptIllustrations">;
        limit?: number;
        minSimilarity?: number;
      },
      {
        error?: string;
        results: Array<{
          illustrationId: string;
          imageUrl: string;
          sentence: string;
          similarity: number;
        }>;
        success: boolean;
      }
    >;
    getRecommendedIllustrations: FunctionReference<
      "action",
      "public",
      { excludeScriptId?: string; limit?: number; scriptText: string },
      {
        error?: string;
        results: Array<{
          illustrationId: string;
          imageUrl: string;
          matchedConcepts: Array<string>;
          relevanceScore: number;
          sentence: string;
        }>;
        success: boolean;
      }
    >;
    searchIllustrations: FunctionReference<
      "action",
      "public",
      {
        limit?: number;
        minSimilarity?: number;
        query: string;
        scriptId?: string;
        sourceType?: "course" | "lesson" | "script" | "custom";
        userId?: string;
      },
      {
        error?: string;
        results: Array<{
          illustrationId: string;
          illustrationPrompt: string;
          imageUrl: string;
          sentence: string;
          sentenceIndex: number;
          similarity: number;
          sourceType: string;
        }>;
        success: boolean;
      }
    >;
  };
  seedCreditPackages: {
    seedDefaultPackages: FunctionReference<"mutation", "public", {}, any>;
  };
  sendTimeOptimization: {
    getOptimalCampaignSendTime: FunctionReference<
      "query",
      "public",
      { recipientUserIds: Array<string> },
      {
        confidence: number;
        recommendedTime: { day: number; hour: number; timezone: string };
        totalUsers: number;
        usersWithData: number;
      }
    >;
    getOptimalSendTime: FunctionReference<
      "query",
      "public",
      { userId: string },
      {
        day: number;
        hasEnoughData: boolean;
        hour: number;
        score: number;
        timezone?: string;
      }
    >;
    getUserEngagementPattern: FunctionReference<
      "query",
      "public",
      { userId: string },
      any | null
    >;
    scheduleWithOptimalTime: FunctionReference<
      "mutation",
      "public",
      { campaignId: Id<"resendCampaigns">; recipientUserIds?: Array<string> },
      {
        confidence: number;
        scheduledFor: number;
        success: boolean;
        timezone: string;
      }
    >;
    trackEngagement: FunctionReference<
      "mutation",
      "public",
      {
        engagementType: "open" | "click";
        timestamp?: number;
        timezone?: string;
        userId: string;
      },
      { success: boolean; updatedPattern: any }
    >;
  };
  serviceOrders: {
    approveDelivery: FunctionReference<
      "mutation",
      "public",
      { orderId: Id<"serviceOrders"> },
      any
    >;
    createServiceOrder: FunctionReference<
      "mutation",
      "public",
      {
        basePrice: number;
        creatorId: string;
        customerId: string;
        customerNotes?: string;
        isRush?: boolean;
        productId: Id<"digitalProducts">;
        rushFee?: number;
        selectedTier: {
          id: string;
          name: string;
          price: number;
          revisions: number;
          stemCount: string;
          turnaroundDays: number;
        };
        serviceType: "mixing" | "mastering" | "mix-and-master" | "stem-mixing";
        storeId: string;
        totalPrice: number;
        transactionId?: string;
      },
      any
    >;
    deliverFiles: FunctionReference<
      "mutation",
      "public",
      {
        files: Array<{
          id: string;
          name: string;
          size: number;
          storageId: string;
          type: string;
        }>;
        notes?: string;
        orderId: Id<"serviceOrders">;
      },
      any
    >;
    getCreatorOrders: FunctionReference<
      "query",
      "public",
      {
        status?:
          | "pending_payment"
          | "pending_upload"
          | "files_received"
          | "in_progress"
          | "pending_review"
          | "revision_requested"
          | "completed"
          | "cancelled"
          | "refunded";
        userId: string;
      },
      any
    >;
    getCustomerOrders: FunctionReference<
      "query",
      "public",
      {
        status?:
          | "pending_payment"
          | "pending_upload"
          | "files_received"
          | "in_progress"
          | "pending_review"
          | "revision_requested"
          | "completed"
          | "cancelled"
          | "refunded";
        userId: string;
      },
      any
    >;
    getOrderById: FunctionReference<
      "query",
      "public",
      { orderId: Id<"serviceOrders"> },
      any
    >;
    getOrderMessages: FunctionReference<
      "query",
      "public",
      { limit?: number; orderId: Id<"serviceOrders"> },
      any
    >;
    getOrderStats: FunctionReference<
      "query",
      "public",
      { role: "customer" | "creator"; userId: string },
      any
    >;
    markMessagesRead: FunctionReference<
      "mutation",
      "public",
      {
        orderId: Id<"serviceOrders">;
        userId: string;
        userType: "customer" | "creator";
      },
      any
    >;
    requestRevision: FunctionReference<
      "mutation",
      "public",
      { feedback: string; orderId: Id<"serviceOrders"> },
      any
    >;
    sendMessage: FunctionReference<
      "mutation",
      "public",
      {
        attachments?: Array<{
          id: string;
          name: string;
          size: number;
          storageId: string;
          type: string;
        }>;
        content: string;
        orderId: Id<"serviceOrders">;
        senderId: string;
        senderType: "customer" | "creator";
      },
      any
    >;
    updateOrderStatus: FunctionReference<
      "mutation",
      "public",
      {
        notes?: string;
        orderId: Id<"serviceOrders">;
        status:
          | "pending_payment"
          | "pending_upload"
          | "files_received"
          | "in_progress"
          | "pending_review"
          | "revision_requested"
          | "completed"
          | "cancelled"
          | "refunded";
      },
      any
    >;
    uploadCustomerFiles: FunctionReference<
      "mutation",
      "public",
      {
        files: Array<{
          id: string;
          name: string;
          size: number;
          storageId: string;
          type: string;
        }>;
        notes?: string;
        orderId: Id<"serviceOrders">;
        referenceTrackUrl?: string;
      },
      any
    >;
  };
  socialAccountProfiles: {
    createAccountProfile: FunctionReference<
      "mutation",
      "public",
      {
        description: string;
        name: string;
        platform:
          | "instagram"
          | "twitter"
          | "facebook"
          | "tiktok"
          | "youtube"
          | "linkedin";
        postsPerWeek?: number;
        preferredPostDays?: Array<number>;
        socialAccountId?: Id<"socialAccounts">;
        storeId: string;
        targetAudience?: string;
        topics: Array<string>;
        userId: string;
      },
      any
    >;
    deleteAccountProfile: FunctionReference<
      "mutation",
      "public",
      { profileId: Id<"socialAccountProfiles"> },
      any
    >;
    getAccountProfileById: FunctionReference<
      "query",
      "public",
      { profileId: Id<"socialAccountProfiles"> },
      any
    >;
    getAccountProfiles: FunctionReference<
      "query",
      "public",
      { storeId: string },
      any
    >;
    getAccountProfilesByPlatform: FunctionReference<
      "query",
      "public",
      {
        platform:
          | "instagram"
          | "twitter"
          | "facebook"
          | "tiktok"
          | "youtube"
          | "linkedin";
        storeId: string;
      },
      any
    >;
    getAccountProfilesByUserId: FunctionReference<
      "query",
      "public",
      { userId: string },
      any
    >;
    getAccountProfilesWithAccounts: FunctionReference<
      "query",
      "public",
      { storeId: string },
      any
    >;
    linkSocialAccount: FunctionReference<
      "mutation",
      "public",
      {
        profileId: Id<"socialAccountProfiles">;
        socialAccountId: Id<"socialAccounts">;
      },
      any
    >;
    unlinkSocialAccount: FunctionReference<
      "mutation",
      "public",
      { profileId: Id<"socialAccountProfiles"> },
      any
    >;
    updateAccountProfile: FunctionReference<
      "mutation",
      "public",
      {
        description?: string;
        name?: string;
        platform?:
          | "instagram"
          | "twitter"
          | "facebook"
          | "tiktok"
          | "youtube"
          | "linkedin";
        postsPerWeek?: number;
        preferredPostDays?: Array<number>;
        profileId: Id<"socialAccountProfiles">;
        targetAudience?: string;
        topics?: Array<string>;
      },
      any
    >;
    updateProfileStats: FunctionReference<
      "mutation",
      "public",
      {
        incrementPublished?: number;
        incrementScheduled?: number;
        profileId: Id<"socialAccountProfiles">;
      },
      any
    >;
  };
  socialDM: {
    sendBatchDMs: FunctionReference<
      "action",
      "public",
      {
        accountId: Id<"socialAccounts">;
        delayMs?: number;
        recipients: Array<{ message: string; recipientId: string }>;
      },
      {
        results: Array<{
          error?: string;
          recipientId: string;
          success: boolean;
        }>;
        totalFailed: number;
        totalSent: number;
      }
    >;
    sendDirectMessage: FunctionReference<
      "action",
      "public",
      {
        accountId: Id<"socialAccounts">;
        message: string;
        recipientId: string;
        recipientUsername?: string;
      },
      { error?: string; messageId?: string; platform: string; success: boolean }
    >;
  };
  socialDMWebhooks: {
    getTwitterCRCResponse: FunctionReference<
      "action",
      "public",
      { crcToken: string },
      string
    >;
    processFacebookWebhook: FunctionReference<
      "action",
      "public",
      { payload: any },
      null
    >;
    processInstagramWebhook: FunctionReference<
      "action",
      "public",
      { payload: any },
      null
    >;
    processTwitterWebhook: FunctionReference<
      "action",
      "public",
      { payload: any },
      null
    >;
    verifyFacebookWebhook: FunctionReference<
      "action",
      "public",
      { challenge: string; mode: string; token: string },
      string | null
    >;
  };
  socialMedia: {
    connectSocialAccount: FunctionReference<
      "mutation",
      "public",
      {
        accessToken: string;
        grantedScopes: Array<string>;
        platform: "instagram" | "facebook" | "twitter" | "linkedin" | "tiktok";
        platformData?: any;
        platformDisplayName?: string;
        platformUserId: string;
        platformUsername?: string;
        profileImageUrl?: string;
        refreshToken?: string;
        storeId: string;
        tokenExpiresAt?: number;
        userId: string;
      },
      Id<"socialAccounts">
    >;
    createScheduledPost: FunctionReference<
      "mutation",
      "public",
      {
        content: string;
        hashtags?: Array<string>;
        location?: string;
        mediaStorageIds?: Array<Id<"_storage">>;
        postType?: "post" | "story" | "reel" | "tweet" | "thread";
        scheduledFor?: number;
        socialAccountId: Id<"socialAccounts">;
        storeId: string;
        timezone?: string;
        userId: string;
      },
      Id<"scheduledPosts">
    >;
    deleteScheduledPost: FunctionReference<
      "mutation",
      "public",
      { postId: string; userId: string },
      null
    >;
    deleteSocialAccount: FunctionReference<
      "mutation",
      "public",
      { accountId: Id<"socialAccounts">; userId: string },
      null
    >;
    disconnectSocialAccount: FunctionReference<
      "mutation",
      "public",
      { accountId: Id<"socialAccounts">; userId: string },
      null
    >;
    generateMediaUploadUrl: FunctionReference<"mutation", "public", {}, string>;
    getInstagramToken: FunctionReference<
      "query",
      "public",
      { accountId?: string; userId: Id<"users"> },
      { accessToken: string; instagramId: string; username: string } | null
    >;
    getInstagramTokenByBusinessId: FunctionReference<
      "query",
      "public",
      { instagramBusinessAccountId: string },
      {
        accessToken: string;
        facebookPageId?: string;
        instagramId: string;
        username: string;
      } | null
    >;
    getMediaUrls: FunctionReference<
      "query",
      "public",
      { storageIds: Array<Id<"_storage">> },
      Array<string | null>
    >;
    getScheduledPosts: FunctionReference<
      "query",
      "public",
      { limit: number; status: string; storeId: string },
      Array<any>
    >;
    getSocialAccounts: FunctionReference<
      "query",
      "public",
      { storeId: string },
      Array<any>
    >;
    refreshAccountToken: FunctionReference<
      "mutation",
      "public",
      { accountId: string },
      { message: string; success: boolean }
    >;
    removeDuplicateSocialAccounts: FunctionReference<
      "mutation",
      "public",
      {
        platform: "instagram" | "facebook" | "twitter" | "linkedin" | "tiktok";
        userId: string;
      },
      { kept?: string; removed: number }
    >;
    updateAccountLabel: FunctionReference<
      "mutation",
      "public",
      { accountId: Id<"socialAccounts">; label?: string; userId: string },
      null
    >;
    updateScheduledPost: FunctionReference<
      "mutation",
      "public",
      {
        content?: string;
        hashtags?: Array<string>;
        location?: string;
        mediaStorageIds?: Array<Id<"_storage">>;
        postId: Id<"scheduledPosts">;
        postType?: "post" | "story" | "reel" | "tweet" | "thread";
        scheduledFor?: number;
        status?: string;
        timezone?: string;
        userId: string;
      },
      null
    >;
  };
  socialMediaPosts: {
    addImageToSocialMediaPost: FunctionReference<
      "mutation",
      "public",
      {
        image: {
          aspectRatio: "16:9" | "9:16";
          embedding?: Array<number>;
          isPromptEdited?: boolean;
          originalPrompt?: string;
          prompt: string;
          sentence?: string;
          sourceImageUrl?: string;
          sourceStorageId?: Id<"_storage">;
          storageId: Id<"_storage">;
          url: string;
        };
        postId: Id<"socialMediaPosts">;
      },
      null
    >;
    completeSocialMediaPost: FunctionReference<
      "mutation",
      "public",
      { postId: Id<"socialMediaPosts"> },
      null
    >;
    createCTATemplate: FunctionReference<
      "mutation",
      "public",
      {
        courseId?: Id<"courses">;
        description?: string;
        keyword: string;
        name: string;
        productId?: Id<"digitalProducts">;
        productName?: string;
        storeId?: string;
        template: string;
        userId: string;
      },
      Id<"ctaTemplates">
    >;
    createSocialMediaPost: FunctionReference<
      "mutation",
      "public",
      {
        chapterId?: Id<"courseChapters">;
        courseId?: Id<"courses">;
        selectedHeadings?: Array<string>;
        sourceContent: string;
        sourceType: "chapter" | "section" | "custom";
        storeId?: string;
        title?: string;
        userId: string;
      },
      Id<"socialMediaPosts">
    >;
    deleteCTATemplate: FunctionReference<
      "mutation",
      "public",
      { templateId: Id<"ctaTemplates"> },
      null
    >;
    deleteSocialMediaPost: FunctionReference<
      "mutation",
      "public",
      { postId: Id<"socialMediaPosts"> },
      null
    >;
    generateUploadUrl: FunctionReference<"mutation", "public", {}, string>;
    getCTATemplateById: FunctionReference<
      "query",
      "public",
      { templateId: Id<"ctaTemplates"> },
      any | null
    >;
    getCTATemplatesByUser: FunctionReference<
      "query",
      "public",
      { userId: string },
      Array<any>
    >;
    getSocialMediaPostById: FunctionReference<
      "query",
      "public",
      { postId: Id<"socialMediaPosts"> },
      any | null
    >;
    getSocialMediaPostsByUser: FunctionReference<
      "query",
      "public",
      {
        limit?: number;
        status?:
          | "draft"
          | "scripts_generated"
          | "combined"
          | "images_generated"
          | "audio_generated"
          | "completed"
          | "published";
        userId: string;
      },
      Array<any>
    >;
    getSocialMediaPostWithDetails: FunctionReference<
      "query",
      "public",
      { postId: Id<"socialMediaPosts"> },
      any | null
    >;
    incrementCTATemplateUsage: FunctionReference<
      "mutation",
      "public",
      { templateId: Id<"ctaTemplates"> },
      null
    >;
    removeImageFromSocialMediaPost: FunctionReference<
      "mutation",
      "public",
      { imageIndex: number; postId: Id<"socialMediaPosts"> },
      null
    >;
    updateCTATemplate: FunctionReference<
      "mutation",
      "public",
      {
        courseId?: Id<"courses">;
        description?: string;
        keyword?: string;
        name?: string;
        productId?: Id<"digitalProducts">;
        productName?: string;
        template?: string;
        templateId: Id<"ctaTemplates">;
      },
      null
    >;
    updateSocialMediaPostAudio: FunctionReference<
      "mutation",
      "public",
      {
        audioDuration?: number;
        audioScript?: string;
        audioStorageId: Id<"_storage">;
        audioUrl: string;
        audioVoiceId?: string;
        postId: Id<"socialMediaPosts">;
      },
      null
    >;
    updateSocialMediaPostCaptions: FunctionReference<
      "mutation",
      "public",
      {
        instagramCaption?: string;
        postId: Id<"socialMediaPosts">;
        tiktokCaption?: string;
      },
      null
    >;
    updateSocialMediaPostCombined: FunctionReference<
      "mutation",
      "public",
      {
        combinedScript: string;
        ctaCourseId?: Id<"courses">;
        ctaKeyword?: string;
        ctaProductId?: Id<"digitalProducts">;
        ctaTemplateId?: Id<"ctaTemplates">;
        ctaText?: string;
        postId: Id<"socialMediaPosts">;
      },
      null
    >;
    updateSocialMediaPostImages: FunctionReference<
      "mutation",
      "public",
      {
        images: Array<{
          aspectRatio: "16:9" | "9:16";
          embedding?: Array<number>;
          isPromptEdited?: boolean;
          originalPrompt?: string;
          prompt: string;
          sentence?: string;
          sourceImageUrl?: string;
          sourceStorageId?: Id<"_storage">;
          storageId: Id<"_storage">;
          url: string;
        }>;
        postId: Id<"socialMediaPosts">;
      },
      null
    >;
    updateSocialMediaPostScripts: FunctionReference<
      "mutation",
      "public",
      {
        instagramScript?: string;
        postId: Id<"socialMediaPosts">;
        tiktokScript?: string;
        youtubeScript?: string;
      },
      null
    >;
    updateSocialMediaPostStatus: FunctionReference<
      "mutation",
      "public",
      {
        postId: Id<"socialMediaPosts">;
        status:
          | "draft"
          | "scripts_generated"
          | "combined"
          | "images_generated"
          | "audio_generated"
          | "completed"
          | "published";
      },
      null
    >;
    updateSocialMediaPostTitle: FunctionReference<
      "mutation",
      "public",
      { postId: Id<"socialMediaPosts">; title: string },
      null
    >;
  };
  stats: {
    getPlatformStats: FunctionReference<
      "query",
      "public",
      {},
      {
        totalCourses: number;
        totalCreators: number;
        totalProducts: number;
        totalUsers: number;
      }
    >;
  };
  stores: {
    createStore: FunctionReference<
      "mutation",
      "public",
      { name: string; slug?: string; userId: string },
      Id<"stores">
    >;
    createStoreFromProfile: FunctionReference<
      "mutation",
      "public",
      { name?: string; userId: string },
      { storeId: Id<"stores">; storeName: string; storeSlug: string }
    >;
    deleteStore: FunctionReference<
      "mutation",
      "public",
      { id: Id<"stores">; userId: string },
      null
    >;
    getAllStores: FunctionReference<
      "query",
      "public",
      {},
      Array<{
        _creationTime: number;
        _id: Id<"stores">;
        avatar?: string;
        bannerImage?: string;
        bio?: string;
        customDomain?: string;
        description?: string;
        domainStatus?: string;
        earlyAccessExpiresAt?: number;
        emailConfig?: {
          emailsSentThisMonth?: number;
          fromEmail: string;
          fromName?: string;
          isConfigured?: boolean;
          lastTestedAt?: number;
          replyToEmail?: string;
        };
        isPublic?: boolean;
        isPublishedProfile?: boolean;
        logoUrl?: string;
        name: string;
        notificationIntegrations?: {
          discordEnabled?: boolean;
          discordWebhookUrl?: string;
          slackEnabled?: boolean;
          slackWebhookUrl?: string;
        };
        plan?:
          | "free"
          | "starter"
          | "creator"
          | "creator_pro"
          | "business"
          | "early_access";
        planStartedAt?: number;
        slug: string;
        socialLinks?: {
          appleMusic?: string;
          bandcamp?: string;
          beatport?: string;
          discord?: string;
          instagram?: string;
          linkedin?: string;
          soundcloud?: string;
          spotify?: string;
          threads?: string;
          tiktok?: string;
          twitch?: string;
          twitter?: string;
          website?: string;
          youtube?: string;
        };
        socialLinksV2?: Array<{
          label?: string;
          platform: string;
          url: string;
        }>;
        stripeCustomerId?: string;
        stripeSubscriptionId?: string;
        subscriptionStatus?:
          | "active"
          | "trialing"
          | "past_due"
          | "canceled"
          | "incomplete";
        trialEndsAt?: number;
        userId: string;
      }>
    >;
    getEmailConfig: FunctionReference<
      "query",
      "public",
      { storeId: Id<"stores"> },
      null | {
        emailsSentThisMonth?: number;
        fromEmail: string;
        fromName?: string;
        isConfigured?: boolean;
        lastTestedAt?: number;
        replyToEmail?: string;
      }
    >;
    getStoreById: FunctionReference<
      "query",
      "public",
      { storeId: Id<"stores"> },
      {
        _creationTime: number;
        _id: Id<"stores">;
        avatar?: string;
        bannerImage?: string;
        bio?: string;
        customDomain?: string;
        description?: string;
        domainStatus?: string;
        earlyAccessExpiresAt?: number;
        emailConfig?: {
          emailsSentThisMonth?: number;
          fromEmail: string;
          fromName?: string;
          isConfigured?: boolean;
          lastTestedAt?: number;
          replyToEmail?: string;
        };
        isPublic?: boolean;
        isPublishedProfile?: boolean;
        logoUrl?: string;
        name: string;
        notificationIntegrations?: {
          discordEnabled?: boolean;
          discordWebhookUrl?: string;
          slackEnabled?: boolean;
          slackWebhookUrl?: string;
        };
        plan?:
          | "free"
          | "starter"
          | "creator"
          | "creator_pro"
          | "business"
          | "early_access";
        planStartedAt?: number;
        slug: string;
        socialLinks?: {
          appleMusic?: string;
          bandcamp?: string;
          beatport?: string;
          discord?: string;
          instagram?: string;
          linkedin?: string;
          soundcloud?: string;
          spotify?: string;
          threads?: string;
          tiktok?: string;
          twitch?: string;
          twitter?: string;
          website?: string;
          youtube?: string;
        };
        socialLinksV2?: Array<{
          label?: string;
          platform: string;
          url: string;
        }>;
        stripeCustomerId?: string;
        stripeSubscriptionId?: string;
        subscriptionStatus?:
          | "active"
          | "trialing"
          | "past_due"
          | "canceled"
          | "incomplete";
        trialEndsAt?: number;
        userId: string;
      } | null
    >;
    getStoreBySlug: FunctionReference<
      "query",
      "public",
      { slug: string },
      {
        _creationTime: number;
        _id: Id<"stores">;
        avatar?: string;
        bannerImage?: string;
        bio?: string;
        customDomain?: string;
        description?: string;
        domainStatus?: string;
        earlyAccessExpiresAt?: number;
        emailConfig?: {
          emailsSentThisMonth?: number;
          fromEmail: string;
          fromName?: string;
          isConfigured?: boolean;
          lastTestedAt?: number;
          replyToEmail?: string;
        };
        isPublic?: boolean;
        isPublishedProfile?: boolean;
        logoUrl?: string;
        name: string;
        notificationIntegrations?: {
          discordEnabled?: boolean;
          discordWebhookUrl?: string;
          slackEnabled?: boolean;
          slackWebhookUrl?: string;
        };
        plan?:
          | "free"
          | "starter"
          | "creator"
          | "creator_pro"
          | "business"
          | "early_access";
        planStartedAt?: number;
        slug: string;
        socialLinks?: {
          appleMusic?: string;
          bandcamp?: string;
          beatport?: string;
          discord?: string;
          instagram?: string;
          linkedin?: string;
          soundcloud?: string;
          spotify?: string;
          threads?: string;
          tiktok?: string;
          twitch?: string;
          twitter?: string;
          website?: string;
          youtube?: string;
        };
        socialLinksV2?: Array<{
          label?: string;
          platform: string;
          url: string;
        }>;
        stripeCustomerId?: string;
        stripeSubscriptionId?: string;
        subscriptionStatus?:
          | "active"
          | "trialing"
          | "past_due"
          | "canceled"
          | "incomplete";
        trialEndsAt?: number;
        userId: string;
      } | null
    >;
    getStoreEmailConfigInternal: FunctionReference<
      "query",
      "public",
      { storeId: Id<"stores"> },
      null | {
        emailsSentThisMonth?: number;
        fromEmail: string;
        fromName?: string;
        isConfigured?: boolean;
        lastTestedAt?: number;
        replyToEmail?: string;
      }
    >;
    getStoresByUser: FunctionReference<
      "query",
      "public",
      { userId: string },
      Array<{
        _creationTime: number;
        _id: Id<"stores">;
        avatar?: string;
        bannerImage?: string;
        bio?: string;
        customDomain?: string;
        description?: string;
        domainStatus?: string;
        earlyAccessExpiresAt?: number;
        emailConfig?: {
          emailsSentThisMonth?: number;
          fromEmail: string;
          fromName?: string;
          isConfigured?: boolean;
          lastTestedAt?: number;
          replyToEmail?: string;
        };
        isPublic?: boolean;
        isPublishedProfile?: boolean;
        logoUrl?: string;
        name: string;
        notificationIntegrations?: {
          discordEnabled?: boolean;
          discordWebhookUrl?: string;
          slackEnabled?: boolean;
          slackWebhookUrl?: string;
        };
        plan?:
          | "free"
          | "starter"
          | "creator"
          | "creator_pro"
          | "business"
          | "early_access";
        planStartedAt?: number;
        slug: string;
        socialLinks?: {
          appleMusic?: string;
          bandcamp?: string;
          beatport?: string;
          discord?: string;
          instagram?: string;
          linkedin?: string;
          soundcloud?: string;
          spotify?: string;
          threads?: string;
          tiktok?: string;
          twitch?: string;
          twitter?: string;
          website?: string;
          youtube?: string;
        };
        socialLinksV2?: Array<{
          label?: string;
          platform: string;
          url: string;
        }>;
        stripeCustomerId?: string;
        stripeSubscriptionId?: string;
        subscriptionStatus?:
          | "active"
          | "trialing"
          | "past_due"
          | "canceled"
          | "incomplete";
        trialEndsAt?: number;
        userId: string;
      }>
    >;
    getUserStore: FunctionReference<
      "query",
      "public",
      { userId: string },
      {
        _creationTime: number;
        _id: Id<"stores">;
        avatar?: string;
        bannerImage?: string;
        bio?: string;
        customDomain?: string;
        description?: string;
        domainStatus?: string;
        earlyAccessExpiresAt?: number;
        emailConfig?: {
          emailsSentThisMonth?: number;
          fromEmail: string;
          fromName?: string;
          isConfigured?: boolean;
          lastTestedAt?: number;
          replyToEmail?: string;
        };
        isPublic?: boolean;
        isPublishedProfile?: boolean;
        logoUrl?: string;
        name: string;
        notificationIntegrations?: {
          discordEnabled?: boolean;
          discordWebhookUrl?: string;
          slackEnabled?: boolean;
          slackWebhookUrl?: string;
        };
        plan?:
          | "free"
          | "starter"
          | "creator"
          | "creator_pro"
          | "business"
          | "early_access";
        planStartedAt?: number;
        slug: string;
        socialLinks?: {
          appleMusic?: string;
          bandcamp?: string;
          beatport?: string;
          discord?: string;
          instagram?: string;
          linkedin?: string;
          soundcloud?: string;
          spotify?: string;
          threads?: string;
          tiktok?: string;
          twitch?: string;
          twitter?: string;
          website?: string;
          youtube?: string;
        };
        socialLinksV2?: Array<{
          label?: string;
          platform: string;
          url: string;
        }>;
        stripeCustomerId?: string;
        stripeSubscriptionId?: string;
        subscriptionStatus?:
          | "active"
          | "trialing"
          | "past_due"
          | "canceled"
          | "incomplete";
        trialEndsAt?: number;
        userId: string;
      } | null
    >;
    getUserStores: FunctionReference<
      "query",
      "public",
      { userId: string },
      Array<{
        _creationTime: number;
        _id: Id<"stores">;
        avatar?: string;
        bannerImage?: string;
        bio?: string;
        customDomain?: string;
        description?: string;
        domainStatus?: string;
        earlyAccessExpiresAt?: number;
        emailConfig?: {
          emailsSentThisMonth?: number;
          fromEmail: string;
          fromName?: string;
          isConfigured?: boolean;
          lastTestedAt?: number;
          replyToEmail?: string;
        };
        isPublic?: boolean;
        isPublishedProfile?: boolean;
        logoUrl?: string;
        name: string;
        notificationIntegrations?: {
          discordEnabled?: boolean;
          discordWebhookUrl?: string;
          slackEnabled?: boolean;
          slackWebhookUrl?: string;
        };
        plan?:
          | "free"
          | "starter"
          | "creator"
          | "creator_pro"
          | "business"
          | "early_access";
        planStartedAt?: number;
        slug: string;
        socialLinks?: {
          appleMusic?: string;
          bandcamp?: string;
          beatport?: string;
          discord?: string;
          instagram?: string;
          linkedin?: string;
          soundcloud?: string;
          spotify?: string;
          threads?: string;
          tiktok?: string;
          twitch?: string;
          twitter?: string;
          website?: string;
          youtube?: string;
        };
        socialLinksV2?: Array<{
          label?: string;
          platform: string;
          url: string;
        }>;
        stripeCustomerId?: string;
        stripeSubscriptionId?: string;
        subscriptionStatus?:
          | "active"
          | "trialing"
          | "past_due"
          | "canceled"
          | "incomplete";
        trialEndsAt?: number;
        userId: string;
      }>
    >;
    markEmailConfigVerified: FunctionReference<
      "mutation",
      "public",
      { isConfigured: boolean; storeId: Id<"stores"> },
      null
    >;
    migrateStoresToPublic: FunctionReference<
      "mutation",
      "public",
      {},
      { message: string; updated: number }
    >;
    updateAdminNotificationSettings: FunctionReference<
      "mutation",
      "public",
      {
        customSubjectPrefix?: string;
        digestFrequency?: "hourly" | "daily" | "weekly";
        emailOnNewLead?: boolean;
        emailOnReturningUser?: boolean;
        enabled?: boolean;
        includeLeadDetails?: boolean;
        notificationEmail?: string;
        sendDigestInsteadOfInstant?: boolean;
        storeId: Id<"stores">;
        userId: string;
      },
      { message: string; success: boolean }
    >;
    updateEmailConfig: FunctionReference<
      "mutation",
      "public",
      {
        fromEmail: string;
        fromName?: string;
        replyToEmail?: string;
        storeId: Id<"stores">;
        userId: string;
      },
      { message: string; success: boolean }
    >;
    updateEmailUsage: FunctionReference<
      "mutation",
      "public",
      { emailsSent: number; storeId: Id<"stores"> },
      null
    >;
    updateNotificationIntegrations: FunctionReference<
      "mutation",
      "public",
      {
        notificationIntegrations: {
          discordEnabled?: boolean;
          discordWebhookUrl?: string;
          slackEnabled?: boolean;
          slackWebhookUrl?: string;
        };
        storeId: Id<"stores">;
        userId: string;
      },
      { message: string; success: boolean }
    >;
    updateStore: FunctionReference<
      "mutation",
      "public",
      { id: Id<"stores">; name?: string; slug?: string; userId: string },
      {
        _creationTime: number;
        _id: Id<"stores">;
        avatar?: string;
        bannerImage?: string;
        bio?: string;
        customDomain?: string;
        description?: string;
        domainStatus?: string;
        earlyAccessExpiresAt?: number;
        emailConfig?: {
          emailsSentThisMonth?: number;
          fromEmail: string;
          fromName?: string;
          isConfigured?: boolean;
          lastTestedAt?: number;
          replyToEmail?: string;
        };
        isPublic?: boolean;
        isPublishedProfile?: boolean;
        logoUrl?: string;
        name: string;
        notificationIntegrations?: {
          discordEnabled?: boolean;
          discordWebhookUrl?: string;
          slackEnabled?: boolean;
          slackWebhookUrl?: string;
        };
        plan?:
          | "free"
          | "starter"
          | "creator"
          | "creator_pro"
          | "business"
          | "early_access";
        planStartedAt?: number;
        slug: string;
        socialLinks?: {
          appleMusic?: string;
          bandcamp?: string;
          beatport?: string;
          discord?: string;
          instagram?: string;
          linkedin?: string;
          soundcloud?: string;
          spotify?: string;
          threads?: string;
          tiktok?: string;
          twitch?: string;
          twitter?: string;
          website?: string;
          youtube?: string;
        };
        socialLinksV2?: Array<{
          label?: string;
          platform: string;
          url: string;
        }>;
        stripeCustomerId?: string;
        stripeSubscriptionId?: string;
        subscriptionStatus?:
          | "active"
          | "trialing"
          | "past_due"
          | "canceled"
          | "incomplete";
        trialEndsAt?: number;
        userId: string;
      } | null
    >;
    updateStoreProfile: FunctionReference<
      "mutation",
      "public",
      {
        avatar?: string;
        bannerImage?: string;
        bio?: string;
        description?: string;
        isPublic?: boolean;
        isPublishedProfile?: boolean;
        logoUrl?: string;
        name?: string;
        socialLinks?: {
          appleMusic?: string;
          bandcamp?: string;
          beatport?: string;
          discord?: string;
          instagram?: string;
          linkedin?: string;
          soundcloud?: string;
          spotify?: string;
          threads?: string;
          tiktok?: string;
          twitch?: string;
          twitter?: string;
          website?: string;
          youtube?: string;
        };
        socialLinksV2?: Array<{
          label?: string;
          platform: string;
          url: string;
        }>;
        storeId: Id<"stores">;
        userId: string;
      },
      {
        _creationTime: number;
        _id: Id<"stores">;
        avatar?: string;
        bannerImage?: string;
        bio?: string;
        customDomain?: string;
        description?: string;
        domainStatus?: string;
        earlyAccessExpiresAt?: number;
        emailConfig?: {
          emailsSentThisMonth?: number;
          fromEmail: string;
          fromName?: string;
          isConfigured?: boolean;
          lastTestedAt?: number;
          replyToEmail?: string;
        };
        isPublic?: boolean;
        isPublishedProfile?: boolean;
        logoUrl?: string;
        name: string;
        notificationIntegrations?: {
          discordEnabled?: boolean;
          discordWebhookUrl?: string;
          slackEnabled?: boolean;
          slackWebhookUrl?: string;
        };
        plan?:
          | "free"
          | "starter"
          | "creator"
          | "creator_pro"
          | "business"
          | "early_access";
        planStartedAt?: number;
        slug: string;
        socialLinks?: {
          appleMusic?: string;
          bandcamp?: string;
          beatport?: string;
          discord?: string;
          instagram?: string;
          linkedin?: string;
          soundcloud?: string;
          spotify?: string;
          threads?: string;
          tiktok?: string;
          twitch?: string;
          twitter?: string;
          website?: string;
          youtube?: string;
        };
        socialLinksV2?: Array<{
          label?: string;
          platform: string;
          url: string;
        }>;
        stripeCustomerId?: string;
        stripeSubscriptionId?: string;
        subscriptionStatus?:
          | "active"
          | "trialing"
          | "past_due"
          | "canceled"
          | "incomplete";
        trialEndsAt?: number;
        userId: string;
      } | null
    >;
  };
  storeStats: {
    getCourseSocialProof: FunctionReference<
      "query",
      "public",
      { courseId: Id<"courses"> },
      {
        averageRating: number;
        enrollmentsThisMonth: number;
        enrollmentsThisWeek: number;
        recentEnrollments: Array<{ enrolledAt: number; firstName?: string }>;
        totalEnrollments: number;
        totalReviews: number;
      }
    >;
    getProductSocialProof: FunctionReference<
      "query",
      "public",
      { productId: Id<"digitalProducts"> },
      {
        averageRating: number;
        purchasesThisMonth: number;
        purchasesThisWeek: number;
        recentPurchases: Array<{ firstName?: string; purchasedAt: number }>;
        totalPurchases: number;
        totalReviews: number;
      }
    >;
    getQuickStoreStats: FunctionReference<
      "query",
      "public",
      { storeId: string },
      { totalItems: number; totalSales: number; totalStudents: number }
    >;
    getStoreStats: FunctionReference<
      "query",
      "public",
      { storeId: string },
      {
        averageRating: number;
        followerCount: number;
        freeProducts: number;
        paidProducts: number;
        totalCourses: number;
        totalDownloads: number;
        totalEnrollments: number;
        totalProducts: number;
        totalRevenue: number;
      }
    >;
    getStoreStudents: FunctionReference<
      "query",
      "public",
      { limit?: number; storeId: string },
      Array<{
        clerkId: string;
        coursesEnrolled: number;
        email?: string;
        firstPurchaseDate: number;
        imageUrl?: string;
        lastPurchaseDate: number;
        name?: string;
        productsOwned: number;
        totalPurchases: number;
        totalSpent: number;
      }>
    >;
    getStudentDetailedProgress: FunctionReference<
      "query",
      "public",
      { storeId: string; studentId: string },
      any
    >;
    getStudentsWithProgress: FunctionReference<
      "query",
      "public",
      { limit?: number; storeId: string },
      any
    >;
  };
  submissions: {
    acceptSubmission: FunctionReference<
      "mutation",
      "public",
      {
        feedback?: string;
        playlistId: Id<"curatorPlaylists">;
        submissionId: Id<"trackSubmissions">;
      },
      null
    >;
    declineSubmission: FunctionReference<
      "mutation",
      "public",
      {
        decisionNotes?: string;
        feedback?: string;
        submissionId: Id<"trackSubmissions">;
      },
      null
    >;
    getCreatorSubmissions: FunctionReference<
      "query",
      "public",
      {
        creatorId: string;
        status?: "inbox" | "reviewed" | "accepted" | "declined";
      },
      Array<any>
    >;
    getSubmissionStats: FunctionReference<
      "query",
      "public",
      { creatorId: string },
      {
        accepted: number;
        declined: number;
        inbox: number;
        reviewed: number;
        total: number;
      }
    >;
    getUserSubmissions: FunctionReference<
      "query",
      "public",
      { userId: string },
      Array<any>
    >;
    submitTrack: FunctionReference<
      "mutation",
      "public",
      {
        creatorId: string;
        message?: string;
        paymentId?: string;
        playlistId?: Id<"curatorPlaylists">;
        submissionFee: number;
        submitterId: string;
        trackId: Id<"userTracks">;
      },
      Id<"trackSubmissions">
    >;
    updatePaymentStatus: FunctionReference<
      "mutation",
      "public",
      {
        paymentId?: string;
        paymentStatus: "pending" | "paid" | "refunded";
        submissionId: Id<"trackSubmissions">;
      },
      null
    >;
  };
  subscriptions: {
    cancelSubscription: FunctionReference<
      "mutation",
      "public",
      {
        cancelImmediately?: boolean;
        subscriptionId: Id<"membershipSubscriptions">;
      },
      any
    >;
    checkSubscriptionAccess: FunctionReference<
      "query",
      "public",
      {
        courseId?: Id<"courses">;
        productId?: Id<"digitalProducts">;
        storeId: Id<"stores">;
        userId: string;
      },
      any
    >;
    createSubscription: FunctionReference<
      "mutation",
      "public",
      {
        billingCycle: "monthly" | "yearly" | "lifetime";
        planId: Id<"subscriptionPlans">;
        startTrial?: boolean;
        stripeSubscriptionId?: string;
        userId: string;
      },
      any
    >;
    createSubscriptionPlan: FunctionReference<
      "mutation",
      "public",
      {
        courseAccess?: Array<Id<"courses">>;
        creatorId: string;
        currency: string;
        description: string;
        digitalProductAccess?: Array<Id<"digitalProducts">>;
        discountPercentage?: number;
        features: Array<string>;
        hasAllCourses?: boolean;
        hasAllProducts?: boolean;
        monthlyPrice: number;
        name: string;
        storeId: Id<"stores">;
        tier: number;
        trialDays?: number;
        yearlyPrice: number;
      },
      any
    >;
    deleteSubscriptionPlan: FunctionReference<
      "mutation",
      "public",
      { planId: Id<"subscriptionPlans"> },
      any
    >;
    downgradeSubscription: FunctionReference<
      "mutation",
      "public",
      {
        newPlanId: Id<"subscriptionPlans">;
        subscriptionId: Id<"membershipSubscriptions">;
      },
      any
    >;
    getActiveSubscription: FunctionReference<
      "query",
      "public",
      { storeId: Id<"stores">; userId: string },
      any
    >;
    getStoreSubscriptionStats: FunctionReference<
      "query",
      "public",
      { storeId: Id<"stores"> },
      any
    >;
    getSubscriptionPlanDetails: FunctionReference<
      "query",
      "public",
      { planId: Id<"subscriptionPlans"> },
      any
    >;
    getSubscriptionPlans: FunctionReference<
      "query",
      "public",
      { storeId: Id<"stores"> },
      any
    >;
    getUserSubscriptions: FunctionReference<
      "query",
      "public",
      { userId: string },
      any
    >;
    reactivateSubscription: FunctionReference<
      "mutation",
      "public",
      { subscriptionId: Id<"membershipSubscriptions"> },
      any
    >;
    renewSubscription: FunctionReference<
      "mutation",
      "public",
      { subscriptionId: Id<"membershipSubscriptions"> },
      any
    >;
    updateSubscriptionPlan: FunctionReference<
      "mutation",
      "public",
      {
        courseAccess?: Array<Id<"courses">>;
        description?: string;
        digitalProductAccess?: Array<Id<"digitalProducts">>;
        discountPercentage?: number;
        features?: Array<string>;
        hasAllCourses?: boolean;
        hasAllProducts?: boolean;
        isActive?: boolean;
        monthlyPrice?: number;
        name?: string;
        planId: Id<"subscriptionPlans">;
        trialDays?: number;
        yearlyPrice?: number;
      },
      any
    >;
    updateSubscriptionStatus: FunctionReference<
      "mutation",
      "public",
      {
        status: "active" | "canceled" | "past_due" | "expired";
        stripeSubscriptionId: string;
      },
      any
    >;
    upgradeSubscription: FunctionReference<
      "mutation",
      "public",
      {
        newPlanId: Id<"subscriptionPlans">;
        subscriptionId: Id<"membershipSubscriptions">;
      },
      any
    >;
  };
  tracks: {
    createTrack: FunctionReference<
      "mutation",
      "public",
      {
        artist?: string;
        coverUrl?: string;
        description?: string;
        genre?: string;
        isPublic: boolean;
        mood?: string;
        sourceType: "upload" | "youtube" | "soundcloud" | "spotify";
        sourceUrl?: string;
        storageId?: Id<"_storage">;
        title: string;
        userId: string;
      },
      Id<"userTracks">
    >;
    deleteTrack: FunctionReference<
      "mutation",
      "public",
      { trackId: Id<"userTracks"> },
      null
    >;
    getPublicTracks: FunctionReference<
      "query",
      "public",
      { limit?: number; userId: string },
      Array<any>
    >;
    getUserTracks: FunctionReference<
      "query",
      "public",
      { userId: string },
      Array<{
        _creationTime: number;
        _id: Id<"userTracks">;
        artist?: string;
        coverUrl?: string;
        description?: string;
        genre?: string;
        isPublic: boolean;
        likes: number;
        mood?: string;
        plays: number;
        shares: number;
        sourceType: "upload" | "youtube" | "soundcloud" | "spotify";
        sourceUrl?: string;
        storageId?: Id<"_storage">;
        title: string;
        userId: string;
      }>
    >;
    incrementPlays: FunctionReference<
      "mutation",
      "public",
      { trackId: Id<"userTracks"> },
      null
    >;
    updateTrack: FunctionReference<
      "mutation",
      "public",
      {
        description?: string;
        genre?: string;
        isPublic?: boolean;
        mood?: string;
        title?: string;
        trackId: Id<"userTracks">;
      },
      null
    >;
  };
  universalProducts: {
    canAccessProduct: FunctionReference<
      "query",
      "public",
      { email?: string; productId: Id<"digitalProducts">; userId?: string },
      {
        canAccess: boolean;
        reason: string;
        requiresFollowGate: boolean;
        requiresPurchase: boolean;
      }
    >;
    createUniversalProduct: FunctionReference<
      "mutation",
      "public",
      {
        abletonVersion?: string;
        beatLeaseConfig?: {
          bpm?: number;
          genre?: string;
          key?: string;
          tiers: Array<{
            commercialUse: boolean;
            creditRequired: boolean;
            distributionLimit?: number;
            enabled: boolean;
            musicVideoUse: boolean;
            name: string;
            price: number;
            radioBroadcasting: boolean;
            stemsIncluded: boolean;
            streamingLimit?: number;
            type: "basic" | "premium" | "exclusive" | "unlimited";
          }>;
        };
        complexity?: "beginner" | "intermediate" | "advanced";
        cpuLoad?: "low" | "medium" | "high";
        dawType?:
          | "ableton"
          | "fl-studio"
          | "logic"
          | "bitwig"
          | "studio-one"
          | "reason"
          | "cubase"
          | "multi-daw";
        dawVersion?: string;
        description?: string;
        downloadUrl?: string;
        duration?: number;
        effectTypes?: Array<string>;
        followGateConfig?: {
          customMessage?: string;
          minFollowsRequired: number;
          requireEmail: boolean;
          requireInstagram: boolean;
          requireSpotify: boolean;
          requireTiktok: boolean;
          requireYoutube: boolean;
          socialLinks: {
            instagram?: string;
            spotify?: string;
            tiktok?: string;
            youtube?: string;
          };
        };
        imageUrl?: string;
        playlistConfig?: {
          genresAccepted: Array<string>;
          linkedPlaylistId?: Id<"curatorPlaylists">;
          maxSubmissionsPerMonth?: number;
          reviewTurnaroundDays: number;
          submissionGuidelines?: string;
        };
        price: number;
        pricingModel: "free_with_gate" | "paid";
        productCategory:
          | "sample-pack"
          | "preset-pack"
          | "midi-pack"
          | "bundle"
          | "effect-chain"
          | "ableton-rack"
          | "beat-lease"
          | "project-files"
          | "mixing-template"
          | "coaching"
          | "mixing-service"
          | "mastering-service"
          | "playlist-curation"
          | "course"
          | "workshop"
          | "masterclass"
          | "pdf"
          | "pdf-guide"
          | "cheat-sheet"
          | "template"
          | "blog-post"
          | "community"
          | "tip-jar"
          | "donation";
        productType:
          | "digital"
          | "playlistCuration"
          | "effectChain"
          | "abletonRack"
          | "abletonPreset"
          | "coaching"
          | "urlMedia";
        rackType?: "audioEffect" | "instrument" | "midiEffect" | "drumRack";
        sessionType?: string;
        storeId: string;
        tags?: Array<string>;
        thirdPartyPlugins?: Array<string>;
        title: string;
        userId: string;
      },
      Id<"digitalProducts"> | Id<"courses">
    >;
    generateMissingSlugs: FunctionReference<
      "mutation",
      "public",
      {},
      {
        products: Array<{ id: string; slug: string; title: string }>;
        updated: number;
      }
    >;
    getProductsByCategory: FunctionReference<
      "query",
      "public",
      {
        productCategory:
          | "sample-pack"
          | "preset-pack"
          | "midi-pack"
          | "bundle"
          | "ableton-rack"
          | "beat-lease"
          | "project-files"
          | "mixing-template"
          | "coaching"
          | "mixing-service"
          | "mastering-service"
          | "playlist-curation"
          | "course"
          | "workshop"
          | "masterclass"
          | "pdf-guide"
          | "cheat-sheet"
          | "template"
          | "blog-post"
          | "community"
          | "tip-jar"
          | "donation";
        publishedOnly?: boolean;
        storeId?: string;
      },
      Array<any>
    >;
    getUniversalProduct: FunctionReference<
      "query",
      "public",
      { productId: Id<"digitalProducts">; userId?: string },
      any | null
    >;
    getUniversalProductsByStore: FunctionReference<
      "query",
      "public",
      { publishedOnly?: boolean; storeId: string },
      Array<any>
    >;
    publishDraft: FunctionReference<
      "mutation",
      "public",
      { productId: Id<"digitalProducts">; userId: string },
      { message: string; success: boolean }
    >;
    saveDraft: FunctionReference<
      "mutation",
      "public",
      {
        abletonVersion?: string;
        complexity?: "beginner" | "intermediate" | "advanced";
        cpuLoad?: "low" | "medium" | "high";
        dawType?:
          | "ableton"
          | "fl-studio"
          | "logic"
          | "bitwig"
          | "studio-one"
          | "reason"
          | "cubase"
          | "multi-daw";
        dawVersion?: string;
        description?: string;
        downloadUrl?: string;
        duration?: number;
        effectTypes?: Array<string>;
        followGateConfig?: {
          customMessage?: string;
          minFollowsRequired: number;
          requireEmail: boolean;
          requireInstagram: boolean;
          requireSpotify: boolean;
          requireTiktok: boolean;
          requireYoutube: boolean;
          socialLinks: {
            instagram?: string;
            spotify?: string;
            tiktok?: string;
            youtube?: string;
          };
        };
        imageUrl?: string;
        price?: number;
        pricingModel?: "free_with_gate" | "paid";
        productCategory?:
          | "sample-pack"
          | "preset-pack"
          | "midi-pack"
          | "bundle"
          | "effect-chain"
          | "ableton-rack"
          | "beat-lease"
          | "project-files"
          | "mixing-template"
          | "coaching"
          | "mixing-service"
          | "mastering-service"
          | "playlist-curation"
          | "course"
          | "workshop"
          | "masterclass"
          | "pdf"
          | "pdf-guide"
          | "cheat-sheet"
          | "template"
          | "blog-post"
          | "community"
          | "tip-jar"
          | "donation";
        productId?: Id<"digitalProducts">;
        productType?:
          | "digital"
          | "playlistCuration"
          | "effectChain"
          | "abletonRack"
          | "abletonPreset"
          | "coaching"
          | "urlMedia";
        rackType?: "audioEffect" | "instrument" | "midiEffect" | "drumRack";
        sessionType?: string;
        storeId?: string;
        tags?: Array<string>;
        thirdPartyPlugins?: Array<string>;
        title?: string;
        userId?: string;
      },
      { message: string; productId?: Id<"digitalProducts">; success: boolean }
    >;
    updateUniversalProduct: FunctionReference<
      "mutation",
      "public",
      {
        description?: string;
        downloadUrl?: string;
        followGateConfig?: {
          customMessage?: string;
          minFollowsRequired: number;
          requireEmail: boolean;
          requireInstagram: boolean;
          requireSpotify: boolean;
          requireTiktok: boolean;
          requireYoutube: boolean;
          socialLinks: {
            instagram?: string;
            spotify?: string;
            tiktok?: string;
            youtube?: string;
          };
        };
        imageUrl?: string;
        isPublished?: boolean;
        playlistConfig?: {
          genresAccepted: Array<string>;
          linkedPlaylistId?: Id<"curatorPlaylists">;
          maxSubmissionsPerMonth?: number;
          reviewTurnaroundDays: number;
          submissionGuidelines?: string;
        };
        price?: number;
        pricingModel?: "free_with_gate" | "paid";
        productId: Id<"digitalProducts">;
        tags?: Array<string>;
        title?: string;
      },
      null
    >;
  };
  userLibrary: {
    getContinueWatching: FunctionReference<
      "query",
      "public",
      { userId: string },
      {
        completedChapters: number;
        course: {
          _id: Id<"courses">;
          imageUrl?: string;
          slug?: string;
          title: string;
        };
        lastAccessedAt: number;
        nextChapter: {
          _id: string;
          lessonTitle?: string;
          moduleTitle?: string;
          position: number;
          title: string;
        };
        progress: number;
        timeAgo: string;
        totalChapters: number;
      } | null
    >;
    getUserEnrolledCourses: FunctionReference<
      "query",
      "public",
      { userId: string },
      Array<{
        _id: Id<"courses">;
        category?: string;
        description?: string;
        enrolledAt?: number;
        imageUrl?: string;
        lastAccessedAt?: number;
        price?: number;
        progress?: number;
        skillLevel?: string;
        slug?: string;
        subcategory?: string;
        tags?: Array<string>;
        title: string;
        userId: string;
      }>
    >;
    getUserLibraryStats: FunctionReference<
      "query",
      "public",
      { userId: string },
      {
        certificatesEarned: number;
        coursesCompleted: number;
        coursesEnrolled: number;
        currentStreak: number;
        samplePacksOwned: number;
        totalHoursLearned: number;
      }
    >;
    getUserRecentActivity: FunctionReference<
      "query",
      "public",
      { limit?: number; userId: string },
      Array<{
        courseName: string;
        id: string;
        timestamp: string;
        timestampMs: number;
        title: string;
        type: "completed_lesson" | "started_course" | "earned_certificate";
      }>
    >;
  };
  users: {
    checkIsAdmin: FunctionReference<
      "query",
      "public",
      { clerkId: string },
      { isAdmin: boolean; user: any | null }
    >;
    createOrUpdateUserFromClerk: FunctionReference<
      "mutation",
      "public",
      {
        clerkId: string;
        email: string | null;
        firstName: string | null;
        imageUrl: string | null;
        lastName: string | null;
      },
      Id<"users">
    >;
    deleteUser: FunctionReference<
      "mutation",
      "public",
      { clerkId: string },
      null
    >;
    getAllUsers: FunctionReference<
      "query",
      "public",
      {
        clerkId: string;
        paginationOpts: {
          cursor: string | null;
          endCursor?: string | null;
          id?: number;
          maximumBytesRead?: number;
          maximumRowsRead?: number;
          numItems: number;
        };
      },
      any
    >;
    getLearnerPreferences: FunctionReference<
      "query",
      "public",
      { userId: string },
      {
        _creationTime: number;
        _id: Id<"learnerPreferences">;
        goal: "hobby" | "career" | "skills" | "certification";
        interests: Array<string>;
        onboardingCompletedAt?: number;
        skillLevel: "beginner" | "intermediate" | "advanced";
        userId: string;
        weeklyHours?: number;
      } | null
    >;
    getMyProfile: FunctionReference<
      "query",
      "public",
      {},
      {
        _id: Id<"users">;
        bio?: string;
        dashboardPreference?: "learn" | "create";
        email?: string;
        imageUrl?: string;
        instagram?: string;
        name?: string;
        tiktok?: string;
        twitter?: string;
        website?: string;
        youtube?: string;
      } | null
    >;
    getUserById: FunctionReference<
      "query",
      "public",
      { userId: Id<"users"> },
      any | null
    >;
    getUserByStripeAccountId: FunctionReference<
      "query",
      "public",
      { stripeConnectAccountId: string },
      any | null
    >;
    getUserFromClerk: FunctionReference<
      "query",
      "public",
      { clerkId: string },
      any | null
    >;
    getUserStats: FunctionReference<
      "query",
      "public",
      { clerkId: string },
      { creators: number; students: number; total: number; verified: number }
    >;
    saveLearnerPreferences: FunctionReference<
      "mutation",
      "public",
      {
        goal: "hobby" | "career" | "skills" | "certification";
        interests: Array<string>;
        skillLevel: "beginner" | "intermediate" | "advanced";
        userId: string;
        weeklyHours?: number;
      },
      Id<"learnerPreferences">
    >;
    setDashboardPreference: FunctionReference<
      "mutation",
      "public",
      { clerkId: string; preference: "learn" | "create" },
      null
    >;
    setUserAsAdmin: FunctionReference<
      "mutation",
      "public",
      { clerkId: string },
      Id<"users">
    >;
    updateMyProfile: FunctionReference<
      "mutation",
      "public",
      {
        bio?: string;
        dashboardPreference?: "learn" | "create";
        instagram?: string;
        name?: string;
        tiktok?: string;
        twitter?: string;
        website?: string;
        youtube?: string;
      },
      boolean
    >;
    updateUserByClerkId: FunctionReference<
      "mutation",
      "public",
      {
        clerkId: string;
        updates: {
          bio?: string;
          imageUrl?: string;
          instagram?: string;
          name?: string;
          stripeAccountStatus?: "pending" | "restricted" | "enabled";
          stripeConnectAccountId?: string;
          stripeOnboardingComplete?: boolean;
          tiktok?: string;
          twitter?: string;
          website?: string;
          youtube?: string;
        };
      },
      null
    >;
    updateUserProfile: FunctionReference<
      "mutation",
      "public",
      {
        bio?: string;
        instagram?: string;
        name?: string;
        tiktok?: string;
        twitter?: string;
        userId: Id<"users">;
        website?: string;
        youtube?: string;
      },
      null
    >;
    updateUserRole: FunctionReference<
      "mutation",
      "public",
      {
        adminClerkId: string;
        role: "admin" | "user" | "creator";
        targetUserId: Id<"users">;
      },
      { message: string; success: boolean }
    >;
  };
  vercelDomainManager: {
    addDomainToVercel: FunctionReference<
      "action",
      "public",
      { domain: string; storeId: Id<"stores"> },
      { message: string; success: boolean }
    >;
    removeDomainFromVercel: FunctionReference<
      "action",
      "public",
      { domain: string },
      { message: string; success: boolean }
    >;
  };
  webAnalytics: {
    debugSessionIds: FunctionReference<"query", "public", {}, any>;
    getCountryBreakdown: FunctionReference<
      "query",
      "public",
      { days?: number; limit?: number },
      any
    >;
    getDeviceBreakdown: FunctionReference<
      "query",
      "public",
      { days?: number },
      any
    >;
    getPageViews: FunctionReference<"query", "public", { days?: number }, any>;
    getStoreCountries: FunctionReference<
      "query",
      "public",
      { days?: number; limit?: number; storeSlug: string },
      any
    >;
    getStoreDevices: FunctionReference<
      "query",
      "public",
      { days?: number; storeSlug: string },
      any
    >;
    getStoreReferrers: FunctionReference<
      "query",
      "public",
      { days?: number; limit?: number; storeSlug: string },
      any
    >;
    getStoreTopPages: FunctionReference<
      "query",
      "public",
      { days?: number; limit?: number; storeSlug: string },
      any
    >;
    getStoreTraffic: FunctionReference<
      "query",
      "public",
      { days?: number; storeSlug: string },
      any
    >;
    getStoreTrafficOverTime: FunctionReference<
      "query",
      "public",
      { days?: number; storeSlug: string },
      any
    >;
    getTopPages: FunctionReference<
      "query",
      "public",
      { days?: number; limit?: number },
      any
    >;
    getTopReferrers: FunctionReference<
      "query",
      "public",
      { days?: number; limit?: number },
      any
    >;
    getTrafficOverTime: FunctionReference<
      "query",
      "public",
      { days?: number },
      any
    >;
    getUniqueVisitors: FunctionReference<
      "query",
      "public",
      { days?: number },
      any
    >;
  };
  wishlists: {
    addCourseToWishlist: FunctionReference<
      "mutation",
      "public",
      { courseId: Id<"courses">; notifyOnPriceDrop?: boolean },
      Id<"wishlists">
    >;
    addProductToWishlist: FunctionReference<
      "mutation",
      "public",
      {
        notifyOnPriceDrop?: boolean;
        productId: Id<"digitalProducts">;
        productType?: string;
      },
      Id<"wishlists">
    >;
    addToWishlist: FunctionReference<
      "mutation",
      "public",
      { productId: Id<"digitalProducts">; productType?: string },
      Id<"wishlists">
    >;
    getUserWishlist: FunctionReference<
      "query",
      "public",
      {
        filterCategory?: string;
        filterType?: "all" | "product" | "course";
        sortBy?:
          | "date_desc"
          | "date_asc"
          | "price_asc"
          | "price_desc"
          | "name_asc"
          | "name_desc";
      },
      Array<{
        _creationTime: number;
        _id: Id<"wishlists">;
        category: string;
        courseId?: Id<"courses">;
        coverImageUrl?: string;
        currentPrice: number;
        itemType: "product" | "course";
        notifyOnPriceDrop?: boolean;
        priceAtAdd?: number;
        priceDropAmount?: number;
        priceDropped: boolean;
        productId?: Id<"digitalProducts">;
        productType?: string;
        slug?: string;
        title: string;
      }>
    >;
    getWishlistCategories: FunctionReference<
      "query",
      "public",
      {},
      Array<string>
    >;
    getWishlistCount: FunctionReference<"query", "public", {}, number>;
    getWishlistItemsWithPriceDrops: FunctionReference<
      "query",
      "public",
      {},
      Array<{
        _creationTime: number;
        _id: Id<"wishlists">;
        category: string;
        courseId?: Id<"courses">;
        coverImageUrl?: string;
        currentPrice: number;
        itemType: "product" | "course";
        notifyOnPriceDrop?: boolean;
        priceAtAdd?: number;
        priceDropAmount?: number;
        priceDropped: boolean;
        productId?: Id<"digitalProducts">;
        productType?: string;
        slug?: string;
        title: string;
      }>
    >;
    isCourseInWishlist: FunctionReference<
      "query",
      "public",
      { courseId: Id<"courses"> },
      boolean
    >;
    isInWishlist: FunctionReference<
      "query",
      "public",
      { courseId?: Id<"courses">; productId?: Id<"digitalProducts"> },
      boolean
    >;
    removeFromWishlist: FunctionReference<
      "mutation",
      "public",
      { courseId?: Id<"courses">; productId?: Id<"digitalProducts"> },
      boolean
    >;
    togglePriceDropNotification: FunctionReference<
      "mutation",
      "public",
      { enabled: boolean; wishlistId: Id<"wishlists"> },
      null
    >;
  };
  workflowTemplates: {
    deleteTemplate: FunctionReference<
      "mutation",
      "public",
      { templateId: Id<"workflowTemplates"> },
      any
    >;
    getGoalCompletions: FunctionReference<
      "query",
      "public",
      { limit?: number; workflowId: Id<"emailWorkflows"> },
      any
    >;
    getGoalStats: FunctionReference<
      "query",
      "public",
      { workflowId: Id<"emailWorkflows"> },
      any
    >;
    getSystemTemplates: FunctionReference<"query", "public", {}, any>;
    getTemplates: FunctionReference<
      "query",
      "public",
      {
        category?:
          | "welcome"
          | "nurture"
          | "sales"
          | "re_engagement"
          | "onboarding"
          | "custom";
      },
      any
    >;
    saveAsTemplate: FunctionReference<
      "mutation",
      "public",
      {
        category:
          | "welcome"
          | "nurture"
          | "sales"
          | "re_engagement"
          | "onboarding"
          | "custom";
        description: string;
        name: string;
        workflowId: Id<"emailWorkflows">;
      },
      any
    >;
    useTemplate: FunctionReference<
      "mutation",
      "public",
      {
        storeId: string;
        templateId: string;
        userId: string;
        workflowName: string;
      },
      any
    >;
  };
};

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: {
  accessControl: {
    hasSubscriptionAccess: FunctionReference<
      "query",
      "internal",
      {
        creatorId: string;
        tierId?: Id<"creatorSubscriptionTiers">;
        userId: string;
      },
      boolean
    >;
  };
  achievements: {
    awardCreatorBadge: FunctionReference<
      "mutation",
      "internal",
      { badge: string; userId: string },
      boolean
    >;
    awardCreatorXP: FunctionReference<
      "mutation",
      "internal",
      { action: string; customXP?: number; userId: string },
      {
        leveledUp: boolean;
        newLevel: number;
        newTotal: number;
        xpAwarded: number;
      }
    >;
    checkAndAwardAchievement: FunctionReference<
      "mutation",
      "internal",
      { achievementId: string; condition: boolean; userId: string },
      null
    >;
  };
  admin: {
    featureDiscovery: {
      bulkSaveSuggestions: FunctionReference<
        "mutation",
        "internal",
        {
          analysisRunId: string;
          suggestions: Array<{
            category: string;
            cursorPrompt?: string;
            description: string;
            existsPartially?: string;
            implementationHint?: string;
            name: string;
            priority: string;
            reasoning: string;
            sourceChapters: Array<string>;
            sourceCourses: Array<string>;
          }>;
        },
        { saved: number; updated: number }
      >;
      getSuggestionByIdInternal: FunctionReference<
        "query",
        "internal",
        { suggestionId: Id<"suggestedFeatures"> },
        {
          _creationTime: number;
          _id: Id<"suggestedFeatures">;
          analysisRunId?: string;
          category: string;
          cursorPrompt?: string;
          description: string;
          existsPartially?: string;
          implementationHint?: string;
          linkedTaskUrl?: string;
          name: string;
          notes?: string;
          priority: string;
          reasoning: string;
          sourceChapters: Array<string>;
          sourceCourses: Array<string>;
          status: string;
          updatedAt: number;
        } | null
      >;
    };
  };
  aiAgents: {
    seedBuiltInAgents: FunctionReference<"mutation", "internal", {}, null>;
  };
  aiCourseBuilder: {
    processChapterExpansionInBackground: FunctionReference<
      "action",
      "internal",
      {
        outlineId: Id<"aiCourseOutlines">;
        parallelBatchSize?: number;
        queueId: Id<"aiCourseQueue">;
        settings?: {
          autoSaveWebResearch: boolean;
          chunksPerFacet: number;
          customModels?: {
            critic?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
            finalWriter?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
            ideaGenerator?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
            planner?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
            summarizer?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
          };
          enableCreativeMode: boolean;
          enableCritic: boolean;
          enableFactVerification: boolean;
          enableWebResearch: boolean;
          maxFacets: number;
          maxRetries?: number;
          preset: "budget" | "speed" | "balanced" | "deepReasoning" | "premium";
          qualityThreshold?: number;
          responseStyle:
            | "structured"
            | "conversational"
            | "concise"
            | "educational";
          similarityThreshold: number;
          sourceTypes?: Array<
            "course" | "chapter" | "lesson" | "document" | "note" | "custom"
          >;
          webSearchMaxResults?: number;
        };
      },
      any
    >;
    processExistingCourseExpansionInBackground: FunctionReference<
      "action",
      "internal",
      {
        courseId: Id<"courses">;
        parallelBatchSize?: number;
        queueId: Id<"aiCourseQueue">;
        settings?: {
          autoSaveWebResearch: boolean;
          chunksPerFacet: number;
          customModels?: {
            critic?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
            finalWriter?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
            ideaGenerator?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
            planner?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
            summarizer?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
          };
          enableCreativeMode: boolean;
          enableCritic: boolean;
          enableFactVerification: boolean;
          enableWebResearch: boolean;
          maxFacets: number;
          maxRetries?: number;
          preset: "budget" | "speed" | "balanced" | "deepReasoning" | "premium";
          qualityThreshold?: number;
          responseStyle:
            | "structured"
            | "conversational"
            | "concise"
            | "educational";
          similarityThreshold: number;
          sourceTypes?: Array<
            "course" | "chapter" | "lesson" | "document" | "note" | "custom"
          >;
          webSearchMaxResults?: number;
        };
      },
      any
    >;
    processOutlineInBackground: FunctionReference<
      "action",
      "internal",
      {
        queueId: Id<"aiCourseQueue">;
        settings?: {
          autoSaveWebResearch: boolean;
          chunksPerFacet: number;
          customModels?: {
            critic?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
            finalWriter?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
            ideaGenerator?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
            planner?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
            summarizer?:
              | "gpt-4o"
              | "gpt-4o-mini"
              | "o1"
              | "o1-mini"
              | "gpt-5-mini"
              | "gpt-oss-120b"
              | "claude-4.5-sonnet"
              | "claude-4.5-opus"
              | "claude-4-sonnet"
              | "claude-3.5-sonnet"
              | "claude-3.5-haiku"
              | "gemini-3-pro"
              | "gemini-2.5-flash"
              | "gemini-2.5-flash-lite"
              | "gemini-2.5-pro"
              | "gemini-2.0-flash"
              | "deepseek-chat"
              | "deepseek-r1"
              | "grok-code-fast"
              | "grok-4-fast"
              | "llama-3.3-70b"
              | "qwen-2.5-72b";
          };
          enableCreativeMode: boolean;
          enableCritic: boolean;
          enableFactVerification: boolean;
          enableWebResearch: boolean;
          maxFacets: number;
          maxRetries?: number;
          preset: "budget" | "speed" | "balanced" | "deepReasoning" | "premium";
          qualityThreshold?: number;
          responseStyle:
            | "structured"
            | "conversational"
            | "concise"
            | "educational";
          similarityThreshold: number;
          sourceTypes?: Array<
            "course" | "chapter" | "lesson" | "document" | "note" | "custom"
          >;
          webSearchMaxResults?: number;
        };
      },
      any
    >;
    processReformattingInBackground: FunctionReference<
      "action",
      "internal",
      {
        courseId: Id<"courses">;
        failedCount?: number;
        parallelBatchSize?: number;
        processedChapterIds?: Array<string>;
        queueId: Id<"aiCourseQueue">;
        reformattedCount?: number;
        skippedCount?: number;
        totalChapters?: number;
      },
      any
    >;
  };
  aiCourseBuilderQueries: {
    getNextQueuedItem: FunctionReference<
      "query",
      "internal",
      { userId?: string },
      any
    >;
    getOutlineInternal: FunctionReference<
      "query",
      "internal",
      { outlineId: Id<"aiCourseOutlines"> },
      any
    >;
    getQueueItemInternal: FunctionReference<
      "query",
      "internal",
      { queueId: Id<"aiCourseQueue"> },
      any
    >;
    linkCourseToQueue: FunctionReference<
      "mutation",
      "internal",
      { courseId: Id<"courses">; queueId: Id<"aiCourseQueue"> },
      null
    >;
    linkOutlineToQueue: FunctionReference<
      "mutation",
      "internal",
      { outlineId: Id<"aiCourseOutlines">; queueId: Id<"aiCourseQueue"> },
      null
    >;
    saveOutline: FunctionReference<
      "mutation",
      "internal",
      {
        chapterStatus: Array<{
          chapterIndex: number;
          hasDetailedContent: boolean;
          lessonIndex: number;
          moduleIndex: number;
          title: string;
          wordCount?: number;
        }>;
        description: string;
        estimatedDuration?: number;
        generationModel?: string;
        generationTimeMs?: number;
        outline: any;
        queueId: Id<"aiCourseQueue">;
        skillLevel: "beginner" | "intermediate" | "advanced";
        storeId: string;
        title: string;
        topic: string;
        totalChapters: number;
        userId: string;
      },
      Id<"aiCourseOutlines">
    >;
    updateOutlineContent: FunctionReference<
      "mutation",
      "internal",
      {
        chapterStatus: Array<{
          chapterIndex: number;
          hasDetailedContent: boolean;
          lessonIndex: number;
          moduleIndex: number;
          title: string;
          wordCount?: number;
        }>;
        expandedChapters: number;
        outline: any;
        outlineId: Id<"aiCourseOutlines">;
      },
      null
    >;
  };
  aiMemories: {
    saveExtractedMemories: FunctionReference<
      "mutation",
      "internal",
      {
        conversationId: Id<"aiConversations">;
        memories: Array<{
          content: string;
          importance: number;
          summary: string;
          type:
            | "preference"
            | "fact"
            | "skill_level"
            | "context"
            | "correction";
        }>;
        userId: string;
      },
      { created: number }
    >;
  };
  analytics: {
    backfill: {
      backfillAll: FunctionReference<"mutation", "internal", {}, any>;
      backfillCreatorPublished: FunctionReference<
        "mutation",
        "internal",
        {},
        any
      >;
      backfillCreatorStarted: FunctionReference<
        "mutation",
        "internal",
        {},
        any
      >;
      backfillEnrollments: FunctionReference<"mutation", "internal", {}, any>;
      backfillPurchases: FunctionReference<"mutation", "internal", {}, any>;
      backfillSignups: FunctionReference<
        "mutation",
        "internal",
        { cursor?: string },
        any
      >;
      clearAllEvents: FunctionReference<
        "mutation",
        "internal",
        { confirm: "DELETE_ALL_ANALYTICS_EVENTS" },
        any
      >;
      getEventCounts: FunctionReference<"mutation", "internal", {}, any>;
    };
    tracking: {
      trackCreatorPublished: FunctionReference<
        "mutation",
        "internal",
        {
          resourceId: string;
          resourceType: "course" | "digitalProduct";
          storeId: string;
          userId: string;
        },
        any
      >;
      trackCreatorStarted: FunctionReference<
        "mutation",
        "internal",
        { storeId: string; userId: string },
        any
      >;
      trackEnrollment: FunctionReference<
        "mutation",
        "internal",
        { courseId: string; storeId?: string; userId: string },
        any
      >;
      trackPageView: FunctionReference<
        "mutation",
        "internal",
        {
          page: string;
          referrer?: string;
          source?: string;
          storeId?: string;
          userId?: string;
        },
        any
      >;
      trackPurchase: FunctionReference<
        "mutation",
        "internal",
        {
          amount: number;
          currency?: string;
          resourceId: string;
          resourceType: "course" | "digitalProduct";
          storeId?: string;
          userId: string;
        },
        any
      >;
      trackSignup: FunctionReference<
        "mutation",
        "internal",
        { userId: string },
        any
      >;
    };
  };
  audioGeneration: {
    createSampleRecord: FunctionReference<
      "mutation",
      "internal",
      {
        category:
          | "drums"
          | "bass"
          | "synth"
          | "vocals"
          | "fx"
          | "melody"
          | "loops"
          | "one-shots";
        creditPrice: number;
        description?: string;
        duration: number;
        fileName: string;
        fileSize: number;
        fileUrl: string;
        format: string;
        genre: string;
        licenseType: "royalty-free" | "exclusive" | "commercial";
        storageId: Id<"_storage">;
        storeId: string;
        tags: Array<string>;
        title: string;
        userId: string;
      },
      Id<"audioSamples">
    >;
    generateAudio: FunctionReference<
      "action",
      "internal",
      { chapterId: Id<"courseChapters"> },
      null
    >;
    generateVideo: FunctionReference<
      "action",
      "internal",
      { chapterId: Id<"courseChapters"> },
      null
    >;
    getChapterContent: FunctionReference<
      "query",
      "internal",
      { chapterId: Id<"courseChapters"> },
      { _id: Id<"courseChapters">; description?: string; title: string } | null
    >;
    getSampleById: FunctionReference<
      "query",
      "internal",
      { sampleId: Id<"audioSamples"> },
      any
    >;
    updateAudioGenerationStatus: FunctionReference<
      "mutation",
      "internal",
      {
        audioUrl?: string;
        chapterId: Id<"courseChapters">;
        error?: string;
        generatedAt?: number;
        status: "pending" | "generating" | "completed" | "failed";
      },
      null
    >;
    updateVideoGenerationStatus: FunctionReference<
      "mutation",
      "internal",
      {
        chapterId: Id<"courseChapters">;
        error?: string;
        generatedAt?: number;
        status: "pending" | "generating" | "completed" | "failed";
        videoUrl?: string;
      },
      null
    >;
  };
  audioGenerationNode: {
    generateSoundEffectFromText: FunctionReference<
      "action",
      "internal",
      { description: string; duration: number },
      {
        audioUrl?: string;
        error?: string;
        filePath?: string;
        fileSize?: number;
        format?: string;
        storageId?: Id<"_storage">;
        success: boolean;
      }
    >;
  };
  automation: {
    addUserTag: FunctionReference<
      "mutation",
      "internal",
      { tagName: string; userStateId: Id<"userAutomationStates"> },
      null
    >;
    completeUserFlow: FunctionReference<
      "mutation",
      "internal",
      { userStateId: Id<"userAutomationStates"> },
      null
    >;
    createAutomationMessage: FunctionReference<
      "mutation",
      "internal",
      {
        automationFlowId: Id<"automationFlows">;
        content: string;
        mediaUrls?: Array<string>;
        messageType: "dm" | "comment_reply" | "story_reply";
        nodeId: string;
        platform: "instagram" | "twitter" | "facebook" | "tiktok" | "linkedin";
        platformUserId: string;
        platformUsername?: string;
        socialAccountId?: Id<"socialAccounts">;
        storeId: string;
        userAutomationStateId: Id<"userAutomationStates">;
      },
      Id<"automationMessages">
    >;
    createAutomationTrigger: FunctionReference<
      "mutation",
      "internal",
      {
        automationFlowId: Id<"automationFlows">;
        commentId?: string;
        fullContent: string;
        keyword?: string;
        matchedText: string;
        messageId?: string;
        platform: "instagram" | "twitter" | "facebook" | "tiktok" | "linkedin";
        platformUserId: string;
        platformUsername?: string;
        postId?: string;
        socialAccountId: Id<"socialAccounts">;
        storeId: string;
        triggerType: string;
        webhookId?: Id<"socialWebhooks">;
      },
      Id<"automationTriggers">
    >;
    createOrUpdateUserState: FunctionReference<
      "mutation",
      "internal",
      {
        automationFlowId: Id<"automationFlows">;
        platform: "instagram" | "twitter" | "facebook" | "tiktok" | "linkedin";
        platformUserId: string;
        platformUsername?: string;
        storeId: string;
        triggerContext: {
          originalCommentId?: string;
          originalPostId?: string;
          socialAccountId?: Id<"socialAccounts">;
          triggerMessage?: string;
          triggerType: string;
        };
      },
      Id<"userAutomationStates">
    >;
    executeAutomationFlow: FunctionReference<
      "action",
      "internal",
      { userStateId: Id<"userAutomationStates"> },
      null
    >;
    executeDelayedNode: FunctionReference<
      "action",
      "internal",
      {
        flowId: Id<"automationFlows">;
        nodeId: string;
        userStateId: Id<"userAutomationStates">;
      },
      null
    >;
    findSocialAccountByWebhook: FunctionReference<
      "query",
      "internal",
      {
        platform: "instagram" | "twitter" | "facebook" | "tiktok" | "linkedin";
        webhookPayload: any;
      },
      any | null
    >;
    getActiveAutomationFlows: FunctionReference<
      "query",
      "internal",
      {
        platform: "instagram" | "twitter" | "facebook" | "tiktok" | "linkedin";
        socialAccountId?: Id<"socialAccounts">;
        triggerTypes: Array<string>;
      },
      Array<any>
    >;
    getActiveAutomationFlowsForUser: FunctionReference<
      "query",
      "internal",
      {
        platform: "instagram" | "twitter" | "facebook" | "tiktok" | "linkedin";
        socialAccountId: Id<"socialAccounts">;
        storeId: string;
        triggerTypes: Array<string>;
        userId: string;
      },
      Array<any>
    >;
    getAutomationFlowInternal: FunctionReference<
      "query",
      "internal",
      { flowId: Id<"automationFlows"> },
      any | null
    >;
    getAutomationMessage: FunctionReference<
      "query",
      "internal",
      { messageId: Id<"automationMessages"> },
      any | null
    >;
    getLastUserResponse: FunctionReference<
      "query",
      "internal",
      { userStateId: Id<"userAutomationStates"> },
      string | null
    >;
    getPendingUserStates: FunctionReference<
      "query",
      "internal",
      {
        platform: "instagram" | "twitter" | "facebook" | "tiktok" | "linkedin";
        platformUserId: string;
        storeId: string;
      },
      Array<any>
    >;
    getPendingUserStatesAnyStore: FunctionReference<
      "query",
      "internal",
      {
        platform: "instagram" | "twitter" | "facebook" | "tiktok" | "linkedin";
        platformUserId: string;
      },
      Array<any>
    >;
    getSocialAccount: FunctionReference<
      "query",
      "internal",
      { accountId: Id<"socialAccounts"> },
      any | null
    >;
    getSocialWebhook: FunctionReference<
      "query",
      "internal",
      { webhookId: Id<"socialWebhooks"> },
      any | null
    >;
    getTrigger: FunctionReference<
      "query",
      "internal",
      { triggerId: Id<"automationTriggers"> },
      any | null
    >;
    getUserAutomationState: FunctionReference<
      "query",
      "internal",
      {
        flowId: Id<"automationFlows">;
        platform: "instagram" | "twitter" | "facebook" | "tiktok" | "linkedin";
        platformUserId: string;
      },
      any | null
    >;
    getUserState: FunctionReference<
      "query",
      "internal",
      { userStateId: Id<"userAutomationStates"> },
      any | null
    >;
    incrementFlowStats: FunctionReference<
      "mutation",
      "internal",
      {
        field: "totalTriggers" | "totalCompletions";
        flowId: Id<"automationFlows">;
      },
      null
    >;
    processTrigger: FunctionReference<
      "action",
      "internal",
      { triggerId: Id<"automationTriggers"> },
      null
    >;
    processUserResponse: FunctionReference<
      "action",
      "internal",
      {
        platform: "instagram" | "twitter" | "facebook" | "tiktok" | "linkedin";
        platformUserId: string;
        responseText: string;
        storeId?: string;
      },
      null
    >;
    sendAutomationMessage: FunctionReference<
      "action",
      "internal",
      { messageId: Id<"automationMessages"> },
      null
    >;
    setPendingUserResponse: FunctionReference<
      "mutation",
      "internal",
      {
        expectedResponse: string;
        userStateId: Id<"userAutomationStates">;
        waitingNodeId: string;
      },
      null
    >;
    updateMessageForRetry: FunctionReference<
      "mutation",
      "internal",
      {
        messageId: Id<"automationMessages">;
        nextRetryAt: number;
        retryCount: number;
      },
      null
    >;
    updateMessageStatus: FunctionReference<
      "mutation",
      "internal",
      {
        deliveredAt?: number;
        errorMessage?: string;
        messageId: Id<"automationMessages">;
        platformMessageId?: string;
        sentAt?: number;
        status:
          | "pending"
          | "sending"
          | "sent"
          | "delivered"
          | "failed"
          | "rate_limited";
      },
      null
    >;
    updateTrigger: FunctionReference<
      "mutation",
      "internal",
      {
        processedAt?: number;
        status?: "pending" | "processing" | "completed" | "failed" | "ignored";
        triggerId: Id<"automationTriggers">;
        userAutomationStateId?: Id<"userAutomationStates">;
      },
      null
    >;
    updateTriggerStatus: FunctionReference<
      "mutation",
      "internal",
      {
        errorMessage?: string;
        status: "pending" | "processing" | "completed" | "failed" | "ignored";
        triggerId: Id<"automationTriggers">;
      },
      null
    >;
    updateUserResponse: FunctionReference<
      "mutation",
      "internal",
      { responseText: string; userStateId: Id<"userAutomationStates"> },
      null
    >;
    updateUserStateCurrentNode: FunctionReference<
      "mutation",
      "internal",
      { currentNodeId: string; userStateId: Id<"userAutomationStates"> },
      null
    >;
  };
  automations: {
    createChatHistory: FunctionReference<
      "mutation",
      "internal",
      {
        automationId: Id<"automations">;
        message: string;
        receiverId: string;
        role: "user" | "assistant";
        senderId: string;
      },
      Id<"chatHistory">
    >;
    findAutomationByChatHistory: FunctionReference<
      "query",
      "internal",
      { receiverId: string; senderId: string },
      { automationId: Id<"automations">; history: Array<any> } | null
    >;
    getAutomationWithListener: FunctionReference<
      "query",
      "internal",
      { automationId: Id<"automations"> },
      {
        _id: Id<"automations">;
        listener: {
          commentReply?: string;
          listener: string;
          prompt?: string;
        } | null;
        name?: string;
        userId: Id<"users">;
        userPlan: string;
      } | null
    >;
    getChatHistoryInternal: FunctionReference<
      "query",
      "internal",
      { automationId: Id<"automations">; instagramUserId: string },
      Array<{ message: string; role: "user" | "assistant" }>
    >;
    getKeywordAutomation: FunctionReference<
      "query",
      "internal",
      { automationId: Id<"automations">; includePosts: boolean },
      any | null
    >;
    getKeywordPost: FunctionReference<
      "query",
      "internal",
      { automationId: Id<"automations">; mediaId: string },
      any | null
    >;
    trackResponse: FunctionReference<
      "mutation",
      "internal",
      { automationId: Id<"automations">; type: "COMMENT" | "DM" },
      null
    >;
  };
  automationTriggers: {
    logWebhookCall: FunctionReference<
      "mutation",
      "internal",
      {
        errorMessage?: string;
        executionId?: Id<"workflowExecutions">;
        ipAddress?: string;
        payload: any;
        status: "success" | "error" | "rate_limited";
        storeId: string;
        userAgent?: string;
        webhookEndpointId: Id<"webhookEndpoints">;
        workflowTriggered?: boolean;
      },
      any
    >;
  };
  beatLeases: {
    markBeatAsExclusivelySold: FunctionReference<
      "mutation",
      "internal",
      {
        beatId: Id<"digitalProducts">;
        purchaseId: Id<"purchases">;
        userId: string;
      },
      any
    >;
  };
  changelog: {
    getEntriesByIds: FunctionReference<
      "query",
      "internal",
      { entryIds: Array<Id<"changelogEntries">> },
      any
    >;
    verifyAdmin: FunctionReference<
      "query",
      "internal",
      { clerkId: string },
      { admin: boolean } | null
    >;
  };
  clerkSync: {
    createUserInternal: FunctionReference<
      "mutation",
      "internal",
      {
        clerkId: string;
        email: string | null;
        firstName: string | null;
        imageUrl: string | null;
        lastName: string | null;
      },
      Id<"users">
    >;
    getAllUsersInternal: FunctionReference<"query", "internal", {}, Array<any>>;
    syncClerkUsersInternal: FunctionReference<
      "action",
      "internal",
      { clerkId: string; clerkSecretKey: string },
      {
        errors: Array<string>;
        success: boolean;
        totalClerkUsers: number;
        totalConvexUsers: number;
        usersAdded: number;
        usersUpdated: number;
      }
    >;
    updateSyncMetadata: FunctionReference<
      "mutation",
      "internal",
      {
        totalClerkUsers: number;
        totalConvexUsers: number;
        usersAdded: number;
        usersUpdated: number;
      },
      null
    >;
    updateUserInternal: FunctionReference<
      "mutation",
      "internal",
      {
        clerkId: string;
        email: string | null;
        firstName: string | null;
        imageUrl: string | null;
        lastName: string | null;
        userId: Id<"users">;
      },
      null
    >;
    verifyAdminInternal: FunctionReference<
      "query",
      "internal",
      { clerkId: string },
      any | null
    >;
  };
  coachingDiscordActions: {
    cleanupSessionDiscord: FunctionReference<
      "action",
      "internal",
      { sessionId: Id<"coachingSessions"> },
      null
    >;
    setupDiscordForSession: FunctionReference<
      "action",
      "internal",
      {
        coachId: string;
        productId: Id<"digitalProducts">;
        sessionId: Id<"coachingSessions">;
        studentId: string;
      },
      null
    >;
  };
  coachingEmails: {
    sendBookingConfirmationEmail: FunctionReference<
      "action",
      "internal",
      {
        coachName: string;
        duration: number;
        sessionDate: string;
        sessionTime: string;
        sessionTitle: string;
        studentEmail: string;
        studentName: string;
      },
      { error?: string; success: boolean }
    >;
    sendNewBookingNotificationEmail: FunctionReference<
      "action",
      "internal",
      {
        amount: number;
        coachEmail: string;
        coachName: string;
        duration: number;
        notes?: string;
        sessionDate: string;
        sessionTime: string;
        sessionTitle: string;
        studentEmail: string;
        studentName: string;
      },
      { error?: string; success: boolean }
    >;
    sendSessionReminderEmail: FunctionReference<
      "action",
      "internal",
      {
        duration: number;
        hoursUntil: number;
        isCoach: boolean;
        otherPartyName: string;
        recipientEmail: string;
        recipientName: string;
        sessionDate: string;
        sessionTime: string;
        sessionTitle: string;
      },
      { error?: string; success: boolean }
    >;
  };
  coachingProducts: {
    getProductForDiscord: FunctionReference<
      "query",
      "internal",
      { productId: Id<"digitalProducts"> },
      { storeId: string; title: string } | null
    >;
    getSessionForCleanup: FunctionReference<
      "query",
      "internal",
      { sessionId: Id<"coachingSessions"> },
      {
        discordChannelId?: string;
        discordRoleId?: string;
        productId: Id<"digitalProducts">;
      } | null
    >;
    updateSessionDiscordInfo: FunctionReference<
      "mutation",
      "internal",
      {
        discordChannelId: string;
        discordRoleId: string;
        sessionId: Id<"coachingSessions">;
      },
      null
    >;
  };
  coachingSessionManager: {
    manageCoachingSessions: FunctionReference<"action", "internal", {}, null>;
  };
  coachingSessionQueries: {
    getSessionGuildInfo: FunctionReference<
      "query",
      "internal",
      { coachId: string },
      { botToken: string; guildId: string } | null
    >;
    getSessionsNeedingCleanup: FunctionReference<
      "query",
      "internal",
      {},
      Array<{
        _id: Id<"coachingSessions">;
        coachId: string;
        discordChannelId?: string;
        discordCleanedUp?: boolean;
        discordRoleId?: string;
        discordSetupComplete?: boolean;
        endTime: string;
        productId: Id<"digitalProducts">;
        scheduledDate: number;
        studentId: string;
      }>
    >;
    getSessionsNeedingSetup: FunctionReference<
      "query",
      "internal",
      {},
      Array<{
        _id: Id<"coachingSessions">;
        coachId: string;
        discordSetupComplete?: boolean;
        duration: number;
        endTime: string;
        productId: Id<"digitalProducts">;
        scheduledDate: number;
        startTime: string;
        studentId: string;
      }>
    >;
    markSessionCleanedUp: FunctionReference<
      "mutation",
      "internal",
      { sessionId: Id<"coachingSessions"> },
      null
    >;
    markSessionSetupComplete: FunctionReference<
      "mutation",
      "internal",
      {
        discordChannelId: string;
        discordRoleId: string;
        sessionId: Id<"coachingSessions">;
      },
      null
    >;
  };
  conversionNudges: {
    checkConversionTriggers: FunctionReference<
      "mutation",
      "internal",
      { activityType: string; metadata?: any; userId: string },
      any
    >;
    triggerCertificateShowcase: FunctionReference<
      "mutation",
      "internal",
      { certificateId: string; courseName: string; userId: string },
      any
    >;
    triggerExpertLevel: FunctionReference<
      "mutation",
      "internal",
      { level: number; totalXP: number; userId: string },
      any
    >;
    triggerFirstEnrollment: FunctionReference<
      "mutation",
      "internal",
      { courseId: Id<"courses">; userId: string },
      any
    >;
    triggerLessonsMilestone: FunctionReference<
      "mutation",
      "internal",
      { lessonCount: number; userId: string },
      any
    >;
    triggerShareProgress: FunctionReference<
      "mutation",
      "internal",
      { courseId: Id<"courses">; progressPercentage: number; userId: string },
      any
    >;
  };
  copyrightEmails: {
    sendClaimNoticeEmail: FunctionReference<
      "action",
      "internal",
      {
        claimId: string;
        claimantName: string;
        contentTitle: string;
        creatorEmail: string;
        creatorName: string;
      },
      { error?: string; success: boolean }
    >;
    sendClaimReceivedEmail: FunctionReference<
      "action",
      "internal",
      {
        claimId: string;
        claimantEmail: string;
        claimantName: string;
        contentTitle: string;
      },
      { error?: string; success: boolean }
    >;
    sendClaimResolvedEmail: FunctionReference<
      "action",
      "internal",
      {
        claimId: string;
        contentTitle: string;
        recipientEmail: string;
        recipientName: string;
        resolution: "upheld" | "dismissed" | "counter_notice_accepted";
        resolutionDetails: string;
      },
      { error?: string; success: boolean }
    >;
    sendStrikeEmail: FunctionReference<
      "action",
      "internal",
      {
        contentTitle: string;
        creatorEmail: string;
        creatorName: string;
        isSuspended: boolean;
        strikeNumber: number;
        totalStrikes: number;
      },
      { error?: string; success: boolean }
    >;
  };
  courseAccess: {
    checkCourseAccessInternal: FunctionReference<
      "query",
      "internal",
      { courseId: Id<"courses">; userId: string },
      any
    >;
  };
  courseCycleAI: {
    generateNurtureEmails: FunctionReference<
      "action",
      "internal",
      {
        courseCycleConfigId: Id<"courseCycleConfigs">;
        courseId: Id<"courses">;
        cycleNumber: number;
        emailCount: number;
      },
      boolean
    >;
    generatePitchEmails: FunctionReference<
      "action",
      "internal",
      {
        courseCycleConfigId: Id<"courseCycleConfigs">;
        courseId: Id<"courses">;
        cycleNumber: number;
        discountPercent?: number;
        emailCount: number;
      },
      boolean
    >;
  };
  courseCycles: {
    checkCoursePurchase: FunctionReference<
      "query",
      "internal",
      { courseId: Id<"courses">; customerEmail: string },
      boolean
    >;
    deleteEmailsForCycle: FunctionReference<
      "mutation",
      "internal",
      {
        courseCycleConfigId: Id<"courseCycleConfigs">;
        courseId: Id<"courses">;
        cycleNumber: number;
      },
      number
    >;
    getConfig: FunctionReference<
      "query",
      "internal",
      { configId: Id<"courseCycleConfigs"> },
      any
    >;
    getCourseContentForAI: FunctionReference<
      "query",
      "internal",
      { courseId: Id<"courses"> },
      any
    >;
    getCycleEmail: FunctionReference<
      "query",
      "internal",
      {
        courseCycleConfigId: Id<"courseCycleConfigs">;
        courseId: Id<"courses">;
        cycleNumber: number;
        emailIndex: number;
        emailType: "nurture" | "pitch";
      },
      any
    >;
    getUserPurchasedCourses: FunctionReference<
      "query",
      "internal",
      { courseIds: Array<Id<"courses">>; customerEmail: string },
      Array<string>
    >;
    saveCycleEmail: FunctionReference<
      "mutation",
      "internal",
      {
        courseCycleConfigId: Id<"courseCycleConfigs">;
        courseId: Id<"courses">;
        cycleNumber: number;
        emailIndex: number;
        emailType: "nurture" | "pitch";
        generatedFromLesson?: string;
        htmlContent: string;
        subject: string;
        textContent?: string;
      },
      Id<"courseCycleEmails">
    >;
    trackEmailClicked: FunctionReference<
      "mutation",
      "internal",
      { emailId: Id<"courseCycleEmails"> },
      null
    >;
    trackEmailOpened: FunctionReference<
      "mutation",
      "internal",
      { emailId: Id<"courseCycleEmails"> },
      null
    >;
    trackEmailSent: FunctionReference<
      "mutation",
      "internal",
      { emailId: Id<"courseCycleEmails"> },
      null
    >;
  };
  courseDrip: {
    getPendingDripUnlocks: FunctionReference<
      "query",
      "internal",
      { limit?: number },
      any
    >;
    onModuleCompleted: FunctionReference<
      "mutation",
      "internal",
      {
        courseId: Id<"courses">;
        moduleId: Id<"courseModules">;
        userId: string;
      },
      any
    >;
    processPendingDripUnlocks: FunctionReference<
      "mutation",
      "internal",
      {},
      any
    >;
    recalculateDripAccessForCourse: FunctionReference<
      "mutation",
      "internal",
      { courseId: string },
      any
    >;
    recalculateDripAccessForModule: FunctionReference<
      "mutation",
      "internal",
      { moduleId: Id<"courseModules"> },
      any
    >;
    sendDripUnlockNotification: FunctionReference<
      "mutation",
      "internal",
      {
        accessId: Id<"courseDripAccess">;
        courseId: Id<"courses">;
        moduleId: Id<"courseModules">;
        userId: string;
      },
      any
    >;
  };
  courseNotifications: {
    sendCourseUpdateEmails: FunctionReference<
      "action",
      "internal",
      {
        courseId: Id<"courses">;
        courseSlug: string;
        emailBody: string;
        emailPreview: string;
        emailSubject: string;
        studentIds: Array<string>;
      },
      { failed: number; sent: number; skipped: number }
    >;
  };
  courseProgress: {
    calculateCourseProgressInternal: FunctionReference<
      "query",
      "internal",
      { courseId: Id<"courses">; userId: string },
      any
    >;
    checkAndIssueCertificate: FunctionReference<
      "mutation",
      "internal",
      {
        completedChapters: number;
        courseId: Id<"courses">;
        totalChapters: number;
        totalTimeSpent?: number;
        userId: string;
      },
      any
    >;
    sendCompletionNotification: FunctionReference<
      "mutation",
      "internal",
      {
        certificateId: string;
        courseId: Id<"courses">;
        userId: string;
        verificationCode: string;
      },
      any
    >;
  };
  courseReviews: {
    getCourseAverageRating: FunctionReference<
      "query",
      "internal",
      { courseId: Id<"courses"> },
      any
    >;
  };
  courses: {
    getChapterByIdInternal: FunctionReference<
      "query",
      "internal",
      { chapterId: Id<"courseChapters"> },
      {
        _id: Id<"courseChapters">;
        description?: string;
        position: number;
        title: string;
      } | null
    >;
    getChaptersByLessonInternal: FunctionReference<
      "query",
      "internal",
      { lessonId: Id<"courseLessons"> },
      Array<{
        _id: Id<"courseChapters">;
        description?: string;
        position: number;
        title: string;
      }>
    >;
    getChaptersForLeadMagnet: FunctionReference<
      "query",
      "internal",
      { courseId: Id<"courses"> },
      Array<{
        _id: Id<"courseChapters">;
        description?: string;
        lessonId?: string;
        lessonTitle?: string;
        moduleTitle?: string;
        position: number;
        title: string;
      }>
    >;
    getCourseById: FunctionReference<
      "query",
      "internal",
      { courseId: Id<"courses"> },
      any | null
    >;
    getCourseForLeadMagnet: FunctionReference<
      "query",
      "internal",
      { courseId: Id<"courses"> },
      { _id: Id<"courses">; title: string } | null
    >;
    getLessonsByModuleInternal: FunctionReference<
      "query",
      "internal",
      { moduleId: Id<"courseModules"> },
      Array<{
        _id: Id<"courseLessons">;
        description?: string;
        position: number;
        title: string;
      }>
    >;
    getModulesByCourseInternal: FunctionReference<
      "query",
      "internal",
      { courseId: Id<"courses"> },
      Array<{
        _id: Id<"courseModules">;
        description?: string;
        position: number;
        title: string;
      }>
    >;
    updateChapterContentInternal: FunctionReference<
      "mutation",
      "internal",
      { chapterId: Id<"courseChapters">; description: string },
      null
    >;
    updateChapterDescription: FunctionReference<
      "mutation",
      "internal",
      { chapterId: Id<"courseChapters">; description: string },
      null
    >;
    updateCourseStripeIds: FunctionReference<
      "mutation",
      "internal",
      {
        courseId: Id<"courses">;
        stripePriceId: string;
        stripeProductId: string;
      },
      null
    >;
  };
  creditPackageQueries: {
    getAllCreditPackages: FunctionReference<
      "query",
      "internal",
      {},
      Array<any>
    >;
    getCreditPackageById: FunctionReference<
      "query",
      "internal",
      { packageId: Id<"creditPackages"> },
      any
    >;
    updatePackageStripeIds: FunctionReference<
      "mutation",
      "internal",
      {
        packageId: Id<"creditPackages">;
        stripePriceId: string;
        stripeProductId: string;
      },
      null
    >;
  };
  credits: {
    addCredits: FunctionReference<
      "mutation",
      "internal",
      {
        amount: number;
        description: string;
        metadata?: {
          dollarAmount?: number;
          packageName?: string;
          stripePaymentId?: string;
        };
        type: "purchase" | "bonus" | "earn" | "refund";
        userId: string;
      },
      {
        newBalance: number;
        success: boolean;
        transactionId: Id<"creditTransactions">;
      }
    >;
  };
  customDomains: {
    checkDomainAvailability: FunctionReference<
      "query",
      "internal",
      { domain: string; storeId: Id<"stores"> },
      { available: boolean }
    >;
    clearStoreDomain: FunctionReference<
      "mutation",
      "internal",
      { storeId: Id<"stores"> },
      null
    >;
    getStoreDomain: FunctionReference<
      "query",
      "internal",
      { storeId: Id<"stores"> },
      { customDomain?: string } | null
    >;
    updateDomainStatus: FunctionReference<
      "mutation",
      "internal",
      { status: string; storeId: Id<"stores"> },
      null
    >;
    updateStoreDomain: FunctionReference<
      "mutation",
      "internal",
      { domain: string; status: string; storeId: Id<"stores"> },
      null
    >;
  };
  directMessages: {
    getUserByClerkId: FunctionReference<
      "query",
      "internal",
      { clerkId: string },
      any
    >;
  };
  directMessagesActions: {
    sendNewMessageEmail: FunctionReference<
      "action",
      "internal",
      {
        conversationId: Id<"dmConversations">;
        messagePreview: string;
        recipientId: string;
        senderAvatar?: string;
        senderId: string;
        senderName: string;
      },
      { error?: string; success: boolean }
    >;
  };
  discord: {
    assignDiscordRoleInternal: FunctionReference<
      "action",
      "internal",
      { guildId: string; roleId: string; userId: string },
      { error?: string; success: boolean }
    >;
  };
  discordInternal: {
    addAssignedRole: FunctionReference<
      "mutation",
      "internal",
      { roleId: string; userId: string },
      null
    >;
    getDiscordConnectionInternal: FunctionReference<
      "query",
      "internal",
      { userId: string },
      { accessToken: string; discordUserId: string } | null
    >;
    getDiscordGuildInternal: FunctionReference<
      "query",
      "internal",
      { guildId: string },
      { botToken: string; courseRoles?: any } | null
    >;
    getStoreDiscordGuildInternal: FunctionReference<
      "query",
      "internal",
      { storeId: Id<"stores"> },
      { guildId: string; isActive: boolean } | null
    >;
    getUserEnrollments: FunctionReference<
      "query",
      "internal",
      { userId: string },
      Array<{ courseId: string }>
    >;
    logDiscordEvent: FunctionReference<
      "mutation",
      "internal",
      {
        discordUserId?: string;
        eventType:
          | "member_joined"
          | "member_left"
          | "role_assigned"
          | "role_removed"
          | "invite_created"
          | "sync_completed";
        guildId: string;
        metadata?: any;
        userId?: string;
      },
      null
    >;
    updateGuildMemberStatus: FunctionReference<
      "mutation",
      "internal",
      {
        status: "invited" | "joined" | "left" | "kicked" | "banned";
        userId: string;
      },
      null
    >;
    updateLastSynced: FunctionReference<
      "mutation",
      "internal",
      { userId: string },
      null
    >;
  };
  dripCampaignActions: {
    processDueDripEmails: FunctionReference<"action", "internal", {}, any>;
    sendDripEmail: FunctionReference<
      "action",
      "internal",
      {
        email: string;
        enrollmentId: Id<"dripCampaignEnrollments">;
        htmlContent: string;
        name: string;
        subject: string;
        textContent?: string;
      },
      any
    >;
    triggerCampaignsForEvent: FunctionReference<
      "action",
      "internal",
      {
        customerId?: string;
        email: string;
        metadata?: any;
        name?: string;
        storeId: string;
        triggerType: string;
      },
      any
    >;
  };
  dripCampaigns: {
    advanceEnrollment: FunctionReference<
      "mutation",
      "internal",
      { enrollmentId: Id<"dripCampaignEnrollments">; success: boolean },
      null
    >;
    enrollContactInternal: FunctionReference<
      "mutation",
      "internal",
      {
        campaignId: Id<"dripCampaigns">;
        customerId?: string;
        email: string;
        metadata?: any;
        name?: string;
      },
      Id<"dripCampaignEnrollments"> | null
    >;
    getActiveCampaignsByTrigger: FunctionReference<
      "query",
      "internal",
      { storeId: string; triggerType: string },
      Array<any>
    >;
    getCampaignInternal: FunctionReference<
      "query",
      "internal",
      { campaignId: Id<"dripCampaigns"> },
      any
    >;
    getDueEnrollments: FunctionReference<
      "query",
      "internal",
      { limit?: number },
      Array<any>
    >;
    recoverStuckEnrollments: FunctionReference<
      "mutation",
      "internal",
      {},
      number
    >;
  };
  emailABTesting: {
    calculateWinner: FunctionReference<
      "mutation",
      "internal",
      { testId: Id<"emailABTests"> },
      {
        confidenceLevel: number;
        isStatisticallySignificant: boolean;
        winner?: string;
      }
    >;
  };
  emailAnalyticsRollup: {
    dailyAnalyticsRollup: FunctionReference<"action", "internal", {}, null>;
    generateHealthAlerts: FunctionReference<
      "mutation",
      "internal",
      { date: string },
      null
    >;
    getDomains: FunctionReference<
      "mutation",
      "internal",
      {},
      Array<{ _id: Id<"emailDomains">; domain: string }>
    >;
    rollupCreatorStats: FunctionReference<
      "mutation",
      "internal",
      { date: string; domainId: Id<"emailDomains"> },
      null
    >;
    rollupDomainAnalytics: FunctionReference<
      "mutation",
      "internal",
      { date: string; domainId: Id<"emailDomains"> },
      null
    >;
    updateReputationScores: FunctionReference<"mutation", "internal", {}, null>;
  };
  emailContacts: {
    countContactsBatch: FunctionReference<
      "mutation",
      "internal",
      { cursor?: string; status: string; storeId: string },
      { count: number; done: boolean; nextCursor: string | null }
    >;
    deleteContactInternal: FunctionReference<
      "mutation",
      "internal",
      { contactId: Id<"emailContacts"> },
      null
    >;
    deleteContactsBatch: FunctionReference<
      "mutation",
      "internal",
      { contactIds: Array<Id<"emailContacts">> },
      { deleted: number; errors: number }
    >;
    importContactsBatchInternal: FunctionReference<
      "mutation",
      "internal",
      {
        contacts: Array<{
          email: string;
          firstName?: string;
          lastName?: string;
        }>;
        storeId: string;
      },
      { inserted: number }
    >;
    incrementContactStats: FunctionReference<
      "mutation",
      "internal",
      {
        count: number;
        status: "subscribed" | "unsubscribed" | "bounced" | "complained";
        storeId: string;
      },
      null
    >;
    recordEmailClicked: FunctionReference<
      "mutation",
      "internal",
      {
        campaignId?: Id<"dripCampaigns">;
        contactId: Id<"emailContacts">;
        linkClicked?: string;
      },
      null
    >;
    recordEmailOpened: FunctionReference<
      "mutation",
      "internal",
      { campaignId?: Id<"dripCampaigns">; contactId: Id<"emailContacts"> },
      null
    >;
    recordEmailSent: FunctionReference<
      "mutation",
      "internal",
      {
        campaignId?: Id<"dripCampaigns">;
        contactId: Id<"emailContacts">;
        emailSubject?: string;
      },
      null
    >;
    refreshContactStats: FunctionReference<
      "mutation",
      "internal",
      { storeId: string },
      null
    >;
    saveContactStats: FunctionReference<
      "mutation",
      "internal",
      {
        bouncedCount: number;
        complainedCount: number;
        storeId: string;
        subscribedCount: number;
        unsubscribedCount: number;
      },
      null
    >;
    scanContactEmails: FunctionReference<
      "query",
      "internal",
      { cursor?: string; storeId: string },
      { done: boolean; emails: Array<string>; nextCursor: string | null }
    >;
    scanContactsForDedup: FunctionReference<
      "query",
      "internal",
      { cursor?: string; storeId: string },
      {
        contacts: Array<{ createdAt: number; email: string; id: string }>;
        done: boolean;
        nextCursor: string | null;
      }
    >;
    upsertFromCustomer: FunctionReference<
      "mutation",
      "internal",
      {
        customerId?: Id<"customers">;
        email: string;
        firstName?: string;
        lastName?: string;
        source?: string;
        storeId: string;
      },
      Id<"emailContacts">
    >;
  };
  emailContactSync: {
    syncContactEngagement: FunctionReference<
      "mutation",
      "internal",
      {
        email: string;
        emailSubject?: string;
        eventType: "email_opened" | "email_clicked" | "email_bounced";
        linkUrl?: string;
        storeId: string;
      },
      { contactId: Id<"emailContacts"> | null; tagsAdded: Array<string> }
    >;
    syncContactFromEnrollment: FunctionReference<
      "mutation",
      "internal",
      {
        courseId: Id<"courses">;
        email: string;
        storeId: string;
        userId: string;
      },
      {
        contactId: Id<"emailContacts">;
        created: boolean;
        skillLevelUpdated: boolean;
        tagsAdded: Array<string>;
      }
    >;
    syncContactFromFollowGate: FunctionReference<
      "mutation",
      "internal",
      {
        email: string;
        name?: string;
        productId: Id<"digitalProducts">;
        storeId: string;
      },
      {
        contactId: Id<"emailContacts">;
        created: boolean;
        tagsAdded: Array<string>;
      }
    >;
    syncContactFromPurchase: FunctionReference<
      "mutation",
      "internal",
      {
        amount: number;
        courseId?: Id<"courses">;
        email: string;
        productId?: Id<"digitalProducts">;
        storeId: string;
        userId?: string;
      },
      {
        contactId: Id<"emailContacts">;
        created: boolean;
        tagsAdded: Array<string>;
      }
    >;
  };
  emailDeliverability: {
    updateDeliverabilityStats: FunctionReference<
      "mutation",
      "internal",
      { period: "daily" | "weekly" | "monthly"; storeId: string },
      any
    >;
  };
  emailHealthMonitoring: {
    calculateEmailHealthMetrics: FunctionReference<
      "mutation",
      "internal",
      { connectionId?: Id<"resendConnections"> },
      { metrics: any; success: boolean }
    >;
  };
  emailLeadScoring: {
    applyScoreDecay: FunctionReference<
      "mutation",
      "internal",
      {},
      { decayed: number; processed: number }
    >;
  };
  emailQueries: {
    checkEmailCampaignRecipients: FunctionReference<
      "query",
      "internal",
      { campaignId: Id<"resendCampaigns"> | Id<"emailCampaigns"> },
      boolean
    >;
    deleteLog: FunctionReference<
      "mutation",
      "internal",
      { logId: Id<"resendLogs"> },
      any
    >;
    getActiveAutomations: FunctionReference<"query", "internal", {}, any>;
    getAdminConnectionInternal: FunctionReference<"query", "internal", {}, any>;
    getCampaignById: FunctionReference<
      "query",
      "internal",
      { campaignId: Id<"resendCampaigns"> | Id<"emailCampaigns"> },
      any
    >;
    getCampaignRecipients: FunctionReference<
      "query",
      "internal",
      {
        batchSize?: number;
        campaignId: Id<"resendCampaigns"> | Id<"emailCampaigns">;
        cursor?: string;
      },
      any
    >;
    getConnectionById: FunctionReference<
      "query",
      "internal",
      { connectionId: Id<"resendConnections"> },
      any
    >;
    getContactsByIds: FunctionReference<
      "mutation",
      "internal",
      { contactIds: Array<Id<"emailContacts">> },
      any
    >;
    getEmailsNeedingSync: FunctionReference<
      "query",
      "internal",
      { limit?: number },
      any
    >;
    getOldLogs: FunctionReference<
      "query",
      "internal",
      { cutoffTime: number },
      any
    >;
    getScheduledCampaigns: FunctionReference<
      "query",
      "internal",
      { beforeTimestamp: number },
      any
    >;
    getTemplateById: FunctionReference<
      "query",
      "internal",
      { templateId: Id<"resendTemplates"> },
      any
    >;
    getUserDigestData: FunctionReference<
      "query",
      "internal",
      { userId: string },
      any
    >;
    getUsersForWeeklyDigest: FunctionReference<"query", "internal", {}, any>;
    incrementCampaignMetric: FunctionReference<
      "mutation",
      "internal",
      {
        campaignId: Id<"resendCampaigns">;
        metric:
          | "delivered"
          | "opened"
          | "clicked"
          | "bounced"
          | "complained"
          | "failed";
      },
      any
    >;
    incrementContactEmailsSent: FunctionReference<
      "mutation",
      "internal",
      { contactId: Id<"emailContacts"> },
      any
    >;
    logEmail: FunctionReference<
      "mutation",
      "internal",
      {
        automationId?: Id<"resendAutomations">;
        campaignId?: Id<"resendCampaigns">;
        connectionId: Id<"resendConnections">;
        errorMessage?: string;
        fromEmail: string;
        fromName: string;
        recipientEmail: string;
        recipientName?: string;
        recipientUserId?: string;
        resendEmailId?: string;
        status:
          | "pending"
          | "sent"
          | "delivered"
          | "opened"
          | "clicked"
          | "bounced"
          | "complained"
          | "failed";
        subject: string;
        templateId?: Id<"resendTemplates">;
      },
      any
    >;
    markDigestSent: FunctionReference<
      "mutation",
      "internal",
      { emailLogId: Id<"resendLogs">; userId: string },
      any
    >;
    saveAdminResendConnection: FunctionReference<
      "mutation",
      "internal",
      {
        encryptedApiKey: string;
        fromEmail: string;
        fromName: string;
        replyToEmail?: string;
        userId: string;
      },
      any
    >;
    saveStoreResendConnection: FunctionReference<
      "mutation",
      "internal",
      {
        encryptedApiKey: string;
        fromEmail: string;
        fromName: string;
        replyToEmail?: string;
        storeId: Id<"stores">;
        userId: string;
      },
      any
    >;
    updateCampaignMetrics: FunctionReference<
      "mutation",
      "internal",
      {
        campaignId: Id<"resendCampaigns"> | Id<"emailCampaigns">;
        recipientCount?: number;
        sentCount?: number;
      },
      any
    >;
    updateCampaignStatus: FunctionReference<
      "mutation",
      "internal",
      {
        campaignId: Id<"resendCampaigns"> | Id<"emailCampaigns">;
        sentAt?: number;
        status: "draft" | "scheduled" | "sending" | "sent" | "failed";
      },
      any
    >;
    updateConnectionApiKey: FunctionReference<
      "mutation",
      "internal",
      { connectionId: Id<"resendConnections">; encryptedApiKey: string },
      any
    >;
    updateDomainVerification: FunctionReference<
      "mutation",
      "internal",
      {
        connectionId: Id<"resendConnections">;
        dnsRecords?: {
          dkim: { record: string; valid: boolean };
          dmarc?: { record: string; valid: boolean };
          spf: { record: string; valid: boolean };
        };
        status: "verified" | "pending" | "failed" | "not_verified";
      },
      any
    >;
    updateEmailStatusFromSync: FunctionReference<
      "mutation",
      "internal",
      {
        bounceReason?: string;
        bouncedAt?: number;
        deliveredAt?: number;
        emailLogId: Id<"resendLogs">;
        status: "sent" | "delivered" | "bounced" | "failed";
      },
      any
    >;
    updateRecipientStatus: FunctionReference<
      "mutation",
      "internal",
      {
        recipientId: Id<"emailCampaignRecipients">;
        status:
          | "queued"
          | "sent"
          | "delivered"
          | "opened"
          | "clicked"
          | "bounced"
          | "failed";
      },
      any
    >;
  };
  emails: {
    getDecryptedApiKey: FunctionReference<
      "action",
      "internal",
      { connectionId: Id<"resendConnections"> },
      string
    >;
    migrateApiKeysToEncrypted: FunctionReference<"action", "internal", {}, any>;
    processCampaign: FunctionReference<
      "action",
      "internal",
      { campaignId: Id<"resendCampaigns"> | Id<"emailCampaigns"> },
      any
    >;
    sendCampaignBatch: FunctionReference<
      "action",
      "internal",
      {
        campaignId: Id<"resendCampaigns"> | Id<"emailCampaigns">;
        recipients: any;
      },
      any
    >;
  };
  emailSegmentation: {
    refreshAllDynamicSegments: FunctionReference<
      "mutation",
      "internal",
      {},
      { processed: number; updated: number }
    >;
    updateSegmentMembers: FunctionReference<
      "mutation",
      "internal",
      { segmentId: Id<"emailSegments"> },
      { memberCount: number; updated: boolean }
    >;
  };
  emailUnsubscribe: {
    checkSuppressionBatch: FunctionReference<
      "query",
      "internal",
      { emails: Array<string> },
      Array<{ email: string; reason?: string; suppressed: boolean }>
    >;
    markBounced: FunctionReference<
      "mutation",
      "internal",
      { bounceType?: string; email: string },
      null
    >;
    markComplained: FunctionReference<
      "mutation",
      "internal",
      { email: string },
      null
    >;
  };
  emailUserStats: {
    getPlatformStatsForEmail: FunctionReference<"query", "internal", {}, any>;
    getUserStatsBatch: FunctionReference<
      "query",
      "internal",
      { userIds: Array<string> },
      any
    >;
    getUserStatsForEmailByEmail: FunctionReference<
      "query",
      "internal",
      { email: string },
      null | any
    >;
    internalGetUserStatsForEmail: FunctionReference<
      "query",
      "internal",
      { userId: string },
      null | any
    >;
  };
  emailWorkflowABTesting: {
    calculateWinner: FunctionReference<
      "mutation",
      "internal",
      { testId: Id<"workflowNodeABTests"> },
      { confidence: number; winner: null | string }
    >;
  };
  emailWorkflowActions: {
    executeWorkflowNode: FunctionReference<
      "action",
      "internal",
      { executionId: Id<"workflowExecutions"> },
      null
    >;
    processEmailWorkflowExecutions: FunctionReference<
      "action",
      "internal",
      {},
      null
    >;
    sendCustomWorkflowEmail: FunctionReference<
      "action",
      "internal",
      {
        contactId?: Id<"emailContacts">;
        content: string;
        customerEmail: string;
        storeId: string;
        subject: string;
      },
      null
    >;
    sendTeamNotification: FunctionReference<
      "action",
      "internal",
      {
        contactEmail: string;
        contactName?: string;
        message: string;
        notifyMethod: string;
        storeId: string;
        triggerType?: string;
        workflowName: string;
      },
      null
    >;
    sendWorkflowEmail: FunctionReference<
      "action",
      "internal",
      {
        contactId?: Id<"emailContacts">;
        customerEmail: string;
        storeId: string;
        templateId: Id<"emailTemplates">;
      },
      null
    >;
  };
  emailWorkflows: {
    addTagByName: FunctionReference<
      "mutation",
      "internal",
      { contactId: Id<"emailContacts">; storeId: string; tagName: string },
      null
    >;
    addTagToContactInternal: FunctionReference<
      "mutation",
      "internal",
      { contactId: Id<"emailContacts">; tagId: Id<"emailTags"> },
      null
    >;
    advanceExecution: FunctionReference<
      "mutation",
      "internal",
      {
        executionId: Id<"workflowExecutions">;
        nextNodeId: string;
        scheduledFor: number;
      },
      null
    >;
    callWebhook: FunctionReference<
      "action",
      "internal",
      { payload: any; url: string },
      { error?: string; status?: number; success: boolean }
    >;
    checkGoalAchieved: FunctionReference<
      "query",
      "internal",
      { contactId?: Id<"emailContacts">; goalType?: string; goalValue?: any },
      boolean
    >;
    completeExecution: FunctionReference<
      "mutation",
      "internal",
      { executionId: Id<"workflowExecutions"> },
      null
    >;
    createTagInternal: FunctionReference<
      "mutation",
      "internal",
      { name: string; storeId: string },
      Id<"emailTags">
    >;
    enrollContactBatchInternal: FunctionReference<
      "mutation",
      "internal",
      {
        contactIds: Array<Id<"emailContacts">>;
        workflowId: Id<"emailWorkflows">;
      },
      { enrolled: number; skipped: number }
    >;
    evaluateCondition: FunctionReference<
      "query",
      "internal",
      { condition?: any; contactId?: Id<"emailContacts"> },
      boolean
    >;
    evaluateWorkflowCondition: FunctionReference<
      "query",
      "internal",
      {
        conditionData?: any;
        conditionType?: string;
        contactId?: Id<"emailContacts">;
        customerEmail: string;
        storeId: string;
      },
      boolean
    >;
    getActiveExecutionEmails: FunctionReference<
      "query",
      "internal",
      { workflowId: Id<"emailWorkflows"> },
      Array<string>
    >;
    getContactIdsBatch: FunctionReference<
      "query",
      "internal",
      {
        cursor?: string;
        limit: number;
        noTags?: boolean;
        storeId: string;
        tagId?: Id<"emailTags">;
      },
      { contactIds: Array<string>; hasMore: boolean; nextCursor: string | null }
    >;
    getContactInternal: FunctionReference<
      "query",
      "internal",
      { contactId: Id<"emailContacts"> },
      any
    >;
    getDueExecutions: FunctionReference<"query", "internal", {}, Array<any>>;
    getEmailTemplateInternal: FunctionReference<
      "query",
      "internal",
      { templateId: Id<"emailTemplates"> },
      any
    >;
    getExecutionInternal: FunctionReference<
      "query",
      "internal",
      { executionId: Id<"workflowExecutions"> },
      any
    >;
    getStoreByClerkId: FunctionReference<
      "query",
      "internal",
      { userId: string },
      any
    >;
    getTagByNameInternal: FunctionReference<
      "query",
      "internal",
      { name: string; storeId: string },
      any
    >;
    getWorkflowInternal: FunctionReference<
      "query",
      "internal",
      { workflowId: Id<"emailWorkflows"> },
      any
    >;
    markExecutionFailed: FunctionReference<
      "mutation",
      "internal",
      { error: string; executionId: Id<"workflowExecutions"> },
      null
    >;
    processScheduledExecutions: FunctionReference<
      "mutation",
      "internal",
      {},
      null
    >;
    removeTagFromContactInternal: FunctionReference<
      "mutation",
      "internal",
      { contactId: Id<"emailContacts">; tagId: Id<"emailTags"> },
      null
    >;
    trackABTestResult: FunctionReference<
      "mutation",
      "internal",
      {
        contactId?: Id<"emailContacts">;
        eventType?: "sent" | "delivered" | "opened" | "clicked";
        nodeId: string;
        variant: "A" | "B";
        workflowId: Id<"emailWorkflows">;
      },
      null
    >;
    triggerAdminCourseCompleteWorkflows: FunctionReference<
      "mutation",
      "internal",
      {
        courseId: string;
        courseName?: string;
        instructorId?: string;
        userEmail: string;
        userId: string;
        userName?: string;
      },
      null
    >;
    triggerAdminNewSignupWorkflows: FunctionReference<
      "mutation",
      "internal",
      { userEmail: string; userId: string; userName?: string },
      null
    >;
    triggerAdminPurchaseWorkflows: FunctionReference<
      "mutation",
      "internal",
      {
        amount?: number;
        courseId?: string;
        courseName?: string;
        creatorStoreId?: string;
        productId?: string;
        productName?: string;
        productType?: string;
        userEmail: string;
        userId: string;
        userName?: string;
      },
      null
    >;
    triggerLeadSignupWorkflows: FunctionReference<
      "mutation",
      "internal",
      {
        customerEmail: string;
        customerName?: string;
        productId?: string;
        productName?: string;
        source?: string;
        storeId: string;
      },
      null
    >;
    triggerProductPurchaseWorkflows: FunctionReference<
      "mutation",
      "internal",
      {
        amount?: number;
        courseId?: string;
        courseName?: string;
        customerEmail: string;
        customerName?: string;
        orderId?: string;
        productId?: string;
        productName?: string;
        productType?: string;
        storeId: string;
      },
      null
    >;
    triggerTagAddedWorkflows: FunctionReference<
      "mutation",
      "internal",
      {
        contactId: Id<"emailContacts">;
        storeId: string;
        tagId: Id<"emailTags">;
        tagName: string;
      },
      null
    >;
    updateExecutionData: FunctionReference<
      "mutation",
      "internal",
      { executionData: any; executionId: Id<"workflowExecutions"> },
      null
    >;
    updateWorkflowStats: FunctionReference<
      "mutation",
      "internal",
      { enrolledCount: number; workflowId: Id<"emailWorkflows"> },
      null
    >;
  };
  embeddings: {
    checkExistingEmbeddings: FunctionReference<
      "query",
      "internal",
      {
        sourceId: string;
        sourceType:
          | "course"
          | "chapter"
          | "lesson"
          | "document"
          | "note"
          | "custom";
      },
      number
    >;
    countEmbeddingsBatch: FunctionReference<
      "query",
      "internal",
      {
        batchSize?: number;
        cursor: string | null;
        sourceType:
          | "course"
          | "chapter"
          | "lesson"
          | "document"
          | "note"
          | "custom";
      },
      {
        count: number;
        isDone: boolean;
        nextCursor: string | null;
        products: number;
        webResearch: number;
      }
    >;
    countTableDocuments: FunctionReference<
      "query",
      "internal",
      {
        tableName:
          | "courses"
          | "courseChapters"
          | "courseLessons"
          | "digitalProducts"
          | "notes";
      },
      number
    >;
    countTableDocumentsBatch: FunctionReference<
      "query",
      "internal",
      {
        batchSize?: number;
        cursor: string | null;
        tableName:
          | "courses"
          | "courseChapters"
          | "courseLessons"
          | "digitalProducts"
          | "notes";
      },
      { count: number; isDone: boolean; nextCursor: string | null }
    >;
    deleteEmbeddingsBatch: FunctionReference<
      "mutation",
      "internal",
      { batchSize?: number },
      { deleted: number; hasMore: boolean }
    >;
    deleteEmbeddingsBySource: FunctionReference<
      "mutation",
      "internal",
      {
        sourceId: string;
        sourceType:
          | "course"
          | "chapter"
          | "lesson"
          | "document"
          | "note"
          | "custom";
      },
      null
    >;
    getAllCourses: FunctionReference<
      "query",
      "internal",
      {},
      Array<{
        _creationTime: number;
        _id: Id<"courses">;
        acceptsPayPal?: boolean;
        acceptsStripe?: boolean;
        category?: string;
        checkoutDescription?: string;
        checkoutHeadline?: string;
        courseCategoryId?: string;
        description?: string;
        guaranteeText?: string;
        imageUrl?: string;
        instructorId?: string;
        isPublished?: boolean;
        paymentDescription?: string;
        price?: number;
        showGuarantee?: boolean;
        skillLevel?: string;
        slug?: string;
        storeId?: string;
        stripePriceId?: string;
        stripeProductId?: string;
        subcategory?: string;
        tags?: Array<string>;
        title: string;
        userId: string;
      }>
    >;
    getAllDigitalProducts: FunctionReference<"query", "internal", {}, any>;
    getAllNotes: FunctionReference<"query", "internal", {}, any>;
    getCourseChapters: FunctionReference<
      "query",
      "internal",
      { courseId: Id<"courses"> },
      Array<{
        _creationTime: number;
        _id: Id<"courseChapters">;
        audioGeneratedAt?: number;
        audioGenerationError?: string;
        audioGenerationStatus?:
          | "pending"
          | "generating"
          | "completed"
          | "failed";
        audioUrl?: string;
        courseId: string;
        description?: string;
        generatedAudioUrl?: string;
        generatedVideoUrl?: string;
        isFree?: boolean;
        isPublished?: boolean;
        lessonId?: string;
        position: number;
        title: string;
        videoGeneratedAt?: number;
        videoGenerationError?: string;
        videoGenerationStatus?:
          | "pending"
          | "generating"
          | "completed"
          | "failed";
        videoUrl?: string;
      }>
    >;
    getCourseModules: FunctionReference<
      "query",
      "internal",
      { courseId: Id<"courses"> },
      any
    >;
    getModuleLessons: FunctionReference<
      "query",
      "internal",
      { moduleId: string },
      any
    >;
  };
  fanCountAggregation: {
    countAllFans: FunctionReference<
      "query",
      "internal",
      { storeId: string },
      { leads: number; paying: number; subscriptions: number; total: number }
    >;
    countFansBatch: FunctionReference<
      "query",
      "internal",
      { cursor: string | null; storeId: string },
      {
        continueCursor: string;
        count: number;
        isDone: boolean;
        leads: number;
        paying: number;
        subscriptions: number;
      }
    >;
    getAllStoreIds: FunctionReference<"query", "internal", {}, Array<string>>;
    storeFanCounts: FunctionReference<
      "mutation",
      "internal",
      {
        leads: number;
        paying: number;
        storeId: string;
        subscriptions: number;
        totalCount: number;
      },
      null
    >;
    updateAllStoreFanCounts: FunctionReference<"action", "internal", {}, null>;
  };
  generatedScripts: {
    createGeneratedScript: FunctionReference<
      "mutation",
      "internal",
      {
        accountMatchScore?: number;
        chapterId: Id<"courseChapters">;
        chapterPosition: number;
        chapterTitle: string;
        combinedScript: string;
        courseId: Id<"courses">;
        courseTitle: string;
        generationBatchId?: string;
        instagramScript: string;
        lessonId?: string;
        moduleId?: string;
        sourceContentSnippet: string;
        storeId: string;
        suggestedAccountProfileId?: Id<"socialAccountProfiles">;
        suggestedCta?: string;
        suggestedKeyword?: string;
        tiktokScript: string;
        topicMatch?: Array<string>;
        userId: string;
        viralityAnalysis: {
          educationalValue: number;
          engagementPotential: number;
          reasoning: string;
          trendAlignment: number;
        };
        viralityScore: number;
        youtubeScript: string;
      },
      any
    >;
  };
  inboxActions: {
    sendReplyEmail: FunctionReference<
      "action",
      "internal",
      { message: string; replyId: Id<"emailReplies"> },
      null
    >;
  };
  inboxHelpers: {
    findCustomerByEmail: FunctionReference<
      "mutation",
      "internal",
      { email: string },
      null | { storeId?: Id<"stores"> }
    >;
    findEmailByMessageId: FunctionReference<
      "mutation",
      "internal",
      { messageId: string },
      null | { campaignId?: Id<"resendCampaigns">; storeId?: Id<"stores"> }
    >;
    findStoreInSubject: FunctionReference<
      "mutation",
      "internal",
      { subject: string },
      null | { storeId: Id<"stores"> }
    >;
    getReplyById: FunctionReference<
      "mutation",
      "internal",
      { replyId: Id<"emailReplies"> },
      null | { fromEmail: string; inReplyTo?: string; subject: string }
    >;
    logMatchAttempt: FunctionReference<
      "mutation",
      "internal",
      {
        confidence: string;
        matched: boolean;
        replyId: Id<"emailReplies">;
        storeId?: Id<"stores">;
        strategy: string;
      },
      null
    >;
    updateReplyMatch: FunctionReference<
      "mutation",
      "internal",
      {
        campaignId?: Id<"resendCampaigns">;
        confidence: "high" | "medium" | "low";
        replyId: Id<"emailReplies">;
        storeId: Id<"stores">;
      },
      null
    >;
  };
  inboxSync: {
    fetchInboxReplies: FunctionReference<
      "action",
      "internal",
      {},
      { failed: number; fetched: number; matched: number }
    >;
    matchReplyToCreator: FunctionReference<
      "action",
      "internal",
      { replyId: Id<"emailReplies"> },
      { confidence: string; matched: boolean; storeId?: Id<"stores"> }
    >;
  };
  integrations: {
    instagram: {
      refreshAccessToken: FunctionReference<
        "action",
        "internal",
        { userId: Id<"users"> },
        null
      >;
    };
    internal: {
      getIntegration: FunctionReference<
        "query",
        "internal",
        { userId: Id<"users"> },
        any | null
      >;
      saveIntegration: FunctionReference<
        "mutation",
        "internal",
        {
          expiresAt: number;
          instagramId: string;
          profilePictureUrl?: string;
          token: string;
          userId: Id<"users">;
          username: string;
        },
        null
      >;
      updateToken: FunctionReference<
        "mutation",
        "internal",
        { expiresAt: number; token: string; userId: Id<"users"> },
        null
      >;
    };
  };
  langchainNotes: {
    deleteNoteSource: FunctionReference<
      "mutation",
      "internal",
      { sourceId: Id<"noteSources"> },
      null
    >;
    getSource: FunctionReference<
      "query",
      "internal",
      { sourceId: Id<"noteSources"> },
      {
        _creationTime: number;
        _id: Id<"noteSources">;
        contentChunks?: Array<string>;
        createdAt: number;
        errorMessage?: string;
        fileName?: string;
        fileSize?: number;
        generatedNoteIds?: Array<Id<"notes">>;
        keyPoints?: Array<string>;
        processedAt?: number;
        rawContent?: string;
        sourceType: "pdf" | "youtube" | "website" | "audio" | "text";
        status: "pending" | "processing" | "completed" | "failed";
        storageId?: Id<"_storage">;
        storeId: string;
        summary?: string;
        tags?: Array<string>;
        title: string;
        url?: string;
        userId: string;
        websiteAuthor?: string;
        websiteDomain?: string;
        websitePublishedDate?: string;
        youtubeChannel?: string;
        youtubeDuration?: number;
        youtubeThumbnail?: string;
        youtubeVideoId?: string;
      } | null
    >;
    getSourcesByUser: FunctionReference<
      "query",
      "internal",
      {
        limit?: number;
        sourceType?: "pdf" | "youtube" | "website" | "audio" | "text";
        storeId: string;
        userId: string;
      },
      Array<{
        _creationTime: number;
        _id: Id<"noteSources">;
        createdAt: number;
        fileName?: string;
        generatedNoteIds?: Array<Id<"notes">>;
        processedAt?: number;
        sourceType: "pdf" | "youtube" | "website" | "audio" | "text";
        status: "pending" | "processing" | "completed" | "failed";
        storeId: string;
        summary?: string;
        title: string;
        url?: string;
        userId: string;
      }>
    >;
    insertNoteSource: FunctionReference<
      "mutation",
      "internal",
      {
        fileName?: string;
        fileSize?: number;
        rawContent?: string;
        sourceType: "pdf" | "youtube" | "website" | "audio" | "text";
        storageId?: Id<"_storage">;
        storeId: string;
        tags?: Array<string>;
        title: string;
        url?: string;
        userId: string;
      },
      Id<"noteSources">
    >;
    updateSourceContent: FunctionReference<
      "mutation",
      "internal",
      {
        contentChunks: Array<string>;
        rawContent: string;
        sourceId: Id<"noteSources">;
        status: "pending" | "processing" | "completed" | "failed";
        title?: string;
        websiteAuthor?: string;
        websiteDomain?: string;
        websitePublishedDate?: string;
        youtubeChannel?: string;
        youtubeDuration?: number;
        youtubeThumbnail?: string;
        youtubeVideoId?: string;
      },
      null
    >;
    updateSourceStatus: FunctionReference<
      "mutation",
      "internal",
      {
        errorMessage?: string;
        sourceId: Id<"noteSources">;
        status: "pending" | "processing" | "completed" | "failed";
      },
      null
    >;
    updateSourceSummary: FunctionReference<
      "mutation",
      "internal",
      {
        generatedNoteId: Id<"notes">;
        keyPoints: Array<string>;
        sourceId: Id<"noteSources">;
        summary: string;
      },
      null
    >;
  };
  langchainNotesActions: {
    extractPdfContent: FunctionReference<
      "action",
      "internal",
      { pdfUrl: string; sourceId: Id<"noteSources"> },
      null
    >;
    extractWebsiteContent: FunctionReference<
      "action",
      "internal",
      { sourceId: Id<"noteSources">; websiteUrl: string },
      null
    >;
    extractYoutubeTranscript: FunctionReference<
      "action",
      "internal",
      { sourceId: Id<"noteSources">; videoUrl: string },
      null
    >;
  };
  leadScoring: {
    _rebuildSummaryBatch: FunctionReference<
      "mutation",
      "internal",
      {
        coldCount: number;
        cursor: string | null;
        hotCount: number;
        inactiveCount: number;
        needsAttentionCount: number;
        scoreBuckets: Array<number>;
        storeId: string;
        totalScore: number;
        totalSubscribed: number;
        warmCount: number;
      },
      any
    >;
    _recalculateScoresBatch: FunctionReference<
      "mutation",
      "internal",
      {
        coldCount: number;
        cursor: string | null;
        hotCount: number;
        inactiveCount: number;
        needsAttentionCount: number;
        scoreBuckets: Array<number>;
        storeId: string;
        total: number;
        totalScore: number;
        totalSubscribed: number;
        updated: number;
        warmCount: number;
      },
      any
    >;
    updateContactScore: FunctionReference<
      "mutation",
      "internal",
      { contactId: Id<"emailContacts">; pointsDelta: number; reason: string },
      any
    >;
  };
  lib: {
    emailDripWorkflow: {
      abTestWorkflow: FunctionReference<"mutation", "internal", any, any>;
      emailDripWorkflow: FunctionReference<"mutation", "internal", any, any>;
    };
  };
  liveViewers: {
    cleanupExpiredViewers: FunctionReference<"mutation", "internal", {}, any>;
  };
  masterAI: {
    critic: {
      reviewContent: FunctionReference<
        "action",
        "internal",
        {
          ideaGeneratorOutput?: {
            crossFacetInsights: Array<string>;
            ideas: Array<{
              confidence: "supported" | "extrapolated" | "experimental";
              description: string;
              relatedFacets: Array<string>;
              risk?: string;
              technique: string;
            }>;
          };
          originalQuestion: string;
          settings: {
            autoSaveWebResearch: boolean;
            chunksPerFacet: number;
            customModels?: {
              critic?:
                | "gpt-4o"
                | "gpt-4o-mini"
                | "o1"
                | "o1-mini"
                | "gpt-5-mini"
                | "gpt-oss-120b"
                | "claude-4.5-sonnet"
                | "claude-4.5-opus"
                | "claude-4-sonnet"
                | "claude-3.5-sonnet"
                | "claude-3.5-haiku"
                | "gemini-3-pro"
                | "gemini-2.5-flash"
                | "gemini-2.5-flash-lite"
                | "gemini-2.5-pro"
                | "gemini-2.0-flash"
                | "deepseek-chat"
                | "deepseek-r1"
                | "grok-code-fast"
                | "grok-4-fast"
                | "llama-3.3-70b"
                | "qwen-2.5-72b";
              finalWriter?:
                | "gpt-4o"
                | "gpt-4o-mini"
                | "o1"
                | "o1-mini"
                | "gpt-5-mini"
                | "gpt-oss-120b"
                | "claude-4.5-sonnet"
                | "claude-4.5-opus"
                | "claude-4-sonnet"
                | "claude-3.5-sonnet"
                | "claude-3.5-haiku"
                | "gemini-3-pro"
                | "gemini-2.5-flash"
                | "gemini-2.5-flash-lite"
                | "gemini-2.5-pro"
                | "gemini-2.0-flash"
                | "deepseek-chat"
                | "deepseek-r1"
                | "grok-code-fast"
                | "grok-4-fast"
                | "llama-3.3-70b"
                | "qwen-2.5-72b";
              ideaGenerator?:
                | "gpt-4o"
                | "gpt-4o-mini"
                | "o1"
                | "o1-mini"
                | "gpt-5-mini"
                | "gpt-oss-120b"
                | "claude-4.5-sonnet"
                | "claude-4.5-opus"
                | "claude-4-sonnet"
                | "claude-3.5-sonnet"
                | "claude-3.5-haiku"
                | "gemini-3-pro"
                | "gemini-2.5-flash"
                | "gemini-2.5-flash-lite"
                | "gemini-2.5-pro"
                | "gemini-2.0-flash"
                | "deepseek-chat"
                | "deepseek-r1"
                | "grok-code-fast"
                | "grok-4-fast"
                | "llama-3.3-70b"
                | "qwen-2.5-72b";
              planner?:
                | "gpt-4o"
                | "gpt-4o-mini"
                | "o1"
                | "o1-mini"
                | "gpt-5-mini"
                | "gpt-oss-120b"
                | "claude-4.5-sonnet"
                | "claude-4.5-opus"
                | "claude-4-sonnet"
                | "claude-3.5-sonnet"
                | "claude-3.5-haiku"
                | "gemini-3-pro"
                | "gemini-2.5-flash"
                | "gemini-2.5-flash-lite"
                | "gemini-2.5-pro"
                | "gemini-2.0-flash"
                | "deepseek-chat"
                | "deepseek-r1"
                | "grok-code-fast"
                | "grok-4-fast"
                | "llama-3.3-70b"
                | "qwen-2.5-72b";
              summarizer?:
                | "gpt-4o"
                | "gpt-4o-mini"
                | "o1"
                | "o1-mini"
                | "gpt-5-mini"
                | "gpt-oss-120b"
                | "claude-4.5-sonnet"
                | "claude-4.5-opus"
                | "claude-4-sonnet"
                | "claude-3.5-sonnet"
                | "claude-3.5-haiku"
                | "gemini-3-pro"
                | "gemini-2.5-flash"
                | "gemini-2.5-flash-lite"
                | "gemini-2.5-pro"
                | "gemini-2.0-flash"
                | "deepseek-chat"
                | "deepseek-r1"
                | "grok-code-fast"
                | "grok-4-fast"
                | "llama-3.3-70b"
                | "qwen-2.5-72b";
            };
            enableCreativeMode: boolean;
            enableCritic: boolean;
            enableFactVerification: boolean;
            enableWebResearch: boolean;
            maxFacets: number;
            maxRetries?: number;
            preset:
              | "budget"
              | "speed"
              | "balanced"
              | "deepReasoning"
              | "premium";
            qualityThreshold?: number;
            responseStyle:
              | "structured"
              | "conversational"
              | "concise"
              | "educational";
            similarityThreshold: number;
            sourceTypes?: Array<
              "course" | "chapter" | "lesson" | "document" | "note" | "custom"
            >;
            webSearchMaxResults?: number;
          };
          summarizerOutput: {
            summaries: Array<{
              confidence: number;
              facetName: string;
              keyTechniques: Array<string>;
              sourceChunkIds: Array<string>;
              summary: string;
            }>;
          };
        },
        {
          approved: boolean;
          ideasToExclude: Array<string>;
          ideasToInclude: Array<string>;
          issues: Array<{
            description: string;
            severity: "low" | "medium" | "high";
            suggestion?: string;
            type: "contradiction" | "gap" | "inaccuracy" | "style";
          }>;
          overallQuality: number;
          recommendations: Array<string>;
        }
      >;
    };
    factVerifier: {
      extractClaims: FunctionReference<
        "action",
        "internal",
        { content: string; maxClaims?: number },
        Array<string>
      >;
      verifyFacts: FunctionReference<
        "action",
        "internal",
        {
          claims: Array<string>;
          summaries: Array<{
            facetName: string;
            keyPoints: Array<string>;
            sourceChunkIds: Array<string>;
            summary: string;
          }>;
          webResearch?: Array<{
            facetName: string;
            results: Array<{
              content: string;
              score: number;
              title: string;
              url: string;
            }>;
            searchQuery: string;
          }>;
        },
        {
          overallConfidence: number;
          suggestedCorrections: Array<{
            correction: string;
            originalClaim: string;
            reason: string;
          }>;
          verifiedClaims: Array<{
            claim: string;
            confidence: number;
            conflictingInfo?: string;
            status:
              | "verified"
              | "partially_verified"
              | "unverified"
              | "conflicting"
              | "extrapolated";
            supportingSources: Array<{
              excerpt?: string;
              title: string;
              type: "embedding" | "web";
            }>;
          }>;
        }
      >;
    };
    finalWriter: {
      generateFinalResponse: FunctionReference<
        "action",
        "internal",
        {
          conversationContext?: Array<{
            content: string;
            role: "user" | "assistant";
          }>;
          conversationGoal?: {
            deliverableType?: string;
            extractedAt: number;
            keyConstraints?: Array<string>;
            originalIntent: string;
          };
          criticOutput?: {
            approved: boolean;
            ideasToExclude: Array<string>;
            ideasToInclude: Array<string>;
            issues: Array<{
              description: string;
              severity: "low" | "medium" | "high";
              suggestion?: string;
              type: "contradiction" | "gap" | "inaccuracy" | "style";
            }>;
            overallQuality: number;
            recommendations: Array<string>;
          };
          factVerification?: {
            overallConfidence: number;
            suggestedCorrections: Array<{
              correction: string;
              originalClaim: string;
              reason: string;
            }>;
            verifiedClaims: Array<{
              claim: string;
              confidence: number;
              conflictingInfo?: string;
              status:
                | "verified"
                | "partially_verified"
                | "unverified"
                | "conflicting"
                | "extrapolated";
              supportingSources: Array<{
                excerpt?: string;
                title: string;
                type: "embedding" | "web";
              }>;
            }>;
          };
          ideaGeneratorOutput?: {
            crossFacetInsights: Array<string>;
            ideas: Array<{
              confidence: "supported" | "extrapolated" | "experimental";
              description: string;
              relatedFacets: Array<string>;
              risk?: string;
              technique: string;
            }>;
          };
          memoryContext?: string;
          originalQuestion: string;
          settings: {
            autoSaveWebResearch: boolean;
            chunksPerFacet: number;
            customModels?: {
              critic?:
                | "gpt-4o"
                | "gpt-4o-mini"
                | "o1"
                | "o1-mini"
                | "gpt-5-mini"
                | "gpt-oss-120b"
                | "claude-4.5-sonnet"
                | "claude-4.5-opus"
                | "claude-4-sonnet"
                | "claude-3.5-sonnet"
                | "claude-3.5-haiku"
                | "gemini-3-pro"
                | "gemini-2.5-flash"
                | "gemini-2.5-flash-lite"
                | "gemini-2.5-pro"
                | "gemini-2.0-flash"
                | "deepseek-chat"
                | "deepseek-r1"
                | "grok-code-fast"
                | "grok-4-fast"
                | "llama-3.3-70b"
                | "qwen-2.5-72b";
              finalWriter?:
                | "gpt-4o"
                | "gpt-4o-mini"
                | "o1"
                | "o1-mini"
                | "gpt-5-mini"
                | "gpt-oss-120b"
                | "claude-4.5-sonnet"
                | "claude-4.5-opus"
                | "claude-4-sonnet"
                | "claude-3.5-sonnet"
                | "claude-3.5-haiku"
                | "gemini-3-pro"
                | "gemini-2.5-flash"
                | "gemini-2.5-flash-lite"
                | "gemini-2.5-pro"
                | "gemini-2.0-flash"
                | "deepseek-chat"
                | "deepseek-r1"
                | "grok-code-fast"
                | "grok-4-fast"
                | "llama-3.3-70b"
                | "qwen-2.5-72b";
              ideaGenerator?:
                | "gpt-4o"
                | "gpt-4o-mini"
                | "o1"
                | "o1-mini"
                | "gpt-5-mini"
                | "gpt-oss-120b"
                | "claude-4.5-sonnet"
                | "claude-4.5-opus"
                | "claude-4-sonnet"
                | "claude-3.5-sonnet"
                | "claude-3.5-haiku"
                | "gemini-3-pro"
                | "gemini-2.5-flash"
                | "gemini-2.5-flash-lite"
                | "gemini-2.5-pro"
                | "gemini-2.0-flash"
                | "deepseek-chat"
                | "deepseek-r1"
                | "grok-code-fast"
                | "grok-4-fast"
                | "llama-3.3-70b"
                | "qwen-2.5-72b";
              planner?:
                | "gpt-4o"
                | "gpt-4o-mini"
                | "o1"
                | "o1-mini"
                | "gpt-5-mini"
                | "gpt-oss-120b"
                | "claude-4.5-sonnet"
                | "claude-4.5-opus"
                | "claude-4-sonnet"
                | "claude-3.5-sonnet"
                | "claude-3.5-haiku"
                | "gemini-3-pro"
                | "gemini-2.5-flash"
                | "gemini-2.5-flash-lite"
                | "gemini-2.5-pro"
                | "gemini-2.0-flash"
                | "deepseek-chat"
                | "deepseek-r1"
                | "grok-code-fast"
                | "grok-4-fast"
                | "llama-3.3-70b"
                | "qwen-2.5-72b";
              summarizer?:
                | "gpt-4o"
                | "gpt-4o-mini"
                | "o1"
                | "o1-mini"
                | "gpt-5-mini"
                | "gpt-oss-120b"
                | "claude-4.5-sonnet"
                | "claude-4.5-opus"
                | "claude-4-sonnet"
                | "claude-3.5-sonnet"
                | "claude-3.5-haiku"
                | "gemini-3-pro"
                | "gemini-2.5-flash"
                | "gemini-2.5-flash-lite"
                | "gemini-2.5-pro"
                | "gemini-2.0-flash"
                | "deepseek-chat"
                | "deepseek-r1"
                | "grok-code-fast"
                | "grok-4-fast"
                | "llama-3.3-70b"
                | "qwen-2.5-72b";
            };
            enableCreativeMode: boolean;
            enableCritic: boolean;
            enableFactVerification: boolean;
            enableWebResearch: boolean;
            maxFacets: number;
            maxRetries?: number;
            preset:
              | "budget"
              | "speed"
              | "balanced"
              | "deepReasoning"
              | "premium";
            qualityThreshold?: number;
            responseStyle:
              | "structured"
              | "conversational"
              | "concise"
              | "educational";
            similarityThreshold: number;
            sourceTypes?: Array<
              "course" | "chapter" | "lesson" | "document" | "note" | "custom"
            >;
            webSearchMaxResults?: number;
          };
          sourceChunks: Array<{
            id: string;
            sourceId?: string;
            sourceType?: string;
            title?: string;
          }>;
          summarizerOutput: {
            summaries: Array<{
              confidence: number;
              facetName: string;
              keyTechniques: Array<string>;
              sourceChunkIds: Array<string>;
              summary: string;
            }>;
          };
          webResearch?: Array<{
            facetName: string;
            results: Array<{
              content: string;
              score: number;
              title: string;
              url: string;
            }>;
            searchQuery: string;
          }>;
        },
        {
          answer: string;
          citations: Array<{
            excerpt?: string;
            id: number;
            sourceId?: string;
            sourceType: string;
            title: string;
          }>;
          facetsUsed: Array<string>;
          pipelineMetadata: {
            criticModel?: string;
            finalWriterModel: string;
            ideaGeneratorModel?: string;
            plannerModel: string;
            processingTimeMs: number;
            summarizerModel: string;
            totalChunksProcessed: number;
            totalTokensUsed?: number;
            webResearchResults?: number;
          };
        }
      >;
    };
    goalExtractor: {
      checkForGoalDrift: FunctionReference<
        "action",
        "internal",
        {
          currentQuestion: string;
          goal: {
            deliverableType?: string;
            extractedAt: number;
            keyConstraints?: Array<string>;
            originalIntent: string;
          };
          response: string;
        },
        { driftScore: number; explanation?: string; isDrifting: boolean }
      >;
      extractGoalFromMessage: FunctionReference<
        "action",
        "internal",
        { conversationId?: Id<"aiConversations">; message: string },
        {
          deliverableType?: string;
          extractedAt: number;
          keyConstraints?: Array<string>;
          originalIntent: string;
        }
      >;
    };
    goalExtractorMutations: {
      getConversationGoal: FunctionReference<
        "query",
        "internal",
        { conversationId: Id<"aiConversations"> },
        {
          deliverableType?: string;
          extractedAt: number;
          keyConstraints?: Array<string>;
          originalIntent: string;
        } | null
      >;
      saveConversationGoal: FunctionReference<
        "mutation",
        "internal",
        {
          conversationId: Id<"aiConversations">;
          goal: {
            deliverableType?: string;
            extractedAt: number;
            keyConstraints?: Array<string>;
            originalIntent: string;
          };
        },
        null
      >;
    };
    ideaGenerator: {
      generateIdeas: FunctionReference<
        "action",
        "internal",
        {
          originalQuestion: string;
          settings: {
            autoSaveWebResearch: boolean;
            chunksPerFacet: number;
            customModels?: {
              critic?:
                | "gpt-4o"
                | "gpt-4o-mini"
                | "o1"
                | "o1-mini"
                | "gpt-5-mini"
                | "gpt-oss-120b"
                | "claude-4.5-sonnet"
                | "claude-4.5-opus"
                | "claude-4-sonnet"
                | "claude-3.5-sonnet"
                | "claude-3.5-haiku"
                | "gemini-3-pro"
                | "gemini-2.5-flash"
                | "gemini-2.5-flash-lite"
                | "gemini-2.5-pro"
                | "gemini-2.0-flash"
                | "deepseek-chat"
                | "deepseek-r1"
                | "grok-code-fast"
                | "grok-4-fast"
                | "llama-3.3-70b"
                | "qwen-2.5-72b";
              finalWriter?:
                | "gpt-4o"
                | "gpt-4o-mini"
                | "o1"
                | "o1-mini"
                | "gpt-5-mini"
                | "gpt-oss-120b"
                | "claude-4.5-sonnet"
                | "claude-4.5-opus"
                | "claude-4-sonnet"
                | "claude-3.5-sonnet"
                | "claude-3.5-haiku"
                | "gemini-3-pro"
                | "gemini-2.5-flash"
                | "gemini-2.5-flash-lite"
                | "gemini-2.5-pro"
                | "gemini-2.0-flash"
                | "deepseek-chat"
                | "deepseek-r1"
                | "grok-code-fast"
                | "grok-4-fast"
                | "llama-3.3-70b"
                | "qwen-2.5-72b";
              ideaGenerator?:
                | "gpt-4o"
                | "gpt-4o-mini"
                | "o1"
                | "o1-mini"
                | "gpt-5-mini"
                | "gpt-oss-120b"
                | "claude-4.5-sonnet"
                | "claude-4.5-opus"
                | "claude-4-sonnet"
                | "claude-3.5-sonnet"
                | "claude-3.5-haiku"
                | "gemini-3-pro"
                | "gemini-2.5-flash"
                | "gemini-2.5-flash-lite"
                | "gemini-2.5-pro"
                | "gemini-2.0-flash"
                | "deepseek-chat"
                | "deepseek-r1"
                | "grok-code-fast"
                | "grok-4-fast"
                | "llama-3.3-70b"
                | "qwen-2.5-72b";
              planner?:
                | "gpt-4o"
                | "gpt-4o-mini"
                | "o1"
                | "o1-mini"
                | "gpt-5-mini"
                | "gpt-oss-120b"
                | "claude-4.5-sonnet"
                | "claude-4.5-opus"
                | "claude-4-sonnet"
                | "claude-3.5-sonnet"
                | "claude-3.5-haiku"
                | "gemini-3-pro"
                | "gemini-2.5-flash"
                | "gemini-2.5-flash-lite"
                | "gemini-2.5-pro"
                | "gemini-2.0-flash"
                | "deepseek-chat"
                | "deepseek-r1"
                | "grok-code-fast"
                | "grok-4-fast"
                | "llama-3.3-70b"
                | "qwen-2.5-72b";
              summarizer?:
                | "gpt-4o"
                | "gpt-4o-mini"
                | "o1"
                | "o1-mini"
                | "gpt-5-mini"
                | "gpt-oss-120b"
                | "claude-4.5-sonnet"
                | "claude-4.5-opus"
                | "claude-4-sonnet"
                | "claude-3.5-sonnet"
                | "claude-3.5-haiku"
                | "gemini-3-pro"
                | "gemini-2.5-flash"
                | "gemini-2.5-flash-lite"
                | "gemini-2.5-pro"
                | "gemini-2.0-flash"
                | "deepseek-chat"
                | "deepseek-r1"
                | "grok-code-fast"
                | "grok-4-fast"
                | "llama-3.3-70b"
                | "qwen-2.5-72b";
            };
            enableCreativeMode: boolean;
            enableCritic: boolean;
            enableFactVerification: boolean;
            enableWebResearch: boolean;
            maxFacets: number;
            maxRetries?: number;
            preset:
              | "budget"
              | "speed"
              | "balanced"
              | "deepReasoning"
              | "premium";
            qualityThreshold?: number;
            responseStyle:
              | "structured"
              | "conversational"
              | "concise"
              | "educational";
            similarityThreshold: number;
            sourceTypes?: Array<
              "course" | "chapter" | "lesson" | "document" | "note" | "custom"
            >;
            webSearchMaxResults?: number;
          };
          summarizerOutput: {
            summaries: Array<{
              confidence: number;
              facetName: string;
              keyTechniques: Array<string>;
              sourceChunkIds: Array<string>;
              summary: string;
            }>;
          };
        },
        {
          crossFacetInsights: Array<string>;
          ideas: Array<{
            confidence: "supported" | "extrapolated" | "experimental";
            description: string;
            relatedFacets: Array<string>;
            risk?: string;
            technique: string;
          }>;
        }
      >;
    };
    index: {
      runPipeline: FunctionReference<
        "action",
        "internal",
        {
          conversationContext?: Array<{
            content: string;
            role: "user" | "assistant";
          }>;
          question: string;
          settings: {
            autoSaveWebResearch: boolean;
            chunksPerFacet: number;
            customModels?: {
              critic?:
                | "gpt-4o"
                | "gpt-4o-mini"
                | "o1"
                | "o1-mini"
                | "gpt-5-mini"
                | "gpt-oss-120b"
                | "claude-4.5-sonnet"
                | "claude-4.5-opus"
                | "claude-4-sonnet"
                | "claude-3.5-sonnet"
                | "claude-3.5-haiku"
                | "gemini-3-pro"
                | "gemini-2.5-flash"
                | "gemini-2.5-flash-lite"
                | "gemini-2.5-pro"
                | "gemini-2.0-flash"
                | "deepseek-chat"
                | "deepseek-r1"
                | "grok-code-fast"
                | "grok-4-fast"
                | "llama-3.3-70b"
                | "qwen-2.5-72b";
              finalWriter?:
                | "gpt-4o"
                | "gpt-4o-mini"
                | "o1"
                | "o1-mini"
                | "gpt-5-mini"
                | "gpt-oss-120b"
                | "claude-4.5-sonnet"
                | "claude-4.5-opus"
                | "claude-4-sonnet"
                | "claude-3.5-sonnet"
                | "claude-3.5-haiku"
                | "gemini-3-pro"
                | "gemini-2.5-flash"
                | "gemini-2.5-flash-lite"
                | "gemini-2.5-pro"
                | "gemini-2.0-flash"
                | "deepseek-chat"
                | "deepseek-r1"
                | "grok-code-fast"
                | "grok-4-fast"
                | "llama-3.3-70b"
                | "qwen-2.5-72b";
              ideaGenerator?:
                | "gpt-4o"
                | "gpt-4o-mini"
                | "o1"
                | "o1-mini"
                | "gpt-5-mini"
                | "gpt-oss-120b"
                | "claude-4.5-sonnet"
                | "claude-4.5-opus"
                | "claude-4-sonnet"
                | "claude-3.5-sonnet"
                | "claude-3.5-haiku"
                | "gemini-3-pro"
                | "gemini-2.5-flash"
                | "gemini-2.5-flash-lite"
                | "gemini-2.5-pro"
                | "gemini-2.0-flash"
                | "deepseek-chat"
                | "deepseek-r1"
                | "grok-code-fast"
                | "grok-4-fast"
                | "llama-3.3-70b"
                | "qwen-2.5-72b";
              planner?:
                | "gpt-4o"
                | "gpt-4o-mini"
                | "o1"
                | "o1-mini"
                | "gpt-5-mini"
                | "gpt-oss-120b"
                | "claude-4.5-sonnet"
                | "claude-4.5-opus"
                | "claude-4-sonnet"
                | "claude-3.5-sonnet"
                | "claude-3.5-haiku"
                | "gemini-3-pro"
                | "gemini-2.5-flash"
                | "gemini-2.5-flash-lite"
                | "gemini-2.5-pro"
                | "gemini-2.0-flash"
                | "deepseek-chat"
                | "deepseek-r1"
                | "grok-code-fast"
                | "grok-4-fast"
                | "llama-3.3-70b"
                | "qwen-2.5-72b";
              summarizer?:
                | "gpt-4o"
                | "gpt-4o-mini"
                | "o1"
                | "o1-mini"
                | "gpt-5-mini"
                | "gpt-oss-120b"
                | "claude-4.5-sonnet"
                | "claude-4.5-opus"
                | "claude-4-sonnet"
                | "claude-3.5-sonnet"
                | "claude-3.5-haiku"
                | "gemini-3-pro"
                | "gemini-2.5-flash"
                | "gemini-2.5-flash-lite"
                | "gemini-2.5-pro"
                | "gemini-2.0-flash"
                | "deepseek-chat"
                | "deepseek-r1"
                | "grok-code-fast"
                | "grok-4-fast"
                | "llama-3.3-70b"
                | "qwen-2.5-72b";
            };
            enableCreativeMode: boolean;
            enableCritic: boolean;
            enableFactVerification: boolean;
            enableWebResearch: boolean;
            maxFacets: number;
            maxRetries?: number;
            preset:
              | "budget"
              | "speed"
              | "balanced"
              | "deepReasoning"
              | "premium";
            qualityThreshold?: number;
            responseStyle:
              | "structured"
              | "conversational"
              | "concise"
              | "educational";
            similarityThreshold: number;
            sourceTypes?: Array<
              "course" | "chapter" | "lesson" | "document" | "note" | "custom"
            >;
            webSearchMaxResults?: number;
          };
          userId?: string;
        },
        {
          criticOutput?: any;
          ideaGeneratorOutput?: any;
          plannerOutput: any;
          retrieverOutput: any;
          sourceChunks: Array<{
            id: string;
            sourceId?: string;
            sourceType?: string;
            title?: string;
          }>;
          summarizerOutput: any;
        }
      >;
    };
    leadMagnetAnalyzer: {
      analyzeChapterContent: FunctionReference<
        "action",
        "internal",
        {
          chapterContent: string;
          chapterId: string;
          chapterTitle: string;
          generateEmbeddings?: boolean;
          lessonId?: string;
          lessonTitle?: string;
          moduleTitle?: string;
        },
        {
          chapterId: string;
          chapterTitle: string;
          keyTopics: Array<string>;
          leadMagnetSuggestions: Array<string>;
          lessonId?: string;
          lessonTitle?: string;
          moduleTitle?: string;
          overallLeadMagnetScore: number;
          visualIdeas: Array<{
            category:
              | "concept_diagram"
              | "process_flow"
              | "comparison"
              | "equipment_setup"
              | "waveform_visual"
              | "ui_screenshot"
              | "metaphor"
              | "example";
            embedding?: Array<number>;
            embeddingText?: string;
            estimatedPosition: number;
            illustrationPrompt: string;
            importance: "critical" | "helpful" | "optional";
            leadMagnetPotential: number;
            sentenceOrConcept: string;
            visualDescription: string;
          }>;
          wordCount: number;
        }
      >;
    };
    memoryManager: {
      extractMemoriesFromConversation: FunctionReference<
        "action",
        "internal",
        {
          conversationId: Id<"aiConversations">;
          messages: Array<{ content: string; role: "user" | "assistant" }>;
          userId: string;
        },
        {
          extracted: number;
          memories: Array<{
            content: string;
            importance: number;
            type: string;
          }>;
        }
      >;
    };
    mutations: {
      createWebEmbedding: FunctionReference<
        "mutation",
        "internal",
        {
          category: string;
          content: string;
          facetName: string;
          sourceConversationId?: Id<"aiConversations">;
          title: string;
          url: string;
          userId: string;
        },
        Id<"embeddings"> | null
      >;
      saveAssistantMessage: FunctionReference<
        "mutation",
        "internal",
        {
          citations?: Array<{
            id: number;
            sourceId?: string;
            sourceType: string;
            title: string;
          }>;
          content: string;
          conversationId: string;
          facetsUsed?: Array<string>;
          pipelineMetadata?: {
            finalWriterModel?: string;
            plannerModel?: string;
            processingTimeMs: number;
            summarizerModel?: string;
            totalChunksProcessed: number;
          };
          userId: string;
        },
        Id<"aiMessages"> | null
      >;
    };
    planner: {
      analyzeQuestion: FunctionReference<
        "action",
        "internal",
        {
          conversationContext?: Array<{
            content: string;
            role: "user" | "assistant";
          }>;
          conversationGoal?: {
            deliverableType?: string;
            extractedAt: number;
            keyConstraints?: Array<string>;
            originalIntent: string;
          };
          question: string;
          settings: {
            autoSaveWebResearch: boolean;
            chunksPerFacet: number;
            customModels?: {
              critic?:
                | "gpt-4o"
                | "gpt-4o-mini"
                | "o1"
                | "o1-mini"
                | "gpt-5-mini"
                | "gpt-oss-120b"
                | "claude-4.5-sonnet"
                | "claude-4.5-opus"
                | "claude-4-sonnet"
                | "claude-3.5-sonnet"
                | "claude-3.5-haiku"
                | "gemini-3-pro"
                | "gemini-2.5-flash"
                | "gemini-2.5-flash-lite"
                | "gemini-2.5-pro"
                | "gemini-2.0-flash"
                | "deepseek-chat"
                | "deepseek-r1"
                | "grok-code-fast"
                | "grok-4-fast"
                | "llama-3.3-70b"
                | "qwen-2.5-72b";
              finalWriter?:
                | "gpt-4o"
                | "gpt-4o-mini"
                | "o1"
                | "o1-mini"
                | "gpt-5-mini"
                | "gpt-oss-120b"
                | "claude-4.5-sonnet"
                | "claude-4.5-opus"
                | "claude-4-sonnet"
                | "claude-3.5-sonnet"
                | "claude-3.5-haiku"
                | "gemini-3-pro"
                | "gemini-2.5-flash"
                | "gemini-2.5-flash-lite"
                | "gemini-2.5-pro"
                | "gemini-2.0-flash"
                | "deepseek-chat"
                | "deepseek-r1"
                | "grok-code-fast"
                | "grok-4-fast"
                | "llama-3.3-70b"
                | "qwen-2.5-72b";
              ideaGenerator?:
                | "gpt-4o"
                | "gpt-4o-mini"
                | "o1"
                | "o1-mini"
                | "gpt-5-mini"
                | "gpt-oss-120b"
                | "claude-4.5-sonnet"
                | "claude-4.5-opus"
                | "claude-4-sonnet"
                | "claude-3.5-sonnet"
                | "claude-3.5-haiku"
                | "gemini-3-pro"
                | "gemini-2.5-flash"
                | "gemini-2.5-flash-lite"
                | "gemini-2.5-pro"
                | "gemini-2.0-flash"
                | "deepseek-chat"
                | "deepseek-r1"
                | "grok-code-fast"
                | "grok-4-fast"
                | "llama-3.3-70b"
                | "qwen-2.5-72b";
              planner?:
                | "gpt-4o"
                | "gpt-4o-mini"
                | "o1"
                | "o1-mini"
                | "gpt-5-mini"
                | "gpt-oss-120b"
                | "claude-4.5-sonnet"
                | "claude-4.5-opus"
                | "claude-4-sonnet"
                | "claude-3.5-sonnet"
                | "claude-3.5-haiku"
                | "gemini-3-pro"
                | "gemini-2.5-flash"
                | "gemini-2.5-flash-lite"
                | "gemini-2.5-pro"
                | "gemini-2.0-flash"
                | "deepseek-chat"
                | "deepseek-r1"
                | "grok-code-fast"
                | "grok-4-fast"
                | "llama-3.3-70b"
                | "qwen-2.5-72b";
              summarizer?:
                | "gpt-4o"
                | "gpt-4o-mini"
                | "o1"
                | "o1-mini"
                | "gpt-5-mini"
                | "gpt-oss-120b"
                | "claude-4.5-sonnet"
                | "claude-4.5-opus"
                | "claude-4-sonnet"
                | "claude-3.5-sonnet"
                | "claude-3.5-haiku"
                | "gemini-3-pro"
                | "gemini-2.5-flash"
                | "gemini-2.5-flash-lite"
                | "gemini-2.5-pro"
                | "gemini-2.0-flash"
                | "deepseek-chat"
                | "deepseek-r1"
                | "grok-code-fast"
                | "grok-4-fast"
                | "llama-3.3-70b"
                | "qwen-2.5-72b";
            };
            enableCreativeMode: boolean;
            enableCritic: boolean;
            enableFactVerification: boolean;
            enableWebResearch: boolean;
            maxFacets: number;
            maxRetries?: number;
            preset:
              | "budget"
              | "speed"
              | "balanced"
              | "deepReasoning"
              | "premium";
            qualityThreshold?: number;
            responseStyle:
              | "structured"
              | "conversational"
              | "concise"
              | "educational";
            similarityThreshold: number;
            sourceTypes?: Array<
              "course" | "chapter" | "lesson" | "document" | "note" | "custom"
            >;
            webSearchMaxResults?: number;
          };
        },
        {
          facets: Array<{
            description: string;
            name: string;
            priority: number;
            queryHint: string;
            tags: Array<string>;
          }>;
          intent: string;
          questionType:
            | "technical"
            | "conceptual"
            | "workflow"
            | "creative"
            | "troubleshooting"
            | "comparison";
          searchStrategies: Array<{
            facetName: string;
            filters: {
              categories?: Array<string>;
              sourceTypes?: Array<string>;
            };
            query: string;
          }>;
        }
      >;
      analyzeQuestionWithTools: FunctionReference<
        "action",
        "internal",
        {
          availableTools?: Array<string>;
          conversationContext?: Array<{
            content: string;
            role: "user" | "assistant";
          }>;
          question: string;
          settings: {
            autoSaveWebResearch: boolean;
            chunksPerFacet: number;
            customModels?: {
              critic?:
                | "gpt-4o"
                | "gpt-4o-mini"
                | "o1"
                | "o1-mini"
                | "gpt-5-mini"
                | "gpt-oss-120b"
                | "claude-4.5-sonnet"
                | "claude-4.5-opus"
                | "claude-4-sonnet"
                | "claude-3.5-sonnet"
                | "claude-3.5-haiku"
                | "gemini-3-pro"
                | "gemini-2.5-flash"
                | "gemini-2.5-flash-lite"
                | "gemini-2.5-pro"
                | "gemini-2.0-flash"
                | "deepseek-chat"
                | "deepseek-r1"
                | "grok-code-fast"
                | "grok-4-fast"
                | "llama-3.3-70b"
                | "qwen-2.5-72b";
              finalWriter?:
                | "gpt-4o"
                | "gpt-4o-mini"
                | "o1"
                | "o1-mini"
                | "gpt-5-mini"
                | "gpt-oss-120b"
                | "claude-4.5-sonnet"
                | "claude-4.5-opus"
                | "claude-4-sonnet"
                | "claude-3.5-sonnet"
                | "claude-3.5-haiku"
                | "gemini-3-pro"
                | "gemini-2.5-flash"
                | "gemini-2.5-flash-lite"
                | "gemini-2.5-pro"
                | "gemini-2.0-flash"
                | "deepseek-chat"
                | "deepseek-r1"
                | "grok-code-fast"
                | "grok-4-fast"
                | "llama-3.3-70b"
                | "qwen-2.5-72b";
              ideaGenerator?:
                | "gpt-4o"
                | "gpt-4o-mini"
                | "o1"
                | "o1-mini"
                | "gpt-5-mini"
                | "gpt-oss-120b"
                | "claude-4.5-sonnet"
                | "claude-4.5-opus"
                | "claude-4-sonnet"
                | "claude-3.5-sonnet"
                | "claude-3.5-haiku"
                | "gemini-3-pro"
                | "gemini-2.5-flash"
                | "gemini-2.5-flash-lite"
                | "gemini-2.5-pro"
                | "gemini-2.0-flash"
                | "deepseek-chat"
                | "deepseek-r1"
                | "grok-code-fast"
                | "grok-4-fast"
                | "llama-3.3-70b"
                | "qwen-2.5-72b";
              planner?:
                | "gpt-4o"
                | "gpt-4o-mini"
                | "o1"
                | "o1-mini"
                | "gpt-5-mini"
                | "gpt-oss-120b"
                | "claude-4.5-sonnet"
                | "claude-4.5-opus"
                | "claude-4-sonnet"
                | "claude-3.5-sonnet"
                | "claude-3.5-haiku"
                | "gemini-3-pro"
                | "gemini-2.5-flash"
                | "gemini-2.5-flash-lite"
                | "gemini-2.5-pro"
                | "gemini-2.0-flash"
                | "deepseek-chat"
                | "deepseek-r1"
                | "grok-code-fast"
                | "grok-4-fast"
                | "llama-3.3-70b"
                | "qwen-2.5-72b";
              summarizer?:
                | "gpt-4o"
                | "gpt-4o-mini"
                | "o1"
                | "o1-mini"
                | "gpt-5-mini"
                | "gpt-oss-120b"
                | "claude-4.5-sonnet"
                | "claude-4.5-opus"
                | "claude-4-sonnet"
                | "claude-3.5-sonnet"
                | "claude-3.5-haiku"
                | "gemini-3-pro"
                | "gemini-2.5-flash"
                | "gemini-2.5-flash-lite"
                | "gemini-2.5-pro"
                | "gemini-2.0-flash"
                | "deepseek-chat"
                | "deepseek-r1"
                | "grok-code-fast"
                | "grok-4-fast"
                | "llama-3.3-70b"
                | "qwen-2.5-72b";
            };
            enableCreativeMode: boolean;
            enableCritic: boolean;
            enableFactVerification: boolean;
            enableWebResearch: boolean;
            maxFacets: number;
            maxRetries?: number;
            preset:
              | "budget"
              | "speed"
              | "balanced"
              | "deepReasoning"
              | "premium";
            qualityThreshold?: number;
            responseStyle:
              | "structured"
              | "conversational"
              | "concise"
              | "educational";
            similarityThreshold: number;
            sourceTypes?: Array<
              "course" | "chapter" | "lesson" | "document" | "note" | "custom"
            >;
            webSearchMaxResults?: number;
          };
          userRole?: "creator" | "admin" | "student";
        },
        {
          facets: Array<{
            description: string;
            name: string;
            priority: number;
            queryHint: string;
            tags: Array<string>;
          }>;
          intent: string;
          intentType:
            | "question"
            | "create"
            | "modify"
            | "delete"
            | "query"
            | "generate";
          isActionRequest: boolean;
          questionType:
            | "technical"
            | "conceptual"
            | "workflow"
            | "creative"
            | "troubleshooting"
            | "comparison";
          searchStrategies: Array<{
            facetName: string;
            filters: {
              categories?: Array<string>;
              sourceTypes?: Array<string>;
            };
            query: string;
          }>;
          toolCalls?: Array<{
            parameters: any;
            reasoning?: string;
            tool: string;
          }>;
        }
      >;
    };
    queries: {
      getEmbeddingStats: FunctionReference<
        "query",
        "internal",
        {},
        {
          byCategory: Record<string, number>;
          bySourceType: Record<string, number>;
          sample?: { content: string; sourceType?: string; title?: string };
          total: number;
        }
      >;
      getFilteredEmbeddings: FunctionReference<
        "query",
        "internal",
        {
          categories?: Array<string>;
          limit?: number;
          sourceTypes?: Array<
            | "course"
            | "chapter"
            | "lesson"
            | "document"
            | "note"
            | "custom"
            | "socialPost"
          >;
        },
        Array<{
          _id: Id<"embeddings">;
          category?: string;
          content: string;
          embedding: Array<number>;
          metadata?: any;
          sourceId?: string;
          sourceType?:
            | "course"
            | "chapter"
            | "lesson"
            | "document"
            | "note"
            | "custom"
            | "socialPost";
          title?: string;
          userId: string;
        }>
      >;
      getUserMemoriesInternal: FunctionReference<
        "query",
        "internal",
        { limit?: number; userId: string },
        Array<{ content: string; importance: number; type: string }>
      >;
    };
    retriever: {
      retrieveContent: FunctionReference<
        "action",
        "internal",
        {
          plan: {
            facets: Array<{
              description: string;
              name: string;
              priority: number;
              queryHint: string;
              tags: Array<string>;
            }>;
            intent: string;
            questionType:
              | "technical"
              | "conceptual"
              | "workflow"
              | "creative"
              | "troubleshooting"
              | "comparison";
            searchStrategies: Array<{
              facetName: string;
              filters: {
                categories?: Array<string>;
                sourceTypes?: Array<string>;
              };
              query: string;
            }>;
          };
          settings: {
            autoSaveWebResearch: boolean;
            chunksPerFacet: number;
            customModels?: {
              critic?:
                | "gpt-4o"
                | "gpt-4o-mini"
                | "o1"
                | "o1-mini"
                | "gpt-5-mini"
                | "gpt-oss-120b"
                | "claude-4.5-sonnet"
                | "claude-4.5-opus"
                | "claude-4-sonnet"
                | "claude-3.5-sonnet"
                | "claude-3.5-haiku"
                | "gemini-3-pro"
                | "gemini-2.5-flash"
                | "gemini-2.5-flash-lite"
                | "gemini-2.5-pro"
                | "gemini-2.0-flash"
                | "deepseek-chat"
                | "deepseek-r1"
                | "grok-code-fast"
                | "grok-4-fast"
                | "llama-3.3-70b"
                | "qwen-2.5-72b";
              finalWriter?:
                | "gpt-4o"
                | "gpt-4o-mini"
                | "o1"
                | "o1-mini"
                | "gpt-5-mini"
                | "gpt-oss-120b"
                | "claude-4.5-sonnet"
                | "claude-4.5-opus"
                | "claude-4-sonnet"
                | "claude-3.5-sonnet"
                | "claude-3.5-haiku"
                | "gemini-3-pro"
                | "gemini-2.5-flash"
                | "gemini-2.5-flash-lite"
                | "gemini-2.5-pro"
                | "gemini-2.0-flash"
                | "deepseek-chat"
                | "deepseek-r1"
                | "grok-code-fast"
                | "grok-4-fast"
                | "llama-3.3-70b"
                | "qwen-2.5-72b";
              ideaGenerator?:
                | "gpt-4o"
                | "gpt-4o-mini"
                | "o1"
                | "o1-mini"
                | "gpt-5-mini"
                | "gpt-oss-120b"
                | "claude-4.5-sonnet"
                | "claude-4.5-opus"
                | "claude-4-sonnet"
                | "claude-3.5-sonnet"
                | "claude-3.5-haiku"
                | "gemini-3-pro"
                | "gemini-2.5-flash"
                | "gemini-2.5-flash-lite"
                | "gemini-2.5-pro"
                | "gemini-2.0-flash"
                | "deepseek-chat"
                | "deepseek-r1"
                | "grok-code-fast"
                | "grok-4-fast"
                | "llama-3.3-70b"
                | "qwen-2.5-72b";
              planner?:
                | "gpt-4o"
                | "gpt-4o-mini"
                | "o1"
                | "o1-mini"
                | "gpt-5-mini"
                | "gpt-oss-120b"
                | "claude-4.5-sonnet"
                | "claude-4.5-opus"
                | "claude-4-sonnet"
                | "claude-3.5-sonnet"
                | "claude-3.5-haiku"
                | "gemini-3-pro"
                | "gemini-2.5-flash"
                | "gemini-2.5-flash-lite"
                | "gemini-2.5-pro"
                | "gemini-2.0-flash"
                | "deepseek-chat"
                | "deepseek-r1"
                | "grok-code-fast"
                | "grok-4-fast"
                | "llama-3.3-70b"
                | "qwen-2.5-72b";
              summarizer?:
                | "gpt-4o"
                | "gpt-4o-mini"
                | "o1"
                | "o1-mini"
                | "gpt-5-mini"
                | "gpt-oss-120b"
                | "claude-4.5-sonnet"
                | "claude-4.5-opus"
                | "claude-4-sonnet"
                | "claude-3.5-sonnet"
                | "claude-3.5-haiku"
                | "gemini-3-pro"
                | "gemini-2.5-flash"
                | "gemini-2.5-flash-lite"
                | "gemini-2.5-pro"
                | "gemini-2.0-flash"
                | "deepseek-chat"
                | "deepseek-r1"
                | "grok-code-fast"
                | "grok-4-fast"
                | "llama-3.3-70b"
                | "qwen-2.5-72b";
            };
            enableCreativeMode: boolean;
            enableCritic: boolean;
            enableFactVerification: boolean;
            enableWebResearch: boolean;
            maxFacets: number;
            maxRetries?: number;
            preset:
              | "budget"
              | "speed"
              | "balanced"
              | "deepReasoning"
              | "premium";
            qualityThreshold?: number;
            responseStyle:
              | "structured"
              | "conversational"
              | "concise"
              | "educational";
            similarityThreshold: number;
            sourceTypes?: Array<
              "course" | "chapter" | "lesson" | "document" | "note" | "custom"
            >;
            webSearchMaxResults?: number;
          };
        },
        {
          buckets: Array<{
            chunks: Array<{
              category?: string;
              content: string;
              id: string;
              metadata?: any;
              similarity: number;
              sourceId?: string;
              sourceType?: string;
              title?: string;
            }>;
            facetName: string;
            totalFound: number;
          }>;
          totalChunksRetrieved: number;
        }
      >;
    };
    socialScriptAgent: {
      processChapterBatch: FunctionReference<
        "action",
        "internal",
        {
          batchId: string;
          batchIndex: number;
          chapterIds: Array<Id<"courseChapters">>;
          jobId: Id<"scriptGenerationJobs">;
          totalBatches: number;
        },
        any
      >;
    };
    socialScriptAgentMutations: {
      cancelJob: FunctionReference<
        "mutation",
        "internal",
        { jobId: Id<"scriptGenerationJobs"> },
        any
      >;
      completeJob: FunctionReference<
        "mutation",
        "internal",
        { jobId: Id<"scriptGenerationJobs">; scriptsGenerated?: number },
        any
      >;
      createJob: FunctionReference<
        "mutation",
        "internal",
        {
          courseId?: Id<"courses">;
          jobType: "full_scan" | "course_scan" | "incremental";
          storeId: string;
          userId: string;
        },
        any
      >;
      getAccountProfiles: FunctionReference<
        "query",
        "internal",
        { storeId: string },
        any
      >;
      getChapterInfo: FunctionReference<
        "query",
        "internal",
        { chapterId: Id<"courseChapters"> },
        any
      >;
      getChaptersToProcess: FunctionReference<
        "query",
        "internal",
        {
          courseId?: Id<"courses">;
          jobType: "full_scan" | "course_scan" | "incremental";
          userId: string;
        },
        any
      >;
      getJobInternal: FunctionReference<
        "query",
        "internal",
        { jobId: Id<"scriptGenerationJobs"> },
        any
      >;
      getScriptsForRescoring: FunctionReference<
        "query",
        "internal",
        { cursor?: Id<"generatedScripts">; limit?: number; storeId: string },
        any
      >;
      updateJobProgress: FunctionReference<
        "mutation",
        "internal",
        {
          failedChapters?: number;
          jobId: Id<"scriptGenerationJobs">;
          processedChapters?: number;
          scriptsGenerated?: number;
          totalChapters?: number;
        },
        any
      >;
      updateJobStatus: FunctionReference<
        "mutation",
        "internal",
        {
          currentBatchId?: string;
          jobId: Id<"scriptGenerationJobs">;
          lastError?: string;
          status:
            | "queued"
            | "processing"
            | "completed"
            | "failed"
            | "cancelled";
        },
        any
      >;
      updateScriptVirality: FunctionReference<
        "mutation",
        "internal",
        {
          scriptId: Id<"generatedScripts">;
          viralityAnalysis: {
            educationalValue: number;
            engagementPotential: number;
            reasoning: string;
            trendAlignment: number;
          };
          viralityScore: number;
        },
        any
      >;
    };
    summarizer: {
      summarizeContent: FunctionReference<
        "action",
        "internal",
        {
          originalQuestion: string;
          retrieverOutput: {
            buckets: Array<{
              chunks: Array<{
                category?: string;
                content: string;
                id: string;
                metadata?: any;
                similarity: number;
                sourceId?: string;
                sourceType?: string;
                title?: string;
              }>;
              facetName: string;
              totalFound: number;
            }>;
            totalChunksRetrieved: number;
          };
          settings: {
            autoSaveWebResearch: boolean;
            chunksPerFacet: number;
            customModels?: {
              critic?:
                | "gpt-4o"
                | "gpt-4o-mini"
                | "o1"
                | "o1-mini"
                | "gpt-5-mini"
                | "gpt-oss-120b"
                | "claude-4.5-sonnet"
                | "claude-4.5-opus"
                | "claude-4-sonnet"
                | "claude-3.5-sonnet"
                | "claude-3.5-haiku"
                | "gemini-3-pro"
                | "gemini-2.5-flash"
                | "gemini-2.5-flash-lite"
                | "gemini-2.5-pro"
                | "gemini-2.0-flash"
                | "deepseek-chat"
                | "deepseek-r1"
                | "grok-code-fast"
                | "grok-4-fast"
                | "llama-3.3-70b"
                | "qwen-2.5-72b";
              finalWriter?:
                | "gpt-4o"
                | "gpt-4o-mini"
                | "o1"
                | "o1-mini"
                | "gpt-5-mini"
                | "gpt-oss-120b"
                | "claude-4.5-sonnet"
                | "claude-4.5-opus"
                | "claude-4-sonnet"
                | "claude-3.5-sonnet"
                | "claude-3.5-haiku"
                | "gemini-3-pro"
                | "gemini-2.5-flash"
                | "gemini-2.5-flash-lite"
                | "gemini-2.5-pro"
                | "gemini-2.0-flash"
                | "deepseek-chat"
                | "deepseek-r1"
                | "grok-code-fast"
                | "grok-4-fast"
                | "llama-3.3-70b"
                | "qwen-2.5-72b";
              ideaGenerator?:
                | "gpt-4o"
                | "gpt-4o-mini"
                | "o1"
                | "o1-mini"
                | "gpt-5-mini"
                | "gpt-oss-120b"
                | "claude-4.5-sonnet"
                | "claude-4.5-opus"
                | "claude-4-sonnet"
                | "claude-3.5-sonnet"
                | "claude-3.5-haiku"
                | "gemini-3-pro"
                | "gemini-2.5-flash"
                | "gemini-2.5-flash-lite"
                | "gemini-2.5-pro"
                | "gemini-2.0-flash"
                | "deepseek-chat"
                | "deepseek-r1"
                | "grok-code-fast"
                | "grok-4-fast"
                | "llama-3.3-70b"
                | "qwen-2.5-72b";
              planner?:
                | "gpt-4o"
                | "gpt-4o-mini"
                | "o1"
                | "o1-mini"
                | "gpt-5-mini"
                | "gpt-oss-120b"
                | "claude-4.5-sonnet"
                | "claude-4.5-opus"
                | "claude-4-sonnet"
                | "claude-3.5-sonnet"
                | "claude-3.5-haiku"
                | "gemini-3-pro"
                | "gemini-2.5-flash"
                | "gemini-2.5-flash-lite"
                | "gemini-2.5-pro"
                | "gemini-2.0-flash"
                | "deepseek-chat"
                | "deepseek-r1"
                | "grok-code-fast"
                | "grok-4-fast"
                | "llama-3.3-70b"
                | "qwen-2.5-72b";
              summarizer?:
                | "gpt-4o"
                | "gpt-4o-mini"
                | "o1"
                | "o1-mini"
                | "gpt-5-mini"
                | "gpt-oss-120b"
                | "claude-4.5-sonnet"
                | "claude-4.5-opus"
                | "claude-4-sonnet"
                | "claude-3.5-sonnet"
                | "claude-3.5-haiku"
                | "gemini-3-pro"
                | "gemini-2.5-flash"
                | "gemini-2.5-flash-lite"
                | "gemini-2.5-pro"
                | "gemini-2.0-flash"
                | "deepseek-chat"
                | "deepseek-r1"
                | "grok-code-fast"
                | "grok-4-fast"
                | "llama-3.3-70b"
                | "qwen-2.5-72b";
            };
            enableCreativeMode: boolean;
            enableCritic: boolean;
            enableFactVerification: boolean;
            enableWebResearch: boolean;
            maxFacets: number;
            maxRetries?: number;
            preset:
              | "budget"
              | "speed"
              | "balanced"
              | "deepReasoning"
              | "premium";
            qualityThreshold?: number;
            responseStyle:
              | "structured"
              | "conversational"
              | "concise"
              | "educational";
            similarityThreshold: number;
            sourceTypes?: Array<
              "course" | "chapter" | "lesson" | "document" | "note" | "custom"
            >;
            webSearchMaxResults?: number;
          };
        },
        {
          summaries: Array<{
            confidence: number;
            facetName: string;
            keyTechniques: Array<string>;
            sourceChunkIds: Array<string>;
            summary: string;
          }>;
        }
      >;
    };
    tools: {
      executor: {
        executeTool: FunctionReference<
          "action",
          "internal",
          {
            parameters: any;
            storeId?: string;
            toolName: string;
            userId: string;
          },
          { error?: string; result?: any; success: boolean; tool: string }
        >;
        executeTools: FunctionReference<
          "action",
          "internal",
          {
            storeId?: string;
            toolCalls: Array<{ parameters: any; tool: string }>;
            userId: string;
          },
          {
            allSucceeded: boolean;
            results: Array<{
              error?: string;
              result?: any;
              success: boolean;
              tool: string;
            }>;
            summary: string;
          }
        >;
      };
      mutations: {
        addChapterInternal: FunctionReference<
          "mutation",
          "internal",
          {
            content?: string;
            courseId: Id<"courses">;
            lessonId: Id<"courseLessons">;
            position?: number;
            title: string;
          },
          Id<"courseChapters">
        >;
        addLessonInternal: FunctionReference<
          "mutation",
          "internal",
          {
            description?: string;
            moduleId: Id<"courseModules">;
            position?: number;
            title: string;
          },
          Id<"courseLessons">
        >;
        addModuleInternal: FunctionReference<
          "mutation",
          "internal",
          {
            courseId: Id<"courses">;
            description?: string;
            position?: number;
            title: string;
          },
          Id<"courseModules">
        >;
        createCourseInternal: FunctionReference<
          "mutation",
          "internal",
          {
            category?: string;
            checkoutHeadline?: string;
            description?: string;
            price: number;
            skillLevel?: string;
            storeId: string;
            title: string;
            userId: string;
          },
          { courseId: Id<"courses">; slug: string }
        >;
        deleteCourseInternal: FunctionReference<
          "mutation",
          "internal",
          { courseId: Id<"courses">; userId: string },
          null
        >;
        duplicateCourseInternal: FunctionReference<
          "mutation",
          "internal",
          {
            courseId: Id<"courses">;
            newTitle?: string;
            storeId: string;
            userId: string;
          },
          { courseId: Id<"courses">; slug: string; title: string }
        >;
        getCourseDetailsInternal: FunctionReference<
          "query",
          "internal",
          { courseId: Id<"courses"> },
          {
            _id: Id<"courses">;
            category?: string;
            description?: string;
            isPublished?: boolean;
            modules: Array<{
              _id: Id<"courseModules">;
              lessonCount: number;
              title: string;
            }>;
            price?: number;
            slug?: string;
            title: string;
          } | null
        >;
        getCoursesForUser: FunctionReference<
          "query",
          "internal",
          { limit: number; status: string; userId: string },
          Array<{
            _id: Id<"courses">;
            category?: string;
            isPublished?: boolean;
            price?: number;
            slug?: string;
            title: string;
          }>
        >;
        getCourseStatsInternal: FunctionReference<
          "query",
          "internal",
          { courseId: Id<"courses"> },
          {
            chapterCount: number;
            enrollmentCount: number;
            lessonCount: number;
            moduleCount: number;
          }
        >;
        getProductsForUser: FunctionReference<
          "query",
          "internal",
          { limit: number; productType: string; userId: string },
          Array<{
            _id: Id<"digitalProducts">;
            isPublished?: boolean;
            price?: number;
            productType?: string;
            title: string;
          }>
        >;
        searchCoursesByTopicInternal: FunctionReference<
          "query",
          "internal",
          { limit: number; topic: string },
          Array<{
            _id: Id<"courses">;
            category?: string;
            description?: string;
            isPublished?: boolean;
            title: string;
          }>
        >;
        searchUserCourses: FunctionReference<
          "query",
          "internal",
          { limit: number; query: string; userId: string },
          Array<{
            _id: Id<"courses">;
            isPublished?: boolean;
            slug?: string;
            title: string;
          }>
        >;
      };
    };
    webResearch: {
      extractSearchQueries: FunctionReference<
        "action",
        "internal",
        {
          facets: Array<{ name: string; queryHint: string }>;
          maxQueriesPerFacet?: number;
          userInput: string;
        },
        Array<{ facetName: string; queries: Array<string> }>
      >;
      researchTopic: FunctionReference<
        "action",
        "internal",
        {
          facets: Array<{ name: string; queryHint: string }>;
          maxResultsPerFacet?: number;
          query: string;
          useSmartExtraction?: boolean;
        },
        {
          research: Array<{
            facetName: string;
            results: Array<{
              content: string;
              publishedDate?: string;
              score: number;
              title: string;
              url: string;
            }>;
            searchQuery: string;
          }>;
          totalDuration: number;
          totalResults: number;
        }
      >;
      saveResearchToEmbeddings: FunctionReference<
        "action",
        "internal",
        {
          research: Array<{
            content: string;
            facetName: string;
            title: string;
            url: string;
          }>;
          sourceConversationId?: Id<"aiConversations">;
          userId: string;
        },
        { embeddingsCreated: number; errors: Array<string>; success: boolean }
      >;
      searchWeb: FunctionReference<
        "action",
        "internal",
        {
          excludeDomains?: Array<string>;
          includeAnswer?: boolean;
          includeDomains?: Array<string>;
          maxResults?: number;
          query: string;
          searchDepth?: "basic" | "advanced";
        },
        {
          answer: string | null;
          error?: string;
          results: Array<{
            content: string;
            publishedDate?: string;
            score: number;
            title: string;
            url: string;
          }>;
          searchDuration: number;
          success: boolean;
        }
      >;
    };
  };
  migrations: {
    backfillCourseCustomers: {
      backfillCourseCustomers: FunctionReference<
        "mutation",
        "internal",
        {},
        {
          customersCreated: number;
          customersUpdated: number;
          errors: number;
          success: boolean;
        }
      >;
      backfillSubscriptionCustomers: FunctionReference<
        "mutation",
        "internal",
        {},
        {
          customersCreated: number;
          customersUpdated: number;
          errors: number;
          success: boolean;
        }
      >;
    };
    backfillCustomers: {
      backfillCustomersFromPurchases: FunctionReference<
        "mutation",
        "internal",
        {},
        {
          customersCreated: number;
          customersUpdated: number;
          errors: number;
          success: boolean;
        }
      >;
    };
    migrateAbletonRacksToEffectChains: {
      migrateAbletonRacksToEffectChains: FunctionReference<
        "mutation",
        "internal",
        {},
        { errors: number; migrated: number; total: number }
      >;
      rollbackEffectChainMigration: FunctionReference<
        "mutation",
        "internal",
        {},
        { errors: number; reverted: number; total: number }
      >;
    };
    universalProductsMigration: {
      getMigrationStatus: FunctionReference<
        "query",
        "internal",
        {},
        {
          migrationComplete: boolean;
          playlistsLinkedToProducts: number;
          playlistsTotal: number;
          productsWithCategory: number;
          productsWithoutCategory: number;
          totalProducts: number;
        }
      >;
      migratePlaylistToProduct: FunctionReference<
        "mutation",
        "internal",
        {
          followGateConfig?: {
            customMessage?: string;
            minFollowsRequired: number;
            requireEmail: boolean;
            requireInstagram: boolean;
            requireSpotify: boolean;
            requireTiktok: boolean;
            requireYoutube: boolean;
            socialLinks: {
              instagram?: string;
              spotify?: string;
              tiktok?: string;
              youtube?: string;
            };
          };
          playlistId: Id<"curatorPlaylists">;
          pricingModel: "free_with_gate" | "paid";
          storeId: string;
          userId: string;
        },
        Id<"digitalProducts">
      >;
      previewUniversalProductsMigration: FunctionReference<
        "query",
        "internal",
        {},
        { breakdown: any; productsToMigrate: number; totalProducts: number }
      >;
      rollbackUniversalProductsMigration: FunctionReference<
        "mutation",
        "internal",
        {},
        { productsUpdated: number; success: boolean }
      >;
      runUniversalProductsMigration: FunctionReference<
        "mutation",
        "internal",
        { dryRun?: boolean },
        { errors: Array<string>; productsUpdated: number; success: boolean }
      >;
    };
  };
  model: {
    courses: {
      getCourseDetailsSimple: FunctionReference<
        "query",
        "internal",
        { courseId: Id<"courses">; userId: string },
        string | null
      >;
      getSimpleCourseData: FunctionReference<
        "query",
        "internal",
        { userId: string },
        string
      >;
    };
  };
  notes: {
    getModulesForStyleAnalysis: FunctionReference<
      "query",
      "internal",
      { courseId: Id<"courses"> },
      Array<{ description?: string; title: string }>
    >;
    getNoteInternal: FunctionReference<
      "query",
      "internal",
      { noteId: Id<"notes"> },
      {
        _id: Id<"notes">;
        category?: string;
        content: string;
        isArchived: boolean;
        isProcessedForRAG: boolean;
        plainTextContent?: string;
        priority?: "low" | "medium" | "high" | "urgent";
        storeId: string;
        tags: Array<string>;
        title: string;
        userId: string;
        wordCount?: number;
      } | null
    >;
    linkNotesToCourse: FunctionReference<
      "mutation",
      "internal",
      { courseId: Id<"courses">; noteIds: Array<Id<"notes">> },
      null
    >;
    markNoteAsProcessed: FunctionReference<
      "mutation",
      "internal",
      { noteId: Id<"notes"> },
      null
    >;
    processNoteForRAG: FunctionReference<
      "action",
      "internal",
      { noteId: Id<"notes"> },
      null
    >;
    validateNotesAccess: FunctionReference<
      "query",
      "internal",
      { noteIds: Array<Id<"notes">>; userId: string },
      Array<{
        _id: Id<"notes">;
        category?: string;
        content: string;
        plainTextContent?: string;
        readTimeMinutes?: number;
        status: "draft" | "in_progress" | "completed" | "archived";
        tags: Array<string>;
        title: string;
        wordCount?: number;
      }>
    >;
  };
  noteTemplates: {
    createDefaultTemplates: FunctionReference<
      "mutation",
      "internal",
      { userId: string },
      Array<Id<"noteTemplates">>
    >;
  };
  notificationPreferences: {
    shouldSendEmailInternal: FunctionReference<
      "query",
      "internal",
      {
        category:
          | "announcements"
          | "courseUpdates"
          | "newContent"
          | "mentions"
          | "replies"
          | "purchases"
          | "earnings"
          | "systemAlerts"
          | "marketing";
        userId: string;
      },
      boolean
    >;
  };
  notifications: {
    getNotificationById: FunctionReference<
      "query",
      "internal",
      { notificationId: Id<"notifications"> },
      any | null
    >;
    getUserByClerkId: FunctionReference<
      "query",
      "internal",
      { clerkId: string },
      any | null
    >;
    markEmailSent: FunctionReference<
      "mutation",
      "internal",
      { notificationId: Id<"notifications"> },
      null
    >;
    markEmailSkipped: FunctionReference<
      "mutation",
      "internal",
      { notificationId: Id<"notifications"> },
      null
    >;
    processNotificationEmails: FunctionReference<
      "action",
      "internal",
      {
        category:
          | "announcements"
          | "courseUpdates"
          | "newContent"
          | "mentions"
          | "replies"
          | "purchases"
          | "earnings"
          | "systemAlerts"
          | "marketing";
        notificationIds: Array<Id<"notifications">>;
      },
      null
    >;
  };
  rag: {
    generateEmbedding: FunctionReference<
      "action",
      "internal",
      { content: string; embeddingId: Id<"embeddings"> },
      null
    >;
    getEmbeddings: FunctionReference<
      "query",
      "internal",
      {
        category?: string;
        limit?: number;
        sourceType?:
          | "course"
          | "chapter"
          | "lesson"
          | "document"
          | "note"
          | "custom"
          | "socialPost";
        userId?: string;
      },
      Array<{
        _creationTime: number;
        _id: Id<"embeddings">;
        category?: string;
        content: string;
        embedding: Array<number>;
        metadata?: any;
        sourceId?: string;
        sourceType?:
          | "course"
          | "chapter"
          | "lesson"
          | "document"
          | "note"
          | "custom"
          | "socialPost";
        title?: string;
        userId: string;
      }>
    >;
    updateEmbedding: FunctionReference<
      "mutation",
      "internal",
      { embedding: Array<number>; embeddingId: Id<"embeddings"> },
      null
    >;
  };
  resendDomainHelpers: {
    createDomainFromResend: FunctionReference<
      "mutation",
      "internal",
      {
        createdAt: number;
        domain: string;
        region: string;
        resendDomainId: string;
        status: string;
      },
      Id<"emailDomains">
    >;
    findDomainByName: FunctionReference<
      "mutation",
      "internal",
      { domain: string },
      null | { _id: Id<"emailDomains"> }
    >;
    getDomainById: FunctionReference<
      "mutation",
      "internal",
      { domainId: Id<"emailDomains"> },
      null | { resendDomainId?: string }
    >;
    markDomainActive: FunctionReference<
      "mutation",
      "internal",
      { domainId: Id<"emailDomains"> },
      null
    >;
    updateDomainFromResend: FunctionReference<
      "mutation",
      "internal",
      {
        createdAt: number;
        domainId: Id<"emailDomains">;
        region: string;
        resendDomainId: string;
        status: string;
      },
      null
    >;
  };
  sampleGeneration: {
    generateSoundEffectFromText: FunctionReference<
      "action",
      "internal",
      { description: string; duration: number },
      {
        audioUrl?: string;
        error?: string;
        filePath?: string;
        fileSize?: number;
        format?: string;
        storageId?: Id<"_storage">;
        success: boolean;
      }
    >;
  };
  scriptIllustrationMutations: {
    completeJob: FunctionReference<
      "mutation",
      "internal",
      {
        errors: Array<string>;
        illustrationIds: Array<Id<"scriptIllustrations">>;
        jobId: Id<"scriptIllustrationJobs">;
      },
      any
    >;
    createCompleteIllustration: FunctionReference<
      "mutation",
      "internal",
      {
        embedding?: Array<number>;
        embeddingModel?: string;
        generationModel: string;
        generationStatus: "pending" | "generating" | "completed" | "failed";
        illustrationPrompt: string;
        imageStorageId?: Id<"_storage">;
        imageUrl: string;
        scriptId?: string;
        sentence: string;
        sentenceIndex: number;
        sourceType: "course" | "lesson" | "script" | "custom";
        storeId?: string;
        userId: string;
      },
      any
    >;
    createIllustration: FunctionReference<
      "mutation",
      "internal",
      {
        generationModel: string;
        illustrationPrompt: string;
        scriptId?: string;
        sentence: string;
        sentenceIndex: number;
        sourceType: "course" | "lesson" | "script" | "custom";
        storeId?: string;
        userId: string;
      },
      any
    >;
    createJob: FunctionReference<
      "mutation",
      "internal",
      {
        scriptText: string;
        scriptTitle?: string;
        sourceId?: string;
        sourceType: "course" | "lesson" | "script" | "custom";
        storeId?: string;
        totalSentences: number;
        userId: string;
      },
      any
    >;
    generateUploadUrl: FunctionReference<"mutation", "internal", {}, any>;
    getStorageUrl: FunctionReference<
      "query",
      "internal",
      { storageId: Id<"_storage"> },
      any
    >;
    updateIllustrationEmbedding: FunctionReference<
      "mutation",
      "internal",
      {
        embedding: Array<number>;
        embeddingModel: string;
        illustrationId: Id<"scriptIllustrations">;
      },
      any
    >;
    updateIllustrationImage: FunctionReference<
      "mutation",
      "internal",
      {
        illustrationId: Id<"scriptIllustrations">;
        imageUrl: string;
        status: "pending" | "generating" | "completed" | "failed";
        storageId: Id<"_storage">;
      },
      any
    >;
    updateIllustrationStatus: FunctionReference<
      "mutation",
      "internal",
      {
        error?: string;
        illustrationId: Id<"scriptIllustrations">;
        status: "pending" | "generating" | "completed" | "failed";
      },
      any
    >;
    updateJobProgress: FunctionReference<
      "mutation",
      "internal",
      {
        errors: Array<string>;
        illustrationIds: Array<Id<"scriptIllustrations">>;
        jobId: Id<"scriptIllustrationJobs">;
        processedSentences: number;
      },
      any
    >;
    updateJobStatus: FunctionReference<
      "mutation",
      "internal",
      {
        jobId: Id<"scriptIllustrationJobs">;
        status: "pending" | "processing" | "completed" | "failed";
      },
      any
    >;
  };
  scriptIllustrationQueries: {
    getAllIllustrationsWithEmbeddings: FunctionReference<
      "query",
      "internal",
      {
        limit?: number;
        scriptId?: string;
        sourceType?: "course" | "lesson" | "script" | "custom";
        userId?: string;
      },
      any
    >;
    getIllustrationById: FunctionReference<
      "query",
      "internal",
      { illustrationId: Id<"scriptIllustrations"> },
      any
    >;
  };
  scriptIllustrations: {
    processSentences: FunctionReference<
      "action",
      "internal",
      {
        generateEmbeddings: boolean;
        imageModel: string;
        jobId: Id<"scriptIllustrationJobs">;
        scriptId?: string;
        sentences: Array<string>;
        sourceType: "course" | "lesson" | "script" | "custom";
        storeId?: string;
        userId: string;
      },
      any
    >;
  };
  sendTimeOptimization: {
    decayEngagementScores: FunctionReference<
      "mutation",
      "internal",
      {},
      { processed: number; updated: number }
    >;
  };
  socialDM: {
    sendDMInternal: FunctionReference<
      "action",
      "internal",
      {
        accessToken: string;
        facebookPageId?: string;
        instagramBusinessAccountId?: string;
        message: string;
        platform: "instagram" | "twitter" | "facebook";
        recipientId: string;
      },
      any
    >;
  };
  socialDMQueries: {
    getAccountById: FunctionReference<
      "query",
      "internal",
      { accountId: Id<"socialAccounts"> },
      any
    >;
    getAccountByPlatformUserId: FunctionReference<
      "query",
      "internal",
      { platform: string; platformUserId: string },
      any
    >;
    getFacebookToken: FunctionReference<
      "query",
      "internal",
      { userId: string },
      any
    >;
    getTwitterToken: FunctionReference<
      "query",
      "internal",
      { userId: string },
      any
    >;
    logDM: FunctionReference<
      "mutation",
      "internal",
      {
        accountId: Id<"socialAccounts">;
        automationId?: string;
        error?: string;
        message: string;
        messageId?: string;
        platform: string;
        recipientId: string;
        success: boolean;
        workflowExecutionId?: string;
      },
      any
    >;
  };
  socialMedia: {
    getPostsToPublish: FunctionReference<"query", "internal", {}, Array<any>>;
    updatePostStatus: FunctionReference<
      "mutation",
      "internal",
      {
        errorMessage?: string;
        platformPostId?: string;
        platformPostUrl?: string;
        postId: string;
        status: string;
      },
      null
    >;
  };
  socialMediaActions: {
    publishScheduledPost: FunctionReference<
      "action",
      "internal",
      { postId: Id<"scheduledPosts"> },
      null
    >;
    refreshOAuthToken: FunctionReference<
      "action",
      "internal",
      {
        accountId: Id<"socialAccounts">;
        platform: "instagram" | "twitter" | "facebook" | "tiktok" | "linkedin";
        refreshToken: string;
      },
      null
    >;
  };
  socialMediaPosts: {
    getChapterContentForSocialPost: FunctionReference<
      "query",
      "internal",
      { chapterId: Id<"courseChapters"> },
      {
        _id: Id<"courseChapters">;
        courseId: string;
        courseTitle?: string;
        description?: string;
        lessonTitle?: string;
        moduleTitle?: string;
        title: string;
      } | null
    >;
  };
  socialPostEmbeddings: {
    processAutomationPosts: FunctionReference<
      "action",
      "internal",
      { automationId: Id<"automations">; userId: string },
      { failed: number; processed: number; skipped: number }
    >;
    processSocialPostEmbedding: FunctionReference<
      "action",
      "internal",
      {
        automationId: Id<"automations">;
        caption?: string;
        mediaType: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | "GLOBAL";
        mediaUrl: string;
        permalink?: string;
        postId: string;
        userId: string;
      },
      { embeddingId?: Id<"embeddings">; error?: string; success: boolean }
    >;
    searchSocialPostContext: FunctionReference<
      "action",
      "internal",
      { limit?: number; query: string; threshold?: number; userId: string },
      { context: string; matchCount: number }
    >;
    transcribeVideoAudio: FunctionReference<
      "action",
      "internal",
      { postId: string; videoUrl: string },
      { error?: string; success: boolean; transcript?: string }
    >;
  };
  socialPostEmbeddingsMutations: {
    createSocialPostEmbedding: FunctionReference<
      "mutation",
      "internal",
      {
        automationId: Id<"automations">;
        content: string;
        hasTranscript: boolean;
        mediaType: string;
        permalink?: string;
        postId: string;
        title: string;
        userId: string;
      },
      Id<"embeddings">
    >;
    deleteSocialPostEmbedding: FunctionReference<
      "mutation",
      "internal",
      { postId: string },
      null
    >;
    getPostsForAutomation: FunctionReference<
      "query",
      "internal",
      { automationId: Id<"automations"> },
      Array<{
        _id: Id<"posts">;
        caption?: string;
        media: string;
        mediaType: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | "GLOBAL";
        permalink?: string;
        postId: string;
      }>
    >;
    getSocialPostEmbeddings: FunctionReference<
      "query",
      "internal",
      { limit?: number; userId: string },
      Array<{
        _id: Id<"embeddings">;
        content: string;
        embedding: Array<number>;
        metadata?: any;
        sourceId?: string;
        title?: string;
      }>
    >;
  };
  universalProductsExamples: {
    cleanUpTestProducts: FunctionReference<
      "mutation",
      "internal",
      { storeId: string },
      { productsDeleted: number; success: boolean }
    >;
    createCompleteTestSuite: FunctionReference<
      "mutation",
      "internal",
      { playlistId?: Id<"curatorPlaylists">; storeId: string; userId: string },
      { productsCreated: Array<Id<"digitalProducts">>; success: boolean }
    >;
    createTestAbletonRackPaid: FunctionReference<
      "mutation",
      "internal",
      { storeId: string; userId: string },
      Id<"digitalProducts">
    >;
    createTestBeatLeasePaid: FunctionReference<
      "mutation",
      "internal",
      { storeId: string; userId: string },
      Id<"digitalProducts">
    >;
    createTestPlaylistCurationFree: FunctionReference<
      "mutation",
      "internal",
      { playlistId: Id<"curatorPlaylists">; storeId: string; userId: string },
      Id<"digitalProducts">
    >;
    createTestPlaylistCurationPaid: FunctionReference<
      "mutation",
      "internal",
      { playlistId: Id<"curatorPlaylists">; storeId: string; userId: string },
      Id<"digitalProducts">
    >;
    createTestPresetPackFree: FunctionReference<
      "mutation",
      "internal",
      { storeId: string; userId: string },
      Id<"digitalProducts">
    >;
    createTestSamplePackFree: FunctionReference<
      "mutation",
      "internal",
      { storeId: string; userId: string },
      Id<"digitalProducts">
    >;
    exampleCheckAccess: FunctionReference<
      "query",
      "internal",
      { email?: string; productId: Id<"digitalProducts">; userId?: string },
      any
    >;
    exampleGetPlaylistProducts: FunctionReference<
      "query",
      "internal",
      { storeId?: string },
      Array<any>
    >;
    exampleGetSamplePacks: FunctionReference<
      "query",
      "internal",
      { storeId: string },
      Array<any>
    >;
  };
  users: {
    getUserByClerkId: FunctionReference<
      "query",
      "internal",
      { clerkId: string },
      {
        _creationTime: number;
        _id: Id<"users">;
        email?: string;
        name?: string;
      } | null
    >;
  };
  webAnalytics: {
    backfillSlugs: FunctionReference<"mutation", "internal", {}, any>;
    ingestEvents: FunctionReference<
      "mutation",
      "internal",
      { events: Array<any> },
      any
    >;
  };
  webhooks: {
    facebook: {
      processWebhook: FunctionReference<
        "action",
        "internal",
        { payload: any },
        null
      >;
      sendTypingIndicator: FunctionReference<
        "action",
        "internal",
        {
          action: "typing_on" | "typing_off";
          pageAccessToken: string;
          pageId: string;
          recipientId: string;
        },
        boolean
      >;
      verifyWebhook: FunctionReference<
        "action",
        "internal",
        { challenge: string; mode: string; token: string },
        string | null
      >;
    };
    instagram: {
      processWebhook: FunctionReference<
        "action",
        "internal",
        { payload: any },
        null
      >;
    };
    twitter: {
      generateCRCResponse: FunctionReference<
        "action",
        "internal",
        { crcToken: string },
        string
      >;
      processWebhook: FunctionReference<
        "action",
        "internal",
        { payload: any },
        null
      >;
    };
  };
  workflowActions: {
    processExecution: FunctionReference<
      "action",
      "internal",
      { executionId: Id<"workflowExecutions"> },
      any
    >;
    processWorkflowExecutions: FunctionReference<"action", "internal", {}, any>;
    sendNotificationEmail: FunctionReference<
      "action",
      "internal",
      { message: string; subject: string; to: string },
      any
    >;
    sendWebhook: FunctionReference<
      "action",
      "internal",
      { payload: string; url: string },
      any
    >;
    sendWorkflowEmail: FunctionReference<
      "action",
      "internal",
      {
        email: string;
        executionId: Id<"workflowExecutions">;
        firstName: string;
        htmlContent: string;
        name: string;
        previewText?: string;
        subject: string;
      },
      any
    >;
  };
  workflowHelpers: {
    addTagToContact: FunctionReference<
      "mutation",
      "internal",
      { contactId: Id<"emailContacts">; storeId: string; tagName: string },
      any
    >;
    getContactInternal: FunctionReference<
      "query",
      "internal",
      { contactId: Id<"emailContacts"> },
      any
    >;
    getDueExecutions: FunctionReference<
      "query",
      "internal",
      { limit: number },
      any
    >;
    getEmailTemplateInternal: FunctionReference<
      "query",
      "internal",
      { templateId: Id<"emailTemplates"> },
      any
    >;
    getExecution: FunctionReference<
      "query",
      "internal",
      { executionId: Id<"workflowExecutions"> },
      any
    >;
    getStoreOwnerEmail: FunctionReference<
      "query",
      "internal",
      { storeId: string },
      any
    >;
    getTagsByIds: FunctionReference<
      "query",
      "internal",
      { tagIds: Array<Id<"emailTags">> },
      any
    >;
    getWorkflowInternal: FunctionReference<
      "query",
      "internal",
      { workflowId: Id<"emailWorkflows"> },
      any
    >;
    incrementContactEmailsSent: FunctionReference<
      "mutation",
      "internal",
      { contactId: Id<"emailContacts"> },
      any
    >;
    markExecutionCancelled: FunctionReference<
      "mutation",
      "internal",
      { executionId: Id<"workflowExecutions"> },
      any
    >;
    markExecutionCompleted: FunctionReference<
      "mutation",
      "internal",
      { executionId: Id<"workflowExecutions"> },
      any
    >;
    markExecutionFailed: FunctionReference<
      "mutation",
      "internal",
      { errorMessage: string; executionId: Id<"workflowExecutions"> },
      any
    >;
    removeTagFromContact: FunctionReference<
      "mutation",
      "internal",
      { contactId: Id<"emailContacts">; tagName: string },
      any
    >;
    scheduleNextNode: FunctionReference<
      "mutation",
      "internal",
      {
        executionId: Id<"workflowExecutions">;
        nextNodeId?: string;
        scheduledFor: number;
      },
      any
    >;
    updateExecutionStatus: FunctionReference<
      "mutation",
      "internal",
      {
        executionId: Id<"workflowExecutions">;
        status: "pending" | "running" | "completed" | "failed" | "cancelled";
      },
      any
    >;
  };
};

export declare const components: {
  rateLimiter: {
    lib: {
      checkRateLimit: FunctionReference<
        "query",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          count?: number;
          key?: string;
          name: string;
          reserve?: boolean;
          throws?: boolean;
        },
        { ok: true; retryAfter?: number } | { ok: false; retryAfter: number }
      >;
      clearAll: FunctionReference<
        "mutation",
        "internal",
        { before?: number },
        null
      >;
      getServerTime: FunctionReference<"mutation", "internal", {}, number>;
      getValue: FunctionReference<
        "query",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          key?: string;
          name: string;
          sampleShards?: number;
        },
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          shard: number;
          ts: number;
          value: number;
        }
      >;
      rateLimit: FunctionReference<
        "mutation",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          count?: number;
          key?: string;
          name: string;
          reserve?: boolean;
          throws?: boolean;
        },
        { ok: true; retryAfter?: number } | { ok: false; retryAfter: number }
      >;
      resetRateLimit: FunctionReference<
        "mutation",
        "internal",
        { key?: string; name: string },
        null
      >;
    };
    time: {
      getServerTime: FunctionReference<"mutation", "internal", {}, number>;
    };
  };
  workflow: {
    event: {
      create: FunctionReference<
        "mutation",
        "internal",
        { name: string; workflowId: string },
        string
      >;
      send: FunctionReference<
        "mutation",
        "internal",
        {
          eventId?: string;
          name?: string;
          result:
            | { kind: "success"; returnValue: any }
            | { error: string; kind: "failed" }
            | { kind: "canceled" };
          workflowId?: string;
          workpoolOptions?: {
            defaultRetryBehavior?: {
              base: number;
              initialBackoffMs: number;
              maxAttempts: number;
            };
            logLevel?: "DEBUG" | "TRACE" | "INFO" | "REPORT" | "WARN" | "ERROR";
            maxParallelism?: number;
            retryActionsByDefault?: boolean;
          };
        },
        string
      >;
    };
    journal: {
      load: FunctionReference<
        "query",
        "internal",
        { shortCircuit?: boolean; workflowId: string },
        {
          blocked?: boolean;
          journalEntries: Array<{
            _creationTime: number;
            _id: string;
            step:
              | {
                  args: any;
                  argsSize: number;
                  completedAt?: number;
                  functionType: "query" | "mutation" | "action";
                  handle: string;
                  inProgress: boolean;
                  kind?: "function";
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                  workId?: string;
                }
              | {
                  args: any;
                  argsSize: number;
                  completedAt?: number;
                  handle: string;
                  inProgress: boolean;
                  kind: "workflow";
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                  workflowId?: string;
                }
              | {
                  args: { eventId?: string };
                  argsSize: number;
                  completedAt?: number;
                  eventId?: string;
                  inProgress: boolean;
                  kind: "event";
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                };
            stepNumber: number;
            workflowId: string;
          }>;
          logLevel: "DEBUG" | "TRACE" | "INFO" | "REPORT" | "WARN" | "ERROR";
          ok: boolean;
          workflow: {
            _creationTime: number;
            _id: string;
            args: any;
            generationNumber: number;
            logLevel?: any;
            name?: string;
            onComplete?: { context?: any; fnHandle: string };
            runResult?:
              | { kind: "success"; returnValue: any }
              | { error: string; kind: "failed" }
              | { kind: "canceled" };
            startedAt?: any;
            state?: any;
            workflowHandle: string;
          };
        }
      >;
      startSteps: FunctionReference<
        "mutation",
        "internal",
        {
          generationNumber: number;
          steps: Array<{
            retry?:
              | boolean
              | { base: number; initialBackoffMs: number; maxAttempts: number };
            schedulerOptions?: { runAt?: number } | { runAfter?: number };
            step:
              | {
                  args: any;
                  argsSize: number;
                  completedAt?: number;
                  functionType: "query" | "mutation" | "action";
                  handle: string;
                  inProgress: boolean;
                  kind?: "function";
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                  workId?: string;
                }
              | {
                  args: any;
                  argsSize: number;
                  completedAt?: number;
                  handle: string;
                  inProgress: boolean;
                  kind: "workflow";
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                  workflowId?: string;
                }
              | {
                  args: { eventId?: string };
                  argsSize: number;
                  completedAt?: number;
                  eventId?: string;
                  inProgress: boolean;
                  kind: "event";
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                };
          }>;
          workflowId: string;
          workpoolOptions?: {
            defaultRetryBehavior?: {
              base: number;
              initialBackoffMs: number;
              maxAttempts: number;
            };
            logLevel?: "DEBUG" | "TRACE" | "INFO" | "REPORT" | "WARN" | "ERROR";
            maxParallelism?: number;
            retryActionsByDefault?: boolean;
          };
        },
        Array<{
          _creationTime: number;
          _id: string;
          step:
            | {
                args: any;
                argsSize: number;
                completedAt?: number;
                functionType: "query" | "mutation" | "action";
                handle: string;
                inProgress: boolean;
                kind?: "function";
                name: string;
                runResult?:
                  | { kind: "success"; returnValue: any }
                  | { error: string; kind: "failed" }
                  | { kind: "canceled" };
                startedAt: number;
                workId?: string;
              }
            | {
                args: any;
                argsSize: number;
                completedAt?: number;
                handle: string;
                inProgress: boolean;
                kind: "workflow";
                name: string;
                runResult?:
                  | { kind: "success"; returnValue: any }
                  | { error: string; kind: "failed" }
                  | { kind: "canceled" };
                startedAt: number;
                workflowId?: string;
              }
            | {
                args: { eventId?: string };
                argsSize: number;
                completedAt?: number;
                eventId?: string;
                inProgress: boolean;
                kind: "event";
                name: string;
                runResult?:
                  | { kind: "success"; returnValue: any }
                  | { error: string; kind: "failed" }
                  | { kind: "canceled" };
                startedAt: number;
              };
          stepNumber: number;
          workflowId: string;
        }>
      >;
    };
    workflow: {
      cancel: FunctionReference<
        "mutation",
        "internal",
        { workflowId: string },
        null
      >;
      cleanup: FunctionReference<
        "mutation",
        "internal",
        { workflowId: string },
        boolean
      >;
      complete: FunctionReference<
        "mutation",
        "internal",
        {
          generationNumber: number;
          runResult:
            | { kind: "success"; returnValue: any }
            | { error: string; kind: "failed" }
            | { kind: "canceled" };
          workflowId: string;
        },
        null
      >;
      create: FunctionReference<
        "mutation",
        "internal",
        {
          maxParallelism?: number;
          onComplete?: { context?: any; fnHandle: string };
          startAsync?: boolean;
          workflowArgs: any;
          workflowHandle: string;
          workflowName: string;
        },
        string
      >;
      getStatus: FunctionReference<
        "query",
        "internal",
        { workflowId: string },
        {
          inProgress: Array<{
            _creationTime: number;
            _id: string;
            step:
              | {
                  args: any;
                  argsSize: number;
                  completedAt?: number;
                  functionType: "query" | "mutation" | "action";
                  handle: string;
                  inProgress: boolean;
                  kind?: "function";
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                  workId?: string;
                }
              | {
                  args: any;
                  argsSize: number;
                  completedAt?: number;
                  handle: string;
                  inProgress: boolean;
                  kind: "workflow";
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                  workflowId?: string;
                }
              | {
                  args: { eventId?: string };
                  argsSize: number;
                  completedAt?: number;
                  eventId?: string;
                  inProgress: boolean;
                  kind: "event";
                  name: string;
                  runResult?:
                    | { kind: "success"; returnValue: any }
                    | { error: string; kind: "failed" }
                    | { kind: "canceled" };
                  startedAt: number;
                };
            stepNumber: number;
            workflowId: string;
          }>;
          logLevel: "DEBUG" | "TRACE" | "INFO" | "REPORT" | "WARN" | "ERROR";
          workflow: {
            _creationTime: number;
            _id: string;
            args: any;
            generationNumber: number;
            logLevel?: any;
            name?: string;
            onComplete?: { context?: any; fnHandle: string };
            runResult?:
              | { kind: "success"; returnValue: any }
              | { error: string; kind: "failed" }
              | { kind: "canceled" };
            startedAt?: any;
            state?: any;
            workflowHandle: string;
          };
        }
      >;
      listSteps: FunctionReference<
        "query",
        "internal",
        {
          order: "asc" | "desc";
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          workflowId: string;
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            args: any;
            completedAt?: number;
            eventId?: string;
            kind: "function" | "workflow" | "event";
            name: string;
            nestedWorkflowId?: string;
            runResult?:
              | { kind: "success"; returnValue: any }
              | { error: string; kind: "failed" }
              | { kind: "canceled" };
            startedAt: number;
            stepId: string;
            stepNumber: number;
            workId?: string;
            workflowId: string;
          }>;
          pageStatus?: "SplitRecommended" | "SplitRequired" | null;
          splitCursor?: string | null;
        }
      >;
    };
  };
  actionCache: {
    crons: {
      purge: FunctionReference<
        "mutation",
        "internal",
        { expiresAt?: number },
        null
      >;
    };
    lib: {
      get: FunctionReference<
        "query",
        "internal",
        { args: any; name: string; ttl: number | null },
        { kind: "hit"; value: any } | { expiredEntry?: string; kind: "miss" }
      >;
      put: FunctionReference<
        "mutation",
        "internal",
        {
          args: any;
          expiredEntry?: string;
          name: string;
          ttl: number | null;
          value: any;
        },
        { cacheHit: boolean; deletedExpiredEntry: boolean }
      >;
      remove: FunctionReference<
        "mutation",
        "internal",
        { args: any; name: string },
        null
      >;
      removeAll: FunctionReference<
        "mutation",
        "internal",
        { batchSize?: number; before?: number; name?: string },
        null
      >;
    };
  };
  actionRetrier: {
    public: {
      cancel: FunctionReference<
        "mutation",
        "internal",
        { runId: string },
        boolean
      >;
      cleanup: FunctionReference<
        "mutation",
        "internal",
        { runId: string },
        any
      >;
      start: FunctionReference<
        "mutation",
        "internal",
        {
          functionArgs: any;
          functionHandle: string;
          options: {
            base: number;
            initialBackoffMs: number;
            logLevel: "DEBUG" | "INFO" | "WARN" | "ERROR";
            maxFailures: number;
            onComplete?: string;
            runAfter?: number;
            runAt?: number;
          };
        },
        string
      >;
      status: FunctionReference<
        "query",
        "internal",
        { runId: string },
        | { type: "inProgress" }
        | {
            result:
              | { returnValue: any; type: "success" }
              | { error: string; type: "failed" }
              | { type: "canceled" };
            type: "completed";
          }
      >;
    };
  };
  videoAnalytics: {
    btree: {
      aggregateBetween: FunctionReference<
        "query",
        "internal",
        { k1?: any; k2?: any; namespace?: any },
        { count: number; sum: number }
      >;
      aggregateBetweenBatch: FunctionReference<
        "query",
        "internal",
        { queries: Array<{ k1?: any; k2?: any; namespace?: any }> },
        Array<{ count: number; sum: number }>
      >;
      atNegativeOffset: FunctionReference<
        "query",
        "internal",
        { k1?: any; k2?: any; namespace?: any; offset: number },
        { k: any; s: number; v: any }
      >;
      atOffset: FunctionReference<
        "query",
        "internal",
        { k1?: any; k2?: any; namespace?: any; offset: number },
        { k: any; s: number; v: any }
      >;
      atOffsetBatch: FunctionReference<
        "query",
        "internal",
        {
          queries: Array<{
            k1?: any;
            k2?: any;
            namespace?: any;
            offset: number;
          }>;
        },
        Array<{ k: any; s: number; v: any }>
      >;
      get: FunctionReference<
        "query",
        "internal",
        { key: any; namespace?: any },
        null | { k: any; s: number; v: any }
      >;
      offset: FunctionReference<
        "query",
        "internal",
        { k1?: any; key: any; namespace?: any },
        number
      >;
      offsetUntil: FunctionReference<
        "query",
        "internal",
        { k2?: any; key: any; namespace?: any },
        number
      >;
      paginate: FunctionReference<
        "query",
        "internal",
        {
          cursor?: string;
          k1?: any;
          k2?: any;
          limit: number;
          namespace?: any;
          order: "asc" | "desc";
        },
        {
          cursor: string;
          isDone: boolean;
          page: Array<{ k: any; s: number; v: any }>;
        }
      >;
      paginateNamespaces: FunctionReference<
        "query",
        "internal",
        { cursor?: string; limit: number },
        { cursor: string; isDone: boolean; page: Array<any> }
      >;
      validate: FunctionReference<
        "query",
        "internal",
        { namespace?: any },
        any
      >;
    };
    inspect: {
      display: FunctionReference<"query", "internal", { namespace?: any }, any>;
      dump: FunctionReference<"query", "internal", { namespace?: any }, string>;
      inspectNode: FunctionReference<
        "query",
        "internal",
        { namespace?: any; node?: string },
        null
      >;
      listTreeNodes: FunctionReference<
        "query",
        "internal",
        { take?: number },
        Array<{
          _creationTime: number;
          _id: string;
          aggregate?: { count: number; sum: number };
          items: Array<{ k: any; s: number; v: any }>;
          subtrees: Array<string>;
        }>
      >;
      listTrees: FunctionReference<
        "query",
        "internal",
        { take?: number },
        Array<{
          _creationTime: number;
          _id: string;
          maxNodeSize: number;
          namespace?: any;
          root: string;
        }>
      >;
    };
    public: {
      clear: FunctionReference<
        "mutation",
        "internal",
        { maxNodeSize?: number; namespace?: any; rootLazy?: boolean },
        null
      >;
      delete_: FunctionReference<
        "mutation",
        "internal",
        { key: any; namespace?: any },
        null
      >;
      deleteIfExists: FunctionReference<
        "mutation",
        "internal",
        { key: any; namespace?: any },
        any
      >;
      init: FunctionReference<
        "mutation",
        "internal",
        { maxNodeSize?: number; namespace?: any; rootLazy?: boolean },
        null
      >;
      insert: FunctionReference<
        "mutation",
        "internal",
        { key: any; namespace?: any; summand?: number; value: any },
        null
      >;
      makeRootLazy: FunctionReference<
        "mutation",
        "internal",
        { namespace?: any },
        null
      >;
      replace: FunctionReference<
        "mutation",
        "internal",
        {
          currentKey: any;
          namespace?: any;
          newKey: any;
          newNamespace?: any;
          summand?: number;
          value: any;
        },
        null
      >;
      replaceOrInsert: FunctionReference<
        "mutation",
        "internal",
        {
          currentKey: any;
          namespace?: any;
          newKey: any;
          newNamespace?: any;
          summand?: number;
          value: any;
        },
        any
      >;
    };
  };
  courseAnalytics: {
    btree: {
      aggregateBetween: FunctionReference<
        "query",
        "internal",
        { k1?: any; k2?: any; namespace?: any },
        { count: number; sum: number }
      >;
      aggregateBetweenBatch: FunctionReference<
        "query",
        "internal",
        { queries: Array<{ k1?: any; k2?: any; namespace?: any }> },
        Array<{ count: number; sum: number }>
      >;
      atNegativeOffset: FunctionReference<
        "query",
        "internal",
        { k1?: any; k2?: any; namespace?: any; offset: number },
        { k: any; s: number; v: any }
      >;
      atOffset: FunctionReference<
        "query",
        "internal",
        { k1?: any; k2?: any; namespace?: any; offset: number },
        { k: any; s: number; v: any }
      >;
      atOffsetBatch: FunctionReference<
        "query",
        "internal",
        {
          queries: Array<{
            k1?: any;
            k2?: any;
            namespace?: any;
            offset: number;
          }>;
        },
        Array<{ k: any; s: number; v: any }>
      >;
      get: FunctionReference<
        "query",
        "internal",
        { key: any; namespace?: any },
        null | { k: any; s: number; v: any }
      >;
      offset: FunctionReference<
        "query",
        "internal",
        { k1?: any; key: any; namespace?: any },
        number
      >;
      offsetUntil: FunctionReference<
        "query",
        "internal",
        { k2?: any; key: any; namespace?: any },
        number
      >;
      paginate: FunctionReference<
        "query",
        "internal",
        {
          cursor?: string;
          k1?: any;
          k2?: any;
          limit: number;
          namespace?: any;
          order: "asc" | "desc";
        },
        {
          cursor: string;
          isDone: boolean;
          page: Array<{ k: any; s: number; v: any }>;
        }
      >;
      paginateNamespaces: FunctionReference<
        "query",
        "internal",
        { cursor?: string; limit: number },
        { cursor: string; isDone: boolean; page: Array<any> }
      >;
      validate: FunctionReference<
        "query",
        "internal",
        { namespace?: any },
        any
      >;
    };
    inspect: {
      display: FunctionReference<"query", "internal", { namespace?: any }, any>;
      dump: FunctionReference<"query", "internal", { namespace?: any }, string>;
      inspectNode: FunctionReference<
        "query",
        "internal",
        { namespace?: any; node?: string },
        null
      >;
      listTreeNodes: FunctionReference<
        "query",
        "internal",
        { take?: number },
        Array<{
          _creationTime: number;
          _id: string;
          aggregate?: { count: number; sum: number };
          items: Array<{ k: any; s: number; v: any }>;
          subtrees: Array<string>;
        }>
      >;
      listTrees: FunctionReference<
        "query",
        "internal",
        { take?: number },
        Array<{
          _creationTime: number;
          _id: string;
          maxNodeSize: number;
          namespace?: any;
          root: string;
        }>
      >;
    };
    public: {
      clear: FunctionReference<
        "mutation",
        "internal",
        { maxNodeSize?: number; namespace?: any; rootLazy?: boolean },
        null
      >;
      delete_: FunctionReference<
        "mutation",
        "internal",
        { key: any; namespace?: any },
        null
      >;
      deleteIfExists: FunctionReference<
        "mutation",
        "internal",
        { key: any; namespace?: any },
        any
      >;
      init: FunctionReference<
        "mutation",
        "internal",
        { maxNodeSize?: number; namespace?: any; rootLazy?: boolean },
        null
      >;
      insert: FunctionReference<
        "mutation",
        "internal",
        { key: any; namespace?: any; summand?: number; value: any },
        null
      >;
      makeRootLazy: FunctionReference<
        "mutation",
        "internal",
        { namespace?: any },
        null
      >;
      replace: FunctionReference<
        "mutation",
        "internal",
        {
          currentKey: any;
          namespace?: any;
          newKey: any;
          newNamespace?: any;
          summand?: number;
          value: any;
        },
        null
      >;
      replaceOrInsert: FunctionReference<
        "mutation",
        "internal",
        {
          currentKey: any;
          namespace?: any;
          newKey: any;
          newNamespace?: any;
          summand?: number;
          value: any;
        },
        any
      >;
    };
  };
  revenueAnalytics: {
    btree: {
      aggregateBetween: FunctionReference<
        "query",
        "internal",
        { k1?: any; k2?: any; namespace?: any },
        { count: number; sum: number }
      >;
      aggregateBetweenBatch: FunctionReference<
        "query",
        "internal",
        { queries: Array<{ k1?: any; k2?: any; namespace?: any }> },
        Array<{ count: number; sum: number }>
      >;
      atNegativeOffset: FunctionReference<
        "query",
        "internal",
        { k1?: any; k2?: any; namespace?: any; offset: number },
        { k: any; s: number; v: any }
      >;
      atOffset: FunctionReference<
        "query",
        "internal",
        { k1?: any; k2?: any; namespace?: any; offset: number },
        { k: any; s: number; v: any }
      >;
      atOffsetBatch: FunctionReference<
        "query",
        "internal",
        {
          queries: Array<{
            k1?: any;
            k2?: any;
            namespace?: any;
            offset: number;
          }>;
        },
        Array<{ k: any; s: number; v: any }>
      >;
      get: FunctionReference<
        "query",
        "internal",
        { key: any; namespace?: any },
        null | { k: any; s: number; v: any }
      >;
      offset: FunctionReference<
        "query",
        "internal",
        { k1?: any; key: any; namespace?: any },
        number
      >;
      offsetUntil: FunctionReference<
        "query",
        "internal",
        { k2?: any; key: any; namespace?: any },
        number
      >;
      paginate: FunctionReference<
        "query",
        "internal",
        {
          cursor?: string;
          k1?: any;
          k2?: any;
          limit: number;
          namespace?: any;
          order: "asc" | "desc";
        },
        {
          cursor: string;
          isDone: boolean;
          page: Array<{ k: any; s: number; v: any }>;
        }
      >;
      paginateNamespaces: FunctionReference<
        "query",
        "internal",
        { cursor?: string; limit: number },
        { cursor: string; isDone: boolean; page: Array<any> }
      >;
      validate: FunctionReference<
        "query",
        "internal",
        { namespace?: any },
        any
      >;
    };
    inspect: {
      display: FunctionReference<"query", "internal", { namespace?: any }, any>;
      dump: FunctionReference<"query", "internal", { namespace?: any }, string>;
      inspectNode: FunctionReference<
        "query",
        "internal",
        { namespace?: any; node?: string },
        null
      >;
      listTreeNodes: FunctionReference<
        "query",
        "internal",
        { take?: number },
        Array<{
          _creationTime: number;
          _id: string;
          aggregate?: { count: number; sum: number };
          items: Array<{ k: any; s: number; v: any }>;
          subtrees: Array<string>;
        }>
      >;
      listTrees: FunctionReference<
        "query",
        "internal",
        { take?: number },
        Array<{
          _creationTime: number;
          _id: string;
          maxNodeSize: number;
          namespace?: any;
          root: string;
        }>
      >;
    };
    public: {
      clear: FunctionReference<
        "mutation",
        "internal",
        { maxNodeSize?: number; namespace?: any; rootLazy?: boolean },
        null
      >;
      delete_: FunctionReference<
        "mutation",
        "internal",
        { key: any; namespace?: any },
        null
      >;
      deleteIfExists: FunctionReference<
        "mutation",
        "internal",
        { key: any; namespace?: any },
        any
      >;
      init: FunctionReference<
        "mutation",
        "internal",
        { maxNodeSize?: number; namespace?: any; rootLazy?: boolean },
        null
      >;
      insert: FunctionReference<
        "mutation",
        "internal",
        { key: any; namespace?: any; summand?: number; value: any },
        null
      >;
      makeRootLazy: FunctionReference<
        "mutation",
        "internal",
        { namespace?: any },
        null
      >;
      replace: FunctionReference<
        "mutation",
        "internal",
        {
          currentKey: any;
          namespace?: any;
          newKey: any;
          newNamespace?: any;
          summand?: number;
          value: any;
        },
        null
      >;
      replaceOrInsert: FunctionReference<
        "mutation",
        "internal",
        {
          currentKey: any;
          namespace?: any;
          newKey: any;
          newNamespace?: any;
          summand?: number;
          value: any;
        },
        any
      >;
    };
  };
};

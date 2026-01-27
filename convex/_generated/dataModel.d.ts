/* eslint-disable */
/**
 * Generated data model types.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  DocumentByName,
  TableNamesInDataModel,
  SystemTableNames,
  AnyDataModel,
} from "convex/server";
import type { GenericId } from "convex/values";

/**
 * A type describing your Convex data model.
 *
 * This type includes information about what tables you have, the type of
 * documents stored in those tables, and the indexes defined on them.
 *
 * This type is used to parameterize methods like `queryGeneric` and
 * `mutationGeneric` to make them type-safe.
 */

export type DataModel = {
  adminActivityLogs: {
    document: {
      action: string;
      actionType:
        | "create"
        | "update"
        | "delete"
        | "approve"
        | "reject"
        | "export"
        | "view";
      adminEmail?: string;
      adminId: string;
      adminName?: string;
      details?: string;
      ipAddress?: string;
      newValue?: string;
      previousValue?: string;
      resourceId?: string;
      resourceName?: string;
      resourceType: string;
      timestamp: number;
      userAgent?: string;
      _id: Id<"adminActivityLogs">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "action"
      | "actionType"
      | "adminEmail"
      | "adminId"
      | "adminName"
      | "details"
      | "ipAddress"
      | "newValue"
      | "previousValue"
      | "resourceId"
      | "resourceName"
      | "resourceType"
      | "timestamp"
      | "userAgent";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_action: ["action", "_creationTime"];
      by_actionType: ["actionType", "_creationTime"];
      by_adminId: ["adminId", "_creationTime"];
      by_resourceType: ["resourceType", "_creationTime"];
      by_timestamp: ["timestamp", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  affiliateClicks: {
    document: {
      affiliateCode: string;
      affiliateId: Id<"affiliates">;
      clickedAt: number;
      converted: boolean;
      ipAddress?: string;
      landingPage: string;
      orderId?: string;
      referrerUrl?: string;
      userAgent?: string;
      visitorId?: string;
      _id: Id<"affiliateClicks">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "affiliateCode"
      | "affiliateId"
      | "clickedAt"
      | "converted"
      | "ipAddress"
      | "landingPage"
      | "orderId"
      | "referrerUrl"
      | "userAgent"
      | "visitorId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_affiliate: ["affiliateId", "clickedAt", "_creationTime"];
      by_code: ["affiliateCode", "clickedAt", "_creationTime"];
      by_conversion: ["converted", "clickedAt", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  affiliatePayouts: {
    document: {
      affiliateId: Id<"affiliates">;
      affiliateUserId: string;
      amount: number;
      createdAt: number;
      creatorId: string;
      currency: string;
      failureReason?: string;
      payoutDate?: number;
      payoutMethod: string;
      salesIncluded: Array<Id<"affiliateSales">>;
      status: "pending" | "processing" | "completed" | "failed";
      storeId: Id<"stores">;
      totalSales: number;
      transactionId?: string;
      updatedAt: number;
      _id: Id<"affiliatePayouts">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "affiliateId"
      | "affiliateUserId"
      | "amount"
      | "createdAt"
      | "creatorId"
      | "currency"
      | "failureReason"
      | "payoutDate"
      | "payoutMethod"
      | "salesIncluded"
      | "status"
      | "storeId"
      | "totalSales"
      | "transactionId"
      | "updatedAt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_affiliate: ["affiliateId", "createdAt", "_creationTime"];
      by_status: ["status", "createdAt", "_creationTime"];
      by_store: ["storeId", "status", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  affiliates: {
    document: {
      affiliateCode: string;
      affiliateUserId: string;
      applicationNote?: string;
      appliedAt: number;
      approvedAt?: number;
      commissionRate: number;
      commissionType: "percentage" | "fixed_per_sale";
      cookieDuration: number;
      createdAt: number;
      creatorId: string;
      fixedCommissionAmount?: number;
      payoutEmail?: string;
      payoutMethod?: "stripe" | "paypal" | "manual";
      rejectionReason?: string;
      status: "active" | "pending" | "suspended" | "rejected";
      storeId: Id<"stores">;
      stripeConnectId?: string;
      totalClicks: number;
      totalCommissionEarned: number;
      totalCommissionPaid: number;
      totalRevenue: number;
      totalSales: number;
      updatedAt: number;
      _id: Id<"affiliates">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "affiliateCode"
      | "affiliateUserId"
      | "applicationNote"
      | "appliedAt"
      | "approvedAt"
      | "commissionRate"
      | "commissionType"
      | "cookieDuration"
      | "createdAt"
      | "creatorId"
      | "fixedCommissionAmount"
      | "payoutEmail"
      | "payoutMethod"
      | "rejectionReason"
      | "status"
      | "storeId"
      | "stripeConnectId"
      | "totalClicks"
      | "totalCommissionEarned"
      | "totalCommissionPaid"
      | "totalRevenue"
      | "totalSales"
      | "updatedAt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_affiliate_user: ["affiliateUserId", "_creationTime"];
      by_code: ["affiliateCode", "_creationTime"];
      by_creator: ["creatorId", "status", "_creationTime"];
      by_store: ["storeId", "status", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  affiliateSales: {
    document: {
      affiliateId: Id<"affiliates">;
      affiliateUserId: string;
      commissionAmount: number;
      commissionRate: number;
      commissionStatus: "pending" | "approved" | "paid" | "reversed";
      createdAt: number;
      customerId: string;
      isPaid: boolean;
      itemId: string;
      itemType: "course" | "product" | "subscription";
      orderAmount: number;
      orderId: string;
      paidAt?: number;
      payoutId?: Id<"affiliatePayouts">;
      saleDate: number;
      storeId: Id<"stores">;
      updatedAt: number;
      _id: Id<"affiliateSales">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "affiliateId"
      | "affiliateUserId"
      | "commissionAmount"
      | "commissionRate"
      | "commissionStatus"
      | "createdAt"
      | "customerId"
      | "isPaid"
      | "itemId"
      | "itemType"
      | "orderAmount"
      | "orderId"
      | "paidAt"
      | "payoutId"
      | "saleDate"
      | "storeId"
      | "updatedAt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_affiliate: ["affiliateId", "saleDate", "_creationTime"];
      by_customer: ["customerId", "saleDate", "_creationTime"];
      by_payout: ["payoutId", "_creationTime"];
      by_status: ["commissionStatus", "saleDate", "_creationTime"];
      by_store: ["storeId", "saleDate", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  aiAgents: {
    document: {
      avatarUrl?: string;
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
      conversationCount: number;
      createdAt: number;
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
      isActive: boolean;
      isBuiltIn: boolean;
      isFeatured?: boolean;
      knowledgeFilters?: {
        categories?: Array<string>;
        sourceTypes?: Array<string>;
        tags?: Array<string>;
      };
      longDescription?: string;
      name: string;
      rating?: number;
      ratingCount?: number;
      slug: string;
      suggestedQuestions?: Array<string>;
      systemPrompt: string;
      tags?: Array<string>;
      toolConfigs?: any;
      updatedAt: number;
      visibility: "public" | "subscribers" | "private";
      welcomeMessage?: string;
      _id: Id<"aiAgents">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "avatarUrl"
      | "category"
      | "color"
      | "conversationCount"
      | "createdAt"
      | "creatorId"
      | "defaultSettings"
      | "defaultSettings.chunksPerFacet"
      | "defaultSettings.enableCreativeMode"
      | "defaultSettings.enableWebResearch"
      | "defaultSettings.maxFacets"
      | "defaultSettings.preset"
      | "defaultSettings.responseStyle"
      | "description"
      | "enabledTools"
      | "icon"
      | "isActive"
      | "isBuiltIn"
      | "isFeatured"
      | "knowledgeFilters"
      | "knowledgeFilters.categories"
      | "knowledgeFilters.sourceTypes"
      | "knowledgeFilters.tags"
      | "longDescription"
      | "name"
      | "rating"
      | "ratingCount"
      | "slug"
      | "suggestedQuestions"
      | "systemPrompt"
      | "tags"
      | "toolConfigs"
      | "updatedAt"
      | "visibility"
      | "welcomeMessage";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_category: ["category", "_creationTime"];
      by_conversationCount: ["conversationCount", "_creationTime"];
      by_creatorId: ["creatorId", "_creationTime"];
      by_isActive: ["isActive", "_creationTime"];
      by_isFeatured: ["isFeatured", "_creationTime"];
      by_slug: ["slug", "_creationTime"];
      by_visibility: ["visibility", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  aiConversations: {
    document: {
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
      _id: Id<"aiConversations">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "agentId"
      | "agentName"
      | "agentSlug"
      | "archived"
      | "conversationGoal"
      | "conversationGoal.deliverableType"
      | "conversationGoal.extractedAt"
      | "conversationGoal.keyConstraints"
      | "conversationGoal.originalIntent"
      | "createdAt"
      | "lastMessageAt"
      | "messageCount"
      | "preset"
      | "preview"
      | "responseStyle"
      | "settings"
      | "settings.agenticMode"
      | "settings.autoSaveWebResearch"
      | "settings.chunksPerFacet"
      | "settings.enableCreativeMode"
      | "settings.enableCritic"
      | "settings.enableFactVerification"
      | "settings.enableWebResearch"
      | "settings.maxFacets"
      | "settings.maxRetries"
      | "settings.preset"
      | "settings.qualityThreshold"
      | "settings.responseStyle"
      | "settings.similarityThreshold"
      | "settings.webSearchMaxResults"
      | "starred"
      | "title"
      | "updatedAt"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_userId: ["userId", "_creationTime"];
      by_userId_agentId: ["userId", "agentId", "_creationTime"];
      by_userId_archived: ["userId", "archived", "_creationTime"];
      by_userId_lastMessageAt: ["userId", "lastMessageAt", "_creationTime"];
      by_userId_starred: ["userId", "starred", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  aiCourseOutlines: {
    document: {
      chapterStatus?: Array<{
        chapterIndex: number;
        hasDetailedContent: boolean;
        lessonIndex: number;
        moduleIndex: number;
        title: string;
        wordCount?: number;
      }>;
      createdAt: number;
      description: string;
      estimatedDuration?: number;
      expandedChapters: number;
      generationModel?: string;
      generationTimeMs?: number;
      isEdited: boolean;
      lastEditedAt?: number;
      outline: any;
      queueId: Id<"aiCourseQueue">;
      skillLevel: "beginner" | "intermediate" | "advanced";
      storeId: string;
      title: string;
      topic: string;
      totalChapters: number;
      userId: string;
      _id: Id<"aiCourseOutlines">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "chapterStatus"
      | "createdAt"
      | "description"
      | "estimatedDuration"
      | "expandedChapters"
      | "generationModel"
      | "generationTimeMs"
      | "isEdited"
      | "lastEditedAt"
      | "outline"
      | "queueId"
      | "skillLevel"
      | "storeId"
      | "title"
      | "topic"
      | "totalChapters"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_queueId: ["queueId", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
      by_userId_and_createdAt: ["userId", "createdAt", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  aiCourseQueue: {
    document: {
      completedAt?: number;
      courseId?: Id<"courses">;
      createdAt: number;
      error?: string;
      outlineId?: Id<"aiCourseOutlines">;
      priority?: number;
      progress?: {
        completedSteps: number;
        currentChapter?: string;
        currentStep: string;
        totalSteps: number;
      };
      prompt: string;
      skillLevel?: "beginner" | "intermediate" | "advanced";
      startedAt?: number;
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
      storeId: string;
      targetLessonsPerModule?: number;
      targetModules?: number;
      topic?: string;
      userId: string;
      _id: Id<"aiCourseQueue">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "completedAt"
      | "courseId"
      | "createdAt"
      | "error"
      | "outlineId"
      | "priority"
      | "progress"
      | "progress.completedSteps"
      | "progress.currentChapter"
      | "progress.currentStep"
      | "progress.totalSteps"
      | "prompt"
      | "skillLevel"
      | "startedAt"
      | "status"
      | "storeId"
      | "targetLessonsPerModule"
      | "targetModules"
      | "topic"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_priority_and_createdAt: ["priority", "createdAt", "_creationTime"];
      by_status: ["status", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
      by_userId_and_createdAt: ["userId", "createdAt", "_creationTime"];
      by_userId_and_status: ["userId", "status", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  aiMemories: {
    document: {
      accessCount: number;
      archived?: boolean;
      content: string;
      createdAt: number;
      embedding?: Array<number>;
      expiresAt?: number;
      importance: number;
      lastAccessedAt?: number;
      sourceConversationId?: Id<"aiConversations">;
      sourceMessageId?: Id<"aiMessages">;
      summary?: string;
      type: "preference" | "fact" | "skill_level" | "context" | "correction";
      updatedAt: number;
      userId: string;
      _id: Id<"aiMemories">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "accessCount"
      | "archived"
      | "content"
      | "createdAt"
      | "embedding"
      | "expiresAt"
      | "importance"
      | "lastAccessedAt"
      | "sourceConversationId"
      | "sourceMessageId"
      | "summary"
      | "type"
      | "updatedAt"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_sourceConversationId: ["sourceConversationId", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
      by_userId_importance: ["userId", "importance", "_creationTime"];
      by_userId_type: ["userId", "type", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  aiMessageFeedback: {
    document: {
      conversationId: Id<"aiConversations">;
      createdAt: number;
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
      _id: Id<"aiMessageFeedback">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "conversationId"
      | "createdAt"
      | "messageId"
      | "reason"
      | "tags"
      | "userId"
      | "vote";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_conversationId: ["conversationId", "_creationTime"];
      by_messageId: ["messageId", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
      by_vote: ["vote", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  aiMessages: {
    document: {
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
      _id: Id<"aiMessages">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "citations"
      | "content"
      | "conversationId"
      | "createdAt"
      | "facetsUsed"
      | "pipelineMetadata"
      | "pipelineMetadata.finalWriterModel"
      | "pipelineMetadata.plannerModel"
      | "pipelineMetadata.processingTimeMs"
      | "pipelineMetadata.summarizerModel"
      | "pipelineMetadata.totalChunksProcessed"
      | "role"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_conversationId: ["conversationId", "_creationTime"];
      by_conversationId_createdAt: [
        "conversationId",
        "createdAt",
        "_creationTime",
      ];
      by_userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  aiOutreachDrafts: {
    document: {
      dmScript?: string;
      emailBody: string;
      exported: boolean;
      followUpSuggestions?: Array<string>;
      generatedAt: number;
      style?: string;
      subject: string;
      targetType: "labels" | "playlists" | "blogs" | "ar" | "generic";
      tone: string;
      trackId: Id<"userTracks">;
      userId: string;
      _id: Id<"aiOutreachDrafts">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "dmScript"
      | "emailBody"
      | "exported"
      | "followUpSuggestions"
      | "generatedAt"
      | "style"
      | "subject"
      | "targetType"
      | "tone"
      | "trackId"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_trackId: ["trackId", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  analyticsEvents: {
    document: {
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
      timestamp: number;
      userAgent?: string;
      userId: string;
      _id: Id<"analyticsEvents">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "eventType"
      | "ipAddress"
      | "metadata"
      | "metadata.amount_cents"
      | "metadata.audience_size"
      | "metadata.browser"
      | "metadata.campaign_id"
      | "metadata.city"
      | "metadata.country"
      | "metadata.currency"
      | "metadata.daw"
      | "metadata.device"
      | "metadata.duration"
      | "metadata.error_code"
      | "metadata.error_message"
      | "metadata.experiment_id"
      | "metadata.os"
      | "metadata.page"
      | "metadata.product_id"
      | "metadata.progress"
      | "metadata.referrer"
      | "metadata.searchTerm"
      | "metadata.source"
      | "metadata.utm_campaign"
      | "metadata.utm_medium"
      | "metadata.utm_source"
      | "metadata.value"
      | "metadata.variant"
      | "resourceId"
      | "resourceType"
      | "sessionId"
      | "storeId"
      | "timestamp"
      | "userAgent"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_eventType: ["eventType", "_creationTime"];
      by_resourceId: ["resourceId", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
      by_store_event: ["storeId", "eventType", "_creationTime"];
      by_store_timestamp: ["storeId", "timestamp", "_creationTime"];
      by_timestamp: ["timestamp", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
      by_user_event: ["userId", "eventType", "_creationTime"];
      by_user_timestamp: ["userId", "timestamp", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  answers: {
    document: {
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
      _id: Id<"answers">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "authorAvatar"
      | "authorId"
      | "authorName"
      | "content"
      | "courseId"
      | "createdAt"
      | "isAccepted"
      | "isInstructor"
      | "questionId"
      | "updatedAt"
      | "upvotes";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_author: ["authorId", "createdAt", "_creationTime"];
      by_question: ["questionId", "createdAt", "_creationTime"];
      by_question_votes: ["questionId", "upvotes", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  artistFollows: {
    document: {
      artistProfileId: Id<"artistProfiles">;
      artistUserId: string;
      followerId: string;
      notifyLiveStreams?: boolean;
      notifyNewTracks?: boolean;
      timestamp: number;
      _id: Id<"artistFollows">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "artistProfileId"
      | "artistUserId"
      | "followerId"
      | "notifyLiveStreams"
      | "notifyNewTracks"
      | "timestamp";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_artistProfileId: ["artistProfileId", "_creationTime"];
      by_artistUserId: ["artistUserId", "_creationTime"];
      by_followerId: ["followerId", "_creationTime"];
      by_follower_artist: ["followerId", "artistProfileId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  artistProfiles: {
    document: {
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
      _id: Id<"artistProfiles">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "artistName"
      | "bannerImage"
      | "bio"
      | "displayName"
      | "isPublic"
      | "location"
      | "profileImage"
      | "slug"
      | "socialLinks"
      | "socialLinks.apple_music"
      | "socialLinks.bandcamp"
      | "socialLinks.facebook"
      | "socialLinks.instagram"
      | "socialLinks.soundcloud"
      | "socialLinks.spotify"
      | "socialLinks.tiktok"
      | "socialLinks.twitter"
      | "socialLinks.youtube"
      | "storeId"
      | "totalFollowers"
      | "totalLikes"
      | "totalPlays"
      | "totalViews"
      | "userId"
      | "website";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_isPublic: ["isPublic", "_creationTime"];
      by_slug: ["slug", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  audioFiles: {
    document: {
      chapterId: string;
      filename: string;
      size: number;
      storageId: Id<"_storage">;
      uploadedAt?: number;
      uploadedBy?: string;
      url?: string;
      _id: Id<"audioFiles">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "chapterId"
      | "filename"
      | "size"
      | "storageId"
      | "uploadedAt"
      | "uploadedBy"
      | "url";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_chapterId: ["chapterId", "_creationTime"];
      by_storageId: ["storageId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  audioSamples: {
    document: {
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
      downloads: number;
      duration: number;
      favorites: number;
      fileName: string;
      fileSize: number;
      fileUrl: string;
      format: string;
      genre: string;
      individualPrice?: number;
      isFree?: boolean;
      isIndividuallySellable?: boolean;
      isPublished: boolean;
      key?: string;
      licenseTerms?: string;
      licenseType: "royalty-free" | "exclusive" | "commercial";
      packIds?: Array<Id<"digitalProducts">>;
      peakAmplitude?: number;
      plays: number;
      storageId: Id<"_storage">;
      storeId: string;
      subGenre?: string;
      tags: Array<string>;
      title: string;
      userId: string;
      waveformData?: Array<number>;
      _id: Id<"audioSamples">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "bpm"
      | "category"
      | "creditPrice"
      | "description"
      | "downloads"
      | "duration"
      | "favorites"
      | "fileName"
      | "fileSize"
      | "fileUrl"
      | "format"
      | "genre"
      | "individualPrice"
      | "isFree"
      | "isIndividuallySellable"
      | "isPublished"
      | "key"
      | "licenseTerms"
      | "licenseType"
      | "packIds"
      | "peakAmplitude"
      | "plays"
      | "storageId"
      | "storeId"
      | "subGenre"
      | "tags"
      | "title"
      | "userId"
      | "waveformData";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_category: ["category", "_creationTime"];
      by_category_published: ["category", "isPublished", "_creationTime"];
      by_genre: ["genre", "_creationTime"];
      by_genre_published: ["genre", "isPublished", "_creationTime"];
      by_published: ["isPublished", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
      by_user_published: ["userId", "isPublished", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  automationFlows: {
    document: {
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
      isActive: boolean;
      lastTriggered?: number;
      name: string;
      settings: {
        allowMultipleRuns: boolean;
        stopOnError: boolean;
        timeoutMinutes?: number;
      };
      storeId: string;
      totalCompletions: number;
      totalTriggers: number;
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
      _id: Id<"automationFlows">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "description"
      | "flowDefinition"
      | "flowDefinition.connections"
      | "flowDefinition.nodes"
      | "isActive"
      | "lastTriggered"
      | "name"
      | "settings"
      | "settings.allowMultipleRuns"
      | "settings.stopOnError"
      | "settings.timeoutMinutes"
      | "storeId"
      | "totalCompletions"
      | "totalTriggers"
      | "triggerConditions"
      | "triggerConditions.keywords"
      | "triggerConditions.matchType"
      | "triggerConditions.platforms"
      | "triggerConditions.socialAccountIds"
      | "triggerType"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_isActive: ["isActive", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
      by_store_active: ["storeId", "isActive", "_creationTime"];
      by_triggerType: ["triggerType", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  automationMessages: {
    document: {
      automationFlowId: Id<"automationFlows">;
      content: string;
      deliveredAt?: number;
      errorMessage?: string;
      maxRetries: number;
      mediaUrls?: Array<string>;
      messageType: "dm" | "comment_reply" | "story_reply";
      nextRetryAt?: number;
      nodeId: string;
      platform: "instagram" | "twitter" | "facebook" | "tiktok" | "linkedin";
      platformMessageId?: string;
      platformUserId: string;
      platformUsername?: string;
      retryCount: number;
      sentAt?: number;
      socialAccountId: Id<"socialAccounts">;
      status:
        | "pending"
        | "sending"
        | "sent"
        | "delivered"
        | "failed"
        | "rate_limited";
      storeId: string;
      userAutomationStateId: Id<"userAutomationStates">;
      _id: Id<"automationMessages">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "automationFlowId"
      | "content"
      | "deliveredAt"
      | "errorMessage"
      | "maxRetries"
      | "mediaUrls"
      | "messageType"
      | "nextRetryAt"
      | "nodeId"
      | "platform"
      | "platformMessageId"
      | "platformUserId"
      | "platformUsername"
      | "retryCount"
      | "sentAt"
      | "socialAccountId"
      | "status"
      | "storeId"
      | "userAutomationStateId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_automationFlowId: ["automationFlowId", "_creationTime"];
      by_nextRetry: ["nextRetryAt", "_creationTime"];
      by_platform: ["platform", "_creationTime"];
      by_platformUser: ["platform", "platformUserId", "_creationTime"];
      by_sentAt: ["sentAt", "_creationTime"];
      by_status: ["status", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
      by_userState: ["userAutomationStateId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  automations: {
    document: {
      active: boolean;
      instagramAccountId?: string;
      lastTriggered?: number;
      name: string;
      storeId?: Id<"stores">;
      totalResponses?: number;
      totalTriggers?: number;
      userId: Id<"users">;
      _id: Id<"automations">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "active"
      | "instagramAccountId"
      | "lastTriggered"
      | "name"
      | "storeId"
      | "totalResponses"
      | "totalTriggers"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_active: ["active", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
      by_user_active: ["userId", "active", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  automationTriggers: {
    document: {
      automationFlowId: Id<"automationFlows">;
      commentId?: string;
      errorMessage?: string;
      fullContent: string;
      keyword?: string;
      matchedText: string;
      messageId?: string;
      platform: "instagram" | "twitter" | "facebook" | "tiktok" | "linkedin";
      platformUserId: string;
      platformUsername?: string;
      postId?: string;
      processedAt?: number;
      socialAccountId: Id<"socialAccounts">;
      status: "pending" | "processing" | "completed" | "failed" | "ignored";
      storeId: string;
      triggerType: string;
      userAutomationStateId?: Id<"userAutomationStates">;
      webhookId?: Id<"socialWebhooks">;
      _id: Id<"automationTriggers">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "automationFlowId"
      | "commentId"
      | "errorMessage"
      | "fullContent"
      | "keyword"
      | "matchedText"
      | "messageId"
      | "platform"
      | "platformUserId"
      | "platformUsername"
      | "postId"
      | "processedAt"
      | "socialAccountId"
      | "status"
      | "storeId"
      | "triggerType"
      | "userAutomationStateId"
      | "webhookId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_automationFlowId: ["automationFlowId", "_creationTime"];
      by_keyword: ["keyword", "_creationTime"];
      by_platform: ["platform", "_creationTime"];
      by_platformUser: ["platform", "platformUserId", "_creationTime"];
      by_status: ["status", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
      by_store_status: ["storeId", "status", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  beatLicenses: {
    document: {
      beatId: Id<"digitalProducts">;
      beatTitle: string;
      buyerEmail: string;
      buyerName?: string;
      commercialUse: boolean;
      contractGeneratedAt?: number;
      createdAt: number;
      creditRequired: boolean;
      deliveredFiles: Array<string>;
      distributionLimit?: number;
      musicVideoUse: boolean;
      price: number;
      producerName: string;
      purchaseId: Id<"purchases">;
      radioBroadcasting: boolean;
      stemsIncluded: boolean;
      storeId: Id<"stores">;
      streamingLimit?: number;
      tierName: string;
      tierType: "basic" | "premium" | "exclusive" | "unlimited";
      userId: string;
      _id: Id<"beatLicenses">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "beatId"
      | "beatTitle"
      | "buyerEmail"
      | "buyerName"
      | "commercialUse"
      | "contractGeneratedAt"
      | "createdAt"
      | "creditRequired"
      | "deliveredFiles"
      | "distributionLimit"
      | "musicVideoUse"
      | "price"
      | "producerName"
      | "purchaseId"
      | "radioBroadcasting"
      | "stemsIncluded"
      | "storeId"
      | "streamingLimit"
      | "tierName"
      | "tierType"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_beat: ["beatId", "_creationTime"];
      by_purchase: ["purchaseId", "_creationTime"];
      by_store: ["storeId", "_creationTime"];
      by_user: ["userId", "_creationTime"];
      by_user_beat: ["userId", "beatId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  blogComments: {
    document: {
      approved: boolean;
      authorAvatar?: string;
      authorId: string;
      authorName: string;
      content: string;
      createdAt: number;
      postId: Id<"blogPosts">;
      updatedAt: number;
      _id: Id<"blogComments">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "approved"
      | "authorAvatar"
      | "authorId"
      | "authorName"
      | "content"
      | "createdAt"
      | "postId"
      | "updatedAt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_approved: ["approved", "_creationTime"];
      by_authorId: ["authorId", "_creationTime"];
      by_postId: ["postId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  blogPosts: {
    document: {
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
      _id: Id<"blogPosts">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "authorAvatar"
      | "authorId"
      | "authorName"
      | "canonicalUrl"
      | "category"
      | "content"
      | "coverImage"
      | "createdAt"
      | "excerpt"
      | "keywords"
      | "metaDescription"
      | "metaTitle"
      | "publishedAt"
      | "readTimeMinutes"
      | "scheduledFor"
      | "slug"
      | "status"
      | "storeId"
      | "tags"
      | "title"
      | "updatedAt"
      | "views";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_authorId: ["authorId", "_creationTime"];
      by_category: ["category", "_creationTime"];
      by_publishedAt: ["publishedAt", "_creationTime"];
      by_slug: ["slug", "_creationTime"];
      by_status: ["status", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
    };
    searchIndexes: {
      search_content: {
        searchField: "content";
        filterFields: "authorId" | "status";
      };
    };
    vectorIndexes: {};
  };
  bundles: {
    document: {
      availableFrom?: number;
      availableUntil?: number;
      bundlePrice: number;
      bundleType: "course_bundle" | "mixed" | "product_bundle";
      courseIds: Array<Id<"courses">>;
      createdAt: number;
      creatorId: string;
      description: string;
      discountPercentage: number;
      imageUrl?: string;
      isActive: boolean;
      isPublished: boolean;
      maxPurchases?: number;
      name: string;
      originalPrice: number;
      productIds: Array<Id<"digitalProducts">>;
      savings: number;
      slug?: string;
      storeId: Id<"stores">;
      stripePriceId?: string;
      totalPurchases: number;
      totalRevenue: number;
      updatedAt: number;
      _id: Id<"bundles">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "availableFrom"
      | "availableUntil"
      | "bundlePrice"
      | "bundleType"
      | "courseIds"
      | "createdAt"
      | "creatorId"
      | "description"
      | "discountPercentage"
      | "imageUrl"
      | "isActive"
      | "isPublished"
      | "maxPurchases"
      | "name"
      | "originalPrice"
      | "productIds"
      | "savings"
      | "slug"
      | "storeId"
      | "stripePriceId"
      | "totalPurchases"
      | "totalRevenue"
      | "updatedAt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_creator: ["creatorId", "isActive", "_creationTime"];
      by_slug: ["slug", "_creationTime"];
      by_store: ["storeId", "isPublished", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  campaignGoals: {
    document: {
      achieved: boolean;
      achievedAt?: number;
      actual: number;
      campaignId: Id<"resendCampaigns">;
      conversions?: number;
      createdAt: number;
      goalName: string;
      goalType: "open_rate" | "click_rate" | "conversions" | "revenue";
      revenue?: number;
      target: number;
      targetUnit: string;
      updatedAt: number;
      _id: Id<"campaignGoals">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "achieved"
      | "achievedAt"
      | "actual"
      | "campaignId"
      | "conversions"
      | "createdAt"
      | "goalName"
      | "goalType"
      | "revenue"
      | "target"
      | "targetUnit"
      | "updatedAt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_campaignId: ["campaignId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  campaigns: {
    document: {
      body: string;
      bouncedCount?: number;
      clickedCount?: number;
      convertedCount?: number;
      createdAt: number;
      createdBy: string;
      ctaText?: string;
      ctaUrl?: string;
      deliveredCount?: number;
      name: string;
      openedCount?: number;
      scheduledAt?: number;
      sentAt?: number;
      sentCount?: number;
      status: "draft" | "scheduled" | "active" | "completed" | "paused";
      subject?: string;
      targetRole?: "learner" | "creator" | "both";
      targetSegment?: string;
      type: "email" | "instagram" | "tiktok" | "dm_batch";
      updatedAt: number;
      _id: Id<"campaigns">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "body"
      | "bouncedCount"
      | "clickedCount"
      | "convertedCount"
      | "createdAt"
      | "createdBy"
      | "ctaText"
      | "ctaUrl"
      | "deliveredCount"
      | "name"
      | "openedCount"
      | "scheduledAt"
      | "sentAt"
      | "sentCount"
      | "status"
      | "subject"
      | "targetRole"
      | "targetSegment"
      | "type"
      | "updatedAt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_status_and_scheduledAt: ["status", "scheduledAt", "_creationTime"];
      by_type_and_createdAt: ["type", "createdAt", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  cartAbandonEvents: {
    document: {
      abandonedAt: number;
      cartId?: string;
      cartItems?: Array<{
        price: number;
        productId: string;
        productName: string;
        quantity: number;
      }>;
      cartValue?: number;
      contactEmail: string;
      contactId?: Id<"emailContacts">;
      executionId?: Id<"workflowExecutions">;
      recovered: boolean;
      recoveredAt?: number;
      recoveryEmailSent: boolean;
      recoveryEmailSentAt?: number;
      storeId: string;
      workflowTriggered?: boolean;
      _id: Id<"cartAbandonEvents">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "abandonedAt"
      | "cartId"
      | "cartItems"
      | "cartValue"
      | "contactEmail"
      | "contactId"
      | "executionId"
      | "recovered"
      | "recoveredAt"
      | "recoveryEmailSent"
      | "recoveryEmailSentAt"
      | "storeId"
      | "workflowTriggered";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_contactEmail: ["storeId", "contactEmail", "_creationTime"];
      by_contactId: ["contactId", "_creationTime"];
      by_recovered: ["storeId", "recovered", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  certificates: {
    document: {
      certificateId: string;
      completedChapters: number;
      completionDate: number;
      completionPercentage: number;
      courseId: Id<"courses">;
      courseTitle: string;
      createdAt: number;
      instructorId: string;
      instructorName: string;
      isValid: boolean;
      issueDate: number;
      lastVerifiedAt?: number;
      pdfStorageId?: Id<"_storage">;
      pdfUrl?: string;
      timeSpent?: number;
      totalChapters: number;
      userEmail: string;
      userId: string;
      userName: string;
      verificationCode: string;
      verificationCount: number;
      _id: Id<"certificates">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "certificateId"
      | "completedChapters"
      | "completionDate"
      | "completionPercentage"
      | "courseId"
      | "courseTitle"
      | "createdAt"
      | "instructorId"
      | "instructorName"
      | "issueDate"
      | "isValid"
      | "lastVerifiedAt"
      | "pdfStorageId"
      | "pdfUrl"
      | "timeSpent"
      | "totalChapters"
      | "userEmail"
      | "userId"
      | "userName"
      | "verificationCode"
      | "verificationCount";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_certificate_id: ["certificateId", "_creationTime"];
      by_course: ["courseId", "issueDate", "_creationTime"];
      by_user: ["userId", "createdAt", "_creationTime"];
      by_user_and_course: ["userId", "courseId", "_creationTime"];
      by_verification_code: ["verificationCode", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  certificateVerifications: {
    document: {
      certificateId: string;
      isValid: boolean;
      verifiedAt: number;
      verifierIp?: string;
      verifierUserAgent?: string;
      _id: Id<"certificateVerifications">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "certificateId"
      | "isValid"
      | "verifiedAt"
      | "verifierIp"
      | "verifierUserAgent";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_certificate: ["certificateId", "verifiedAt", "_creationTime"];
      by_date: ["verifiedAt", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  changelogEntries: {
    document: {
      authorAvatar?: string;
      authorEmail?: string;
      authorName: string;
      category: "feature" | "improvement" | "fix" | "breaking" | "internal";
      commitMessage: string;
      commitSha: string;
      commitUrl: string;
      committedAt: number;
      createdAt: number;
      description?: string;
      isPublished: boolean;
      notificationId?: Id<"notifications">;
      notificationSent?: boolean;
      notificationSentAt?: number;
      title: string;
      updatedAt: number;
      _id: Id<"changelogEntries">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "authorAvatar"
      | "authorEmail"
      | "authorName"
      | "category"
      | "commitMessage"
      | "commitSha"
      | "committedAt"
      | "commitUrl"
      | "createdAt"
      | "description"
      | "isPublished"
      | "notificationId"
      | "notificationSent"
      | "notificationSentAt"
      | "title"
      | "updatedAt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_category: ["category", "_creationTime"];
      by_commitSha: ["commitSha", "_creationTime"];
      by_committedAt: ["committedAt", "_creationTime"];
      by_isPublished: ["isPublished", "_creationTime"];
      by_published_date: ["isPublished", "committedAt", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  changelogReleases: {
    document: {
      createdAt: number;
      description?: string;
      entryIds: Array<Id<"changelogEntries">>;
      isPublished: boolean;
      notificationSent?: boolean;
      notificationSentAt?: number;
      publishedAt?: number;
      title: string;
      updatedAt: number;
      version: string;
      _id: Id<"changelogReleases">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "createdAt"
      | "description"
      | "entryIds"
      | "isPublished"
      | "notificationSent"
      | "notificationSentAt"
      | "publishedAt"
      | "title"
      | "updatedAt"
      | "version";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_isPublished: ["isPublished", "_creationTime"];
      by_publishedAt: ["publishedAt", "_creationTime"];
      by_version: ["version", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  chapterAnalytics: {
    document: {
      avgEngagementScore: number;
      avgRewatches: number;
      avgTimeSpent: number;
      avgTimeToComplete: number;
      avgWatchTime: number;
      chapterId: string;
      chapterIndex: number;
      commonDropOffPoint?: number;
      completionRate: number;
      courseId: Id<"courses">;
      dropOffRate: number;
      questionsAsked: number;
      totalViews: number;
      uniqueStudents: number;
      updatedAt: number;
      _id: Id<"chapterAnalytics">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "avgEngagementScore"
      | "avgRewatches"
      | "avgTimeSpent"
      | "avgTimeToComplete"
      | "avgWatchTime"
      | "chapterId"
      | "chapterIndex"
      | "commonDropOffPoint"
      | "completionRate"
      | "courseId"
      | "dropOffRate"
      | "questionsAsked"
      | "totalViews"
      | "uniqueStudents"
      | "updatedAt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_chapter: ["chapterId", "_creationTime"];
      by_course: ["courseId", "chapterIndex", "_creationTime"];
      by_difficulty: ["avgRewatches", "_creationTime"];
      by_drop_off: ["dropOffRate", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  chatHistory: {
    document: {
      automationId: Id<"automations">;
      conversationId?: string;
      createdAt?: number;
      message: string;
      receiverId: string;
      role: "user" | "assistant";
      senderId: string;
      turnNumber?: number;
      _id: Id<"chatHistory">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "automationId"
      | "conversationId"
      | "createdAt"
      | "message"
      | "receiverId"
      | "role"
      | "senderId"
      | "turnNumber";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_automationId: ["automationId", "_creationTime"];
      by_automationId_and_sender: ["automationId", "senderId", "_creationTime"];
      by_conversationId: ["conversationId", "_creationTime"];
      by_senderId: ["senderId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  coachingSessions: {
    document: {
      coachId: string;
      discordChannelId?: string;
      discordCleanedUp?: boolean;
      discordRoleId?: string;
      discordSetupComplete?: boolean;
      duration: number;
      endTime: string;
      notes?: string;
      productId: Id<"digitalProducts">;
      reminderSent?: boolean;
      scheduledDate: number;
      sessionType?: string;
      startTime: string;
      status:
        | "SCHEDULED"
        | "IN_PROGRESS"
        | "COMPLETED"
        | "CANCELLED"
        | "NO_SHOW";
      studentId: string;
      totalCost: number;
      _id: Id<"coachingSessions">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "coachId"
      | "discordChannelId"
      | "discordCleanedUp"
      | "discordRoleId"
      | "discordSetupComplete"
      | "duration"
      | "endTime"
      | "notes"
      | "productId"
      | "reminderSent"
      | "scheduledDate"
      | "sessionType"
      | "startTime"
      | "status"
      | "studentId"
      | "totalCost";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_coachId: ["coachId", "_creationTime"];
      by_productId: ["productId", "_creationTime"];
      by_scheduledDate: ["scheduledDate", "_creationTime"];
      by_status: ["status", "_creationTime"];
      by_studentId: ["studentId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  coachProfiles: {
    document: {
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
      userId: string;
      _id: Id<"coachProfiles">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "alternativeContact"
      | "availableDays"
      | "availableHours"
      | "basePrice"
      | "category"
      | "certifications"
      | "description"
      | "discordId"
      | "discordUsername"
      | "imageSrc"
      | "isActive"
      | "location"
      | "notableProjects"
      | "professionalBackground"
      | "stripeAccountId"
      | "stripeAccountStatus"
      | "stripeConnectComplete"
      | "timezone"
      | "title"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  contentAccess: {
    document: {
      accessType: "free" | "purchase" | "subscription";
      creatorId: string;
      requiredTierId?: Id<"creatorSubscriptionTiers">;
      resourceId: string;
      resourceType: "course" | "product" | "coaching";
      storeId: string;
      _id: Id<"contentAccess">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "accessType"
      | "creatorId"
      | "requiredTierId"
      | "resourceId"
      | "resourceType"
      | "storeId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_creatorId: ["creatorId", "_creationTime"];
      by_resourceId: ["resourceId", "_creationTime"];
      by_resource_type: ["resourceId", "resourceType", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  coupons: {
    document: {
      applicableTo:
        | "all"
        | "courses"
        | "products"
        | "subscriptions"
        | "specific_items";
      code: string;
      createdAt: number;
      creatorId: string;
      currency?: string;
      currentUses: number;
      discountType: "percentage" | "fixed_amount";
      discountValue: number;
      firstTimeOnly: boolean;
      isActive: boolean;
      maxUses?: number;
      maxUsesPerUser?: number;
      minPurchaseAmount?: number;
      specificCourseIds?: Array<Id<"courses">>;
      specificPlanIds?: Array<Id<"subscriptionPlans">>;
      specificProductIds?: Array<Id<"digitalProducts">>;
      stackable: boolean;
      storeId: Id<"stores">;
      updatedAt: number;
      validFrom: number;
      validUntil?: number;
      _id: Id<"coupons">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "applicableTo"
      | "code"
      | "createdAt"
      | "creatorId"
      | "currency"
      | "currentUses"
      | "discountType"
      | "discountValue"
      | "firstTimeOnly"
      | "isActive"
      | "maxUses"
      | "maxUsesPerUser"
      | "minPurchaseAmount"
      | "specificCourseIds"
      | "specificPlanIds"
      | "specificProductIds"
      | "stackable"
      | "storeId"
      | "updatedAt"
      | "validFrom"
      | "validUntil";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_code: ["code", "_creationTime"];
      by_creator: ["creatorId", "isActive", "_creationTime"];
      by_store: ["storeId", "isActive", "_creationTime"];
      by_validity: ["validFrom", "validUntil", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  couponUsages: {
    document: {
      couponId: Id<"coupons">;
      discountApplied: number;
      orderId?: string;
      usedAt: number;
      userId: string;
      _id: Id<"couponUsages">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "couponId"
      | "discountApplied"
      | "orderId"
      | "usedAt"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_coupon: ["couponId", "usedAt", "_creationTime"];
      by_user: ["userId", "couponId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  courseAnalytics: {
    document: {
      activeStudents: number;
      avgRating?: number;
      avgTimeSpent: number;
      certificatesIssued: number;
      chaptersCompleted: number;
      chaptersStarted: number;
      completionRate: number;
      conversionRate: number;
      courseId: Id<"courses">;
      createdAt: number;
      creatorId: string;
      date: string;
      enrollments: number;
      netRevenue: number;
      refunds: number;
      revenue: number;
      updatedAt: number;
      views: number;
      _id: Id<"courseAnalytics">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "activeStudents"
      | "avgRating"
      | "avgTimeSpent"
      | "certificatesIssued"
      | "chaptersCompleted"
      | "chaptersStarted"
      | "completionRate"
      | "conversionRate"
      | "courseId"
      | "createdAt"
      | "creatorId"
      | "date"
      | "enrollments"
      | "netRevenue"
      | "refunds"
      | "revenue"
      | "updatedAt"
      | "views";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_course: ["courseId", "date", "_creationTime"];
      by_creator: ["creatorId", "date", "_creationTime"];
      by_date: ["date", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  courseCategories: {
    document: {
      name: string;
      _id: Id<"courseCategories">;
      _creationTime: number;
    };
    fieldPaths: "_creationTime" | "_id" | "name";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_name: ["name", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  courseChapters: {
    document: {
      audioGeneratedAt?: number;
      audioGenerationError?: string;
      audioGenerationStatus?: "pending" | "generating" | "completed" | "failed";
      audioUrl?: string;
      courseId: string;
      description?: string;
      generatedAudioUrl?: string;
      generatedVideoUrl?: string;
      isFree?: boolean;
      isPublished?: boolean;
      lessonId?: string;
      muxAssetId?: string;
      muxAssetStatus?: "waiting" | "preparing" | "ready" | "errored";
      muxPlaybackId?: string;
      muxUploadId?: string;
      position: number;
      title: string;
      videoDuration?: number;
      videoGeneratedAt?: number;
      videoGenerationError?: string;
      videoGenerationStatus?: "pending" | "generating" | "completed" | "failed";
      videoUrl?: string;
      _id: Id<"courseChapters">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "audioGeneratedAt"
      | "audioGenerationError"
      | "audioGenerationStatus"
      | "audioUrl"
      | "courseId"
      | "description"
      | "generatedAudioUrl"
      | "generatedVideoUrl"
      | "isFree"
      | "isPublished"
      | "lessonId"
      | "muxAssetId"
      | "muxAssetStatus"
      | "muxPlaybackId"
      | "muxUploadId"
      | "position"
      | "title"
      | "videoDuration"
      | "videoGeneratedAt"
      | "videoGenerationError"
      | "videoGenerationStatus"
      | "videoUrl";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_courseId: ["courseId", "_creationTime"];
      by_lessonId: ["lessonId", "_creationTime"];
      by_muxAssetId: ["muxAssetId", "_creationTime"];
      by_position: ["position", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  courseLessons: {
    document: {
      description?: string;
      moduleId: string;
      position: number;
      title: string;
      _id: Id<"courseLessons">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "description"
      | "moduleId"
      | "position"
      | "title";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_moduleId: ["moduleId", "_creationTime"];
      by_position: ["position", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  courseModules: {
    document: {
      courseId: string;
      description?: string;
      position: number;
      title: string;
      _id: Id<"courseModules">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "courseId"
      | "description"
      | "position"
      | "title";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_courseId: ["courseId", "_creationTime"];
      by_position: ["position", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  courseNotes: {
    document: {
      chapterId: Id<"courseChapters">;
      content: string;
      courseId: Id<"courses">;
      createdAt: number;
      isPublic: boolean;
      timestamp: number;
      updatedAt: number;
      userId: string;
      _id: Id<"courseNotes">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "chapterId"
      | "content"
      | "courseId"
      | "createdAt"
      | "isPublic"
      | "timestamp"
      | "updatedAt"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_chapter: ["chapterId", "_creationTime"];
      by_chapter_public: ["chapterId", "isPublic", "_creationTime"];
      by_chapter_user: ["chapterId", "userId", "_creationTime"];
      by_course: ["courseId", "_creationTime"];
      by_user: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  courseNotifications: {
    document: {
      changes: {
        modulesList?: Array<string>;
        newChapters: number;
        newLessons: number;
        newModules: number;
        updatedContent: boolean;
      };
      courseId: Id<"courses">;
      courseSnapshot: {
        totalChapters: number;
        totalLessons: number;
        totalModules: number;
      };
      creatorId: string;
      emailSent?: boolean;
      message: string;
      recipientCount: number;
      sentAt: number;
      title: string;
      _id: Id<"courseNotifications">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "changes"
      | "changes.modulesList"
      | "changes.newChapters"
      | "changes.newLessons"
      | "changes.newModules"
      | "changes.updatedContent"
      | "courseId"
      | "courseSnapshot"
      | "courseSnapshot.totalChapters"
      | "courseSnapshot.totalLessons"
      | "courseSnapshot.totalModules"
      | "creatorId"
      | "emailSent"
      | "message"
      | "recipientCount"
      | "sentAt"
      | "title";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_courseId: ["courseId", "_creationTime"];
      by_creatorId: ["creatorId", "_creationTime"];
      by_sentAt: ["sentAt", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  courses: {
    document: {
      acceptsPayPal?: boolean;
      acceptsStripe?: boolean;
      category?: string;
      checkoutDescription?: string;
      checkoutHeadline?: string;
      courseCategoryId?: string;
      deletedAt?: number;
      deletedBy?: string;
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
        appleMusic?: string;
        bandcamp?: string;
        deezer?: string;
        facebook?: string;
        instagram?: string;
        mixcloud?: string;
        soundcloud?: string;
        spotify?: string;
        tiktok?: string;
        twitch?: string;
        twitter?: string;
        youtube?: string;
      };
      followGateSteps?: Array<{
        mandatory: boolean;
        order: number;
        platform:
          | "email"
          | "instagram"
          | "tiktok"
          | "youtube"
          | "spotify"
          | "soundcloud"
          | "appleMusic"
          | "deezer"
          | "twitch"
          | "mixcloud"
          | "facebook"
          | "twitter"
          | "bandcamp";
        url?: string;
      }>;
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
      stripePriceId?: string;
      stripeProductId?: string;
      subcategory?: string;
      tags?: Array<string>;
      title: string;
      userId: string;
      _id: Id<"courses">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "acceptsPayPal"
      | "acceptsStripe"
      | "category"
      | "checkoutDescription"
      | "checkoutHeadline"
      | "courseCategoryId"
      | "deletedAt"
      | "deletedBy"
      | "description"
      | "followGateEnabled"
      | "followGateMessage"
      | "followGateRequirements"
      | "followGateRequirements.minFollowsRequired"
      | "followGateRequirements.requireEmail"
      | "followGateRequirements.requireInstagram"
      | "followGateRequirements.requireSpotify"
      | "followGateRequirements.requireTiktok"
      | "followGateRequirements.requireYoutube"
      | "followGateSocialLinks"
      | "followGateSocialLinks.appleMusic"
      | "followGateSocialLinks.bandcamp"
      | "followGateSocialLinks.deezer"
      | "followGateSocialLinks.facebook"
      | "followGateSocialLinks.instagram"
      | "followGateSocialLinks.mixcloud"
      | "followGateSocialLinks.soundcloud"
      | "followGateSocialLinks.spotify"
      | "followGateSocialLinks.tiktok"
      | "followGateSocialLinks.twitch"
      | "followGateSocialLinks.twitter"
      | "followGateSocialLinks.youtube"
      | "followGateSteps"
      | "guaranteeText"
      | "imageUrl"
      | "instructorId"
      | "isPinned"
      | "isPublished"
      | "paymentDescription"
      | "pinnedAt"
      | "price"
      | "showGuarantee"
      | "skillLevel"
      | "slug"
      | "storeId"
      | "stripePriceId"
      | "stripeProductId"
      | "subcategory"
      | "tags"
      | "title"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_category: ["category", "_creationTime"];
      by_categoryId: ["courseCategoryId", "_creationTime"];
      by_category_subcategory: ["category", "subcategory", "_creationTime"];
      by_instructorId: ["instructorId", "_creationTime"];
      by_instructor_published: ["instructorId", "isPublished", "_creationTime"];
      by_published: ["isPublished", "_creationTime"];
      by_slug: ["slug", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  creatorEarnings: {
    document: {
      creatorId: string;
      currency: string;
      grossAmount: number;
      netAmount: number;
      paidAt?: number;
      payoutStatus: "pending" | "processing" | "paid" | "failed";
      platformFee: number;
      processingFee: number;
      purchaseId?: Id<"purchases">;
      storeId: string;
      stripeTransferId?: string;
      subscriptionId?: Id<"userCreatorSubscriptions">;
      transactionType:
        | "course_sale"
        | "product_sale"
        | "subscription_payment"
        | "coaching_session";
      _id: Id<"creatorEarnings">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "creatorId"
      | "currency"
      | "grossAmount"
      | "netAmount"
      | "paidAt"
      | "payoutStatus"
      | "platformFee"
      | "processingFee"
      | "purchaseId"
      | "storeId"
      | "stripeTransferId"
      | "subscriptionId"
      | "transactionType";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_creatorId: ["creatorId", "_creationTime"];
      by_creator_status: ["creatorId", "payoutStatus", "_creationTime"];
      by_payoutStatus: ["payoutStatus", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
      by_transactionType: ["transactionType", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  creatorEmailSegments: {
    document: {
      cachedContactIds?: Array<Id<"emailContacts">>;
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
      createdAt: number;
      description: string;
      isDynamic: boolean;
      lastUpdated: number;
      memberCount: number;
      name: string;
      storeId: string;
      updatedAt: number;
      _id: Id<"creatorEmailSegments">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "cachedContactIds"
      | "conditions"
      | "createdAt"
      | "description"
      | "isDynamic"
      | "lastUpdated"
      | "memberCount"
      | "name"
      | "storeId"
      | "updatedAt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_name: ["storeId", "name", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  creatorPayouts: {
    document: {
      amount: number;
      createdAt: number;
      creatorId: string;
      currency: string;
      failureReason?: string;
      grossRevenue: number;
      netPayout: number;
      notes?: string;
      paymentProcessingFee: number;
      payoutDate?: number;
      payoutMethod: string;
      periodEnd: number;
      periodStart: number;
      platformFee: number;
      refunds: number;
      status: "pending" | "processing" | "completed" | "failed" | "on_hold";
      storeId: Id<"stores">;
      stripeConnectAccountId?: string;
      stripeTransferId?: string;
      taxWithheld?: number;
      totalSales: number;
      updatedAt: number;
      _id: Id<"creatorPayouts">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "amount"
      | "createdAt"
      | "creatorId"
      | "currency"
      | "failureReason"
      | "grossRevenue"
      | "netPayout"
      | "notes"
      | "paymentProcessingFee"
      | "payoutDate"
      | "payoutMethod"
      | "periodEnd"
      | "periodStart"
      | "platformFee"
      | "refunds"
      | "status"
      | "storeId"
      | "stripeConnectAccountId"
      | "stripeTransferId"
      | "taxWithheld"
      | "totalSales"
      | "updatedAt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_creator: ["creatorId", "status", "_creationTime"];
      by_period: ["periodStart", "periodEnd", "_creationTime"];
      by_status: ["status", "createdAt", "_creationTime"];
      by_store: ["storeId", "status", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  creatorPipeline: {
    document: {
      assignedTo?: string;
      audienceSize?: number;
      createdAt: number;
      daw?: string;
      draftingAt?: number;
      enrollmentCount?: number;
      firstSaleAt?: number;
      instagramHandle?: string;
      invitedAt?: number;
      lastTouchAt?: number;
      lastTouchType?: "dm" | "email" | "comment" | "call";
      nextStepNote?: string;
      niche?: string;
      productCount?: number;
      prospectAt?: number;
      publishedAt?: number;
      signedUpAt?: number;
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
      tiktokHandle?: string;
      totalRevenue?: number;
      updatedAt: number;
      userId: string;
      _id: Id<"creatorPipeline">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "assignedTo"
      | "audienceSize"
      | "createdAt"
      | "daw"
      | "draftingAt"
      | "enrollmentCount"
      | "firstSaleAt"
      | "instagramHandle"
      | "invitedAt"
      | "lastTouchAt"
      | "lastTouchType"
      | "nextStepNote"
      | "niche"
      | "productCount"
      | "prospectAt"
      | "publishedAt"
      | "signedUpAt"
      | "stage"
      | "storeId"
      | "tiktokHandle"
      | "totalRevenue"
      | "updatedAt"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_assignedTo_and_stage: ["assignedTo", "stage", "_creationTime"];
      by_stage_and_updatedAt: ["stage", "updatedAt", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  creatorSubscriptionTiers: {
    document: {
      benefits: Array<string>;
      creatorId: string;
      description: string;
      isActive: boolean;
      maxCourses?: number;
      priceMonthly: number;
      priceYearly?: number;
      storeId: string;
      stripePriceIdMonthly: string;
      stripePriceIdYearly?: string;
      tierName: string;
      trialDays?: number;
      _id: Id<"creatorSubscriptionTiers">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "benefits"
      | "creatorId"
      | "description"
      | "isActive"
      | "maxCourses"
      | "priceMonthly"
      | "priceYearly"
      | "storeId"
      | "stripePriceIdMonthly"
      | "stripePriceIdYearly"
      | "tierName"
      | "trialDays";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_active: ["isActive", "_creationTime"];
      by_creatorId: ["creatorId", "_creationTime"];
      by_creator_active: ["creatorId", "isActive", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  creditPackages: {
    document: {
      badge?: string;
      bonusCredits?: number;
      credits: number;
      description: string;
      displayOrder: number;
      isActive: boolean;
      name: string;
      priceUsd: number;
      purchaseCount: number;
      stripePriceId: string;
      _id: Id<"creditPackages">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "badge"
      | "bonusCredits"
      | "credits"
      | "description"
      | "displayOrder"
      | "isActive"
      | "name"
      | "priceUsd"
      | "purchaseCount"
      | "stripePriceId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_active: ["isActive", "_creationTime"];
      by_displayOrder: ["displayOrder", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  creditTransactions: {
    document: {
      amount: number;
      balance: number;
      description: string;
      metadata?: {
        dollarAmount?: number;
        packageName?: string;
        stripePaymentId?: string;
      };
      relatedResourceId?: string;
      relatedResourceType?: "sample" | "pack" | "credit_package";
      type: "purchase" | "spend" | "earn" | "bonus" | "refund";
      userId: string;
      _id: Id<"creditTransactions">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "amount"
      | "balance"
      | "description"
      | "metadata"
      | "metadata.dollarAmount"
      | "metadata.packageName"
      | "metadata.stripePaymentId"
      | "relatedResourceId"
      | "relatedResourceType"
      | "type"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_type: ["type", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
      by_user_type: ["userId", "type", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  ctaTemplates: {
    document: {
      courseId?: Id<"courses">;
      createdAt: number;
      description?: string;
      keyword: string;
      lastUsedAt?: number;
      name: string;
      productId?: Id<"digitalProducts">;
      productName?: string;
      storeId?: string;
      template: string;
      updatedAt: number;
      usageCount?: number;
      userId: string;
      _id: Id<"ctaTemplates">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "courseId"
      | "createdAt"
      | "description"
      | "keyword"
      | "lastUsedAt"
      | "name"
      | "productId"
      | "productName"
      | "storeId"
      | "template"
      | "updatedAt"
      | "usageCount"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_createdAt: ["createdAt", "_creationTime"];
      by_keyword: ["keyword", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
      by_userId_keyword: ["userId", "keyword", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  curatorPlaylists: {
    document: {
      acceptsSubmissions: boolean;
      applePlaylistUrl?: string;
      coverUrl?: string;
      creatorId: string;
      customSlug?: string;
      description?: string;
      genres?: Array<string>;
      isPublic: boolean;
      linkedProductId?: Id<"digitalProducts">;
      name: string;
      soundcloudPlaylistUrl?: string;
      spotifyPlaylistUrl?: string;
      submissionPricing: { currency: string; isFree: boolean; price?: number };
      submissionRules?: {
        allowedGenres?: Array<string>;
        guidelines?: string;
        maxLengthSeconds?: number;
        requiresMessage: boolean;
      };
      submissionSLA?: number;
      tags?: Array<string>;
      totalPlays: number;
      totalSubmissions: number;
      trackCount: number;
      _id: Id<"curatorPlaylists">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "acceptsSubmissions"
      | "applePlaylistUrl"
      | "coverUrl"
      | "creatorId"
      | "customSlug"
      | "description"
      | "genres"
      | "isPublic"
      | "linkedProductId"
      | "name"
      | "soundcloudPlaylistUrl"
      | "spotifyPlaylistUrl"
      | "submissionPricing"
      | "submissionPricing.currency"
      | "submissionPricing.isFree"
      | "submissionPricing.price"
      | "submissionRules"
      | "submissionRules.allowedGenres"
      | "submissionRules.guidelines"
      | "submissionRules.maxLengthSeconds"
      | "submissionRules.requiresMessage"
      | "submissionSLA"
      | "tags"
      | "totalPlays"
      | "totalSubmissions"
      | "trackCount";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_acceptsSubmissions: ["acceptsSubmissions", "_creationTime"];
      by_creatorId: ["creatorId", "_creationTime"];
      by_customSlug: ["customSlug", "_creationTime"];
      by_isPublic: ["isPublic", "_creationTime"];
      by_linkedProductId: ["linkedProductId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  curatorPlaylistTracks: {
    document: {
      addedAt: number;
      addedBy: string;
      featuredAt?: number;
      notes?: string;
      playlistId: Id<"curatorPlaylists">;
      position: number;
      trackId: Id<"userTracks">;
      _id: Id<"curatorPlaylistTracks">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "addedAt"
      | "addedBy"
      | "featuredAt"
      | "notes"
      | "playlistId"
      | "position"
      | "trackId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_playlistId: ["playlistId", "_creationTime"];
      by_playlistId_and_position: ["playlistId", "position", "_creationTime"];
      by_trackId: ["trackId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  currencyRates: {
    document: {
      baseCurrency: string;
      lastUpdated: number;
      rate: number;
      source: string;
      targetCurrency: string;
      _id: Id<"currencyRates">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "baseCurrency"
      | "lastUpdated"
      | "rate"
      | "source"
      | "targetCurrency";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_pair: ["baseCurrency", "targetCurrency", "_creationTime"];
      by_updated: ["lastUpdated", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  customers: {
    document: {
      activeCampaignId?: string;
      adminUserId: string;
      city?: string;
      clicksLinks?: boolean;
      country?: string;
      countryCode?: string;
      daw?: string;
      email: string;
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
      _id: Id<"customers">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "activeCampaignId"
      | "adminUserId"
      | "city"
      | "clicksLinks"
      | "country"
      | "countryCode"
      | "daw"
      | "email"
      | "genreSpecialty"
      | "goals"
      | "howLongProducing"
      | "lastActivity"
      | "lastOpenDate"
      | "musicAlias"
      | "name"
      | "notes"
      | "opensEmail"
      | "phone"
      | "score"
      | "source"
      | "state"
      | "stateCode"
      | "status"
      | "storeId"
      | "studentLevel"
      | "tags"
      | "totalSpent"
      | "type"
      | "typeOfMusic"
      | "whySignedUp"
      | "zipCode";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_adminUserId: ["adminUserId", "_creationTime"];
      by_email: ["email", "_creationTime"];
      by_email_and_store: ["email", "storeId", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
      by_type: ["type", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  customEventLogs: {
    document: {
      contactEmail?: string;
      contactId?: Id<"emailContacts">;
      customEventId: Id<"customEvents">;
      eventData?: any;
      source?: string;
      storeId: string;
      timestamp: number;
      workflowsTriggered: number;
      _id: Id<"customEventLogs">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "contactEmail"
      | "contactId"
      | "customEventId"
      | "eventData"
      | "source"
      | "storeId"
      | "timestamp"
      | "workflowsTriggered";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_contactId: ["contactId", "_creationTime"];
      by_customEventId: ["customEventId", "_creationTime"];
      by_storeId_timestamp: ["storeId", "timestamp", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  customEvents: {
    document: {
      createdAt: number;
      description?: string;
      eventName: string;
      isActive: boolean;
      lastFiredAt?: number;
      storeId: string;
      totalFires: number;
      workflowCount: number;
      _id: Id<"customEvents">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "createdAt"
      | "description"
      | "eventName"
      | "isActive"
      | "lastFiredAt"
      | "storeId"
      | "totalFires"
      | "workflowCount";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
      by_storeId_eventName: ["storeId", "eventName", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  digitalProducts: {
    document: {
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
      category?: string;
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
        appleMusic?: string;
        bandcamp?: string;
        deezer?: string;
        facebook?: string;
        instagram?: string;
        mixcloud?: string;
        soundcloud?: string;
        spotify?: string;
        tiktok?: string;
        twitch?: string;
        twitter?: string;
        youtube?: string;
      };
      followGateSteps?: Array<{
        mandatory: boolean;
        order: number;
        platform:
          | "email"
          | "instagram"
          | "tiktok"
          | "youtube"
          | "spotify"
          | "soundcloud"
          | "appleMusic"
          | "deezer"
          | "twitch"
          | "mixcloud"
          | "facebook"
          | "twitter"
          | "bandcamp";
        url?: string;
      }>;
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
      playlistCurationConfig?: {
        genresAccepted?: Array<string>;
        linkedPlaylistId?: Id<"curatorPlaylists">;
        maxSubmissionsPerMonth?: number;
        reviewTurnaroundDays?: number;
        submissionGuidelines?: string;
      };
      price: number;
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
        | "donation"
        | "release"
        | "lead-magnet";
      productType?:
        | "digital"
        | "urlMedia"
        | "coaching"
        | "effectChain"
        | "abletonRack"
        | "abletonPreset"
        | "playlistCuration";
      rackType?: "audioEffect" | "instrument" | "midiEffect" | "drumRack";
      releaseConfig?: {
        amazonMusicUrl?: string;
        appleMusicAlbumId?: string;
        appleMusicUrl?: string;
        artistName?: string;
        bandcampUrl?: string;
        coverArtStorageId?: string;
        coverArtUrl?: string;
        deezerUrl?: string;
        dripCampaignEnabled?: boolean;
        dripCampaignId?: Id<"dripCampaigns">;
        featuredArtists?: Array<string>;
        followUp48hEmailSent?: boolean;
        isrc?: string;
        label?: string;
        playlistPitchEmailSent?: boolean;
        playlistPitchEnabled?: boolean;
        playlistPitchMessage?: string;
        preSaveEmailSent?: boolean;
        preSaveEnabled?: boolean;
        preSaveEndDate?: number;
        preSaveStartDate?: number;
        releaseDate?: number;
        releaseDayEmailSent?: boolean;
        releaseTime?: string;
        releaseType?: "single" | "ep" | "album" | "mixtape" | "remix";
        smartLinkUrl?: string;
        soundcloudUrl?: string;
        spotifyAlbumId?: string;
        spotifyUri?: string;
        targetPlaylistCurators?: Array<string>;
        tidalUrl?: string;
        timezone?: string;
        trackTitle?: string;
        upc?: string;
        youtubeUrl?: string;
      };
      requiresMaxForLive?: boolean;
      sampleCategories?: Array<string>;
      sampleIds?: Array<Id<"audioSamples">>;
      sessionType?: string;
      slug?: string;
      stemsUrl?: string;
      storeId: string;
      style?: "button" | "callout" | "preview" | "card" | "minimal";
      tags?: Array<string>;
      targetPlugin?:
        | "serum"
        | "vital"
        | "massive"
        | "massive-x"
        | "omnisphere"
        | "sylenth1"
        | "phase-plant"
        | "pigments"
        | "diva"
        | "ana-2"
        | "spire"
        | "zebra"
        | "hive"
        | "ableton-wavetable"
        | "ableton-operator"
        | "ableton-analog"
        | "fl-sytrus"
        | "fl-harmor"
        | "fl-harmless"
        | "logic-alchemy"
        | "logic-retro-synth"
        | "fabfilter"
        | "soundtoys"
        | "valhalla"
        | "other";
      targetPluginVersion?: string;
      thirdPartyPlugins?: Array<string>;
      thumbnailStyle?: string;
      title: string;
      trackoutsUrl?: string;
      url?: string;
      userId: string;
      wavUrl?: string;
      _id: Id<"digitalProducts">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "abletonVersion"
      | "affiliateCommissionRate"
      | "affiliateCookieDuration"
      | "affiliateEnabled"
      | "affiliateMinPayout"
      | "availability"
      | "beatLeaseConfig"
      | "beatLeaseConfig.bpm"
      | "beatLeaseConfig.genre"
      | "beatLeaseConfig.key"
      | "beatLeaseConfig.tiers"
      | "bpm"
      | "buttonLabel"
      | "category"
      | "chainImageUrl"
      | "complexity"
      | "confirmationEmailBody"
      | "confirmationEmailSubject"
      | "cpuLoad"
      | "customFields"
      | "dawType"
      | "dawVersion"
      | "demoAudioUrl"
      | "description"
      | "discordRoleId"
      | "displayStyle"
      | "downloadUrl"
      | "duration"
      | "effectType"
      | "exclusivePurchaseId"
      | "exclusiveSoldAt"
      | "exclusiveSoldTo"
      | "fileFormat"
      | "fileSize"
      | "followGateEnabled"
      | "followGateMessage"
      | "followGateRequirements"
      | "followGateRequirements.minFollowsRequired"
      | "followGateRequirements.requireEmail"
      | "followGateRequirements.requireInstagram"
      | "followGateRequirements.requireSpotify"
      | "followGateRequirements.requireTiktok"
      | "followGateRequirements.requireYoutube"
      | "followGateSocialLinks"
      | "followGateSocialLinks.appleMusic"
      | "followGateSocialLinks.bandcamp"
      | "followGateSocialLinks.deezer"
      | "followGateSocialLinks.facebook"
      | "followGateSocialLinks.instagram"
      | "followGateSocialLinks.mixcloud"
      | "followGateSocialLinks.soundcloud"
      | "followGateSocialLinks.spotify"
      | "followGateSocialLinks.tiktok"
      | "followGateSocialLinks.twitch"
      | "followGateSocialLinks.twitter"
      | "followGateSocialLinks.youtube"
      | "followGateSteps"
      | "genre"
      | "imageUrl"
      | "installationNotes"
      | "isPinned"
      | "isPublished"
      | "macroCount"
      | "macroScreenshotUrls"
      | "mediaType"
      | "minAbletonVersion"
      | "musicalKey"
      | "orderBumpDescription"
      | "orderBumpEnabled"
      | "orderBumpImageUrl"
      | "orderBumpPrice"
      | "orderBumpProductName"
      | "packFiles"
      | "pinnedAt"
      | "playlistCurationConfig"
      | "playlistCurationConfig.genresAccepted"
      | "playlistCurationConfig.linkedPlaylistId"
      | "playlistCurationConfig.maxSubmissionsPerMonth"
      | "playlistCurationConfig.reviewTurnaroundDays"
      | "playlistCurationConfig.submissionGuidelines"
      | "price"
      | "productCategory"
      | "productType"
      | "rackType"
      | "releaseConfig"
      | "releaseConfig.amazonMusicUrl"
      | "releaseConfig.appleMusicAlbumId"
      | "releaseConfig.appleMusicUrl"
      | "releaseConfig.artistName"
      | "releaseConfig.bandcampUrl"
      | "releaseConfig.coverArtStorageId"
      | "releaseConfig.coverArtUrl"
      | "releaseConfig.deezerUrl"
      | "releaseConfig.dripCampaignEnabled"
      | "releaseConfig.dripCampaignId"
      | "releaseConfig.featuredArtists"
      | "releaseConfig.followUp48hEmailSent"
      | "releaseConfig.isrc"
      | "releaseConfig.label"
      | "releaseConfig.playlistPitchEmailSent"
      | "releaseConfig.playlistPitchEnabled"
      | "releaseConfig.playlistPitchMessage"
      | "releaseConfig.preSaveEmailSent"
      | "releaseConfig.preSaveEnabled"
      | "releaseConfig.preSaveEndDate"
      | "releaseConfig.preSaveStartDate"
      | "releaseConfig.releaseDate"
      | "releaseConfig.releaseDayEmailSent"
      | "releaseConfig.releaseTime"
      | "releaseConfig.releaseType"
      | "releaseConfig.smartLinkUrl"
      | "releaseConfig.soundcloudUrl"
      | "releaseConfig.spotifyAlbumId"
      | "releaseConfig.spotifyUri"
      | "releaseConfig.targetPlaylistCurators"
      | "releaseConfig.tidalUrl"
      | "releaseConfig.timezone"
      | "releaseConfig.trackTitle"
      | "releaseConfig.upc"
      | "releaseConfig.youtubeUrl"
      | "requiresMaxForLive"
      | "sampleCategories"
      | "sampleIds"
      | "sessionType"
      | "slug"
      | "stemsUrl"
      | "storeId"
      | "style"
      | "tags"
      | "targetPlugin"
      | "targetPluginVersion"
      | "thirdPartyPlugins"
      | "thumbnailStyle"
      | "title"
      | "trackoutsUrl"
      | "url"
      | "userId"
      | "wavUrl";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_productCategory: ["productCategory", "_creationTime"];
      by_slug: ["slug", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
      by_storeId_and_slug: ["storeId", "slug", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  discordEvents: {
    document: {
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
      timestamp: number;
      userId?: string;
      _id: Id<"discordEvents">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "discordUserId"
      | "eventType"
      | "guildId"
      | "metadata"
      | "timestamp"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_eventType: ["eventType", "_creationTime"];
      by_timestamp: ["timestamp", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  discordGuilds: {
    document: {
      botToken: string;
      courseRoles?: any;
      createdAt: number;
      creatorRole?: string;
      generalMemberRole?: string;
      guildId: string;
      guildName: string;
      inviteCode?: string;
      isActive: boolean;
      storeId: Id<"stores">;
      updatedAt: number;
      _id: Id<"discordGuilds">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "botToken"
      | "courseRoles"
      | "createdAt"
      | "creatorRole"
      | "generalMemberRole"
      | "guildId"
      | "guildName"
      | "inviteCode"
      | "isActive"
      | "storeId"
      | "updatedAt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_guildId: ["guildId", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  discordIntegrations: {
    document: {
      accessToken: string;
      assignedRoles: Array<string>;
      connectedAt: number;
      discordAvatar?: string;
      discordDiscriminator?: string;
      discordUserId: string;
      discordUsername: string;
      enrolledCourseIds: Array<Id<"courses">>;
      expiresAt: number;
      guildMemberStatus?: "invited" | "joined" | "left" | "kicked" | "banned";
      lastSyncedAt: number;
      refreshToken: string;
      userId: string;
      _id: Id<"discordIntegrations">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "accessToken"
      | "assignedRoles"
      | "connectedAt"
      | "discordAvatar"
      | "discordDiscriminator"
      | "discordUserId"
      | "discordUsername"
      | "enrolledCourseIds"
      | "expiresAt"
      | "guildMemberStatus"
      | "lastSyncedAt"
      | "refreshToken"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_discordUserId: ["discordUserId", "_creationTime"];
      by_lastSynced: ["lastSyncedAt", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  dmConversations: {
    document: {
      createdAt: number;
      lastMessageAt?: number;
      lastMessagePreview?: string;
      participant1Id: string;
      participant2Id: string;
      unreadByParticipant1?: number;
      unreadByParticipant2?: number;
      _id: Id<"dmConversations">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "createdAt"
      | "lastMessageAt"
      | "lastMessagePreview"
      | "participant1Id"
      | "participant2Id"
      | "unreadByParticipant1"
      | "unreadByParticipant2";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_lastMessage: ["lastMessageAt", "_creationTime"];
      by_participant1: ["participant1Id", "_creationTime"];
      by_participant2: ["participant2Id", "_creationTime"];
      by_participants: ["participant1Id", "participant2Id", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  dmMessages: {
    document: {
      attachments?: Array<{
        id: string;
        name: string;
        size: number;
        storageId: string;
        type: string;
        url?: string;
      }>;
      content: string;
      conversationId: Id<"dmConversations">;
      createdAt: number;
      readAt?: number;
      senderId: string;
      _id: Id<"dmMessages">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "attachments"
      | "content"
      | "conversationId"
      | "createdAt"
      | "readAt"
      | "senderId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_conversationId: ["conversationId", "_creationTime"];
      by_conversation_created: ["conversationId", "createdAt", "_creationTime"];
      by_createdAt: ["createdAt", "_creationTime"];
      by_senderId: ["senderId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  dripCampaignEnrollments: {
    document: {
      campaignId: Id<"dripCampaigns">;
      completedAt?: number;
      currentStepNumber: number;
      customerId?: string;
      email: string;
      enrolledAt: number;
      lastSentAt?: number;
      metadata?: any;
      name?: string;
      nextSendAt?: number;
      status: "active" | "completed" | "cancelled" | "paused";
      _id: Id<"dripCampaignEnrollments">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "campaignId"
      | "completedAt"
      | "currentStepNumber"
      | "customerId"
      | "email"
      | "enrolledAt"
      | "lastSentAt"
      | "metadata"
      | "name"
      | "nextSendAt"
      | "status";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_campaignId: ["campaignId", "_creationTime"];
      by_campaignId_and_email: ["campaignId", "email", "_creationTime"];
      by_email: ["email", "_creationTime"];
      by_status: ["status", "_creationTime"];
      by_status_and_nextSendAt: ["status", "nextSendAt", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  dripCampaigns: {
    document: {
      createdAt: number;
      description?: string;
      isActive: boolean;
      name: string;
      storeId: string;
      totalCompleted: number;
      totalEnrolled: number;
      triggerConfig?: any;
      triggerType: "lead_signup" | "product_purchase" | "tag_added" | "manual";
      updatedAt: number;
      _id: Id<"dripCampaigns">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "createdAt"
      | "description"
      | "isActive"
      | "name"
      | "storeId"
      | "totalCompleted"
      | "totalEnrolled"
      | "triggerConfig"
      | "triggerType"
      | "updatedAt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_active: ["isActive", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
      by_triggerType: ["triggerType", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  dripCampaignSteps: {
    document: {
      campaignId: Id<"dripCampaigns">;
      clickCount: number;
      createdAt: number;
      delayMinutes: number;
      htmlContent: string;
      isActive: boolean;
      openCount: number;
      sentCount: number;
      stepNumber: number;
      subject: string;
      textContent?: string;
      _id: Id<"dripCampaignSteps">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "campaignId"
      | "clickCount"
      | "createdAt"
      | "delayMinutes"
      | "htmlContent"
      | "isActive"
      | "openCount"
      | "sentCount"
      | "stepNumber"
      | "subject"
      | "textContent";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_campaignId: ["campaignId", "_creationTime"];
      by_stepNumber: ["campaignId", "stepNumber", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  emailABTests: {
    document: {
      campaignId: Id<"resendCampaigns">;
      completedAt?: number;
      confidenceLevel?: number;
      createdAt: number;
      isStatisticallySignificant?: boolean;
      sampleSize: number;
      startedAt?: number;
      status: "draft" | "running" | "analyzing" | "completed";
      testType: "subject" | "content" | "send_time" | "from_name";
      updatedAt: number;
      variants: Array<{
        clicked: number;
        conversions: number;
        delivered: number;
        id: string;
        name: string;
        opened: number;
        percentage: number;
        sent: number;
        value: string;
      }>;
      winner?: string;
      winnerMetric: "open_rate" | "click_rate" | "conversion_rate";
      winnerSentToRemaining: boolean;
      _id: Id<"emailABTests">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "campaignId"
      | "completedAt"
      | "confidenceLevel"
      | "createdAt"
      | "isStatisticallySignificant"
      | "sampleSize"
      | "startedAt"
      | "status"
      | "testType"
      | "updatedAt"
      | "variants"
      | "winner"
      | "winnerMetric"
      | "winnerSentToRemaining";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_campaignId: ["campaignId", "_creationTime"];
      by_status: ["status", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  emailCampaignRecipients: {
    document: {
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
      _id: Id<"emailCampaignRecipients">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "campaignId"
      | "clickedAt"
      | "customerEmail"
      | "customerId"
      | "customerName"
      | "deliveredAt"
      | "errorMessage"
      | "openedAt"
      | "resendMessageId"
      | "sentAt"
      | "status";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_campaignId: ["campaignId", "_creationTime"];
      by_campaignId_and_status: ["campaignId", "status", "_creationTime"];
      by_customerId: ["customerId", "_creationTime"];
      by_status: ["status", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  emailCampaigns: {
    document: {
      adminUserId: string;
      clickedCount?: number;
      content: string;
      deliveredCount?: number;
      excludeTagIds?: Array<Id<"emailTags">>;
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
      targetTagIds?: Array<Id<"emailTags">>;
      targetTagMode?: "all" | "any";
      templateId?: string;
      updatedAt?: number;
      _id: Id<"emailCampaigns">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "adminUserId"
      | "clickedCount"
      | "content"
      | "deliveredCount"
      | "excludeTagIds"
      | "fromEmail"
      | "name"
      | "openedCount"
      | "previewText"
      | "recipientCount"
      | "replyToEmail"
      | "scheduledAt"
      | "sentAt"
      | "sentCount"
      | "status"
      | "storeId"
      | "subject"
      | "tags"
      | "targetTagIds"
      | "targetTagMode"
      | "templateId"
      | "updatedAt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_adminUserId: ["adminUserId", "_creationTime"];
      by_status: ["status", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  emailContactActivity: {
    document: {
      activityType:
        | "subscribed"
        | "unsubscribed"
        | "email_sent"
        | "email_opened"
        | "email_clicked"
        | "email_bounced"
        | "tag_added"
        | "tag_removed"
        | "campaign_enrolled"
        | "campaign_completed"
        | "custom_field_updated";
      contactId: Id<"emailContacts">;
      metadata?: {
        campaignId?: Id<"dripCampaigns">;
        emailId?: string;
        emailSubject?: string;
        fieldName?: string;
        linkClicked?: string;
        newValue?: string;
        oldValue?: string;
        tagId?: Id<"emailTags">;
        tagName?: string;
        timestamp?: number;
      };
      storeId: string;
      timestamp: number;
      _id: Id<"emailContactActivity">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "activityType"
      | "contactId"
      | "metadata"
      | "metadata.campaignId"
      | "metadata.emailId"
      | "metadata.emailSubject"
      | "metadata.fieldName"
      | "metadata.linkClicked"
      | "metadata.newValue"
      | "metadata.oldValue"
      | "metadata.tagId"
      | "metadata.tagName"
      | "metadata.timestamp"
      | "storeId"
      | "timestamp";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_activityType: ["activityType", "_creationTime"];
      by_contactId: ["contactId", "_creationTime"];
      by_contactId_and_timestamp: ["contactId", "timestamp", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
      by_storeId_and_timestamp: ["storeId", "timestamp", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  emailContacts: {
    document: {
      createdAt: number;
      customFields?: any;
      customerId?: Id<"customers">;
      email: string;
      emailsClicked: number;
      emailsOpened: number;
      emailsSent: number;
      engagementScore?: number;
      firstName?: string;
      lastClickedAt?: number;
      lastName?: string;
      lastOpenedAt?: number;
      source?: string;
      sourceCourseId?: Id<"courses">;
      sourceProductId?: Id<"digitalProducts">;
      status: "subscribed" | "unsubscribed" | "bounced" | "complained";
      storeId: string;
      subscribedAt: number;
      tagIds: Array<Id<"emailTags">>;
      unsubscribedAt?: number;
      updatedAt: number;
      userId?: Id<"users">;
      _id: Id<"emailContacts">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "createdAt"
      | "customerId"
      | "customFields"
      | "email"
      | "emailsClicked"
      | "emailsOpened"
      | "emailsSent"
      | "engagementScore"
      | "firstName"
      | "lastClickedAt"
      | "lastName"
      | "lastOpenedAt"
      | "source"
      | "sourceCourseId"
      | "sourceProductId"
      | "status"
      | "storeId"
      | "subscribedAt"
      | "tagIds"
      | "unsubscribedAt"
      | "updatedAt"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_email: ["email", "_creationTime"];
      by_engagementScore: ["engagementScore", "_creationTime"];
      by_status: ["status", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
      by_storeId_and_email: ["storeId", "email", "_creationTime"];
      by_storeId_and_status: ["storeId", "status", "_creationTime"];
      by_storeId_status_engagementScore: [
        "storeId",
        "status",
        "engagementScore",
        "_creationTime",
      ];
      by_subscribedAt: ["subscribedAt", "_creationTime"];
    };
    searchIndexes: {
      search_email: {
        searchField: "email";
        filterFields: "storeId";
      };
    };
    vectorIndexes: {};
  };
  emailContactStats: {
    document: {
      bouncedCount: number;
      complainedCount: number;
      storeId: string;
      subscribedCount: number;
      totalContacts: number;
      unsubscribedCount: number;
      updatedAt: number;
      _id: Id<"emailContactStats">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "bouncedCount"
      | "complainedCount"
      | "storeId"
      | "subscribedCount"
      | "totalContacts"
      | "unsubscribedCount"
      | "updatedAt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  emailContactTags: {
    document: {
      contactId: Id<"emailContacts">;
      createdAt: number;
      storeId: string;
      tagId: Id<"emailTags">;
      _id: Id<"emailContactTags">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "contactId"
      | "createdAt"
      | "storeId"
      | "tagId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_contactId: ["contactId", "_creationTime"];
      by_contactId_and_tagId: ["contactId", "tagId", "_creationTime"];
      by_storeId_and_tagId: ["storeId", "tagId", "_creationTime"];
      by_tagId: ["tagId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  emailCreatorStats: {
    document: {
      bounceRate: number;
      bounced: number;
      clicked: number;
      date: string;
      delivered: number;
      domainId: Id<"emailDomains">;
      openRate: number;
      opened: number;
      reputationScore: number;
      sendingStatus: "active" | "warning" | "suspended";
      sent: number;
      spamComplaints: number;
      spamRate: number;
      storeId: Id<"stores">;
      unsubscribes: number;
      warnings?: Array<{
        message: string;
        timestamp: number;
        type:
          | "high_bounce"
          | "spam_complaints"
          | "low_engagement"
          | "rate_limit";
      }>;
      _id: Id<"emailCreatorStats">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "bounced"
      | "bounceRate"
      | "clicked"
      | "date"
      | "delivered"
      | "domainId"
      | "opened"
      | "openRate"
      | "reputationScore"
      | "sendingStatus"
      | "sent"
      | "spamComplaints"
      | "spamRate"
      | "storeId"
      | "unsubscribes"
      | "warnings";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_date: ["date", "_creationTime"];
      by_domainId: ["domainId", "_creationTime"];
      by_sendingStatus: ["sendingStatus", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
      by_storeId_and_date: ["storeId", "date", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  emailDeliverabilityEvents: {
    document: {
      broadcastId?: string;
      contactId?: Id<"emailContacts">;
      email: string;
      emailId?: string;
      eventType:
        | "hard_bounce"
        | "soft_bounce"
        | "spam_complaint"
        | "blocked"
        | "unsubscribe"
        | "delivery_delay";
      processed: boolean;
      reason?: string;
      sourceIp?: string;
      storeId: string;
      timestamp: number;
      workflowId?: Id<"emailWorkflows">;
      _id: Id<"emailDeliverabilityEvents">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "broadcastId"
      | "contactId"
      | "email"
      | "emailId"
      | "eventType"
      | "processed"
      | "reason"
      | "sourceIp"
      | "storeId"
      | "timestamp"
      | "workflowId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_contactId: ["contactId", "_creationTime"];
      by_email: ["email", "_creationTime"];
      by_eventType: ["storeId", "eventType", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
      by_storeId_timestamp: ["storeId", "timestamp", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  emailDeliverabilityStats: {
    document: {
      blocks: number;
      bounceRate: number;
      delivered: number;
      deliveryRate: number;
      hardBounces: number;
      healthScore: number;
      period: "daily" | "weekly" | "monthly";
      periodStart: number;
      softBounces: number;
      spamComplaints: number;
      spamRate: number;
      storeId: string;
      totalSent: number;
      unsubscribes: number;
      updatedAt: number;
      _id: Id<"emailDeliverabilityStats">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "blocks"
      | "bounceRate"
      | "delivered"
      | "deliveryRate"
      | "hardBounces"
      | "healthScore"
      | "period"
      | "periodStart"
      | "softBounces"
      | "spamComplaints"
      | "spamRate"
      | "storeId"
      | "totalSent"
      | "unsubscribes"
      | "updatedAt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
      by_storeId_period: ["storeId", "period", "_creationTime"];
      by_storeId_periodStart: ["storeId", "periodStart", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  emailDomainAlerts: {
    document: {
      createdAt: number;
      details?: string;
      domainId: Id<"emailDomains">;
      message: string;
      resolved: boolean;
      resolvedAt?: number;
      resolvedBy?: string;
      severity: "info" | "warning" | "critical";
      type:
        | "high_bounce_rate"
        | "spam_complaints"
        | "dns_issue"
        | "rate_limit_reached"
        | "reputation_drop"
        | "blacklist_detected";
      _id: Id<"emailDomainAlerts">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "createdAt"
      | "details"
      | "domainId"
      | "message"
      | "resolved"
      | "resolvedAt"
      | "resolvedBy"
      | "severity"
      | "type";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_createdAt: ["createdAt", "_creationTime"];
      by_domainId: ["domainId", "_creationTime"];
      by_resolved: ["resolved", "_creationTime"];
      by_severity: ["severity", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  emailDomainAnalytics: {
    document: {
      bounceRate: number;
      clickRate: number;
      date: string;
      deliveryRate: number;
      domainId: Id<"emailDomains">;
      hardBounces: number;
      hourlyStats?: Array<{
        clicked: number;
        delivered: number;
        hour: number;
        opened: number;
        sent: number;
      }>;
      openRate: number;
      softBounces: number;
      spamComplaints: number;
      spamRate: number;
      totalBounced: number;
      totalClicked: number;
      totalDelivered: number;
      totalFailed: number;
      totalOpened: number;
      totalSent: number;
      uniqueClicks: number;
      uniqueOpens: number;
      unsubscribes: number;
      _id: Id<"emailDomainAnalytics">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "bounceRate"
      | "clickRate"
      | "date"
      | "deliveryRate"
      | "domainId"
      | "hardBounces"
      | "hourlyStats"
      | "openRate"
      | "softBounces"
      | "spamComplaints"
      | "spamRate"
      | "totalBounced"
      | "totalClicked"
      | "totalDelivered"
      | "totalFailed"
      | "totalOpened"
      | "totalSent"
      | "uniqueClicks"
      | "uniqueOpens"
      | "unsubscribes";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_date: ["date", "_creationTime"];
      by_domainId: ["domainId", "_creationTime"];
      by_domainId_and_date: ["domainId", "date", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  emailDomainReputation: {
    document: {
      authenticationStatus: {
        dkim: "pass" | "fail" | "unknown";
        dmarc: "pass" | "fail" | "unknown";
        spf: "pass" | "fail" | "unknown";
      };
      blacklistStatus: Array<{
        lastChecked: number;
        list: string;
        listed: boolean;
      }>;
      domain: string;
      lastChecked: number;
      recommendations: Array<string>;
      reputationScore: number;
      storeId: string;
      _id: Id<"emailDomainReputation">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "authenticationStatus"
      | "authenticationStatus.dkim"
      | "authenticationStatus.dmarc"
      | "authenticationStatus.spf"
      | "blacklistStatus"
      | "domain"
      | "lastChecked"
      | "recommendations"
      | "reputationScore"
      | "storeId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_domain: ["domain", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  emailDomains: {
    document: {
      createdAt: number;
      createdBy: string;
      dnsRecords: {
        dkim: Array<{
          lastChecked?: number;
          name: string;
          record: string;
          verified: boolean;
        }>;
        dmarc: { lastChecked?: number; record: string; verified: boolean };
        mx?: { lastChecked?: number; record: string; verified: boolean };
        spf: { lastChecked?: number; record: string; verified: boolean };
      };
      domain: string;
      notes?: string;
      rateLimits: {
        currentDailyUsage: number;
        currentHourlyUsage: number;
        dailyLimit: number;
        hourlyLimit: number;
        resetAt: number;
      };
      reputation: {
        lastUpdated: number;
        score: number;
        status: "excellent" | "good" | "fair" | "poor" | "critical";
      };
      resendDomainId?: string;
      status: "pending" | "verifying" | "active" | "suspended" | "retired";
      type: "shared" | "dedicated" | "custom";
      _id: Id<"emailDomains">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "createdAt"
      | "createdBy"
      | "dnsRecords"
      | "dnsRecords.dkim"
      | "dnsRecords.dmarc"
      | "dnsRecords.dmarc.lastChecked"
      | "dnsRecords.dmarc.record"
      | "dnsRecords.dmarc.verified"
      | "dnsRecords.mx"
      | "dnsRecords.mx.lastChecked"
      | "dnsRecords.mx.record"
      | "dnsRecords.mx.verified"
      | "dnsRecords.spf"
      | "dnsRecords.spf.lastChecked"
      | "dnsRecords.spf.record"
      | "dnsRecords.spf.verified"
      | "domain"
      | "notes"
      | "rateLimits"
      | "rateLimits.currentDailyUsage"
      | "rateLimits.currentHourlyUsage"
      | "rateLimits.dailyLimit"
      | "rateLimits.hourlyLimit"
      | "rateLimits.resetAt"
      | "reputation"
      | "reputation.lastUpdated"
      | "reputation.score"
      | "reputation.status"
      | "resendDomainId"
      | "status"
      | "type";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_domain: ["domain", "_creationTime"];
      by_status: ["status", "_creationTime"];
      by_type: ["type", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  emailEvents: {
    document: {
      bounceReason?: string;
      bounceType?: "hard" | "soft";
      campaignId?: Id<"emailCampaigns">;
      domainId: Id<"emailDomains">;
      eventType:
        | "sent"
        | "delivered"
        | "opened"
        | "clicked"
        | "bounced"
        | "spam_complaint"
        | "unsubscribed";
      ipAddress?: string;
      messageId?: string;
      recipientEmail: string;
      storeId: Id<"stores">;
      timestamp: number;
      userAgent?: string;
      _id: Id<"emailEvents">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "bounceReason"
      | "bounceType"
      | "campaignId"
      | "domainId"
      | "eventType"
      | "ipAddress"
      | "messageId"
      | "recipientEmail"
      | "storeId"
      | "timestamp"
      | "userAgent";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_domainId: ["domainId", "_creationTime"];
      by_eventType: ["eventType", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
      by_timestamp: ["timestamp", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  emailFlows: {
    document: {
      flowName: string;
      isActive?: boolean;
      productId: string;
      _id: Id<"emailFlows">;
      _creationTime: number;
    };
    fieldPaths: "_creationTime" | "_id" | "flowName" | "isActive" | "productId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_productId: ["productId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  emailHealthMetrics: {
    document: {
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
      _id: Id<"emailHealthMetrics">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "activeSubscribers"
      | "bounceRate"
      | "connectionId"
      | "createdAt"
      | "date"
      | "deliverabilityScore"
      | "engagementRate"
      | "engagementTrend"
      | "inactiveSubscribers"
      | "listHealthScore"
      | "period"
      | "recommendations"
      | "spamComplaintRate"
      | "subscriberGrowth"
      | "totalSubscribers"
      | "unsubscribeRate";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_connectionId: ["connectionId", "_creationTime"];
      by_date: ["date", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  emailReplies: {
    document: {
      attachments?: Array<{
        contentType: string;
        filename: string;
        size: number;
        url: string;
      }>;
      campaignId?: Id<"resendCampaigns">;
      category?: "question" | "feedback" | "complaint" | "spam" | "other";
      creatorReply?: {
        message: string;
        sentAt: number;
        sentVia: "dashboard" | "email";
      };
      flagged?: boolean;
      fromEmail: string;
      fromName?: string;
      hasAttachments?: boolean;
      htmlBody?: string;
      inReplyTo?: string;
      internalNotes?: string;
      matchConfidence?: "high" | "medium" | "low" | "manual";
      messageId: string;
      readAt?: number;
      receivedAt: number;
      references?: Array<string>;
      repliedAt?: number;
      sentAt?: number;
      status: "new" | "read" | "replied" | "spam" | "archived";
      storeId?: Id<"stores">;
      subject: string;
      tags?: Array<string>;
      textBody?: string;
      toEmail: string;
      _id: Id<"emailReplies">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "attachments"
      | "campaignId"
      | "category"
      | "creatorReply"
      | "creatorReply.message"
      | "creatorReply.sentAt"
      | "creatorReply.sentVia"
      | "flagged"
      | "fromEmail"
      | "fromName"
      | "hasAttachments"
      | "htmlBody"
      | "inReplyTo"
      | "internalNotes"
      | "matchConfidence"
      | "messageId"
      | "readAt"
      | "receivedAt"
      | "references"
      | "repliedAt"
      | "sentAt"
      | "status"
      | "storeId"
      | "subject"
      | "tags"
      | "textBody"
      | "toEmail";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_campaignId: ["campaignId", "_creationTime"];
      by_fromEmail: ["fromEmail", "_creationTime"];
      by_messageId: ["messageId", "_creationTime"];
      by_receivedAt: ["receivedAt", "_creationTime"];
      by_status: ["status", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  emailSegments: {
    document: {
      cachedUserIds?: Array<string>;
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
      createdAt: number;
      description: string;
      isDynamic: boolean;
      lastUpdated: number;
      memberCount: number;
      name: string;
      updatedAt: number;
      _id: Id<"emailSegments">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "cachedUserIds"
      | "conditions"
      | "connectionId"
      | "createdAt"
      | "description"
      | "isDynamic"
      | "lastUpdated"
      | "memberCount"
      | "name"
      | "updatedAt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_connection: ["connectionId", "_creationTime"];
      by_isDynamic: ["isDynamic", "_creationTime"];
      by_name: ["name", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  emailTags: {
    document: {
      color?: string;
      contactCount: number;
      createdAt: number;
      description?: string;
      name: string;
      storeId: string;
      updatedAt: number;
      _id: Id<"emailTags">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "color"
      | "contactCount"
      | "createdAt"
      | "description"
      | "name"
      | "storeId"
      | "updatedAt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
      by_storeId_and_name: ["storeId", "name", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  emailTemplates: {
    document: {
      adminUserId: string;
      category?: string;
      content: string;
      description?: string;
      isDefault?: boolean;
      name: string;
      storeId: string;
      subject: string;
      thumbnail?: string;
      _id: Id<"emailTemplates">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "adminUserId"
      | "category"
      | "content"
      | "description"
      | "isDefault"
      | "name"
      | "storeId"
      | "subject"
      | "thumbnail";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_adminUserId: ["adminUserId", "_creationTime"];
      by_category: ["category", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  emailTestHistory: {
    document: {
      recipient: string;
      sentAt: number;
      storeId: string;
      subject: string;
      templateId?: string;
      userId: string;
      _id: Id<"emailTestHistory">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "recipient"
      | "sentAt"
      | "storeId"
      | "subject"
      | "templateId"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  emailWorkflows: {
    document: {
      avgClickRate?: number;
      avgOpenRate?: number;
      description?: string;
      edges: Array<{
        id: string;
        source: string;
        sourceHandle?: string;
        target: string;
        targetHandle?: string;
      }>;
      isActive?: boolean;
      lastExecuted?: number;
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
          | "goal";
      }>;
      storeId: string;
      totalExecutions?: number;
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
          | "email_reply";
      };
      userId: string;
      _id: Id<"emailWorkflows">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "avgClickRate"
      | "avgOpenRate"
      | "description"
      | "edges"
      | "isActive"
      | "lastExecuted"
      | "name"
      | "nodes"
      | "storeId"
      | "totalExecutions"
      | "trigger"
      | "trigger.config"
      | "trigger.type"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_active: ["isActive", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  embeddings: {
    document: {
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
      _id: Id<"embeddings">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "category"
      | "content"
      | "embedding"
      | "metadata"
      | "sourceId"
      | "sourceType"
      | "title"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_category: ["category", "_creationTime"];
      by_sourceId: ["sourceId", "_creationTime"];
      by_sourceType: ["sourceType", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
      by_user_category: ["userId", "category", "_creationTime"];
      by_user_sourceType: ["userId", "sourceType", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  enrollments: {
    document: {
      courseId: string;
      progress?: number;
      userId: string;
      _id: Id<"enrollments">;
      _creationTime: number;
    };
    fieldPaths: "_creationTime" | "_id" | "courseId" | "progress" | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_courseId: ["courseId", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
      by_user_course: ["userId", "courseId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  experiments: {
    document: {
      createdAt: number;
      createdBy: string;
      endDate?: number;
      hypothesis: string;
      metric: string;
      name: string;
      startDate: number;
      status: "draft" | "running" | "completed" | "cancelled";
      updatedAt: number;
      variantA: {
        assetUrl?: string;
        ctaText?: string;
        ctaUrl?: string;
        description: string;
        name: string;
      };
      variantAConversions?: number;
      variantAViews?: number;
      variantB: {
        assetUrl?: string;
        ctaText?: string;
        ctaUrl?: string;
        description: string;
        name: string;
      };
      variantBConversions?: number;
      variantBViews?: number;
      winner?: "A" | "B" | "tie";
      _id: Id<"experiments">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "createdAt"
      | "createdBy"
      | "endDate"
      | "hypothesis"
      | "metric"
      | "name"
      | "startDate"
      | "status"
      | "updatedAt"
      | "variantA"
      | "variantA.assetUrl"
      | "variantA.ctaText"
      | "variantA.ctaUrl"
      | "variantA.description"
      | "variantA.name"
      | "variantAConversions"
      | "variantAViews"
      | "variantB"
      | "variantB.assetUrl"
      | "variantB.ctaText"
      | "variantB.ctaUrl"
      | "variantB.description"
      | "variantB.name"
      | "variantBConversions"
      | "variantBViews"
      | "winner";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_status_and_startDate: ["status", "startDate", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  fanCounts: {
    document: {
      lastUpdated: number;
      leads: number;
      paying: number;
      storeId: string;
      subscriptions: number;
      totalCount: number;
      _id: Id<"fanCounts">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "lastUpdated"
      | "leads"
      | "paying"
      | "storeId"
      | "subscriptions"
      | "totalCount";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  followGateSubmissions: {
    document: {
      creatorId: string;
      downloadCount?: number;
      email: string;
      followedPlatforms: {
        appleMusic?: boolean;
        bandcamp?: boolean;
        deezer?: boolean;
        facebook?: boolean;
        instagram?: boolean;
        mixcloud?: boolean;
        soundcloud?: boolean;
        spotify?: boolean;
        tiktok?: boolean;
        twitch?: boolean;
        twitter?: boolean;
        youtube?: boolean;
      };
      hasDownloaded?: boolean;
      ipAddress?: string;
      lastDownloadAt?: number;
      name?: string;
      productId: Id<"digitalProducts">;
      storeId: string;
      submittedAt: number;
      userAgent?: string;
      _id: Id<"followGateSubmissions">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "creatorId"
      | "downloadCount"
      | "email"
      | "followedPlatforms"
      | "followedPlatforms.appleMusic"
      | "followedPlatforms.bandcamp"
      | "followedPlatforms.deezer"
      | "followedPlatforms.facebook"
      | "followedPlatforms.instagram"
      | "followedPlatforms.mixcloud"
      | "followedPlatforms.soundcloud"
      | "followedPlatforms.spotify"
      | "followedPlatforms.tiktok"
      | "followedPlatforms.twitch"
      | "followedPlatforms.twitter"
      | "followedPlatforms.youtube"
      | "hasDownloaded"
      | "ipAddress"
      | "lastDownloadAt"
      | "name"
      | "productId"
      | "storeId"
      | "submittedAt"
      | "userAgent";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_creator: ["creatorId", "_creationTime"];
      by_email: ["email", "_creationTime"];
      by_email_product: ["email", "productId", "_creationTime"];
      by_product: ["productId", "_creationTime"];
      by_store: ["storeId", "_creationTime"];
      by_submitted_at: ["submittedAt", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  freeTrials: {
    document: {
      convertedAt?: number;
      createdAt: number;
      planId: Id<"subscriptionPlans">;
      status: "active" | "converted" | "expired" | "canceled";
      storeId: Id<"stores">;
      subscriptionId?: Id<"subscriptions">;
      trialEnd: number;
      trialStart: number;
      userId: string;
      _id: Id<"freeTrials">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "convertedAt"
      | "createdAt"
      | "planId"
      | "status"
      | "storeId"
      | "subscriptionId"
      | "trialEnd"
      | "trialStart"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_expiry: ["trialEnd", "status", "_creationTime"];
      by_plan: ["planId", "status", "_creationTime"];
      by_user: ["userId", "status", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  generatedScripts: {
    document: {
      accountMatchScore?: number;
      actualPerformance?: {
        capturedAt: number;
        comments?: number;
        engagementRate?: number;
        likes?: number;
        performanceScore?: number;
        saves?: number;
        shares?: number;
        views?: number;
      };
      chapterId: Id<"courseChapters">;
      chapterPosition: number;
      chapterTitle: string;
      combinedScript: string;
      courseId: Id<"courses">;
      courseTitle: string;
      createdAt: number;
      generatedAt: number;
      generationBatchId?: string;
      instagramScript: string;
      lessonId?: string;
      moduleId?: string;
      predictionAccuracy?: number;
      socialMediaPostId?: Id<"socialMediaPosts">;
      sourceContentSnippet: string;
      status:
        | "generated"
        | "reviewed"
        | "scheduled"
        | "in_progress"
        | "completed"
        | "archived";
      storeId: string;
      suggestedAccountProfileId?: Id<"socialAccountProfiles">;
      suggestedCta?: string;
      suggestedKeyword?: string;
      tiktokScript: string;
      topicMatch?: Array<string>;
      updatedAt: number;
      userFeedback?: {
        audienceReaction?: "positive" | "mixed" | "negative";
        notes?: string;
        rating?: number;
        submittedAt: number;
        whatDidntWork?: Array<string>;
        whatWorked?: Array<string>;
      };
      userId: string;
      viralityAnalysis: {
        educationalValue: number;
        engagementPotential: number;
        reasoning: string;
        trendAlignment: number;
      };
      viralityScore: number;
      youtubeScript: string;
      _id: Id<"generatedScripts">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "accountMatchScore"
      | "actualPerformance"
      | "actualPerformance.capturedAt"
      | "actualPerformance.comments"
      | "actualPerformance.engagementRate"
      | "actualPerformance.likes"
      | "actualPerformance.performanceScore"
      | "actualPerformance.saves"
      | "actualPerformance.shares"
      | "actualPerformance.views"
      | "chapterId"
      | "chapterPosition"
      | "chapterTitle"
      | "combinedScript"
      | "courseId"
      | "courseTitle"
      | "createdAt"
      | "generatedAt"
      | "generationBatchId"
      | "instagramScript"
      | "lessonId"
      | "moduleId"
      | "predictionAccuracy"
      | "socialMediaPostId"
      | "sourceContentSnippet"
      | "status"
      | "storeId"
      | "suggestedAccountProfileId"
      | "suggestedCta"
      | "suggestedKeyword"
      | "tiktokScript"
      | "topicMatch"
      | "updatedAt"
      | "userFeedback"
      | "userFeedback.audienceReaction"
      | "userFeedback.notes"
      | "userFeedback.rating"
      | "userFeedback.submittedAt"
      | "userFeedback.whatDidntWork"
      | "userFeedback.whatWorked"
      | "userId"
      | "viralityAnalysis"
      | "viralityAnalysis.educationalValue"
      | "viralityAnalysis.engagementPotential"
      | "viralityAnalysis.reasoning"
      | "viralityAnalysis.trendAlignment"
      | "viralityScore"
      | "youtubeScript";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_chapterId: ["chapterId", "_creationTime"];
      by_courseId: ["courseId", "_creationTime"];
      by_generatedAt: ["generatedAt", "_creationTime"];
      by_status: ["status", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
      by_store_account_status: [
        "storeId",
        "suggestedAccountProfileId",
        "status",
        "_creationTime",
      ];
      by_suggestedAccountProfileId: [
        "suggestedAccountProfileId",
        "_creationTime",
      ];
      by_userId: ["userId", "_creationTime"];
      by_user_status: ["userId", "status", "_creationTime"];
      by_viralityScore: ["viralityScore", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  githubConfig: {
    document: {
      branch: string;
      createdAt: number;
      isConnected: boolean;
      lastSyncAt?: number;
      lastSyncCommitSha?: string;
      repository: string;
      updatedAt: number;
      _id: Id<"githubConfig">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "branch"
      | "createdAt"
      | "isConnected"
      | "lastSyncAt"
      | "lastSyncCommitSha"
      | "repository"
      | "updatedAt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_repository: ["repository", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  installmentPayments: {
    document: {
      amount: number;
      createdAt: number;
      dueDate: number;
      failureReason?: string;
      installmentNumber: number;
      paidAt?: number;
      paymentPlanId: Id<"paymentPlans">;
      retryAttempts: number;
      status: "pending" | "paid" | "failed" | "refunded";
      stripePaymentIntentId?: string;
      updatedAt: number;
      userId: string;
      _id: Id<"installmentPayments">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "amount"
      | "createdAt"
      | "dueDate"
      | "failureReason"
      | "installmentNumber"
      | "paidAt"
      | "paymentPlanId"
      | "retryAttempts"
      | "status"
      | "stripePaymentIntentId"
      | "updatedAt"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_plan: ["paymentPlanId", "installmentNumber", "_creationTime"];
      by_status: ["status", "dueDate", "_creationTime"];
      by_user: ["userId", "dueDate", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  integrations: {
    document: {
      expiresAt?: number;
      facebookPageAccessToken?: string;
      facebookPageId?: string;
      instagramId?: string;
      isActive: boolean;
      lastVerified?: number;
      name: "INSTAGRAM" | "FACEBOOK";
      profilePicture?: string;
      token: string;
      userId: Id<"users">;
      username?: string;
      _id: Id<"integrations">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "expiresAt"
      | "facebookPageAccessToken"
      | "facebookPageId"
      | "instagramId"
      | "isActive"
      | "lastVerified"
      | "name"
      | "profilePicture"
      | "token"
      | "userId"
      | "username";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_instagramId: ["instagramId", "_creationTime"];
      by_name: ["name", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  keywords: {
    document: {
      automationId: Id<"automations">;
      word: string;
      _id: Id<"keywords">;
      _creationTime: number;
    };
    fieldPaths: "_creationTime" | "_id" | "automationId" | "word";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_automationId: ["automationId", "_creationTime"];
      by_word: ["word", "_creationTime"];
    };
    searchIndexes: {
      search_keywords: {
        searchField: "word";
        filterFields: never;
      };
    };
    vectorIndexes: {};
  };
  leadMagnetAnalyses: {
    document: {
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
      _id: Id<"leadMagnetAnalyses">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "avgLeadMagnetScore"
      | "bundleIdeas"
      | "chapters"
      | "courseId"
      | "courseTitle"
      | "createdAt"
      | "name"
      | "totalChapters"
      | "totalVisualIdeas"
      | "updatedAt"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_courseId: ["courseId", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
      by_userId_and_courseId: ["userId", "courseId", "_creationTime"];
      by_userId_and_createdAt: ["userId", "createdAt", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  leadScoreHistory: {
    document: {
      changeReason: string;
      contactId: Id<"emailContacts">;
      newScore: number;
      previousScore: number;
      ruleId?: string;
      storeId: string;
      timestamp: number;
      _id: Id<"leadScoreHistory">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "changeReason"
      | "contactId"
      | "newScore"
      | "previousScore"
      | "ruleId"
      | "storeId"
      | "timestamp";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_contactId: ["contactId", "_creationTime"];
      by_storeId_timestamp: ["storeId", "timestamp", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  leadScores: {
    document: {
      courseEngagement: number;
      createdAt: number;
      daysSinceLastActivity: number;
      emailEngagement: number;
      grade: "A" | "B" | "C" | "D";
      lastActivity: number;
      lastDecayAt: number;
      purchaseActivity: number;
      score: number;
      scoreHistory: Array<{ reason: string; score: number; timestamp: number }>;
      totalEmailsClicked: number;
      totalEmailsOpened: number;
      totalPurchases: number;
      updatedAt: number;
      userId: string;
      _id: Id<"leadScores">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "courseEngagement"
      | "createdAt"
      | "daysSinceLastActivity"
      | "emailEngagement"
      | "grade"
      | "lastActivity"
      | "lastDecayAt"
      | "purchaseActivity"
      | "score"
      | "scoreHistory"
      | "totalEmailsClicked"
      | "totalEmailsOpened"
      | "totalPurchases"
      | "updatedAt"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_grade: ["grade", "_creationTime"];
      by_score: ["score", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  leadScoringRules: {
    document: {
      createdAt: number;
      description?: string;
      isActive: boolean;
      name: string;
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
      updatedAt: number;
      _id: Id<"leadScoringRules">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "createdAt"
      | "description"
      | "isActive"
      | "name"
      | "rules"
      | "storeId"
      | "updatedAt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_active: ["storeId", "isActive", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  leadScoringSummary: {
    document: {
      coldCount: number;
      hotCount: number;
      inactiveCount: number;
      lastRebuiltAt: number;
      needsAttentionCount: number;
      scoreBuckets?: Array<number>;
      storeId: string;
      totalScore: number;
      totalSubscribed: number;
      updatedAt: number;
      warmCount: number;
      _id: Id<"leadScoringSummary">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "coldCount"
      | "hotCount"
      | "inactiveCount"
      | "lastRebuiltAt"
      | "needsAttentionCount"
      | "scoreBuckets"
      | "storeId"
      | "totalScore"
      | "totalSubscribed"
      | "updatedAt"
      | "warmCount";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  leadSubmissions: {
    document: {
      adminUserId: string;
      downloadCount?: number;
      email: string;
      hasDownloaded?: boolean;
      ipAddress?: string;
      lastDownloadAt?: number;
      name: string;
      productId: Id<"digitalProducts">;
      source?: string;
      storeId: string;
      userAgent?: string;
      _id: Id<"leadSubmissions">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "adminUserId"
      | "downloadCount"
      | "email"
      | "hasDownloaded"
      | "ipAddress"
      | "lastDownloadAt"
      | "name"
      | "productId"
      | "source"
      | "storeId"
      | "userAgent";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_adminUserId: ["adminUserId", "_creationTime"];
      by_email: ["email", "_creationTime"];
      by_email_and_product: ["email", "productId", "_creationTime"];
      by_productId: ["productId", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  learnerPreferences: {
    document: {
      goal: "hobby" | "career" | "skills" | "certification";
      interests: Array<string>;
      onboardingCompletedAt?: number;
      skillLevel: "beginner" | "intermediate" | "advanced";
      userId: string;
      weeklyHours?: number;
      _id: Id<"learnerPreferences">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "goal"
      | "interests"
      | "onboardingCompletedAt"
      | "skillLevel"
      | "userId"
      | "weeklyHours";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  learningStreaks: {
    document: {
      currentStreak: number;
      lastActivityDate: string;
      longestStreak: number;
      streakMilestones: Array<number>;
      totalDaysActive: number;
      totalHoursLearned: number;
      updatedAt: number;
      userId: string;
      _id: Id<"learningStreaks">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "currentStreak"
      | "lastActivityDate"
      | "longestStreak"
      | "streakMilestones"
      | "totalDaysActive"
      | "totalHoursLearned"
      | "updatedAt"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_current_streak: ["currentStreak", "_creationTime"];
      by_last_activity: ["lastActivityDate", "_creationTime"];
      by_user: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  librarySessions: {
    document: {
      deviceType?: string;
      duration?: number;
      endedAt?: number;
      resourceId?: string;
      sessionType: "course" | "download" | "coaching" | "browse";
      startedAt: number;
      userAgent?: string;
      userId: string;
      _id: Id<"librarySessions">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "deviceType"
      | "duration"
      | "endedAt"
      | "resourceId"
      | "sessionType"
      | "startedAt"
      | "userAgent"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_resourceId: ["resourceId", "_creationTime"];
      by_sessionType: ["sessionType", "_creationTime"];
      by_startedAt: ["startedAt", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  linkClickAnalytics: {
    document: {
      browser?: string;
      campaign?: string;
      city?: string;
      clickedAt: number;
      country?: string;
      deviceType?: "desktop" | "mobile" | "tablet";
      linkId: Id<"linkInBioLinks">;
      medium?: string;
      os?: string;
      referrer?: string;
      region?: string;
      source?: string;
      storeId: Id<"stores">;
      userAgent?: string;
      _id: Id<"linkClickAnalytics">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "browser"
      | "campaign"
      | "city"
      | "clickedAt"
      | "country"
      | "deviceType"
      | "linkId"
      | "medium"
      | "os"
      | "referrer"
      | "region"
      | "source"
      | "storeId"
      | "userAgent";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_clickedAt: ["clickedAt", "_creationTime"];
      by_linkId: ["linkId", "_creationTime"];
      by_linkId_clickedAt: ["linkId", "clickedAt", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
      by_storeId_clickedAt: ["storeId", "clickedAt", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  linkInBioLinks: {
    document: {
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
      _id: Id<"linkInBioLinks">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "clicks"
      | "createdAt"
      | "description"
      | "icon"
      | "isActive"
      | "order"
      | "storeId"
      | "thumbnailUrl"
      | "title"
      | "updatedAt"
      | "url"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_isActive: ["isActive", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
      by_storeId_order: ["storeId", "order", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  listeners: {
    document: {
      aiKnowledge?: string;
      aiPersonality?: string;
      aiTemperature?: number;
      automationId: Id<"automations">;
      commentCount?: number;
      commentReply?: string;
      conversationTimeout?: number;
      dmCount?: number;
      listener: "MESSAGE" | "SMART_AI" | "SMARTAI";
      maxConversationTurns?: number;
      prompt: string;
      _id: Id<"listeners">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "aiKnowledge"
      | "aiPersonality"
      | "aiTemperature"
      | "automationId"
      | "commentCount"
      | "commentReply"
      | "conversationTimeout"
      | "dmCount"
      | "listener"
      | "maxConversationTurns"
      | "prompt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_automationId: ["automationId", "_creationTime"];
      by_listener: ["listener", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  listHygieneActions: {
    document: {
      actionType:
        | "hard_bounce_removal"
        | "soft_bounce_suppression"
        | "complaint_removal"
        | "inactive_removal"
        | "duplicate_removal";
      affectedCount: number;
      affectedEmails: Array<string>;
      connectionId: Id<"resendConnections">;
      createdAt: number;
      executedAt: number;
      executedBy: "automatic" | "manual";
      reason: string;
      status: "pending" | "completed" | "failed";
      _id: Id<"listHygieneActions">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "actionType"
      | "affectedCount"
      | "affectedEmails"
      | "connectionId"
      | "createdAt"
      | "executedAt"
      | "executedBy"
      | "reason"
      | "status";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_actionType: ["actionType", "_creationTime"];
      by_connectionId: ["connectionId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  liveViewers: {
    document: {
      chapterId?: Id<"courseChapters">;
      courseId: Id<"courses">;
      expiresAt: number;
      lastSeen: number;
      userId: string;
      _id: Id<"liveViewers">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "chapterId"
      | "courseId"
      | "expiresAt"
      | "lastSeen"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_course: ["courseId", "_creationTime"];
      by_course_user: ["courseId", "userId", "_creationTime"];
      by_expiresAt: ["expiresAt", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  membershipSubscriptions: {
    document: {
      amountPaid: number;
      billingCycle: "monthly" | "yearly" | "lifetime";
      cancelAtPeriodEnd: boolean;
      canceledAt?: number;
      createdAt: number;
      currency: string;
      currentPeriodEnd: number;
      currentPeriodStart: number;
      failedPaymentAttempts: number;
      nextBillingDate?: number;
      planId: Id<"subscriptionPlans">;
      status:
        | "active"
        | "canceled"
        | "past_due"
        | "expired"
        | "trialing"
        | "paused";
      storeId: Id<"stores">;
      stripeSubscriptionId?: string;
      trialEnd?: number;
      trialStart?: number;
      updatedAt: number;
      userId: string;
      _id: Id<"membershipSubscriptions">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "amountPaid"
      | "billingCycle"
      | "cancelAtPeriodEnd"
      | "canceledAt"
      | "createdAt"
      | "currency"
      | "currentPeriodEnd"
      | "currentPeriodStart"
      | "failedPaymentAttempts"
      | "nextBillingDate"
      | "planId"
      | "status"
      | "storeId"
      | "stripeSubscriptionId"
      | "trialEnd"
      | "trialStart"
      | "updatedAt"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_next_billing: ["nextBillingDate", "status", "_creationTime"];
      by_plan: ["planId", "status", "_creationTime"];
      by_store: ["storeId", "status", "_creationTime"];
      by_stripe_id: ["stripeSubscriptionId", "_creationTime"];
      by_user: ["userId", "status", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  musicPlaylists: {
    document: {
      artworkUrl?: string;
      description?: string;
      isCollaborative?: boolean;
      isPublic?: boolean;
      likeCount?: number;
      playCount?: number;
      slug?: string;
      title: string;
      totalDuration?: number;
      trackCount?: number;
      userId: string;
      _id: Id<"musicPlaylists">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "artworkUrl"
      | "description"
      | "isCollaborative"
      | "isPublic"
      | "likeCount"
      | "playCount"
      | "slug"
      | "title"
      | "totalDuration"
      | "trackCount"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_isPublic: ["isPublic", "_creationTime"];
      by_slug: ["slug", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  musicTracks: {
    document: {
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
      _id: Id<"musicTracks">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "artist"
      | "artistProfileId"
      | "artworkUrl"
      | "customDescription"
      | "customGenre"
      | "customTags"
      | "description"
      | "duration"
      | "embedUrl"
      | "genre"
      | "isFeatured"
      | "isPublic"
      | "likeCount"
      | "originalUrl"
      | "platform"
      | "playCount"
      | "releaseDate"
      | "shareCount"
      | "slug"
      | "storeId"
      | "tags"
      | "title"
      | "userId"
      | "viewCount";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_artistProfileId: ["artistProfileId", "_creationTime"];
      by_genre: ["genre", "_creationTime"];
      by_isFeatured: ["isFeatured", "_creationTime"];
      by_isPublic: ["isPublic", "_creationTime"];
      by_platform: ["platform", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  noteComments: {
    document: {
      authorId: string;
      content: string;
      isResolved: boolean;
      noteId: Id<"notes">;
      parentCommentId?: Id<"noteComments">;
      resolvedAt?: number;
      resolvedBy?: string;
      _id: Id<"noteComments">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "authorId"
      | "content"
      | "isResolved"
      | "noteId"
      | "parentCommentId"
      | "resolvedAt"
      | "resolvedBy";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_authorId: ["authorId", "_creationTime"];
      by_isResolved: ["isResolved", "_creationTime"];
      by_noteId: ["noteId", "_creationTime"];
      by_parentCommentId: ["parentCommentId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  noteFolders: {
    document: {
      color?: string;
      description?: string;
      icon?: string;
      isArchived: boolean;
      name: string;
      parentId?: Id<"noteFolders">;
      position: number;
      storeId: string;
      userId: string;
      _id: Id<"noteFolders">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "color"
      | "description"
      | "icon"
      | "isArchived"
      | "name"
      | "parentId"
      | "position"
      | "storeId"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_archived: ["isArchived", "_creationTime"];
      by_parentId: ["parentId", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
      by_user_and_parent: ["userId", "parentId", "_creationTime"];
      by_user_and_store: ["userId", "storeId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  notes: {
    document: {
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
      _id: Id<"notes">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "aiSummary"
      | "category"
      | "content"
      | "coverImage"
      | "folderId"
      | "icon"
      | "isArchived"
      | "isFavorite"
      | "isProcessedForRAG"
      | "isShared"
      | "isTemplate"
      | "lastEditedAt"
      | "lastViewedAt"
      | "linkedCourseId"
      | "plainTextContent"
      | "priority"
      | "readTimeMinutes"
      | "sharedWith"
      | "status"
      | "storeId"
      | "tags"
      | "templateCategory"
      | "title"
      | "userId"
      | "wordCount";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_category: ["category", "_creationTime"];
      by_folderId: ["folderId", "_creationTime"];
      by_isArchived: ["isArchived", "_creationTime"];
      by_isFavorite: ["isFavorite", "_creationTime"];
      by_isTemplate: ["isTemplate", "_creationTime"];
      by_lastEditedAt: ["lastEditedAt", "_creationTime"];
      by_linkedCourseId: ["linkedCourseId", "_creationTime"];
      by_status: ["status", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
      by_user_and_folder: ["userId", "folderId", "_creationTime"];
      by_user_and_store: ["userId", "storeId", "_creationTime"];
    };
    searchIndexes: {
      search_content: {
        searchField: "plainTextContent";
        filterFields: "isArchived" | "status" | "storeId" | "userId";
      };
    };
    vectorIndexes: {};
  };
  noteSources: {
    document: {
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
      _id: Id<"noteSources">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "contentChunks"
      | "createdAt"
      | "errorMessage"
      | "fileName"
      | "fileSize"
      | "generatedNoteIds"
      | "keyPoints"
      | "processedAt"
      | "rawContent"
      | "sourceType"
      | "status"
      | "storageId"
      | "storeId"
      | "summary"
      | "tags"
      | "title"
      | "url"
      | "userId"
      | "websiteAuthor"
      | "websiteDomain"
      | "websitePublishedDate"
      | "youtubeChannel"
      | "youtubeDuration"
      | "youtubeThumbnail"
      | "youtubeVideoId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_createdAt: ["createdAt", "_creationTime"];
      by_sourceType: ["sourceType", "_creationTime"];
      by_status: ["status", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
      by_user_and_store: ["userId", "storeId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  noteTemplates: {
    document: {
      category: string;
      content: string;
      createdBy: string;
      description: string;
      icon?: string;
      isPublic: boolean;
      name: string;
      tags: Array<string>;
      usageCount: number;
      _id: Id<"noteTemplates">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "category"
      | "content"
      | "createdBy"
      | "description"
      | "icon"
      | "isPublic"
      | "name"
      | "tags"
      | "usageCount";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_category: ["category", "_creationTime"];
      by_createdBy: ["createdBy", "_creationTime"];
      by_isPublic: ["isPublic", "_creationTime"];
      by_usageCount: ["usageCount", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  notificationPreferences: {
    document: {
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
      updatedAt: number;
      userId: string;
      _id: Id<"notificationPreferences">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "emailDigest"
      | "emailNotifications"
      | "emailNotifications.announcements"
      | "emailNotifications.courseUpdates"
      | "emailNotifications.earnings"
      | "emailNotifications.marketing"
      | "emailNotifications.mentions"
      | "emailNotifications.newContent"
      | "emailNotifications.purchases"
      | "emailNotifications.replies"
      | "emailNotifications.systemAlerts"
      | "inAppNotifications"
      | "inAppNotifications.announcements"
      | "inAppNotifications.courseUpdates"
      | "inAppNotifications.earnings"
      | "inAppNotifications.marketing"
      | "inAppNotifications.mentions"
      | "inAppNotifications.newContent"
      | "inAppNotifications.purchases"
      | "inAppNotifications.replies"
      | "inAppNotifications.systemAlerts"
      | "updatedAt"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  notifications: {
    document: {
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
      _id: Id<"notifications">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "actionLabel"
      | "createdAt"
      | "emailSent"
      | "emailSentAt"
      | "link"
      | "message"
      | "read"
      | "readAt"
      | "senderAvatar"
      | "senderId"
      | "senderName"
      | "senderType"
      | "title"
      | "type"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_createdAt: ["createdAt", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  pageVisitEvents: {
    document: {
      contactEmail?: string;
      contactId?: Id<"emailContacts">;
      pagePath: string;
      pageTitle?: string;
      pageUrl: string;
      referrer?: string;
      sessionId?: string;
      storeId: string;
      timestamp: number;
      userAgent?: string;
      workflowTriggered?: boolean;
      _id: Id<"pageVisitEvents">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "contactEmail"
      | "contactId"
      | "pagePath"
      | "pageTitle"
      | "pageUrl"
      | "referrer"
      | "sessionId"
      | "storeId"
      | "timestamp"
      | "userAgent"
      | "workflowTriggered";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_contactId: ["contactId", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
      by_storeId_pagePath: ["storeId", "pagePath", "_creationTime"];
      by_storeId_timestamp: ["storeId", "timestamp", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  paymentPlans: {
    document: {
      bundleId?: Id<"bundles">;
      courseId?: Id<"courses">;
      createdAt: number;
      downPayment: number;
      frequency: "weekly" | "biweekly" | "monthly";
      installmentAmount: number;
      installmentsMissed: number;
      installmentsPaid: number;
      nextPaymentDate: number;
      numberOfInstallments: number;
      productId?: Id<"digitalProducts">;
      remainingAmount: number;
      status: "active" | "completed" | "defaulted" | "canceled";
      stripeSubscriptionId?: string;
      totalAmount: number;
      updatedAt: number;
      userId: string;
      _id: Id<"paymentPlans">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "bundleId"
      | "courseId"
      | "createdAt"
      | "downPayment"
      | "frequency"
      | "installmentAmount"
      | "installmentsMissed"
      | "installmentsPaid"
      | "nextPaymentDate"
      | "numberOfInstallments"
      | "productId"
      | "remainingAmount"
      | "status"
      | "stripeSubscriptionId"
      | "totalAmount"
      | "updatedAt"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_course: ["courseId", "status", "_creationTime"];
      by_next_payment: ["nextPaymentDate", "status", "_creationTime"];
      by_user: ["userId", "status", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  payoutSchedules: {
    document: {
      createdAt: number;
      creatorId: string;
      dayOfMonth?: number;
      dayOfWeek?: number;
      frequency: "weekly" | "biweekly" | "monthly";
      isActive: boolean;
      lastPayoutDate?: number;
      minimumPayout: number;
      nextPayoutDate: number;
      storeId: Id<"stores">;
      updatedAt: number;
      _id: Id<"payoutSchedules">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "createdAt"
      | "creatorId"
      | "dayOfMonth"
      | "dayOfWeek"
      | "frequency"
      | "isActive"
      | "lastPayoutDate"
      | "minimumPayout"
      | "nextPayoutDate"
      | "storeId"
      | "updatedAt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_creator: ["creatorId", "_creationTime"];
      by_next_payout: ["nextPayoutDate", "isActive", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  playlistTracks: {
    document: {
      addedBy: string;
      playlistId: Id<"musicPlaylists">;
      position: number;
      timestamp: number;
      trackId: Id<"musicTracks">;
      _id: Id<"playlistTracks">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "addedBy"
      | "playlistId"
      | "position"
      | "timestamp"
      | "trackId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_playlistId: ["playlistId", "_creationTime"];
      by_playlist_position: ["playlistId", "position", "_creationTime"];
      by_position: ["position", "_creationTime"];
      by_trackId: ["trackId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  pluginCategories: {
    document: {
      createdAt: number;
      name: string;
      updatedAt: number;
      _id: Id<"pluginCategories">;
      _creationTime: number;
    };
    fieldPaths: "_creationTime" | "_id" | "createdAt" | "name" | "updatedAt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_name: ["name", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  pluginEffectCategories: {
    document: {
      createdAt: number;
      name: string;
      pluginTypeId?: Id<"pluginTypes">;
      updatedAt: number;
      _id: Id<"pluginEffectCategories">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "createdAt"
      | "name"
      | "pluginTypeId"
      | "updatedAt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_name: ["name", "_creationTime"];
      by_pluginTypeId: ["pluginTypeId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  pluginInstrumentCategories: {
    document: {
      createdAt: number;
      name: string;
      pluginTypeId?: Id<"pluginTypes">;
      updatedAt: number;
      _id: Id<"pluginInstrumentCategories">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "createdAt"
      | "name"
      | "pluginTypeId"
      | "updatedAt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_name: ["name", "_creationTime"];
      by_pluginTypeId: ["pluginTypeId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  plugins: {
    document: {
      audioUrl?: string;
      author?: string;
      categoryId?: Id<"pluginCategories">;
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
      updatedAt: number;
      userId?: string;
      videoScript?: string;
      videoUrl?: string;
      _id: Id<"plugins">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "audioUrl"
      | "author"
      | "categoryId"
      | "createdAt"
      | "description"
      | "effectCategoryId"
      | "image"
      | "instrumentCategoryId"
      | "isPublished"
      | "name"
      | "optInFormUrl"
      | "pluginTypeId"
      | "price"
      | "pricingType"
      | "purchaseUrl"
      | "slug"
      | "studioToolCategoryId"
      | "tags"
      | "updatedAt"
      | "userId"
      | "videoScript"
      | "videoUrl";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_categoryId: ["categoryId", "_creationTime"];
      by_effectCategoryId: ["effectCategoryId", "_creationTime"];
      by_instrumentCategoryId: ["instrumentCategoryId", "_creationTime"];
      by_pluginTypeId: ["pluginTypeId", "_creationTime"];
      by_published: ["isPublished", "_creationTime"];
      by_slug: ["slug", "_creationTime"];
      by_studioToolCategoryId: ["studioToolCategoryId", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
    };
    searchIndexes: {
      search_name: {
        searchField: "name";
        filterFields: "isPublished" | "pricingType";
      };
    };
    vectorIndexes: {};
  };
  pluginStudioToolCategories: {
    document: {
      createdAt: number;
      name: string;
      pluginTypeId?: Id<"pluginTypes">;
      updatedAt: number;
      _id: Id<"pluginStudioToolCategories">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "createdAt"
      | "name"
      | "pluginTypeId"
      | "updatedAt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_name: ["name", "_creationTime"];
      by_pluginTypeId: ["pluginTypeId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  pluginTypes: {
    document: {
      createdAt: number;
      name: string;
      updatedAt: number;
      _id: Id<"pluginTypes">;
      _creationTime: number;
    };
    fieldPaths: "_creationTime" | "_id" | "createdAt" | "name" | "updatedAt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_name: ["name", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  postAnalytics: {
    document: {
      clicks?: number;
      comments: number;
      engagementRate?: number;
      followerCount?: number;
      hoursAfterPost?: number;
      impressions?: number;
      likes: number;
      platform: "instagram" | "twitter" | "facebook" | "tiktok" | "linkedin";
      platformPostId: string;
      reach?: number;
      saves?: number;
      scheduledPostId: Id<"scheduledPosts">;
      shares: number;
      socialAccountId: Id<"socialAccounts">;
      storeId: string;
      timestamp: number;
      views?: number;
      _id: Id<"postAnalytics">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "clicks"
      | "comments"
      | "engagementRate"
      | "followerCount"
      | "hoursAfterPost"
      | "impressions"
      | "likes"
      | "platform"
      | "platformPostId"
      | "reach"
      | "saves"
      | "scheduledPostId"
      | "shares"
      | "socialAccountId"
      | "storeId"
      | "timestamp"
      | "views";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_platform: ["platform", "_creationTime"];
      by_scheduledPostId: ["scheduledPostId", "_creationTime"];
      by_socialAccountId: ["socialAccountId", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
      by_timestamp: ["timestamp", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  posts: {
    document: {
      automationId: Id<"automations">;
      caption?: string;
      media: string;
      mediaType: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | "GLOBAL";
      permalink?: string;
      postId: string;
      timestamp?: number;
      _id: Id<"posts">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "automationId"
      | "caption"
      | "media"
      | "mediaType"
      | "permalink"
      | "postId"
      | "timestamp";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_automationId: ["automationId", "_creationTime"];
      by_postId: ["postId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  postTemplates: {
    document: {
      category?: string;
      content: string;
      description?: string;
      lastUsed?: number;
      mediaUrls?: Array<string>;
      name: string;
      platforms: Array<
        "instagram" | "twitter" | "facebook" | "tiktok" | "linkedin"
      >;
      storeId: string;
      useCount: number;
      userId: string;
      _id: Id<"postTemplates">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "category"
      | "content"
      | "description"
      | "lastUsed"
      | "mediaUrls"
      | "name"
      | "platforms"
      | "storeId"
      | "useCount"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_category: ["category", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  productReviews: {
    document: {
      customerName?: string;
      productId: string;
      rating?: number;
      reviewText: string;
      _id: Id<"productReviews">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "customerName"
      | "productId"
      | "rating"
      | "reviewText";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_productId: ["productId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  productViews: {
    document: {
      country?: string;
      device?: string;
      referrer?: string;
      resourceId: string;
      resourceType: "course" | "digitalProduct";
      sessionId?: string;
      storeId: string;
      timestamp: number;
      userId?: string;
      viewDuration?: number;
      _id: Id<"productViews">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "country"
      | "device"
      | "referrer"
      | "resourceId"
      | "resourceType"
      | "sessionId"
      | "storeId"
      | "timestamp"
      | "userId"
      | "viewDuration";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_resourceId: ["resourceId", "_creationTime"];
      by_resourceType: ["resourceType", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
      by_store_resource: ["storeId", "resourceId", "_creationTime"];
      by_store_timestamp: ["storeId", "timestamp", "_creationTime"];
      by_timestamp: ["timestamp", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  purchases: {
    document: {
      accessExpiresAt?: number;
      accessGranted?: boolean;
      adminUserId: string;
      amount: number;
      beatLicenseId?: Id<"beatLicenses">;
      bundleId?: Id<"bundles">;
      courseId?: Id<"courses">;
      currency?: string;
      customerId?: Id<"customers">;
      downloadCount?: number;
      isPaidOut?: boolean;
      lastAccessedAt?: number;
      paidOutAt?: number;
      paymentMethod?: string;
      payoutId?: string;
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
      _id: Id<"purchases">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "accessExpiresAt"
      | "accessGranted"
      | "adminUserId"
      | "amount"
      | "beatLicenseId"
      | "bundleId"
      | "courseId"
      | "currency"
      | "customerId"
      | "downloadCount"
      | "isPaidOut"
      | "lastAccessedAt"
      | "paidOutAt"
      | "paymentMethod"
      | "payoutId"
      | "productId"
      | "productType"
      | "status"
      | "storeId"
      | "transactionId"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_adminUserId: ["adminUserId", "_creationTime"];
      by_courseId: ["courseId", "_creationTime"];
      by_customerId: ["customerId", "_creationTime"];
      by_productId: ["productId", "_creationTime"];
      by_productType: ["productType", "_creationTime"];
      by_status: ["status", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
      by_store_status: ["storeId", "status", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
      by_user_course: ["userId", "courseId", "_creationTime"];
      by_user_product: ["userId", "productId", "_creationTime"];
      by_user_status: ["userId", "status", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  qaVotes: {
    document: {
      createdAt: number;
      targetId: string;
      targetType: "question" | "answer";
      userId: string;
      voteType: "upvote" | "downvote";
      _id: Id<"qaVotes">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "createdAt"
      | "targetId"
      | "targetType"
      | "userId"
      | "voteType";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_target: ["targetType", "targetId", "_creationTime"];
      by_user_and_target: ["userId", "targetType", "targetId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  questionBanks: {
    document: {
      courseId?: Id<"courses">;
      createdAt: number;
      description?: string;
      instructorId: string;
      questionIds: Array<Id<"quizQuestions">>;
      tags: Array<string>;
      title: string;
      updatedAt: number;
      _id: Id<"questionBanks">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "courseId"
      | "createdAt"
      | "description"
      | "instructorId"
      | "questionIds"
      | "tags"
      | "title"
      | "updatedAt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_course: ["courseId", "_creationTime"];
      by_instructor: ["instructorId", "createdAt", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  questions: {
    document: {
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
      _id: Id<"questions">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "acceptedAnswerId"
      | "answerCount"
      | "authorAvatar"
      | "authorId"
      | "authorName"
      | "chapterIndex"
      | "content"
      | "courseId"
      | "createdAt"
      | "isResolved"
      | "lastActivityAt"
      | "lessonId"
      | "lessonIndex"
      | "title"
      | "updatedAt"
      | "upvotes"
      | "viewCount";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_author: ["authorId", "createdAt", "_creationTime"];
      by_course: ["courseId", "lastActivityAt", "_creationTime"];
      by_lesson: ["courseId", "lessonId", "lastActivityAt", "_creationTime"];
      by_resolved: [
        "courseId",
        "isResolved",
        "lastActivityAt",
        "_creationTime",
      ];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  quizAttempts: {
    document: {
      answers: Array<{
        answer: any;
        feedback?: string;
        gradedAt?: number;
        isCorrect?: boolean;
        pointsEarned?: number;
        questionId: Id<"quizQuestions">;
      }>;
      attemptNumber: number;
      courseId: Id<"courses">;
      createdAt: number;
      passed?: boolean;
      percentage?: number;
      quizId: Id<"quizzes">;
      score?: number;
      startedAt: number;
      status: "in_progress" | "submitted" | "graded" | "expired";
      submittedAt?: number;
      timeSpent?: number;
      updatedAt: number;
      userId: string;
      _id: Id<"quizAttempts">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "answers"
      | "attemptNumber"
      | "courseId"
      | "createdAt"
      | "passed"
      | "percentage"
      | "quizId"
      | "score"
      | "startedAt"
      | "status"
      | "submittedAt"
      | "timeSpent"
      | "updatedAt"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_quiz: ["quizId", "status", "_creationTime"];
      by_user: ["userId", "submittedAt", "_creationTime"];
      by_user_and_quiz: ["userId", "quizId", "attemptNumber", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  quizQuestions: {
    document: {
      answers: any;
      caseSensitive?: boolean;
      createdAt: number;
      explanation?: string;
      order: number;
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
      updatedAt: number;
      _id: Id<"quizQuestions">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "answers"
      | "caseSensitive"
      | "createdAt"
      | "explanation"
      | "order"
      | "partialCredit"
      | "points"
      | "questionImage"
      | "questionText"
      | "questionType"
      | "quizId"
      | "updatedAt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_quiz: ["quizId", "order", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  quizResults: {
    document: {
      averagePercentage: number;
      averageScore: number;
      bestAttemptId: Id<"quizAttempts">;
      bestPercentage: number;
      bestScore: number;
      completedAt?: number;
      courseId: Id<"courses">;
      createdAt: number;
      firstPassedAt?: number;
      hasPassed: boolean;
      isCompleted: boolean;
      quizId: Id<"quizzes">;
      totalAttempts: number;
      updatedAt: number;
      userId: string;
      _id: Id<"quizResults">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "averagePercentage"
      | "averageScore"
      | "bestAttemptId"
      | "bestPercentage"
      | "bestScore"
      | "completedAt"
      | "courseId"
      | "createdAt"
      | "firstPassedAt"
      | "hasPassed"
      | "isCompleted"
      | "quizId"
      | "totalAttempts"
      | "updatedAt"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_quiz: ["quizId", "hasPassed", "_creationTime"];
      by_user: ["userId", "courseId", "_creationTime"];
      by_user_and_quiz: ["userId", "quizId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  quizzes: {
    document: {
      availableFrom?: number;
      availableUntil?: number;
      chapterId?: string;
      courseId: Id<"courses">;
      createdAt: number;
      description?: string;
      instructorId: string;
      isPublished: boolean;
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
      totalPoints: number;
      updatedAt: number;
      _id: Id<"quizzes">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "availableFrom"
      | "availableUntil"
      | "chapterId"
      | "courseId"
      | "createdAt"
      | "description"
      | "instructorId"
      | "isPublished"
      | "maxAttempts"
      | "passingScore"
      | "quizType"
      | "requiredToPass"
      | "showCorrectAnswers"
      | "showScoreImmediately"
      | "shuffleAnswers"
      | "shuffleQuestions"
      | "timeLimit"
      | "title"
      | "totalPoints"
      | "updatedAt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_chapter: ["chapterId", "_creationTime"];
      by_course: ["courseId", "isPublished", "_creationTime"];
      by_instructor: ["instructorId", "createdAt", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  recommendations: {
    document: {
      expiresAt: number;
      generatedAt: number;
      recommendations: Array<{
        courseId: Id<"courses">;
        reason: string;
        score: number;
      }>;
      userId: string;
      _id: Id<"recommendations">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "expiresAt"
      | "generatedAt"
      | "recommendations"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_expiry: ["expiresAt", "_creationTime"];
      by_user: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  referrals: {
    document: {
      createdAt: number;
      expiresAt?: number;
      firstPurchaseAt?: number;
      hasReferredMadePurchase: boolean;
      referralCode: string;
      referredUserId: string;
      referrerUserId: string;
      rewardAmount: number;
      rewardReferred: number;
      rewardReferrer: number;
      rewardType: "credits" | "discount" | "cash";
      rewardedAt?: number;
      status: "pending" | "completed" | "rewarded" | "expired";
      _id: Id<"referrals">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "createdAt"
      | "expiresAt"
      | "firstPurchaseAt"
      | "hasReferredMadePurchase"
      | "referralCode"
      | "referredUserId"
      | "referrerUserId"
      | "rewardAmount"
      | "rewardedAt"
      | "rewardReferred"
      | "rewardReferrer"
      | "rewardType"
      | "status";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_code: ["referralCode", "_creationTime"];
      by_referred: ["referredUserId", "_creationTime"];
      by_referrer: ["referrerUserId", "status", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  refunds: {
    document: {
      approvedBy?: string;
      createdAt: number;
      creatorId: string;
      denialReason?: string;
      itemId: string;
      itemType: "course" | "product" | "subscription" | "bundle";
      orderId: string;
      originalAmount: number;
      processedAt?: number;
      reason: string;
      refundAmount: number;
      refundType: "full" | "partial";
      requestedAt: number;
      requestedBy: string;
      revokeAccess: boolean;
      status: "requested" | "approved" | "processed" | "denied" | "canceled";
      storeId: Id<"stores">;
      stripeRefundId?: string;
      updatedAt: number;
      userId: string;
      _id: Id<"refunds">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "approvedBy"
      | "createdAt"
      | "creatorId"
      | "denialReason"
      | "itemId"
      | "itemType"
      | "orderId"
      | "originalAmount"
      | "processedAt"
      | "reason"
      | "refundAmount"
      | "refundType"
      | "requestedAt"
      | "requestedBy"
      | "revokeAccess"
      | "status"
      | "storeId"
      | "stripeRefundId"
      | "updatedAt"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_order: ["orderId", "_creationTime"];
      by_status: ["status", "requestedAt", "_creationTime"];
      by_store: ["storeId", "status", "_creationTime"];
      by_user: ["userId", "status", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  releasePreSaves: {
    document: {
      addedToPlaylist?: boolean;
      appleMusicUserToken?: string;
      creatorId: string;
      dripCampaignEnrollmentId?: Id<"dripCampaignEnrollments">;
      email: string;
      enrolledInDripCampaign?: boolean;
      followUp48hEmailSent?: boolean;
      hasStreamed?: boolean;
      ipAddress?: string;
      name?: string;
      platforms: {
        amazonMusic?: boolean;
        appleMusic?: boolean;
        deezer?: boolean;
        spotify?: boolean;
        tidal?: boolean;
      };
      playlistPitchEmailSent?: boolean;
      preSaveConfirmationSent?: boolean;
      preSavedAt: number;
      releaseDayEmailSent?: boolean;
      releaseId: Id<"digitalProducts">;
      source?: string;
      spotifyAccessToken?: string;
      spotifyRefreshToken?: string;
      spotifyUserId?: string;
      storeId: string;
      userAgent?: string;
      _id: Id<"releasePreSaves">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "addedToPlaylist"
      | "appleMusicUserToken"
      | "creatorId"
      | "dripCampaignEnrollmentId"
      | "email"
      | "enrolledInDripCampaign"
      | "followUp48hEmailSent"
      | "hasStreamed"
      | "ipAddress"
      | "name"
      | "platforms"
      | "platforms.amazonMusic"
      | "platforms.appleMusic"
      | "platforms.deezer"
      | "platforms.spotify"
      | "platforms.tidal"
      | "playlistPitchEmailSent"
      | "preSaveConfirmationSent"
      | "preSavedAt"
      | "releaseDayEmailSent"
      | "releaseId"
      | "source"
      | "spotifyAccessToken"
      | "spotifyRefreshToken"
      | "spotifyUserId"
      | "storeId"
      | "userAgent";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_creator: ["creatorId", "_creationTime"];
      by_email: ["email", "_creationTime"];
      by_email_release: ["email", "releaseId", "_creationTime"];
      by_presaved_at: ["preSavedAt", "_creationTime"];
      by_release: ["releaseId", "_creationTime"];
      by_store: ["storeId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  replyMatchingLog: {
    document: {
      attemptedAt: number;
      confidence?: string;
      debug?: string;
      matched: boolean;
      matchedStoreId?: Id<"stores">;
      matchingStrategy: string;
      replyId: Id<"emailReplies">;
      _id: Id<"replyMatchingLog">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "attemptedAt"
      | "confidence"
      | "debug"
      | "matched"
      | "matchedStoreId"
      | "matchingStrategy"
      | "replyId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_replyId: ["replyId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  reports: {
    document: {
      contentId: string;
      contentPreview?: string;
      contentTitle: string;
      contentType?: string;
      copyrightClaim?: {
        accuracyStatement: boolean;
        claimantAddress?: string;
        claimantEmail: string;
        claimantName: string;
        claimantPhone?: string;
        digitalSignature: string;
        goodFaithStatement: boolean;
        infringementDescription: string;
        originalWorkDescription: string;
        originalWorkUrl?: string;
        signatureDate: number;
      };
      counterNotice?: {
        consentToJurisdiction: boolean;
        digitalSignature: string;
        explanation: string;
        respondentAddress: string;
        respondentEmail: string;
        respondentName: string;
        signatureDate: number;
        statementOfGoodFaith: boolean;
      };
      reason: string;
      reportedAt: number;
      reportedBy: string;
      reportedUserName?: string;
      reporterName: string;
      resolution?: string;
      restoredAt?: number;
      reviewedAt?: number;
      reviewedBy?: string;
      status:
        | "pending"
        | "reviewed"
        | "resolved"
        | "dismissed"
        | "counter_notice";
      storeId?: string;
      takenDownAt?: number;
      type: "course" | "comment" | "user" | "product" | "sample" | "copyright";
      _id: Id<"reports">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "contentId"
      | "contentPreview"
      | "contentTitle"
      | "contentType"
      | "copyrightClaim"
      | "copyrightClaim.accuracyStatement"
      | "copyrightClaim.claimantAddress"
      | "copyrightClaim.claimantEmail"
      | "copyrightClaim.claimantName"
      | "copyrightClaim.claimantPhone"
      | "copyrightClaim.digitalSignature"
      | "copyrightClaim.goodFaithStatement"
      | "copyrightClaim.infringementDescription"
      | "copyrightClaim.originalWorkDescription"
      | "copyrightClaim.originalWorkUrl"
      | "copyrightClaim.signatureDate"
      | "counterNotice"
      | "counterNotice.consentToJurisdiction"
      | "counterNotice.digitalSignature"
      | "counterNotice.explanation"
      | "counterNotice.respondentAddress"
      | "counterNotice.respondentEmail"
      | "counterNotice.respondentName"
      | "counterNotice.signatureDate"
      | "counterNotice.statementOfGoodFaith"
      | "reason"
      | "reportedAt"
      | "reportedBy"
      | "reportedUserName"
      | "reporterName"
      | "resolution"
      | "restoredAt"
      | "reviewedAt"
      | "reviewedBy"
      | "status"
      | "storeId"
      | "takenDownAt"
      | "type";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_content_id: ["contentId", "_creationTime"];
      by_reported_by: ["reportedBy", "_creationTime"];
      by_status: ["status", "_creationTime"];
      by_store_id: ["storeId", "_creationTime"];
      by_type: ["type", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  resendAudienceLists: {
    document: {
      connectionId: Id<"resendConnections">;
      createdAt: number;
      description: string;
      name: string;
      subscriberCount: number;
      updatedAt: number;
      userIds: Array<string>;
      _id: Id<"resendAudienceLists">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "connectionId"
      | "createdAt"
      | "description"
      | "name"
      | "subscriberCount"
      | "updatedAt"
      | "userIds";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_connection: ["connectionId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  resendAutomations: {
    document: {
      connectionId?: Id<"resendConnections">;
      createdAt: number;
      delayMinutes: number;
      description: string;
      inactivityDays?: number;
      isActive: boolean;
      lastTriggeredAt?: number;
      name: string;
      progressThreshold?: number;
      sentCount: number;
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
      triggeredCount: number;
      updatedAt: number;
      _id: Id<"resendAutomations">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "connectionId"
      | "createdAt"
      | "delayMinutes"
      | "description"
      | "inactivityDays"
      | "isActive"
      | "lastTriggeredAt"
      | "name"
      | "progressThreshold"
      | "sentCount"
      | "templateId"
      | "triggerCourseId"
      | "triggeredCount"
      | "triggerStoreId"
      | "triggerType"
      | "updatedAt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_active: ["isActive", "_creationTime"];
      by_connection: ["connectionId", "_creationTime"];
      by_trigger: ["triggerType", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  resendCampaigns: {
    document: {
      bouncedCount: number;
      clickedCount: number;
      complainedCount: number;
      connectionId?: Id<"resendConnections">;
      createdAt: number;
      customRecipients?: Array<string>;
      deliveredCount: number;
      errorMessage?: string;
      htmlContent?: string;
      inactiveDays?: number;
      name: string;
      openedCount: number;
      recipientCount: number;
      scheduledFor?: number;
      sentAt?: number;
      sentCount: number;
      status: "draft" | "scheduled" | "sending" | "sent" | "failed";
      subject: string;
      targetAudience:
        | "all_users"
        | "course_students"
        | "store_students"
        | "inactive_users"
        | "completed_course"
        | "custom_list"
        | "creators";
      targetCourseId?: Id<"courses">;
      targetStoreId?: Id<"stores">;
      templateId?: Id<"resendTemplates">;
      textContent?: string;
      updatedAt: number;
      _id: Id<"resendCampaigns">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "bouncedCount"
      | "clickedCount"
      | "complainedCount"
      | "connectionId"
      | "createdAt"
      | "customRecipients"
      | "deliveredCount"
      | "errorMessage"
      | "htmlContent"
      | "inactiveDays"
      | "name"
      | "openedCount"
      | "recipientCount"
      | "scheduledFor"
      | "sentAt"
      | "sentCount"
      | "status"
      | "subject"
      | "targetAudience"
      | "targetCourseId"
      | "targetStoreId"
      | "templateId"
      | "textContent"
      | "updatedAt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_connection: ["connectionId", "_creationTime"];
      by_status: ["status", "_creationTime"];
      by_target: ["targetAudience", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  resendConnections: {
    document: {
      createdAt: number;
      dnsRecords?: {
        dkim: { record: string; valid: boolean };
        dmarc?: { record: string; valid: boolean };
        spf: { record: string; valid: boolean };
      };
      domain?: string;
      domainLastChecked?: number;
      domainVerificationStatus?:
        | "verified"
        | "pending"
        | "failed"
        | "not_verified";
      enableAutomations: boolean;
      enableCampaigns: boolean;
      fromEmail: string;
      fromName: string;
      isActive: boolean;
      isVerified: boolean;
      replyToEmail?: string;
      resendApiKey: string;
      status?: "connected" | "disconnected" | "error";
      storeId?: Id<"stores">;
      type: "admin" | "store";
      updatedAt: number;
      userId: string;
      _id: Id<"resendConnections">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "createdAt"
      | "dnsRecords"
      | "dnsRecords.dkim"
      | "dnsRecords.dkim.record"
      | "dnsRecords.dkim.valid"
      | "dnsRecords.dmarc"
      | "dnsRecords.dmarc.record"
      | "dnsRecords.dmarc.valid"
      | "dnsRecords.spf"
      | "dnsRecords.spf.record"
      | "dnsRecords.spf.valid"
      | "domain"
      | "domainLastChecked"
      | "domainVerificationStatus"
      | "enableAutomations"
      | "enableCampaigns"
      | "fromEmail"
      | "fromName"
      | "isActive"
      | "isVerified"
      | "replyToEmail"
      | "resendApiKey"
      | "status"
      | "storeId"
      | "type"
      | "updatedAt"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_store: ["storeId", "_creationTime"];
      by_type: ["type", "_creationTime"];
      by_user: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  resendImportedContacts: {
    document: {
      completedAt?: number;
      connectionId: Id<"resendConnections">;
      createdAt: number;
      duplicateCount: number;
      errorCount: number;
      errorMessage?: string;
      errors?: Array<{ email: string; error: string }>;
      existingUsersLinked?: number;
      fileName?: string;
      importedBy: string;
      newUsersCreated?: number;
      processedContacts: number;
      source: string;
      status:
        | "pending"
        | "processing"
        | "completed"
        | "completed_with_errors"
        | "failed"
        | "cancelled";
      successCount: number;
      tags?: Array<string>;
      totalContacts: number;
      updatedAt: number;
      _id: Id<"resendImportedContacts">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "completedAt"
      | "connectionId"
      | "createdAt"
      | "duplicateCount"
      | "errorCount"
      | "errorMessage"
      | "errors"
      | "existingUsersLinked"
      | "fileName"
      | "importedBy"
      | "newUsersCreated"
      | "processedContacts"
      | "source"
      | "status"
      | "successCount"
      | "tags"
      | "totalContacts"
      | "updatedAt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_connection: ["connectionId", "_creationTime"];
      by_status: ["status", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  resendLogs: {
    document: {
      automationId?: Id<"resendAutomations">;
      bouncedAt?: number;
      campaignId?: Id<"resendCampaigns">;
      clickedAt?: number;
      connectionId: Id<"resendConnections">;
      createdAt: number;
      deliveredAt?: number;
      errorMessage?: string;
      fromEmail: string;
      fromName: string;
      openedAt?: number;
      recipientEmail: string;
      recipientName?: string;
      recipientUserId?: string;
      resendEmailId?: string;
      sentAt?: number;
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
      updatedAt: number;
      _id: Id<"resendLogs">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "automationId"
      | "bouncedAt"
      | "campaignId"
      | "clickedAt"
      | "connectionId"
      | "createdAt"
      | "deliveredAt"
      | "errorMessage"
      | "fromEmail"
      | "fromName"
      | "openedAt"
      | "recipientEmail"
      | "recipientName"
      | "recipientUserId"
      | "resendEmailId"
      | "sentAt"
      | "status"
      | "subject"
      | "templateId"
      | "updatedAt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_campaign: ["campaignId", "_creationTime"];
      by_connection: ["connectionId", "_creationTime"];
      by_recipient: ["recipientEmail", "_creationTime"];
      by_resend_id: ["resendEmailId", "_creationTime"];
      by_status: ["status", "_creationTime"];
      by_user: ["recipientUserId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  resendPreferences: {
    document: {
      courseEmails: boolean;
      createdAt: number;
      isUnsubscribed: boolean;
      marketingEmails: boolean;
      platformEmails: boolean;
      unsubscribeReason?: string;
      unsubscribedAt?: number;
      updatedAt: number;
      userId: string;
      weeklyDigest: boolean;
      _id: Id<"resendPreferences">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "courseEmails"
      | "createdAt"
      | "isUnsubscribed"
      | "marketingEmails"
      | "platformEmails"
      | "unsubscribedAt"
      | "unsubscribeReason"
      | "updatedAt"
      | "userId"
      | "weeklyDigest";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_user: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  resendTemplates: {
    document: {
      connectionId?: Id<"resendConnections">;
      createdAt: number;
      htmlContent: string;
      isActive: boolean;
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
      updatedAt: number;
      variables: Array<string>;
      _id: Id<"resendTemplates">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "connectionId"
      | "createdAt"
      | "htmlContent"
      | "isActive"
      | "name"
      | "subject"
      | "textContent"
      | "type"
      | "updatedAt"
      | "variables";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_active: ["isActive", "_creationTime"];
      by_connection: ["connectionId", "_creationTime"];
      by_type: ["type", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  revenueAnalytics: {
    document: {
      avgOrderValue: number;
      courseRevenue: number;
      createdAt: number;
      creatorId: string;
      date: string;
      digitalProductRevenue: number;
      grossRevenue: number;
      netRevenue: number;
      newCustomers: number;
      paymentProcessingFee: number;
      platformFee: number;
      refundedTransactions: number;
      returningCustomers: number;
      storeId: Id<"stores">;
      successfulTransactions: number;
      totalTransactions: number;
      updatedAt: number;
      _id: Id<"revenueAnalytics">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "avgOrderValue"
      | "courseRevenue"
      | "createdAt"
      | "creatorId"
      | "date"
      | "digitalProductRevenue"
      | "grossRevenue"
      | "netRevenue"
      | "newCustomers"
      | "paymentProcessingFee"
      | "platformFee"
      | "refundedTransactions"
      | "returningCustomers"
      | "storeId"
      | "successfulTransactions"
      | "totalTransactions"
      | "updatedAt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_creator: ["creatorId", "date", "_creationTime"];
      by_date: ["date", "_creationTime"];
      by_store: ["storeId", "date", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  revenueEvents: {
    document: {
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
      timestamp: number;
      userId: string;
      _id: Id<"revenueEvents">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "country"
      | "creatorId"
      | "currency"
      | "grossAmount"
      | "netAmount"
      | "paymentMethod"
      | "platformFee"
      | "processingFee"
      | "purchaseId"
      | "resourceId"
      | "resourceType"
      | "storeId"
      | "timestamp"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_creatorId: ["creatorId", "_creationTime"];
      by_creator_timestamp: ["creatorId", "timestamp", "_creationTime"];
      by_purchaseId: ["purchaseId", "_creationTime"];
      by_resourceId: ["resourceId", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
      by_store_timestamp: ["storeId", "timestamp", "_creationTime"];
      by_timestamp: ["timestamp", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  sampleDownloads: {
    document: {
      creatorId: string;
      creditAmount: number;
      downloadCount: number;
      lastDownloadAt?: number;
      licenseKey?: string;
      licenseType: string;
      packId?: Id<"samplePacks">;
      sampleId?: Id<"audioSamples">;
      transactionId: Id<"creditTransactions">;
      userId: string;
      _id: Id<"sampleDownloads">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "creatorId"
      | "creditAmount"
      | "downloadCount"
      | "lastDownloadAt"
      | "licenseKey"
      | "licenseType"
      | "packId"
      | "sampleId"
      | "transactionId"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_creatorId: ["creatorId", "_creationTime"];
      by_packId: ["packId", "_creationTime"];
      by_sampleId: ["sampleId", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
      by_user_pack: ["userId", "packId", "_creationTime"];
      by_user_sample: ["userId", "sampleId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  sampleFavorites: {
    document: {
      packId?: Id<"samplePacks">;
      sampleId?: Id<"audioSamples">;
      userId: string;
      _id: Id<"sampleFavorites">;
      _creationTime: number;
    };
    fieldPaths: "_creationTime" | "_id" | "packId" | "sampleId" | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_packId: ["packId", "_creationTime"];
      by_sampleId: ["sampleId", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
      by_user_pack: ["userId", "packId", "_creationTime"];
      by_user_sample: ["userId", "sampleId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  samplePacks: {
    document: {
      bpmRange?: { max: number; min: number };
      categories: Array<string>;
      coverImageStorageId?: Id<"_storage">;
      coverImageUrl?: string;
      creditPrice: number;
      description: string;
      downloads: number;
      favorites: number;
      genres: Array<string>;
      isPublished: boolean;
      licenseTerms?: string;
      licenseType: "royalty-free" | "exclusive" | "commercial";
      name: string;
      revenue: number;
      sampleIds: Array<Id<"audioSamples">>;
      storeId: string;
      tags: Array<string>;
      totalDuration: number;
      totalSamples: number;
      totalSize: number;
      userId: string;
      _id: Id<"samplePacks">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "bpmRange"
      | "bpmRange.max"
      | "bpmRange.min"
      | "categories"
      | "coverImageStorageId"
      | "coverImageUrl"
      | "creditPrice"
      | "description"
      | "downloads"
      | "favorites"
      | "genres"
      | "isPublished"
      | "licenseTerms"
      | "licenseType"
      | "name"
      | "revenue"
      | "sampleIds"
      | "storeId"
      | "tags"
      | "totalDuration"
      | "totalSamples"
      | "totalSize"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_published: ["isPublished", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
      by_user_published: ["userId", "isPublished", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  scheduledPosts: {
    document: {
      content: string;
      errorMessage?: string;
      hashtags?: Array<string>;
      initialMetrics?: {
        clicks?: number;
        comments?: number;
        likes?: number;
        shares?: number;
        views?: number;
      };
      lastRetryAt?: number;
      location?: string;
      mediaStorageIds?: Array<Id<"_storage">>;
      mediaUrls?: Array<string>;
      platformOptions?: {
        facebookTargeting?: string;
        instagramCaption?: string;
        instagramLocation?: string;
        linkedinVisibility?: string;
        twitterReplySettings?: string;
      };
      platformPostId?: string;
      platformPostUrl?: string;
      postType: "post" | "story" | "reel" | "tweet" | "thread";
      publishedAt?: number;
      retryCount: number;
      scheduledFor: number;
      socialAccountId: Id<"socialAccounts">;
      status:
        | "draft"
        | "scheduled"
        | "publishing"
        | "published"
        | "failed"
        | "cancelled";
      storeId: string;
      timezone: string;
      userId: string;
      _id: Id<"scheduledPosts">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "content"
      | "errorMessage"
      | "hashtags"
      | "initialMetrics"
      | "initialMetrics.clicks"
      | "initialMetrics.comments"
      | "initialMetrics.likes"
      | "initialMetrics.shares"
      | "initialMetrics.views"
      | "lastRetryAt"
      | "location"
      | "mediaStorageIds"
      | "mediaUrls"
      | "platformOptions"
      | "platformOptions.facebookTargeting"
      | "platformOptions.instagramCaption"
      | "platformOptions.instagramLocation"
      | "platformOptions.linkedinVisibility"
      | "platformOptions.twitterReplySettings"
      | "platformPostId"
      | "platformPostUrl"
      | "postType"
      | "publishedAt"
      | "retryCount"
      | "scheduledFor"
      | "socialAccountId"
      | "status"
      | "storeId"
      | "timezone"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_scheduledFor: ["scheduledFor", "_creationTime"];
      by_socialAccountId: ["socialAccountId", "_creationTime"];
      by_status: ["status", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
      by_store_scheduled: ["storeId", "scheduledFor", "_creationTime"];
      by_store_status: ["storeId", "status", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  scriptCalendarEntries: {
    document: {
      accountProfileId: Id<"socialAccountProfiles">;
      createdAt: number;
      dayOfWeek?: number;
      generatedScriptId: Id<"generatedScripts">;
      scheduledDate: number;
      scheduledTime?: number;
      sequenceOrder: number;
      status: "planned" | "in_progress" | "ready" | "published" | "skipped";
      storeId: string;
      timezone: string;
      updatedAt: number;
      userId: string;
      userNotes?: string;
      _id: Id<"scriptCalendarEntries">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "accountProfileId"
      | "createdAt"
      | "dayOfWeek"
      | "generatedScriptId"
      | "scheduledDate"
      | "scheduledTime"
      | "sequenceOrder"
      | "status"
      | "storeId"
      | "timezone"
      | "updatedAt"
      | "userId"
      | "userNotes";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_accountProfileId: ["accountProfileId", "_creationTime"];
      by_account_date: ["accountProfileId", "scheduledDate", "_creationTime"];
      by_generatedScriptId: ["generatedScriptId", "_creationTime"];
      by_scheduledDate: ["scheduledDate", "_creationTime"];
      by_status: ["status", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  scriptGenerationJobs: {
    document: {
      averageViralityScore?: number;
      completedAt?: number;
      courseId?: Id<"courses">;
      createdAt: number;
      currentBatchId?: string;
      errorCount?: number;
      estimatedCompletionAt?: number;
      failedChapters?: number;
      jobType: "full_scan" | "course_scan" | "incremental";
      lastError?: string;
      processedChapters?: number;
      scriptsGenerated?: number;
      startedAt?: number;
      status: "queued" | "processing" | "completed" | "failed" | "cancelled";
      storeId: string;
      totalChapters?: number;
      updatedAt: number;
      userId: string;
      _id: Id<"scriptGenerationJobs">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "averageViralityScore"
      | "completedAt"
      | "courseId"
      | "createdAt"
      | "currentBatchId"
      | "errorCount"
      | "estimatedCompletionAt"
      | "failedChapters"
      | "jobType"
      | "lastError"
      | "processedChapters"
      | "scriptsGenerated"
      | "startedAt"
      | "status"
      | "storeId"
      | "totalChapters"
      | "updatedAt"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_status: ["status", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
      by_user_status: ["userId", "status", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  scriptIllustrationJobs: {
    document: {
      completedAt?: number;
      createdAt: number;
      errors?: Array<string>;
      failedSentences: number;
      illustrationIds: Array<Id<"scriptIllustrations">>;
      processedSentences: number;
      scriptText: string;
      scriptTitle?: string;
      sourceId?: string;
      sourceType: "course" | "lesson" | "script" | "custom";
      startedAt?: number;
      status: "pending" | "processing" | "completed" | "failed";
      storeId?: string;
      totalSentences: number;
      userId: string;
      _id: Id<"scriptIllustrationJobs">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "completedAt"
      | "createdAt"
      | "errors"
      | "failedSentences"
      | "illustrationIds"
      | "processedSentences"
      | "scriptText"
      | "scriptTitle"
      | "sourceId"
      | "sourceType"
      | "startedAt"
      | "status"
      | "storeId"
      | "totalSentences"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_sourceId: ["sourceId", "_creationTime"];
      by_status: ["status", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
      by_userId_and_createdAt: ["userId", "createdAt", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  scriptIllustrations: {
    document: {
      createdAt: number;
      embedding?: Array<number>;
      embeddingModel?: string;
      generatedAt?: number;
      generationError?: string;
      generationModel: string;
      generationParams?: { guidance?: number; seed?: number; steps?: number };
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
      _id: Id<"scriptIllustrations">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "createdAt"
      | "embedding"
      | "embeddingModel"
      | "generatedAt"
      | "generationError"
      | "generationModel"
      | "generationParams"
      | "generationParams.guidance"
      | "generationParams.seed"
      | "generationParams.steps"
      | "generationStatus"
      | "illustrationPrompt"
      | "imageStorageId"
      | "imageUrl"
      | "scriptId"
      | "sentence"
      | "sentenceIndex"
      | "sourceType"
      | "storeId"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_scriptId: ["scriptId", "_creationTime"];
      by_scriptId_and_sentenceIndex: [
        "scriptId",
        "sentenceIndex",
        "_creationTime",
      ];
      by_sentenceIndex: ["sentenceIndex", "_creationTime"];
      by_sourceType: ["sourceType", "_creationTime"];
      by_status: ["generationStatus", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
      by_user_and_script: ["userId", "scriptId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  serviceOrderMessages: {
    document: {
      attachments?: Array<{
        id: string;
        name: string;
        size: number;
        storageId: string;
        type: string;
        url?: string;
      }>;
      content: string;
      createdAt: number;
      isSystemMessage?: boolean;
      orderId: Id<"serviceOrders">;
      readAt?: number;
      senderId: string;
      senderType: "customer" | "creator";
      _id: Id<"serviceOrderMessages">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "attachments"
      | "content"
      | "createdAt"
      | "isSystemMessage"
      | "orderId"
      | "readAt"
      | "senderId"
      | "senderType";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_createdAt: ["createdAt", "_creationTime"];
      by_orderId: ["orderId", "_creationTime"];
      by_senderId: ["senderId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  serviceOrders: {
    document: {
      basePrice: number;
      completedAt?: number;
      creatorId: string;
      customerFiles?: Array<{
        id: string;
        name: string;
        size: number;
        storageId: string;
        type: string;
        uploadedAt: number;
        url?: string;
      }>;
      customerId: string;
      customerNotes?: string;
      deliveredFiles?: Array<{
        id: string;
        name: string;
        notes?: string;
        size: number;
        storageId: string;
        type: string;
        uploadedAt: number;
        url?: string;
        version: number;
      }>;
      dueDate?: number;
      filesUploadedAt?: number;
      firstDeliveryAt?: number;
      isRush?: boolean;
      lastMessageAt?: number;
      orderNumber: string;
      paidAt?: number;
      productId: Id<"digitalProducts">;
      purchaseId?: Id<"purchases">;
      referenceTrackUrl?: string;
      revisionsAllowed: number;
      revisionsUsed: number;
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
      storeId: string;
      totalPrice: number;
      unreadByCreator?: number;
      unreadByCustomer?: number;
      workStartedAt?: number;
      _id: Id<"serviceOrders">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "basePrice"
      | "completedAt"
      | "creatorId"
      | "customerFiles"
      | "customerId"
      | "customerNotes"
      | "deliveredFiles"
      | "dueDate"
      | "filesUploadedAt"
      | "firstDeliveryAt"
      | "isRush"
      | "lastMessageAt"
      | "orderNumber"
      | "paidAt"
      | "productId"
      | "purchaseId"
      | "referenceTrackUrl"
      | "revisionsAllowed"
      | "revisionsUsed"
      | "rushFee"
      | "selectedTier"
      | "selectedTier.id"
      | "selectedTier.name"
      | "selectedTier.price"
      | "selectedTier.revisions"
      | "selectedTier.stemCount"
      | "selectedTier.turnaroundDays"
      | "serviceType"
      | "status"
      | "storeId"
      | "totalPrice"
      | "unreadByCreator"
      | "unreadByCustomer"
      | "workStartedAt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_creatorId: ["creatorId", "_creationTime"];
      by_creator_status: ["creatorId", "status", "_creationTime"];
      by_customerId: ["customerId", "_creationTime"];
      by_customer_status: ["customerId", "status", "_creationTime"];
      by_orderNumber: ["orderNumber", "_creationTime"];
      by_productId: ["productId", "_creationTime"];
      by_status: ["status", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  showcaseProfiles: {
    document: {
      avatarUrl?: string;
      bio?: string;
      coverUrl?: string;
      customSlug?: string;
      displayName: string;
      instagram?: string;
      isPublic: boolean;
      soundcloud?: string;
      spotify?: string;
      totalFollowers: number;
      totalPlays: number;
      twitter?: string;
      userId: string;
      youtube?: string;
      _id: Id<"showcaseProfiles">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "avatarUrl"
      | "bio"
      | "coverUrl"
      | "customSlug"
      | "displayName"
      | "instagram"
      | "isPublic"
      | "soundcloud"
      | "spotify"
      | "totalFollowers"
      | "totalPlays"
      | "twitter"
      | "userId"
      | "youtube";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_customSlug: ["customSlug", "_creationTime"];
      by_isPublic: ["isPublic", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  socialAccountProfiles: {
    document: {
      createdAt: number;
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
      totalPublishedScripts?: number;
      totalScheduledScripts?: number;
      updatedAt: number;
      userId: string;
      _id: Id<"socialAccountProfiles">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "createdAt"
      | "description"
      | "name"
      | "platform"
      | "postsPerWeek"
      | "preferredPostDays"
      | "socialAccountId"
      | "storeId"
      | "targetAudience"
      | "topics"
      | "totalPublishedScripts"
      | "totalScheduledScripts"
      | "updatedAt"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_platform: ["platform", "_creationTime"];
      by_socialAccountId: ["socialAccountId", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  socialAccounts: {
    document: {
      accessToken: string;
      accountLabel?: string;
      connectionError?: string;
      grantedScopes: Array<string>;
      isActive: boolean;
      isConnected: boolean;
      lastVerified?: number;
      platform: "instagram" | "twitter" | "facebook" | "tiktok" | "linkedin";
      platformData?: {
        dailyPostLimit?: number;
        facebookPageAccessToken?: string;
        facebookPageId?: string;
        instagramBusinessAccountId?: string;
        postsToday?: number;
      };
      platformDisplayName?: string;
      platformUserId: string;
      platformUsername?: string;
      profileImageUrl?: string;
      refreshToken?: string;
      storeId: string;
      tokenExpiresAt?: number;
      userId: string;
      _id: Id<"socialAccounts">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "accessToken"
      | "accountLabel"
      | "connectionError"
      | "grantedScopes"
      | "isActive"
      | "isConnected"
      | "lastVerified"
      | "platform"
      | "platformData"
      | "platformData.dailyPostLimit"
      | "platformData.facebookPageAccessToken"
      | "platformData.facebookPageId"
      | "platformData.instagramBusinessAccountId"
      | "platformData.postsToday"
      | "platformDisplayName"
      | "platformUserId"
      | "platformUsername"
      | "profileImageUrl"
      | "refreshToken"
      | "storeId"
      | "tokenExpiresAt"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_isActive: ["isActive", "_creationTime"];
      by_platform: ["platform", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
      by_store_platform: ["storeId", "platform", "_creationTime"];
      by_store_platform_user: [
        "storeId",
        "platform",
        "platformUserId",
        "_creationTime",
      ];
      by_userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  socialMediaPosts: {
    document: {
      audioDuration?: number;
      audioScript?: string;
      audioStorageId?: Id<"_storage">;
      audioUrl?: string;
      audioVoiceId?: string;
      automationId?: Id<"automations">;
      chapterId?: Id<"courseChapters">;
      combinedScript?: string;
      courseId?: Id<"courses">;
      createdAt: number;
      ctaCourseId?: Id<"courses">;
      ctaKeyword?: string;
      ctaProductId?: Id<"digitalProducts">;
      ctaTemplateId?: Id<"ctaTemplates">;
      ctaText?: string;
      generatedScriptId?: Id<"generatedScripts">;
      images?: Array<{
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
      instagramCaption?: string;
      instagramScript?: string;
      publishedAt?: number;
      scheduledPostId?: Id<"scheduledPosts">;
      selectedHeadings?: Array<string>;
      sourceContent: string;
      sourceType: "chapter" | "section" | "custom";
      status:
        | "draft"
        | "scripts_generated"
        | "combined"
        | "images_generated"
        | "audio_generated"
        | "completed"
        | "published";
      storeId?: string;
      tags?: Array<string>;
      tiktokCaption?: string;
      tiktokScript?: string;
      title?: string;
      updatedAt: number;
      userId: string;
      youtubeScript?: string;
      _id: Id<"socialMediaPosts">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "audioDuration"
      | "audioScript"
      | "audioStorageId"
      | "audioUrl"
      | "audioVoiceId"
      | "automationId"
      | "chapterId"
      | "combinedScript"
      | "courseId"
      | "createdAt"
      | "ctaCourseId"
      | "ctaKeyword"
      | "ctaProductId"
      | "ctaTemplateId"
      | "ctaText"
      | "generatedScriptId"
      | "images"
      | "instagramCaption"
      | "instagramScript"
      | "publishedAt"
      | "scheduledPostId"
      | "selectedHeadings"
      | "sourceContent"
      | "sourceType"
      | "status"
      | "storeId"
      | "tags"
      | "tiktokCaption"
      | "tiktokScript"
      | "title"
      | "updatedAt"
      | "userId"
      | "youtubeScript";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_chapterId: ["chapterId", "_creationTime"];
      by_courseId: ["courseId", "_creationTime"];
      by_createdAt: ["createdAt", "_creationTime"];
      by_generatedScriptId: ["generatedScriptId", "_creationTime"];
      by_status: ["status", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
      by_userId_createdAt: ["userId", "createdAt", "_creationTime"];
      by_userId_status: ["userId", "status", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  socialWebhooks: {
    document: {
      errorMessage?: string;
      eventType: string;
      payload: any;
      platform: "instagram" | "twitter" | "facebook" | "tiktok" | "linkedin";
      processedAt?: number;
      scheduledPostId?: Id<"scheduledPosts">;
      signature?: string;
      socialAccountId?: Id<"socialAccounts">;
      status: "pending" | "processing" | "processed" | "failed";
      _id: Id<"socialWebhooks">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "errorMessage"
      | "eventType"
      | "payload"
      | "platform"
      | "processedAt"
      | "scheduledPostId"
      | "signature"
      | "socialAccountId"
      | "status";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_eventType: ["eventType", "_creationTime"];
      by_platform: ["platform", "_creationTime"];
      by_status: ["status", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  spamScoreChecks: {
    document: {
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
      _id: Id<"spamScoreChecks">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "campaignId"
      | "checkedAt"
      | "checks"
      | "checks.hasBrokenLinks"
      | "checks.hasExcessiveCaps"
      | "checks.hasExcessivePunctuation"
      | "checks.hasSpamWords"
      | "checks.hasUnsubscribeLink"
      | "checks.imageToTextRatio"
      | "checks.linkCount"
      | "htmlContent"
      | "issues"
      | "riskLevel"
      | "spamScore"
      | "subject"
      | "templateId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_campaignId: ["campaignId", "_creationTime"];
      by_template: ["templateId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  stores: {
    document: {
      avatar?: string;
      bannerImage?: string;
      bio?: string;
      copyrightStrikes?: number;
      customDomain?: string;
      description?: string;
      domainStatus?: string;
      earlyAccessExpiresAt?: number;
      emailConfig?: {
        adminNotifications?: {
          customSubjectPrefix?: string;
          digestFrequency?: "hourly" | "daily" | "weekly";
          emailOnNewLead?: boolean;
          emailOnReturningUser?: boolean;
          enabled?: boolean;
          includeLeadDetails?: boolean;
          notificationEmail?: string;
          sendDigestInsteadOfInstant?: boolean;
        };
        emailsSentThisMonth?: number;
        fromEmail: string;
        fromName?: string;
        isConfigured?: boolean;
        lastTestedAt?: number;
        replyToEmail?: string;
      };
      isPublic?: boolean;
      isPublishedProfile?: boolean;
      lastStrikeAt?: number;
      logoUrl?: string;
      name: string;
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
      socialLinksV2?: Array<{ label?: string; platform: string; url: string }>;
      strikeHistory?: Array<{
        issuedAt: number;
        issuedBy: string;
        reason: string;
        reportId: string;
        strikeNumber: number;
      }>;
      stripeCustomerId?: string;
      stripeSubscriptionId?: string;
      subscriptionStatus?:
        | "active"
        | "trialing"
        | "past_due"
        | "canceled"
        | "incomplete";
      suspendedAt?: number;
      suspensionEndsAt?: number;
      suspensionReason?: string;
      trialEndsAt?: number;
      userId: string;
      _id: Id<"stores">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "avatar"
      | "bannerImage"
      | "bio"
      | "copyrightStrikes"
      | "customDomain"
      | "description"
      | "domainStatus"
      | "earlyAccessExpiresAt"
      | "emailConfig"
      | "emailConfig.adminNotifications"
      | "emailConfig.adminNotifications.customSubjectPrefix"
      | "emailConfig.adminNotifications.digestFrequency"
      | "emailConfig.adminNotifications.emailOnNewLead"
      | "emailConfig.adminNotifications.emailOnReturningUser"
      | "emailConfig.adminNotifications.enabled"
      | "emailConfig.adminNotifications.includeLeadDetails"
      | "emailConfig.adminNotifications.notificationEmail"
      | "emailConfig.adminNotifications.sendDigestInsteadOfInstant"
      | "emailConfig.emailsSentThisMonth"
      | "emailConfig.fromEmail"
      | "emailConfig.fromName"
      | "emailConfig.isConfigured"
      | "emailConfig.lastTestedAt"
      | "emailConfig.replyToEmail"
      | "isPublic"
      | "isPublishedProfile"
      | "lastStrikeAt"
      | "logoUrl"
      | "name"
      | "plan"
      | "planStartedAt"
      | "slug"
      | "socialLinks"
      | "socialLinks.appleMusic"
      | "socialLinks.bandcamp"
      | "socialLinks.beatport"
      | "socialLinks.discord"
      | "socialLinks.instagram"
      | "socialLinks.linkedin"
      | "socialLinks.soundcloud"
      | "socialLinks.spotify"
      | "socialLinks.threads"
      | "socialLinks.tiktok"
      | "socialLinks.twitch"
      | "socialLinks.twitter"
      | "socialLinks.website"
      | "socialLinks.youtube"
      | "socialLinksV2"
      | "strikeHistory"
      | "stripeCustomerId"
      | "stripeSubscriptionId"
      | "subscriptionStatus"
      | "suspendedAt"
      | "suspensionEndsAt"
      | "suspensionReason"
      | "trialEndsAt"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_plan: ["plan", "_creationTime"];
      by_public: ["isPublic", "_creationTime"];
      by_slug: ["slug", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  studentProgress: {
    document: {
      avgSessionDuration: number;
      chaptersPerWeek: number;
      completedChapters: number;
      completionPercentage: number;
      courseId: Id<"courses">;
      daysSinceEnrollment: number;
      engagementScore: number;
      enrolledAt: number;
      estimatedCompletionDate?: number;
      isAtRisk: boolean;
      lastAccessedAt: number;
      needsHelp: boolean;
      performancePercentile?: number;
      totalChapters: number;
      totalTimeSpent: number;
      updatedAt: number;
      userId: string;
      _id: Id<"studentProgress">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "avgSessionDuration"
      | "chaptersPerWeek"
      | "completedChapters"
      | "completionPercentage"
      | "courseId"
      | "daysSinceEnrollment"
      | "engagementScore"
      | "enrolledAt"
      | "estimatedCompletionDate"
      | "isAtRisk"
      | "lastAccessedAt"
      | "needsHelp"
      | "performancePercentile"
      | "totalChapters"
      | "totalTimeSpent"
      | "updatedAt"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_course: ["courseId", "completionPercentage", "_creationTime"];
      by_engagement: ["engagementScore", "_creationTime"];
      by_risk: ["isAtRisk", "updatedAt", "_creationTime"];
      by_user: ["userId", "courseId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  subscriptionPlans: {
    document: {
      courseAccess: Array<Id<"courses">>;
      createdAt: number;
      currency: string;
      currentStudents: number;
      description: string;
      digitalProductAccess: Array<Id<"digitalProducts">>;
      discountPercentage?: number;
      features: Array<string>;
      hasAllCourses: boolean;
      hasAllProducts: boolean;
      isActive: boolean;
      maxStudents?: number;
      monthlyPrice: number;
      name: string;
      storeId: Id<"stores">;
      stripePriceIdMonthly?: string;
      stripePriceIdYearly?: string;
      tier: number;
      trialDays?: number;
      updatedAt: number;
      yearlyPrice: number;
      _id: Id<"subscriptionPlans">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "courseAccess"
      | "createdAt"
      | "currency"
      | "currentStudents"
      | "description"
      | "digitalProductAccess"
      | "discountPercentage"
      | "features"
      | "hasAllCourses"
      | "hasAllProducts"
      | "isActive"
      | "maxStudents"
      | "monthlyPrice"
      | "name"
      | "storeId"
      | "stripePriceIdMonthly"
      | "stripePriceIdYearly"
      | "tier"
      | "trialDays"
      | "updatedAt"
      | "yearlyPrice";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_store: ["storeId", "isActive", "_creationTime"];
      by_tier: ["tier", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  subscriptions: {
    document: {
      adminUserId: string;
      amount: number;
      billingInterval: "monthly" | "yearly";
      cancelledAt?: number;
      currency: string;
      customerId: Id<"customers">;
      nextBillingDate?: number;
      planName: string;
      status: "active" | "cancelled" | "paused";
      storeId: string;
      subscriptionId?: string;
      _id: Id<"subscriptions">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "adminUserId"
      | "amount"
      | "billingInterval"
      | "cancelledAt"
      | "currency"
      | "customerId"
      | "nextBillingDate"
      | "planName"
      | "status"
      | "storeId"
      | "subscriptionId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_adminUserId: ["adminUserId", "_creationTime"];
      by_customerId: ["customerId", "_creationTime"];
      by_status: ["status", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  suggestedFeatures: {
    document: {
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
      _id: Id<"suggestedFeatures">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "analysisRunId"
      | "category"
      | "cursorPrompt"
      | "description"
      | "existsPartially"
      | "implementationHint"
      | "linkedTaskUrl"
      | "name"
      | "notes"
      | "priority"
      | "reasoning"
      | "sourceChapters"
      | "sourceCourses"
      | "status"
      | "updatedAt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_analysisRunId: ["analysisRunId", "_creationTime"];
      by_category: ["category", "_creationTime"];
      by_priority: ["priority", "_creationTime"];
      by_status: ["status", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  syncMetadata: {
    document: {
      lastSyncTime: number;
      status: string;
      totalClerkUsers?: number;
      totalConvexUsers?: number;
      type: string;
      usersAdded?: number;
      usersUpdated?: number;
      _id: Id<"syncMetadata">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "lastSyncTime"
      | "status"
      | "totalClerkUsers"
      | "totalConvexUsers"
      | "type"
      | "usersAdded"
      | "usersUpdated";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_type: ["type", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  taxRates: {
    document: {
      country: string;
      effectiveFrom: number;
      effectiveUntil?: number;
      isActive: boolean;
      state?: string;
      stripeTaxCodeId?: string;
      taxName: string;
      taxRate: number;
      taxType: "vat" | "gst" | "sales_tax";
      _id: Id<"taxRates">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "country"
      | "effectiveFrom"
      | "effectiveUntil"
      | "isActive"
      | "state"
      | "stripeTaxCodeId"
      | "taxName"
      | "taxRate"
      | "taxType";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_country: ["country", "isActive", "_creationTime"];
      by_country_state: ["country", "state", "isActive", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  trackComments: {
    document: {
      artistProfileId: Id<"artistProfiles">;
      content: string;
      isApproved?: boolean;
      isReported?: boolean;
      parentCommentId?: Id<"trackComments">;
      timePosition?: number;
      timestamp: number;
      trackId: Id<"musicTracks">;
      userId: string;
      _id: Id<"trackComments">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "artistProfileId"
      | "content"
      | "isApproved"
      | "isReported"
      | "parentCommentId"
      | "timePosition"
      | "timestamp"
      | "trackId"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_artistProfileId: ["artistProfileId", "_creationTime"];
      by_parentCommentId: ["parentCommentId", "_creationTime"];
      by_timePosition: ["timePosition", "_creationTime"];
      by_timestamp: ["timestamp", "_creationTime"];
      by_trackId: ["trackId", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  trackLikes: {
    document: {
      artistProfileId: Id<"artistProfiles">;
      timestamp: number;
      trackId: Id<"musicTracks">;
      userId: string;
      _id: Id<"trackLikes">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "artistProfileId"
      | "timestamp"
      | "trackId"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_artistProfileId: ["artistProfileId", "_creationTime"];
      by_trackId: ["trackId", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
      by_user_track: ["userId", "trackId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  trackPlays: {
    document: {
      artistProfileId: Id<"artistProfiles">;
      city?: string;
      completionPercentage?: number;
      country?: string;
      device?: string;
      ipAddress?: string;
      playDuration?: number;
      referrer?: string;
      source?: "profile" | "embed" | "direct_link" | "search" | "playlist";
      timestamp: number;
      trackId: Id<"musicTracks">;
      userAgent?: string;
      userId?: string;
      _id: Id<"trackPlays">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "artistProfileId"
      | "city"
      | "completionPercentage"
      | "country"
      | "device"
      | "ipAddress"
      | "playDuration"
      | "referrer"
      | "source"
      | "timestamp"
      | "trackId"
      | "userAgent"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_artistProfileId: ["artistProfileId", "_creationTime"];
      by_timestamp: ["timestamp", "_creationTime"];
      by_trackId: ["trackId", "_creationTime"];
      by_track_timestamp: ["trackId", "timestamp", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  trackSubmissions: {
    document: {
      addedToPlaylistId?: Id<"curatorPlaylists">;
      creatorId: string;
      decidedAt?: number;
      decisionNotes?: string;
      feedback?: string;
      message?: string;
      paymentId?: string;
      paymentStatus?: "pending" | "paid" | "refunded";
      playlistId?: Id<"curatorPlaylists">;
      status: "inbox" | "reviewed" | "accepted" | "declined";
      submissionFee: number;
      submitterId: string;
      trackId: Id<"userTracks">;
      _id: Id<"trackSubmissions">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "addedToPlaylistId"
      | "creatorId"
      | "decidedAt"
      | "decisionNotes"
      | "feedback"
      | "message"
      | "paymentId"
      | "paymentStatus"
      | "playlistId"
      | "status"
      | "submissionFee"
      | "submitterId"
      | "trackId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_creatorId: ["creatorId", "_creationTime"];
      by_creatorId_and_status: ["creatorId", "status", "_creationTime"];
      by_status: ["status", "_creationTime"];
      by_submitterId: ["submitterId", "_creationTime"];
      by_trackId: ["trackId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  triggers: {
    document: {
      automationId: Id<"automations">;
      type: "COMMENT" | "DM";
      _id: Id<"triggers">;
      _creationTime: number;
    };
    fieldPaths: "_creationTime" | "_id" | "automationId" | "type";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_automationId: ["automationId", "_creationTime"];
      by_type: ["type", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  upsellInteractions: {
    document: {
      action: "shown" | "accepted" | "declined";
      orderId?: string;
      timestamp: number;
      upsellId: Id<"upsells">;
      userId: string;
      _id: Id<"upsellInteractions">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "action"
      | "orderId"
      | "timestamp"
      | "upsellId"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_upsell: ["upsellId", "action", "_creationTime"];
      by_user: ["userId", "timestamp", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  upsells: {
    document: {
      conversionRate: number;
      createdAt: number;
      description: string;
      discountType?: "percentage" | "fixed";
      discountValue?: number;
      isActive: boolean;
      name: string;
      offerType: "upgrade" | "related" | "bundle" | "subscription";
      offeredItemId: string;
      offeredItemType: "course" | "product" | "bundle" | "subscription";
      revenueGenerated: number;
      storeId: Id<"stores">;
      timesAccepted: number;
      timesShown: number;
      triggerItemId?: string;
      triggerType:
        | "course_purchase"
        | "product_purchase"
        | "course_completion"
        | "cart_checkout";
      updatedAt: number;
      _id: Id<"upsells">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "conversionRate"
      | "createdAt"
      | "description"
      | "discountType"
      | "discountValue"
      | "isActive"
      | "name"
      | "offeredItemId"
      | "offeredItemType"
      | "offerType"
      | "revenueGenerated"
      | "storeId"
      | "timesAccepted"
      | "timesShown"
      | "triggerItemId"
      | "triggerType"
      | "updatedAt";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_store: ["storeId", "isActive", "_creationTime"];
      by_trigger: ["triggerType", "triggerItemId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  userAchievements: {
    document: {
      achievementId: string;
      progress?: { current: number; target: number };
      unlocked: boolean;
      unlockedAt?: number;
      userId: string;
      _id: Id<"userAchievements">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "achievementId"
      | "progress"
      | "progress.current"
      | "progress.target"
      | "unlocked"
      | "unlockedAt"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_userId: ["userId", "_creationTime"];
      by_userId_and_achievementId: ["userId", "achievementId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  userAutomationStates: {
    document: {
      automationFlowId: Id<"automationFlows">;
      completedAt?: number;
      currentNodeId?: string;
      errorMessage?: string;
      expectedResponse?: string;
      isPendingResponse?: boolean;
      lastActivityAt: number;
      lastUserResponse?: string;
      platform: "instagram" | "twitter" | "facebook" | "tiktok" | "linkedin";
      platformUserId: string;
      platformUsername?: string;
      retryCount: number;
      startedAt: number;
      status: "active" | "completed" | "paused" | "error" | "timeout";
      storeId: string;
      tags?: Array<string>;
      triggerContext: {
        originalCommentId?: string;
        originalPostId?: string;
        socialAccountId?: Id<"socialAccounts">;
        triggerMessage?: string;
        triggerType: string;
      };
      variables?: {};
      waitingNodeId?: string;
      _id: Id<"userAutomationStates">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "automationFlowId"
      | "completedAt"
      | "currentNodeId"
      | "errorMessage"
      | "expectedResponse"
      | "isPendingResponse"
      | "lastActivityAt"
      | "lastUserResponse"
      | "platform"
      | "platformUserId"
      | "platformUsername"
      | "retryCount"
      | "startedAt"
      | "status"
      | "storeId"
      | "tags"
      | "triggerContext"
      | "triggerContext.originalCommentId"
      | "triggerContext.originalPostId"
      | "triggerContext.socialAccountId"
      | "triggerContext.triggerMessage"
      | "triggerContext.triggerType"
      | "variables"
      | "waitingNodeId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_automationFlowId: ["automationFlowId", "_creationTime"];
      by_lastActivity: ["lastActivityAt", "_creationTime"];
      by_platformUser: ["platform", "platformUserId", "_creationTime"];
      by_status: ["status", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
      by_store_platform_user: [
        "storeId",
        "platform",
        "platformUserId",
        "_creationTime",
      ];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  userCreatorSubscriptions: {
    document: {
      cancelAtPeriodEnd: boolean;
      creatorId: string;
      currentPeriodEnd: number;
      currentPeriodStart: number;
      status: "active" | "canceled" | "past_due" | "paused";
      storeId: string;
      stripeSubscriptionId: string;
      tierId: Id<"creatorSubscriptionTiers">;
      userId: string;
      _id: Id<"userCreatorSubscriptions">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "cancelAtPeriodEnd"
      | "creatorId"
      | "currentPeriodEnd"
      | "currentPeriodStart"
      | "status"
      | "storeId"
      | "stripeSubscriptionId"
      | "tierId"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_creatorId: ["creatorId", "_creationTime"];
      by_creator_status: ["creatorId", "status", "_creationTime"];
      by_status: ["status", "_creationTime"];
      by_stripe_id: ["stripeSubscriptionId", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
      by_user_creator: ["userId", "creatorId", "_creationTime"];
      by_user_status: ["userId", "status", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  userCredits: {
    document: {
      balance: number;
      lastUpdated: number;
      lifetimeEarned: number;
      lifetimeSpent: number;
      userId: string;
      _id: Id<"userCredits">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "balance"
      | "lastUpdated"
      | "lifetimeEarned"
      | "lifetimeSpent"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  userEngagementPatterns: {
    document: {
      bestSendTime: { day: number; hour: number; score: number };
      createdAt: number;
      dayOfWeek: Array<number>;
      hourOfDay: Array<number>;
      lastEngagement: number;
      timezone?: string;
      totalEngagements: number;
      updatedAt: number;
      userId: string;
      _id: Id<"userEngagementPatterns">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "bestSendTime"
      | "bestSendTime.day"
      | "bestSendTime.hour"
      | "bestSendTime.score"
      | "createdAt"
      | "dayOfWeek"
      | "hourOfDay"
      | "lastEngagement"
      | "timezone"
      | "totalEngagements"
      | "updatedAt"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  userEvents: {
    document: {
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
      timestamp: number;
      userId: string;
      _id: Id<"userEvents">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "browserInfo"
      | "chapterId"
      | "courseId"
      | "deviceType"
      | "eventType"
      | "metadata"
      | "productId"
      | "sessionId"
      | "timestamp"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_course: ["courseId", "timestamp", "_creationTime"];
      by_event_type: ["eventType", "timestamp", "_creationTime"];
      by_session: ["sessionId", "timestamp", "_creationTime"];
      by_user: ["userId", "timestamp", "_creationTime"];
      by_user_and_event: ["userId", "eventType", "timestamp", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  userProgress: {
    document: {
      chapterId: string;
      completedAt?: number;
      courseId?: Id<"courses">;
      isCompleted?: boolean;
      lastAccessedAt?: number;
      lessonId?: string;
      moduleId?: string;
      progressPercentage?: number;
      timeSpent?: number;
      userId: string;
      _id: Id<"userProgress">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "chapterId"
      | "completedAt"
      | "courseId"
      | "isCompleted"
      | "lastAccessedAt"
      | "lessonId"
      | "moduleId"
      | "progressPercentage"
      | "timeSpent"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_chapterId: ["chapterId", "_creationTime"];
      by_courseId: ["courseId", "_creationTime"];
      by_course_completed: ["courseId", "isCompleted", "_creationTime"];
      by_lessonId: ["lessonId", "_creationTime"];
      by_moduleId: ["moduleId", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
      by_user_chapter: ["userId", "chapterId", "_creationTime"];
      by_user_completed: ["userId", "isCompleted", "_creationTime"];
      by_user_course: ["userId", "courseId", "_creationTime"];
      by_user_course_completed: [
        "userId",
        "courseId",
        "isCompleted",
        "_creationTime",
      ];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  users: {
    document: {
      admin?: boolean;
      agencyId?: string;
      avatarUrl?: string;
      bio?: string;
      clerkId?: string;
      dashboardPreference?: "learn" | "create";
      discordId?: string;
      discordUsername?: string;
      discordVerified?: boolean;
      email?: string;
      emailVerified?: number;
      firstName?: string;
      hashedPassword?: string;
      image?: string;
      imageUrl?: string;
      instagram?: string;
      lastName?: string;
      name?: string;
      role?:
        | "AGENCY_OWNER"
        | "AGENCY_ADMIN"
        | "SUBACCOUNT_USER"
        | "SUBACCOUNT_GUEST";
      stripeAccountStatus?: "pending" | "restricted" | "enabled";
      stripeConnectAccountId?: string;
      stripeOnboardingComplete?: boolean;
      tiktok?: string;
      twitter?: string;
      userRoleId?: string;
      userTypeId?: string;
      website?: string;
      youtube?: string;
      _id: Id<"users">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "admin"
      | "agencyId"
      | "avatarUrl"
      | "bio"
      | "clerkId"
      | "dashboardPreference"
      | "discordId"
      | "discordUsername"
      | "discordVerified"
      | "email"
      | "emailVerified"
      | "firstName"
      | "hashedPassword"
      | "image"
      | "imageUrl"
      | "instagram"
      | "lastName"
      | "name"
      | "role"
      | "stripeAccountStatus"
      | "stripeConnectAccountId"
      | "stripeOnboardingComplete"
      | "tiktok"
      | "twitter"
      | "userRoleId"
      | "userTypeId"
      | "website"
      | "youtube";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_clerkId: ["clerkId", "_creationTime"];
      by_discordId: ["discordId", "_creationTime"];
      by_email: ["email", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  userSessions: {
    document: {
      browser?: string;
      city?: string;
      country?: string;
      device?: string;
      duration?: number;
      endTime?: number;
      events: number;
      exitPage?: string;
      landingPage?: string;
      os?: string;
      pageViews: number;
      referrer?: string;
      sessionId: string;
      startTime: number;
      storeId?: string;
      userId: string;
      _id: Id<"userSessions">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "browser"
      | "city"
      | "country"
      | "device"
      | "duration"
      | "endTime"
      | "events"
      | "exitPage"
      | "landingPage"
      | "os"
      | "pageViews"
      | "referrer"
      | "sessionId"
      | "startTime"
      | "storeId"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_sessionId: ["sessionId", "_creationTime"];
      by_startTime: ["startTime", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
      by_user_start: ["userId", "startTime", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  userSubscriptions: {
    document: {
      cancelAtPeriodEnd?: boolean;
      currentPeriodEnd?: number;
      currentPeriodStart?: number;
      plan: "FREE" | "PRO";
      status?: "active" | "canceled" | "past_due" | "trialing";
      stripeCustomerId?: string;
      stripePriceId?: string;
      stripeSubscriptionId?: string;
      userId: Id<"users">;
      _id: Id<"userSubscriptions">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "cancelAtPeriodEnd"
      | "currentPeriodEnd"
      | "currentPeriodStart"
      | "plan"
      | "status"
      | "stripeCustomerId"
      | "stripePriceId"
      | "stripeSubscriptionId"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_plan: ["plan", "_creationTime"];
      by_stripeCustomerId: ["stripeCustomerId", "_creationTime"];
      by_stripeSubscriptionId: ["stripeSubscriptionId", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  userTracks: {
    document: {
      artist?: string;
      coverUrl?: string;
      description?: string;
      duration?: number;
      genre?: string;
      isPublic: boolean;
      likes: number;
      mood?: string;
      plays: number;
      releaseDate?: number;
      shares: number;
      sourceType: "upload" | "youtube" | "soundcloud" | "spotify";
      sourceUrl?: string;
      storageId?: Id<"_storage">;
      tags?: Array<string>;
      title: string;
      userId: string;
      _id: Id<"userTracks">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "artist"
      | "coverUrl"
      | "description"
      | "duration"
      | "genre"
      | "isPublic"
      | "likes"
      | "mood"
      | "plays"
      | "releaseDate"
      | "shares"
      | "sourceType"
      | "sourceUrl"
      | "storageId"
      | "tags"
      | "title"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_genre: ["genre", "_creationTime"];
      by_isPublic: ["isPublic", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  userXP: {
    document: {
      lastXPGain?: number;
      totalXP: number;
      userId: string;
      _id: Id<"userXP">;
      _creationTime: number;
    };
    fieldPaths: "_creationTime" | "_id" | "lastXPGain" | "totalXP" | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  videoAnalytics: {
    document: {
      chapterId: string;
      completedWatch: boolean;
      courseId: Id<"courses">;
      dropOffPoint?: number;
      percentWatched: number;
      playbackSpeed?: number;
      qualitySetting?: string;
      rewatches: number;
      sessionId?: string;
      timestamp: number;
      userId: string;
      videoDuration: number;
      watchDuration: number;
      _id: Id<"videoAnalytics">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "chapterId"
      | "completedWatch"
      | "courseId"
      | "dropOffPoint"
      | "percentWatched"
      | "playbackSpeed"
      | "qualitySetting"
      | "rewatches"
      | "sessionId"
      | "timestamp"
      | "userId"
      | "videoDuration"
      | "watchDuration";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_chapter: ["chapterId", "timestamp", "_creationTime"];
      by_completion: ["completedWatch", "timestamp", "_creationTime"];
      by_course: ["courseId", "timestamp", "_creationTime"];
      by_user: ["userId", "timestamp", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  webhookCallLogs: {
    document: {
      errorMessage?: string;
      executionId?: Id<"workflowExecutions">;
      ipAddress?: string;
      payload: any;
      status: "success" | "error" | "rate_limited";
      storeId: string;
      timestamp: number;
      userAgent?: string;
      webhookEndpointId: Id<"webhookEndpoints">;
      workflowTriggered?: boolean;
      _id: Id<"webhookCallLogs">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "errorMessage"
      | "executionId"
      | "ipAddress"
      | "payload"
      | "status"
      | "storeId"
      | "timestamp"
      | "userAgent"
      | "webhookEndpointId"
      | "workflowTriggered";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_storeId_timestamp: ["storeId", "timestamp", "_creationTime"];
      by_webhookEndpointId: ["webhookEndpointId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  webhookEndpoints: {
    document: {
      createdAt: number;
      description?: string;
      endpointKey: string;
      isActive: boolean;
      lastCalledAt?: number;
      name: string;
      rateLimitPerMinute?: number;
      secretKey: string;
      storeId: string;
      totalCalls: number;
      workflowId?: Id<"emailWorkflows">;
      _id: Id<"webhookEndpoints">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "createdAt"
      | "description"
      | "endpointKey"
      | "isActive"
      | "lastCalledAt"
      | "name"
      | "rateLimitPerMinute"
      | "secretKey"
      | "storeId"
      | "totalCalls"
      | "workflowId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_active: ["storeId", "isActive", "_creationTime"];
      by_endpointKey: ["endpointKey", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  webResearch: {
    document: {
      addedToEmbeddings: boolean;
      createdAt: number;
      embeddingIds?: Array<Id<"embeddings">>;
      query: string;
      resultCount: number;
      results: Array<{
        content: string;
        publishedDate?: string;
        score: number;
        title: string;
        url: string;
      }>;
      searchDuration?: number;
      sourceConversationId?: Id<"aiConversations">;
      sourceMessageId?: Id<"aiMessages">;
      userId: string;
      _id: Id<"webResearch">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "addedToEmbeddings"
      | "createdAt"
      | "embeddingIds"
      | "query"
      | "resultCount"
      | "results"
      | "searchDuration"
      | "sourceConversationId"
      | "sourceMessageId"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_addedToEmbeddings: ["addedToEmbeddings", "_creationTime"];
      by_query: ["query", "_creationTime"];
      by_sourceConversationId: ["sourceConversationId", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  wishlists: {
    document: {
      courseId?: Id<"courses">;
      itemType: "product" | "course";
      notifyOnPriceDrop?: boolean;
      priceAtAdd?: number;
      productId?: Id<"digitalProducts">;
      productType?: string;
      userId: string;
      _id: Id<"wishlists">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "courseId"
      | "itemType"
      | "notifyOnPriceDrop"
      | "priceAtAdd"
      | "productId"
      | "productType"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_courseId: ["courseId", "_creationTime"];
      by_itemType: ["itemType", "_creationTime"];
      by_productId: ["productId", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
      by_userId_and_courseId: ["userId", "courseId", "_creationTime"];
      by_userId_and_productId: ["userId", "productId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  workflowExecutions: {
    document: {
      completedAt?: number;
      contactId?: Id<"emailContacts">;
      currentNodeId?: string;
      customerEmail: string;
      customerId?: string;
      errorMessage?: string;
      executionData?: any;
      scheduledFor?: number;
      startedAt?: number;
      status: "pending" | "running" | "completed" | "failed" | "cancelled";
      storeId: string;
      workflowId: Id<"emailWorkflows">;
      _id: Id<"workflowExecutions">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "completedAt"
      | "contactId"
      | "currentNodeId"
      | "customerEmail"
      | "customerId"
      | "errorMessage"
      | "executionData"
      | "scheduledFor"
      | "startedAt"
      | "status"
      | "storeId"
      | "workflowId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_contactId: ["contactId", "_creationTime"];
      by_scheduledFor: ["scheduledFor", "_creationTime"];
      by_status: ["status", "_creationTime"];
      by_status_scheduledFor: ["status", "scheduledFor", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
      by_workflowId: ["workflowId", "_creationTime"];
      by_workflowId_status: ["workflowId", "status", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  workflowGoalCompletions: {
    document: {
      completedAt: number;
      contactId: Id<"emailContacts">;
      executionId: Id<"workflowExecutions">;
      goalNodeId: string;
      goalType: string;
      goalValue?: any;
      storeId: string;
      timeToComplete: number;
      workflowId: Id<"emailWorkflows">;
      _id: Id<"workflowGoalCompletions">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "completedAt"
      | "contactId"
      | "executionId"
      | "goalNodeId"
      | "goalType"
      | "goalValue"
      | "storeId"
      | "timeToComplete"
      | "workflowId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_contactId: ["contactId", "_creationTime"];
      by_goalType: ["workflowId", "goalType", "_creationTime"];
      by_storeId: ["storeId", "_creationTime"];
      by_workflowId: ["workflowId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  workflowNodeABTests: {
    document: {
      autoSelectWinner: boolean;
      completedAt?: number;
      confidence?: number;
      createdAt: number;
      isEnabled: boolean;
      nodeId: string;
      sampleSize: number;
      status: "active" | "completed";
      updatedAt: number;
      variants: Array<{
        body?: string;
        clicked: number;
        delivered: number;
        id: string;
        name: string;
        opened: number;
        percentage: number;
        sent: number;
        subject: string;
      }>;
      winner?: string;
      winnerMetric: "open_rate" | "click_rate";
      winnerThreshold?: number;
      workflowId: Id<"emailWorkflows">;
      _id: Id<"workflowNodeABTests">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "autoSelectWinner"
      | "completedAt"
      | "confidence"
      | "createdAt"
      | "isEnabled"
      | "nodeId"
      | "sampleSize"
      | "status"
      | "updatedAt"
      | "variants"
      | "winner"
      | "winnerMetric"
      | "winnerThreshold"
      | "workflowId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_workflowId: ["workflowId", "_creationTime"];
      by_workflowId_nodeId: ["workflowId", "nodeId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  workflowTemplates: {
    document: {
      category:
        | "welcome"
        | "nurture"
        | "sales"
        | "re_engagement"
        | "onboarding"
        | "custom";
      createdAt: number;
      creatorId?: string;
      description: string;
      edges: Array<any>;
      isPublic: boolean;
      name: string;
      nodes: Array<any>;
      thumbnail?: string;
      trigger: { config: any; type: string };
      usageCount: number;
      _id: Id<"workflowTemplates">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "category"
      | "createdAt"
      | "creatorId"
      | "description"
      | "edges"
      | "isPublic"
      | "name"
      | "nodes"
      | "thumbnail"
      | "trigger"
      | "trigger.config"
      | "trigger.type"
      | "usageCount";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_category: ["category", "_creationTime"];
      by_creatorId: ["creatorId", "_creationTime"];
      by_public: ["isPublic", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
};

/**
 * The names of all of your Convex tables.
 */
export type TableNames = TableNamesInDataModel<DataModel>;

/**
 * The type of a document stored in Convex.
 *
 * @typeParam TableName - A string literal type of the table name (like "users").
 */
export type Doc<TableName extends TableNames> = DocumentByName<
  DataModel,
  TableName
>;

/**
 * An identifier for a document in Convex.
 *
 * Convex documents are uniquely identified by their `Id`, which is accessible
 * on the `_id` field. To learn more, see [Document IDs](https://docs.convex.dev/using/document-ids).
 *
 * Documents can be loaded using `db.get(tableName, id)` in query and mutation functions.
 *
 * IDs are just strings at runtime, but this type can be used to distinguish them from other
 * strings when type checking.
 *
 * @typeParam TableName - A string literal type of the table name (like "users").
 */
export type Id<TableName extends TableNames | SystemTableNames> =
  GenericId<TableName>;

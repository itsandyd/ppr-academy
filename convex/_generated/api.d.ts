/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as accessControl from "../accessControl.js";
import type * as achievements from "../achievements.js";
import type * as adminAnalytics from "../adminAnalytics.js";
import type * as adminEmailMonitoring from "../adminEmailMonitoring.js";
import type * as adminSetup from "../adminSetup.js";
import type * as affiliates from "../affiliates.js";
import type * as aiEmailGenerator from "../aiEmailGenerator.js";
import type * as analytics from "../analytics.js";
import type * as analyticsSchema from "../analyticsSchema.js";
import type * as analyticsTracking from "../analyticsTracking.js";
import type * as audioGeneration from "../audioGeneration.js";
import type * as audioGenerationNode from "../audioGenerationNode.js";
import type * as automation from "../automation.js";
import type * as automations from "../automations.js";
import type * as bundles from "../bundles.js";
import type * as certificates from "../certificates.js";
import type * as certificatesSchema from "../certificatesSchema.js";
import type * as clerkSync from "../clerkSync.js";
import type * as coachingDiscordActions from "../coachingDiscordActions.js";
import type * as coachingProducts from "../coachingProducts.js";
import type * as coachingSessionManager from "../coachingSessionManager.js";
import type * as coachingSessionQueries from "../coachingSessionQueries.js";
import type * as collaborativeNotes from "../collaborativeNotes.js";
import type * as contentGeneration from "../contentGeneration.js";
import type * as coupons from "../coupons.js";
import type * as courseNotificationQueries from "../courseNotificationQueries.js";
import type * as courseNotifications from "../courseNotifications.js";
import type * as courses from "../courses.js";
import type * as credits from "../credits.js";
import type * as crons from "../crons.js";
import type * as customDomains from "../customDomains.js";
import type * as customers from "../customers.js";
import type * as debug_checkEnrollments from "../debug/checkEnrollments.js";
import type * as debug from "../debug.js";
import type * as debugFix from "../debugFix.js";
import type * as devSeeders from "../devSeeders.js";
import type * as digitalProducts from "../digitalProducts.js";
import type * as discord from "../discord.js";
import type * as discordInternal from "../discordInternal.js";
import type * as discordPublic from "../discordPublic.js";
import type * as discordSchema from "../discordSchema.js";
import type * as domainVerification from "../domainVerification.js";
import type * as emailABTesting from "../emailABTesting.js";
import type * as emailAnalyticsRollup from "../emailAnalyticsRollup.js";
import type * as emailCampaigns from "../emailCampaigns.js";
import type * as emailCopyGenerator from "../emailCopyGenerator.js";
import type * as emailDomainSchema from "../emailDomainSchema.js";
import type * as emailHealthMonitoring from "../emailHealthMonitoring.js";
import type * as emailLeadScoring from "../emailLeadScoring.js";
import type * as emailQueries from "../emailQueries.js";
import type * as emailRepliesSchema from "../emailRepliesSchema.js";
import type * as emailSchema from "../emailSchema.js";
import type * as emailSegmentation from "../emailSegmentation.js";
import type * as emailSpamScoring from "../emailSpamScoring.js";
import type * as emailTemplates from "../emailTemplates.js";
import type * as emailWorkflows from "../emailWorkflows.js";
import type * as emails from "../emails.js";
import type * as embeddingActions from "../embeddingActions.js";
import type * as embeddings from "../embeddings.js";
import type * as fanCountAggregation from "../fanCountAggregation.js";
import type * as files from "../files.js";
import type * as followGateSubmissions from "../followGateSubmissions.js";
import type * as http from "../http.js";
import type * as importFans from "../importFans.js";
import type * as inboxActions from "../inboxActions.js";
import type * as inboxHelpers from "../inboxHelpers.js";
import type * as inboxQueries from "../inboxQueries.js";
import type * as inboxSync from "../inboxSync.js";
import type * as integrations_instagram from "../integrations/instagram.js";
import type * as integrations_internal from "../integrations/internal.js";
import type * as integrations_queries from "../integrations/queries.js";
import type * as leadSubmissions from "../leadSubmissions.js";
import type * as leaderboards from "../leaderboards.js";
import type * as library from "../library.js";
import type * as liveViewers from "../liveViewers.js";
import type * as marketplace from "../marketplace.js";
import type * as migrations_backfillCourseCustomers from "../migrations/backfillCourseCustomers.js";
import type * as migrations_backfillCustomers from "../migrations/backfillCustomers.js";
import type * as monetizationSchema from "../monetizationSchema.js";
import type * as monetizationUtils from "../monetizationUtils.js";
import type * as musicShowcase from "../musicShowcase.js";
import type * as noteTemplates from "../noteTemplates.js";
import type * as notes from "../notes.js";
import type * as notesToCourse from "../notesToCourse.js";
import type * as notificationPreferences from "../notificationPreferences.js";
import type * as notifications from "../notifications.js";
import type * as paymentPlans from "../paymentPlans.js";
import type * as playlists from "../playlists.js";
import type * as qa from "../qa.js";
import type * as qaSchema from "../qaSchema.js";
import type * as quizzes from "../quizzes.js";
import type * as quizzesSchema from "../quizzesSchema.js";
import type * as rag from "../rag.js";
import type * as ragActions from "../ragActions.js";
import type * as recommendations from "../recommendations.js";
import type * as reports from "../reports.js";
import type * as resendDomainHelpers from "../resendDomainHelpers.js";
import type * as resendDomainSync from "../resendDomainSync.js";
import type * as sampleGeneration from "../sampleGeneration.js";
import type * as samplePacks from "../samplePacks.js";
import type * as samples from "../samples.js";
import type * as seedCreditPackages from "../seedCreditPackages.js";
import type * as sendTimeOptimization from "../sendTimeOptimization.js";
import type * as socialMedia from "../socialMedia.js";
import type * as socialMediaActions from "../socialMediaActions.js";
import type * as stores from "../stores.js";
import type * as submissions from "../submissions.js";
import type * as subscriptions from "../subscriptions.js";
import type * as tracks from "../tracks.js";
import type * as userLibrary from "../userLibrary.js";
import type * as users from "../users.js";
import type * as vercelDomainManager from "../vercelDomainManager.js";
import type * as webhooks_instagram from "../webhooks/instagram.js";
import type * as webhooks_stripe from "../webhooks/stripe.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  accessControl: typeof accessControl;
  achievements: typeof achievements;
  adminAnalytics: typeof adminAnalytics;
  adminEmailMonitoring: typeof adminEmailMonitoring;
  adminSetup: typeof adminSetup;
  affiliates: typeof affiliates;
  aiEmailGenerator: typeof aiEmailGenerator;
  analytics: typeof analytics;
  analyticsSchema: typeof analyticsSchema;
  analyticsTracking: typeof analyticsTracking;
  audioGeneration: typeof audioGeneration;
  audioGenerationNode: typeof audioGenerationNode;
  automation: typeof automation;
  automations: typeof automations;
  bundles: typeof bundles;
  certificates: typeof certificates;
  certificatesSchema: typeof certificatesSchema;
  clerkSync: typeof clerkSync;
  coachingDiscordActions: typeof coachingDiscordActions;
  coachingProducts: typeof coachingProducts;
  coachingSessionManager: typeof coachingSessionManager;
  coachingSessionQueries: typeof coachingSessionQueries;
  collaborativeNotes: typeof collaborativeNotes;
  contentGeneration: typeof contentGeneration;
  coupons: typeof coupons;
  courseNotificationQueries: typeof courseNotificationQueries;
  courseNotifications: typeof courseNotifications;
  courses: typeof courses;
  credits: typeof credits;
  crons: typeof crons;
  customDomains: typeof customDomains;
  customers: typeof customers;
  "debug/checkEnrollments": typeof debug_checkEnrollments;
  debug: typeof debug;
  debugFix: typeof debugFix;
  devSeeders: typeof devSeeders;
  digitalProducts: typeof digitalProducts;
  discord: typeof discord;
  discordInternal: typeof discordInternal;
  discordPublic: typeof discordPublic;
  discordSchema: typeof discordSchema;
  domainVerification: typeof domainVerification;
  emailABTesting: typeof emailABTesting;
  emailAnalyticsRollup: typeof emailAnalyticsRollup;
  emailCampaigns: typeof emailCampaigns;
  emailCopyGenerator: typeof emailCopyGenerator;
  emailDomainSchema: typeof emailDomainSchema;
  emailHealthMonitoring: typeof emailHealthMonitoring;
  emailLeadScoring: typeof emailLeadScoring;
  emailQueries: typeof emailQueries;
  emailRepliesSchema: typeof emailRepliesSchema;
  emailSchema: typeof emailSchema;
  emailSegmentation: typeof emailSegmentation;
  emailSpamScoring: typeof emailSpamScoring;
  emailTemplates: typeof emailTemplates;
  emailWorkflows: typeof emailWorkflows;
  emails: typeof emails;
  embeddingActions: typeof embeddingActions;
  embeddings: typeof embeddings;
  fanCountAggregation: typeof fanCountAggregation;
  files: typeof files;
  followGateSubmissions: typeof followGateSubmissions;
  http: typeof http;
  importFans: typeof importFans;
  inboxActions: typeof inboxActions;
  inboxHelpers: typeof inboxHelpers;
  inboxQueries: typeof inboxQueries;
  inboxSync: typeof inboxSync;
  "integrations/instagram": typeof integrations_instagram;
  "integrations/internal": typeof integrations_internal;
  "integrations/queries": typeof integrations_queries;
  leadSubmissions: typeof leadSubmissions;
  leaderboards: typeof leaderboards;
  library: typeof library;
  liveViewers: typeof liveViewers;
  marketplace: typeof marketplace;
  "migrations/backfillCourseCustomers": typeof migrations_backfillCourseCustomers;
  "migrations/backfillCustomers": typeof migrations_backfillCustomers;
  monetizationSchema: typeof monetizationSchema;
  monetizationUtils: typeof monetizationUtils;
  musicShowcase: typeof musicShowcase;
  noteTemplates: typeof noteTemplates;
  notes: typeof notes;
  notesToCourse: typeof notesToCourse;
  notificationPreferences: typeof notificationPreferences;
  notifications: typeof notifications;
  paymentPlans: typeof paymentPlans;
  playlists: typeof playlists;
  qa: typeof qa;
  qaSchema: typeof qaSchema;
  quizzes: typeof quizzes;
  quizzesSchema: typeof quizzesSchema;
  rag: typeof rag;
  ragActions: typeof ragActions;
  recommendations: typeof recommendations;
  reports: typeof reports;
  resendDomainHelpers: typeof resendDomainHelpers;
  resendDomainSync: typeof resendDomainSync;
  sampleGeneration: typeof sampleGeneration;
  samplePacks: typeof samplePacks;
  samples: typeof samples;
  seedCreditPackages: typeof seedCreditPackages;
  sendTimeOptimization: typeof sendTimeOptimization;
  socialMedia: typeof socialMedia;
  socialMediaActions: typeof socialMediaActions;
  stores: typeof stores;
  submissions: typeof submissions;
  subscriptions: typeof subscriptions;
  tracks: typeof tracks;
  userLibrary: typeof userLibrary;
  users: typeof users;
  vercelDomainManager: typeof vercelDomainManager;
  "webhooks/instagram": typeof webhooks_instagram;
  "webhooks/stripe": typeof webhooks_stripe;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

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
import type * as adminSetup from "../adminSetup.js";
import type * as affiliates from "../affiliates.js";
import type * as aiEmailGenerator from "../aiEmailGenerator.js";
import type * as analytics from "../analytics.js";
import type * as analyticsSchema from "../analyticsSchema.js";
import type * as analyticsTracking from "../analyticsTracking.js";
import type * as audioGeneration from "../audioGeneration.js";
import type * as audioGenerationNode from "../audioGenerationNode.js";
import type * as automation from "../automation.js";
import type * as bundles from "../bundles.js";
import type * as certificates from "../certificates.js";
import type * as certificatesSchema from "../certificatesSchema.js";
import type * as clerkSync from "../clerkSync.js";
import type * as coachingDiscordActions from "../coachingDiscordActions.js";
import type * as coachingProducts from "../coachingProducts.js";
import type * as coachingSessionManager from "../coachingSessionManager.js";
import type * as coachingSessionQueries from "../coachingSessionQueries.js";
import type * as coupons from "../coupons.js";
import type * as courses from "../courses.js";
import type * as credits from "../credits.js";
import type * as crons from "../crons.js";
import type * as customers from "../customers.js";
import type * as debug from "../debug.js";
import type * as debugFix from "../debugFix.js";
import type * as digitalProducts from "../digitalProducts.js";
import type * as discord from "../discord.js";
import type * as discordInternal from "../discordInternal.js";
import type * as discordPublic from "../discordPublic.js";
import type * as discordSchema from "../discordSchema.js";
import type * as emailABTesting from "../emailABTesting.js";
import type * as emailCampaigns from "../emailCampaigns.js";
import type * as emailHealthMonitoring from "../emailHealthMonitoring.js";
import type * as emailLeadScoring from "../emailLeadScoring.js";
import type * as emailQueries from "../emailQueries.js";
import type * as emailSchema from "../emailSchema.js";
import type * as emailSegmentation from "../emailSegmentation.js";
import type * as emailSpamScoring from "../emailSpamScoring.js";
import type * as emailWorkflows from "../emailWorkflows.js";
import type * as emails from "../emails.js";
import type * as embeddingActions from "../embeddingActions.js";
import type * as embeddings from "../embeddings.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as leadSubmissions from "../leadSubmissions.js";
import type * as leaderboards from "../leaderboards.js";
import type * as library from "../library.js";
import type * as marketplace from "../marketplace.js";
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
  adminSetup: typeof adminSetup;
  affiliates: typeof affiliates;
  aiEmailGenerator: typeof aiEmailGenerator;
  analytics: typeof analytics;
  analyticsSchema: typeof analyticsSchema;
  analyticsTracking: typeof analyticsTracking;
  audioGeneration: typeof audioGeneration;
  audioGenerationNode: typeof audioGenerationNode;
  automation: typeof automation;
  bundles: typeof bundles;
  certificates: typeof certificates;
  certificatesSchema: typeof certificatesSchema;
  clerkSync: typeof clerkSync;
  coachingDiscordActions: typeof coachingDiscordActions;
  coachingProducts: typeof coachingProducts;
  coachingSessionManager: typeof coachingSessionManager;
  coachingSessionQueries: typeof coachingSessionQueries;
  coupons: typeof coupons;
  courses: typeof courses;
  credits: typeof credits;
  crons: typeof crons;
  customers: typeof customers;
  debug: typeof debug;
  debugFix: typeof debugFix;
  digitalProducts: typeof digitalProducts;
  discord: typeof discord;
  discordInternal: typeof discordInternal;
  discordPublic: typeof discordPublic;
  discordSchema: typeof discordSchema;
  emailABTesting: typeof emailABTesting;
  emailCampaigns: typeof emailCampaigns;
  emailHealthMonitoring: typeof emailHealthMonitoring;
  emailLeadScoring: typeof emailLeadScoring;
  emailQueries: typeof emailQueries;
  emailSchema: typeof emailSchema;
  emailSegmentation: typeof emailSegmentation;
  emailSpamScoring: typeof emailSpamScoring;
  emailWorkflows: typeof emailWorkflows;
  emails: typeof emails;
  embeddingActions: typeof embeddingActions;
  embeddings: typeof embeddings;
  files: typeof files;
  http: typeof http;
  leadSubmissions: typeof leadSubmissions;
  leaderboards: typeof leaderboards;
  library: typeof library;
  marketplace: typeof marketplace;
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
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

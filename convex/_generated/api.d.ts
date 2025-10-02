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
import type * as analytics from "../analytics.js";
import type * as analyticsTracking from "../analyticsTracking.js";
import type * as audioGeneration from "../audioGeneration.js";
import type * as courses from "../courses.js";
import type * as credits from "../credits.js";
import type * as customers from "../customers.js";
import type * as digitalProducts from "../digitalProducts.js";
import type * as emailCampaigns from "../emailCampaigns.js";
import type * as emailWorkflows from "../emailWorkflows.js";
import type * as emails from "../emails.js";
import type * as embeddingActions from "../embeddingActions.js";
import type * as embeddings from "../embeddings.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as leadSubmissions from "../leadSubmissions.js";
import type * as library from "../library.js";
import type * as musicShowcase from "../musicShowcase.js";
import type * as rag from "../rag.js";
import type * as ragActions from "../ragActions.js";
import type * as samplePacks from "../samplePacks.js";
import type * as samples from "../samples.js";
import type * as seedCreditPackages from "../seedCreditPackages.js";
import type * as stores from "../stores.js";
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
  analytics: typeof analytics;
  analyticsTracking: typeof analyticsTracking;
  audioGeneration: typeof audioGeneration;
  courses: typeof courses;
  credits: typeof credits;
  customers: typeof customers;
  digitalProducts: typeof digitalProducts;
  emailCampaigns: typeof emailCampaigns;
  emailWorkflows: typeof emailWorkflows;
  emails: typeof emails;
  embeddingActions: typeof embeddingActions;
  embeddings: typeof embeddings;
  files: typeof files;
  http: typeof http;
  leadSubmissions: typeof leadSubmissions;
  library: typeof library;
  musicShowcase: typeof musicShowcase;
  rag: typeof rag;
  ragActions: typeof ragActions;
  samplePacks: typeof samplePacks;
  samples: typeof samples;
  seedCreditPackages: typeof seedCreditPackages;
  stores: typeof stores;
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

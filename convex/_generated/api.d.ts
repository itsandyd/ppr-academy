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
import type * as audioGeneration from "../audioGeneration.js";
import type * as courses from "../courses.js";
import type * as customers from "../customers.js";
import type * as digitalProducts from "../digitalProducts.js";
import type * as emailCampaigns from "../emailCampaigns.js";
import type * as emailWorkflows from "../emailWorkflows.js";
import type * as emails from "../emails.js";
import type * as files from "../files.js";
import type * as leadSubmissions from "../leadSubmissions.js";
import type * as library from "../library.js";
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
  audioGeneration: typeof audioGeneration;
  courses: typeof courses;
  customers: typeof customers;
  digitalProducts: typeof digitalProducts;
  emailCampaigns: typeof emailCampaigns;
  emailWorkflows: typeof emailWorkflows;
  emails: typeof emails;
  files: typeof files;
  leadSubmissions: typeof leadSubmissions;
  library: typeof library;
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

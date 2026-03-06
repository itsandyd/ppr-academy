/**
 * Meta/Facebook Graph API constants for Next.js routes.
 * Keep in sync with convex/lib/constants.ts.
 */

/** Meta/Facebook Graph API version used across all endpoints. */
export const META_API_VERSION = "v21.0";

/** Base URL for Facebook Graph API calls. */
export const META_GRAPH_URL = `https://graph.facebook.com/${META_API_VERSION}`;

/** Base URL for Facebook OAuth dialog. */
export const META_OAUTH_DIALOG_URL = `https://www.facebook.com/${META_API_VERSION}/dialog/oauth`;

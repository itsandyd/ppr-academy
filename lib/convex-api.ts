/**
 * Helper module to work around TypeScript's "Type instantiation is excessively deep" error
 * with large Convex APIs.
 *
 * Re-exports the api and internal objects typed as `any` to avoid deep type instantiation
 * in consuming files. Individual call sites should cast to specific types as needed.
 */

import { api as _api, internal as _internal } from "@/convex/_generated/api";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const api = _api as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const internal = _internal as any;

/**
 * Auth Helpers Tests
 *
 * Tests the Convex-side auth helpers at convex/lib/auth.ts:
 *   - requireAuth: throws when not authenticated, returns identity when authenticated
 *   - requireStoreOwner: verifies store ownership via Convex ID or Clerk ID fallback
 *
 * Strategy: We mock the Convex QueryCtx/MutationCtx shape and exercise the
 * actual business logic that the helpers enforce.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockCtx, buildStore, buildUser } from "./helpers/factories";

// ---- Tests ----

describe("requireAuth", () => {
  let requireAuth: typeof import("../convex/lib/auth").requireAuth;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("../convex/lib/auth");
    requireAuth = mod.requireAuth;
  });

  it("returns identity when authenticated", async () => {
    const mockIdentity = {
      subject: "user_clerk_abc",
      issuer: "https://clerk.dev",
      tokenIdentifier: "https://clerk.dev|user_clerk_abc",
    };

    const ctx = createMockCtx({
      auth: {
        getUserIdentity: vi.fn().mockResolvedValue(mockIdentity),
      },
    });

    const identity = await requireAuth(ctx as any);
    expect(identity).toEqual(mockIdentity);
    expect(identity.subject).toBe("user_clerk_abc");
  });

  it("throws when not authenticated", async () => {
    const ctx = createMockCtx({
      auth: {
        getUserIdentity: vi.fn().mockResolvedValue(null),
      },
    });

    await expect(requireAuth(ctx as any)).rejects.toThrow("Not authenticated");
  });

  it("calls getUserIdentity exactly once", async () => {
    const getUserIdentity = vi.fn().mockResolvedValue({
      subject: "user_clerk_abc",
      tokenIdentifier: "test",
    });

    const ctx = createMockCtx({
      auth: { getUserIdentity },
    });

    await requireAuth(ctx as any);
    expect(getUserIdentity).toHaveBeenCalledTimes(1);
  });
});

describe("requireStoreOwner", () => {
  let requireStoreOwner: typeof import("../convex/lib/auth").requireStoreOwner;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("../convex/lib/auth");
    requireStoreOwner = mod.requireStoreOwner;
  });

  it("passes when user owns store via Convex ID", async () => {
    const store = buildStore({ userId: "user_clerk_abc" });
    const mockIdentity = {
      subject: "user_clerk_abc",
      tokenIdentifier: "test",
    };

    const ctx = createMockCtx({
      auth: {
        getUserIdentity: vi.fn().mockResolvedValue(mockIdentity),
      },
      db: {
        query: vi.fn().mockReturnValue({
          filter: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue(store), // Found by _id
          }),
          withIndex: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue(null),
          }),
        }),
      },
    });

    const result = await requireStoreOwner(ctx as any, store._id);
    expect(result.identity).toEqual(mockIdentity);
    expect(result.store).toEqual(store);
  });

  it("passes when user owns store via Clerk ID fallback", async () => {
    const store = buildStore({ userId: "user_clerk_abc" });
    const mockIdentity = {
      subject: "user_clerk_abc",
      tokenIdentifier: "test",
    };

    // First filter lookup returns null (_id lookup fails), then withIndex lookup succeeds
    const mockQuery = vi.fn().mockReturnValue({
      filter: vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue(null), // Not found by _id
      }),
      withIndex: vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue(store), // Found by userId
      }),
    });

    const ctx = createMockCtx({
      auth: {
        getUserIdentity: vi.fn().mockResolvedValue(mockIdentity),
      },
      db: { query: mockQuery },
    });

    const result = await requireStoreOwner(ctx as any, "user_clerk_abc");
    expect(result.store.userId).toBe("user_clerk_abc");
  });

  it("throws when not authenticated", async () => {
    const ctx = createMockCtx({
      auth: {
        getUserIdentity: vi.fn().mockResolvedValue(null),
      },
    });

    await expect(
      requireStoreOwner(ctx as any, "store_test_123" as any)
    ).rejects.toThrow("Not authenticated");
  });

  it("throws when store not found", async () => {
    const mockIdentity = {
      subject: "user_clerk_abc",
      tokenIdentifier: "test",
    };

    const mockQuery = vi.fn().mockReturnValue({
      filter: vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue(null),
      }),
      withIndex: vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue(null),
      }),
    });

    const ctx = createMockCtx({
      auth: {
        getUserIdentity: vi.fn().mockResolvedValue(mockIdentity),
      },
      db: { query: mockQuery },
    });

    await expect(
      requireStoreOwner(ctx as any, "nonexistent_store" as any)
    ).rejects.toThrow("Store not found");
  });

  it("throws when user doesn't own store", async () => {
    const store = buildStore({ userId: "other_user_clerk" });
    const mockIdentity = {
      subject: "user_clerk_abc", // Different from store.userId
      tokenIdentifier: "test",
    };

    const mockQuery = vi.fn().mockReturnValue({
      filter: vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue(store),
      }),
      withIndex: vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue(null),
      }),
    });

    const ctx = createMockCtx({
      auth: {
        getUserIdentity: vi.fn().mockResolvedValue(mockIdentity),
      },
      db: { query: mockQuery },
    });

    await expect(
      requireStoreOwner(ctx as any, store._id)
    ).rejects.toThrow("Unauthorized: you don't own this store");
  });

  it("returns both identity and store on success", async () => {
    const store = buildStore({ userId: "user_clerk_abc" });
    const mockIdentity = {
      subject: "user_clerk_abc",
      tokenIdentifier: "test",
    };

    const ctx = createMockCtx({
      auth: {
        getUserIdentity: vi.fn().mockResolvedValue(mockIdentity),
      },
      db: {
        query: vi.fn().mockReturnValue({
          filter: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue(store),
          }),
          withIndex: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue(null),
          }),
        }),
      },
    });

    const result = await requireStoreOwner(ctx as any, store._id);
    expect(result).toHaveProperty("identity");
    expect(result).toHaveProperty("store");
    expect(result.identity.subject).toBe("user_clerk_abc");
    expect(result.store._id).toBe(store._id);
  });
});

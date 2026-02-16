/**
 * Test Data Factories
 *
 * Type-safe factory functions that return properly shaped mock objects
 * matching the Convex schema. Each factory provides sensible defaults
 * that can be overridden per-test.
 *
 * Usage:
 *   const user = buildUser({ email: "custom@test.com" });
 *   const course = buildCourse({ price: 0, isPublished: false });
 */
import { vi } from "vitest";
import type { Id } from "../../convex/_generated/dataModel";

// ---- Factory Helper ----

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

function buildFactory<T extends Record<string, any>>(defaults: T) {
  return (overrides: DeepPartial<T> = {}): T => ({
    ...defaults,
    ...overrides,
  });
}

// ---- Core Factories ----

export const buildUser = buildFactory({
  _id: "user_test_123" as Id<"users">,
  _creationTime: Date.now(),
  clerkId: "user_clerk_abc",
  email: "test@example.com",
  firstName: "Test",
  lastName: "User",
  name: "Test User",
  admin: false,
  dashboardPreference: "learn" as "learn" | "create",
  isCreator: false,
});

export const buildStore = buildFactory({
  _id: "store_test_123" as Id<"stores">,
  _creationTime: Date.now(),
  userId: "user_clerk_abc",
  name: "Test Store",
  slug: "test-store",
  description: "A test store",
  isPublic: true,
  isPublishedProfile: true,
  plan: "free" as const,
});

export const buildCourse = buildFactory({
  _id: "course_test_123" as Id<"courses">,
  _creationTime: Date.now(),
  userId: "user_clerk_abc",
  title: "Test Course",
  slug: "test-course",
  description: "A test course",
  price: 2999,
  isPublished: true,
});

export const buildDigitalProduct = buildFactory({
  _id: "product_test_123" as Id<"digitalProducts">,
  _creationTime: Date.now(),
  storeId: "store_test_123",
  userId: "user_clerk_abc",
  title: "Test Sample Pack",
  slug: "test-sample-pack",
  description: "A test product",
  price: 1499,
  isPublished: true,
  productType: "digital" as const,
  productCategory: "sample-pack" as const,
});

export const buildEnrollment = buildFactory({
  _id: "enrollment_test_123" as Id<"enrollments">,
  _creationTime: Date.now(),
  userId: "user_clerk_abc",
  courseId: "course_test_123",
  progress: 0,
});

export const buildPurchase = buildFactory({
  _id: "purchase_test_123" as Id<"purchases">,
  _creationTime: Date.now(),
  userId: "user_clerk_abc",
  storeId: "store_test_123",
  adminUserId: "user_clerk_abc",
  amount: 2999,
  currency: "usd",
  status: "completed" as const,
  paymentMethod: "stripe",
  transactionId: "pi_test_123",
  productType: "course" as const,
  accessGranted: true,
  downloadCount: 0,
});

// ---- Specialized Builders ----

export const buildAdminUser = (overrides: DeepPartial<ReturnType<typeof buildUser>> = {}) =>
  buildUser({ admin: true, email: "admin@pauseplayrepeat.com", ...overrides });

export const buildCreatorUser = (overrides: DeepPartial<ReturnType<typeof buildUser>> = {}) =>
  buildUser({ isCreator: true, dashboardPreference: "create", ...overrides });

export const buildFreeCourse = (overrides: DeepPartial<ReturnType<typeof buildCourse>> = {}) =>
  buildCourse({ price: 0, ...overrides });

export const buildUnpublishedCourse = (overrides: DeepPartial<ReturnType<typeof buildCourse>> = {}) =>
  buildCourse({ isPublished: false, ...overrides });

// ---- Stripe / Webhook Factories ----

export const buildStripeEvent = buildFactory({
  id: `evt_test_${Date.now()}`,
  type: "checkout.session.completed",
  data: {
    object: {} as Record<string, any>,
  },
});

export const buildCheckoutSession = buildFactory({
  id: `cs_test_${Date.now()}`,
  mode: "payment" as string,
  amount_total: 2999,
  currency: "usd",
  payment_intent: "pi_test123",
  subscription: null as string | null,
  customer_details: {
    email: "buyer@test.com",
    name: "Test Buyer",
  },
  metadata: {} as Record<string, string>,
});

export const buildCourseCheckoutMetadata = buildFactory({
  productType: "course",
  userId: "user_clerk123",
  courseId: "course_abc",
  amount: "2999",
  currency: "usd",
  courseTitle: "Test Course",
  customerEmail: "buyer@test.com",
  customerName: "Test Buyer",
});

export const buildDigitalProductCheckoutMetadata = buildFactory({
  productType: "digitalProduct",
  userId: "user_clerk456",
  productId: "product_xyz",
  amount: "1499",
  currency: "usd",
  productTitle: "Lo-Fi Sample Pack",
  customerEmail: "buyer@test.com",
  customerName: "Test Buyer",
});

export const buildPprProCheckoutMetadata = buildFactory({
  productType: "ppr_pro",
  userId: "user_clerk789",
  plan: "monthly",
  customerEmail: "pro@test.com",
  customerName: "Pro User",
});

export const buildBundleCheckoutMetadata = buildFactory({
  productType: "bundle",
  userId: "user_clerk123",
  bundleId: "bundle_abc",
  amount: "4999",
  currency: "usd",
  bundleTitle: "Producer Starter Kit",
  itemCount: "3",
  customerEmail: "buyer@test.com",
  customerName: "Test Buyer",
});

export const buildStripeSubscription = buildFactory({
  id: "sub_test123",
  customer: "cus_test123",
  current_period_start: Math.floor(Date.now() / 1000),
  current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400,
  status: "active",
  metadata: {} as Record<string, string>,
  items: { data: [{ price: { recurring: { interval: "month" } } }] },
});

// ---- Purchase Record Factories (for access/logic tests) ----

export const buildCoursePurchaseRecord = buildFactory({
  userId: "user_clerk123",
  courseId: "course_abc",
  amount: 2999,
  currency: "USD",
  status: "completed" as const,
  paymentMethod: "stripe",
  transactionId: "pi_test123",
  productType: "course" as const,
  accessGranted: true,
  downloadCount: 0,
  lastAccessedAt: Date.now(),
});

export const buildDigitalProductPurchaseRecord = buildFactory({
  userId: "user_clerk456",
  productId: "product_xyz",
  amount: 1499,
  currency: "USD",
  status: "completed" as const,
  paymentMethod: "stripe",
  transactionId: "pi_test456",
  productType: "digitalProduct" as const,
  accessGranted: true,
  downloadCount: 0,
  lastAccessedAt: Date.now(),
});

export const buildSubscriptionRecord = buildFactory({
  userId: "user_clerk789",
  plan: "monthly" as const,
  stripeSubscriptionId: "sub_test123",
  stripeCustomerId: "cus_test123",
  currentPeriodStart: Date.now(),
  currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000,
  status: "active" as const,
  cancelAtPeriodEnd: false,
  createdAt: Date.now(),
});

// ---- Mock Context Builder ----

export function createMockCtx(overrides: any = {}) {
  return {
    auth: {
      getUserIdentity: vi.fn().mockResolvedValue(null),
      ...overrides.auth,
    },
    db: {
      get: vi.fn().mockResolvedValue(null),
      query: vi.fn().mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(null),
          collect: vi.fn().mockResolvedValue([]),
          filter: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue(null),
            collect: vi.fn().mockResolvedValue([]),
          }),
        }),
        filter: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(null),
          collect: vi.fn().mockResolvedValue([]),
        }),
        collect: vi.fn().mockResolvedValue([]),
        first: vi.fn().mockResolvedValue(null),
      }),
      insert: vi.fn().mockResolvedValue("new_id_123"),
      patch: vi.fn().mockResolvedValue(null),
      delete: vi.fn().mockResolvedValue(null),
      ...overrides.db,
    },
    ...overrides,
  };
}

// ---- Mock Request Builder ----

export function createMockRequest(body: string = "{}"): any {
  return {
    text: vi.fn().mockResolvedValue(body),
  };
}

// ---- Convex API Proxy ----

export function createApiProxy(path: string[] = []): any {
  const pathStr = path.join(".");
  return new Proxy(function () {} as any, {
    get(_, prop) {
      if (typeof prop === "symbol") {
        if (prop === Symbol.toPrimitive) return () => pathStr;
        if (prop === Symbol.toStringTag) return pathStr;
        return undefined;
      }
      if (prop === "toString") return () => pathStr;
      if (prop === "_name") return pathStr;
      return createApiProxy([...path, prop]);
    },
  });
}
